# IMPLEMENTATION_MASTER_PLAN.md

**VietSale Pro v7 — Admin Dashboard Enterprise Stabilization**

| Field | Value |
| --- | --- |
| **Version** | 1.0 |
| **Status** | Authorized for Execution |
| **Date** | 2026-07-13 |
| **Author** | Enterprise Software Delivery Board |
| **Source Document** | `ADMIN_DASHBOARD_REMEDIATION_ANALYSIS.md` |
| **Total Issues** | 18 (4 CRIT, 4 HIGH, 6 MED, 4 LOW) |
| **Verified Issues** | 16 fully verified, 2 partially fixed |
| **Total Phases** | 5 |
| **Estimated Total Effort** | 4–6 weeks |

---

## 1. Executive Summary

### 1.1 Situation

VietSale Pro v7 is an ERP platform serving multiple tenants on a shared Supabase backend. A comprehensive remediation audit (see `ADMIN_DASHBOARD_REMEDIATION_ANALYSIS.md`) of the admin dashboard surface identified **18 issues** spanning security, database, frontend reliability, and operations. The root causes are systemic—not isolated bugs—and trace back to **four core architectural weaknesses**:

1. **Auth & Authorization Model is Incomplete**: `is_system_admin()` does not recognize the `postgres` role used by pg_cron, EXECUTE grants to `anon`/`authenticated` are over-permissive, and admin route guards rely solely on client-side state.

2. **Migration & Schema Drift**: 9 local migrations have not been applied to production, 5 RPCs do not exist in production, duplicate migration timestamps exist, and production uses different timestamps than local for the same content.

3. **Frontend Reliability**: `useEffect` loaders lack cancellation, unsafe `as any` casts bypass type safety, empty catch blocks hide auth errors, and pagination fetches entire tables client-side.

4. **Operations & Developer Experience**: Cron jobs overlap, the two audit log tables are fragmented, `.env` points to production without a staging workflow, and edge functions lack proper webhook signature verification for Momo/VNPay.

### 1.2 Guiding Principle

> **Fix one Root Cause at a time, not one Issue at a time.**

Issues are grouped by root cause. Each phase resolves an entire root cause class. This eliminates duplicated work, reduces regression surface, and ensures each phase is independently deployable.

### 1.3 Bottom Line

- **Phase 1 (Security Lockdown + Migration Sync)** is the highest priority. It addresses 8 of 18 issues (CRIT-1, CRIT-2, CRIT-3, CRIT-4, HIGH-3, HIGH-4, MED-1, LOW-3). Deploy this first—it closes the most critical attack vectors and restores cron-based operations.
- **Phase 2 (Schema & Data Stability)** stabilizes data integrity with audit log consolidation, import_history creation, and delete-tenant verification.
- **Phase 3 (Frontend Hardening)** secures the admin route guard, adds loader cancellation, and enforces form validation.
- **Phase 4 (Reliability & Scalability)** fixes logging, pagination, cron consolidation, and staging environment.
- **Phase 5 (Continuous Compliance)** establishes CI/CD guardrails: migration checks, RPC smoke tests, security linting, and cron monitoring.

---

## 2. Project Health Overview

### 2.1 Current State Assessment

| Dimension | Status | Detail |
| --- | --- | --- |
| **Security Posture** | 🔴 Critical | `anon` can execute `add_system_admin`; 137 SECURITY DEFINER functions over-granted; webhook signature missing for Momo/VNPay |
| **Operational Integrity** | 🔴 Critical | Data retention + fraud detection cron jobs fail daily; 5 admin RPCs missing in production |
| **Schema Consistency** | 🟡 At Risk | 9 migrations not deployed; 136 vs 137 file count; duplicate timestamp `20260718000000` |
| **Frontend Reliability** | 🟡 At Risk | Race conditions on tab switches; `as any` casts; empty catch blocks; client-side only admin guard |
| **Developer Experience** | 🟡 At Risk | No staging scripts; `.env` hardcoded to production; overlapping cron jobs |
| **Test Coverage** | 🟡 At Risk | Smoke tests exist (36 files) but no RPC existence check, no migration linter in CI, no cron monitoring |

### 2.2 Overall Health Score: 42/100

**Rationale**: Two CRITICAL security vulnerabilities (privilege escalation, credential brute-force bypass) and two CRITICAL operational failures (cron jobs failing, missing RPCs) are unaddressed. The system is functional but operating in a degraded state with known attack surface.

---

## 3. Root Cause Map

### 3.1 The Four Systemic Root Causes

```
Root Cause A: Auth & Authorization Model
├── CRIT-1  (cron jobs fail — is_system_admin doesn't recognize postgres)
├── CRIT-3  (anon/authenticated can execute admin RPCs)
├── HIGH-4  (137 SECURITY DEFINER functions over-granted)
├── MED-1   (107 SECURITY DEFINER functions have mutable search_path)
└── MED-4   (admin route guard is client-side only)

Root Cause B: Migration & Schema Drift
├── CRIT-2  (5 RPCs missing in production)
├── HIGH-2  (import_history table missing)
├── HIGH-3  (9 migrations not deployed; 137 local vs 136 production)
└── LOW-3   (duplicate migration timestamp 20260718000000)

Root Cause C: Frontend Reliability
├── MED-5   (useEffect loaders lack cancellation)
├── MED-6   (unsafe as any casts; missing form validation)
├── LOW-1   (empty catch blocks hide auth errors)
└── LOW-2   (client-side pagination fetches entire tables)

Root Cause D: Operations & Developer Experience
├── CRIT-4  (edge functions missing webhook signature verification)
├── HIGH-1  (delete-tenant edge function 401/500 — likely already fixed)
├── MED-2   (cron job overlap/duplicate scheduling)
├── MED-3   (two audit log tables exist in parallel)
└── LOW-4   (.env points to production without staging process)
```

### 3.2 Root Cause → Phase Mapping

| Root Cause | Phase | Issues Resolved | Priority |
| --- | --- | --- | --- |
| A: Auth & Authorization | Phase 1, Phase 3 | CRIT-1, CRIT-3, HIGH-4, MED-1, MED-4 | P0 |
| B: Migration & Schema Drift | Phase 1, Phase 2 | CRIT-2, HIGH-2, HIGH-3, LOW-3 | P0 |
| C: Frontend Reliability | Phase 3 | MED-5, MED-6, LOW-1, LOW-2 | P1 |
| D: Operations & DevEx | Phase 2, Phase 4 | CRIT-4, HIGH-1, MED-2, MED-3, LOW-4 | P0/P1 |

---

## 4. Issue Dependency Graph

### 4.1 Blockers

```
HIGH-3 (migration drift)
└── BLOCKS ──→ CRIT-2 (missing RPCs)
└── BLOCKS ──→ HIGH-2 (missing import_history)
└── BLOCKS ──→ LOW-3  (duplicate timestamps)

CRIT-1 (is_system_admin broken for cron)
└── MUST COORDINATE WITH ──→ CRIT-3 (anon/authenticated grants)
└── MUST COORDINATE WITH ──→ HIGH-4 (all SECURITY DEFINER grants)
└── MUST COORDINATE WITH ──→ MED-1  (search_path fixes)

HIGH-4 (137 over-granted functions)
└── MUST BE FIXED WITH ──→ MED-1 (107 search_path issues)
                        (shared migration sweep over same functions)

MED-4 (client-side admin guard)
└── DEPENDS ON ──→ CRIT-3 + HIGH-4 resolution
                 (frontend guard is secondary to backend enforcement)

CRIT-4 (edge function webhook security)
└── DELIVERED IN ──→ Phase 2 (after migration sync)
                   (can be done independently but benefits from stable schema)
```

### 4.2 Parallelizable Work

- **Phase 1 Database work** + **Phase 1 Edge Function work** can run in parallel (different teams)
- **Phase 3 Frontend work** can run in parallel with **Phase 2 Schema work** (no shared state)
- **Phase 4 DevEx work** can run independently at any point

---

## 5. Phase Planning

---

## PHASE 1 — Security Lockdown & Migration Sync

### Phase Goal

**Business Goal**: Close the two most critical attack vectors (privilege escalation via `anon` EXECUTE grants, and cron-based data retention / fraud detection failure) while deploying 9 backlogged migrations to unblock missing admin features.

**Technical Goal**: 
1. Fix `is_system_admin()` to recognize `postgres` role
2. REVOKE over-broad EXECUTE grants from `anon` and `authenticated`
3. Set `search_path TO 'public'` on all 107 SECURITY DEFINER functions missing it
4. Deploy 9 missing migrations to production
5. Verify all 5 missing RPCs now exist in production
6. Add Momo/VNPay webhook signature verification

### Issues Included

| Issue | Title | Severity |
| --- | --- | --- |
| CRIT-1 | pg_cron failures due to `is_system_admin` not recognizing `postgres` | CRITICAL |
| CRIT-2 | Admin UI depends on RPCs not in production | CRITICAL |
| CRIT-3 | `anon`/`authenticated` can execute sensitive RPCs | CRITICAL |
| HIGH-3 | Migration drift between local and production | HIGH |
| HIGH-4 | `authenticated` granted on SECURITY DEFINER functions | HIGH |
| MED-1 | Mutable `search_path` in SECURITY DEFINER functions | MEDIUM |
| LOW-3 | Duplicate/non-sequential migration names | LOW |

### Why These Issues Belong Together

**Migration drift (HIGH-3) is the root blocker.** Without deploying the 9 missing migrations, CRIT-2 (missing RPCs) cannot be resolved, and LOW-3 (duplicate timestamp) remains. **CRIT-1, CRIT-3, HIGH-4, and MED-1 share the same database objects**—the 137+ SECURITY DEFINER functions. A single migration sweep addressing `is_system_admin()`, grants, and `search_path` is more efficient and less risky than separate, sequential migrations that may conflict.

### Prerequisites

- [ ] Access to Supabase production project (`rsialbfjswnrkzcxarnj`) via `service_role`
- [ ] Local migration files synced (verify git HEAD matches)
- [ ] Staging environment available for dry-run
- [ ] Full database backup (pg_dump) completed before any migration
- [ ] All running cron jobs paused during migration deployment
- [ ] Stakeholder communication sent (maintenance window announced)

### Required Files

**Code changes:**
| File | Action |
| --- | --- |
| `supabase/migrations/20260718000000_phase6_3_support_ticket_sla.sql` | Rename ONE of the two `20260718000000` files |
| `supabase/migrations/` (new file) | Create migration: `20260713000000_security_hardening.sql` — consolidated security migration |

**9 migrations to deploy to production (local → production):**
| Migration File | Description |
| --- | --- |
| `20260718000001_sp_7_1_set_tenant_subdomain.sql` | Tenant subdomain management RPC |
| `20260719000000_sp2_4_announcement_audience_active_range.sql` | Announcement audience/active range |
| `20260719000001_sp_7_2_custom_domain_verification.sql` | Custom domain verification |
| `20260720000000_sp2_6_global_config_rpc.sql` | Global config RPC |
| `20260720000001_sp_7_3_licenses.sql` | Licenses management |
| `20260721000000_sp2_7_user_management_rpc.sql` | User management RPC |
| `20260722000000_sp2_8_role_management_rpc.sql` | Role management RPC |
| `20260723000000_sp3_1_plans_crud_features.sql` | Plans CRUD and features |
| `20260728000000_sp5_6_db_maintenance.sql` | DB maintenance RPC |

### Required Database Changes

1. **`is_system_admin()` fix**: Add `current_user = 'postgres'` branch
2. **REVOKE sweep**: Revoke EXECUTE from `anon` on ALL functions; regrant only where explicitly needed
3. **REVOKE sweep**: Revoke EXECUTE from `authenticated` on admin-only functions; regrant read-only/tenant-scoped
4. **search_path fix**: `ALTER FUNCTION ... SET search_path TO 'public'` on 107 functions
5. **Migration deployment**: Apply 9 missing migrations in timestamp order
6. **Duplicate resolution**: Rename `20260718000000_sp1_6_expand_audit_log_event_types.sql` to avoid collision
7. **Resolve 9 production-only migrations**: Verify content equality with local; if equal, no action; if different, analyze and reconcile

### Required RPC Changes

| RPC | Change |
| --- | --- |
| `is_system_admin()` | Add `IF current_user = 'postgres' THEN RETURN true; END IF;` |
| `add_system_admin` | REVOKE from `anon`, `authenticated`; GRANT to `service_role` only |
| `add_system_admin_for_edge` | REVOKE from `anon`, `authenticated`; GRANT to `service_role` only |
| `unlock_login_attempts` | REVOKE from `anon`; keep `authenticated` + `service_role` + add rate-limit check internally |
| 107 functions (mutable search_path) | `ALTER FUNCTION ... SET search_path TO 'public'` |

### Required Edge Function Changes

| Function | Change |
| --- | --- |
| `billing-webhooks` | Add HMAC-SHA-256 signature verification for Momo, VNPay, bank_transfer providers; add replay protection (timestamp + nonce) |
| `cron-admin-tasks` | Verify rotation of `X-Internal-Secret`; ensure secret is in Supabase secrets, not hardcoded |
| `send-billing-email` | Verify `X-Internal-Secret` rotation status |
| `send-ticket-email` | Verify service role key usage; no changes needed if compliant |
| `send-template-email` | Verify service role key usage; no changes needed if compliant |
| `admin-health-check` | Option: wrap with IP allowlist OR accept current risk with secret rotation |
| `webhook-delivery` | Verify `X-Internal-Secret` rotation |

### Required UI Changes

None for Phase 1. UI fixes are deferred to Phase 3.

### Implementation Order

```
Step 1:  FULL DATABASE BACKUP
         ├── pg_dump production database
         ├── Verify backup integrity
         └── Store backup in secure location

Step 2:  PAUSE CRON JOBS
         ├── SELECT cron.unschedule(1);  -- data-retention-daily
         └── SELECT cron.unschedule(13); -- fraud-detection-hourly

Step 3:  RESOLVE MIGRATION TIMESTAMP DUPLICATE
         ├── Rename one 20260718000000 file to 20260718000000_phase6_3_support_ticket_sla.sql
         └── Rename other to 20260718000000_sp1_6_expand_audit_log_event_types.sql → 
             rename to 20260718000002_sp1_6_expand_audit_log_event_types.sql
             (NOTE: verify no conflict with 20260718000001)

Step 4:  DEPLOY SECURITY HARDENING MIGRATION
         ├── Create consolidated migration file
         ├── Fix is_system_admin() (add postgres role)
         ├── REVOKE EXECUTE FROM anon on ALL functions
         ├── REVOKE EXECUTE FROM authenticated on admin functions
         ├── GRANT EXECUTE TO authenticated on read-only/tenant-scoped functions
         ├── ALTER 107 functions SET search_path TO 'public'
         ├── Deploy to staging first, verify with supabase lint
         └── Deploy to production

Step 5:  DEPLOY 9 MISSING MIGRATIONS (in order)
         ├── Deploy to staging
         ├── Run RPC smoke test: verify all 5 previously-missing RPCs exist
         ├── Deploy to production
         └── Run RPC smoke test again in production

Step 6:  VERIFY & RESUME CRON JOBS
         ├── SELECT cron.schedule('data-retention-daily', '0 3 * * *', 'SELECT public.run_data_retention();');
         ├── SELECT cron.schedule('fraud-detection-hourly', '0 * * * *', 'SELECT public.run_fraud_detection();');
         ├── Manually trigger both jobs: SELECT cron.perform_job(jobname);
         └── Verify job_run_details show success

Step 7:  DEPLOY EDGE FUNCTION UPDATES
         ├── Update billing-webhooks with Momo/VNPay/bank_transfer signature verification
         ├── Rotate X-Internal-Secret for all 7 functions using it
         ├── Deploy to production
         └── Test webhook endpoints

Step 8:  VERIFY ALL RPCs EXIST IN PRODUCTION
         ├── Query information_schema.routines for all RPC names in services/
         ├── Confirm admin_update_subscription, get_member_with_email, get_storage_usage,
         │   search_members_by_email, set_tenant_subdomain all exist
         └── Run frontend smoke test for each admin feature using those RPCs
```

### Validation Checklist

- [ ] `is_system_admin()` returns `true` when `current_user = 'postgres'`
- [ ] `cron.job_run_details` shows SUCCESS for `data-retention-daily` and `fraud-detection-hourly`
- [ ] `anon` CANNOT execute `add_system_admin`, `add_system_admin_for_edge`, `unlock_login_attempts`
- [ ] `authenticated` CANNOT execute `add_system_admin`, `add_system_admin_for_edge`
- [ ] `authenticated` CAN execute `unlock_login_attempts` (scoped)
- [ ] All 107 functions have `search_path = 'public'`
- [ ] `supabase lint` shows 0 `anon_security_definer_function_executable` for sensitive functions
- [ ] All 9 missing migrations applied in production
- [ ] `information_schema.routines` confirms all 5 previously-missing RPCs exist
- [ ] Frontend admin features using those RPCs work (manual smoke test)
- [ ] Momo webhook requires valid HMAC-SHA-256 signature
- [ ] VNPay webhook requires valid HMAC-SHA-256 signature
- [ ] bank_transfer webhook requires valid HMAC-SHA-256 signature
- [ ] Existing Stripe webhook verification continues to work

### Regression Checklist

- [ ] All 36 smoke tests pass
- [ ] `is_system_admin()` still works for `service_role` and authenticated system admins
- [ ] Tenant admins can still manage their tenants
- [ ] Edge functions with `verify_jwt=false` still function correctly
- [ ] No tenant data leakage between tenants (RLS unchanged)
- [ ] PostgREST queries from frontend continue to work
- [ ] Build succeeds (`npm run build`)

### Rollback Plan

1. **Database**: Restore from pg_dump backup taken before Step 4
2. **Edge Functions**: Redeploy previous versions from git tag/commit
3. **Cron Jobs**: Re-pause if rollback is needed; re-apply fixed schedule after re-deploy
4. **Migrations**: Cannot rollback Supabase migrations directly; restore from backup if needed
5. **Rollback Trigger**: Any CRITICAL issue discovered after deployment → immediate restore
6. **Rollback Time Estimate**: 30 minutes (pg_restore + edge function redeploy)

### Expected Outcome

- Cron jobs `data-retention-daily` and `fraud-detection-hourly` execute successfully
- `anon` and `authenticated` roles cannot execute admin-level RPCs
- All SECURITY DEFINER functions have explicit `search_path TO 'public'`
- All 9 migrated features available in admin dashboard
- 5 previously-missing RPCs functioning in production
- Momo/VNPay/bank_transfer webhooks require cryptographic signature verification
- `supabase lint` passes without critical advisories

### Definition of Done

- [ ] All Validation Checklist items pass
- [ ] All Regression Checklist items pass
- [ ] Cron jobs show SUCCESS in `cron.job_run_details` for 3 consecutive runs
- [ ] Security hardening migration file committed and peer-reviewed
- [ ] `supabase lint` run included in CI/CD pipeline (Phase 5 will formalize)
- [ ] Edge function changes committed with review
- [ ] RPC smoke test script executed successfully

### Deployment Strategy

**Staged rollout**: Staging → Smoke test → Production (during maintenance window)

1. All changes deployed to staging first
2. Full smoke test suite + manual verification on staging
3. Production deployed during announced maintenance window (2-hour window)
4. Monitor `cron.job_run_details`, error rates, and admin dashboard for 24 hours post-deploy

### PASS/FAIL Criteria

| Criterion | Threshold | Weight |
| --- | --- | --- |
| Cron jobs successful | 3 consecutive successes within 6 hours | MUST PASS |
| Security grants correct | 0 anon-granted admin functions | MUST PASS |
| All 9 migrations applied | 9/9 applied in production | MUST PASS |
| All 5 RPCs exist | 5/5 in information_schema.routines | MUST PASS |
| Webhook signatures | Reject unsigned Momo/VNPay/bank_transfer requests | MUST PASS |
| Smoke tests | All 36 pass | MUST PASS |
| Build succeeds | Zero errors | MUST PASS |

**Phase 1 Outcome: PASS ✅ / FAIL ❌**

---

## PHASE 2 — Schema & Data Stability

### Phase Goal

**Business Goal**: Ensure data traceability for admin operations by consolidating the dual audit log system, restoring import history tracking, and verifying the delete-tenant edge function reliability.

**Technical Goal**:
1. Consolidate `audit_log` → `app_audit_log`
2. Create `import_history` table or remove dead references
3. Verify delete-tenant edge function via production log analysis
4. Verify all triggers write to the correct audit table

### Issues Included

| Issue | Title | Severity |
| --- | --- | --- |
| HIGH-2 | Missing `import_history` table | HIGH |
| HIGH-1 | delete-tenant edge function returns 401/500 (likely fixed) | HIGH |
| MED-3 | Two audit log tables exist in parallel | MEDIUM |
| CRIT-4 | Remaining edge function hardening (Phase 1 carry-over) | CRITICAL |

### Why These Issues Belong Together

HIGH-2 and MED-3 both involve database table creation/migration of audit-related tables. HIGH-1 verification can run concurrently since it's log-analysis only. This phase stabilizes data structures before the frontend hardening in Phase 3—the frontend depends on stable, consistent audit and import schemas.

### Prerequisites

- [ ] Phase 1 completed and verified
- [ ] Full database backup
- [ ] Access to production edge function logs

### Required Files

| File | Action |
| --- | --- |
| `supabase/migrations/` (new) | `20260713000001_schema_stability.sql` — consolidated schema stability migration |
| `services/supabaseService.ts` | Update import_history references OR remove if feature unused |
| `supabase/functions/delete-tenant/index.ts` | Verify current state (already fixed in commit `f175266e`) |
| `scripts/` (new) | `scripts/migrate-audit-logs.ts` — one-time data migration script |

### Required Database Changes

1. **Audit log consolidation**:
   - SELECT INTO `app_audit_log` FROM `audit_log` (all unmatched entries)
   - UPDATE triggers `trg_audit_log_tenant_memberships`, `trg_audit_log_tenant_subscriptions`, `trg_audit_log_tenants` to call `write_audit_log()` instead of `audit_log_trigger()`/`audit_log_trigger_tenant_subscriptions()`
   - DROP/RENAME `audit_log` → `audit_log_deprecated` (keep as backup for 1 month)
   - DROP deprecated trigger functions after verification

2. **Import history table**:
   - Check if `import_history` exists in any unapplied migration
   - If yes: deploy that migration
   - If no: create new migration with `import_history( id UUID, tenant_id UUID, filename TEXT, status TEXT, rows_imported INT, error TEXT, created_at TIMESTAMPTZ, created_by UUID )` + RLS + tenant-scoped policies
   - OR: if feature is unused, remove references from `services/supabaseService.ts`

3. **Verify delete-tenant**: Query edge function logs for last 7 days; confirm 0 occurrences of 401/500

### Required RPC Changes

None (Phase 1 handled RPC changes).

### Required Edge Function Changes

- `delete-tenant`: Verify via logs; add regression test. No code changes expected.

### Required UI Changes

- `ImportGoods.tsx` and any import component: gracefully handle `import_history` table being unpopulated (empty history) until new imports are tracked.

### Implementation Order

```
Step 1:  FULL DATABASE BACKUP
Step 2:  CREATE import_history TABLE (or clean up dead references)
Step 3:  MIGRATE audit_log → app_audit_log
Step 4:  UPDATE triggers to write to app_audit_log exclusively
Step 5:  VERIFY delete-tenant edge function via production logs
Step 6:  RUN import flow integration test
Step 7:  RUN audit log export test (single table)
```

### Validation Checklist

- [ ] `import_history` table exists in production OR all code references removed
- [ ] Import POS/CSV operations write to `import_history` (if created)
- [ ] All audit triggers write to `app_audit_log` exclusively
- [ ] `audit_log` deprecated table exists as backup (no new writes)
- [ ] Audit log export queries return from single table
- [ ] delete-tenant edge function logs show 0 401/500 errors in last 7 days
- [ ] delete-tenant regression test passes

### Regression Checklist

- [ ] Existing audit log queries continue to work (adjust to new table name if needed)
- [ ] Tenant operations (create, update, delete) are correctly audited
- [ ] Import operations do not crash
- [ ] All 36 smoke tests pass

### Rollback Plan

1. Restore `audit_log` triggers to dual-write if issues arise
2. Re-enable `audit_log` table as primary if `app_audit_log` migration fails
3. Database backup restore available

### Expected Outcome

- Single audit log table (`app_audit_log`) captures all changes
- Import history tracking restored or dead code removed
- delete-tenant confirmed stable

### Definition of Done

- [ ] Single audit log table confirmed operational for 48 hours
- [ ] Import history tracking verified OR code cleaned
- [ ] delete-tenant log analysis completed with findings documented
- [ ] Regression tests pass

### Deployment Strategy

Standard deploy (no maintenance window required for non-security changes). Deploy migration, verify triggers, run audit-migration script.

### PASS/FAIL Criteria

| Criterion | Threshold | Weight |
| --- | --- | --- |
| Single audit table | 100% of new writes to app_audit_log | MUST PASS |
| import_history | Table exists OR dead code removed | MUST PASS |
| delete-tenant stable | 0 errors in 7-day window | MUST PASS |
| Smoke tests | All 36 pass | MUST PASS |

**Phase 2 Outcome: PASS ✅ / FAIL ❌**

---

## PHASE 3 — Frontend Hardening

### Phase Goal

**Business Goal**: Harden the admin dashboard against unauthorized access by replacing client-side-only admin checks with server-side RPC verification, eliminate race conditions and memory leaks from unmanaged async loaders, and enforce input validation on sensitive admin forms.

**Technical Goal**:
1. Replace client-side `system_admins` table query with `lib/permissions.ts:isSystemAdmin()` RPC call
2. Add cancellation flags / AbortController to all admin page `useEffect` loaders
3. Add Zod schema validation to company info and bank account forms
4. Replace `as any` casts with typed Supabase responses
5. Replace empty catch blocks with proper error logging

### Issues Included

| Issue | Title | Severity |
| --- | --- | --- |
| MED-4 | Client-side admin checks rely only on RLS/local state | MEDIUM |
| MED-5 | Admin dashboard loaders lack cancellation/race protection | MEDIUM |
| MED-6 | Unsafe `as any` casts and missing validation on sensitive forms | MEDIUM |
| LOW-1 | Empty catch blocks hide auth errors | LOW |

### Why These Issues Belong Together

All four issues share the same affected layer (frontend React components) and the same code patterns. MED-4, MED-5, and LOW-1 all touch `App.tsx`, `AuthContext.tsx`, and admin pages. MED-6 touches the same service files that feed the admin dashboard. Fixing them together avoids repeated re-deployment of the same components and ensures consistent patterns are applied.

### Prerequisites

- [ ] Phase 1 completed (backend security grants fixed — MED-4 depends on this)
- [ ] Phase 2 completed (schema stable, no import_history crashes to distract)

### Required Files

| File | Action | Issue |
| --- | --- | --- |
| `App.tsx` (lines 194–224, 1338–1347) | Replace direct `system_admins` query with `isSystemAdmin()` RPC; add `<RequireSystemAdmin>` guard | MED-4 |
| `pages/admin/AdminLayout.tsx` (lines 71–89) | Add system admin role check before rendering `<Outlet />` | MED-4 |
| `pages/admin/AdminDashboardInner.tsx` (lines 162–269, 370–393) | Add `AbortController` / `cancelled` flag to all `useEffect` loaders | MED-5 |
| `pages/admin/Security.tsx` (lines 34–70) | Add `AbortController` / `cancelled` flag | MED-5 |
| `pages/admin/Billing.tsx` (lines 127–160, 215–294) | Add Zod schema for company info and bank account forms | MED-6 |
| `services/admin/memberAdminService.ts` (line 232) | Replace `as any[]` with typed response | MED-6 |
| `services/admin/complianceAdminService.ts` (lines 39–45, 85) | Replace `as any` with typed response | MED-6 |
| `contexts/AuthContext.tsx` (lines 35, 48, 83, 89, 92, 107–109) | Replace empty catch blocks with `console.error` / toast | LOW-1 |
| `components/admin/` (various) | Create `RequireSystemAdmin` guard component | MED-4 |

### Required Database Changes

None.

### Required RPC Changes

None (Phase 1 completed RPC changes).

### Required Edge Function Changes

None.

### Required UI Changes

1. **`<RequireSystemAdmin>` component**: Wrap admin routes; calls `isSystemAdmin()` RPC; renders children if admin, redirects to forbidden page if not
2. **Admin layout**: Replace passive `<Outlet />` with gated render
3. **All admin pages**: Use `AbortController` pattern:
   ```typescript
   useEffect(() => {
     const controller = new AbortController();
     // pass controller.signal to all fetch calls
     return () => controller.abort();
   }, []);
   ```
4. **Sensitive forms**: Add Zod schemas for company info, bank account info, and any other admin forms submitting directly to RPC
5. **Error boundaries**: Ensure all empty catch blocks surface errors to console + optional toast

### Implementation Order

```
Step 1:  CREATE <RequireSystemAdmin> GUARD COMPONENT
Step 2:  UPDATE App.tsx TO USE isSystemAdmin() RPC
Step 3:  UPDATE AdminLayout.tsx WITH ROLE CHECK
Step 4:  ADD AbortController TO AdminDashboardInner.tsx
Step 5:  ADD AbortController TO Security.tsx
Step 6:  ADD AbortController TO REMAINING ADMIN PAGES
Step 7:  ADD ZOD VALIDATION TO Billing.tsx FORMS
Step 8:  REPLACE as any CASTS IN memberAdminService.ts, complianceAdminService.ts
Step 9:  REPLACE EMPTY CATCH BLOCKS IN AuthContext.tsx
Step 10: RUN FULL FRONTEND SMOKE TEST
```

### Validation Checklist

- [ ] `App.tsx` uses `isSystemAdmin()` RPC instead of direct `system_admins` query
- [ ] Non-admin user accessing `/admin/*` is redirected to forbidden page before admin content renders
- [ ] Admin dashboard loads correctly for system admin users
- [ ] Tab switching in admin dashboard does not produce stale data (race condition fixed)
- [ ] No "Can't perform a React state update on an unmounted component" warnings
- [ ] Company info form validates input before submission
- [ ] Bank account form validates input before submission
- [ ] No `as any` casts remain in member admin or compliance admin services
- [ ] All auth errors appear in console (no silent failures)
- [ ] Auth errors surface via toast notification to user

### Regression Checklist

- [ ] Non-admin users cannot access admin routes
- [ ] Admin users retain all existing functionality
- [ ] All 36 smoke tests pass
- [ ] Build succeeds
- [ ] No new TypeScript errors
- [ ] Fast tab switching does not crash admin dashboard

### Rollback Plan

1. Revert `App.tsx` to use direct `system_admins` query (if RPC call fails)
2. Remove `AbortController` from individual pages (if race condition pattern incompatible)
3. Zod schemas are additive—can be removed without breaking forms
4. Auth error logging is additive—no functional impact

### Expected Outcome

- Admin dashboard routes protected by server-side RPC verification
- No race conditions when switching admin tabs
- Admin forms validated before submission
- Auth errors visible in console and Sentry
- Clean TypeScript types (no `as any` escapes)

### Definition of Done

- [ ] `<RequireSystemAdmin>` renders in admin route tree
- [ ] Non-admin user cannot access any admin page via URL manipulation
- [ ] 0 "unmounted component" warnings in console during admin navigation
- [ ] All Zod schemas pass validation tests
- [ ] 0 `as any` casts in services/admin/ (verified by grep)
- [ ] Empty catch blocks replaced with error logging (verified by grep)

### Deployment Strategy

Standard frontend deploy via Vercel. No database changes required. Can be deployed during business hours—admin dashboard is used by system admins only (limited user set).

### PASS/FAIL Criteria

| Criterion | Threshold | Weight |
| --- | --- | --- |
| Admin guard uses RPC | `is_system_admin` RPC called in App.tsx | MUST PASS |
| Non-admin blocked | 100% redirect to forbidden | MUST PASS |
| No unmounted setState | 0 warnings in 5-minute manual test | MUST PASS |
| Zod validation active | Form rejects invalid data | MUST PASS |
| No as any casts | 0 in services/admin/ | MUST PASS |
| Error logging | All catch blocks log error | MUST PASS |
| Smoke tests | All 36 pass | MUST PASS |

**Phase 3 Outcome: PASS ✅ / FAIL ❌**

---

## PHASE 4 — Reliability & Scalability

### Phase Goal

**Business Goal**: Reduce server load and improve admin UX by implementing server-side pagination, eliminate redundant cron jobs, establish a staging workflow, and fix client-side data fetching patterns.

**Technical Goal**:
1. Replace `getAll*` functions with server-side paginated queries
2. Consolidate duplicate billing cron jobs
3. Add `dev:staging`, `build:staging`, `preview:staging` scripts
4. Create `.env.example` with Supabase variables
5. Document staging workflow in README

### Issues Included

| Issue | Title | Severity |
| --- | --- | --- |
| MED-2 | Cron jobs overlap / duplicate scheduling | MEDIUM |
| LOW-2 | Client-side pagination fetches large pages | LOW |
| LOW-4 | `.env` points to production without documented staging process | LOW |

### Why These Issues Belong Together

All three are operational and scalability improvements. MED-2 and LOW-2 both address wasteful resource usage (duplicate cron work + unnecessary full-table scans). LOW-4 addresses the developer workflow that led to migration drift in the first place. These are lower-priority but important for long-term maintainability.

### Prerequisites

- [ ] Phases 1–3 completed and stable
- [ ] Established production monitoring baseline

### Required Files

| File | Action | Issue |
| --- | --- | --- |
| `services/invoiceService.ts` (lines 123–142) | Add pagination params; return `{items, totalCount, page, pageSize}` | LOW-2 |
| `services/bankAccountService.ts` (lines 27–31) | Add pagination params | LOW-2 |
| `services/tenantService.ts` (lines 886–892) | Add pagination params to `getStorageUsage` | LOW-2 |
| `services/admin/tenantAdminService.ts` (lines 43–60) | Add pagination params to `getTenantsAdmin` | LOW-2 |
| `components/PaymentManager.tsx` (lines 54–70) | Use paginated hook | LOW-2 |
| `components/InvoiceManager.tsx` (lines 100–109) | Use paginated hook | LOW-2 |
| `components/InvoiceCreator.tsx` (line 29) | Replace `limit: 1000` with paginated | LOW-2 |
| `pages/admin/Security.tsx` (line 36) | Replace `pageSize: 1000` with paginated `listAccounts` | LOW-2 |
| `supabase/migrations/` (new) | `20260713000002_cron_consolidation.sql` — drop duplicate cron jobs | MED-2 |
| `package.json` | Add `dev:staging`, `build:staging`, `preview:staging` scripts | LOW-4 |
| `.env.example` | Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` with placeholder values | LOW-4 |
| `README.md` | Add "Switching Environments" section | LOW-4 |

### Required Database Changes

1. **Cron consolidation**:
   - DROP `renewal-invoice-daily` (jobid TBD) — duplicate of `billing-renewal-daily`
   - DROP `admin-billing-reminders` (jobid TBD) — duplicate of `billing-reminders-daily`
   - Verify `create_renewal_invoices()` handles both `p_days_before DEFAULT 7` (was in `billing-renewal-daily`) and explicit `7` (was in `renewal-invoice-daily`)
   - Add `cron_job_logs` table for monitoring overlap:
     ```sql
     CREATE TABLE IF NOT EXISTS public.cron_job_logs (
       id BIGSERIAL PRIMARY KEY,
       job_name TEXT NOT NULL,
       started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       finished_at TIMESTAMPTZ,
       status TEXT NOT NULL DEFAULT 'running',
       error TEXT,
       advisory_lock_acquired BOOLEAN DEFAULT false
     );
     ```

### Required RPC Changes

None.

### Required Edge Function Changes

None.

### Required UI Changes

- All admin list views: add pagination controls (prev/next, page size selector)
- Use existing `useAdminList` hook for consistent pagination pattern

### Implementation Order

```
Step 1:  CONSOLIDATE CRON JOBS
         ├── Verify no business logic gap between billing-renewal-daily and renewal-invoice-daily
         ├── Drop duplicate jobs
         ├── Create cron_job_logs table
         └── Add logging to remaining jobs

Step 2:  IMPLEMENT SERVER-SIDE PAGINATION
         ├── Update getAllInvoices → getInvoicesPaginated(page, pageSize)
         ├── Update getAllPayments → getPaymentsPaginated(page, pageSize)
         ├── Update getTenantsAdmin → add page/pageSize params
         ├── Update getAllBankAccounts → getBankAccountsPaginated(page, pageSize)
         ├── Update UI components to use paginated hooks
         └── Add pagination controls to admin list views

Step 3:  SET UP STAGING WORKFLOW
         ├── Add scripts to package.json
         ├── Create .env.example
         ├── Update README.md with staging section
         └── Test: npm run dev:staging → verify staging Supabase project used
```

### Validation Checklist

- [ ] Only one billing renewal cron job exists
- [ ] Only one billing reminder cron job exists
- [ ] `cron_job_logs` table populated on each cron execution
- [ ] `create_renewal_invoices()` still generates correct invoices
- [ ] Invoice list loads first page (e.g., 20 items) instead of all invoices
- [ ] Payments list loads first page (e.g., 20 items) instead of all payments
- [ ] Tenant admin list supports prev/next pagination
- [ ] `npm run dev:staging` uses staging Supabase project
- [ ] `npm run build:staging` builds for staging
- [ ] `.env.example` contains all required variables with placeholders
- [ ] README has staging/deployment documentation

### Regression Checklist

- [ ] Cron jobs still execute billing logic correctly
- [ ] Invoice creation, payment confirmation still work
- [ ] Admin lists display correctly with pagination
- [ ] No full-table loads without limit (verified by DB query log)
- [ ] Build succeeds for both `dev` and `dev:staging`

### Rollback Plan

1. Re-enable duplicate cron jobs if business logic divergence found
2. Revert pagination changes by reinstating `getAll*` functions
3. Staging scripts are additive—no rollback needed, just don't use them

### Expected Outcome

- Reduced database load from paginated queries
- Single cron job per billing function (easier to monitor, less wasted compute)
- Clear staging workflow documented for all developers
- No full-table scans without explicit limits

### Definition of Done

- [ ] No duplicate cron jobs (verified via `SELECT * FROM cron.job`)
- [ ] All `getAll*` functions replaced with paginated versions
- [ ] `npm run dev:staging` works end-to-end
- [ ] README contains staging section
- [ ] `.env.example` committed and reviewed

### Deployment Strategy

Standard deploy. Cron changes deployed during low-traffic window. Pagination deployed as feature update.

### PASS/FAIL Criteria

| Criterion | Threshold | Weight |
| --- | --- | --- |
| No duplicate cron jobs | 0 duplicate-purpose jobs | MUST PASS |
| Paginated queries | 0 unbounded SELECT * without limit | MUST PASS |
| Staging scripts work | `npm run dev:staging` points to staging | MUST PASS |
| README updated | Staging section present | MUST PASS |
| Smoke tests | All 36 pass | MUST PASS |

**Phase 4 Outcome: PASS ✅ / FAIL ❌**

---

## PHASE 5 — Continuous Compliance (Ongoing)

### Phase Goal

**Business Goal**: Prevent regression of fixed issues by embedding compliance checks into the CI/CD pipeline. Ensure every future deployment is verified against the security, schema, and RPC baseline established in Phases 1–4.

**Technical Goal**:
1. CI/CD migration check: block merge if local migrations not applied on staging or duplicate timestamps exist
2. DB security lint: run `supabase lint` in CI; fail on new `anon_security_definer_function_executable`
3. RPC smoke test: verify all frontend-referenced RPCs exist in production
4. Cron monitoring: alert on `cron.job_run_details.status = 'failed'`
5. Penetration testing: manual verification of critical attack vectors

### Issues Included

| Issue | Title | Long-term Concern |
| --- | --- | --- |
| HIGH-3 | Migration drift | Prevent recurrence of drift |
| CRIT-2 | Missing RPCs in production | Catch before deployment |
| CRIT-3 | Over-granted RPCs | Prevent new over-grants |
| CRIT-4 | Edge function security | Ongoing webhook verification |
| MED-1 | Mutable search_path | Prevent new functions without search_path |
| CRIT-1 | Cron failures | Alert on failure |

### Implementation Order

```
Step 1:  CI/CD MIGRATION CHECK
         ├── GitHub Action: on PR to main
         ├── Compare local migrations with staging applied migrations
         ├── Fail if: local has unapplied migrations
         ├── Fail if: duplicate timestamps in local
         └── Warn if: local and production timestamps differ for same content

Step 2:  DB SECURITY LINT IN CI
         ├── Run supabase lint on staging after each migration deploy
         ├── Parse output for anon_security_definer_function_executable
         ├── Fail if: count increased from baseline
         ├── Block merge if: new security advisories introduced
         └── Baseline: post-Phase 1 count (should be significantly lower)

Step 3:  RPC SMOKE TEST
         ├── Script: extract all supabase.rpc('...') calls from services/
         ├── Script: query information_schema.routines for each RPC name
         ├── Script: report missing RPCs
         ├── Run in CI on every PR
         └── Fail if: any RPC in code does not exist in staging (after migration deploy)

Step 4:  CRON MONITORING
         ├── Query: SELECT * FROM cron.job_run_details WHERE status = 'failed' AND run_time > now() - interval '1 hour'
         ├── Alert: Send to admin Slack/email if failures detected
         ├── Dashboard: Add cron health to SystemHealthPanel component
         └── Run: every 15 minutes via edge function or external monitor

Step 5:  PENETRATION TESTING (manual, quarterly)
         ├── Test 1: Call add_system_admin with anon JWT → must fail
         ├── Test 2: Call unlock_login_attempts with anon JWT → must fail
         ├── Test 3: Send unsigned Momo/VNPay webhook → must fail
         ├── Test 4: Attempt admin route access without system_admin role → must redirect
         ├── Test 5: Cross-tenant data access via modified RLS → must return empty
         └── Document results; create tickets for any findings
```

### Validation Checklist

- [ ] CI fails when local has unapplied migrations
- [ ] CI fails when duplicate timestamps detected
- [ ] CI fails when new anon-granted SECURITY DEFINER functions introduced
- [ ] RPC smoke test passes on all PRs
- [ ] Cron failure alert fires within 15 minutes of job failure
- [ ] Quarterly penetration test completed and documented

### Expected Outcome

- Zero migration drift going forward
- Zero missing RPCs in production
- Zero new security advisories
- Immediate alert on cron failure
- Documented penetration test baseline

### Definition of Done

- [ ] All 5 CI/CD checks active and verified
- [ ] First penetration test completed with no CRITICAL findings
- [ ] Cron monitoring active for 1 week without false positives
- [ ] CI pipeline documented in README

### PASS/FAIL Criteria

| Criterion | Threshold | Weight |
| --- | --- | --- |
| Migration check in CI | Blocks merge on drift | MUST PASS |
| Security lint in CI | Blocks merge on new advisories | MUST PASS |
| RPC smoke test in CI | Catches missing RPCs before merge | MUST PASS |
| Cron alerting | Alerts within 15 min of failure | MUST PASS |
| Pen test | Clean quarterly report | MUST PASS |

**Phase 5 Outcome: PASS ✅ / FAIL ❌**

---

## 6. Risk Matrix

### 6.1 Technical Risk Assessment

| Risk | Likelihood | Impact | Phase | Mitigation |
| --- | --- | --- | --- | --- |
| Migration deployment fails in production | Medium | High | Phase 1 | Full backup + staging dry-run first |
| REVOKE breaks legitimate functionality | Medium | High | Phase 1 | Staged rollout; regrant list pre-audited |
| `is_system_admin()` change opens attack surface | Low | Critical | Phase 1 | Only `postgres` role added; no other changes |
| Cron job consolidation removes needed job | Low | Medium | Phase 4 | Verify business logic before dropping |
| Client-side guard broken by RPC failure | Low | Medium | Phase 3 | Fail-closed pattern in `isSystemAdmin()` |
| Audit log migration loses data | Low | High | Phase 2 | Keep deprecated table as backup; verify row counts |
| Pagination breaks admin list views | Medium | Low | Phase 4 | Component-by-component deployment |

### 6.2 Business Risk Assessment

| Risk | Likelihood | Impact | Phase | Mitigation |
| --- | --- | --- | --- | --- |
| Security vulnerability exploited before fix | Medium | Critical | Phase 1 | Deploy within 1 week of plan approval |
| Admin dashboard downtime during migration | Low | Medium | Phase 1 | Maintenance window; admin-only feature |
| Tenant billing interrupted by cron changes | Low | High | Phase 4 | Verify advisory locks prevent duplicate invoices |
| Data retention/fraud detection continues to fail | Already in progress | High | Phase 1 | Immediate priority; cron jobs not running for days |

### 6.3 Rollback Complexity

| Phase | Rollback Complexity | Rollback Time | Data Loss Risk |
| --- | --- | --- | --- |
| Phase 1 | High | 30 min | Low (backup available) |
| Phase 2 | Medium | 20 min | Low (deprecated table kept) |
| Phase 3 | Low | 10 min | None (frontend only) |
| Phase 4 | Medium | 15 min | Low (cron changes reversible) |
| Phase 5 | Low | 5 min | None (CI config only) |

---

## 7. Testing Strategy

### 7.1 TDD Approach: "Define What Should Be Tested Before Every Fix"

For every issue, define:

| Test Layer | What to Test | When to Run |
| --- | --- | --- |
| **Unit** | Individual function behavior (e.g., `isSystemAdmin()` returns correct boolean for each role) | On every commit |
| **Integration** | RPC existence + correct behavior (e.g., `add_system_admin` rejects `anon`) | On every PR |
| **Smoke** | End-to-end admin flows (e.g., admin can manage tenants, subscriptions, members) | Pre-deploy + post-deploy |
| **Security** | Penetration vectors (e.g., anon cannot escalate privilege) | Quarterly |
| **Performance** | Query response times (e.g., paginated queries return < 200ms) | Pre-Phase 4 baseline + post-Phase 4 |

### 7.2 Regression Scenarios (Phase-specific)

**Phase 1 Regression Tests:**
- [ ] `is_system_admin()` called by `service_role` → returns `true`
- [ ] `is_system_admin()` called by authenticated system admin → returns `true`
- [ ] `is_system_admin()` called by `postgres` → returns `true` (NEW)
- [ ] `is_system_admin()` called by authenticated non-admin → returns `false`
- [ ] `anon` calls `add_system_admin` → permission denied
- [ ] `authenticated` calls `add_system_admin` → permission denied
- [ ] `service_role` calls `add_system_admin` → succeeds
- [ ] `authenticated` calls `unlock_login_attempts` → succeeds
- [ ] Cron job `data-retention-daily` → succeeds
- [ ] Cron job `fraud-detection-hourly` → succeeds
- [ ] `admin_update_subscription` → exists and callable
- [ ] `get_member_with_email` → exists and callable
- [ ] `get_storage_usage` → exists and callable
- [ ] `search_members_by_email` → exists and callable
- [ ] `set_tenant_subdomain` → exists and callable

**Phase 2 Regression Tests:**
- [ ] Import CSV/POS → writes to `import_history` table (or doesn't crash)
- [ ] Tenant membership change → audit entry in `app_audit_log`
- [ ] Tenant subscription change → audit entry in `app_audit_log`
- [ ] Tenant metadata change → audit entry in `app_audit_log`
- [ ] Audit log export → returns all entries from single table
- [ ] delete-tenant edge function → returns 200 for valid admin request

**Phase 3 Regression Tests:**
- [ ] Non-admin accessing `/admin/tenants` → redirected to forbidden
- [ ] Admin accessing `/admin/tenants` → page renders
- [ ] Fast tab switching (overview → tenants → billing → security) → no stale data
- [ ] Company info form with valid data → submits successfully
- [ ] Company info form with missing required field → validation error shown
- [ ] Bank account form with valid data → submits successfully
- [ ] Auth error during session init → error logged to console
- [ ] MFA check failure → error surfaced (not silently swallowed)

**Phase 4 Regression Tests:**
- [ ] Invoice list → loads page 1 only (20 items)
- [ ] Invoice list "Next" → loads page 2
- [ ] Tenant admin list → paginated (not all tenants)
- [ ] `billing-renewal-daily` cron → creates renewal invoices (only job remaining)
- [ ] `billing-reminders-daily` cron → sends reminders (only job remaining)
- [ ] `npm run dev:staging` → connects to staging Supabase project

### 7.3 Edge Cases

| Edge Case | Issue | Test |
| --- | --- | --- |
| `current_user` is neither `service_role`, `postgres`, nor authenticated | CRIT-1 | Returns `false` without error |
| `anon` JWT with modified claims trying to access admin RPC | CRIT-3 | Rejected by RLS + grant |
| Multiple cron jobs executing simultaneously | MED-2 | Advisory lock prevents duplicate processing |
| Very large dataset (10K+ records) | LOW-2 | Paginated query returns within 200ms for first page |
| Network failure during RPC call | MED-4 | `isSystemAdmin()` returns `false` (fail-closed) |
| Component unmount during data load | MED-5 | No setState on unmounted component error |
| Malformed Momo webhook payload | CRIT-4 | Rejected with 400, logged for review |
| Replay of Momo webhook after 5 minutes | CRIT-4 | Rejected (timestamp outside window) |

---

## 8. Deployment Strategy

### 8.1 Environment Pipeline

```
Developer Local → Staging (shbmzvfcenbybvyzclem) → Production (rsialbfjswnrkzcxarnj)
```

### 8.2 Deployment Windows

| Phase | Window Type | Duration | Day/Time |
| --- | --- | --- | --- |
| Phase 1 | Maintenance Window | 2 hours | Saturday 02:00–04:00 UTC+7 |
| Phase 2 | Standard Deploy | 30 min | Weekday 10:00 UTC+7 |
| Phase 3 | Standard Deploy | 30 min | Any time (frontend only) |
| Phase 4 | Standard Deploy | 30 min | Weekday 10:00 UTC+7 |
| Phase 5 | CI Config Only | 15 min | Any time |

### 8.3 Pre-Deployment Checklist (every phase)

- [ ] Full production database backup completed and verified
- [ ] All tests pass on staging
- [ ] `supabase lint` results reviewed
- [ ] Smoke test suite passes on staging
- [ ] Rollback plan reviewed and tested
- [ ] Stakeholder notification sent (for maintenance windows)
- [ ] Monitoring dashboards confirmed operational
- [ ] Team on standby for 2 hours post-deploy

### 8.4 Post-Deployment Verification (every phase)

- [ ] All smoke tests pass on production
- [ ] Cron jobs show SUCCESS in `cron.job_run_details` (if applicable)
- [ ] Admin dashboard loads and functions correctly
- [ ] No spike in error rates (monitor for 1 hour)
- [ ] No increase in 4xx/5xx responses
- [ ] Database CPU/memory within normal range
- [ ] Edge function invocation rates normal

---

## 9. Rollback Strategy

### 9.1 General Principles

1. **Database changes cannot be cleanly rolled back.** Mitigation: always take full backup before any migration.
2. **Edge function changes can be rolled back** by redeploying previous version from git.
3. **Frontend changes can be rolled back** by reverting Vercel deployment.
4. **Cron job changes can be rolled back** by re-scheduling dropped jobs.

### 9.2 Phase-Specific Rollback Procedures

**Phase 1 Rollback:**
```
1. Restore production database from backup (pg_restore)
2. Redeploy edge functions from commit before Phase 1
3. Re-schedule original cron jobs (schedule statements from pre-fix state)
4. Verify cron jobs running, RPCs unchanged, edge functions responding
5. Estimated time: 30 minutes
```

**Phase 2 Rollback:**
```
1. Restore audit_log triggers to dual-write (revert trigger updates)
2. Keep app_audit_log as-is (no data loss)
3. If import_history was created: DROP table (was empty)
4. Estimated time: 20 minutes
```

**Phase 3 Rollback:**
```
1. Revert Vercel deployment to previous production deployment
2. No database changes to revert
3. Estimated time: 5 minutes
```

**Phase 4 Rollback:**
```
1. Re-schedule dropped cron jobs
2. Revert paginated services to getAll* versions (previous git commit)
3. Redeploy frontend
4. Estimated time: 15 minutes
```

**Phase 5 Rollback:**
```
1. Disable new CI checks
2. Revert CI configuration
3. Estimated time: 5 minutes
```

### 9.3 Rollback Decision Criteria

Trigger immediate rollback if:
- Error rate spikes > 5x baseline within 15 minutes of deploy
- Critical functionality broken (tenant creation, billing, login)
- Database integrity issue detected (row count mismatch, constraint violation)
- Security regression (previously-fixed vulnerability reintroduced)

Do NOT rollback for:
- Minor UI glitches (fix forward)
- Non-blocking performance regression < 20%
- New but non-critical warnings in logs

---

## 10. Definition of Done (Global)

### 10.1 Per-Phase DoD

Each phase must satisfy its individual PASS/FAIL criteria (defined in Section 5).

### 10.2 Global DoD

All 18 issues are resolved when:

- [ ] `CRIT-1`: Cron jobs succeed for 3 consecutive runs over 24 hours
- [ ] `CRIT-2`: All 5 RPCs exist in production and function correctly
- [ ] `CRIT-3`: `anon`/`authenticated` cannot execute admin RPCs (verified by pen test)
- [ ] `CRIT-4`: Momo/VNPay/bank_transfer webhooks rejected without valid signature
- [ ] `HIGH-1`: delete-tenant edge function confirmed stable (0 errors in 7 days)
- [ ] `HIGH-2`: `import_history` table created or dead code removed
- [ ] `HIGH-3`: 0 unapplied migrations; production and local in sync
- [ ] `HIGH-4`: 137 functions audited; grants restricted to minimum necessary
- [ ] `MED-1`: 107 functions have `SET search_path TO 'public'`
- [ ] `MED-2`: No duplicate cron jobs; single job per function
- [ ] `MED-3`: Single audit log table; all triggers write to `app_audit_log`
- [ ] `MED-4`: Admin route guard uses server-side RPC verification
- [ ] `MED-5`: All admin page `useEffect` loaders have cancellation
- [ ] `MED-6`: No `as any` in services/admin/; Zod validation on sensitive forms
- [ ] `LOW-1`: Empty catch blocks replaced with error logging
- [ ] `LOW-2`: All admin list queries use server-side pagination
- [ ] `LOW-3`: No duplicate migration timestamps
- [ ] `LOW-4`: Staging scripts exist; `.env.example` complete; README updated

### 10.3 Operational Acceptance Criteria

- [ ] All 5 CI/CD checks active and passing (Phase 5)
- [ ] Cron monitoring alert tested (trigger + notification received)
- [ ] First quarterly penetration test completed
- [ ] All 36 smoke tests passing
- [ ] Build pipeline passing
- [ ] 0 new `supabase lint` security advisories

---

## 11. Implementation Order

### 11.1 Sequential Phase Dependency

```
Phase 1 (Security + Migration)
  │
  ├── Phase 2 (Schema Stability)
  │     │
  │     └── Phase 3 (Frontend Hardening)
  │           │
  │           └── Phase 4 (Reliability)
  │                 │
  │                 └── Phase 5 (Continuous Compliance)
  │
  └── (Phase 5 CI/CD checks can begin in parallel after Phase 1)
```

### 11.2 Timeline

| Week | Phase | Key Deliverables |
| --- | --- | --- |
| **Week 1** | Phase 1 | Security hardening migration, migration sync, edge function webhook fix |
| **Week 2** | Phase 2 | Audit log consolidation, import_history, delete-tenant verification |
| **Week 3** | Phase 3 | Admin route guard, loader cancellation, Zod validation, catch fix |
| **Week 4** | Phase 4 | Cron consolidation, server-side pagination, staging workflow |
| **Week 5–6** | Phase 5 | CI/CD checks, penetration test, monitoring |

### 11.3 Parallel Work Opportunities

| Team | Week 1 | Week 2 | Week 3 | Week 4 |
| --- | --- | --- | --- | --- |
| **Backend/DB** | Phase 1 (security migration, migration sync) | Phase 2 (audit log, import_history) | — | Phase 4 (cron consolidation) |
| **Edge/Functions** | Phase 1 (webhook sigs) | Phase 2 (delete-tenant verify) | — | — |
| **Frontend** | — | — | Phase 3 (all frontend hardening) | Phase 4 (pagination UI) |
| **DevOps** | — | — | — | Phase 4 (staging scripts) |
| **QA** | Phase 1 testing | Phase 2 testing | Phase 3 testing | Phase 4 testing, Phase 5 setup |

---

## 12. Success Criteria

### 12.1 Technical Success Criteria

| # | Criterion | How Measured |
| --- | --- | --- |
| SC-1 | All CRITICAL and HIGH issues resolved | 8/8 issues with verified fixes |
| SC-2 | All MEDIUM and LOW issues resolved | 10/10 issues with verified fixes |
| SC-3 | `supabase lint` passes without new advisories | 0 new `anon_security_definer_function_executable` |
| SC-4 | All 5 RPCs exist in production | `information_schema.routines` query |
| SC-5 | 0 unapplied migrations | Production migration count = local migration count |
| SC-6 | Cron jobs succeeding | 24-hour monitoring of `cron.job_run_details` |
| SC-7 | Admin dashboard loads without race conditions | 0 "unmounted component" warnings in 30-min test |
| SC-8 | Webhook signatures enforced | Momo/VNPay unsigned requests rejected |
| SC-9 | CI/CD pipeline catches regressions | 5 automated checks active |
| SC-10 | All smoke tests pass | 36/36 passing |

### 12.2 Business Success Criteria

| # | Criterion | How Measured |
| --- | --- | --- |
| BC-1 | No privilege escalation possible | Penetration test confirms `anon` cannot execute admin RPCs |
| BC-2 | Data retention policy enforced | Cron job `data-retention-daily` succeeds daily for 7 consecutive days |
| BC-3 | Fraud detection operational | Cron job `fraud-detection-hourly` succeeds hourly for 24 consecutive hours |
| BC-4 | Admin features functional | All 5 previously-missing RPCs working in admin dashboard |
| BC-5 | Audit trail complete | All admin operations logged to single audit table |
| BC-6 | Developer onboarding clear | New developer can set up staging environment from README in < 15 minutes |

### 12.3 Exit Criteria

The Implementation Master Plan is complete when:
1. All 5 phases have PASS outcomes
2. All 18 issues are resolved and verified
3. All 10 Technical Success Criteria are met
4. All 6 Business Success Criteria are met
5. Phase 5 CI/CD checks are live and blocking regressions
6. First quarterly penetration test report is clean

---

## Appendix A: File Manifest

### A.1 Files Modified (by Phase)

**Phase 1:**
| File | Action |
| --- | --- |
| `supabase/migrations/` (new migration file) | CREATE |
| `supabase/migrations/20260718000000_sp1_6_expand_audit_log_event_types.sql` | RENAME |
| `supabase/functions/billing-webhooks/index.ts` | UPDATE |
| `supabase/functions/cron-admin-tasks/index.ts` | VERIFY |
| `supabase/functions/send-billing-email/index.ts` | VERIFY |
| `supabase/functions/send-ticket-email/index.ts` | VERIFY |
| `supabase/functions/send-template-email/index.ts` | VERIFY |
| `supabase/functions/admin-health-check/index.ts` | VERIFY |
| `supabase/functions/webhook-delivery/index.ts` | VERIFY |

**Phase 2:**
| File | Action |
| --- | --- |
| `supabase/migrations/` (new migration file) | CREATE |
| `services/supabaseService.ts` | UPDATE (import_history) |
| `supabase/functions/delete-tenant/index.ts` | VERIFY |

**Phase 3:**
| File | Action |
| --- | --- |
| `App.tsx` | UPDATE |
| `pages/admin/AdminLayout.tsx` | UPDATE |
| `pages/admin/AdminDashboardInner.tsx` | UPDATE |
| `pages/admin/Security.tsx` | UPDATE |
| `pages/admin/Billing.tsx` | UPDATE |
| `services/admin/memberAdminService.ts` | UPDATE |
| `services/admin/complianceAdminService.ts` | UPDATE |
| `contexts/AuthContext.tsx` | UPDATE |
| `components/admin/RequireSystemAdmin.tsx` | CREATE |

**Phase 4:**
| File | Action |
| --- | --- |
| `services/invoiceService.ts` | UPDATE |
| `services/bankAccountService.ts` | UPDATE |
| `services/tenantService.ts` | UPDATE |
| `services/admin/tenantAdminService.ts` | UPDATE |
| `components/PaymentManager.tsx` | UPDATE |
| `components/InvoiceManager.tsx` | UPDATE |
| `components/InvoiceCreator.tsx` | UPDATE |
| `pages/admin/Security.tsx` | UPDATE |
| `supabase/migrations/` (new migration file) | CREATE |
| `package.json` | UPDATE |
| `.env.example` | UPDATE |
| `README.md` | UPDATE |

**Phase 5:**
| File | Action |
| --- | --- |
| `.github/workflows/` (new workflow file) | CREATE |
| `scripts/audit-rpc-contracts.ts` | VERIFY/UPDATE |
| `scripts/cron-monitor.ts` | CREATE |

### A.2 Database Objects Affected

| Object | Phase 1 | Phase 2 | Phase 4 |
| --- | --- | --- | --- |
| `public.is_system_admin()` | UPDATE | — | — |
| `public.add_system_admin` | REVOKE + GRANT | — | — |
| `public.add_system_admin_for_edge` | REVOKE + GRANT | — | — |
| `public.unlock_login_attempts` | REVOKE + GRANT | — | — |
| 107 functions (mutable search_path) | ALTER | — | — |
| 137 functions (over-granted) | REVOKE + GRANT | — | — |
| `public.app_audit_log` | — | DATA MIGRATION | — |
| `public.audit_log` | — | DEPRECATE | — |
| `public.import_history` | — | CREATE/VERIFY | — |
| `cron.job` entries | — | — | DROP 2 |
| `public.cron_job_logs` | — | — | CREATE |

---

## Appendix B: Reference Documents

| Document | Path | Purpose |
| --- | --- | --- |
| Remediation Analysis | `Plan-Fix-Bug/ADMIN_DASHBOARD_REMEDIATION_ANALYSIS.md` | Single Source of Truth |
| Audit Report | `AUDIT_REPORT.md` | Original 18-issue audit |
| RPC Contracts | `docs/admin-dashboard/RPC_CONTRACTS.md` | Expected RPC signatures |
| System Admin Feature Plan | `PLAN_CREATE_SYSTEM_ADMIN.md` | System admin architecture |
| Security Fix Plan | `FIX_PLAN_USER_MANAGEMENT_SECURITY.md` | Related security plan |
| Deployment Guide | `DEPLOYMENT_SYSTEM_ADMIN_FEATURE.md` | Deployment procedures |
| Test Guide | `tests/integration/INTEGRATION_TEST_GUIDE.md` | Integration test patterns |

---

## Appendix C: Stakeholder Sign-off

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| Principal Software Architect | | | |
| Principal Full Stack Engineer | | | |
| Senior Supabase Architect | | | |
| Senior PostgreSQL Database Architect | | | |
| Senior DevOps Engineer | | | |
| Senior QA Automation Engineer | | | |
| Senior Security Engineer | | | |
| Principal Code Auditor | | | |
| Enterprise Technical Project Manager | | | |

---

*Generated by Enterprise Software Delivery Board — 13 Jul 2026*
*No implementation shall begin before this document is approved.*
*All future implementation work must strictly follow this plan.*
*No implementation is allowed outside this plan.*