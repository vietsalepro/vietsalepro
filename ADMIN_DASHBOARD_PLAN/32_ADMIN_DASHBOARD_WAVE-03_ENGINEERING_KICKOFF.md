# 32_ADMIN_DASHBOARD_WAVE-03_ENGINEERING_KICKOFF

**Document ID:** 32_ADMIN_DASHBOARD_WAVE-03_ENGINEERING_KICKOFF  
**Date:** 2026-07-21  
**Project:** VietSalePro  
**Sub Project:** Admin Dashboard  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** B — System Remediation  
**Wave:** Wave-03  
**Acting Capacity:** Enterprise Program Management Office (PMO) together with the Principal Software Architect  
**Baseline:** AD-Baseline-1.0  
**Repository Scope:** `C:\PROJECT\vietsalepro` @ commit `a1bc875978b08db4abf5c616b0db4d7b1f4f9828`  
**Repository Artifacts Modified:** None (governance/engineering planning only)  
**Status:** Engineering Kickoff Complete — Implementation Readiness Review Ready to Start  

------------------------------------------------------------------------

# 1. Executive Summary

This document is the formal **Engineering Kickoff** for **Wave-03** of the Admin Dashboard System Remediation Program. It is a governance and engineering planning activity only. It does **not** authorize implementation, verification, acceptance, or deployment.

Wave-03 is the **Admin Dashboard Consistency and Operational Governance Cluster**. It consumes the 22 remaining unique `AD-Baseline-1.0` issues authorized in `31_ADMIN_DASHBOARD_WAVE-03_AUTHORIZATION.md` and is structured into three independently verifiable packages.

All mandatory governance documents (`00` through `31`) have been reviewed. The sealed baseline `AD-Baseline-1.0` remains valid, Wave-01 and Wave-02 are formally closed, and the Wave-02 implementation is intact at `HEAD`.

**Engineering Kickoff Decision:**

- **Wave-03 Engineering Kickoff:** **COMPLETE** (this document).
- **Wave-03 Implementation Readiness Review:** **READY TO START**.
- **Wave-03 Implementation:** **NOT STARTED** and not authorized by this document.
- **Overall Program Status:** **ACTIVE** — READY FOR WAVE-03 IMPLEMENTATION READINESS REVIEW.

------------------------------------------------------------------------

# 2. Mission

Prepare Engineering for the Wave-03 remediation of the 22 remaining unique `AD-Baseline-1.0` inconsistencies so the Admin Dashboard implementation becomes fully consistent with the approved System Source of Truth (SSOT) across Service Layer, Execution, Edge Functions, Permission, UI, and Operational Governance.

This document establishes the frozen engineering execution baseline for Wave-03. It does not authorize implementation, modify scope, modify the repository, modify the database, modify migrations, modify RPCs, modify Edge Functions, or modify Production.

------------------------------------------------------------------------

# 3. Governance Review

All governance documents `00` through `31` were reviewed in full before this Engineering Kickoff was produced. No document or section was skipped.

| # | Document | Role in Engineering Kickoff |
|---|---|---|
| 00 | `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` | Program charter, lifecycle, governance transition rules |
| 01 | `01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md` | SSOT architecture baseline |
| 02 | `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md` | SSOT dependency and layer direction baseline |
| 03 | `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md` | SSOT runtime execution baseline |
| 04 | `04_ADMIN_DASHBOARD_INVESTIGATION_PLAN.md` | Investigation methodology and capability domains |
| 05 | `05_ADMIN_DASHBOARD_FORENSIC_EXECUTION_PROTOCOL.md` | Evidence collection protocol |
| 06 | `06_ADMIN_DASHBOARD_FORENSIC_INVESTIGATION.md` | Forensic findings and traces |
| 07 | `07_ADMIN_DASHBOARD_ROOT_CAUSE_ANALYSIS.md` | Root cause candidates |
| 08 | `08_ADMIN_DASHBOARD_FINAL_RECOMMENDATIONS.md` | Enterprise recommendations |
| 09 | `09_ADMIN_DASHBOARD_SYSTEM_INCONSISTENCY_REPORT.md` | Sealed issue catalog |
| 10 | `10_ADMIN_DASHBOARD_INVESTIGATION_ACCEPTANCE_REVIEW.md` | Independent acceptance review |
| 10A | `10A_ADMIN_DASHBOARD_INVESTIGATION_ACCEPTANCE_IMPLEMENTATION.md` | Corrected baseline and duplicate reconciliation |
| 10B | `10B_ADMIN_DASHBOARD_PHASE_A_CLOSEOUT.md` | Baseline sealing |
| 11 | `11_ADMIN_DASHBOARD_PHASE_B_OPENING_AUTHORIZATION.md` | Phase B opening rules |
| 12 | `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` | Strategic remediation portfolios and precedence |
| 13 | `13_ADMIN_DASHBOARD_PROGRAM_OWNER_DECISION_RECORD.md` | Program Owner decisions |
| 14 | `14_ADMIN_DASHBOARD_WAVE-01_AUTHORIZATION.md` | Wave-01 scope and entry criteria |
| 15 | `15_ADMIN_DASHBOARD_WAVE-01_ENGINEERING_KICKOFF.md` | Engineering-kickoff precedent |
| 16 | `16_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_READINESS_REVIEW.md` | Frozen-execution-contract precedent |
| 17 | `17_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION.md` | Package-01 implementation evidence |
| 18 | `18_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_PACKAGE-02.md` | Package-02 implementation evidence |
| 19 | `19_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_PACKAGE-03.md` | Package-03 implementation evidence |
| 20 | `20_ADMIN_DASHBOARD_WAVE-01_VERIFICATION_REPORT.md` | Wave-01 verification methodology |
| 21 | `21_ADMIN_DASHBOARD_WAVE-01_ACCEPTANCE_REVIEW.md` | Wave-01 acceptance criteria |
| 21A | `21A_ADMIN_DASHBOARD_WAVE-01_DEPLOYMENT_SYNCHRONIZATION_REPORT.md` | Wave-01 deployment synchronization precedent |
| 22 | `22_ADMIN_DASHBOARD_WAVE-01_CLOSEOUT_REPORT.md` | Wave-01 closeout and transition readiness |
| 23 | `23_ADMIN_DASHBOARD_WAVE-02_AUTHORIZATION.md` | Wave-02 scope and deferred Wave-03 cluster |
| 24 | `24_ADMIN_DASHBOARD_WAVE-02_ENGINEERING_KICKOFF.md` | Wave-02 engineering direction |
| 25 | `25_ADMIN_DASHBOARD_WAVE-02_IMPLEMENTATION_READINESS_REVIEW.md` | Wave-02 frozen execution contract |
| 26A | `26A_ADMIN_DASHBOARD_WAVE-02_IMPLEMENTATION_PACKAGE-01.md` | Wave-02 Package-01 evidence |
| 26B | `26B_ADMIN_DASHBOARD_WAVE-02_IMPLEMENTATION_PACKAGE-02.md` | Wave-02 Package-02 evidence |
| 26C | `26C_ADMIN_DASHBOARD_WAVE-02_IMPLEMENTATION_PACKAGE-03.md` | Wave-02 Package-03 evidence |
| 27 | `27_ADMIN_DASHBOARD_WAVE-02_VERIFICATION_REPORT.md` | Wave-02 verification methodology |
| 28 | `28_ADMIN_DASHBOARD_WAVE-02_ACCEPTANCE_REVIEW.md` | Wave-02 acceptance criteria |
| 28A | `28A_ADMIN_DASHBOARD_WAVE-02_DEPLOYMENT_SYNCHRONIZATION_REPORT.md` | Wave-02 deployment synchronization |
| 28B | `28B_ADMIN_DASHBOARD_GOVERNANCE_ALIGNMENT_REPORT.md` | Governance alignment and charter correction |
| 29 | `29_ADMIN_DASHBOARD_WAVE-02_CLOSEOUT_REPORT.md` | Wave-02 closeout and transition readiness |
| 30 | `30_ADMIN_DASHBOARD_PROGRAM_STATUS_REVIEW.md` | Program health and Wave-03 readiness |
| 31 | `31_ADMIN_DASHBOARD_WAVE-03_AUTHORIZATION.md` | Wave-03 authorized scope and package boundaries |

**Governance Verdict:** Every prerequisite for Wave-03 Engineering Kickoff is satisfied. Wave-03 has been formally authorized. Implementation is not authorized and has not started.

------------------------------------------------------------------------

# 4. Repository Validation

## 4.1 Git Verification

| Verification Check | Method | Result |
|---|---|---|
| HEAD commit | `git rev-parse HEAD` | `a1bc875978b08db4abf5c616b0db4d7b1f4f9828` "fix(MIG-001, MIG-002, MIG-003, MIG-004, RPC-002, DRIFT-003): Wave-02 Package-03 migration reconciliation and security context" |
| Current branch | `git branch --show-current` | `master` |
| Post-closeout commits | `git log --oneline -20` | No commits exist after `a1bc8759`. |
| Wave-02 implementation integrity | `git diff --stat a1bc8759 -- src/ supabase/migrations/ supabase/functions/ supabase/schema.sql` | **0 lines changed** — the accepted Wave-02 implementation is intact at `HEAD`. |
| All working-tree changes | `git diff --stat HEAD` | `.codebase-memory/artifact.json` and `.codebase-memory/graph.db.zst` (MCP graph re-index); `ADMIN_DASHBOARD_PLAN/00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` (Section 10 status update); `package.json` / `package-lock.json` (`supabase` CLI dev dependency). |
| Untracked entries | `git status --short` | Governance deliverables in `ADMIN_DASHBOARD_PLAN/`, `PROJECT_MASTER_INDEX*`, `PDP-*`, `PRODUCTION_*`, `memory-zone/` scratch artifacts. |

**Repository Stability Verdict:** The Admin Dashboard implementation has not materially changed since Wave-02 closeout. The only uncommitted code-facing change is the addition of the `supabase` CLI dev dependency, which is a tooling artifact. No Wave-03 implementation has started.

## 4.2 Codebase Memory MCP Verification

| Verification Check | Tool | Result |
|---|---|---|
| Project name | `codebase-memory` artifact | `vietsalepro` |
| Indexed commit | `.codebase-memory/artifact.json` | `a1bc875978b08db4abf5c616b0db4d7b1f4f9828` (matches `HEAD`) |
| Indexed at | `.codebase-memory/artifact.json` | `2026-07-21T01:21:48Z` |
| Nodes | `codebase-memory.query_graph` | 24,969 |
| Edges | `codebase-memory.query_graph` | 36,817 |
| Graph health | `query_graph` and `search_graph` | Responded successfully; labels include `Function`, `Route`, `Variable`, `File`, `Folder`, `Module`, `Section`. |
| Search capability | `search_graph(query="admin dashboard service")` | 10 ranked results across `utils/service.ts`, `components/admin/`, `pages/admin/AdminDashboardInner.tsx`, and `pages/SystemAdminDashboard.tsx`. |
| Search capability | `search_graph(query="Edge Function audit log")` | 255 ranked results across `supabase/schema.sql`, `supabase/functions/audit-log/index.ts`, `services/auditService.ts`, and `pages/admin/Audit.tsx`. |
| Call / dependency graph | `query_graph` for `edges` | 36,817 edges confirm a connected call/dependency graph. |

**Codebase Memory Verdict:** The Codebase Memory graph is healthy and synchronized to the Wave-02 closeout commit. No new admin-surface defects are visible in the indexed graph at `HEAD`.

------------------------------------------------------------------------

# 5. Supabase MCP Evidence

**Tool:** `supabase-mcp-server`

| Check | Production `QLBH` (`rsialbfjswnrkzcxarnj`) | Staging `QLBH Staging Multi-Tenant` (`shbmzvfcenbybvyzclem`) |
|---|---|---|
| Authentication | Access confirmed via `list_projects` | Access confirmed via `list_projects` |
| Project status | `ACTIVE_HEALTHY` | `ACTIVE_HEALTHY` |
| Region | `ap-northeast-1` | `ap-northeast-1` |
| Migration history | 126 migrations; **does not** include Wave-02 2026-07-21 migrations (`20260721012949`, `20260721013148`, `20260721013200`, `20260721013213`). | 129 migrations; **includes** Wave-02 migrations (`20260721012949`, `20260721013148`, `20260721013200`, `20260721013213`). |
| Edge Function inventory | Not enumerated (production remains at pre-Wave-02 baseline). | 10 active Edge Functions; `check-subdomain` and `admin-health-check` have `verify_jwt: false`; `audit-log`, `create-tenant`, `process-checkout`, `invite-member`, `reset-password`, `send-template-email`, `system-health`, `error-performance`, `create-system-admin` have `verify_jwt: true`. |
| Security context | No destructive queries executed; no platform changes made. | No destructive queries executed; no platform changes made. |

**Conclusion:**
- Production remains unchanged by Wave-02 (no Wave-02 migrations present).
- Staging is synchronized with Wave-02 deliverables.
- Migration drift between Staging and Production is consistent with the Wave-02 staging-only deployment authorization.
- The `verify_jwt: false` status of `check-subdomain` and `admin-health-check` is part of the Wave-03 remediation surface.

------------------------------------------------------------------------

# 6. Vercel MCP Evidence

**Tool:** `vercel`

| Check | Result |
|---|---|
| Authentication | Access confirmed via `list_teams` |
| Team | `tanphat056-3795's projects` (`team_5jIBUrVn2CmOrkSojeJZZqoP`) |
| Project | `vietsalepro` (`prj_UdCbqGpXxsBXVNGfz0fz02obBS6x`) |
| Framework | `vite` |
| Domains | `vietsalepro.com`, `*.vietsalepro.com`, `admin.vietsalepro.com`, `master.vietsalepro.com`, plus Vercel aliases |
| Latest deployment | `dpl_8rhXQm3qLawzjUSyBNpB2fN33eM5` |
| Deployment target | `production` |
| Deployment state | `READY` |
| Deployment commit | `3a06a6d9ad71fd1c4a5fcee21ce815293b742402` — "Production governance baseline before cutover (RC-2026-07-19-01)" |
| Git branch | `master` |
| `gitDirty` | `1` |

**Conclusion:**
- No Vercel deployment occurred after Wave-02 Closeout (`a1bc8759`).
- Production deployment is pinned to the pre-Wave-02 baseline commit `3a06a6d9`.
- Git linkage is intact (`master` branch, GitHub repository `vietsalepro/vietsalepro`).

------------------------------------------------------------------------

# 7. Engineering Skills Applied

| Skill | Reason for Selection | Evidence Collected | Contribution to Engineering Kickoff |
|---|---|---|---|
| `code-review` | Validate that no post-closeout implementation changes exist and that repository content aligns with the frozen Wave-03 execution contract. | `git diff --stat HEAD`, `git diff --stat a1bc8759`, Codebase Memory graph search. | Confirmed source-code integrity; identified only tooling/graph artifacts and governance status updates as uncommitted changes. |
| `system-design` | Define the architecture-first package decomposition and service-layer contract boundaries for the 22 remaining remediation issues. | `31_ADMIN_DASHBOARD_WAVE-03_AUTHORIZATION.md` Sections 8.4.2–8.6; `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` remediation portfolios. | Produced the package-based execution baseline that preserves dependency order and SSOT alignment. |
| `configuration-management` | Track uncommitted dependency and graph-artifact changes in the working tree so implementation starts from a clean baseline. | `package.json`/`package-lock.json` diff, `.codebase-memory/artifact.json` diff, `git status --short`. | Documented working-tree drift and the requirement to freeze/commit tooling changes before implementation. |
| `release-management` | Confirm deployment baseline, synchronization status, and production/staging boundary controls before Wave-03 planning. | Vercel deployment history, Supabase migration history for both environments, `list_edge_functions` for staging. | Verified that Wave-02 was staging-only and production remains untouched. |
| `risk-analysis` | Evaluate whether observed drift, Edge Function `verify_jwt` settings, and staging/production migration differences are blockers for kickoff. | Supabase `list_edge_functions` output, migration count deltas, Vercel `gitDirty` flag, working-tree drift. | Classified observations as non-blocking risks that must be carried into the Wave-03 Implementation Readiness Review. |
| `technical-documentation` | Synthesize governance, repository, and platform evidence into a single authoritative engineering kickoff artifact. | All sections of this document. | Provides the traceable, frozen execution contract required by the program charter. |
| `requesting-code-review` | Establish the peer-review gates that must pass before any Wave-03 package can be accepted. | Engineering Kickoff decision table; Verification Strategy section. | Codifies mandatory independent review for each package and the final Wave-03 Readiness Review. |
| `systematic-debugging` | Trace the dependency path from the 22 canonical issues through services, Edge Functions, and UI components to confirm impact ordering. | Codebase Memory `search_graph` and `query_graph` traces; `31` Section 8.6 repository impact list. | Validated that Package-01 must precede Package-02 and Package-03 to avoid broken intermediate states. |

------------------------------------------------------------------------

# 8. Engineering Execution Baseline

Wave-03 is authorized to address the 22 remaining unique `AD-Baseline-1.0` issues. Cross-categorized duplicates collapsed under the 43-unique view will be resolved through their canonical fixes, per `10A` Section 10.

## 8.1 Authorized Issues

| # | Issue ID | Primary Domain | Reason |
|---|---|---|---|
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

## 8.2 Package-01 — Service Layer & Permission Consolidation

| Attribute | Definition |
|---|---|
| **Objectives** | Stabilize the service-layer contract surface so all `services/admin/*.ts` wrappers call approved base services or canonical RPCs; close `admin_events` RLS and producer-policy gaps; make `lib/permissions.ts` the single enforcement path for privileged operations. |
| **Engineering goals** | Resolve `DEP-002`, `DEP-003`, `DEP-004`, `PERM-003`, and `SVC-001`–`SVC-005` through canonical service-layer fixes. |
| **Implementation boundaries** | `services/admin/*.ts`, `lib/permissions.ts`. New migrations may be created under `supabase/migrations/` for RLS/RPC changes. No direct edits to `supabase/schema.sql`. |
| **Repository boundaries** | Only `services/admin/*.ts`, `lib/permissions.ts`, and `supabase/migrations/` may be changed. All other repository areas are protected. |
| **Primary modules** | `services/admin/billingAdminService.ts`, `services/admin/analyticsAdminService.ts`, `services/admin/tenantAdminService.ts`, `lib/permissions.ts`. |
| **Primary services** | Base RPC wrappers for plan/invoice, overview metrics, custom-domain tokens, and `admin_events` producer policy. |
| **Primary Edge Functions** | None. |
| **Primary migrations** | New migrations for `admin_events` RLS/producer policy and any missing RPC signatures. |
| **Primary RPCs** | Canonical plan/invoice RPCs, overview RPCs, custom-domain verification RPCs, `admin_events` producer RPCs. |
| **Primary UI components** | None. |
| **Primary verification targets** | All service wrappers compile and resolve to canonical RPCs; `admin_events` producer tests pass; `lib/permissions.ts` remains the single privileged-enforcement path. |
| **Primary risks** | Medium — broad service-layer touch points; regression checks required on tenant, member, billing, audit, and license flows. |
| **Dependencies** | None within Wave-03. Must precede Package-02 and Package-03. |
| **Expected deliverables** | Service-layer contract alignment; `admin_events` RLS/producer policy completion; migration files committed. |

## 8.3 Package-02 — Execution, Edge Functions & Audit Logging

| Attribute | Definition |
|---|---|
| **Objectives** | Replace business-logic shortcuts with canonical validation RPCs; harden non-audit Edge Function access controls; close Edge Function audit-logging gaps. |
| **Engineering goals** | Resolve `BL-001`, `BL-002`, `BL-003`, `DIR-001`, `VAL-001`, `VAL-002`, `EDG-002`, `EDG-003`, `EDG-004`, `EDG-005`. |
| **Implementation boundaries** | `contexts/AuthContext.tsx`, `pages/InvitationsAccept.tsx`, `services/admin/*.ts`, `supabase/functions/check-subdomain/`, `supabase/functions/billing-webhooks/`. New migrations may be created under `supabase/migrations/`. |
| **Repository boundaries** | Only `contexts/AuthContext.tsx`, `pages/InvitationsAccept.tsx`, `services/admin/*.ts`, `supabase/functions/check-subdomain/`, `supabase/functions/billing-webhooks/`, and `supabase/migrations/` may be changed. All other areas are protected. |
| **Primary modules** | `contexts/AuthContext.tsx`, `pages/InvitationsAccept.tsx`, `services/admin/tenantAdminService.ts`, `services/admin/billingAdminService.ts`, `supabase/functions/check-subdomain/index.ts`, `supabase/functions/billing-webhooks/index.ts`. |
| **Primary services** | Tenant creation validation, billing lifecycle validation, canonical RPC wrappers consumed by Package-01. |
| **Primary Edge Functions** | `check-subdomain`, `billing-webhooks`. |
| **Primary migrations** | New migrations for access-control functions, audit-log helpers, and Edge Function auth context. |
| **Primary RPCs** | Canonical validation RPCs for tenant creation and billing lifecycle; `app_audit_log` write helpers. |
| **Primary UI components** | `pages/InvitationsAccept.tsx` (flow validation only). |
| **Primary verification targets** | Tenant and billing lifecycles use canonical RPCs; `check-subdomain` and `billing-webhooks` access controls are explicit; all privileged Edge Functions write to `app_audit_log`; `AuthContext` and `InvitationsAccept` flows validate through `AdminLayout`. |
| **Primary risks** | Medium — Edge Function auth and audit changes require staging deployment and runtime verification. |
| **Dependencies** | Package-01 service contracts. Must precede Package-03. |
| **Expected deliverables** | Execution flow alignment; hardened Edge Function auth and audit logging; migration files committed. |

## 8.4 Package-03 — UI, Architecture Cleanup & Operational Governance

| Attribute | Definition |
|---|---|
| **Objectives** | Align `AdminDashboardInner` tab model and lazy loading with reachable routes; remove or activate dead code; mitigate `tenant-backup` runtime limits. |
| **Engineering goals** | Resolve `ARCH-003`, `ARCH-004`, `ARCH-005`, `ARCH-006`, `DEAD-001`, `DEAD-002`, `DEAD-003`, `DEAD-004`, `PERF-001`, `PERF-002`. |
| **Implementation boundaries** | `pages/admin/AdminDashboardInner.tsx`, `pages/admin/AdminLayout.tsx`, `App.tsx`, `components/admin/*`, `services/admin/complianceAdminService.ts`, `supabase/functions/admin-health-check/`, `supabase/functions/deliver-webhook/`, `supabase/functions/system-health/`, `supabase/functions/tenant-backup/`. |
| **Repository boundaries** | Only `pages/admin/AdminDashboardInner.tsx`, `pages/admin/AdminLayout.tsx`, `App.tsx`, `components/admin/*`, `services/admin/complianceAdminService.ts`, `supabase/functions/admin-health-check/`, `supabase/functions/deliver-webhook/`, `supabase/functions/system-health/`, `supabase/functions/tenant-backup/`, and `supabase/migrations/` may be changed. All other areas are protected. |
| **Primary modules** | `pages/admin/AdminDashboardInner.tsx`, `pages/admin/AdminLayout.tsx`, `App.tsx`, `components/admin/*`, `services/admin/complianceAdminService.ts`. |
| **Primary services** | `complianceAdminService.ts` (remove browser API usage), `lib/permissions.ts` enforcement. |
| **Primary Edge Functions** | `admin-health-check`, `deliver-webhook`, `system-health`, `tenant-backup`. |
| **Primary migrations** | None expected; migrations only if activation of dead Edge Functions requires schema support. |
| **Primary RPCs** | None expected. |
| **Primary UI components** | `pages/admin/AdminDashboardInner.tsx`, `pages/admin/AdminLayout.tsx`, `components/admin/*`, `App.tsx`, `pages/InvitationsAccept.tsx`. |
| **Primary verification targets** | `InvitationsAccept` integrates with `AdminLayout` lazy-loading; `AdminDashboardInner` tabs match reachable routes; dead files/Edge Functions removed or activated with justification; `AdminDashboardInner` does not load all tab states on mount; `tenant-backup` runtime limits are understood and mitigated. |
| **Primary risks** | Low — primarily dead-code removal and UI route alignment; must not break existing admin navigation. |
| **Dependencies** | Package-02 execution and Edge Function contracts. |
| **Expected deliverables** | UI route/tab alignment; dead-code cleanup; operational governance for remaining Edge Functions; final Wave-03 verification readiness. |

## 8.5 Execution Order

1. **Freeze working tree.** Commit or discard uncommitted tooling changes (`package.json`/`package-lock.json`, `.codebase-memory/`) before implementation begins.
2. **Package-01 — Service Layer & Permission Consolidation.** Must complete first.
3. **Package-02 — Execution, Edge Functions & Audit Logging.** May start only after Package-01 passes its verification gate.
4. **Package-03 — UI, Architecture Cleanup & Operational Governance.** May start only after Package-02 passes its verification gate.
5. **Wave-03 Implementation Readiness Review.** Triggered after this Engineering Kickoff is accepted; implementation is not authorized until it passes.
6. **Wave-03 Verification.** Per-package and final verification after implementation.

## 8.6 Dependency Order

- Wave-01 trust-boundary fixes (`ARCH-001`, `PERM-001`, `ARCH-002`, `EXE-001`, `EDG-001`) must remain intact.
- Wave-02 database/RPC/migration consolidation (`DB-001`–`DB-004`, `DB-006`, `DB-007`, `DB-009`, `RPC-001`–`RPC-004`, `MIG-001`–`MIG-004`, `DRIFT-001`–`DRIFT-003`) must be accepted and staged.
- Program Owner Decision 1 (Hybrid SSOT Drift Strategy) and Decision 2 (Incremental Domain Strategy) govern Wave-03 sequencing.
- Package-01 must precede Package-02; Package-02 must precede Package-03.

## 8.7 Verification Order

1. **Package-01 verification:** static type check, unit/service tests for wrappers, `admin_events` producer policy tests.
2. **Package-02 verification:** Edge Function runtime verification in Staging, `check-subdomain` and `billing-webhooks` auth tests, audit-log write tests, `AuthContext`/`InvitationsAccept` flow tests.
3. **Package-03 verification:** UI regression checks (admin navigation, tab model), dead-code removal confirmation via Codebase Memory call graph, `tenant-backup` runtime review.
4. **Final Wave-03 verification:** end-to-end Admin Dashboard smoke tests in Staging; `supabase db push --dry-run` and migration integrity check; Vercel staging build verification.

## 8.8 Rollback Strategy

- Each package must be independently complete, verifiable, deployable, and acceptable.
- If any package fails verification, rollback to the Wave-02 closeout commit `a1bc8759` is possible because no implementation artifacts outside the approved package scope are touched.
- Each package must be committed as a discrete unit of work with clear issue references.
- No force-pushes, history rewrites, or unapproved `master` commits are permitted.
- Staging-only deployment is authorized; production remains pinned at `3a06a6d9` until Program Certification.

## 8.9 Engineering Constraints

- Only the 22 authorized unique `AD-Baseline-1.0` issues may be remediated.
- Every change must reference one or more `AD-Baseline-1.0` issue IDs and one or more SSOT document sections.
- Migrations must flow through the `supabase/migrations/` pipeline; direct edits to `supabase/schema.sql` are prohibited.
- Edge Function changes must be deployed to Staging for runtime verification before final acceptance.
- Production Supabase and Vercel environments must not be modified until Program Certification.
- No new Admin Dashboard capabilities, UX redesign, or features outside the 22 authorized issues.

## 8.10 Engineering Assumptions

- The `supabase` CLI tooling change in `package.json`/`package-lock.json` will be committed or reverted before implementation begins.
- Staging environment remains the target for Wave-03 verification.
- Codebase Memory graph will be re-indexed as needed during Wave-03 to validate dead-code removal.
- The 22 remaining issues can be completed within the three-package sequencing without further wave splitting.

## 8.11 Engineering Exclusions

- Any issue not in the `AD-Baseline-1.0` 43-unique set.
- New Admin Dashboard capabilities, UX redesign, or features not required to resolve the 22 authorized issues.
- Production Supabase or Vercel deployment (staging-only until Program Certification).
- Direct edits to `supabase/schema.sql` outside the migration pipeline.
- Modification of the sealed SSOT documents (`01`–`08`) without a formal Program Owner decision and SSOT amendment process.

------------------------------------------------------------------------

# 9. Execution Contract

## 9.1 What Is Allowed

- Implementation of the 22 authorized unique `AD-Baseline-1.0` issues within the three packages defined in Section 8.
- Creation of new migration files under `supabase/migrations/` to support the authorized changes.
- Modification of the repository areas listed in Section 10 for the package currently being executed.
- Staging-only Supabase migration push and Edge Function deployment for verification.
- Vercel preview/staging build for verification.
- Unit, integration, manual, and regression verification activities.
- Re-indexing the Codebase Memory graph to support dead-code and impact analysis.

## 9.2 What Is Prohibited

- Any implementation outside the 22 authorized unique issues.
- Skipping the Package-01 → Package-02 → Package-03 execution order.
- Direct edits to `supabase/schema.sql`.
- Production Supabase migration push, Edge Function deployment, or Vercel production deployment.
- Force-pushes, history rewrites, or unapproved `master` commits.
- Modification of sealed SSOT documents (`01`–`08`) or the Program Charter without formal amendment.
- Addition of new dependencies or features not required to resolve the authorized issues.

## 9.3 Protected Repository Areas

The following areas are protected and may not be modified unless explicitly authorized for the active package:

- `src/` business logic outside the Admin Dashboard surface.
- `supabase/schema.sql` (read-only; use migrations only).
- `supabase/migrations/` outside the new migration files created for the active package.
- Production environment configuration or secrets.
- `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` except for Section 10 status updates performed by authorized governance documents.

## 9.4 Required Implementation Sequence

1. **Wave-03 Implementation Readiness Review** must pass before any implementation begins.
2. **Package-01** implementation and verification.
3. **Package-02** implementation and verification (only after Package-01 acceptance).
4. **Package-03** implementation and verification (only after Package-02 acceptance).
5. **Wave-03 Verification Report** and **Wave-03 Acceptance Review**.

## 9.5 Verification Gates

- Package-01: static type check, service-wrapper tests, `admin_events` policy tests.
- Package-02: Edge Function auth/audit runtime verification, `AuthContext`/`InvitationsAccept` flow tests.
- Package-03: UI regression tests, dead-code removal confirmation, `tenant-backup` review.
- Final: Staging smoke tests, migration dry-run, Vercel staging build, governance traceability audit.

------------------------------------------------------------------------

# 10. Dependency Graph

``` text
Wave-01 trust-boundary fixes (ARCH-001, PERM-001, ARCH-002, EXE-001, EDG-001)
        |
        v
Wave-02 DB/RPC/migration consolidation (DB-001..DB-004, DB-006, DB-007, DB-009,
                                        RPC-001..RPC-004, MIG-001..MIG-004,
                                        DRIFT-001..DRIFT-003)
        |
        v
Wave-03 Engineering Kickoff (this document)
        |
        v
Wave-03 Implementation Readiness Review
        |
        v
Package-01 — Service Layer & Permission Consolidation
        |
        v
Package-02 — Execution, Edge Functions & Audit Logging
        |
        v
Package-03 — UI, Architecture Cleanup & Operational Governance
        |
        v
Wave-03 Verification, Acceptance, and Closeout
```

------------------------------------------------------------------------

# 11. Repository Impact

| Area | Files / Directories | Package |
|---|---|---|
| Service-layer wrappers | `services/admin/*.ts` | 1, 2 |
| Permission enforcement | `lib/permissions.ts` | 1 |
| Execution flows | `contexts/AuthContext.tsx`, `pages/InvitationsAccept.tsx` | 2 |
| UI / Architecture | `pages/admin/AdminDashboardInner.tsx`, `pages/admin/AdminLayout.tsx`, `App.tsx`, `components/admin/*` | 3 |
| Compliance service | `services/admin/complianceAdminService.ts` | 3 |
| Edge Functions (auth/audit) | `supabase/functions/check-subdomain/`, `supabase/functions/billing-webhooks/` | 2 |
| Edge Functions (cleanup/ops) | `supabase/functions/admin-health-check/`, `supabase/functions/deliver-webhook/`, `supabase/functions/system-health/`, `supabase/functions/tenant-backup/` | 3 |
| Migrations | `supabase/migrations/` | 1, 2 (and 3 if activation requires) |
| Schema | `supabase/schema.sql` — read-only | all |

No changes to `src/` business logic outside the Admin Dashboard surface are authorized.

------------------------------------------------------------------------

# 12. Verification Strategy

| Verification Layer | Method | Owner | Pass Criteria |
|---|---|---|---|
| Static | `tsc --noEmit`, `npm run lint`, Codebase Memory graph re-index | Engineer | No new type or lint errors; graph remains consistent. |
| Functional | Unit/service tests for wrappers; RPC call-site verification | Engineer | All `services/admin/*.ts` wrappers resolve to canonical RPCs. |
| Edge Function | Staging deployment; `supabase functions serve` / `curl` auth tests | Engineer + Reviewer | `check-subdomain` and `billing-webhooks` reject unauthenticated or unauthorized callers; audit writes succeed. |
| UI / Regression | Manual/admin-flow smoke tests; Vercel preview build | Engineer + Reviewer | Admin navigation, tab model, and `InvitationsAccept` flow behave as expected. |
| Migration | `supabase db push --dry-run` against Staging | Engineer + Reviewer | No unexpected drift; new migrations apply cleanly. |
| Governance | Traceability audit against `AD-Baseline-1.0` IDs and SSOT sections | PMO | Every change maps to an authorized issue and SSOT section. |

------------------------------------------------------------------------

# 13. Engineering Readiness

## 13.1 Blockers

None. The repository, git state, Codebase Memory graph, Supabase MCP evidence, and Vercel MCP evidence all confirm that Wave-03 is ready for Engineering Kickoff.

## 13.2 Observations

The following observations are non-blocking but must be tracked through Wave-03 implementation:

- Uncommitted `package.json`/`package-lock.json` change (`supabase` CLI dev dependency) and `.codebase-memory/*` graph artifacts must be committed or reverted before implementation begins.
- Staging `verify_jwt: false` on `check-subdomain` and `admin-health-check` is part of the Wave-03 remediation surface.
- Vercel `gitDirty` flag is `1` because of uncommitted working-tree files; no production deployment has occurred.

## 13.3 Readiness Declaration

**Engineering is Ready** to proceed to the Wave-03 Implementation Readiness Review.

------------------------------------------------------------------------

# 14. Formal Recommendation

## Final Decision

**ENGINEERING READY WITH OBSERVATIONS**

This decision is supported by:

- **Governance evidence:** All mandatory documents `00` through `31` have been reviewed. Wave-03 is formally authorized. Wave-01 and Wave-02 are closed. The sealed baseline `AD-Baseline-1.0` is the only approved source of issues.
- **Repository evidence:** `git diff --stat a1bc8759 -- src/ supabase/migrations/ supabase/functions/ supabase/schema.sql` returns 0 lines changed. The Wave-02 implementation is intact.
- **Git evidence:** `HEAD` is `a1bc8759` on `master`; no post-closeout commits exist; the only tracked diffs are tooling/graph artifacts and a charter Section 10 status update.
- **Codebase Memory MCP evidence:** Graph is indexed at `a1bc8759` with 24,969 nodes and 36,817 edges; search and query operations respond successfully.
- **Supabase MCP evidence:** Production has 126 migrations and no Wave-02 migrations; Staging has 129 migrations including the four Wave-02 migrations; `check-subdomain` and `admin-health-check` `verify_jwt` flags are documented Wave-03 remediation surfaces.
- **Vercel MCP evidence:** Latest production deployment is `dpl_8rhXQm3qLawzjUSyBNpB2fN33eM5` at commit `3a06a6d9`; no deployment occurred after Wave-02 Closeout.
- **Engineering evidence:** A frozen execution contract with three ordered packages, explicit repository boundaries, and per-package verification gates is established.
- **Roadmap evidence:** The Program Charter Section 10 will be updated to mark Wave-03 Engineering Kickoff as `COMPLETE` and Wave-03 Implementation Readiness Review as `READY TO START`, with Program Status set to `WAVE-03 ENGINEERING READY`.

No implementation, deployment, migration, or production modification has occurred during the production of this document.
