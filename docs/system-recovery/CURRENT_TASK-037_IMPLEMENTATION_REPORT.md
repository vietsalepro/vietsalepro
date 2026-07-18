# CURRENT_TASK-037 Implementation Report — Staging Canonicalization

**Project:** VietSalePro v7 — System Recovery Program  
**Date:** 2026-07-31  
**Environment:** Supabase Staging (`shbmzvfcenbybvyzclem`)

## What Was Done

Canonicalized the Staging environment against the `supabase/migrations` single source of truth.

1. Reset `public` schema and truncated `supabase_migrations.schema_migrations`.
2. Built a temporary `SECURITY DEFINER` helper (`supabase_migrations.apply_file`) owned by `postgres` to overcome `auth` schema permission restrictions.
3. Split all 138 canonical migration files into top-level statements and applied them in strict lexicographic order using Node/pg + the helper.
4. Recorded each migration in `supabase_migrations.schema_migrations` as it was applied.
5. Dropped the helper, queue table, and temporary `staging_canon` role.
6. Regenerated `database.types.ts` via `generate_typescript_types` and validated it against the repository artifact.
7. Validated RPC parity against the D-P3-01 contract.

## Key Results

| Check | Result |
|-------|--------|
| Canonical migrations applied | 138 / 138 |
| `list_migrations` matches canonical chain | Yes |
| Public tables | 90 |
| Public functions | 308 |
| D-P3-01 23 previously-missing RPCs | All present |
| `schema.sql` unchanged | SHA256 `C3738BCBEAABA04D8FE7C86FEB1F89C19BD0E6B8F50E865F58CE235A24EC3689` |
| `database.types.ts` | Schema-identical to generated types after normalization for generator header/line endings |
| Seed applied | No `supabase/seed.sql` exists |

## Observations

- D-034-01 migration and RPC parity failures are now resolved.
- A9 missing migration `20260724000000_sp4_4_webhook_delivery_hardening.sql` remains deferred (not in repository).
- Edge functions were not redeployed; 31 source folders exist, 10 currently active in Staging.
- `supabase/schema.sql` could not be re-dumped in the execution environment; the canonical concatenated migration artifact is unchanged.

## Deliverables

- `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md`
- `docs/system-recovery/CURRENT_TASK-037_IMPLEMENTATION_REPORT.md` (this file)

## Status

**COMPLETE WITH OBSERVATIONS**
