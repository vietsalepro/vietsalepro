# Phase 9.1 — SupplierExchanges Create Form Refactor

## Tóm tắt

Đã thực hiện Phase 9.1 theo `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md` section 3.10 và `openspec/changes/voucher-form-component-system-plan-a/tasks.md` section 19.

Refactor phần create form của màn **Đổi trả hàng nhà cung cấp** sang Voucher Form Component System, giữ nguyên cấu trúc wizard (tìm sản phẩm → chọn lô → chọn phiếu nhập → danh sách item cards) và không dùng `VoucherTable`/`VoucherTableRow`.

## Quyết định thiết kế

- **Không tách** create form thành `components/supplier-exchanges/ExchangeForm.tsx` vì luồng wizard tích hợp chặt với state/handlers của `pages/SupplierExchanges.tsx`; tách ra sẽ tạo nhiều props trung gian và tăng rủi ro. Giữ nguyên refactor inline trong page.
- Giữ lại CSS cho item cards, lot cards, receipt cards vì đây là cấu trúc wizard đặc thù, không ép thành table template.
- Xóa các CSS section/search/field/locked-banner/actions cũ vì đã được thay thế bởi Voucher components.

## Thay đổi chính

### `pages/SupplierExchanges.tsx`

1. **Cập nhật imports**:
   - Xóa `TextInput`, `SelectInput`, `FormTextarea`, `SummaryRow`, `SectionBox`, `SectionHeader`, `SectionContent`.
   - Thêm `VoucherSection`, `VoucherSectionHeader`, `VoucherSectionContent`, `VoucherField`, `VoucherInput`, `VoucherButton`, `VoucherSelect`, `VoucherTextarea`, `VoucherSearch`, `VoucherProductDropdown`, `VoucherEmpty`, `VoucherTotals`, `VoucherBanner`.

2. **Refactor `voucherMain`**:
   - Các section tìm sản phẩm / chọn lô / chọn phiếu nhập / item cards được bọc trong `VoucherSection` + `VoucherSectionHeader` + `VoucherSectionContent`.
   - Tìm sản phẩm dùng `VoucherSearch` + `VoucherProductDropdown` (server mode, kết quả từ `searchProducts`).
   - Empty state dùng `VoucherEmpty`.
   - Locked receipt banner dùng `VoucherBanner`.

3. **Refactor `voucherSidebar`**:
   - Thay `SectionBox` bằng `VoucherSection`.
   - Các trường NCC, phiếu nhập gốc, ngày đổi trả, lý do, ghi chú được bọc trong `VoucherField` + `VoucherInput`/`VoucherSelect`/`VoucherTextarea`.
   - Tổng kết dùng `VoucherTotals` với highlight cho chênh lệch công nợ.

4. **Refactor `voucherActions` và warning modal**:
   - Thay `ActionButton` bằng `VoucherButton` (Hủy + Hoàn thành, Quay lại + Xác nhận).

5. **Refactor `renderExpandedItem`**:
   - Thay `supplier-exchanges-item-field` + `TextInput` bằng `VoucherField` + `VoucherInput`.
   - Thay `ActionButton` trong header card bằng `VoucherButton`.

### `pages/SupplierExchanges.css`

Xóa các rule CSS cũ chỉ phục vụ create form đã được Voucher components thay thế:
- `.supplier-exchanges-section`
- `.supplier-exchanges-section-title`
- `.supplier-exchanges-search-results`
- `.supplier-exchanges-search-item`
- `.supplier-exchanges-empty-items`
- `.supplier-exchanges-field`
- `.supplier-exchanges-item-field`
- `.supplier-exchanges-locked-banner`
- `.supplier-exchanges-actions`

Giữ lại:
- CSS list view (`supplier-exchanges-page`, `supplier-exchanges-header`, filters, pagination, loading).
- `.supplier-exchanges-page--create` (layout zero padding).
- CSS wizard cards (item cards, lot cards, receipt cards).
- `.supplier-exchanges-modal-*` (warning modal).
- `.se-page-*` (detail view).

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS
- `openspec validate --all --json`: PASS (4/4 items passed)

## Manual test

- Chưa chạy được end-to-end do ứng dụng yêu cầu đăng nhập; không có credentials.
- Cần kiểm thử ở session tiếp theo: chọn NCC, phiếu nhập gốc, lô, item cards → hoàn thành.

## Backup

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase9_1_20260703_152727`

## Next phase

- **Phase 9.2 — SupplierExchanges Wizard Integration**: final pass, cleanup imports, đảm bảo list view + wizard create form vẫn hoạt động đúng.
