# CURRENT_TASK-020 — Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3e — Domain H3 — Orders & Sales Mock Coverage  
**Document Type:** Architecture Decision (Program Manager Decision — no implementation)  
**Date:** 2026-07-15  
**Status:** Architecture Approved  
**Authorizing CURRENT_TASK:** CURRENT_TASK-020 — Orders & Sales Mock Coverage (Wave 3e / TASK-H3)  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_019.md`, `CURRENT_TASK-019_ACCEPTANCE_RECORD.md` (implied by Acceptance Review PASS), `D-P3-01_Reconciled_RPC_Contract.md`, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`

---

> **No implementation. No code change. No migration. No schema change. No generated type. No mock RPC written by this document.**
> This document is a Program Manager architecture decision deliverable only. It selects the next domain per the already-approved Coverage Roadmap and defines the architecture of CURRENT_TASK-020. No implementation may begin until the Program Manager approves this decision and a separate Engineering Kickoff authorization is issued.

---

## 1. Architecture Decision

Authorize the seventh domain-scoped coverage task of the Phase 4 Coverage Roadmap and define its architecture.

Concretely, CURRENT_TASK-020 shall mock the **7 uncovered RPCs of Domain H3 — Orders & Sales** in `tests/mocks/supabase.ts`, following the existing `if (name === '...')` dispatch pattern, with each mock's return shape derived from the canonical migration chain. The task targets raising mock coverage from **68.3% (125/183)** to **72.1% (132/183)** — a **+3.8 percentage-point** delta — and continues Milestone M4 — Commerce Transactions with Wave 3e.

This decision does **not** re-open the Coverage Roadmap. The Roadmap strategy (Wave / Domain / Dependency / Milestone) was approved in `CURRENT_TASK-014_ARCHITECTURE_DECISION.md` §5.1, re-validated post-M1, post-M2, post-M3, post-CURRENT_TASK-017, post-CURRENT_TASK-018, and post-CURRENT_TASK-019 in `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_019.md` §5 with no change. This document only confirms Domain H3 as the next domain per the roadmap's dependency-driven ordering (Wave 3e), now that its prerequisites are satisfied.

---

## 2. Objective

Authorize the next domain-scoped coverage task in Phase 4:

- **Domain:** H3 — Orders & Sales
- **Wave:** Wave 3e
- **RPC count:** 7 unique RPCs
- **Coverage target:** 68.3% → 72.1% (125/183 → 132/183 covered; 58 → 51 uncovered)
- **Milestone contribution:** Continues M4 — Commerce Transactions

The objective is to add 7 mock handlers to `tests/mocks/supabase.ts` so that the test layer can exercise the order lifecycle, sales reporting, order search, and order debt-payment paths without regression and without changing production code, migrations, schema, generated types, or the audit script.

---

## 3. Scope

### 3.1 In Scope

The 7 uncovered Domain H3 RPCs, called from `services/supabaseService.ts` and `utils/invoiceNumber.ts`:

| # | RPC | Sub-group | Service Call-site (approx.) | Source File |
|---|---|---|---|---|
| 1 | `cancel_order` | Order Lifecycle | `services/supabaseService.ts:1281` | `services/supabaseService.ts` |
| 2 | `delete_order` | Order Lifecycle | `services/supabaseService.ts:1261` | `services/supabaseService.ts` |
| 3 | `get_order_auto_code` | Order Auto-code | `utils/invoiceNumber.ts:57` | `utils/invoiceNumber.ts` |
| 4 | `get_sales_report` | Sales Reporting | `services/supabaseService.ts:3790` | `services/supabaseService.ts` |
| 5 | `process_checkout` | Order Checkout | `services/supabaseService.ts:2519` | `services/supabaseService.ts` |
| 6 | `search_orders_rpc` | Order Search | `services/supabaseService.ts:1757` | `services/supabaseService.ts` |
| 7 | `pay_order_debt` | Order Debt Payment | `services/supabaseService.ts:1358` | `services/supabaseService.ts` |

**Count: 7 unique RPCs.** None of the 7 RPCs are shared across multiple source files.

**Files permitted to change:**
- `tests/mocks/supabase.ts` — add 7 handler blocks and any in-file store state needed to support them.
- Test files under `tests/` that exercise the newly-mocked order paths (encouraged, not mandatory for coverage-only acceptance).

### 3.2 Out of Scope

- All other domains: A (complete), B (complete), C, D, E, F, G, H1 (complete), H2 (complete), H4, H5 (complete), H6 (complete), H7–H9.
- Any production code (`services/`, `lib/`, `utils/`, UI, components, pages) — including `services/supabaseService.ts` and `utils/invoiceNumber.ts`, which are call-site only, read-only references for this task.
- Any migration, `supabase/schema.sql`, or generated types.
- The audit script `scripts/audit-rpc-contracts.ts` (accepted and frozen in CURRENT_TASK-013).
- CI workflow (`.github/workflows/ci.yml`) and `package.json`.
- Any new file, script, or governance artifact.
- Mock behavioral shape-validation gate (deferred to a possible Phase 4+ hardening task per Roadmap §8).
- Refactor of `tests/mocks/supabase.ts` to a Map-based dispatch (Roadmap §8 risk note; explicitly deferred).
- Re-opening, re-ordering, or re-classifying the Coverage Roadmap.

### 3.3 Governance Boundary

CURRENT_TASK-020 processes **exactly one sub-domain** (Domain H3 — Orders & Sales). It is well under the ~20-RPC task-sizing ceiling (7 RPCs). It satisfies the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8): maps to the Phase 4 objective "test mocks derived from / validated against the canonical migration contract"; stays inside Phase 4 scope; honors Phase 4 constraints; produces Phase 4 exit evidence (coverage delta + audit gate green).

---

## 4. Authorized RPCs

The following 7 RPCs are authorized for mock coverage. No additional RPCs may be added.

| # | RPC | Sub-group | Canonical Migration File | Canonical Line | RETURNS |
|---|---|---|---|---|---|
| 1 | `cancel_order` | Order Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 2883 | `jsonb` |
| 2 | `delete_order` | Order Lifecycle | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5622 | `jsonb` |
| 3 | `get_order_auto_code` | Order Auto-code | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7908 | `text` |
| 4 | `get_sales_report` | Sales Reporting | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 8671 | `json` |
| 5 | `process_checkout` | Order Checkout | `supabase/migrations/20250706000006_phase_p7_0_read_only_tenant_infra.sql` | 204 | `jsonb` |
| 6 | `search_orders_rpc` | Order Search | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 11897 | `json` |
| 7 | `pay_order_debt` | Order Debt Payment | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 10280 | `jsonb` |

**Authorized RPC Count: 7 / 7**

The canonical migration chain is the sole authority for RPC names, parameter lists, and return shapes. `process_checkout` is defined by multiple migrations in the chain; the final authoritative definition is in the latest migration listed above. Engineering must derive each mock handler's return shape from the corresponding `CREATE [OR REPLACE] FUNCTION public.<name>` declaration's `RETURNS` clause and parameter list.

---

## 5. Dependency Verification

| Prerequisite Domain | Status | Evidence |
|---|---|---|
| Domain A — Auth, Identity & Security | **Complete** (M1) | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` |
| Domain H1 — Products & Catalog | **Complete** (Wave 3a) | `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` |
| Domain H5 — Customers | **Complete** (Wave 3b) | `CURRENT_TASK-017_ACCEPTANCE_RECORD.md` |
| Domain H2 — Inventory & Stock | **Complete** (Wave 3d) | `CURRENT_TASK-019_ACCEPTANCE_RECORD.md` (Acceptance Review PASS) |

`PHASE4_COVERAGE_ROADMAP.md` §3.2 lists H3's hard dependencies as **A, H1, H2, and H5**. All four are now satisfied.

H6 (Suppliers) is also complete as a sibling commerce entity leaf, reinforcing the established Wave 3 entity-leaf pattern.

---

## 6. Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | **Canonical** | Master Plan §2.1; reaffirmed in CURRENT_TASK-012 and CURRENT_TASK-013. |

The canonical source for the 7 Domain H3 RPCs is the set of `CREATE [OR REPLACE] FUNCTION public.<name>` declarations for those 7 names in the forward migration chain. Each mock handler's return shape must be derivable from the corresponding migration function's `RETURNS` clause and parameter list.

**Canonical migration declarations for the 7 Domain H3 RPCs:**

| RPC | Canonical Migration File | Canonical Line | RETURNS |
|---|---|---|---|
| `cancel_order` | `20250703000000_baseline_pre_tenant_schema.sql` | 2883 | `jsonb` |
| `delete_order` | `20250703000000_baseline_pre_tenant_schema.sql` | 5622 | `jsonb` |
| `get_order_auto_code` | `20250703000000_baseline_pre_tenant_schema.sql` | 7908 | `text` |
| `get_sales_report` | `20250703000000_baseline_pre_tenant_schema.sql` | 8671 | `json` |
| `process_checkout` | `20250706000006_phase_p7_0_read_only_tenant_infra.sql` | 204 | `jsonb` |
| `search_orders_rpc` | `20250703000000_baseline_pre_tenant_schema.sql` | 11897 | `json` |
| `pay_order_debt` | `20250703000000_baseline_pre_tenant_schema.sql` | 10280 | `jsonb` |

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
| No scope creep | Implement only the 7 authorized Domain H3 RPCs. |
| No boundary violation | Changes confined to `tests/mocks/supabase.ts` and optional `tests/**` self-check tests. |
| No production code changes | Do not edit `services/`, `lib/`, `utils/`, UI, components, or pages. |
| No canonical-source changes | Do not edit migrations, `supabase/schema.sql`, or generated types. |
| No audit / CI / package changes | Do not edit `scripts/audit-rpc-contracts.ts`, CI workflows, or `package.json`. |
| No new governance artifacts | Do not create implementation reports, kickoff documents, or other CURRENT_TASK artifacts beyond what the program process generates. |
| No CURRENT_TASK-021 | Do not create or anticipate CURRENT_TASK-021. |

---

## 8. Validation Plan

Engineering must independently demonstrate the following gates pass before acceptance:

| Gate | Command | Expected Result |
|---|---|---|
| Audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0, **0 stale mock**, **0 duplicate handler**, coverage reported as **72.1%** |
| Type gate | `npx tsc --noEmit` | Exit 0, no TypeScript errors |
| Test gate | `npx vitest run` | All tests pass; no regression |
| Diff gate | `git diff --stat` | Changes confined to `tests/mocks/supabase.ts` and optional `tests/**`; no production, migration, schema, generated type, audit, or CI files touched |

The audit gate is the primary acceptance metric. The diff gate ensures the task remains within its authorized boundary.

---

## 9. Expected Coverage

| Metric | Before (CURRENT_TASK-019) | After (CURRENT_TASK-020 Target) |
|---|---|---|
| Covered code RPCs | 125 / 183 | 132 / 183 |
| Uncovered code RPCs | 58 | 51 |
| Coverage | **68.3%** | **72.1%** |
| Delta | — | **+3.8 pp** |

The orphan mock `update_tenant_status` remains counted as a mock handler but not as a covered code RPC, consistent with the accepted baseline.

---

## 10. Decision

| Item | Decision |
|---|---|
| Architecture Decision | **APPROVED** |
| Domain / Wave | H3 — Orders & Sales / Wave 3e |
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

Generate `CURRENT_TASK-020_ENGINEERING_KICKOFF.md` only after this Architecture Decision is formally accepted by the Program Manager / delegated authority. No engineering implementation, code changes, test changes, migration changes, schema changes, or generated-type changes are permitted until the Engineering Kickoff explicitly authorizes implementation.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_019.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`.*
