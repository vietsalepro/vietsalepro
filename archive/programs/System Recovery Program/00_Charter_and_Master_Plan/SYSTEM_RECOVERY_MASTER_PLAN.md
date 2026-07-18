# System Recovery Master Plan

**Program:** VietSalePro v7 — System Recovery Program  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Proposed — Pending Program Sponsor Approval  
**Basis:** `SYSTEM_RECOVERY_PROGRAM_CHARTER.md`, SCAR Phase 1–4 Reports, Strategic Decision Report (SDR), Strategic Recovery Analysis (SRA)

---

## 1. Executive Summary

The VietSalePro v7 System Recovery Program exists because the codebase has lost a single, trustworthy source of truth. The SCAR assessment found that the underlying architecture is sound: the database design is comprehensive, the service-to-database boundary is largely intact, and the UI respects the service layer. The failure is systemic Single Source of Truth (SSOT) fragmentation. Migrations, service code, tests, documentation, governance, and audit tooling describe different versions of the same system.

The program's purpose is to restore trust in the canonical contract between the database and every layer that consumes or validates it. The selected strategy, as ratified in the Strategic Decision Report, is **Option B — Controlled Rebuild Program**: a bounded, evidence-driven recovery of the contract layer rather than continued symptom-level bug fixing inside a contradictory environment.

The execution philosophy is sequential and conservative:

- Recover **trust** before optimization.
- Recover **canonical sources** before derived artifacts.
- Recover **contracts** before features.
- Recover **governance** before execution scaling.

This master plan defines the execution framework for that recovery. It does not prescribe implementation tactics, sprint schedules, or task lists.

---

## 2. Execution Strategy

The overall strategy is to re-establish one authoritative source of truth and then reconcile every derived layer against it.

1. **Canonical source first.** The ordered migration chain is the only acceptable canonical source for the database schema, RPC surface, RLS policies, triggers, and indexes. No derived document, test mock, or governance artifact may override it.
2. **Contract before code behavior.** The program prioritizes making the service-layer contract match the canonical migration contract before changing business logic or adding capabilities.
3. **Governance convergence before work scaling.** A single program state, decision authority, and escalation path must exist before additional engineering work is authorized.
4. **Evidence before assumptions.** Every claim of completion, consistency, or readiness must be supported by reproducible evidence from the canonical source.
5. **Tool-generated synchronization.** Derived artifacts are regenerated from the canonical source; they are not maintained by manual copying.
6. **Preserve architectural strengths.** The existing service facade, UI-to-service boundary, RLS model, and tenant-isolation patterns remain in place. The program rebuilds confidence in the contract, not the architecture.

---

## 3. Program Structure

The Recovery Program is organized as a hierarchy of increasing specificity. Each level has distinct responsibilities and distinct approval requirements.

```text
Program
  └── Phase
        └── Milestone
              └── CURRENT_TASK
                    └── Implementation
```

| Level | Responsibility | Approval Authority |
|---|---|---|
| **Program** | Defines the recovery mission, scope, success criteria, and closure conditions. Chartered by the Program Sponsor. | Program Sponsor |
| **Phase** | A major execution stage with a defined purpose, entry criteria, exit criteria, and deliverables. Phases are gated. | Program Manager, with architecture authority input |
| **Milestone** | A measurable point within a phase at which one or more deliverables are accepted and validated. | Program Manager |
| **CURRENT_TASK** | An operational work unit that translates phase intent into bounded engineering activity. | Program Manager / delegated engineering lead |
| **Implementation** | The actual engineering execution performed by the development team within approved CURRENT_TASKs. | Engineering team, monitored by Program Manager |

The Master Plan governs Phases and Milestones. It does not govern CURRENT_TASKs or Implementation, except to require that every CURRENT_TASK map to an in-scope Phase objective and pass the applicable quality gates.

---

## 4. Recovery Phases

### Phase 1 — Program Establishment & Governance Convergence

**Purpose**
Establish a single, authoritative program governance model and reconcile the contradictory governance tracks that currently report incompatible completion states.

**Scope**
- Program governance structure (decision authority, architecture authority, escalation paths, scope control).
- Official program state and single source of program status.
- Reconciliation of existing planning tracks into one program view.
- Communication protocol for status, exceptions, and scope-change requests.

**Entry Criteria**
- The System Recovery Program Charter is approved by the Program Sponsor.
- The Program Manager and architecture authority are named.
- The final SCAR reports, SDR, and SRA are available to the program team.

**Exit Criteria**
- One official program state exists and is accepted by the Program Sponsor.
- Decision authority, architecture authority, escalation paths, and scope-control procedures are documented and acknowledged.
- Contradictory governance tracks are either reconciled or formally superseded by the official program state.
- No competing source of program status remains active.

**Dependencies**
- `SYSTEM_RECOVERY_PROGRAM_CHARTER.md`
- Strategic Decision Report
- SCAR Phase 4 governance findings

**Deliverables**
1. Program Governance Statement
2. Unified Program State
3. Decision & Escalation Log
4. Scope-Change Control Procedure

**Validation**
- An independent review confirms that all governance contradictions identified by SCAR Phase 4 are resolved or explicitly superseded.
- The Program Sponsor formally accepts the unified program state.

---

### Phase 2 — Canonical Migration Chain Stabilization

**Purpose**
Make the ordered migration chain the unambiguous, gapless, and deterministic canonical source for the database contract.

**Scope**
- Canonical migration chain integrity (ordering, gaps, orphan files, timestamp sequence).
- Migration naming convention standard for all future migrations.
- Schema artifact and generated type artifacts derived from the canonical migration chain.
- Triage of SQL files outside the canonical chain so that none are treated as schema authority.
- Baseline hygiene sufficient for deterministic application and review.

**Entry Criteria**
- Phase 1 exit criteria are satisfied.
- Current migration inventory and orphan-file inventory from SCAR Phase 1 are available.
- A staging environment or equivalent validation mechanism is designated for chain verification.

**Exit Criteria**
- A single, ordered migration chain exists with no gaps that would prevent real-timestamp hotfixes.
- No SQL file outside the canonical chain is treated as a source of schema or RPC truth.
- A generated schema artifact (`schema.sql` or equivalent) exists and matches the canonical chain.
- Generated type artifacts exist and are derived from the canonical schema artifact.
- Naming convention and migration-ordering rules are documented and enforceable for future migrations.

**Dependencies**
- Phase 1 — Program Establishment & Governance Convergence
- SCAR Phase 1 database / migration findings

**Deliverables**
1. Canonical Migration Chain Definition
2. Orphan SQL Triage Record
3. Generated Schema Artifact
4. Generated Type Artifacts
5. Migration Naming & Ordering Standard

**Validation**
- Independent verification that the migration chain applies deterministically to a clean environment.
- Generated schema and type artifacts are byte-for-byte reproducible from the canonical chain.
- No orphan SQL file remains as an undocumented source of authority.

---

### Phase 3 — RPC Contract Reconciliation

**Purpose**
Ensure that every RPC invoked by the service layer is defined in the canonical migration chain, and that the service-layer contract surface is unambiguous.

**Scope**
- All service-layer RPC call sites.
- Missing RPCs that currently cause guaranteed runtime failures.
- Signature drift between service calls and canonical migration functions.
- Duplicate or ambiguous service wrappers that expand the contract surface without adding capability.
- Alias or re-export patterns that shadow canonical names.

**Entry Criteria**
- Phase 2 exit criteria are satisfied.
- A complete inventory of service-layer RPC call sites is available (SCAR Phase 2).
- The canonical migration chain and generated schema artifact are accepted.

**Exit Criteria**
- Every RPC invoked by production service code maps to a function defined in the canonical migration chain.
- No production path calls a function that migrations do not define.
- Confirmed signature drift is either reconciled with the canonical contract or explicitly split into a separately named canonical function.
- Duplicate or ambiguous wrappers are resolved into a single canonical contract surface.
- Alias patterns that create shadow contracts are documented or removed.

**Dependencies**
- Phase 2 — Canonical Migration Chain Stabilization
- SCAR Phase 2 service-layer / RPC findings

**Deliverables**
1. Reconciled RPC Contract
2. Service-Layer Contract Consistency Report
3. RPC Coverage Validation Evidence
4. Migration Updates Required for Contract Gaps (as contract changes, not implementation instructions)

**Validation**
- Independent RPC coverage check: invoked RPCs ⊆ defined RPCs in the canonical migration chain.
- Architecture authority confirms that the reconciled contract preserves the existing service boundary.

---

### Phase 4 — Derived Validation Layer Realignment

**Purpose**
Rebuild the test and audit layers so that they validate the real canonical contract rather than a fictional or derived one.

**Scope**
- Test mocks and test assertions that currently implement or assume missing RPCs.
- Operational audit tooling that compares code against a markdown contract document instead of the migration chain.
- Continuous integration gates that must compare derived artifacts against the canonical source.

**Entry Criteria**
- Phase 3 exit criteria are satisfied.
- Canonical migration chain, schema artifact, and reconciled RPC contract are accepted.
- Test and audit tooling inventory from SCAR Phase 4 is available.

**Exit Criteria**
- Test mocks are derived from or validated against the canonical migration contract.
- Passing tests imply that the corresponding production path will not fail on the previously known contract breaks.
- The operational audit script compares service-layer RPC calls against the canonical migration chain, not against another derived document.
- CI gates fail when a derived artifact diverges from the canonical source.

**Dependencies**
- Phase 2 — Canonical Migration Chain Stabilization
- Phase 3 — RPC Contract Reconciliation
- SCAR Phase 4 test / audit findings

**Deliverables**
1. Validated Test Base
2. Canonical Audit Gate Definition
3. CI Gate Evidence
4. Test-Audit Traceability Report

**Validation**
- A deliberate injection of a non-existent RPC call is caught by the audit gate and by the test base.
- The audit gate reports zero missing RPCs against the canonical migration chain.

---

### Phase 5 — Documentation & Derived Artifact Reconciliation

**Purpose**
Align all operational and architectural documentation with the actual repository state and the canonical contract.

**Scope**
- Active plans, sub-phase plans, and implementation logs.
- RPC contract documentation.
- SQL fix documentation and audit reports.
- Operational runbooks and feature-flag configuration references.
- Any document that currently asserts completion that code reality contradicts.

**Entry Criteria**
- Phase 3 and Phase 4 exit criteria are satisfied.
- Canonical migration chain, reconciled RPC contract, and validated test/audit gates are accepted.
- Inventory of documentation / governance contradictions from SCAR Phase 4 is available.

**Exit Criteria**
- All active plans describe statuses consistent with repository reality.
- RPC contract documentation is derived from or validated against the canonical migration chain.
- Stale SQL fix documentation is archived or updated to reflect the current migration state.
- Feature-flag configuration is traceable to the migration or code that consumes it.
- No official document claims completion for a capability whose canonical contract is absent or broken.

**Dependencies**
- Phase 2 — Canonical Migration Chain Stabilization
- Phase 3 — RPC Contract Reconciliation
- Phase 4 — Derived Validation Layer Realignment
- SCAR Phase 4 documentation / SSOT findings

**Deliverables**
1. Reconciled Documentation Set
2. Regenerated RPC Contract Document
3. Updated Program Logs & Reports
4. Feature-Flag Configuration Traceability Record

**Validation**
- Documentation-to-code diff shows no unresolved contradictions.
- Architecture authority confirms that contract documentation is derived from the canonical source.

---

### Phase 6 — Operational Trust & Deployment Readiness

**Purpose**
Ensure that the canonical migration chain and its derived artifacts can be applied deterministically to any environment and that operational processes reinforce the canonical source.

**Scope**
- Deployment process validation against the canonical migration chain.
- Environment parity for migrations, generated types, and schema artifacts.
- Operational runbooks that reference the canonical source.
- Feature-flag wiring and configuration consumption.
- Rollback coverage for future migrations.

**Entry Criteria**
- Phase 2 and Phase 4 exit criteria are satisfied.
- Reconciled RPC contract is accepted.
- Deployment environments and operational processes are identified.

**Exit Criteria**
- The canonical migration chain applies deterministically to all designated environments.
- Generated artifacts are reproducible in every environment from the same canonical source.
- Deployment validation gate confirms contract parity before any environment is considered current.
- Operational runbooks direct engineers to the canonical migration chain and generated artifacts.
- Feature-flag configuration is consumed as documented.

**Dependencies**
- Phase 2 — Canonical Migration Chain Stabilization
- Phase 4 — Derived Validation Layer Realignment
- SCAR Phase 1 deployment / migration-ordering findings

**Deliverables**
1. Deployment Readiness Evidence
2. Environment Parity Report
3. Operational Runbook Update
4. Deployment Validation Gate Definition

**Validation**
- A clean application of the canonical chain to a non-production environment succeeds without ordering errors.
- Environment diff confirms that no environment depends on a non-canonical source of schema truth.

---

### Phase 7 — Program Closure & Evidence Acceptance

**Purpose**
Formally close the Recovery Program after independent verification that the exit criteria in the Charter are satisfied.

**Scope**
- Final review of all phase exit evidence.
- Evidence package assembly.
- Program Completion Statement issuance.
- Transition of ongoing work to normal product development governance.

**Entry Criteria**
- All Phase 1–6 exit criteria are satisfied.
- All quality gates defined in Section 7 are passed.
- No unresolved critical inconsistencies remain.

**Exit Criteria**
- The Program Manager issues the Program Completion Statement.
- The architecture authority confirms that Single Source of Truth has been restored.
- The Program Sponsor accepts the evidence package and the closure statement.
- Ongoing work is formally transferred out of the Recovery Program scope.

**Dependencies**
- All preceding phases
- `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` Section 8 (Exit Criteria) and Section 14 (Program Completion Statement)

**Deliverables**
1. Program Completion Statement
2. Final Evidence Package
3. Final Program State
4. Transition Memo to Normal Development Governance

**Validation**
- Independent audit confirms all Charter success criteria and exit criteria are met.
- Program Sponsor formally approves closure.

---

## 5. Phase Dependency Map

### Sequential Phases

- **Phase 1 → Phase 2:** Governance must converge before the canonical source is stabilized, because migration-chain decisions (e.g., orphan triage, re-baselining) require a single decision authority.
- **Phase 2 → Phase 3:** RPC contract reconciliation depends on an accepted canonical migration chain.
- **Phase 3 → Phase 4:** Tests and audits must validate against a reconciled RPC contract.

### Parallelizable Phases

- **Phase 5 and Phase 6** may proceed largely in parallel once Phase 3 and Phase 4 are complete, because documentation reconciliation and deployment readiness do not block each other. Both depend on the canonical contract and validated gates.

### Blocking Phases

- **Phase 2** blocks **Phase 3**, **Phase 4**, and **Phase 6**.
- **Phase 3** blocks **Phase 4** and **Phase 5**.
- **Phase 4** blocks **Phase 5** and **Phase 7**.
- **Phase 6** blocks **Phase 7** if deployment readiness evidence is incomplete.

### Critical Path

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 7

Phase 5 and Phase 6 are on parallel supporting paths that must rejoin before Phase 7.

---

## 6. Governance Model

### Decision Authority

| Role | Authority |
|---|---|
| **Program Sponsor** | Authorizes the Charter, approves scope changes, resolves business-level constraints, and accepts program closure. |
| **Program Manager** | Owns day-to-day execution, approves phase entry and exit, accepts deliverables, and issues the Program Completion Statement. |
| **Chief Technology Officer / Enterprise Solution Architect** | Holds architecture authority; final arbiter of canonical-source decisions, migration ordering, RPC naming, generated artifacts, and contract boundaries. |
| **Engineering Team** | Executes approved CURRENT_TASKs within the architecture authority and reports blockers to the Program Manager. |

### Architecture Authority

All decisions regarding the following require architecture authority approval:
- Which artifact is designated as canonical for a given contract layer.
- Migration ordering, re-baselining, or orphan-file disposition.
- RPC naming, signature changes, or canonical equivalents.
- Promotion of any derived artifact to canonical status.
- Any change that affects the service-to-database contract boundary.

No derived layer may be promoted to canonical status without explicit architecture authority approval.

### Acceptance Authority

- **Phase deliverables** are accepted by the Program Manager with architecture authority input.
- **Program closure** is accepted by the Program Sponsor after the Program Manager issues the Program Completion Statement and the architecture authority confirms SSOT restoration.
- **Scope changes** are accepted by the Program Sponsor, with architecture input when they touch contract boundaries.

### Evidence Requirements

Every claim of completion, consistency, or readiness must be supported by reproducible evidence from the canonical source. Assertions based solely on documentation, test output, governance status, or anecdotal inspection are insufficient unless cross-referenced to the canonical migration chain.

### Risk Escalation

| Risk Type | Escalation Path |
|---|---|
| Contract-integrity risk | Architecture authority |
| Scope, budget, or business-continuity risk | Program Sponsor |
| Cross-team execution blocker | Program Manager |
| Quality-gate failure | Program Manager, with architecture authority review |

### Scope Control

The Program Manager enforces the in-scope / out-of-scope boundaries defined in the Charter. Any proposed expansion into new features, UI redesign, performance optimization, infrastructure migration, or new governance tracks must be documented, assessed against the Charter, and approved by the Program Sponsor before being accepted.

### Phase Approval

A phase may not begin until its entry criteria are verified and the previous phase's exit criteria are accepted. A phase may not be declared complete until all exit criteria are satisfied, all required deliverables are accepted, and the applicable quality gates are passed.

### Program Completion Authority

The Program Manager formally declares program completion by issuing the Program Completion Statement. The Program Sponsor formally accepts closure. The architecture authority certifies that the canonical source of truth has been restored.

### CURRENT_TASK Governance Model

#### 1. CURRENT_TASK Authority

A CURRENT_TASK may be opened only under Program Authorization.

A CURRENT_TASK may be closed only after completing the following governance chain:

```text
Program Authorization
  ↓
Engineering Kickoff
  ↓
Implementation
  ↓
Acceptance Review
  ↓
Program Status Review
  ↓
Program Manager Formal Acceptance
```

This is the standard governance chain for every CURRENT_TASK.

#### 2. Authority Hierarchy

```text
Program
  ↓
Phase
  ↓
Milestone
  ↓
CURRENT_TASK
  ↓
Implementation
```

The authority hierarchy remains unchanged. However, the authority of a CURRENT_TASK is managed through the governance chain defined above.

#### 3. CURRENT_PHASE.md

`CURRENT_PHASE.md` is a Phase Governance Artifact. It is not a prerequisite, not a blocker, and must not be used as a condition for opening a CURRENT_TASK.

`CURRENT_PHASE.md` and `UNIFIED_PROGRAM_STATE.md` must NOT be treated as prerequisites or blockers for CURRENT_TASK execution unless the `CURRENT_TASK` Program Authorization explicitly requires them.

`CURRENT_PHASE.md` may be updated only during:

- Phase Opening
- Phase Exit
- Phase Transition
- or when Program Authorization explicitly requires it.

#### 4. UNIFIED_PROGRAM_STATE.md

`UNIFIED_PROGRAM_STATE.md` is a Program / Phase Governance Artifact. It is not a blocker for CURRENT_TASK execution. It must NOT be treated as a prerequisite or blocker for CURRENT_TASK execution unless the `CURRENT_TASK` Program Authorization explicitly requires it.

`UNIFIED_PROGRAM_STATE.md` may be updated only during:

- Program Transition
- Phase Transition
- Governance Consolidation
- or when Program Authorization explicitly requires it.

#### 5. Prompt Generation Rule

Prompts for a CURRENT_TASK must use as their baseline the following artifacts of that CURRENT_TASK:

- Program Authorization
- Engineering Kickoff
- Implementation Deliverables
- Acceptance Review
- Program Status Review
- Program Manager Formal Acceptance

Reading `CURRENT_PHASE.md` and `UNIFIED_PROGRAM_STATE.md` is not mandatory unless Program Authorization explicitly requires it.

#### 6. Execution Authority

If a conflict arises between the `CURRENT_TASK` Governance Chain and `CURRENT_PHASE.md` or `UNIFIED_PROGRAM_STATE.md`:

- The `CURRENT_TASK` Governance Chain is the authority for executing the current `CURRENT_TASK`.
- `CURRENT_PHASE.md` and `UNIFIED_PROGRAM_STATE.md` are authorities for Program Governance, Phase Governance, Phase Transition, and Program Transition.
- This authority model does not change Program Authority; it only clarifies which artifact governs the immediate `CURRENT_TASK` execution.

#### 7. Backward Compatibility

This rule does not change Program Governance. It does not change Phase Governance. It only clarifies Task Execution Governance.

---

## 7. Quality Gates

### Phase Entry Gate

**Purpose:** Ensure that a phase begins only when its prerequisites are verified and the program is ready to commit resources.

**Evidence Required**
- Signed acceptance of the previous phase's exit criteria.
- Confirmation that required deliverables from predecessor phases are available.
- Risk review and exception log current as of the phase start.
- Resource and environment readiness confirmation.

**Pass Criteria**
- All entry criteria for the phase are satisfied.
- No unresolved critical blocker from a predecessor phase.
- Decision authority has approved phase entry.

**Fail Criteria**
- Any entry criterion is unmet.
- A critical risk remains unowned or unmitigated.
- Required evidence is missing or inconclusive.

### Phase Exit Gate

**Purpose:** Ensure that a phase produces only accepted, validated deliverables before the next phase begins.

**Evidence Required**
- Completed deliverables with acceptance signatures.
- Validation reports demonstrating that exit criteria are met.
- Updated risk and issue log.
- Evidence traceable to the canonical source where applicable.

**Pass Criteria**
- All exit criteria are satisfied.
- All deliverables are accepted.
- No unresolved critical issues remain.
- Architecture authority confirms contract integrity where required.

**Fail Criteria**
- Any exit criterion is unmet.
- Deliverables are rejected or incomplete.
- Critical issues remain unresolved.
- Evidence is based on derived sources without canonical cross-reference.

### Architecture Gate

**Purpose:** Protect the canonical-source decision from arbitrary or conflicting changes.

**Evidence Required**
- Architecture decision record for any change to canonical sources, migration ordering, RPC naming, or generated artifacts.
- Impact assessment on downstream derived layers.
- Independent verification that the change does not create a new source of truth.

**Pass Criteria**
- The change preserves a single canonical source.
- Downstream impacts are identified and accepted.
- Architecture authority approves.

**Fail Criteria**
- The change introduces a second canonical source.
- Downstream impacts are undefined or unacceptable.
- Architecture authority rejects or requests revision.

### Contract Gate

**Purpose:** Ensure that the RPC contract between the service layer and the database remains intact.

**Evidence Required**
- RPC coverage report: invoked RPCs vs. migration-defined RPCs.
- Signature-comparison report for drift-prone functions.
- Service-layer wrapper inventory.

**Pass Criteria**
- 100% of invoked RPCs are defined in the canonical migration chain.
- Confirmed signature drift is reconciled or explicitly authorized.
- No production path relies on a missing function.

**Fail Criteria**
- Any invoked RPC is missing from the canonical migration chain.
- Signature drift remains unresolved.
- New code-only RPC names are introduced without canonical equivalents.

### Governance Gate

**Purpose:** Ensure that program governance remains unified and that status reporting reflects repository reality.

**Evidence Required**
- Unified program state.
- Decision and escalation log.
- Status-to-evidence traceability matrix.

**Pass Criteria**
- One official program state exists.
- No contradictory governance tracks remain active.
- Status claims are backed by evidence from the canonical source or accepted deliverables.

**Fail Criteria**
- Competing program status documents remain in use.
- Status claims contradict the canonical source without documented exception.
- Decision authority is unclear.

### Operational Trust Gate

**Purpose:** Ensure that the system can be deployed and operated with confidence in the canonical contract.

**Evidence Required**
- Deployment readiness evidence from a non-production environment.
- Environment parity report.
- CI gate evidence showing validation against the canonical source.
- Operational runbook references to canonical artifacts.

**Pass Criteria**
- Canonical migration chain applies deterministically.
- Generated artifacts are reproducible across environments.
- CI fails on divergence from the canonical source.
- Operational processes point to the canonical source.

**Fail Criteria**
- Deployment ordering errors occur.
- Environment drift from the canonical source is detected.
- CI validates derived artifacts against other derived artifacts.
- Operational runbooks reference outdated or non-canonical documents.

---

## 8. Deliverable Structure

The Recovery Program produces deliverables in the following categories. Each deliverable is an outcome, not a task list.

### Recovery Reports

Documents that record the current state, decisions, and reconciliation actions of the program. Examples include the Canonical Migration Chain Definition, Service-Layer Contract Consistency Report, and Environment Parity Report.

### Validation Reports

Evidence that quality gates have been passed. Examples include RPC Coverage Validation Evidence, CI Gate Evidence, and the Test-Audit Traceability Report.

### Canonical Contracts

Authoritative definitions derived from the canonical migration source. Examples include the Reconciled RPC Contract, the Generated Schema Artifact, and the Generated Type Artifacts.

### Generated Artifacts

Machine-derived outputs that must be regenerated from the canonical source rather than edited by hand. Examples include `schema.sql`, generated TypeScript types, and regenerated RPC contract documentation.

### Governance Deliverables

Documents that establish and maintain program control. Examples include the Program Governance Statement, Unified Program State, Decision & Escalation Log, and Scope-Change Control Procedure.

### Completion Evidence

The final package required to close the program. Examples include the Program Completion Statement, Final Evidence Package, Final Program State, and Transition Memo to Normal Development Governance.

---

## 9. Risk Management

The Recovery Program carries forward the strategic risks identified in the SCAR reports, Strategic Recovery Analysis, and Strategic Decision Report. No new risks are introduced by this master plan.

| Risk | Source Evidence | Strategic Impact |
|---|---|---|
| **Guaranteed runtime failures in production** | SDR §Strategic Risks; SCAR Phase 2 §Part 4; SCAR Phase 4 §SSOT Evidence Matrix #1–4 | Four production service paths call RPCs that migrations do not define. |
| **SSOT fragmentation** | SDR §Strategic Risks #2; SCAR Phase 4 §Executive Summary | No single artifact or layer can be trusted without cross-checking. |
| **False quality signals** | SDR §Strategic Risks #3; SCAR Phase 4 §SSOT Evidence Matrix #10–12 | Green tests and green CI mask missing database functions. |
| **Unsafe migration ordering** | SDR §Strategic Risks #4; SCAR Phase 1 §2.1 | A real-timestamp hotfix created today would execute before existing migrations, corrupting ordering. |
| **Unreliable governance and status reporting** | SDR §Strategic Risks #5; SCAR Phase 4 §SSOT Evidence Matrix #9 | Two official planning tracks report incompatible completion states. |
| **Compounding maintainability debt** | SDR §Strategic Risks #6; SCAR Phase 1 §2.3, §2.4, §2.5 | Naming chaos, orphan files, and absent rollbacks increase risk of every future change. |
| **Admin feature unreliability** | SDR §Strategic Risks #7; SCAR Phase 4 §SSOT Evidence Matrix #5 | Features marked complete are non-functional, undermining trust in admin tooling. |

Risk ownership, escalation, and mitigation are governed by the Governance Model in Section 6. The Program Manager maintains the risk register and escalates according to the defined paths.

---

## 10. Success Model

### Program Success

The Recovery Program is successful when the Program Completion Statement can be issued and substantiated: the migration chain is the single source of truth for the database contract; every service-layer RPC call is defined in that chain; tests, generated types, documentation, and governance are all derived from or reconciled with the canonical source; no critical contract drift remains; and the system is ready for normal, controlled feature development.

### Phase Success

A phase is successful when all of its entry criteria are met at the start, all of its exit criteria are met at the end, all deliverables are accepted, and the applicable quality gates are passed.

### Milestone Success

A milestone is successful when its defined acceptance conditions are satisfied by evidence from the canonical source or from accepted deliverables, and the Program Manager records formal acceptance.

### Recovery Success

Recovery success is achieved when the system is trustworthy: a green CI result and a passing test suite indicate that the production system will not fail on the previously known contract breaks, and governance status reflects repository reality without contradiction.

---

## 11. Program Completion

The Recovery Program officially closes when the exit criteria in `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` Section 8 are satisfied and the Program Completion Statement in Section 14 can be made in good faith.

### Closure Process

1. **Final Evidence Review.** The Program Manager assembles the final evidence package, including all phase exit evidence, quality-gate pass records, and validation reports.
2. **Architecture Authority Certification.** The architecture authority independently verifies that Single Source of Truth has been restored and that no unresolved critical inconsistencies remain between the canonical migration chain and any consuming layer.
3. **Program Completion Statement.** The Program Manager issues the formal statement that the program objectives have been achieved.
4. **Sponsor Acceptance.** The Program Sponsor reviews the evidence package and the Program Completion Statement, then formally accepts program closure.
5. **Transition.** Ongoing work is transferred to normal product development governance. The Recovery Program scope is closed; no further implementation work may be charged to it.

Upon closure, the system is considered restored to a trustworthy operating state, and normal feature development may resume under the standard engineering governance model.

---

**End of System Recovery Master Plan**
