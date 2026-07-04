-- =========================================================
-- 6a. Patch business RPCs (group 1: checkout, import, return)
-- =========================================================
DO $$
DECLARE
  v_funcdef TEXT;
  v_newdef  TEXT;
BEGIN
  -- process_checkout (Sales Invoice)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'process_checkout';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_item->>''productId'', NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_item->>''productId'', v_lot_id, -COALESCE((v_item->>''quantity'')::NUMERIC, 0));');
  EXECUTE v_newdef;

  -- process_import_v2 (Purchase Receipt)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'process_import_v2';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_ledger_lot_id, v_item.quantity);');
  EXECUTE v_newdef;

  -- delete_import_v2 (cancel Purchase Receipt)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'delete_import_v2';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_item.product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_ledger_lot_id, -v_item.quantity);');
  EXECUTE v_newdef;

  -- update_import_v2 is covered because it calls delete_import_v2 + process_import_v2

  -- create_return_order (Sales Return)
  SELECT pg_get_functiondef(oid) INTO v_funcdef FROM pg_proc WHERE proname = 'create_return_order';
  v_newdef := replace(v_funcdef,
    'v_qty_after := get_product_stock_balance(v_product_id, NULL);',
    'v_qty_after := public.calc_qty_after_transaction(v_product_id, v_lot_id, v_qty);');
  EXECUTE v_newdef;
END $$;
