## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p16-2-churn-cohort_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (baseline)
- [ ] 0.3 Read the sub-phase section in `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`

## 1. P16 2 Churn Cohort

- [ ] 1.1 Implement backend changes (RPC/migration/Edge Function) for P16 2 Churn Cohort
- [ ] 1.2 Implement frontend changes for P16 2 Churn Cohort
- [ ] 1.3 Wire up service layer and types if needed

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria
- [ ] 2.4 Deploy and test migration on Supabase if applicable

## Acceptance Criteria

- [ ] P16.2 — Churn + cohort + tenant LTV + sales funnel + charts (YAGNI).
- [ ] `npm run lint` pass
- [ ] `npm run build` pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p16-2-churn-cohort_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
