-- =========================================================
-- 6b. Patch business RPCs (group 2: returns, disposals, counts)
-- =========================================================
DO $$
DECLARE
  v_funcdef TEXT;
  v_newdef  TEXT;
BEGIN
  -- cancel_return_order_v2 (cancel Sales Return)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'cancel_return_order_v2';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_item.lot_id, -v_item.quantity);');
  EXECUTE v_newdef;

  -- complete_disposal (Stock Entry - disposal)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'complete_disposal';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_item.lot_id, -v_item.quantity);');
  EXECUTE v_newdef;

  -- delete_disposal_with_restore (cancel disposal)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'delete_disposal_with_restore';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_item.lot_id, v_item.quantity);');
  EXECUTE v_newdef;

  -- complete_inventory_count (Stock Reconciliation)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'complete_inventory_count';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(item.product_id, v_ledger_lot_id, v_ledger_qty);');
  EXECUTE v_newdef;
END $$;
