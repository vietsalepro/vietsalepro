# CURRENT_TASK-018 — Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Document Type:** Architecture Decision (Program Manager Decision — no implementation)  
**Date:** 2026-07-15  
**Status:** Architecture Decision Draft — Awaiting Program Manager Approval  
**Authorizing CURRENT_TASK:** CURRENT_TASK-018 — Suppliers Mock Coverage (Wave 3c / TASK-H6)  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_017.md`, `CURRENT_TASK-017_ACCEPTANCE_RECORD.md`, `CURRENT_TASK-017_ARCHITECTURE_DECISION.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`

---

> **No implementation. No code change. No migration. No schema change. No generated type. No mock RPC written by this document.**
> This document is a Program Manager architecture decision deliverable only. It selects the next domain per the already-approved Coverage Roadmap and defines the architecture of CURRENT_TASK-018. No implementation may begin until the Program Manager approves this decision and a separate Implementation/Kickoff authorization is issued.

---

## 1. Objective

Authorize the fifth domain-scoped coverage task of the Phase 4 Coverage Roadmap and define its architecture.

Concretely, CURRENT_TASK-018 shall mock the **7 uncovered RPCs of Domain H6 — Suppliers** in `tests/mocks/supabase.ts`, following the existing `if (name === '...')` dispatch pattern, with each mock's return shape derived from the canonical migration chain. The task raises mock coverage from **60.7% (111/183)** to **64.5% (118/183)** — a **+3.8 percentage-point** delta — and completes the third Core Commerce entity leaf (Wave 3c).

This decision does **not** re-open the Coverage Roadmap. The Roadmap strategy (Wave / Domain / Dependency / Milestone) was approved in `CURRENT_TASK-014_ARCHITECTURE_DECISION.md` §5.1, re-validated post-M1, post-M2, post-M3, and post-CURRENT_TASK-017 in `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_017.md` §5 with no change. This document only confirms Domain H6 as the next domain per the roadmap's dependency-driven ordering (Wave 3c), now that its prerequisites are satisfied.

---

## 2. Background

| Item | State | Source |
|---|---|---|
| Phase 4 status | Active, in good standing | `CURRENT_PHASE.md` §1; `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_017.md` §2 |
| Last closed CURRENT_TASK | CURRENT_TASK-017 — Customers Mock Coverage — Accepted with Minor Notes (2026-07-15) | `CURRENT_TASK-017_ACCEPTANCE_RECORD.md` §14 |
| Coverage milestone reached | **M3 (Progress) — 60.7%** — 111/183 code RPCs covered, independently reproduced | `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_017.md` §3.1 |
| Coverage Roadmap status | Valid; wave ordering, domain classification, dependencies, and priority re-confirmed post-CURRENT_TASK-017 with no change | `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_017.md` §5 |
| Next domain per roadmap | Wave 3c — Domain H6: Suppliers (7 RPCs, 60.7% → 64.5%, Low effort) | `PHASE4_COVERAGE_ROADMAP.md` §2, §6.2; `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_017.md` §5.2 |
| Domain H6 prerequisite | Domain A (Auth) — **satisfied** (M1 complete, accepted); Domain H1 (Products & Catalog) — **satisfied** (M3 Wave 3a complete, accepted); Domain H5 (Customers) — **satisfied** (Wave 3b complete, accepted) | `PHASE4_COVERAGE_ROADMAP.md` §3.2; `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_017.md` §5.3 |
| Audit gate | Frozen and accepted (CURRENT_TASK-012/013); independently re-run green 2026-07-15 | `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_017.md` §3.1 |
| Phase 4 exit criteria | EC-3, EC-4 DONE; EC-1, EC-2 PARTIAL (progress-bound on remaining coverage waves) | `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_017.md` §6 |

CURRENT_TASK-017 is closed. No CURRENT_TASK-018 existed prior to this document. Phase 4 remains active.

---

## 3. Authorized Scope

### 3.1 In Scope

The 7 uncovered Domain H6 RPCs, all called from the core commerce facade barrel `services/supabaseService.ts`:

| Sub-group | RPCs | Source File |
|---|---|---|
| Supplier Lookup & Filter | `search_suppliers_rpc`, `filter_suppliers_rpc` | `services/supabaseService.ts` |
| Supplier Aggregates | `get_supplier_stats`, `get_supplier_report` | `services/supabaseService.ts` |
| Supplier Debt | `get_supplier_debt_ledger`, `adjust_supplier_debt`, `pay_supplier_debt` | `services/supabaseService.ts` |

**Count: 7 unique RPCs.** All 7 are called exclusively from `services/supabaseService.ts` (no cross-file sharing). A single handler per name serves its one call-site.

**Files permitted to change:**
- `tests/mocks/supabase.ts` — add 7 handler blocks.
- Test files under `tests/` that exercise the newly-mocked supplier paths (encouraged, not mandatory for coverage-only acceptance).

### 3.2 Out of Scope

- All other domains: A (complete), B (complete), C, D, E, F, G, H1 (complete), H2, H3, H4, H5 (complete), H7–H9.
- Any production code (`services/`, `lib/`, `utils/`, UI, components, pages) — including `services/supabaseService.ts`, which is a call-site only, read-only reference for inventory.
- Any migration, `supabase/schema.sql`, or generated types.
- The audit script `scripts/audit-rpc-contracts.ts` (accepted and frozen in CURRENT_TASK-013).
- CI workflow (`.github/workflows/ci.yml`) and `package.json`.
- Any new file, script, or governance artifact.
- Mock behavioral shape-validation gate (deferred to a possible Phase 4+ hardening task per Roadmap §8).
- Refactor of `tests/mocks/supabase.ts` to a Map-based dispatch (Roadmap §8 risk note; explicitly deferred).
- Re-opening, re-ordering, or re-classifying the Coverage Roadmap.

### 3.3 Governance Boundary

CURRENT_TASK-018 processes **exactly one sub-domain** (Domain H6 — Suppliers). It is well under the ~20-RPC task-sizing ceiling (7 RPCs). It satisfies the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8): maps to the Phase 4 objective "test mocks derived from / validated against the canonical migration contract"; stays inside Phase 4 scope; honors Phase 4 constraints; produces Phase 4 exit evidence (coverage delta + audit gate green).

---

## 4. Domain Confirmation (Roadmap Cross-Check)

Domain H6 is confirmed against `PHASE4_COVERAGE_ROADMAP.md`:

| Attribute | Roadmap Value (§2 Domain H, §4, §5.1, §6.2) | Confirmed |
|---|---|---|
| Domain | H6 — Suppliers (sub-domain of H — Core Commerce) | YES |
| Wave | Wave 3c | YES |
| RPC count | 7 unique RPCs | YES |
| Sub-groups | Supplier Lookup & Filter (2), Supplier Aggregates (2), Supplier Debt (3) | YES |
| Source file | `services/supabaseService.ts` (sole carrier) | YES |
| Dependency | Depends on A (Auth) | YES — A complete (M1) |
| Priority Score | Commerce entity leaf; unblocks H4 and H7 | YES |
| Priority rank | Commerce entity leaves: H1 → H5 → H6 (§6.2) | YES |
| Estimated complexity | Low — 7 Simple, 0 Medium, 0 Complex per Roadmap | YES |
| Estimated handler lines | ~70 | YES |
| Estimated effort | Low — one focused session | YES |
| Expected coverage increase | 60.7% → 64.5% (+3.8 pp; 111/183 → 118/183 covered; 72 → 65 uncovered) | YES |
| Risk | Low — entity mocks; `adjust_supplier_debt` and `pay_supplier_debt` mutate supplier debt / ledger but have deterministic return shapes | YES |

**No deviation from the approved Roadmap.** The Roadmap is not modified by this document.

---

## 5. Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | **Canonical** | Master Plan §2.1; reaffirmed in CURRENT_TASK-012 and CURRENT_TASK-013. |

The canonical source for the 7 Domain H6 RPCs is the set of `CREATE [OR REPLACE] FUNCTION public.<name>` declarations for those 7 names in the forward migration chain. Each mock handler's return shape must be derivable from the corresponding migration function's `RETURNS` clause and parameter list.

**Canonical migration file defining the 7 H6 RPCs:**
- `20250703000000_baseline_pre_tenant_schema.sql` — first and only definition of all 7 RPCs.

**Canonical-derived references (acceptable, one step removed):**
- `supabase/schema.sql` (Phase 2 accepted) — final-state function definitions.
- `supabase/generated/database.types.ts` (Phase 2 accepted) — typed `Functions` block.
- `D-P3-01_Reconciled_RPC_Contract.md` (Phase 3 accepted) — reconciled service call-sites.

**Non-canonical (must not override):** `docs/admin-dashboard/RPC_CONTRACTS.md` and any other hand-maintained derived document. The audit script no longer reads it (CURRENT_TASK-012); this task must not reintroduce it as a reference.

**Verification mechanism:** `npx tsx scripts/audit-rpc-contracts.ts` — the same gate accepted in CURRENT_TASK-013. It enforces mock ⊆ migrations (stale-mock hard fail), duplicate-handler hard fail, and reports coverage informationally. The coverage target for this task is **64.5%** (118/183 code RPCs covered), not a hard pass threshold; the hard gates are stale-mock = 0 and duplicate = 0.

---

## 6. Architecture Constraints

Engineering must honor the constraints already validated across CURRENT_TASK-014 through CURRENT_TASK-017. This Architecture Decision does not introduce new constraints; it re-asserts the existing Phase 4 Coverage Roadmap architecture.

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
| 9 | **Within CURRENT_TASK boundary** | Only the 7 H6 RPCs may be added. No adjacent domain RPCs, no "while we're here" additions. |
| 10 | **No production, migration, schema, generated type, audit, or CI change** | Scope is strictly the test mock layer and optional tests exercising it. |

---

## 7. Dependencies

Domain H6 has been unlocked by the completion of its prerequisites:

| Prerequisite Domain | Status | Evidence | Why It Unlocks H6 |
|---|---|---|---|
| Domain A — Auth, Identity & Security | Complete (M1) | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` §14 | H6 service functions call through `lib/permissions.ts` guards (`has_tenant_role`, `is_tenant_owner`, etc.). A mocks must exist for supplier tests to reach the RPC under test. |
| Domain H1 — Products & Catalog | Complete (Wave 3a) | `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` §14 | H6 is a commerce entity leaf; H1 completion validated the Wave 3 pattern and the commerce store model, but H6 does not functionally depend on product mocks. |
| Domain H5 — Customers | Complete (Wave 3b) | `CURRENT_TASK-017_ACCEPTANCE_RECORD.md` §14 | H5 validated the "entity leaf → debt ledger" handler shape. H6 mirrors this pattern (supplier debt ledger, payment, adjustment) and is ordered after H5 per the Roadmap. |

`PHASE4_COVERAGE_ROADMAP.md` §3.2 lists H6's dependency as **A only**. H1 and H5 are noted here as completed sibling leaves, not as hard blockers, because their completion demonstrates the Wave 3 entity-leaf pattern is established and accepted.

---

## 8. Shared Helpers

**No new helpers. No new modules.**

The existing in-file patterns in `tests/mocks/supabase.ts` (tenant-scoped store arrays, `crypto.randomUUID()` for generated IDs, `Number()` conversions, `Date` handling, `return { data, error }` envelopes) are sufficient. Engineering may replicate local patterns from the H5 customer handlers where supplier semantics are identical (e.g., search/filter debt ledger shapes), but any helper-like code must remain inline inside the 7 new `if` blocks.

If a supplier handler genuinely repeats the exact same 3+ lines as an existing customer handler, a small inline closure inside the same file is acceptable; no new file or exported utility may be created.

---

## 9. Validation Requirements

Engineering must independently demonstrate that the following gates pass before acceptance. These are the same gates used for CURRENT_TASK-014 through CURRENT_TASK-017.

| Gate | Command | Expected Result |
|---|---|---|
| Audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0, **0 stale mock**, **0 duplicate handler**, coverage reported as **64.5%** (118/183). |
| Type gate | `npx tsc --noEmit` | Exit 0, no TypeScript errors. |
| Test gate | `npx vitest run` | All existing tests pass; no regression. |
| Diff gate | `git diff --stat` | Changes confined to `tests/mocks/supabase.ts` and optional `tests/**` self-check tests; no production, migration, schema, generated type, audit, or CI files touched. |

Acceptance will be recorded in `CURRENT_TASK-018_ACCEPTANCE_RECORD.md` only after the above are independently reproduced by the Program Manager.

---

## 10. Expected Coverage

| Metric | Before (CURRENT_TASK-017 accepted) | After (CURRENT_TASK-018 target) |
|---|---|---|
| Covered code RPCs | 111 / 183 | 118 / 183 |
| Uncovered code RPCs | 72 | 65 |
| Coverage | **60.7%** | **64.5%** |
| Delta | — | **+3.8 pp** |

The 7 new H6 handlers add 7 newly-covered code RPCs. The orphan mock `update_tenant_status` remains counted as a mock handler but not as a covered code RPC, consistent with CURRENT_TASK-013 accepted state.

---

## 11. Risk

| Risk | Level | Mitigation |
|---|---|---|
| `adjust_supplier_debt` and `pay_supplier_debt` mutate supplier debt / ledger state | Low | Follow the established H5 customer debt mutation pattern; deterministic return shape read from canonical migration. No production code is touched. |
| `get_supplier_report` date-range aggregate | Low | Match canonical `RETURNS json` contract; return shape mirrors `get_customer_report` already accepted in H5. |
| Coverage delta smaller or larger than +3.8 pp | Low | Roadmap estimate is based on 183 unique code RPCs and 7 new handlers. If the audit inventory changes, the Program Manager will reconcile against the CURRENT_TASK-018 acceptance evidence, not the pre-computed percentage. |
| Accidental refactor of dispatch pattern | Low | Constrained by §6 and verified by diff gate. |

---

## 12. Deliverable Summary

This Architecture Decision authorizes:

- **Domain:** H6 — Suppliers
- **Wave:** Wave 3c
- **RPC Count:** 7 / 7
- **Target Files:** `tests/mocks/supabase.ts` (required), optional `tests/**`
- **Coverage Target:** 60.7% → 64.5%
- **Next Step:** Engineering Kickoff (separate authorization)

---

# Báo cáo cuối

## ARCHITECTURE DECISION

### Objective

Authorize Wave 3c — Domain H6 — Suppliers mock coverage. Add 7 supplier RPC handlers to `tests/mocks/supabase.ts` following the existing `if (name === '...')` dispatch pattern, with return shapes derived from the canonical migration chain. Raise mock coverage from **60.7%** to **64.5%**.

### Scope

- **In scope:** 7 uncovered RPCs of Domain H6 — Suppliers, all called from `services/supabaseService.ts`:
  - `search_suppliers_rpc`
  - `filter_suppliers_rpc`
  - `get_supplier_stats`
  - `get_supplier_report`
  - `get_supplier_debt_ledger`
  - `adjust_supplier_debt`
  - `pay_supplier_debt`
- **Permitted files:** `tests/mocks/supabase.ts`; optional `tests/**` self-check tests.
- **Out of scope:** production code, migrations, schema, generated types, audit script, CI, `package.json`, governance artifacts, other domains.

### Authorized RPCs

7 / 7

| RPC | Canonical Migration File | Canonical Line | RETURNS |
|---|---|---|---|
| `search_suppliers_rpc` | `20250703000000_baseline_pre_tenant_schema.sql` | 11969 | `SETOF public.suppliers` |
| `filter_suppliers_rpc` | `20250703000000_baseline_pre_tenant_schema.sql` | 6367 | `json` |
| `get_supplier_stats` | `20250703000000_baseline_pre_tenant_schema.sql` | 9015 | `json` |
| `get_supplier_report` | `20250703000000_baseline_pre_tenant_schema.sql` | 8950 | `json` |
| `get_supplier_debt_ledger` | `20250703000000_baseline_pre_tenant_schema.sql` | 8927 | `json` |
| `adjust_supplier_debt` | `20250703000000_baseline_pre_tenant_schema.sql` | 1633 | `jsonb` |
| `pay_supplier_debt` | `20250703000000_baseline_pre_tenant_schema.sql` | 10320 | `jsonb` |

### Canonical Source

`supabase/migrations/*.sql` is the sole authority. The canonical definitions for all 7 H6 RPCs reside in `20250703000000_baseline_pre_tenant_schema.sql`. No derived document may override the migration chain.

### Constraints

- Additive only.
- No refactor, no redesign, no new abstraction.
- Preserve the existing `if (name === '...')` dispatch pattern.
- Mock return shape must follow the canonical migration function's `RETURNS` clause and parameters.
- No duplicate handler.
- No stale mock.
- Stay within the CURRENT_TASK-018 boundary (Domain H6 only).

### Validation

Engineering must later pass:

- `npx tsx scripts/audit-rpc-contracts.ts` → Exit 0, **0 stale mock**, **0 duplicate handler**, coverage **64.5%**.
- `npx tsc --noEmit` → PASS.
- `npx vitest run` → PASS, no regression.
- `git diff` confined to `tests/mocks/supabase.ts` and optional `tests/**` files.

### Expected Coverage

```text
60.7%

↓

64.5%
```

### Decision

**APPROVED**

### Status

**CURRENT_TASK-018**

Architecture Approved

### Implementation

**NOT AUTHORIZED**

### Next Step

Engineering Kickoff

**(CURRENT_TASK-018)**

requires

a separate authorization.
