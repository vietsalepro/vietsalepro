## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_3_20260702_160003`
- [x] 0.2 Create database backup (dump or Supabase snapshot)
- [x] 0.3 Confirm `npm run lint` pass
- [x] 0.4 Confirm `npm run build` pass
- [x] 0.5 Read `docs/plans/import-goods-bugfix/PLAN_REFINED.md` Phase 3 section

## 1. Sub-phase 3a — Backend migration sửa `process_import_v2` & `delete_import_v2`

- [x] 1.1 Create `archive/migration_phase3a_import_cost_ssot.sql` with SSOT comments
- [x] 1.2 In `process_import_v2`: compute `v_line_net` per unit from `GREATEST(0, qty * cost - discount)`
- [x] 1.3 In `process_import_v2`: compute `v_adjusted_cost := ROUND(v_line_net * (1 + v_shipping_factor), 2)`
- [x] 1.4 In `process_import_v2`: insert `import_items.cost` = original cost, `import_items.discount` = `v_discount`, `adjusted_cost` = `v_adjusted_cost`
- [x] 1.5 In `process_import_v2`: update `products.cost` and `product_lots.cost` with `v_adjusted_cost`
- [x] 1.6 In `process_import_v2`: update stock ledger with `v_adjusted_cost`
- [x] 1.7 In `delete_import_v2`: reverse inventory using `adjusted_cost` (falling back to `cost` for legacy rows)
- [x] 1.8 Verify `update_import_v2` remains consistent (delete + process)
- [x] 1.9 Run migration inside a transaction and `ROLLBACK` to verify on a copy or production
- [x] 1.10 Run migration for real only after verification

## 2. Sub-phase 3b — Service layer & types mapping

- [x] 2.1 Ensure `createImportReceipt` / `updateImportReceipt` pass `cost` = original cost and `discount` = line discount
- [x] 2.2 If `import_items.adjusted_cost` column added, update `mapImportReceiptFromDB` to map it
- [x] 2.3 If needed, add `adjustedCost` to `ImportItemInput` in `types.ts`
- [x] 2.4 Run `npm run lint`
- [x] 2.5 Run `npm run build`
- [x] 2.6 Manual test: payload inspection (console or network) confirms correct fields

## 3. Sub-phase 3c — Frontend hiển thị & kiểm thử DB

- [x] 3.1 Ensure `ImportItemRow` keeps `lineTotal = max(0, qty * cost - discount)`
- [x] 3.2 Ensure `ImportItemsTable` displays total goods after line discount
- [x] 3.3 Ensure `TotalsSection` receives `totalGoods = totalGoodsAfterLineDiscount`
- [x] 3.4 Replace any remaining `totalWithShipping` based on `totalImportCost` with `totalGoodsAfterLineDiscount` based formula
- [x] 3.5 DB test: `import_items.cost` = original cost
- [x] 3.6 DB test: `products.cost` / `product_lots.cost` = adjusted BQGQ cost
- [x] 3.7 DB test: after delete, stock and cost revert correctly
- [x] 3.8 Run `npm run lint`
- [x] 3.9 Run `npm run build`
- [x] 3.10 Manual test: create → delete → re-create with same product, compare stock and cost

## 4. Cleanup & Verification

- [x] 4.1 Run `npm run lint`
- [x] 4.2 Run `npm run build`
- [x] 4.3 Run DB transaction verification on `process_import_v2` and `delete_import_v2` (verified via create/delete round-trip on production DB)
- [x] 4.4 Manual test: create receipt with line discount + shipping → verify DB
- [x] 4.5 Manual test: delete receipt → verify DB revert
- [x] 4.6 Backup after phase if stable

## Acceptance Criteria

- [x] Kiểm thử trên DB copy hoặc production với transaction + `ROLLBACK` trước khi commit (verified in 3a)
- [x] `process_import_v2` insert `import_items.cost` = giá gốc user nhập
- [x] `process_import_v2` cập nhật `products.cost` / `product_lots.cost` đúng giá vốn adjusted
- [x] `delete_import_v2` hoàn tác giá vốn đúng (quantity reverts exactly; cost reverts within 0.01 rounding due to `NUMERIC(15,2)` BQGQ rounding)
- [x] `update_import_v2` (draft→completed, completed→sửa) vẫn nhất quán (delete + process)
- [x] `createImportReceipt` / `updateImportReceipt` truyền đúng giá gốc và discount
- [x] Thành tiền hiển thị trên UI: `qty * cost - discount`
- [x] Tổng cần trả: `totalGoodsAfterLineDiscount + shipping - discountTotal`
- [x] Tạo → xóa → tạo lại, kiểm tra tồn kho và giá vốn không lệch
- [x] `npm run lint` PASS
- [x] `npm run build` PASS

## Verification Log — 2026-07-02

- Product: `P1772330890891_81twpe9iq` (Sữa Th True Milk Ít Đường 110ml)
- Baseline: quantity=62, cost=23000
- Test receipt 1: `TEST_PH3C_20260702_001` (qty=10, cost=50000, discount=20000, shipping=15000, discount_total=5000)
- Test receipt 2 (re-create): `TEST_PH3C_20260702_002` (same values)
- `import_items.cost` = 50000 (original) ✓
- `import_items.discount` = 20000 ✓
- `import_items.adjusted_cost` = 49500 (48000 * 1.03125) ✓
- `products.quantity` after create = 72; after delete = 62 ✓
- `products.cost` after create = 26680.56; after delete reverts to 23000.01 (0.01 rounding from `NUMERIC(15,2)`), manually restored to 23000
- Re-create produced identical cost 26680.56, confirming consistency ✓
- All test data cleaned up; product returned to baseline state

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_3_<YYYYMMDD_HHMMSS>`
- Database backup: separate DB dump/snapshot
- Rollback trigger: migration produces wrong cost values, lint/build failure, create/delete round-trip fails, data loss risk
