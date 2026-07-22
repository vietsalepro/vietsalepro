# 24_ADMIN_DASHBOARD_WAVE-02_ENGINEERING_KICKOFF

**Document ID:** 24_ADMIN_DASHBOARD_WAVE-02_ENGINEERING_KICKOFF  
**Date:** 2026-07-20  
**Project:** VietSalePro  
**Sub Project:** Admin Dashboard  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** B — System Remediation  
**Wave:** Wave-02  
**Acting Capacity:** Enterprise PMO together with the Principal Software Architect  
**Baseline:** AD-Baseline-1.0  
**Repository Scope:** `C:\PROJECT\vietsalepro` @ commit `2f92be33` (post Wave-01 Closeout)  
**Status:** Engineering Kickoff Complete — Implementation Readiness Review Ready to Start

------------------------------------------------------------------------

# 1. Executive Summary

This document is the formal **Engineering Kickoff** for **Wave-02** of the Admin Dashboard System Remediation Program. It is a governance and engineering planning activity only. It does **not** authorize implementation, verification, acceptance, or deployment.

Wave-02 is the **Database, RPC, and Migration Consolidation Cluster**. It consumes the sixteen canonical `AD-Baseline-1.0` issues authorized in `23_ADMIN_DASHBOARD_WAVE-02_AUTHORIZATION.md` and is structured into three independently verifiable packages. All mandatory governance documents (`00` through `23`) have been reviewed. The sealed baseline `AD-Baseline-1.0` remains valid, Wave-01 is closed, and the Wave-01 implementation is intact at `HEAD`.

**Engineering Kickoff Decision:**

- **Wave-02 Engineering Kickoff:** **COMPLETE** (this document).
- **Wave-02 Implementation Readiness Review:** **READY TO START**.
- **Wave-02 Implementation:** **NOT STARTED** and not authorized by this document.
- **Overall Program Status:** **ACTIVE** — READY FOR WAVE-02 IMPLEMENTATION READINESS REVIEW.

------------------------------------------------------------------------

# 2. Repository Validation

## 2.1 Git Verification

| Check | Method | Result |
|---|---|---|
| HEAD commit | `git rev-parse HEAD` | `2f92be33849699691a333fdb1a3f488e05763a1e` |
| Wave-01 implementation integrity | `git diff --stat 3a06a6d9 -- App.tsx contexts/AuthContext.tsx services/admin/memberAdminService.ts lib/permissions.ts supabase/functions/audit-log/index.ts` | **31 insertions, 9 deletions across 4 files** — only `App.tsx`, `contexts/AuthContext.tsx`, `services/admin/memberAdminService.ts`, and `supabase/functions/audit-log/index.ts` changed; `lib/permissions.ts` unchanged |
| Working-tree modifications | `git status --short` | `.codebase-memory/artifact.json`, `.codebase-memory/graph.db.zst`, `ADMIN_DASHBOARD_PLAN/00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` (roadmap), `package-lock.json`/`package.json` (Supabase CLI dependency) |
| Untracked entries | `git status --short` | Governance documentation in `ADMIN_DASHBOARD_PLAN/`, `PROJECT_MASTER_INDEX*`, `PDP-*`, `memory-zone/` scratch artifacts |

**Repository Stability Verdict:** The Admin Dashboard implementation has not materially changed since Wave-01 acceptance. The only uncommitted code-facing change is the addition of the `supabase` CLI dev dependency, which is a tooling artifact. No Wave-02 implementation has started.

## 2.2 MCP Codebase Memory Verification

| Check | Tool | Result |
|---|---|---|
| `isSystemAdmin` enforcement path | `codebase-memory.search_graph` | `lib/permissions.ts:isSystemAdmin` is reachable; `App.tsx` routes through it; no direct `system_admins` query in the gated path |
| `audit-log` Edge Function surface | `codebase-memory.search_graph` | `supabase/functions/audit-log/index.ts` contains the authenticated write guard from `EDG-001` |
| `activate_pending_memberships` flow | `codebase-memory.search_graph` | `AuthContext` call site is routed through `services/admin/memberAdminService.ts` |
| `update_tenant` overload count | `grep` on `supabase/schema.sql` | **7** `CREATE OR REPLACE FUNCTION public.update_tenant(` definitions at lines 17518, 19553, 20812, 28634, 28791, 29220, 30290 |
| `update_tenant_subscription` overload count | `grep` on `supabase/schema.sql` | **3** definitions at lines 17702, 20858, 36429 |
| `create_tenant_with_admin` overload count | `grep` on `supabase/schema.sql` | **3** definitions at lines 15249, 18640, 20748 |
| Missing log RPCs | `grep` on `supabase/schema.sql` | `get_admin_audit_logs`, `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs` are **not present** |
| Audit triggers on privileged tables | `grep` on `supabase/schema.sql` | No triggers for `system_admins`, `invitations`, or `licenses` |
| `SECURITY INVOKER` occurrences | `grep` on `supabase/schema.sql` | **145** occurrences — a remediation surface for `RPC-002` |

**MCP Verdict:** The Codebase Memory graph is consistent with the accepted Wave-01 repository state. The Wave-02 evidence (duplicate RPCs, missing log RPCs, missing audit triggers, migration drift) is independently verifiable from the repository at `HEAD`.

------------------------------------------------------------------------

# 3. Governance Verification

| Gate | Expected Status | Current Status | Evidence |
|---|---|---|---|
| Phase A | CLOSED | **CLOSED** | `10B_ADMIN_DASHBOARD_PHASE_A_CLOSEOUT.md` Section 1 |
| Baseline | SEALED | **SEALED** (`AD-Baseline-1.0`) | `10B` Section 11 |
| Phase B | OPEN | **OPEN** | `11` Section 1 |
| Remediation Master Plan | COMPLETE | **COMPLETE** | `12` Section 14 |
| Program Owner Decisions | COMPLETE | **COMPLETE** | `13` Section 12 |
| Wave Planning | COMPLETE | **COMPLETE** | `13` Section 8; `14` Section 6.4 |
| Wave-01 Authorization | COMPLETE | **COMPLETE** | `14` Section 1 |
| Wave-01 Engineering Kickoff | COMPLETE | **COMPLETE** | `15` Section 1 |
| Wave-01 Implementation Readiness Review | COMPLETE | **COMPLETE** | `16` Section 1 |
| Wave-01 Implementation | COMPLETE | **COMPLETE** | `17`, `18`, `19` |
| Wave-01 Verification | COMPLETE | **PASS WITH OBSERVATIONS** | `20` Section 1 |
| Wave-01 Acceptance | COMPLETE | **ACCEPTED** | `21` Section 1 |
| Wave-01 Deployment Synchronization | COMPLETE | **SYNCHRONIZED WITH OBSERVATIONS** | `21A` Section 1 |
| Wave-01 Closeout | COMPLETE | **CLOSED WITH OBSERVATIONS** | `22` Section 12 |
| Wave-02 Authorization | COMPLETE | **COMPLETE** | `23` Section 1 |
| Wave-02 Engineering Kickoff | READY | **COMPLETE** (this document) | — |
| Wave-02 Implementation Readiness Review | NOT STARTED | **READY TO START** | This document |
| Wave-02 Implementation | NOT STARTED | **NOT STARTED** | This document |
| Program Status | ACTIVE | **ACTIVE** | `00` Section 10 |

**Governance Verdict:** Every prerequisite for the Wave-02 Engineering Kickoff is satisfied. Implementation is not authorized and has not started.

------------------------------------------------------------------------

# 4. Mandatory Documents Reviewed

All mandatory documents were read in full before this Engineering Kickoff was prepared. No document or section was skipped.

| # | Document | Role in Engineering Kickoff |
|---|---|---|
| 00 | `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` | Program charter, lifecycle, governance transition rules |
| 01 | `01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md` | SSOT architecture baseline |
| 02 | `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md` | Dependency and layer direction baseline |
| 03 | `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md` | Runtime execution baseline |
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
| 14 | `14_ADMIN_DASHBOARD_WAVE-01_AUTHORIZATION.md` | Wave-01 scope and deferred Wave-02 cluster |
| 15 | `15_ADMIN_DASHBOARD_WAVE-01_ENGINEERING_KICKOFF.md` | Engineering-kickoff precedent |
| 16 | `16_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_READINESS_REVIEW.md` | Frozen-execution-contract precedent |
| 17 | `17_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION.md` | Package-01 implementation evidence |
| 18 | `18_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_PACKAGE-02.md` | Package-02 implementation evidence |
| 19 | `19_ADMIN_DASHBOARD_WAVE-01_IMPLEMENTATION_PACKAGE-03.md` | Package-03 implementation evidence |
| 20 | `20_ADMIN_DASHBOARD_WAVE-01_VERIFICATION_REPORT.md` | Independent verification methodology |
| 21 | `21_ADMIN_DASHBOARD_WAVE-01_ACCEPTANCE_REVIEW.md` | Acceptance criteria precedent |
| 21A | `21A_ADMIN_DASHBOARD_WAVE-01_DEPLOYMENT_SYNCHRONIZATION_REPORT.md` | Deployment synchronization precedent |
| 22 | `22_ADMIN_DASHBOARD_WAVE-01_CLOSEOUT_REPORT.md` | Wave-01 closeout, transition readiness, and observations |
| 23 | `23_ADMIN_DASHBOARD_WAVE-02_AUTHORIZATION.md` | Wave-02 scope, issues, and frozen execution contract |

------------------------------------------------------------------------

# 5. Agent Skills Applied

| Skill | Purpose | Status |
|---|---|---|
| `codebase-design` | Architecture/interface vocabulary for reasoning about repository seams, service-layer depth, and where the RPC/schema seam belongs | Invoked |
| `systematic-debugging` | Root-cause discipline for clustering the duplicate-RPC, missing-RPC, and migration-drift symptoms into traceable primary causes | Invoked |
| `code-review` | Not required for this governance-only engineering-kickoff activity; no implementation changes exist to review | Not invoked |

------------------------------------------------------------------------

# 6. Engineering Analysis

## 6.1 Authorized Issue Cluster

Wave-02 is authorized for the **Database, RPC, and Migration Consolidation Cluster**: sixteen unique `AD-Baseline-1.0` issues derived from `23` Section 6.3.

| # | Issue ID | Severity | Category | Repository Evidence |
|---|---|---|---|---|
| 1 | `DB-001` | High | Database / RPC Drift | 7 `update_tenant` overloads in `supabase/schema.sql` |
| 2 | `DB-002` | High | Database / RPC Drift | 3 `update_tenant_subscription` overloads in `supabase/schema.sql` |
| 3 | `DB-003` | High | Database / RPC Drift | 3 `create_tenant_with_admin` overloads in `supabase/schema.sql` |
| 4 | `DB-004` | High | Database / Audit Gap | Missing audit triggers on `system_admins`, `invitations`, `licenses` |
| 5 | `DB-005` | Medium | Database / Realtime | `admin_events` table fed only by cron task |
| 6 | `DB-006` | High | Database / RPC | `get_admin_audit_logs` RPC missing |
| 7 | `DB-007` | Medium | Database / RPC | `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs` RPCs missing |
| 8 | `DB-009` | Low | Database / Audit Gap | LOGIN/LOGOUT events not trigger-enforced |
| 9 | `RPC-002` | Medium | RPC / Security | 145 `SECURITY INVOKER` occurrences in privileged RPCs |
| 10 | `RPC-003` | High | RPC Inconsistency | Aggregate missing log RPCs (`DB-006`/`DB-007`) |
| 11 | `RPC-004` | Low | RPC Inconsistency | `search_tenants` / `get_tenants_admin` signature ambiguity |
| 12 | `MIG-001` | High | Migration Inconsistency | 25 migrations with `fix` in filename (21 strict `_fix_` per `10A`) |
| 13 | `MIG-002` | High | Repository Drift | 27 post-SSOT-baseline migrations after `20260713000012_create_audit_log_table.sql` |
| 14 | `MIG-003` | Low | Migration Inconsistency | Non-standard filename `20260710064509_f33_members_search_rpc.sql` |
| 15 | `MIG-004` | Medium | Migration Inconsistency | Missing `20260713000002` sequence entry |
| 16 | `DRIFT-003` | Low | Repository Drift | Custom-domain flow uses Edge Function, not listed RPC |

Folded duplicates (addressed through canonical issues): `RPC-001` and `DRIFT-002` through `DB-001`; `SEC-005` through `DB-004`; `DRIFT-001` through `MIG-002`.

## 6.2 Dependency and Risk Analysis

| Dependency | Direction | Rationale |
|---|---|---|
| `DB-001` / `DB-002` / `DB-003` | Independent within Wave-02; blocks later RPC/service work | Consolidating `update_tenant`, `update_tenant_subscription`, `create_tenant_with_admin` establishes the canonical signatures that `RPC-004` and `DRIFT-002` reference |
| `DB-004` | Required before `DB-006`, `DB-007`, `DB-009` | Audit triggers must exist before log RPCs can return consistent data and before LOGIN/LOGOUT enforcement is meaningful |
| `DB-006` / `DB-007` | Required before `RPC-003` | The aggregate missing-RPC finding is realized only after the underlying database functions are implemented |
| `MIG-001` / `MIG-002` | Depend on `DB-001`–`DB-003` | Migration reconciliation must account for schema objects created or removed by RPC consolidation |
| `MIG-004` | Depends on `MIG-002` | Missing sequence entry is resolved during the post-SSOT migration inventory |
| `RPC-002` | Aligns with consolidated schema | `SECURITY DEFINER` alignment is safest after canonical RPCs are known |
| `DRIFT-003` | Documentation-only in `services/admin/tenantAdminService.ts` | No implementation code change; requires `DB-001`–`DB-003` context to document the correct custom-domain seam |

| Risk | Level | Mitigation |
|---|---|---|
| Removing duplicate RPC overloads may break existing call sites | High | Confine changes to `supabase/schema.sql` and `supabase/migrations/*.sql`; verify `services/admin/*.ts` call sites with `npm run lint` and `npm run build` after each package |
| Migration reconciliation may expose environment drift | High | Inventory all fix and post-SSOT migrations before editing; reconcile against `AD-Baseline-1.0`; dry-run `supabase db push` on Staging |
| `SECURITY DEFINER` changes may affect permissions | Medium | Apply `SECURITY DEFINER` only to privileged RPCs that already contain or receive `is_system_admin()` guards; verify with Staging tests |
| Adding audit triggers may generate unexpected audit volume | Medium | Implement triggers behind `is_system_admin()` or equivalent guard; test on Staging before acceptance |

## 6.3 Implementation Order Rationale

The recommended order is:

1. **Package-01 — Duplicate RPC Consolidation** (`DB-001`, `DB-002`, `DB-003`, `RPC-001`, `RPC-004`, `DRIFT-002`)
2. **Package-02 — Audit Triggers and Missing Log RPCs** (`DB-004`, `DB-006`, `DB-007`, `DB-009`, `RPC-003`, `SEC-005`)
3. **Package-03 — Migration Reconciliation and Security Context** (`MIG-001`, `MIG-002`, `MIG-003`, `MIG-004`, `DRIFT-001`, `DRIFT-003`, `RPC-002`)

`Package-01` must precede `Package-02` because `DB-004` triggers and the missing log RPCs should not be added while the schema still contains overloaded, ambiguous `update_tenant` and `search_tenants` signatures. `Package-03` is last because migration reconciliation must account for the schema objects created or removed by the first two packages.

------------------------------------------------------------------------

# 7. Package Planning

## 7.1 Package-01 — Duplicate RPC Consolidation

| Field | Value |
|---|---|
| **Objectives** | Establish single authoritative versions of `update_tenant`, `update_tenant_subscription`, and `create_tenant_with_admin`; remove or rename dead overloads; resolve `search_tenants` / `get_tenants_admin` signature ambiguity |
| **Included Issues** | `DB-001`, `DB-002`, `DB-003`, `RPC-001` (folded), `RPC-004`, `DRIFT-002` (folded) |
| **Affected Files** | `supabase/schema.sql`; `supabase/migrations/*.sql`; `services/admin/tenantAdminService.ts` **only** if RPC signature alignment is required |
| **Dependencies** | Wave-01 `ARCH-001`/`PERM-001` accepted (single `isSystemAdmin()` path); sealed `AD-Baseline-1.0` |
| **Preconditions** | No Wave-02 implementation started; baseline `3a06a6d9` reachable; `supabase` CLI dev dependency available |
| **Exit Criteria** | `grep 'CREATE OR REPLACE FUNCTION public.update_tenant\b'` returns 1 in `supabase/schema.sql`; same for `update_tenant_subscription` and `create_tenant_with_admin`; search/admin list RPCs are unambiguous |
| **Rollback Boundary** | Revert the `supabase/schema.sql` and `supabase/migrations/*.sql` changes for Package-01; regenerate from baseline `3a06a6d9` if necessary |
| **Verification Boundary** | Schema grep, `npm run lint`, `npm run build`, and `supabase db push --dry-run` or Staging `supabase db push` |
| **Deployment Considerations** | No Production deployment. Staging `supabase db push` after independent verification. Edge Functions are not in scope |
| **Estimated Risk** | **High** due to signature consolidation; mitigated by strict file scope and dry-run validation |

## 7.2 Package-02 — Audit Triggers and Missing Log RPCs

| Field | Value |
|---|---|
| **Objectives** | Add missing audit triggers on `system_admins`, `invitations`, and `licenses`; enforce LOGIN/LOGOUT audit entries; implement `get_admin_audit_logs`, `get_cron_job_logs`, `get_billing_reminder_logs`, and `get_billing_email_logs` |
| **Included Issues** | `DB-004`, `DB-006`, `DB-007`, `DB-009`, `RPC-003`, `SEC-005` (folded) |
| **Affected Files** | `supabase/schema.sql`; `supabase/migrations/*.sql`; `services/admin/auditAdminService.ts` and `services/admin/complianceAdminService.ts` **only** for RPC call-site signature alignment |
| **Dependencies** | `DB-001`–`DB-003` consolidation complete (Package-01); `EDG-001`/`PERM-001` accepted (audit-trust boundary) |
| **Preconditions** | Package-01 schema changes accepted and committed; trigger design documented; no new UI or Edge Function work |
| **Exit Criteria** | Triggers present for `system_admins`, `invitations`, `licenses`; LOGIN/LOGOUT audit mechanism present; four missing log RPCs are `CREATE OR REPLACE FUNCTION` definitions in `supabase/schema.sql` and callable |
| **Rollback Boundary** | Revert Package-02 schema/migration changes; restore pre-Package-02 Staging snapshot |
| **Verification Boundary** | `\dt`/`\df` inspection, trigger list, `supabase db reset` or Staging `supabase db push`, RPC smoke tests |
| **Deployment Considerations** | Staging only. No Production. Audit triggers may increase `app_audit_log` volume; monitor Staging logs |
| **Estimated Risk** | **High** because audit-trust boundary is sensitive; mitigated by `is_system_admin()` guards and Staging-only deployment |

## 7.3 Package-03 — Migration Reconciliation and Security Context

| Field | Value |
|---|---|
| **Objectives** | Inventory and ratify or retire the 25 fix migrations and 27 post-SSOT migrations; resolve missing `20260713000002` sequence entry; normalize non-standard filename `20260710064509_f33_members_search_rpc.sql`; align privileged RPCs to `SECURITY DEFINER` with `is_system_admin()` guard; document custom-domain drift in `services/admin/tenantAdminService.ts` |
| **Included Issues** | `MIG-001`, `MIG-002`, `MIG-003`, `MIG-004`, `DRIFT-001` (folded), `DRIFT-003`, `RPC-002` |
| **Affected Files** | `supabase/migrations/*.sql`; `supabase/schema.sql`; `services/admin/tenantAdminService.ts` (documentation/comment only) |
| **Dependencies** | `DB-001`–`DB-003` consolidation (Package-01); `DB-004`–`DB-009` triggers/RPCs (Package-02); `RPC-002` depends on canonical privileged RPC list |
| **Preconditions** | Package-01 and Package-02 committed; migration inventory complete; no new migrations added outside naming convention |
| **Exit Criteria** | Migration chain has no missing sequence entries; non-standard filename resolved or ratified; fix/post-SSOT migrations inventoried with ratify/retire decisions; `SECURITY INVOKER` privileged RPCs converted or explicitly accepted; custom-domain drift documented |
| **Rollback Boundary** | Revert Package-03 migration/comment changes; restore migration directory from baseline `3a06a6d9` if reconciliation is unsound |
| **Verification Boundary** | `supabase migration list` (or equivalent), `npm run lint`, `npm run build`, Staging `supabase db push` end-to-end |
| **Deployment Considerations** | Staging `supabase db push` is the final deployment synchronization target. Production remains untouched |
| **Estimated Risk** | **High** due to migration chain complexity; mitigated by inventory-first approach and Staging-only deployment |

------------------------------------------------------------------------

# 8. Dependency Graph

```text
Baseline 3a06a6d9 (AD-Baseline-1.0)
         │
         ▼
Wave-01 accepted (ARCH-001, PERM-001, ARCH-002, EXE-001, EDG-001)
         │
         ▼
Wave-02 Authorization (23)
         │
         ├─── Package-01 ───┐
         │   DB-001/DB-002/DB-003    │
         │   RPC-001/DRIFT-002 (folded)│
         │   RPC-004                 │
         │                          │
         ▼                          │
    Canonical RPC signatures ◄──────┘
         │
         ├─── Package-02 ───┐
         │   DB-004 (audit triggers)│
         │   DB-006/DB-007 (missing log RPCs)◄──┐
         │   DB-009 (LOGIN/LOGOUT enforcement)   │
         │   RPC-003 / SEC-005 (folded)          │
         │                                      │
         ▼                                      │
    Audit-trust boundary complete ◄─────────────┘
         │
         ├─── Package-03 ───┐
         │   MIG-001/MIG-002/DRIFT-001 (migration reconciliation)│
         │   MIG-003/MIG-004 (sequence/filename)                 │
         │   RPC-002 (SECURITY DEFINER alignment)                │
         │   DRIFT-003 (custom-domain documentation)             │
         │                                                     │
         ▼                                                     │
    Deterministic migration chain and security context ◄────────┘
         │
         ▼
Wave-02 Implementation Readiness Review
         │
         ▼
Wave-02 Implementation
```

**Critical path:** Package-01 → Package-02 → Package-03.  
**Parallel work opportunities:** Within Package-01, the three duplicate RPC consolidations are independent. Within Package-02, `DB-004` triggers are the prerequisite for `DB-006`/`DB-007`/`DB-009`; once triggers are in place, the three missing log RPCs and LOGIN/LOGOUT enforcement can be developed in parallel. `RPC-002` in Package-03 can be prepared in parallel with the migration inventory but must be committed after Package-01.  
**Blocking packages:** Package-01 blocks Package-02 because the canonical RPC signatures must exist before the missing log RPCs are meaningful; Package-02 blocks Package-03 because the migration reconciliation must account for the new trigger/RPC objects.  
**Shared artifacts:** `supabase/schema.sql` and `supabase/migrations/*.sql` are shared across all three packages; commit per package to avoid merge conflicts.  
**Potential conflicts:** Multiple packages editing `supabase/schema.sql` and the migration chain; use a strict commit-per-package policy and rebaseline the working tree from the previous package commit before starting the next.

------------------------------------------------------------------------

# 9. Execution Strategy

## 9.1 Execution Order

1. **Package-01** — Duplicate RPC consolidation.
2. **Package-02** — Audit triggers and missing log RPCs.
3. **Package-03** — Migration reconciliation and security context.

Each package ends with a commit, a static check, a Staging dry-run or push, and a package-level verification before the next package begins.

## 9.2 Repository Checkpoints

| Checkpoint | Action | Success Criterion |
|---|---|---|
| Pre-Package-01 | `git diff --stat 3a06a6d9 -- supabase/schema.sql supabase/migrations/` | 0 changes — clean baseline |
| Post-Package-01 | `git diff --stat HEAD -- supabase/schema.sql supabase/migrations/` | Changes confined to Package-01 scope |
| Post-Package-02 | `git diff --stat HEAD -- supabase/schema.sql supabase/migrations/` | Changes confined to Package-02 scope |
| Post-Package-03 | `git diff --stat HEAD -- supabase/schema.sql supabase/migrations/` | Changes confined to Package-03 scope |

## 9.3 Review Checkpoints

| Checkpoint | Reviewer | Focus |
|---|---|---|
| Package-01 design | Principal Software Architect | RPC signature compatibility, no dead-code resurrection |
| Package-02 design | Principal Software Architect + PMO | Audit trigger scope, `is_system_admin()` guards, no runaway audit volume |
| Package-03 design | Principal Software Architect | Migration chain determinism, `SECURITY DEFINER` correctness |
| Final engineering review | Enterprise PMO + Principal Software Architect | Traceability to `AD-Baseline-1.0`, no out-of-scope changes |

## 9.4 Verification Checkpoints

| Checkpoint | Method | Acceptance |
|---|---|---|
| Static checks | `npm run lint` (`tsc --noEmit`) | No new errors in admin surface or `services/admin/*.ts` |
| Build check | `npm run build` | `vite build` completes without errors |
| Schema check | `grep` for `CREATE OR REPLACE FUNCTION` counts | Single canonical `update_tenant`, `update_tenant_subscription`, `create_tenant_with_admin`; missing log RPCs present |
| Trigger check | `supabase migration list` + `\dt` / `\df` | Triggers on `system_admins`, `invitations`, `licenses`; LOGIN/LOGOUT enforcement |
| Migration chain check | `Get-ChildItem supabase/migrations/*.sql \| Sort-Object Name` | No missing sequence entries; non-standard filename resolved; fix/post-SSOT inventory ratified |
| Staging deployment | `supabase db push` to Staging project `shbmzvfcenbybvyzclem` | Successful with no unapplied/ambiguous migrations |

## 9.5 Acceptance Checkpoints

| Checkpoint | Evidence |
|---|---|
| Issue-level evidence | Each commit references one or more `AD-Baseline-1.0` issue IDs and one or more SSOT document sections |
| Integrated Wave-02 Verification Report | Independent verification of all sixteen canonical issues |
| Wave-02 Acceptance Review | PMO + Principal Software Architect sign-off |

## 9.6 Deployment Synchronization Preparation

- Target environment: **Staging** (`shbmzvfcenbybvyzclem`).
- Production remains untouched.
- Synchronization report (`23A` or equivalent) is a mandatory gate before Closeout, per `23` Section 12.
- Edge Functions are not in scope for Wave-02; no Edge Function deployment is authorized.

## 9.7 Repository Freeze Boundaries

- No file outside `supabase/schema.sql`, `supabase/migrations/*.sql`, and `services/admin/*.ts` (signature alignment only) may be modified.
- No new migrations may be added except those required by an in-scope issue and named according to the program convention.
- No Edge Function implementation is authorized.
- No UI or operational-app page changes are authorized.
- No Production deployment is authorized.

## 9.8 Risk Mitigation and Recovery Strategy

| Risk | Mitigation | Recovery |
|---|---|---|
| RPC consolidation breaks call sites | Static checks after every package; call-site `grep` across `services/admin/*.ts` | Revert the offending commit and re-consolidate |
| Migration chain becomes non-deterministic | Inventory before editing; never delete a migration that has been applied to Staging/Production | Reconstruct chain from `git` history and baseline `3a06a6d9` |
| Staging `supabase db push` fails | Dry-run first; keep Supabase CLI dev dependency | Rollback to previous Staging snapshot or reset from baseline |
| Scope creep into Wave-03 issues | `git diff --stat` review against authorized file list | Reject commits that touch out-of-scope files |

------------------------------------------------------------------------

# 10. Implementation Boundaries

This Engineering Kickoff is **planning only**. No implementation has been performed.

| Boundary | Confirmation |
|---|---|
| Application source code modified | **NO** |
| UI modified | **NO** |
| Database modified | **NO** |
| Migration created or applied | **NO** |
| RPC implemented | **NO** |
| Edge Function modified | **NO** |
| Deployment performed | **NO** |
| Implementation authorized | **NO** |

Any implementation must await the **Wave-02 Implementation Readiness Review**.

------------------------------------------------------------------------

# 11. Roadmap Synchronization

`00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` Section 10 has been updated by this Engineering Kickoff to:

``` text
Knowledge Baseline                       : COMPLETE
Repository Investigation                 : COMPLETE
Independent Acceptance Review            : COMPLETE
Acceptance Conditions Implementation     : COMPLETE
Phase A Closeout                         : COMPLETE
Baseline                                 : SEALED
Phase B Opening Authorization            : COMPLETE
Phase B                                  : OPEN
Remediation Master Plan                  : COMPLETE
Program Owner Decisions                  : COMPLETE
Wave Planning                            : COMPLETE
Wave-01 Authorization                    : COMPLETE
Wave-01 Engineering Kickoff              : COMPLETE
Wave-01 Implementation Readiness Review  : COMPLETE
Wave-01 Implementation                   : COMPLETE
Wave-01 Verification                     : COMPLETE
Wave-01 Acceptance                       : COMPLETE
Wave-01 Deployment Synchronization       : COMPLETE
Wave-01 Closeout                         : COMPLETE
Wave-02 Authorization                    : COMPLETE
Wave-02 Engineering Kickoff              : COMPLETE
Wave-02 Implementation Readiness Review  : READY
Wave-01 Progress                         : COMPLETE
  Package-01                             : COMPLETE
  Package-02                             : COMPLETE
  Package-03                             : COMPLETE
  Wave-01 Implementation                 : COMPLETE
Overall Completion                       : 3 / 3 Packages (100%)
Program Status                           : READY FOR WAVE-02 IMPLEMENTATION READINESS REVIEW
(Updated by 24_ADMIN_DASHBOARD_WAVE-02_ENGINEERING_KICKOFF.md, 2026-07-20)
```

No other roadmap items were modified.

------------------------------------------------------------------------

# 12. Engineering Kickoff Decision

**READY FOR IMPLEMENTATION READINESS REVIEW**

All mandatory documents have been reviewed, the repository has been verified, the Wave-01 implementation remains intact, the Wave-02 scope is analyzed, the package structure is finalized, the dependency graph is complete, and the execution strategy is established. The program is ready to proceed to the Wave-02 Implementation Readiness Review.
