# Phase 7.1 — ImportGoods Sidebar Refactor

## Tóm tắt

Đã refactor phần sidebar của `pages/ImportGoods.tsx` sang Voucher Form Component System theo PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md section 3.8 Phase 7.1 và tasks.md section 11.

## Thay đổi chính

### 1. `pages/ImportGoods.tsx` — Sidebar JSX

- Thay import các component cũ (`SupplierSection`, `ReceiptInfoSection`, `TotalsSection`, `NoteSection`, `ActionFooter`) bằng import từ `components/voucher-form`:
  - `VoucherSection`, `VoucherSectionHeader`, `VoucherSectionContent`
  - `VoucherField`, `VoucherInput`, `VoucherSelect`, `VoucherTextarea`
  - `VoucherButton`, `VoucherTotals`, `VoucherEmpty`
- Thêm import icon `Save`, `Phone` từ `lucide-react`.

### 2. SupplierSection — giữ combobox logic, thay vỏ input/button

- Chuyển state `supplierQuery`, `isPickingSupplier`, `supplierContainerRef` lên `pages/ImportGoods.tsx`.
- Giữ nguyên logic filter NCC, click-outside, đồng bộ khi parent xóa NCC.
- Thay `TextInput`/`ActionButton` bằng `VoucherInput`/`VoucherButton`.
- Dropdown kết quả dùng `VoucherEmpty` cho trạng thái rỗng.
- Card NCC đã chọn và dòng "Công nợ hiện tại" dùng Tailwind utility classes.

### 3. ReceiptInfoSection

- Dùng `VoucherSection` + `VoucherSectionHeader` + `VoucherSectionContent`.
- 3 field `Mã phiếu nhập`, `Số hóa đơn đầu vào`, `Ngày giờ nhập` được bọc trong `VoucherField` và dùng `VoucherInput`.

### 4. TotalsSection — giữ logic tính toán trong page

- Di chuyển toàn bộ logic tính `needToPay`, `debtDelta`, auto-fill `paidAmount` từ `TotalsSection` lên `pages/ImportGoods.tsx`.
- `VoucherTotals` chỉ là display component; hiển thị 6 dòng: Tổng tiền hàng, Phí vận chuyển, Giảm giá, Cần trả NCC, Tiền trả NCC, Tính vào công nợ.
- Các dòng input (ship/discount/paid) dùng `VoucherInput` size `sm` bên trong `VoucherTotals`.

### 5. NoteSection

- Dùng `VoucherSection` + `VoucherSectionHeader` + `VoucherSectionContent` + `VoucherField` + `VoucherTextarea`.
- Bỏ prop `resize="none"` vì `VoucherTextarea` không hỗ trợ.

### 6. ActionFooter

- Thay `ActionFooter` bằng 2 `VoucherButton` truyền qua `actions` prop của `VoucherFormLayout` (được `VoucherActions` wrap sẵn).
- Giữ nguyên logic disable khi không có item, loading, label "Hoàn thành"/"Cập nhật".

### 7. `pages/ImportGoods.css`

- Không còn CSS riêng nào chỉ phục vụ create-form sidebar (đã nằm trong các component cũ).
- Xóa class `.ig-page-container--padded` không còn dùng (được xác nhận trong audit Phase 0.1).

### 8. `openspec/changes/voucher-form-component-system-plan-a/tasks.md`

- Đánh dấu các task Phase 7.1 đã hoàn thành.

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS
- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase7_1_20260703_...`

## Manual test

- Chạy dev server trên `http://localhost:3001/import/create` (port 3001 do 3000 đang bận).
- Đăng nhập bằng credentials đã cung cấp.
- Tạo phiếu nhập test:
  - Chọn NCC: FRISO CÔ GÁI HÀ LAN.
  - Thêm sản phẩm: Lốc Sữa Nuvi Có Thạch Hương Cam 170ml, số lượng 2.
  - Nhập phí vận chuyển: 10.000 ₫, giảm giá: 5.000 ₫.
  - Tổng tiền hàng: 52.888,64 ₫; Cần trả NCC: 57.888,64 ₫.
  - Auto-fill tiền trả NCC: 57.888,64 ₫ → Tính vào công nợ: "Đã thanh toán đủ".
  - Thử đổi tiền trả NCC = 50.000 ₫ → Tính vào công nợ: "+ 7.888,64 ₫" (đúng).
  - Khôi phục tiền trả = 57.888,64 ₫, click "Hoàn thành".
- Phiếu nhập `PN-20260703-001` được tạo thành công, status "Hoàn thành", công nợ 0 ₫.
- Tính tiền, công nợ, NCC vẫn đúng sau refactor.

## Notes

- Các component cũ trong `components/import-goods/ImportSidebar/*` vẫn chưa bị xóa; sẽ dọn ở Phase 7.4.
- Phần main area (search, table, item rows) chưa được sửa — để Phase 7.2a/7.2b.
- Không thay đổi logic business, API, handlers, hoặc `LotExpiryPopover`.

## Next phase

- Phase 7.2a — ImportGoods Main Area: Search + Table Shell.
