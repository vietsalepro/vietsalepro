-- Sub-phase 5.3: RLS policies — remaining tables + unique indexes
-- Tables: 27 remaining business tables (inventory, config, misc) + promotions.
-- ponytail: One policy template applied to all tables; delete restricted to tenant admins.
-- ponytail: Schema alignment — products.code -> sku, einvoice_orders.invoice_no -> invoice_number,
--           orders.order_code added with trigger and unique index.

-- ============================================================================
-- 1. Schema alignment
-- ============================================================================

-- 1.1 Rename columns to match the plan (idempotent so it can run on fresh and existing DBs).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'code'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sku'
  ) THEN
    EXECUTE 'ALTER TABLE public.products RENAME COLUMN code TO sku';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'einvoice_orders' AND column_name = 'invoice_no'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'einvoice_orders' AND column_name = 'invoice_number'
  ) THEN
    EXECUTE 'ALTER TABLE public.einvoice_orders RENAME COLUMN invoice_no TO invoice_number';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'einvoice_orders' AND column_name = 'replacing_invoice_no'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'einvoice_orders' AND column_name = 'replacing_invoice_number'
  ) THEN
    EXECUTE 'ALTER TABLE public.einvoice_orders RENAME COLUMN replacing_invoice_no TO replacing_invoice_number';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'einvoice_orders' AND column_name = 'replaced_by_invoice_no'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'einvoice_orders' AND column_name = 'replaced_by_invoice_number'
  ) THEN
    EXECUTE 'ALTER TABLE public.einvoice_orders RENAME COLUMN replaced_by_invoice_no TO replaced_by_invoice_number';
  END IF;
END $$;

-- 1.2 Add orders.order_code and guarantee a value per row.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_code TEXT;
UPDATE public.orders SET order_code = id WHERE order_code IS NULL;
ALTER TABLE public.orders ALTER COLUMN order_code SET NOT NULL;

-- Trigger to fill order_code from id when the client leaves it empty.
CREATE OR REPLACE FUNCTION public.orders_set_order_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
    NEW.order_code := NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_set_order_code ON public.orders;
CREATE TRIGGER trg_orders_set_order_code
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_set_order_code();

-- ============================================================================
-- 2. Update existing RPCs that referenced products.code to use products.sku
-- ============================================================================

-- SKU uniqueness check; keeps the original signature so service callers are unaffected.
CREATE OR REPLACE FUNCTION public.check_product_code_exists(p_code TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.products WHERE sku = p_code
  );
$$;

-- get_inventory_report: alias sku back to "code" so existing reports keep working.
CREATE OR REPLACE FUNCTION public.get_inventory_report(
  p_start_date DATE,
  p_end_date DATE,
  p_category TEXT DEFAULT '',
  p_stock_status TEXT DEFAULT 'all'
) RETURNS JSON LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH product_values AS (
    SELECT
      p.id,
      COALESCE(SUM(pl.quantity * pl.cost), p.quantity * p.cost) AS total_value,
      COALESCE(SUM(pl.quantity), p.quantity) AS total_qty
    FROM products p
    LEFT JOIN product_lots pl ON pl.product_id = p.id
    GROUP BY p.id, p.quantity, p.cost
  ),
  returned_items AS (
    SELECT
      ro.original_order_id AS order_id,
      roi.product_id,
      COALESCE(SUM(roi.quantity), 0) AS returned_qty
    FROM return_orders ro
    JOIN return_order_items roi ON roi.return_order_id = ro.id
    WHERE ro.status != 'cancelled'
    GROUP BY ro.original_order_id, roi.product_id
  ),
  summary AS (
    SELECT json_build_object(
      'totalValue', COALESCE(SUM(pv.total_value), 0),
      'totalQty', COALESCE(SUM(pv.total_qty), 0),
      'lowStockCount', COUNT(*) FILTER (WHERE p.quantity > 0 AND p.min_stock IS NOT NULL AND p.quantity <= p.min_stock),
      'outOfStockCount', COUNT(*) FILTER (WHERE COALESCE(p.quantity, 0) <= 0)
    ) AS result
    FROM products p
    LEFT JOIN product_values pv ON pv.id = p.id
    WHERE (p_category = '' OR p.category = p_category)
  ),
  inventory_by_category AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(p.category, 'Chưa phân loại') AS name,
        COALESCE(SUM(pv.total_value), 0) AS value
      FROM products p
      LEFT JOIN product_values pv ON pv.id = p.id
      WHERE (p_category = '' OR p.category = p_category)
      GROUP BY p.category
    ) t
  ),
  export_in_period AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        oi.product_id,
        COALESCE(oi.product_name, 'Không xác định') AS name,
        COALESCE(SUM(oi.quantity - COALESCE(ri.returned_qty, 0)), 0)::int AS qty,
        COALESCE(SUM(COALESCE(oi.cost, COALESCE(p.cost, 0)) * (oi.quantity - COALESCE(ri.returned_qty, 0))), 0) AS value
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN returned_items ri
        ON ri.order_id = o.id AND ri.product_id = oi.product_id
      WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date
        AND o.status != 'cancelled'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY SUM(oi.quantity - COALESCE(ri.returned_qty, 0)) DESC
    ) t
  ),
  low_stock_products AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        p.id,
        p.sku AS code,
        p.name,
        p.category,
        p.unit,
        COALESCE(p.quantity, 0) AS quantity,
        COALESCE(p.min_stock, 5) AS min_stock,
        COALESCE(p.cost, 0) AS cost,
        COALESCE(pv.total_value, 0) AS value
      FROM products p
      LEFT JOIN product_values pv ON pv.id = p.id
      WHERE (p_category = '' OR p.category = p_category)
        AND p.quantity <= COALESCE(p.min_stock, 5)
      ORDER BY p.quantity ASC
    ) t
  ),
  products_filtered AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        p.id,
        p.sku AS code,
        p.name,
        p.category,
        p.unit,
        COALESCE(p.quantity, 0) AS quantity,
        COALESCE(p.min_stock, 5) AS min_stock,
        COALESCE(p.cost, 0) AS cost,
        COALESCE(pv.total_value, 0) AS value
      FROM products p
      LEFT JOIN product_values pv ON pv.id = p.id
      WHERE (p_category = '' OR p.category = p_category)
        AND (
          p_stock_status = 'all'
          OR (p_stock_status = 'in' AND p.quantity > COALESCE(p.min_stock, 5))
          OR (p_stock_status = 'low' AND p.quantity > 0 AND p.quantity <= COALESCE(p.min_stock, 5))
          OR (p_stock_status = 'out' AND COALESCE(p.quantity, 0) <= 0)
        )
      ORDER BY p.name ASC
    ) t
  ),
  categories AS (
    SELECT COALESCE(json_agg(DISTINCT category), '[]'::json) AS result
    FROM (
      SELECT DISTINCT TRIM(p.category) AS category
      FROM products p
      WHERE p.category IS NOT NULL AND p.category <> ''
      ORDER BY TRIM(p.category)
    ) cats
  )
  SELECT json_build_object(
    'summary', s.result,
    'inventoryByCategory', ibc.result,
    'exportInPeriod', eip.result,
    'lowStockProducts', lsp.result,
    'products', pf.result,
    'categories', c.result
  )
  INTO v_result
  FROM summary s, inventory_by_category ibc, export_in_period eip,
       low_stock_products lsp, products_filtered pf, categories c;

  RETURN v_result;
END;
$$;

-- search_products_rpc: output column still named "code" so frontend mappers stay unchanged.
CREATE OR REPLACE FUNCTION public.search_products_rpc(
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
  id TEXT, name TEXT, display_name TEXT, code TEXT, barcode TEXT,
  price NUMERIC, cost NUMERIC, quantity NUMERIC, unit TEXT, location TEXT,
  category TEXT, brand TEXT, image TEXT, min_stock NUMERIC, max_stock NUMERIC,
  safety_stock NUMERIC, is_point_accumulation_enabled BOOLEAN, conversion_units JSONB,
  created_at TIMESTAMPTZ, has_lots BOOLEAN, category_id TEXT, brand_id TEXT,
  product_lots JSONB
) LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.name,
    p.display_name,
    p.sku,
    p.barcode,
    p.price,
    p.cost,
    p.quantity,
    p.unit,
    p.location,
    p.category,
    p.brand,
    p.image,
    p.min_stock,
    p.max_stock,
    p.safety_stock,
    p.is_point_accumulation_enabled,
    p.conversion_units,
    p.created_at,
    p.has_lots,
    p.category_id,
    p.brand_id,
    COALESCE(
      jsonb_agg(to_jsonb(pl.*) ORDER BY pl.expiry_date ASC, pl.created_at ASC)
      FILTER (WHERE pl.id IS NOT NULL),
      '[]'::jsonb
    ) AS product_lots
  FROM products p
  LEFT JOIN product_lots pl ON pl.product_id = p.id
  WHERE (
    p_search_term IS NULL OR p_search_term = '' OR
    f_unaccent(p.name) ILIKE f_unaccent('%' || p_search_term || '%') OR
    f_unaccent(COALESCE(p.sku, '')) ILIKE f_unaccent('%' || p_search_term || '%') OR
    COALESCE(p.barcode, '') ILIKE '%' || p_search_term || '%'
  )
  GROUP BY p.id
  ORDER BY p.name ASC
  LIMIT p_limit;
$$;

-- get_product_by_barcode
CREATE OR REPLACE FUNCTION public.get_product_by_barcode(
  p_barcode TEXT
) RETURNS TABLE (
  id TEXT, name TEXT, display_name TEXT, code TEXT, barcode TEXT,
  price NUMERIC, cost NUMERIC, quantity NUMERIC, unit TEXT, location TEXT,
  category TEXT, brand TEXT, image TEXT, min_stock NUMERIC, max_stock NUMERIC,
  safety_stock NUMERIC, is_point_accumulation_enabled BOOLEAN, conversion_units JSONB,
  created_at TIMESTAMPTZ, has_lots BOOLEAN, category_id TEXT, brand_id TEXT,
  product_lots JSONB
) LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.name,
    p.display_name,
    p.sku,
    p.barcode,
    p.price,
    p.cost,
    p.quantity,
    p.unit,
    p.location,
    p.category,
    p.brand,
    p.image,
    p.min_stock,
    p.max_stock,
    p.safety_stock,
    p.is_point_accumulation_enabled,
    p.conversion_units,
    p.created_at,
    p.has_lots,
    p.category_id,
    p.brand_id,
    COALESCE(
      jsonb_agg(to_jsonb(pl.*) ORDER BY pl.expiry_date ASC, pl.created_at ASC)
      FILTER (WHERE pl.id IS NOT NULL),
      '[]'::jsonb
    ) AS product_lots
  FROM products p
  LEFT JOIN product_lots pl ON pl.product_id = p.id
  WHERE p.barcode = p_barcode
  GROUP BY p.id
  LIMIT 1;
$$;

-- filter_products_rpc: two overloads
CREATE OR REPLACE FUNCTION public.filter_products_rpc(
  p_search_term TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20,
  p_category_id TEXT DEFAULT NULL,
  p_brand_id TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
) RETURNS JSON LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN filter_products_rpc(
    p_search_term, p_page, p_page_size, p_category_id, p_brand_id, p_sort_by, p_sort_order, NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.filter_products_rpc(
  p_search_term TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20,
  p_category_id TEXT DEFAULT NULL,
  p_brand_id TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_stock_status TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_offset int;
  v_total int;
  v_result JSON;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT COUNT(*) INTO v_total
  FROM products p
  WHERE (p_search_term IS NULL OR p_search_term = '' OR
         f_unaccent(p.name) ILIKE f_unaccent('%' || p_search_term || '%') OR
         f_unaccent(COALESCE(p.sku, '')) ILIKE f_unaccent('%' || p_search_term || '%') OR
         COALESCE(p.barcode, '') ILIKE '%' || p_search_term || '%')
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
    AND (
      p_stock_status IS NULL OR p_stock_status = 'all' OR
      (p_stock_status = 'available' AND p.quantity > 0) OR
      (p_stock_status = 'out' AND p.quantity <= 0) OR
      (p_stock_status = 'low' AND p.quantity <= COALESCE(p.min_stock, 5))
    );

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        p.*,
        COALESCE(
          jsonb_agg(to_jsonb(pl.*) ORDER BY pl.expiry_date ASC, pl.created_at ASC)
          FILTER (WHERE pl.id IS NOT NULL),
          '[]'::jsonb
        ) AS product_lots
      FROM products p
      LEFT JOIN product_lots pl ON pl.product_id = p.id
      WHERE (p_search_term IS NULL OR p_search_term = '' OR
             f_unaccent(p.name) ILIKE f_unaccent('%' || p_search_term || '%') OR
             f_unaccent(COALESCE(p.sku, '')) ILIKE f_unaccent('%' || p_search_term || '%') OR
             COALESCE(p.barcode, '') ILIKE '%' || p_search_term || '%')
        AND (p_category_id IS NULL OR p.category_id = p_category_id)
        AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
        AND (
          p_stock_status IS NULL OR p_stock_status = 'all' OR
          (p_stock_status = 'available' AND p.quantity > 0) OR
          (p_stock_status = 'out' AND p.quantity <= 0) OR
          (p_stock_status = 'low' AND p.quantity <= COALESCE(p.min_stock, 5))
        )
      GROUP BY p.id
      ORDER BY
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN p.name END ASC,
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN p.name END DESC,
        CASE WHEN p_sort_by = 'quantity' AND p_sort_order = 'asc' THEN p.quantity END ASC,
        CASE WHEN p_sort_by = 'quantity' AND p_sort_order = 'desc' THEN p.quantity END DESC,
        CASE WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN p.price END ASC,
        CASE WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN p.price END DESC,
        p.created_at DESC
      LIMIT p_page_size
      OFFSET v_offset
    ) t
  );

  RETURN json_build_object('products', v_result, 'totalCount', v_total);
END;
$$;

-- ============================================================================
-- 3. RLS policies for remaining tables
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
  remaining_tables TEXT[] := ARRAY[
    'promotions',
    'import_receipts',
    'import_items',
    'inventory_counts',
    'inventory_count_items',
    'inventory_movements',
    'disposals',
    'disposal_items',
    'product_lots',
    'stock_movements',
    'return_orders',
    'return_order_items',
    'supplier_exchanges',
    'supplier_exchange_return_items',
    'supplier_exchange_received_items',
    'app_settings',
    'brands',
    'categories',
    'einvoice_config',
    'einvoice_orders',
    'point_history',
    'processed_operations',
    'rank_configs',
    'rank_history',
    'rewards',
    'customer_payment_ledger',
    'supplier_payment_ledger'
  ];
BEGIN
  FOREACH tbl IN ARRAY remaining_tables
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS authenticated_full_access_temp ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_select ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON public.%I', tbl);

      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

      EXECUTE format(
        'CREATE POLICY tenant_isolation_select ON public.%I FOR SELECT TO authenticated USING ((tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id)) OR public.is_system_admin())',
        tbl
      );

      EXECUTE format(
        'CREATE POLICY tenant_isolation_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id))',
        tbl
      );

      EXECUTE format(
        'CREATE POLICY tenant_isolation_update ON public.%I FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id)) WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id))',
        tbl
      );

      EXECUTE format(
        'CREATE POLICY tenant_isolation_delete ON public.%I FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_admin(tenant_id))',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- Remove legacy all-access policies that would otherwise bypass tenant isolation.
DROP POLICY IF EXISTS allow_all_stock_movements ON public.stock_movements;
DROP POLICY IF EXISTS cpl_auth_select ON public.customer_payment_ledger;
DROP POLICY IF EXISTS cpl_auth_insert ON public.customer_payment_ledger;
DROP POLICY IF EXISTS spl_auth_select ON public.supplier_payment_ledger;
DROP POLICY IF EXISTS spl_auth_insert ON public.supplier_payment_ledger;

-- ============================================================================
-- 4. Unique indexes per tenant
-- ============================================================================

-- De-duplicate non-empty SKUs before enforcing uniqueness.
WITH ranked_products AS (
  SELECT id,
         tenant_id,
         sku,
         row_number() OVER (PARTITION BY tenant_id, sku ORDER BY id) AS rn
  FROM public.products
  WHERE sku IS NOT NULL AND sku <> ''
)
UPDATE public.products p
SET sku = rp.sku || '_dup' || rp.rn
FROM ranked_products rp
WHERE p.id = rp.id AND rp.rn > 1;

-- Unique indexes per tenant for business codes.
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_per_tenant
  ON public.products (tenant_id, sku) WHERE sku IS NOT NULL AND sku <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_per_tenant
  ON public.products (tenant_id, barcode) WHERE barcode IS NOT NULL AND barcode <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_code_per_tenant
  ON public.orders (tenant_id, order_code);

CREATE UNIQUE INDEX IF NOT EXISTS idx_einvoice_orders_invoice_number_per_tenant
  ON public.einvoice_orders (tenant_id, invoice_number);

-- Rename the old non-tenant invoice_no index to match the new column name.
ALTER INDEX IF EXISTS idx_einvoice_orders_invoice_no RENAME TO idx_einvoice_orders_invoice_number;
