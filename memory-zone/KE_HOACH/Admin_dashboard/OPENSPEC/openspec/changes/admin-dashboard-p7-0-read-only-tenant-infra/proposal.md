## Why

P7.0 — Read-only tenant infrastructure: status check, RLS guards, TENANT_READ_ONLY error.

## What Changes

- Implement P7 0 Read Only Tenant Infra per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.
- See design.md for technical decisions and tasks.md for implementation steps.

## Scope / Non-Goals

**In scope:**
- P7 0 Read Only Tenant Infra

**Out of scope:**
- Other admin dashboard phases not listed here.

## Capabilities

### New Capabilities
- `p7-0-read-only-tenant-infra`: P7.0 — Read-only tenant infrastructure: status check, RLS guards, TENANT_READ_ONLY error.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see design.md.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.
