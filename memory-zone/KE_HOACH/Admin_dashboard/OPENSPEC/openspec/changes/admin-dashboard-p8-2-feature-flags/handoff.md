## What Was Done

- Added migration `20250706000012_phase_p8_2_feature_flags.sql` with RPC `get_tenant_feature_flags` and `update_tenant_feature_flags` (system admin only, stored in `tenants.settings->features`, no new table).
- Added `TenantFeatureFlags` type + `DEFAULT_TENANT_FEATURE_FLAGS` in `types/tenant.ts`.
- Added `getTenantFeatureFlags` / `updateTenantFeatureFlags` in `services/tenantService.ts`.
- Added per-tenant feature flags toggle UI (modal) in `pages/SystemAdminDashboard.tsx`.
- Updated mock Supabase and added smoke test `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts`.
- Deployed migration to Supabase project `rsialbfjswnrkzcxarnj` and toggled feature flags on a real tenant.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] `npx vitest run` pass (90 tests)
- [x] Manual acceptance criteria tested (bật/tắt `pos`/`inventory` flags trên DB thật)

## Next Phase

- Next sub-phase in KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.

## Blockers / Decisions

- None.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p8-2-feature-flags_20260707_064800`
