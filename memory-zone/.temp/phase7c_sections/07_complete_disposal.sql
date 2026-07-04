-- =====================================================================
-- 7. Há»§y hÃ ng â€” Stock Entry
-- =====================================================================
CREATE OR REPLACE FUNCTION complete_disposal(p_disposal_id TEXT)
RETURNS TABLE (id TEXT, code TEXT, status TEXT) AS $$
DECLARE
  v_item RECORD;
  v_lot_quantity NUMERIC;
  v_product_quantity NUMERIC;
  v_disposal_status TEXT;
  v_disposal_code TEXT;
  v_qty_after NUMERIC;
  v_valuation_rate NUMERIC;
BEGIN
  SELECT d.status, d.code INTO v_disposal_status, v_disposal_code
  FROM disposals AS d
  WHERE d.id = p_disposal_id
  FOR UPDATE;

  IF v_disposal_status IS NULL THEN
    RAISE EXCEPTION 'Phiáº¿u xuáº¥t há»§y khÃ´ng tá»“n táº¡i (%)', p_disposal_id;
  END IF;

  IF v_disposal_status = 'COMPLETED' THEN
    RAISE EXCEPTION 'Phiáº¿u xuáº¥t há»§y Ä‘Ã£ hoÃ n thÃ nh trÆ°á»›c Ä‘Ã³';
  END IF;

  FOR v_item IN
    SELECT di.id, di.product_id, di.lot_id, di.quantity, di.reason
    FROM disposal_items AS di
    WHERE di.disposal_id = p_disposal_id
  LOOP
    SELECT p.quantity INTO v_product_quantity
    FROM products AS p
    WHERE p.id = v_item.product_id
    FOR UPDATE;

    IF v_product_quantity IS NULL THEN
      RAISE EXCEPTION 'Sáº£n pháº©m % khÃ´ng tá»“n táº¡i trong kho', v_item.product_id;
    END IF;

    IF v_product_quantity < v_item.quantity THEN
      RAISE EXCEPTION 'Sáº£n pháº©m % khÃ´ng Ä‘á»§ tá»“n kho (cÃ²n %, cáº§n há»§y %)',
        v_item.product_id, v_product_quantity, v_item.quantity;
    END IF;

    IF v_item.lot_id IS NOT NULL THEN
      SELECT pl.quantity INTO v_lot_quantity
      FROM product_lots AS pl
      WHERE pl.id = v_item.lot_id
      FOR UPDATE;

      IF v_lot_quantity IS NULL THEN
        RAISE EXCEPTION 'LÃ´ % khÃ´ng tá»“n táº¡i cho sáº£n pháº©m %',
          v_item.lot_id, v_item.product_id;
      END IF;

      IF v_lot_quantity < v_item.quantity THEN
        RAISE EXCEPTION 'LÃ´ % khÃ´ng Ä‘á»§ sá»‘ lÆ°á»£ng (cÃ²n %, cáº§n há»§y %)',
          v_item.lot_id, v_lot_quantity, v_item.quantity;
      END IF;

      UPDATE product_lots AS pl
      SET quantity = pl.quantity - v_item.quantity
      WHERE pl.id = v_item.lot_id;

      PERFORM sync_product_quantity_from_lots(v_item.product_id);
    ELSE
      UPDATE products AS p
      SET quantity = p.quantity - v_item.quantity
      WHERE p.id = v_item.product_id;
    END IF;

    -- Phase 7c: GHI BÃšT TOÃN Sá»” CÃI KHO
    v_qty_after := get_product_stock_balance(v_item.product_id, NULL);
    v_valuation_rate := get_product_valuation_rate(v_item.product_id, v_item.lot_id);

    PERFORM insert_stock_ledger_entry(
      NOW(),
      'Stock Entry'::TEXT,
      p_disposal_id,
      v_item.id,
      v_item.product_id,
      v_item.lot_id,
      'Kho ChÃ­nh'::TEXT,
      -v_item.quantity,
      v_qty_after,
      v_valuation_rate,
      0::NUMERIC,
      v_valuation_rate,
      v_item.reason,
      FALSE
    );
  END LOOP;

  UPDATE disposals AS d
  SET status = 'COMPLETED', updated_at = NOW()
  WHERE d.id = p_disposal_id;

  RETURN QUERY
    SELECT d.id, d.code, d.status
    FROM disposals AS d
    WHERE d.id = p_disposal_id;
END;
$$ LANGUAGE plpgsql;
