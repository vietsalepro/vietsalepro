## Context

PLAN_02 Phase 1 is the foundation of the VoucherFormLayout SSOT refactor. The component currently supports `title`, `onBack`, `searchSlot`, `main`, `sidebar`, `actions`, and `className`. `SupplierExchanges` (Phase 4) needs to show an important alert banner in the create form, and that banner must be controlled by the shared layout so that all pages behave consistently.

## Goals / Non-Goals

**Goals:**
- Add an optional `banner` prop to `VoucherFormLayout` and render it between the header and body.
- Add banner CSS that uses design tokens with fallbacks and remains responsive.
- Preserve the existing 2-column ~70/30 ratio and header/body structure.
- Document the decision not to add a `statsRow` prop.

**Non-Goals:**
- Changing any page file.
- Adding business logic or data fetching.
- Introducing breaking changes to existing props.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Add `banner?: React.ReactNode` | `SupplierExchanges` create form needs an alert between header and body; placing it in the shared layout keeps the slot pattern consistent | Render banner inside each page's `main` slot; rejected because it breaks SSOT and creates inconsistent placement |
| Use design tokens with hex fallbacks | Keeps the design system aligned while allowing the banner to work even if a token is missing | Hardcode colors; rejected because it bypasses the design system |
| Keep `statsRow` out of `VoucherFormLayout` | `InventoryCount` stats row belongs to the list view, not the create/edit form view | Add a `statsRow` prop now; rejected because it is not needed by the current scope |
| Banner is optional and conditional | Avoids affecting the three pages that do not need a banner | Always render a placeholder banner; rejected because it would add empty DOM and visual noise |

## Risks / Trade-offs

- **[Low]** Banner CSS might clash with page-level padding if a page wraps `VoucherFormLayout` in a padded container. Mitigation: Phase 4 addresses `.supplier-exchanges-page` padding explicitly.
- **[Low]** Missing design tokens could cause fallback colors to differ slightly from the design system. Mitigation: Phase 0d already verified the tokens; fallback values are documented.
- **[Low]** Adding a DOM element between header and body might affect flex behavior. Mitigation: `flex-shrink: 0` and visual testing in Phase 7c.

## Migration / Rollback

- Migration: Add the prop and CSS, then verify with `npm run lint` and `npm run build`. No data migration.
- Rollback: Revert `components/VoucherFormLayout.tsx` and `components/VoucherFormLayout.css` from the Phase 1 backup. Because the prop is optional, rollback is safe for all pages.

## Open Questions

- Does any page other than `SupplierExchanges` eventually need a banner? If yes, the optional prop already covers it without further changes.
- Should the banner support a dismiss action? Not required by PLAN_02; the current alert is static.
