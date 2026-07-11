## Plan Coverage

- [ ] Sub-phase 5.3: RLS policies — remaining tables + unique indexes is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] Tất cả bảng kinh doanh có RLS policies.
- [ ] SKU/barcode/order_code/invoice_number unique theo tenant.

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria