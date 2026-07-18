# CURRENT_TASK-019 — Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3d — Domain H2 — Inventory & Stock Mock Coverage  
**Document Type:** Architecture Decision (Program Manager Decision — no implementation)  
**Date:** 2026-07-15  
**Status:** Architecture Approved  
**Authorizing CURRENT_TASK:** CURRENT_TASK-019 — Inventory & Stock Mock Coverage (Wave 3d / TASK-H2)  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_018.md`, `CURRENT_TASK-018_ACCEPTANCE_RECORD.md`, `CURRENT_TASK-018_ARCHITECTURE_DECISION.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`

---

> **No implementation. No code change. No migration. No schema change. No generated type. No mock RPC written by this document.**
> This document is a Program Manager architecture decision deliverable only. It selects the next domain per the already-approved Coverage Roadmap and defines the architecture of CURRENT_TASK-019. No implementation may begin until the Program Manager approves this decision and a separate Implementation/Kickoff authorization is issued.

---

## 1. Objective

Authorize the sixth domain-scoped coverage task of the Phase 4 Coverage Roadmap and define its architecture.

Concretely, CURRENT_TASK-019 shall mock the **7 uncovered RPCs of Domain H2 — Inventory & Stock** in `tests/mocks/supabase.ts`, following the existing `if (name === '...')` dispatch pattern, with each mock's return shape derived from the canonical migration chain. The task raises mock coverage from **64.5% (118/183)** to **68.3% (125/183)** — a **+3.8 percentage-point** delta — and begins the first transactional wave (Wave 3d) of Milestone M4.

This decision does **not** re-open the Coverage Roadmap. The Roadmap strategy (Wave / Domain / Dependency / Milestone) was approved in `CURRENT_TASK-014_ARCHITECTURE_DECISION.md` §5.1, re-validated post-M1, post-M2, post-M3, post-CURRENT_TASK-017, and post-CURRENT_TASK-018 in `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_018.md` §5 with no change. This document only confirms Domain H2 as the next domain per the roadmap's dependency-driven ordering (Wave 3d), now that its prerequisites are satisfied.

---

## 2. Background

| Item | State | Source |
|---|---|---|
| Phase 4 status | Active, in good standing | `CURRENT_PHASE.md` §1; `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_018.md` §2 |
| Last closed CURRENT_TASK | CURRENT_TASK-018 — Suppliers Mock Coverage — Accepted with Minor Notes (2026-07-15) | `CURRENT_TASK-018_ACCEPTANCE_RECORD.md` §16 |
| Coverage milestone reached | **M3 Completed — 64.5%** — 118/183 code RPCs covered, independently reproduced | `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_018.md` §3.1 |
| Coverage Roadmap status | Valid; wave ordering, domain classification, dependencies, and priority re-confirmed post-CURRENT_TASK-018 with no change | `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_018.md` §5 |
| Next domain per roadmap | Wave 3d — Domain H2: Inventory & Stock (7 RPCs, 64.5% → 68.3%, Medium effort) | `PHASE4_COVERAGE_ROADMAP.md` §2, §6.2; `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_018.md` §5.2 |
| Domain H2 prerequisite | Domain A (Auth) — **satisfied** (M1 complete, accepted); Domain H1 (Products & Catalog) — **satisfied** (M3 Wave 3a complete, accepted) | `PHASE4_COVERAGE_ROADMAP.md` §3.2; `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_018.md` §5.3 |
| Audit gate | Frozen and accepted (CURRENT_TASK-012/013); independently re-run green 2026-07-15 | `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_018.md` §3.1 |
| Phase 4 exit criteria | EC-3, EC-4 DONE; EC-1, EC-2 PARTIAL (progress-bound on remaining coverage waves) | `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_018.md` §6 |

CURRENT_TASK-018 is closed. No CURRENT_TASK-019 existed prior to this document. Phase 4 remains active.

---

## 3. Authorized Scope

### 3.1 In Scope

The 7 uncovered Domain H2 RPCs, all called from the core commerce facade barrel `services/supabaseService.ts`:

| Sub-group | RPCs | Service Call-site (approx.) | Source File |
|---|---|---|---|
| Inventory Count Lifecycle | `complete_inventory_count`, `cancel_inventory_count_rpc`, `delete_inventory_count_rpc` | `services/supabaseService.ts:2245`, `:2270`, `:2257` | `services/supabaseService.ts` |
| Stock Ledger & Drift | `get_stock_ledger`, `check_stock_ledger_drift` | `services/supabaseService.ts:3893`, `:3929` | `services/supabaseService.ts` |
| Quantity Adjustment | `increment_product_quantity` | `services/supabaseService.ts:3235` | `services/supabaseService.ts` |
| Inventory Report | `get_inventory_report` | `services/supabaseService.ts:3861` | `services/supabaseService.ts` |

**Count: 7 unique RPCs.** All 7 are called exclusively from `services/supabaseService.ts` (no cross-file sharing). A single handler per name serves its one call-site.

**Files permitted to change:**
- `tests/mocks/supabase.ts` — add 7 handler blocks and any in-file store state needed to support them.
- Test files under `tests/` that exercise the newly-mocked inventory paths (encouraged, not mandatory for coverage-only acceptance).

### 3.2 Out of Scope

- All other domains: A (complete), B (complete), C, D, E, F, G, H1 (complete), H3, H4, H5 (complete), H6 (complete), H7–H9.
- Any production code (`services/`, `lib/`, `utils/`, UI, components, pages) — including `services/supabaseService.ts`, which is a call-site only, read-only reference for this task.
- Any migration, `supabase/schema.sql`, or generated types.
- The audit script `scripts/audit-rpc-contracts.ts` (accepted and frozen in CURRENT_TASK-013).
- CI workflow (`.github/workflows/ci.yml`) and `package.json`.
- Any new file, script, or governance artifact.
- Mock behavioral shape-validation gate (deferred to a possible Phase 4+ hardening task per Roadmap §8).
- Refactor of `tests/mocks/supabase.ts` to a Map-based dispatch (Roadmap §8 risk note; explicitly deferred).
- Re-opening, re-ordering, or re-classifying the Coverage Roadmap.

### 3.3 Governance Boundary

CURRENT_TASK-019 processes **exactly one sub-domain** (Domain H2 — Inventory & Stock). It is well under the ~20-RPC task-sizing ceiling (7 RPCs). It satisfies the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8): maps to the Phase 4 objective "test mocks derived from / validated against the canonical migration contract"; stays inside Phase 4 scope; honors Phase 4 constraints; produces Phase 4 exit evidence (coverage delta + audit gate green).

---

## 4. Domain Confirmation (Roadmap Cross-Check)

Domain H2 is confirmed against `PHASE4_COVERAGE_ROADMAP.md`:

| Attribute | Roadmap Value (§2 Domain H, §4, §5.1, §6.2) | Confirmed |
|---|---|---|
| Domain | H2 — Inventory & Stock (sub-domain of H — Core Commerce) | YES |
| Wave | Wave 3d | YES |
| RPC count | 7 unique RPCs | YES |
| Sub-groups | Inventory Count Lifecycle (3), Stock Ledger & Drift (2), Quantity Adjustment (1), Inventory Report (1) | YES |
| Source file | `services/supabaseService.ts` (sole carrier) | YES |
| Dependency | Depends on A (Auth), H1 (Products & Catalog) | YES — both complete |
| Priority Score | Commerce transactional foundation; unblocks H3 and H8 | YES |
| Priority rank | Commerce entity leaves H1 → H5 → H6 complete; H2 is next transactional foundation | YES |
| Estimated complexity | Medium — 3 Simple, 4 Medium, 0 Complex per Roadmap | YES |
| Estimated handler lines | ~140 | YES |
| Estimated effort | Medium — one session with verification | YES |
| Expected coverage increase | 64.5% → 68.3% (+3.8 pp; 118/183 → 125/183 covered; 65 → 58 uncovered) | YES |
| Risk | Medium — stateful count lifecycle and stock ledger handlers | YES |

**No deviation from the approved Roadmap.** The Roadmap is not modified by this document.

---

## 5. Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | **Canonical** | Master Plan §2.1; reaffirmed in CURRENT_TASK-012 and CURRENT_TASK-013. |

The canonical source for the 7 Domain H2 RPCs is the set of `CREATE [OR REPLACE] FUNCTION public.<name>` declarations for those 7 names in the forward migration chain. Each mock handler's return shape must be derivable from the corresponding migration function's `RETURNS` clause and parameter list.

**Canonical migration declarations for the 7 Domain H2 RPCs:**

| RPC | Canonical Migration File | Canonical Line | RETURNS |
|---|---|---|---|
| `cancel_inventory_count_rpc` | `20250703000000_baseline_pre_tenant_schema.sql` | 2782 | `void` |
| `check_stock_ledger_drift` | `20250703000000_baseline_pre_tenant_schema.sql` | 3346 | `TABLE(product_id text, lot_id text, products_quantity numeric, lot_sum numeric, movement_sum numeric, diff numeric)` |
| `complete_inventory_count` | `20250703000000_baseline_pre_tenant_schema.sql` | 3531 | `void` |
| `delete_inventory_count_rpc` | `20250703000000_baseline_pre_tenant_schema.sql` | 5571 | `void` |
| `get_stock_ledger` | `20250703000000_baseline_pre_tenant_schema.sql` | 8923 | `TABLE(id uuid, posting_date timestamptz, voucher_type text, voucher_no text, voucher_detail_no text, product_id text, product_name text, lot_id text, lot_code text, warehouse text, actual_qty numeric, qty_after_transaction numeric, valuation_rate numeric, incoming_rate numeric, outgoing_rate numeric, stock_value numeric, balance_value numeric, reason text, is_cancelled boolean, created_at timestamptz)` |
| `increment_product_quantity` | `20250703000000_baseline_pre_tenant_schema.sql` | 9693 | `void` |
| `get_inventory_report` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` | 90 | `json` |

`get_inventory_report` is the final forward-migration definition; it replaces the earlier baseline definition that referenced `products.code` with a version that aliases `products.sku` back to `"code"` to preserve existing report contracts.

**Canonical-derived references (acceptable, one step removed):**
- `supabase/schema.sql` (Phase 2 accepted) — final-state function definitions.
- `supabase/generated/database.types.ts` (Phase 2 accepted) — typed `Functions` block.
- `D-P3-01_Reconciled_RPC_Contract.md` (Phase 3 accepted) — reconciled service call-sites.

**Non-canonical (must not override):** `docs/admin-dashboard/RPC_CONTRACTS.md` and any other hand-maintained derived document. The audit script no longer reads it (CURRENT_TASK-012); this task must not reintroduce it as a reference.

**Verification mechanism:** `npx tsx scripts/audit-rpc-contracts.ts` — the same gate accepted in CURRENT_TASK-013. It enforces mock ⊆ migrations (stale-mock hard fail), no duplicate handlers (hard fail), and reports coverage informationally. The coverage target for this task is **68.3%** (125/183 code RPCs covered), not a hard pass threshold; the hard gates are stale-mock = 0 and duplicate = 0.

---

## 6. Architecture Constraints

Engineering must honor the constraints already validated across CURRENT_TASK-014 through CURRENT_TASK-018. This Architecture Decision does not introduce new constraints; it re-asserts the existing Phase 4 Coverage Roadmap architecture.

| # | Constraint | Rationale |
|---|---|---|
| 1 | **Additive only** | The mock layer may only gain handlers; no existing handler may be modified or removed. This preserves the current passing test base and the established dispatch shape. |
| 2 | **No refactor** | `tests/mocks/supabase.ts` must remain structurally unchanged (single `rpc` function with chained `if` blocks). No extraction, no helper module, no dispatch-table conversion. |
| 3 | **No redesign** | No change to the service facade, the store model, or the RPC invocation contract. |
| 4 | **No new abstraction** | No shared helper modules, no generic RPC builder, no domain-specific factories. Reuse existing local in-file patterns only. |
| 5 | **Preserve `if (name === '...')` dispatch** | Every new handler must be a self-contained `if (name === '<rpc_name>') { ... }` block, positioned before the fallback `return { data: null, error: ... }`. |
| 6 | **Mock return shape follows canonical migration** | Each handler's returned data shape must match the migration function's `RETURNS` type and parameter contract, as read from `supabase/migrations/*.sql`. |
| 7 | **No duplicate handler** | A handler for an RPC name already present in `tests/mocks/supabase.ts` is prohibited. The audit gate enforces this. |
| 8 | **No stale mock** | No handler may be added for an RPC name that does not exist in the canonical migration chain. The audit gate enforces this. |
| 9 | **Within CURRENT_TASK boundary** | Only the 7 H2 RPCs may be added. No adjacent domain RPCs, no "while we're here" additions. |
| 10 | **No production, migration, schema, generated type, audit, or CI change** | Scope is strictly the test mock layer and optional tests exercising it. |

---

## 7. Dependencies

Domain H2 has been unlocked by the completion of its prerequisites:

| Prerequisite Domain | Status | Evidence | Why It Unlocks H2 |
|---|---|---|---|
| Domain A — Auth, Identity & Security | Complete (M1) | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` §14 | H2 service functions call through `lib/permissions.ts` guards (`has_tenant_role`, `is_tenant_owner`, etc.). A mocks must exist for inventory tests to reach the RPC under test. |
| Domain H1 — Products & Catalog | Complete (Wave 3a) | `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` §14 | H2 inventory handlers read and mutate `products` and `product_lots`. The `products`/`product_lots` store collections and catalog handler patterns established in H1 are required for consistent inventory mocks. |

`PHASE4_COVERAGE_ROADMAP.md` §3.2 lists H2's dependency as **A and H1**. Both are complete. H5 and H6 are also complete as sibling commerce entity leaves, but they are not hard blockers for H2; their completion demonstrates the Wave 3 entity-leaf pattern is established and accepted.

---

## 8. Shared Helpers

**No new helpers. No new modules.**

The existing in-file patterns in `tests/mocks/supabase.ts` (tenant-scoped store arrays, `crypto.randomUUID()` for generated IDs, `Number()` conversions, `Date` handling, `return { data, error }` envelopes) are sufficient. Engineering may replicate local patterns from the H5/H6 entity handlers where inventory semantics are identical (e.g., search/filter shapes), but any helper-like code must remain inline inside the 7 new `if` blocks.

### Required new `store` collections

Because the canonical H2 functions reference tables that are not yet represented in the test store, the following collections must be added to the mock store inside `tests/mocks/supabase.ts`:

| Collection | Reason |
|---|---|
| `inventory_counts` | `complete_inventory_count`, `cancel_inventory_count_rpc`, and `delete_inventory_count_rpc` read/update the `inventory_counts` header row. |
| `inventory_count_items` | The count lifecycle functions read/update line items for a count. |
| `stock_movements` | `get_stock_ledger` and `check_stock_ledger_drift` read stock movement rows. |

`products` and `product_lots` already exist in the store from Domain H1 and may be read by `increment_product_quantity`, `get_stock_ledger`, and `check_stock_ledger_drift`.

If an inventory handler genuinely repeats the exact same 3+ lines as an existing handler, a small inline closure inside the same file is acceptable; no new file or exported utility may be created.

---

## 9. Validation Requirements

Engineering must independently demonstrate that the following gates pass before acceptance. These are the same gates used for CURRENT_TASK-014 through CURRENT_TASK-018.

| Gate | Command | Expected Result |
|---|---|---|
| Audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0, **0 stale mock**, **0 duplicate handler**, coverage reported as **68.3%** (125/183). |
| Type gate | `npx tsc --noEmit` | Exit 0, no TypeScript errors. |
| Test gate | `npx vitest run` | All existing tests pass; no regression. |
| Diff gate | `git diff --stat` | Changes confined to `tests/mocks/supabase.ts` and optional `tests/**` self-check tests; no production, migration, schema, generated type, audit, or CI files touched. |

Acceptance will be recorded in `CURRENT_TASK-019_ACCEPTANCE_RECORD.md` only after the above are independently reproduced by the Program Manager.

---

## 10. Expected Coverage

| Metric | Before (CURRENT_TASK-018 accepted) | After (CURRENT_TASK-019 target) |
|---|---|---|
| Covered code RPCs | 118 / 183 | 125 / 183 |
| Uncovered code RPCs | 65 | 58 |
| Coverage | **64.5%** | **68.3%** |
| Delta | — | **+3.8 pp** |

The 7 new H2 handlers add 7 newly-covered code RPCs. The orphan mock `update_tenant_status` remains counted as a mock handler but not as a covered code RPC, consistent with CURRENT_TASK-013 accepted state.

---

## 11. Risk

| Risk | Level | Mitigation |
|---|---|---|
| Stateful inventory count handlers (`complete_inventory_count`, `cancel_inventory_count_rpc`, `delete_inventory_count_rpc`) | Medium | Follow the established entity-leaf handler discipline: operate on `store.inventory_counts` and `store.inventory_count_items`, deterministic `void` return, and leave a small runnable self-check for happy path + guard/rollback path. |
| `get_stock_ledger` / `check_stock_ledger_drift` require `stock_movements` store shape | Medium | Add `store.stock_movements` with the columns referenced by the canonical `TABLE` return shape; keep rows minimal and deterministic. |
| `get_inventory_report` aggregate depends on data from H4 (`return_orders`) not yet mocked | Low | Return canonical `json` shape using empty arrays for unavailable H4 references; do not introduce H4 RPC mocks. |
| Coverage delta smaller or larger than +3.8 pp | Low | Roadmap estimate is based on 183 unique code RPCs and 7 new handlers. If the audit inventory changes, the Program Manager will reconcile against the CURRENT_TASK-019 acceptance evidence, not the pre-computed percentage. |
| Accidental refactor of dispatch pattern | Low | Constrained by §6 and verified by diff gate. |

---

## 12. Deliverable Summary

This Architecture Decision authorizes:

- **Domain:** H2 — Inventory & Stock
- **Wave:** Wave 3d
- **RPC Count:** 7 / 7
- **Target Files:** `tests/mocks/supabase.ts` (required), optional `tests/**`
- **Required Store Additions:** `inventory_counts`, `inventory_count_items`, `stock_movements`
- **Coverage Target:** 64.5% → 68.3%
- **Next Step:** Engineering Kickoff (separate authorization)

---

# Báo cáo cuối

## ARCHITECTURE DECISION

### Objective

Authorize Wave 3d — Domain H2 — Inventory & Stock mock coverage. Add 7 inventory/stock RPC handlers to `tests/mocks/supabase.ts` following the existing `if (name === '...')` dispatch pattern, with return shapes derived from the canonical migration chain. Raise mock coverage from **64.5%** to **68.3%**.

### Scope

- **In scope:** 7 uncovered RPCs of Domain H2 — Inventory & Stock, all called from `services/supabaseService.ts`:
  - `complete_inventory_count`
  - `cancel_inventory_count_rpc`
  - `delete_inventory_count_rpc`
  - `get_stock_ledger`
  - `check_stock_ledger_drift`
  - `increment_product_quantity`
  - `get_inventory_report`
- **Permitted files:** `tests/mocks/supabase.ts`; optional `tests/**` self-check tests.
- **Required store additions:** `inventory_counts`, `inventory_count_items`, `stock_movements`.
- **Out of scope:** production code, migrations, schema, generated types, audit script, CI, `package.json`, governance artifacts, other domains.

### Authorized RPCs

7 / 7

| RPC | Canonical Migration File | Canonical Line | RETURNS |
|---|---|---|---|
| `cancel_inventory_count_rpc` | `20250703000000_baseline_pre_tenant_schema.sql` | 2782 | `void` |
| `check_stock_ledger_drift` | `20250703000000_baseline_pre_tenant_schema.sql` | 3346 | `TABLE(...)` |
| `complete_inventory_count` | `20250703000000_baseline_pre_tenant_schema.sql` | 3531 | `void` |
| `delete_inventory_count_rpc` | `20250703000000_baseline_pre_tenant_schema.sql` | 5571 | `void` |
| `get_stock_ledger` | `20250703000000_baseline_pre_tenant_schema.sql` | 8923 | `TABLE(...)` |
| `increment_product_quantity` | `20250703000000_baseline_pre_tenant_schema.sql` | 9693 | `void` |
| `get_inventory_report` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` | 90 | `json` |

### Canonical Source

`supabase/migrations/*.sql` is the single source of truth for RPC names, signatures, and return shapes. No derived markdown (including `RPC_CONTRACTS.md`) may override it.

### Constraints

- Additive only
- No refactor of `tests/mocks/supabase.ts`
- No redesign or new abstraction
- Preserve `if (name === '...')` dispatch
- Mock return shape follows canonical migration
- No duplicate handler
- No stale mock
- No production, migration, schema, generated type, audit, or CI change
- Within CURRENT_TASK-019 boundary only

### Validation

Engineering must PASS:

```bash
npx tsx scripts/audit-rpc-contracts.ts
```
Expected: Exit 0, Coverage **68.3%**, 0 stale mock, 0 duplicate handler.

```bash
npx tsc --noEmit
```
PASS

```bash
npx vitest run
```
PASS

No regression.

### Expected Coverage

64.5%

↓

68.3%

### Decision

APPROVED

### Status

CURRENT_TASK-019

Architecture Approved

### Implementation

NOT AUTHORIZED

### Next Step

Engineering Kickoff

(CURRENT_TASK-019)

requires

a separate authorization.
