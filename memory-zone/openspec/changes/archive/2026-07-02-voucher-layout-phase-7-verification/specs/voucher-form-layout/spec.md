# Delta for Voucher Form Layout

## ADDED Requirements

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

## MODIFIED Requirements

- None

## REMOVED Requirements

- None
