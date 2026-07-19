# RELEASE CANDIDATE PREPARATION

**Program:** VietSalePro v7 — Production Deployment Program  
**Phase:** Phase 2 — Release Preparation  
**Date:** 2026-07-19  
**Document Type:** Release Candidate Preparation  
**Authority:** Release Manager / Program Manager / Architecture Authority  
**Frozen Commit:** `8b6ad12f100eb92e13939167fdf6d792c1c13a54`  
**Candidate ID:** `RC-2026-07-19-01`

---

## 1. Purpose

This artifact prepares the Release Candidate package for `RC-2026-07-19-01` based on the frozen commit `8b6ad12f100eb92e13939167fdf6d792c1c13a54`.

This document explicitly:

- Does **not** create a release tag.
- Does **not** authorize a production deployment.
- Does **not** authorize execution of production database migrations.

---

## 2. Governance Basis

This preparation is based on the following governance artifacts and commit:

- `DEPLOYMENT_FREEZE_REVIEW.md`
- `CURRENT_TASK-003_ACCEPTANCE.md`
- `CURRENT_TASK-003_VERIFICATION.md`
- `CURRENT_TASK-003_IMPLEMENTATION.md`
- `PHASE_2_RELEASE_PREPARATION_KICKOFF.md`
- `REPOSITORY_REBASELINE_ACCEPTANCE_REVIEW.md`
- Frozen commit `8b6ad12f100eb92e13939167fdf6d792c1c13a54`

---

## 3. Release Candidate Identity

| Field | Value |
|---|---|
| Candidate ID | `RC-2026-07-19-01` |
| Frozen Commit | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` |
| Branch | `master` |
| Repository State | `HEAD` at `8b6ad12f...`; `origin/master` at `61e8c73f...` (alignment pending) |
| Tag Created | No |
| Production Deployment Authorized | No |
| Production Migration Authorized | No |

---

## 4. Candidate Scope

This release candidate includes:

- The canonical migration chain established after Repository Re-baseline.
- Governance artifacts through `CURRENT_TASK-003` acceptance.
- The `DEPLOYMENT_FREEZE_REVIEW.md` decision.
- Two repository-only migrations replay-validated in the local shadow database:
  - `supabase/migrations/20260718000001_sp_7_1_set_tenant_subdomain.sql`
  - `supabase/migrations/20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql`

---

## 5. Candidate Evidence

| Evidence | Result | Source |
|---|---|---|
| Repository re-baseline accepted | PASS | `REPOSITORY_REBASELINE_ACCEPTANCE_REVIEW.md` |
| Task 003 accepted | PASS | `CURRENT_TASK-003_ACCEPTANCE.md` |
| Deployment freeze approved | PASS | `DEPLOYMENT_FREEZE_REVIEW.md` |
| Critical/High findings | PASS | None open |
| M2 replay validation | PASS | `CURRENT_TASK-003_VERIFICATION.md` |
| M1 local CLI connectivity | OBSERVATION | Remains open |
| Production safety | PASS | No production DB/deploy/release tag/SQL body change |

---

## 6. Remaining Observations / Risks

| ID | Observation | Status | Impact | Required Follow-up |
|---|---|---|---|---|
| M1 | Local Supabase/Postgres connectivity blocked local CLI gates and final diff connection. | Open | Does not block RC preparation; must be tracked before production cutover. | Re-run or formally disposition in release governance. |

**Note:** M1 must not be silently dropped before production cutover planning.

---

## 7. Release Candidate Decision

```text
RELEASE CANDIDATE PREPARATION:

RC-2026-07-19-01 PREPARED WITH OBSERVATIONS
```

---

## 8. Explicitly Not Authorized

This artifact does **not** authorize:

- Production deployment.
- Production database migration execution.
- Release tag creation.
- Secret inspection.
- Supabase MCP execution.
- SQL body changes.
- Production cutover.

---

## 9. Approval Table

| Role | Name | Signature | Date |
|---|---|---|---|
| Release Manager | Project Owner | Approved | 2026-07-19 |
| Program Manager | Project Owner | Approved | 2026-07-19 |
| Architecture Authority | Project Owner | Approved | 2026-07-19 |

---

## 10. Next Governance Step

Recommended next artifact:

```text
PRODUCTION_DEPLOYMENT_PACKAGE.md
```

Purpose:

- Assemble the formal production deployment package.
- Include the frozen commit, RC ID, migration baseline, rollback references, and observation M1.
- Still no production deployment.
