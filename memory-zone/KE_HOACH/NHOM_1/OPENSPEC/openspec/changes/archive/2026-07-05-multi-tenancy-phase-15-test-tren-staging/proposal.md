## Why

Chạy đầy đủ trên staging trước khi deploy production.

## What Changes

- See implementation tasks for detailed changes.

## Scope / Non-Goals

**In scope:**
- Sub-phase 15: Test trên staging (giữ nguyên)
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `test-tr-n-staging-gi-nguy-n`: Chạy đầy đủ trên staging trước khi deploy production.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.