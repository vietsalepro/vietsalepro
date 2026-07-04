CREATE OR REPLACE FUNCTION create_return_order(
  p_id                        TEXT,
  p_original_order_id         TEXT,
  p_customer_id               TEXT,
  p_customer_name             TEXT,
  p_items                     JSONB,
  p_total_refund_amount       NUMERIC,
  p_debt_reduction            NUMERIC DEFAULT 0,
  p_cash_refund               NUMERIC DEFAULT 0,
  p_reason                    TEXT DEFAULT '',
  p_note                      TEXT DEFAULT NULL,
  p_gross_refund_amount       NUMERIC DEFAULT NULL,
  p_fee_percent               NUMERIC DEFAULT 0,
  p_fee_amount                NUMERIC DEFAULT 0,
  p_days_since_purchase       INTEGER DEFAULT 0,
  p_original_payment_method   TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now                 TIMESTAMPTZ := NOW();
  v_order               RECORD;
  v_item                JSONB;
  v_product_id          TEXT;
  v_qty                 NUMERIC;
  v_ordered_qty         NUMERIC;
  v_already_returned    NUMERIC;
  v_new_total_returned  NUMERIC;
  v_customer_id_clean   TEXT;
  v_lot_id              TEXT;
  v_lot_code            TEXT;
  v_lot_exists          BOOLEAN;
  v_points_to_deduct    NUMERIC := 0;
  v_point_rate          NUMERIC;
  v_is_point_enabled    BOOLEAN;
  v_eligible_subtotal   NUMERIC := 0;

  -- Phase 7c: stock ledger
  v_return_item_id      TEXT;
  v_qty_after           NUMERIC;
  v_valuation_rate      NUMERIC;
  v_orig_cost           NUMERIC;
BEGIN
  IF p_id IS NULL OR p_id = '' THEN
    RAISE EXCEPTION 'return_order.id is required';
  END IF;

  IF p_original_order_id IS NULL OR p_original_order_id = '' THEN
    RAISE EXCEPTION 'original_order_id is required';
  END IF;

  IF jsonb_typeof(p_items) != 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Phiếu trả phải có ít nhất 1 sản phẩm';
  END IF;

  IF p_total_refund_amount < 0 THEN
    RAISE EXCEPTION 'Tổng tiền hoàn không thể âm';
  END IF;

  v_customer_id_clean := NULLIF(NULLIF(p_customer_id, ''), 'guest');

  SELECT id, total_amount, total_returned_amount, customer_id
    INTO v_order
  FROM orders
  WHERE id = p_original_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Đơn hàng gốc % không tồn tại', p_original_order_id;
  END IF;

  v_new_total_returned := COALESCE(v_order.total_returned_amount, 0) + p_total_refund_amount;

  IF v_new_total_returned > COALESCE(v_order.total_amount, 0) + 0.01 THEN
    RAISE EXCEPTION 'Tổng tiền trả (%) vượt quá tổng tiền đơn hàng (%)',
      v_new_total_returned, v_order.total_amount
      USING ERRCODE = 'P0001';
  END IF;

  IF v_customer_id_clean IS NOT NULL THEN
    PERFORM 1 FROM customers WHERE id = v_customer_id_clean FOR UPDATE;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := v_item->>'productId';
    v_qty := COALESCE((v_item->>'quantity')::NUMERIC, 0);

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Số lượng trả của "%" phải > 0', v_item->>'productName';
    END IF;

    SELECT COALESCE(SUM(quantity), 0) INTO v_ordered_qty
    FROM order_items
    WHERE order_id = p_original_order_id
      AND product_id = v_product_id;

    IF v_ordered_qty = 0 THEN
      RAISE EXCEPTION 'Sản phẩm "%" không có trong đơn hàng gốc',
        v_item->>'productName'
        USING ERRCODE = 'P0001';
    END IF;

    SELECT COALESCE(SUM(roi.quantity), 0) INTO v_already_returned
    FROM return_order_items roi
    JOIN return_orders ro ON ro.id = roi.return_order_id
    WHERE ro.original_order_id = p_original_order_id
      AND roi.product_id = v_product_id
      AND ro.status != 'cancelled';

    IF v_already_returned + v_qty > v_ordered_qty + 0.001 THEN
      RAISE EXCEPTION 'Trả vượt số đã bán cho "%" (đã bán %, đã trả %, đang trả thêm %)',
        v_item->>'productName', v_ordered_qty, v_already_returned, v_qty
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  BEGIN
    SELECT point_conversion_rate INTO v_point_rate FROM app_settings WHERE id = 'default';
  EXCEPTION WHEN OTHERS THEN
    v_point_rate := NULL;
  END;
  IF v_point_rate IS NULL OR v_point_rate <= 0 THEN
    v_point_rate := 100000;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := v_item->>'productId';
    SELECT is_point_accumulation_enabled INTO v_is_point_enabled
    FROM products WHERE id = v_product_id;
    IF v_is_point_enabled THEN
      v_eligible_subtotal := v_eligible_subtotal + COALESCE((v_item->>'subtotal')::NUMERIC, 0);
    END IF;
  END LOOP;
  v_points_to_deduct := FLOOR(v_eligible_subtotal / v_point_rate);

  BEGIN
    INSERT INTO return_orders (
      id, original_order_id, date, customer_id, customer_name,
      total_refund_amount, refund_method,
      debt_reduction, cash_refund,
      reason, note, status,
      gross_refund_amount, fee_percent, fee_amount,
      days_since_purchase, original_payment_method,
      points_deducted,
      created_at, updated_at
    ) VALUES (
      p_id, p_original_order_id, v_now, v_customer_id_clean, p_customer_name,
      p_total_refund_amount, 'cash',
      p_debt_reduction, p_cash_refund,
      p_reason, p_note, 'completed',
      COALESCE(p_gross_refund_amount, p_total_refund_amount), p_fee_percent, p_fee_amount,
      p_days_since_purchase, p_original_payment_method,
      v_points_to_deduct,
      v_now, v_now
    );
  EXCEPTION
    WHEN undefined_column THEN
      INSERT INTO return_orders (
        id, original_order_id, date, customer_id, customer_name,
        total_refund_amount, refund_method,
        debt_reduction, cash_refund,
        reason, note, status,
        created_at, updated_at
      ) VALUES (
        p_id, p_original_order_id, v_now, v_customer_id_clean, p_customer_name,
        p_total_refund_amount, 'cash',
        p_debt_reduction, p_cash_refund,
        p_reason, p_note, 'completed',
        v_now, v_now
      );
  END;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := v_item->>'productId';
    v_lot_id     := NULLIF(v_item->>'lotId', '');
    v_lot_code   := NULLIF(v_item->>'lotCode', '');

    IF v_lot_id IS NULL THEN
      SELECT lot_id, lot_code INTO v_lot_id, v_lot_code
      FROM order_items
      WHERE order_id = p_original_order_id
        AND product_id = v_product_id
        AND (lot_code = v_lot_code OR v_lot_code IS NULL)
      ORDER BY (CASE WHEN lot_code = v_lot_code THEN 0 ELSE 1 END), id ASC
      LIMIT 1;
    END IF;

    v_lot_id   := NULLIF(v_lot_id, '');
    v_lot_code := NULLIF(v_lot_code, '');

    INSERT INTO return_order_items (
      id, return_order_id, product_id, product_name,
      quantity, unit_name, unit_price, subtotal, reason,
      lot_id, lot_code
    ) VALUES (
      p_id || '_' || v_product_id || '_' || COALESCE(v_lot_id, floor(random()*1000000)::text),
      p_id,
      v_product_id,
      v_item->>'productName',
      COALESCE((v_item->>'quantity')::NUMERIC, 0),
      v_item->>'unitName',
      COALESCE((v_item->>'unitPrice')::NUMERIC, 0),
      COALESCE((v_item->>'subtotal')::NUMERIC, 0),
      COALESCE(v_item->>'reason', ''),
      v_lot_id,
      v_lot_code
    ) RETURNING id INTO v_return_item_id;
  END LOOP;

  UPDATE orders SET
    has_return = true,
    total_returned_amount = v_new_total_returned
  WHERE id = p_original_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := v_item->>'productId';
    v_qty        := COALESCE((v_item->>'quantity')::NUMERIC, 0);
    v_lot_id     := NULLIF(v_item->>'lotId', '');
    v_lot_code   := NULLIF(v_item->>'lotCode', '');

    IF v_qty <= 0 THEN CONTINUE; END IF;

    IF v_lot_id IS NULL THEN
      SELECT lot_id, lot_code INTO v_lot_id, v_lot_code
      FROM order_items
      WHERE order_id = p_original_order_id
        AND product_id = v_product_id
        AND (lot_code = v_lot_code OR v_lot_code IS NULL)
      ORDER BY (CASE WHEN lot_code = v_lot_code THEN 0 ELSE 1 END), id ASC
      LIMIT 1;
    END IF;

    v_lot_id   := NULLIF(v_lot_id, '');
    v_lot_code := NULLIF(v_lot_code, '');

    SELECT id INTO v_return_item_id
    FROM return_order_items
    WHERE return_order_id = p_id
      AND product_id = v_product_id
      AND (lot_id = v_lot_id OR (lot_id IS NULL AND v_lot_id IS NULL))
    ORDER BY id DESC
    LIMIT 1;

    IF v_lot_id IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM product_lots WHERE id = v_lot_id) INTO v_lot_exists;

      IF v_lot_exists THEN
        PERFORM 1 FROM product_lots WHERE id = v_lot_id FOR UPDATE;
        UPDATE product_lots
        SET quantity = COALESCE(quantity, 0) + v_qty, updated_at = NOW()
        WHERE id = v_lot_id;
      ELSE
        INSERT INTO product_lots (id, product_id, code, expiry_date, quantity, original_quantity, created_at, updated_at)
        VALUES (v_lot_id, v_product_id, COALESCE(v_lot_code, 'RECOVERED_RTN'), NULL, v_qty, v_qty, NOW(), NOW());
      END IF;

      PERFORM sync_product_quantity_from_lots(v_product_id);
    ELSE
      PERFORM 1 FROM products WHERE id = v_product_id FOR UPDATE;
      UPDATE products
      SET quantity = COALESCE(quantity, 0) + v_qty
      WHERE id = v_product_id;
    END IF;

    -- Phase 7c: GHI BÚT TOÁN SỔ CÁI KHO
    v_qty_after := get_product_stock_balance(v_product_id, NULL);

    SELECT cost INTO v_orig_cost
    FROM order_items
    WHERE order_id = p_original_order_id
      AND product_id = v_product_id
      AND (lot_id = v_lot_id OR (lot_id IS NULL AND v_lot_id IS NULL))
    ORDER BY id ASC
    LIMIT 1;

    v_valuation_rate := COALESCE(v_orig_cost, get_product_valuation_rate(v_product_id, v_lot_id));

    PERFORM insert_stock_ledger_entry(
      v_now,
      'Delivery Note'::TEXT,
      p_id,
      v_return_item_id,
      v_product_id,
      v_lot_id,
      'Kho Chính'::TEXT,
      v_qty,
      v_qty_after,
      v_valuation_rate,
      v_valuation_rate,
      0::NUMERIC,
      COALESCE(v_item->>'reason', 'Trả hàng'),
      FALSE
    );
  END LOOP;

  IF v_customer_id_clean IS NOT NULL THEN
    UPDATE customers SET
      debt           = GREATEST(0, COALESCE(debt, 0) - p_debt_reduction),
      total_spent    = GREATEST(0, COALESCE(total_spent, 0) - p_total_refund_amount),
      loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) - v_points_to_deduct),
      updated_at     = v_now
    WHERE id = v_customer_id_clean;

    IF v_points_to_deduct > 0 THEN
      INSERT INTO point_history (id, customer_id, date, type, amount, description, order_id)
      VALUES (
        'PH_RET_' || p_id,
        v_customer_id_clean,
        v_now,
        'return',
        -v_points_to_deduct,
        'Trừ điểm do trả hàng từ đơn ' || p_original_order_id,
        p_original_order_id
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'return_id', p_id,
    'new_total_returned', v_new_total_returned,
    'points_deducted', v_points_to_deduct
  );
END;
$$;