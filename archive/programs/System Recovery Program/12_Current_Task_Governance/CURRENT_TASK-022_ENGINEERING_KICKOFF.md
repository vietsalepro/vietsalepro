# CURRENT_TASK-022 — Engineering Kickoff

**Program:** VietSale Pro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3g — Domain H7 — Imports Mock Coverage  
**Document Type:** Engineering Readiness  
**Date:** 2026-07-15  
**Status:** Engineering Ready

---

## Engineering Kickoff

This document confirms engineering readiness for CURRENT_TASK-022. It records architecture approval, scope, dependencies, canonical source, target files, engineering strategy, constraints, and validation gates. Implementation is not authorized at this stage and requires separate approval after this kickoff is accepted.

---

## Objective

Add mock coverage for the 8 uncovered Domain H7 — Imports RPCs in `tests/mocks/supabase.ts`, deriving each handler's return shape from the canonical migration chain. The task continues Milestone M4 — Commerce Transactions (Wave 3g) and targets raising mock coverage from **76.0% (139/183)** to **80.3% (147/183)**.

---

## Current Program Status

| Item | Value |
|---|---|
| Active phase | Phase 4 — Derived Validation Layer Realignment |
| Current milestone | M4 — Commerce Transactions |
| Current wave | Wave 3f complete; Wave 3g ready |
| Current coverage | 76.0% (139 / 183) |
| Uncovered RPCs | 44 |
| Most recent accepted task | CURRENT_TASK-021 — Domain H4: Returns & Exchanges |
| Program health | HEALTHY — on track, no blockers |

Phase 4 exit criteria EC-3 (canonical audit gate alignment) and EC-4 (CI divergence gate) are satisfied. EC-1 and EC-2 remain progress-bound on the remaining coverage waves and are improving with each accepted task.

---

## Authorized Scope

### In Scope

- Add exactly 8 mock handlers to `tests/mocks/supabase.ts` for Domain H7 — Imports.
- Derive each mock's return shape and parameter contract from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern.
- Additive changes only; no refactor, redesign, or abstraction.
- Optional supporting tests under `tests/` that exercise the newly mocked paths.

### Out of Scope

- Production code changes (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migration, schema, or generated type modifications.
- Changes to `scripts/audit-rpc-contracts.ts`, CI workflows, or `package.json`.
- New governance artifacts, post-implementation artifacts, acceptance records, or CURRENT_TASK-023.
- Re-ordering, re-classifying, or expanding the Coverage Roadmap.

---

## Authorized RPCs

The following 8 RPCs are authorized for mock coverage. No additional RPCs may be added.

| # | RPC | Sub-group | Canonical Migration File | Canonical Line | RETURNS |
|---|---|---|---|---|---|
| 1 | `delete_import_v2` | Import Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5384 | `jsonb` |
| 2 | `process_import_v2` | Import Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 10865 | `jsonb` |
| 3 | `update_import_v2` | Import Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 12649 | `jsonb` |
| 4 | `filter_import_receipts_rpc` | Import Search | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 6170 / 6208 | `json` |
| 5 | `get_import_receipt_count_by_date` | Import Stats | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7570 | `integer` |
| 6 | `get_import_receipts_by_product_and_lot` | Import Query | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7578 | `json` |
| 7 | `get_import_receipts_by_supplier_id` | Import Query | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7618 | `json` |
| 8 | `get_import_stats` | Import Stats | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7644 | `json` |

**Authorized RPC Count: 8 / 8**

Note: `filter_import_receipts_rpc` exists in the canonical migration chain with two overloaded signatures (lines 6170 and 6208). Both overloads must be reachable through the same dispatch handler, consistent with the existing `if (name === "...")` pattern.

---

## Dependency Verification

All prerequisite domains for Domain H7 are complete.

| Prerequisite Domain | Status | Evidence |
|---|---|---|
| Domain A — Auth, Identity & Security | Complete (M1) | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` |
| Domain H1 — Products & Catalog | Complete (Wave 3a) | `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` |
| Domain H5 — Customers | Complete (Wave 3b) | `CURRENT_TASK-017_ACCEPTANCE_RECORD.md` |
| Domain H6 — Suppliers | Complete (Wave 3c) | `CURRENT_TASK-018_ACCEPTANCE_RECORD.md` |

Domain H7's hard dependencies (A, H1, H6) and supporting sibling domain (H5) are satisfied.

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
| `tests/mocks/supabase.ts` | Add 8 Domain H7 mock handlers | Additive only |
| `tests/**/*.test.ts` (optional) | Add or extend tests exercising the newly mocked import paths | Additive only |

`services/supabaseService.ts` is a read-only call-site reference for this task and must not be modified.

---

## Engineering Strategy

1. **Canonical-first derivation.** For each authorized RPC, read the corresponding `CREATE [OR REPLACE] FUNCTION` declaration in `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` and match the mock return type and shape to the declared `RETURNS` clause.
2. **Preserve dispatch pattern.** Add each handler using the existing `if (name === "...")` chain in `tests/mocks/supabase.ts`. Do not introduce Map-based dispatch, shared helpers, or new abstractions.
3. **Additive implementation.** Only add code; do not refactor existing handlers, reorder the dispatch chain, or change existing return shapes.
4. **Minimal in-file state.** Introduce only the in-file store state necessary to support import lifecycle paths (e.g., tracking created or updated import receipts). Avoid generalized stores.
5. **No production code changes.** If a mock shape reveals a service-layer mismatch, escalate rather than modify `services/supabaseService.ts` or any other production file.

---

## Implementation Constraints

- **Architecture:** Keep the existing `if (name === "...")` dispatch pattern unchanged.
- **Scope:** Implement exactly the 8 authorized RPCs; no more, no less.
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
| Covered RPCs | 139 | 147 | +8 |
| Uncovered RPCs | 44 | 36 | −8 |
| Coverage | 76.0% | 80.3% | +4.3 pp |

---

## Engineering Readiness Summary

- **Architecture Decision:** APPROVED
- **Current Task:** CURRENT_TASK-022
- **Domain:** H7 — Imports
- **Wave:** Wave 3g
- **Implementation:** NOT AUTHORIZED
- **Program Phase:** UNCHANGED — remains Phase 4
- **Roadmap:** UNCHANGED — `PHASE4_COVERAGE_ROADMAP.md` remains authoritative
- **Architecture:** UNCHANGED — canonical migration-first principle and existing dispatch pattern preserved

---

## Status

**Engineering Ready.** Implementation of CURRENT_TASK-022 is NOT authorized until formal approval is granted.

---

## Next Step

Engineering Kickoff completed.

Stop Point:

Await formal approval before Engineering Implementation begins.

No implementation activities are authorized at this stage.
