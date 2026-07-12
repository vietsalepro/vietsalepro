-- Phase 1 SQL fix: bổ sung/sửa các RPC admin dashboard còn thiếu hoặc sai signature.
-- ponytail: idempotent qua CREATE OR REPLACE + REVOKE/GRANT chuẩn.

-- ============================================================
-- 1. Sửa get_top_tenants: nhận (p_limit, p_offset) và trả {data, count}
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_top_tenants(
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem top tenants' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.tenants
  WHERE status <> 'archived';

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        ten.id,
        ten.name,
        ten.subdomain,
        ten.status,
        ten.plan,
        ten.created_at,
        COALESCE(s.current_month_orders, 0) AS orders_this_month,
        COALESCE(uc.count, 0) AS user_count,
        COALESCE(pc.count, 0) AS product_count
      FROM public.tenants ten
      LEFT JOIN public.tenant_subscriptions s ON s.tenant_id = ten.id
      LEFT JOIN (
        SELECT tenant_id, COUNT(*) AS count
        FROM public.tenant_memberships
        GROUP BY tenant_id
      ) uc ON uc.tenant_id = ten.id
      LEFT JOIN (
        SELECT tenant_id, COUNT(*) AS count
        FROM public.products
        GROUP BY tenant_id
      ) pc ON pc.tenant_id = ten.id
      WHERE ten.status <> 'archived'
      ORDER BY s.current_month_orders DESC NULLS LAST, ten.created_at DESC
      LIMIT p_limit
      OFFSET p_offset
    ) t
  );

  RETURN json_build_object(
    'data', v_result,
    'count', COALESCE(v_total, 0)
  );
END;
$$;

-- Xoá overload 1 tham số cũ để tránh ambiguity với bản 2 tham số mới.
DROP FUNCTION IF EXISTS public.get_top_tenants(INTEGER);

REVOKE ALL ON FUNCTION public.get_top_tenants(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_tenants(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_tenants(INTEGER, INTEGER) TO service_role;

-- ============================================================
-- 2. Tạo get_current_user_tenants: danh sách tenant của user hiện tại
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_current_user_tenants()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
    FROM (
      SELECT
        ten.*,
        tm.role AS membership_role,
        tm.status AS membership_status,
        tm.is_active
      FROM public.tenants ten
      JOIN public.tenant_memberships tm ON tm.tenant_id = ten.id
      WHERE tm.user_id = auth.uid()
        AND ten.status <> 'archived'
    ) t
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_current_user_tenants() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_user_tenants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_tenants() TO service_role;

-- ============================================================
-- 3. Tạo get_tenants_admin: quản lý tenant có phân trang/filter/sort
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tenants_admin(
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 20,
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'all',
  p_plan TEXT DEFAULT 'all',
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER;
  v_total INTEGER;
  v_items JSON;
  v_sort_col TEXT;
  v_sort_dir TEXT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được gọi get_tenants_admin' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_offset := GREATEST((p_page - 1) * p_limit, 0);
  v_sort_col := CASE
    WHEN p_sort_by IN ('name', 'subdomain', 'status', 'plan', 'created_at') THEN p_sort_by
    ELSE 'created_at'
  END;
  v_sort_dir := CASE WHEN lower(p_sort_order) = 'asc' THEN 'ASC' ELSE 'DESC' END;

  SELECT COUNT(*) INTO v_total
  FROM public.tenants ten
  WHERE ten.status <> 'archived'
    AND (p_status = 'all' OR p_status IS NULL OR ten.status = p_status)
    AND (p_plan = 'all' OR p_plan IS NULL OR ten.plan = p_plan)
    AND (p_search IS NULL OR p_search = '' OR ten.name ILIKE '%' || p_search || '%' OR ten.subdomain ILIKE '%' || p_search || '%');

  EXECUTE format(
    'SELECT COALESCE(json_agg(row_to_json(t)), ''[]''::json)
     FROM (
       SELECT ten.*
       FROM public.tenants ten
       WHERE ten.status <> ''archived''
         AND ($1 = ''all'' OR $1 IS NULL OR ten.status = $1)
         AND ($2 = ''all'' OR $2 IS NULL OR ten.plan = $2)
         AND ($3 IS NULL OR $3 = '''' OR ten.name ILIKE $4 OR ten.subdomain ILIKE $4)
       ORDER BY %I %s NULLS LAST
       LIMIT $5 OFFSET $6
     ) t',
    v_sort_col, v_sort_dir
  )
  INTO v_items
  USING p_status, p_plan, p_search,
        CASE WHEN p_search IS NOT NULL AND p_search <> '' THEN '%' || p_search || '%' ELSE NULL END,
        p_limit, v_offset;

  RETURN json_build_object(
    'data', v_items,
    'total', COALESCE(v_total, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_tenants_admin(INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenants_admin(INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenants_admin(INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
