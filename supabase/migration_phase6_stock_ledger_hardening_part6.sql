-- =========================================================
-- 7. Verification: no business RPC should still use
--    get_product_stock_balance for the ledger qty_after.
-- =========================================================
DO $$
DECLARE
  v_remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM pg_proc
  WHERE proname IN (
    'process_checkout','process_import_v2','delete_import_v2','create_return_order',
    'cancel_return_order_v2','complete_disposal','delete_disposal_with_restore',
    'create_exchange_transaction','complete_inventory_count','cancel_inventory_count_rpc',
    'cancel_supplier_exchange'
  )
  AND prosrc LIKE '%get_product_stock_balance%'
  AND proname <> 'update_import_v2'; -- update_import_v2 delegates to delete+process

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Phase 6 patch incomplete: % business RPCs still call get_product_stock_balance', v_remaining;
  END IF;
END $$;