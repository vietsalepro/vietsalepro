## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_p9-1-2-billing-reminders-fix_<YYYYMMDD_HHMMSS>`
- [x] 0.2 Confirm `npm run lint` passes (baseline)
- [x] 0.3 Read `memory-zone/HANDOFF_P9_1_2.md`

## 1. P9.1.2 Billing Reminders Fix

- [x] 1.1 Add `GRANT EXECUTE` for `set_billing_reminder_config` and `get_pending_billing_reminders` to `authenticated` and `service_role`
- [x] 1.2 Reject empty milestones array `[]` in `set_billing_reminder_config` SQL
- [x] 1.3 Update mock `set_billing_reminder_config` error message to match SQL

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build`
- [x] 2.3 Run `npx vitest run tests/smoke/admin-dashboard-p9-1-billing-reminders.test.ts`
- [x] 2.4 Run `openspec validate --changes --store admin-dashboard`
- [x] 2.5 Apply delta SQL to Supabase project and test authenticated RPC calls

## Acceptance Criteria

- [x] Authenticated frontend can call `set_billing_reminder_config` and `get_pending_billing_reminders`
- [x] Empty milestones array is rejected
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] All smoke tests pass
- [x] OpenSpec validation passes

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_p9-1-2-billing-reminders-fix_<YYYYMMDD_HHMMSS>`
- Restore migration from backup if SQL deployment fails.
