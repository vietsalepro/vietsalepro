-- Sub-Phase 3.2: Enable RLS on tenants/tenant_memberships with Basejump policies.
-- Reference: Basejump Section 3.3 — select → members, update/insert → admins, delete → owners + system_admin fallback.
-- ponytail: idempotent policy replacement; uses helpers from Sub-Phase 3.1.

-- ============================================================
-- 1. Ensure RLS is enabled
-- ============================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Drop old conflicting policies (replaced by Basejump pattern below)
-- ============================================================

DROP POLICY IF EXISTS "tenant_member_view_own" ON public.tenants;
DROP POLICY IF EXISTS "system_admin_manage_tenants" ON public.tenants;
DROP POLICY IF EXISTS "members_select_own" ON public.tenant_memberships;
DROP POLICY IF EXISTS "block_direct_insert" ON public.tenant_memberships;
DROP POLICY IF EXISTS "block_direct_update" ON public.tenant_memberships;
DROP POLICY IF EXISTS "block_direct_delete" ON public.tenant_memberships;
DROP POLICY IF EXISTS "tenant_membership_member_view_own" ON public.tenant_memberships;
DROP POLICY IF EXISTS "tenant_admin_manage_memberships" ON public.tenant_memberships;

-- ============================================================
-- 3. tenants policies
-- ============================================================

-- SELECT: any member of the tenant can view the tenant row.
CREATE POLICY "tenants_select_for_members"
  ON public.tenants FOR SELECT TO authenticated
  USING (
    public.has_tenant_role(id, 'owner')
    OR public.has_tenant_role(id, 'admin')
    OR public.has_tenant_role(id, 'cashier')
    OR public.has_tenant_role(id, 'inventory_manager')
    OR public.has_tenant_role(id, 'accountant')
    OR public.has_tenant_role(id, 'viewer')
    OR public.is_system_admin()
  );

-- INSERT: only system admins can create tenants directly. Edge functions use service role to bypass RLS.
CREATE POLICY "tenants_insert_for_system_admins"
  ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (public.is_system_admin());

-- UPDATE: admins or owners of the tenant, plus system admins, can update.
CREATE POLICY "tenants_update_for_admins"
  ON public.tenants FOR UPDATE TO authenticated
  USING (
    public.has_tenant_role(id, 'admin')
    OR public.has_tenant_role(id, 'owner')
    OR public.is_system_admin()
  )
  WITH CHECK (
    public.has_tenant_role(id, 'admin')
    OR public.has_tenant_role(id, 'owner')
    OR public.is_system_admin()
  );

-- DELETE: only the tenant owner or a system admin can delete.
CREATE POLICY "tenants_delete_for_owners"
  ON public.tenants FOR DELETE TO authenticated
  USING (public.is_tenant_owner(id) OR public.is_system_admin());

-- ============================================================
-- 4. tenant_memberships policies
-- ============================================================

-- SELECT: any tenant member can view memberships in their tenant.
CREATE POLICY "tenant_memberships_select_for_members"
  ON public.tenant_memberships FOR SELECT TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.has_tenant_role(tenant_id, 'cashier')
    OR public.has_tenant_role(tenant_id, 'inventory_manager')
    OR public.has_tenant_role(tenant_id, 'accountant')
    OR public.has_tenant_role(tenant_id, 'viewer')
    OR public.is_system_admin()
  );

-- INSERT: admins or owners can invite/add members.
CREATE POLICY "tenant_memberships_insert_for_admins"
  ON public.tenant_memberships FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'admin')
    OR public.has_tenant_role(tenant_id, 'owner')
    OR public.is_system_admin()
  );

-- UPDATE: admins or owners can update member roles/status.
CREATE POLICY "tenant_memberships_update_for_admins"
  ON public.tenant_memberships FOR UPDATE TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'admin')
    OR public.has_tenant_role(tenant_id, 'owner')
    OR public.is_system_admin()
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'admin')
    OR public.has_tenant_role(tenant_id, 'owner')
    OR public.is_system_admin()
  );

-- DELETE: only owners or system admins can remove memberships.
CREATE POLICY "tenant_memberships_delete_for_owners"
  ON public.tenant_memberships FOR DELETE TO authenticated
  USING (public.is_tenant_owner(tenant_id) OR public.is_system_admin());
