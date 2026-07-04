# Rollback: Phase 2 — Refactor `DisposalForm`

## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase2_$(Get-Date -Format yyyyMMdd_HHmmss)" -Recurse
```

## Files to Restore

- `components/disposal-form/DisposalFormLayout.tsx` (if deleted)
- `components/disposal-form/DisposalFormLayout.css` (if deleted)
- `pages/DisposalForm.tsx`
- `components/disposal-form/DisposalSidebar/InfoSection.tsx`
- `components/disposal-form/DisposalSidebar/ReasonSection.tsx`
- `components/disposal-form/DisposalSidebar/NoteSection.tsx`
- `components/disposal-form/DisposalSidebar/ActionFooter.tsx`
- `components/disposal-form/DisposalItemRow.tsx`
- `components/disposal-form/DisposalItemsTable.tsx`
- `features.ts`
- `pages/DisposalForm.css` (if modified)

## Rollback Steps

1. Stop the dev server if running.
2. Copy the backup versions of the files above into the project.
3. If `DisposalFormLayout` files were deleted and must be restored, copy them back from the backup.
4. Uncomment `useRefactoredDisposalLayout` in `features.ts` if the V1 branch is needed.
5. Run `npm run lint`.
6. Run `npm run build`.
7. Test the disposal create/save/complete flow to confirm the pre-Phase 2 state.

## When to Rollback

- `npm run lint` or `npm run build` fails after a sub-phase and the fix is not obvious.
- Visual or functional regression in the disposal form after disabling the feature flag.
- Accidental deletion of live code.
- `StatsSection` or other dead imports were removed too early and break the build.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] `DisposalFormLayout` import not needed (or restored if needed)
- [ ] Disposal form create flow works as before Phase 2
- [ ] Responsive layout at <1024px works
