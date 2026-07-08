## What Was Done

- Created `supabase/migrations/20250708000001_phase_p13_2_error_performance.sql`:
  - `error_logs` table + RLS (system-admin only).
  - `get_error_log_summary(p_hours, p_limit)` RPC for error aggregation.
  - `get_query_performance_metrics()` RPC reading `extensions.pg_stat_statements`, returning P95/P99 approximations, RPS, and top queries.
- Created `supabase/functions/error-performance/index.ts` Edge Function (system-admin auth + service-role RPC calls).
- Added `services/errorPerformanceService.ts` and `components/ErrorPerformancePanel.tsx` with KPI cards, error-by-source bar chart, and top-query table.
- Wired a new "Lỗi & Hiệu năng" tab into `pages/SystemAdminDashboard.tsx`.
- Added types in `types/tenant.ts`.
- Added smoke test `tests/smoke/admin-dashboard-p13-2-error-performance.test.ts` and updated `tests/mocks/supabase.ts`.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] `npx vitest run` — 137 tests passed
- [x] Migration pushed to linked Supabase staging project (`shbmzvfcenbybvyzclem`).
- [x] Edge Function `error-performance` deployed; unauthenticated request returns 401 as expected.

## Next Phase

- P13.3 — Storage usage per tenant + backup status card.

## Blockers / Decisions

- None.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p13-2-error-performance_20260708_075919`
