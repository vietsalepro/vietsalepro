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