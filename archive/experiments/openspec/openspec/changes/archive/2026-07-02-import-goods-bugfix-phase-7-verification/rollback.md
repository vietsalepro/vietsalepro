## Backup Command

Run this **before** starting the phase (or reuse the backup from Phase 6):

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_7_<YYYYMMDD_HHMMSS>" -Recurse
```

## Files to Restore

| File | Restore from backup if |
|------|------------------------|
| `AGENTS.md` | Verification results are incorrect or need to be redone |
| Entire project folder | Any critical bug is found during verification and needs rollback |

## Rollback Steps

1. Stop the dev server / build.
2. Restore the project folder from the backup of the last stable phase.
3. Run `npm run lint` to confirm no syntax errors.
4. Run `npm run build` to confirm the project builds.
5. Re-run the verification that had previously passed.

## When to Rollback

- Verification reveals a critical bug that cannot be fixed immediately.
- `AGENTS.md` is updated with incorrect results.
- Any data-loss risk is discovered during end-to-end testing.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test of the previously passing flow pass
