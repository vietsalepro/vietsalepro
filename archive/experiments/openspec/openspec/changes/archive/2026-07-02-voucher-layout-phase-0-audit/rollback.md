## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_phase0_$(Get-Date -Format yyyyMMdd_HHmmss)" -Recurse
```

## Files to Restore

No files to restore in Phase 0 because no code is modified.

## Rollback Steps

Not applicable. If the audit document is wrong, simply update `BASELINE_AUDIT.md` and continue.

## When to Rollback

- Not applicable for this documentation-only phase.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
