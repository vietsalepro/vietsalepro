# PRODUCTION CUTOVER PLAN

**Program:** VietSalePro v7 — Production Deployment Program  
**Phase:** Phase 2 — Release Preparation / Phase 3 Readiness  
**Date:** 2026-07-19  
**RC ID:** `RC-2026-07-19-01`  
**Frozen Commit:** `8b6ad12f100eb92e13939167fdf6d792c1c13a54`  
**Branch:** `master`  
**Authority:** Program Manager / Release Manager / Architecture Authority  

---

# 1. Purpose

## Objective

This document defines the official **Production Cutover Plan** for the VietSalePro v7 platform. It describes how the approved `RC-2026-07-19-01` frozen baseline will be transitioned into the live production environment on Supabase and Vercel once all required approvals have been granted.

## Production Cutover Scope

The cutover scope includes all production deployment waves: database migrations, Edge Functions, storage, authentication, Vercel application deployment, smoke testing, production validation, and business acceptance. It covers the maintenance window, Go/No-Go checkpoints, rollback triggers, incident management, evidence collection, monitoring, hypercare, and the final approval matrix required to authorize execution.

## Relationship to Dry Run

This plan builds on the `DEPLOYMENT_DRY_RUN_PLAN.md`, which simulated the deployment sequence and validated execution readiness. The Dry Run produced the decision: **Dry Run Ready With Observations**. The Production Cutover Plan turns that simulation into the authorized execution framework, but it does not execute it.

## Relationship to Deployment Package

This plan is a downstream consumer of `PRODUCTION_DEPLOYMENT_PACKAGE.md`. The package provides the frozen baseline (commit, migration count, rollback references, and asset inventory). This plan adds the operational execution sequence, timing, responsibilities, and gates.

## Important Authorization Notice

**This document does NOT authorize production deployment.**

No database migration may run, no Edge Function may be deployed, no storage or auth configuration may be changed, no Vercel production deployment may occur, and no production system may be touched until the `PHASE_2_EXIT_GATE_REVIEW.md` is completed, approved, and a separate execution authorization is issued.

---

# 2. Governance References

The following artifacts govern this cutover plan:

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
- `DEPLOYMENT_DRY_RUN_PLAN.md`
- `PRODUCTION_PROGRAM_AUTHORIZATION.md`

---

# 3. Cutover Objectives

| # | Objective | Desired Outcome |
|---|---|---|
| O1 | Minimize downtime | Production users experience only the planned maintenance window. |
| O2 | Protect data integrity | All database migrations and configuration changes apply cleanly and leave existing data intact. |
| O3 | Controlled rollout | Each deployment wave completes and is validated before the next wave begins. |
| O4 | Validated rollback | A tested rollback path and decision authority are ready before any wave executes. |
| O5 | Evidence collection | Every wave, checkpoint, and decision is recorded with logs, screenshots, and signed checklists. |
| O6 | Communication | Stakeholders receive status updates at every major checkpoint and on any rollback or incident. |
| O7 | Business acceptance | Final sign-off confirms the platform is fit for production use. |

---

# 4. Repository Baseline

| Field | Value |
|---|---|
| RC ID | `RC-2026-07-19-01` |
| Frozen Commit | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` |
| Branch | `master` |
| Repository Sync | `HEAD` (`8b6ad12f...`) != `origin/master` (`61e8c73f...`); alignment required before cutover |
| Canonical Migration Count | `138` |
| Archived Migration Count | `17` |
| Deployment Package Decision | `PRODUCTION DEPLOYMENT PACKAGE: ASSEMBLED WITH OBSERVATIONS` |
| Dry Run Decision | `Dry Run Ready With Observations` |
| Canonical Migration Directory | `supabase/migrations/` |
| Archived Non-Canonical Migration Directory | `archive/supabase/non_canonical_migrations/` |
| Alias Register | `MIGRATION_VERSION_ALIASES.md` |
| Archive Index | `archive/supabase/non_canonical_migrations/INDEX.md` |

Repository-only migrations in the frozen baseline:

```text
supabase/migrations/20260718000001_sp_7_1_set_tenant_subdomain.sql
supabase/migrations/20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql
```

---

# 5. Production Readiness Assumptions

The following conditions are assumed to be true before the cutover window opens:

- The repository remains frozen at `8b6ad12f100eb92e13939167fdf6d792c1c13a54`.
- `RC-2026-07-19-01` has been accepted and the release tag is ready to be applied at execution time.
- The Dry Run has been accepted and its evidence reviewed.
- The Deployment Package is complete and checked.
- All required approvals in Section 20 are obtained before the maintenance window.
- Rollback assets are prepared, including a verified pre-cutover database backup.
- All required production secrets are present in the approved secret manager and available to the deployment team.
- A maintenance window is approved and communicated to stakeholders.
- Local CLI gate observation `M1` has been dispositioned or formally accepted as environmental before Phase 3 entry.
- No source code, migration, Edge Function, or environment changes may enter the frozen baseline without re-freezing.

---

# 6. Maintenance Window

**All values below are placeholders. Do not invent dates. Replace with actual values after scheduling approval.**

| Item | Placeholder Value |
|---|---|
| Maintenance start | `[YYYY-MM-DD HH:MM UTC+7]` |
| Maintenance end | `[YYYY-MM-DD HH:MM UTC+7]` |
| Expected downtime | `[N minutes / N hours]` |
| Rollback deadline | `[YYYY-MM-DD HH:MM UTC+7]` |
| Customer communication issued | `[T-minus 24 hours minimum]` |

## Go/No-Go Checkpoints

| Checkpoint | Latest Time | Decision Authority |
|---|---|---|
| Pre-maintenance readiness | `[T-30 minutes]` | Program Manager / Release Manager |
| Wave 1 — Database complete | `[Window start + N minutes]` | Database Engineer / Architecture Authority |
| Waves 2–5 complete | `[As scheduled]` | Wave owners / Release Manager |
| Wave 6 — Smoke tests pass | `[Before rollback deadline]` | QA / Architecture Authority |
| Wave 7 — Production validation pass | `[Before rollback deadline]` | QA / Release Manager |
| Wave 8 — Business acceptance | `[End of window]` | Project Owner / Program Sponsor |
| Final Go for general availability | `[End of window]` | Program Manager / Project Owner |

## Communication Checkpoints

| Timing | Audience | Message |
|---|---|---|
| T-24h | All users / stakeholders | Maintenance window reminder |
| T-15min | War room | Maintenance about to start |
| Window start | War room | Maintenance started; service degraded/unavailable |
| Per wave | War room | Wave status, Go/No-Go |
| Rollback if triggered | Stakeholders / users | Service restoration in progress |
| Window end | All users / stakeholders | Service restored or hypercare active |

---

# 7. Production Deployment Sequence

The cutover is executed in the following waves. No wave may begin until the previous wave has passed its Go/No-Go checkpoint.

## Wave 1 — Database

- Verify frozen commit and migration baseline.
- Execute the canonical 138-migration chain against the production Supabase project.
- Confirm target RPCs, tables, columns, RLS policies, and indexes are present.
- Capture migration logs and schema evidence.

## Wave 2 — Edge Functions

- Verify Edge Function inventory against `supabase/functions/` frozen baseline.
- Build and deploy Edge Functions to the production Edge Runtime.
- Confirm required secrets and environment variables are configured.

## Wave 3 — Storage

- Verify storage bucket inventory and expected policies.
- Apply or confirm production bucket and policy configuration.
- Validate CORS settings and public/private bucket flags.

## Wave 4 — Authentication

- Verify Auth provider list and redirect URLs.
- Apply or confirm production Auth configuration.
- Confirm JWT expiry and refresh token settings.
- Verify no unintended provider changes are applied.

## Wave 5 — Vercel Deployment

- Trigger production build with frozen commit and environment variables.
- Deploy to Vercel with `--target=production` or approved equivalent.
- Confirm domain, preview vs production traffic, and environment variable masking.

## Wave 6 — Smoke Testing

- Execute the smoke test matrix in Section 10 against the production environment.
- Record pass/fail/blocked status for every test.
- Raise a No-Go on any Critical-path failure.

## Wave 7 — Production Validation

- Validate API health, response times, and error rates.
- Verify critical business flows end-to-end in production.
- Confirm monitoring and alerting are active.

## Wave 8 — Business Acceptance

- Project Owner / Program Sponsor reviews evidence and declares acceptance.
- Final Go/No-Go for general availability is recorded.
- Hypercare begins.

---

# 8. Detailed Cutover Checklist

## Before Maintenance

| # | Check | Owner | Evidence |
|---|---|---|---|
| B1 | Frozen commit `8b6ad12f...` is checked out; `origin/master` must be reset/aligned to `8b6ad12f...` before cutover | Release Manager | `git rev-parse HEAD`, `git rev-parse origin/master` |
| B2 | Working tree is clean; no unauthorized source or migration changes | Architecture Authority | `git status --short` |
| B3 | RC ID, release tag, and rollback target are confirmed | Release Manager | `RELEASE_CANDIDATE_PREPARATION.md`, `PRODUCTION_DEPLOYMENT_PACKAGE.md` |
| B4 | Pre-cutover database backup is complete and verified | Database Engineer | Backup log / checksum |
| B5 | All required secrets are present by category without value exposure | DevOps | Secret presence checklist |
| B6 | Maintenance window is approved and stakeholders notified | Program Manager | Communication log |
| B7 | War room / incident channel is active | Program Manager | Channel screenshot or roster |
| B8 | Wave owners, QA, and rollback team are available | Program Manager | Attendance list |
| B9 | Rollback scripts, commands, and decision authority are confirmed | Release Manager / Database Engineer | Rollback runbook |
| B10 | Monitoring dashboards and alerting are accessible | DevOps | Dashboard links / screenshots |
| B11 | Smoke test credentials and test data are ready | QA | Test credentials inventory |

## During Maintenance

| # | Check | Owner | Evidence |
|---|---|---|---|
| D1 | Each wave begins only after the previous wave is Go | Release Manager | Go/No-Go log |
| D2 | Migration logs are captured for Wave 1 | Database Engineer | CLI output / log file |
| D3 | Edge Function deployment logs are captured | Backend Engineer | CLI output / log file |
| D4 | Storage and Auth configuration changes are logged | DevOps | Dashboard screenshots / CLI logs |
| D5 | Vercel build and deployment logs are captured | Frontend Engineer | Build log / deployment URL |
| D6 | Every Go/No-Go checkpoint is recorded with timestamp and authority | Release Manager | Decision log |
| D7 | Smoke test results are captured in real time | QA | Smoke test sheet |
| D8 | Rollback decision is documented immediately if triggered | Release Manager | Rollback decision record |

## After Maintenance

| # | Check | Owner | Evidence |
|---|---|---|---|
| A1 | All waves completed or rollback completed | Release Manager | Wave completion log |
| A2 | Smoke test matrix is fully Pass or dispositioned | QA | Smoke test sheet |
| A3 | Production validation is complete and signed | QA / Architecture Authority | Validation report |
| A4 | Business acceptance is recorded | Project Owner | Acceptance statement |
| A5 | Monitoring checkpoints at 15min, 30min, 1h, 4h, 24h are scheduled | DevOps | Monitoring plan |
| A6 | Hypercare roster and duration are confirmed | Program Manager | Hypercare plan |
| A7 | Evidence package is assembled and stored | Release Manager | Evidence index |
| A8 | Post-cutover communication is issued | Program Manager | Communication log |

---

# 9. Validation Gates

## Wave 1 — Database

| Item | Expected Outcome | Validation | Evidence | Go | No-Go | Owner |
|---|---|---|---|---|---|---|
| Migration count | 138 canonical migrations in expected order | `npx supabase migration list` or equivalent output compared to `PRODUCTION_DEPLOYMENT_PACKAGE.md` | CLI output / screenshot | Count and order match | Mismatch or missing migration | Database Engineer |
| Migration execution | All migrations apply without SQL errors | Review `supabase db push` or equivalent execution log | Migration log | No SQL errors | Any SQL error or ordering failure | Database Engineer |
| Schema integrity | Target RPCs, tables, columns, policies, and indexes are present | `psql` / dashboard inspection or `db diff` against baseline | Inspection notes / diff report | Schema matches baseline | Unexpected or missing objects | Architecture Authority |

## Wave 2 — Edge Functions

| Item | Expected Outcome | Validation | Evidence | Go | No-Go | Owner |
|---|---|---|---|---|---|---|
| Function inventory | All expected functions present | Compare `supabase/functions/` to package inventory | Directory listing / manifest | Complete | Missing function | Backend Engineer |
| Function build | No type or build errors | `npx supabase functions build <name>` or `deno check` | Build log | Build succeeds | Build error | Backend Engineer |
| Function deployment | Functions published to Edge Runtime | `npx supabase functions deploy` completion and HTTP check | Deployment log / response | Deployed and responding | Deployment error or non-200 | Backend Engineer |

## Wave 3 — Storage

| Item | Expected Outcome | Validation | Evidence | Go | No-Go | Owner |
|---|---|---|---|---|---|---|
| Buckets | All expected buckets exist with correct public/private flags | Review dashboard / CLI | Bucket list | Flags match baseline | Missing or misconfigured bucket | DevOps |
| Policies | Storage policies match frozen baseline | Review policy SQL / dashboard | Policy review notes | Policies correct | Missing or incorrect policy | DevOps |
| CORS | CORS configuration matches production target | Review configuration | CORS settings screenshot | Matches target | Mismatch | DevOps |

## Wave 4 — Authentication

| Item | Expected Outcome | Validation | Evidence | Go | No-Go | Owner |
|---|---|---|---|---|---|---|
| Providers | Approved provider list enabled | Review Auth dashboard / `supabase/config.toml` | Settings screenshot | List matches baseline | Unauthorized provider change | DevOps |
| Redirects | Site URL and redirect URLs match production target | Review redirect allow-list | Settings notes | All URLs verified | Mismatch | DevOps |
| JWT | JWT expiry and refresh settings are correct | Review settings without exposing secrets | Settings notes | Within target | Mismatch | DevOps |

## Wave 5 — Vercel Deployment

| Item | Expected Outcome | Validation | Evidence | Go | No-Go | Owner |
|---|---|---|---|---|---|---|
| Build | Application builds without errors | `npm run build` / `next build` or CI build | Build log | Build passes | Build error | Frontend Engineer |
| Environment | All environment variables loaded; no values leaked | Inspect build output (masked) | Build log (masked) | No leaks | Secret exposed | DevOps |
| Production URL | Vercel production deployment is live at approved domain | Visit production domain / health endpoint | Screenshot / curl output | Live and serving | 5xx or domain error | Frontend Engineer |

## Wave 6 — Smoke Testing

| Item | Expected Outcome | Validation | Evidence | Go | No-Go | Owner |
|---|---|---|---|---|---|---|
| Smoke test matrix | All critical smoke tests pass | Execute Section 10 matrix | Smoke test sheet | All critical tests Pass | Critical test Fail or unresolved Block | QA |

## Wave 7 — Production Validation

| Item | Expected Outcome | Validation | Evidence | Go | No-Go | Owner |
|---|---|---|---|---|---|---|
| End-to-end flows | Critical business flows succeed | Order, inventory, reporting checks | Validation report | Flows succeed | Critical flow failure | QA |
| API health | Health endpoints return success within SLA | `curl`/dashboard health checks | Health check log | Healthy | Error rate above threshold | DevOps |
| Monitoring | Logs and alerts are active and visible | Review monitoring dashboards | Screenshot | Active | No monitoring | DevOps |

## Wave 8 — Business Acceptance

| Item | Expected Outcome | Validation | Evidence | Go | No-Go | Owner |
|---|---|---|---|---|---|---|
| Acceptance | Project Owner confirms production fitness | Review evidence package and sign acceptance | Signed acceptance statement | Accepted | Rejected or unresolved concerns | Project Owner |

---

# 10. Production Smoke Test Matrix

| # | Area | Test Case | Expected Result | Owner |
|---|---|---|---|---|
| S1 | Authentication | Sign-up / sign-in flow | User token obtained, session valid | QA |
| S2 | Tenant | Create a test tenant | Tenant row created with normalized subdomain | QA |
| S3 | Login | Existing user login | Successful login, correct tenant context | QA |
| S4 | POS | Open a POS session | POS loads, products and cart accessible | QA |
| S5 | Orders | Create and complete an order | Order persisted, totals correct | QA |
| S6 | Inventory | Update stock quantity | Inventory record updated | QA |
| S7 | Payments | Process a test payment transaction | Payment recorded, status correct | QA |
| S8 | Reporting | Run a sales/inventory report | Report returns expected aggregates | QA |
| S9 | RPC | Call `public.set_tenant_subdomain` and `public.update_tenant_subscription` | RPCs execute without permission or arity errors | Backend Engineer |
| S10 | Storage | Upload a small test file to an expected bucket | Upload succeeds, download URL generated | DevOps |
| S11 | Edge Functions | Trigger an Edge Function via HTTP | Function returns expected response | Backend Engineer |
| S12 | Frontend | Load production homepage and key routes | Pages render without critical console errors | QA |

---

# 11. Rollback Plan

## Rollback Triggers

Rollback is triggered immediately if any of the following occur:

- Any wave reports a No-Go that cannot be resolved within the wave's timebox.
- Migration execution error or unexpected schema object detected.
- Critical smoke test failure (authentication, tenant, login, POS, orders, RPC, storage, or Edge Functions).
- Missing or incorrect secret or environment variable that prevents a wave from completing.
- Repository mismatch or unapproved change discovered during the cutover.
- Critical incident or data integrity concern before the rollback deadline.
- Business acceptance is not obtained by the end of the maintenance window.

## Rollback Order

| Order | Layer | Rollback Action |
|---|---|---|
| 5 | Vercel application | Re-deploy previous production build or promote previous production deployment. |
| 4 | Authentication | Re-apply previous Auth provider and redirect configuration. |
| 3 | Storage | Re-apply previous bucket and policy configuration. |
| 2 | Edge Functions | Re-deploy previous Edge Function bundle or disable newly deployed functions. |
| 1 | Database | Restore from pre-cutover backup or re-apply previous migration baseline recorded at `pre-rebaseline-2026-07-19` (commit `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c`). |

## Rollback Owner

- **Overall rollback decision:** Release Manager, with Architecture Authority validation.
- **Database rollback:** Database Engineer.
- **Auth / Storage / Edge Function rollback:** DevOps.
- **Vercel application rollback:** Frontend Engineer.

## Rollback Communication

- Announce rollback decision and trigger in the deployment war room immediately.
- Program Manager records the trigger, decision authority, and timestamp.
- Stakeholders and users are notified as soon as the rollback plan is activated.
- Update freeze decision makers on restored state and next steps.

## Rollback Evidence

- Rollback command output and timestamps.
- Backup verification checksum or log captured before the cutover.
- Smoke test results after rollback.
- Communication log and decision record.

## Rollback Decision Authority

The Release Manager, with concurrence from the Architecture Authority and Program Manager, has the authority to call rollback. The Project Owner is informed immediately. No single individual may proceed past the rollback deadline without explicit written Go.

---

# 12. Incident Management

## Incident Severity

| Severity | Definition | Example |
|---|---|---|
| SEV-1 Critical | Production unavailable or data integrity at risk | Database migration failure, auth outage, payment failure |
| SEV-2 High | Major functionality degraded | Edge Function errors causing order failures |
| SEV-3 Medium | Limited impact, workaround available | Reporting delay, non-critical storage policy issue |
| SEV-4 Low | Cosmetic or minor issue | UI rendering inconsistency |

## Escalation Chain

1. **Wave owner** detects and reports the incident.
2. **Release Manager** coordinates response and assesses severity.
3. **Architecture Authority** validates technical scope and rollback recommendation.
4. **Program Manager** escalates to stakeholders and decides on rollback vs. fix-forward.
5. **Project Owner / Program Sponsor** provides final authority for SEV-1 decisions.

## Decision Authority

- Wave-level Go/No-Go: Wave owner + Release Manager.
- Rollback decision: Release Manager + Architecture Authority + Program Manager.
- SEV-1 incident: Project Owner / Program Sponsor has final authority.

## Communication Flow

- War room channel is the single source of truth during the cutover.
- Every SEV-2 or higher incident is announced in the war room and to stakeholders within 5 minutes.
- SEV-1 incidents trigger immediate stakeholder call and user-facing status update.

## Recovery Ownership

- **Database / data recovery:** Database Engineer.
- **Edge Function / Auth / Storage:** DevOps.
- **Frontend / Vercel:** Frontend Engineer.
- **Overall coordination and evidence:** Release Manager.

---

# 13. Risk Register

| Risk | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|
| M1 — Local Supabase/Postgres connectivity prevented full CLI gate execution (`migration list --local`, `db lint`, final `db diff`) | Medium: limits local validation evidence; must be dispositioned before Phase 3 entry | Medium (already observed) | Carry `M1` forward; re-run gates once environment is available or formally disposition in release governance; use shadow replay and non-production project as partial validation | Database Engineer |
| Migration replay diverges from canonical 138 in production | High: production schema mismatch | Low | Freeze migration chain; verify count and order before cutover; execute against verified backup | Architecture Authority |
| Missing or rotated secret | High: deployment failure or runtime error | Low | Secret presence checklist before cutover; secret manager audit; no values exposed | DevOps |
| Edge Function build error on pinned runtime | Medium: deployment blocked | Low | Build/type-check in non-production before cutover; pinned `deno` / Edge Runtime version | Backend Engineer |
| Vercel environment variable mismatch | Medium: build or runtime failure | Low | Compare `.env` template against production Vercel project; mask values | Frontend Engineer |
| Extended maintenance window beyond expectation | Medium: user impact, stakeholder escalation | Low | Time-box each wave; rollback deadline before end of window; communication checkpoints | Program Manager |
| Participant unavailability during cutover | Low: schedule slip or decision delay | Low | Assign backup owners and decision delegates | Program Manager |

*Observation M1 is carried forward unchanged per program direction.*

---

# 14. Evidence Collection

The following evidence must be collected before, during, and after the cutover:

1. `git rev-parse HEAD` and `git status -sb` output at cutover start.
2. CLI version output (`npx supabase --version`, `vercel --version`, `node --version`).
3. Pre-cutover database backup verification log / checksum.
4. Migration list and migration execution logs.
5. Edge Function inventory, build logs, and deployment logs.
6. Storage bucket and policy configuration screenshots or dumps.
7. Authentication provider and redirect URL screenshots or notes.
8. Vercel build log and production deployment URL.
9. Smoke test result sheet with Pass/Fail/Blocked and owner.
10. Production validation report.
11. Go/No-Go decision log for every wave.
12. Rollback logs and communication log (if triggered).
13. Monitoring dashboard screenshots at 15min, 30min, 1h, 4h, and 24h.
14. Business acceptance statement.

---

# 15. Production Monitoring Plan

Monitoring is active from the end of the maintenance window through the end of hypercare.

| Checkpoint | Focus | Evidence |
|---|---|---|
| Immediate | Verify production URL is live; health endpoints return 200; no critical alerts. | Screenshot / curl output |
| 15 minutes | Error rates, API latency, auth success rate, storage upload success. | Dashboard screenshot |
| 30 minutes | Order/POS flow success, tenant creation, login volume. | Dashboard / smoke test spot check |
| 1 hour | Aggregate error rate, Edge Function invocation success, database connection health. | Monitoring report |
| 4 hours | Business-metric trends, reporting jobs, background Edge Functions. | Monitoring report |
| 24 hours | Daily summary of incidents, error rates, and user-reported issues. | Hypercare report |

*Examples only. No monitoring is executed by this plan.*

---

# 16. Hypercare Plan

| Item | Detail |
|---|---|
| Duration | 24 hours minimum; extend to 72 hours if any observation remains open or SEV-2+ incident occurs. |
| Responsibilities | DevOps monitors infrastructure; Database Engineer watches database health; Backend Engineer supports Edge Functions; Frontend Engineer supports Vercel/FE issues; QA validates user-reported issues; Program Manager coordinates and reports. |
| Success metrics | Zero SEV-1 incidents; SEV-2 incidents resolved within SLA; no rollback required; user-reported critical issues = 0. |
| Issue reporting | All issues logged in the war room channel and the issue tracker with severity and owner. |
| Exit criteria | 24 hours of stable monitoring; no unresolved SEV-2 or higher incidents; hypercare report accepted by Program Manager. |

---

# 17. Communication Plan

## Before Maintenance

- Program Manager announces maintenance window to all users and stakeholders at least 24 hours in advance.
- Release Manager distributes frozen commit, RC ID, rollback target, and evidence templates to the war room.
- Wave owners confirm prerequisites and availability.

## Maintenance Started

- Program Manager confirms maintenance start in the war room and to users.
- Stakeholders are informed that production is under planned change.

## Wave Completion

- Wave owner reports Go/No-Go to the war room immediately after each wave.
- Release Manager records decisions and publishes a rolling status update.

## Rollback

- Rollback owner announces decision and trigger in the war room.
- Program Manager notifies stakeholders and users that service restoration is in progress.
- Stakeholders receive the restored state and next steps once rollback is verified.

## Deployment Completed

- Program Manager announces successful completion, links to acceptance evidence, and confirms start of hypercare.
- Users are informed that the service is restored and under monitoring.

## Hypercare

- Program Manager issues a hypercare start notice with contact roster.
- At 24 hours, a hypercare status report is distributed.
- Final closeout communication is issued after hypercare exit criteria are met.

---

# 18. Success Criteria

The production cutover is considered successful when:

- All eight waves are completed according to the sequence in Section 7.
- Every validation gate in Section 9 records a Go.
- The smoke test matrix in Section 10 shows all critical tests Pass.
- Production validation in Section 9 Wave 7 passes.
- Business acceptance in Section 9 Wave 8 is recorded.
- No rollback was required.
- No SEV-1 or unresolved SEV-2 incident occurred during the maintenance window.
- Evidence package in Section 14 is complete and stored.

---

# 19. Cutover Exit Criteria

The deployment is considered complete only if:

- All waves were successful or a controlled rollback was executed and verified.
- Smoke tests passed (or failures were dispositioned and accepted).
- Business validation was accepted by the Project Owner.
- Monitoring was stable for the first 24 hours of hypercare.
- No Critical (SEV-1) incidents remain unresolved.
- Rollback was not required (unless rollback was the chosen and successful outcome).
- Evidence package was completed and indexed.
- The `PHASE_2_EXIT_GATE_REVIEW.md` has approved progression to Phase 3.

---

# 20. Approval Matrix

| Role | Required | Authority / Responsibility | Signature | Date |
|---|---|---|---|---|
| Program Manager | Yes | Owns cutover schedule, gates, communication, and final Go/No-Go recommendation. | _________________________ | ________ |
| Architecture Authority | Yes | Validates baseline integrity, migration ordering, and technical abort criteria. | _________________________ | ________ |
| Release Manager | Yes | Manages RC identity, freeze status, release hand-off, and rollback decision. | _________________________ | ________ |
| Project Owner | Yes | Provides final business acceptance and production fitness sign-off. | _________________________ | ________ |
| Database Engineer | Yes | Owns database migration execution, schema validation, and database rollback. | _________________________ | ________ |
| DevOps | Yes | Owns Edge Function, Storage, Auth, Vercel environment, and secret verification. | _________________________ | ________ |
| QA | Yes | Executes smoke tests, production validation, and records results. | _________________________ | ________ |

---

# 21. Production Readiness Decision

```text
PRODUCTION READINESS:

READY FOR PRODUCTION CUTOVER WITH OBSERVATIONS
```

## Rationale

- The frozen repository baseline `RC-2026-07-19-01` is established and synchronized.
- The canonical 138-migration chain has been validated by shadow replay, including the two repository-only migrations.
- The Deployment Package is assembled and the Dry Run is accepted as `Dry Run Ready With Observations`.
- All wave owners, rollback references, evidence templates, and approval roles are defined.
- No Critical or High findings remain unresolved.
- The only open item is observation `M1` (local Supabase/Postgres connectivity), which is environmental and must be dispositioned or formally accepted before Phase 3 entry. M1 is carried forward unchanged in the risk register.

This decision is conditional on the `PHASE_2_EXIT_GATE_REVIEW.md` approval and a separate execution authorization.

---

# 22. Next Authorized Governance Step

```text
PHASE_2_EXIT_GATE_REVIEW.md
```

The `PHASE_2_EXIT_GATE_REVIEW.md` determines whether Phase 2 — Release Preparation may be formally closed and Phase 3 opened. It reviews the frozen baseline, the Deployment Package, the Dry Run evidence, the Production Cutover Plan, and the remaining `M1` observation.

**No production deployment is authorized until the Exit Gate Review is completed and approved and a separate production execution authorization is issued.**

---

*Basis: `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md` Version 1.2; `PRODUCTION_DEPLOYMENT_MASTER_PLAN.md` Version 1.2; `CURRENT_PHASE.md`; `CURRENT_TASK.md`; `PHASE_1_EXIT_GATE_REVIEW.md`; `PHASE_2_RELEASE_PREPARATION_KICKOFF.md`; `CURRENT_TASK-003_PROGRAM_AUTHORIZATION.md`; `CURRENT_TASK-003_IMPLEMENTATION.md`; `CURRENT_TASK-003_VERIFICATION.md`; `CURRENT_TASK-003_ACCEPTANCE.md`; `DEPLOYMENT_FREEZE_REVIEW.md`; `RELEASE_CANDIDATE_PREPARATION.md`; `PRODUCTION_DEPLOYMENT_PACKAGE.md`; `DEPLOYMENT_DRY_RUN_PLAN.md`; frozen commit `8b6ad12f100eb92e13939167fdf6d792c1c13a54`.*
