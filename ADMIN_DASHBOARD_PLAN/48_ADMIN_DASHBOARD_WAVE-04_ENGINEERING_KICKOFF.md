# 48_ADMIN_DASHBOARD_WAVE-04_ENGINEERING_KICKOFF

**Document ID:** 48_ADMIN_DASHBOARD_WAVE-04_ENGINEERING_KICKOFF  
**Date:** 2026-07-22  
**Project:** VietSalePro  
**Sub Project:** Admin Dashboard  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** B — System Remediation  
**Wave:** Wave-04  
**Acting Capacity:** Enterprise Program Management Office (PMO) together with the Principal Software Architect  
**Baseline:** AD-Baseline-1.0  
**Repository Scope:** `C:\PROJECT\vietsalepro` @ commit `53be3e880911b6d52d6d7f921037769cc71b24ac`  
**Repository Artifacts Modified:** `48_ADMIN_DASHBOARD_WAVE-04_ENGINEERING_KICKOFF.md` and status sections of `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` and `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` only  
**Status:** Engineering Kickoff COMPLETE WITH OBSERVATIONS — Implementation Readiness Review NOT READY

------------------------------------------------------------------------

# 1. Executive Summary

This document is the formal **Engineering Kickoff** for **Wave-04** of the Admin Dashboard System Remediation Program. It is a governance and engineering planning activity only. It does **not** authorize implementation, verification, acceptance, or deployment.

Wave-04 is the **Residual Hardening, Repository Finalization, and Program Certification Readiness** wave. It consumes the non-blocking observations carried forward from `46_ADMIN_DASHBOARD_WAVE-03_CLOSEOUT.md` and the residual direct `.from()` service-layer reads identified in `39_ADMIN_DASHBOARD_WAVE-03_PACKAGE-02_VERIFICATION_REPORT.md`. The wave prepares the repository for the Program Certification gate and closes the final governance loop of Phase B.

All mandatory governance documents in the Wave-04 chain have been reviewed. The sealed baseline `AD-Baseline-1.0` is fully consumed; all 43 unique baseline issues have been remediated, verified, and accepted across Wave-01, Wave-02, and Wave-03. No application source-code drift is present at `HEAD`.

**Engineering Kickoff Decision:**

- **Wave-04 Engineering Kickoff:** **COMPLETE WITH OBSERVATIONS** (this document).
- **Wave-04 Engineering Kickoff Execution:** **NOT AUTHORIZED** until the observations listed in Section 23 are resolved.
- **Wave-04 Implementation Readiness Review:** **NOT READY** until the working tree is dispositioned and the repository baseline is clean.
- **Wave-04 Implementation:** **NOT STARTED** and not authorized by this document.
- **Overall Program Status:** **ACTIVE** — WAVE-04 AUTHORIZED WITH OBSERVATIONS.

------------------------------------------------------------------------

# 2. Governance Chain Review

The Wave-04 governance chain was reconstructed from the Phase A baseline through the Wave-03 closeout. Every link below was verified against its source document.

| Gate | Expected Status | Current Status | Evidence |
|---|---|---|---|
| Phase A | CLOSED | **CLOSED** | `10B_ADMIN_DASHBOARD_PHASE_A_CLOSEOUT.md` |
| Baseline | SEALED | **SEALED (AD-Baseline-1.0)** | `10B` Section 11; `12` Section 4 |
| Phase B | OPEN | **OPEN** | `11` Section 1 |
| Remediation Master Plan | COMPLETE | **COMPLETE** | `12` Section 14 |
| Program Owner Decisions 1–4 | COMPLETE | **COMPLETE** | `13` Section 12 |
| Wave Planning | COMPLETE | **COMPLETE** | `12` Section 7; `47` Section 2 |
| Wave-01 Authorization | COMPLETE | **COMPLETE** | `14` Section 1 |
| Wave-01 Engineering Kickoff | COMPLETE | **COMPLETE** | `15` Section 1 |
| Wave-01 Implementation Readiness Review | COMPLETE | **COMPLETE** | `16` Section 1 |
| Wave-01 Implementation | COMPLETE | **COMPLETE** | `17`, `18`, `19` |
| Wave-01 Verification | COMPLETE | **PASS WITH OBSERVATIONS** | `20` Section 1 |
| Wave-01 Acceptance | COMPLETE | **ACCEPTED** | `21` Section 1 |
| Wave-01 Closeout | COMPLETE | **CLOSED** | `22` Section 12 |
| Wave-02 Authorization | COMPLETE | **COMPLETE** | `23` Section 1 |
| Wave-02 Engineering Kickoff | COMPLETE | **COMPLETE** | `24` Section 1 |
| Wave-02 Implementation Readiness Review | COMPLETE | **COMPLETE** | `25` Section 1 |
| Wave-02 Implementation | COMPLETE | **COMPLETE** | `26A`, `26B`, `26C` |
| Wave-02 Verification | COMPLETE | **PASS WITH OBSERVATIONS** | `27` Section 1 |
| Wave-02 Acceptance | COMPLETE | **ACCEPTED** | `28` Section 1 |
| Wave-02 Closeout | COMPLETE | **CLOSED** | `29` Section 12 |
| Wave-03 Authorization | COMPLETE | **COMPLETE** | `31` Section 1 |
| Wave-03 Engineering Kickoff | COMPLETE | **COMPLETE** | `32` Section 1 |
| Wave-03 Implementation Readiness Review | COMPLETE | **COMPLETE** | `33`, `37`, `41` |
| Wave-03 Implementation | COMPLETE | **COMPLETE** | `34`, `38`, `42` |
| Wave-03 Verification | COMPLETE | **PASS WITH OBSERVATIONS** | `35`, `39`, `43` |
| Wave-03 Acceptance | COMPLETE | **ACCEPTED WITH OBSERVATIONS** | `36`, `40`, `44`, `45` |
| Wave-03 Closeout | COMPLETE | **CLOSED WITH OBSERVATIONS** | `46` Section 1 |
| Wave-04 Authorization | AUTHORIZED WITH OBSERVATIONS | **AUTHORIZED WITH OBSERVATIONS** | `47` Section 1 |
| Wave-04 Engineering Kickoff | READY | **COMPLETE WITH OBSERVATIONS** (this document) | — |
| Wave-04 Implementation Readiness Review | NOT STARTED | **NOT READY** | This document |
| Program Certification | NOT STARTED | **NOT STARTED** | This document |

**Governance Verdict:** The Wave-03 governance chain is intact and the Wave-04 Authorization is valid. No governance gate was skipped. Engineering Kickoff is complete; Implementation Readiness Review is blocked by working-tree hygiene observations that must be resolved before a frozen execution contract can be established.

------------------------------------------------------------------------

# 3. Documents Reviewed

All mandatory documents were read in full before this Engineering Kickoff was produced. No document or section was skipped.

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
| 21A | `21A_ADMIN_DASHBOARD_WAVE-01_DEPLOYMENT_SYNCHRONIZATION_REPORT.md` | Wave-01 deployment synchronization |
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
| 28B | `28B_ADMIN_DASHBOARD_GOVERNANCE_ALIGNMENT_REPORT.md` | Governance alignment |
| 29 | `29_ADMIN_DASHBOARD_WAVE-02_CLOSEOUT_REPORT.md` | Wave-02 closeout and transition readiness |
| 30 | `30_ADMIN_DASHBOARD_PROGRAM_STATUS_REVIEW.md` | Program health and Wave-03 readiness |
| 31 | `31_ADMIN_DASHBOARD_WAVE-03_AUTHORIZATION.md` | Wave-03 authorized scope and package boundaries |
| 32 | `32_ADMIN_DASHBOARD_WAVE-03_ENGINEERING_KICKOFF.md` | Wave-03 engineering constraints and package definitions |
| 33 | `33_ADMIN_DASHBOARD_WAVE-03_IMPLEMENTATION_READINESS_REVIEW.md` | Wave-03 frozen execution contract |
| 34 | `34_ADMIN_DASHBOARD_WAVE-03_PACKAGE-01_POST_IMPLEMENTATION_REVIEW.md` | Package-01 implementation evidence |
| 35 | `35_ADMIN_DASHBOARD_WAVE-03_PACKAGE-01_VERIFICATION_REPORT.md` | Package-01 independent verification |
| 36 | `36_ADMIN_DASHBOARD_WAVE-03_PACKAGE-01_ACCEPTANCE_REVIEW.md` | Package-01 acceptance determination |
| 37 | `37_ADMIN_DASHBOARD_WAVE-03_PACKAGE-02_IMPLEMENTATION_READINESS_REVIEW.md` | Package-02 frozen execution contract |
| 38 | `38_ADMIN_DASHBOARD_WAVE-03_PACKAGE-02_POST_IMPLEMENTATION_REVIEW.md` | Package-02 implementation evidence |
| 39 | `39_ADMIN_DASHBOARD_WAVE-03_PACKAGE-02_VERIFICATION_REPORT.md` | Package-02 independent verification; residual direct `.from()` queries |
| 40 | `40_ADMIN_DASHBOARD_WAVE-03_PACKAGE-02_ACCEPTANCE_REVIEW.md` | Package-02 acceptance determination |
| 41 | `41_ADMIN_DASHBOARD_WAVE-03_PACKAGE-03_IMPLEMENTATION_READINESS_REVIEW.md` | Package-03 frozen execution contract |
| 42 | `42_ADMIN_DASHBOARD_WAVE-03_PACKAGE-03_POST_IMPLEMENTATION_REVIEW.md` | Package-03 implementation evidence |
| 43 | `43_ADMIN_DASHBOARD_WAVE-03_PACKAGE-03_VERIFICATION_REPORT.md` | Package-03 independent verification |
| 44 | `44_ADMIN_DASHBOARD_WAVE-03_PACKAGE-03_ACCEPTANCE_REVIEW.md` | Package-03 acceptance determination |
| 45 | `45_ADMIN_DASHBOARD_WAVE-03_ACCEPTANCE_REVIEW.md` | Independent Wave-03 acceptance |
| 46 | `46_ADMIN_DASHBOARD_WAVE-03_CLOSEOUT.md` | Wave-03 closeout and transition readiness |
| 46r | `WAVE03_CLOSEOUT_READINESS_REVIEW.md` | Pre-closeout readiness state |
| 47 | `47_ADMIN_DASHBOARD_WAVE-04_AUTHORIZATION.md` | Wave-04 authorized scope and observations |
| RG | `REPOSITORY_GOVERNANCE_REALIGNMENT_REPORT.md` | Repository governance realignment evidence |
| RH | `REPOSITORY_HYGIENE_DECISION_REGISTER.md` | Repository hygiene decisions |
| IC | `ISSUES_BEFORE_CLOSEOUT.md` | Pre-closeout issue disposition |

**Document Review Verdict:** The complete governance chain has been reconstructed. Every referenced document exists, is legible, and is traceable to `AD-Baseline-1.0` or to a Program Owner decision.

------------------------------------------------------------------------

# 4. Repository Review

## 4.1 Git Verification

| Verification Check | Method | Result |
|---|---|---|
| HEAD commit | `git rev-parse HEAD` | `53be3e880911b6d52d6d7f921037769cc71b24ac` — `docs(00): Wave-03 governance knowledge preservation and charter evolution` |
| Current branch | `git branch --show-current` | `master` |
| Sealed baseline commit reachable | `git rev-parse 3a06a6d9` | `3a06a6d9` present and reachable |
| Source-code modifications since HEAD | `git diff --stat HEAD -- src/ pages/ components/ services/ lib/ hooks/ supabase/migrations/ supabase/schema.sql supabase/functions/` | **0 lines** — no source drift |
| npm run lint (tsc --noEmit) | `npm run lint` | **PASS** — exit code 0 |

## 4.2 Working-Tree Summary

| Item | Count | Classification |
|---|---|---|
| Tracked modifications | 4 | `.codebase-memory/artifact.json`, `.codebase-memory/graph.db.zst` (tooling), `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md`, `ISSUES_BEFORE_CLOSEOUT.md` (governance status) |
| Staged renames | 3 | `ARCHIVE_LINT_CLEANUP_EXECUTION_REPORT.md`, `PERMISSIONS_WRAPPER_CLEANUP_EXECUTION_REPORT.md`, `REPOSITORY_HYGIENE_DECISION_REGISTER.md` relocated into `ADMIN_DASHBOARD_PLAN\` |
| Untracked files / directories | 76 | Governance deliverables, cleanup/verification reports, `PDP-*`, `PRODUCTION_*`, `PROJECT_MASTER_INDEX*`, `memory-zone/` scratch artifacts |
| Source-code drift | 0 | — |

**Repository Verdict:** No application source-code drift is present. The working-tree changes are intentional governance, tooling, and scratch artifacts that must be dispositioned as part of Wave-04 housekeeping before the Implementation Readiness Review can begin.

------------------------------------------------------------------------

# 5. Codebase MCP Review

The Codebase Memory MCP was refreshed to verify the repository graph and the absence of removed dead artifacts.

| Verification Check | Method | Result |
|---|---|---|
| Project name | `codebase-memory.query_graph` | `vietsalepro` |
| Indexed nodes | `MATCH (n) RETURN count(n)` | **25,609** |
| Indexed edges | `MATCH ()-[r]->() RETURN count(r)` | **37,394** |
| `services/admin/permissions.ts` source search | `codebase-memory.search_graph(name_pattern=services/admin/permissions)` | 0 source Module nodes; only governance baseline sections found |
| `supabase/functions/deliver-webhook` source search | `codebase-memory.search_graph(name_pattern=supabase/functions/deliver-webhook)` | 0 source Module nodes; only governance sections found |
| `supabase/functions/admin-health-check` source search | `codebase-memory.search_graph(name_pattern=supabase/functions/admin-health-check)` | Source Module node present at `supabase/functions/admin-health-check/index.ts` |
| Graph labels | `codebase-memory.query_graph` | `Function`, `Route`, `Variable`, `File`, `Folder`, `Module`, `Section` |

**Codebase Memory Verdict:** The graph is healthy and synchronized to `HEAD`. The removed dead artifacts (`services/admin/permissions.ts`, `supabase/functions/deliver-webhook/`) are no longer represented as source modules. The retained production infrastructure artifact (`supabase/functions/admin-health-check/`) is traceable. No hidden source dependencies for the removed artifacts remain.

------------------------------------------------------------------------

# 6. Skills Execution Report

The mandatory enterprise Skills listed in the Wave-04 Engineering Kickoff brief (`system-design`, `dependency-analysis`, `risk-analysis`, `quality-assurance`, `technical-documentation`, `configuration-management`, `code-review`, `release-management`) were not discoverable in the repository skill registry.

| Skill | Status | Reason | Evidence |
|---|---|---|---|
| `system-design` | **NOT EXECUTED** | Skill not installed or discoverable | `skill list` returned no repository skills; no `.devin/skills/`, `.windsurf/skills/`, or `.agents/skills/` directories contain the named enterprise Skill |
| `dependency-analysis` | **NOT EXECUTED** | Skill not installed or discoverable | Same as above |
| `risk-analysis` | **NOT EXECUTED** | Skill not installed or discoverable | Same as above |
| `quality-assurance` | **NOT EXECUTED** | Skill not installed or discoverable | Same as above |
| `technical-documentation` | **NOT EXECUTED** | Skill not installed or discoverable | Same as above |
| `configuration-management` | **NOT EXECUTED** | Skill not installed or discoverable | Same as above |
| `code-review` | **NOT EXECUTED** | Skill not installed or discoverable | Same as above |
| `release-management` | **NOT EXECUTED** | Skill not installed or discoverable | Same as above |
| `requesting-code-review` | **NOT REQUIRED** | No other Skill recommended an independent review | No other Skill produced a recommendation for independent review |
| `dead-code-analysis` | **NOT REQUIRED** | Performed as repository review only; dead artifacts already removed or classified | `ISSUES_BEFORE_CLOSEOUT.md` and `REPOSITORY_HYGIENE_DECISION_REGISTER.md` document the final classifications |
| `performance-analysis` | **NOT REQUIRED** | No performance dependency identified that affects package sequencing | `PERF-001` and `PERF-002` were resolved in Wave-03 Package-03 |

**Skill Verdict:** The named enterprise Skills are not available in the execution environment. The Engineering Kickoff was produced through direct governance-document review, Codebase MCP evidence, and repository inspection. No Skill was replaced with an unqualified manual assessment; the absence is recorded with evidence.

------------------------------------------------------------------------

# 7. Engineering Architecture Review

Wave-04 does not introduce new architectural domains. It hardens the final residual surfaces and finalizes the repository baseline.

## 7.1 Architecture Baseline

The approved SSOT architecture remains in force:

- `01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md`
- `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md`
- `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md`

## 7.2 Wave-04 Architecture Changes

| Surface | Current State | Wave-04 Target | Traceability |
|---|---|---|---|
| `services/tenantService.ts:getTenantSubscription` | Direct `.from('tenant_subscriptions')` read | Consume canonical read RPC | `39` R-03; `12` Service Layer portfolio |
| `services/admin/tenantAdminService.ts:getUserAccounts` | Direct `.from('tenant_memberships')` read for arbitrary `userId` | Consume canonical read RPC | `39` R-03; `12` Service Layer portfolio |
| `supabase/config.toml` | `check-subdomain` `verify_jwt` not explicit | Verify and document platform default | `39` OBS-04; `45` OBS-03 |
| Working-tree artifacts | 76 untracked + 4 modified tracked files | Dispositioned and committed or ignored | `46` OBS-46-01 through OBS-46-06 |

## 7.3 Architectural Boundaries

- **Protected trust-boundary artifacts:** `App.tsx`, `contexts/AuthContext.tsx`, `lib/permissions.ts`, `supabase/functions/audit-log/index.ts`, and the Wave-01/Wave-02 security fixes may not be modified without a new Wave Authorization.
- **Governance boundary:** All new Wave-04 governance artifacts must be stored in `ADMIN_DASHBOARD_PLAN\`.
- **Service-layer boundary:** Any new canonical read RPC must be introduced through `supabase/migrations/` and reflected in `services/` wrappers, not directly in UI or context code.

**Architecture Verdict:** Wave-04 is bounded, low-risk residual hardening. No SSOT amendment is required.

------------------------------------------------------------------------

# 8. Dependency Analysis

## 8.1 Repository Dependencies

| Consumer | Provider | Relationship | Wave-04 Impact |
|---|---|---|---|
| Wave-04 Engineering Kickoff | `47_ADMIN_DASHBOARD_WAVE-04_AUTHORIZATION.md` | Authorized by | Complete |
| Wave-04 Implementation | Clean working tree | Must be committed/dispositioned before source changes | Blocking |
| Canonical RPC implementation | `supabase/migrations/` and `supabase/schema.sql` | New RPC definitions live in migrations; `schema.sql` must not be hand-edited | Gated |
| Service-layer refactor | New canonical RPCs | Service cannot call RPC before it exists | Sequence dependency |
| Codebase Memory re-index | Committed source changes | Re-index must follow final commit | Post-implementation |
| `check-subdomain` `verify_jwt` verification | `supabase/config.toml` and platform documentation | Confirm default or set explicit value | Independent |

## 8.2 Critical Dependency List

1. **Working-tree disposition** is the absolute prerequisite for any source-code change.
2. **Canonical read RPCs** must be created before the service-layer `.from()` calls can be removed.
3. **`supabase/schema.sql` integrity** must be preserved; all schema changes flow through migrations.

## 8.3 Execution Order

1. Disposition working tree (commit/ignore/relocate artifacts).
2. Verify `check-subdomain` `verify_jwt` default and document.
3. Create canonical read RPCs for `getTenantSubscription` and `getUserAccounts`.
4. Refactor service-layer calls to consume the new RPCs.
5. Re-run `npm run lint`.
6. Re-index Codebase Memory.
7. Produce Wave-04 Verification Report and Acceptance Review.

------------------------------------------------------------------------

# 9. Engineering Constraints

1. **Scope constraint:** Wave-04 may only address the residual observations from Wave-03 closeout and the two direct `.from()` reads. No new `AD-Baseline-1.0` issues may be added without a Program Owner decision.
2. **Source-code constraint:** Only the two residual service-layer reads and the `supabase/config.toml` `verify_jwt` setting may be modified.
3. **No schema hand-edits:** `supabase/schema.sql` may not be edited directly. All schema/RPC changes must be delivered through migrations.
4. **No production deployment:** Production synchronization remains governed by the Production Deployment Program; Wave-04 is repository-only.
5. **Traceability constraint:** Every change must reference an observation ID or a Program Owner decision.
6. **Tooling constraint:** Codebase Memory must be re-indexed after source changes and after the working tree is clean.

------------------------------------------------------------------------

# 10. Repository Constraints

1. **Branch lock:** All work remains on `master` but must be committed before implementation begins.
2. **Working-tree cleanliness:** The Implementation Readiness Review cannot be held while 76 untracked files and 4 modified tracked files remain.
3. **Governance location:** New governance documents may only be created in `ADMIN_DASHBOARD_PLAN\`.
4. **Scratch artifact rule:** `memory-zone/` scratch logs must be archived or added to `.gitignore`.
5. **Baseline preservation:** The sealed `AD-Baseline-1.0` commit `3a06a6d9` must remain reachable and unmodified.

------------------------------------------------------------------------

# 11. Engineering Configuration Report

| Configuration Item | Current Value | Required for Wave-04 | Verdict |
|---|---|---|---|
| Branch | `master` | `master` | Pass |
| HEAD | `53be3e88` | `53be3e88` at start of Wave-04 | Pass |
| Sealed baseline | `3a06a6d9` | Reachable | Pass |
| Source-code drift | 0 lines | 0 lines at start | Pass |
| TypeScript lint | PASS | PASS before IRR | Pass |
| Codebase Memory | 25,609 nodes / 37,394 edges | Healthy and synchronized | Pass |
| `.codebase-memory/` | Modified tracked files | Commit or reset before IRR | Blocker |
| `memory-zone/` | 24 untracked `.txt` files | Archive or `.gitignore` | Observation |
| Root-level governance artifacts | `PDP-*`, `PRODUCTION_*`, `PROJECT_MASTER_INDEX*` | Relocate or `.gitignore` | Observation |

**Configuration Verdict:** The repository configuration is correct for the governance baseline. Working-tree hygiene must be resolved before the Implementation Readiness Review.

------------------------------------------------------------------------

# 12. Engineering Risk Register

| ID | Risk | Classification | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Working-tree disposition not completed before implementation | **Major** | Blocks IRR and introduces uncontrolled drift | Make disposition the first implementation task; gate IRR on `git status` cleanliness |
| R-02 | New canonical RPCs are not compatible with existing RLS or service_role contexts | **Major** | Could break service-layer reads | Verify RPCs in a local/Staging environment before acceptance; follow SSOT permission model |
| R-03 | `check-subdomain` `verify_jwt` implicit behavior differs from documentation | **Medium** | Public endpoint may enforce JWT unexpectedly | Test the Edge Function with and without a token; set explicit `verify_jwt = false` if needed |
| R-04 | Scope creep from root-level artifacts review | **Medium** | Wave expands to parallel programs | Treat root-level `PDP-*`, `PRODUCTION_*` as out-of-scope unless Program Owner authorizes |
| R-05 | Codebase Memory re-index introduces graph drift | **Minor** | False positives/negatives in verification | Re-index only after final commit; compare node/edge counts to baseline |
| R-06 | Dead artifact deletion reintroduces build/lint errors | **Minor** | Removed files may still be referenced in tests or mocks | Search `ts`, `tsx`, `js`, `jsx`, `json`, `sql`, `toml` for references before deletion |

**Risk Verdict:** No Critical risk was identified. The Major risks are manageable through sequencing and gating.

------------------------------------------------------------------------

# 13. Engineering Quality Gates

| Gate | Entry Criteria | Verification Method | Owner |
|---|---|---|---|
| QG-01 | Working tree clean (no uncommitted source or governance changes) | `git status --short` | PMO |
| QG-02 | `npm run lint` (`tsc --noEmit`) passes | `npm run lint` | Principal Architect |
| QG-03 | New canonical RPCs present and service-layer `.from()` calls removed | `grep` and Codebase MCP `search_graph` | Principal Architect |
| QG-04 | `check-subdomain` `verify_jwt` behavior verified and documented | Edge Function test + config audit | PMO |
| QG-05 | Codebase Memory re-indexed and healthy | `codebase-memory.query_graph` node/edge counts | PMO |
| QG-06 | All changes traceable to an observation or Program Owner decision | Traceability matrix in implementation report | PMO |
| QG-07 | No `supabase/schema.sql` direct edits | `git diff --stat HEAD -- supabase/schema.sql` | Principal Architect |
| QG-08 | Governance artifacts stored only in `ADMIN_DASHBOARD_PLAN\` | `git status --short` path check | PMO |

------------------------------------------------------------------------

# 14. Engineering Documentation Assessment

| Document | Status | Required Update Before Implementation |
|---|---|---|
| `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` | Updated in this task | Section 10 status updated to Wave-04 Engineering Kickoff COMPLETE WITH OBSERVATIONS |
| `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` | Updated in this task | Section 13 program status updated |
| `48_ADMIN_DASHBOARD_WAVE-04_ENGINEERING_KICKOFF.md` | Created in this task | n/a |
| `49_ADMIN_DASHBOARD_WAVE-04_IMPLEMENTATION_READINESS_REVIEW.md` | Not yet created | Must be produced after working-tree disposition |
| `50_ADMIN_DASHBOARD_WAVE-04_IMPLEMENTATION.md` | Not yet created | Must be produced after IRR |
| `50A/B/C` package documents | Not yet created | Optional if single package; required if multiple packages |
| `51_ADMIN_DASHBOARD_WAVE-04_VERIFICATION_REPORT.md` | Not yet created | Produced after implementation |
| `52_ADMIN_DASHBOARD_WAVE-04_ACCEPTANCE_REVIEW.md` | Not yet created | Produced after verification |
| `53_ADMIN_DASHBOARD_WAVE-04_CLOSEOUT_REPORT.md` | Not yet created | Produced after acceptance |

**Documentation Verdict:** The Wave-04 Engineering Kickoff deliverable is complete. Downstream documents are pending the next governance gates.

------------------------------------------------------------------------

# 15. Implementation Package Planning

Wave-04 is small in scope and tightly coupled. A **single implementation package** is sufficient.

## 15.1 Single Package: Wave-04 Residual Hardening & Repository Finalization

| Attribute | Definition |
|---|---|
| **Objectives** | Resolve Wave-03 closeout observations, replace residual direct `.from()` service-layer reads with canonical RPCs, verify `check-subdomain` `verify_jwt` default, re-index Codebase Memory, and prepare for Program Certification. |
| **Scope** | Working-tree disposition; `getTenantSubscription` and `getUserAccounts` RPC refactor; `supabase/config.toml` `verify_jwt` documentation; Codebase Memory re-index; governance status updates. |
| **Dependencies** | Wave-03 closeout complete; `AD-Baseline-1.0` consumed; Program Owner decisions 1–4 recorded. |
| **Success Criteria** | `git status` clean; `npm run lint` pass; service-layer `.from()` reads eliminated; `verify_jwt` default documented; Codebase Memory re-indexed; no `supabase/schema.sql` direct edits. |
| **Exit Criteria** | All quality gates in Section 13 satisfied; `49_ADMIN_DASHBOARD_WAVE-04_IMPLEMENTATION_READINESS_REVIEW.md` can be produced. |
| **Execution Order** | 1. Working-tree disposition; 2. `verify_jwt` verification; 3. Canonical RPC creation and service refactor; 4. Re-index and lint; 5. IRR. |

## 15.2 Multiple Packages Considered and Rejected

Splitting the work into separate repository-hygiene and RPC-refactor packages was considered. The two activities are sequential but small, and the service-layer refactor cannot begin until the working tree is clean. A single package avoids unnecessary ceremony while preserving the dependency order.

------------------------------------------------------------------------

# 16. Execution Sequence

| Step | Activity | Deliverable | Gate |
|---|---|---|---|
| 1 | Disposition working tree | Clean `git status` | QG-01 |
| 2 | Verify `check-subdomain` `verify_jwt` default | Configuration note / config change | QG-04 |
| 3 | Create `getTenantSubscription` and `getUserAccounts` read RPCs | Migration file | QG-03 |
| 4 | Refactor service calls to consume RPCs | Updated `services/tenantService.ts` and `services/admin/tenantAdminService.ts` | QG-03 |
| 5 | Run `npm run lint` | Lint pass | QG-02 |
| 6 | Re-index Codebase Memory | Updated `.codebase-memory/` artifacts | QG-05 |
| 7 | Produce `49_ADMIN_DASHBOARD_WAVE-04_IMPLEMENTATION_READINESS_REVIEW.md` | Frozen execution contract | — |
| 8 | Implement, verify, accept, close | `50`, `51`, `52`, `53` | — |

------------------------------------------------------------------------

# 17. Verification Strategy

Wave-04 verification will be performed by an independent technical reviewer after implementation.

1. **Static verification:** `git diff --stat HEAD` must show only authorized files; `npm run lint` must pass.
2. **RPC verification:** Confirm the new RPCs exist in `information_schema.routines` with correct `SECURITY` context and that service-layer calls no longer use `.from()` for the target tables.
3. **Configuration verification:** Confirm `check-subdomain` behavior matches the documented access model.
4. **Graph verification:** Re-index Codebase Memory and confirm removed artifacts remain absent and new RPC/service paths are traceable.
5. **Traceability verification:** Confirm every code change maps to an observation ID or Program Owner decision.

------------------------------------------------------------------------

# 18. Acceptance Strategy

Wave-04 acceptance will follow the same independent review board process used in Wave-03.

- **Acceptance entry:** Implementation complete, verification report produced, repository clean.
- **Acceptance criteria:** All success criteria in Section 15.1 met; all observations resolved or explicitly accepted.
- **Acceptance board:** Independent Technical Review Board + Program Owner acknowledgment.
- **Outcome:** `52_ADMIN_DASHBOARD_WAVE-04_ACCEPTANCE_REVIEW.md` documenting PASS, PASS WITH OBSERVATIONS, or FAIL.

------------------------------------------------------------------------

# 19. Rollback Strategy

1. **Source-code rollback:** Any source change that fails verification will be reverted through `git revert` on a feature commit, not `git reset --hard`.
2. **RPC rollback:** New RPCs must be defined in reversible migrations; a `down` migration or compensating migration must be prepared if the RPC is removed.
3. **Configuration rollback:** `supabase/config.toml` changes are tracked in git and can be reverted by restoring the previous commit.
4. **Codebase Memory rollback:** The previous `.codebase-memory/` artifact is committed before re-index; it can be restored if the new index is corrupt.
5. **Governance rollback:** This document and any status updates can be reverted through git; no production state is affected by Wave-04.

------------------------------------------------------------------------

# 20. Implementation Protection Rules

1. **No implementation before IRR:** Source-code changes are not authorized until `49_ADMIN_DASHBOARD_WAVE-04_IMPLEMENTATION_READINESS_REVIEW.md` is produced.
2. **Frozen file list:** Only `services/tenantService.ts`, `services/admin/tenantAdminService.ts`, `supabase/migrations/`, and `supabase/config.toml` may be modified for implementation. Any additional file requires a Program Owner decision.
3. **No direct schema edits:** `supabase/schema.sql` is read-only for this wave.
4. **No production deployment:** Production remains untouched; deployment is governed by the Production Deployment Program.
5. **No SSOT contradiction:** Any discovered inconsistency with the approved SSOT must be escalated to the Program Owner and Principal Architect; it may not be silently patched.
6. **No new dependencies without approval:** No new npm, Supabase, or external dependencies may be introduced without explicit Program Owner approval.

------------------------------------------------------------------------

# 21. Implementation Readiness Criteria

The following conditions must be satisfied before the Wave-04 Implementation Readiness Review can begin:

| # | Criterion | Evidence Required |
|---|---|---|
| 1 | Wave-03 formally closed | `46_ADMIN_DASHBOARD_WAVE-03_CLOSEOUT.md` |
| 2 | Wave-04 Authorization valid | `47_ADMIN_DASHBOARD_WAVE-04_AUTHORIZATION.md` |
| 3 | Engineering Kickoff document produced | `48_ADMIN_DASHBOARD_WAVE-04_ENGINEERING_KICKOFF.md` (this document) |
| 4 | Working tree clean | `git status --short` showing no uncommitted application source or governance artifacts |
| 5 | Staged/committed Wave-03 governance package | `git log --oneline` and `git status` showing relocated reports and `.codebase-memory/` artifacts committed |
| 6 | `npm run lint` passes | `npm run lint` exit code 0 |
| 7 | Root-level scratch artifacts dispositioned | `PDP-*`, `PRODUCTION_*`, `PROJECT_MASTER_INDEX*`, `memory-zone/` archived or ignored |
| 8 | Frozen execution contract draft ready | File list and change boundaries for `services/tenantService.ts`, `services/admin/tenantAdminService.ts`, `supabase/migrations/`, `supabase/config.toml` |

------------------------------------------------------------------------

# 22. Roadmap Consistency Review

The Program Charter (`00`) and Remediation Master Plan (`12`) status sections have been reviewed and updated by this Engineering Kickoff.

| Source | Before | After |
|---|---|---|
| `00` Section 10 | `Wave-04 Engineering Kickoff: READY TO START` | `Wave-04 Engineering Kickoff: COMPLETE WITH OBSERVATIONS` |
| `00` Section 10 | `Wave-04 Implementation Readiness Review: NOT STARTED` | `Wave-04 Implementation Readiness Review: NOT READY` |
| `12` Section 12/13 | `Wave-04 Engineering Kickoff: READY TO START (document)` | `Wave-04 Engineering Kickoff: COMPLETE WITH OBSERVATIONS (document)` |
| `12` Section 12/13 | `Wave-04 Implementation: NOT STARTED` | `Wave-04 Implementation Readiness Review: NOT READY` |

No conflicting milestone status remains. The Phase B lifecycle, baseline sealing, and `AD-Baseline-1.0` consumption are unchanged.

------------------------------------------------------------------------

# 23. Observations and Engineering Decision

## 23.1 Observations Carried Forward

| ID | Classification | Observation | Evidence | Impact | Recommendation | Blocking |
|---|---|---|---|---|---|---|
| OBS-48-01 | **Major** | Root-level governance/scratch artifacts (`PDP-*`, `PRODUCTION_*`, `PROJECT_MASTER_INDEX*`, `BUSINESS_ACCEPTANCE_RECORD.md`) are not stored under `ADMIN_DASHBOARD_PLAN\` | `git status --short` | Repository organization; may conflate Admin Dashboard with parallel programs | Relocate to `ADMIN_DASHBOARD_PLAN\` or archive/`.gitignore` | Yes (blocks IRR) |
| OBS-48-02 | **Major** | Working tree not clean; relocated Wave-03 governance documents and `.codebase-memory/` artifacts are not fully committed | `git status --short` | Governance traceability and reproducibility | Stage and commit as single disposition commit | Yes (blocks IRR) |
| OBS-48-03 | **Medium** | `getTenantSubscription` and `getUserAccounts` still use direct `.from()` queries | `39` R-03; `services/tenantService.ts:455-460`; `services/admin/tenantAdminService.ts:84-87` | Service-layer inconsistency; no immediate security impact | Introduce canonical read RPCs during Wave-04 implementation | No |
| OBS-48-04 | **Medium** | `supabase/config.toml` does not explicitly set `verify_jwt = false` for `check-subdomain` | `39` OBS-04; `45` OBS-03 | Configuration documentation gap | Test default and add explicit entry if needed | No |
| OBS-48-05 | **Minor** | `memory-zone/` contains 24 scratch `.txt` logs | `git status --short` | Scratch artifacts; not application source | Archive or add to `.gitignore` after retention period | No |
| OBS-48-06 | **Minor** | `.codebase-memory/` files are modified tracked files from MCP re-index | `git diff --stat` | Non-functional tooling state | Commit or reset as part of disposition commit | No |
| OBS-48-07 | **Medium** | Scope creep risk if new findings from clean working tree are added to Wave-04 | Governance analysis | Wave expands beyond residual hardening | Record new findings and defer or seek Program Owner approval | No |

## 23.2 Engineering Decision

```text
ENGINEERING KICKOFF COMPLETE WITH OBSERVATIONS
```

**Justification:**

- All Wave-03 governance gates are complete and the Wave-04 Authorization is valid.
- The engineering execution model is defined and bounded.
- No Critical risks were identified.
- The Major observations are working-tree hygiene items that must be resolved before the Implementation Readiness Review can be held. They do not invalidate the Engineering Kickoff itself.
- Implementation is not authorized by this document.

------------------------------------------------------------------------

# 24. Next Governance Gate

**Wave-04 Implementation Readiness Review:**

```text
NOT READY
```

**Blocking Issues:**

1. OBS-48-01: Root-level governance/scratch artifacts must be relocated, archived, or ignored.
2. OBS-48-02: Working tree must be clean; Wave-03 governance package and `.codebase-memory/` artifacts must be committed.

**Once blockers are resolved:** The repository will be ready to proceed to `49_ADMIN_DASHBOARD_WAVE-04_IMPLEMENTATION_READINESS_REVIEW.md`.

------------------------------------------------------------------------

# 25. Recommendations

1. **Immediate:** Stage and commit the working-tree disposition as a single governance commit before any source-code work begins.
2. **Repository hygiene:** Add `memory-zone/` to `.gitignore` after confirming retention requirements, or archive the logs to a separate storage location.
3. **Root-level artifacts:** Relocate `PDP-*`, `PRODUCTION_*`, `PROJECT_MASTER_INDEX*`, and `BUSINESS_ACCEPTANCE_RECORD.md` into `ADMIN_DASHBOARD_PLAN\` if they are Admin Dashboard program artifacts; otherwise mark them as out-of-scope for this program.
4. **RPC design:** When creating the canonical read RPCs for `getTenantSubscription` and `getUserAccounts`, preserve existing RLS and service_role semantics; do not broaden or narrow permissions.
5. **Configuration:** Test the `check-subdomain` Edge Function without a JWT to confirm the implicit `verify_jwt = false` behavior; if the platform default is ambiguous, set it explicitly in `supabase/config.toml`.
6. **Verification:** After implementation, re-index Codebase Memory and confirm that the new RPC/service paths are traceable and that the removed `.from()` call sites are gone.
7. **Governance discipline:** Do not begin `49_ADMIN_DASHBOARD_WAVE-04_IMPLEMENTATION_READINESS_REVIEW.md` until the working tree is clean and the blockers in Section 24 are resolved.

------------------------------------------------------------------------

*End of Wave-04 Engineering Kickoff.*
