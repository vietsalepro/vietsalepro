-- =====================================================================
-- 9. Má»Ÿ rá»™ng get_stock_ledger thÃªm bá»™ lá»c
-- =====================================================================
DROP FUNCTION IF EXISTS get_stock_ledger(TEXT, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_stock_ledger(
  p_product_id TEXT,
  p_from_date  TIMESTAMPTZ,
  p_to_date    TIMESTAMPTZ,
  p_lot_id     TEXT DEFAULT NULL,
  p_voucher_type TEXT DEFAULT NULL,
  p_is_cancelled BOOLEAN DEFAULT NULL,
  p_limit      INTEGER DEFAULT 1000,
  p_offset     INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  posting_date TIMESTAMPTZ,
  voucher_type TEXT,
  voucher_no TEXT,
  voucher_detail_no TEXT,
  product_id TEXT,
  product_name TEXT,
  lot_id TEXT,
  lot_code TEXT,
  warehouse TEXT,
  actual_qty NUMERIC,
  qty_after_transaction NUMERIC,
  valuation_rate NUMERIC,
  incoming_rate NUMERIC,
  outgoing_rate NUMERIC,
  stock_value NUMERIC,
  balance_value NUMERIC,
  reason TEXT,
  is_cancelled BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id,
    sm.posting_date,
    sm.voucher_type,
    sm.voucher_no,
    sm.voucher_detail_no,
    sm.product_id,
    p.name AS product_name,
    sm.lot_id,
    pl.code AS lot_code,
    sm.warehouse,
    sm.actual_qty,
    sm.qty_after_transaction,
    sm.valuation_rate,
    sm.incoming_rate,
    sm.outgoing_rate,
    sm.stock_value,
    sm.balance_value,
    sm.reason,
    sm.is_cancelled,
    sm.created_at
  FROM stock_movements sm
  LEFT JOIN products p ON p.id = sm.product_id
  LEFT JOIN product_lots pl ON pl.id = sm.lot_id
  WHERE (p_product_id IS NULL OR sm.product_id = p_product_id)
    AND sm.posting_date >= p_from_date
    AND sm.posting_date <= p_to_date
    AND (p_lot_id IS NULL OR sm.lot_id = p_lot_id)
    AND (p_voucher_type IS NULL OR sm.voucher_type = p_voucher_type)
    AND (p_is_cancelled IS NULL OR sm.is_cancelled = p_is_cancelled)
  ORDER BY sm.posting_date ASC, sm.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
