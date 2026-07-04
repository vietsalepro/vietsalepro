# Delta for Voucher Form Layout

## ADDED Requirements

### Requirement: FormTextarea shared component exists

A `FormTextarea` component SHALL be created at `components/FormTextarea.tsx` with `components/FormTextarea.css`. It SHALL accept `value`, `onChange`, `placeholder?`, `rows?` (default 3), `disabled?`, `className?`, `error?`, `resize?` (default `vertical`). It SHALL render a full-width textarea using design tokens for border, background, text, focus, and disabled states.

#### Scenario: FormTextarea renders with default props
- **GIVEN** a note section uses `<FormTextarea value={notes} onChange={...} placeholder="Nhập ghi chú..." />`
- **WHEN** the component renders
- **THEN** a `<textarea>` with `rows={3}` and `resize: vertical` is rendered
- **AND** the wrapper has class `form-textarea-wrapper`
- **AND** the textarea has class `form-textarea`

#### Scenario: FormTextarea renders disabled
- **GIVEN** `FormTextarea` is rendered with `disabled={true}`
- **WHEN** the component renders
- **THEN** the textarea has disabled styling (`background-color: var(--color-bg-disabled)`, `opacity: var(--opacity-70)`)
- **AND** the cursor is `not-allowed`

### Requirement: SummaryRow.css defines shared accent classes

`components/SummaryRow.css` SHALL be created and imported by `components/SummaryRow.tsx`. It SHALL define `.summary-row-value--danger`, `.summary-row-value--success`, `.summary-row-value--neutral`, and `.summary-row-value--warning` using design tokens.

#### Scenario: SummaryRow accent class renders
- **GIVEN** a `SummaryRow` is rendered with `accent="summary-row-value--danger"`
- **WHEN** the value element renders
- **THEN** it has class `summary-row-value--danger`
- **AND** the CSS color is `var(--color-danger-600)`

## MODIFIED Requirements

### Requirement: Layout refactor feature flags exist

The system SHALL expose the following active feature flags in `features.ts`:
- `useRefactoredDisposalLayout`
- `useRefactoredImportLayout`

`useRefactoredCountLayout` is deprecated in this phase and SHALL be commented out; it will be removed in Phase 6b.

#### Scenario: Feature flags are importable
- **GIVEN** a developer imports any of the remaining layout flags
- **WHEN** the build runs
- **THEN** the flags resolve to boolean values
- **AND** `useRefactoredCountLayout` is not exported

### Requirement: Legacy layout dead code is present

The system SHALL contain the following legacy layout files (intended for removal after the refactor):
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

#### Scenario: Legacy files are present before cleanup
- **GIVEN** the project is at the baseline state
- **WHEN** a file listing is performed
- **THEN** all legacy files listed above exist on disk
- **AND** `components/inventory-count/CountFormLayout.css` is not present
