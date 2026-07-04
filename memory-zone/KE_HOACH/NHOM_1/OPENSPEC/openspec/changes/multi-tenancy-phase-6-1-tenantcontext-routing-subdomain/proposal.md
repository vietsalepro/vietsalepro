## Why

Subdomain → tenant, load tenant/membership, xử lý 404/suspended.

## What Changes

- Logic:
  - Subdomain `admin` hoặc root domain → không cần resolve tenant; routing riêng cho SystemAdminDashboard/LandingPage.
  - Subdomain khác không tồn tại trong `tenants` → redirect `vietsalepro.com` hoặc 404.
  - Tenant suspended → trang "Tài khoản đã bị tạm dừng".
  - User không thuộc tenant → trang "Bạn không có quyền truy cập cửa hàng này".

## Scope / Non-Goals

**In scope:**
- Sub-phase 6.1: TenantContext + routing/subdomain
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `tenantcontext-routing-subdomain`: Subdomain → tenant, load tenant/membership, xử lý 404/suspended.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.