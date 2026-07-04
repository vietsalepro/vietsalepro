# Delta for Voucher Form Layout

## ADDED Requirements

- None

## MODIFIED Requirements

### Requirement: DisposalSidebar sections use only the V2 branch

`InfoSection`, `ReasonSection`, `NoteSection`, and `ActionFooter` in `components/disposal-form/DisposalSidebar/` SHALL remove the `useRefactoredDisposalLayout` import and the V1 branch. Each SHALL render only the V2 branch using `SectionBox` + `SectionHeader` + `SectionContent`.

#### Scenario: InfoSection renders with SectionBox
- **GIVEN** `DisposalSidebar/InfoSection.tsx` has been refactored
- **WHEN** the component renders
- **THEN** it returns a single `SectionBox` with `SectionHeader title="Thông tin phiếu"` and `SectionContent` containing `ModalInfoGrid`
- **AND** it no longer imports `useRefactoredDisposalLayout`

#### Scenario: NoteSection keeps content-only CSS
- **GIVEN** `DisposalSidebar/NoteSection.tsx` has been refactored
- **WHEN** the component renders
- **THEN** it uses only V2 markup
- **AND** `NoteSection.css` contains only content styling, no layout classes

### Requirement: DisposalForm page passes content into VoucherFormLayout slots

`pages/DisposalForm.tsx` SHALL no longer import or render `DisposalTopBar` or `StatsSection`. It SHALL not wrap `VoucherFormLayout` in a div that defines flex/grid/width for the create form. It SHALL pass `main`, `sidebar`, and `actions` into `VoucherFormLayout`.

#### Scenario: DisposalForm renders without dead topbar
- **GIVEN** `pages/DisposalForm.tsx` has been refactored
- **WHEN** lint scans the file
- **THEN** `DisposalTopBar` is not imported
- **AND** `StatsSection` is not imported

#### Scenario: DisposalForm page-level wrapper is layout-neutral
- **GIVEN** `pages/DisposalForm.tsx` renders the create form
- **WHEN** the wrapper element is inspected
- **THEN** it does not add grid, flex column width, or sidebar width to the create form
- **AND** `VoucherFormLayout` owns the two-column layout

### Requirement: DisposalItemRow and DisposalItemsTable use only the V2 branch

`DisposalItemRow.tsx` and `DisposalItemsTable.tsx` SHALL remove the `useRefactoredDisposalLayout` import and V1 branch. The action delete button and quantity input SHALL use `ActionButton` and `TextInput` as in the V2 branch.

#### Scenario: DisposalItemRow action column renders V2
- **GIVEN** a row in the disposal items table
- **WHEN** the action column renders
- **THEN** it uses an `ActionButton` for the delete action
- **AND** it does not branch on `useRefactoredDisposalLayout`

#### Scenario: DisposalItemsTable empty state renders with EmptyState component
- **GIVEN** the disposal items table has no rows
- **WHEN** the empty state renders
- **THEN** it uses the shared `EmptyState` component
- **AND** no V1 empty-state markup is present

## REMOVED Requirements

### Requirement: DisposalFormLayout component is removed

`components/disposal-form/DisposalFormLayout.tsx` and `DisposalFormLayout.css` SHALL be deleted and no file SHALL import them.

#### Scenario: No imports of DisposalFormLayout
- **GIVEN** the codebase is searched for `DisposalFormLayout`
- **WHEN** the grep completes
- **THEN** the result is empty (excluding the deleted files themselves)

### Requirement: DisposalTopBar usage is removed

`DisposalTopBar` SHALL no longer be imported or used in `pages/DisposalForm.tsx`. The component files will be deleted in Phase 6a.

#### Scenario: DisposalTopBar is dead import
- **GIVEN** `pages/DisposalForm.tsx` is linted
- **WHEN** the linter checks imports
- **THEN** `DisposalTopBar` is not found in the file
