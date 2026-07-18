# CURRENT_TASK-020 — Engineering Kickoff

**Program:** VietSale Pro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3e — Domain H3 — Orders & Sales Mock Coverage  
**Document Type:** Engineering Readiness (Engineering Lead — no implementation)  
**Date:** 2026-07-15  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_019.md`, `CURRENT_TASK-020_ARCHITECTURE_DECISION.md`

---

## Engineering Kickoff

This document confirms engineering readiness for `CURRENT_TASK-020`. Implementation is authorized only after this Engineering Kickoff is accepted. No implementation, code change, mock creation, test modification, migration, schema change, generated-type change, audit change, CI change, or governance artifact creation may occur before this document is accepted.

---

## Objective

Add 7 mock handlers to the derived validation layer for **Domain H3 — Orders & Sales** in `tests/mocks/supabase.ts`, following the existing `if (name === '...')` dispatch pattern. Each mock handler's return shape must be derived from the canonical migration chain. The task targets raising mock coverage from **68.3%** to **72.1%** and continues Milestone M4 — Commerce Transactions, Wave 3e.

- **Domain:** H3 — Orders & Sales
- **Wave:** Wave 3e
- **RPC count:** 7 unique RPCs
- **Coverage target:** 68.3% → 72.1% (125/183 → 132/183 covered; 58 → 51 uncovered)
- **Milestone contribution:** M4 — Commerce Transactions

---

## Current Program Status

| Item | Status | Evidence |
|---|---|---|
| Active phase | Phase 4 — Derived Validation Layer Realignment | `CURRENT_PHASE.md` §1 |
| Phase entry gate | PASS (accepted 2026-07-14) | `PHASE4_REAUTHORIZATION_REVIEW.md` §5 |
| Most recent accepted task | CURRENT_TASK-019 — Domain H2 Inventory & Stock | Acceptance Review PASS |
| Current coverage | **68.3%** (125 / 183 covered; 58 uncovered) | `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_019.md` §3.1 |
| Audit gate | Exit 0, 0 stale mock, 0 duplicate handler | `CURRENT_TASK-019_IMPLEMENTATION_REPORT.md` §7 |
| Type gate | `npx tsc --noEmit` — Exit 0 | `CURRENT_TASK-019_IMPLEMENTATION_REPORT.md` §7 |
| Test gate | `npx vitest run` — Exit 0, 395 tests passed | `CURRENT_TASK-019_IMPLEMENTATION_REPORT.md` §7 |
| Architecture Decision | **APPROVED** | `CURRENT_TASK-020_ARCHITECTURE_DECISION.md` §10 |

**Program Health:** HEALTHY. Phase 4 is active, in good standing, and proceeding wave-by-wave per the Coverage Roadmap.

---

## Authorized Scope

### In Scope

- Add 7 mock handlers for Domain H3 RPCs in `tests/mocks/supabase.ts`.
- Add any in-file store state required to support the new handlers.
- Derive each mock's return shape from the canonical migration chain.
- Optional test files under `tests/` exercising the newly-mocked order paths (encouraged, not mandatory for coverage-only acceptance).

### Out of Scope

- All other domains: A, B, C, D, E, F, G, H1, H2, H4, H5, H6, H7, H8, H9.
- Any production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Any migration, `supabase/schema.sql`, or generated types.
- The audit script `scripts/audit-rpc-contracts.ts`.
- CI workflow (`.github/workflows/ci.yml`) and `package.json`.
- Refactor or redesign of `tests/mocks/supabase.ts` dispatch pattern.
- New governance artifacts, implementation reports, or acceptance reviews.
- `CURRENT_TASK-021` or any future task.

---

## Authorized RPCs

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

Call-site references (read-only for this task):

- `cancel_order` — `services/supabaseService.ts:1281`
- `delete_order` — `services/supabaseService.ts:1261`
- `get_order_auto_code` — `utils/invoiceNumber.ts:57`
- `get_sales_report` — `services/supabaseService.ts:3790`
- `process_checkout` — `services/supabaseService.ts:2519`
- `search_orders_rpc` — `services/supabaseService.ts:1757`
- `pay_order_debt` — `services/supabaseService.ts:1358`

---

## Dependency Verification

| Prerequisite Domain | Status | Evidence |
|---|---|---|
| Domain A — Auth, Identity & Security | **Complete** (M1) | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` |
| Domain H1 — Products & Catalog | **Complete** (Wave 3a) | `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` |
| Domain H5 — Customers | **Complete** (Wave 3b) | `CURRENT_TASK-017_ACCEPTANCE_RECORD.md` |
| Domain H2 — Inventory & Stock | **Complete** (Wave 3d) | `CURRENT_TASK-019_ACCEPTANCE_RECORD.md` |

`PHASE4_COVERAGE_ROADMAP.md` §3.2 lists H3's hard dependencies as **A, H1, H2, and H5**. All four are satisfied. H6 (Suppliers) is also complete as a sibling commerce entity leaf.

---

## Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | **Canonical** | `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1; reaffirmed in CURRENT_TASK-012 and CURRENT_TASK-013 |

The canonical source for the 7 Domain H3 RPCs is the set of `CREATE [OR REPLACE] FUNCTION public.<name>` declarations for those names in the forward migration chain. Each mock handler's return shape must be derivable from the corresponding migration function's `RETURNS` clause and parameter list.

| RPC | Canonical Migration File | Canonical Line | RETURNS |
|---|---|---|---|
| `cancel_order` | `20250703000000_baseline_pre_tenant_schema.sql` | 2883 | `jsonb` |
| `delete_order` | `20250703000000_baseline_pre_tenant_schema.sql` | 5622 | `jsonb` |
| `get_order_auto_code` | `20250703000000_baseline_pre_tenant_schema.sql` | 7908 | `text` |
| `get_sales_report` | `20250703000000_baseline_pre_tenant_schema.sql` | 8671 | `json` |
| `process_checkout` | `20250706000006_phase_p7_0_read_only_tenant_infra.sql` | 204 | `jsonb` |
| `search_orders_rpc` | `20250703000000_baseline_pre_tenant_schema.sql` | 11897 | `json` |
| `pay_order_debt` | `20250703000000_baseline_pre_tenant_schema.sql` | 10280 | `jsonb` |

`process_checkout` is defined by multiple migrations in the chain; the final authoritative definition is in the latest migration listed above. No markdown document, including `docs/admin-dashboard/RPC_CONTRACTS.md` or any other derived artifact, may override the migration chain.

---

## Target Files

### Primary Target

- `tests/mocks/supabase.ts` — add 7 Domain H3 handler blocks and any in-file store state needed to support them.

### Optional Targets

- Test files under `tests/` that exercise the newly-mocked order paths (encouraged, not mandatory for coverage-only acceptance).

### Forbidden Changes

- Production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migrations or `supabase/schema.sql`.
- Generated types.
- `scripts/audit-rpc-contracts.ts`.
- CI workflow or `package.json`.
- Governance artifacts.

---

## Engineering Strategy

- **Additive only:** add new handler blocks; do not modify or remove existing handlers.
- **No refactor:** preserve the existing single-`rpc` function structure and chained `if (name === '...')` dispatch.
- **No redesign:** do not change the service facade, store model, or RPC invocation contract.
- **No abstraction:** no shared helper modules, generic builders, or domain factories. Any reusable logic must remain inline within the 7 new handler blocks.
- **Preserve existing dispatch:** new handlers must use the existing `if (name === '...')` pattern and be inserted before the existing fallback `return { data: null, error: { ... } }`.
- **Canonical-first:** each mock handler's return shape is derived from the corresponding canonical migration function's `RETURNS` clause and parameter list.

---

## Implementation Constraints

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
| No new governance artifacts | Do not create implementation reports, acceptance reviews, or other CURRENT_TASK artifacts. |
| No CURRENT_TASK-021 | Do not create or anticipate CURRENT_TASK-021. |

---

## Validation Plan

Engineering must independently demonstrate the following gates pass before acceptance:

| Gate | Command | Expected Result |
|---|---|---|
| Audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0, **0 stale mock**, **0 duplicate handler**, coverage reported as **72.1%** |
| Type gate | `npx tsc --noEmit` | Exit 0, no TypeScript errors |
| Test gate | `npx vitest run` | All tests pass; no regression |
| Diff gate | `git diff --stat` | Changes confined to `tests/mocks/supabase.ts` and optional `tests/**`; no production, migration, schema, generated type, audit, or CI files touched |

The audit gate is the primary acceptance metric. The diff gate ensures the task remains within its authorized boundary.

---

## Expected Coverage

| Metric | Before (CURRENT_TASK-019) | After (CURRENT_TASK-020 Target) |
|---|---|---|
| Covered code RPCs | 125 / 183 | 132 / 183 |
| Uncovered code RPCs | 58 | 51 |
| Coverage | **68.3%** | **72.1%** |
| Delta | — | **+3.8 pp** |

The orphan mock `update_tenant_status` remains counted as a mock handler but not as a covered code RPC, consistent with the accepted baseline.

---

## Engineering Authorization

| Item | State |
|---|---|
| Architecture Decision | **APPROVED** |
| Current Task | **CURRENT_TASK-020** |
| Domain | H3 — Orders & Sales |
| Wave | Wave 3e |
| Dependencies | Domain A, H1, H2, H5 — all complete |
| Engineering Readiness | **READY** |

---

## Status

| Item | State |
|---|---|
| Engineering Readiness | **Engineering Ready** |
| Implementation | **AUTHORIZED** |
| Program Phase | **UNCHANGED** — Phase 4 remains active |
| Roadmap | **UNCHANGED** — Coverage Roadmap remains valid |
| Architecture | **UNCHANGED** — Existing dispatch pattern preserved |

---

## Next Step

Implementation may begin. Engineering shall execute `CURRENT_TASK-020` strictly within the authorized scope, constraints, and validation plan above. No further CURRENT_TASK, acceptance review, implementation report, or governance artifact may be produced until implementation is complete and validated.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_019.md`, `CURRENT_TASK-020_ARCHITECTURE_DECISION.md`.*
