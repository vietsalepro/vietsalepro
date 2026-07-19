# Proposal: Phase 2 — Refactor `DisposalForm`

## Why

The Disposal (Xuất hủy) screen still contains the legacy `DisposalFormLayout` component, the `DisposalTopBar` dead import, a `StatsSection` that is no longer used, V1 branches in sidebar sections and item table components, and a feature flag `useRefactoredDisposalLayout`. Refactoring this screen now removes dead code and aligns the create form fully with `VoucherFormLayout`.

## What Changes

- Delete `components/disposal-form/DisposalFormLayout.tsx` and `DisposalFormLayout.css`.
- Remove V1 branches and the `useRefactoredDisposalLayout` import from all `DisposalSidebar` sections (`InfoSection`, `ReasonSection`, `NoteSection`, `ActionFooter`).
- Decide and record Option A for `StatsSection`: remove the component and CSS file (import removed in Phase 2e, files deleted in Phase 6a).
- Clean up `pages/DisposalForm.tsx`: remove `DisposalTopBar` and `StatsSection` dead imports, stop defining its own layout wrapper, and pass content only into `VoucherFormLayout` slots.
- Remove V1 branches from `DisposalItemRow.tsx` and `DisposalItemsTable.tsx`.
- Review `pages/DisposalForm.css` if it exists and remove create-form layout CSS while keeping list/detail/modal CSS.
- Comment out `useRefactoredDisposalLayout` in `features.ts` (final removal in Phase 6b).

## Scope / Non-Goals

**In scope:**
- Disposal form layout refactor and V1 branch removal
- Dead import removal in `pages/DisposalForm.tsx`
- CSS cleanup for create form layout
- Feature flag deactivation

**Out of scope:**
- Business logic, validation, calculations, API calls
- `types.ts` changes
- Database/Supabase changes
- Final deletion of `StatsSection` files (Phase 6a) and `features.ts` cleanup (Phase 6b)

## Capabilities

### New Capabilities
- None (this is a cleanup/refactor phase)

### Modified Capabilities
- `disposal-form-create`: Create/edit form uses only `VoucherFormLayout` for layout.
- `disposal-sidebar-sections`: Sidebar sections use `SectionBox` + `SectionHeader` + `SectionContent` without V1 branches.
- `disposal-items-table`: Item row and table render the V2 branch only.

### Removed Capabilities
- `disposal-form-layout-v1`: `DisposalFormLayout` component and CSS are removed.
- `disposal-topbar`: `DisposalTopBar` usage is removed.
- `disposal-stats-section`: `StatsSection` is scheduled for removal.

## Impact

- Files deleted: `components/disposal-form/DisposalFormLayout.tsx`, `DisposalFormLayout.css`
- Files modified: `pages/DisposalForm.tsx`, `components/disposal-form/DisposalSidebar/InfoSection.tsx`, `ReasonSection.tsx`, `NoteSection.tsx`, `ActionFooter.tsx`, `DisposalItemRow.tsx`, `DisposalItemsTable.tsx`, `features.ts`
- Files reviewed: `pages/DisposalForm.css` (if it exists)
- CSS files adjusted: `InfoSection.css`, `ReasonSection.css`, `NoteSection.css`, `ActionFooter.css`, `DisposalItemRow.css`, `DisposalItemsTable.css`

## Rollback

Restore the modified files and deleted files from the Phase 2 backup. Re-enable `useRefactoredDisposalLayout` if the V1 branch is still needed. Because the flag is only commented out, rollback is straightforward.
