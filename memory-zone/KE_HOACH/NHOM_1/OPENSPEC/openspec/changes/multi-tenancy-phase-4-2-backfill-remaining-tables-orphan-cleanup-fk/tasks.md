## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_4_2_20260704_185228`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 4.2: Backfill remaining tables + orphan cleanup + FK

- [x] 1.1 Run SQL migration block(s) for this sub-phase

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code (skipped: no code changes)
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] `SELECT count(*) FROM products WHERE tenant_id IS NULL` = 0
- [x] Không còn record mồ côi trong tất cả bảng cha-con đã liệt kê
- [x] Có FK trên 3 bảng con (order_items, return_order_items, import_items.lot_id)
- [x] Tenant đầu tiên có subscription row với plan = 'vip'

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_4_2_20260704_185228`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
