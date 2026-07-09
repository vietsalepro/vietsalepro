# Handoff — Admin Dashboard Sub-phase F27

> Chat date: 2026-07-09
> Source: `KE_HOACH_XU_LY_LOI_ADMIN_DASHBOARD_SUB_PHASE.md`
> Sub-phase: **F27 — Production migration**

---

## Đã làm xong (F27)

### 1. Cập nhật bootstrap email

- File <ref_file file="c:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/migrations/20260709000000_bootstrap_system_admin.sql" /> thay đổi placeholder `admin@example.com` thành `suacauba@gmail.com` (email system admin đang tồn tại trên production).
- ponytail: migration bootstrap chỉ chạy nếu `public.system_admins` rỗng; production đã có 1 system admin nên migration không tạo thêm user, chỉ đảm bảo email đúng nếu database được reset từ đầu.

### 2. Production migration run

- Project linked: `rsialbfjswnrkzcxarnj` (QLBH).
- Trạng thái ban đầu: `supabase migration list --linked` cho thấy 17 remote-only versions (do các phase P17/P18 trước đó được push dưới dạng split migrations) và 12 local-only versions tương ứng.
- Sửa lịch sử migration:
  - `supabase migration repair --status reverted --linked <17 remote-only versions>` để remote history khớp local directory.
  - `supabase migration repair --status applied --linked <8 local versions đã áp dụng>` (baseline, P17.1, P17.2, P17.3, P17.4, P18.1, P18.2, P18.3).
- Chạy `supabase db push --linked --yes` để áp dụng 4 migration mới thực sự:
  - `20260708000003_fix_update_tenant_overload.sql`
  - `20260708000004_fix_system_admin_rls.sql`
  - `20260709000000_bootstrap_system_admin.sql`
  - `20260709000001_fix_security_definer_search_path.sql`
- Kết quả: 4 migrations applied successfully; cảnh báo `pg-delta` certificate cache không ảnh hưởng đến việc apply migrations.

### 3. Smoke test trên production

- Tạo tài khoản system admin tạm thời qua Supabase Auth Admin API (sử dụng service role key, không lưu key vào source), thêm vào `public.system_admins`.
- Sign in bằng email/password thông qua Supabase Auth REST API.
- Gọi `create_tenant_with_admin` để tạo tenant test.
- Gọi `update_tenant_subscription` để đổi gói từ `free` sang `vip` và xác minh `plan = 'vip'`.
- Gọi `delete_tenant_safe` để archive tenant test.
- Dọn dẹp: xóa user tạm khỏi `auth.users`, `auth.identities`, `public.system_admins`; hard-delete tenant test và các bảng liên quan (`tenant_memberships`, `tenant_subscriptions`, `app_audit_log`, `tenants`).
- Kết quả: **SMOKE TEST PASSED**.

### 4. Verification sau migration

| Kiểm tra | Kết quả |
|---|---|
| `supabase migration list --linked` | Tất cả local migrations đã có mặt trên remote, không còn pending. |
| `public.system_admins` count | 1 (suacauba@gmail.com) |
| SECURITY DEFINER search_path (F26 query) | **0** vi phạm |
| `npm run lint` | PASS |
| `npm run build` | PASS |

---

## Files changed

- `supabase/migrations/20260709000000_bootstrap_system_admin.sql` *(bootstrap email cập nhật)*

---

## Commit

- `5d9cdab9` — `F27: production migration and bootstrap email update.`
- Chưa push; chưa deploy frontend lên Vercel.

---

## Notes

- Smoke test sử dụng tài khoản tạm được tạo và xóa hoàn toàn; không để lại dữ liệu test trên production.
- Service role key và password tạm chỉ tồn tại trong bộ nhớ / file tạm trong quá trình test; các file tạm đã xóa.
- Các file `dist/` và `supabase/.temp/` thay đổi do build/CLI nhưng không được commit; chỉ commit file migration.

---

## Hướng đi tiếp theo

- Push commit lên GitHub nếu cần.
- Deploy frontend lên Vercel (production build đã pass).
- Kiểm tra kỹ hơn trên UI production: đăng nhập system admin, tạo tenant, đổi subscription qua giao diện.
