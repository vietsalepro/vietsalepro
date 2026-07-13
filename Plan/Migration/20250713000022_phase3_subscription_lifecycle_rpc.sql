-- SP-3.2: Subscription lifecycle RPC
-- ponytail: idempotent migration adding create/upgrade/downgrade/cancel RPCs.
--          Uses SECURITY INVOKER + is_system_admin() so RLS still governs data access.

-- ============================================================
-- 1. Helper: compute billing period end
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_billing_period_end(
  p_start_date DATE,
  p_billing_period TEXT
)
RETURNS DATE
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_billing_period = 'year' THEN
    RETURN (p_start_date + INTERVAL '1 year')::DATE;
  END IF;
  RETURN (p_start_date + INTERVAL '1 month')::DATE;
END;
$$;

-- ============================================================
-- 2. RPC: create_subscription
--    Upsert a subscription row for a tenant. If trial_days > 0
--    the status becomes 'trialing'; otherwise 'active'.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_subscription(
  p_tenant_id UUID,
  p_plan TEXT,
  p_billing_period TEXT DEFAULT 'month',
  p_trial_days INTEGER DEFAULT 0,
  p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS public.tenant_subscriptions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_plan public.plans%ROWTYPE;
  v_limits JSONB;
  v_period_end DATE;
  v_expires_at TIMESTAMPTZ;
  v_status TEXT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo subscription' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  IF p_plan IS NULL OR TRIM(p_plan) = '' THEN
    RAISE EXCEPTION 'Mã gói không được để trống';
  END IF;

  IF NOT public.is_valid_plan(p_plan) THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  IF p_billing_period NOT IN ('month', 'year') THEN
    RAISE EXCEPTION 'Chu kỳ thanh toán không hợp lệ: % (chỉ chấp nhận month/year)', p_billing_period;
  END IF;

  IF p_trial_days < 0 THEN
    RAISE EXCEPTION 'Số ngày dùng thử không hợp lệ';
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE key = p_plan AND is_active = true;
  v_limits := public.get_default_plan_limit_values(p_plan);

  v_period_end := public.compute_billing_period_end(p_start_date, p_billing_period);

  IF p_trial_days > 0 THEN
    v_status := 'trialing';
    v_expires_at := (p_start_date + (p_trial_days || ' days')::INTERVAL)::TIMESTAMPTZ;
  ELSE
    v_status := 'active';
    v_expires_at := v_period_end::TIMESTAMPTZ;
  END IF;

  INSERT INTO public.tenant_subscriptions (
    tenant_id,
    plan,
    plan_id,
    status,
    billing_status,
    billing_period,
    billing_period_start,
    billing_period_end,
    max_users,
    max_products,
    max_orders_per_month,
    expires_at,
    current_month_orders,
    current_month_start,
    updated_at
  )
  VALUES (
    p_tenant_id,
    p_plan,
    p_plan,
    v_status,
    'ok',
    p_billing_period,
    p_start_date,
    v_period_end,
    COALESCE((v_limits->>'max_users')::INTEGER, v_plan.max_users),
    COALESCE((v_limits->>'max_products')::INTEGER, v_plan.max_products),
    COALESCE((v_limits->>'max_orders_per_month')::INTEGER, v_plan.max_orders_per_month),
    v_expires_at,
    0,
    date_trunc('month', CURRENT_DATE)::DATE,
    now()
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    plan = EXCLUDED.plan,
    plan_id = EXCLUDED.plan_id,
    status = EXCLUDED.status,
    billing_status = EXCLUDED.billing_status,
    billing_period = EXCLUDED.billing_period,
    billing_period_start = EXCLUDED.billing_period_start,
    billing_period_end = EXCLUDED.billing_period_end,
    max_users = EXCLUDED.max_users,
    max_products = EXCLUDED.max_products,
    max_orders_per_month = EXCLUDED.max_orders_per_month,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  RETURNING * INTO v_sub;

  UPDATE public.tenants
  SET plan = p_plan, updated_at = now()
  WHERE id = p_tenant_id;

  RETURN v_sub;
END;
$$;

-- ============================================================
-- 3. RPC: upgrade_subscription
--    Move tenant to a higher-priced plan, reset billing period.
-- ============================================================

CREATE OR REPLACE FUNCTION public.upgrade_subscription(
  p_tenant_id UUID,
  p_plan TEXT,
  p_billing_period TEXT DEFAULT 'month',
  p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS public.tenant_subscriptions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_current_plan public.plans%ROWTYPE;
  v_new_plan public.plans%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được nâng cấp subscription' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_billing_period NOT IN ('month', 'year') THEN
    RAISE EXCEPTION 'Chu kỳ thanh toán không hợp lệ: %', p_billing_period;
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  SELECT * INTO v_current_plan FROM public.plans WHERE key = v_sub.plan AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy gói hiện tại: %', v_sub.plan;
  END IF;

  SELECT * INTO v_new_plan FROM public.plans WHERE key = p_plan AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  IF COALESCE(
    CASE WHEN p_billing_period = 'year' THEN v_new_plan.yearly_price ELSE v_new_plan.monthly_price END,
    0
  ) <= COALESCE(
    CASE WHEN p_billing_period = 'year' THEN v_current_plan.yearly_price ELSE v_current_plan.monthly_price END,
    0
  ) THEN
    RAISE EXCEPTION 'Gói mới phải có giá cao hơn gói hiện tại (theo chu kỳ %) để được coi là nâng cấp', p_billing_period;
  END IF;

  RETURN public.create_subscription(p_tenant_id, p_plan, p_billing_period, 0, p_start_date);
END;
$$;

-- ============================================================
-- 4. RPC: downgrade_subscription
--    Move tenant to a lower-priced plan, reset billing period.
-- ============================================================

CREATE OR REPLACE FUNCTION public.downgrade_subscription(
  p_tenant_id UUID,
  p_plan TEXT,
  p_billing_period TEXT DEFAULT 'month',
  p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS public.tenant_subscriptions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_current_plan public.plans%ROWTYPE;
  v_new_plan public.plans%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được hạ cấp subscription' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_billing_period NOT IN ('month', 'year') THEN
    RAISE EXCEPTION 'Chu kỳ thanh toán không hợp lệ: %', p_billing_period;
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  SELECT * INTO v_current_plan FROM public.plans WHERE key = v_sub.plan AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy gói hiện tại: %', v_sub.plan;
  END IF;

  SELECT * INTO v_new_plan FROM public.plans WHERE key = p_plan AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  IF COALESCE(
    CASE WHEN p_billing_period = 'year' THEN v_new_plan.yearly_price ELSE v_new_plan.monthly_price END,
    0
  ) >= COALESCE(
    CASE WHEN p_billing_period = 'year' THEN v_current_plan.yearly_price ELSE v_current_plan.monthly_price END,
    0
  ) THEN
    RAISE EXCEPTION 'Gói mới phải có giá thấp hơn gói hiện tại (theo chu kỳ %) để được coi là hạ cấp', p_billing_period;
  END IF;

  RETURN public.create_subscription(p_tenant_id, p_plan, p_billing_period, 0, p_start_date);
END;
$$;

-- ============================================================
-- 5. RPC: cancel_subscription
--    Mark subscription as cancelled. Immediate=true ends access today.
-- ============================================================

CREATE OR REPLACE FUNCTION public.cancel_subscription(
  p_tenant_id UUID,
  p_immediate BOOLEAN DEFAULT false,
  p_cancellation_date DATE DEFAULT CURRENT_DATE
)
RETURNS public.tenant_subscriptions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_sub public.tenant_subscriptions%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được hủy subscription' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  UPDATE public.tenant_subscriptions
  SET status = 'cancelled',
      billing_status = 'cancelled',
      expires_at = CASE
        WHEN p_immediate THEN p_cancellation_date::TIMESTAMPTZ
        ELSE COALESCE(expires_at, billing_period_end::TIMESTAMPTZ)
      END,
      billing_period_end = CASE
        WHEN p_immediate THEN p_cancellation_date
        ELSE billing_period_end
      END,
      updated_at = now()
  WHERE tenant_id = p_tenant_id
  RETURNING * INTO v_sub;

  RETURN v_sub;
END;
$$;

-- ============================================================
-- 6. Grants: authenticated + service_role can execute lifecycle RPCs
-- ============================================================

REVOKE ALL ON FUNCTION public.create_subscription(UUID, TEXT, TEXT, INTEGER, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_subscription(UUID, TEXT, TEXT, INTEGER, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_subscription(UUID, TEXT, TEXT, INTEGER, DATE) TO service_role;

REVOKE ALL ON FUNCTION public.upgrade_subscription(UUID, TEXT, TEXT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upgrade_subscription(UUID, TEXT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upgrade_subscription(UUID, TEXT, TEXT, DATE) TO service_role;

REVOKE ALL ON FUNCTION public.downgrade_subscription(UUID, TEXT, TEXT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.downgrade_subscription(UUID, TEXT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.downgrade_subscription(UUID, TEXT, TEXT, DATE) TO service_role;

REVOKE ALL ON FUNCTION public.cancel_subscription(UUID, BOOLEAN, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_subscription(UUID, BOOLEAN, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_subscription(UUID, BOOLEAN, DATE) TO service_role;
