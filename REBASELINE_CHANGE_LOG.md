# REBASELINE CHANGE LOG

**Program:** VietSalePro v7 — Production Deployment Program  
**RC ID:** `RC-2026-07-19-01`  
**Previous Frozen Commit:** `04d41a474d63337f933f33ddd9185fb0d596fab5`  
**New Frozen Commit:** `8b6ad12f100eb92e13939167fdf6d792c1c13a54`  
**Date:** 2026-07-19  
**Authority:** Project Owner (sole governance authority)  

---

## 1. Governance Documents Updated

The following governance documents had their frozen baseline references updated to the new frozen commit `8b6ad12f100eb92e13939167fdf6d792c1c13a54`.

| Document | Field(s) Updated | Old Value | New Value | Reason |
|---|---|---|---|---|
| `PRODUCTION_EXECUTION_AUTHORIZATION.md` | `Frozen Commit` header, repository baseline table | `04d41a474d63337f933f33ddd9185fb0d596fab5` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` | Frozen baseline rebaseline |
| `RELEASE_APPROVAL_RECORD.md` | `Frozen Commit` header, frozen commit field, preconditions | `04d41a474d63337f933f33ddd9185fb0d596fab5`; `04d41a47` (precondition) | `8b6ad12f100eb92e13939167fdf6d792c1c13a54`; `8b6ad12f` | Frozen baseline rebaseline |
| `SINGLE_OWNER_RELEASE_AUTHORIZATION.md` | `Frozen Commit` header, repository verification table | `04d41a474d63337f933f33ddd9185fb0d596fab5` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` | Frozen baseline rebaseline |
| `PRODUCTION_CUTOVER_PLAN.md` | `Frozen Commit` header, repository baseline table, B1 checklist, assumption | `04d41a474d63337f933f33ddd9185fb0d596fab5`; `04d41a47...` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54`; `8b6ad12f...` | Frozen baseline rebaseline |
| `POST_DEPLOYMENT_VERIFICATION.md` | `Frozen Commit` header | `04d41a474d63337f933f33ddd9185fb0d596fab5` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` | Frozen baseline rebaseline |
| `PRODUCTION_ACCEPTANCE_REVIEW.md` | `Frozen Commit` header | `04d41a474d63337f933f33ddd9185fb0d596fab5` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` | Frozen baseline rebaseline |
| `DEPLOYMENT_FREEZE_REVIEW.md` | `Freeze Target Commit`, governance basis, freeze target, sync evidence | `04d41a474d63337f933f33ddd9185fb0d596fab5`; `04d41a47...` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54`; `8b6ad12f...` | Frozen baseline rebaseline |
| `PHASE_3_OPENING_AUTHORIZATION.md` | `Frozen Commit` header, repository baseline table, entry criteria | `04d41a474d63337f933f33ddd9185fb0d596fab5`; `04d41a47...` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54`; `8b6ad12f...` | Frozen baseline rebaseline |
| `PHASE_2_EXIT_GATE_REVIEW.md` | `Frozen Commit` header, repository baseline review | `04d41a474d63337f933f33ddd9185fb0d596fab5`; `04d41a47...` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54`; `8b6ad12f...` | Frozen baseline rebaseline |
| `PRODUCTION_MAINTENANCE_WINDOW_VERIFICATION.md` | `Frozen Commit` header | `04d41a474d63337f933f33ddd9185fb0d596fab5` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` | Frozen baseline rebaseline |
| `PRODUCTION_MAINTENANCE_WINDOW_PLAN.md` | `Frozen Commit` header | `04d41a474d63337f933f33ddd9185fb0d596fab5` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` | Frozen baseline rebaseline |
| `DEPLOYMENT_DRY_RUN_PLAN.md` | `Frozen Commit` header, repository baseline table, assumptions, preconditions | `04d41a474d63337f933f33ddd9185fb0d596fab5`; `04d41a47...` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54`; `8b6ad12f...` | Frozen baseline rebaseline |
| `PRODUCTION_DEPLOYMENT_PACKAGE.md` | `Frozen Commit` header, package purpose, governance basis, identity table, basis list | `04d41a474d63337f933f33ddd9185fb0d596fab5` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` | Frozen baseline rebaseline |
| `RELEASE_CANDIDATE_PREPARATION.md` | `Frozen Commit` header, purpose, governance basis, identity table | `04d41a474d63337f933f33ddd9185fb0d596fab5` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` | Frozen baseline rebaseline |

---

## 2. Historical Governance Documents Retained (Not Updated)

The following documents record past events against the retired frozen commit `04d41a474d63337f933f33ddd9185fb0d596fab5`. They are retained as audit history and marked superseded by this change log. Their original frozen commit references are intentionally preserved.

| Document | Status | Superseded By | Reason |
|---|---|---|---|
| `PRODUCTION_EXECUTION_REPORT.md` | Superseded | `RELEASE_CANDIDATE_REBASELINE_AUTHORIZATION.md` | Historical record of the aborted cutover; old frozen commit remains valid for that event. |
| `RELEASE_TAG_VERIFICATION.md` | Superseded | `RELEASE_TAG_REBASELINE_REPORT.md` | Historical tag verification against the retired commit. |
| `RELEASE_TAG_EXECUTION_REPORT.md` | Superseded | `RELEASE_TAG_REBASELINE_REPORT.md` | Historical tag execution report against the retired commit. |
| `M1_CLOSURE_VERIFICATION.md` | Superseded | `RELEASE_CANDIDATE_REBASELINE_AUTHORIZATION.md` | M1 closure evidence collected against the retired commit. |
| `M1_ROOT_CAUSE_ANALYSIS.md` | Superseded | `RELEASE_CANDIDATE_REBASELINE_AUTHORIZATION.md` | M1 root cause record against the retired commit. |

---

## 3. Old Baseline Retirement

| Field | Value |
|---|---|
| Old Frozen Commit | `04d41a474d63337f933f33ddd9185fb0d596fab5` |
| Status | **Superseded** |
| Superseded By | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` |
| New Frozen Commit | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` |
| Reason | Active checkout advanced beyond the approved frozen baseline, causing the production cutover to be aborted before any wave executed. The new commit is a direct descendant and is now the approved release candidate baseline. |
| Date | 2026-07-19 |
| Authority | Project Owner (sole governance authority) |

---

*No production deployment, database change, migration execution, Edge Function deployment, storage/auth reconfiguration, or Vercel deployment was performed by this rebaseline.*
