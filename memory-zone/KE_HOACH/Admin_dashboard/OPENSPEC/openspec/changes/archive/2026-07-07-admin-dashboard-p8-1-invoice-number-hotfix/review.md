## Plan Coverage

- [x] Root cause identified: P8.1 used non-existent `generate_invoice_number` instead of `get_next_invoice_number`.
- [x] Fix scoped to only 2 lines in `20250706000011_phase_p8_1_plan_builder_schema.sql` (plus 2 additional lines to remove `balance` from generated-column inserts).
- [x] Verification covers both local build and remote RPC calls.

## File List

- [x] File to modify: `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql`.
- [x] No other files should be modified.

## Guardrails

- [x] Only change function name for invoice numbering; do not touch pricing/plan logic.
- [x] No secrets committed.
- [x] No new dependencies.

## Acceptance Criteria

- [x] `generate_invoice_number` no longer appears in the codebase.
- [x] `create_invoice` and `create_renewal_invoices` use `get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT)`.
- [x] `npm run lint` pass.
- [x] `npm run build` pass.
- [x] `create_invoice` works on remote.
- [x] `create_renewal_invoices` works on remote.

## Verification Steps

- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Run `npx vitest run`.
- [x] Deploy migration to remote.
- [x] Call `create_invoice` and `create_renewal_invoices` on remote to confirm.
