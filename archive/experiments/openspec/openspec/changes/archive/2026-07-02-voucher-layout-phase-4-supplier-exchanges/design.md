## Context

PLAN_02 Phase 4 handles the `SupplierExchanges` create form. The screen is the only one of the four voucher screens that needs an alert banner, which is why the `banner` prop was added to `VoucherFormLayout` in Phase 1. The sidebar currently appears to be a single box with a divider, and the form may use raw `select` and `textarea` elements. The goal is to make the create form follow the same SSOT pattern as the other three screens.

## Goals / Non-Goals

**Goals:**
- Pass the alert banner into `VoucherFormLayout` via the `banner` prop.
- Remove create-form layout wrappers from `pages/SupplierExchanges.tsx`.
- Refactor sidebar into two `SectionBox` sections: Thông tin phiếu and Tổng kết.
- Use `TextInput`, `SelectInput`, `FormTextarea`, and `SummaryRow` for form fields.
- Clean `pages/SupplierExchanges.css` of create-form layout CSS.

**Non-Goals:**
- Changing the wizard UI logic (product search, lot selection, receipt selection).
- Modifying business calculations (totals, debt adjustment).
- Creating a new `components/supplier-exchanges/` folder unless sections are too complex.
- Modifying list/detail/modal CSS.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Use the `banner` prop for the alert | Keeps the banner inside the shared layout so it is consistently placed | Render banner inline in `main`; rejected because it would not align with the SSOT layout |
| Split sidebar into two `SectionBox` blocks | Aligns with other voucher screens; gap controlled by `VoucherFormLayout.css` | Keep single box with divider; rejected because it fragments the shared section pattern |
| Use `SelectInput` for Lý do đổi trả | Standard component, no label whitespace because label is omitted | Keep raw `<select>`; rejected because it breaks component standardization |
| Use `FormTextarea` for Ghi chú | Created in Phase 3a for consistency across all note sections | Keep raw `<textarea>`; rejected because it violates SSOT |
| Option A for page-level container: zero padding in create view | Allows the banner to be full-width within `VoucherFormLayout` | Option B: accept banner inside padding; rejected because it misaligns the banner visually |

## Risks / Trade-offs

- **[Medium]** The alert banner may appear misaligned if the page-level container still applies padding to the create view. Mitigation: use a zero-padding container for create view (Option A).
- **[Medium]** Splitting a single sidebar box into two may change visual spacing. Mitigation: rely on `.voucher-sidebar-content` gap and verify in Phase 7c.
- **[Low]** `SelectInput` may behave differently without a label. Mitigation: confirm `SelectInput` only renders label when `label` is truthy.

## Migration / Rollback

- Migration: Update `pages/SupplierExchanges.tsx`, then clean `pages/SupplierExchanges.css`. Run lint/build. Test the wizard flow and banner placement.
- Rollback: Restore `pages/SupplierExchanges.tsx` and `pages/SupplierExchanges.css` from the Phase 4 backup.

## Open Questions

- Does `components/supplier-exchanges/` exist? If yes, the sidebar refactor should be split into component files.
- Is the `banner` prop already available from Phase 1? If not, Phase 4 must wait for Phase 1.
