# RECOVERY WAVE-05 — ARCHITECTURE DECISION

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Wave:** Recovery Wave-05  
**Domain:** H9 — Reports & Dashboard  
**Document Type:** Architecture Decision  
**Date:** 2026-07-16  
**Authority:** Program Recovery Authorization Review  
**Status:** APPROVED — Architecture frozen, implementation deferred to Engineering Kickoff  

---

## Executive Summary

Recovery Wave-05 is the final architecture stage before the last implementation wave of Phase 4. It authorizes mock handlers for exactly **two remaining uncovered code RPCs** in **Domain H9 — Reports & Dashboard**:

1. `get_dashboard_summary`
2. `get_profit_report`

Both RPCs are invoked through `services/supabaseService.ts` and are consumed by `pages/Dashboard.tsx`, `components/MobileHome.tsx`, and `pages/Reports.tsx`. The canonical behavior, parameter names, and return shapes are defined in `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`.

This decision:

- limits all implementation to `tests/mocks/supabase.ts`;
- reuses existing in-memory stores exclusively;
- reuses existing helper functions only;
- preserves the existing flat `if (name === '...')` dispatch pattern;
- requires additive-only changes with no production, migration, schema, generated-type, package, or CI modifications.

No code is implemented by this document.

---

## Accepted Recovery Baseline

The baseline below is taken from the accepted Wave-04 verification and acceptance artifacts. It is not recalculated here.

| Metric | Value | Source |
|---|---|---|
| Unique code RPC names | **184** | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` §3 |
| Code RPCs per canonical audit script | **183** | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` §3 (audit script misses multi-line `complete_disposal`) |
| Matched code RPCs (with mock handler) | **182** | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` §3 |
| Missing code RPCs | **2** | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` §3 |
| Coverage | **98.91%** (`182 / 184`) | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` §3 |
| Wave-04 status | **FORMALLY ACCEPTED** | `RECOVERY_WAVE_04_ACCEPTANCE_REVIEW.md` §1 |
| Remaining domain | **H9 — Reports & Dashboard** | `RECOVERY_WAVE_04_ACCEPTANCE_REVIEW.md` §3 |

The two missing RPCs are the only Wave-05 scope.

---

## Architecture Consistency Review

The Wave-05 Authorization was compared against the governance priority chain and the current working tree.

| Check | Evidence | Finding |
|---|---|---|
| Exactly 2 authorized RPCs | `RECOVERY_WAVE_05_AUTHORIZATION.md` §6 lists `get_dashboard_summary` and `get_profit_report` only. | ✅ PASS |
| Both RPCs belong only to Domain H9 | `PHASE4_RECOVERY_MAPPING_VALIDATION.md` §3 Domain H9: both listed under H9 — Reports & Dashboard. `PHASE4_COVERAGE_ROADMAP.md` §2 also maps both to H9. | ✅ PASS |
| No additional uncovered RPC exists | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` §3: missing RPC count = 2, both H9. | ✅ PASS |
| No H9 scope expansion | `RECOVERY_WAVE_05_AUTHORIZATION.md` §9.2 explicitly excludes any domain other than H9 and any RPC other than the two authorized functions. | ✅ PASS |
| No unresolved mapping issue | `PHASE4_RECOVERY_MAPPING_VALIDATION.md` §9: H9 = **MATCH**, `MISMATCH unresolved: 0`. The Domain A/B mapping errata does not affect H9. | ✅ PASS |
| No dependency requires Domain F | Both H9 handlers aggregate `orders`, `order_items`, `products`, `customers`, `return_orders`, and `return_order_items`. No notification store or Domain F RPC is referenced in the canonical migration bodies or production call sites. | ✅ PASS |
| Both RPCs exist in canonical migrations | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` defines both (`get_dashboard_summary` at line 7090, `get_profit_report` at line 8151). | ✅ PASS |
| Both RPCs have active production call sites | `services/supabaseService.ts` calls `get_dashboard_summary` (line 777) and `get_profit_report` (line 3827). `pages/Dashboard.tsx`, `components/MobileHome.tsx`, and `pages/Reports.tsx` invoke the service functions. | ✅ PASS |
| Both RPCs are missing from `tests/mocks/supabase.ts` | Direct scan of `tests/mocks/supabase.ts` contains no handler for either RPC name. | ✅ PASS |
| Additive-only strategy preserved | `RECOVERY_WAVE_05_AUTHORIZATION.md` §9.1 and §12 mandate no existing handler may be removed or altered. | ✅ PASS |

**Consistency verdict:** Wave-05 scope is internally consistent with the canonical migration chain, the production call sites, the recovery mapping validation, and the accepted Wave-04 baseline. No inconsistency was found.

---

## Authorized RPC Inventory

| # | Domain | RPC | Canonical Migration | Production Call Site | Service Function | Currently Missing? |
|---|---|---|---|---|---|---|
| 1 | H9 — Reports & Dashboard | `get_dashboard_summary` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:7090` | `services/supabaseService.ts:777` | `getDashboardSummary(from?: string, to?: string)` | ✅ Yes |
| 2 | H9 — Reports & Dashboard | `get_profit_report` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:8151` | `services/supabaseService.ts:3827` | `getProfitReport(startDate, endDate, filters?)` | ✅ Yes |

**Total authorized RPCs: 2.**

<ref_snippet file="c:/PROJECT/vietsalepro/RECOVERY_WAVE_05_AUTHORIZATION.md" lines="95-111" />

---

## Canonical Migration References

All handler behavior, parameter names, default values, and return shapes must be derived from `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`.

### `get_dashboard_summary`

<ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql" lines="7090-7092" />

Canonical signature:

```sql
CREATE OR REPLACE FUNCTION "public"."get_dashboard_summary"(
  "p_from" "date" DEFAULT NULL::"date",
  "p_to" "date" DEFAULT NULL::"date"
) RETURNS json
```

Full body and return construction are at lines 7090–7241.

<ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql" lines="7223-7241" />

### `get_profit_report`

<ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql" lines="8151-8152" />

Canonical signature:

```sql
CREATE OR REPLACE FUNCTION "public"."get_profit_report"(
  "p_start_date" "date",
  "p_end_date" "date",
  "p_status" "text" DEFAULT 'all'::"text",
  "p_payment_method" "text" DEFAULT ''::"text",
  "p_product_keyword" "text" DEFAULT ''::"text",
  "p_customer_keyword" "text" DEFAULT ''::"text",
  "p_compare_mode" "text" DEFAULT 'prev'::"text"
) RETURNS json
```

Full body and return construction are at lines 8151–8450.

<ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql" lines="8436-8449" />

---

## Production Call-Site References

### `get_dashboard_summary`

Service function and RPC invocation:

<ref_snippet file="c:/PROJECT/vietsalepro/services/supabaseService.ts" lines="776-811" />

Argument mapping:

| RPC parameter | Source argument | Type | Notes |
|---|---|---|---|
| `p_from` | `from \|\| null` | `string \| null` | Optional ISO date (`YYYY-MM-DD`) or `undefined`; passed as `null` when absent. |
| `p_to` | `to \|\| null` | `string \| null` | Optional ISO date (`YYYY-MM-DD`) or `undefined`; passed as `null` when absent. |

UI callers:

- `pages/Dashboard.tsx:438` calls `supabaseService.getDashboardSummary(from, to)` for the selected `dateRange` (`7d`, `30d`, or `all`).
- `components/MobileHome.tsx:92` calls `supabaseService.getDashboardSummary()` with no arguments and reads only the today/yesterday and inventory/customer summary fields.

<ref_snippet file="c:/PROJECT/vietsalepro/pages/Dashboard.tsx" lines="424-457" />
<ref_snippet file="c:/PROJECT/vietsalepro/components/MobileHome.tsx" lines="88-103" />

### `get_profit_report`

Service function and RPC invocation:

<ref_snippet file="c:/PROJECT/vietsalepro/services/supabaseService.ts" lines="3822-3853" />

Argument mapping:

| RPC parameter | Source argument | Type | Default |
|---|---|---|---|
| `p_start_date` | `startDate` | `string` (required) | — |
| `p_end_date` | `endDate` | `string` (required) | — |
| `p_status` | `filters?.status \|\| 'all'` | `string` | `'all'` |
| `p_payment_method` | `filters?.paymentMethod \|\| ''` | `string` | `''` |
| `p_product_keyword` | `filters?.productKeyword \|\| ''` | `string` | `''` |
| `p_customer_keyword` | `filters?.customerKeyword \|\| ''` | `string` | `''` |
| `p_compare_mode` | `filters?.compareMode \|\| 'prev'` | `string` | `'prev'` |

UI caller:

<ref_snippet file="c:/PROJECT/vietsalepro/pages/Reports.tsx" lines="310-333" />

The filter UI exposes `p_status` (order status), `p_payment_method`, `p_product_keyword`, `p_customer_keyword`, and `p_compare_mode` (`prev` or `samePeriod`).

<ref_snippet file="c:/PROJECT/vietsalepro/pages/Reports.tsx" lines="608-623" />

---

## Parameter Contracts

### `get_dashboard_summary`

| Parameter | Mode | Type | Default | Description |
|---|---|---|---|---|
| `p_from` | Optional | `date` (ISO `YYYY-MM-DD` string or `null`) | `NULL` | Inclusive start of the requested summary period. When `NULL`, revenue and top-product aggregates include all historical orders. |
| `p_to` | Optional | `date` (ISO `YYYY-MM-DD` string or `null`) | `NULL` | Inclusive end of the requested summary period. When `NULL`, no upper date boundary is applied. |

Caller expectations:

- `pages/Dashboard.tsx` passes `from` and `to` as ISO date strings for `7d`/`30d` ranges and omits both for `all`.
- `components/MobileHome.tsx` calls the service with no arguments, so the handler must treat both parameters as optional.
- The handler must not throw if `p_from` or `p_to` is `null` or `undefined`.

### `get_profit_report`

| Parameter | Mode | Type | Default | Description |
|---|---|---|---|---|
| `p_start_date` | Required | `date` (ISO `YYYY-MM-DD` string) | — | Inclusive start of the profit-report period. |
| `p_end_date` | Required | `date` (ISO `YYYY-MM-DD` string) | — | Inclusive end of the profit-report period. |
| `p_status` | Optional | `text` | `'all'` | Order-status filter. `'all'` disables filtering; any other value matches `orders.status`. |
| `p_payment_method` | Optional | `text` | `''` | Payment-method filter. Empty string disables filtering; any other value matches `orders.payment_method`. |
| `p_product_keyword` | Optional | `text` | `''` | Case-insensitive substring match against `order_items.product_name`. Empty string disables filtering. |
| `p_customer_keyword` | Optional | `text` | `''` | Case-insensitive substring match against `orders.customer_name`. Empty string disables filtering. |
| `p_compare_mode` | Optional | `text` | `'prev'` | Comparison period selector. Supported values: `'prev'` (immediately preceding period of equal length) and `'samePeriod'` (same calendar dates in the prior year). |

Caller expectations:

- `pages/Reports.tsx` always provides `startDate` and `endDate` as ISO date strings.
- Filters are optional and are passed as an object; each filter defaults to the value shown above.
- `compareMode` is selected from a dropdown limited to `prev` and `samePeriod`.

---

## Return Contracts

Both RPCs return a single JSON object. The handler must return the object inside `supabase.rpc`’s `{ data: ..., error: null }` wrapper, consistent with every existing handler in `tests/mocks/supabase.ts`.

### `get_dashboard_summary`

Mandatory top-level fields and nested structures:

| Field | Type | Source / Description |
|---|---|---|
| `revenueData` | `Array<{ date: string; revenue: number; profit: number; orders: number }>` | Aggregated revenue, profit, and order count per day for the requested period. Canonical source uses `to_char(... 'DD/MM')` for `date`. |
| `topProducts` | `Array<{ name: string; quantity: number; revenue: number }>` | Top 10 products by revenue in the requested period, sorted descending by revenue. |
| `inventoryValue` | `number` | Total inventory valuation at cost (`SUM(cost * quantity)`). |
| `inventoryRetailValue` | `number` | Total inventory valuation at retail price (`SUM(price * quantity)`). |
| `debtCustomers` | `Array<Customer>` (raw DB rows) | Customers with `debt > 0`, sorted descending by debt. The service maps each row through `mapCustomerFromDB`, so the handler should provide snake_case customer fields as stored in `store.customers`. |
| `topCustomers` | `Array<Customer & { order_count: number }>` (raw DB rows) | Top 10 customers by `total_spent`, sorted descending, including `order_count`. The service maps with `mapCustomerFromDB` and exposes `orderCount`. |
| `totalDebt` | `number` | Sum of all customer debt. |
| `totalCustomers` | `number` | Count of all customers. |
| `totalProducts` | `number` | Count of all products. |
| `activeProducts` | `number` | Count of products with `quantity > 0`. |
| `todayRevenue` | `number` | Total `total_amount` of orders dated today. |
| `todayOrders` | `number` | Count of orders dated today. |
| `todaySoldProducts` | `number` | Sum of `order_items.quantity` for orders dated today. |
| `todayCustomers` | `number` | Count of distinct `customer_id` on orders dated today (excluding `NULL`). |
| `yesterdayRevenue` | `number` | Total `total_amount` of orders dated yesterday. |

Optional fields: none. Every top-level field is consumed by at least one production call site:

- `pages/Dashboard.tsx` reads all fields and computes `totalRevenue`, `totalProfit`, `totalOrders`, and `totalDebtAmount` from `revenueData` and `debtCustomers`.
- `components/MobileHome.tsx` reads only `todayRevenue`, `yesterdayRevenue`, `todayOrders`, `todaySoldProducts`, `todayCustomers`, `activeProducts`, and `totalCustomers`.

Compatibility requirements:

- `debtCustomers` and `topCustomers` must contain the same snake-case customer row fields used elsewhere in the mock (e.g., `total_spent`, `loyalty_points`, `last_purchase_date`, `created_at`, `updated_at`) so that `mapCustomerFromDB` produces a valid `Customer` object.
- `topCustomers` must include the extra key `order_count`, which `getDashboardSummary` maps to `orderCount`.
- All numeric values should be numbers (not strings) because the service wraps each with `Number(...)` and the UI performs arithmetic on them.

### `get_profit_report`

Mandatory top-level fields and nested structures:

| Field | Type | Description |
|---|---|---|
| `summary` | `{ totalRevenue: number; totalCost: number; profit: number; margin: number; prevRevenue: number; prevCost: number; prevProfit: number; profitChange: number }` | Period vs. comparison-period aggregates. `margin` and `profitChange` are percentages already multiplied by 100. |
| `dailyProfit` | `Array<{ date: string; currentRevenue: number; currentProfit: number; prevRevenue: number; prevProfit: number }>` | Day-by-day current and comparison revenue/profit. |
| `profitDetails` | `Array<{ date: string; orderId: string; productName: string; revenue: number; cost: number; profit: number; margin: number }>` | One row per order-item line, with `profit = revenue - cost` and `margin` as a percentage value. |
| `groupedByProduct` | `Array<{ key: string; label: string; revenue: number; cost: number; profit: number; count: number }>` | Aggregated by product, sorted descending by profit. `count` is the net quantity sold. |
| `groupedByCustomer` | `Array<{ key: string; label: string; revenue: number; cost: number; profit: number; count: number }>` | Aggregated by customer, sorted descending by profit. `count` is the customer’s order count. |
| `groupedByDay` | `Array<{ key: string; label: string; revenue: number; cost: number; profit: number; count: number }>` | Aggregated by date, sorted descending by date. `count` is not selected by the canonical migration, but the production `ProfitReport` type requires it, so the handler must include it. |

Optional fields: none. Every field is consumed by `pages/Reports.tsx`.

Production call-site expectations:

<ref_snippet file="c:/PROJECT/vietsalepro/pages/Reports.tsx" lines="162-178" />
<ref_snippet file="c:/PROJECT/vietsalepro/pages/Reports.tsx" lines="440-457" />
<ref_snippet file="c:/PROJECT/vietsalepro/pages/Reports.tsx" lines="960-1001" />

Key-casing compatibility requirement:

The canonical migration emits a mixture of camelCase and snake_case keys:

- `summary` uses camelCase keys (`totalRevenue`, `totalCost`, etc.).
- `dailyProfit` objects use `current_revenue`, `current_profit`, `prev_revenue`, `prev_profit`.
- `profitDetails` objects use `order_id` and `product_name`.
- `groupedByDay` does not include a `count` column.

The `getProfitReport` service function returns `data` directly with a `as` cast and does **not** remap keys. The UI references `row.orderId`, `row.productName`, `row.currentRevenue`, `row.currentProfit`, `row.prevRevenue`, `row.prevProfit`, and expects `count` on all grouped arrays. Therefore the mock handler must reconcile the canonical snake_case keys to the camelCase keys consumed by the production code, and must add `count` to `groupedByDay`.

Ignored fields:

- `summary.totalRevenue`, `summary.prevRevenue`, `summary.prevCost`, and `summary.prevProfit` are part of the typed contract but are not directly rendered in `pages/Reports.tsx`; they are still required because the `ProfitReport` type and service return type include them.

---

## Store Strategy

No new in-memory stores are authorized.

Existing stores shall be reused exclusively.

The two H9 handlers read only from the existing `const store` in `tests/mocks/supabase.ts`:

- `orders`
- `order_items`
- `products`
- `customers`
- `return_orders`
- `return_order_items`

These stores are already initialized and populated by the preceding domain handlers (H1–H8) and the baseline test fixtures. No new store key, seed data, or reset logic is required.

<ref_snippet file="c:/PROJECT/vietsalepro/tests/mocks/supabase.ts" lines="16-91" />

---

## Helper Strategy

No new helper functions are authorized.

Existing helper functions shall be reused.

The existing top-level utilities in `tests/mocks/supabase.ts` may be reused as needed:

- `uuid()`
- `addDays(dateStr, days)`
- `addMonths(dateStr, months)`
- `Number(...)` coercion patterns used by all existing report handlers
- Inline date-range and aggregation patterns established in `get_sales_report`, `get_customer_report`, and `get_inventory_report`

The report logic should remain inline within the two new `if (name === '...')` handler blocks, following the established flat dispatch style. No module-level abstraction, shared report builder, or new helper file may be introduced.

<ref_snippet file="c:/PROJECT/vietsalepro/tests/mocks/supabase.ts" lines="139-175" />

---

## Implementation Strategy

- **Handler order:** Insert the `get_dashboard_summary` and `get_profit_report` handler blocks immediately after the `// ========== End Domain H8 ==========` comment and before the final `return { data: null, error: { code: 'PGRST116', message: 'RPC not found' } };` fallback inside the `rpc()` function.
- **Domain ordering:** The new section should be labeled `// ========== Domain H9 — Reports & Dashboard (Recovery Wave-05) ==========` for consistency with previous waves.
- **Dependency order:** Both handlers are read-only aggregators. `get_profit_report` depends on the same stores as `get_dashboard_summary` and earlier report handlers; there is no dependency on Domain F or any uncovered RPC.
- **Expected complexity:** Medium. The handlers require date-range filtering, order/status/payment/keyword filtering, net-quantity computation with return-order adjustments, comparison-period arithmetic, and multi-level JSON aggregation.
- **Canonical migration source:** `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` (lines 7090–7241 and 8151–8450).
- **Production call-site reference:** `services/supabaseService.ts` (`getDashboardSummary` at line 776, `getProfitReport` at line 3822) and the consuming UI components `pages/Dashboard.tsx`, `components/MobileHome.tsx`, and `pages/Reports.tsx`.
- **No implementation code is produced by this architecture decision.** Engineering Kickoff will translate these contracts into the two handler blocks.

---

## Scope Boundary

### In scope

- Add exactly **two** mock handlers in `tests/mocks/supabase.ts`.
- The handlers are `get_dashboard_summary` and `get_profit_report`.
- Derive parameter names, default values, return shapes, and aggregate logic from the canonical migration chain.
- Preserve the existing flat `if (name === '...')` / `else if (name === '...')` dispatch pattern.
- Reuse existing in-memory stores and helper functions only.
- Changes are additive; no existing handler or store may be modified in behavior.

### Out of scope (not authorized)

- Any domain other than H9.
- Any RPC other than `get_dashboard_summary` and `get_profit_report`.
- Production code changes (`services/`, `lib/`, `utils/`, `pages/`, `components/`).
- Database schema or migration changes.
- Generated type changes (`database.types.ts`).
- `package.json`, CI, or infrastructure changes.
- Cleanup, refactoring, dead-handler removal, duplicate-handler removal, or helper abstraction.
- Engineering Kickoff, Implementation Report, Verification Report, Acceptance Review, Program Status Review, or final recovery summary.

---

## Constraints

- Do **not** implement handlers.
- Do **not** modify `tests/mocks/supabase.ts` until Engineering Kickoff is approved.
- Do **not** modify production code.
- Do **not** modify migrations, schema, generated types, services, package files, or CI.
- Do **not** introduce new stores or helpers.
- Do **not** expand the H9 scope or add additional RPCs.
- Do **not** remove or alter existing handlers, even duplicates or dead handlers.

---

## Architecture Freeze

The Wave-05 architecture is **frozen** as of this document.

- Architecture is frozen.
- Scope is frozen.
- Exactly **2 RPCs** are authorized: `get_dashboard_summary` and `get_profit_report`.
- No additional RPC may be added to this wave.
- No helper framework may be introduced.
- No new in-memory stores may be added unless explicitly justified by a new Authorization.
- Any scope, contract, or dependency change requires a new Authorization and a new Architecture Decision.

---

## Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | `get_dashboard_summary` returns a large nested JSON aggregate; a naive mock may omit keys used by `pages/Dashboard.tsx` or `components/MobileHome.tsx`. | Low | Return contract in this decision lists every mandatory top-level and nested key, derived from both the canonical migration and the service-layer mapping. |
| 2 | `get_profit_report` has multiple optional filters and two compare modes (`prev` / `samePeriod`); an incomplete mock may not cover all call-site branches. | Low | Parameter contract documents all seven parameters, defaults, and compare-mode semantics. The handler must implement all filter paths and both comparison modes. |
| 3 | Canonical migration uses snake_case keys (`current_revenue`, `order_id`, `product_name`) while the production `ProfitReport` type and UI expect camelCase (`currentRevenue`, `orderId`, `productName`). | Medium | Return contract explicitly requires the handler to translate these keys to camelCase to match the call site. `groupedByDay` must also include `count` even though the migration does not select it. |
| 4 | Scope creep could introduce out-of-scope RPCs, cleanup, or refactoring. | Medium | Scope Boundary and Architecture Freeze explicitly prohibit additions. Verification must reject any change outside the two authorized RPCs and `tests/mocks/supabase.ts`. |
| 5 | A regression could remove or alter an existing handler. | Low | Additive-only requirement and the flat handler ordering ensure existing blocks are not touched. Verification must confirm the matched RPC count increases by exactly 2. |
| 6 | Working-tree changes remain uncommitted; final recovery state depends on future commit decisions. | Low | This decision does not alter git state. Commit and program closeout remain separate governance stages. |

---

## Recovery Objective

Wave-05 is intended to complete Recovery coverage.

If both authorized RPCs are implemented successfully and independently verified without regression, the expected verification target is:

**184 covered RPCs.**

Final completion of Phase 4 shall be determined only by:

- `RECOVERY_WAVE_05_VERIFICATION_REPORT.md`
- `RECOVERY_WAVE_05_ACCEPTANCE_REVIEW.md`

This decision does not claim that Phase 4 Recovery is complete. Completion is contingent on the independent verification and acceptance artifacts for Recovery Wave-05.

---

## Acceptance Criteria

This Architecture Decision is **PASS** only if all of the following are true:

1. Exactly **2 RPCs** are authorized.
2. Both RPCs belong only to **Domain H9 — Reports & Dashboard**.
3. Parameter contracts for both RPCs are documented with names, modes, defaults, and caller expectations.
4. Return contracts for both RPCs are documented with mandatory fields, nested structures, optional fields, and compatibility requirements.
5. No unauthorized scope, domain, RPC, store, helper, or production change is authorized.
6. No new in-memory stores are authorized; existing stores are reused.
7. No new helper functions are authorized; existing helpers are reused.
8. The Architecture Freeze is declared explicitly.
9. Implementation is deferred to Engineering Kickoff.
10. The recovery objective is stated in terms of verification targets and downstream governance artifacts only.

---

## Final Architecture Decision

**Architecture Decision: APPROVED.**

The architecture for Recovery Wave-05 is approved to proceed to Engineering Kickoff under the following conditions:

- The implementation scope is limited to exactly two RPCs in Domain H9: `get_dashboard_summary` and `get_profit_report`.
- All implementation is confined to additive handler blocks in `tests/mocks/supabase.ts`.
- Parameter names, default values, return shapes, and aggregate logic are derived from `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` and reconciled with the production call sites in `services/supabaseService.ts`, `pages/Dashboard.tsx`, `components/MobileHome.tsx`, and `pages/Reports.tsx`.
- Existing in-memory stores and helper functions are reused exclusively.
- No production code, migration, schema, generated type, package file, CI workflow, or governance artifact is modified.
- No new stores, helpers, abstractions, or scope expansion are authorized.
- Architecture is frozen; any change requires a new Authorization.

Engineering Kickoff may now be convened. Implementation, Verification, Acceptance Review, Program Status Review, and any final recovery summary remain separate, governed stages.

---

*This document completes the Architecture Decision stage for Recovery Wave-05. No source code, mock, migration, production file, generated type, package file, or CI workflow was modified to produce it.*
