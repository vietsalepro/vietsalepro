-- Phase 3.2: Add tenant_id to inventory & stock tables
-- Tables: import_receipts, import_items, inventory_counts, inventory_count_items,
--          inventory_movements, disposals, disposal_items, product_lots, stock_movements,
--          return_orders, return_order_items, supplier_exchanges,
--          supplier_exchange_return_items, supplier_exchange_received_items

-- ============================================================
-- 1. Add nullable tenant_id columns
-- ============================================================
ALTER TABLE public.import_receipts ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.import_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.inventory_counts ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.inventory_count_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.disposals ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.disposal_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.product_lots ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.return_orders ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.return_order_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.supplier_exchanges ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.supplier_exchange_return_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.supplier_exchange_received_items ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- ============================================================
-- 2. Add tenant lookup indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_import_receipts_tenant_id ON public.import_receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_import_items_tenant_id ON public.import_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_tenant_id ON public.inventory_counts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_count_items_tenant_id ON public.inventory_count_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_id ON public.inventory_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_disposals_tenant_id ON public.disposals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_disposal_items_tenant_id ON public.disposal_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_lots_tenant_id ON public.product_lots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_id ON public.stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_return_orders_tenant_id ON public.return_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_return_order_items_tenant_id ON public.return_order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_exchanges_tenant_id ON public.supplier_exchanges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_exchange_return_items_tenant_id ON public.supplier_exchange_return_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_exchange_received_items_tenant_id ON public.supplier_exchange_received_items(tenant_id);

-- ============================================================
-- 3. Add foreign keys to public.tenants (idempotent)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.import_receipts'::regclass AND conname = 'fk_import_receipts_tenant_id') THEN
    ALTER TABLE public.import_receipts ADD CONSTRAINT fk_import_receipts_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.import_items'::regclass AND conname = 'fk_import_items_tenant_id') THEN
    ALTER TABLE public.import_items ADD CONSTRAINT fk_import_items_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.inventory_counts'::regclass AND conname = 'fk_inventory_counts_tenant_id') THEN
    ALTER TABLE public.inventory_counts ADD CONSTRAINT fk_inventory_counts_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.inventory_count_items'::regclass AND conname = 'fk_inventory_count_items_tenant_id') THEN
    ALTER TABLE public.inventory_count_items ADD CONSTRAINT fk_inventory_count_items_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.inventory_movements'::regclass AND conname = 'fk_inventory_movements_tenant_id') THEN
    ALTER TABLE public.inventory_movements ADD CONSTRAINT fk_inventory_movements_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.disposals'::regclass AND conname = 'fk_disposals_tenant_id') THEN
    ALTER TABLE public.disposals ADD CONSTRAINT fk_disposals_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.disposal_items'::regclass AND conname = 'fk_disposal_items_tenant_id') THEN
    ALTER TABLE public.disposal_items ADD CONSTRAINT fk_disposal_items_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.product_lots'::regclass AND conname = 'fk_product_lots_tenant_id') THEN
    ALTER TABLE public.product_lots ADD CONSTRAINT fk_product_lots_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.stock_movements'::regclass AND conname = 'fk_stock_movements_tenant_id') THEN
    ALTER TABLE public.stock_movements ADD CONSTRAINT fk_stock_movements_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.return_orders'::regclass AND conname = 'fk_return_orders_tenant_id') THEN
    ALTER TABLE public.return_orders ADD CONSTRAINT fk_return_orders_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.return_order_items'::regclass AND conname = 'fk_return_order_items_tenant_id') THEN
    ALTER TABLE public.return_order_items ADD CONSTRAINT fk_return_order_items_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.supplier_exchanges'::regclass AND conname = 'fk_supplier_exchanges_tenant_id') THEN
    ALTER TABLE public.supplier_exchanges ADD CONSTRAINT fk_supplier_exchanges_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.supplier_exchange_return_items'::regclass AND conname = 'fk_supplier_exchange_return_items_tenant_id') THEN
    ALTER TABLE public.supplier_exchange_return_items ADD CONSTRAINT fk_supplier_exchange_return_items_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.supplier_exchange_received_items'::regclass AND conname = 'fk_supplier_exchange_received_items_tenant_id') THEN
    ALTER TABLE public.supplier_exchange_received_items ADD CONSTRAINT fk_supplier_exchange_received_items_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;
END $$;
