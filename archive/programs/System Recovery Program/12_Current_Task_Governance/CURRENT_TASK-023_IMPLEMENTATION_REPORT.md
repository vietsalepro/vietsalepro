# CURRENT_TASK-023 — Implementation Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3h — Domain H8 — Disposals Mock Coverage  
**Document Type:** Engineering Implementation Report  
**Date:** 2026-07-15  
**Status:** COMPLETE — Engineering PASS

---

## Objective

Add mock coverage in `tests/mocks/supabase.ts` for the 3 authorized Domain H8 — Disposals RPCs, deriving each handler's return shape and parameter contract directly from the canonical migration chain. The task completes Milestone M4 — Commerce Transactions and raises mock coverage from **80.3% (147/183)** to approximately **82.0% (150/183)**.

---

## Scope

### In Scope

- Add exactly 3 mock handlers to `tests/mocks/supabase.ts` for Domain H8 — Disposals.
- Preserve the existing `if (name === "...")` dispatch pattern.
- Add minimal in-file state (`disposals` and `disposal_items` store arrays) required to exercise the new handlers consistently with other commerce-domain mocks.

### Out of Scope

- Production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migrations, schema, generated types.
- `scripts/audit-rpc-contracts.ts`, CI workflows, `package.json`.
- New governance artifacts, acceptance records, or `CURRENT_TASK-024`.

---

## Implemented RPCs

| # | RPC | Sub-group | Canonical Migration File | Canonical Line | RETURNS |
|---|-----|-----------|--------------------------|----------------:|---------|
| 1 | `delete_disposal_with_restore` | Disposal Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5355 | `void` |
| 2 | `filter_disposals_rpc` | Disposal Search | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 6093 | `json` |
| 3 | `get_disposal_auto_code` | Disposal Code | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7347 | `text` |

---

## Files Changed

| File | Change Type | Summary |
|------|-------------|---------|
| `tests/mocks/supabase.ts` | Additive | Added `disposals` and `disposal_items` arrays to the in-memory store; added 3 Domain H8 RPC handlers using the existing `if (name === "...")` dispatch chain. |

No other tracked files were modified by this task.

---

## Validation Results

### Coverage Before

- Covered RPCs: 147
- Uncovered RPCs: 36
- Coverage: 80.3%

### Coverage After

- Covered RPCs: 150
- Uncovered RPCs: 33
- Coverage: ~82.0%

> The HEAD version of `scripts/audit-rpc-contracts.ts` does not emit a coverage percentage. The value **150/183 (~82.0%)** is derived from adding the 3 new Domain H8 mock handlers to the previously accepted baseline of 147/183 (80.3%).

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
| Implement exactly 3 authorized RPCs, no more, no less | PASS — only the 3 Domain H8 RPCs were added. |
| Preserve `if (name === "...")` dispatch pattern | PASS — all handlers use the existing pattern. |
| Additive only; no refactor, redesign, or abstraction | PASS — existing handlers and file structure were not modified. |
| Derive return shapes from canonical migration chain | PASS — each handler matches the declared `RETURNS` clause. |
| No production code changes | PASS — only `tests/mocks/supabase.ts` was changed. |
| No migrations, schema, generated types, audit script, CI, or package.json changes | PASS — `scripts/audit-rpc-contracts.ts` remains at HEAD; no changes applied. |
| No new governance artifacts or `CURRENT_TASK-024` | PASS. |

---

## Traceability to Canonical Migration

All 3 handlers derive parameter names and return shapes directly from the `CREATE [OR REPLACE] FUNCTION public.<name>` declarations in `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`:

- `get_disposal_auto_code` — `RETURNS text`; mock returns `XH` + 6-digit zero-padded sequence based on `store.disposals.length + 1`, matching the canonical `LPAD(..., 6, '0')` behavior.
- `filter_disposals_rpc` — `RETURNS json` with keys `disposals` and `totalCount`; mock filters by `code` (case-insensitive), `status`, and date range, sorts by `date` descending, paginates, and nests matching `disposal_items` per disposal.
- `delete_disposal_with_restore` — `RETURNS void`; mock locates the disposal by `p_disposal_id`, removes it from `store.disposals`, removes its items from `store.disposal_items`, and returns `{ data: null, error: null }` on success or a `P0001` error if not found.

---

## Summary

CURRENT_TASK-023 implemented the 3 authorized Domain H8 — Disposals mock handlers in `tests/mocks/supabase.ts`. The implementation is additive, follows the existing dispatch pattern, and derives return shapes from the canonical migration chain. TypeScript type check and the full Vitest suite pass with no regressions. The audit gate passes against the HEAD version of `scripts/audit-rpc-contracts.ts`. The ~82.0% mock coverage target is achieved by the 3 new H8 handlers (150/183 RPCs covered).

---

## Status

**CURRENT_TASK-023 Implementation: COMPLETE**

**Engineering: PASS**

Ready for Independent Program Manager Acceptance Review.

---

## Next Step

Independent Program Manager Acceptance Review for CURRENT_TASK-023.
