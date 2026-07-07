## Review Checklist: P9.1.1 Billing Reminders Bugfix

### Code Review

- [x] Migration delta SQL correctly adds `GRANT EXECUTE` for all 4 P9.1 RPCs.
- [x] No duplicate or conflicting grants.
- [x] Empty milestones validation rejects `[]` and negative values.
- [x] Mock `send_billing_reminders` increments `skipped` on failure.
- [x] `Invoice.status` `'expired'` already valid in DB (P7.3 migration); no code change needed.

### Security Review

- [x] Grants are minimal (only `authenticated` / `service_role` as needed).
- [x] No sensitive values (secrets, service role keys) exposed in code.
- [x] `SECURITY DEFINER` functions still restricted appropriately.

### Test Review

- [x] New tests cover the fixed bugs.
- [x] All existing tests pass (99/99).
- [x] No flaky tests introduced.

### Deployment Review

- [x] Delta SQL reviewed for safe re-application.
- [x] No destructive operations (drop table, etc.).
- [x] Backup created before deploy.
