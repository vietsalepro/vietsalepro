# Phase 8.2 — InventoryCount Search + Table Refactor

## Tóm tắt

Đã thực hiện Phase 8.2 theo `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md` section 3.9 (Phase 8.2) và `openspec/changes/voucher-form-component-system-plan-a/tasks.md` section 17.

Refactor phần search + table của màn Kiểm kê từ các component/CSS cũ sang Voucher Form Component System.

## Thay đổi chính

### 1. `pages/InventoryCount.tsx`

- Bỏ import `CountItemsTable`.
- Thêm import `VoucherButton`, `VoucherEmpty`, `VoucherTable`, `VoucherTableRow` từ `components/voucher-form`.
- Thêm helper `formatQty` / `parseQty` (chuyển từ `CountItemsTable` sang page để dùng trong bảng mới).
- Thay `CountItemsTable` bằng bảng inline sử dụng `VoucherTable` + `VoucherTableRow`:
  - Giữ nguyên cấu trúc cột: xoá, STT, mã hàng, tên hàng, ĐVT, số lô, HSD, hệ thống, thực tế, lệch, giá trị lệch, lý do.
  - Giữ màu chênh lệch tăng (`text-emerald-600`) / giảm (`text-rose-600`) / bằng (`text-slate-400`) cho cả số lượng và giá trị.
  - Giữ badge lô, input mã lô mới, input HSD, input số lượng thực tế, select lý do, cảnh báo lý do "Khớp" khi có chênh lệch.
  - Giữ footer tổng sản phẩm, tổng chênh lệch, giá trị chênh lệch.
  - Giữ empty state với icon `Search`.
- Không đụng đến Excel import, scanner, diff calculation, lot handling — logic nghiệp vụ nguyên vẹn.
- `CountFormLayout` vẫn dùng `VoucherSearch` + `VoucherProductDropdown` (đã refactor ở Phase 8.1), giữ `mode="server"` vì kết quả được lọc client-side (`filteredProductsForCount`) và truyền vào `searchResults`.

### 2. Xóa file không còn dùng

- `components/inventory-count/ProductSearchDropdown.tsx`
- `components/inventory-count/ProductSearchDropdown.css`
- `components/inventory-count/CountItemsTable.tsx`
- `components/inventory-count/CountItemsTable.css`

### 3. `openspec/changes/voucher-form-component-system-plan-a/tasks.md`

- Đánh dấu các task 17.1–17.9 đã hoàn thành.
- Task 17.10 (manual test) chưa chạy do ứng dụng yêu cầu đăng nhập; không có credentials.

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS
- `openspec validate --all --json`: PASS (4/4 items passed)
- Grep không còn import `ProductSearchDropdown` / `CountItemsTable` trong code (chỉ còn trong docs/plans/handoff).

## Manual test

- **Baseline visual**: chưa chụp được do ứng dụng yêu cầu đăng nhập; không có credentials.
- **Flow create → save draft → complete / Excel import / scan / diff display**: chưa chạy được do ứng dụng yêu cầu đăng nhập; cần cung cấp credentials để kiểm thử end-to-end ở session tiếp theo.

## Notes

- `CountFormLayout.tsx` vẫn được giữ nguyên và tiếp tục import.
- Các file dead code của inventory-count đã được xóa; chỉ còn `CountFormLayout.tsx` trong `components/inventory-count/`.
- Các thay đổi chỉ tập trung vào UI layer; không thay đổi business logic, API, DataGrid toàn cục, Excel import, scanner.

## Next phase

- **Phase 8.3 — InventoryCount Dead Code Cleanup**: kiểm tra lại toàn bộ `components/inventory-count/*`, xóa demo `components/voucher-form/__demo.tsx` nếu còn, chạy lint/build cuối.
