## Context

This change implements sub-phase 3.3: Config & misc tables from the multi-tenancy migration plan.

Affected tables: `app_settings`, `brands`, `categories`, `einvoice_config`, `einvoice_orders`, `point_history`, `processed_operations`, `rank_configs`, `rank_history`, `rewards`, `customer_payment_ledger`, `supplier_payment_ledger`

## Goals / Non-Goals

**Goals:**
- Config & misc tables

- Code changes:
  - Thêm `tenant_id` vào interface của 12 bảng trong `types.ts`.

**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  -- Mẫu cho từng bảng
  ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS tenant_id UUID;
  ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  CREATE INDEX idx_app_settings_tenant_id ON public.app_settings(tenant_id);
  -- Lặp lại cho 11 bảng còn lại
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.