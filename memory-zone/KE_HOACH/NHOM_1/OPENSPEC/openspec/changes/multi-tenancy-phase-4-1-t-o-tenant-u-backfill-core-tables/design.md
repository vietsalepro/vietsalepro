## Context

This change implements sub-phase 4.1: Tạo tenant đầu + backfill core tables from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- Dữ liệu cũ thuộc về tenant đầu tiên; xử lý core tables trước.


**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  -- Tạo tenant đầu tiên
  INSERT INTO public.tenants (id, name, subdomain, status, plan, owner_id)
  SELECT gen_random_uuid(), 'Cửa hàng chính', 'main', 'active', 'vip', NULL
  WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE subdomain = 'main');
  
  -- Tạo subscription cho tenant đầu tiên (VIP không giới hạn)
  INSERT INTO public.tenant_subscriptions (tenant_id, plan, max_users, max_products, max_orders_per_month)
  SELECT id, 'vip', 999, 999999, 999999
  FROM public.tenants
  WHERE subdomain = 'main'
  ON CONFLICT (tenant_id) DO NOTHING;
  
  -- Tất cả user hiện có trở thành admin của tenant đầu tiên
  DO $$
  DECLARE v_tenant_id UUID;
  BEGIN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE subdomain = 'main';
    INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
    SELECT v_tenant_id, id, 'admin'
    FROM auth.users
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
  END $$;
  
  -- Backfill core tables
  DO $$
  DECLARE v_tenant_id UUID;
  BEGIN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE subdomain = 'main';
    UPDATE public.products SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.customers SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.suppliers SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.orders SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.order_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.promotions SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  END $$;
  
  -- Set NOT NULL core
  ALTER TABLE public.products ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.customers ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.suppliers ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.orders ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.order_items ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.promotions ALTER COLUMN tenant_id SET NOT NULL;
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.