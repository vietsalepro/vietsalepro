## Context

This change implements sub-phase 8: Tạo admin dashboard cho chủ hệ thống (giữ nguyên) from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- Trang `admin.vietsalepro.com` để tạo/sửa/suspend cửa hàng.

- Code changes:
  - `pages/SystemAdminDashboard.tsx`
  - Route `/admin/*` hoặc subdomain `admin.vietsalepro.com`
  - RPC `create_tenant_with_admin`
  - RPC `update_tenant_status`
  - Chỉ `system_admins` truy cập

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