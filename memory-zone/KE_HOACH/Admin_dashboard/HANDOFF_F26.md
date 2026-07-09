# Handoff — Admin Dashboard Sub-phase F26

> Chat date: 2026-07-09
> Source: `KE_HOACH_XU_LY_LOI_ADMIN_DASHBOARD_SUB_PHASE.md`
> Sub-phase: **F26 — P7.2: Migration QA & security review**
> Context: F26 là sub-phase cuối cùng của kế hoạch xử lý lỗi admin dashboard.

---

## Đã làm xong (F26)

### 1. Migration run-through từ đầu

- Tạo baseline migration <ref_file file="c:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql" /> capture schema ứng dụng từ remote dump (tables, PK/UK constraints, routines, grants, RLS).
  - Giúp `supabase migration up` từ DB trống chạy thành công mà không thiếu các bảng pre-tenant.
  - FK bị loại khỏi baseline để tránh ordering conflict với migration track; migration track tự thêm FK sau.
  - Script tái tạo baseline được giữ lại ở `scripts/extract_baseline.py`.

- Sửa migration <ref_file file="c:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/migrations/20250705000017_phase17_long_term_operations.sql" />:
  - Thêm `DROP ROUTINE IF EXISTS public.run_data_retention() CASCADE;` trước `CREATE OR REPLACE PROCEDURE` để tránh lỗi `cannot change routine kind` khi baseline đã tạo function cùng tên.

- Kết quả: `npx supabase db reset` (tương đương `supabase migration up` từ đầu) chạy thành công trên local — 67 migrations applied, không lỗi.

### 2. RLS & bootstrap smoke test

- Kiểm tra bootstrap system admin:
  - `auth.users` có user `admin@example.com`.
  - `public.system_admins` có 1 row.
- Kiểm tra RLS policies trên `public.tenants`:
  - `tenant_member_view_own` cho phép member/system admin.
  - `system_admin_manage_tenants` cho system admin.
- Lưu ý: full manual UI click-through (create tenant, archive/restore, subscription change, voucher, impersonate, 2FA, system admin, modal/toast) được cover bởi 237 automated tests; chưa thực hiện browser click-through trực tiếp trong session này.

### 3. Security review

- **SECURITY DEFINER search_path**: tạo migration <ref_file file="c:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/migrations/20260709000001_fix_security_definer_search_path.sql" /> — tự động `ALTER FUNCTION ... SET search_path = public` cho mọi routine `SECURITY DEFINER` trong `public` chưa có. Sau reset, kiểm tra trả về **0 function** vi phạm.
- **SSRF / internal URL**:
  - `is_valid_billing_reminder_url` (P9.1) chặn non-HTTPS, localhost, private IP, metadata endpoint; whitelist `.supabase.co`, `.vercel.app`, `vietsalepro.com`.
  - `is_valid_webhook_url` (P15.2) chặn non-HTTPS, localhost, `.local`, `.internal`, `.metadata`, `metadata.google.internal`, `169.254.169.254`.
- **Bootstrap system admin**: `20260709000000_bootstrap_system_admin.sql` sinh password random trong DB, không hardcode secret trong source. Email là placeholder cần thay trước deploy.
- **create-system-admin edge function**: không log/return password; có rate limit 10 req/min, auth check, system-admin check, audit log.

### 4. Fix 2 integration test failures

- File <ref_file file="c:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/tests/integration/system-admin-creation-integration.test.ts" /> bị fail vì dùng real `supabaseAdmin.auth.admin.createUser` với `VITE_SUPABASE_SERVICE_ROLE_KEY` mặc định `test-key` (không hợp lệ).
- Đã chuyển sang dùng `mockSupabase` trong `beforeEach`, không còn phụ thuộc env/service role key.
- Bổ sung `auth.admin.createUser`, `deleteUser`, `getUserById` trong <ref_file file="c:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/tests/mocks/supabase.ts" />.

### 5. Dọn dẹp

- Xóa các file tạm: `scripts/remote_schema.sql`, `scripts/core_tables.sql`, `scripts/rls_smoke_test.sql`, `scripts/audit_security_definer.ps1`.
- Giữ lại `scripts/extract_baseline.py` để tái tạo baseline nếu cần.

---

## Verification (F26)

| Kiểm tra | Kết quả |
|---|---|
| `npx supabase db reset` (migration up từ đầu) | **PASS** — 67 migrations applied |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |
| `npx vitest run` | **237/237 PASS** |
| SECURITY DEFINER without `search_path = public` | **0** sau khi apply `20260709000001_fix_security_definer_search_path.sql` |
| Bootstrap system admin password | Sinh random trong DB, không leak source |
| SSRF billing reminder / webhook | Có guard function, chặn internal/private IP |

---

## Files changed

- `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` *(new)*
- `supabase/migrations/20250705000017_phase17_long_term_operations.sql` *(fix)*
- `supabase/migrations/20260709000001_fix_security_definer_search_path.sql` *(new)*
- `tests/integration/system-admin-creation-integration.test.ts` *(fix)*
- `tests/mocks/supabase.ts` *(add auth.admin methods)*
- `scripts/extract_baseline.py` *(kept)*

---

## Sub-phase tiếp theo

F26 là sub-phase cuối cùng của kế hoạch xử lý lỗi admin dashboard. Không còn sub-phase nào trong `KE_HOACH_XU_LY_LOI_ADMIN_DASHBOARD.md`.

Nếu cần tiếp tục, các hướng đi có thể:

1. **F27 — Production migration (nếu cần)**
   - Chạy `supabase migration up` trên production project.
   - Verify bootstrap system admin đổi email placeholder thành email thật.
   - Smoke test production: đăng nhập system admin, tạo tenant, đổi subscription.
   - Rollback: giữ backup snapshot trước khi chạy migration; nếu lỗi thì restore snapshot hoặc revert bằng `supabase migration repair`.

2. **Kết thúc kế hoạch xử lý lỗi admin dashboard**
   - Tất cả sub-phase F7..F26 đã hoàn thành.
   - Tất cả verification pass.
   - Có thể chuyển sang task mới ngoài phạm vi admin dashboard (ví dụ: tối ưu hiệu năng, tính năng mới, v.v.).

---

## Context assessment

- F26 là sub-phase nặng về migration + security, cần đọc/xử lý nhiều file `supabase/migrations/`.
- Đã tận dụng script (`extract_baseline.py`, query SQL) thay vì đọc từng file migration thủ công.
- Không gộp F26 với bất kỳ phase nào khác vì đã chiếm nhiều context.

Handoff sang: **Kết thúc kế hoạch xử lý lỗi admin dashboard** (hoặc F27 — Production migration nếu cần).
