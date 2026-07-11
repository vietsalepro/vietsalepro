## Why

Fix lỗi TypeScript trong `components/`.

## What Changes

- Code changes:
  - Sửa từng component để pass `strict`.
  - Chạy `npm run build` cuối cùng.

## Scope / Non-Goals

**In scope:**
- Sub-phase 12.3: Fix components + final build
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `fix-components-final-build`: Fix lỗi TypeScript trong `components/`.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.