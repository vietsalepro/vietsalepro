# RECOVERY_WAVE_04_ENGINEERING_KICKOFF

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Wave:** Recovery Wave-04  
**Domains:** H7 — Imports, H8 — Disposals  
**Document Type:** Engineering Kickoff  
**Date:** 2026-07-16  
**Authority:** Program Recovery Authorization Review  
**Status:** APPROVED to proceed to implementation

---

## Executive Summary

Recovery Wave-04 authorizes the implementation of mock handlers for exactly **12 code RPCs** across two domains:

- **H7 — Imports:** 8 RPCs
- **H8 — Disposals:** 4 RPCs, explicitly including `complete_disposal`

The implementation target is `tests/mocks/supabase.ts` (and any test files that exercise the new handlers). All work is **additive only**. No production code, migrations, schema, generated types, packages, CI, or governance files may be modified. No H9 RPCs, cleanup, or refactoring are in scope.

The verified Recovery baseline is **170 of 184** unique code RPCs already covered by mock handlers. After Wave-04, the **target** direct-measurement coverage is **182 of 184** (98.9%), leaving only the two H9 — Reports & Dashboard RPCs for a later wave. This target value is a verification target only; final coverage must be measured and reported by `RECOVERY_WAVE_04_VERIFICATION_REPORT.md`.

This document does not implement any code.

---

## Engineering Baseline

All baseline values are taken directly from `RECOVERY_WAVE_03_VERIFICATION_REPORT.md` and `RECOVERY_WAVE_04_AUTHORIZATION.md`.

| Metric | Verified Value | Source |
|---|---|---|
| Unique code RPCs | **184** | Direct multi-line `.rpc(` scan of `services/`, `lib/`, `utils/` |
| Code RPCs (canonical audit script) | **183** | `npx tsx scripts/audit-rpc-contracts.ts` (undercounts `complete_disposal` because of multi-line call) |
| Covered RPCs | **170** | Code RPCs with a matching mock handler |
| Missing RPCs | **14** | Code RPCs without a matching mock handler |
| Current Coverage | **92.4%** | `170 / 184` |
| Canonical Audit Gate | **PASS** | Exit 0, 0 code RPCs missing from migrations |
| Type Gate | **PASS** | `npx tsc --noEmit` exits 0 |
| Test Gate | **PASS** | `npx vitest run` exits 0, no regressions |

### Target values (verification targets, not achieved facts)

| Metric | Target after Wave-04 | Note |
|---|---|---|
| Covered RPCs | **182** | Direct measurement target only |
| Missing RPCs | **2** | H9 only (`get_dashboard_summary`, `get_profit_report`) |
| Target Coverage | **98.9%** | `182 / 184` |

These target numbers must be confirmed by `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` before they can be reported as achieved.

---

## Kickoff Readiness Review

Before drafting this kickoff, the authorized RPC inventory and scope boundary were re-verified against the current working tree.

| Check | Method | Result |
|---|---|---|
| Authorized RPC inventory is exactly 12 | Count RPCs in `RECOVERY_WAVE_04_AUTHORIZATION.md` §5 and `RECOVERY_WAVE_04_ARCHITECTURE_DECISION.md` §Authorized RPC Inventory | ✅ **PASS** |
| H7 contains exactly 8 RPCs | Domain grouping in authorization and architecture decision | ✅ **PASS** |
| H8 contains exactly 4 RPCs | Domain grouping in authorization and architecture decision | ✅ **PASS** |
| `complete_disposal` remains within authorized scope | Listed as H8 RPC #9 in `RECOVERY_WAVE_04_AUTHORIZATION.md` | ✅ **PASS** |
| No H9 RPC appears in Wave-04 scope | `get_dashboard_summary` and `get_profit_report` excluded per authorization | ✅ **PASS** |
| No cleanup work has entered the scope | Pre-existing duplicate `get_tenant_members_with_email` and orphan `update_tenant_status` are explicitly out of scope | ✅ **PASS** |
| No refactoring has entered the scope | Architecture decision requires additive-only, no-restructure implementation | ✅ **PASS** |
| No existing handler for any of the 12 RPCs | `grep` of `tests/mocks/supabase.ts` for all 12 names + 2 H9 names returned 0 matches | ✅ **PASS** |
| No unauthorized production or migration changes are planned | Scope boundary lists only `tests/mocks/supabase.ts` and test files | ✅ **PASS** |

No inconsistency was discovered. Recovery Wave-04 may proceed to implementation.

---

## Authorized RPC Inventory

| # | Domain | RPC | Canonical Migration | Production Call Site | Service Function | Complexity |
|---|---|---|---|---|---|---|
| 1 | H7 | `delete_import_v2` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:5384` | `services/supabaseService.ts:1955` | `deleteImportReceipt(id)` | Complex |
| 2 | H7 | `filter_import_receipts_rpc` | `...:6170` and `...:6208` (two overloaded signatures) | `services/supabaseService.ts:1830` | `filterImportReceiptsPaginated(...)` | Medium |
| 3 | H7 | `get_import_receipt_count_by_date` | `...:7570` | `services/supabaseService.ts:1690` | `getImportReceiptCountByDate(date)` | Simple |
| 4 | H7 | `get_import_receipts_by_product_and_lot` | `...:7578` | `services/supabaseService.ts:1748` | `getImportReceiptsByProductAndLot(productId, lotId)` | Simple |
| 5 | H7 | `get_import_receipts_by_supplier_id` | `...:7618` | `services/supabaseService.ts:1739` | `getImportReceiptsBySupplierId(supplierId, limit)` | Simple |
| 6 | H7 | `get_import_stats` | `...:7644` | `services/supabaseService.ts:1675` | `getImportStats(fromDate, toDate)` | Simple |
| 7 | H7 | `process_import_v2` | `...:10865` | `services/supabaseService.ts:1880` | `createImportReceipt(receipt)` | Complex |
| 8 | H7 | `update_import_v2` | `...:12649` | `services/supabaseService.ts:1937` | `updateImportReceipt(receipt)` | Complex |
| 9 | H8 | `complete_disposal` | `...:3463` | `services/supabaseService.ts:3520` | `completeDisposal(id)` | Medium |
| 10 | H8 | `delete_disposal_with_restore` | `...:5355` | `services/supabaseService.ts:3587` | `deleteDisposal(id)` | Medium |
| 11 | H8 | `filter_disposals_rpc` | `...:6093` | `services/supabaseService.ts:3437` | `filterDisposalsPaginated(...)` | Medium |
| 12 | H8 | `get_disposal_auto_code` | `...:7347` | `services/supabaseService.ts:3454` | `createDisposal(disposal)` | Simple |

**Total authorized RPCs: 12.**

No other RPCs are authorized for Wave-04.

---

## Implementation Sequence

### Phase 1 — H7: Imports

Implement the 8 Import RPCs in the following order. Read-only handlers are implemented first so that the row shape and store conventions are validated before the complex write handlers mutate `import_receipts`, `import_items`, `products`, `product_lots`, and `suppliers`.

1. `get_import_stats` — aggregate read; no store mutation.
2. `get_import_receipt_count_by_date` — single-value read; validates `import_receipts` date handling.
3. `get_import_receipts_by_supplier_id` — array read with nested `import_items`; defines the receipt row shape.
4. `get_import_receipts_by_product_and_lot` — array read with filtered nested `import_items`; defines product/lot join behavior.
5. `filter_import_receipts_rpc` — paginated read with two overloaded signatures; optional `p_status` filter.
6. `process_import_v2` — complex write; creates receipts/items, updates products, product lots, and supplier debt.
7. `delete_import_v2` — complex write; reverses `process_import_v2` stock and debt effects and removes rows.
8. `update_import_v2` — complex; delegates to `delete_import_v2` then `process_import_v2` and returns the result of `process_import_v2`.

### Phase 2 — H8: Disposals

Implement the 4 Disposal RPCs in dependency order.

1. `get_disposal_auto_code` — simple code generation; no dependencies.
2. `complete_disposal` — updates `disposals` status to `COMPLETED` and decrements `products`/`product_lots` quantities.
3. `delete_disposal_with_restore` — restores stock for completed disposals and deletes the disposal and its items.
4. `filter_disposals_rpc` — paginated read with nested `disposal_items`; depends on the final `disposals`/`disposal_items` store shape.

`complete_disposal` is explicitly included as the second H8 handler.

---

## Store Planning

Only stores that are already used by Wave-03 or are strictly required by the 12 authorized RPCs are listed. No speculative stores are authorized.

| Store | Existing / New | Reason Required | Authorized RPCs Using It |
|---|---|---|---|
| `import_receipts` | Existing (Recovery Wave-03) | Header rows for all import operations | `process_import_v2`, `update_import_v2`, `delete_import_v2`, `filter_import_receipts_rpc`, `get_import_receipts_by_supplier_id`, `get_import_receipts_by_product_and_lot`, `get_import_receipt_count_by_date`, `get_import_stats` |
| `import_items` | Existing (Recovery Wave-03) | Nested items per import receipt | `process_import_v2`, `update_import_v2`, `delete_import_v2`, `filter_import_receipts_rpc`, `get_import_receipts_by_supplier_id`, `get_import_receipts_by_product_and_lot` |
| `suppliers` | Existing (Recovery Wave-03) | Debt updates on completed imports | `process_import_v2`, `update_import_v2`, `delete_import_v2` |
| `supplier_payment_ledger` | Existing (Recovery Wave-03) | Records supplier debt adjustments (optional, only if the handler writes ledger entries) | `process_import_v2`, `update_import_v2`, `delete_import_v2` |
| `products` | Existing | Validate product existence; update quantity and cost | `process_import_v2`, `update_import_v2`, `delete_import_v2`, `complete_disposal`, `delete_disposal_with_restore` |
| `product_lots` | Existing | Lot management, quantity/cost updates | `process_import_v2`, `update_import_v2`, `delete_import_v2`, `complete_disposal`, `delete_disposal_with_restore` |
| `disposals` | **New** | Header rows for disposal operations; no disposal store currently exists | `get_disposal_auto_code`, `complete_disposal`, `delete_disposal_with_restore`, `filter_disposals_rpc` |
| `disposal_items` | **New** | Nested items per disposal; required by `filter_disposals_rpc` and by `complete_disposal`/`delete_disposal_with_restore` for stock logic | `complete_disposal`, `delete_disposal_with_restore`, `filter_disposals_rpc` |

`stock_movements` and `inventory_movements` are **not** listed because no authorized service function reads those tables as a result of these RPCs. The canonical migration bodies write to `inventory_movements` and call stored helpers such as `insert_stock_ledger_entry`, but the service layer only consumes the JSON/JSONB return values and the updated `products`/`product_lots` rows.

New store keys will be added to the `store` object and `resetMockData()` will clear them automatically because it iterates `Object.keys(store)`.

---

## Helper Reuse Review

| Helper | Existing | Reusable | New Helper Required |
|---|---|---|---|
| `uuid()` | Yes | Yes | No |
| `currentTenantId` / `requireTenantId()` | Yes | Yes | No |
| `store` direct read/write | Yes | Yes | No |
| `getMockRows()` / `addMockRow()` | Yes | Optional | No |
| `addMonths()` / `addDays()` | Yes | No (not needed for H7/H8 date logic) | No |
| `getSetting()` / `setSetting()` | Yes | No (app_settings not used by these RPCs) | No |
| `executeQuery()` / `queryBuilder()` | Yes | No (RPC handlers access `store` directly) | No |

**No new helper is required.** All date math, pagination, and stock-revaluation logic will be written inline inside the handler blocks, following the same pattern used by the Recovery Wave-03 H4/H5/H6 handlers.

A new top-level state variable for `disposal` auto-code numbering is **not** a helper and is therefore not covered by the helper review. The canonical `get_disposal_auto_code` migration derives the code from `COUNT(*) FROM disposals`, so the handler can mirror that behavior unless a test explicitly requires a counter.

---

## Implementation Strategy

| # | RPC | Phase | Order | Complexity | Depends On | Canonical Migration Source | Production Call-Site Reference | Return Contract Source |
|---|---|---|---|---|---|---|---|---|
| 1 | `get_import_stats` | H7 | 1 | Simple | `import_receipts` store shape | `20250703000000_baseline_pre_tenant_schema.sql:7644` | `services/supabaseService.ts:1675` (`getImportStats`) | Migration `RETURNS json` with keys `totalCount`, `totalCost`, `totalShipping`, `totalPaid`, `totalDebt`; consumed by service cast at `services/supabaseService.ts:1680-1686` |
| 2 | `get_import_receipt_count_by_date` | H7 | 2 | Simple | `import_receipts` store shape | `...:7570` | `services/supabaseService.ts:1690` (`getImportReceiptCountByDate`) | Migration `RETURNS integer`; consumed as `number` at `services/supabaseService.ts:1694` |
| 3 | `get_import_receipts_by_supplier_id` | H7 | 3 | Simple | `import_receipts`, `import_items` shape | `...:7618` | `services/supabaseService.ts:1739` (`getImportReceiptsBySupplierId`) | Migration `RETURNS json` array of receipt rows with nested `import_items`; consumed by `mapImportReceiptFromDB` at `services/supabaseService.ts:153-177` |
| 4 | `get_import_receipts_by_product_and_lot` | H7 | 4 | Simple | `import_receipts`, `import_items`, `product_lots` shape | `...:7578` | `services/supabaseService.ts:1748` (`getImportReceiptsByProductAndLot`) | Migration `RETURNS json` array of receipt rows with filtered nested `import_items`; consumed by `mapImportReceiptFromDB` |
| 5 | `filter_import_receipts_rpc` | H7 | 5 | Medium | `import_receipts` shape; optional `p_status` | `...:6170` and `...:6208` | `services/supabaseService.ts:1830` (`filterImportReceiptsPaginated`) | Migration `RETURNS json` `{ receipts: [...], totalCount: integer }`; service maps `receipts` via `mapImportReceiptFromDB`; note canonical `SELECT r.*` has no nested items, so handler must attach an empty `import_items` array to each row to satisfy `mapImportReceiptFromDB` |
| 6 | `process_import_v2` | H7 | 6 | Complex | `products`, `product_lots`, `suppliers`, `import_receipts`, `import_items` | `...:10865` | `services/supabaseService.ts:1880` (`createImportReceipt`) | Migration `RETURNS jsonb` `{ receipt_id, affected_products, total_qty_added, status }`; consumed by service at `services/supabaseService.ts:1889` |
| 7 | `delete_import_v2` | H7 | 7 | Complex | `process_import_v2` behavior (reversal) | `...:5384` | `services/supabaseService.ts:1955` (`deleteImportReceipt`) | Migration `RETURNS jsonb` `{ receipt_id, status: 'draft_deleted' }` or `{ receipt_id, affected_products, total_qty_removed, status: 'completed_deleted' }`; consumed by service at `services/supabaseService.ts:1964` |
| 8 | `update_import_v2` | H7 | 8 | Complex | `delete_import_v2` and `process_import_v2` | `...:12649` | `services/supabaseService.ts:1937` (`updateImportReceipt`) | Migration `RETURNS jsonb` by delegating to `delete_import_v2` then `process_import_v2`; return the `process_import_v2` result |
| 9 | `get_disposal_auto_code` | H8 | 1 | Simple | `disposals` store existence | `...:7347` | `services/supabaseService.ts:3454` (`createDisposal`) | Migration `RETURNS text` (e.g., `XH000001`); consumed as disposal `code` at `services/supabaseService.ts:3456` |
| 10 | `complete_disposal` | H8 | 2 | Medium | `disposals`, `disposal_items`, `products`, `product_lots` | `...:3463` | `services/supabaseService.ts:3520` (`completeDisposal`) | Migration `RETURNS TABLE(id text, code text, status text)`; service ignores returned rows and re-fetches via `getDisposalById`, so the handler only needs to return a valid row array to avoid throwing an error |
| 11 | `delete_disposal_with_restore` | H8 | 3 | Medium | `complete_disposal` store state (optional) | `...:5355` | `services/supabaseService.ts:3587` (`deleteDisposal`) | Migration `RETURNS void`; service only checks `error` |
| 12 | `filter_disposals_rpc` | H8 | 4 | Medium | `disposals`, `disposal_items` final shape | `...:6093` | `services/supabaseService.ts:3437` (`filterDisposalsPaginated`) | Migration `RETURNS json` `{ disposals: [...], totalCount: integer }`; service maps `disposals` via `mapDisposalFromDB` at `services/supabaseService.ts:211-240` |

### Handler contract notes

- All handlers use the existing flat `if (name === '...')` / `else if (name === '...')` dispatch chain.
- Each handler returns `{ data: <value>, error: null }` on success and `{ data: null, error: { code, message } }` on failure.
- `filter_import_receipts_rpc` has two canonical signatures; one handler block accepts `p_status` optionally and applies the status filter only when `p_status` is present and non-null.
- `complete_disposal` is invoked via a multi-line `.rpc(` call (`supabase` and `.rpc` on separate lines). The handler must exist and return a valid row array; the service correctness is verified by the subsequent `getDisposalById` call.
- `update_import_v2` should reuse the same logic as `delete_import_v2` followed by `process_import_v2`; inlining is permitted because no shared helper is introduced.

---

## Risk Review

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | `filter_import_receipts_rpc` has two overloaded signatures (`p_supplier_id` only and `p_supplier_id` + `p_status`). The service always passes `p_status` (possibly `null`). | Low | One handler block checks `params.p_status != null && params.p_status !== ''` and applies the status filter only when true. Both overloads return the same `{ receipts, totalCount }` shape. |
| 2 | `complete_disposal` is invoked with a multi-line `.rpc(` call and was omitted from `CURRENT_TASK-023`. Implementers may miss it. | Medium | Include `complete_disposal` explicitly in the Phase 2 sequence and in all verification checklists. Coverage measurement must use the multi-line `.rpc(` aware scan (184-denominator). |
| 3 | `process_import_v2` and `delete_import_v2` must keep `products`, `product_lots`, `suppliers`, `import_receipts`, and `import_items` mutually consistent. | Medium | Implement in order (`process` → `delete` → `update`) and validate with direct test data setups. Reuse the lot/cost update arithmetic from the canonical migration, but operate on the in-memory `store` arrays. |
| 4 | `get_import_receipts_by_supplier_id` canonical migration joins `import_items` on `ii.import_receipt_id`, while the `import_items` store rows use the `receipt_id` column. | Low | Implement the handler using the store's real `receipt_id` column while preserving the canonical JSON return shape and field names. |
| 5 | H4/H6 handlers already manipulate `product_lots` and `suppliers`. New H7/H8 handlers may regress those domains if stock arithmetic is wrong. | Medium | Run the full `npx vitest run` suite after each handler block is added. Do not modify existing handlers. |
| 6 | `filter_import_receipts_rpc` canonical `SELECT r.*` does not include nested `import_items`, but `mapImportReceiptFromDB` expects `r.import_items` to be present (possibly empty). | Low | Attach an empty `import_items: []` array to each row returned by `filter_import_receipts_rpc`. |
| 7 | `filter_disposals_rpc` must return disposal rows with a nested `disposal_items` array that matches `mapDisposalFromDB` field expectations (snake_case keys). | Low | Build the nested array by looking up `disposal_items` by `disposal_id` and return the raw store fields; `mapDisposalFromDB` maps snake_case to camelCase. |
| 8 | `get_disposal_auto_code` canonical logic uses `COUNT(*) FROM disposals`, which can produce duplicate codes if disposals are deleted and recreated in the same test run. | Low | Mirror the canonical `COUNT(*)` behavior to stay faithful to the migration. If a test requires stable uniqueness, the test can seed disposals with distinct codes. |
| 9 | `process_import_v2` and `delete_import_v2` canonical functions call stored helpers (`sync_product_quantity_from_lots`, `insert_stock_ledger_entry`, `check_inventory_consistency`) that do not exist in the mock environment. | Low | The mock handler should directly update the relevant `products`/`product_lots` quantities and costs. Do not introduce new mock implementations of those stored helpers; the service only consumes the JSON return and the updated store rows. |
| 10 | Return-shape mismatch could break `mapImportReceiptFromDB` or `mapDisposalFromDB` type expectations in downstream UI code. | Low | Derive return keys from the canonical migration and align with the snake_case fields consumed by `mapImportReceiptFromDB` (`services/supabaseService.ts:153-177`) and `mapDisposalFromDB` (`services/supabaseService.ts:211-240`). |

---

## Validation Strategy

Implementation must later satisfy the following gates. Final coverage must be measured directly; it may not be estimated or inferred.

| # | Gate | Command / Criterion | Evidence |
|---|---|---|---|
| 1 | Canonical audit gate | `npx tsx scripts/audit-rpc-contracts.ts` exits 0; reports 300 migration RPCs, 183 code RPCs, 0 missing from migrations | Exit code and stdout |
| 2 | Type gate | `npx tsc --noEmit` exits 0 with no TypeScript errors | Exit code |
| 3 | Test gate | `npx vitest run` passes with no new failures | Exit code and test count |
| 4 | Direct coverage gate (multi-line `.rpc(` aware) | Scan `services/`, `lib/`, `utils/` for all `.rpc(` call sites and cross-reference with `if/else if (name === '...')` blocks in `tests/mocks/supabase.ts` | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` |
| 5 | Target coverage check | Direct measurement shows **182 of 184** code RPCs covered, with only H9 (`get_dashboard_summary`, `get_profit_report`) remaining missing | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` |
| 6 | Scope gate | `git diff --name-only` shows only `tests/mocks/supabase.ts` and test files changed | Git diff |
| 7 | Handler inventory gate | `tests/mocks/supabase.ts` contains exactly one handler block for each of the 12 authorized RPCs and no handler for any unauthorized RPC | Manual or script check |
| 8 | Verification report | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` is produced and independently confirms the above | Governance artifact |

The target coverage of **182 / 184** is a verification target only. It must not be reported as an achieved fact until `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` confirms it.

---

## Architecture Freeze

The architecture and scope for Recovery Wave-04 are frozen as of this document:

- **Architecture is frozen.** The implementation will use the existing flat `if (name === '...')` / `else if (name === '...')` dispatch pattern inside `tests/mocks/supabase.ts`.
- **Scope is frozen.** Exactly **12 RPCs** are authorized for Wave-04.
- **No additional RPCs may be added.** H9 (`get_dashboard_summary`, `get_profit_report`) and all other RPCs are explicitly excluded.
- **No authorized RPCs may be removed.** All 12 H7/H8 RPCs listed in the Authorized RPC Inventory must be implemented.
- **No cleanup, refactoring, redesign, or production changes are authorized.**
- Any scope change requires a new Authorization document and a new Engineering Kickoff.

---

## Acceptance Criteria

Recovery Wave-04 Engineering Kickoff is **PASS** only if all of the following are true:

1. Exactly 12 authorized RPCs are listed for Wave-04 (H7 = 8, H8 = 4).
2. No unauthorized RPC, cleanup task, or refactoring task has entered the scope.
3. No implementation has been performed in this document.
4. No code, mock, production, migration, schema, generated-type, package, or CI files have been modified.
5. The implementation sequence is complete and ordered by dependency.
6. The store plan is justified: each existing store is reused; each new store is required by at least one authorized RPC.
7. Helper reuse is documented and no new helpers are required.
8. The architecture freeze is explicitly declared.
9. The target coverage of **182 / 184** is clearly marked as a verification target only, not an achieved fact.
10. All required sections (Executive Summary, Engineering Baseline, Kickoff Readiness Review, Authorized RPC Inventory, Implementation Sequence, Store Planning, Helper Review, Implementation Strategy, Risk Review, Validation Strategy, Architecture Freeze, Acceptance Criteria, Stop Conditions, Engineering Decision) are present.

---

## Stop Conditions

Implementation must stop immediately and request a new Authorization if any of the following occur:

1. The authorized RPC inventory changes (more than 12, fewer than 12, or any RPC swapped).
2. A new domain, H9 RPC, cleanup task, or refactoring task is requested.
3. A canonical migration for any authorized RPC is missing or contradicts the contract described in this document.
4. Implementation requires a change to a production file, migration, schema, generated type, `package.json`, or CI workflow.
5. A handler for an unauthorized RPC is discovered in `tests/mocks/supabase.ts`.
6. An existing handler is accidentally modified or removed.
7. The canonical audit gate, type gate, or test gate fails and cannot be resolved by additive mock code.
8. Direct coverage measurement does not yield **182 / 184** for a reason other than the two H9 RPCs.
9. `git diff --name-only` includes files outside `tests/mocks/supabase.ts` and test files.

---

## Engineering Decision

**APPROVED.**

Recovery Wave-04 is authorized to proceed to implementation. The Engineering Kickoff converts the approved `RECOVERY_WAVE_04_ARCHITECTURE_DECISION.md` into the following executable plan:

- Implement 12 additive mock handlers in `tests/mocks/supabase.ts` for the H7/H8 RPCs listed in the Authorized RPC Inventory.
- Add two new in-memory store keys, `disposals` and `disposal_items`, inside `tests/mocks/supabase.ts`.
- Reuse existing helpers only (`uuid`, `currentTenantId`, `store` access); do not create new helpers.
- Preserve the existing flat dispatch pattern and do not touch existing handlers.
- Validate with the canonical audit gate, type gate, test gate, and direct multi-line `.rpc(` coverage measurement.
- Produce `RECOVERY_WAVE_04_IMPLEMENTATION_REPORT.md` and `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` after implementation.

No production code, migrations, schemas, generated types, packages, CI, or governance files are authorized for modification under this kickoff.

---

## Document Control

- **Read-only verification:** This document was produced without modifying any source code, mock, production file, migration, schema, generated type, package, or CI file.
- **Required reading completed:** `PHASE4_FORENSIC_INVESTIGATION_REPORT.md`, `PROGRAM_RECOVERY_AUTHORIZATION.md`, `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md`, `PHASE4_RECOVERY_MAPPING_VALIDATION.md`, `RECOVERY_WAVE_03_VERIFICATION_REPORT.md`, `RECOVERY_WAVE_04_AUTHORIZATION.md`, `RECOVERY_WAVE_04_ARCHITECTURE_DECISION.md`.
- **Implementation authority:** `RECOVERY_WAVE_04_ARCHITECTURE_DECISION.md`.
- **Deliverable:** `RECOVERY_WAVE_04_ENGINEERING_KICKOFF.md`.
