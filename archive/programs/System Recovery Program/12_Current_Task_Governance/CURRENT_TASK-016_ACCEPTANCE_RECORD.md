# CURRENT_TASK-016 — Acceptance Record

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3a — Domain H1 — Products & Catalog Mock Coverage  
**Document Type:** Program Manager Acceptance Record (Independent Acceptance Review)  
**Date:** 2026-07-15  
**Status:** Accepted with Minor Notes  
**Authorizing CURRENT_TASK:** CURRENT_TASK-016 — Products & Catalog Mock Coverage (Wave 3a / TASK-H1)  
**Architecture Decision:** `CURRENT_TASK-016_ARCHITECTURE_DECISION.md`  
**Implementation Report:** `CURRENT_TASK-016_IMPLEMENTATION_REPORT.md`  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-016_ARCHITECTURE_DECISION.md`, `CURRENT_TASK-016_IMPLEMENTATION_REPORT.md`, `CURRENT_TASK-015_ACCEPTANCE_RECORD.md`, `PHASE4_COVERAGE_ROADMAP.md`, `supabase/migrations/*.sql` (canonical source)

---

> **This is an Independent Acceptance Review.** All conclusions are based on evidence independently reproduced by the Program Manager. No conclusion relies on the Engineering Team's self-assessment.

---

## 1. Objective

Independently verify that CURRENT_TASK-016 — Products & Catalog Mock Coverage — was implemented in full conformance with `CURRENT_TASK-016_ARCHITECTURE_DECISION.md`, and that the coverage milestone **M3 (Progress) — 57.4%** is reached with zero regression and zero contract impact.

---

## 2. Scope

| Dimension | Authorized Scope | Verified Scope |
|---|---|---|
| Domain | Domain H1 — Products & Catalog only | Domain H1 only — confirmed |
| RPC count | Exactly 11 unique RPCs | 11 unique RPCs — confirmed |
| Files permitted to change | `tests/mocks/supabase.ts` (+ optional `tests/**`) | `tests/mocks/supabase.ts` only — confirmed |
| Change nature | Additive only (no existing handler modified/removed) | Additive only — confirmed (see §5) |
| Out of scope | Production code, migrations, schema, types, audit script, CI, `package.json`, new files | None touched by this task — confirmed (see §5) |

---

## 3. Evidence Reviewed

| # | Evidence | Source | Independently Reproduced |
|---|---|---|---|
| 1 | `SYSTEM_RECOVERY_MASTER_PLAN.md` | Program governance | Read in full |
| 2 | `CURRENT_PHASE.md` | Phase 4 governance | Read in full |
| 3 | `CURRENT_TASK-016_ARCHITECTURE_DECISION.md` | Task authorization | Read in full |
| 4 | `CURRENT_TASK-016_IMPLEMENTATION_REPORT.md` | Engineering self-report | Read in full (not relied upon for conclusions) |
| 5 | `tests/mocks/supabase.ts` (lines 427–461, 2691–2856) | Implementation | Read in full; all 11 handlers and `buildProductRow` inspected |
| 6 | `supabase/migrations/20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` | Canonical source | Read in full for the 4 redefined H1 RPCs (`search_products_rpc`, `get_product_by_barcode`, `check_product_code_exists`, `filter_products_rpc`) |
| 7 | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | Canonical source | Read at the 7 function locations defining the remaining H1 RPCs (`check_product_barcode_exists`, `count_point_products`, `get_product_stats`, `get_brand_product_counts`, `get_category_product_counts`, `get_unsynced_brands`, `get_unsynced_categories`) |
| 8 | `npx tsx scripts/audit-rpc-contracts.ts` | Audit gate | Independently executed — exit 0, stale mock = 0, duplicate = 0, coverage = 57.4% |
| 9 | `npx tsc --noEmit` | Type gate | Independently executed — exit 0 |
| 10 | `npx vitest run` | Test gate | Independently executed — 68 files, 389 tests, all PASS |
| 11 | Service call-site grep (1 file) | Call-site verification | Independently executed — all 11 call-sites confirmed at claimed lines in `services/supabaseService.ts` |
| 12 | `PHASE4_COVERAGE_ROADMAP.md` | Roadmap conformance | Read; Domain H1 / Wave 3a / 11 RPCs / 51.4%→57.4% confirmed |
| 13 | `CURRENT_TASK-015_ACCEPTANCE_RECORD.md` | Working-tree baseline | Read; prior uncommitted changes attributed to CURRENT_TASK-010…015 |

---

## 4. Architecture Compliance

Each requirement from `CURRENT_TASK-016_ARCHITECTURE_DECISION.md` §8 Constraints, independently verified:

| # | Requirement | PASS / FAIL | Independent Evidence |
|---|---|---|---|
| 1 | No feature development / architecture redesign / scope expansion | **PASS** | Only mock handler blocks added to `tests/mocks/supabase.ts`; no production logic touched. |
| 2 | No modification of production code, migrations, schema, generated types, CI, `package.json` | **PASS** | `git status` confirms modified files outside `tests/mocks/supabase.ts` are from prior accepted tasks (CURRENT_TASK-010…015), as documented in `CURRENT_TASK-015_ACCEPTANCE_RECORD.md` §4 and §12. Not attributable to CURRENT_TASK-016. |
| 3 | No new files / scripts / governance artifacts (report excepted) | **PASS** | No new scripts or mock files introduced by this task. |
| 4 | Implementation inside an approved CURRENT_TASK | **PASS** | CURRENT_TASK-016 authorized by `CURRENT_TASK-016_ARCHITECTURE_DECISION.md`. |
| 5 | Mock handlers follow the existing `if (name === '...')` dispatch pattern | **PASS** | All 11 handlers inspected use `if (name === '<rpc>')`. No Map dispatch or new abstraction introduced. |
| 6 | Mock return shapes match canonical migration function signatures (RETURNS + params) | **PASS** | All 11 RPCs independently verified against canonical migration `RETURNS` clauses, parameter lists, and `json_build_object` keys (see §6). `filter_products_rpc` correctly covers both 7-arg and 8-arg canonical overloads. |
| 7 | Additive only — no modification/removal of the existing 95 handlers | **PASS** | 11 new handler blocks are insertions before the fallback at line 2858. Audit gate confirms 106 total handlers, 0 duplicates. Fallback block `return { data: null, error: { code: 'PGRST116', message: 'RPC not found' } }` intact. |
| 8 | Audit script frozen (not modified) | **PASS** | `scripts/audit-rpc-contracts.ts` changes visible in `git status` are from CURRENT_TASK-012/013, accepted and frozen prior. Not modified by CURRENT_TASK-016. |
| 9 | No mock for an RPC not in the canonical migration chain | **PASS** | Audit stale-mock gate: "All mock RPC handlers are defined in the canonical migration chain." 0 stale mocks. |
| 10 | No duplicate handler for an already-mocked RPC | **PASS** | Audit duplicate-handler gate: "No duplicate mock RPC handlers." 0 duplicates. |

**Architecture Compliance: PASS (10/10 constraints honored)**

---

## 5. Scope Compliance

| Check | Result | Evidence |
|---|---|---|
| Only Domain H1 | **PASS** | All 11 mocked RPCs belong to Domain H1 — Products & Catalog. No RPC from domains A, B, C–G, H2–H9 added. |
| Exactly 11 RPCs | **PASS** | 11 unique `if (name === '...')` blocks added: `search_products_rpc` (line 2694), `get_product_by_barcode` (line 2713), `get_product_stats` (line 2722), `check_product_code_exists` (line 2743), `check_product_barcode_exists` (line 2750), `filter_products_rpc` (line 2758), `get_category_product_counts` (line 2803), `get_brand_product_counts` (line 2814), `get_unsynced_categories` (line 2825), `get_unsynced_brands` (line 2839), `count_point_products` (line 2853). |
| Additive-only | **PASS** | 11 new handler blocks + 1 new local helper `buildProductRow` are all insertions. No existing handler block modified by this task. |
| No existing handler modified | **PASS** | Audit confirms 106 handlers (95 prior + 11 new), 0 duplicates. All 11 new handlers at line positions after the prior handlers, before the fallback. |
| No dispatch reorder | **PASS** | Same `if (name === '...')` dispatch pattern; no Map refactor, no new abstraction. Fallback block intact at line 2858. |
| No scope expansion | **PASS** | No production code, migrations, schema, types, audit script, CI, or `package.json` modified by this task. Other modified files in working tree are from prior accepted tasks. |

**Scope Compliance: PASS**

---

## 6. Traceability Review

All 11 new mock handlers are traced to their canonical `CREATE [OR REPLACE] FUNCTION public.<name>` declaration in the forward migration chain. Independently verified by reading each migration file and comparing `RETURNS` clauses, `json_build_object` keys, parameter lists, and guard chains against the mock implementation.

| Mock RPC | Service (call-site) | Canonical Migration File | Migration Line | RETURNS | Mock Shape | Verified |
|---|---|---|---|---|---|---|
| `search_products_rpc` | `services/supabaseService.ts:430` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` | 231 | `TABLE(id, name, display_name, code, barcode, price, cost, quantity, unit, location, category, brand, image, min_stock, max_stock, safety_stock, is_point_accumulation_enabled, conversion_units, created_at, has_lots, category_id, brand_id, product_lots)` | Array of rows built by `buildProductRow`; `p_search_term` substring match on name/sku/barcode; `p_limit` default 100. | **PASS** |
| `get_product_by_barcode` | `services/supabaseService.ts:439` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` | 284 | Same 23-column `TABLE(...)` as above | Single-element array built by `buildProductRow`; lookup by `barcode`. | **PASS** |
| `get_product_stats` | `services/supabaseService.ts:491` | `20250703000000_baseline_pre_tenant_schema.sql` | 8084 | `JSON` | `{ total, active, lowStock, outOfStock, inventoryValue }`. Matches `json_build_object` keys. | **PASS** |
| `check_product_code_exists` | `services/supabaseService.ts:503` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` | 82 | `BOOLEAN` | `store.products.some(p => p.sku === params.p_code)`. Canonical checks `products.sku = p_code`. | **PASS** |
| `check_product_barcode_exists` | `services/supabaseService.ts:509` | `20250703000000_baseline_pre_tenant_schema.sql` | 3276 | `BOOLEAN` | `store.products.some(p => p.barcode === params.p_barcode)`. Canonical checks `products.barcode = p_barcode`. | **PASS** |
| `filter_products_rpc` | `services/supabaseService.ts:520` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` | 346 | `JSON` | `{ products: [...], totalCount: N }`. Covers both 7-arg and 8-arg overloads; filters by search term, category, brand, stock status; sorts by name/quantity/price/created_at. | **PASS** |
| `get_category_product_counts` | `services/supabaseService.ts:1709` | `20250703000000_baseline_pre_tenant_schema.sql` | 6717 | `JSON` | Array `{ id, product_count }` for each `store.categories`. Matches canonical `LEFT JOIN ... GROUP BY c.id`. | **PASS** |
| `get_brand_product_counts` | `services/supabaseService.ts:1715` | `20250703000000_baseline_pre_tenant_schema.sql` | 6698 | `JSON` | Array `{ id, product_count }` for each `store.brands`. Matches canonical `LEFT JOIN ... GROUP BY b.id`. | **PASS** |
| `get_unsynced_categories` | `services/supabaseService.ts:1721` | `20250703000000_baseline_pre_tenant_schema.sql` | 9624 | `JSON` | Array `{ name }` of distinct trimmed product categories not present in `store.categories`. Matches canonical `NOT EXISTS` logic. | **PASS** |
| `get_unsynced_brands` | `services/supabaseService.ts:1727` | `20250703000000_baseline_pre_tenant_schema.sql` | 9603 | `JSON` | Array `{ name }` of distinct trimmed product brands not present in `store.brands`. Matches canonical `NOT EXISTS` logic. | **PASS** |
| `count_point_products` | `services/supabaseService.ts:1733` | `20250703000000_baseline_pre_tenant_schema.sql` | 3822 | `INTEGER` | `store.products.filter(p => p.is_point_accumulation_enabled === true).length`. Matches canonical `COUNT(*) ... WHERE is_point_accumulation_enabled = true`. | **PASS** |

**Traceability Matrix: PASS (11/11)**

---

## 7. Shared Product Row Builder

A local helper `buildProductRow` was added inside the existing `rpc()` function. Independent verification:

- Used by `search_products_rpc` and `get_product_by_barcode`: **yes**.
- Column set matches the canonical `RETURNS TABLE` clause from the latest migration (`20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql`): **yes**.
- `product_lots` sorted by `expiry_date` ASC then `created_at` ASC, matching canonical `jsonb_agg(... ORDER BY pl.expiry_date ASC, pl.created_at ASC)`: **yes**.
- Does not alter the dispatch architecture; scoped inside `rpc()`: **yes**.

**Shared Product Row: PASS**

> Note: The implementation report states "24 canonical columns," but the canonical `RETURNS TABLE` clauses for `search_products_rpc` and `get_product_by_barcode` contain 23 columns. The mock `buildProductRow` correctly implements those 23 columns; the discrepancy is a documentation count error, not an implementation defect. See Minor Notes §12.

---

## 8. Validation Evidence

### 8.1 Audit Gate

```text
Migration RPCs : 300
Code RPCs      : 183
Mock RPCs      : 106 (106 handler blocks)

All service-layer RPC calls are defined in the canonical migration chain.

All mock RPC handlers are defined in the canonical migration chain.

No duplicate mock RPC handlers.

Mock coverage report (informational — does not fail):
  Total code RPCs : 183
  Total mock RPCs : 106
  Covered         : 105
  Uncovered       : 78
  Coverage        : 57.4%

Audit PASSED.
```

**Result: PASS — Exit 0, stale mock = 0, duplicate = 0, coverage = 57.4%**

### 8.2 TypeScript Gate

```text
npx tsc --noEmit
Exit code: 0
```

**Result: PASS**

### 8.3 Test Gate

```text
npx vitest run
Test Files  68 passed (68)
     Tests  389 passed (389)
  Duration  30.09s
```

**Result: PASS — No regression vs CURRENT_TASK-015 baseline (68 files, 389 tests).**

---

## 9. Coverage Delta

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| Covered RPC | 94 | 105 | +11 |
| Uncovered RPC | 89 | 78 | -11 |
| Coverage | 51.4% | 57.4% | +6.0 pp |

Source: `npx tsx scripts/audit-rpc-contracts.ts` run independently on 2026-07-15.

**Coverage Delta: PASS**

---

## 10. Regression

| Check | Result | Evidence |
|---|---|---|
| Local helper does not affect older handlers | **PASS** | `buildProductRow` is declared inside `rpc()` but not invoked by any pre-existing handler; no signature or behavior change in older blocks. |
| Fallback unchanged | **PASS** | Line 2858 still returns `{ data: null, error: { code: 'PGRST116', message: 'RPC not found' } }`. |
| Dispatch chain unchanged | **PASS** | Sequential `if (name === '...')` chain preserved; no Map-based refactor. |
| No duplicate handlers | **PASS** | Audit gate: "No duplicate mock RPC handlers." |
| No stale mocks | **PASS** | Audit gate: "All mock RPC handlers are defined in the canonical migration chain." |
| Test suite green | **PASS** | `npx vitest run` — 389/389 tests pass. |

**Regression: PASS**

---

## 11. Contract Impact

No production contract, schema, migration, generated type, or service-layer signature was modified.

**Contract Impact: None**

---

## 12. Governance

| Principle | Assessment |
|---|---|
| **Scope Lock** | **PASS** — Exactly 11 Domain H1 RPCs mocked; no other domain or out-of-scope file changed for this task. |
| **Canonical-first** | **PASS** — All 11 mock shapes derived directly from canonical migration `CREATE [OR REPLACE] FUNCTION` declarations. |
| **One Domain per CURRENT_TASK** | **PASS** — Only Domain H1 (Products & Catalog). |
| **Task sizing** | **PASS** — 11 RPCs, well under the ~20-RPC ceiling. |
| **Existing Governance** | **PASS** — No new governance artifacts; no competing program state. |

**Governance: PASS**

---

## 13. Minor Notes

1. **Documentation count error (non-blocking):** The implementation report and mock comments state that `buildProductRow` implements "24 canonical columns," but the canonical `RETURNS TABLE` clauses for `search_products_rpc` and `get_product_by_barcode` contain 23 columns. The mock correctly implements all 23 columns; only the written count is off by one. Recommended fix: update the comment/documentation to "23 canonical columns" in a future documentation-only pass.
2. **Recharts dimension warnings (non-blocking, informational):** `npx vitest run` emits pre-existing `recharts` console warnings about chart container dimensions in `AdminDashboardInner.test.tsx` and related smoke tests. These warnings were present before CURRENT_TASK-016, are unrelated to Domain H1 mocks, and do not fail tests. They have been partially addressed by prior commits (e.g., explicit Tailwind height) but still surface in the test runner.
3. **Working-tree governance carry-forward (non-blocking):** Multiple files remain modified from prior accepted tasks (CURRENT_TASK-010…015). This acceptance review does not add to that carry-forward, but the recommendation to commit after each acceptance review remains in effect.

---

# PROGRAM MANAGER ACCEPTANCE REVIEW

Architecture Compliance
PASS

Scope Compliance
PASS

Traceability
PASS

Validation
PASS

Coverage
PASS

Regression
PASS

Contract Impact
None

Decision

ACCEPTED WITH MINOR NOTES

Deliverables

- `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` (this document)
- `CURRENT_TASK-016_IMPLEMENTATION_REPORT.md`
- `tests/mocks/supabase.ts` (11 Domain H1 handler blocks + `buildProductRow` helper, additive)

Minor Notes

- Documentation count error: "24 canonical columns" should read "23 canonical columns." Mock implementation is correct; only the comment/report text is off.
- Recharts dimension warnings in `vitest run` are pre-existing and non-blocking.
- Working-tree carry-forward from CURRENT_TASK-010…015 remains uncommitted; commit per acceptance review remains recommended.

Next Step

CURRENT_TASK-016
Closed

Coverage:
57.4%

Milestone:
M3 (Progress)

Awaiting Program-Level Planning

CURRENT_TASK-017
NOT CREATED
