# CURRENT_TASK-018 — Engineering Kickoff

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3c — Domain H6 — Suppliers Mock Coverage  
**Document Type:** Engineering Kickoff  
**Date:** 2026-07-15  
**Status:** Engineering Ready — Awaiting Implementation Authorization  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-018_ARCHITECTURE_DECISION.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_017.md`, `CURRENT_TASK-017_ACCEPTANCE_RECORD.md`, `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`, `tests/mocks/supabase.ts`, `services/supabaseService.ts`

---

> **No implementation. No code change. No migration. No schema change. No generated type. No mock RPC written by this document.**
>
> This document is an Engineering Kickoff deliverable only. It confirms the engineering team understands the approved architecture and is ready to implement CURRENT_TASK-018 once Program Manager authorizes implementation.

---

## 1. Architecture

### 1.1 Understood

The approved architecture for CURRENT_TASK-018 is understood by Engineering:

- Extend `tests/mocks/supabase.ts` with **7 additive handler blocks** for Domain H6 — Suppliers.
- Each handler follows the existing `if (name === '...')` dispatch pattern already used by the 111+ prior handlers.
- Each handler's return shape is derived directly from the canonical migration chain, specifically `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`.
- No production code, migrations, schema, generated types, audit script, CI, or `package.json` is modified.
- No new file, no new abstraction, no Map/switch/registry dispatch, no new dependency.

### 1.2 Source of Truth

| Artifact | Path | Role |
|---|---|---|
| Canonical migration chain | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | **Canonical source** for all 7 H6 RPC definitions |
| Mock implementation | `tests/mocks/supabase.ts` | Additive handler blocks only |
| Service call-sites | `services/supabaseService.ts` | Read-only reference for inventory |

---

## 2. Scope Validation

### 2.1 In Scope

| Sub-group | RPCs | Service Call-site |
|---|---|---|
| Supplier Lookup & Filter | `search_suppliers_rpc` | `services/supabaseService.ts:870-877` |
| Supplier Lookup & Filter | `filter_suppliers_rpc` | `services/supabaseService.ts:879-898` |
| Supplier Aggregates | `get_supplier_stats` | `services/supabaseService.ts:1697-1706` |
| Supplier Aggregates | `get_supplier_report` | `services/supabaseService.ts:3960-3977` |
| Supplier Debt | `get_supplier_debt_ledger` | `services/supabaseService.ts:1567-1609` |
| Supplier Debt | `adjust_supplier_debt` | `services/supabaseService.ts:1478-1510` |
| Supplier Debt | `pay_supplier_debt` | `services/supabaseService.ts:1393-1432` |

**Count: 7 unique RPCs.** All 7 are called exclusively from `services/supabaseService.ts`.

### 2.2 Permitted Files

- `tests/mocks/supabase.ts` — add 7 handler blocks and any required store entries.
- `tests/**` — optional test files that exercise newly-mocked supplier paths.

### 2.3 Out of Scope (Frozen)

- Production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migrations (`supabase/migrations/*.sql`).
- Schema artifact (`supabase/schema.sql`).
- Generated types (`supabase/generated/database.types.ts`).
- Audit script (`scripts/audit-rpc-contracts.ts`).
- CI workflow and `package.json`.
- Any domain other than H6.

### 2.4 Scope Compliance Confirmation

Engineering confirms the implementation will be strictly additive, touching only `tests/mocks/supabase.ts` and optional `tests/**` test files.

---

## 3. Inventory

Engineering has independently verified all 7 RPCs against the canonical migration chain.

| # | RPC | Service Call-site | Migration File | Migration Line | Canonical RETURNS | Complexity |
|---|---|---|---|---|---|---|
| 1 | `search_suppliers_rpc` | `services/supabaseService.ts:870` | `20250703000000_baseline_pre_tenant_schema.sql` | 11969 | `SETOF public.suppliers` | Simple |
| 2 | `filter_suppliers_rpc` | `services/supabaseService.ts:879` | `20250703000000_baseline_pre_tenant_schema.sql` | 6367 | `json` | Simple |
| 3 | `get_supplier_stats` | `services/supabaseService.ts:1697` | `20250703000000_baseline_pre_tenant_schema.sql` | 9015 | `json` | Simple |
| 4 | `get_supplier_report` | `services/supabaseService.ts:3960` | `20250703000000_baseline_pre_tenant_schema.sql` | 8950 | `json` | Simple |
| 5 | `get_supplier_debt_ledger` | `services/supabaseService.ts:1567` | `20250703000000_baseline_pre_tenant_schema.sql` | 8927 | `json` | Simple |
| 6 | `adjust_supplier_debt` | `services/supabaseService.ts:1478` | `20250703000000_baseline_pre_tenant_schema.sql` | 1633 | `jsonb` | Simple |
| 7 | `pay_supplier_debt` | `services/supabaseService.ts:1393` | `20250703000000_baseline_pre_tenant_schema.sql` | 10320 | `jsonb` | Simple |

**Inventory totals:** 7 / 7 RPCs identified and traced.

---

## 4. Canonical Traceability

For each RPC, Engineering confirms the canonical `CREATE FUNCTION`, `RETURNS` clause, parameter list, and mock strategy.

### 4.1 `search_suppliers_rpc`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."search_suppliers_rpc"("p_search_term" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 100) RETURNS SETOF "public"."suppliers"` |
| Parameters | `p_search_term text` (default `NULL`), `p_limit integer` (default `100`) |
| Service params | `{ p_search_term: string \| null, p_limit: number }` |
| Canonical behavior | `SELECT * FROM suppliers` filtered by unaccented `name`, `code`, or `phone` matching the search term; ordered by `name ASC`; limited by `p_limit`. |
| Mock strategy | Filter `store.suppliers` with a case-insensitive substring match on `name`, `code`, and `phone` (using the same unaccent normalization as other search handlers); sort by `name` ascending; slice to `p_limit`. Return full supplier row objects. |

### 4.2 `filter_suppliers_rpc`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."filter_suppliers_rpc"("p_search_term" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'name'::"text", "p_sort_order" "text" DEFAULT 'asc'::"text") RETURNS json` |
| Parameters | `p_search_term`, `p_page`, `p_page_size`, `p_sort_by`, `p_sort_order` |
| Service params | `{ p_search_term, p_page, p_page_size, p_sort_by, p_sort_order }` |
| Canonical behavior | Returns `json_build_object('suppliers', v_result, 'totalCount', v_total)` with paginated, filtered, and sorted supplier rows. Supports sorting by `name` and `debt`, defaulting to `name ASC`. |
| Mock strategy | Filter `store.suppliers` by `name`/`code`/`phone`; sort by `name` or `debt` in the requested direction (default `name ASC`); paginate with `(p_page - 1) * p_page_size`; return `{ suppliers, totalCount }`. |

### 4.3 `get_supplier_stats`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."get_supplier_stats"() RETURNS json` |
| Parameters | None |
| Service params | `{}` |
| Canonical behavior | Aggregates over `suppliers` and returns `json_build_object('total', ..., 'withPhone', ..., 'withDebt', ..., 'totalDebt', ...)`. |
| Mock strategy | Compute aggregates from `store.suppliers` and return `{ total, withPhone, withDebt, totalDebt }`. |

### 4.4 `get_supplier_report`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."get_supplier_report"("p_start_date" "date", "p_end_date" "date") RETURNS json` |
| Parameters | `p_start_date date`, `p_end_date date` |
| Service params | `{ p_start_date, p_end_date }` |
| Canonical behavior | Returns `json_build_object('summary', ..., 'topSuppliers', ..., 'supplierGrowth', ..., 'importBySupplier', ...)`. Summary includes total supplier count, total debt, total paid from completed `import_receipts`, and total import value in the date range. `topSuppliers` is ordered by import value DESC. |
| Mock strategy | Aggregate from `store.suppliers` and `store.import_receipts`; compute summary, top suppliers, daily new-supplier growth in `DD/MM` format, and import-by-supplier totals; return the canonical JSON shape. |

### 4.5 `get_supplier_debt_ledger`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."get_supplier_debt_ledger"("p_supplier_id" "text", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS json` |
| Parameters | `p_supplier_id text`, `p_limit integer` (default `100`), `p_offset integer` (default `0`) |
| Service params | `{ p_supplier_id, p_limit, p_offset }` |
| Canonical behavior | Returns `json_build_object('supplier_id', ..., 'current_balance', ..., 'total_entries', ..., 'entries', ...)` from `supplier_payment_ledger`, ordered `created_at DESC, id DESC`. |
| Mock strategy | Filter `store.supplier_payment_ledger` by `supplier_id`; compute `current_balance` as sum of `amount`; sort by `created_at DESC, id DESC`; apply offset/limit; return canonical JSON shape. |

### 4.6 `adjust_supplier_debt`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."adjust_supplier_debt"("p_supplier_id" "text", "p_amount" numeric, "p_reason" "text") RETURNS jsonb` |
| Parameters | `p_supplier_id text`, `p_amount numeric`, `p_reason text` |
| Service params | `{ p_supplier_id, p_amount, p_reason }` |
| Canonical behavior | Validates inputs, locks the supplier, updates `suppliers.debt = GREATEST(0, debt + amount)`, inserts a `supplier_payment_ledger` entry of type `adjustment` via `insert_supplier_ledger_entry`, and returns `jsonb_build_object('ok', true, 'supplier_id', ..., 'adjustment_amount', ..., 'new_supplier_debt', ..., 'ledger_balance_after', ..., 'reason', ...)`. |
| Mock strategy | Locate supplier in `store.suppliers`; update `debt = GREATEST(0, debt + amount)` and `updated_at`; append a ledger row to `store.supplier_payment_ledger` with `reference_type: 'adjustment'`, `reference_id: null`, and `balance_after` equal to the running ledger balance; return canonical JSONB shape. |

### 4.7 `pay_supplier_debt`

| Attribute | Value |
|---|---|
| Canonical declaration | `CREATE OR REPLACE FUNCTION "public"."pay_supplier_debt"("p_receipt_id" "text", "p_amount" numeric) RETURNS jsonb` |
| Parameters | `p_receipt_id text`, `p_amount numeric` |
| Service params | `{ p_receipt_id, p_amount }` |
| Canonical behavior | Validates inputs, locks the `import_receipts` row, clamps payment to remaining debt, updates `paid_amount` and `debt_recorded`, updates supplier `debt`, inserts a `supplier_payment_ledger` payment entry, and returns `jsonb_build_object('ok', true, 'receipt_id', ..., 'requested_amount', ..., 'effective_amount', ..., 'change_amount', ..., 'new_receipt_paid', ..., 'new_receipt_debt', ..., 'new_supplier_debt', ..., 'ledger_balance_after', ..., 'fully_paid', ...)`. |
| Mock strategy | Locate receipt in `store.import_receipts`; verify status `completed` and remaining debt; clamp effective amount; update receipt `paid_amount` and `debt_recorded`; if supplier exists, update supplier `debt` and append a `supplier_payment_ledger` payment row with negative amount; return canonical JSONB shape. |

**Traceability status:** Ready — 7 / 7 RPCs traced to canonical source.

---

## 5. Shared Helpers

Engineering has evaluated existing helpers in `tests/mocks/supabase.ts` for reuse. No new module-level abstraction will be created.

| Helper / Pattern | Reuse for H6 | Notes |
|---|---|---|
| `store` object + `executeQuery` | Partial | The mock uses `store[table]` for table queries. `suppliers`, `supplier_payment_ledger`, and `import_receipts` arrays must be added to the `store` initializer because they are currently absent. `import_receipts` is required by `pay_supplier_debt` in addition to the two store tables named in the task prompt. |
| `uuid()` | Yes | Use for ledger row `id` values, consistent with the existing customer-payment-ledger mock. |
| `unaccent` | Yes | The local `unaccent` helper already defined inside `rpc()` can be reused for supplier search/filter. If supplier handlers are placed before that helper, a local copy may be defined inline; no new module-level helper is created. |
| Inline `if (name === '...')` dispatch | Yes | Reuse verbatim. Seven new blocks inserted before the fallback `return { data: null, error: ... }`. |
| Local `buildSupplierRow` | Optional | A local builder can be defined inside `rpc()` to keep `search_suppliers_rpc` and `filter_suppliers_rpc` consistent. It is scoped to the function and mirrors the existing `buildCustomerRow` / `buildProductRow` pattern. |

**Helper decision:**
- Add `suppliers: []`, `supplier_payment_ledger: []`, and `import_receipts: []` to the `store` initializer.
- Optionally define a local `buildSupplierRow` inside the `rpc` function if it reduces duplication; remove if not needed after drafting.
- Reuse `uuid()` for ledger entry creation and the existing local `unaccent` for text search.

**No new file. No new module. No Map/switch/registry.**

---

## 6. Dispatch Strategy

Engineering confirms the implementation will continue using the existing dispatch pattern:

```ts
if (name === 'search_suppliers_rpc') { ... }
if (name === 'filter_suppliers_rpc') { ... }
if (name === 'get_supplier_stats') { ... }
if (name === 'get_supplier_report') { ... }
if (name === 'get_supplier_debt_ledger') { ... }
if (name === 'adjust_supplier_debt') { ... }
if (name === 'pay_supplier_debt') { ... }
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
| Covered RPCs | 111 / 183 | 118 / 183 |
| Coverage | 60.7% | 64.5% |
| Uncovered RPCs | 72 | 65 |
| Delta | — | +7 RPCs, +3.8 percentage points |

Engineering confirms the coverage calculation:
- `118 / 183 = 0.6448...` → rounded to one decimal place = **64.5%**.
- The audit gate reports coverage informationally; the target milestone line is **64.5%**.

---

## 8. Risk

### 8.1 Technical Risk

| Risk | Level | Mitigation |
|---|---|---|
| `search_suppliers_rpc` returns `SETOF suppliers`; mock must return full row shape used by `mapSupplierFromDB`. | Low | Return all columns from `store.suppliers` rows; service layer maps them via `mapSupplierFromDB`. |
| `filter_suppliers_rpc` sort logic supports `name`/`debt` × `asc`/`desc`; mock must reproduce canonical ordering. | Low | Implement the same `CASE`-style sort in JavaScript for the supported `sortBy` values; default to `name ASC`. |
| `adjust_supplier_debt` and `pay_supplier_debt` mutate store; missing store tables would lose state. | Low | Add `suppliers`, `supplier_payment_ledger`, and `import_receipts` to the `store` initializer so mutations are deterministic and visible between calls. |
| `get_supplier_report` joins `suppliers` and `import_receipts`; mock must aggregate both. | Low | Use `store.suppliers` and `store.import_receipts` with the same date-range and status filters as the canonical function. |

### 8.2 Regression Risk

| Risk | Level | Mitigation |
|---|---|---|
| Modifying `store` initializer could affect unrelated tests if keys are iterated. | Low | The initializer is a plain object; adding keys does not change iteration over existing keys. `resetMockData` loops `Object.keys(store)` and resets each to `[]`; new keys follow the same pattern. |
| Inserting 7 new handlers before the fallback could shift line numbers but does not change behavior. | None | Existing handlers are not modified; fallback remains the last `return`. |
| TypeScript errors if mock return shapes do not satisfy service casts. | Low | Run `npx tsc --noEmit`; service code casts `data as {...}`, so shape mismatches surface as runtime test failures, not compile errors. Tests will exercise the paths. |

### 8.3 Contract Risk

| Risk | Level | Mitigation |
|---|---|---|
| Mock return keys drift from canonical migration keys. | Low | Traceability table maps every canonical `json_build_object` / `jsonb_build_object` key to the mock return object. Implementation report will re-verify. |
| `adjust_supplier_debt` / `pay_supplier_debt` validation exceptions differ from canonical behavior. | Low | Mock focuses on deterministic happy-path shape and state mutation; canonical validation is exercised in integration tests, not unit mocks. The service only checks for `error` presence and propagates it. |
| Audit gate stale-mock / duplicate-handler fail. | Low | Only canonical RPC names are mocked; each name gets exactly one `if (name === '...')` block. |

### 8.4 State Mutation Risk

| Risk | Level | Mitigation |
|---|---|---|
| `adjust_supplier_debt` mutates `store.suppliers.debt` and appends to `store.supplier_payment_ledger`. | Low | Follow the established H5 customer debt mutation pattern; compute `new_supplier_debt = GREATEST(0, old_debt + amount)` and persist the ledger row with `balance_after`. |
| `pay_supplier_debt` mutates `store.import_receipts.paid_amount` / `debt_recorded`, supplier `debt`, and the ledger. | Low | Clamp `effective_amount` to the remaining receipt debt; only update supplier/ledger when `supplier_id` is present and valid; mirror canonical `jsonb_build_object` keys exactly. |

**Overall risk:** Low.

---

## 9. Validation Plan

Engineering commits to the following validation after implementation:

| # | Gate | Command | Expected Result |
|---|---|---|---|
| 1 | Canonical audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0; no code RPC missing from migrations; no stale mock; no duplicate handlers; coverage line = **64.5%**. |
| 2 | Type gate | `npx tsc --noEmit` | Exit 0. |
| 3 | Test gate | `npx vitest run` | No regression vs CURRENT_TASK-017 baseline. |
| 4 | Coverage | Reported by gate #1 | **64.5%** (118/183 covered). |
| 5 | Regression | Gates #1–#3 + git diff review | None outside `tests/mocks/supabase.ts` and optional `tests/**` files. |

**Definition of Done for Engineering:**
1. Seven additive `if (name === '...')` handler blocks added to `tests/mocks/supabase.ts`.
2. `store` initializer extended with `suppliers`, `supplier_payment_ledger`, and `import_receipts`.
3. All gates above pass.
4. Coverage reaches **64.5%**.
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

7 / 7

Traceability

Ready

Shared Helpers

Validated

Implementation Strategy

Approved

Expected Coverage

60.7%

↓

64.5%

Decision

READY FOR IMPLEMENTATION

Status

Engineering Ready

Next Step

CURRENT_TASK-018

Implementation
```

---

*Engineering confirms readiness to implement CURRENT_TASK-018 upon Program Manager authorization. No code changes have been made by this document.*
