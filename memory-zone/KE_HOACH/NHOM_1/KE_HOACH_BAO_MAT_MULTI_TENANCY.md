# KẾ HOẠCH BẢO MẬT & MULTI-TENANCY CHO VIETSALE PRO v7

> **Mục tiêu:** Biến VietSale Pro từ phần mềm "chạy được" thành hệ thống SaaS nhiều cửa hàng, có thể vận hành thực tế **10–20 năm** mà không lỗi nghiêm trọng.
>
> **Ngày cập nhật:** 2026-07-04  
> **Trạng thái:** Kế hoạch tổng thể đã thống nhất, sẵn sàng triển khai  
> **Cơ sở kiểm tra:**
> - Knowledge Graph qua `codebase-memory-mcp`
> - Supabase MCP project `QLBH` (`rsialbfjswnrkzcxarnj`)
> - `npm run lint` → PASS
> - `npm run build` → PASS

---

## QUYẾT ĐỊNH THỐNG NHẤT (ĐÃ CHỐT)

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Kiểu `tenant_id` | **UUID** | Đồng bộ với `auth.users(id)`, tránh mismatch FK, phù hợp hệ thống lâu dài. |
| Gói dịch vụ | **2 gói: Free / VIP** | Đơn giản vận hành, rõ ràng cho khách hàng. |
| Lưu `tenant_id` frontend | **Không lưu localStorage** | Luôn xác định tenant từ subdomain runtime, tránh stale data và confusion khi user đổi subdomain. |
| Header `x-tenant-id` | **Truyền qua request header** | Là cơ chế chuẩn, không dùng session config. |
| Cú pháp đọc header trong PostgreSQL | `(current_setting('request.headers', true)::json->>'x-tenant-id')::uuid` | Cách chuẩn trên Supabase, đáng tin cậy. |
| Fallback khi thiếu header | **Không fallback** | `current_tenant_id()` trả về `NULL`, RLS từ chối. An toàn nhất. |
| RLS cơ bản | **tenant_id = current_tenant_id() AND is_tenant_member(tenant_id)** | Cách ly theo subdomain VÀ theo membership, 2 lớp bảo vệ. |

---

## TÓM TẮT TÌNH TRẠNG HIỆN TẠI

| Khía cạnh | Kết quả | Đánh giá |
|---|---|---|
| Build & lint | PASS | Ổn định |
| Tích hợp tính năng | Tốt | Các flow checkout/nhập hàng/trả hàng đã liên kết |
| Số lượng code | 1,143 hàm / 190 file | Vừa phải |
| Bảo mật RLS | **Mở toàn bộ cho public** | NGUY HIỂM |
| Toàn vẹn dữ liệu | Thiếu FK, có record mồ côi | Cần sửa |
| TypeScript strict | Tắt | Cần bật |
| Tests | Không có | Cần bổ sung |
| Backup tables | Còn nhiều bảng rác | Cần dọn |
| Multi-tenancy | Chưa có | Cần xây dựng |

---

## NGUYÊN TẮC THIẾT KẾ ĐÃ CHỐT

| Quyết định | Lý do |
|---|---|
| **Shared DB + `tenant_id` + RLS** | Không tách database/schema — đơn giản vận hành, chi phí thấp, backup 1 project |
| **Subdomain = định danh tenant duy nhất** | `ten-cuahang.vietsalepro.com` → `tenants.subdomain` → `tenant_id` |
| **`auth.users` global** | Supabase Auth là nguồn user duy nhất cho toàn hệ thống |
| **Role lưu trong `tenant_memberships`** | Không dùng `auth.users.raw_user_meta_data` cho role |
| **RLS kiểm tra tenant + role** | `tenant_id = current_tenant_id()` AND `is_tenant_member(tenant_id)` AND user có quyền phù hợp |
| **Truyền tenant qua request header `x-tenant-id`** | Đúng cơ chế Supabase/connection pool, không dùng session config |
| **Service role key chỉ ở Edge Function/backend** | Không bao giờ đưa vào frontend |
| **Tắt self-registration hoàn toàn** | Khách hàng không tự đăng ký được; chỉ chủ hệ thống tạo cửa hàng |
| **Kiểu `tenant_id` dùng `UUID`** | Đồng bộ với `auth.users(id)` và khóa ngoại |
| **Không fallback tenant khi thiếu header** | Tránh lộ dữ liệu chéo tenant khi user thuộc nhiều cửa hàng |
| **Không lưu `tenant_id` vào localStorage** | Luôn xác định từ subdomain, tránh stale state |
| **Soft-delete tenant** | Thay vì xóa vĩnh viễn, đổi `status` thành `suspended` / `cancelled` |
| **Không hard-delete user trong `auth.users`** | Khi nhân viên nghỉ, chỉ xóa `tenant_memberships` để bảo toàn lịch sử và audit log |

---

## DANH SÁCH BẢNG CẦN THÊM `tenant_id`

Tất cả các bảng dưới đây phải có cột `tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE`, tạo index, bật RLS và bắt buộc `NOT NULL` sau khi backfill:

- `app_settings`
- `brands`
- `categories`
- `customers`
- `customer_payment_ledger`
- `disposal_items`
- `disposals`
- `einvoice_config`
- `einvoice_orders`
- `import_items`
- `import_receipts`
- `inventory_count_items`
- `inventory_counts`
- `inventory_movements`
- `order_items`
- `orders`
- `point_history`
- `processed_operations`
- `product_lots`
- `products`
- `promotions`
- `rank_configs`
- `rank_history`
- `return_order_items`
- `return_orders`
- `rewards`
- `stock_movements`
- `supplier_exchange_received_items`
- `supplier_exchange_return_items`
- `supplier_exchanges`
- `suppliers`
- `supplier_payment_ledger`

Các bảng hệ thống **không** thêm `tenant_id` (trừ audit log có để lọc):
- `auth.users`
- `public.tenants`
- `public.tenant_memberships`
- `public.tenant_subscriptions`
- `public.system_admins`

---

## LỘ TRÌNH TRIỂN KHAI CHI TIẾT

### Phase 0: Chuẩn bị môi trường & backup

| Bước | Cách làm | Output |
|---|---|---|
| 0.1 | Tạo staging project Supabase trong cùng org | Project staging riêng |
| 0.2 | `supabase db dump` (Supabase CLI) → restore vào staging | Staging có dữ liệu giống production |
| 0.3 | `git checkout -b multi-tenant` từ `main` | Code isolation |
| 0.4 | Thêm `.env.staging` với `VITE_SUPABASE_URL_STAGING`, `VITE_SUPABASE_ANON_KEY_STAGING` | Chạy staging mode |
| 0.5 | Backup production timestamped | File backup an toàn |
| 0.6 | `npm run lint` + `npm run build` pass | Build xanh |
| 0.7 | Chuẩn bị runbook vận hành ban đầu | File `runbook.md` khung sườn |

**Lưu ý:** Không viết code nghiệp vụ mới trong phase này.

---

### Phase 1: Dọn dẹp bảo mật hiện tại

#### 1.1. Xóa toàn bộ policy public/anon trên bảng dữ liệu

Các bảng cần xóa policy `Allow public access` / `Public Access`:

```
app_settings, brands, categories, customers, customer_payment_ledger, disposal_items,
disposals, einvoice_config, einvoice_orders, import_items, import_receipts,
inventory_count_items, inventory_counts, inventory_movements, order_items, orders,
point_history, processed_operations, product_lots, products, promotions, rank_configs,
rank_history, return_order_items, return_orders, rewards, stock_movements,
supplier_exchange_received_items, supplier_exchange_return_items, supplier_exchanges,
suppliers, supplier_payment_ledger
```

Câu lệnh mẫu:

```sql
DROP POLICY IF EXISTS "Allow public access" ON public.orders;
DROP POLICY IF EXISTS "Public Access" ON public.orders;
-- Lặp lại cho tất cả bảng trên
```

Kiểm tra lại:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Kết quả mong muốn:** không còn policy nào cho phép `public` hoặc `anon` FULL ACCESS trên bảng dữ liệu.

#### 1.2. Policy tạm thời cho `authenticated`

Sau khi xóa public, tạo policy tạm để app không bị đứt:

```sql
CREATE POLICY "authenticated_full_access_temp"
ON public.orders
FOR ALL TO authenticated
USING (true) WITH CHECK (true);
-- Lặp lại cho các bảng kinh doanh
```

#### 1.3. Cấu hình Supabase Auth

- **Tắt** `Enable new signups` (self-registration)
- **Tắt** `Enable email confirmations` (do admin tự tạo user)
- **Tắt** tất cả social providers
- **Site URL:** `https://vietsalepro.com`
- **Redirect URLs:** `https://*.vietsalepro.com/**`

#### 1.4. Code

- `Login.tsx`: không có link đăng ký, hiển thị "Liên hệ quản trị viên"
- Đảm bảo không có `VITE_SUPABASE_SERVICE_ROLE_KEY` trong `.env` frontend
- Không lưu `tenant_id` vào `localStorage`

#### 1.5. Kiểm thử

- User chưa đăng nhập bị chặn hoàn toàn
- User đã đăng nhập vẫn thấy dữ liệu
- `supabase.auth.signUp` bị từ chối

---

### Phase 2: Tạo foundation multi-tenancy

#### 2.1. Bảng hệ thống

```sql
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','trial','suspended','pending')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','vip')),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE TRIGGER trg_tenant_memberships_updated_at
BEFORE UPDATE ON public.tenant_memberships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tenant_memberships_user ON public.tenant_memberships(user_id);
CREATE INDEX idx_tenant_memberships_tenant ON public.tenant_memberships(tenant_id);

CREATE TABLE public.tenant_subscriptions (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','vip')),
  max_users INTEGER NOT NULL DEFAULT 1,
  max_products INTEGER NOT NULL DEFAULT 50,
  max_orders_per_month INTEGER NOT NULL DEFAULT 300,
  current_month_orders INTEGER NOT NULL DEFAULT 0,
  current_month_start DATE NOT NULL DEFAULT CURRENT_DATE,
  billing_status TEXT DEFAULT 'ok',
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_tenant_subscriptions_updated_at
BEFORE UPDATE ON public.tenant_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.system_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helper function cập nhật updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

#### 2.2. Helper functions

```sql
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(p_tenant_id UUID, p_role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = p_role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_by_subdomain(p_subdomain TEXT)
RETURNS public.tenants LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT * FROM public.tenants WHERE subdomain = p_subdomain LIMIT 1;
$$;

-- Lấy tenant_id từ request header. Không fallback.
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_header TEXT;
  v_tenant_id UUID;
BEGIN
  v_header := current_setting('request.headers', true)::json->>'x-tenant-id';
  v_tenant_id := nullif(v_header, '')::UUID;
  RETURN v_tenant_id;
END;
$$;
```

#### 2.3. RLS foundation

```sql
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;

-- tenants: user chỉ thấy tenant mình thuộc, system admin thấy tất cả
CREATE POLICY "tenant_user_view_own" ON public.tenants FOR SELECT TO authenticated
USING (
  id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid())
  OR is_system_admin()
);

CREATE POLICY "system_admin_manage_tenants" ON public.tenants FOR ALL TO authenticated
USING (is_system_admin()) WITH CHECK (is_system_admin());

-- tenant_memberships: user thấy membership của mình, admin/system admin thấy tất cả trong tenant
CREATE POLICY "tenant_memberships_self_view" ON public.tenant_memberships FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR is_system_admin()
  OR is_tenant_admin(tenant_id)
);

CREATE POLICY "tenant_memberships_admin_manage" ON public.tenant_memberships FOR ALL TO authenticated
USING (
  is_system_admin()
  OR (is_tenant_admin(tenant_id) AND user_id <> auth.uid())
) WITH CHECK (
  is_system_admin()
  OR is_tenant_admin(tenant_id)
);

-- tenant_subscriptions: chỉ system admin và admin của tenant được xem
CREATE POLICY "tenant_subscriptions_view" ON public.tenant_subscriptions FOR SELECT TO authenticated
USING (
  is_system_admin()
  OR is_tenant_admin(tenant_id)
);

CREATE POLICY "tenant_subscriptions_system_admin_manage" ON public.tenant_subscriptions FOR ALL TO authenticated
USING (is_system_admin()) WITH CHECK (is_system_admin());

-- system_admins: chỉ system admin thấy
CREATE POLICY "system_admins_view" ON public.system_admins FOR SELECT TO authenticated
USING (is_system_admin());
```

#### 2.4. Code

- `types/tenant.ts`: `Tenant`, `TenantMembership`, `TenantRole`, `TenantSubscription`, `SystemAdmin`
- `services/tenantService.ts`: `getTenantBySubdomain`, `getMembership`, `inviteMember`, `updateMemberRole`, `removeMember`

#### 2.5. Kiểm thử

- Tạo tenant, thêm member, phân role
- User A không thấy tenant của user B
- Admin tenant có thể mời member
- System admin có thể tạo/sửa tenant

---

### Phase 3: Thêm `tenant_id` vào toàn bộ bảng kinh doanh

#### 3.1. Migration mẫu

```sql
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX idx_products_tenant_id ON public.products(tenant_id);
ALTER TABLE public.products ADD CONSTRAINT products_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX idx_orders_tenant_id ON public.orders(tenant_id);
ALTER TABLE public.orders ADD CONSTRAINT orders_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Lặp lại cho tất cả bảng kinh doanh
```

#### 3.2. Backfill dữ liệu cũ

```sql
-- Tạo tenant đầu tiên cho dữ liệu hiện có
-- ponytail: owner_id để NULL trong migration vì auth.uid() không xác định khi chạy migration.
-- Gán owner_id sau khi đã tạo user admin qua admin dashboard.
INSERT INTO public.tenants (id, name, slug, subdomain, status, plan, owner_id)
SELECT gen_random_uuid(), 'Cửa hàng chính', 'main', 'main', 'active', 'vip', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tenants);

-- Tất cả user hiện có trong auth.users trở thành admin của tenant đầu tiên.
-- Không có bước này thì user cũ sẽ không đăng nhập được vào tenant main.
DO $$
DECLARE v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'main' LIMIT 1;

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  SELECT v_tenant_id, id, 'admin'
  FROM auth.users
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
END $$;

DO $$
DECLARE v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'main' LIMIT 1;

  UPDATE public.products SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.orders SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.customers SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.suppliers SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.order_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.import_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.return_order_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.product_lots SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.processed_operations SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  -- Lặp lại cho tất cả các bảng còn lại
END $$;

-- Sau khi backfill xong, set NOT NULL
ALTER TABLE public.products ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN tenant_id SET NOT NULL;
-- Lặp lại cho tất cả bảng
```

#### 3.3. Xử lý record mồ côi và thêm FK

```sql
-- Backup record mồ côi trước khi xóa (destructive — cần review thủ công)
CREATE TABLE IF NOT EXISTS public.orphan_records_backup AS
SELECT 'order_items' AS table_name, NOW() AS backed_up_at, *
FROM public.order_items WHERE order_id IS NULL;

INSERT INTO public.orphan_records_backup
SELECT 'import_items', NOW(), * FROM public.import_items WHERE import_receipt_id IS NULL;

INSERT INTO public.orphan_records_backup
SELECT 'product_lots', NOW(), * FROM public.product_lots WHERE product_id IS NULL;

-- Xóa record mồ côi sau khi đã backup
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

#### 3.4. Unique theo tenant (SKU, mã đơn, mã hóa đơn)

Số hóa đơn / mã đơn hàng / SKU phải unique trong từng tenant, cho phép trùng giữa các tenant.

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

#### 3.5. Kiểm thử

- `SELECT count(*) FROM products WHERE tenant_id IS NULL` = 0
- Không còn record mồ côi
- Có FK trên `order_items.lot_id`, `return_order_items.lot_id`, `import_items.lot_id`
- Không thể tạo 2 SKU giống nhau trong cùng tenant

---

### Phase 4: RLS chuẩn + subdomain routing

#### 4.1. Frontend nhận diện subdomain

```ts
// lib/tenant.ts
export function getSubdomain(): string | null {
  const host = window.location.host;
  if (host.includes('localhost')) return 'main'; // local dev
  const parts = host.split('.');
  if (parts.length >= 3 && parts[parts.length - 2] === 'vietsalepro') {
    return parts[0].toLowerCase();
  }
  return null;
}

export async function getTenantIdFromSubdomain(): Promise<string | null> {
  const subdomain = getSubdomain();
  if (!subdomain) return null;
  const { data, error } = await supabase.rpc('get_tenant_by_subdomain', { p_subdomain: subdomain });
  if (error || !data) return null;
  return data.id;
}
```

#### 4.2. Inject `x-tenant-id` vào mọi request

```ts
// lib/supabase.ts
let currentTenantId: string | null = null;

export function setCurrentTenantId(tenantId: string | null) {
  currentTenantId = tenantId;
}

// ponytail: custom fetch wrapper để header x-tenant-id cập nhật động theo subdomain.
// `createClient` với `global.headers` chỉ đọc giá trị 1 lần khi module load, nên không dùng được.
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

// Khi app khởi động, load tenant từ subdomain và cập nhật header
export async function initTenant() {
  const tenantId = await getTenantIdFromSubdomain();
  setCurrentTenantId(tenantId);
  return tenantId;
}
```

**Lưu ý:** Không lưu `tenant_id` vào `localStorage`. Luôn lấy từ subdomain runtime.

#### 4.3. TenantContext

```tsx
// contexts/TenantContext.tsx
interface TenantContextType {
  tenant: Tenant | null;
  membership: TenantMembership | null;
  role: TenantRole | null;
  isLoading: boolean;
}
```

Logic:
- Subdomain không tồn tại → redirect về landing page `vietsalepro.com` hoặc 404
- Tenant suspended → trang "Tài khoản đã bị tạm dừng"
- User không thuộc tenant → đăng xuất và thông báo

#### 4.4. Policy mẫu chuẩn

```sql
-- SELECT: user phải thuộc tenant (hoặc system admin)
CREATE POLICY "tenant_isolation_select"
ON public.products FOR SELECT TO authenticated
USING (
  (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
  )
  OR public.is_system_admin()
);

-- INSERT: user phải thuộc tenant
CREATE POLICY "tenant_isolation_insert"
ON public.products FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
);

-- UPDATE: user phải thuộc tenant
CREATE POLICY "tenant_isolation_update"
ON public.products FOR UPDATE TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
)
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
);

-- DELETE: chỉ admin tenant
CREATE POLICY "tenant_isolation_delete"
ON public.products FOR DELETE TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_admin(tenant_id)
);

-- Lặp lại cho tất cả bảng kinh doanh
```

#### 4.5. Kiểm thử

- User ở tenant A chỉ thấy dữ liệu tenant A
- Truy vấn tenant B trả về 0 row
- Insert với `tenant_id` khác bị từ chối
- User không thuộc tenant bị từ chối dù header đúng

---

### Phase 5: Sửa toàn bộ frontend

#### 5.1. Các file/module cần thay đổi

- `lib/tenant.ts` — mới
- `lib/tenantAccess.ts` — mới
- `contexts/AuthContext.tsx` — thêm `tenant_id`, `tenant_role`
- `contexts/TenantContext.tsx` — mới
- `lib/supabase.ts` — inject header `x-tenant-id` từ runtime, không lưu localStorage
- `pages/Login.tsx` — nhận diện subdomain, hiển thị branding cửa hàng
- `App.tsx` — load tenant trước khi render app
- `services/supabaseService.ts` — mọi `supabase.from(...).insert/update/select` kèm `tenant_id`
- `pages/AdminDashboard.tsx` — mới (chỉ system admin)
- `hooks/usePermissions.ts` — mới
- `AppShell`/`BottomNav` — ẩn menu theo role
- `pages/LandingPage.tsx` — mới cho `vietsalepro.com`

#### 5.2. Offline-first

Khi sync offline queue, mỗi operation phải kèm `tenant_id` lấy từ subdomain runtime:

```ts
const subdomain = getSubdomain();
const tenantId = await getTenantIdFromSubdomain();
offlineQueue.getAll().forEach(op => {
  supabase.rpc('process_checkout', { p_tenant_id: tenantId, ... });
});
```

Yêu cầu:
- Mỗi queued operation lưu `tenant_id` khi tạo.
- Trước khi sync, kiểm tra user vẫn còn membership trong tenant.
- Nếu tenant bị suspend hoặc user bị xóa membership, dừng sync và cảnh báo.

---

### Phase 6: Admin dashboard + Edge Functions

#### 6.1. Admin dashboard

URL: `admin.vietsalepro.com`

Chức năng:
- Danh sách tenants
- Tạo tenant + admin user
- Sửa tenant / suspend / activate
- Xem subscription / billing
- Xem audit log toàn hệ thống
- Quản lý reserved subdomains

Chỉ `system_admins` mới truy cập được.

#### 6.2. Edge Functions

```
supabase/functions/
  create-tenant/index.ts
  invite-member/index.ts
  check-subdomain/index.ts
  reset-password/index.ts
  audit-log/index.ts
  process-checkout/index.ts
```

Yêu cầu:
- Dùng `SUPABASE_SERVICE_ROLE_KEY` từ Deno env
- Không expose service role key ra frontend
- Tạo user với `email_confirm: true`
- Kiểm tra subdomain hợp lệ và chưa tồn tại
- Kiểm tra giới hạn số user theo gói dịch vụ khi mời nhân viên
- Rollback tenant nếu tạo user thất bại
- Gửi email thông tin đăng nhập bằng Email provider mặc định của Supabase Auth (không cần cấu hình SMTP riêng)

#### 6.2.1. Password reset flow

Khi self-registration tắt, admin tenant hoặc system admin vẫn cần reset password cho nhân viên.

```
supabase/functions/reset-password/index.ts
```

Luồng:
1. Admin tenant/system admin gọi Edge Function với `email` và `subdomain`.
2. Edge Function kiểm tra user thuộc tenant đó (qua `tenant_memberships`).
3. Gọi `supabase.auth.admin.generateLink('recovery', ...)` với `redirect_to` đúng subdomain (`https://{subdomain}.vietsalepro.com/reset-password`).
4. Email gửi đi qua Email provider mặc định của Supabase Auth.
5. User click link, đặt lại mật khẩu, tự động redirect về subdomain.

#### 6.2.2. Rate limiting

Bảo vệ brute-force và abuse bằng bảng `rate_limit_logs` trong Supabase:

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
- Đăng nhập sai ≥ 5 lần trong 15 phút/IP → lockout tạm thời.
- Tạo tenant / check subdomain / mời nhân viên: 10 request/phút/IP.
- Kiểm tra trong Edge Function trước khi xử lý; nếu vượt ngưỡng trả về 429.
- Dọn dữ liệu cũ > 24h định kỳ bằng Supabase cron extension.

#### 6.3. Subdomain reserved

Cấm đăng ký các subdomain:

```
admin, www, api, app, support, help, blog, docs,
mail, ftp, smtp, pop, imap, webmail,
login, auth, dashboard, store, shop, payment, billing,
secure, static, cdn, staging, test, dev, demo
```

---

### Phase 7: RBAC + Subscription limits + Audit log

#### 7.1. Bảng phân quyền

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

#### 7.2. Policy mẫu theo role

```sql
CREATE OR REPLACE FUNCTION public.user_tenant_role(p_tenant_id UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.tenant_memberships
  WHERE tenant_id = p_tenant_id AND user_id = auth.uid()
  LIMIT 1;
$$;

-- Cashier tạo đơn
CREATE POLICY "cashier_can_create_orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(public.current_tenant_id()) IN ('admin', 'cashier')
);

-- Cashier không xóa đơn
CREATE POLICY "cashier_cannot_delete_orders"
ON public.orders FOR DELETE TO authenticated
USING (false);

-- Accountant chỉ xem
CREATE POLICY "accountant_can_view_orders"
ON public.orders FOR SELECT TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(public.current_tenant_id()) = 'accountant'
);

-- Inventory manager không xem báo cáo
CREATE POLICY "inventory_manager_can_view_inventory"
ON public.inventory_counts FOR SELECT TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(public.current_tenant_id()) IN ('admin', 'inventory_manager')
);
```

#### 7.3. Subscription limits

Gói dịch vụ:

| Gói | Giá | SKU | Đơn/tháng | User |
|---|---|---|---|---|
| **Free** | 0đ | 50 | 300 | 1 |
| **VIP** | 69K/tháng | 999.999 | 999.999 | 999 |

Kiểm tra giới hạn trong trigger:

```sql
CREATE OR REPLACE FUNCTION public.check_tenant_limits()
RETURNS trigger AS $$
DECLARE
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_current integer;
  v_max integer;
BEGIN
  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = NEW.tenant_id;

  IF TG_TABLE_NAME = 'tenant_memberships' THEN
    SELECT count(*) INTO v_current FROM public.tenant_memberships WHERE tenant_id = NEW.tenant_id;
    v_max := v_sub.max_users;
    IF v_current >= v_max THEN
      RAISE EXCEPTION 'Đã đạt giới hạn số user của gói dịch vụ';
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'products' THEN
    SELECT count(*) INTO v_current FROM public.products WHERE tenant_id = NEW.tenant_id;
    v_max := v_sub.max_products;
    IF v_current >= v_max THEN
      RAISE EXCEPTION 'Đã đạt giới hạn số sản phẩm của gói dịch vụ';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_tenant_user_limit
  BEFORE INSERT ON public.tenant_memberships
  FOR EACH ROW EXECUTE FUNCTION public.check_tenant_limits();

CREATE TRIGGER trg_check_tenant_product_limit
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.check_tenant_limits();

-- Giới hạn đơn hàng/tháng
CREATE OR REPLACE FUNCTION public.increment_monthly_order_count()
RETURNS trigger AS $$
DECLARE
  v_sub public.tenant_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = NEW.tenant_id;

  -- Reset nếu sang tháng mới
  IF v_sub.current_month_start <> date_trunc('month', CURRENT_DATE)::DATE THEN
    UPDATE public.tenant_subscriptions
    SET current_month_orders = 1,
        current_month_start = date_trunc('month', CURRENT_DATE)::DATE,
        updated_at = now()
    WHERE tenant_id = NEW.tenant_id;
  ELSE
    -- Kiểm tra giới hạn trước khi tăng
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_tenant_order_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.increment_monthly_order_count();
```

#### 7.4. Audit log

```sql
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

CREATE POLICY "audit_log_tenant_admin"
ON public.app_audit_log FOR SELECT TO authenticated
USING (
  public.is_tenant_admin(tenant_id)
  OR public.is_system_admin()
);
```

Ghi log cho: tạo/xóa đơn, nhập hàng, xuất hủy, đổi cài đặt, đăng nhập/xuất.

---

### Phase 8: DNS, Hosting, Storage RLS

#### 8.1. DNS & Hosting (Cloudflare Pages — đã chọn)

1. Trong Cloudflare Dashboard, thêm domain `vietsalepro.com`.
2. Tạo Pages project và kết nối repo GitHub/GitLab.
3. Thêm custom domain `vietsalepro.com` và wildcard `*.vietsalepro.com` vào Pages project.
4. Cloudflare tự động tạo DNS record:
   - `CNAME vietsalepro.com → <pages-project>.pages.dev`
   - `CNAME *.vietsalepro.com → <pages-project>.pages.dev`
5. Bật **Cloudflare proxy** để có SSL tự động và rate limiting ở edge.

Kết quả: mọi subdomain (`*.vietsalepro.com`) đều trỏ về cùng một frontend app.

- Landing page `vietsalepro.com` phục vụ khách hàng đăng ký liên hệ.
- `admin.vietsalepro.com` vào cùng app nhưng route `/admin` dành cho system admin.

#### 8.2. Storage RLS

Bucket dùng chung cho tất cả tenant:

- Tạo bucket `tenant-assets`.
- Tổ chức folder: `tenant-assets/{tenant_id}/products/{file}`.
- RLS cho Storage: user phải thuộc tenant sở hữu folder.

```sql
CREATE POLICY "tenant_storage_select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
  AND public.is_tenant_member(public.current_tenant_id())
);
```

- Không cho phép user đọc folder tenant khác.
- Phù hợp scale đến 1000+ tenant KiotViet-style. Nếu sau này có tenant VIP yêu cầu cách ly vật lý, có thể tách riêng một số tenant sang bucket riêng.

---

### Phase 9: Code quality, TypeScript strict, tests

#### 9.1. TypeScript strict

Bật từng flag một trong `tsconfig.json`:

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

#### 9.2. Tests

- **Unit tests:** `lotUtils`, `invoiceNumber`, `promotionUtils`, `stringHelper`, `offlineManager`, `lib/tenant`, `hooks/usePermissions`
- **Integration tests:** luồng đăng nhập theo subdomain, tạo đơn hàng, cách ly dữ liệu tenant, RBAC cashier, offline sync

Mục tiêu: ≥ 30 unit tests + ≥ 5 integration tests pass.

#### 9.3. Dọn dẹp codebase

Xóa các bảng backup rác:

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

Xóa file backup cũ trong `components/`, `memory-zone/.temp/`, `OLD/`, v.v.

---

### Phase 10: Test đầy đủ trên Staging

Tạo 3 tenant test: `store-a`, `store-b`, `store-c`.

Test cases:
1. Tạo dữ liệu ở tenant A, đăng nhập tenant B không thấy.
2. Cashier tenant A không đăng nhập được tenant B.
3. Cashier không xóa được đơn.
4. Accountant không tạo được đơn.
5. Inventory manager không xem được báo cáo.
6. Suspend tenant C → không đăng nhập được.
7. Subdomain `khongtontai.vietsalepro.com` → 404 / redirect landing.
8. Self-registration bị chặn.
9. Admin dashboard chỉ system admin vào được.
10. Backup và restore hoạt động.
11. Free tenant không thêm user thứ 2, sản phẩm thứ 51, đơn thứ 301.
12. Storage RLS: user tenant A không đọc file tenant B.
13. Realtime isolation: channel chỉ nhận tin nhắn của tenant hiện tại.

---

### Phase 11: Deploy production + vận hành dài hạn

1. Backup production đầy đủ bằng Supabase CLI (`supabase db dump`) hoặc dashboard backup.
2. Chạy migration từ Phase 1 → Phase 8 (chưa xóa backup tables để còn khả năng rollback).
3. Backfill dữ liệu cũ về tenant `main`.
4. Deploy frontend lên Cloudflare Pages.
5. Cấu hình DNS wildcard `*.vietsalepro.com` trên Cloudflare.
6. Smoke test toàn bộ luồng chính.
7. Nếu smoke test pass → chạy dọn dẹp backup tables, file rác.
8. Bật PITR (Point-in-Time Recovery) khi nâng lên Supabase Pro.
9. Theo dõi error log, query performance, audit log trong 24–48h.
10. Thiết lập backup định kỳ: trên Free plan dùng `supabase db dump`; khi nâng Pro thì dùng PITR. Test restore 1 lần/tháng trên staging, 1 lần/quý trên production backup.
11. Triển khai data retention bằng Supabase cron extension: archive đơn hàng > 2 năm, partition `app_audit_log` theo tháng, clean `processed_operations` cũ, clean `rate_limit_logs` cũ > 24h.
12. Theo dõi storage usage, số lượng tenant, user, đơn hàng; cân nhắc read replica và connection pooling khi đạt ngưỡng.

---

## LƯU Ý QUAN TRỌNG

1. **Không để lộ `service_role key`.** Chỉ dùng trong Edge Functions / backend. Không đưa vào `.env` frontend.
2. **Tắt self-registration.** `Enable new signups` phải OFF, social providers OFF, email confirmations OFF.
3. **RLS bao phủ 100% bảng kinh doanh.** Bảng nào thiếu policy là lỗ hổng lộ dữ liệu.
4. **Không dùng `auth.users.raw_user_meta_data` cho role.** Role chỉ trong `tenant_memberships`.
5. **Cả bảng con cũng phải có `tenant_id`.** Ví dụ: `orders` và `order_items`.
6. **Mọi policy phải kiểm tra cả `tenant_id` và `is_tenant_member(tenant_id)`.** Không chỉ dựa vào header.
7. **Không fallback tenant khi thiếu header.** `current_tenant_id()` trả về `NULL` để RLS từ chối.
8. **Cấm subdomain reserved:** `admin`, `www`, `api`, `app`, `support`, `login`, `dashboard`, `store`, `payment`, `staging`, `test`, `dev`, v.v.
9. **Email trùng nhau giữa các cửa hàng.** Với shared `auth.users`, một email chỉ tồn tại một lần. Nếu 2 cửa hàng mời cùng email, đó là cùng một user với 2 membership — đây là ưu điểm cho kế toán/nhân viên làm nhiều cửa hàng.
10. **Backup & Restore.** Giai đoạn đầu trên Supabase Free plan: dùng `supabase db dump` hoặc dashboard backup. Khi đi vào vận hành thật, nâng lên Supabase Pro và bật PITR. Luôn backup trước mỗi migration sửa dữ liệu. Test restore toàn bộ định kỳ (1 lần/tháng trên staging, 1 lần/quý trên production backup). Chuẩn bị sẵn script export/import 1 tenant nếu cần.
11. **Soft-delete tenant.** Thay vì xóa vĩnh viễn, đổi `status` thành `suspended` hoặc `cancelled` để dễ điều tra và khôi phục.
12. **Storage RLS.** Dùng bucket `tenant-assets` chung cho tất cả tenant; mỗi tenant có folder riêng theo path `tenant_id/...`; RLS kiểm tra `tenant_id` và membership. Phù hợp scale 1000+ tenant KiotViet-style.
13. **Realtime isolation.** Nếu dùng Supabase Realtime, channel phải lọc theo tenant để tránh lộ dữ liệu chéo tenant.
14. **Scaling.** Cần index trên `tenant_id`, composite index `(tenant_id, created_at)`, partition các bảng lớn (`orders`, `stock_movements`, `app_audit_log`), cân nhắc read replicas và connection pooling khi số lượng cửa hàng tăng.
15. **Không hard-delete user trong `auth.users`.** Khi nhân viên nghỉ việc, chỉ xóa bản ghi trong `tenant_memberships` để bảo toàn lịch sử và audit log.
16. **Không chạy migration production vào giờ cao điểm.** Luôn có rollback plan và backup.
17. **Không lưu `tenant_id` vào `localStorage`.** Luôn xác định từ subdomain runtime để tránh stale data.
18. **Password reset flow.** Khi self-registration tắt, chỉ admin tenant hoặc system admin được reset password cho nhân viên; link reset phải redirect về đúng subdomain.
19. **Rate limiting.** Dùng bảng `rate_limit_logs` trong Supabase: đăng nhập sai ≥ 5 lần/15 phút/IP lockout; tạo tenant, mời nhân viên, check subdomain giới hạn 10 request/phút/IP.
20. **SKU / mã đơn / mã hóa đơn unique theo tenant.** Dùng composite unique index `(tenant_id, ...)`; cho phép trùng giữa các tenant.
21. **Data retention.** Dùng Supabase cron extension để lên lịch: archive `orders` > 2 năm, partition `app_audit_log` theo tháng, clean `processed_operations` cũ > 90 ngày, clean `rate_limit_logs` cũ > 24h.

---

## TIÊU CHÍ CHẤP NHẬN (ACCEPTANCE CRITERIA)

Trước khi coi hệ thống “sẵn sàng 10–20 năm”:

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
17. Password reset flow hoạt động và redirect về đúng subdomain.
18. Rate limiting đã test: lockout đăng nhập sai, giới hạn tạo tenant/check subdomain.
19. SKU / mã đơn / mã hóa đơn unique theo tenant đã test.
20. Offline queue cách ly theo tenant: đổi subdomain không sync chéo dữ liệu.
21. Data retention policy đã có và test archive/partition dữ liệu cũ.
22. Backup strategy: Free plan dùng Supabase CLI (`supabase db dump`); khi vận hành thật nâng Pro + bật PITR. Không dùng `pg_dump` thuần.

---

## GHI CHÚ VẬN HÀNH

- KHÔNG thực hiện các thay đổi trên DB production vào giờ cao điểm.
- LUÔN tạo backup trước khi chạy migration sửa dữ liệu.
- KHÔNG bật `strict: true` đồng loạt — bật từng flag để tránh conflict lớn.
- Nên triển khai trên staging environment trước production.
- Mỗi migration phải idempotent (dùng `IF EXISTS` / `IF NOT EXISTS`).
- Giữ lại tài liệu `runbook.md` cho các tình huống: tenant bị suspend, user quên mật khẩu, data isolation bug, migration failed, restore một tenant.
