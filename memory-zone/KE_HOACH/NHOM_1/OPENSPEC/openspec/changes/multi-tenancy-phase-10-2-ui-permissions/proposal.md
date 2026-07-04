## Why

Menu ẩn/hiện, button disabled theo quyền.

## What Changes

- Code changes:
  - `hooks/usePermissions.ts`:

## Scope / Non-Goals

**In scope:**
- Sub-phase 10.2: UI permissions
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `ui-permissions`: Menu ẩn/hiện, button disabled theo quyền.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.