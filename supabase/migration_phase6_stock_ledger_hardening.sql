-- =========================================================
-- Phase 6 — Stock Ledger Hardening & Monitoring
-- File:    migration_phase6_stock_ledger_hardening.sql
-- Purpose: Guarantee that every future stock_movements row has
--            qty_after_transaction computed correctly per
--            (product_id, lot_id), and provide drift monitoring.
-- Option:  C — Patch RPCs (A) + BEFORE INSERT trigger (B) + reconcile job
-- Project: QLBH (rsialbfjswnrkzcxarnj)
-- Date:    2026-07-01
-- WARNING: This migration modifies live business functions.
--          A backup of stock_movements is created at the top.
-- =========================================================

-- =========================================================
-- 0. Backup stock_movements before any changes
-- =========================================================
CREATE TABLE IF NOT EXISTS public.stock_movements_backup_phase6 AS
SELECT * FROM public.stock_movements;

-- =========================================================
-- 1. Helper: compute running balance per (product_id, lot_id)
-- =========================================================
CREATE OR REPLACE FUNCTION public.calc_qty_after_transaction(
  p_product_id TEXT,
  p_lot_id TEXT,
  p_actual_qty NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
  FROM public.stock_movements
  WHERE product_id = p_product_id
    AND lot_id IS NOT DISTINCT FROM p_lot_id
    AND is_cancelled = FALSE;
  RETURN v_balance + p_actual_qty;
END;
$$;

-- =========================================================
-- 2. Index to make the helper + trigger fast
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_lot_cancelled
  ON public.stock_movements (product_id, lot_id, is_cancelled, posting_date DESC);

-- =========================================================
-- 3. Central ledger entry function: auto-compute running total
--    This makes every caller (current or future) correct even
--    if they pass an incorrect qty_after_transaction.
-- =========================================================
CREATE OR REPLACE FUNCTION public.insert_stock_ledger_entry(
  p_posting_date TIMESTAMPTZ,
  p_voucher_type TEXT,
  p_voucher_no TEXT,
  p_voucher_detail_no TEXT,
  p_product_id TEXT,
  p_lot_id TEXT,
  p_warehouse TEXT,
  p_actual_qty NUMERIC,
  p_qty_after_transaction NUMERIC,
  p_valuation_rate NUMERIC,
  p_incoming_rate NUMERIC,
  p_outgoing_rate NUMERIC,
  p_reason TEXT,
  p_is_cancelled BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_qty_after_transaction NUMERIC;
BEGIN
  -- Idempotency: skip if the exact (voucher_type, voucher_detail_no, is_cancelled, lot_id) row exists.
  IF EXISTS (
    SELECT 1 FROM public.stock_movements
    WHERE voucher_type = p_voucher_type
      AND voucher_detail_no = p_voucher_detail_no
      AND is_cancelled = p_is_cancelled
      AND lot_id IS NOT DISTINCT FROM p_lot_id
    LIMIT 1
  ) THEN
    RETURN;
  END IF;

  -- Phase 6: always compute the true running total per (product_id, lot_id).
  -- The passed p_qty_after_transaction is intentionally ignored.
  v_qty_after_transaction := public.calc_qty_after_transaction(p_product_id, p_lot_id, p_actual_qty);

  INSERT INTO public.stock_movements (
    posting_date, voucher_type, voucher_no, voucher_detail_no,
    product_id, lot_id, warehouse, actual_qty, qty_after_transaction,
    valuation_rate, incoming_rate, outgoing_rate, stock_value, balance_value,
    reason, is_cancelled
  ) VALUES (
    p_posting_date, p_voucher_type, p_voucher_no, p_voucher_detail_no,
    p_product_id, p_lot_id, COALESCE(p_warehouse, 'Kho Chính'),
    p_actual_qty, v_qty_after_transaction,
    COALESCE(p_valuation_rate, 0),
    COALESCE(p_incoming_rate, 0),
    COALESCE(p_outgoing_rate, 0),
    p_actual_qty * COALESCE(p_valuation_rate, 0),
    v_qty_after_transaction * COALESCE(p_valuation_rate, 0),
    p_reason,
    COALESCE(p_is_cancelled, FALSE)
  );
END;
$$;

-- =========================================================
-- 4. Safety-net trigger: recompute qty_after_transaction on
--    every direct INSERT into stock_movements, and also fix
--    balance_value so the row is fully consistent.
-- =========================================================
CREATE OR REPLACE FUNCTION public.trg_stock_movements_calc_qty_after()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  IF NEW.is_cancelled = FALSE THEN
    SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
    FROM public.stock_movements
    WHERE product_id = NEW.product_id
      AND lot_id IS NOT DISTINCT FROM NEW.lot_id
      AND is_cancelled = FALSE;
    NEW.qty_after_transaction := v_balance + NEW.actual_qty;
  ELSE
    -- For cancelled rows, keep the supplied value or 0.
    NEW.qty_after_transaction := COALESCE(NEW.qty_after_transaction, 0);
  END IF;

  -- Ensure derived value columns are always consistent.
  NEW.balance_value := NEW.qty_after_transaction * COALESCE(NEW.valuation_rate, 0);
  NEW.stock_value   := NEW.actual_qty * COALESCE(NEW.valuation_rate, 0);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stock_movements_calc_qty_after ON public.stock_movements;
CREATE TRIGGER trg_stock_movements_calc_qty_after
  BEFORE INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.trg_stock_movements_calc_qty_after();

-- =========================================================
-- 5. Drift monitor: detect any mismatch between products,
--    product_lots, and stock_movements.
-- =========================================================
CREATE OR REPLACE FUNCTION public.check_stock_ledger_drift()
RETURNS TABLE (
  product_id TEXT,
  lot_id TEXT,
  products_quantity NUMERIC,
  lot_sum NUMERIC,
  movement_sum NUMERIC,
  diff NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH lot_totals AS (
    SELECT product_id, SUM(quantity) AS lot_sum
    FROM public.product_lots GROUP BY product_id
  ),
  movement_totals AS (
    SELECT product_id, SUM(actual_qty) AS movement_sum
    FROM public.stock_movements WHERE is_cancelled = FALSE GROUP BY product_id
  )
  SELECT
    p.id AS product_id,
    NULL::TEXT AS lot_id,
    p.quantity AS products_quantity,
    lt.lot_sum,
    mt.movement_sum,
    COALESCE(p.quantity, 0) - COALESCE(mt.movement_sum, 0) AS diff
  FROM public.products p
  LEFT JOIN lot_totals lt ON lt.product_id = p.id
  LEFT JOIN movement_totals mt ON mt.product_id = p.id
  WHERE p.has_lots = TRUE
    AND (
      COALESCE(p.quantity, 0) <> COALESCE(lt.lot_sum, 0)
      OR COALESCE(p.quantity, 0) <> COALESCE(mt.movement_sum, 0)
      OR COALESCE(lt.lot_sum, 0) <> COALESCE(mt.movement_sum, 0)
    )
  UNION ALL
  SELECT
    p.id AS product_id,
    NULL::TEXT AS lot_id,
    p.quantity AS products_quantity,
    NULL::NUMERIC AS lot_sum,
    mt.movement_sum,
    COALESCE(p.quantity, 0) - COALESCE(mt.movement_sum, 0) AS diff
  FROM public.products p
  LEFT JOIN (
    SELECT product_id, SUM(actual_qty) AS movement_sum
    FROM public.stock_movements WHERE is_cancelled = FALSE GROUP BY product_id
  ) mt ON mt.product_id = p.id
  WHERE COALESCE(p.has_lots, FALSE) = FALSE
    AND COALESCE(p.quantity, 0) <> COALESCE(mt.movement_sum, 0);
END;
$$;

-- =========================================================
-- 6. Patch all business RPCs to compute qty_after_transaction
--    per (product_id, lot_id) explicitly. Even though
--    insert_stock_ledger_entry now auto-computes, patching the
--    callers keeps the codebase clean and self-documenting.
-- =========================================================
DO $$
DECLARE
  v_funcdef TEXT;
  v_newdef  TEXT;
BEGIN
  -- process_checkout (Sales Invoice)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'process_checkout';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_item->>''productId'', NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_item->>''productId'', v_lot_id, -COALESCE((v_item->>''quantity'')::NUMERIC, 0));');
  EXECUTE v_newdef;

  -- process_import_v2 (Purchase Receipt)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'process_import_v2';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_ledger_lot_id, v_item.quantity);');
  EXECUTE v_newdef;

  -- delete_import_v2 (cancel Purchase Receipt)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'delete_import_v2';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_ledger_lot_id, -v_item.quantity);');
  EXECUTE v_newdef;

  -- update_import_v2 is covered because it calls delete_import_v2 + process_import_v2

  -- create_return_order (Sales Return)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'create_return_order';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_product_id, v_lot_id, v_qty);');
  EXECUTE v_newdef;

  -- cancel_return_order_v2 (cancel Sales Return)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'cancel_return_order_v2';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_item.lot_id, -v_item.quantity);');
  EXECUTE v_newdef;

  -- complete_disposal (Stock Entry - disposal)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'complete_disposal';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_item.lot_id, -v_item.quantity);');
  EXECUTE v_newdef;

  -- delete_disposal_with_restore (cancel disposal)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'delete_disposal_with_restore';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_item.lot_id, v_item.quantity);');
  EXECUTE v_newdef;

  -- complete_inventory_count (Stock Reconciliation)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'complete_inventory_count';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(item.product_id, v_ledger_lot_id, v_ledger_qty);');
  EXECUTE v_newdef;

  -- cancel_inventory_count_rpc (cancel Stock Reconciliation)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'cancel_inventory_count_rpc';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(item.product_id, v_lot_id, -v_diff);');
  EXECUTE v_newdef;

  -- cancel_supplier_exchange: uses two-step product-level balance
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'cancel_supplier_exchange';
  v_newdef := replace(v_funcdef,
    E'    -- Phase 6b: GHI BÚT TOÁN ĐẢO KHO — HÀNG TRẢ\n    IF v_stock_lot_id IS NOT NULL THEN\n      v_stock_qty_before := COALESCE(get_product_stock_balance(v_return_item.product_id, NULL), 0);\n      v_stock_qty_after := v_stock_qty_before - v_return_item.quantity;',
    E'    -- Phase 6b: GHI BÚT TOÁN ĐẢO KHO — HÀNG TRẢ\n    IF v_stock_lot_id IS NOT NULL THEN\n      v_stock_qty_after := public.calc_qty_after_transaction(v_return_item.product_id, v_stock_lot_id, -v_return_item.quantity);');
  v_newdef := replace(v_newdef,
    E'    -- Phase 6b: GHI BÚT TOÁN ĐẢO KHO — HÀNG NHẬN ĐỔI\n    IF v_stock_lot_id IS NOT NULL THEN\n      v_stock_qty_before := COALESCE(get_product_stock_balance(v_received_item.product_id, NULL), 0);\n      v_stock_qty_after := v_stock_qty_before + v_received_item.quantity;',
    E'    -- Phase 6b: GHI BÚT TOÁN ĐẢO KHO — HÀNG NHẬN ĐỔI\n    IF v_stock_lot_id IS NOT NULL THEN\n      v_stock_qty_after := public.calc_qty_after_transaction(v_received_item.product_id, v_stock_lot_id, v_received_item.quantity);');
  EXECUTE v_newdef;

  -- create_exchange_transaction: two ledger sections (return + exchange sale)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'create_exchange_transaction';
  v_newdef := replace(v_funcdef,
    E'      -- Phase 7c: GHI BÚT TOÁN SỔ CÁI KHO — TRẢ\n      v_qty_after := get_product_stock_balance(v_product_id, NULL);',
    E'      -- Phase 7c: GHI BÚT TOÁN SỔ CÁI KHO — TRẢ\n      v_qty_after := public.calc_qty_after_transaction(v_product_id, v_lot_id, v_qty);');
  v_newdef := replace(v_newdef,
    E'      -- Phase 7c: GHI BÚT TOÁN SỔ CÁI KHO — BÁN\n      v_qty_after := get_product_stock_balance(v_product_id, NULL);',
    E'      -- Phase 7c: GHI BÚT TOÁN SỔ CÁI KHO — BÁN\n      v_qty_after := public.calc_qty_after_transaction(v_product_id, v_ex_lot_id, -v_qty);');
  EXECUTE v_newdef;
END $$;

-- =========================================================
-- 7. Verification: no business RPC should still use
--    get_product_stock_balance for the ledger qty_after.
-- =========================================================
DO $$
DECLARE
  v_remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM pg_proc
  WHERE proname IN (
    'process_checkout','process_import_v2','delete_import_v2','create_return_order',
    'cancel_return_order_v2','complete_disposal','delete_disposal_with_restore',
    'create_exchange_transaction','complete_inventory_count','cancel_inventory_count_rpc',
    'cancel_supplier_exchange'
  )
  AND prosrc LIKE '%get_product_stock_balance%'
  AND proname <> 'update_import_v2'; -- update_import_v2 delegates to delete+process

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Phase 6 patch incomplete: % business RPCs still call get_product_stock_balance', v_remaining;
  END IF;
END $$;
