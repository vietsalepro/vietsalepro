# Proposal: Phase 6 — Dọn dẹp SSOT

## Why

After Phases 1–5, the four voucher screens are aligned with `VoucherFormLayout`, but several dead files, commented feature flags, and legacy CSS classes remain. Phase 6 performs the final cleanup: deleting the remaining dead code files, removing the three feature flags from `features.ts`, and auditing `index.css` for legacy `ig-*` classes that are no longer used.

## What Changes

- Delete the 11 dead code layout/CSS files that are no longer imported:
  - `components/import-goods/ImportFormLayout.tsx` + `.css`
  - `components/import-goods/ImportTopBar.tsx` + `.css`
  - `components/disposal-form/DisposalFormLayout.tsx` + `.css`
  - `components/disposal-form/DisposalTopBar.tsx` + `.css`
  - `components/disposal-form/DisposalSidebar/StatsSection.tsx` + `.css`
  - `components/inventory-count/CountFormLayout.css`
- Delete the three feature flags from `features.ts`:
  - `useRefactoredImportLayout`
  - `useRefactoredDisposalLayout`
  - `useRefactoredCountLayout`
- Confirm no imports of the flags or dead components remain.
- Remove section-specific textarea CSS classes (`.disposal-note-textarea`, `.count-notes-textarea`, `.import-note-textarea`) because `FormTextarea.css` is now the shared source.
- Audit `index.css` and remove legacy `ig-*` classes that are no longer referenced, while keeping classes used by history/detail/list views.
- Run final grep checks to confirm only `VoucherFormLayout` is used as the shared layout.

## Scope / Non-Goals

**In scope:**
- Deleting dead code files listed above
- Removing feature flags from `features.ts`
- Cleaning legacy CSS from `index.css`
- Final verification greps

**Out of scope:**
- Business logic changes
- `types.ts` changes
- Database/Supabase changes
- New feature development

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

### Removed Capabilities
- `import-form-layout-v1`, `disposal-form-layout-v1`, `count-form-layout-css`
- `import-topbar`, `disposal-topbar`
- `disposal-stats-section`
- `refactored-layout-flags` (`useRefactoredImportLayout`, `useRefactoredDisposalLayout`, `useRefactoredCountLayout`)
- Legacy `ig-*` CSS classes that are no longer used

## Impact

- Files deleted: 11 dead code files (see list above)
- Files modified: `features.ts`, `index.css`, `components/disposal-form/DisposalSidebar/NoteSection.css`, `components/import-goods/ImportSidebar/NoteSection.css` (if they still contain old textarea classes)
- No new files are created

## Rollback

Restore individual files from the Phase 6 backup if they are accidentally deleted. Restore the three flag lines in `features.ts` if needed. Re-add removed `ig-*` classes to `index.css` if they were still referenced by a missed file. Because Phase 6 is final cleanup, rollback is usually partial rather than full-project.
