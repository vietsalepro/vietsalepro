-- Sub-phase 10.1: DB policies theo role
-- ponytail: PostgreSQL kết hợp các policy bằng OR. Nếu giữ policy INSERT/UPDATE/DELETE
-- generic của Phase 5 và thêm policy theo role, nhân viên vẫn insert được.
-- Vì vậy ở các bảng cần phân quyền chi tiết, cần DROP policy generic trước.
-- Bảng chỉ cần tenant isolation (ví dụ order_items, import_items) giữ nguyên.

-- ============================================================================
-- 1. Helper functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_tenant_role(p_tenant_id UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.tenant_memberships
  WHERE tenant_id = p_tenant_id AND user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================================
-- 2. Replace generic write policies with role-based ones
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- Pattern A: admin/cashier create; only admin update/delete
  FOREACH tbl IN ARRAY ARRAY['orders', 'customers']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON public.%I', tbl);

      EXECUTE format(
        'CREATE POLICY %I_insert_by_role ON public.%I FOR INSERT TO authenticated '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.user_tenant_role(tenant_id) IN (''admin'', ''cashier''))',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY %I_update_by_role ON public.%I FOR UPDATE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'') '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY %I_delete_admin_only ON public.%I FOR DELETE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );
    END IF;
  END LOOP;

  -- Pattern B: admin/inventory_manager create; only admin update/delete
  FOREACH tbl IN ARRAY ARRAY['products', 'import_receipts', 'inventory_counts', 'disposals', 'suppliers']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON public.%I', tbl);

      EXECUTE format(
        'CREATE POLICY %I_insert_by_role ON public.%I FOR INSERT TO authenticated '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.user_tenant_role(tenant_id) IN (''admin'', ''inventory_manager''))',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY %I_update_by_role ON public.%I FOR UPDATE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'') '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY %I_delete_admin_only ON public.%I FOR DELETE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );
    END IF;
  END LOOP;

  -- Pattern C: admin-only config tables
  FOREACH tbl IN ARRAY ARRAY['app_settings', 'einvoice_config', 'rank_configs', 'brands', 'categories', 'promotions', 'rewards']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON public.%I', tbl);

      EXECUTE format(
        'CREATE POLICY %I_insert_admin_only ON public.%I FOR INSERT TO authenticated '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY %I_update_admin_only ON public.%I FOR UPDATE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'') '
        'WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY %I_delete_admin_only ON public.%I FOR DELETE TO authenticated '
        'USING (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id) AND public.user_tenant_role(tenant_id) = ''admin'')',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;
