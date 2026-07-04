# Phase 10.2c — Dead Code Cleanup: supplier-exchanges

## Tóm tắt

Thực hiện Phase 10.2c theo section 28 của `openspec/changes/voucher-form-component-system-plan-a/tasks.md`. Sau khi audit, `components/supplier-exchanges/` không tồn tại và không còn import cũ create-form-only nào cần xóa. Sub-phase này chủ yếu xác nhận lại trạng thái, đánh dấu task hoàn thành, và chạy verification.

## Đọc tài liệu đầu vào

- `HANDOFF_PHASE_10_2b_INVENTORY_COUNT_REMOVAL.md` ✅
- `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 28 ✅
- `HANDOFF_PHASE_9_3_SUPPLIER_EXCHANGES_DEAD_CODE_CLEANUP.md` ✅ (tham khảo trạng thái trước đó)

## Kiểm tra thực tế

### 1. `components/supplier-exchanges/` không tồn tại

```
ls components/supplier-exchanges/
# Cannot find path ... because it does not exist.
```

Không có thư mục `components/supplier-exchanges/` trên đĩa. Do đó không có file component con (`ExchangeForm.tsx`, `ExchangeProductSearch.tsx`, `ExchangeItemsTable.tsx`, `ExchangeItemRow.tsx`, `ExchangeSidebar/*`, `ExchangeLotSelector.tsx`, v.v.) để xóa.

### 2. `ExchangeForm.tsx` không được tạo

- Phase 9.1 đã quyết định **không tách** create form thành `components/supplier-exchanges/ExchangeForm.tsx`.
- `tasks.md` section 19, task 19.5 vẫn để `[ ]` (chưa tạo), phù hợp với quyết định trên.
- Grep `ExchangeForm|ExchangeProductSearch|ExchangeItemsTable|ExchangeItemRow|ExchangeSidebar|ExchangeLotSelector` trong toàn bộ source (ngoại trừ docs/plan/handoff) chỉ tìm thấy `interface ExchangeFormItem` trong `pages/SupplierExchanges.tsx` — không tìm thấy import component nào từ `components/supplier-exchanges/`.

### 3. `pages/SupplierExchanges.tsx` không còn import cũ create-form-only

Imports hiện tại của `pages/SupplierExchanges.tsx`:

- `lucide-react`: tất cả icon đều được sử dụng.
- `../components/DataGrid`, `../components/StatusBadge`, `../components/ActionButton`, `../components/BatchActionsBar`, `../components/shared/StatsRow` — đều dùng cho list view.
- `../components/voucher-form`: `VoucherFormLayout`, `VoucherSection`, `VoucherSectionHeader`, `VoucherSectionContent`, `VoucherField`, `VoucherInput`, `VoucherButton`, `VoucherSelect`, `VoucherTextarea`, `VoucherSearch`, `VoucherProductDropdown`, `VoucherEmpty`, `VoucherTotals`, `VoucherBanner` — đều được sử dụng trong create wizard hoặc list view.
- `../utils/printSupplierExchange` — đang dùng.
- `./SupplierExchanges.css` — vẫn được import và sử dụng (các class `supplier-exchanges-*` xuất hiện đồng bộ trong cả TSX và CSS).

Không phát hiện import cũ create-form-only nào cần xóa.

### 4. Không có file CSS/component cũ cần xóa

- `pages/SupplierExchanges.css` vẫn được import bởi `pages/SupplierExchanges.tsx`, giữ nguyên cho list view + wizard styling.
- Không có file CSS/component rời nào thuộc về create form cũ để xóa.

## Hành động đã thực hiện

- Đọc handoff Phase 10.2b và section 28 của `tasks.md`.
- Xác nhận `components/supplier-exchanges/` không tồn tại — không có file cũ nào để xóa.
- Xác nhận `pages/SupplierExchanges.css` vẫn được `pages/SupplierExchanges.tsx` import và sử dụng — giữ nguyên.
- Cập nhật `tasks.md`:
  - Đánh dấu hoàn thành các mục **28.1–28.4**.
- Chạy verification:
  - `npm run lint`: PASS
  - `npm run build`: PASS

## Danh sách file đã xóa

Không có file nào bị xóa trong sub-phase này vì thư mục `components/supplier-exchanges/` không tồn tại và `pages/SupplierExchanges.css` vẫn đang được sử dụng.

## File được bảo toàn

- `pages/SupplierExchanges.tsx` ✅
- `pages/SupplierExchanges.css` ✅ (vẫn đang được `pages/SupplierExchanges.tsx` sử dụng)
- `utils/printSupplierExchange.ts` ✅

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS

## Next phase

Theo `tasks.md`, tiếp tục **Phase 10.3 — Build Verification & Type Fixes** (section 29) hoặc các phase tiếp theo trong chương trình Voucher Form Component System (nếu còn task chưa hoàn thành).
