# CURRENT_TASK-006 — Subscription Canonical Contract Decision (G1)

**Task ID:** CURRENT_TASK-006  
**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Work Unit:** G1  
**Priority:** P0 (Highest)  
**Status:** Decision Ready — Pending Program Manager Approval  
**Date:** 2026-07-14  
**Decision Authority:** Program Manager, with required input from Architecture Authority  

---

## 1. Executive Summary

This document records the canonical-contract architecture decision for Gap G1: the invoked RPC `admin_update_subscription` does not exist in the canonical migration chain, while the closely related `update_tenant_subscription` does exist but does not accept the `p_max_storage_gb` parameter forwarded by the service layer.

**Decision:** **APPROVE Option A — Extend Existing Canonical Function `update_tenant_subscription`.**

`admin_update_subscription` and `update_tenant_subscription` represent the same business capability: a system-admin update of a tenant's subscription record. The only deviation is an additional subscription-limit parameter (`p_max_storage_gb`) that the service layer expects and the canonical function currently omits. The canonical boundary should therefore remain a single function; the canonical contract is extended to include the missing parameter. This preserves canonical purity, eliminates the missing-RPC runtime failure, and closes the signature drift without introducing a second, overlapping canonical function.

Implementation of this decision is **not** authorized by this document and must await a separate, Program-Manager-approved implementation task.

---

## 2. Scope

### 2.1 In Scope

- Gap G1 only: `admin_update_subscription` versus `update_tenant_subscription`.
- Determination of whether these two RPC names represent one or two canonical business capabilities.
- Canonical contract decision for the subscription-update boundary.

### 2.2 Out of Scope

- G2, G3, G4, wrapper duplication, aliases, facade-barrel cleanup, or service-layer refactoring.
- SQL, migration authoring, schema regeneration, type regeneration, or service code changes.
- Creation of a new `CURRENT_TASK` or roadmap.

---

## 3. Current Canonical Contract Analysis

### 3.1 Existing Canonical Function

Source: canonical migration chain, `supabase/schema.sql` (D-P2-03), final definition at lines 20824–20900; also recorded in `D-P3-01_Reconciled_RPC_Contract.md` §6.2 and §8.

```text
update_tenant_subscription(
  p_tenant_id UUID,
  p_plan TEXT DEFAULT NULL,
  p_max_users INTEGER DEFAULT NULL,
  p_max_products INTEGER DEFAULT NULL,
  p_max_orders_per_month INTEGER DEFAULT NULL,
  p_billing_status TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS public.tenant_subscriptions
```

- **Responsibility:** Update a single tenant's subscription record in `public.tenant_subscriptions` and propagate the plan change to `public.tenants`.
- **Domain:** Tenant subscription lifecycle.
- **Ownership:** System-admin only (`IF NOT public.is_system_admin() THEN RAISE EXCEPTION ...`).
- **Business meaning:** Apply plan, usage limits, billing status, and expiry changes to a tenant.
- **Parameter set:** 7 optional/defaulted parameters, all describing subscription attributes.
- **Return contract:** One `public.tenant_subscriptions` row.

### 3.2 Service-Layer Assumed Contract

Source: `services/tenantService.ts:477-494`, recorded in `D-P3-02_Service_Layer_Contract_Consistency_Report.md` §6.2 and §9.1.

```text
admin_update_subscription(
  p_tenant_id UUID,
  p_plan TEXT,
  p_max_users INTEGER,
  p_max_products INTEGER,
  p_max_orders_per_month INTEGER,
  p_max_storage_gb INTEGER,          -- not in canonical function
  p_billing_status TEXT,
  p_expires_at TIMESTAMPTZ
)
```

- **Responsibility:** Same as above from the caller's perspective (update tenant subscription limits/plan).
- **Domain:** Same tenant subscription lifecycle.
- **Ownership:** Implicitly system-admin (service re-export is `services/admin/billingAdminService.ts:36-40`).
- **Business meaning:** Same as above, with an additional storage-limit field.
- **Parameter set:** 8 parameters; differs only by `p_max_storage_gb`.
- **Return contract:** `TenantSubscription` mapped from RPC result (`mapSubscriptionFromDB`).

### 3.3 Comparison Summary

| Attribute | `update_tenant_subscription` (canonical) | `admin_update_subscription` (service call) | Assessment |
|---|---|---|---|
| Target table | `public.tenant_subscriptions` | `public.tenant_subscriptions` (implied by return mapper) | Same |
| Ownership gate | `is_system_admin()` | System admin via admin service re-export | Same |
| Return type | `public.tenant_subscriptions` | `TenantSubscription` (mapped from same row shape) | Same |
| Parameters | 7 subscription fields | 8 subscription fields | Subset/superset |
| Unique parameter | None | `p_max_storage_gb` | Extension only |
| Business capability | Update tenant subscription | Update tenant subscription | Same |

---

## 4. Service Contract Analysis

The service-layer contract around this gap is recorded in `D-P3-02_Service_Layer_Contract_Consistency_Report.md` §6.2, §8, and §9.1, and cross-validated in `D-P3-03_RPC_Coverage_Validation_Evidence.md` §5.2 and §7.

| Service Function | RPC Invoked | Canonical Function | Status |
|---|---|---|---|
| `updateTenantSubscription` | `update_tenant_subscription` | Exists; 7 params | Consistent |
| `updateSubscriptionLimits` | `admin_update_subscription` | Missing; assumes 8 params | Signature drift / Missing RPC |

Both service functions consume the identical TypeScript input type `UpdateSubscriptionInput` (`types/tenant.ts:164-172`), which already includes `maxStorageGb?: number`. Both return `TenantSubscription`. The only material difference is the RPC name and the extra parameter forwarded by `updateSubscriptionLimits`.

`updateSubscriptionLimits` is re-exported through `services/admin/billingAdminService.ts:36-40` but has no confirmed production UI caller; `updateTenantSubscription` is the function actually exercised by the admin tenant page (`pages/admin/Tenants.tsx:381`) and by smoke tests. The canonical contract decision therefore does not need to accommodate a genuinely different caller semantics — it needs to close the parameter gap in the single subscription-update capability.

---

## 5. Architecture Boundary Analysis

### 5.1 Option A — One Business Capability

`admin_update_subscription` and `update_tenant_subscription` both update the same aggregate (`tenant_subscriptions`) with the same authorization, the same return shape, and the same business intent. The extra parameter is a missing subscription limit, not a new domain concept. Therefore they are one business capability and should map to one canonical function.

### 5.2 Option B — Two Business Capabilities

Creating a separate `admin_update_subscription` would imply that "update subscription limits including storage" is a distinct capability from "update subscription limits excluding storage." There is no domain evidence for this separation:

- The same input type feeds both service functions.
- The same table and row are modified.
- The same ownership gate applies.
- The only difference is a single optional numeric limit.

Maintaining two canonical functions for the same capability would violate the canonical-purity principle stated in `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1 and §4 Phase 3 Scope, and would leave the door open to further parameter-split duplication.

**Conclusion:** Option A is the correct architecture boundary.

---

## 6. Signature Analysis

### 6.1 `p_max_storage_gb` Assessment

The parameter `p_max_storage_gb` is a **valid extension** of the subscription-update capability, not a signal of a new capability.

Evidence:

- `TenantSubscription` (`types/tenant.ts:125-144`) already declares `maxStorageGb?: number` and maps it from `row.max_storage_gb`.
- `UpdateSubscriptionInput` (`types/tenant.ts:164-172`) already declares `maxStorageGb?: number`.
- The canonical function already manages analogous limit fields: `p_max_users`, `p_max_products`, `p_max_orders_per_month`.
- `p_max_storage_gb` is semantically grouped with the other per-tenant usage limits.

### 6.2 Canonical Schema Observation

Direct inspection of the canonical schema artifact (`supabase/schema.sql`) shows that the `max_storage_gb` column is **not present** in the `public.tenant_subscriptions` table definition. This means the canonical contract extension (adding `p_max_storage_gb`) implies a corresponding schema extension in the implementation task that follows this decision. This implication is noted as a downstream contract impact, not a decision blocker; the contract-decision question is whether storage limits belong in the subscription-update capability, and the answer is yes.

---

## 7. Option Comparison Matrix

| Criterion | Option A — Extend `update_tenant_subscription` | Option B — Create `admin_update_subscription` |
|---|---|---|
| **Canonical purity** | High — one function per capability. | Low — two overlapping functions for the same capability. |
| **Business alignment** | One subscription-update capability. | Artificially splits subscription-update into two RPCs. |
| **Backward compatibility** | Fully backward compatible: add `p_max_storage_gb` with `DEFAULT NULL`; existing callers of `update_tenant_subscription` continue to work. | Existing `update_tenant_subscription` callers remain unchanged, but the service's `updateSubscriptionLimits` now depends on a second RPC, and future callers must choose between two functions. |
| **Service-layer impact** | Both service functions can call the same canonical RPC; resolves the duplicate-wrapper tension cleanly. | Keeps two separate RPC names, perpetuating the wrapper duplication/ambiguity. |
| **Migration chain impact** | One signature extension in a single migration update. | New function definition plus continued maintenance of the old one; risk of divergent behavior. |
| **Generated schema/types impact** | One function signature changes (adds optional param); generated types update deterministically. | Two functions appear in generated artifacts; type surface expands unnecessarily. |
| **Long-term maintainability** | Higher — single source of truth for subscription updates. | Lower — two places to keep consistent whenever subscription update logic changes. |
| **Phase 3 exit support** | Resolves G1 for EC-1, EC-2, and EC-3 in one contract change. | Resolves G1 only by adding a second canonical function, leaving the drift-prone pair in place. |

---

## 8. Canonical Contract Decision

**APPROVE Option A — Extend Existing Canonical Function `update_tenant_subscription`.**

### 8.1 Rationale

1. **Single capability.** Both RPC names represent the same business operation: a system-admin update of a tenant subscription record.
2. **Single ownership and return.** Both functions target the same table, require the same admin gate, and return the same subscription row.
3. **Parameter is a domain extension.** `p_max_storage_gb` is another subscription limit, analogous to the existing `p_max_users`, `p_max_products`, and `p_max_orders_per_month` parameters.
4. **Canonical purity.** The System Recovery Master Plan (`SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1) requires the canonical migration chain to be the unambiguous source of truth. Splitting one capability into two canonical functions would introduce ambiguity.
5. **Backward compatibility.** Adding an optional `DEFAULT NULL` parameter preserves all existing `update_tenant_subscription` call sites.
6. **Service-layer simplification.** A single canonical RPC removes the need for two near-identical service wrappers and supports the Phase 3 exit criterion on resolving duplicate/ambiguous wrappers.

### 8.2 Decision Statement

The canonical contract for updating a tenant's subscription shall remain:

```text
public.update_tenant_subscription(
  p_tenant_id UUID,
  p_plan TEXT DEFAULT NULL,
  p_max_users INTEGER DEFAULT NULL,
  p_max_products INTEGER DEFAULT NULL,
  p_max_orders_per_month INTEGER DEFAULT NULL,
  p_max_storage_gb INTEGER DEFAULT NULL,   -- new optional parameter
  p_billing_status TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS public.tenant_subscriptions
```

The non-canonical RPC name `admin_update_subscription` shall **not** be introduced into the canonical migration chain. The service-layer wrapper that currently invokes `admin_update_subscription` shall be reconciled against the extended `update_tenant_subscription` canonical function in the implementation task that follows this decision.

---

## 9. Phase 3 Exit Impact

Source: `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 3 Exit Criteria; `PHASE3_ACCEPTANCE_REVIEW.md` §4; `D-P3-04_Migration_Updates_Required_for_Contract_Gaps.md` §7.

| Exit Criterion | Status Before G1 Resolution | Impact of This Decision |
|---|---|---|
| EC-1: Every invoked RPC maps to a canonical function. | Not satisfied (G1). | Satisfied for G1 once the canonical signature is extended and the service call is aligned. |
| EC-2: No production path calls an undefined function. | Not satisfied (G1). | Satisfied for G1 once the service uses the canonical function name. |
| EC-3: Signature drift reconciled or explicitly split. | Not satisfied (G1). | Satisfied for G1 by reconciling the drift into the extended canonical function. |
| EC-4: Duplicate wrappers resolved. | Not satisfied (G5). | Indirect support: both `updateTenantSubscription` and `updateSubscriptionLimits` can now call the same canonical RPC, making wrapper consolidation a service-boundary cleanup only. |
| EC-5: Alias patterns documented or removed. | Partially satisfied. | No direct impact; not in G1 scope. |

**Important:** This decision alone does **not** close Phase 3. G2, G3, G4, G5, and the partial G6/A4 alias/facade items remain unresolved and require their own authorized work.

---

## 10. Recommendation

1. **Approve Option A** as the canonical contract direction for G1.
2. **Authorize an implementation task** (separate from this decision document) to:
   - Extend `public.update_tenant_subscription` in the canonical migration chain with the optional `p_max_storage_gb` parameter.
   - If necessary, extend the `public.tenant_subscriptions` table with a `max_storage_gb` column so the parameter has a persistent target.
   - Reconcile the service-layer call in `updateSubscriptionLimits` to use the canonical `update_tenant_subscription` RPC and forward `p_max_storage_gb`.
   - Consolidate or deprecate the duplicate `updateSubscriptionLimits` wrapper in favor of `updateTenantSubscription` as a service-boundary cleanup, subject to the G5 wrapper-duplication decision.
3. **Do not create** a canonical `admin_update_subscription` function, because doing so would institutionalize a second name for the same capability.

---

## 11. Evidence References

| Evidence | Source | What It Proves |
|---|---|---|
| Canonical function signature | `supabase/schema.sql` lines 20824–20900 (D-P2-03) | `update_tenant_subscription` exists with 7 params, admin-gated, returns `tenant_subscriptions`. |
| RPC-to-canonical mapping | `D-P3-01_Reconciled_RPC_Contract.md` §6.2, §8 | G1 is a missing RPC with signature drift against `update_tenant_subscription`; exact parameter mismatch is documented. |
| Service call site | `services/tenantService.ts:477-494` | `updateSubscriptionLimits` invokes `admin_update_subscription` with `p_max_storage_gb`. |
| Consistent wrapper | `services/tenantService.ts:505-520` | `updateTenantSubscription` already calls canonical `update_tenant_subscription` without storage param. |
| Input type | `types/tenant.ts:164-172` | `UpdateSubscriptionInput` already includes `maxStorageGb`, confirming the parameter is part of the domain. |
| Domain type | `types/tenant.ts:125-144` | `TenantSubscription` already includes `maxStorageGb`, confirming the field belongs to the subscription aggregate. |
| Service-layer classification | `D-P3-02_Service_Layer_Contract_Consistency_Report.md` §6.2, §9.1 | G1 is classified as signature drift + naming drift + contract ambiguity; both wrappers share the same input/output type. |
| Independent validation | `D-P3-03_RPC_Coverage_Validation_Evidence.md` §5.2, §7 | Confirms G1 blocks EC-1, EC-2, and EC-3. |
| Gap impact | `D-P3-04_Migration_Updates_Required_for_Contract_Gaps.md` §4, §5, §7 | G1 requires either canonical signature update or new canonical function; maps to Phase 3 exit criteria. |
| Canonical-first principle | `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1, §4 Phase 3 Scope | Canonical source governs; contract ambiguity and duplicate RPCs are in scope for elimination. |
| Phase 3 exit criteria | `CURRENT_PHASE.md` §4 | EC-1, EC-2, EC-3 must be satisfied before Phase 3 closes. |
| Acceptance review | `PHASE3_ACCEPTANCE_REVIEW.md` §4, §5 | Records that G1 is the primary blocker and that a canonical decision is required. |

---

*No code, migration, SQL, schema, type, or service changes were made in the production of this decision document. Implementation is explicitly out of scope and awaits Program Manager approval of this architecture decision.*
