# Production Deployment Master Plan

**Program:** VietSalePro v7 — Production Deployment Program  
**Version:** 1.2  
**Date:** 2026-07-19  
**Status:** Proposed — Version 1.2 — Pending Program Sponsor Approval  
**Basis:** `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md`

---

## 1. Program Overview

The Production Deployment Program is an independent, gated program to plan and authorize the safe deployment of VietSalePro v7 to a live Supabase production environment and its dependent platform layers. This program follows the formal closure of the System Recovery Program. Recovery artifacts are historical reference only; this program defines and approves its own production baseline.

Version 1.2 finalizes the program with formal controls for the Production Deployment Baseline, Deployment Freeze, Release Governance, Git Governance, the Production Deployment Package, Production Asset Inventory, Deployment Wave Strategy, Dry Run, Production Cutover, Post-Deployment Monitoring, and Hypercare. These controls are embedded in the phase structure without changing the program's purpose or deployment objectives.

This master plan is planning-only. No migration is applied, no Edge Function is deployed, no secret is read, and no environment is modified by this document or by this program phase. The plan establishes the governance, evidence, and sequence by which a future execution phase may deploy with authority.

---

## 2. Deployment Philosophy

- **Baseline-first.** The production target is a single, named, approved baseline. Nothing is deployed until the baseline is frozen and verified.
- **Freeze before release.** Deployment artifacts are frozen before they are released; no artifact changes after freeze without change control.
- **Release before cutover.** A Release Candidate is promoted to a Production Release only after freeze, package, and Dry Run are verified.
- **Layer-by-layer.** Database, storage, authentication, and Edge Functions are treated as distinct layers. Each layer is verified before the next is touched.
- **Evidence over intuition.** Every phase exit requires recorded evidence: commands, outputs, logs, and signed checklists.
- **Rollback as deliverable.** A rollback path is not an afterthought; it is a required deliverable for every layer before deployment.
- **Least change.** The program deploys the existing trusted artifacts. It does not modify source code, migrations, or Edge Functions.

---

## 3. Guiding Principles

1. **One production baseline.** The canonical migration chain and the matching Edge Function, storage, and auth configurations are the only approved target.
2. **Gated progression.** No phase begins until the prior phase exit gate is approved by the required authority.
3. **Independent verification.** The same party that produces evidence does not approve it; verification is independent.
4. **Secret hygiene.** Secret verification confirms presence and shape; values are never logged, displayed, or stored in documents.
5. **Traceability.** Every requirement, artifact, and test maps to a phase, deliverable, and evidence item.
6. **Simpler governance.** This program is intentionally smaller than the Recovery Program: one charter, one master plan, five phases, and one decision log.

---

## 4. Phase Structure

Version 1.2 finalizes the phase model by adding the Production Asset Inventory and Deployment Wave Strategy as required governance controls, while preserving the five-phase structure to explicitly govern release preparation, post-deployment monitoring, and hypercare. A phase may not start until the prior phase exit gate is approved.

### Phase 1 — Production Readiness

**Objectives**
- Establish the Production Deployment Baseline from the current repository.
- Create and approve the Production Asset Inventory.
- Verify the deployment environment, tooling, and credentials.
- Verify Git governance state (clean working tree, approved branch, commit SHA, and tag).
- Confirm that all required secrets and environment values are present and correct.
- Validate that the rollback strategy is understood and documented before any change is made.

**Activities**
1. Identify and document the Production Deployment Baseline:
   - Repository Commit SHA
   - Git Tag / Release Version
   - Canonical Migration Chain
   - Edge Function Set
   - Storage Configuration
   - Authentication Configuration
   - Required Secrets Inventory
   - Environment Configuration
   - Deployment Package Version
   - Baseline Checksum (where applicable)
2. Verify Git governance: repository status, working tree cleanliness, branch, commit SHA, and tag.
3. Create the Production Asset Inventory by listing all deployable assets in the categories defined in the Charter, including Edge Functions, storage buckets, auth providers, and environment variables.
4. Verify Supabase CLI, CI/CD, and Vercel CLI versions and authentication.
5. Execute secret presence checks by category (OpenAI, Stripe, Resend, SMTP, Google, Storage, Service Role, etc.) without exposing values.
6. Confirm production project region, database, API endpoints, Edge Runtime, Realtime, and Storage settings.
7. Document the rollback approach for each layer.
8. Produce the Phase 1 evidence package.

**Required Inputs**
- `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md`
- Closed Recovery Program baseline and acceptance records
- Repository `supabase/` directory (migrations, functions, config)
- Access to the production Supabase project dashboard and CLI
- Access to the approved secret manager
- Deployment runbook and maintenance window schedule

**Deliverables**
1. Production Deployment Baseline record
2. Git governance verification checklist
3. Edge Function inventory
4. Storage bucket and policy inventory
5. Auth configuration verification checklist
6. Secret presence verification checklist by category
7. Environment configuration verification checklist
8. Rollback strategy summary per deployable layer
9. Phase 1 readiness evidence package
10. Production Asset Inventory

**Entry Criteria**
- Program Charter approved.
- Program Manager, Architecture Authority, Engineering Lead, Release Authority, and Verification Authority named.
- Repository access and production project access verified.

**Exit Criteria**
- A single Production Deployment Baseline is documented and approved.
- The Production Asset Inventory is approved and explicitly referenced in the Production Deployment Package.
- Git governance verification passes (clean working tree, verified commit and tag).
- All required secrets are confirmed present without value exposure.
- Environment and tooling checks pass.
- Rollback strategy is approved for each deployable layer.
- No unresolved blockers remain.

**Risks**
| Risk | Impact | Mitigation |
|---|---|---|
| Baseline ambiguity | Deploy the wrong artifact set | Freeze and checksum; require Architecture Authority sign-off. |
| Git state not clean | Unapproved changes in deployment | Require clean working tree and verified commit/tag before release. |
| Missing secret | Deployment or runtime failure | Presence check before Phase 2; escalate missing items immediately. |
| Tooling version mismatch | Non-deterministic deployment | Pin CLI and runtime versions; record in evidence. |
| Region / project mismatch | Data residency or endpoint errors | Verify project URL and region against approved target. |

**Approval Gate**
- Program Manager + Architecture Authority approve Phase 1 exit.

---

### Phase 2 — Release Preparation

**Objectives**
- Enact and verify the Deployment Freeze.
- Promote a Release Candidate to an approved Production Release.
- Assemble and validate the Production Deployment Package.
- Execute the Dry Run and confirm rollback readiness.
- Finalize the Production Cutover Plan.

**Activities**
1. Enact Deployment Freeze:
   - Freeze the repository at the approved commit.
   - Freeze the migration chain.
   - Freeze the Edge Function set and build inputs.
   - Freeze the release version and release tag.
   - Freeze the deployment package contents.
   - Verify a clean working tree.
2. Verify Release Governance:
   - Confirm the Release Candidate matches the approved Production Deployment Baseline.
   - Assign the Release Version.
   - Apply or verify the Release Tag.
3. Assemble the Production Deployment Package:
   - Commit SHA
   - Release Tag
   - Approved Production Asset Inventory
   - Deployment Wave Plan
   - Migration Baseline
   - Edge Function Baseline
   - Storage Configuration
   - Authentication Configuration
   - Environment Reference
   - Rollback Target
4. Perform the Dry Run / Deployment Simulation:
   - Validate the deployment sequence.
   - Validate the execution plan.
   - Validate required tooling.
   - Validate expected outputs.
   - Validate rollback readiness.
5. Finalize the Production Cutover Plan:
   - Maintenance Window
   - Expected Downtime
   - Communication Plan
   - Deployment Owners
   - Decision Authority
   - Rollback Trigger
   - Rollback Decision Authority
   - Completion Criteria
6. Produce the Phase 2 evidence package.

**Required Inputs**
- Phase 1 approved exit record
- Approved Production Deployment Baseline record
- Clean repository at the approved commit and tag
- Release governance checklist
- Deployment package template
- Staging or simulation environment for the Dry Run
- Maintenance window schedule

**Deliverables**
1. Deployment Freeze record
2. Release Candidate record
3. Release Approval record
4. Release Tag
5. Production Deployment Package
6. Deployment Wave Plan
7. Dry Run report
8. Production Cutover Plan
9. Phase 2 release preparation evidence package

**Entry Criteria**
- Phase 1 exit approved.
- Production Deployment Baseline approved and frozen.
- Release Authority available to approve release promotion.

**Exit Criteria**
- Deployment Freeze is enacted and verified.
- Release Candidate is promoted to Production Release with a Release Tag.
- Production Deployment Package is complete and checked; it explicitly references the approved Production Asset Inventory and the approved Deployment Wave Plan.
- Dry Run passes without unresolved blockers.
- Production Cutover Plan is approved.
- No unresolved blockers remain.

**Risks**
| Risk | Impact | Mitigation |
|---|---|---|
| Freeze broken | Uncontrolled artifact changes | Re-freeze and re-run release preparation; enforce change control. |
| Release candidate mismatch | Deploy wrong baseline | Compare package to approved baseline before approval. |
| Incomplete deployment package | Missing deployable assets | Use a package checklist; verify all components before Dry Run. |
| Dry Run failure | Undiscovered deployment blocker | Resolve all blockers; re-run Dry Run until pass. |
| Cutover plan gaps | Delayed or unsafe cutover | Review with Deployment Owners and Decision Authority. |

**Approval Gate**
- Program Manager + Release Authority approve Phase 2 exit.

---

### Phase 3 — Production Deployment

**Objectives**
- Execute the approved Production Cutover Plan according to the Deployment Wave Plan.
- Apply the approved database baseline to production.
- Publish Edge Functions to the production Edge Runtime.
- Configure storage buckets, permissions, and policies.
- Configure authentication providers, JWT behavior, and redirect URLs.
- Capture immediate post-deployment health evidence for each wave and the full cutover.

**Activities**
1. Confirm the maintenance window is active and communication is sent per the cutover plan.
2. Verify the Production Deployment Package is the only source of deployment inputs.
3. Execute Wave 1 (Database Layer): apply the canonical migration chain to the production database using the approved Supabase CLI process.
4. Execute Wave 2 (Edge Runtime): publish each Edge Function required for production operation.
5. Execute Wave 3 (Storage Layer): provision or verify storage buckets and apply bucket-level policies.
6. Execute Wave 4 (Authentication Layer): apply auth provider settings, redirect URLs, and JWT configuration per the approved target.
7. Execute Wave 5 (Validation Layer): execute wave-level validations, smoke tests, and immediate health checks.
8. Capture deployment logs and outputs for each wave.
9. Perform a post-deployment baseline comparison to confirm applied state matches approved baseline.
10. Produce the Phase 3 evidence package.

**Deployment Wave Plan**

The Deployment Wave Plan defines the execution sequence within Phase 3. Governance remains phase-based; deployment execution is wave-based. Each wave has defined objectives, scope, inputs, deliverables, validation, rollback trigger, and approval requirement. The next wave starts only after the current wave is validated and approved.

**Wave 1 — Database Layer**

**Objectives**
- Apply the approved canonical migration chain to the production database.
- Establish the production schema, SQL functions, views, triggers, extensions, policies, RLS, and indexes as defined in the approved baseline.

**Scope**
- Database migrations and schema objects only.
- No Edge Function, storage, or auth changes.

**Inputs**
- Approved Production Deployment Baseline
- Approved Production Asset Inventory (database section)
- Canonical migration chain
- Production database credentials (short-lived, least-privilege)

**Deliverables**
- Migration application log
- Applied-migration list
- Schema comparison evidence

**Validation**
- Schema matches the canonical baseline.
- All migrations are applied in order.
- No unplanned schema drift is detected.

**Rollback Trigger**
- Migration failure mid-chain, post-apply schema mismatch, or unrecoverable database error.

**Approval Requirement**
- Program Manager + Engineering Lead approve Wave 1 exit before Wave 2 begins.

**Wave 2 — Edge Runtime**

**Objectives**
- Build and publish all required Edge Functions to the production Edge Runtime.
- Verify each function version and deployment status.

**Scope**
- Edge Functions and their deployment dependencies.
- No database, storage, or auth configuration changes.

**Inputs**
- Approved Production Deployment Baseline
- Approved Production Asset Inventory (Edge Runtime section)
- Edge Function source at the frozen commit
- Build tooling and secrets

**Deliverables**
- Edge Function deployment summary
- Function version identifiers
- Deployment logs

**Validation**
- Each Edge Function is reachable and returns the expected response.
- Function version matches the baseline.
- No build or publish errors remain.

**Rollback Trigger**
- Edge Function build failure, runtime error, or incorrect function behavior.

**Approval Requirement**
- Engineering Lead + Architecture Authority approve Wave 2 exit before Wave 3 begins.

**Wave 3 — Storage Layer**

**Objectives**
- Provision or verify required storage buckets.
- Apply bucket-level policies, permissions, and CORS settings per the approved baseline.

**Scope**
- Storage buckets, policies, and permissions.
- No database, Edge Function, or auth provider changes.

**Inputs**
- Approved Production Deployment Baseline
- Approved Production Asset Inventory (Storage section)
- Storage target configuration

**Deliverables**
- Storage configuration evidence
- Bucket list, policy names, and permission summary

**Validation**
- Required buckets exist.
- Policies enforce intended access control.
- Upload and download paths function correctly.

**Rollback Trigger**
- Policy or permission error causing unauthorized access or broken uploads.

**Approval Requirement**
- Engineering Lead + Architecture Authority approve Wave 3 exit before Wave 4 begins.

**Wave 4 — Authentication Layer**

**Objectives**
- Configure authentication providers, redirect URLs, and JWT settings per the approved target.

**Scope**
- Auth providers, redirect URLs, and JWT configuration.
- No database, Edge Function, or storage changes.

**Inputs**
- Approved Production Deployment Baseline
- Approved Production Asset Inventory (Authentication section)
- Auth provider settings and test accounts

**Deliverables**
- Auth configuration evidence
- Provider and redirect URL summary
- JWT configuration summary

**Validation**
- Auth flows succeed for configured providers.
- Redirect URLs and token behavior match the baseline.
- No provider misconfiguration is present.

**Rollback Trigger**
- Provider or redirect failure preventing login, or JWT misconfiguration.

**Approval Requirement**
- Program Manager + Engineering Lead + Architecture Authority approve Wave 4 exit before Wave 5 begins.

**Wave 5 — Validation Layer**

**Objectives**
- Validate the entire deployed platform after the prior waves.
- Execute smoke tests, integration tests, rollback scripts, and immediate monitoring checks.

**Scope**
- Cross-layer validation, smoke tests, integration tests, and monitoring dashboards.
- Does not modify deployed state.

**Inputs**
- Approved Production Deployment Baseline
- Approved Production Asset Inventory (Validation Assets section)
- Test scripts, test data, monitoring dashboards
- Rollback scripts

**Deliverables**
- Wave validation report
- Smoke test execution report
- Integration test execution report
- Rollback validation evidence
- Immediate post-deployment monitoring log

**Validation**
- Smoke and integration tests pass.
- End-to-end workflows operate correctly.
- Rollback procedure is confirmed executable.
- Monitoring dashboards show expected health signals.

**Rollback Trigger**
- Critical validation failure or unresolvable cross-layer issue; triggers full cutover rollback if needed.

**Approval Requirement**
- Program Manager + Engineering Lead + Architecture Authority approve Wave 5 exit; this also constitutes Phase 3 exit approval.

**Required Inputs**
- Phase 2 approved exit record
- Approved Production Deployment Baseline
- Approved Production Deployment Package
- Approved Production Cutover Plan
- Deployment credentials (short-lived, least-privilege)
- Edge Function build artifacts
- Storage and auth configuration target state

**Deliverables**
1. Production Cutover Plan execution record
2. Database migration application log and applied-migration list
3. Edge Function deployment summary (function name, deployment status, version identifier)
4. Storage configuration evidence (bucket list, policy names, permission summary)
5. Auth configuration evidence (providers enabled, redirect URLs, JWT settings summary)
6. Immediate post-deployment monitoring log
7. Post-deployment baseline comparison report
8. Deployment Wave Plan execution record (wave-by-wave approval and validation evidence)
9. Phase 3 deployment evidence package

**Entry Criteria**
- Phase 2 exit approved.
- Maintenance window or controlled release mechanism active.
- Deployment credentials issued and validated.
- Rollback authority and decision authority are named and reachable.

**Exit Criteria**
- The Production Cutover Plan is executed without unresolved blockers.
- All deployment waves are executed, validated, and approved according to the Deployment Wave Plan.
- All approved migrations are applied and match the canonical baseline.
- Edge Functions are published and reachable.
- Storage is configured and policies are active.
- Auth configuration matches the approved target.
- Immediate post-deployment health checks pass.
- No deployment errors remain unaddressed.

**Risks**
| Risk | Impact | Mitigation |
|---|---|---|
| Migration failure mid-chain | Partial schema state | Apply in order; test rollback on staging first. |
| Edge Function deployment failure | Missing backend capability | Deploy one function at a time or in validated groups; capture logs. |
| Policy misconfiguration | Unauthorized access or broken uploads | Verify policy behavior in a non-production validation step. |
| Auth misconfiguration | Users cannot log in | Confirm redirect URLs and provider settings before enabling. |
| Cutover overrun | Exceeded downtime | Include buffer in maintenance window; trigger rollback if needed. |

**Approval Gate**
- Program Manager + Engineering Lead + Architecture Authority approve Phase 3 exit.

---

### Phase 4 — Production Validation

**Objectives**
- Verify that the deployed platform is functionally correct and operational.
- Confirm schema, RPC, Edge Function, Auth, and Storage behavior.
- Execute smoke tests and integration tests.
- Validate rollback capability.
- Complete the post-deployment monitoring checkpoints.

**Activities**
1. Schema validation: compare production schema against the canonical baseline.
2. RPC validation: invoke key database functions and confirm expected results.
3. Edge Function validation: call each deployed function through its production endpoint and verify behavior.
4. Auth validation: exercise login, token refresh, provider flows, and redirect behavior.
5. Storage validation: test upload, download, and policy enforcement.
6. Smoke tests: confirm the application can start and perform critical paths.
7. Integration tests: confirm end-to-end workflows across the deployed layers.
8. Rollback validation: verify that the documented rollback steps can be executed in a controlled environment or proof-of-concept.
9. Execute post-deployment monitoring checkpoints at 15 minutes, 30 minutes, 1 hour, and 24 hours:
   - Health checks
   - Error rates
   - Key functional checks
10. Produce the Phase 4 evidence package.

**Required Inputs**
- Phase 3 approved exit record
- Production API endpoints and credentials for read-only and functional testing
- Test scripts and expected results
- Rollback procedure document
- Monitoring checklist and alerting

**Deliverables**
1. Schema validation report
2. RPC validation report
3. Edge Function validation report
4. Auth validation report
5. Storage validation report
6. Smoke test execution report
7. Integration test execution report
8. Rollback validation evidence
9. Post-deployment monitoring log (immediate, 15 min, 30 min, 1 hour, 24 hour)
10. Phase 4 validation evidence package

**Entry Criteria**
- Phase 3 exit approved.
- Test accounts, test data, and read-only credentials available.
- Validation environment and scripts prepared.
- Monitoring and alerting available.

**Exit Criteria**
- Schema matches the approved baseline.
- RPC calls return expected results.
- Edge Functions respond correctly.
- Auth flows succeed for configured providers.
- Storage operations succeed and policies enforce correctly.
- Smoke and integration tests pass.
- Rollback procedure is validated.
- Post-deployment monitoring is complete through the 24-hour checkpoint.
- No unresolved blockers remain.

**Risks**
| Risk | Impact | Mitigation |
|---|---|---|
| Validation misses a critical path | Production user impact | Cover critical paths in smoke and integration tests. |
| Test data pollution | False validation results | Use isolated test tenants or clean test data sets. |
| Rollback procedure untested | Inability to recover | Execute rollback in a staging or proof environment. |
| Cross-layer integration failure | Feature appears broken | Test end-to-end flows explicitly. |
| Monitoring alert missed | Delayed incident response | Define owners and escalation for each checkpoint. |

**Approval Gate**
- Program Manager + Independent Verification Authority approve Phase 4 exit.

---

### Phase 5 — Production Acceptance & Hypercare

**Objectives**
- Consolidate all evidence into an acceptance package.
- Obtain the Independent Acceptance Authority recommendation.
- Secure Program Sponsor formal acceptance.
- Execute Hypercare through the 24-hour, 72-hour, and 7-day checkpoints.
- Close the program only after successful Hypercare completion.

**Activities**
1. Assemble the final evidence package from Phases 1–4.
2. Conduct an acceptance review with the Independent Acceptance Authority.
3. Document any observations, waivers, or follow-up actions.
4. Produce the final acceptance record.
5. Begin Hypercare:
   - 24-hour checkpoint
   - 72-hour checkpoint
   - 7-day checkpoint
6. Monitor production health, error rates, and user-impacting issues during Hypercare.
7. Handle incidents according to the incident handling plan and escalation path.
8. Confirm Hypercare exit criteria are met.
9. Produce the program closeout record.
10. Archive program artifacts according to repository governance.

**Required Inputs**
- Phase 4 approved exit record
- All phase evidence packages
- Hypercare checklist and ownership roster
- Incident handling and escalation procedure
- Charter and master plan
- Risk register and issue log

**Deliverables**
1. Final acceptance evidence package
2. Independent Acceptance Authority recommendation
3. Production acceptance record
4. Observation and follow-up action log
5. Hypercare log (24-hour, 72-hour, 7-day checkpoints)
6. Program closeout record

**Entry Criteria**
- Phase 4 exit approved.
- All evidence packages are complete and accessible.
- Hypercare ownership and monitoring are in place.
- Acceptance review scheduled.

**Exit Criteria**
- Independent Acceptance Authority recommends acceptance (or deferral with conditions).
- Program Sponsor formally accepts the deployed platform, or documents a deferral decision.
- Hypercare is completed through the 7-day checkpoint with exit criteria met.
- Closeout record is approved and archived.

**Risks**
| Risk | Impact | Mitigation |
|---|---|---|
| Evidence gaps | Delayed acceptance | Verify package completeness before the review. |
| Unresolved observations | Acceptance withheld | Log observations with owners and target dates. |
| Authority unavailability | Stalled closeout | Schedule gates in advance and document alternates. |
| Hypercare incident not handled | Production impact or acceptance reversal | Define ownership, escalation, and rollback trigger. |
| Hypercare exit criteria unclear | Premature closeout | Document exit criteria before Hypercare begins. |

**Approval Gate**
- Independent Acceptance Authority recommendation + Program Sponsor formal acceptance.

---

## 5. Milestones

| Milestone | Phase | Definition | Evidence |
|---|---|---|---|
| M1 — Baseline Frozen | 1 | Production Deployment Baseline identified and approved. | Baseline record with checksum. |
| M2 — Git Governance Verified | 1 | Repository status, branch, commit, and tag verified clean. | Git governance checklist. |
| M3 — Tooling & Secrets Ready | 1 | CLI, CI/CD, and all secret categories verified present. | Readiness checklists. |
| M4 — Asset Inventory Approved | 1 | Production Asset Inventory created and approved; referenced by the Production Deployment Package. | Approved Production Asset Inventory. |
| M5 — Release Approved | 2 | Release Candidate promoted to Production Release with Release Tag. | Release approval record and tag. |
| M6 — Deployment Package Ready | 2 | Production Deployment Package complete and explicitly references the approved Production Asset Inventory. | Deployment package manifest. |
| M7 — Deployment Wave Plan Approved | 2 | Deployment Wave Plan approved and included in the Production Deployment Package. | Approved Deployment Wave Plan. |
| M8 — Dry Run Passed | 2 | Dry Run report shows no unresolved blockers. | Dry Run report. |
| M9 — Cutover Plan Approved | 2 | Production Cutover Plan approved by Decision Authority. | Approved cutover plan. |
| M10 — Database Wave Complete | 3 | Wave 1 database migrations applied and validated. | Migration log, schema report, and wave approval. |
| M11 — Edge Runtime Wave Complete | 3 | Wave 2 Edge Functions deployed and reachable. | Deployment summary, endpoint checks, and wave approval. |
| M12 — Storage Wave Complete | 3 | Wave 3 storage buckets and policies configured. | Configuration evidence and wave approval. |
| M13 — Authentication Wave Complete | 3 | Wave 4 authentication providers, redirect URLs, and JWT configured. | Auth configuration evidence and wave approval. |
| M14 — Validation Wave Complete | 3 | Wave 5 validation, smoke tests, and immediate monitoring pass. | Wave validation report and Phase 3 exit approval. |
| M15 — Functional Validation Complete | 4 | Schema, RPC, Edge Function, Auth, and Storage validations pass. | Validation reports. |
| M16 — Smoke & Integration Pass | 4 | Critical paths and end-to-end workflows pass. | Test execution reports. |
| M17 — Rollback Validated | 4 | Rollback steps confirmed executable. | Rollback validation evidence. |
| M18 — 24-Hour Monitoring Complete | 4 | Post-deployment monitoring through 24-hour checkpoint is complete. | Monitoring log. |
| M19 — Production Accepted | 5 | Program Sponsor formally accepts the deployed platform. | Acceptance record. |
| M20 — Hypercare Complete | 5 | Hypercare completed through 7-day checkpoint. | Hypercare record. |
| M21 — Program Closed | 5 | Closeout record archived. | Closeout record. |

---

## 6. Governance Chain

```text
Program Sponsor
    └── Program Manager
            ├── Architecture Authority
            ├── Engineering Lead
            ├── Release Authority
            ├── DevOps / Deployment Specialist
            ├── Independent Verification Authority
            └── Independent Acceptance Authority
```

| Decision | Owner | Escalation |
|---|---|---|
| Charter approval | Program Sponsor | — |
| Scope / baseline change | Program Manager recommends, Program Sponsor approves | Program Sponsor |
| Phase 1 exit | Program Manager + Architecture Authority | Program Sponsor |
| Phase 2 exit | Program Manager + Release Authority | Program Sponsor |
| Phase 3 exit | Program Manager + Engineering Lead + Architecture Authority | Program Sponsor |
| Phase 4 exit | Program Manager + Independent Verification Authority | Program Sponsor |
| Phase 5 exit | Independent Acceptance Authority + Program Sponsor | Program Sponsor |

---

## 7. Decision Gates

| Gate | Location | Criteria | Authority |
|---|---|---|---|
| G1 — Charter Gate | Before Phase 1 | Charter approved and authorities named | Program Sponsor |
| G2 — Readiness Gate | End of Phase 1 | Baseline, git governance, tooling, secrets, environment, Production Asset Inventory approved, and rollback strategy verified | Program Manager + Architecture Authority |
| G3 — Release Gate | End of Phase 2 | Freeze verified, release approved, package complete, dry run passed, Deployment Wave Plan approved, cutover plan approved | Program Manager + Release Authority |
| G4 — Deployment Gate | End of Phase 3 | All deployment waves executed, validated, and approved; all layers match baseline | Program Manager + Engineering Lead + Architecture Authority |
| G5 — Validation Gate | End of Phase 4 | All validations, rollback test, and 24-hour monitoring pass | Program Manager + Independent Verification Authority |
| G6 — Acceptance Gate | End of Phase 5 | Full evidence package, hypercare, and closeout reviewed and accepted | Independent Acceptance Authority + Program Sponsor |

---

## 8. Artifact List

| Artifact | Owner | Phase | Form |
|---|---|---|---|
| Production Deployment Baseline record | Architecture Authority | 1 | Markdown / checksum file |
| Git governance verification checklist | DevOps / Deployment Specialist | 1 | Markdown checklist |
| Canonical production baseline record | Architecture Authority | 1 | Markdown / checksum file |
| Production Asset Inventory | Engineering Lead | 1 | Markdown / table |
| Edge Function inventory | Engineering Lead | 1 | Markdown / table |
| Storage bucket and policy inventory | Engineering Lead | 1 | Markdown / table |
| Auth configuration verification checklist | DevOps / Deployment Specialist | 1 | Markdown checklist |
| Secret presence verification checklist | DevOps / Deployment Specialist | 1 | Markdown checklist (values redacted) |
| Environment configuration verification checklist | DevOps / Deployment Specialist | 1 | Markdown checklist |
| Rollback strategy summary | Engineering Lead | 1 | Markdown |
| Deployment Freeze record | Release Authority | 2 | Markdown / log |
| Release Candidate record | Release Authority | 2 | Markdown |
| Release Approval record | Release Authority | 2 | Markdown / signed record |
| Release Tag | Engineering Lead | 2 | Git tag |
| Production Deployment Package | Engineering Lead | 2 | Markdown / package manifest |
| Deployment Wave Plan | Engineering Lead | 2 | Markdown / table |
| Dry Run report | Engineering Lead | 2 | Markdown report |
| Production Cutover Plan | Program Manager | 2 | Markdown |
| Migration application log | Engineering Lead | 3 | CLI output / log file |
| Edge Function deployment summary | Engineering Lead | 3 | Markdown / table |
| Storage configuration evidence | Engineering Lead | 3 | Markdown / table |
| Auth configuration evidence | DevOps / Deployment Specialist | 3 | Markdown / table |
| Post-deployment baseline comparison | Engineering Lead | 3 | Markdown report |
| Immediate post-deployment monitoring log | DevOps / Deployment Specialist | 3 | Markdown / log |
| Schema validation report | Independent Verification Authority | 4 | Markdown report |
| RPC validation report | Independent Verification Authority | 4 | Markdown report |
| Edge Function validation report | Independent Verification Authority | 4 | Markdown report |
| Auth validation report | Independent Verification Authority | 4 | Markdown report |
| Storage validation report | Independent Verification Authority | 4 | Markdown report |
| Smoke test execution report | Independent Verification Authority | 4 | Markdown report |
| Integration test execution report | Independent Verification Authority | 4 | Markdown report |
| Rollback validation evidence | Engineering Lead | 4 | Markdown / log |
| Post-deployment monitoring log | Independent Verification Authority | 4 | Markdown / log |
| Acceptance record | Independent Acceptance Authority | 5 | Markdown / signed record |
| Hypercare log | Program Manager | 5 | Markdown / log |
| Observation and follow-up action log | Program Manager | 5 | Markdown |
| Program closeout record | Program Manager | 5 | Markdown |

---

## 9. Traceability

Traceability is maintained by mapping every requirement in the charter to a phase, activity, deliverable, and evidence item.

| Charter Requirement | Phase | Activity | Deliverable | Evidence Owner |
|---|---|---|---|---|
| Production Deployment Baseline | 1 | Identify and document baseline | Production Deployment Baseline record | Architecture Authority |
| Git governance | 1 | Verify repository status, branch, commit, tag | Git governance verification checklist | DevOps / Deployment Specialist |
| Canonical migration chain | 1 / 3 | Freeze baseline / Apply migrations | Baseline record + migration application log | Architecture Authority / Engineering Lead |
| SQL functions, triggers, views, extensions, policies, RLS, indexes | 3 | Apply migrations | Migration application log + schema validation report | Engineering Lead / Verification Authority |
| Edge Functions | 1 / 3 / 4 | Inventory / Deploy / Validate | Edge Function inventory + deployment summary + validation report | Engineering Lead / Verification Authority |
| Storage buckets, permissions, policies | 1 / 3 / 4 | Inventory / Configure / Validate | Storage configuration evidence + validation report | Engineering Lead / Verification Authority |
| Auth configuration, JWT, providers, redirects | 1 / 3 / 4 | Inventory / Configure / Validate | Auth configuration evidence + validation report | DevOps / Verification Authority |
| Secret verification | 1 | Presence checks | Secret presence verification checklist | DevOps / Deployment Specialist |
| Environment verification | 1 | Check project/region/endpoints | Environment configuration verification checklist | DevOps / Deployment Specialist |
| Frontend/backend dependencies | 1 | Map dependencies | Dependency mapping note | Architecture Authority |
| Deployment Freeze | 2 | Enact and verify freeze | Deployment Freeze record | Release Authority |
| Release Governance | 2 | Promote release candidate to production release | Release Approval record + Release Tag | Release Authority |
| Production Deployment Package | 2 | Assemble package | Production Deployment Package | Engineering Lead |
| Dry Run | 2 | Run deployment simulation | Dry Run report | Engineering Lead |
| Production Cutover Plan | 2 / 3 | Finalize / Execute cutover | Production Cutover Plan + execution record | Program Manager |
| Schema, RPC, Edge Function, Auth, Storage validation | 4 | Execute validations | Validation reports | Independent Verification Authority |
| Smoke and integration tests | 4 | Execute tests | Test execution reports | Independent Verification Authority |
| Rollback validation | 4 | Validate rollback | Rollback validation evidence | Engineering Lead |
| Post-deployment monitoring | 4 | Execute monitoring checkpoints | Post-deployment monitoring log | Independent Verification Authority |
| Hypercare | 5 | Execute 24/72/7 day checkpoints | Hypercare log | Program Manager |
| Acceptance | 5 | Conduct acceptance review | Production acceptance record | Independent Acceptance Authority |
| Production Asset Inventory | 1 | Create and approve the inventory | Production Asset Inventory record | Engineering Lead |
| Deployment Wave Strategy | 3 | Execute the Deployment Wave Plan | Wave validation reports and phase evidence | Engineering Lead |

---

## 10. Risk Register Categories

| Category | Examples | Owner |
|---|---|---|
| **Baseline** | Wrong artifact set frozen; migration chain drift after freeze | Architecture Authority |
| **Git** | Uncommitted changes; wrong branch or tag; missing release commit | DevOps / Deployment Specialist |
| **Secrets** | Missing, expired, or misconfigured secret | DevOps / Deployment Specialist |
| **Tooling** | CLI version mismatch; authentication failure | DevOps / Deployment Specialist |
| **Environment** | Wrong project/region; network or DNS issue | Engineering Lead |
| **Freeze** | Artifact changed after freeze; freeze not verified | Release Authority |
| **Release** | Release candidate rejected; release tag mismatch | Release Authority |
| **Package** | Missing or incomplete deployment package | Engineering Lead |
| **Dry Run** | Dry Run blocker not resolved | Engineering Lead |
| **Cutover** | Downtime overrun; communication gap | Program Manager |
| **Deployment** | Migration failure; Edge Function publish failure | Engineering Lead |
| **Configuration** | Incorrect policy, bucket, or auth setting | Architecture Authority |
| **Validation** | Test misses a critical path; test data pollution | Independent Verification Authority |
| **Rollback** | Untested or incomplete rollback procedure | Engineering Lead |
| **Monitoring** | Missed checkpoint; alert not escalated | DevOps / Deployment Specialist |
| **Hypercare** | Incident not handled; exit criteria unclear | Program Manager |
| **Acceptance** | Missing evidence; authority unavailability | Program Manager |
| **Asset Inventory** | Missing or incomplete deployable asset; inventory not referenced by the Production Deployment Package | Engineering Lead |
| **Deployment Wave** | Wave exit not validated; out-of-order wave execution; wave rollback not tested | Engineering Lead |
| **Change Control** | Scope creep; unapproved baseline change | Program Manager |

---

## 11. Rollback Strategy (High Level)

Rollback is planned per deployable layer and per Deployment Wave. The strategy is to restore the previous known-good state with the smallest possible blast radius. Wave-level rollback triggers are defined in the Deployment Wave Plan; a wave-level rollback is executed before invoking the full cutover rollback sequence. Rollback decisions are made by the Rollback Decision Authority defined in the Production Cutover Plan.

| Layer | Rollback Trigger | Rollback Approach |
|---|---|---|
| Database | Migration failure or post-deploy schema mismatch | Use Supabase migrations to re-apply previous known-good baseline; restore from backup if required. |
| Edge Functions | Function failure or incorrect behavior | Re-deploy the previous known-good function bundle; disable or redirect invocations as needed. |
| Storage | Policy or permission error | Revert bucket/policy configuration to previous state; restrict public access if necessary. |
| Auth | Provider or redirect failure | Revert provider settings and redirect URLs to previous state; invalidate affected sessions if needed. |
| Environment / Secrets | Misconfigured environment variable | Update secret manager value and restart affected services; no code redeploy required. |
| Full Cutover | Cutover overrun or critical incident | Execute the full rollback sequence in the Production Cutover Plan; restore previous release and notify stakeholders. |

**Rollback validation** must be performed before Phase 3 deployment. The procedure is:
1. Document the rollback steps for each layer and the full cutover.
2. Demonstrate the steps in a non-production environment or proof-of-concept.
3. Record rollback validation evidence.
4. Confirm rollback authority and timing in the maintenance window.
5. Verify the Rollback Target is recorded in the Production Deployment Package.

---

## 12. Validation Strategy

Validation is performed in three layers: correctness, function, and end-to-end. Wave-level validation is also performed after each Deployment Wave in Phase 3; the Validation Wave (Wave 5) provides the cross-layer validation that supports Phase 4.

1. **Correctness validation**
   - Schema matches canonical baseline.
   - RPC signatures and results match expected contract.
   - Edge Functions are reachable and return expected responses.
   - Auth provider configuration and token behavior are correct.
   - Storage policies enforce intended access control.

2. **Functional validation**
   - Core user and tenant operations succeed.
   - Subscription, billing, and checkout workflows operate end-to-end (where safe to test in production).
   - Notifications (email, SMS) are triggered correctly without exposing real user data.

3. **End-to-end validation**
   - Smoke tests confirm the frontend can communicate with the backend.
   - Integration tests cover critical paths: login, tenant creation, inventory update, checkout, and admin operations.
   - Rollback test confirms recovery is possible.
   - Post-deployment monitoring confirms stability at immediate, 15-minute, 30-minute, 1-hour, and 24-hour checkpoints.

All validation is evidence-backed. The Independent Verification Authority reviews the evidence and may re-run a sample of checks.

---

## 13. Acceptance Strategy

Acceptance is the formal decision that the deployed platform is fit for production use.

**Acceptance criteria**
- All phase exit gates are approved.
- All evidence packages are complete and traceable to the charter.
- No unresolved critical or high-risk issues remain.
- Rollback capability is validated.
- Post-deployment monitoring is complete through the 24-hour checkpoint.
- Hypercare is completed through the 7-day checkpoint.
- Program Sponsor or delegated authority reviews the final package.

**Acceptance procedure**
1. Independent Acceptance Authority reviews the consolidated evidence package.
2. Acceptance Authority records a recommendation: accept, accept with observations, or defer.
3. Program Sponsor issues the formal acceptance or deferral decision.
4. Any observations are logged with owners and target resolution dates.
5. Program closeout is initiated only after successful Hypercare.

---

## 14. Closeout Strategy

Program closeout occurs after formal acceptance and successful Hypercare.

1. **Archive program artifacts.** Charter, master plan, phase evidence, acceptance record, hypercare record, and closeout record are moved to the approved archive location.
2. **Record lessons learned.** Any material issues or process improvements are captured in a short lessons-learned note.
3. **Hand over operational ownership.** Day-to-day operations and monitoring return to the standard engineering and support model.
4. **Deactivate program authorities.** The special program governance roles are dissolved unless extended by a follow-on program.
5. **Final sign-off.** Program Manager and Program Sponsor approve the closeout record.

---

*End of Master Plan*
