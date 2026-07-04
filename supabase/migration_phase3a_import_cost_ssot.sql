-- =========================================================
-- Phase 3a — Import Cost SSOT
-- File:    supabase/migration_phase3a_import_cost_ssot.sql
-- Project: QLBH (rsialbfjswnrkzcxarnj)
-- Date:    2026-07-02
-- Purpose: Separate original cost from adjusted (landed) cost.
--   - import_items.cost          = original unit price entered by user
--   - import_items.discount      = line discount entered by user
--   - import_items.adjusted_cost = landed cost after line discount + shipping allocation
--   - products.cost / product_lots.cost = landed cost (weighted average)
--   - stock ledger               = landed cost
--
-- WARNING: This migration modifies live business functions and changes the
-- semantic of import_items.cost. Back up before running; do NOT re-run after
-- deployment.
-- =========================================================

-- 0. Back up tables affected by this migration
CREATE TABLE IF NOT EXISTS public.import_items_backup_phase3a AS
SELECT * FROM public.import_items;

CREATE TABLE IF NOT EXISTS public.import_receipts_backup_phase3a AS
SELECT * FROM public.import_receipts;

CREATE TABLE IF NOT EXISTS public.products_backup_phase3a AS
SELECT * FROM public.products;

CREATE TABLE IF NOT EXISTS public.product_lots_backup_phase3a AS
SELECT * FROM public.product_lots;

-- 1. Add adjusted_cost column and backfill historical rows
--    For rows created before this phase, the old `cost` column already stored
--    the adjusted cost. We cannot recover the original purchase price, so we
--    backfill adjusted_cost from the old cost. New rows will store original
--    cost in `cost` and computed adjusted cost in `adjusted_cost`.
ALTER TABLE public.import_items
ADD COLUMN IF NOT EXISTS adjusted_cost NUMERIC(15,2);

UPDATE public.import_items
SET adjusted_cost = cost
WHERE adjusted_cost IS NULL;

-- 2. Nhập hàng — Purchase Receipt
CREATE OR REPLACE FUNCTION process_import_v2(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receipt_id       TEXT;
  v_invoice_number   TEXT;
  v_date             TIMESTAMPTZ;
  v_supplier_id      TEXT;
  v_supplier_name    TEXT;
  v_total_cost       NUMERIC;
  v_shipping_cost    NUMERIC;
  v_discount_total   NUMERIC;
  v_paid_amount      NUMERIC;
  v_debt_recorded    NUMERIC;
  v_status           TEXT;
  v_note             TEXT;
  v_items            JSONB;

  v_item             RECORD;
  v_existing_qty     NUMERIC;
  v_existing_cost    NUMERIC;
  v_has_lots         BOOLEAN;
  v_discount         NUMERIC;
  v_line_net         NUMERIC;
  v_adjusted_cost    NUMERIC;
  v_new_qty          NUMERIC;
  v_new_cost         NUMERIC;
  v_total_value      NUMERIC := 0;
  v_shipping_factor  NUMERIC;
  v_clean_lot_code   TEXT;
  v_clean_expiry     DATE;
  v_lot_id           TEXT;
  v_existing_status  TEXT;

  v_existing_lot_qty  NUMERIC;
  v_existing_lot_cost NUMERIC;
  v_new_lot_qty       NUMERIC;
  v_new_lot_cost      NUMERIC;

  v_affected_products TEXT[] := ARRAY[]::TEXT[];
  v_total_added_qty   NUMERIC := 0;

  v_import_item_id    TEXT;
  v_ledger_lot_id    TEXT;
  v_qty_after         NUMERIC;
BEGIN
  v_receipt_id     := p_payload->>'id';
  v_invoice_number := p_payload->>'invoice_number';
  v_date           := COALESCE((p_payload->>'date')::TIMESTAMPTZ, NOW());
  v_supplier_id    := p_payload->>'supplier_id';
  v_supplier_name  := p_payload->>'supplier_name';
  v_total_cost     := COALESCE((p_payload->>'total_cost')::NUMERIC, 0);
  v_shipping_cost  := COALESCE((p_payload->>'shipping_cost')::NUMERIC, 0);
  v_discount_total := COALESCE((p_payload->>'discount_total')::NUMERIC, 0);
  v_paid_amount    := COALESCE((p_payload->>'paid_amount')::NUMERIC, 0);
  v_debt_recorded  := COALESCE((p_payload->>'debt_recorded')::NUMERIC, 0);
  v_status         := COALESCE(p_payload->>'status', 'completed');
  v_note           := p_payload->>'note';
  v_items          := p_payload->'items';

  IF v_receipt_id IS NULL OR v_receipt_id = '' THEN
    RAISE EXCEPTION 'Mã phiếu nhập hàng không được để trống';
  END IF;

  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Danh sách sản phẩm nhập không được để trống';
  END IF;

  SELECT status INTO v_existing_status FROM import_receipts WHERE id = v_receipt_id FOR UPDATE;
  IF FOUND THEN
    IF v_existing_status = 'completed' THEN
      RAISE EXCEPTION 'Phiếu nhập % đã hoàn thành trước đó, không thể ghi đè.', v_receipt_id;
    ELSIF v_existing_status = 'draft' THEN
      DELETE FROM import_items WHERE receipt_id = v_receipt_id;
      DELETE FROM import_receipts WHERE id = v_receipt_id;
    END IF;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(v_items) AS x(
    product_id TEXT, quantity NUMERIC, cost NUMERIC, discount NUMERIC
  ) LOOP
    v_total_value := v_total_value + GREATEST(
      0,
      (COALESCE(v_item.quantity, 0) * COALESCE(v_item.cost, 0)) - COALESCE(v_item.discount, 0)
    );
  END LOOP;

  v_shipping_factor := CASE WHEN v_total_value > 0 THEN v_shipping_cost / v_total_value ELSE 0 END;

  INSERT INTO import_receipts (
    id, invoice_number, date, supplier_id, supplier_name,
    total_cost, shipping_cost, discount_total, paid_amount, debt_recorded, status, note
  ) VALUES (
    v_receipt_id, v_invoice_number, v_date, v_supplier_id, v_supplier_name,
    v_total_cost, v_shipping_cost, v_discount_total, v_paid_amount, v_debt_recorded, v_status, v_note
  );

  FOR v_item IN SELECT * FROM jsonb_to_recordset(v_items) AS x(
    product_id TEXT, product_name TEXT, quantity NUMERIC, cost NUMERIC, discount NUMERIC, lot_code TEXT, expiry_date TEXT
  ) LOOP
    v_discount := COALESCE(v_item.discount, 0);
    v_line_net := CASE
      WHEN COALESCE(v_item.quantity, 0) > 0 THEN
        GREATEST(0, (COALESCE(v_item.cost, 0) * v_item.quantity) - v_discount) / v_item.quantity
      ELSE 0
    END;
    v_adjusted_cost := ROUND(v_line_net * (1 + v_shipping_factor), 2);

    SELECT quantity, COALESCE(cost, 0), COALESCE(has_lots, FALSE)
    INTO v_existing_qty, v_existing_cost, v_has_lots
    FROM products WHERE id = v_item.product_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Sản phẩm % không tồn tại trong hệ thống', v_item.product_id;
    END IF;

    INSERT INTO import_items (
      id, receipt_id, product_id, product_name, quantity, cost, discount, adjusted_cost, lot_code, expiry_date
    ) VALUES (
      gen_random_uuid(), v_receipt_id, v_item.product_id, v_item.product_name, v_item.quantity, v_item.cost, v_discount,
      v_adjusted_cost, v_item.lot_code,
      CASE WHEN v_item.expiry_date IS NOT NULL AND v_item.expiry_date != '' THEN (v_item.expiry_date)::TIMESTAMPTZ ELSE NULL END
    ) RETURNING id INTO v_import_item_id;

    IF v_status = 'completed' THEN
      v_new_qty := v_existing_qty + v_item.quantity;

      v_new_cost := CASE
        WHEN v_new_qty > 0 THEN ROUND(((v_existing_qty * v_existing_cost) + (v_item.quantity * v_adjusted_cost)) / v_new_qty, 2)
        ELSE v_adjusted_cost
      END;

      UPDATE products
      SET quantity = v_new_qty, cost = v_new_cost
      WHERE id = v_item.product_id;

      v_ledger_lot_id := NULL;

      IF v_has_lots THEN
        IF v_item.lot_code IS NULL OR TRIM(v_item.lot_code) = '' THEN
          RAISE EXCEPTION '%', format('Sản phẩm % (ID: %) đang bật quản lý lô, bắt buộc phải nhập số lô', v_item.product_name, v_item.product_id);
        END IF;

        v_clean_lot_code := TRIM(v_item.lot_code);
        v_clean_expiry := CASE WHEN v_item.expiry_date IS NOT NULL AND v_item.expiry_date != '' THEN (v_item.expiry_date)::DATE ELSE NULL END;
        v_lot_id := 'lot_' || v_item.product_id || '_' || REGEXP_REPLACE(v_clean_lot_code, '[^a-zA-Z0-9]', '_', 'g') || '_' || FLOOR(EXTRACT(EPOCH FROM NOW()))::TEXT;

        SELECT COALESCE(quantity, 0), COALESCE(cost, 0)
        INTO v_existing_lot_qty, v_existing_lot_cost
        FROM product_lots
        WHERE product_id = v_item.product_id AND code = v_clean_lot_code
        FOR UPDATE;

        v_new_lot_qty := COALESCE(v_existing_lot_qty, 0) + v_item.quantity;
        v_new_lot_cost := CASE
          WHEN v_new_lot_qty > 0 THEN ROUND(
            ((COALESCE(v_existing_lot_qty, 0) * COALESCE(v_existing_lot_cost, 0)) + (v_item.quantity * v_adjusted_cost))
            / v_new_lot_qty,
            2
          )
          ELSE v_adjusted_cost
        END;

        INSERT INTO product_lots (
          id, product_id, code, expiry_date, quantity, original_quantity, cost, created_at, updated_at
        ) VALUES (
          v_lot_id, v_item.product_id, v_clean_lot_code, v_clean_expiry, v_item.quantity, v_item.quantity, v_new_lot_cost, NOW(), NOW()
        )
        ON CONFLICT (product_id, code)
        DO UPDATE SET
          quantity = product_lots.quantity + EXCLUDED.quantity,
          cost = v_new_lot_cost,
          updated_at = NOW();

        SELECT id INTO v_ledger_lot_id
        FROM product_lots
        WHERE product_id = v_item.product_id AND code = v_clean_lot_code
        LIMIT 1;

        PERFORM sync_product_quantity_from_lots(v_item.product_id);
      END IF;

      INSERT INTO inventory_movements (
        product_id, movement_type, reference_type, reference_id, qty_before, qty_change, qty_after, lot_code, created_at
      ) VALUES (
        v_item.product_id, 'IMPORT', 'RECEIPT', v_receipt_id, v_existing_qty, v_item.quantity, v_new_qty, v_item.lot_code, NOW()
      );

      v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_ledger_lot_id, v_item.quantity);
      PERFORM insert_stock_ledger_entry(
        v_date,
        'Purchase Receipt'::TEXT,
        v_receipt_id,
        v_import_item_id,
        v_item.product_id,
        v_ledger_lot_id,
        'Kho Chính'::TEXT,
        v_item.quantity,
        v_qty_after,
        v_adjusted_cost,
        v_adjusted_cost,
        0::NUMERIC,
        NULL,
        FALSE
      );

      v_affected_products := array_append(v_affected_products, v_item.product_id);
      v_total_added_qty := v_total_added_qty + v_item.quantity;
    END IF;
  END LOOP;

  IF v_status = 'completed' AND v_debt_recorded > 0 THEN
    UPDATE suppliers SET debt = debt + v_debt_recorded WHERE id = v_supplier_id;
  END IF;

  IF v_status = 'completed' THEN
    PERFORM check_inventory_consistency(v_affected_products);
  END IF;

  RETURN jsonb_build_object(
    'receipt_id', v_receipt_id,
    'affected_products', to_jsonb(v_affected_products),
    'total_qty_added', v_total_added_qty,
    'status', v_status
  );
END;
$$;

-- 3. Xóa phiếu nhập — đảo Purchase Receipt
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
  v_item_cost        NUMERIC;

  v_existing_lot_qty  NUMERIC;
  v_existing_lot_cost NUMERIC;
  v_new_lot_qty       NUMERIC;
  v_new_lot_cost      NUMERIC;

  v_affected_products TEXT[] := ARRAY[]::TEXT[];
  v_total_removed_qty NUMERIC := 0;

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
    v_item_cost := COALESCE(v_item.adjusted_cost, v_item.cost, 0);

    SELECT quantity, COALESCE(cost, 0), COALESCE(has_lots, FALSE)
    INTO v_current_qty, v_current_cost, v_has_lots
    FROM products WHERE id = v_item.product_id FOR UPDATE;

    IF NOT v_allow_negative AND v_current_qty < v_item.quantity THEN
      RAISE EXCEPTION 'Không thể xóa phiếu nhập %: Sản phẩm % đã bán vượt quá số lượng nhập (Tồn hiện tại %, yêu cầu trả %)',
        p_receipt_id, v_item.product_name, v_current_qty, v_item.quantity;
    END IF;

    v_new_qty := v_current_qty - v_item.quantity;

    IF v_new_qty > 0 THEN
      v_new_cost := ROUND(((v_current_qty * v_current_cost) - (v_item.quantity * v_item_cost)) / v_new_qty, 2);
      IF v_new_cost < 0 THEN v_new_cost := 0; END IF;
    ELSE
      v_new_cost := 0;
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
          ((COALESCE(v_existing_lot_qty, 0) * COALESCE(v_existing_lot_cost, 0)) - (v_item.quantity * v_item_cost))
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

    v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_ledger_lot_id, -v_item.quantity);
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
      v_item_cost,
      v_item_cost,
      0::NUMERIC,
      'Xóa phiếu nhập'::TEXT,
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

-- 4. Sửa phiếu nhập — delegate delete + process (tự động ghi đảo + nhập lại)
CREATE OR REPLACE FUNCTION update_import_v2(p_receipt_id TEXT, p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_receipt_id IS NULL OR p_receipt_id = '' THEN
    RAISE EXCEPTION 'Mã phiếu nhập cần sửa không được để trống';
  END IF;

  p_payload := jsonb_set(p_payload, '{id}', to_jsonb(p_receipt_id));

  SELECT delete_import_v2(p_receipt_id) INTO v_result;

  RETURN process_import_v2(p_payload);
END;
$$;
