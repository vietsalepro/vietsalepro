# RECOVERY WAVE-04 Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Wave:** Recovery Wave-04  
**Domains:** H7 — Imports, H8 — Disposals  
**Document Type:** Architecture Decision  
**Date:** 2026-07-16  
**Authority:** Program Recovery Authorization Review  
**Status:** Architecture Decision — APPROVED  

---

## Executive Summary

Recovery Wave-04 is the next mock-coverage work unit in the Phase 4 Recovery Program. It authorizes mock handlers for exactly **12 code RPCs** in two domains:

- **H7 — Imports:** 8 RPCs
- **H8 — Disposals:** 4 RPCs, explicitly including `complete_disposal`

The authoritative baseline is the measured state in `RECOVERY_WAVE_03_VERIFICATION_REPORT.md`: **170 of 184** unique code RPCs already have mock handlers, leaving **14 missing** RPCs. Wave-04 covers the H7/H8 portion (12 RPCs). After Wave-04, the expected direct-measurement coverage is **182 of 184** (98.9%), with only the two H9 — Reports & Dashboard RPCs remaining uncovered.

This decision:

- reuses the correct parts of `CURRENT_TASK-022_ARCHITECTURE_DECISION.md` for H7,
- supersedes `CURRENT_TASK-023_ARCHITECTURE_DECISION.md` for H8 because that document omitted `complete_disposal` and used an outdated coverage baseline,
- confines all implementation to `tests/mocks/supabase.ts` and test files,
- prohibits production code, migration, schema, generated-type, package, CI, and governance changes,
- excludes H9, cleanup, and any refactoring.

No code is implemented by this document.

---

## Architecture Consistency Review

### Review method

`CURRENT_TASK-022_ARCHITECTURE_DECISION.md` (H7) and `CURRENT_TASK-023_ARCHITECTURE_DECISION.md` (H8) were compared against:

- the measured baseline in `RECOVERY_WAVE_03_VERIFICATION_REPORT.md`
- the authorized scope in `RECOVERY_WAVE_04_AUTHORIZATION.md`
- the cross-domain mapping validation in `PHASE4_RECOVERY_MAPPING_VALIDATION.md`
- the canonical migration chain in `supabase/migrations/`
- the production call sites in `services/supabaseService.ts`

`PHASE4_RECOVERY_MAPPING_VALIDATION.md` confirms that both H7 and H8 have a clean mapping: Canonical Migration = Coverage Roadmap = CURRENT_TASK Architecture Decision = Recovery Authorization. The `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` Domain B mapping correction does not affect H7 or H8 scope.

### Finding: H7 — `CURRENT_TASK-022` partially valid

`CURRENT_TASK-022_ARCHITECTURE_DECISION.md` remains **valid as a domain-scope and contract reference** for the 8 Import RPCs. All 8 RPCs, their canonical migration references, their parameter/return shapes, and the additive-only constraints match the verified Wave-03 baseline and the Wave-04 authorization.

Sections that remain reusable:

- **Authorized RPCs** — the 8 H7 RPC names are identical to the Wave-04 authorization.
- **Canonical Source** — the migration file and line references are correct.
- **Parameter and return contracts** — the canonical signatures and service call patterns are unchanged.
- **Constraints** — additive-only, no-refactor, no-abstraction, and scope-boundary rules still apply.
- **Implementation target** — `tests/mocks/supabase.ts`.

Sections that must be updated because of the Recovery Program:

- **Objective / Scope** — the "Wave 3g" framing and the coverage baseline are obsolete.
- **Dependency Verification** — claims about CURRENT_TASK-014/016/017/018 being "complete" cannot be verified from Git; only the working-tree handlers for H5/H6 added by Recovery Wave-03 are present. H7 handler behavior depends on the in-memory `import_receipts`, `import_items`, `suppliers`, `products`, and `product_lots` stores, not on the completion status of prior tasks.
- **Expected Coverage** — the 139/183 and 147/183 figures are cumulative-arithmetic values that were never measured against the file. The recovery baseline is **170/184** and the Wave-04 target is **182/184**.
- **Validation Plan** — the coverage gate must use the direct multi-line `.rpc(` measurement (184 denominator), not the canonical audit script's 183-denominator output.
- **Status / Next Step** — must be rewritten for the Recovery Program sequence (no separate CURRENT_TASK kickoff).

### Finding: H8 — `CURRENT_TASK-023` superseded

`CURRENT_TASK-023_ARCHITECTURE_DECISION.md` is **superseded for Recovery Wave-04** and must not be reused as the H8 architecture. The verified baseline requires a rebuilt H8 scope.

Reasons for supersession:

1. **Missing authorized RPC** — `CURRENT_TASK-023` authorized only 3 RPCs (`delete_disposal_with_restore`, `filter_disposals_rpc`, `get_disposal_auto_code`) and omitted `complete_disposal`. `RECOVERY_WAVE_03_VERIFICATION_REPORT.md` and `PHASE4_RECOVERY_MAPPING_VALIDATION.md` list `complete_disposal` as a required H8 RPC with a production call site at `services/supabaseService.ts:3520`.
2. **Outdated coverage baseline** — it uses `147 / 183` and `150 / 183` (82.0%) values from the original cumulative arithmetic. The recovery baseline is **170 / 184**.
3. **Unverified dependency claims** — it states "CURRENT_TASK-022 (Closed)" and references pre-Recovery acceptance records that the forensic investigation showed were never committed or verified.
4. **Incomplete canonical coverage** — it did not reference `complete_disposal` because it was never in scope.

The H8 architecture is therefore rebuilt from the verified recovery baseline and authorizes exactly **4 RPCs** including `complete_disposal`.

---

## Recovery Baseline

The only authoritative baseline is the direct measurement in `RECOVERY_WAVE_03_VERIFICATION_REPORT.md`.

| Metric | Before Wave-04 | After Wave-04 (target) | Source |
|---|---|---|---|
| Unique code RPCs | 184 | 184 | Direct multi-line `.rpc(` scan of `services/`, `lib/`, `utils/` |
| Code RPCs per canonical audit script | 183 | 183 | `npx tsx scripts/audit-rpc-contracts.ts` (undercounts `complete_disposal` because of multi-line call) |
| Matched (have mock handler) | 170 | 182 | Direct measurement |
| Missing (no mock handler) | 14 | 2 | Direct measurement |
| Coverage | 92.4% | 98.9% | `matched / 184` |
| Missing domains | H7 (8), H8 (4), H9 (2) | H9 (2) only | `RECOVERY_WAVE_03_VERIFICATION_REPORT.md` §6.1 |
| Canonical Audit Gate | PASS | PASS | Exit 0, 0 code RPCs missing from migrations |
| Type Gate | PASS | PASS | `npx tsc --noEmit` exits 0 |
| Test Gate | PASS | PASS | `npx vitest run` exits 0, no regressions |

The Wave-03 baseline changed from the pre-Recovery state as follows:

| | Before Wave-03 | After Wave-03 | Delta |
|---|---|---|---|
| Matched | 150 | 170 | +20 (H4/H5/H6 = 7 + 6 + 7) |
| Missing | 34 | 14 | -20 |
| Coverage | 81.5% | 92.4% | +10.9 pp |

Wave-04 adds the remaining H7/H8 delta of **12 RPCs**, moving coverage to **182/184**.

---

## Architecture Decisions

1. **Baseline denominator:** 184 unique code RPCs from the direct multi-line `.rpc(` scan is the Wave-04 coverage denominator. The canonical audit script's 183-denominator output may be referenced for the audit gate but not for coverage math.
2. **H7 scope reuse:** The 8 H7 RPCs and their contracts from `CURRENT_TASK-022_ARCHITECTURE_DECISION.md` are retained. Its coverage/dependency/validation sections are replaced with the recovery baseline.
3. **H8 scope rebuild:** H8 is redefined to 4 RPCs including `complete_disposal`. `CURRENT_TASK-023_ARCHITECTURE_DECISION.md` is superseded.
4. **Implementation target:** All new handlers are added to `tests/mocks/supabase.ts` only.
5. **Dispatch pattern:** Existing flat `if (name === '...')` / `else if (name === '...')` chain must be preserved. New handlers are appended; no existing handler may be removed or changed in behavior.
6. **Contract source:** Handler parameter names, return shapes, and default values are derived from the canonical migration chain, then adjusted to match how `services/supabaseService.ts` consumes the returned data.
7. **Store model:** New in-memory store keys may be added inside `tests/mocks/supabase.ts` if a domain has no existing store (for example, `disposals` and `disposal_items` for H8). No production schema or migration changes are allowed.
8. **Scope lock:** No H9 RPCs, no cleanup, no refactoring, no dependency upgrades, no production-code changes, and no new packages.
9. **Verification:** Wave-04 closes only when direct measurement shows 182/184, the three gates pass, and `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` is produced.

---

## Authorized RPC Inventory

| # | Domain | RPC | Canonical Migration | Production Call Site | Service Function |
|---|---|---|---|---|---|
| 1 | H7 | `delete_import_v2` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql:5384` | `services/supabaseService.ts:1955` | `deleteImportReceipt` |
| 2 | H7 | `filter_import_receipts_rpc` | `...:6170` and `:6208` (two overloaded signatures) | `services/supabaseService.ts:1830` | `filterImportReceiptsPaginated` |
| 3 | H7 | `get_import_receipt_count_by_date` | `...:7570` | `services/supabaseService.ts:1690` | `getImportReceiptCountByDate` |
| 4 | H7 | `get_import_receipts_by_product_and_lot` | `...:7578` | `services/supabaseService.ts:1748` | `getImportReceiptsByProductAndLot` |
| 5 | H7 | `get_import_receipts_by_supplier_id` | `...:7618` | `services/supabaseService.ts:1739` | `getImportReceiptsBySupplierId` |
| 6 | H7 | `get_import_stats` | `...:7644` | `services/supabaseService.ts:1675` | `getImportStats` |
| 7 | H7 | `process_import_v2` | `...:10865` | `services/supabaseService.ts:1880` | `createImportReceipt` |
| 8 | H7 | `update_import_v2` | `...:12649` | `services/supabaseService.ts:1937` | `updateImportReceipt` |
| 9 | H8 | `complete_disposal` | `...:3463` | `services/supabaseService.ts:3520` | `completeDisposal` |
| 10 | H8 | `delete_disposal_with_restore` | `...:5355` | `services/supabaseService.ts:3587` | `deleteDisposal` |
| 11 | H8 | `filter_disposals_rpc` | `...:6093` | `services/supabaseService.ts:3437` | `filterDisposalsPaginated` |
| 12 | H8 | `get_disposal_auto_code` | `...:7347` | `services/supabaseService.ts:3454` | `createDisposal` |

**Total authorized RPCs: 12.**

No other RPCs are authorized for Wave-04.

---

## Canonical Migration References

All authoritative contracts are in the ordered canonical migration chain.

| RPC | Migration File | Line(s) | Notes |
|---|---|---|---|
| `delete_import_v2` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5384 | `SECURITY DEFINER`, `RETURNS jsonb` |
| `filter_import_receipts_rpc` | same | 6170, 6208 | Two `STABLE` overloaded signatures; the second adds `p_status text` |
| `get_import_receipt_count_by_date` | same | 7570 | `STABLE`, `RETURNS integer` |
| `get_import_receipts_by_product_and_lot` | same | 7578 | `STABLE`, `RETURNS json` |
| `get_import_receipts_by_supplier_id` | same | 7618 | `STABLE`, `RETURNS json` |
| `get_import_stats` | same | 7644 | `STABLE`, `RETURNS json` |
| `process_import_v2` | same | 10865 | `SECURITY DEFINER`, `RETURNS jsonb` |
| `update_import_v2` | same | 12649 | `SECURITY DEFINER`, `RETURNS jsonb` |
| `complete_disposal` | same | 3463 | `RETURNS TABLE(id text, code text, status text)` |
| `delete_disposal_with_restore` | same | 5355 | `RETURNS void` |
| `filter_disposals_rpc` | same | 6093 | `STABLE`, `RETURNS json` |
| `get_disposal_auto_code` | same | 7347 | `RETURNS text` |

<ref_file file="c:/PROJECT/vietsalepro/supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql" />

---

## Production Call Sites

All 12 authorized RPCs are called from `services/supabaseService.ts`.

| RPC | Call Site | Service Function | Service Behavior |
|---|---|---|---|
| `delete_import_v2` | `services/supabaseService.ts:1955` | `deleteImportReceipt(id)` | Calls RPC with `p_receipt_id`; returns `data` |
| `filter_import_receipts_rpc` | `services/supabaseService.ts:1830` | `filterImportReceiptsPaginated(...)` | Passes all filter/pagination params; maps `result.receipts` with `mapImportReceiptFromDB` |
| `get_import_receipt_count_by_date` | `services/supabaseService.ts:1690` | `getImportReceiptCountByDate(date)` | Passes `p_date`; casts `data` to `number` |
| `get_import_receipts_by_product_and_lot` | `services/supabaseService.ts:1748` | `getImportReceiptsByProductAndLot(productId, lotId)` | Passes `p_product_id` and `p_lot_id`; maps `data || []` with `mapImportReceiptFromDB` |
| `get_import_receipts_by_supplier_id` | `services/supabaseService.ts:1739` | `getImportReceiptsBySupplierId(supplierId, limit)` | Passes `p_supplier_id` and `p_limit`; maps `data || []` with `mapImportReceiptFromDB` |
| `get_import_stats` | `services/supabaseService.ts:1675` | `getImportStats(fromDate, toDate)` | Passes `p_from_date`, `p_to_date`; returns object |
| `process_import_v2` | `services/supabaseService.ts:1880` | `createImportReceipt(receipt)` | Builds normalized JSONB payload; passes `p_payload`; returns `data` |
| `update_import_v2` | `services/supabaseService.ts:1937` | `updateImportReceipt(receipt)` | Builds normalized JSONB payload; passes `p_receipt_id` and `p_payload`; returns `data` |
| `complete_disposal` | `services/supabaseService.ts:3520` | `completeDisposal(id)` | Multi-line `.rpc(` call; passes `p_disposal_id`; service ignores returned rows and re-fetches disposal via `getDisposalById` |
| `delete_disposal_with_restore` | `services/supabaseService.ts:3587` | `deleteDisposal(id)` | Passes `p_disposal_id`; returns nothing |
| `filter_disposals_rpc` | `services/supabaseService.ts:3437` | `filterDisposalsPaginated(...)` | Passes filter/pagination params; maps `result.disposals` with `mapDisposalFromDB` |
| `get_disposal_auto_code` | `services/supabaseService.ts:3454` | `createDisposal(disposal)` | No params; uses returned string as disposal code |

<ref_file file="c:/PROJECT/vietsalepro/services/supabaseService.ts" />

---

## Parameter Contracts

| # | RPC | Parameters (canonical type) | Service call arguments |
|---|---|---|---|
| 1 | `delete_import_v2` | `p_receipt_id text` | `id: string` |
| 2 | `filter_import_receipts_rpc` | `p_search_term text DEFAULT NULL`, `p_page integer DEFAULT 1`, `p_page_size integer DEFAULT 20`, `p_from_date date DEFAULT NULL`, `p_to_date date DEFAULT NULL`, `p_supplier_id text DEFAULT NULL`, and (second overload) `p_status text DEFAULT NULL` | `searchTerm \|\| null`, `page`, `pageSize`, `filters.fromDate \|\| null`, `filters.toDate \|\| null`, `filters.supplierId \|\| null`, `filters.status \|\| null` |
| 3 | `get_import_receipt_count_by_date` | `p_date date` | `date: string` |
| 4 | `get_import_receipts_by_product_and_lot` | `p_product_id text`, `p_lot_id text DEFAULT NULL` | `productId: string`, `lotId: string` |
| 5 | `get_import_receipts_by_supplier_id` | `p_supplier_id text`, `p_limit integer DEFAULT 100` | `supplierId: string`, `limit: number = 10` |
| 6 | `get_import_stats` | `p_from_date date DEFAULT NULL`, `p_to_date date DEFAULT NULL` | `fromDate: string`, `toDate: string` |
| 7 | `process_import_v2` | `p_payload jsonb` | Normalized object: `id`, `invoice_number`, `date`, `supplier_id`, `supplier_name`, `total_cost`, `shipping_cost`, `discount_total`, `paid_amount`, `debt_recorded`, `status`, `note`, `items[]` |
| 8 | `update_import_v2` | `p_receipt_id text`, `p_payload jsonb` | `id: string`, normalized payload object (same fields as `process_import_v2`) |
| 9 | `complete_disposal` | `p_disposal_id text` | `id: string` |
| 10 | `delete_disposal_with_restore` | `p_disposal_id text` | `id: string` |
| 11 | `filter_disposals_rpc` | `p_search_term text DEFAULT NULL`, `p_page integer DEFAULT 1`, `p_page_size integer DEFAULT 20`, `p_from_date date DEFAULT NULL`, `p_to_date date DEFAULT NULL`, `p_status text DEFAULT NULL` | `searchTerm \|\| null`, `page`, `pageSize`, `filters.fromDate \|\| null`, `filters.toDate \|\| null`, `filters.status \|\| null` |
| 12 | `get_disposal_auto_code` | none | none |

---

## Return Contracts

| # | RPC | Canonical return type | Return shape consumed by service |
|---|---|---|---|
| 1 | `delete_import_v2` | `jsonb` | For a draft receipt: `{ receipt_id, status: 'draft_deleted' }`. For a completed receipt: `{ receipt_id, affected_products: text[], total_qty_removed: numeric, status: 'completed_deleted' }`. |
| 2 | `filter_import_receipts_rpc` | `json` | `{ receipts: import_receipts_row[], totalCount: integer }`. Service maps each receipt through `mapImportReceiptFromDB`, which expects `import_items` to be present (may be empty). |
| 3 | `get_import_receipt_count_by_date` | `integer` | A count cast to `number`. |
| 4 | `get_import_receipts_by_product_and_lot` | `json` | JSON array of import receipt rows, each with a nested `import_items` array. Service maps through `mapImportReceiptFromDB`. |
| 5 | `get_import_receipts_by_supplier_id` | `json` | JSON array of import receipt rows, each with a nested `import_items` array. Service maps through `mapImportReceiptFromDB`. |
| 6 | `get_import_stats` | `json` | `{ totalCount: integer, totalCost: numeric, totalShipping: numeric, totalPaid: numeric, totalDebt: numeric }`. |
| 7 | `process_import_v2` | `jsonb` | `{ receipt_id: text, affected_products: text[], total_qty_added: numeric, status: text }`. |
| 8 | `update_import_v2` | `jsonb` | Same shape as `process_import_v2` because it delegates to `delete_import_v2` then `process_import_v2`. |
| 9 | `complete_disposal` | `TABLE(id text, code text, status text)` | Supabase returns an array of result rows. Service ignores the rows and re-fetches the disposal via `getDisposalById`, so the mock need only return a valid row array; service correctness is verified by the subsequent fetch. |
| 10 | `delete_disposal_with_restore` | `void` | No data is consumed; the function only performs side effects. |
| 11 | `filter_disposals_rpc` | `json` | `{ disposals: disposals_row_with_nested_disposal_items[], totalCount: integer }`. Service maps `disposals` through `mapDisposalFromDB`, which expects `disposal_items` to be present. |
| 12 | `get_disposal_auto_code` | `text` | A string auto-code (e.g., `XH000001`). Service assigns this to the disposal `code` field. |

---

## Implementation Pattern

### Target file

All new code is added to `tests/mocks/supabase.ts`.

### Dispatch style

- Preserve the existing flat `if (name === '...')` / `else if (name === '...')` chain.
- Add one handler block per authorized RPC.
- Do not introduce helper functions, factories, or shared utilities.
- Keep each handler self-contained and deterministic.

### Handler content

- Read parameters from the `params` object.
- Return `{ data: <value>, error: null }` on success.
- Return `{ data: null, error: { code, message } }` on validation or not-found failures.
- For functions that raise `RAISE EXCEPTION` in the migration, return a business-error object with a non-zero exit path.

### Store usage

- Use the existing `store: Record<string, Row[]>` object.
- `import_receipts` and `import_items` were added by Recovery Wave-03; `suppliers`, `products`, and `product_lots` already exist.
- `disposals` and `disposal_items` do not currently exist in `store`. The implementation may add them as new keys inside `tests/mocks/supabase.ts` to support H8 handlers, following the same additive pattern Wave-03 used for H4/H5/H6 store keys.
- `resetMockData()` already resets every key in `store` by `Object.keys(store)`, so new keys are reset automatically.

### Return-value fidelity

- JSON/JSONB return values must be the parsed objects/arrays the Supabase JS client would return.
- Numeric values may be returned as JavaScript numbers.
- Date strings should be ISO 8601 where the service performs date comparisons.

---

## Scope Boundary

### In scope

- Mock handlers for the 12 authorized H7/H8 RPCs in `tests/mocks/supabase.ts`.
- Optional new in-memory store keys inside `tests/mocks/supabase.ts` for `disposals` and `disposal_items`.
- Test files that exercise the new handlers.
- `RECOVERY_WAVE_04_IMPLEMENTATION_REPORT.md` and `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` after implementation.

### Out of scope

- H9 — Reports & Dashboard (`get_dashboard_summary`, `get_profit_report`).
- Any RPC not listed in the Authorized RPC Inventory.
- Production code changes (`services/`, `lib/`, `utils/`, UI components).
- Database schema or migration changes.
- Generated types (`database.types.ts`).
- `package.json`, CI workflows, or infrastructure changes.
- Cleanup of the pre-existing duplicate `get_tenant_members_with_email` handler.
- Refactoring, redesign, or abstraction in `tests/mocks/supabase.ts`.

---

## Constraints

1. **Additive only** — new handlers may be added; no existing handler may be removed or altered in a way that changes current test behavior.
2. **No refactor** — do not restructure `tests/mocks/supabase.ts`.
3. **No redesign** — do not change the service-to-mock contract or dispatch pattern.
4. **No abstraction** — no new shared mock utilities, factories, or generators.
5. **One handler per RPC name** — `filter_import_receipts_rpc` has two canonical signatures but is handled by a single block.
6. **No stale mock** — every added handler must correspond to a code RPC call site and a canonical migration.
7. **Canonical source** — shapes, parameters, and return values are derived from `supabase/migrations/` and verified against `services/supabaseService.ts`.
8. **No boundary crossing** — no production, migration, schema, generated-type, package, or CI changes.
9. **No scope expansion** — do not mock H9 or any other RPC.
10. **No cleanup** — leave the pre-existing duplicate `get_tenant_members_with_email` and the orphan `update_tenant_status` handler untouched.

---

## Validation Strategy

| # | Gate | Command / Criterion | Evidence |
|---|---|---|---|
| 1 | Canonical audit gate | `npx tsx scripts/audit-rpc-contracts.ts` exits 0; reports 300 migration RPCs, 183 code RPCs, 0 missing from migrations. | Standard recovery gate. |
| 2 | Type gate | `npx tsc --noEmit` exits 0 with no TypeScript errors. | No type regressions. |
| 3 | Test gate | `npx vitest run` passes with no new failures. | 68 test files, 389+ tests. |
| 4 | Coverage gate (direct) | Direct multi-line `.rpc(` scan of `services/`, `lib/`, `utils/` shows **182 of 184** code RPCs with a matching handler in `tests/mocks/supabase.ts`; only H9 remains missing. | Uses the same measurement as `RECOVERY_WAVE_03_VERIFICATION_REPORT.md`. |
| 5 | Scope gate | `git diff --name-only` (or equivalent) shows only `tests/mocks/supabase.ts` and test files changed. | No production, migration, or infrastructure files. |
| 6 | Handler inventory gate | `tests/mocks/supabase.ts` contains exactly one handler block for each of the 12 authorized RPCs and no handler for any unauthorized RPC. | Manual or script check. |
| 7 | Verification report | `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` is produced and independently confirms the above. | Governance artifact. |

---

## Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | `filter_import_receipts_rpc` has two overloaded canonical signatures; a single handler must accept both sets of parameters. | Low | One handler reads `p_status` optionally and filters when it is non-null; both overloads return the same `{ receipts, totalCount }` shape. |
| 2 | `complete_disposal` is invoked via a multi-line `.rpc(` call and was omitted from `CURRENT_TASK-023`. Implementers might skip it. | Medium | Include `complete_disposal` explicitly in the Wave-04 implementation and verification checklists; coverage measurement must count it. |
| 3 | `disposals` and `disposal_items` in-memory stores do not yet exist; H8 handlers need them. | Low | Add them inside `tests/mocks/supabase.ts` as new `store` keys; no schema or production changes. |
| 4 | H9 or out-of-scope RPCs could be accidentally included. | Medium | Scope gate rejects any change outside the 12 authorized RPCs. |
| 5 | The canonical audit script undercounts code RPCs by one (`complete_disposal`) because its regex requires `supabase.rpc('name'` on a single line. | Medium | Use direct multi-line scan (184 denominator) for coverage; keep audit gate for migration-subset validation only. |
| 6 | `get_import_receipts_by_supplier_id` canonical migration joins `import_items` on `ii.import_receipt_id`, while the actual store rows and other handlers use `receipt_id`. | Low | Implement the handler using the store's real `receipt_id` column while preserving the canonical return shape. |
| 7 | Working-tree changes remain uncommitted; loss before commit would force redo. | Low | Implementation should be committed as part of normal recovery workflow; this architecture decision does not alter git state. |
| 8 | Pre-existing duplicate `get_tenant_members_with_email` and orphan `update_tenant_status` handlers remain; touching them could cause regressions. | Low | Explicitly out of scope; do not modify. |

---

## Acceptance Criteria

Wave-04 implementation is accepted when all of the following are true:

1. Mock handlers exist for all 12 authorized RPCs in `tests/mocks/supabase.ts`.
2. No existing handler is removed or changed in behavior.
3. No handler is added for an unauthorized RPC.
4. `npx tsx scripts/audit-rpc-contracts.ts` exits 0 with 0 code RPCs missing from migrations.
5. `npx tsc --noEmit` exits 0 with no TypeScript errors.
6. `npx vitest run` passes with no regressions.
7. Direct multi-line `.rpc(` measurement shows **182 / 184** code RPCs covered, with only the 2 H9 RPCs remaining uncovered.
8. `git diff --name-only` is limited to `tests/mocks/supabase.ts` and test files.
9. `RECOVERY_WAVE_04_VERIFICATION_REPORT.md` is produced and independently confirms the measurements.

---

## Final Architecture Decision

**APPROVED.**

Recovery Wave-04 is authorized to add mock handlers for exactly **12 RPCs** in `tests/mocks/supabase.ts`:

- **H7 — Imports (8 RPCs):** `delete_import_v2`, `filter_import_receipts_rpc`, `get_import_receipt_count_by_date`, `get_import_receipts_by_product_and_lot`, `get_import_receipts_by_supplier_id`, `get_import_stats`, `process_import_v2`, `update_import_v2`.
- **H8 — Disposals (4 RPCs):** `complete_disposal`, `delete_disposal_with_restore`, `filter_disposals_rpc`, `get_disposal_auto_code`.

`CURRENT_TASK-022_ARCHITECTURE_DECISION.md` is valid for H7 RPC inventory, canonical references, contracts, and constraints, but its coverage, dependency, and validation sections are superseded by the Wave-03 verified baseline.

`CURRENT_TASK-023_ARCHITECTURE_DECISION.md` is **superseded** for H8 because it omitted `complete_disposal` and used an obsolete coverage baseline; the H8 architecture is rebuilt from the verified recovery baseline.

The implementation must be additive only, preserve the existing flat dispatch pattern, derive all behavior from the canonical migration chain, and make no changes to production code, migrations, schema, generated types, packages, or CI.

The expected outcome is **182 / 184** direct-measurement mock coverage, leaving only the 2 H9 RPCs for a later wave.
