## What Was Done

- Backend: migration thêm `archived` (+ `archived_at`) vào CHECK `tenants.status`, RPC `search_tenants`, `update_tenant`, `delete_tenant_safe`, cron purge archived > 30 ngày.
- Types: `TenantStatus` bao gồm `archived`, `Tenant` có `archivedAt`.
- Service layer: `searchTenants`, `updateTenant`, `softDeleteTenant`, `restoreTenant` trong `services/tenantService.ts`.
- Frontend: KPI cards, tìm kiếm/lọc status/plan, bảng phân trang, modal sửa, nút lưu trữ/khôi phục trong `pages/SystemAdminDashboard.tsx`.
- Unit tests: mở rộng `tests/tenant.test.ts` + `tests/mocks/supabase.ts` cho tìm kiếm, cập nhật, lưu trữ, khôi phục.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Unit tests `npx vitest run tests/tenant.test.ts` pass (7/7)
- [ ] Deployment & migration smoke test trên Supabase (chưa chạy — cần CLI/credentials)

## Next Phase

- P2 — Subscription & usage trong `KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`.

## Blockers / Decisions

- Triển khai migration SQL lên Supabase cần thực hiện riêng khi có CLI/credentials.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p1-tenant-list-core-management_20260706_110118`
