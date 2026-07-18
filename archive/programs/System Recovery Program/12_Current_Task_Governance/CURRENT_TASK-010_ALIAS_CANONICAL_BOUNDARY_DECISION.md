# CURRENT_TASK-010 — Alias Canonical Boundary Decision (G6)

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Task:** G6 — Alias Canonical Boundary  
**Date:** 2026-07-14  
**Status:** Approved — Implemented  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE3_ACCEPTANCE_REVIEW.md`, `CURRENT_TASK-009_USAGE_SUMMARY_CANONICAL_BOUNDARY_DECISION.md`, `CURRENT_TASK-009_IMPLEMENTATION_REPORT.md`, `D-P3-01`, `D-P3-02`, `D-P3-03`, `D-P3-04`

---

## 1. Executive Summary

This document analyzes the four remaining explicit aliases in the service-layer contract surface identified by `D-P3-02_Service_Layer_Contract_Consistency_Report.md` and `PHASE3_ACCEPTANCE_REVIEW.md` as the G6 open item:

| # | Alias | Underlying Canonical Function | Location | Alias Type |
|---|---|---|---|---|
| 1 | `getTenantById` | `getTenant` | `services/tenantService.ts:922` | `const` alias |
| 2 | `getTenantMembers` | `getMembers` | `services/tenantService.ts:974` | `const` alias |
| 3 | `checkSubdomain` | `checkSubdomainAvailability` | `services/admin/systemAdminService.ts:30` | re-export alias |
| 4 | `restoreTenantStatus` | `restoreTenant` | `services/admin/tenantAdminService.ts:249` | `const` alias |

All four aliases are intentional, low-risk, and self-documented with `// ponytail:` comments. None alter signatures, return types, or RPC contracts. They exist solely to support an older naming convention or the admin-dashboard facade barrel.

**Recommendation:** Remove all four aliases and migrate their callers to the underlying canonical names. This satisfies Phase 3 Exit Criterion EC-5 (“Alias patterns that create shadow contracts are documented or removed”), continues the precedent established by G5 (`getTenantUsageSummary` removal), and reduces the exported contract surface without changing behavior.

**This document does not implement, migrate, regenerate types, or modify code. It is an architecture decision input awaiting Program Manager approval.**

---

## 2. Scope and Evidence

### 2.1 What Is In Scope

- Explicit exported aliases in the service layer that point to another exported service function with no behavioral change.
- The four aliases explicitly flagged in `D-P3-02`, `D-P3-04`, and `PHASE3_ACCEPTANCE_REVIEW.md`.

### 2.2 What Is Out of Scope

- The `services/admin/systemAdminService.ts` facade barrel as a whole (separate A4 item).
- Missing RPCs (G1–G4), signature drift, and duplicate wrappers already closed by `CURRENT_TASK-006` through `CURRENT_TASK-009`.
- Direct `.from(...)` table access patterns and non-exported internal symbols.

### 2.3 Evidence Sources

| Evidence | Source |
|---|---|
| Explicit alias inventory (4 aliases) | `D-P3-02_Service_Layer_Contract_Consistency_Report.md` §5, §6.2, §7.2 |
| Phase 3 acceptance findings | `PHASE3_ACCEPTANCE_REVIEW.md` §5.4 |
| G6 listed as remaining open item | `CURRENT_TASK-009_IMPLEMENTATION_REPORT.md` §7 |
| Source code for each alias | `services/tenantService.ts`, `services/admin/tenantAdminService.ts`, `services/admin/systemAdminService.ts` |
| Caller search across `pages/`, `components/`, `services/`, `tests/` | `grep` results captured below |

### 2.4 Alias Existence Verification

A targeted search for exported aliases in `services/` confirms exactly these four explicit exported aliases and no additional ones:

```text
services/tenantService.ts:922   export const getTenantById = getTenant;
services/tenantService.ts:974   export const getTenantMembers = getMembers;
services/admin/systemAdminService.ts:30  checkSubdomainAvailability as checkSubdomain
services/admin/tenantAdminService.ts:249 export const restoreTenantStatus = restoreTenant;
```

No other `export const X = Y;` or `export { Y as X }` alias patterns were found in the service layer. Any newly discovered alias would be recorded as Evidence and escalated; none were discovered.

---

## 3. Per-Alias Analysis

### 3.1 Alias: `getTenantById`

#### Canonical Implementation

| Attribute | Value |
|---|---|
| **Alias** | `getTenantById` |
| **Canonical implementation** | `getTenant(id: string): Promise<Tenant \| null>` in `services/tenantService.ts` |
| **Alias definition** | `export const getTenantById = getTenant;` |
| **Alias location** | `services/tenantService.ts:922` |
| **Comment** | `// ponytail: aliases for callers using the older naming convention.` |
| **Underlying mechanism** | `getTenant` performs a direct `supabase.from('tenants').select('*').eq('id', id).maybeSingle()` query; it is **not** an RPC wrapper. |

#### Ten Required Questions

1. **Canonical implementation:** `getTenant(id)` in `services/tenantService.ts`.
2. **Production callers of alias:** **0** — no `pages/`, `components/`, `services/`, or `utils/` file imports or calls `getTenantById` directly.
3. **Test callers of alias:** **2** — `tests/tenant.test.ts` (import line 22; call lines 120, 124, 195) and `tests/smoke/admin-dashboard-p7-3-payment-confirm-lifecycle.test.ts` (import line 12; call lines 45, 64).
4. **Duplicate wrapper?** No. It is a one-line `const` alias, not a duplicate wrapper implementation.
5. **Same RPC?** Not applicable. The alias does not call an RPC; the canonical `getTenant` uses direct table access.
6. **Different signature?** No. `getTenantById` inherits `getTenant`’s exact signature and return type.
7. **Backward compatibility requirement?** Test files use the alias. No production path uses it.
8. **Can remove?** Yes. Removing it requires updating two test files to import `getTenant` instead.
9. **Need compatibility alias?** No. The canonical name `getTenant` already exists and is stable.
10. **Architecture Recommendation:** Remove the alias; migrate test callers to `getTenant`.

#### Options Analysis

**Option A — Remove alias, migrate test callers to `getTenant`**
- **Action:** Delete `export const getTenantById = getTenant;`; update `tests/tenant.test.ts` and `tests/smoke/admin-dashboard-p7-3-payment-confirm-lifecycle.test.ts` to import and call `getTenant`.
- **Pros:** Eliminates shadow contract; zero production churn; canonical name is clearer (`getTenant` matches the entity).
- **Cons:** Two test files change (acceptable as derived-validation-layer realignment).
- **Risk:** Very low. Signature is identical; only imports change.
- **Verdict:** **Recommended.**

**Option B — Keep alias as documented compatibility layer**
- **Action:** Leave `getTenantById` in place; add a registry entry documenting it as an alias of `getTenant`.
- **Pros:** Zero code churn today.
- **Cons:** Fails Phase 3 EC-5 intent of removing or resolving alias patterns; perpetuates a naming surface that already has a canonical name.
- **Risk:** Low functional risk, but weakens canonical boundary discipline.
- **Verdict:** Rejected — does not advance Phase 3 closure.

**Option C — Rename canonical function to `getTenantById`, migrate all `getTenant` callers**
- **Action:** Rename `getTenant` to `getTenantById`; update every caller across the codebase.
- **Pros:** `getTenantById` is arguably more explicit.
- **Cons:** Massive churn for zero functional benefit; violates least-change principle during recovery.
- **Risk:** High — many production callers of `getTenant` would need changes.
- **Verdict:** Rejected — unjustified churn.

---

### 3.2 Alias: `getTenantMembers`

#### Canonical Implementation

| Attribute | Value |
|---|---|
| **Alias** | `getTenantMembers` |
| **Canonical implementation** | `getMembers(tenantId: string): Promise<TenantMembership[]>` in `services/tenantService.ts` |
| **Alias definition** | `export const getTenantMembers = getMembers;` |
| **Alias location** | `services/tenantService.ts:974` |
| **Comment** | `// ponytail: aliases for callers using the older naming convention.` |
| **Underlying mechanism** | `getMembers` performs a direct `supabase.from('tenant_memberships').select('*').eq('tenant_id', tenantId)` query; it is **not** an RPC wrapper. |

#### Ten Required Questions

1. **Canonical implementation:** `getMembers(tenantId)` in `services/tenantService.ts`.
2. **Production callers of alias:** **0** — no production file imports or calls `getTenantMembers` directly.
3. **Test callers of alias:** **1** — `tests/tenant.test.ts` (import line 21; call lines 53, 79, 198).
4. **Duplicate wrapper?** No. It is a `const` alias.
5. **Same RPC?** Not applicable; canonical function uses direct table access.
6. **Different signature?** No.
7. **Backward compatibility requirement?** One test file uses the alias. No production use.
8. **Can remove?** Yes. Requires updating `tests/tenant.test.ts` and removing the re-export from `services/admin/memberAdminService.ts` (which currently re-exports `getTenantMembers` from `tenantService`).
9. **Need compatibility alias?** No.
10. **Architecture Recommendation:** Remove the alias; migrate the test caller and the `memberAdminService.ts` re-export to `getMembers`.

#### Options Analysis

**Option A — Remove alias, migrate callers to `getMembers`**
- **Action:** Delete `export const getTenantMembers = getMembers;`; update `tests/tenant.test.ts` to import `getMembers`; remove `getTenantMembers` from the re-export block in `services/admin/memberAdminService.ts`.
- **Pros:** Eliminates shadow contract; zero production churn.
- **Cons:** One test file and one admin re-export block change.
- **Risk:** Very low.
- **Verdict:** **Recommended.**

**Option B — Keep alias as documented compatibility layer**
- **Action:** Leave alias in place and document it.
- **Pros:** Zero churn today.
- **Cons:** Fails EC-5; expands naming surface without adding capability.
- **Risk:** Low functional, moderate architectural.
- **Verdict:** Rejected.

**Option C — Rename canonical to `getTenantMembers`, migrate `getMembers` callers**
- **Action:** Rename `getMembers` to `getTenantMembers`; migrate all callers.
- **Pros:** More explicit name.
- **Cons:** Unnecessary churn; `getMembers` is already clear in tenant-scoped context.
- **Risk:** Moderate to high depending on `getMembers` caller count.
- **Verdict:** Rejected.

---

### 3.3 Alias: `checkSubdomain`

#### Canonical Implementation

| Attribute | Value |
|---|---|
| **Alias** | `checkSubdomain` |
| **Canonical implementation** | `checkSubdomainAvailability(subdomain: string): Promise<SubdomainAvailabilityResult>` in `services/admin/tenantAdminService.ts` |
| **Alias definition** | `export { checkSubdomainAvailability as checkSubdomain } from './tenantAdminService';` |
| **Alias location** | `services/admin/systemAdminService.ts:30` |
| **Comment** | Module header: `// ponytail: thin admin wrapper around system-level operations.` |
| **Underlying mechanism** | `checkSubdomainAvailability` invokes the `check-subdomain` Edge Function via `supabase.functions.invoke(...)`; it is **not** an RPC wrapper. |

#### Ten Required Questions

1. **Canonical implementation:** `checkSubdomainAvailability(subdomain)` in `services/admin/tenantAdminService.ts`.
2. **Production callers of alias:** **0** — no production file imports `checkSubdomain`.
3. **Test callers of alias:** **1** — `tests/smoke/admin-dashboard-p6-operations-support.test.ts` (import line 21; call lines 89, 98).
4. **Duplicate wrapper?** No. It is a re-export alias.
5. **Same RPC?** Not applicable; canonical function calls an Edge Function, not a database RPC.
6. **Different signature?** No.
7. **Backward compatibility requirement?** One smoke test uses the alias.
8. **Can remove?** Yes. Requires updating the smoke test to import `checkSubdomainAvailability` from `services/admin/tenantAdminService`.
9. **Need compatibility alias?** No.
10. **Architecture Recommendation:** Remove the alias; migrate the smoke test to `checkSubdomainAvailability`.

#### Options Analysis

**Option A — Remove alias, migrate smoke test to `checkSubdomainAvailability`**
- **Action:** Remove the `checkSubdomainAvailability as checkSubdomain` re-export from `services/admin/systemAdminService.ts`; update `tests/smoke/admin-dashboard-p6-operations-support.test.ts` to import `checkSubdomainAvailability` from `services/admin/tenantAdminService`.
- **Pros:** Removes a facade-level alias; clarifies that subdomain checking lives in `tenantAdminService`, not `systemAdminService`; zero production churn.
- **Cons:** One test import changes.
- **Risk:** Very low.
- **Verdict:** **Recommended.**

**Option B — Keep alias inside the facade barrel**
- **Action:** Leave `checkSubdomain` as a re-export in `systemAdminService.ts`.
- **Pros:** Convenience for admin-dashboard tests importing from the system facade.
- **Cons:** Obscures the true source module; perpetuates alias pattern; conflicts with EC-5.
- **Risk:** Low functional, moderate architectural.
- **Verdict:** Rejected.

**Option C — Move canonical function to `systemAdminService.ts`**
- **Action:** Move `checkSubdomainAvailability` implementation into `systemAdminService.ts` and remove it from `tenantAdminService.ts`.
- **Pros:** Aligns alias location with actual ownership.
- **Cons:** Reorganizes code without functional reason; breaks the tenant-admin module boundary; may affect other callers of `checkSubdomainAvailability`.
- **Risk:** Moderate.
- **Verdict:** Rejected — out of scope for an alias decision and not justified.

---

### 3.4 Alias: `restoreTenantStatus`

#### Canonical Implementation

| Attribute | Value |
|---|---|
| **Alias** | `restoreTenantStatus` |
| **Canonical implementation** | `restoreTenant(tenantId: string): Promise<Tenant>` in `services/tenantService.ts` |
| **Alias definition** | `export const restoreTenantStatus = restoreTenant;` |
| **Alias location** | `services/admin/tenantAdminService.ts:249` |
| **Comment** | `// ponytail: alias so callers using the older naming convention still work.` |
| **Underlying mechanism** | `restoreTenant` calls `supabase.rpc('update_tenant', { p_tenant_id: tenantId, p_status: 'active', ... })`; it is an RPC wrapper around `public.update_tenant`. |

#### Ten Required Questions

1. **Canonical implementation:** `restoreTenant(tenantId)` in `services/tenantService.ts`.
2. **Production callers of alias:** **1** — `pages/admin/Tenants.tsx` imports `restoreTenantStatus` from `services/admin/tenantAdminService` and calls it at line 301 inside the restore confirmation handler.
3. **Test callers of alias:** **1** — `tests/admin-dashboard/Tenants.test.tsx` mocks `restoreTenantStatus` at line 33.
4. **Duplicate wrapper?** No. It is a `const` alias.
5. **Same RPC?** The canonical `restoreTenant` calls `update_tenant`; the alias does not add another RPC.
6. **Different signature?** No.
7. **Backward compatibility requirement?** One production page and one test mock use the alias. This is the only alias with a production caller.
8. **Can remove?** Yes, but it requires changing a production page import/call and a test mock.
9. **Need compatibility alias?** No. `restoreTenant` is a clear canonical name.
10. **Architecture Recommendation:** Remove the alias; migrate `pages/admin/Tenants.tsx` and the `Tenants.test.tsx` mock to `restoreTenant`.

#### Options Analysis

**Option A — Remove alias, migrate production page and test to `restoreTenant`**
- **Action:** Delete `export const restoreTenantStatus = restoreTenant;` from `services/admin/tenantAdminService.ts`; update `pages/admin/Tenants.tsx` to import and call `restoreTenant`; update `tests/admin-dashboard/Tenants.test.tsx` to mock `restoreTenant`.
- **Pros:** Eliminates the only production-facing alias; aligns with canonical name; same signature means one-line changes.
- **Cons:** Touches one production UI file (restore store action) and one test mock.
- **Risk:** Low. The call site uses the same single `tenant.id` argument; behavior is identical.
- **Verdict:** **Recommended.**

**Option B — Keep alias because a production page uses it**
- **Action:** Leave `restoreTenantStatus` in `tenantAdminService.ts`.
- **Pros:** Avoids changing the production page.
- **Cons:** Fails EC-5; keeps a shadow contract in the admin boundary; inconsistent with handling of the other three aliases.
- **Risk:** Low functional, but sets a precedent that aliases stay if they have any caller.
- **Verdict:** Rejected — the production change is trivial and safe.

**Option C — Rename canonical to `restoreTenantStatus`, migrate `restoreTenant` callers**
- **Action:** Rename `restoreTenant` to `restoreTenantStatus`; migrate all callers.
- **Pros:** `restoreTenantStatus` is arguably more explicit about the action.
- **Cons:** Churn across production and tests; `restoreTenant` is already canonical and used in `tests/tenant.test.ts`.
- **Risk:** Moderate.
- **Verdict:** Rejected — unjustified churn.

---

## 4. Cross-Alias Consolidation

### 4.1 Caller Summary

| Alias | Production Callers | Test Callers | Re-Exported By |
|---|---|---|---|
| `getTenantById` | 0 | 2 | `services/admin/tenantAdminService.ts` |
| `getTenantMembers` | 0 | 1 | `services/admin/memberAdminService.ts` |
| `checkSubdomain` | 0 | 1 | — |
| `restoreTenantStatus` | 1 | 1 | — |

### 4.2 Group-Level Options

Because the four aliases are independent naming aliases (no shared state or RPC), they can in principle be handled separately. However, consistency is valuable for the canonical boundary.

**Group Option A — Remove all four aliases and migrate callers (Recommended)**
- **Action:** Remove every alias; update affected production page, test files, and admin re-exports to use canonical names.
- **Pros:** Fully satisfies Phase 3 EC-5; consistent with G5 closure; minimal total churn (one production page + four test files + two re-export blocks).
- **Cons:** Multiple files change, all derived/test/re-export layers.
- **Risk:** Low. All aliases are signature-identical.
- **Verdict:** **Recommended.**

**Group Option B — Keep all four aliases, document them in a canonical boundary registry**
- **Action:** Leave aliases in place; add a registry file listing canonical vs. alias names.
- **Pros:** Zero churn today.
- **Cons:** Phase 3 remains partially open; EC-5 not satisfied; contract surface stays expanded.
- **Risk:** Low functional, high architectural — contradicts Phase 3 objective.
- **Verdict:** Rejected.

**Group Option C — Mixed treatment**
- **Action:** Remove the three test-only aliases (`getTenantById`, `getTenantMembers`, `checkSubdomain`) but keep `restoreTenantStatus` because it has a production caller.
- **Pros:** Reduces surface for zero-risk aliases while avoiding any production-page change.
- **Cons:** Inconsistent boundary policy; the production change for `restoreTenantStatus` is trivial and safe.
- **Risk:** Low functional, but creates a confusing precedent.
- **Verdict:** Rejected — inconsistency undermines the canonical boundary.

---

## 5. Implementation Impact (No Implementation Performed)

If the recommended Group Option A is approved, the following files would be touched in a subsequent authorized `CURRENT_TASK`:

| File | Change | Reason |
|---|---|---|
| `services/tenantService.ts` | Remove `getTenantById` and `getTenantMembers` aliases. | Canonical names `getTenant` and `getMembers` already exist. |
| `services/admin/systemAdminService.ts` | Remove `checkSubdomainAvailability as checkSubdomain` re-export. | Canonical function lives in `tenantAdminService.ts`. |
| `services/admin/tenantAdminService.ts` | Remove `restoreTenantStatus` alias. | Canonical `restoreTenant` exists in `tenantService.ts`. |
| `services/admin/memberAdminService.ts` | Remove `getTenantMembers` from re-export block. | Use `getMembers` instead. |
| `pages/admin/Tenants.tsx` | Import and call `restoreTenant` instead of `restoreTenantStatus`. | Only production caller of any alias. |
| `tests/tenant.test.ts` | Import and call `getTenant` and `getMembers` instead of aliases. | Test caller migration. |
| `tests/smoke/admin-dashboard-p7-3-payment-confirm-lifecycle.test.ts` | Import and call `getTenant` instead of `getTenantById`. | Test caller migration. |
| `tests/smoke/admin-dashboard-p6-operations-support.test.ts` | Import `checkSubdomainAvailability` from `tenantAdminService` instead of `checkSubdomain` from `systemAdminService`. | Test caller migration. |
| `tests/admin-dashboard/Tenants.test.tsx` | Mock `restoreTenant` instead of `restoreTenantStatus`. | Test mock migration. |

No migration, schema change, generated-type change, or canonical RPC change is required. The underlying functions, RPCs, Edge Function invocations, and business logic remain untouched.

---

## 6. Final Architecture Decision

**Recommended Group Option:** **A** — Remove all four aliases and migrate their callers to the canonical underlying functions.

| Alias | Canonical Name | Disposition | Rationale |
|---|---|---|---|
| `getTenantById` | `getTenant` | **Remove alias** | No production caller; tests migrate to canonical name. |
| `getTenantMembers` | `getMembers` | **Remove alias** | No production caller; one test and one re-export migrate. |
| `checkSubdomain` | `checkSubdomainAvailability` | **Remove alias** | No production caller; smoke test imports canonical function directly. |
| `restoreTenantStatus` | `restoreTenant` | **Remove alias** | One production page call; trivial one-line migration to canonical name. |

This decision closes G6, satisfies Phase 3 Exit Criterion EC-5, and leaves the A4 facade-barrel question as the sole remaining Phase 3 surface issue.

**Architecture Decision:**

## REQUIRES PROGRAM MANAGER DECISION

The analysis and recommendation are complete. Implementation, code changes, test updates, and any further derived-layer realignment are explicitly out of scope for this document and must be authorized in a separate `CURRENT_TASK` after Program Manager / Architecture Authority approval.
