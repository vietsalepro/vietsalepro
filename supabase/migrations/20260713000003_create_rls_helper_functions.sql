-- Sub-Phase 3.1: RLS helper functions
-- Basejump reference: Section 3.2
-- ponytail: SECURITY DEFINER + STABLE so these can be used inside RLS policies.

-- ============================================================
-- 1. has_tenant_role: current user has a specific role on a tenant
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_tenant_role(p_tenant_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
      AND role = p_role
  );
$$;

-- ============================================================
-- 2. get_tenants_for_user: tenant IDs the current user belongs to
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tenants_for_user(p_role TEXT DEFAULT NULL)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.tenant_memberships
  WHERE user_id = auth.uid()
    AND (p_role IS NULL OR role = p_role);
$$;

-- ============================================================
-- 3. is_tenant_owner: current user owns the tenant
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_tenant_owner(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
      AND role = 'owner'
  ) OR EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE id = p_tenant_id
      AND owner_id = auth.uid()
  );
$$;
