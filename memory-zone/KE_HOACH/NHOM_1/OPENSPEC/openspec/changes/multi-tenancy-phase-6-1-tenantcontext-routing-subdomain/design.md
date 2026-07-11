## Context

This change implements sub-phase 6.1: TenantContext + routing/subdomain from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- Subdomain → tenant, load tenant/membership, xử lý 404/suspended.

- Logic:
  - Subdomain `admin` hoặc root domain → không cần resolve tenant; routing riêng cho SystemAdminDashboard/LandingPage.
  - Subdomain khác không tồn tại trong `tenants` → redirect `vietsalepro.com` hoặc 404.
  - Tenant suspended → trang "Tài khoản đã bị tạm dừng".
  - User không thuộc tenant → trang "Bạn không có quyền truy cập cửa hàng này".

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