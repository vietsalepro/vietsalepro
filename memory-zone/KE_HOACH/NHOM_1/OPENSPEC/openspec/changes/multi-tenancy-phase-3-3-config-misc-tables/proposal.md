## Why

Implement sub-phase 3.3: Config & misc tables of the multi-tenancy migration.

## What Changes

- Database tables: `app_settings`, `brands`, `categories`, `einvoice_config`, `einvoice_orders`, `point_history`, `processed_operations`, `rank_configs`, `rank_history`, `rewards`, `customer_payment_ledger`, `supplier_payment_ledger`
- Code changes:
  - Thêm `tenant_id` vào interface của 12 bảng trong `types.ts`.

## Scope / Non-Goals

**In scope:**
- Sub-phase 3.3: Config & misc tables
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `config-misc-tables`: Config & misc tables

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.