## Why

System admin tạo tenant + admin user.

## What Changes

- Output files:
  - `supabase/functions/create-tenant/index.ts`
  - RPC `create_tenant_with_admin` (nếu cần)
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

## Scope / Non-Goals

**In scope:**
- Sub-phase 9.1: `create-tenant`
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `create-tenant`: System admin tạo tenant + admin user.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.