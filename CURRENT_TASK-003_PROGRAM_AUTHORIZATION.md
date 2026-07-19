# CURRENT_TASK-003 PROGRAM AUTHORIZATION

**Task ID:** CURRENT_TASK-003  
**Title:** Release Preparation - Non-Production Migration Validation and CLI Gates  
**Program:** VietSalePro v7 — Production Deployment Program  
**Phase:** Phase 2 — Release Preparation  
**Date:** 2026-07-19  
**Authority:** Program Manager / Architecture Authority  

---

## 1. Authorization Purpose

This artifact authorizes the start of Phase 2 technical validation for CURRENT_TASK-003.

This authorization is **not** a production deployment authorization. It permits only the non-production validation, CLI gate re-execution, and governance record-keeping described below.

---

## 2. Governance Basis

This authorization is based on the following governance artifacts and commit:

- `CURRENT_PHASE.md`
- `CURRENT_TASK.md`
- `PHASE_1_EXIT_GATE_REVIEW.md`
- `PHASE_2_RELEASE_PREPARATION_KICKOFF.md`
- `CURRENT_TASK-002_ACCEPTANCE.md`
- `CURRENT_TASK-002_PROGRAM_STATUS_REVIEW.md`
- `REPOSITORY_REBASELINE_ACCEPTANCE_REVIEW.md`
- commit `988f9074`

---

## 3. Authorized Scope

The following activities are authorized:

- Validate 2 repository-only migrations in a non-production environment:
  - `supabase/migrations/20260718000001_sp_7_1_set_tenant_subdomain.sql`
  - `supabase/migrations/20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql`
- Re-run local CLI gates if the local Supabase/Postgres environment is available:
  - `npx supabase migration list --local`
  - `npx supabase db lint`
- Review and confirm migration ordering/replay against a local or non-production database.
- Record results in the following artifacts:
  - `CURRENT_TASK-003_IMPLEMENTATION.md`
  - `CURRENT_TASK-003_VERIFICATION.md`
  - `CURRENT_TASK-003_ACCEPTANCE.md`

---

## 4. Explicitly Not Authorized

The following remain explicitly out of scope and are not authorized by this artifact:

- Production database changes.
- Production deployment.
- Production migration execution.
- Release tag creation.
- Force push.
- SQL body modification unless separately authorized.
- Supabase MCP execution unless separately authorized.
- Secret inspection or retrieval.

---

## 5. Known Observations Carried Into Task

| ID | Observation | Expected Disposition |
|---|---|---|
| M1 | Local Supabase/Postgres connectivity blocked prior CLI gates. | Re-run if environment is available, or formally disposition if still blocked. |
| M2 | 2 repository-only migrations have not been validated in non-production. | Validate before any production deployment approval. |

---

## 6. Acceptance Criteria

CURRENT_TASK-003 can be accepted only if:

1. The 2 repository-only migrations are validated in a non-production environment, or a blocker is formally documented.
2. CLI gates are re-run successfully, or M1 is formally dispositioned.
3. No Critical/High findings remain unresolved.
4. No production deployment or production migration occurred.
5. All findings are classified.
6. A next governance step is recommended.

---

## 7. Authorization Decision

```text
CURRENT_TASK-003:

AUTHORIZED WITH CONDITIONS
```

### Conditions

- Work must remain non-production.
- No release or deployment is authorized.
- SQL body changes require separate remediation authorization.
- Results must be captured in implementation and verification artifacts.

---

## 8. Approval Table

| Role | Name | Signature | Date |
|---|---|---|---|
| Program Manager | Project Owner | Approved | 2026-07-19 |
| Architecture Authority | Project Owner | Approved | 2026-07-19 |

---

## 9. Next Authorized Step

```text
CURRENT_TASK-003_IMPLEMENTATION.md
```
