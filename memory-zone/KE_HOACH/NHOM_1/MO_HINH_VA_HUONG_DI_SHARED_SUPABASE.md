# MÔ HÌNH VÀ HƯỚNG ĐI: SHARED SUPABASE + SUBDOMAIN ROUTING

> **Lựa chọn của chủ dự án:** Tách biệt logic (Shared Database + `tenant_id` + RLS) thay vì tách biệt vật lý hoặc schema-per-tenant.
>
> **Mục tiêu:** VietSale Pro hoạt động như KiotViet — nhiều cửa hàng dùng chung một hệ thống, mỗi cửa hàng có subdomain riêng, dữ liệu cách ly hoàn toàn, không tự đăng ký.

---

## 1. MÔ HÌNH BẠN MUỐN

### 1.1. Tóm tắt bằng ngôn ngữ dân dã

Bạn đang làm **phần mềm bán hàng cho thuê** giống KiotViet, Sapo, Shopify:

- Mỗi cửa hàng thuê dịch vụ sẽ có một "gian hàng" riêng trong hệ thống.
- Gian hàng đó có địa chỉ riêng: `suacauba.vietsalepro.com`, `cuahanga.vietsalepro.com`...
- Mỗi gian hàng có dữ liệu riêng: sản phẩm, đơn hàng, khách hàng, nhân viên, báo cáo...
- Cửa hàng A **không bao giờ** nhìn thấy dữ liệu của cửa hàng B.
- Khách hàng **không tự đăng ký** được. Phải liên hệ với bạn, bạn mở gian hàng và cấp tài khoản admin.

### 1.2. So sánh với các mô hình phần mềm khác

| Mô hình | Ví dụ | Đặc điểm | Có phải của bạn? |
|---|---|---|---|
| **Phần mềm cài trên máy tính** | Phần mềm bán hàng offline | Chỉ 1 cửa hàng, dữ liệu trong máy | Không |
| **Phần mềm cho 1 cửa hàng online** | Website bán hàng cá nhân | 1 tài khoản, 1 cửa hàng | Không |
| **SaaS nhiều cửa hàng (self-service)** | Shopify, Sapo | Khách tự đăng ký, tự tạo cửa hàng | Không |
| **SaaS nhiều cửa hàng (manual provisioning)** | KiotViet | Bạn tạo cửa hàng và tài khoản admin | **Có** |

### 1.3. Các yêu cầu cốt lõi

#### 1.3.1. Subdomain riêng cho mỗi cửa hàng

```
suacauba.vietsalepro.com     → Cửa hàng Sữa Cậu Ba
cuahangxyz.vietsalepro.com   → Cửa hàng XYZ
admin.vietsalepro.com        → Dashboard của bạn (chủ hệ thống)
vietsalepro.com              → Trang giới thiệu / liên hệ đăng ký
```

#### 1.3.2. Không tự đăng ký

- Không có nút "Đăng ký ngay" công khai.
- Không có form tạo cửa hàng trên website.
- Khách hàng phải liên hệ Zalo/phone/email với bạn.
- Bạn tạo cửa hàng và admin account thủ công.

#### 1.3.3. Tài khoản admin do bạn cấp

- Bạn tạo user dựa trên email hoặc số điện thoại khách hàng cung cấp.
- Bạn cấp mật khẩu tạm thời hoặc gửi link đặt mật khẩu.
- User đầu tiên của cửa hàng có role **admin**.

#### 1.3.4. Cách ly dữ liệu hoàn toàn

- Cửa hàng A không thấy sản phẩm, đơn hàng, khách hàng, báo cáo của cửa hàng B.
- Nhân viên của cửa hàng A không thể đăng nhập vào cửa hàng B.
- Admin cửa hàng A có thể mời thêm nhân viên, nhưng chỉ trong cửa hàng của mình.

#### 1.3.5. Phân quyền trong mỗi cửa hàng

| Vai trò | Quyền |
|---|---|
| **Admin** | Toàn quyền cửa hàng: bán hàng, nhập hàng, báo cáo, cài đặt, quản lý nhân viên, xóa đơn |
| **Cashier** | Bán hàng, tạo đơn, thanh toán nợ, xem khách hàng, xem sản phẩm |
| **Inventory Manager** | Nhập hàng, kiểm kê, xuất hủy, quản lý lô, xem tồn kho |
| **Accountant** | Xem báo cáo, công nợ, không được sửa đơn/tồn kho |

Nếu cửa hàng chỉ có 1 người (chủ tự làm), tài khoản admin sẽ dùng toàn bộ chức năng.

### 1.4. Các luồng chính trong mô hình

#### 1.4.1. Luồng khách hàng đăng ký dịch vụ

```
Khách hàng liên hệ bạn (Zalo/phone/email)
    ↓
Bạn thu thập thông tin:
  - Tên cửa hàng
  - Subdomain mong muốn
  - Email hoặc số điện thoại làm admin
  - Gói dịch vụ (free/vip)
    ↓
Bạn vào admin dashboard
    ↓
Bạn tạo cửa hàng + tài khoản admin
    ↓
Bạn gửi thông tin đăng nhập cho khách
    ↓
Khách truy cập subdomain và đăng nhập
```

#### 1.4.2. Luồng đăng nhập

```
Khách vào suacauba.vietsalepro.com
    ↓
Hệ thống nhận ra subdomain "suacauba"
    ↓
Hệ thống tìm cửa hàng tương ứng
    ↓
Hiển thị màn hình đăng nhập của cửa hàng đó
    ↓
Khách nhập email/phone + password
    ↓
Hệ thống kiểm tra tài khoản có thuộc cửa hàng không
    ↓
Đúng → vào app
Sai → báo lỗi
```

#### 1.4.3. Luồng admin cửa hàng mời nhân viên

```
Admin cửa hàng đăng nhập
    ↓
Vào phần "Quản lý nhân viên"
    ↓
Nhập email/phone nhân viên + chọn role
    ↓
Hệ thống gửi lời mời
    ↓
Nhân viên đăng nhập subdomain của cửa hàng
    ↓
Nhân viên chỉ thấy chức năng theo role
```

---

## 2. HƯỚNG ĐI ĐỀ XUẤT: SHARED SUPABASE + SUBDOMAIN ROUTING

### 2.1. Lựa chọn tách biệt logic

Bạn đã chọn: **Tách biệt logic** (Shared Database + `tenant_id` + Row Level Security).

#### 2.1.1. Tại sao chọn tách biệt logic?

Với mô hình KiotViet-style và số lượng cửa hàng dự kiến từ vài chục đến vài nghìn:

| Tiêu chí | Tách biệt logic | Tách biệt schema | Tách biệt database |
|---|---|---|---|
| **Chi phí** | Thấp | Trung bình | Cao |
| **Quản lý** | Đơn giản | Phức tạp | Rất phức tạp |
| **Migration** | 1 lần cho tất cả | Mỗi schema 1 lần | Mỗi DB 1 lần |
| **Backup** | Backup 1 project | Backup 1 project nhưng restore phức tạp | Backup nhiều project |
| **Scale** | Tốt đến hàng nghìn tenant | Khó scale khi số tenant lớn | Khó quản lý khi số tenant lớn |
| **Cách ly dữ liệu** | Đủ tốt qua RLS | Tốt hơn | Tốt nhất |
| **Phù hợp KiotViet** | ✅ Có | Có thể sau này | Không cần thiết |

**Kết luận:** Tách biệt logic là hướng đi đúng đắn cho giai đoạn hiện tại và dài hạn của VietSale Pro.

#### 2.1.2. Tách biệt logic có đủ an toàn không?

Có, nếu làm đúng:
- Mọi bảng dữ liệu kinh doanh đều có `tenant_id`.
- RLS policies kiểm tra user có thuộc tenant đó không.
- Subdomain routing đảm bảo frontend luôn gửi đúng `tenant_id`.
- Không bao giờ dùng `service_role` key trong frontend.
- Tắt self-registration trong Supabase Auth.

Với cách này, dù dữ liệu vật lý nằm chung trong một database, logic và bảo mật vẫn cách ly hoàn toàn.

### 2.2. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────┐
│              NGƯỜI DÙNG                     │
│  Khách hàng        │  Admin cửa hàng         │
│  (muốn thuê)       │  (đang dùng)            │
└─────────────────────────────────────────────┘
              │                 │
              ▼                 ▼
┌─────────────────────────────────────────────┐
│         DNS: vietsalepro.com                │
│  *.vietsalepro.com → Cloudflare Pages       │
└─────────────────────────────────────────────┘
              │                 │
              ▼                 ▼
┌─────────────────────────────────────────────┐
│   FRONTEND: React SPA on Cloudflare Pages   │
│  Cùng 1 app, nhận diện subdomain,           │
│  gửi tenant_id kèm theo mọi request         │
└─────────────────────────────────────────────┘
              │                 │
              ▼                 ▼
┌─────────────────────────────────────────────┐
│      SUPABASE: Single Project               │
│  ┌─────────────────────────────────────┐    │
│  │ auth.users (global)                 │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ public.tenants                      │    │
│  │ public.tenant_memberships           │    │
│  │ public.tenant_subscriptions         │    │
│  │ public.system_admins                │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ products, orders, customers,...     │    │
│  │ Mỗi bảng có tenant_id               │    │
│  │ RLS cách ly theo tenant             │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ Storage: bucket tenant-assets       │    │
│  │ Path: {tenant_id}/...             │    │
│  │ RLS cách ly file theo tenant        │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  admin.vietsalepro.com                      │
│  Dashboard chỉ bạn dùng để tạo cửa hàng      │
└─────────────────────────────────────────────┘
```

### 2.3. Các thành phần chính

#### 2.3.1. DNS & Subdomain (Cloudflare Pages — đã chọn)

- Hosting trên **Cloudflare Pages**.
- Dùng DNS wildcard: `*.vietsalepro.com` → Pages project (`<project>.pages.dev`).
- Cloudflare tự động cấp SSL wildcard; bật Cloudflare proxy để có thêm bảo mật ở edge.
- Mọi subdomain đều trỏ về cùng một React SPA.
- SPA tự động nhận diện subdomain từ `window.location.host`.

**Ví dụ:**

```ts
const host = window.location.host; // 'suacauba.vietsalepro.com'
const subdomain = host.split('.')[0]; // 'suacauba'
```

> **Gói dịch vụ:** 2 gói — Free (50 SKU, 300 đơn/tháng, 1 user) và VIP (69K/tháng, 999.999 SKU, 999.999 đơn/tháng, 999 user).

#### 2.3.2. Tenant Table

```sql
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,              -- Tên cửa hàng
  subdomain text UNIQUE NOT NULL,  -- suacauba
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended', 'pending')),
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'vip')),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 2.3.3. Tenant Memberships Table

```sql
CREATE TABLE public.tenant_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'cashier', 'inventory_manager', 'accountant')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_memberships_user ON public.tenant_memberships(user_id);
CREATE INDEX idx_tenant_memberships_tenant ON public.tenant_memberships(tenant_id);
```

#### 2.3.4. Tenant Subscriptions Table

```sql
CREATE TABLE public.tenant_subscriptions (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'vip')),
  max_users integer NOT NULL DEFAULT 1,
  max_products integer NOT NULL DEFAULT 50,
  max_orders_per_month integer NOT NULL DEFAULT 300,
  current_month_orders integer NOT NULL DEFAULT 0,
  current_month_start date NOT NULL DEFAULT CURRENT_DATE,
  billing_status text DEFAULT 'ok',
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

#### 2.3.5. System Admins Table

```sql
CREATE TABLE public.system_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
```

#### 2.3.6. Business Tables với tenant_id

Tất cả bảng kinh doanh cần thêm cột `tenant_id`:

```sql
ALTER TABLE public.products ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.orders ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.customers ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.suppliers ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.import_receipts ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
-- ... tất cả các bảng khác
```

Các bảng con (order_items, import_items, v.v.) cũng cần `tenant_id` để RLS hiệu quả và không cần JOIN nhiều.

### 2.4. Cơ chế bảo mật

#### 2.4.1. Tắt self-registration

Trong Supabase Dashboard:
- Authentication → Providers → Email
- Tắt `Enable new signups`
- Tắt tất cả social providers

Kết quả: không ai có thể tự tạo tài khoản từ frontend.

#### 2.4.2. Chỉ bạn mới tạo được user

Dùng Supabase Edge Function với `service_role` key:

```ts
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

await supabaseAdmin.auth.admin.createUser({
  email: 'suacauba@gmail.com',
  password: tempPassword,
  email_confirm: true
});
```

**Service role key chỉ nằm trong Edge Function / backend**, không bao giờ đưa vào frontend.

> **Lưu ý quan trọng:** Không lưu `tenant_id` vào `localStorage`. Luôn xác định từ subdomain runtime.

#### 2.4.3. RLS policies mẫu

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

-- Helper: kiểm tra user có thuộc tenant không
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid()
  );
$$;

-- Helper: kiểm tra admin tenant
CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Policy cho bảng products (SELECT)
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

-- Policy cho bảng products (INSERT)
CREATE POLICY "tenant_isolation_insert"
  ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_member(tenant_id)
  );

-- Policy cho bảng products (UPDATE)
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

-- Policy cho bảng products (DELETE): chỉ admin
CREATE POLICY "tenant_isolation_delete"
  ON public.products
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.is_tenant_admin(tenant_id)
  );
```

### 2.5. Luồng hoạt động chi tiết

#### 2.5.1. Khi khách mở subdomain

```
Browser request suacauba.vietsalepro.com
    ↓
CDN/Hosting trả về React SPA
    ↓
React mount
    ↓
AuthContext gọi getSubdomain() → 'suacauba'
    ↓
Gọi supabase.rpc('get_tenant_by_subdomain', { p_subdomain: 'suacauba' })
    ↓
Trả về tenant_id + thông tin
    ↓
Lưu tenant_id vào AuthContext (KHÔNG lưu localStorage)
    ↓
Cập nhật header `x-tenant-id` cho mọi request Supabase
    ↓
Nếu user chưa login → hiển thị trang đăng nhập
Nếu user đã login → kiểm tra quyền và render app
```

#### 2.5.2. Khi user đăng nhập

```
User nhập email + password
    ↓
supabase.auth.signInWithPassword()
    ↓
Auth thành công → có user_id
    ↓
App kiểm tra:
    SELECT role FROM tenant_memberships
    WHERE tenant_id = :tenant_id AND user_id = :user_id
    ↓
Nếu có kết quả → user thuộc cửa hàng này → vào app
Nếu không có → đăng xuất và báo lỗi
```

#### 2.5.3. Khi app gọi dữ liệu

```ts
// lib/supabase.ts
let currentTenantId: string | null = null;

export const setCurrentTenantId = (tenantId: string | null) => {
  currentTenantId = tenantId;
};

// ponytail: custom fetch wrapper để header x-tenant-id cập nhật động theo subdomain.
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

// Ví dụ: lấy danh sách sản phẩm
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', currentTenantId);
```

RLS đảm bảo:
- Nếu `currentTenantId` sai, user không thuộc tenant đó → không có dữ liệu.
- Nếu frontend bị lỗi hoặc header bị giả mạo, `is_tenant_member(tenant_id)` vẫn chặn.
- Nếu request thiếu header, `current_tenant_id()` trả về `NULL` và RLS từ chối.

### 2.6. So sánh với các hướng khác

#### 2.6.1. Tại sao không dùng database-per-tenant?

Với mỗi cửa hàng một Supabase project:
- Mỗi project có database, auth, storage riêng.
- Chi phí tăng theo số cửa hàng.
- Quản lý hàng trăm/nghìn project là không thể.
- Không cần thiết cho hệ thống bán hàng thông thường.

**Phù hợp khi:** Mỗi cửa hàng là doanh nghiệp lớn, trả phí cao, yêu cầu cách ly vật lý tuyệt đối.

**Không phù hợp với VietSale Pro** vì đối tượng là cửa hàng nhỏ/lẻ.

#### 2.6.2. Tại sao không dùng schema-per-tenant?

Với mỗi cửa hàng một schema trong cùng database:
- Cách ly tốt hơn shared table.
- Nhưng migration phức tạp: mỗi lần thay đổi schema phải áp dụng cho tất cả schema.
- Khó tối ưu query cross-tenant.
- Backup/restore 1 tenant phức tạp.

**Phù hợp khi:** Số lượng cửa hàng vừa phải (50-200) và yêu cầu cách ly cao hơn.

**Không phù hợp với VietSale Pro giai đoạn đầu** vì tăng độ phức tạp vận hành đáng kể.

#### 2.6.3. Tại sao tách biệt logic là đủ?

KiotViet, Sapo, Shopify đều dùng shared database với tenant isolation trong giai đoạn đầu và scale lên. Điểm then chốt là:
- RLS đúng.
- Index tốt.
- Subdomain routing đúng.
- Không để lộ service role key.

### 2.7. Các rủi ro và cách giảm thiểu

| Rủi ro | Mức độ | Cách giảm thiểu |
|---|---|---|
| RLS sai → lộ dữ liệu tenant khác | Cao | Test kỹ, viết integration test, audit policies |
| Service role key lộ ra frontend | Cao | Chỉ dùng trong Edge Function, kiểm tra code review |
| Self-registration chưa tắt | Cao | Kiểm tra Supabase Dashboard, tắt sign-up |
| Subdomain trùng hoặc reserved | Trung bình | Validate subdomain, danh sách reserved |
| User thuộc nhiều tenant nhầm | Trung bình | Kiểm tra membership trong login flow |
| Tenant bị suspend vẫn đăng nhập | Trung bình | Kiểm tra tenants.status sau login |
| Query chậm khi nhiều tenant | Trung bình | Index trên tenant_id, partition bảng lớn |

### 2.8. Các quyết định kỹ thuật quan trọng

#### 2.8.1. Một Supabase project duy nhất

- Dùng 1 project cho production.
- Dùng 1 project khác cho staging (bắt buộc).
- Không dùng project riêng cho mỗi cửa hàng.

#### 2.8.2. Auth.users là global

- `auth.users` chứa tài khoản đăng nhập của tất cả user trên hệ thống.
- Không có khái niệm tenant trong `auth.users`.
- Tenant được xác định qua `tenant_memberships`.

#### 2.8.3. Subdomain là định danh tenant

- Subdomain → slug → tenant_id.
- Không dùng path (`vietsalepro.com/suacauba`) vì dễ nhầm và kém chuyên nghiệp.
- Không dùng query param (`vietsalepro.com/?tenant=suacauba`) vì không bảo mật.

#### 2.8.4. Role trong tenant_memberships, không trong auth metadata

- Không dùng `auth.users.raw_user_meta_data` để lưu role.
- Dùng `public.tenant_memberships.role` vì:
  - Dễ query.
  - Có khóa ngoại.
  - Dễ audit.
  - Hỗ trợ user thuộc nhiều tenant với role khác nhau.

#### 2.8.5. Admin dashboard riêng

- `admin.vietsalepro.com` chỉ cho bạn (chủ hệ thống) và system admin.
- Dùng `service_role` key để tạo tenant và user.
- Không cho phép admin cửa hàng truy cập.

#### 2.8.6. `tenant_id` kiểu UUID

- `tenant_id` là `UUID` để đồng bộ với `auth.users(id)`.
- Tránh dùng `TEXT` để không phải cast khi join và tạo FK.

#### 2.8.7. Không lưu `tenant_id` vào `localStorage`, không fallback

- `tenant_id` lấy runtime từ subdomain.
- Không lưu `localStorage` để tránh stale data.
- `current_tenant_id()` đọc từ request header và trả về `NULL` nếu thiếu.
- Không fallback về tenant đầu tiên của user.

### 2.9. Các bước triển khai tóm tắt

Khi bạn yêu cầu implement, thứ tự sẽ là:

1. **Tạo foundation DB**
   - `tenants`
   - `tenant_memberships`
   - `tenant_subscriptions`
   - `system_admins`

2. **Thêm tenant_id vào tất cả bảng kinh doanh**

3. **Tạo helper functions và RLS policies**
   - `is_tenant_member`
   - `is_tenant_admin`
   - `has_tenant_role`
   - `get_tenant_by_subdomain`

4. **Xóa tất cả policy `public` cũ**

5. **Sửa frontend**
   - `lib/tenant.ts`
   - `AuthContext`
   - `Login.tsx`
   - `App.tsx`
   - `services/supabaseService.ts`

6. **Tạo admin dashboard**
   - `admin.vietsalepro.com`

7. **Tạo Edge Functions**
   - `create-tenant-admin`
   - `invite-user-to-tenant`
   - `check-subdomain-availability`
   - `reset-password`
   - `audit-log-writer`
   - `process-checkout`

8. **Thêm RBAC**
   - Policies theo role
   - UI ẩn/hiện menu

9. **Thêm audit log, subscription limits, rate limiting (`rate_limit_logs` trong Supabase)**

10. **Backfill dữ liệu cũ và tạo membership cho user hiện có**

11. **Thêm unique index theo tenant (SKU, mã đơn, mã hóa đơn) và cách ly offline queue**

12. **Thiết lập backup strategy và data retention**
    - Backup: Free plan dùng `supabase db dump`; khi vận hành thật nâng Pro + PITR.
    - Data retention: dùng Supabase cron extension để archive đơn hàng, partition audit log, clean processed_operations/rate_limit_logs.

13. **Test trên staging với 2-3 tenant thật**

### 2.10. Các yêu cầu bổ sung quan trọng

- **Backfill membership cho user hiện có:** tất cả user trong `auth.users` trở thành admin của tenant đầu tiên để tránh mất quyền đăng nhập.
- **SKU / mã đơn / mã hóa đơn unique theo tenant:** dùng composite unique index `(tenant_id, ...)`.
- **Offline queue cách ly theo tenant:** mỗi operation lưu `tenant_id`, sync chỉ theo tenant hiện tại.
- **Password reset flow:** admin tenant/system admin reset password cho nhân viên, link redirect về đúng subdomain; dùng email mặc định của Supabase Auth.
- **Rate limiting:** lockout đăng nhập sai, giới hạn tạo tenant/check subdomain/mời nhân viên; triển khai bằng bảng `rate_limit_logs` trong Supabase.
- **Backup strategy:** Supabase CLI (`supabase db dump`) trên Free plan; khi vận hành thật nâng Pro + bật PITR. Test restore định kỳ.
- **Data retention:** dùng Supabase cron extension để archive `orders`/`stock_movements` > 2 năm, partition `app_audit_log`, clean `processed_operations` cũ > 90 ngày, clean `rate_limit_logs` cũ > 24h.
- **Hosting:** Cloudflare Pages với wildcard DNS `*.vietsalepro.com`.
- **Storage:** bucket `tenant-assets` dùng chung, path theo `tenant_id/`, RLS cách ly file.

---

## 3. KẾT LUẬN

Với mô hình **KiotViet-style + manual provisioning + subdomain**:

- **Hướng đi đúng là Shared Supabase + Subdomain Routing + Tách biệt logic.**
- Một Supabase project duy nhất đủ cho hàng trăm đến hàng nghìn cửa hàng.
- Subdomain là cách định danh tenant tự nhiên và chuyên nghiệp.
- RLS policies phải chặt chẽ trên 100% bảng kinh doanh.
- Self-registration phải tắt hoàn toàn.
- Service role key chỉ dùng trong backend/Edge Function.

Khi bạn sẵn sàng, tôi sẽ bắt đầu implement từ **bước 1: Tạo foundation DB cho multi-tenancy**.
