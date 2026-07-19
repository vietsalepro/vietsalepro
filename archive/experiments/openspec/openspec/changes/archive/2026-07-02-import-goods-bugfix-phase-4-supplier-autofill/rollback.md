## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_4_<YYYYMMDD_HHMMSS>" -Recurse
```

## Files to Restore

| File | Restore from backup if |
|------|------------------------|
| `pages/ImportGoods.tsx` | Supplier code generation or auto-fill fails |
| `services/supabaseService.ts` | New `getSuppliers` call breaks supplier fetch |

## Rollback Steps

1. Stop the dev server / build.
2. Restore the project folder from the backup above, or copy the individual files listed above.
3. Run `npm run lint` to confirm no syntax errors.
4. Run `npm run build` to confirm the project builds.
5. Run the manual test flow that passed before the phase started.

## When to Rollback

- `npm run lint` fails and cannot be fixed within the phase.
- `npm run build` fails after code changes.
- New supplier code duplicates an existing code.
- `paidAmount` auto-fill is incorrect after adding a line discount.
- Race condition causes lost supplier data.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test of supplier creation pass
- [ ] Manual test of paid-amount auto-fill pass
