## Plan Coverage

- [ ] Sub-phase 10.2: UI permissions is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] Cashier không thấy menu nhập hàng/báo cáo/quản lý user.
- [ ] Accountant không thấy nút tạo đơn/nhập hàng.
- [ ] Inventory_manager không thấy menu báo cáo/POS.

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria