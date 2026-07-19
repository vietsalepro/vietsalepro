# Proposal: Phase 5 — Refactor `ImportGoods`

## Why

The ImportGoods (Nhập hàng) screen is the most complex of the four voucher screens. It still contains the legacy `ImportFormLayout` component, a dead `ImportTopBar` import, V1 branches in all sidebar sections and item table components, and a large amount of `ig-*` CSS. Phase 5 removes the dead code, deletes the V1 branches, and ensures the create form uses only `VoucherFormLayout`.

## What Changes

- Delete `components/import-goods/ImportFormLayout.tsx`, `ImportFormLayout.css`, `ImportTopBar.tsx`, `ImportTopBar.css`.
- Remove V1 branches and `useRefactoredImportLayout` imports from all `ImportSidebar` sections: `SupplierSection`, `ReceiptInfoSection`, `TotalsSection`, `NoteSection`, `ActionFooter`.
- Replace `NoteSection` raw textarea with `FormTextarea`.
- Remove duplicate accent classes from `TotalsSection.css` and remove `.ig-input-sm--w140`.
- Remove `margin-bottom` dư thừa from section CSS now that `.voucher-sidebar-content` has a gap.
- Remove V1 branches from `ImportItemRow.tsx` and `ImportItemsTable.tsx`.
- Clean `pages/ImportGoods.css` by removing create-form layout CSS while keeping history/detail/filter/pagination CSS.
- Remove the create-form layout wrapper around `VoucherFormLayout` in `pages/ImportGoods.tsx`.
- Remove the `ImportTopBar` dead import from `pages/ImportGoods.tsx`.
- Comment out `useRefactoredImportLayout` in `features.ts` (final removal in Phase 6b).

## Scope / Non-Goals

**In scope:**
- Dead code deletion (`ImportFormLayout`, `ImportTopBar`)
- V1 branch removal in `ImportSidebar` sections and item table components
- `pages/ImportGoods.tsx` and `pages/ImportGoods.css` cleanup
- `useRefactoredImportLayout` deactivation

**Out of scope:**
- Business logic, validation, calculations, API calls (especially `needToPay`, `debtDelta`, `paidAmount` auto-fill)
- `types.ts` changes
- Database/Supabase changes
- Final removal of `useRefactoredImportLayout` (Phase 6b)

## Capabilities

### New Capabilities
- None (this is cleanup/refactor)

### Modified Capabilities
- `import-goods-create-form`: Uses only `VoucherFormLayout` for layout.
- `import-sidebar-sections`: Render only the V2 branch using standard components.
- `import-items-table`: Item row and table render only the V2 branch.

### Removed Capabilities
- `import-form-layout-v1`: `ImportFormLayout` component and CSS are removed.
- `import-topbar`: `ImportTopBar` usage and files are removed.
- `import-totals-section-v1`: V1 branch and legacy `.ig-input-sm--w140` class are removed.

## Impact

- Files deleted: `components/import-goods/ImportFormLayout.tsx`, `ImportFormLayout.css`, `ImportTopBar.tsx`, `ImportTopBar.css`
- Files modified: `pages/ImportGoods.tsx`, `pages/ImportGoods.css`, `components/import-goods/ImportSidebar/SupplierSection.tsx`, `ReceiptInfoSection.tsx`, `TotalsSection.tsx`, `NoteSection.tsx`, `ActionFooter.tsx`, `components/import-goods/ImportItemRow.tsx`, `ImportItemsTable.tsx`, `features.ts`
- CSS files adjusted: `SupplierSection.css`, `ReceiptInfoSection.css`, `TotalsSection.css`, `NoteSection.css`, `ActionFooter.css`, `ImportItemRow.css`, `ImportItemsTable.css`

## Rollback

Restore the modified files and deleted files from the Phase 5 backup. Re-enable `useRefactoredImportLayout` if the V1 branch is still needed. Because the import screen is complex, rollback is recommended if any manual test flow fails.
