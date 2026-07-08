## What Was Done

- Migration `supabase/migrations/20250708000006_phase_p14_3_migration_reset.sql`:
  - Added `public.migrate_tenant_data(p_source_tenant_id UUID, p_target_tenant_id UUID)` RPC: copies all tenant-scoped rows from source tenant to target tenant within the same database using the existing dependency-order helpers.
  - Added `public.reset_demo_data(p_tenant_id UUID)` RPC: clears business data of a tenant while preserving tenant account, memberships, subscriptions and settings; resets the monthly order counter.
- Service `services/tenantMigrationService.ts`: `resetDemoData(tenantId)` and `migrateTenantData(source, target)` wrappers.
- Frontend `pages/SystemAdminDashboard.tsx`: added per-tenant "Reset demo" button with confirmation.
- Tests: extended `tests/tenant.test.ts` and `tests/mocks/supabase.ts` with reset-demo and tenant-migration coverage.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] `npx vitest run` 150/150 PASS
- [x] Migration applied to production project `rsialbfjswnrkzcxarnj` via Supabase MCP
- [x] Verified `public.reset_demo_data` and `public.migrate_tenant_data` exist in `pg_proc` on production
- [x] Verified production security check: unauthenticated call returns `42501` privilege error

## Next Phase

- Next sub-phase in KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.

## Blockers / Decisions

- None.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p14-3-migration-reset_20260708`
