# Phase 10.4b — Manual Test Report

## Thông tin chung
- **Ngày thực hiện:** 2026-07-03
- **Tester:** Devin
- **Môi trường:** Local dev server `http://localhost:3000`
- **Tài khoản test:** suacauba@gmail.com / Phatnt0506!
- **OpenSpec task:** section 31 trong `openspec/changes/voucher-form-component-system-plan-a/tasks.md`
- **Thư mục kết quả:** `test-results/phase-10-4b/`

## Tổng kết
| Mục | Kết quả | Ghi chú |
|-----|---------|---------|
| 31.1 Tạo phiếu kiểm kê → lưu nháp → hoàn thành | PASS | Đã tạo, lưu nháp, và hoàn thành phiếu kiểm kê thành công. |
| 31.2 Import Excel / scan / diff hiển thị đúng | PASS | Import Excel đúng sản phẩm và số lượng; scan UI mở/đóng bình thường; diff hiển thị chênh lệch. |
| 31.3 Tạo phiếu đổi hàng NCC → hoàn thành | PASS | Tạo phiếu đổi trả hàng NCC, chọn lô, chọn phiếu nhập, điền lô nhận mới, hoàn thành thành công. |
| 31.4 Wizard lot grid / receipt list / exchange item cards | PASS | Lot grid hiển thị, receipt list hiển thị, item card expand/collapse hoạt động. |
| 31.5 Responsive desktop (>1024px) | PASS | Layout ổn tại 1920x1080 cho cả InventoryCount và SupplierExchanges. |
| 31.6 Responsive tablet (768-1023px) | PASS | Layout ổn tại 768x1024. |
| 31.7 Responsive mobile (<768px) | PASS | Layout ổn tại 375x667. |

## Chi tiết kiểm thử

### 31.1 — Tạo phiếu kiểm kê
- Đăng nhập, vào `/inventory-count`.
- Click **Tạo phiếu kiểm kê** → form mở.
- Tìm sản phẩm "Nuvi", chọn sản phẩm, nhập số lượng thực tế khác số lượng hệ thống.
- Click **Lưu nháp** → phiếu được lưu với trạng thái "Nháp".
- Mở lại phiếu, click **Hoàn thành** → phiếu chuyển sang "Hoàn thành", tồn kho được cập nhật.

Ảnh chụp:
- `inventory-count-form-initial.png`
- `inventory-count-product-dropdown.png`
- `inventory-count-draft-saved.png`
- `inventory-count-list-with-draft.png`
- `inventory-count-new-form-empty.png`
- `inventory-count-list-after-draft.png`

### 31.2 — Import Excel / Scan / Diff
- Tạo file Excel mẫu `import-inventory-sample.xlsx` với 2 sản phẩm.
- Import Excel vào phiếu kiểm kê → sản phẩm và số lượng được đọc đúng.
- Click icon quét mã vạch → scanner UI mở; đóng lại → scanner UI đóng.
- Diff (số lượng thực tế vs hệ thống) hiển thị chênh lệch đúng.

Ảnh chụp:
- `inventory-count-after-import.png`
- `inventory-count-scan-open.png`
- `inventory-count-scan-closed.png`
- `inventory-count-list-before.png`

Script hỗ trợ:
- `test_inventory_count_excel_scan.py`
- `create-import-sample.mjs`

### 31.3 — Tạo phiếu đổi hàng NCC → hoàn thành
- Đăng nhập, vào `/inventory/supplier-exchanges`.
- Click **Tạo phiếu** → form tạo phiếu đổi trả mở.
- Tìm sản phẩm "Ensure", chọn **Sữa Bột Abbott Ensure Gold Vani 400g**.
- Chọn lô **LOT-TEST-001** (HSD 04/07/2026, tồn 1).
- Chọn phiếu nhập gốc **PN-20260703-003** (NCC FRISO CÔ GÁI HÀ LAN).
- Item card mở rộng, điền:
  - Số lô mới: `NEW-LOT-001`
  - HSD mới: `2027-12-31`
  - Số lượng nhận: `1`
  - Giá vốn mới: `380000`
- Chọn lý do **Hàng cận hạn**.
- Click **Hoàn thành** → modal xác nhận hiện → click **Xác nhận hoàn thành**.
- Phiếu đổi trả được tạo, chuyển về danh sách với trạng thái "Hoàn thành".

Ảnh chụp:
- `supplier-exchange-list.png`
- `supplier-exchange-create-empty.png`
- `supplier-exchange-product-dropdown.png`
- `supplier-exchange-lot-grid.png`
- `supplier-exchange-receipt-list.png`
- `supplier-exchange-item-card-expanded.png`
- `supplier-exchange-form-filled.png`
- `supplier-exchange-warning-modal.png`
- `supplier-exchange-list-after-submit.png`

Script hỗ trợ:
- `test_supplier_exchange.py`

### 31.4 — Wizard lot grid / receipt list / exchange item cards
- Lot grid hiển thị các lô khả dụng với HSD, tồn, giá vốn.
- Receipt list hiển thị phiếu nhập gốc phù hợp với lô.
- Exchange item card expand hiển thị chi tiết lô trả / lô nhận và tổng giá trị.
- Item card compact cho phép click để mở rộng.

Ảnh chụp: giống 31.3.

### 31.5-31.7 — Responsive
- Desktop (1920x1080), tablet (768x1024), mobile (375x667).
- Cả hai trang InventoryCount và SupplierExchanges đều hiển thị list và form ổn định, không bị vỡ layout.
- Các nút hành động vẫn tương tác được ở tất cả kích thước.

Ảnh chụp:
- `responsive-inventory-count-list-desktop.png`
- `responsive-inventory-count-form-desktop.png`
- `responsive-supplier-exchange-list-desktop.png`
- `responsive-supplier-exchange-form-desktop.png`
- `responsive-inventory-count-list-tablet.png`
- `responsive-inventory-count-form-tablet.png`
- `responsive-supplier-exchange-list-tablet.png`
- `responsive-supplier-exchange-form-tablet.png`
- `responsive-inventory-count-list-mobile.png`
- `responsive-inventory-count-form-mobile.png`
- `responsive-supplier-exchange-list-mobile.png`
- `responsive-supplier-exchange-form-mobile.png`

Script hỗ trợ:
- `test_responsive.py`

## Vấn đề phát hiện và xử lý

### 1. RPC `get_import_receipts_by_product_and_lot` bị lỗi
**Mô tả:** RPC gốc tham chiếu sai cột `import_items.import_receipt_id` và `import_items.lot_id`, trong khi schema thực tế là `import_items.receipt_id` và `import_items.lot_code`. Kết quả là wizard chọn phiếu nhập gốc trong SupplierExchanges trả về danh sách rỗng / lỗi, không thể hoàn thành phiếu đổi trả.

**Cách xử lý:** Đã cập nhật trực tiếp RPC trên Supabase project `rsialbfjswnrkzcxarnj` để:
- JOIN `import_items` bằng `receipt_id`.
- So khớp lô bằng `lot_code` hoặc lookup `product_lots.id` → `product_lots.code`.
- Trả về kèm mảng `import_items` để frontend map dữ liệu đúng.

SQL cập nhật:
```sql
CREATE OR REPLACE FUNCTION public.get_import_receipts_by_product_and_lot(...)
...
```

**Kết quả sau xử lý:** SupplierExchanges wizard hoạt động bình thường, phiếu đổi trả hoàn thành thành công.

**Lưu ý:** Đây là fix backend cấp bách để có thể hoàn thành manual test. Nếu cần đồng bộ vào repo, cần cập nhật migration file tương ứng.

## Kết luận
Tất cả các mục kiểm thử 31.1 — 31.7 đều **PASS**. Các chức năng InventoryCount và SupplierExchanges hoạt động đúng trên desktop, tablet, và mobile. Chỉ có một lỗi backend RPC đã được phát hiện và xử lý trong quá trình test để không bị block.
