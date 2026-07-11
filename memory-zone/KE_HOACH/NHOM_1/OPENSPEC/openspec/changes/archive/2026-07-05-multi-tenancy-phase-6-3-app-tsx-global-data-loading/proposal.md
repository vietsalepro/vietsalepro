## Why

Bọc `TenantProvider` trong `App.tsx`, load data theo tenant.

## What Changes

- See implementation tasks for detailed changes.

## Scope / Non-Goals

**In scope:**
- Sub-phase 6.3: App.tsx + global data loading
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `app-tsx-global-data-loading`: Bọc `TenantProvider` trong `App.tsx`, load data theo tenant.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.