# CURRENT_TASK-019 — Engineering Kickoff

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3d — Domain H2 — Inventory & Stock Mock Coverage  
**Document Type:** Engineering Kickoff (Engineering Readiness Review)  
**Date:** 2026-07-15  
**Status:** Engineering Ready  

**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-018_ACCEPTANCE_RECORD.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_018.md`, `CURRENT_TASK-019_ARCHITECTURE_DECISION.md`

---

## 1. Engineering Kickoff

This document authorizes Engineering to begin implementation of **CURRENT_TASK-019: Domain H2 — Inventory & Stock mock coverage (Wave 3d)**.

The task is bounded, additive, and isolated to the test mock layer. Engineering shall add exactly **7 RPC handlers** to `tests/mocks/supabase.ts`, derive return shapes from the canonical migration chain, and leave all program governance, architecture, and roadmap decisions unchanged.

---

## 2. Objective

Implement mock coverage for the 7 uncovered Domain H2 RPCs in `tests/mocks/supabase.ts`, raising mock coverage from **64.5% (118/183)** to **68.3% (125/183)** — a **+3.8 percentage-point** delta — with zero regression and zero contract impact.

This begins the first transactional wave (Wave 3d) of Milestone M4 — Commerce Transactions.

---

## 3. Current Program Status

| Item | State |
|---|---|
| Active Phase | Phase 4 — Derived Validation Layer Realignment |
| Phase Entry Gate | PASS (accepted 2026-07-14) |
| Last Closed Task | CURRENT_TASK-018 — Domain H6 — Suppliers Mock Coverage — Accepted with Minor Notes |
| Current Milestone | **M3 — Commerce Entities: COMPLETE** |
| Next Milestone | M4 — Commerce Transactions (begins with H2) |
| Coverage (post-CURRENT_TASK-018) | **64.5%** — 118 covered / 65 uncovered |
| Open CURRENT_TASKs | None; CURRENT_TASK-019 is next |

Phase 4 remains active and in good standing. The Coverage Roadmap and wave ordering were re-validated post-CURRENT_TASK-018 with no change required.

---

## 4. Authorized Scope

| Dimension | Authorized Value |
|---|---|
| Domain | H2 — Inventory & Stock |
| Wave | Wave 3d |
| RPC Count | Exactly 7 unique RPCs |
| Sole Source File | `services/supabaseService.ts` (call-site reference only; read-only for this task) |
| Files Permitted to Change | `tests/mocks/supabase.ts` (required); optional `tests/**` self-check tests |
| Change Nature | Additive only — new handler blocks and supporting in-file store collections |
| Out of Scope | All other domains; production code; migrations; schema; generated types; audit script; CI; `package.json`; governance artifacts |

---

## 5. Authorized RPCs

The following 7 RPCs are authorized for mock coverage. No additional RPCs may be added.

| # | RPC | Sub-group | Canonical Migration File | Canonical Line | RETURNS |
|---|---|---|---|---|---|
| 1 | `cancel_inventory_count_rpc` | Inventory Count Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 2782 | `void` |
| 2 | `complete_inventory_count` | Inventory Count Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 3531 | `void` |
| 3 | `delete_inventory_count_rpc` | Inventory Count Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5571 | `void` |
| 4 | `get_stock_ledger` | Stock Ledger & Drift | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 8923 | `TABLE(...)` |
| 5 | `check_stock_ledger_drift` | Stock Ledger & Drift | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 3346 | `TABLE(...)` |
| 6 | `increment_product_quantity` | Quantity Adjustment | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 9693 | `void` |
| 7 | `get_inventory_report` | Inventory Report | `supabase/migrations/20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` | 90 | `json` |

**Authorized RPC Count: 7 / 7**

---

## 6. Dependency Verification

| Prerequisite Domain | Status | Evidence |
|---|---|---|
| Domain A — Auth, Identity & Security | **Complete** (M1) | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` |
| Domain H1 — Products & Catalog | **Complete** (Wave 3a) | `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` |

`PHASE4_COVERAGE_ROADMAP.md` §3.2 lists H2's hard dependencies as **A and H1**. Both are satisfied.

H5 (Customers) and H6 (Suppliers) are also complete as sibling commerce entity leaves, reinforcing the established Wave 3 entity-leaf pattern.

---

## 7. Canonical Source

The single canonical source for RPC names, signatures, and return shapes is the forward migration chain:

**`supabase/migrations/*.sql`** (top-level, non-recursive, excluding `rollback/`)

Each mock handler's return shape must be derivable from the corresponding `CREATE [OR REPLACE] FUNCTION public.<name>` declaration's `RETURNS` clause and parameter list.

Canonical-derived references (acceptable, one step removed):
- `supabase/schema.sql` (Phase 2 accepted)
- `supabase/generated/database.types.ts` (Phase 2 accepted)
- `D-P3-01_Reconciled_RPC_Contract.md` (Phase 3 accepted)

Non-canonical references such as `docs/admin-dashboard/RPC_CONTRACTS.md` must not override the migration chain.

---

## 8. Target Files

| File | Role | Permitted Changes |
|---|---|---|
| `tests/mocks/supabase.ts` | Test mock dispatch layer | Add 7 handler blocks and any required in-file store state |
| `tests/**` (optional) | Self-check / exercise tests | Optional small tests for the newly mocked paths |

No other files may be modified.

---

## 9. Engineering Strategy

- **Additive only.** Add new handler blocks; do not modify or remove existing handlers.
- **No refactor.** Preserve the existing single-`rpc`-function structure and chained `if (name === '...')` dispatch.
- **No redesign.** Do not change the service facade, store model, or RPC invocation contract.
- **No new abstraction.** No shared helper modules, generic builders, or domain factories. Any reusable logic must remain inline within the 7 new handler blocks.
- **Inline store additions.** Add `inventory_counts`, `inventory_count_items`, and `stock_movements` collections inside `tests/mocks/supabase.ts` if needed to support the handlers.
- **Fallback preservation.** New handlers must be inserted before the existing fallback `return { data: null, error: { ... } }`.

---

## 10. Implementation Constraints

Engineering must NOT:

- Implement any RPC outside the 7 authorized H2 RPCs.
- Modify production code in `services/`, `lib/`, `utils/`, UI, components, or pages.
- Edit migrations, `supabase/schema.sql`, or generated types.
- Edit `scripts/audit-rpc-contracts.ts` or CI workflows.
- Edit `package.json`.
- Refactor `tests/mocks/supabase.ts` to a Map-based dispatch or introduce helper modules.
- Add new governance artifacts or implementation reports.
- Re-open, re-order, or re-classify the Coverage Roadmap.

---

## 11. Validation Plan

Engineering must independently demonstrate the following gates pass before acceptance:

| Gate | Command | Expected Result |
|---|---|---|
| Audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0, **0 stale mock**, **0 duplicate handler**, coverage reported as **68.3%** |
| Type gate | `npx tsc --noEmit` | Exit 0, no TypeScript errors |
| Test gate | `npx vitest run` | All tests pass; no regression |
| Diff gate | `git diff --stat` | Changes confined to `tests/mocks/supabase.ts` and optional `tests/**`; no production, migration, schema, generated type, audit, or CI files touched |

---

## 12. Expected Coverage

| Metric | Before (CURRENT_TASK-018) | After (CURRENT_TASK-019 Target) |
|---|---|---|
| Covered code RPCs | 118 / 183 | 125 / 183 |
| Uncovered code RPCs | 65 | 58 |
| Coverage | **64.5%** | **68.3%** |
| Delta | — | **+3.8 pp** |

The orphan mock `update_tenant_status` remains counted as a mock handler but not as a covered code RPC, consistent with the accepted baseline.

---

## 13. Engineering Authorization

**Engineering Ready: YES**

**Implementation: AUTHORIZED**

This kickoff authorizes the Engineering team to implement the 7 authorized Domain H2 mock handlers in `tests/mocks/supabase.ts` in accordance with the constraints above.

---

## 14. Status

| Item | State |
|---|---|
| Engineering Readiness | Ready |
| Implementation Authorization | **AUTHORIZED** |
| Program Phase | **UNCHANGED** — Phase 4 remains active |
| Roadmap | **UNCHANGED** — `PHASE4_COVERAGE_ROADMAP.md` is not modified |
| Architecture | **UNCHANGED** — `if (name === '...')` dispatch preserved; no refactor or abstraction |

---

## 15. Next Step

Begin Engineering implementation of the 7 authorized Domain H2 RPC mock handlers in `tests/mocks/supabase.ts`.

Upon completion, produce `CURRENT_TASK-019_IMPLEMENTATION_REPORT.md` and await independent acceptance review. Do not proceed to CURRENT_TASK-020 or any other domain until CURRENT_TASK-019 is formally accepted.

---

*Generated for Engineering execution. No implementation is recorded in this document.*
