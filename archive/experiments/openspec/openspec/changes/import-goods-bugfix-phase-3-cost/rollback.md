## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_3_<YYYYMMDD_HHMMSS>" -Recurse
```

Additionally, **create a database backup before running any migration**.

## Files to Restore

| File | Restore from backup if |
|------|------------------------|
| `archive/migration_phase3a_import_cost_ssot.sql` | Migration is wrong or needs revision |
| `services/supabaseService.ts` | Cost/discount mapping breaks |
| `types.ts` | Type changes break the build |
| `pages/ImportGoods.tsx` | Totals display is wrong |
| `components/import-goods/ImportItemRow.tsx` | Line total display is wrong |
| `components/import-goods/ImportItemsTable.tsx` | Table totals are wrong |
| Database | Migration corrupts `products.cost`, `product_lots.cost`, or stock ledger |

## Rollback Steps

1. Stop the dev server / build.
2. Restore the database from the DB backup.
3. Restore the project folder or the individual files listed above.
4. Run `npm run lint` to confirm no syntax errors.
5. Run `npm run build` to confirm the project builds.
6. Run the manual test flow that passed before the phase started.

## When to Rollback

- `npm run lint` fails and cannot be fixed within the phase.
- `npm run build` fails after code changes.
- Transaction test on `process_import_v2` or `delete_import_v2` produces incorrect cost values.
- Manual test shows inventory valuation or stock ledger is wrong.
- Any data-loss risk or unintended Supabase interaction appears.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Database values match pre-phase baseline
- [ ] Manual test of create/delete flow pass
