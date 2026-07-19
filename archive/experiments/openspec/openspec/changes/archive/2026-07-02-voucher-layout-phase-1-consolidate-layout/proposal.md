# Proposal: Phase 1 — Củng cố `VoucherFormLayout`

## Why

`VoucherFormLayout` is the intended SSOT for the four voucher screens (Nhập hàng, Kiểm kê, Xuất hủy, Đổi hàng NCC). Before the remaining pages can fully rely on it, the component needs an optional `banner` slot for the `SupplierExchanges` alert and its CSS must be ready for responsive banner placement. The goal is to make layout changes possible in only two files: `components/VoucherFormLayout.tsx` and `components/VoucherFormLayout.css`.

## What Changes

- Analyze current `VoucherFormLayout` props and confirm the missing `banner` prop.
- Add `banner?: React.ReactNode` to the `VoucherFormLayoutProps` interface.
- Render the banner between the header and the body, only when provided.
- Add `.voucher-banner` styles to `components/VoucherFormLayout.css` using design tokens with fallbacks.
- Keep the existing ~70/30 main/sidebar ratio and responsive behavior unchanged.
- Explicitly decide **not** to add a `statsRow` prop because `InventoryCount` stats belong to the list view, not the create/edit form view.

## Scope / Non-Goals

**In scope:**
- `components/VoucherFormLayout.tsx` (prop interface and render logic)
- `components/VoucherFormLayout.css` (banner styles and responsive media query)
- Prop analysis and documented decisions

**Out of scope:**
- Any page-level changes (Phases 2–5 handle those)
- Business logic, `types.ts`, database, or API changes
- Shared component API changes outside `VoucherFormLayout`

## Capabilities

### New Capabilities
- `voucher-form-banner`: `VoucherFormLayout` can optionally render a banner slot between the header and body.
- `voucher-form-banner-responsive`: Banner styles adapt to tablet and mobile breakpoints.

### Modified Capabilities
- `voucher-form-layout`: `VoucherFormLayoutProps` gains `banner?: React.ReactNode` and renders it conditionally.

## Impact

- `components/VoucherFormLayout.tsx` — add `banner` prop and conditional render
- `components/VoucherFormLayout.css` — add `.voucher-banner` block and optional mobile media query
- No other files are modified in this phase

## Rollback

Revert the two files above from the Phase 1 backup. Because the banner is optional, pages that do not pass it are unaffected; rollback is safe if the banner style causes visual regressions.
