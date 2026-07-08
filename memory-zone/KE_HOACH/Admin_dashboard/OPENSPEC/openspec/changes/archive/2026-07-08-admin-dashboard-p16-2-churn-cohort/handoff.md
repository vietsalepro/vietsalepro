## What Was Done

- Added backend RPC `get_churn_cohort_metrics` in `supabase/migrations/20250708000011_phase_p16_2_churn_cohort.sql`:
  - Churn snapshot metric for a configurable period.
  - Conversion-to-paid cohort matrix (12 months by default).
  - Tenant lifetime value (LTV) overall and by plan.
  - Sales funnel snapshot (trial / active free / paying / churned).
- Added frontend types in `types/billing.ts` for churn/cohort/LTV/funnel.
- Added `getChurnCohortMetrics` mapper/service in `services/billingAutomationService.ts`.
- Added `components/ChurnCohortMetrics.tsx` with KPI cards, sales funnel bar chart, and cohort conversion line chart; wired into `components/BillingConfig.tsx`.
- Added smoke test `tests/smoke/admin-dashboard-p16-2-churn-cohort.test.ts`.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Smoke test `npx vitest run tests/smoke/admin-dashboard-p16-2-churn-cohort.test.ts` pass
- [x] Migration deployed to Supabase production project `rsialbfjswnrkzcxarnj` via `npx supabase db push --include-all`
- [x] RPC existence/protection verified: anon caller receives `insufficient_privilege` as expected.

## Next Phase

- Next sub-phase in `KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md` (P17.1 or whichever the milestone calls for).

## Blockers / Decisions

- Migration history cleanup: production had duplicate remote versions (`20260708...`) for the same admin-dashboard migrations; they were repaired to `reverted` and the local `20250708...` versions were re-applied idempotently. The project is now back to the `20250708...` naming convention.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p16-2-churn-cohort_20250708_000000`
