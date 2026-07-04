-- =========================================================
-- 6c. Patch business RPCs (group 3: supplier exchange, customer exchange)
-- =========================================================
DO $$
DECLARE
  v_funcdef TEXT;
  v_newdef  TEXT;
BEGIN
  -- cancel_inventory_count_rpc (cancel Stock Reconciliation)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'cancel_inventory_count_rpc';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(item.product_id, v_lot_id, -v_diff);');
  EXECUTE v_newdef;

  -- cancel_supplier_exchange: uses two-step product-level balance
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'cancel_supplier_exchange';
  v_newdef := replace(v_funcdef,
    E'    -- Phase 6b: GHI BÚT TOÁN ĐẢO KHO — HÀNG TRẢ\n    IF v_stock_lot_id IS NOT NULL THEN\n      v_stock_qty_before := COALESCE(get_product_stock_balance(v_return_item.product_id, NULL), 0);\n      v_stock_qty_after := v_stock_qty_before - v_return_item.quantity;',
    E'    -- Phase 6b: GHI BÚT TOÁN ĐẢO KHO — HÀNG TRẢ\n    IF v_stock_lot_id IS NOT NULL THEN\n      v_stock_qty_after := public.calc_qty_after_transaction(v_return_item.product_id, v_stock_lot_id, -v_return_item.quantity);');
  v_newdef := replace(v_newdef,
    E'    -- Phase 6b: GHI BÚT TOÁN ĐẢO KHO — HÀNG NHẬN ĐỔI\n    IF v_stock_lot_id IS NOT NULL THEN\n      v_stock_qty_before := COALESCE(get_product_stock_balance(v_received_item.product_id, NULL), 0);\n      v_stock_qty_after := v_stock_qty_before + v_received_item.quantity;',
    E'    -- Phase 6b: GHI BÚT TOÁN ĐẢO KHO — HÀNG NHẬN ĐỔI\n    IF v_stock_lot_id IS NOT NULL THEN\n      v_stock_qty_after := public.calc_qty_after_transaction(v_received_item.product_id, v_stock_lot_id, v_received_item.quantity);');
  EXECUTE v_newdef;

  -- create_exchange_transaction: two ledger sections (return + exchange sale)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'create_exchange_transaction';
  v_newdef := replace(v_funcdef,
    E'      -- Phase 7c: GHI BÚT TOÁN SỔ CÁI KHO — TRẢ\n      v_qty_after := get_product_stock_balance(v_product_id, NULL);',
    E'      -- Phase 7c: GHI BÚT TOÁN SỔ CÁI KHO — TRẢ\n      v_qty_after := public.calc_qty_after_transaction(v_product_id, v_lot_id, v_qty);');
  v_newdef := replace(v_newdef,
    E'      -- Phase 7c: GHI BÚT TOÁN SỔ CÁI KHO — BÁN\n      v_qty_after := get_product_stock_balance(v_product_id, NULL);',
    E'      -- Phase 7c: GHI BÚT TOÁN SỔ CÁI KHO — BÁN\n      v_qty_after := public.calc_qty_after_transaction(v_product_id, v_ex_lot_id, -v_qty);');
  EXECUTE v_newdef;
END $$;
