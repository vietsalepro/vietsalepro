## What Was Done

- Migration `supabase/migrations/20250708000005_phase_p14_2_restore_archive.sql`:
  - Added `public.get_tenant_restore_table_order()` helper to list tenant-scoped tables in FK dependency order (parents before children).
  - Added `public.restore_tenant_tables(p_tenant_id UUID, p_tables JSONB)` RPC: validates system admin + target tenant, deletes existing tenant data in reverse dependency order, inserts backup rows with tenant_id overridden, returns per-table row counts.
- Edge Function `supabase/functions/tenant-restore/index.ts`: authenticates system admin, validates backup payload, calls `restore_tenant_tables` via service role.
- Service `services/tenantRestoreService.ts`: `restoreTenantBackup(tenantId, file)` and `previewBackupTables(backup)` helpers.
- Frontend `pages/SystemAdminDashboard.tsx`: added `Restore` button per tenant row and a file-upload modal with table/row preview; archive/unarchive reuses existing P1 `archived` status flow.
- Tests: `tests/tenant.test.ts` extended with restore service tests; `tests/mocks/supabase.ts` mocked `tenant-backup` and `tenant-restore` Edge Functions.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] `npx vitest run` 148/148 PASS
- [x] Manual acceptance criteria tested (archive/unarchive already covered by P1 tests; restore service tested via mock)

## Next Phase

- P14.3 — Data migration giữa môi trường + reset demo data (per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md).

## Production Deployment

- Migration `phase_p14_2_restore_archive` applied to production project `rsialbfjswnrkzcxarnj` (QLBH) via Supabase MCP.
- Verified `public.get_tenant_restore_table_order()` and `public.restore_tenant_tables(UUID, JSONB)` exist in `pg_proc` with `SECURITY DEFINER`.
- Edge Function `tenant-restore` deployed to production and status `ACTIVE` (verify_jwt enabled).
- Edge Function `tenant-restore` returns `401 Missing Authorization header` when called unauthenticated (verified by `list_edge_functions` status ACTIVE).

## Blockers / Decisions

- None.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p14-2-restore-archive_20260708_094719`
