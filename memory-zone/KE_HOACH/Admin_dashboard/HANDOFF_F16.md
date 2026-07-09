# Handoff — Admin Dashboard Sub-phases F16..F17

> Chat date: 2026-07-09
> Source: `KE_HOACH_XU_LY_LOI_ADMIN_DASHBOARD_SUB_PHASE.md`
> Tiếp theo: **F16 — P5.1b: system_settings updated_by trigger** + **F17 — P5.1c: search_path audit (core/security)**
> Context: **~88.2 KB** — gộp F16+F17 để tận dụng 200K context; F18 (~123.9 KB) để riêng cho chat sau.

---

## Đã làm xong (F15)

### F15 — P5.1a: Ticket policy

- `supabase/migrations/20250707000005_phase_p11_1_ticket_schema_backend.sql`
  - Tách `support_tickets_update` thành 2 policy: `support_tickets_update_creator` (chỉ `content`/`title`) và `support_tickets_update_staff` (admin/assigned được đổi `assigned_to`/`status`/`priority`).
  - Thêm trigger `support_tickets_update_guard` để creator không thể tự đổi status thành `resolved`.
- `npm run lint`: PASS
- `npm run build`: PASS

---

## Sub-phases tiếp theo (gộp F16..F17)

### F16 — P5.1b: system_settings updated_by trigger

Files cần đọc/sửa:
- `supabase/migrations/20250706000005_phase_p6_operations_support.sql` (~13.2 KB, 415 dòng)
- `supabase/migrations/20250706000007_phase_p7_1_billing_schema_bank_config.sql` (~8.3 KB, 198 dòng)

Công việc:
1. Thay `DEFAULT auth.uid()` trên cột `updated_by` bằng trigger `BEFORE INSERT OR UPDATE` set `updated_by = auth.uid()`.
2. Áp dụng cho các bảng `system_settings` / `bank_configs` / `billing_configs` (tùy cột `updated_by` đang dùng `DEFAULT auth.uid()`).

Acceptance:
- Insert/update không thể giả mạo `updated_by`.
- `npm run lint` + `npm run build` pass.

Rollback: Backup 2 migration; revert nếu lỗi.

---

### F17 — P5.1c: search_path audit (core/security)

Files cần đọc/sửa:
- `supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql` (~8.2 KB)
- `supabase/migrations/20250706000001_phase_p2_subscription_usage.sql` (~8.7 KB)
- `supabase/migrations/20250706000002_phase_p3_member_management.sql` (~1.6 KB)
- `supabase/migrations/20250706000004_phase_p5_audit_security.sql` (~5.3 KB)
- `supabase/migrations/20250706000006_phase_p7_0_read_only_tenant_infra.sql` (~35.4 KB)
- `supabase/migrations/20260708000000_phase_p18_1_tenant_isolation.sql` (~5.9 KB)
- `supabase/migrations/20260708000004_fix_system_admin_rls.sql` (~1.6 KB)

Công việc:
1. Thêm `SET search_path = public` vào mọi function `SECURITY DEFINER` trong các migration core/security.
2. Kiểm tra các function dùng `auth.users`; đảm bảo không bị search_path injection.

Acceptance:
- Không còn function `SECURITY DEFINER` thiếu `search_path` trong các file trên.
- `npm run lint` + `npm run build` pass.

Rollback: Backup các migration; revert nếu lỗi.

---

## Verification tổng hợp (F16..F17)

- `npm run lint`: PASS
- `npm run build`: PASS
- `updated_by` được set bằng trigger, không thể giả mạo từ client.
- Các function `SECURITY DEFINER` trong core/security đều có `SET search_path = public`.

---

## Context assessment

- F16 đơn lẻ chỉ ~21.5 KB — dưới ngưỡng 200K.
- F17 đơn lẻ ~66.7 KB; gộp F16+F17 = **~88.2 KB**, vẫn an toàn trong 1 task chat.
- F18 (~123.9 KB) nếu gộp thêm sẽ vượt ~200K, nên để riêng cho chat sau.
- Handoff sang: **F18 — P5.1d: search_path audit (billing/ops/2FA/webhook/notification)**.
