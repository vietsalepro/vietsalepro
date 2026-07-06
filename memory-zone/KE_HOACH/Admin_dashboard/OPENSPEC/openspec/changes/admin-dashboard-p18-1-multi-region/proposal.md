## Why

P18.1 — Multi-schema/multi-project isolation for VIP tenants (YAGNI).

## What Changes

- Implement P18 1 Multi Region per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.
- See design.md for technical decisions and tasks.md for implementation steps.

## Scope / Non-Goals

**In scope:**
- P18 1 Multi Region

**Out of scope:**
- Other admin dashboard phases not listed here.

## Capabilities

### New Capabilities
- `p18-1-multi-region`: P18.1 — Multi-schema/multi-project isolation for VIP tenants (YAGNI).

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see design.md.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.
