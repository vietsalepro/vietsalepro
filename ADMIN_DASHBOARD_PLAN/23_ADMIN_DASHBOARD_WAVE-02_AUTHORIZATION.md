# 23_ADMIN_DASHBOARD_WAVE-02_AUTHORIZATION

**Document ID:** 23_ADMIN_DASHBOARD_WAVE-02_AUTHORIZATION  
**Date:** 2026-07-20  
**Project:** VietSalePro  
**Sub Project:** Admin Dashboard  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** B — System Remediation  
**Wave:** Wave-02  
**Acting Capacity:** Enterprise Program Management Office (PMO)  
**Baseline:** AD-Baseline-1.0  
**Repository Scope:** `C:\PROJECT\vietsalepro` @ commit `2f92be33` (post Wave-01 Closeout)  
**Repository Artifacts Modified:** None (governance authorization only)  
**Status:** Wave-02 Authorized with Observations — Engineering Kickoff Document Ready to Start  

------------------------------------------------------------------------

# 1. Executive Summary

This document is the official **Wave-02 Authorization** for Phase B of the Admin Dashboard System Remediation Program. It is issued by the Enterprise PMO. It is **not** the Engineering Kickoff, **not** implementation, **not** verification, **not** acceptance, and **not** deployment. It authorizes the second remediation wave and the production of the next governance deliverable: the Wave-02 Engineering Kickoff document.

All mandatory governance documents (`00` through `22`) were read in full. The sealed baseline `AD-Baseline-1.0` remains valid. Wave-01 is formally closed, and the repository at `HEAD` (`2f92be33`) contains only the accepted Wave-01 implementation plus tooling/documentation working-tree changes that do not affect the Admin Dashboard implementation surface.

Wave-02 is organized as a **logical remediation cluster**: the **Database, RPC, and Migration Consolidation Cluster**. This cluster was explicitly deferred from Wave-01 (`14_ADMIN_DASHBOARD_WAVE-01_AUTHORIZATION.md` Section 6.4) because it depends on the authorization and audit-trust boundary fixes delivered by Wave-01 and is required before the Service Layer, Execution, and UI waves can be safely accepted.

**Authorization Decision:**

- **Wave-02 Scope:** AUTHORIZED WITH OBSERVATIONS for the sixteen unique `AD-Baseline-1.0` issues listed in Section 5.3.
- **Engineering Kickoff Document:** READY TO START (this document authorizes its creation).
- **Engineering Kickoff Execution:** NOT YET AUTHORIZED.
- **Implementation:** NOT AUTHORIZED.
- **Overall Program Status:** ACTIVE — READY FOR WAVE-02 ENGINEERING KICKOFF.

------------------------------------------------------------------------

# 2. Mandatory Documents Reviewed

| # | Document | Role in Wave-02 Authorization | Read Status |
|---|----------|-------------------------------|-------------|
| 00 | `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` | Program charter, lifecycle, governance transition rules | Read in full |
| 01 | `01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md` | SSOT architecture baseline | Read in full |
| 02 | `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md` | Dependency and layer direction baseline | Read in full |
| 03 | `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md` | Runtime execution baseline | Read in full |
| 04 | `04_ADMIN_DASHBOARD_INVESTIGATION_PLAN.md` | Investigation methodology and capability domains | Read in full |
| 05 | `05_ADMIN_DASHBOARD_FORENSIC_EXECUTION_PROTOCOL.md` | Evidence collection protocol | Read in full |
| 06 | `06_ADMIN_DASHBOARD_FORENSIC_INVESTIGATION.md` | Forensic findings and traces | Read in full |
| 07 | `07_ADMIN_DASHBOARD_ROOT_CAUSE_ANALYSIS.md` | Root cause candidates | Read in full |
| 08 | `08_ADMIN_DASHBOARD_FINAL_RECOMMENDATIONS.md` | Enterprise recommendations | Read in full |
| 09 | `09_ADMIN_DASHBOARD_SYSTEM_INCONSISTENCY_REPORT.md` | Sealed issue catalog | Read in full |
| 10A | `10A_ADMIN_DASHBOARD_INVESTIGATION_ACCEPTANCE_IMPLEMENTATION.md` | Corrected baseline and duplicate reconciliation | Read in full |
| 10B | `10B_ADMIN_DASHBOARD_PHASE_A_CLOSEOUT.md` | Baseline sealing | Read in full |
| 11 | `11_ADMIN_DASHBOARD_PHASE_B_OPENING_AUTHORIZATION.md` | Phase B opening rules | Read in full |
| 12 | `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` | Strategic remediation portfolios and precedence | Read in full |
| 13 | `13_ADMIN_DASHBOARD_PROGRAM_OWNER_DECISION_RECORD.md` | Program Owner decisions | Read in full |
| 14 | `14_ADMIN_DASHBOARD_WAVE-01_AUTHORIZATION.md` | Wave-01 scope and deferred Wave-02 cluster | Read in full |
| 15 | `15_ADMIN_DASHBOARD_WAVE-01_ENGINEERING_KICKOFF.md` | Engineering-kickoff precedent | Read in full |
| 16 | `16_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_READINESS_REVIEW.md` | Frozen-execution-contract precedent | Read in full |
| 17 | `17_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION.md` | Package-01 implementation evidence | Read in full |
| 18 | `18_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_PACKAGE-02.md` | Package-02 implementation evidence | Read in full |
| 19 | `19_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_PACKAGE-03.md` | Package-03 implementation evidence | Read in full |
| 20 | `20_ADMIN_DASHBOARD_WAVE-01_VERIFICATION_REPORT.md` | Independent verification methodology | Read in full |
| 21 | `21_ADMIN_DASHBOARD_WAVE-01_ACCEPTANCE_REVIEW.md` | Acceptance criteria precedent | Read in full |
| 21A | `21A_ADMIN_DASHBOARD_WAVE-01_DEPLOYMENT_SYNCHRONIZATION_REPORT.md` | Deployment synchronization precedent | Read in full |
| 22 | `22_ADMIN_DASHBOARD_WAVE-01_CLOSEOUT_REPORT.md` | Wave-01 closeout, transition readiness, and observations | Read in full |

------------------------------------------------------------------------

# 3. Current Repository Review

## 3.1 Git Status

| Verification Check | Method | Result |
|---|---|---|
| HEAD commit | `git rev-parse HEAD` | `2f92be33` "docs: Wave-01 acceptance review and roadmap closeout status" |
| Wave-01 implementation integrity | `git diff --stat 0fd7e4ed..HEAD -- App.tsx contexts/AuthContext.tsx services/admin/memberAdminService.ts lib/permissions.ts supabase/functions/audit-log/index.ts` | **0 lines changed** — the accepted Wave-01 implementation is intact at `HEAD` |
| Working-tree modifications | `git diff --stat HEAD` | `.codebase-memory/artifact.json` (MCP metadata), `.codebase-memory/graph.db.zst` (MCP graph), `ADMIN_DASHBOARD_PLAN/00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` (roadmap update), `package-lock.json`/`package.json` (supabase CLI dev dependency) |
| Untracked entries | `git status --short` | Governance documentation in `ADMIN_DASHBOARD_PLAN/`, `PROJECT_MASTER_INDEX*`, `PDP-*`, `memory-zone/` operational scratch artifacts |

**Repository Stability Verdict:** The Admin Dashboard implementation has not materially changed since Wave-01 acceptance. The only uncommitted code-facing change is the addition of the `supabase` CLI dev dependency to `package.json`/`package-lock.json`, which is a tooling artifact, not an Admin Dashboard implementation change.

## 3.2 MCP Codebase Memory Verification

| Verification Check | Tool | Result |
|---|---|---|
| `isSystemAdmin` enforcement path | `codebase-memory.search_graph` | `lib/permissions.ts:isSystemAdmin` is reachable; `App.tsx` routes through it; no direct `system_admins` query in the gated path |
| `audit-log` Edge Function surface | `codebase-memory.search_graph` | `supabase/functions/audit-log/index.ts` exposes `jsonResponse`, `getClientIp`, `getRateLimitConfig`; the authenticated write guard from `EDG-001` is present in the indexed source |
| `activate_pending_memberships` flow | `codebase-memory.search_graph` | RPC `activate_pending_memberships` and `services/admin/memberAdminService.ts` are indexed; `AuthContext` call site is routed through the service wrapper |

**MCP Verdict:** The Codebase Memory graph is consistent with the accepted Wave-01 repository state. No new admin-surface defects are visible in the indexed graph at `HEAD`.

## 3.3 Agent Skills Applied

| Skill | Purpose | Status |
|---|---|---|
| `codebase-design` | Architecture/interface vocabulary for reasoning about repository seams and service-layer depth | Invoked |
| `improve-codebase-architecture` | Not available in the active skill registry for this session | Not invoked; not required for a governance-only activity |

------------------------------------------------------------------------

# 4. Baseline Verification

| Baseline Attribute | Value | Evidence |
|---|---|---|
| **Baseline Version** | `AD-Baseline-1.0` | `10B_ADMIN_DASHBOARD_PHASE_A_CLOSEOUT.md` Section 11 |
| **Baseline Status** | **SEALED** | `10B` Section 11 |
| **Effective Date** | 2026-07-20 | `10B` Section 11 |
| **Repository Commit** | `3a06a6d9` (RC-2026-07-19-01) | `10B` Section 11 |
| **Cataloged Issues** | 64 (after false-positive removal) | `10A` Section 15; `12` Section 4 |
| **Unique Remediation Issues** | 43 (after collapsing 21 duplicates) | `10A` Section 15; `12` Section 4 |
| **Issues Remediated in Wave-01** | 5 unique (`ARCH-001`, `PERM-001`, `ARCH-002`, `EXE-001`, `EDG-001`) | `22` Section 5.2; `20` Section 4 |
| **Issues Available for Wave-02** | 38 unique (43 − 5) | `22` Section 6.4; `12` Section 4 |
| **Permitted Use** | Only `AD-Baseline-1.0` may be consumed by Phase B waves | `10B` Section 12 |

**Baseline Verdict:** The sealed baseline is valid and is the only approved source of Phase B remediation issues. Wave-02 will consume only `AD-Baseline-1.0` issue IDs.

------------------------------------------------------------------------

# 5. Governance Verification

| Gate | Expected Status | Current Status | Evidence |
|---|---|---|---|
| Phase A | CLOSED | **CLOSED** | `10B` Section 1 |
| Baseline | SEALED | **SEALED** (`AD-Baseline-1.0`) | `10B` Section 11 |
| Phase B | OPEN | **OPEN** | `11` Section 1 |
| Remediation Master Plan | COMPLETE | **COMPLETE** | `12` Section 14 |
| Program Owner Decisions | COMPLETE | **COMPLETE** | `13` Section 12 |
| Wave Planning | AUTHORIZED | **AUTHORIZED** | `13` Section 8; `14` Section 6.4 |
| Wave-01 Authorization | COMPLETE | **COMPLETE** | `14` Section 1 |
| Wave-01 Engineering Kickoff | COMPLETE | **COMPLETE** | `15` Section 1 |
| Wave-01 Implementation Readiness Review | COMPLETE | **COMPLETE** | `16` Section 1 |
| Wave-01 Implementation | COMPLETE | **COMPLETE** | `17`, `18`, `19` |
| Wave-01 Verification | COMPLETE | **PASS WITH OBSERVATIONS** | `20` Section 1 |
| Wave-01 Acceptance | COMPLETE | **ACCEPTED** | `21` Section 1 |
| Wave-01 Deployment Synchronization | COMPLETE | **SYNCHRONIZED WITH OBSERVATIONS** | `21A` Section 1 |
| Wave-01 Closeout | COMPLETE | **CLOSED WITH OBSERVATIONS** | `22` Section 12 |
| Wave-02 Authorization | READY | **COMPLETE** (this document) | — |
| Engineering Kickoff | NOT AUTHORIZED | **NOT AUTHORIZED** | — |
| Implementation | NOT STARTED | **NOT STARTED** | — |
| Program Status | ACTIVE | **ACTIVE** | `00` Section 10 |

**Governance Verdict:** Every prerequisite for Wave-02 Authorization is satisfied. No implementation has started.

------------------------------------------------------------------------

# 6. Wave-02 Scope Definition

## 6.1 Design Principle

Wave-02 is organized as the **Database, RPC, and Migration Consolidation Cluster**. This follows the approved Program Owner Decisions and the domain precedence in `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` Section 7.1:

- **Decision 1 — Hybrid SSOT Drift Strategy:** Wave-02 inventories and ratifies post-SSOT database/migration drift. It does not blindly accept or roll back the 29 post-SSOT migrations; it consolidates the duplicated/overloaded objects they created.
- **Decision 2 — Incremental Domain Strategy:** Wave-02 closes a single logical domain slice (Database, Migration, RPC) as one independently verifiable deliverable. It does not refactor the Service Layer, UI, or remaining Edge Functions.
- **Precedence Rule 3:** Database and Migration consolidation must precede RPC/Edge-Function and Service-Layer waves that depend on a clean schema.
- **Precedence Rule 4:** RPC remediation depends on the corrected schema and permission model delivered by Wave-01 and the migration consolidation delivered by Wave-02.

## 6.2 Scope Selection Criteria

Only issues that satisfy **all** of the following are in Wave-02:

| Criterion | Application |
|---|---|
| **Required by downstream waves** | Database/Migration consolidation is a prerequisite for Service Layer (`SVC-001`–`SVC-005`), Business Logic (`BL-001`–`BL-003`), Execution (`EXE-002`, `VAL-001`, `DIR-001`–`DIR-002`), and UI (`UI-001`–`UI-003`) waves. |
| **Highest architectural dependency** | Duplicate RPCs and missing log RPCs block canonical service contracts and audit-trust completion. |
| **No UI or operational-app regression** | Changes are confined to `supabase/schema.sql`, `supabase/migrations/*.sql`, and any `services/admin/*.ts` call sites that must align to consolidated RPC signatures. |
| **Preserves backward compatibility** | Overloaded RPCs are consolidated without removing data; missing RPCs are added; migrations are reconciled without data loss. |
| **Evidence-based from `AD-Baseline-1.0`** | Every issue is a confirmed `AD-Baseline-1.0` finding with a canonical ID. |

## 6.3 Issues Authorized for Wave-02

The Wave-02 scope consumes **16 unique `AD-Baseline-1.0` issues** (after duplicate folding). The catalog IDs below are the canonical issue IDs; folded duplicates are shown in Section 6.4.

| # | Issue ID | Severity | Category | Reason for Inclusion | Dependencies | Expected Outcome | Repository Impact |
|---|---|---|---|---|---|---|---|
| 1 | **DB-001** | High | Database / RPC Drift | `update_tenant` has 7 overloads in `supabase/schema.sql`. Canonical for `RPC-001` and `DRIFT-002`. Blocks canonical `tenantAdminService` contracts. | `ARCH-001`/`PERM-001` accepted (single `isSystemAdmin()` path). | A single authoritative `update_tenant` RPC remains; dead overloads removed or renamed. | `supabase/schema.sql`; `supabase/migrations/*.sql` |
| 2 | **DB-002** | High | Database / RPC Drift | `update_tenant_subscription` has 3 overloads. Distinct from `DB-001` (different RPC). | `DB-001` consolidation pattern established. | A single authoritative `update_tenant_subscription` RPC remains. | `supabase/schema.sql`; `supabase/migrations/*.sql` |
| 3 | **DB-003** | High | Database / RPC Drift | `create_tenant_with_admin` has 3 overloads. Distinct from `DB-001`/`DB-002`. | `DB-001` consolidation pattern established. | A single authoritative `create_tenant_with_admin` RPC remains. | `supabase/schema.sql`; `supabase/migrations/*.sql` |
| 4 | **DB-004** | High | Database / Audit Gap | Missing audit triggers on `system_admins`, `invitations`, and `licenses`. Canonical for `SEC-005`. | `EDG-001`/`PERM-001` accepted (audit-trust boundary). | Privileged mutations on these tables generate `app_audit_log` rows. | `supabase/schema.sql`; `supabase/migrations/*.sql` |
| 5 | **DB-005** | Medium | Database / Realtime | `admin_events` table is fed only by cron task. | `PERM-003` deferred; `DB-004` audit triggers may feed `admin_events`. | `admin_events` producer surface documented and/or trigger-enriched. | `supabase/schema.sql`; `supabase/migrations/*.sql` |
| 6 | **DB-006** | High | Database / RPC | `get_admin_audit_logs` RPC is missing. | `DB-004` triggers in place; `RPC-003` aggregate covers this. | `get_admin_audit_logs` RPC available and callable. | `supabase/schema.sql`; `supabase/migrations/*.sql` |
| 7 | **DB-007** | Medium | Database / RPC | `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs` RPCs are missing. | `RPC-003` (aggregate missing-RPC finding) accepted. | The three missing log RPCs are available and callable. | `supabase/schema.sql`; `supabase/migrations/*.sql` |
| 8 | **DB-009** | Low | Database / Audit Gap | LOGIN/LOGOUT events are not trigger-enforced. | `DB-004` audit-trigger pattern established. | LOGIN/LOGOUT audit entries are enforced by trigger or equivalent mechanism. | `supabase/schema.sql`; `supabase/migrations/*.sql` |
| 9 | **RPC-002** | Medium | RPC / Security | Privileged RPCs use `SECURITY INVOKER` instead of `SECURITY DEFINER`. Distinct from `BL-003` (no explicit `Same as` body statement). | `ARCH-001`/`PERM-001` accepted. | Privileged RPCs execute as `SECURITY DEFINER` with `is_system_admin()` guard. | `supabase/schema.sql`; `supabase/migrations/*.sql` |
| 10 | **RPC-003** | High | RPC Inconsistency | Four expected log RPCs are missing (aggregate spanning `DB-006`/`DB-007`). | `DB-001`–`DB-003` consolidation complete. | Missing log RPCs (`get_admin_audit_logs`, `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs`) are implemented. | `supabase/schema.sql`; `supabase/migrations/*.sql` |
| 11 | **RPC-004** | Low | RPC Inconsistency | `search_tenants` / `get_tenants_admin` overload ambiguity. Possible confidence. | `DB-001`–`DB-003` consolidation complete. | Search/admin list RPC signatures are unambiguous. | `supabase/schema.sql`; `supabase/migrations/*.sql` |
| 12 | **MIG-001** | High | Migration Inconsistency | 21 `_fix_` migrations exist. | Program Owner Decision 1 (Hybrid Drift Strategy). | Fix migrations are consolidated or justified with evidence. | `supabase/migrations/*.sql` |
| 13 | **MIG-002** | High | Repository Drift | 29 post-SSOT-baseline migrations exist. Canonical for `DRIFT-001`. | Program Owner Decision 1. | Post-SSOT migrations are inventoried, ratified, or retired. | `supabase/migrations/*.sql` |
| 14 | **MIG-003** | Low | Migration Inconsistency | Non-standard timestamp filename `20260710064509_f33_members_search_rpc.sql`. | `MIG-001`/`MIG-002` reconciliation. | Migration filename conforms to program naming convention or is justified. | `supabase/migrations/*.sql` |
| 15 | **MIG-004** | Medium | Migration Inconsistency | Missing `20260713000002` sequence entry. | `MIG-002` reconciliation. | Migration sequence is deterministic; missing entry resolved. | `supabase/migrations/*.sql` |
| 16 | **DRIFT-003** | Low | Repository Drift | Custom domain uses Edge Function, not listed RPC. Distinct from `DEP-004`. | Program Owner Decision 1. | Custom-domain flow is documented and either RPC-aligned or explicitly accepted. | `services/admin/tenantAdminService.ts` (documentation/comment only) |

## 6.4 Duplicate Accounting

The 43-unique view is used for wave sizing. The sixteen issues above are represented by **nineteen cataloged entries** due to cross-categorized duplicates that are folded into canonical Wave-02 issues:

| Canonical Issue | Folded Duplicate | Relationship |
|---|---|---|
| `DB-001` | `RPC-001` | Same `update_tenant` overload finding |
| `DB-001` | `DRIFT-002` | Same `update_tenant` signature drift |
| `DB-004` | `SEC-005` | Same missing-audit-triggers finding |
| `MIG-002` | `DRIFT-001` | Same post-SSOT migration drift |

All four duplicates are in-scope through their canonical issues and require no separate implementation.

## 6.5 Out-of-Scope Issues

The following `AD-Baseline-1.0` issues are explicitly out of scope for Wave-02. They will be addressed in later waves per `14` Section 6.4 and `12` Section 7.

| Out-of-Scope Cluster | Issues | Reason |
|---|---|---|
| Architecture / UI route cleanup | `ARCH-003`, `ARCH-004`, `ARCH-005`, `ARCH-006`, `UI-001`–`UI-003`, `DEAD-001`–`DEAD-004` | Depends on stabilized service and RPC contracts. |
| Service-layer contract | `SVC-001`–`SVC-005`, `DEP-002`–`DEP-004` | Requires canonical RPCs and permission model from Wave-02. |
| Business logic / execution | `BL-001`–`BL-003`, `EXE-002`, `VAL-001`, `VAL-002`, `DIR-001`–`DIR-002` | Requires database/RPC consolidation to be complete first. |
| Edge Function hardening | `EDG-002`–`EDG-005` | `EDG-001` model must be accepted; service-layer audit contracts must be stable. |
| Performance | `PERF-001`–`PERF-002` | Cleanup after underlying architecture is correct. |
| Permission remaining | `PERM-003` | `admin_events` producer policy depends on database audit-trigger work. |

## 6.6 Repository Boundaries (Frozen)

The following artifacts are **in scope** for Wave-02 implementation:

- `supabase/schema.sql` — for RPC consolidation, trigger additions, and `CREATE OR REPLACE FUNCTION` cleanup.
- `supabase/migrations/*.sql` — for migration reconciliation, fix-migration consolidation, and new migration files.
- `services/admin/*.ts` — **only** for RPC call-site signature alignment required by `DB-001`/`DB-002`/`DB-003`/`RPC-004`; no service-layer redesign.

The following artifacts are **out of scope**:

- `App.tsx`, `contexts/AuthContext.tsx` (Wave-01 completed; no regression).
- `lib/permissions.ts` (reference only; no changes).
- `supabase/functions/*` (except documented impact of `DB-004` triggers on `audit-log`; no Edge Function implementation).
- `pages/admin/*`, `components/admin/*`, `components/*` UI files.
- Any `services/*.ts` base service logic beyond signature alignment.

------------------------------------------------------------------------

# 7. Dependency Analysis

## 7.1 Prerequisites

| # | Prerequisite | Evidence |
|---|---|---|
| 1 | Phase A closed | `10B` Section 1 |
| 2 | `AD-Baseline-1.0` sealed | `10B` Section 11 |
| 3 | Phase B open | `11` Section 11.1 |
| 4 | Remediation Master Plan complete | `12` Section 14 |
| 5 | All four Program Owner decisions recorded | `13` Section 12 |
| 6 | Wave-01 formally closed | `22` Section 12 |
| 7 | Wave-01 repository state intact | Section 3.1 of this document |
| 8 | Wave-02 Engineering Kickoff document not yet produced | Current state |

## 7.2 In-Wave Dependencies

| Consumer | Provider | Relationship |
|---|---|---|
| `DB-002` / `DB-003` | `DB-001` | Consolidation pattern established for `update_tenant` first. |
| `DB-006` / `DB-007` | `DB-004` | Audit triggers must exist before log RPCs can return consistent data. |
| `RPC-003` | `DB-006` / `DB-007` | Aggregate missing-RPC finding is realized by implementing the underlying database functions. |
| `DB-004` | `RPC-002` | Audit triggers on privileged tables are most effective when privileged RPCs execute as `SECURITY DEFINER`. |
| `MIG-001` / `MIG-002` | `DB-001`–`DB-003` | Migration reconciliation must account for schema objects created by the duplicate RPCs. |
| `MIG-004` | `MIG-002` | Missing sequence entry is resolved during post-SSOT migration inventory. |

## 7.3 Downstream Dependencies on Wave-02

Downstream waves cannot be accepted unless the following Wave-02 outcomes are verified:

- `DB-001`/`DB-002`/`DB-003` resolved → Service Layer and Business Logic waves can call a single canonical RPC per operation.
- `DB-006`/`DB-007`/`RPC-003` resolved → Audit/Compliance UI and service wrappers have the missing log RPCs.
- `DB-004`/`DB-009` resolved → Security/Edge-Function waves have trigger-enforced audit events.
- `MIG-001`/`MIG-002` resolved → Database/Edge-Function changes are reproducible across environments.

------------------------------------------------------------------------

# 8. Wave Objectives

## 8.1 Primary Objective

Eliminate the sixteen unique `AD-Baseline-1.0` issues in the **Database, RPC, and Migration Consolidation Cluster** (`DB-001`–`DB-009` excluding `DB-008`, `RPC-001`–`RPC-004`, `MIG-001`–`MIG-004`, `DRIFT-001`–`DRIFT-003`) without introducing regression, scope creep, or new undocumented drift.

## 8.2 Secondary Objectives

1. Establish a single authoritative version of `update_tenant`, `update_tenant_subscription`, and `create_tenant_with_admin`.
2. Implement the four missing log RPCs (`get_admin_audit_logs`, `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs`).
3. Add missing audit triggers on `system_admins`, `invitations`, and `licenses`, and enforce LOGIN/LOGOUT audit entries.
4. Reconcile fix migrations and post-SSOT migration drift into a deterministic, ordered chain.
5. Produce the Wave-02 Engineering Kickoff document for the next governance gate.

## 8.3 Success Criteria

| # | Criterion | Evidence Required |
|---|---|---|
| 1 | No duplicate `CREATE OR REPLACE FUNCTION` definitions for `update_tenant`, `update_tenant_subscription`, or `create_tenant_with_admin` | File read of `supabase/schema.sql` and `supabase/migrations/*.sql` |
| 2 | `get_admin_audit_logs`, `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs` exist and are callable | Function inventory and tests |
| 3 | Audit triggers on `system_admins`, `invitations`, and `licenses` are present and active | Schema inspection / trigger list |
| 4 | LOGIN/LOGOUT audit enforcement is present | Schema inspection / trigger list |
| 5 | Privileged RPCs use `SECURITY DEFINER` with `is_system_admin()` guard | File read of `supabase/schema.sql` |
| 6 | Migration chain is deterministic (no missing sequence entries; non-standard filename resolved) | `supabase/migrations/` inventory |
| 7 | Fix migrations (`_fix_`) and post-SSOT migrations are inventoried and ratified or retired | Migration reconciliation report |
| 8 | All sixteen canonical issue IDs are traceably resolved | Verification report references the issue IDs |
| 9 | Deployment Synchronization gate completed before Closeout | `23A` or equivalent deployment synchronization report |

## 8.4 Exit Criteria

- Independent Verification Report declares **PASS** or **PASS WITH OBSERVATIONS**.
- Acceptance Review declares **ACCEPTED**.
- Deployment Synchronization Report declares **SYNCHRONIZED** (or **SYNCHRONIZED WITH OBSERVATIONS**) for a non-production environment.
- No Critical or High severity regressions introduced.
- Repository remains the sole System Source of Truth.
- `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` Section 10 is updated with Wave-02 status at Closeout.

------------------------------------------------------------------------

# 9. Risk and Priority

| Attribute | Value | Justification |
|---|---|---|
| **Priority** | **High** | Database/Migration drift blocks every downstream service, execution, and UI wave. |
| **Risk Level** | **High** | Schema consolidation can affect callers and migration chains. High risk is mitigated by a frozen execution contract and non-production deployment synchronization. |
| **Primary Risks** | Duplicate RPC removal may break existing call sites; migration reconciliation may expose environment drift; `SECURITY DEFINER` changes may affect permissions. | `12` Section 9 |
| **Mitigations** | Restrict changes to `supabase/schema.sql` and `supabase/migrations/*.sql`; align call sites only as needed; perform Deployment Synchronization on Staging before acceptance; require independent verification. | This authorization |

------------------------------------------------------------------------

# 10. Estimated Packages

Wave-02 is expected to be implemented in **three packages** to keep each package independently verifiable and low-regression:

| Package | Issues | Theme | Expected Deliverables |
|---|---|---|---|
| **Package-01** | `DB-001`, `DB-002`, `DB-003`, `RPC-001`, `RPC-004`, `DRIFT-002` | Duplicate RPC consolidation | Single authoritative `update_tenant`, `update_tenant_subscription`, `create_tenant_with_admin` RPCs; unambiguous search/admin list signatures |
| **Package-02** | `DB-004`, `DB-006`, `DB-007`, `DB-009`, `RPC-003`, `SEC-005` | Audit triggers and missing log RPCs | Audit triggers on `system_admins`/`invitations`/`licenses`; LOGIN/LOGOUT enforcement; `get_admin_audit_logs`, `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs` |
| **Package-03** | `MIG-001`, `MIG-002`, `MIG-003`, `MIG-004`, `DRIFT-001`, `DRIFT-003`, `RPC-002` | Migration reconciliation and security context | Fix-migration/post-SSOT inventory; missing sequence entry; non-standard filename; `SECURITY DEFINER` alignment; custom-domain drift documentation |

Package sequencing is advisory; the Engineering Kickoff document may refine sequencing and parallelization while remaining inside the frozen issue set.

------------------------------------------------------------------------

# 11. Frozen Execution Contract

This authorization **freezes** the Wave-02 execution contract. Until a formal change request is approved by the Program Owner and the PMO:

1. Only the sixteen canonical `AD-Baseline-1.0` issue IDs listed in Section 6.3 may be implemented.
2. Only the files and directories listed in Section 6.6 may be modified, except for signature-alignment changes in `services/admin/*.ts` directly required by `DB-001`–`DB-003`/`RPC-004`.
3. No new migrations may be added unless they are required to implement an in-scope issue and are named according to the program convention.
4. No Edge Function implementation is authorized.
5. No UI or operational-app page changes are authorized.
6. Every implementation commit must reference one or more `AD-Baseline-1.0` issue IDs and one or more SSOT document sections.
7. No changes may be deployed to Production as part of Wave-02 implementation; Deployment Synchronization targets Staging only.
8. Any deviation requires a written change request, PMO review, and updated Wave-02 Authorization.

------------------------------------------------------------------------

# 12. Governance Update — Deployment Synchronization Mandatory Gate

Per the operational lesson from Wave-01 and the recommendation in `22_ADMIN_DASHBOARD_WAVE-01_CLOSEOUT_REPORT.md` Section 10, the Phase B lifecycle is hereby updated for Wave-02 and all subsequent waves:

```text
Authorization
↓
Engineering Kickoff
↓
Implementation Readiness Review
↓
Implementation
↓
Independent Verification
↓
Acceptance
↓
Deployment Synchronization  ← MANDATORY GATE
↓
Closeout
```

**Deployment Synchronization Gate Requirements:**

- The repository remains the sole System Source of Truth.
- A non-production environment (Staging or equivalent) is synchronized from the accepted repository revision.
- Production is not modified or used as a source.
- Environment differences outside the wave scope are documented and classified as non-blocking.
- The Deployment Synchronization Report is produced and reviewed before Wave Closeout.

This change does not alter any completed Wave-01 governance records; it applies prospectively from Wave-02 onward.

------------------------------------------------------------------------

# 13. Observations

The following observations are non-blocking and do not impede Wave-02 Authorization:

| # | Observation | Source | Classification |
|---|---|---|---|
| 1 | `supabase` CLI dev dependency remains in `package.json`/`package-lock.json` from Wave-01 tooling | `20` Section 7.1; `21` Section 3.12; `22` Section 6 | Operational Observation |
| 2 | Non-Wave-01 Edge Function inventory differences between Staging and Production remain | `21A` Section 9.1; `22` Section 6 | Out of Scope for Wave-02 |
| 3 | Applied migration histories and patch versions differ between Staging and Production | `21A` Section 9.3–9.4; `22` Section 6 | Operational Observation — Wave-02 must not assume identical environments |
| 4 | Pre-existing `npm run lint` failure in `archive/temporary/memory-zone/scripts/migrate_capitalize_product_names.ts` | `20` Section 7.3; `22` Section 6 | Technical Debt — outside wave scope |
| 5 | `.codebase-memory` graph metadata is uncommitted working-tree noise | Current `git status` | MCP Metadata — not an implementation artifact |

**Observations Verdict:** All observations are non-blocking. Wave-02 Authorization is not impeded.

------------------------------------------------------------------------

# 14. Deliverables

| # | Deliverable | Owner | Gate |
|---|---|---|---|
| 1 | `24_ADMIN_DASHBOARD_WAVE-02_ENGINEERING_KICKOFF.md` | PMO | Engineering Kickoff |
| 2 | `25_ADMIN_DASHBOARD_WAVE-02_IMPLEMENTATION_READINESS_REVIEW.md` | PMO | Implementation Readiness |
| 3 | `26_ADMIN_DASHBOARD_WAVE-02_IMPLEMENTATION.md` (and package documents as needed) | Implementation Engineer | Implementation |
| 4 | `27_ADMIN_DASHBOARD_WAVE-02_VERIFICATION_REPORT.md` | Independent Verifier | Independent Verification |
| 5 | `28_ADMIN_DASHBOARD_WAVE-02_ACCEPTANCE_REVIEW.md` | Acceptance Review Board | Acceptance |
| 6 | `28A_ADMIN_DASHBOARD_WAVE-02_DEPLOYMENT_SYNCHRONIZATION_REPORT.md` | Release Manager | Deployment Synchronization |
| 7 | `29_ADMIN_DASHBOARD_WAVE-02_CLOSEOUT_REPORT.md` | PMO | Closeout |
| 8 | Updated `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` Section 10 (at Closeout only) | PMO | Closeout |

------------------------------------------------------------------------

# 15. Authorization Decision

## 15.1 Certification

The Enterprise PMO certifies:

- All mandatory governance documents (`00` through `22`) have been reviewed.
- The current repository has been reviewed via `git` and `codebase-memory` MCP.
- The sealed `AD-Baseline-1.0` baseline remains valid.
- Remaining issues are identified from `AD-Baseline-1.0` evidence only.
- Wave-02 scope is authorized and the execution contract is frozen.
- The governance lifecycle is updated to include mandatory Deployment Synchronization.
- The program roadmap will be updated to reflect Wave-02 Authorization completion.

## 15.2 Decision

**AUTHORIZED WITH OBSERVATIONS**

Wave-02 of the Admin Dashboard System Remediation Program is authorized to proceed to Engineering Kickoff. The Wave-02 scope is the Database, RPC, and Migration Consolidation Cluster, comprising sixteen unique `AD-Baseline-1.0` issues. Implementation is not authorized until the Engineering Kickoff and Implementation Readiness Review gates are complete. All observations are documented and non-blocking.
