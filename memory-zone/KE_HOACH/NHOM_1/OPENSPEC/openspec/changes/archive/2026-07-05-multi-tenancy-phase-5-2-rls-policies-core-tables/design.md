## Context

This change implements sub-phase 5.2: RLS policies — core tables from the multi-tenancy migration plan.

Affected tables: `products`, `customers`, `orders`, `order_items`, `suppliers`

## Goals / Non-Goals

**Goals:**
- RLS policies — core tables


**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  CREATE POLICY "tenant_isolation_select" ON public.products FOR SELECT TO authenticated
  USING ((tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id)) OR public.is_system_admin());
  
  CREATE POLICY "tenant_isolation_insert" ON public.products FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id));
  
  CREATE POLICY "tenant_isolation_update" ON public.products FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id));
  
  CREATE POLICY "tenant_isolation_delete" ON public.products FOR DELETE TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.is_tenant_admin(tenant_id));
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.