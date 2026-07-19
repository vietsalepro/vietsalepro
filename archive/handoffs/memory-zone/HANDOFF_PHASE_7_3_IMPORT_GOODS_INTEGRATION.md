# Phase 7.3 — ImportGoods Page Integration & Cleanup

## Tóm tắt

Đã thực hiện Phase 7.3 theo PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md section 3.8 Phase 7.3 và tasks.md section 14.

Vì Phase 7.2b (`ImportItemRow` → `VoucherTableRow`) chưa được hoàn thành ở session trước, nên trong session này tôi đã thực hiện luôn cả việc thay thế `ImportItemRow` bằng `VoucherTableRow` để có thể xóa import components cũ khỏi `pages/ImportGoods.tsx` mà không làm page bị lỗi.

## Thay đổi chính

### 1. `pages/ImportGoods.tsx` — Imports cleanup

- Xóa import `ImportItemRow` từ `../components/import-goods/ImportItemRow`.
- Thêm `VoucherTableRow` vào import từ `components/voucher-form`.
- Xóa `VoucherSelect` khỏi import (không dùng trong page).
- Xóa các icon `Banknote`, `History`, `Clock` khỏi import lucide-react (không dùng).
- Thêm `Minus` vào import lucide-react (dùng cho stepper số lượng trong inline row).
- Giữ nguyên các component `ActionButton`/`DataGrid`/`AdvancedFilterPanel` phục vụ list view (không thuộc scope create form).

### 2. Item rows — `ImportItemRow` → `VoucherTableRow` inline

- Thay thế toàn bộ `<ImportItemRow>` bằng `<VoucherTableRow>` với `children` là các `<td>`.
- Giữ nguyên toàn bộ logic:
  - Xóa dòng, hiển thị STT, mã hàng, tên hàng, ĐVT.
  - Số lô với `datalist` gợi ý từ `product.lots`.
  - Hạn sử dụng (date input).
  - Stepper số lượng (± + text input numeric, parse `vi-VN` format).
  - Đơn giá, giảm giá, thành tiền.
- Sử dụng `VoucherInput` và `VoucherButton` thay cho `TextInput`/`ActionButton` trong row, để đồng bộ Voucher Form System.
- Thêm helper `formatQty` / `parseQty` ở đầu component để dùng cho quantity input.

### 3. `pages/ImportGoods.css` — cleanup

- Không còn CSS create form cũ trong file (chỉ còn CSS phục vụ list view / detail view / supplier modal).
- Không cần thêm/xóa gì thêm.

### 4. `openspec/changes/voucher-form-component-system-plan-a/tasks.md`

- Đánh dấu hoàn thành các task Phase 7.2b (do thay `ImportItemRow` trong session này).
- Đánh dấu hoàn thành các task Phase 7.3, trừ manual test chưa chạy được do thiếu credentials.

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS
- `openspec validate --all --json`: PASS
- Grep toàn project: không còn import `ImportProductSearch|ImportItemsTable|ImportItemRow` trong source code.
- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase7_3_20260703_...`

## Manual test

- Dev server chạy tại `http://localhost:3003/` (do port 3000/3001/3002 bận).
- Đăng nhập bị chặn vì không có credentials chính xác; form login vẫn hiển thị với email `admin@example.com`.
- Không thể vào `/import/create` để test end-to-end trong session này.
- Cần cung cấp credentials để chạy manual test full flow ở session tiếp theo.

## Notes

- `components/import-goods/ImportItemRow.tsx` và `.css` vẫn còn tồn tại vật lý; chưa xóa theo đúng quy định Phase 7.3 (không đụng `components/import-goods/*`).
- `components/import-goods/LotExpiryPopover.tsx` và `.css` vẫn được giữ nguyên (Phase 7.4 sẽ xử lý nếu cần).
- Không thay đổi logic nghiệp vụ, API, handlers.
- Một số điểm visual nhỏ có thể khác baseline do chuyển từ `TextInput`/`ActionButton` sang `VoucherInput`/`VoucherButton` (border radius, focus ring, padding). Cần so sánh visual baseline kỹ hơn khi có credentials.

## Next phase

- Phase 7.4 — ImportGoods Dead Code Cleanup: xóa `ImportItemRow.tsx/.css`, `ImportProductSearch.tsx/.css`, `ImportItemsTable.tsx/.css` sau khi grep xác nhận không còn import.
