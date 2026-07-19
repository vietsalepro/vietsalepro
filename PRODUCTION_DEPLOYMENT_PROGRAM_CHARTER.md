# Production Deployment Program Charter

**Program:** VietSalePro v7 — Production Deployment Program  
**Version:** 1.2  
**Date:** 2026-07-19  
**Status:** Proposed — Version 1.2 — Pending Program Sponsor Approval  
**Basis:** Independent program established after formal closure of the System Recovery Program. Recovery artifacts are historical reference only.

---

## 1. Program Purpose

The Production Deployment Program exists to safely transition VietSalePro v7 from a recovered, repository-consistent state to a live, operational production platform on Supabase and Vercel. This program is a new governance boundary: it does not reopen the closed Recovery Program and it does not authorize new feature work. Its only purpose is to plan, gate, and evidence a production-ready deployment of the artifacts that already exist.

---

## 2. Program Objectives

| Objective | Desired End State |
|---|---|
| Establish a canonical production migration baseline | A single, ordered, verified migration chain is approved for production and its checksums are recorded. |
| Deploy the production database | Schema, SQL functions, triggers, views, extensions, policies, RLS, and indexes are applied to the production Supabase project. |
| Deploy production Edge Functions | All required Edge Functions are built, validated, and published to the production Edge Runtime. |
| Configure production storage | Buckets, permissions, and policies are provisioned and verified. |
| Configure production authentication | Auth settings, providers, JWT handling, and redirect URLs are verified against production requirements. |
| Verify production secrets and environment | Every required secret and environment value is confirmed present and correct without exposing values. |
| Validate the deployed platform | Schema, RPC, Edge Function, Auth, Storage, smoke, and integration validations pass. |
| Obtain independent acceptance | A named authority accepts the deployed platform as fit for production use. |

---

## 3. Program Scope

### In Scope

- Database deployment: canonical migration chain, SQL functions, triggers, views, extensions, policies, RLS, and indexes.
- Edge Function deployment planning: inventory, dependency verification, secrets verification, deployment, validation, and rollback considerations.
- Storage configuration: buckets, permissions, and policies.
- Authentication configuration: Auth settings, JWT considerations, providers, and redirect URLs.
- Secret verification: presence and correctness checks for required secrets by category (values are never exposed).
- Environment verification: Supabase project, production project, region, database, API endpoints, Edge Runtime, Realtime, and Storage.
- Dependency mapping between backend deployment and any frontend deployment required for backend validation.
- Validation: schema, RPC, Edge Function, Auth, Storage, smoke test, integration test, and rollback validation.
- Governance: decision gates, approvals, evidence, and exit criteria for each phase.

### Out of Scope

- New product features or user-facing capabilities.
- Performance optimization beyond deployment readiness.
- UI redesign, rebranding, or business logic changes.
- Database vendor migration or infrastructure migration away from Supabase.
- Operational incident response outside the deployment objective.
- Detailed frontend release planning, except where required for backend validation.

---

## 4. Production Deployment Governance

This section defines the additional governance controls that apply to every production deployment. These controls are independent of the program's phase structure and must be satisfied before any production change is authorized.

### 4.1 Production Deployment Baseline

The **Production Deployment Baseline** is the single approved deployment target. It contains, at minimum:

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

Every production deployment must deploy exactly one approved Production Deployment Baseline. No deployment may reference an unfrozen or unapproved baseline.

### 4.2 Deployment Freeze

Before a baseline becomes an approved release target, a formal **Deployment Freeze** is enacted. Freeze activities include:

- Freeze the repository at the approved commit.
- Freeze the migration chain; no further migration changes are permitted.
- Freeze the Edge Function set and its build inputs.
- Freeze the release version and release tag.
- Freeze the deployment package contents.
- Verify a clean working tree with no uncommitted or untracked changes.

No deployment artifact may change after the freeze without passing change control and re-entering release preparation.

### 4.3 Release Governance

A deployment release is governed by the following artifacts:

- **Release Candidate** — a frozen artifact set that is ready for production release.
- **Production Release** — an approved Release Candidate that is authorized for production deployment.
- **Release Version** — the semantic or program-specific version assigned to a Production Release.
- **Release Approval** — the formal governance decision that promotes a Release Candidate to a Production Release.
- **Release Tag** — an immutable Git tag that identifies the release commit.

A Release Candidate becomes a Production Release only after:
1. The Deployment Freeze is verified.
2. The Production Deployment Baseline is approved.
3. The Production Deployment Package is complete and checked.
4. The Dry Run passes without unresolved blockers.
5. The Release Authority records Release Approval.

### 4.4 Git Governance

Git state is verified before any release or deployment:

- Repository status matches the approved baseline.
- Working tree is clean.
- Branch verification confirms the release branch.
- Commit verification confirms the approved commit SHA.
- Tag verification confirms the Release Tag points to the release commit.
- Release commit identification is recorded in the baseline.

Deployment shall always reference an approved commit identified by SHA and tag.

### 4.5 Production Deployment Package

The **Production Deployment Package** is a formal deliverable containing all production deployable assets. It explicitly references the approved Production Asset Inventory. It includes:

- Commit SHA
- Release Tag
- Approved Production Asset Inventory
- Migration Baseline
- Edge Function Baseline
- Storage Configuration
- Authentication Configuration
- Environment Reference
- Rollback Target

The package is treated as an immutable artifact. Its contents are frozen at the release gate and are the only source of deployment inputs.

### 4.6 Dry Run

A **Dry Run / Deployment Simulation** is performed before Production Deployment Authorization. The Dry Run validates:

- Deployment sequence
- Execution plan
- Required tooling
- Expected outputs
- Rollback readiness

No production change is performed during the Dry Run. The Dry Run produces a pass/fail record and a list of unresolved blockers.

### 4.7 Production Cutover Plan

The **Production Cutover Plan** governs the transition from the previous production state to the approved baseline. It includes:

- Maintenance Window
- Expected Downtime
- Communication Plan
- Deployment Owners
- Decision Authority
- Rollback Trigger
- Rollback Decision Authority
- Completion Criteria

The cutover plan is approved before Phase 3 entry.

### 4.8 Post-Deployment Monitoring

A formal post-deployment monitoring stage follows the production deployment. Recommended checkpoints:

- Immediate verification
- 15 minutes
- 30 minutes
- 1 hour
- 24 hours

Each checkpoint records expected evidence such as health check results, error rates, and functional checks.

### 4.9 Hypercare

Hypercare extends the Production Acceptance phase. Suggested durations:

- 24 hours
- 72 hours
- 7 days

Hypercare defines:

- Ownership
- Monitoring responsibilities
- Incident handling
- Exit criteria

Program Closeout occurs only after Hypercare is successfully completed.

### 4.10 Production Asset Inventory

The **Production Asset Inventory** is the authoritative inventory of every deployable production asset. Its purpose is to ensure that no deployable component is accidentally omitted from a production release.

The inventory must be created during Production Readiness and approved before the Production Deployment Package is finalized. The approved Production Asset Inventory is explicitly referenced by the Production Deployment Package.

The inventory includes, at minimum:

#### Repository
- Repository URL
- Branch
- Commit SHA
- Release Tag

#### Database
- Migration Chain
- SQL Functions
- Views
- Triggers
- Extensions
- Policies
- RLS
- Indexes

#### Edge Runtime
- Edge Functions
- Function Version
- Deployment Status

#### Storage
- Buckets
- Policies
- Permissions

#### Authentication
- Providers
- Redirect URLs
- JWT Configuration

#### Environment
- Required Environment Variables
- Required Secrets Inventory
- Project Configuration

#### Optional Runtime Components
- Scheduled Jobs
- Cron Jobs
- Background Workers
- Queue Consumers
- Webhooks

#### Validation Assets
- Smoke Tests
- Integration Tests
- Rollback Scripts
- Monitoring Dashboards

### 4.11 Deployment Wave Strategy

A **Deployment Wave** is an execution sequencing unit inside the Production Deployment phase. Deployment Waves do not replace governance phases; governance remains phase-based while deployment execution is wave-based.

The example Deployment Wave sequence is:

```text
Wave 1 — Database Layer
    ↓
Wave 2 — Edge Runtime
    ↓
Wave 3 — Storage Layer
    ↓
Wave 4 — Authentication Layer
    ↓
Wave 5 — Validation Layer
```

The exact wave structure is defined in the Deployment Wave Plan. Wave definitions include objectives, scope, inputs, deliverables, validation criteria, rollback trigger, and approval requirement. Wave exit is recorded before the next wave begins.

---

## 5. Guiding Principles

1. **Production first, not perfect.** The goal is a safe, auditable deployment of the current trusted baseline, not a redesign.
2. **Evidence before acceptance.** No gate is exited without reproducible evidence tied to a named artifact.
3. **No manual secrets exposure.** Secret verification confirms presence and shape; values are never written into plans, logs, or chat.
4. **One production baseline.** A single canonical migration chain and a single set of deployment artifacts define the production target.
5. **Independence of governance.** This program is not an extension of the Recovery Program; it may reference recovered artifacts but must approve its own baseline.
6. **Rollback is a first-class requirement.** Every deployable layer must have a defined rollback path before it is applied.
7. **Least-privilege operations.** Deployment activities use the minimum credentials and scopes required for the step.
8. **No production change without a gate.** Changes to the production target after deployment require re-entry through the change control procedure.

---

## 6. Assumptions

- The System Recovery Program has been formally closed and its artifacts are accepted as reference.
- A production Supabase project exists and is reachable.
- A named Program Sponsor and Program Manager are available to act on approvals.
- The deployment tooling (Supabase CLI, CI/CD, Vercel CLI) is installed and authenticated.
- All required secrets are stored in an approved secret manager; their values are not in the repository.
- The migration chain present in the repository is the candidate production baseline.
- Edge Functions are deployable from the current source without code changes.
- A maintenance window or controlled release mechanism is available for the production cutover.

---

## 7. Constraints

- No source code, migrations, SQL, or Edge Functions may be modified under this program.
- The Supabase CLI may be planned for but not executed by this program.
- No actual deployment is performed by this program.
- No secret values may be exposed in any program document.
- `CURRENT_PHASE.md` and `CURRENT_TASK.md` are not updated by this program.
- Recovery governance may not be reopened or re-authorized.

---

## 8. Governance Model

This program uses a simplified, linear, gated phase model. Each phase has a single entry gate and a single exit gate. A phase may not start until the previous phase exit gate is approved. Version 1.2 finalizes the model by preserving the five-phase structure and adding the Production Asset Inventory and Deployment Wave Strategy as required governance controls.

```text
Program Sponsor authorizes
    └── Phase 1 — Production Readiness
            └── Phase Manager + Architecture Authority approve exit
                └── Phase 2 — Release Preparation
                        └── Program Manager + Release Authority approve exit
                            └── Phase 3 — Production Deployment
                                    └── Program Manager + Engineering Lead + Architecture Authority approve exit
                                        └── Phase 4 — Production Validation
                                                └── Program Manager + Independent Verification Authority approve exit
                                                    └── Phase 5 — Production Acceptance & Hypercare
                                                            └── Program Sponsor formally accepts
```

Decision authority:
- **Program Sponsor**: establishes the program, appoints authorities, and grants final acceptance.
- **Program Manager**: owns the master plan, gates, and phase exit approvals.
- **Architecture Authority**: validates technical baseline and design decisions.
- **Engineering Lead**: owns deployment execution and technical evidence.
- **Release Authority**: reviews the release candidate, dry run, and deployment package; grants release approval.
- **Independent Verification Authority**: validates that exit criteria are met by evidence.
- **Independent Acceptance Authority**: gives the final production acceptance recommendation.

---

## 9. Roles and Responsibilities

| Role | Responsibilities | Authority |
|---|---|---|
| **Program Sponsor** | Charter approval, authority appointment, final acceptance, escalation decision. | Approve/reject charter and final acceptance. |
| **Program Manager** | Maintain the master plan, schedule gates, review evidence, approve phase exits. | Approve phase entries and exits (with co-signers). |
| **Architecture Authority** | Validate canonical baseline, migration chain, environment architecture, and rollback design. | Co-approve Phase 1 and Phase 3 exit. |
| **Engineering Lead** | Produce deployment evidence, execute approved deployment steps in later programs, maintain artifact inventory. | Recommend phase exit; escalate blockers. |
| **Release Authority** | Review release candidate, dry run, and deployment package; confirm freeze and release readiness. | Approve or reject release promotion. |
| **DevOps/Deployment Specialist** | Verify tooling, environment configuration, secrets presence, and CI/CD readiness. | Report readiness status; block if criteria not met. |
| **Independent Verification Authority** | Reproduce validation results, inspect evidence, confirm exit criteria. | Co-approve Phase 4 exit. |
| **Independent Acceptance Authority** | Review all evidence and grant or withhold final production acceptance. | Recommend final acceptance to Sponsor. |

---

## 10. Deliverables

1. **PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md** (this document)
2. **PRODUCTION_DEPLOYMENT_MASTER_PLAN.md** — detailed phase structure and execution plan
3. Production Deployment Baseline record
4. Deployment Freeze record
5. Release Candidate record, Release Approval record, and Release Tag
6. Production Deployment Package
7. Dry Run report
8. Production Cutover Plan
9. Phase gate evidence packages:
   - Phase 1: Readiness evidence (baseline, git, environment, secrets, tooling, rollback)
   - Phase 2: Release preparation evidence (freeze, release approval, package, dry run, cutover plan)
   - Phase 3: Deployment evidence (applied migrations, published functions, configured storage/auth, cutover execution)
   - Phase 4: Validation evidence (test reports, logs, monitoring checkpoints)
   - Phase 5: Acceptance and Hypercare evidence (sign-off record, hypercare logs, closeout)
10. Production Asset Inventory
11. Deployment Wave Plan
12. Rollback plan summary and validation evidence
13. Post-deployment monitoring log and hypercare record
14. Final acceptance record

---

## 11. Success Criteria

- A named production baseline is documented and approved.
- All required deployment artifacts are identified and verified present.
- The Deployment Freeze is enacted and verified.
- A Release Candidate is promoted to an approved Production Release with a Release Tag.
- The Production Deployment Package is complete and checked, and it explicitly references the approved Production Asset Inventory.
- The Deployment Wave Plan is approved before Phase 3 deployment begins.
- The Dry Run passes without unresolved blockers.
- The Production Cutover Plan is approved.
- Every phase exit is supported by evidence and approved by the required authority.
- Post-deployment monitoring is completed through the 24-hour checkpoint.
- Hypercare is completed through the 7-day checkpoint.
- No deployment is performed until acceptance criteria are met.

---

## 12. Exit Criteria

The program exits upon:
- Charter approval by the Program Sponsor.
- Master plan approval by the Program Sponsor or delegated authority.
- Completion of all five phases with approved evidence packages.
- Release Candidate promoted to Production Release and tagged.
- Dry Run passed.
- Production Deployment completed and validated.
- Post-deployment monitoring completed through the 24-hour checkpoint.
- Hypercare completed through the 7-day checkpoint.
- Final acceptance authority recommendation.
- Program Sponsor formal acceptance of the deployed platform, or documented decision to defer.
- Program closeout record archived.

---

## 13. Risk Management Principles

- **Identify early.** Each phase lists risks before work begins; new risks are added to the phase register immediately.
- **Evidence reduces uncertainty.** Risks are mitigated by verification, not by assumption.
- **Escalation path is clear.** Blockers that threaten a phase exit are escalated to the Program Manager within one business day.
- **No blind rollback.** Every deployable layer has a rollback trigger and a recovery step before it is changed.
- **Minimal blast radius.** Deployment is staged by layer; validation follows each layer before the next is touched.
- **Freeze discipline.** Once a Deployment Freeze is enacted, any artifact change requires explicit change control.

---

## 14. Change Control

After the master plan is approved, any change to the following must pass the change control gate:
- Production baseline (migration chain or deployment artifact set)
- Deployment Freeze state
- Release Candidate / Production Release
- Release tag
- Production Deployment Package
- Production Cutover Plan
- Phase exit criteria
- Approval authority assignments
- Scope boundaries
- Rollback strategy

Change control procedure:
1. Change request is logged with originator, reason, and affected deliverables.
2. Architecture Authority assesses technical impact.
3. Program Manager assesses schedule and governance impact.
4. If the change affects scope or risk, Program Sponsor approves or rejects.
5. Approved changes are reflected in the master plan version history and re-baselined evidence.

---

## 15. Approval Authority

| Gate | Required Approver(s) | Evidence Required |
|---|---|---|
| Program Charter | Program Sponsor | Charter document and authority list |
| Master Plan | Program Sponsor | Master plan and risk register |
| Phase 1 Exit | Program Manager + Architecture Authority | Readiness evidence package |
| Phase 2 Exit | Program Manager + Release Authority | Release evidence package (freeze, release approval, package, dry run, cutover plan) |
| Phase 3 Exit | Program Manager + Engineering Lead + Architecture Authority | Deployment evidence package |
| Phase 4 Exit | Program Manager + Independent Verification Authority | Validation evidence package |
| Phase 5 Exit | Independent Acceptance Authority + Program Sponsor | Acceptance record, hypercare record, and closeout evidence |

---

*End of Charter*
