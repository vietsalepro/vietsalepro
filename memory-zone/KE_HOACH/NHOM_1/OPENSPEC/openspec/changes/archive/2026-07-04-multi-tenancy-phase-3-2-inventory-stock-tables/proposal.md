## Why

Implement sub-phase 3.2: Inventory & stock tables of the multi-tenancy migration.

## What Changes

- Database tables: `import_receipts`, `import_items`, `inventory_counts`, `inventory_count_items`, `inventory_movements`, `disposals`, `disposal_items`, `product_lots`, `stock_movements`, `return_orders`, `return_order_items`, `supplier_exchanges`, `supplier_exchange_return_items`, `supplier_exchange_received_items`
- Code changes:
  - Thêm `tenant_id` vào interface của 13 bảng trong `types.ts`.

## Scope / Non-Goals

**In scope:**
- Sub-phase 3.2: Inventory & stock tables
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `inventory-stock-tables`: Inventory & stock tables

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.