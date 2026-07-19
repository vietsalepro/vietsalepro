## ADDED Requirements

### Requirement: Supplier code generation uses server-side list
The system SHALL generate a new supplier code only after fetching the current full supplier list from the server.

#### Scenario: Create supplier when local list is empty
- **GIVEN** the `suppliers` prop is `[]` and `localSuppliers` is empty
- **WHEN** the user creates a new supplier
- **THEN** the system calls `supabaseService.getSuppliers()` and generates `NCC000001` only if the DB does not already contain that code

#### Scenario: Create supplier when list has existing entries
- **GIVEN** `localSuppliers` contains suppliers with codes up to `NCC000015`
- **WHEN** the user creates a new supplier
- **THEN** the new code is `NCC000016` and is not a duplicate

### Requirement: New supplier is added to local state immediately
The system SHALL add the newly created supplier to `localSuppliers` and `supplierCache` without requiring a refetch.

#### Scenario: Supplier creation succeeds
- **GIVEN** the user successfully created a new supplier
- **WHEN** the modal closes
- **THEN** the supplier appears in the dropdown and is available for selection immediately

### Requirement: Paid amount auto-fills from post-discount total
The system SHALL auto-fill `paidAmount` with the amount due based on `totalGoodsAfterLineDiscount`.

#### Scenario: User adds a line discount to an item
- **GIVEN** the create form has items with line discounts and a shipping cost
- **WHEN** the user has not manually touched `paidAmount`
- **THEN** `paidAmount` equals `max(0, totalGoodsAfterLineDiscount + shippingCost - discountTotal)`

#### Scenario: User manually edits paid amount
- **GIVEN** the user has manually edited `paidAmount`
- **WHEN** the totals change
- **THEN** the manually entered `paidAmount` is preserved (or reverted only on explicit reset)

## MODIFIED Requirements

### Requirement: `handleCreateSupplier` no longer depends on the `suppliers` prop
`handleCreateSupplier` SHALL use the server-side supplier list instead of the `suppliers` prop.

#### Scenario: `suppliers` prop is empty
- **GIVEN** the parent router passes `suppliers={[]}`
- **WHEN** the user creates a supplier
- **THEN** the code is generated correctly and the supplier is added to local state

### Requirement: Remove obsolete total references
The system SHALL replace any remaining `totalImportCost` / old `totalWithShipping` calculations with the `totalGoodsAfterLineDiscount` based formula.

#### Scenario: Search for old total references
- **GIVEN** the codebase is searched for `totalImportCost` and the old `totalWithShipping`
- **WHEN** the search completes
- **THEN** no remaining references are used for amount-due or paid-amount calculations

## REMOVED Requirements

- None. Old total references are replaced, not deprecated.
