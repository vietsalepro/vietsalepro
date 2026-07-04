## Why

Dữ liệu cũ thuộc về tenant đầu tiên; xử lý core tables trước.

## What Changes

- SQL migrations (see design.md for full scripts)
- See implementation tasks for detailed changes.

## Scope / Non-Goals

**In scope:**
- Sub-phase 4.1: Tạo tenant đầu + backfill core tables
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `t-o-tenant-u-backfill-core-tables`: Dữ liệu cũ thuộc về tenant đầu tiên; xử lý core tables trước.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.