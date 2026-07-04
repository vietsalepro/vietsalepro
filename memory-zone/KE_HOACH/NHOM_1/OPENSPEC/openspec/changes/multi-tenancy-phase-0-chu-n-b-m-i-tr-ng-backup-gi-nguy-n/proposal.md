## Why

Có nơi test an toàn, production được backup, CI pass.

## What Changes

- See implementation tasks for detailed changes.

## Scope / Non-Goals

**In scope:**
- Sub-phase 0: Chuẩn bị môi trường & backup (giữ nguyên)
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `chu-n-b-m-i-tr-ng-backup-gi-nguy-n`: Có nơi test an toàn, production được backup, CI pass.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.