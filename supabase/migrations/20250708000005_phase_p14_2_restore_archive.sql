-- P14.2: Admin dashboard — per-tenant restore + archive tenant + import workflow
-- Adds RPC restore_tenant_tables plus a dependency-order helper so restores respect FK constraints.
-- ponytail: archive/unarchive reuses the existing `archived` status from P1; this migration only adds the restore/import path.

-- ============================================================
-- 1. Helper: tenant-scoped tables in FK dependency order (parents before children)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tenant_restore_table_order()
RETURNS TABLE(table_name TEXT, depth INT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tables TEXT[];
BEGIN
  SELECT array_agg(c.table_name::TEXT)
  INTO v_tables
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON c.table_schema = t.table_schema
   AND c.table_name = t.table_name
  WHERE c.table_schema = 'public'
    AND c.column_name = 'tenant_id'
    AND t.table_type = 'BASE TABLE';

  RETURN QUERY
  WITH RECURSIVE all_tables AS (
    SELECT unnest(v_tables) AS table_name
  ),
  deps AS (
    -- parent -> child FK relationships between tenant-scoped tables
    SELECT
      tc.table_name::TEXT AS parent_table,
      kcu.table_name::TEXT AS child_table
    FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc
      ON rc.unique_constraint_schema = tc.constraint_schema
     AND rc.unique_constraint_name = tc.constraint_name
    JOIN information_schema.key_column_usage kcu
      ON rc.constraint_schema = kcu.constraint_schema
     AND rc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND kcu.table_schema = 'public'
  ),
  ordered AS (
    SELECT at.table_name, 0 AS depth, ARRAY[at.table_name] AS path
    FROM all_tables at
    WHERE at.table_name NOT IN (SELECT child_table FROM deps)

    UNION ALL

    SELECT d.child_table, o.depth + 1, o.path || d.child_table
    FROM deps d
    JOIN ordered o ON d.parent_table = o.table_name
    WHERE NOT d.child_table = ANY(o.path)
  )
  SELECT o.table_name, MAX(o.depth) AS depth
  FROM ordered o
  GROUP BY o.table_name
  ORDER BY MAX(o.depth), o.table_name;
END;
$$;

REVOKE ALL ON FUNCTION public.get_tenant_restore_table_order() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_restore_table_order() TO service_role;

-- ============================================================
-- 2. RPC: restore tenant data from a JSON backup
-- ============================================================

CREATE OR REPLACE FUNCTION public.restore_tenant_tables(
  p_tenant_id UUID,
  p_tables JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table TEXT;
  v_order TEXT[];
  v_row JSONB;
  v_inserted INT;
  v_total_inserted INT := 0;
  v_restored JSONB := '[]'::JSONB;
  v_errors JSONB := '[]'::JSONB;
  v_backup_table_count INT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được restore tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu tenant_id';
  END IF;

  IF p_tables IS NULL OR p_tables = '{}'::JSONB THEN
    RAISE EXCEPTION 'Dữ liệu backup trống';
  END IF;

  PERFORM id FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  SELECT COUNT(*) INTO v_backup_table_count
  FROM jsonb_object_keys(p_tables) t(table_name);

  IF v_backup_table_count = 0 THEN
    RAISE EXCEPTION 'Backup không chứa bảng nào';
  END IF;

  -- Resolve insert order; filter to tables actually present in backup.
  SELECT array_agg(o.table_name ORDER BY o.depth, o.table_name)
  INTO v_order
  FROM public.get_tenant_restore_table_order() o
  WHERE p_tables ? o.table_name;

  IF v_order IS NULL OR array_length(v_order, 1) IS NULL THEN
    RAISE EXCEPTION 'Backup không chứa bảng nào có thể restore';
  END IF;

  -- ponytail: delete existing tenant data in reverse dependency order so FK checks pass.
  FOR i IN REVERSE array_length(v_order, 1) .. 1 LOOP
    v_table := v_order[i];
    EXECUTE format('DELETE FROM public.%I WHERE tenant_id = $1', v_table)
      USING p_tenant_id;
  END LOOP;

  -- Insert backup rows in dependency order, overriding tenant_id to the target tenant.
  FOREACH v_table IN ARRAY v_order LOOP
    v_inserted := 0;

    FOR v_row IN SELECT jsonb_array_elements(p_tables -> v_table) LOOP
      v_row := jsonb_set(v_row, '{tenant_id}', to_jsonb(p_tenant_id::TEXT));

      BEGIN
        EXECUTE format(
          'INSERT INTO public.%I SELECT * FROM jsonb_populate_record(null::public.%I, $1)',
          v_table,
          v_table
        ) USING v_row;
        v_inserted := v_inserted + 1;
      EXCEPTION
        WHEN unique_violation THEN
          -- Duplicate id from a related row already inserted; skip.
          NULL;
        WHEN OTHERS THEN
          v_errors := v_errors || jsonb_build_array(jsonb_build_object(
            'table', v_table,
            'error', SQLERRM
          ));
          EXIT;
      END;
    END LOOP;

    IF v_inserted > 0 THEN
      v_restored := v_restored || jsonb_build_array(jsonb_build_object(
        'table', v_table,
        'rows', v_inserted
      ));
      v_total_inserted := v_total_inserted + v_inserted;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'restored', v_restored,
    'errors', v_errors,
    'total_rows', v_total_inserted
  );
END;
$$;

REVOKE ALL ON FUNCTION public.restore_tenant_tables(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_tenant_tables(UUID, JSONB) TO service_role;
