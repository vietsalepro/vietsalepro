# FINAL GOVERNANCE BASELINE

**Program:** VietSalePro v7 — Production Deployment Program  
**Document Type:** Single Source of Truth — Operational Baseline  
**RC ID:** `RC-2026-07-19-01`  
**Date:** 2026-07-19  
**Authority:** Project Owner (sole governance authority)  

---

## 1. Core Baseline Values

| Field | Value |
|---|---|
| RC ID | `RC-2026-07-19-01` |
| Frozen Commit | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` |
| Branch | `master` |
| `HEAD` | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` |
| `origin/master` | `61e8c73f4b156021d49177fb6b60506d2e2d8e2a` |
| Repository Sync | **FAIL** — `origin/master` is one commit ahead of the frozen commit and must be reset/aligned to `8b6ad12f...` before execution |
| Release Tag | `v7.0.0-rc2` (designated, **not yet created**) at `8b6ad12f...` |
| Previous Release Tag | `v7.0.0-rc1` (currently at `61e8c73f...`; drifted from intended retired commit `04d41a47...`) |
| Rollback Tag | `pre-rebaseline-2026-07-19` at `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` |
| Repository Status | Local `HEAD` is at the frozen commit; `origin/master` is not aligned; working tree contains expected governance artifacts (modified tracked files and untracked governance documents); no source code, migration, Edge Function, storage/auth, or environment changes |
| Authorization Status | `PRODUCTION_EXECUTION_AUTHORIZATION.md` = **NOT AUTHORIZED**; `RELEASE_APPROVAL_RECORD.md` = **PENDING** |
| Deployment Status | **Not started** — no production deployment wave has executed |
| Production Status | **No production systems modified** — no database, Edge Function, storage, authentication, or Vercel production changes |

---

## 2. Decision Registry

| Decision | Value | Authorizing Document |
|---|---|---|
| Release tag decision | **Option B — adopt `v7.0.0-rc2`** at `8b6ad12f...` | `RELEASE_TAG_REBASELINE_REPORT.md`; this baseline |
| `v7.0.0-rc1` disposition | Retained as historical audit artifact at its current resolved commit (`61e8c73f...`); not moved or deleted | `RELEASE_TAG_REBASELINE_REPORT.md`; this baseline |
| Production execution | **NOT AUTHORIZED** until `origin/master` is aligned to `8b6ad12f...` and `v7.0.0-rc2` is created | `PRODUCTION_EXECUTION_AUTHORIZATION.md` |
| Release approval | **PENDING** until `origin/master` alignment and `v7.0.0-rc2` creation are verified | `RELEASE_APPROVAL_RECORD.md` |
| Single-owner release | **NOT AUTHORIZED** / `NO-GO` | `SINGLE_OWNER_RELEASE_AUTHORIZATION.md` |

---

## 3. Current Active Governance Chain

Every active artifact in the chain now references the same `RC-2026-07-19-01`, frozen commit `8b6ad12f...`, and designated release tag `v7.0.0-rc2`. The repository sync state is consistently recorded as `FAIL` / pending alignment.

1. `PHASE_1_EXIT_GATE_REVIEW.md` — historical closeout, reviewed
2. `PHASE_2_RELEASE_PREPARATION_KICKOFF.md` — historical kickoff, reviewed
3. `CURRENT_TASK-003_PROGRAM_AUTHORIZATION.md` — authorized (historical task)
4. `CURRENT_TASK-003_IMPLEMENTATION.md` — completed (historical task)
5. `CURRENT_TASK-003_VERIFICATION.md` — completed (historical task)
6. `CURRENT_TASK-003_ACCEPTANCE.md` — completed (historical task)
7. `REPOSITORY_REBASELINE_ACCEPTANCE_REVIEW.md` — accepted (historical re-baseline)
8. `RELEASE_CANDIDATE_REBASELINE_AUTHORIZATION.md` — `PASS WITH OBSERVATIONS` (new frozen baseline `8b6ad...` approved; `v7.0.0-rc2` recommended)
9. `REBASELINE_CHANGE_LOG.md` — records baseline updates
10. `RELEASE_TAG_REBASELINE_REPORT.md` — recommends `v7.0.0-rc2` at `8b6ad...`; documents `v7.0.0-rc1` current location
11. `DEPLOYMENT_FREEZE_REVIEW.md` — freeze approved at `8b6ad...` with observations (origin/master not aligned)
12. `RELEASE_CANDIDATE_PREPARATION.md` — prepared with observations (sync pending)
13. `PRODUCTION_DEPLOYMENT_PACKAGE.md` — assembled with observations (sync pending)
14. `DEPLOYMENT_DRY_RUN_PLAN.md` — dry run plan ready with observations (sync pending)
15. `PRODUCTION_CUTOVER_PLAN.md` — ready with observations (sync pending)
16. `PHASE_2_EXIT_GATE_REVIEW.md` — `PASS WITH OBSERVATIONS` (sync FAIL)
17. `PHASE_3_OPENING_AUTHORIZATION.md` — `AUTHORIZED WITH OBSERVATIONS` (Phase 3 governance planning only; origin/master alignment pending)
18. `REPOSITORY_BASELINE_VERIFICATION.md` — `PASS WITH OBSERVATIONS` (HEAD at frozen; origin/master and tag pending)
19. `SINGLE_OWNER_RELEASE_AUTHORIZATION.md` — `NOT AUTHORIZED` / `NO-GO`
20. `RELEASE_APPROVAL_RECORD.md` — `PENDING`
21. `PRODUCTION_EXECUTION_AUTHORIZATION.md` — `NOT AUTHORIZED`

---

## 4. Superseded / Historical Governance Documents

The following documents record past events and are not part of the active operational baseline. Their original frozen commit references are intentionally preserved.

- `PRODUCTION_EXECUTION_REPORT.md` — aborted cutover evidence against the retired baseline
- `RELEASE_TAG_VERIFICATION.md` — original tag verification against `04d41a47...`
- `RELEASE_TAG_EXECUTION_REPORT.md` — original tag execution against `04d41a47...`
- `M1_CLOSURE_VERIFICATION.md` — M1 closure evidence against the retired baseline
- `M1_ROOT_CAUSE_ANALYSIS.md` — M1 root cause against the retired baseline
- `POST_DEPLOYMENT_VERIFICATION.md` — marked `Historical Record — Superseded`
- `PRODUCTION_ACCEPTANCE_REVIEW.md` — marked `Historical Record — Superseded`

---

## 5. Pending Mechanical Actions Before Re-Authorization

The following actions must be completed and re-verified before `PRODUCTION_EXECUTION_AUTHORIZATION.md` can be re-issued:

1. Reset or align `origin/master` to `8b6ad12f100eb92e13939167fdf6d792c1c13a54`.
2. Create and push the `v7.0.0-rc2` tag at `8b6ad12f100eb92e13939167fdf6d792c1c13a54`.
3. Re-run `REPOSITORY_BASELINE_VERIFICATION.md` and confirm `HEAD == origin/master == 8b6ad12f...` and `v7.0.0-rc2` is present.
4. Re-issue `RELEASE_APPROVAL_RECORD.md` and `SINGLE_OWNER_RELEASE_AUTHORIZATION.md` once the above pass.
5. Re-issue `PRODUCTION_EXECUTION_AUTHORIZATION.md` only after the release approval and single-owner authorization are granted.

---

## 6. Exclusions

This reconciliation explicitly did **not**:

- Modify source code, database schemas, migrations, Edge Functions, storage, authentication, or Vercel configuration.
- Create, move, delete, or push any Git tag.
- Push commits, rewrite history, reset branches, or modify `origin/master`.
- Execute any production deployment, migration, or infrastructure change.

---

## 7. Related Artifacts

- `GOVERNANCE_RECONCILIATION_REPORT.md` — full inconsistency and resolution narrative
- `GOVERNANCE_RECONCILIATION_CHANGE_LOG.md` — detailed change list
- `FINAL_GOVERNANCE_BASELINE.md` — this document

---

*This is the single authoritative governance baseline for RC-2026-07-19-01. Any future production activity must reference this document and the values above.*
