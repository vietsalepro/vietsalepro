# System Recovery Program Charter

**Program:** VietSalePro v7 — System Recovery Program  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Approved for Establishment  
**Basis:** SCAR Phase 1–4 Reports, Strategic Decision Report (SDR), Strategic Recovery Analysis (SRA)  

---

## 1. Executive Summary

The Assessment Program was initiated because VietSalePro v7 had accumulated visible failures in admin, member, subscription, and storage management paths that could not be resolved through routine bug-fixing without producing further regressions.

SCAR discovered that the root cause is not faulty business logic or unstable architecture. The codebase retains a sound structural foundation: the database design is comprehensive, the service-to-database contract is largely intact, and the UI respects the service boundary. The failure is **Single Source of Truth (SSOT) fragmentation**. The system now exists in several conflicting versions simultaneously:

- **Migrations** define one set of database functions.
- **Service code** invokes four RPCs that migrations never define.
- **Documentation** marks features as complete that cannot execute.
- **Test mocks** implement the missing RPCs, making the test suite pass against a fictional contract.
- **Audit tooling** validates service code against a markdown contract instead of the migration chain.
- **Governance tracks** report incompatible completion states.

These contradictions are not isolated. They are systemic, and they guarantee that any future patch made inside the current environment risks producing new drift. The Recovery Program is therefore required to restore trust in the canonical contract between the database, services, tests, documentation, and governance before normal feature work can safely resume.

The strategic objective is to re-establish VietSalePro v7 as a trustworthy system whose migrations, code, tests, documentation, and program governance all describe the same application.

---

## 2. Program Mission

The mission of the System Recovery Program is to restore a trustworthy operating state for VietSalePro v7 by:

- Restoring a single, canonical source of truth for the database and RPC contract.
- Restoring architectural consistency across the migration, service, and UI layers.
- Restoring operational trust so that green tests, green CI, and green audit reports correspond to a functioning production system.
- Restoring governance consistency so that program status, plans, and work tracking reflect repository reality.
- Preserving the strong architectural foundation that SCAR identified; the program will not rebuild the application, but it will rebuild confidence in the contract that the application depends on.

---

## 3. Program Objectives

The Recovery Program will be measured against the following objectives. Each objective is stated in outcome terms; the program is responsible for achieving the state described, not for prescribing implementation tactics.

| Objective | Desired End State |
|---|---|
| Restore canonical migration chain | One ordered, gapless migration chain exists; no orphan SQL files claim authority outside it; the chain can accept real-timestamp hotfixes safely. |
| Restore RPC contract consistency | Every RPC invoked by service code is defined in the canonical migration chain; no production path relies on a missing function. |
| Restore service consistency | Service-layer names and signatures align with the canonical RPC contract; duplicate or misleading wrappers are reconciled. |
| Restore testing consistency | Tests validate behavior against the real canonical contract; mocks do not mask missing database functions. |
| Restore documentation consistency | Operational and architectural documentation describes the system that actually exists in the repository. |
| Restore governance consistency | One official program state exists; completion tracking reflects code reality rather than contradicting it. |
| Restore deployment trust | The migration chain can be applied deterministically to any environment. |
| Restore CI trust | Continuous integration gates compare derived artifacts against the canonical source, not against other derived artifacts. |

---

## 4. Program Scope

The Recovery Program includes all work necessary to re-establish a trustworthy contract between the canonical database source and every layer that consumes or validates it.

### In Scope

- **Migration consistency:** canonical migration chain, orphan SQL triage, timestamp ordering, naming standards, rollback coverage, baseline hygiene.
- **RPC contract consistency:** alignment between service-layer calls and migration-defined functions.
- **Schema contract:** a canonical, generated schema artifact derived from the migration chain.
- **Generated types:** type artifacts generated from the canonical schema source.
- **Service consistency:** reconciliation of service function names, signatures, and wrappers with the canonical RPC contract.
- **Testing consistency:** test mocks and assertions validated against the canonical contract.
- **Audit tooling:** operational scripts that verify derived layers against the canonical migration source.
- **Documentation consistency:** plans, contracts, logs, and reports that describe the actual system state.
- **Governance consistency:** a single program state that subordinate plans and tasks can reference.
- **Feature flag configuration:** ensuring the configured flags are consumed by the layers that depend on them.

### Scope Clarification

The program owns the *contract* between layers. It does not own the business features themselves, except where a feature is inoperable because the contract beneath it is broken. Work that changes business behavior requires separate product authorization.

---

## 5. Out of Scope

The following are explicitly excluded from the Recovery Program in order to prevent scope expansion and protect delivery focus:

- New product features or new user-facing capabilities.
- Performance optimization not required to restore contract trust.
- UI redesign or rebranding.
- Business logic redesign.
- Architecture redesign beyond contract-layer reconciliation.
- Security model redesign.
- Marketing, content, or commercial changes.
- Infrastructure migration or database vendor migration.
- Operational incident response outside the contract-reconciliation objective.
- Any work that would add new governance tracks, new master plans, or competing sources of program status.

Items in this list may be proposed for later programs once the Recovery Program is closed, but they may not be funded or executed under this charter.

---

## 6. Guiding Principles

All decisions, work packages, and approvals under this program shall be governed by the following principles:

1. **Migrations are canonical.** The ordered migration chain is the single source of truth for the database schema, RPC functions, RLS policies, triggers, and indexes.
2. **Generated artifacts are derived.** Schema dumps, generated types, and RPC contract summaries are produced from the canonical migration chain; they are not edited by hand.
3. **No duplicate contracts.** There shall be only one RPC contract. Markdown documents, test mocks, and service code must not maintain parallel contract definitions.
4. **Documentation follows implementation.** Status, plans, and contracts are updated to reflect repository reality; documentation may not claim completion that code does not support.
5. **Tests validate canonical behavior.** Tests and mocks are rebuilt from the canonical contract so that passing tests imply passing production.
6. **Governance reflects repository reality.** Program status, completion percentages, and sub-phase tracking are derived from the same source of truth that engineering uses.
7. **No manual synchronization.** Derived artifacts are regenerated by tooling, not maintained through human copying.
8. **Evidence before assumptions.** Every claim of completion or consistency must be supported by direct evidence from the canonical source.
9. **One Single Source of Truth.** At program completion, the migration chain, service code, tests, generated types, documentation, and governance all describe the same system.

---

## 7. Success Criteria

The Recovery Program will be considered successful when the following conditions are independently verifiable:

- **No contract drift:** every RPC invoked by service code is present in the canonical migration chain.
- **No missing RPC:** no production path calls a function that migrations do not define.
- **No orphan authority:** no SQL file outside the canonical migration chain is treated as a source of schema truth.
- **Documentation matches implementation:** all active plans, contracts, and reports describe the system that exists in the repository.
- **Governance matches implementation:** the official program state and sub-phase tracking do not contradict each other or the repository.
- **Tests validate real contracts:** test mocks and assertions are derived from the canonical migration source.
- **Audit validates canonical source:** the operational audit compares derived code against the migration chain, not against another derived document.
- **Single Source of Truth restored:** one canonical source exists for each contract layer, and every derived layer is regenerated from it.
- **System is trustworthy:** a green CI result and a passing test suite indicate that the production system will not fail on the previously known contract breaks.

---

## 8. Exit Criteria

The Recovery Program officially finishes when all of the following are satisfied:

1. All strategic objectives stated in Section 3 are complete.
2. Single Source of Truth is restored across migrations, services, tests, generated types, documentation, and governance.
3. No unresolved critical inconsistencies remain between the canonical migration chain and any consuming layer.
4. Governance is synchronized: one program state exists and it is consistent with repository reality.
5. Operational trust is restored: CI and audit gates validate against the canonical source.
6. The Program Manager formally accepts completion and issues the Program Completion Statement defined in Section 14.

No implementation work, feature work, or out-of-scope activity may be charged to the Recovery Program after these criteria are met.

---

## 9. Program Governance

### Decision Authority

- The **Program Sponsor** authorizes the charter, approves scope changes, and resolves business-level constraints.
- The **Program Manager** owns day-to-day program execution, accepts deliverables, and declares program completion.
- The **Chief Technology Officer / Enterprise Solution Architect** holds architecture authority and is the final arbiter of contract-layer decisions.
- Engineering teams execute approved work packages under the direction of the Program Manager and within the architecture authority.

### Architecture Authority

All decisions about canonical sources, migration ordering, RPC naming, generated artifacts, and contract boundaries require approval from the architecture authority. No derived layer may be promoted to canonical status without explicit architecture approval.

### Change Approval

- In-scope recovery work follows the program's internal prioritization and does not require a separate change board unless it affects an out-of-scope area.
- Any proposed change that would expand scope, alter business behavior, modify infrastructure, or add new dependencies must be submitted to the Program Sponsor for approval.

### Evidence Requirements

Every claim of completion, consistency, or readiness must be supported by reproducible evidence from the canonical source. Assertions based on documentation, test output, or governance status alone are insufficient unless they are cross-referenced to the migration chain.

### Risk Management

Risks are owned by the Program Manager, escalated to the Program Sponsor when they threaten scope, budget, or business continuity, and to the architecture authority when they threaten contract integrity.

### Scope Control

The Program Manager is responsible for enforcing the in-scope / out-of-scope boundaries. Scope expansion requests must be documented, assessed against the charter, and approved before being accepted.

### Escalation

- Technical contract disputes → architecture authority.
- Resource, schedule, or business constraint disputes → Program Sponsor.
- Scope or out-of-scope boundary disputes → Program Sponsor, with architecture input.
- Cross-team execution blockers → Program Manager.

---

## 10. Program Constraints

The Recovery Program operates under the following constraints:

- **No uncontrolled refactoring.** Refactoring is permitted only when it is necessary to restore contract consistency and has been approved by the architecture authority.
- **No parallel architecture redesign.** The program may not replace the existing RPC-heavy facade, service boundary, or RLS model.
- **No undocumented migration.** Every change to the canonical migration chain must be traceable through the migration mechanism.
- **No bypassing canonical sources.** Service code, tests, documentation, and governance may not create new sources of contract truth.
- **No duplicate governance.** Only one official program state and one official plan set may be active during the program.
- **No implementation outside approved scope.** Work packages must map to an in-scope objective.
- **No manual synchronization of derived artifacts.** Generated artifacts must be produced by tooling from the canonical source.
- **No new feature work under recovery budget.** Feature requests must be deferred to a subsequent program unless explicitly approved by the Program Sponsor.
- **No deployment to production without contract validation.** Any deployment during the program must be preceded by validation against the canonical migration source.

---

## 11. Program Risks

The following strategic risks are carried into the Recovery Program from the SCAR and SRA assessments. No new risks have been introduced by this charter.

| Risk | Source Evidence | Impact |
|---|---|---|
| Guaranteed runtime failures in production | SDR §Strategic Risks #1; SCAR Phase 2 §Part 4; SCAR Phase 4 §SSOT Evidence Matrix #1–4 | Four production service paths call RPCs that migrations do not define. |
| SSOT fragmentation | SDR §Strategic Risks #2; SCAR Phase 4 §Executive Summary | No single artifact or layer can be trusted without cross-checking. |
| False quality signals | SDR §Strategic Risks #3; SCAR Phase 4 §SSOT Evidence Matrix #10–12 | Green tests and green CI mask missing database functions. |
| Unsafe migration ordering | SDR §Strategic Risks #4; SCAR Phase 1 §2.1 | A real-timestamp hotfix created today would execute before 84 existing migrations. |
| Unreliable governance and status reporting | SDR §Strategic Risks #5; SCAR Phase 4 §SSOT Evidence Matrix #9 | Two official planning tracks report incompatible completion states. |
| Compounding maintainability debt | SDR §Strategic Risks #6; SCAR Phase 1 §2.3, §2.4, §2.5 | Naming chaos, orphan files, and absent rollbacks increase risk of every future change. |
| Admin feature unreliability | SDR §Strategic Risks #7; SCAR Phase 4 §SSOT Evidence Matrix #5 | Features marked complete are non-functional, undermining trust in admin tooling. |

---

## 12. Program Assumptions

This charter is based solely on assumptions already supported by the SCAR Phase 1–4 reports, the Strategic Decision Report, and the Strategic Recovery Analysis.

- The core architecture is sound and does not require replacement. (SDR §Current Architecture State; SRA §Strategic Recoverability)
- The database migrations are the strongest available canonical source for schema and RPC truth. (SCAR Phase 4 §Canonical Sources; SCAR Phase 1 §6.1)
- The four missing RPCs can be reconciled without altering the underlying business model. (SDR §Strategic Strengths; SRA §Recovery Classification DB-1)
- The contradictions between documentation, governance, tests, and migrations are recoverable through a controlled program rather than through continued ad-hoc bug fixing. (SDR §Final Strategic Decision; SRA §Strategic Recoverability)
- Deployment environments will require coordination before migration chain changes are applied. (SRA §Recovery Classification DB-2)
- No additional assessment is required; the SCAR evidence is sufficient to direct recovery. (SRA §Confidence)

---

## 13. Program Deliverables

The Recovery Program will produce the following high-level deliverables. This list defines outcomes, not implementation tasks or sprint work.

1. **Canonical Migration Chain.** A single, ordered, gapless set of migrations that is accepted as the source of truth for the database contract.
2. **Reconciled RPC Contract.** A service-layer contract in which every invoked RPC maps to a migration-defined function.
3. **Canonical Schema Artifact.** A generated schema representation derived from the migration chain.
4. **Generated Type Artifacts.** Type definitions generated from the canonical schema artifact.
5. **Validated Test Base.** Tests and mocks rebuilt against the canonical contract so that passing tests reflect production viability.
6. **Canonical Audit Gate.** An operational audit that compares derived code against the migration chain.
7. **Reconciled Documentation Set.** Plans, contracts, and reports updated to describe the actual repository state.
8. **Unified Program State.** One official governance artifact that tracks recovery completion and is consistent with the repository.
9. **Program Closure Record.** The Program Completion Statement and evidence package required to formally close the program.

---

## 14. Program Completion Statement

The Recovery Program is complete when the following statement can be made and substantiated:

> "VietSalePro v7 has been restored to a trustworthy operating state. The migration chain is the single source of truth for the database contract. Every service-layer RPC call is defined in that chain. Tests, generated types, documentation, and governance are all derived from or reconciled with the canonical source. No critical contract drift remains. The system is ready for normal, controlled feature development."

This statement shall be issued by the Program Manager after verifying that all exit criteria in Section 8 are satisfied and after the architecture authority confirms that Single Source of Truth has been restored.

---

**End of Charter**
