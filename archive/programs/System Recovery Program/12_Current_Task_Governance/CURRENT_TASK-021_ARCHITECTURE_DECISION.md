# CURRENT_TASK-021 — Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3f — Domain H4 — Returns & Exchanges Mock Coverage  
**Document Type:** Architecture Decision (Program Manager Decision — no implementation)  
**Date:** 2026-07-15  
**Status:** Architecture Approved  
**Authorizing CURRENT_TASK:** CURRENT_TASK-021 — Returns & Exchanges Mock Coverage (Wave 3f / TASK-H4)  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_020.md`, `CURRENT_TASK-020_ACCEPTANCE_RECORD.md` (implied by Acceptance Review PASS), `D-P3-01_Reconciled_RPC_Contract.md`, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`

---

> **No implementation. No code change. No migration. No schema change. No generated type. No mock RPC written by this document.**
> This document is a Program Manager architecture decision deliverable only. It selects the next domain per the already-approved Coverage Roadmap and defines the architecture of CURRENT_TASK-021. No implementation may begin until the Program Manager approves this decision and a separate Engineering Kickoff authorization is issued.

---

## 1. Architecture Decision

Authorize the eighth domain-scoped coverage task of the Phase 4 Coverage Roadmap and define its architecture.

Concretely, CURRENT_TASK-021 shall mock the **7 uncovered RPCs of Domain H4 — Returns & Exchanges** in `tests/mocks/supabase.ts`, following the existing `if (name === '...')` dispatch pattern, with each mock's return shape derived from the canonical migration chain. The task targets raising mock coverage from **72.1% (132/183)** to **76.0% (139/183)** — a **+3.9 percentage-point** delta — and continues Milestone M4 — Commerce Transactions with Wave 3f.

This decision does **not** re-open the Coverage Roadmap. The Roadmap strategy (Wave / Domain / Dependency / Milestone) was approved in `CURRENT_TASK-014_ARCHITECTURE_DECISION.md` §5.1, re-validated post-M1, post-M2, post-M3, post-CURRENT_TASK-017, post-CURRENT_TASK-018, post-CURRENT_TASK-019, and post-CURRENT_TASK-020 in `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_020.md` §4 with no change. This document only confirms Domain H4 as the next domain per the roadmap's dependency-driven ordering (Wave 3f), now that its prerequisites are satisfied.

---

## 2. Objective

Authorize the next domain-scoped coverage task in Phase 4:

- **Domain:** H4 — Returns & Exchanges
- **Wave:** Wave 3f
- **RPC count:** 7 unique RPCs
- **Coverage target:** 72.1% → 76.0% (132/183 → 139/183 covered; 51 → 44 uncovered)
- **Milestone contribution:** Continues M4 — Commerce Transactions

The objective is to add 7 mock handlers to `tests/mocks/supabase.ts` so that the test layer can exercise the return-order lifecycle, supplier exchange lifecycle, exchange transaction, return-order search, and return-order auto-code paths without regression and without changing production code, migrations, schema, generated types, or the audit script.

---

## 3. Scope

### 3.1 In Scope

The 7 uncovered Domain H4 RPCs, called from `services/supabaseService.ts`:

| # | RPC | Sub-group | Service Call-site (approx.) | Source File |
|---|---|---|---|---|
| 1 | `get_return_order_auto_code` | Return Auto-code | `services/supabaseService.ts:2899` | `services/supabaseService.ts` |
| 2 | `create_return_order` | Return Lifecycle | `services/supabaseService.ts:2938` | `services/supabaseService.ts` |
| 3 | `create_exchange_transaction` | Return/Exchange Transaction | `services/supabaseService.ts:3064` | `services/supabaseService.ts` |
| 4 | `filter_return_orders_rpc` | Return Search | `services/supabaseService.ts:3376` | `services/supabaseService.ts` |
| 5 | `cancel_return_order_v2` | Return Lifecycle | `services/supabaseService.ts:3393` | `services/supabaseService.ts` |
| 6 | `create_supplier_exchange` | Supplier Exchange | `services/supabaseService.ts:3756` | `services/supabaseService.ts` |
| 7 | `cancel_supplier_exchange` | Supplier Exchange | `services/supabaseService.ts:3773` | `services/supabaseService.ts` |

**Count: 7 unique RPCs.** None of the 7 RPCs are shared across multiple source files.

**Files permitted to change:**
- `tests/mocks/supabase.ts` — add 7 handler blocks and any in-file store state needed to support them.
- Test files under `tests/` that exercise the newly-mocked return/exchange paths (encouraged, not mandatory for coverage-only acceptance).

### 3.2 Out of Scope

- All other domains: A (complete), B (complete), C, D, E, F, G, H1 (complete), H2 (complete), H3 (complete), H5 (complete), H6 (complete), H7–H9.
- Any production code (`services/`, `lib/`, `utils/`, UI, components, pages) — including `services/supabaseService.ts`, which is a call-site only, read-only reference for this task.
- Any migration, `supabase/schema.sql`, or generated types.
- The audit script `scripts/audit-rpc-contracts.ts` (accepted and frozen in CURRENT_TASK-013).
- CI workflow (`.github/workflows/ci.yml`) and `package.json`.
- Any new file, script, or governance artifact.
- Mock behavioral shape-validation gate (deferred to a possible Phase 4+ hardening task per Roadmap §8).
- Refactor of `tests/mocks/supabase.ts` to a Map-based dispatch (Roadmap §8 risk note; explicitly deferred).
- Re-opening, re-ordering, or re-classifying the Coverage Roadmap.

### 3.3 Governance Boundary

CURRENT_TASK-021 processes **exactly one sub-domain** (Domain H4 — Returns & Exchanges). It is well under the ~20-RPC task-sizing ceiling (7 RPCs). It satisfies the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8): maps to the Phase 4 objective "test mocks derived from / validated against the canonical migration contract"; stays inside Phase 4 scope; honors Phase 4 constraints; produces Phase 4 exit evidence (coverage delta + audit gate green).

---

## 4. Authorized RPCs

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

The canonical migration chain is the sole authority for RPC names, parameter lists, and return shapes. Engineering must derive each mock handler's return shape from the corresponding `CREATE [OR REPLACE] FUNCTION public.<name>` declaration's `RETURNS` clause and parameter list.

---

## 5. Dependency Verification

| Prerequisite Domain | Status | Evidence |
|---|---|---|
| Domain A — Auth, Identity & Security | **Complete** (M1) | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` |
| Domain H1 — Products & Catalog | **Complete** (Wave 3a) | `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` |
| Domain H5 — Customers | **Complete** (Wave 3b) | `CURRENT_TASK-017_ACCEPTANCE_RECORD.md` |
| Domain H6 — Suppliers | **Complete** (Wave 3c) | `CURRENT_TASK-018_ACCEPTANCE_RECORD.md` |
| Domain H2 — Inventory & Stock | **Complete** (Wave 3d) | `CURRENT_TASK-019_ACCEPTANCE_RECORD.md` (Acceptance Review PASS) |
| Domain H3 — Orders & Sales | **Complete** (Wave 3e) | `CURRENT_TASK-020_ACCEPTANCE_RECORD.md` (Acceptance Review PASS) |

`PHASE4_COVERAGE_ROADMAP.md` §3.2 lists H4's hard dependencies as **A, H3, H1, and H6**. All four are now satisfied. H2 (Inventory) and H5 (Customers) are also complete as sibling commerce domains that support the broader transactional test paths.

---

## 6. Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | **Canonical** | Master Plan §2.1; reaffirmed in CURRENT_TASK-012 and CURRENT_TASK-013. |

The canonical source for the 7 Domain H4 RPCs is the set of `CREATE [OR REPLACE] FUNCTION public.<name>` declarations for those 7 names in the forward migration chain. Each mock handler's return shape must be derivable from the corresponding migration function's `RETURNS` clause and parameter list.

**Canonical migration declarations for the 7 Domain H4 RPCs:**

| RPC | Canonical Migration File | Canonical Line | RETURNS |
|---|---|---|---|
| `get_return_order_auto_code` | `20250703000000_baseline_pre_tenant_schema.sql` | 8602 | `text` |
| `create_return_order` | `20250703000000_baseline_pre_tenant_schema.sql` | 4645 | `jsonb` |
| `create_exchange_transaction` | `20250703000000_baseline_pre_tenant_schema.sql` | 3830 | `jsonb` |
| `filter_return_orders_rpc` | `20250703000000_baseline_pre_tenant_schema.sql` | 6325 | `json` |
| `cancel_return_order_v2` | `20250703000000_baseline_pre_tenant_schema.sql` | 2973 | `jsonb` |
| `create_supplier_exchange` | `20250703000000_baseline_pre_tenant_schema.sql` | 4800 | `jsonb` |
| `cancel_supplier_exchange` | `20250703000000_baseline_pre_tenant_schema.sql` | 3051 | `jsonb` |

No markdown document, including `docs/admin-dashboard/RPC_CONTRACTS.md` or any other derived artifact, may override the migration chain as the contract authority.

---

## 7. Constraints

Engineering must honor the following constraints, consistent with all prior Phase 4 mock-coverage tasks:

| Constraint | Requirement |
|---|---|
| Additive only | Add new handler blocks; do not modify or remove existing handlers. |
| No refactor | Preserve the existing single-`rpc` function structure and chained `if (name === '...')` dispatch. |
| No redesign | Do not change the service facade, store model, or RPC invocation contract. |
| No abstraction | No shared helper modules, generic builders, or domain factories. Any reusable logic must remain inline within the 7 new handler blocks. |
| Preserve existing dispatch | New handlers must use the existing `if (name === '...')` pattern and be inserted before the existing fallback `return { data: null, error: { ... } }`. |
| No duplicate handler | Each of the 7 RPC names must have exactly one handler block. |
| No stale mock | Do not mock any RPC that is not in the canonical migration chain or not called by the service layer. |
| No scope creep | Implement only the 7 authorized Domain H4 RPCs. |
| No boundary violation | Changes confined to `tests/mocks/supabase.ts` and optional `tests/**` self-check tests. |
| No production code changes | Do not edit `services/`, `lib/`, `utils/`, UI, components, or pages. |
| No canonical-source changes | Do not edit migrations, `supabase/schema.sql`, or generated types. |
| No audit / CI / package changes | Do not edit `scripts/audit-rpc-contracts.ts`, CI workflows, or `package.json`. |
| No new governance artifacts | Do not create implementation reports, kickoff documents, or other CURRENT_TASK artifacts beyond what the program process generates. |
| No CURRENT_TASK-022 | Do not create or anticipate CURRENT_TASK-022. |

---

## 8. Validation Plan

Engineering must independently demonstrate the following gates pass before acceptance:

| Gate | Command | Expected Result |
|---|---|---|
| Audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0, **0 stale mock**, **0 duplicate handler**, coverage reported as **76.0%** |
| Type gate | `npx tsc --noEmit` | Exit 0, no TypeScript errors |
| Test gate | `npx vitest run` | All tests pass; no regression |
| Diff gate | `git diff --stat` | Changes confined to `tests/mocks/supabase.ts` and optional `tests/**`; no production, migration, schema, generated type, audit, or CI files touched |

The audit gate is the primary acceptance metric. The diff gate ensures the task remains within its authorized boundary.

---

## 9. Expected Coverage

| Metric | Before (CURRENT_TASK-020) | After (CURRENT_TASK-021 Target) |
|---|---|---|
| Covered code RPCs | 132 / 183 | 139 / 183 |
| Uncovered code RPCs | 51 | 44 |
| Coverage | **72.1%** | **76.0%** |
| Delta | — | **+3.9 pp** |

The orphan mock `update_tenant_status` remains counted as a mock handler but not as a covered code RPC, consistent with the accepted baseline.

---

## 10. Decision

| Item | Decision |
|---|---|
| Architecture Decision | **APPROVED** |
| Domain / Wave | H4 — Returns & Exchanges / Wave 3f |
| Authorized RPCs | 7 / 7 |
| Implementation | **NOT AUTHORIZED** by this document |
| Next Step | Separate **Engineering Kickoff** required before any implementation begins. |

---

## 11. Status

| Item | State |
|---|---|
| Architecture Readiness | Approved |
| Implementation Authorization | **NOT AUTHORIZED** |
| Program Phase | **UNCHANGED** — Phase 4 remains active |
| Roadmap | **UNCHANGED** — Coverage Roadmap remains valid |
| Phase 4 Exit Criteria | EC-3 / EC-4 DONE; EC-1 / EC-2 remain progress-bound on remaining coverage waves |

---

## 12. Next Step

Generate `CURRENT_TASK-021_ENGINEERING_KICKOFF.md` only after this Architecture Decision is formally accepted by the Program Manager / delegated authority. No engineering implementation, code changes, test changes, migration changes, schema changes, or generated-type changes are permitted until the Engineering Kickoff explicitly authorizes implementation.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_020.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`.*
