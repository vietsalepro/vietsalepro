## Plan Coverage

- [ ] Phase 2a (Delete `DisposalFormLayout` dead code) is represented in tasks.md
- [ ] Phase 2b (Refactor `DisposalSidebar/InfoSection.tsx`) is represented in tasks.md
- [ ] Phase 2c (Refactor `ReasonSection.tsx` and `NoteSection.tsx`) is represented in tasks.md
- [ ] Phase 2d (Refactor `ActionFooter.tsx` and decide `StatsSection`) is represented in tasks.md
- [ ] Phase 2e (Rà soát `pages/DisposalForm.tsx`) is represented in tasks.md
- [ ] Phase 2f (Refactor `DisposalItemRow` and `DisposalItemsTable`) is represented in tasks.md
- [ ] Phase 2g (Rà soát `pages/DisposalForm.css`) is represented in tasks.md
- [ ] Phase 2h (Disable `useRefactoredDisposalLayout` and verify) is represented in tasks.md

## File List

### Files to modify
- `pages/DisposalForm.tsx` — remove dead imports, layout wrapper, header/topbar usage
- `components/disposal-form/DisposalSidebar/InfoSection.tsx` — remove V1 branch
- `components/disposal-form/DisposalSidebar/ReasonSection.tsx` — remove V1 branch
- `components/disposal-form/DisposalSidebar/NoteSection.tsx` — remove V1 branch
- `components/disposal-form/DisposalSidebar/ActionFooter.tsx` — remove V1 branch
- `components/disposal-form/DisposalItemRow.tsx` — remove V1 branch
- `components/disposal-form/DisposalItemsTable.tsx` — remove V1 branch
- `features.ts` — comment out `useRefactoredDisposalLayout`
- CSS files listed above — remove layout classes and keep content styling
- `pages/DisposalForm.css` — if exists, remove create-form layout CSS

### Files to delete
- `components/disposal-form/DisposalFormLayout.tsx`
- `components/disposal-form/DisposalFormLayout.css`

### Feature flags to remove
- `useRefactoredDisposalLayout` (commented out now; deleted in Phase 6b)

## Guardrails

- [ ] Business logic handlers are not modified
- [ ] `types.ts` is not modified
- [ ] No database / Supabase / migration changes
- [ ] `DisposalTopBar.tsx` and `StatsSection.tsx` files are not deleted yet
- [ ] `useRefactoredDisposalLayout` is only commented out, not deleted
- [ ] Each sidebar section uses `SectionBox` + `SectionHeader` + `SectionContent`
- [ ] `pages/DisposalForm.tsx` does not define its own create-form layout

## Acceptance Criteria Mapping

| PLAN_02 criterion | Task / Spec scenario | Status |
|-------------------|----------------------|--------|
| `DisposalFormLayout` files deleted | Task 2.1 / Spec scenario "No imports of DisposalFormLayout" | pending |
| `InfoSection` no V1 branch | Task 2.2 / Spec scenario "InfoSection renders with SectionBox" | pending |
| `ReasonSection`/`NoteSection` no V1 branch | Task 2.3 | pending |
| `ActionFooter` no V1 branch; Option A for `StatsSection` | Task 2.4 | pending |
| `DisposalForm.tsx` no dead imports, no own layout | Task 2.5 / Spec scenario "DisposalForm renders without dead topbar" | pending |
| `DisposalItemRow`/`DisposalItemsTable` no V1 branch | Task 2.6 / Spec scenario "DisposalItemRow action column renders V2" | pending |
| `DisposalForm.css` create-form CSS removed | Task 2.7 | pending |
| `useRefactoredDisposalLayout` commented out | Task 2.8 | pending |
| Manual flow test pass | Task 2.9 | pending |

## Verification Steps

- [ ] `npm run lint` pass after each sub-phase
- [ ] `npm run build` pass after the phase
- [ ] Grep confirms no `useRefactoredDisposalLayout` imports in disposal components
- [ ] Grep confirms no `DisposalFormLayout` imports
- [ ] `pages/DisposalForm.tsx` does not import `DisposalTopBar` or `StatsSection`
- [ ] Manual test: create disposal voucher → save draft → complete
- [ ] Responsive layout checked at <1024px
