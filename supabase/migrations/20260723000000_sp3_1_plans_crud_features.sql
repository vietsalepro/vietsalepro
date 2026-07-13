-- SP-3.1: Refactor Plans CRUD — add features, seat_limit, usage_limits to plans.
-- ponytail: migration idempotent; extends P8.1 plan builder schema without breaking existing RPCs.

-- ============================================================
-- 1. Add new columns to public.plans
-- ============================================================

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seat_limit INTEGER,
  ADD COLUMN IF NOT EXISTS usage_limits JSONB DEFAULT '{}';

-- Backfill existing plans: seat_limit defaults to max_users, empty arrays/objects for the rest.
UPDATE public.plans
SET seat_limit = COALESCE(seat_limit, max_users),
    features = COALESCE(features, '{}'),
    usage_limits = COALESCE(usage_limits, '{}')
WHERE seat_limit IS NULL OR features IS NULL OR usage_limits IS NULL;

-- ============================================================
-- 2. RPC: get_plans (include new fields)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_plans()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem danh sách gói' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'key', key,
        'name', name,
        'description', description,
        'features', features,
        'seat_limit', seat_limit,
        'usage_limits', usage_limits,
        'max_users', max_users,
        'max_products', max_products,
        'max_orders_per_month', max_orders_per_month,
        'monthly_price', monthly_price,
        'yearly_price', yearly_price,
        'is_active', is_active,
        'created_at', created_at,
        'updated_at', updated_at
      ) ORDER BY key
    ), '[]'::json)
    FROM public.plans
  );
END;
$$;

-- ============================================================
-- 3. RPC: get_plan_by_key (include new fields)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_plan_by_key(p_key TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_plan public.plans%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem chi tiết gói' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE key = p_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy gói: %', p_key;
  END IF;

  RETURN json_build_object(
    'key', v_plan.key,
    'name', v_plan.name,
    'description', v_plan.description,
    'features', v_plan.features,
    'seat_limit', v_plan.seat_limit,
    'usage_limits', v_plan.usage_limits,
    'max_users', v_plan.max_users,
    'max_products', v_plan.max_products,
    'max_orders_per_month', v_plan.max_orders_per_month,
    'monthly_price', v_plan.monthly_price,
    'yearly_price', v_plan.yearly_price,
    'is_active', v_plan.is_active,
    'created_at', v_plan.created_at,
    'updated_at', v_plan.updated_at
  );
END;
$$;

-- ============================================================
-- 4. RPC: create_plan (accept new fields)
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_plan(
  p_key TEXT,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_features TEXT[] DEFAULT '{}',
  p_seat_limit INTEGER DEFAULT NULL,
  p_usage_limits JSONB DEFAULT '{}',
  p_max_users INTEGER DEFAULT 1,
  p_max_products INTEGER DEFAULT 1,
  p_max_orders_per_month INTEGER DEFAULT 1,
  p_monthly_price NUMERIC DEFAULT 0,
  p_yearly_price NUMERIC DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_key TEXT;
  v_plan public.plans%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo gói' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_key := lower(trim(p_key));
  IF v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'Mã gói không được để trống';
  END IF;
  IF v_key !~ '^[a-z0-9_]+$' THEN
    RAISE EXCEPTION 'Mã gói chỉ được chứa chữ thường, số và dấu gạch dưới';
  END IF;

  IF p_max_users <= 0 OR p_max_products <= 0 OR p_max_orders_per_month <= 0 THEN
    RAISE EXCEPTION 'Giới hạn phải lớn hơn 0';
  END IF;

  INSERT INTO public.plans (
    key, name, description, features, seat_limit, usage_limits,
    max_users, max_products, max_orders_per_month, monthly_price, yearly_price, is_active
  )
  VALUES (
    v_key,
    trim(p_name),
    p_description,
    COALESCE(p_features, '{}'),
    COALESCE(p_seat_limit, p_max_users),
    COALESCE(p_usage_limits, '{}'),
    p_max_users,
    p_max_products,
    p_max_orders_per_month,
    COALESCE(p_monthly_price, 0),
    COALESCE(p_yearly_price, 0),
    true
  )
  ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    seat_limit = EXCLUDED.seat_limit,
    usage_limits = EXCLUDED.usage_limits,
    max_users = EXCLUDED.max_users,
    max_products = EXCLUDED.max_products,
    max_orders_per_month = EXCLUDED.max_orders_per_month,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    is_active = true,
    updated_at = now()
  RETURNING * INTO v_plan;

  RETURN json_build_object(
    'key', v_plan.key,
    'name', v_plan.name,
    'description', v_plan.description,
    'features', v_plan.features,
    'seat_limit', v_plan.seat_limit,
    'usage_limits', v_plan.usage_limits,
    'max_users', v_plan.max_users,
    'max_products', v_plan.max_products,
    'max_orders_per_month', v_plan.max_orders_per_month,
    'monthly_price', v_plan.monthly_price,
    'yearly_price', v_plan.yearly_price,
    'is_active', v_plan.is_active,
    'created_at', v_plan.created_at,
    'updated_at', v_plan.updated_at
  );
END;
$$;

-- ============================================================
-- 5. RPC: update_plan (accept new fields)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_plan(
  p_key TEXT,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_features TEXT[] DEFAULT NULL,
  p_seat_limit INTEGER DEFAULT NULL,
  p_usage_limits JSONB DEFAULT NULL,
  p_max_users INTEGER DEFAULT NULL,
  p_max_products INTEGER DEFAULT NULL,
  p_max_orders_per_month INTEGER DEFAULT NULL,
  p_monthly_price NUMERIC DEFAULT NULL,
  p_yearly_price NUMERIC DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_plan public.plans%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật gói' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE key = p_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy gói: %', p_key;
  END IF;

  IF p_max_users IS NOT NULL AND p_max_users <= 0 THEN
    RAISE EXCEPTION 'Giới hạn người dùng phải lớn hơn 0';
  END IF;
  IF p_max_products IS NOT NULL AND p_max_products <= 0 THEN
    RAISE EXCEPTION 'Giới hạn sản phẩm phải lớn hơn 0';
  END IF;
  IF p_max_orders_per_month IS NOT NULL AND p_max_orders_per_month <= 0 THEN
    RAISE EXCEPTION 'Giới hạn đơn hàng phải lớn hơn 0';
  END IF;

  UPDATE public.plans
  SET name = COALESCE(p_name, name),
      description = COALESCE(p_description, description),
      features = COALESCE(p_features, features),
      seat_limit = COALESCE(p_seat_limit, seat_limit),
      usage_limits = COALESCE(p_usage_limits, usage_limits),
      max_users = COALESCE(p_max_users, max_users),
      max_products = COALESCE(p_max_products, max_products),
      max_orders_per_month = COALESCE(p_max_orders_per_month, max_orders_per_month),
      monthly_price = COALESCE(p_monthly_price, monthly_price),
      yearly_price = COALESCE(p_yearly_price, yearly_price),
      is_active = COALESCE(p_is_active, is_active),
      updated_at = now()
  WHERE key = p_key
  RETURNING * INTO v_plan;

  RETURN json_build_object(
    'key', v_plan.key,
    'name', v_plan.name,
    'description', v_plan.description,
    'features', v_plan.features,
    'seat_limit', v_plan.seat_limit,
    'usage_limits', v_plan.usage_limits,
    'max_users', v_plan.max_users,
    'max_products', v_plan.max_products,
    'max_orders_per_month', v_plan.max_orders_per_month,
    'monthly_price', v_plan.monthly_price,
    'yearly_price', v_plan.yearly_price,
    'is_active', v_plan.is_active,
    'created_at', v_plan.created_at,
    'updated_at', v_plan.updated_at
  );
END;
$$;
