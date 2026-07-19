# Proposal: Phase 4 — Refactor `SupplierExchanges`

## Why

`SupplierExchanges` (Đổi trả hàng NCC) has a create form that needs the new `banner` prop added in Phase 1. Its sidebar sections may still be inline or use custom boxes instead of the standard `SectionBox` + `SectionHeader` + `SectionContent` pattern. The page also may contain page-level CSS that defines layout for the create form, violating the SSOT principle. Phase 4 standardizes the create form and cleans its CSS.

## What Changes

- Analyze the current create form in `pages/SupplierExchanges.tsx` and confirm whether `components/supplier-exchanges/` exists.
- Move the alert banner into the `banner` prop of `VoucherFormLayout`.
- Remove any create-form flex/grid wrapper around `VoucherFormLayout`.
- Handle page-level container padding so the banner is not misaligned.
- Refactor sidebar sections (Thông tin phiếu, Tổng kết) into `SectionBox` components using `SectionHeader` and `SectionContent`.
- Replace raw `select` and `textarea` with `SelectInput`/`TextInput` and `FormTextarea`.
- Clean `pages/SupplierExchanges.css` by removing create-form layout CSS while keeping list/detail/modal CSS.

## Scope / Non-Goals

**In scope:**
- `pages/SupplierExchanges.tsx` create form layout standardization
- `pages/SupplierExchanges.css` cleanup
- Use of `VoucherFormLayout` `banner` prop
- Sidebar section standardization

**Out of scope:**
- Business logic of supplier exchanges (wizard steps, lot/receipt selection, calculations)
- `types.ts` changes
- Database/Supabase changes
- Creating a separate `components/supplier-exchanges/` folder (optional future refactor)

## Capabilities

### New Capabilities
- `supplier-exchanges-banner`: The create form displays the alert banner inside `VoucherFormLayout`.
- `supplier-exchanges-sections`: Sidebar sections use standard `SectionBox` components.

### Modified Capabilities
- `supplier-exchanges-create-form`: Create form no longer defines its own layout wrapper and uses `VoucherFormLayout` slots.

### Removed Capabilities
- None (this is standardization)

## Impact

- Modified files: `pages/SupplierExchanges.tsx`, `pages/SupplierExchanges.css`
- No new files; no deletions (unless page-level CSS classes are removed)
- Depends on Phase 1 (`banner` prop) and Phase 3a (`FormTextarea`)

## Rollback

Restore `pages/SupplierExchanges.tsx` and `pages/SupplierExchanges.css` from the Phase 4 backup. The change is localized to one page, so rollback is safe and does not affect other screens.
