CREATE OR REPLACE FUNCTION delete_disposal_with_restore(p_disposal_id TEXT)
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
  v_status TEXT;
  v_qty_after NUMERIC;
  v_valuation_rate NUMERIC;
BEGIN
  SELECT status INTO v_status
  FROM disposals
  WHERE id = p_disposal_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Phiếu xuất hủy không tồn tại';
  END IF;

  IF v_status = 'COMPLETED' THEN
    FOR v_item IN
      SELECT di.id, di.product_id, di.lot_id, di.quantity, di.reason
      FROM disposal_items di
      WHERE di.disposal_id = p_disposal_id
    LOOP
      IF v_item.lot_id IS NOT NULL THEN
        UPDATE product_lots AS pl
        SET quantity = pl.quantity + v_item.quantity
        WHERE pl.id = v_item.lot_id;

        PERFORM sync_product_quantity_from_lots(v_item.product_id);
      ELSE
        UPDATE products AS p
        SET quantity = p.quantity + v_item.quantity
        WHERE p.id = v_item.product_id;
      END IF;

      -- Phase 7c: GHI BÚT TOÁN ĐẢO SỔ CÁI KHO
      v_qty_after := get_product_stock_balance(v_item.product_id, NULL);
      v_valuation_rate := get_product_valuation_rate(v_item.product_id, v_item.lot_id);

      PERFORM insert_stock_ledger_entry(
        NOW(),
        'Stock Entry'::TEXT,
        p_disposal_id,
        v_item.id::TEXT,
        v_item.product_id,
        v_item.lot_id,
        'Kho Chính'::TEXT,
        v_item.quantity,
        v_qty_after,
        v_valuation_rate,
        v_valuation_rate,
        0::NUMERIC,
        COALESCE(v_item.reason, 'Xóa phiếu xuất hủy'),
        TRUE
      );
    END LOOP;
  END IF;

  DELETE FROM disposals WHERE id = p_disposal_id;
END;
$$ LANGUAGE plpgsql;