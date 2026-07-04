# Phase 8.3 — InventoryCount Dead Code Cleanup

## Tóm tắt

Đã thực hiện Phase 8.3 theo `openspec/changes/voucher-form-component-system-plan-a/tasks.md` section 18.

Dọn dẹp dead code sau khi `InventoryCount` đã được refactor sang Voucher Form Component System ở Phase 8.1 và 8.2.

## Thay đổi chính

### 1. Xóa file demo không còn import

- `components/voucher-form/__demo.tsx`
- `components/voucher-form/__demo.css`

### 2. Xóa components `CountSidebar` không còn import

Sau Phase 8.1, `CountFormLayout.tsx` đã chuyển sang dùng `VoucherSection`, `VoucherSectionHeader`, `VoucherSectionContent`, `VoucherField`, `VoucherInput`, `VoucherTextarea`, `VoucherTotals`, `VoucherProductDropdown` từ `components/voucher-form`. Các component sidebar cũ không còn được import nữa.

Đã xóa toàn bộ thư mục `components/inventory-count/CountSidebar/`:

- `CountSidebar/CountInfoSection.tsx`
- `CountSidebar/CountInfoSection.css`
- `CountSidebar/CountSummary.tsx`
- `CountSidebar/CountSummary.css`
- `CountSidebar/ExcelImportSection.tsx`
- `CountSidebar/ExcelImportSection.css`

### 3. Xác nhận các component cũ đã bị xóa hoàn toàn

- `ProductSearchDropdown` và `CountItemsTable` đã bị xóa từ Phase 8.2; grep không còn thấy import trong source code.
- `CountInfoSection` / `CountSummary` / `ExcelImportSection` / `__demo` không còn import trong source code.

### 4. Giữ nguyên `CountFormLayout.tsx`

- `pages/InventoryCount.tsx` vẫn import `CountFormLayout` từ `../components/inventory-count/CountFormLayout`.
- Không xóa `CountFormLayout.tsx`.

### 5. Cập nhật tiến độ OpenSpec

- `openspec/changes/voucher-form-component-system-plan-a/tasks.md`: đánh dấu task 18.1–18.5 đã hoàn thành.
- Task 18.6 (manual test end-to-end) chưa chạy do ứng dụng yêu cầu đăng nhập; không có credentials.

## Verification

- `grep` không còn import `ProductSearchDropdown`, `CountItemsTable`, `CountInfoSection`, `CountSummary`, `ExcelImportSection`, `__demo.tsx`/`__demo.css` trong source code (chỉ còn trong docs/plans/handoff).
- `npm run lint`: PASS
- `npm run build`: PASS
- `openspec validate --all --json`: PASS (4/4 items passed)

## Manual test

- Chưa chạy được do ứng dụng yêu cầu đăng nhập; cần cung cấp credentials để kiểm thử end-to-end ở session tiếp theo.

## Notes

- Trong `components/inventory-count/` chỉ còn `CountFormLayout.tsx`.
- Không thay đổi business logic, API, DataGrid, Excel import, scanner.
- Không xóa hoặc sửa các component/page khác ngoài dead code đã liệt kê.

## Next phase

- **Phase 9.1 — SupplierExchanges Create Form Refactor**: refactor phần tạo đổi trả nhà cung cấp sang Voucher Form Component System, giữ wizard flow và không dùng `VoucherTable`/`VoucherTableRow`.
