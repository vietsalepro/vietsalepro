## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_1_<YYYYMMDD_HHMMSS>" -Recurse
```

## Files to Restore

| File | Restore from backup if |
|------|------------------------|
| `pages/ImportGoods.tsx` | Any supplier/product/stat fetch fails, lint/build fails, or manual test fails |
| `services/supabaseService.ts` | New service functions (`getSuppliers`, `searchProducts`, `getImportStats`) cause errors |
| `components/import-goods/ImportProductSearch.tsx` | Interface change breaks other consumers |
| `components/import-goods/ImportItemsTable.tsx` | Prop change breaks other consumers |

## Rollback Steps

1. Stop the dev server / build.
2. Restore the project folder from the backup above, or copy the individual files listed above.
3. Run `npm run lint` to confirm no syntax errors.
4. Run `npm run build` to confirm the project builds.
5. Run the manual test flow that passed before the phase started.

## When to Rollback

- `npm run lint` fails and cannot be fixed within the phase.
- `npm run build` fails after code changes.
- Manual test of supplier/product selection or history stat cards fails.
- Any stale-search race condition or data-loss risk appears.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test of one affected flow pass
