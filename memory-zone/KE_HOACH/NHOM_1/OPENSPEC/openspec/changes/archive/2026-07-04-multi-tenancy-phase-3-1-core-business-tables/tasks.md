## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_3_1_20260704_175953`
- [x] 0.2 Confirm `npm run lint` passes
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 3.1: Core business tables

- [x] 1.1 Run SQL migration to add `tenant_id` column, FK, and index for tables: `products`, `customers`, `orders`, `order_items`, `suppliers`, `promotions`
- [x] 1.2 Thêm `tenant_id` vào interface của 6 bảng trong `types.ts`.

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] Các bảng trên đã có cột `tenant_id` và FK.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_3_1_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.