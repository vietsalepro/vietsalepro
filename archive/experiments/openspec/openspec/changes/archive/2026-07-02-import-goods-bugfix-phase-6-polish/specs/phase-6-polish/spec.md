## ADDED Requirements

### Requirement: Delete import shows actionable error for sold-out product
The system SHALL display a clear message when `delete_import_v2` fails because the product has been sold beyond the imported quantity.

#### Scenario: Delete receipt where product is sold out
- **GIVEN** an import receipt whose product has already been sold beyond the imported quantity
- **WHEN** the user attempts to delete the receipt
- **THEN** the system shows "Không thể xóa: sản phẩm X đã bán vượt quá lượng nhập. Vui lòng kiểm tra tồn kho."

### Requirement: Delete import shows actionable error for sold-out lot
The system SHALL display a clear message when `delete_import_v2` fails because a lot is out of stock.

#### Scenario: Delete receipt where a lot is sold out
- **GIVEN** an import receipt with a lot that has already been sold out
- **WHEN** the user attempts to delete the receipt
- **THEN** the system shows a message naming the lot and the product, e.g., "Không thể xóa: lô L của sản phẩm X không đủ tồn kho."

### Requirement: Stats cards refresh after create
The system SHALL refresh stats after a receipt is successfully created or updated.

#### Scenario: Save a new receipt
- **GIVEN** the user successfully saves a new receipt
- **WHEN** the save completes
- **THEN** the history stats cards reflect the new receipt

### Requirement: Stats cards refresh after delete
The system SHALL refresh stats after a receipt is successfully deleted.

#### Scenario: Delete an existing receipt
- **GIVEN** the user successfully deletes a receipt
- **WHEN** the delete completes
- **THEN** the history stats cards reflect the deletion

## MODIFIED Requirements

### Requirement: `handleDeleteImport` parses and maps RPC errors
`handleDeleteImport` SHALL parse the error message from `delete_import_v2` and map it to a user-friendly message.

#### Scenario: Unknown delete error
- **GIVEN** `delete_import_v2` returns an error not matching the known patterns
- **WHEN** `handleDeleteImport` processes the error
- **THEN** the original message is shown to the user

### Requirement: `handleDeleteClick` awaits delete before refetch
`handleDeleteClick` SHALL wait for `onDeleteImport` to complete before refreshing the receipt list.

#### Scenario: User deletes a receipt
- **GIVEN** the user confirms deletion
- **WHEN** `handleDeleteClick` runs
- **THEN** it awaits `onDeleteImport` and then calls `fetchReceipts`

## REMOVED Requirements

- None. Synchronous refetch after delete is replaced by awaited refetch.
