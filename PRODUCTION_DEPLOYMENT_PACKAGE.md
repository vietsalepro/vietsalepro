# PRODUCTION DEPLOYMENT PACKAGE

**Program:** VietSalePro v7 — Production Deployment Program  
**Phase:** Phase 2 — Release Preparation  
**Date:** 2026-07-19  
**Document Type:** Production Deployment Package  
**Authority:** Deployment Manager / Release Manager / Program Manager  
**RC ID:** `RC-2026-07-19-01`  
**Frozen Commit:** `8b6ad12f100eb92e13939167fdf6d792c1c13a54`  

---

## 1. Package Purpose

This artifact assembles the production deployment package evidence for `RC-2026-07-19-01` based on the frozen commit `8b6ad12f100eb92e13939167fdf6d792c1c13a54`.

This document explicitly:

- Assembles deployment package evidence.
- Is **not** deployment approval.
- Is **not** release tag creation.
- Is **not** production migration execution.

---

## 2. Governance Basis

This package is based on the following governance artifacts and commit:

- `DEPLOYMENT_FREEZE_REVIEW.md`
- `RELEASE_CANDIDATE_PREPARATION.md`
- `CURRENT_TASK-003_ACCEPTANCE.md`
- `CURRENT_TASK-003_VERIFICATION.md`
- `REPOSITORY_REBASELINE_ACCEPTANCE_REVIEW.md`
- `MIGRATION_VERSION_ALIASES.md`
- `archive/supabase/non_canonical_migrations/INDEX.md`
- Frozen commit `8b6ad12f100eb92e13939167fdf6d792c1c13a54`

---

## 3. Deployment Package Identity

| Field | Value |
|---|---|
| RC ID | `RC-2026-07-19-01` |
| Frozen Commit | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` |
| Branch | `master` |
| Repository Sync | `HEAD` (`8b6ad12f...`) != `origin/master` (`61e8c73f...`); alignment pending |
| Canonical Migration Count | `138` |
| Archived Non-Canonical Migration Count | `17` |
| Release Tag Created | No |
| Production Deployment Authorized | No |
| Production Migration Authorized | No |

---

## 4. Migration Baseline

- Canonical migration directory:
  ```text
  supabase/migrations/
  ```
- Canonical migration count:
  ```text
  138
  ```
- Archived non-canonical migration directory:
  ```text
  archive/supabase/non_canonical_migrations/
  ```
- Archived non-canonical migration count:
  ```text
  17
  ```
- Alias register:
  ```text
  MIGRATION_VERSION_ALIASES.md
  ```
- Archive index:
  ```text
  archive/supabase/non_canonical_migrations/INDEX.md
  ```

---

## 5. Repository-Only Migrations Included

```text
supabase/migrations/20260718000001_sp_7_1_set_tenant_subdomain.sql
supabase/migrations/20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql
```

- Both files exist.
- Both replayed successfully in shadow replay per `CURRENT_TASK-003_VERIFICATION.md`.
- No SQL body changes were made during Task 003.

---

## 6. Rollback References

- Re-baseline rollback tag:
  ```text
  pre-rebaseline-2026-07-19
  ```
- Baseline commit:
  ```text
  6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c
  ```
- Frozen deployment candidate commit:
  ```text
  8b6ad12f100eb92e13939167fdf6d792c1c13a54
  ```

---

## 7. Evidence Checklist

| Evidence | Result | Source |
|---|---|---|
| Repository re-baseline accepted | PASS | `REPOSITORY_REBASELINE_ACCEPTANCE_REVIEW.md` |
| Task 003 accepted | PASS | `CURRENT_TASK-003_ACCEPTANCE.md` |
| Deployment freeze approved | PASS | `DEPLOYMENT_FREEZE_REVIEW.md` |
| RC prepared | PASS | `RELEASE_CANDIDATE_PREPARATION.md` |
| Canonical migration count | PASS | `138` |
| Archived migration count | PASS | `17` |
| M2 replay validation | PASS | `CURRENT_TASK-003_VERIFICATION.md` |
| Critical/High findings | PASS | None open |
| M1 local CLI connectivity | OBSERVATION | Remains open |
| Production safety | PASS | No production DB/deploy/release tag |

---

## 8. Remaining Observations / Risks

| ID | Observation | Status | Impact | Required Follow-up |
|---|---|---|---|---|
| M1 | Local Supabase/Postgres connectivity blocked local CLI gates and final diff connection. | Open | Does not block package assembly; must be dispositioned before production cutover. | Re-run or formally disposition before production cutover approval. |

---

## 9. Explicitly Not Authorized

This artifact does not authorize:

- Production deployment.
- Production database migration execution.
- Release tag creation.
- Production cutover.
- Secret inspection.
- Supabase MCP execution.
- SQL body changes.

---

## 10. Package Decision

```text
PRODUCTION DEPLOYMENT PACKAGE:

ASSEMBLED WITH OBSERVATIONS
```

---

## 11. Approval Table

| Role | Name | Signature | Date |
|---|---|---|---|
| Deployment Manager | Project Owner | Approved | 2026-07-19 |
| Release Manager | Project Owner | Approved | 2026-07-19 |
| Program Manager | Project Owner | Approved | 2026-07-19 |

---

## 12. Next Governance Step

Recommended next artifact:

```text
DEPLOYMENT_DRY_RUN_PLAN.md
```

Purpose:

- Plan a dry run of the deployment sequence.
- Still no production deployment.
- Carry forward M1.
- Define rollback trigger checks and execution order.

---

*Basis: `DEPLOYMENT_FREEZE_REVIEW.md`; `RELEASE_CANDIDATE_PREPARATION.md`; `CURRENT_TASK-003_ACCEPTANCE.md`; `CURRENT_TASK-003_VERIFICATION.md`; `REPOSITORY_REBASELINE_ACCEPTANCE_REVIEW.md`; `MIGRATION_VERSION_ALIASES.md`; `archive/supabase/non_canonical_migrations/INDEX.md`; commit `8b6ad12f100eb92e13939167fdf6d792c1c13a54`.*
