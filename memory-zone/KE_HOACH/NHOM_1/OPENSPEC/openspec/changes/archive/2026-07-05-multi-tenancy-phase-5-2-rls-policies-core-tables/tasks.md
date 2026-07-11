## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_5_2_20260705_071959`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 5.2: RLS policies — core tables

- [x] 1.1 Run SQL migration to add `tenant_id` column, FK, and index for tables: `products`, `customers`, `orders`, `order_items`, `suppliers`

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] User ở tenant A chỉ thấy dữ liệu tenant A
- [x] Truy vấn tenant B trả về 0 row
- [x] Insert với tenant_id khác bị từ chối

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_5_2_20260705_071959`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.