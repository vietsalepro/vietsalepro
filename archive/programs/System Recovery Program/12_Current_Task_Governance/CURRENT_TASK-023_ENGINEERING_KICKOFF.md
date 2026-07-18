# CURRENT_TASK-023 — Engineering Kickoff

**Program:** VietSale Pro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3h — Domain H8 — Disposals Mock Coverage  
**Document Type:** Engineering Readiness  
**Date:** 2026-07-15  
**Status:** Engineering Ready

---

## Engineering Kickoff

This document confirms engineering readiness for CURRENT_TASK-023. It records architecture approval, scope, dependencies, canonical source, target files, engineering strategy, constraints, and validation gates. Implementation is not authorized at this stage and requires separate approval after this kickoff is accepted.

---

## Objective

Add mock coverage for the 3 uncovered Domain H8 — Disposals RPCs in `tests/mocks/supabase.ts`, deriving each handler's return shape from the canonical migration chain. The task continues Milestone M4 — Commerce Transactions (Wave 3h) and targets raising mock coverage from **80.3% (147/183)** to approximately **82.0% (150/183)**.

---

## Current Program Status

| Item | Value |
|---|---|
| Active phase | Phase 4 — Derived Validation Layer Realignment |
| Current milestone | M4 — Commerce Transactions |
| Current wave | Wave 3g complete; Wave 3h ready |
| Current coverage | 80.3% (147 / 183) |
| Uncovered RPCs | 36 |
| Most recent accepted task | CURRENT_TASK-022 — Domain H7: Imports |
| Program health | HEALTHY — on track, no blockers |

Phase 4 exit criteria EC-3 (canonical audit gate alignment) and EC-4 (CI divergence gate) remain open as known residuals. EC-1 and EC-2 continue to progress with each coverage wave.

---

## Authorized Scope

### In Scope

- Add exactly 3 mock handlers to `tests/mocks/supabase.ts` for Domain H8 — Disposals.
- Derive each mock's return shape and parameter contract from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern.
- Additive changes only; no refactor, redesign, or abstraction.
- If required, add minimal in-memory store state for `disposals` and `disposal_items` so the new handlers can exercise the authorized RPCs consistently with other commerce-domain mocks.

### Out of Scope

- Production code changes (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migration, schema, or generated type modifications.
- Changes to `scripts/audit-rpc-contracts.ts`, CI workflows, or `package.json`.
- New governance artifacts, post-implementation artifacts, acceptance records, or CURRENT_TASK-024.
- Re-ordering, re-classifying, or expanding the Coverage Roadmap.

---

## Authorized RPCs

The following 3 RPCs are authorized for mock coverage. No additional RPCs may be added.

| # | RPC | Sub-group | Canonical Migration File | Canonical Line | RETURNS |
|---|---|---|---|---:|---|
| 1 | `delete_disposal_with_restore` | Disposal Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5355 | `void` |
| 2 | `filter_disposals_rpc` | Disposal Search | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 6093 | `json` |
| 3 | `get_disposal_auto_code` | Disposal Code | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7347 | `text` |

**Authorized RPC Count: 3 / 3**

### Canonical signatures

```sql
-- delete_disposal_with_restore
CREATE OR REPLACE FUNCTION "public"."delete_disposal_with_restore"("p_disposal_id" "text") RETURNS "void"

-- filter_disposals_rpc
CREATE OR REPLACE FUNCTION "public"."filter_disposals_rpc"(
  "p_search_term" "text" DEFAULT NULL::"text",
  "p_page" integer DEFAULT 1,
  "p_page_size" integer DEFAULT 20,
  "p_from_date" "date" DEFAULT NULL::"date",
  "p_to_date" "date" DEFAULT NULL::"date",
  "p_status" "text" DEFAULT NULL::"text"
) RETURNS "json"

-- get_disposal_auto_code
CREATE OR REPLACE FUNCTION "public"."get_disposal_auto_code"() RETURNS "text"
```

### Service call sites

All three RPCs are invoked from `services/supabaseService.ts`:

- `filterDisposalsPaginated` calls `filter_disposals_rpc` and expects `{ disposals: any[]; totalCount: number }`.
- `createDisposal` calls `get_disposal_auto_code` and expects a non-empty string formatted as a disposal code.
- `deleteDisposal` calls `delete_disposal_with_restore` with `p_disposal_id` and expects `void` on success.

`services/supabaseService.ts` is a read-only call-site reference for this task and must not be modified.

---

## Dependency Verification

All prerequisite domains for Domain H8 are complete.

| Prerequisite Domain | Status | Evidence |
|---|---|---|
| Domain A — Auth, Identity & Security | Complete (M1) | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` |
| Domain H1 — Products & Catalog | Complete (Wave 3a) | `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` |
| Domain H5 — Customers | Complete (Wave 3b) | `CURRENT_TASK-017_ACCEPTANCE_RECORD.md` |
| Domain H6 — Suppliers | Complete (Wave 3c) | `CURRENT_TASK-018_ACCEPTANCE_RECORD.md` |
| Domain H2 — Inventory & Stock | Complete (Wave 3d) | `CURRENT_TASK-019_ACCEPTANCE_RECORD.md` |
| Domain H3 — Orders & Sales | Complete (Wave 3e) | `CURRENT_TASK-020_ACCEPTANCE_REVIEW.md` |
| Domain H4 — Returns & Exchanges | Complete (Wave 3f) | `CURRENT_TASK-021_ACCEPTANCE_REVIEW.md` |
| Domain H7 — Imports | Complete (Wave 3g) | `CURRENT_TASK-022_ACCEPTANCE_REVIEW_v2.md` |

Domain H8's hard dependencies (A, H1, H2) and supporting sibling domains are satisfied.

---

## Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | Canonical | `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1; `CURRENT_TASK-012`; `CURRENT_TASK-013` |

The canonical source for RPC names, parameter lists, and return shapes is the `CREATE [OR REPLACE] FUNCTION public.<name>` declaration for each authorized RPC in the forward migration chain. Engineering must not use derived documents, service call sites, or previous mock patterns as the contract authority.

### Filter RPC return shape

Per `filter_disposals_rpc` (line 6093), the function returns:

```json
{
  "disposals": [
    {
      "id": "...",
      "code": "...",
      "date": "...",
      "created_by": "...",
      "status": "...",
      "reason": "...",
      "note": "...",
      "total_quantity": 0,
      "total_value": 0,
      "created_at": "...",
      "updated_at": "...",
      "disposal_items": [
        {
          "id": "...",
          "disposal_id": "...",
          "product_id": "...",
          "product_code": "...",
          "product_name": "...",
          "quantity": 0,
          "cost_price": 0,
          "total_value": 0,
          "lot_id": "...",
          "lot_code": "...",
          "expiry_date": "...",
          "category_id": "...",
          "category_name": "...",
          "brand_id": "...",
          "brand_name": "..."
        }
      ]
    }
  ],
  "totalCount": 0
}
```

### Code generation RPC

Per `get_disposal_auto_code` (line 7347), the function returns a string of the form `XH` plus a 6-digit, zero-padded sequence number based on the count of existing disposals plus one. The mock handler should preserve this format and maintain stable, deterministic output within a test run.

### Delete with restore RPC

Per `delete_disposal_with_restore` (line 5355), the function accepts `p_disposal_id text` and returns `void`. For mock purposes, the handler should locate the disposal in the in-memory store and remove it, returning `{ data: null, error: null }` consistent with existing delete handlers. The restore-stock behavior defined in the migration may be simulated minimally only if required by existing tests; otherwise, deletion of the record is sufficient for contract coverage.

---

## Target Files

| File | Purpose | Change Type |
|---|---|---|
| `tests/mocks/supabase.ts` | Add 3 Domain H8 mock handlers and, if necessary, minimal `disposals` / `disposal_items` store entries | Additive only |
| `tests/**/*.test.ts` (optional) | Add or extend tests exercising the newly mocked disposal paths | Additive only |

---

## Engineering Strategy

1. **Canonical-first derivation.** For each authorized RPC, read the corresponding `CREATE [OR REPLACE] FUNCTION` declaration in `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` and match the mock return type and shape to the declared `RETURNS` clause.
2. **Preserve dispatch pattern.** Add each handler using the existing `if (name === "...")` chain in `tests/mocks/supabase.ts`. Do not introduce Map-based dispatch, shared helpers, or new abstractions.
3. **Additive implementation.** Only add code; do not refactor existing handlers, reorder the dispatch chain, or change existing return shapes.
4. **Minimal in-file state.** If `disposals` and `disposal_items` are not already present in the in-memory `store`, add them as empty arrays in the store initializer. Do not add generalized stores beyond the two tables required by the authorized RPCs.
5. **No production code changes.** If a mock shape reveals a service-layer mismatch, escalate rather than modify `services/supabaseService.ts` or any other production file.

---

## Implementation Constraints

- **Architecture:** Keep the existing `if (name === "...")` dispatch pattern unchanged.
- **Scope:** Implement exactly the 3 authorized RPCs; no more, no less.
- **Refactor:** None. No redesign, no abstraction, no extraction of shared helpers.
- **Dependencies:** No new dependencies. Use only what is already present in the codebase.
- **Canonical fidelity:** Return shapes and parameter handling must follow the canonical migration chain, not behavioral assumptions from the service call site.
- **Regressions:** Existing tests must continue to pass; no changes may reduce coverage or break the audit gate.

---

## Validation Plan

The following gates must pass after implementation:

1. **Audit gate:** `npx tsx scripts/audit-rpc-contracts.ts`
   - Exit 0
   - 125 / 125 RPC contracts in sync
   - 0 stale mock
   - 0 duplicate handler

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
| Covered RPCs | 147 | 150 | +3 |
| Uncovered RPCs | 36 | 33 | −3 |
| Coverage | 80.3% | ~82.0% | +1.7 pp |

---

## Engineering Readiness Summary

- **Architecture Decision:** APPROVED
- **Current Task:** CURRENT_TASK-023
- **Domain:** H8 — Disposals
- **Wave:** Wave 3h
- **Implementation:** NOT AUTHORIZED
- **Program Phase:** UNCHANGED — remains Phase 4
- **Roadmap:** UNCHANGED — `PHASE4_COVERAGE_ROADMAP.md` remains authoritative
- **Architecture:** UNCHANGED — canonical migration-first principle and existing dispatch pattern preserved

---

## Status

**Engineering Ready.** Implementation of CURRENT_TASK-023 is NOT authorized until formal approval is granted.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_022.md`, `CURRENT_TASK-023_PROGRAM_AUTHORIZATION.md`, `CURRENT_TASK-023_ARCHITECTURE_DECISION.md`, `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`, `services/supabaseService.ts`, `tests/mocks/supabase.ts`.*
