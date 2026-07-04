## Context

This change implements sub-phase 2: Tạo foundation multi-tenancy (giữ nguyên) from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- Có `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins`.

- Code changes:
  - `types/tenant.ts`: `Tenant`, `TenantMembership`, `TenantRole`, `TenantSubscription`
  - `services/tenantService.ts`: `getTenantBySubdomain`, `getMembership`, `inviteMember`, `updateMemberRole`, `removeMember`

**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','trial','pending')),
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','vip')),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  
  CREATE TABLE public.tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin','cashier','inventory_manager','accountant')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, user_id)
  );
  
  CREATE TABLE public.tenant_subscriptions (
    tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free',
    max_users INTEGER NOT NULL DEFAULT 1,
    max_products INTEGER NOT NULL DEFAULT 50,
    max_orders_per_month INTEGER NOT NULL DEFAULT 300,
    current_month_orders INTEGER NOT NULL DEFAULT 0,
    current_month_start DATE NOT NULL DEFAULT CURRENT_DATE,
    billing_status TEXT DEFAULT 'ok',
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  
  CREATE TABLE public.system_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
  );
  
  CREATE OR REPLACE FUNCTION public.is_system_admin()
  RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid());
  $$;
  
  CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id UUID)
  RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (SELECT 1 FROM public.tenant_memberships WHERE tenant_id = p_tenant_id AND user_id = auth.uid());
  $$;
  
  CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id UUID)
  RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (SELECT 1 FROM public.tenant_memberships WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = 'admin');
  $$;
  
  CREATE OR REPLACE FUNCTION public.has_tenant_role(p_tenant_id UUID, p_role TEXT)
  RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (SELECT 1 FROM public.tenant_memberships WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = p_role);
  $$;
  
  CREATE OR REPLACE FUNCTION public.get_tenant_by_subdomain(p_subdomain TEXT)
  RETURNS public.tenants LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT * FROM public.tenants WHERE subdomain = p_subdomain LIMIT 1;
  $$;
  ```
  ```sql
  ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "tenant_admin_view_own" ON public.tenants FOR SELECT TO authenticated
  USING (id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid()) OR is_system_admin());
  
  CREATE POLICY "system_admin_manage_tenants" ON public.tenants FOR ALL TO authenticated
  USING (is_system_admin()) WITH CHECK (is_system_admin());
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.