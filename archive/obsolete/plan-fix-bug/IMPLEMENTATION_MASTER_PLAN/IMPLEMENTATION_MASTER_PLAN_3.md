# IMPLEMENTATION_MASTER_PLAN_3.md

**Document 3 / 8 — Phase 1-B: Database Security Hardening**

**VietSale Pro v7 — Admin Dashboard Enterprise Stabilization**

| Field | Value |
| --- | --- |
| **Document Position** | 3 / 8 |
| **Document Type** | Execution |
| **Phase** | Phase 1-B (subset of Phase 1) |
| **Issues Covered** | CRIT-1, CRIT-3, HIGH-4, MED-1 |
| **Estimated Effort** | 2–3 days |
| **Priority** | P0 — Execute Immediately After Doc 2 |
| **Deployment Window** | Maintenance Window — Saturday 02:00–04:00 UTC+7 (same window as Phase 1-A) |

---

## Document Purpose

This document covers **the database security hardening portion of Phase 1**: fixing `is_system_admin()` to recognize the `postgres` role (unblocking cron jobs), revoking over-broad EXECUTE grants from `anon` and `authenticated`, and setting `search_path TO 'public'` on all 107 SECURITY DEFINER functions with a mutable search path. This is the highest-impact security change in the plan, closing the privilege escalation vulnerability and restoring daily cron operations.

---

## Scope

- Fix `is_system_admin()` to recognize `postgres` role (CRIT-1)
- REVOKE EXECUTE from `anon`/`authenticated` on admin RPCs (CRIT-3)
- REVOKE and re-GRANT EXECUTE on 137 SECURITY DEFINER functions (HIGH-4)
- SET `search_path TO 'public'` on 107 SECURITY DEFINER functions (MED-1)
- All changes delivered as a single consolidated migration file

## Covered Phases

Phase 1-B (security hardening portion of Phase 1)

## Covered Issues

| Issue | Title | Severity |
| --- | --- | --- |
| CRIT-1 | pg_cron failures due to `is_system_admin` not recognizing `postgres` | CRITICAL |
| CRIT-3 | `anon`/`authenticated` can execute sensitive RPCs | CRITICAL |
| HIGH-4 | `authenticated` granted on SECURITY DEFINER functions | HIGH |
| MED-1 | Mutable `search_path` in SECURITY DEFINER functions | MEDIUM |

## Dependencies

- **Doc 2 / 8 (Phase 1-A: Migration Sync)** must be complete with PASS outcome
- Migrations must be in sync before this security migration is applied
- Cron jobs must remain paused (paused in Doc 2, Step 2)

## Prerequisites

- [ ] Doc 2 / 8 Transition Checklist complete (PASS)
- [ ] All 9 migrations deployed; all 5 RPCs confirmed in production
- [ ] Full database backup from Doc 2, Step 1 still available (no additional backup needed unless >24h have elapsed; take fresh backup if so)
- [ ] Staging environment available
- [ ] `supabase lint` baseline captured on staging before changes

## Required Skills

- PostgreSQL SECURITY DEFINER functions and search_path semantics
- Supabase RLS and EXECUTE grant model
- `supabase lint` output parsing (`anon_security_definer_function_executable`)
- pg_cron `is_system_admin()` function internals

## Required MCP

- Supabase MCP or direct DB access (psql / service_role) for both staging and production

---

## Why These Issues Belong Together

CRIT-1, CRIT-3, HIGH-4, and MED-1 all operate on the **same set of database objects**: the 137+ SECURITY DEFINER functions. A single consolidated migration that (a) fixes `is_system_admin()`, (b) revokes grants, and (c) sets `search_path` is more efficient and less risky than three separate migrations that each modify the same functions and could conflict. All four issues share Root Cause A (Auth & Authorization Model).

---

## Required Database Changes

### 1. `is_system_admin()` Fix (CRIT-1)

Add `current_user = 'postgres'` branch so pg_cron can call it successfully.

```sql
-- Add to is_system_admin() function body:
IF current_user = 'postgres' THEN
  RETURN true;
END IF;
```

Full expected function logic after fix:
- If `current_user = 'postgres'` → return `true`
- If `current_user = 'service_role'` → return `true`
- If authenticated user exists in `system_admins` table → return `true`
- Otherwise → return `false`

### 2. REVOKE Sweep (CRIT-3 + HIGH-4)

```sql
-- REVOKE admin-only RPCs from anon AND authenticated:
REVOKE EXECUTE ON FUNCTION public.add_system_admin FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_system_admin_for_edge FROM anon, authenticated;

-- Regrant only what is legitimately needed:
GRANT EXECUTE ON FUNCTION public.add_system_admin TO service_role;
GRANT EXECUTE ON FUNCTION public.add_system_admin_for_edge TO service_role;

-- unlock_login_attempts: keep for authenticated (scoped), revoke from anon:
REVOKE EXECUTE ON FUNCTION public.unlock_login_attempts FROM anon;
-- authenticated keeps EXECUTE on unlock_login_attempts (rate-limit check added internally)

-- For all 137 SECURITY DEFINER functions:
-- REVOKE EXECUTE FROM authenticated on admin-only functions
-- GRANT EXECUTE TO authenticated only on read-only/tenant-scoped functions
-- (Full function list derived from supabase lint output)
```

### 3. search_path Fix (MED-1)

```sql
-- Apply to all 107 functions with mutable search_path:
ALTER FUNCTION public.<function_name>(...) SET search_path TO 'public';
-- (Full list derived from supabase lint output post-migration)
```

### Required Migration File

| File | Action |
| --- | --- |
| `supabase/migrations/20260713000000_security_hardening.sql` | CREATE — consolidated security migration |

This file must contain, in order:
1. `is_system_admin()` fix
2. REVOKE sweep (all admin-only functions)
3. Re-GRANT sweep (legitimate grants only)
4. `ALTER FUNCTION ... SET search_path TO 'public'` for all 107 functions

### Required RPC Changes Summary

| RPC | Change |
| --- | --- |
| `is_system_admin()` | Add `IF current_user = 'postgres' THEN RETURN true; END IF;` |
| `add_system_admin` | REVOKE from `anon`, `authenticated`; GRANT to `service_role` only |
| `add_system_admin_for_edge` | REVOKE from `anon`, `authenticated`; GRANT to `service_role` only |
| `unlock_login_attempts` | REVOKE from `anon`; keep `authenticated` + `service_role`; add rate-limit check internally |
| 107 functions (mutable search_path) | `ALTER FUNCTION ... SET search_path TO 'public'` |

---

## Implementation Order

```
Step 1:  CAPTURE BASELINE (staging)
         ├── Run: supabase lint --db-url [STAGING_DB_URL]
         ├── Record count of anon_security_definer_function_executable advisories
         └── Record count of functions with mutable search_path

Step 2:  CREATE CONSOLIDATED SECURITY MIGRATION FILE
         ├── File: supabase/migrations/20260713000000_security_hardening.sql
         ├── Section A: Fix is_system_admin() (add postgres role)
         ├── Section B: REVOKE all admin-only functions from anon, authenticated
         ├── Section C: Re-GRANT legitimate RPCs to appropriate roles
         ├── Section D: ALTER 107 functions SET search_path TO 'public'
         └── Peer-review migration file before deployment

Step 3:  DEPLOY TO STAGING
         ├── supabase db push --db-url [STAGING_DB_URL]
         ├── Run supabase lint on staging
         ├── Verify: anon_security_definer_function_executable count reduced to 0 for sensitive functions
         ├── Verify: is_system_admin() returns true for postgres role:
         │   SET ROLE postgres; SELECT public.is_system_admin();
         └── Verify: anon cannot execute add_system_admin:
             SET ROLE anon; SELECT public.add_system_admin(...); -- must throw permission denied

Step 4:  DEPLOY TO PRODUCTION
         ├── supabase db push --db-url [PRODUCTION_DB_URL]
         ├── Run same verification queries on production
         └── Run supabase lint on production; confirm advisory count reduced

Step 5:  VERIFY SECURITY HARDENING
         ├── is_system_admin() called by postgres → returns true (NEW)
         ├── is_system_admin() called by service_role → still returns true (REGRESSION CHECK)
         ├── is_system_admin() called by authenticated system admin → still returns true
         ├── is_system_admin() called by authenticated non-admin → returns false
         ├── anon calls add_system_admin → permission denied
         ├── authenticated calls add_system_admin → permission denied
         ├── service_role calls add_system_admin → succeeds
         └── authenticated calls unlock_login_attempts → succeeds

Step 6:  VERIFY SEARCH_PATH FIXES
         ├── Query: SELECT proname FROM pg_proc p
         │         JOIN pg_namespace n ON p.pronamespace = n.oid
         │         WHERE n.nspname = 'public'
         │         AND prosecdef = true
         │         AND proconfig IS NULL OR NOT 'search_path=public' = ANY(proconfig);
         └── Count must be 0 (all 107 now have search_path set)

Step 7:  COMMIT SECURITY MIGRATION FILE
         └── Commit 20260713000000_security_hardening.sql to git with peer review
```

---

## Validation Checklist

- [ ] `is_system_admin()` returns `true` when `current_user = 'postgres'`
- [ ] `is_system_admin()` still returns `true` for `service_role` (regression)
- [ ] `is_system_admin()` still returns `true` for authenticated system admins (regression)
- [ ] `anon` CANNOT execute `add_system_admin`
- [ ] `anon` CANNOT execute `add_system_admin_for_edge`
- [ ] `anon` CANNOT execute `unlock_login_attempts`
- [ ] `authenticated` CANNOT execute `add_system_admin`
- [ ] `authenticated` CANNOT execute `add_system_admin_for_edge`
- [ ] `authenticated` CAN execute `unlock_login_attempts` (scoped — regression check)
- [ ] All 107 functions have `search_path = 'public'` (query in Step 6 returns 0 rows)
- [ ] `supabase lint` shows 0 `anon_security_definer_function_executable` for sensitive functions
- [ ] Security hardening migration file committed and peer-reviewed

## Regression Checklist

- [ ] All 36 smoke tests pass
- [ ] Tenant admins can still manage their tenants
- [ ] No tenant data leakage between tenants (RLS unchanged)
- [ ] PostgREST queries from frontend continue to work
- [ ] Edge functions with `verify_jwt=false` still function correctly
- [ ] Build succeeds (`npm run build`)
- [ ] All 5 admin RPCs (from Doc 2) still callable in production

---

## Rollback Plan

1. **Database**: Restore from pg_dump backup taken in Doc 2, Step 1 (or fresh backup if taken before this step)
2. **Cron Jobs**: Remain paused — resumed in Doc 4 after cron jobs are confirmed working with fixed `is_system_admin()`
3. **Migration**: Cannot rollback Supabase migrations directly; backup restore is the recovery path
4. **Rollback Trigger**: Any privilege regression (legitimate functionality broken by REVOKE) → restore backup
5. **Rollback Time Estimate**: 30 minutes (pg_restore)

---

## Expected Outcome

- Cron jobs `data-retention-daily` and `fraud-detection-hourly` will be able to execute (after resume in Doc 4)
- `anon` and `authenticated` roles cannot execute admin-level RPCs
- All SECURITY DEFINER functions have explicit `search_path TO 'public'`
- `supabase lint` passes without critical security advisories
- Security hardening migration committed and peer-reviewed

---

## PASS/FAIL Criteria

| Criterion | Threshold | Weight |
| --- | --- | --- |
| is_system_admin() recognizes postgres | Returns true for postgres role | MUST PASS |
| Security grants correct | 0 anon-granted admin functions | MUST PASS |
| search_path fixed | 0 functions with mutable search_path remaining | MUST PASS |
| No regression on legitimate grants | service_role and tenant functions unaffected | MUST PASS |
| Smoke tests | All 36 pass | MUST PASS |
| Build succeeds | Zero errors | MUST PASS |

**Phase 1-B Outcome: PASS ✅ / FAIL ❌**

---

## References to Previous Document

**Doc 2 / 8 — Phase 1-A: Migration Sync** (`IMPLEMENTATION_MASTER_PLAN_2.md`)

Must be completed (PASS) before this document. Provides stable, fully-synced migration state that this security migration builds upon.

## References to Next Document

**Doc 4 / 8 — Phase 1-C: Edge Function Security & Phase 1 Closure** (`IMPLEMENTATION_MASTER_PLAN_4.md`)

Covers: CRIT-4 (edge function webhook signatures), cron job resume and verification, full Phase 1 PASS/FAIL assessment.
**Prerequisite**: This document (Doc 3) must be complete with PASS outcome before Doc 4 begins.

---

## Transition Checklist

Before continuing to Doc 4 / 8, the AI must verify:

- [ ] **PASS** — Phase 1-B Validation Checklist complete (all items checked)
- [ ] **Validation Complete** — `supabase lint` shows 0 sensitive `anon_security_definer_function_executable`; `is_system_admin()` returns correct values for all roles
- [ ] **Review Complete** — Security migration file committed and peer-reviewed; REVOKE list confirmed correct
- [ ] **Regression Complete** — All 36 smoke tests pass; no legitimate function broken; tenant operations unaffected

*Doc 4 must not begin until all four items above are checked.*