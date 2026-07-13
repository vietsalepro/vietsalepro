-- SP-1.4: Add missing RLS policies
-- Source: docs/rls-gap-analysis.md
-- ponytail: idempotent; enable RLS and add policies only when they do not already exist.

-- ============================================================================
-- 1. Tenant-scoped tables missing RLS
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['tenant_restore_snapshots', 'orders_archive', 'order_items_archive', 'app_audit_log_partitioned']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

-- tenant_restore_snapshots: tenant members view their own snapshots; system admins bypass.
-- ponytail: snapshots are created only by the SECURITY DEFINER restore RPC; no client writes.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenant_restore_snapshots') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'tenant_restore_snapshots' AND policyname = 'tenant_restore_snapshots_select'
    ) THEN
      CREATE POLICY "tenant_restore_snapshots_select" ON public.tenant_restore_snapshots FOR SELECT TO authenticated
        USING ((tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id)) OR public.is_system_admin());
    END IF;
  END IF;
END $$;

-- orders_archive / order_items_archive: tenant members read-only archives.
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['orders_archive', 'order_items_archive']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = tbl AND policyname = tbl || '_select'
      ) THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated '
          'USING ((tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id)) OR public.is_system_admin())',
          tbl || '_select', tbl
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- app_audit_log_partitioned: mirror app_audit_log policy (tenant admin or system admin).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'app_audit_log_partitioned') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'app_audit_log_partitioned' AND policyname = 'app_audit_log_partitioned_tenant_admin'
    ) THEN
      CREATE POLICY "app_audit_log_partitioned_tenant_admin" ON public.app_audit_log_partitioned FOR SELECT TO authenticated
        USING (public.is_tenant_admin(tenant_id) OR public.is_system_admin());
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 2. Tenant-scoped table with RLS enabled but zero policies
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'billing_email_logs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'billing_email_logs' AND policyname = 'billing_email_logs_select'
    ) THEN
      CREATE POLICY "billing_email_logs_select" ON public.billing_email_logs FOR SELECT TO authenticated
        USING ((tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id)) OR public.is_system_admin());
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 3. Security-sensitive global table missing RLS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_2fa_backup_code_attempts') THEN
    ALTER TABLE public.admin_2fa_backup_code_attempts ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'admin_2fa_backup_code_attempts' AND policyname = 'admin_2fa_backup_code_attempts_owner_select'
    ) THEN
      CREATE POLICY "admin_2fa_backup_code_attempts_owner_select" ON public.admin_2fa_backup_code_attempts FOR SELECT TO authenticated
        USING (user_id = auth.uid() OR public.is_system_admin());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'admin_2fa_backup_code_attempts' AND policyname = 'admin_2fa_backup_code_attempts_owner_insert'
    ) THEN
      CREATE POLICY "admin_2fa_backup_code_attempts_owner_insert" ON public.admin_2fa_backup_code_attempts FOR INSERT TO authenticated
        WITH CHECK (user_id = auth.uid());
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 4. Optional global catalogs
-- ============================================================================

-- plan_features: authenticated users can read the catalog; writes stay in service/edge functions.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plan_features') THEN
    ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'plan_features' AND policyname = 'plan_features_authenticated_select'
    ) THEN
      CREATE POLICY "plan_features_authenticated_select" ON public.plan_features FOR SELECT TO authenticated
        USING (true);
    END IF;
  END IF;
END $$;

-- invoice_number_counters: only service_role can access directly; the SECURITY DEFINER function bypasses RLS.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoice_number_counters') THEN
    ALTER TABLE public.invoice_number_counters ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'invoice_number_counters' AND policyname = 'invoice_number_counters_service_role_all'
    ) THEN
      CREATE POLICY "invoice_number_counters_service_role_all" ON public.invoice_number_counters FOR ALL TO authenticated
        USING (current_user = 'service_role')
        WITH CHECK (current_user = 'service_role');
    END IF;
  END IF;
END $$;
