-- P14.3: Admin dashboard — cross-environment tenant data migration + reset demo data.
-- Adds RPCs:
--   - migrate_tenant_data(source, target): clone all tenant-scoped rows from source tenant to target tenant within the same database.
--   - reset_demo_data(tenant_id): wipe business data of a tenant while keeping tenant account, memberships, subscriptions and settings.
-- ponytail: both functions are same-project primitives. True cross-project migration is orchestrated outside (Edge Function/CLI) using the backup/restore workflow from P14.1/P14.2.

SET timezone = 'Asia/Ho_Chi_Minh';

-- ============================================================
-- 1. RPC: migrate tenant data between tenants in the same project
-- ============================================================

CREATE OR REPLACE FUNCTION public.migrate_tenant_data(
  p_source_tenant_id UUID,
  p_target_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_table TEXT;
  v_order TEXT[];
  v_rows JSONB;
  v_tables JSONB := '{}'::JSONB;
  v_result JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được migrate tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_source_tenant_id IS NULL OR p_target_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu source tenant_id hoặc target tenant_id';
  END IF;

  IF p_source_tenant_id = p_target_tenant_id THEN
    RAISE EXCEPTION 'Source và target tenant phải khác nhau';
  END IF;

  PERFORM id FROM public.tenants WHERE id = p_source_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy source tenant: %', p_source_tenant_id;
  END IF;

  PERFORM id FROM public.tenants WHERE id = p_target_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy target tenant: %', p_target_tenant_id;
  END IF;

  -- ponytail: copy in FK dependency order so child rows reference already-copied parents.
  SELECT array_agg(o.table_name ORDER BY o.depth, o.table_name)
  INTO v_order
  FROM public.get_tenant_restore_table_order() o;

  IF v_order IS NULL OR array_length(v_order, 1) IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy bảng tenant-scoped nào để migrate';
  END IF;

  FOREACH v_table IN ARRAY v_order LOOP
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) FROM public.%I t WHERE t.tenant_id = $1',
      v_table
    ) INTO v_rows USING p_source_tenant_id;

    v_tables := v_tables || jsonb_build_object(v_table, v_rows);
  END LOOP;

  SELECT public.restore_tenant_tables(p_target_tenant_id, v_tables) INTO v_result;

  RETURN jsonb_build_object(
    'source_tenant_id', p_source_tenant_id,
    'target_tenant_id', p_target_tenant_id,
    'result', v_result
  );
END;
$$;

REVOKE ALL ON FUNCTION public.migrate_tenant_data(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.migrate_tenant_data(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_tenant_data(UUID, UUID) TO service_role;

-- ============================================================
-- 2. RPC: reset demo data for a tenant
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_demo_data(
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_table TEXT;
  v_order TEXT[];
  v_deleted INT;
  v_total INT := 0;
  v_cleared JSONB := '[]'::JSONB;
  v_protected TEXT[] := ARRAY['tenants', 'tenant_memberships', 'tenant_subscriptions', 'system_settings', 'app_audit_log', 'plans', 'system_admins'];
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được reset demo data' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu tenant_id';
  END IF;

  PERFORM id FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  -- ponytail: delete in reverse dependency order so FK constraints stay valid.
  SELECT array_agg(o.table_name ORDER BY o.depth DESC)
  INTO v_order
  FROM public.get_tenant_restore_table_order() o
  WHERE NOT (o.table_name = ANY(v_protected));

  IF v_order IS NOT NULL AND array_length(v_order, 1) IS NOT NULL THEN
    FOREACH v_table IN ARRAY v_order LOOP
      EXECUTE format('DELETE FROM public.%I WHERE tenant_id = $1', v_table)
        USING p_tenant_id;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      IF v_deleted > 0 THEN
        v_cleared := v_cleared || jsonb_build_array(jsonb_build_object('table', v_table, 'rows', v_deleted));
        v_total := v_total + v_deleted;
      END IF;
    END LOOP;
  END IF;

  -- Reset order counter so the tenant starts a fresh billing month.
  UPDATE public.tenant_subscriptions
  SET current_month_orders = 0,
      current_month_start = CURRENT_DATE,
      updated_at = now()
  WHERE tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'cleared', v_cleared,
    'total_rows', v_total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reset_demo_data(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_demo_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_demo_data(UUID) TO service_role;
