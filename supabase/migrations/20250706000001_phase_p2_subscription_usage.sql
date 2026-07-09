-- P2: Admin dashboard — Subscription & usage
-- RPC usage summary, cập nhật gói/giới hạn custom, reset counter đơn hàng tháng.
-- ponytail: migration idempotent; chỉ system admin được gọi các RPC này.

-- ============================================================
-- 1. RPC lấy tổng quan usage của một tenant
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tenant_usage_summary(
  p_tenant_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_user_count INTEGER;
  v_product_count INTEGER;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_current_month_orders INTEGER;
  v_current_month_start DATE;
  v_today DATE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem usage tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  SELECT COUNT(*) INTO v_user_count FROM public.tenant_memberships WHERE tenant_id = p_tenant_id;
  SELECT COUNT(*) INTO v_product_count FROM public.products WHERE tenant_id = p_tenant_id;

  -- ponytail: nếu current_month_start khác tháng hiện tại, coi như counter đã reset về 0.
  v_today := date_trunc('month', CURRENT_DATE)::DATE;
  v_current_month_start := v_sub.current_month_start;
  IF v_current_month_start IS NULL OR v_current_month_start <> v_today THEN
    v_current_month_orders := 0;
    v_current_month_start := v_today;
  ELSE
    v_current_month_orders := v_sub.current_month_orders;
  END IF;

  RETURN json_build_object(
    'tenantId', v_sub.tenant_id,
    'plan', v_sub.plan,
    'billingStatus', v_sub.billing_status,
    'expiresAt', v_sub.expires_at,
    'users', json_build_object(
      'current', v_user_count,
      'max', v_sub.max_users,
      'percent', CASE WHEN v_sub.max_users > 0 THEN ROUND((v_user_count::NUMERIC / v_sub.max_users) * 100, 2) ELSE 0 END
    ),
    'products', json_build_object(
      'current', v_product_count,
      'max', v_sub.max_products,
      'percent', CASE WHEN v_sub.max_products > 0 THEN ROUND((v_product_count::NUMERIC / v_sub.max_products) * 100, 2) ELSE 0 END
    ),
    'orders', json_build_object(
      'current', v_current_month_orders,
      'max', v_sub.max_orders_per_month,
      'percent', CASE WHEN v_sub.max_orders_per_month > 0 THEN ROUND((v_current_month_orders::NUMERIC / v_sub.max_orders_per_month) * 100, 2) ELSE 0 END,
      'monthStart', v_current_month_start
    )
  );
END;
$$;

-- ============================================================
-- 2. RPC cập nhật gói và giới hạn subscription
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_tenant_subscription(
  p_tenant_id UUID,
  p_plan TEXT DEFAULT NULL,
  p_max_users INTEGER DEFAULT NULL,
  p_max_products INTEGER DEFAULT NULL,
  p_max_orders_per_month INTEGER DEFAULT NULL,
  p_billing_status TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS public.tenant_subscriptions
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_new_plan TEXT;
  v_new_max_users INTEGER;
  v_new_max_products INTEGER;
  v_new_max_orders INTEGER;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật subscription' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  v_new_plan := COALESCE(p_plan, v_sub.plan);
  IF v_new_plan NOT IN ('free', 'vip') THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', v_new_plan;
  END IF;

  -- ponytail: chỉ áp giới hạn mặc định của gói mới khi admin explicit đổi gói VÀ không truyền custom limits.
  --          Nếu có truyền bất kỳ custom limit nào, giữ nguyên giá trị hiện tại cho các trường còn lại.
  v_new_max_users := COALESCE(p_max_users, CASE WHEN p_plan IS NOT NULL AND p_max_users IS NULL AND p_max_products IS NULL AND p_max_orders_per_month IS NULL THEN
    CASE WHEN v_new_plan = 'free' THEN 1 WHEN v_new_plan = 'vip' THEN 999 ELSE v_sub.max_users END
  ELSE v_sub.max_users END);
  v_new_max_products := COALESCE(p_max_products, CASE WHEN p_plan IS NOT NULL AND p_max_users IS NULL AND p_max_products IS NULL AND p_max_orders_per_month IS NULL THEN
    CASE WHEN v_new_plan = 'free' THEN 50 WHEN v_new_plan = 'vip' THEN 999999 ELSE v_sub.max_products END
  ELSE v_sub.max_products END);
  v_new_max_orders := COALESCE(p_max_orders_per_month, CASE WHEN p_plan IS NOT NULL AND p_max_users IS NULL AND p_max_products IS NULL AND p_max_orders_per_month IS NULL THEN
    CASE WHEN v_new_plan = 'free' THEN 300 WHEN v_new_plan = 'vip' THEN 999999 ELSE v_sub.max_orders_per_month END
  ELSE v_sub.max_orders_per_month END);

  IF v_new_max_users <= 0 OR v_new_max_products <= 0 OR v_new_max_orders <= 0 THEN
    RAISE EXCEPTION 'Giới hạn phải lớn hơn 0';
  END IF;

  IF p_billing_status IS NOT NULL AND p_billing_status NOT IN ('ok', 'past_due', 'suspended', 'cancelled') THEN
    RAISE EXCEPTION 'Trạng thái thanh toán không hợp lệ: %', p_billing_status;
  END IF;

  UPDATE public.tenant_subscriptions
  SET plan = v_new_plan,
      max_users = v_new_max_users,
      max_products = v_new_max_products,
      max_orders_per_month = v_new_max_orders,
      billing_status = COALESCE(p_billing_status, billing_status),
      expires_at = p_expires_at,
      updated_at = now()
  WHERE tenant_id = p_tenant_id
  RETURNING * INTO v_sub;

  -- ponytail: đồng bộ cột plan trên tenants để các trigger/truy vấn cũ vẫn nhất quán.
  UPDATE public.tenants
  SET plan = v_new_plan, updated_at = now()
  WHERE id = p_tenant_id;

  RETURN v_sub;
END;
$$;

-- ============================================================
-- 3. RPC reset counter đơn hàng tháng (ví dụ sau khi nâng cấp gói)
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_monthly_order_counter(
  p_tenant_id UUID
)
RETURNS public.tenant_subscriptions
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_sub public.tenant_subscriptions%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được reset counter' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.tenant_subscriptions
  SET current_month_orders = 0,
      current_month_start = date_trunc('month', CURRENT_DATE)::DATE,
      updated_at = now()
  WHERE tenant_id = p_tenant_id
  RETURNING * INTO v_sub;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  RETURN v_sub;
END;
$$;

-- ============================================================
-- 4. Cron: reset counter đơn hàng tháng đầu tháng
-- ponytail: tách logic reset stale counter ra cron đầu tháng để usage hiển thị đúng
-- ngay cả khi chưa có đơn hàng mới.
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_stale_monthly_order_counters()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.tenant_subscriptions
  SET current_month_orders = 0,
      current_month_start = date_trunc('month', CURRENT_DATE)::DATE,
      updated_at = now()
  WHERE current_month_start IS NULL
     OR current_month_start <> date_trunc('month', CURRENT_DATE)::DATE;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_stale_monthly_order_counters() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_stale_monthly_order_counters() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('reset-stale-monthly-counters', '0 1 1 * *', 'SELECT public.reset_stale_monthly_order_counters();');
