-- F33 P2: search_tenant_members RPC
-- Scope: paginated, searchable, filterable, sortable replacement for get_tenant_members_with_email.
-- ponytail: historical duplicate of 20260711000004_f33_members_search_rpc.sql. This file exists
-- because the same migration was applied to production under the timestamp 20260710064509
-- (likely from an earlier temporary file) before being renamed/recreated locally as
-- 20260711000004. Keeping it here aligns local migration history with the remote DB without
-- changing the schema. The function is created idempotently via CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION public.search_tenant_members(
  p_tenant_id UUID,
  p_search TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_dir TEXT DEFAULT 'desc',
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 20
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INT;
  v_items JSON;
  v_total_count INT;
  v_sort_by TEXT;
  v_sort_dir TEXT;
  v_search_pattern TEXT;
  v_role TEXT;
  v_status TEXT;
BEGIN
  IF NOT (public.is_system_admin() OR public.is_tenant_admin(p_tenant_id)) THEN
    RAISE EXCEPTION 'Chỉ system admin hoặc tenant admin mới được xem danh sách thành viên' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_offset := GREATEST((p_page - 1) * p_page_size, 0);
  v_search_pattern := NULLIF(trim(p_search), '');
  v_role := NULLIF(trim(p_role), '');
  v_status := NULLIF(trim(p_status), '');
  v_sort_by := CASE
    WHEN p_sort_by IN ('email', 'role', 'status', 'created_at', 'last_sign_in_at') THEN p_sort_by
    ELSE 'created_at'
  END;
  v_sort_dir := CASE WHEN lower(p_sort_dir) = 'asc' THEN 'ASC' ELSE 'DESC' END;

  SELECT COUNT(*) INTO v_total_count
  FROM public.tenant_memberships tm
  LEFT JOIN auth.users u ON u.id = tm.user_id
  WHERE tm.tenant_id = p_tenant_id
    AND (v_search_pattern IS NULL OR u.email ILIKE '%' || v_search_pattern || '%')
    AND (v_role IS NULL OR tm.role = v_role)
    AND (v_status IS NULL OR tm.status = v_status)
    AND (p_is_active IS NULL OR tm.is_active = p_is_active);

  EXECUTE format(
    'SELECT COALESCE(json_agg(row_to_json(t)), ''[]''::json)
     FROM (
       SELECT
         tm.id,
         tm.tenant_id,
         tm.user_id,
         tm.role,
         t.owner_id = tm.user_id AS is_owner,
         u.email,
         inviter.email AS invited_by_email,
         tm.status,
         tm.is_active,
         tm.invited_at,
         tm.accepted_at,
         u.last_sign_in_at,
         u.confirmed_at,
         tm.created_at,
         tm.updated_at
       FROM public.tenant_memberships tm
       JOIN public.tenants t ON t.id = tm.tenant_id
       LEFT JOIN auth.users u ON u.id = tm.user_id
       LEFT JOIN auth.users inviter ON inviter.id = tm.invited_by
       WHERE tm.tenant_id = $1
         AND ($2 IS NULL OR u.email ILIKE $2)
         AND ($3 IS NULL OR tm.role = $3)
         AND ($4 IS NULL OR tm.status = $4)
         AND ($5 IS NULL OR tm.is_active = $5)
       ORDER BY %I %s NULLS LAST
       LIMIT $6 OFFSET $7
     ) t',
    v_sort_by, v_sort_dir
  )
  INTO v_items
  USING p_tenant_id,
        CASE WHEN v_search_pattern IS NOT NULL THEN '%' || v_search_pattern || '%' ELSE NULL END,
        v_role, v_status, p_is_active,
        p_page_size, v_offset;

  RETURN jsonb_build_object(
    'items', v_items,
    'total_count', v_total_count
  );
END;
$$;
