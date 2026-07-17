# RECOVERY_WAVE_05_IMPLEMENTATION_REPORT

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Wave:** Recovery Wave-05  
**Domain:** H9 — Reports & Dashboard  
**Date:** 2026-07-16  
**Status:** Implementation Complete

---

## 1. Executive Summary

Recovery Wave-05 implemented the final two authorized mock handlers for the Phase 4 recovery program:

- `get_dashboard_summary`
- `get_profit_report`

Both handlers were added to `tests/mocks/supabase.ts` only, using the existing flat `if (name === '...')` dispatch pattern, reusing only the existing in-memory stores and helper functions approved by `RECOVERY_WAVE_05_ARCHITECTURE_DECISION.md`. No production code, migrations, schema, generated types, packages, CI, or governance documents were modified.

All required validation gates pass:

- Canonical audit gate: PASS
- Type gate: PASS
- Test gate: PASS

Coverage measurement is intentionally deferred to the independent `RECOVERY_WAVE_05_VERIFICATION_REPORT.md` stage.

---

## 2. Authorized Scope

| Source | Authorization |
|---|---|
| `RECOVERY_WAVE_05_AUTHORIZATION.md` | Exactly 2 RPCs in Domain H9 |
| `RECOVERY_WAVE_05_ARCHITECTURE_DECISION.md` | Handler shapes, parameters, return contracts, and store/helper strategy |
| `RECOVERY_WAVE_05_ENGINEERING_KICKOFF.md` | Insertion point and validation plan |

Authorized RPC inventory:

| # | Domain | RPC | Canonical Migration | Production Call Site |
|---|---|---|---|---|
| 1 | H9 — Reports & Dashboard | `get_dashboard_summary` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:7090` | `services/supabaseService.ts:777` |
| 2 | H9 — Reports & Dashboard | `get_profit_report` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:8151` | `services/supabaseService.ts:3827` |

---

## 3. Files Modified

| File | Change |
|---|---|
| `tests/mocks/supabase.ts` | Added two additive mock handler blocks for `get_dashboard_summary` and `get_profit_report` immediately after `// ========== End Domain H8 ==========` and before the final `PGRST116` fallback |

No other files were changed by this implementation.

---

## 4. RPCs Implemented

### 4.1 `get_dashboard_summary`

- Reads `orders`, `order_items`, `products`, and `customers`.
- Returns all mandatory top-level fields:
  - `revenueData`
  - `topProducts`
  - `inventoryValue`
  - `inventoryRetailValue`
  - `debtCustomers`
  - `topCustomers`
  - `totalDebt`
  - `totalCustomers`
  - `totalProducts`
  - `activeProducts`
  - `todayRevenue`
  - `todayOrders`
  - `todaySoldProducts`
  - `todayCustomers`
  - `yesterdayRevenue`
- `debtCustomers` and `topCustomers` contain raw snake_case customer rows compatible with `mapCustomerFromDB`.
- `topCustomers` includes the extra `order_count` key mapped by the service to `orderCount`.
- All numeric values are returned as JavaScript `number` values.

### 4.2 `get_profit_report`

- Reads `orders`, `order_items`, `products`, `return_orders`, and `return_order_items`.
- Implements all seven parameters with documented defaults:
  - `p_start_date`, `p_end_date`
  - `p_status` default `'all'`
  - `p_payment_method` default `''`
  - `p_product_keyword` default `''`
  - `p_customer_keyword` default `''`
  - `p_compare_mode` default `'prev'`
- Supports both comparison modes:
  - `prev` — immediately preceding period of equal length
  - `samePeriod` — same calendar dates in the prior year
- Returns all mandatory top-level fields:
  - `summary`
  - `dailyProfit`
  - `profitDetails`
  - `groupedByProduct`
  - `groupedByCustomer`
  - `groupedByDay`
- Translates canonical snake_case keys to camelCase where required by production code:
  - `dailyProfit`: `current_revenue` → `currentRevenue`, `current_profit` → `currentProfit`, `prev_revenue` → `prevRevenue`, `prev_profit` → `prevProfit`
  - `profitDetails`: `order_id` → `orderId`, `product_name` → `productName`
- Adds `count` to `groupedByDay` as required by the `ProfitReport` type even though the canonical migration does not select it.

---

## 5. Store Usage

No new stores were added. Only the six existing stores approved by the Architecture Decision were read:

| Store | Used By | Purpose |
|---|---|---|
| `orders` | `get_dashboard_summary`, `get_profit_report` | Order dates, status, payment method, customer names, totals, returned amounts |
| `order_items` | `get_dashboard_summary`, `get_profit_report` | Product quantities, names, prices, per-line cost |
| `products` | `get_dashboard_summary`, `get_profit_report` | Current cost/price/quantity for inventory valuation and cost fallback |
| `customers` | `get_dashboard_summary` | `debtCustomers`, `topCustomers`, `totalDebt`, `totalCustomers` |
| `return_orders` | `get_profit_report` | Non-cancelled return headers used to adjust net quantities |
| `return_order_items` | `get_profit_report` | Returned quantities per original order/product |

---

## 6. Helper Usage

No new helper functions were added. Only existing utilities and inline patterns were reused:

| Helper / Pattern | Source | Usage |
|---|---|---|
| `addDays(dateStr, days)` | Top-level in `tests/mocks/supabase.ts` | Compute `yesterday` for dashboard; compute `prev` comparison period |
| `addMonths(dateStr, months)` | Top-level in `tests/mocks/supabase.ts` | Compute `samePeriod` comparison period (prior year) |
| `Number(...)` coercion | Existing report handler pattern | Ensure all numeric outputs are numbers |
| Inline `toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' })` | Existing `filter_disposals_rpc` / import report pattern | Convert timestamps to Vietnam-local `YYYY-MM-DD` for date filtering and `DD/MM` grouping |
| Inline aggregation maps | Existing `get_sales_report`, `get_customer_report` | Group-by-product, group-by-customer, group-by-day, and summary rollups |

---

## 7. Validation Results

| Gate | Command | Result | Details |
|---|---|---|---|
| Canonical audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | **PASS** | Exit 0. Migration RPCs: 300, Code RPCs: 183, 0 code RPCs missing from migrations |
| Type gate | `npx tsc --noEmit` | **PASS** | Exit 0, no TypeScript errors or regressions |
| Test gate | `npx vitest run` | **PASS** | Exit 0. 68 test files passed, 389 tests passed, 0 failures |
| Handler inventory check | `grep` for `if (name === 'get_dashboard_summary')` and `if (name === 'get_profit_report')` | **PASS** | Exactly 2 new handler entry points in `tests/mocks/supabase.ts` |
| Store boundary check | Visual / `grep` inspection of `const store` | **PASS** | No new store keys added |
| Helper boundary check | Visual inspection of top-level declarations | **PASS** | No new top-level helper functions added |

Coverage measurement is intentionally deferred to `RECOVERY_WAVE_05_VERIFICATION_REPORT.md`.

---

## 8. Scope Compliance Review

| Criterion | Required | Verified | Result |
|---|---|---|---|
| Total authorized RPCs implemented | 2 | 2 | PASS |
| Both RPCs belong to Domain H9 | Yes | Yes | PASS |
| No unauthorized RPC implemented | Yes | Yes — no other handler block added | PASS |
| No H9 scope expansion | Yes | Yes | PASS |
| No Domain F implementation | Yes | Yes — no notification store or Domain F RPC used | PASS |
| Only `tests/mocks/supabase.ts` modified by this implementation | Yes | Yes — new code confined to the two handler blocks | PASS |
| No new stores added | Yes | Yes — only the 6 approved stores read | PASS |
| No new helpers added | Yes | Yes — only inline code and existing `addDays`/`addMonths` | PASS |
| Additive-only changes | Yes | Yes — no existing handler removed, relocated, or modified | PASS |
| Existing handler order preserved | Yes | Yes — H9 blocks inserted after `// ========== End Domain H8 ==========` and before the fallback | PASS |
| No cleanup / refactoring / optimization performed | Yes | Yes | PASS |

**Git status observation:** `git diff --name-only` reports two modified files in the working tree:

- `tests/mocks/supabase.ts` — changed by this implementation.
- `scripts/audit-rpc-contracts.ts` — pre-existing working-tree change from prior program activity; not touched by Wave-05.

In addition, many governance documents appear as untracked files from prior recovery tasks; only `RECOVERY_WAVE_05_IMPLEMENTATION_REPORT.md` is produced by this implementation.

---

## 9. Known Limitations

1. **Coverage is intentionally not measured here.** Final RPC coverage must be determined by `RECOVERY_WAVE_05_VERIFICATION_REPORT.md`.
2. **Date grouping uses `DD/MM` strings** as the canonical migration does, which means chronological ordering within a multi-month range may not be strictly calendar-ordered.
3. **Time zone handling uses `toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' })`** as an approximation of the canonical `AT TIME ZONE 'Asia/Ho_Chi_Minh'` PostgreSQL behavior.
4. **`groupedByDay.count`** is injected for UI/type compatibility; the canonical migration does not select this field.
5. **Same-period comparison** for `samePeriod` uses `addMonths(..., -12)`, which matches the canonical `INTERVAL '1 year'` semantics for mock purposes.

---

## 10. Final Implementation Decision

Recovery Wave-05 implementation is **complete** and **PASS** for the implementation stage.

- Exactly 2 authorized H9 RPC mock handlers were implemented.
- Only `tests/mocks/supabase.ts` was modified.
- No new stores, helpers, or abstractions were introduced.
- All validation gates (audit, type, test) pass.
- Coverage measurement, independent verification, and acceptance review are explicitly deferred to the next governance stages as required.

The next approved stage is **Independent Verification** (`RECOVERY_WAVE_05_VERIFICATION_REPORT.md`).
