## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_6_<YYYYMMDD_HHMMSS>" -Recurse
```

## Files to Restore

| File | Restore from backup if |
|------|------------------------|
| `App.tsx` | Error mapping breaks other delete flows or hides errors |
| `pages/ImportGoods.tsx` | Stats refresh causes infinite loops or delete refetch is wrong |
| `archive/migration_phase6_import_delete_messages.sql` | Backend message changes break other callers |

## Rollback Steps

1. Stop the dev server / build.
2. Restore the project folder from the backup above, or copy the individual files listed above.
3. Run `npm run lint` to confirm no syntax errors.
4. Run `npm run build` to confirm the project builds.
5. Run the manual test flow that passed before the phase started.

## When to Rollback

- `npm run lint` fails and cannot be fixed within the phase.
- `npm run build` fails after code changes.
- Delete error messages are not shown or are misleading.
- Stats cards do not update or cause infinite re-fetching.
- Delete operation appears to complete but the receipt still shows in the list.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test of delete flow pass
- [ ] Manual test of stats refresh pass
