## What Was Done

- Migration `20250707000006_phase_p11_3_impersonation.sql`: thêm cột `impersonated_by`, `impersonated_at`, `impersonated_expires_at` vào `tenant_memberships`; cập nhật `check_tenant_limits` để impersonation không tính vào giới hạn user; mở rộng `CHECK` action của `app_audit_log` và `app_audit_log_partitioned` thêm `IMPERSONATE`, `IMPERSONATE_END`.
- Edge Functions mới: `impersonate-tenant` (service-role tạo phiên impersonate, ghi audit) và `end-impersonation` (xóa phiên, ghi audit kèm duration).
- Cập nhật Edge Function `audit-log` chấp nhận action `IMPERSONATE` / `IMPERSONATE_END`.
- Frontend: nút "Login as" trong `SystemAdminDashboard`, banner `ImpersonationBanner` trên `AppShell`, helper `getTenantUrl`/`getAdminUrl` trong `lib/tenant.ts`.
- Service layer: `startImpersonation` / `endImpersonation` trong `services/tenantService.ts`; `TenantContext` nhận diện trạng thái impersonate; types cập nhật.
- Mock Supabase và smoke test `tests/smoke/admin-dashboard-p11-3-impersonation.test.ts`.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] `npx vitest run` 125 tests pass (24 files)
- [x] Smoke test P11.3: impersonate tạo membership + ghi audit `IMPERSONATE`; end-impersonation xóa membership + ghi audit `IMPERSONATE_END`; non-system admin bị từ chối; impersonate không tính vào giới hạn user.
- [x] Migration đã deploy lên Supabase project `rsialbfjswnrkzcxarnj` (`supabase migration list` khớp local/remote).
- [x] Edge Functions `impersonate-tenant`, `end-impersonation`, `audit-log` đã deploy lên Supabase project `rsialbfjswnrkzcxarnj`.

## Next Phase

- Theo `KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`, tiếp tục P12.1 — Announcements.

## Blockers / Decisions

- None.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p11-3-impersonation_20260707_140918`
