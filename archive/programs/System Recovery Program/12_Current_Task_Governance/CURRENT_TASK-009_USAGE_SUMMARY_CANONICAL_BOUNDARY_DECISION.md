# CURRENT_TASK-009 — Usage Summary Canonical Boundary Decision (G5)

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Task:** G5 — Usage Summary Service Boundary Decision  
**Date:** 2026-07-14  
**Status:** Approved — Implemented  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE3_ACCEPTANCE_REVIEW.md`, `D-P3-01`, `D-P3-02`, `D-P3-03`, `D-P3-04`  

---

## 1. Executive Summary

This document decides the canonical service-layer boundary for the tenant usage-summary capability exposed by two identical wrappers in `services/tenantService.ts`.

- `getUsageSummary(tenantId)` is the **canonical service API**.
- `getTenantUsageSummary(tenantId)` is a **duplicate wrapper with no production caller** and should be removed.
- The canonical RPC, `public.get_tenant_usage_summary(p_tenant_id UUID)`, is already correct and requires no migration change.
- No production backward-compatibility bridge is required because no production UI, page, or service path calls `getTenantUsageSummary`.
- The three smoke tests that import `getTenantUsageSummary` must be updated to import `getUsageSummary` in the next authorized service-boundary cleanup work.

This decision closes the architectural question for G5. It does not perform any implementation, migration, schema change, or generated-type change.

---

## 2. Current Architecture

### 2.1 Canonical RPC Contract

| Attribute | Value |
|---|---|
| RPC | `public.get_tenant_usage_summary` |
| Parameters | `p_tenant_id UUID` |
| Returns | `JSON` |
| Canonical location | `supabase/schema.sql` (latest effective migration `20260712000010_fix_get_tenant_usage_summary_tenant_admin.sql`) |
| Generated type | `get_tenant_usage_summary: { Args: { p_tenant_id: string }; Returns: Json }` |

The canonical RPC is already defined in the migration chain and is the only acceptable source of truth for the usage-summary capability per `SYSTEM_RECOVERY_MASTER_PLAN.md`, §2.

### 2.2 Service-Layer Wrappers

Both exported service functions live in `services/tenantService.ts` and wrap the same canonical RPC:

| Function | File | Line | RPC Called | Parameters | Return Type | Mapper |
|---|---|---|---|---|---|---|
| `getUsageSummary(tenantId)` | `services/tenantService.ts` | 469 | `get_tenant_usage_summary` | `{ p_tenant_id: tenantId }` | `Promise<UsageSummary>` | `normalizeRpcObject(data, mapUsageSummaryFromDB)` |
| `getTenantUsageSummary(tenantId)` | `services/tenantService.ts` | 497 | `get_tenant_usage_summary` | `{ p_tenant_id: tenantId }` | `Promise<UsageSummary>` | `normalizeRpcObject(data, mapUsageSummaryFromDB)` |

The second function is preceded by the comment `// ponytail: aliases used by the admin dashboard; reuse the same RPCs as above.` but is not currently consumed by any admin-dashboard component.

### 2.3 Admin Service Re-Export

`services/admin/tenantAdminService.ts` re-exports `getTenantUsageSummary` from `tenantService.ts` at line 238. No component in `components/` or `pages/` imports this symbol from `tenantAdminService.ts` or `systemAdminService.ts`.

---

## 3. Production Usage Analysis

### 3.1 Production Callers

A full search across `pages/`, `components/`, `services/`, and `utils/` was performed for both symbols.

| Symbol | Production Caller | Import / Call Site | Usage Context |
|---|---|---|---|
| `getUsageSummary` | `components/MemberManagement/MemberInviteModal.tsx` | `import { getUsageSummary } from '../../services/tenantService';` line 8; call line 50 | Member-invite quota check |
| `getUsageSummary` | `components/InvoiceCreator.tsx` | `import { getTenantsAdmin, getUsageSummary } from '../services/tenantService';` line 4; call line 43 | Invoice creation usage fetch |
| `getTenantUsageSummary` | **None** | — | — |

### 3.2 Test and Re-Export Usage

| Symbol | Consumer | Context |
|---|---|---|
| `getTenantUsageSummary` | `tests/smoke/admin-dashboard-p2-subscription-usage.test.ts` | Smoke test imports from `services/tenantService` |
| `getTenantUsageSummary` | `tests/smoke/admin-dashboard-p6-operations-support.test.ts` | Smoke test imports from `services/tenantService` |
| `getTenantUsageSummary` | `tests/smoke/admin-dashboard-p8-1-plan-builder-schema.test.ts` | Smoke test imports from `services/tenantService` |
| `getTenantUsageSummary` | `services/admin/tenantAdminService.ts` | Re-export from `services/tenantService` |

No production path, edge function, or external consumer uses `getTenantUsageSummary`. It is dead code in the production contract surface, kept alive only by test imports and a re-export.

---

## 4. Wrapper Comparison

| Dimension | `getUsageSummary` | `getTenantUsageSummary` |
|---|---|---|
| **Canonical RPC invoked** | `get_tenant_usage_summary` | `get_tenant_usage_summary` |
| **Parameter object** | `{ p_tenant_id: tenantId }` | `{ p_tenant_id: tenantId }` |
| **Return type** | `Promise<UsageSummary>` | `Promise<UsageSummary>` |
| **Result mapping** | `normalizeRpcObject(data, mapUsageSummaryFromDB)` | `normalizeRpcObject(data, mapUsageSummaryFromDB)` |
| **Implementation** | Identical | Identical |
| **Production callers** | 2 UI components | 0 |
| **Test callers** | 0 | 3 smoke tests |
| **Re-exported by admin service** | No | Yes (`tenantAdminService.ts`) |
| **Intention documented** | No special comment | `// ponytail: aliases used by the admin dashboard` |
| **First appearance in file** | Line 469 | Line 497 (after `getUsageSummary`) |

**Verdict:** The two wrappers are byte-identical except for name. They perform the same RPC call, the same mapping, and return the same domain type. One name is sufficient for the canonical contract surface.

---

## 5. Option Analysis (A/B/C)

### Option A — Keep `getUsageSummary` as canonical, remove `getTenantUsageSummary`

- **Action:**
  - Retain `getUsageSummary` in `services/tenantService.ts`.
  - Delete `getTenantUsageSummary` from `services/tenantService.ts`.
  - Remove the `getTenantUsageSummary` re-export from `services/admin/tenantAdminService.ts`.
  - Update the three smoke tests to import `getUsageSummary`.
- **Pros:**
  - Zero production churn; existing production UI components continue to work.
  - `getUsageSummary` already has the only production callers, so it is the de facto canonical API.
  - Removes duplicate code with no functional risk.
  - Satisfies Phase 3 EC-4 for the G5 wrapper duplication.
- **Cons:**
  - Smoke tests must be updated (acceptable as Phase 4 derived-validation-layer realignment).
  - The admin-dashboard-specific naming convention (`getTenantUsageSummary`) is lost.

### Option B — Keep `getTenantUsageSummary` as canonical, migrate production callers to it

- **Action:**
  - Retain `getTenantUsageSummary` in `services/tenantService.ts`.
  - Delete `getUsageSummary` from `services/tenantService.ts`.
  - Update `components/MemberManagement/MemberInviteModal.tsx` and `components/InvoiceCreator.tsx` to import `getTenantUsageSummary`.
  - Keep the `tenantAdminService.ts` re-export.
  - Update any tests that import `getUsageSummary`.
- **Pros:**
  - Name is more explicit and matches the admin-dashboard re-export pattern.
- **Cons:**
  - Requires changing two production components for zero functional benefit.
  - Introduces avoidable regression risk in active UI paths (member invite, invoice creation).
  - Conflicts with the principle of least churn during a recovery program.
  - `getUsageSummary` is the name that already works in production; renaming it is not justified.

### Option C — Keep both wrappers, document the alias in a canonical boundary registry

- **Action:**
  - Leave both functions in `services/tenantService.ts`.
  - Register `getTenantUsageSummary` as an intentional alias of `getUsageSummary`.
- **Pros:**
  - Zero code churn today.
- **Cons:**
  - Fails to satisfy Phase 3 Exit Criterion EC-4: "Duplicate or ambiguous wrappers are resolved into a single canonical contract surface."
  - Perpetuates a duplicate that expands the service API surface without adding capability, contradicting the Phase 3 objective.
  - Sets a precedent that duplicate wrappers can remain if documented, which weakens the canonical boundary.

---

## 6. Final Architecture Decision

**Decision:** Adopt **Option A**.

| Element | Decision |
|---|---|
| **Canonical service API** | `getUsageSummary(tenantId: string): Promise<UsageSummary>` in `services/tenantService.ts` |
| **Canonical RPC** | `public.get_tenant_usage_summary(p_tenant_id UUID)` — unchanged |
| **Duplicate wrapper to remove** | `getTenantUsageSummary` in `services/tenantService.ts` and its re-export in `services/admin/tenantAdminService.ts` |
| **Backward compatibility** | Not required for production; no production caller uses `getTenantUsageSummary` |
| **Test impact** | Three smoke tests must import `getUsageSummary` instead of `getTenantUsageSummary` |
| **Canonical migration change** | None |
| **Schema change** | None |
| **Generated type change** | None |

### Rationale

1. **Production reality is the arbiter.** The only production callers of the usage-summary capability use `getUsageSummary`. That makes it the canonical service API by usage.
2. **No migration or canonical RPC change is needed.** The underlying RPC is already correct and aligned with the service call. This is purely a service-boundary cleanup.
3. **Minimizing churn is the safer path.** Option A avoids touching any production UI component. Option B would force changes to active member-invite and invoice-creation flows.
4. **Duplicate wrappers are resolved, not grandfathered.** Option C would leave the contract surface ambiguous and prevent Phase 3 EC-4 from being satisfied.
5. **The alias was aspirational, not realized.** The `// ponytail: aliases used by the admin dashboard` comment implies the second function was intended for admin-dashboard consumption, but no admin-dashboard component imports it. It is therefore dead code in the production surface.

---

## 7. Phase 3 Exit Impact

| Phase 3 Exit Criterion | Status Before G5 Decision | Impact of This Decision |
|---|---|---|
| EC-1: Every RPC invoked by production service code maps to a canonical migration function. | Not satisfied (G1–G4) | **No impact.** G5 is not a missing-RPC gap. The canonical RPC already exists. |
| EC-2: No production path calls a function that migrations do not define. | Not satisfied (G1–G4) | **No impact.** No production path calls `getTenantUsageSummary`; `getUsageSummary` already calls the canonical RPC. |
| EC-3: Confirmed signature drift is reconciled or split. | Not satisfied (G1) | **No impact.** G5 involves no signature drift. |
| EC-4: Duplicate or ambiguous wrappers are resolved into a single canonical contract surface. | Not satisfied (G5) | **Partially satisfied.** Removing the duplicate wrapper resolves the G5 portion of EC-4. The remaining alias/facade items (G6 / A4) must still be addressed for EC-4 to be fully satisfied. |
| EC-5: Alias patterns that create shadow contracts are documented or removed. | Partially satisfied (G6 / A4) | **No direct impact.** `getTenantUsageSummary` is a duplicate wrapper, not merely an alias; its removal reduces the naming surface but does not change the alias register. |

### 7.1 Gap Closure Map

| Gap | This Decision | Remaining Work |
|---|---|---|
| G5 | Resolved by choosing `getUsageSummary` as canonical and removing `getTenantUsageSummary`. | Implementation of removal and test update in an authorized `CURRENT_TASK`. |
| G6 | Not resolved. | Document or remove the four explicit aliases (`getTenantById`, `getTenantMembers`, `checkSubdomain`, `restoreTenantStatus`). |
| A4 | Not resolved. | Decide whether the `services/admin/systemAdminService.ts` facade barrel remains, is documented, or is dissolved. |
| G1–G4 | Not addressed by this document. | Require separate canonical migration updates per `D-P3-04`. |

---

## 8. Recommendation

Authorize the next service-boundary cleanup work (either as a dedicated `CURRENT_TASK` or bundled with other authorized Phase 3 service-boundary work) to implement the following minimal changes:

1. **Remove `getTenantUsageSummary` from `services/tenantService.ts`.**
   - Delete lines 496–503 (the function and its `// ponytail` comment).
   - Keep `getUsageSummary` at lines 469–475 unchanged.

2. **Remove the `getTenantUsageSummary` re-export from `services/admin/tenantAdminService.ts`.**
   - Delete the symbol from the `export { ... } from '../tenantService';` block at lines 232–247.

3. **Update the three affected smoke tests to import `getUsageSummary`.**
   - `tests/smoke/admin-dashboard-p2-subscription-usage.test.ts`
   - `tests/smoke/admin-dashboard-p6-operations-support.test.ts`
   - `tests/smoke/admin-dashboard-p8-1-plan-builder-schema.test.ts`

4. **No canonical migration, no schema change, no generated-type change.**
   - The underlying RPC `get_tenant_usage_summary` is already correct.

5. **Verification step for the authorized work.**
   - After the change, `grep` across `services/` and `components/` for `getTenantUsageSummary` should return zero matches.
   - The `getUsageSummary` production callers (`MemberInviteModal`, `InvoiceCreator`) must continue to function.
   - The three smoke tests must pass with the renamed import.

### What This Decision Does NOT Authorize

- This document does not authorize any change to `getUsageSummary` itself, to the canonical RPC `get_tenant_usage_summary`, or to any caller of `getUsageSummary`.
- It does not authorize G1–G4 implementation, G6 alias removal, or A4 facade-barrel resolution.
- It does not advance Phase 4 or any other phase.

---

## 9. Evidence

### 9.1 Code Evidence

| Evidence | Location |
|---|---|
| `getUsageSummary` definition | `services/tenantService.ts:469–475` |
| `getTenantUsageSummary` definition | `services/tenantService.ts:497–503` |
| `getTenantUsageSummary` re-export | `services/admin/tenantAdminService.ts:238` |
| `getUsageSummary` production caller — member invite | `components/MemberManagement/MemberInviteModal.tsx:8,50` |
| `getUsageSummary` production caller — invoice creator | `components/InvoiceCreator.tsx:4,43` |
| `getTenantUsageSummary` test caller — P2 subscription | `tests/smoke/admin-dashboard-p2-subscription-usage.test.ts:16,44,58,103` |
| `getTenantUsageSummary` test caller — P6 operations | `tests/smoke/admin-dashboard-p6-operations-support.test.ts:22,109` |
| `getTenantUsageSummary` test caller — P8.1 plan builder | `tests/smoke/admin-dashboard-p8-1-plan-builder-schema.test.ts:20,118,133` |
| Canonical RPC definition | `supabase/schema.sql:9463`, `17629`, `30218`, `31057` (latest effective version at `31057`) |

### 9.2 Governance Evidence

| Evidence | Document | Relevant Section |
|---|---|---|
| Phase 3 purpose, scope, and exit criteria | `SYSTEM_RECOVERY_MASTER_PLAN.md` | §4, Phase 3 — RPC Contract Reconciliation |
| G5 identified as wrapper duplication | `D-P3-02_Service_Layer_Contract_Consistency_Report.md` | §6.2, §8 |
| G5 classified as service-side issue with no migration change | `D-P3-04_Migration_Updates_Required_for_Contract_Gaps.md` | §5 Migration Update Requirement Matrix, §6 Contract Change Classification |
| EC-4 blocked by G5 | `PHASE3_ACCEPTANCE_REVIEW.md` | §4 Exit Criteria Review |
| G5 remains open in prior tasks | `CURRENT_TASK-008_IMPLEMENTATION_REPORT.md` | §1 Executive Summary |

### 9.3 Search Commands Used

- `grep "getUsageSummary\|getTenantUsageSummary"` across `services/`, `components/`, `pages/`, `tests/` confirmed all call sites.
- `grep "get_tenant_usage_summary"` in `supabase/schema.sql` confirmed canonical RPC definition and migration lineage.
- Manual inspection of `services/tenantService.ts` lines 440–529 confirmed byte-identical wrapper implementation.

---

*This document is a contract-level decision. It contains no implementation, no code changes, no migration, no schema change, and no generated-type change. Implementation of the decided boundary cleanup is authorized separately through the Phase 3 `CURRENT_TASK` process.*
