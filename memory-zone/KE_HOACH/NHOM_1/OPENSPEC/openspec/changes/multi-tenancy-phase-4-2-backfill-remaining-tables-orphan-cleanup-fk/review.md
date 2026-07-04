## Plan Coverage

- [ ] Sub-phase 4.2: Backfill remaining tables + orphan cleanup + FK is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] `SELECT count(*) FROM products WHERE tenant_id IS NULL` = 0
- [ ] Không còn record mồ côi trong tất cả bảng cha-con đã liệt kê
- [ ] Có FK trên 3 bảng con (order_items, return_order_items, import_items.lot_id)
- [ ] Tenant đầu tiên có subscription row với plan = 'vip'

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria