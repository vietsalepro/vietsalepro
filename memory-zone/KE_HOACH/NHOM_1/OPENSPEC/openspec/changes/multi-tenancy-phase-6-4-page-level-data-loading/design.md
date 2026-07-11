## Context

This change implements sub-phase 6.4: Page-level data loading from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- Sửa các page cần load data để nhận `tenantId` từ `TenantContext`.

- Code changes:
  - Tạo hook `useTenant()` để lấy `tenant`, `membership`, `role`.
  - Sửa các page chính: POS, orders, products, customers, reports, inventory.
  - Ưu tiên sửa các `useEffect` fetch data: thêm `tenantId` vào dependency array.

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