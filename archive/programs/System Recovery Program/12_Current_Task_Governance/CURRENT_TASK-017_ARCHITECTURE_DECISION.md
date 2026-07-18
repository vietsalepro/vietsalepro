# CURRENT_TASK-017 — Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Document Type:** Architecture Decision (Program Manager Decision — no implementation)  
**Date:** 2026-07-15  
**Status:** Architecture Decision Draft — Awaiting Program Manager Approval  
**Authorizing CURRENT_TASK:** CURRENT_TASK-017 — Customers Mock Coverage (Wave 3b / TASK-H5)  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_M3.md`, `CURRENT_TASK-016_ACCEPTANCE_RECORD.md`, `CURRENT_TASK-016_ARCHITECTURE_DECISION.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`

---

> **No implementation. No code change. No migration. No schema change. No generated type. No mock RPC written by this document.**
> This document is a Program Manager architecture decision deliverable only. It selects the next domain per the already-approved Coverage Roadmap and defines the architecture of CURRENT_TASK-017. No implementation may begin until the Program Manager approves this decision and a separate Implementation/Kickoff authorization is issued.

---

## 1. Objective

Authorize the fourth domain-scoped coverage task of the Phase 4 Coverage Roadmap and define its architecture.

Concretely, CURRENT_TASK-017 shall mock the **6 uncovered RPCs of Domain H5 — Customers** in `tests/mocks/supabase.ts`, following the existing `if (name === '...')` dispatch pattern, with each mock's return shape derived from the canonical migration chain. The task raises mock coverage from **57.4% (105/183)** to **60.7% (111/183)** — a **+3.3 percentage-point** delta — and completes the second Core Commerce entity leaf (Wave 3b).

This decision does **not** re-open the Coverage Roadmap. The Roadmap strategy (Wave / Domain / Dependency / Milestone) was approved in `CURRENT_TASK-014_ARCHITECTURE_DECISION.md` §5.1, re-validated post-M1 in `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §4, post-M2 in `PHASE4_PROGRAM_STATUS_AFTER_M2.md` §5, and post-M3 in `PHASE4_PROGRAM_STATUS_AFTER_M3.md` §5 with no change. This document only confirms Domain H5 as the next domain per the roadmap's dependency-driven ordering (Wave 3b), now that its prerequisites are satisfied.

---

## 2. Background

| Item | State | Source |
|---|---|---|
| Phase 4 status | Active, in good standing | `CURRENT_PHASE.md` §1; `PHASE4_PROGRAM_STATUS_AFTER_M3.md` §2 |
| Last closed CURRENT_TASK | CURRENT_TASK-016 — Products & Catalog Mock Coverage — Accepted with Minor Notes (2026-07-15) | `CURRENT_TASK-016_ACCEPTANCE_RECORD.md` §14 |
| Coverage milestone reached | **M3 (Progress) — 57.4%** — 105/183 code RPCs covered, independently reproduced | `PHASE4_PROGRAM_STATUS_AFTER_M3.md` §3.1 |
| Coverage Roadmap status | Valid; wave ordering, domain classification, dependencies, and priority re-confirmed post-M3 with no change | `PHASE4_PROGRAM_STATUS_AFTER_M3.md` §5 |
| Next domain per roadmap | Wave 3b — Domain H5: Customers (6 RPCs, 57.4% → 60.7%, Low effort) | `PHASE4_COVERAGE_ROADMAP.md` §2, §6.2; `PHASE4_PROGRAM_STATUS_AFTER_M3.md` §5.2 |
| Domain H5 prerequisite | Domain A (Auth) — **satisfied** (M1 complete, accepted); Domain H1 (Products & Catalog) — **satisfied** (M3 Wave 3a complete, accepted) | `PHASE4_COVERAGE_ROADMAP.md` §3.2; `PHASE4_PROGRAM_STATUS_AFTER_M3.md` §5.3 |
| Audit gate | Frozen and accepted (CURRENT_TASK-012/013); independently re-run green 2026-07-15 | `PHASE4_PROGRAM_STATUS_AFTER_M3.md` §3.1 |
| Phase 4 exit criteria | EC-3, EC-4 DONE; EC-1, EC-2 PARTIAL (progress-bound on remaining coverage waves) | `PHASE4_PROGRAM_STATUS_AFTER_M3.md` §6 |

CURRENT_TASK-016 is closed. No CURRENT_TASK-017 existed prior to this document. Phase 4 remains active.

---

## 3. Authorized Scope

### 3.1 In Scope

The 6 uncovered Domain H5 RPCs, all called from the core commerce facade barrel `services/supabaseService.ts`:

| Sub-group | RPCs | Source File |
|---|---|---|
| Customer Lookup & Filter | `search_customers_rpc`, `filter_customers_rpc` | `services/supabaseService.ts` |
| Customer Aggregates | `get_customer_stats`, `get_customer_report` | `services/supabaseService.ts` |
| Customer Debt | `get_customer_debt_ledger`, `adjust_customer_debt` | `services/supabaseService.ts` |

**Count: 6 unique RPCs.** All 6 are called exclusively from `services/supabaseService.ts` (no cross-file sharing). A single handler per name serves its one call-site.

**Files permitted to change:**
- `tests/mocks/supabase.ts` — add 6 handler blocks.
- Test files under `tests/` that exercise the newly-mocked customer paths (encouraged, not mandatory for coverage-only acceptance).

### 3.2 Out of Scope

- All other domains: A (complete), B (complete), C, D, E, F, G, H1 (complete), H2–H4, H6–H9.
- Any production code (`services/`, `lib/`, `utils/`, UI, components, pages) — including `services/supabaseService.ts`, which is a call-site only, read-only reference for inventory.
- Any migration, `supabase/schema.sql`, or generated types.
- The audit script `scripts/audit-rpc-contracts.ts` (accepted and frozen in CURRENT_TASK-013).
- CI workflow (`.github/workflows/ci.yml`) and `package.json`.
- Any new file, script, or governance artifact.
- Mock behavioral shape-validation gate (deferred to a possible Phase 4+ hardening task per Roadmap §8).
- Refactor of `tests/mocks/supabase.ts` to a Map-based dispatch (Roadmap §8 risk note; explicitly deferred).
- Re-opening, re-ordering, or re-classifying the Coverage Roadmap.

### 3.3 Governance Boundary

CURRENT_TASK-017 processes **exactly one sub-domain** (Domain H5 — Customers). It is well under the ~20-RPC task-sizing ceiling (6 RPCs). It satisfies the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8): maps to the Phase 4 objective "test mocks derived from / validated against the canonical migration contract"; stays inside Phase 4 scope; honors Phase 4 constraints; produces Phase 4 exit evidence (coverage delta + audit gate green).

---

## 4. Domain Confirmation (Roadmap Cross-Check)

Domain H5 is confirmed against `PHASE4_COVERAGE_ROADMAP.md`:

| Attribute | Roadmap Value (§2 Domain H, §4, §5.1, §6.2) | Confirmed |
|---|---|---|
| Domain | H5 — Customers (sub-domain of H — Core Commerce) | YES |
| Wave | Wave 3b | YES |
| RPC count | 6 unique RPCs | YES |
| Sub-groups | Customer Lookup & Filter (2), Customer Aggregates (2), Customer Debt (2) | YES |
| Source file | `services/supabaseService.ts` (sole carrier) | YES |
| Dependency | Depends on A (Auth) | YES — A complete (M1) |
| Priority Score | 12/15 (High business criticality, dependency depth — A only, High test-path unblock — unblocks H3 Orders, Low mock complexity, 6 RPCs) | YES |
| Priority rank | Commerce entity leaves: H1 → H5 → H6 (§6.2) | YES |
| Estimated complexity | Low — 6 Simple, 0 Medium, 0 Complex per Roadmap | YES |
| Estimated handler lines | ~60 | YES |
| Estimated effort | Low — one focused session | YES |
| Expected coverage increase | 57.4% → 60.7% (+3.3 pp; 105/183 → 111/183 covered; 78 → 72 uncovered) | YES |
| Risk | Low — entity mocks; `adjust_customer_debt` mutates customer debt / ledger but has a deterministic return shape | YES |

**No deviation from the approved Roadmap.** The Roadmap is not modified by this document.

---

## 5. Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | **Canonical** | Master Plan §2.1; reaffirmed in CURRENT_TASK-012 and CURRENT_TASK-013. |

The canonical source for the 6 Domain H5 RPCs is the set of `CREATE [OR REPLACE] FUNCTION public.<name>` declarations for those 6 names in the forward migration chain. Each mock handler's return shape must be derivable from the corresponding migration function's `RETURNS` clause and parameter list.

**Canonical migration file defining the 6 H5 RPCs:**
- `20250703000000_baseline_pre_tenant_schema.sql` — first and only definition of all 6 RPCs.

**Canonical-derived references (acceptable, one step removed):**
- `supabase/schema.sql` (Phase 2 accepted) — final-state function definitions.
- `supabase/generated/database.types.ts` (Phase 2 accepted) — typed `Functions` block.
- `D-P3-01_Reconciled_RPC_Contract.md` (Phase 3 accepted) — reconciled service call-sites.

**Non-canonical (must not override):** `docs/admin-dashboard/RPC_CONTRACTS.md` and any other hand-maintained derived document. The audit script no longer reads it (CURRENT_TASK-012); this task must not reintroduce it as a reference.

**Verification mechanism:** `npx tsx scripts/audit-rpc-contracts.ts` — the same gate accepted in CURRENT_TASK-013. It enforces mock ⊆ migrations (stale-mock hard fail), duplicate-handler hard fail, and reports coverage informationally. The coverage line is the milestone metric.

---

## 6. Domain Inventory

Inventory of the 6 Domain H5 RPCs: service call-site, canonical migration file, and canonical `RETURNS` clause. Independently verified by reading the migration files and grepping the service layer.

| # | RPC | Service (call-site) | Canonical Migration File | Canonical RETURNS | Complexity |
|---|---|---|---|---|---|
| 1 | `search_customers_rpc` | `services/supabaseService.ts:581` | `20250703000000_baseline_pre_tenant_schema.sql` (line 11884) | `SETOF public.customers` | Simple — read-only customer search by `search_term` on name/phone/code; returns 0..N full `customers` rows |
| 2 | `filter_customers_rpc` | `services/supabaseService.ts:659` | `20250703000000_baseline_pre_tenant_schema.sql` (line 6027) | `JSON` | Simple — read-only paginated customer filter with search, points range, debt filter, sort; returns `{ customers, totalCount }`-style JSON |
| 3 | `get_customer_stats` | `services/supabaseService.ts:814` | `20250703000000_baseline_pre_tenant_schema.sql` (line 7062) | `JSON` | Simple — read-only aggregate; returns `{ total, vip, debt, totalSpent }` |
| 4 | `get_customer_report` | `services/supabaseService.ts:3942` | `20250703000000_baseline_pre_tenant_schema.sql` (line 7005) | `JSON` | Simple — read-only aggregate over a date range; returns `{ summary, topCustomers, customerGrowth }` |
| 5 | `get_customer_debt_ledger` | `services/supabaseService.ts:1533` | `20250703000000_baseline_pre_tenant_schema.sql` (line 6990) | `JSON` | Simple — read-only ledger; returns `{ customer_id, current_balance, total_entries, entries }` |
| 6 | `adjust_customer_debt` | `services/supabaseService.ts:1447` | `20250703000000_baseline_pre_tenant_schema.sql` (line 1611) | `JSONB` | Simple per Roadmap — mutates customer debt and ledger; deterministic return shape `{ ok, customer_id, adjustment_amount, new_customer_debt, ledger_balance_after, reason }` |

**Inventory totals:**
- 6 unique RPCs.
- 1 service file contains all call-sites (`services/supabaseService.ts`) — no cross-file sharing.
- 1 canonical migration file defines the 6 RPCs.
- 0 RPCs are cross-file shared.
- Complexity distribution: 6 Simple, 0 Medium, 0 Complex (matches Roadmap §5.1).

---

## 7. Architecture Decision

### 7.1 Strategy Confirmation (Program Manager Decision)

The Coverage Roadmap strategy was approved in `CURRENT_TASK-014_ARCHITECTURE_DECISION.md` §5.1, re-validated post-M1 in `PHASE4_PROGRAM_STATUS_AFTER_M1.md` §4, post-M2 in `PHASE4_PROGRAM_STATUS_AFTER_M2.md` §5, and post-M3 in `PHASE4_PROGRAM_STATUS_AFTER_M3.md` §5. This decision does **not** re-approve the strategy; it confirms Domain H5 as the next domain under the already-approved strategy.

| Strategy Element | Status | Basis |
|---|---|---|
| **Wave** | Unchanged — 4 waves, sequential, one CURRENT_TASK authorized at a time. | Roadmap §6.2; CURRENT_TASK-014 §5.1; post-M3 re-validation §5. |
| **Domain** | Unchanged — 8 domains (A–H), H sub-divided into 9 sub-domains. | Roadmap §2. |
| **Dependency** | Unchanged — A → B → H entity leaves → H transactions → H residuals → cross-cutting. | Roadmap §3; post-M3 re-validation §5.3. |
| **Milestone** | Unchanged — M0 (37.2%) → M7 (100.0%), M4 (80.3%) intermediate floor available. | Roadmap §7. |

### 7.2 Next Domain Selection (Program Manager Decision)

**Selected domain: Domain H5 — Customers (6 RPCs, Wave 3b / TASK-H5).**

| Criterion | Assessment |
|---|---|
| **Why selected** | Next domain on the approved Roadmap's Wave 3b. Domain A (Wave 1), Domain B (Wave 2), and Domain H1 (Wave 3a) are complete and accepted. H5's prerequisite (A) is satisfied; the post-M3 status review independently recommended H5 as the next task. |
| **Why H5 and not H6/H2** | H5 and H6 are both Wave 3 entity leaves with the same prerequisite (A). The roadmap orders them H5 → H6 (§6.2). H5 (Customers) is referenced by H3 (Orders), so mocking it before the transactional sub-domains maximizes downstream test-path unblocking. H2 (Inventory) depends on H1 and is scheduled after the entity leaves. |
| **Dependency** | Depends on A (Auth) — **satisfied** (M1 complete, accepted). Customer service calls are tenant-scoped and use the auth/permission mocks established in CURRENT_TASK-014. Domain H1 completion is the Wave 3a ordering prerequisite, also satisfied. |
| **Risk** | Low. All 6 RPCs have deterministic return shapes. `adjust_customer_debt` mutates the mock store's `customers` collection and ledger, but its return shape is straightforward and its failure branches map cleanly to the canonical `RAISE EXCEPTION` clauses. |
| **Estimated Scope** | 6 RPCs; ~60 handler lines; 6 Simple + 0 Medium + 0 Complex. Effort class: Low. |
| **Expected Coverage Increase** | 57.4% → 60.7% (+3.3 pp; 105/183 → 111/183 covered; 78 → 72 uncovered). Contributes to milestone **M3 — Commerce Entities** (target 64.5% after Wave 3a–3c). |

### 7.3 Architecture Decision for CURRENT_TASK-017

**Decision: Extend `tests/mocks/supabase.ts` with 6 additive handler blocks for the Domain H5 RPCs, each following the existing `if (name === '...')` dispatch pattern, with return shapes derived from the canonical migration chain.**

| Decision Element | Definition |
|---|---|
| **Mock Strategy** | Additive-only insertion of 6 `if (name === '<rpc>')` handler blocks into the existing single dispatch function in `tests/mocks/supabase.ts`. No new file, no new abstraction, no Map dispatch, no new dependency. Reuses the helper/pattern already present (ponytail "reuse the helper already here" rung). |
| **Return Shape Strategy** | Each handler's return shape is derived directly from its canonical migration function's `RETURNS` clause and parameter list: `search_customers_rpc` → `{ data: customer[] \| null, error }`; `filter_customers_rpc` → `{ data: { customers, totalCount }, error }`; `get_customer_stats` → `{ data: <stats-json>, error }`; `get_customer_report` → `{ data: <report-json>, error }`; `get_customer_debt_ledger` → `{ data: <ledger-json>, error }`; `adjust_customer_debt` → `{ data: <adjustment-jsonb>, error }`. All canonical JSON keys must be reproduced. Mocks filter or mutate the existing mock store's `customers` collection where the canonical function operates on `customers`. Tenant scope is already established by the CURRENT_TASK-014 auth mocks. |
| **Canonical Source** | `supabase/migrations/*.sql` forward chain — specifically `20250703000000_baseline_pre_tenant_schema.sql` (all 6 definitions). `supabase/schema.sql` and `supabase/generated/database.types.ts` are acceptable canonical-derived references. No hand-maintained derived document may override the chain. |
| **Dispatch Pattern** | The existing `if (name === '...')` chain already present in `tests/mocks/supabase.ts`. The 6 new blocks are inserted additively; no existing handler is modified, reordered, or removed. No Map refactor. |
| **Validation Strategy** | Three gates, all independently re-runnable: (1) `npx tsx scripts/audit-rpc-contracts.ts` exit 0 (stale-mock ⊆ migrations, no duplicates, no code-RPC-missing-from-migrations; coverage line = milestone metric); (2) `npx tsc --noEmit` exit 0; (3) `npx vitest run` all pass with no regression vs the CURRENT_TASK-016 accepted baseline (68 files, 389 tests). Return-shape fidelity to canonical `RETURNS` is enforced by review (Constraint #6), not by an automated gate — the automated shape-validation gate remains explicitly deferred to a possible Phase 4+ hardening task. |
| **Traceability Requirement** | 6/6 RPCs must be traced to their canonical `CREATE [OR REPLACE] FUNCTION public.<name>` declaration (migration file + line) in the Implementation Report and independently re-verified in the Acceptance Record. Each trace records: RPC name, service call-site, canonical migration file, `RETURNS` clause, mock return shape, and PASS/FAIL. |

**Affirmations:**
- **Additive-only.** The 106 existing handlers (105 covering code RPCs + 1 accepted orphan `update_tenant_status`) are unchanged: no modification, no removal, no reorder.
- **No handler rewrite.** Each of the 6 new handlers is a fresh `if (name === '...')` block; no existing handler is split, merged, or renamed.
- **`if (name === '...')` dispatch.** No Map dispatch, no switch, no new abstraction. The existing pattern is reused verbatim.
- **Derived directly from `supabase/migrations/*.sql`.** Every return shape is derivable from the canonical migration function's `RETURNS` clause and parameter list. No derived markdown contract is referenced.

**Rejected alternatives (not chosen, recorded for traceability):**
- *Generate mocks from the canonical source.* Rejected in Roadmap §8 and not revisited: the codegen path is disproportionate to the coverage goal and risks introducing a new derived artifact whose own correctness would then need validation.
- *Refactor `tests/mocks/supabase.ts` to a Map-based dispatch first.* Explicitly deferred (Roadmap §8 risk note). The file is already a single dispatch function; the roadmap does not require the refactor and CURRENT_TASK-017 must not expand scope to include it.
- *Merge H5 with H6 to reduce task count.* Rejected — the roadmap's task-sizing principle (§6.3) deliberately keeps each task small and single-sub-domain for risk isolation and objective acceptance. Merging would violate the one-domain-per-task pattern established in CURRENT_TASK-014/015/016.

---

## 8. Constraints

Inherited from `CURRENT_PHASE.md` §5 and the Roadmap §6.4 per-task acceptance template:

1. No feature development, no architecture redesign, no scope expansion.
2. No modification of production code, migrations, schema, generated types, CI workflow, or `package.json`.
3. No new files. No new scripts. No new governance artifacts.
4. No implementation outside an approved CURRENT_TASK.
5. Mock handlers must follow the existing `if (name === '...')` dispatch pattern already present in `tests/mocks/supabase.ts`.
6. Mock return shapes must match the canonical migration function signatures (return type + parameter set). A mock that returns a shape inconsistent with its migration function is a defect, even if tests pass.
7. Handlers are **additive only** — no modification or removal of the existing 106 handlers (105 covering code RPCs + 1 accepted orphan `update_tenant_status`).
8. The audit script `scripts/audit-rpc-contracts.ts` is frozen; this task must not modify it.
9. The task must not introduce a mock for an RPC not defined in the canonical migration chain (the stale-mock gate would hard-fail).
10. The task must not introduce a duplicate handler for an already-mocked RPC (the duplicate-handler gate would hard-fail).

---

## 9. Acceptance Criteria

CURRENT_TASK-017 is accepted only when ALL of the following hold, independently verified:

1. **Mock presence.** All 6 Domain H5 RPCs (`search_customers_rpc`, `filter_customers_rpc`, `get_customer_stats`, `get_customer_report`, `get_customer_debt_ledger`, `adjust_customer_debt`) have exactly one `if (name === '...')` handler block in `tests/mocks/supabase.ts`.
2. **Audit gate green.** `npx tsx scripts/audit-rpc-contracts.ts` exits 0 — zero stale mocks, zero duplicate handlers, zero code-RPCs-missing-from-migrations.
3. **Coverage delta.** The audit coverage report shows covered count = 111 (was 105) and uncovered count = 72 (was 78), i.e. coverage = 60.7% (was 57.4%), with exactly +6 newly covered RPCs and 0 new uncovered RPCs.
4. **TypeScript.** `npx tsc --noEmit` exits 0.
5. **Test suite.** `npx vitest run` passes with no regression versus the CURRENT_TASK-016 accepted baseline (68 files, 389 tests). A higher pass count is acceptable (new tests exercising the newly-mocked customer paths are encouraged but not mandatory).
6. **Scope integrity.** `git diff --stat` shows changes only in `tests/mocks/supabase.ts` and (optionally) `tests/**`. Zero diff in `services/`, `lib/`, `utils/`, `supabase/`, `scripts/`, `.github/`, `package.json`, or any governance document.
7. **Additive-only.** The 106 existing handlers are unchanged (verified by diff: no removals, no edits to existing handler blocks).
8. **Shape fidelity (review-enforced).** Each new handler's return shape is consistent with its canonical migration function's `RETURNS` clause and parameter list. Verified by inspection against `supabase/migrations/*.sql` (or `supabase/schema.sql` as canonical-derived reference), not by an automated gate.
9. **Traceability.** 6/6 RPCs are traced to their canonical `CREATE [OR REPLACE] FUNCTION public.<name>` declaration (migration file + line) in the Implementation Report, and independently re-verified in the Acceptance Record.

---

## 10. Exit Criteria

CURRENT_TASK-017 is closed when ALL of the following hold:

1. All Acceptance Criteria (§9) are independently verified and recorded in a `CURRENT_TASK-017_ACCEPTANCE_RECORD.md`.
2. The coverage milestone contribution is reached and evidenced by an independent run of the audit gate (covered = 111, coverage = 60.7%).
3. No Critical or Major risk from §12 remains open.
4. The task's diff is committed and the audit gate is green on the committed state.
5. The Program Manager signs the Acceptance Record.

Exit from CURRENT_TASK-017 does **not** exit Phase 4. Phase 4 exit requires the full Phase 4 exit criteria (`CURRENT_PHASE.md` §4) to be met and recorded in `PHASE4_ACCEPTANCE_RECORD.md`. CURRENT_TASK-017 contributes to, but does not satisfy, those criteria. CURRENT_TASK-017 contributes to milestone **M3 — Commerce Entities** (target 64.5% after Wave 3a–3c); M3 is not reached by this task alone.

---

## 11. Deliverables

| # | Deliverable | Owner | Form |
|---|---|---|---|
| 1 | Extended `tests/mocks/supabase.ts` with 6 Domain H5 handler blocks | Engineering team (within authorized CURRENT_TASK-017 implementation) | Code diff, additive-only |
| 2 | `CURRENT_TASK-017_IMPLEMENTATION_REPORT.md` | Engineering team | Markdown report (defined here; not generated by this document) |
| 3 | `CURRENT_TASK-017_ACCEPTANCE_RECORD.md` | Program Manager | Markdown acceptance record with independent verification evidence (defined here; not generated by this document) |
| 4 | Coverage delta evidence | Program Manager | Audit gate output snippet in the Acceptance Record |

**Deliverable definitions (not generated at this step):**

- **`CURRENT_TASK-017_IMPLEMENTATION_REPORT.md`** — Engineering self-report. Must contain: (a) the 6 handler blocks added (diff summary); (b) the 6/6 traceability table (RPC → service call-site → canonical migration file + line → `RETURNS` clause → mock return shape); (c) the three validation gate outputs (audit, tsc, vitest); (d) confirmation of additive-only and scope integrity; (e) any `ponytail:` ceiling notes for intentional simplifications (e.g., aggregate JSON mocks returning fixed shapes, ledger entries mocked as simple arrays).
- **`CURRENT_TASK-017_ACCEPTANCE_RECORD.md`** — Program Manager independent acceptance review. Must contain: (a) objective; (b) scope verification; (c) evidence reviewed (independently reproduced); (d) architecture compliance (10/10 constraints); (e) scope compliance; (f) traceability review (6/6 independently re-verified); (g) validation result (3/3 gates green, independently executed); (h) coverage result (57.4% → 60.7%, exact match); (i) regression result; (j) contract impact (= None); (k) governance compliance; (l) risks; (m) final decision; (n) Program Manager signature.

**Not a deliverable of this task:** any change to production code, migrations, schema, generated types, CI, `package.json`, the audit script, or any governance/planning document. Any such change is a scope violation.

---

## 12. Risk Assessment

| # | Risk | Severity | Mitigation | Residual |
|---|---|---|---|---|
| 1 | **Mock behavioral fidelity** — a Domain H5 mock returns a shape inconsistent with its canonical migration function, tests pass against a fictional contract (the exact failure mode Phase 4 exists to eliminate). | **High** | Constraint #6 + Acceptance Criterion #8 require review-enforced shape fidelity against `supabase/migrations/*.sql`. The audit gate already enforces mock ⊆ migrations. Automated shape-validation gate explicitly deferred to a possible Phase 4+ hardening task. | Medium — review-enforced, not gate-enforced. |
| 2 | **`customers` row shape divergence** — `search_customers_rpc` returns `SETOF public.customers`; a mock that omits columns or uses wrong types diverges from the canonical TABLE. | Low | Verify against the canonical `customers` table definition in `20250703000000_baseline_pre_tenant_schema.sql`. Acceptance Criterion #8 (shape fidelity) + the traceability review catch divergence. | Low. |
| 3 | **`filter_customers_rpc` sort branch coverage** — the canonical function supports sort by `name`, `points`, `debt`, `spent`, and `created_at`; a mock that only handles `created_at` would pass tests but under-cover the contract. | Low | Acceptance Criterion #8 requires the mock honor the canonical parameter set and sort branches. A `ponytail:` note may record a ceiling if a simplification is chosen. | Low. |
| 4 | **`adjust_customer_debt` ledger side-effect fidelity** — the canonical function updates `customers.debt` and inserts a ledger entry via `insert_customer_ledger_entry`; the mock must mirror at least the observable return values (`new_customer_debt`, `ledger_balance_after`). | Low | Acceptance Criterion #8 enforces the return shape. Any intentional simplification of the ledger mutation must be marked with a `ponytail:` ceiling note in the Implementation Report. | Low. |
| 5 | **`tests/mocks/supabase.ts` growth** — adding ~60 lines further extends the single dispatch function, reinforcing the deferred Map-refactor risk noted in the existing `ponytail:` comment. | Low | The refactor is explicitly deferred (Roadmap §8). The file remains a single dispatch function; growth is linear and bounded by the roadmap's total ~2,080-line ceiling. | Low. |
| 6 | **Scope creep** — the task expands beyond Domain H5 (e.g., mocking a downstream H3 order flow that references customers). | Low | Acceptance Criterion #6 prohibits touching files outside `tests/mocks/supabase.ts` + `tests/**`. The audit gate's stale-mock and duplicate-handler detection provide an automated guard against accidental cross-domain additions. | Low. |

**No Critical risks identified.** Risk #1 (mock fidelity) is the inherent Phase 4 risk and is mitigated by review-enforced shape fidelity plus the audit stale-mock gate; it is common to every coverage task and tracked at the program level (`PHASE4_PROGRAM_STATUS_AFTER_M3.md` §7).

---

## 13. Governance Compliance

| Governance Principle | Compliance | Evidence |
|---|---|---|
| **Scope Lock** | PASS | Exactly Domain H5, exactly 6 RPCs, no scope expansion. Task-sizing ceiling (~20 RPCs) not exceeded (6 < 20). Out-of-scope list (§3.2) explicitly excludes all other domains and all production/migration/schema/type/audit/CI surfaces. |
| **Canonical-first** | PASS | All 6 mock return shapes to be derived from canonical migration `RETURNS` clauses (§6 inventory). No derived document overrides the canonical chain. Audit stale-mock gate enforces mock ⊆ migrations. |
| **Additive-only** | PASS | 6 new handler blocks inserted; 106 existing handlers unchanged (Constraint #7, Acceptance Criterion #7). No dispatch change, no new file, no new abstraction. |
| **Phase 4 Alignment** | PASS | Task maps to Phase 4 objective ("test mocks derived from / validated against the canonical migration contract"); stays inside Phase 4 scope; honors Phase 4 constraints (`CURRENT_PHASE.md` §5); produces Phase 4 exit evidence (coverage delta + audit gate green). |
| **CURRENT_TASK Generation Rule** | PASS | Satisfies `CURRENT_PHASE.md` §8: maps to a Phase 4 objective, inside Phase 4 scope, satisfies Phase 4 constraints, produces Phase 4 exit evidence. |
| **Roadmap Conformance** | PASS | Domain H5 is Wave 3b / TASK-H5 exactly as defined in `PHASE4_COVERAGE_ROADMAP.md` §6.2; no reordering, no reclassification, no priority change. Post-M3 status review (`PHASE4_PROGRAM_STATUS_AFTER_M3.md` §5.2/§6) independently recommended H5 as the next task. |
| **One-task-at-a-time** | PASS | CURRENT_TASK-016 is closed and accepted; no other CURRENT_TASK is open. CURRENT_TASK-017 is the sole next task; CURRENT_TASK-018 is not created by this document. |
| **No implementation by this document** | PASS | This document authorizes no code change. Implementation requires a separate Program Manager approval after this Architecture Decision is approved. |

---

## 14. Scope Lock (Restated)

CURRENT_TASK-017 must **not**:

- Modify production code (`services/`, `lib/`, `utils/`, UI, components, pages).
- Modify services (including `services/supabaseService.ts` — this is a call-site only, read-only reference for inventory).
- Modify migrations (`supabase/migrations/*.sql`).
- Modify schema (`supabase/schema.sql`).
- Modify generated types (`supabase/generated/database.types.ts`).
- Modify the audit gate (`scripts/audit-rpc-contracts.ts` — frozen).
- Modify CI (`.github/workflows/ci.yml`) or `package.json`.
- Expand into any other domain (A, B, C, D, E, F, G, H1, H2–H4, H6–H9).
- Create any new file, script, or governance artifact (the Implementation Report and Acceptance Record are the only new documents, generated at their respective later steps, not by this document).
- Re-open, re-order, or re-classify the Coverage Roadmap.

The only file this task is permitted to change is `tests/mocks/supabase.ts` (additive handler blocks) and, optionally, `tests/**` test files that exercise the newly-mocked paths.

---

## 15. Final Decision Block

```text
ARCHITECTURE DECISION

Objective

Authorize CURRENT_TASK-017, Wave 3b, Domain H5 — Customers mock coverage:
add 6 additive RPC handlers to tests/mocks/supabase.ts, derive every return
shape from supabase/migrations/*.sql, and raise mock coverage from 57.4%
(105/183) to 60.7% (111/183) with zero regression.

Scope

In scope: exactly 6 H5 RPCs (search_customers_rpc, filter_customers_rpc,
get_customer_stats, get_customer_report, get_customer_debt_ledger,
adjust_customer_debt) called from services/supabaseService.ts.

Out of scope: production code, migrations, schema, generated types,
audit script, CI, package.json, and every other domain.

Permitted files: tests/mocks/supabase.ts and, if needed, tests/**.

Authorized RPCs

1. search_customers_rpc    (services/supabaseService.ts:581)
2. filter_customers_rpc    (services/supabaseService.ts:659)
3. get_customer_stats       (services/supabaseService.ts:814)
4. get_customer_report      (services/supabaseService.ts:3942)
5. get_customer_debt_ledger (services/supabaseService.ts:1533)
6. adjust_customer_debt     (services/supabaseService.ts:1447)

Total: 6 unique RPCs. No cross-file sharing.

Canonical Source

supabase/migrations/*.sql — the ordered forward migration chain.

All 6 H5 RPCs are defined in:
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
  (lines 6027, 6990, 7005, 7062, 11884, 1611)

No derived document (docs/admin-dashboard/RPC_CONTRACTS.md or otherwise)
may override the migration chain.

Constraints

- Additive only: insert 6 new if (name === '...') blocks; do not touch
  the 106 existing handlers.
- No refactor, no redesign, no new abstraction, no Map dispatch.
- Mock shapes must match canonical RETURNS + parameter lists.
- No duplicate handler; no stale mock; no cross-domain scope creep.
- No changes to production, migrations, schema, generated types, audit,
  CI, or package.json.

Validation

Engineering must independently pass:
- npx tsx scripts/audit-rpc-contracts.ts  (exit 0, no stale/duplicate RPCs)
- npx tsc --noEmit                       (exit 0)
- npx vitest run                         (no regression vs CURRENT_TASK-016 baseline)
- Coverage target: 60.7% (111/183 covered)

Expected Coverage

57.4%

↓

60.7%

Decision

APPROVED

Status

CURRENT_TASK-017
Architecture Approved

Implementation

NOT AUTHORIZED

Next Step

Engineering Kickoff

(Current_TASK-017 Implementation)

requires

a separate authorization.
```

---

*This document is an Architecture Decision only. It creates no mock, writes no code, modifies no source file, and authorizes no implementation. Implementation of CURRENT_TASK-017 requires a separate Program Manager authorization issued after this Architecture Decision is approved. CURRENT_TASK-018 is not created by this document.*
