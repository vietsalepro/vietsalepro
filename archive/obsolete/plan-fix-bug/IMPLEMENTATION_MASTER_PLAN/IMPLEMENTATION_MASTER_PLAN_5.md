# IMPLEMENTATION_MASTER_PLAN_5.md

**Document 5 / 8 — Phase 2: Schema & Data Stability**

**VietSale Pro v7 — Admin Dashboard Enterprise Stabilization**

| Field | Value |
| --- | --- |
| **Document Position** | 5 / 8 |
| **Document Type** | Execution |
| **Phase** | Phase 2 — Schema & Data Stability |
| **Issues Covered** | HIGH-2, HIGH-1, MED-3, CRIT-4 (final resolution) |
| **Estimated Effort** | 3–5 days |
| **Priority** | P0/P1 |
| **Deployment Window** | Standard Deploy — Weekday 10:00 UTC+7 (no maintenance window required) |

---

## Document Purpose

This document covers **Phase 2: Schema & Data Stability**. It consolidates the two parallel audit log tables into one (`app_audit_log`), creates or cleans up the `import_history` table, verifies the delete-tenant edge function is stable, and records the final resolution of CRIT-4 (webhook security, delivered in Phase 1, confirmed stable here). This phase stabilizes the data structures that the Phase 3 frontend depends on.

---

## Scope

- Consolidate `audit_log` → `app_audit_log` (MED-3)
- Create `import_history` table or remove dead code references (HIGH-2)
- Verify delete-tenant edge function stability via production log analysis (HIGH-1)
- Confirm CRIT-4 final resolution (webhooks verified stable post-Phase 1)

## Covered Phases

Phase 2 — Schema & Data Stability

## Covered Issues

| Issue | Title | Severity |
| --- | --- | --- |
| HIGH-2 | Missing `import_history` table | HIGH |
| HIGH-1 | delete-tenant edge function returns 401/500 (likely fixed) | HIGH |
| MED-3 | Two audit log tables exist in parallel | MEDIUM |
| CRIT-4 | Edge function webhook security — final confirmation | CRITICAL |

## Dependencies

- **Docs 2, 3, 4 (Phase 1)** must all be complete with Phase 1 PASS outcome
- Schema must be stable (all 9 migrations deployed)
- Edge functions must be deployed with signature verification (from Doc 4)

## Prerequisites

- [ ] Phase 1 (Docs 2 + 3 + 4) Transition Checklist complete (all PASS)
- [ ] Full database backup (fresh — do not rely on Phase 1 backup)
- [ ] Access to production edge function logs (Supabase Dashboard → Edge Functions → Logs)
- [ ] Confirmed: CRIT-4 webhook verification deployed and tested (from Doc 4)

## Required Skills

- PostgreSQL triggers, DDL migrations
- Supabase Edge Function log analysis
- TypeScript (for dead-code removal in `services/supabaseService.ts`)

## Required MCP

- Supabase MCP or direct DB access for staging and production

---

## Why These Issues Belong Together

HIGH-2 and MED-3 both involve database table creation/migration of data-tracking tables. They share the same migration file and the same "data traceability" business objective. HIGH-1 verification can run concurrently since it is log-analysis only with no code changes. CRIT-4 final confirmation is a checkpoint that closes the Phase 1 security work within the context of Phase 2's stable schema.

---

## Required Files

| File | Action |
| --- | --- |
| `supabase/migrations/20260713000001_schema_stability.sql` | CREATE — consolidated schema stability migration |
| `services/supabaseService.ts` | UPDATE import_history references OR remove if feature unused |
| `supabase/functions/delete-tenant/index.ts` | VERIFY current state (already fixed in commit `f175266e`); add regression test |
| `scripts/migrate-audit-logs.ts` | CREATE — one-time data migration script |

---

## Required Database Changes

### 1. Audit Log Consolidation (MED-3)

```sql
-- Step A: Migrate unmatched entries from audit_log to app_audit_log
INSERT INTO public.app_audit_log
SELECT * FROM public.audit_log
WHERE id NOT IN (SELECT id FROM public.app_audit_log);

-- Step B: Update triggers to write to app_audit_log exclusively
-- Update: trg_audit_log_tenant_memberships
-- Update: trg_audit_log_tenant_subscriptions
-- Update: trg_audit_log_tenants
-- All must call write_audit_log() instead of audit_log_trigger() / audit_log_trigger_tenant_subscriptions()

-- Step C: Deprecate audit_log (do NOT drop yet — keep as backup for 1 month)
ALTER TABLE public.audit_log RENAME TO audit_log_deprecated;

-- Step D: Drop deprecated trigger functions AFTER verification
-- (deferred to 1 month post-migration)
```

### 2. Import History Table (HIGH-2)

**Decision tree (execute before writing migration):**

```
OPTION A — Table is needed (import feature is active):
  ├── Check if import_history is in any unapplied migration → deploy that migration
  └── If not: create new migration:
      CREATE TABLE IF NOT EXISTS public.import_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        filename TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        rows_imported INT,
        error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID
      );
      -- Add RLS:
      ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;
      -- Add tenant-scoped policies (tenant can read own import history)

OPTION B — Table references are dead code (feature not active):
  └── Remove references from services/supabaseService.ts
      and any import component that references it
```

---

## Required UI Changes

- `ImportGoods.tsx` and any import component: gracefully handle `import_history` table being unpopulated (empty history) until new imports are tracked (if Option A chosen)
- If Option B: remove UI references to import history

---

## Implementation Order

```
Step 1:  FULL DATABASE BACKUP (fresh backup)
         ├── pg_dump production database
         └── Store with timestamp label "pre-phase2"

Step 2:  DETERMINE import_history STRATEGY
         ├── Review services/supabaseService.ts for import_history references
         ├── Review ImportGoods.tsx and all import components
         ├── Query: SELECT table_name FROM information_schema.tables
         │         WHERE table_schema = 'public' AND table_name = 'import_history';
         ├── If table missing AND feature referenced in code → OPTION A
         └── If table missing AND code references are dead → OPTION B

Step 3:  CREATE import_history TABLE OR CLEAN UP DEAD REFERENCES
         ├── If OPTION A: write and apply migration (see Required Database Changes)
         ├── If OPTION B: remove references from services/supabaseService.ts
         └── Commit changes

Step 4:  CREATE scripts/migrate-audit-logs.ts
         ├── Implement: SELECT INTO app_audit_log FROM audit_log (unmatched entries)
         ├── Implement: verify row counts before and after
         └── Dry-run on staging first

Step 5:  RUN AUDIT LOG MIGRATION ON STAGING
         ├── Apply migration: 20260713000001_schema_stability.sql (triggers update + rename)
         ├── Run migrate-audit-logs.ts on staging
         ├── Verify: all 3 triggers now write to app_audit_log
         ├── Verify: audit_log renamed to audit_log_deprecated (no new writes)
         └── Run audit log export test: single query against app_audit_log returns all entries

Step 6:  RUN AUDIT LOG MIGRATION ON PRODUCTION
         ├── Apply migration to production
         ├── Run migrate-audit-logs.ts on production
         └── Verify row counts: app_audit_log row count ≥ (old audit_log + old app_audit_log)

Step 7:  VERIFY delete-tenant EDGE FUNCTION (HIGH-1)
         ├── Query production edge function logs for last 7 days
         ├── Filter: function = delete-tenant, status = 401 OR status = 500
         ├── Expected: 0 occurrences
         └── Document findings in team notes regardless of outcome

Step 8:  CONFIRM CRIT-4 FINAL RESOLUTION
         ├── Verify Momo webhook: send unsigned request → confirm 400 response
         ├── Verify VNPay webhook: send unsigned request → confirm 400 response
         ├── Check billing-webhooks edge function logs: no unsigned webhook processing
         └── Mark CRIT-4 as RESOLVED

Step 9:  RUN IMPORT FLOW INTEGRATION TEST
         ├── If import_history created (OPTION A):
         │   Trigger a test import → verify import_history row created
         └── If dead code removed (OPTION B):
             Verify no import-related crashes in console/logs

Step 10: RUN FULL REGRESSION TEST SUITE
         └── All 36 smoke tests pass
```

---

## Validation Checklist

- [ ] `import_history` table exists in production OR all dead code references removed
- [ ] Import POS/CSV operations write to `import_history` (if OPTION A chosen)
- [ ] All 3 audit triggers (`trg_audit_log_tenant_memberships`, `trg_audit_log_tenant_subscriptions`, `trg_audit_log_tenants`) write to `app_audit_log` exclusively
- [ ] `audit_log` renamed to `audit_log_deprecated` (no new writes after migration)
- [ ] `audit_log_deprecated` contains all historical rows (verify row count)
- [ ] `app_audit_log` contains full consolidated audit history (row count ≥ sum of both tables)
- [ ] Audit log export queries return from single table (`app_audit_log`)
- [ ] delete-tenant edge function logs show 0 401/500 errors in last 7 days
- [ ] delete-tenant regression test passes
- [ ] CRIT-4: Momo/VNPay/bank_transfer webhooks confirmed rejecting unsigned requests (final confirmation)
- [ ] Schema stability migration file committed

## Regression Checklist

- [ ] Existing audit log queries continue to work (adjusted to new table name)
- [ ] Tenant operations (create, update, delete) are correctly audited in `app_audit_log`
- [ ] Import operations do not crash
- [ ] All 36 smoke tests pass
- [ ] Build succeeds

---

## Rollback Plan

1. Restore `audit_log` triggers to dual-write if issues arise (revert trigger updates in migration)
2. Re-enable `audit_log` table as primary if `app_audit_log` migration fails (rename `audit_log_deprecated` back to `audit_log`)
3. Data backup (`audit_log_deprecated`) preserved for 1 month — no data loss risk
4. `import_history` creation is additive — can be dropped if issues arise; dead-code removal can be reverted via git
5. Database backup restore available if catastrophic failure
6. **Rollback Trigger**: Audit entries missing from `app_audit_log` for any tenant operation → restore triggers to dual-write
7. **Rollback Time Estimate**: 20 minutes

---

## Expected Outcome

- Single audit log table (`app_audit_log`) captures all changes
- Import history tracking restored or dead code removed cleanly
- delete-tenant confirmed stable (0 errors in 7-day log window)
- CRIT-4 fully closed and documented
- Schema ready for Phase 3 frontend hardening

---

## PASS/FAIL Criteria

| Criterion | Threshold | Weight |
| --- | --- | --- |
| Single audit table | 100% of new writes to `app_audit_log` | MUST PASS |
| import_history | Table exists OR dead code removed | MUST PASS |
| delete-tenant stable | 0 errors in 7-day window | MUST PASS |
| CRIT-4 confirmed | Unsigned webhooks rejected (Momo/VNPay/bank_transfer) | MUST PASS |
| Smoke tests | All 36 pass | MUST PASS |
| Build succeeds | Zero errors | MUST PASS |

**Phase 2 Outcome: PASS ✅ / FAIL ❌**

---

## Phase 2 Regression Tests (from Global Testing Strategy)

- [ ] Import CSV/POS → writes to `import_history` table (or doesn't crash)
- [ ] Tenant membership change → audit entry in `app_audit_log`
- [ ] Tenant subscription change → audit entry in `app_audit_log`
- [ ] Tenant metadata change → audit entry in `app_audit_log`
- [ ] Audit log export → returns all entries from single table
- [ ] delete-tenant edge function → returns 200 for valid admin request

---

## References to Previous Document

**Doc 4 / 8 — Phase 1-C: Edge Function Security & Phase 1 Closure** (`IMPLEMENTATION_MASTER_PLAN_4.md`)

Must be completed (Phase 1 PASS) before this document. Phase 2 builds on the stable, security-hardened state delivered by Phase 1.

## References to Next Document

**Doc 6 / 8 — Phase 3: Frontend Hardening** (`IMPLEMENTATION_MASTER_PLAN_6.md`)

Covers: MED-4, MED-5, MED-6, LOW-1
Execution: Admin route guard via RPC, loader cancellation, Zod validation, empty catch block fixes.
**Prerequisite**: This document (Doc 5) must be complete with PASS outcome before Doc 6 begins.

---

## Transition Checklist

Before continuing to Doc 6 / 8, the AI must verify:

- [ ] **PASS** — Phase 2 Validation Checklist complete (all items checked)
- [ ] **Validation Complete** — `app_audit_log` receiving all new writes; `import_history` resolved; delete-tenant confirmed stable; CRIT-4 closed
- [ ] **Review Complete** — Migration file committed; migrate-audit-logs.ts script committed; import_history decision documented
- [ ] **Regression Complete** — All 36 smoke tests pass; all audit operations confirmed working; build succeeds

*Doc 6 must not begin until all four items above are checked.*