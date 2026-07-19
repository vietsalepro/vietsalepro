# IMPLEMENTATION_MASTER_PLAN_2.md

**Document 2 / 8 — Phase 1-A: Migration Sync**

**VietSale Pro v7 — Admin Dashboard Enterprise Stabilization**

| Field | Value |
| --- | --- |
| **Document Position** | 2 / 8 |
| **Document Type** | Execution |
| **Phase** | Phase 1-A (subset of Phase 1) |
| **Issues Covered** | HIGH-3, CRIT-2, LOW-3 |
| **Estimated Effort** | 1–2 days |
| **Priority** | P0 — Execute Immediately |
| **Deployment Window** | Maintenance Window — Saturday 02:00–04:00 UTC+7 |

---

## Document Purpose

This document covers **the migration sync portion of Phase 1**: resolving the duplicate migration timestamp, deploying 9 missing local migrations to production, and verifying that all 5 previously-missing admin RPCs now exist in production. This is the **prerequisite blocker** for Doc 3 / 8 (database security hardening) because the security hardening migration must be applied to a schema-stable database.

---

## Scope

- Rename one duplicate `20260718000000` migration file (LOW-3)
- Deploy 9 migrations from local to production (HIGH-3)
- Verify 5 missing RPCs now exist in production (CRIT-2)

## Covered Phases

Phase 1-A (migration sync portion of Phase 1)

## Covered Issues

| Issue | Title | Severity |
| --- | --- | --- |
| HIGH-3 | Migration drift between local and production | HIGH |
| CRIT-2 | Admin UI depends on RPCs not in production | CRITICAL |
| LOW-3 | Duplicate/non-sequential migration names | LOW |

## Dependencies

- **Doc 1 / 8** must be read and understood before executing this document
- **No other execution documents** are required before this one

## Prerequisites

- [ ] Doc 1 / 8 read and Transition Checklist complete
- [ ] Access to Supabase production project (`rsialbfjswnrkzcxarnj`) via `service_role`
- [ ] Local migration files synced (verify git HEAD matches)
- [ ] Staging environment (`shbmzvfcenbybvyzclem`) available for dry-run
- [ ] Full database backup (pg_dump) completed and verified before any migration
- [ ] All running cron jobs paused during migration deployment
- [ ] Stakeholder communication sent (maintenance window announced)

## Required Skills

- Supabase CLI (`supabase db push`, `supabase migration list`)
- PostgreSQL `information_schema.routines` queries
- Git for migration file renaming and commit

## Required MCP

- Supabase MCP or direct Supabase CLI access to both staging and production projects

---

## Why These Issues Belong Together

**Migration drift (HIGH-3) is the root blocker for the entire plan.** Without deploying the 9 missing migrations, CRIT-2 (missing RPCs) cannot be resolved, and LOW-3 (duplicate timestamp) remains unresolvable. These three issues all operate on the same artifact—the `supabase/migrations/` directory and the production `supabase_migrations.schema_migrations` table. A single focused pass resolves all three.

---

## Required Files

### Code Changes

| File | Action |
| --- | --- |
| `supabase/migrations/20260718000000_sp1_6_expand_audit_log_event_types.sql` | RENAME to `20260718000002_sp1_6_expand_audit_log_event_types.sql` (resolve duplicate timestamp) |

### 9 Migrations to Deploy to Production (local → production)

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

---

## Implementation Order

```
Step 1:  FULL DATABASE BACKUP
         ├── pg_dump production database (rsialbfjswnrkzcxarnj)
         ├── Verify backup integrity (pg_restore dry-run or size check)
         └── Store backup in secure location with timestamp

Step 2:  PAUSE CRON JOBS
         ├── SELECT cron.unschedule(1);  -- data-retention-daily
         └── SELECT cron.unschedule(13); -- fraud-detection-hourly

Step 3:  RESOLVE MIGRATION TIMESTAMP DUPLICATE (LOW-3)
         ├── Rename: 20260718000000_sp1_6_expand_audit_log_event_types.sql
         │          → 20260718000002_sp1_6_expand_audit_log_event_types.sql
         ├── NOTE: Verify no conflict with 20260718000001 before renaming
         ├── Commit the rename to git
         └── Verify local migration list is clean (no duplicates):
             supabase migration list

Step 4:  RECONCILE 9 PRODUCTION-ONLY MIGRATIONS (if any)
         ├── Run: supabase migration list --linked
         ├── Identify any migrations in production not in local
         ├── For each: verify content equality with local equivalent
         ├── If equal content, different timestamp: document; no action required
         └── If different content: STOP — escalate to senior DB architect before proceeding

Step 5:  DEPLOY 9 MISSING MIGRATIONS TO STAGING
         ├── supabase db push --db-url [STAGING_DB_URL]
         ├── Verify applied: supabase migration list --linked (staging)
         └── Run RPC smoke test on staging (see Validation Checklist)

Step 6:  VERIFY 5 MISSING RPCs ON STAGING
         ├── Query: SELECT routine_name FROM information_schema.routines
         │         WHERE routine_schema = 'public'
         │         AND routine_name IN (
         │           'admin_update_subscription',
         │           'get_member_with_email',
         │           'get_storage_usage',
         │           'search_members_by_email',
         │           'set_tenant_subdomain'
         │         );
         └── All 5 must be present before proceeding to production

Step 7:  DEPLOY 9 MISSING MIGRATIONS TO PRODUCTION
         ├── supabase db push --db-url [PRODUCTION_DB_URL]
         ├── Verify applied: supabase migration list --linked (production)
         └── Run RPC smoke test on production (same query as Step 6)

Step 8:  VERIFY ADMIN DASHBOARD FEATURES (manual smoke test)
         ├── Test admin_update_subscription via admin dashboard
         ├── Test get_member_with_email via admin dashboard
         ├── Test get_storage_usage via admin dashboard
         ├── Test search_members_by_email via admin dashboard
         └── Test set_tenant_subdomain via admin dashboard
```

---

## Validation Checklist

- [ ] No duplicate migration timestamps in `supabase/migrations/` (verify with `ls -la | sort`)
- [ ] `supabase migration list --linked` shows local and production counts match
- [ ] All 9 missing migrations applied in production
- [ ] `information_schema.routines` confirms all 5 previously-missing RPCs exist in production:
  - [ ] `admin_update_subscription`
  - [ ] `get_member_with_email`
  - [ ] `get_storage_usage`
  - [ ] `search_members_by_email`
  - [ ] `set_tenant_subdomain`
- [ ] Frontend admin features using those RPCs work (manual smoke test)
- [ ] No staging-only migration anomalies (content verified in Step 4)

## Regression Checklist

- [ ] All 36 smoke tests pass (run full suite after migration deployment)
- [ ] Tenant admins can still manage their tenants
- [ ] No tenant data leakage between tenants (RLS unchanged)
- [ ] PostgREST queries from frontend continue to work
- [ ] Build succeeds (`npm run build`)

---

## Rollback Plan

1. **Migration rollback**: Cannot rollback Supabase migrations directly. Restore from pg_dump backup taken in Step 1 if critical issues arise.
2. **Rename rollback**: Revert git commit renaming the migration file (git revert).
3. **Cron jobs**: Remain paused during this document's execution — they are resumed in Doc 4 / 8 after security hardening is complete.
4. **Rollback Trigger**: Any schema integrity issue, constraint violation, or data loss detected → restore from backup immediately.
5. **Rollback Time Estimate**: 20 minutes (pg_restore).

---

## Expected Outcome

- Local and production migration state are fully in sync
- No duplicate migration timestamps
- All 9 previously-backlogged admin features available in production dashboard
- 5 previously-missing RPCs functioning in production
- Schema is stable and ready for Doc 3 / 8 (security hardening migration)

---

## PASS/FAIL Criteria

| Criterion | Threshold | Weight |
| --- | --- | --- |
| No duplicate timestamps | 0 duplicate filenames in migrations/ | MUST PASS |
| All 9 migrations applied | 9/9 applied in production | MUST PASS |
| All 5 RPCs exist | 5/5 in information_schema.routines | MUST PASS |
| Smoke tests | All 36 pass | MUST PASS |
| Build succeeds | Zero errors | MUST PASS |

**Phase 1-A Outcome: PASS ✅ / FAIL ❌**

---

## References to Previous Document

**Doc 1 / 8 — Project Foundation & Governance** (`IMPLEMENTATION_MASTER_PLAN_1.md`)

Contains: All global context, root cause map, dependency graph, risk matrix, testing strategy, deployment strategy, rollback strategy, and global Definition of Done that govern this document.

## References to Next Document

**Doc 3 / 8 — Phase 1-B: Database Security Hardening** (`IMPLEMENTATION_MASTER_PLAN_3.md`)

Covers: CRIT-1, CRIT-3, HIGH-4, MED-1
Execution: Fix `is_system_admin()`, REVOKE over-broad grants, fix `search_path` on 107 SECURITY DEFINER functions.
**Prerequisite**: This document (Doc 2) must be complete with PASS outcome before Doc 3 begins.

---

## Transition Checklist

Before continuing to Doc 3 / 8, the AI must verify:

- [ ] **PASS** — Phase 1-A Validation Checklist complete (all items checked)
- [ ] **Validation Complete** — All 5 RPCs confirmed in `information_schema.routines` (production)
- [ ] **Review Complete** — Migration list clean; no duplicate timestamps; no staging-only anomalies
- [ ] **Regression Complete** — All 36 smoke tests pass; build succeeds; frontend working

*Doc 3 must not begin until all four items above are checked.*