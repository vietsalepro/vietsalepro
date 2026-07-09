# Handoff — Admin Dashboard Sub-phase F1..F6 hoàn thành

> Chat date: 2026-07-09
> Source: `KE_HOACH_XU_LY_LOI_ADMIN_DASHBOARD_SUB_PHASE.md`
> Tiếp theo: **F7 — P2.2: Type invoke & response validation**

---

## Đã làm xong (F1–F6)

### F1 — P1.1a: Constraint & purge permission
- `supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql`
  - Thay vòng lặp drop mọi CHECK constraint bằng `DROP CONSTRAINT IF EXISTS tenants_status_check`.
  - Thêm `read_only` vào enum `tenants_status_check`.
  - Cập nhật `update_tenant_status` / `update_tenant` để chấp nhận `read_only`.
  - Thêm guard `IF NOT is_system_admin()` đầu `purge_archived_tenants()`.
- `supabase/migrations/20260708000004_fix_system_admin_rls.sql`
  - Thêm `SET search_path = public` cho `get_system_admins` và `add_system_admin`.
  - Sửa upsert `ON CONFLICT ... DO UPDATE SET user_id = EXCLUDED.user_id` thành `SET updated_at = now()`.
- `supabase/migrations/20260708000000_phase_p18_1_tenant_isolation.sql` đã đọc, không cần sửa (đã có `read_only` trong check của `update_tenant`).

### F2 — P1.1b: Read-only tenant infra constraint
- `supabase/migrations/20250706000006_phase_p7_0_read_only_tenant_infra.sql`
  - Thay vòng lặp drop mọi CHECK constraint trên `status` bằng `DROP CONSTRAINT IF EXISTS tenants_status_check`.

### F3 — P1.2a: Restore tenant snapshot
- `supabase/migrations/20250708000005_phase_p14_2_restore_archive.sql`
  - Tạo bảng `tenant_restore_snapshots` lưu snapshot trước khi ghi đè.
  - Thêm parameter `p_confirm_overwrite BOOLEAN DEFAULT false` cho `restore_tenant_tables`.
  - Snapshot dữ liệu cũ thành JSONB trước khi DELETE.
  - Cập nhật `REVOKE`/`GRANT` theo signature mới `(UUID, JSONB, BOOLEAN)`.

### F4 — P1.2b: 2FA backup code entropy
- `supabase/migrations/20250708000013_phase_p17_1_2fa_totp.sql`
  - Tăng entropy backup code từ `gen_random_bytes(4)` lên `gen_random_bytes(16)`.
  - Thêm bảng `admin_2fa_backup_code_attempts` + function `purge_old_backup_code_attempts`.
  - Thêm rate limit brute-force (5 lần fail / 15 phút) trong `verify_2fa_backup_code`.
- `components/MfaChallenge.tsx`
  - Cập nhật validation backup code từ 8 ký tự lên 32 ký tự hex.
  - Cập nhật `maxLength` và disabled button cho 32 ký tự.

### F5 — P1.2c: Billing reminder SSRF
- `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`
  - Thêm `is_valid_billing_reminder_url()`:
    - Bắt buộc `https://`.
    - Chặn localhost, loopback, metadata endpoint, private IP ranges.
    - Whitelist domain: `*.supabase.co`, `*.vercel.app`, `*.vietsalepro.com` / `vietsalepro.com`.
  - Validate `p_function_url` trong `set_billing_reminder_config`.
  - Validate `v_url` trong `send_billing_reminders` trước khi gọi `pg_net`.

### F6 — P2.1: TenantPlan union & tenant query
- `types/tenant.ts`
  - `TenantPlan` từ `string` → `'free' | 'vip'`.
  - `Tenant.plan`, `TopTenant.plan`, `UpdateSubscriptionInput.plan` giữ `string` để hỗ trợ plan builder tùy chỉnh.
- `services/tenantService.ts`
  - Sửa `getCurrentUserTenants`: kiểm tra user đăng nhập, dùng `.select('tenant_id, tenants(*)').eq('user_id', userId)`.
- `pages/SystemAdminDashboard.tsx`
  - `PLANS` giữ `TenantPlan[]`.
  - `planLabel` và `calculateProration` chấp nhận `string`.
  - `form.plan`, `editForm.plan`, `subForm.plan` đổi thành `string`.
  - Bỏ các cast `as TenantPlan` không cần thiết.

---

## Backup files

- F1: `memory-zone/backup/f1/`
- F2: `memory-zone/backup/f2/`
- F3: `memory-zone/backup/f3/`
- F4: `memory-zone/backup/f4/`
- F5: `memory-zone/backup/f5/`
- F6 không cần backup (chỉ sửa TypeScript, dễ revert bằng git).

---

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS

---

## Limit / lưu ý

- F6: `TenantPlan` strict là `'free' | 'vip'`, nhưng các custom plan (ví dụ `pro` trong smoke test) vẫn được hỗ trợ nhờ `Tenant.plan: string`.
- F5: whitelist domain hiện tại hardcode `*.supabase.co`, `*.vercel.app`, `vietsalepro.com`. Nếu deploy lên domain khác, cần mở rộng whitelist.
- F4: rate limit chỉ đếm failures trong `verify_2fa_backup_code`; nếu cần rate limit toàn hệ thống, cân nhắc thêm per-IP.
- F3: `tenant_restore_snapshots` lưu snapshot JSON trong DB; nếu dữ liệu lớn, cần theo dõi dung lượng bảng.

---

## Sub-phase tiếp theo

**F7 — P2.2: Type invoke & response validation**

Files cần đọc/sửa:
- `services/tenantService.ts`
- `services/operationsService.ts`
- `services/tenantBackupService.ts`
- `services/tenantRestoreService.ts`
- `services/systemAdminService.ts`
- `services/loginHistoryService.ts`

Công việc:
1. Cấu hình typed Supabase client hoặc dùng `supabase.functions.invoke<ResponseType>(...)`.
2. Xóa các ép kiểu `(supabase as any)`.
3. Validate `data.success`, `data.userId`, `data.email` tồn tại trước khi return.
4. Thêm runtime validation cho date string trong `getAdminLoginAlerts`.

Acceptance:
- Không còn `(supabase as any)` trong codebase.
- Service throw lỗi rõ ràng khi backend trả cấu trúc không mong muốn.
- `npm run lint` + `npm run build` pass.
