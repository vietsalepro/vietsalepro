# Rollback: Phase 7 — Verification

## Backup Command

A backup is not strictly required for Phase 7 because no code is modified. However, a pre-verification backup can be useful if issues are found:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase7_$(Get-Date -Format yyyyMMdd_HHmmss)" -Recurse
```

## Files to Restore

None for Phase 7 itself. If a regression is found, restore files from the backup of the phase that introduced the regression.

## Rollback Steps

1. Identify which phase introduced the regression.
2. Restore the affected files from that phase's backup.
3. Fix the issue in the appropriate phase.
4. Return to Phase 7 and re-run the verification steps.

## When to Rollback

- Not applicable for Phase 7 itself. Rollback is triggered by regressions discovered during verification, which should be handled by restoring the relevant phase's backup.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Re-run the failed verification step(s) and confirm they pass
