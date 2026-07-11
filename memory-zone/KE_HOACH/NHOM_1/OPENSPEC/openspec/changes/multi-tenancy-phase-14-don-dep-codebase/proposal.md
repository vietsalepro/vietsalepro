## Why

Xóa file rác, backup tables không cần thiết, chuẩn hóa error handling.

## What Changes

- Code changes:
  - Xóa `components/MobilePOS.backup.tsx` (nếu còn).
  - Xóa `memory-zone/.temp/phase*/fixed_*.sql` đã deploy.
  - Xóa thư mục `OLD` nếu không cần nữa.
  - Xóa các file test tạm, console.log, dead code.
  - Chuẩn hóa error handling với `AppError` class.
- SQL migrations (see design.md for full scripts)

## Scope / Non-Goals

**In scope:**
- Sub-phase 14: Dọn dẹp codebase
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `d-n-d-p-codebase`: Xóa file rác, backup tables không cần thiết, chuẩn hóa error handling.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.