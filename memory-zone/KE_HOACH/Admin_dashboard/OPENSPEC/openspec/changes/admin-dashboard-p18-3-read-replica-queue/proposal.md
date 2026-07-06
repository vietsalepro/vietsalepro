## Why

P18.3 — Read replica + connection pooling + queue system for heavy ops (YAGNI).

## What Changes

- Implement P18 3 Read Replica Queue per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.
- See design.md for technical decisions and tasks.md for implementation steps.

## Scope / Non-Goals

**In scope:**
- P18 3 Read Replica Queue

**Out of scope:**
- Other admin dashboard phases not listed here.

## Capabilities

### New Capabilities
- `p18-3-read-replica-queue`: P18.3 — Read replica + connection pooling + queue system for heavy ops (YAGNI).

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see design.md.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.
