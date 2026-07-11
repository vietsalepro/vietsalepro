## Why

Có `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins`.

## What Changes

- Code changes:
  - `types/tenant.ts`: `Tenant`, `TenantMembership`, `TenantRole`, `TenantSubscription`
  - `services/tenantService.ts`: `getTenantBySubdomain`, `getMembership`, `inviteMember`, `updateMemberRole`, `removeMember`
- SQL migrations (see design.md for full scripts)

## Scope / Non-Goals

**In scope:**
- Sub-phase 2: Tạo foundation multi-tenancy (giữ nguyên)
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `t-o-foundation-multi-tenancy-gi-nguy-n`: Có `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins`.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.