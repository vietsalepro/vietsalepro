## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_10_1_20260705_114441`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 10.1: DB policies theo role

- [x] 1.1 Run SQL migration block(s) for this sub-phase

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria (via `supabase/test_phase10_1_db_policies_theo_role.sql`)

## Acceptance Criteria

- [x] Cashier tạo đơn thành công; cashier sửa/xóa đơn bị từ chối.
- [~] Accountant tạo/sửa đơn bị từ chối; accountant xem báo cáo thành công. (RLS policies verified; báo-cáo RPC role guard remains for sub-phase 10.2 / reporting layer)
- [x] Inventory_manager tạo nhập hàng thành công; inventory_manager sửa/xóa đơn nhập bị từ chối; inventory_manager tạo đơn bị từ chối.
- [x] Admin thực hiện tất cả thao tác.
- [x] Chỉ admin được sửa/xóa products/orders/import_receipts.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_10_1_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.