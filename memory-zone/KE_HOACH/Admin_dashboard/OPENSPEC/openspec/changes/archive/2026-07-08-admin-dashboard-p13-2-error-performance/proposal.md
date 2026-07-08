## Why

P13.2 — Error log aggregation + performance metrics (P95/P99, RPS) + charts.

## What Changes

- Implement P13 2 Error Performance per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.
- See design.md for technical decisions and tasks.md for implementation steps.

## Scope / Non-Goals

**In scope:**
- P13 2 Error Performance

**Out of scope:**
- Other admin dashboard phases not listed here.

## Capabilities

### New Capabilities
- `p13-2-error-performance`: P13.2 — Error log aggregation + performance metrics (P95/P99, RPS) + charts.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see design.md.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.
