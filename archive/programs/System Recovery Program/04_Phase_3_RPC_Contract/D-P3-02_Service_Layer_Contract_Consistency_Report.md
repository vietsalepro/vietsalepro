# D-P3-02 — Service-Layer Contract Consistency Report

**Program:** VietSalePro v7 — System Recovery Program  
**Deliverable ID:** D-P3-02  
**Title:** Service-Layer Contract Consistency Report  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Proposed — Pending Architecture Authority / Program Manager Review  
**Basis:** `D-P3-01_Reconciled_RPC_Contract.md`, `SCAR_PHASE2_REPORT.md`, `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`

---

## 1. Executive Summary

This report assesses the **consistency of the service-layer contract surface** against the Canonical RPC Contract established in D-P3-01. The objective is to determine whether the service layer presents a clear, unambiguous, and consistent boundary to consumers (UI, tests, and future callers), or whether wrappers, aliases, duplicates, signature drift, and ambiguous naming expand the contract surface in ways that violate canonical boundary compliance.

| Metric | Value |
|---|---|
| Service modules scanned | 46 |
| Exported service functions | 267 |
| RPC call-sites (`services/` + `utils/`) | 189 |
| Unique RPCs invoked | 182 |
| RPCs matched to canonical migration function | 178 |
| RPCs missing from canonical migrations | 4 |
| RPC coverage (matched / invoked) | 97.8% |
| Inconsistency findings | 9 |
| Explicit aliases | 4 |
| Wrapper duplications | 1 |
| Signature drifts | 1 confirmed |
| Naming drifts | 3 code-only RPC names |
| Contract ambiguities | 3 |

**Decision: PASS WITH OBSERVATIONS.**

The service-layer contract is largely consistent with the canonical RPC contract. The surface follows a uniform wrapper pattern: each service function performs a single `supabase.rpc(...)` call and maps/normalizes the result. However, four missing RPCs and one subscription-domain signature drift produce concrete runtime failures. Three additional ambiguity issues (duplicate wrappers, aliases, and overloaded canonical definitions) expand the contract surface without adding capability. The inconsistencies are localized, traceable, and do not indicate systemic loss of contract discipline.

---

## 2. Scope

### 2.1 In Scope

- All exported service functions in `services/*.ts`, `services/admin/*.ts`, and `utils/service.ts`.
- Every service-layer wrapper that forwards to `supabase.rpc(...)`.
- Explicit aliases (`const X = Y`) and facade re-export barrels.
- Duplicate wrappers that invoke the same RPC with the same parameters.
- Naming consistency between service function, RPC name, and canonical function name.
- Signature consistency: parameter names, order, and required vs. optional forwarding.
- Return-type consistency: service return type vs. canonical return type.
- Parameter forwarding consistency: whether the service forwards exactly the canonical parameter set.
- Contract ambiguity: same operation exposed through multiple names or signatures.
- Canonical boundary compliance: whether the service surface stays within the canonical RPC contract.

### 2.2 Out of Scope

- Implementation of fixes, migrations, or service changes.
- Direct `.from(...)` table access (234 sites) — not part of the RPC contract surface.
- Edge-function invocations.
- UI component contracts.
- Dead-code analysis requiring caller graphs or runtime usage data.

---

## 3. Assessment Method

1. **Canonical source:** `supabase/schema.sql` (D-P2-03), generated from the 137 forward migrations per D-P2-01.
2. **RPC contract baseline:** `D-P3-01_Reconciled_RPC_Contract.md`, which maps 182 unique invoked RPCs to 178 canonical functions.
3. **Service-layer source:** `services/**/*.ts` and `utils/service.ts`.
4. **Wrapper extraction:** Enumerated all exported service functions and classified each by pattern: direct RPC wrapper, alias, facade re-export, pure mapper (no RPC), or direct table access.
5. **Alias extraction:** Grepped for `export const X = Y` and `export { Y as X }` patterns.
6. **Duplicate detection:** Compared service functions by RPC name and forwarded parameter object.
7. **Signature/parameter comparison:** Compared service call arguments to the canonical `CREATE FUNCTION` signature from `D-P3-01`.
8. **Return-type comparison:** Inspected service TypeScript return types against canonical return types; noted where the service wraps/maps the result.
9. **Evidence files:** `.temp/rpc_call_sites.csv`, `.temp/rpc_mapping_matrix_final.csv`, `D-P3-01_Reconciled_RPC_Contract.md`, `SCAR_PHASE2_REPORT.md`.

---

## 4. Service Inventory

| Category | Count | Evidence |
|---|---|---|
| Top-level service files (`services/*.ts`) | 33 | `find_file_by_name services/*.ts` |
| Admin service files (`services/admin/*.ts`) | 12 | `find_file_by_name services/admin/*.ts` |
| Shared service module (`utils/service.ts`) | 1 | `utils/service.ts` |
| **Total service modules** | **46** | — |
| Exported service functions | **267** | `grep "export ... function" / `export const` across `services/` |
| RPC call-sites (`supabase.rpc(...)`) | **189** | `grep "\.rpc("` across `services/` + `utils/` |
| Unique RPC names invoked | **182** | de-duplicated call-sites |
| Direct table access sites (`.from(...)`) | **234** | noted, not reconciled as RPC contract |

The dominant architectural pattern is a **thin RPC wrapper**: each service function owns one `supabase.rpc(...)` call, then maps the database result to a domain type before returning. This pattern is consistent across all service modules.

---

## 5. Wrapper Inventory

| Wrapper Pattern | Count | Description | Example |
|---|---|---|---|
| Direct RPC wrapper | ~180 | One service function → one RPC call → result mapper | `services/planService.ts:getPlans()` → `get_plans()` |
| Pure mapper (no RPC) | 2 | Exported helper that only maps DB rows | `mapTenantFromDB`, `mapSubscriptionFromDB` in `services/tenantService.ts` |
| Explicit alias | 4 | `const X = Y` or `export { Y as X }` | `getTenantById = getTenant`, `getTenantMembers = getMembers`, `checkSubdomain = checkSubdomainAvailability`, `restoreTenantStatus = restoreTenant` |
| Facade barrel | 1 | Module re-exports symbols from many underlying services | `services/admin/systemAdminService.ts` |
| Duplicate wrapper | 1 | Two service functions invoke the same RPC identically | `getUsageSummary` and `getTenantUsageSummary` both call `get_tenant_usage_summary` |
| Direct table access wrapper | several | Service function calls `.from(...)` instead of RPC | `getTenantSubscription`, `getTenantBySubdomain`, `getMembers` |

### 5.1 Wrapper Naming Convention

The service boundary convention is otherwise consistent:

- **Service function:** camelCase (`updateTenantSubscription`)
- **RPC name:** snake_case (`update_tenant_subscription`)
- **Canonical function:** snake_case, `p_`-prefixed parameters (`p_tenant_id`, `p_plan`)

This convention is followed by the vast majority of wrappers.

---

## 6. Contract Consistency Matrix

The matrix below records each finding with the required evidence fields. RPCs classified as `Consistent` are omitted from the detailed matrix; summary counts are provided.

### 6.1 Summary Counts

| Classification | Count |
|---|---|
| Consistent | 174 |
| Alias | 4 |
| Wrapper Duplication | 1 |
| Signature Drift | 1 |
| Naming Drift | 3 |
| Return-Type Drift | 0 confirmed |
| Parameter Drift | 1 (bundled with Signature Drift) |
| Contract Ambiguity | 3 |
| Unknown | 0 |

### 6.2 Detailed Findings Matrix

| Service | RPC | Wrapper | Signature | Return Type | Consistency Status | Evidence | Impact | Recommendation Classification | Confidence |
|---|---|---|---|---|---|---|---|---|---|
| `tenantService.ts:updateSubscriptionLimits` | `admin_update_subscription` | `updateSubscriptionLimits(tenantId, input)` | Service passes `p_max_storage_gb`; canonical `update_tenant_subscription` has no storage parameter | `TenantSubscription` (mapped from RPC result) | **Signature Drift / Naming Drift / Contract Ambiguity** | RPC not defined in canonical schema; service assumes 8 params vs. canonical 7 params. `D-P3-01` §6, `SCAR_PHASE2_REPORT` Part 6. | Guaranteed runtime failure; second divergent contract for same operation. | **Signature Drift** (primary), Naming Drift, Contract Ambiguity | High |
| `tenantService.ts:getMemberWithEmail` | `get_member_with_email` | `getMemberWithEmail(tenantId, userId)` | `p_tenant_id UUID, p_user_id UUID` (assumed by service) | `MemberWithEmail \| null` (mapped) | **Naming Drift / Contract Ambiguity** | RPC not defined in canonical schema. Canonical equivalent `get_tenant_members_with_email` exists at `tenantService.ts:991`. | Runtime failure; code-only name shadows canonical name. | **Naming Drift** | High |
| `tenantService.ts:searchMembers` | `search_members_by_email` | `searchMembers(params)` | `p_tenant_id, p_query, p_page, p_limit, p_role_filter, p_status_filter` | `SearchMembersResult` (mapped) | **Naming Drift / Contract Ambiguity** | RPC not defined. Canonical equivalent `search_tenant_members` used at `tenantService.ts:627`. | Runtime failure; code-only name shadows canonical name. | **Naming Drift** | High |
| `tenantService.ts:getStorageUsage` / `tenantService.ts:getTenantStorageUsage` | `get_storage_usage` | `getStorageUsage(tenantId)` / `getTenantStorageUsage()` | `p_tenant_id UUID` vs. `p_tenant_id null` | `StorageUsage` (mapped) | **Contract Ambiguity / Missing RPC** | RPC not defined in canonical schema. Two service functions call the same missing RPC with different tenant semantics. `D-P3-01` §6. | Guaranteed runtime failure; ambiguous tenant vs. system-wide semantics. | **Contract Ambiguity** (primary), Missing RPC | High |
| `tenantService.ts:getUsageSummary` / `tenantService.ts:getTenantUsageSummary` | `get_tenant_usage_summary` | Both: `get_tenant_usage_summary({ p_tenant_id: tenantId })` | Identical | `UsageSummary` (mapped) | **Wrapper Duplication** | Two distinct exported service functions perform byte-identical RPC calls and mapping. Lines 469 and 497. `SCAR_PHASE2_REPORT` M1. | Expands contract surface without adding capability; maintenance burden. | **Wrapper Duplication** | High |
| `tenantService.ts:getTenantById` | — | `const getTenantById = getTenant` | Alias of `getTenant(id)` | Same as `getTenant` | **Alias** | `tenantService.ts:924` with `// ponytail:` comment. | Expands naming surface; documented, low risk. | **Alias** | High |
| `tenantService.ts:getTenantMembers` | — | `const getTenantMembers = getMembers` | Alias of `getMembers(tenantId)` | Same as `getMembers` | **Alias** | `tenantService.ts:976` with `// ponytail:` comment. | Expands naming surface; documented, low risk. | **Alias** | High |
| `admin/systemAdminService.ts:checkSubdomain` | `check_subdomain_availability` (via re-export) | `export { checkSubdomainAvailability as checkSubdomain }` | Alias of `checkSubdomainAvailability(subdomain)` | Same as wrapped function | **Alias** | `services/admin/systemAdminService.ts:30`. | Expands naming surface; part of facade barrel. | **Alias** | High |
| `admin/tenantAdminService.ts:restoreTenantStatus` | `update_tenant` (via `restoreTenant`) | `export const restoreTenantStatus = restoreTenant` | Alias of `restoreTenant(id)` | Same as `restoreTenant` | **Alias** | `services/admin/tenantAdminService.ts:250`. | Expands naming surface; low risk. | **Alias** | High |
| `tenantService.ts:updateTenantSubscription` | `update_tenant_subscription` | `updateTenantSubscription(tenantId, input)` | Canonical 7 params, service forwards 7 params | `TenantSubscription` (mapped) | **Consistent** (but canonical function is redefined 3×) | `D-P3-01` §6; canonical function exists. | Functional; however, canonical redefinition chain is fragile. | Consistent (with observation) | High |
| `tenantService.ts:updateTenant` / `tenantService.ts:restoreTenant` | `update_tenant` | Both call `update_tenant` with overlapping param sets | Canonical redefined 6×; service uses latest overload | `Tenant` (mapped) | **Consistent / Drift-prone** | `D-P3-01`, `SCAR_PHASE2_REPORT` H2. | Functional against latest migration, but overloaded canonical definition is fragile. | Consistent (with observation) | High |
| `supabaseService.ts:processCheckout` | `process_checkout` | `processCheckout(...)` | Canonical redefined 3× | mapped result | **Consistent / Drift-prone** | `D-P3-01`, `SCAR_PHASE2_REPORT` H2. | Functional against latest migration; overloaded canonical definition is fragile. | Consistent (with observation) | High |
| `services/admin/systemAdminService.ts` | — | Facade barrel re-exporting 30+ symbols from 8 modules | N/A | N/A | **Contract Ambiguity / Alias (facade)** | `services/admin/systemAdminService.ts:1–62`; `// ponytail:` header. | Obscures true source of each call; expands surface. | **Alias** (facade-level) | High |

---

## 7. Alias Analysis

| Alias | Canonical / Source Function | Type | Evidence | Risk |
|---|---|---|---|---|
| `getTenantById` | `getTenant` | `const` alias | `services/tenantService.ts:924` with `// ponytail:` comment | Low — documented, same signature |
| `getTenantMembers` | `getMembers` | `const` alias | `services/tenantService.ts:976` with `// ponytail:` comment | Low — documented, same signature |
| `checkSubdomain` | `checkSubdomainAvailability` | Re-export alias | `services/admin/systemAdminService.ts:30` | Low — documented, part of admin facade |
| `restoreTenantStatus` | `restoreTenant` | `const` alias | `services/admin/tenantAdminService.ts:250` | Low — documented, same signature |

All four aliases are **intentional and self-documented** (`// ponytail:` comments in three cases). They do not alter signatures or return types. They expand the exported naming surface but do not introduce ambiguity at the RPC boundary because each alias resolves to exactly one underlying service function.

**Verdict:** Aliases are acceptable within current governance, but the program should record them in a canonical boundary registry to prevent unchecked growth.

---

## 8. Wrapper Duplication Analysis

| Duplicate Wrappers | RPC | Canonical Function | Evidence | Impact |
|---|---|---|---|---|
| `getUsageSummary` (l.469) and `getTenantUsageSummary` (l.497) | `get_tenant_usage_summary` | `public.get_tenant_usage_summary` | `services/tenantService.ts:469–503`; `SCAR_PHASE2_REPORT` M1. | Two exported functions with different names produce identical behavior, expanding the service API surface. |

Both wrappers forward `{ p_tenant_id: tenantId }`, use `normalizeRpcObject(data, mapUsageSummaryFromDB)`, and return `Promise<UsageSummary>`. They are byte-identical except for function name.

**Verdict:** Wrapper duplication. Recommendation: deprecate one name or merge into a single canonical wrapper.

---

## 9. Signature Consistency

### 9.1 Confirmed Signature Drift — Subscription Domain

Canonical `public.update_tenant_subscription` per `D-P3-01`:

```
update_tenant_subscription(
  p_tenant_id UUID,
  p_plan TEXT,
  p_max_users INTEGER,
  p_max_products INTEGER,
  p_max_orders_per_month INTEGER,
  p_billing_status TEXT,
  p_expires_at TIMESTAMPTZ
)
```

Service call in `updateTenantSubscription` (`tenantService.ts:509`) matches exactly (7 parameters).

Service call in `updateSubscriptionLimits` (`tenantService.ts:481`) invokes the **non-existent** RPC `admin_update_subscription` with 8 parameters, adding `p_max_storage_gb`:

```ts
supabase.rpc('admin_update_subscription', {
  p_tenant_id: tenantId,
  p_plan: input.plan,
  p_max_users: input.maxUsers,
  p_max_products: input.maxProducts,
  p_max_orders_per_month: input.maxOrdersPerMonth,
  p_max_storage_gb: input.maxStorageGb,   // ← not in canonical function
  p_billing_status: input.billingStatus,
  p_expires_at: input.expiresAt,
});
```

**Classification:** Signature Drift + Parameter Drift.

### 9.2 Drift-Prone Canonical Functions

The following canonical functions are redefined multiple times in the migration chain. The service signatures are consistent with the **latest** migration only:

| Canonical Function | Redefinition Count | Evidence | Risk |
|---|---|---|---|
| `update_tenant` | 6 | `SCAR_PHASE2_REPORT` H2, `D-P3-01` | Any rollback or partial migration application breaks the service contract. |
| `update_tenant_subscription` | 3 | `SCAR_PHASE2_REPORT` H2, `D-P3-01` | Same as above. |
| `process_checkout` | 3 | `SCAR_PHASE2_REPORT` H2, `D-P3-01` | Same as above. |

These are not active service-layer drifts, but they are **canonical boundary fragility** points.

### 9.3 Other Wrappers

All remaining 174 matched wrappers forward parameter names, counts, and optional defaults that align with their canonical functions. No additional signature drift was detected.

---

## 10. Return-Type Consistency

| Service Return Pattern | Canonical Return Type | Consistency | Evidence |
|---|---|---|---|
| Mapped single object (`normalizeRpcObject`) | Typically `JSONB` or composite `TABLE` | Consistent — service maps DB row to domain type | Pervasive, e.g. `tenantService.ts`, `planService.ts` |
| Mapped array (`normalizeRpcArray`) | Typically `TABLE` / `SETOF` | Consistent — service maps each row to domain type | e.g. `services/admin/memberAdminService.ts` |
| Direct boolean / scalar passthrough | `boolean`, `integer`, `void` | Consistent | e.g. `check_product_barcode_exists` |
| Paginated object with metadata | `JSON` containing `{ data, total }` | Consistent — service extracts `items`/`total` fields | e.g. `getTenantsAdmin`, `searchTenants` |

No confirmed Return-Type Drift was found. The service layer consistently wraps canonical results with domain mappers (`mapTenantFromDB`, `mapSubscriptionFromDB`, etc.) and does not misrepresent the underlying RPC return type.

| Finding | Status |
|---|---|
| Return-Type Drift | **None confirmed** |

---

## 11. Parameter Consistency

### 11.1 Parameter Forwarding Pattern

The service layer follows a consistent forwarding convention:

- Required parameters are passed directly.
- Optional parameters use `?? null` or `?? default` to satisfy the RPC's default expectations.
- Parameter names are prefixed with `p_` and match the canonical function parameter names.

Example from `services/planService.ts:45`:

```ts
const { data, error } = await supabase.rpc('update_plan', {
  p_key: key,
  p_name: input.name,
  p_description: input.description ?? null,
  ...
});
```

### 11.2 Parameter Inconsistencies

| Service Function | RPC | Inconsistency | Evidence |
|---|---|---|---|
| `updateSubscriptionLimits` | `admin_update_subscription` | Passes `p_max_storage_gb` that canonical `update_tenant_subscription` does not accept. | `tenantService.ts:481–490` |

This is the only confirmed parameter drift. It is bundled with the subscription signature drift documented in §9.

---

## 12. Contract Ambiguity Register

| ID | Ambiguity | Source | Evidence | Impact |
|---|---|---|---|---|
| A1 | Two service functions for one subscription update operation | `updateTenantSubscription` vs. `updateSubscriptionLimits` | `tenantService.ts:477` and `:509` | Two names/signatures for the same business operation; one is broken. |
| A2 | Two member-search functions with overlapping intent | `searchMembers` (missing RPC) vs. `searchTenantMembers` (canonical) | `tenantService.ts:609` and `:626` | Caller cannot determine which is canonical without reading code. |
| A3 | Two storage-usage functions with different tenant semantics | `getStorageUsage(tenantId)` vs. `getTenantStorageUsage()` both call `get_storage_usage` | `tenantService.ts:1008` and `:1016` | Missing RPC makes the intended system-wide vs. tenant-wide semantics unresolvable. |
| A4 | Facade barrel obscures true service ownership | `services/admin/systemAdminService.ts` re-exports 30+ symbols from 8 modules | `services/admin/systemAdminService.ts:1–62` | Consumers import from facade, not from canonical service module. |

**Verdict:** Ambiguities A1–A3 are localized to `tenantService.ts` and directly relate to the missing RPC cluster. A4 is an architectural convenience pattern that should be documented in the canonical boundary registry.

---

## 13. Findings

### F1 — P0: Four Missing RPCs Cause Guaranteed Runtime Failures

| Service Function | File:Line | RPC | Canonical Equivalent | Classification |
|---|---|---|---|---|
| `updateSubscriptionLimits` | `tenantService.ts:481` | `admin_update_subscription` | `update_tenant_subscription` (with drift) | Signature Drift + Naming Drift + Contract Ambiguity |
| `getMemberWithEmail` | `tenantService.ts:591` | `get_member_with_email` | `get_tenant_members_with_email` | Naming Drift |
| `searchMembers` | `tenantService.ts:610` | `search_members_by_email` | `search_tenant_members` | Naming Drift |
| `getStorageUsage` | `tenantService.ts:1009` | `get_storage_usage` | none | Contract Ambiguity |
| `getTenantStorageUsage` | `tenantService.ts:1017` | `get_storage_usage` | none | Contract Ambiguity |

**Evidence:** No `CREATE FUNCTION` declaration for any of these four RPCs exists in `supabase/schema.sql` (canonical migration chain) or in the 17 orphan SQL files reviewed in D-P3-01. `SCAR_PHASE2_REPORT` C1 re-confirms this.

### F2 — H1: Subscription Signature Drift

`updateSubscriptionLimits` assumes a storage-limit parameter (`p_max_storage_gb`) that the canonical `update_tenant_subscription` does not accept. Even if `admin_update_subscription` were created, it would represent a second, divergent contract for the same operation.

### F3 — M1: Duplicate Wrapper

`getUsageSummary` and `getTenantUsageSummary` are identical wrappers for `get_tenant_usage_summary`.

### F4 — M2: Code-Only Member RPC Names

`get_member_with_email` and `search_members_by_email` are code-only names that shadow canonical equivalents.

### F5 — L1: Explicit Aliases

Four aliases (`getTenantById`, `getTenantMembers`, `checkSubdomain`, `restoreTenantStatus`) are documented and low-risk, but expand the exported contract surface.

### F6 — L2: Facade Barrel

`services/admin/systemAdminService.ts` re-exports 30+ symbols from 8 underlying service modules. It is convenient but obscures the true source module of each call.

### F7 — Canonical Redefinition Fragility

`update_tenant`, `update_tenant_subscription`, and `process_checkout` are each redefined multiple times in the migration chain. The service signatures are valid only against the latest definition.

---

## 14. Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Runtime failures in tenant/subscription/member/storage flows due to 4 missing RPCs. | High (calls are present in production service code) | High (guaranteed failure on invocation) | Reconcile via authorized `CURRENT_TASK`: add canonical functions or redirect service calls to canonical equivalents. |
| R2 | Future callers choose the broken `updateSubscriptionLimits` or `searchMembers` names because they appear in the service API. | Medium | Medium | Mark broken names deprecated or remove them; document canonical names. |
| R3 | Canonical function redefinition chains silently break service contracts if migrations are applied out of order or rolled back. | Medium | High | Treat canonical redefinitions as a separate quality gate; avoid further `CREATE OR REPLACE` that changes parameter lists. |
| R4 | Facade barrel and aliases grow unchecked, expanding the service contract surface beyond the canonical RPC boundary. | Low | Low | Maintain a canonical boundary registry and require justification for new aliases. |

---

## 15. Decision

### PASS WITH OBSERVATIONS

**Rationale:**

- **97.8% of invoked RPCs** map cleanly to canonical migration functions with consistent signatures, parameter forwarding, and return-type mapping.
- The service-layer wrapper pattern is uniform and predictable: one exported function per RPC, one mapper per result.
- The four missing RPCs and the one subscription signature drift are **localized** to `services/tenantService.ts` and are the same items already identified in D-P3-01.
- Aliases and the admin facade barrel are **intentional and documented**, expanding the naming surface but not introducing ambiguity at the RPC boundary.
- No Return-Type Drift was confirmed.

The observations are material enough to prevent a clean PASS: the missing RPCs guarantee runtime failures, and the duplicate wrappers / ambiguous naming clusters require contract-surface cleanup before Phase 3 exit. However, the issues are bounded, traceable, and do not indicate a systemic loss of service-layer contract discipline.

**Recommended next step (governance only, not implementation):** Authorize a Phase 3 `CURRENT_TASK` to reconcile the four missing RPCs and the subscription signature drift against the canonical migration contract, then re-run the consistency assessment before Phase 3 acceptance.

---

**D-P3-02 Completed.**
