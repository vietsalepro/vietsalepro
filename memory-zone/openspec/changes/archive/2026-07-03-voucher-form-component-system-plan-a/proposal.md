# PLAN A — Voucher Form Component System: Master Implementation Plan

## Why

`VoucherFormLayout` hiện tại chỉ là layout container. Bốn màn phiếu (Nhập hàng, Kiểm kê, Xuất hủy, Đổi hàng NCC) mỗi nơi tự viết search, table, button, input, sidebar với style gần giống nhau nhưng không đồng nhất. Muốn đổi một chi tiết UI phải sửa nhiều file. Plan này tập trung hóa toàn bộ UI controls dùng trong form voucher vào `components/voucher-form/`, đảm bảo sửa 1 file thay đổi đồng nhất cả 4 màn hình.

## What Changes

- Tạo hệ thống component `components/voucher-form/` gồm layout, controls, data display, section.
- Di chuyển `VoucherFormLayout.tsx/.css` từ `components/` vào `components/voucher-form/` và cập nhật import path trên 5 file.
- Tạo `VoucherHeader`, `VoucherSidebar`, `VoucherActions`, `VoucherBanner`, `VoucherScrollArea`, `VoucherSection`, `VoucherSectionHeader`, `VoucherSectionContent`.
- Tạo controls: `VoucherButton`, `VoucherInput`, `VoucherTextarea`, `VoucherSelect`, `VoucherLabel`, `VoucherField`, `VoucherToggle`.
- Tạo data components: `VoucherSearch`, `VoucherProductDropdown` (2 mode client/server), `VoucherAddButton`, `VoucherTable`, `VoucherTableRow`, `VoucherEmpty`, `VoucherTotals`.
- Pilot refactor trên `pages/DisposalForm.tsx` (màn đơn giản nhất).
- Rollout lần lượt `pages/ImportGoods.tsx`, `pages/InventoryCount.tsx`, `pages/SupplierExchanges.tsx`.
- Dọn dead code/components/CSS cũ sau khi đã xác nhận không còn import.
- Kiểm thử 4 flow nghiệp vụ, keyboard navigation, responsive, visual regression baseline.

## Scope / Non-Goals

**In scope:**
- UI components & CSS trong `components/voucher-form/`.
- Thay thế UI shell trong 4 màn phiếu bằng components mới.
- Xóa CSS/components cũ sau khi xác nhận không còn import.
- Tái cấu trúc nội bộ `CountFormLayout.tsx` (không xóa file, giữ public props).
- Visual regression baseline trước/sau các phase lớn.

**Out of scope:**
- Business logic, handlers, validation, API calls, state management.
- `types.ts` changes.
- Database / Supabase / migration changes.
- Thay thế `TextInput` / `ActionButton` toàn cục (dùng ở 9 page).
- Refactor `DisposalDetailModal` (thuộc list view `pages/Disposals.tsx`).
- Thay thế `LotExpiryPopover` và `DisposalLotSelector` (vẫn giữ nguyên, chỉ nhúng lại).
- Thêm dependencies mới.

## Capabilities

### New Capabilities
- `voucher-form-layout-system`: Hệ thống layout tập trung cho 4 màn phiếu.
- `voucher-form-controls`: Button, input, textarea, select, label, field, toggle đồng nhất.
- `voucher-form-data-display`: Search shell, product dropdown, table, row, empty, totals.
- `voucher-form-sections`: Card/section layout cho sidebar.
- `voucher-form-product-dropdown`: Autocomplete dropdown hỗ trợ client/server mode + keyboard navigation.

### Modified Capabilities
- `voucher-form-layout`: Chuyển từ single file trong `components/` thành folder `components/voucher-form/`; public props giữ nguyên.

## Impact

**Affected files:**
- `components/VoucherFormLayout.tsx` → `components/voucher-form/VoucherFormLayout.tsx`
- `components/VoucherFormLayout.css` → `components/voucher-form/VoucherFormLayout.css`
- `pages/ImportGoods.tsx`, `pages/ImportGoods.css`
- `pages/InventoryCount.tsx`, `pages/InventoryCount.css`
- `pages/DisposalForm.tsx`, `pages/Disposals.css`
- `pages/SupplierExchanges.tsx`, `pages/SupplierExchanges.css`
- `components/import-goods/*`, `components/inventory-count/*`, `components/disposal-form/*`
- `components/inventory-count/CountFormLayout.tsx`
- `utils/classNames.ts` (mới)
- `components/voucher-form/__demo.tsx` (tạm, xóa ở phase cuối)

**Dead code dự kiến xóa sau confirm:**
- `components/import-goods/ImportProductSearch.tsx/.css`, `ImportItemsTable.tsx/.css`, `ImportItemRow.tsx/.css` (nếu không còn import).
- `components/disposal-form/DisposalProductSearch.tsx`, `DisposalItemsTable.tsx/.css`, `DisposalItemRow.tsx/.css` (nếu không còn import).
- `components/inventory-count/ProductSearchDropdown.tsx/.css`, `CountItemsTable.tsx/.css` (nếu không còn import).
- CSS create form trong `pages/ImportGoods.css`, `pages/InventoryCount.css`, `pages/Disposals.css`, `pages/SupplierExchanges.css`.

**Verification steps:**
- `npm run lint` sau mỗi sub-phase.
- `npm run build` sau mỗi phase lớn (1, 3, 4, 6, 7.3, 8.2, 9.2, 10.3).
- Manual test 4 flow nghiệp vụ ở phase cuối.
- Visual regression baseline trước/sau phase lớn.

## Rollback

Backup toàn bộ project folder bằng `Copy-Item` trước mỗi phase lớn; restore nếu lint/build fail hoặc manual test fail không sửa được trong 30 phút.
