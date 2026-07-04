## Context

This change implements sub-phase 4.2: Backfill remaining tables + orphan cleanup + FK from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- Backfill remaining tables + orphan cleanup + FK


**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  -- Backfill remaining tables
  DO $$
  DECLARE v_tenant_id UUID;
  BEGIN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE subdomain = 'main';
    UPDATE public.app_settings SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.brands SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.categories SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.customer_payment_ledger SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.disposal_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.disposals SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.einvoice_config SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.einvoice_orders SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.import_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.import_receipts SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.inventory_count_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.inventory_counts SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.inventory_movements SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.point_history SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.processed_operations SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.product_lots SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.rank_configs SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.rank_history SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.return_order_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.return_orders SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.rewards SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.stock_movements SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.supplier_exchange_received_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.supplier_exchange_return_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.supplier_exchanges SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.supplier_payment_ledger SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  END $$;
  
  -- Set NOT NULL remaining
  ALTER TABLE public.app_settings ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.brands ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.categories ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.customer_payment_ledger ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.disposal_items ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.disposals ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.einvoice_config ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.einvoice_orders ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.import_items ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.import_receipts ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.inventory_count_items ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.inventory_counts ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.inventory_movements ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.point_history ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.processed_operations ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.product_lots ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.rank_configs ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.rank_history ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.return_order_items ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.return_orders ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.rewards ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.stock_movements ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.supplier_exchange_received_items ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.supplier_exchange_return_items ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.supplier_exchanges ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.supplier_payment_ledger ALTER COLUMN tenant_id SET NOT NULL;
  
  -- Backup orphan records
  CREATE TABLE IF NOT EXISTS public.orphan_records_backup (
    table_name TEXT,
    backed_up_at TIMESTAMPTZ DEFAULT now(),
    data JSONB
  );
  
  -- ponytail: backup các record mồ côi ở bảng cha-con trước khi thêm FK.
  INSERT INTO public.orphan_records_backup (table_name, data)
  SELECT 'order_items', to_jsonb(t.*) FROM public.order_items t WHERE order_id IS NULL;
  INSERT INTO public.orphan_records_backup (table_name, data)
  SELECT 'import_items', to_jsonb(t.*) FROM public.import_items t WHERE import_receipt_id IS NULL;
  INSERT INTO public.orphan_records_backup (table_name, data)
  SELECT 'product_lots', to_jsonb(t.*) FROM public.product_lots t WHERE product_id IS NULL;
  INSERT INTO public.orphan_records_backup (table_name, data)
  SELECT 'return_order_items', to_jsonb(t.*) FROM public.return_order_items t WHERE return_order_id IS NULL;
  INSERT INTO public.orphan_records_backup (table_name, data)
  SELECT 'inventory_count_items', to_jsonb(t.*) FROM public.inventory_count_items t WHERE inventory_count_id IS NULL;
  INSERT INTO public.orphan_records_backup (table_name, data)
  SELECT 'disposal_items', to_jsonb(t.*) FROM public.disposal_items t WHERE disposal_id IS NULL;
  INSERT INTO public.orphan_records_backup (table_name, data)
  SELECT 'supplier_exchange_return_items', to_jsonb(t.*) FROM public.supplier_exchange_return_items t WHERE supplier_exchange_id IS NULL;
  INSERT INTO public.orphan_records_backup (table_name, data)
  SELECT 'supplier_exchange_received_items', to_jsonb(t.*) FROM public.supplier_exchange_received_items t WHERE supplier_exchange_id IS NULL;
  
  -- Delete orphan records
  DELETE FROM public.order_items WHERE order_id IS NULL;
  DELETE FROM public.import_items WHERE import_receipt_id IS NULL;
  DELETE FROM public.product_lots WHERE product_id IS NULL;
  DELETE FROM public.return_order_items WHERE return_order_id IS NULL;
  DELETE FROM public.inventory_count_items WHERE inventory_count_id IS NULL;
  DELETE FROM public.disposal_items WHERE disposal_id IS NULL;
  DELETE FROM public.supplier_exchange_return_items WHERE supplier_exchange_id IS NULL;
  DELETE FROM public.supplier_exchange_received_items WHERE supplier_exchange_id IS NULL;
  
  -- Add missing FKs (NO ACTION: không cho xóa lô nếu còn tham chiếu)
  ALTER TABLE public.order_items ADD CONSTRAINT order_items_lot_id_fkey
    FOREIGN KEY (lot_id) REFERENCES public.product_lots(id) ON DELETE NO ACTION;
  ALTER TABLE public.return_order_items ADD CONSTRAINT return_order_items_lot_id_fkey
    FOREIGN KEY (lot_id) REFERENCES public.product_lots(id) ON DELETE NO ACTION;
  ALTER TABLE public.import_items ADD CONSTRAINT import_items_lot_id_fkey
    FOREIGN KEY (lot_id) REFERENCES public.product_lots(id) ON DELETE NO ACTION;
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.