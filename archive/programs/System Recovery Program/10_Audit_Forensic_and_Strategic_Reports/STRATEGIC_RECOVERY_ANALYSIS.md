# STRATEGIC RECOVERY ANALYSIS (SRA)

**Version 1.0**  
**Project:** VietSalePro v7  
**Date:** 2026-07-14  
**Basis:** SCAR Phase 1–4 Reports + Strategic Decision Report (SDR) only. No new repository scan, no implementation, no code changes.

---

## Executive Summary

VietSalePro v7 can recover through a controlled recovery program. The SCAR evidence shows the core architecture is sound: the database design is comprehensive (~90 tables, 178 indexes, ~148 RLS policies, 250+ functions), the service-to-RPC contract is 97.8% intact, and the UI respects the service boundary with zero direct database bypasses. The failures are concentrated in contract drift, single-source-of-truth (SSOT) fragmentation, and governance/documentation contradiction — not in fundamental architecture.

All 28 strategic issues identified by SCAR are recoverable or partially recoverable. None are structurally irreversible. The primary blockers are: (1) four missing production RPCs causing guaranteed runtime failures, (2) corrupted migration ordering that prevents safe hotfixes, (3) an audit pipeline that validates against a markdown contract instead of migrations, and (4) two contradictory governance tracks. These four issues are interdependent and must be resolved before the system becomes trustworthy.

The SCAR evidence supports the SDR's recommendation of **Option B — Controlled Rebuild Program** over Option A (Continue Fix Bug Program). Patching the four RPCs alone would leave every failure-producing condition intact: tests would still validate against a fictional database, the audit script would still miss the next missing function, documentation would still claim completion for broken features, and future hotfixes would still be inserted into the wrong migration order.

---

## Recovery Inventory

### 1. Database / Migration Layer

| ID | Issue | Source |
|---|---|---|
| DB-1 | Four RPCs called by production services are missing from all migrations: `admin_update_subscription`, `get_member_with_email`, `search_members_by_email`, `get_storage_usage`. | SCAR P1 §3.2; SCAR P2 §C1; SCAR P4 §SSOT Evidence Matrix #1–4 |
| DB-2 | Migration timestamp year-jump: 84 files are dated 2026, making it impossible to insert a real-timestamp hotfix between July 2025 and July 2026. | SCAR P1 §2.1; SCAR P4 §Consistency Assessment |
| DB-3 | 17 orphan SQL files outside `supabase/migrations/` — unclear if applied, draft, or abandoned. | SCAR P1 §2.4; SCAR P4 §Canonical Sources |
| DB-4 | 17+ naming-convention patterns across 138 migration files. | SCAR P1 §2.3; SCAR P4 §Consistency Assessment |
| DB-5 | 0.7% rollback coverage: only 1 rollback script for 138 migrations. | SCAR P1 §2.5; SCAR P4 §Consistency Assessment |
| DB-6 | Baseline migration is ~15,000+ lines with 233 functions — unreviewable and hard to diff. | SCAR P1 §1.3; SCAR P4 §Consistency Assessment |
| DB-7 | No schema SSOT: no `schema.sql` dump, no generated types, no migration squash. | SCAR P1 §6.1–6.2; SCAR P4 §Canonical Sources |

### 2. Service / RPC Layer

| ID | Issue | Source |
|---|---|---|
| SR-1 | Subscription signature drift: `admin_update_subscription` passes `p_max_storage_gb`, which canonical `update_tenant_subscription` never accepted. | SCAR P2 §H1, §Part 6; SCAR P4 §SSOT #1 |
| SR-2 | Function redefinition fragility: `update_tenant_subscription` redefined 3×, `update_tenant` 6×, `process_checkout` 3×; old overloads can linger. | SCAR P1 §1.3, §5.3; SCAR P2 §H2 |
| SR-3 | Duplicate service wrappers: `getUsageSummary` and `getTenantUsageSummary` are identical calls to `get_tenant_usage_summary`. | SCAR P2 §M1, §Metrics |
| SR-4 | Code-only member RPC names (`get_member_with_email`, `search_members_by_email`) shadow canonical `get_tenant_members_with_email` / `search_tenant_members`. | SCAR P2 §M2, §Part 5; SCAR P4 §SSOT #2–3 |
| SR-5 | Facade/alias surface expansion: `services/admin/systemAdminService.ts` re-exports 30+ symbols; aliases marked `// ponytail:` expand naming surface. | SCAR P2 §L1–L2, §Part 4 |

### 3. UI Layer

| ID | Issue | Source |
|---|---|---|
| UI-1 | `services/supabaseService.ts` is a 3,979-line god service with 139 methods, 57 RPC calls, 91 table calls — single point of coupling. | SCAR P3 §H-1; SDR §Current Architecture State |
| UI-2 | 7 dead components with zero imports (e.g., AdminTabs, AnnouncementBanner, BillingConfig). | SCAR P3 §6.1 |
| UI-3 | 4 dead services + 4 providers with no UI consumer. | SCAR P3 §Metrics |
| UI-4 | 4 cross-layer imports from `pages/` into `components/`. | SCAR P3 §Metrics |
| UI-5 | Feature flags hard-coded to `true` in `types/tenant.ts` and migration-driven hook not wired to UI. | SCAR P4 §Canonical Sources; SDR §Current Architecture State |
| UI-6 | Admin wrapper naming ambiguity: `services/systemAdminService.ts` and `services/admin/systemAdminService.ts` have the same name. | SCAR P3 §8.3 |

### 4. Documentation / Governance Layer

| ID | Issue | Source |
|---|---|---|
| DG-1 | `Plan/PLAN_AdminDashboard_SubPhases.md` marks SP-2.2, SP-2.7, SP-2.8 as Done while their required RPCs are missing. | SCAR P4 §SSOT #5 |
| DG-2 | `Plan/Log/SP-1.0-20260712_123800.md` claims files were created that do not exist. | SCAR P4 §SSOT #6 |
| DG-3 | `ADMIN_PERMISSIONS` constants expected in `services/admin/permissions.ts`; file is only a thin re-export wrapper. | SCAR P4 §SSOT #7 |
| DG-4 | `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md` describes RPCs already fixed by migration. | SCAR P4 §SSOT #8 |
| DG-5 | Two governance tracks contradict: `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/PROGRAM_STATE.md` shows Phase 1-A at 0%, while `Plan/PLAN_AdminDashboard_SubPhases.md` shows SP-1.1 through SP-7.5 mostly Done. | SCAR P4 §SSOT #9 |
| DG-6 | `docs/admin-dashboard/RPC_CONTRACTS.md` lists non-existent RPCs (`admin_update_subscription`, `get_storage_usage`, etc.) as valid. | SCAR P4 §SSOT #10 |

### 5. Testing / Audit Layer

| ID | Issue | Source |
|---|---|---|
| TA-1 | `tests/mocks/supabase.ts` implements missing RPCs, so tests pass against a fictional database contract. | SCAR P4 §SSOT #11 |
| TA-2 | `scripts/audit-rpc-contracts.ts` compares code to `RPC_CONTRACTS.md` instead of `supabase/migrations/*.sql`. | SCAR P4 §SSOT #12 |
| TA-3 | `AUDIT_REPORT.md` CRIT-2 lists `set_tenant_subdomain` as missing, but migration defines it. | SCAR P4 §SSOT #13 |
| TA-4 | `CURRENT_TASK-005.md` assumes 9 migrations are missing from production/staging; they exist locally. | SCAR P4 §SSOT #14 |

---

## Recovery Classification

| ID | Issue | Classification | Rationale / Evidence |
|---|---|---|---|
| DB-1 | 4 missing RPCs | **Recoverable** | Canonical equivalents exist for 2 (`get_tenant_members_with_email`, `search_tenant_members`). `get_storage_usage` needs a new function. SDR states patching the 4 RPCs is days of work. |
| DB-2 | Year-jump timestamps | **Partially Recoverable** | Renaming 84 files is mechanical, but requires coordinating with any deployed environments and re-baselining. SDR §Option B. |
| DB-3 | 17 orphan SQL files | **Recoverable** | Each can be triaged: integrate into migrations with a timestamp, delete, or document as legacy. SCAR P1 §2.4. |
| DB-4 | 17+ naming conventions | **Recoverable** | Can be standardized via linting for new migrations; historical files can be renamed during a squash. High effort but mechanical. |
| DB-5 | 0.7% rollback coverage | **Recoverable** | Rollback scripts can be added for all future migrations; retrofitting 137 existing migrations is not required for trust. |
| DB-6 | 15,000+ line baseline | **Recoverable** | Migration squash can split the baseline into domain-scoped files. Requires staging. |
| DB-7 | No schema SSOT | **Recoverable** | `supabase db dump` / `supabase gen types` can generate canonical artifacts and enforce them in CI. SCAR P1 §6.1. |
| SR-1 | Subscription signature drift | **Recoverable** | Align `updateSubscriptionLimits` to canonical `update_tenant_subscription` signature or split storage-limit logic explicitly. |
| SR-2 | Function redefinition fragility | **Recoverable** | Refactor to explicit `DROP FUNCTION IF EXISTS ... CASCADE` / `CREATE OR REPLACE` patterns; add migration lint. |
| SR-3 | Duplicate usage wrappers | **Recoverable** | Delete one wrapper; all call-sites already call the same RPC. |
| SR-4 | Code-only member RPC names | **Recoverable** | Point service functions to canonical RPCs; delete legacy names. |
| SR-5 | Facade/alias expansion | **Recoverable** | Can simplify barrel imports or leave documented; not a runtime blocker. |
| UI-1 | God service `supabaseService.ts` | **Partially Recoverable** | Can be decomposed into domain services, but 139 methods and 18 root-page imports make it a large, careful refactor. |
| UI-2 | 7 dead components | **Recoverable** | Safe to delete after confirming no dynamic imports. |
| UI-3 | 4 dead services + providers | **Recoverable** | Delete if static analysis confirms no consumers. |
| UI-4 | 4 cross-layer imports | **Recoverable** | Move shared code to a common location; mechanical. |
| UI-5 | Hard-coded feature flags | **Recoverable** | Wire hook to UI; configuration already exists in migration and `types/tenant.ts`. |
| UI-6 | Admin wrapper naming ambiguity | **Recoverable** | Rename one module to disambiguate (e.g., `admin/adminSystemService.ts`). |
| DG-1 | Docs claim Done for broken features | **Recoverable** | Correct status once RPCs are resolved or mark as Not Started. |
| DG-2 | False completion log | **Recoverable** | Update log to reflect actual file state. |
| DG-3 | Missing `ADMIN_PERMISSIONS` constants | **Recoverable** | Implement constants or update plan to match thin-wrapper pattern. |
| DG-4 | Stale SQL fix doc | **Recoverable** | Archive or update doc. |
| DG-5 | Contradictory governance tracks | **Recoverable** | Reconcile into a single program state; requires program-manager decision, not engineering. |
| DG-6 | RPC_CONTRACTS.md lists invalid RPCs | **Recoverable** | Regenerate contract from canonical migrations once DB-7 is addressed. |
| TA-1 | Fictional test mocks | **Recoverable** | Rebuild mocks from real migration contract after DB-7 / DB-1. |
| TA-2 | Audit wrong source | **Recoverable** | Change script to parse `supabase/migrations/*.sql` instead of `RPC_CONTRACTS.md`. |
| TA-3 | Outdated audit report | **Recoverable** | Update report to reflect current migration state. |
| TA-4 | CURRENT_TASK-005 wrong assumption | **Recoverable** | Update task description to reflect local migration presence. |

**Summary:** 0 issues classified as **Not Recoverable**. 2 issues are **Partially Recoverable** due to deployment coordination (DB-2) and large-scale refactoring scope (UI-1). The remaining 26 are **Recoverable**.

---

## Recovery Dependency Graph

```text
DG-5 (Governance contradiction)
        │
        ├──► DB-1 (Missing RPCs) ──────┬──► DG-1 (Docs status)
        │                              ├──► SR-1 (Signature drift)
        │                              ├──► SR-4 (Member RPC names)
        │                              └──► TA-1 (Test mocks rebuild)
        │
        ├──► DB-2 (Year-jump) ─────────┬──► DB-4 (Naming conventions cleanup)
        │                              ├──► DB-6 (Baseline squash)
        │                              └──► All future hotfix migrations
        │
        ├──► DB-7 (Schema SSOT) ───────┬──► DG-6 (RPC_CONTRACTS regen)
        │                              ├──► TA-1 (Mocks from real contract)
        │                              └──► TA-2 (Audit against migrations)
        │
        └──► TA-2 (Audit source fix) ──► DB-1 detection gate (prevents new missing RPCs)

Independent / parallelizable:
        UI-1 (God service decomposition)
        UI-2 (Dead components)
        UI-3 (Dead services)
        UI-4 (Cross-layer imports)
        UI-5 (Feature flags)
        UI-6 (Naming ambiguity)
        DB-3 (Orphan SQL triage)
        DB-5 (Rollback scripts)
        DG-2, DG-3, DG-4 (Documentation fixes)
        TA-3, TA-4 (Report/task updates)
        SR-2, SR-3, SR-5 (Service hygiene)
```

**Blockers:** DB-1, DB-2, DB-7, DG-5, TA-2. These five issues prevent the system from becoming trustworthy; everything else is cleanup or follow-up.

---

## Recovery Cost Assessment

| ID | Issue | Cost | Evidence / Rationale |
|---|---|---|---|
| DB-1 | 4 missing RPCs | **LOW** | SDR: "days of work"; canonical equivalents exist for 2. |
| DB-2 | Year-jump timestamps | **MEDIUM** | Mechanical rename of 84 files, but requires environment coordination and re-baselining. |
| DB-3 | 17 orphan SQL files | **LOW** | Triage and move/delete; mostly clerical. |
| DB-4 | 17+ naming conventions | **MEDIUM** | New lint is cheap; applying consistently during squash is effort. |
| DB-5 | Rollback coverage | **LOW** | Add rollback scripts for future migrations. |
| DB-6 | 15,000+ line baseline | **MEDIUM** | Squash requires careful staging but is bounded. |
| DB-7 | No schema SSOT | **LOW** | Generate dump/types and add CI gate; tooling exists. |
| SR-1 | Subscription signature drift | **LOW** | One service function signature change. |
| SR-2 | Function redefinition fragility | **MEDIUM** | Refactor pattern + lint across 138 migrations. |
| SR-3 | Duplicate wrappers | **LOW** | One deletion. |
| SR-4 | Code-only member RPC names | **LOW** | Update service to canonical names. |
| SR-5 | Facade/alias expansion | **LOW** | Documentation or minor simplification. |
| UI-1 | God service | **HIGH** | 139 methods, 18 root pages, 57 RPC calls — careful decomposition only. |
| UI-2 | 7 dead components | **VERY LOW** | Safe deletion. |
| UI-3 | 4 dead services | **LOW** | Confirm and delete. |
| UI-4 | Cross-layer imports | **LOW** | Move shared code. |
| UI-5 | Hard-coded flags | **LOW** | Wire existing hook. |
| UI-6 | Admin wrapper naming ambiguity | **LOW** | Rename module. |
| DG-1 | Docs claim Done | **LOW** | Update status. |
| DG-2 | False log | **LOW** | Correct log. |
| DG-3 | Missing constants | **LOW** | Implement or update plan. |
| DG-4 | Stale doc | **LOW** | Archive/update. |
| DG-5 | Contradictory governance | **MEDIUM** | Requires program-manager decision and communication, not coding. |
| DG-6 | RPC_CONTRACTS invalid | **LOW** | Regenerate from migrations after DB-7. |
| TA-1 | Fictional test mocks | **MEDIUM** | Rebuild mocks from canonical contract; 44 test files. |
| TA-2 | Audit wrong source | **LOW** | Change source comparison in one script. |
| TA-3 | Outdated audit report | **LOW** | Update report. |
| TA-4 | CURRENT_TASK-005 wrong assumption | **LOW** | Update task description. |

**Overall program cost:** **MEDIUM to HIGH** if god-service decomposition (UI-1) is included; **MEDIUM** if scoped to trust recovery (DB-1, DB-2, DB-7, DG-5, TA-2, TA-1, DG-6).

---

## Recovery Risk Assessment

| ID | Issue | Risk | Evidence / Rationale |
|---|---|---|---|
| DB-1 | 4 missing RPCs | **HIGH** | Guaranteed runtime failures in admin/member/subscription/storage paths. |
| DB-2 | Year-jump timestamps | **HIGH** | Any hotfix inserted today would run before 84 migrations, corrupting ordering. |
| DB-3 | 17 orphan SQL files | **MEDIUM** | May contain unapplied schema changes or duplicate logic; uncertainty. |
| DB-4 | Naming conventions | **MEDIUM** | Increases chance of wrong migration ordering and onboarding errors. |
| DB-5 | Rollback coverage | **MEDIUM** | No safe rollback path for 137 migrations. |
| DB-6 | 15,000+ line baseline | **MEDIUM** | Hard to review; increases regression risk on schema changes. |
| DB-7 | No schema SSOT | **HIGH** | No trustworthy contract enforcer; drift goes undetected. |
| SR-1 | Subscription signature drift | **HIGH** | Calling wrong signature will fail or corrupt subscription data. |
| SR-2 | Function redefinition fragility | **MEDIUM** | Old overloads can collide; runtime errors on signature mismatch. |
| SR-3 | Duplicate wrappers | **LOW** | Maintenance noise, no runtime risk. |
| SR-4 | Code-only member RPC names | **HIGH** | Same impact as DB-1: runtime failure. |
| SR-5 | Facade/alias expansion | **LOW** | Discoverability issue, not runtime risk. |
| UI-1 | God service | **MEDIUM** | High coupling; changes risk cross-page regression. |
| UI-2 | 7 dead components | **LOW** | Deletion risk is minimal after import check. |
| UI-3 | 4 dead services | **LOW** | Same as UI-2. |
| UI-4 | Cross-layer imports | **LOW** | Architectural hygiene, no runtime risk. |
| UI-5 | Hard-coded flags | **MEDIUM** | Features cannot be toggled safely; could expose unfinished work. |
| UI-6 | Admin wrapper naming ambiguity | **LOW** | Developer confusion, not runtime risk. |
| DG-1 | Docs claim Done | **HIGH** | Misdirects prioritization and masks broken features. |
| DG-2 | False log | **MEDIUM** | Undermines trust in completion tracking. |
| DG-3 | Missing constants | **LOW** | Plan/implementation mismatch. |
| DG-4 | Stale doc | **LOW** | Misleading guidance. |
| DG-5 | Contradictory governance | **HIGH** | Program cannot coordinate work or report status reliably. |
| DG-6 | RPC_CONTRACTS invalid | **HIGH** | Causes audit and developers to trust non-existent RPCs. |
| TA-1 | Fictional test mocks | **HIGH** | Green tests mask production failures. |
| TA-2 | Audit wrong source | **HIGH** | CI cannot detect missing RPCs; drift will recur. |
| TA-3 | Outdated audit report | **LOW** | Stale guidance. |
| TA-4 | CURRENT_TASK-005 wrong assumption | **MEDIUM** | Could trigger unnecessary or duplicated migration work. |

**Program-level risk:** **HIGH** while the five blockers remain; drops to **MEDIUM** once DB-1, DB-2, DB-7, DG-5, and TA-2 are resolved.

---

## Recovery Time Assessment

| ID | Issue | Time | Evidence / Rationale |
|---|---|---|---|
| DB-1 | 4 missing RPCs | **SHORT** | Days; SDR §Option A. |
| DB-2 | Year-jump timestamps | **MEDIUM** | File rename is short, but environment coordination and validation add time. |
| DB-3 | 17 orphan SQL files | **SHORT** | Triage clerical work. |
| DB-4 | Naming conventions | **MEDIUM** | Lint + historical cleanup during squash. |
| DB-5 | Rollback coverage | **SHORT** | Add scripts for new migrations only. |
| DB-6 | 15,000+ line baseline | **MEDIUM** | Domain split is bounded but careful. |
| DB-7 | No schema SSOT | **SHORT** | Generate artifacts and CI gate. |
| SR-1 | Subscription signature drift | **SHORT** | One function fix. |
| SR-2 | Function redefinition fragility | **MEDIUM** | Pattern refactor across migrations. |
| SR-3 | Duplicate wrappers | **VERY SHORT** | One-line deletion. |
| SR-4 | Code-only member RPC names | **SHORT** | Update service calls. |
| SR-5 | Facade/alias expansion | **SHORT** | Document or simplify. |
| UI-1 | God service | **LONG** | 139-method decomposition across 18 pages. |
| UI-2 | 7 dead components | **VERY SHORT** | Delete. |
| UI-3 | 4 dead services | **SHORT** | Confirm + delete. |
| UI-4 | Cross-layer imports | **SHORT** | Move shared code. |
| UI-5 | Hard-coded flags | **SHORT** | Wire hook. |
| UI-6 | Admin wrapper naming ambiguity | **SHORT** | Rename. |
| DG-1 | Docs claim Done | **SHORT** | Status update. |
| DG-2 | False log | **VERY SHORT** | Edit log. |
| DG-3 | Missing constants | **SHORT** | Implement or plan update. |
| DG-4 | Stale doc | **VERY SHORT** | Archive/update. |
| DG-5 | Contradictory governance | **MEDIUM** | Decision + communication cycle. |
| DG-6 | RPC_CONTRACTS invalid | **SHORT** | Regenerate after DB-7. |
| TA-1 | Fictional test mocks | **MEDIUM** | Rebuild mocks for 44 test files. |
| TA-2 | Audit wrong source | **SHORT** | Change script source. |
| TA-3 | Outdated audit report | **VERY SHORT** | Edit report. |
| TA-4 | CURRENT_TASK-005 wrong assumption | **VERY SHORT** | Edit task. |

**Minimum trustworthy-state time:** **SHORT to MEDIUM** — add missing RPCs, fix audit source, generate schema SSOT, reconcile governance, and rebuild tests.  
**Full architectural cleanup time:** **LONG** — primarily because of UI-1 (god service) and DB-6/DB-2 re-baselining.

---

## Root Cause Analysis

| ID | Issue | Symptom | Underlying Cause | Root Cause | Evidence |
|---|---|---|---|---|---|
| DB-1 | 4 missing RPCs | Admin/member/subscription/storage features fail at runtime with `function not found`. | Service layer calls RPC names never defined in migrations. | No enforced contract between code and database; audit checks markdown, not migrations. | SCAR P1 §3.2; SCAR P2 §C1; SCAR P4 #1–4 |
| DB-2 | Year-jump timestamps | Cannot insert real-timestamp hotfix without breaking migration order. | 84 migrations were committed with 2026 prefixes. | No migration timestamp lint or CI gate; likely typo not caught in review. | SCAR P1 §2.1 |
| DB-3 | Orphan SQL files | Unknown whether schema state includes these files. | Files exist outside `migrations/` and are never executed by Supabase runner. | No process for promoting draft/manual migrations into the canonical chain. | SCAR P1 §2.4 |
| DB-4 | Naming conventions | Developers cannot infer migration order or purpose by filename. | Multiple naming patterns evolved ad-hoc. | No enforced naming standard or migration RFC process. | SCAR P1 §2.3 |
| DB-5 | Rollback coverage | No safe rollback for 137 migrations. | Only 1 rollback script created. | Rollbacks were not required as part of migration acceptance. | SCAR P1 §2.5 |
| DB-6 | 15,000-line baseline | Schema changes are hard to review and diff. | Baseline file grew to 233 functions / 74 tables. | No migration squash or domain split was performed. | SCAR P1 §1.3 |
| DB-7 | No schema SSOT | Generated types, tests, and docs describe different systems. | No committed `schema.sql` or generated types. | Tooling was not configured to emit and enforce a canonical artifact. | SCAR P1 §6.1–6.2 |
| SR-1 | Subscription signature drift | `updateSubscriptionLimits` would fail or pass wrong parameter set. | Service assumes `p_max_storage_gb` that canonical function lacks. | Two divergent contracts for one operation evolved without reconciliation. | SCAR P2 §H1, §Part 6 |
| SR-2 | Function redefinition fragility | Runtime errors when old overloads linger. | `CREATE OR REPLACE` silently overwrites; old overloads not dropped. | No migration pattern requiring explicit `DROP FUNCTION IF EXISTS`. | SCAR P1 §5.3 |
| SR-3 | Duplicate wrappers | Maintenance overhead; two names for same call. | Two service functions wrap the same RPC identically. | No deduplication review of service surface. | SCAR P2 §M1 |
| SR-4 | Code-only member RPC names | Member search fails. | Service calls legacy names instead of canonical names. | Naming drift was not reconciled when canonical functions were created. | SCAR P2 §M2 |
| SR-5 | Facade/alias expansion | Hard to trace which module owns a function. | Barrel re-exports and aliases multiply entry points. | Convenience wrappers added without surface governance. | SCAR P2 §L1–L2 |
| UI-1 | God service | Single change risks regressions across all tenant pages. | All tenant CRUD accumulated in one 3,979-line file. | No domain boundary enforcement for services. | SCAR P3 §H-1 |
| UI-2 | Dead components | Unused code bloats bundle and misleads developers. | 7 components have zero imports. | No periodic dead-code removal. | SCAR P3 §6.1 |
| UI-3 | Dead services | Unused service modules add maintenance surface. | 4 services + 4 providers have no UI consumer. | No consumer graph analysis in CI. | SCAR P3 §Metrics |
| UI-4 | Cross-layer imports | Architectural layering violated. | Pages imported into components. | No enforced import lint between `pages/` and `components/`. | SCAR P3 §Metrics |
| UI-5 | Hard-coded flags | Cannot safely disable features. | UI does not consume the existing feature-flag hook. | Hook was built but not wired to components. | SCAR P4 §Canonical Sources |
| UI-6 | Admin wrapper ambiguity | Developers import the wrong `systemAdminService`. | Two modules share the same name in different directories. | Naming convention did not disambiguate admin wrappers. | SCAR P3 §8.3 |
| DG-1 | Docs claim Done | Stakeholders believe admin features are complete. | Sub-phase plan marks features Done while required RPCs are missing. | Status updates were not validated against code reality. | SCAR P4 #5 |
| DG-2 | False completion log | Log claims files exist that do not. | SP-1.0 log records creation of non-existent test helpers. | Completion logs not verified against repo state. | SCAR P4 #6 |
| DG-3 | Missing constants | Plan expects constants that do not exist. | Implementation diverged from plan without plan update. | Plan and implementation not kept in sync. | SCAR P4 #7 |
| DG-4 | Stale SQL fix doc | Doc describes problems already fixed. | Doc not updated after migration was added. | No documentation lifecycle tied to migration changes. | SCAR P4 #8 |
| DG-5 | Contradictory governance | Program status is unreliable. | Two official planning tracks report opposite completion states. | No single program-management authority or reconciliation process. | SCAR P4 #9 |
| DG-6 | RPC_CONTRACTS invalid | Developers and audit trust non-existent RPCs. | Contract doc lists RPCs not in migrations. | Contract doc was treated as canonical and never regenerated from migrations. | SCAR P4 #10 |
| TA-1 | Fictional test mocks | Green tests hide production failures. | Mocks implement RPCs that the real database omits. | Tests were built against specs/docs, not canonical migrations. | SCAR P4 #11 |
| TA-2 | Audit wrong source | CI cannot detect missing RPCs. | Audit script compares code to markdown contract. | Wrong canonical source chosen for validation script. | SCAR P4 #12 |
| TA-3 | Outdated audit report | Report incorrectly flags a missing RPC. | CRIT-2 not updated after `set_tenant_subdomain` migration landed. | No report refresh tied to migration changes. | SCAR P4 #13 |
| TA-4 | CURRENT_TASK-005 wrong assumption | Task may trigger redundant work. | Task assumes 9 migrations are missing from production, but they exist locally. | Production vs. local state not verified before task creation. | SCAR P4 #14 |

---

## Strategic Recoverability

**PARTIALLY**

The project can recover, but only through a **controlled recovery program** — not through continued ad-hoc bug fixing. The core architecture is intact (97.8% RPC coverage, clean UI→service boundary, comprehensive RLS/DB design), which makes recovery realistic. However, the recoverability is partial in the sense that:

1. **Multiple layers must be reconciled simultaneously.** Migrations, services, tests, documentation, and governance all describe different systems. Fixing only the four missing RPCs leaves the SSOT fragmentation untouched.
2. **Deployment coordination is required.** The 2026 timestamp jump cannot be fixed purely in code; any deployed environment must be reconciled.
3. **Governance must be unified first.** Two contradictory program tracks cannot guide a recovery program. DG-5 is a people/process blocker, not a technical one.

Evidence: SDR §Strategic Risks #1–7; SCAR P4 §Executive Summary ("system-wide SSOT is PARTIALLY intact at best"); SCAR P1 §6.2 SSOT Score 35/100.

---

## SDR Validation

**SUPPORTED**

The SCAR evidence fully supports the SDR's conclusion that **Option B — Controlled Rebuild Program** is the correct strategic choice over Option A — Continue Fix Bug Program.

Evidence:
- The four missing RPCs are **symptoms**, not the disease. SCAR P4 §Executive Summary: "documentation, governance, and test layers describe a different system than the migrations describe."
- Option A would leave every failure-producing condition in place: the audit script would still check `RPC_CONTRACTS.md` (TA-2), tests would still mock a fictional database (TA-1), documentation would still mark broken features Done (DG-1), and the 2026 timestamp jump would still block safe hotfixes (DB-2). SDR §Option A Evaluation.
- The strong existing architecture means Option B is a **contract-level rebuild**, not an application rewrite. SDR §Option B Evaluation: "does not mean throwing away the application; it means cleaning the contract layer."
- The SDR's weighted decision matrix (Option B 7.35/10 vs. Option A 4.15/10) is grounded in the measurable SCAR findings: business risk, technical risk, TCO, schedule to trustworthy state, maintainability, operational stability, architecture integrity, and SSOT recovery.

The SDR conclusion is therefore **SUPPORTED** by the SCAR evidence.

---

## Confidence

**HIGH**

The SCAR Phase 1–4 evidence is direct, line-level, and reproducible: grep across 138 migrations confirmed zero definitions for the four missing RPCs; direct reads of `tenantService.ts`, `RPC_CONTRACTS.md`, `PLAN_AdminDashboard_SubPhases.md`, `PROGRAM_STATE.md`, and `audit-rpc-contracts.ts` produced concrete contradictions; and multiple independent passes returned the same missing-RPC set. The SRA does not introduce new findings, new scans, or business assumptions. It only classifies and synthesizes the existing evidence.

---

## Validation

Confirmed:

- **No implementation.**
- **No code changes.**
- **No migration changes.**
- **No deployment.**
- **No governance updates.**
- **No new assessment.**
- **No `CURRENT_TASK` generated.**

This analysis is a strategic validation of existing SCAR evidence only.

---

**STOP — Waiting for Program Manager.**
