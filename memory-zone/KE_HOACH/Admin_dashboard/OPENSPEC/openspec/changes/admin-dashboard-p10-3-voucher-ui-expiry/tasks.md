## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p10-3-voucher-ui-expiry_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (baseline)
- [ ] 0.3 Read the sub-phase section in `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`

## 1. P10 3 Voucher Ui Expiry

- [ ] 1.1 Implement backend changes (RPC/migration/Edge Function) for P10 3 Voucher Ui Expiry
- [ ] 1.2 Implement frontend changes for P10 3 Voucher Ui Expiry
- [ ] 1.3 Wire up service layer and types if needed

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria
- [ ] 2.4 Deploy and test migration on Supabase if applicable

## Acceptance Criteria

- [ ] P10.3 — Voucher management UI + expiry warnings + tenant voucher input.
- [ ] `npm run lint` pass
- [ ] `npm run build` pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p10-3-voucher-ui-expiry_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
