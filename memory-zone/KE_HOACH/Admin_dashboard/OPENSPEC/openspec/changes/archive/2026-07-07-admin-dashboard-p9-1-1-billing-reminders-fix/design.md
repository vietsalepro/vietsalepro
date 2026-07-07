## Technical Design: P9.1.1 Billing Reminders Bugfix

### 1. RPC EXECUTE Grants

**Problem:** `REVOKE ALL ON FUNCTION ... FROM PUBLIC` in P9.1 migration removes the default PUBLIC EXECUTE grant. Without explicit `GRANT EXECUTE`, the `authenticated` role used by the frontend Supabase client cannot call the RPCs.

**Fix:** Add explicit grants after each `REVOKE`:

```sql
REVOKE ALL ON FUNCTION public.get_billing_reminder_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_billing_reminder_config() TO authenticated;

REVOKE ALL ON FUNCTION public.set_billing_reminder_config(BOOLEAN, INT[], TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_billing_reminder_config(BOOLEAN, INT[], TEXT, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.get_pending_billing_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pending_billing_reminders() TO authenticated;

REVOKE ALL ON FUNCTION public.send_billing_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_billing_reminders() TO authenticated;
```

**Note:** `service_role` can also be granted for consistency, but the frontend uses `authenticated`.

### 2. Empty Milestones Validation

**Problem:** `array_length(v_milestones, 1) IS NULL` does not catch empty array `[]`.

**Fix:** Add `OR array_length(v_milestones, 1) = 0`:

```sql
IF array_length(v_milestones, 1) IS NULL OR array_length(v_milestones, 1) = 0 OR EXISTS (SELECT 1 FROM unnest(v_milestones) x WHERE x <= 0) THEN
  RAISE EXCEPTION 'milestones phải là mảng số nguyên dương không rỗng';
END IF;
```

### 3. Mock Accuracy for `skipped`

**Problem:** `tests/mocks/supabase.ts` mock `send_billing_reminders` always returns `skipped: 0`.

**Fix:** Wrap the log insertion in a `try/catch` and increment `skipped` on failure:

```typescript
for (const invoice of pending) {
  try {
    store.invoice_reminder_logs.push({ ... });
    sent += 1;
  } catch {
    skipped += 1;
  }
}
```

Optionally add a test flag to simulate HTTP failures.

### 4. Invoice Status Mismatch

**Problem:** TypeScript allows `'expired'`, DB does not.

**Options:**
- Option A: Add `'expired'` to DB CHECK constraint in P7.1 migration (or a new delta migration). This aligns DB with code.
- Option B: Remove `'expired'` from `types/billing.ts`. This is safer if the app never actually uses `expired` status.

**Recommendation:** Option B unless business logic explicitly requires `expired` invoices. P7.5 cron uses `overdue`/`expired` logic; verify whether `expired` is a real status or just an in-memory concept.

### Files Affected

- `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`
- `tests/mocks/supabase.ts`
- `tests/smoke/admin-dashboard-p9-1-billing-reminders.test.ts`
- `types/billing.ts` (optional)

### Deployment

1. Apply delta SQL to Supabase project.
2. Run local verification.
3. End-to-end test authenticated RPC calls.
