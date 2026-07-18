# CURRENT_TASK-008 — Storage Usage Canonical Contract Decision (G4)

**Task ID:** CURRENT_TASK-008  
**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Work Unit:** G4  
**Priority:** P1  
**Status:** Decision Ready — Pending Program Manager Approval  
**Date:** 2026-07-14  
**Decision Authority:** Program Manager, with required input from Architecture Authority

---

## 1. Executive Summary

This document records the canonical-contract architecture decision for Gap G4: the invoked RPC `get_storage_usage` does not exist in the canonical migration chain, and the service layer calls it from two wrappers (`getStorageUsage` and `getTenantStorageUsage`) with different tenant semantics.

**Decision:** **APPROVE Option C — The canonical contract for storage usage is already correct as the existing system-wide function `public.get_tenant_storage_usage()`.**

`get_storage_usage` is **not** a missing canonical capability. The canonical migration chain already defines a system-wide storage-usage report at `public.get_tenant_storage_usage()`. That function returns exactly the `StorageUsage` contract the service layer expects. The only gap is a service-boundary defect: the production code calls a non-canonical RPC name (`get_storage_usage`) and exposes a tenant-scoped wrapper (`getStorageUsage(tenantId)`) that has no production consumer.

Therefore, no new canonical function should be introduced for G4. The canonical contract remains unchanged, and the implementation task that follows this decision should align the service layer to the canonical name and remove the dead tenant-scoped wrapper.

Implementation of this decision is **not** authorized by this document and must await a separate, Program-Manager-approved implementation task.

---

## 2. Scope

### 2.1 In Scope

- Gap G4 only: `get_storage_usage` versus `get_tenant_storage_usage`.
- Determination of whether storage usage is one canonical capability or two (tenant-scoped vs. system-wide).
- Canonical contract decision for the storage-usage boundary.
- Impact on Phase 3 exit criteria.

### 2.2 Out of Scope

- G5, G6, aliases, facade-barrel cleanup, or other Phase 3 gaps.
- SQL, migration authoring, schema regeneration, type regeneration, or service code changes.
- Creation of a new `CURRENT_TASK`, roadmap, or Phase 4 planning.

---

## 3. Business Capability Analysis

The RPC name `get_storage_usage` represents **system-wide storage reporting for platform administration**.

What it actually does in the codebase today:

- Returns `StorageUsage`, which contains:
  - `checkedAt`: timestamp of the report.
  - `totalDatabaseBytes`: total database size.
  - `tenants`: an array of per-tenant estimated byte usage and table breakdowns.
- Requires `public.is_system_admin()` authorization.
- Computes estimates from `pg_total_relation_size`, `pg_stat_user_tables`, and `pg_database_size` across all tenant-scoped tables.

The business capability is therefore: **a system administrator views aggregate database storage consumption across all tenants**. A tenant-scoped view (returning only one tenant's slice) would be a **filter or projection** on that same aggregate report, not a separate business capability.

Evidence for this conclusion:

- The only production UI caller is `components/StorageBackupPanel.tsx:42`, which calls `getTenantStorageUsage()` and renders a system-wide "Storage theo tenant" table.
- `getStorageUsage(tenantId)` is not imported or called by any production page, component, or test that exercises the tenant-facing UI.
- The canonical function `get_tenant_storage_usage()` is named to express per-tenant breakdowns within a system-wide report; its return contract matches `StorageUsage` exactly.

---

## 4. Existing Canonical Analysis

### 4.1 Existing Canonical Function

Source: canonical migration chain, `supabase/schema.sql` (D-P2-03), final definition at lines **24132–24215**; originally introduced by migration `20250708000002_phase_p13_3_storage_backup.sql`.

```text
CREATE OR REPLACE FUNCTION public.get_tenant_storage_usage()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
```

Function behavior:

- Guards with `IF NOT public.is_system_admin() THEN RAISE EXCEPTION ...`.
- Iterates over tables that contain `tenant_id`.
- Estimates per-tenant bytes using `pg_total_relation_size` and row-count sampling.
- Returns a JSON object with `checkedAt`, `totalDatabaseBytes`, and `tenants` array.

This return shape matches the TypeScript `StorageUsage` type defined in `types/tenant.ts:412-416`.

### 4.2 Generated Type Artifact

Source: `supabase/generated/database.types.ts:5568`.

```text
get_tenant_storage_usage: { Args: never; Returns: Json }
```

The canonical function is already reflected in generated types.

### 4.3 Service-Layer Assumed Contract

Source: `services/tenantService.ts:1015-1029`, recorded in `D-P3-02_Service_Layer_Contract_Consistency_Report.md` §6.2 and §13.

| Service Function | RPC Invoked | Parameters | Return Type | Status |
|---|---|---|---|---|
| `getStorageUsage(tenantId)` | `get_storage_usage` | `p_tenant_id: tenantId` | `StorageUsage` | Calls missing RPC; no production caller found |
| `getTenantStorageUsage()` | `get_storage_usage` | `p_tenant_id: null` | `StorageUsage` | Calls missing RPC; used by `StorageBackupPanel.tsx:42` |

Both wrappers normalize the RPC result with `mapStorageUsageFromDB` (`services/tenantService.ts:168-172`), which expects the exact JSON shape returned by `get_tenant_storage_usage()`.

### 4.4 Comparison Summary

| Attribute | `get_tenant_storage_usage()` (canonical) | `get_storage_usage` (service call) | Assessment |
|---|---|---|---|
| Exists in canonical migrations | Yes | No | Canonical function already exists |
| System-wide report | Yes | Assumed by `getTenantStorageUsage()` | Same capability |
| Tenant-scoped report | No | Assumed by `getStorageUsage(tenantId)` | No production consumer |
| Authorization | `is_system_admin()` | Implicitly system admin (admin panel) | Same |
| Return shape | `StorageUsage` JSON | `StorageUsage` (mapped) | Same |
| Domain concept | Aggregate infrastructure metric | Same | Same |

**Conclusion:** The canonical contract for storage usage already exists. The service layer is calling the wrong RPC name and exposing an unused tenant-scoped variant.

---

## 5. Architecture Boundary Analysis

### 5.1 Option A — One Canonical Function with Optional Tenant Parameter

Define a single canonical function such as `get_storage_usage(p_tenant_id UUID DEFAULT NULL)` that returns `StorageUsage` for all tenants when `p_tenant_id` is null, or filters the tenants array to one tenant when provided.

This option treats tenant-scoped and system-wide storage usage as one capability with a parameter-driven view.

### 5.2 Option B — Two Separate Canonical Functions

Create two canonical functions:

- `get_storage_usage(p_tenant_id UUID)` for tenant-scoped storage usage.
- `get_tenant_storage_usage()` for system-wide storage usage.

This option treats tenant-scoped and system-wide storage usage as distinct capabilities.

### 5.3 Option C — Keep the Existing Canonical Contract

Recognize that the canonical migration chain already defines `get_tenant_storage_usage()` for the system-wide report. Resolve G4 as a service-boundary cleanup:

- `getTenantStorageUsage()` should call `get_tenant_storage_usage()`.
- `getStorageUsage(tenantId)` should be removed because it has no production consumer.

No canonical migration change is required.

---

## 6. Domain Analysis

**Storage usage belongs to the System Administration Aggregate, not the Tenant Aggregate.**

Reasoning:

- The data source is database infrastructure metadata (`pg_stat_user_tables`, `pg_total_relation_size`, `pg_database_size`), not tenant-owned business data.
- The authorization gate is system-admin-only (`is_system_admin()`).
- The primary consumer is the platform admin dashboard (`StorageBackupPanel`).
- A tenant-scoped view would still derive from the same infrastructure scan; it is a read-only projection of a system administration report, not an independent tenant capability.

Because the tenant-scoped path has no confirmed production caller, there is no domain evidence to justify making it a separate canonical contract. The existing system-wide function is the correct canonical boundary.

---

## 7. Option Comparison Matrix

| Criterion | Option A — Optional Parameter | Option B — Two Functions | Option C — Keep Existing |
|---|---|---|---|
| **Canonical purity** | Medium — one function, but adds a parameter to support a dead-code path. | Low — two names for the same underlying scan/report. | High — no new canonical surface; reuses existing function. |
| **Maintainability** | Lower — function must support and test two return shapes/views. | Lower — two functions to keep consistent whenever estimation logic changes. | Higher — only one canonical function to maintain. |
| **Backward compatibility** | Requires replacing or aliasing `get_tenant_storage_usage`; existing callers may break. | Keeps `get_tenant_storage_usage` but adds a second function; expands surface. | Fully backward compatible — existing canonical function is unchanged. |
| **Complexity** | Adds conditional filtering logic and an optional parameter for an unused path. | Duplicates the storage-estimation pipeline or splits it into shared helpers. | Lowest — no canonical change; service call rename only. |
| **Long-term consistency** | Risks future divergence between tenant and system-wide behavior. | Institutionalizes two contracts for the same aggregate report. | Preserves single source of truth for storage reporting. |
| **YAGNI alignment** | Builds for a tenant-scoped path that no production code uses. | Builds a new canonical function for a path that no production code uses. | Removes dead code; only supports confirmed capability. |
| **Phase 3 exit support** | Would satisfy EC-1/EC-2 after migration and service changes. | Would satisfy EC-1/EC-2 after migration and service changes. | Satisfies EC-1/EC-2/EC-4 with service-boundary cleanup only; no canonical migration required. |

**Conclusion:** Option C is the strongest on canonical purity, maintainability, backward compatibility, and YAGNI alignment.

---

## 8. Canonical Contract Decision

**APPROVE Option C — The canonical contract for storage usage remains `public.get_tenant_storage_usage()`.**

### 8.1 Rationale

1. **Canonical function already exists.** The migration chain defines `get_tenant_storage_usage()` with the exact `StorageUsage` contract the service layer expects.
2. **Single business capability.** System-wide storage reporting and tenant-filtered storage reporting are the same capability at different granularities; the existing function provides the authoritative system-wide view.
3. **No production consumer for tenant-scoped view.** `getStorageUsage(tenantId)` has no production caller, so a tenant-scoped canonical function would support dead code.
4. **Domain ownership is system administration.** The function reads infrastructure metadata and requires system-admin authorization; it does not belong to the Tenant Aggregate.
5. **Canonical purity.** Adding `get_storage_usage` to the migration chain would create a second name for the same capability, violating the canonical-first principle.
6. **Backward compatibility.** Keeping the existing function avoids any schema, migration, or generated-type churn.
7. **Lazy senior-dev principle.** Reuse the existing canonical function and remove the dead wrapper rather than building new canonical surface.

### 8.2 Decision Statement

The canonical contract for storage usage shall remain:

```text
public.get_tenant_storage_usage()
RETURNS JSON
```

This function returns a system-wide `StorageUsage` report including `checkedAt`, `totalDatabaseBytes`, and a `tenants` array.

The RPC name `get_storage_usage` **shall not** be introduced into the canonical migration chain. The service-layer wrappers that currently invoke `get_storage_usage` shall be reconciled against the canonical `get_tenant_storage_usage()` function in the implementation task that follows this decision.

---

## 9. Phase 3 Exit Impact

Source: `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 3 Exit Criteria; `PHASE3_ACCEPTANCE_REVIEW.md` §4; `D-P3-04_Migration_Updates_Required_for_Contract_Gaps.md` §4, §5.

| Exit Criterion | Status Before G4 Resolution | Impact of This Decision |
|---|---|---|
| **EC-1:** Every RPC invoked by production service code maps to a canonical migration function. | Not satisfied for G4 (`get_storage_usage` missing). | Satisfied for G4 once `getTenantStorageUsage()` is aligned to call `get_tenant_storage_usage()`. |
| **EC-2:** No production path calls a function that migrations do not define. | Not satisfied for G4. | Satisfied for G4 once the service no longer calls `get_storage_usage`. |
| **EC-3:** Confirmed signature drift is reconciled or explicitly split into a separately named canonical function. | Not applicable to G4 — no canonical signature drift exists. | No canonical change required; service alignment is a naming/boundary cleanup. |
| **EC-4:** Duplicate or ambiguous wrappers are resolved into a single canonical contract surface. | Not satisfied (G4 ambiguity A3 and G5 wrapper duplication). | Supports EC-4: `getStorageUsage(tenantId)` is removed, leaving one wrapper (`getTenantStorageUsage`) for the one canonical function. |
| **EC-5:** Alias patterns are documented or removed. | Partially satisfied. | No direct impact; G6/A4 remain separate decisions. |

### 9.1 Reclassification of G4

`D-P3-04` originally classified G4 as **"New Canonical Function Required."** This architecture decision reclassifies G4 as:

- **Canonical contract:** already exists.
- **Required change:** service-boundary naming alignment and dead-code removal.
- **Canonical migration impact:** **none**.

---

## 10. Recommendation

1. **Approve Option C** as the canonical contract direction for G4.
2. **Authorize an implementation task** (separate from this decision document) to:
   - Change `services/tenantService.ts:getTenantStorageUsage()` to call `supabase.rpc('get_tenant_storage_usage')` instead of `get_storage_usage`.
   - Remove `services/tenantService.ts:getStorageUsage(tenantId)` because it has no production caller.
   - Update `docs/admin-dashboard/RPC_CONTRACTS.md` to remove the stale `get_storage_usage` row and confirm `get_tenant_storage_usage` as the canonical RPC.
   - Update `tests/mocks/supabase.ts` to remove the mock for `get_storage_usage` if it becomes unreachable.
3. **Do not create** a canonical `get_storage_usage` function, and do not extend `get_tenant_storage_usage()` with an optional tenant parameter unless a real tenant-scoped consumer is identified.

---

## 11. Evidence References

| Evidence | Source | What It Proves |
|---|---|---|
| Canonical function definition | `supabase/schema.sql` lines **24132–24215** | `get_tenant_storage_usage()` exists in the canonical migration chain and returns `StorageUsage` JSON. |
| Generated type artifact | `supabase/generated/database.types.ts:5568` | `get_tenant_storage_usage` is already reflected in generated types. |
| Service call sites | `services/tenantService.ts:1015–1029` | Both `getStorageUsage` and `getTenantStorageUsage` call the missing `get_storage_usage` RPC. |
| Return-type mapping | `services/tenantService.ts:168–172` | `mapStorageUsageFromDB` expects the exact JSON shape returned by `get_tenant_storage_usage()`. |
| TypeScript domain type | `types/tenant.ts:412–416` | `StorageUsage` defines `checkedAt`, `totalDatabaseBytes`, and `tenants[]`. |
| Production UI consumer | `components/StorageBackupPanel.tsx:42` | Only `getTenantStorageUsage()` is used; it renders system-wide storage per tenant. |
| Dead-code evidence | `grep` across `pages/`, `components/`, and `services/` for `getStorageUsage(` | No production caller for `getStorageUsage(tenantId)`. |
| Test mock | `tests/mocks/supabase.ts:1545–1563`, `tests/mocks/supabase.ts:2005–2025` | Mocks confirm both `get_tenant_storage_usage` and `get_storage_usage` return the same system-wide shape. |
| RPC contract mapping | `D-P3-01_Reconciled_RPC_Contract.md` §6, §7.1 | `get_storage_usage` is listed as missing; `get_tenant_storage_usage` is listed as a defined canonical function. |
| Service-layer classification | `D-P3-02_Service_Layer_Contract_Consistency_Report.md` §6.2, §12, §13 | G4 is classified as contract ambiguity caused by a missing RPC and two wrappers with different tenant semantics. |
| Independent validation | `D-P3-03_RPC_Coverage_Validation_Evidence.md` §5.2, §7, §8.1 | Confirms `get_storage_usage` is missing and blocks EC-1/EC-2. |
| Gap impact | `D-P3-04_Migration_Updates_Required_for_Contract_Gaps.md` §3.1, §4, §5 | Originally classified G4 as requiring a new canonical function; this decision corrects that classification. |
| SCAR Phase 2 findings | `SCAR_PHASE2_REPORT.md` §C1, §M1, evidence table | Confirms `get_storage_usage` is one of the four missing RPCs and that the storage-report wrapper is dead/ambiguous. |
| Phase 3 exit criteria | `CURRENT_PHASE.md` §4 | EC-1, EC-2, EC-4 must be satisfied before Phase 3 closes. |
| Acceptance review | `PHASE3_ACCEPTANCE_REVIEW.md` §4, §5 | Records that G4 is a remaining blocker requiring a canonical decision. |
| Canonical-first principle | `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1, §4 Phase 3 Scope | The migration chain is the single source of truth; contract ambiguity and duplicate RPCs should be eliminated. |

---

*No code, migration, SQL, schema, type, or service changes were made in the production of this decision document. Implementation is explicitly out of scope and awaits Program Manager approval of this architecture decision.*
