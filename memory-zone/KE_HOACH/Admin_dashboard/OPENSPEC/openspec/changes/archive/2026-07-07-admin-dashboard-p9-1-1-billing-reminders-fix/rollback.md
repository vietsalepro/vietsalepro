## Rollback Plan: P9.1.1 Billing Reminders Bugfix

### Rollback Trigger

- Build/test fails after applying fixes.
- Acceptance criteria fails.
- Data loss or unexpected behavior in production.

### Rollback Steps

1. Restore code files from backup:
   - `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`
   - `tests/mocks/supabase.ts`
   - `tests/smoke/admin-dashboard-p9-1-billing-reminders.test.ts`
   - `types/billing.ts` (if modified)

2. Re-run `npm run lint`, `npm run build`, `npx vitest run` to confirm baseline.

3. On Supabase, if the new grants cause issues, re-run the previous P9.1 migration state (restore from backup or manually revoke the new grants if needed).

### Backup

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_p9-1-1-billing-reminders-fix_<YYYYMMDD_HHMMSS>`
