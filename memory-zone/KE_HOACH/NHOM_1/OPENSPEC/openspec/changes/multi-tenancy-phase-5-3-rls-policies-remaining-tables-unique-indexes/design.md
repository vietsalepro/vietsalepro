## Context

This change implements sub-phase 5.3: RLS policies — remaining tables + unique indexes from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- RLS policies — remaining tables + unique indexes


**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  -- Lặp lại policy template cho từng bảng
  -- products unique indexes
  CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_per_tenant
    ON public.products (tenant_id, sku) WHERE sku IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_per_tenant
    ON public.products (tenant_id, barcode) WHERE barcode IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_code_per_tenant
    ON public.orders (tenant_id, order_code);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_einvoice_orders_invoice_number_per_tenant
    ON public.einvoice_orders (tenant_id, invoice_number);
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.