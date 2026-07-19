## Context

PLAN_02 Phase 6 is the final cleanup phase. By this point, the four voucher screens should use `VoucherFormLayout` and the V1 branches should have been removed. The remaining work is to delete the 11 dead code files, remove the three commented feature flags from `features.ts`, remove section-specific textarea CSS, and audit `index.css` for legacy `ig-*` classes.

## Goals / Non-Goals

**Goals:**
- Delete the 11 dead code files listed in Phase 0b and Phase 6a.
- Remove the three feature flags from `features.ts`.
- Confirm no imports of the deleted files or flags remain.
- Remove section-specific textarea classes from note section CSS.
- Audit `index.css` and remove unused `ig-*` classes while keeping history/detail/list view classes.
- Confirm only `VoucherFormLayout` is used as the shared layout.

**Non-Goals:**
- Changing any business logic.
- Modifying `types.ts`.
- Adding new features or components.
- Removing files that are still imported (verify before deleting).

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Delete files in the order: imports first, then files | Prevents build errors from missing imports | Delete files first; rejected because it would break lint/build |
| Grep each `ig-*` class individually | Ensures a class is truly unused before deleting it | Delete all `ig-*` classes at once; rejected because some are still used by history/detail views |
| Keep `ig-history-*`, `ig-page-detail-*`, `ig-search-*`, `ig-filter-*`, `ig-pagination-*` | These classes support views that are not part of the form refactor | Move them to view-specific CSS files; rejected because it is out of scope |
| Remove section-specific textarea classes | `FormTextarea.css` is now the single source of truth | Keep duplicate classes as fallback; rejected because it violates SSOT |

## Risks / Trade-offs

- **[Medium]** Auditing `index.css` is tedious; an error could remove a class still used by a live view. Mitigation: grep each class individually and keep documented safe classes.
- **[Low]** Deleting `StatsSection.css` removes `.summary-row-value--danger` if `SummaryRow.css` was not created. Mitigation: Phase 3b creates `SummaryRow.css` before Phase 6a runs.
- **[Low]** A missed import of a deleted file causes build failure. Mitigation: run `npm run lint` after each deletion group.

## Migration / Rollback

- Migration: Delete imports first, then files, then flags, then audit CSS. Run lint/build after each step. Run final grep checks.
- Rollback: Restore individual files or CSS classes from the Phase 6 backup. Re-add flag lines to `features.ts` if needed.

## Open Questions

- Are there any other files besides the 11 listed that reference dead layout components? (Answered by final grep.)
- Are there any `ig-*` variables in addition to classes that need to be removed? (Answered by Phase 6c grep.)
