## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_10_1_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 10.1: DB policies theo role

- [ ] 1.1 Run SQL migration block(s) for this sub-phase

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] Cashier tạo đơn thành công; cashier sửa/xóa đơn bị từ chối.
- [ ] Accountant tạo/sửa đơn bị từ chối; accountant xem báo cáo thành công.
- [ ] Inventory_manager tạo nhập hàng thành công; inventory_manager sửa/xóa đơn nhập bị từ chối; inventory_manager tạo đơn bị từ chối.
- [ ] Admin thực hiện tất cả thao tác.
- [ ] Chỉ admin được sửa/xóa products/orders/import_receipts.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_10_1_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.