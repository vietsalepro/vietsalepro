# Delta for Voucher Form Layout

## ADDED Requirements

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

## MODIFIED Requirements

- None

## REMOVED Requirements

- None
