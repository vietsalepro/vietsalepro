# Proposal: Phase 3 — Refactor `InventoryCount`

## Why

The InventoryCount (Kiểm kê) screen uses `CountFormLayout` as a wrapper, but it still imports its own CSS file and uses raw `<textarea>` and raw date inputs. The summary accent classes are duplicated across section CSS files. To align with the SSOT principle, `CountFormLayout` must stop defining its own layout, a shared `FormTextarea` component must be created for notes, `SummaryRow` must own its accent classes, and the page-level CSS must be cleaned.

## What Changes

- Create `components/FormTextarea.tsx` and `components/FormTextarea.css` as a shared textarea component using design tokens.
- Replace raw `<textarea>` notes in `CountFormLayout.tsx`, `DisposalSidebar/NoteSection.tsx`, and `ImportSidebar/NoteSection.tsx` with `FormTextarea`.
- Delete `components/inventory-count/CountFormLayout.css` and remove its import from `CountFormLayout.tsx`.
- Convert `CountInfoSection.tsx` to use `TextInput type="date"` for the ngày kiểm field; delete `CountInfoSection.css` if it only styles the raw input.
- Create `components/SummaryRow.css` and import it in `SummaryRow.tsx`; define `.summary-row-value--danger`, `--success`, `--neutral`, `--warning`.
- Migrate `CountSummary.tsx` accent classes to the shared `SummaryRow` classes.
- Comment out `useRefactoredCountLayout` in `features.ts` (final removal in Phase 6b).
- Clean `pages/InventoryCount.css` by removing create/edit form layout CSS while keeping list view, filter bar, and data grid CSS.

## Scope / Non-Goals

**In scope:**
- New `FormTextarea` shared component
- `CountFormLayout` cleanup and CSS deletion
- `CountInfoSection` and `CountSummary` standardization
- `SummaryRow.css` creation
- `pages/InventoryCount.css` cleanup
- `useRefactoredCountLayout` deactivation

**Out of scope:**
- Business logic for inventory count calculations
- `types.ts` changes
- Database/Supabase changes
- Final removal of `useRefactoredCountLayout` (Phase 6b)

## Capabilities

### New Capabilities
- `form-textarea`: A shared textarea component for voucher notes.
- `summary-row-accent`: Shared accent classes for summary row values.

### Modified Capabilities
- `inventory-count-form`: Notes use `FormTextarea`; date uses `TextInput`.
- `count-summary`: Accent classes use shared `SummaryRow.css`.

### Removed Capabilities
- `count-form-layout-css`: `CountFormLayout.css` is deleted.
- `count-info-section-css`: `CountInfoSection.css` is deleted if no other styles remain.

## Impact

- New files: `components/FormTextarea.tsx`, `components/FormTextarea.css`, `components/SummaryRow.css`
- Deleted files: `components/inventory-count/CountFormLayout.css`, `components/inventory-count/CountSidebar/CountInfoSection.css` (if no other styles remain)
- Modified files: `components/inventory-count/CountFormLayout.tsx`, `CountSidebar/CountInfoSection.tsx`, `CountSidebar/CountSummary.tsx`, `components/SummaryRow.tsx`, `components/disposal-form/DisposalSidebar/NoteSection.tsx`, `components/import-goods/ImportSidebar/NoteSection.tsx`, `pages/InventoryCount.css`, `features.ts`

## Rollback

Restore the modified files and deleted files from the Phase 3 backup. If `FormTextarea` causes issues, revert the three note sections back to raw `<textarea>` and restore `CountFormLayout.css`. Re-enable `useRefactoredCountLayout` if needed.
