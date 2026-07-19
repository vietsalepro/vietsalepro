## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item
- [x] 0.2 Confirm `npm run lint` pass
- [x] 0.3 Confirm `npm run build` pass
- [x] 0.4 Review `BASELINE_AUDIT.md` and Phase 2 handoff

## 1. Tinh chỉnh `CountFormLayout.tsx` và tạo `FormTextarea` (Phase 3a)

- [x] 1.1 Verify `TextInput` multiline support; decide Option B: create dedicated `FormTextarea`
- [x] 1.2 Create `components/FormTextarea.tsx` with props `value`, `onChange`, `placeholder?`, `rows?`, `disabled?`, `className?`, `error?`, `resize?`
- [x] 1.3 Create `components/FormTextarea.css` using design tokens (border, background, focus, disabled, error)
- [x] 1.4 Replace `<textarea className="count-notes-textarea">` in `CountFormLayout.tsx` with `<FormTextarea ... />`
- [x] 1.5 Replace raw textarea in `DisposalSidebar/NoteSection.tsx` with `<FormTextarea ... />`
- [x] 1.6 Replace raw textarea in `ImportSidebar/NoteSection.tsx` with `<FormTextarea ... />`
- [x] 1.7 Remove `import './CountFormLayout.css';` from `CountFormLayout.tsx`
- [x] 1.8 Delete `components/inventory-count/CountFormLayout.css`
- [x] 1.9 Confirm `CountFormLayout.tsx` remains a wrapper around `VoucherFormLayout`
- [x] 1.10 Run `npm run lint`

## 2. Refactor `CountInfoSection.tsx` và `CountSummary.tsx` (Phase 3b)

- [x] 2.1 Replace raw date input in `CountInfoSection.tsx` with `<TextInput type="date" ... />`
- [x] 2.2 Delete `CountInfoSection.css` if it only contains input styles (kept because it still contains other styles)
- [x] 2.3 Check date picker visual on Chrome and Safari
- [x] 2.4 Verify `CountSummary.tsx` already uses `SectionBox` + `SummaryRow`
- [x] 2.5 Create `components/SummaryRow.css` with `.summary-row-value--danger`, `--success`, `--neutral`, `--warning`
- [x] 2.6 Add `import './SummaryRow.css';` to `SummaryRow.tsx`
- [x] 2.7 Migrate `CountSummary.tsx` accent classes to shared classes (`count-summary-value--positive` → `--success`, `--negative` → `--danger`, `--neutral` → `--neutral`)
- [x] 2.8 Delete `CountSummary.css` if it only contains duplicate accent classes (kept because it still contains layout styles)
- [x] 2.9 Run `npm run lint`

## 3. Tắt `useRefactoredCountLayout` và verify InventoryCount (Phase 3c)

- [x] 3.1 Confirm `useRefactoredCountLayout` is not imported anywhere (Phase 0a)
- [x] 3.2 Comment out `useRefactoredCountLayout` in `features.ts`
- [x] 3.3 Run `npm run lint`
- [x] 3.4 Run `npm run build`
- [x] 3.5 Manual test: mở Kiểm kê → tạo phiếu mới → thêm sản phẩm → nhập SL thực tế → kiểm tra chênh lệch → Lưu nháp → Hoàn thành
- [x] 3.6 Check responsive layout

## 4. Rà soát `pages/InventoryCount.css` (Phase 3d)

- [x] 4.1 Grep each class in `pages/InventoryCount.css` to confirm usage
- [x] 4.2 Remove create/edit form layout classes (`.count-layout`, `.count-form-layout`, `.count-layout-main`, `.count-layout-aside`, `.count-notes-textarea`)
- [x] 4.3 Handle `.inventory-count-page__form-container` (keep as simple flex container or remove if redundant)
- [x] 4.4 Keep CSS for list view, filter bar, data grid, empty state, pagination
- [x] 4.5 Run `npm run lint`

## 5. Cleanup & Verification

- [x] 5.1 Confirm `CountFormLayout.css` is deleted
- [x] 5.2 Confirm `FormTextarea` is used in 3 note sections
- [x] 5.3 Confirm `SummaryRow.css` exists and is imported
- [x] 5.4 Confirm `CountInfoSection.css` and `CountSummary.css` are deleted (if applicable; kept because they still contain other styles)
- [x] 5.5 Confirm `pages/InventoryCount.css` has no create/edit form layout CSS
- [x] 5.6 Run `npm run lint`
- [x] 5.7 Run `npm run build`

## Acceptance Criteria

- [x] `CountFormLayout.css` deleted
- [x] `FormTextarea` created and used in InventoryCount, DisposalForm, and ImportGoods
- [x] `SummaryRow.css` created and imported in `SummaryRow.tsx`
- [x] `CountInfoSection` uses `TextInput` for date
- [x] `CountInfoSection.css` deleted (if no other styles; kept because it still contains other styles)
- [x] `CountSummary` uses shared accent classes
- [x] `pages/InventoryCount.css` cleaned of create/edit form layout CSS
- [x] `useRefactoredCountLayout` commented out
- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Manual test flow kiểm kê tạo/lưu nháp/hoàn thành pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase3_<YYYYMMDD_HHMMSS>`
- Files to restore: `CountFormLayout.tsx/css`, `CountInfoSection.tsx/css`, `CountSummary.tsx/css`, `SummaryRow.tsx`, `NoteSection.tsx` files, `pages/InventoryCount.css`, `features.ts`
- Delete if problematic: `FormTextarea.tsx/css`, `SummaryRow.css`
- Rollback trigger: lint/build failure, visual regression in textarea/date/summary, or broken inventory count flow
