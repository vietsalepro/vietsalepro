# Phase 7.4 — ImportGoods Dead Code Cleanup

## Tóm tắt

Đã thực hiện Phase 7.4 theo `openspec/changes/voucher-form-component-system-plan-a/tasks.md` section 15.

Dọn dẹp các component/CSS cũ của import-goods không còn được import sau khi các phase trước đã thay thế bằng Voucher Form System.

## Thay đổi chính

### 1. Xóa dead code

- Xóa `components/import-goods/ImportItemRow.tsx`
- Xóa `components/import-goods/ImportItemRow.css`

`ImportProductSearch.tsx/.css` và `ImportItemsTable.tsx/.css` đã được xóa ở Phase 7.2a nên không còn tồn tại.

### 2. Kiểm chứng không còn import

- Grep toàn project: không còn import `ImportProductSearch|ImportItemsTable|ImportItemRow` trong source code (chỉ còn reference trong docs/handoff/spec).
- Grep riêng trong `pages/` và `components/` (trừ docs): không còn match nào.

### 3. `LotExpiryPopover` được giữ nguyên

- `components/import-goods/LotExpiryPopover.tsx` và `.css` vẫn tồn tại.
- Không bị xóa, không bị sửa đổi.
- Audit trước đã xác nhận `LotExpiryPopover` không được `pages/ImportGoods.tsx` import; logic lô/HSD đã chuyển inline vào `ImportItemRow` (giờ là `VoucherTableRow`).

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS
- `openspec validate --all --json`: PASS (4/4 items passed)
- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase7_4_20260703_145834`

## Manual test

- Manual test full create import flow chưa chạy được do ứng dụng yêu cầu đăng nhập; không có credentials.
- Cần cung cấp credentials để chạy end-to-end ở session tiếp theo.

## Notes

- Các component trong `components/import-goods/ImportSidebar/` vẫn tồn tại vì chưa kiểm tra xem có còn import hay không trong phase này. Phase 7.1 đã refactor sidebar inline vào `pages/ImportGoods.tsx`, nhưng các file `ImportSidebar/` chưa được xóa trong phase này. Nếu cần, có thể xử lý trong phase cleanup tổng thể sau cùng.
- `components/import-goods/LotExpiryPopover.tsx/.css` vẫn còn dùng cho mục đích bảo toàn (preserved) theo acceptance criteria của kế hoạch Voucher Form Component System.

## Next phase

- Phase 8.1 — InventoryCount Form View Refactor (hoặc tiếp tục các phase còn lại trong kế hoạch).
