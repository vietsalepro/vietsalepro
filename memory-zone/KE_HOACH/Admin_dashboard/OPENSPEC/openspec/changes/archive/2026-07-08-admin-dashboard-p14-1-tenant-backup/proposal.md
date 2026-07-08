## Why

P14.1 — Per-tenant backup: RPC/Edge Function dump all tenant data + download button.

## What Changes

- Implement P14 1 Tenant Backup per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.
- See design.md for technical decisions and tasks.md for implementation steps.

## Scope / Non-Goals

**In scope:**
- P14 1 Tenant Backup

**Out of scope:**
- Other admin dashboard phases not listed here.

## Capabilities

### New Capabilities
- `p14-1-tenant-backup`: P14.1 — Per-tenant backup: RPC/Edge Function dump all tenant data + download button.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see design.md.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.
