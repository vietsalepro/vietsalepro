## What Was Done

- Created `supabase/migrations/20250706000007_phase_p7_1_billing_schema_bank_config.sql` with tables `invoices`, `invoice_items`, `payments`, `bank_accounts`, RLS policies, and `get_next_invoice_number()` counter for `INV-YYYY-####`.
- Added `services/bankAccountService.ts` for CRUD `bank_accounts` and get/set `company_info` via `system_settings`.
- Added `components/BillingConfig.tsx` with company/brand/tax info and bank account CRUD UI.
- Wired new `billing` tab into `pages/SystemAdminDashboard.tsx`.
- Added `types/billing.ts` and updated the in-memory Supabase mock for tests.
- Added smoke test `tests/smoke/admin-dashboard-p7-1-billing-schema-bank-config.test.ts`.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Manual acceptance criteria tested (CRUD bank account + company info via smoke tests; 60/60 tests pass)

## Next Phase

- Next sub-phase in KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md (P7.2 — RPC tạo hóa đơn + đánh số + tính giá).

## Blockers / Decisions

- None.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p7-1-billing-schema-bank-config_20260706_125859`
