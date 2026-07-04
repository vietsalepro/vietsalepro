## ADDED Requirements

### Requirement: `import_items.cost` stores original cost
The system SHALL store the user-entered original cost in `import_items.cost`.

#### Scenario: Create a completed import with line discount
- **GIVEN** the user creates a receipt with a product cost of 100,000 and a line discount of 10,000
- **WHEN** `process_import_v2` inserts the item
- **THEN** `import_items.cost` equals 100,000

### Requirement: `products.cost` and `product_lots.cost` store adjusted cost
The system SHALL update product and lot costs with the value after line discount and allocated shipping.

#### Scenario: Same completed import with shipping
- **GIVEN** the previous receipt has a shipping factor that allocates 5% to the line
- **WHEN** `process_import_v2` updates `products` and `product_lots`
- **THEN** `products.cost` and `product_lots.cost` equal `ROUND((100,000 - 10,000) * 1.05, 2)`

### Requirement: Stock ledger records adjusted unit cost
The system SHALL record the adjusted cost as the unit cost in the stock ledger.

#### Scenario: Receipt completed with stock ledger entry
- **GIVEN** the receipt is completed
- **WHEN** the stock ledger is updated
- **THEN** the ledger unit cost equals the adjusted cost

### Requirement: Service layer passes original cost and discount
The system SHALL send original cost and discount fields to the RPC without modifying them.

#### Scenario: Frontend calls `createImportReceipt`
- **GIVEN** an item with cost 100,000 and discount 10,000
- **WHEN** `createImportReceipt` is invoked
- **THEN** the RPC payload contains `cost = 100,000` and `discount = 10,000`

## MODIFIED Requirements

### Requirement: `process_import_v2` recalculates cost allocation
`process_import_v2` SHALL use original cost for the receipt line and adjusted cost for inventory valuation.

#### Scenario: New receipt is processed
- **GIVEN** a receipt payload with items, discounts, and shipping
- **WHEN** `process_import_v2` runs
- **THEN** it computes `v_line_net`, `v_shipping_factor`, `v_adjusted_cost`, inserts original cost into `import_items.cost`, and updates inventory with adjusted cost

### Requirement: `delete_import_v2` reverses valuation using stored values
`delete_import_v2` SHALL reverse product and lot costs using the value stored in `import_items.cost` (original cost) and the same shipping/discount logic.

#### Scenario: Receipt is deleted
- **GIVEN** an existing receipt with `import_items.cost = 100,000`
- **WHEN** `delete_import_v2` runs
- **THEN** it subtracts the correct adjusted cost from `products.cost` / `product_lots.cost` and removes stock ledger entries

### Requirement: Frontend totals use post-discount goods total
The UI SHALL calculate the amount due from `totalGoodsAfterLineDiscount`.

#### Scenario: User views totals in create form
- **GIVEN** the create form has items with line discounts and a shipping cost
- **WHEN** the totals section renders
- **THEN** `needToPay = max(0, totalGoodsAfterLineDiscount + shippingCost - discountTotal)`

## REMOVED Requirements

- None. `totalImportCost` and any old `totalWithShipping` based on it are replaced by `totalGoodsAfterLineDiscount` based calculations.
