## Context

PLAN_02 Phase 5 focuses on the Nhập hàng (ImportGoods) screen. Audit results from Phase 0 showed this screen has the most legacy code: `ImportFormLayout`, `ImportTopBar`, V1 branches in all five sidebar sections, V1 branches in `ImportItemRow` and `ImportItemsTable`, and a large `pages/ImportGoods.css` with `ig-*` classes. The screen is high risk because it contains important business logic for totals, debt, and payment.

## Goals / Non-Goals

**Goals:**
- Delete `ImportFormLayout`, `ImportFormLayout.css`, `ImportTopBar`, and `ImportTopBar.css`.
- Remove V1 branches and `useRefactoredImportLayout` imports from all `ImportSidebar` sections.
- Keep all calculation logic in `TotalsSection.tsx` unchanged.
- Replace `NoteSection` raw textarea with `FormTextarea`.
- Remove duplicate accent classes from `TotalsSection.css` and remove `.ig-input-sm--w140`.
- Remove V1 branches from `ImportItemRow` and `ImportItemsTable`.
- Clean `pages/ImportGoods.css` and `pages/ImportGoods.tsx` so the create form uses only `VoucherFormLayout`.
- Comment out `useRefactoredImportLayout` in `features.ts`.

**Non-Goals:**
- Changing any business logic, validation, calculations, or API calls.
- Modifying `types.ts`.
- Deleting `pages/ImportGoods.css` (only create-form layout classes are removed).
- Changing history/detail/list view behavior beyond CSS cleanup.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Delete `ImportFormLayout` and `ImportTopBar` files | Confirmed by Phase 0a grep that `ImportFormLayout` is unused and `ImportTopBar` is a dead import | Keep as reference; rejected because it is dead code |
| Keep totals calculation logic untouched | The calculation of `needToPay`, `debtDelta`, and `paidAmount` is critical business logic | Refactor calculations for clarity; rejected because it is out of scope and risky |
| Use `FormTextarea` for notes | Consistent with Phase 3a decision | Keep raw `<textarea>`; rejected because it fragments styles |
| Remove `.ig-input-sm--w140` from `TotalsSection.css` | Only used in the V1 branch | Keep class for safety; rejected because it is dead code after V1 removal |
| Remove section `margin-bottom` | `VoucherFormLayout.css` provides gap via `.voucher-sidebar-content` | Keep margins; rejected because it creates double spacing |
| Comment out `useRefactoredImportLayout` | Allows rollback if the complex import screen breaks | Delete immediately; rejected because verification in Phase 5h is needed first |

## Risks / Trade-offs

- **[High]** ImportGoods is the most complex screen; manual test flow is critical. Mitigation: run the full create/save/complete/edit flow in Phase 5h and again in Phase 7b.
- **[Medium]** `ImportItemRow` and `ImportItemsTable` are live components; V1 removal must preserve business logic. Mitigation: keep V2 markup exactly, only delete the conditional.
- **[Medium]** `pages/ImportGoods.css` is large and contains shared `ig-search-*` classes. Mitigation: grep each class before deleting; keep history/detail/filter/pagination/mobile classes.
- **[Low]** `TotalsSection.css` duplicate accent classes removed; `SummaryRow.css` from Phase 3b covers them. Mitigation: verify visual before and after.

## Migration / Rollback

- Migration: Execute sub-phases 5a through 5h in order. Run `npm run lint` after each sub-phase and `npm run build` after the phase. Test the import create/save/complete/edit flow manually.
- Rollback: Restore modified files and deleted files from the Phase 5 backup. Uncomment `useRefactoredImportLayout` if needed. Re-import `ImportTopBar` if it was needed (it should not be).

## Open Questions

- Which `ig-*` classes in `pages/ImportGoods.css` are shared between history and create views? (Answered by grepping each class before deletion.)
- Does the page-level wrapper `<div className="flex-1 min-h-0 flex flex-col">` serve any purpose beyond what `PageLayout` already provides? (PLAN_02 suggests it can be removed if redundant.)
