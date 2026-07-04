## Why

Implement sub-phase 5.3: RLS policies — remaining tables + unique indexes of the multi-tenancy migration.

## What Changes

- SQL migrations (see design.md for full scripts)
- See implementation tasks for detailed changes.

## Scope / Non-Goals

**In scope:**
- Sub-phase 5.3: RLS policies — remaining tables + unique indexes
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `rls-policies-remaining-tables-unique-indexes`: RLS policies — remaining tables + unique indexes

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.