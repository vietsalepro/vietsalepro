-- G1 reverse: restore the subscription-update contract to the pre-storage state.

-- ============================================================
-- 1. Revert canonical function
-- ============================================================
DROP FUNCTION IF EXISTS public.update_tenant_subscription(UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, TIMESTAMPTZ);

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
  v_limits JSONB;
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
  IF NOT public.is_valid_plan(v_new_plan) THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', v_new_plan;
  END IF;

  IF p_plan IS NOT NULL THEN
    v_limits := public.get_default_plan_limit_values(v_new_plan);
  END IF;

  v_new_max_users := COALESCE(p_max_users, CASE WHEN p_plan IS NOT NULL THEN (v_limits->>'max_users')::INTEGER ELSE v_sub.max_users END);
  v_new_max_products := COALESCE(p_max_products, CASE WHEN p_plan IS NOT NULL THEN (v_limits->>'max_products')::INTEGER ELSE v_sub.max_products END);
  v_new_max_orders := COALESCE(p_max_orders_per_month, CASE WHEN p_plan IS NOT NULL THEN (v_limits->>'max_orders_per_month')::INTEGER ELSE v_sub.max_orders_per_month END);

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

  UPDATE public.tenants
  SET plan = v_new_plan, updated_at = now()
  WHERE id = p_tenant_id;

  RETURN v_sub;
END;
$$;

-- ============================================================
-- 2. Revert schema extension
-- ============================================================
ALTER TABLE public.tenant_subscriptions
  DROP COLUMN IF EXISTS max_storage_gb;
