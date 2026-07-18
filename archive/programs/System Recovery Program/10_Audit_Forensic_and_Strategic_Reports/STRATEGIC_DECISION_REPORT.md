# STRATEGIC DECISION REPORT (SDR)

**Version 1.0**

**Date:** 2026-07-14

**Project:** VietSalePro v7

**Role:** Principal Software Architect / Enterprise Solution Architect / Technical Program Manager / Chief Technology Officer

---

## Executive Summary

The SCAR Program has established that VietSalePro v7 is **not operating from a single source of truth**. While the code layer is largely intact (97.8% service-to-RPC coverage, no UI direct-DB bypass, and a proper service facade), the system exhibits systemic SSOT fragmentation: four production RPCs are missing from migrations, documentation and governance claim features are "Done" that cannot run, the test suite validates against a fictional contract, and the operational audit script checks the wrong canonical source.

The strategic choice is therefore not between "patch a few bugs" versus "start over." It is between **patching symptoms inside a contradictory system** (Option A) and **re-establishing a trustworthy canonical contract** (Option B). Based strictly on the SCAR Phase 1–4 evidence, the recommended strategy is:

**Option B — Controlled Rebuild Program.**

---

## Current Architecture State

**Database — 70 / 100**
The migrations are the de-facto canonical schema/RPC source and are internally executable: ~90 tables, 250+ functions, 31 triggers, ~148 RLS policies, 178 indexes. Penalties: 17 orphan SQL files outside `migrations/`, severe naming-convention fragmentation (17+ patterns), a 2025→2026 year-jump across 84 files, only 1 rollback script for 138 migrations, and repeated function redefinitions (`update_tenant` 6×, `process_checkout` 3×). (SCAR Phase 1 §2, §6; SCAR Phase 4 §Consistency Assessment)

**Migration — Poor / High Risk**
138 migration files exist but ordering is compromised: 84 files are future-dated 2026, making it impossible to insert a real-timestamp hotfix between July 2025 and July 2026. Timestamp gaps exist within the 2025 sequence. Rollback coverage is 0.7%. No schema dump or generated types enforces the contract. (SCAR Phase 1 §2.1, §2.2, §2.5, §6.1)

**RPC — 55 / 100**
97.8% of service RPC calls map to a migration-defined function, but **4 actively-used RPCs are missing**: `admin_update_subscription`, `get_member_with_email`, `search_members_by_email`, `get_storage_usage`. They are concentrated in admin-critical paths (tenant subscription, member search, storage). Canonical equivalents exist for two, but the code calls the wrong names. (SCAR Phase 1 §5.3, §6.2; SCAR Phase 2 §2; SCAR Phase 4 §Consistency Assessment)

**Service — 75 / 100**
46 service modules, 267 exported functions, 188 RPC call-sites. The layer is a thin, faithful RPC facade. Penalties: 4 dead service functions guaranteed to fail, duplicate wrappers, alias re-exports, and signature drift (`admin_update_subscription` passes `p_max_storage_gb` that the canonical `update_tenant_subscription` never had). (SCAR Phase 2 §1, §4, §6)

**UI — 85 / 100**
41 pages, 91 components, 11 hooks, 2 contexts. The UI respects the service boundary: zero direct DB bypasses. Penalties: 7 dead components, 4 cross-layer imports from `pages/` into `components/`, a 3,979-line `supabaseService.ts` god service, 8 dead service files, and feature flags all hard-coded to `true`. (SCAR Phase 3 §1, §High Findings, §UI Health Score)

**Documentation — 45 / 100**
Multiple documents assert health/completion that code reality contradicts: `PLAN_AdminDashboard_SubPhases.md` marks SP-2.2/2.7/2.8 Done while their required RPCs are missing; `RPC_CONTRACTS.md` lists non-existent RPCs as valid; `ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md` describes already-fixed RPCs; `Plan/Log/SP-1.0-*.md` claims files were created that do not exist. (SCAR Phase 4 §SSOT Evidence Matrix)

**Governance — 40 / 100**
Two governance tracks report incompatible completion states: `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/PROGRAM_STATE.md` shows Phase 1-A at 0% / Master Plan 2 in progress, while `Plan/PLAN_AdminDashboard_SubPhases.md` shows SP-1.1 through SP-7.5 mostly Done. `CURRENT_TASK-005.md` assumes 9 migrations are missing from production, yet the local repo contains them. (SCAR Phase 4 §SSOT Evidence Matrix)

**Testing — 60 / 100**
Large test suite (44 files) gives high surface coverage, but `tests/mocks/supabase.ts` implements RPCs that migrations omit, so tests pass against a fictional DB contract. No test exercises `updateSubscriptionLimits` or `getStorageUsage`. CI runs `audit:rpc`, but the audit script compares code to `RPC_CONTRACTS.md` rather than to `supabase/migrations/*.sql`. (SCAR Phase 4 §Consistency Assessment)

**SSOT — 62 / 100**
No single artifact represents the current system state. Migrations are the strongest canonical source, but documentation, governance, tests, and audit tooling describe a different system. The project is **partially intact at best** and cannot be trusted without cross-checking. (SCAR Phase 4 §Overall SSOT Score)

---

## Strategic Strengths

1. **High RPC contract coverage.** 177 of 181 unique service-layer RPCs resolve to migration-defined functions. The service-to-database boundary is fundamentally sound. (SCAR Phase 2 §Executive Summary)
2. **Clean UI-to-service boundary.** Zero direct DB bypasses from the UI; all data access goes through services. This is a strong architectural foundation. (SCAR Phase 3 §2.1, §UI Health Score)
3. **Comprehensive database design.** ~90 tables, 178 indexes, ~148 RLS policies, 31 triggers, and robust tenant-isolation patterns are in place. (SCAR Phase 1 §1)
4. **Bounded, documented drift.** Alias functions are marked with `// ponytail:` comments; the admin service barrel is explicitly labeled a thin wrapper. The drift is localized rather than systemic. (SCAR Phase 2 §Executive Summary, §Part 4)
5. **Existing admin dashboard surface.** 17 admin pages and 9 admin components exist and are lazy-loaded, indicating significant prior investment. (SCAR Phase 3 §1.1)
6. **No deployment blocker from core tenant operations.** The missing RPCs are concentrated in admin/member/subscription/storage management, not in the POS/inventory/order flows that drive daily business. (SCAR Phase 2 §RPC Mapping Matrix; SCAR Phase 3 §2.1)

---

## Strategic Risks

1. **Guaranteed runtime failures.** Four production service functions call RPCs that do not exist: `updateSubscriptionLimits`, `getMemberWithEmail`, `searchMembers`, `getStorageUsage`/`getTenantStorageUsage`. (SCAR Phase 2 §Part 4; SCAR Phase 4 §SSOT Evidence Matrix)
2. **SSOT fragmentation.** No single source can be trusted. Documentation, governance, tests, and audit tooling describe a different system than the migrations. (SCAR Phase 4 §Executive Summary, §Overall SSOT Score)
3. **False quality signals.** Tests pass because mocks implement missing RPCs; CI passes because the audit script checks a markdown contract rather than migrations. This masks real failure modes. (SCAR Phase 4 §SSOT Evidence Matrix items 10–12)
4. **Migration ordering corruption.** The 2025→2026 year-jump means a hotfix migration created today would run *before* 84 existing migrations, breaking deterministic ordering. (SCAR Phase 1 §2.1, §P1)
5. **Governance contradiction.** Two official planning tracks report opposite completion states, so prioritization and status reporting are unreliable. (SCAR Phase 4 §SSOT Evidence Matrix item 9)
6. **Maintainability debt.** 17+ naming conventions, a 15,000+ line baseline, 0.7% rollback coverage, and 17 orphan SQL files make every future change riskier. (SCAR Phase 1 §2.3, §2.4, §2.5, §P2)
7. **Admin feature unreliability.** Features marked Done (tenant detail member search, subscription limit updates, storage usage) are non-functional, undermining admin trust. (SCAR Phase 4 §SSOT Evidence Matrix item 5)

---

## Option A Evaluation

**Continue Fix Bug Program**

*Advantages*
- Lower immediate cost and disruption.
- Preserves the existing UI, service, and migration investment.
- The four missing RPCs can be patched quickly with a single migration.
- Does not require freezing feature work.

*Disadvantages*
- Treats symptoms, not the SSOT root cause. Documentation, governance, and tests will continue to describe a system that does not exist.
- Each bug fix is made against contradictory source material, increasing the risk of new drift.
- The audit script will keep validating code against a markdown contract rather than migrations, so the next missing RPC will also go undetected.
- Governance tracks will remain contradictory, so status reporting and prioritization stay unreliable.
- The 2026 timestamp jump remains, so future hotfixes cannot be inserted safely.
- Dead code, orphan SQL, and naming chaos are left untouched, compounding maintenance cost.

*Risk — High*
Fixing bugs inside a fractured SSOT is high-risk. A "fix" may align code with documentation, but if documentation is wrong, the fix becomes a new failure. The false quality signals (green tests, green CI) mean regressions will not be caught.

*Cost — Lower short-term, higher long-term*
Immediate spend is small, but the cumulative cost of repeated misdirected fixes, status confusion, and mounting technical debt will exceed a controlled rebuild.

*Expected Effort — Low to Medium*
Patching the 4 RPCs is days of work. Continuously reconciling documentation, governance, tests, and migrations every sprint is unbounded effort.

*Expected Outcome — Temporary patches with continued divergence*
The application will be less broken after each patch, but the system that produces the next bug remains intact.

*Long-term Sustainability — Poor*
Without one trustworthy source of truth, the codebase will accrue more documentation-to-code contradictions, making AI-assisted development and new-hire onboarding increasingly unreliable.

---

## Option B Evaluation

**Controlled Rebuild Program**

*Advantages*
- Addresses the root cause: re-establishing a single source of truth across migrations, services, tests, documentation, and governance.
- Produces a clean migration baseline, eliminating the 2026 year-jump, orphan SQL files, and naming chaos.
- Replaces the wrong-source audit script with one that compares code to canonical migrations.
- Rebuilds test mocks from the real migration contract so green tests actually mean green production.
- Reconciles the two contradictory governance tracks into one program state.
- Preserves the strong existing architecture (service facade, UI boundary, RLS model) rather than discarding it.

*Disadvantages*
- Higher upfront cost and longer timeline.
- Requires freezing new feature work for the rebuild window.
- Needs a coordinated migration strategy for any deployed environments.
- Re-baselining 138 migrations is non-trivial and must be carefully staged.

*Risk — Medium-High but Bounded*
Risk is concentrated in the rebuild window and can be mitigated by staging: (1) add the 4 missing RPCs and fix the audit script first, (2) reconcile governance, (3) squash migrations and fix timestamps, (4) regenerate tests/types. Data is not at risk because the rebuild is contract-level, not data-level.

*Cost — Higher short-term, lower long-term*
A controlled program costs more now but eliminates the recurring tax of SSOT contradiction and prevents expensive production incidents.

*Expected Effort — Medium to High*
Weeks to months, depending on team size, but the work is bounded and well-defined by the SCAR evidence.

*Expected Outcome — Trustworthy system*
One canonical migration set, one governance plan, one passing test suite against real DB contracts, and an audit gate that catches drift before merge.

*Long-term Sustainability — Good*
A clean baseline and a correct quality gate make future development, AI assistance, and operational debugging reliable.

---

## Decision Matrix

| Criterion | Weight | Option A: Continue Fix Bug | Option B: Controlled Rebuild |
|---|---|---|---|
| **Business Risk** | 20% | 6/10 — admin features fail silently; false status reporting | 7/10 — upfront cost and freeze, but failure modes become visible |
| **Technical Risk** | 20% | 4/10 — high risk of misdirected fixes and new drift | 7/10 — bounded risk during rebuild, then lower |
| **Cost (5-year TCO)** | 15% | 4/10 — cheaper now, expensive drift tax forever | 7/10 — higher initial, lower lifetime |
| **Schedule to Trustworthy State** | 15% | 3/10 — never reaches trustworthy; patches accumulate | 7/10 — defined rebuild window ends with trust |
| **Maintainability** | 10% | 3/10 — orphan files, naming chaos, god service remain | 8/10 — clean baseline and conventions |
| **Operational Stability** | 10% | 4/10 — runtime failures persist; tests lie | 8/10 — tests validate real contract |
| **Architecture Integrity** | 5% | 6/10 — strong base left untouched | 8/10 — strong base preserved and clarified |
| **SSOT Recovery** | 5% | 2/10 — SSOT stays fragmented | 9/10 — SSOT becomes the explicit goal |

**Weighted Totals**
- Option A: (6×0.20) + (4×0.20) + (4×0.15) + (3×0.15) + (3×0.10) + (4×0.10) + (6×0.05) + (2×0.05) = **4.15 / 10**
- Option B: (7×0.20) + (7×0.20) + (7×0.15) + (7×0.15) + (8×0.10) + (8×0.10) + (8×0.05) + (9×0.05) = **7.35 / 10**

Option B is decisively better on the measurable criteria that matter for long-term ownership.

---

## Final Strategic Decision

**Option B — Controlled Rebuild Program**

---

## Decision Justification

Option A fails because the VietSalePro problem is not a finite list of bugs; it is a **system that produces bugs without detecting them**. The four missing RPCs are only the visible evidence. Underneath them are a markdown contract treated as canonical, a test suite that mocks a non-existent database, an audit script that cannot find missing functions, two governance tracks with opposite status, and a migration timeline that cannot accept real-timestamp hotfixes. Patching the four RPCs leaves every one of those failure-producing conditions in place.

Option B succeeds because it targets the root cause: **re-establishing a single source of truth**. The SCAR evidence shows the code layer is largely sound (97.8% RPC coverage, proper UI→service boundary, strong RLS and indexing). A controlled rebuild therefore does not mean throwing away the application; it means cleaning the contract layer—migrations, generated types, test mocks, audit tooling, and governance plans—so that they all describe the *same* system. That is a bounded, high-return investment.

The rejected strategy (Option A) would deliver short-term symptom relief at the cost of perpetuating the conditions that created the symptoms. The selected strategy (Option B) absorbs short-term cost to remove those conditions permanently.

---

## Confidence

**MEDIUM-HIGH**

The SCAR Phase 1–4 evidence is direct, line-level, and reproducible: grep across 138 migrations confirmed zero definitions for the 4 missing RPCs; direct reads of `tenantService.ts`, `RPC_CONTRACTS.md`, `PLAN_AdminDashboard_SubPhases.md`, `PROGRAM_STATE.md`, and `audit-rpc-contracts.ts` produced concrete contradictions; and multiple independent passes returned the same missing-RPC set. The technical case for Option B is therefore strong.

Confidence is not **HIGH** only because the strategic decision also depends on business constraints—budget, runway, revenue dependence on admin features, and team capacity—that are outside the SCAR evidence scope. If those constraints forbid a rebuild window, the decision would need re-evaluation. Based strictly on the provided evidence, Option B is the better strategic choice.

---

## Validation

Confirmed:

- SCAR Program closed.
- No implementation performed.
- No code changes made.
- No migration changes made.
- No deployment performed.
- No governance documents updated.
- No `CURRENT_TASK` generated.

---

**STOP — Waiting for Program Manager.**
