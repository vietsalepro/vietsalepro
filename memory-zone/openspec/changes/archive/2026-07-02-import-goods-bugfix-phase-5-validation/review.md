## Plan Coverage

- [x] Every sub-phase from PLAN_REFINED for Phase 5 is represented in `tasks.md` (5a, 5b)
- [x] No sub-phase from PLAN_REFINED is skipped or merged without reason

## File List

### Files to modify
- [ ] `App.tsx` (`handleImport`)
- [ ] `pages/ImportGoods.tsx` (`generateReceiptCode`)
- [ ] `services/supabaseService.ts` (if helpers are missing)

### Files to delete
- [ ] None

### Feature flags to remove
- [ ] None

## Guardrails

- [ ] Business logic handlers (`handleImport`) are intentionally modified to add validation
- [ ] `types.ts` changes are intentionally documented (none expected)
- [ ] Database / Supabase / RPC changes are intentionally documented (none expected unless adding RPC)
- [ ] No unrelated layout or voucher-form changes are included

## Acceptance Criteria Mapping

| PLAN_REFINED criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| Nhập `discountTotal` âm → alert rõ ràng, không gọi RPC | 1.1 Negative discount, 4.1 test | pending |
| Nhập trùng số hóa đơn NCC với phiếu cũ → alert, không gọi RPC | 1.2 Duplicate invoice, 4.2 test | pending |
| Tạo phiếu với mã đã tồn tại ở trạng thái hoàn thành → alert, không gọi RPC | 1.3 Duplicate receipt id, 4.3 test | pending |
| Chọn ngày nhập là ngày hôm qua → mã phiếu tự sinh theo ngày hôm qua | 2.1 Generate from date, 4.4 test | pending |
| F5 ở `/import/create` với ngày cũ → mã phiếu tính theo ngày đó | 2.2 Refresh test, 4.5 test | pending |
| `npm run lint` PASS | 5.1 | pending |
| `npm run build` PASS | 5.2 | pending |

## Verification Steps

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test: negative discount rejection
- [ ] Manual test: duplicate invoice number rejection
- [ ] Manual test: duplicate completed receipt id rejection
- [ ] Manual test: draft receipt id allowed
- [ ] Manual test: receipt code generated from selected import date
- [ ] Manual test: F5 refresh preserves date-based code
