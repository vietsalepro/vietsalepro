# Delta for Voucher Form Layout

## ADDED Requirements

- None

## MODIFIED Requirements

### Requirement: ImportSidebar sections use only the V2 branch

`SupplierSection`, `ReceiptInfoSection`, `TotalsSection`, `NoteSection`, and `ActionFooter` in `components/import-goods/ImportSidebar/` SHALL remove the `useRefactoredImportLayout` import and the V1 branch. Each SHALL render only the V2 branch using `SectionBox` + `SectionHeader` + `SectionContent` and standard input/button components.

#### Scenario: SupplierSection renders V2
- **GIVEN** `ImportSidebar/SupplierSection.tsx` has been refactored
- **WHEN** the component renders
- **THEN** it uses `SectionBox` + `TextInput` + `ActionButton` for supplier selection
- **AND** it no longer imports `useRefactoredImportLayout`

#### Scenario: TotalsSection preserves calculation logic
- **GIVEN** `ImportSidebar/TotalsSection.tsx` has been refactored
- **WHEN** the component renders
- **THEN** it still computes `needToPay`, `debtDelta`, and auto-fills `paidAmount` exactly as before
- **AND** it renders only the V2 branch

#### Scenario: NoteSection uses FormTextarea
- **GIVEN** `ImportSidebar/NoteSection.tsx` has been refactored
- **WHEN** the notes field renders
- **THEN** it uses `<FormTextarea ... />`
- **AND** `NoteSection.css` no longer defines `.import-note-textarea`

### Requirement: ImportGoods page does not define its own layout

`pages/ImportGoods.tsx` SHALL not wrap `VoucherFormLayout` in a div that defines flex/grid/width for the create form. The page SHALL remove the `ImportTopBar` dead import. The create form SHALL be owned by `VoucherFormLayout`.

#### Scenario: ImportTopBar import is gone
- **GIVEN** `pages/ImportGoods.tsx` is linted
- **WHEN** the linter checks imports
- **THEN** `ImportTopBar` is not found

#### Scenario: Create view wrapper is layout-neutral
- **GIVEN** the user is in the create view of `ImportGoods`
- **WHEN** the wrapper element is inspected
- **THEN** it does not add grid, flex column width, or sidebar width to the create form
- **AND** `VoucherFormLayout` owns the two-column layout

### Requirement: ImportItemRow and ImportItemsTable use only the V2 branch

`ImportItemRow.tsx` and `ImportItemsTable.tsx` SHALL remove the `useRefactoredImportLayout` import and V1 branch. The delete button, batch input, expiry input, quantity stepper, price input, and discount input SHALL use the V2 markup with `ActionButton` and `TextInput`.

#### Scenario: ImportItemRow action column renders V2
- **GIVEN** a row in the import items table
- **WHEN** the action column renders
- **THEN** it uses an `ActionButton` for the delete action
- **AND** it does not branch on `useRefactoredImportLayout`

#### Scenario: ImportItemsTable empty state renders with EmptyState component
- **GIVEN** the import items table has no rows
- **WHEN** the empty state renders
- **THEN** it uses the shared `EmptyState` component
- **AND** no V1 empty-state markup is present

### Requirement: ImportGoods.css no longer contains create-form layout CSS

`pages/ImportGoods.css` SHALL remove classes such as `.ig-layout`, `.ig-layout-main`, `.ig-layout-aside`, `.ig-create-form`, `.ig-form-header`, `.ig-form-body`, `.ig-section-*`, `.ig-notes-textarea`, and other create-form layout CSS. It SHALL keep history, detail, filter, pagination, search, and mobile CSS.

#### Scenario: Create-form layout CSS is gone
- **GIVEN** `pages/ImportGoods.css` is searched for create-form layout classes
- **WHEN** the search completes
- **THEN** no create-form layout classes are found
- **AND** history/detail/filter/pagination CSS remain

## REMOVED Requirements

### Requirement: ImportFormLayout and ImportTopBar files are removed

`components/import-goods/ImportFormLayout.tsx`, `ImportFormLayout.css`, `ImportTopBar.tsx`, and `ImportTopBar.css` SHALL be deleted. No file SHALL import `ImportFormLayout` or `ImportTopBar`.

#### Scenario: No imports of ImportFormLayout or ImportTopBar
- **GIVEN** the codebase is searched for `ImportFormLayout` and `ImportTopBar`
- **WHEN** the grep completes
- **THEN** the results are empty (excluding the deleted files themselves)

### Requirement: Legacy .ig-input-sm--w140 class is removed

`TotalsSection.css` SHALL no longer define `.ig-input-sm--w140` because it is only used in the V1 branch.

#### Scenario: ig-input-sm--w140 is gone
- **GIVEN** `TotalsSection.css` is inspected
- **WHEN** the search for `.ig-input-sm--w140` completes
- **THEN** the class is not defined
