# Rollback: Phase 6 — Dọn dẹp SSOT

## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase6_$(Get-Date -Format yyyyMMdd_HHmmss)" -Recurse
```

## Files to Restore

Any of the following files can be restored from the Phase 6 backup if they were deleted incorrectly:

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
- `features.ts` (to restore the three flag lines)
- `index.css` (to restore any accidentally removed `ig-*` classes)

## Rollback Steps

1. Stop the dev server if running.
2. Identify the specific file or class that was removed incorrectly.
3. Restore only that file or class from the Phase 6 backup.
4. If a deleted file is still needed, restore it and update imports to match.
5. If a feature flag is still needed, restore the three lines in `features.ts`.
6. Run `npm run lint`.
7. Run `npm run build`.
8. Re-run the final grep checks from Phase 6c to ensure the desired state.

## When to Rollback

- A deleted file is discovered to be still needed by a live component or page.
- `npm run lint` or `npm run build` fails after deleting a file or class.
- A removed `ig-*` class is still referenced by a history/detail/list view.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] All four voucher screens still render and function correctly
- [ ] Final grep checks from Phase 6c are re-run and pass
