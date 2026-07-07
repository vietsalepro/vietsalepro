## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_20260707_invoice_hotfix`
- [x] 0.2 Confirm `npm run lint` passes (baseline)
- [x] 0.3 Read `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql` lines 660–831
- [x] 0.4 Confirm `public.get_next_invoice_number(p_year INT)` exists in `supabase/migrations/20250706000007_phase_p7_1_billing_schema_bank_config.sql`

## 1. Fix Migration P8.1

- [x] 1.1 In `create_invoice` (line ~735): replace `public.generate_invoice_number(v_today)` with `public.get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT)`
- [x] 1.2 In `create_renewal_invoices` (line ~807): replace `public.generate_invoice_number(v_today)` with `public.get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT)`
- [x] 1.3 Verify no other occurrences of `generate_invoice_number` remain in the codebase
- [x] 1.4 Additional fix: remove `balance` from `INSERT` lists in both functions because `invoices.balance` is a generated column (`total - amount_paid`)

## 2. Verification (Local)

- [x] 2.1 Run `npm run lint` — PASS
- [x] 2.2 Run `npm run build` — PASS
- [x] 2.3 Run `npx vitest run` — PASS (103 tests)

## 3. Deploy & Verify (Remote)

- [x] 3.1 Deploy corrected migration to Supabase project `rsialbfjswnrkzcxarnj` (QLBH) via `supabase db query --linked --file supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql`
- [x] 3.2 On remote, call `public.create_invoice('670f61e2-42d2-40bc-ab84-f96fa73a2945'::UUID, 'monthly', 1)` as system admin and confirm it returns an invoice row (`INV-2026-0013`, `pending`, `69000.00`, `balance=69000.00`)
- [x] 3.3 On remote, call `public.create_renewal_invoices(7)` as system admin and confirm it returns without error (`0` with no expiring subscriptions; `1` after temporarily setting a subscription to expire in 3 days)
- [x] 3.4 Confirm generated invoice numbers still follow `INV-YYYY-####` format

## Acceptance Criteria

- [x] `public.generate_invoice_number` no longer appears anywhere in the project code
- [x] `create_invoice` and `create_renewal_invoices` use `public.get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT)`
- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] `create_invoice` works on remote
- [x] `create_renewal_invoices` works on remote

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_p8_1_invoice_number_hotfix_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, remote deploy fails, or `create_invoice`/`create_renewal_invoices` still fail after fix.
