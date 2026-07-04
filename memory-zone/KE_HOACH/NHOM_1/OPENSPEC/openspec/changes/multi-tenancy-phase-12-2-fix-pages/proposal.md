## Why

Fix lỗi TypeScript trong `pages/`.

## What Changes

- Code changes:
  - Sửa từng page để pass `strict`.
  - Ưu tiên các page POS, orders, products, customers.

## Scope / Non-Goals

**In scope:**
- Sub-phase 12.2: Fix pages
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `fix-pages`: Fix lỗi TypeScript trong `pages/`.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.