# Canonical Migration Chain Definition Standard

**Program:** VietSalePro v7 — System Recovery Program  
**Task ID:** SRP-P2-T005  
**Phase:** Phase 2 — Canonical Migration Chain Stabilization  
**Version:** 1.0  
**Date:** 2026-07-14  
**Document Type:** Program governance standard  
**Status:** Proposed — Pending Program Manager Approval  

---

## 1. Purpose

This standard defines the required structure, mandatory sections, evidence framework, and governance controls for producing and maintaining the **Canonical Migration Chain Definition** (deliverable D-P2-01).

The purpose is to ensure that any Canonical Migration Chain Definition document is:

- **Deterministic:** the ordering and naming of every migration is unambiguous.
- **Gapless:** the ordered chain contains no discontinuities that would prevent safe insertion of real-timestamp hotfixes.
- **Traceable:** every migration in the chain can be traced back to a specific file and timestamp.
- **Consistent:** the definition aligns with the `MIGRATION_NAMING_AND_ORDERING_STANDARD.md` and the Phase 2 governance baseline.
- **Bounded:** the act of defining the chain does not expand into repository analysis, orphan triage, code changes, or engineering planning.

This standard does **not** create the actual Canonical Migration Chain Definition, does not inventory migration files, and does not perform gap analysis or orphan-file triage. It governs how that future definition must be constructed and accepted.

---

## 2. Scope

### 2.1 In Scope

This standard applies to the structure and governance of the **Canonical Migration Chain Definition** document (D-P2-01) and any subsequent revisions to that definition during Phase 2.

Specifically in scope:

- Required sections and document structure for the Canonical Migration Chain Definition.
- Format and contents of the migration inventory and ordered chain table.
- Gap-analysis criteria used to validate chain integrity.
- Rules for referencing the Orphan SQL Triage Record (D-P2-02) without duplicating it.
- Evidence required to accept the definition.
- Authority and change-control rules for the definition.
- Boundaries that prevent the definition task from expanding into implementation or engineering work.

### 2.2 Out of Scope

This standard explicitly does **not** authorize or describe:

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

## 3. Required Document Structure

A Canonical Migration Chain Definition document MUST contain the following top-level sections in the order listed below:

1. Header and Identification
2. Purpose and Scope
3. Chain Authority and Ownership
4. Canonical Migrations Directory Declaration
5. Migration Inventory
6. Ordered Chain Table
7. Gap Analysis
8. Hotfix Readiness Statement
9. Orphan-File Reference
10. Required Evidence
11. Acceptance Statement
12. Change Log

Each section is described in detail in **Section 4 — Mandatory Sections**. The document MUST be a single Markdown file. No appendices may override the main sections without being listed in the Change Log.

---

## 4. Mandatory Sections

### 4.1 Header and Identification

The definition MUST identify itself with:

| Field | Requirement |
|---|---|
| Program | VietSalePro v7 — System Recovery Program |
| Deliverable ID | D-P2-01 |
| Title | Canonical Migration Chain Definition |
| Phase | Phase 2 — Canonical Migration Chain Stabilization |
| Version | Semantic or integer version |
| Date | Date of last material change |
| Status | Draft / Proposed / Accepted |
| Authorizing CURRENT_TASK | Reference to the approved task that produced it |

### 4.2 Purpose and Scope

This section MUST state that the document defines the single, ordered, gapless migration chain accepted as the canonical source for the database contract. It MUST reiterate the boundaries: the definition records the chain; it does not perform repository analysis or modify files.

### 4.3 Chain Authority and Ownership

This section MUST record:

- The **Architecture Authority** as the owner of canonical-source decisions.
- The **Program Manager** as the acceptance authority for the definition.
- The **Engineering Team** as the executor of subsequent approved migration work.
- A statement that no derived document, generated artifact, or governance artifact may override the ordered migration chain without architecture authority approval.

### 4.4 Canonical Migrations Directory Declaration

This section MUST declare:

- The single canonical directory that contains all forward migrations.
- The declared rollback directory, if reverse files are kept separately.
- A statement that no other directory or file is part of the canonical chain unless explicitly absorbed through the Orphan SQL Triage Record.

The declaration MUST be consistent with `MIGRATION_NAMING_AND_ORDERING_STANDARD.md` §8.

### 4.5 Migration Inventory

The inventory MUST list every forward migration in the canonical chain with the following fields:

| Field | Description |
|---|---|
| File Name | Full file name in `<TIMESTAMP>_<SEMANTIC_SLUG>.sql` form |
| Timestamp | The 14-digit timestamp |
| Semantic Slug | Lower-case, snake_case purpose description |
| Reverse File | Corresponding `.reverse.sql` file name or explicit statement of irreversibility |
| Authority | Source of the migration (e.g., original, absorbed orphan, renamed hotfix) |
| Notes | Any exception, hotfix rationale, or dependency declaration |

The inventory MUST include only forward migrations. Reverse files MUST be listed as attributes of their corresponding forward migration, not as ordered chain entries.

### 4.6 Ordered Chain Table

The ordered chain table MUST present the forward migrations in ascending lexicographic order of full file name. It MUST contain:

- Sequence number.
- File name.
- Timestamp.
- Semantic slug.
- Predecessor file name (or `none` for the first migration).
- Successor file name (or `none` for the last migration).

This table is the authoritative statement of execution order.

### 4.7 Gap Analysis

This section MUST document the analysis used to confirm that the chain is gapless enough to support real-timestamp hotfixes. It MUST include:

- Definition of a "gap" as any missing timestamp sequence that would force a future hotfix to be assigned a non-real or non-unique timestamp.
- A statement of whether gaps exist.
- For each identified gap, a disposition: resolved by renumbering, resolved by reserved timestamp space, or accepted as a documented exception.
- Reference to the `MIGRATION_NAMING_AND_ORDERING_STANDARD.md` §5 and §6.

The gap analysis MUST NOT propose code or file changes; it records findings only.

### 4.8 Hotfix Readiness Statement

This section MUST state whether the chain, as defined, can accept a real-timestamp hotfix without renumbering existing migrations. If it cannot, the section MUST identify the specific constraint and reference any exception approved by the Program Manager.

### 4.9 Orphan-File Reference

This section MUST:

- State the total number of SQL files known to be outside the canonical chain at the time of definition.
- Reference the **Orphan SQL Triage Record** (D-P2-02) by file name and version.
- List any orphan files that have been absorbed into the canonical chain, with their original path and new canonical file name.
- Explicitly state that orphan files not listed as absorbed remain outside the canonical chain and are governed by the Orphan SQL Triage Record.

This section MUST NOT duplicate the classification or disposition rationale already recorded in D-P2-02.

### 4.10 Required Evidence

This section MUST enumerate the evidence that supports the definition. See **Section 5 — Required Evidence** for the mandatory evidence items.

### 4.11 Acceptance Statement

This section MUST record:

- Acceptance by the Program Manager.
- Acknowledgment by the Architecture Authority.
- Date of acceptance.
- Any conditions or reservations attached to acceptance.

### 4.12 Change Log

This section MUST record every material change to the definition after initial acceptance, including version, date, author, reason, and impact on chain ordering or evidence.

---

## 5. Required Evidence

The Canonical Migration Chain Definition MUST be supported by the following evidence:

| Evidence Item | Description | Source |
|---|---|---|
| E-1 Migration Inventory | A complete list of every forward migration in the canonical chain. | Canonical Migration Chain Definition §4.5 |
| E-2 Ordered Chain Table | The table showing forward migrations in ascending lexicographic order. | Canonical Migration Chain Definition §4.6 |
| E-3 Gap Analysis | Documentation confirming no gaps that prevent real-timestamp hotfixes, or approved exceptions. | Canonical Migration Chain Definition §4.7 |
| E-4 Staging-Environment Application Log | Evidence that the ordered chain applies deterministically to a clean environment. | Staging or designated validation environment |
| E-5 Naming and Ordering Compliance Statement | Confirmation that every file name conforms to `MIGRATION_NAMING_AND_ORDERING_STANDARD.md`. | Canonical Migration Chain Definition or automated check |
| E-6 Orphan-File Cross-Reference | Reference to D-P2-02 and list of absorbed orphans, if any. | Canonical Migration Chain Definition §4.9 |
| E-7 Authority Acknowledgment | Signed or recorded acknowledgment by the Architecture Authority. | Canonical Migration Chain Definition §4.11 |

All evidence MUST satisfy the evidence standards in `PHASE2_GOVERNANCE_BASELINE.md` §4:

1. Trace to the canonical migration chain.
2. Be reproducible in a clean environment.
3. Be produced by tooling, not hand-edited.
4. Support every claim of completion or consistency.
5. Be independently reviewable.

---

## 6. Acceptance Framework

### 6.1 Acceptance Criteria

The Canonical Migration Chain Definition is accepted when all of the following are true:

1. The document contains all mandatory sections defined in **Section 4**.
2. The migration inventory is complete and lists every forward migration in the canonical chain.
3. The ordered chain table is in ascending lexicographic order and contains no duplicate file names or timestamps.
4. The gap analysis confirms that the chain can accept real-timestamp hotfixes, or documents and gains approval for any exception.
5. Every file name conforms to `MIGRATION_NAMING_AND_ORDERING_STANDARD.md`.
6. The orphan-file reference is consistent with the accepted Orphan SQL Triage Record (D-P2-02).
7. All required evidence items in **Section 5** are present and traceable.
8. The Architecture Authority has acknowledged the definition.
9. No scope expansion into implementation, engineering planning, or later phases is present in the document.

### 6.2 Approving Authority

| Role | Responsibility |
|---|---|
| Program Manager | Accepts the Canonical Migration Chain Definition. |
| Architecture Authority | Provides required technical input and acknowledges canonical-source decisions. |
| Engineering Team | Acknowledges the definition as the authoritative basis for future migration work. |

### 6.3 Rejection Criteria

The definition MUST be rejected or returned for revision if any of the following occur:

- A mandatory section is missing or incomplete.
- The ordered chain contains duplicate timestamps or file names.
- The gap analysis is absent or inconclusive.
- Evidence is missing, hand-edited, or not traceable to the canonical chain.
- Orphan files are treated as canonical without absorption through D-P2-02.
- The definition prescribes implementation tactics, code changes, or engineering schedules.

---

## 7. Governance Authority

Authority for the Canonical Migration Chain Definition is applied from `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9 and `DECISION_AND_ESCALATION_LOG.md` §2–§3. This standard does not redefine that authority.

| Matter | Authority | Required Input |
|---|---|---|
| Acceptance of the Canonical Migration Chain Definition | Program Manager | Architecture Authority |
| Decisions on canonical sources, migration ordering, or chain integrity | Architecture Authority | Program Manager for impact assessment |
| Scope expansion or boundary dispute | Program Sponsor | Architecture Authority |
| Promotion of any derived artifact to canonical status | Architecture Authority | Program Manager |

Engineering teams MUST treat the accepted Canonical Migration Chain Definition as the authoritative source for all subsequent Phase 2 and Phase 3 work.

---

## 8. Scope Boundaries

The Canonical Migration Chain Definition Standard and any future Canonical Migration Chain Definition document produced under it MUST remain within the following boundaries:

1. **No repository analysis.** The definition records the chain; it does not require or perform a fresh inventory, diff, or inspection of repository files beyond what is already available from approved sources.
2. **No orphan triage.** Orphan files are referenced through D-P2-02, not classified or dispositioned inside the definition.
3. **No file changes.** The definition does not authorize renaming, reordering, deleting, or editing migration files.
4. **No derived artifacts.** The definition does not generate `schema.sql`, TypeScript types, or any other derived artifact.
5. **No RPC reconciliation.** Service-layer calls, RPC signatures, and test mocks are outside the scope of the definition.
6. **No engineering planning.** The definition does not produce work packages, sprint plans, task assignments, or tooling configuration.
7. **No phase expansion.** The definition is a Phase 2 deliverable only and does not authorize Phase 3 or later work.

Any proposed deviation from these boundaries MUST follow the exception procedure in **Section 9**.

---

## 9. Change Control

### 9.1 Changes to This Standard

Changes to the **Canonical Migration Chain Definition Standard** require:

1. A written change request identifying the section, the proposed change, and the rationale.
2. Assessment by the Program Manager against program scope and governance.
3. Architecture authority input if the change affects canonical-source rules, naming, ordering, evidence standards, or acceptance criteria.
4. Approval by the Program Manager.
5. Recording of the approved change in the Change Log of this standard.

### 9.2 Changes to the Canonical Migration Chain Definition

Once accepted, the Canonical Migration Chain Definition (D-P2-01) may be revised only:

- To correct factual errors in the inventory or ordering table.
- To absorb orphans approved through an updated Orphan SQL Triage Record.
- To reflect a new migration added under an approved subsequent `CURRENT_TASK`.

Every revision MUST:

1. Produce a new version and update the Change Log.
2. Re-run the gap analysis and hotfix readiness assessment.
3. Re-confirm naming and ordering compliance.
4. Be accepted by the Program Manager, with architecture authority input.
5. Not introduce implementation instructions or engineering plans.

### 9.3 Exception Procedure

Any exception to this standard or to the scope boundaries in **Section 8** requires:

1. A written exception request with ID, date, requester, deviation description, rationale, impact, and proposed mitigation.
2. Assessment by the Program Manager against `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §4 and §5.
3. Architecture authority input if the exception touches canonical sources, migration ordering, RPC naming, generated artifacts, or contract boundaries.
4. Approval by the Program Sponsor.
5. Recording in `DECISION_AND_ESCALATION_LOG.md`.

No exception is effective until approved and recorded.

---

## 10. Acceptance Criteria

This standard is accepted when all of the following are true:

1. The document includes all eleven required sections: Purpose, Scope, Required Document Structure, Mandatory Sections, Required Evidence, Acceptance Framework, Governance Authority, Scope Boundaries, Change Control, Acceptance Criteria, and References.
2. The standard defines the mandatory structure of a Canonical Migration Chain Definition without prescribing implementation tactics or engineering schedules.
3. The standard references `SYSTEM_RECOVERY_PROGRAM_CHARTER.md`, `SYSTEM_RECOVERY_MASTER_PLAN.md`, `PHASE2_GOVERNANCE_BASELINE.md`, `PHASE2_DELIVERABLE_ACCEPTANCE_MATRIX.md`, `PHASE2_SCOPE_AND_EXCEPTION_CONTROL_NOTE.md`, and `MIGRATION_NAMING_AND_ORDERING_STANDARD.md`.
4. The standard does not inventory migration files, perform gap analysis, identify orphan files, or reconcile RPC contracts.
5. The Program Manager reviews and accepts the standard.
6. The Architecture Authority acknowledges the standard.

---

## 11. References

### Program Governance

- `SYSTEM_RECOVERY_PROGRAM_CHARTER.md`
  - §3 Program Objectives (canonical migration chain objective)
  - §6 Guiding Principles (migrations are canonical, no manual synchronization, one SSOT, evidence before assumptions)
  - §8 Exit Criteria (SSOT restored across layers)
  - §9 Program Governance (decision authority, architecture authority, evidence requirements)
  - §10 Program Constraints (no undocumented migration, no bypassing canonical sources)

### Master Plan

- `SYSTEM_RECOVERY_MASTER_PLAN.md`
  - §2 Execution Strategy (canonical source first, evidence before assumptions, tool-generated synchronization)
  - §3 Program Structure (CURRENT_TASK hierarchy)
  - §4 Phase 2 — Canonical Migration Chain Stabilization (purpose, scope, exit criteria, deliverables, validation)
  - §5 Phase Dependency Map (Phase 2 blocks Phase 3, Phase 4, and Phase 6)
  - §6 Governance Model (decision authority, architecture authority, evidence requirements)
  - §7 Quality Gates (Phase Exit Gate, Architecture Gate, Operational Trust Gate)

### Phase 2 Governance

- `PHASE2_GOVERNANCE_BASELINE.md`
  - §3.1 Canonical Migration Chain Definition acceptance framework
  - §4 Evidence Standards
  - §5 Quality Gates (QG-P2-01)
  - §6 Scope-Control Rules
  - §7 Exception Procedure
  - §8 Decision Authority and Escalation
  - §10 Prohibition on Engineering Work

### Deliverable Matrix

- `PHASE2_DELIVERABLE_ACCEPTANCE_MATRIX.md`
  - D-P2-01 acceptance criteria, required evidence, and approving authority
  - QG-P2-01 mapping

### Scope Control

- `PHASE2_SCOPE_AND_EXCEPTION_CONTROL_NOTE.md`
  - §2.2 Out of Scope for Phase 2
  - §3 Scope-Control Rules
  - §4 Exception Procedure
  - §5 Escalation

### Naming and Ordering

- `MIGRATION_NAMING_AND_ORDERING_STANDARD.md`
  - §3 Naming Convention
  - §4 Timestamp Format
  - §5 Ordering Rules
  - §6 Hotfix Rule
  - §7 Rollback / Reverse Migration Convention
  - §8 Directory Structure
  - §9 Chain Authority

### Task Definition

- `CURRENT_TASK.md` — SRP-P2-T005 objective, scope, deliverables, acceptance criteria, and constraints.

---

## 12. Acceptance

| Role | Name | Signature / Acknowledgment | Date |
|---|---|---|---|
| Program Manager | | Pending | 2026-07-14 |
| Architecture Authority | | Pending | 2026-07-14 |

This standard is accepted when the Program Manager signs and the Architecture Authority acknowledges.
