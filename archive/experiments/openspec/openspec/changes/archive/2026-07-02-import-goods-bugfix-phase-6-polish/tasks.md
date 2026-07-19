## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_6_<YYYYMMDD_HHMMSS>`
- [x] 0.2 Confirm `npm run lint` pass
- [x] 0.3 Confirm `npm run build` pass
- [x] 0.4 Read `docs/plans/import-goods-bugfix/PLAN_REFINED.md` Phase 6 section

## 1. Sub-phase 6 — Xử lý lỗi xóa rõ ràng

- [x] 1.1 Locate `handleDeleteImport` in `App.tsx`
- [x] 1.2 Parse error message from `delete_import_v2`
- [x] 1.3 Map "đã bán vượt quá số lượng nhập" to "Không thể xóa: sản phẩm X đã bán vượt quá lượng nhập. Vui lòng kiểm tra tồn kho."
- [x] 1.4 Map "lô ... không đủ tồn kho" to a message naming the lot and product
- [x] 1.5 Fallback to original message for unrecognized errors
- [x] 1.6 Run `npm run lint`
- [x] 1.7 Run `npm run build`
- [x] 1.8 Manual test: delete a sold-out product receipt
- [x] 1.9 Manual test: delete a sold-out lot receipt

## 2. Sub-phase 6 — Cập nhật stats sau CRUD

- [x] 2.1 Locate `handleDeleteClick` in `pages/ImportGoods.tsx`
- [x] 2.2 Change `fetchReceipts` call to run after `await onDeleteImport(...)`
- [x] 2.3 Add `fetchStats` call after successful `submitReceipt`
- [x] 2.4 Add `fetchStats` call after successful delete in `handleDeleteClick`
- [x] 2.5 Run `npm run lint`
- [x] 2.6 Run `npm run build`
- [x] 2.7 Manual test: create receipt → stats refresh
- [x] 2.8 Manual test: delete receipt → stats refresh

## 3. Sub-phase 6 — Kiểm tra `product_lots.original_quantity`

- [x] 3.1 Verify `process_import_v2` inserts `product_lots.original_quantity = v_item.quantity`
- [x] 3.2 Verify `delete_import_v2` removes lot when quantity reaches zero
- [x] 3.3 Document conclusion that duplicate-lot behavior is acceptable
- [x] 3.4 If backend message change needed, create `archive/migration_phase6_import_delete_messages.sql`

## 4. Cleanup & Verification

- [x] 4.1 Run `npm run lint`
- [x] 4.2 Run `npm run build`
- [x] 4.3 Manual test: full delete-error scenarios
- [x] 4.4 Manual test: stats refresh after create and delete
- [x] 4.5 Backup after phase if stable

## Acceptance Criteria

- [x] Thử xóa phiếu nhập mà sản phẩm đã bán hết → hiển thị message rõ ràng tên sản phẩm và lý do
- [x] Thử xóa phiếu nhập có lô đã bán hết → message rõ ràng tên lô và sản phẩm
- [x] Sau khi tạo/xóa phiếu, stats cards cập nhật đúng
- [x] `npm run lint` PASS
- [x] `npm run build` PASS

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_6_<YYYYMMDD_HHMMSS>`
- Rollback trigger: delete error messages missing/wrong, stats not updating, lint/build failure
