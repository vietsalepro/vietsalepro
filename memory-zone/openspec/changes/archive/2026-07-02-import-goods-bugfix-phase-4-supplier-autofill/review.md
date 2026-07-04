## Plan Coverage

- [x] Every sub-phase from PLAN_REFINED for Phase 4 is represented in `tasks.md` (single sub-phase)
- [x] No sub-phase from PLAN_REFINED is skipped or merged without reason

## File List

### Files to modify
- [ ] `pages/ImportGoods.tsx`
- [ ] `services/supabaseService.ts` (if `getSuppliers` is missing)

### Files to delete
- [ ] None

### Feature flags to remove
- [ ] None

## Guardrails

- [ ] Business logic handlers (`handleCreateSupplier`) are intentionally modified to use server-side list
- [ ] `types.ts` changes are intentionally documented (none expected)
- [ ] Database / Supabase / RPC changes are intentionally documented (none expected)
- [ ] No unrelated layout or voucher-form changes are included

## Acceptance Criteria Mapping

| PLAN_REFINED criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| Tạo NCC mới khi `localSuppliers` rỗng → mã `NCC000001` không bị trùng | 1.1 Fetch before generate, 3.1 empty list test | pending |
| Tạo NCC mới khi đã có NCC → mã tăng đúng, không trùng | 1.2 Code generation, 3.2 existing list test | pending |
| Thêm sản phẩm vào phiếu nhập có chiết khấu dòng → tiền trả auto-fill đúng | 2.1 Auto-fill, 3.3 paid amount test | pending |
| `npm run lint` PASS | 4.1 | pending |
| `npm run build` PASS | 4.2 | pending |

## Verification Steps

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test: create new supplier with empty supplier list
- [ ] Manual test: create new supplier with existing suppliers
- [ ] Manual test: add product with line discount, verify paid amount auto-fill
- [ ] Manual test: edit paid amount manually, verify it is preserved
