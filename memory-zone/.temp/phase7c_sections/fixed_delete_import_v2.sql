CREATE OR REPLACE FUNCTION delete_import_v2(p_receipt_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receipt          RECORD;
  v_item             RECORD;
  v_current_qty      NUMERIC;
  v_current_cost     NUMERIC;
  v_has_lots         BOOLEAN;
  v_new_qty          NUMERIC;
  v_new_cost         NUMERIC;
  v_allow_negative   BOOLEAN := FALSE;

  v_existing_lot_qty  NUMERIC;
  v_existing_lot_cost NUMERIC;
  v_new_lot_qty       NUMERIC;
  v_new_lot_cost      NUMERIC;

  v_affected_products TEXT[] := ARRAY[]::TEXT[];
  v_total_removed_qty NUMERIC := 0;

  -- Phase 7c: stock ledger
  v_ledger_lot_id    TEXT;
  v_qty_after        NUMERIC;
BEGIN
  SELECT * INTO v_receipt FROM import_receipts WHERE id = p_receipt_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phiếu nhập % không tồn tại trong hệ thống', p_receipt_id;
  END IF;

  IF v_receipt.status = 'draft' THEN
    DELETE FROM import_items WHERE receipt_id = p_receipt_id;
    DELETE FROM import_receipts WHERE id = p_receipt_id;
    RETURN jsonb_build_object('receipt_id', p_receipt_id, 'status', 'draft_deleted');
  END IF;

  BEGIN
    SELECT COALESCE(allow_negative_stock, FALSE) INTO v_allow_negative FROM app_settings LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_allow_negative := FALSE;
  END;

  FOR v_item IN SELECT * FROM import_items WHERE receipt_id = p_receipt_id
  LOOP
    SELECT quantity, COALESCE(cost, 0), COALESCE(has_lots, FALSE)
    INTO v_current_qty, v_current_cost, v_has_lots
    FROM products WHERE id = v_item.product_id FOR UPDATE;

    IF NOT v_allow_negative AND v_current_qty < v_item.quantity THEN
      RAISE EXCEPTION 'Không thể xóa phiếu nhập %: Sản phẩm % đã bán vượt quá số lượng nhập (Tồn hiện tại %, yêu cầu trả %)',
        p_receipt_id, v_item.product_name, v_current_qty, v_item.quantity;
    END IF;

    v_new_qty := v_current_qty - v_item.quantity;

    v_new_cost := v_current_cost;
    IF v_new_qty > 0 THEN
      v_new_cost := ROUND(((v_current_qty * v_current_cost) - (v_item.quantity * v_item.cost)) / v_new_qty, 2);
      IF v_new_cost < 0 THEN v_new_cost := 0; END IF;
    END IF;

    UPDATE products
    SET quantity = v_new_qty, cost = v_new_cost
    WHERE id = v_item.product_id;

    v_ledger_lot_id := NULL;

    IF v_has_lots THEN
      SELECT quantity, COALESCE(cost, 0)
      INTO v_existing_lot_qty, v_existing_lot_cost
      FROM product_lots
      WHERE product_id = v_item.product_id AND code = v_item.lot_code
      FOR UPDATE;

      IF NOT v_allow_negative AND (NOT FOUND OR v_existing_lot_qty < v_item.quantity) THEN
        RAISE EXCEPTION '%', format('Không thể xóa phiếu nhập %: Lô % của sản phẩm % không đủ tồn kho để giảm trừ (Lô hiện có %, yêu cầu trừ %)',
          p_receipt_id, v_item.lot_code, v_item.product_name, COALESCE(v_existing_lot_qty, 0), v_item.quantity);
      END IF;

      v_new_lot_qty := COALESCE(v_existing_lot_qty, 0) - v_item.quantity;

      IF v_new_lot_qty > 0 THEN
        v_new_lot_cost := ROUND(
          ((COALESCE(v_existing_lot_qty, 0) * COALESCE(v_existing_lot_cost, 0)) - (v_item.quantity * v_item.cost))
          / v_new_lot_qty,
          2
        );
        IF v_new_lot_cost < 0 THEN v_new_lot_cost := 0; END IF;
      ELSE
        v_new_lot_cost := 0;
      END IF;

      IF v_allow_negative THEN
        UPDATE product_lots
        SET quantity = COALESCE(quantity, 0) - v_item.quantity,
            cost = CASE WHEN COALESCE(quantity, 0) - v_item.quantity > 0 THEN v_new_lot_cost ELSE COALESCE(cost, 0) END,
            updated_at = NOW()
        WHERE product_id = v_item.product_id AND code = v_item.lot_code;

        DELETE FROM product_lots
        WHERE product_id = v_item.product_id AND code = v_item.lot_code AND quantity = 0;
      ELSE
        UPDATE product_lots
        SET quantity = GREATEST(0, COALESCE(quantity, 0) - v_item.quantity),
            cost = CASE WHEN GREATEST(0, COALESCE(quantity, 0) - v_item.quantity) > 0 THEN v_new_lot_cost ELSE COALESCE(cost, 0) END,
            updated_at = NOW()
        WHERE product_id = v_item.product_id AND code = v_item.lot_code;

        DELETE FROM product_lots
        WHERE product_id = v_item.product_id AND code = v_item.lot_code AND quantity <= 0;

        PERFORM sync_product_quantity_from_lots(v_item.product_id);
      END IF;

      SELECT id INTO v_ledger_lot_id
      FROM product_lots
      WHERE product_id = v_item.product_id AND code = v_item.lot_code
      LIMIT 1;
    END IF;

    INSERT INTO inventory_movements (
      product_id, movement_type, reference_type, reference_id, qty_before, qty_change, qty_after, lot_code, created_at
    ) VALUES (
      v_item.product_id, 'DELETE_IMPORT', 'RECEIPT', p_receipt_id, v_current_qty, -v_item.quantity, v_new_qty, v_item.lot_code, NOW()
    );

    -- Phase 7c: GHI BÚT TOÁN ĐẢO SỔ CÁI KHO
    v_qty_after := get_product_stock_balance(v_item.product_id, NULL);
    PERFORM insert_stock_ledger_entry(
      v_receipt.date,
      'Purchase Receipt'::TEXT,
      p_receipt_id,
      v_item.id::TEXT,
      v_item.product_id,
      v_ledger_lot_id,
      'Kho Chính'::TEXT,
      -v_item.quantity,
      v_qty_after,
      v_item.cost,
      v_item.cost,
      0::NUMERIC,
      'Xóa phiếu nhập',
      TRUE
    );

    v_affected_products := array_append(v_affected_products, v_item.product_id);
    v_total_removed_qty := v_total_removed_qty + v_item.quantity;
  END LOOP;

  IF v_receipt.debt_recorded > 0 AND v_receipt.supplier_id IS NOT NULL THEN
    UPDATE suppliers
    SET debt = GREATEST(0, debt - v_receipt.debt_recorded)
    WHERE id = v_receipt.supplier_id;
  END IF;

  DELETE FROM import_items WHERE receipt_id = p_receipt_id;
  DELETE FROM import_receipts WHERE id = p_receipt_id;

  PERFORM check_inventory_consistency(v_affected_products);

  RETURN jsonb_build_object(
    'receipt_id', p_receipt_id,
    'affected_products', to_jsonb(v_affected_products),
    'total_qty_removed', v_total_removed_qty,
    'status', 'completed_deleted'
  );
END;
$$;