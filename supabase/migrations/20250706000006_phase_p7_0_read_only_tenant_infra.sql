-- P7.0: Read-only tenant infrastructure (§18.6)
-- Thêm trạng thái read_only, helper is_tenant_writable, và RLS guards cho các bảng nghiệp vụ.
-- SELECT giữ nguyên; INSERT/UPDATE/DELETE thêm điều kiện is_tenant_writable(tenant_id).
-- ponytail: một migration duy nhất, idempotent, để tránh rải logic read-only khắp nơi.

-- ============================================================================
-- 1. Schema: thêm 'read_only' vào CHECK constraint tenants.status
-- ============================================================================

-- archived đã có sau P1; ở đây chỉ thêm read_only.
-- ponytail: drop constraint tên cụ thể, không drop mọi CHECK constraint.
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_status_check;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_status_check
  CHECK (status IN ('active','suspended','trial','pending','archived','read_only'));

-- ============================================================================
-- 2. Helper: is_tenant_writable
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_tenant_writable(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id
      AND status IN ('active', 'trial')
  );
$$;

-- ============================================================================
-- 3. Cập nhật RLS INSERT/UPDATE/DELETE cho các bảng nghiệp vụ
--    SELECT giữ nguyên.
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- -------------------------------------------------------------------------
  -- Pattern A: admin/cashier create; only admin update/delete
  -- -------------------------------------------------------------------------
  FOREACH tbl IN ARRAY ARRAY['orders', 'customers']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_insert_by_role ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_update_by_role ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_delete_admin_only ON public.%I', tbl, tbl);

      EXECUTE format(
        'CREATE POLICY %I_insert_by_role ON public.%I FOR INSERT TO authenticated '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.user_tenant_role(tenant_id) IN (''admin'', ''cashier''))',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY %I_update_by_role ON public.%I FOR UPDATE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'') '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY %I_delete_admin_only ON public.%I FOR DELETE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );
    END IF;
  END LOOP;

  -- -------------------------------------------------------------------------
  -- Pattern B: admin/inventory_manager create; only admin update/delete
  -- -------------------------------------------------------------------------
  FOREACH tbl IN ARRAY ARRAY['products', 'import_receipts', 'inventory_counts', 'disposals', 'suppliers']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_insert_by_role ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_update_by_role ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_delete_admin_only ON public.%I', tbl, tbl);

      EXECUTE format(
        'CREATE POLICY %I_insert_by_role ON public.%I FOR INSERT TO authenticated '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.user_tenant_role(tenant_id) IN (''admin'', ''inventory_manager''))',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY %I_update_by_role ON public.%I FOR UPDATE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'') '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY %I_delete_admin_only ON public.%I FOR DELETE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );
    END IF;
  END LOOP;

  -- -------------------------------------------------------------------------
  -- Pattern C: admin-only config tables
  -- -------------------------------------------------------------------------
  FOREACH tbl IN ARRAY ARRAY['app_settings', 'einvoice_config', 'rank_configs', 'brands', 'categories', 'promotions', 'rewards']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_insert_admin_only ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_update_admin_only ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_delete_admin_only ON public.%I', tbl, tbl);

      EXECUTE format(
        'CREATE POLICY %I_insert_admin_only ON public.%I FOR INSERT TO authenticated '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY %I_update_admin_only ON public.%I FOR UPDATE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'') '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY %I_delete_admin_only ON public.%I FOR DELETE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );
    END IF;
  END LOOP;

  -- -------------------------------------------------------------------------
  -- Pattern D: generic tenant isolation (order_items, detail tables, misc)
  -- -------------------------------------------------------------------------
  FOREACH tbl IN ARRAY ARRAY[
    'order_items',
    'import_items',
    'inventory_count_items',
    'inventory_movements',
    'disposal_items',
    'product_lots',
    'stock_movements',
    'return_orders',
    'return_order_items',
    'supplier_exchanges',
    'supplier_exchange_return_items',
    'supplier_exchange_received_items',
    'einvoice_orders',
    'point_history',
    'processed_operations',
    'rank_history',
    'customer_payment_ledger',
    'supplier_payment_ledger'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS authenticated_full_access_temp ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON public.%I', tbl);

      EXECUTE format(
        'CREATE POLICY tenant_isolation_insert ON public.%I FOR INSERT TO authenticated '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id))',
        tbl
      );

      EXECUTE format(
        'CREATE POLICY tenant_isolation_update ON public.%I FOR UPDATE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id)) '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id))',
        tbl
      );

      EXECUTE format(
        'CREATE POLICY tenant_isolation_delete ON public.%I FOR DELETE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_writable(tenant_id) AND public.is_tenant_admin(tenant_id))',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 4. Guard process_checkout và process_checkout_tenant với TENANT_READ_ONLY
-- ============================================================================

-- ponytail: kiểm tra sớm để tránh bắt đầu transaction ghi khi tenant read-only.
CREATE OR REPLACE FUNCTION public.process_checkout(
  p_order JSONB,
  p_items JSONB DEFAULT '[]'::JSONB,
  p_deltas JSONB DEFAULT '[]'::JSONB,
  p_reward_deltas JSONB DEFAULT '[]'::JSONB,
  p_customer_update JSONB DEFAULT NULL::JSONB,
  p_point_history JSONB DEFAULT '[]'::JSONB,
  p_allow_negative BOOLEAN DEFAULT FALSE,
  p_op_id TEXT DEFAULT NULL::TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id        TEXT;
  v_customer_id     TEXT;
  v_item            JSONB;
  v_delta           JSONB;
  v_reward          JSONB;
  v_ph              JSONB;
  v_product         RECORD;
  v_reward_row      RECORD;
  v_lot             RECORD;
  v_lot_id          TEXT;
  v_deduct_qty      NUMERIC;
  v_new_qty         NUMERIC;
  v_new_stock       NUMERIC;
  v_add_spent       NUMERIC;
  v_add_debt        NUMERIC;
  v_add_points      NUMERIC;
  v_item_cost       NUMERIC;
  v_inserted_op     INTEGER;
  v_order_item_id   TEXT;
  v_idx             INTEGER;
  v_qty_after       NUMERIC;
  v_posting_date    TIMESTAMPTZ;
BEGIN
  IF NOT public.is_tenant_writable(public.current_tenant_id()) THEN
    RAISE EXCEPTION 'TENANT_READ_ONLY' USING ERRCODE = 'P0001';
  END IF;

  v_order_id := p_order->>'id';
  IF v_order_id IS NULL OR v_order_id = '' THEN
    RAISE EXCEPTION 'order.id is required';
  END IF;

  v_posting_date := COALESCE((p_order->>'date')::TIMESTAMPTZ, NOW());

  IF p_op_id IS NOT NULL AND p_op_id != '' THEN
    INSERT INTO public.processed_operations (op_id, op_type, ref_id, tenant_id)
    VALUES (p_op_id, 'checkout', v_order_id, public.current_tenant_id())
    ON CONFLICT (op_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted_op = ROW_COUNT;
    IF v_inserted_op = 0 THEN
      RETURN jsonb_build_object('ok', true, 'order_id', v_order_id, 'skipped', true, 'reason', 'op_id already processed');
    END IF;
  END IF;

  v_customer_id := p_order->>'customerId';
  IF v_customer_id IS NULL OR v_customer_id = '' OR v_customer_id = 'guest' THEN
    v_customer_id := NULL;
  END IF;

  IF p_op_id IS NOT NULL AND p_op_id != '' THEN
    INSERT INTO public.orders (
      id, date, customer_id, customer_name,
      total_amount, paid_amount, debt_recorded, payment_method,
      status, points_earned, points_redeemed, rewards_redeemed,
      applied_promotions, note, tenant_id
    ) VALUES (
      v_order_id, v_posting_date, v_customer_id, p_order->>'customerName',
      COALESCE((p_order->>'totalAmount')::NUMERIC, 0),
      COALESCE((p_order->>'paidAmount')::NUMERIC, 0),
      COALESCE((p_order->>'debtRecorded')::NUMERIC, 0),
      p_order->>'paymentMethod',
      COALESCE(p_order->>'status', 'completed'),
      COALESCE((p_order->>'pointsEarned')::NUMERIC, 0),
      COALESCE((p_order->>'pointsRedeemed')::NUMERIC, 0),
      COALESCE(p_order->'rewardsRedeemed', '[]'::jsonb),
      COALESCE(p_order->'appliedPromotions', '[]'::jsonb),
      p_order->>'note',
      public.current_tenant_id()
    );
  ELSE
    INSERT INTO public.orders (
      id, date, customer_id, customer_name,
      total_amount, paid_amount, debt_recorded, payment_method,
      status, points_earned, points_redeemed, rewards_redeemed,
      applied_promotions, note, tenant_id
    ) VALUES (
      v_order_id, v_posting_date, v_customer_id, p_order->>'customerName',
      COALESCE((p_order->>'totalAmount')::NUMERIC, 0),
      COALESCE((p_order->>'paidAmount')::NUMERIC, 0),
      COALESCE((p_order->>'debtRecorded')::NUMERIC, 0),
      p_order->>'paymentMethod',
      COALESCE(p_order->>'status', 'completed'),
      COALESCE((p_order->>'pointsEarned')::NUMERIC, 0),
      COALESCE((p_order->>'pointsRedeemed')::NUMERIC, 0),
      COALESCE(p_order->'rewardsRedeemed', '[]'::jsonb),
      COALESCE(p_order->'appliedPromotions', '[]'::jsonb),
      p_order->>'note',
      public.current_tenant_id()
    )
    ON CONFLICT (id) DO UPDATE SET
      date               = EXCLUDED.date,
      customer_id        = EXCLUDED.customer_id,
      customer_name      = EXCLUDED.customer_name,
      total_amount       = EXCLUDED.total_amount,
      paid_amount        = EXCLUDED.paid_amount,
      debt_recorded      = EXCLUDED.debt_recorded,
      payment_method     = EXCLUDED.payment_method,
      status             = EXCLUDED.status,
      points_earned      = EXCLUDED.points_earned,
      points_redeemed    = EXCLUDED.points_redeemed,
      rewards_redeemed   = EXCLUDED.rewards_redeemed,
      applied_promotions = EXCLUDED.applied_promotions,
      note               = EXCLUDED.note,
      tenant_id          = EXCLUDED.tenant_id;
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS tmp_phase7b_order_item_ids (
    idx INTEGER PRIMARY KEY,
    order_item_id TEXT
  ) ON COMMIT DROP;
  DELETE FROM tmp_phase7b_order_item_ids WHERE TRUE;

  DELETE FROM public.order_items WHERE order_id = v_order_id AND tenant_id = public.current_tenant_id();
  IF jsonb_typeof(p_items) = 'array' AND jsonb_array_length(p_items) > 0 THEN
    v_idx := 0;
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
      v_idx := v_idx + 1;
      v_item_cost := COALESCE(
        (v_item->>'cost')::NUMERIC,
        CASE
          WHEN NULLIF(v_item->>'lotId', '') IS NOT NULL THEN
            (SELECT cost FROM public.product_lots WHERE id = v_item->>'lotId' AND tenant_id = public.current_tenant_id())
          ELSE
            (SELECT cost FROM public.products WHERE id = v_item->>'productId' AND tenant_id = public.current_tenant_id())
        END,
        0
      );
      INSERT INTO public.order_items (
        order_id, product_id, product_name, quantity, unit_name, price,
        lot_id, lot_code, cost, tenant_id
      ) VALUES (
        v_order_id, v_item->>'productId', v_item->>'productName',
        COALESCE((v_item->>'quantity')::NUMERIC, 0), v_item->>'unitName',
        COALESCE((v_item->>'price')::NUMERIC, 0),
        NULLIF(v_item->>'lotId', ''), NULLIF(v_item->>'lotCode', ''),
        v_item_cost, public.current_tenant_id()
      ) RETURNING id INTO v_order_item_id;
      INSERT INTO tmp_phase7b_order_item_ids (idx, order_item_id)
      VALUES (v_idx, v_order_item_id);
    END LOOP;
  END IF;

  IF jsonb_typeof(p_deltas) = 'array' AND jsonb_array_length(p_deltas) > 0 THEN
    FOR v_delta IN SELECT * FROM jsonb_array_elements(p_deltas) LOOP
      v_deduct_qty := COALESCE((v_delta->>'deductBaseQty')::NUMERIC, 0);
      v_lot_id     := NULLIF(v_delta->>'lotId', '');
      IF v_deduct_qty <= 0 THEN CONTINUE; END IF;
      SELECT id, name, quantity, has_lots INTO v_product
      FROM public.products WHERE id = v_delta->>'productId' AND tenant_id = public.current_tenant_id() FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Sản phẩm % không tồn tại trong hệ thống', v_delta->>'productId';
      END IF;
      IF v_product.has_lots THEN
        IF v_lot_id IS NULL THEN
          RAISE EXCEPTION 'Sản phẩm "%" có quản lý lô, phải chọn lô khi bán', v_product.name
            USING ERRCODE = 'P0001';
        END IF;
        SELECT id, code, quantity INTO v_lot
        FROM public.product_lots WHERE id = v_lot_id AND product_id = v_product.id AND tenant_id = public.current_tenant_id() FOR UPDATE;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Lô % không tồn tại cho sản phẩm "%"', v_lot_id, v_product.name;
        END IF;
        v_new_qty := COALESCE(v_lot.quantity, 0) - v_deduct_qty;
        IF v_new_qty < 0 AND NOT p_allow_negative THEN
          RAISE EXCEPTION 'Tồn lô "%" của "%" không đủ (còn %, cần %)',
            v_lot.code, v_product.name, v_lot.quantity, v_deduct_qty
            USING ERRCODE = 'P0001';
        END IF;
        UPDATE public.product_lots SET quantity = v_new_qty, updated_at = NOW() WHERE id = v_lot.id AND tenant_id = public.current_tenant_id();
      ELSE
        v_new_qty := COALESCE(v_product.quantity, 0) - v_deduct_qty;
        IF v_new_qty < 0 AND NOT p_allow_negative THEN
          RAISE EXCEPTION 'Tồn kho không đủ cho "%" (còn %, cần %)',
            v_product.name, v_product.quantity, v_deduct_qty
            USING ERRCODE = 'P0001';
        END IF;
        UPDATE public.products SET quantity = v_new_qty WHERE id = v_product.id AND tenant_id = public.current_tenant_id();
      END IF;

      v_new_stock := COALESCE((SELECT quantity FROM public.products WHERE id = v_product.id AND tenant_id = public.current_tenant_id()), 0);
      v_qty_after := public.calc_qty_after_transaction(v_product.id, v_lot_id, -v_deduct_qty, public.current_tenant_id());
      PERFORM public.insert_stock_ledger_entry(
        v_posting_date, 'Sales Invoice', v_order_id, COALESCE(v_lot_id, v_product.id),
        v_product.id, v_lot_id, 'Kho Chính', -v_deduct_qty, v_qty_after, v_item_cost, v_item_cost, v_item_cost,
        'Bán hàng', FALSE, public.current_tenant_id()
      );
    END LOOP;
  END IF;

  IF jsonb_typeof(p_reward_deltas) = 'array' AND jsonb_array_length(p_reward_deltas) > 0 THEN
    FOR v_reward IN SELECT * FROM jsonb_array_elements(p_reward_deltas) LOOP
      UPDATE public.rewards
      SET redeemed_count = redeemed_count + COALESCE((v_reward->>'delta')::INTEGER, 0),
          updated_at = NOW()
      WHERE id = v_reward->>'rewardId' AND tenant_id = public.current_tenant_id();
    END LOOP;
  END IF;

  IF v_customer_id IS NOT NULL THEN
    v_add_spent := COALESCE((p_customer_update->>'addSpent')::NUMERIC, 0);
    v_add_debt  := COALESCE((p_customer_update->>'addDebt')::NUMERIC, 0);
    v_add_points := COALESCE((p_customer_update->>'addPoints')::NUMERIC, 0);

    IF v_add_spent > 0 OR v_add_debt <> 0 OR v_add_points <> 0 THEN
      UPDATE public.customers
      SET total_spent = COALESCE(total_spent, 0) + v_add_spent,
          debt = COALESCE(debt, 0) + v_add_debt,
          points = COALESCE(points, 0) + v_add_points,
          updated_at = NOW()
      WHERE id = v_customer_id AND tenant_id = public.current_tenant_id();
    END IF;

    IF v_add_debt <> 0 THEN
      PERFORM public.insert_customer_ledger_entry(
        v_customer_id, 'order', v_order_id, v_add_debt, 'Nợ từ đơn hàng', 'system', v_posting_date, public.current_tenant_id()
      );
    END IF;
  END IF;

  IF jsonb_typeof(p_point_history) = 'array' AND jsonb_array_length(p_point_history) > 0 THEN
    FOR v_ph IN SELECT * FROM jsonb_array_elements(p_point_history) LOOP
      INSERT INTO public.point_history (
        customer_id, type, amount, description, order_id, created_at, tenant_id
      ) VALUES (
        v_ph->>'customerId',
        v_ph->>'type',
        COALESCE((v_ph->>'amount')::NUMERIC, 0),
        v_ph->>'description',
        v_ph->>'orderId',
        COALESCE((v_ph->>'date')::TIMESTAMPTZ, NOW()),
        public.current_tenant_id()
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'order_id', v_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.process_checkout_tenant(
  p_tenant_id UUID,
  p_order JSONB,
  p_items JSONB DEFAULT '[]'::JSONB,
  p_deltas JSONB DEFAULT '[]'::JSONB,
  p_reward_deltas JSONB DEFAULT '[]'::JSONB,
  p_customer_update JSONB DEFAULT NULL::JSONB,
  p_point_history JSONB DEFAULT '[]'::JSONB,
  p_allow_negative BOOLEAN DEFAULT FALSE,
  p_op_id TEXT DEFAULT NULL::TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant          public.tenants%ROWTYPE;
  v_order_id        TEXT;
  v_customer_id     TEXT;
  v_item            JSONB;
  v_delta           JSONB;
  v_reward          JSONB;
  v_ph              JSONB;
  v_product         RECORD;
  v_reward_row      RECORD;
  v_lot             RECORD;
  v_lot_id          TEXT;
  v_deduct_qty      NUMERIC;
  v_new_qty         NUMERIC;
  v_new_stock       NUMERIC;
  v_add_spent       NUMERIC;
  v_add_debt        NUMERIC;
  v_add_points      NUMERIC;
  v_item_cost       NUMERIC;
  v_inserted_op     INTEGER;
  v_order_item_id   TEXT;
  v_idx             INTEGER;
  v_qty_after       NUMERIC;
  v_posting_date    TIMESTAMPTZ;
BEGIN
  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id is required';
  END IF;

  IF NOT public.is_tenant_writable(p_tenant_id) THEN
    RAISE EXCEPTION 'TENANT_READ_ONLY' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND OR v_tenant.status NOT IN ('active', 'trial') THEN
    RAISE EXCEPTION 'Tenant không hoạt động hoặc không tồn tại';
  END IF;

  v_order_id := p_order->>'id';
  IF v_order_id IS NULL OR v_order_id = '' THEN
    RAISE EXCEPTION 'order.id is required';
  END IF;

  v_posting_date := COALESCE((p_order->>'date')::TIMESTAMPTZ, NOW());

  IF p_op_id IS NOT NULL AND p_op_id != '' THEN
    INSERT INTO public.processed_operations (op_id, op_type, ref_id, tenant_id)
    VALUES (p_op_id, 'checkout', v_order_id, p_tenant_id)
    ON CONFLICT (op_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted_op = ROW_COUNT;
    IF v_inserted_op = 0 THEN
      RETURN jsonb_build_object('ok', true, 'order_id', v_order_id, 'skipped', true, 'reason', 'op_id already processed');
    END IF;
  END IF;

  v_customer_id := p_order->>'customerId';
  IF v_customer_id IS NULL OR v_customer_id = '' OR v_customer_id = 'guest' THEN
    v_customer_id := NULL;
  END IF;

  IF v_customer_id IS NOT NULL THEN
    PERFORM 1 FROM public.customers WHERE id = v_customer_id AND tenant_id = p_tenant_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Khách hàng không thuộc tenant này';
    END IF;
  END IF;

  IF p_op_id IS NOT NULL AND p_op_id != '' THEN
    INSERT INTO public.orders (
      id, date, customer_id, customer_name,
      total_amount, paid_amount, debt_recorded, payment_method,
      status, points_earned, points_redeemed, rewards_redeemed,
      applied_promotions, note, tenant_id
    ) VALUES (
      v_order_id, v_posting_date, v_customer_id, p_order->>'customerName',
      COALESCE((p_order->>'totalAmount')::NUMERIC, 0),
      COALESCE((p_order->>'paidAmount')::NUMERIC, 0),
      COALESCE((p_order->>'debtRecorded')::NUMERIC, 0),
      p_order->>'paymentMethod',
      COALESCE(p_order->>'status', 'completed'),
      COALESCE((p_order->>'pointsEarned')::NUMERIC, 0),
      COALESCE((p_order->>'pointsRedeemed')::NUMERIC, 0),
      COALESCE(p_order->'rewardsRedeemed', '[]'::jsonb),
      COALESCE(p_order->'appliedPromotions', '[]'::jsonb),
      p_order->>'note',
      p_tenant_id
    );
  ELSE
    INSERT INTO public.orders (
      id, date, customer_id, customer_name,
      total_amount, paid_amount, debt_recorded, payment_method,
      status, points_earned, points_redeemed, rewards_redeemed,
      applied_promotions, note, tenant_id
    ) VALUES (
      v_order_id, v_posting_date, v_customer_id, p_order->>'customerName',
      COALESCE((p_order->>'totalAmount')::NUMERIC, 0),
      COALESCE((p_order->>'paidAmount')::NUMERIC, 0),
      COALESCE((p_order->>'debtRecorded')::NUMERIC, 0),
      p_order->>'paymentMethod',
      COALESCE(p_order->>'status', 'completed'),
      COALESCE((p_order->>'pointsEarned')::NUMERIC, 0),
      COALESCE((p_order->>'pointsRedeemed')::NUMERIC, 0),
      COALESCE(p_order->'rewardsRedeemed', '[]'::jsonb),
      COALESCE(p_order->'appliedPromotions', '[]'::jsonb),
      p_order->>'note',
      p_tenant_id
    )
    ON CONFLICT (id) DO UPDATE SET
      date               = EXCLUDED.date,
      customer_id        = EXCLUDED.customer_id,
      customer_name      = EXCLUDED.customer_name,
      total_amount       = EXCLUDED.total_amount,
      paid_amount        = EXCLUDED.paid_amount,
      debt_recorded      = EXCLUDED.debt_recorded,
      payment_method     = EXCLUDED.payment_method,
      status             = EXCLUDED.status,
      points_earned      = EXCLUDED.points_earned,
      points_redeemed    = EXCLUDED.points_redeemed,
      rewards_redeemed   = EXCLUDED.rewards_redeemed,
      applied_promotions = EXCLUDED.applied_promotions,
      note               = EXCLUDED.note,
      tenant_id          = EXCLUDED.tenant_id;
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS tmp_phase7b_order_item_ids (
    idx INTEGER PRIMARY KEY,
    order_item_id TEXT
  ) ON COMMIT DROP;
  DELETE FROM tmp_phase7b_order_item_ids WHERE TRUE;

  DELETE FROM public.order_items WHERE order_id = v_order_id AND tenant_id = p_tenant_id;
  IF jsonb_typeof(p_items) = 'array' AND jsonb_array_length(p_items) > 0 THEN
    v_idx := 0;
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
      v_idx := v_idx + 1;
      v_item_cost := COALESCE(
        (v_item->>'cost')::NUMERIC,
        CASE
          WHEN NULLIF(v_item->>'lotId', '') IS NOT NULL THEN
            (SELECT cost FROM public.product_lots WHERE id = v_item->>'lotId' AND tenant_id = p_tenant_id)
          ELSE
            (SELECT cost FROM public.products WHERE id = v_item->>'productId' AND tenant_id = p_tenant_id)
        END,
        0
      );
      INSERT INTO public.order_items (
        order_id, product_id, product_name, quantity, unit_name, price,
        lot_id, lot_code, cost, tenant_id
      ) VALUES (
        v_order_id, v_item->>'productId', v_item->>'productName',
        COALESCE((v_item->>'quantity')::NUMERIC, 0), v_item->>'unitName',
        COALESCE((v_item->>'price')::NUMERIC, 0),
        NULLIF(v_item->>'lotId', ''), NULLIF(v_item->>'lotCode', ''),
        v_item_cost, p_tenant_id
      ) RETURNING id INTO v_order_item_id;
      INSERT INTO tmp_phase7b_order_item_ids (idx, order_item_id)
      VALUES (v_idx, v_order_item_id);
    END LOOP;
  END IF;

  IF jsonb_typeof(p_deltas) = 'array' AND jsonb_array_length(p_deltas) > 0 THEN
    FOR v_delta IN SELECT * FROM jsonb_array_elements(p_deltas) LOOP
      v_deduct_qty := COALESCE((v_delta->>'deductBaseQty')::NUMERIC, 0);
      v_lot_id     := NULLIF(v_delta->>'lotId', '');
      IF v_deduct_qty <= 0 THEN CONTINUE; END IF;
      SELECT id, name, quantity, has_lots INTO v_product
      FROM public.products WHERE id = v_delta->>'productId' AND tenant_id = p_tenant_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Sản phẩm % không tồn tại trong hệ thống', v_delta->>'productId';
      END IF;
      IF v_product.has_lots THEN
        IF v_lot_id IS NULL THEN
          RAISE EXCEPTION 'Sản phẩm "%" có quản lý lô, phải chọn lô khi bán', v_product.name
            USING ERRCODE = 'P0001';
        END IF;
        SELECT id, code, quantity INTO v_lot
        FROM public.product_lots WHERE id = v_lot_id AND product_id = v_product.id AND tenant_id = p_tenant_id FOR UPDATE;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Lô % không tồn tại cho sản phẩm "%"', v_lot_id, v_product.name;
        END IF;
        v_new_qty := COALESCE(v_lot.quantity, 0) - v_deduct_qty;
        IF v_new_qty < 0 AND NOT p_allow_negative THEN
          RAISE EXCEPTION 'Tồn lô "%" của "%" không đủ (còn %, cần %)',
            v_lot.code, v_product.name, v_lot.quantity, v_deduct_qty
            USING ERRCODE = 'P0001';
        END IF;
        UPDATE public.product_lots SET quantity = v_new_qty, updated_at = NOW() WHERE id = v_lot.id AND tenant_id = p_tenant_id;
      ELSE
        v_new_qty := COALESCE(v_product.quantity, 0) - v_deduct_qty;
        IF v_new_qty < 0 AND NOT p_allow_negative THEN
          RAISE EXCEPTION 'Tồn kho không đủ cho "%" (còn %, cần %)',
            v_product.name, v_product.quantity, v_deduct_qty
            USING ERRCODE = 'P0001';
        END IF;
        UPDATE public.products SET quantity = v_new_qty WHERE id = v_product.id AND tenant_id = p_tenant_id;
      END IF;

      v_new_stock := COALESCE((SELECT quantity FROM public.products WHERE id = v_product.id AND tenant_id = p_tenant_id), 0);
      v_qty_after := public.calc_qty_after_transaction(v_product.id, v_lot_id, -v_deduct_qty, p_tenant_id);
      PERFORM public.insert_stock_ledger_entry(
        v_posting_date, 'Sales Invoice', v_order_id, COALESCE(v_lot_id, v_product.id),
        v_product.id, v_lot_id, 'Kho Chính', -v_deduct_qty, v_qty_after, v_item_cost, v_item_cost, v_item_cost,
        'Bán hàng', FALSE, p_tenant_id
      );
    END LOOP;
  END IF;

  IF jsonb_typeof(p_reward_deltas) = 'array' AND jsonb_array_length(p_reward_deltas) > 0 THEN
    FOR v_reward IN SELECT * FROM jsonb_array_elements(p_reward_deltas) LOOP
      UPDATE public.rewards
      SET redeemed_count = redeemed_count + COALESCE((v_reward->>'delta')::INTEGER, 0),
          updated_at = NOW()
      WHERE id = v_reward->>'rewardId' AND tenant_id = p_tenant_id;
    END LOOP;
  END IF;

  IF v_customer_id IS NOT NULL THEN
    v_add_spent := COALESCE((p_customer_update->>'addSpent')::NUMERIC, 0);
    v_add_debt  := COALESCE((p_customer_update->>'addDebt')::NUMERIC, 0);
    v_add_points := COALESCE((p_customer_update->>'addPoints')::NUMERIC, 0);

    IF v_add_spent > 0 OR v_add_debt <> 0 OR v_add_points <> 0 THEN
      UPDATE public.customers
      SET total_spent = COALESCE(total_spent, 0) + v_add_spent,
          debt = COALESCE(debt, 0) + v_add_debt,
          points = COALESCE(points, 0) + v_add_points,
          updated_at = NOW()
      WHERE id = v_customer_id AND tenant_id = p_tenant_id;
    END IF;

    IF v_add_debt <> 0 THEN
      PERFORM public.insert_customer_ledger_entry(
        v_customer_id, 'order', v_order_id, v_add_debt, 'Nợ từ đơn hàng', 'system', v_posting_date, p_tenant_id
      );
    END IF;
  END IF;

  IF jsonb_typeof(p_point_history) = 'array' AND jsonb_array_length(p_point_history) > 0 THEN
    FOR v_ph IN SELECT * FROM jsonb_array_elements(p_point_history) LOOP
      INSERT INTO public.point_history (
        customer_id, type, amount, description, order_id, created_at, tenant_id
      ) VALUES (
        v_ph->>'customerId',
        v_ph->>'type',
        COALESCE((v_ph->>'amount')::NUMERIC, 0),
        v_ph->>'description',
        v_ph->>'orderId',
        COALESCE((v_ph->>'date')::TIMESTAMPTZ, NOW()),
        p_tenant_id
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'order_id', v_order_id);
END;
$$;

-- ============================================================================
-- 5. Cập nhật P1 RPCs để chấp nhận trạng thái read_only
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_tenant_status(
  p_tenant_id UUID,
  p_status TEXT
)
RETURNS public.tenants
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_tenant public.tenants;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật trạng thái tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('active', 'suspended', 'trial', 'pending', 'archived', 'read_only') THEN
    RAISE EXCEPTION 'Trạng thái tenant không hợp lệ: %', p_status;
  END IF;

  UPDATE public.tenants
  SET status = p_status,
      updated_at = now(),
      archived_at = CASE WHEN p_status = 'archived' THEN now() ELSE NULL END
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN v_tenant;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_tenant(
  p_tenant_id UUID,
  p_name TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
) RETURNS public.tenants LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_tenant public.tenants;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_name IS NOT NULL AND TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'Tên cửa hàng không được để trống';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('free', 'vip') THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('active', 'suspended', 'trial', 'pending', 'archived', 'read_only') THEN
    RAISE EXCEPTION 'Trạng thái tenant không hợp lệ: %', p_status;
  END IF;

  UPDATE public.tenants
  SET name = COALESCE(NULLIF(TRIM(p_name), ''), name),
      plan = COALESCE(p_plan, plan),
      status = COALESCE(p_status, status),
      updated_at = now(),
      archived_at = CASE WHEN COALESCE(p_status, status) = 'archived' THEN COALESCE(archived_at, now())
                         WHEN p_status IS NOT NULL AND p_status <> 'archived' THEN NULL
                         ELSE archived_at END
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN v_tenant;
END;
$$;
