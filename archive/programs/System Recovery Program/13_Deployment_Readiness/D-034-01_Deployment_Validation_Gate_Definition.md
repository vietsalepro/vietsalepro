# D-034-01 — Deployment Validation Gate Definition

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 6 — Operational Trust & Deployment Readiness  
**Task:** CURRENT_TASK-034 — Deployment Validation Gate Definition  
**Document Type:** Phase 6 Deliverable — Gate Definition  
**Version:** 1.0  
**Date:** 2026-07-18  
**Status:** APPROVED  
**Approval Date:** 2026-07-18  
**Program Manager:** APPROVED  
**Architecture Authority:** APPROVED  

---

## 1. Executive Summary

The Deployment Validation Gate is the operational gate that protects the Single Source of Truth restored in Phases 2 through 4 by preventing any environment from being considered *current* unless it is demonstrably consistent with the canonical migration chain, the generated schema and type artifacts derived from that chain, and the reconciled RPC contract. This document defines the gate's inputs, checks, outputs, success conditions, failure conditions, and exception handling. It does not execute the gate, modify the canonical source, or disposition the deferred A9 canonical migration observation.

---

## 2. Purpose

The purpose of this gate is to establish an unambiguous, repeatable decision rule for environment promotion in Phase 6. Before any designated environment is considered current, the gate shall confirm that:

1. The canonical migration chain applies deterministically to the target environment.
2. The schema and type artifacts generated from the canonical chain are reproducible in the target environment.
3. The RPC surface available in the target environment matches the reconciled RPC contract defined in `D-P3-01_Reconciled_RPC_Contract.md`.
4. Known exceptions — specifically the deferred A9 canonical migration — are recorded and dispositioned through the appropriate Architecture Authority process, not hidden or waived by the gate.

---

## 3. Scope

### In Scope

- Pre-deployment, during-deployment, and post-deployment contract-parity checks.
- Validation of the canonical migration chain, generated schema artifact, generated type artifacts, and reconciled RPC contract against the deployed environment.
- Definition of the evidence artifacts required to support each gate check.
- Pass, fail, and exception conditions for the gate.
- Treatment of the deferred A9 canonical migration as an external exception.

### Out of Scope

- Execution of the gate against any environment.
- Modification of source code, migrations, tests, runtime configuration, or deployment configuration.
- Creation, waiver, or resolution of the A9 canonical migration.
- Business-logic, feature-flag, UI, or performance validation.
- Operational runbook updates, environment parity reporting, or deployment readiness evidence collection.

---

## 4. Objectives

| # | Objective | Measurement |
|---|---|---|
| O-1 | The gate prevents promotion of any environment that depends on a non-canonical schema or RPC source. | A fail result is returned when the environment diverges from the canonical migration chain or reconciled RPC contract. |
| O-2 | The gate ensures generated artifacts are reproducible from the canonical source. | `supabase/schema.sql` and `supabase/generated/database.types.ts` are identical to the artifacts regenerated from the canonical chain in the target environment. |
| O-3 | The gate confirms RPC surface parity before an environment is considered current. | Every RPC in `D-P3-01_Reconciled_RPC_Contract.md` is present in the target environment; no extraneous RPC is required for parity. |
| O-4 | The gate records, but does not resolve, the A9 deferred observation. | A9 is annotated as a known exception with a reference to the separate `CURRENT_TASK` that will disposition it. |
| O-5 | The gate produces an auditable evidence package for every execution. | A completed `D-034-02_Deployment_Validation_Evidence_Checklist.md` and signed gate result report exist for each deployment. |

---

## 5. Referenced Canonical Sources

| Source | Role in the Gate |
|---|---|
| `D-P2-01_Canonical_Migration_Chain_Definition.md` | Defines the ordered, gapless canonical migration chain that is the only source of schema and RPC truth. |
| `supabase/migrations/` directory | Contains the ordered migration files that constitute the canonical chain. |
| `supabase/schema.sql` | Accepted generated schema artifact derived from the canonical migration chain. |
| `supabase/generated/database.types.ts` | Accepted generated type artifact derived from the canonical migration chain. |
| `D-P3-01_Reconciled_RPC_Contract.md` | Defines the expected RPC surface for contract-parity checks. |
| `PHASE4_FINAL_CERTIFICATION.md` | Records the accepted test and audit realignment that validates the contract. |
| `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 6 | Defines Phase 6 purpose, scope, deliverables, and exit criteria. |
| `SYSTEM_RECOVERY_MASTER_PLAN.md` §7 Operational Trust Gate | Defines the high-level pass/fail criteria and evidence required for operational trust. |
| `CURRENT_PHASE.md` §4 and §7 | Defines Phase 6 success criteria, quality gates, and constraints. |
| `CURRENT_TASK-034_PROGRAM_AUTHORIZATION.md` §4 | Defines the acceptance criteria for the gate definition. |
| `CURRENT_TASK-034_ENGINEERING_KICKOFF.md` §6 and §8 | Defines the deliverable plan and evidence requirements. |

---

## 6. Roles and Responsibilities

| Role | Responsibility | Authority |
|---|---|---|
| Gate Executor | Runs the gate checks, collects evidence, and completes `D-034-02`. | Records observed results; may not override fail criteria. |
| Gate Reviewer | Independently reviews the completed checklist, evidence artifacts, and gate result. | Confirms completeness and consistency; may request re-execution. |
| Gate Approver (Program Manager) | Accepts or rejects the gate result and the promotion recommendation. | Final decision authority for gate pass/fail, except A9 disposition. |
| Architecture Authority | Provides required input on canonical-source and RPC-contract interpretation; approves A9 disposition. | Final authority on canonical-source, migration ordering, RPC naming, and A9 exceptions. |
| Engineering Team | Prepares the gate execution environment and supplies the canonical artifacts. | No authority to alter gate criteria or waive failures. |

---

## 7. Gate Inputs

| Input | Source | Purpose |
|---|---|---|
| Target environment identifier | Deployment request | Names the environment being validated. |
| Canonical migration chain | `D-P2-01_Canonical_Migration_Chain_Definition.md`; `supabase/migrations/` | Baseline for schema and RPC truth. |
| Generated schema artifact | `supabase/schema.sql` | Reference schema snapshot for parity comparison. |
| Generated type artifacts | `supabase/generated/database.types.ts` | Reference type snapshot for parity comparison. |
| Reconciled RPC contract | `D-P3-01_Reconciled_RPC_Contract.md` | Expected RPC names, signatures, and ownership. |
| Prior accepted gate result | `D-034-02` archive | Establishes the last known-current state for rollback reference. |
| A9 exception register | `PHASE6_READINESS_AUTHORIZATION.md` §6; `PHASE6_OPENING_AUTHORIZATION.md` §6 | Records the deferred A9 observation status. |
| Deployment rollback plan | Operational runbook | Required before any deployment that may alter the target environment. |

---

## 8. Gate Outputs

| Output | Owner | Disposition |
|---|---|---|
| Completed `D-034-02_Deployment_Validation_Evidence_Checklist.md` | Gate Executor | Stored with the deployment record. |
| Gate Result Report | Gate Executor | States PASS, PASS WITH OBSERVATIONS, or FAIL with rationale. |
| Promotion recommendation | Gate Approver | APPROVE or DENY environment currentness. |
| Exception register entry | Gate Executor | Records any A9 or other Architecture Authority exception. |
| Non-conformance report | Gate Reviewer | Raised for any check that fails; triggers rollback or remediation. |

---

## 9. Pre-Deployment Validation

The gate shall not proceed to deployment unless the following pre-conditions are satisfied:

| PD-01 | The target environment is one of the designated Phase 6 validation environments identified in `CURRENT_PHASE.md` §3. |
| PD-02 | The canonical migration chain has not changed since the last accepted baseline without an accompanying accepted `D-034-02`. |
| PD-03 | The rollback plan is available and references the canonical source. |
| PD-04 | The A9 deferred observation status is recorded in the exception register. |
| PD-05 | The generated schema and type artifacts in the repository match the accepted artifacts from `PHASE2_FINAL_CERTIFICATION.md` or its equivalent accepted baseline. |

**Evidence required:** Environment designation record, baseline manifest, rollback plan, A9 exception register entry, artifact checksum manifest.

---

## 10. Deployment Validation

During deployment, the gate shall observe or perform the following checks:

| DV-01 | The canonical migration chain is applied to the target environment in the exact order defined in `D-P2-01_Canonical_Migration_Chain_Definition.md`. |
| DV-02 | No ordering errors, duplicate migrations, or skipped migrations occur. |
| DV-03 | The generated schema artifact is regenerated from the applied canonical chain and compared byte-for-byte against `supabase/schema.sql`. |
| DV-04 | The generated type artifacts are regenerated from the applied canonical chain and compared against `supabase/generated/database.types.ts`. |
| DV-05 | Any divergence from the reference artifacts is documented as a non-conformance. |

**Evidence required:** Migration application log, generated artifact checksums, diff report, non-conformance log.

---

## 11. Post-Deployment Validation

After deployment completes, the gate shall confirm:

| PV-01 | The target environment schema snapshot is identical to the reference `supabase/schema.sql`, except for documented Architecture Authority exceptions. |
| PV-02 | The RPC surface in the target environment contains every RPC listed in `D-P3-01_Reconciled_RPC_Contract.md`. |
| PV-03 | No RPC exists in the target environment that is not defined in the canonical migration chain or `D-P3-01_Reconciled_RPC_Contract.md`. |
| PV-04 | The regenerated `database.types.ts` in the target environment is identical to `supabase/generated/database.types.ts`, except for documented Architecture Authority exceptions. |
| PV-05 | The A9 deferred observation is annotated in `D-034-02` and does not block the gate unless it has been dispositioned otherwise by a separate `CURRENT_TASK`. |
| PV-06 | A promotion recommendation is recorded in the Gate Result Report. |

**Evidence required:** Post-deployment schema snapshot, RPC surface inventory, type artifact checksum, `D-034-02` completed checklist, Gate Result Report.

---

## 12. Contract Parity Rules

1. The canonical migration chain is the only acceptable source of schema and RPC truth.
2. Any schema object or RPC function present in the target environment must be defined by a migration in the canonical chain.
3. Every RPC invoked by the service layer and listed in `D-P3-01_Reconciled_RPC_Contract.md` must be present in the target environment.
4. Signature drift between `D-P3-01_Reconciled_RPC_Contract.md` and the target environment is a contract-parity failure unless an Architecture Authority exception is recorded.
5. No markdown document, test mock, or governance artifact may override the canonical migration chain for parity decisions.

---

## 13. Generated Artifact Validation

1. `supabase/schema.sql` shall be treated as the reference schema artifact.
2. `supabase/generated/database.types.ts` shall be treated as the reference type artifact.
3. Both artifacts must be reproducible by applying the canonical migration chain to a clean database and running the approved generation tooling.
4. Any difference between the reference artifacts and the artifacts regenerated in the target environment is a non-conformance, not a source of truth override.
5. The evidence checklist shall record the checksums or equivalent deterministic identifiers for both reference and regenerated artifacts.

---

## 14. RPC Validation

1. The expected RPC set is the union of RPCs defined in the canonical migration chain and explicitly reconciled in `D-P3-01_Reconciled_RPC_Contract.md`.
2. The gate shall verify presence, not business behavior: an RPC must exist with the name, argument types, and return type defined in the contract.
3. Missing RPCs are a fail condition unless covered by a documented Architecture Authority exception.
4. Extraneous RPCs that are not in the canonical chain or contract are a fail condition unless covered by a documented Architecture Authority exception.
5. The A9 missing migration is not an RPC; its absence shall be recorded as an exception, not an RPC contract failure.

---

## 15. Evidence Requirements

| Phase | Required Evidence | Storage Requirement |
|---|---|---|
| Pre-deployment | Environment designation, baseline manifest, rollback plan, A9 exception register | Deployment record |
| During-deployment | Migration application log, artifact checksums, diff reports, non-conformance log | Deployment record |
| Post-deployment | Schema snapshot, RPC inventory, type artifact checksum, completed `D-034-02`, Gate Result Report | Deployment record and program evidence archive |

---

## 16. Pass Criteria

The gate passes when all of the following are true:

1. Every pre-deployment check PD-01 through PD-05 is satisfied.
2. Every during-deployment check DV-01 through DV-05 is satisfied or its non-conformance is covered by an approved Architecture Authority exception.
3. Every post-deployment check PV-01 through PV-06 is satisfied or its non-conformance is covered by an approved Architecture Authority exception.
4. The A9 deferred observation is recorded as an exception; the gate does not treat A9 as resolved.
5. The completed `D-034-02` is signed by the Gate Executor and Gate Reviewer.
6. The Gate Approver records an APPROVE decision.

---

## 17. Fail Criteria

The gate fails when any of the following occur:

1. The canonical migration chain cannot be applied deterministically to the target environment.
2. An ordering error, duplicate migration, or skipped migration is detected.
3. The regenerated schema or type artifacts differ from the reference artifacts without an approved Architecture Authority exception.
4. Any RPC listed in `D-P3-01_Reconciled_RPC_Contract.md` is missing from the target environment without an approved exception.
5. Any RPC in the target environment is not defined in the canonical migration chain or `D-P3-01_Reconciled_RPC_Contract.md` without an approved exception.
6. The A9 exception status is undocumented or misrepresented as resolved.
7. The completed `D-034-02` is incomplete, unsigned, or contains unresolved non-conformances.

---

## 18. Exception Criteria

1. The only pre-approved known exception is the deferred A9 canonical migration.
2. Any additional exception requires a written Architecture Authority decision and a matching entry in the exception register.
3. An exception may reduce the gate result to **PASS WITH OBSERVATIONS** but may not convert a contract-parity failure into a full PASS unless the failure is separately dispositioned by the Architecture Authority.
4. Exceptions are not waivers; they are recorded, traceable conditions that must be resolved before program closure unless explicitly accepted by the Program Sponsor.

---

## 19. Treatment of A9 Deferred Observation

1. A9 refers to the missing canonical migration `20260724000000_sp4_4_webhook_delivery_hardening.sql` identified in `PHASE6_READINESS_AUTHORIZATION.md` §6 and `PHASE6_OPENING_AUTHORIZATION.md` §6.
2. This gate definition recognizes A9 as an external, unresolved exception.
3. The gate shall record A9 in `D-034-02` under the A9 Annotation field for every execution.
4. The gate shall not create, waive, or otherwise disposition A9.
5. If A9 remains unresolved, the gate result may be **PASS WITH OBSERVATIONS** provided all other pass criteria are met and the A9 Annotation is complete; it may not be a full **PASS** until A9 is dispositioned by a separate `CURRENT_TASK` under Architecture Authority.
6. A9 is not an RPC; RPC validation shall not treat A9 as a missing or extra RPC.

---

## 20. Evidence Retention

1. All gate evidence shall be retained for the duration of Phase 6 and for one full phase after program closure.
2. Evidence includes completed checklists, logs, manifests, diff reports, exception register entries, and Gate Result Reports.
3. Evidence shall be stored in the program evidence archive and referenced by deployment identifier.
4. No gate evidence may be altered after acceptance; errors are corrected by a new execution with a new `D-034-02`.

---

## 21. Traceability

| Gate Element | Phase 6 Objective | Phase 6 Deliverable | Phase 6 Exit Criterion | Operational Trust Gate Criterion |
|---|---|---|---|---|
| Gate Purpose (§2) | Ensure canonical migration chain applies deterministically to any environment | D-P6-04 — Deployment Validation Gate Definition | EC-3: Deployment validation gate confirms contract parity before any environment is considered current | Purpose: ensure system can be deployed with confidence in canonical contract |
| Pre-Deployment Validation (§9) | Operational processes reinforce canonical source | D-P6-04 | EC-3 | Evidence: deployment readiness from non-production environment |
| Deployment Validation (§10) | Deployment process validation against canonical migration chain | D-P6-04 | EC-1: Canonical migration chain applies deterministically; EC-3 | Pass: canonical migration chain applies deterministically |
| Post-Deployment Validation (§11) | Environment parity for migrations, generated types, and schema artifacts | D-P6-04 | EC-2: Generated artifacts reproducible; EC-3 | Pass: generated artifacts reproducible across environments |
| Contract Parity Rules (§12) | Restore RPC contract consistency | D-P6-04 | EC-3 | Pass: CI fails on divergence from canonical source |
| Generated Artifact Validation (§13) | Environment parity for migrations, generated types, and schema artifacts | D-P6-04 | EC-2 | Pass: generated artifacts reproducible across environments |
| RPC Validation (§14) | Restore RPC contract consistency | D-P6-04 | EC-3 | Pass: CI fails on divergence from canonical source |
| A9 Treatment (§19) | Resolution of deferred A9 canonical migration decision under Architecture Authority guidance | D-P6-04 | EC-3 (with A9 as known exception) | Evidence: documented exception accepted by Architecture Authority |
| Evidence Retention (§20) | Operational processes reference canonical source and evidence | D-P6-04 | EC-3 | Evidence: operational runbook references canonical artifacts |

---

## 22. Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-07-18 | Engineering Implementation Lead | Initial Deployment Validation Gate Definition produced under `CURRENT_TASK-034`. |
