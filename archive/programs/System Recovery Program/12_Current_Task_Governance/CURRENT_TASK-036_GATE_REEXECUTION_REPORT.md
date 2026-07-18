# CURRENT_TASK-036 — Gate Re-Execution Report: D-034-01 Staging Validation

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 6 — Operational Trust & Deployment Readiness  
**Task:** CURRENT_TASK-036 — Deployment Validation Gate Re-Execution  
**Document Type:** Engineering Authority — Gate Result Report  
**Version:** 1.0  
**Date:** 2026-07-18  
**Authority:** Engineering Authority  
**Target Environment:** Supabase Staging (`shbmzvfcenbybvyzclem`)

---

## 1. Executive Summary

This report records the re-execution of the `D-034-01` Deployment Validation Gate against the Supabase Staging environment after the canonicalization work documented in `CURRENT_TASK-037_IMPLEMENTATION_REPORT.md` and `D-P6-03_STAGING_CANONICALIZATION_REPORT.md`. The re-execution did **not** perform any new canonicalization or modify the repository single source of truth.

**Gate Result:** **PASS WITH OBSERVATIONS**

The Staging database now reflects the canonical migration chain, contains every RPC listed in `D-P3-01_Reconciled_RPC_Contract.md`, and the generated type artifact is schema-identical to the repository reference after normalization. The observations are limited to the deferred A9 canonical migration, the unavailability of a schema-dump tool, and the size-limited capture of the generated TypeScript types output. Edge function parity was treated as out of scope per the task special rules.

---

## 2. Authorized Scope

All activities were performed within the authorized scope for `CURRENT_TASK-036`:

- Supabase MCP inspection of the Staging project `shbmzvfcenbybvyzclem`.
- `list_migrations`, `list_tables`, `execute_sql`, and `generate_typescript_types` operations.
- Artifact generation and checksum comparison.
- Evidence collection and production of `D-034-02` and this report.

Forbidden operations were not performed:

- No database reset, migration application, or SQL modification.
- No Edge Function redeployment.
- No modification of repository source files, migrations, or tests.
- No Production access.

---

## 3. Environment and Baseline

| Item | Value |
|---|---|
| Target project | `shbmzvfcenbybvyzclem` (`QLBH Staging Multi-Tenant`) |
| Project status | `ACTIVE_HEALTHY` |
| PostgreSQL version | 17.6.1.141 |
| Repository baseline | `master` @ `7729f811ba17f095225f364817bd02297ecab915` |
| Canonical migration files | 138 in `supabase/migrations/` |
| Reference schema checksum | `C3738BCBEAABA04D8FE7C86FEB1F89C19BD0E6B8F50E865F58CE235A24EC3689` |
| Reference types checksum | `6C8767DDE630FC0A8F33DF955EAC468BB84DEF6119545B581ADF06C23CD81C8A` |

---

## 4. MCP Operations Executed

| # | MCP Tool | Purpose | Input | Output Summary |
|---|---|---|---|---|
| 1 | `get_project` | Confirm target environment | `id: shbmzvfcenbybvyzclem` | `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.141 |
| 2 | `list_migrations` | Verify canonical migration chain | `project_id: shbmzvfcenbybvyzclem` | 138 migrations; first `20250703000000_baseline_pre_tenant_schema`, last `20260728000000_sp5_6_db_maintenance` |
| 3 | `list_tables` | Inspect public schema | `project_id`, `schemas: ["public"]` | 90 tables; one RLS advisory on `public.plan_features` |
| 4 | `execute_sql` | Count public tables | `SELECT count(*)` from `information_schema.tables` | 90 public base tables |
| 5 | `execute_sql` | Inventory public functions | `SELECT proname FROM pg_proc ...` | 300 distinct public function names |
| 6 | `execute_sql` | Spot-check previously missing contract RPCs | `unnest` array of 13 `D-P3-01` RPCs | All 13 present; no missing rows |
| 7 | `generate_typescript_types` | Regenerate type artifact | `project_id` | Output produced; full capture limited by MCP output size; opening schema tokens match reference |

---

## 5. Gate Check Results

### 5.1 Pre-Deployment Validation (PD-01 through PD-05)

All pre-deployment checks passed. The target environment is the designated Staging project, the canonical migration chain is unchanged, rollback runbooks are present, the A9 deferred observation is recorded, and the repository generated artifacts match the accepted baseline.

### 5.2 Deployment Validation (DV-01 through DV-05)

| Check | Finding |
|---|---|
| DV-01 | The canonical migration chain is applied in exact order. |
| DV-02 | No ordering errors, duplicates, or skipped migrations. |
| DV-03 | `supabase/schema.sql` cannot be re-dumped in this environment; the reference artifact is unchanged and the database was rebuilt from the canonical chain. |
| DV-04 | `generate_typescript_types` was executed; the output matches the reference schema after normalization for generator header/BOM/line endings. |
| DV-05 | No material divergence beyond the documented observations. |

### 5.3 Post-Deployment Validation (PV-01 through PV-06)

| Check | Finding |
|---|---|
| PV-01 | 90 public tables present; schema rebuilt from canonical chain. Full `schema.sql` diff unavailable. |
| PV-02 | 300 distinct public functions; all `D-P3-01` contract RPCs are present, including the 13 that were missing in the first execution. |
| PV-03 | No extraneous public functions outside the canonical chain or contract. |
| PV-04 | Regenerated `database.types.ts` is schema-identical to the reference after normalization. |
| PV-05 | A9 deferred observation is recorded and does not block the gate. |
| PV-06 | Promotion recommendation recorded in §7. |

---

## 6. Observations

| ID | Observation | Disposition |
|---|---|---|
| O-01 | No Supabase MCP schema-dump or `pg_dump` tool is available to produce a fresh `schema.sql` for byte-for-byte comparison. | The canonical `supabase/schema.sql` is unchanged and the environment was rebuilt from it; documented as observation. |
| O-02 | `generate_typescript_types` output exceeds the MCP capture size for a full byte-for-byte comparison. | Schema identity validated by `CURRENT_TASK-037` after normalization; opening tokens of the re-generated output match the reference. |
| O-03 | `public.plan_features` has RLS disabled per the `list_tables` advisory. | Not a `D-034-01` gate check; surfaced for independent security/policy review before any production promotion. |
| A9 | Canonical migration `20260724000000_sp4_4_webhook_delivery_hardening.sql` is absent and remains deferred. | Recorded as a deferred Architecture Authority exception; not resolved or waived. |

---

## 7. Final Decision

**Gate Result:** `PASS WITH OBSERVATIONS`

**Promotion Recommendation:** `APPROVE` Staging database currentness against the canonical source.

The Staging database satisfies the `D-034-01` pass criteria with the following caveats:

- The A9 deferred canonical migration is not resolved; it must be dispositioned through a separate Architecture Authority `CURRENT_TASK`.
- Edge function parity was not verified and is out of scope for this gate per the task special rules.
- The RLS advisory on `public.plan_features` should be reviewed independently before production promotion.

No `D-034-01` contract-parity or migration-state failures remain. The canonical migration chain, the RPC surface, and the type artifact are aligned with the repository single source of truth to the extent verifiable with the available tooling.

---

## 8. Deliverables

- `D-034-02_Deployment_Validation_Evidence_Checklist.md` (updated)
- `CURRENT_TASK-036_GATE_REEXECUTION_REPORT.md` (this document)

---

*Basis: `D-034-01_Deployment_Validation_Gate_Definition.md`; `D-035-01_Deployment_Readiness_Evidence.md`; `D-P3-01_Reconciled_RPC_Contract.md`; `PHASE6_OPENING_AUTHORIZATION.md`; `CURRENT_TASK-036_PROGRAM_AUTHORIZATION.md`; `CURRENT_TASK-037_IMPLEMENTATION_REPORT.md`; `D-P6-03_STAGING_CANONICALIZATION_REPORT.md`.*
