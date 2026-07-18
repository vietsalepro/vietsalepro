# CURRENT_TASK-024 — Implementation Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3i — Domain H9 — Reports & Dashboard Mock Coverage  
**Document Type:** Engineering Implementation Report  
**Date:** 2026-07-15  
**Status:** COMPLETE — Engineering PASS

---

## Objective

Add mock coverage in `tests/mocks/supabase.ts` for the 2 authorized Domain H9 — Reports & Dashboard RPCs, deriving each handler's return shape and parameter contract directly from the canonical migration chain. The task completes Milestone M5 — Commerce Complete and raises mock coverage from **~82.0% (150/183)** to approximately **~83.1% (152/183)**.

---

## Scope

### In Scope

- Add exactly 2 mock handlers to `tests/mocks/supabase.ts` for Domain H9 — Reports & Dashboard.
- Preserve the existing `if (name === "...")` dispatch pattern.
- Reuse existing in-memory store tables (`orders`, `order_items`, `products`, `customers`, `return_orders`, `return_order_items`); no new store state added.

### Out of Scope

- Production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migrations, schema, generated types.
- `scripts/audit-rpc-contracts.ts`, CI workflows, `package.json`.
- New governance artifacts, acceptance records, or `CURRENT_TASK-025`.

---

## Implemented RPCs

| # | RPC | Sub-group | Canonical Migration File | Canonical Line | RETURNS |
|---|-----|-----------|--------------------------|----------------:|---------|
| 1 | `get_dashboard_summary` | Dashboard Aggregates | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7090 | `json` |
| 2 | `get_profit_report` | Profit Report | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 8151 | `json` |

---

## Files Changed

| File | Change Type | Summary |
|------|-------------|---------|
| `tests/mocks/supabase.ts` | Additive | Added 2 Domain H9 RPC handlers (`get_dashboard_summary` at line 3787, `get_profit_report` at line 3882) using the existing `if (name === "...")` dispatch chain. No other tracked files were modified by this task. |

---

## Validation Results

### Coverage Before

- Covered RPCs: 150
- Uncovered RPCs: 33
- Coverage: ~82.0%

### Coverage After

- Covered RPCs: 152
- Uncovered RPCs: 31
- Coverage: ~83.1%

> The HEAD version of `scripts/audit-rpc-contracts.ts` does not emit a coverage percentage. The value **152/183 (~83.1%)** is derived from adding the 2 new Domain H9 mock handlers to the previously accepted baseline of 150/183 (~82.0%).

### Audit Result

```text
npx tsx scripts/audit-rpc-contracts.ts
```

- Exit code: 0
- Output:
  ```
  Contract RPCs : 125
  Code RPCs     : 125

  RPC contracts and service code are in sync.
  ```
- No duplicate handlers were introduced.
- No stale mocks were introduced.

### Type Check Result

```text
npx tsc --noEmit
```

- Exit code: 0
- No TypeScript errors

### Test Result

```text
npx vitest run
```

- Exit code: 0
- Test files: 68 passed
- Tests: 389 passed
- No failures

### Regression Check

- Existing test count did not decrease.
- No existing tests failed.
- Audit gate remains green.
- Type gate remains green.

---

## Constraints Compliance

| Constraint | Compliance |
|------------|------------|
| Implement exactly 2 authorized RPCs, no more, no less | PASS — only `get_dashboard_summary` and `get_profit_report` were added. |
| Preserve `if (name === "...")` dispatch pattern | PASS — both handlers use the existing pattern. |
| Additive only; no refactor, redesign, or abstraction | PASS — existing handlers and file structure were not modified. |
| Derive return shapes from canonical migration chain | PASS — each handler matches the declared `RETURNS` clause and parameter list from the canonical source. |
| No production code changes | PASS — only `tests/mocks/supabase.ts` was changed. |
| No migrations, schema, generated types, audit script, CI, or package.json changes | PASS — `scripts/audit-rpc-contracts.ts` remains at HEAD; no changes applied. |
| No new governance artifacts or `CURRENT_TASK-025` | PASS. |

---

## Traceability to Canonical Migration

Both handlers derive parameter names and return shapes directly from the `CREATE [OR REPLACE] FUNCTION public.<name>` declarations in `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`:

- `get_dashboard_summary` — accepts optional `p_from` / `p_to` date parameters and returns `json` with keys `revenueData`, `topProducts`, `inventoryValue`, `inventoryRetailValue`, `debtCustomers`, `topCustomers`, `totalDebt`, `totalCustomers`, `totalProducts`, `activeProducts`, `todayRevenue`, `todayOrders`, `todaySoldProducts`, `todayCustomers`, and `yesterdayRevenue`. The mock computes these from the existing `orders`, `order_items`, `products`, and `customers` store tables.
- `get_profit_report` — accepts required `p_start_date` / `p_end_date` and optional `p_status`, `p_payment_method`, `p_product_keyword`, `p_customer_keyword`, `p_compare_mode` parameters; returns `json` with `summary`, `dailyProfit`, `profitDetails`, `groupedByProduct`, `groupedByCustomer`, and `groupedByDay`. The mock filters existing order data, applies return-order quantity adjustments, computes revenue/cost/profit values, and returns zero-filled comparison fields (per the approved kickoff: zero-filled comparison fields are sufficient for contract coverage).

---

## Summary

CURRENT_TASK-024 implemented the 2 authorized Domain H9 — Reports & Dashboard mock handlers in `tests/mocks/supabase.ts`. The implementation is additive, follows the existing dispatch pattern, derives return shapes from the canonical migration chain, and introduces no new store tables. TypeScript type check and the full Vitest suite pass with no regressions. The audit gate passes against the HEAD version of `scripts/audit-rpc-contracts.ts`. The ~83.1% mock coverage target is achieved by the 2 new H9 handlers (152/183 RPCs covered).

---

## Status

**CURRENT_TASK-024 Implementation: COMPLETE**

**Engineering: PASS**

Ready for Independent Program Manager Acceptance Review.

---

## Next Step

Independent Program Manager Acceptance Review for CURRENT_TASK-024.
