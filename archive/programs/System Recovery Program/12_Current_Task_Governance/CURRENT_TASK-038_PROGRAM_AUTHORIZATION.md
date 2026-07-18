# CURRENT_TASK-038 — Program Authorization: Operational Runbook Update

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 6 — Operational Trust & Deployment Readiness  
**Task:** CURRENT_TASK-038 — Operational Runbook Update  
**Document Type:** Independent Program Governance Authority — `CURRENT_TASK` Program Authorization  
**Date:** 2026-07-18  
**Authority:** Independent Program Governance Authority  
**Decision:** **AUTHORIZED WITH CONSTRAINTS**

---

## 1. Purpose

This document authorizes the next Phase 6 `CURRENT_TASK`, **CURRENT_TASK-038 — Operational Runbook Update**, to proceed to **Engineering Kickoff**.

The authorization is **governance-only**. It does **not** authorize implementation, engineering execution, database changes, migration changes, SQL changes, service changes, UI changes, feature development, business-logic changes, architecture redesign, production access, deployment, or the creation of `CURRENT_TASK-038_ENGINEERING_KICKOFF.md`.

The next permitted activity is:

> **CURRENT_TASK-038_ENGINEERING_KICKOFF**

No implementation may begin until `CURRENT_TASK-038_ENGINEERING_KICKOFF` is completed and accepted.

---

## 2. Authorization Basis

The following documents were reviewed in the required order:

1. `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` — program authority, scope, SSOT principles, and governance model.
2. `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 6 and §7 — Phase 6 purpose, deliverables, and exit criteria.
3. `CURRENT_PHASE.md` — active phase marker (Phase 6 active) and Phase 6 constraints.
4. `UNIFIED_PROGRAM_STATE.md` — authoritative program state, governance hierarchy, and superseded documents.
5. `PHASE6_OPENING_AUTHORIZATION.md` — Phase 6 opening decision, A9 deferral, scope, and constraints.
6. `CURRENT_TASK-034_PROGRAM_STATUS_REVIEW.md` — prior task closure recommendation and residual observations.
7. `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md` — prior task closure recommendation and residual observations.
8. `CURRENT_TASK-036_PROGRAM_STATUS_REVIEW.md` — prior task closure recommendation, follow-up actions, and residual observations.
9. `D-034-01_Deployment_Validation_Gate_Definition.md` — gate checks and pass/fail/exception criteria.
10. `D-034-02_Deployment_Validation_Evidence_Checklist.md` — evidence checklist template and current Staging re-execution record.
11. `D-035-01_Deployment_Readiness_Evidence.md` — reference artifact checksums, RPC parity evidence, and deployment-readiness baseline.
12. `D-P6-02_Environment_Parity_Report.md` — Staging gate execution and non-conformance record.
13. `CURRENT_TASK-036_GATE_REEXECUTION_REPORT.md` — final `D-034-01` gate re-execution result.
14. `CURRENT_TASK-036_VERIFICATION_REPORT.md` — independent verification verdict.
15. `CURRENT_TASK-036_ACCEPTANCE_REVIEW.md` — independent acceptance verdict.
16. `docs/system-recovery/CURRENT_TASK-037_IMPLEMENTATION_REPORT.md` — Staging canonicalization work.
17. `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` — Staging canonicalization evidence.
18. `docs/admin-dashboard/MIGRATION_RUNBOOK.md` and `docs/admin-dashboard/DISASTER_RECOVERY_RUNBOOK.md` — existing operational runbook baseline.

---

## 3. Program Context

Phase 6 is formally opened and active as of `PHASE6_OPENING_AUTHORIZATION.md` (2026-07-18). `CURRENT_TASK-034`, `CURRENT_TASK-035`, and `CURRENT_TASK-036` have been formally closed with observations per their respective `PROGRAM_STATUS_REVIEW.md` documents. `CURRENT_TASK-037` produced the Staging canonicalization evidence documented in `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` and `docs/system-recovery/CURRENT_TASK-037_IMPLEMENTATION_REPORT.md`.

`CURRENT_TASK-038` is the recommended next Phase 6 `CURRENT_TASK`. It targets the remaining Phase 6 deliverable **Operational Runbook Update** (`SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 6 Deliverables #3; `CURRENT_PHASE.md` §6 Deliverables #3).

### Program Alignment

| Alignment Element | Finding |
|---|---|
| **System Recovery Master Plan** | Directly supports Phase 6 deliverable #3 (Operational Runbook Update) and exit criterion **EC-4** — "Operational runbooks direct engineers to the canonical migration chain and generated artifacts." |
| **Phase 6 roadmap** | Follows the closure of `CURRENT_TASK-036` and the Staging canonicalization performed under `CURRENT_TASK-037`; the canonical source, generated artifacts, gate definition, and environment parity evidence are now available to be referenced by operational documentation. |
| **Operational Trust** | Ensures that the operational procedures engineers rely on for deployment, rollback, and disaster recovery point to the canonical migration chain and accepted derived artifacts rather than to obsolete or superseded documents. |
| **Documentation consistency** | Supports the Charter objective to restore documentation consistency by aligning operational runbooks with the repository single source of truth. |

---

## 4. Authorized Objective

Update the operational documentation that supports Phase 6 deployment readiness so that every operational runbook and deployment procedure references the canonical source, the accepted derived artifacts, and the deployment validation gate evidence produced to date.

Specifically, the updated operational documentation shall:

- Direct engineers to `supabase/migrations/` as the canonical migration chain.
- Reference the accepted generated artifacts `supabase/schema.sql` and `supabase/generated/database.types.ts` with their reference checksums from `D-035-01` §6.1 and `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` §2.
- Reference the reconciled RPC contract `D-P3-01_Reconciled_RPC_Contract.md`.
- Reference the Deployment Validation Gate `D-034-01_Deployment_Validation_Gate_Definition.md` and its evidence checklist `D-034-02_Deployment_Validation_Evidence_Checklist.md`.
- Reference the Deployment Readiness Evidence `D-035-01_Deployment_Readiness_Evidence.md` and the Environment Parity Report `D-P6-02_Environment_Parity_Report.md`.
- Record the A9 deferred canonical migration `20260724000000_sp4_4_webhook_delivery_hardening.sql` as unresolved unless a separate Architecture Authority task dispositions it.
- Preserve or add rollback guidance that is consistent with the canonical migration chain and the `D-034-01` gate.
- Not introduce any new source of schema, RPC, or program-status truth.

---

## 5. Authorized Scope

### 5.1 In Scope

- Editorial updates to existing operational runbooks under `docs/admin-dashboard/` to reflect the canonical source and accepted Phase 6 evidence.
- Examples of documents that may be updated:
  - `docs/admin-dashboard/MIGRATION_RUNBOOK.md`
  - `docs/admin-dashboard/DISASTER_RECOVERY_RUNBOOK.md`
  - `docs/admin-dashboard/ROLLBACK_RUNBOOK.md`
  - `docs/admin-dashboard/INCIDENT_RESPONSE_RUNBOOK.md`
  - `docs/admin-dashboard/KEY_ROTATION_RUNBOOK.md`
  - `docs/admin-dashboard/MONITORING_RUNBOOK.md`
- Deployment procedures and checklists that reference canonical artifacts and the `D-034-01` gate.
- Rollback guidance tied to the canonical migration chain and the accepted generated artifacts.
- Canonical source references (`supabase/migrations/`, `supabase/schema.sql`, `supabase/generated/database.types.ts`, `D-P3-01_Reconciled_RPC_Contract.md`, `D-034-01`, `D-034-02`, `D-035-01`, `D-P6-02`, `D-P6-03_STAGING_CANONICALIZATION_REPORT.md`).
- Documentation of the A9 deferred observation as unresolved and out of scope for this task.
- Production of a short Operational Runbook Update summary or diff log, if required, for acceptance review.

### 5.2 Out of Scope

The following are explicitly **not** authorized under `CURRENT_TASK-038`:

- Any change to business logic.
- Any database modification or schema change.
- Any migration edit, new migration, or migration deletion.
- Any SQL change.
- Any service code change.
- Any UI change, build configuration change, or feature development.
- Any architecture redesign.
- Creation, waiver, or resolution of the A9 deferred canonical migration (that requires a separate Architecture Authority `CURRENT_TASK`).
- Execution of the `D-034-01` gate against any environment.
- Deployment to Staging or Production.
- Edge function redeployment or parity verification.
- Modification of `CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md`, `SYSTEM_RECOVERY_MASTER_PLAN.md`, `SYSTEM_RECOVERY_PROGRAM_CHARTER.md`, or any other governance state document.
- Any new master plan, program hierarchy, or competing source of program status.

---

## 6. Deliverable

| # | Deliverable | Purpose | Acceptance Authority |
|---|---|---|---|
| D-P6-03 (Operational Runbook Update) | Updated operational documentation that references the canonical migration chain, generated artifacts, reconciled RPC contract, and Phase 6 gate evidence. | Satisfies Phase 6 exit criterion EC-4 and ensures deployment/rollback procedures are aligned with the repository single source of truth. | Program Manager, with Architecture Authority input |

**Deliverable identifier note:** `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` already consumes the `D-P6-03` identifier for the Staging canonicalization report produced under `CURRENT_TASK-037`. The Operational Runbook Update deliverable shall therefore be recorded under a non-colliding artifact name (for example `D-P6-03_Operational_Runbook_Update.md`, `D-P6-03A_Operational_Runbook_Update.md`, or an equivalent identifier approved at Engineering Kickoff) and shall not overwrite `D-P6-03_STAGING_CANONICALIZATION_REPORT.md`.

---

## 7. Dependencies

| Dependency | Status | Evidence |
|---|---|---|
| Phase 6 opened and active | Satisfied | `PHASE6_OPENING_AUTHORIZATION.md` §1, §8; `CURRENT_PHASE.md` §1, §3; `UNIFIED_PROGRAM_STATE.md` §3 |
| `CURRENT_TASK-034` closed | Closed with observations | `CURRENT_TASK-034_PROGRAM_STATUS_REVIEW.md` §7, §9 |
| `CURRENT_TASK-035` closed | Closed with observations | `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md` §7, §9 |
| `CURRENT_TASK-036` closed | Closed with observations | `CURRENT_TASK-036_PROGRAM_STATUS_REVIEW.md` §3.7, §4 |
| `CURRENT_TASK-037` Staging canonicalization completed | Complete with observations | `docs/system-recovery/CURRENT_TASK-037_IMPLEMENTATION_REPORT.md` §Status; `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` §7 |
| `D-034-01` gate definition | Approved | `D-034-01_Deployment_Validation_Gate_Definition.md` §9–§11 |
| `D-035-01` reference artifact checksums | Recorded and verified | `D-035-01_Deployment_Readiness_Evidence.md` §6.1 |
| `D-P6-02` environment parity report | Produced | `D-P6-02_Environment_Parity_Report.md` §1–§6 |
| `D-P6-03` Staging canonicalization report | Produced | `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` §2, §4, §7 |
| Reconciled RPC contract | Accepted | `D-P3-01_Reconciled_RPC_Contract.md`; `PHASE3_ACCEPTANCE_RECORD.md` |

---

## 8. Entry Criteria

| Criterion | Evidence | Finding |
|---|---|---|
| Phase 6 is active | `PHASE6_OPENING_AUTHORIZATION.md`; `CURRENT_PHASE.md` §1 | Satisfied |
| Prior Phase 6 `CURRENT_TASK`s on the critical path are closed | `CURRENT_TASK-034_PROGRAM_STATUS_REVIEW.md`; `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md`; `CURRENT_TASK-036_PROGRAM_STATUS_REVIEW.md` | Satisfied |
| Staging canonicalization evidence is available | `docs/system-recovery/CURRENT_TASK-037_IMPLEMENTATION_REPORT.md`; `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` | Satisfied |
| Deployment validation gate definition and evidence exist | `D-034-01`; `D-034-02`; `D-035-01`; `D-P6-02` | Satisfied |
| Operational runbook source files exist | `docs/admin-dashboard/MIGRATION_RUNBOOK.md`; `docs/admin-dashboard/DISASTER_RECOVERY_RUNBOOK.md`; plus `ROLLBACK_RUNBOOK.md`, `INCIDENT_RESPONSE_RUNBOOK.md`, `KEY_ROTATION_RUNBOOK.md`, `MONITORING_RUNBOOK.md` | Satisfied |
| Scope is limited to documentation changes | This authorization §5 | Enforced by governance |

---

## 9. Risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | A runbook is edited to present itself or another document as a canonical source of schema/RPC truth. | High | Every runbook reference must point to `supabase/migrations/`, `supabase/schema.sql`, `supabase/generated/database.types.ts`, `D-P3-01`, `D-034-01`, `D-035-01`, or `D-P6-03_STAGING_CANONICALIZATION_REPORT.md`; no runbook may claim authority over the canonical source. |
| 2 | A9 deferred canonical migration is inadvertently documented as resolved or waived. | Medium | The runbook update shall copy the A9 language from `PHASE6_OPENING_AUTHORIZATION.md` §6 and `D-034-01` §19; A9 disposition remains a separate Architecture Authority `CURRENT_TASK`. |
| 3 | The historical `D-P6-02_Environment_Parity_Report.md` initial **FAIL** result is cited as the current environment state. | Medium | Runbooks must reference the final gate re-execution result in `CURRENT_TASK-036_GATE_REEXECUTION_REPORT.md` §7 and the canonicalization evidence in `D-P6-03_STAGING_CANONICALIZATION_REPORT.md`. |
| 4 | D-034-02 formal sign-off fields are still blank; the runbook update might imply the gate is fully signed off. | Low | Do not state that the gate is formally signed off; reference `D-034-01` as approved for content while noting that operational sign-offs remain pending per `CURRENT_TASK-036_PROGRAM_STATUS_REVIEW.md` §3.8. |
| 5 | Scope creep into canonical-source changes, migration edits, or edge function parity verification. | Medium | Enforce the out-of-scope list in §5.2; any such work requires a separate authorized `CURRENT_TASK`. |
| 6 | Existing `D-P6-03` identifier is overwritten by the Operational Runbook Update deliverable. | Low | Use a non-colliding artifact name as described in §6. |

---

## 10. Constraints

- This task is strictly an operational documentation update. It may not modify canonical sources, derived artifacts, source code, migrations, tests, runtime configuration, or governance state documents.
- No implementation work may begin until `CURRENT_TASK-038_ENGINEERING_KICKOFF` is accepted.
- No Staging or Production environment access is authorized for this task.
- A9 remains a deferred Architecture Authority exception; the runbook update may record it but may not create, waive, or resolve it.
- Runbook references must be traceable to the accepted canonical source or to a Phase 6 evidence artifact already produced.
- The updated runbooks must not introduce a new source of program status or contradict `UNIFIED_PROGRAM_STATE.md`.
- Scope expansion requests must be approved by the Program Sponsor with Architecture Authority input.

---

## 11. Required Evidence for Acceptance

The following evidence shall be available before the Operational Runbook Update is accepted:

| # | Evidence | Purpose |
|---|---|---|
| 1 | Updated operational runbook files under `docs/admin-dashboard/` | Demonstrate that the runbooks reflect the canonical migration chain, generated artifacts, and Phase 6 gate evidence. |
| 2 | Operational Runbook Update summary or diff log | Show which runbooks were changed and which canonical references were added or corrected. |
| 3 | Traceability table mapping each runbook section to a canonical or derived artifact | Prove that no runbook section relies on a superseded or non-canonical source. |
| 4 | A9 deferral statement in the updated runbooks | Confirm that the A9 canonical migration remains unresolved and is not misrepresented. |
| 5 | No-diff confirmation for `supabase/migrations/`, `supabase/schema.sql`, `supabase/generated/database.types.ts`, source code, tests, and governance state documents | Confirm the task remained documentation-only. |

---

## 12. Acceptance Authority

- **Program Manager** — owns acceptance of the Operational Runbook Update deliverable.
- **Architecture Authority** — provides required input to confirm that the runbook references correctly identify the canonical source and derived artifacts and that no runbook is promoted to canonical status.

---

## 13. Final Decision

**AUTHORIZED WITH CONSTRAINTS**

The System Recovery Program is ready to authorize `CURRENT_TASK-038 — Operational Runbook Update` because:

1. The task maps directly to Phase 6 deliverable #3 and exit criterion EC-4 in `SYSTEM_RECOVERY_MASTER_PLAN.md`.
2. Phase 6 is formally opened and active.
3. `CURRENT_TASK-034`, `CURRENT_TASK-035`, and `CURRENT_TASK-036` are closed with observations, and `CURRENT_TASK-037` Staging canonicalization is complete.
4. The required supporting evidence (`D-034-01`, `D-035-01`, `D-P6-02`, `D-P6-03_STAGING_CANONICALIZATION_REPORT.md`, `CURRENT_TASK-037_IMPLEMENTATION_REPORT.md`) is available.
5. The existing operational runbooks require alignment with the canonical source and generated artifacts to satisfy Phase 6 exit criteria.
6. The task is strictly documentation-only and is bounded by the out-of-scope list in §5.2.

The authorization is issued **with constraints** because:

- A9 remains an unresolved deferred Architecture Authority exception and must not be documented as resolved.
- `D-034-02` formal Program Manager / Architecture Authority sign-off fields remain pending per `CURRENT_TASK-036_PROGRAM_STATUS_REVIEW.md` §3.8.
- `D-P6-02_Environment_Parity_Report.md` contains a historical **FAIL** record; runbooks must reference the later **PASS WITH OBSERVATIONS** result from `CURRENT_TASK-036_GATE_REEXECUTION_REPORT.md` and the canonicalization evidence from `D-P6-03_STAGING_CANONICALIZATION_REPORT.md`.
- The `D-P6-03` identifier is already in use for the Staging canonicalization report; the Operational Runbook Update deliverable must use a non-colliding artifact name.

No implementation, Engineering Kickoff, deployment, database change, migration edit, service change, UI change, feature development, or A9 resolution may occur under this authorization.

---

*Basis: `SYSTEM_RECOVERY_PROGRAM_CHARTER.md`; `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 6, §7; `CURRENT_PHASE.md`; `UNIFIED_PROGRAM_STATE.md`; `PHASE6_OPENING_AUTHORIZATION.md`; `CURRENT_TASK-034_PROGRAM_STATUS_REVIEW.md`; `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md`; `CURRENT_TASK-036_PROGRAM_STATUS_REVIEW.md`; `CURRENT_TASK-036_GATE_REEXECUTION_REPORT.md`; `CURRENT_TASK-036_VERIFICATION_REPORT.md`; `CURRENT_TASK-036_ACCEPTANCE_REVIEW.md`; `D-034-01_Deployment_Validation_Gate_Definition.md`; `D-034-02_Deployment_Validation_Evidence_Checklist.md`; `D-035-01_Deployment_Readiness_Evidence.md`; `D-P6-02_Environment_Parity_Report.md`; `docs/system-recovery/CURRENT_TASK-037_IMPLEMENTATION_REPORT.md`; `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md`.*
