## Context

This change implements sub-phase 13.2: Integration tests — tenant isolation from the multi-tenancy migration plan.

Output files: `tests/integration/tenant-isolation.test.ts`

## Goals / Non-Goals

**Goals:**
- Test cách ly dữ liệu giữa các tenant.


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