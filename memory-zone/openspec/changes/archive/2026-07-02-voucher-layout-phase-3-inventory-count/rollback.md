# Rollback: Phase 3 — Refactor `InventoryCount`

## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase3_$(Get-Date -Format yyyyMMdd_HHmmss)" -Recurse
```

## Files to Restore

- `components/inventory-count/CountFormLayout.tsx`
- `components/inventory-count/CountFormLayout.css` (if deleted)
- `components/inventory-count/CountSidebar/CountInfoSection.tsx`
- `components/inventory-count/CountSidebar/CountInfoSection.css` (if deleted)
- `components/inventory-count/CountSidebar/CountSummary.tsx`
- `components/inventory-count/CountSidebar/CountSummary.css` (if deleted)
- `components/SummaryRow.tsx`
- `components/disposal-form/DisposalSidebar/NoteSection.tsx`
- `components/import-goods/ImportSidebar/NoteSection.tsx`
- `pages/InventoryCount.css`
- `features.ts`
- Delete the newly created files if they cause issues: `components/FormTextarea.tsx`, `components/FormTextarea.css`, `components/SummaryRow.css`

## Rollback Steps

1. Stop the dev server if running.
2. Copy the backup versions of the files above into the project.
3. Delete `components/FormTextarea.tsx`, `components/FormTextarea.css`, and `components/SummaryRow.css` if they are causing problems.
4. Revert the three note sections to use raw `<textarea>` if `FormTextarea` is removed.
5. Uncomment `useRefactoredCountLayout` in `features.ts` if needed.
6. Run `npm run lint`.
7. Run `npm run build`.
8. Test the inventory count create/save/complete flow.

## When to Rollback

- `npm run lint` or `npm run build` fails after creating `FormTextarea` or `SummaryRow.css`.
- Visual regression in notes textarea, date input, or summary accent colors.
- `FormTextarea` integration breaks on one of the three screens.
- `SummaryRow.css` accent classes are missing and cause visual errors.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Inventory count form renders with the original layout and styles
- [ ] Notes textarea, date input, and summary values look correct
- [ ] Manual test flow create/save/complete pass
