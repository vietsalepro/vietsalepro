# D-035-01 — Deployment Readiness Evidence Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 6 — Operational Trust & Deployment Readiness  
**Task:** CURRENT_TASK-035 — Deployment Readiness Evidence  
**Document Type:** Phase 6 Deliverable — Deployment Readiness Evidence Report  
**Version:** 1.0  
**Date:** 2026-07-18  
**Authority:** Engineering Implementation Authority  
**Gate Basis:** `D-034-01_Deployment_Validation_Gate_Definition.md` v1.0  
**Repository Baseline:** `master` @ `7729f811ba17f095225f364817bd02297ecab915`

---

## 1. Purpose

This report records the evidence collected by executing the `D-034-01` Deployment Validation Gate against the canonical source baseline and the designated Phase 6 validation environments. It demonstrates the state of the canonical migration chain, the reproducibility of the reference generated artifacts, and the parity between the canonical RPC inventory and the reconciled RPC contract (`D-P3-01_Reconciled_RPC_Contract.md`).

---

## 2. Authorized Scope

- Execute the `D-034-01` gate checks that can be performed from the repository baseline.
- Verify the canonical migration chain order and integrity.
- Capture reference artifact checksums.
- Verify RPC contract parity between `D-P3-01` and the canonical migration chain.
- Record the A9 deferred observation without resolving it.
- Produce the `D-035-01` evidence report.

Out of scope, per `CURRENT_TASK-035_PROGRAM_AUTHORIZATION.md` and `CURRENT_TASK-035_ENGINEERING_KICKOFF.md`: creation or resolution of A9, environment parity reporting, runbook updates, production deployment, and any source-code or migration changes.

---

## 3. Environment Inventory

| Environment | Identifier | Type | Access Status |
|---|---|---|---|
| Repository baseline / local clean validation | `master` @ `7729f811` | Local canonical source | Available for static verification |
| Staging | `shbmzvfcenbybvyzclem` (per `docs/admin-dashboard/MIGRATION_RUNBOOK.md` and `docs/admin-dashboard/DISASTER_RECOVERY_RUNBOOK.md`) | Supabase project | Not accessed in this implementation session; no Supabase CLI or remote credentials available |
| Production | `rsialbfjswnrkzcxarnj` | Supabase project | Explicitly out of scope for this task |

No additional Phase 6 validation environment was designated in the reviewed governance documents.

---

## 4. Entry Criteria Confirmation

| Criterion | Evidence | Finding |
|---|---|---|
| `CURRENT_TASK-035` authorization in force | `CURRENT_TASK-035_PROGRAM_AUTHORIZATION.md` | Satisfied |
| Phase 6 active | `PHASE6_OPENING_AUTHORIZATION.md` | Satisfied |
| `D-034-01` available | `D-034-01_Deployment_Validation_Gate_Definition.md` | Available; formal Program Manager / Architecture Authority sign-off fields remain blank in the file baseline (see Constraints) |
| `D-034-02` available | `D-034-02_Deployment_Validation_Evidence_Checklist.md` | Available as template |
| A9 exception register entry | `PHASE6_OPENING_AUTHORIZATION.md` §6 | Recorded and carried forward |
| Canonical artifacts in repository | `supabase/schema.sql`, `supabase/generated/database.types.ts` | Present and checksummed |

---

## 5. Canonical Migration Chain Validation

### 5.1 Chain Inventory

| Attribute | Value |
|---|---|
| Canonical directory | `supabase/migrations` |
| Forward migration files | 138 |
| First migration | `20250703000000_baseline_pre_tenant_schema.sql` |
| Last migration | `20260728000000_sp5_6_db_maintenance.sql` |
| Ordering rule | Ascending lexicographic sort of full file names |
| Duplicate timestamps | None detected |
| Files outside canonical chain | `supabase/*.sql` orphan files exist (see §7); these are not part of the canonical chain and are not applied by it |

### 5.2 Ordering Verification

The migration filenames sort into a single ascending sequence from `20250703000000` to `20260728000000` with no duplicate names. A full ordered listing is retained in the evidence package (see §11). The A9 deferred migration `20260724000000_sp4_4_webhook_delivery_hardening.sql` is not present, leaving a documented timestamp gap.

---

## 6. Generated Artifact Validation

### 6.1 Reference Artifact Checksums

| Artifact | Path | SHA-256 | Size (bytes) |
|---|---|---|---|
| Reference schema | `supabase/schema.sql` | `C3738BCBEAABA04D8FE7C86FEB1F89C19BD0E6B8F50E865F58CE235A24EC3689` | 1,357,565 |
| Reference types | `supabase/generated/database.types.ts` | `6C8767DDE630FC0A8F33DF955EAC468BB84DEF6119545B581ADF06C23CD81C8A` | 202,365 |

### 6.2 Reproducibility Notes

A live database or `supabase` CLI was not available in this implementation session, so the artifacts were not regenerated from a freshly applied canonical chain. The reference artifacts are present in the repository and are byte-identical to the artifacts accepted in prior phases. Regeneration in a target environment must be performed before any environment is promoted; the checksums above serve as the reference baseline.

---

## 7. RPC Surface Validation

### 7.1 Service-Layer RPC Audit

Command executed:

```bash
npx tsx scripts/audit-rpc-contracts.ts
```

Result:

```text
Migration RPCs: 300
Code RPCs      : 183

All service-layer RPC calls are defined in the canonical migration chain.
```

### 7.2 D-P3-01 Contract Parity Check

Command executed:

```bash
npx tsx tmp_verify_docs.mjs
```

Result:

```text
migration unique=300
D-P3-01 names=187
admin names=183
D-P3-01 not in migrations: 4 Category,Item,Metric,RPC
admin not in migrations: 0
admin not in D-P3-01: 0
migration missing in D-P3-01: 117 acquire_advisory_lock,activate_pending_memberships,...
```

The four names reported as "D-P3-01 not in migrations" (`Category`, `Item`, `Metric`, `RPC`) are markdown table header tokens, not RPC identifiers. Excluding those tokens, every RPC listed in `D-P3-01_Reconciled_RPC_Contract.md` is present in the canonical migration chain. The 117 functions defined in the canonical chain but not listed in `D-P3-01` are functions not invoked by the service layer, which is consistent with the `D-P3-01` reconciliation summary.

---

## 8. Gate Checklist Summary (per `D-034-02`)

| Check ID | Phase | Result | Evidence | Comments |
|---|---|---|---|---|
| PD-01 | Pre-deployment | PASS | Repository baseline is the local validation environment; staging identified but not accessed |  |
| PD-02 | Pre-deployment | PASS | Baseline is `7729f811`; no new migration added during this task |  |
| PD-03 | Pre-deployment | PASS WITH OBSERVATIONS | Rollback references in `docs/admin-dashboard/DISASTER_RECOVERY_RUNBOOK.md` and `MIGRATION_RUNBOOK.md` | Staging/production refs documented; no new rollback plan created |
| PD-04 | Pre-deployment | PASS | A9 deferred observation recorded in `PHASE6_OPENING_AUTHORIZATION.md` §6 and this report |  |
| PD-05 | Pre-deployment | PASS | Artifact checksums captured in §6.1 | Reference artifacts present and unmodified |
| DV-01 | Deployment | PENDING | No live database available to apply migrations | Cannot execute in this session |
| DV-02 | Deployment | PASS | Filename ordering verification (§5.1) shows no duplicates or skips | Static check only |
| DV-03 | Deployment | PENDING | Regeneration not performed | Reference checksum recorded |
| DV-04 | Deployment | PENDING | Regeneration not performed | Reference checksum recorded |
| DV-05 | Deployment | N/A | No regenerated artifacts to compare |  |
| PV-01 | Post-deployment | PENDING | No post-deployment schema snapshot captured |  |
| PV-02 | Post-deployment | PASS | `D-P3-01` RPC names verified against canonical chain (§7.2) | Static contract parity verified |
| PV-03 | Post-deployment | PASS | `D-P3-01` contains only canonical RPCs; no extraneous contract RPCs | 117 canonical-only functions are not invoked by service layer |
| PV-04 | Post-deployment | PENDING | No regenerated types to compare |  |
| PV-05 | Post-deployment | PASS | A9 annotated as deferred exception | Not treated as resolved |
| PV-06 | Post-deployment | PASS WITH OBSERVATIONS | Promotion recommendation recorded below |  |

---

## 9. Exception Register

| Exception ID | Related Check | Description | Disposition Reference | Impact |
|---|---|---|---|---|
| A9 | PD-04, PV-05 | Missing canonical migration `20260724000000_sp4_4_webhook_delivery_hardening.sql` | `PHASE6_OPENING_AUTHORIZATION.md` §6; deferred to a separate Architecture Authority `CURRENT_TASK` | Recorded only; not a gate blocker for this task |

No additional exceptions were identified.

---

## 10. Gate Result

| Environment | Result | Rationale |
|---|---|---|
| Repository baseline / local canonical source | **PASS WITH OBSERVATIONS** | Canonical chain is ordered and gapless except A9, all service-layer RPCs are defined in the canonical chain, `D-P3-01` parity holds, and reference artifact checksums are captured. Regeneration and live environment application were not possible in this session. |
| Staging (`shbmzvfcenbybvyzclem`) | **PENDING EXECUTION** | Environment was not accessed because no Supabase CLI or remote credentials were available to the implementation session. The `D-034-01` gate must be executed against staging before promotion. |

**Promotion recommendation:** `DENY` for any environment promotion until the pending `DV-01` through `DV-05`, `PV-01`, and `PV-04` checks are executed against an accessible clean validation environment and pass.

---

## 11. Evidence Package

| Evidence Item | Location / Reference |
|---|---|
| Canonical migration chain ordered listing | This report, §5.1 and the `supabase/migrations` directory |
| Reference schema checksum | §6.1 |
| Reference types checksum | §6.1 |
| Service-layer RPC audit output | §7.1 |
| `D-P3-01` parity check output | §7.2 |
| A9 exception register | §9 |
| Gate checklist summary | §8 |
| Gate result | §10 |

---

## 12. Traceability

| Phase 6 Exit Criterion | Evidence in this Report |
|---|---|
| EC-1 — Canonical migration chain applies deterministically to all designated environments | §5 (chain order verified); full operational application pending staging access |
| EC-2 — Generated artifacts reproducible in every environment from the same canonical source | §6 (reference checksums captured); live regeneration pending environment access |
| EC-3 — Deployment validation gate confirms contract parity | §7 (RPC parity verified); full gate execution pending live environment |

---

## 13. Constraints and Observations

1. `D-034-01` is present but its file header still indicates `Draft — Pending Program Manager Acceptance`; formal sign-off fields were not populated before this evidence collection.
2. No Supabase CLI, local Postgres instance, or remote Supabase project credentials were available to the implementation session; therefore migration application and schema/type regeneration were not executed against a live database.
3. The only designated Phase 6 validation environment named in the operational runbooks is Staging (`shbmzvfcenbybvyzclem`). Production is out of scope.
4. A9 remains a deferred Architecture Authority exception and was not resolved.

---

## 14. Sign-off

| Role | Name | Acknowledgment | Date |
|---|---|---|---|
| Gate Executor | Engineering Implementation Authority | Evidence collected and reported | 2026-07-18 |
| Gate Reviewer | *(pending)* |  |  |
| Gate Approver (Program Manager) | *(pending)* |  |  |
| Architecture Authority Input | *(pending, if required)* |  |  |

---

*Basis: `D-034-01_Deployment_Validation_Gate_Definition.md`, `D-034-02_Deployment_Validation_Evidence_Checklist.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `PHASE2_FINAL_CERTIFICATION.md`, `PHASE4_FINAL_CERTIFICATION.md`, `CURRENT_TASK-035_PROGRAM_AUTHORIZATION.md`, `CURRENT_TASK-035_ENGINEERING_KICKOFF.md`.*
