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