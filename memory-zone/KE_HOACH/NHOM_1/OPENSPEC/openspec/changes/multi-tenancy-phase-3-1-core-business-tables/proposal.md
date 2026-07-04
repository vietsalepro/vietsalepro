## Why

Implement sub-phase 3.1: Core business tables of the multi-tenancy migration.

## What Changes

- Database tables: `products`, `customers`, `orders`, `order_items`, `suppliers`, `promotions`
- Code changes:
  - Thêm `tenant_id` vào interface của 6 bảng trong `types.ts`.

## Scope / Non-Goals

**In scope:**
- Sub-phase 3.1: Core business tables
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `core-business-tables`: Core business tables

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.