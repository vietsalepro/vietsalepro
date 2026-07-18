# CURRENT_TASK-036 — Program Authorization: Environment Parity Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 6 — Operational Trust & Deployment Readiness  
**Task:** CURRENT_TASK-036 — Environment Parity Report  
**Document Type:** Independent Program Governance Authority — `CURRENT_TASK` Program Authorization  
**Date:** 2026-07-18  
**Authority:** Independent Program Governance Authority  
**Decision:** **AUTHORIZED WITH CONSTRAINTS**

---

## 1. Purpose

This document authorizes the next Phase 6 `CURRENT_TASK`, **CURRENT_TASK-036 — Environment Parity Report**, to proceed to **Engineering Kickoff**.

The authorization is **governance-only**. It does **not** authorize implementation, engineering execution, Supabase access, database changes, schema modifications, business-logic changes, migration changes, application-code changes, or deployment. No implementation may begin until `CURRENT_TASK-036_ENGINEERING_KICKOFF` is completed and accepted.

The next permitted activity is:

> **CURRENT_TASK-036_ENGINEERING_KICKOFF**

---

## 2. Authorization Basis

The following documents were reviewed in the required order:

1. `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` — program authority, scope, SSOT principles, and governance model.
2. `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 6 and §7 — Phase 6 purpose, deliverables, and exit criteria.
3. `CURRENT_PHASE.md` — active phase marker (Phase 6 active) and Phase 6 constraints.
4. `UNIFIED_PROGRAM_STATE.md` — authoritative program state, governance hierarchy, and superseded documents.
5. `PHASE6_OPENING_AUTHORIZATION.md` — Phase 6 opening decision, A9 deferral, scope, and constraints.
6. `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md` — prior task closure recommendation and residual observations.
7. `D-034-01_Deployment_Validation_Gate_Definition.md` — gate checks and pass/fail/exception criteria.
8. `D-034-02_Deployment_Validation_Evidence_Checklist.md` — evidence checklist template.
9. `D-035-01_Deployment_Readiness_Evidence.md` — reference artifact checksums, RPC parity evidence, and pending live-environment checks.

---

## 3. Program Context

Phase 6 is formally opened and active as of `PHASE6_OPENING_AUTHORIZATION.md` (2026-07-18). `CURRENT_TASK-035 — Deployment Readiness Evidence` has been formally closed with observations per `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md` §10, and `D-035-01_Deployment_Readiness_Evidence.md` is accepted as the baseline reference for live validation.

`CURRENT_TASK-036` is the recommended next Phase 6 engineering task. It targets **D-P6-02 — Environment Parity Report**: the live execution of the `D-034-01` Deployment Validation Gate against an accessible clean validation environment (Staging), the regeneration and comparison of canonical derived artifacts, the completion of `D-034-02` for each evaluated environment, and the production of the Environment Parity Report.

### Program Alignment

| Alignment Element | Finding |
|---|---|
| **System Recovery Master Plan** | Directly supports Phase 6 deliverable #2 (Environment Parity Report) and exit criteria EC-1, EC-2, EC-3. |
| **Phase 6 roadmap** | Follows `CURRENT_TASK-035` closure recommendation to execute pending `DV-01`, `DV-03`, `DV-04`, `PV-01`, and `PV-04` checks against Staging. |
| **Operational Trust** | Live validation of canonical migration application, artifact reproducibility, and RPC surface parity in a clean environment. |
| **Environment Parity** | Confirms that the canonical chain and derived artifacts behave identically when applied to the designated Staging environment. |

---

## 4. Authorized Objective

Execute the remaining live `D-034-01` Deployment Validation Gate activities against the designated Phase 6 Staging environment and produce an **Environment Parity Report** that:

- Applies the canonical migration chain deterministically to the Staging environment.
- Regenerates `supabase/schema.sql` and `supabase/generated/database.types.ts` from the freshly applied canonical chain.
- Compares the regenerated artifacts against the reference checksums captured in `D-035-01` §6.1.
- Completes a signed `D-034-02_Deployment_Validation_Evidence_Checklist.md` for Staging.
- Records the A9 deferred exception without resolving it.
- Produces `D-P6-02_Environment_Parity_Report.md` as the primary deliverable.

---

## 5. Authorized Scope

### In Scope

- Supabase MCP access to the **Staging environment only** (`shbmzvfcenbybvyzclem` per `D-035-01` §3).
- Execution of `D-034-01` gate checks that were `PENDING` in `D-035-01` (`DV-01`, `DV-03`, `DV-04`, `PV-01`, `PV-04`).
- Application of the existing canonical migration chain to Staging.
- Regeneration of `schema.sql` and `database.types.ts` from the applied canonical chain in Staging.
- Comparison of regenerated artifacts against the reference `D-035-01` §6.1 checksums.
- RPC surface parity check (`PV-02`, `PV-03`) against `D-P3-01_Reconciled_RPC_Contract.md`.
- Completion and signing of `D-034-02` for Staging.
- Production of `D-P6-02_Environment_Parity_Report.md`.
- Recording the deferred A9 exception as a known non-blocking observation.

### Out of Scope

- **Production access, deployment, migration, or schema modification.**
- Resolving, creating, or waiving the A9 deferred canonical migration.
- Modifying the canonical migration chain, service code, tests, or runtime configuration.
- Operational runbook updates (reserved for `D-P6-03`).
- Deployment Readiness Evidence (already produced as `D-035-01`).
- Feature-flag wiring, feature implementation, architecture redesign, or unrelated bug fixes.
- Any engineering execution before `CURRENT_TASK-036_ENGINEERING_KICKOFF` is accepted.

---

## 6. Deliverables

| # | Deliverable | Purpose | Acceptance Authority |
|---|---|---|---|
| D-P6-02 | **Environment Parity Report** (`D-P6-02_Environment_Parity_Report.md`) | Evidence that the canonical migration chain and derived artifacts are reproducible in Staging and that the Staging RPC surface matches the reconciled contract. | Program Manager, with Architecture Authority input |

Supporting artifacts:

- Completed `D-034-02_Deployment_Validation_Evidence_Checklist.md` for Staging.
- Regenerated `schema.sql` and `database.types.ts` artifacts and diff reports against the `D-035-01` reference checksums.
- Migration application log and post-deployment schema snapshot.
- RPC inventory and contract-parity evidence.
- Exception register entries for A9 and any other observations.

---

## 7. Dependencies

- `PHASE6_OPENING_AUTHORIZATION.md` issued and Phase 6 active.
- `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md` — `CURRENT_TASK-035` formally closed with observations.
- `D-034-01_Deployment_Validation_Gate_Definition.md` available; formal Program Manager and Architecture Authority sign-offs are required before operational gate execution.
- `D-034-02_Deployment_Validation_Evidence_Checklist.md` available for recording evidence.
- `D-035-01_Deployment_Readiness_Evidence.md` accepted as the reference baseline.
- `PHASE5_FINAL_CERTIFICATION.md`, `PHASE2_FINAL_CERTIFICATION.md`, and `PHASE4_FINAL_CERTIFICATION.md` — canonical chain, generated artifacts, and RPC contract accepted.
- `D-P3-01_Reconciled_RPC_Contract.md` accepted.
- Supabase Staging environment accessible through approved Supabase MCP credentials; Production access is **not** authorized.

---

## 8. Risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | A9 deferred migration causes the migration application to fail or the gate to report an exception. | High | Record A9 as a known exception; do not create or waive it under this task; escalate to Architecture Authority if it blocks application. |
| 2 | Staging environment is not clean or unavailable. | High | Confirm Staging state and credentials during Engineering Kickoff; do not begin gate execution until a clean validation environment is confirmed. |
| 3 | Regenerated artifacts differ from `D-035-01` reference checksums. | Medium | Document the diff as a non-conformance; escalate to Architecture Authority before overriding reference artifacts. Do not patch derived artifacts by hand. |
| 4 | `D-034-01` formal sign-offs are not completed before operational gate execution. | Medium | Obtain Program Manager and Architecture Authority acknowledgment as an Engineering Kickoff entry criterion. |
| 5 | Supabase MCP access is misrouted to Production. | High | Use Staging project identifier only (`shbmzvfcenbybvyzclem`); block any Production connection attempt. |
| 6 | Evidence collection is conflated with A9 disposition or runbook updates. | Medium | Strictly limit deliverables to `D-P6-02` and `D-034-02` for Staging; defer A9 and runbooks to their respective authorized tasks. |

---

## 9. Constraints

- Supabase MCP access is **limited to Staging only**. Production is explicitly out of scope and must not be accessed.
- This task is strictly **evidence collection, regeneration, and reporting**; it may not modify canonical sources or derived artifacts.
- No source code, migration, test, or runtime configuration changes are permitted except the application of existing canonical migrations to Staging.
- The `D-034-01` gate definition and `D-034-02` checklist must be used without deviation.
- A9 remains a recorded exception; its disposition belongs to a separate `CURRENT_TASK` under Architecture Authority.
- Scope expansion requires Program Sponsor approval with Architecture Authority input.
- Evidence must reference only accepted canonical or derived artifacts from prior phases.
- No deployment or promotion of any environment is authorized under this task.

---

## 10. Assumptions

- `D-034-01` and `D-034-02` will be formally signed by the Program Manager and Architecture Authority before operational gate execution.
- The canonical migration chain can be applied deterministically to Staging.
- The engineering team has Supabase MCP access to Staging only and can regenerate `schema.sql` and `database.types.ts` there.
- The A9 deferred canonical migration is the only known exception at the start of this task.
- `D-035-01` reference checksums are the accepted baseline for parity comparison.

---

## 11. Decision

| Decision | Rationale |
|---|---|
| **AUTHORIZED WITH CONSTRAINTS** | `CURRENT_TASK-036` is the next Phase 6 work unit recommended by `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md` §11. It directly addresses the pending live-environment `D-034-01` checks that `CURRENT_TASK-035` could not execute. Phase 6 is active, the reference baseline (`D-035-01`) is accepted, and the Staging environment is the only authorized target. The constraints are necessary because `D-034-01` formal sign-offs have not yet been captured and because the authorization is governance-only; no Supabase access or implementation may occur until Engineering Kickoff is accepted. |

### Evidence Supporting the Decision

| Evidence | Source | Finding |
|---|---|---|
| Phase 6 active | `CURRENT_PHASE.md` §1; `PHASE6_OPENING_AUTHORIZATION.md` §8 | Phase 6 opened 2026-07-18 |
| Prior task closed | `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md` §10 | `CURRENT_TASK-035` closed with observations |
| Recommended next task | `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md` §11 | `CURRENT_TASK-036 — Environment Parity Report` recommended |
| Reference baseline | `D-035-01_Deployment_Readiness_Evidence.md` §6.1 | Reference `schema.sql` and `database.types.ts` checksums recorded; RPC parity verified statically |
| Pending live checks | `D-035-01` §8 and §10 | `DV-01`, `DV-03`, `DV-04`, `PV-01`, `PV-04` pending staging execution |
| Staging target | `D-035-01` §3 | `shbmzvfcenbybvyzclem` identified as designated Staging environment |
| Gate definition | `D-034-01_Deployment_Validation_Gate_Definition.md` | Gate checks and pass/fail criteria defined; sign-offs pending |
| Checklist template | `D-034-02_Deployment_Validation_Evidence_Checklist.md` | Available for per-environment completion |
| A9 exception | `PHASE6_OPENING_AUTHORIZATION.md` §6; `D-035-01` §9 | Deferred, not blocking this authorization |
| Out-of-scope controls | `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §5; `CURRENT_PHASE.md` §5 | Feature work, architecture redesign, and production deployment are excluded |

---

## 12. Explicitly Prohibited Activities

This authorization does **not** authorize:

- Connecting to or modifying the Production environment.
- Implementing `CURRENT_TASK-036` before Engineering Kickoff is accepted.
- Resolving, creating, or waiving the A9 canonical migration.
- Modifying canonical sources, service code, tests, migrations, or runtime configuration.
- Promoting Staging or any other environment.
- Any activity outside the authorized Staging-only Supabase MCP scope.

---

## 13. Next Step

`CURRENT_TASK-036` may proceed to **Engineering Kickoff**. No implementation, Supabase access, or deployment activity may begin until `CURRENT_TASK-036_ENGINEERING_KICKOFF` is completed and accepted by the Engineering Authority.

---

## 14. Sign-off

| Role | Name | Signature / Acknowledgment | Date |
|---|---|---|---|
| Independent Program Governance Authority | *(as named in `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9)* | AUTHORIZED WITH CONSTRAINTS | 2026-07-18 |
| Program Manager | *(as named in `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9)* | *(pending Engineering Kickoff acceptance)* | |
| Architecture Authority | *(as named in `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9)* | *(pending gate-definition sign-off)* | |

---

*Basis: `SYSTEM_RECOVERY_PROGRAM_CHARTER.md`; `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 6 and §7; `CURRENT_PHASE.md`; `UNIFIED_PROGRAM_STATE.md`; `PHASE6_OPENING_AUTHORIZATION.md`; `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md`; `D-034-01_Deployment_Validation_Gate_Definition.md`; `D-034-02_Deployment_Validation_Evidence_Checklist.md`; `D-035-01_Deployment_Readiness_Evidence.md`.*
