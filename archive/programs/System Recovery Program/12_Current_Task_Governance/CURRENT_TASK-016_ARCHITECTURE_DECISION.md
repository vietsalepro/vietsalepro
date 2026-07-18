# CURRENT_TASK-016 — Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program
**Phase:** Phase 4 — Derived Validation Layer Realignment
**Document Type:** Architecture Decision (Program Manager Decision — no implementation)
**Date:** 2026-07-15
**Status:** Architecture Decision Draft — Awaiting Program Manager Approval
**Authorizing CURRENT_TASK:** CURRENT_TASK-016 — Products & Catalog Mock Coverage (Wave 3a / TASK-H1)
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_M2.md`, `CURRENT_TASK-015_ACCEPTANCE_RECORD.md`, `CURRENT_TASK-015_ARCHITECTURE_DECISION.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`

---

> **No implementation. No code change. No migration. No schema change. No generated type. No mock RPC written by this document.**
> This document is a Program Manager architecture decision deliverable only. It selects the next domain per the already-approved Coverage Roadmap and defines the architecture of CURRENT_TASK-016. No implementation may begin until the Program Manager approves this decision and a separate Implementation/Kickoff authorization is issued.

---

## 1. Objective

Authorize the third domain-scoped coverage task of the Phase 4 Coverage Roadmap and define its architecture.

Concretely, CURRENT_TASK-016 shall mock the **11 uncovered RPCs of Domain H1 — Products & Catalog** in `tests/mocks/supabase.ts`, following the existing `if (name === '...')` dispatch pattern, with each mock's return shape derived from the canonical migration chain. The task raises mock coverage from **51.4% (94/183)** to **57.4% (105/183)** — a **+6.0 percentage-point** delta — and establishes the first Core Commerce entity leaf, whose mocks are referenced by the downstream transactional sub-domains H2 (Inventory), H3 (Orders), H4 (Returns), and H7 (Imports) in later waves.

This decision does **not** re-open the Coverage Roadmap. The Roadmap strategy (Wave / Domain / Dependency / Milestone) was approved in `CURRENT_TASK-014_ARCHITECTURE_DECISION.md` §5.1, re-validated post-M1 in `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §4, and re-validated post-M2 in `PHASE4_PROGRAM_STATUS_AFTER_M2.md` §5 with no change. This document only confirms Domain H1 as the next domain per the roadmap's dependency-driven ordering (Wave 3a), now that its sole prerequisite (Domain A — Auth) is mocked and accepted.

---

## 2. Background

| Item | State | Source |
|---|---|---|
| Phase 4 status | Active, in good standing | `CURRENT_PHASE.md` §1; `PHASE4_PROGRAM_STATUS_AFTER_M2.md` §2 |
| Last closed CURRENT_TASK | CURRENT_TASK-015 — Tenant Administration & Licensing Mock Coverage — Accepted with Minor Notes (2026-07-15) | `CURRENT_TASK-015_ACCEPTANCE_RECORD.md` §14 |
| Coverage milestone reached | **M2 — Tenant Admin (51.4%)** — 94/183 code RPCs covered, independently reproduced | `PHASE4_PROGRAM_STATUS_AFTER_M2.md` §3.1 |
| Coverage Roadmap status | Valid; wave ordering, domain classification, dependencies, and priority re-confirmed post-M2 with no change | `PHASE4_PROGRAM_STATUS_AFTER_M2.md` §5 |
| Next domain per roadmap | Wave 3a — Domain H1: Products & Catalog (11 RPCs, 51.4% → 57.4%, Low effort) | `PHASE4_COVERAGE_ROADMAP.md` §6.2; `PHASE4_PROGRAM_STATUS_AFTER_M2.md` §6 |
| Domain H1 prerequisite | Domain A (Auth) — **satisfied** (M1 complete, accepted) | `PHASE4_PROGRAM_STATUS_AFTER_M2.md` §4.3 |
| Audit gate | Frozen and accepted (CURRENT_TASK-012/013); independently re-run green 2026-07-15 | `PHASE4_PROGRAM_STATUS_AFTER_M2.md` §3.1 |
| Phase 4 exit criteria | EC-3, EC-4 DONE; EC-1, EC-2 PARTIAL (progress-bound on remaining coverage waves) | `PHASE4_PROGRAM_STATUS_AFTER_M2.md` §5 |

CURRENT_TASK-015 is closed. No CURRENT_TASK-016 existed prior to this document. Phase 4 remains active.

---

## 3. Authorized Scope

### 3.1 In Scope

The 11 uncovered Domain H1 RPCs, all called from the core commerce facade barrel `services/supabaseService.ts`:

| Sub-group | RPCs | Source File |
|---|---|---|
| Product Lookup | `get_product_by_barcode`, `search_products_rpc`, `filter_products_rpc` | `services/supabaseService.ts` |
| Existence Checks | `check_product_barcode_exists`, `check_product_code_exists` | `services/supabaseService.ts` |
| Catalog Aggregates | `get_product_stats`, `get_brand_product_counts`, `get_category_product_counts`, `count_point_products` | `services/supabaseService.ts` |
| Sync Resolvers | `get_unsynced_brands`, `get_unsynced_categories` | `services/supabaseService.ts` |

**Count: 11 unique RPCs.** All 11 are called exclusively from `services/supabaseService.ts` (no cross-file sharing). A single handler per name serves its one call-site.

**Files permitted to change:**
- `tests/mocks/supabase.ts` — add 11 handler blocks.
- Test files under `tests/` that exercise the newly-mocked product/catalog paths (encouraged, not mandatory for coverage-only acceptance).

### 3.2 Out of Scope

- All other domains: A (complete), B (complete), C, D, E, F, G, H2–H9.
- Any production code (`services/`, `lib/`, `utils/`, UI, components, pages) — including `services/supabaseService.ts`, which is a call-site only, read-only reference for inventory.
- Any migration, `supabase/schema.sql`, or generated types.
- The audit script `scripts/audit-rpc-contracts.ts` (accepted and frozen in CURRENT_TASK-013).
- CI workflow (`.github/workflows/ci.yml`) and `package.json`.
- Any new file, script, or governance artifact.
- Mock behavioral shape-validation gate (deferred to a possible Phase 4+ hardening task per Roadmap §8).
- Refactor of `tests/mocks/supabase.ts` to a Map-based dispatch (Roadmap §8 risk note; explicitly deferred).
- Re-opening, re-ordering, or re-classifying the Coverage Roadmap.

### 3.3 Governance Boundary

CURRENT_TASK-016 processes **exactly one sub-domain** (Domain H1 — Products & Catalog). It is well under the ~20-RPC task-sizing ceiling (11 RPCs). It satisfies the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8): maps to the Phase 4 objective "test mocks derived from / validated against the canonical migration contract"; stays inside Phase 4 scope; honors Phase 4 constraints; produces Phase 4 exit evidence (coverage delta + audit gate green).

---

## 4. Domain Confirmation (Roadmap Cross-Check)

Domain H1 is confirmed against `PHASE4_COVERAGE_ROADMAP.md`:

| Attribute | Roadmap Value (§2 Domain H, §4, §5.1, §6.2) | Confirmed |
|---|---|---|
| Domain | H1 — Products & Catalog (sub-domain of H — Core Commerce) | YES |
| Wave | Wave 3a | YES |
| RPC count | 11 unique RPCs | YES |
| Sub-groups | Product Lookup (3), Existence Checks (2), Catalog Aggregates (4), Sync Resolvers (2) | YES |
| Source file | `services/supabaseService.ts` (sole carrier) | YES |
| Dependency | Depends on A (Auth) | YES — A complete (M1) |
| Priority Score | 12/15 (High business criticality, Low dependency depth — A only, High test-path unblock — unblocks H2/H3/H4/H7, Low mock complexity, 11 RPCs) | YES |
| Priority rank | 2nd (A → H → B → E → D → C → G → F); A complete, B complete, H is Wave 3 ordered by entity-before-transaction, so H1 is next | YES |
| Estimated complexity | Low — 11 Simple, 0 Medium, 0 Complex | YES |
| Estimated handler lines | ~110 | YES |
| Estimated effort | Low — one focused session | YES |
| Expected coverage increase | 51.4% → 57.4% (+6.0 pp; 94 → 105 covered) | YES |
| Risk | Low — all read-only queries / existence checks / counters; no stateful transactions; no auth-branch mutations | YES |

**No deviation from the approved Roadmap.** The Roadmap is not modified by this document.

---

## 5. Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | **Canonical** | Master Plan §2.1; reaffirmed in CURRENT_TASK-012 and CURRENT_TASK-013. |

The canonical source for the 11 Domain H1 RPCs is the set of `CREATE [OR REPLACE] FUNCTION public.<name>` declarations for those 11 names in the forward migration chain. Each mock handler's return shape must be derivable from the corresponding migration function's `RETURNS` clause and parameter list.

**Canonical migration files defining the 11 H1 RPCs:**
- `20250703000000_baseline_pre_tenant_schema.sql` — first definition of all 11 RPCs.
- `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` — redefines 4 RPCs (`check_product_code_exists`, `search_products_rpc`, `get_product_by_barcode`, `filter_products_rpc`) with SKU-aliased output and overloads; the latest definition in the forward chain wins.

**Canonical-derived references (acceptable, one step removed):**
- `supabase/schema.sql` (Phase 2 accepted) — final-state function definitions.
- `supabase/generated/database.types.ts` (Phase 2 accepted) — typed `Functions` block.
- `D-P3-01_Reconciled_RPC_Contract.md` (Phase 3 accepted) — reconciled service call-sites.

**Non-canonical (must not override):** `docs/admin-dashboard/RPC_CONTRACTS.md` and any other hand-maintained derived document. The audit script no longer reads it (CURRENT_TASK-012); this task must not reintroduce it as a reference.

**Verification mechanism:** `npx tsx scripts/audit-rpc-contracts.ts` — the same gate accepted in CURRENT_TASK-013. It enforces mock ⊆ migrations (stale-mock hard fail), duplicate-handler hard fail, and reports coverage informationally. The coverage line is the milestone metric.

---

## 6. Domain Inventory

Inventory of the 11 Domain H1 RPCs: service call-site, canonical migration file, and canonical `RETURNS` clause. Independently verified by reading the migration files and grepping the service layer.

| # | RPC | Service (call-site) | Canonical Migration File | Canonical RETURNS | Complexity |
|---|---|---|---|---|---|
| 1 | `search_products_rpc` | `services/supabaseService.ts:430` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` (line 231) — redefines baseline | `TABLE(id, name, display_name, code, barcode, price, cost, quantity, unit, location, category, brand, image, min_stock, max_stock, safety_stock, is_point_accumulation_enabled, conversion_units, created_at, has_lots, category_id, brand_id, product_lots)` (24 columns) | Simple — read-only product search by name/sku/barcode with optional `p_search_term` + `p_limit`; returns 0..N product rows with aggregated `product_lots` |
| 2 | `get_product_by_barcode` | `services/supabaseService.ts:439` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` (line 284) — redefines baseline | `TABLE(...)` — same 24-column product shape as `search_products_rpc` | Simple — read-only lookup by `p_barcode`; returns 0 or 1 product row with aggregated `product_lots` |
| 3 | `get_product_stats` | `services/supabaseService.ts:491` | `20250703000000_baseline_pre_tenant_schema.sql` (line 8084) | `JSON` | Simple — read-only aggregate; returns computed catalog stats JSON (counts, value, stock distribution) |
| 4 | `check_product_code_exists` | `services/supabaseService.ts:503` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` (line 82) — redefines baseline (sku-aliased) | `BOOLEAN` | Simple — existence check by `p_code` against `products.sku`; returns true/false |
| 5 | `check_product_barcode_exists` | `services/supabaseService.ts:509` | `20250703000000_baseline_pre_tenant_schema.sql` (line 3276) | `BOOLEAN` | Simple — existence check by `p_barcode`; returns true/false |
| 6 | `filter_products_rpc` | `services/supabaseService.ts:520` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` (line 330 + line 346) — two overloads | `JSON` | Simple — read-only paginated product filter with search/category/brand/sort/stock-status; returns `{ data, total, page, page_size }`-style JSON. The 7-arg overload delegates to the 8-arg overload; the mock models the 8-arg shape (superset of params). |
| 7 | `get_category_product_counts` | `services/supabaseService.ts:1709` | `20250703000000_baseline_pre_tenant_schema.sql` (line 6717) | `JSON` | Simple — read-only aggregate; returns category → product-count mapping JSON |
| 8 | `get_brand_product_counts` | `services/supabaseService.ts:1715` | `20250703000000_baseline_pre_tenant_schema.sql` (line 6698) | `JSON` | Simple — read-only aggregate; returns brand → product-count mapping JSON |
| 9 | `get_unsynced_categories` | `services/supabaseService.ts:1721` | `20250703000000_baseline_pre_tenant_schema.sql` (line 9624) | `JSON` | Simple — read-only; returns categories not yet synced (sync-integration resolver) |
| 10 | `get_unsynced_brands` | `services/supabaseService.ts:1727` | `20250703000000_baseline_pre_tenant_schema.sql` (line 9603) | `JSON` | Simple — read-only; returns brands not yet synced (sync-integration resolver) |
| 11 | `count_point_products` | `services/supabaseService.ts:1733` | `20250703000000_baseline_pre_tenant_schema.sql` (line 3822) | `INTEGER` | Simple — read-only counter; returns count of point-accumulation-enabled products |

**Inventory totals:**
- 11 unique RPCs.
- 1 service file contains all call-sites (`services/supabaseService.ts`) — no cross-file sharing.
- 2 canonical migration files define the 11 RPCs (`20250703000000_baseline_pre_tenant_schema.sql` defines all 11 first; `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` redefines 4 with SKU-aliased output and overloads — latest definition in the forward chain is authoritative).
- 0 RPCs are cross-file shared.
- Complexity distribution: 11 Simple, 0 Medium, 0 Complex. Matches Roadmap §5.1.

---

## 7. Architecture Decision

### 7.1 Strategy Confirmation (Program Manager Decision)

The Coverage Roadmap strategy was approved in `CURRENT_TASK-014_ARCHITECTURE_DECISION.md` §5.1, re-validated post-M1 in `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §4, and re-validated post-M2 in `PHASE4_PROGRAM_STATUS_AFTER_M2.md` §5. This decision does **not** re-approve the strategy; it confirms Domain H1 as the next domain under the already-approved strategy.

| Strategy Element | Status | Basis |
|---|---|---|
| **Wave** | Unchanged — 4 waves, sequential, one CURRENT_TASK authorized at a time. | Roadmap §6.2; CURRENT_TASK-014 §5.1; post-M2 re-validation §5.1. |
| **Domain** | Unchanged — 8 domains (A–H), H sub-divided into 9 sub-domains. | Roadmap §2. |
| **Dependency** | Unchanged — A → B → H entity leaves → H transactions → H residuals → cross-cutting. | Roadmap §3; post-M2 re-validation §5.3. |
| **Milestone** | Unchanged — M0 (37.2%) → M7 (100.0%), M4 (80.3%) intermediate floor available. | Roadmap §7. |

### 7.2 Next Domain Selection (Program Manager Decision)

**Selected domain: Domain H1 — Products & Catalog (11 RPCs, Wave 3a / TASK-H1).**

| Criterion | Assessment |
|---|---|
| **Why selected** | Next domain on the approved Roadmap's Wave 3a. Domain A (Wave 1) and Domain B (Wave 2) are complete and accepted; H1's sole prerequisite (A) is satisfied. The post-M2 status review (`PHASE4_PROGRAM_STATUS_AFTER_M2.md` §6) independently recommended H1 as the next task. |
| **Why H1 and not H5/H6** | H1, H5, H6 are all Wave 3 entity leaves with the same prerequisite (A, satisfied). The roadmap orders them H1 → H5 → H6 (§6.2) because H1 (Products) is referenced by the most downstream transactional sub-domains (H2 Inventory, H3 Orders, H4 Returns, H7 Imports all reference products). Mocking H1 first maximizes downstream test-path unblocking per the dependency graph (Roadmap §3.1). |
| **Dependency** | Depends on A (Auth) — **satisfied** (M1 complete, accepted). Catalog queries are tenant-scoped; the auth/permission mocks established in CURRENT_TASK-014 are on the execution path. |
| **Risk** | Low. All 11 RPCs are read-only queries, existence checks, or counters. No stateful transactions, no mutations, no auth-branch mutations. The two TABLE-returning RPCs (`search_products_rpc`, `get_product_by_barcode`) share an identical 24-column product row shape, so a single shared row-shape helper can be reused across both (ponytail "reuse the helper already here" rung). |
| **Estimated Scope** | 11 RPCs; ~110 handler lines; 11 Simple + 0 Medium + 0 Complex. Effort class: Low. |
| **Expected Coverage Increase** | 51.4% → 57.4% (+6.0 pp; 94/183 → 105/183 covered; 89 → 78 uncovered). Contributes to milestone **M3 — Commerce Entities** (target 64.5% after Wave 3a–3c). |

### 7.3 Architecture Decision for CURRENT_TASK-016

**Decision: Extend `tests/mocks/supabase.ts` with 11 additive handler blocks for the Domain H1 RPCs, each following the existing `if (name === '...')` dispatch pattern, with return shapes derived from the canonical migration chain.**

| Decision Element | Definition |
|---|---|
| **Mock Strategy** | Additive-only insertion of 11 `if (name === '<rpc>')` handler blocks into the existing single dispatch function in `tests/mocks/supabase.ts`. No new file, no new abstraction, no Map dispatch, no new dependency. Reuses the helper/pattern already present (ponytail "reuse the helper already here" rung). The two TABLE-returning product RPCs (`search_products_rpc`, `get_product_by_barcode`) share an identical 24-column product row shape — a single shared row-builder (or inline literal consistent across both) should be reused, not duplicated. |
| **Return Shape Strategy** | Each handler's return shape is derived directly from its canonical migration function's `RETURNS` clause and parameter list: `search_products_rpc` → `{ data: product[]\|null, error }` shaped as the 24-column product row (with `product_lots` as `[]` or aggregated jsonb); `get_product_by_barcode` → `{ data: product\|null, error }` (single-row TABLE as one object or null); `get_product_stats` → `{ data: <stats-json>, error }`; `check_product_code_exists` → `{ data: boolean, error }`; `check_product_barcode_exists` → `{ data: boolean, error }`; `filter_products_rpc` → `{ data: <paginated-json>, error }` (the 8-arg overload shape, superset of the 7-arg delegation); `get_category_product_counts` → `{ data: <category-counts-json>, error }`; `get_brand_product_counts` → `{ data: <brand-counts-json>, error }`; `get_unsynced_categories` → `{ data: <unsynced-json>, error }`; `get_unsynced_brands` → `{ data: <unsynced-json>, error }`; `count_point_products` → `{ data: number, error }`. All 11 are read-only; no store mutation is required. Mocks filter the existing mock store's `products` collection where the canonical function filters `products` (tenant scope is already established by the CURRENT_TASK-014 auth mocks). |
| **Canonical Source** | `supabase/migrations/*.sql` forward chain — specifically `20250703000000_baseline_pre_tenant_schema.sql` (all 11 first definitions) and `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` (4 redefinitions; latest wins). `supabase/schema.sql` and `supabase/generated/database.types.ts` are acceptable canonical-derived references. No hand-maintained derived document may override the chain. |
| **Dispatch Pattern** | The existing `if (name === '...')` chain already present in `tests/mocks/supabase.ts`. The 11 new blocks are inserted additively; no existing handler is modified, reordered, or removed. No Map refactor. |
| **Validation Strategy** | Three gates, all independently re-runnable: (1) `npx tsx scripts/audit-rpc-contracts.ts` exit 0 (stale-mock ⊆ migrations, no duplicates, no code-RPC-missing-from-migrations; coverage line = milestone metric); (2) `npx tsc --noEmit` exit 0; (3) `npx vitest run` all pass with no regression vs the CURRENT_TASK-015 accepted baseline (68 files, 389 tests). Return-shape fidelity to canonical `RETURNS` is enforced by review (Constraint #6), not by an automated gate — the automated shape-validation gate remains explicitly deferred to a possible Phase 4+ hardening task. |
| **Traceability Requirement** | 11/11 RPCs must be traced to their canonical `CREATE [OR REPLACE] FUNCTION public.<name>` declaration (migration file + line) in the Implementation Report and independently re-verified in the Acceptance Record. Each trace records: RPC name, service call-site, canonical migration file, `RETURNS` clause, mock return shape, and PASS/FAIL. |

**Affirmations:**
- **Additive-only.** The 95 existing handlers (94 covering code RPCs + 1 accepted orphan `update_tenant_status`) are unchanged: no modification, no removal, no reorder.
- **No handler rewrite.** Each of the 11 new handlers is a fresh `if (name === '...')` block; no existing handler is split, merged, or renamed.
- **`if (name === '...')` dispatch.** No Map dispatch, no switch, no new abstraction. The existing pattern is reused verbatim.
- **Derived directly from `supabase/migrations/*.sql`.** Every return shape is derivable from the canonical migration function's `RETURNS` clause and parameter list. No derived markdown contract is referenced.

**Rejected alternatives (not chosen, recorded for traceability):**
- *Generate mocks from the canonical source.* Rejected in Roadmap §8 and not revisited: the codegen path is disproportionate to the coverage goal and risks introducing a new derived artifact whose own correctness would then need validation.
- *Refactor `tests/mocks/supabase.ts` to a Map-based dispatch first.* Explicitly deferred (Roadmap §8 risk note). The file is already a single dispatch function; the roadmap does not require the refactor and CURRENT_TASK-016 must not expand scope to include it.
- *Merge H1 with H5 or H6 to reduce task count.* Rejected — the roadmap's task-sizing principle (§6.3) deliberately keeps each task small and single-sub-domain for risk isolation and objective acceptance. Merging would violate the one-domain-per-task pattern established in CURRENT_TASK-014/015.
- *Mock the 7-arg `filter_products_rpc` overload separately from the 8-arg overload.* Rejected — a single handler keyed by name serves both overloads (the 7-arg delegates to the 8-arg in the canonical source). The audit gate keys on RPC name, not signature; one handler per name is the established pattern.

---

## 8. Constraints

Inherited from `CURRENT_PHASE.md` §5 and the Roadmap §6.4 per-task acceptance template:

1. No feature development, no architecture redesign, no scope expansion.
2. No modification of production code, migrations, schema, generated types, CI workflow, or `package.json`.
3. No new files. No new scripts. No new governance artifacts.
4. No implementation outside an approved CURRENT_TASK.
5. Mock handlers must follow the existing `if (name === '...')` dispatch pattern already present in `tests/mocks/supabase.ts`.
6. Mock return shapes must match the canonical migration function signatures (return type + parameter set). A mock that returns a shape inconsistent with its migration function is a defect, even if tests pass.
7. Handlers are **additive only** — no modification or removal of the existing 95 handlers (94 covering code RPCs + 1 accepted orphan `update_tenant_status`).
8. The audit script `scripts/audit-rpc-contracts.ts` is frozen; this task must not modify it.
9. The task must not introduce a mock for an RPC not defined in the canonical migration chain (the stale-mock gate would hard-fail).
10. The task must not introduce a duplicate handler for an already-mocked RPC (the duplicate-handler gate would hard-fail).

---

## 9. Acceptance Criteria

CURRENT_TASK-016 is accepted only when ALL of the following hold, independently verified:

1. **Mock presence.** All 11 Domain H1 RPCs (`search_products_rpc`, `get_product_by_barcode`, `get_product_stats`, `check_product_code_exists`, `check_product_barcode_exists`, `filter_products_rpc`, `get_category_product_counts`, `get_brand_product_counts`, `get_unsynced_categories`, `get_unsynced_brands`, `count_point_products`) have exactly one `if (name === '...')` handler block in `tests/mocks/supabase.ts`.
2. **Audit gate green.** `npx tsx scripts/audit-rpc-contracts.ts` exits 0 — zero stale mocks, zero duplicate handlers, zero code-RPCs-missing-from-migrations.
3. **Coverage delta.** The audit coverage report shows covered count = 105 (was 94) and uncovered count = 78 (was 89), i.e. coverage = 57.4% (was 51.4%), with exactly +11 newly covered RPCs and 0 new uncovered RPCs.
4. **TypeScript.** `npx tsc --noEmit` exits 0.
5. **Test suite.** `npx vitest run` passes with no regression versus the CURRENT_TASK-015 accepted baseline (68 files, 389 tests). A higher pass count is acceptable (new tests exercising the newly-mocked product/catalog paths are encouraged but not mandatory).
6. **Scope integrity.** `git diff --stat` shows changes only in `tests/mocks/supabase.ts` and (optionally) `tests/**`. Zero diff in `services/`, `lib/`, `utils/`, `supabase/`, `scripts/`, `.github/`, `package.json`, or any governance document.
7. **Additive-only.** The 95 existing handlers are unchanged (verified by diff: no removals, no edits to existing handler blocks).
8. **Shape fidelity (review-enforced).** Each new handler's return shape is consistent with its canonical migration function's `RETURNS` clause and parameter list. Verified by inspection against `supabase/migrations/*.sql` (or `supabase/schema.sql` as canonical-derived reference), not by an automated gate.
9. **Traceability.** 11/11 RPCs are traced to their canonical `CREATE [OR REPLACE] FUNCTION public.<name>` declaration (migration file + line) in the Implementation Report, and independently re-verified in the Acceptance Record.

---

## 10. Exit Criteria

CURRENT_TASK-016 is closed when ALL of the following hold:

1. All Acceptance Criteria (§9) are independently verified and recorded in a `CURRENT_TASK-016_ACCEPTANCE_RECORD.md`.
2. The coverage milestone contribution is reached and evidenced by an independent run of the audit gate (covered = 105, coverage = 57.4%).
3. No Critical or Major risk from §12 remains open.
4. The task's diff is committed and the audit gate is green on the committed state.
5. The Program Manager signs the Acceptance Record.

Exit from CURRENT_TASK-016 does **not** exit Phase 4. Phase 4 exit requires the full Phase 4 exit criteria (`CURRENT_PHASE.md` §4) to be met and recorded in `PHASE4_ACCEPTANCE_RECORD.md`. CURRENT_TASK-016 contributes to, but does not satisfy, those criteria. CURRENT_TASK-016 contributes to milestone **M3 — Commerce Entities** (target 64.5% after Wave 3a–3c); M3 is not reached by this task alone.

---

## 11. Deliverables

| # | Deliverable | Owner | Form |
|---|---|---|---|
| 1 | Extended `tests/mocks/supabase.ts` with 11 Domain H1 handler blocks | Engineering team (within authorized CURRENT_TASK-016 implementation) | Code diff, additive-only |
| 2 | `CURRENT_TASK-016_IMPLEMENTATION_REPORT.md` | Engineering team | Markdown report (defined here; not generated by this document) |
| 3 | `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` | Program Manager | Markdown acceptance record with independent verification evidence (defined here; not generated by this document) |
| 4 | Coverage delta evidence | Program Manager | Audit gate output snippet in the Acceptance Record |

**Deliverable definitions (not generated at this step):**

- **`CURRENT_TASK-016_IMPLEMENTATION_REPORT.md`** — Engineering self-report. Must contain: (a) the 11 handler blocks added (diff summary); (b) the 11/11 traceability table (RPC → service call-site → canonical migration file + line → `RETURNS` clause → mock return shape); (c) the three validation gate outputs (audit, tsc, vitest); (d) confirmation of additive-only and scope integrity; (e) any `ponytail:` ceiling notes for intentional simplifications (e.g., aggregate JSON mocks returning fixed shapes, `product_lots` mocked as `[]`).
- **`CURRENT_TASK-016_ACCEPTANCE_RECORD.md`** — Program Manager independent acceptance review. Must contain: (a) objective; (b) scope verification; (c) evidence reviewed (independently reproduced); (d) architecture compliance (10/10 constraints); (e) scope compliance; (f) traceability review (11/11 independently re-verified); (g) validation result (3/3 gates green, independently executed); (h) coverage result (51.4% → 57.4%, exact match); (i) regression result; (j) contract impact (= None); (k) governance compliance; (l) risks; (m) final decision; (n) Program Manager signature.

**Not a deliverable of this task:** any change to production code, migrations, schema, generated types, CI, `package.json`, the audit script, or any governance/planning document. Any such change is a scope violation.

---

## 12. Risk Assessment

| # | Risk | Severity | Mitigation | Residual |
|---|---|---|---|---|
| 1 | **Mock behavioral fidelity** — a Domain H1 mock returns a shape inconsistent with its canonical migration function, tests pass against a fictional contract (the exact failure mode Phase 4 exists to eliminate). | **High** | Constraint #6 + Acceptance Criterion #8 require review-enforced shape fidelity against `supabase/migrations/*.sql`. The audit gate already enforces mock ⊆ migrations. Automated shape-validation gate explicitly deferred to a possible Phase 4+ hardening task. | Medium — review-enforced, not gate-enforced. |
| 2 | **`filter_products_rpc` overload shape** — the canonical function has two overloads (7-arg delegating to 8-arg). A mock that models only the 7-arg shape would drop the `p_stock_status` filter branch; a mock that models a third fictional shape would diverge from the canonical contract. | Low | The mock models the 8-arg overload shape (superset of params), which the 7-arg overload delegates to. One handler keyed by name serves both call signatures. Acceptance Criterion #1 (exactly one handler per name) + #8 (shape fidelity) enforce this. | Low. |
| 3 | **24-column product row shape drift** — `search_products_rpc` and `get_product_by_barcode` return an identical 24-column TABLE shape. A mock that builds the row shape inline in both handlers risks divergence (one handler updated, the other forgotten). | Low | Reuse a single shared product-row builder (or a single inline literal copied verbatim with a `ponytail:` note naming the shared-shape ceiling) across both handlers. Acceptance Criterion #8 (shape fidelity) + the traceability review catch divergence. | Low. |
| 4 | **SKU-alias vs `code` column** — the phase5_3 redefinition aliases `products.sku` back to the output column `code` so frontend mappers stay unchanged. A mock that names the column `sku` instead of `code` would diverge from the canonical TABLE return shape. | Low | The mock's product row must use `code` (not `sku`) as the output key, mirroring the canonical `RETURNS TABLE(... code TEXT ...)` clause. Verified by Acceptance Criterion #8 against the phase5_3 migration line 235/287. | Low. |
| 5 | **`tests/mocks/supabase.ts` growth** — adding ~110 lines brings the file from ~2,872 (post-CURRENT_TASK-015) to ~2,982 lines, further from the Map-based-dispatch refactor noted in the existing `ponytail:` comment. | Low | The refactor is explicitly deferred (Roadmap §8). The file remains a single dispatch function; growth is linear and bounded by the roadmap's total ~2,080-line ceiling. | Low. |
| 6 | **Scope creep** — the task expands beyond Domain H1 (e.g., mocking a downstream H2/H3 flow that references products). | Low | Acceptance Criterion #6 prohibits touching files outside `tests/mocks/supabase.ts` + `tests/**`. The audit gate's stale-mock and duplicate-handler detection provide an automated guard against accidental cross-domain additions. | Low. |
| 7 | **Working-tree governance gap** — uncommitted changes from prior tasks (CURRENT_TASK-010…015) remain in the working tree (last commit `afdef607`); `git diff HEAD` will show changes outside CURRENT_TASK-016's scope. | Low (informational) | Independent verification in the Acceptance Record must attribute out-of-scope diffs to prior accepted tasks, not CURRENT_TASK-016 (mirroring CURRENT_TASK-014/015 §13 Minor Note 1). Recommendation: commit accepted tasks after each acceptance review. Does not block H1 authorization. | Low. |

**No Critical risks identified.** Risk #1 (mock fidelity) is the inherent Phase 4 risk and is mitigated by review-enforced shape fidelity plus the audit stale-mock gate; it is common to every coverage task and tracked at the program level (`PHASE4_PROGRAM_STATUS_AFTER_M2.md` §7).

---

## 13. Governance Compliance

| Governance Principle | Compliance | Evidence |
|---|---|---|
| **Scope Lock** | PASS | Exactly Domain H1, exactly 11 RPCs, no scope expansion. Task-sizing ceiling (~20 RPCs) not exceeded (11 < 20). Out-of-scope list (§3.2) explicitly excludes all other domains and all production/migration/schema/type/audit/CI surfaces. |
| **Canonical-first** | PASS | All 11 mock return shapes to be derived from canonical migration `RETURNS` clauses (§6 inventory). No derived document overrides the canonical chain. Audit stale-mock gate enforces mock ⊆ migrations. |
| **Additive-only** | PASS | 11 new handler blocks inserted; 95 existing handlers unchanged (Constraint #7, Acceptance Criterion #7). No dispatch change, no new file, no new abstraction. |
| **Phase 4 Alignment** | PASS | Task maps to Phase 4 objective ("test mocks derived from / validated against the canonical migration contract"); stays inside Phase 4 scope; honors Phase 4 constraints (`CURRENT_PHASE.md` §5); produces Phase 4 exit evidence (coverage delta + audit gate green). |
| **CURRENT_TASK Generation Rule** | PASS | Satisfies `CURRENT_PHASE.md` §8: maps to a Phase 4 objective, inside Phase 4 scope, satisfies Phase 4 constraints, produces Phase 4 exit evidence. |
| **Roadmap Conformance** | PASS | Domain H1 is Wave 3a / TASK-H1 exactly as defined in `PHASE4_COVERAGE_ROADMAP.md` §6.2; no reordering, no reclassification, no priority change. Post-M2 status review (`PHASE4_PROGRAM_STATUS_AFTER_M2.md` §6) independently recommended H1 as the next task. |
| **One-task-at-a-time** | PASS | CURRENT_TASK-015 is closed and accepted; no other CURRENT_TASK is open. CURRENT_TASK-016 is the sole next task; CURRENT_TASK-017 is not created by this document. |
| **No implementation by this document** | PASS | This document authorizes no code change. Implementation requires a separate Program Manager approval after this Architecture Decision is approved. |

---

## 14. Scope Lock (Restated)

CURRENT_TASK-016 must **not**:

- Modify production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Modify services (including `services/supabaseService.ts` — this is a call-site only, read-only reference for inventory).
- Modify migrations (`supabase/migrations/*.sql`).
- Modify schema (`supabase/schema.sql`).
- Modify generated types (`supabase/generated/database.types.ts`).
- Modify the audit gate (`scripts/audit-rpc-contracts.ts` — frozen).
- Modify CI (`.github/workflows/ci.yml`) or `package.json`.
- Expand into any other domain (A, B, C, D, E, F, G, H2–H9).
- Create any new file, script, or governance artifact (the Implementation Report and Acceptance Record are the only new documents, generated at their respective later steps, not by this document).
- Re-open, re-order, or re-classify the Coverage Roadmap.

The only file this task is permitted to change is `tests/mocks/supabase.ts` (additive handler blocks) and, optionally, `tests/**` test files that exercise the newly-mocked paths.

---

## 15. Final Decision Block

```text
PROGRAM MANAGER DECISION

Architecture Compliance
PASS

Scope Definition
PASS

Governance Compliance
PASS

Decision

CURRENT_TASK-016

Architecture Decision
COMPLETED

Implementation
NOT AUTHORIZED

Awaiting Program Manager Approval
```

---

*This document is an Architecture Decision only. It creates no mock, writes no code, modifies no source file, and authorizes no implementation. Implementation of CURRENT_TASK-016 requires a separate Program Manager approval issued after this Architecture Decision is accepted. CURRENT_TASK-017 is not created by this document.*
