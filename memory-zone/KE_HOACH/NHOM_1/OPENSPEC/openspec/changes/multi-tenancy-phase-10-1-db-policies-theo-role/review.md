## Plan Coverage

- [ ] Sub-phase 10.1: DB policies theo role is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] Cashier tạo đơn thành công; cashier sửa/xóa đơn bị từ chối.
- [ ] Accountant tạo/sửa đơn bị từ chối; accountant xem báo cáo thành công.
- [ ] Inventory_manager tạo nhập hàng thành công; inventory_manager sửa/xóa đơn nhập bị từ chối; inventory_manager tạo đơn bị từ chối.
- [ ] Admin thực hiện tất cả thao tác.
- [ ] Chỉ admin được sửa/xóa products/orders/import_receipts.

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria