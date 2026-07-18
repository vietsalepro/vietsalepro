# P3-01 — Phase 3 Initiation Assessment

**Program:** VietSalePro v7 — System Recovery Program  
**Deliverable ID:** P3-01  
**Title:** Phase 3 Initiation Assessment — RPC Contract Reconciliation  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Proposed — Pending Program Manager Approval  
**Document Type:** Phase initiation assessment

---

## 1. Executive Summary

This assessment verifies the readiness of the VietSalePro v7 System Recovery Program to enter **Phase 3 — RPC Contract Reconciliation** and identifies the first deliverable required by `SYSTEM_RECOVERY_MASTER_PLAN.md`.

**Determined first deliverable of Phase 3:** **D-P3-01 — Reconciled RPC Contract**.

The Master Plan defines Phase 3's purpose as ensuring every RPC invoked by the service layer is defined in the canonical migration chain and that the service-layer contract surface is unambiguous. The SCAR Phase 2 Report already provides the required service-layer RPC inventory: **181 unique RPCs** invoked across the service layer, with **4 confirmed missing RPCs** (P0 contract breaks) and contained signature/naming drift.

**Decision:** **PASS WITH OBSERVATIONS**. The first Phase 3 deliverable can be unambiguously identified from the Master Plan, and the SCAR Phase 2 inventory satisfies the prerequisite RPC-call-site evidence. However, the repository's formal phase markers and Phase 2 deliverables have not yet recorded the final acceptance evidence required for Phase 3 entry. Phase 3 engineering work must not be authorized until those formal acceptance gaps are closed.

---

## 2. Phase 3 Objective

Per `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 "Recovery Phases — Phase 3 — RPC Contract Reconciliation":

> Ensure that every RPC invoked by the service layer is defined in the canonical migration chain, and that the service-layer contract surface is unambiguous.

The objective is contract reconciliation, not feature development. Phase 3 restores trust that production service code calls only functions that the canonical migration chain actually defines, and that any intentional divergence is explicitly documented as a separate canonical function rather than hidden in service-layer wrappers or aliases.

---

## 3. Entry Criteria Review

`SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 3 lists the following entry criteria:

| # | Entry Criterion | Evidence Reviewed | Status | Finding |
|---|---|---|---|---|
| EC-1 | Phase 2 exit criteria are satisfied. | `D-P2-01`, `D-P2-02`, `D-P2-03`, `D-P2-04`, `MIGRATION_NAMING_AND_ORDERING_STANDARD.md`, `PHASE2_DELIVERABLE_ACCEPTANCE_MATRIX.md`. | **NOT VERIFIED** | Phase 2 deliverables are marked "Proposed — Pending Program Manager Approval." No `PHASE2_ACCEPTANCE_RECORD.md` exists. `CURRENT_PHASE.md` still lists Phase 1 as the active phase. |
| EC-2 | A complete inventory of service-layer RPC call sites is available (SCAR Phase 2). | `SCAR_PHASE2_REPORT.md` §1–§3. | **SATISFIED** | Full enumeration: 188 call-sites, 181 unique RPCs, 177 matched, 4 missing P0 breaks. |
| EC-3 | The canonical migration chain and generated schema artifact are accepted. | `D-P2-01_Canonical_Migration_Chain_Definition.md`, `D-P2-03_Generated_Schema_Artifact.md`. | **NOT VERIFIED** | Documents exist and claim reproducibility/traceability, but their headers still state "Proposed — Pending Program Manager Approval"; no acceptance record found. |

**Entry Criteria Verdict:** **CONDITIONALLY NOT MET**. The RPC inventory prerequisite is satisfied, but formal Phase 2 exit/acceptance evidence is not yet recorded in the repository. This is an observation, not a blocker to documenting the first deliverable, but it is a blocker to authorizing Phase 3 implementation work.

---

## 4. Deliverable Inventory

Per `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 3 "Deliverables":

| # | Deliverable ID | Deliverable Name | Purpose | Acceptance Authority |
|---|---|---|---|---|
| 1 | **D-P3-01** | **Reconciled RPC Contract** | Establish an unambiguous, migration-backed contract surface for every service-layer RPC. | Architecture Authority, with Program Manager acceptance |
| 2 | D-P3-02 | Service-Layer Contract Consistency Report | Document the state of every service call site relative to the reconciled contract. | Program Manager, with architecture authority input |
| 3 | D-P3-03 | RPC Coverage Validation Evidence | Provide reproducible evidence that invoked RPCs ⊆ defined RPCs in the canonical migration chain. | Architecture Authority |
| 4 | D-P3-04 | Migration Updates Required for Contract Gaps | Identify canonical migration changes needed to close contract gaps, framed as contract changes only (not implementation instructions). | Architecture Authority |

---

## 5. First Deliverable Identification

**First deliverable of Phase 3: D-P3-01 — Reconciled RPC Contract.**

### 5.1 Why This Is the First Deliverable

1. **Sequential dependency.** The Service-Layer Contract Consistency Report (D-P3-02) requires a defined reconciled contract against which to measure consistency.
2. **Evidence dependency.** RPC Coverage Validation Evidence (D-P3-03) cannot be produced until the set of canonical RPC names and signatures is fixed.
3. **Contract-first rule.** Per the Master Plan §2 "Execution Strategy", the program recovers **contracts before code behavior**. The Reconciled RPC Contract is the contract artifact that gates any subsequent service-code or migration change.
4. **Master Plan ordering.** The Master Plan lists the Reconciled RPC Contract first in the Phase 3 deliverables list, reflecting the contract-before-derivatives principle.

### 5.2 What D-P3-01 Must Contain

Based on Phase 3 scope and exit criteria, D-P3-01 must define:

- The canonical set of RPC functions invoked by production service code.
- For each RPC: canonical name, parameter signature, return shape, and the migration file that defines it.
- Resolution decisions for the 4 confirmed missing RPCs (`admin_update_subscription`, `get_member_with_email`, `search_members_by_email`, `get_storage_usage`).
- Resolution decisions for signature drift (e.g., `admin_update_subscription` `p_max_storage_gb` parameter vs. canonical `update_tenant_subscription`).
- Resolution decisions for duplicate wrappers (e.g., `getUsageSummary` / `getTenantUsageSummary`).
- Resolution decisions for alias patterns that shadow canonical names.
- A ruling on whether the `services/admin/systemAdminService.ts` facade barrel is an acceptable contract-surface expansion or must be collapsed.

### 5.3 Authority

- **Architecture Authority** owns the technical content of the reconciled contract.
- **Program Manager** accepts D-P3-01 as the official Phase 3 contract baseline.

---

## 6. Acceptance Criteria

D-P3-01 will be accepted when all of the following are true:

1. Every production service-layer RPC call site is mapped to either:
   - a canonical migration-defined function, or
   - a formally named new canonical function to be added to the migration chain.
2. The 4 missing RPCs identified in `SCAR_PHASE2_REPORT.md` are dispositioned (rename to canonical, add new canonical function, or remove service call).
3. Confirmed signature drift is resolved by either:
   - aligning the service call to the canonical signature, or
   - defining a new canonical function with the divergent signature and updating the service call to use it.
4. Duplicate or ambiguous service wrappers are resolved into a single canonical contract surface.
5. Alias patterns that shadow canonical names are documented with their rationale or removed.
6. The contract artifact references only the canonical migration chain (`supabase/migrations`) as the source of truth.
7. The artifact is versioned, dated, and approved by the Architecture Authority and accepted by the Program Manager.

---

## 7. Required Evidence

| Evidence | Purpose | Source |
|---|---|---|
| Service-layer RPC inventory | Prove all call sites are considered. | `SCAR_PHASE2_REPORT.md` §1–§3 |
| Migration-defined function inventory | Prove the canonical RPC surface. | `D-P2-03_Generated_Schema_Artifact.md` / `supabase/schema.sql` and `D-P2-04_Generated_Type_Artifacts.md` |
| Mapping matrix (called RPC → defined RPC) | Prove coverage or identify gaps. | To be produced under D-P3-01/D-P3-02 |
| Resolution log for each missing/drifted RPC | Prove every gap has a contract decision. | D-P3-01 appendix |
| Architecture Authority approval | Confirm technical contract decisions preserve the service boundary. | D-P3-01 sign-off |
| Program Manager acceptance | Confirm D-P3-01 is the official Phase 3 baseline. | D-P3-01 sign-off |

---

## 8. Scope

### 8.1 In Scope for Phase 3 (per Master Plan)

- All service-layer RPC call sites.
- Missing RPCs that cause guaranteed runtime failures.
- Signature drift between service calls and canonical migration functions.
- Duplicate or ambiguous service wrappers.
- Alias or re-export patterns that shadow canonical names.

### 8.2 In Scope for This Initiation Assessment

- Identify Phase 3 objective, deliverables, entry criteria, acceptance criteria, and required evidence.
- Verify the availability of the SCAR Phase 2 RPC inventory.
- Identify the first deliverable (D-P3-01).
- Record observations about Phase 2 formal exit status.

---

## 9. Out-of-Scope

### 9.1 Out of Scope for Phase 3 (per Master Plan)

- UI, React, or component-layer changes.
- Feature development.
- Architecture redesign.
- Operational deployment.
- Test-base realignment (Phase 4).
- Documentation reconciliation beyond the RPC contract (Phase 5).

### 9.2 Out of Scope for This Initiation Assessment

- Any RPC implementation, migration editing, or service-code change.
- Generating schema or type artifacts.
- Creating engineering work packages or `CURRENT_TASK` documents.
- Re-running the SCAR Phase 2 inventory.
- Modifying `CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md`, or any phase marker.

---

## 10. Findings

### 10.1 First Deliverable Is Unambiguous

`SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 3 lists **Reconciled RPC Contract** as Deliverable 1, and the contract-first principle makes it the necessary predecessor to all other Phase 3 deliverables. D-P3-01 is therefore the correct first deliverable.

### 10.2 RPC Inventory Prerequisite Is Satisfied

`SCAR_PHASE2_REPORT.md` provides a complete service-layer RPC inventory (188 call-sites, 181 unique RPCs) and identifies the exact contract breaks that D-P3-01 must resolve:

| RPC | Service Function(s) | File | Status | Canonical Equivalent / Gap |
|---|---|---|---|---|
| `admin_update_subscription` | `updateSubscriptionLimits` | `services/tenantService.ts:481` | MISSING P0 | `update_tenant_subscription` exists; signature drift on `p_max_storage_gb` |
| `get_member_with_email` | `getMemberWithEmail` | `services/tenantService.ts:591` | MISSING P0 | `get_tenant_members_with_email` exists (plural) |
| `search_members_by_email` | `searchMembers` | `services/tenantService.ts:610` | MISSING P0 | `search_tenant_members` exists |
| `get_storage_usage` | `getStorageUsage`, `getTenantStorageUsage` | `services/tenantService.ts:1009,1017` | MISSING P0 | No DB support identified |

### 10.3 Phase 2 Formal Exit Evidence Is Missing

The following observations affect Phase 3 entry but do not change the identity of D-P3-01:

1. `CURRENT_PHASE.md` (effective 2026-07-14) still declares **Phase 1** as the active phase and states "no Phase 2 activities may begin" until Phase 1 exit is recorded. `PHASE1_ACCEPTANCE_RECORD.md` does record Phase 1 exit, so the marker file is stale.
2. Phase 2 deliverables (`D-P2-01` through `D-P2-04`, `MIGRATION_NAMING_AND_ORDERING_STANDARD.md`) are all marked **"Proposed — Pending Program Manager Approval"**.
3. `PHASE2_DELIVERABLE_ACCEPTANCE_MATRIX.md` is also **"Proposed — Pending Program Manager Approval"** and its acceptance table is empty.
4. `D-P2-05_Acceptance_Review.md` concluded **PASS WITH OBSERVATIONS** due to missing Program Manager acceptance and engineering acknowledgment evidence.
5. No `PHASE2_ACCEPTANCE_RECORD.md` exists in the repository.

### 10.4 Implication

The technical prerequisites for Phase 3 work (canonical chain, schema artifact, RPC inventory) exist as artifacts, but the governance gating documents (Phase 2 acceptance record, updated phase marker) do not. Phase 3 engineering implementation must not proceed until the Program Manager formally accepts Phase 2 exit.

---

## 11. Decision

**PASS WITH OBSERVATIONS**

- **PASS:** The first deliverable of Phase 3 is definitively identified as **D-P3-01 — Reconciled RPC Contract**, consistent with `SYSTEM_RECOVERY_MASTER_PLAN.md` and the contract-first execution strategy. The SCAR Phase 2 RPC inventory provides the necessary call-site evidence.
- **OBSERVATION:** Formal Phase 2 exit acceptance is not yet recorded in the repository. Before any Phase 3 `CURRENT_TASK` or implementation is authorized, the Program Manager should:
  1. Accept or reject each Phase 2 deliverable per `PHASE2_DELIVERABLE_ACCEPTANCE_MATRIX.md`.
  2. Publish a `PHASE2_ACCEPTANCE_RECORD.md` documenting Phase 2 exit.
  3. Update `CURRENT_PHASE.md` to reflect Phase 2 closure and Phase 3 entry.

No Phase 3 implementation, RPC modification, migration change, or service change is authorized by this assessment.

---

*Phase 3 Initiation Completed.*
