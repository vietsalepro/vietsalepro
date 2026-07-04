## Context

This change implements sub-phase 3.1: Core business tables from the multi-tenancy migration plan.

Affected tables: `products`, `customers`, `orders`, `order_items`, `suppliers`, `promotions`

## Goals / Non-Goals

**Goals:**
- Core business tables

- Code changes:
  - Thêm `tenant_id` vào interface của 6 bảng trong `types.ts`.

**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id UUID;
  ALTER TABLE public.products ADD CONSTRAINT products_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  CREATE INDEX idx_products_tenant_id ON public.products(tenant_id);
  -- Lặp lại cho 5 bảng còn lại
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.