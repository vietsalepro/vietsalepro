# CURRENT_TASK-024 — Engineering Kickoff

**Program:** VietSale Pro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3i — Domain H9 — Reports & Dashboard Mock Coverage  
**Document Type:** Engineering Readiness  
**Date:** 2026-07-15  
**Status:** Engineering Ready  

---

## Engineering Kickoff

This document confirms engineering readiness for CURRENT_TASK-024. It records architecture approval, scope, dependencies, canonical source, target files, engineering strategy, constraints, and validation gates. Implementation is not authorized at this stage and requires separate approval after this kickoff is accepted.

---

## Objective

Add mock coverage for the 2 uncovered Domain H9 — Reports & Dashboard RPCs in `tests/mocks/supabase.ts`, deriving each handler's return shape from the canonical migration chain. The task completes Milestone M5 — Commerce Complete (Wave 3i) and targets raising mock coverage from **~82.0% (150/183)** to approximately **~83.1% (152/183)**.

---

## Current Program Status

| Item | Value |
|---|---|
| Active phase | Phase 4 — Derived Validation Layer Realignment |
| Current milestone | M5 — Commerce Complete |
| Current wave | Wave 3h complete; Wave 3i ready |
| Current coverage | ~82.0% (150 / 183) |
| Uncovered RPCs | 33 |
| Most recent accepted task | CURRENT_TASK-023 — Domain H8: Disposals |
| Program health | HEALTHY — on track, no blockers |

Phase 4 exit criteria EC-3 (canonical audit gate alignment) and EC-4 (CI divergence gate) remain open as known residuals. EC-1 and EC-2 continue to progress with each coverage wave.

---

## Authorized Scope

### In Scope

- Add exactly 2 mock handlers to `tests/mocks/supabase.ts` for Domain H9 — Reports & Dashboard.
- Derive each mock's return shape and parameter contract from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern.
- Additive changes only; no refactor, redesign, or abstraction.
- No additional in-memory store state is required beyond the existing `orders`, `order_items`, `products`, `customers`, and `return_orders` / `return_order_items` tables already used by sibling report handlers.

### Out of Scope

- Production code changes (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migration, schema, or generated type modifications.
- Changes to `scripts/audit-rpc-contracts.ts`, CI workflows, or `package.json`.
- New governance artifacts, post-implementation artifacts, acceptance records, or CURRENT_TASK-025.
- Re-ordering, re-classifying, or expanding the Coverage Roadmap.

---

## Authorized RPCs

The following 2 RPCs are authorized for mock coverage. No additional RPCs may be added.

| # | RPC | Sub-group | Canonical Migration File | Canonical Line | RETURNS |
|---|---|---|---|---:|---|
| 1 | `get_dashboard_summary` | Dashboard Aggregates | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7090 | `json` |
| 2 | `get_profit_report` | Profit Report | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 8151 | `json` |

**Authorized RPC Count: 2 / 2**

### Canonical signatures

```sql
-- get_dashboard_summary
CREATE OR REPLACE FUNCTION "public"."get_dashboard_summary"(
  "p_from" "date" DEFAULT NULL::"date",
  "p_to" "date" DEFAULT NULL::"date"
) RETURNS json

-- get_profit_report
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

### Service call sites

Both RPCs are invoked from `services/supabaseService.ts`:

- `getDashboardSummary` calls `get_dashboard_summary` at line 777 with optional `p_from` / `p_to` and expects an object containing:
  - `revenueData: { date, revenue, profit, orders }[]`
  - `topProducts: { name, quantity, revenue }[]`
  - `inventoryValue: number`
  - `inventoryRetailValue: number`
  - `debtCustomers: Customer[]`
  - `topCustomers: (Customer & { orderCount: number })[]`
  - `totalDebt`, `totalCustomers`, `totalProducts`, `activeProducts`, `todayRevenue`, `todayOrders`, `todaySoldProducts`, `todayCustomers`, `yesterdayRevenue`

- `getProfitReport` calls `get_profit_report` at line 3827 with required `p_start_date` / `p_end_date` and optional filter parameters, expecting an object containing:
  - `summary: { totalRevenue, totalCost, profit, margin, prevRevenue, prevCost, prevProfit, profitChange }`
  - `dailyProfit: { date, currentRevenue, currentProfit, prevRevenue, prevProfit }[]`
  - `profitDetails: { date, orderId, productName, revenue, cost, profit, margin }[]`
  - `groupedByProduct`, `groupedByCustomer`, `groupedByDay`: `{ key, label, revenue, cost, profit, count }[]`

`services/supabaseService.ts` is a read-only call-site reference for this task and must not be modified.

---

## Dependency Verification

All prerequisite domains for Domain H9 are complete.

| Prerequisite Domain | Status | Evidence |
|---|---|---|
| Domain A — Auth, Identity & Security | Complete (M1) | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` |
| Domain H1 — Products & Catalog | Complete (Wave 3a) | `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` |
| Domain H5 — Customers | Complete (Wave 3b) | `CURRENT_TASK-017_ACCEPTANCE_RECORD.md` |
| Domain H6 — Suppliers | Complete (Wave 3c) | `CURRENT_TASK-018_ACCEPTANCE_RECORD.md` |
| Domain H2 — Inventory & Stock | Complete (Wave 3d) | `CURRENT_TASK-019_ACCEPTANCE_RECORD.md` |
| Domain H3 — Orders & Sales | Complete (Wave 3e) | `CURRENT_TASK-020_ACCEPTANCE_REVIEW.md` |
| Domain H4 — Returns & Exchanges | Complete (Wave 3f) | `CURRENT_TASK-021_ACCEPTANCE_REVIEW.md` |
| Domain H7 — Imports | Complete (Wave 3g) | `CURRENT_TASK-022_ACCEPTANCE_REVIEW_v2.md` |
| Domain H8 — Disposals | Complete (Wave 3h) | `CURRENT_TASK-023_ACCEPTANCE_REVIEW.md` |

Domain H9 depends on the commerce tables already represented in the mock store (`orders`, `order_items`, `products`, `customers`, `return_orders`, `return_order_items`). All prerequisite commerce sub-domains are satisfied; no additional store tables are required.

---

## Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | Canonical | `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1; `CURRENT_TASK-012`; `CURRENT_TASK-013` |

The canonical source for RPC names, parameter lists, and return shapes is the `CREATE [OR REPLACE] FUNCTION public.<name>` declaration for each authorized RPC in the forward migration chain. Engineering must not use derived documents, service call sites, or previous mock patterns as the contract authority.

### `get_dashboard_summary` return shape

Per the canonical migration (line 7090), the function returns a JSON object with the following keys:

```json
{
  "revenueData": [{ "date": "DD/MM", "revenue": 0, "profit": 0, "orders": 0 }],
  "topProducts": [{ "name": "...", "quantity": 0, "revenue": 0 }],
  "inventoryValue": 0,
  "inventoryRetailValue": 0,
  "debtCustomers": [...],
  "topCustomers": [{ /* customer fields */ "order_count": 0 }],
  "totalDebt": 0,
  "totalCustomers": 0,
  "totalProducts": 0,
  "activeProducts": 0,
  "todayRevenue": 0,
  "todayOrders": 0,
  "todaySoldProducts": 0,
  "todayCustomers": 0,
  "yesterdayRevenue": 0
}
```

`revenueData` is ordered by day descending. `topProducts` and `topCustomers` are limited to 10 rows. `inventoryValue` / `inventoryRetailValue` are scalar numbers. All numeric values should be coerced to numbers in the mock to match service-layer expectations.

### `get_profit_report` return shape

Per the canonical migration (line 8151), the function returns a JSON object with the following keys:

```json
{
  "summary": {
    "totalRevenue": 0,
    "totalCost": 0,
    "profit": 0,
    "margin": 0,
    "prevRevenue": 0,
    "prevCost": 0,
    "prevProfit": 0,
    "profitChange": 0
  },
  "dailyProfit": [{ "date": "DD/MM", "currentRevenue": 0, "currentProfit": 0, "prevRevenue": 0, "prevProfit": 0 }],
  "profitDetails": [{ "date": "DD/MM", "orderId": "...", "productName": "...", "revenue": 0, "cost": 0, "profit": 0, "margin": 0 }],
  "groupedByProduct": [{ "key": "...", "label": "...", "revenue": 0, "cost": 0, "profit": 0, "count": 0 }],
  "groupedByCustomer": [{ "key": "...", "label": "...", "revenue": 0, "cost": 0, "profit": 0, "count": 0 }],
  "groupedByDay": [{ "key": "...", "label": "...", "revenue": 0, "cost": 0, "profit": 0, "count": 0 }]
}
```

The mock handler should accept all 7 parameters, filter the in-memory `orders` / `order_items` / `products` / `return_orders` data accordingly, compute summary and grouping data at a fidelity sufficient for tests to exercise the service-layer call, and return zero-filled / empty arrays when no data matches. Comparison period logic (`prev` vs `samePeriod`) may be simulated minimally only if required by existing tests; otherwise, zero-filled comparison fields are sufficient for contract coverage.

---

## Target Files

| File | Purpose | Change Type |
|---|---|---|
| `tests/mocks/supabase.ts` | Add 2 Domain H9 mock handlers using existing commerce store tables | Additive only |
| `tests/**/*.test.ts` (optional) | Add or extend tests exercising the newly mocked report paths | Additive only |

---

## Engineering Strategy

1. **Canonical-first derivation.** For each authorized RPC, read the corresponding `CREATE [OR REPLACE] FUNCTION` declaration in `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` and match the mock return type and shape to the declared `RETURNS` clause.
2. **Preserve dispatch pattern.** Add each handler using the existing `if (name === "...")` chain in `tests/mocks/supabase.ts`. Do not introduce Map-based dispatch, shared helpers, or new abstractions.
3. **Additive implementation.** Only add code; do not refactor existing handlers, reorder the dispatch chain, or change existing return shapes.
4. **Reuse existing store.** Dashboard and profit reports read only from existing in-memory tables (`orders`, `order_items`, `products`, `customers`, `return_orders`, `return_order_items`). Do not add new store tables.
5. **No production code changes.** If a mock shape reveals a service-layer mismatch, escalate rather than modify `services/supabaseService.ts` or any other production file.

---

## Implementation Constraints

- **Architecture:** Keep the existing `if (name === "...")` dispatch pattern unchanged.
- **Scope:** Implement exactly the 2 authorized RPCs; no more, no less.
- **Refactor:** None. No redesign, no abstraction, no extraction of shared helpers.
- **Dependencies:** No new dependencies. Use only what is already present in the codebase.
- **Canonical fidelity:** Return shapes and parameter handling must follow the canonical migration chain, not behavioral assumptions from the service call site.
- **Regressions:** Existing tests must continue to pass; no changes may reduce coverage or break the audit gate.

---

## Validation Plan

The following gates must pass after implementation:

1. **Audit gate:** `npx tsx scripts/audit-rpc-contracts.ts`
   - Exit 0
   - 125 / 125 RPC contracts in sync
   - 0 stale mock
   - 0 duplicate handler

2. **Type gate:** `npx tsc --noEmit`
   - Exit 0, no TypeScript errors

3. **Test gate:** `npx vitest run`
   - Exit 0
   - No regression
   - Existing test count must not decrease

---

## Expected Coverage

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Covered RPCs | 150 | 152 | +2 |
| Uncovered RPCs | 33 | 31 | −2 |
| Coverage | ~82.0% | ~83.1% | +1.1 pp |

---

## Engineering Readiness Summary

- **Architecture Decision:** APPROVED
- **Current Task:** CURRENT_TASK-024
- **Domain:** H9 — Reports & Dashboard
- **Wave:** Wave 3i
- **Implementation:** NOT AUTHORIZED
- **Program Phase:** UNCHANGED — remains Phase 4
- **Roadmap:** UNCHANGED — `PHASE4_COVERAGE_ROADMAP.md` remains authoritative
- **Architecture:** UNCHANGED — canonical migration-first principle and existing dispatch pattern preserved

---

## Status

**Engineering Ready.** Implementation of CURRENT_TASK-024 is NOT authorized until formal approval is granted.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_023.md`, `CURRENT_TASK-024_PROGRAM_AUTHORIZATION.md`, `CURRENT_TASK-024_ARCHITECTURE_DECISION.md`, `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`, `services/supabaseService.ts`, `tests/mocks/supabase.ts`.*
