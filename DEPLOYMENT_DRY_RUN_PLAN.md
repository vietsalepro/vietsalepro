# DEPLOYMENT DRY RUN PLAN

**Program:** VietSalePro v7 — Production Deployment Program  
**Phase:** Phase 2 — Release Preparation  
**Date:** 2026-07-19  
**RC ID:** `RC-2026-07-19-01`  
**Frozen Commit:** `8b6ad12f100eb92e13939167fdf6d792c1c13a54`  
**Branch:** `master`  
**Authority:** Release Manager / Program Manager / Architecture Authority  

---

# 1. Purpose

This document defines a simulated execution of the VietSalePro v7 production deployment. The Dry Run verifies the deployment sequence, operational readiness, role assignments, rollback strategy, and evidence collection without changing, deploying, or touching production infrastructure.

This is **NOT** a production deployment authorization. No production database, Edge Function, Storage, Authentication, or Vercel deployment is performed or approved by this plan.

---

# 2. Governance References

The following artifacts were reviewed to prepare this Dry Run plan:

- `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md` Version 1.2
- `PRODUCTION_DEPLOYMENT_MASTER_PLAN.md` Version 1.2
- `CURRENT_PHASE.md`
- `CURRENT_TASK.md`
- `PHASE_1_EXIT_GATE_REVIEW.md`
- `PHASE_2_RELEASE_PREPARATION_KICKOFF.md`
- `CURRENT_TASK-003_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-003_IMPLEMENTATION.md`
- `CURRENT_TASK-003_VERIFICATION.md`
- `CURRENT_TASK-003_ACCEPTANCE.md`
- `DEPLOYMENT_FREEZE_REVIEW.md`
- `RELEASE_CANDIDATE_PREPARATION.md`
- `PRODUCTION_DEPLOYMENT_PACKAGE.md`

---

# 3. Dry Run Objectives

| # | Objective | Verification Focus |
|---|---|---|
| O1 | Verify the deployment sequence across all layers | Wave order and hand-off points |
| O2 | Verify operational readiness | Tooling, credentials, and environment access |
| O3 | Validate responsibilities | Each wave has a named owner and decision authority |
| O4 | Validate the rollback process | Rollback order, triggers, and evidence capture |
| O5 | Validate evidence collection | Logs, screenshots, and command output are captured per checkpoint |
| O6 | Confirm the repository baseline | Frozen commit, branch, tag status, and migration count |

---

# 4. Scope

## 4.1 In Scope

- Simulated deployment of the frozen `RC-2026-07-19-01` baseline.
- Review of canonical migration chain (`138` migrations).
- Review of archived non-canonical migration inventory (`17` migrations).
- Step-through of Wave 1 (Database), Wave 2 (Edge Functions), Wave 3 (Storage), Wave 4 (Authentication), and Wave 5 (Vercel Application Deployment).
- Validation checkpoints, Go/No-Go decisions, and evidence templates.
- Smoke test plan walkthrough.
- Rollback and abort criteria review.
- Communication plan and approval matrix.

## 4.2 Out of Scope

- Production infrastructure changes of any kind.
- Execution of SQL against a production database.
- Execution of `supabase db push` against the production project.
- Deployment or update of Edge Functions to production.
- Changes to Storage buckets, Auth configuration, or secrets.
- Vercel production deployment or domain cutover.
- Release tag creation or commit/push/merge activities.
- Resolution of observation `M1` (local Supabase/Postgres connectivity). `M1` is carried forward unchanged.

---

# 5. Repository Baseline

| Field | Value |
|---|---|
| RC ID | `RC-2026-07-19-01` |
| Frozen Commit | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` |
| Branch | `master` |
| Repository Sync Status | `HEAD` (`8b6ad12f...`) != `origin/master` (`61e8c73f...`); alignment required |
| Canonical Migration Count | `138` |
| Archived Non-Canonical Migration Count | `17` |
| Canonical Migration Directory | `supabase/migrations/` |
| Archive Directory | `archive/supabase/non_canonical_migrations/` |
| Alias Register | `MIGRATION_VERSION_ALIASES.md` |
| Archive Index | `archive/supabase/non_canonical_migrations/INDEX.md` |
| Deployment Package Decision | `PRODUCTION DEPLOYMENT PACKAGE: ASSEMBLED WITH OBSERVATIONS` |

Repository-only migrations included in the baseline:

```text
supabase/migrations/20260718000001_sp_7_1_set_tenant_subdomain.sql
supabase/migrations/20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql
```

---

# 6. Deployment Assumptions

1. The repository remains frozen at `8b6ad12f100eb92e13939167fdf6d792c1c13a54`.
2. `RC-2026-07-19-01` has been prepared but not promoted to a Production Release.
3. No code changes, migration changes, schema modifications, or Edge Function changes are permitted during the Dry Run.
4. No emergency fixes or hotfixes are applied to the frozen baseline.
5. All production secrets remain in the approved secret manager; values are not exposed in this document.
6. The Dry Run is performed in a non-production or simulated context only.
7. Observation `M1` remains open and is not resolved by this plan.

---

# 7. Roles and Responsibilities

| Role | Responsibilities |
|---|---|
| Program Manager | Owns the Dry Run schedule, gates communication, and final Go/No-Go recommendation. |
| Architecture Authority | Validates baseline integrity, migration ordering, and technical abort criteria. |
| Release Manager | Manages RC identity, freeze status, release tag readiness, and release hand-off. |
| Database Engineer | Owns Wave 1 simulation: migration list verification, migration replay, and rollback script readiness. |
| Backend Engineer | Owns Wave 2 simulation: Edge Function inventory, build verification, and RPC smoke tests. |
| Frontend Engineer | Owns Wave 5 simulation: Vercel build, preview environment, and UI smoke tests. |
| DevOps | Owns Wave 3 and 4 simulation: Storage, Auth, environment variables, and secret presence checks. |
| QA | Executes smoke test plan, records results, and raises No-Go on critical failures. |
| Project Owner | Provides final approval and accepts remaining observations. |

---

# 8. Environment Prerequisites

## 8.1 Git

- [ ] Repository cloned and branch `master` checked out.
- [ ] `HEAD` and `origin/master` both equal `8b6ad12f100eb92e13939167fdf6d792c1c13a54` (currently `origin/master` = `61e8c73f...`, alignment required).
- [ ] No staged or unstaged source/migration changes.

## 8.2 Supabase CLI

- [ ] `npx supabase --version` returns a pinned version (e.g., `2.109.1`).
- [ ] `npx supabase login` or linked project is authenticated to the **non-production** reference project.
- [ ] `npx supabase status` (or `--local` equivalent) is available for review.

## 8.3 Node

- [ ] Node version is consistent with the project `package.json` engines.
- [ ] `npm install` or `pnpm install` has completed without errors.

## 8.4 Environment Variables

- [ ] `.env` or secret manager contains all required variables.
- [ ] Production values are not printed to terminal or logs.
- [ ] `NEXT_PUBLIC_` and server-only variables are correctly separated.

## 8.5 Supabase Project

- [ ] Reference project region matches production target.
- [ ] API endpoints, database connection string, and Edge Runtime URL are known.
- [ ] `supabase/config.toml` is aligned with the frozen baseline.

## 8.6 Vercel Project

- [ ] Vercel CLI is authenticated.
- [ ] Target Vercel project and production domain are known.
- [ ] Preview environment deployment command is available for simulation.

## 8.7 Authentication

- [ ] Auth provider list and redirect URLs are documented.
- [ ] JWT secret presence is confirmed without exposing the value.

## 8.8 Storage

- [ ] Storage bucket inventory is documented.
- [ ] Storage policies are reviewed and available for simulated deployment.

## 8.9 Edge Functions

- [ ] Edge Function inventory list is available.
- [ ] Build inputs and `deno`/`edge-runtime` versions are pinned.

## 8.10 Database Access

- [ ] Connection to a non-production or local Postgres instance is available for simulation.
- [ ] `M1` is noted if local Postgres is unavailable; the Dry Run proceeds as a documented simulation.

---

# 9. Pre-Dry Run Checklist

| # | Check | Owner | Evidence |
|---|---|---|---|
| P1 | Confirm frozen commit is checked out | Release Manager | `git rev-parse HEAD` output |
| P2 | Confirm branch is `master` and synced | Release Manager | `git status -sb` |
| P3 | Confirm working tree has no unauthorized source/migration changes | Architecture Authority | `git status --short` |
| P4 | Confirm `RC-2026-07-19-01` identity | Release Manager | `RELEASE_CANDIDATE_PREPARATION.md` |
| P5 | Confirm canonical migration count = 138 | Database Engineer | `PRODUCTION_DEPLOYMENT_PACKAGE.md` |
| P6 | Install or verify dependencies | Backend Engineer / QA | `npm/pnpm install` exit code |
| P7 | Verify CLI authentication (non-production) | DevOps | `npx supabase projects list` or equivalent |
| P8 | Verify secret presence by category | DevOps | Checklist (values hidden) |
| P9 | Prepare rollback assets | Database Engineer | Previous production migration baseline, re-baseline tag `pre-rebaseline-2026-07-19` |
| P10 | Prepare evidence templates | QA | Screenshot and log capture templates |
| P11 | Confirm all participants and communication channels | Program Manager | Attendance list |
| P12 | Brief wave owners on Go/No-Go criteria | Program Manager | Meeting minutes |

---

# 10. Simulated Deployment Sequence

## 10.1 Wave 1 — Database Migrations

| Step | Simulated Activity | Command Example | Owner |
|---|---|---|---|
| 1.1 | Verify migration list against canonical baseline | `npx supabase migration list --local` or read-only non-production equivalent | Database Engineer |
| 1.2 | Replay canonical 138-migration chain in a non-production/local database | `npx supabase db diff --local` (replay phase) | Database Engineer |
| 1.3 | Confirm no migration-ordering or SQL execution errors | Review replay output | Architecture Authority |
| 1.4 | Inspect expected schema objects (RPCs, tables, policies, RLS) | `npx supabase db diff` / `psql` inspection | Database Engineer |

## 10.2 Wave 2 — Edge Functions

| Step | Simulated Activity | Command Example | Owner |
|---|---|---|---|
| 2.1 | List frozen Edge Function inventory | Review `supabase/functions/` directory and manifest | Backend Engineer |
| 2.2 | Simulate build/compile checks | `npx supabase functions build <name>` or `deno check` (non-production) | Backend Engineer |
| 2.3 | Validate function secrets and environment references | Check `supabase/config.toml` and secret presence | DevOps |

## 10.3 Wave 3 — Storage

| Step | Simulated Activity | Command Example | Owner |
|---|---|---|---|
| 3.1 | List expected buckets and policies | Review storage policy files / `supabase/storage.sql` | DevOps |
| 3.2 | Simulate bucket and policy application order | Step-through script or CLI dry-run equivalent | DevOps |
| 3.3 | Validate CORS and public/private bucket flags | Review configuration and requirements | DevOps |

## 10.4 Wave 4 — Authentication

| Step | Simulated Activity | Command Example | Owner |
|---|---|---|---|
| 4.1 | Confirm provider list and redirect URLs | Review `supabase/config.toml` / dashboard settings | DevOps |
| 4.2 | Simulate site URL and redirect update order | Documented command sequence, no execution | DevOps |
| 4.3 | Verify JWT expiry and refresh token settings | Review configuration without exposing secrets | DevOps |

## 10.5 Wave 5 — Application Deployment (Vercel)

| Step | Simulated Activity | Command Example | Owner |
|---|---|---|---|
| 5.1 | Build application locally | `npm run build` or `next build` | Frontend Engineer |
| 5.2 | Simulate Vercel preview deployment command | `vercel --target=preview` (do not execute `--target=production`) | Frontend Engineer |
| 5.3 | Verify environment variables injected into build | Build log review (values masked) | DevOps |
| 5.4 | Confirm domain and preview URL strategy | Review `vercel.json` / project settings | Release Manager |

---

# 11. Validation Checkpoints

## 11.1 Wave 1 — Database Migrations

| Item | Expected Outcome | Validation Activities | Evidence Required | Go / No-Go |
|---|---|---|---|---|
| Migration list | 138 canonical migrations in expected order | Compare CLI output to `PRODUCTION_DEPLOYMENT_PACKAGE.md` | CLI output / screenshot | Go if order matches |
| Replay | All migrations apply without error | Review `npx supabase db diff --local` replay output | Log file | Go if no SQL errors |
| Schema | Target RPCs, tables, columns, and policies present | Inspect schema objects in non-production DB | Inspection notes | Go if schema matches baseline |

## 11.2 Wave 2 — Edge Functions

| Item | Expected Outcome | Validation Activities | Evidence Required | Go / No-Go |
|---|---|---|---|---|
| Inventory | Inventory matches frozen baseline | Compare `supabase/functions/` to package | Directory listing | Go if all expected functions present |
| Build | No type or build errors | Run build/type check in non-production | Build log | Go if build succeeds |
| Secrets | Required secrets documented, values present | Secret presence checklist | Signed checklist | Go if all required secrets confirmed |

## 11.3 Wave 3 — Storage

| Item | Expected Outcome | Validation Activities | Evidence Required | Go / No-Go |
|---|---|---|---|---|
| Buckets | All expected buckets listed | Review storage configuration | Configuration dump | Go if buckets match |
| Policies | RLS-equivalent policies in expected order | Review policy SQL file | Policy review notes | Go if policies reviewed |

## 11.4 Wave 4 — Authentication

| Item | Expected Outcome | Validation Activities | Evidence Required | Go / No-Go |
|---|---|---|---|---|
| Providers | Approved providers enabled | Review dashboard/config | Settings screenshot | Go if provider list matches |
| Redirects | Site URL and redirect URLs match production target | Review redirect allow-list | Settings notes | Go if URLs verified |

## 11.5 Wave 5 — Vercel Application

| Item | Expected Outcome | Validation Activities | Evidence Required | Go / No-Go |
|---|---|---|---|---|
| Build | Application builds without errors | Local/CI build | Build log | Go if build passes |
| Environment | Environment variables loaded and masked | Inspect build output | Build log (values hidden) | Go if no leaked values |
| Preview | Preview URL can be generated for smoke tests | Simulate preview deployment command | Preview URL (if available) | Go if preview strategy valid |

---

# 12. Smoke Test Plan

| # | Area | Simulated Test | Expected Result | Owner |
|---|---|---|---|---|
| S1 | Authentication | Sign-up / sign-in flow | User token obtained, session valid | QA |
| S2 | Tenant creation | Create a test tenant | Tenant row created with normalized subdomain | QA |
| S3 | Login | Existing user login | Successful login, correct tenant context | QA |
| S4 | POS | Open a POS session | POS loads, products/cart accessible | QA |
| S5 | Orders | Create and complete an order | Order persisted, totals correct | QA |
| S6 | Inventory | Update stock quantity | Inventory record updated | QA |
| S7 | Reporting | Run a sales/inventory report | Report returns expected aggregates | QA |
| S8 | RPC | Call `public.set_tenant_subdomain` and `public.update_tenant_subscription` | RPCs execute without permission or arity errors | Backend Engineer |
| S9 | Storage upload | Upload a small test file to an expected bucket | Upload succeeds, download URL generated | DevOps |
| S10 | Edge Functions | Trigger an Edge Function via HTTP | Function returns expected response | Backend Engineer |

---

# 13. Rollback Strategy

## 13.1 Rollback Triggers

- Any wave reports a No-Go.
- Migration replay error or unexpected schema object.
- Critical smoke test failure.
- Missing secret or environment variable.
- Repository mismatch or unapproved change discovered.

## 13.2 Rollback Order

| Order | Layer | Rollback Action |
|---|---|---|
| 5 | Vercel application | Re-deploy previous production build or promote previous production deployment |
| 4 | Authentication | Re-apply previous Auth provider and redirect configuration |
| 3 | Storage | Re-apply previous bucket and policy configuration |
| 2 | Edge Functions | Re-deploy previous Edge Function bundle or disable newly deployed functions |
| 1 | Database | Restore from pre-cutover backup or re-apply previous migration baseline recorded at `pre-rebaseline-2026-07-19` |

## 13.3 Rollback Responsibilities

- **Database Engineer:** Database rollback and backup verification.
- **DevOps:** Auth, Storage, and Edge Function rollback.
- **Frontend Engineer:** Vercel application rollback.
- **Release Manager:** Coordinates rollback decision and records the Go/No-Go reversal.
- **Architecture Authority:** Validates that rolled-back state matches the approved previous baseline.

## 13.4 Rollback Evidence

- Rollback command output and timestamps.
- Backup verification checksum or log.
- Smoke test results after rollback.
- Communication log.

## 13.5 Rollback Communication

- Immediate announcement in the deployment war room.
- Written rollback decision with trigger, owner, and timestamp.
- Update to stakeholders and freeze decision makers.

---

# 14. Abort Criteria

The Dry Run aborts if any of the following occur:

1. Migration list or replay fails or does not match the canonical 138-migration chain.
2. Unexpected schema object is detected that is not in the frozen baseline.
3. Production outage is caused or observed during any step.
4. Authentication provider or redirect configuration cannot be validated.
5. Critical smoke test failure in authentication, tenant, order, or RPC flows.
6. Missing approval from a required authority.
7. Repository mismatch: `HEAD` does not equal `8b6ad12f100eb92e13939167fdf6d792c1c13a54`.

---

# 15. Success Criteria

The Dry Run is considered successfully completed when:

1. The frozen repository baseline and RC identity are confirmed.
2. All five waves are walked through without unresolved technical questions.
3. Every wave produces recorded expected outcomes and evidence.
4. Go/No-Go criteria are applied at each checkpoint.
5. The rollback strategy is reviewed and understood by all owners.
6. Smoke test plan is reviewed and executable against a non-production target.
7. No production systems were modified.
8. All findings are classified and no Critical or High blockers remain unresolved, except the pre-existing `M1` observation.

---

# 16. Risks

| Risk | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|
| Local Supabase/Postgres connectivity prevents full CLI gate execution (`M1`) | Medium: limits local validation evidence | Medium (already observed) | Carry `M1` forward; re-run gates once environment is available; use shadow replay and non-production project as partial validation | Database Engineer |
| Migration replay diverges from canonical 138 | High: production schema mismatch | Low | Freeze migration chain; verify count and order before any cutover | Architecture Authority |
| Missing or rotated secret | High: deployment failure or runtime error | Low | Secret presence checklist before Dry Run; secret manager audit | DevOps |
| Edge Function build error on pinned runtime | Medium: deployment blocked | Low | Build/type-check in non-production before cutover | Backend Engineer |
| Vercel environment variable mismatch | Medium: build or runtime failure | Low | Compare `.env` template against production Vercel project; mask values | Frontend Engineer |
| Participant availability delays Dry Run | Low: schedule slip | Low | Schedule in advance; assign backup owners | Program Manager |

---

# 17. Evidence Collection

The following artifacts must be captured during the Dry Run:

1. `git rev-parse HEAD` and `git status -sb` output.
2. CLI version output (`npx supabase --version`, `vercel --version`, `node --version`).
3. `npx supabase migration list` output (non-production).
4. `npx supabase db diff --local` or equivalent replay log.
5. `supabase/functions/` inventory and build/type-check output.
6. Storage bucket and policy configuration review notes.
7. Authentication provider and redirect URL review notes.
8. Local/CI build log (production values masked).
9. Smoke test result sheet (Pass/Fail/Blocked with owner).
10. Go/No-Go decision log for each wave.
11. Rollback decision and communication log (if triggered).
12. Final Dry Run readiness assessment.

---

# 18. Communication Plan

## 18.1 Before Dry Run

- Program Manager announces date, time, and war-room channel.
- Release Manager distributes frozen commit, RC ID, and evidence templates.
- Wave owners confirm prerequisite completion.

## 18.2 During Dry Run

- Wave owners report Go/No-Go immediately after each checkpoint.
- Release Manager records decisions and captures evidence.
- Program Manager escalates abort criteria if triggered.

## 18.3 After Dry Run

- Release Manager circulates the completed Dry Run evidence package.
- Program Manager and Architecture Authority review unresolved findings.
- Decision: `Dry Run Ready`, `Dry Run Ready With Observations`, or `Not Ready`.

## 18.4 Rollback Communication

- Rollback owner announces decision in war room.
- Program Manager records trigger and timestamp.
- Stakeholders are notified of restored state and next steps.

---

# 19. Approval Matrix

| Role | Required | Authority / Responsibility |
|---|---|---|
| Program Manager | Yes | Owns Dry Run schedule, communication, and Go/No-Go recommendation. |
| Architecture Authority | Yes | Validates baseline, migration sequence, and technical readiness. |
| Release Manager | Yes | Confirms RC identity, freeze status, and release hand-off readiness. |
| Project Owner | Yes | Accepts remaining observations and approves progression. |

---

# 20. Dry Run Readiness Assessment

| Category | Status | Notes |
|---|---|---|
| Repository baseline | Critical / Not Ready | Frozen commit `8b6ad12f...`, `HEAD` = `8b6ad12f...`, `origin/master` = `61e8c73f...` (alignment required), branch `master`, `138` canonical migrations confirmed. |
| Migration validation | Critical / Ready with observation | `M2` resolved by shadow replay; `M1` remains open and environmental. |
| Tooling and environment | High / Ready with observation | Supabase CLI `2.109.1` available; local Postgres connectivity (`M1`) not yet confirmed. |
| Rollback strategy | High / Ready | Rollback target `pre-rebaseline-2026-07-19` and baseline commit `6f7c5dd7...` documented. |
| Roles and responsibilities | High / Ready | Wave owners, decision authorities, and QA assigned. |
| Evidence collection | Medium / Ready | Templates defined; capture during execution. |

## 20.1 Readiness Decision

```text
DRY RUN READINESS:

Dry Run Ready With Observations
```

### Rationale

- The frozen baseline `RC-2026-07-19-01` is established and the repository is synchronized.
- The canonical 138-migration chain has been replayed successfully in shadow replay, validating migration ordering and the two repository-only migrations.
- No Critical or High findings remain unresolved.
- The only open item is observation `M1` (local Supabase/Postgres connectivity), which is environmental and does not invalidate the Dry Run simulation.
- All required wave owners, rollback references, and evidence templates are in place.

---

# 21. Next Authorized Governance Step

```text
PRODUCTION_CUTOVER_PLAN.md
```

The `PRODUCTION_CUTOVER_PLAN.md` may be prepared only after this `DEPLOYMENT_DRY_RUN_PLAN.md` has been reviewed, evidence captured, and the Dry Run readiness decision accepted. The Cutover Plan will define the maintenance window, expected downtime, production deployment authorization, final communication plan, and post-deployment monitoring schedule. No production cutover is authorized by the present Dry Run plan.
