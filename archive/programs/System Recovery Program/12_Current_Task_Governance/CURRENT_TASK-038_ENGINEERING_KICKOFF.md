# CURRENT_TASK-038 — Engineering Kickoff: Operational Runbook Update

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 6 — Operational Trust & Deployment Readiness  
**Task:** CURRENT_TASK-038 — Operational Runbook Update  
**Document Type:** Engineering Kickoff  
**Date:** 2026-07-18  
**Authority:** Independent Engineering Authority  
**Decision:** **READY FOR IMPLEMENTATION WITH CONSTRAINTS**

---

> **No implementation. No code change. No migration. No schema change. No generated-type change. No governance state change.**
>
> This document is the Engineering Kickoff deliverable for CURRENT_TASK-038. It defines the implementation plan for updating operational runbooks so that they reference the canonical migration chain and accepted Phase 6 evidence. It does not edit any runbook.

---

## 1. Read-First Basis

Engineering has reviewed the documents listed in `CURRENT_TASK-038_PROGRAM_AUTHORIZATION.md` §2 in the required order:

| Category | Documents Reviewed |
|---|---|
| Program governance | `SYSTEM_RECOVERY_PROGRAM_CHARTER.md`, `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md` |
| Current authorization | `CURRENT_TASK-038_PROGRAM_AUTHORIZATION.md` — **AUTHORIZED WITH CONSTRAINTS** |
| Phase 6 predecessor deliverables | `D-034-01_Deployment_Validation_Gate_Definition.md`, `D-034-02_Deployment_Validation_Evidence_Checklist.md`, `D-035-01_Deployment_Readiness_Evidence.md`, `D-P6-02_Environment_Parity_Report.md`, `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md`, `docs/system-recovery/CURRENT_TASK-037_IMPLEMENTATION_REPORT.md` |
| Current operational runbooks | `docs/admin-dashboard/MIGRATION_RUNBOOK.md`, `DISASTER_RECOVERY_RUNBOOK.md`, `ROLLBACK_RUNBOOK.md`, `INCIDENT_RESPONSE_RUNBOOK.md`, `KEY_ROTATION_RUNBOOK.md`, `MONITORING_RUNBOOK.md` |

Key canonical references retained for the update:

| Artifact | Path / Identifier | Role |
|---|---|---|
| Canonical migration chain | `supabase/migrations/*.sql` (138 files, lexicographic order) | Single source of schema/RPC truth |
| Canonical migration chain definition | `D-P2-01_Canonical_Migration_Chain_Definition.md` | Ordering and naming standard |
| Generated schema artifact | `supabase/schema.sql` (SHA-256 `C3738BCBEAABA04D8FE7C86FEB1F89C19BD0E6B8F50E865F58CE235A24EC3689`) | Derived schema snapshot |
| Generated type artifact | `supabase/generated/database.types.ts` (SHA-256 `6C8767DDE630FC0A8F33DF955EAC468BB84DEF6119545B581ADF06C23CD81C8A`) | Derived type artifact |
| Reconciled RPC contract | `D-P3-01_Reconciled_RPC_Contract.md` | Expected service-layer RPC surface |
| Deployment validation gate | `D-034-01_Deployment_Validation_Gate_Definition.md` | Pre/during/post-deployment checks |
| Deployment readiness evidence | `D-035-01_Deployment_Readiness_Evidence.md` | Reference artifact checksums and parity evidence |
| Environment parity report | `D-P6-02_Environment_Parity_Report.md` | Staging gate execution and non-conformance record |
| Staging canonicalization report | `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` | Final Staging canonicalization evidence |

The A9 deferred canonical migration `20260724000000_sp4_4_webhook_delivery_hardening.sql` remains unresolved and shall be recorded, not waived.

---

## 2. Engineering Objectives

This kickoff resolves the following:

| # | Objective | Resolution |
|---|---|---|
| 1 | Exactly which runbooks require modification | Six operational runbooks under `docs/admin-dashboard/` require editorial updates (§4.1). Non-runbook files are unchanged (§4.2). |
| 2 | Exactly what sections require updating | Section-level plan is provided in §4.1 for each affected runbook. |
| 3 | Which canonical references must be inserted | `supabase/migrations/`, `supabase/schema.sql`, `supabase/generated/database.types.ts`, `D-P3-01_Reconciled_RPC_Contract.md`, `D-034-01`, `D-034-02`, `D-035-01`, `D-P6-02`, `D-P6-03_STAGING_CANONICALIZATION_REPORT.md`. |
| 4 | Which obsolete references must be removed | `memory-zone/...` planning documents, `docs/admin-dashboard/RPC_CONTRACTS.md` as a contract authority, and any text that treats a runbook or derived artifact as a canonical source. |
| 5 | How traceability will be maintained | Every planned change is mapped to an authoritative source in §4.3. A runbook update log and final deliverable `D-P6-04` will record the before/after reference state. |

---

## 3. Deliverable Identifier Resolution

`D-P6-03` is already consumed by `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` (produced under `CURRENT_TASK-037`). Using `D-P6-03_Operational_Runbook_Update.md` would collide or create ambiguity.

Therefore, the official identifier for the Operational Runbook Update deliverable is:

| Field | Value |
|---|---|
| **Identifier** | `D-P6-04` |
| **Title** | Operational Runbook Update |
| **File** | `D-P6-04_Operational_Runbook_Update.md` |
| **Location** | Repository root (`C:/PROJECT/vietsalepro/`) |

`D-P6-04` does not collide with any existing Phase 6 artifact (`D-034-01`, `D-034-02`, `D-035-01`, `D-P6-02`, `D-P6-03`).

---

## 4. Runbook Inventory & Modification Plan

### 4.1 Affected Operational Runbooks

| Runbook | Sections to Update | Canonical References to Insert | Obsolete References to Remove |
|---|---|---|---|
| `MIGRATION_RUNBOOK.md` | Overview source-plan block; Phase 5 long-term RPC contract compliance; Multi-Environment Deployment Workflow; Production Deploy Checklist; Component Ownership table | `supabase/migrations/` (canonical chain); `supabase/schema.sql`; `supabase/generated/database.types.ts`; `D-P3-01_Reconciled_RPC_Contract.md`; `D-034-01`; `D-034-02`; `D-035-01`; `D-P6-03_STAGING_CANONICALIZATION_REPORT.md` | `memory-zone/KE_HOACH/...` (superseded plans); `docs/admin-dashboard/RPC_CONTRACTS.md` as canonical contract authority |
| `DISASTER_RECOVERY_RUNBOOK.md` | Prerequisites; Scenario A/B restore steps; Verify / Verification Checklist; Annual DR Drill | `supabase/migrations/` as restore source; `D-034-01` gate; `D-035-01` reference checksums; `D-P6-03` canonicalization result; `D-P3-01` RPC parity | `docs/admin-dashboard/RPC_CONTRACTS.md` in verification checklist; any wording that treats a runbook as canonical |
| `ROLLBACK_RUNBOOK.md` | Trigger; Rollback database migration; Verify rollback; Verification Checklist; Reverse Migration template | `D-034-01` gate fail/abort trigger; `supabase/migrations/` as canonical source; `D-035-01` artifact checksums; `D-P3-01` for `npm run audit:rpc` | References to ad-hoc SQL or non-canonical rollback sources |
| `INCIDENT_RESPONSE_RUNBOOK.md` | Triage; Contain; Resolve & Verify; Post-Incident | `D-034-01` gate and `D-P6-03` canonicalization in triage/contain; `D-P3-01` in verify; updated runbook cross-references | Stale or contradictory runbook links; any statement that A9 is resolved |
| `MONITORING_RUNBOOK.md` | Current State; SLIs/SLOs; Metrics to Collect — API/Database; Alerting Rules; Runbooks Link; Verification | `D-034-01` gate health; `D-035-01` artifact checksums; canonical RPC examples from `D-P3-01`; `supabase/schema.sql` / `database.types.ts` as derived artifacts | RPC examples that do not reflect `D-P3-01`; any claim that monitoring dashboards override the canonical source |
| `KEY_ROTATION_RUNBOOK.md` | Verification; Post-Rotation | `D-034-01` gate re-check after rotation; `D-P3-01` for `admin-health-check` RPC exercise | Non-canonical references to RPC contract |

### 4.2 Unchanged Files

The following `docs/admin-dashboard/` files were reviewed and are not operational runbooks or are outside the scope of this task:

| File | Rationale for No Change |
|---|---|
| `ADMIN_DASHBOARD_DEPLOYMENT_ERROR_REMEDIATION_PLAN.md` | Remediation plan, not an operational runbook; outside CURRENT_TASK-038 scope. |
| `ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md` | Archived phase implementation record. |
| `ADMIN_DASHBOARD_PHASE_2_SERVICE_TESTS.md` | Phase implementation record, not a runbook. |
| `ADMIN_DASHBOARD_PHASE_3_DEPLOY.md` | Phase implementation record, not a runbook. |
| `ADMIN_DASHBOARD_PHASE_4_VERIFY_UI.md` | Phase implementation record, not a runbook. |
| `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` | Phase implementation record, not a runbook. |
| `HANDOFF_AUDIT_LOG_400.md` | Handoff log, not a runbook. |
| `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md` | Handoff log, not a runbook. |
| `HANDOFF_PHASE_5_UNTRACKED_FILES.md` | Handoff log, not a runbook. |
| `RPC_CONTRACTS.md` | Superseded by `D-P3-01_Reconciled_RPC_Contract.md`; not an operational runbook. It may be referenced as historical context only, but not edited to claim canonical status. |
| `runbook.md` (repository root) | Not located under `docs/admin-dashboard/`; not listed in `CURRENT_TASK-038_PROGRAM_AUTHORIZATION.md` §5.1 in scope. |

### 4.3 Traceability of Planned Updates

Every planned documentation update points to an approved canonical artifact:

| Runbook Section | Planned Change | Authoritative Source |
|---|---|---|
| `MIGRATION_RUNBOOK.md` — Overview source-plan block | Replace `memory-zone/...` source plan references with Phase 6 canonical references | `UNIFIED_PROGRAM_STATE.md` §6; `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 6 |
| `MIGRATION_RUNBOOK.md` — Phase 5 RPC contract compliance | Replace `docs/admin-dashboard/RPC_CONTRACTS.md` with `D-P3-01` | `D-P3-01_Reconciled_RPC_Contract.md`; `CURRENT_TASK-038_PROGRAM_AUTHORIZATION.md` §4 |
| `MIGRATION_RUNBOOK.md` — Multi-Environment Deployment Workflow | Insert `D-034-01` gate execution before promotion; reference `D-035-01` artifact checksums and `D-P6-03` Staging canonicalization | `D-034-01_Deployment_Validation_Gate_Definition.md`; `D-035-01_Deployment_Readiness_Evidence.md` §6.1; `D-P6-03_STAGING_CANONICALIZATION_REPORT.md` §4 |
| `MIGRATION_RUNBOOK.md` — Production Deploy Checklist | Add `D-034-02` evidence checklist completion; reference canonical artifact parity | `D-034-02_Deployment_Validation_Evidence_Checklist.md`; `D-034-01` §9–§11 |
| `DISASTER_RECOVERY_RUNBOOK.md` — Scenario B restore | State migrations are applied from `supabase/migrations/` in canonical lexicographic order; run `D-034-01` post-restore | `D-P2-01_Canonical_Migration_Chain_Definition.md`; `D-034-01` §9–§11; `D-P6-03_STAGING_CANONICALIZATION_REPORT.md` §4 |
| `DISASTER_RECOVERY_RUNBOOK.md` — Verification Checklist | Replace `RPC_CONTRACTS.md` parity check with `D-P3-01` parity and `D-034-01` gate result | `D-P3-01_Reconciled_RPC_Contract.md`; `D-034-02` §4 |
| `ROLLBACK_RUNBOOK.md` — Trigger | Add `D-034-01` gate FAIL as a rollback trigger | `D-034-01_Deployment_Validation_Gate_Definition.md` §9–§11 |
| `ROLLBACK_RUNBOOK.md` — Reverse migration template | Reference canonical migration chain and `D-034-01` exception handling | `supabase/migrations/`; `D-034-01` §11 |
| `ROLLBACK_RUNBOOK.md` — Verify rollback | Reference `D-035-01` checksums and `D-P3-01` contract parity | `D-035-01_Deployment_Readiness_Evidence.md` §6.1; `D-P3-01_Reconciled_RPC_Contract.md` |
| `INCIDENT_RESPONSE_RUNBOOK.md` — Triage | Reference `D-034-01` gate status and `D-P6-03` canonicalization | `D-034-01_Deployment_Validation_Gate_Definition.md`; `D-P6-03_STAGING_CANONICALIZATION_REPORT.md` §7 |
| `INCIDENT_RESPONSE_RUNBOOK.md` — Resolve & Verify | Include `D-034-01` gate re-execution before production promotion | `D-034-01` §10; `D-034-02` §4 |
| `MONITORING_RUNBOOK.md` — Current State | Reference canonical artifact health checks from `D-035-01` | `D-035-01_Deployment_Readiness_Evidence.md` §6.1 |
| `MONITORING_RUNBOOK.md` — Metrics to Collect (API/Database) | Align RPC examples with `D-P3-01` service-layer RPCs | `D-P3-01_Reconciled_RPC_Contract.md` |
| `KEY_ROTATION_RUNBOOK.md` — Verification | Add `D-034-01` gate re-check after key rotation | `D-034-01_Deployment_Validation_Gate_Definition.md` |

---

## 5. Implementation Strategy

### 5.1 Approach

- **Editorial-only changes** to the six operational runbooks listed in §4.1.
- **No changes** to `supabase/migrations/`, `supabase/schema.sql`, `supabase/generated/database.types.ts`, source code, tests, UI, edge functions, or governance state documents.
- **One authoritative reference set** drawn from `D-035-01` and `D-P6-03` to ensure all runbooks cite the same canonical artifacts.
- **A9 treated as unresolved**: every runbook that mentions A9 copies the deferred language from `PHASE6_OPENING_AUTHORIZATION.md` §6 and `D-034-01` §19; it is not documented as resolved or waived.

### 5.2 Implementation Order

| Step | Activity | Output |
|---|---|---|
| 1 | Collect canonical reference values (checksums, file counts, first/last migration names, A9 statement) from `D-035-01`, `D-P6-03`, `D-034-01`, `D-P3-01` | Reference clipboard |
| 2 | Update `MIGRATION_RUNBOOK.md` | Canonical deployment workflow and checklist |
| 3 | Update `ROLLBACK_RUNBOOK.md` | Canonical rollback triggers and reverse-migration template |
| 4 | Update `DISASTER_RECOVERY_RUNBOOK.md` | Canonical restore and verification steps |
| 5 | Update `INCIDENT_RESPONSE_RUNBOOK.md` | Triage/contain/verify with gate references |
| 6 | Update `MONITORING_RUNBOOK.md` | Canonical metric and alert references |
| 7 | Update `KEY_ROTATION_RUNBOOK.md` | Gate re-check after rotation |
| 8 | Produce `D-P6-04_Operational_Runbook_Update.md` and update log | Phase 6 deliverable #3 |
| 9 | Generate `git diff` and no-diff confirmation | Acceptance evidence |

### 5.3 Document Update Sequence

The recommended sequence is **Migration → Rollback → Disaster → Incident → Monitoring → Key Rotation**. This order is chosen because:

- `MIGRATION_RUNBOOK.md` establishes the canonical deployment workflow and checklist that the other runbooks reference.
- `ROLLBACK_RUNBOOK.md` and `DISASTER_RECOVERY_RUNBOOK.md` cross-reference the migration workflow; they are updated after the migration workflow is fixed.
- `INCIDENT_RESPONSE_RUNBOOK.md` links to `ROLLBACK_RUNBOOK.md` and `DISASTER_RECOVERY_RUNBOOK.md`; it is updated after those.
- `MONITORING_RUNBOOK.md` and `KEY_ROTATION_RUNBOOK.md` have the fewest dependencies and are updated last.

---

## 6. Acceptance Evidence

The following evidence will be produced or confirmed before acceptance:

| # | Evidence | Purpose |
|---|---|---|
| 1 | Updated `docs/admin-dashboard/MIGRATION_RUNBOOK.md`, `DISASTER_RECOVERY_RUNBOOK.md`, `ROLLBACK_RUNBOOK.md`, `INCIDENT_RESPONSE_RUNBOOK.md`, `KEY_ROTATION_RUNBOOK.md`, `MONITORING_RUNBOOK.md` | Demonstrates runbooks reference the canonical source and accepted Phase 6 evidence |
| 2 | `D-P6-04_Operational_Runbook_Update.md` | Phase 6 deliverable #3 |
| 3 | Runbook update log (e.g., `CURRENT_TASK-038_RUNBOOK_UPDATE_LOG.md`) or inline diff summary | Shows which files and sections changed and which canonical references were added/removed |
| 4 | Traceability table (§4.3) | Proves every planned update maps to an approved canonical artifact |
| 5 | A9 deferral statement in each affected runbook | Confirms the deferred canonical migration is recorded, not resolved |
| 6 | `git diff --stat` and `git status` showing changes confined to `docs/admin-dashboard/*.md` and `D-P6-04_Operational_Runbook_Update.md` only | Confirms the task remained documentation-only |
| 7 | No-diff confirmation for `supabase/migrations/`, `supabase/schema.sql`, `supabase/generated/database.types.ts`, source code, tests, and governance state documents | Confirms no canonical source was altered |

---

## 7. Rollback Strategy (Documentation Only)

Because the implementation is limited to Markdown files, rollback is straightforward:

| Scenario | Rollback Action |
|---|---|
| Error discovered during implementation | `git checkout -- <runbook>` to restore the file to the baseline `master` commit. |
| Deliverable rejected during acceptance | Revert the single commit containing the runbook edits and `D-P6-04` using `git revert <commit>` or manual `git checkout --` of all affected Markdown files. |
| Canonical reference found to be wrong | Replace only the incorrect reference string with the correct canonical reference; no source-code, migration, or environment rollback is required. |

No database, migration, generated artifact, or runtime rollback is required because the task does not touch those layers.

---

## 8. Final Decision

**READY FOR IMPLEMENTATION WITH CONSTRAINTS**

This decision is supported by the following objective evidence:

1. **Authorization in force.** `CURRENT_TASK-038_PROGRAM_AUTHORIZATION.md` is issued and **AUTHORIZED WITH CONSTRAINTS**.
2. **Phase 6 is active.** `CURRENT_PHASE.md` and `PHASE6_OPENING_AUTHORIZATION.md` confirm Phase 6 is open and the Operational Runbook Update is the remaining Phase 6 deliverable.
3. **Predecessor evidence is available.** `D-034-01`, `D-034-02`, `D-035-01`, `D-P6-02`, `D-P6-03_STAGING_CANONICALIZATION_REPORT.md`, and `CURRENT_TASK-037_IMPLEMENTATION_REPORT.md` provide the canonical references required for the runbook update.
4. **Scope is bounded and documentation-only.** No source code, migrations, schema, generated types, UI, or governance state documents will be modified.
5. **Deliverable identifier is resolved.** `D-P6-04_Operational_Runbook_Update.md` is non-colliding with existing Phase 6 artifacts.

The **WITH CONSTRAINTS** qualifier applies because:

- The A9 deferred canonical migration remains unresolved; runbooks must record it as deferred.
- `D-034-02` formal Program Manager / Architecture Authority sign-off fields remain pending per `CURRENT_TASK-036_PROGRAM_STATUS_REVIEW.md` §3.8.
- No live environment access is authorized for this task; the update is based on the accepted repository baseline and Staging canonicalization evidence.

Implementation may proceed once this Engineering Kickoff is accepted.
