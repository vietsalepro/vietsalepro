## Plan Coverage

- [x] Every sub-phase from PLAN_REFINED for Phase 1 is represented in `tasks.md` (1a, 1b, 1c)
- [x] No sub-phase from PLAN_REFINED is skipped or merged without reason

## File List

### Files to modify
- [ ] `pages/ImportGoods.tsx`
- [ ] `services/supabaseService.ts` (if `getSuppliers`, `searchProducts`, or `getImportStats` are missing)
- [ ] `components/import-goods/ImportProductSearch.tsx` (interface/prop only)
- [ ] `components/import-goods/ImportItemsTable.tsx` (prop only)

### Files to delete
- [ ] None

### Feature flags to remove
- [ ] None

## Guardrails

- [ ] Business logic handlers (`addToImportList`, `submitReceipt`, `handleCreateSupplier`) are intentionally modified only to use local state/cache
- [ ] `types.ts` changes are intentionally documented (none expected unless service types need new fields)
- [ ] Database / Supabase / RPC changes are documented and tested only if `getImportStats` requires a new RPC
- [ ] No unrelated layout or voucher-form changes are included

## Acceptance Criteria Mapping

| PLAN_REFINED criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| Chọn được NCC từ dropdown | 1.1 Fetch suppliers, 3.1 supplier dropdown | pending |
| Stat cards ở tab history hiển thị đúng | 1.3 Compute stats, 3.2 stat cards | pending |
| Không còn `suppliers.find(...)` trên prop rỗng | 3.3 Static search, spec: Remove prop dependency | pending |
| Tìm sản phẩm theo tên/mã/barcode từ server | 2.1 Debounced search, 4.1 product search | pending |
| Chọn sản phẩm → thêm vào bảng đúng | 2.2 Update cache, 4.2 addToImportList | pending |
| Không còn `products.find(...)` trên prop rỗng | 3.3 Static search, spec: Remove prop dependency | pending |
| Toàn bộ tab create/history hoạt động khi prop rỗng | 5.1 Integration test, 5.2 prop-empty smoke test | pending |
| `npm run lint` PASS | 6.1 | pending |
| `npm run build` PASS | 6.2 | pending |

## Verification Steps

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test: open `/import` history tab, verify stat cards and supplier filter
- [ ] Manual test: open create tab, search product, add to table, select supplier
- [ ] Responsive test (desktop / tablet / mobile) — navigation only; no layout changes expected
