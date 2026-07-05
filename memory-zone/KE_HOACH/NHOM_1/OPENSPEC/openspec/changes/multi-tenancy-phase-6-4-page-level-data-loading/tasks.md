## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_4_20260705_093754`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 6.4: Page-level data loading

- [x] 1.1 Tạo hook `useTenant()` để lấy `tenant`, `membership`, `role`.
- [x] 1.2 Sửa các page chính: POS, orders, products, customers, reports, inventory.
- [x] 1.3 Ưu tiên sửa các `useEffect` fetch data: thêm `tenantId` vào dependency array.

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] Mỗi page chỉ hiển thị dữ liệu của tenant hiện tại.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_4_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.