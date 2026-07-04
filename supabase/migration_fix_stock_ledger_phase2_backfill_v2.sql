-- =========================================================
-- SSOT — Single Source of Truth for stock ledger backfill
-- File:    migration_fix_stock_ledger_phase2_backfill_v2.sql
-- Purpose: Rebuild public.stock_movements correctly by lot so that:
--            products.quantity = SUM(product_lots.quantity) = SUM(stock_movements.actual_qty)
--            and qty_after_transaction is the true running total per (product_id, lot_id).
-- Options chosen during design: 1-B, 2-A, 3-A
-- When to run: Production truncate + backfill (already executed in Phase 3).
-- WARNING: Do NOT run again on production after the backfill is complete
--          unless you intentionally need to rebuild + have a fresh backup.
-- Old/obsolete migrations (e.g. archive/migration_phase5_backfill_stock_ledger.sql)
-- are marked DO-NOT-RUN — this file is the only SSOT for backfill.
-- =========================================================
-- Phase 2 — Fix Stock Ledger Recovery

-- =========================================================
-- 1. Fix idempotency guard in insert_stock_ledger_entry
-- =========================================================
CREATE OR REPLACE FUNCTION public.insert_stock_ledger_entry(
  p_posting_date timestamp with time zone,
  p_voucher_type text,
  p_voucher_no text,
  p_voucher_detail_no text,
  p_product_id text,
  p_lot_id text,
  p_warehouse text,
  p_actual_qty numeric,
  p_qty_after_transaction numeric,
  p_valuation_rate numeric,
  p_incoming_rate numeric,
  p_outgoing_rate numeric,
  p_reason text,
  p_is_cancelled boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Idempotency: skip if the exact (voucher_type, voucher_detail_no, is_cancelled, lot_id) row exists.
  IF EXISTS (
    SELECT 1 FROM stock_movements
    WHERE voucher_type = p_voucher_type
      AND voucher_detail_no = p_voucher_detail_no
      AND is_cancelled = p_is_cancelled
      AND lot_id IS NOT DISTINCT FROM p_lot_id
    LIMIT 1
  ) THEN
    RETURN;
  END IF;

  INSERT INTO stock_movements (
    posting_date, voucher_type, voucher_no, voucher_detail_no,
    product_id, lot_id, warehouse, actual_qty, qty_after_transaction,
    valuation_rate, incoming_rate, outgoing_rate, stock_value, balance_value,
    reason, is_cancelled
  ) VALUES (
    p_posting_date, p_voucher_type, p_voucher_no, p_voucher_detail_no,
    p_product_id, p_lot_id, COALESCE(p_warehouse, 'Kho Chính'),
    p_actual_qty, p_qty_after_transaction,
    COALESCE(p_valuation_rate, 0),
    COALESCE(p_incoming_rate, 0),
    COALESCE(p_outgoing_rate, 0),
    p_actual_qty * COALESCE(p_valuation_rate, 0),
    p_qty_after_transaction * COALESCE(p_valuation_rate, 0),
    p_reason,
    COALESCE(p_is_cancelled, FALSE)
  );
END;
$$;

-- =========================================================
-- 2. Helper: resolve a lot_id for a product
-- =========================================================
CREATE OR REPLACE FUNCTION public.backfill_v2_resolve_lot(
  p_product_id text,
  p_lot_id text DEFAULT NULL,
  p_lot_code text DEFAULT NULL,
  p_expiry_date date DEFAULT NULL,
  p_direction text DEFAULT 'fifo'
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_lot_id text;
BEGIN
  -- 1. If the proposed lot_id is valid for this product, use it.
  IF p_lot_id IS NOT NULL THEN
    SELECT id INTO v_lot_id
    FROM public.product_lots
    WHERE id = p_lot_id AND product_id = p_product_id
    LIMIT 1;
  END IF;

  -- 2. Try to match by lot_code (and expiry_date if supplied).
  IF v_lot_id IS NULL AND p_lot_code IS NOT NULL THEN
    IF p_expiry_date IS NOT NULL THEN
      SELECT id INTO v_lot_id
      FROM public.product_lots
      WHERE product_id = p_product_id
        AND code = p_lot_code
        AND expiry_date IS NOT DISTINCT FROM p_expiry_date
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;

    IF v_lot_id IS NULL THEN
      SELECT id INTO v_lot_id
      FROM public.product_lots
      WHERE product_id = p_product_id
        AND code = p_lot_code
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;
  END IF;

  -- 3. If there is exactly one lot for this product, use it.
  IF v_lot_id IS NULL THEN
    IF (SELECT COUNT(*) FROM public.product_lots WHERE product_id = p_product_id) = 1 THEN
      SELECT id INTO v_lot_id FROM public.product_lots WHERE product_id = p_product_id;
    END IF;
  END IF;

  -- 4. Fallback to FIFO or FEFO across the product's lots.
  IF v_lot_id IS NULL THEN
    IF p_direction = 'fifo' THEN
      SELECT id INTO v_lot_id
      FROM public.product_lots
      WHERE product_id = p_product_id
      ORDER BY expiry_date ASC NULLS LAST, created_at ASC
      LIMIT 1;
    ELSIF p_direction = 'fefo' THEN
      SELECT id INTO v_lot_id
      FROM public.product_lots
      WHERE product_id = p_product_id
      ORDER BY expiry_date DESC NULLS FIRST, created_at DESC
      LIMIT 1;
    END IF;
  END IF;

  RETURN v_lot_id;
END;
$$;

-- =========================================================
-- 3. Helper: allocate inventory-count variance across lots
-- =========================================================
-- Positive variance -> put on the newest lot (FEFO).
-- Negative variance -> subtract from FIFO lots, capped at lot.quantity, then dump remainder on first FIFO lot.
CREATE OR REPLACE FUNCTION public.backfill_v2_allocate_variance(
  p_product_id text,
  p_variance numeric
)
RETURNS TABLE (lot_id text, qty numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_remaining numeric := p_variance;
  v_lot record;
  v_alloc numeric;
  v_first_lot_id text;
BEGIN
  IF p_variance = 0 THEN
    RETURN;
  END IF;

  -- No existing lots: return a single row with NULL lot_id. Caller must create a placeholder lot for lot-products.
  IF NOT EXISTS (SELECT 1 FROM public.product_lots WHERE product_id = p_product_id) THEN
    RETURN QUERY SELECT NULL::text, p_variance;
    RETURN;
  END IF;

  IF p_variance > 0 THEN
    SELECT pl.id INTO lot_id
    FROM public.product_lots pl
    WHERE pl.product_id = p_product_id
    ORDER BY pl.expiry_date DESC NULLS FIRST, pl.created_at DESC
    LIMIT 1;
    RETURN QUERY SELECT lot_id, p_variance;
  ELSE
    -- Negative variance: consume FIFO lots, capped at each lot's current quantity.
    FOR v_lot IN
      SELECT pl.id, pl.quantity
      FROM public.product_lots pl
      WHERE pl.product_id = p_product_id
      ORDER BY pl.expiry_date ASC NULLS LAST, pl.created_at ASC
    LOOP
      EXIT WHEN v_remaining >= 0;
      v_alloc := GREATEST(-LEAST(ABS(v_remaining), v_lot.quantity), v_remaining);
      IF v_alloc < 0 THEN
        v_remaining := v_remaining - v_alloc;
        RETURN QUERY SELECT v_lot.id, v_alloc;
      END IF;
    END LOOP;

    -- If still remaining negative, dump on the first FIFO lot.
    IF v_remaining < 0 THEN
      SELECT id INTO v_first_lot_id
      FROM public.product_lots
      WHERE product_id = p_product_id
      ORDER BY expiry_date ASC NULLS LAST, created_at ASC
      LIMIT 1;
      RETURN QUERY SELECT v_first_lot_id, v_remaining;
    END IF;
  END IF;
  RETURN;
END;
$$;

-- =========================================================
-- 4. Helper: create a single placeholder lot for a lot-product that has no lots
-- =========================================================
CREATE OR REPLACE FUNCTION public.backfill_v2_ensure_lot(
  p_product_id text,
  p_lot_code text DEFAULT NULL,
  p_expiry_date date DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lot_id text;
  v_lot_code text;
  v_cost numeric;
BEGIN
  -- Non-lot products do not need a placeholder.
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id AND COALESCE(has_lots, FALSE) = TRUE) THEN
    RETURN NULL;
  END IF;

  -- If lots already exist, do nothing.
  IF EXISTS (SELECT 1 FROM public.product_lots WHERE product_id = p_product_id) THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(cost, 0) INTO v_cost FROM public.products WHERE id = p_product_id;
  v_lot_code := COALESCE(p_lot_code, 'RECOVER-' || LEFT(gen_random_uuid()::text, 8));

  INSERT INTO public.product_lots (
    id, product_id, code, expiry_date, quantity, original_quantity, cost, created_at, updated_at
  ) VALUES (
    gen_random_uuid()::text, p_product_id, v_lot_code, p_expiry_date, 0, 0, v_cost, NOW(), NOW()
  )
  RETURNING id INTO v_lot_id;

  RETURN v_lot_id;
END;
$$;

-- =========================================================
-- 5. Main backfill function
-- =========================================================
CREATE OR REPLACE FUNCTION public.backfill_stock_ledger_v2()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_lot_id text;
  v_rate numeric;
  v_rec record;
  v_alloc record;
  v_movement record;
  v_balance numeric;
BEGIN
  -- Temporary table for all reconstructed lines.
  CREATE TEMP TABLE IF NOT EXISTS tmp_stock_backfill_v2 (
    tmp_id bigserial PRIMARY KEY,
    line_id integer,
    posting_date timestamp with time zone NOT NULL,
    sort_order integer NOT NULL,
    voucher_type text NOT NULL,
    voucher_no text NOT NULL,
    voucher_detail_no text NOT NULL,
    product_id text NOT NULL,
    lot_id text,
    warehouse text NOT NULL,
    actual_qty numeric NOT NULL,
    valuation_rate numeric,
    incoming_rate numeric,
    outgoing_rate numeric,
    reason text,
    is_cancelled boolean NOT NULL DEFAULT FALSE
  ) ON COMMIT DROP;

  TRUNCATE tmp_stock_backfill_v2;

  -- -------------------------------------------------------
  -- A. Purchase Receipts (incoming)
  -- -------------------------------------------------------
  FOR v_rec IN
    SELECT
      ir.id AS receipt_id,
      ir.date AS posting_date,
      ii.id AS item_id,
      ii.product_id,
      p.has_lots,
      ii.lot_code,
      ii.expiry_date::date AS expiry_date,
      ii.quantity,
      ii.cost
    FROM public.import_receipts ir
    JOIN public.import_items ii ON ii.receipt_id = ir.id
    JOIN public.products p ON p.id = ii.product_id
    WHERE ir.status != 'cancelled'
      AND ii.quantity > 0
  LOOP
    v_lot_id := public.backfill_v2_resolve_lot(v_rec.product_id, NULL, v_rec.lot_code, v_rec.expiry_date, 'fifo');
    IF v_lot_id IS NULL AND v_rec.has_lots THEN
      v_lot_id := public.backfill_v2_ensure_lot(v_rec.product_id, v_rec.lot_code, v_rec.expiry_date);
    END IF;

    INSERT INTO tmp_stock_backfill_v2 (
      posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
      product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
    ) VALUES (
      v_rec.posting_date,
      1,
      'Purchase Receipt',
      v_rec.receipt_id,
      v_rec.item_id,
      v_rec.product_id,
      v_lot_id,
      'Kho Chính',
      v_rec.quantity,
      COALESCE(v_rec.cost, 0),
      COALESCE(v_rec.cost, 0),
      0,
      'Nhập hàng',
      FALSE
    );
  END LOOP;

  -- -------------------------------------------------------
  -- B. Delivery Notes from return orders (incoming)
  -- -------------------------------------------------------
  FOR v_rec IN
    SELECT
      ro.id AS return_id,
      COALESCE(ro.date, ro.created_at) AS posting_date,
      roi.id AS item_id,
      roi.product_id,
      p.has_lots,
      roi.lot_id AS original_lot_id,
      roi.lot_code,
      roi.quantity,
      COALESCE(oi.cost, p.cost, 0) AS cost
    FROM public.return_orders ro
    JOIN public.return_order_items roi ON roi.return_order_id = ro.id
    JOIN public.products p ON p.id = roi.product_id
    LEFT JOIN public.order_items oi ON oi.order_id = ro.original_order_id AND oi.product_id = roi.product_id
    WHERE ro.status != 'cancelled'
      AND roi.quantity > 0
  LOOP
    v_lot_id := public.backfill_v2_resolve_lot(v_rec.product_id, v_rec.original_lot_id, v_rec.lot_code, NULL, 'fifo');
    IF v_lot_id IS NULL AND v_rec.has_lots THEN
      v_lot_id := public.backfill_v2_ensure_lot(v_rec.product_id, v_rec.lot_code, NULL);
    END IF;

    INSERT INTO tmp_stock_backfill_v2 (
      posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
      product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
    ) VALUES (
      v_rec.posting_date,
      2,
      'Delivery Note',
      v_rec.return_id,
      v_rec.item_id,
      v_rec.product_id,
      v_lot_id,
      'Kho Chính',
      v_rec.quantity,
      COALESCE(v_rec.cost, 0),
      COALESCE(v_rec.cost, 0),
      0,
      'Trả hàng',
      FALSE
    );
  END LOOP;

  -- -------------------------------------------------------
  -- C. Sales Invoices (outgoing)
  -- -------------------------------------------------------
  FOR v_rec IN
    SELECT
      o.id AS order_id,
      COALESCE(o.created_at, NOW()) AS posting_date,
      oi.id AS item_id,
      oi.product_id,
      p.has_lots,
      oi.lot_id AS original_lot_id,
      oi.lot_code,
      oi.quantity,
      COALESCE(oi.cost, p.cost, 0) AS cost
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    JOIN public.products p ON p.id = oi.product_id
    WHERE o.status != 'cancelled'
      AND oi.quantity > 0
  LOOP
    v_lot_id := public.backfill_v2_resolve_lot(v_rec.product_id, v_rec.original_lot_id, v_rec.lot_code, NULL, 'fifo');
    IF v_lot_id IS NULL AND v_rec.has_lots THEN
      v_lot_id := public.backfill_v2_ensure_lot(v_rec.product_id, v_rec.lot_code, NULL);
    END IF;

    INSERT INTO tmp_stock_backfill_v2 (
      posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
      product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
    ) VALUES (
      v_rec.posting_date,
      4,
      'Sales Invoice',
      v_rec.order_id,
      v_rec.item_id,
      v_rec.product_id,
      v_lot_id,
      'Kho Chính',
      -v_rec.quantity,
      COALESCE(v_rec.cost, 0),
      0,
      COALESCE(v_rec.cost, 0),
      'Bán hàng',
      FALSE
    );
  END LOOP;

  -- -------------------------------------------------------
  -- D. Stock Entry (disposals) (outgoing)
  -- -------------------------------------------------------
  FOR v_rec IN
    SELECT
      d.id AS disposal_id,
      COALESCE(d.date, d.created_at) AS posting_date,
      di.id AS item_id,
      di.product_id,
      p.has_lots,
      di.lot_id AS original_lot_id,
      di.lot_code,
      di.quantity,
      COALESCE(di.cost_price, p.cost, 0) AS cost
    FROM public.disposals d
    JOIN public.disposal_items di ON di.disposal_id = d.id
    JOIN public.products p ON p.id = di.product_id
    WHERE d.status != 'cancelled'
      AND di.quantity > 0
  LOOP
    v_lot_id := public.backfill_v2_resolve_lot(v_rec.product_id, v_rec.original_lot_id, v_rec.lot_code, NULL, 'fifo');
    IF v_lot_id IS NULL AND v_rec.has_lots THEN
      v_lot_id := public.backfill_v2_ensure_lot(v_rec.product_id, v_rec.lot_code, NULL);
    END IF;

    INSERT INTO tmp_stock_backfill_v2 (
      posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
      product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
    ) VALUES (
      v_rec.posting_date,
      5,
      'Stock Entry',
      v_rec.disposal_id,
      v_rec.item_id,
      v_rec.product_id,
      v_lot_id,
      'Kho Chính',
      -v_rec.quantity,
      COALESCE(v_rec.cost, 0),
      0,
      COALESCE(v_rec.cost, 0),
      'Xuất hủy',
      FALSE
    );
  END LOOP;

  -- -------------------------------------------------------
  -- E. Inventory Counts (positive and negative variances)
  -- -------------------------------------------------------
  FOR v_rec IN
    SELECT
      ic.id AS count_id,
      COALESCE(ic.completed_at, ic.date, ic.created_at) AS posting_date,
      ici.id AS item_id,
      ici.product_id,
      p.has_lots,
      ici.lot_id AS original_lot_id,
      ici.lot_code,
      ici.expiry_date,
      ici.system_quantity,
      ici.actual_quantity,
      (ici.actual_quantity - ici.system_quantity) AS variance,
      COALESCE(ici.cost, p.cost, 0) AS cost
    FROM public.inventory_counts ic
    JOIN public.inventory_count_items ici ON ici.count_id = ic.id
    JOIN public.products p ON p.id = ici.product_id
    WHERE ic.status != 'cancelled'
      AND (ici.actual_quantity - ici.system_quantity) <> 0
  LOOP
    -- If a valid lot_id was provided on the count line, use it directly.
    IF EXISTS (SELECT 1 FROM public.product_lots WHERE id = v_rec.original_lot_id AND product_id = v_rec.product_id) THEN
      v_lot_id := v_rec.original_lot_id;

      INSERT INTO tmp_stock_backfill_v2 (
        posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
        product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
      ) VALUES (
        v_rec.posting_date,
        CASE WHEN v_rec.variance > 0 THEN 3 ELSE 6 END,
        'Stock Reconciliation',
        v_rec.count_id,
        v_rec.item_id,
        v_rec.product_id,
        v_lot_id,
        'Kho Chính',
        v_rec.variance,
        COALESCE(v_rec.cost, 0),
        CASE WHEN v_rec.variance > 0 THEN COALESCE(v_rec.cost, 0) ELSE 0 END,
        CASE WHEN v_rec.variance < 0 THEN COALESCE(v_rec.cost, 0) ELSE 0 END,
        'Kiểm kê kho',
        FALSE
      );
    ELSE
      -- Missing or invalid lot_id: allocate the variance per helper rules.
      FOR v_alloc IN SELECT * FROM public.backfill_v2_allocate_variance(v_rec.product_id, v_rec.variance)
      LOOP
        v_lot_id := v_alloc.lot_id;
        IF v_lot_id IS NULL AND v_rec.has_lots THEN
          v_lot_id := public.backfill_v2_ensure_lot(v_rec.product_id, v_rec.lot_code, v_rec.expiry_date);
        END IF;

        INSERT INTO tmp_stock_backfill_v2 (
          posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
          product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
        ) VALUES (
          v_rec.posting_date,
          CASE WHEN v_alloc.qty > 0 THEN 3 ELSE 6 END,
          'Stock Reconciliation',
          v_rec.count_id,
          v_rec.item_id,
          v_rec.product_id,
          v_lot_id,
          'Kho Chính',
          v_alloc.qty,
          COALESCE(v_rec.cost, 0),
          CASE WHEN v_alloc.qty > 0 THEN COALESCE(v_rec.cost, 0) ELSE 0 END,
          CASE WHEN v_alloc.qty < 0 THEN COALESCE(v_rec.cost, 0) ELSE 0 END,
          'Kiểm kê kho',
          FALSE
        );
      END LOOP;
    END IF;
  END LOOP;

  -- -------------------------------------------------------
  -- F. Insert opening-balance adjustments per (product_id, lot_id)
  -- so that SUM(actual_qty) over the lot equals product_lots.quantity.
  -- -------------------------------------------------------
  FOR v_rec IN
    SELECT
      pl.product_id,
      pl.id AS lot_id,
      COALESCE(pl.quantity, 0) AS target_qty,
      COALESCE(pl.cost, 0) AS lot_cost
    FROM public.product_lots pl
  LOOP
    SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
    FROM tmp_stock_backfill_v2
    WHERE product_id = v_rec.product_id AND lot_id IS NOT DISTINCT FROM v_rec.lot_id;

    IF v_balance <> v_rec.target_qty THEN
      INSERT INTO tmp_stock_backfill_v2 (
        posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
        product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
      ) VALUES (
        '1900-01-01 00:00:00+00'::timestamp with time zone,
        0,
        'OPENING-BALANCE',
        v_rec.product_id,
        'OB-' || COALESCE(v_rec.lot_id, 'NULL'),
        v_rec.product_id,
        v_rec.lot_id,
        'Kho Chính',
        v_rec.target_qty - v_balance,
        COALESCE(v_rec.lot_cost, 0),
        CASE WHEN v_rec.target_qty > v_balance THEN COALESCE(v_rec.lot_cost, 0) ELSE 0 END,
        CASE WHEN v_rec.target_qty < v_balance THEN COALESCE(v_rec.lot_cost, 0) ELSE 0 END,
        'Điều chỉnh tồn đầu kỳ',
        FALSE
      );
    END IF;
  END LOOP;

  -- Also handle non-lot products (no lot rows) so their product.quantity matches the ledger.
  FOR v_rec IN
    SELECT
      p.id AS product_id,
      COALESCE(p.quantity, 0) AS target_qty,
      COALESCE(p.cost, 0) AS product_cost
    FROM public.products p
    WHERE COALESCE(p.has_lots, FALSE) = FALSE
  LOOP
    SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
    FROM tmp_stock_backfill_v2
    WHERE product_id = v_rec.product_id AND lot_id IS NULL;

    IF v_balance <> v_rec.target_qty THEN
      INSERT INTO tmp_stock_backfill_v2 (
        posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
        product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
      ) VALUES (
        '1900-01-01 00:00:00+00'::timestamp with time zone,
        0,
        'OPENING-BALANCE',
        v_rec.product_id,
        'OB-' || v_rec.product_id,
        v_rec.product_id,
        NULL,
        'Kho Chính',
        v_rec.target_qty - v_balance,
        COALESCE(v_rec.product_cost, 0),
        CASE WHEN v_rec.target_qty > v_balance THEN COALESCE(v_rec.product_cost, 0) ELSE 0 END,
        CASE WHEN v_rec.target_qty < v_balance THEN COALESCE(v_rec.product_cost, 0) ELSE 0 END,
        'Điều chỉnh tồn đầu kỳ',
        FALSE
      );
    END IF;
  END LOOP;

  -- -------------------------------------------------------
  -- G. Assign deterministic ordering to the temp table
  -- -------------------------------------------------------
  UPDATE tmp_stock_backfill_v2 t
  SET line_id = s.rn
  FROM (
    SELECT tmp_id, row_number() OVER (ORDER BY posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no) AS rn
    FROM tmp_stock_backfill_v2
  ) s
  WHERE t.tmp_id = s.tmp_id;

  -- -------------------------------------------------------
  -- H. Write rows to stock_movements with cumulative qty_after_transaction
  -- -------------------------------------------------------
  FOR v_movement IN
    SELECT *
    FROM tmp_stock_backfill_v2
    ORDER BY line_id
  LOOP
    SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
    FROM tmp_stock_backfill_v2 t
    WHERE t.product_id = v_movement.product_id
      AND t.lot_id IS NOT DISTINCT FROM v_movement.lot_id
      AND t.line_id < v_movement.line_id;

    PERFORM public.insert_stock_ledger_entry(
      v_movement.posting_date,
      v_movement.voucher_type,
      v_movement.voucher_no,
      v_movement.voucher_detail_no,
      v_movement.product_id,
      v_movement.lot_id,
      v_movement.warehouse,
      v_movement.actual_qty,
      v_balance + v_movement.actual_qty,
      v_movement.valuation_rate,
      v_movement.incoming_rate,
      v_movement.outgoing_rate,
      v_movement.reason,
      v_movement.is_cancelled
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'rows_processed', v_count,
    'message', 'Backfill completed. Check product/lot totals.'
  );
END;
$$;
