-- =====================================================================
-- 10. Helper: láº¥y tá»“n kho + giÃ¡ trá»‹ táº¡i thá»i Ä‘iá»ƒm (tÃ¹y chá»n)
-- =====================================================================
CREATE OR REPLACE FUNCTION get_stock_balance(
  p_product_id TEXT,
  p_at_date    TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  product_id TEXT,
  lot_id TEXT,
  quantity NUMERIC,
  valuation_rate NUMERIC,
  value NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (COALESCE(sm.lot_id, sm.product_id))
    sm.product_id,
    sm.lot_id,
    sm.qty_after_transaction AS quantity,
    sm.valuation_rate,
    sm.balance_value AS value
  FROM stock_movements sm
  WHERE sm.product_id = p_product_id
    AND sm.posting_date <= p_at_date
    AND (sm.is_cancelled = FALSE OR sm.is_cancelled IS NULL)
  ORDER BY COALESCE(sm.lot_id, sm.product_id), sm.posting_date DESC, sm.created_at DESC;
END;
$$;
