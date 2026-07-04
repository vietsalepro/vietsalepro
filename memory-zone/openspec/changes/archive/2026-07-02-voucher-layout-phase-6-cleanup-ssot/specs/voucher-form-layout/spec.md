# Delta for Voucher Form Layout

## ADDED Requirements

- None

## MODIFIED Requirements

### Requirement: Shared note textarea replaces section-specific textarea styles

`components/disposal-form/DisposalSidebar/NoteSection.css` and `components/import-goods/ImportSidebar/NoteSection.css` SHALL no longer define `.disposal-note-textarea` or `.import-note-textarea`. All note textarea styling SHALL come from `components/FormTextarea.css`.

#### Scenario: Note section CSS has no textarea classes
- **GIVEN** `FormTextarea.css` is the shared source for textarea styles
- **WHEN** the note section CSS files are inspected
- **THEN** `.disposal-note-textarea`, `.import-note-textarea`, and `.count-notes-textarea` are not defined

## REMOVED Requirements

### Requirement: Dead code files are deleted

The following files SHALL be deleted from the project:
- `components/import-goods/ImportFormLayout.tsx`
- `components/import-goods/ImportFormLayout.css`
- `components/import-goods/ImportTopBar.tsx`
- `components/import-goods/ImportTopBar.css`
- `components/disposal-form/DisposalFormLayout.tsx`
- `components/disposal-form/DisposalFormLayout.css`
- `components/disposal-form/DisposalTopBar.tsx`
- `components/disposal-form/DisposalTopBar.css`
- `components/disposal-form/DisposalSidebar/StatsSection.tsx`
- `components/disposal-form/DisposalSidebar/StatsSection.css`
- `components/inventory-count/CountFormLayout.css`

#### Scenario: Dead code files do not exist
- **GIVEN** the project is searched for these files
- **WHEN** the search completes
- **THEN** none of the files above exist
- **AND** no imports of them remain in the codebase

### Requirement: Feature flags are removed from features.ts

The three flags `useRefactoredImportLayout`, `useRefactoredDisposalLayout`, and `useRefactoredCountLayout` SHALL be removed from `features.ts`. No file in `components/` or `pages/` SHALL import or reference them.

#### Scenario: No feature flags remain
- **GIVEN** the codebase is searched for the three flag names
- **WHEN** the grep completes
- **THEN** the result is empty

### Requirement: Legacy layout CSS classes are removed from index.css

`index.css` SHALL no longer contain `ig-*` classes that are only used by the old V1 layout branches. Classes used by history/detail/list views (e.g., `.ig-history-*`, `.ig-page-detail-*`, `.ig-search-*`, `.ig-filter-*`, `.ig-pagination-*`) SHALL be kept.

#### Scenario: Legacy ig-layout classes are gone
- **GIVEN** `index.css` is audited for `ig-*` classes
- **WHEN** each class is grepped in `components/` and `pages/`
- **THEN** classes with no references are removed
- **AND** classes still used by history/detail/list views remain

#### Scenario: Only VoucherFormLayout remains as the shared layout
- **GIVEN** the codebase is searched for layout component names
- **WHEN** the search completes
- **THEN** only `VoucherFormLayout` is referenced as the layout component
- **AND** `ImportFormLayout`, `DisposalFormLayout`, and `CountFormLayout` are not referenced
