-- Add RLS policies for tenant_memberships
-- Previously this table had no RLS policies, only a trigger guardrail

ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: member được xem membership của chính mình, system admin xem tất cả, tenant admin xem members trong tenant
DROP POLICY IF EXISTS "members_select_own" ON public.tenant_memberships;
CREATE POLICY "members_select_own" ON public.tenant_memberships
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.is_system_admin() 
    OR public.is_tenant_admin(tenant_id)
  );

-- 2. INSERT: chỉ cho phép qua Edge Function (block direct insert)
DROP POLICY IF EXISTS "block_direct_insert" ON public.tenant_memberships;
CREATE POLICY "block_direct_insert" ON public.tenant_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 3. UPDATE: chỉ cho phép qua RPC (block direct update)
DROP POLICY IF EXISTS "block_direct_update" ON public.tenant_memberships;
CREATE POLICY "block_direct_update" ON public.tenant_memberships
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- 4. DELETE: chỉ cho phép qua RPC (block direct delete)
DROP POLICY IF EXISTS "block_direct_delete" ON public.tenant_memberships;
CREATE POLICY "block_direct_delete" ON public.tenant_memberships
  FOR DELETE
  TO authenticated
  USING (false);