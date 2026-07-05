-- Phase 10.1 — Role-based RLS policy test
-- Run inside a transaction; rolls back automatically so test data is never persisted.
-- Note: UPDATE/DELETE are rejected by RLS through zero rows affected (not an exception),
--       because the USING expression hides the row from non-admin users.

BEGIN;

DO $$
DECLARE
  v_tenant_id UUID := '1bae028e-5941-4a0d-9089-d1263ee5ef64';
  admin_user UUID := '64d25af2-a592-4dd4-b1ff-365e7116e372';
  cashier_user UUID := '0143e511-8355-4c69-a665-8b8ec90b4800';
  accountant_user UUID := 'e066fa59-556d-4ee2-8b68-8c55c601ab14';
  inventory_user UUID := '55c2fc2f-c675-4680-b692-4d0a28a9fade';

  prod_id TEXT := 'PHASE101-PROD';
  cust_id TEXT := 'PHASE101-CUST';
  supplier_id TEXT := 'PHASE101-SUPPLIER';
  order_id TEXT := 'PHASE101-ORDER';
  import_id TEXT := 'PHASE101-IMPORT';
  count_id TEXT := 'PHASE101-COUNT';
  disposal_id TEXT := 'PHASE101-DISPOSAL';
  setting_id TEXT := 'PHASE101-SETTING';

  v_count INT;
  ok BOOLEAN;
BEGIN
  -- Ensure test users exist and have expected roles (idempotent)
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES
    (v_tenant_id, cashier_user, 'cashier'),
    (v_tenant_id, accountant_user, 'accountant'),
    (v_tenant_id, inventory_user, 'inventory_manager')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Seed shared test data as postgres (bypasses RLS via postgres role)
  INSERT INTO public.products (id, name, sku, tenant_id, has_lots)
  VALUES (prod_id, 'Phase 10.1 Product', 'PHASE101', v_tenant_id, false);

  INSERT INTO public.customers (id, name, tenant_id)
  VALUES (cust_id, 'Phase 10.1 Customer', v_tenant_id);

  INSERT INTO public.suppliers (id, name, tenant_id)
  VALUES (supplier_id, 'Phase 10.1 Supplier', v_tenant_id);

  INSERT INTO public.orders (id, tenant_id, order_code, customer_id, total_amount, status, payment_method, date, has_return, total_returned_amount, total_returned_count)
  VALUES (order_id, v_tenant_id, order_id, cust_id, 100000, 'completed', 'cash', now(), false, 0, 0);

  INSERT INTO public.import_receipts (id, tenant_id, invoice_number, supplier_id, total_cost, status, date)
  VALUES (import_id, v_tenant_id, 'INV-PHASE101', supplier_id, 500000, 'completed', now());

  INSERT INTO public.inventory_counts (id, tenant_id, code, status, date)
  VALUES (count_id, v_tenant_id, 'COUNT-PHASE101', 'draft', now());

  INSERT INTO public.disposals (id, tenant_id, code, status, date)
  VALUES (disposal_id, v_tenant_id, 'DISP-PHASE101', 'DRAFT', now());

  INSERT INTO public.app_settings (id, tenant_id, allow_negative_stock)
  VALUES (setting_id, v_tenant_id, false);

  -- Switch to the authenticated role so RLS policies fire
  SET ROLE authenticated;

  -- ========== CASHIER ==========
  PERFORM set_config('request.jwt.claims', json_build_object('sub', cashier_user)::text, true);
  PERFORM set_config('request.headers', json_build_object('x-tenant-id', v_tenant_id)::text, true);

  -- Cashier can create an order
  ok := false;
  BEGIN
    INSERT INTO public.orders (id, tenant_id, order_code, customer_id, total_amount, status, payment_method, date, has_return, total_returned_amount, total_returned_count)
    VALUES ('PHASE101-ORDER-CASHIER', v_tenant_id, 'PHASE101-ORDER-CASHIER', cust_id, 200000, 'completed', 'cash', now(), false, 0, 0);
    ok := true;
  EXCEPTION WHEN insufficient_privilege THEN ok := false;
  END;
  RAISE NOTICE 'Cashier create order: %', ok;
  ASSERT ok, 'Cashier should be able to create an order';

  -- Cashier cannot update an order (row is hidden, 0 rows affected)
  UPDATE public.orders SET total_amount = 999999 WHERE id = order_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Cashier update order rows affected: %', v_count;
  ASSERT v_count = 0, 'Cashier should NOT be able to update an order';

  -- Cashier cannot delete an order (row is hidden, 0 rows affected)
  DELETE FROM public.orders WHERE id = order_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Cashier delete order rows affected: %', v_count;
  ASSERT v_count = 0, 'Cashier should NOT be able to delete an order';

  -- Cashier can create a customer
  ok := false;
  BEGIN
    INSERT INTO public.customers (id, name, tenant_id)
    VALUES ('PHASE101-CUST-CASHIER', 'Cashier Customer', v_tenant_id);
    ok := true;
  EXCEPTION WHEN insufficient_privilege THEN ok := false;
  END;
  RAISE NOTICE 'Cashier create customer: %', ok;
  ASSERT ok, 'Cashier should be able to create a customer';

  -- Cashier cannot update a customer
  UPDATE public.customers SET name = 'Hacked' WHERE id = cust_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Cashier update customer rows affected: %', v_count;
  ASSERT v_count = 0, 'Cashier should NOT be able to update a customer';

  -- ========== ACCOUNTANT ==========
  PERFORM set_config('request.jwt.claims', json_build_object('sub', accountant_user)::text, true);
  PERFORM set_config('request.headers', json_build_object('x-tenant-id', v_tenant_id)::text, true);

  -- Accountant cannot create an order (WITH CHECK fails → exception)
  ok := true;
  BEGIN
    INSERT INTO public.orders (id, tenant_id, order_code, customer_id, total_amount, status, payment_method, date, has_return, total_returned_amount, total_returned_count)
    VALUES ('PHASE101-ORDER-ACCOUNTANT', v_tenant_id, 'PHASE101-ORDER-ACCOUNTANT', cust_id, 300000, 'completed', 'cash', now(), false, 0, 0);
    ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  RAISE NOTICE 'Accountant create order rejected: %', ok;
  ASSERT ok, 'Accountant should NOT be able to create an order';

  -- Accountant cannot update an order
  UPDATE public.orders SET total_amount = 1 WHERE id = order_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Accountant update order rows affected: %', v_count;
  ASSERT v_count = 0, 'Accountant should NOT be able to update an order';

  -- ========== INVENTORY MANAGER ==========
  PERFORM set_config('request.jwt.claims', json_build_object('sub', inventory_user)::text, true);
  PERFORM set_config('request.headers', json_build_object('x-tenant-id', v_tenant_id)::text, true);

  -- Inventory manager can create an import receipt
  ok := false;
  BEGIN
    INSERT INTO public.import_receipts (id, tenant_id, invoice_number, supplier_id, total_cost, status, date)
    VALUES ('PHASE101-IMPORT-INV', v_tenant_id, 'INV-PHASE101-INV', supplier_id, 100000, 'draft', now());
    ok := true;
  EXCEPTION WHEN insufficient_privilege THEN ok := false;
  END;
  RAISE NOTICE 'Inventory manager create import receipt: %', ok;
  ASSERT ok, 'Inventory manager should be able to create an import receipt';

  -- Inventory manager cannot update an import receipt
  UPDATE public.import_receipts SET total_cost = 1 WHERE id = import_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Inventory manager update import receipt rows affected: %', v_count;
  ASSERT v_count = 0, 'Inventory manager should NOT be able to update an import receipt';

  -- Inventory manager cannot delete an import receipt
  DELETE FROM public.import_receipts WHERE id = import_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Inventory manager delete import receipt rows affected: %', v_count;
  ASSERT v_count = 0, 'Inventory manager should NOT be able to delete an import receipt';

  -- Inventory manager can create a supplier
  ok := false;
  BEGIN
    INSERT INTO public.suppliers (id, name, tenant_id)
    VALUES ('PHASE101-SUPPLIER-INV', 'Inventory Supplier', v_tenant_id);
    ok := true;
  EXCEPTION WHEN insufficient_privilege THEN ok := false;
  END;
  RAISE NOTICE 'Inventory manager create supplier: %', ok;
  ASSERT ok, 'Inventory manager should be able to create a supplier';

  -- Inventory manager cannot create an order
  ok := true;
  BEGIN
    INSERT INTO public.orders (id, tenant_id, order_code, customer_id, total_amount, status, payment_method, date, has_return, total_returned_amount, total_returned_count)
    VALUES ('PHASE101-ORDER-INV', v_tenant_id, 'PHASE101-ORDER-INV', cust_id, 400000, 'completed', 'cash', now(), false, 0, 0);
    ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  RAISE NOTICE 'Inventory manager create order rejected: %', ok;
  ASSERT ok, 'Inventory manager should NOT be able to create an order';

  -- ========== ADMIN ==========
  PERFORM set_config('request.jwt.claims', json_build_object('sub', admin_user)::text, true);
  PERFORM set_config('request.headers', json_build_object('x-tenant-id', v_tenant_id)::text, true);

  -- Admin can update a product
  UPDATE public.products SET name = 'Phase 10.1 Product Updated' WHERE id = prod_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Admin update product rows affected: %', v_count;
  ASSERT v_count = 1, 'Admin should be able to update a product';

  -- Admin can delete a product
  DELETE FROM public.products WHERE id = prod_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Admin delete product rows affected: %', v_count;
  ASSERT v_count = 1, 'Admin should be able to delete a product';

  -- Admin can update app_settings
  UPDATE public.app_settings SET store_name = 'Admin Store' WHERE id = setting_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Admin update app_settings rows affected: %', v_count;
  ASSERT v_count = 1, 'Admin should be able to update app_settings';

  -- Cashier cannot update app_settings
  PERFORM set_config('request.jwt.claims', json_build_object('sub', cashier_user)::text, true);
  PERFORM set_config('request.headers', json_build_object('x-tenant-id', v_tenant_id)::text, true);
  UPDATE public.app_settings SET store_name = 'Hacked' WHERE id = setting_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Cashier update app_settings rows affected: %', v_count;
  ASSERT v_count = 0, 'Cashier should NOT be able to update app_settings';

  RESET ROLE;
  RAISE NOTICE 'Phase 10.1 role-based policy test PASSED';
END $$;

ROLLBACK;
