# 31_ADMIN_DASHBOARD_WAVE-03_AUTHORIZATION

**Document ID:** 31_ADMIN_DASHBOARD_WAVE-03_AUTHORIZATION  
**Date:** 2026-07-21  
**Project:** VietSalePro  
**Sub Project:** Admin Dashboard  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** B — System Remediation  
**Wave:** Wave-03  
**Acting Capacity:** Enterprise Program Management Office (PMO)  
**Baseline:** AD-Baseline-1.0  
**Repository Scope:** `C:\PROJECT\vietsalepro` @ commit `a1bc875978b08db4abf5c616b0db4d7b1f4f9828`  
**Repository Artifacts Modified:** None (governance authorization only)  
**Status:** Wave-03 Authorized with Observations — Engineering Kickoff Document Ready to Start

------------------------------------------------------------------------

# 1. Executive Summary

This document is the official **Wave-03 Authorization** for Phase B of the Admin Dashboard System Remediation Program. It is issued by the Enterprise PMO. It is **not** the Engineering Kickoff, **not** implementation, **not** verification, **not** acceptance, and **not** deployment. It authorizes the third remediation wave and the production of the next governance deliverable: the Wave-03 Engineering Kickoff document.

All mandatory governance documents (`00` through `30`) were read in full. The sealed baseline `AD-Baseline-1.0` remains valid. Wave-01 and Wave-02 are formally closed, and the repository at `HEAD` (`a1bc8759`) contains only the accepted Wave-02 implementation plus tooling/documentation working-tree changes that do not affect the Admin Dashboard implementation surface.

Wave-03 is organized as the **remaining Admin Dashboard Consistency and Operational Governance Cluster**. It consumes the 22 unique `AD-Baseline-1.0` issues left after Wave-01 (5 issues) and Wave-02 (16 issues), grouped into three logical implementation packages.

**Authorization Decision:**

- **Wave-03 Scope:** AUTHORIZED WITH OBSERVATIONS for the 22 remaining unique `AD-Baseline-1.0` issues detailed in Section 5.
- **Engineering Kickoff Document:** READY TO START (this document authorizes its creation).
- **Engineering Kickoff Execution:** NOT YET AUTHORIZED.
- **Implementation:** NOT AUTHORIZED.
- **Overall Program Status:** ACTIVE — WAVE-03 AUTHORIZED.

------------------------------------------------------------------------

# 2. Mandatory Documents Reviewed

| # | Document | Role in Wave-03 Authorization | Read Status |
|---|----------|-------------------------------|-------------|
| 00 | `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` | Program charter, lifecycle, governance transition rules | Read in full |
| 01 | `01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md` | SSOT architecture baseline | Read in full |
| 02 | `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md` | SSOT dependency and layer direction baseline | Read in full |
| 03 | `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md` | SSOT runtime execution baseline | Read in full |
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
| 14 | `14_ADMIN_DASHBOARD_WAVE-01_AUTHORIZATION.md` | Wave-01 scope and deferred clusters | Read in full |
| 15 | `15_ADMIN_DASHBOARD_WAVE-01_ENGINEERING_KICKOFF.md` | Engineering-kickoff precedent | Read in full |
| 16 | `16_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_READINESS_REVIEW.md` | Frozen-execution-contract precedent | Read in full |
| 17 | `17_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION.md` | Package-01 implementation evidence | Read in full |
| 18 | `18_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_PACKAGE-02.md` | Package-02 implementation evidence | Read in full |
| 19 | `19_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_PACKAGE-03.md` | Package-03 implementation evidence | Read in full |
| 20 | `20_ADMIN_DASHBOARD_WAVE-01_VERIFICATION_REPORT.md` | Independent verification methodology | Read in full |
| 21 | `21_ADMIN_DASHBOARD_WAVE-01_ACCEPTANCE_REVIEW.md` | Acceptance criteria precedent | Read in full |
| 21A | `21A_ADMIN_DASHBOARD_WAVE-01_DEPLOYMENT_SYNCHRONIZATION_REPORT.md` | Deployment synchronization precedent | Read in full |
| 22 | `22_ADMIN_DASHBOARD_WAVE-01_CLOSEOUT_REPORT.md` | Wave-01 closeout and transition readiness | Read in full |
| 23 | `23_ADMIN_DASHBOARD_WAVE-02_AUTHORIZATION.md` | Wave-02 scope and deferred Wave-03 cluster | Read in full |
| 24 | `24_ADMIN_DASHBOARD_WAVE-02_ENGINEERING_KICKOFF.md` | Wave-02 engineering direction | Read in full |
| 25 | `25_ADMIN_DASHBOARD_WAVE-02_IMPLEMENTATION_READINESS_REVIEW.md` | Wave-02 frozen execution contract | Read in full |
| 26A | `26A_ADMIN_DASHBOARD_WAVE-02_IMPLEMENTATION_PACKAGE-01.md` | Wave-02 Package-01 evidence | Read in full |
| 26B | `26B_ADMIN_DASHBOARD_WAVE-02_IMPLEMENTATION_PACKAGE-02.md` | Wave-02 Package-02 evidence | Read in full |
| 26C | `26C_ADMIN_DASHBOARD_WAVE-02_IMPLEMENTATION_PACKAGE-03.md` | Wave-02 Package-03 evidence | Read in full |
| 27 | `27_ADMIN_DASHBOARD_WAVE-02_VERIFICATION_REPORT.md` | Wave-02 verification methodology | Read in full |
| 28 | `28_ADMIN_DASHBOARD_WAVE-02_ACCEPTANCE_REVIEW.md` | Wave-02 acceptance criteria | Read in full |
| 28A | `28A_ADMIN_DASHBOARD_WAVE-02_DEPLOYMENT_SYNCHRONIZATION_REPORT.md` | Wave-02 deployment synchronization | Read in full |
| 28B | `28B_ADMIN_DASHBOARD_GOVERNANCE_ALIGNMENT_REPORT.md` | Governance alignment and charter correction | Read in full |
| 29 | `29_ADMIN_DASHBOARD_WAVE-02_CLOSEOUT_REPORT.md` | Wave-02 closeout and transition readiness | Read in full |
| 30 | `30_ADMIN_DASHBOARD_PROGRAM_STATUS_REVIEW.md` | Program health and Wave-03 readiness | Read in full |

------------------------------------------------------------------------

# 3. Current Repository Review

## 3.1 Git Status

| Verification Check | Method | Result |
|---|---|---|
| HEAD commit | `git rev-parse HEAD` | `a1bc875978b08db4abf5c616b0db4d7b1f4f9828` "fix(MIG-001, MIG-002, MIG-003, MIG-004, RPC-002, DRIFT-003): Wave-02 Package-03 migration reconciliation and security context" |
| Current branch | `git branch --show-current` | `master` |
| Post-closeout commits | `git log --oneline -20` | No commits exist after `a1bc8759`. |
| Wave-02 implementation integrity | `git diff --stat a1bc8759 -- src/ supabase/migrations/ supabase/functions/ supabase/schema.sql` | **0 lines changed** — the accepted Wave-02 implementation is intact at `HEAD`. |
| Tracked working-tree changes | `git diff --stat HEAD` | `.codebase-memory/artifact.json` and `.codebase-memory/graph.db.zst` (MCP graph re-index); `ADMIN_DASHBOARD_PLAN/00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` (Section 10 status update); `package.json` / `package-lock.json` (`supabase` CLI dev dependency). |
| Untracked entries | `git status --short` | Governance deliverables in `ADMIN_DASHBOARD_PLAN/`, `PROJECT_MASTER_INDEX*`, `PDP-*`, `PRODUCTION_*`, `memory-zone/` scratch artifacts. |

**Repository Stability Verdict:** The Admin Dashboard implementation has not materially changed since Wave-02 closeout. The only uncommitted code-facing change is the addition of the `supabase` CLI dev dependency, which is a tooling artifact. No source-code drift is present.

## 3.2 MCP Codebase Memory Verification

| Verification Check | Tool | Result |
|---|---|---|
| Project name | `codebase-memory` artifact | `vietsalepro` |
| Indexed commit | `.codebase-memory/artifact.json` | `a1bc875978b08db4abf5c616b0db4d7b1f4f9828` (matches `HEAD`) |
| Nodes | `codebase-memory` artifact | 24,969 |
| Edges | `codebase-memory.query_graph` | 36,817 |
| Graph health | `query_graph` and `search_graph` | Responded successfully; labels include `Function`, `Route`, `Variable`, `File`, `Folder`, `Module`, `Section`. |
| Search capability | `search_graph(query="admin dashboard issue")` | 39 ranked results across `components/admin/`, `pages/admin/`, `services/admin/`, and `supabase/schema.sql`. |
| Call / dependency graph | `query_graph` for `CALLS` relationships | 36,817 edges confirm a connected call/dependency graph. |

**MCP Verdict:** The Codebase Memory graph is healthy and synchronized to the Wave-02 closeout commit. No new admin-surface defects are visible in the indexed graph at `HEAD`.

## 3.3 Agent Skills Applied

| Skill | Purpose | Status | Evidence |
|---|---|---|---|
| `code-review` | Validate that no post-closeout implementation changes exist and that repository content aligns with the frozen Wave-02 execution contract. | Applied | `git diff`, `git status`, Codebase Memory graph search. |
| `risk-analysis` | Evaluate whether observed drift, security advisor warnings, and staging/production migration differences are blockers for Wave-03. | Applied | Supabase security advisors, migration count deltas, Vercel `gitDirty` flag, working-tree drift. |
| `release-management` | Confirm deployment baseline, synchronization status, and production/staging boundary controls. | Applied | Vercel deployment history, Supabase migration history for both environments. |
| `configuration-management` | Track uncommitted dependency and graph-artifact changes in the working tree. | Applied | `package.json`/`package-lock.json` diff, `.codebase-memory/artifact.json` diff. |
| `technical-documentation` | Synthesize governance, repository, and platform evidence into a single authoritative Wave Authorization record. | Applied | All sections of this document. |

------------------------------------------------------------------------

# 4. Baseline Verification

| Baseline Attribute | Value | Evidence |
|---|---|---|
| **Baseline Version** | `AD-Baseline-1.0` | `10B_ADMIN_DASHBOARD_PHASE_A_CLOSEOUT.md` Section 11 |
| **Baseline Status** | **SEALED** | `10B` Section 11 |
| **Effective Date** | 2026-07-20 | `10B` Section 11 |
| **Repository Commit** | `3a06a6d9` (RC-2026-07-19-01) | `10B` Section 11; `30` Section 3 |
| **Cataloged Issues** | 64 (after false-positive removal) | `10A` Section 15; `12` Section 4 |
| **Unique Remediation Issues** | 43 (after collapsing 21 duplicates) | `10A` Section 15; `12` Section 4 |
| **Issues Remediated in Wave-01** | 5 unique (`ARCH-001`, `PERM-001`, `ARCH-002`, `EXE-001`, `EDG-001`) | `14` Section 5.3; `22` Section 5.2 |
| **Issues Remediated in Wave-02** | 16 unique (`DB-001`, `DB-002`, `DB-003`, `DB-004`, `DB-006`, `DB-007`, `DB-009`, `RPC-001` folded, `RPC-002`, `RPC-003`, `RPC-004`, `MIG-001`, `MIG-002`, `MIG-003`, `MIG-004`, `DRIFT-001`/`002`/`003` folded) | `23` Section 5.3; `29` Section 5.2 |
| **Issues Authorized for Wave-03** | 22 unique (`43 − 5 − 16`) | `30` Section 9.6; `12` Sections 6.2–6.12 |
| **Permitted Use** | Only `AD-Baseline-1.0` may be consumed by Phase B waves | `10B` Section 12, Entry Condition 1 |
| **False Positives Removed** | `DB-008`, `DIR-003`, `DEP-001` | `10A` Section 6; `10B` Section 9 |

**Baseline Verdict:** The sealed baseline remains valid and is the only approved source of Phase B remediation issues. Wave-03 is bounded to the 22 remaining unique `AD-Baseline-1.0` issues.

------------------------------------------------------------------------

# 5. Governance Verification

| Gate | Expected Status | Current Status | Evidence |
|---|---|---|---|
| Phase A | CLOSED | **CLOSED** | `10B` Section 1 |
| Baseline | SEALED | **SEALED** (`AD-Baseline-1.0`) | `10B` Section 11 |
| Phase B | OPEN | **OPEN** | `11` Section 1 |
| Remediation Master Plan | COMPLETE | **COMPLETE** | `12` Section 1 |
| Program Owner Decisions | COMPLETE | **COMPLETE** | `13` Sections 6–7 and Section 12 |
| Wave-01 Lifecycle | CLOSED | **CLOSED** | `22` Section 1 |
| Wave-02 Lifecycle | CLOSED | **CLOSED** | `29` Section 1 |
| Program Status Review | READY FOR WAVE-03 | **READY FOR WAVE-03** | `30` Section 11 |
| Wave-03 Authorization | NOT YET MADE | **AUTHORIZED WITH OBSERVATIONS** (this document) | — |
| Engineering Kickoff | NOT AUTHORIZED | **NOT AUTHORIZED** | — |
| Implementation | NOT STARTED | **NOT STARTED** | — |
| Program Status | READY FOR WAVE-03 | **WAVE-03 AUTHORIZED** | `00` Section 10 (updated by this document) |

**Governance Verdict:** Every prerequisite for Wave-03 Authorization is satisfied. No implementation has started.

------------------------------------------------------------------------

# 6. Supabase MCP Evidence

**Tool:** `supabase-mcp-server`

| Check | Production `QLBH` (`rsialbfjswnrkzcxarnj`) | Staging `QLBH Staging Multi-Tenant` (`shbmzvfcenbybvyzclem`) |
|---|---|---|
| Authentication | Access confirmed via `list_projects` | Access confirmed via `list_projects` |
| Project status | `ACTIVE_HEALTHY` | `ACTIVE_HEALTHY` |
| Region | `ap-northeast-1` | `ap-northeast-1` |
| Migration history | 126 migrations; **does not** include Wave-02 2026-07-21 migrations (`20260721012949`, `20260721013148`, `20260721013200`, `20260721013213`). | 129 migrations; **includes** Wave-02 2026-07-21 migrations. |
| RPC inventory | 333 public functions; 138 `SECURITY DEFINER` (MCP `execute_sql`/`get_advisors`). | 315 public functions; list returned by `execute_sql` against `information_schema.routines`. |
| Trigger inventory | 49 triggers (`execute_sql` against `information_schema.triggers`). | 46 triggers (`execute_sql` against `information_schema.triggers`). |
| Edge Function inventory | Not enumerated (production remains at pre-Wave-02 baseline). | 10 active Edge Functions (`list_edge_functions`). |
| Security context | `get_advisors(type: security)` returned WARN-level `function_search_path_mutable` findings only; no CRITICAL or HIGH severity findings. | Not independently re-queried; production security findings drive the remediation backlog. |

**Conclusion:**
- Production remains unchanged by Wave-02 (no Wave-02 migrations present).
- Staging is synchronized with Wave-02 deliverables.
- Migration drift between Staging and Production is consistent with the Wave-02 staging-only deployment authorization.
- Security advisor warnings are pre-existing, WARN-level, and documented in `30` Section 9.7.

------------------------------------------------------------------------

# 7. Vercel MCP Evidence

**Tool:** `vercel`

| Check | Result |
|---|---|
| Authentication | Access confirmed via `list_teams` |
| Team | `tanphat056-3795's projects` (`team_5jIBUrVn2CmOrkSojeJZZqoP`) |
| Project | `vietsalepro` (`prj_UdCbqGpXxsBXVNGfz0fz02obBS6x`) |
| Framework | `vite` |
| Git linkage | `master` branch; GitHub repository `vietsalepro/vietsalepro` |
| Domains | `vietsalepro.com`, `*.vietsalepro.com`, `admin.vietsalepro.com`, `master.vietsalepro.com`, plus Vercel aliases |
| Latest deployment | `dpl_8rhXQm3qLawzjUSyBNpB2fN33eM5` |
| Deployment target | `production` |
| Deployment state | `READY` |
| Deployment commit | `3a06a6d9ad71fd1c4a5fcee21ce815293b742402` — "Production governance baseline before cutover (RC-2026-07-19-01)" |
| Deployment created | 2026-07-19T11:41:06Z |
| `gitDirty` | `1` |

**Conclusion:**
- No Vercel deployment occurred after Wave-02 Closeout (`a1bc8759`).
- Production deployment is pinned to the pre-Wave-02 baseline commit `3a06a6d9`.
- Git linkage is intact (`master` branch, GitHub repository `vietsalepro/vietsalepro`).

------------------------------------------------------------------------

# 8. Wave-03 Scope Definition

## 8.1 Wave Objective

Complete remediation of the 22 remaining unique `AD-Baseline-1.0` inconsistencies so the Admin Dashboard implementation is consistent with the approved SSOT across Service Layer, Execution, Edge Functions, Permission, UI, and Operational Governance.

## 8.2 Business Objective

- Restore trust in the Admin Dashboard service-layer contracts, execution flows, and UI route map.
- Close the remaining permission, audit-logging, and dead-code gaps that were deferred from Wave-01 and Wave-02.
- Leave the repository ready for final Program Certification.

## 8.3 Technical Objective

- Replace direct `.from()` table access in `services/admin/*.ts` wrappers with approved base-service or canonical-RPC contracts.
- Harden non-audit Edge Functions (`check-subdomain`, `billing-webhooks`) and close Edge-Function audit-logging gaps.
- Remove or activate dead code (`services/admin/permissions.ts`, `admin-health-check`, `deliver-webhook`, unused admin routes/components).
- Resolve `AdminDashboardInner` tab-model, lazy-loading, and performance issues without UX redesign.
- Close `admin_events` RLS and producer-policy gaps.

## 8.4 Authorized Scope

Wave-03 is authorized to address the 22 remaining unique `AD-Baseline-1.0` issues. Cross-categorized duplicates collapsed under the 43-unique view will be resolved through their canonical fixes, per `10A` Section 10.

### 8.4.1 Remaining 22 Canonical Issues

| # | Issue ID | Primary Domain | Reason |
|---|----------|----------------|--------|
| 1 | `ARCH-003` | Architecture | `InvitationsAccept` route not validated through `AdminLayout` |
| 2 | `ARCH-004` | Architecture | `AdminDashboardInner` tabs include unreachable entries |
| 3 | `ARCH-005` | Architecture | `AdminDashboardInner` loads all tab states on mount |
| 4 | `ARCH-006` | Architecture | Browser API usage in `complianceAdminService.ts` |
| 5 | `BL-001` | Execution | Tenant creation bypasses canonical validation RPC |
| 6 | `BL-002` | Execution | Billing lifecycle updates bypass canonical validation RPC |
| 7 | `BL-003` | Execution | Business logic shortcuts require service/RPC layer refactoring |
| 8 | `DEAD-001` | Operational Governance | Dead `services/admin/permissions.ts` file |
| 9 | `DEAD-002` | Operational Governance | Dead `admin-health-check` Edge Function |
| 10 | `DEAD-003` | Operational Governance | Dead `deliver-webhook` Edge Function |
| 11 | `DEAD-004` | Operational Governance | Unused admin routes or components |
| 12 | `DEP-002` | Service Layer | `billingAdminService.ts` missing plan/invoice RPC re-exports |
| 13 | `DEP-003` | Service Layer | `analyticsAdminService.ts` missing overview RPC re-exports |
| 14 | `DEP-004` | Service Layer | `tenantAdminService.ts` missing custom-domain token RPC wrapper |
| 15 | `DIR-001` | Execution | Direct database queries bypass service layer |
| 16 | `EDG-002` | Edge Functions | `check-subdomain` access controls not documented or hardened |
| 17 | `EDG-003` | Edge Functions | `billing-webhooks` access controls not documented or hardened |
| 18 | `EDG-004` | Edge Functions | `billing-webhooks` does not write to `app_audit_log` |
| 19 | `EDG-005` | Edge Functions | Widespread Edge Function audit logging gaps |
| 20 | `PERF-001` | Operational Governance | `tenant-backup` Edge Function runtime limits risk |
| 21 | `PERF-002` | Operational Governance | `AdminDashboardInner` performance from loading all tabs |
| 22 | `PERM-003` | Permission | `admin_events` RLS and producer policy gaps |

### 8.4.2 Authorized Implementation Packages

Wave-03 is organized into three logical implementation packages. The exact file lists and execution sequence will be frozen in the Wave-03 Implementation Readiness Review.

**Package-01 — Service Layer & Permission Consolidation**

- **Primary canonical issues:** `DEP-002`, `DEP-003`, `DEP-004`, `PERM-003`, `SVC-001`–`SVC-005` (resolved through canonical service-layer fixes).
- **Associated catalog IDs:** `SVC-001`, `SVC-002`, `SVC-003`, `SVC-004`, `SVC-005`.
- **Domain:** Service Layer, Permission.
- **Expected deliverables:** All `services/admin/*.ts` wrappers call approved base services or canonical RPCs; missing RPC re-exports are present; `admin_events` producer policy is complete; `lib/permissions.ts` is the single enforcement path for privileged operations.
- **Repository impact:** `services/admin/*.ts`, `lib/permissions.ts`, `supabase/schema.sql` (via migration), `supabase/migrations/`.
- **Priority:** 1 — must precede Execution and UI packages that consume these contracts.
- **Risk:** Medium — broad service-layer touch points; regression checks required on tenant, member, billing, audit, and license flows.

**Package-02 — Execution, Edge Functions & Audit Logging**

- **Primary canonical issues:** `BL-001`, `BL-002`, `BL-003`, `DIR-001`, `VAL-001`, `VAL-002`, `EDG-002`, `EDG-003`, `EDG-004`, `EDG-005`.
- **Associated catalog IDs:** `VAL-001`, `VAL-002`, `DIR-002` (cross-categorized), `SEC-002`–`SEC-005` (cross-categorized with Edge/Security).
- **Domain:** Execution, Business Logic, Edge Functions.
- **Expected deliverables:** Tenant and billing lifecycles use canonical validation RPCs; `check-subdomain` and `billing-webhooks` access controls are explicit and documented; all privileged Edge Functions write to `app_audit_log`; `AuthContext` and `InvitationsAccept` flows are validated through `AdminLayout`.
- **Repository impact:** `contexts/AuthContext.tsx`, `pages/InvitationsAccept.tsx`, `services/admin/*.ts`, `supabase/functions/check-subdomain/`, `supabase/functions/billing-webhooks/`, `supabase/migrations/`.
- **Priority:** 2 — depends on Package-01 service contracts.
- **Risk:** Medium — Edge Function auth and audit changes require staging deployment and runtime verification.

**Package-03 — UI, Architecture Cleanup & Operational Governance**

- **Primary canonical issues:** `ARCH-003`, `ARCH-004`, `ARCH-005`, `ARCH-006`, `DEAD-001`, `DEAD-002`, `DEAD-003`, `DEAD-004`, `PERF-001`, `PERF-002`.
- **Associated catalog IDs:** `UI-001`, `UI-002`, `UI-003` (cross-categorized with `ARCH-003`/`ARCH-004`/`DEAD-003`).
- **Domain:** Architecture, UI, Operational Governance.
- **Expected deliverables:** `InvitationsAccept` is integrated with `AdminLayout` lazy-loading; `AdminDashboardInner` tab model matches reachable routes; dead files/Edge Functions are removed or activated with justification; `AdminDashboardInner` does not load all tab states on mount; `tenant-backup` runtime limits are understood and mitigated.
- **Repository impact:** `pages/admin/AdminDashboardInner.tsx`, `pages/admin/AdminLayout.tsx`, `App.tsx`, `components/admin/*`, `services/admin/complianceAdminService.ts`, `supabase/functions/admin-health-check/`, `supabase/functions/deliver-webhook/`, `supabase/functions/system-health/`, `supabase/functions/tenant-backup/`.
- **Priority:** 3 — cleanup and UI alignment after underlying contracts are stable.
- **Risk:** Low — primarily dead-code removal and UI route alignment; must not break existing admin navigation.

## 8.5 Dependencies

- Wave-01 trust-boundary fixes (`ARCH-001`, `PERM-001`, `ARCH-002`, `EXE-001`, `EDG-001`) must remain intact.
- Wave-02 database/RPC/migration consolidation (`DB-001`–`DB-004`, `DB-006`, `DB-007`, `DB-009`, `RPC-001`–`RPC-004`, `MIG-001`–`MIG-004`, `DRIFT-001`–`DRIFT-003`) must be accepted and staged.
- Program Owner Decision 1 (Hybrid SSOT Drift Strategy) and Decision 2 (Incremental Domain Strategy) govern Wave-03 sequencing.
- Package-01 must precede Package-02; Package-02 must precede Package-03.

## 8.6 Repository Impact

- `services/admin/*.ts` — service-layer contracts and missing RPC re-exports.
- `lib/permissions.ts` — `admin_events` producer policy and permission helper refinements.
- `contexts/AuthContext.tsx`, `pages/InvitationsAccept.tsx` — execution flow validation.
- `pages/admin/AdminDashboardInner.tsx`, `pages/admin/AdminLayout.tsx`, `App.tsx` — route and tab-model alignment.
- `components/admin/*` — sidebar capability exposure.
- `supabase/functions/check-subdomain/`, `supabase/functions/billing-webhooks/`, `supabase/functions/admin-health-check/`, `supabase/functions/deliver-webhook/`, `supabase/functions/system-health/`, `supabase/functions/tenant-backup/` — Edge Function auth, audit, and cleanup.
- `supabase/migrations/` — any schema/RLS/RPC changes required by the packages.
- No changes to `src/` business logic outside the Admin Dashboard surface.

## 8.7 Risk Assessment

| Risk | Level | Evidence | Mitigation |
|---|---|---|---|
| Working-tree tooling drift (`supabase` CLI, `.codebase-memory`) | Low | Uncommitted `package.json`/`package-lock.json`, graph artifacts, and Section 10 status update; no source-code drift. | Freeze working tree at the start of the Wave-03 Implementation Readiness Review; commit or discard tooling changes before implementation. |
| Supabase security advisor warnings (`function_search_path_mutable`) | Low | WARN-level findings only; no CRITICAL/HIGH. | Include search-path remediation in the relevant package migrations; verify with `get_advisors` before acceptance. |
| Staging/Production migration drift | Low | Production has 126 migrations and no Wave-02 migrations; Staging has 129. | Authorized staging-only deployment; production remains at `3a06a6d9` until Program Certification. |
| Service-layer regression from direct `.from()` refactoring | Medium | `services/admin/*.ts` wrappers touch tenant, member, billing, audit, license flows. | Independent verification, regression checks, and staged rollout per package. |
| Edge Function auth/audit gaps | Medium | `check-subdomain` and `billing-webhooks` currently lack documented access controls. | Stage and test in Staging; enforce `app_audit_log` writes; independent verification. |
| Dead code removal breaking imports | Low | `services/admin/permissions.ts`, `admin-health-check`, `deliver-webhook`. | Verify import graph (Codebase Memory) before removal; commit removals as separate evidence. |

## 8.8 Out of Scope

- Any issue not in the `AD-Baseline-1.0` 43-unique set.
- New Admin Dashboard capabilities, UX redesign, or features not required to resolve the 22 authorized issues.
- Production Supabase or Vercel deployment (staging-only until Program Certification).
- Direct edits to `supabase/schema.sql` outside the migration pipeline.
- Modification of the sealed SSOT documents (`01`–`08`) without a formal Program Owner decision and SSOT amendment process.

## 8.9 Deferred Work

- The 22 remaining `AD-Baseline-1.0` issues are **now** authorized in Wave-03; no further issues are deferred at this time.
- Pre-existing observations (`30` Section 9.7) that are not part of the 22 canonical issues remain accepted risks:
  - `public.plan_features` RLS disabled.
  - Custom-domain Edge Function drift in `services/admin/tenantAdminService.ts`.
  - `SECURITY INVOKER` remediation surface carried from Wave-02.
- Any new findings discovered during Wave-03 implementation must be recorded and deferred to a future wave unless Critical and approved by the Program Owner as an emergency change, per `12` Engineering Principle 5.

## 8.10 Exit Criteria

- Wave-03 Engineering Kickoff document is produced and authorized.
- Wave-03 Implementation Readiness Review freezes the execution contract (scope, issues, files, sequences) and authorizes implementation.
- All three implementation packages are completed, committed, and independently verified.
- All 22 authorized canonical issues are resolved with traceability to `AD-Baseline-1.0` IDs and SSOT sections.
- Wave-03 Verification Report passes.
- Wave-03 Acceptance Review accepts the wave with no Critical or High severity regressions.
- Wave-03 Deployment Synchronization remains staging-only; production is unchanged.
- Wave-03 Closeout Report confirms the wave is closed and the repository is ready for Program Certification or the next authorized wave.

------------------------------------------------------------------------

# 9. Roadmap Update

Because Wave-03 is authorized, `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` Section 10 is updated by this document to:

- Set **Wave-03 Authorization** to `COMPLETE`.
- Append **Wave-03 Engineering Kickoff : READY TO START** immediately after the Wave-03 Authorization entry.
- Set **Program Status** to `WAVE-03 AUTHORIZED`.
- Update the footer attribution to `31_ADMIN_DASHBOARD_WAVE-03_AUTHORIZATION.md, 2026-07-21`.

This update is a governance edit and does not constitute implementation.

------------------------------------------------------------------------

# 10. Formal Authorization Decision

## 10.1 Decision

```text
WAVE-03 AUTHORIZED WITH OBSERVATIONS
```

## 10.2 Supporting Evidence

- **Governance evidence:** All governance documents `00` through `30` are complete and traceable. Wave-01 and Wave-02 full lifecycles are closed. Program Owner Decisions are recorded. `30_ADMIN_DASHBOARD_PROGRAM_STATUS_REVIEW.md` concluded **READY FOR WAVE-03 WITH OBSERVATIONS**.
- **Repository evidence:** `HEAD` is `a1bc8759`; no post-closeout source-code commits; tracked diffs are limited to tooling/artifacts and the Section 10 status update.
- **Git evidence:** `master` branch; continuous un-rewritten history; `git diff --stat` confirms no implementation drift in `src/`, `supabase/migrations/`, `supabase/functions/`, or `supabase/schema.sql`.
- **Codebase Memory MCP evidence:** Graph indexed to `a1bc8759` with 24,969 nodes and 36,817 edges; search and query operations respond successfully.
- **Supabase MCP evidence:** Production `ACTIVE_HEALTHY` with 126 migrations and no Wave-02 migrations; Staging `ACTIVE_HEALTHY` with 129 migrations including Wave-02 deliverables; security advisors show only WARN-level `function_search_path_mutable` findings.
- **Vercel MCP evidence:** Project `vietsalepro` linked to `master` branch; latest production deployment is `dpl_8rhXQm3qLawzjUSyBNpB2fN33eM5` at commit `3a06a6d9` (2026-07-19), predating Wave-02 closeout; no new deployments.
- **Scope evidence:** 22 remaining unique `AD-Baseline-1.0` issues are bounded, grouped into three logical packages, and traceable to the Remediation Master Plan.
- **Roadmap evidence:** `00` Section 10 is updated to reflect `WAVE-03 AUTHORIZED` and the `Wave-03 Engineering Kickoff` ready state.

## 10.3 Authorized Actions

- Produce `32_ADMIN_DASHBOARD_WAVE-03_ENGINEERING_KICKOFF.md`.
- Do not begin implementation, verification, acceptance, deployment, or production modification until the Wave-03 Implementation Readiness Review is complete.

## 10.4 Restrictions

- No production deployment.
- No database modification outside approved staging migrations.
- No source-code changes outside the 22 authorized `AD-Baseline-1.0` issues.
- No SSOT document modification without a formal Program Owner decision.

------------------------------------------------------------------------

*Authorized by the Enterprise Program Management Office (PMO).*
