# Phase 2 Governance Baseline

**Program:** VietSalePro v7 — System Recovery Program  
**Task ID:** SRP-P2-T003  
**Phase:** Phase 2 — Canonical Migration Chain Stabilization  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Proposed — Pending Program Manager Approval  
**Document Type:** Program governance baseline  

---

## 1. Purpose

This document establishes the governance baseline that controls how Phase 2 deliverables are produced, accepted, and tracked. It defines the acceptance framework, evidence standards, quality gates, and scope-control rules required before any Phase 2 engineering `CURRENT_TASK` is authorized.

Decision authority, escalation paths, and communication protocol are **not redefined** here; they are applied from `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9 and `DECISION_AND_ESCALATION_LOG.md` §2–§3.

---

## 2. Scope

This baseline applies to all Phase 2 deliverables defined in `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 "Recovery Phases — Phase 2 — Deliverables":

1. Canonical Migration Chain Definition
2. Orphan SQL Triage Record
3. Generated Schema Artifact
4. Generated Type Artifacts
5. Migration Naming & Ordering Standard

### 2.1 In Scope

- Acceptance criteria for each Phase 2 deliverable.
- Evidence standards derived from the Charter and Master Plan.
- Quality gates required for Phase 2 exit.
- Scope-control rules and exception procedure for Phase 2.
- Reference to existing decision/escalation authority and communication protocol.

### 2.2 Out of Scope

- Phase 1 exit re-verification.
- Phase 2 entry re-verification or re-activation.
- Modification of `CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md`, or any other phase marker.
- Writing, modifying, or reordering migration SQL files.
- Generating `schema.sql`, TypeScript types, or any derived artifact.
- Reconciling RPC contracts, service code, tests, or documentation.
- Creating implementation work packages or engineering task lists.

---

## 3. Acceptance Framework

### 3.1 Canonical Migration Chain Definition

| Aspect | Requirement |
|---|---|
| Purpose | Establish a single, ordered, gapless migration chain as the canonical source for the database contract. |
| Acceptance Criteria | One ordered chain exists; no gaps that prevent real-timestamp hotfixes; every file in the chain has a deterministic, ordered name; orphan files are either absorbed, triaged, or explicitly excluded. |
| Required Evidence | Migration inventory; chain ordering table; gap analysis; staging-environment application log. |
| Approving Authority | Program Manager, with architecture authority input |

### 3.2 Orphan SQL Triage Record

| Aspect | Requirement |
|---|---|
| Purpose | Account for every SQL file outside the canonical chain so that none is treated as schema authority. |
| Acceptance Criteria | Every orphan file is classified (absorb into chain, deprecate, delete, or keep as reference-only); no orphan file remains as undocumented source of truth; triage rationale is recorded. |
| Required Evidence | Orphan-file inventory; classification per file; disposition log; references to any absorbed orphans. |
| Approving Authority | Program Manager, with architecture authority input |

### 3.3 Generated Schema Artifact

| Aspect | Requirement |
|---|---|
| Purpose | Produce a canonical, generated schema artifact derived from the migration chain. |
| Acceptance Criteria | `schema.sql` (or equivalent) exists; byte-for-byte reproducible from the canonical chain when regenerated; matches the canonical chain on clean environment application. |
| Required Evidence | Generation script or command; reproducibility check; diff against applied schema; CI or manual reproducibility report. |
| Approving Authority | Architecture Authority |

### 3.4 Generated Type Artifacts

| Aspect | Requirement |
|---|---|
| Purpose | Produce type artifacts generated from the canonical schema artifact. |
| Acceptance Criteria | Generated types exist; derived from the canonical schema artifact, not hand-edited; reproducible from the canonical source. |
| Required Evidence | Generation command; source-to-artifact trace; reproducibility check; no hand-edited type files. |
| Approving Authority | Architecture Authority |

### 3.5 Migration Naming & Ordering Standard

| Aspect | Requirement |
|---|---|
| Purpose | Document enforceable rules for naming and ordering future migrations. |
| Acceptance Criteria | Standard exists in writing; covers timestamp format, file naming, ordering semantics, hotfix handling, and rollback notation; accepted by Program Manager and acknowledged by engineering. |
| Required Evidence | Published standard document; review acknowledgment; checklist or lint rule reference if available. |
| Approving Authority | Program Manager, with architecture authority input |

---

## 4. Evidence Standards

All Phase 2 deliverables must satisfy the following evidence standards, derived from `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §6 Guiding Principles and §8 Success Criteria, and from `SYSTEM_RECOVERY_MASTER_PLAN.md` §2 Execution Strategy and §4 Phase 2 Exit Criteria:

1. **Canonical source first.** Evidence must trace back to the ordered migration chain, not to a derived document, test mock, or governance artifact.
2. **Reproducibility.** Any generated artifact must be byte-for-byte reproducible when regenerated from the canonical source in a clean environment.
3. **No manual synchronization.** Evidence of generation must come from tooling, not from hand-edited copies.
4. **Evidence before assumptions.** Every claim of completion or consistency must be supported by direct evidence from the canonical migration source.
5. **Auditability.** Evidence must be reviewable by an independent party and must reference the specific migration files, commands, and environments used.

---

## 5. Quality Gates

Phase 2 engineering work may not be authorized until the following quality gates are satisfied, derived from `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 2 Exit Criteria and §7 Quality Gates:

| Gate | Criterion | Evidence Required |
|---|---|---|
| QG-P2-01 | Single ordered migration chain exists with no gaps that prevent real-timestamp hotfixes. | Chain inventory and gap analysis. |
| QG-P2-02 | No SQL file outside the canonical chain is treated as a source of schema or RPC truth. | Orphan SQL Triage Record and disposition log. |
| QG-P2-03 | A generated schema artifact exists and matches the canonical chain. | `schema.sql` (or equivalent) and reproducibility check. |
| QG-P2-04 | Generated type artifacts exist and are derived from the canonical schema artifact. | Type generation trace and reproducibility check. |
| QG-P2-05 | Naming and ordering rules are documented and enforceable for future migrations. | Migration Naming & Ordering Standard, acknowledged by engineering. |

---

## 6. Scope-Control Rules

1. **No engineering work without authorization.** No code changes, migration changes, generated artifacts, or engineering planning may be performed under this baseline. A subsequent approved `CURRENT_TASK` is required before any Phase 2 engineering work begins.
2. **No scope expansion.** Phase 2 is limited to canonical migration chain stabilization as defined in `SYSTEM_RECOVERY_MASTER_PLAN.md` §4. Requests to expand into feature development, architecture redesign, UI changes, operational deployment, or later phases are out of scope.
3. **No duplicate contracts.** No derived document, test mock, or governance artifact may be promoted to canonical status without architecture authority approval.
4. **No competing status sources.** All status reporting for Phase 2 must reference `UNIFIED_PROGRAM_STATE.md` and this baseline.
5. **Phase markers are read-only.** `CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md`, and other phase markers are not modified by this task.

---

## 7. Exception Procedure

Any exception to Phase 2 scope or to the evidence standards in this baseline requires:

1. A written exception request identifying the deviation, rationale, and impact on the canonical migration chain.
2. Assessment by the Program Manager against `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §4 and §5.
3. Architecture authority input if the exception touches canonical sources, migration ordering, RPC naming, generated artifacts, or contract boundaries.
4. Approval by the Program Sponsor before the exception is effective.
5. Recording of the approved exception in `DECISION_AND_ESCALATION_LOG.md`.

Unapproved deviations are out of scope and must be escalated per `DECISION_AND_ESCALATION_LOG.md` §3.

---

## 8. Decision Authority and Escalation

Decision authority, required input, and escalation paths for Phase 2 deliverables are applied from:

- `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9 (Program Governance)
- `DECISION_AND_ESCALATION_LOG.md` §2 (Decision Authority Framework)
- `DECISION_AND_ESCALATION_LOG.md` §3 (Escalation Framework)

These are not redefined in this baseline. Key references:

| Matter | Authority | Required Input |
|---|---|---|
| Phase 2 deliverable acceptance | Program Manager | Architecture Authority for technical deliverables |
| Canonical source, migration ordering, generated artifacts | Architecture Authority | Program Manager for impact assessment |
| Scope expansion or out-of-scope boundary dispute | Program Sponsor | Architecture Authority for contract impact |

---

## 9. Communication Protocol

Status reporting, exception requests, and completion notices for Phase 2 must follow the communication protocol referenced in `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9 and `DECISION_AND_ESCALATION_LOG.md` §3. All Phase 2 status reports must reference `UNIFIED_PROGRAM_STATE.md` and this baseline.

---

## 10. Prohibition on Engineering Work

This baseline explicitly prohibits any engineering work, code change, migration change, generated artifact production, or engineering planning until a subsequent approved `CURRENT_TASK` explicitly authorizes it. This baseline is a governance control document only.

---

## 11. References

- `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §3, §6, §8, §9, §10
- `SYSTEM_RECOVERY_MASTER_PLAN.md` §2, §3, §4 Phase 2, §6, §7
- `CURRENT_PHASE.md` §1–§9
- `UNIFIED_PROGRAM_STATE.md` §3, §7, §8, §9, §10
- `DECISION_AND_ESCALATION_LOG.md` §2, §3, §4
- `PHASE1_ACCEPTANCE_RECORD.md`

---

## 12. Acceptance

| Role | Name | Signature / Acknowledgment | Date |
|---|---|---|---|
| Program Manager | | Pending | 2026-07-14 |
| Architecture Authority | | Pending | 2026-07-14 |

This baseline is accepted when the Program Manager signs and the Architecture Authority acknowledges.
