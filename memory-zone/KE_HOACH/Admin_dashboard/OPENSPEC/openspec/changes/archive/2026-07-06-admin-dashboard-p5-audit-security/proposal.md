## Why

P5 — Audit & security: audit log filters, rate limit logs, system admin CRUD.

## What Changes

- Implement P5 Audit Security per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.
- See design.md for technical decisions and tasks.md for implementation steps.

## Scope / Non-Goals

**In scope:**
- P5 Audit Security

**Out of scope:**
- Other admin dashboard phases not listed here.

## Capabilities

### New Capabilities
- `p5-audit-security`: P5 — Audit & security: audit log filters, rate limit logs, system admin CRUD.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see design.md.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.
