# D-P3-03 — RPC Coverage Validation Evidence

**Program:** VietSalePro v7 — System Recovery Program  
**Deliverable ID:** D-P3-03  
**Title:** RPC Coverage Validation Evidence  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Proposed — Pending Architecture Authority / Program Manager Review  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `D-P3-02_Service_Layer_Contract_Consistency_Report.md`

---

## 1. Executive Summary

This deliverable provides independent validation evidence that the production service-layer RPC surface has been reconciled against the canonical migration chain as required by Phase 3 of the System Recovery Master Plan.

| Validation Area | Result |
|---|---|
| Coverage check (invoked RPCs ⊆ canonical functions) | **FAIL** — 178 of 182 unique invoked RPCs match canonical functions; 4 do not. |
| D-P3-01 internal consistency | PASS — figures are arithmetically consistent. |
| D-P3-01 ↔ D-P3-02 consistency | PASS — key metrics are identical and non-contradictory. |
| Phase 3 exit criteria | **FAIL** — two exit criteria are not satisfied because 4 RPCs remain missing and 1 signature drift plus 1 wrapper duplication remain unresolved. |

**Validation Decision: FAIL.**

The reconciliation work performed in D-P3-01 and D-P3-02 is thorough, traceable, and materially correct: 97.8% of invoked RPCs are covered by the canonical migration chain. However, the Phase 3 exit criteria are strict (`every RPC maps`, `no production path calls a missing function`, `signature drift resolved`, `duplicate wrappers resolved`, `alias patterns documented or removed`). Because four production RPC calls have no canonical definition, one subscription RPC carries an unresolved parameter mismatch, and one wrapper duplication remains unmerged, the phase cannot be accepted as complete on the basis of the current evidence.

The failure is scoped and localized; it does not indicate a systemic collapse of the service-layer contract discipline. All remaining items are identified and traceable in D-P3-01 and D-P3-02.

---

## 2. Validation Scope

### 2.1 In Scope

- Independent re-check of the RPC coverage figures published in `D-P3-01_Reconciled_RPC_Contract.md`.
- Independent re-check of the service-layer consistency findings published in `D-P3-02_Service_Layer_Contract_Consistency_Report.md`.
- Verification that invoked RPCs are a subset of canonical migration functions.
- Verification that D-P3-01 and D-P3-02 are mutually consistent.
- Validation of each Phase 3 exit criterion from `SYSTEM_RECOVERY_MASTER_PLAN.md` against the evidence in D-P3-01 and D-P3-02.
- Enumeration of known remaining gaps already identified in D-P3-01 / D-P3-02.

### 2.2 Out of Scope

- Any new scan, new tooling, new call-site extraction, or new source-code review beyond what D-P3-01 and D-P3-02 already performed.
- Business-logic review, UI review, migration quality review, or schema design review.
- Generation of engineering work packages, `CURRENT_TASK` documents, roadmaps, or implementation instructions.
- Direct `.from(...)` table access and edge-function invocations.
- Phase 4 or any other phase.

---

## 3. Validation Method

1. **Canonical source reference:** `supabase/schema.sql` (D-P2-03), 137 forward migrations concatenated per `D-P2-01_Canonical_Migration_Chain_Definition.md`. SHA-256: `A7710714D50FD98F0675E8FA76732202801759CAEDA67125220DC0768077D1F4`.
2. **RPC contract baseline:** `D-P3-01_Reconciled_RPC_Contract.md`, which claims 182 unique invoked RPCs, 178 matched, 4 missing, 97.8% coverage.
3. **Service-layer consistency baseline:** `D-P3-02_Service_Layer_Contract_Consistency_Report.md`, which confirms the same coverage numbers and classifies 9 inconsistency findings.
4. **Independent recalculation:** Re-derived coverage from D-P3-01 figures:
   - Coverage % = 178 matched / 182 unique invoked = 97.8021978…% ≈ 97.8%.
   - Total canonical `CREATE FUNCTION` declarations = 515; unique canonical names = 300.
   - Canonical functions called by service layer = 178; defined but not called = 122; 300 − 178 = 122. Consistent.
5. **Subset check:** Verified that D-P3-01 lists the 4 missing RPCs explicitly and that no additional missing RPCs are introduced elsewhere in the document.
6. **Cross-document consistency check:** Compared the coverage metrics, missing-RPC list, and finding classifications between D-P3-01 and D-P3-02. No contradictions were found.
7. **Exit-criteria mapping:** Mapped each Master Plan Phase 3 exit criterion to the evidence in D-P3-01 / D-P3-02 and classified as satisfied / partially satisfied / not yet satisfied.

---

## 4. Coverage Verification

### 4.1 Figures from D-P3-01

| Metric | Value | Evidence |
|---|---|---|
| Canonical function declarations (`CREATE FUNCTION` in `schema.sql`) | 515 | D-P3-01 §4 |
| Unique canonical function names | 300 | D-P3-01 §4 |
| RPC call-sites (`supabase.rpc(...)` in `services/` + `utils/`) | 189 | D-P3-01 §5 |
| Unique RPC names invoked by service layer | 182 | D-P3-01 §5 |
| Matched to canonical function | 178 | D-P3-01 §1, §6 |
| Missing from canonical migrations | 4 | D-P3-01 §1, §6 |
| Coverage (matched / invoked) | 97.8% | D-P3-01 §1; recalculated as 178/182 |

### 4.2 Independent Recalculation

- **Unique invoked RPCs:** 182
- **Canonical matches:** 178
- **Missing:** 182 − 178 = **4**
- **Coverage:** 178 / 182 = **97.8021978%** → rounds to **97.8%**

The figures in D-P3-01 are arithmetically correct and self-consistent.

### 4.3 Coverage Statement

The production service layer invokes 182 distinct RPC names. Of these, 178 are defined in the canonical migration chain and 4 are not. Therefore, the subset relationship `Invoked RPCs ⊆ Canonical Functions` is **currently violated**.

---

## 5. Canonical Mapping Verification

### 5.1 Matched RPCs

178 RPCs are mapped to canonical functions with migration source, signature, return type, and reconciliation decision recorded in `D-P3-01` §6 (RPC Mapping Matrix). Examples verified include:

| RPC | Canonical Function | Migration Source | Status |
|---|---|---|---|
| `accept_invitation` | `public.accept_invitation` | `20260714000001_accept_invitation_rpc.sql` | MATCHED |
| `create_invoice` | `public.create_invoice` | `20260713000008_update_billing_schema.sql` | MATCHED |
| `process_checkout` | `public.process_checkout` | `20250706000006_phase_p7_0_read_only_tenant_infra.sql` | MATCHED |
| `run_fraud_detection` | `public.run_fraud_detection` | `20250709000001_phase_p17_4_fraud_retention.sql` | MATCHED |

The matrix is traceable and the canonical source for each matched RPC is identifiable.

### 5.2 Missing RPCs

D-P3-01 identifies exactly 4 invoked RPCs with no canonical function definition:

| # | Missing RPC | Service Call Site | Canonical Equivalent (if noted) | D-P3-01 Status |
|---|---|---|---|---|
| 1 | `admin_update_subscription` | `services\tenantService.ts:481` | `update_tenant_subscription` (signature drift) | MISSING |
| 2 | `get_member_with_email` | `services\tenantService.ts` | `get_tenant_members_with_email` (naming drift) | MISSING |
| 3 | `search_members_by_email` | `services\tenantService.ts` | `search_tenant_members` (naming drift) | MISSING |
| 4 | `get_storage_usage` | `services\tenantService.ts` | None identified | MISSING |

These 4 missing RPCs are the sole cause of the coverage gap.

### 5.3 Canonical Boundary Statement

The set of invoked RPCs is **not** a subset of canonical migration functions because the 4 missing RPCs above are in the invoked set and not in the canonical set. The boundary violation is concrete and will produce guaranteed runtime failures on the affected call sites.

---

## 6. Independent Consistency Verification

### 6.1 D-P3-01 Internal Consistency

| Check | Result | Reason |
|---|---|---|
| 178 + 4 = 182 unique invoked RPCs | PASS | Matches D-P3-01 §1 and §5. |
| 300 unique canonical functions − 178 called = 122 not called | PASS | Matches D-P3-01 §4. |
| 178 / 182 = 97.8% | PASS | Matches D-P3-01 §1. |
| Missing RPC count equals the number of rows with status `MISSING` in §6 matrix | PASS | 4 rows explicitly flagged. |

### 6.2 D-P3-01 ↔ D-P3-02 Consistency

| Check | D-P3-01 | D-P3-02 | Result |
|---|---|---|---|
| Service modules scanned | 46 | 46 | Consistent |
| RPC call-sites | 189 | 189 | Consistent |
| Unique RPCs invoked | 182 | 182 | Consistent |
| Matched RPCs | 178 | 178 | Consistent |
| Missing RPCs | 4 | 4 | Consistent |
| Coverage % | 97.8% | 97.8% | Consistent |
| Missing RPC names | `admin_update_subscription`, `get_member_with_email`, `search_members_by_email`, `get_storage_usage` | Same set classified as signature drift / naming drift / missing | Consistent |

No numerical contradictions or scope inconsistencies were detected between the two deliverables.

### 6.3 New Inconsistencies Detected

None. This validation did not identify any inconsistency not already recorded in D-P3-01 or D-P3-02.

---

## 7. Phase 3 Exit Criteria Validation

Source: `SYSTEM_RECOVERY_MASTER_PLAN.md`, Phase 3 Exit Criteria.

| # | Exit Criterion | Status | Evidence | Reasoning |
|---|---|---|---|---|
| 1 | Every RPC invoked by production service code maps to a function defined in the canonical migration chain. | **Not yet satisfied** | D-P3-01 §1: 4 of 182 invoked RPCs are missing from canonical migrations. | 4 invoked RPCs have no canonical function. |
| 2 | No production path calls a function that migrations do not define. | **Not yet satisfied** | D-P3-01 §6; D-P3-02 §6.2: `admin_update_subscription`, `get_member_with_email`, `search_members_by_email`, `get_storage_usage` are called by production service code but not defined. | Each missing RPC is a production call site that will fail at runtime. |
| 3 | Confirmed signature drift is either reconciled with the canonical contract or explicitly split into a separately named canonical function. | **Not yet satisfied** | D-P3-02 §6.2, §9: `admin_update_subscription` passes `p_max_storage_gb`; canonical `update_tenant_subscription` has 7 params and no storage parameter. | Drift is documented but not yet reconciled or split. |
| 4 | Duplicate or ambiguous wrappers are resolved into a single canonical contract surface. | **Not yet satisfied** | D-P3-02 §6.2, §8: `getUsageSummary` and `getTenantUsageSummary` are byte-identical wrappers for `get_tenant_usage_summary`. | Duplication is documented but not yet resolved. |
| 5 | Alias patterns that create shadow contracts are documented or removed. | **Partially satisfied** | D-P3-02 §7: 4 explicit aliases are documented with `// ponytail:` comments. D-P3-02 §6.2, §5: `services/admin/systemAdminService.ts` facade barrel re-exports 30+ symbols and is flagged as contract ambiguity. | Explicit aliases are documented; the facade barrel expands the surface and is not yet removed or recorded in a canonical boundary registry. |

---

## 8. Remaining Known Gaps

The following gaps are already identified in D-P3-01 and D-P3-02. No new gaps were discovered by this validation.

### 8.1 Missing RPCs (4)

1. **`admin_update_subscription`** — called at `services/tenantService.ts:481` via `updateSubscriptionLimits`. Canonical equivalent `update_tenant_subscription` exists but with a different signature (no `p_max_storage_gb`).
2. **`get_member_with_email`** — called via `getMemberWithEmail`. Canonical equivalent `get_tenant_members_with_email` exists; this is a naming drift.
3. **`search_members_by_email`** — called via `searchMembers`. Canonical equivalent `search_tenant_members` exists; this is a naming drift.
4. **`get_storage_usage`** — called by two service functions (`getStorageUsage` and `getTenantStorageUsage`) with different tenant semantics. No canonical equivalent identified.

### 8.2 Unresolved Signature Drift (1)

- `admin_update_subscription` / `update_tenant_subscription`: service assumes 8 parameters including `p_max_storage_gb`; canonical function has 7 parameters and no storage field.

### 8.3 Unresolved Wrapper Duplication (1)

- `getUsageSummary` and `getTenantUsageSummary` both call `get_tenant_usage_summary({ p_tenant_id: tenantId })` with identical mapping.

### 8.4 Documented but Unremoved Aliases (4 + 1 facade barrel)

- `getTenantById` = `getTenant`
- `getTenantMembers` = `getMembers`
- `checkSubdomain` = `checkSubdomainAvailability`
- `restoreTenantStatus` = `restoreTenant`
- `services/admin/systemAdminService.ts` re-exports 30+ symbols from 8 modules as a facade barrel.

### 8.5 Drift-Prone Canonical Overloads (3)

- `update_tenant_subscription` redefined 3×.
- `update_tenant` redefined 6×.
- `process_checkout` redefined 3×.

These are functional against the latest migration but create fragility. They are noted as observations, not blockers, in D-P3-02.

---

## 9. Validation Decision

**FAIL.**

The independent re-check confirms that the reconciliation performed in D-P3-01 and D-P3-02 is accurate and internally consistent: 178 of 182 invoked RPCs (97.8%) map to canonical migration functions. However, the Phase 3 exit criteria require 100% coverage, zero missing production RPCs, resolved signature drift, resolved duplicate wrappers, and documented/removed alias patterns. The current evidence shows:

- 4 missing RPCs still invoked by production service code.
- 1 unresolved signature drift (`admin_update_subscription`).
- 1 unresolved wrapper duplication (`getUsageSummary` / `getTenantUsageSummary`).
- 1 facade barrel alias pattern that expands the contract surface beyond the canonical RPC boundary.

Because the Master Plan exit criteria are not fully satisfied, Phase 3 cannot be accepted on the basis of this evidence. The failure is bounded, localized, and traceable; the underlying contract discipline is otherwise intact.

---

## 10. Evidence References

| Reference | Document | Role in Validation |
|---|---|---|
| Master Plan Phase 3 exit criteria | `SYSTEM_RECOVERY_MASTER_PLAN.md`, §4 “Phase 3 — RPC Contract Reconciliation” | Defines the acceptance gate. |
| Active phase marker | `CURRENT_PHASE.md`, §4 | Confirms Phase 3 entry criteria are satisfied and lists Phase 3 success criteria. |
| RPC contract baseline | `D-P3-01_Reconciled_RPC_Contract.md`, §1, §4, §5, §6 | Source of coverage figures, canonical inventory, service inventory, and mapping matrix. |
| Service-layer consistency baseline | `D-P3-02_Service_Layer_Contract_Consistency_Report.md`, §1, §5, §6, §7, §8, §9 | Source of alias, wrapper-duplication, signature-drift, and contract-ambiguity findings. |
| Canonical schema artifact | `supabase/schema.sql` (D-P2-03), SHA-256 `A7710714D50FD98F0675E8FA76732202801759CAEDA67125220DC0768077D1F4` | Canonical source against which coverage was measured. |
| Evidence files | `.temp/rpc_call_sites.csv`, `.temp/clean_function_signatures.csv`, `.temp/rpc_mapping_matrix_final.csv` | Raw extraction artifacts referenced by D-P3-01 and D-P3-02. |

---

*This deliverable was generated as an independent validation of D-P3-01 and D-P3-02 only. It contains no new scan results, no implementation instructions, and no new deliverables beyond D-P3-03.*
