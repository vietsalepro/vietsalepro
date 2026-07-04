-- Phase 2: Tạo foundation multi-tenancy
-- Mục tiêu: Có tenants, tenant_memberships, tenant_subscriptions, system_admins
-- và helper functions cơ bản để kiểm tra quyền.

-- ============================================================
-- 1. FOUNDATION TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tenants (
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

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','cashier','inventory_manager','accountant')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
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

CREATE TABLE IF NOT EXISTS public.system_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================
-- 2. HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(p_tenant_id UUID, p_role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = p_role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_by_subdomain(p_subdomain TEXT)
RETURNS public.tenants LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT * FROM public.tenants WHERE subdomain = p_subdomain LIMIT 1;
$$;

-- ============================================================
-- 3. RLS FOUNDATION
-- ============================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;

-- tenants: members see their own; system admins manage everything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'tenant_member_view_own'
  ) THEN
    CREATE POLICY "tenant_member_view_own"
      ON public.tenants FOR SELECT TO authenticated
      USING (
        id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid())
        OR is_system_admin()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'system_admin_manage_tenants'
  ) THEN
    CREATE POLICY "system_admin_manage_tenants"
      ON public.tenants FOR ALL TO authenticated
      USING (is_system_admin()) WITH CHECK (is_system_admin());
  END IF;
END $$;

-- tenant_memberships: members see their own row; tenant admins manage within their tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenant_memberships' AND policyname = 'tenant_membership_member_view_own'
  ) THEN
    CREATE POLICY "tenant_membership_member_view_own"
      ON public.tenant_memberships FOR SELECT TO authenticated
      USING (
        user_id = auth.uid()
        OR is_tenant_admin(tenant_id)
        OR is_system_admin()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenant_memberships' AND policyname = 'tenant_admin_manage_memberships'
  ) THEN
    CREATE POLICY "tenant_admin_manage_memberships"
      ON public.tenant_memberships FOR ALL TO authenticated
      USING (
        is_tenant_admin(tenant_id)
        OR is_system_admin()
      ) WITH CHECK (
        is_tenant_admin(tenant_id)
        OR is_system_admin()
      );
  END IF;
END $$;

-- tenant_subscriptions: members view; system admins manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenant_subscriptions' AND policyname = 'tenant_subscription_member_view'
  ) THEN
    CREATE POLICY "tenant_subscription_member_view"
      ON public.tenant_subscriptions FOR SELECT TO authenticated
      USING (
        tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid())
        OR is_system_admin()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenant_subscriptions' AND policyname = 'system_admin_manage_subscriptions'
  ) THEN
    CREATE POLICY "system_admin_manage_subscriptions"
      ON public.tenant_subscriptions FOR ALL TO authenticated
      USING (is_system_admin()) WITH CHECK (is_system_admin());
  END IF;
END $$;

-- system_admins: only system admins can see/manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_admins' AND policyname = 'system_admin_manage_system_admins'
  ) THEN
    CREATE POLICY "system_admin_manage_system_admins"
      ON public.system_admins FOR ALL TO authenticated
      USING (is_system_admin()) WITH CHECK (is_system_admin());
  END IF;
END $$;
