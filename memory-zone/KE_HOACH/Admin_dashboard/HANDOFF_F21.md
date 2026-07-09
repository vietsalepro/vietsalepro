# Handoff — Admin Dashboard Sub-phases F21..F23

> Chat date: 2026-07-09
> Source: `KE_HOACH_XU_LY_LOI_ADMIN_DASHBOARD_SUB_PHASE.md`
> Tiếp theo: **F21 — P6.1a: SystemAdminDashboard confirm/alert** + **F22 — P6.1b: BillingConfig & TwoFactorManager confirm/alert** + **F23 — P6.1c: VoucherManager & WebhookManager confirm/alert**
> Context: **~196.1 KB** — gộp F21+F22+F23 để tận dụng context; vẫn an toàn dưới ngưỡng 200K.

---

## Đã làm xong (F18..F20)

### F18 — P5.1d: search_path audit (billing/ops/2FA/webhook/notification)

- Thêm `SET search_path = public` vào các hàm `SECURITY DEFINER` còn thiếu trong toàn bộ migration:
  - `supabase/migrations/20250704000000_phase2_tenant_foundation.sql`: 5 helper functions
  - `supabase/migrations/20250704000006_phase5_1_current_tenant_id.sql`: `current_tenant_id`
  - `supabase/migrations/20250705000008_phase10_1_db_policies_theo_role.sql`: `user_tenant_role`
  - `supabase/migrations/20250705000009_phase11_audit_log_triggers.sql`: `write_audit_log`
  - `supabase/migrations/20250705000015_phase15_staging_fixes.sql`: `is_tenant_member` (override)
  - `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql`: `create_renewal_invoices`
  - `supabase/migrations/20260708000001_phase_p18_2_white_label.sql`: `get_tenant_by_domain`
  - `supabase/migrations/20260708000002_phase_p18_3_read_replica_queue.sql`: `claim_heavy_op_job`
- Kiểm tra script toàn bộ migration: không còn `SECURITY DEFINER` thiếu `SET search_path = public`.

### F19 — P5.1e: Notification logs & webhook URL

- `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql`:
  - Policy `notification_logs_select_tenant` thêm điều kiện `public.is_tenant_member(tenant_id)`.
- `supabase/migrations/20250708000008_phase_p15_2_webhooks.sql`:
  - Thêm `public.is_valid_webhook_url` chỉ chấp nhận public HTTPS, chặn private IP ranges (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, ::1, fc00::/7), localhost, local/metadata domains.
  - Gọi validator trong `create_tenant_webhook` và `update_tenant_webhook`.

### F20 — P5.2: Bootstrap system admin

- Tạo migration mới `supabase/migrations/20260709000000_bootstrap_system_admin.sql`:
  - Nếu `public.system_admins` trống, tạo user trong `auth.users` với email placeholder `admin@example.com` và password ngẫu nhiên sinh trong DB (`extensions.crypt(...)`).
  - Không hardcode password/secret trong migration.
  - Sau deploy cần thay email placeholder và đặt lại mật khẩu qua Supabase dashboard.

- `npm run lint`: PASS
- `npm run build`: PASS
- Chưa commit (chờ review).

---

## Sub-phases tiếp theo (gộp F21..F23)

### F21 — P6.1a: SystemAdminDashboard confirm/alert

Files cần đọc/sửa:
- `pages/SystemAdminDashboard.tsx` (~110.9 KB, 2490 dòng)

Component/modal có sẵn để dùng:
- `components/ConfirmDialog.tsx`
- `components/MasterModal.tsx`
- `components/ToastContainer.tsx` + `toast(...)` / inline thông báo

Công việc:
1. Grep `window.confirm(` và `window.alert(` trong `SystemAdminDashboard.tsx`.
2. Thay `window.confirm()` bằng `ConfirmDialog` / `MasterModal` có sẵn.
3. Thay `window.alert()` bằng toast / inline modal (hoặc `ConfirmDialog` nếu cần confirm).
4. Giữ logic async: các flow vẫn phải chờ user confirm trước khi thực hiện.

Acceptance:
- Không còn `window.confirm()` / `window.alert()` trong `SystemAdminDashboard.tsx`.
- Các flow async vẫn chờ user confirm trước khi thực hiện.
- `npm run lint` + `npm run build` pass.

Rollback: Revert `SystemAdminDashboard.tsx` nếu modal gây lỗi flow.

---

### F22 — P6.1b: BillingConfig & TwoFactorManager confirm/alert

Files cần đọc/sửa:
- `components/BillingConfig.tsx` (~15.5 KB, 380 dòng)
- `components/TwoFactorManager.tsx` (~16.3 KB, 422 dòng)

Công việc:
1. Grep `window.confirm(` / `window.alert(` trong 2 file.
2. Thay bằng `ConfirmDialog` / `MasterModal` / toast có sẵn.
3. Giữ logic xác nhận.

Acceptance:
- Không còn `confirm`/`alert` trong 2 file.
- `npm run lint` + `npm run build` pass.

Rollback: Revert 2 file nếu lỗi.

---

### F23 — P6.1c: VoucherManager & WebhookManager confirm/alert

Files cần đọc/sửa:
- `components/VoucherManager.tsx` (~33.4 KB, 758 dòng)
- `components/WebhookManager.tsx` (~20.0 KB, 501 dòng)

Công việc:
1. Grep `window.confirm(` / `window.alert(` trong 2 file.
2. Thay bằng `ConfirmDialog` / `MasterModal` / toast có sẵn.
3. Giữ logic xác nhận.

Acceptance:
- Không còn `confirm`/`alert` trong 2 file.
- `npm run lint` + `npm run build` pass.

Rollback: Revert 2 file nếu lỗi.

---

## Verification tổng hợp (F21..F23)

- `npm run lint`: PASS
- `npm run build`: PASS
- Không còn `window.confirm()` / `window.alert()` trong 5 file:
  - `pages/SystemAdminDashboard.tsx`
  - `components/BillingConfig.tsx`
  - `components/TwoFactorManager.tsx`
  - `components/VoucherManager.tsx`
  - `components/WebhookManager.tsx`
- Các flow async vẫn chờ user confirm trước khi thực hiện.

---

## Context assessment

| Sub-phase | File context (KB) | Ghi chú |
|-----------|-------------------|---------|
| F21 | ~110.9 | `SystemAdminDashboard.tsx` lớn nhất |
| F22 | ~31.8 | 2 component nhỏ |
| F23 | ~53.4 | 2 component trung bình |
| **F21+F22+F23** | **~196.1** | Vừa dưới 200K, gộp để tận dụng context 1 chat |
| F24 | ~21.4 | Nếu gộp thêm F24 sẽ vượt ~217.5K, nên để riêng |

- F21 đơn lẻ ~110.9 KB < 200K; nếu để riêng sẽ lãng phí context.
- F22 + F23 nhỏ, gộp vào F21 không tăng đáng kể.
- Gộp thêm F24 sẽ vượt ngưỡng, nên để F24 riêng.

Handoff sang: **F24 — P6.2: Shell components polish**.
