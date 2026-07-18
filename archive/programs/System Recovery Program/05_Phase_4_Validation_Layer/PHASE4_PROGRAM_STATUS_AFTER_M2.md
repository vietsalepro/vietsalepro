# PHASE4_PROGRAM_STATUS_AFTER_M2.md

**Program:** VietSalePro v7 — System Recovery Program
**Phase:** Phase 4 — Derived Validation Layer Realignment
**Document Type:** Program-Level Planning — Post-Milestone Status Review (Program Manager)
**Date:** 2026-07-15
**Trigger:** Milestone M2 — Tenant Administration & Licensing reached and accepted (`CURRENT_TASK-015_ACCEPTANCE_RECORD.md`, Status: Accepted with Minor Notes)
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_M1.md`, `CURRENT_TASK-015_ACCEPTANCE_RECORD.md`, independent re-run of `npx tsx scripts/audit-rpc-contracts.ts`, `git status`, `git log`

---

> **This is a Program-Level Planning artifact.** It does NOT create CURRENT_TASK-016, does NOT authorize implementation, does NOT modify code, mocks, migrations, tests, or governance. It re-evaluates the full Phase 4 posture after M2 and recommends the next domain. The next CURRENT_TASK may only be generated through the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8) after a separate Program Manager authorization decision.

---

## 1. Executive Summary

Phase 4 has completed its second coverage milestone. **M2 — Tenant Administration & Licensing (51.4%)** is reached, independently verified, and accepted via `CURRENT_TASK-015_ACCEPTANCE_RECORD.md` (Accepted with Minor Notes). CURRENT_TASK-015 is closed.

The Coverage Roadmap (`PHASE4_COVERAGE_ROADMAP.md`) remains valid. Its dependency-driven wave ordering, domain classification, and milestone targets are re-confirmed against the post-M2 state with no change required. The next domain on the roadmap is **Wave 3a — Domain H1: Products & Catalog (11 RPCs, 51.4% → 57.4%, Low effort)**, the first Core Commerce entity leaf, unblocked now that its sole prerequisite (Domain A — Auth) is mocked.

Of the four Phase 4 exit criteria, two are fully satisfied (canonical audit gate alignment; CI divergence gate) and two are partial and progress-bound on the remaining coverage waves. Existing governance remains valid; no threshold, task-sizing, or authority changes are warranted.

The program is on track. The recommended next action is for the Program Manager to authorize **TASK-H1 (Products & Catalog)** as the next CURRENT_TASK, following the established CURRENT_TASK-006…015 document pattern.

---

## 2. Current Phase Status

| Item | Status | Evidence |
|---|---|---|
| Active phase | Phase 4 — Derived Validation Layer Realignment | `CURRENT_PHASE.md` §1 |
| Phase entry gate | PASS (accepted 2026-07-14) | `PHASE4_REAUTHORIZATION_REVIEW.md` §5, `CURRENT_PHASE.md` §3 |
| Closed CURRENT_TASKs in Phase 4 | CURRENT_TASK-012 (Canonical Audit Gate Realignment), CURRENT_TASK-013 (Mock Layer Validation), CURRENT_TASK-014 (Auth, Identity & Security Mock Coverage), CURRENT_TASK-015 (Tenant Administration & Licensing Mock Coverage) | Acceptance records present in working tree |
| Most recent acceptance | CURRENT_TASK-015 — Accepted with Minor Notes (2026-07-15) | `CURRENT_TASK-015_ACCEPTANCE_RECORD.md` §14 |
| Last git commit | `afdef607` — CURRENT_TASK-009 implementation report | `git log --oneline` (independent) |
| Open CURRENT_TASKs | None | CURRENT_TASK-015 closed; no CURRENT_TASK-016 generated |
| Phase 4 acceptance record | Not yet produced — phase incomplete | `PHASE4_ACCEPTANCE_RECORD.md` absent |

**Phase 4 is active, in good standing, and proceeding wave-by-wave per the Coverage Roadmap.**

---

## 3. Coverage Status

### 3.1 Independently Reproduced Coverage (2026-07-15)

Source: independent re-run of `npx tsx scripts/audit-rpc-contracts.ts` by the Program Manager.

| Metric | Value |
|---|---|
| Migration RPCs (canonical source) | 300 |
| Code RPCs (called by `services/`, `lib/`, `utils/`) | 183 |
| Mock RPCs (handler blocks in `tests/mocks/supabase.ts`) | 95 |
| Covered (code RPC with matching mock) | 94 |
| Uncovered (code RPC with no mock) | 89 |
| Coverage | **51.4%** |
| Audit gate exit code | 0 — PASSED |

This reproduces the CURRENT_TASK-015 acceptance record §7.1 exactly. M2 is confirmed.

### 3.2 Coverage Delta Since Baseline

| Milestone | Covered | Coverage | Delta |
|---|---|---|---|
| M0 — Baseline (CURRENT_TASK-013 accepted) | 68 / 183 | 37.2% | — |
| M1 — Auth Foundation (CURRENT_TASK-014 accepted) | 88 / 183 | 48.1% | +10.9 pp |
| **M2 — Tenant Admin (CURRENT_TASK-015 accepted)** | **94 / 183** | **51.4%** | **+3.3 pp** |

### 3.3 Remaining Coverage (89 Uncovered RPCs)

The 89 uncovered RPCs map to the remaining 6 domains / 9 sub-domains of the roadmap (C, D, E, F, G, H1–H9). The dominant carrier remains `services/supabaseService.ts` (Core Commerce barrel). Full per-domain inventory is in `PHASE4_COVERAGE_ROADMAP.md` §1.2 and §2; the post-M2 distribution is the roadmap inventory minus the 26 RPCs now covered (20 Domain A + 6 Domain B).

---

## 4. Remaining Domains

The 89 uncovered RPCs distribute across the remaining domains as follows. Counts are independently reconciled against the audit-gate uncovered list (89 unique RPCs).

| Wave | Domain | RPC Remaining | Dependency | Priority |
|---|---|---|---|---|
| Wave 3a | H1 — Products & Catalog | 11 | A (satisfied) | High (commerce entity leaf, unblocks H2/H3/H4/H7) |
| Wave 3b | H5 — Customers | 6 | A (satisfied) | High (commerce entity leaf, unblocks H3) |
| Wave 3c | H6 — Suppliers | 7 | A (satisfied) | High (commerce entity leaf, unblocks H4/H7) |
| Wave 3d | H2 — Inventory & Stock | 7 | A, H1 (H1 pending) | Medium-High (transactional, unblocks H8) |
| Wave 3e | H3 — Orders & Sales | 7 | A, H1, H2, H5 (all pending) | High (2 Complex handlers; unblocks G) |
| Wave 3f | H4 — Returns & Exchanges | 7 | A, H3, H1, H6 (all pending) | High (2 Complex handlers) |
| Wave 3g | H7 — Imports | 8 | A, H1, H6 (H1, H6 pending) | High (2 Complex handlers) |
| Wave 3h | H8 — Disposals | 3 | A, H2 (H2 pending) | Low |
| Wave 3i | H9 — Reports & Dashboard | 2 | A, all H* (all pending) | Very Low |
| Wave 4a | D — Integrations & Partners | 8 | A (satisfied) | Medium (priority 8, Low effort) |
| Wave 4b | E — Webhooks & API Keys | 10 | A (satisfied) | Medium (priority 9, Medium effort) |
| Wave 4c | C — Compliance & GDPR | 7 | A (satisfied) | Medium (priority 8, Medium effort) |
| Wave 4d | F — Notifications | 3 | A (satisfied) | Low (priority 5, Very Low effort) |
| Wave 4e | G — Promotions | 3 | A, H3 (H3 pending) | Low (priority 6, Very Low effort) |
| **Total** | | **89** | | |

**Remaining waves:** Wave 3 (9 commerce sub-domain tasks) + Wave 4 (5 cross-cutting service tasks) = 14 proposed CURRENT_TASKs remaining.

---

## 5. Roadmap Validation

The Coverage Roadmap (`PHASE4_COVERAGE_ROADMAP.md`) is re-validated against the post-M2 state.

### 5.1 Wave Ordering — Confirmed

| Check | Result | Rationale |
|---|---|---|
| Wave 1 (Auth) precedes all others | Confirmed by execution | Wave 1 complete; its mocks are on the execution path of every subsequent domain's service code. |
| Wave 2 (Tenant Admin) precedes Core Commerce | Confirmed by execution | Wave 2 complete; license validation (`validate_tenant_license`) is now mocked, unblocking commerce feature-access test paths in Wave 3. |
| Wave 3 entity leaves (H1, H5, H6) precede transactions (H3, H4, H7) | Confirmed | Entity mocks must exist for transactional mocks to reference them. No change. |
| Wave 3 residuals (H8, H9) last in commerce | Confirmed | Disposals depend on H2; Reports aggregate across all H. No change. |
| Wave 4 cross-cutting services (D, E, C, F, G) last | Confirmed | These are relatively independent; ordering within the wave follows priority score. No change. |

**No wave reordering required.**

### 5.2 Domain Ordering — Confirmed

Priority ranking from the roadmap (§4): A → H → B → E → D → C → G → F. Domains A and B are now complete. The next domain by wave ordering is **H1 (Products & Catalog)**, the Wave 3a task and the first Core Commerce entity leaf. The roadmap's stated ordering principle — "Auth first, Tenant Admin second, Commerce entities before transactions" — is preserved.

### 5.3 Dependencies — Confirmed

| Domain | Depends On | Status of Prerequisite |
|---|---|---|
| C, D, E, F | A | A complete (M1) — all unblocked |
| G | A, H3 | A complete; H3 pending |
| H1, H5, H6 | A | A complete — unblocked |
| H2 | A, H1 | A complete; H1 pending |
| H3 | A, H1, H2, H5 | A complete; H1, H2, H5 pending |
| H4 | A, H3, H1, H6 | A complete; H3, H1, H6 pending |
| H7 | A, H1, H6 | A complete; H1, H6 pending |
| H8 | A, H2 | A complete; H2 pending |
| H9 | A, all H* | A complete; all H* pending |

No dependency has been invalidated by the M2 execution. The dependency graph in `PHASE4_COVERAGE_ROADMAP.md` §3 remains accurate.

### 5.4 Priority — Confirmed

The priority matrix (§4) is unchanged. M2 execution did not alter any domain's business criticality, dependency depth, test-path unblock potential, or complexity risk. Domains A and B are removed from the active priority queue; H1 is now the highest-priority remaining domain (first unblocked commerce entity leaf).

### 5.5 Milestone Definitions — Confirmed

| Milestone | After Wave | Cumulative Covered | Coverage | Status |
|---|---|---|---|---|
| M0 — Baseline | (CURRENT_TASK-013) | 68 / 183 | 37.2% | Reached |
| M1 — Auth Foundation | Wave 1 | 88 / 183 | 48.1% | Reached |
| M2 — Tenant Admin | Wave 2 | 94 / 183 | 51.4% | **Reached** |
| M3 — Commerce Entities | Wave 3a–3c | 118 / 183 | 64.5% | Not started |
| M4 — Commerce Transactions | Wave 3d–3g | 147 / 183 | 80.3% | Not started |
| M5 — Commerce Complete | Wave 3h–3i | 152 / 183 | 83.1% | Not started |
| M6 — Cross-Cutting Services | Wave 4a–4c | 177 / 183 | 96.7% | Not started |
| M7 — Residuals | Wave 4d–4e | 183 / 183 | 100.0% | Not started |

**Roadmap Validation Conclusion: Coverage Roadmap remains valid. No reordering, no reclassification, no priority change, no milestone-definition change.**

---

## 6. Exit Criteria Status

Phase 4 exit criteria from `CURRENT_PHASE.md` §4, re-assessed post-M2:

| # | Exit Criterion | Status | Evidence |
|---|---|---|---|
| EC-1 | Test mocks are derived from or validated against the canonical migration contract | **PARTIAL** | 94/183 code RPCs now mocked, all derived from canonical migration `RETURNS` clauses (traceability verified in CURRENT_TASK-014 §6 for 20 RPCs and CURRENT_TASK-015 §6 for 6 RPCs). 89 RPCs remain to mock. The derivation discipline is established and proven across two consecutive tasks; the criterion is progress-bound, not blocked. |
| EC-2 | Passing tests imply that the corresponding production path will not fail on the previously known contract breaks | **PARTIAL** | At 51.4%, all Domain A (auth/identity/security) and Domain B (tenant administration/licensing) contract-break paths are now mocked. 89 known uncovered paths still fall through to the `PGRST116` fallback. The implication holds for the covered 51.4% and does not yet hold for the remaining 48.6%. Progress-bound. |
| EC-3 | The operational audit script compares service-layer RPC calls against the canonical migration chain, not against another derived document | **DONE** | `scripts/audit-rpc-contracts.ts` reads the canonical migration chain directly; no derived markdown contract is referenced. Independently re-run 2026-07-15 — exit 0. Frozen and accepted in CURRENT_TASK-012/013. |
| EC-4 | CI gates fail when a derived artifact diverges from the canonical source | **DONE** | `.github/workflows/ci.yml` step "Audit RPC contracts" runs `npm run audit:rpc`; `package.json` `pre-commit` script also runs it. The gate exits non-zero on stale mock (mock ⊄ migrations), duplicate handler, or code-RPC ⊄ migrations — i.e., exactly the derived-vs-canonical divergence conditions. Coverage is informational by design (does not fail CI), which is correct: coverage is a progress metric, not a divergence signal. |

### 6.1 Remaining Deliverables

| # | Deliverable | Status | Notes |
|---|---|---|---|
| D-P4-01 | Validated Test Base | **PARTIAL** | In progress via coverage roadmap. 51.4% of code RPCs validated against canonical contract. Completed when EC-1/EC-2 reach the agreed target (M7 100%, or M4 80.3% if the Program Manager adopts the intermediate floor). |
| D-P4-02 | Canonical Audit Gate Definition | **DONE** | Delivered and frozen via CURRENT_TASK-012. Accepted in CURRENT_TASK-013. |
| D-P4-03 | CI Gate Evidence | **EVIDENCED, NOT YET FORMALIZED** | The CI wiring exists and is independently verified (`ci.yml` + `pre-commit`). A formal evidence record consolidating the CI-gate proof may be required for phase acceptance, but the substantive gate is operational. |
| D-P4-04 | Test-Audit Traceability Report | **NOT YET PRODUCED** | Per-task traceability exists in each acceptance record §6 (CURRENT_TASK-014 §6 traces 20/20; CURRENT_TASK-015 §6 traces 6/6). A consolidated cross-domain traceability report is a phase-exit deliverable, to be assembled once coverage reaches the target. |
| — | `PHASE4_ACCEPTANCE_RECORD.md` | **NOT YET PRODUCED** | Produced only when all Phase 4 exit criteria are met and accepted by the Program Sponsor. |

### 6.2 Phase 4 Validation (Master Plan §4)

The Master Plan Phase 4 Validation requires: *"a deliberate injection of a non-existent RPC call is caught by the audit gate and by the test base; the audit gate reports zero missing RPCs against the canonical migration chain."*

- **Audit-gate half: DONE.** The stale-mock gate and code-RPC-⊆-migrations gate catch any injected non-existent RPC. Validated in CURRENT_TASK-012/013 and re-confirmed by the independent 2026-07-15 run (0 stale, 0 missing).
- **Test-base half: PROGRESS-BOUND.** The test base catches an injected non-existent RPC only on paths that have a mock exercising them. At 51.4% coverage, this holds for Domain A and Domain B paths. Full validation requires coverage completion (or the adopted intermediate floor).

---

## 7. Repository Governance Review

### 7.1 Working-Tree State

Independent `git status` and `git log` review (2026-07-15):

| Item | Value |
|---|---|
| Last commit | `afdef607` — CURRENT_TASK-009 implementation report |
| Uncommitted CURRENT_TASKs | CURRENT_TASK-010 through CURRENT_TASK-015 (acceptance records, architecture decisions, implementation reports, and their code changes) remain uncommitted in the working tree |
| Uncommitted code changes | `tests/mocks/supabase.ts`, `scripts/audit-rpc-contracts.ts`, several admin service/test files (attributable to CURRENT_TASK-010…015 per acceptance records) |
| Untracked governance docs | Phase 1–4 acceptance records, deliverables, roadmap, program status reports, SCAR reports, charter, master plan |

### 7.2 Risk Assessment

| Dimension | Assessment |
|---|---|
| Acceptance integrity | **No impact.** Each CURRENT_TASK's acceptance record independently reproduces all gates (audit, type, test). Acceptance does not depend on commit state. |
| Diff isolation | **Degraded.** With six accepted tasks (010–015) uncommitted, the working tree conflates multiple task boundaries. A future regression bisect cannot cleanly attribute a change to a single task. |
| Recovery risk | **Low.** All accepted artifacts are present in the working tree and are reproducible. No data loss; only commit hygiene is affected. |

### 7.3 Recommendation

This is a governance recommendation only — **not a blocker**, and it does not affect CURRENT_TASK-015 acceptance or M2 authorization.

- **Recommendation (carried forward from CURRENT_TASK-014 §13 and CURRENT_TASK-015 §14 Minor Note 1):** Commit accepted tasks after each acceptance review to preserve clean diff-isolation and enable future regression bisect. A single batch commit of CURRENT_TASK-010…015 (or per-task commits in sequence) would restore commit-history alignment with the acceptance log.
- **Timing:** At the Program Manager's discretion; before Phase 4 exit is preferred but not required.

---

## 8. Recommended Next Domain

### 8.1 Candidate Domain Evaluation

All 14 remaining domains/sub-domains are evaluated against six dimensions.

| Domain | Business Value | Dependency | Risk | Est. RPC | Est. Complexity | Expected Coverage Gain |
|---|---|---|---|---|---|---|
| **H1 — Products & Catalog** | High — core commerce entity, referenced by H2/H3/H4/H7 | A (satisfied) | Low — 11 Simple handlers, no stateful transactions | 11 | Low (~110 lines) | +6.0 pp (51.4% → 57.4%) |
| H5 — Customers | High — commerce entity, referenced by H3 | A (satisfied) | Low — 6 Simple handlers | 6 | Low (~60 lines) | +3.3 pp (57.4% → 60.7%) |
| H6 — Suppliers | High — commerce entity, referenced by H4/H7 | A (satisfied) | Low — 7 Simple handlers | 7 | Low (~70 lines) | +3.8 pp (60.7% → 64.5%) |
| H2 — Inventory | Medium-High — transactional, unblocks H8 | A, H1 (H1 pending) | Medium — 4 Medium handlers, stock mutations | 7 | Medium (~140 lines) | +3.8 pp (64.5% → 68.3%) |
| H3 — Orders | High — core checkout/sales flow, unblocks G | A, H1, H2, H5 (all pending) | High — 2 Complex handlers (process_checkout) | 7 | High (~250 lines) | +3.8 pp (68.3% → 72.1%) |
| H4 — Returns | High — returns/exchanges flow | A, H3, H1, H6 (all pending) | High — 2 Complex handlers (exchange) | 7 | High (~240 lines) | +3.8 pp (72.1% → 76.0%) |
| H7 — Imports | High — import processing flow | A, H1, H6 (H1, H6 pending) | High — 2 Complex handlers (process_import_v2) | 8 | High (~260 lines) | +4.4 pp (76.0% → 80.3%) |
| H8 — Disposals | Medium — disposal flow | A, H2 (H2 pending) | Low — 2 Medium handlers | 3 | Low (~60 lines) | +1.6 pp (80.3% → 82.0%) |
| H9 — Reports | Low-Medium — aggregate reports | A, all H* (all pending) | Very Low — 2 Simple handlers | 2 | Very Low (~20 lines) | +1.1 pp (82.0% → 83.1%) |
| D — Integrations & Partners | Medium — external integration registry | A (satisfied) | Low — 8 Simple CRUD handlers | 8 | Low (~80 lines) | +4.4 pp (83.1% → 87.4%) |
| E — Webhooks & API Keys | Medium — programmatic integration surface | A (satisfied) | Medium — 6 Medium handlers (key gen, delivery state) | 10 | Medium (~220 lines) | +5.5 pp (87.4% → 92.9%) |
| C — Compliance & GDPR | Medium-High — regulatory data handling | A (satisfied) | Medium — 5 Medium handlers (export/delete side effects) | 7 | Medium (~160 lines) | +3.8 pp (92.9% → 96.7%) |
| F — Notifications | Low-Medium — in-app messaging | A (satisfied) | Very Low — 3 Simple handlers | 3 | Very Low (~30 lines) | +1.6 pp (96.7% → 98.4%) |
| G — Promotions | Medium — voucher/promo application | A, H3 (H3 pending) | Very Low — 1 Medium handler | 3 | Very Low (~50 lines) | +1.6 pp (98.4% → 100.0%) |

### 8.2 Recommended Next Domain: Wave 3a — Domain H1: Products & Catalog

| Attribute | Value |
|---|---|
| Domain | H1 — Products & Catalog |
| Roadmap task ID | TASK-H1 |
| Wave | Wave 3a |
| RPC count | 11 unique RPCs |
| Sub-groups | Product existence (`check_product_barcode_exists`, `check_product_code_exists`); Catalog counts (`count_point_products`, `get_brand_product_counts`, `get_category_product_counts`); Product lookup (`get_product_by_barcode`, `get_product_stats`); Sync (`get_unsynced_brands`, `get_unsynced_categories`); Search/filter (`search_products_rpc`, `filter_products_rpc`) |
| Source files | `services/supabaseService.ts` (10 RPCs), `utils/invoiceNumber.ts` (0 — `get_order_auto_code` is H3) |
| Expected coverage increase | 51.4% → 57.4% (+6.0 pp; 94 → 105 covered) |
| Estimated complexity | Low — 11 Simple handlers, 0 Medium, 0 Complex (per roadmap §5.1) |
| Estimated handler lines | ~110 |
| Estimated effort | Low — one focused session |
| Dependencies | Domain A (Auth) — **satisfied** (M1 complete) |
| Dependency rationale | Catalog queries are tenant-scoped; auth/permission mocks are on the execution path. H1 is an entity leaf — no other commerce sub-domain must be mocked first. |
| Unblocks | H2 (Inventory), H3 (Orders), H4 (Returns), H7 (Imports) — all depend on H1 |
| Risk | Low. No stateful transactions; all 11 RPCs are read-only queries, existence checks, or counters. Largest single-task coverage gain in the remaining roadmap (+6.0 pp). |

### 8.3 Why H1 and not a cross-cutting service (D, E, C, F)

Although D (Integrations, 8 RPCs) and E (Webhooks, 10 RPCs) are unblocked and have comparable or larger RPC counts, the roadmap deliberately orders Core Commerce (Wave 3) before cross-cutting services (Wave 4) because:

1. **Dependency unblock density.** H1 is a prerequisite for 4 downstream commerce sub-domains (H2, H3, H4, H7). Mocking H1 first maximizes test-path unblocking per RPC for the entire commerce wave. Cross-cutting services unblock no downstream domain.
2. **Milestone progression.** H1 is the first task of M3 (Commerce Entities, 64.5%). Starting Wave 3 keeps the program on the milestone-critical path. Starting Wave 4 now would skip M3/M4/M5 and leave the commerce barrel (the dominant carrier, 58 of 89 remaining RPCs) unaddressed.
3. **Effort efficiency.** H1 is 11 Simple handlers (~110 lines, Low effort) for +6.0 pp — the highest coverage-per-effort ratio among remaining domains. D is 8 Simple handlers for +4.4 pp; E is 10 handlers but Medium complexity for +5.5 pp.

This is the roadmap's own ordering (§6.1 items 3–4) and is re-confirmed.

### 8.4 Why H1 and not H5 or H6 (the other commerce entity leaves)

H1, H5, and H6 are all unblocked entity leaves with Low effort. The roadmap orders H1 first because:

1. **H1 has the highest dependency depth** — 4 downstream sub-domains depend on it (H2, H3, H4, H7), versus 1 for H5 (H3) and 2 for H6 (H4, H7).
2. **H1 has the largest RPC count** (11) and coverage gain (+6.0 pp) among the three leaves, clearing the most commerce surface in one task.

H5 and H6 follow in Wave 3b and 3c respectively, completing M3 (Commerce Entities).

**This is a recommendation only. No CURRENT_TASK-016 is generated by this document.**

---

## 9. Risks

| # | Risk | Severity | Status | Notes |
|---|---|---|---|---|
| 1 | Mock behavioral fidelity — a mock returns the wrong shape and tests pass against a fictional contract | High | Mitigated, ongoing | Each task's acceptance requires mock shapes to match canonical migration `RETURNS` clauses (traceability review). Audit stale-mock gate enforces mock ⊆ migrations. Two consecutive tasks (014, 015) have demonstrated the discipline. Shape-validation automation deferred to Phase 4+ hardening (roadmap §8). |
| 2 | `tests/mocks/supabase.ts` growth toward ~4,500 lines reduces maintainability | Medium | Accepted | Current file ~2,700 lines after M2. Single dispatch function; Map-based refactor noted in existing `ponytail:` comment (line 67) is available but out of scope. Roadmap does not require it. |
| 3 | Complex stateful mocks (H3 checkout, H7 import, H4 exchange) introduce test-only state bugs | Medium | Future (Waves 3e–3g) | Mitigation per ponytail rule: each complex handler leaves one runnable check (happy path + error/rollback). Not yet relevant — next task (H1) has no Complex handlers. |
| 4 | Working-tree governance gap — uncommitted changes from CURRENT_TASK-010…015 | Low (informational) | Open | Last commit is `afdef607` (CURRENT_TASK-009). Recommendation reiterated (§7.3): commit accepted tasks after each acceptance review. Does not block M3 authorization. |
| 5 | Coverage stall — intermediate floor (M4 80.3%) adopted prematurely as exit threshold | Low | Decision deferred | Roadmap §7.1 offers M4 as a minimum viable floor. Program Manager should prefer full M7 (100%) given the low marginal cost of Waves 4d–4e (6 RPCs, Very Low complexity). No decision required at M2. |
| 6 | `get_revenue_metrics` mock behavioral gap (carried from CURRENT_TASK-015 Minor Note 2) | Low | Accepted | Mock omits payment date-range filter; return shape correct. ponytail note covers timezone but not filter omission. Does not affect coverage or contract fidelity for the return shape. No action required for M3 planning. |

No Critical or Major risk is open. All risks are tracked and either mitigated, accepted, or deferred with a named decision point.

---

## 10. Governance Status

### 10.1 Governance Review

| Dimension | Review | Decision |
|---|---|---|
| Decision authority | Unchanged — Program Manager, with architecture authority input on technical decisions | No change |
| Architecture authority | Unchanged — owns conformance to canonical migration-first principle and derived-validation-layer boundary | No change |
| Acceptance authority | Unchanged — Program Sponsor accepts Phase 4 exit evidence | No change |
| Escalation path | Unchanged — disputes to Program Sponsor per Charter | No change |
| CURRENT_TASK Generation Rule | Unchanged — `CURRENT_PHASE.md` §8 (maps to Phase 4 objective, inside scope, satisfies constraints, produces exit evidence) | No change |

### 10.2 Threshold Review

| Threshold | Current | Review | Decision |
|---|---|---|---|
| Coverage target | M7 100% (M4 80.3% intermediate floor available) | Unchanged — M2 at 51.4% is on the M3 trajectory | No change |
| Task sizing | ~20 RPC max per task (roadmap §6.3) | H1 at 11 RPCs is within limit | No change |
| One Domain per CURRENT_TASK | One domain or one commerce sub-domain per task | H1 is a single sub-domain | No change |
| Audit Gate | `npx tsx scripts/audit-rpc-contracts.ts` exit 0 required | Frozen, independently re-confirmed exit 0 at M2 | No change |
| Acceptance Workflow | Independent Program Manager acceptance review per task | Demonstrated across 012–015 | No change |

### 10.3 Scope Lock Review

| Constraint | Status |
|---|---|
| No feature development | Honored — all Phase 4 tasks are mock-only |
| No architecture redesign | Honored — dispatch pattern unchanged |
| No scope expansion beyond Recovery Program charter | Honored |
| No implementation outside an approved CURRENT_TASK | Honored |
| Canonical-first (mocks derived from migration chain) | Honored — traceability verified per task |

**Existing Governance remains valid.**

---

## 11. Program Recommendation

### 11.1 Recommended Next Domain

**Wave 3a — Domain H1: Products & Catalog (TASK-H1)**

- 11 RPCs, Low effort, +6.0 pp coverage (51.4% → 57.4%)
- First Core Commerce entity leaf; unblocks H2, H3, H4, H7
- Highest coverage-per-effort ratio among remaining domains
- On the M3 (Commerce Entities) milestone-critical path

### 11.2 Coverage Target Next

**M3 — Commerce Entities (64.5%)** after Wave 3a–3c (H1 + H5 + H6 = 24 RPCs).

### 11.3 Milestone Next

**M3 — Commerce Entities** — reached after Wave 3a (H1), 3b (H5), and 3c (H6) are accepted. Cumulative 118/183 = 64.5%.

### 11.4 No Task Created

This document is a recommendation only. CURRENT_TASK-016 is **not created** by this document. The next CURRENT_TASK may only be generated through the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8) after a separate Program Manager authorization decision.

---

## 12. Summary

| Item | Value |
|---|---|
| Total uncovered RPCs (post-M2) | 89 |
| Current coverage | 51.4% (94 / 183) |
| Milestones reached | M0, M1, M2 |
| Milestones remaining | M3, M4, M5, M6, M7 |
| Domains completed | A (Auth), B (Tenant Admin) |
| Domains remaining | C, D, E, F, G, H1–H9 (14 sub-domains) |
| Proposed CURRENT_TASKs remaining | 14 (Wave 3 × 9 + Wave 4 × 5) |
| Intermediate target | M4 — 80.3% (all foundational + commerce) |
| Full target | M7 — 100.0% (183 / 183) |
| Verification mechanism | `npx tsx scripts/audit-rpc-contracts.ts` (deterministic, single command) |
| Files touched per task | `tests/mocks/supabase.ts` + test files only (no production/migration/schema/CI changes) |
| Roadmap status | Valid — no reordering, no reclassification, no priority change |
| Governance status | Valid — no threshold, task-sizing, or authority change |

---

Awaiting Program Manager Decision
