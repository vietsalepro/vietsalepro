## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p16-2-churn-cohort_20250708_000000`
- [x] 0.2 Confirm `npm run lint` passes (baseline)
- [x] 0.3 Read the sub-phase section in `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`

## 1. P16 2 Churn Cohort

- [x] 1.1 Implement backend changes (RPC/migration/Edge Function) for P16 2 Churn Cohort
- [x] 1.2 Implement frontend changes for P16 2 Churn Cohort
- [x] 1.3 Wire up service layer and types if needed

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria
- [x] 2.4 Deploy and test migration on Supabase if applicable

## Acceptance Criteria

- [x] P16.2 — Churn + cohort + tenant LTV + sales funnel + charts (YAGNI).
- [x] `npm run lint` pass
- [x] `npm run build` pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p16-2-churn-cohort_20250708_000000`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
