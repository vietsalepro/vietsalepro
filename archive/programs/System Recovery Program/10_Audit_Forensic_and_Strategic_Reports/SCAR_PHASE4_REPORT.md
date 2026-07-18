# SCAR Phase 4 Report — VietSalePro v7

**Date:** 2026-07-14
**Scope:** System-wide Single Source of Truth (SSOT) consistency assessment
**Role:** Principal Software Architect / Technical Program Manager

> Assessment only. No implementation. No code changes. No migration changes. No deploy. No governance update.

---

## Executive Summary

SCAR Phase 1-3 each concluded **OPTION B — Minor Drift** at their respective boundaries. Phase 4 widens the lens to the **system-wide Single Source of Truth (SSOT)**. The finding is that the project does **not** currently operate from one SSOT.

The code layer (Service → RPC → Migration) is **largely faithful**: ~177 of ~181 RPCs invoked by services are defined in migrations. However, **four critical RPCs are called by production service code but never defined in migrations** (`admin_update_subscription`, `get_member_with_email`, `search_members_by_email`, `get_storage_usage`). These are not edge cases; they are actively used by tenant/member/subscription/storage management paths that documentation marks as **Done**.

More importantly, the **documentation, governance, and test layers describe a different system than the migrations describe**. Admin dashboard sub-phase plans mark SP-2.2, SP-2.7, SP-2.8 as Done while their required RPCs are missing. The operational RPC audit script compares service code against a **markdown contract document** (`RPC_CONTRACTS.md`) rather than the migration files, so it cannot detect missing database functions. Test mocks implement the missing RPCs, making the test suite green against mocks while the real DB would fail. Two governance tracks (`Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN` vs `Plan/PLAN_AdminDashboard_SubPhases.md`) report contradictory completion states.

**Verdict: system-wide SSOT is PARTIALLY intact at best.** The database migrations remain the de-facto canonical source for schema/RPC reality, but the layers above and around them have diverged enough that no single source can be trusted without cross-checking.

---

## Canonical Sources

| Source | Path | Classification | Reason |
|---|---|---|---|
| Database migrations | `supabase/migrations/*.sql` | **Canonical** | Declarative schema/RPC/RLS source executed by Supabase. |
| Orphan SQL files | `supabase/*.sql` outside `migrations/` | **Legacy / Unknown** | Not executed by migration runner; some duplicate migrated content, some unfinished manual migrations. |
| RPC function definitions | inside migrations | **Canonical** | Runtime PostgreSQL functions. |
| RPC contract doc | `docs/admin-dashboard/RPC_CONTRACTS.md` | **Derived but treated as canonical** | Used by `scripts/audit-rpc-contracts.ts` as its source of truth; includes RPCs not in migrations. |
| Service layer | `services/**/*.ts` | **Derived consumer** | Wraps `.rpc()` calls. |
| UI layer | `pages/`, `components/`, `hooks/` | **Derived consumer** | Calls services; no direct DB bypass. |
| Edge functions | `supabase/functions/` | **Derived / runtime** | Supplement DB; not the primary schema contract. |
| Generated types / schema dump | none found | **Absent** | No `database.types.ts`, `schema.sql`, or seed dump. Missing SSOT enforcer. |
| Feature flags config | `types/tenant.ts`, migration `20250711000002_...`, hook | **Configuration / Derived** | Consistent internally, but hook not wired to UI. |
| Tests | `tests/smoke/`, `tests/services/`, `tests/integration/`, `tests/mocks/supabase.ts` | **Derived validation + shadow implementation** | Mocks implement RPCs that migrations omit. |
| CI / package scripts | `package.json`, `.github/workflows/ci.yml` | **Operational** | Runs `audit:rpc`, but `audit:rpc` checks the wrong source. |
| Admin dashboard plans | `Plan/PLAN_AdminDashboard_*.md`, `Plan/Log/SP-*.md` | **Governance / planning** | Claims Done status that code reality contradicts. |
| Fix-bug master plan | `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/PROGRAM_STATE.md`, `CURRENT_TASK*.md` | **Governance / operational** | Tracks a separate workstream with contradictory 0% completion state. |
| SCAR / audit reports | `SCAR_PHASE1-3_REPORT.md`, `AUDIT_REPORT.md` | **Assessment / derived** | `AUDIT_REPORT.md` CRIT-2 is partially outdated (`set_tenant_subdomain` now exists). |
| `CURRENT_TASK-005.md` | `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/` | **Operational assumption** | Assumes 9 migrations are missing from production; local repo contains them. |

---

## SSOT Evidence Matrix

| # | Artifact A | Artifact B | Conflict | Severity | Evidence |
|---|---|---|---|---|---|
| 1 | `services/tenantService.ts` (l. 481) calls `admin_update_subscription` | `supabase/migrations/*.sql` has no `CREATE FUNCTION admin_update_subscription` | Code invokes RPC that migrations never define. | **Critical** | grep across 138 migrations + orphans returns 0 definitions; `updateSubscriptionLimits()` would fail at runtime. |
| 2 | `services/tenantService.ts` (l. 591) calls `get_member_with_email` | Migrations only define `get_tenant_members_with_email` | Code-only RPC name; canonical equivalent exists but is not called. | **Critical** | `getMemberWithEmail()` calls undefined RPC. |
| 3 | `services/tenantService.ts` (l. 610) calls `search_members_by_email` | Migrations define `search_tenant_members` | Code-only RPC name; canonical equivalent exists but is not called. | **Critical** | `searchMembers()` calls undefined RPC. |
| 4 | `services/tenantService.ts` (l. 1009, 1017) calls `get_storage_usage` | No matching migration definition | Two functions (`getStorageUsage`, `getTenantStorageUsage`) call undefined RPC. | **Critical** | No `CREATE FUNCTION get_storage_usage` in migrations/orphans. |
| 5 | `Plan/PLAN_AdminDashboard_SubPhases.md` marks SP-2.2, SP-2.7, SP-2.8 **Done** | Above missing RPCs are required by those features | Documentation claims completion while core RPCs are absent. | **High** | Status table l. 54-61 vs. `tenantService.ts` l. 481, 591, 610, 1009. |
| 6 | `Plan/Log/SP-1.0-20260712_123800.md` claims `tests/test-helpers.ts` and `tests/test-helpers.test.ts` were created and passing | Files do not exist in repo | False completion log. | **High** | `find_file_by_name **/test-helpers*` returns no results. |
| 7 | `Plan/PLAN_AdminDashboard_SubPhases.md` expects `ADMIN_PERMISSIONS` constants in `services/admin/permissions.ts` | File is a thin re-export wrapper from `lib/permissions.ts` with no `ADMIN_PERMISSIONS` constant | Implementation pattern diverges from documented plan. | **Medium** | `services/admin/permissions.ts` content vs. plan l. 104, 119. |
| 8 | `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md` (l. 13-15) states 3 RPCs missing/broken | `20260717000000_fix_admin_tenant_rpc_signatures.sql` defines all three correctly | Doc is stale; problems were fixed later. | **Medium** | Migration exists with `get_top_tenants`, `get_current_user_tenants`, `get_tenants_admin`. |
| 9 | `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/PROGRAM_STATE.md`: Phase 1-A, 0% complete, Master Plan 2 in progress | `Plan/PLAN_AdminDashboard_SubPhases.md`: SP-1.1 through SP-7.5 mostly Done | Two governance sources contradict overall project status. | **High** | PROGRAM_STATE.md l. 11-22 vs. SubPhases status table. |
| 10 | `docs/admin-dashboard/RPC_CONTRACTS.md` lists `admin_update_subscription`, `get_storage_usage`, `search_members_by_email`, `get_member_with_email` as valid RPCs | Migrations do not define these RPCs | Contract doc validates code names that have no DB backing. | **High** | RPC_CONTRACTS.md l. 20, 26-28, 32. |
| 11 | `tests/mocks/supabase.ts` implements `get_storage_usage` and other RPCs | Migrations omit `get_storage_usage` | Tests pass against a fictional DB contract. | **High** | Mock l. ~2005; no migration definition. |
| 12 | `scripts/audit-rpc-contracts.ts` compares code RPCs to `RPC_CONTRACTS.md` | Canonical RPC source is `supabase/migrations/*.sql` | Operational check uses derived doc, not canonical migrations, so it cannot catch missing DB functions. | **High** | Script source l. 7-8, 72-73. |
| 13 | `AUDIT_REPORT.md` CRIT-2 lists `set_tenant_subdomain` as missing | `20260718000001_sp_7_1_set_tenant_subdomain.sql` defines it | Audit report partially outdated. | **Medium** | Migration exists; `services/admin/tenantAdminService.ts:168` calls it. |
| 14 | `CURRENT_TASK-005.md` assumes 9 migrations are missing from production/staging | Local repo contains those migrations (e.g., `20260717000000_fix_admin_tenant_rpc_signatures.sql`, `20260718000001_sp_7_1_set_tenant_subdomain.sql`) | Runtime deployment assumption mismatches local codebase state. | **Medium** | Migration files are present in `supabase/migrations/`. |

---

## Consistency Assessment

### Database — 70 / 100
Migrations remain the de-facto canonical schema/RPC source and are internally executable. Penalties: 17 orphan SQL files outside `migrations/`, severe naming-convention fragmentation (17+ patterns), 2025→2026 year-jump in timestamps, only 1 rollback script for 138 migrations, and repeated function redefinitions (`update_tenant` 6×, `process_checkout` 3×).

### RPC — 55 / 100
97.8% of service RPC calls map to a migration-defined function, but **4 actively-used RPCs are missing** and they are concentrated in admin-critical paths (tenant subscription, member search, storage). Additionally, code-only names (`get_member_with_email`, `search_members_by_email`, `admin_update_subscription`) shadow canonical names that *do* exist, creating a false sense of coverage.

### Service — 75 / 100
Most services are thin, faithful wrappers. Penalties: 4 dead functions guaranteed to fail, duplicate wrappers (`getUsageSummary` / `getTenantUsageSummary`), alias re-exports, and the `admin_update_subscription` signature drift (extra `p_max_storage_gb` param vs. canonical `update_tenant_subscription`).

### UI — 85 / 100
UI goes through the service layer and has no direct DB bypass. Penalties from Phase 3 still apply: some dead components and the 4 missing RPCs propagate up from services, but the UI-to-service contract itself is largely consistent.

### Documentation — 45 / 100
Multiple documents claim health/completion that code reality contradicts: SP status table marks features Done while RPCs are missing; SP-1.0 log reports files that do not exist; `ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md` describes already-fixed RPCs; `RPC_CONTRACTS.md` lists non-existent RPCs as valid.

### Governance — 40 / 100
Two governance tracks give incompatible pictures of project completion (`IMPLEMENTATION_MASTER_PLAN` 0% / Phase 1-A vs. Admin Dashboard sub-phases mostly Done). `CURRENT_TASK-005.md` is predicated on migrations being absent from staging, while the local repo contains them.

### Testing — 60 / 100
Large test suite (44 files) gives high surface coverage, but mocks in `tests/mocks/supabase.ts` implement RPCs that migrations omit, so tests do not guard against the real failure modes. No test exercises `updateSubscriptionLimits` or `getStorageUsage`. CI runs `audit:rpc`, but the audit script checks the wrong source.

---

## Overall SSOT Score

**62 / 100**

The database migrations are the strongest canonical source and most of the service-to-migration graph is intact. However, the **system as a whole does not describe one system**. Documentation and governance assert a state of completion that the migrations and service code do not support. The operational quality gate (`audit:rpc`) is wired to a derived markdown contract rather than the canonical migration source, so it silently validates code that will fail at runtime. Until the missing RPCs are either removed from code or added to migrations, and until governance/docs are reconciled with code reality, there is no trustworthy single source.

---

## Strategic Assessment

**PARTIALLY**

Evidence:
- The canonical database contract (migrations) is mostly present and internally coherent.
- Four actively-used RPCs have no migration definition, breaking the Migration → RPC → Service chain.
- Documentation and governance claim completion for features whose canonical RPCs are missing.
- The test/audit pipeline validates against a derived contract document, not against migrations, allowing the drift to remain undetected.
- Two governance tracks report contradictory overall status.

The project is not fully inconsistent, but it is **not operating from one SSOT**.

---

## Confidence

**HIGH**

Evidence is direct and reproducible:
- grep across all `supabase/migrations/*.sql` and orphan SQL files confirmed 0 definitions for the 4 missing RPCs.
- Direct reads of `services/tenantService.ts`, `docs/admin-dashboard/RPC_CONTRACTS.md`, `Plan/PLAN_AdminDashboard_SubPhases.md`, `Plan/Log/SP-1.0-*.md`, `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/PROGRAM_STATE.md`, and `scripts/audit-rpc-contracts.ts` produced concrete line-level contradictions.
- Multiple independent subagent passes returned the same missing-RPC set.

---

## Validation

Confirmed:
- No implementation performed.
- No code changes made.
- No migration changes made.
- No deploy performed.
- No governance document updated.
- No new `CURRENT_TASK` generated.

Report written to `SCAR_PHASE4_REPORT.md` as requested.

---

## Errata — Phase 5 Close-out (2026-07-18)

SSOT Evidence Matrix items #1-4 (missing RPCs) and #10-12 (audit script validating against a markdown contract) are resolved. The four old RPC names have no remaining call sites in the service layer; `scripts/audit-rpc-contracts.ts` now reads `supabase/migrations/*.sql` directly and reports that all 183 service-layer RPC calls are defined in the canonical migration chain.
