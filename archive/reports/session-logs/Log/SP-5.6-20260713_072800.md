# SP-5.6: Database Maintenance Panel

**Status:** Completed (not pushed)
**Branch:** `feat/SP-5.6-db-maintenance`
**Timestamp:** 2026-07-13 07:28:00

## Summary

Triển khai panel bảo trì cơ sở dữ liệu trong admin dashboard: chạy `VACUUM ANALYZE`/`REINDEX` thủ công qua Edge Function, theo dõi job log trong `db_maintenance_jobs`, hiển thị bloat stats từ `pg_stat_user_tables` và index stats từ `pg_stat_user_indexes`.

## Changes

- `types/tenant.ts` — thêm `DbMaintenanceOperation`, `DbMaintenanceJob`, `DbBloatStat`, `DbIndexStat`.
- `services/dbMaintenanceService.ts` — thêm `runDbMaintenance()`, `listDbMaintenanceJobs()`, `getDbBloatStats()`, `getDbIndexStats()`.
- `components/BulkMaintenancePanel.tsx` — thêm section "Bảo trì cơ sở dữ liệu" với nút VACUUM ANALYZE, REINDEX, bảng bloat/index stats và lịch sử job.
- `supabase/functions/db-maintenance/index.ts` — Edge Function xác thực system admin, dispatch operation đến các RPC tương ứng.
- `supabase/migrations/20260728000000_sp5_6_db_maintenance.sql` — tạo bảng `db_maintenance_jobs`, RPC `run_db_maintenance_job`, `list_db_maintenance_jobs`, `get_db_table_stats`, `get_db_index_stats`.
- `tests/mocks/supabase.ts` — thêm store `db_maintenance_jobs`, mock RPC và mock Edge Function `db-maintenance`.
- `tests/admin-dashboard/dbMaintenanceService.test.ts` — 6 tests cho service.
- `tests/smoke/admin-dashboard-p13-4-bulk-maintenance.test.tsx` — 2 tests bổ sung cho UI và job log.

## Verification

1. Backup project to `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-5.6-20260713_072324`.
2. `npm run lint` passes (`tsc --noEmit`).
3. `npx vitest run` passes toàn bộ suite.
4. `npm run audit:rpc` reports 4 pre-existing RPC contract mismatches (`cancel_subscription`, `create_subscription`, `downgrade_subscription`, `upgrade_subscription` in `services/admin/billingAdminService.ts`) unrelated to this change.
5. Independent code review passed with `[verified]` prefix.

## Artifacts

### Code
- `types/tenant.ts`
- `services/dbMaintenanceService.ts`
- `components/BulkMaintenancePanel.tsx`
- `tests/mocks/supabase.ts`
- `tests/admin-dashboard/dbMaintenanceService.test.ts`
- `tests/smoke/admin-dashboard-p13-4-bulk-maintenance.test.tsx`

### Edge Functions
- `supabase/functions/db-maintenance/index.ts`
- `Plan/EdgeFunction/db-maintenance.ts`

### Migrations
- `supabase/migrations/20260728000000_sp5_6_db_maintenance.sql`
- `Plan/Migration/20260728000000_sp5_6_db_maintenance.sql`

## Deployment checklist (not executed)

- [ ] Push branch `feat/SP-5.6-db-maintenance` to remote.
- [ ] Apply migration `20260728000000_sp5_6_db_maintenance.sql` to staging.
- [ ] Deploy `db-maintenance` Edge Function to staging.
- [ ] Run Vercel preview smoke test cho route chứa `BulkMaintenancePanel`.
- [ ] Apply migration + Edge Function to production.
- [ ] Run production smoke test.

## Unpushed work

This phase is **not pushed** yet. Commit `e863b04e` is pending in `feat/SP-5.6-db-maintenance`.

## Uncommitted migrations / edge functions from other phases still in working tree

The working tree still contains uncommitted changes from previous phases (e.g., SP-4.4 webhook delivery hardening in `supabase/migrations/20260724000000_sp4_4_webhook_delivery_hardening.sql` and related files). Those are not part of this SP-5.6 commit.

## Notes

- `VACUUM` không thể chạy bên trong PostgreSQL function/transaction; RPC `run_db_maintenance_job` chạy `ANALYZE` và ghi chú rằng `VACUUM` cần autovacuum/Supabase CLI/Coolify runner.
- `REINDEX` cũng không chạy trực tiếp trong RPC; nếu cấu hình `db_maintenance.runner_url`, RPC sẽ gọi runner URL qua `net.http_post`. Mặc định chỉ ghi job log và yêu cầu admin chạy thủ công qua CLI.
- Tất cả operation chỉ cho phép system admin (kiểm tra `system_admins` trong Edge Function + `is_system_admin()` trong RPC).
