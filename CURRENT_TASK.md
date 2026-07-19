# CURRENT_TASK.md

**Task ID:** CURRENT_TASK-003  
**Title:** Release Preparation - Non-Production Migration Validation and CLI Gates  
**Program:** Production Deployment Program  
**Milestone:** M2  
**Phase:** Phase 2 - Release Preparation  
**Status:** READY FOR AUTHORIZATION  
**Date:** 2026-07-19  
**Document Type:** Operational governance task

---

## 1. Objective

Start Phase 2 release preparation by validating the repository-only migrations and closing the remaining local CLI gate observation from Repository Re-baseline.

This task follows:

- `REPOSITORY_REBASELINE_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-002_ACCEPTANCE.md`
- `CURRENT_TASK-002_PROGRAM_STATUS_REVIEW.md`
- `PHASE_1_EXIT_GATE_REVIEW.md`
- `PHASE_2_RELEASE_PREPARATION_KICKOFF.md`

---

## 2. Scope

### 2.1 In Scope

- Validate the 2 repository-only migrations in a non-production environment:
  - `supabase/migrations/20260718000001_sp_7_1_set_tenant_subdomain.sql`
  - `supabase/migrations/20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql`
- Re-run local CLI gates once the local Supabase/Postgres environment is available:
  - `npx supabase migration list --local`
  - `npx supabase db lint`
- Confirm the accepted canonical migration chain remains intact after the re-baseline commit.
- Record results in a CURRENT_TASK-003 implementation and verification artifact.

### 2.2 Out of Scope

- Production database migration execution.
- Production deployment or release.
- Release tag creation.
- Production cutover.
- Supabase MCP execution unless separately authorized.
- SQL body modification unless a separate remediation is authorized.
- Commit or push of unrelated files.

---

## 3. Background

Repository Re-baseline was accepted with observations. The remaining observations are:

| ID | Observation | Disposition |
|---|---|---|
| M1 | Local Supabase/Postgres connectivity prevented `npx supabase migration list --local` and `npx supabase db lint` from completing. | Resolve or disposition during Phase 2. |
| M2 | 2 repository-only migrations have not yet been validated in a non-production environment. | Validate before any production deployment approval. |

---

## 4. Deliverables

| # | Deliverable | Purpose | Acceptance Authority |
|---|---|---|---|
| D-1 | `CURRENT_TASK-003_PROGRAM_AUTHORIZATION.md` | Authorizes the Phase 2 validation task | Program Manager / Architecture Authority |
| D-2 | `CURRENT_TASK-003_IMPLEMENTATION.md` | Records non-production validation and CLI gate execution | Engineering Implementation Authority |
| D-3 | `CURRENT_TASK-003_VERIFICATION.md` | Independently verifies results and findings | Independent Verification Authority |
| D-4 | `CURRENT_TASK-003_ACCEPTANCE.md` | Accepts or rejects the task outcome | Program Manager / Architecture Authority |

---

## 5. Acceptance Criteria

1. The 2 repository-only migrations are validated in a non-production environment, or a blocker is formally recorded.
2. Local CLI gates are re-run, or M1 is formally dispositioned with evidence.
3. No production database changes are performed.
4. No production deployment is performed.
5. No migration SQL body is modified without separate authorization.
6. Findings are classified as Critical, High, Medium, or Low.
7. A recommendation is made for the next release governance step.

---

## 6. Constraints

- Phase 2 validation must stay non-production unless a separate production authorization is issued.
- Deployment freeze, Release Candidate, production release, tagging, and cutover are separate governance activities.
- Existing user or agent changes outside this task must not be reverted.
- The repository baseline commit for re-baseline remains `fb398ce3`.

---

## 7. Next Required Action

Create and review:

```text
CURRENT_TASK-003_PROGRAM_AUTHORIZATION.md
```

No Phase 2 technical validation may begin until CURRENT_TASK-003 is explicitly authorized.

---

## 8. Current Task Decision

```text
CURRENT_TASK-003:

READY FOR AUTHORIZATION
```

---

*Basis: `PHASE_2_RELEASE_PREPARATION_KICKOFF.md`; `PHASE_1_EXIT_GATE_REVIEW.md`; commit `fb398ce3`.*
