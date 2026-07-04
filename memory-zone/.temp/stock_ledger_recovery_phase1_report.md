# Báo cáo Root Cause — Stock Ledger Recovery Phase 1

**Ngày:** 2026-07-01  
**Project:** QLBH (`rsialbfjswnrkzcxarnj`)  
**Mục tiêu:** Xác định nguyên nhân 5 SP có lô bị lệch giữa `products.quantity` và `SUM(stock_movements.actual_qty)`.

---

## 1. Tóm tắt

Sau Phase 11 (Ledger Backfill), verify trên DB thật phát hiện **5 sản phẩm có lô (`has_lots = TRUE`) bị lệch** giữa tồn kho tổng (`products.quantity`) và tổng ledger (`stock_movements`).

- Tổng số dòng `stock_movements`: **445**
- Dòng có `lot_id = NULL`: **411** (gần như toàn bộ là SP không lô)
- Dòng `lot_id = NULL` thuộc SP có lô: **13 dòng** → chính là nguyên nhân lệch
- Dòng `OPENING-BALANCE`: **195**

**Nguyên nhân gốc:**
1. `backfill_stock_ledger()` (migration Phase 5) khi không tìm được lô khớp (do dữ liệu cũ thiếu `lot_id`, `lot_code` hoặc expiry không khớp) đã ghi `lot_id = NULL` cho SP có lô.
2. Cách tính `qty_after_transaction` trong backfill dùng balance từ `stock_movements` với điều kiện `(lot_id IS NULL OR lot_id = v_rec.lot_id)`, làm nhiễu lũy kế per lot.
3. Các dòng điều chỉnh kiểm kê (`Stock Reconciliation`) và một số dòng nhập/trả/bán/hủy bị gán sai lô hoặc `lot_id = NULL`.

---

## 2. 5 sản phẩm lệch chi tiết

| ID | Mã SP | Tên | Lot ID | Tồn lô | `products.quantity` | `SUM(stock_movements)` | Lệch |
|---|---|---|---|---:|---:|---:|---:|
| `P1772330890890_v3dwta2re` | `8936142671759` | Sữa Bột Metacare Opti 1+ 900g | `L1772605971178_etheh` | 18 | 18 | 8 | **+10** |
| `P1772330890891_4y94tlrdc` | `8938501434012` | Sữa Chua Uống Có Đường Yakult 80ml | `lot_P1772330890891_4y94tlrdc_002_1782023248`, `lot_P1772330890891_4y94tlrdc_001_1782729414`, `lot_P1772330890891_4y94tlrdc_003_1782651193` | 17 | 17 | 25 | **-8** |
| `P1772330890890_2mf464zw6` | `8710428009791` | Sữa Abbott Glucerna 850g | `L1772717609859_lc1u2` | 2 | 2 | 1 | **+1** |
| `P1772330890890_ekw2oipdi` | `850063183130` | Tả Dán Kiiubee Premium Size Nb 60 | `lot_P1772330890890_ekw2oipdi_002_1781958534` | 3 | 3 | 4 | **-1** |
| `P1772330890890_axfeeicic` | `8886451071378` | Sữa Bột Abbott Ensure Gold Vani 400g | `L1772717609859_648zl` | 2 | 2 | 1 | **+1** |

*Lưu ý: Tổng `SUM(stock_movements.actual_qty)` ở đây là tổng product-level, bao gồm cả dòng `lot_id = NULL`.*

---

## 3. Các dòng `stock_movements` có `lot_id = NULL` cho SP có lô

| Mã SP | Tên | Voucher Type | Voucher No | Ngày | `actual_qty` | `qty_after_transaction` | Lý do |
|---|---|---|---|---:|---:|---:|---|
| `8710428009791` | Sữa Abbott Glucerna | Stock Reconciliation | `CK1772511035389` | 2026-03-03 | -1 | -1 | Backfill kiểm kê (lot_id = NULL) |
| `8886451071378` | Sữa Abbott Ensure Gold | Stock Reconciliation | `CK1772511035389` | 2026-03-03 | -1 | -1 | Backfill kiểm kê (lot_id = NULL) |
| `850063183130` | Tả Dán Kiiubee | Stock Reconciliation | `fa3e9459-e20c-4ce8-b631-15e0281a5bf1` | 2026-06-20 | -1 | -1 | Backfill kiểm kê (lot_id = NULL) |
| `850063183130` | Tả Dán Kiiubee | Purchase Receipt | `PN0000002` | 2026-06-20 | +1 | 0 | Backfill nhập hàng (lot_id = NULL) |
| `850063183130` | Tả Dán Kiiubee | Purchase Receipt | `PN-20260620-001` | 2026-06-20 | +1 | 1 | Backfill nhập hàng (lot_id = NULL) |
| `8936142671759` | Sữa Metacare | Stock Reconciliation | `CK1772511035389` | 2026-03-03 | +2 | 2 | Backfill kiểm kê (lot_id = NULL) |
| `8936142671759` | Sữa Metacare | Stock Reconciliation | `CK1772608332081` | 2026-03-04 | -5 | -4 | Backfill kiểm kê (lot_id = NULL) |
| `8936142671759` | Sữa Metacare | Stock Reconciliation | `CK1772628787865` | 2026-03-04 | -7 | -11 | Backfill kiểm kê (lot_id = NULL) |
| `8938501434012` | Sữa Yakult | Stock Reconciliation | `CK1772511035389` | 2026-03-03 | +4 | 4 | Backfill kiểm kê (lot_id = NULL) |
| `8938501434012` | Sữa Yakult | Purchase Receipt | `PN-20260621-003` | 2026-06-21 | +1 | 15 | Backfill nhập hàng (lot_id = NULL) |
| `8938501434012` | Sữa Yakult | Purchase Receipt | `PN-20260621-001` | 2026-06-21 | +5 | 4 | Backfill nhập hàng (lot_id = NULL) |
| `8938501434012` | Sữa Yakult | Sales Invoice | `ORD1782024430209` | 2026-06-21 | -1 | 14 | Backfill bán hàng (lot_id = NULL) |
| `8938501434012` | Sữa Yakult | Sales Invoice | `ORD1782024474218` | 2026-06-21 | -1 | 13 | Backfill bán hàng (lot_id = NULL) |

*Tất cả đều là dòng backfill từ `migration_phase5_backfill_stock_ledger.sql` với `reason` bắt đầu bằng "Backfill ...".*

---

## 4. Source code gây ra lỗi

### 4.1. Backfill gốc

File: `archive/migration_phase5_backfill_stock_ledger.sql` — function `public.backfill_stock_ledger()`

Các đoạn `LEFT JOIN product_lots ...` và `CASE WHEN pl.id IS NOT NULL THEN ... ELSE NULL END` làm rơi vào `lot_id = NULL` khi:
- Kiểm kê cũ không có `lot_id` hợp lệ trong `inventory_count_items`.
- Nhập hàng đời cũ có `lot_code` / `expiry_date` không khớp `product_lots`.
- Bán/trả/hủy có `lot_id` trỏ đến lô không còn tồn tại.

### 4.2. Cách tính `qty_after_transaction` sai

Trong backfill:
```sql
SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
FROM public.stock_movements
WHERE product_id = v_rec.product_id
  AND (v_rec.lot_id IS NULL OR lot_id = v_rec.lot_id);

v_qty_after := v_balance + v_rec.actual_qty;
```

Vấn đề:
- Khi `v_rec.lot_id IS NULL`, balance tính tổng toàn bộ product-level, không phải lô cụ thể.
- Khi `v_rec.lot_id` có giá trị, balance tính `lot_id = v_rec.lot_id`, nhưng nếu đã có dòng `lot_id = NULL` cùng product thì dòng đó không được cộng, dẫn đến `qty_after_transaction` lệch.
- Đặc biệt, dòng `OPENING-BALANCE` cũng bị ảnh hưởng: ví dụ Ensure Gold `actual_qty=3` nhưng `qty_after_transaction=2` vì balance trước đó bị tính sai.

### 4.3. Các RPC tạo movement hiện tại

File: `archive/migration_phase7c_stock_ledger_complete.sql` — các RPC:
- `process_import_v2`
- `process_checkout`
- `create_return_order`
- `complete_disposal`
- `create_exchange_transaction`
- `complete_inventory_count` / `cancel_inventory_count_rpc`

Các RPC này gọi `insert_stock_ledger_entry()` với `qty_after_transaction` được tính từ `get_product_stock_balance()` (đọc từ `product_lots.quantity` / `products.quantity`) thay vì lũy kế từ `stock_movements`. Điều này đúng với hiện tại, nhưng sẽ vẫn sai nếu `product_lots.quantity` chưa khớp với ledger sau backfill.

---

## 5. Backup đã tạo

**Phương án:** Tạo bảng backup trong DB.  
**Thời điểm:** 2026-07-01 09:05:15 UTC  
**Bảng backup:**
- `backup_stock_movements_pre_phase2` — 445 dòng
- `backup_product_lots_pre_phase2` — 9 dòng
- `backup_products_pre_phase2` — 197 dòng
- `backup_stock_ledger_meta` — metadata backup

---

## 6. Phác thảo giải pháp Phase 2

Theo `PHASED_FIX_STOCK_LEDGER_RECOVERY.md` — **Option A** đã chọn: xóa các dòng điều chỉnh `lot_id = NULL` và chạy lại backfill đúng theo lô.

### 6.1. Các bước thiết kế `backfill_stock_ledger_v2()`

1. **Truncate `stock_movements` trong transaction** (sau khi đã backup đầy đủ).
2. **Backfill lại tất cả giao dịch** với logic lot:
   - Nhập: gán `lot_id` từ `product_lots` nếu tìm thấy, nếu không thì tạo lô mới hoặc gán vào lô duy nhất của SP có lô.
   - Bán/trả/hủy/đổi: ưu tiên `lot_id` từ `order_items`/`return_order_items`/`disposal_items`, nếu không có thì dùng FIFO/HSD.
   - Kiểm kê: phân bổ chênh lệch vào các lô hiện có theo FIFO/HSD (giảm từ lô cũ nhất/HSD gần nhất, tăng vào lô mới nhất hoặc tạo lô mới).
3. **Tính `qty_after_transaction` lũy kế đúng per `(product_id, lot_id)`**:
   - Sắp xếp theo `posting_date`, `created_at`, `voucher_type` order.
   - Cộng dồn `actual_qty` theo từng lô.
   - Không dùng `get_product_stock_balance()` trong backfill; chỉ dùng lũy kế từ `stock_movements`.
4. **Tạo dòng `OPENING-BALANCE`** chỉ khi cần thiết để khớp `product_lots.quantity` / `products.quantity`.
5. **Đảm bảo invariant:** `products.quantity = SUM(product_lots.quantity) = SUM(stock_movements.actual_qty)`.

### 6.2. Các file SSOT cần dùng

- `archive/migration_phase5_backfill_stock_ledger.sql` — tham khảo logic cũ, viết `migration_phase2_backfill_stock_ledger_v2.sql` mới.
- `archive/migration_phase7c_stock_ledger_complete.sql` — các RPC tạo movement.
- `.temp/phase7c_sections/09_get_stock_ledger.sql`, `10_get_stock_balance.sql` — kiểm tra sau backfill.

### 6.3. Test plan

- Chạy `backfill_stock_ledger_v2()` trên bản sao DB (nếu có) hoặc test trực tiếp trong transaction có rollback.
- Verify 5 SP lệch trên = 0 mismatch.
- Verify `get_stock_balance()` không trả về số âm.
- Verify `get_stock_ledger()` trả đúng lũy kế.
- Chạy `npm run lint` / `npm run build` PASS (Phase 2 không sửa frontend).

---

## 7. Kết luận

Lỗi lệch tồn kho xuất phát từ **backfill Phase 5 ghi `lot_id = NULL` cho SP có lô** và **cách tính `qty_after_transaction` không lũy kế đúng per lot**. Cần thiết kế `backfill_stock_ledger_v2()` để xóa sạch và rebuild ledger đúng theo lô, đảm bảo invariant dài hạn.
