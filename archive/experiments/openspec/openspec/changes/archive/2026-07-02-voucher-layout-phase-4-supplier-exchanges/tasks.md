## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item
- [x] 0.2 Confirm Phase 1 (`banner` prop) and Phase 3a (`FormTextarea`) are complete
- [x] 0.3 Confirm `npm run lint` pass
- [x] 0.4 Confirm `npm run build` pass

## 1. Phân tích create form hiện tại (Phase 4a)

- [x] 1.1 Check `Test-Path components/supplier-exchanges`
- [x] 1.2 Read `pages/SupplierExchanges.tsx` create view (`view === 'create'`)
- [x] 1.3 Identify current alert banner location
- [x] 1.4 Identify current sidebar sections and whether they use `SectionBox`
- [x] 1.5 Identify page-level wrapper/container CSS
- [x] 1.6 List required changes

## 2. Chuẩn hóa create form và xử lý alert banner (Phase 4b)

- [x] 2.1 Move alert banner content into `VoucherFormLayout` `banner` prop
- [x] 2.2 Ensure `title` and `onBack` props are used; remove any inline create-form header
- [x] 2.3 Remove or neutralize any create-form flex/grid wrapper around `VoucherFormLayout`
- [x] 2.4 Handle `.supplier-exchanges-page` padding for create view (Option A: zero padding for create view)
- [x] 2.5 Run `npm run lint`

## 3. Refactor sidebar sections của SupplierExchanges (Phase 4c)

- [x] 3.1 Decide 2 `SectionBox` blocks vs 1 box (record decision; recommend 2)
- [x] 3.2 Create/refactor **Thông tin phiếu** section: `SectionBox` + `SectionHeader title="Thông tin phiếu"` + `SectionContent`
- [x] 3.3 Create/refactor **Tổng kết** section: `SectionBox` + `SectionHeader title="Tổng kết"` + `SectionContent` with `SummaryRow`
- [x] 3.4 Use `TextInput` for readonly NCC and phiếu nhập gốc
- [x] 3.5 Use `SelectInput` for Lý do đổi trả (no label)
- [x] 3.6 Use `FormTextarea` for Ghi chú
- [x] 3.7 Use `SummaryRow` for Tổng giá trị trả, Tổng giá trị nhận, Chênh lệch công nợ
- [x] 3.8 Run `npm run lint`

## 4. Verify SupplierExchanges (Phase 4d)

- [x] 4.1 Run `npm run lint`
- [x] 4.2 Run `npm run build`
- [x] 4.3 Manual test: mở Đối tác → Đổi trả hàng NCC → tạo phiếu
- [x] 4.4 Verify banner position between header and body
- [x] 4.5 Verify sidebar sections visual
- [x] 4.6 Verify `SelectInput` has no label whitespace
- [x] 4.7 Select NCC, phiếu nhập gốc, lô, nhập SL đổi/SL nhận lại
- [x] 4.8 Hoàn thành phiếu
- [x] 4.9 Check responsive wizard UI on tablet/mobile

## 5. Rà soát `pages/SupplierExchanges.css` (Phase 4e)

- [x] 5.1 Classify CSS into list view, detail view, modal, create form layout
- [x] 5.2 Remove create-form layout classes (`.supplier-exchanges-warning`, `.supplier-exchanges-sidebar-section`, `.supplier-exchanges-textarea`, etc.)
- [x] 5.3 Update `.supplier-exchanges-page` padding if Option A was chosen
- [x] 5.4 Keep list view, detail view, modal CSS
- [x] 5.5 Run `npm run lint`

## 6. Cleanup & Verification

- [x] 6.1 Confirm `VoucherFormLayout` `banner` prop is used
- [x] 6.2 Confirm sidebar sections use `SectionBox`
- [x] 6.3 Confirm `pages/SupplierExchanges.css` has no create-form layout CSS
- [x] 6.4 Run `npm run lint`
- [x] 6.5 Run `npm run build`

## Acceptance Criteria

- [x] Alert banner is passed via `banner` prop
- [x] Create form does not define its own layout
- [x] Sidebar sections use `SectionBox` + `SectionHeader` + `SectionContent`
- [x] 1-box vs 2-box decision is recorded
- [x] `SelectInput` has no label whitespace for Lý do đổi trả
- [x] `FormTextarea` is used for Ghi chú
- [x] `pages/SupplierExchanges.css` has no create-form layout CSS
- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Manual flow đổi trả hàng NCC pass
- [x] Responsive wizard UI pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase4_<YYYYMMDD_HHMMSS>`
- Files to restore: `pages/SupplierExchanges.tsx`, `pages/SupplierExchanges.css`
- Rollback trigger: banner misalignment, lint/build failure, wizard UI regression, or broken supplier exchange flow
