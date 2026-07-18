# CURRENT_TASK-023 Program Authorization

**Program:** VietSalePro v7 — System Recovery Program  
**Document Type:** Program Authorization  
**Date:** 2026-07-15  
**Authorization Authority:** Program Manager  
**Status:** APPROVED  

---

## 1. Executive Summary

CURRENT_TASK-023 is authorized to proceed. The previous task, CURRENT_TASK-022 (Wave 3g — Domain H7: Imports), has been independently accepted and closed. Phase 4 coverage has advanced to **147/183 RPCs (80.3%)**, program health remains **HEALTHY**, and no blockers have been identified.

This authorization approves the next planned wave in the Phase 4 coverage roadmap:

| Attribute | Value |
|---|---|
| **CURRENT_TASK** | CURRENT_TASK-023 |
| **Domain** | H8 — Disposals |
| **Wave** | 3h |
| **Status** | AUTHORIZED |
| **Next Step** | `CURRENT_TASK-023_ARCHITECTURE_DECISION.md` |

---

## 2. Program Status

| Dimension | Status |
|---|---|
| Program | VietSalePro v7 — System Recovery Program |
| Overall Health | **HEALTHY** |
| Active Phase | **Phase 4 — Derived Validation Layer Realignment** |
| Phase Exit Decision | **NOT EXIT** |
| Last Closed Task | **CURRENT_TASK-022** |

The program is operating within the approved `SYSTEM_RECOVERY_MASTER_PLAN.md`. Governance is converged, the canonical migration chain is accepted, the RPC contract is reconciled, and the derived validation layer is being rebuilt incrementally through approved coverage waves.

---

## 3. Phase Status

| Attribute | Value |
|---|---|
| Phase | **Phase 4 — Derived Validation Layer Realignment** |
| Phase Status | **ACTIVE** |
| Scope Lock | **HEALTHY** — no unauthorized scope expansion in CURRENT_TASK-022 |
| Canonical Alignment | **HEALTHY** — mocks derived from the canonical migration chain |
| Validation | **HEALTHY** — audit, type, and test gates green |

Phase 4 exit criteria EC-3 and EC-4 remain open as known residuals. They are tracked at the phase level and do not block the next operational wave.

---

## 4. Milestone Status

| Attribute | Value |
|---|---|
| Current Milestone | **M4 — Commerce Transactions** |
| Milestone Status | **IN PROGRESS** |
| Completed Waves | Wave 3a, 3b, 3c, 3d, 3e, 3f, **3g** |
| M4 Coverage Target | 80.3% (147 / 183) — **ACHIEVED** |

All Core Commerce transactional sub-domains in M4 (H1 Products, H5 Customers, H6 Suppliers, H2 Inventory, H3 Orders, H4 Returns, H7 Imports) have been completed. Domain H8 (Disposals) is the remaining M4 commerce transaction sub-domain.

---

## 5. Coverage Status

| Metric | Value |
|---|---|
| Migration RPCs (canonical source) | 300 |
| Code RPCs (called by services / lib / utils) | 183 |
| Covered RPCs | **147 / 183** |
| Coverage | **80.3%** |
| Uncovered RPCs | 36 |
| Delta from CURRENT_TASK-022 | +8 RPCs, +4.3 percentage points |

Source: `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_022.md` §4, `PHASE4_COVERAGE_ROADMAP.md` §1.1 and §6.2.

---

## 6. Roadmap Review

Per `PHASE4_COVERAGE_ROADMAP.md` §6.2, the planned sequence after Wave 3g is:

| Wave | Domain | RPCs | Cumulative Coverage | Status |
|---|---|---:|---|---|
| Wave 1 | A — Auth, Identity & Security | 20 | 48.1% | COMPLETE |
| Wave 2 | B — Tenant Admin & Licensing | 6 | 51.4% | COMPLETE |
| Wave 3a | H1 — Products & Catalog | 11 | 57.4% | COMPLETE |
| Wave 3b | H5 — Customers | 6 | 60.7% | COMPLETE |
| Wave 3c | H6 — Suppliers | 7 | 64.5% | COMPLETE |
| Wave 3d | H2 — Inventory & Stock | 7 | 68.3% | COMPLETE |
| Wave 3e | H3 — Orders & Sales | 7 | 72.1% | COMPLETE |
| Wave 3f | H4 — Returns & Exchanges | 7 | 76.0% | COMPLETE |
| Wave 3g | H7 — Imports | 8 | 80.3% | COMPLETE |
| **Wave 3h** | **H8 — Disposals** | **3** | **82.0%** | **AUTHORIZED** |
| Wave 3i (proposed) | H9 — Reports & Dashboard | 2 | 83.1% | NOT AUTHORIZED |
| Wave 4a–4e (proposed) | D, E, C, F, G | 31 | 100.0% | NOT AUTHORIZED |

**Next Candidate Confirmed:** Wave 3h — Domain H8: Disposals (3 RPCs, estimated +1.7 percentage points to 82.0% cumulative coverage).

The Domain H8 RPCs identified in the Coverage Roadmap are:

- `delete_disposal_with_restore`
- `filter_disposals_rpc`
- `get_disposal_auto_code`

This wave remains inside the Milestone M4 scope and the Phase 4 objective of realigning the derived validation layer against the canonical contract.

---

## 7. Dependency Verification

| Dependency | Status | Evidence |
|---|---|---|
| Preceding wave (Wave 3g — Domain H7: Imports) closed | **SATISFIED** | `CURRENT_TASK-022_ACCEPTANCE_REVIEW_v2.md` records PASS; `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_022.md` §2 confirms CLOSED. |
| Phase 4 active and not in exit | **SATISFIED** | `CURRENT_PHASE.md` §1 and §9; `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_022.md` §6 and §8. |
| Milestone M4 target achieved | **SATISFIED** | `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_022.md` §6 confirms M4 coverage target of 80.3% achieved. |
| Canonical migration chain accepted | **SATISFIED** | `PHASE3_ACCEPTANCE_RECORD.md` accepted 2026-07-14; `CURRENT_PHASE.md` §3. |
| No unresolved critical blockers | **SATISFIED** | `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_022.md` §9 — Overall Program Health HEALTHY; no critical or major risks introduced. |

No cross-task engineering dependencies require Wave 3h to wait.

---

## 8. Risk Assessment

| Risk | Severity | Status | Assessment |
|---|---|---|---|
| Audit gate compares code against `docs/admin-dashboard/RPC_CONTRACTS.md` instead of the canonical migration chain. | Medium | OPEN | Tracked as Phase 4 Exit Criterion EC-3. Not blocking for CURRENT_TASK-023. |
| No CI divergence gate exists for derived artifacts. | Medium | OPEN | Tracked as Phase 4 Exit Criterion EC-4. Not blocking for CURRENT_TASK-023. |
| `tests/mocks/supabase.ts` continues to grow. | Low | ACCEPTED | Known residual; consistent with the approved coverage-wave approach. |
| Scope creep into production code / migrations / schema. | Low | MITIGATED | CURRENT_TASK-022 respected the scope lock; the same pattern is expected for CURRENT_TASK-023. |

**Overall Risk Posture:** LOW — the known open risks are phase-level residuals and do not block the authorized operational task.

---

## 9. Authorization Decision

**Decision:** **APPROVED**

CURRENT_TASK-023 is authorized to proceed under the governance of `CURRENT_PHASE.md` and `SYSTEM_RECOVERY_MASTER_PLAN.md`.

This approval is strictly limited to the operational work unit described below. It does not authorize architecture changes, production code modifications, schema changes, migration changes, CI changes, or any work outside the authorized scope.

---

## 10. Authorized Domain

**H8 — Disposals**

The 3 authorized RPCs are:

| # | RPC |
|---|---|
| 1 | `delete_disposal_with_restore` |
| 2 | `filter_disposals_rpc` |
| 3 | `get_disposal_auto_code` |

These RPCs are called by commerce-facing service code and complete the Milestone M4 commerce transaction coverage.

---

## 11. Authorized Wave

**Wave 3h**

Expected contribution: +3 covered RPCs, raising cumulative Phase 4 mock coverage from **80.3% (147/183)** to approximately **82.0% (150/183)**.

---

## 12. Authorized Scope

CURRENT_TASK-023 is authorized to:

- Add mock handlers in `tests/mocks/supabase.ts` for the 3 Domain H8 RPCs listed in Section 10.
- Derive return shapes and parameters from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern and established mock conventions.
- Produce evidence that the audit gate, type gate, and test gate remain green.

CURRENT_TASK-023 is **NOT** authorized to:

- Modify production service code, migrations, schema, or generated types.
- Modify the audit script or CI configuration.
- Create implementation reports, engineering kickoff documents, or subsequent CURRENT_TASKs.
- Expand beyond the 3 listed Domain H8 RPCs.

---

## 13. Next Step

The next step for the engineering team is to produce:

```text
CURRENT_TASK-023_ARCHITECTURE_DECISION.md
```

This document will define the implementation approach for the 3 authorized Domain H8 RPC mocks, confirm derivation from the canonical migration chain, and establish the acceptance criteria. No implementation may begin until the Architecture Decision is approved.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_022.md`, `CURRENT_TASK-022_ACCEPTANCE_REVIEW_v2.md`.*
