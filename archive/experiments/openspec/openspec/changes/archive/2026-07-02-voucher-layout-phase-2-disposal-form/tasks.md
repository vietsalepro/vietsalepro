## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item
- [x] 0.2 Confirm `npm run lint` pass
- [x] 0.3 Confirm `npm run build` pass
- [x] 0.4 Review `BASELINE_AUDIT.md` from Phase 0

## 1. Xóa `DisposalFormLayout` dead code (Phase 2a)

- [x] 1.1 Grep `DisposalFormLayout` in `components/` and `pages/` — result must be empty (excluding files to delete)
- [x] 1.2 Delete `components/disposal-form/DisposalFormLayout.tsx`
- [x] 1.3 Delete `components/disposal-form/DisposalFormLayout.css`
- [x] 1.4 Run `npm run lint`

## 2. Refactor `DisposalSidebar/InfoSection.tsx` (Phase 2b)

- [x] 2.1 Remove `useRefactoredDisposalLayout` import
- [x] 2.2 Remove V1 branch (the `return` starting with `<div className="ig-section">`)
- [x] 2.3 Keep V2 branch: `SectionBox` + `SectionHeader title="Thông tin phiếu"` + `SectionContent` with `ModalInfoGrid`
- [x] 2.4 Review `InfoSection.css` — keep content styles, remove layout classes
- [x] 2.5 Run `npm run lint`

## 3. Refactor `DisposalSidebar/ReasonSection.tsx` và `NoteSection.tsx` (Phase 2c)

- [x] 3.1 Remove `useRefactoredDisposalLayout` import from both files
- [x] 3.2 Remove V1 branch from both files
- [x] 3.3 Keep V2 return in both files
- [x] 3.4 Review `ReasonSection.css` and `NoteSection.css` — keep content styles, remove layout classes
- [x] 3.5 Run `npm run lint`

## 4. Refactor `DisposalSidebar/ActionFooter.tsx` và quyết định `StatsSection` (Phase 2d)

- [x] 4.1 Remove `useRefactoredDisposalLayout` import from `ActionFooter.tsx`
- [x] 4.2 Remove V1 branch from `ActionFooter.tsx`
- [x] 4.3 Keep V2 return in `ActionFooter.tsx`
- [x] 4.4 Review `ActionFooter.css`
- [x] 4.5 Record Option A decision: remove `StatsSection` (import removed in Phase 2e, files deleted in Phase 2h)
- [x] 4.6 Confirm `StatsSection.tsx` file is deleted in Phase 2h
- [x] 4.7 Run `npm run lint`

## 5. Rà soát `pages/DisposalForm.tsx` và xóa dead imports (Phase 2e)

- [x] 5.1 Remove `DisposalTopBar` import and usage
- [x] 5.2 Remove `StatsSection` import and usage
- [x] 5.3 Remove or neutralize page-level create-form wrapper (`<div className="min-h-screen bg-[--ig-bg] p-4 md:p-6 flex flex-col">`)
- [x] 5.4 Replace `bg-[--ig-bg]` with standard token or confirm `--ig-bg` remains after Phase 6c
- [x] 5.5 Ensure `VoucherFormLayout` owns layout via `main`, `sidebar`, `actions` slots
- [x] 5.6 Run `npm run lint`

## 6. Refactor `DisposalItemRow.tsx` và `DisposalItemsTable.tsx` (Phase 2f)

- [x] 6.1 Remove `useRefactoredDisposalLayout` import from both files
- [x] 6.2 Remove V1 branch from `DisposalItemRow.tsx` (delete button, quantity input)
- [x] 6.3 Keep V2 branch using `ActionButton` + `TextInput`
- [x] 6.4 Remove V1 branch from `DisposalItemsTable.tsx` empty state
- [x] 6.5 Keep V2 `EmptyState` component
- [x] 6.6 Note `ig-*` classes used only in V1 for Phase 6c audit
- [x] 6.7 Run `npm run lint`

## 7. Rà soát `pages/DisposalForm.css` (Phase 2g)

- [x] 7.1 Check `Test-Path pages/DisposalForm.css`
- [x] 7.2 If file exists, classify classes: create-form layout vs list/detail/modal
- [x] 7.3 Remove create-form layout classes (`.disposal-form-layout`, `.disposal-form-main`, `.disposal-form-sidebar`, `.disposal-form-section`)
- [x] 7.4 Keep CSS for list view, detail view, modal, empty state, pagination
- [x] 7.5 Run `npm run lint`

## 8. Tắt `useRefactoredDisposalLayout` và verify DisposalForm (Phase 2h)

- [x] 8.1 Confirm prerequisites: 2b, 2c, 2d, 2f completed
- [x] 8.2 Comment out `useRefactoredDisposalLayout` in `features.ts`
- [x] 8.3 Run `npm run lint`
- [x] 8.4 Run `npm run build`
- [x] 8.5 Manual test: mở Xuất hủy → tạo phiếu mới → thêm sản phẩm → chọn lý do → nhập ghi chú → Lưu tạm → Hoàn thành
- [x] 8.6 Check responsive < 1024px

## 9. Cleanup & Verification

- [x] 9.1 Confirm `DisposalFormLayout` files are gone
- [x] 9.2 Confirm no `useRefactoredDisposalLayout` imports in disposal components
- [x] 9.3 Confirm `pages/DisposalForm.tsx` has no `DisposalTopBar`/`StatsSection` imports
- [x] 9.4 Confirm `npm run lint` pass
- [x] 9.5 Confirm `npm run build` pass

## Acceptance Criteria

- [x] `DisposalFormLayout.tsx` + `DisposalFormLayout.css` deleted
- [x] `DisposalTopBar`/`StatsSection` imports removed from `pages/DisposalForm.tsx`
- [x] `DisposalSidebar` sections have no V1 branch
- [x] `DisposalItemRow`/`DisposalItemsTable` have no V1 branch
- [x] `useRefactoredDisposalLayout` commented out
- [x] `pages/DisposalForm.tsx` only passes content to `VoucherFormLayout` slots
- [x] `pages/DisposalForm.css` create-form layout CSS removed (if file exists)
- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Manual test flow tạo/lưu tạm/hoàn thành phiếu xuất hủy pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase2_<YYYYMMDD_HHMMSS>`
- Files to restore: `DisposalFormLayout.tsx/css`, `pages/DisposalForm.tsx`, `DisposalSidebar/*`, `DisposalItemRow.tsx`, `DisposalItemsTable.tsx`, `features.ts`, `pages/DisposalForm.css` (if modified)
- Rollback trigger: lint/build failure, functional regression, or visual regression in disposal form
