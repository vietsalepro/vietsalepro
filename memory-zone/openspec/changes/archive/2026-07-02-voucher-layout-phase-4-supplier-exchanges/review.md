## Plan Coverage

- [ ] Phase 4a (Analyze create form) is represented in tasks.md
- [ ] Phase 4b (Standardize form and banner) is represented in tasks.md
- [ ] Phase 4c (Refactor sidebar sections) is represented in tasks.md
- [ ] Phase 4d (Verify SupplierExchanges) is represented in tasks.md
- [ ] Phase 4e (Review `pages/SupplierExchanges.css`) is represented in tasks.md

## File List

### Files to modify
- `pages/SupplierExchanges.tsx` — use `banner` prop, remove layout wrapper, standardize sidebar
- `pages/SupplierExchanges.css` — remove create-form layout CSS

### Files to create
- None (unless sidebar complexity requires new `components/supplier-exchanges/` files)

### Files to delete
- None (CSS classes are removed, but no files are deleted)

### Feature flags to remove
- None in Phase 4

## Guardrails

- [ ] Business logic handlers are not modified
- [ ] `types.ts` is not modified
- [ ] No database / Supabase / migration changes
- [ ] Wizard UI logic is not changed
- [ ] `VoucherFormLayout` `banner` prop from Phase 1 is used
- [ ] `FormTextarea` from Phase 3a is used for Ghi chú
- [ ] List view, detail view, and modal CSS are preserved

## Acceptance Criteria Mapping

| PLAN_02 criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| Banner passed via `banner` prop | Task 4.2 / Spec scenario "Banner is inside VoucherFormLayout" | pending |
| Create form no own layout wrapper | Task 4.3 / Spec scenario "Create view wrapper is layout-neutral" | pending |
| Sidebar sections use `SectionBox` | Task 4.5 / Spec scenario "Sidebar renders two SectionBox components" | pending |
| 2-box decision recorded | Task 4.4 | pending |
| Inputs use standard components | Task 4.6 / Spec scenario "Lý do đổi trả uses SelectInput without label whitespace" | pending |
| `SupplierExchanges.css` cleaned | Task 4.8 / Spec scenario "SupplierExchanges.css has no create-form layout" | pending |
| Manual flow test pass | Task 4.7 | pending |
| Responsive wizard UI pass | Task 4.7 | pending |

## Verification Steps

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Alert banner appears between header and body
- [ ] Banner is not misaligned by page-level padding
- [ ] Sidebar has two `SectionBox` sections
- [ ] `SelectInput` for Lý do đổi trả has no label whitespace
- [ ] Ghi chú uses `FormTextarea`
- [ ] Manual test: create supplier exchange → select NCC → select receipt → select lot → enter quantities → complete
- [ ] Responsive wizard UI tested on tablet/mobile
