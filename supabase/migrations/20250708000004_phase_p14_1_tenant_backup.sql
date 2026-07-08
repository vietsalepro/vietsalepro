-- P14.1: Admin dashboard — per-tenant backup helper
-- Edge Function tenant-backup uses this RPC to discover tenant-scoped tables.

CREATE OR REPLACE FUNCTION public.get_tenant_backup_tables()
RETURNS TABLE(table_name TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
BEGIN
  -- ponytail: lock this to service_role so only the Edge Function backend can enumerate tables.
  IF auth.role() NOT IN ('service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'Chỉ service role được liệt kê bảng backup' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT c.table_name::TEXT
  FROM information_schema.columns c
  JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
  WHERE c.table_schema = 'public'
    AND c.column_name = 'tenant_id'
    AND t.table_type = 'BASE TABLE'
  ORDER BY c.table_name;
END;
$$;

REVOKE ALL ON FUNCTION public.get_tenant_backup_tables() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_backup_tables() TO service_role;
