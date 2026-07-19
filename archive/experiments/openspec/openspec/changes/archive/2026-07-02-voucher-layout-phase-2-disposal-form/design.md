## Context

PLAN_02 Phase 2 focuses on the Xuất hủy (DisposalForm) screen. Audit results from Phase 0 showed that this screen still references `DisposalFormLayout`, `DisposalTopBar`, `StatsSection`, and `useRefactoredDisposalLayout`. Sidebar sections and item-table components still carry V1/V2 branches guarded by the feature flag. The goal is to remove the legacy layout dependency and make the create form fully use `VoucherFormLayout`.

## Goals / Non-Goals

**Goals:**
- Delete `DisposalFormLayout` and its CSS.
- Remove V1 branches from all `DisposalSidebar` sections.
- Clean dead imports (`DisposalTopBar`, `StatsSection`) from `pages/DisposalForm.tsx`.
- Ensure `pages/DisposalForm.tsx` only passes content into `VoucherFormLayout` slots.
- Remove V1 branches from `DisposalItemRow` and `DisposalItemsTable`.
- Comment out `useRefactoredDisposalLayout` in `features.ts`.
- Review and clean create-form CSS in `pages/DisposalForm.css` if it exists.

**Non-Goals:**
- Changing business logic (calculations, validation, API calls, state management).
- Modifying `types.ts`.
- Deleting `DisposalTopBar.tsx`, `DisposalTopBar.css`, `StatsSection.tsx`, `StatsSection.css` (Phase 6a).
- Removing the feature flag line permanently (Phase 6b).

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Delete `DisposalFormLayout` files | Confirmed by Phase 0a grep that no file imports them | Keep as reference; rejected because it is dead code |
| Option A for `StatsSection` — remove | `StatsSection` is not rendered in `pages/DisposalForm.tsx`; sidebar is long enough without it | Keep stats in sidebar; rejected because it adds no value and duplicates info |
| Comment out `useRefactoredDisposalLayout` | Allows fast rollback if the V2 branch has issues | Delete immediately; rejected because Phase 2h needs to verify first |
| Keep `DisposalTopBar`/`StatsSection` files until Phase 6a | `pages/DisposalForm.tsx` must remove imports before files are deleted to avoid lint/build failures | Delete files in Phase 2d; rejected because it would break the build |
| Use `SectionBox` for all sidebar sections | Enforces the SSOT layout principle | Allow custom section wrappers; rejected because it fragments layout |

## Risks / Trade-offs

- **[Medium]** `DisposalItemRow` and `DisposalItemsTable` are live components; removing V1 branches must preserve business logic. Mitigation: keep V2 markup exactly, only delete the conditional.
- **[Medium]** Page-level wrapper in `pages/DisposalForm.tsx` uses `--ig-bg` and padding that may affect layout. Mitigation: replace with standard token or leave the variable for Phase 6c audit.
- **[Low]** `StatsSection` currently defines `.summary-row-value--danger`. Mitigation: `SummaryRow.css` will be created in Phase 3b before `StatsSection.css` is removed.

## Migration / Rollback

- Migration: Execute sub-phases 2a through 2h in order. Run `npm run lint` after each sub-phase and `npm run build` after the phase. Test the disposal create/save/complete flow manually.
- Rollback: Restore modified files from the Phase 2 backup. Uncomment `useRefactoredDisposalLayout` if needed. If `DisposalFormLayout` files were deleted, restore them from the backup.

## Open Questions

- Does `pages/DisposalForm.css` exist? If yes, which classes are create-form-only vs list/detail/modal? (Answered in Phase 0a.)
- Is `--ig-bg` used anywhere else? If not, it should be removed in Phase 6c.
