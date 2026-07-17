# CURRENT_TASK.md

**Task ID:** SRP-P2-T005  
**Title:** Canonical Migration Chain Definition Standard  
**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 2 — Canonical Migration Chain Stabilization  
**Status:** Closed — Superseded  
**Date:** 2026-07-14  
**Document Type:** Program governance task only

---

## 1. Objective

**Define the Canonical Migration Chain Definition Standard.**

This task produces the standard that governs how the **Canonical Migration Chain Definition** (D-P2-01) must be constructed, documented, and accepted. It does not create the actual migration chain, perform repository analysis, or produce any derived artifact. The standard ensures that any future definition of the canonical chain is deterministic, gapless, traceable, and consistent with the `MIGRATION_NAMING_AND_ORDERING_STANDARD.md` produced under SRP-P2-T004.

---

## 2. Scope

### 2.1 In Scope

- Define the required structure of the **Canonical Migration Chain Definition** document.
- Specify the mandatory sections of the definition (e.g., scope statement, chain inventory format, ordering table, gap-analysis criteria, orphan-file reference rules, evidence checklist).
- Define the acceptance framework for the definition, including evidence standards and approving authority.
- Define the authority and governance controls for creating, reviewing, and modifying the definition.
- Define scope boundaries that prevent the definition task from expanding into implementation, repository analysis, or engineering planning.
- Reference the applicable program governance documents and the `MIGRATION_NAMING_AND_ORDERING_STANDARD.md`.

### 2.2 Out of Scope

- Inventorying, reading, or analyzing migration files in the repository.
- Defining the actual ordered canonical migration chain from the current repository state.
- Performing gap analysis against existing migrations.
- Identifying, classifying, or dispositioning orphan SQL files.
- Writing, modifying, reordering, or deleting migration SQL files.
- Generating `schema.sql`, TypeScript types, or any derived artifact.
- Producing the Orphan SQL Triage Record, Generated Schema Artifact, or Generated Type Artifacts.
- Reconciling RPC contracts, service code, tests, or documentation.
- Creating implementation work packages, sprint plans, or engineering task lists.
- Feature development, bug fixing, architecture redesign, UI changes, or operational deployment.
- Any work expanding into Phase 3 or later phases.

---

## 3. Deliverables

| # | Deliverable | Purpose | Acceptance Authority |
|---|---|---|---|
| D-1 | **Canonical Migration Chain Definition Standard** | Defines the structure, content, acceptance framework, and governance controls required to produce and maintain the Canonical Migration Chain Definition. | Program Manager, with architecture authority input |

---

## 4. Acceptance Criteria

1. The **Canonical Migration Chain Definition Standard** document is produced and references `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §6 (Guiding Principles), §8 (Exit Criteria), §9 (Program Governance), and §10 (Program Constraints); `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 2; `PHASE2_GOVERNANCE_BASELINE.md`; and `MIGRATION_NAMING_AND_ORDERING_STANDARD.md`.
2. The standard specifies:
   - The required sections of a Canonical Migration Chain Definition.
   - The format for the migration inventory and ordered chain table.
   - The criteria for gap analysis and real-timestamp hotfix readiness.
   - The rules for referencing, but not duplicating, the Orphan SQL Triage Record.
   - The evidence required to accept the chain definition.
   - The authority and governance controls for changes to the definition.
3. The standard does not prescribe implementation tactics, tooling commands, sprint schedules, or repository-analysis procedures beyond what is necessary to express the rule.
4. No implementation, code change, migration change, generated artifact, repository analysis, or engineering planning document is produced under this task.
5. No scope expansion into implementation, deployment, or later phases is authorized.

---

## 5. Constraints

- This task is strictly program governance.
- No code, migration, schema, type, test, service, or documentation changes are permitted.
- No repository analysis, inventory, or migration-file inspection may be performed.
- No implementation planning, engineering work packages, or sprint plans may be created.
- `CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md`, and other phase markers are treated as read-only.
- All definitions must reference only the approved governance documents listed in **References**.
- Any exception to Phase 2 scope requires documented assessment and Program Sponsor approval.

---

## 6. References

- `MIGRATION_NAMING_AND_ORDERING_STANDARD.md` — timestamp format, naming convention, ordering, hotfix, and rollback rules.
- `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §3 (Program Objectives), §6 (Guiding Principles), §8 (Exit Criteria), §9 (Program Governance), §10 (Program Constraints).
- `SYSTEM_RECOVERY_MASTER_PLAN.md` §2 (Execution Strategy), §3 (Program Structure), §4 "Recovery Phases — Phase 2" (Purpose, Scope, Entry Criteria, Exit Criteria, Deliverables, Validation), §6 (Governance Model), §7 (Quality Gates).
- `PHASE2_GOVERNANCE_BASELINE.md` §3.1, §4, §5, §6, §7, §8.
- `PHASE2_DELIVERABLE_ACCEPTANCE_MATRIX.md`.
- `PHASE2_SCOPE_AND_EXCEPTION_CONTROL_NOTE.md`.
- `CURRENT_PHASE.md`.
- `UNIFIED_PROGRAM_STATE.md` §3, §7, §8, §9, §10.
- `DECISION_AND_ESCALATION_LOG.md` §2, §3.
- `PHASE1_ACCEPTANCE_RECORD.md`.

---

## 7. Closure / Supersession

- **Closure date:** 2026-07-17
- **Closure authority:** Program Manager / Program Governance Transition Review
- **Reason:** The task was proposed for Phase 2 but was never approved or activated. Phases 2, 3, and 4 have since been completed; Phase 4 is formally accepted and certified complete. The proposed Phase 2 task is therefore superseded by subsequent program progress and no longer represents active program work.
- **Replacement:** No replacement `CURRENT_TASK` is required at this transition point. Phase 4 work has been completed under its authorized Recovery Wave authorizations and `CURRENT_TASK` operational documents. A new `CURRENT_TASK` may only be created when Phase 5 is formally opened and a Phase 5 work unit is authorized.

## 8. Completion Statement

This task is **closed and superseded**, not accepted as a deliverable. No further action is required.
