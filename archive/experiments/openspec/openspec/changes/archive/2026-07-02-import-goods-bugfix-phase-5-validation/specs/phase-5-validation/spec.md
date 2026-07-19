## ADDED Requirements

### Requirement: Reject negative total discount
The system SHALL block `handleImport` when `discountTotal < 0`.

#### Scenario: User enters negative total discount
- **GIVEN** the create form has `discountTotal = -10,000`
- **WHEN** the user tries to save or complete the receipt
- **THEN** the system shows an alert "Giảm giá toàn phiếu không được âm." and does not call the RPC

### Requirement: Reject duplicate invoice number per supplier
The system SHALL block `handleImport` when the `invoiceNumber` already exists for the selected supplier.

#### Scenario: Duplicate invoice number with another completed receipt
- **GIVEN** supplier S has an existing receipt with `invoiceNumber = "HD001"`
- **WHEN** the user creates a new receipt for supplier S with `invoiceNumber = "HD001"`
- **THEN** the system shows an alert "Số hóa đơn NCC đã tồn tại." and does not call the RPC

#### Scenario: Editing a draft keeps its own invoice number
- **GIVEN** the user is editing a draft receipt with `invoiceNumber = "HD001"` for supplier S
- **WHEN** the user saves the draft
- **THEN** the validation passes because the existing receipt is the same draft

### Requirement: Reject duplicate receipt id in non-draft status
The system SHALL block `handleImport` when the provided `receiptId` already exists in a non-draft status.

#### Scenario: Receipt id already completed
- **GIVEN** a receipt with id `PN000001` already exists in status `completed`
- **WHEN** the user tries to create a new receipt with `receiptId = "PN000001"`
- **THEN** the system shows an alert "Mã phiếu đã tồn tại." and does not call the RPC

#### Scenario: Receipt id exists only as draft
- **GIVEN** a receipt with id `PN000001` exists only in status `draft`
- **WHEN** the user tries to create a new receipt with `receiptId = "PN000001"`
- **THEN** the validation passes because the draft can be overwritten

### Requirement: Receipt code generated from import date
The system SHALL generate the receipt code based on the selected `importDate`.

#### Scenario: User selects yesterday's import date
- **GIVEN** the user selects yesterday as the import date
- **WHEN** the system generates the receipt code
- **THEN** the code prefix is `PN<yyyy><mm><dd>` based on yesterday's date

#### Scenario: Refresh with a past import date
- **GIVEN** the user is on `/import/create` with a past import date selected
- **WHEN** the user refreshes the page
- **THEN** the generated placeholder/code still uses the selected past date

## MODIFIED Requirements

### Requirement: `handleImport` performs pre-RPC validation
`handleImport` SHALL validate the receipt before invoking the RPC.

#### Scenario: Valid receipt
- **GIVEN** a receipt with positive discount, unique invoice number, and unique receipt id
- **WHEN** the user saves or completes
- **THEN** the RPC is called normally

### Requirement: `generateReceiptCode` uses import date
`generateReceiptCode` SHALL use the form's `importDate` field instead of `new Date()`.

#### Scenario: Generate code on form load
- **GIVEN** the create form loads with a selected import date
- **WHEN** `generateReceiptCode` is called
- **THEN** the code uses the selected date, not the current date

## REMOVED Requirements

- None. The old `generateReceiptCode` based on `new Date()` is replaced by the import-date version.
