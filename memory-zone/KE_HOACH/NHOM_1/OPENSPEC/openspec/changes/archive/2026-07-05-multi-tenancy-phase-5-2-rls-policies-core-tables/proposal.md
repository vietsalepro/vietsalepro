## Why

Implement sub-phase 5.2: RLS policies — core tables of the multi-tenancy migration.

## What Changes

- Database tables: `products`, `customers`, `orders`, `order_items`, `suppliers`

## Scope / Non-Goals

**In scope:**
- Sub-phase 5.2: RLS policies — core tables
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `rls-policies-core-tables`: RLS policies — core tables

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.