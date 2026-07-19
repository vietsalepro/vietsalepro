## ADDED Requirements

### Requirement: Final lint and build pass
The system SHALL pass `npm run lint` and `npm run build` before the phase is considered complete.

#### Scenario: Run verification commands
- **GIVEN** all previous phases are merged
- **WHEN** `npm run lint` and `npm run build` are executed
- **THEN** both commands exit successfully

### Requirement: End-to-end create/save/complete/delete flow works
The system SHALL allow a user to create, save, edit, complete, view, and delete an import receipt without errors.

#### Scenario: Full receipt lifecycle
- **GIVEN** the user is on `/import/create`
- **WHEN** the user creates a supplier, adds two products (one with lot, one without), applies line discount and shipping, saves draft, reopens, completes, views detail, and deletes
- **THEN** each step succeeds and the UI returns to `/import`

### Requirement: Inventory and cost are consistent after CRUD
The system SHALL keep inventory quantity, cost, and supplier debt consistent after create and delete.

#### Scenario: Verify after create
- **GIVEN** a completed receipt
- **WHEN** the user checks inventory, product cost, and supplier debt
- **THEN** the values reflect the receipt with correct adjusted cost

#### Scenario: Verify after delete
- **GIVEN** the receipt was deleted
- **WHEN** the user checks inventory, product cost, and supplier debt
- **THEN** the values are reverted to the state before the receipt was created

### Requirement: Routing and error messages work
The system SHALL route correctly and show clear delete errors.

#### Scenario: Routing and error verification
- **GIVEN** the application is running
- **WHEN** the user navigates `/import`, `/import/create`, uses back, and refreshes
- **THEN** the correct tab is shown
- **AND** attempting to delete a sold-out receipt shows the mapped error message

### Requirement: Reports reflect correct values
The system SHALL report accurate inventory and profit values.

#### Scenario: Check reports
- **GIVEN** the completed receipt and a sale of the same product
- **WHEN** `get_inventory_report` and `get_profit_report` / `get_sales_report` are checked
- **THEN** inventory value and cost of goods sold reflect the adjusted cost

## MODIFIED Requirements

- None. This phase does not modify existing behavior.

## REMOVED Requirements

- None.
