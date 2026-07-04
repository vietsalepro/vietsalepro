-- =====================================================================
-- 5. Há»§y phiáº¿u tráº£ â€” Ä‘áº£o Delivery Note
-- =====================================================================
CREATE OR REPLACE FUNCTION cancel_return_order_v2(p_return_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_return          RECORD;
  v_item            RECORD;
  v_product         RECORD;
  v_remaining_total NUMERIC;
  v_allow_negative  BOOLEAN := FALSE;
  v_lot_qty         NUMERIC;
  v_prod_qty        NUMERIC;
  v_qty_after       NUMERIC;
  v_valuation_rate  NUMERIC;
BEGIN
  IF p_return_id IS NULL OR p_return_id = '' THEN
    RAISE EXCEPTION 'return_id is required';
  END IF;

  SELECT id, original_order_id, total_refund_amount, debt_reduction, customer_id, status, points_deducted
    INTO v_return
  FROM return_orders
  WHERE id = p_return_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phiáº¿u tráº£ % khÃ´ng tá»“n táº¡i', p_return_id;
  END IF;

  IF v_return.status = 'cancelled' THEN
    RAISE EXCEPTION 'Phiáº¿u tráº£ % Ä‘Ã£ bá»‹ huá»· trÆ°á»›c Ä‘Ã³', p_return_id;
  END IF;

  BEGIN
    SELECT COALESCE(allow_negative_stock, FALSE) INTO v_allow_negative
    FROM app_settings WHERE id = 'default';
  EXCEPTION WHEN OTHERS THEN
    v_allow_negative := FALSE;
  END;

  UPDATE return_orders
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_return_id;

  FOR v_item IN
    SELECT id, product_id, quantity, lot_id, lot_code
    FROM return_order_items
    WHERE return_order_id = p_return_id
  LOOP
    SELECT id, has_lots INTO v_product
    FROM products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF v_product.has_lots AND v_item.lot_id IS NOT NULL THEN
      SELECT quantity INTO v_lot_qty
      FROM product_lots
      WHERE id = v_item.lot_id AND product_id = v_item.product_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'LÃ´ % cá»§a sáº£n pháº©m % khÃ´ng tá»“n táº¡i', v_item.lot_id, v_item.product_id;
      END IF;

      IF NOT v_allow_negative AND v_lot_qty < v_item.quantity THEN
        RAISE EXCEPTION 'KhÃ´ng Ä‘á»§ tá»“n kho lÃ´ Ä‘á»ƒ há»§y phiáº¿u tráº£ (cáº§n trá»« %, cÃ²n %)',
          v_item.quantity, v_lot_qty
          USING ERRCODE = 'P0001';
      END IF;

      UPDATE product_lots
      SET quantity = quantity - v_item.quantity, updated_at = NOW()
      WHERE id = v_item.lot_id;

      PERFORM sync_product_quantity_from_lots(v_item.product_id);
    ELSE
      SELECT quantity INTO v_prod_qty
      FROM products
      WHERE id = v_item.product_id;

      IF NOT v_allow_negative AND v_prod_qty < v_item.quantity THEN
        RAISE EXCEPTION 'KhÃ´ng Ä‘á»§ tá»“n kho Ä‘á»ƒ há»§y phiáº¿u tráº£ cho % (cáº§n trá»« %, cÃ²n %)',
          v_item.product_id, v_item.quantity, v_prod_qty
          USING ERRCODE = 'P0001';
      END IF;

      UPDATE products
      SET quantity = quantity - v_item.quantity
      WHERE id = v_item.product_id;
    END IF;

    -- Phase 7c: GHI BÃšT TOÃN Äáº¢O Sá»” CÃI KHO
    v_qty_after := get_product_stock_balance(v_item.product_id, NULL);
    v_valuation_rate := get_product_valuation_rate(v_item.product_id, v_item.lot_id);

    PERFORM insert_stock_ledger_entry(
      NOW(),
      'Delivery Note'::TEXT,
      p_return_id,
      v_item.id,
      v_item.product_id,
      v_item.lot_id,
      'Kho ChÃ­nh'::TEXT,
      -v_item.quantity,
      v_qty_after,
      v_valuation_rate,
      v_valuation_rate,
      0::NUMERIC,
      'Há»§y phiáº¿u tráº£ hÃ ng',
      TRUE
    );
  END LOOP;

  SELECT COALESCE(SUM(total_refund_amount), 0) INTO v_remaining_total
  FROM return_orders
  WHERE original_order_id = v_return.original_order_id AND status != 'cancelled';

  UPDATE orders
  SET has_return = (v_remaining_total > 0),
      total_returned_amount = v_remaining_total
  WHERE id = v_return.original_order_id;

  IF v_return.customer_id IS NOT NULL THEN
    UPDATE customers
    SET total_spent    = COALESCE(total_spent, 0) + v_return.total_refund_amount,
        debt           = COALESCE(debt, 0) + v_return.debt_reduction,
        loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) + COALESCE(v_return.points_deducted, 0)),
        updated_at     = NOW()
    WHERE id = v_return.customer_id;

    IF COALESCE(v_return.points_deducted, 0) > 0 THEN
      INSERT INTO point_history (id, customer_id, date, type, amount, description, order_id)
      VALUES (
        'PH_CANCEL_RET_' || p_return_id,
        v_return.customer_id,
        NOW(),
        'cancel_return',
        v_return.points_deducted,
        'HoÃ n Ä‘iá»ƒm do há»§y phiáº¿u tráº£ ' || p_return_id,
        v_return.original_order_id
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cancelled_return_id', p_return_id,
    'points_restored', COALESCE(v_return.points_deducted, 0)
  );
END;
$$;
