# Handoff — Admin Dashboard Sub-phase F28

> Chat date: 2026-07-10  
> Source: `PLAN_CREATE_SHOP_SUB_PHASES.md`  
> Sub-phase: **F28 — Backend email infrastructure (template `tenant_credentials`)**  
> Previous handoff: `HANDOFF_F27.md`

---

## Bối cảnh

Đang làm feature “Tạo shop trực tiếp từ Admin Dashboard” (phương án B).  
Sub-phase F28 là bước đầu tiên: chuẩn bị email template để khi shop được tạo, hệ thống có thể gửi credential cho admin shop.

DNS/Vercel đã kiểm tra OK:
- `*.vietsalepro.com` wildcard đã cấu hình.
- DNS nameserver: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`.

Supabase secrets đã có:
- `RESEND_API_KEY`
- `RESEND_FROM`
- `RESEND_FROM_EMAIL`

Edge Function `send-template-email` đang ACTIVE.

Template `tenant_credentials` **chưa tồn tại** trong `public.email_templates`.

---

## Mục tiêu F28

1. Tạo migration SQL thêm email template `tenant_credentials`.
2. Chạy migration lên production.
3. Verify `send-template-email` có thể gửi được template mới.

---

## Files cần tạo

- `supabase/migrations/20260710000001_add_tenant_credentials_template.sql`
- `supabase/migrations/20260710000002_allow_email_failed_audit_action.sql`

> ponytail: tên migration dùng timestamp theo ngày thực hiện; nếu ngày khác, đổi `20260710` thành `YYYYMMDD`. Migration thứ 2 bắt buộc vì F29 sẽ ghi audit log `EMAIL_FAILED`, mà `app_audit_log.action` hiện chỉ cho phép `INSERT/UPDATE/DELETE/LOGIN/LOGOUT/EXPORT`.

---

## Hướng giải quyết chi tiết

### Bước 1 — Tạo file migration template

Nội dung file `supabase/migrations/20260710000001_add_tenant_credentials_template.sql`:

```sql
-- F28: Thêm email template gửi credential khi tạo shop từ Admin Dashboard
-- Template này được Edge Function create-tenant gọi qua send-template-email.

INSERT INTO public.email_templates (
  key,
  name,
  description,
  subject,
  body_html,
  variables,
  is_default,
  is_active
)
VALUES (
  'tenant_credentials',
  'Thông tin đăng nhập cửa hàng mới',
  'Gửi credential cho admin shop khi tạo tenant từ Admin Dashboard.',
  '[{{brand_name}}] Tài khoản quản trị cửa hàng {{shop_name}}',
  '<p>Xin chào <strong>{{admin_email}}</strong>,</p>
<p>Cửa hàng <strong>{{shop_name}}</strong> của bạn đã được tạo thành công trên {{brand_name}}.</p>
<p>Thông tin đăng nhập:</p>
<ul>
  <li>Link đăng nhập: <a href="{{shop_url}}" style="color:#2563eb">{{shop_url}}</a></li>
  <li>Email: <strong>{{admin_email}}</strong></li>
  <li>Mật khẩu: <strong>{{admin_password}}</strong></li>
</ul>
<p>Vui lòng đăng nhập và đổi mật khẩu ngay để đảm bảo an toàn.</p>
<p>Trân trọng,<br/>Đội ngũ {{brand_name}}</p>',
  jsonb_build_array('brand_name','shop_name','shop_url','admin_email','admin_password'),
  true,
  true
)
ON CONFLICT (key) DO NOTHING;
```

> ponytail: `email_templates` đã có RLS chỉ cho phép `is_system_admin()`; migration chạy bằng service role nên insert thành công. `ON CONFLICT (key) DO NOTHING` nghĩa là nếu template đã tồn tại, migration sẽ không ghi đè — muốn cập nhật phải xóa tay hoặc viết migration mới.

### Bước 1b — Sửa CHECK constraint app_audit_log.action

Tạo file `supabase/migrations/20260710000002_allow_email_failed_audit_action.sql`:

```sql
-- F28: Cho phép action 'EMAIL_FAILED' trong app_audit_log để F29 ghi log khi gửi email lỗi.
-- CHECK constraint hiện tại chỉ cho phép INSERT/UPDATE/DELETE/LOGIN/LOGOUT/EXPORT.

ALTER TABLE public.app_audit_log
DROP CONSTRAINT IF EXISTS app_audit_log_action_check,
ADD CONSTRAINT app_audit_log_action_check
CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','EMAIL_FAILED'));
```

> ponytail: Nếu tên constraint trong production khác với `app_audit_log_action_check`, dùng lệnh sau để tìm tên đúng:
> ```sql
> SELECT conname, pg_get_constraintdef(oid)
> FROM pg_constraint
> WHERE conrelid = 'public.app_audit_log'::regclass AND contype = 'c';
> ```

### Bước 2 — Kiểm tra local

```bash
npm run lint
```

Migration chỉ là SQL nên lint nhanh.

### Bước 3 — Apply lên production

Project đã linked: `rsialbfjswnrkzcxarnj`.

```bash
supabase db push --linked --yes
```

### Bước 4 — Verify trên production

1. Kiểm tra template đã có trong DB:
   ```bash
   supabase db query --linked "SELECT key, name, is_active FROM public.email_templates WHERE key = 'tenant_credentials';"
   ```

2. Gửi thử email (test mode) bằng curl hoặc Supabase dashboard:
   ```bash
   curl -X POST "https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/send-template-email" \
     -H "Authorization: Bearer <JWT_CUA_SYSTEM_ADMIN>" \
     -H "Content-Type: application/json" \
     -d '{
       "template_key": "tenant_credentials",
       "to": "email-test-cua-ban@gmail.com",
       "variables": {
         "shop_name": "Shop Test F28",
         "shop_url": "https://shop-test-f28.vietsalepro.com",
         "admin_email": "email-test-cua-ban@gmail.com",
         "admin_password": "mat-khau-test-123"
       },
       "test": true
     }'
   ```

   Expected: `{"success": true, ...}` và email được gửi đến hộp thư test.

---

## Acceptance criteria

- [x] Migration `20260710000001_add_tenant_credentials_template.sql` được tạo đúng path.
- [x] Migration `20260710000002_allow_email_failed_audit_action.sql` được tạo đúng path.
- [x] `supabase db push --linked --yes` chạy thành công.
- [x] Query DB trả về template `tenant_credentials` với `is_active = true`.
- [x] Query DB cho thấy `app_audit_log_action_check` cho phép `EMAIL_FAILED`:
  ```sql
  SELECT conname, pg_get_constraintdef(oid)
  FROM pg_constraint
  WHERE conrelid = 'public.app_audit_log'::regclass AND conname LIKE '%action%';
  ```
- [x] Gọi `send-template-email` với `template_key = 'tenant_credentials'` trả về `success: true`.
  - ponytail: Ban đầu Resend báo domain `mail.vietsalepro.com` chưa verify. Đã thêm 4 bản ghi DNS cần thiết trong Vercel (DKIM, SPF MX/TXT, Receiving MX) cho `mail.vietsalepro.com`, re-verify trên Resend và gửi thử thành công với `success: true`, id `56eaf9e1-de7d-4778-af67-fc33a7034d30`.
- [x] `npm run lint` PASS.

---

## Rollback

- Nếu muốn xóa template sau khi test:
  ```sql
  DELETE FROM public.email_templates WHERE key = 'tenant_credentials';
  ```
- Nếu muốn revert CHECK constraint:
  ```sql
  ALTER TABLE public.app_audit_log
  DROP CONSTRAINT IF EXISTS app_audit_log_action_check,
  ADD CONSTRAINT app_audit_log_action_check
  CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT'));
  ```
- Migration file có thể xóa khỏi `supabase/migrations/` nếu chưa push lên production; nếu đã push, cần tạo migration revert.

---

## Đã làm xong (điền sau khi hoàn thành)

- [x] Migration created: `supabase/migrations/20260710000001_add_tenant_credentials_template.sql`
- [x] Migration created: `supabase/migrations/20260710000002_allow_email_failed_audit_action.sql`
- [x] `supabase db push --linked --yes` result: **SUCCESS** (applied both migrations; cảnh báo Docker Desktop cache không ảnh hưởng).
- [x] Verify query result:
  - `tenant_credentials`: `is_active = true`
  - `app_audit_log_action_check`: cho phép `EMAIL_FAILED`
- [x] Email test result: **PASS** — Đã thêm DNS records trong Vercel, re-verify Resend domain, gửi thử `tenant_credentials` với `test=true` thành công. Resend email id: `56eaf9e1-de7d-4778-af67-fc33a7034d30`.
- [x] `npm run lint`: **PASS** (tsc --noEmit exit 0, no output).
- [x] Commit hash: `d57397ec1c6809c00023255cc7dfc67af8e0fb24`

---

## Handoff tiếp theo

Sau khi F28 xong, copy nội dung `HANDOFF_F29.md` vào chat task mới để tiếp tục update Edge Function `create-tenant`.
