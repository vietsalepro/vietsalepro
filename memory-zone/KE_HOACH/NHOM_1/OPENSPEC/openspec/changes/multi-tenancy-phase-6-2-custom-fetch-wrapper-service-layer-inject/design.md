## Context

This change implements sub-phase 6.2: Custom fetch wrapper + service layer inject from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- Mọi request tự động gắn `x-tenant-id`; mọi `insert/update` trong `services/supabaseService.ts` gắn `tenant_id`.

- Code changes:
  - Hoàn thiện `lib/supabase.ts` (xem sub-phase 5.1).
  - Rà soát `services/supabaseService.ts`:

**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.