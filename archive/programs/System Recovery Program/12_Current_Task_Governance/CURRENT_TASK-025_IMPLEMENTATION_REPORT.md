# CURRENT_TASK-025 — Engineering Implementation Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Wave:** 4a  
**Domain:** D — Integrations & Partners  
**Date:** 2026-07-15  
**Status:** IMPLEMENTATION COMPLETE  

---

## 1. Objective

Add mock coverage in `tests/mocks/supabase.ts` for the **8** authorized Domain D — Integrations & Partners RPCs, deriving each handler's parameter contract, return shape, and access control directly from the canonical migration chain.

---

## 2. Scope

### 2.1 In Scope

- Extend the in-memory `store` with `partners` and `integrations` arrays.
- Add exactly **8** `if (name === "...")` RPC handlers in `tests/mocks/supabase.ts`.
- Derive behavior from `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`.

### 2.2 Out of Scope

- No production code, service, migration, schema, or generated-type changes.
- No new dependency, dispatcher, helper, or abstraction.
- No RPC beyond the 8 authorized below.

---

## 3. Authorized RPCs Implemented

| # | RPC | Canonical Source | Return Shape | Handler Summary |
|---|---|---|---|---|
| 1 | `create_integration` | baseline migration line 4315 | `json` | Requires system admin, non-empty name, valid optional `p_partner_id`, stores row, returns camelCase integration object. |
| 2 | `create_partner` | baseline migration line 4480 | `json` | Requires system admin, non-empty name, stores row, returns camelCase partner object. |
| 3 | `delete_integration` | baseline migration line 5555 | `void` | Requires system admin; removes by `p_integration_id` or returns `PGRST116` / `Not found`. |
| 4 | `delete_partner` | baseline migration line 5705 | `void` | Requires system admin; removes by `p_partner_id` or returns `PGRST116` / `Not found`. |
| 5 | `list_integrations` | baseline migration line 9940 | `json` | Requires system admin; returns integrations joined to partners for `partnerName`, ordered by `created_at DESC`. |
| 6 | `list_partners` | baseline migration line 9972 | `json` | Requires system admin; returns all partners ordered by `created_at DESC`. |
| 7 | `update_integration` | baseline migration line 12667 | `json` | Requires system admin; applies `COALESCE` semantics, updates `updated_at`, returns camelCase object or `PGRST116`. |
| 8 | `update_partner` | baseline migration line 12766 | `json` | Requires system admin; applies `COALESCE` semantics, updates `updated_at`, returns camelCase object or `PGRST116`. |

---

## 4. Files Changed

```text
tests/mocks/supabase.ts
```

Changes within that file only:

- Added `partners: []` and `integrations: []` to the in-memory `store` object.
- Added 8 minimal `if (name === "...")` handlers inside the existing `rpc` dispatcher, matching the surrounding handler conventions.

No other files were modified for this task.

---

## 5. Validation Results

### 5.1 Canonical Audit Gate

```text
npx tsx scripts/audit-rpc-contracts.ts
```

**Result:** Exit 0

```text
Contract RPCs : 125
Code RPCs     : 125

RPC contracts and service code are in sync.
```

Additionally, a grep count of the 8 authorized handler names in `tests/mocks/supabase.ts` returned exactly one occurrence each, confirming **0 duplicate handler** and **0 stale mock** for this task's scope.

### 5.2 Type Gate

```text
npx tsc --noEmit
```

**Result:** Exit 0 — no TypeScript errors.

### 5.3 Test Gate

```text
npx vitest run --reporter=json --outputFile=vitest-output.json
```

**Result:** Exit 0

```json
{
  "numTotalTestSuites": 180,
  "numPassedTestSuites": 180,
  "numFailedTestSuites": 0,
  "numTotalTests": 389,
  "numPassedTests": 389,
  "numFailedTests": 0
}
```

---

## 6. Coverage

| Metric | Before CURRENT_TASK-025 | After CURRENT_TASK-025 |
|---|---|---|
| Covered RPCs | 152 / 183 | 160 / 183 |
| Uncovered RPCs | 31 | 23 |
| Coverage | ~83.1% | ~87.4% |
| Delta | — | +8 RPCs |

---

## 7. Regression Check

- Test suite count unchanged: **180 suites**.
- Test count unchanged: **389 tests**.
- Failure count unchanged: **0**.
- Audit contract/code sync unchanged: **125 / 125**.
- Type check unchanged: **PASS**.

No regressions introduced.

---

## 8. Constraints Compliance

| Constraint | Compliance |
|---|---|
| Additive only | ✓ Only added store arrays and handlers. |
| No refactor / redesign | ✓ Existing `if (name === "...")` dispatch chain preserved. |
| No abstraction | ✓ No helper, dispatcher, switch, map, or factory added. |
| Preserve existing architecture | ✓ Handler conventions, error codes, and camelCase return shapes match neighbors. |
| CURRENT_TASK boundary | ✓ Exactly 8 RPCs in Domain D, Wave 4a. |
| No duplicate handler | ✓ One handler per authorized RPC. |
| No stale mock | ✓ No orphaned or unrelated handler changes. |
| No production code changes | ✓ Only `tests/mocks/supabase.ts` touched. |
| Use `crypto.randomUUID()` | ✓ Used existing `uuid()` helper = `crypto.randomUUID()`. |
| Use `new Date().toISOString()` | ✓ Used for `created_at` / `updated_at`. |
| Use `currentUserId` | ✓ Used for `created_by` on inserts. |

---

## 9. Traceability to Canonical Migration

| RPC | Canonical Migration Line | Key Canonical Behavior Mirrored in Mock |
|---|---|---|
| `create_integration` | 4315–4361 | `is_system_admin` guard; non-empty `p_name`; partner FK check; `NULLIF` for optional text params; default `active`; `auth.uid()` → `currentUserId`; camelCase `json_build_object` return. |
| `create_partner` | 4480–4521 | `is_system_admin` guard; non-empty `p_name`; `NULLIF` for optional text params; default `active`; `auth.uid()` → `currentUserId`; camelCase `json_build_object` return. |
| `delete_integration` | 5555–5569 | `is_system_admin` guard; delete by id; `NOT FOUND` → `PGRST116` / `Not found`. |
| `delete_partner` | 5705–5719 | `is_system_admin` guard; delete by id; `NOT FOUND` → `PGRST116` / `Not found`. |
| `list_integrations` | 9940–9969 | `is_system_admin` guard; `LEFT JOIN` to partners for `partnerName`; order by `created_at DESC`; camelCase column aliases. |
| `list_partners` | 9972–9999 | `is_system_admin` guard; order by `created_at DESC`; camelCase column aliases. |
| `update_integration` | 12667–12707 | `is_system_admin` guard; `COALESCE` semantics; `updated_at = now()`; `NOT FOUND` → `PGRST116` / `Not found`; camelCase return. |
| `update_partner` | 12766–12806 | `is_system_admin` guard; `COALESCE` semantics; `updated_at = now()`; `NOT FOUND` → `PGRST116` / `Not found`; camelCase return. |

---

## 10. Final Engineering Decision

**PASS**

All 8 authorized RPC handlers are implemented in `tests/mocks/supabase.ts`, the canonical audit gate passes, the TypeScript gate passes, and the full test suite passes with no regression. The implementation is bounded to the authorized file and the authorized 8 RPCs.

---

*Implementation complete. Awaiting Independent Acceptance Review before any further program steps.*
