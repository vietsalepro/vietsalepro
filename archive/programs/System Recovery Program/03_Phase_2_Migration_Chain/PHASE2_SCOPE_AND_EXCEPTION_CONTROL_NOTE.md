# Phase 2 Scope & Exception Control Note

**Program:** VietSalePro v7 — System Recovery Program  
**Task ID:** SRP-P2-T003  
**Phase:** Phase 2 — Canonical Migration Chain Stabilization  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Proposed — Pending Program Manager Approval  
**Document Type:** Program governance control note  

---

## 1. Purpose

This note reaffirms the boundaries of Phase 2 and documents the procedure for requesting and approving any exception. It applies the scope authority and escalation framework from `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9 and `DECISION_AND_ESCALATION_LOG.md` §2–§3.

---

## 2. Phase 2 Boundary Statement

Phase 2 is **Canonical Migration Chain Stabilization**, as defined in `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 "Recovery Phases — Phase 2".

### 2.1 In Scope

Phase 2 includes only the following work:

- Canonical migration chain integrity (ordering, gaps, orphan files, timestamp sequence).
- Migration naming convention standard for all future migrations.
- Schema artifact and generated type artifacts derived from the canonical migration chain.
- Triage of SQL files outside the canonical chain so that none are treated as schema authority.
- Baseline hygiene sufficient for deterministic application and review.

### 2.2 Out of Scope

The following are explicitly out of scope for Phase 2:

- Re-verification of Phase 1 exit criteria.
- Re-verification or re-activation of Phase 2 entry criteria.
- Modification of `CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md`, or any other phase marker.
- Writing, modifying, or reordering migration SQL files before a subsequent approved `CURRENT_TASK`.
- Generating `schema.sql`, TypeScript types, or any derived artifact before a subsequent approved `CURRENT_TASK`.
- Reconciling RPC contracts, service code, tests, or documentation.
- Creating implementation work packages, sprint plans, or engineering task lists.
- Feature development, bug fixing, architecture redesign, UI changes, or operational deployment.
- Any work that expands into Phase 3 or later phases.

---

## 3. Scope-Control Rules

1. **No engineering work without a subsequent approved `CURRENT_TASK`.** This note and its companion baseline are governance controls only. No code, migration, generated artifact, test, or documentation change may be performed under SRP-P2-T003.
2. **Phase markers are read-only.** `CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md`, and other official program-state documents are not modified by this task.
3. **No competing sources of status.** All Phase 2 status reporting must reference `UNIFIED_PROGRAM_STATE.md` and `PHASE2_GOVERNANCE_BASELINE.md`.
4. **No promotion of derived artifacts to canonical status.** Generated artifacts, test mocks, markdown contracts, and governance documents may not override the ordered migration chain without architecture authority approval.
5. **No scope expansion by implication.** A deliverable required for Phase 2 exit does not authorize out-of-scope engineering work.

---

## 4. Exception Procedure

Any request to deviate from the Phase 2 scope or from the evidence standards in `PHASE2_GOVERNANCE_BASELINE.md` must follow this procedure:

### 4.1 Exception Request

The requester submits a written exception request containing:

- Exception ID (e.g., EX-P2-001).
- Date.
- Requester.
- Description of the requested deviation.
- Rationale and business or technical necessity.
- Impact on the canonical migration chain, generated artifacts, or contract trust.
- Proposed mitigations.
- Authority believed to have decision rights.

### 4.2 Assessment

The Program Manager assesses the request against:

- `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §4 (Program Scope) and §5 (Out of Scope).
- `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 2 (Scope).
- `PHASE2_GOVERNANCE_BASELINE.md` §4 (Evidence Standards) and §6 (Scope-Control Rules).

If the request touches canonical sources, migration ordering, RPC naming, generated artifacts, or contract boundaries, architecture authority input is required.

### 4.3 Approval

- Scope or out-of-scope boundary exceptions require Program Sponsor approval, with architecture authority input.
- Technical contract exceptions require Architecture Authority approval, with Program Manager impact assessment.
- The approving authority records the decision in `DECISION_AND_ESCALATION_LOG.md`.

### 4.4 Recording

Approved exceptions are appended to `DECISION_AND_ESCALATION_LOG.md` under the Decision Log or Ruling Log as appropriate. Denied exceptions are recorded in the Escalation Log if they are escalated.

### 4.5 Effective Date

An exception is effective only after it is approved and recorded. No deviation may proceed on verbal or informal approval.

---

## 5. Escalation

Disputes about scope boundaries or exception decisions are escalated per `DECISION_AND_ESCALATION_LOG.md` §3:

| Issue Type | Escalation Path | Decision Authority |
|---|---|---|
| Scope or out-of-scope boundary dispute | Program Sponsor, with architecture input | Program Sponsor |
| Technical contract dispute (canonical source, migration ordering, generated artifacts) | Architecture Authority | Architecture Authority |
| Unresolved Program Manager / Architecture Authority dispute | Program Sponsor | Program Sponsor |

---

## 6. References

- `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §4, §5, §9
- `SYSTEM_RECOVERY_MASTER_PLAN.md` §2, §4 Phase 2, §6, §7
- `CURRENT_PHASE.md`
- `UNIFIED_PROGRAM_STATE.md` §3, §7, §10
- `DECISION_AND_ESCALATION_LOG.md` §2, §3
- `PHASE1_ACCEPTANCE_RECORD.md`
- `PHASE2_GOVERNANCE_BASELINE.md`

---

## 7. Acceptance

| Role | Name | Signature / Acknowledgment | Date |
|---|---|---|---|
| Program Manager | | Pending | 2026-07-14 |

This note is accepted by the Program Manager.
