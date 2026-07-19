## Why

ImportGoods currently receives `products`, `suppliers`, and `importReceipts` as props, but the parent router often passes empty arrays. This causes `.find(...)` and `.reduce(...)` calls to operate on undefined or empty data, breaking supplier selection, product search, and history stat cards. This phase fetches those datasets server-side so the component is self-sufficient for its core workflows.

## What Changes

- Add `localSuppliers`, `localProducts`, and `localImportStats` states in `pages/ImportGoods.tsx`.
- Mount-effect fetch of full supplier list via `supabaseService.getSuppliers()` and merge into `supplierCache`.
- Debounced server-side product search via `supabaseService.searchProducts(term, 50)` and merge into `productCache`.
- Update stat cards after `fetchReceipts` to use `totalReceiptCount` and sums from `receiptList`.
- Pass `localSuppliers` to `SupplierSection` and `AdvancedFilterPanel`.
- Pass `localProducts` to `ImportProductSearch` and `ImportItemsTable`.
- Remove or guard remaining `products.find(...)` / `suppliers.find(...)` / `importReceipts.reduce(...)` calls on empty props.

## Scope / Non-Goals

**In scope:**
- Sub-phases 1a, 1b, 1c as defined in `docs/plans/import-goods-bugfix/PLAN_REFINED.md`.
- Supplier list, import stats, product search, and prop cleanup inside `pages/ImportGoods.tsx`.
- Service-layer additions (`getSuppliers`, `getImportStats`, `searchProducts`) if they do not already exist.

**Out of scope:**
- Routing changes (`/import/create`) — Phase 2.
- Cost/discount logic corrections — Phase 3.
- Supplier-code generation and paid-amount auto-fill — Phase 4.
- Validation and receipt-code generation — Phase 5.
- Delete error messages and stats refresh — Phase 6.

## Capabilities

### New Capabilities
- `phase-1-fetch-server-side`: ImportGoods can hydrate suppliers, products, and stats from the server without relying on populated props.

### Modified Capabilities
- `import-product-search`: Search dropdown now uses server-side results instead of the `products` prop.
- `supplier-section`: Supplier dropdown now uses `localSuppliers` instead of the `suppliers` prop.
- `advanced-filter-panel`: Supplier filter now uses `localSuppliers` instead of the `suppliers` prop.

## Impact

- Affected files: `pages/ImportGoods.tsx`, `services/supabaseService.ts`, `components/import-goods/ImportProductSearch.tsx` (interface only), `components/import-goods/ImportItemsTable.tsx` (props only).
- Dead code: none targeted yet; full removal of unused prop usage deferred to Phase 1c.
- Verification: `npm run lint`, `npm run build`, manual tests of supplier/product selection and history stat cards.

## Rollback

Restore `pages/ImportGoods.tsx` and any service file touched from the pre-phase backup. Expanded in `rollback.md`.
