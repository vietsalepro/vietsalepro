# CURRENT_TASK-030 Engineering Kickoff

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 5 — Documentation & Derived Artifact Reconciliation  
**Milestone:** M5.1 — Documentation & Contradiction Inventory  
**CURRENT_TASK:** 030  
**Document Type:** Engineering Kickoff  
**Date:** 2026-07-17  
**Status:** READY FOR IMPLEMENTATION  
**Authorizing Role:** Program Manager / Architecture Authority  

**Basis:**
- `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 5
- `CURRENT_PHASE.md` §1–§9
- `UNIFIED_PROGRAM_STATE.md` §3, §5, §8, §10, §12
- `PHASE5_OPENING_AUTHORIZATION.md`
- `PHASE5_GOVERNANCE_TRANSITION_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-030_PROGRAM_AUTHORIZATION.md`
- `SCAR_PHASE4_REPORT.md`
- `PHASE4_RECOVERY_MAPPING_VALIDATION.md`
- `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md`
- `D-P3-01_Reconciled_RPC_Contract.md`
- `supabase/migrations/*` (canonical migration chain)

---

## 1. Engineering Summary

This document is the **Engineering Kickoff** for `CURRENT_TASK-030`, Milestone **M5.1 — Documentation & Contradiction Inventory**, within **Phase 5**. Its purpose is to plan the inventory and contradiction-detection work needed to reconcile program documentation and derived artifacts with the canonical migration chain, the accepted RPC contract, and actual repository reality.

**Task objective:** Inventory and triage all active plans, sub-phase plans, implementation logs, RPC contract documentation, SQL fix documentation, audit reports, operational runbooks, and feature-flag configuration references. For each artifact, compare its claimed status and content against the canonical source and repository state, record contradictions with severity and proposed disposition, and produce a contradiction register and disposition plan as input to **D-P5-01 Reconciled Documentation Set**.

This kickoff **does not perform** the inventory, does **not** create the contradiction register, and does **not** produce the disposition plan. It defines the rules, scope, and execution plan under which the inventory will be performed.

---

## 2. Scope Confirmation

| Attribute | Value |
|---|---|
| **Task** | `CURRENT_TASK-030` |
| **Milestone** | `M5.1 — Documentation & Contradiction Inventory` |
| **Phase** | `Phase 5 — ACTIVE` |
| **Previous Task** | `CURRENT_TASK-029 — CLOSED` |
| **Program Health** | `HEALTHY` |
| **Governance Transition** | `COMPLETE` |
| **Change Type** | Inventory and disposition planning only |
| **Implementation** | `NOT AUTHORIZED` by this document |
| **Architecture Decision** | `NOT AUTHORIZED` by this document |

### 2.1 In-Scope

- Active plans and sub-phase plans in `Plan/`
- Implementation logs in `Plan/Log/`
- `docs/admin-dashboard/RPC_CONTRACTS.md`
- SQL fix documents in `docs/admin-dashboard/`
- Audit reports and recovery mapping validation documents
- Operational runbooks in `docs/admin-dashboard/`
- Feature-flag configuration references in code and documentation
- Governance/program status documents that assert completion or progress

### 2.2 Out-of-Scope

- Engineering implementation, code changes, test modifications, or regeneration of artifacts
- Changes to the canonical migration chain, RPC signatures, generated artifacts, or service behavior
- Updates to documentation content (reserved for subsequent Phase 5 tasks)
- `M5.2` RPC contract documentation regeneration
- `M5.3` program logs & reports update
- `M5.4` feature-flag traceability record completion
- Phase 6, Phase 7, or any work outside Phase 5
- Any commit, push, or source-code modification prior to approved implementation

### 2.3 Authorization Verification

- `CURRENT_TASK-030_PROGRAM_AUTHORIZATION.md` status: **APPROVED** (2026-07-17).
- `PHASE5_OPENING_AUTHORIZATION.md` verdict: **Phase 5 is formally opened**.
- `PHASE5_GOVERNANCE_TRANSITION_IMPLEMENTATION_REPORT.md` status: **PASS**.
- `CURRENT_PHASE.md` §1 records Phase 5 as **Active — Phase 5**.
- `UNIFIED_PROGRAM_STATE.md` §3 records **Phase 5 — Active**.
- No unresolved Phase 5 governance blocker remains.

---

## 3. Canonical Sources

All contradiction detection and disposition decisions must be derived from the following canonical sources, in priority order:

| Priority | Source | Role |
|---|---|---|
| 1 | `supabase/migrations/*.sql` (ordered chain) | Canonical source for schema, tables, functions, RLS policies, triggers, and RPC definitions |
| 2 | `D-P3-01_Reconciled_RPC_Contract.md` | Accepted, reconciled RPC contract surface |
| 3 | `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 5 | Phase 5 purpose, scope, entry/exit criteria, deliverables |
| 4 | `CURRENT_PHASE.md` | Operational phase marker and Phase 5 constraints |
| 5 | `UNIFIED_PROGRAM_STATE.md` | Single authoritative program state; supersedes all conflicting planning tracks |
| 6 | `PHASE5_OPENING_AUTHORIZATION.md` | Phase 5 opening authorization and milestone table |
| 7 | `PHASE5_GOVERNANCE_TRANSITION_IMPLEMENTATION_REPORT.md` | Governance transition completion evidence |
| 8 | `CURRENT_TASK-030_PROGRAM_AUTHORIZATION.md` | Task scope, acceptance criteria, expected evidence, out-of-scope boundaries |
| 9 | `SCAR_PHASE4_REPORT.md` | System-wide SSOT and documentation/governance findings |
| 10 | `PHASE4_RECOVERY_MAPPING_VALIDATION.md` | Recovery mapping validation evidence |
| 11 | `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` | Documented documentation/governance contradiction evidence |

**Rule:** A markdown document or log is **never** treated as canonical over the migration chain. Any claim in a derived document that conflicts with the ordered migration chain is a contradiction unless explicitly authorized as an exception.

---

## 4. Repository Review Scope

The inventory will review the following repository areas and document types. This is a planning-level boundary, not an inventory result.

### 4.1 Active Plans and Sub-Phase Plans

| Area | Representative Paths | Document Types |
|---|---|---|
| `Plan/` | `Plan/PLAN_AdminDashboard_SubPhases.md`, `Plan/PLAN_AdminDashboard_Implementation_Phases.md`, `Plan/PLAN_AdminDashboard_OpenSource_Reference.md` | Sub-phase plans, implementation phase plans, open-source reference |
| `Plan/Log/` | `Plan/Log/SP-*` | Implementation logs per sub-phase |

### 4.2 RPC Contract Documentation

| Area | Representative Paths | Document Types |
|---|---|---|
| `docs/admin-dashboard/` | `docs/admin-dashboard/RPC_CONTRACTS.md` | RPC contract markdown, RPC surface claims |

### 4.3 SQL Fix and Audit Documentation

| Area | Representative Paths | Document Types |
|---|---|---|
| `docs/admin-dashboard/` | `ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md`, `HANDOFF_AUDIT_LOG_400.md`, etc. | SQL fix plans, audit findings, remediation plans |
| Repository root | `SCAR_PHASE4_REPORT.md`, `PHASE4_RECOVERY_MAPPING_VALIDATION.md`, `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` | System-wide audit reports, recovery mapping validation, authorization errata |

### 4.4 Operational Runbooks

| Area | Representative Paths | Document Types |
|---|---|---|
| `docs/admin-dashboard/` | `DISASTER_RECOVERY_RUNBOOK.md`, `INCIDENT_RESPONSE_RUNBOOK.md`, `KEY_ROTATION_RUNBOOK.md`, `MIGRATION_RUNBOOK.md`, `MONITORING_RUNBOOK.md`, `ROLLBACK_RUNBOOK.md` | Operational and deployment runbooks |

### 4.5 Program Logs and Governance Documents

| Area | Representative Paths | Document Types |
|---|---|---|
| Repository root | `CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md`, `PHASE5_OPENING_AUTHORIZATION.md`, `CURRENT_TASK-030_PROGRAM_AUTHORIZATION.md`, `PHASE5_GOVERNANCE_TRANSITION_IMPLEMENTATION_REPORT.md` | Phase markers, program state, authorizations, transition reports |

### 4.6 Feature-Flag Configuration References

| Area | Search Strategy | Document Types |
|---|---|---|
| `supabase/migrations/` | Migrations containing feature-flag tables, configuration columns, or role gates | Canonical definitions of feature flags |
| Source code (`src/`, `services/`, etc.) | Search for feature-flag key strings and configuration consumers | Code consumers of feature flags |
| Documentation | `docs/admin-dashboard/` runbooks and `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` | Feature-flag references and operational instructions |

### 4.7 Secondary / Reference-Only Areas

- `memory-zone/docs/plans/` and `memory-zone/docs/einvoice_setup_guide.md` may be reviewed if they contain active claims about program status or completion. They are treated as reference unless they assert completion or contradiction.
- `docs/opensource-references.md` is reference material and checked only if it makes claims that overlap with active scope.

---

## 5. Contradiction Detection Rules

A **contradiction** exists when a document's claim cannot be verified against the canonical source or repository reality, or when two approved/derived documents make incompatible claims and only one can align with the canonical source.

### 5.1 Detection Rules

| # | Rule | Example |
|---|---|---|
| R1 | A plan or log claims a sub-phase or task is **Done** / **Complete** / **In Progress**, but the canonical migration chain or RPC contract does not contain the required schema/function. | `SP-2.2` marked Done while required RPC is absent from `supabase/migrations/`. |
| R2 | An RPC contract document (`RPC_CONTRACTS.md`) describes an RPC name, signature, or return shape that differs from the canonical migration chain. | Document lists `update_tenant_subscription` with a different parameter set than the migration. |
| R3 | A SQL fix document describes a fix that is not reflected in the ordered migration chain (e.g., table/column/RLP/RPC still missing or different). | `ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md` references a renamed or removed migration file. |
| R4 | An operational runbook references a file, migration, script, or command path that no longer exists or has been superseded. | Runbook points to `sp1_6_expand_audit_log_event_types` which was renamed. |
| R5 | A governance or program document references a planning track that `UNIFIED_PROGRAM_STATE.md` has formally superseded. | A plan references `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/PROGRAM_STATE.md` as active. |
| R6 | A document claims a capability or feature is present, but the code consumer (service layer, UI, or edge function) does not invoke or reference it. | Document claims feature flag `X` is active but no code path consumes it. |
| R7 | Two documents in the same scope report incompatible statuses for the same artifact or milestone without documented exception. | `Plan/PLAN_AdminDashboard_SubPhases.md` reports SP-2.2 Done while `Plan-Fix-Bug/...` reports Phase 1-A at 0%. |
| R8 | A feature-flag reference in a document or code names a flag that has no canonical definition or consumer. | Runbook references `enable_white_label` but migration `phase_p18_2_white_label.sql` does not define the expected config key. |
| R9 | An audit report or SQL fix document describes a remediation as complete, but the canonical migration chain shows the fix was not applied or was reverted. | Report says duplicate timestamp resolved, but migration file still carries the old name. |
| R10 | A log or plan references a `CURRENT_TASK` or Wave that is closed/superseded as if it were active. | Log references `Recovery Wave-04` as in-flight after `PHASE4_FINAL_CERTIFICATION.md`. |

### 5.2 Non-Contradictions

The following are **not** treated as contradictions:

- Historical log entries that correctly record a past state with an older date and are not presented as current status.
- Documents explicitly archived or marked superseded by `UNIFIED_PROGRAM_STATE.md`.
- Spelling, formatting, or style inconsistencies that do not affect the technical claim.
- Missing future work that is documented as pending or not yet started.

---

## 6. Severity Rules

Severity is assigned based on the likelihood that the contradiction will mislead engineering, acceptance, or operational decisions, and on the difficulty of detecting it without the inventory.

| Severity | Definition | Examples |
|---|---|---|
| **Critical** | The contradiction could cause an incorrect engineering decision, violate the canonical contract, or lead to deployment/operational failure. It directly asserts that a canonical artifact exists or is complete when it is not. | Document claims an RPC is available and tested, but it is missing from `supabase/migrations/`. Runbook instructs an operator to run a non-existent migration script. |
| **High** | The contradiction could mislead implementation, acceptance, or a scope decision, but does not immediately break the contract. | SQL fix doc references an obsolete migration name. Feature-flag doc describes a flag that no code consumes. |
| **Medium** | The contradiction is a stale status, missing traceability, or an outdated reference that does not currently block work but should be reconciled for Phase 5 exit. | Sub-phase plan status outdated relative to `CURRENT_PHASE.md`. Log references a closed task as pending. |
| **Low** | Cosmetic, formatting, or minor informational inconsistency that does not affect decision-making. | Date mismatch in a log header. Minor spelling in an archived plan. |

### 6.1 Severity Escalation

- Any **Critical** or **High** contradiction touching the canonical contract surface (RPC signatures, migration ordering, schema definitions) must be flagged for **Architecture Authority** review before disposition.
- Any contradiction involving scope or out-of-scope boundaries must be flagged for **Program Manager** review.

---

## 7. Disposition Rules

Each detected contradiction receives one proposed disposition category. The disposition plan is a recommendation to the Program Manager and does not itself modify any file.

| Disposition | When to Use | Example |
|---|---|---|
| **Update** | The artifact is still active and needed, but its content, status, or reference is stale. The canonical source or repository reality has changed and the document must be refreshed. | `RPC_CONTRACTS.md` needs parameter alignment with the migration chain. Runbook references a renamed migration file. |
| **Archive** | The artifact belongs to a superseded governance track, an abandoned sub-phase, or a historical state that is no longer authoritative. It should be moved to an archive location or marked superseded without deleting history. | `Plan-Fix-Bug/` plans and logs that `UNIFIED_PROGRAM_STATE.md` has superseded. Old `Recovery Wave-*` logs after Phase 4 closure. |
| **Regenerate** | The artifact is a derived document that should be produced from the canonical source, not maintained manually. | `RPC_CONTRACTS.md` if it is determined to be a generated contract document derived from `supabase/migrations/`. |
| **No Action** | The contradiction is a false positive, an acceptable exception documented elsewhere, or a historical entry correctly dated and no longer asserted as current. | Old log entry with explicit date. Superseded document already marked by `UNIFIED_PROGRAM_STATE.md`. |

### 7.1 Disposition Decision Flow

1. **Check canonical source first.** If the document claim differs from `supabase/migrations/` or `D-P3-01_Reconciled_RPC_Contract.md`, disposition is **Update** or **Regenerate**.
2. **Check supersession.** If the document belongs to a governance track listed in `UNIFIED_PROGRAM_STATE.md` §6, disposition is **Archive**.
3. **Check active use.** If the document is actively referenced by runbooks, CI, or operational procedures, prefer **Update** over **Archive**.
4. **Check derived status.** If the document is a contract surface document and the program policy is to generate it from migrations, disposition is **Regenerate**.
5. **If none of the above**, and the claim is correct or irrelevant, disposition is **No Action**.

---

## 8. Execution Plan

### Step 1 — Repository Discovery

| # | Activity | Output |
|---|---|---|
| 1.1 | Confirm canonical source paths: `supabase/migrations/` and `D-P3-01_Reconciled_RPC_Contract.md`. | Canonical source path list |
| 1.2 | Enumerate candidate documents in `Plan/`, `Plan/Log/`, `docs/admin-dashboard/`, repository root, and feature-flag search targets. | Candidate artifact list with path and type |
| 1.3 | Build traceability map: for each candidate, identify which Phase 5 exit criterion or deliverable it supports or contradicts. | Traceability matrix skeleton |

### Step 2 — Inventory

| # | Activity | Output |
|---|---|---|
| 2.1 | For each candidate document, record: path, type, last modified date, claimed status, key claims, and canonical source(s) it should align with. | Inventory register |
| 2.2 | Categorize documents as active plan, sub-phase plan, log, RPC contract doc, SQL fix doc, audit report, runbook, or feature-flag reference. | Categorized inventory |

### Step 3 — Contradiction Detection

| # | Activity | Output |
|---|---|---|
| 3.1 | Apply the contradiction detection rules (§5) to each inventory item. | Contradiction candidate list |
| 3.2 | For each candidate, capture: artifact path, claimed state, canonical-source reality, repository reality, and rule triggered. | Contradiction evidence record |
| 3.3 | Filter out false positives and historical-only entries. | Filtered contradiction set |

### Step 4 — Severity Classification

| # | Activity | Output |
|---|---|---|
| 4.1 | Apply the severity rules (§6) to each confirmed contradiction. | Severity-assigned contradiction set |
| 4.2 | Flag Critical/High contract-layer contradictions for Architecture Authority review. | Escalation list |

### Step 5 — Disposition Planning

| # | Activity | Output |
|---|---|---|
| 5.1 | Apply the disposition rules (§7) to each confirmed contradiction. | Disposition draft |
| 5.2 | Group dispositions by artifact type and Phase 5 exit criterion to identify patterns. | Disposition summary |
| 5.3 | Draft the disposition plan for Program Manager review and acceptance. | Disposition plan v1.0 |

### Step 6 — Evidence Packaging

| # | Activity | Output |
|---|---|---|
| 6.1 | Compile the contradiction register and disposition plan into `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md` (or equivalent). | Inventory / disposition document |
| 6.2 | Produce traceability mapping from each contradiction to Phase 5 exit criteria **EC-1** and **EC-5**, and to deliverable **D-P5-01**. | Traceability matrix |
| 6.3 | Include a no-source-change attestation and git-status evidence. | Evidence package |

---

## 9. Deliverables

| # | Deliverable | Phase 5 Mapping | Responsible Party |
|---|---|---|---|
| 1 | `CURRENT_TASK-030_ENGINEERING_KICKOFF.md` (this document) | Planning artifact | Engineering Lead |
| 2 | `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md` (planned) | Input to **D-P5-01 Reconciled Documentation Set** | Engineering Lead |
| 3 | Disposition Plan (planned, embedded in inventory or separate) | Input to **D-P5-01** | Engineering Lead |
| 4 | Traceability Matrix from contradictions to Phase 5 exit criteria | Supports EC-1, EC-5 | Engineering Lead |

**Acceptance authority:** The Program Manager accepts the disposition plan. The Architecture Authority reviews any Critical/High contract-layer contradictions.

---

## 10. Expected Evidence

Upon completion of `CURRENT_TASK-030` implementation, the following evidence is expected:

1. `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md` (or equivalent) containing the contradiction register.
2. Disposition plan accepted by the Program Manager.
3. Traceability mapping showing each contradiction to a Phase 5 exit criterion or deliverable:
   - **EC-1:** Identifies active plans whose status does not match repository reality.
   - **EC-5:** Identifies official documents claiming completion for capabilities whose canonical contract is absent or broken.
   - **D-P5-01:** Inputs the Reconciled Documentation Set.
4. Confirmation that no source code, migration, database, RPC, or test file was modified during this task.
5. A git-status snapshot or equivalent evidence demonstrating read-only work.

---

## 11. Repository Impact Assessment

| Area | Impact |
|---|---|
| **New files** | `CURRENT_TASK-030_ENGINEERING_KICKOFF.md` (this document). Planned future artifact: `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md` or equivalent. |
| **Modified files** | None. |
| **Source code** | No changes. |
| **Migrations** | No changes. |
| **Database** | No changes. |
| **RPC definitions** | No changes. |
| **Tests** | No changes. |
| **Commit performed** | No. |
| **Push performed** | No. |

---

## 12. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Large volume of `Plan/Log/` files makes manual inventory time-consuming | Medium | High | Apply type-based scanning and sample patterns; prioritize documents referenced by runbooks and governance artifacts. |
| Hidden planning artifacts in `memory-zone/` or other directories assert active completion | Medium | Medium | Use file-name search and grep for status keywords (`Done`, `Complete`, `In Progress`) across the repo, then scope boundary clearly. |
| Feature-flag references are dispersed across migrations, service code, and runbooks | Medium | Medium | Search for known feature-flag keys and canonical migration names; document consumers systematically. |
| Canonical source ambiguity if a migration file is an orphan or outside the ordered chain | Low | Low | Use only the ordered `supabase/migrations/` chain; any orphan file is flagged, not used as canonical. |
| Historical logs misclassified as contradictions | Low | Medium | Require cross-checking against date and supersession records before classification. |
| Disposition plan rejected or requires revision | Low | Low | Maintain clear evidence per contradiction and consult Program Manager early on scope/authority items. |

**Overall Risk:** LOW to MEDIUM. The task is read-only and bounded by `CURRENT_TASK-030_PROGRAM_AUTHORIZATION.md`. No engineering implementation is performed, so no runtime, deployment, or data-integrity risk is introduced.

---

## 13. Engineering Kickoff Decision

```text
READY
```

`CURRENT_TASK-030` is approved to proceed to **Implementation** of the documentation and contradiction inventory. The canonical sources, repository review scope, contradiction detection rules, severity rules, disposition rules, execution plan, deliverables, expected evidence, repository impact, and risks are all defined and aligned with `CURRENT_TASK-030_PROGRAM_AUTHORIZATION.md`.

---

## 14. Next Step

Engineering team may begin **Step 1 — Repository Discovery** under `CURRENT_TASK-030` once this kickoff is acknowledged. No file modifications are authorized until the inventory and disposition planning steps are executed.

---

*No other deliverables (Implementation Report, Acceptance Review, Program Status Review, CURRENT_TASK-031) are authorized by this Engineering Kickoff.*
