## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p7-4-invoice-ui-pdf_20260706_134652`
- [x] 0.2 Confirm `npm run lint` passes (baseline)
- [x] 0.3 Read the sub-phase section in `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`

## 1. P7 4 Invoice Ui Pdf

- [x] 1.1 Implement backend changes (RPC/migration/Edge Function) for P7 4 Invoice Ui Pdf
- [x] 1.2 Implement frontend changes for P7 4 Invoice Ui Pdf
- [x] 1.3 Wire up service layer and types if needed

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria (smoke test P7.4 + UI render via component; PDF export function verified)
- [x] 2.4 Deploy and test migration on Supabase if applicable — không có migration mới cho P7.4, backend dùng lại P7.1–P7.3

## Acceptance Criteria

- [x] P7.4 — Invoice management UI + client-side PDF export with bank/company info.
- [x] `npm run lint` pass
- [x] `npm run build` pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p7-4-invoice-ui-pdf_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
