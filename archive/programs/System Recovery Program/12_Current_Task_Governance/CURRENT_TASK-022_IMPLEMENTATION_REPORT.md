# CURRENT_TASK-022 — Implementation Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3g — Domain H7 — Imports Mock Coverage  
**Document Type:** Engineering Implementation Report  
**Date:** 2026-07-15  
**Status:** COMPLETE — Engineering PASS

---

## Objective

Add mock coverage in `tests/mocks/supabase.ts` for the 8 authorized Domain H7 — Imports RPCs, deriving each handler's return shape directly from the canonical migration chain. The task continues Milestone M4 — Commerce Transactions and raises mock coverage from **76.0% (139/183)** to **80.3% (147/183)**.

---

## Scope

### In Scope

- Add exactly 8 mock handlers to `tests/mocks/supabase.ts` for Domain H7 — Imports.
- Preserve the existing `if (name === "...")` dispatch pattern.
- Add minimal in-file state changes required to support import receipt lifecycle paths.

### Out of Scope

- Production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migrations, schema, generated types.
- `scripts/audit-rpc-contracts.ts`, CI workflows, `package.json`.
- New governance artifacts, acceptance records, or `CURRENT_TASK-023`.

---

## Implemented RPCs

| # | RPC | Sub-group | Canonical Migration File | Canonical Line | RETURNS |
|---|-----|-----------|--------------------------|----------------|---------|
| 1 | `delete_import_v2` | Import Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5384 | `jsonb` |
| 2 | `process_import_v2` | Import Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 10865 | `jsonb` |
| 3 | `update_import_v2` | Import Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 12649 | `jsonb` |
| 4 | `filter_import_receipts_rpc` | Import Search | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 6170 / 6208 | `json` |
| 5 | `get_import_receipt_count_by_date` | Import Stats | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7570 | `integer` |
| 6 | `get_import_receipts_by_product_and_lot` | Import Query | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7578 | `json` |
| 7 | `get_import_receipts_by_supplier_id` | Import Query | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7618 | `json` |
| 8 | `get_import_stats` | Import Stats | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7644 | `json` |

---

## Files Changed

| File | Change Type | Summary |
|------|-------------|---------|
| `tests/mocks/supabase.ts` | Additive | Added 8 Domain H7 RPC handlers using the existing `if (name === "...")` dispatch chain. Uses existing `store.import_receipts` and `store.import_items` arrays; no new store tables or counters required. |

No other tracked files were modified by this task. Out-of-scope working-tree changes identified during Acceptance Remediation (production services, admin pages/components, admin tests, and `scripts/audit-rpc-contracts.ts`) were reverted to HEAD.

---

## Validation Results

### Coverage Before

- Covered RPCs: 139
- Uncovered RPCs: 44
- Coverage: 76.0%

### Coverage After

- Covered RPCs: 147
- Uncovered RPCs: 36
- Coverage: 80.3%

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
- The HEAD version of `scripts/audit-rpc-contracts.ts` compares `services/` and `lib/` RPC call sites against `docs/admin-dashboard/RPC_CONTRACTS.md` and reports the two sets are in sync. It does not emit mock coverage percentages. The 80.3% coverage target is achieved by the 8 new H7 mock handlers in `tests/mocks/supabase.ts` (147/183 RPCs covered).

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
| Implement exactly 8 authorized RPCs, no more, no less | PASS — only the 8 Domain H7 RPCs were added. |
| Preserve `if (name === "...")` dispatch pattern | PASS — all handlers use the existing pattern. |
| Additive only; no refactor, redesign, or abstraction | PASS — existing handlers and file structure were not modified. |
| Derive return shapes from canonical migration chain | PASS — each handler matches the declared `RETURNS` clause. |
| No production code changes | PASS — only `tests/mocks/supabase.ts` was changed. |
| No migrations, schema, generated types, audit script, CI, or package.json changes | PASS — `scripts/audit-rpc-contracts.ts` remains at HEAD; no changes applied. |
| No new governance artifacts or `CURRENT_TASK-023` | PASS. |

---

## Traceability to Canonical Migration

All 8 handlers derive parameter names and return shapes directly from the `CREATE [OR REPLACE] FUNCTION public.<name>` declarations in `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`:

- `delete_import_v2` — `RETURNS jsonb` with keys `receipt_id`, `affected_products`, `total_qty_removed`, `status`.
- `process_import_v2` — `RETURNS jsonb` with keys `receipt_id`, `affected_products`, `total_qty_added`, `status`.
- `update_import_v2` — `RETURNS jsonb` by canonical delegation (`delete_import_v2` then `process_import_v2`); mock replicates delete-then-process behavior and returns the process result shape.
- `filter_import_receipts_rpc` — two overloaded signatures both return `json` with keys `receipts`, `totalCount`; one handler covers both overloads.
- `get_import_receipt_count_by_date` — `RETURNS integer`.
- `get_import_receipts_by_product_and_lot` — `RETURNS json` (array of receipts with nested `import_items`).
- `get_import_receipts_by_supplier_id` — `RETURNS json` (array of receipts with nested `import_items`).
- `get_import_stats` — `RETURNS json` with keys `totalCount`, `totalCost`, `totalShipping`, `totalPaid`, `totalDebt`.

---

## Summary

CURRENT_TASK-022 implemented the 8 authorized Domain H7 — Imports mock handlers in `tests/mocks/supabase.ts`. The implementation is additive, follows the existing dispatch pattern, and derives return shapes from the canonical migration chain. TypeScript type check and the full Vitest suite pass with no regressions. The audit gate passes against the HEAD version of `scripts/audit-rpc-contracts.ts`; this HEAD version checks the admin-dashboard markdown contract, not the mock coverage percentage. The 80.3% mock coverage target is achieved by the 8 new H7 handlers in `tests/mocks/supabase.ts`.

---

## Status

**CURRENT_TASK-022 Implementation: COMPLETE**

**Engineering: PASS**

Ready for Independent Program Manager Acceptance Review.

---

## Next Step

Independent Program Manager Acceptance Review for CURRENT_TASK-022.
