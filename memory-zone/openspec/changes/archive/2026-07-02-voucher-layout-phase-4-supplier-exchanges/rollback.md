# Rollback: Phase 4 — Refactor `SupplierExchanges`

## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase4_$(Get-Date -Format yyyyMMdd_HHmmss)" -Recurse
```

## Files to Restore

- `pages/SupplierExchanges.tsx`
- `pages/SupplierExchanges.css`

## Rollback Steps

1. Stop the dev server if running.
2. Copy the backup versions of the two files above into the project.
3. Run `npm run lint`.
4. Run `npm run build`.
5. Test the supplier exchange create flow and confirm the pre-Phase 4 behavior.

## When to Rollback

- The alert banner is misaligned or missing after moving it to the `banner` prop.
- `npm run lint` or `npm run build` fails after sidebar refactor.
- Wizard UI is broken on tablet/mobile.
- `SelectInput` or `FormTextarea` integration causes functional errors.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Supplier exchange page opens without errors
- [ ] Pre-Phase 4 layout and wizard flow work
- [ ] List view and detail view are unaffected
