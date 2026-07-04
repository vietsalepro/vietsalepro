## Plan Coverage

- [x] Every sub-phase from PLAN_REFINED for Phase 3 is represented in `tasks.md` (3a, 3b, 3c)
- [x] No sub-phase from PLAN_REFINED is skipped or merged without reason

## File List

### Files to modify
- [ ] `archive/migration_phase3a_import_cost_ssot.sql` (new file)
- [ ] `services/supabaseService.ts`
- [ ] `types.ts` (if `adjustedCost` needed)
- [ ] `pages/ImportGoods.tsx`
- [ ] `components/import-goods/ImportItemRow.tsx`
- [ ] `components/import-goods/ImportItemsTable.tsx`

### Files to delete
- [ ] None

### Feature flags to remove
- [ ] None

## Guardrails

- [ ] Business logic handlers (`handleImport`) are intentionally modified only to pass correct cost/discount
- [ ] `types.ts` changes are intentionally documented (add `adjustedCost` if needed)
- [ ] Database / Supabase / migration changes are documented and tested on a copy or with transaction rollback
- [ ] No unrelated layout or voucher-form changes are included

## Acceptance Criteria Mapping

| PLAN_REFINED criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| Kiểm thử trên DB copy hoặc transaction rollback | 1.6 DB test, 4.1 DB verification | pending |
| `process_import_v2` insert `import_items.cost` = giá gốc | 1.2 RPC cost, spec | pending |
| `process_import_v2` cập nhật `products.cost` / `product_lots.cost` đúng giá vốn adjusted | 1.3 Adjusted cost, 4.2 DB check | pending |
| `delete_import_v2` hoàn tác giá vốn đúng | 1.4 Delete RPC, 4.3 DB check | pending |
| `update_import_v2` vẫn nhất quán | 1.5 Update RPC | pending |
| `createImportReceipt` / `updateImportReceipt` truyền đúng giá gốc và discount | 2.1 Service mapping, 4.4 Service check | pending |
| Thành tiền hiển thị `qty * cost - discount` | 3.2 Frontend display, 4.5 UI check | pending |
| Tổng cần trả: `totalGoodsAfterLineDiscount + shipping - discountTotal` | 3.3 Totals, 4.6 UI check | pending |
| Tạo → xóa → tạo lại, kiểm tra tồn kho và giá vốn không lệch | 4.7 Round-trip test | pending |
| `npm run lint` PASS | 5.1 | pending |
| `npm run build` PASS | 5.2 | pending |

## Verification Steps

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Database transaction test with rollback on `process_import_v2`
- [ ] Database transaction test with rollback on `delete_import_v2`
- [ ] Manual test: create receipt with discount + shipping, verify DB values
- [ ] Manual test: delete the receipt, verify inventory and cost revert
