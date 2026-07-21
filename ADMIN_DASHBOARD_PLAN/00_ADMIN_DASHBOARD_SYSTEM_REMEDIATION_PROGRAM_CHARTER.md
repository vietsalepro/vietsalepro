# ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER

**Date:** 2026-07-20

------------------------------------------------------------------------

# 1. Program

**Project**

``` text
VietSalePro
```

**Sub Project**

``` text
Admin Dashboard
```

**Program**

``` text
Admin Dashboard System Remediation Program
```

**Status**

``` text
ACTIVE
```

------------------------------------------------------------------------

# 2. Background

The previous enterprise review program has been completed successfully.

The following documents are **APPROVED** and are now the permanent
**System Source of Truth (SSOT)** for the Admin Dashboard:

``` text
01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md
↓
02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md
↓
03_ADMIN_DASHBOARD_EXECUTION_MODEL.md
↓
04_ADMIN_DASHBOARD_INVESTIGATION_PLAN.md
↓
05_ADMIN_DASHBOARD_FORENSIC_EXECUTION_PROTOCOL.md
↓
06_ADMIN_DASHBOARD_FORENSIC_INVESTIGATION.md
↓
07_ADMIN_DASHBOARD_ROOT_CAUSE_ANALYSIS.md
↓
08_ADMIN_DASHBOARD_FINAL_RECOMMENDATIONS.md
```

These documents define the approved Architecture, Dependency, Execution
Model, Investigation Methodology, Root Cause Analysis and Enterprise
Recommendations.

No future investigation or implementation may contradict these documents
unless they are formally revised.

------------------------------------------------------------------------

# 3. Program Purpose

The objective of this program is **NOT** to redesign the Admin
Dashboard.

The objective is to use the approved SSOT to discover every remaining
inconsistency that exists in the current repository.

The investigation must compare the implementation against the approved
models and identify all remaining defects before any implementation work
begins.

------------------------------------------------------------------------

# 4. Program Mission

The program is divided into two major phases.

## Phase A --- Complete System Investigation

Objective:

-   Read the entire Admin Dashboard implementation.
-   Compare every implementation against the approved SSOT.
-   Discover every remaining inconsistency.

Repository scope includes:

-   React UI
-   Context
-   Hooks
-   Services
-   Business Logic
-   Database Schema
-   Supabase Migrations
-   RPC
-   Edge Functions
-   RLS
-   Triggers
-   Storage
-   Environment Configuration
-   Runtime Execution Flow

Deliverable:

``` text
ADMIN_DASHBOARD_SYSTEM_INCONSISTENCY_REPORT.md
```

Rules:

-   No code changes.
-   No migration changes.
-   No Edge Function changes.
-   No database changes.
-   No implementation.
-   Investigation only.

------------------------------------------------------------------------

## Phase B --- System Remediation

This phase starts only after the investigation report has been
independently reviewed and approved, Phase A has been formally closed,
the baseline has been sealed, and the Phase B Opening Authorization
document has been approved.

Phase B Lifecycle:

``` text
Phase B Opening Authorization
        ↓
Remediation Master Plan
        ↓
Program Owner Decision Record
        ↓
Wave Authorization
        ↓
Engineering Kickoff
        ↓
Implementation Readiness Review
        ↓
Wave Implementation
        ↓
Wave Verification
        ↓
Wave Acceptance
        ↓
Program Certification
```

The Program Owner Decision Record consists of the mandatory governance
decisions that gate Wave Planning and Engineering Kickoff. It is not
an implementation activity.

Phase B shall officially begin only after the Phase B Opening
Authorization document has been approved.

The Remediation Master Plan shall not be created before Phase B has
been formally opened.

------------------------------------------------------------------------

# 5. System Source of Truth (SSOT)

The following documents are the only approved architectural baseline:

-   01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md
-   02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md
-   03_ADMIN_DASHBOARD_EXECUTION_MODEL.md
-   04_ADMIN_DASHBOARD_INVESTIGATION_PLAN.md
-   05_ADMIN_DASHBOARD_FORENSIC_EXECUTION_PROTOCOL.md
-   06_ADMIN_DASHBOARD_FORENSIC_INVESTIGATION.md
-   07_ADMIN_DASHBOARD_ROOT_CAUSE_ANALYSIS.md
-   08_ADMIN_DASHBOARD_FINAL_RECOMMENDATIONS.md

Every observation must be verified against these documents.

------------------------------------------------------------------------

# 6. Investigation Principles

The investigation shall:

-   Never assume.
-   Always collect repository evidence.
-   Always provide traceability.
-   Compare implementation against SSOT.
-   Identify architectural inconsistencies.
-   Identify dependency inconsistencies.
-   Identify execution inconsistencies.
-   Identify business logic inconsistencies.
-   Identify database inconsistencies.
-   Identify migration inconsistencies.
-   Identify RPC inconsistencies.
-   Identify Edge Function inconsistencies.
-   Identify service inconsistencies.
-   Identify UI inconsistencies.

Every issue shall include:

-   Issue ID
-   Evidence
-   Impact
-   Severity
-   Confidence
-   Affected Artifacts
-   Root Cause Candidate

No remediation is allowed during this phase.

------------------------------------------------------------------------

# 7. Long-Term Workflow

``` text
Approved SSOT
        ↓
Repository Investigation
        ↓
System Inconsistency Report
        ↓
Independent Investigation Acceptance Review
        ↓
Acceptance Conditions Implementation
        ↓
Phase A Closeout
        ↓
Baseline Sealing
        ↓
Phase B Opening Authorization
        ↓
Remediation Master Plan
        ↓
Program Owner Decision Record
        ↓
Wave Authorization
        ↓
Engineering Kickoff
        ↓
Implementation Readiness Review
        ↓
Wave Implementation
        ↓
Wave Verification
        ↓
Wave Acceptance
        ↓
Wave Closeout
        ↓
Repository Knowledge Preservation
        ↓
Roadmap / Charter Update
        ↓
Next Wave
        ↓
Program Certification
```

------------------------------------------------------------------------

# 8. Final Objective

The Admin Dashboard shall ultimately achieve full consistency across:

-   Architecture
-   Dependency
-   Runtime Execution
-   Business Logic
-   Database
-   Migrations
-   RPC
-   Edge Functions
-   Services
-   UI
-   Operational Behavior

The target is to eliminate all confirmed inconsistencies before
implementation is declared complete.

------------------------------------------------------------------------

# 9. Governance Roles

**ChatGPT**

-   Principal Software Architect
-   Independent Technical Reviewer
-   Enterprise Quality Gate
-   Methodology Guardian

**Agent**

-   Repository Investigator
-   Evidence Collector
-   Implementation Engineer (only after approval)

**User**

-   Program Owner
-   Final Decision Authority

------------------------------------------------------------------------

# 10. Current Status

``` text
Knowledge Baseline                       : COMPLETE
Repository Investigation                 : COMPLETE
Independent Acceptance Review            : COMPLETE
Acceptance Conditions Implementation     : COMPLETE
Phase A Closeout                         : COMPLETE
Baseline                                 : SEALED
Phase B Opening Authorization            : COMPLETE
Phase B                                  : OPEN
Remediation Master Plan                  : COMPLETE
Program Owner Decisions                  : COMPLETE
Wave Planning                            : COMPLETE
Wave-01 Authorization                    : COMPLETE
Wave-01 Engineering Kickoff              : COMPLETE
Wave-01 Implementation Readiness Review  : COMPLETE
Wave-01 Implementation                   : COMPLETE
Wave-01 Verification                     : COMPLETE
Wave-01 Acceptance                       : COMPLETE
Wave-01 Deployment Synchronization       : COMPLETE
Wave-01 Closeout                         : COMPLETE
Wave-02 Authorization                    : COMPLETE
Wave-02 Engineering Kickoff              : COMPLETE
Wave-02 Implementation Readiness Review  : COMPLETE
Wave-02 Implementation                   : COMPLETE
  Package-01                             : COMPLETE
  Package-02                             : COMPLETE
  Package-03                             : COMPLETE
Wave-02 Verification                     : COMPLETE
Wave-02 Acceptance                       : COMPLETE
Wave-02 Deployment Synchronization       : COMPLETE
Wave-02 Closeout                         : COMPLETE
Wave-03 Authorization                    : COMPLETE
Wave-03 Engineering Kickoff              : COMPLETE
Wave-03 Implementation Readiness Review  : COMPLETE
Wave-03 Package-01 Implementation        : IMPLEMENTED WITH OBSERVATIONS
Wave-03 Package-01 Verification          : COMPLETE
Wave-03 Package-01 Acceptance Review     : COMPLETE
Wave-03 Package-02 Implementation Readiness Review : COMPLETE
Wave-03 Package-02 Implementation        : IMPLEMENTED WITH OBSERVATIONS
Wave-03 Package-02 Verification          : COMPLETE
Wave-03 Package-02 Acceptance Review     : COMPLETE
Wave-03 Package-03 Implementation Readiness Review : COMPLETE
Wave-03 Package-03 Implementation        : IMPLEMENTED WITH OBSERVATIONS
Wave-03 Package-03 Verification          : COMPLETE
Wave-03 Package-03 Acceptance Review     : COMPLETE
Wave-03 Acceptance Review                : READY TO START
Wave-01 Progress                         : COMPLETE
  Package-01                             : COMPLETE
  Package-02                             : COMPLETE
  Package-03                             : COMPLETE
  Wave-01 Implementation                 : COMPLETE
Overall Completion                       : 1 / 1 Wave-03 Packages (100%)
Program Status                           : PACKAGE-03 ACCEPTED WITH OBSERVATIONS
(Updated by 44_ADMIN_DASHBOARD_WAVE-03_PACKAGE-03_ACCEPTANCE_REVIEW.md, 2026-07-21)
```

Wave-03 established the Repository Hygiene governance model.

Repository Baseline Classification is now part of the permanent governance framework.

AI Development Infrastructure has been formally recognized.

These are governance milestones rather than implementation milestones.

------------------------------------------------------------------------

# 11. Program Transition Rules

Phase B SHALL NOT begin until ALL of the following are complete:

-   Investigation completed
-   Acceptance Review completed
-   Acceptance Conditions implemented
-   Phase A formally closed
-   Baseline officially sealed
-   Phase B Opening Authorization document approved

No remediation activity may begin before these conditions are satisfied.

Phase B shall officially begin only after the Phase B Opening
Authorization document has been approved.

The Remediation Master Plan shall not be created before Phase B has
been formally opened.

Wave Authorization SHALL NOT begin until the mandatory Program Owner
Decisions required by the Phase B governance model have been formally
recorded.

Engineering Kickoff SHALL NOT begin until:

-   Program Owner Decisions are completed.
-   Wave Authorization has been approved.
-   All governance gates have passed.

Wave Implementation SHALL NOT begin until:

-   Engineering Kickoff has been completed.
-   Wave Implementation Readiness Review has been completed.
-   Implementation has been formally authorized.

Remediation Master Plan is a strategic planning document. It SHALL NOT
perform:

-   Wave Planning
-   Wave sizing
-   Engineering authorization
-   Implementation authorization

------------------------------------------------------------------------

# 12. Program Principles

The following governance principles are permanent:

-   Repository search alone shall never be considered sufficient evidence for dead-code identification.
-   Production verification is mandatory before removing any repository artifact.
-   Repository Hygiene requires evidence, not assumptions.
-   AI development infrastructure shall be treated as a separate repository class.
-   Governance documents are first-class project deliverables.
-   Historical governance records are part of enterprise traceability.

------------------------------------------------------------------------

# 13. Repository Classification Policy

## Repository Baseline Classification

All repository artifacts shall be classified into one of the following categories:

-   **Application Source Code** — Runtime logic, UI, services, database artifacts, and deployment files required by the production system. Governance responsibility: engineering change control.
-   **Governance Documentation** — Charters, plans, reviews, authorizations, and decision records. Governance responsibility: enterprise decision chain; revisions require formal approval.
-   **AI Development Infrastructure** — Files generated and maintained by AI tooling to support repository understanding and agent navigation. Governance responsibility: AI tooling governance.
-   **Scratch / Working Artifacts** — Temporary notes, drafts, or exploratory outputs that are not approved deliverables. Governance responsibility: explicit review and disposition.
-   **Historical Governance Records** — Superseded or archived governance documents retained for enterprise traceability. Governance responsibility: preserve read-only and do not delete.

Future engineering work shall classify repository artifacts before proposing their removal.

------------------------------------------------------------------------

# 14. AI Development Infrastructure Policy

## `.codebase-memory`

The `.codebase-memory` directory is intentionally maintained as AI Development Infrastructure.

**Purpose**

The Knowledge Graph generated by the Codebase Memory MCP supports semantic repository understanding by AI Agents.

**Production Impact**

None.

**Engineering Impact**

-   Not application code.
-   Not a deployment artifact.
-   Not dead code.

**Versioning**

Versioning follows AI tooling governance.

Future engineers shall not remove or classify these files as obsolete solely because they are regenerated.

------------------------------------------------------------------------

# 15. Repository Hygiene Methodology

Repository Hygiene is the controlled process for identifying, evaluating, and removing or preserving repository artifacts. The methodology requires the following sequence:

1.  Repository evidence
2.  Production verification
3.  Dependency verification
4.  Governance review
5.  Disposition decision
6.  Independent verification
7.  Acceptance

Repository cleanup shall always follow this sequence.

------------------------------------------------------------------------

# 16. Production Infrastructure Policy

The following permanent governance rule applies to infrastructure artifacts:

-   Infrastructure artifacts must be verified in production before removal.
-   Repository presence alone does not determine operational usage.
-   Operational ownership must be identified before disposition.

------------------------------------------------------------------------

# 17. Governance Deliverables Policy

Governance artifacts are official project outputs. Examples include:

-   AUTHORIZATION
-   ENGINEERING KICKOFF
-   IMPLEMENTATION READINESS REVIEW
-   IMPLEMENTATION REPORT
-   VERIFICATION
-   ACCEPTANCE REVIEW
-   PROGRAM STATUS REVIEW
-   EXECUTION REPORT

These documents preserve the enterprise decision chain.

They are not temporary documentation.

They are part of the project's permanent governance evidence.

------------------------------------------------------------------------

# 18. Lessons Learned

The evolution of the program has produced the following permanent lessons:

-   Repository structure evolves over time.
-   AI tooling must be governed explicitly.
-   Enterprise governance prevents accidental production regressions.
-   Architectural decisions must be preserved beyond implementation.
-   Future AI Agents should understand repository semantics rather than relying only on repository searches.
