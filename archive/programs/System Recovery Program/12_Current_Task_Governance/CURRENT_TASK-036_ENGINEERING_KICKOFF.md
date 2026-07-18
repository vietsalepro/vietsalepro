# CURRENT_TASK-036 — Engineering Kickoff: Environment Parity Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 6 — Operational Trust & Deployment Readiness  
**Task:** CURRENT_TASK-036 — Environment Parity Report  
**Document Type:** Engineering Authority — Engineering Kickoff Plan  
**Version:** 1.0  
**Date:** 2026-07-18  
**Authority:** Engineering Authority  

---

## 1. Purpose

This document is the engineering kickoff for `CURRENT_TASK-036 — Environment Parity Report`. It defines the implementation objectives, execution sequence, work breakdown, evidence plan, Supabase MCP scope, risks, rollback approach, exit criteria, and engineering readiness decision for executing the `D-034-01` Deployment Validation Gate against the designated Phase 6 Staging environment and producing `D-P6-02 — Environment Parity Report`.

No implementation is authorized by this document. It is a planning and readiness review only.

---

## 2. Documents Reviewed

The following documents were reviewed completely before this plan was prepared:

| Document | Role |
|---|---|
| `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` | Program authority, SSOT principles, scope, governance model, and architecture authority rules. |
| `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 6 and §7 | Phase 6 purpose, deliverables, exit criteria, and operational trust gate criteria. |
| `CURRENT_PHASE.md` | Active phase marker (Phase 6 active), Phase 6 constraints, and `CURRENT_TASK` generation rules. |
| `UNIFIED_PROGRAM_STATE.md` | Authoritative program state, governance hierarchy, and superseded documents. |
| `PHASE6_OPENING_AUTHORIZATION.md` | Phase 6 opening decision, A9 deferral, scope, and constraints. |
| `CURRENT_TASK-036_PROGRAM_AUTHORIZATION.md` | Task authorization, authorized objective, scope, constraints, and evidence assumptions. |
| `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md` | Prior task closure recommendation and residual observations transferred to `CURRENT_TASK-036`. |
| `D-034-01_Deployment_Validation_Gate_Definition.md` | Gate checks, pass/fail/exception criteria, and evidence requirements. |
| `D-034-02_Deployment_Validation_Evidence_Checklist.md` | Evidence checklist template for gate execution. |
| `D-035-01_Deployment_Readiness_Evidence.md` | Reference artifact checksums, RPC parity evidence, and pending live checks. |
| `D-P3-01_Reconciled_RPC_Contract.md` | Expected RPC surface for parity checks. |
| `docs/admin-dashboard/MIGRATION_RUNBOOK.md` | Operational guidance for migration execution and verification. |
| `docs/admin-dashboard/DISASTER_RECOVERY_RUNBOOK.md` | Staging/production project identifiers and rollback guidance. |

---

## 3. Scope

### 3.1 In Scope

- Engineering planning and readiness confirmation for `CURRENT_TASK-036`.
- Live execution of the `D-034-01` Deployment Validation Gate against the designated Staging environment only (`shbmzvfcenbybvyzclem`).
- Deterministic application of the existing canonical migration chain to Staging.
- Regeneration of `supabase/schema.sql` and `supabase/generated/database.types.ts` from the freshly applied canonical chain in Staging.
- Checksum comparison of regenerated artifacts against the `D-035-01` §6.1 reference checksums.
- RPC surface parity validation against `D-P3-01_Reconciled_RPC_Contract.md`.
- Completion and signing of a `D-034-02` checklist for Staging.
- Production of `D-P6-02_Environment_Parity_Report.md` as the primary deliverable.
- Recording the deferred A9 exception as a known, unresolved observation.

### 3.2 Out of Scope

- Production environment access, deployment, migration, or schema modification.
- Resolving, creating, or waiving the A9 deferred canonical migration.
- Modifying the canonical migration chain, service code, tests, or runtime configuration.
- Operational runbook updates (reserved for `D-P6-03`).
- Feature-flag wiring, feature implementation, architecture redesign, or unrelated bug fixes.
- Any engineering execution before this Engineering Kickoff is accepted.

---

## 4. Entry Criteria Review

| Criterion | Required Evidence | Finding | Status |
|---|---|---|---|
| `CURRENT_TASK-036` authorization completed | `CURRENT_TASK-036_PROGRAM_AUTHORIZATION.md` §12 — **AUTHORIZED WITH CONSTRAINTS** | Satisfied | ✓ |
| Phase 6 active | `CURRENT_PHASE.md` §1; `PHASE6_OPENING_AUTHORIZATION.md` §13 — **PHASE 6 OPENED** | Satisfied | ✓ |
| `CURRENT_TASK-035` closed | `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md` §10 — **CLOSED WITH OBSERVATIONS** | Satisfied | ✓ |
| `D-034-01` available | `D-034-01_Deployment_Validation_Gate_Definition.md` | Available; formal Program Manager / Architecture Authority sign-offs remain pending (O1) | Constraint |
| `D-034-02` available | `D-034-02_Deployment_Validation_Evidence_Checklist.md` | Template available | ✓ |
| `D-035-01` accepted baseline | `D-035-01_Deployment_Readiness_Evidence.md` §6.1 and §10 | Reference checksums captured; gate result **PASS WITH OBSERVATIONS** for static baseline; Staging execution **PENDING** | ✓ |
| Staging environment identified | `D-035-01` §3; `DISASTER_RECOVERY_RUNBOOK.md` §Prerequisites — `shbmzvfcenbybvyzclem` | Designated; accessibility to be confirmed at implementation start | Constraint |
| MCP authorization documented | `CURRENT_TASK-036_PROGRAM_AUTHORIZATION.md` §5 and §9 — Staging only | Scope documented; credentials and connectivity not verified in kickoff | Constraint |
| Production excluded | `CURRENT_TASK-036_PROGRAM_AUTHORIZATION.md` §5, §9, §12 | Explicitly excluded | ✓ |

**Entry Criteria Summary:** All hard governance prerequisites are satisfied. Three operational readiness constraints must be closed before gate execution begins: (1) `D-034-01` formal sign-offs, (2) confirmed Staging MCP access and clean state, and (3) A9 exception register acknowledgment.

---

## 5. Engineering Strategy

### 5.1 Objectives

1. Apply the canonical migration chain deterministically to the Phase 6 Staging environment.
2. Regenerate `schema.sql` and `database.types.ts` from the freshly applied canonical chain and compare them to the `D-035-01` reference checksums.
3. Verify that the Staging RPC surface matches `D-P3-01_Reconciled_RPC_Contract.md`.
4. Instantiate, complete, and sign a `D-034-02` checklist for Staging.
5. Produce `D-P6-02_Environment_Parity_Report.md` with all evidence, exceptions, and the gate result.
6. Preserve the A9 deferred observation without resolving it.

### 5.2 Execution Sequence

1. **Pre-execution readiness confirmation**
   - Confirm `D-034-01` Program Manager and Architecture Authority sign-offs.
   - Confirm Supabase MCP access to Staging (`shbmzvfcenbybvyzclem`) only.
   - Confirm Staging is a clean or acceptable validation target.
   - Record A9 exception in the exception register.

2. **Pre-deployment gate checks (`PD-01` through `PD-05`)**
   - Verify target environment is the designated Staging project.
   - Verify canonical migration chain baseline has not changed since `D-035-01`.
   - Verify rollback plan references the canonical source.
   - Verify A9 exception is recorded.
   - Verify reference artifact checksums match the accepted baseline.

3. **Deployment gate checks (`DV-01` through `DV-05`)**
   - Apply the canonical migration chain in exact lexicographic filename order.
   - Observe migration application log for ordering errors, duplicates, or skips.
   - Regenerate `schema.sql` from the applied chain.
   - Regenerate `database.types.ts` from the applied chain.
   - Document any divergence from reference artifacts as a non-conformance.

4. **Post-deployment gate checks (`PV-01` through `PV-06`)**
   - Capture post-deployment schema snapshot and compare to `supabase/schema.sql`.
   - Inventory RPC surface and compare to `D-P3-01_Reconciled_RPC_Contract.md`.
   - Compare regenerated `database.types.ts` to reference artifact.
   - Annotate A9 as deferred.
   - Record promotion recommendation.

5. **Evidence packaging and deliverable production**
   - Complete `D-034-02` for Staging.
   - Assemble diff reports, checksum manifests, migration logs, RPC inventories, and exception register entries.
   - Produce `D-P6-02_Environment_Parity_Report.md`.

### 5.3 Technical Approach

- **Canonical source first:** All validation is anchored to `supabase/migrations/*.sql` as the only schema and RPC source of truth.
- **Derived artifact comparison:** Regenerated artifacts are compared byte-for-byte to the `D-035-01` reference checksums:
  - `supabase/schema.sql` — SHA-256 `C3738BCBEAABA04D8FE7C86FEB1F89C19BD0E6B8F50E865F58CE235A24EC3689`
  - `supabase/generated/database.types.ts` — SHA-256 `6C8767DDE630FC0A8F33DF955EAC468BB84DEF6119545B581ADF06C23CD81C8A`
- **RPC parity via contract:** RPC presence is validated against `D-P3-01`, which enumerates 183 service-layer RPCs and 300 unique canonical functions.
- **No hand-editing of derived artifacts:** Any divergence is reported as a non-conformance, not patched.

---

## 6. Work Breakdown Structure

| WBS ID | Work Package | Description | Output / Evidence |
|---|---|---|---|
| 1.0 | Readiness confirmation | Confirm sign-offs, Staging access, A9 register | Readiness log, exception register entry |
| 1.1 | `D-034-01` sign-off confirmation | Obtain Program Manager and Architecture Authority acknowledgments | Signed `D-034-01` header or equivalent |
| 1.2 | Staging access verification | Confirm MCP/project connectivity to `shbmzvfcenbybvyzclem`; verify no Production routing | Connection log / environment designation record |
| 1.3 | A9 exception registration | Record A9 in `D-034-02` exception register | Exception register entry |
| 2.0 | Pre-deployment validation | Execute `PD-01` through `PD-05` | Completed pre-deployment evidence |
| 2.1 | Environment designation check (`PD-01`) | Confirm target is the designated Phase 6 Staging environment | Environment designation record |
| 2.2 | Baseline manifest check (`PD-02`) | Confirm canonical migration chain is unchanged from `D-035-01` baseline | Baseline diff / manifest |
| 2.3 | Rollback plan check (`PD-03`) | Confirm rollback plan references canonical source and is available | Rollback plan reference |
| 2.4 | A9 exception check (`PD-04`) | Confirm A9 is recorded in exception register | Exception register confirmation |
| 2.5 | Artifact baseline check (`PD-05`) | Confirm repository artifacts match accepted baseline checksums | Artifact checksum manifest |
| 3.0 | Deployment execution | Apply canonical migrations and regenerate artifacts | Migration application log, regenerated artifacts |
| 3.1 | Canonical chain application (`DV-01`) | Apply 138 forward migrations in filename order to Staging | Migration application log |
| 3.2 | Ordering verification (`DV-02`) | Verify no ordering errors, duplicates, or skipped migrations | Migration log review |
| 3.3 | Schema regeneration (`DV-03`) | Regenerate `schema.sql` from applied chain | Regenerated `schema.sql` |
| 3.4 | Type regeneration (`DV-04`) | Regenerate `database.types.ts` from applied chain | Regenerated `database.types.ts` |
| 3.5 | Non-conformance logging (`DV-05`) | Log any divergence from reference artifacts | Non-conformance log |
| 4.0 | Post-deployment validation | Validate deployed state against canonical reference | Post-deployment evidence |
| 4.1 | Schema snapshot parity (`PV-01`) | Compare post-deployment schema snapshot to `supabase/schema.sql` | Schema diff report |
| 4.2 | RPC contract parity (`PV-02`, `PV-03`) | Inventory Staging RPCs and compare to `D-P3-01` | RPC inventory and parity report |
| 4.3 | Type artifact parity (`PV-04`) | Compare regenerated `database.types.ts` to reference | Type diff report |
| 4.4 | A9 annotation (`PV-05`) | Annotate A9 as deferred, not blocking unless separately dispositioned | `D-034-02` A9 annotation |
| 4.5 | Promotion recommendation (`PV-06`) | Record gate result and promotion recommendation | Gate Result Report |
| 5.0 | Evidence packaging | Compile checklist, diff reports, and deliverable | `D-P6-02` and signed `D-034-02` |
| 5.1 | `D-034-02` completion | Fill and sign Staging checklist | Completed `D-034-02` |
| 5.2 | `D-P6-02` production | Write Environment Parity Report | `D-P6-02_Environment_Parity_Report.md` |

---

## 7. MCP Execution Plan

### 7.1 Authorized MCP Scope

- **Supabase MCP access is restricted to the Staging environment only** (`shbmzvfcenbybvyzclem`).
- **Production MCP access is prohibited.**
- **No MCP tool shall be invoked during this Engineering Kickoff.** MCP tools are planned for the implementation phase only and must be executed under the authorized scope confirmed above.

### 7.2 Planned MCP Activities During Implementation

| MCP Activity | Purpose | Environment | Expected Output |
|---|---|---|---|
| List / inspect Staging schema and RPC surface | Confirm target environment state | Staging | Environment inventory |
| Apply canonical migration chain to Staging | Execute `DV-01` | Staging | Migration application log |
| Regenerate `schema.sql` | Execute `DV-03` | Staging | Regenerated schema artifact |
| Regenerate `database.types.ts` | Execute `DV-04` | Staging | Regenerated type artifact |
| Query RPC catalog (`pg_proc` / `supabase` introspection) | Execute `PV-02`, `PV-03` | Staging | RPC inventory |
| Capture schema snapshot | Execute `PV-01` | Staging | Post-deployment schema snapshot |

### 7.3 MCP Constraints

- All MCP calls must target the Staging project identifier `shbmzvfcenbybvyzclem`.
- Any accidental Production routing must abort execution immediately and be reported as a non-conformance.
- No MCP activity may modify canonical source files (`supabase/migrations/*.sql`), service code, tests, or runtime configuration.
- MCP-driven regeneration produces artifacts in a Staging-derived workspace; those artifacts are compared to, but do not overwrite, the canonical reference artifacts unless explicitly authorized.

---

## 8. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | `D-034-01` formal sign-offs are not obtained before gate execution | Medium | High | Make sign-off confirmation a hard gate in WBS 1.1; do not proceed to `DV-01` until acknowledged. |
| 2 | Staging MCP credentials unavailable or misrouted to Production | Medium | High | Verify project identifier `shbmzvfcenbybvyzclem` before every MCP call; abort if any other project is detected. |
| 3 | A9 deferred migration causes migration application to fail or report an exception | Medium | High | Record A9 in the exception register; do not create or waive it; escalate to Architecture Authority if it blocks application. |
| 4 | Staging environment is not clean or contains non-canonical schema objects | Medium | Medium | Capture pre-deployment inventory; treat unexpected objects as non-conformances; do not overwrite canonical evidence. |
| 5 | Regenerated artifacts differ from `D-035-01` reference checksums | Low | Medium | Document the diff as a non-conformance; escalate to Architecture Authority before overriding reference artifacts; do not patch by hand. |
| 6 | RPC surface parity check reveals a contract gap in Staging | Low | High | Compare against `D-P3-01`; if a service-layer RPC is missing, fail the gate and escalate; extraneous RPCs are also non-conformances. |
| 7 | Evidence collection is conflated with A9 disposition or runbook updates | Low | Medium | Strictly limit deliverables to `D-P6-02` and `D-034-02` for Staging; defer A9 and runbooks to their respective authorized tasks. |
| 8 | Migration ordering errors, duplicate timestamps, or skipped files | Low | High | Apply migrations in strict lexicographic order of filenames; log each applied migration; fail on any ordering anomaly. |

---

## 9. Rollback Plan

### 9.1 Rollback Triggers

Rollback or halt execution is required if any of the following occur:

- `D-034-01` sign-offs are not confirmed before deployment.
- MCP access is routed to Production or any environment other than `shbmzvfcenbybvyzclem`.
- The canonical migration chain cannot be applied deterministically (ordering errors, duplicate or skipped migrations).
- Regenerated artifacts diverge from `D-035-01` reference checksums without an Architecture Authority exception.
- RPC surface parity fails against `D-P3-01`.
- A9 exception is found to block migration application before an Architecture Authority decision is obtained.

### 9.2 Rollback Actions

1. **Stop all MCP activity immediately** and disconnect from the target environment.
2. **Preserve all logs, snapshots, and regenerated artifacts** generated up to the point of failure.
3. **Do not modify or hand-patch** `supabase/schema.sql`, `supabase/generated/database.types.ts`, or any canonical migration file.
4. **Document the non-conformance** in `D-034-02` and the `D-P6-02` report.
5. **Escalate to the Architecture Authority** for any canonical-source, contract-parity, or generated-artifact divergence.
6. **Escalate to the Program Manager** for any environment access, scope, or promotion decision issue.
7. **Restore Staging to a known-good state** using the rollback procedure in `DISASTER_RECOVERY_RUNBOOK.md` if the migration application leaves the environment in an inconsistent state; otherwise leave the environment untouched for forensic review.

### 9.3 Rollback Authority

- **Technical contract / canonical-source issues:** Architecture Authority.
- **Environment / promotion / scope issues:** Program Manager.
- **Production access or security incident:** Program Sponsor and Program Manager immediately.

---

## 10. Exit Criteria

The Engineering Kickoff is complete and the implementation phase may begin when all of the following are satisfied:

1. This `CURRENT_TASK-036_ENGINEERING_KICKOFF.md` is accepted by the Engineering Authority.
2. `D-034-01` formal sign-offs from the Program Manager and Architecture Authority are confirmed.
3. Staging MCP access to `shbmzvfcenbybvyzclem` is confirmed and Production is explicitly excluded.
4. The A9 deferred exception is recorded in the exception register.
5. The `D-034-02` template is ready for Staging instantiation.
6. The reference artifact checksums from `D-035-01` §6.1 are available for comparison.
7. `D-P3-01_Reconciled_RPC_Contract.md` is available as the RPC parity reference.
8. The rollback plan is understood and the rollback authority is identified.

`CURRENT_TASK-036` implementation is complete when:

1. The canonical migration chain is applied deterministically to Staging.
2. `schema.sql` and `database.types.ts` are regenerated and compared to the `D-035-01` reference checksums.
3. RPC surface parity is validated against `D-P3-01`.
4. A completed and signed `D-034-02` checklist for Staging exists.
5. `D-P6-02_Environment_Parity_Report.md` is produced and committed.
6. A9 remains recorded and unresolved.
7. No production access, canonical-source modification, or scope expansion occurred.

---

## 11. Engineering Decision

**ENGINEERING READY WITH CONSTRAINTS**

### 11.1 Rationale

The `CURRENT_TASK-036` engineering plan is complete, internally consistent, and aligned with the authorized scope in `CURRENT_TASK-036_PROGRAM_AUTHORIZATION.md` and `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 6. The entry criteria from the program governance baseline are satisfied: Phase 6 is active, `CURRENT_TASK-035` is closed, `D-035-01` is accepted as the reference baseline, the Staging environment is designated, and Production is excluded.

However, three readiness constraints remain unresolved at the kickoff stage because this document is a planning deliverable and does not permit environment access or implementation:

1. `D-034-01` formal Program Manager and Architecture Authority sign-offs are pending (transfer O1 from `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md` §8).
2. Supabase MCP access to Staging and the clean-state confirmation of `shbmzvfcenbybvyzclem` have not been verified in this read-only kickoff.
3. The A9 deferred canonical migration remains unresolved and must be carried as a recorded exception.

These constraints are manageable and are explicitly incorporated as pre-implementation gating items. Once the constraints are closed, the implementation sequence, WBS, MCP plan, rollback plan, and risk mitigations are ready for execution.

### 11.2 Evidence Supporting the Decision

| Evidence | Source | Finding |
|---|---|---|
| Phase 6 active | `CURRENT_PHASE.md` §1; `PHASE6_OPENING_AUTHORIZATION.md` §13 | Phase 6 opened 2026-07-18 |
| `CURRENT_TASK-035` closed | `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md` §10 | Closed with observations |
| `CURRENT_TASK-036` authorized | `CURRENT_TASK-036_PROGRAM_AUTHORIZATION.md` §12 | AUTHORIZED WITH CONSTRAINTS |
| Reference baseline | `D-035-01` §6.1 and §10 | Reference checksums captured; Staging gate PENDING |
| Staging target | `D-035-01` §3; `DISASTER_RECOVERY_RUNBOOK.md` | `shbmzvfcenbybvyzclem` designated |
| Gate definition | `D-034-01` | Checks and pass/fail criteria defined; sign-offs pending |
| Checklist template | `D-034-02` | Available for Staging execution |
| A9 exception | `PHASE6_OPENING_AUTHORIZATION.md` §6; `D-035-01` §9 | Deferred, recorded, not blocking authorization |
| RPC contract | `D-P3-01` | 183 service-layer RPCs reconciled against 300 canonical functions |
| Production exclusion | `CURRENT_TASK-036_PROGRAM_AUTHORIZATION.md` §5, §9, §12 | Explicitly out of scope |

### 11.3 Conditions for Proceeding to Implementation

Implementation may begin only after:

1. This Engineering Kickoff is formally accepted.
2. `D-034-01` sign-off fields are completed by the Program Manager and Architecture Authority.
3. Staging Supabase MCP access is confirmed and verified to target `shbmzvfcenbybvyzclem` only.
4. The A9 exception register entry is confirmed.

---

*Basis: `SYSTEM_RECOVERY_PROGRAM_CHARTER.md`; `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 6 and §7; `CURRENT_PHASE.md`; `UNIFIED_PROGRAM_STATE.md`; `PHASE6_OPENING_AUTHORIZATION.md`; `CURRENT_TASK-036_PROGRAM_AUTHORIZATION.md`; `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md`; `D-034-01_Deployment_Validation_Gate_Definition.md`; `D-034-02_Deployment_Validation_Evidence_Checklist.md`; `D-035-01_Deployment_Readiness_Evidence.md`; `D-P3-01_Reconciled_RPC_Contract.md`; `docs/admin-dashboard/MIGRATION_RUNBOOK.md`; `docs/admin-dashboard/DISASTER_RECOVERY_RUNBOOK.md`.*
