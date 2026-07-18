# CURRENT_TASK-021 — Engineering Kickoff

**Program:** VietSale Pro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3f — Domain H4 — Returns & Exchanges Mock Coverage  
**Document Type:** Engineering Readiness / Implementation Authorization  
**Date:** 2026-07-15  
**Status:** Engineering Ready

---

## Engineering Kickoff

This document authorizes the engineering team to begin implementation of CURRENT_TASK-021. It confirms architecture approval, scope, dependencies, canonical source, target files, engineering strategy, constraints, and validation gates. Implementation may begin only after this kickoff is accepted by the engineering lead.

---

## Objective

Add mock coverage for the 7 uncovered Domain H4 — Returns & Exchanges RPCs in `tests/mocks/supabase.ts`, deriving each handler's return shape from the canonical migration chain. The task continues Milestone M4 — Commerce Transactions (Wave 3f) and targets raising mock coverage from **72.1% (132/183)** to **76.0% (139/183)**.

---

## Current Program Status

| Item | Value |
|---|---|
| Active phase | Phase 4 — Derived Validation Layer Realignment |
| Current milestone | M4 — Commerce Transactions |
| Current wave | Wave 3e complete; Wave 3f ready |
| Current coverage | 72.1% (132 / 183) |
| Uncovered RPCs | 51 |
| Most recent accepted task | CURRENT_TASK-020 — Domain H3: Orders & Sales |
| Program health | HEALTHY — on track, no blockers |

Phase 4 exit criteria EC-3 (canonical audit gate alignment) and EC-4 (CI divergence gate) are satisfied. EC-1 and EC-2 remain progress-bound on the remaining coverage waves and are improving with each accepted task.

---

## Authorized Scope

### In Scope

- Add exactly 7 mock handlers to `tests/mocks/supabase.ts` for Domain H4 — Returns & Exchanges.
- Derive each mock's return shape and parameter contract from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern.
- Additive changes only; no refactor, redesign, or abstraction.
- Optional supporting tests under `tests/` that exercise the newly mocked paths.

### Out of Scope

- Production code changes (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migration, schema, or generated type modifications.
- Changes to `scripts/audit-rpc-contracts.ts`, CI workflows, or `package.json`.
- New governance artifacts, implementation reports, acceptance records, or CURRENT_TASK-022.
- Re-ordering, re-classifying, or expanding the Coverage Roadmap.

---

## Authorized RPCs

The following 7 RPCs are authorized for mock coverage. No additional RPCs may be added.

| # | RPC | Sub-group | Canonical Migration File | Canonical Line | RETURNS |
|---|---|---|---|---|---|
| 1 | `get_return_order_auto_code` | Return Auto-code | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 8602 | `text` |
| 2 | `create_return_order` | Return Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 4645 | `jsonb` |
| 3 | `create_exchange_transaction` | Return/Exchange Transaction | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 3830 | `jsonb` |
| 4 | `filter_return_orders_rpc` | Return Search | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 6325 | `json` |
| 5 | `cancel_return_order_v2` | Return Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 2973 | `jsonb` |
| 6 | `create_supplier_exchange` | Supplier Exchange | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 4800 | `jsonb` |
| 7 | `cancel_supplier_exchange` | Supplier Exchange | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 3051 | `jsonb` |

**Authorized RPC Count: 7 / 7**

---

## Dependency Verification

All prerequisite domains for Domain H4 are complete.

| Prerequisite Domain | Status | Evidence |
|---|---|---|
| Domain A — Auth, Identity & Security | Complete (M1) | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` |
| Domain H1 — Products & Catalog | Complete (Wave 3a) | `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` |
| Domain H5 — Customers | Complete (Wave 3b) | `CURRENT_TASK-017_ACCEPTANCE_RECORD.md` |
| Domain H6 — Suppliers | Complete (Wave 3c) | `CURRENT_TASK-018_ACCEPTANCE_RECORD.md` |
| Domain H2 — Inventory & Stock | Complete (Wave 3d) | `CURRENT_TASK-019_ACCEPTANCE_RECORD.md` |
| Domain H3 — Orders & Sales | Complete (Wave 3e) | `CURRENT_TASK-020_ACCEPTANCE_RECORD.md` |

Domain H4's hard dependencies (A, H3, H1, H6) and supporting sibling domains (H2, H5) are satisfied.

---

## Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | Canonical | `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1; `CURRENT_TASK-012`; `CURRENT_TASK-013` |

The canonical source for RPC names, parameter lists, and return shapes is the `CREATE [OR REPLACE] FUNCTION public.<name>` declaration for each authorized RPC in the forward migration chain. Engineering must not use derived documents, service call sites, or previous mock patterns as the contract authority.

---

## Target Files

| File | Purpose | Change Type |
|---|---|---|
| `tests/mocks/supabase.ts` | Add 7 Domain H4 mock handlers | Additive only |
| `tests/**/*.test.ts` (optional) | Add or extend tests exercising the newly mocked return/exchange paths | Additive only |

`services/supabaseService.ts` is a read-only call-site reference for this task and must not be modified.

---

## Engineering Strategy

1. **Canonical-first derivation.** For each authorized RPC, read the corresponding `CREATE [OR REPLACE] FUNCTION` declaration in `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` and match the mock return type and shape to the declared `RETURNS` clause.
2. **Preserve dispatch pattern.** Add each handler using the existing `if (name === "...")` chain in `tests/mocks/supabase.ts`. Do not introduce Map-based dispatch, shared helpers, or new abstractions.
3. **Additive implementation.** Only add code; do not refactor existing handlers, reorder the dispatch chain, or change existing return shapes.
4. **Minimal in-file state.** Introduce only the in-file store state necessary to support return/exchange lifecycle paths (e.g., tracking created return orders or supplier exchanges). Avoid generalized stores.
5. **No production code changes.** If a mock shape reveals a service-layer mismatch, escalate rather than modify `services/supabaseService.ts` or any other production file.

---

## Implementation Constraints

- **Architecture:** Keep the existing `if (name === "...")` dispatch pattern unchanged.
- **Scope:** Implement exactly the 7 authorized RPCs; no more, no less.
- **Refactor:** None. No redesign, no abstraction, no extraction of shared helpers.
- **Dependencies:** No new dependencies. Use only what is already present in the codebase.
- **Canonical fidelity:** Return shapes and parameter handling must follow the canonical migration chain, not behavioral assumptions from the service call site.
- **Regressions:** Existing tests must continue to pass; no changes may reduce coverage or break the audit gate.

---

## Validation Plan

The following gates must pass after implementation:

1. **Audit gate:** `npx tsx scripts/audit-rpc-contracts.ts`
   - Exit 0
   - 0 stale mock
   - 0 duplicate handler
   - Coverage derived from canonical migration chain

2. **Type gate:** `npx tsc --noEmit`
   - Exit 0, no TypeScript errors

3. **Test gate:** `npx vitest run`
   - Exit 0
   - No regression
   - Existing test count must not decrease

---

## Expected Coverage

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Covered RPCs | 132 | 139 | +7 |
| Uncovered RPCs | 51 | 44 | −7 |
| Coverage | 72.1% | 76.0% | +3.9 pp |

---

## Engineering Authorization

- **Architecture Decision:** APPROVED
- **Current Task:** CURRENT_TASK-021
- **Domain:** H4 — Returns & Exchanges
- **Wave:** Wave 3f
- **Implementation:** AUTHORIZED
- **Program Phase:** UNCHANGED — remains Phase 4
- **Roadmap:** UNCHANGED — `PHASE4_COVERAGE_ROADMAP.md` remains authoritative
- **Architecture:** UNCHANGED — canonical migration-first principle and existing dispatch pattern preserved

---

## Status

**Engineering Ready.** Implementation of CURRENT_TASK-021 is authorized to proceed.

---

## Next Step

Engineering team begins implementation of the 7 authorized Domain H4 mock handlers in `tests/mocks/supabase.ts`, followed by running the validation gates. No further planning, kickoff, or governance artifacts are required before implementation starts.
