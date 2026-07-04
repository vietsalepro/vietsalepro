## Context

PLAN_02 Phase 3 handles the Kiểm kê (InventoryCount) screen. The screen currently has its own `CountFormLayout.css` for a notes textarea, a raw date input in `CountInfoSection`, and duplicated accent classes in `CountSummary.css`. The plan also creates `FormTextarea` as a shared component because all four voucher screens need a consistent notes textarea.

## Goals / Non-Goals

**Goals:**
- Create a reusable `FormTextarea` component and use it in InventoryCount, DisposalForm, and ImportGoods note sections.
- Delete `CountFormLayout.css` and the import of it.
- Replace the raw date input in `CountInfoSection` with `TextInput type="date"`.
- Create `SummaryRow.css` with shared accent classes and migrate `CountSummary`.
- Clean `pages/InventoryCount.css` of create/edit form layout CSS.
- Comment out `useRefactoredCountLayout`.

**Non-Goals:**
- Changing inventory count business logic or API calls.
- Modifying `types.ts`.
- Refactoring the list view beyond removing create-form CSS.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Create `FormTextarea` as a shared component | All four voucher screens need notes; one component ensures consistent style | Use `TextInput` multiline if supported; rejected because a dedicated textarea is clearer and safer |
| Delete `CountFormLayout.css` | After replacing textarea with `FormTextarea`, the file only contains layout CSS that belongs in `VoucherFormLayout.css` | Keep the file for legacy overrides; rejected because it violates SSOT |
| Use `TextInput type="date"` | The existing `TextInput` renders `<input {...rest}>` so `type` propagates; keeps input consistent | Create a dedicated date picker; rejected because it is unnecessary scope |
| Create `SummaryRow.css` | Accent classes are duplicated in `TotalsSection.css` and `StatsSection.css`; a shared source prevents loss when dead files are removed | Keep accent classes in each section; rejected because it fragments styles and causes regressions when deleting dead files |
| Comment out `useRefactoredCountLayout` | The flag is not imported anywhere, but commenting it allows safe verification before Phase 6b deletion | Delete immediately; rejected because PLAN_02 schedules deletion in Phase 6b |

## Risks / Trade-offs

- **[Medium]** Creating a new shared component always carries integration risk. Mitigation: use it in three note sections immediately and run lint/build.
- **[Low]** `TextInput type="date"` may not style the browser date picker icon correctly. Mitigation: test on Chrome and Safari; if needed, add CSS in `VoucherFormLayout.css`.
- **[Low]** Removing `CountInfoSection.css` may lose styles used elsewhere. Mitigation: grep each class before deletion.
- **[Low]** `SummaryRow.css` must exist before Phase 6a deletes `StatsSection.css`. Mitigation: Phase 3b creates it before Phase 6a.

## Migration / Rollback

- Migration: Create `FormTextarea` and `SummaryRow.css`, update the three note sections, update `CountFormLayout` and `CountInfoSection`, migrate `CountSummary`, clean `pages/InventoryCount.css`, comment out the flag. Run lint/build after each sub-phase.
- Rollback: Restore `CountFormLayout.css`, `CountInfoSection.css`, `CountSummary.css`, and the note sections from the Phase 3 backup. Delete `FormTextarea` and `SummaryRow.css` if they cause issues. Re-enable the flag.

## Open Questions

- Does `TextInput` already handle `type="date"` well enough, or does it need a wrapper/CSS override?
- Are there any `CountFormLayout.css` classes still used by other InventoryCount components besides the notes textarea?
