## Context for Next Session

**Bug:** Sau khi deploy P8.1, `create_invoice` và `create_renewal_invoices` trên remote bị lỗi `function public.generate_invoice_number does not exist`.

**Root cause:** Migration `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql` (P8.1) ghi đè lại 2 hàm này nhưng dùng `public.generate_invoice_number(v_today)` — hàm không tồn tại. Hàm đúng do P7.1 tạo là `public.get_next_invoice_number(p_year INT)`.

**Scope:** Hotfix chỉ sửa 2 dòng trong migration P8.1, deploy lại, và kiểm thử trên remote.

## OpenSpec Change

- Change name: `admin-dashboard-p8-1-invoice-number-hotfix`
- Store: `admin-dashboard`
- Path: `memory-zone/KE_HOACH/Admin_dashboard/OPENSPEC/openspec/changes/admin-dashboard-p8-1-invoice-number-hotfix`
- Artifacts: `proposal.md`, `design.md`, `tasks.md`, `review.md`, `rollback.md`, `specs/p8-1-invoice-number-hotfix/spec.md`, `handoff.md`

## What Was Done in This Session

- [x] Investigated root cause: P8.1 uses non-existent `generate_invoice_number` instead of `get_next_invoice_number`.
- [x] Created OpenSpec change `admin-dashboard-p8-1-invoice-number-hotfix` with full planning artifacts.
- [x] Confirmed P7.2, P9.2, P10.2 are not the source of the bug.

## What Was Done in Next Session

- [x] Created project backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_20260707_invoice_hotfix`
- [x] Edited `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql`
  - Line ~735 inside `create_invoice`: changed `public.generate_invoice_number(v_today)` → `public.get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT)`.
  - Line ~807 inside `create_renewal_invoices`: changed `public.generate_invoice_number(v_today)` → `public.get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT)`.
- [x] Discovered and fixed secondary bug: `invoices.balance` is a generated column (`total - amount_paid`), so both `INSERT` statements in P8.1 were trying to write a non-DEFAULT value. Removed `balance` from the column/value lists in both `create_invoice` and `create_renewal_invoices`.
- [x] Verified `public.generate_invoice_number` no longer appears in the project code (only in this OpenSpec documentation).
- [x] Local verification: `npm run lint` PASS, `npm run build` PASS, `npx vitest run` PASS (103 tests).
- [x] Deployed corrected migration to Supabase project `rsialbfjswnrkzcxarnj` (QLBH) via `supabase db query --linked --file supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql`.
- [x] Verified remote:
  - `public.create_invoice('670f61e2-42d2-40bc-ab84-f96fa73a2945'::UUID, 'monthly', 1)` as system admin returned invoice `INV-2026-0013` with `status='pending'`, `total=69000.00`, `balance=69000.00` (transaction rolled back).
  - `public.create_renewal_invoices(7)` as system admin returned `0` without error when no subscription expires soon; returned `1` after temporarily setting a subscription to expire in 3 days (transaction rolled back).
- [x] Updated `tasks.md` and this handoff with verification results.
- [x] Archived OpenSpec change.

## Important Notes

- Do NOT create a new `generate_invoice_number` function; use the existing `get_next_invoice_number`.
- Do NOT change invoice number format; keep `INV-YYYY-####`.
- Do NOT touch pricing/plan logic in P8.1.
- If project policy requires a delta migration instead of editing the original P8.1 file, create a new migration `supabase/migrations/20250707000005_phase_p8_1_invoice_number_hotfix.sql` that `DROP FUNCTION IF EXISTS` then `CREATE OR REPLACE` the two functions with the corrected code. Update `design.md` and `tasks.md` accordingly.

## References

- `get_next_invoice_number` definition: <ref_snippet file="c:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/migrations/20250706000007_phase_p7_1_billing_schema_bank_config.sql" lines="183-198" />
- P8.1 `create_invoice` bug location: <ref_snippet file="c:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql" lines="735-735" />
- P8.1 `create_renewal_invoices` bug location: <ref_snippet file="c:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql" lines="807-807" />
