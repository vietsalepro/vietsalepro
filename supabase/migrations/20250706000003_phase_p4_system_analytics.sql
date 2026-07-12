-- P4: Admin dashboard — System analytics
-- RPC tổng quan hệ thống, top tenants, biểu đồ tăng trưởng tenant.
-- ponytail: migration idempotent; chỉ system admin được gọi các RPC này.

-- ============================================================
-- 1. RPC tổng quan hệ thống
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_system_overview()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_total INTEGER;
  v_active INTEGER;
  v_trial INTEGER;
  v_vip INTEGER;
  v_expiring_soon INTEGER;
  v_near_limit INTEGER;
  v_new_this_month INTEGER;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem tổng quan hệ thống' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total FROM public.tenants;
  SELECT COUNT(*) INTO v_active FROM public.tenants WHERE status = 'active';
  SELECT COUNT(*) INTO v_trial FROM public.tenants WHERE status = 'trial';
  SELECT COUNT(*) INTO v_vip FROM public.tenants WHERE plan = 'vip';
  SELECT COUNT(*) INTO v_new_this_month FROM public.tenants WHERE created_at >= date_trunc('month', CURRENT_DATE);

  SELECT COUNT(*) INTO v_expiring_soon
  FROM public.tenant_subscriptions
  WHERE expires_at IS NOT NULL AND expires_at <= now() + INTERVAL '7 days';

  WITH usage AS (
    SELECT
      s.tenant_id,
      s.max_users,
      s.max_products,
      s.max_orders_per_month,
      s.current_month_orders,
      COALESCE(uc.count, 0) AS user_count,
      COALESCE(pc.count, 0) AS product_count
    FROM public.tenant_subscriptions s
    LEFT JOIN (SELECT tenant_id, COUNT(*) AS count FROM public.tenant_memberships GROUP BY tenant_id) uc
      ON uc.tenant_id = s.tenant_id
    LEFT JOIN (SELECT tenant_id, COUNT(*) AS count FROM public.products GROUP BY tenant_id) pc
      ON pc.tenant_id = s.tenant_id
  )
  SELECT COUNT(*) INTO v_near_limit
  FROM usage
  WHERE (max_users > 0 AND user_count::numeric / max_users >= 0.8)
     OR (max_products > 0 AND product_count::numeric / max_products >= 0.8)
     OR (max_orders_per_month > 0 AND current_month_orders::numeric / max_orders_per_month >= 0.8);

  v_result := json_build_object(
    'totalTenants', COALESCE(v_total, 0),
    'activeTenants', COALESCE(v_active, 0),
    'trialTenants', COALESCE(v_trial, 0),
    'vipTenants', COALESCE(v_vip, 0),
    'expiringSoon', COALESCE(v_expiring_soon, 0),
    'nearLimit', COALESCE(v_near_limit, 0),
    'newThisMonth', COALESCE(v_new_this_month, 0),
    'expiringTenants', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          ten.id,
          ten.name,
          ten.subdomain,
          s.expires_at,
          EXTRACT(DAY FROM (s.expires_at - now()))::int AS days_remaining
        FROM public.tenants ten
        JOIN public.tenant_subscriptions s ON s.tenant_id = ten.id
        WHERE s.expires_at IS NOT NULL
          AND s.expires_at <= now() + INTERVAL '7 days'
        ORDER BY s.expires_at ASC
        LIMIT 50
      ) t
    ),
    'nearLimitTenants', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          ten.id,
          ten.name,
          ten.subdomain,
          CASE WHEN s.max_users > 0 THEN ROUND((COALESCE(uc.count, 0)::numeric / s.max_users) * 100, 2) ELSE 0 END AS user_percent,
          CASE WHEN s.max_products > 0 THEN ROUND((COALESCE(pc.count, 0)::numeric / s.max_products) * 100, 2) ELSE 0 END AS product_percent,
          CASE WHEN s.max_orders_per_month > 0 THEN ROUND((s.current_month_orders::numeric / s.max_orders_per_month) * 100, 2) ELSE 0 END AS order_percent
        FROM public.tenant_subscriptions s
        JOIN public.tenants ten ON ten.id = s.tenant_id
        LEFT JOIN (SELECT tenant_id, COUNT(*) AS count FROM public.tenant_memberships GROUP BY tenant_id) uc
          ON uc.tenant_id = s.tenant_id
        LEFT JOIN (SELECT tenant_id, COUNT(*) AS count FROM public.products GROUP BY tenant_id) pc
          ON pc.tenant_id = s.tenant_id
        WHERE (s.max_users > 0 AND COALESCE(uc.count, 0)::numeric / s.max_users >= 0.8)
           OR (s.max_products > 0 AND COALESCE(pc.count, 0)::numeric / s.max_products >= 0.8)
           OR (s.max_orders_per_month > 0 AND s.current_month_orders::numeric / s.max_orders_per_month >= 0.8)
        ORDER BY GREATEST(
          CASE WHEN s.max_users > 0 THEN COALESCE(uc.count, 0)::numeric / s.max_users ELSE 0 END,
          CASE WHEN s.max_products > 0 THEN COALESCE(pc.count, 0)::numeric / s.max_products ELSE 0 END,
          CASE WHEN s.max_orders_per_month > 0 THEN s.current_month_orders::numeric / s.max_orders_per_month ELSE 0 END
        ) DESC
        LIMIT 50
      ) t
    )
  );

  RETURN v_result;
END;
$$;

-- ============================================================
-- 2. RPC top tenants (theo đơn hàng tháng này)
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

REVOKE ALL ON FUNCTION public.get_top_tenants(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_tenants(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_tenants(INTEGER, INTEGER) TO service_role;

-- ============================================================
-- 3. RPC tăng trưởng tenant theo tháng
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tenant_growth(
  p_months INTEGER DEFAULT 6
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem tenant growth' USING ERRCODE = 'insufficient_privilege';
  END IF;

  WITH months AS (
    SELECT
      TO_CHAR(date_trunc('month', now()) - (n * INTERVAL '1 month'), 'YYYY-MM') AS month,
      date_trunc('month', now()) - (n * INTERVAL '1 month') AS month_start
    FROM generate_series(0, GREATEST(1, COALESCE(p_months, 6)) - 1) AS n
  ),
  counts AS (
    SELECT
      TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month,
      COUNT(*) AS count
    FROM public.tenants
    WHERE status <> 'archived'
      AND created_at >= (SELECT MIN(month_start) FROM months)
    GROUP BY date_trunc('month', created_at)
  )
  SELECT COALESCE(json_agg(
    json_build_object('month', m.month, 'count', COALESCE(c.count, 0))
    ORDER BY m.month
  ), '[]'::json)
  INTO v_result
  FROM months m
  LEFT JOIN counts c ON c.month = m.month;

  RETURN v_result;
END;
$$;
