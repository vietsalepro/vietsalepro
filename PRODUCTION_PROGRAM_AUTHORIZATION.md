# PRODUCTION_PROGRAM_AUTHORIZATION.md

**Program:** Production Deployment Program  
**Document Type:** Program authorization  
**Effective Date:** 2026-07-19  
**Version:** 1.0  
**Status:** Proposed — Pending Program Sponsor Approval

---

## 1. Program Name

Production Deployment Program

---

## 2. Program Purpose

Safely transition VietSalePro v7 from a recovered, repository-consistent state to a live, operational production platform on Supabase and Vercel by planning, gating, and evidencing a production-ready deployment of the artifacts that already exist.

This program is a new governance boundary. It does not reopen the closed System Recovery Program and it does not authorize new feature work.

---

## 3. Scope

### 3.1 In Scope

- Establish a frozen Production Deployment Baseline.
- Create and maintain the Production Asset Inventory.
- Define deployment freeze, release, and cutover governance.
- Plan and document the Dry Run, Production Cutover, and Rollback Strategy.
- Validate the deployed platform through defined acceptance gates.
- Provide Hypercare and Closeout governance.
- Produce evidence for each phase exit gate.

### 3.2 Out of Scope

- New product features or user-facing capabilities.
- Performance optimization beyond deployment readiness.
- UI redesign, rebranding, or business logic changes.
- Database vendor migration or infrastructure migration away from Supabase.
- Operational incident response outside the deployment objective.
- Detailed frontend release planning, except where required for backend validation.

---

## 4. Authority

| Role | Authority | Source |
|---|---|---|
| Program Sponsor | Approves program initiation, phase exits, and changes to governance baseline | `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md` Version 1.2 |
| Program Manager | Operates the program within the approved baseline and authorized tasks | `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md` Version 1.2 |
| Independent Verification Authority | Verifies evidence and confirms phase exit criteria satisfaction | `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md` Version 1.2 |
| Independent Acceptance Authority | Accepts deployment outcomes as fit for production use | `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md` Version 1.2 |

---

## 5. Governance Baseline Reference

This program is authorized to operate under the following frozen governance baseline:

- `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md` Version 1.2
- `PRODUCTION_DEPLOYMENT_MASTER_PLAN.md` Version 1.2

No enhancement, restructuring, or expansion of the governance documentation is permitted unless initiated through the formal Change Control process defined in Version 1.2.

---

## 6. Current Phase

**Phase 1 — Production Readiness**

Phase 1 is active. Its purpose is to initialize the program and establish the operational governance markers required before any work is authorized.

---

## 7. Initial Task Reference

- `CURRENT_TASK-001`: Program Initialization — Governance Markers
- Status: **READY FOR AUTHORIZATION**
- Phase: Phase 1 — Production Readiness
- Milestone: M1

`CURRENT_TASK-001` is declared ready for authorization in `CURRENT_TASK.md`. Authorization of that task is a separate decision and is not granted by this document.

---

## 8. Entry Criteria

The following entry criteria must be satisfied before this authorization is effective:

1. `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md` Version 1.2 exists and is frozen.
2. `PRODUCTION_DEPLOYMENT_MASTER_PLAN.md` Version 1.2 exists and is frozen.
3. `CURRENT_PHASE.md` declares Phase 1 — Production Readiness as ACTIVE.
4. `CURRENT_TASK.md` declares `CURRENT_TASK-001` as READY FOR AUTHORIZATION.

---

## 9. Exit Criteria

The Production Deployment Program is considered closed when:

1. All five phases defined in `PRODUCTION_DEPLOYMENT_MASTER_PLAN.md` Version 1.2 are completed.
2. Each phase exit gate is approved by the required authority.
3. The deployed platform is accepted by the Independent Acceptance Authority as fit for production use.
4. Closeout evidence is recorded and accepted.

---

## 10. Constraints

- No implementation, deployment, verification, or acceptance activity may be performed without an authorized `CURRENT_TASK`.
- No source code, migrations, Edge Functions, or environment configuration may be modified under this authorization.
- No Supabase CLI, Vercel CLI, or other CLI command may be executed under this authorization.
- No secret values may be inspected, retrieved, or exposed.
- No governance baseline change is permitted without an approved Change Control decision.

---

## 11. Out of Scope

The following are not authorized by this document:

- Engineering kickoff.
- Implementation documents.
- Verification documents.
- Acceptance documents.
- Program status reviews.
- Phase reports.
- Production deployment execution.
- Repository state changes.
- Git operations.

---

## 12. Approval Statement

The Production Deployment Program is hereby authorized to begin Program Initialization under the frozen Version 1.2 governance baseline.

This authorization is limited to governance initialization and does not authorize any implementation, deployment, verification, or acceptance activities. Those activities require separate authorization through the task and phase gate process defined in the frozen baseline.

| Role | Name | Signature / Acknowledgment | Date |
|---|---|---|---|
| Program Sponsor | *(as named in `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md` §9)* | _________________________ | ________ |
| Program Manager | *(as named in `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md` §9)* | _________________________ | ________ |

---

*Basis: `PRODUCTION_DEPLOYMENT_PROGRAM_CHARTER.md` Version 1.2; `PRODUCTION_DEPLOYMENT_MASTER_PLAN.md` Version 1.2; `CURRENT_PHASE.md`; `CURRENT_TASK.md`.*
