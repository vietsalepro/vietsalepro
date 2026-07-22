# 14_ADMIN_DASHBOARD_WAVE-01_AUTHORIZATION

**Document ID:** 14_ADMIN_DASHBOARD_WAVE-01_AUTHORIZATION
**Date:** 2026-07-20
**Program:** Admin Dashboard System Remediation Program
**Phase:** B — System Remediation
**Wave:** Wave-01
**Acting Capacity:** Enterprise Program Management Office (PMO)
**Baseline:** AD-Baseline-1.0
**Repository Scope:** `C:\PROJECT\vietsalepro` @ commit `3a06a6d9` (RC-2026-07-19-01)
**Repository Artifacts Modified:** None (governance authorization only)
**Status:** Wave-01 Authorized — Engineering Kickoff Document Ready to Start

------------------------------------------------------------------------

# 1. Executive Summary

This document is the official **Wave-01 Authorization** for Phase B of the Admin Dashboard System Remediation Program. It is issued by the Enterprise PMO. It is **not** the Engineering Kickoff, **not** implementation, **not** verification, and **not** acceptance. It authorizes the first remediation wave and the production of the next governance deliverable: the Wave-01 Engineering Kickoff document.

All mandatory governance documents (`00`, `10A`, `10B`, `11`, `12`, `13`) have been read in full. The sealed baseline `AD-Baseline-1.0` remains valid, and the repository has not materially changed at commit `3a06a6d9`. Phase A is closed, the baseline is sealed, Phase B is open, the Remediation Master Plan is complete, and all four Program Owner decisions are recorded.

Wave-01 is organized as a **risk cluster**, not by individual architectural domain, in accordance with the approved Program Owner Decisions. The selected risk cluster is the **Admin Authentication and Audit-Trust Boundary Risk Cluster**. It contains every `AD-Baseline-1.0` issue that satisfies the Wave-01 entry criteria: Critical severity, highest architectural dependency, required by downstream waves, low regression footprint, and maximum production stability improvement.

**Authorization Decision:**

- **Wave-01 Scope:** AUTHORIZED for the five Critical unique issues listed in Section 5.
- **Engineering Kickoff Document:** READY TO START (this document authorizes its creation).
- **Engineering Kickoff Execution:** NOT YET AUTHORIZED.
- **Implementation:** NOT AUTHORIZED.
- **Overall Program Status:** ACTIVE.

------------------------------------------------------------------------

# 2. Repository Verification

| Verification Check | Method | Result |
|---|---|---|
| Sealed commit integrity | `git log --oneline -1` | HEAD = `3a06a6d9` "Production governance baseline before cutover (RC-2026-07-19-01)" — identical to the commit referenced by all governance documents `00`–`13` |
| Admin Dashboard implementation drift | `git diff --stat 3a06a6d9 -- App.tsx contexts lib services/admin supabase/schema.sql supabase/migrations supabase/functions` | **0 lines changed** — implementation baseline intact |
| Tracked working-tree changes | `git status --short` | Only `.codebase-memory/*`, `package.json`, and `package-lock.json` modified — MCP graph metadata and dependency manifests, not Admin Dashboard implementation artifacts |
| Untracked entries | `git status` | Governance documentation (`ADMIN_DASHBOARD_PLAN/`, `PROJECT_MASTER_INDEX*`, etc.) and `memory-zone/` scratch artifacts; none are Admin Dashboard implementation artifacts |

**Repository Stability Verdict:** The repository has **not** materially changed with respect to the Admin Dashboard implementation. The sealed baseline at commit `3a06a6d9` remains intact. No repository modification has occurred for Wave-01.

------------------------------------------------------------------------

# 3. Baseline Verification

| Baseline Attribute | Value | Evidence |
|---|---|---|
| **Baseline Version** | `AD-Baseline-1.0` | `10B_ADMIN_DASHBOARD_PHASE_A_CLOSEOUT.md` Section 11 |
| **Baseline Status** | **SEALED** | `10B` Section 11 |
| **Effective Date** | 2026-07-20 | `10B` Section 11 |
| **Repository Commit** | `3a06a6d9` (RC-2026-07-19-01) | `10B` Section 11; re-verified in Section 2 above |
| **Cataloged Issues** | 64 (after false-positive removal) | `10A` Section 15; `12` Section 4 |
| **Unique Remediation Issues** | 43 (after collapsing 21 duplicates) | `10A` Section 15; `12` Section 4 |
| **Severity Distribution (Unique)** | Critical 5 / High 13 / Medium 14 / Low 11 = 43 (with `EXE-001` escalated to Critical) | `13` Section 10; `12` Section 4 adjusted by Decision 4 |
| **Permitted Use** | Only `AD-Baseline-1.0` may be consumed by Phase B waves | `10B` Section 12, Entry Condition 1 |
| **False Positives Removed** | `DB-008`, `DIR-003`, `DEP-001` | `10A` Section 6; `10B` Section 9 |

**Baseline Verdict:** The sealed baseline remains valid and is the only approved source of Phase B remediation issues.

------------------------------------------------------------------------

# 4. Governance Verification

| Gate | Expected Status | Current Status | Evidence |
|---|---|---|---|
| Phase A | CLOSED | **CLOSED** | `10B` Section 1 |
| Baseline | SEALED | **SEALED** (`AD-Baseline-1.0`) | `10B` Section 11 |
| Phase B | OPEN | **OPEN** | `11` Section 1 |
| Remediation Master Plan | COMPLETE | **COMPLETE** | `12` Section 1 and Section 14 |
| Program Owner Decisions | COMPLETE | **COMPLETE** | `13` Sections 6–7 and Section 12 |
| Wave Planning | AUTHORIZED | **AUTHORIZED** | `13` Section 8 |
| Wave-01 Authorization | READY TO START | **COMPLETE** (this document) | — |
| Engineering Kickoff | NOT AUTHORIZED | **NOT AUTHORIZED** | — |
| Implementation | NOT STARTED | **NOT STARTED** | — |
| Program Status | ACTIVE | **ACTIVE** | `00` Section 10 |

**Governance Verdict:** Every prerequisite for Wave-01 Authorization is satisfied. No implementation has started.

------------------------------------------------------------------------

# 5. Wave-01 Scope Definition

## 5.1 Design Principle

Wave-01 is organized as a **risk cluster**: the **Admin Authentication and Audit-Trust Boundary Risk Cluster**. This implements the approved Program Owner Decisions:

- **Decision 1 — Hybrid SSOT Drift Strategy:** Wave-01 does not reconcile the full 29 post-SSOT migration drift. It confines repository changes to the trust boundary and produces no new undocumented schema objects.
- **Decision 2 — Incremental Domain Strategy:** Wave-01 closes a cross-domain slice (Architecture, Permission, Security, Execution, Edge Functions) as one independently verifiable deliverable. Other domains are deferred.
- **Decision 3 — EDG-001 Highest Priority:** `EDG-001` is included in Wave-01 and is the highest-priority item within the wave.
- **Decision 4 — EXE-001 Critical:** `EXE-001` is escalated to Critical and included in Wave-01.

## 5.2 Scope Selection Criteria

Only issues that satisfy **all** of the following are in Wave-01:

| Criterion | Application |
|---|---|
| **Critical severity** | All issues are Critical in the 43-unique view (after `EXE-001` escalation). |
| **Highest architectural dependency** | Each issue blocks or enables multiple downstream `AD-Baseline-1.0` issues across Security, Permission, Execution, and Edge Functions. |
| **Required by downstream waves** | Resolution of this cluster is a prerequisite for Service-Layer, RPC, Database, UI, and remaining Edge-Function waves. |
| **Lowest regression risk** | Changes are localized to `App.tsx`, `contexts/AuthContext.tsx`, `services/admin/memberAdminService.ts`, and `supabase/functions/audit-log/index.ts`. |
| **Maximum production stability improvement** | Fixes the admin gate, the audit-trust boundary, and the membership activation path — the three most production-sensitive trust boundaries. |

## 5.3 Issues Authorized for Wave-01

| # | Issue ID | Category | Reason for Inclusion | Dependencies | Expected Outcome | Repository Impact | Out-of-Scope Justification |
|---|---|---|---|---|---|---|---|
| 1 | **ARCH-001** | Architecture / Security | Admin gate bypasses `isSystemAdmin()` helper; creates a second, client-side authorization path. Highest dependency: blocks `SEC-001`, `PERM-001`, and `EXE-002`. | None within Wave-01. Blocks `SEC-001` (folded duplicate), `PERM-001`, `EXE-002`. | `App.tsx` uses `lib/permissions.ts:isSystemAdmin()` exclusively; `is_system_admin` RPC becomes the single enforcement path. | `App.tsx` (lines 212-216), `lib/permissions.ts` (reference) | Folded duplicate `SEC-001` is addressed through `ARCH-001`. Broader permission refactoring (`PERM-003`, service-layer helpers) is deferred to later waves. |
| 2 | **PERM-001** | Permission | Two enforcement paths for the system-admin check exist (`lib/permissions.ts` RPC and `App.tsx` direct `system_admins` query). Distinct from `ARCH-001` because the risk is the duplicated policy surface, not the bypass location. | `ARCH-001` provides the canonical enforcement path. | A single, canonical system-admin enforcement path remains. `App.tsx` direct query removed. | `App.tsx`, `lib/permissions.ts` | `PERM-003` (`admin_events` RLS) and dead `services/admin/permissions.ts` are out of scope for Wave-01. |
| 3 | **ARCH-002** | Architecture / Execution | `AuthContext` performs a business write (`activate_pending_memberships` RPC) directly, violating the SSOT service-layer contract. | `EXE-001` shares the same code path and will be co-remediated. | Membership activation is routed through `services/admin/memberAdminService.ts`. | `contexts/AuthContext.tsx`, `services/admin/memberAdminService.ts` | Full service-layer refactoring (`SVC-001`–`SVC-005`, `BL-001`, `DEP-002`–`DEP-004`) is out of scope. |
| 4 | **EXE-001** | Execution | Silent `.catch(() => {})` on `activate_pending_memberships` hides activation failures. Escalated to Critical by Program Owner Decision 4. | `ARCH-002` must be co-remediated to move the RPC call into the service layer before error handling can be enforced. | Failed membership activations are surfaced (logged or reported) and no longer silently swallowed. | `contexts/AuthContext.tsx`, `services/admin/memberAdminService.ts` | Broader execution/validation fixes (`VAL-001`, `DIR-001`, `DIR-002`, `BL-002`) are out of scope. |
| 5 | **EDG-001** | Edge Function / Security | `audit-log` Edge Function is unauthenticated and writes to `app_audit_log` with a service-role client. Highest priority by Program Owner Decision 3. | None within Wave-01. Blocks `EDG-005`, `PERM-002`, `SEC-002`. | `audit-log` validates caller identity (JWT, internal secret, or equivalent approved model) before processing writes. | `supabase/functions/audit-log/index.ts` | Folded duplicates `SEC-002` and `PERM-002` are addressed through `EDG-001`. Widespread Edge-Function audit logging (`EDG-005`) is deferred. |

## 5.4 Duplicate Accounting

The 43-unique view is used for wave sizing. The five issues above are represented by **seven cataloged entries** due to two cross-categorized duplicates that are folded into canonical Wave-01 issues:

| Canonical Issue | Folded Duplicate | Relationship |
|---|---|---|
| `ARCH-001` | `SEC-001` | Same direct `system_admins` query in `App.tsx` |
| `EDG-001` | `PERM-002` | Same unauthenticated `audit-log` finding |
| `EDG-001` | `SEC-002` | Same unauthenticated `audit-log` finding |

All three duplicates are in-scope through their canonical issues and require no separate implementation.

## 5.5 Out-of-Scope Issues

All remaining `AD-Baseline-1.0` issues are out of scope for Wave-01. The most significant deferred clusters are:

- **Database/RPC drift:** `DB-001`–`DB-007`, `RPC-001`–`RPC-004`, `MIG-001`, `MIG-002`, `DRIFT-001`–`DRIFT-003`
- **Service-layer contract:** `SVC-001`–`SVC-005`, `BL-001`–`BL-003`, `DEP-002`–`DEP-004`
- **UI/Route cleanup:** `UI-001`–`UI-003`, `ARCH-003`, `ARCH-004`
- **Audit-log breadth:** `EDG-005` (only `EDG-001` authentication is in scope)
- **Dead code and performance:** `DEAD-001`–`DEAD-004`, `PERF-001`–`PERF-002`
- **Monitoring/Health and Configuration domain completion** (Program Owner Decision 2)

These issues are explicitly deferred because they do not satisfy all Wave-01 criteria, depend on the trust-boundary fixes in Wave-01, and would increase regression risk if bundled into the first wave.

------------------------------------------------------------------------

# 6. Dependency Analysis

## 6.1 Prerequisites

| # | Prerequisite | Evidence |
|---|---|---|
| 1 | Phase A closed | `10B` Section 1 |
| 2 | `AD-Baseline-1.0` sealed | `10B` Section 11 |
| 3 | Phase B open | `11` Section 11.1 |
| 4 | Remediation Master Plan complete | `12` Section 14 |
| 5 | All four Program Owner decisions recorded | `13` Section 12 |
| 6 | Wave Planning authorized | `13` Section 8 |
| 7 | Repository stable at `3a06a6d9` | Section 2 of this document |
| 8 | Wave-01 Engineering Kickoff document not yet produced | Current state |

## 6.2 In-Wave Dependencies

| Consumer | Provider | Relationship |
|---|---|---|
| `EXE-001` | `ARCH-002` | Error handling can only be enforced after the `activate_pending_memberships` call is moved to a service wrapper. |
| `PERM-001` | `ARCH-001` | The single enforcement path is realized by making `App.tsx` use `lib/permissions.ts:isSystemAdmin()`. |
| `SEC-001` | `ARCH-001` | Addressed by `ARCH-001` remediation. |
| `PERM-002`, `SEC-002` | `EDG-001` | Addressed by `EDG-001` remediation. |

## 6.3 Blocking Issues for Wave-01

None. Wave-01 issues are foundational and have no internal blockers other than the ordering within `AuthContext` described above.

## 6.4 Issues Deferred to Future Waves

| Future Wave | Deferred Issues | Reason for Deferral |
|---|---|---|
| Wave-02 (Database/RPC consolidation) | `DB-001`–`DB-007`, `RPC-001`–`RPC-004`, `MIG-001`, `MIG-002`, `DRIFT-001`–`DRIFT-003` | Requires the Hybrid SSOT Drift Strategy to inventory and ratify post-SSOT objects; not a trust-boundary fix. |
| Wave-03 (Service-layer contract) | `SVC-001`–`SVC-005`, `BL-001`–`BL-003`, `DEP-002`–`DEP-004` | Requires canonical RPCs and permission model from Wave-01 and Wave-02. |
| Wave-04 (Edge Function hardening) | `EDG-002`–`EDG-005` | `EDG-001` authentication model must be accepted before broad audit-logging rollout. |
| Wave-05 (UI/Operational cleanup) | `UI-001`–`UI-003`, `ARCH-003`, `ARCH-004`, `DEAD-001`–`DEAD-004`, `PERF-001`–`PERF-002` | Lower severity and depends on stabilized routes/services. |

## 6.5 Downstream Dependencies on Wave-01

Downstream waves cannot be accepted unless the following Wave-01 outcomes are verified:

- `ARCH-001` resolved → Security and Permission waves can rely on a single `isSystemAdmin()` path.
- `EDG-001` resolved → Edge Function audit-logging waves (`EDG-005`) have a validated authentication model.
- `ARCH-002` / `EXE-001` resolved → Service-layer and Execution waves have a canonical pattern for context-to-service calls.

------------------------------------------------------------------------

# 7. Wave Objectives

## 7.1 Primary Objective

Eliminate the five Critical unique issues in the **Admin Authentication and Audit-Trust Boundary Risk Cluster** (`ARCH-001`, `PERM-001`, `ARCH-002`, `EXE-001`, `EDG-001`) without introducing regression, scope creep, or new undocumented drift.

## 7.2 Secondary Objectives

1. Establish `lib/permissions.ts:isSystemAdmin()` as the single admin-gate enforcement path.
2. Establish a canonical, authenticated Edge Function entry model for `audit-log`.
3. Establish a service-layer call pattern for `AuthContext` membership activation with explicit error handling.
4. Produce the Wave-01 Engineering Kickoff document for the next governance gate.

## 7.3 Success Criteria

| # | Criterion | Evidence Required |
|---|---|---|
| 1 | `App.tsx` no longer queries `system_admins` directly; it uses `isSystemAdmin()` | File read of `App.tsx` |
| 2 | Only one system-admin enforcement path remains | Comparison of `App.tsx`, `lib/permissions.ts`, and `is_system_admin` RPC usage |
| 3 | `AuthContext.tsx` delegates `activate_pending_memberships` to `services/admin/memberAdminService.ts` | File read of `AuthContext.tsx` and `memberAdminService.ts` |
| 4 | Activation failures are not silently swallowed | Code review shows explicit error handling/logging |
| 5 | `audit-log` Edge Function validates caller identity before writing | File read of `supabase/functions/audit-log/index.ts` and a test/request demonstrating rejected unauthenticated writes |
| 6 | All five canonical issue IDs are traceably resolved | Verification report references `ARCH-001`, `PERM-001`, `ARCH-002`, `EXE-001`, `EDG-001` |

## 7.4 Acceptance Criteria

- Every change is traceable to one or more `AD-Baseline-1.0` issue IDs and one or more SSOT sections.
- No Critical or High severity regressions are introduced.
- Existing Admin Dashboard behavior that is not explicitly broken continues to work.
- Audit rows continue to be written correctly for authenticated callers.
- `isSystemAdmin()` admin gate continues to permit authorized users and deny unauthorized users.
- Membership activation still occurs on `SIGNED_IN` for valid users.
- Independent reviewer passes Verification Gate.

## 7.5 Exit Criteria

- Wave-01 Verification returns **PASS** or **PASS WITH OBSERVATIONS**.
- Wave-01 Acceptance is granted by the Independent Technical Review Board and acknowledged by the Program Owner.
- Wave-01 Closeout artifacts are committed and the baseline-drift check is re-run for Wave-02 Entry Gate.

## 7.6 Required Deliverables

1. **Wave-01 Engineering Kickoff document** (authorized by this document).
2. **Wave-01 Implementation** changes (only after Engineering Kickoff authorization).
3. **Wave-01 Verification report**.
4. **Wave-01 Acceptance record**.
5. **Updated runbook / SSOT excerpts** documenting the new `audit-log` auth contract and the admin-gate path.

## 7.7 Repository Scope

Only the following files may be modified during Wave-01 implementation unless the Wave-01 Engineering Kickoff explicitly extends the list:

- `App.tsx`
- `contexts/AuthContext.tsx`
- `services/admin/memberAdminService.ts`
- `supabase/functions/audit-log/index.ts`

`lib/permissions.ts` may be referenced but is not a modification target; it is the canonical helper. Any necessary change to `lib/permissions.ts` must be treated as a scope-expansion risk and requires PMO/Program Owner approval.

## 7.8 Non-Goals

- No full service-layer refactor.
- No database schema or migration changes.
- No RPC overload consolidation.
- No dead-code removal outside the immediate `AuthContext`/`App.tsx`/`audit-log` surface.
- No UI redesign or new admin routes.
- No new dependency or infrastructure (secrets, tokens) without explicit Program Owner approval.
- No modification of the SSOT governance documents except to record ratified changes as required by `12` Engineering Principle 12.

## 7.9 Implementation Constraints

1. All changes in a branch or feature area approved by the Wave-01 Engineering Kickoff.
2. No direct `main`/`master` commits.
3. No force-pushes or history rewrites.
4. Every commit references at least one Wave-01 issue ID.
5. Backward compatibility must be preserved for non-admin and tenant flows.
6. `audit-log` authentication must not break existing authenticated callers (`AuthContext`, `auditService.ts`).
7. Tests or evidence checks must pass before Verification Gate.

------------------------------------------------------------------------

# 8. Authorization Decision

## 8.1 Wave-01 Scope Authorization

**DECISION: AUTHORIZED.**

Wave-01 is authorized to address the five Critical unique issues in the **Admin Authentication and Audit-Trust Boundary Risk Cluster**:

- `ARCH-001` — Admin gate bypasses permission helper
- `PERM-001` — Two enforcement paths for system-admin check
- `ARCH-002` — AuthContext performs business write directly
- `EXE-001` — AuthContext silently catches membership activation failure (escalated to Critical)
- `EDG-001` — `audit-log` Edge Function has no authentication (highest priority)

## 8.2 Implementation Authorization

| Activity | Status |
|---|---|
| **Wave-01 Engineering Kickoff document creation** | **AUTHORIZED** (this document authorizes producing it) |
| **Wave-01 Engineering Kickoff execution** | **NOT YET AUTHORIZED** |
| **Wave-01 Implementation** | **NOT AUTHORIZED** |

No code, migration, RPC, Edge Function, schema, database, or configuration modification is permitted without an approved Wave-01 Engineering Kickoff.

------------------------------------------------------------------------

# 9. Updated Program Status

| Dimension | Status |
|---|---|
| **Phase A** | CLOSED |
| **Baseline** | SEALED (`AD-Baseline-1.0` @ `3a06a6d9`) |
| **Phase B** | OPEN |
| **Remediation Master Plan** | COMPLETE |
| **Program Owner Decisions** | COMPLETE |
| **Wave Planning** | COMPLETE |
| **Wave-01 Authorization** | **COMPLETE** (this document) |
| **Wave-01 Engineering Kickoff** | **READY TO START** |
| **Wave-01 Implementation** | NOT STARTED |
| **Wave-01 Verification** | NOT STARTED |
| **Wave-01 Acceptance** | NOT STARTED |
| **Program Status** | ACTIVE |

------------------------------------------------------------------------

# 10. Roadmap Synchronization

The Program Charter (`00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md`) is synchronized with the new governance state as follows:

| Roadmap Item | Updated Status |
|---|---|
| Knowledge Baseline | COMPLETE |
| Repository Investigation | COMPLETE |
| Independent Acceptance Review | COMPLETE |
| Acceptance Conditions Implementation | COMPLETE |
| Phase A Closeout | COMPLETE |
| Baseline | SEALED |
| Phase B Opening Authorization | COMPLETE |
| Phase B | OPEN |
| Remediation Master Plan | COMPLETE |
| Program Owner Decisions | COMPLETE |
| Wave Planning | COMPLETE |
| Wave-01 Authorization | COMPLETE |
| Engineering Kickoff | READY TO START |
| Implementation | NOT STARTED |
| Program Status | ACTIVE |

The governance model in `00` Sections 4, 7, and 11 is **not** modified; only the status annotations are updated.

------------------------------------------------------------------------

# 11. Next Governance Chain

``` text
Wave-01 Authorization (this document)        COMPLETE
        ↓
Wave-01 Engineering Kickoff                  READY TO START
        ↓
Wave-01 Implementation                         NOT STARTED
        ↓
Wave-01 Verification                         NOT STARTED
        ↓
Wave-01 Acceptance                           NOT STARTED
        ↓
Wave-01 Closeout                             NOT STARTED
        ↓
Wave-02 Authorization                          NOT STARTED
```

If Wave-01 fails Verification, the PMO will stop the chain, record the blocker, and require rework before acceptance or Wave-02 planning.

------------------------------------------------------------------------

# 12. Final Authorization

The Enterprise Program Management Office (PMO), acting under delegated authority from the Program Owner, formally authorizes Wave-01 of the Admin Dashboard System Remediation Program as defined in this document.

**Wave-01 is AUTHORIZED.**
**Engineering Kickoff document creation is AUTHORIZED.**
**Engineering Kickoff execution and implementation are NOT AUTHORIZED.**

------------------------------------------------------------------------

# 13. PMO Certification

| Certification | |
|---|---|
| **Document** | `14_ADMIN_DASHBOARD_WAVE-01_AUTHORIZATION.md` |
| **Baseline** | `AD-Baseline-1.0` |
| **Repository Commit** | `3a06a6d9` |
| **Wave-01 Scope** | 5 unique Critical issues in the Admin Authentication and Audit-Trust Boundary Risk Cluster |
| **Wave-01 Status** | AUTHORIZED |
| **Engineering Kickoff** | READY TO START |
| **Implementation** | NOT AUTHORIZED |
| **Certification Status** | **PMO CERTIFIED** |

**End of Wave-01 Authorization**
