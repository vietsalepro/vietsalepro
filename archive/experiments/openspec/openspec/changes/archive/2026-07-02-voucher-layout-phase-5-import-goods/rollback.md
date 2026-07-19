# Rollback: Phase 5 — Refactor `ImportGoods`

## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase5_$(Get-Date -Format yyyyMMdd_HHmmss)" -Recurse
```

## Files to Restore

- `components/import-goods/ImportFormLayout.tsx` (if deleted)
- `components/import-goods/ImportFormLayout.css` (if deleted)
- `components/import-goods/ImportTopBar.tsx` (if deleted)
- `components/import-goods/ImportTopBar.css` (if deleted)
- `pages/ImportGoods.tsx`
- `pages/ImportGoods.css`
- `components/import-goods/ImportSidebar/SupplierSection.tsx`
- `components/import-goods/ImportSidebar/ReceiptInfoSection.tsx`
- `components/import-goods/ImportSidebar/TotalsSection.tsx`
- `components/import-goods/ImportSidebar/NoteSection.tsx`
- `components/import-goods/ImportSidebar/ActionFooter.tsx`
- `components/import-goods/ImportItemRow.tsx`
- `components/import-goods/ImportItemsTable.tsx`
- `features.ts`

## Rollback Steps

1. Stop the dev server if running.
2. Copy the backup versions of the files above into the project.
3. Restore the deleted `ImportFormLayout` and `ImportTopBar` files if needed.
4. Uncomment `useRefactoredImportLayout` in `features.ts` if the V1 branch is needed.
5. Run `npm run lint`.
6. Run `npm run build`.
7. Test the import create/save/complete/edit flow to confirm the pre-Phase 5 state.

## When to Rollback

- `npm run lint` or `npm run build` fails after a sub-phase and the fix is not obvious.
- Visual regression in the import form, sidebar, or item table.
- Calculation errors in totals, debt, or payment.
- Manual test flow fails at any step.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Import form create flow works as before Phase 5
- [ ] Calculations (total, need to pay, debt) remain correct
- [ ] Responsive layout works
