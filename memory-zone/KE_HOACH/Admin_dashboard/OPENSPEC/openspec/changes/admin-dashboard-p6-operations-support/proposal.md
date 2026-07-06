## Why

P6 — Operations & support: data retention, default plan limits, maintenance mode, CSV export.

## What Changes

- Implement P6 Operations Support per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.
- See design.md for technical decisions and tasks.md for implementation steps.

## Scope / Non-Goals

**In scope:**
- P6 Operations Support

**Out of scope:**
- Other admin dashboard phases not listed here.

## Capabilities

### New Capabilities
- `p6-operations-support`: P6 — Operations & support: data retention, default plan limits, maintenance mode, CSV export.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see design.md.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.
