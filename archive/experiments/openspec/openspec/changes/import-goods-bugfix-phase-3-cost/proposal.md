## Why

Current cost handling conflates the original cost entered by the user with the adjusted cost after line discounts and allocated shipping. This causes `import_items.cost`, `products.cost`, `product_lots.cost`, and the stock ledger to store inconsistent values, leading to incorrect inventory valuation and profit reports. This phase separates original cost, line discount, and adjusted cost so that each downstream system gets the right number.

## What Changes

- Backend migration SQL file: update `process_import_v2` to store original cost in `import_items.cost` and adjusted cost in `products.cost` / `product_lots.cost` and stock ledger.
- Verify `delete_import_v2` reverses valuation using the stored values.
- `update_import_v2` remains consistent because it calls `delete_import_v2` + `process_import_v2`.
- `services/supabaseService.ts`: ensure `createImportReceipt` / `updateImportReceipt` pass original cost and discount; map `adjustedCost` if the column is added.
- `types.ts`: add `adjustedCost` to `ImportItemInput` if needed.
- `pages/ImportGoods.tsx` / `ImportItemRow.tsx` / `ImportItemsTable.tsx`: keep `lineTotal = max(0, qty * cost - discount)`; ensure `totalWithShipping` uses `totalGoodsAfterLineDiscount`.

## Scope / Non-Goals

**In scope:**
- Sub-phases 3a, 3b, 3c as defined in `docs/plans/import-goods-bugfix/PLAN_REFINED.md`.
- Backend RPCs `process_import_v2`, `delete_import_v2`, `update_import_v2`.
- Service mapping, frontend display, and DB verification.

**Out of scope:**
- Supplier-code generation and auto-fill (Phase 4).
- Validation and receipt-code generation (Phase 5).
- Delete error messages and stats refresh (Phase 6).

## Capabilities

### New Capabilities
- `phase-3-cost`: Import cost storage distinguishes original cost, line discount, and adjusted cost.

### Modified Capabilities
- `process-import-v2`: Inserts `import_items.cost` = original cost, `products.cost` = adjusted cost, `product_lots.cost` = adjusted cost.
- `delete-import-v2`: Reverses `products.cost` and `product_lots.cost` using the stored original cost.
- `create-import-receipt`: Maps frontend cost/discount fields to RPC parameters.
- `import-item-row`: Displays line total after discount.
- `totals-section`: Uses `totalGoodsAfterLineDiscount` for the amount-due calculation.

## Impact

- Affected files: `archive/migration_phase3a_import_cost_ssot.sql` (or similar), `services/supabaseService.ts`, `types.ts`, `pages/ImportGoods.tsx`, `components/import-goods/ImportItemRow.tsx`, `components/import-goods/ImportItemsTable.tsx`.
- Database: potential new column `import_items.adjusted_cost`; migration must be run only once.
- Verification: `npm run lint`, `npm run build`, DB transaction test with rollback, create/delete/re-create inventory valuation check.

## Rollback

Restore database from backup and revert `services/supabaseService.ts`, `types.ts`, and frontend files from the pre-phase backup. Expanded in `rollback.md`.
