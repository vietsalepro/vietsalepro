# KẾ HOẠCH CHI TIẾT MULTI-TENANCY — PHIÊN BẢN SUB-PHASE

> **Ngày lập:** 2026-07-04  
> **Dựa trên:** `KE_HOACH_CHI_TIET_MULTI_TENANCY.md`  
> **Mục tiêu:** Chia nhỏ từng phase để mỗi đoạn chat xử lý trong giới hạn **250K context**.

---

## 1. Tại sao phải chia sub-phase?

Context limit 250K là **tổng token đầu vào** của một đoạn chat. Khi triển khai một phase, AI phải đọc:

1. Nội dung phase trong kế hoạch.
2. Code hiện có cần sửa/đọc (schema, service, page, component, v.v.).
3. Output code/sql mới sinh ra.

Một số phase trong kế hoạch gốc **không vượt 250K chỉ với phần plan**, nhưng khi cộng thêm code thực tế hoặc output SQL cho nhiều bảng sẽ dễ dàng vượt ngưỡng. File này chia nhỏ các phase đó thành các sub-phase độc lập, mỗi sub-phase là một đoạn chat riêng.

### Ước tính token

- File kế hoạch gốc: ~40.500 ký tự → ~20.000 token (theo tỷ lệ từ 2–4 ký tự/token).
- Codebase thực tế (loại trừ `node_modules`/`dist`/`build`): ~33 MB, ~914 files.
- Các file nặng nhất liên quan multi-tenancy:
  - `services/supabaseService.ts`: ~138.000 ký tự
  - `App.tsx`: ~60.000 ký tự
  - `types.ts`: ~21.000 ký tự
  - `pages/`: ~1.230.000 ký tự
  - `components/`: ~1.240.000 ký tự

Vì vậy, bất kỳ phase nào phải chạm vào **toàn bộ `pages/`/`components/`**, hoặc viết **SQL cho hàng chục bảng**, hoặc sửa **service layer lớn** đều cần được chia nhỏ.

---

## 2. Mapping phase gốc → sub-phase

| Phase gốc | Tên | Vượt 250K? | Sub-phase đề xuất | Lý do chia |
|---|---|---|---|---|
| 0 | Chuẩn bị môi trường & backup | Không | Giữ nguyên | Chỉ thao tác infra, không đụng code nghiệp vụ. |
| 1 | Dọn dẹp bảo mật hiện tại | Không | Giữ nguyên | Ít file, ít SQL. |
| 2 | Tạo foundation multi-tenancy | Không | Giữ nguyên | Một nhóm bảng nhỏ, helper functions. |
| 3 | Thêm `tenant_id` vào toàn bộ bảng kinh doanh | **Có** (nếu làm 32 bảng cùng lúc) | 3.1 Core tables<br>3.2 Inventory & stock tables<br>3.3 Config & misc tables | 32 bảng, nếu cộng cả đọc schema + sửa types sẽ rất lớn. |
| 4 | Backfill dữ liệu hiện có | **Có** (SQL dài) | 4.1 Tạo tenant đầu + backfill core tables<br>4.2 Backfill remaining + orphan cleanup + FK | Có hàng chục câu UPDATE, backup orphan, thêm FK. |
| 5 | Helper functions + RLS policies chuẩn tenant | **Có** (cao nhất) | 5.1 Helper functions + `current_tenant_id()`<br>5.2 Core tables policies<br>5.3 Remaining tables policies + unique indexes | 32 bảng × 4 policies + indexes = output khổng lồ. |
| 6 | Sửa frontend nhận diện tenant | **Có** | 6.1 `TenantContext` + routing/subdomain<br>6.2 Custom fetch wrapper + service layer inject<br>6.3 `App.tsx` + global data loading<br>6.4 Page-level data loading + redirect/suspend | `supabaseService.ts` (~138K) + `App.tsx` (~60K) + nhiều page. |
| 7 | Thiết kế giới hạn và gói dịch vụ | Không | Giữ nguyên | Một nhóm trigger/function nhỏ. |
| 8 | Tạo admin dashboard | Không | Giữ nguyên | Một page + RPC. |
| 9 | Tạo Edge Functions | **Có** | 9.1 `create-tenant`<br>9.2 `invite-member`<br>9.3 `check-subdomain`<br>9.4 `reset-password`<br>9.5 `process-checkout`<br>9.6 `audit-log-writer` + rate limiting | Mỗi function có logic riêng, chia ra dễ test và tránh context dài. |
| 10 | Cập nhật RBAC trong DB và UI | **Có** | 10.1 DB policies theo role<br>10.2 UI permissions (menu, button, page guards) | Policies cho nhiều bảng + sửa nhiều UI. |
| 11 | Thêm audit log | Không | Giữ nguyên | Một bảng + trigger + page. |
| 12 | Bật TypeScript strict | **Có** | 12.1 Bật strict + fix core services/types<br>12.2 Fix pages<br>12.3 Fix components + final build | Phải đọc/sửa gần như toàn bộ codebase. |
| 13 | Viết tests | **Có** | 13.1 Unit tests tenant/auth/RLS<br>13.2 Integration tests tenant isolation<br>13.3 Smoke tests RBAC/subscription/offline | Nhiều nhóm test khác nhau. |
| 14 | Dọn dẹp codebase | Không | Giữ nguyên | Xóa file, dọn rác. |
| 15 | Test trên staging | Không | Giữ nguyên | Runbook, verify. |
| 16 | Deploy production | Không | Giữ nguyên | Deploy checklist. |
| 17 | Thiết lập vận hành dài hạn | Không | Giữ nguyên | Chủ yếu tài liệu + cron. |

---

## 3. Kế hoạch chi tiết sub-phase

### Phase 0: Chuẩn bị môi trường & backup (giữ nguyên)

**Mục tiêu:** Có nơi test an toàn, production được backup, CI pass.

| Bước | Cách làm | Output |
|---|---|---|
| 0.1 Tạo staging project | Supabase MCP `create_project` trong cùng org, region `ap-northeast-1` | Project staging |
| 0.2 Mirror dữ liệu staging | `supabase db dump` → restore vào staging | Staging có dữ liệu giống production |
| 0.3 Tạo nhánh git | `git checkout -b multi-tenant` từ `main` | Code isolation |
| 0.4 Thêm env staging | `.env.staging` | Chạy staging mode |
| 0.5 Backup production | `supabase db dump` hoặc dashboard backup | File backup timestamped |
| 0.6 Đảm bảo lint/build pass | `npm run lint` + `npm run build` | Build xanh |

---

### Phase 1: Dọn dẹp bảo mật hiện tại (giữ nguyên)

**Mục tiêu:** Xóa policy public, tắt self-registration, đóng social providers.

**Database:**
```sql
DROP POLICY IF EXISTS "Allow public access" ON public.products;
DROP POLICY IF EXISTS "Public Access" ON public.products;
-- Lặp lại cho tất cả bảng kinh doanh

CREATE POLICY "authenticated_full_access_temp"
ON public.products FOR ALL
TO authenticated
USING (true) WITH CHECK (true);
```

**Auth settings:**
- Tắt `Enable new users`
- Xóa social providers
- `Site URL` / `Redirect URLs` chứa `*.vietsalepro.com`

**Code:**
- `Login.tsx`: không có link đăng ký
- Không commit `VITE_SUPABASE_SERVICE_ROLE_KEY`

**Kiểm thử:**
- User đã đăng nhập vẫn thấy dữ liệu
- User chưa đăng nhập bị chặn
- `supabase.auth.signUp` bị từ chối

---

### Phase 2: Tạo foundation multi-tenancy (giữ nguyên)

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

> ** ponytail:** Chia 3 sub-phase vì danh sách 32 bảng, cộng với việc đọc schema và sửa `types.ts` sẽ dễ vượt context nếu làm một lần.

#### Sub-phase 3.1: Core business tables

**Bảng:** `products`, `customers`, `orders`, `order_items`, `suppliers`, `promotions`.

**Database:**
```sql
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.products ADD CONSTRAINT products_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_products_tenant_id ON public.products(tenant_id);
-- Lặp lại cho 5 bảng còn lại
```

**Code:**
- Thêm `tenant_id` vào interface của 6 bảng trong `types.ts`.

**Kiểm thử:**
- Các bảng trên đã có cột `tenant_id` và FK.

---

#### Sub-phase 3.2: Inventory & stock tables

**Bảng:** `import_receipts`, `import_items`, `inventory_counts`, `inventory_count_items`, `inventory_movements`, `disposals`, `disposal_items`, `product_lots`, `stock_movements`, `return_orders`, `return_order_items`, `supplier_exchanges`, `supplier_exchange_return_items`, `supplier_exchange_received_items`.

**Database:**
```sql
-- Mẫu cho từng bảng
ALTER TABLE public.import_receipts ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.import_receipts ADD CONSTRAINT import_receipts_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_import_receipts_tenant_id ON public.import_receipts(tenant_id);
-- Lặp lại cho 12 bảng còn lại
```

**Code:**
- Thêm `tenant_id` vào interface của 13 bảng trong `types.ts`.

**Kiểm thử:**
- Các bảng inventory đã có cột `tenant_id` và FK.

---

#### Sub-phase 3.3: Config & misc tables

**Bảng:** `app_settings`, `brands`, `categories`, `einvoice_config`, `einvoice_orders`, `point_history`, `processed_operations`, `rank_configs`, `rank_history`, `rewards`, `customer_payment_ledger`, `supplier_payment_ledger`.

**Database:**
```sql
-- Mẫu cho từng bảng
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_app_settings_tenant_id ON public.app_settings(tenant_id);
-- Lặp lại cho 11 bảng còn lại
```

**Code:**
- Thêm `tenant_id` vào interface của 12 bảng trong `types.ts`.

**Kiểm thử:**
- Các bảng config đã có cột `tenant_id` và FK.
- `types.ts` không còn lỗi TS.

---

### Phase 4: Backfill dữ liệu hiện có

> ** ponytail:** Chia 2 sub-phase vì phần SQL có hàng chục câu UPDATE + backup orphan + thêm FK.

#### Sub-phase 4.1: Tạo tenant đầu + backfill core tables

**Mục tiêu:** Dữ liệu cũ thuộc về tenant đầu tiên; xử lý core tables trước.

**Database:**
```sql
-- Tạo tenant đầu tiên
INSERT INTO public.tenants (id, name, subdomain, status, plan, owner_id)
SELECT gen_random_uuid(), 'Cửa hàng chính', 'main', 'active', 'vip', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE subdomain = 'main');

-- Tạo subscription cho tenant đầu tiên (VIP không giới hạn)
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

-- Backfill core tables
DO $$
DECLARE v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants WHERE subdomain = 'main';
  UPDATE public.products SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.customers SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.suppliers SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.orders SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.order_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.promotions SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
END $$;

-- Set NOT NULL core
ALTER TABLE public.products ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.customers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.suppliers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.order_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.promotions ALTER COLUMN tenant_id SET NOT NULL;
```

**Kiểm thử:**
- `SELECT count(*) FROM products WHERE tenant_id IS NULL` = 0
- `tenant_memberships` có admin cho mỗi user hiện có
- `tenant_subscriptions` có row cho tenant đầu tiên với plan = 'vip'

---

#### Sub-phase 4.2: Backfill remaining tables + orphan cleanup + FK

**Database:**
```sql
-- Backfill remaining tables
DO $$
DECLARE v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants WHERE subdomain = 'main';
  UPDATE public.app_settings SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.brands SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.categories SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
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
  UPDATE public.point_history SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.processed_operations SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.product_lots SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.rank_configs SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.rank_history SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.return_order_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.return_orders SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.rewards SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.stock_movements SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.supplier_exchange_received_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.supplier_exchange_return_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.supplier_exchanges SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.supplier_payment_ledger SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
END $$;

-- Set NOT NULL remaining
ALTER TABLE public.app_settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.brands ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.customer_payment_ledger ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.disposal_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.disposals ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.einvoice_config ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.einvoice_orders ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.import_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.import_receipts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.inventory_count_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.inventory_counts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.inventory_movements ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.point_history ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.processed_operations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.product_lots ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.rank_configs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.rank_history ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.return_order_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.return_orders ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.rewards ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.stock_movements ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.supplier_exchange_received_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.supplier_exchange_return_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.supplier_exchanges ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.supplier_payment_ledger ALTER COLUMN tenant_id SET NOT NULL;

-- Backup orphan records
CREATE TABLE IF NOT EXISTS public.orphan_records_backup (
  table_name TEXT,
  backed_up_at TIMESTAMPTZ DEFAULT now(),
  data JSONB
);

-- ponytail: backup các record mồ côi ở bảng cha-con trước khi thêm FK.
INSERT INTO public.orphan_records_backup (table_name, data)
SELECT 'order_items', to_jsonb(t.*) FROM public.order_items t WHERE order_id IS NULL;
INSERT INTO public.orphan_records_backup (table_name, data)
SELECT 'import_items', to_jsonb(t.*) FROM public.import_items t WHERE import_receipt_id IS NULL;
INSERT INTO public.orphan_records_backup (table_name, data)
SELECT 'product_lots', to_jsonb(t.*) FROM public.product_lots t WHERE product_id IS NULL;
INSERT INTO public.orphan_records_backup (table_name, data)
SELECT 'return_order_items', to_jsonb(t.*) FROM public.return_order_items t WHERE return_order_id IS NULL;
INSERT INTO public.orphan_records_backup (table_name, data)
SELECT 'inventory_count_items', to_jsonb(t.*) FROM public.inventory_count_items t WHERE inventory_count_id IS NULL;
INSERT INTO public.orphan_records_backup (table_name, data)
SELECT 'disposal_items', to_jsonb(t.*) FROM public.disposal_items t WHERE disposal_id IS NULL;
INSERT INTO public.orphan_records_backup (table_name, data)
SELECT 'supplier_exchange_return_items', to_jsonb(t.*) FROM public.supplier_exchange_return_items t WHERE supplier_exchange_id IS NULL;
INSERT INTO public.orphan_records_backup (table_name, data)
SELECT 'supplier_exchange_received_items', to_jsonb(t.*) FROM public.supplier_exchange_received_items t WHERE supplier_exchange_id IS NULL;

-- Delete orphan records
DELETE FROM public.order_items WHERE order_id IS NULL;
DELETE FROM public.import_items WHERE import_receipt_id IS NULL;
DELETE FROM public.product_lots WHERE product_id IS NULL;
DELETE FROM public.return_order_items WHERE return_order_id IS NULL;
DELETE FROM public.inventory_count_items WHERE inventory_count_id IS NULL;
DELETE FROM public.disposal_items WHERE disposal_id IS NULL;
DELETE FROM public.supplier_exchange_return_items WHERE supplier_exchange_id IS NULL;
DELETE FROM public.supplier_exchange_received_items WHERE supplier_exchange_id IS NULL;

-- Add missing FKs (NO ACTION: không cho xóa lô nếu còn tham chiếu)
ALTER TABLE public.order_items ADD CONSTRAINT order_items_lot_id_fkey
  FOREIGN KEY (lot_id) REFERENCES public.product_lots(id) ON DELETE NO ACTION;
ALTER TABLE public.return_order_items ADD CONSTRAINT return_order_items_lot_id_fkey
  FOREIGN KEY (lot_id) REFERENCES public.product_lots(id) ON DELETE NO ACTION;
ALTER TABLE public.import_items ADD CONSTRAINT import_items_lot_id_fkey
  FOREIGN KEY (lot_id) REFERENCES public.product_lots(id) ON DELETE NO ACTION;
```

**Kiểm thử:**
- `SELECT count(*) FROM products WHERE tenant_id IS NULL` = 0
- Không còn record mồ côi trong tất cả bảng cha-con đã liệt kê
- Có FK trên 3 bảng con (order_items, return_order_items, import_items.lot_id)
- Tenant đầu tiên có subscription row với plan = 'vip'

---

### Phase 5: Helper functions + RLS policies chuẩn tenant

> ** ponytail:** Đây là phase có khả năng vượt context nhất vì phải viết policies cho 32 bảng. Chia thành 3 sub-phase.

#### Sub-phase 5.1: Helper functions + custom fetch wrapper

**Mục tiêu:** `current_tenant_id()` từ header, `lib/tenant.ts`, `lib/supabase.ts` inject header.

**Database:**
```sql
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_header TEXT;
  v_tenant_id UUID;
BEGIN
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
```

**Code:**
```ts
// lib/tenant.ts
export const getSubdomain = () => {
  const host = window.location.host;
  // ponytail: localhost/dev dùng tenant 'main' để dev/test, không phá vỡ logic production.
  if (host.includes('localhost') || host.includes('127.0.0.1')) return 'main';
  const parts = host.split('.');
  if (parts.length >= 3 && parts[parts.length - 2] === 'vietsalepro') return parts[0];
  return null;
};

export const getTenantId = async () => {
  // ponytail: không cache trong localStorage; tenant_id luôn lấy từ subdomain runtime.
  const subdomain = getSubdomain();
  if (!subdomain) return null;
  const { data } = await supabase.rpc('get_tenant_by_subdomain', { p_subdomain: subdomain });
  return data?.id || null;
};

// lib/supabase.ts
let currentTenantId: string | null = null;
export const setCurrentTenantId = (tenantId: string | null) => { currentTenantId = tenantId; };
export const getCurrentTenantId = () => currentTenantId;

const tenantFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);
  if (currentTenantId) headers.set('x-tenant-id', currentTenantId);
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: tenantFetch } });
```

**Kiểm thử:**
- Header `x-tenant-id` được gửi kèm request.

---

#### Sub-phase 5.2: RLS policies — core tables

**Bảng:** `products`, `customers`, `orders`, `order_items`, `suppliers`.

**Mẫu policy:**
```sql
CREATE POLICY "tenant_isolation_select" ON public.products FOR SELECT TO authenticated
USING ((tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id)) OR public.is_system_admin());

CREATE POLICY "tenant_isolation_insert" ON public.products FOR INSERT TO authenticated
WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id));

CREATE POLICY "tenant_isolation_update" ON public.products FOR UPDATE TO authenticated
USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id))
WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id));

CREATE POLICY "tenant_isolation_delete" ON public.products FOR DELETE TO authenticated
USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_admin(tenant_id));
```

**Lặp lại cho 4 bảng còn lại.**

**Kiểm thử:**
- User ở tenant A chỉ thấy dữ liệu tenant A
- Truy vấn tenant B trả về 0 row
- Insert với tenant_id khác bị từ chối

---

#### Sub-phase 5.3: RLS policies — remaining tables + unique indexes

**Bảng:** 27 bảng còn lại (inventory, config, misc).

**Database:**
```sql
-- Lặp lại policy template cho từng bảng
-- products unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_per_tenant
  ON public.products (tenant_id, sku) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_per_tenant
  ON public.products (tenant_id, barcode) WHERE barcode IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_code_per_tenant
  ON public.orders (tenant_id, order_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_einvoice_orders_invoice_number_per_tenant
  ON public.einvoice_orders (tenant_id, invoice_number);
```

**Kiểm thử:**
- Tất cả bảng kinh doanh có RLS policies.
- SKU/barcode/order_code/invoice_number unique theo tenant.

---

### Phase 6: Sửa frontend nhận diện tenant

> ** ponytail:** `supabaseService.ts` ~138K chars, `App.tsx` ~60K chars. Chia 4 sub-phase để tránh đọc quá nhiều file cùng lúc.

#### Sub-phase 6.1: TenantContext + routing/subdomain

**Mục tiêu:** Subdomain → tenant, load tenant/membership, xử lý 404/suspended.

**Code:**
```tsx
// contexts/TenantContext.tsx
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTenant = async () => {
      setIsLoading(true);
      try {
        const subdomain = getSubdomain();
        if (!subdomain) {
          setTenant(null);
          setCurrentTenantId(null);
          return;
        }
        const t = await tenantService.getTenantBySubdomain(subdomain);
        if (t) {
          setTenant(t);
          setCurrentTenantId(t.id);
          if (user) {
            const m = await tenantService.getMembership(t.id, user.id);
            setMembership(m);
          }
        } else {
          setTenant(null);
          setCurrentTenantId(null);
        }
      } finally {
        setIsLoading(false);
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

**Logic:**
- Subdomain `admin` hoặc root domain → không cần resolve tenant; routing riêng cho SystemAdminDashboard/LandingPage.
- Subdomain khác không tồn tại trong `tenants` → redirect `vietsalepro.com` hoặc 404.
- Tenant suspended → trang "Tài khoản đã bị tạm dừng".
- User không thuộc tenant → trang "Bạn không có quyền truy cập cửa hàng này".

**Kiểm thử:**
- Subdomain không tồn tại → 404
- Tenant suspended → chặn đăng nhập
- User không thuộc tenant → không vào được

---

#### Sub-phase 6.2: Custom fetch wrapper + service layer inject

**Mục tiêu:** Mọi request tự động gắn `x-tenant-id`; mọi `insert/update` trong `services/supabaseService.ts` gắn `tenant_id`.

**Code:**
- Hoàn thiện `lib/supabase.ts` (xem sub-phase 5.1).
- Rà soát `services/supabaseService.ts`:
  1. Thêm `tenantId` vào các mapper `mapXxxToDB` (ví dụ `mapProductToDB`, `mapOrderToDB`).
  2. Các hàm `insert`/`update` gọi mapper với `tenantId` lấy từ `TenantContext` hoặc `getCurrentTenantId()`.
  3. Không cho phép client ghi đè `tenant_id` từ object đầu vào; service luôn inject.

Ví dụ:
```ts
const mapProductToDB = (item: Product, tenantId: string) => ({
  // ... các trường cũ ...
  tenant_id: tenantId,
});

export const createProduct = async (product: Product) => {
  const tenantId = getCurrentTenantId();
  if (!tenantId) throw new Error('Chưa chọn tenant');
  const { data, error } = await supabase
    .from('products')
    .insert(mapProductToDB(product, tenantId))
    .select()
    .single();
  // ...
};
```
- Các hàm `update` chỉ cập nhật fields được truyền; không bao gồm `tenant_id` trong object update (RLS đã kiểm tra tenant).
- `processed_operations` / offline queue: khi tạo queued operation, lưu `tenant_id` cùng operation; khi sync chỉ sync operation của tenant hiện tại.
- Chỉ sửa trong phạm vi các hàm CRUD chuẩn, không chạm logic nghiệp vụ phức tạp.

**Kiểm thử:**
- Tạo sản phẩm mới có `tenant_id` đúng.
- Gọi API từ subdomain khác không thấy dữ liệu.
- Mapper không chấp nhận `tenant_id` từ input object.

---

#### Sub-phase 6.3: App.tsx + global data loading

**Mục tiêu:** Bọc `TenantProvider` trong `App.tsx`, load data theo tenant.

**Code:**
```tsx
<AuthProvider>
  <TenantProvider>
    <AppContent />
  </TenantProvider>
</AuthProvider>
```

- Sửa `App.tsx` load data: thêm `tenantId` vào dependency của `useEffect`.
- Đảm bảo các global load chỉ chạy khi tenant đã xác định.

**Kiểm thử:**
- Chuyển subdomain thấy dữ liệu khác.
- Đăng nhập vào tenant A, sau đó mở subdomain B → không thấy dữ liệu A.

---

#### Sub-phase 6.4: Page-level data loading

**Mục tiêu:** Sửa các page cần load data để nhận `tenantId` từ `TenantContext`.

**Code:**
- Tạo hook `useTenant()` để lấy `tenant`, `membership`, `role`.
- Sửa các page chính: POS, orders, products, customers, reports, inventory.
- Ưu tiên sửa các `useEffect` fetch data: thêm `tenantId` vào dependency array.

**Kiểm thử:**
- Mỗi page chỉ hiển thị dữ liệu của tenant hiện tại.

---

### Phase 7: Thiết kế giới hạn và gói dịch vụ (giữ nguyên)

**Mục tiêu:** 2 gói Free/VIP, giới hạn SKU, đơn/tháng, user.

**Database:**
```sql
CREATE OR REPLACE FUNCTION public.check_tenant_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_current INTEGER;
  v_max INTEGER;
BEGIN
  -- ponytail: kiểm tra tenant tồn tại và đang active trước khi kiểm tra giới hạn.
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
    IF v_current >= v_max THEN RAISE EXCEPTION 'Đã đạt giới hạn số user của gói dịch vụ'; END IF;
  ELSIF TG_TABLE_NAME = 'products' THEN
    SELECT count(*) INTO v_current FROM public.products WHERE tenant_id = NEW.tenant_id;
    v_max := v_sub.max_products;
    IF v_current >= v_max THEN RAISE EXCEPTION 'Đã đạt giới hạn số sản phẩm của gói dịch vụ'; END IF;
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
  -- ponytail: kiểm tra tenant active và subscription tồn tại trước khi tăng counter.
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

**Lưu ý quan trọng:**
- ponytail: các trigger `check_tenant_limits` và `increment_monthly_order_count` đọc count rồi so sánh. Với nhiều request đồng thời, có thể vượt giới hạn một vài đơn. Ở giai đoạn đầu (Free/VIP đơn giản) chấp nhận được; nếu sau này cần chính xác tuyệt đối, chuyển sang dùng advisory lock hoặc serializable transaction.
- Đảm bảo mỗi tenant luôn có row trong `tenant_subscriptions` khi tạo (xem Phase 9.1).

**Gói dịch vụ:**
| Gói | SKU | Đơn/tháng | User |
|---|---|---|---|
| Free | 50 | 300 | 1 |
| VIP | 999.999 | 999.999 | 999 |

Lưu ý khi triển khai:

Trigger write_audit_log tự động chỉ ghi INSERT/UPDATE/DELETE với old_data/new_data.
Cột ip_address và user_agent trong bảng app_audit_log chỉ được điền khi ghi log thủ công.
Các sự kiện LOGIN, LOGOUT, EXPORT phải gọi services/auditService.ts và truyền IP/user agent từ Edge Function hoặc để NULL. 

**Kiểm thử:**
- Free tenant không thêm user thứ 2
- Free tenant không thêm sản phẩm thứ 51
- Free tenant tạo đơn thứ 301 bị từ chối

---

### Phase 8: Tạo admin dashboard cho chủ hệ thống (giữ nguyên)

**Mục tiêu:** Trang `admin.vietsalepro.com` để tạo/sửa/suspend cửa hàng.

**Code:**
- `pages/SystemAdminDashboard.tsx`
- Route `/admin/*` hoặc subdomain `admin.vietsalepro.com`

**Database:**
- RPC `create_tenant_with_admin`
- RPC `update_tenant_status`

**Security:**
- Chỉ `system_admins` truy cập

**Kiểm thử:**
- System admin tạo tenant
- User thường không vào được admin dashboard

---

### Phase 9: Tạo Edge Functions

> ** ponytail:** 6 functions riêng biệt; chia từng function để dễ test và tránh context dài.

**Cấu trúc chung mỗi Edge Function:**
```
supabase/
  functions/
    create-tenant/
      index.ts
      deno.json (nếu cần)
    invite-member/
      index.ts
    check-subdomain/
      index.ts
    reset-password/
      index.ts
    process-checkout/
      index.ts
    audit-log/
      index.ts
```

**Mẫu khởi tạo Supabase admin client trong Edge Function:**
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
```

**Lưu ý:** `SUPABASE_SERVICE_ROLE_KEY` chỉ tồn tại trong env Edge Function, không bao giờ lộ ra frontend.

#### Sub-phase 9.1: `create-tenant`

**Mục tiêu:** System admin tạo tenant + admin user.

**Output:**
- `supabase/functions/create-tenant/index.ts`
- RPC `create_tenant_with_admin` (nếu cần)

**Logic:**
- Rate limiting: 10 request/phút/IP (dùng `rate_limit_logs`).
- Kiểm tra caller là system admin (qua `system_admins`).
- Validate subdomain: chỉ chữ thường, số, dấu gạng ngang; độ dài 3-63; không trùng reserved (`admin`, `www`, `api`, `app`).
- Kiểm tra subdomain chưa tồn tại trong `public.tenants`.
- Tạo user admin trong `auth.users` bằng `supabase.auth.admin.createUser({ email, password, email_confirm: true })`.
- Tạo tenant trong `public.tenants` với `owner_id` = user admin vừa tạo.
- Tạo subscription trong `public.tenant_subscriptions` theo gói được chọn (free/vip).
- Tạo membership admin trong `public.tenant_memberships`.
- Ghi audit log `INSERT` vào `public.app_audit_log` (nếu trigger chưa gắn hoặc ghi thủ công).
- Trả về `{ tenant, adminUser, initialPassword }`.

**Kiểm thử:**
- System admin tạo tenant qua Edge Function.
- Subdomain không hợp lệ bị từ chối.
- Tenant mới có subscription row.

---

#### Sub-phase 9.2: `invite-member`

**Mục tiêu:** Admin tenant mời nhân viên.

**Output:**
- `supabase/functions/invite-member/index.ts`

**Logic:**
- Rate limiting: 10 request/phút/IP.
- Kiểm tra caller là admin của tenant (qua `tenant_memberships` role = 'admin').
- Kiểm tra giới hạn số user trong `tenant_subscriptions`.
- Nếu email đã tồn tại trong `auth.users`:
  - Kiểm tra user chưa thuộc tenant (tránh duplicate membership).
  - Thêm `tenant_memberships` với role được giao.
- Nếu email chưa tồn tại:
  - Tạo user mới bằng `supabase.auth.admin.createUser({ email, password: crypto.randomUUID(), email_confirm: false })`.
  - Gửi password reset link qua `supabase.auth.admin.generateLink('recovery', email, { redirect_to: https://{subdomain}.vietsalepro.com/set-password })` để user tự đặt mật khẩu.
  - Thêm `tenant_memberships` với role được giao.
- Ghi audit log.
- Trả về `{ success: true, userId }`.

**Kiểm thử:**
- Invite member qua email.
- User đã tồn tại được thêm membership.
- Vượt giới hạn số user bị từ chối.
Lưu ý khi triển khai:

Vì self-registration đã tắt, user mới không thể tự đăng ký.
Edge Function phải:
Tạo user với password tạm thời ngẫu nhiên: createUser({ email, password: crypto.randomUUID(), email_confirm: false }).
Gửi recovery link về đúng subdomain để user tự đặt mật khẩu.
Thêm tenant_memberships.
Không được lưu password tạm vào DB hay log ra bất kỳ đâu.
---

#### Sub-phase 9.3: `check-subdomain`

**Mục tiêu:** Kiểm tra subdomain có sẵn.

**Output:**
- `supabase/functions/check-subdomain/index.ts`
- Rate limiting 10 request/phút/IP.

**Kiểm thử:**
- Subdomain tồn tại → trả về `false`
- Subdomain trống → trả về `true`

---

#### Sub-phase 9.4: `reset-password`

**Mục tiêu:** Admin/system admin reset/invite password cho nhân viên.

**Output:**
- `supabase/functions/reset-password/index.ts`

**Logic:**
- Kiểm tra caller là admin của tenant hoặc system admin.
- Kiểm tra user thuộc tenant (qua `tenant_memberships`).
- Nếu user đã từng đăng nhập: gọi `supabase.auth.admin.generateLink('recovery', email, { redirect_to: https://{subdomain}.vietsalepro.com/reset-password })`.
- Nếu user mới chưa đăng nhập: gọi `generateLink('invite', email, { redirect_to: https://{subdomain}.vietsalepro.com/set-password })`.
- Gửi email thông qua email provider mặc định của Supabase.

**Kiểm thử:**
- Reset password redirect về đúng subdomain.
- User mới nhận invite link về đúng subdomain.

---

#### Sub-phase 9.5: `process-checkout`

**Mục tiêu:** Cập nhật từ RPC hiện tại để xử lý tenant.

**Output:**
- `supabase/functions/process-checkout/index.ts`

**Logic:**
- Nhận `x-tenant-id` hoặc `x-subdomain`.
- Xử lý đơn hàng, cập nhật tồn kho, điểm thưởng trong phạm vi tenant.

**Kiểm thử:**
- Tạo đơn hàng qua Edge Function.

---

#### Sub-phase 9.6: `audit-log-writer` + rate limiting

**Mục tiêu:** Ghi audit log và thiết lập rate limiting.

**Output:**
- `supabase/functions/audit-log/index.ts`
- Bảng `rate_limit_logs`

**Database:**
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

**Quy tắc:**
- Đăng nhập sai ≥ 5 lần/15 phút/IP → lockout tạm thời.
- Tạo tenant / check subdomain / mời nhân viên: 10 request/phút/IP.
- Dọn dữ liệu cũ > 24h bằng Supabase cron extension hoặc Edge Function scheduled.

**Lưu ý về rate limiting đăng nhập:**
- Supabase Auth client-side không cho app can thiệp trước khi gửi request. Có 2 phương án:
  1. **Ưu tiên:** Triển khai custom login Edge Function (`supabase/functions/login`) để kiểm soát hoàn toàn, rồi frontend gọi function này thay vì `supabase.auth.signInWithPassword`.
  2. **Đơn giản hơn:** Frontend tracking số lần sai local + Cloudflare rate limiting ở edge. Hạn chế: dễ bypass nếu attacker đổi IP.
- Chọn phương án 1 nếu cần bảo mật chặt chẽ; chọn phương án 2 nếu cần triển khai nhanh.

**Kiểm thử:**
- Rate limiting chặn brute-force login và spam tạo tenant.

---

### Phase 10: Cập nhật RBAC trong DB và UI

> ** ponytail:** Chia DB policies và UI để tránh đọc đồng thời nhiều page/component.
Lưu ý khi triển khai:

Phase 5 tạo policy tenant_isolation_insert cho phép mọi member của tenant insert.
Phase 10 tạo policy orders_insert_by_role chỉ cho phép admin/cashier insert.
PostgreSQL kết hợp các policy bằng OR → nếu không DROP POLICY generic, nhân viên vẫn insert được.
Phải làm: Trong migration Phase 10, chạy DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.orders; (và update/delete) trước khi tạo policy mới.

#### Sub-phase 10.1: DB policies theo role

**Mục tiêu:** 4 role, policies theo role.

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
-- Bảng chỉ cần tenant isolation (ví dụ order_items) thì giữ nguyên.

-- ORDERS: admin/cashier được tạo; chỉ admin được sửa/xóa
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.orders;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.orders;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.orders;

CREATE POLICY "orders_insert_by_role" ON public.orders FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(tenant_id) IN ('admin', 'cashier')
);

CREATE POLICY "orders_update_by_role" ON public.orders FOR UPDATE TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(tenant_id) = 'admin'
)
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(tenant_id) = 'admin'
);

CREATE POLICY "orders_delete_admin_only" ON public.orders FOR DELETE TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(tenant_id) = 'admin'
);

-- PRODUCTS: admin/inventory_manager được tạo; chỉ admin được sửa/xóa
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.products;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.products;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.products;

CREATE POLICY "products_insert_by_role" ON public.products FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(tenant_id) IN ('admin', 'inventory_manager')
);

CREATE POLICY "products_update_by_role" ON public.products FOR UPDATE TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(tenant_id) = 'admin'
)
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(tenant_id) = 'admin'
);

CREATE POLICY "products_delete_admin_only" ON public.products FOR DELETE TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_member(tenant_id)
  AND public.user_tenant_role(tenant_id) = 'admin'
);

-- IMPORT_RECEIPTS, INVENTORY_COUNTS, DISPOSALS: admin/inventory_manager được tạo; chỉ admin được sửa/xóa
-- Pattern tương tự products; lặp lại cho các bảng này.

-- CUSTOMERS: admin/cashier tạo; chỉ admin sửa/xóa
-- Pattern tương tự orders.

-- SUPPLIERS: admin/inventory_manager tạo; chỉ admin sửa/xóa

-- APP_SETTINGS, EINVOICE_CONFIG, RANK_CONFIGS: chỉ admin tạo/sửa/xóa

-- BÁO CÁO / CÔNG NỢ: dữ liệu báo cáo thường là aggregation từ nhiều bảng.
-- Cách 1: giữ SELECT policy ở Phase 5 cho tất cả member, hạn chế ở UI (đơn giản).
-- Cách 2: tạo view/RPC riêng cho báo cáo với policy chỉ admin/accountant (bảo mật chặt).
-- Chọn cách 2 nếu cần đảm bảo cashier/inventory_manager không đọc dữ liệu báo cáo qua API.
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

**Kiểm thử:**
- Cashier tạo đơn thành công; cashier sửa/xóa đơn bị từ chối.
- Accountant tạo/sửa đơn bị từ chối; accountant xem báo cáo thành công.
- Inventory_manager tạo nhập hàng thành công; inventory_manager sửa/xóa đơn nhập bị từ chối; inventory_manager tạo đơn bị từ chối.
- Admin thực hiện tất cả thao tác.
- Chỉ admin được sửa/xóa products/orders/import_receipts.

---

#### Sub-phase 10.2: UI permissions

**Mục tiêu:** Menu ẩn/hiện, button disabled theo quyền.

**Code:**
- `hooks/usePermissions.ts`:
```ts
export const usePermissions = () => {
  const { role } = useTenant();
  return {
    canCreateOrder: role === 'admin' || role === 'cashier',
    canUpdateOrder: role === 'admin',
    canDeleteOrder: role === 'admin',
    canCreateProduct: role === 'admin' || role === 'inventory_manager',
    canUpdateProduct: role === 'admin',
    canDeleteProduct: role === 'admin',
    canManageInventory: role === 'admin' || role === 'inventory_manager',
    canViewReports: role === 'admin' || role === 'accountant',
    canManageUsers: role === 'admin',
    canDeleteRecord: role === 'admin',
  };
};
```
- Sửa `AppShell`/`BottomNav`: ẩn menu nhập hàng/báo cáo/quản lý user nếu role không có quyền.
- Sửa các page: disable/hide button tạo/xóa/sửa theo `usePermissions()`.

**Kiểm thử:**
- Cashier không thấy menu nhập hàng/báo cáo/quản lý user.
- Accountant không thấy nút tạo đơn/nhập hàng.
- Inventory_manager không thấy menu báo cáo/POS.

---

### Phase 11: Thêm audit log (giữ nguyên)

**Mục tiêu:** Ghi log các thao tác quan trọng.

**Database:**
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
```

**Database (tiếp theo):** Gắn trigger cho các bảng quan trọng:
```sql
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
- `services/auditService.ts`: hàm `writeAuditLog` để ghi thủ công các sự kiện không có trigger (`LOGIN`, `LOGOUT`, `EXPORT`). Hàm này cũng điền `ip_address` và `user_agent` từ request headers (chỉ khi gọi từ Edge Function) hoặc để NULL nếu không có.
- Page xem audit log (chỉ admin/system admin).
- Trong `AuthContext`: gọi `writeAuditLog('LOGIN')` sau đăng nhập thành công và `writeAuditLog('LOGOUT')` trước sign out.
- Lưu ý: trigger tự động không điền `ip_address`/`user_agent` vì trong PostgreSQL trigger không dễ lấy thông tin request; các log thủ công mới điền.

**Kiểm thử:**
- Mỗi thao tác quan trọng tạo 1 log row.
- Chỉ admin/system admin xem được log.
- DELETE log ghi đúng old_data, new_data = NULL.
- INSERT log ghi đúng new_data, old_data = NULL.
Lưu ý khi triển khai:

Trigger write_audit_log tự động chỉ ghi INSERT/UPDATE/DELETE với old_data/new_data.
Cột ip_address và user_agent trong bảng app_audit_log chỉ được điền khi ghi log thủ công.
Các sự kiện LOGIN, LOGOUT, EXPORT phải gọi services/auditService.ts và truyền IP/user agent từ Edge Function hoặc để NULL.
---

### Phase 12: Bật TypeScript strict

> ** ponytail:** Toàn bộ codebase lớn; chia theo layer để dễ kiểm soát lỗi từng bước.

#### Sub-phase 12.1: Bật strict + fix core services/types

**Mục tiêu:** Bật `strict: true` trong `tsconfig.json`, fix lỗi trong `services/`, `types.ts`, `utils/`, `hooks/`.

**Code:**
- `tsconfig.json`: `"strict": true`
- Fix `services/supabaseService.ts` (chỉ phần CRUD cơ bản, không chạm logic nghiệp vụ sâu).
- Fix `types.ts`, `utils/`, `hooks/`.

**Kiểm thử:**
- `npm run lint` pass
- `npm run build` pass

---

#### Sub-phase 12.2: Fix pages

**Mục tiêu:** Fix lỗi TypeScript trong `pages/`.

**Code:**
- Sửa từng page để pass `strict`.
- Ưu tiên các page POS, orders, products, customers.

**Kiểm thử:**
- `npm run lint` pass
- `npm run build` pass

---

#### Sub-phase 12.3: Fix components + final build

**Mục tiêu:** Fix lỗi TypeScript trong `components/`.

**Code:**
- Sửa từng component để pass `strict`.
- Chạy `npm run build` cuối cùng.

**Kiểm thử:**
- `npm run lint` pass
- `npm run build` pass

---

### Phase 13: Viết tests

> ** ponytail:** Tests nhiều nhóm; chia 3 sub-phase để mỗi đoạn chat tập trung một loại test.

**Setup trước khi viết tests:**
```bash
npm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```
- Thêm script `"test": "vitest"` vào `package.json`.
- Tạo `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```
- Tạo `tests/setup.ts` để mock `window.matchMedia`, `localStorage`, v.v.
- Mock Supabase client cho unit tests để không gọi production.

#### Sub-phase 13.1: Unit tests — tenant/auth/RLS

**Mục tiêu:** Test cơ chế tenant, auth, membership, RLS cơ bản.

**Output:**
- `tests/tenant.test.ts`
- `tests/rls.test.ts`

**Kiểm thử:**
- Tạo tenant, user, membership
- Truy vấn cross-tenant trả về 0 row
- Insert với tenant_id sai bị từ chối

---

#### Sub-phase 13.2: Integration tests — tenant isolation

**Mục tiêu:** Test cách ly dữ liệu giữa các tenant.

**Output:**
- `tests/integration/tenant-isolation.test.ts`

**Kiểm thử:**
- Tenant A tạo products/orders
- Tenant B không thấy products/orders của tenant A
- Subdomain đổi → tenant đổi

---

#### Sub-phase 13.3: Smoke tests — RBAC/subscription/offline

**Mục tiêu:** Test luồng nghiệp vụ đầu cuối.

**Output:**
- `tests/smoke/rbac.test.ts`
- `tests/smoke/subscription.test.ts`
- `tests/smoke/offline-tenant.test.ts`

**Kiểm thử:**
- Cashier không xóa đơn
- Free tenant đạt giới hạn user/sản phẩm/đơn hàng
- Offline queue cách ly theo tenant

---

### Phase 14: Dọn dẹp codebase

**Mục tiêu:** Xóa file rác, backup tables không cần thiết, chuẩn hóa error handling.

**Database:**
```sql
-- ponytail: chỉ chạy sau khi smoke test production pass và đã backup.
DROP TABLE IF EXISTS public.backup_products_pre_phase2;
DROP TABLE IF EXISTS public.backup_product_lots_pre_phase2;
DROP TABLE IF EXISTS public.backup_stock_movements_pre_phase2;
DROP TABLE IF EXISTS public.backup_stock_ledger_meta;
DROP TABLE IF EXISTS public.stock_movements_backup_phase6;
DROP TABLE IF EXISTS public.import_items_backup_phase3a;
DROP TABLE IF EXISTS public.import_receipts_backup_phase3a;
DROP TABLE IF EXISTS public.products_backup_phase3a;
DROP TABLE IF EXISTS public.product_lots_backup_phase3a;
DROP TABLE IF EXISTS public.orphan_records_backup;
```

**Code:**
- Xóa `components/MobilePOS.backup.tsx` (nếu còn).
- Xóa `memory-zone/.temp/phase*/fixed_*.sql` đã deploy.
- Xóa thư mục `OLD` nếu không cần nữa.
- Xóa các file test tạm, console.log, dead code.
- Chuẩn hóa error handling với `AppError` class.

**Kiểm thử:**
- `npm run lint` pass
- `npm run build` pass
- Không còn file/import thừa

---

### Phase 15: Test trên staging (giữ nguyên)

**Mục tiêu:** Chạy đầy đủ trên staging trước khi deploy production.

**Checklist:**
- [ ] Tạo 3 tenants: `store-a`, `store-b`, `store-c`
- [ ] Mỗi tenant có 1 admin, 1 cashier, 1 inventory_manager, 1 accountant
- [ ] Đăng nhập tenant A/B; tạo dữ liệu ở A, B không thấy dữ liệu A
- [ ] Cashier tenant A không đăng nhập được tenant B
- [ ] Suspend tenant C → không đăng nhập được
- [ ] Subdomain `khongtontai.vietsalepro.com` → 404
- [ ] RBAC đúng: cashier không xóa đơn, accountant không tạo đơn, inventory_manager không xem báo cáo
- [ ] Storage RLS: tenant A không đọc/xóa được file của tenant B
- [ ] Subscription limits: Free tenant bị chặn khi vượt user/SKU/đơn hàng
- [ ] Password reset redirect về đúng subdomain
- [ ] Rate limiting: lockout sau 5 lần đăng nhập sai, chặn spam tạo tenant
- [ ] Offline sync đúng tenant
- [ ] Audit log hoạt động và chỉ admin/system admin xem được
- [ ] Backup/restore test pass

---

### Phase 16: Deploy production

**Mục tiêu:** DNS/hosting/SSL, Storage RLS, migration, deploy, smoke test.

#### 16.1 DNS & Hosting (Cloudflare Pages)

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

#### 16.2 Storage RLS

Tạo bucket `tenant-assets` dùng chung cho tất cả tenant (scale tốt đến 1000+ cửa hàng):

```sql
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

#### 16.3 Deploy checklist

- [ ] Backup production
- [ ] Chạy migration từ Phase 1 → Phase 13 (chưa xóa backup tables để còn khả năng rollback)
- [ ] Backfill dữ liệu
- [ ] Deploy frontend
- [ ] Kiểm tra DNS resolution cho `*.vietsalepro.com`
- [ ] Smoke test
- [ ] Nếu smoke test pass → chạy Phase 14 (dọn dẹp backup tables)
- [ ] Theo dõi lỗi 24h

---

### Phase 17: Thiết lập vận hành dài hạn

**Mục tiêu:** Backup, retention, monitoring, cron, tài liệu vận hành.

**Database:**
- Archive đơn hàng > 2 năm:
```sql
CREATE TABLE public.orders_archive (LIKE public.orders INCLUDING ALL);
-- Chỉ cần các cột cần thiết, bỏ FK để tránh dependency.
```
- Partition `app_audit_log` theo tháng (khi dữ liệu lớn):
```sql
CREATE TABLE public.app_audit_log_partitioned (
  LIKE public.app_audit_log INCLUDING ALL
) PARTITION BY RANGE (created_at);
-- ponytail: chuyển partition cần migration nhỏ; làm khi audit log đạt ~10M rows.
```
- Clean dữ liệu cũ bằng cron:
```sql
SELECT cron.schedule('data-retention-daily', '0 3 * * *', $$
  CALL public.run_data_retention();
$$);
```
- `run_data_retention()` cần thực hiện:
  - Archive đơn hàng > 2 năm.
  - Clean `processed_operations` cũ > 90 ngày.
  - Clean `rate_limit_logs` cũ > 24h.
  - Xóa partition audit log cũ > 24 tháng (nếu đã partition).

**Backup:**
- Giai đoạn đầu: `supabase db dump` định kỳ trên Supabase Free plan.
- Khi vận hành thật: nâng lên Supabase Pro và bật PITR (Point-in-Time Recovery).
- Test restore định kỳ ít nhất 1 lần sau khi bật PITR.

**Monitoring:**
- Bật Supabase Log Explorer để theo dõi lỗi RLS/auth.
- Cảnh báo khi disk usage > 80%.
- Cảnh báo khi số lượng tenants/users tăng bất thường.

**Runbook:**
- Viết `runbook.md` với các tình huống:
  - Tenant bị suspend: kiểm tra `tenants.status`, liên hệ chủ tenant, reactivate.
  - User quên mật khẩu: dùng Edge Function `reset-password`/`invite`.
  - Data isolation bug: kiểm tra `current_tenant_id()`, RLS policies, header `x-tenant-id`.
  - Migration failed: restore từ backup gần nhất, kiểm tra logs.
  - Restore từ backup/PITR: quy trình bước từng bước.

---

## 4. Lộ trình triển khai sub-phase

```
Tuần 1:  Phase 0 + Phase 1 + Phase 2
Tuần 2:  Phase 3.1 + 3.2 + 3.3 + Phase 4.1
Tuần 3:  Phase 4.2 + Phase 5.1 + 5.2
Tuần 4:  Phase 5.3 + Phase 6.1 + 6.2
Tuần 5:  Phase 6.3 + 6.4 + Phase 7
Tuần 6:  Phase 8 + Phase 9.1 + 9.2 + 9.3
Tuần 7:  Phase 9.4 + 9.5 + 9.6 + Phase 10.1
Tuần 8:  Phase 10.2 + Phase 11 + Phase 12.1
Tuần 9:  Phase 12.2 + 12.3 + Phase 13.1
Tuần 10: Phase 13.2 + 13.3 + Phase 14 (staging cleanup)
Tuần 11: Phase 15 + Phase 16 (production deploy)
Tuần 12: Phase 17 + ổn định
```

---

## 5. Tiêu chí chấp nhận (Acceptance Criteria)

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

## 6. Ghi chú khi chat

- Mỗi đoạn chat chỉ xử lý **một sub-phase**.
- Bắt đầu đoạn chat bằng cách dán nội dung sub-phase tương ứng từ file này vào prompt.
- Nếu trong quá trình thực hiện sub-phase nào vẫn bị cắt ngang, tiếp tục chia nhỏ thêm theo nhóm bảng hoặc nhóm page cụ thể.
- Luôn backup trước khi chạy migration trên production.
