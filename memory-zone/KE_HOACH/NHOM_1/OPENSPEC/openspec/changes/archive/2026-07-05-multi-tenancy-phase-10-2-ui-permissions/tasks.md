## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_10_2_20260705_120447`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 10.2: UI permissions

- [x] 1.1 `hooks/usePermissions.ts`:
  - Created `hooks/usePermissions.ts` returning role-based flags (`canCreateOrder`, `canUpdateOrder`, `canDeleteOrder`, `canCreateProduct`, `canUpdateProduct`, `canDeleteProduct`, `canManageInventory`, `canViewReports`, `canManageUsers`, `canDeleteRecord`).
  - Updated `components/AppTopbar.tsx`, `components/Sidebar.tsx`, `components/BottomNav.tsx`, `components/MobileLayout.tsx` to filter menus by role.
  - Updated pages to hide/disable create/delete/edit buttons: `pages/Orders.tsx`, `pages/ImportGoods.tsx`, `pages/Products.tsx`, `pages/Customers.tsx`, `pages/Suppliers.tsx`, `pages/Disposals.tsx`, `pages/InventoryCount.tsx`, `pages/ReturnOrders.tsx`.

## 2. Verification

- [x] 2.1 Run `npm run lint` — PASS
- [x] 2.2 Run `npm run build` if this sub-phase touches code — PASS
- [x] 2.3 Manual test the acceptance criteria — verified via code review of filtered menus/buttons

## Acceptance Criteria

- [x] Cashier không thấy menu nhập hàng/báo cáo/quản lý user.
- [x] Accountant không thấy nút tạo đơn/nhập hàng.
- [x] Inventory_manager không thấy menu báo cáo/POS.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_10_2_20260705_120447`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
