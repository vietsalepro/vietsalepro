## Context

This change implements sub-phase 9.1: `create-tenant` from the multi-tenancy migration plan.

Output files: `supabase/functions/create-tenant/index.ts`, RPC `create_tenant_with_admin` (nếu cần)

## Goals / Non-Goals

**Goals:**
- System admin tạo tenant + admin user.

- Logic:
  - Rate limiting: 10 request/phút/IP (dùng `rate_limit_logs`).
  - Kiểm tra caller là system admin (qua `system_admins`).
  - Validate subdomain: chỉ chữ thường, số, dấu gạng ngang; độ dài 3-63; không trùng reserved (`admin`, `www`, `api`, `app`).
  - Kiểm tra subdomain chưa tồn tại trong `public.tenants`.
  - Tạo user admin trong `auth.users` bằng `supabase.auth.admin.createUser({ email, password, email_confirm: true })`.
  - Tạo tenant trong `public.tenants` với `owner_id` = user admin vừa tạo.
  - Tạo subscription trong `public.tenant_subscriptions` theo gói được chọn (free/vip).
  - Tạo membership admin trong `public.tenant_memberships`.
  - Ghi audit log `INSERT` vào `public.app_audit_log` (nếu trigger chưa gắn hoặc ghi thủ công).
  - Trả về `{ tenant, adminUser, initialPassword }`.

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