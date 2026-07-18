# CURRENT_TASK-017 — Engineering Kickoff

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3b — Domain H5 — Customers Mock Coverage  
**Document Type:** Engineering Kickoff  
**Date:** 2026-07-15  
**Status:** Engineering Ready — Awaiting Implementation Authorization  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-017_ARCHITECTURE_DECISION.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_M3.md`, `CURRENT_TASK-016_ACCEPTANCE_RECORD.md`, `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`, `tests/mocks/supabase.ts`

---

> **No implementation. No code change. No migration. No schema change. No generated type. No mock RPC written by this document.**
>
> This document is an Engineering Kickoff deliverable only. It confirms the engineering team understands the approved architecture and is ready to implement CURRENT_TASK-017 once Program Manager authorizes implementation.

---

## 1. Architecture

### 1.1 Understood

The approved architecture for CURRENT_TASK-017 is understood by Engineering:

- Extend `tests/mocks/supabase.ts` with **6 additive handler blocks** for Domain H5 — Customers.
- Each handler follows the existing `if (name === '...')` dispatch pattern already used by the 106 prior handlers.
- Each handler's return shape is derived directly from the canonical migration chain, specifically `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`.
- No production code, migrations, schema, generated types, audit script, CI, or `package.json` is modified.
- No new file, no new abstraction, no Map/switch/registry dispatch, no new dependency.

### 1.2 Source of Truth

| Artifact | Path | Role |
|---|---|---|
| Canonical migration chain | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | **Canonical source** for all 6 H5 RPC definitions |
| Mock implementation | `tests/mocks/supabase.ts` | Additive handler blocks only |
| Service call-sites | `services/supabaseService.ts` | Read-only reference for inventory |

---

## 2. Scope Validation

### 2.1 In Scope

| Sub-group | RPCs | Service Call-site |
|---|---|---|
| Customer Lookup & Filter | `search_customers_rpc` | `services/supabaseService.ts:577-615` |
| Customer Lookup & Filter | `filter_customers_rpc` | `services/supabaseService.ts:645-725` |
| Customer Aggregates | `get_customer_stats` | `services/supabaseService.ts:813-820` |
| Customer Aggregates | `get_customer_report` | `services/supabaseService.ts:3941-3958` |
| Customer Debt | `get_customer_debt_ledger` | `services/supabaseService.ts:1517-1560` |
| Customer Debt | `adjust_customer_debt` | `services/supabaseService.ts:1436-1471` |

**Count: 6 unique RPCs.** All 6 are called exclusively from `services/supabaseService.ts`.

### 2.2 Permitted Files

- `tests/mocks/supabase.ts` — add 6 handler blocks.
- `tests/**` — optional test files that exercise newly-mocked customer paths.

### 2.3 Out of Scope (Frozen)

- Production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migrations (`supabase/migrations/*.sql`).
- Schema artifact (`supabase/schema.sql`).
- Generated types (`supabase/generated/database.types.ts`).
- Audit script (`scripts/audit-rpc-contracts.ts`).
- CI workflow and `package.json`.
- Any domain other than H5.

### 2.4 Scope Compliance Confirmation

Engineering confirms the implementation will be strictly additive, touching only `tests/mocks/supabase.ts` and optional `tests/**` test files.

---

## 3. Inventory

Engineering has independently verified all 6 RPCs against the canonical migration chain.

| # | RPC | Service Call-site | Migration File | Migration Line | Canonical RETURNS | Complexity |
|---|---|---|---|---|---|---|
| 1 | `search_customers_rpc` | `services/supabaseService.ts:581` | `20250703000000_baseline_pre_tenant_schema.sql` | 11884 | `SETOF public.customers` | Simple |
| 2 | `filter_customers_rpc` | `services/supabaseService.ts:659` | `20250703000000_baseline_pre_tenant_schema.sql` | 6027 | `JSON` | Simple |
| 3 | `get_customer_stats` | `services/supabaseService.ts:814` | `20250703000000_baseline_pre_tenant_schema.sql` | 7062 | `JSON` | Simple |
| 4 | `get_customer_report` | `services/supabaseService.ts:3942` | `20250703000000_baseline_pre_tenant_schema.sql` | 7005 | `JSON` | Simple |
| 5 | `get_customer_debt_ledger` | `services/supabaseService.ts:1533` | `20250703000000_baseline_pre_tenant_schema.sql` | 6990 | `JSON` | Simple |
| 6 | `adjust_customer_debt` | `services/supabaseService.ts:1447` | `20250703000000_baseline_pre_tenant_schema.sql` | 1611 | `JSONB` | Simple |

**Inventory totals:** 6 / 6 RPCs identified and traced.

---

## 4. Canonical Traceability

For each RPC, Engineering confirms the canonical `CREATE FUNCTION`, `RETURNS` clause, parameter list, and mock strategy.

### 4.1 `search_customers_rpc`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."search_customers_rpc"("search_term" "text") RETURNS SETOF "public"."customers"` |
| Parameters | `search_term text` |
| Service params | `{ search_term: string }` |
| Canonical behavior | `SELECT * FROM customers WHERE f_unaccent(name) ILIKE ... OR phone ILIKE ... OR f_unaccent(code) ILIKE ... ORDER BY name ASC LIMIT 500` |
| Mock strategy | Filter `store.customers` by case-insensitive substring on `name`, `phone`, `code`; sort by `name` ascending; limit 500. Return array of full customer rows. |

### 4.2 `filter_customers_rpc`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."filter_customers_rpc"("p_search_term" "text" DEFAULT NULL, "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'created_at', "p_sort_order" "text" DEFAULT 'desc', "p_min_points" integer DEFAULT NULL, "p_max_points" integer DEFAULT NULL, "p_has_debt" "text" DEFAULT NULL) RETURNS json` |
| Parameters | `p_search_term`, `p_page`, `p_page_size`, `p_sort_by`, `p_sort_order`, `p_min_points`, `p_max_points`, `p_has_debt` |
| Service params | `{ p_search_term, p_page, p_page_size, p_sort_by, p_sort_order, p_min_points, p_max_points, p_has_debt }` |
| Canonical behavior | Returns `json_build_object('customers', v_result, 'totalCount', v_total)` with paginated/filtered/sorted customer rows. |
| Mock strategy | Apply search, points range, debt boolean (`'true'`/`'false'`), and sort (`name`, `points`, `debt`, `spent`, `created_at`) to `store.customers`; return `{ customers, totalCount }`. |

### 4.3 `get_customer_stats`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."get_customer_stats"() RETURNS json` |
| Parameters | None |
| Service params | `{}` |
| Canonical behavior | Returns `json_build_object('total', ..., 'vip', ..., 'debt', ..., 'totalSpent', ...)` aggregated from `customers`. |
| Mock strategy | Aggregate `store.customers` into `{ total, vip, debt, totalSpent }` matching canonical keys. |

### 4.4 `get_customer_report`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."get_customer_report"("p_start_date" "date", "p_end_date" "date") RETURNS json` |
| Parameters | `p_start_date date`, `p_end_date date` |
| Service params | `{ p_start_date, p_end_date }` |
| Canonical behavior | Returns `json_build_object('summary', ..., 'topCustomers', ..., 'customerGrowth', ...)` with new-customer counts in date range and top customers by `total_spent`. |
| Mock strategy | Compute summary aggregates, top customers (joined with `store.orders`), and daily new-customer growth from `store.customers`; return canonical JSON shape. |

### 4.5 `get_customer_debt_ledger`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."get_customer_debt_ledger"("p_customer_id" "text", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS json` |
| Parameters | `p_customer_id text`, `p_limit integer` (default 100), `p_offset integer` (default 0) |
| Service params | `{ p_customer_id, p_limit, p_offset }` |
| Canonical behavior | Returns `json_build_object('customer_id', ..., 'current_balance', ..., 'total_entries', ..., 'entries', ...)` from `customer_payment_ledger` ordered `created_at DESC, id DESC`. |
| Mock strategy | Filter `store.customer_payment_ledger` by `customer_id`; compute `current_balance` as sum of amounts; paginate and return canonical JSON shape. |

### 4.6 `adjust_customer_debt`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."adjust_customer_debt"("p_customer_id" "text", "p_amount" numeric, "p_reason" "text") RETURNS jsonb` |
| Parameters | `p_customer_id text`, `p_amount numeric`, `p_reason text` |
| Service params | `{ p_customer_id, p_amount, p_reason }` |
| Canonical behavior | Validates inputs, updates `customers.debt`, inserts `customer_payment_ledger` entry via `insert_customer_ledger_entry`, returns `jsonb_build_object('ok', true, 'customer_id', ..., 'adjustment_amount', ..., 'new_customer_debt', ..., 'ledger_balance_after', ..., 'reason', ...)`. |
| Mock strategy | Locate customer in `store.customers`; update `debt = GREATEST(0, debt + amount)`; append ledger row to `store.customer_payment_ledger`; return canonical JSONB shape. Input validation can be delegated to the canonical function in production; the mock focuses on deterministic return shape and store mutation. |

**Traceability status:** Ready — 6 / 6 RPCs traced to canonical source.

---

## 5. Shared Helpers

Engineering has evaluated existing helpers in `tests/mocks/supabase.ts` for reuse. No new abstraction will be created.

| Helper / Pattern | Reuse for H5 | Notes |
|---|---|---|
| `store` object + `executeQuery` | Partial | The mock uses `store[table]` for table queries. `customers` and `customer_payment_ledger` arrays must be added to the `store` initializer because they are currently absent, even though `executeQuery` falls back to `[]`. Adding them makes mutation by `adjust_customer_debt` deterministic and explicit. |
| `uuid()` | Yes | Use for any ledger row `id` if needed (canonical `customer_payment_ledger.id` is `bigint`, but mock rows can use generated string ids consistent with other mock tables). |
| `requireTenantId()` / tenant context | No direct use | Customer handlers operate on `store.customers` filtered implicitly by existing test setup; no new tenant logic needed. |
| Inline `if (name === '...')` dispatch | Yes | Reuse verbatim. Six new blocks inserted before the fallback `return { data: null, error: ... }`. |
| Local `buildProductRow` pattern | Mirror | Introduce a local `buildCustomerRow` inside `rpc()` only if it reduces duplication between `search_customers_rpc` and `filter_customers_rpc`. This mirrors `CURRENT_TASK-016`'s `buildProductRow` helper and is scoped to the function; no module-level abstraction. |

**Helper decision:**
- Add `customers: []` and `customer_payment_ledger: []` to the `store` initializer.
- Optionally define a local `buildCustomerRow` inside the `rpc` function to keep `search_customers_rpc` and `filter_customers_rpc` consistent; delete if not needed after drafting.
- Reuse `uuid()` for ledger entry creation.

**No new file. No new module. No Map/switch/registry.**

---

## 6. Dispatch Strategy

Engineering confirms the implementation will continue using the existing dispatch pattern:

```ts
if (name === 'search_customers_rpc') { ... }
if (name === 'filter_customers_rpc') { ... }
if (name === 'get_customer_stats') { ... }
if (name === 'get_customer_report') { ... }
if (name === 'get_customer_debt_ledger') { ... }
if (name === 'adjust_customer_debt') { ... }
```

**Explicitly rejected alternatives:**
- `Map<string, Function>`
- `switch (name)`
- Registry / factory pattern
- Any other dispatch abstraction

The audit script `scripts/audit-rpc-contracts.ts` extracts handler names by matching `if (name === '...')`. Changing the dispatch pattern would break the audit gate accepted in CURRENT_TASK-013.

---

## 7. Coverage

| Metric | Before | After |
|---|---|---|
| Covered RPCs | 105 / 183 | 111 / 183 |
| Coverage | 57.4% | 60.7% |
| Uncovered RPCs | 78 | 72 |
| Delta | — | +6 RPCs, +3.3 percentage points |

Engineering confirms the coverage calculation:
- `111 / 183 = 0.6065...` → rounded to one decimal place = **60.7%**.
- The audit gate reports coverage informationally; the target milestone line is `60.7%`.

---

## 8. Risk

### 8.1 Technical Risk

| Risk | Level | Mitigation |
|---|---|---|
| `search_customers_rpc` returns `SETOF customers`; mock must return full row shape used by `mapCustomerFromDB`. | Low | Return all columns from `store.customers` rows; service layer maps them via `mapCustomerFromDB`. |
| `filter_customers_rpc` sort logic has 4 sort columns × 2 orders + `created_at` fallback; mock must reproduce canonical ordering for tests. | Low | Implement the same `CASE`-style sort in JavaScript for the supported `sortBy` values; default to `created_at` desc. |
| `adjust_customer_debt` mutates store; if `customers` array is not initialized, mutation is lost between calls. | Low | Add `customers: []` and `customer_payment_ledger: []` to the `store` initializer in `resetMockData`. |
| `get_customer_report` joins `customers` and `orders`; mock must count orders per customer. | Low | Use `store.orders` already present and filter by `customer_id`. |

### 8.2 Regression Risk

| Risk | Level | Mitigation |
|---|---|---|
| Modifying `store` initializer could affect unrelated tests if keys are iterated. | Low | The initializer is a plain object; adding keys does not change iteration over existing keys. `resetMockData` loops `Object.keys(store)` and resets each to `[]`; new keys follow the same pattern. |
| Inserting 6 new handlers before the fallback could shift line numbers but does not change behavior. | None | Existing handlers are not modified; fallback remains the last `return`. |
| TypeScript errors if mock return shapes do not satisfy service casts. | Low | Run `npx tsc --noEmit`; service code casts `data as {...}`, so shape mismatches surface as runtime test failures, not compile errors. Tests will exercise the paths. |

### 8.3 Contract Risk

| Risk | Level | Mitigation |
|---|---|---|
| Mock return keys drift from canonical migration keys. | Low | Traceability table maps every canonical `json_build_object` / `jsonb_build_object` key to the mock return object. Implementation report will re-verify. |
| `adjust_customer_debt` validation exceptions differ from canonical behavior. | Low | Mock focuses on happy-path shape; canonical validation is exercised in integration tests, not unit mocks. The service only checks for `error` presence and propagates it. |
| Audit gate stale-mock / duplicate-handler fail. | Low | Only canonical RPC names are mocked; each name gets exactly one `if (name === '...')` block. |

**Overall risk:** Low.

---

## 9. Validation Plan

Engineering commits to the following validation after implementation:

| # | Gate | Command | Expected Result |
|---|---|---|---|
| 1 | Canonical audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0; no code RPC missing from migrations; no stale mock; no duplicate handlers; coverage line = 60.7%. |
| 2 | Type gate | `npx tsc --noEmit` | Exit 0. |
| 3 | Test gate | `npx vitest run` | No regression vs CURRENT_TASK-016 baseline (68 files, 389 tests, all PASS). |
| 4 | Coverage | Reported by gate #1 | **60.7%** (111/183 covered). |
| 5 | Regression | Gates #1–#3 + git diff review | None outside `tests/mocks/supabase.ts` and optional `tests/**`. |

**Definition of Done for Engineering:**
1. Six additive `if (name === '...')` handler blocks added to `tests/mocks/supabase.ts`.
2. `store` initializer extended with `customers` and `customer_payment_ledger`.
3. All gates above pass.
4. Coverage reaches **60.7%**.
5. No production, migration, schema, type, audit, CI, or `package.json` changes.

---

## 10. Final Engineering Kickoff Block

```text
ENGINEERING KICKOFF

Architecture

Understood

Scope

Validated

Inventory

6 / 6

Traceability

Ready

Shared Helpers

Validated

Implementation Strategy

Approved

Expected Coverage

57.4%

↓

60.7%

Decision

READY FOR IMPLEMENTATION

Status

Engineering Ready

Next Step

CURRENT_TASK-017

Implementation
```

---

*Engineering confirms readiness to implement CURRENT_TASK-017 upon Program Manager authorization. No code changes have been made by this document.*
