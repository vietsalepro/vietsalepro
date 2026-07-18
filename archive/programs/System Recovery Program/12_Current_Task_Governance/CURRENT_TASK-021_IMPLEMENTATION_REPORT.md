# CURRENT_TASK-021 — Implementation Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3f — Domain H4 — Returns & Exchanges Mock Coverage  
**Document Type:** Engineering Implementation Report  
**Date:** 2026-07-15  
**Status:** COMPLETE — Engineering PASS

---

## Objective

Add mock coverage in `tests/mocks/supabase.ts` for the 7 authorized Domain H4 — Returns & Exchanges RPCs, deriving each handler's return shape directly from the canonical migration chain. The task continues Milestone M4 — Commerce Transactions and raises mock coverage from **72.1% (132/183)** to **76.0% (139/183)**.

---

## Scope

### In Scope

- Add exactly 7 mock handlers to `tests/mocks/supabase.ts` for Domain H4.
- Preserve the existing `if (name === "...")` dispatch pattern.
- Add minimal in-file store state required to support return-order and supplier-exchange lifecycle paths.

### Out of Scope

- Production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migrations, schema, generated types.
- `scripts/audit-rpc-contracts.ts`, CI workflows, `package.json`.
- New governance artifacts, acceptance records, or `CURRENT_TASK-022`.

---

## Implemented RPCs

| # | RPC | Sub-group | Canonical Migration File | Canonical Line | RETURNS |
|---|-----|-----------|--------------------------|----------------|---------|
| 1 | `get_return_order_auto_code` | Return Auto-code | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 8602 | `text` |
| 2 | `create_return_order` | Return Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 4645 | `jsonb` |
| 3 | `create_exchange_transaction` | Return/Exchange Transaction | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 3830 | `jsonb` |
| 4 | `filter_return_orders_rpc` | Return Search | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 6325 | `json` |
| 5 | `cancel_return_order_v2` | Return Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 2973 | `jsonb` |
| 6 | `create_supplier_exchange` | Supplier Exchange | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 4800 | `jsonb` |
| 7 | `cancel_supplier_exchange` | Supplier Exchange | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 3051 | `jsonb` |

---

## Files Changed

| File | Change Type | Summary |
|------|-------------|---------|
| `tests/mocks/supabase.ts` | Additive | Added 7 Domain H4 RPC handlers; added minimal in-file counters (`returnOrderCodeCounter`, `supplierExchangeCodeCounter`) and store tables (`supplier_exchanges`, `supplier_exchange_return_items`, `supplier_exchange_received_items`). |

No other files were modified by this task.

---

## Validation Results

### Coverage Before

- Covered RPCs: 132
- Uncovered RPCs: 51
- Coverage: 72.1%

### Coverage After

- Covered RPCs: 139
- Uncovered RPCs: 44
- Coverage: 76.0%

### Audit Result

```text
npx tsx scripts/audit-rpc-contracts.ts
```

- Exit code: 0
- 0 stale mock
- 0 duplicate handler
- All service-layer RPC calls defined in canonical migration chain
- All mock RPC handlers defined in canonical migration chain
- Coverage derived from canonical migration chain: 76.0%

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
- Test files: 69 passed
- Tests: 395 passed
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
| Implement exactly 7 authorized RPCs, no more, no less | PASS — only the 7 Domain H4 RPCs were added. |
| Preserve `if (name === "...")` dispatch pattern | PASS — all handlers use the existing pattern. |
| Additive only; no refactor, redesign, or abstraction | PASS — existing handlers and file structure were not modified. |
| Derive return shapes from canonical migration chain | PASS — each handler matches the declared `RETURNS` clause. |
| No production code changes | PASS — only `tests/mocks/supabase.ts` was changed. |
| No migrations, schema, generated types, audit script, CI, or package.json changes | PASS. |
| No new governance artifacts or `CURRENT_TASK-022` | PASS. |

---

## Summary

CURRENT_TASK-021 implemented the 7 authorized Domain H4 — Returns & Exchanges mock handlers in `tests/mocks/supabase.ts`. The implementation is additive, follows the existing dispatch pattern, and derives return shapes from the canonical migration chain. All validation gates pass: audit (0 stale, 0 duplicate, 76.0% coverage), TypeScript type check, and the full Vitest suite. No regressions were introduced.

---

## Status

**CURRENT_TASK-021 Implementation: COMPLETE**

**Engineering: PASS**

Ready for Independent Program Manager Acceptance Review.

---

## Next Step

Independent Program Manager Acceptance Review for CURRENT_TASK-021.
