## Why

4 role, policies theo role.

## What Changes

- SQL migrations (see design.md for full scripts)
- See implementation tasks for detailed changes.

## Scope / Non-Goals

**In scope:**
- Sub-phase 10.1: DB policies theo role
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `db-policies-theo-role`: 4 role, policies theo role.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.