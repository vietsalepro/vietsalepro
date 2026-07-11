## Backup Command

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_3_1_$timestamp" -Recurse -Force
```

## Files to Restore

- See proposal.md What Changes for the list of affected files.
- Database: restore from the pre-phase SQL dump if schema was modified.

## Rollback Steps

1. Stop the build/deploy process.
2. Restore the project folder from the backup.
3. Revert the SQL changes from the database dump.
4. Run `npm run lint` and `npm run build` to confirm rollback.

## When to Rollback

- `npm run lint` or `npm run build` fails and cannot be fixed.
- Manual acceptance criteria fails.
- Any data loss risk is identified.

## Post-Rollback Verification

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Existing data is still accessible
