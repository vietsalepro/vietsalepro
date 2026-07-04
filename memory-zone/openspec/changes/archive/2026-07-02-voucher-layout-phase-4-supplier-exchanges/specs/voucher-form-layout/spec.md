# Delta for Voucher Form Layout

## ADDED Requirements

### Requirement: SupplierExchanges create form uses the VoucherFormLayout banner slot

`pages/SupplierExchanges.tsx` SHALL pass the alert banner into the `banner` prop of `VoucherFormLayout`. The banner SHALL be the warning about completed supplier-exchange vouchers being irreversible.

#### Scenario: Banner is inside VoucherFormLayout
- **GIVEN** the user opens the create view of `SupplierExchanges`
- **WHEN** the page renders
- **THEN** the alert banner appears between the `VoucherFormLayout` header and body
- **AND** the banner is rendered inside the `voucher-banner` element

### Requirement: SupplierExchanges create form does not define its own layout

`pages/SupplierExchanges.tsx` SHALL not wrap `VoucherFormLayout` in a div that defines grid, flex columns, or width for the create form. The page-level container SHALL only handle background/padding for the list view, or use a zero-padding container for the create view.

#### Scenario: Create view wrapper is layout-neutral
- **GIVEN** the user is in the create view of `SupplierExchanges`
- **WHEN** the wrapper element is inspected
- **THEN** it does not set `display: grid`, `display: flex` with column widths, or `width` on the create form
- **AND** `VoucherFormLayout` owns the two-column layout

### Requirement: SupplierExchanges sidebar sections use SectionBox

The sidebar of the create form SHALL contain two `SectionBox` blocks: **Thông tin phiếu** and **Tổng kết**. Each SHALL use `SectionHeader` and `SectionContent`. The gap between the two boxes SHALL come from `.voucher-sidebar-content` in `VoucherFormLayout.css`.

#### Scenario: Sidebar renders two SectionBox components
- **GIVEN** the create form sidebar is rendered
- **WHEN** the sidebar is inspected
- **THEN** it contains two elements with `SectionBox` semantics
- **AND** each has a `SectionHeader` and a `SectionContent`
- **AND** no inline layout wrapper defines the gap between sections

### Requirement: SupplierExchanges form inputs use standard components

The create form SHALL use `TextInput` for readonly fields, `SelectInput` for Lý do đổi trả, `FormTextarea` for Ghi chú, and `SummaryRow` for Tổng kết rows.

#### Scenario: Lý do đổi trả uses SelectInput without label whitespace
- **GIVEN** the Lý do đổi trả field has no label
- **WHEN** `SelectInput` renders
- **THEN** no empty label whitespace is rendered
- **AND** the dropdown displays correctly

#### Scenario: Ghi chú uses FormTextarea
- **GIVEN** the create form sidebar is rendered
- **WHEN** the Ghi chú field renders
- **THEN** it uses `<FormTextarea ... />`

### Requirement: SupplierExchanges create-form layout CSS is removed

`pages/SupplierExchanges.css` SHALL no longer contain CSS classes that define layout for the create form. Classes such as `.supplier-exchanges-warning` (if moved to banner), `.supplier-exchanges-sidebar-section`, `.supplier-exchanges-sidebar-title`, `.supplier-exchanges-readonly`, `.supplier-exchanges-select`, `.supplier-exchanges-textarea`, `.supplier-exchanges-section-divider`, `.supplier-exchanges-summary-row` SHALL be removed or reduced to content-only styling.

#### Scenario: SupplierExchanges.css has no create-form layout
- **GIVEN** `pages/SupplierExchanges.css` is searched for create-form layout classes
- **WHEN** the search completes
- **THEN** no create-form layout classes are found
- **AND** list view, detail view, and modal CSS remain

## MODIFIED Requirements

- None

## REMOVED Requirements

- None
