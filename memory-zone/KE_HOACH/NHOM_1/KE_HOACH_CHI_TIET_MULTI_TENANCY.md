# KẾ HOẠCH CHI TIẾT TRIỂN KHAI MULTI-TENANCY CHO VIETSALE PRO

> **Ngày lập:** 2026-07-04  
> **Dựa trên:** `KE_HOACH_TONG_HOP_DA_DUYET.md`  
> **Mục tiêu:** Biến VietSale Pro từ phần mềm 1 cửa hàng thành SaaS multi-tenant bền vững 10–20 năm, không phá vỡ logic nghiệp vụ hiện có.

---

## 1. Hiện trạng đã xác nhận (baseline)

| Mục | Thực tế |
|---|---|
| **Stack** | React 19 + Vite 6 + TypeScript 5.8 + Tailwind 4 + Supabase JS v2.97 |
| **Kiến trúc DB** | 1 project Supabase `QLBH` (`rsialbfjswnrkzcxarnj`), 1 schema `public`, 42 bảng kinh doanh |
| **Bảng chính** | `products`, `customers`, `suppliers`, `orders`, `order_items`, `import_receipts`, `import_items`, `return_orders`, `return_order_items`, `inventory_counts`, `inventory_count_items`, `inventory_movements`, `disposals`, `disposal_items`, `supplier_exchanges`, `supplier_exchange_return_items`, `supplier_exchange_received_items`, `product_lots`, `stock_movements`, `promotions`, `rank_configs`, `rank_history`, `rewards`, `point_history`, `app_settings`, `einvoice_config`, `einvoice_orders`, `customer_payment_ledger`, `supplier_payment_ledger`, `processed_operations` |
| **Bảo mật** | Gần như 100% bảng có policy `public`/`anon` ALL = `true`. RLS tồn tại nhưng bị vô hiệu hóa bởi policy public. |
| **Auth** | Supabase Auth, đăng nhập email/password, chưa có phân biệt tenant/role |
| **Offline** | IndexedDB queue, PWA, `processed_operations` idempotency |
| **Tên miền** | Chưa có cơ chế subdomain |
| **Code style** | TypeScript `strict` chưa bật, `lint` chỉ là `tsc --noEmit` |

---

## 2. Nguyên tắc thiết kế multi-tenancy

| Quyết định | Lý do |
|---|---|
| **Shared DB + `tenant_id` + RLS** | Không tách database/schema — đơn giản vận hành, chi phí thấp, backup đơn giản |
| **Subdomain = định danh tenant duy nhất** | `ten-cuahang.vietsalepro.com` → lookup `tenants.subdomain` → `tenant_id` |
| **`auth.users` global** | Supabase Auth vẫn là nguồn user duy nhất |
| **Role lưu ở `tenant_memberships`** | Không đụng `raw_user_meta_data` |
| **RLS policies kiểm tra tenant + role** | `tenant_id = current_tenant_id()` AND `user có role phù hợp với tenant` |
| **Service layer tự động gắn `tenant_id`** | Mọi `supabase.from(...).insert(...)` đều inject `tenant_id` |
| **RPC/Edge Functions tự xác định tenant** | Từ `request.headers.get('x-tenant-id')` hoặc `subdomain` |

---

## 3. Kế hoạch chi tiết từng phase

> **Ghi chú thống nhất:** File này chia nhỏ thành 18 phase để triển khai chi tiết. File `KE_HOACH_BAO_MAT_MULTI_TENANCY.md` tóm tắt thành 11 phase tổng quan. Nội dung tương đương, chỉ khác mức độ chi tiết.

### Phase 0: Chuẩn bị môi trường & backup

**Mục tiêu:** Có nơi test an toàn, production được backup, CI pass.

| Bước | Cách làm | Output |
|---|---|---|
| 0.1 Tạo staging project | Dùng Supabase MCP `create_project` trong cùng org `ycvyvliijnlcetxzxrrk`, region `ap-northeast-1` | Project staging riêng |
| 0.2 Mirror dữ liệu staging | `supabase db dump` (Supabase CLI) → restore vào staging | Staging có dữ liệu giống production |
| 0.3 Tạo nhánh git | `git checkout -b multi-tenant` từ `main` | Code isolation |
| 0.4 Thêm env staging | `.env.staging` với `VITE_SUPABASE_URL_STAGING`, `VITE_SUPABASE_ANON_KEY_STAGING` | Chạy staging mode |
| 0.5 Backup production | Supabase dashboard backup hoặc `supabase db dump` | File backup timestamped |
| 0.6 Đảm bảo lint/build pass | `npm run lint` + `npm run build` | Build xanh |

**Lưu ý:** Không viết code nghiệp vụ mới trong phase này.

---

### Phase 1: Dọn dẹp bảo mật hiện tại

**Mục tiêu:** Xóa policy public, tắt self-registration, đóng social providers.

**Database:**
```sql
-- Xóa tất cả policy public/anon trên bảng kinh doanh
DROP POLICY IF EXISTS "Allow public access" ON public.products;
DROP POLICY IF EXISTS "Public Access" ON public.products;
-- Lặp lại cho tất cả bảng kinh doanh

-- Policy tạm thời cho authenticated toàn quyền
CREATE POLICY "authenticated_full_access_temp"
ON public.products FOR ALL
TO authenticated
USING (true) WITH CHECK (true);
```

**Supabase Auth Settings:**
- Tắt `Enable new users` (self-registration)
- Xóa tất cả social providers
- `Site URL` và `Redirect URLs` chứa `*.vietsalepro.com`

**Code:**
- `Login.tsx`: giữ text "Liên hệ quản trị viên", không có link đăng ký
- Đảm bảo không có `VITE_SUPABASE_SERVICE_ROLE_KEY` trong `.env`

**Kiểm thử:**
- User đã đăng nhập vẫn thấy dữ liệu
- User chưa đăng nhập bị chặn
- `supabase.auth.signUp` bị từ chối

---

### Phase 2: Tạo foundation multi-tenancy

**Mục tiêu:** Có `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins`.

**Database:**
```sql
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','trial','pending')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','vip')),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','cashier','inventory_manager','accountant')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

CREATE TABLE public.tenant_subscriptions (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  max_users INTEGER NOT NULL DEFAULT 1,
  max_products INTEGER NOT NULL DEFAULT 50,
  max_orders_per_month INTEGER NOT NULL DEFAULT 300,
  current_month_orders INTEGER NOT NULL DEFAULT 0,
  current_month_start DATE NOT NULL DEFAULT CURRENT_DATE,
  billing_status TEXT DEFAULT 'ok',
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.system_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_memberships WHERE tenant_id = p_tenant_id AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_memberships WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(p_tenant_id UUID, p_role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_memberships WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = p_role);
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_by_subdomain(p_subdomain TEXT)
RETURNS public.tenants LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT * FROM public.tenants WHERE subdomain = p_subdomain LIMIT 1;
$$;
```

**RLS foundation:**
```sql
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_admin_view_own" ON public.tenants FOR SELECT TO authenticated
USING (id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid()) OR is_system_admin());

CREATE POLICY "system_admin_manage_tenants" ON public.tenants FOR ALL TO authenticated
USING (is_system_admin()) WITH CHECK (is_system_admin());
```

**Code:**
- `types/tenant.ts`: `Tenant`, `TenantMembership`, `TenantRole`, `TenantSubscription`
- `services/tenantService.ts`: `getTenantBySubdomain`, `getMembership`, `inviteMember`, `updateMemberRole`, `removeMember`

**Kiểm thử:**
- Tạo tenant, thêm member, phân role
- User A không thấy tenant của user B
- Admin có thể mời member

---

### Phase 3: Thêm `tenant_id` vào toàn bộ bảng kinh doanh

**Mục tiêu:** Mọi bảng dữ liệu cửa hàng có cột `tenant_id`.

**Danh sách bảng cần thêm:**
`app_settings`, `brands`, `categories`, `customers`, `customer_payment_ledger`, `disposal_items`, `disposals`, `einvoice_config`, `einvoice_orders`, `import_items`, `import_receipts`, `inventory_count_items`, `inventory_counts`, `inventory_movements`, `order_items`, `orders`, `point_history`, `processed_operations`, `product_lots`, `products`, `promotions`, `rank_configs`, `rank_history`, `return_order_items`, `return_orders`, `rewards`, `stock_movements`, `supplier_exchange_received_items`, `supplier_exchange_return_items`, `supplier_exchanges`, `suppliers`, `supplier_payment_ledger`.

**Database:**
```sql
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.products ADD CONSTRAINT products_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_products_tenant_id ON public.products(tenant_id);
-- Lặp lại cho tất cả các bảng trên
```

**Code:**
- Thêm `tenant_id` vào các interface trong `types.ts`
- Cập nhật mapper để đọc `tenant_id` nếu cần

---

### Phase 4: Backfill dữ liệu hiện có

**Mục tiêu:** Dữ liệu cũ thuộc về tenant đầu tiên, không còn record mồ côi.

**Database:**
```sql
-- Tạo tenant đầu tiên
-- owner_id để NULL trong migration; gán sau khi tạo admin user qua dashboard.
INSERT INTO public.tenants (id, name, subdomain, status, plan, owner_id)
SELECT gen_random_uuid(), 'Cửa hàng chính', 'main', 'active', 'vip', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tenants);

-- Tạo subscription VIP cho tenant đầu tiên
INSERT INTO public.tenant_subscriptions (tenant_id, plan, max_users, max_products, max_orders_per_month)
SELECT id, 'vip', 999, 999999, 999999
FROM public.tenants
WHERE subdomain = 'main'
ON CONFLICT (tenant_id) DO NOTHING;

-- Tất cả user hiện có trở thành admin của tenant đầu tiên
DO $$
DECLARE v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants WHERE subdomain = 'main';

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  SELECT v_tenant_id, id, 'admin'
  FROM auth.users
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
END $$;

-- Backfill
DO $$
DECLARE v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants WHERE subdomain = 'main';
  UPDATE public.app_settings SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.brands SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.categories SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.customers SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.customer_payment_ledger SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.disposal_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.disposals SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.einvoice_config SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.einvoice_orders SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.import_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.import_receipts SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.inventory_count_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.inventory_counts SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.inventory_movements SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.order_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.orders SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.point_history SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.processed_operations SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.product_lots SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.products SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.promotions SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.rank_configs SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.rank_history SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.return_order_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.return_orders SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.rewards SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.stock_movements SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.supplier_exchange_received_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.supplier_exchange_return_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.supplier_exchanges SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.suppliers SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.supplier_payment_ledger SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
END $$;

-- Set NOT NULL
ALTER TABLE public.products ALTER COLUMN tenant_id SET NOT NULL;
-- Lặp lại cho tất cả bảng

-- Backup record mồ côi trước khi xóa
CREATE TABLE IF NOT EXISTS public.orphan_records_backup (
  table_name TEXT,
  backed_up_at TIMESTAMPTZ DEFAULT now(),
  data JSONB
);

INSERT INTO public.orphan_records_backup (table_name, data)
SELECT 'order_items', to_jsonb(t.*) FROM public.order_items t WHERE order_id IS NULL;
INSERT INTO public.orphan_records_backup (table_name, data)
SELECT 'import_items', to_jsonb(t.*) FROM public.import_items t WHERE import_receipt_id IS NULL;
INSERT INTO public.orphan_records_backup (table_name, data)
SELECT 'product_lots', to_jsonb(t.*) FROM public.product_lots t WHERE product_id IS NULL;

-- Xóa record mồ côi
DELETE FROM public.order_items WHERE order_id IS NULL;
DELETE FROM public.import_items WHERE import_receipt_id IS NULL;
DELETE FROM public.product_lots WHERE product_id IS NULL;

-- Thêm FK còn thiếu
ALTER TABLE public.order_items ADD CONSTRAINT order_items_lot_id_fkey
  FOREIGN KEY (lot_id) REFERENCES public.product_lots(id);
ALTER TABLE public.return_order_items ADD CONSTRAINT return_order_items_lot_id_fkey
  FOREIGN KEY (lot_id) REFERENCES public.product_lots(id);
ALTER TABLE public.import_items ADD CONSTRAINT import_items_lot_id_fkey
  FOREIGN KEY (lot_id) REFERENCES public.product_lots(id);
```

**Kiểm thử:**
- `SELECT count(*) FROM products WHERE tenant_id IS NULL` = 0
- Không còn record mồ côi
- Có FK trên 3 bảng con

---

### Phase 5: Helper functions + RLS policies chuẩn tenant

**Mục tiêu:** Mọi bảng kinh doanh chỉ trả về dữ liệu của tenant hiện tại.

**Database:**
```sql
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_header TEXT;
  v_tenant_id UUID;
BEGIN
  -- ponytail: đọc header chuẩn Supabase. Không fallback về tenant đầu tiên của user.
  v_header := nullif(current_setting('request.headers', true)::json->>'x-tenant-id', '');
  IF v_header IS NULL THEN RETURN NULL; END IF;
  BEGIN
    v_tenant_id := v_header::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    v_tenant_id := NULL;
  END;
  RETURN v_tenant_id;
END;
$$;

-- Policy template: kiểm tra 2 lớp (tenant_id từ header + user thuộc tenant)
-- ponytail: luôn đóng ngoặc rõ ràng để tránh nhầm độ ưu tiên AND/OR.
CREATE POLICY "tenant_isolation_select" ON public.products FOR SELECT TO authenticated
USING (
  (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
  )
  OR public.is_system_admin()
);

CREATE POLICY "tenant_isolation_insert" ON public.products FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
);

CREATE POLICY "tenant_isolation_update" ON public.products FOR UPDATE TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
)
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
);

CREATE POLICY "tenant_isolation_delete" ON public.products FOR DELETE TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.is_tenant_admin(tenant_id)
);

-- ponytail: đảm bảo SKU, barcode, mã đơn, mã hóa đơn unique trong phạm vi tenant.
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_per_tenant
  ON public.products (tenant_id, sku) WHERE sku IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_per_tenant
  ON public.products (tenant_id, barcode) WHERE barcode IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_code_per_tenant
  ON public.orders (tenant_id, order_code);

CREATE UNIQUE INDEX IF NOT EXISTS idx_einvoice_orders_invoice_number_per_tenant
  ON public.einvoice_orders (tenant_id, invoice_number);
```

**Code:**
- `lib/tenant.ts`:
```ts
export const getSubdomain = () => {
  const host = window.location.host;
  const parts = host.split('.');
  if (parts.length >= 3 && parts[parts.length - 2] === 'vietsalepro') return parts[0];
  return null;
};

export const getTenantId = async () => {
  // ponytail: không cache tenant_id trong localStorage để tránh stale data khi đổi subdomain.
  const subdomain = getSubdomain();
  if (!subdomain) return null;
  const { data } = await supabase.rpc('get_tenant_by_subdomain', { p_subdomain: subdomain });
  return data?.id || null;
};
```

- `lib/supabase.ts` inject header động qua custom fetch wrapper:
```ts
let currentTenantId: string | null = null;

export const setCurrentTenantId = (tenantId: string | null) => {
  currentTenantId = tenantId;
};

const tenantFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);
  if (currentTenantId) {
    headers.set('x-tenant-id', currentTenantId);
  }
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    global: { fetch: tenantFetch },
  }
);
```

**Kiểm thử:**
- User ở tenant A chỉ thấy dữ liệu tenant A
- Truy vấn tenant B trả về 0 row
- Insert với tenant_id khác bị từ chối

---

### Phase 6: Sửa frontend nhận diện tenant

**Mục tiêu:** Subdomain → tenant_id, AuthContext lưu tenant, mọi request gắn tenant_id.

**Code:**
- Tạo `contexts/TenantContext.tsx`:
```tsx
interface TenantContextType {
  tenant: Tenant | null;
  membership: TenantMembership | null;
  role: TenantRole | null;
  isLoading: boolean;
}

export const TenantProvider = ({ children }) => {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [membership, setMembership] = useState<TenantMembership | null>(null);

  useEffect(() => {
    const loadTenant = async () => {
      const subdomain = getSubdomain();
      if (!subdomain) return;
      const t = await tenantService.getTenantBySubdomain(subdomain);
      if (t) {
        setTenant(t);
        setCurrentTenantId(t.id); // cập nhật header x-tenant-id động
        if (user) {
          const m = await tenantService.getMembership(t.id, user.id);
          setMembership(m);
        }
      }
    };
    loadTenant();
  }, [user]);

  return (
    <TenantContext.Provider value={{ tenant, membership, role: membership?.role || null, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
};
```

- Bọc `App.tsx`:
```tsx
<AuthProvider>
  <TenantProvider>
    <AppContent />
  </TenantProvider>
</AuthProvider>
```

- Sửa `App.tsx` load data: thêm `tenantId` vào dependency của useEffect
- Sửa `supabaseService.ts`: mỗi hàm insert/update tự động gắn `tenant_id`

**Logic:**
- Subdomain không tồn tại → redirect `vietsalepro.com` hoặc 404
- Tenant suspended → trang "Tài khoản đã bị tạm dừng"

**Kiểm thử:**
- Chuyển subdomain thấy dữ liệu khác
- Subdomain không tồn tại → 404
- Tenant suspended → chặn đăng nhập

---

### Phase 7: Thiết kế giới hạn và gói dịch vụ

**Mục tiêu:** 2 gói Free/VIP, giới hạn SKU, đơn/tháng, user.

**Database:**
```sql
-- ponytail: hàm 0 tham số để dùng với trigger. Trigger không truyền tham số.
CREATE OR REPLACE FUNCTION public.check_tenant_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_current INTEGER;
  v_max INTEGER;
BEGIN
  SELECT * INTO v_tenant FROM public.tenants WHERE id = NEW.tenant_id;
  IF NOT FOUND OR v_tenant.status NOT IN ('active', 'trial') THEN
    RAISE EXCEPTION 'Tenant không hoạt động hoặc không tồn tại';
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = NEW.tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant';
  END IF;

  IF TG_TABLE_NAME = 'tenant_memberships' THEN
    SELECT count(*) INTO v_current FROM public.tenant_memberships WHERE tenant_id = NEW.tenant_id;
    v_max := v_sub.max_users;
    IF v_current >= v_max THEN
      RAISE EXCEPTION 'Đã đạt giới hạn số user của gói dịch vụ';
    END IF;
  ELSIF TG_TABLE_NAME = 'products' THEN
    SELECT count(*) INTO v_current FROM public.products WHERE tenant_id = NEW.tenant_id;
    v_max := v_sub.max_products;
    IF v_current >= v_max THEN
      RAISE EXCEPTION 'Đã đạt giới hạn số sản phẩm của gói dịch vụ';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_tenant_user_limit
  BEFORE INSERT ON public.tenant_memberships
  FOR EACH ROW EXECUTE FUNCTION public.check_tenant_limits();

CREATE TRIGGER trg_check_tenant_product_limit
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.check_tenant_limits();

CREATE OR REPLACE FUNCTION public.increment_monthly_order_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_sub public.tenant_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_tenant FROM public.tenants WHERE id = NEW.tenant_id;
  IF NOT FOUND OR v_tenant.status NOT IN ('active', 'trial') THEN
    RAISE EXCEPTION 'Tenant không hoạt động hoặc không tồn tại';
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = NEW.tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant';
  END IF;

  IF v_sub.current_month_start IS NULL OR v_sub.current_month_start <> date_trunc('month', CURRENT_DATE)::DATE THEN
    UPDATE public.tenant_subscriptions
    SET current_month_orders = 1,
        current_month_start = date_trunc('month', CURRENT_DATE)::DATE,
        updated_at = now()
    WHERE tenant_id = NEW.tenant_id;
  ELSE
    IF v_sub.current_month_orders >= v_sub.max_orders_per_month THEN
      RAISE EXCEPTION 'Đã đạt giới hạn số đơn hàng/tháng của gói dịch vụ';
    END IF;

    UPDATE public.tenant_subscriptions
    SET current_month_orders = current_month_orders + 1,
        updated_at = now()
    WHERE tenant_id = NEW.tenant_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_tenant_order_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.increment_monthly_order_count();
```

**Code:**
- `services/subscriptionService.ts`: `getSubscription`, `checkLimit`, `isNearLimit`
- Gắn kiểm tra giới hạn trước khi: thêm user, thêm sản phẩm, tạo đơn hàng

**Gói dịch vụ:**
| Gói | SKU | Đơn/tháng | User |
|---|---|---|---|
| Free | 50 | 300 | 1 |
| VIP | 999.999 | 999.999 | 999 |

**Kiểm thử:**
- Free tenant không thêm user thứ 2
- Free tenant không thêm sản phẩm thứ 51
- Free tenant tạo đơn thứ 301 bị từ chối

---

### Phase 8: Tạo admin dashboard cho chủ hệ thống

**Mục tiêu:** Trang `admin.vietsalepro.com` để tạo/sửa/suspend cửa hàng.

**Code:**
- `pages/SystemAdminDashboard.tsx`
- Route `/admin/*` hoặc subdomain `admin.vietsalepro.com`
- Tính năng: danh sách tenants, tạo tenant + admin, sửa tenant, suspend/activate, xem audit log

**Database:**
- RPC `create_tenant_with_admin`
- RPC `update_tenant_status`

**Security:**
- Chỉ `system_admins` truy cập
- Kiểm tra `is_system_admin()` trong RLS và UI

**Kiểm thử:**
- System admin tạo tenant
- User thường không vào được admin dashboard

---

### Phase 9: Tạo Edge Functions

**Mục tiêu:** Các tác vụ nhạy cảm chạy ở server, không expose service_role key.

**Edge Functions:**
1. `create-tenant` — system admin tạo tenant + admin user
2. `invite-member` — admin tenant mời nhân viên
3. `check-subdomain` — kiểm tra subdomain có sẵn
4. `reset-password` — admin/system admin reset password cho nhân viên, gửi email redirect về đúng subdomain
5. `process-checkout` — cập nhật từ RPC hiện tại để xử lý tenant
6. `audit-log-writer` — ghi audit log

**Cấu trúc:**
```
supabase/
  functions/
    create-tenant/index.ts
    invite-member/index.ts
    check-subdomain/index.ts
    reset-password/index.ts
    audit-log/index.ts
```

**Logic mẫu:**
```ts
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
const subdomain = req.headers.get('x-subdomain');
const tenant = await supabase.from('tenants').select('*').eq('subdomain', subdomain).single();
```

**Rate limiting (bảng `rate_limit_logs` trong Supabase):**

```sql
CREATE TABLE public.rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login','create_tenant','check_subdomain','invite_member')),
  attempt_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rate_limit_logs_ip_action_window
  ON public.rate_limit_logs(ip_address, action, window_start);
```

Quy tắc:
- Đăng nhập sai ≥ 5 lần/15 phút/IP → lockout tạm thời.
- Tạo tenant / check subdomain / mời nhân viên: 10 request/phút/IP.
- Triển khai trong Edge Function: trước khi xử lý, kiểm tra bảng `rate_limit_logs`; nếu vượt ngưỡng thì trả về 429 Too Many Requests.
- Dọn dữ liệu cũ > 24h định kỳ bằng Supabase cron extension hoặc Edge Function scheduled.

**Password reset flow (dùng email mặc định của Supabase Auth):**
- Admin tenant hoặc system admin gọi `reset-password` với `email` + `tenant_id`/`subdomain`.
- Edge Function kiểm tra user thuộc tenant, sau đó gọi `supabase.auth.admin.generateLink('recovery', ...)` với `redirect_to: https://{subdomain}.vietsalepro.com/reset-password`.
- Không cho phép user tự reset password nếu self-registration đã tắt, trừ khi có lời mời từ admin.
- Email gửi đi dùng cấu hình Email provider mặc định của Supabase (không cần cấu hình SMTP riêng).

**Kiểm thử:**
- Tạo tenant qua Edge Function
- Invite member qua email
- Check subdomain
- Reset password redirect về đúng subdomain
- Rate limiting chặn brute-force login và spam tạo tenant

---

### Phase 10: Cập nhật RBAC trong DB và UI

**Mục tiêu:** 4 role, policies theo role, menu ẩn/hiện theo quyền.

**Database:**
```sql
CREATE OR REPLACE FUNCTION public.user_tenant_role(p_tenant_id UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.tenant_memberships
  WHERE tenant_id = p_tenant_id AND user_id = auth.uid() LIMIT 1;
$$;

-- ponytail: PostgreSQL kết hợp các policy bằng OR. Nếu giữ policy INSERT/UPDATE/DELETE
-- generic của Phase 5 và thêm policy theo role, nhân viên vẫn insert được.
-- Vì vậy ở các bảng cần phân quyền chi tiết, cần DROP policy generic trước.

-- ORDERS: admin/cashier tạo; chỉ admin sửa/xóa
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.orders;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.orders;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.orders;

CREATE POLICY "orders_insert_by_role" ON public.orders FOR INSERT TO authenticated
WITH CHECK (tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(tenant_id) IN ('admin', 'cashier'));

CREATE POLICY "orders_update_admin_only" ON public.orders FOR UPDATE TO authenticated
USING (tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(tenant_id) = 'admin');

CREATE POLICY "orders_delete_admin_only" ON public.orders FOR DELETE TO authenticated
USING (tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(tenant_id) = 'admin');

-- Lặp lại pattern tương tự cho products, import_receipts, inventory_counts, disposals, customers, suppliers.
```

**Bảng phân quyền:**

| Tính năng | admin | cashier | inventory_manager | accountant |
|---|---|---|---|---|
| POS / Tạo đơn | ✓ | ✓ | ✗ | ✗ |
| Thanh toán nợ | ✓ | ✓ | ✗ | ✗ |
| Xem khách/sản phẩm | ✓ | ✓ | ✓ | ✓ |
| Nhập hàng | ✓ | ✗ | ✓ | ✗ |
| Kiểm kê | ✓ | ✗ | ✓ | ✗ |
| Xuất hủy | ✓ | ✗ | ✓ | ✗ |
| Quản lý lô/tồn | ✓ | ✗ | ✓ | ✗ |
| Báo cáo | ✓ | ✗ | ✗ | ✓ |
| Công nợ | ✓ | ✗ | ✗ | ✓ |
| Sửa đơn/tồn | ✓ | ✗ | ✗ | ✗ |
| Quản lý user | ✓ | ✗ | ✗ | ✗ |
| Audit log | ✓ | ✗ | ✗ | ✗ |

**Code:**
- `hooks/usePermissions.ts`
- Sửa `AppShell`/`BottomNav` ẩn menu theo quyền
- Sửa các page disable/hide button theo quyền

**Kiểm thử:**
- Cashier không xóa đơn
- Accountant không tạo đơn
- Inventory_manager không xem báo cáo

---

### Phase 11: Thêm audit log

**Mục tiêu:** Ghi log các thao tác quan trọng.

**Database:**
```sql
-- ponytail: đồng bộ tên bảng với các file khác: app_audit_log. tenant_id nullable để log hệ thống không gắn tenant.
CREATE TABLE public.app_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT')),
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_tenant_admin" ON public.app_audit_log FOR SELECT TO authenticated
USING (
  public.is_tenant_admin(tenant_id)
  OR public.is_system_admin()
);

CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_record_id TEXT;
  v_tenant_id UUID;
BEGIN
  v_record_id := COALESCE(NEW.id::TEXT, OLD.id::TEXT);
  v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);

  INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data, new_data)
  VALUES (
    v_tenant_id,
    auth.uid(),
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_log_orders
  BEFORE INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER trg_audit_log_products
  BEFORE INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER trg_audit_log_import_receipts
  BEFORE INSERT OR UPDATE OR DELETE ON public.import_receipts
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER trg_audit_log_disposals
  BEFORE INSERT OR UPDATE OR DELETE ON public.disposals
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER trg_audit_log_app_settings
  BEFORE INSERT OR UPDATE OR DELETE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
```

**Code:**
- `services/auditService.ts`: hàm `writeAuditLog` ghi thủ công `LOGIN`, `LOGOUT`, `EXPORT` và điền `ip_address`/`user_agent` khi có.
- Gọi ghi log trong: tạo/xóa đơn, nhập hàng, xuất hủy, đổi cài đặt, đăng nhập/xuất.

**Kiểm thử:**
- Mỗi thao tác quan trọng tạo 1 log row
- Chỉ admin/system admin xem được log

---

### Phase 12: Bật TypeScript strict

**Mục tiêu:** `tsconfig.json` `strict: true`, `npm run lint` pass.

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Cách làm:** Bật từng flag một, fix lỗi riêng cho mỗi flag.

---

### Phase 13: Viết tests

**Mục tiêu:** 30 unit tests + 5 integration tests.

**Công cụ:** Vitest + `@testing-library/react` + mock Supabase.

**Unit tests:**
- `utils/invoiceNumber.test.ts`
- `utils/promotionUtils.test.ts`
- `utils/stringHelper.test.ts`
- `utils/offlineManager.test.ts`
- `lib/tenant.test.ts`
- `hooks/usePermissions.test.ts`

**Integration tests:**
- Luồng đăng nhập theo subdomain
- Luồng tạo đơn hàng
- Luồng cách ly dữ liệu tenant
- Luồng RBAC cashier
- Luồng offline sync

---

### Phase 14: Dọn dẹp codebase

**Mục tiêu:** Xóa backup tables, file rác, chuẩn hóa error handling.

**Database:**
```sql
DROP TABLE IF EXISTS public.backup_products_pre_phase2;
DROP TABLE IF EXISTS public.backup_product_lots_pre_phase2;
DROP TABLE IF EXISTS public.backup_stock_movements_pre_phase2;
DROP TABLE IF EXISTS public.backup_stock_ledger_meta;
DROP TABLE IF EXISTS public.stock_movements_backup_phase6;
DROP TABLE IF EXISTS public.import_items_backup_phase3a;
DROP TABLE IF EXISTS public.import_receipts_backup_phase3a;
DROP TABLE IF EXISTS public.products_backup_phase3a;
DROP TABLE IF EXISTS public.product_lots_backup_phase3a;
```

**Code:**
- Xóa `components/MobilePOS.backup.tsx`
- Xóa `memory-zone/.temp/phase7c_sections/fixed_*.sql` đã deploy
- Xóa `OLD` directory
- Chuẩn hóa error handling với `AppError`

---

### Phase 15: Test trên staging

**Mục tiêu:** Tạo 2-3 tenant, test cách ly, RBAC, suspend, subdomain lỗi.

**Test cases:**
1. Tạo 3 tenants: `store-a`, `store-b`, `store-c`
2. Mỗi tenant có 1 admin, 1 cashier, 1 inventory_manager, 1 accountant
3. Tạo dữ liệu ở tenant A, đăng nhập tenant B không thấy
4. Cashier tenant A không đăng nhập được tenant B
5. Suspend tenant C → không đăng nhập được
6. Subdomain `khongtontai.vietsalepro.com` → 404
7. RBAC tests
8. Storage RLS: tenant A không đọc/xóa được file của tenant B
9. Subscription limits: Free tenant bị chặn khi vượt user/SKU/đơn hàng
10. Password reset redirect về đúng subdomain
11. Rate limiting: lockout sau 5 lần đăng nhập sai, chặn spam tạo tenant

---

### Phase 16: Deploy production

**Mục tiêu:** Chuẩn bị DNS/hosting/SSL/Storage RLS, chạy migration, backfill, deploy frontend, smoke test.

**Lộ trình:**

#### 16.1. DNS & Hosting (Cloudflare Pages — đã chọn)

**Cấu hình:**
1. Trong Cloudflare Dashboard, thêm domain `vietsalepro.com`.
2. Tạo Pages project và kết nối repo GitHub/GitLab.
3. Thêm custom domain `vietsalepro.com` và wildcard `*.vietsalepro.com` vào Pages project.
4. Cloudflare tự động tạo DNS record:
   - `CNAME vietsalepro.com → <pages-project>.pages.dev`
   - `CNAME *.vietsalepro.com → <pages-project>.pages.dev`
5. Bật **Cloudflare proxy** (mây vàng) để có SSL tự động và rate limiting ở edge.

**Lưu ý:**
- Cloudflare Pages hỗ trợ wildcard subdomain với SSL tự động (Universal SSL).
- Frontend cùng 1 app sẽ nhận diện subdomain từ `window.location.host`.
- `admin.vietsalepro.com` và `ten-cuahang.vietsalepro.com` đều được wildcard coverage.
- Nếu cần rewrite/phân route nâng cao, dùng `_routes.json` hoặc Cloudflare Workers.

#### 16.2. Storage RLS (cách ly file theo tenant)

Tạo bucket `tenant-assets` dùng chung cho tất cả tenant (scale tốt đến 1000+ cửa hàng KiotViet-style):

```sql
-- Chính sách: mỗi tenant chỉ thấy/thao tác folder của mình
CREATE POLICY "tenant_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
  AND public.is_tenant_member(public.current_tenant_id())
);

CREATE POLICY "tenant_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
  AND public.is_tenant_member(public.current_tenant_id())
);

CREATE POLICY "tenant_storage_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
  AND public.is_tenant_admin(public.current_tenant_id())
);
```

Frontend upload:
```ts
const path = `${tenantId}/invoices/${fileName}`;
supabase.storage.from('tenant-assets').upload(path, file);
```

> **ponytail:** Đã chọn 1 bucket chung (`tenant-assets`) với path theo `tenant_id`. Phù hợp KiotViet-style 1000+ tenant, đơn giản backup/restore. Nếu sau này có tenant VIP yêu cầu cách ly vật lý, có thể tách riêng một số tenant sang bucket riêng mà không cần đụng toàn bộ hệ thống.

#### 16.3. Deploy production

1. Backup production
2. Chạy migration từ **Phase 1 → Phase 13** (chưa xóa backup tables để còn khả năng rollback)
3. Backfill dữ liệu
4. Deploy frontend
5. Kiểm tra DNS resolution cho `*.vietsalepro.com`
6. Smoke test
7. Nếu smoke test pass → chạy **Phase 14** (dọn dẹp backup tables, file rác)
8. Theo dõi 24h

---

### Phase 17: Thiết lập vận hành dài hạn

**Mục tiêu:** Backup tự động, data retention, test restore, tài liệu vận hành.

**Công việc:**
- **Backup:**
  - Giai đoạn đầu: dùng Supabase Free plan + backup định kỳ bằng `supabase db dump`.
  - Khi đi vào vận hành thật: nâng cấp lên Supabase Pro và bật PITR (Point-in-Time Recovery).
  - Test restore ít nhất 1 lần sau khi bật PITR.
- **Data retention (dùng Supabase cron extension):**
  - Archive đơn hàng > 2 năm vào bảng `orders_archive`.
  - Partition `app_audit_log` theo tháng.
  - Clean `processed_operations` cũ > 90 ngày.
  - Clean `rate_limit_logs` cũ > 24h.
  - Ví dụ cron job:
    ```sql
    SELECT cron.schedule('data-retention-daily', '0 3 * * *', $$
      CALL public.run_data_retention();
    $$);
    ```
- **Tài liệu vận hành:**
  - Viết `runbook.md` cho các tình huống:
    - Tenant bị suspend
    - User quên mật khẩu
    - Data isolation bug
    - Migration failed
    - Restore từ backup/PITR

---

## 4. Thiết kế chi tiết điểm then chốt

### 4.1 Xử lý subdomain

```
vietsalepro.com               → LandingPage
admin.vietsalepro.com         → SystemAdminDashboard
ten-cuahang.vietsalepro.com   → AppContent của tenant đó
```

```ts
// lib/subdomain.ts
export const getSubdomain = () => {
  const host = window.location.host;
  if (host.includes('localhost')) return 'main';
  const parts = host.split('.');
  if (parts.length >= 3) return parts[0];
  return null;
};
```

### 4.2 Inject tenant_id

```ts
let currentTenantId: string | null = null;

export const setCurrentTenantId = (tenantId: string | null) => {
  currentTenantId = tenantId;
};

const tenantFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);
  if (currentTenantId) {
    headers.set('x-tenant-id', currentTenantId);
  }
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: { fetch: tenantFetch },
  }
);
```

### 4.3 Xử lý offline-first

Khi offline sync, kèm `tenant_id` lấy từ subdomain runtime, không lấy từ localStorage:
```ts
const subdomain = getSubdomain();
const tenantId = await getTenantIdFromSubdomain();
offlineQueue.getAll().forEach(op => {
  // Chỉ sync operation thuộc tenant hiện tại
  if (op.tenant_id !== tenantId) return;
  supabase.rpc('process_checkout', { p_tenant_id: tenantId, ... });
});
```

Yêu cầu:
- Mỗi queued operation lưu `tenant_id` khi tạo.
- Trước khi sync, kiểm tra user vẫn còn membership trong tenant đó.
- Nếu đổi subdomain khi offline, queue chỉ sync operation của tenant đang truy cập.

### 4.4 Xử lý service_role

Service role key chỉ tồn tại trong:
- Supabase Edge Functions (Deno env)
- Local admin scripts (không commit)
- Không bao giờ trong `.env` frontend

### 4.5 Unique SKU / mã đơn / mã hóa đơn theo tenant

```sql
-- Điều chỉnh tên cột theo schema thực tế
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_per_tenant
  ON public.products (tenant_id, sku) WHERE sku IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_per_tenant
  ON public.products (tenant_id, barcode) WHERE barcode IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_code_per_tenant
  ON public.orders (tenant_id, order_code);

CREATE UNIQUE INDEX IF NOT EXISTS idx_einvoice_orders_invoice_number_per_tenant
  ON public.einvoice_orders (tenant_id, invoice_number);
```

### 4.6 Password reset flow

Xem chi tiết tại **Phase 9**. Tóm tắt:
- Admin tenant/system admin gọi Edge Function `reset-password`.
- Kiểm tra user thuộc tenant trước khi gửi email.
- `redirect_to` phải đúng subdomain (`https://{subdomain}.vietsalepro.com/reset-password`).

### 4.7 Rate limiting

Xem chi tiết tại **Phase 9**. Tóm tắt:
- Đăng nhập sai ≥ 5 lần/15 phút/IP → lockout tạm thời.
- Tạo tenant / check subdomain / mời nhân viên: 10 request/phút/IP.
- Triển khai bằng bảng `rate_limit_logs` trong Supabase, kiểm tra trong Edge Function.
- Dọn dữ liệu cũ > 24h bằng Supabase cron extension.

### 4.8 Data retention & backup strategy

- **Backup:**
  - Giai đoạn đầu: `supabase db dump` định kỳ trên Supabase Free plan.
  - Khi vận hành thật: nâng lên Supabase Pro và bật PITR.
  - Test restore định kỳ.
- **Data retention:**
  - Dùng Supabase cron extension để lên lịch:
    - Archive đơn hàng > 2 năm.
    - Partition `app_audit_log` theo tháng.
    - Clean `processed_operations` cũ > 90 ngày.
    - Clean `rate_limit_logs` cũ > 24h.

---

## 5. Lộ trình triển khai

```
Tuần 1-2:  Phase 0 + 1 + 2
Tuần 3:    Phase 3 + 4
Tuần 4:    Phase 5 + 6
Tuần 5:    Phase 7 + 8
Tuần 6:    Phase 9 + 10
Tuần 7:    Phase 11 + 12
Tuần 8:    Phase 13
Tuần 9:    Phase 14 (dọn dẹp staging) + Phase 15 (staging test)
Tuần 10:   Phase 16 (production deploy + smoke test + dọn dẹp backup tables production sau smoke test pass)
Tuần 11:   Phase 17 + ổn định
```

> **Lưu ý:** Phase 14 (dọn dẹp backup tables) phải chạy trên production **sau khi** smoke test của Phase 16 pass, để còn khả năng rollback.

**Rollback plan:**
- Luôn backup trước migration
- Mỗi migration idempotent (có `IF EXISTS`)
- Nếu lỗi, restore từ backup
- Không deploy production vào giờ cao điểm

---

## 6. Tiêu chí chấp nhận (Acceptance Criteria)

1. Không còn policy `public`/`anon` ALL trên bảng dữ liệu.
2. `npm run lint` pass với `strict: true`.
3. `npm run build` pass.
4. Có ít nhất 30 unit tests và 5 integration tests pass.
5. Không còn record mồ côi trong các bảng chính.
6. Có FK trên `order_items.lot_id`, `return_order_items.lot_id`, `import_items.lot_id`.
7. Có runbook vận hành.
8. Có backup tự động và đã test restore thành công ít nhất 1 lần.
9. Cách ly dữ liệu giữa tenant A/B đã test (A không thấy dữ liệu B).
10. RBAC đã test: cashier không xóa đơn, accountant không tạo đơn, inventory manager không xem báo cáo.
11. Self-registration bị tắt hoàn toàn.
12. Service role key không lộ ra frontend.
13. Subdomain không tồn tại và tenant bị suspend xử lý đúng.
14. Audit log hoạt động và chỉ admin/system admin xem được.
15. Storage RLS đã test cách ly file giữa các tenant.
16. Subscription limits đã test: user, sản phẩm, đơn hàng/tháng.
17. Đã xóa backup tables và file rác không cần thiết.
18. Kiểu `tenant_id` là UUID đồng bộ toàn hệ thống.
19. Không lưu `tenant_id` vào `localStorage`; mọi request xác định từ subdomain qua custom fetch wrapper.
20. Password reset flow hoạt động và redirect về đúng subdomain.
21. Rate limiting đã test: lockout đăng nhập sai, giới hạn tạo tenant/check subdomain.
22. SKU / mã đơn / mã hóa đơn unique theo tenant đã test.
23. Offline queue cách ly theo tenant: đổi subdomain không sync chéo dữ liệu.
24. Data retention policy đã có và test archive/partition dữ liệu cũ.
25. Backup strategy dùng Supabase CLI hoặc PITR, không dùng `pg_dump` thuần.

---

*File được tạo tự động từ kế hoạch chi tiết đã lập trong phiên chat.*
