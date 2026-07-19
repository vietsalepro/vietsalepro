## Plan Coverage

- [ ] Phase 7a (Static check: lint & build) is represented in tasks.md
- [ ] Phase 7b (Manual test 5 flows) is represented in tasks.md
- [ ] Phase 7c (Responsive test & final report) is represented in tasks.md

## File List

### Files to modify
- None (verification only)
- Optional: `docs/plans/voucher-form-layout-ssot/VERIFICATION_REPORT.md` (new note)

### Files to delete
- None

### Feature flags to remove
- None

## Guardrails

- [ ] No code changes in Phase 7
- [ ] If a regression is found, do not patch in Phase 7; return to the relevant phase
- [ ] Business logic, `types.ts`, and database are not modified
- [ ] Verification results are documented

## Acceptance Criteria Mapping

| PLAN_02 criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| `npm run lint` pass (0 errors) | Task 7.1 / Spec scenario "Lint passes" | pending |
| `npm run build` pass (0 errors) | Task 7.2 / Spec scenario "Build passes" | pending |
| 5 manual flows pass | Task 7.3–7.7 / Spec scenarios for each flow | pending |
| No critical console errors | Task 7.3–7.7 | pending |
| Desktop responsive pass | Task 7.8 / Spec scenario "Desktop layout" | pending |
| Tablet responsive pass | Task 7.9 / Spec scenario "Tablet layout" | pending |
| Mobile responsive pass | Task 7.10 / Spec scenario "Mobile layout" | pending |
| Edge cases pass | Task 7.11–7.13 | pending |
| Final report saved | Task 7.14 | pending |

## Verification Steps

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual flow: Tạo phiếu nhập hàng
- [ ] Manual flow: Sửa phiếu nhập hàng draft
- [ ] Manual flow: Tạo phiếu kiểm kê
- [ ] Manual flow: Tạo phiếu xuất hủy
- [ ] Manual flow: Tạo phiếu đổi hàng NCC
- [ ] Desktop responsive check (>1024px)
- [ ] Tablet responsive check (768–1024px)
- [ ] Mobile responsive check (<768px)
- [ ] Edge case: sidebar actions sticky
- [ ] Edge case: SupplierExchanges wizard UI responsive
- [ ] Edge case: empty main content
- [ ] Edge case: banner without search slot
- [ ] Edge case: InventoryCount date input visual
- [ ] Save final verification report
