## Handoff: P9.1.1 Billing Reminders Bugfix

### Status

- [ ] In progress
- [x] Ready for review
- [ ] Reviewed
- [x] Merged / Deployed

### What Was Done

- Fixed P9.1 bugs identified in post-deploy audit:
  - Added `GRANT EXECUTE` on all 4 P9.1 RPCs for `authenticated` (+ `service_role` for consistency).
  - Updated `set_billing_reminder_config` to reject empty milestones array `[]`.
  - Fixed mock `send_billing_reminders` to increment `skipped` on failure.
  - Verified `Invoice.status` `'expired'` is already valid in DB (P7.3 migration); no type change needed.

### Verification

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] `npx vitest run` pass (99/99)
- [x] Delta SQL applied to Supabase project `rsialbfjswnrkzcxarnj`
- [x] Authenticated RPC grants verified (`has_function_privilege` all `true`)
- [x] `send_billing_reminders` scheduler job `billing-reminders-daily` still active

### Notes

- See `tasks.md` for detailed acceptance criteria.
- Backup location: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_p9-1-1-billing-reminders-fix_20260707_083721`
