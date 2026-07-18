# CURRENT_TASK-031 Program Authorization

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 5 — Documentation & Derived Artifact Reconciliation  
**Milestone:** M5.2 — Regenerated RPC Contract Documentation  
**Document Type:** Program Authorization  
**Date:** 2026-07-17  
**Status:** PROPOSED — Pending Program Manager Approval  
**Authorizing Role:** Program Manager / Architecture Authority  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md`, `PHASE5_OPENING_AUTHORIZATION.md`, `CURRENT_TASK-030_PROGRAM_AUTHORIZATION.md`, `CURRENT_TASK-030_ENGINEERING_KICKOFF.md`, `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md`, `CURRENT_TASK-030_ACCEPTANCE_REVIEW.md`, `CURRENT_TASK-030_PROGRAM_STATUS_REVIEW.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `docs/admin-dashboard/RPC_CONTRACTS.md`, `supabase/migrations/*.sql`

---

## 1. Executive Summary

This document requests Program Authorization for `CURRENT_TASK-031`, Phase 5 Milestone **M5.2 — Regenerated RPC Contract Documentation**. The objective is to regenerate the derived RPC contract documents from the canonical migration chain, cross-check them against service-layer RPC call sites, and restore a trustworthy, single-source-of-truth contract surface.

`CURRENT_TASK-030` (M5.1) produced `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md`, identifying that `D-P3-01_Reconciled_RPC_Contract.md` and `docs/admin-dashboard/RPC_CONTRACTS.md` are stale relative to the canonical `supabase/migrations/*.sql` chain. The M5.1 disposition plan explicitly recommends regenerating these two artifacts from the canonical source. This authorization locks the next work unit to that regeneration only.

This is a governance authorization. It does not perform engineering work, does not regenerate any file, and does not authorize implementation.

---

## 2. Authorization Decision

| Item | Value |
|---|---|
| **Task ID** | **CURRENT_TASK-031** |
| **Milestone** | **M5.2 — Regenerated RPC Contract Documentation** |
| **Phase** | **Phase 5 — ACTIVE** |
| **Previous Task** | **CURRENT_TASK-030 — CLOSED WITH OBSERVATIONS** |
| **Objective** | Regenerate `D-P3-01_Reconciled_RPC_Contract.md` and `docs/admin-dashboard/RPC_CONTRACTS.md` using only `supabase/migrations/*.sql` as the canonical source, and cross-check the regenerated surface against service-layer RPC call sites. |
| **Target Artifacts** | `D-P3-01_Reconciled_RPC_Contract.md`, `docs/admin-dashboard/RPC_CONTRACTS.md` |
| **Change Type** | Regeneration of derived documentation from canonical source |
| **Implementation** | **NOT AUTHORIZED** by this document |
| **Architecture Decision** | **NOT AUTHORIZED** by this document |

This document authorizes **one** `CURRENT_TASK` and **one** Phase 5 milestone only. No other work is approved.

---

## 3. Program Health

| Item | State |
|---|---|
| **Phase** | Phase 5 — ACTIVE |
| **Milestone** | M5.1 — Complete with observations; M5.2 — OPEN |
| **Previous Task** | CURRENT_TASK-030 — CLOSED WITH OBSERVATIONS |
| **Program Health** | HEALTHY |
| **Governance Transition** | COMPLETE |
| **Critical Blockers** | None technical |
| **Observation** | M5.1 disposition-plan acceptance by the Program Manager is the only remaining governance gate; the plan is already assessed as ready for acceptance and sufficient as input to M5.2. |

---

## 4. Prerequisite Verification

| # | Verification Item | Finding |
|---|---|---|
| 1 | `CURRENT_TASK-030` completed governance correctly | **PASS.** The task produced `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md`, stayed inside inventory/disposition scope, and did not modify source code, migrations, database, tests, or RPC definitions. |
| 2 | Program Status concluded `CURRENT_TASK-030` CLOSED WITH OBSERVATIONS | **PASS.** `CURRENT_TASK-030_PROGRAM_STATUS_REVIEW.md` §9 and §12 record **CLOSED WITH OBSERVATIONS**. |
| 3 | M5.1 achieved Complete with observations | **PASS.** `CURRENT_TASK-030_PROGRAM_STATUS_REVIEW.md` §12 records **M5.1 — Complete with observations**. |
| 4 | Disposition Plan sufficient as input to M5.2 | **PASS.** `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md` §6 and §10.1 explicitly recommend regenerating `D-P3-01_Reconciled_RPC_Contract.md` and `docs/admin-dashboard/RPC_CONTRACTS.md` from the canonical migration chain. `CURRENT_TASK-030_PROGRAM_STATUS_REVIEW.md` §8 confirms the disposition plan is ready for Program Manager acceptance. |
| 5 | Phase 5 scope confirmed | **PASS.** `CURRENT_PHASE.md` §1 and `PHASE5_OPENING_AUTHORIZATION.md` §7 place `CURRENT_TASK-031` inside M5.2, which is inside Phase 5 scope. |
| 6 | Master Plan alignment | **PASS.** `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 5 includes RPC contract documentation reconciliation; `PHASE5_OPENING_AUTHORIZATION.md` §7 defines M5.2 as "RPC contract documentation regenerated." |
| 7 | Canonical source readiness | **PASS.** `supabase/migrations/*.sql` (138 forward-migration files) is the accepted canonical source. `scripts/audit-rpc-contracts.ts` reads the migration chain directly and is available for reuse. |
| 8 | No unresolved governance blocker | **PASS — with observation.** The only procedural gate is pending Program Manager acceptance of the M5.1 disposition plan. No technical or governance blocker exists. |

---

## 5. Scope Definition

### 5.1 In-Scope

- Regenerate `D-P3-01_Reconciled_RPC_Contract.md` from the canonical migration chain.
- Regenerate `docs/admin-dashboard/RPC_CONTRACTS.md` from the canonical migration chain.
- Use `supabase/migrations/*.sql` as the **only** canonical source for RPC definitions, signatures, grants, and RLS policy references.
- Cross-check the regenerated RPC surface against service-layer RPC call sites (e.g., `services/**/*.ts`, `services/**/*.tsx`).
- Identify and record any RPC name or signature mismatch between the regenerated contract and the service layer.
- Produce a short reconciliation note describing how the regenerated documents differ from the previous versions and why.

### 5.2 Out-of-Scope

- Source code changes.
- Database changes.
- Migration file changes.
- Test file changes.
- RPC implementation changes.
- Audit fixes or runbook updates.
- Feature-flag work.
- M5.3 — Program Logs & Reports Updated.
- M5.4 — Feature-Flag Configuration Traceability Record.
- M5.5 — Phase 5 Exit Gate.
- Phase 6, Phase 7, or any work outside Phase 5.
- Any commit, push, or source-code modification performed by this authorization.

---

## 6. Dependencies

| # | Dependency | State |
|---|---|---|
| 1 | `CURRENT_TASK-030_PROGRAM_AUTHORIZATION.md` approved | **Complete.** |
| 2 | `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md` produced and accepted by Program Manager | **Draft — accepted as sufficient input for M5.2 authorization.** Formal Program Manager acceptance is the final gate. |
| 3 | `CURRENT_TASK-030_ACCEPTANCE_REVIEW.md` verdict PASS WITH OBSERVATIONS | **Complete.** |
| 4 | `CURRENT_TASK-030_PROGRAM_STATUS_REVIEW.md` verdict CLOSED WITH OBSERVATIONS | **Complete.** |
| 5 | `PHASE5_OPENING_AUTHORIZATION.md` accepted and Phase 5 formally opened | **Complete.** |
| 6 | `CURRENT_PHASE.md` and `UNIFIED_PROGRAM_STATE.md` record Phase 5 as active | **Complete.** |
| 7 | Canonical migration chain `supabase/migrations/*.sql` stable and accessible | **Complete.** |
| 8 | Service-layer RPC call-site inventory available | **Complete.** `D-P3-02_Service_Layer_Contract_Consistency_Report.md` and `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md` §9.9 provide evidence. |
| 9 | Architecture authority available to accept regenerated D-P5-02 | **Required before acceptance.** |
| 10 | `D-P3-01_Reconciled_RPC_Contract.md` and `docs/admin-dashboard/RPC_CONTRACTS.md` exist as targets | **Complete.** |

---

## 7. Deliverables

| # | Deliverable | Maps to Master Plan Deliverable |
|---|---|---|
| 1 | **Regenerated `D-P3-01_Reconciled_RPC_Contract.md`** | D-P5-02 — Regenerated RPC Contract Document |
| 2 | **Regenerated `docs/admin-dashboard/RPC_CONTRACTS.md`** | D-P5-02 — Regenerated RPC Contract Document |
| 3 | **Service-Layer RPC Call-Site Cross-Check Report** (inline or separate) | D-P5-02 / D-P5-03 — evidence that regenerated contract matches service-layer usage |
| 4 | **Reconciliation Note** describing changes from prior contract versions | D-P5-01 — Reconciled Documentation Set (input) |

---

## 8. Acceptance Criteria

`CURRENT_TASK-031` is accepted when:

1. `D-P3-01_Reconciled_RPC_Contract.md` is regenerated from `supabase/migrations/*.sql` and reflects the canonical RPC surface.
2. `docs/admin-dashboard/RPC_CONTRACTS.md` is regenerated from the same canonical source.
3. Every RPC listed in the regenerated documents exists in the ordered migration chain.
4. Service-layer RPC call sites are cross-checked against the regenerated contract; any mismatch is documented with severity and proposed disposition.
5. No derived document is treated as canonical over the migration chain.
6. No source code, migration, database, test, or RPC implementation file is modified by this task.
7. The regenerated contract is accepted by the **Architecture Authority**.
8. No unresolved Phase 5 governance blocker remains.

---

## 9. Exit Criteria

The following must be true before `CURRENT_TASK-031` is closed:

1. Both target contract documents are regenerated and consistent with the canonical migration chain.
2. Service-layer call-site cross-check is complete.
3. D-P5-02 is accepted by the architecture authority.
4. Phase 5 exit criterion **EC-2** (RPC contract documentation is derived from or validated against the canonical migration chain) is satisfied.
5. No unresolved critical or high-severity contract mismatch remains.
6. The task produces no modifications outside the two target markdown documents and optional cross-check/reconciliation evidence files.

---

## 10. Risk Assessment

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | `D-P3-01_Reconciled_RPC_Contract.md` (accepted deliverable) is accidentally used as canonical source instead of the migration chain. | Medium | High | Enforce `supabase/migrations/*.sql` as the only canonical source; architecture authority must review derivation method. |
| 2 | Service-layer call sites reference RPC names or signatures that are missing or divergent from the canonical migration chain. | Medium | High | Cross-check every `.rpc(` call in `services/`; document mismatches rather than silently patch. |
| 3 | Regeneration tool or script produces output in a format that is inconsistent with existing contract documents. | Low | Medium | Reuse `scripts/audit-rpc-contracts.ts` or an existing generator from the repo; preserve document structure where possible. |
| 4 | Scope creep into fixing source code, migrations, or tests to resolve mismatches. | Medium | High | This authorization explicitly excludes implementation; mismatches found must be filed for a future `CURRENT_TASK`, not fixed here. |
| 5 | M5.1 disposition plan not formally accepted before M5.2 Engineering Kickoff begins. | Low | Medium | This authorization is conditional on disposition-plan acceptance; Engineering Kickoff must not proceed until that gate is closed. |
| 6 | Regenerated contract contradicts accepted UI or service behavior because migration chain itself is incomplete. | Low | High | Architecture authority reviews and accepts D-P5-02; any canonical-source gap is escalated, not papered over. |

---

## 11. Final Authorization Decision

| | |
|---|---|
| **Proposed by** | Program Governance |
| **Decision** | **AUTHORIZE CURRENT_TASK-031 — M5.2 Regenerated RPC Contract Documentation** |
| **Condition** | Formal Program Manager acceptance of the M5.1 disposition plan is completed before Engineering Kickoff. |
| **Date** | 2026-07-17 |
| **Next Step** | Await Program Manager approval, then proceed to `CURRENT_TASK-031_ENGINEERING_KICKOFF.md` (which is not authorized by this document). |

```text
AUTHORIZED — PENDING PROGRAM MANAGER SIGN-OFF
```

---

*Approved scope is locked to M5.2 / D-P5-02. Any deviation from regenerating the two RPC contract documents from the canonical migration chain requires a new Program Authorization.*
