-- Sub-Phase 6.1 follow-up: tenant_memberships.role became the tenant_role enum,
-- so helper functions that compare it to text literals need a cast.
-- ponytail: role::text works whether the column is enum or text.

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
      AND role::text = p_role
  );
$$;

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
    AND (p_role IS NULL OR role::text = p_role);
$$;

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
      AND role::text = 'owner'
  ) OR EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE id = p_tenant_id
      AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role::text = 'admin'
  );
$$;
