# KIẾN TRÚC CHI TIẾT VÀ SƠ ĐỒ TỔNG THỂ HỆ THỐNG

> **Mục tiêu:** Hệ thống VietSale Pro vận hành theo mô hình SaaS giống KiotViet — mỗi cửa hàng có subdomain riêng, dữ liệu cách ly, chỉ chủ hệ thống tạo cửa hàng và tài khoản admin.

---

## 3. KIẾN TRÚC CHI TIẾT

### 3.1. DNS & Subdomain Routing

#### 3.1.1. Cấu hình DNS

Sử dụng **Cloudflare Pages** làm hosting (đã chọn):

1. Trong Cloudflare Dashboard, thêm domain `vietsalepro.com`.
2. Tạo Pages project và kết nối repo GitHub/GitLab.
3. Thêm custom domain `vietsalepro.com` và wildcard `*.vietsalepro.com` vào Pages project.
4. Cloudflare tự động tạo DNS record:
   - `CNAME vietsalepro.com → <pages-project>.pages.dev`
   - `CNAME *.vietsalepro.com → <pages-project>.pages.dev`
5. Bật **Cloudflare proxy** để có SSL tự động và các tính năng bảo mật ở edge.

Kết quả: mọi subdomain (`*.vietsalepro.com`) đều trỏ về cùng một frontend app trên Cloudflare Pages.

#### 3.1.2. Frontend nhận diện subdomain

```ts
// lib/tenant.ts
export function getSubdomain(): string | null {
  const host = window.location.host; // VD: suacauba.vietsalepro.com
  const parts = host.split('.');

  // vietsalepro.com → không có subdomain
  if (parts.length < 3) return null;

  // suacauba.vietsalepro.com → 'suacauba'
  return parts[0].toLowerCase();
}
```

#### 3.1.3. Subdomain → Tenant

Subdomain được ánh xạ sang `tenant_id` qua bảng `public.tenants`:

```sql
SELECT id FROM public.tenants WHERE subdomain = 'suacauba' AND status = 'active';
```

Frontend load app:
1. Trích xuất subdomain
2. Gọi RPC `get_tenant_by_subdomain('suacauba')`
3. Nhận về `tenant_id`, `tenant_name`, `tenant_status`
4. Lưu `tenant_id` vào app context (không lưu vào localStorage vì lý do bảo mật)
5. Mọi request sau đó đều gắn `tenant_id`

---

### 3.2. Tenant Provisioning Flow (Chỉ chủ hệ thống thực hiện)

Chủ hệ thống vận hành qua admin dashboard tại `admin.vietsalepro.com`.

#### 3.2.1. Các bước tạo cửa hàng mới

```
1. Khách hàng liên hệ đăng ký (Zalo/phone/email)
2. Chủ hệ thống vào admin dashboard
3. Điền form:
   - Tên cửa hàng: "Cửa hàng Sữa Cậu Ba"
   - Subdomain: "suacauba"
   - Email admin: "suacauba@gmail.com"
   - Số điện thoại admin: "0933xxxxxx" (tùy chọn)
   - Gói dịch vụ: free/vip
4. Click "Tạo cửa hàng"
5. Hệ thống:
   a. Kiểm tra subdomain chưa tồn tại
   b. Tạo bản ghi trong public.tenants
   c. Tạo user trong auth.users (qua Edge Function/service_role)
   d. Gán user làm admin của tenant
   e. Gửi email/SMS thông tin đăng nhập
6. Khách hàng truy cập suacauba.vietsalepro.com và đăng nhập
```

#### 3.2.2. Edge Function tạo tenant + admin

```ts
// supabase/functions/create-tenant-admin/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { name, subdomain, admin_email, admin_phone, plan } = await req.json();

  // Chỉ admin tổng mới được gọi (kiểm tra API key hoặc JWT admin đặc biệt)
  // ... validate admin token ...

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Tạo tenant
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .insert({ name, subdomain, status: 'active' })
    .select('id')
    .single();

  if (tenantError) throw tenantError;

  const tenant_id = tenant.id;
  const tempPassword = generateSecurePassword();

  // 2. Tạo admin user trong auth.users
  // KHÔNG lưu tenant_id hay role vào user_metadata. Role chỉ trong tenant_memberships.
  const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: admin_email,
    password: tempPassword,
    phone: admin_phone,
    email_confirm: true,
    phone_confirm: true
  });

  if (userError) throw userError;

  // 3. Gán user vào tenant
  const { error: membershipError } = await supabaseAdmin
    .from('tenant_memberships')
    .insert({
      tenant_id,
      user_id: user.id,
      role: 'admin',
      invited_by: null // system-created
    });

  if (membershipError) throw membershipError;

  // 4. Tạo subscription record
  await supabaseAdmin
    .from('tenant_subscriptions')
    .insert({
      tenant_id,
      plan: plan || 'free',
      max_users: getMaxUsersForPlan(plan),
      max_products: getMaxProductsForPlan(plan),
      max_orders_per_month: getMaxOrdersForPlan(plan)
    });

  // 5. Gửi thông tin đăng nhập qua email mặc định của Supabase Auth
  // ponytail: không cần cấu hình SMTP riêng; dùng Supabase Auth email provider.
  await supabaseAdmin.auth.admin.generateLink('signup', admin_email, {
    password: tempPassword,
    redirectTo: `https://${subdomain}.vietsalepro.com/login`
  });

  return new Response(JSON.stringify({
    success: true,
    tenant_id,
    user_id: user.id,
    subdomain,
    login_url: `https://${subdomain}.vietsalepro.com`
  }));
});
```

#### 3.2.3. Các trường hợp cần xử lý

- Subdomain đã tồn tại → báo lỗi, yêu cầu chọn tên khác
- Email đã có trong auth.users → vẫn dùng được, nhưng cần kiểm tra user chưa thuộc tenant nào khác với vai trò admin
- Tạo user thất bại → rollback tenant
- Gửi email thất bại → vẫn tạo thành công, ghi log, gửi lại sau

---

### 3.3. Login Flow

```
User truy cập suacauba.vietsalepro.com
    ↓
Frontend load
    ↓
getSubdomain() → 'suacauba'
    ↓
RPC get_tenant_by_subdomain('suacauba') → tenant_id + thông tin tenant
    ↓
Hiển thị màn hình đăng nhập (logo + tên cửa hàng)
    ↓
User nhập email/phone + password
    ↓
supabase.auth.signInWithPassword({ email, password })
    ↓
Auth thành công → có user_id
    ↓
Kiểm tra tenant_memberships:
    SELECT role FROM tenant_memberships
    WHERE tenant_id = ? AND user_id = auth.uid()
    ↓
Nếu có quyền:
    → Lưu tenant_id + role vào AuthContext
    → Load app
Nếu không có quyền:
    → Hiển thị: "Tài khoản này không thuộc cửa hàng này"
    → Đăng xuất
```

#### 3.3.1. Kiểm tra quyền truy cập tenant

```ts
// lib/tenantAccess.ts
export async function validateTenantAccess(
  tenantId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('tenant_memberships')
    .select('role, created_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data;
}
```

#### 3.3.2. Xử lý user thuộc nhiều tenant

Nếu một user (ví dụ kế toán viên) được mời vào nhiều cửa hàng:

```
suacauba.vietsalepro.com → vào tenant suacauba
cuahang2.vietsalepro.com → vào tenant cuahang2
```

Mỗi subdomain tự động chọn đúng tenant. Không cần UI chọn tenant.

Nếu user đăng nhập vào subdomain không thuộc quyền → chặn.

---

### 3.4. Data Isolation Strategy (RLS)

#### 3.4.1. Thiết kế RLS cơ bản

Mọi bảng dữ liệu kinh doanh đều có cột `tenant_id`.

Cấu trúc policy chuẩn:

```sql
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

-- SELECT
CREATE POLICY "tenant_isolation_select"
  ON public.products
  FOR SELECT TO authenticated
  USING (
    (
      tenant_id = public.current_tenant_id()
      AND public.is_tenant_member(tenant_id)
    )
    OR public.is_system_admin()
  );

-- INSERT
CREATE POLICY "tenant_isolation_insert"
  ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
  );

-- UPDATE
CREATE POLICY "tenant_isolation_update"
  ON public.products
  FOR UPDATE TO authenticated
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
  ON public.products
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_admin(tenant_id)
  );
```

#### 3.4.2. Kết hợp subdomain + RLS (2 lớp bảo vệ)

Lớp 1: Frontend luôn gửi đúng `tenant_id` từ subdomain qua header `x-tenant-id`.
Lớp 2: RLS kiểm tra user có quyền với tenant đó.

```ts
// lib/supabase.ts
let currentTenantId: string | null = null;

export const setCurrentTenantId = (tenantId: string | null) => {
  currentTenantId = tenantId;
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: {
      headers: { 'x-tenant-id': currentTenantId || '' },
    },
  }
);
```

**Lý do kết hợp:**
- Nếu frontend bị lỗi gửi sai tenant_id, RLS vẫn chặn
- Nếu user cố tình giả mạo header, RLS vẫn kiểm tra membership
- Nếu request thiếu header, `current_tenant_id()` trả về `NULL` và RLS từ chối

#### 3.4.3. Các bảng cần thêm tenant_id

**Bảng chính (có dữ liệu riêng từng cửa hàng):**

- `products`
- `product_lots`
- `categories`
- `brands`
- `customers`
- `suppliers`
- `orders`
- `order_items`
- `import_receipts`
- `import_items`
- `return_orders`
- `return_order_items`
- `inventory_counts`
- `inventory_count_items`
- `inventory_movements`
- `disposals`
- `disposal_items`
- `stock_movements`
- `supplier_exchanges`
- `supplier_exchange_received_items`
- `supplier_exchange_return_items`
- `promotions`
- `rewards`
- `point_history`
- `rank_configs`
- `rank_history`
- `app_settings`
- `customer_payment_ledger`
- `supplier_payment_ledger`
- `einvoice_config`
- `einvoice_orders`
- `processed_operations` (nếu dùng làm log)

**Bảng hệ thống (không cần tenant_id):**

- `auth.users` (global)
- `public.tenants`
- `public.tenant_memberships`
- `public.tenant_subscriptions`
- `public.app_audit_log` (có thể có tenant_id để lọc log)

#### 3.4.4. Helper functions cho RLS

```sql
-- Kiểm tra user có thuộc tenant không
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid()
  );
$$;

-- Kiểm tra admin tenant
CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Kiểm tra role cụ thể
CREATE OR REPLACE FUNCTION public.has_tenant_role(p_tenant_id UUID, p_role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = p_role
  );
$$;

-- Lấy tenant theo subdomain
CREATE OR REPLACE FUNCTION public.get_tenant_by_subdomain(p_subdomain TEXT)
RETURNS public.tenants LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT * FROM public.tenants WHERE subdomain = p_subdomain LIMIT 1;
$$;
```

---

### 3.5. User & Roles Model

#### 3.5.1. Bảng `tenant_memberships`

```sql
CREATE TABLE public.tenant_memberships (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN (
    'admin',
    'cashier',
    'inventory_manager',
    'accountant'
  )),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX idx_tenant_memberships_user ON public.tenant_memberships(user_id);
CREATE INDEX idx_tenant_memberships_tenant ON public.tenant_memberships(tenant_id);
```

#### 3.5.2. Backfill membership cho dữ liệu cũ

Khi chuyển từ single-tenant sang multi-tenant, sau khi tạo tenant đầu tiên, phải tạo membership cho toàn bộ user hiện có:

```sql
DO $$
DECLARE v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  SELECT v_tenant_id, id, 'admin'
  FROM auth.users
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
END $$;
```

Không có bước này, user cũ sẽ không đăng nhập được vào tenant dù dữ liệu đã được gán.

#### 3.5.3. Vai trò và quyền

| Role | Mô tả | Quyền chính |
|---|---|---|
| **admin** | Chủ cửa hàng / quản lý | Full quyền: bán hàng, nhập hàng, báo cáo, cài đặt, quản lý nhân viên, xóa đơn |
| **cashier** | Thu ngân | Tạo đơn hàng, thanh toán nợ, xem khách hàng, xem sản phẩm, tạo trả hàng |
| **inventory_manager** | Quản lý kho | Nhập hàng, kiểm kê, xuất hủy, quản lý lô, xem tồn kho |
| **accountant** | Kế toán | Xem báo cáo, công nợ, không được sửa đơn/tồn kho |

#### 3.5.3. Policy mẫu theo role cho từng bảng

```sql
-- ============================
-- orders table policies
-- ============================

-- Admin: full quyền
CREATE POLICY "orders_admin_all"
  ON public.orders
  FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_admin(tenant_id)
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_admin(tenant_id)
  );

-- Cashier: xem và tạo đơn, không update/delete
CREATE POLICY "orders_cashier_select"
  ON public.orders
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
    AND public.has_tenant_role(tenant_id, 'cashier')
  );

CREATE POLICY "orders_cashier_insert"
  ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
    AND public.has_tenant_role(tenant_id, 'cashier')
  );

CREATE POLICY "cashier_cannot_delete_orders"
  ON public.orders
  FOR DELETE TO authenticated
  USING (false);

-- Accountant: chỉ xem
CREATE POLICY "orders_accountant_select"
  ON public.orders
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
    AND public.has_tenant_role(tenant_id, 'accountant')
  );

-- Inventory manager: xem (để hỗ trợ kho)
CREATE POLICY "orders_inventory_select"
  ON public.orders
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
    AND public.has_tenant_role(tenant_id, 'inventory_manager')
  );
```

#### 3.5.4. Chủ cửa hàng tự làm không thuê nhân viên

Trường hợp này đơn giản: chỉ có 1 bản ghi trong `tenant_memberships` với role `admin`. App hiển thị toàn bộ chức năng.

---

### 3.6. Subdomain Creation

#### 3.6.1. Quy tắc đặt subdomain

- Chỉ chấp nhận: chữ cái thường, số, dấu gạng ngang `-`
- Không được bắt đầu/kết thúc bằng dấu gạch ngang
- Độ dài: 3-63 ký tự
- Không được trùng

#### 3.6.2. Subdomain reserved (cấm đăng ký)

```
admin, www, api, app, support, help, blog, docs, mail, ftp, smtp, pop, imap,
login, auth, dashboard, store, shop, payment, billing, secure, static, cdn
```

#### 3.6.3. Cấu hình hosting (Cloudflare Pages — đã chọn)

Dùng wildcard DNS `*.vietsalepro.com` → Pages project. Không cần thêm từng subdomain khi tạo tenant mới.

**Lý do chọn Cloudflare Pages:**
- Hỗ trợ wildcard subdomain với SSL tự động.
- Không cần gọi API để thêm domain mỗi khi tạo tenant.
- Có thêm lợi ích bảo mật ở edge (Cloudflare proxy).
- Phù hợp KiotViet-style với 1000+ tenant.

#### 3.6.4. Khuyến nghị cho giai đoạn đầu

Vì bạn tạo cửa hàng thủ công và dùng Cloudflare Pages wildcard, nên **không cần thêm subdomain thủ công vào hosting**. Chỉ cần tạo record trong bảng `tenants`, DNS wildcard tự động điều hướng.

#### 3.6.5. Storage RLS (bucket `tenant-assets` chung)

- Dùng 1 bucket `tenant-assets` cho tất cả tenant.
- Tổ chức path: `tenant-assets/{tenant_id}/products/{file}` hoặc `tenant-assets/{tenant_id}/invoices/{file}`.
- RLS kiểm tra `(storage.foldername(name))[1] = current_tenant_id()::TEXT` và `is_tenant_member(...)`.
- Phù hợp scale 1000+ tenant KiotViet-style.

#### 3.6.6. Rate limiting (bảng `rate_limit_logs` trong Supabase)

- Lưu lại mỗi request theo IP + action trong bảng `rate_limit_logs`.
- Đăng nhập sai ≥ 5 lần/15 phút/IP → lockout.
- Tạo tenant / check subdomain / mời nhân viên: 10 request/phút/IP.
- Triển khai trong Edge Function; dọn dữ liệu cũ > 24h bằng Supabase cron extension.

---

### 3.7. Authentication Methods

#### 3.7.1. Email + Password (khuyên dùng làm chính)

```ts
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'suacauba@gmail.com',
  password: '********'
});
```

Ưu điểm: đơn giản, rẻ, dễ khôi phục mật khẩu.

#### 3.7.2. Số điện thoại + OTP

Cần cấu hình SMS provider trong Supabase (Twilio/Vonage).

```ts
// Gửi OTP
await supabase.auth.signInWithOtp({ phone: '+84933xxxxxx' });

// Xác nhận OTP
await supabase.auth.verifyOtp({
  phone: '+84933xxxxxx',
  token: '123456',
  type: 'sms'
});
```

**Nhược điểm:**
- Chi phí SMS cho mỗi lần đăng nhập
- Phụ thuộc vào nhà mạng
- Khó hơn để khôi phục tài khoản

**Khuyến nghị:** Dùng email/password làm chính, phone dùng làm 2FA hoặc backup.

#### 3.7.3. Phone + Password (nếu cần)

Supabase không hỗ trợ phone + password trực tiếp. Cần custom flow:
- Lưu phone vào `auth.users.phone`
- Tạo thêm bảng `phone_passwords` (lưu hash) hoặc dùng email giả từ phone
- Không khuyến khích vì phức tạp.

---

### 3.8. Supabase Auth Configuration

#### 3.8.1. Tắt self-registration

1. Vào Supabase Dashboard → Authentication → Providers → Email
2. Tắt:
   - `Enable email confirmations` (vì bạn tự confirm)
   - `Enable new signups` (quan trọng nhất)
3. Tắt các social providers (Google, Facebook, v.v.)

#### 3.8.2. Site URL & Redirect URLs

Cấu hình:
- Site URL: `https://vietsalepro.com`
- Redirect URLs: `https://*.vietsalepro.com/**`

Để user sau khi xác nhận email/reset password được redirect về đúng subdomain.

#### 3.8.3. JWT Expiry

- Access token: 3600 giây (1 tiếng)
- Refresh token: 604800 giây (7 ngày)

Có thể điều chỉnh tùy bảo mật.

#### 3.8.4. Service Role Key

- Chỉ dùng trong Edge Functions hoặc server backend
- **Không bao giờ** đưa vào frontend code
- Lưu trong `SUPABASE_SERVICE_ROLE_KEY` environment variable

---

### 3.9. Admin Dashboard cho chủ hệ thống

URL: `admin.vietsalepro.com`

#### 3.9.1. Chức năng chính

- Quản lý tenants (tạo, sửa, suspend, xóa)
- Quản lý admin users của từng tenant
- Xem billing/subscriptions
- Xem audit log toàn hệ thống
- Thống kê sử dụng
- Quản lý reserved subdomains

#### 3.9.2. Bảo mật admin dashboard

- Chỉ user có role `superadmin` mới được truy cập
- Có thể dùng bảng `system_admins`:

```sql
CREATE TABLE public.system_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'superadmin' CHECK (role IN ('superadmin', 'support')),
  created_at timestamptz DEFAULT now()
);
```

- RLS của admin dashboard kiểm tra `system_admins`

---

### 3.10. Tenant Subscription & Limits

**Gói dịch vụ:**
| Gói | Giá | SKU | Đơn/tháng | User |
|---|---|---|---|---|
| **Free** | 0đ | 50 | 300 | 1 |
| **VIP** | 69K/tháng | 999.999 | 999.999 | 999 |

```sql
CREATE TABLE public.tenant_subscriptions (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'vip')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
  max_users integer NOT NULL DEFAULT 1,
  max_products integer NOT NULL DEFAULT 50,
  max_orders_per_month integer NOT NULL DEFAULT 300,
  current_month_orders integer NOT NULL DEFAULT 0,
  current_month_start date NOT NULL DEFAULT CURRENT_DATE,
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_tenant_subscriptions_updated_at
BEFORE UPDATE ON public.tenant_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

Kiểm tra giới hạn trong triggers:

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

CREATE OR REPLACE FUNCTION public.increment_monthly_order_count()
RETURNS trigger AS $$
DECLARE
  v_sub public.tenant_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = NEW.tenant_id;

  IF v_sub.current_month_start <> date_trunc('month', CURRENT_DATE)::DATE THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_tenant_order_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.increment_monthly_order_count();
```

---

### 3.11. Audit Log

```sql
CREATE TABLE public.app_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id text,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT')),
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- RLS: chỉ admin tenant và system admin được xem
CREATE POLICY "audit_log_tenant_admin"
  ON public.app_audit_log
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_admin(tenant_id)
    OR public.is_system_admin()
  );
```

Trigger ghi log cho các bảng quan trọng:

```sql
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS trigger AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := null;
  ELSIF TG_OP = 'INSERT' THEN
    v_old := null;
    v_new := to_jsonb(NEW);
  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
  END IF;

  INSERT INTO public.app_audit_log (
    tenant_id, user_id, table_name, record_id, action, old_data, new_data
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    v_old,
    v_new
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. SƠ ĐỒ TỔNG THỂ HỆ THỐNG

### 4.1. Sơ đồ kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                         NGƯỜI DÙNG                              │
│  Khách hàng muốn dùng phần mềm  │  Admin cửa hàng (thu ngân...)  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DNS (vietsalepro.com)                        │
│  *.vietsalepro.com → A record → Hosting Server                  │
│                                                                  │
│  Subdomain ví dụ: suacauba.vietsalepro.com                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                          │
│  Cùng một app build, nhận diện subdomain                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  1. Extract subdomain: 'suacauba'                        │   │
│  │  2. RPC get_tenant_by_subdomain() → tenant_id              │   │
│  │  3. Show login page with store branding                    │   │
│  │  4. Login → validate tenant membership                     │   │
│  │  5. All API calls include tenant_id                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE BACKEND (Single Project)                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  auth.users                                              │   │
│  │  Global authentication table                            │   │
│  │  (email, phone, password hash, metadata)                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  public.tenants                                          │   │
│  │  slug | name | subdomain | status | created_at          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  public.tenant_memberships                             │   │
│  │  tenant_id | user_id | role | created_at                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  public.tenant_subscriptions                            │   │
│  │  tenant_id | plan | status | max_users | max_products   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  BUSINESS TABLES (all with tenant_id)                  │   │
│  │                                                          │   │
│  │  products        orders        customers      suppliers  │   │
│  │  order_items     import_receipts  import_items           │   │
│  │  return_orders  return_order_items  inventory_*         │   │
│  │  promotions      rewards      app_settings      ...      │   │
│  │                                                          │   │
│  │  RLS: user chỉ thấy dữ liệu tenant_id mình thuộc quyền  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  public.app_audit_log                                    │   │
│  │  Ghi lại mọi thay đổi quan trọng                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Edge Functions / RPCs                                   │   │
│  │  - create_tenant_and_admin()                             │   │
│  │  - invite_user_to_tenant()                                 │   │
│  │  - get_tenant_by_subdomain()                               │   │
│  │  - current_tenant_id() (đọc từ request header)             │   │
│  │  - process_checkout() (đã có)                              │   │
│  │  - process_import_v2() (đã có)                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                 ADMIN DASHBOARD (admin.vietsalepro.com)            │
│  Chỉ chủ hệ thống và system admin dùng                          │
│  - Tạo cửa hàng mới                                             │
│  - Tạo admin user cho cửa hàng                                  │
│  - Quản lý subscriptions                                       │
│  - Xem audit log                                               │
│  - Suspend/activate tenants                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2. Sơ đồ luồng dữ liệu đăng nhập

```
User gõ suacauba.vietsalepro.com trong browser
              │
              ▼
DNS trả về IP hosting server
              │
              ▼
Browser tải React SPA
              │
              ▼
App chạy getSubdomain() → 'suacauba'
              │
              ▼
App gọi supabase.rpc('get_tenant_by_subdomain', { p_subdomain: 'suacauba' })
              │
              ▼
Supabase trả về: { id: 'tenant-uuid', name: 'Cửa hàng Sữa Cậu Ba', status: 'active' }
              │
              ▼
App render login page với branding cửa hàng
              │
              ▼
User nhập email + password
              │
              ▼
supabase.auth.signInWithPassword({ email, password })
              │
              ▼
Auth thành công → user_id
              │
              ▼
App gọi validateTenantAccess(tenant_id, user_id)
              │
              ▼
┌──────────────────────┐
│  Có quyền?           │
└──────────────────────┘
       │           │
      Yes          No
       │           │
       ▼           ▼
Vào app      Hiển thị lỗi
              "Tài khoản không thuộc cửa hàng này"
```

### 4.3. Sơ đồ luồng tạo cửa hàng (manual provisioning)

```
Khách hàng liên hệ qua Zalo/phone/email
              │
              ▼
Chủ hệ thống vào admin.vietsalepro.com
              │
              ▼
Điền form tạo cửa hàng:
- Tên: Cửa hàng Sữa Cậu Ba
- Subdomain: suacauba
- Email admin: suacauba@gmail.com
- Phone admin: 0933xxxxxx
- Gói dịch vụ: free/vip
              │
              ▼
Click "Tạo cửa hàng"
              │
              ▼
Edge Function create_tenant_and_admin() chạy:
              │
              ├── 1. Validate input
              ├── 2. Kiểm tra subdomain chưa tồn tại
              ├── 3. INSERT public.tenants
              ├── 4. CREATE USER trong auth.users (service_role)
              ├── 5. INSERT public.tenant_memberships (role='admin')
              ├── 6. INSERT public.tenant_subscriptions
              ├── 7. Gửi welcome email/SMS
              │
              ▼
Trả về kết quả:
- subdomain: suacauba.vietsalepro.com
- login_url
- temp password
              │
              ▼
Chủ hệ thống gửi thông tin cho khách hàng
```

### 4.4. Sơ đồ luồng mời nhân viên (admin cửa hàng)

```
Admin cửa hàng đăng nhập suacauba.vietsalepro.com
              │
              ▼
Vào menu "Quản lý nhân viên"
              │
              ▼
Click "Mời nhân viên"
              │
              ▼
Điền:
- Email hoặc phone nhân viên
- Role: cashier / inventory_manager / accountant
              │
              ▼
Gọi Edge Function invite_user_to_tenant()
              │
              ▼
Nếu user chưa tồn tại:
  → Gửi email invite link
  → User click link, tạo password
  → Tự động gán vào tenant
Nếu user đã tồn tại:
  → INSERT tenant_memberships ngay
              │
              ▼
Kiểm tra giới hạn số user theo gói dịch vụ
              │
              ▼
Hoàn tất
```

### 4.5. Sơ đồ bảo mật multi-layer

```
┌────────────────────────────────────────┐
│  Layer 1: DNS / Subdomain              │
│  - Mỗi cửa hàng có subdomain riêng     │
│  - Không có subdomain = không có tenant  │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│  Layer 2: Authentication               │
│  - Supabase Auth                       │
│  - Self-registration disabled          │
│  - Email/phone confirm do admin tạo    │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│  Layer 3: Tenant Membership            │
│  - Kiểm tra user thuộc tenant nào      │
│  - Chặn user truy cập sai tenant        │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│  Layer 4: RLS (Row Level Security)     │
│  - Mọi bảng kinh doanh có tenant_id      │
│  - Policy chỉ cho phép dữ liệu         │
│    thuộc tenant user có quyền          │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│  Layer 5: RBAC                         │
│  - admin / cashier / inventory       │
│  - accountant có quyền khác nhau      │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│  Layer 6: Audit Log                    │
│  - Ghi lại mọi thay đổi quan trọng      │
│  - Phục vụ điều tra và compliance       │
└────────────────────────────────────────┘
```

### 4.6. Sơ đồ phân chia môi trường

```
Production:
  - Supabase project: QLBH (rsialbfjswnrkzcxarnj)
  - Domain: vietsalepro.com
  - Admin dashboard: admin.vietsalepro.com
  - Tenant subdomains: *.vietsalepro.com

Staging:
  - Supabase project riêng (nên tạo)
  - Domain: staging.vietsalepro.com
  - Test multi-tenancy với 2-3 tenant

Local Development:
  - Dùng `main` làm subdomain cố định cho localhost (đồng bộ với `KE_HOACH_BAO_MAT_MULTI_TENANCY.md`).
  - Đảm bảo tenant `main` tồn tại trong local DB.
  - Hoặc dùng etc/hosts: suacauba.local.vietsalepro.com nếu cần test subdomain thật.
```

---

## 5. CÁC ĐIỂM CẦN LƯU Ý ĐẶC BIỆT

### 5.1. Email trùng nhau giữa các cửa hàng

Với shared `auth.users`, một email chỉ tồn tại một lần. Nếu cửa hàng A và B cùng mời `ketoan@gmail.com`, đó là cùng một user. User đó sẽ có 2 bản ghi trong `tenant_memberships`.

**Đây là ưu điểm:** Kế toán viên có thể dùng một tài khoản cho nhiều cửa hàng.

**Nếu không muốn như vậy:** Bạn phải tạo user với email có suffix (VD: `ketoan+sua-cau-ba@gmail.com`) hoặc dùng database-per-tenant.

### 5.2. Subdomain không tồn tại

Nếu user vào `subdomain-khong-tontai.vietsalepro.com`:
- Frontend gọi `get_tenant_by_subdomain` → không tìm thấy
- Hiển thị trang "Cửa hàng không tồn tại" hoặc redirect về `vietsalepro.com` (landing page)

### 5.3. Tenant bị suspend

Nếu `tenants.status = 'suspended'`:
- Sau khi login, kiểm tra status
- Hiển thị thông báo "Tài khoản đã bị khóa / hết hạn. Vui lòng liên hệ hỗ trợ."

### 5.4. Backup & Restore trong mô hình multi-tenant

- **Giai đoạn đầu (Free plan):** Backup toàn bộ Supabase project định kỳ bằng Supabase CLI (`supabase db dump`) hoặc dashboard backup.
- **Khi vận hành thật:** Nâng lên Supabase Pro và bật PITR (Point-in-Time Recovery).
- Test restore toàn bộ 1 lần/tháng trên staging, 1 lần/quý trên production backup.
- Nếu cần restore 1 cửa hàng: phải export/import dữ liệu của tenant đó (phức tạp hơn). Chuẩn bị script export/import 1 tenant sẵn.

### 5.5. Data retention cho hệ thống 10–20 năm (dùng Supabase cron extension)

- `orders`, `stock_movements`: archive dữ liệu > 2 năm ra bảng lưu trữ hoặc storage.
- `app_audit_log`: partition theo tháng, xóa partition cũ > 2 năm sau khi archive.
- `processed_operations`: clean log cũ > 90 ngày.
- `rate_limit_logs`: clean log cũ > 24h.
- Lên lịch bằng Supabase cron extension:
  ```sql
  SELECT cron.schedule('data-retention-daily', '0 3 * * *', $$
    CALL public.run_data_retention();
  $$);
  ```
- Theo dõi kích thước DB và index bloat định kỳ.

### 5.6. SKU / mã đơn / mã hóa đơn unique theo tenant

Dùng composite unique index:
- `products(tenant_id, sku)`
- `products(tenant_id, barcode)`
- `orders(tenant_id, order_code)`
- `einvoice_orders(tenant_id, invoice_number)`

Cho phép trùng giữa các tenant, không trùng trong cùng tenant.

### 5.7. Offline queue tenant isolation

- Mỗi operation trong IndexedDB lưu `tenant_id`.
- Khi sync, lấy tenant_id từ subdomain runtime, không từ localStorage.
- Chỉ sync operation thuộc tenant hiện tại; kiểm tra membership trước khi sync.

### 5.8. Password reset flow

- Khi self-registration tắt, chỉ admin tenant hoặc system admin được reset password cho nhân viên.
- Edge Function `reset-password` gọi `supabase.auth.admin.generateLink('recovery', ...)` với `redirect_to` đúng subdomain.
- Email gửi đi qua **Email provider mặc định của Supabase Auth** (không cần cấu hình SMTP riêng).

### 5.9. Rate limiting

- Dùng bảng `rate_limit_logs` trong Supabase.
- Đăng nhập sai ≥ 5 lần/15 phút/IP → lockout.
- Tạo tenant / check subdomain / mời nhân viên: 10 request/phút/IP.
- Kiểm tra trong Edge Function; dọn dữ liệu cũ > 24h bằng Supabase cron extension.

### 5.10. Scaling

Khi số lượng cửa hàng tăng:
- Cần index tốt trên `tenant_id` trong mọi bảng kinh doanh
- Cần partition bảng lớn (orders, stock_movements) theo `tenant_id` hoặc `created_at`
- Cân nhắc read replicas
- Cân nhắc nâng cấp Supabase plan

---

## 6. DANH SÁCH FILE/MODULE CẦN THAY ĐỔI TRONG CODEBASE

### 6.1. Database migrations

1. `supabase/migration_multitenant_tenants.sql`
2. `supabase/migration_multitenant_tenant_memberships.sql`
3. `supabase/migration_multitenant_add_tenant_id_to_tables.sql`
4. `supabase/migration_multitenant_rls_policies.sql`
5. `supabase/migration_multitenant_helper_functions.sql`
6. `supabase/migration_multitenant_subscriptions.sql`
7. `supabase/migration_multitenant_audit_log.sql`
8. `supabase/migration_multitenant_rate_limit_logs.sql`
9. `supabase/migration_multitenant_storage_rls.sql`
10. `supabase/migration_multitenant_disable_public_policies.sql`

### 6.2. Frontend

1. `lib/tenant.ts` — mới
2. `lib/tenantAccess.ts` — mới
3. `contexts/AuthContext.tsx` — thêm tenant context
4. `lib/supabase.ts` — thêm interceptor gắn tenant_id
5. `pages/Login.tsx` — nhận diện tenant từ subdomain, hiển thị branding
6. `App.tsx` — load tenant trước khi render app
7. Tất cả các `supabase.from(...)` trong `services/supabaseService.ts` — thêm `.eq('tenant_id', tenantId)`
8. `pages/AdminDashboard.tsx` — mới (chỉ system admin)
9. `components/TenantSelector.tsx` — nếu cần chọn tenant

### 6.3. Edge Functions

1. `supabase/functions/create-tenant-admin/index.ts`
2. `supabase/functions/invite-user-to-tenant/index.ts`
3. `supabase/functions/get-tenant-by-subdomain/index.ts`
4. `supabase/functions/check-subdomain-availability/index.ts`
5. `supabase/functions/reset-password/index.ts`
6. `supabase/functions/audit-log-writer/index.ts`
7. `supabase/functions/process-checkout/index.ts`

---

## 7. KẾT LUẬN

Mô hình **KiotViet-style + subdomain + manual provisioning** phù hợp với VietSale Pro vì:

1. Bạn kiểm soát hoàn toàn việc tạo cửa hàng
2. Khách hàng không tự đăng ký → giảm abuse
3. Subdomain tạo cảm giác "phần mềm riêng của tôi"
4. Shared database + RLS đủ tốt cho hàng trăm cửa hàng nhỏ
5. Dễ quản lý billing và subscriptions

Điểm then chốt để thành công:
- **RLS phải đúng trên 100% bảng kinh doanh**
- **Tắt sign-up tự do**
- **Service role key không bao giờ lộ ra frontend**
- **Có staging environment để test multi-tenancy**

Khi bạn yêu cầu, tôi sẽ bắt đầu implement từ **migrations tạo tenants + tenant_memberships + RLS policies**.
