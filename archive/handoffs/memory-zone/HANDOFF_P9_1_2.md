# Handoff P9.1.2 — Fix remaining P9.1.1 bugs

## Context

- **P9.1** implemented billing reminders (T-7/T-3/T-1) with RPCs, Edge Function reuse, cron job, and frontend config.
- **P9.1.1** fixed some issues:
  - Added `GRANT EXECUTE` for `get_billing_reminder_config` and `send_billing_reminders`.
  - Added mock `skipped` counter handling in `tests/mocks/supabase.ts`.
  - Added empty-milestones validation in the mock.
  - Added smoke tests for empty milestones and skipped counter.
  - Verified domain `mail.vietsalepro.com` on Resend.
  - Updated `RESEND_FROM` to `VietSales Pro <billing@mail.vietsalepro.com>`.
  - Updated `BILLING_REMINDERS_SECRET` and `billing_reminder_config` in Supabase.
  - End-to-end test succeeded: `send_billing_reminders()` sent T-7, log status changed to `sent`.

## Current Status

Local verification passes:
- `npm run lint` PASS
- `npm run build` PASS
- `npx vitest run tests/smoke/admin-dashboard-p9-1-billing-reminders.test.ts` PASS (9/9)

However, **P9.1.1 is not 100% complete**. The following bugs remain and must be fixed in **P9.1.2**.

## Bugs to fix in P9.1.2

### 1. Missing `GRANT EXECUTE` for 2 RPCs (CRITICAL)

**File:** `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`

After `REVOKE ALL ON FUNCTION ... FROM PUBLIC`, the following functions still lack `GRANT EXECUTE`:

- `public.set_billing_reminder_config(BOOLEAN, INT[], TEXT, TEXT, TEXT)`
- `public.get_pending_billing_reminders()`

The frontend Admin Dashboard uses `authenticated` role and cannot call these RPCs without explicit grants.

**Fix:** Add after each `REVOKE`:

```sql
REVOKE ALL ON FUNCTION public.set_billing_reminder_config(BOOLEAN, INT[], TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_billing_reminder_config(BOOLEAN, INT[], TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_billing_reminder_config(BOOLEAN, INT[], TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.get_pending_billing_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pending_billing_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_billing_reminders() TO service_role;
```

### 2. SQL does not reject empty milestones array (MEDIUM)

**File:** `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`

Current validation in `set_billing_reminder_config`:

```sql
IF array_length(v_milestones, 1) IS NULL OR EXISTS (SELECT 1 FROM unnest(v_milestones) x WHERE x <= 0) THEN
  RAISE EXCEPTION 'milestones phải là mảng số nguyên dương';
END IF;
```

Empty array `[]` has `array_length = 0`, so it passes. Must also reject `[]`.

**Fix:**

```sql
IF array_length(v_milestones, 1) IS NULL OR array_length(v_milestones, 1) = 0 OR EXISTS (SELECT 1 FROM unnest(v_milestones) x WHERE x <= 0) THEN
  RAISE EXCEPTION 'milestones phải là mảng số nguyên dương không rỗng';
END IF;
```

Also update the mock error message to match if desired.

### 3. TypeScript `Invoice.status` mismatch with DB schema (HIGH)

**File:** `types/billing.ts` line 30

TypeScript allows `'expired'`:

```typescript
status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue' | 'expired';
```

But the DB CHECK constraint in `supabase/migrations/20250706000007_phase_p7_1_billing_schema_bank_config.sql` only allows:

```sql
CHECK (status IN ('draft', 'pending', 'paid', 'cancelled', 'overdue'))
```

**Fix option A (recommended):** Remove `'expired'` from TypeScript:

```typescript
status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue';
```

**Fix option B:** Add `'expired'` to the DB CHECK constraint (requires a delta migration on P7.1).

### 4. OpenSpec P9.1.1/2 structure missing

**Path:** `memory-zone/KE_HOACH/Admin_dashboard/OPENSPEC/openspec/changes/admin-dashboard-p9-1-1-billing-reminders-fix/`

The OpenSpec change folder for P9.1.1 does not exist or is invalid. `openspec validate` fails with "No deltas found".

**Fix:** Either restore the P9.1.1 OpenSpec folder or create a new P9.1.2 OpenSpec change with proper delta spec files.

## Files to edit

1. `supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql`
2. `types/billing.ts` (if fixing status mismatch)
3. `memory-zone/KE_HOACH/Admin_dashboard/OPENSPEC/openspec/changes/admin-dashboard-p9-1-2-billing-reminders-fix/` (create OpenSpec change)

## Verification steps

1. Run `npm run lint` — must PASS.
2. Run `npm run build` — must PASS.
3. Run `npx vitest run` — must PASS (97/97 or current count).
4. Run `openspec validate --changes --store admin-dashboard` — must PASS.
5. Apply delta SQL to Supabase project `rsialbfjswnrkzcxarnj`.
6. End-to-end test: from authenticated frontend client, call:
   - `get_billing_reminder_config()`
   - `set_billing_reminder_config(...)`
   - `get_pending_billing_reminders()`
   - `send_billing_reminders()`
   All must succeed.

## Important production notes

- **Resend domain verified:** `mail.vietsalepro.com`
- **RESEND_FROM:** `VietSales Pro <billing@mail.vietsalepro.com>`
- **BILLING_REMINDERS_SECRET:** already set in Supabase secrets (do not change unless needed)
- **billing_reminder_config:** already set in `system_settings` with correct `function_url` and `reminder_secret`
- **Cron job:** `billing-reminders-daily` at 09:00 Asia/Ho_Chi_Minh already exists
- **Edge Function:** `send-billing-email` is ACTIVE, version 16, `verify_jwt = false`

When applying the SQL fix, only the function grants and validation need to change. No need to reconfigure secrets or domain.

## Backup

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_p9_1_1_mail_domain_setup_20260707_093000`

## Rollback

If anything fails after applying SQL, restore the previous migration file from the backup and re-apply the original P9.1 migration.
