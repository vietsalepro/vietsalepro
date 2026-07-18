# D-P6-04 — Operational Runbook Update

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 6 — Operational Trust & Deployment Readiness  
**Task:** CURRENT_TASK-038 — Operational Runbook Update  
**Document Type:** Phase 6 Deliverable — Operational Runbook Update  
**Version:** 1.0  
**Date:** 2026-07-18  
**Authority:** Engineering Implementation Authority  
**Decision:** COMPLETE WITH OBSERVATIONS

---

## 1. Purpose

This deliverable records the editorial update of the six approved operational runbooks under `docs/admin-dashboard/` so that they direct engineers to the canonical migration chain, the accepted derived artifacts, the reconciled RPC contract, and the Phase 6 deployment validation evidence. It does not alter business logic, SQL, migrations, source code, services, UI, tests, or generated artifacts.

---

## 2. Scope

### 2.1 In Scope

- Editorial updates to the six operational runbooks approved in `CURRENT_TASK-038_ENGINEERING_KICKOFF.md` §4.1.
- Insertion of canonical references defined in the Engineering Kickoff.
- Removal of obsolete references (`memory-zone/KE_HOACH/...` superseded plans and `docs/admin-dashboard/RPC_CONTRACTS.md` as a contract authority).
- Maintenance of traceability to authoritative Phase 6 evidence.

### 2.2 Out of Scope

- No change to business logic, SQL, database, migrations, source code, services, UI, tests, or generated artifacts.
- No resolution of A9 (`20260724000000_sp4_4_webhook_delivery_hardening.sql`); A9 remains documented as deferred.
- No modification of governance state documents (`CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md`, `SYSTEM_RECOVERY_MASTER_PLAN.md`, `SYSTEM_RECOVERY_PROGRAM_CHARTER.md`, etc.).

---

## 3. Files Modified

| Runbook | Path |
|---|---|
| Migration Runbook | `docs/admin-dashboard/MIGRATION_RUNBOOK.md` |
| Disaster Recovery Runbook | `docs/admin-dashboard/DISASTER_RECOVERY_RUNBOOK.md` |
| Rollback Runbook | `docs/admin-dashboard/ROLLBACK_RUNBOOK.md` |
| Incident Response Runbook | `docs/admin-dashboard/INCIDENT_RESPONSE_RUNBOOK.md` |
| Monitoring Runbook | `docs/admin-dashboard/MONITORING_RUNBOOK.md` |
| Key Rotation Runbook | `docs/admin-dashboard/KEY_ROTATION_RUNBOOK.md` |

No other repository files were modified.

---

## 4. Canonical References Inserted

The following authoritative artifacts are now cited by the updated runbooks:

| Artifact | Role |
|---|---|
| `supabase/migrations/*.sql` (138 files, ascending lexicographic order) | Canonical migration chain — single source of schema/RPC truth |
| `supabase/schema.sql` (SHA-256 `C3738BCBEAABA04D8FE7C86FEB1F89C19BD0E6B8F50E865F58CE235A24EC3689`) | Generated schema artifact accepted in `D-035-01` |
| `supabase/generated/database.types.ts` (SHA-256 `6C8767DDE630FC0A8F33DF955EAC468BB84DEF6119545B581ADF06C23CD81C8A`) | Generated type artifact accepted in `D-035-01` |
| `D-P3-01_Reconciled_RPC_Contract.md` | Reconciled service-layer RPC contract |
| `D-034-01_Deployment_Validation_Gate_Definition.md` | Pre/during/post-deployment validation gate |
| `D-034-02_Deployment_Validation_Evidence_Checklist.md` | Gate evidence checklist |
| `D-035-01_Deployment_Readiness_Evidence.md` | Reference artifact checksums and parity evidence |
| `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` | Final Staging canonicalization evidence |

---

## 5. Obsolete References Removed

| Obsolete Reference | Disposition |
|---|---|
| `memory-zone/KE_HOACH/Admin_dashboard/PLAN_BASEJUMP_ADMIN_DASHBOARD_ENTERPRISE_UPGRADE.md` | Removed from `MIGRATION_RUNBOOK.md` Overview |
| `memory-zone/KE_HOACH/Admin_dashboard/SUB_PHASE_BREAKDOWN_BASEJUMP_ADMIN_DASHBOARD.md` | Removed from `MIGRATION_RUNBOOK.md` Overview |
| `docs/admin-dashboard/RPC_CONTRACTS.md` as canonical RPC contract authority | Replaced by `D-P3-01_Reconciled_RPC_Contract.md` in `MIGRATION_RUNBOOK.md` and `DISASTER_RECOVERY_RUNBOOK.md`; removed from `MIGRATION_RUNBOOK.md` Component Ownership table |

All remaining `RPC_CONTRACTS.md` references in the repository are in non-runbook archival documents that were outside the authorized update scope.

---

## 6. Runbook Updates by Section

| Runbook | Section(s) Updated | Summary of Change |
|---|---|---|
| `MIGRATION_RUNBOOK.md` | Overview; Phase 5 RPC Contract Compliance; Multi-Environment Deployment Workflow; Production Deploy Checklist; Component Ownership table | Replaced superseded source plans with canonical chain, artifacts, gate, and evidence; replaced `RPC_CONTRACTS.md` with `D-P3-01`; added D-034-01, D-035-01, and D-P6-03 references to workflow and checklist; updated RPC ownership row |
| `DISASTER_RECOVERY_RUNBOOK.md` | Prerequisites; Scenario B restore steps; Verify / Verification Checklist; Annual DR Drill | Added canonical migration source, D-034-01, D-035-01, D-P3-01, and D-P6-03 references; updated migration ordering language; replaced `RPC_CONTRACTS.md` checklist item |
| `ROLLBACK_RUNBOOK.md` | Trigger; Rollback database migration; Verify rollback; Verification Checklist | Added D-034-01 gate abort trigger; tied reverse migrations to `supabase/migrations/`; added D-P3-01 and D-035-01 validation; appended gate/checksum checklist items |
| `INCIDENT_RESPONSE_RUNBOOK.md` | Triage; Contain; Resolve & Verify; Post-Incident | Added canonical baseline and gate checks to triage; tied rollback/DB recovery to D-034-01 and `supabase/migrations/`; added D-P3-01, D-035-01, and D-034-01 to resolve/verify; recorded A9 deferral in post-incident |
| `MONITORING_RUNBOOK.md` | Current State; SLIs/SLOs; Metrics to Collect — API/Database; Verification | Added D-034-01 gate health and D-035-01 checksums to current state; added D-034-01 gate row to SLIs/SLOs; linked RPC examples to `D-P3-01`; added checksum and gate checks to verification |
| `KEY_ROTATION_RUNBOOK.md` | Verification; Post-Rotation | Linked `admin-health-check` to `D-P3-01` RPC inventory; added D-034-01 re-check and D-P3-01 parity; added D-034-01/D-P3-01 re-confirmation in post-rotation |

---

## 7. Traceability

| Updated Runbook Reference | Authoritative Source |
|---|---|
| `supabase/migrations/*.sql` (138 files) | `D-035-01_Deployment_Readiness_Evidence.md` §5.1; `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` §2 |
| `supabase/schema.sql` checksum | `D-035-01_Deployment_Readiness_Evidence.md` §6.1; `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` §2 |
| `supabase/generated/database.types.ts` checksum | `D-035-01_Deployment_Readiness_Evidence.md` §6.1; `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` §2 |
| `D-P3-01_Reconciled_RPC_Contract.md` | `D-P3-01_Reconciled_RPC_Contract.md` §1; `D-035-01` §7 |
| `D-034-01_Deployment_Validation_Gate_Definition.md` | `CURRENT_TASK-038_ENGINEERING_KICKOFF.md` §4.1 |
| `D-034-02_Deployment_Validation_Evidence_Checklist.md` | `CURRENT_TASK-038_ENGINEERING_KICKOFF.md` §4.1 |
| `D-035-01_Deployment_Readiness_Evidence.md` | `CURRENT_TASK-038_ENGINEERING_KICKOFF.md` §4.1 |
| `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md` | `CURRENT_TASK-038_ENGINEERING_KICKOFF.md` §4.1 |

---

## 8. Exception Register

| Exception ID | Description | Disposition |
|---|---|---|
| A9 | Missing canonical migration `20260724000000_sp4_4_webhook_delivery_hardening.sql` | Remains deferred per `PHASE6_OPENING_AUTHORIZATION.md` §6 and `CURRENT_TASK-038_ENGINEERING_KICKOFF.md`; not resolved by this task |

---

## 9. Validation

- All canonical references inserted in the updated runbooks point to files present in the repository or to established Phase 6 deliverables.
- No superseded `memory-zone/KE_HOACH` source-plan references remain in the updated runbooks.
- No updated runbook treats `docs/admin-dashboard/RPC_CONTRACTS.md` as a canonical contract authority.
- No conflicting source of truth was introduced.
- A9 is recorded as deferred, not waived or resolved.

---

## 10. Conclusion

The Operational Runbook Update deliverable is **COMPLETE WITH OBSERVATIONS** (A9 remains deferred). The six approved operational runbooks now direct deployment, disaster recovery, rollback, incident response, monitoring, and key-rotation procedures to the canonical migration chain, the accepted derived artifacts, the reconciled RPC contract, and the Phase 6 validation evidence.
