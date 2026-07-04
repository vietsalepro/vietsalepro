## Why

Trang `admin.vietsalepro.com` để tạo/sửa/suspend cửa hàng.

## What Changes

- Code changes:
  - `pages/SystemAdminDashboard.tsx`
  - Route `/admin/*` hoặc subdomain `admin.vietsalepro.com`
  - RPC `create_tenant_with_admin`
  - RPC `update_tenant_status`
  - Chỉ `system_admins` truy cập

## Scope / Non-Goals

**In scope:**
- Sub-phase 8: Tạo admin dashboard cho chủ hệ thống (giữ nguyên)
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `t-o-admin-dashboard-cho-ch-h-th-ng-gi-nguy-n`: Trang `admin.vietsalepro.com` để tạo/sửa/suspend cửa hàng.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.