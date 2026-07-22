# 45_ADMIN_DASHBOARD_WAVE-03_ACCEPTANCE_REVIEW

**Document ID:** 45_ADMIN_DASHBOARD_WAVE-03_ACCEPTANCE_REVIEW  
**Date:** 2026-07-21  
**Project:** VietSalePro  
**Sub Project:** Admin Dashboard  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** B — System Remediation  
**Wave:** Wave-03  
**Acting Capacity:** Enterprise Acceptance Review Board / Independent Quality Gate / Principal Software Architect / Enterprise Governance Board  
**Baseline:** AD-Baseline-1.0  
**Repository Scope:** `C:\PROJECT\vietsalepro` @ commit `53be3e880911b6d52d6d7f921037769cc71b24ac`  
**Repository Artifacts Modified:** `45_ADMIN_DASHBOARD_WAVE-03_ACCEPTANCE_REVIEW.md` and status sections of `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` and `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` only  
**Status:** Acceptance COMPLETE — **WAVE-03 ACCEPTED WITH OBSERVATIONS**

------------------------------------------------------------------------

# 1. Executive Summary

This document is the formal **Wave-03 Acceptance Review** for Phase B of the Admin Dashboard System Remediation Program. It is an independent enterprise quality gate that evaluates the Wave as a whole, not individual packages. It is **not** implementation, verification, deployment, or closeout.

All three Wave-03 implementation packages have completed their governance chains (Implementation Readiness Review → Post-Implementation Review → Verification Report → Acceptance Review). All Wave-03 deliverables exist in `ADMIN_DASHBOARD_PLAN\`. Repository hygiene and governance realignment activities are complete. The Codebase Memory MCP graph is healthy and synchronized. No unintended source-code drift was found; `npm run lint` (`tsc --noEmit`) passes.

**Acceptance Decision:**

``` text
WAVE-03 ACCEPTED WITH OBSERVATIONS
```

**Wave Closeout Readiness:**

``` text
READY FOR WAVE-03 CLOSEOUT
```

The observations recorded in this review are non-blocking and relate to working-tree hygiene, deployment drift, and traceability. They do not prevent progression to Wave-03 Closeout.

------------------------------------------------------------------------

# 2. Documents Reviewed

The following mandatory governance documents were read in full during this acceptance review. No document or section was skipped.

| # | Document | Role in Acceptance Review |
|---|----------|---------------------------|
| 00 | `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` | Program charter, lifecycle, transition rules, current status |
| 12 | `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` | Strategic remediation portfolios and program status |
| 30 | `30_ADMIN_DASHBOARD_PROGRAM_STATUS_REVIEW.md` | Wave-02 closeout and Wave-03 readiness baseline |
| 31 | `31_ADMIN_DASHBOARD_WAVE-03_AUTHORIZATION.md` | Wave-03 authorized scope and package boundaries |
| 32 | `32_ADMIN_DASHBOARD_WAVE-03_ENGINEERING_KICKOFF.md` | Engineering constraints and package definitions |
| 33 | `33_ADMIN_DASHBOARD_WAVE-03_IMPLEMENTATION_READINESS_REVIEW.md` | Frozen Wave-03 execution contract |
| 34 | `34_ADMIN_DASHBOARD_WAVE-03_PACKAGE-01_POST_IMPLEMENTATION_REVIEW.md` | Package-01 implementation evidence |
| 35 | `35_ADMIN_DASHBOARD_WAVE-03_PACKAGE-01_VERIFICATION_REPORT.md` | Package-01 independent verification |
| 36 | `36_ADMIN_DASHBOARD_WAVE-03_PACKAGE-01_ACCEPTANCE_REVIEW.md` | Package-01 acceptance determination |
| 37 | `37_ADMIN_DASHBOARD_WAVE-03_PACKAGE-02_IMPLEMENTATION_READINESS_REVIEW.md` | Package-02 frozen execution contract |
| 38 | `38_ADMIN_DASHBOARD_WAVE-03_PACKAGE-02_POST_IMPLEMENTATION_REVIEW.md` | Package-02 implementation evidence |
| 39 | `39_ADMIN_DASHBOARD_WAVE-03_PACKAGE-02_VERIFICATION_REPORT.md` | Package-02 independent verification |
| 40 | `40_ADMIN_DASHBOARD_WAVE-03_PACKAGE-02_ACCEPTANCE_REVIEW.md` | Package-02 acceptance determination |
| 41 | `41_ADMIN_DASHBOARD_WAVE-03_PACKAGE-03_IMPLEMENTATION_READINESS_REVIEW.md` | Package-03 frozen execution contract |
| 42 | `42_ADMIN_DASHBOARD_WAVE-03_PACKAGE-03_POST_IMPLEMENTATION_REVIEW.md` | Package-03 implementation evidence |
| 43 | `43_ADMIN_DASHBOARD_WAVE-03_PACKAGE-03_VERIFICATION_REPORT.md` | Package-03 independent verification |
| 44 | `44_ADMIN_DASHBOARD_WAVE-03_PACKAGE-03_ACCEPTANCE_REVIEW.md` | Package-03 acceptance determination |
| 45 | `WAVE03_CLOSEOUT_READINESS_REVIEW.md` | Closeout readiness state |
| 45 | `REPOSITORY_GOVERNANCE_REALIGNMENT_REPORT.md` | Repository governance realignment evidence |
| 45 | `REPOSITORY_HYGIENE_DECISION_REGISTER.md` | Repository hygiene decisions |
| 45 | `ISSUES_BEFORE_CLOSEOUT.md` | Pre-closeout issue disposition |

**Governance Verdict:** Every mandatory document is present and legible. The Wave-03 governance chain is intact from Authorization through Acceptance.

------------------------------------------------------------------------

# 3. Repository Review

## 3.1 Git Verification

| Verification Check | Method | Result |
|---|---|---|
| HEAD commit | `git rev-parse HEAD` | `53be3e880911b6d52d6d7f921037769cc71b24ac` — "docs(00): Wave-03 governance knowledge preservation and charter evolution" |
| Current branch | `git branch --show-current` | `master` |
| Sealed baseline commit reachable | `git rev-parse 3a06a6d9` | `3a06a6d9` present and reachable |
| Source-code modifications since `HEAD` | `git diff --stat HEAD -- src/ pages/ components/ services/ lib/ hooks/ supabase/migrations/ supabase/schema.sql supabase/functions/` | **0 lines** — no source drift |
| `supabase/schema.sql` drift | `git diff --stat a1bc8759..HEAD -- supabase/schema.sql` | **0 lines** — no direct schema edits |
| Lint / TypeScript gate | `npm run lint` (`tsc --noEmit`) | **PASS** — exit code `0`, no output |

## 3.2 Removed Artifact Verification

| Artifact | Expected State | Method | Result |
|---|---|---|---|
| `services/admin/permissions.ts` | Removed | `find_file_by_name` / `grep` in `ts,tsx,js,jsx` | Not found; 0 source references |
| `supabase/functions/deliver-webhook/` | Removed | `find_file_by_name` / `grep` in `ts,tsx,js,jsx,json,toml,sql` | Directory not found; 0 source references |
| `archive/temporary/memory-zone/scripts/migrate_capitalize_product_names.ts` | Removed | `find_file_by_name` | Not found |
| `supabase/functions/admin-health-check/` | Retained | `find_file_by_name` | `supabase/functions/admin-health-check/index.ts` present |

## 3.3 Working-Tree Assessment

| Item | Count | Classification |
|---|---|---|
| Tracked modifications | 4 (`.codebase-memory/artifact.json`, `.codebase-memory/graph.db.zst`, `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md`, `ADMIN_DASHBOARD_PLAN/ISSUES_BEFORE_CLOSEOUT.md`) | Tooling / governance status only |
| Staged changes | 0 | — |
| Untracked files / directories | 76 | Governance deliverables, cleanup reports, `PDP-*`, `PRODUCTION_*`, `PROJECT_MASTER_INDEX*`, `memory-zone/` scratch artifacts |
| Source-code drift | 0 | — |

**Repository Verdict:** No application source-code drift is present. The working-tree changes are intentional governance, tooling, and scratch artifacts that must be dispositioned during Wave-03 Closeout. Some relocated governance documents are not yet fully staged (e.g., `DELIVER_WEBHOOK_CLEANUP_EXECUTION_REPORT.md` shows as deleted at root and untracked in `ADMIN_DASHBOARD_PLAN\`).

------------------------------------------------------------------------

# 4. Codebase Review Summary

## 4.1 Codebase Memory MCP Evidence

**Tool:** `codebase-memory`

| Verification Check | Method | Result |
|---|---|---|
| Project name | `query_graph` | `vietsalepro` |
| Indexed nodes | `MATCH (n) RETURN count(n)` | 25,511 |
| Indexed edges | `MATCH ()-[r]->() RETURN count(r)` | 37,301 |
| `services/admin/permissions.ts` source search | `search_graph(name_pattern="services/admin/permissions\\.ts")` | 0 source Module nodes; only baseline/ISSUE sections found |
| `supabase/functions/deliver-webhook` source search | `search_graph(name_pattern="supabase/functions/deliver-webhook")` | 0 source nodes; only governance sections found |
| `admin-health-check` source search | `find_file_by_name` / graph search | Present and traceable |

## 4.2 Changed Surface Review

| Package | Primary Files / Areas | Verdict |
|---|---|---|
| Package-01 | `services/admin/analyticsAdminService.ts`, `billingAdminService.ts`, `tenantAdminService.ts`; migration `20260721100000_wave03_package01_service_layer_permissions.sql` | All changes authorized; canonical RPCs / service wrappers traceable |
| Package-02 | `contexts/AuthContext.tsx`, `services/admin/tenantAdminService.ts`, `pages/admin/AdminLayout.tsx`, `supabase/functions/check-subdomain/index.ts`, `supabase/functions/billing-webhooks/index.ts`; migration `20260721120000_wave03_package02_edge_audit.sql` | All changes authorized; audit-log and rate-limit controls added |
| Package-03 | `pages/admin/AdminDashboardInner.tsx`, `App.tsx`, `pages/admin/AdminLayout.tsx`, `services/admin/complianceAdminService.ts`, `components/admin/complianceExport.ts`, `components/ComplianceManager.tsx`, `supabase/functions/tenant-backup/index.ts` | All changes authorized; unreachable tabs removed, lazy loading added, runtime caps added |

**Codebase Verdict:** The repository surface is consistent with the accepted Wave-03 implementation. No hidden or unauthorized changes were found. Dead-code targets have been removed or verified as production infrastructure.

------------------------------------------------------------------------

# 5. Governance Chain Verification

| Gate | Package-01 | Package-02 | Package-03 |
|---|---|---|---|
| Authorization | `31` Wave-03 Authorization | `31` Wave-03 Authorization | `31` Wave-03 Authorization |
| Engineering Kickoff | `32` | `32` | `32` |
| Implementation Readiness Review | `33` (Package-01) | `37` (Package-02) | `41` (Package-03) |
| Post-Implementation Review | `34` | `38` | `42` |
| Verification Report | `35` — VERIFIED WITH OBSERVATIONS | `39` — VERIFIED WITH OBSERVATIONS | `43` — VERIFIED WITH OBSERVATIONS |
| Acceptance Review | `36` — ACCEPTED WITH OBSERVATIONS | `40` — ACCEPTED WITH OBSERVATIONS | `44` — ACCEPTED WITH OBSERVATIONS |

**Governance Chain Verdict:** Every package completed the full governance chain. Every implementation has verification; every verification has acceptance. No gaps exist.

------------------------------------------------------------------------

# 6. Package Acceptance Summary

| Package | Scope | Implementation Commit | Acceptance Outcome | Primary Issues Addressed |
|---|---|---|---|---|
| Package-01 — Service Layer & Permission Consolidation | `e2470ae5` | `e2470ae5` — `fix(DEP-002,DEP-003,DEP-004,PERM-003,SVC-001-SVC-005): Wave-03 Package-01 service layer and permissions` | ACCEPTED WITH OBSERVATIONS | `DEP-002`, `DEP-003`, `DEP-004`, `PERM-003`, `SVC-001`–`SVC-005` |
| Package-02 — Execution, Edge Functions & Audit Logging | `74ae6622` | `74ae6622` — `fix(BL-001,BL-002,BL-003,DIR-001,VAL-001,VAL-002,EDG-002-EDG-005): Wave-03 Package-02 execution, edge, and audit` | ACCEPTED WITH OBSERVATIONS | `BL-001`–`BL-003`, `DIR-001`, `VAL-001`, `VAL-002`, `EDG-002`–`EDG-005` |
| Package-03 — UI, Architecture Cleanup & Operational Governance | `02b67c84` | `02b67c84` — `fix(ARCH-003-ARCH-006,DEAD-004,PERF-001,PERF-002): Wave-03 Package-03 UI, architecture cleanup, and ops` | ACCEPTED WITH OBSERVATIONS | `ARCH-003`–`ARCH-006`, `DEAD-004`, `PERF-001`, `PERF-002` |

**Package Acceptance Verdict:** All three packages are formally accepted. Every accepted package carries non-blocking observations that are recorded in this review.

------------------------------------------------------------------------

# 7. Repository Hygiene Review

## 7.1 Hygiene Decision Register

`REPOSITORY_HYGIENE_DECISION_REGISTER.md` records three decisions:

| # | Artifact | Decision | Status | Classification |
|---|----------|----------|--------|----------------|
| 1 | `services/admin/permissions.ts` | REMOVE | Completed | Dead Artifact |
| 2 | `supabase/functions/admin-health-check` | KEEP | Verified | Production Infrastructure Artifact |
| 3 | `supabase/functions/deliver-webhook` | REMOVE | Completed | Dead Artifact |

## 7.2 Execution Verification

| Decision | Evidence | Result |
|---|---|---|
| `permissions.ts` removed | File not found; 0 source references in `ts,tsx,js,jsx` | Completed |
| `admin-health-check` kept | `supabase/functions/admin-health-check/index.ts` present; external monitoring confirmed | Verified |
| `deliver-webhook` removed | Directory not found; 0 source references in `ts,tsx,js,jsx,json,toml,sql` | Completed |
| Archive lint issue removed | File not found; `npm run lint` passes | Completed |

## 7.3 Issues Before Closeout

`ADMIN_DASHBOARD_PLAN/ISSUES_BEFORE_CLOSEOUT.md` records all pre-closeout issues as `RESOLVED`. No open repository hygiene actions remain.

**Repository Hygiene Verdict:** All Wave-03 repository hygiene decisions have been executed and verified. No blocking hygiene issues remain.

------------------------------------------------------------------------

# 8. Repository Governance Review

`REPOSITORY_GOVERNANCE_REALIGNMENT_REPORT.md` documents the relocation of eight governance artifacts from the repository root into `ADMIN_DASHBOARD_PLAN\`:

| # | Document | Status |
|---|----------|--------|
| 1 | `WAVE03_CLOSEOUT_READINESS_REVIEW.md` | Moved to `ADMIN_DASHBOARD_PLAN\` |
| 2 | `ARCHIVE_LINT_CLEANUP_EXECUTION_REPORT.md` | Moved to `ADMIN_DASHBOARD_PLAN\` |
| 3 | `PERMISSIONS_WRAPPER_CLEANUP_EXECUTION_REPORT.md` | Moved to `ADMIN_DASHBOARD_PLAN\` |
| 4 | `REPOSITORY_HYGIENE_DECISION_REGISTER.md` | Moved to `ADMIN_DASHBOARD_PLAN\` |
| 5 | `DELIVER_WEBHOOK_CLEANUP_EXECUTION_REPORT.md` | Moved to `ADMIN_DASHBOARD_PLAN\` |
| 6 | `DELIVER_WEBHOOK_ARTIFACT_VERIFICATION_REPORT.md` | Moved to `ADMIN_DASHBOARD_PLAN\` |
| 7 | `ADMIN_HEALTH_CHECK_GOVERNANCE_DECISION.md` | Moved to `ADMIN_DASHBOARD_PLAN\` |
| 8 | `ADMIN_HEALTH_CHECK_ARTIFACT_VERIFICATION_REPORT.md` | Moved to `ADMIN_DASHBOARD_PLAN\` |

The realignment report states:

- No duplicate copies remain in the repository root.
- No broken document references were found.
- No references to the old root-level filenames remain in other documents.
- The governance chain remains valid.

**Observation:** `git status --short` shows that some moves are not yet fully staged/committed (e.g., `DELIVER_WEBHOOK_CLEANUP_EXECUTION_REPORT.md` appears as deleted at root and `??` in `ADMIN_DASHBOARD_PLAN\`). This is a working-tree hygiene observation, not a governance-chain defect.

**Repository Governance Verdict:** Repository governance realignment is complete at the document level. The remaining staging/committal steps belong to Wave-03 Closeout.

------------------------------------------------------------------------

# 9. Knowledge Preservation Review

The Program Charter (Section 7 Long-Term Workflow and Section 10 Current Status) and the Remediation Master Plan (Section 12A Repository Baseline Evolution) preserve the following Wave-03 knowledge:

1. **Repository Baseline Classification** — `admin-health-check` is permanently classified as a Production Infrastructure Artifact; dead artifacts are classified and dispositioned.
2. **Repository Hygiene Governance Model** — the decision register format, verification rules, and "production-before-cleanup" rule are recorded.
3. **AI Development Infrastructure Recognition** — `.codebase-memory` and MCP tooling are acknowledged as permanent program infrastructure.
4. **Governance Document Architecture** — all Admin Dashboard governance deliverables are stored under `ADMIN_DASHBOARD_PLAN\` with traceability headers.

**Knowledge Preservation Verdict:** The Wave-03 knowledge preservation obligations defined by the Program Charter have been satisfied.

------------------------------------------------------------------------

# 10. Roadmap Consistency Review

The following status documents are affected by the Wave-03 Acceptance Review milestone and have been updated to remain internally consistent:

- `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` — Section 10 `Current Status` now shows `Wave-03 Acceptance Review: COMPLETE` and `Program Status: WAVE-03 ACCEPTED WITH OBSERVATIONS — READY FOR CLOSEOUT`.
- `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` — Section 13 `Program Status` now reflects Wave-03 acceptance and closeout readiness.

No conflicting milestone status remains between the Charter, Master Plan, and Wave-03 package/acceptance documents.

------------------------------------------------------------------------

# 11. Observations

All observations are classified as **Informational**. None are Critical, Major, or Minor. None block Wave-03 Closeout.

| ID | Observation | Evidence | Impact | Recommendation | Blocks Closeout |
|---|---|---|---|---|---|
| OBS-45-01 | Package-01 committed migration file `20260721100000_wave03_package01_service_layer_permissions.sql` has a different timestamp than the Staging migration history entry `20260721031151`. | `35` Section 8.3; `supabase-mcp-server` `list_migrations` | Traceability only; SQL intent matches | Retain as traceability note; align naming in future deployment sync | No |
| OBS-45-02 | Package-02 `InvitationsAccept` route/title was added to `AdminLayout` but is not exercised at runtime because `InvitationsAccept` is rendered outside `AdminLayout`. | `40` Section 3.2; `39` Section 3.2 | Cosmetic active-state gap; routing functional | Document as architecture limitation; no functional change needed | No |
| OBS-45-03 | Package-02 `supabase/config.toml` does not explicitly set `verify_jwt = false` for `check-subdomain`. | `40` Section 3.2; `check-subdomain/index.ts` comments | Configuration documentation gap | Verify platform default before Production cutover | No |
| OBS-45-04 | Package-03 `services/admin/permissions.ts`, `supabase/functions/admin-health-check/`, and `supabase/functions/deliver-webhook/` were confirmed dead but not physically removed at the time of package acceptance. | `44` OBS-44-01; `codebase-memory` search | Dead-code retention; no runtime impact | `permissions.ts` and `deliver-webhook` now removed; `admin-health-check` kept as production artifact | No |
| OBS-45-05 | Package-03 `components/ComplianceManager.tsx` is outside the strict `components/admin/*` boundary but required a one-line import update to consume `components/admin/complianceExport.ts`. | `44` OBS-44-03 | Boundary exception documented | Retain exception in boundary runbook | No |
| OBS-45-06 | Codebase Memory graph artifact can lag behind `HEAD` when intervening commits are documentation-only. | `.codebase-memory/artifact.json` | None for current source surface | Re-index at next engineering activity if source changes occur | No |
| OBS-45-07 | Wave-03 migrations are applied to Staging but not to Production, creating staging/production migration drift. | `44` OBS-44-05; `supabase-mcp-server` `list_migrations` | Environment drift | Address in Wave-03 Deployment Synchronization / closeout, not acceptance | No |
| OBS-45-08 | Working tree contains 76 untracked governance/scratch artifacts and several not-yet-staged relocated documents. | `git status --short` | Working-tree cleanliness | Stage/commit disposition during Wave-03 Closeout | No |

------------------------------------------------------------------------

# 12. Acceptance Decision

**Independent Acceptance Determination:**

- All mandatory Wave-03 governance documents were reviewed in full.
- Every authorized Wave-03 deliverable exists.
- Every package completed its full governance chain (IRR → Post-Implementation → Verification → Acceptance).
- Every implementation has verification; every verification has acceptance.
- Repository hygiene activities are complete.
- Repository governance realignment is complete at the document level.
- Knowledge preservation obligations have been satisfied.
- Repository traceability remains complete.
- No unresolved Critical governance issue remains.
- Master Plan objectives for Wave-03 have been satisfied.
- Wave-03 exit conditions have been satisfied.
- No unauthorized source-code drift or production deployment occurred.

**Final Decision:**

``` text
WAVE-03 ACCEPTED WITH OBSERVATIONS
```

------------------------------------------------------------------------

# 13. Wave Closeout Readiness

**Wave-03 Closeout Readiness Determination:**

``` text
READY FOR WAVE-03 CLOSEOUT
```

**Justification:**

- All three Wave-03 packages are formally accepted.
- All repository hygiene decisions have been executed and verified.
- `npm run lint` (`tsc --noEmit`) passes.
- No live source references remain for removed artifacts.
- No unintended source-code drift is present.
- The remaining working-tree changes are intentional governance and tooling artifacts.

**Blocking Items:** None.

------------------------------------------------------------------------

# 14. Recommendations

1. **Proceed to Wave-03 Closeout** as the next authorized activity. Do not begin Wave-04 or Program Certification until closeout is complete.
2. **Disposition the working tree** during closeout: stage or commit the relocated governance documents, decide whether to commit or reset `.codebase-memory` index files, and archive/remove `memory-zone/` scratch artifacts or add them to `.gitignore`.
3. **Reconcile staging/production migration drift** through the approved Deployment Synchronization program (PDP-* documents) as part of closeout, not acceptance.
4. **Re-index Codebase Memory** at the start of the next engineering wave if source changes have occurred.
5. **Verify `supabase/config.toml` `verify_jwt` defaults** for `check-subdomain` before any Production cutover.

------------------------------------------------------------------------

# 15. Evidence Summary

- `git rev-parse HEAD` — `53be3e880911b6d52d6d7f921037769cc71b24ac`
- `git diff --stat HEAD -- src/ pages/ components/ services/ lib/ hooks/ supabase/migrations/ supabase/schema.sql supabase/functions/` — 0 lines
- `npm run lint` (`tsc --noEmit`) — exit code `0`
- `find_file_by_name` for `services/admin/permissions.ts` — no files found
- `find_file_by_name` for `supabase/functions/deliver-webhook/*` — no files found
- `find_file_by_name` for `supabase/functions/admin-health-check/*` — `index.ts` found
- `grep` for `services/admin/permissions` in `ts,tsx,js,jsx` — 0 matches
- `grep` for `deliver-webhook` in `ts,tsx,js,jsx,json,toml,sql` — 0 matches
- `codebase-memory` `query_graph` — 25,511 nodes / 37,301 edges
- `WAVE03_CLOSEOUT_READINESS_REVIEW.md` — `READY FOR WAVE-03 CLOSEOUT`
- `REPOSITORY_GOVERNANCE_REALIGNMENT_REPORT.md` — realignment complete and accepted
- `REPOSITORY_HYGIENE_DECISION_REGISTER.md` — all decisions `Completed`/`Verified`
- `ADMIN_DASHBOARD_PLAN/ISSUES_BEFORE_CLOSEOUT.md` — all issues `RESOLVED`
