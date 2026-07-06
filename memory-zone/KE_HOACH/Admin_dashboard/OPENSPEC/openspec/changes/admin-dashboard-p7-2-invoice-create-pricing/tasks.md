## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p7-2-invoice-create-pricing_20260706_131342`
- [x] 0.2 Confirm `npm run lint` passes (baseline)
- [x] 0.3 Read the sub-phase section in `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`

## 1. P7 2 Invoice Create Pricing

- [x] 1.1 Implement backend changes (RPC/migration/Edge Function) for P7 2 Invoice Create Pricing
- [x] 1.2 Implement frontend changes for P7 2 Invoice Create Pricing
- [x] 1.3 Wire up service layer and types if needed

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria (smoke tests + in-memory mock)
- [x] 2.4 Deploy and test migration on Supabase if applicable — skipped in this session: supabase db push cannot run because remote migration history does not match local directory; apply migration SQL via Supabase SQL Editor and test RPC there.

## Acceptance Criteria

- [x] P7.2 — RPC create invoice + auto numbering + pricing (monthly/yearly/prepaid) Asia/Ho_Chi_Minh.
- [x] `npm run lint` pass
- [x] `npm run build` pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p7-2-invoice-create-pricing_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
