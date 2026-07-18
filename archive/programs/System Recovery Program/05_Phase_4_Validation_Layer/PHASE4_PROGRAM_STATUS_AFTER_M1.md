# PHASE4_PROGRAM_STATUS_AFTER_M1.md

**Program:** VietSalePro v7 — System Recovery Program
**Phase:** Phase 4 — Derived Validation Layer Realignment
**Document Type:** Program-Level Planning — Post-Milestone Status Review (Program Manager)
**Date:** 2026-07-15
**Trigger:** Milestone M1 — Auth Foundation reached and accepted (`CURRENT_TASK-014_ACCEPTANCE_RECORD.md`, Status: Accepted with Minor Notes)
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-014_ACCEPTANCE_RECORD.md`, independent re-run of `npx tsx scripts/audit-rpc-contracts.ts`, `.github/workflows/ci.yml`, `package.json`

---

> **This is a Program-Level Planning artifact.** It does NOT create CURRENT_TASK-015, does NOT authorize implementation, does NOT modify code, mocks, migrations, tests, or governance. It re-evaluates the full Phase 4 posture after M1 and recommends the next domain. The next CURRENT_TASK may only be generated through the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8) after a separate Program Manager authorization decision.

---

## 1. Executive Summary

Phase 4 has completed its first coverage milestone. **M1 — Auth Foundation (48.1%)** is reached, independently verified, and accepted via `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` (Accepted with Minor Notes). CURRENT_TASK-014 is closed.

The Coverage Roadmap (`PHASE4_COVERAGE_ROADMAP.md`) remains valid. Its dependency-driven wave ordering, domain classification, and milestone targets are re-confirmed against the post-M1 state with no change required. The next domain on the roadmap is **Wave 2 — Domain B: Tenant Administration & Licensing (6 RPCs, 48.1% → 51.4%, Low effort)**, which is unblocked now that its sole prerequisite (Domain A — Auth) is mocked.

Of the four Phase 4 exit criteria, two are fully satisfied (canonical audit gate alignment; CI divergence gate) and two are partial and progress-bound on the remaining coverage waves. Existing governance remains valid; no threshold, task-sizing, or authority changes are warranted.

The program is on track. The recommended next action is for the Program Manager to authorize **TASK-B (Tenant Admin & Licensing)** as the next CURRENT_TASK, following the established CURRENT_TASK-006…014 document pattern.

---

## 2. Current Phase Status

| Item | Value | Source |
|---|---|---|
| Active phase | Phase 4 — Derived Validation Layer Realignment | `CURRENT_PHASE.md` §1 |
| Phase entry gate | PASS (accepted 2026-07-14) | `PHASE4_REAUTHORIZATION_REVIEW.md` §5, `CURRENT_PHASE.md` §3 |
| Closed CURRENT_TASKs in Phase 4 | CURRENT_TASK-012 (Canonical Audit Gate Realignment), CURRENT_TASK-013 (Mock Layer Validation), CURRENT_TASK-014 (Auth, Identity & Security Mock Coverage) | Acceptance records present in working tree |
| Most recent acceptance | CURRENT_TASK-014 — Accepted with Minor Notes (2026-07-15) | `CURRENT_TASK-014_ACCEPTANCE_RECORD.md` §14 |
| Last git commit | `afdef607` — CURRENT_TASK-009 implementation report | `git log --oneline` (independent) |
| Open CURRENT_TASKs | None | CURRENT_TASK-014 closed; no CURRENT_TASK-015 generated |
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
| Mock RPCs (handler blocks in `tests/mocks/supabase.ts`) | 89 |
| Covered (code RPC with matching mock) | 88 |
| Uncovered (code RPC with no mock) | 95 |
| Coverage | **48.1%** |
| Audit gate exit code | 0 — PASSED |

This reproduces the CURRENT_TASK-014 acceptance record §7.1 exactly. M1 is confirmed.

### 3.2 Coverage Delta Since Baseline

| Milestone | Covered | Coverage | Delta |
|---|---|---|---|
| M0 — Baseline (CURRENT_TASK-013 accepted) | 68 / 183 | 37.2% | — |
| **M1 — Auth Foundation (CURRENT_TASK-014 accepted)** | **88 / 183** | **48.1%** | **+10.9 pp** |

### 3.3 Remaining Coverage (95 Uncovered RPCs)

The 95 uncovered RPCs map to the remaining 7 domains / sub-domains of the roadmap (B, C, D, E, F, G, H1–H9). The dominant carrier remains `services/supabaseService.ts` (Core Commerce barrel). Full per-domain inventory is in `PHASE4_COVERAGE_ROADMAP.md` §1.2 and §2; the post-M1 distribution is the roadmap inventory minus the 20 Domain A RPCs now covered.

---

## 4. Roadmap Validation

The Coverage Roadmap (`PHASE4_COVERAGE_ROADMAP.md`) is re-validated against the post-M1 state.

### 4.1 Wave Ordering — Confirmed

| Check | Result | Rationale |
|---|---|---|
| Wave 1 (Auth) precedes all others | Confirmed by execution | Wave 1 is complete; its mocks are now on the execution path of every subsequent domain's service code, exactly as the dependency analysis predicted. |
| Wave 2 (Tenant Admin) precedes Core Commerce | Confirmed | License validation (`validate_tenant_license`) gates commerce feature access; mocking B before H remains correct. |
| Wave 3 entity leaves (H1, H5, H6) precede transactions (H3, H4, H7) | Confirmed | Entity mocks must exist for transactional mocks to reference them. No change. |
| Wave 3 residuals (H8, H9) last in commerce | Confirmed | Disposals depend on H2; Reports aggregate across all H. No change. |
| Wave 4 cross-cutting services (D, E, C, F, G) last | Confirmed | These are relatively independent; ordering within the wave follows priority score. No change. |

**No wave reordering required.**

### 4.2 Domain Ordering — Confirmed

Priority ranking from the roadmap (§4): A → H → B → E → D → C → G → F. Domain A is now complete. The next domain by roadmap ordering is **B (Tenant Admin & Licensing)**, which is the Wave 2 task. The roadmap's stated ordering principle — "Auth first, Tenant Admin second, Commerce entities before transactions" — is preserved.

### 4.3 Dependencies — Confirmed

| Domain | Depends On | Status of Prerequisite |
|---|---|---|
| B (Tenant Admin) | A | A complete (M1) — B unblocked |
| C, D, E, F | A | A complete — all unblocked |
| H1, H5, H6 | A | A complete — unblocked |
| H2 | A, H1 | A complete; H1 pending |
| H3 | A, H1, H2, H5 | A complete; H1, H2, H5 pending |
| H4 | A, H3, H1, H6 | A complete; H3, H1, H6 pending |
| H7 | A, H1, H6 | A complete; H1, H6 pending |
| H8 | A, H2 | A complete; H2 pending |
| H9 | A, all H* | A complete; all H* pending |
| G | A, H3 | A complete; H3 pending |

No dependency has been invalidated by the M1 execution. The dependency graph in `PHASE4_COVERAGE_ROADMAP.md` §3 remains accurate.

### 4.4 Priority — Confirmed

The priority matrix (§4) is unchanged. M1 execution did not alter any domain's business criticality, dependency depth, test-path unblock potential, or complexity risk. Domain A's completion removes it from the active priority queue; B is now the highest-priority remaining domain.

**Roadmap Validation Conclusion: The Coverage Roadmap remains valid. No reordering, no reclassification, no priority change.**

---

## 5. Remaining Exit Criteria

Phase 4 exit criteria from `CURRENT_PHASE.md` §4, re-assessed post-M1:

| # | Exit Criterion | Status | Evidence |
|---|---|---|---|
| EC-1 | Test mocks are derived from or validated against the canonical migration contract | **PARTIAL** | 88/183 code RPCs now mocked, all derived from canonical migration `RETURNS` clauses (traceability verified in CURRENT_TASK-014 §6). 95 RPCs remain to mock. The derivation discipline is established and proven; the criterion is progress-bound, not blocked. |
| EC-2 | Passing tests imply that the corresponding production path will not fail on the previously known contract breaks | **PARTIAL** | At 48.1%, all Domain A (auth/identity/security) contract-break paths are now mocked. 95 known uncovered paths still fall through to the `PGRST116` fallback. The implication holds for the covered 48.1% and does not yet hold for the remaining 51.9%. Progress-bound. |
| EC-3 | The operational audit script compares service-layer RPC calls against the canonical migration chain, not against another derived document | **DONE** | `scripts/audit-rpc-contracts.ts` reads the canonical migration chain directly; no derived markdown contract is referenced. Independently re-run 2026-07-15 — exit 0. Frozen and accepted in CURRENT_TASK-012/013. |
| EC-4 | CI gates fail when a derived artifact diverges from the canonical source | **DONE** | `.github/workflows/ci.yml` step "Audit RPC contracts" runs `npm run audit:rpc`; `package.json` `pre-commit` script also runs it. The gate exits non-zero on stale mock (mock ⊄ migrations), duplicate handler, or code-RPC ⊄ migrations — i.e., exactly the derived-vs-canonical divergence conditions. Coverage is informational by design (does not fail CI), which is correct: coverage is a progress metric, not a divergence signal. |

### 5.1 Remaining Deliverables

| # | Deliverable | Status | Notes |
|---|---|---|---|
| D-P4-01 | Validated Test Base | **PARTIAL** | In progress via coverage roadmap. 48.1% of code RPCs validated against canonical contract. Completed when EC-1/EC-2 reach the agreed target (M7 100%, or M4 80.3% if the Program Manager adopts the intermediate floor). |
| D-P4-02 | Canonical Audit Gate Definition | **DONE** | Delivered and frozen via CURRENT_TASK-012 (Canonical Audit Gate Realignment). Accepted in CURRENT_TASK-013. |
| D-P4-03 | CI Gate Evidence | **EVIDENCED, NOT YET FORMALIZED** | The CI wiring exists and is independently verified (`ci.yml` + `pre-commit`). A formal evidence record consolidating the CI-gate proof may be required for phase acceptance, but the substantive gate is operational. |
| D-P4-04 | Test-Audit Traceability Report | **NOT YET PRODUCED** | Per-task traceability exists in each acceptance record §6 (e.g., CURRENT_TASK-014 §6 traces 20/20 RPCs to migration files). A consolidated cross-domain traceability report is a phase-exit deliverable, to be assembled once coverage reaches the target. |
| — | `PHASE4_ACCEPTANCE_RECORD.md` | **NOT YET PRODUCED** | Produced only when all Phase 4 exit criteria are met and accepted by the Program Sponsor. |

### 5.2 Phase 4 Validation (Master Plan §4)

The Master Plan Phase 4 Validation requires: *"a deliberate injection of a non-existent RPC call is caught by the audit gate and by the test base; the audit gate reports zero missing RPCs against the canonical migration chain."*

- **Audit-gate half: DONE.** The stale-mock gate and code-RPC-⊆-migrations gate catch any injected non-existent RPC. This was validated in CURRENT_TASK-012/013 and re-confirmed by the independent 2026-07-15 run (0 stale, 0 missing).
- **Test-base half: PROGRESS-BOUND.** The test base catches an injected non-existent RPC only on paths that have a mock exercising them. At 48.1% coverage, this holds for Domain A paths. Full validation requires coverage completion (or the adopted intermediate floor).

---

## 6. Recommended Next Domain

### Recommendation: Wave 2 — Domain B: Tenant Administration & Licensing

| Attribute | Value |
|---|---|
| Domain | B — Tenant Administration & Licensing |
| Roadmap task ID | TASK-B |
| Wave | Wave 2 |
| RPC count | 6 unique RPCs |
| Sub-groups | Licensing (`generate_tenant_license`, `validate_tenant_license`); Member Invitations (`accept_invitation`, `lookup_invitation`); Program Analytics (`get_churn_cohort_metrics`, `get_revenue_metrics`) |
| Source files | `services/admin/licenseService.ts`, `services/admin/memberAdminService.ts`, `services/admin/analyticsAdminService.ts`, `services/billingAutomationService.ts` |
| Expected coverage increase | 48.1% → 51.4% (+3.3 pp; 88 → 94 covered) |
| Estimated complexity | Low — 4 Simple handlers, 2 Medium handlers, 0 Complex (per roadmap §5.1) |
| Estimated handler lines | ~90 |
| Estimated effort | Low — one focused session |
| Dependencies | Domain A (Auth) — **satisfied** (M1 complete) |
| Dependency rationale | Member invitation + license validation require auth context (`is_system_admin`, tenant resolution), now mocked. License gates (`validate_tenant_license`) unblock commerce feature-access test paths in later waves. |
| Risk | Low. No stateful transactions; mostly read/validate. `get_churn_cohort_metrics` and `get_revenue_metrics` are cross-file shared (analytics + billing automation) but counted once — handler covers both call sites. |

### Why B and not H (Core Commerce)

Although H has a higher raw priority score (12 vs B's 9), the roadmap deliberately orders B before H because:
1. B's license-validation mocks unblock commerce feature-access test paths (H flows call `validate_tenant_license`).
2. B is small (6 RPCs, Low effort) and clears the entire tenant-administration surface in one task, reducing later wave interference.
3. H is large (58 RPCs across 9 sub-domains) and is itself wave-internal-ordered by entity-before-transaction dependencies; it does not benefit from being started before B.

This is the roadmap's own ordering (§6.1 item 2) and is re-confirmed.

### Estimated RPC Count and Complexity

- **6 RPCs** (exact, from roadmap §2 Domain B).
- **Complexity: Low.** 4 Simple (read/validate), 2 Medium (license generation returns a structured payload; analytics returns computed aggregates). No Complex stateful transactions.
- **Coverage delta: +3.3 pp** (88 → 94 covered; 95 → 89 uncovered).

**This is a recommendation only. No CURRENT_TASK-015 is generated by this document.**

---

## 7. Risks

| # | Risk | Severity | Status | Notes |
|---|---|---|---|---|
| 1 | Mock behavioral fidelity — a mock returns the wrong shape and tests pass against a fictional contract | High | Mitigated, ongoing | Each task's acceptance requires mock shapes to match canonical migration `RETURNS` clauses (traceability review). Audit stale-mock gate enforces mock ⊆ migrations. Shape-validation automation deferred to Phase 4+ hardening (roadmap §8). |
| 2 | `tests/mocks/supabase.ts` growth toward ~4,500 lines reduces maintainability | Medium | Accepted | Single dispatch function; Map-based refactor noted in existing `ponytail:` comment (line 67) is available but out of scope. Roadmap does not require it. |
| 3 | Complex stateful mocks (H3 checkout, H7 import, H4 exchange) introduce test-only state bugs | Medium | Future (Waves 3e–3g) | Mitigation per ponytail rule: each complex handler leaves one runnable check (happy path + error/rollback). Not yet relevant — next task (B) has no Complex handlers. |
| 4 | Working-tree governance gap — uncommitted changes from CURRENT_TASK-010…014 | Low (informational) | Open | Last commit is `afdef607` (CURRENT_TASK-009). Recommended (CURRENT_TASK-014 §13 Minor Note 1): commit accepted tasks after each acceptance review to preserve clean diff-isolation. Does not block M2 authorization. |
| 5 | Coverage stall — intermediate floor (M4 80.3%) adopted prematurely as exit threshold | Low | Decision deferred | Roadmap §7.1 offers M4 as a minimum viable floor. Program Manager should prefer full M7 (100%) given the low marginal cost of Waves 4d–4e (6 RPCs, Very Low complexity). No decision required at M1. |

No Critical or Major risk is open. All risks are tracked and either mitigated, accepted, or deferred with a named decision point.

---

## 8. Governance Status

### 8.1 Governance Review

| Dimension | Review | Decision |
|---|---|---|
| Decision authority | Unchanged — Program Manager, with architecture authority input on technical decisions | No change |
| Architecture authority | Unchanged — owns conformance to canonical migration-first principle and derived-validation-layer boundary | No change |
| Acceptance authority | Unchanged — Program Sponsor accepts Phase 4 exit evidence | No change |
| Escalation path | Unchanged — disputes to Program Sponsor per Charter | No change |
| CURRENT_TASK Generation Rule | Unchanged — `CURRENT_PHASE.md` §8 (maps to Phase 4 objective, inside scope, satisfies constraints, produces exit evidence) | No change |

### 8.2 Threshold Review

| Threshold | Current | Review | Decision |
|---|---|---|---|
| Coverage target | M7 100% (M4 80.3% intermediate floor available) | On track at 48.1%; no evidence the target needs lowering | No change |
| Task sizing ceiling | ~20 RPCs per CURRENT_TASK | B is 6 RPCs (well under ceiling); H sub-domains are 2–11 RPCs (under ceiling); only a merged-H task would exceed — not planned | No change |
| Audit gate strictness | Stale-mock, duplicate-handler, code-RPC-⊆-migrations gates enforced; coverage informational | Gates proven operational (independent re-run green) | No change |
| Validation gates per task | audit:rpc exit 0 + tsc --noEmit exit 0 + vitest run all pass + no out-of-scope file changes | Proven by CURRENT_TASK-014 (3/3 green) | No change |

### 8.3 Task Sizing Review

The ~20-RPC task sizing ceiling remains appropriate. CURRENT_TASK-014 (20 RPCs) was accepted cleanly with full traceability and zero regression. The remaining domains are all at or below the ceiling (B=6, C=7, D=8, E=10, F=3, G=3, H1=11, H2=7, H3=7, H4=7, H5=6, H6=7, H7=8, H8=3, H9=2). No task-splitting or task-merging is warranted.

> **Existing Governance remains valid.**

No governance change, no threshold change, no task-sizing change is warranted at M1.

---

## 9. Program Recommendation

1. **Roadmap re-confirmed.** The Coverage Roadmap's wave ordering, domain ordering, dependencies, and priority are valid post-M1. No change.
2. **Next domain recommended: Wave 2 — Domain B (Tenant Administration & Licensing), 6 RPCs, 48.1% → 51.4%, Low effort.** Unblocked (Domain A complete). Low risk. Clears the tenant-administration surface and unblocks commerce license-gate test paths.
3. **Coverage target re-confirmed: M7 100%.** The Program Manager should prefer the full target; M4 (80.3%) remains available as a minimum viable floor only if a specific residual proves disproportionately expensive later.
4. **Governance unchanged.** Existing governance, thresholds, and task sizing remain valid.
5. **Open governance action (informational, non-blocking):** commit accepted tasks (CURRENT_TASK-010…014) to preserve clean diff-isolation for future acceptance reviews (CURRENT_TASK-014 §13 Minor Note 1).
6. **Phase-exit deliverables to assemble later:** D-P4-01 completion (coverage target reached), D-P4-03 CI Gate Evidence formalization, D-P4-04 consolidated Test-Audit Traceability Report, and `PHASE4_ACCEPTANCE_RECORD.md` — all produced once coverage reaches the agreed target.

**No CURRENT_TASK-015 is generated by this document.** The next CURRENT_TASK may only be generated through a separate Program Manager authorization decision following the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8).

---

## Phase 4 Status

M1 Completed

Coverage
48.1%

CURRENT_TASK-014
Closed

Awaiting Program Manager Decision
for the next authorized CURRENT_TASK
