# Decision & Escalation Log

**Document ID:** DECISION_AND_ESCALATION_LOG.md  
**Program:** VietSalePro v7 — System Recovery Program  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Active — Operational Governance Record  
**Authority:** Program Manager, with required architecture authority input on technical decisions  

---

## 1. Purpose

This document is the operational record of decisions and escalations for the VietSalePro v7 System Recovery Program. It satisfies the Phase 1 deliverable **Decision & Escalation Log** defined in `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 "Recovery Phases — Phase 1" and the evidence requirement of the `SYSTEM_RECOVERY_MASTER_PLAN.md` §7 Governance Gate.

The log captures:
- Who has decision authority for each class of decision.
- How disputes and blockers are escalated.
- Material decisions that have been made to date.
- Escalations that occur during the program.

This is a living document. New entries are appended; existing entries are not rewritten.

---

## 2. Decision Authority Framework

Decision authority is derived from `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9 and `SYSTEM_RECOVERY_MASTER_PLAN.md` §6.

| Role | Decision Authority |
|---|---|
| **Program Sponsor** | Authorizes the Charter, approves scope changes, resolves business-level constraints, and formally accepts program / phase closure. |
| **Program Manager** | Owns day-to-day program execution; accepts deliverables; approves phase entry and exit; declares program completion; resolves cross-team execution blockers. |
| **Architecture Authority** | Final arbiter of canonical-source decisions, migration ordering, RPC naming, generated artifacts, and contract boundaries. |
| **Engineering Team** | Executes approved `CURRENT_TASK`s within the architecture authority and reports blockers to the Program Manager. |

### Decision Classes

| Decision Class | Approver | Required Input |
|---|---|---|
| Charter, program scope, and program closure | Program Sponsor | Program Manager, Architecture Authority |
| Phase entry, phase exit, and deliverable acceptance | Program Manager | Architecture Authority for technical deliverables |
| Canonical source designation, migration ordering, RPC naming, generated artifacts, contract boundaries | Architecture Authority | Program Manager for impact assessment |
| Scope expansion into out-of-scope areas | Program Sponsor | Architecture Authority for contract impact |
| Cross-team execution blocker resolution | Program Manager | Architecture Authority if contract-integrity risk |

---

## 3. Escalation Framework

Escalation paths are derived from `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9 "Escalation" and `SYSTEM_RECOVERY_MASTER_PLAN.md` §6 "Risk Escalation".

| Issue Type | Escalation Path | Decision Authority |
|---|---|---|
| Technical contract disputes (canonical source, migration ordering, RPC naming, generated artifacts, contract boundaries) | Architecture Authority | Architecture Authority |
| Resource, schedule, or business-constraint disputes | Program Sponsor | Program Sponsor |
| Scope or out-of-scope boundary disputes | Program Sponsor, with architecture input | Program Sponsor |
| Cross-team execution blockers | Program Manager | Program Manager |
| Quality-gate failure | Program Manager, with architecture authority review | Program Manager |
| Contract-integrity risk | Architecture Authority | Architecture Authority |
| Scope, budget, or business-continuity risk | Program Sponsor | Program Sponsor |

### Escalation Procedure

1. The party identifying the issue documents the dispute, blocker, or risk in this log under **Escalation Log** (Section 6).
2. The issue is routed to the appropriate authority per the table above.
3. The authority records the ruling or resolution in this log.
4. If the authority cannot resolve the issue, it is escalated to the next higher authority: Program Manager → Program Sponsor; Architecture Authority → Program Sponsor.
5. The Program Sponsor has final authority on program-level disputes except where the Charter assigns final technical authority to the Architecture Authority.

---

## 4. Decision Log

| # | Date | Decision | Decision Class | Authority | Basis | Impact |
|---|---|---|---|---|---|---|
| D-001 | 2026-07-14 | Establish the VietSalePro v7 System Recovery Program to restore trust in the canonical contract between the database, services, tests, documentation, and governance. | Charter / Program establishment | Program Sponsor | `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §1, §3; SCAR Phase 1–4 Reports; `STRATEGIC_DECISION_REPORT.md` | Creates the Recovery Program and supersedes ad-hoc bug-fixing tracks. |
| D-002 | 2026-07-14 | Select **Option B — Controlled Rebuild Program** as the recovery strategy. | Strategic decision | Program Sponsor | `STRATEGIC_DECISION_REPORT.md` §Final Strategic Decision; `SYSTEM_RECOVERY_MASTER_PLAN.md` §1, §2 | Replaces continued symptom-level bug fixing with a bounded, evidence-driven recovery of the contract layer. |
| D-003 | 2026-07-14 | Designate the **ordered migration chain** as the single canonical source of truth for database schema, RPC functions, RLS policies, triggers, and indexes. | Canonical-source decision | Architecture Authority | `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §6 Guiding Principle 1; `SYSTEM_RECOVERY_MASTER_PLAN.md` §2 Execution Strategy #1 | Establishes the migration chain as the SSOT that all derived layers must match. |
| D-004 | 2026-07-14 | Supersede the conflicting governance tracks `Plan/PLAN_AdminDashboard_SubPhases.md` and `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/PROGRAM_STATE.md`, and associated `CURRENT_TASK`s generated under those tracks. | Program governance / scope authority | Program Manager | `UNIFIED_PROGRAM_STATE.md` §6; `CURRENT_PHASE.md` §7; `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9 | Eliminates contradictory program status reports and establishes one official program state. |
| D-005 | 2026-07-14 | Establish `UNIFIED_PROGRAM_STATE.md` as the single authoritative statement of program status, to be referenced by all status reports and work authorizations. | Program governance | Program Manager | `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 1 Deliverable 2; `CURRENT_PHASE.md` §4 | Becomes the official source of program status for the Recovery Program. |
| D-006 | 2026-07-14 | Define Phase 1 scope as program governance convergence only; prohibit code changes, migration changes, feature development, architecture redesign, and unrelated bug fixing during Phase 1. | Scope control | Program Manager | `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §4–§5; `CURRENT_PHASE.md` §2, §5 | Protects Phase 1 from scope creep and keeps it focused on governance convergence. |
| D-007 | 2026-07-14 | Require every claim of completion, consistency, or readiness to be supported by reproducible evidence from the canonical migration source. | Evidence standard | Program Manager / Architecture Authority | `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §6 Guiding Principle 8; `SYSTEM_RECOVERY_MASTER_PLAN.md` §6 | Prevents documentation and governance claims that are not grounded in repository reality. |
| D-008 | 2026-07-14 | Approve this `DECISION_AND_ESCALATION_LOG.md` as the operational record of program decisions and escalations. | Governance deliverable acceptance | Program Manager | `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 1 Deliverable 3; `SYSTEM_RECOVERY_MASTER_PLAN.md` §7 Governance Gate | Satisfies the Phase 1 Decision & Escalation Log deliverable. |

---

## 5. Ruling Log

Rulings issued by the Architecture Authority or Program Sponsor on disputed or escalated matters. No rulings have been issued to date; this section is initialized for future entries.

| # | Date | Issue | Requester | Ruling Authority | Ruling |
|---|---|---|---|---|---|
| — | — | — | — | — | No rulings recorded. |

---

## 6. Escalation Log

Record of escalations raised and their resolution. No escalations have been raised to date; this section is initialized for future entries.

| # | Date | Issue Type | Raised By | Routed To | Resolution / Status |
|---|---|---|---|---|---|
| — | — | — | — | — | No escalations recorded. |

---

## 7. Acceptance

This Decision & Escalation Log is accepted as a complete Phase 1 governance deliverable.

| Role | Name | Signature / Acknowledgment | Date |
|---|---|---|---|
| Program Sponsor | | Accepted — recorded in `PHASE1_ACCEPTANCE_RECORD.md` | 2026-07-14 |
| Program Manager | | Accepted — recorded in `PHASE1_ACCEPTANCE_RECORD.md` | 2026-07-14 |
| Architecture Authority | | Accepted — recorded in `PHASE1_ACCEPTANCE_RECORD.md` | 2026-07-14 |

---

*Basis: `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9, `SYSTEM_RECOVERY_MASTER_PLAN.md` §6 and §7, `CURRENT_PHASE.md` §6 and §7, `UNIFIED_PROGRAM_STATE.md` §8 and §9.*
