# Phase 7.2a — ImportGoods Main Area: Search + Table Shell

## Tóm tắt

Đã refactor phần main area (search + table shell) của `pages/ImportGoods.tsx` sang Voucher Form Component System theo PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md section 3.8 Phase 7.2a và tasks.md section 12.

## Thay đổi chính

### 1. `pages/ImportGoods.tsx` — Imports

- Xóa import `ImportProductSearch` và `ImportItemsTable`.
- Thêm import từ `components/voucher-form`:
  - `VoucherProductDropdown`
  - `VoucherTable`
- Thêm import `ImportItemRow` (vẫn dùng cho đến Phase 7.2b).

### 2. Search area — thay `ImportProductSearch` bằng `VoucherProductDropdown`

- `VoucherFormLayout` đã tự render `VoucherSearch` ở header.
- `searchSlot` giờ là `VoucherProductDropdown` với `mode="client"`.
- `products={localProducts}`, `searchValue={searchTerm}`, `open={isSearchOpen}`.
- `maxItems={8}` để giữ behavior giống dropdown cũ.
- `onSelectProduct` gọi `addToImportList(p)` và reset search.

### 3. Table area — thay `ImportItemsTable` bằng `VoucherTable`

- Dùng `VoucherTable` làm table shell.
- Giữ nguyên `ImportItemRow` cho từng dòng (Phase 7.2b mới thay row UI).
- Khi chưa có item: hiển thị `VoucherEmpty` với icon `Package`.
- Khi có item: render `VoucherTable` với `<thead>` và `<tbody>` (chứa `ImportItemRow`).
- Footer tổng hợp được giữ lại bằng inline Tailwind classes:
  - Mặt hàng, Tổng SL, Giảm giá dòng (nếu > 0), Tổng tiền hàng.

### 4. `LotExpiryPopover`

- Không thay đổi. Popover này chưa được dùng trong main area của ImportGoods; sẽ xử lý ở Phase 7.2b nếu cần.

### 5. Dead code cleanup

- Xóa `components/import-goods/ImportProductSearch.css`.
- Xóa `components/import-goods/ImportItemsTable.css`.
- Xóa `components/import-goods/ImportProductSearch.tsx`.
- Xóa `components/import-goods/ImportItemsTable.tsx`.
- Các file này không còn được import sau khi refactor.

### 6. `openspec/changes/voucher-form-component-system-plan-a/tasks.md`

- Đánh dấu các task Phase 7.2a đã hoàn thành.

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS
- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase7_2a_20260703_144512`

## Manual test

- Chạy dev server trên `http://localhost:3002/import/create`.
- Đăng nhập bằng credentials đã cung cấp.
- Tạo phiếu nhập test:
  - Tìm sản phẩm: gõ `nuvi` → dropdown hiển thị 5 kết quả.
  - Chọn sản phẩm đầu: `Lốc Sữa Nuvi Có Thạch Hương Dâu Ép 170ml` được thêm vào table.
  - Table render đúng header: Xóa, #, Mã hàng, Tên hàng, ĐVT, Số lô, Hạn sử dụng, Số lượng, Đơn giá, Giảm giá, Thành tiền.
  - Tăng số lượng lên 2 → Thành tiền = 55.041,54 ₫; Tổng SL = 2.
  - Chọn NCC: `FRISO CÔ GÁI HÀ LAN`.
  - Nhập phí vận chuyển: 10.000 ₫, giảm giá: 5.000 ₫.
  - Cần trả NCC = 60.041,54 ₫; Tiền trả NCC auto-fill = 60.041,54 ₫; Tính vào công nợ = "Đã thanh toán đủ".
  - Click "Hoàn thành".
- Phiếu nhập `PN-20260703-002` được tạo thành công, status "Hoàn thành", công nợ 0 ₫, hiển thị trong danh sách phiếu nhập.

## Notes

- `ImportItemRow.tsx` và `ImportItemRow.css` vẫn chưa bị xóa; sẽ dọn hoặc thay bằng `VoucherTableRow` ở Phase 7.2b.
- Phần CSS create form cũ trong `pages/ImportGoods.css` chưa được dọn; để Phase 7.3.
- Không thay đổi logic business, API, handlers, hoặc `LotExpiryPopover`.

## Next phase

- Phase 7.2b — ImportGoods Item Rows + Lot Handling Cleanup.
