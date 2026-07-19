## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item
- [x] 0.2 Confirm Phase 3a (`FormTextarea`) and Phase 3b (`SummaryRow.css`) are complete
- [x] 0.3 Confirm `npm run lint` pass
- [x] 0.4 Confirm `npm run build` pass

## 1. Xóa `ImportFormLayout` dead code (Phase 5a)

- [x] 1.1 Grep `ImportFormLayout` in `components/` and `pages/` — result must be empty (excluding files to delete)
- [x] 1.2 Grep `ImportTopBar` in `components/` and `pages/` — result must be only the dead import in `pages/ImportGoods.tsx` and the definition file
- [x] 1.3 Delete `components/import-goods/ImportFormLayout.tsx`
- [x] 1.4 Delete `components/import-goods/ImportFormLayout.css`
- [x] 1.5 Delete `components/import-goods/ImportTopBar.tsx`
- [x] 1.6 Delete `components/import-goods/ImportTopBar.css`
- [x] 1.7 Run `npm run lint`

## 2. Refactor `ImportSidebar/SupplierSection.tsx` (Phase 5b)

- [x] 2.1 Remove `useRefactoredImportLayout` import
- [x] 2.2 Remove V1 branch
- [x] 2.3 Keep V2 branch using `SectionBox` + `TextInput` + `ActionButton`
- [x] 2.4 Review `SupplierSection.css` — keep content styles, remove layout styles
- [x] 2.5 Run `npm run lint`

## 3. Refactor `ImportSidebar/ReceiptInfoSection.tsx` (Phase 5c)

- [x] 3.1 Remove `useRefactoredImportLayout` import
- [x] 3.2 Remove V1 branch
- [x] 3.3 Keep V2 branch
- [x] 3.4 Review `ReceiptInfoSection.css`
- [x] 3.5 Run `npm run lint`

## 4. Refactor `ImportSidebar/TotalsSection.tsx` (Phase 5d)

- [x] 4.1 Remove `useRefactoredImportLayout` import
- [x] 4.2 Remove V1 branch
- [x] 4.3 Keep V2 branch
- [x] 4.4 **Do not change** `needToPay`, `debtDelta`, or `paidAmount` auto-fill logic
- [x] 4.5 Remove duplicate `.summary-row-value--danger` / `.summary-row-value--success` from `TotalsSection.css`
- [x] 4.6 Remove `.ig-input-sm--w140` from `TotalsSection.css`
- [x] 4.7 Run `npm run lint`

## 5. Refactor `ImportSidebar/NoteSection.tsx` và `ActionFooter.tsx` (Phase 5e)

- [x] 5.1 Remove `useRefactoredImportLayout` import from both files
- [x] 5.2 Remove V1 branch from both files
- [x] 5.3 Keep V2 branch in both files
- [x] 5.4 Replace raw textarea in `NoteSection.tsx` with `<FormTextarea ... />`
- [x] 5.5 Remove `margin-bottom: var(--space-4)` from section CSS if `.voucher-sidebar-content` gap covers it
- [x] 5.6 Confirm `NoteSection.css` no longer defines `.import-note-textarea`
- [x] 5.7 Run `npm run lint`

## 6. Dọn `ImportGoods.css` và rà soát page-level wrapper (Phase 5f)

- [x] 6.1 Classify `pages/ImportGoods.css` classes: create-form layout vs history/detail/filter/pagination/mobile
- [x] 6.2 Remove create-form layout classes (`.ig-layout`, `.ig-create-form`, `.ig-form-header`, `.ig-form-body`, `.ig-section-*`, `.ig-notes-textarea`, etc.)
- [x] 6.3 Grep each class before deleting to avoid removing shared history/search styles
- [x] 6.4 Keep `.ig-history-*`, `.ig-detail-*`, `.ig-receipt-detail`, `.ig-search-*`, `.ig-filter-*`, `.ig-pagination-*`, `.ig-mobile-*`
- [x] 6.5 Review/create-form wrapper in `pages/ImportGoods.tsx` (`<div className="flex-1 min-h-0 flex flex-col">`)
- [x] 6.6 Remove `ImportTopBar` import from `pages/ImportGoods.tsx`
- [x] 6.7 Run `npm run lint`

## 7. Refactor `ImportItemRow.tsx` và `ImportItemsTable.tsx` (Phase 5g)

- [x] 7.1 Remove `useRefactoredImportLayout` import from both files
- [x] 7.2 Remove V1 branch from `ImportItemRow.tsx` (delete button, batch input, expiry input, quantity stepper, price input, discount input)
- [x] 7.3 Keep V2 branch using `ActionButton` + `TextInput`
- [x] 7.4 Remove V1 branch from `ImportItemsTable.tsx` empty state
- [x] 7.5 Keep V2 `EmptyState` component
- [x] 7.6 Note `ig-*` classes used only in V1 for Phase 6c audit
- [x] 7.7 Run `npm run lint`

## 8. Tắt `useRefactoredImportLayout` và verify ImportGoods (Phase 5h)

- [x] 8.1 Confirm prerequisites: 5b, 5c, 5d, 5e, 5g completed
- [x] 8.2 Comment out `useRefactoredImportLayout` in `features.ts`
- [x] 8.3 Run `npm run lint`
- [x] 8.4 Run `npm run build`
- [x] 8.5 Manual test: mở Nhập hàng → tạo phiếu mới → chọn NCC → thêm SP → nhập giá/SL/discount → nhập phí ship, giảm giá phiếu, tiền trả → Lưu tạm → Hoàn thành
- [x] 8.6 Manual test: sửa phiếu draft
- [x] 8.7 Verify tính toán: tổng tiền hàng, cần trả, công nợ
- [x] 8.8 Check responsive

## 9. Cleanup & Verification

- [x] 9.1 Confirm `ImportFormLayout` and `ImportTopBar` files are gone
- [x] 9.2 Confirm no `useRefactoredImportLayout` imports in import components
- [x] 9.3 Confirm `pages/ImportGoods.tsx` has no `ImportTopBar` import
- [x] 9.4 Confirm `TotalsSection.css` has no `.ig-input-sm--w140`
- [x] 9.5 Confirm section CSS has no `margin-bottom` dư thừa
- [x] 9.6 Run `npm run lint`
- [x] 9.7 Run `npm run build`

## Acceptance Criteria

- [x] `ImportFormLayout.tsx/css` and `ImportTopBar.tsx/css` deleted
- [x] `ImportTopBar` import removed from `pages/ImportGoods.tsx`
- [x] `ImportSidebar` sections have no V1 branch
- [x] `ImportItemRow`/`ImportItemsTable` have no V1 branch
- [x] `TotalsSection` logic preserved
- [x] `NoteSection` uses `FormTextarea`
- [x] `TotalsSection.css` has no duplicate accent classes or `.ig-input-sm--w140`
- [x] `pages/ImportGoods.css` has no create-form layout CSS
- [x] `pages/ImportGoods.tsx` does not define its own create-form layout
- [x] `useRefactoredImportLayout` commented out
- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Manual test flow nhập hàng tạo/lưu tạm/hoàn thành/sửa draft pass
- [x] Tính toán tiền và công nợ chính xác

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase5_<YYYYMMDD_HHMMSS>`
- Files to restore: `ImportFormLayout.tsx/css`, `ImportTopBar.tsx/css`, `pages/ImportGoods.tsx`, `pages/ImportGoods.css`, `ImportSidebar/*`, `ImportItemRow.tsx`, `ImportItemsTable.tsx`, `features.ts`
- Rollback trigger: lint/build failure, calculation error, visual regression, or broken import flow
