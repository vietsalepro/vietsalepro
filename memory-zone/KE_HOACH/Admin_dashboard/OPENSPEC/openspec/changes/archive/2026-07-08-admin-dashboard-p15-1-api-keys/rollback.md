## Backup Command

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p15-1-api-keys_<YYYYMMDD_HHMMSS>" -Recurse
```

## Files to Restore

- All files modified in this sub-phase.
- Database migrations (if any) must be reverted manually on Supabase.

## Rollback Steps

1. Restore project folder from backup.
2. Revert any applied database migrations if safe.
3. Run `npm run lint` and `npm run build` to confirm.

## When to Rollback

- Build/test fails.
- Acceptance criteria fails.
- Data loss risk discovered.

## Post-Rollback Verification

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Core flows still work.
