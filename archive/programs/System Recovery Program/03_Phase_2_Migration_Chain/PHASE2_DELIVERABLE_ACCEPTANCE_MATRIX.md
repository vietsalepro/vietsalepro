# Phase 2 Deliverable Acceptance Matrix

**Program:** VietSalePro v7 — System Recovery Program  
**Task ID:** SRP-P2-T003  
**Phase:** Phase 2 — Canonical Migration Chain Stabilization  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Proposed — Pending Program Manager Approval  
**Document Type:** Program governance matrix  

---

## 1. Purpose

This matrix maps each Phase 2 deliverable to its acceptance criteria, required evidence, and approving authority. It is a companion to `PHASE2_GOVERNANCE_BASELINE.md` and applies the decision authority and escalation framework from `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §9 and `DECISION_AND_ESCALATION_LOG.md` §2–§3.

---

## 2. Deliverable Acceptance Matrix

| # | Deliverable | Acceptance Criteria | Required Evidence | Approving Authority | Required Input |
|---|---|---|---|---|---|
| D-P2-01 | **Canonical Migration Chain Definition** | One ordered, gapless migration chain exists as the single canonical source; no gaps prevent real-timestamp hotfixes; ordering is deterministic; orphan files are absorbed, triaged, or explicitly excluded. | Migration inventory; ordered chain table; gap analysis; staging-environment application log. | Program Manager | Architecture Authority |
| D-P2-02 | **Orphan SQL Triage Record** | Every SQL file outside the canonical chain is classified and dispositioned; no orphan file remains as an undocumented source of schema or RPC truth; rationale is recorded. | Orphan-file inventory; classification per file; disposition log; cross-references to absorbed orphans. | Program Manager | Architecture Authority |
| D-P2-03 | **Generated Schema Artifact** | `schema.sql` (or equivalent) exists; derived from the canonical migration chain; byte-for-byte reproducible when regenerated; matches the applied canonical chain. | Generation command or script; reproducibility report; diff against applied schema; clean-environment verification. | Architecture Authority | Program Manager |
| D-P2-04 | **Generated Type Artifacts** | Type artifacts exist; derived from the canonical schema artifact; not hand-edited; byte-for-byte reproducible from the canonical source. | Type-generation command; source-to-artifact trace; reproducibility report; no hand-edit verification. | Architecture Authority | Program Manager |
| D-P2-05 | **Migration Naming & Ordering Standard** | A documented, enforceable standard exists for future migration naming, ordering, timestamp format, hotfix handling, and rollback notation; accepted by Program Manager and acknowledged by engineering. | Published standard; review acknowledgment; enforcement checklist or lint rule reference if available. | Program Manager | Architecture Authority |

---

## 3. Quality Gate Mapping

| Quality Gate | Linked Deliverable | Criterion |
|---|---|---|
| QG-P2-01 | D-P2-01 | Single ordered migration chain exists with no gaps that prevent real-timestamp hotfixes. |
| QG-P2-02 | D-P2-02 | No SQL file outside the canonical chain is treated as a source of schema or RPC truth. |
| QG-P2-03 | D-P2-03 | A generated schema artifact exists and matches the canonical chain. |
| QG-P2-04 | D-P2-04 | Generated type artifacts exist and are derived from the canonical schema artifact. |
| QG-P2-05 | D-P2-05 | Naming and ordering rules are documented and enforceable for future migrations. |

---

## 4. Authority References

Decision authority and escalation paths are applied from the approved governance documents listed below; they are not redefined in this matrix.

| Document | Section | Relevance |
|---|---|---|
| `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` | §9 | Program governance, decision authority, architecture authority, scope control, escalation. |
| `DECISION_AND_ESCALATION_LOG.md` | §2 | Decision Authority Framework. |
| `DECISION_AND_ESCALATION_LOG.md` | §3 | Escalation Framework. |
| `SYSTEM_RECOVERY_MASTER_PLAN.md` | §4 Phase 2 | Phase 2 exit criteria and deliverables. |
| `SYSTEM_RECOVERY_MASTER_PLAN.md` | §7 | Quality gates. |

---

## 5. Evidence Standards

All evidence must satisfy the standards defined in `PHASE2_GOVERNANCE_BASELINE.md` §4:

1. Trace to the canonical migration chain.
2. Be reproducible in a clean environment.
3. Be produced by tooling, not hand-edited.
4. Support every claim of completion or consistency.
5. Be independently reviewable.

---

## 6. Acceptance

| Role | Name | Signature / Acknowledgment | Date |
|---|---|---|---|
| Program Manager | | Pending | 2026-07-14 |

This matrix is accepted by the Program Manager.
