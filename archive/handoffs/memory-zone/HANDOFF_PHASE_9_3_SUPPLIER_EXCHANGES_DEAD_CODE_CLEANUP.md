# Phase 9.3 — SupplierExchanges Dead Code Cleanup

## Tóm tắt

Thực hiện Phase 9.3 theo `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md` section 3.12 và `openspec/changes/voucher-form-component-system-plan-a/tasks.md` section 21.

Dead code cleanup cho màn **Đổi trả hàng nhà cung cấp**: grep audit các component cũ chỉ phục vụ create form, xác nhận không còn import, xóa file nếu có.

## Kết quả audit

### 1. `components/supplier-exchanges/` không tồn tại

- `find_file_by_name components/supplier-exchanges/**/*` trả về `No files found`.
- `find_file_by_name components/**/*exchange*` trả về `No files found`.
- Không có thư mục `components/supplier-exchanges/` trên đĩa.

### 2. `ExchangeForm.tsx` không được tạo

- Phase 9.1 đã quyết định **không tách** create form thành `components/supplier-exchanges/ExchangeForm.tsx` (xem `HANDOFF_PHASE_9_1_SUPPLIER_EXCHANGES_CREATE_FORM.md`).
- `tasks.md` section 19, task 19.5 vẫn để `[ ]` (chưa tạo), phù hợp với quyết định trên.
- Grep `ExchangeForm|supplier-exchanges` trong toàn bộ source (ngoại trừ docs/plan/handoff) không tìm thấy import nào từ `components/supplier-exchanges/`.

### 3. Không còn import component cũ chỉ phục vụ create form

- `pages/SupplierExchanges.tsx` chỉ import các component sau:
  - `lucide-react`: tất cả icon đều được sử dụng (grep xác nhận).
  - `../components/DataGrid`, `../components/StatusBadge`, `../components/ActionButton`, `../components/BatchActionsBar`, `../components/shared/StatsRow` — đều đang dùng cho list view.
  - `../components/voucher-form`: `VoucherFormLayout`, `VoucherSection`, `VoucherSectionHeader`, `VoucherSectionContent`, `VoucherField`, `VoucherInput`, `VoucherButton`, `VoucherSelect`, `VoucherTextarea`, `VoucherSearch`, `VoucherProductDropdown`, `VoucherEmpty`, `VoucherTotals`, `VoucherBanner` — đều được sử dụng trong create wizard hoặc list view.
  - `../utils/printSupplierExchange` — đang dùng.
- Không phát hiện import cũ create-form-only nào cần xóa.

### 4. Không có file CSS/component cũ cần xóa

- `pages/SupplierExchanges.css` vẫn được import bởi `pages/SupplierExchanges.tsx`, giữ nguyên cho list view + wizard styling.
- Không có file CSS/component rời nào thuộc về create form cũ để xóa.

## Thay đổi file

- `openspec/changes/voucher-form-component-system-plan-a/tasks.md`: cập nhật checkboxes section 21 (21.1–21.5 done).
- Không xóa file nào khác.

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS
- `openspec validate --all --json`: PASS (4/4 items passed)

## Manual test

- Chưa chạy được end-to-end do ứng dụng yêu cầu đăng nhập; không có credentials.
- Task 21.6 vẫn để `[ ]` trong `tasks.md` cho session có credentials thực hiện sau.

## Next phase

- **Phase 10.1a — Dead Code Cleanup: import-goods imports & grep audit** theo `tasks.md` section 22.
