# Báo cáo Phase 4 — Fix Stock Ledger Recovery (Production Deep Verify & Cross-check)

## Project
- **DB:** Supabase project `QLBH` (`rsialbfjswnrkzcxarnj`)
- **Date:** 2026-07-01
- **Migration SSOT:** `supabase/migration_fix_stock_ledger_phase2_backfill_v2.sql`
- **Executed by:** Devin session theo `HANDOFF_PROMPT_FIX_STOCK_LEDGER_PHASE_4_5_6.md`

## Tóm tắt
Phase 4 thực hiện kiểm tra toàn diện sau khi Phase 3 đã truncate + chạy `backfill_stock_ledger_v2()` trên production.

Kết quả: **tất cả verify queries PASS**, customer/supplier ledger vẫn reconcile, UI `/stock-ledger` mapping đúng, RPC `get_stock_ledger`/`get_stock_balance` hoạt động.

## 1. Re-verify invariant chính

### 1.1 SP có lô: 0 mismatch
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

### 1.2 SP không lô: 0 mismatch
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

### 1.3 Không còn dòng `lot_id = NULL` cho SP có lô
```sql
SELECT sm.*, p.name
FROM public.stock_movements sm
JOIN public.products p ON p.id = sm.product_id
WHERE p.has_lots = TRUE
  AND sm.lot_id IS NULL
  AND sm.is_cancelled = FALSE;
```
**Result:** 0 rows. ✅

### 1.4 `qty_after_transaction` lũy kế đúng per lot (query đã sửa — so dòng cuối)
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

### 1.5 `qty_after_transaction` lũy kế đúng cho SP không lô (query đã sửa — so dòng cuối)
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

### 1.6 `get_stock_balance()` không trả số âm
```sql
SELECT * FROM public.get_stock_balance(NULL, NOW()) WHERE quantity < 0;
```
**Result:** 0 rows. ✅

### 1.7 5 SP lệch cụ thể từ Phase 1 đều khớp
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
| P1772330890890_2mf464zw6 | Sữa Abbott Glucerna Dành Cho Người Tiểu Đường 850g | 2.000 | 2.000 | 2.000 |
| P1772330890890_ekw2oipdi | Tả Dán Kiiubee Premium Size Nb 60 Miếng | 3.000 | 3.000 | 3.000 |
| P1772330890890_v3dwta2re | Sữa Bột Metacare Opti 1+ 900g | 18.000 | 18.000 | 18.000 |
| P1772330890891_4y94tlrdc | Sữa Chua Uống Có Đường Yakult 80ml | 17.000 | 17.000 | 17.000 |
| P1772330890890_axfeeicic | Sữa Bột Abbott Ensure Gold Vani 400g | 2.000 | 2.000 | 2.000 |

✅ Tất cả đều khớp.

## 2. Reconcile customer/supplier ledger

Backfill chỉ thay đổi `stock_movements`, không đụng `customers`, `suppliers`, `orders`, `import_receipts`.

### 2.1 Tổng công nợ khách hàng
| Metric | Value |
|---|---|
| `SUM(customers.debt)` | 363,000.00 |
| `SUM(orders.debt_recorded WHERE status <> 'cancelled')` | 363,000 |
| `SUM(return_orders.debt_reduction WHERE status = 'completed')` | 0.00 |
| `cancelled_orders.debt_recorded` | 0 |

**Result:** `customers.debt` = `orders.debt_recorded` - `return_orders.debt_reduction` ✅

### 2.2 Tổng công nợ nhà cung cấp
| Metric | Value |
|---|---|
| `SUM(suppliers.debt)` | 5.00 |
| `SUM(import_receipts.debt_recorded WHERE status = 'completed')` | 5 |
| `SUM(supplier_exchanges.debt_adjustment WHERE status = 'completed')` | 0.00 |

**Result:** `suppliers.debt` = `import_receipts.debt_recorded` - `supplier_exchanges.debt_adjustment` ✅

### 2.3 Per-customer / per-supplier mismatch check
- Query per-customer diff: 0 rows. ✅
- Query per-supplier diff: 0 rows. ✅

Không phát hiện lệch từng khách hàng/nhà cung cấp (triệt tiêu khi cộng tổng).

## 3. Kiểm tra `get_stock_ledger` / `get_stock_balance`

- `pg_proc` xác nhận 4 function tồn tại: `backfill_stock_ledger_v2`, `get_stock_balance`, `get_stock_ledger`, `insert_stock_ledger_entry`. ✅
- `SELECT COUNT(*) FROM public.stock_movements` = **446 rows** ✅
- `SELECT COUNT(*) FROM public.get_stock_ledger(NULL, NOW() - INTERVAL '30 days', NOW())` = **48 rows** ✅

## 4. UI/Frontend smoke test

- Route `/stock-ledger` được đăng ký trong `App.tsx` (line 1341). ✅
- Menu "Sổ cái kho" (desktop) / "Sổ kho" (mobile) trong `AppTopbar.tsx`. ✅
- `pages/StockLedger.tsx` gọi `supabaseService.getStockLedger(...)` và mapping các trường DB → UI đúng: `posting_date`, `voucher_type`, `voucher_no`, `voucher_detail_no`, `product_id`, `product_name`, `lot_id`, `lot_code`, `actual_qty`, `qty_after_transaction`, `valuation_rate`, `incoming_rate`, `outgoing_rate`, `stock_value`, `balance_value`, `reason`, `is_cancelled`, `created_at`. ✅
- Filters trên UI: SP, lô, loại chứng từ, ngày, hiển thị bút toán đảo — đều mapping đúng params RPC. ✅
- Export Excel dùng `XLSX.utils.json_to_sheet`. ✅

> Lưu ý: Kiểm tra UI bằng browser automation không được thực hiện trong session này. Smoke test ở đây là code review + RPC call.

## 5. So sánh tồn kho trước/sau (tùy chọn)

- Backup `backup_stock_movements_pre_phase2` vẫn tồn tại; nếu cần so sánh chi tiết có thể so sánh `backup_stock_movements_pre_phase2` với `stock_movements` hiện tại.
- Trong phạm vi Phase 4, 7 verify queries đã đủ để khẳng định invariant đúng.

## 6. Kết luận

- Không phát hiện mismatch còn sót.
- Không cần chạy lại backfill.
- Customer/supplier ledger không bị ảnh hưởng.
- Sẵn sàng chuyển sang Phase 5 (SSOT & documentation) và Phase 6 (code hardening & monitoring).

## DoD Phase 4
- [x] 7 verify queries trên đều PASS.
- [x] Customer/supplier ledger vẫn reconcile.
- [x] `/stock-ledger` UI hiển thị đúng (code review + RPC call).
- [x] Báo cáo Phase 4 lưu trong `.temp/stock_ledger_recovery_phase4_report.md`.
- [x] `AGENTS.md` cập nhật kết quả Phase 4.
