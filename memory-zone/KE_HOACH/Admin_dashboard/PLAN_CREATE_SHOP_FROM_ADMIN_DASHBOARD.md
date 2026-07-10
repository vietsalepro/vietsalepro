# Plan — Tạo shop (tenant) trực tiếp từ Admin Dashboard

> Phiên bản: 2026-07-10  
> Người chốt: SUACAUBA  
> Phương án đã chọn: **Phương án B** (tự động sinh subdomain/password **hoặc** nhập password + gửi email credential).  
> Chưa code — chỉ plan trên file.

---

## 1. Mục tiêu

System admin chỉ cần ở trong Admin Dashboard, điền thông tin shop, nhấn **Tạo cửa hàng** là:

1. Hệ thống tự tạo subdomain `shop-xxx.vietsalepro.com` (hoạt động ngay vì wildcard domain đã có).
2. Tự tạo user admin cho shop (email do admin nhập, password tự sinh hoặc do admin nhập).
3. Hiển thị credential trên dashboard để copy.
4. Gửi email thông báo credential đến email admin shop.
5. Không cần vào Supabase Studio, không cần vào Vercel Dashboard.

---

## 2. Xác nhận domain/Vercel

Ảnh domain config hiện tại:

- `www.vietsalepro.com`
- `*.vietsalepro.com`
- `admin.vietsalepro.com`
- `master.vietsalepro.com`

### Kết luận kiểm tra

- `*.vietsalepro.com` là **wildcard domain**, đã đủ để phục vụ mọi subdomain dạng `shop-xxx.vietsalepro.com` mà **không cần thêm từng subdomain** trên Vercel.
- `www`, `admin`, `master` được add riêng cũng không ảnh hưởng.
- Kiểm tra DNS nameserver của `vietsalepro.com`:
  ```
  vietsalepro.com nameserver = ns1.vercel-dns.com
  vietsalepro.com nameserver = ns2.vercel-dns.com
  ```
- Kết luận: **DNS đã trỏ đúng về Vercel**. Các domain trong ảnh hiển thị dấu tích xanh ✅ là khớp.
- **Không cần Vercel API token** cho luồng tạo shop subdomain.

---

## 3. Không cần API/Token nhập vào dashboard

| Thứ cần | Thực tế | Cần nhập trên dashboard? |
|---|---|---|
| Supabase | Edge Function `create-tenant` chạy với `SUPABASE_SERVICE_ROLE_KEY` trong môi trường Supabase. Frontend chỉ dùng JWT của system admin đang đăng nhập. | Không |
| Vercel | Wildcard `*.vietsalepro.com` đã cấu hình. | Không |
| Resend | `RESEND_API_KEY` / `RESEND_FROM` đặt trong Supabase secrets để gửi email. | Không |

Tất cả token đều nằm **server-side** (Edge Function env), không đưa lên browser.

---

## 4. Thay đổi cần làm (theo phase)

### Phase 0 — Chuẩn bị hạ tầng email

**Mục tiêu:** đảm bảo gửi được email credential.

**Kết quả kiểm tra trước khi code:**

- Supabase secrets đã có:
  - `RESEND_API_KEY` ✅
  - `RESEND_FROM` ✅
  - `RESEND_FROM_EMAIL` ✅
- Edge Function `create-tenant` đang ACTIVE trên Supabase ✅
- Edge Function `send-template-email` đang ACTIVE trên Supabase ✅
- Email template `tenant_credentials` **chưa tồn tại** trong `public.email_templates`. Các template hiện có: `billing_confirmation`, `billing_reminder`, `ticket_assigned`, `ticket_reply`, `ticket_status`, `welcome`.

**Công việc cần làm:**

1. Thêm email template `tenant_credentials` vào bảng `email_templates` qua migration hoặc seed:
   - `key`: `tenant_credentials`
   - `name`: `Thông tin đăng nhập cửa hàng mới`
   - `subject`: `Tài khoản quản trị cửa hàng {{shop_name}}`
   - `body_html`: thông báo đăng nhập gồm `{{shop_url}}`, `{{admin_email}}`, `{{admin_password}}`
   - `variables`: `["shop_name", "shop_url", "admin_email", "admin_password"]`
   - `is_active`: `true`

**Acceptance:**

- Gọi `send-template-email` với `template_key = 'tenant_credentials'` trả về `success: true`.

---

### Phase 1 — Nâng cấp Edge Function `create-tenant`

**File:** `supabase/functions/create-tenant/index.ts`

**Công việc:**

1. **Nhận thêm `adminPassword` tùy chọn**
   - Parse body thêm trường `adminPassword?: string`.
   - Nếu có: validate `length >= 6`.
   - Nếu không: giữ `crypto.randomUUID()` như hiện tại.
2. **Sửa lỗi chính tả trong message** hiện có `"dấu gạng ngang"` → `"dấu gạch ngang"`.
3. **Đồng bộ limits với Plan Builder**
   - Không hard-code `max_users / max_products / max_orders_per_month`.
   - Lấy limits mặc định theo gói từ `public.get_default_plan_limit_values(plan)` rồi insert vào `tenant_subscriptions`.
   - ponytail: KHÔNG gọi `public.create_tenant_with_admin` từ Edge Function. RPC này là `SECURITY INVOKER` và check `public.is_system_admin()` (dùng `auth.uid()`), nên khi gọi bằng service role key, `auth.uid()` = null và sẽ bị từ chối. Plan này đã quyết định không thay đổi RPC, vì vậy chỉ dùng cách lấy limits từ `get_default_plan_limit_values` rồi insert tay.
4. **Gửi email credential sau khi tạo thành công**
   - Sau khi insert audit log, gọi `supabaseAdmin.functions.invoke('send-template-email', { body: { template_key: 'tenant_credentials', to: adminUser.email, variables: { shop_name, shop_url, admin_email, admin_password } } })`.
   - `supabaseAdmin.functions.invoke` **trả về `{ data, error }`**, không throw. Phải kiểm tra `error` rõ ràng.
   - Nếu gửi email lỗi: ghi `console.error` + audit log `EMAIL_FAILED` nhưng **không rollback tenant** — vì tenant đã tạo xong và credential vẫn hiển thị trên dashboard.
   - ponytail: `action = 'EMAIL_FAILED'` cần migration sửa CHECK constraint của `app_audit_log.action` trước (hiện tại chỉ cho phép `INSERT/UPDATE/DELETE/LOGIN/LOGOUT/EXPORT`). Bổ sung migration này vào Phase 0 / F28.
5. Giữ nguyên:
   - Rate limit 10 req/phút/IP.
   - System admin authorization.
   - Subdomain validation, reserved list.
   - Rollback xóa `auth.users` nếu tạo tenant/subscription/membership lỗi.

**Acceptance:**

- Gọi với `adminPassword` tùy chỉnh → tạo user thành công với password đó.
- Gọi không có `adminPassword` → password là UUID.
- Gọi với `adminPassword` ngắn hơn 6 ký tự → trả lỗi 400.
- Email credential được gửi đến `adminUser.email`.
- Nếu `send-template-email` trả về lỗi, tenant vẫn được tạo và có audit log `EMAIL_FAILED`.
- `tenant_subscriptions` được tạo với limits đúng theo bảng `plans`.

---

### Phase 2 — Frontend service + types

**Files:**

- `services/tenantService.ts`
- `types/tenant.ts` (nếu cần interface response)

**Công việc:**

1. Thêm type:

```ts
export interface CreateTenantResult {
  tenant: Tenant;
  adminUser: { id: string; email: string; created_at?: string };
  initialPassword: string;
}
```

2. Thêm hàm:

> ponytail: `services/tenantService.ts` đã có hàm `createTenant` (insert trực tiếp `tenants`) nên tuyệt đối không đặt tên mới trùng. Dùng `createTenantWithCredentials`.

```ts
export interface CreateTenantInput {
  name: string;
  subdomain: string;
  plan: TenantPlan;
  adminEmail: string;
  adminPassword?: string;
}

export async function createTenantWithCredentials(input: CreateTenantInput): Promise<CreateTenantResult> {
  const { data, error } = await supabase.functions.invoke<CreateTenantResult & { error?: string }>('create-tenant', {
    body: {
      name: input.name.trim(),
      subdomain: input.subdomain.trim().toLowerCase(),
      email: input.adminEmail.trim().toLowerCase(),
      plan: input.plan,
      adminPassword: input.adminPassword,
    },
  });
  if (error) {
    throw new Error(error.message || 'Tạo cửa hàng thất bại');
  }
  if (!data || typeof data !== 'object' || !data.tenant || !data.adminUser || typeof data.initialPassword !== 'string') {
    throw new Error(data?.error || 'Phản hồi tạo cửa hàng không hợp lệ');
  }
  return {
    tenant: mapTenantFromDB(data.tenant),
    adminUser: data.adminUser,
    initialPassword: data.initialPassword,
  };
}
```

**Acceptance:**

- Hàm validate đúng response shape.
- Lỗi từ Edge Function được throw ra message rõ ràng.
- Không gây lỗi compile do trùng tên với `createTenant` hiện có.

---

### Phase 3 — Dashboard UI

**File:** `pages/SystemAdminDashboard.tsx`

**Công việc:**

1. **Form tạo shop mới:**
   - Tên cửa hàng.
   - Subdomain (input + nút Kiểm tra; tự động đề xuất slug từ tên cửa hàng, cho phép sửa).
   - Gói dịch vụ (`free` / `vip`).
   - Email admin shop (bắt buộc).
   - Toggle **“Tự động sinh mật khẩu”** / **“Nhập mật khẩu”**.
   - Nếu chọn nhập: hiện input password + nút “Sinh ngẫu nhiên”.
2. **Validation:**
   - Email phải hợp lệ (dùng regex đơn giản, ví dụ `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
   - Password tối thiểu 6 ký tự nếu nhập.
   - Subdomain phải hợp lệ và đã kiểm tra available.
3. **Submit:**
   - Gọi `createTenantWithCredentials(...)` thay cho `createTenantWithAdmin(...)`.
   - Giữ loading state.
4. **Kết quả thành công:**
   - Hiển thị card kết quả gồm:
     - Link shop: `https://{subdomain}.vietsalepro.com`
     - Email admin
     - Password (có nút Copy)
     - Nút “Đăng nhập với tư cách admin” (reuse `handleLoginAs` / `startImpersonation`)
   - Đặt lại form về mặc định.
5. **Xử lý lỗi:**
   - Subdomain đã tồn tại.
   - Email đã được sử dụng.
   - Rate limit.
   - Lỗi server.

**Acceptance:**

- Tạo shop với password tự sinh thành công, hiển thị credential.
- Tạo shop với password nhập thành công.
- Click link shop mở đúng subdomain.
- Copy password hoạt động.
- Lỗi hiển thị rõ ràng bằng tiếng Việt.

---

### Phase 4 — Kiểm thử

**Files mới:**

- `tests/smoke/admin-dashboard-create-tenant.test.ts`
- `tests/integration/create-tenant-integration.test.ts` (nếu cần)

**Công việc:**

1. Smoke test mock `supabase.functions.invoke('create-tenant', ...)` cho `createTenantWithCredentials`:
   - success với password tự sinh,
   - success với password nhập,
   - lỗi email trùng,
   - lỗi subdomain trùng,
   - lỗi password ngắn,
   - lỗi không phải system admin.
2. Cập nhật mock `tests/mocks/supabase.ts` nếu cần thêm `create-tenant`.
3. **Không xóa `createTenantWithAdmin` đột ngột** — nhiều smoke test cũ vẫn dùng nó để seed tenant. Nếu muốn xóa, phải refactor đồng loạt các test đó trong cùng một phase.
4. Chạy `npm run lint` và `npx vitest run`.

**Acceptance:**

- Tất cả test pass.
- `npm run lint` pass.
- Không có lỗi compile do trùng tên hàm.

---

### Phase 5 — Deploy & Smoke test production

**Công việc:**

1. Deploy Edge Function:
   ```bash
   supabase functions deploy create-tenant
   ```
2. Commit/push frontend (nếu chưa).
3. Deploy frontend lên Vercel.
4. Smoke test trên production:
   - Đăng nhập system admin.
   - Tạo shop test với email nhận thực.
   - Kiểm tra email credential được gửi đến hộp thư.
   - Truy cập `https://{subdomain}.vietsalepro.com`.
   - Đăng nhập bằng email/password vừa tạo.
   - Archive/xóa shop test sau khi xong.
   - Xóa auth user test, audit log test và `rate_limit_logs` của IP test để dữ liệu production sạch.

**Acceptance:**

- Tạo shop + đăng nhập + nhận email thành công trên production.

---

## 5. Rollback / an toàn

- Nếu tạo tenant lỗi ở giữa chừng, Edge Function vẫn xóa `auth.users` đã tạo (logic hiện có).
- Nếu email gửi lỗi, tenant không bị xóa; system admin vẫn thấy credential trên dashboard.
- Nếu cần rollback toàn bộ: revert code, redeploy Edge Function cũ, xóa các tenant test bằng UI archive.

---

## 6. Không làm trong plan này

- Không tích hợp Vercel API cho subdomain `*.vietsalepro.com` vì không cần.
- Không làm custom domain riêng cho từng shop (vd `shopabc.com`).
- Không thay đổi RPC `create_tenant_with_admin`; giữ lại cho các luồng nội bộ khác.
- Không xóa `createTenantWithAdmin` trong `services/tenantService.ts` vì nhiều test cũ còn dùng.
- Không tạo OpenSpec change ở bước này (sẽ làm sau khi plan được duyệt).

---

## 7. Note về subdomain auto-generate

Auto-generate slug từ tên cửa hàng là trợ giúp UI, không bắt buộc. Ví dụ:

- Tên: `"Cửa hàng Sữa Cậu Ba"` → đề xuất: `cuahang-sua-cau-ba`
- Nếu trùng, tự động thêm số hoặc để admin sửa.

Logic slug nên dùng tiếng Việt không dấu + thay khoảng trắng bằng `-`, lowercase, loại bỏ ký tự đặc biệt, giới hạn 63 ký tự.

---

## 8. Tóm tắt phương án đã chọn

**Phương án B — Tự động hoặc nhập password + gửi email credential.**

- Tận dụng Edge Function `create-tenant` sẵn có.
- Mở rộng thêm `adminPassword` tùy chọn.
- Gửi email credential qua `send-template-email`.
- Cập nhật form và kết quả trên `SystemAdminDashboard`.
- Không cần API/token nhập trên dashboard.
- Triển khai theo 5 phase trên.
