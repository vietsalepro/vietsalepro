-- Sub-Phase 3.3: Enable RLS on tenant-scoped business tables with Basejump policies.
-- Tables: products, orders, customers, suppliers, categories, brands.
-- Reference: Basejump Section 3.3 — select → members, update/insert → admins, delete → owners + system_admin fallback.
-- ponytail: idempotent policy replacement; drops legacy phase5_2/phase5_3 policies and recreates with helpers from Sub-Phase 3.1.

-- ============================================================
-- 1. Enable RLS on all target tables
-- ============================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Drop legacy phase5_2/phase5_3 policies on target tables
-- ============================================================

DROP POLICY IF EXISTS tenant_isolation_select ON public.products;
DROP POLICY IF EXISTS tenant_isolation_insert ON public.products;
DROP POLICY IF EXISTS tenant_isolation_update ON public.products;
DROP POLICY IF EXISTS tenant_isolation_delete ON public.products;

DROP POLICY IF EXISTS tenant_isolation_select ON public.orders;
DROP POLICY IF EXISTS tenant_isolation_insert ON public.orders;
DROP POLICY IF EXISTS tenant_isolation_update ON public.orders;
DROP POLICY IF EXISTS tenant_isolation_delete ON public.orders;

DROP POLICY IF EXISTS tenant_isolation_select ON public.customers;
DROP POLICY IF EXISTS tenant_isolation_insert ON public.customers;
DROP POLICY IF EXISTS tenant_isolation_update ON public.customers;
DROP POLICY IF EXISTS tenant_isolation_delete ON public.customers;

DROP POLICY IF EXISTS tenant_isolation_select ON public.suppliers;
DROP POLICY IF EXISTS tenant_isolation_insert ON public.suppliers;
DROP POLICY IF EXISTS tenant_isolation_update ON public.suppliers;
DROP POLICY IF EXISTS tenant_isolation_delete ON public.suppliers;

DROP POLICY IF EXISTS tenant_isolation_select ON public.categories;
DROP POLICY IF EXISTS tenant_isolation_insert ON public.categories;
DROP POLICY IF EXISTS tenant_isolation_update ON public.categories;
DROP POLICY IF EXISTS tenant_isolation_delete ON public.categories;

DROP POLICY IF EXISTS tenant_isolation_select ON public.brands;
DROP POLICY IF EXISTS tenant_isolation_insert ON public.brands;
DROP POLICY IF EXISTS tenant_isolation_update ON public.brands;
DROP POLICY IF EXISTS tenant_isolation_delete ON public.brands;

-- ============================================================
-- 3. products policies
-- ============================================================

CREATE POLICY "products_select_for_members"
  ON public.products FOR SELECT TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.has_tenant_role(tenant_id, 'cashier')
    OR public.has_tenant_role(tenant_id, 'inventory_manager')
    OR public.has_tenant_role(tenant_id, 'accountant')
    OR public.has_tenant_role(tenant_id, 'viewer')
    OR public.is_system_admin()
  );

CREATE POLICY "products_insert_for_admins"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

CREATE POLICY "products_update_for_admins"
  ON public.products FOR UPDATE TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

CREATE POLICY "products_delete_for_owners"
  ON public.products FOR DELETE TO authenticated
  USING (public.is_tenant_owner(tenant_id) OR public.is_system_admin());

-- ============================================================
-- 4. orders policies
-- ============================================================

CREATE POLICY "orders_select_for_members"
  ON public.orders FOR SELECT TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.has_tenant_role(tenant_id, 'cashier')
    OR public.has_tenant_role(tenant_id, 'inventory_manager')
    OR public.has_tenant_role(tenant_id, 'accountant')
    OR public.has_tenant_role(tenant_id, 'viewer')
    OR public.is_system_admin()
  );

CREATE POLICY "orders_insert_for_admins"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

CREATE POLICY "orders_update_for_admins"
  ON public.orders FOR UPDATE TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

CREATE POLICY "orders_delete_for_owners"
  ON public.orders FOR DELETE TO authenticated
  USING (public.is_tenant_owner(tenant_id) OR public.is_system_admin());

-- ============================================================
-- 5. customers policies
-- ============================================================

CREATE POLICY "customers_select_for_members"
  ON public.customers FOR SELECT TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.has_tenant_role(tenant_id, 'cashier')
    OR public.has_tenant_role(tenant_id, 'inventory_manager')
    OR public.has_tenant_role(tenant_id, 'accountant')
    OR public.has_tenant_role(tenant_id, 'viewer')
    OR public.is_system_admin()
  );

CREATE POLICY "customers_insert_for_admins"
  ON public.customers FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

CREATE POLICY "customers_update_for_admins"
  ON public.customers FOR UPDATE TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

CREATE POLICY "customers_delete_for_owners"
  ON public.customers FOR DELETE TO authenticated
  USING (public.is_tenant_owner(tenant_id) OR public.is_system_admin());

-- ============================================================
-- 6. suppliers policies
-- ============================================================

CREATE POLICY "suppliers_select_for_members"
  ON public.suppliers FOR SELECT TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.has_tenant_role(tenant_id, 'cashier')
    OR public.has_tenant_role(tenant_id, 'inventory_manager')
    OR public.has_tenant_role(tenant_id, 'accountant')
    OR public.has_tenant_role(tenant_id, 'viewer')
    OR public.is_system_admin()
  );

CREATE POLICY "suppliers_insert_for_admins"
  ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

CREATE POLICY "suppliers_update_for_admins"
  ON public.suppliers FOR UPDATE TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

CREATE POLICY "suppliers_delete_for_owners"
  ON public.suppliers FOR DELETE TO authenticated
  USING (public.is_tenant_owner(tenant_id) OR public.is_system_admin());

-- ============================================================
-- 7. categories policies
-- ============================================================

CREATE POLICY "categories_select_for_members"
  ON public.categories FOR SELECT TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.has_tenant_role(tenant_id, 'cashier')
    OR public.has_tenant_role(tenant_id, 'inventory_manager')
    OR public.has_tenant_role(tenant_id, 'accountant')
    OR public.has_tenant_role(tenant_id, 'viewer')
    OR public.is_system_admin()
  );

CREATE POLICY "categories_insert_for_admins"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

CREATE POLICY "categories_update_for_admins"
  ON public.categories FOR UPDATE TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

CREATE POLICY "categories_delete_for_owners"
  ON public.categories FOR DELETE TO authenticated
  USING (public.is_tenant_owner(tenant_id) OR public.is_system_admin());

-- ============================================================
-- 8. brands policies
-- ============================================================

CREATE POLICY "brands_select_for_members"
  ON public.brands FOR SELECT TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.has_tenant_role(tenant_id, 'cashier')
    OR public.has_tenant_role(tenant_id, 'inventory_manager')
    OR public.has_tenant_role(tenant_id, 'accountant')
    OR public.has_tenant_role(tenant_id, 'viewer')
    OR public.is_system_admin()
  );

CREATE POLICY "brands_insert_for_admins"
  ON public.brands FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

CREATE POLICY "brands_update_for_admins"
  ON public.brands FOR UPDATE TO authenticated
  USING (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, 'owner')
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

CREATE POLICY "brands_delete_for_owners"
  ON public.brands FOR DELETE TO authenticated
  USING (public.is_tenant_owner(tenant_id) OR public.is_system_admin());
