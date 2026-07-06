## Why

P8.2 — Feature flags via tenants.settings JSONB + toggle UI (YAGNI).

## What Changes

- Implement P8 2 Feature Flags per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.
- See design.md for technical decisions and tasks.md for implementation steps.

## Scope / Non-Goals

**In scope:**
- P8 2 Feature Flags

**Out of scope:**
- Other admin dashboard phases not listed here.

## Capabilities

### New Capabilities
- `p8-2-feature-flags`: P8.2 — Feature flags via tenants.settings JSONB + toggle UI (YAGNI).

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see design.md.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.
