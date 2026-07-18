# CURRENT_TASK-022 Architecture Decision

**Program:** VietSale Pro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**CURRENT_TASK-022:** Wave 3g — Domain H7: Imports Mock Coverage  
**Document Type:** Architecture Decision  
**Date:** 2026-07-15  
**Decision Authority:** Program Manager

---

## Objective

Authorize CURRENT_TASK-022 as the next Phase 4 operational work unit: extend the `tests/mocks/supabase.ts` dispatch function to cover all Domain H7 (Imports) RPCs identified in `PHASE4_COVERAGE_ROADMAP.md`, raising mock coverage from **76.0%** to **80.3%**.

This decision approves the architecture and scope only. It does **not** authorize implementation.

---

## Scope

- **Domain:** H7 — Imports
- **Wave:** Wave 3g (Core Commerce Transactions)
- **Boundary:** Mock handlers in `tests/mocks/supabase.ts` and any test files that exercise the newly mocked RPCs. No production code, migrations, schema, generated types, CI, or governance changes.
- **RPC count:** 8 unique RPCs
- **Coverage movement:** 139 / 183 → 147 / 183 covered RPCs; 76.0% → 80.3%

This task stays strictly inside the Phase 4 scope defined in `CURRENT_PHASE.md` §2 and §5.

---

## Authorized RPCs

The following 8 RPCs are authorized for mock coverage in CURRENT_TASK-022. They are taken directly from `PHASE4_COVERAGE_ROADMAP.md` §2 Domain H — Core Commerce, sub-domain H7 — Imports:

| # | RPC | Source File | Complexity |
|---|---|---|---|
| 1 | `delete_import_v2` | `services/supabaseService.ts` | Medium |
| 2 | `process_import_v2` | `services/supabaseService.ts` | Complex |
| 3 | `update_import_v2` | `services/supabaseService.ts` | Complex |
| 4 | `filter_import_receipts_rpc` | `services/supabaseService.ts` | Medium |
| 5 | `get_import_receipt_count_by_date` | `services/supabaseService.ts` | Simple |
| 6 | `get_import_receipts_by_product_and_lot` | `services/supabaseService.ts` | Simple |
| 7 | `get_import_receipts_by_supplier_id` | `services/supabaseService.ts` | Simple |
| 8 | `get_import_stats` | `services/supabaseService.ts` | Medium |

**Total: 8 unique RPCs.**

Note: `filter_import_receipts_rpc` exists in the canonical migration chain with two overloaded signatures; both overloads must be reachable through the same dispatch handler, consistent with the existing `if (name === '...')` pattern.

---

## Dependency Verification

Per `PHASE4_COVERAGE_ROADMAP.md` §3.2, Domain H7 depends on:

| Prerequisite Domain | Status | Evidence |
|---|---|---|
| **A — Auth, Identity & Security** | COMPLETE | Wave 1 (CURRENT_TASK-014) accepted; `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` present |
| **H1 — Products & Catalog** | COMPLETE | Wave 3a (CURRENT_TASK-016) accepted; `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` present |
| **H6 — Suppliers** | COMPLETE | Wave 3c (CURRENT_TASK-018) accepted; `CURRENT_TASK-018_ACCEPTANCE_RECORD.md` present |

In addition, the following domain required by program minimum-prerequisite policy is also complete:

| Prerequisite Domain | Status | Evidence |
|---|---|---|
| **H5 — Customers** | COMPLETE | Wave 3b (CURRENT_TASK-017) accepted; `CURRENT_TASK-017_ACCEPTANCE_RECORD.md` present |

All dependencies required by the Coverage Roadmap and by the program’s minimum dependency check are satisfied.

---

## Canonical Source

The authoritative contract for these RPCs is the ordered canonical migration chain in `supabase/migrations/*.sql`, not any markdown, report, or roadmap document.

The 8 authorized RPCs are defined in the canonical migration file:

- `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`
  - `delete_import_v2` (line 5384)
  - `filter_import_receipts_rpc` (lines 6170 and 6208 — two overloaded signatures)
  - `get_import_receipt_count_by_date` (line 7570)
  - `get_import_receipts_by_product_and_lot` (line 7578)
  - `get_import_receipts_by_supplier_id` (line 7618)
  - `get_import_stats` (line 7644)
  - `process_import_v2` (line 10865)
  - `update_import_v2` (line 12649)

Implementation must derive handler shapes, parameter names, and return types from this canonical migration source.

---

## Constraints

Implementation of CURRENT_TASK-022 must conform to the following constraints, drawn from `CURRENT_PHASE.md` §5 and the Phase 4 CURRENT_TASK Generation Rule:

- **Additive only:** new mock handlers may be added; no existing handler may be removed or altered in a way that changes current test behavior.
- **No refactor:** do not restructure `tests/mocks/supabase.ts` or introduce helper abstractions.
- **No redesign:** do not change the service-to-mock contract, the dispatch pattern, or the test strategy.
- **No abstraction:** no new shared mock utilities, factories, or generators.
- **Preserve existing dispatch pattern:** each RPC is handled with the existing `if (name === '...')` chain.
- **No duplicate handler:** one handler block per unique RPC name.
- **No stale mock:** every added handler must correspond to an RPC called by service code and defined in the canonical migration chain.
- **No boundary crossing:** changes are confined to `tests/mocks/supabase.ts` and test files; no production code, migrations, schema, generated types, CI workflows, or package dependencies may be modified.
- **No task scope expansion:** do not mock RPCs outside the 8 authorized H7 RPCs.

---

## Validation Plan

Engineering implementation of CURRENT_TASK-022 will be accepted only after the following validation gates pass:

| # | Validation Gate | Command / Criterion |
|---|---|---|
| 1 | Canonical audit gate | `npx tsx scripts/audit-rpc-contracts.ts` exits 0 with no stale mocks, no duplicate handlers, and no code RPC missing from the canonical migration chain |
| 2 | Type gate | `npx tsc --noEmit` exits 0 with zero TypeScript errors |
| 3 | Test gate | `npx vitest run` exits 0 with all existing tests passing and no regression |
| 4 | Coverage gate | Coverage report shows **147 / 183** covered RPCs and **80.3%** coverage |
| 5 | Scope gate | Only `tests/mocks/supabase.ts` and test files are modified; no production, migration, schema, generated-type, or CI changes |

---

## Expected Coverage

| Metric | Before CURRENT_TASK-022 | After CURRENT_TASK-022 |
|---|---|---|
| Covered RPCs | 139 / 183 | 147 / 183 |
| Uncovered RPCs | 44 | 36 |
| Coverage | 76.0% | 80.3% |
| Delta | — | +8 RPCs, +4.3 percentage points |

The coverage target is taken directly from `PHASE4_COVERAGE_ROADMAP.md` §6.2 Wave 3g.

---

## Decision

**APPROVED.**

CURRENT_TASK-022 is authorized as Wave 3g — Domain H7: Imports mock coverage, covering the 8 RPCs listed above and targeting 80.3% mock coverage.

---

## Status

- **Architecture Decision:** APPROVED
- **Implementation:** NOT AUTHORIZED
- **Current Phase 4 milestone:** Wave 3f (H4 — Returns & Exchanges) complete; Wave 3g (H7 — Imports) ready for kickoff pending separate authorization

---

## Next Step

**Engineering Kickoff for CURRENT_TASK-022 requires separate authorization.**

Implementation may not begin until the Engineering Kickoff document (`CURRENT_TASK-022_ENGINEERING_KICKOFF.md`) is generated and approved. No code, mocks, tests, migrations, schema, or generated types may be modified under this Architecture Decision.
