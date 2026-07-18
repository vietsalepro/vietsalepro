# D-P6-03 Staging Canonicalization Report

**Project:** VietSalePro v7 — System Recovery Program  
**Environment:** Supabase Staging (`shbmzvfcenbybvyzclem`)  
**Date:** 2026-07-31  
**Author:** Devin CLI Agent  
**Task:** CURRENT_TASK-037 — Canonicalize the Staging environment to the repository single source of truth

---

## 1. Objective

Restore the Supabase Staging database to a clean, known-canonical state that faithfully reflects the `supabase/migrations` forward migration chain. Close the D-034-01 Deployment Validation Gate failures observed in CURRENT_TASK-036.

## 2. Canonical Reference

| Artifact | Path / Identifier |
|----------|-------------------|
| Forward migration chain | `supabase/migrations/*.sql` (138 files, lexicographic order) |
| Schema artifact | `supabase/schema.sql` (SHA256 `C3738BCBEAABA04D8FE7C86FEB1F89C19BD0E6B8F50E865F58CE235A24EC3689`) |
| RPC contract | `D-P3-01_Reconciled_RPC_Contract.md` (183 unique service-layer RPCs) |
| Type artifact | `supabase/generated/database.types.ts` (SHA256 `6C8767DDE630FC0A8F33DF955EAC468BB84DEF6119545B581ADF06C23CD81C8A`) |

## 3. Methodology

Because the `postgres` role is required to execute DDL that references the `auth` schema while the Supabase MCP tools cannot accept multi-megabyte SQL payloads, the work was performed with a temporary `SECURITY DEFINER` helper:

1. Created a temporary role `staging_canon`.
2. Created `supabase_migrations.apply_file(file_name, version, name)` owned by `postgres`.
3. Used a Node/pg client as `staging_canon` to split each migration into top-level statements and load them into `public.canonicalization_queue`.
4. Invoked `apply_file(...)` for each migration in strict file order, executing statements as `postgres` and recording the `supabase_migrations.schema_migrations` row.
5. Dropped the helper function, queue table, and `staging_canon` role after completion.

The `public` schema was reset (`DROP SCHEMA ... CASCADE; CREATE SCHEMA public`) before the run.

## 4. Execution Results

| Step | Result |
|------|--------|
| Migrations applied | 138 / 138 (28.4 s total) |
| Migration table rows | 138 |
| Public tables | 90 |
| Public functions (`pg_proc` `prokind = 'f'`) | 308 |
| D-P3-01 previously-missing RPCs now present | 23 / 23 |
| `schema.sql` file in repo | unchanged, SHA256 matches baseline |
| `database.types.ts` repo artifact | identical in schema content to freshly-generated types after normalizing for PostgREST generator-version header, BOM, and CRLF/LF line endings |

The migration list returned by `list_migrations` matches the canonical chain file-for-file:

- First: `20250703000000_baseline_pre_tenant_schema`
- Last: `20260728000000_sp5_6_db_maintenance`
- Count: 138

## 5. Edge Functions

| Source | Count |
|--------|-------|
| Repository `supabase/functions/*` | 31 folders |
| Currently deployed in Staging | 10 active functions |

Edge functions are not part of the canonical SQL migration chain and were not redeployed during this database canonicalization. The 10 deployed functions remain active.

## 6. Observations and Deferred Items

| ID | Item | Status | Note |
|----|------|--------|------|
| A9 | `20260724000000_sp4_4_webhook_delivery_hardening.sql` | Deferred | Still absent from `supabase/migrations`; not applied. Follows A9 Architecture Authority resolution from prior tasks. |
| G1 | `database.types.ts` generated vs repo | Reconciled | Differences are generator-formatting only (PostgREST version header, BOM, CRLF). The public schema type definitions are byte-identical after normalization. |
| G2 | `supabase/schema.sql` regeneration | Not executed | No `pg_dump` or `supabase db dump` tooling is available in the execution environment, and the Supabase MCP server does not expose a schema-dump tool. The existing concatenated migration artifact remains the canonical reference and its SHA is unchanged. |
| G3 | Edge function parity | Not in scope | 31 source folders vs 10 deployed. Redeployment requires Supabase CLI authentication or per-function MCP `deploy_edge_function` calls. |
| G4 | Seed data | N/A | No `supabase/seed.sql` file exists in the repository. |

## 7. Conclusion

- **Migration state:** Canonical — 138 migrations applied in exact order.
- **Schema state:** Rebuilt from canonical migrations; 90 tables and 308 public functions present.
- **RPC contract parity:** The 23 missing D-P3-01 RPCs are now present; the contract is satisfied to the extent verifiable from the migration chain.
- **Generated types:** Schema-identical to the repository artifact.
- **Overall:** Staging database canonicalization is **COMPLETE WITH OBSERVATIONS** (A9, G2, G3).
