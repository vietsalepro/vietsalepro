# Phase 1 — Fetch server-side data for ImportGoods

## Purpose

Ensure the `ImportGoods` page does not depend on globally-loaded `products`, `suppliers`, or `importReceipts` props for its core functionality. Instead, it lazily fetches suppliers, searches products, and computes history stats from the server.
## Requirements
### Requirement: SupplierSection receives suppliers from local state
The `SupplierSection` component SHALL receive its supplier list from `localSuppliers` instead of the `suppliers` prop.

#### Scenario: Create form renders supplier dropdown
- **GIVEN** `localSuppliers` is populated from the server
- **WHEN** the create form renders `SupplierSection`
- **THEN** `SupplierSection` is passed `suppliers={localSuppliers}`

### Requirement: AdvancedFilterPanel receives suppliers from local state
The `AdvancedFilterPanel` component SHALL receive its supplier filter list from `localSuppliers`.

#### Scenario: History filter panel opens
- **GIVEN** `localSuppliers` is populated from the server
- **WHEN** the history filter panel renders
- **THEN** `AdvancedFilterPanel` is passed `suppliers={localSuppliers}`

### Requirement: ImportProductSearch receives products from local state
The `ImportProductSearch` component SHALL receive its product list from `localProducts`.

#### Scenario: User opens product search in create form
- **GIVEN** `localProducts` is populated from a server search
- **WHEN** the create form renders `ImportProductSearch`
- **THEN** `ImportProductSearch` is passed `products={localProducts}`

### Requirement: Server-side supplier list for ImportGoods
The system SHALL load the full supplier list from the server when `ImportGoods` mounts.

#### Scenario: User opens the import page with empty suppliers prop
- **GIVEN** the parent router renders `<ImportGoods suppliers={[]} ... />`
- **WHEN** the component mounts
- **THEN** `supabaseService.getSuppliers()` is called and the supplier dropdown is populated with the returned suppliers

#### Scenario: Supplier list merges into the existing cache
- **GIVEN** `supplierCache` already contains some suppliers
- **WHEN** the server fetch completes
- **THEN** the fetched suppliers are merged into `supplierCache` without clearing existing entries

### Requirement: Server-side product search for ImportGoods
The system SHALL search products from the server when the user types in the product search field.

#### Scenario: User searches for a product in the create form
- **GIVEN** the create tab is active and the parent router passed `products={[]}`
- **WHEN** the user types a product name and waits for the debounce
- **THEN** `supabaseService.searchProducts(term, 50)` is called and the dropdown shows server-side results

#### Scenario: Selected product is added to the import table
- **GIVEN** the user selects a product from the server-side dropdown
- **WHEN** `addToImportList` is invoked
- **THEN** the product data is read from `productCache` and the table row shows correct name, unit, and cost

### Requirement: Server-side import stats for history tab
The system SHALL compute history stat cards from server-side receipt data.

#### Scenario: History tab loads with empty importReceipts prop
- **GIVEN** the parent router renders `<ImportGoods importReceipts={[]} ... />`
- **WHEN** the history tab renders
- **THEN** the stat cards display total receipt count, total goods value, shipping, paid amount, and debt from the latest `fetchReceipts` result

### Requirement: Remove prop dependency for core lookups
The system SHALL no longer use the `products`/`suppliers`/`importReceipts` props for core lookups in `ImportGoods`.

#### Scenario: All lookups use local state or cache
- **GIVEN** Phase 1a and 1b are implemented
- **WHEN** a static search for `products.find`, `suppliers.find`, or `importReceipts.reduce` is performed
- **THEN** no remaining calls operate on an empty prop array that could return `undefined` or `0`

