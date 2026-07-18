# CURRENT_TASK-010 — Implementation Report (G6)

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Task:** G6 — Alias Canonical Boundary  
**Date:** 2026-07-14  
**Status:** COMPLETE

---

## 1. Executive Summary

Closed G6 by removing the four explicit aliases identified in `D-P3-02_Service_Layer_Contract_Consistency_Report.md` and migrating every caller to the underlying canonical function names.

| Alias | Canonical Name | Disposition |
|---|---|---|
| `getTenantById` | `getTenant()` | **REMOVED** |
| `getTenantMembers` | `getMembers()` | **REMOVED** |
| `checkSubdomain` | `checkSubdomainAvailability()` | **REMOVED** |
| `restoreTenantStatus` | `restoreTenant()` | **REMOVED** |

No schema change, migration change, generated-type change, canonical RPC change, or business-logic change was introduced. The underlying functions, RPCs, and Edge Function invocations remain untouched.

---

## 2. Files Changed

| File | Change Type | Purpose |
|------|-------------|---------|
| `services/tenantService.ts` | Modified | Removed `export const getTenantById = getTenant;` and `export const getTenantMembers = getMembers;` aliases. |
| `services/admin/tenantAdminService.ts` | Modified | Removed `getTenantById` from the re-export block; removed `export const restoreTenantStatus = restoreTenant;` alias and added `restoreTenant` to the re-export block so the admin facade stays intact. |
| `services/admin/memberAdminService.ts` | Modified | Removed `getTenantMembers` from the re-export block. |
| `services/admin/systemAdminService.ts` | Modified | Removed `checkSubdomainAvailability as checkSubdomain` re-export. |
| `pages/admin/Tenants.tsx` | Modified | Imports and calls `restoreTenant` (aliased locally to `restoreTenantFn` to avoid shadowing the existing `restoreTenant` React state variable). |
| `tests/tenant.test.ts` | Modified | Imports and calls `getTenant` and `getMembers` instead of aliases; updated test description. |
| `tests/smoke/admin-dashboard-p7-3-payment-confirm-lifecycle.test.ts` | Modified | Imports and calls `getTenant` instead of `getTenantById`. |
| `tests/smoke/admin-dashboard-p6-operations-support.test.ts` | Modified | Imports and calls `checkSubdomainAvailability` from `services/admin/tenantAdminService` instead of `checkSubdomain` from `services/admin/systemAdminService`. |
| `tests/admin-dashboard/Tenants.test.tsx` | Modified | Mocks `restoreTenant` instead of `restoreTenantStatus`. |
| `CURRENT_TASK-010_ALIAS_CANONICAL_BOUNDARY_DECISION.md` | Modified | Status updated from `Proposed — Pending Architecture Authority / Program Manager Decision` to `Approved — Implemented`. |

---

## 3. Alias Removal Detail

### 3.1 `services/tenantService.ts`

- Deleted `export const getTenantById = getTenant;` (line 922) and its `// ponytail:` alias comment.
- Deleted `export const getTenantMembers = getMembers;` (line 974) and its `// ponytail:` alias comment.

Canonical implementations `getTenant(id)` and `getMembers(tenantId)` remain unchanged.

### 3.2 `services/admin/tenantAdminService.ts`

- Removed `getTenantById` from the `export { ... } from '../tenantService';` re-export block.
- Removed `export const restoreTenantStatus = restoreTenant;` alias and its `// ponytail:` comment.
- Added `restoreTenant` to the same re-export block so `pages/admin/Tenants.tsx` continues to import the canonical function through the admin facade.
- Removed the now-unused `restoreTenant` import at the top of the file (it is now sourced via the re-export block).

### 3.3 `services/admin/memberAdminService.ts`

- Removed `getTenantMembers` from the `export { ... } from '../tenantService';` re-export block. `getMembers` and `getTenantMembersWithEmail` remain exported.

### 3.4 `services/admin/systemAdminService.ts`

- Removed the `export { checkSubdomainAvailability as checkSubdomain } from './tenantAdminService';` re-export block.

---

## 4. Caller Migrations

| Caller File | Before | After |
|---|---|---|
| `pages/admin/Tenants.tsx` | `import { ..., restoreTenantStatus, ... } from '../../services/admin/tenantAdminService';` | `import { ..., restoreTenant as restoreTenantFn, ... } from '../../services/admin/tenantAdminService';` and call `restoreTenantFn(tenant.id)` |
| `tests/tenant.test.ts` | `import { ..., getTenantMembers, getTenantById, ... }` and calls | `import { ..., getMembers, getTenant, ... }` and calls |
| `tests/smoke/admin-dashboard-p7-3-payment-confirm-lifecycle.test.ts` | `import { getTenantById } from '../../services/tenantService';` | `import { getTenant } from '../../services/tenantService';` and calls |
| `tests/smoke/admin-dashboard-p6-operations-support.test.ts` | `import { checkSubdomain } from '../../services/admin/systemAdminService';` | `import { checkSubdomainAvailability } from '../../services/admin/tenantAdminService';` and calls |
| `tests/admin-dashboard/Tenants.test.tsx` | `restoreTenantStatus: (...args) => mockedRestoreTenantStatus(...args)` | `restoreTenant: (...args) => mockedRestoreTenant(...args)` |

The local alias `restoreTenantFn` in `pages/admin/Tenants.tsx` is required because the component already declares a React state variable named `restoreTenant`. The function invoked is still the canonical `restoreTenant()` exported from `services/admin/tenantAdminService.ts`.

---

## 5. Validation Results

| Validation | Command | Result |
|------------|---------|--------|
| TypeScript compile | `npm run lint` (`tsc --noEmit`) | **PASS** |
| RPC contract audit | `npm run audit:rpc` | **PASS** — 125 contract RPCs ↔ 125 code RPCs |
| Affected tests | `npx vitest run tests/tenant.test.ts tests/smoke/admin-dashboard-p7-3-payment-confirm-lifecycle.test.ts tests/smoke/admin-dashboard-p6-operations-support.test.ts tests/admin-dashboard/Tenants.test.tsx` | **PASS** — 28/28 tests passed |
| Zero stale aliases in production source | `grep` across `*.{ts,tsx}` for `\bgetTenantById\b`, `\bgetTenantMembers\b`, `\bcheckSubdomain\b`, `\brestoreTenantStatus\b` | **PASS** — no matches in production source |

Evidence:

```text
> npm run lint
> tsc --noEmit
(exited 0)

> npm run audit:rpc
Contract RPCs : 125
Code RPCs     : 125
RPC contracts and service code are in sync.

> npx vitest run tests/tenant.test.ts tests/smoke/admin-dashboard-p7-3-payment-confirm-lifecycle.test.ts tests/smoke/admin-dashboard-p6-operations-support.test.ts tests/admin-dashboard/Tenants.test.tsx
✓ tests/smoke/admin-dashboard-p7-3-payment-confirm-lifecycle.test.ts (4 tests)
✓ tests/smoke/admin-dashboard-p6-operations-support.test.ts (7 tests)
✓ tests/tenant.test.ts (13 tests)
✓ tests/admin-dashboard/Tenants.test.tsx (4 tests)
Test Files 4 passed (4)
Tests 28 passed (28)
```

---

## 6. Remaining Phase 3 Gaps

| Gap | Item | Status | Reason |
|-----|------|--------|--------|
| G1 | `admin_update_subscription` / `updateSubscriptionLimits` | **CLOSED** (CURRENT_TASK-006) | Canonical RPC extended with `p_max_storage_gb`. |
| G2 | `get_member_with_email` / `getMemberWithEmail` | **CLOSED** (CURRENT_TASK-007) | Service now calls canonical `get_tenant_members_with_email`. |
| G3 | `search_members_by_email` / `searchMembers` | **CLOSED** (CURRENT_TASK-007) | Service now calls canonical `search_tenant_members`. |
| G4 | `get_storage_usage` / `getStorageUsage`, `getTenantStorageUsage` | **CLOSED** (CURRENT_TASK-008) | Service now calls canonical `get_tenant_storage_usage`; dead wrapper removed. |
| G5 | `getUsageSummary` / `getTenantUsageSummary` wrapper duplication | **CLOSED** (CURRENT_TASK-009) | Duplicate `getTenantUsageSummary` removed; `getUsageSummary` is the canonical service API. |
| G6 | Four documented aliases (`getTenantById`, `getTenantMembers`, `checkSubdomain`, `restoreTenantStatus`) | **CLOSED** (this task) | All aliases removed; callers migrated to canonical names. |
| A4 | `services/admin/systemAdminService.ts` facade barrel | **OPEN** | Out of scope for this task. |

Phase 3 EC-5 (“Alias patterns that create shadow contracts are documented or removed”) is now satisfied for explicit exported aliases. The A4 facade-barrel question remains the sole outstanding Phase 3 surface issue.

---

## 7. Evidence

- Changed files:
  - `services/tenantService.ts`
  - `services/admin/tenantAdminService.ts`
  - `services/admin/memberAdminService.ts`
  - `services/admin/systemAdminService.ts`
  - `pages/admin/Tenants.tsx`
  - `tests/tenant.test.ts`
  - `tests/smoke/admin-dashboard-p7-3-payment-confirm-lifecycle.test.ts`
  - `tests/smoke/admin-dashboard-p6-operations-support.test.ts`
  - `tests/admin-dashboard/Tenants.test.tsx`
  - `CURRENT_TASK-010_ALIAS_CANONICAL_BOUNDARY_DECISION.md`
- Validation logs: TypeScript `tsc --noEmit` exit code 0; `npm run audit:rpc` reports 125/125 RPCs in sync; affected tests 28/28 passed.

---

## 8. Conclusion

CURRENT_TASK-010 is complete.

- G6 = CLOSED
- All four aliases are removed from the production service layer.
- All production callers, test callers, and re-exports have been migrated to the canonical underlying function names.
- TypeScript compile, RPC audit, and all affected tests pass.

**Implementation: PASS**  
**Validation: PASS**

A4 remains open. Phase 3 Exit Validation is not started. Awaiting Program Manager review.
