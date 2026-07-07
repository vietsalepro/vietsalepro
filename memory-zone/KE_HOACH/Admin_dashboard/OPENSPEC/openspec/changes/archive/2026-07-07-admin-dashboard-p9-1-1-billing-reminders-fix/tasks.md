## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_p9-1-1-billing-reminders-fix_20260707_083721`
- [x] 0.2 Confirm `npm run lint` passes (baseline)
- [x] 0.3 Review audit findings from P9.1

## 1. Critical Bug: RPC EXECUTE Grants

- [x] 1.1 Add `GRANT EXECUTE` for `get_billing_reminder_config()` to `authenticated` (and `service_role` if needed)
- [x] 1.2 Add `GRANT EXECUTE` for `set_billing_reminder_config(...)` to `authenticated`
- [x] 1.3 Add `GRANT EXECUTE` for `get_pending_billing_reminders()` to `authenticated`
- [x] 1.4 Add `GRANT EXECUTE` for `send_billing_reminders()` to `authenticated`
- [x] 1.5 Verify no other P9.1 functions lack grants
- [x] 1.6 Add delta SQL comment explaining why grants are needed

## 2. Medium Bug: Milestones Validation

- [x] 2.1 Update `set_billing_reminder_config` to reject empty array `[]`
- [x] 2.2 Add smoke test for empty milestones rejection
- [x] 2.3 Verify existing tests still pass

## 3. Medium Bug: Mock Accuracy

- [x] 3.1 Update `send_billing_reminders` mock to increment `skipped` on failure path
- [x] 3.2 Add a test case that exercises `skipped > 0` (optional: simulate HTTP failure flag)
- [x] 3.3 Verify `sendBillingReminders` returns correct `skipped` value

## 4. High Bug: Invoice Status Mismatch (Optional)

- [x] 4.1 Decide fix strategy: P7.3 migration `20250706000009_phase_p7_3_payment_confirm_lifecycle.sql` already added `'expired'` to the DB CHECK constraint; no mismatch exists.
- [x] 4.2 No code change needed.
- [x] 4.3 No test changes needed.

## 5. Verification

- [x] 5.1 Run `npm run lint`
- [x] 5.2 Run `npm run build`
- [x] 5.3 Run `npx vitest run` (99/99)
- [x] 5.4 Deploy delta SQL to Supabase project `rsialbfjswnrkzcxarnj`
- [x] 5.5 End-to-end test: `get_billing_reminder_config` / `set_billing_reminder_config` callable via `authenticated` role (verified via `has_function_privilege` and direct function calls)
- [x] 5.6 End-to-end test: `send_billing_reminders` callable and scheduler job `billing-reminders-daily` still active

## Acceptance Criteria

- [x] All 4 P9.1 RPCs callable by `authenticated` role via Supabase Data API.
- [x] `set_billing_reminder_config` rejects empty milestones array.
- [x] `send_billing_reminders` mock reports `skipped` correctly.
- [x] `npm run lint` pass.
- [x] `npm run build` pass.
- [x] `npx vitest run` pass (99/99, exceeds 97/97 target).
- [x] Delta SQL applied successfully on Supabase.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_p9-1-1-billing-reminders-fix_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
- Rollback steps: see `rollback.md`.
