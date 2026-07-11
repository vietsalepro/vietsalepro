## Context

This change implements sub-phase 9.5: `process-checkout` from the multi-tenancy migration plan.

Output files: `supabase/functions/process-checkout/index.ts`

## Goals / Non-Goals

**Goals:**
- Cập nhật từ RPC hiện tại để xử lý tenant.

- Logic:
  - Nhận `x-tenant-id` hoặc `x-subdomain`.
  - Xử lý đơn hàng, cập nhật tồn kho, điểm thưởng trong phạm vi tenant.

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