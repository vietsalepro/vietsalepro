# RECOVERY_WAVE_04_IMPLEMENTATION_REPORT

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Wave:** Recovery Wave-04  
**Domains:** H7 — Imports, H8 — Disposals  
**Date:** 2026-07-16  
**Status:** Implementation Complete  

---

## 1. Scope & Boundary Compliance

Only `tests/mocks/supabase.ts` was modified. Two new in-memory stores, `disposals` and `disposal_items`, were added to the existing `store` object because they are strictly required by the H8 handlers. No production code, migrations, schema, generated types, packages, CI, or governance files were changed.

| Rule | Compliance |
|---|---|
| Additive-only implementation | Yes — no cleanup, refactoring, or scope expansion |
| Only authorized RPCs implemented | Yes — exactly 12 |
| No H9 RPCs implemented | Yes |
| No new helpers or utility layers | Yes — existing `uuid()` and store helpers reused |
| File modification boundary | Yes — only `tests/mocks/supabase.ts` |
| Store boundary | Yes — only `disposals` and `disposal_items` added |

---

## 2. Pre-Implementation Checklist

| Check | Result |
|---|---|
| Authorized RPC inventory is exactly 12 | Pass |
| H7 contains exactly 8 RPCs | Pass |
| H8 contains exactly 4 RPCs (including `complete_disposal`) | Pass |
| No H9 RPC appears in Wave-04 scope | Pass |
| No existing handler for any of the 12 RPCs | Pass |
| Architecture and Scope Freezes valid | Pass |

---

## 3. Implemented RPCs

### H7 — Imports (8 RPCs)

| # | RPC | Migration Source | Service Call Site | Notes |
|---|---|---|---|---|
| 1 | `get_import_stats` | `...:7644` | `services/supabaseService.ts:1675` | Aggregates `import_receipts` by local `Asia/Ho_Chi_Minh` date range |
| 2 | `get_import_receipt_count_by_date` | `...:7570` | `services/supabaseService.ts:1690` | Counts receipts matching a local VN date |
| 3 | `get_import_receipts_by_supplier_id` | `...:7618` | `services/supabaseService.ts:1739` | Returns receipt rows with nested `import_items` |
| 4 | `get_import_receipts_by_product_and_lot` | `...:7578` | `services/supabaseService.ts:1748` | Filters by `product_id` and resolves `lot_id`/`lot_code` |
| 5 | `filter_import_receipts_rpc` | `...:6170` / `...:6208` | `services/supabaseService.ts:1830` | Single handler covers both overloaded signatures; supports optional `p_status`; attaches empty `import_items` per contract |
| 6 | `process_import_v2` | `...:10865` | `services/supabaseService.ts:1880` | Creates receipt/items, updates products, product lots, and supplier debt; supports draft overwrite and completed stock posting |
| 7 | `delete_import_v2` | `...:5384` | `services/supabaseService.ts:1955` | Reverses completed stock and debt effects; deletes draft or completed receipts |
| 8 | `update_import_v2` | `...:12649` | `services/supabaseService.ts:1937` | Delegates to `delete_import_v2` then `process_import_v2` and returns the process result |

### H8 — Disposals (4 RPCs)

| # | RPC | Migration Source | Service Call Site | Notes |
|---|---|---|---|---|
| 9 | `get_disposal_auto_code` | `...:7347` | `services/supabaseService.ts:3454` | Generates `XH` + zero-padded disposal count + 1 |
| 10 | `complete_disposal` | `...:3463` | `services/supabaseService.ts:3520` | Decrements product/lot quantities and sets disposal status to `COMPLETED` |
| 11 | `delete_disposal_with_restore` | `...:5355` | `services/supabaseService.ts:3587` | Restores completed disposal stock and deletes the disposal and its items |
| 12 | `filter_disposals_rpc` | `...:6093` | `services/supabaseService.ts:3437` | Paginated disposals with nested `disposal_items` |

---

## 4. Implementation Notes

- All 12 handlers follow the existing flat `if (name === '...')` dispatch pattern in `tests/mocks/supabase.ts`.
- `filter_import_receipts_rpc` uses one handler block to satisfy both canonical overloaded signatures; the optional `p_status` filter is applied only when the parameter is non-null and non-empty.
- `update_import_v2` is implemented by reusing the existing `delete_import_v2` and `process_import_v2` branches within the same dispatch function, mirroring the canonical `SELECT delete_import_v2(...) THEN RETURN process_import_v2(...)` flow.
- Date comparisons for import statistics and filters use `toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' })` to match the canonical migration behavior of interpreting receipt timestamps in the Vietnam timezone.
- `process_import_v2` computes weighted-average costs for products and product lots, creates missing lots with deterministic IDs, and synchronizes product quantity from lots when lot management is enabled.
- `complete_disposal` and `delete_disposal_with_restore` preserve lot-level and product-level quantity consistency, including restoring missing lots on delete when necessary.
- No new helper functions, registries, dispatchers, or abstraction layers were introduced.

---

## 5. Validation Results

| Validation Command | Result | Details |
|---|---|---|
| `npx tsx scripts/audit-rpc-contracts.ts` | Pass | All service-layer RPC calls are defined in the canonical migration chain. Migration RPCs: 300, Code RPCs: 183 |
| `npx tsc --noEmit` | Pass | No TypeScript errors or regressions |
| `npx vitest run` | Pass | All tests pass (exit code 0) |
| Duplicate handler check | Pass | `grep` returned exactly 12 matches for the 12 authorized RPC handler entry points |

---

## 6. Post-Implementation Boundary

Per the explicit stop boundary, no verification report, coverage measurement, acceptance review, program status review, or Wave-05 planning is included in this document. Those are out of scope for Recovery Wave-04 implementation.

---

## 7. Files Changed

| File | Change |
|---|---|
| `tests/mocks/supabase.ts` | Added `disposals` and `disposal_items` stores; added 12 RPC mock handlers for H7 and H8 |

---

*Report generated as part of Recovery Wave-04 implementation.*
