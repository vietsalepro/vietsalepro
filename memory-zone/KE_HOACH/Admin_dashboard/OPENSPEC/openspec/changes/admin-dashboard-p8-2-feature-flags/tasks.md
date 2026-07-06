## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p8-2-feature-flags_20260707_064800`
- [x] 0.2 Confirm `npm run lint` passes (baseline)
- [x] 0.3 Read the sub-phase section in `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`

## 1. P8 2 Feature Flags

- [x] 1.1 Implement backend changes (RPC/migration) for P8 2 Feature Flags
- [x] 1.2 Implement frontend changes for P8 2 Feature Flags
- [x] 1.3 Wire up service layer and types

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build`
- [x] 2.3 Manual test the acceptance criteria (bật/tắt feature flag trên DB thật)
- [x] 2.4 Deploy and test migration on Supabase

## Acceptance Criteria

- [x] P8.2 — Feature flags via tenants.settings JSONB + toggle UI (YAGNI).
- [x] `npm run lint` pass
- [x] `npm run build` pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p8-2-feature-flags_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
