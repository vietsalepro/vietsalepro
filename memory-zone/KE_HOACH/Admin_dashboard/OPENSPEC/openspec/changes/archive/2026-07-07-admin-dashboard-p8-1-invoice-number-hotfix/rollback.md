## Backup Command

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_p8_1_invoice_number_hotfix_<YYYYMMDD_HHMMSS>" -Recurse
```

## Files to Restore

- `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql`

## Rollback Steps

1. Restore the migration file from the pre-hotfix backup.
2. If the corrected migration was already deployed, re-run the restored (original) migration file on Supabase to revert the function definition — note this will reintroduce the `generate_invoice_number` bug.
3. Alternatively, if the hotfix caused new issues, run a corrected rollback script that re-creates the two functions using the original (buggy) SQL so the state matches the restored file.
4. Run `npm run lint` and `npm run build` to confirm.

## When to Rollback

- Build/test fails.
- Remote deploy fails.
- `create_invoice` or `create_renewal_invoices` still fails after the hotfix.
- Data loss or unexpected side effect discovered.

## Post-Rollback Verification

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Core flows still work (accepting the original bug will reappear).
