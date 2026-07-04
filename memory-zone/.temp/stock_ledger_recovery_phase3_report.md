# Báo cáo Phase 3 — Fix Stock Ledger Recovery (Production Deploy)

## Project
- **DB:** Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`)
- **Date:** 2026-07-01
- **Migration SSOT:** `supabase/migration_fix_stock_ledger_phase2_backfill_v2.sql`
- **Executed by:** Devin session theo `HANDOFF_PROMPT_FIX_STOCK_LEDGER_PHASE_3.md`

## Tóm tắt
Phase 3 thực hiện truncate + chạy `backfill_stock_ledger_v2()` trên production DB để rebuild toàn bộ `stock_movements` đúng theo lô, sau khi Phase 2 đã thiết kế, deploy và kiểm thử function trong transaction có `ROLLBACK` (0 mismatch).

Kết quả: **thành công**, 0 mismatch cho tất cả sản phẩm có lô và không có lô, không còn dòng `lot_id = NULL` cho SP có lô, `qty_after_transaction` lũy kế đúng, `get_stock_balance()` không trả số âm, 5 SP lệch từ Phase 1 đã khớp.

## Pre-deploy checklist
| Kiểm tra | Kết quả |
|---|---|
| Backup `backup_stock_movements_pre_phase2` | Tồn tại, 136 kB |
| Backup `backup_product_lots_pre_phase2` | Tồn tại, 16 kB |
| Backup `backup_products_pre_phase2` | Tồn tại, 136 kB |
| Backup `backup_stock_ledger_meta` | Tồn tại, 32 kB |
| `backfill_stock_ledger_v2()` tồn tại với `tmp_id bigserial` | Đã xác nhận |
| `insert_stock_ledger_entry()` guard `IS NOT DISTINCT FROM` | Đã xác nhận |
| Trạng thái trước deploy: 5 SP có lô mismatch, 13 dòng `lot_id = NULL` | Đã xác nhận |

## Deploy steps thực hiện
```sql
BEGIN;
TRUNCATE public.stock_movements;
SELECT public.backfill_stock_ledger_v2();
COMMIT;
```

Kết quả trả về từ `backfill_stock_ledger_v2()`:
```json
{
  "success": true,
  "rows_processed": 446,
  "message": "Backfill completed. Check product/lot totals."
}
```

## Verification results (sau COMMIT)

### 1. SP có lô: `products.quantity = SUM(product_lots.quantity) = SUM(stock_movements.actual_qty)`
```sql
WITH lot_totals AS (
  SELECT product_id, SUM(quantity) AS lot_sum
  FROM public.product_lots GROUP BY product_id
),
movement_totals AS (
  SELECT product_id, SUM(actual_qty) AS movement_sum
  FROM public.stock_movements WHERE is_cancelled = FALSE GROUP BY product_id
)
SELECT p.id, p.name, p.quantity, lt.lot_sum, mt.movement_sum
FROM public.products p
LEFT JOIN lot_totals lt ON lt.product_id = p.id
LEFT JOIN movement_totals mt ON mt.product_id = p.id
WHERE p.has_lots = TRUE
  AND (COALESCE(p.quantity, 0) <> COALESCE(lt.lot_sum, 0)
   OR COALESCE(p.quantity, 0) <> COALESCE(mt.movement_sum, 0)
   OR COALESCE(lt.lot_sum, 0) <> COALESCE(mt.movement_sum, 0));
```
**Result:** 0 rows. ✅

### 2. SP không lô: `products.quantity = SUM(stock_movements.actual_qty)`
```sql
WITH movement_totals AS (
  SELECT product_id, SUM(actual_qty) AS movement_sum
  FROM public.stock_movements WHERE is_cancelled = FALSE GROUP BY product_id
)
SELECT p.id, p.name, p.quantity, mt.movement_sum
FROM public.products p
LEFT JOIN movement_totals mt ON mt.product_id = p.id
WHERE COALESCE(p.has_lots, FALSE) = FALSE
  AND COALESCE(p.quantity, 0) <> COALESCE(mt.movement_sum, 0);
```
**Result:** 0 rows. ✅

### 3. Không còn dòng `lot_id = NULL` cho SP có lô
```sql
SELECT sm.*, p.name
FROM public.stock_movements sm
JOIN public.products p ON p.id = sm.product_id
WHERE p.has_lots = TRUE
  AND sm.lot_id IS NULL
  AND sm.is_cancelled = FALSE;
```
**Result:** 0 rows. ✅

### 4. `qty_after_transaction` lũy kế đúng per lot
> **Lưu ý:** Verify query trong handoff gốc dùng `MAX(qty_after_transaction) <> SUM(actual_qty)` là **không chính xác** khi có dòng `OPENING-BALANCE` lớn ở đầu và sau đó xuất hàng dần — lúc đó `MAX(qty_after_transaction)` có thể xuất hiện ở giữa chuỗi, không bằng tổng cuối cùng. Query đúng phải so sánh `qty_after_transaction` của **dòng cuối cùng** (theo `posting_date` giảm dần) với `SUM(actual_qty)`.

```sql
WITH lot_sums AS (
  SELECT product_id, lot_id, SUM(actual_qty) AS total_actual
  FROM public.stock_movements WHERE is_cancelled = FALSE GROUP BY product_id, lot_id
),
last_movements AS (
  SELECT DISTINCT ON (product_id, lot_id) product_id, lot_id, qty_after_transaction AS last_qty_after
  FROM public.stock_movements WHERE is_cancelled = FALSE
  ORDER BY product_id, lot_id, posting_date DESC, id DESC
)
SELECT ls.product_id, ls.lot_id, ls.total_actual, lm.last_qty_after
FROM lot_sums ls
JOIN last_movements lm ON lm.product_id = ls.product_id AND lm.lot_id IS NOT DISTINCT FROM ls.lot_id
WHERE ls.total_actual <> lm.last_qty_after;
```
**Result:** 0 rows. ✅

### 5. `qty_after_transaction` lũy kế đúng cho SP không lô
```sql
WITH nonlot_sums AS (
  SELECT product_id, SUM(actual_qty) AS total_actual
  FROM public.stock_movements WHERE is_cancelled = FALSE AND lot_id IS NULL GROUP BY product_id
),
last_movements AS (
  SELECT DISTINCT ON (product_id) product_id, qty_after_transaction AS last_qty_after
  FROM public.stock_movements WHERE is_cancelled = FALSE AND lot_id IS NULL
  ORDER BY product_id, posting_date DESC, id DESC
)
SELECT ns.product_id, ns.total_actual, lm.last_qty_after
FROM nonlot_sums ns
JOIN last_movements lm ON lm.product_id = ns.product_id
WHERE ns.total_actual <> lm.last_qty_after;
```
**Result:** 0 rows. ✅

### 6. `get_stock_balance()` không trả số âm
```sql
SELECT * FROM public.get_stock_balance(NULL, NOW()) WHERE quantity < 0;
```
**Result:** 0 rows. ✅

### 7. 5 SP lệch cụ thể đều khớp
```sql
WITH lot_totals AS (
  SELECT product_id, SUM(quantity) AS lot_sum
  FROM public.product_lots GROUP BY product_id
),
movement_totals AS (
  SELECT product_id, SUM(actual_qty) AS movement_sum
  FROM public.stock_movements WHERE is_cancelled = FALSE GROUP BY product_id
)
SELECT p.id, p.name, p.quantity, lt.lot_sum, mt.movement_sum
FROM public.products p
LEFT JOIN lot_totals lt ON lt.product_id = p.id
LEFT JOIN movement_totals mt ON mt.product_id = p.id
WHERE p.id IN (
  'P1772330890890_v3dwta2re',
  'P1772330890891_4y94tlrdc',
  'P1772330890890_2mf464zw6',
  'P1772330890890_axfeeicic',
  'P1772330890890_ekw2oipdi'
);
```
**Result:**
| ID | Tên | quantity | lot_sum | movement_sum |
|---|---|---|---|---|
| P1772330890890_2mf464zw6 | Sữa Abbott Glucerna Dành Cho Người Tiểu Đường 850g | 2 | 2 | 2 |
| P1772330890890_ekw2oipdi | Tả Dán Kiiubee Premium Size Nb 60 Miếng | 3 | 3 | 3 |
| P1772330890890_v3dwta2re | Sữa Bột Metacare Opti 1+ 900g | 18 | 18 | 18 |
| P1772330890891_4y94tlrdc | Sữa Chua Uống Có Đường Yakult 80ml | 17 | 17 | 17 |
| P1772330890890_axfeeicic | Sữa Bột Abbott Ensure Gold Vani 400g | 2 | 2 | 2 |

✅ Tất cả đều khớp.

### Số dòng `stock_movements` sau backfill
```sql
SELECT COUNT(*) FROM public.stock_movements;
```
**Result:** 446 rows (trước đây 445 rows).

## Trạng thái sau deploy
- `stock_movements` đã được rebuild đúng theo lô.
- Invariant `products.quantity = SUM(product_lots.quantity) = SUM(stock_movements.actual_qty WHERE is_cancelled = FALSE)` được khôi phục.
- Backup từ Phase 2 vẫn còn nguyên vẹn (chưa dùng đến rollback plan).

## Rollback plan (không dùng)
Rollback plan trong `HANDOFF_PROMPT_FIX_STOCK_LEDGER_PHASE_3.md` đã được chuẩn bị nhưng **không cần thiết** vì tất cả verify queries đều PASS.

## DoD Phase 3
- [x] `stock_movements` đã được truncate và rebuild bằng `backfill_stock_ledger_v2()`.
- [x] 0 mismatch cho tất cả SP có lô và không có lô.
- [x] Không còn dòng `lot_id = NULL` cho SP có lô.
- [x] `qty_after_transaction` lũy kế đúng per `(product_id, lot_id)`.
- [x] `get_stock_balance()` không trả số âm.
- [x] 5 SP lệch từ Phase 1 đã khớp.
- [x] Báo cáo Phase 3 được lưu trong `.temp/stock_ledger_recovery_phase3_report.md`.
- [x] `AGENTS.md` được cập nhật.

## Notes
- Không chạy lại `archive/migration_phase5_backfill_stock_ledger.sql`.
- Phase 3 đã hoàn thành mục tiêu production deploy. Các phase còn lại (4/5/6) chuyển sang handoff `HANDOFF_PROMPT_FIX_STOCK_LEDGER_PHASE_4_5_6.md`.
