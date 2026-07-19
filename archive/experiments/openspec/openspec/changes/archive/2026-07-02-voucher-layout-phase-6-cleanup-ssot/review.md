## Plan Coverage

- [ ] Phase 6a (Delete remaining dead code files) is represented in tasks.md
- [ ] Phase 6b (Delete 3 feature flags) is represented in tasks.md
- [ ] Phase 6c (Merge textarea CSS and final grep check) is represented in tasks.md

## File List

### Files to delete
- `components/import-goods/ImportFormLayout.tsx`
- `components/import-goods/ImportFormLayout.css`
- `components/import-goods/ImportTopBar.tsx`
- `components/import-goods/ImportTopBar.css`
- `components/disposal-form/DisposalFormLayout.tsx`
- `components/disposal-form/DisposalFormLayout.css`
- `components/disposal-form/DisposalTopBar.tsx`
- `components/disposal-form/DisposalTopBar.css`
- `components/disposal-form/DisposalSidebar/StatsSection.tsx`
- `components/disposal-form/DisposalSidebar/StatsSection.css`
- `components/inventory-count/CountFormLayout.css`

### Files to modify
- `features.ts` — delete three feature flags
- `index.css` — remove unused `ig-*` classes
- `components/disposal-form/DisposalSidebar/NoteSection.css` — remove `.disposal-note-textarea` if still present
- `components/import-goods/ImportSidebar/NoteSection.css` — remove `.import-note-textarea` if still present

### Files to create
- None

### Feature flags to remove
- `useRefactoredImportLayout`
- `useRefactoredDisposalLayout`
- `useRefactoredCountLayout`

## Guardrails

- [ ] Business logic handlers are not modified
- [ ] `types.ts` is not modified
- [ ] No database / Supabase / migration changes
- [ ] No new files are created
- [ ] Imports are removed before files are deleted
- [ ] `SummaryRow.css` from Phase 3b exists before `StatsSection.css` is deleted
- [ ] Each `ig-*` class is grepped before removal from `index.css`

## Acceptance Criteria Mapping

| PLAN_02 criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| 11 dead code files deleted | Task 6.1 / Spec scenario "Dead code files do not exist" | pending |
| 3 flags deleted in `features.ts` | Task 6.2 / Spec scenario "No feature flags remain" | pending |
| No imports of flags or dead files remain | Task 6.2, 6.3 | pending |
| Note section CSS uses shared textarea | Task 6.4 / Spec scenario "Note section CSS has no textarea classes" | pending |
| `index.css` audited, unused `ig-*` removed | Task 6.5 / Spec scenario "Legacy ig-layout classes are gone" | pending |
| Only `VoucherFormLayout` as layout | Task 6.6 / Spec scenario "Only VoucherFormLayout remains" | pending |
| `npm run lint` pass | Task 6.7 | pending |
| `npm run build` pass | Task 6.7 | pending |

## Verification Steps

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Grep confirms no `useRefactoredImportLayout`, `useRefactoredDisposalLayout`, `useRefactoredCountLayout` references
- [ ] Grep confirms no `ImportFormLayout`, `DisposalFormLayout`, `ImportTopBar`, `DisposalTopBar`, `StatsSection` references
- [ ] Grep confirms no `ig-layout`, `import-layout`, `disposal-layout`, `count-layout` references
- [ ] `index.css` no longer contains unused `ig-*` classes
- [ ] Final grep for `VoucherFormLayout` shows only the expected files
