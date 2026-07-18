# D-P3-04 — Migration Updates Required for Contract Gaps

**Program:** VietSalePro v7 — System Recovery Program  
**Deliverable ID:** D-P3-04  
**Title:** Migration Updates Required for Contract Gaps  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Proposed — Pending Architecture Authority / Program Manager Review  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `D-P3-02_Service_Layer_Contract_Consistency_Report.md`, `D-P3-03_RPC_Coverage_Validation_Evidence.md`

---

## 1. Executive Summary

This deliverable identifies the **canonical contract-level changes** required to close the RPC contract gaps confirmed in Phase 3. It does not prescribe implementation tactics, SQL, or migration design. It maps every confirmed gap to a contract-change classification and a migration-update requirement category so that subsequent engineering work can be authorized against a clear contract baseline.

| Metric | Value |
|---|---|
| Unique RPCs invoked by service layer | 182 |
| RPCs matched to canonical migration function | 178 |
| RPCs missing from canonical migrations | 4 |
| Confirmed signature drifts | 1 |
| Confirmed naming drifts | 3 |
| Wrapper duplications | 1 |
| Explicit aliases | 4 |
| Contract ambiguities | 3 |
| Gaps requiring a canonical migration update | 4 |
| Gaps resolvable by service-boundary cleanup only | 5 |

**Decision: PASS WITH OBSERVATIONS.**

The deliverable is complete as a contract-level analysis. The classification is internally consistent and fully traceable to the preceding Phase 3 evidence. The observation is that Phase 3 exit criteria remain unmet because the identified canonical updates have not yet been applied; that status is recorded in Section 9 as a program-readiness issue, not as a defect in this deliverable.

---

## 2. Scope

### 2.1 In Scope

- Confirmed contract gaps from `D-P3-01`, `D-P3-02`, and `D-P3-03` only.
- Missing RPCs, signature drift, naming drift, wrapper duplication, alias patterns, and contract ambiguity.
- Canonical contract impact assessment for each gap.
- Classification of required migration-update types at the contract level.
- Contract change classification (addition, modification, deprecation, documentation update, service-boundary cleanup).
- Phase 3 exit-criteria impact assessment.

### 2.2 Out of Scope

- Implementation instructions, SQL, or migration design.
- Generation of `CURRENT_TASK` documents or engineering work packages.
- New code scans, new gap discovery, or expansion beyond the gaps already confirmed in D-P3-01 / D-P3-02 / D-P3-03.
- UI review, business-logic review, schema redesign, or direct `.from(...)` table access analysis.
- Phase 4 planning or any other phase.

---

## 3. Contract Gap Inventory

The following gaps are reproduced exactly from the prior Phase 3 deliverables. No new gaps are introduced.

### 3.1 Missing RPCs

| # | Missing RPC | Service Call Site | Canonical Equivalent (if any) | Associated Finding |
|---|---|---|---|---|
| 1 | `admin_update_subscription` | `services\tenantService.ts:481` | `update_tenant_subscription` (signature drift) | Missing + Signature Drift |
| 2 | `get_member_with_email` | `services\tenantService.ts` | `get_tenant_members_with_email` | Missing + Naming Drift |
| 3 | `search_members_by_email` | `services\tenantService.ts` | `search_tenant_members` | Missing + Naming Drift |
| 4 | `get_storage_usage` | `services\tenantService.ts` | None identified | Missing + Contract Ambiguity |

### 3.2 Signature Drift

| # | RPC / Service Function | Canonical Function | Drift Description |
|---|---|---|---|
| 1 | `admin_update_subscription` / `updateSubscriptionLimits` | `update_tenant_subscription` | Service forwards 8 parameters including `p_max_storage_gb`; canonical function accepts 7 parameters and has no storage parameter. |

### 3.3 Naming Drift

| # | RPC Used by Service | Canonical Function Name | Service Function(s) |
|---|---|---|---|
| 1 | `get_member_with_email` | `get_tenant_members_with_email` | `getMemberWithEmail` |
| 2 | `search_members_by_email` | `search_tenant_members` | `searchMembers` |
| 3 | `admin_update_subscription` | `update_tenant_subscription` | `updateSubscriptionLimits` |

### 3.4 Wrapper Duplication

| # | Service Functions | Canonical RPC | Evidence |
|---|---|---|---|
| 1 | `getUsageSummary` and `getTenantUsageSummary` | `get_tenant_usage_summary` | `services\tenantService.ts:469` and `:497`; identical parameter forwarding, identical mapping, identical return type. |

### 3.5 Alias / Facade Boundary

| # | Alias | Underlying Service Function | Type | Evidence |
|---|---|---|---|---|
| 1 | `getTenantById` | `getTenant` | `const` alias | `services\tenantService.ts:924` |
| 2 | `getTenantMembers` | `getMembers` | `const` alias | `services\tenantService.ts:976` |
| 3 | `checkSubdomain` | `checkSubdomainAvailability` | Re-export alias | `services\admin\systemAdminService.ts:30` |
| 4 | `restoreTenantStatus` | `restoreTenant` | `const` alias | `services\admin\tenantAdminService.ts:250` |

### 3.6 Contract Ambiguities

| # | Ambiguity | Evidence | Root Gap |
|---|---|---|---|
| A1 | Two subscription-update service functions (`updateTenantSubscription` and `updateSubscriptionLimits`) expose the same operation through different signatures, one broken. | `services\tenantService.ts:477` and `:509` | Signature Drift / Missing RPC |
| A2 | Two member-search service functions (`searchMembers` and `searchTenantMembers`) overlap in intent; one uses a missing RPC. | `services\tenantService.ts:609` and `:626` | Naming Drift / Missing RPC |
| A3 | Two storage-usage service functions (`getStorageUsage` and `getTenantStorageUsage`) call the same missing RPC with different tenant semantics. | `services\tenantService.ts:1008` and `:1016` | Missing RPC / Contract Ambiguity |
| A4 | `services/admin/systemAdminService.ts` re-exports 30+ symbols from 8 modules as a facade barrel. | `services\admin\systemAdminService.ts:1-62` | Alias / Facade Boundary |

---

## 4. Canonical Contract Impact Assessment

For each gap, the table below records the canonical contract as it exists today, the contract the service layer currently assumes, the deviation, and the impact on Phase 3 exit criteria.

| Gap ID | Gap | Current Canonical Contract | Service-Layer Assumed Contract | Deviation | Phase 3 Exit Impact |
|---|---|---|---|---|---|
| G1 | `admin_update_subscription` missing | `update_tenant_subscription(p_tenant_id, p_plan, p_status, p_start_date, p_end_date, p_billing_cycle, p_auto_renew)` — 7 params, exists in canonical migrations. | `admin_update_subscription(..., p_max_storage_gb)` — 8 params, name differs, storage param included. | Name drift + parameter addition (`p_max_storage_gb`) + total parameter count mismatch. | Violates "every RPC invoked maps to a canonical function" and "no production path calls a missing function". Guaranteed runtime failure. |
| G2 | `get_member_with_email` missing | `get_tenant_members_with_email(p_tenant_id UUID, p_user_id UUID)` exists in canonical migrations. | `get_member_with_email` with same two parameters but different RPC name. | Naming drift only; signature appears identical. | Violates "every RPC invoked maps to a canonical function". Runtime failure. |
| G3 | `search_members_by_email` missing | `search_tenant_members(p_tenant_id, p_query, p_page, p_limit, p_role_filter, p_status_filter)` exists in canonical migrations. | `search_members_by_email` with same parameter set but different RPC name. | Naming drift only; signature appears identical. | Violates "every RPC invoked maps to a canonical function". Runtime failure. |
| G4 | `get_storage_usage` missing | No canonical function with this name identified in the canonical migration chain. | `get_storage_usage(p_tenant_id UUID)` from `getStorageUsage`; `get_storage_usage()` (no tenant) from `getTenantStorageUsage`. | Missing canonical function; ambiguous tenant vs. system-wide semantics. | Violates "every RPC invoked maps to a canonical function" and creates contract ambiguity. Runtime failure. |
| G5 | `getUsageSummary` / `getTenantUsageSummary` duplication | `get_tenant_usage_summary(p_tenant_id)` exists in canonical migrations. | Two exported service functions call the identical canonical RPC with identical mapping. | No canonical deviation; service surface is duplicated. | Violates "duplicate or ambiguous wrappers are resolved into a single canonical contract surface". |
| G6 | Aliases (4) | Each alias resolves to one canonical function that exists in migrations. | Exported service names differ from underlying RPC names. | No signature or return-type deviation; naming surface expanded. | Low direct impact on canonical boundary; violates service-boundary discipline if undocumented. All four are already self-documented. |
| G7 | Contract ambiguities A1-A4 | Canonical functions exist for the underlying operations; the ambiguity is in service-layer naming and missing functions. | Multiple service names for the same canonical capability. | Service-boundary surface expansion; no canonical contract change required for A1-A4 except where tied to G1-G4. | A1-A3 are symptoms of G1-G4. A4 is a facade pattern that should be documented, not changed in canonical migrations. |

---

## 5. Migration Update Requirement Matrix

This matrix classifies the canonical migration update required for each gap. It does not describe implementation.

| Gap ID | Gap | Migration Update Required? | Requirement Classification | Rationale |
|---|---|---|---|---|
| G1 | `admin_update_subscription` | **Yes** | **Canonical Signature Update Required** OR **New Canonical Function Required** | Either `update_tenant_subscription` must be extended to accept `p_max_storage_gb`, or a new canonical function `admin_update_subscription` must be defined with the 8-parameter contract. Architecture authority must decide whether storage limits belong in subscription updates or in a separate capability. |
| G2 | `get_member_with_email` | **Yes** | **Canonical Naming Alignment Required** | Canonical function `get_tenant_members_with_email` already has the matching signature. The migration chain must either expose the canonical name as `get_member_with_email` (alias/wrapper) or the service must align to the canonical name. Because the service currently calls the non-canonical name, a canonical naming alignment is required to close the gap. |
| G3 | `search_members_by_email` | **Yes** | **Canonical Naming Alignment Required** | Canonical function `search_tenant_members` already has the matching signature. Same reasoning as G2. |
| G4 | `get_storage_usage` | **Yes** | **New Canonical Function Required** | No equivalent canonical function exists. The ambiguous tenant semantics (`getStorageUsage(tenantId)` vs. `getTenantStorageUsage()` with no tenant) must be resolved before a canonical function can be defined. |
| G5 | Wrapper duplication | **No** | **Service-Side Contract Issue** | The canonical RPC `get_tenant_usage_summary` already exists and is correctly invoked. The duplicate service wrappers are a service-boundary cleanup matter. |
| G6 | Aliases (4) | **No** | **Documentation Only** | Each alias resolves to an existing canonical function with no signature or return-type change. The canonical migration chain does not need modification; the service boundary should document the aliases. |
| G7 | Contract ambiguities A1-A4 | **Partial** — see tied gaps | A1-A3 require resolution of G1-G4; A4 is **Documentation Only** | A1 is tied to G1; A2 is tied to G2/G3; A3 is tied to G4. A4 is a facade re-export pattern that does not require a canonical migration change. |

### 5.1 Summary of Canonical Migration Update Requirements

| Requirement Category | Count | Gaps |
|---|---|---|
| New Canonical Function Required | 1 | G4 |
| Canonical Signature Update Required | 1 | G1 |
| Canonical Naming Alignment Required | 2 | G2, G3 |
| No Migration Update Required (service-side issue) | 1 | G5 |
| Documentation Only | 2 | G6, A4 |
| Partial / tied to other gaps | 3 | A1, A2, A3 |

---

## 6. Contract Change Classification

| Gap ID | Gap | Contract Change Classification | Notes |
|---|---|---|---|
| G1 | `admin_update_subscription` | **Contract Modification** (if extending `update_tenant_subscription`) OR **Contract Addition** (if creating `admin_update_subscription`) | Decision authority must choose one canonical path; maintaining both names would be a **Contract Ambiguity**. |
| G2 | `get_member_with_email` | **Contract Modification** | Adding a canonical alias/wrapper for `get_member_with_email` that resolves to `get_tenant_members_with_email`, or renaming the service call. |
| G3 | `search_members_by_email` | **Contract Modification** | Same pattern as G2. |
| G4 | `get_storage_usage` | **Contract Addition** | New canonical function required; semantics must be clarified first. |
| G5 | Wrapper duplication | **Service Boundary Cleanup** | No canonical contract change; remove or merge duplicate service wrappers. |
| G6 | Aliases (4) | **Documentation Update** / **Service Boundary Cleanup** | No canonical contract change; aliases are intentional and self-documented. |
| G7 | Contract ambiguities A1-A4 | **Service Boundary Cleanup** / **Documentation Update** (A4); tied to Contract Modification/Addition (A1-A3) | A4 is purely service-layer documentation; A1-A3 resolve once G1-G4 are closed. |

### 6.1 Classification Summary

| Classification | Count | Gaps |
|---|---|---|
| Contract Addition | 1 | G4 |
| Contract Modification | 3 | G1, G2, G3 |
| Documentation Update | 2 | G6, A4 |
| Service Boundary Cleanup | 4 | G5, G6, A4, G7 (A1-A3 after canonical fix) |
| Contract Deprecation | 0 | — |

---

## 7. Phase 3 Exit Impact Assessment

The table below maps each Phase 3 exit criterion from `SYSTEM_RECOVERY_MASTER_PLAN.md` to the gaps that currently prevent it from being satisfied.

| Phase 3 Exit Criterion | Status | Blocking Gaps | Explanation |
|---|---|---|---|
| Every RPC invoked by production service code maps to a function defined in the canonical migration chain. | **Not satisfied** | G1, G2, G3, G4 | 4 invoked RPC names have no matching canonical function. |
| No production path calls a function that migrations do not define. | **Not satisfied** | G1, G2, G3, G4 | Same 4 missing RPCs create guaranteed runtime failures on the affected call sites. |
| Confirmed signature drift is either reconciled with the canonical contract or explicitly split into a separately named canonical function. | **Not satisfied** | G1 | `admin_update_subscription` / `updateSubscriptionLimits` carries an unresolved parameter mismatch against `update_tenant_subscription`. |
| Duplicate or ambiguous wrappers are resolved into a single canonical contract surface. | **Not satisfied** | G5 | `getUsageSummary` and `getTenantUsageSummary` remain duplicate wrappers for the same canonical RPC. |
| Alias patterns that create shadow contracts are documented or removed. | **Partially satisfied** | G6, A4 | All 4 aliases are self-documented with `// ponytail:` comments; the facade barrel (A4) is noted but not formally removed. This is the least blocking criterion. |

### 7.1 RPC Contract Integrity

- **Coverage integrity:** 97.8% (178/182). The 4 missing RPCs represent the only coverage violation.
- **Signature integrity:** One confirmed parameter mismatch (G1) plus three naming-only mismatches (G2, G3) that do not alter parameter sets.
- **Naming integrity:** Multiple service-layer names shadow canonical names (G2, G3, G6, A4), expanding the exported surface beyond the canonical boundary.

### 7.2 Canonical Boundary Integrity

The canonical boundary is violated in four places where the service layer invokes names that migrations do not define. G5 and G6 do not violate the canonical boundary because every underlying RPC resolves to an existing canonical function. G7 ambiguities are service-layer surface issues, not canonical boundary issues, except where they are rooted in G1-G4.

---

## 8. Consolidated Findings

1. **Four canonical migration updates are required** to close the Phase 3 coverage gap:
   - G1: Resolve `admin_update_subscription` vs. `update_tenant_subscription` through either a canonical signature update or a new canonical function.
   - G2: Align `get_member_with_email` to `get_tenant_members_with_email` at the canonical boundary.
   - G3: Align `search_members_by_email` to `search_tenant_members` at the canonical boundary.
   - G4: Define a new canonical function for storage usage after resolving tenant vs. system-wide semantics.

2. **Two additional service-boundary cleanups are required** for Phase 3 exit but do not require canonical migration changes:
   - G5: Merge or remove the duplicate `getUsageSummary` / `getTenantUsageSummary` wrappers.
   - G6 / A4: Keep aliases documented; decide whether the `services/admin/systemAdminService.ts` facade barrel should be retained, documented, or dissolved.

3. **No contract deprecations are required.** All confirmed gaps are either additions, modifications, documentation updates, or service-boundary cleanups.

4. **The gaps are localized and traceable.** They do not indicate a systemic collapse of service-layer contract discipline. The remaining 178 invoked RPCs (97.8%) already map cleanly to canonical migration functions.

---

## 9. Decision

### 9.1 Deliverable Decision

**PASS WITH OBSERVATIONS**

This deliverable is complete as a contract-level analysis. All confirmed Phase 3 contract gaps have been inventoried, their canonical impact assessed, migration-update requirements classified, and Phase 3 exit-criteria impact recorded. The observation is that the deliverable documents unresolved gaps; those gaps are the input to subsequent authorized work, not a defect in this document.

### 9.2 Phase 3 Exit Readiness

**NOT READY**

Phase 3 cannot be formally accepted on the basis of the current evidence because:

- 4 production RPCs still lack canonical migration definitions (G1-G4).
- 1 signature drift remains unresolved (G1).
- 1 wrapper duplication remains unresolved (G5).
- Alias/facade patterns are documented but not yet formally accepted or removed (G6, A4).

Program Manager and architecture authority must authorize the canonical migration updates and service-boundary cleanups identified in this deliverable before Phase 3 exit criteria can be satisfied.

---

## 10. Evidence References

| Reference | Description |
|---|---|
| `SYSTEM_RECOVERY_MASTER_PLAN.md` | Phase 3 purpose, scope, exit criteria, and deliverable list. |
| `CURRENT_PHASE.md` | Active phase marker confirming Phase 3 — RPC Contract Reconciliation. |
| `D-P3-01_Reconciled_RPC_Contract.md` | Canonical RPC inventory, service RPC inventory, and RPC mapping matrix identifying 4 missing RPCs and 178 matches. |
| `D-P3-02_Service_Layer_Contract_Consistency_Report.md` | Service-layer wrapper inventory, contract consistency matrix, alias inventory, duplicate-wrapper finding, signature drift finding, and contract ambiguity register. |
| `D-P3-03_RPC_Coverage_Validation_Evidence.md` | Independent re-calculation of coverage figures and exit-criteria mapping confirming Phase 3 is not yet ready. |
| `supabase/schema.sql` (D-P2-03) | Canonical schema artifact; SHA-256: `A7710714D50FD98F0675E8FA76732202801759CAEDA67125220DC0768077D1F4`. |
| `supabase/generated/database.types.ts` (D-P2-04) | Derived type artifact; SHA-256: `7928F917DE29422E6039E31D1A7C889B6410F1CAB08684F8220200E56168644E`. |

---

*This deliverable contains no implementation instructions, no SQL, and no migration design. It is a contract-level input to the authorized engineering work that must follow.*
