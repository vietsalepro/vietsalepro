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