# Báo cáo Phase 2 — Fix Stock Ledger Recovery

## Project
- **DB:** Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`)
- **Date:** 2026-07-01
- **Migration SSOT:** `supabase/migration_fix_stock_ledger_phase2_backfill_v2.sql`

## Tóm tắt
Phase 2 đã thiết kế, deploy và kiểm thử function `backfill_stock_ledger_v2()` dùng để rebuild toàn bộ `stock_movements` đúng theo lô. Function đã chạy thành công trong transaction có `ROLLBACK`, đạt 0 mismatch cho tất cả sản phẩm có lô (bao gồm 5 SP lệch từ Phase 1) và 0 mismatch cho sản phẩm không có lô.

## Các thay đổi chính

### 1. Migration file mới
`supabase/migration_fix_stock_ledger_phase2_backfill_v2.sql` là SSOT duy nhất, chứa:

- **Sửa `insert_stock_ledger_entry()`**: idempotency guard từ
  ```sql
  AND (p_lot_id IS NULL OR lot_id = p_lot_id)
  ```
  sửa thành
  ```sql
  AND lot_id IS NOT DISTINCT FROM p_lot_id
  ```
  để xử lý đúng cả `NULL` và lot_id có giá trị.

- **Helper functions**:
  - `backfill_v2_resolve_lot(p_product_id, p_lot_id, p_lot_code, p_expiry_date, p_strategy)` — chọn lô theo ưu tiên: lot_id gốc nếu hợp lệ, match `lot_code + expiry_date`, lô duy nhất, hoặc FIFO/HSD theo strategy.
  - `backfill_v2_ensure_lot(p_product_id, p_lot_code, p_expiry_date)` — tạo placeholder lot nếu sản phẩm có lô nhưng chưa có lô nào.
  - `backfill_v2_allocate_variance(p_product_id, p_variance)` — phân bổ chênh lệch kiểm kê: dương cộng vào lô FEFO (mới nhất), âm trừ FIFO (cũ nhất) và dump phần dư vào lô FIFO đầu tiên.

- **Function chính `backfill_stock_ledger_v2()`**:
  - Thu thập tất cả giao dịch từ `import_receipts`, `return_orders`, `orders`, `disposals`, `inventory_counts` vào temp table `tmp_stock_backfill_v2`.
  - Gán `lot_id` đúng cho từng dòng, không để `lot_id = NULL` cho SP có lô.
  - Tạo dòng `OPENING-BALANCE` cho mỗi `(product_id, lot_id)` khi `SUM(actual_qty)` chưa khớp `product_lots.quantity` (tương tự cho SP không lô so với `products.quantity`).
  - Sắp xếp deterministic bằng `tmp_id` + `row_number()` và tính `qty_after_transaction` lũy kế per `(product_id, lot_id)`.
  - Insert vào `stock_movements` qua `insert_stock_ledger_entry()`.

### 2. Sửa lỗi phát hiện trong quá trình test
Ban đầu bước gán `line_id` dùng `ctid` trong `UPDATE ... FROM (...) s WHERE t.ctid = s.ctid` không hoạt động đúng vì PostgreSQL thay đổi `ctid` sau khi update. Đã sửa bằng cách thêm cột `tmp_id bigserial PRIMARY KEY` vào temp table và dùng `tmp_id` làm key ổn định cho `row_number()`.

## Kiểm thử trên DB thật (transaction có ROLLBACK)

### Script test
```sql
BEGIN;
SELECT * FROM public.debug_backfill_full_check();
ROLLBACK;
```

Function `debug_backfill_full_check()`:
1. `TRUNCATE public.stock_movements;`
2. `PERFORM public.backfill_stock_ledger_v2();`
3. Kiểm tra 5 điều kiện và trả về các dòng lỗi nếu có:
   - SP có lô không có movement `lot_id = NULL`.
   - SP không lô: `products.quantity = SUM(stock_movements.actual_qty)`.
   - SP có lô: `SUM(product_lots.quantity) = SUM(stock_movements.actual_qty)`.
   - SP có lô: `MAX(qty_after_transaction)` per lot = `product_lots.quantity`.
   - SP không lô: `MAX(qty_after_transaction)` = `products.quantity`.

### Kết quả
- **Số dòng được xử lý:** 446 (tương ứng 446 movement sau khi backfill).
- **Số mismatch:** 0 cho cả 5 điều kiện.
- **5 SP lệch Phase 1** đều khớp.
- **Số dòng `stock_movements` gốc sau khi ROLLBACK:** 445 (không đổi, chứng tỏ ROLLBACK hoạt động đúng).

## Trạng thái deploy
- Migration đã được apply thành công lên Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`) thông qua `apply_migration`.
- Tất cả function (`backfill_stock_ledger_v2`, các helper, `insert_stock_ledger_entry`) đã được cập nhật trên DB thật.
- **Chưa truncate/chạy backfill thực tế trên production** — dữ liệu `stock_movements` gốc vẫn giữ nguyên 445 dòng.

## Notes
- Không chạy lại `archive/migration_phase5_backfill_stock_ledger.sql` (file cũ chỉ để tham khảo).
- Backup production DB từ Phase 1 vẫn còn hiệu lực:
  - `backup_stock_movements_pre_phase2`
  - `backup_product_lots_pre_phase2`
  - `backup_products_pre_phase2`
  - `backup_stock_ledger_meta`
- Phase 3 cần thực hiện truncate + backfill thực tế và verify production.
