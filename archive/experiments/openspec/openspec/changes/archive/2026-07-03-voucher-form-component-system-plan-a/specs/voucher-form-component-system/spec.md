# Voucher Form Component System — Delta Specification

> Source plan: `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master.md` and `PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`.

## ADDED Requirements

### Requirement: VoucherFormLayout folder migration
The system SHALL migrate `VoucherFormLayout` into `components/voucher-form/` while preserving its public props interface.

#### Scenario: Import path migration
- **GIVEN** `components/VoucherFormLayout.tsx` and `components/VoucherFormLayout.css` exist
- **WHEN** the files are moved to `components/voucher-form/` and imports are updated
- **THEN** all 4 voucher pages and `CountFormLayout` import from `components/voucher-form/` and `npm run lint` passes

#### Scenario: Public API stability
- **GIVEN** the new `components/voucher-form/VoucherFormLayout.tsx`
- **WHEN** it is used in `pages/ImportGoods.tsx`, `pages/DisposalForm.tsx`, `pages/InventoryCount.tsx`, `pages/SupplierExchanges.tsx`, `components/inventory-count/CountFormLayout.tsx`
- **THEN** it still accepts `title`, `onBack`, `searchValue`, `onSearchChange`, `searchSlot`, `main`, `sidebar`, `actions`, `banner`, `className`

### Requirement: VoucherFormLayout sub-components
The system SHALL provide internal layout sub-components (`VoucherHeader`, `VoucherSidebar`, `VoucherActions`, `VoucherBanner`, `VoucherScrollArea`) used only inside `components/voucher-form/`.

#### Scenario: Header composition
- **GIVEN** a voucher page renders `VoucherFormLayout`
- **WHEN** the layout internally composes `VoucherHeader`
- **THEN** the header displays back button, title, search input (if provided), and optional search slot

#### Scenario: Sidebar and actions composition
- **GIVEN** a voucher page passes `sidebar` and `actions` slots
- **WHEN** `VoucherFormLayout` renders `VoucherSidebar` and `VoucherActions`
- **THEN** sidebar scrolls independently, actions remain sticky at bottom, and banner (if any) renders above

### Requirement: VoucherButton
The system SHALL provide a `VoucherButton` component that replaces `ActionButton` inside voucher forms.

#### Scenario: Variants and sizes
- **GIVEN** `VoucherButton` with `variant` (`primary`, `secondary`, `danger`, `ghost`, `link`) and `size` (`sm`, `md`, `lg`)
- **WHEN** rendered
- **THEN** it applies the correct CSS classes and visual states

#### Scenario: Loading and disabled
- **GIVEN** `VoucherButton` with `loading` or `disabled` prop
- **WHEN** the user clicks or tabs to it
- **THEN** it is non-interactive and shows a loading spinner when `loading` is true

#### Scenario: Icon support
- **GIVEN** `VoucherButton` with `icon={<Trash2 />}`
- **WHEN** rendered
- **THEN** the icon appears with correct spacing and the button remains accessible

### Requirement: VoucherInput
The system SHALL provide a `VoucherInput` component that replaces `TextInput` inside voucher forms.

#### Scenario: Types and sizes
- **GIVEN** `VoucherInput` with `type` (`text`, `number`, `date`, `search`, `tel`) and `size` (`sm`, `md`, `lg`)
- **WHEN** rendered
- **THEN** it uses a native input with correct styling and focus ring

#### Scenario: Prefix/suffix icons
- **GIVEN** `VoucherInput` with `prefixIcon` or `suffixIcon`
- **WHEN** rendered
- **THEN** the icon appears inside the input without breaking layout

#### Scenario: Error state
- **GIVEN** `VoucherInput` with `error` prop
- **WHEN** rendered
- **THEN** it displays error border/style

### Requirement: VoucherField
The system SHALL provide a `VoucherField` composition component wrapping label, input, and error/hint text.

#### Scenario: Field composition
- **GIVEN** `VoucherField` with `label`, `error`, `hint`, and children
- **WHEN** rendered
- **THEN** it shows label, child control, error message, and hint with correct spacing

### Requirement: VoucherSection
The system SHALL provide `VoucherSection`, `VoucherSectionHeader`, and `VoucherSectionContent` for sidebar card layouts.

#### Scenario: Section card style
- **GIVEN** `VoucherSection` used outside sidebar
- **WHEN** rendered
- **THEN** it displays border, radius, and shadow

#### Scenario: Section flat style inside sidebar
- **GIVEN** `VoucherSection` used inside `VoucherSidebar`
- **WHEN** rendered
- **THEN** it appears flat (no border/shadow) via CSS override

### Requirement: VoucherSearch
The system SHALL provide a `VoucherSearch` input shell for the header search field.

#### Scenario: Search shell only
- **GIVEN** `VoucherSearch` with `value`, `onChange`, `placeholder`
- **WHEN** rendered in `VoucherFormLayout` header
- **THEN** it displays a search icon and input only; dropdown logic remains external

### Requirement: VoucherProductDropdown
The system SHALL provide a `VoucherProductDropdown` with `client` and `server` modes to replace `ImportProductSearch`, `DisposalProductSearch`, and `ProductSearchDropdown`.

#### Scenario: Client mode
- **GIVEN** `VoucherProductDropdown` with `mode="client"`, `products`, `searchValue`, `open`, `onRequestClose`, `onSelectProduct`
- **WHEN** the user types and navigates with ArrowUp/Down, Enter, Esc
- **THEN** it filters client-side, highlights items, scrolls active item into view, closes on Esc or click outside

#### Scenario: Server mode
- **GIVEN** `VoucherProductDropdown` with `mode="server"`, `results`, `open`, `onRequestClose`, `onSelectProduct`
- **WHEN** the user navigates with ArrowUp/Down, Enter, Esc
- **THEN** it displays provided results, highlights items, and closes on Esc or click outside

### Requirement: VoucherTable and VoucherTableRow
The system SHALL provide `VoucherTable` and `VoucherTableRow` to replace table shells in ImportGoods, DisposalForm, and InventoryCount.

#### Scenario: Table shell
- **GIVEN** `VoucherTable` with `children` and `className`
- **WHEN** rendered
- **THEN** it displays a table with sticky header and scrollable body

#### Scenario: Row render strategies
- **GIVEN** `VoucherTableRow` with `children` or `renderCells`
- **WHEN** rendered inside `VoucherTable`
- **THEN** it supports both full row content and cell-based rendering

#### Scenario: Lot selector embedding
- **GIVEN** a disposal item row with `product?.hasBatches && product?.lots?.length > 0`
- **WHEN** `VoucherTableRow` renders `DisposalLotSelector` through its `children`/`renderCells`
- **THEN** the selector logic for `reason === 'Hàng hết hạn'` still locks quantity correctly

### Requirement: VoucherTotals
The system SHALL provide a `VoucherTotals` display component for sidebar totals.

#### Scenario: Totals display
- **GIVEN** `VoucherTotals` with `items: { label, value, highlight? }[]`
- **WHEN** rendered
- **THEN** it displays each total without computing business values

### Requirement: VoucherEmpty
The system SHALL provide a `VoucherEmpty` component for empty states in voucher forms.

#### Scenario: Empty state
- **GIVEN** `VoucherEmpty` with `title`, `description`, `icon`, `action`
- **WHEN** rendered in a table or form area
- **THEN** it displays dashed border and provided content

### Requirement: Pilot refactor on DisposalForm
The system SHALL replace old UI shells in `pages/DisposalForm.tsx` with voucher-form components.

#### Scenario: DisposalForm uses voucher components
- **GIVEN** `pages/DisposalForm.tsx` is refactored
- **WHEN** rendered
- **THEN** it uses `VoucherFormLayout`, `VoucherSearch`, `VoucherProductDropdown`, `VoucherTable`, `VoucherTableRow`, `VoucherSection`, `VoucherField`, `VoucherSelect`, `VoucherTextarea`, `VoucherActions`, `VoucherButton`, and `VoucherEmpty` where appropriate

#### Scenario: DisposalLotSelector preserved
- **GIVEN** `DisposalItemRow` is replaced by `VoucherTableRow`
- **WHEN** a product has batches
- **THEN** `DisposalLotSelector` is still rendered inside the row and locks quantity for expired products

### Requirement: Rollout on ImportGoods
The system SHALL replace old UI shells in `pages/ImportGoods.tsx` with voucher-form components.

#### Scenario: ImportGoods sidebar refactor
- **GIVEN** `pages/ImportGoods.tsx` sidebar sections
- **WHEN** refactored with `VoucherSection`, `VoucherField`, `VoucherInput`, `VoucherSelect`, `VoucherTextarea`, `VoucherTotals`, `VoucherActions`, `VoucherButton`
- **THEN** totals, supplier selection, receipt info, note, and footer remain functional

#### Scenario: ImportGoods main area refactor
- **GIVEN** `pages/ImportGoods.tsx` main area search, table, and item rows
- **WHEN** refactored with `VoucherSearch`, `VoucherProductDropdown`, `VoucherTable`, `VoucherTableRow`
- **THEN** search, add product, table rendering, lot popover, and line totals remain functional

#### Scenario: LotExpiryPopover preserved
- **GIVEN** `ImportItemRow` is replaced by `VoucherTableRow`
- **WHEN** a product requires lot/expiry input
- **THEN** `LotExpiryPopover` remains rendered inside the row without modification

### Requirement: Rollout on InventoryCount
The system SHALL replace old UI shells in `pages/InventoryCount.tsx` and `CountFormLayout.tsx` with voucher-form components.

#### Scenario: CountFormLayout refactor
- **GIVEN** `components/inventory-count/CountFormLayout.tsx`
- **WHEN** refactored internally with `VoucherFormLayout`, `VoucherSection`, `VoucherField`, `VoucherTotals`
- **THEN** public props (`formData`, `setFormData`, `isEditing`, `children`, `onBack`, `actions`) remain unchanged

#### Scenario: InventoryCount search and table
- **GIVEN** `pages/InventoryCount.tsx` search dropdown and count table
- **WHEN** refactored with `VoucherSearch`, `VoucherProductDropdown`, `VoucherTable`, `VoucherTableRow`
- **THEN** Excel import, scanner, diff calculation, and diff color display remain functional

### Requirement: Rollout on SupplierExchanges
The system SHALL replace input/button/section styling in `pages/SupplierExchanges.tsx` create form with voucher-form components.

#### Scenario: SupplierExchanges wizard preserved
- **GIVEN** `pages/SupplierExchanges.tsx` create form
- **WHEN** refactored with `VoucherFormLayout`, `VoucherInput`, `VoucherButton`, `VoucherSection`, `VoucherBanner`, `VoucherSearch`, `VoucherProductDropdown`, `VoucherEmpty`
- **THEN** lot selection grid, receipt list, and exchange item cards remain as wizard steps without table template

### Requirement: Dead code cleanup
The system SHALL remove old CSS and components after confirming they are no longer imported.

#### Scenario: Safe deletion
- **GIVEN** `grep` confirms no remaining imports of `ImportProductSearch|ImportItemsTable|ImportItemRow|DisposalProductSearch|DisposalItemsTable|DisposalItemRow|ProductSearchDropdown|CountItemsTable`
- **WHEN** old files and CSS are deleted
- **THEN** `npm run lint` and `npm run build` still pass

#### Scenario: Protected files remain
- **GIVEN** cleanup phase runs
- **WHEN** checking `components/disposal-form/`
- **THEN** `DisposalDetailModal.tsx/.css` and `DisposalLotSelector.tsx/.css` remain untouched

## MODIFIED Requirements

### Requirement: VoucherFormLayout location
The system SHALL locate `VoucherFormLayout` source files in `components/voucher-form/` instead of `components/`.

#### Scenario: Single source of truth
- **GIVEN** the old `components/VoucherFormLayout.tsx` is deleted
- **WHEN** all imports point to `components/voucher-form/`
- **THEN** there is exactly one `VoucherFormLayout` source in the project

## REMOVED Requirements

- None. No capability is deprecated; only internal UI shells are consolidated.
