## Plan Coverage

- [x] Every sub-phase from PLAN_REFINED for Phase 6 is represented in `tasks.md` (single sub-phase)
- [x] No sub-phase from PLAN_REFINED is skipped or merged without reason

## File List

### Files to modify
- [ ] `App.tsx` (`handleDeleteImport`)
- [ ] `pages/ImportGoods.tsx` (`handleDeleteClick`, `submitReceipt`)
- [ ] `archive/migration_phase6_import_delete_messages.sql` (only if backend messages change)

### Files to delete
- [ ] None

### Feature flags to remove
- [ ] None

## Guardrails

- [ ] Business logic handlers (`handleDeleteImport`, `handleDeleteClick`, `submitReceipt`) are intentionally modified
- [ ] `types.ts` changes are intentionally documented (none expected)
- [ ] Database / Supabase / RPC changes are intentionally documented (only if migration file is created)
- [ ] No unrelated layout or voucher-form changes are included

## Acceptance Criteria Mapping

| PLAN_REFINED criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| Thử xóa phiếu nhập mà sản phẩm đã bán hết → message rõ ràng tên sản phẩm và lý do | 1.1 Parse product error, 4.1 test | pending |
| Thử xóa phiếu nhập có lô đã bán hết → message rõ ràng tên lô và sản phẩm | 1.2 Parse lot error, 4.2 test | pending |
| Sau khi tạo/xóa phiếu, stats cards cập nhật đúng | 2.1 Refresh after submit, 2.2 Refresh after delete, 4.3/4.4 test | pending |
| `npm run lint` PASS | 5.1 | pending |
| `npm run build` PASS | 5.2 | pending |

## Verification Steps

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test: delete a receipt where product is sold out
- [ ] Manual test: delete a receipt where lot is sold out
- [ ] Manual test: create a receipt and verify stats refresh
- [ ] Manual test: delete a receipt and verify stats refresh
