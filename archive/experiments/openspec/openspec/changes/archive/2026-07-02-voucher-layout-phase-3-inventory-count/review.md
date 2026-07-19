## Plan Coverage

- [ ] Phase 3a (Refine `CountFormLayout` and create `FormTextarea`) is represented in tasks.md
- [ ] Phase 3b (Refactor `CountInfoSection` and `CountSummary`) is represented in tasks.md
- [ ] Phase 3c (Disable `useRefactoredCountLayout` and verify) is represented in tasks.md
- [ ] Phase 3d (Review `pages/InventoryCount.css`) is represented in tasks.md

## File List

### Files to modify
- `components/inventory-count/CountFormLayout.tsx` — replace textarea with `FormTextarea`, remove CSS import
- `components/inventory-count/CountSidebar/CountInfoSection.tsx` — use `TextInput type="date"`
- `components/inventory-count/CountSidebar/CountSummary.tsx` — migrate to shared accent classes
- `components/SummaryRow.tsx` — import `SummaryRow.css`
- `components/disposal-form/DisposalSidebar/NoteSection.tsx` — use `FormTextarea`
- `components/import-goods/ImportSidebar/NoteSection.tsx` — use `FormTextarea`
- `pages/InventoryCount.css` — remove create/edit form layout CSS
- `features.ts` — comment out `useRefactoredCountLayout`

### Files to create
- `components/FormTextarea.tsx`
- `components/FormTextarea.css`
- `components/SummaryRow.css`

### Files to delete
- `components/inventory-count/CountFormLayout.css`
- `components/inventory-count/CountSidebar/CountInfoSection.css` (if no other styles remain)
- `components/inventory-count/CountSidebar/CountSummary.css` (if no other styles remain)

### Feature flags to remove
- `useRefactoredCountLayout` (commented out now; deleted in Phase 6b)

## Guardrails

- [ ] Business logic handlers are not modified
- [ ] `types.ts` is not modified
- [ ] No database / Supabase / migration changes
- [ ] `FormTextarea` only handles presentation; it does not manage state
- [ ] `SummaryRow.css` is created before Phase 6a deletes `StatsSection.css`
- [ ] `CountFormLayout.tsx` remains a wrapper around `VoucherFormLayout`

## Acceptance Criteria Mapping

| PLAN_02 criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| `CountFormLayout.css` deleted | Task 3.4 / Spec scenario "CountFormLayout.css does not exist" | pending |
| `FormTextarea` created and used in 3 note sections | Task 3.1, 3.5 / Spec scenario "FormTextarea renders with default props" | pending |
| `CountInfoSection` uses `TextInput` for date | Task 3.6 / Spec scenario "Ngày kiểm renders with TextInput" | pending |
| `SummaryRow.css` created with accent classes | Task 3.8 / Spec scenario "SummaryRow accent class renders" | pending |
| `CountSummary` uses shared accent classes | Task 3.9 / Spec scenario "CountSummary uses shared accent" | pending |
| `pages/InventoryCount.css` create/edit layout CSS removed | Task 3.11 | pending |
| `useRefactoredCountLayout` commented out | Task 3.12 | pending |
| Manual inventory count flow test pass | Task 3.13 | pending |

## Verification Steps

- [ ] `npm run lint` pass after each sub-phase
- [ ] `npm run build` pass after the phase
- [ ] `FormTextarea` renders correctly in InventoryCount, DisposalForm, and ImportGoods
- [ ] Date input in `CountInfoSection` is visually aligned on Chrome/Safari
- [ ] `SummaryRow.css` defines all required accent classes
- [ ] `CountFormLayout.css` no longer exists
- [ ] Manual test: create inventory count → enter actual quantity → save draft → complete
- [ ] Responsive layout checked
