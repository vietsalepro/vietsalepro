## Plan Coverage

- [ ] Phase 5a (Delete `ImportFormLayout` and `ImportTopBar` dead code) is represented in tasks.md
- [ ] Phase 5b (Refactor `SupplierSection.tsx`) is represented in tasks.md
- [ ] Phase 5c (Refactor `ReceiptInfoSection.tsx`) is represented in tasks.md
- [ ] Phase 5d (Refactor `TotalsSection.tsx`) is represented in tasks.md
- [ ] Phase 5e (Refactor `NoteSection.tsx` and `ActionFooter.tsx`) is represented in tasks.md
- [ ] Phase 5f (Clean `ImportGoods.css` and page-level wrapper) is represented in tasks.md
- [ ] Phase 5g (Refactor `ImportItemRow` and `ImportItemsTable`) is represented in tasks.md
- [ ] Phase 5h (Disable `useRefactoredImportLayout` and verify) is represented in tasks.md

## File List

### Files to modify
- `pages/ImportGoods.tsx` — remove `ImportTopBar` import, remove create-form wrapper
- `pages/ImportGoods.css` — remove create-form layout CSS
- `components/import-goods/ImportSidebar/SupplierSection.tsx` — remove V1 branch
- `components/import-goods/ImportSidebar/ReceiptInfoSection.tsx` — remove V1 branch
- `components/import-goods/ImportSidebar/TotalsSection.tsx` — remove V1 branch, keep logic
- `components/import-goods/ImportSidebar/NoteSection.tsx` — remove V1 branch, use `FormTextarea`
- `components/import-goods/ImportSidebar/ActionFooter.tsx` — remove V1 branch
- `components/import-goods/ImportItemRow.tsx` — remove V1 branch
- `components/import-goods/ImportItemsTable.tsx` — remove V1 branch
- `features.ts` — comment out `useRefactoredImportLayout`
- CSS files listed above — remove layout classes, duplicate accents, and `margin-bottom` dư thừa

### Files to delete
- `components/import-goods/ImportFormLayout.tsx`
- `components/import-goods/ImportFormLayout.css`
- `components/import-goods/ImportTopBar.tsx`
- `components/import-goods/ImportTopBar.css`

### Feature flags to remove
- `useRefactoredImportLayout` (commented out now; deleted in Phase 6b)

## Guardrails

- [ ] Business logic handlers are not modified
- [ ] `types.ts` is not modified
- [ ] No database / Supabase / migration changes
- [ ] Totals calculation logic (`needToPay`, `debtDelta`, `paidAmount`) is not changed
- [ ] `useRefactoredImportLayout` is only commented out, not deleted
- [ ] Each sidebar section uses `SectionBox` + `SectionHeader` + `SectionContent`
- [ ] `pages/ImportGoods.tsx` does not define its own create-form layout
- [ ] History/detail/filter/pagination CSS in `pages/ImportGoods.css` is preserved

## Acceptance Criteria Mapping

| PLAN_02 criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| `ImportFormLayout`/`ImportTopBar` files deleted | Task 5.1 / Spec scenario "No imports of ImportFormLayout or ImportTopBar" | pending |
| `SupplierSection` no V1 branch | Task 5.2 / Spec scenario "SupplierSection renders V2" | pending |
| `ReceiptInfoSection` no V1 branch | Task 5.3 | pending |
| `TotalsSection` no V1 branch, logic preserved | Task 5.4 / Spec scenario "TotalsSection preserves calculation logic" | pending |
| `NoteSection` uses `FormTextarea` | Task 5.5 / Spec scenario "NoteSection uses FormTextarea" | pending |
| `ActionFooter` no V1 branch | Task 5.5 | pending |
| `ImportGoods.css` cleaned | Task 5.6 / Spec scenario "Create-form layout CSS is gone" | pending |
| `ImportItemRow`/`ImportItemsTable` no V1 branch | Task 5.7 / Spec scenario "ImportItemRow action column renders V2" | pending |
| `useRefactoredImportLayout` commented out | Task 5.8 | pending |
| Manual import flow test pass | Task 5.9 | pending |

## Verification Steps

- [ ] `npm run lint` pass after each sub-phase
- [ ] `npm run build` pass after the phase
- [ ] Grep confirms no `useRefactoredImportLayout` imports in import components
- [ ] Grep confirms no `ImportFormLayout` or `ImportTopBar` imports
- [ ] `ImportTopBar` import is removed from `pages/ImportGoods.tsx`
- [ ] `TotalsSection.css` no longer defines `.ig-input-sm--w140`
- [ ] Manual test: create import → select supplier → add products → enter price/qty/discount → enter ship/discount/paid → save draft → complete → edit draft
- [ ] Calculations remain correct
- [ ] Responsive layout checked
