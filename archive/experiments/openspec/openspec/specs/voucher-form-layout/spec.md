# Voucher Form Layout

## Purpose

This specification defines the layout contract for the four voucher-style data entry screens in VietSale Pro v7: Import Goods, Inventory Count, Disposal, and Supplier Exchange. The shared `VoucherFormLayout` component is the single source of truth for the visual structure, styling, and responsive behavior of these screens.
## Requirements
### Requirement: Shared voucher form layout component exists

The system SHALL provide a single shared layout component `VoucherFormLayout` in `components/VoucherFormLayout.tsx` that renders a two-column form layout for voucher-style data entry screens.

#### Scenario: VoucherFormLayout renders header and columns
- **GIVEN** a page renders `VoucherFormLayout` with `title`, `main`, `sidebar`, and `actions`
- **WHEN** the page loads
- **THEN** the system displays a header with back button, title, and search input
- **AND** the system displays a main content area on the left
- **AND** the system displays a sidebar on the right with a sticky actions area

### Requirement: Four voucher screens use the shared layout

The system SHALL use `VoucherFormLayout` for the following voucher screens:
- Import goods (`pages/ImportGoods.tsx`)
- Inventory count (`pages/InventoryCount.tsx`)
- Disposal (`pages/DisposalForm.tsx`)
- Supplier exchange (`pages/SupplierExchanges.tsx`)

#### Scenario: All four screens render with VoucherFormLayout
- **GIVEN** a user navigates to any of the four voucher screens
- **WHEN** the screen is in create or edit mode
- **THEN** the screen uses `VoucherFormLayout` as its top-level layout container
- **AND** the screen does not define a separate layout wrapper

### Requirement: Layout refactor feature flags are removed

The three flags `useRefactoredImportLayout`, `useRefactoredDisposalLayout`, and `useRefactoredCountLayout` SHALL be removed from `features.ts`. No file in `components/` or `pages/` SHALL import or reference them.

#### Scenario: No feature flags remain
- **GIVEN** the codebase is searched for the three flag names
- **WHEN** the grep completes
- **THEN** the result is empty

### Requirement: Legacy layout dead code is deleted

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

### Requirement: Shared note textarea replaces section-specific textarea styles

`components/disposal-form/DisposalSidebar/NoteSection.css` and `components/import-goods/ImportSidebar/NoteSection.css` SHALL no longer define `.disposal-note-textarea` or `.import-note-textarea`. All note textarea styling SHALL come from `components/FormTextarea.css`.

#### Scenario: Note section CSS has no textarea classes
- **GIVEN** `FormTextarea.css` is the shared source for textarea styles
- **WHEN** the note section CSS files are inspected
- **THEN** `.disposal-note-textarea`, `.import-note-textarea`, and `.count-notes-textarea` are not defined

### Requirement: Business logic is not affected by layout changes

The system SHALL keep all business logic, handlers, validation, state management, API calls, and `types.ts` unchanged during any layout refactor.

#### Scenario: Layout-only change does not touch business logic
- **GIVEN** a layout refactor is performed
- **WHEN** the code is inspected
- **THEN** no business logic handlers are modified
- **AND** no database or Supabase schemas are modified
- **AND** `types.ts` is unchanged

### Requirement: Baseline audit document exists

The system SHALL have a baseline audit document at `docs/plans/voucher-form-layout-ssot/BASELINE_AUDIT.md` that lists all dead code, feature flags, legacy CSS classes, and affected files before the layout refactor begins.

#### Scenario: Audit document is complete
- **GIVEN** the VoucherFormLayout SSOT refactor is about to start
- **WHEN** a developer opens `BASELINE_AUDIT.md`
- **THEN** the document lists all files to delete, all files to modify, all feature flags to remove, and all legacy CSS classes to audit
- **AND** the document confirms the current `npm run lint` and `npm run build` status

### Requirement: VoucherFormLayout supports an optional banner slot

`VoucherFormLayout` SHALL expose a `banner?: React.ReactNode` prop. When provided, the banner SHALL be rendered between the header and the body. When not provided, the layout SHALL render exactly as before.

#### Scenario: Banner prop is provided
- **GIVEN** a page renders `VoucherFormLayout` with a `banner` prop
- **WHEN** the component renders
- **THEN** the banner appears between the header and the body
- **AND** the banner is wrapped in an element with class `voucher-banner`

#### Scenario: Banner prop is omitted
- **GIVEN** a page renders `VoucherFormLayout` without a `banner` prop
- **WHEN** the component renders
- **THEN** no `voucher-banner` element is present
- **AND** the header flows directly to the body

### Requirement: VoucherFormLayout has banner CSS using design tokens

`components/VoucherFormLayout.css` SHALL define `.voucher-banner` with a warning-style background, border, text color, font size, and line height, using design tokens with fallback values. The banner SHALL be `flex-shrink: 0` so it does not compress the body or sidebar.

#### Scenario: Banner renders on desktop
- **GIVEN** a page renders `VoucherFormLayout` with a `banner` on a desktop viewport
- **WHEN** the layout is displayed
- **THEN** the banner has `padding: 12px 16px`
- **AND** the banner content has `display: flex`, `align-items: center`, and `gap: 8px`

#### Scenario: Banner renders on mobile
- **GIVEN** a page renders `VoucherFormLayout` with a `banner` on a viewport narrower than 768px
- **WHEN** the layout is displayed
- **THEN** the banner padding reduces to `8px 12px`

### Requirement: VoucherFormLayoutProps interface includes banner

The `VoucherFormLayoutProps` interface in `components/VoucherFormLayout.tsx` SHALL be updated to include `banner?: React.ReactNode`.

#### Scenario: TypeScript consumes the new prop
- **GIVEN** a developer imports `VoucherFormLayout` and passes a `banner` element
- **WHEN** TypeScript compiles
- **THEN** no type error is raised
- **AND** the prop is optional (omitting it is valid)

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

### Requirement: Static verification passes with zero errors

After Phase 6, the project SHALL pass `npm run lint` with zero errors and `npm run build` with zero errors.

#### Scenario: Lint passes
- **GIVEN** the project is at the end of Phase 6
- **WHEN** `npm run lint` is executed
- **THEN** the command exits with status 0
- **AND** no errors are reported

#### Scenario: Build passes
- **GIVEN** the project is at the end of Phase 6
- **WHEN** `npm run build` is executed
- **THEN** the command exits with status 0
- **AND** no errors are reported

### Requirement: Five manual business flows pass

The four voucher screens SHALL support the following flows without functional regression:
1. Tạo phiếu nhập hàng
2. Sửa phiếu nhập hàng draft
3. Tạo phiếu kiểm kê
4. Tạo phiếu xuất hủy
5. Tạo phiếu đổi hàng NCC

#### Scenario: Create import voucher
- **GIVEN** the user creates a new import voucher
- **WHEN** they select supplier, add products, enter prices/quantities/discounts, enter shipping fee, invoice discount, and paid amount, then save draft and complete
- **THEN** inventory increases correctly and supplier debt is updated correctly
- **AND** no critical console errors appear

#### Scenario: Edit import draft voucher
- **GIVEN** the user opens a saved import draft
- **WHEN** they change a quantity and save again
- **THEN** the updated data is persisted correctly

#### Scenario: Create inventory count voucher
- **GIVEN** the user creates a new inventory count
- **WHEN** they add products, enter actual quantities, save draft, and complete
- **THEN** variance displays correctly and inventory is updated

#### Scenario: Create disposal voucher
- **GIVEN** the user creates a new disposal voucher
- **WHEN** they select a reason, add products, save draft, and complete
- **THEN** inventory decreases correctly

#### Scenario: Create supplier exchange voucher
- **GIVEN** the user creates a new supplier exchange voucher
- **WHEN** they select supplier, original receipt, lot, enter return quantity and received quantity, then complete
- **THEN** the exchange voucher is created and inventory is updated

### Requirement: Responsive and edge-case verification passes

The four voucher screens SHALL render correctly on desktop, tablet, and mobile, and the documented edge cases SHALL pass.

#### Scenario: Desktop layout
- **GIVEN** the viewport is wider than 1024px
- **WHEN** each voucher screen is displayed
- **THEN** the layout shows two columns (main ~70%, sidebar ~30%)
- **AND** header back/title/search are balanced
- **AND** sidebar actions are sticky at the bottom

#### Scenario: Tablet layout
- **GIVEN** the viewport is between 768px and 1024px
- **WHEN** each voucher screen is displayed
- **THEN** the layout becomes a single column with sidebar below main
- **AND** no horizontal overflow occurs

#### Scenario: Mobile layout
- **GIVEN** the viewport is narrower than 768px
- **WHEN** each voucher screen is displayed
- **THEN** the header wraps (back + title on one row, search on the next)
- **AND** sidebar is below main
- **AND** sidebar actions stack vertically or horizontally as appropriate

#### Scenario: SupplierExchanges wizard UI is responsive
- **GIVEN** the user is on the supplier exchange create form on a tablet or mobile viewport
- **WHEN** they navigate product search → lot selection → receipt selection
- **THEN** no horizontal overflow or overlap occurs

#### Scenario: InventoryCount date input visual is correct
- **GIVEN** the user is on the inventory count form in Chrome or Safari
- **WHEN** the date input renders
- **THEN** the browser date picker icon is not misaligned

