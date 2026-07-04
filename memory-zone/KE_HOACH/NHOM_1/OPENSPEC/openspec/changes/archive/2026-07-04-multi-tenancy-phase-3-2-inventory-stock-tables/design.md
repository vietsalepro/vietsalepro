## Context

This change implements sub-phase 3.2: Inventory & stock tables from the multi-tenancy migration plan.

Affected tables: `import_receipts`, `import_items`, `inventory_counts`, `inventory_count_items`, `inventory_movements`, `disposals`, `disposal_items`, `product_lots`, `stock_movements`, `return_orders`, `return_order_items`, `supplier_exchanges`, `supplier_exchange_return_items`, `supplier_exchange_received_items`

## Goals / Non-Goals

**Goals:**
- Inventory & stock tables

- Code changes:
  - Thêm `tenant_id` vào interface của 13 bảng trong `types.ts`.

**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  -- Mẫu cho từng bảng
  ALTER TABLE public.import_receipts ADD COLUMN IF NOT EXISTS tenant_id UUID;
  ALTER TABLE public.import_receipts ADD CONSTRAINT import_receipts_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  CREATE INDEX idx_import_receipts_tenant_id ON public.import_receipts(tenant_id);
  -- Lặp lại cho 12 bảng còn lại
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.