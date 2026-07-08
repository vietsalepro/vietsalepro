-- P13.3: Admin dashboard — Storage usage per tenant + backup status card
-- ponytail: one RPC estimates per-tenant DB storage from tables with tenant_id.
-- Backup status is fetched by a separate Edge Function (system-backup) via the Supabase Management API.

-- ============================================================
-- 1. RPC: per-tenant storage usage estimate
-- ponytail: estimate because Supabase Postgres does not expose per-tenant disk pages.
-- Ceiling: exact byte counts would need per-tenant schemas or row-level size sampling.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tenant_storage_usage()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_table RECORD;
  v_table_bytes BIGINT;
  v_total_rows BIGINT;
  v_sql TEXT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem storage usage' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DROP TABLE IF EXISTS _tenant_storage;
  CREATE TEMP TABLE _tenant_storage (
    tenant_id UUID,
    table_name TEXT,
    row_count BIGINT,
    table_bytes BIGINT,
    estimated_bytes BIGINT
  ) ON COMMIT DROP;

  FOR v_table IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name
  LOOP
    BEGIN
      EXECUTE format(
        'SELECT pg_total_relation_size(%L::regclass), COALESCE(SUM(n_live_tup), 0) FROM pg_stat_user_tables WHERE schemaname = %L AND relname = %L',
        'public.' || quote_ident(v_table.table_name), 'public', v_table.table_name
      ) INTO v_table_bytes, v_total_rows;

      v_sql := format(
        'INSERT INTO _tenant_storage (tenant_id, table_name, row_count, table_bytes, estimated_bytes)
         SELECT tenant_id, %L, COUNT(*), %L::bigint,
           CASE WHEN %L::bigint > 0 THEN (%L::bigint * COUNT(*)) / %L::bigint ELSE 0 END
         FROM public.%I GROUP BY tenant_id',
        v_table.table_name, v_table_bytes, v_total_rows, v_table_bytes, v_total_rows, v_table.table_name
      );
      EXECUTE v_sql;
    EXCEPTION WHEN OTHERS THEN
      -- Skip tables we cannot inspect (e.g. locked or no stats yet).
      NULL;
    END;
  END LOOP;

  RETURN (
    SELECT json_build_object(
      'checkedAt', now(),
      'totalDatabaseBytes', pg_database_size(current_database()),
      'tenants', COALESCE(json_agg(row_to_json(t) ORDER BY t.total_bytes DESC), '[]'::json)
    )
    FROM (
      SELECT
        te.id,
        te.name,
        te.subdomain,
        COALESCE(SUM(ts.estimated_bytes), 0) AS total_bytes,
        COALESCE(json_agg(jsonb_build_object(
          'name', ts.table_name,
          'rowCount', ts.row_count,
          'bytes', ts.estimated_bytes
        ) ORDER BY ts.estimated_bytes DESC), '[]'::json) AS tables
      FROM public.tenants te
      LEFT JOIN _tenant_storage ts ON ts.tenant_id = te.id
      GROUP BY te.id, te.name, te.subdomain
    ) t
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_tenant_storage_usage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_storage_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_storage_usage() TO service_role;
