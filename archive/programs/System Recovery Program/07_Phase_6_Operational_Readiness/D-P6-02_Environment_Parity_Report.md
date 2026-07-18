# D-P6-02 — Environment Parity Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 6 — Operational Trust & Deployment Readiness  
**Task:** CURRENT_TASK-036 — Environment Parity Report  
**Document Type:** Phase 6 Deliverable — Environment Parity Report  
**Version:** 1.0  
**Date:** 2026-07-18  
**Authority:** Engineering Implementation Authority  
**Target Environment:** Supabase Staging (`shbmzvfcenbybvyzclem`)  

---

## 1. Executive Summary

This report records the live execution of the `D-034-01` Deployment Validation Gate against the designated Phase 6 Staging environment. The gate was executed with Supabase MCP access limited to the Staging project `shbmzvfcenbybvyzclem`.

The Staging environment is **not in parity** with the canonical migration chain, the reconciled RPC contract, or the reference generated artifacts. The `D-034-01` gate returned **FAIL**. The primary findings are:

- Only 77 of 138 canonical forward migrations are recorded in `supabase_migrations.schema_migrations`.
- The canonical baseline migration `20250703000000_baseline_pre_tenant_schema.sql` is absent from the Staging migration state.
- Internal migration version values diverge from canonical file timestamps, breaking the lexicographic ordering guarantee.
- 23 RPCs defined in `D-P3-01_Reconciled_RPC_Contract.md` are not present in Staging.
- The reference generated artifacts in the repository remain byte-identical to the `D-035-01` baseline, but they could not be reproduced in Staging for a full byte-for-byte comparison because the canonical chain could not be deterministically applied.

The A9 deferred observation is recorded and remains unresolved.

---

## 2. Scope and Constraints

### 2.1 In Scope

- Supabase MCP access to Staging only (`shbmzvfcenbybvyzclem`).
- Execution of `D-034-01` pre-deployment, deployment, and post-deployment gate checks.
- Regeneration and comparison of `database.types.ts` where tooling permitted.
- RPC surface parity validation against `D-P3-01_Reconciled_RPC_Contract.md`.
- Recording of the A9 deferred exception without resolving it.

### 2.2 Out of Scope

- Production access or modification.
- Creating, waiving, or resolving the A9 canonical migration.
- Editing canonical migration SQL, service code, tests, or runtime configuration.
- Operational runbook updates (reserved for `D-P6-03`).

---

## 3. Environment Information

| Attribute | Value |
|---|---|
| Project name | QLBH Staging Multi-Tenant |
| Project ID | `shbmzvfcenbybvyzclem` |
| Region | `ap-northeast-1` |
| Status | `ACTIVE_HEALTHY` |
| PostgreSQL engine | 17.6.1.141 |
| Database host | `db.shbmzvfcenbybvyzclem.supabase.co` |

---

## 4. Canonical Migration Chain Validation

### 4.1 Repository Canonical Chain

| Attribute | Value |
|---|---|
| Canonical directory | `supabase/migrations` |
| Forward migration files | 138 |
| First migration | `20250703000000_baseline_pre_tenant_schema.sql` |
| Last migration | `20260728000000_sp5_6_db_maintenance.sql` |
| Ordering rule | Ascending lexicographic sort of full file names |
| Duplicate timestamps | None detected |

### 4.2 Staging Migration State

| Attribute | Value |
|---|---|
| Migrations recorded in `supabase_migrations.schema_migrations` | 77 |
| First recorded migration | `20250704000000` |
| Last recorded migration | `20260728000000` |
| Canonical baseline (`20250703000000`) recorded | **No** |
| Canonical files missing from Staging | 61 (including `20250703000000_baseline_pre_tenant_schema.sql` and multiple Phase 5/6 fix migrations) |
| Non-canonical internal versions observed | Yes — e.g. `20260712013813` maps to name `20250711000001_phase_5_long_term_explicit_grants` |

### 4.3 Ordering Anomalies

The following anomalies violate the `D-034-01` requirement that migrations apply in exact lexicographic order with no skips:

1. The canonical baseline `20250703000000` is not present in the Staging migration state.
2. Canonical migrations between `20250705000017` and `20260708000000` are absent or recorded under non-canonical internal version numbers.
3. The `supabase_migrations.schema_migrations.version` column does not consistently equal the canonical timestamp prefix from the migration filename, making lexicographic verification unreliable.

Because of these anomalies, the deployment gate was **aborted** before applying any new migrations, per `D-034-01` instruction to abort immediately on ordering anomalies.

---

## 5. Generated Artifact Validation

### 5.1 Reference Artifact Checksums (Repository Baseline)

| Artifact | Path | SHA-256 | Size (bytes) |
|---|---|---|---|
| Reference schema | `supabase/schema.sql` | `C3738BCBEAABA04D8FE7C86FEB1F89C19BD0E6B8F50E865F58CE235A24EC3689` | 1,357,565 |
| Reference types | `supabase/generated/database.types.ts` | `6C8767DDE630FC0A8F33DF955EAC468BB84DEF6119545B581ADF06C23CD81C8A` | 202,365 |

The repository artifacts were independently verified against the `D-035-01` baseline and are byte-identical.

### 5.2 Regeneration Attempt on Staging

| Tool | Result |
|---|---|
| `generate_typescript_types` | Executed against Staging. The returned output began with `export type Json = ...` and ended with `export const Constants = { ... }`, identical to the reference artifact's opening and closing tokens. The complete payload was too large to capture in full, so a byte-for-byte SHA-256 comparison could not be completed. |
| Schema dump (`supabase/schema.sql`) | No Supabase MCP tool for schema-only dump was available. A full `schema.sql` could not be regenerated from Staging. |

### 5.3 Artifact Comparison

| Check | Status | Evidence |
|---|---|---|
| Repository artifacts unchanged from `D-035-01` baseline | **Pass** | SHA-256 and size match |
| `database.types.ts` regenerated from Staging and byte-identical to reference | **Inconclusive** | Output size exceeded capture limits; partial token comparison only |
| `schema.sql` regenerated from Staging and byte-identical to reference | **Not performed** | No MCP schema-dump capability; deployment aborted before a clean rebuild |

---

## 6. RPC Surface Validation

### 6.1 Staging RPC Inventory

| Attribute | Value |
|---|---|
| Public functions present in Staging | 284 |
| Unique public function names in Staging | 277 |
| Tables in Staging `public` schema | 76 |

### 6.2 Contract Parity against D-P3-01

| Metric | Value |
|---|---|
| `D-P3-01` contract RPC names extracted | 187 (including 4 table-header tokens: `Category`, `Item`, `Metric`, `RPC`) |
| Service-layer contract RPCs | 183 |
| Contract RPCs present in Staging | 160 |
| Contract RPCs **missing** from Staging | 23 |
| Staging functions not in `D-P3-01` but defined in canonical chain | 117 (consistent with `D-P3-01` reconciliation summary) |

### 6.3 Missing D-P3-01 RPCs in Staging

The following contract RPCs were not found in the Staging `public` schema:

- `accept_invitation`
- `can_use_feature`
- `create_gdpr_request`
- `gdpr_delete_user_data`
- `gdpr_export_user_data`
- `get_current_user_tenants`
- `get_gdpr_requests`
- `get_locked_emails`
- `get_login_attempts`
- `get_tenant_feature_flags`
- `get_tenant_security_settings`
- `get_tenants_admin`
- `is_tenant_owner`
- `lookup_invitation`
- `record_login_attempt`
- `remove_tenant_member`
- `search_tenant_members`
- `toggle_tenant_member_active`
- `unlock_login_attempts`
- `update_tenant_feature_flags`
- `update_tenant_ip_allowlist`
- `update_tenant_member_role`
- `update_tenant_session_timeout`

These missing functions correspond to canonical migrations that are not recorded in the Staging migration state.

### 6.4 Extraneous RPCs

No RPCs were found in Staging that are outside the canonical chain and outside the `D-P3-01` contract, other than 117 canonical functions that are not invoked by the service layer. These are not treated as non-conformances because `D-P3-01` explicitly documents them as canonical functions not called by the service layer.

---

## 7. Exception Register

| Exception ID | Related Check | Description | Architecture Authority Decision Reference | Disposition |
|---|---|---|---|---|
| A9 | `D-034-01` PD-04 / PV-05 | Missing canonical migration `20260724000000_sp4_4_webhook_delivery_hardening.sql` | `PHASE6_OPENING_AUTHORIZATION.md` §6; `PHASE6_READINESS_AUTHORIZATION.md` §6 | Deferred to a separate Architecture Authority `CURRENT_TASK`; recorded only, not resolved |

---

## 8. Non-Conformances

| ID | Finding | Severity | Recommended Action |
|---|---|---|---|
| NC-01 | Staging migration state is not canonical: 77 of 138 migrations recorded, baseline missing, non-canonical internal version values | High | Reconcile Staging to a clean target or apply missing canonical migrations in exact order after resolving the anomaly |
| NC-02 | 23 `D-P3-01` contract RPCs are absent from Staging | High | Apply the missing canonical migrations that define these functions |
| NC-03 | `database.types.ts` could not be fully captured for byte-for-byte comparison | Medium | Use a chunked or file-based type-generation path when available |

---

## 9. Gate Result

| Environment | Result | Rationale |
|---|---|---|
| Supabase Staging (`shbmzvfcenbybvyzclem`) | **FAIL** | The canonical migration chain cannot be deterministically applied due to migration-state anomalies, and 23 reconciled RPCs are missing. Environment parity is not established. |

### Promotion Recommendation

**DENY** any promotion of the Staging environment to a current/current-production reference until the migration-state anomalies are remediated and the gate is re-executed with all `D-034-01` checks passing.

---

## 10. Deliverables and Evidence Inventory

| Deliverable / Evidence | Location | Status |
|---|---|---|
| Completed `D-034-02` checklist for Staging | `D-034-02_Deployment_Validation_Evidence_Checklist.md` | Produced |
| Environment Parity Report (this document) | `D-P6-02_Environment_Parity_Report.md` | Produced |
| Staging project metadata | `get_project(shbmzvfcenbybvyzclem)` | Collected |
| Migration state inventory | `list_migrations` / `supabase_migrations.schema_migrations` | Collected |
| Canonical migration chain inventory | `supabase/migrations/*.sql` (138 files) | Collected |
| Reference artifact checksum manifest | `D-035-01` §6.1; independent `Get-FileHash` verification | Collected |
| RPC inventory from Staging | `pg_proc` public schema query | Collected |
| RPC parity comparison | `D-P3-01_Reconciled_RPC_Contract.md` vs Staging `pg_proc` | Collected |
| A9 exception register entry | `PHASE6_OPENING_AUTHORIZATION.md` §6; this report §7 | Collected |

No repository-generated artifacts were modified or saved during this task because the canonical chain could not be cleanly applied and the generated types output could not be captured in full.

---

*Basis: `D-034-01_Deployment_Validation_Gate_Definition.md`; `D-035-01_Deployment_Readiness_Evidence.md`; `D-P3-01_Reconciled_RPC_Contract.md`; `PHASE6_OPENING_AUTHORIZATION.md`; `CURRENT_TASK-036_PROGRAM_AUTHORIZATION.md`; `CURRENT_TASK-036_ENGINEERING_KICKOFF.md`.*
