# Phase 8.1 — InventoryCount Form View Refactor

## Tóm tắt

Đã thực hiện Phase 8.1 theo `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md` section 3.9 và `openspec/changes/voucher-form-component-system-plan-a/tasks.md` section 16.

Refactor giao diện form phiếu kiểm kê (Kiểm kê) từ các component/CSS cũ sang Voucher Form Component System.

## Thay đổi chính

### 1. `components/inventory-count/CountFormLayout.tsx`

- Refactor nội bộ sang `VoucherFormLayout`.
- Sidebar dùng `VoucherSection`, `VoucherSectionHeader`, `VoucherSectionContent`, `VoucherField`, `VoucherInput`, `VoucherTextarea`, `VoucherTotals`.
- Header tìm sản phẩm dùng cặp `VoucherSearch` (qua `VoucherFormLayout`) + `VoucherProductDropdown` (slot dropdown).
- Giữ nguyên public props: `formData`, `setFormData`, `isEditing`, `children`, `onBack`, `actions`.
- Thêm các props tìm sản phẩm tùy chọn: `searchTerm`, `onSearchChange`, `searchResults`, `onSelectProduct`.
- Giữ nguyên `totalDiff`, `totalDiffValue`, `handleDateChange`.
- Giữ logic disabled notes/ngày khi `status === 'completed'`.

### 2. `pages/InventoryCount.tsx`

- Bỏ import `ProductSearchDropdown`.
- Truyền `searchTerm`, `onSearchChange`, `searchResults`, `onSelectProduct` vào `CountFormLayout`.
- `children` của `CountFormLayout` giờ chỉ còn `CountItemsTable`.
- Thay wrapper `<div className="inventory-count-page__form-container">` bằng `<div className="flex-1 min-h-0">`.

### 3. `pages/InventoryCount.css`

- Xóa block `.inventory-count-page__form-container` (create form CSS).

### 4. `openspec/changes/voucher-form-component-system-plan-a/tasks.md`

- Đánh dấu các task 16.1–16.11 đã hoàn thành.

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS
- `openspec validate --all --json`: PASS (4/4 items passed)
- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase8_1_20260703_150150`

## Manual test

- **Baseline visual**: chưa chụp được do ứng dụng yêu cầu đăng nhập; không có credentials.
- **Flow create → save draft → complete**: chưa chạy được do ứng dụng yêu cầu đăng nhập; cần cung cấp credentials để kiểm thử end-to-end ở session tiếp theo.

## Notes

- Các component `CountSidebar/*` (`CountInfoSection`, `CountSummary`, `ExcelImportSection`) và `ProductSearchDropdown.tsx/.css` vẫn còn tồn tại trong repo nhưng không còn được `pages/InventoryCount.tsx` import.
- Sẽ dọn các file dead code này ở **Phase 8.3 — InventoryCount Dead Code Cleanup** sau khi xác nhận toàn bộ tích hợp ổn định.

## Next phase

- **Phase 8.2 — InventoryCount List View & Cleanup**: thay `CountItemsTable` bằng `VoucherTable`, dọn dẹp các CSS/component cũ còn lại.
