# RECOVERY_WAVE_05_ENGINEERING_KICKOFF

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Wave:** Recovery Wave-05  
**Domain:** H9 — Reports & Dashboard  
**Document Type:** Engineering Kickoff  
**Date:** 2026-07-16  
**Authority:** Program Recovery Authorization Review  
**Status:** APPROVED to proceed to implementation

---

## Executive Summary

Recovery Wave-05 is the final implementation wave of Phase 4. It authorizes mock handlers for exactly **two remaining uncovered code RPCs** in **Domain H9 — Reports & Dashboard**:

1. `get_dashboard_summary`
2. `get_profit_report`

Both handlers will be added to `tests/mocks/supabase.ts` only. The implementation is **additive only**, preserves the existing flat `if (name === '...')` dispatch pattern, reuses existing in-memory stores and helper functions, and does **not** modify production code, migrations, schema, generated types, package files, CI workflows, or governance artifacts.

The accepted Wave-04 baseline is **184 unique code RPCs**, of which **182 are covered**, leaving the two H9 RPCs as the only remaining gap. The verification target after Wave-05 is **184 / 184 covered RPCs**. This target is not an achieved fact and will be determined only by `RECOVERY_WAVE_05_VERIFICATION_REPORT.md`.

This document does not implement any code.

---

## Engineering Baseline

All baseline values are taken from `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` and `RECOVERY_WAVE_04_ACCEPTANCE_REVIEW.md`. They are not recalculated here.

| Metric | Verified Value | Source |
|---|---|---|
| Unique code RPCs | **184** | Direct multi-line `.rpc(` scan of `services/`, `lib/`, `utils/` |
| Code RPCs (canonical audit script) | **183** | `npx tsx scripts/audit-rpc-contracts.ts` undercounts the multi-line `complete_disposal` call |
| Covered RPCs | **182** | Code RPCs with a matching mock handler |
| Missing RPCs | **2** | Both H9 RPCs |
| Current Coverage | **98.91%** | `182 / 184` |
| Canonical Audit Gate | **PASS** | Exit 0, 0 code RPCs missing from migrations |
| Type Gate | **PASS** | `npx tsc --noEmit` exits 0 |
| Test Gate | **PASS** | `npx vitest run` exits 0 with no regressions |

### Target values (verification targets, not achieved facts)

| Metric | Target after Wave-05 | Note |
|---|---|---|
| Covered RPCs | **184** | Direct measurement target only |
| Missing RPCs | **0** | Both H9 RPCs implemented |
| Target Coverage | **100%** | `184 / 184` |

These target numbers must be confirmed by `RECOVERY_WAVE_05_VERIFICATION_REPORT.md` before they can be reported as achieved.

---

## Kickoff Readiness Review

The following checks were completed before drafting this kickoff. All must pass for implementation to proceed.

| # | Check | Method | Result |
|---|---|---|---|---|
| 1 | Exactly **2** RPCs are authorized for Wave-05 | Count RPCs in `RECOVERY_WAVE_05_AUTHORIZATION.md` §6 and `RECOVERY_WAVE_05_ARCHITECTURE_DECISION.md` §Authorized RPC Inventory | **PASS** |
| 2 | Both authorized RPCs belong only to **Domain H9 — Reports & Dashboard** | `PHASE4_RECOVERY_MAPPING_VALIDATION.md` §3 Domain H9; `PHASE4_COVERAGE_ROADMAP.md` §2; `CURRENT_TASK-024_ARCHITECTURE_DECISION.md` §3 | **PASS** |
| 3 | No additional uncovered RPC exists beyond the two H9 RPCs | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` §3: Missing RPCs = 2 | **PASS** |
| 4 | No previously covered RPC has disappeared | Wave-04 regression comparison: matched RPCs increased from 170 to 182 by exactly the 12 authorized Wave-04 additions | **PASS** |
| 5 | No unresolved mapping issue remains after the approved Errata | `PHASE4_RECOVERY_MAPPING_VALIDATION.md` §9: H9 = MATCH, `MISMATCH unresolved: 0` | **PASS** |
| 6 | No Domain F dependency exists for either authorized RPC | Architecture Decision review: both handlers aggregate `orders`, `order_items`, `products`, `customers`, `return_orders`, `return_order_items`; no notification store or Domain F RPC is referenced | **PASS** |
| 7 | No scope expansion is present | `RECOVERY_WAVE_05_AUTHORIZATION.md` §9.2 and `RECOVERY_WAVE_05_ARCHITECTURE_DECISION.md` §Scope Boundary explicitly exclude all non-H9 RPCs, cleanup, refactoring, and production changes | **PASS** |
| 8 | No new stores are authorized | Store Strategy below uses only the six existing stores identified in `RECOVERY_WAVE_05_ARCHITECTURE_DECISION.md` §Store Strategy | **PASS** |
| 9 | No new helpers are authorized | Helper Strategy below reuses only top-level utilities already present in `tests/mocks/supabase.ts` | **PASS** |
| 10 | No existing handler exists for either authorized RPC | `tests/mocks/supabase.ts` contains zero matches for `get_dashboard_summary` or `get_profit_report` | **PASS** |

No inconsistency was discovered. Recovery Wave-05 may proceed to implementation.

---

## Authorized RPC Inventory

| # | Domain | RPC | Canonical Migration | Production Call Site | Service Function | Complexity |
|---|---|---|---|---|---|---|
| 1 | H9 — Reports & Dashboard | `get_dashboard_summary` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:7090` | `services/supabaseService.ts:777` | `getDashboardSummary(from?: string, to?: string)` | Medium |
| 2 | H9 — Reports & Dashboard | `get_profit_report` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:8151` | `services/supabaseService.ts:3827` | `getProfitReport(startDate: string, endDate: string, filters?: object)` | Medium |

**Total authorized RPCs: 2.**

No other RPC is authorized for Wave-05.

---

## Implementation Sequence

### Phase 1 — `get_dashboard_summary`

Implement the dashboard summary handler first. It is the simpler of the two: read-only, aggregates `orders`, `order_items`, `products`, and `customers`, and returns a flat JSON object with no nested filter logic.

### Phase 2 — `get_profit_report`

Implement the profit report handler second. It reuses the same stores as `get_dashboard_summary` plus `return_orders` and `return_order_items` for net-quantity adjustments. It adds date-range comparison, optional status/payment/keyword filters, and multi-level grouping.

### Insertion point

Both handler blocks will be inserted immediately after the `// ========== End Domain H8 ==========` comment in `tests/mocks/supabase.ts` and before the final `return { data: null, error: { code: 'PGRST116', message: 'RPC not found' } };` fallback inside the `rpc()` function.

<ref_snippet file="c:/PROJECT/vietsalepro/tests/mocks/supabase.ts" lines="6208-6214" />

A new section comment will be added:

```text
// ========== Domain H9 — Reports & Dashboard (Recovery Wave-05) ==========
```

The new section must preserve the existing flat `if (name === '...')` / `else if (name === '...')` dispatch style and must not relocate any existing handler block.

---

## Store Strategy

No new in-memory stores are authorized. Only existing `const store` keys identified by the Architecture Decision will be read.

| Store | Used By | Reason |
|---|---|---|
| `orders` | `get_dashboard_summary`, `get_profit_report` | Source of order dates, status, payment method, customer names, total amounts, and returned amounts |
| `order_items` | `get_dashboard_summary`, `get_profit_report` | Source of product quantities, product names, prices, and per-line cost |
| `products` | `get_dashboard_summary`, `get_profit_report` | Source of current product cost/price/quantity for inventory valuation and cost fallback |
| `customers` | `get_dashboard_summary` | Source of `debtCustomers`, `topCustomers`, `totalDebt`, `totalCustomers` |
| `return_orders` | `get_profit_report` | Source of non-cancelled return headers used to adjust net quantities |
| `return_order_items` | `get_profit_report` | Source of returned quantities per order/product |

These stores are already populated by the H1–H8 handlers and baseline test fixtures. No new store key, seed data, or reset logic is required.

---

## Helper Strategy

No new helper functions are authorized. The following existing top-level utilities and patterns in `tests/mocks/supabase.ts` may be reused inline:

| Helper / Pattern | Source | Reuse |
|---|---|---|
| `uuid()` | `tests/mocks/supabase.ts` top-level | Not required for read-only report handlers; retained as available utility |
| `addDays(dateStr, days)` | `tests/mocks/supabase.ts` top-level | Available for date arithmetic if needed for comparison periods |
| `addMonths(dateStr, months)` | `tests/mocks/supabase.ts` top-level | Available for `samePeriod` year-offset logic |
| `Number(...)` coercion | Used throughout existing report handlers | Required so service-level `Number(data?.field \|\| 0)` calls receive compatible values |
| Inline date-range filtering | Existing `get_sales_report`, `get_customer_report` handlers | Reused for `p_from`/`p_to` and `p_start_date`/`p_end_date` comparisons |
| Inline aggregation / grouping | Existing `get_sales_report`, `get_inventory_report` handlers | Reused for revenue, cost, profit, and top-N aggregation |

All report logic will remain inline within the two new handler blocks. No module-level abstraction, shared report builder, or new helper file may be introduced.

---

## Return Contract Checklist

Both RPCs return a single JSON object inside the `supabase.rpc` wrapper `{ data: <object>, error: null }`.

### `get_dashboard_summary`

Canonical signature:

<ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql" lines="7090-7092" />

#### Parameter contract

| Parameter | Mode | Type | Default | Description |
|---|---|---|---|---|
| `p_from` | Optional | `date` (ISO `YYYY-MM-DD` string or `null`) | `null` | Inclusive start of the summary period |
| `p_to` | Optional | `date` (ISO `YYYY-MM-DD` string or `null`) | `null` | Inclusive end of the summary period |

#### Default values

- `p_from` defaults to `null` when omitted.
- `p_to` defaults to `null` when omitted.
- `null` values must be treated as unbounded; `undefined` must also be accepted because `components/MobileHome.tsx` calls the service with no arguments.

#### Return structure

| Field | Type | Source / Description |
|---|---|---|
| `revenueData` | `Array<{ date: string; revenue: number; profit: number; orders: number }>` | Per-day aggregates within the requested date range; `date` formatted `DD/MM` |
| `topProducts` | `Array<{ name: string; quantity: number; revenue: number }>` | Top 10 products by revenue in the period |
| `inventoryValue` | `number` | Total inventory valuation at cost (`SUM(cost * quantity)`) |
| `inventoryRetailValue` | `number` | Total inventory valuation at retail price (`SUM(price * quantity)`) |
| `debtCustomers` | `Array<Customer>` (raw DB rows) | Customers with `debt > 0`, sorted descending by debt |
| `topCustomers` | `Array<Customer & { order_count: number }>` (raw DB rows) | Top 10 customers by `total_spent`, sorted descending, including `order_count` |
| `totalDebt` | `number` | Sum of all customer debt |
| `totalCustomers` | `number` | Count of all customers |
| `totalProducts` | `number` | Count of all products |
| `activeProducts` | `number` | Count of products with `quantity > 0` |
| `todayRevenue` | `number` | Total `total_amount` of orders dated today |
| `todayOrders` | `number` | Count of orders dated today |
| `todaySoldProducts` | `number` | Sum of `order_items.quantity` for orders dated today |
| `todayCustomers` | `number` | Count of distinct `customer_id` on orders dated today, excluding `NULL` |
| `yesterdayRevenue` | `number` | Total `total_amount` of orders dated yesterday |

#### Key naming compatibility

- All top-level keys are camelCase and match the service return mapping exactly.
- `revenueData` objects use `date`, `revenue`, `profit`, `orders`.
- `topProducts` objects use `name`, `quantity`, `revenue`.
- `debtCustomers` and `topCustomers` rows must contain the snake_case customer fields stored in `store.customers` (e.g., `total_spent`, `loyalty_points`, `last_purchase_date`, `created_at`, `updated_at`) so that `mapCustomerFromDB` produces a valid `Customer` object.

<ref_snippet file="c:/PROJECT/vietsalepro/services/supabaseService.ts" lines="101-114" />

- `topCustomers` must additionally include the extra key `order_count`, which the service maps to `orderCount`.

#### Production call-site compatibility

<ref_snippet file="c:/PROJECT/vietsalepro/services/supabaseService.ts" lines="776-811" />

- `pages/Dashboard.tsx:438` calls `getDashboardSummary(from, to)` and consumes all top-level fields, computing `totalRevenue`, `totalProfit`, `totalOrders`, and `totalDebtAmount` from `revenueData` and `debtCustomers`.
- `components/MobileHome.tsx:92` calls `getDashboardSummary()` with no arguments and consumes only `todayRevenue`, `yesterdayRevenue`, `todayOrders`, `todaySoldProducts`, `todayCustomers`, `activeProducts`, and `totalCustomers`.
- All numeric values returned by the mock must be numbers, because the service wraps each with `Number(...)` and the UI performs arithmetic on them.

---

### `get_profit_report`

Canonical signature:

<ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql" lines="8151-8152" />

#### Parameter contract

| Parameter | Mode | Type | Default | Description |
|---|---|---|---|---|
| `p_start_date` | Required | `date` (ISO `YYYY-MM-DD` string) | — | Inclusive start of the profit-report period |
| `p_end_date` | Required | `date` (ISO `YYYY-MM-DD` string) | — | Inclusive end of the profit-report period |
| `p_status` | Optional | `text` | `'all'` | Order-status filter; `'all'` disables filtering |
| `p_payment_method` | Optional | `text` | `''` | Payment-method filter; empty string disables filtering |
| `p_product_keyword` | Optional | `text` | `''` | Case-insensitive substring match against `order_items.product_name` |
| `p_customer_keyword` | Optional | `text` | `''` | Case-insensitive substring match against `orders.customer_name` |
| `p_compare_mode` | Optional | `text` | `'prev'` | Comparison period: `'prev'` (preceding equal-length period) or `'samePeriod'` (same calendar dates in the prior year) |

#### Default values

- `p_status` defaults to `'all'`.
- `p_payment_method` defaults to `''`.
- `p_product_keyword` defaults to `''`.
- `p_customer_keyword` defaults to `''`.
- `p_compare_mode` defaults to `'prev'`.

#### Return structure

| Field | Type | Description |
|---|---|---|
| `summary` | `{ totalRevenue: number; totalCost: number; profit: number; margin: number; prevRevenue: number; prevCost: number; prevProfit: number; profitChange: number }` | Period vs. comparison-period aggregates; `margin` and `profitChange` are percentages already multiplied by 100 |
| `dailyProfit` | `Array<{ date: string; currentRevenue: number; currentProfit: number; prevRevenue: number; prevProfit: number }>` | Day-by-day current and comparison revenue/profit |
| `profitDetails` | `Array<{ date: string; orderId: string; productName: string; revenue: number; cost: number; profit: number; margin: number }>` | One row per order-item line, with `profit = revenue - cost` and `margin` as a percentage value |
| `groupedByProduct` | `Array<{ key: string; label: string; revenue: number; cost: number; profit: number; count: number }>` | Aggregated by product, sorted descending by profit; `count` is the net quantity sold |
| `groupedByCustomer` | `Array<{ key: string; label: string; revenue: number; cost: number; profit: number; count: number }>` | Aggregated by customer, sorted descending by profit; `count` is the customer's order count |
| `groupedByDay` | `Array<{ key: string; label: string; revenue: number; cost: number; profit: number; count: number }>` | Aggregated by date, sorted descending by date; `count` must be present even though the canonical migration does not select it |

#### Key naming compatibility

- The canonical migration emits snake_case keys for nested objects (`current_revenue`, `current_profit`, `prev_revenue`, `prev_profit`, `order_id`, `product_name`).
- The `getProfitReport` service function returns `data` directly with an `as` cast and does **not** remap keys.
- The mock handler must translate snake_case canonical keys to the camelCase keys consumed by the production code.

<ref_snippet file="c:/PROJECT/vietsalepro/services/supabaseService.ts" lines="3822-3853" />

Required translations:

- `dailyProfit`: `current_revenue` → `currentRevenue`, `current_profit` → `currentProfit`, `prev_revenue` → `prevRevenue`, `prev_profit` → `prevProfit`.
- `profitDetails`: `order_id` → `orderId`, `product_name` → `productName`.
- All grouped arrays must include the key `count`.

#### Production call-site compatibility

<ref_snippet file="c:/PROJECT/vietsalepro/pages/Reports.tsx" lines="310-333" />

<ref_snippet file="c:/PROJECT/vietsalepro/pages/Reports.tsx" lines="440-457" />

<ref_snippet file="c:/PROJECT/vietsalepro/pages/Reports.tsx" lines="960-1001" />

- `pages/Reports.tsx` consumes `summary`, `dailyProfit`, `profitDetails`, `groupedByProduct`, `groupedByCustomer`, and `groupedByDay`.
- The UI references `row.orderId`, `row.productName`, `row.currentRevenue`, `row.currentProfit`, `row.prevRevenue`, `row.prevProfit`, and `row.count`.
- All grouped arrays are rendered interchangeably, so every grouped object must expose the same `{ key, label, revenue, cost, profit, count }` shape.

---

## Engineering Risks

Only risks documented by `RECOVERY_WAVE_05_ARCHITECTURE_DECISION.md` are listed below, with the planned engineering mitigation for each.

| # | Risk | Severity | Engineering Mitigation |
|---|---|---|---|
| 1 | `get_dashboard_summary` returns a large nested JSON aggregate; a naive mock may omit keys used by `pages/Dashboard.tsx` or `components/MobileHome.tsx` | Low | Implement every top-level and nested key listed in the Return Contract Checklist, derived from the canonical migration body and the `getDashboardSummary` return mapping at `services/supabaseService.ts:782-809`. Verify the checklist against each call site before considering the handler complete. |
| 2 | `get_profit_report` has multiple optional filters and two compare modes (`prev` / `samePeriod`); an incomplete mock may not cover all call-site branches | Low | Implement all seven parameters with the documented defaults; support both `prev` (preceding equal-length period) and `samePeriod` (same dates in prior year) comparison logic; test filter combinations during verification. |
| 3 | Canonical migration uses snake_case keys (`current_revenue`, `order_id`, `product_name`) while the production `ProfitReport` type and UI expect camelCase (`currentRevenue`, `orderId`, `productName`) | Medium | Translate snake_case keys to camelCase inside the `get_profit_report` handler. Add `count` to `groupedByDay` even though the canonical migration does not select it. |
| 4 | Scope creep could introduce out-of-scope RPCs, cleanup, or refactoring | Medium | Scope lock: only the two authorized handler blocks may be added. Verification will reject any change outside `tests/mocks/supabase.ts` and any handler name not in the Authorized RPC Inventory. |
| 5 | A regression could remove or alter an existing handler | Low | Additive-only implementation: no existing `if`/`else if` block may be modified or relocated. Verification must confirm the matched RPC count increases by exactly 2 (from 182 to 184) and that no previously covered RPC becomes missing. |
| 6 | Working-tree changes remain uncommitted; final recovery state depends on future commit decisions | Low | This kickoff does not alter git state. Commit and program closeout remain separate governance stages after Verification and Acceptance. |

---

## Validation Strategy

Implementation must later satisfy the following gates. Coverage shall **not** be measured during Engineering Kickoff.

| # | Gate | Command / Criterion | Evidence |
|---|---|---|---|
| 1 | Canonical audit gate | `npx tsx scripts/audit-rpc-contracts.ts` exits 0; reports 300 migration RPCs, 183 code RPCs, 0 missing from migrations | Exit code and stdout |
| 2 | Type gate | `npx tsc --noEmit` exits 0 with no TypeScript errors | Exit code |
| 3 | Test gate | `npx vitest run` passes with no new failures | Exit code and test count |
| 4 | Direct coverage gate (multi-line `.rpc(` aware) | Scan `services/`, `lib/`, `utils/` for all `.rpc(` call sites and cross-reference with `if/else if (name === '...')` blocks in `tests/mocks/supabase.ts` | `RECOVERY_WAVE_05_VERIFICATION_REPORT.md` |
| 5 | Target coverage check | Direct measurement shows **184 of 184** code RPCs covered, with zero remaining missing | `RECOVERY_WAVE_05_VERIFICATION_REPORT.md` |
| 6 | Scope gate | `git diff --name-only` shows only `tests/mocks/supabase.ts` and test files changed | Git diff |
| 7 | Handler inventory gate | `tests/mocks/supabase.ts` contains exactly one handler block for each authorized RPC and no handler for any unauthorized RPC | Manual or script check |
| 8 | Independent verification | `RECOVERY_WAVE_05_VERIFICATION_REPORT.md` is produced and independently confirms the above | Governance artifact |
| 9 | Acceptance review | `RECOVERY_WAVE_05_ACCEPTANCE_REVIEW.md` formally accepts the wave | Governance artifact |

The target coverage of **184 / 184** is a verification target only. It must not be reported as an achieved fact until `RECOVERY_WAVE_05_VERIFICATION_REPORT.md` confirms it.

---

## Engineering Freeze

The Wave-05 engineering scope is frozen as of this document:

- **Scope is frozen.** Exactly **two** handlers are authorized: `get_dashboard_summary` and `get_profit_report`.
- **No additional RPCs** may be implemented in this wave.
- **No new stores** may be added to `const store`.
- **No new helpers** may be introduced.
- **No production code changes** (`services/`, `lib/`, `utils/`, `pages/`, `components/`) are authorized.
- **No migration, schema, generated type, package, or CI changes** are authorized.
- **No cleanup, refactoring, dead-handler removal, or duplicate-handler removal** is authorized.
- **No existing handler may be modified or relocated.**

Any scope change requires a new Authorization and a new Architecture Decision.

---

## Exit Gate

The expected governance flow after implementation is:

```text
Implementation
      ↓
Independent Verification (RECOVERY_WAVE_05_VERIFICATION_REPORT.md)
      ↓
Acceptance Review (RECOVERY_WAVE_05_ACCEPTANCE_REVIEW.md)
      ↓
Phase-4 Program Status Review
```

This document does **not** claim that Phase 4 Recovery will be complete. Final completion depends on successful Independent Verification and Acceptance Review. The Program Status Review will determine whether the Recovery Program can be closed.

---

## Acceptance Criteria

This Engineering Kickoff is **PASS** only if all of the following are true:

1. Exactly **2** authorized RPCs are listed for Wave-05.
2. Both RPCs belong only to **Domain H9 — Reports & Dashboard**.
3. No unauthorized RPC, domain, store, helper, cleanup task, or refactoring task has entered the scope.
4. No implementation has been performed in this document.
5. No code, mock, production, migration, schema, generated-type, package, or CI files have been modified.
6. The implementation sequence is documented and preserves existing handler ordering.
7. The store strategy reuses only existing stores and authorizes no new store.
8. The helper strategy reuses only existing helpers and authorizes no new helper.
9. The Return Contract Checklist covers parameter contract, defaults, return structure, key naming compatibility, and production call-site compatibility for each RPC.
10. Engineering risks from the Architecture Decision are listed with planned engineering mitigations.
11. The Validation Strategy explicitly defers coverage measurement to `RECOVERY_WAVE_05_VERIFICATION_REPORT.md`.
12. The Engineering Freeze is declared explicitly.
13. The Exit Gate is declared and does not claim Phase 4 completion.

---

## Final Engineering Decision

**APPROVED.**

Recovery Wave-05 is authorized to proceed to implementation. The Engineering Kickoff converts the approved `RECOVERY_WAVE_05_ARCHITECTURE_DECISION.md` into the following executable plan:

- Implement exactly **two** additive mock handlers in `tests/mocks/supabase.ts`: `get_dashboard_summary` and `get_profit_report`.
- Insert both handlers in Domain H9 order immediately after `// ========== End Domain H8 ==========` and before the final `PGRST116` fallback.
- Reuse only the existing in-memory stores (`orders`, `order_items`, `products`, `customers`, `return_orders`, `return_order_items`).
- Reuse only existing helpers and inline patterns (`addDays`, `addMonths`, `Number` coercion, existing report aggregation patterns).
- Fulfill the Return Contract Checklist for both RPCs, including camelCase key translation and `count` injection for `get_profit_report`.
- Validate with the canonical audit gate, type gate, test gate, direct multi-line `.rpc(` coverage measurement, and scope verification.
- Produce `RECOVERY_WAVE_05_IMPLEMENTATION_REPORT.md` and `RECOVERY_WAVE_05_VERIFICATION_REPORT.md` after implementation.

No production code, migrations, schemas, generated types, packages, CI, or governance files are authorized for modification under this kickoff.

---

## Document Control

- **No source code, mock, migration, production file, generated type, package file, or CI workflow was modified to produce this Engineering Kickoff.**
- All references are to existing, approved governance and codebase artifacts.
- The next approved stage is implementation, followed by Independent Verification and Acceptance Review.
