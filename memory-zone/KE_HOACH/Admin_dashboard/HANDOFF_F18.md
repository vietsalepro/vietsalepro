# Handoff — Admin Dashboard Sub-phases F18..F20

> Chat date: 2026-07-09
> Source: `KE_HOACH_XU_LY_LOI_ADMIN_DASHBOARD_SUB_PHASE.md`
> Tiếp theo: **F18 — P5.1d: search_path audit (billing/ops/2FA/webhook/notification)** + **F19 — P5.1e: notification logs & webhook URL** + **F20 — P5.2: bootstrap system admin**
> Context: **~152.8 KB** — gộp F18+F19+F20 để tận dụng context; vẫn an toàn dưới ngưỡng 200K.

---

## Đã làm xong (F16..F17)

### F16 — P5.1b: system_settings updated_by trigger

- `supabase/migrations/20250706000005_phase_p6_operations_support.sql`
  - Bỏ `DEFAULT auth.uid()` trên cột `system_settings.updated_by`.
  - Thêm `ALTER COLUMN updated_by DROP DEFAULT` cho DB hiện có.
  - Thêm trigger `system_settings_updated_by_trigger` (`BEFORE INSERT OR UPDATE`) gọi `system_settings_set_updated_by()` để set `updated_by = auth.uid()` — client không thể giả mạo.
  - Xóa các assignment `updated_by = auth.uid()` thừa trong `set_default_plan_limits`, `set_maintenance_mode` và `run_data_retention`.
- `20250706000007_phase_p7_1_billing_schema_bank_config.sql` không có bảng nào dùng `updated_by DEFAULT auth.uid()` nên không cần sửa.

### F17 — P5.1c: search_path audit (core/security)

- Kiểm tra 7 migration core/security: tất cả function `SECURITY DEFINER` đều đã có `SET search_path = public`.
- Không cần chỉnh sửa.

- `npm run lint`: PASS
- `npm run build`: PASS
- Commit: `d249767` trên `master` (chưa push).

---

## Sub-phases tiếp theo (gộp F18..F20)

### F18 — P5.1d: search_path audit (billing/ops/2FA/webhook/notification)

Files cần đọc/sửa:
- `supabase/migrations/20250706000005_phase_p6_operations_support.sql` (~13.7 KB)
- `supabase/migrations/20250706000007_phase_p7_1_billing_schema_bank_config.sql` (~8.3 KB)
- `supabase/migrations/20250706000008_phase_p7_2_invoice_create_pricing.sql` (~4.5 KB)
- `supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql` (~6.1 KB)
- `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql` (~11.2 KB)
- `supabase/migrations/20250707000002_phase_p9_2_billing_automation_dashboard.sql` (~15.7 KB)
- `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql` (~10 KB)
- `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` (~12 KB)
- `supabase/migrations/20250707000005_phase_p11_1_ticket_schema_backend.sql` (~13 KB)
- `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql` (~7.9 KB)
- `supabase/migrations/20250708000005_phase_p14_2_restore_archive.sql` (~7.1 KB)
- `supabase/migrations/20250708000008_phase_p15_2_webhooks.sql` (~17 KB)
- `supabase/migrations/20250708000013_phase_p17_1_2fa_totp.sql` (~9.5 KB)
- `supabase/migrations/20250708000014_phase_p17_2_login_history.sql` (~9.9 KB)

Công việc:
1. Grep toàn bộ `SECURITY DEFINER` trong codebase migration.
2. Thêm `SET search_path = public` vào mọi function `SECURITY DEFINER` trong các file trên còn thiếu.
3. Chỉ sửa những hàm thiếu; nếu đã có thì giữ nguyên.

Acceptance:
- Không còn function `SECURITY DEFINER` thiếu `search_path` trong toàn bộ migration.
- `npm run lint` + `npm run build` pass.

Rollback: Backup các migration; revert nếu lỗi.

---

### F19 — P5.1e: Notification logs & webhook URL

Files cần đọc/sửa:
- `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql` (~7.9 KB, 254 dòng)
- `supabase/migrations/20250708000008_phase_p15_2_webhooks.sql` (~17 KB, 547 dòng)

Công việc:
1. Policy `SELECT` của `notification_logs` thêm điều kiện `is_tenant_member(tenant_id)` (chỉ system admin hoặc member của tenant đó được đọc).
2. Webhook URL chặn nội mạng / metadata endpoint; chỉ chấp nhận public HTTPS.
   - Có thể dùng check domain/IP blacklist (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16, ::1, fc00::/7) và block `localhost`.
   - Từ chối URL không bắt đầu bằng `https://`.

Acceptance:
- User không thuộc tenant không đọc được `notification_logs`.
- Webhook URL phải là public domain HTTPS; nội mạng / metadata / non-HTTPS bị từ chối.
- `npm run lint` + `npm run build` pass.

Rollback: Backup 2 migration; revert nếu lỗi.

---

### F20 — P5.2: Bootstrap system admin

Files cần đọc/sửa:
- `supabase/migrations/20250704000000_phase2_tenant_foundation.sql` (~6.9 KB, 182 dòng)
- (Tùy chọn) Tái sử dụng Edge Function `create-system-admin` đã deploy.

Công việc:
1. Thêm seed SQL hoặc gọi Edge Function để tạo system admin đầu tiên từ biến môi trường / service role.
2. Hoặc tạo migration seed placeholder email cần thay đổi sau deploy.

Acceptance:
- Sau deploy lần đầu, có ít nhất 1 system admin hợp lệ.
- Không hardcode password/secret trong migration.
- `supabase migration up` pass.
- `npm run lint` + `npm run build` pass.

Rollback: Xóa seed nếu tạo user sai; cập nhật email/password qua Supabase dashboard.

---

## Verification tổng hợp (F18..F20)

- `npm run lint`: PASS
- `npm run build`: PASS
- Không còn function `SECURITY DEFINER` thiếu `SET search_path = public` trong toàn bộ migration.
- `notification_logs` RLS chỉ cho phép member đúng tenant / system admin.
- Webhook URL chỉ chấp nhận public HTTPS, từ chối nội mạng/metadata.
- Có system admin bootstrap hợp lệ, không leak secret trong migration.

---

## Context assessment

| Sub-phase | File context (KB) | Ghi chú |
|-----------|-------------------|---------|
| F18 | ~145.9 | 14 migration, nặng về số lượng file nhưng mỗi file thay đổi nhỏ |
| F19 | ~25 (chủ yếu trùng file F18) | 2 migration, policy + webhook URL validation |
| F20 | ~6.9 | 1 migration, bootstrap system admin |
| **F18+F19+F20** | **~152.8** | Vừa dưới 200K, gộp để tận dụng context 1 chat |

- F18 đơn lẻ ~145.9 KB < 200K; nếu để riêng sẽ lãng phí context.
- F19 dùng 2 file đã nằm trong F18, gộp không tăng đáng kể context.
- F20 chỉ thêm 1 file nhỏ, vẫn giữ tổng < 200K.
- Nếu gộp thêm F21 (`pages/SystemAdminDashboard.tsx` ~112 KB) sẽ vượt ~230K, nên để F21 riêng.

Handoff sang: **F21 — P6.1a: SystemAdminDashboard confirm/alert**.
