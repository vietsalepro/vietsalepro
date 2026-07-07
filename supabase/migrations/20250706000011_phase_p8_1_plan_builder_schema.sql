-- P8.1: Admin dashboard — Plan builder schema
-- Tạo bảng plans, CRUD RPC, migrate Free/VIP hardcode từ system_settings và các function.
-- ponytail: migration idempotent; chỉ system admin được quản lý plans.

-- ============================================================
-- 1. Bảng plans
-- ============================================================

CREATE TABLE IF NOT EXISTS public.plans (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  max_users INTEGER NOT NULL DEFAULT 0,
  max_products INTEGER NOT NULL DEFAULT 0,
  max_orders_per_month INTEGER NOT NULL DEFAULT 0,
  monthly_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  yearly_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'plans' AND policyname = 'plans_system_admin_select'
  ) THEN
    CREATE POLICY "plans_system_admin_select"
      ON public.plans FOR SELECT TO authenticated
      USING (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'plans' AND policyname = 'plans_system_admin_write'
  ) THEN
    CREATE POLICY "plans_system_admin_write"
      ON public.plans FOR ALL TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 2. Migrate giới hạn mặc định từ system_settings sang plans
-- ============================================================

INSERT INTO public.plans (key, name, description, max_users, max_products, max_orders_per_month, monthly_price, yearly_price, is_active)
SELECT
  'free',
  'Free',
  'Gói miễn phí',
  COALESCE((value->>'max_users')::INTEGER, 1),
  COALESCE((value->>'max_products')::INTEGER, 50),
  COALESCE((value->>'max_orders_per_month')::INTEGER, 300),
  0,
  0,
  true
FROM public.system_settings
WHERE key = 'default_limits_free'
ON CONFLICT (key) DO UPDATE SET
  max_users = EXCLUDED.max_users,
  max_products = EXCLUDED.max_products,
  max_orders_per_month = EXCLUDED.max_orders_per_month,
  updated_at = now();

INSERT INTO public.plans (key, name, description, max_users, max_products, max_orders_per_month, monthly_price, yearly_price, is_active)
SELECT
  'vip',
  'VIP',
  'Gói trả phí',
  COALESCE((value->>'max_users')::INTEGER, 999),
  COALESCE((value->>'max_products')::INTEGER, 999999),
  COALESCE((value->>'max_orders_per_month')::INTEGER, 999999),
  69000,
  59000,
  true
FROM public.system_settings
WHERE key = 'default_limits_vip'
ON CONFLICT (key) DO UPDATE SET
  max_users = EXCLUDED.max_users,
  max_products = EXCLUDED.max_products,
  max_orders_per_month = EXCLUDED.max_orders_per_month,
  updated_at = now();

-- Đảm bảo plans mặc định luôn tồn tại ngay cả khi system_settings chưa có dữ liệu.
INSERT INTO public.plans (key, name, description, max_users, max_products, max_orders_per_month, monthly_price, yearly_price, is_active)
VALUES
  ('free', 'Free', 'Gói miễn phí', 1, 50, 300, 0, 0, true),
  ('vip', 'VIP', 'Gói trả phí', 999, 999999, 999999, 69000, 59000, true)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 3. Thay CHECK ('free','vip') bằng FK đến plans để hỗ trợ thêm gói
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenants_plan_check' AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants DROP CONSTRAINT tenants_plan_check;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenants_plan_fkey' AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants ADD CONSTRAINT tenants_plan_fkey
      FOREIGN KEY (plan) REFERENCES public.plans(key) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenant_subscriptions_plan_fkey' AND conrelid = 'public.tenant_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.tenant_subscriptions ADD CONSTRAINT tenant_subscriptions_plan_fkey
      FOREIGN KEY (plan) REFERENCES public.plans(key) ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================================
-- 4. Helper kiểm tra gói hợp lệ
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_valid_plan(p_plan TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.plans WHERE key = p_plan AND is_active = true);
END;
$$;

-- ============================================================
-- 5. Helper đọc giới hạn mặc định từ plans
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_default_plan_limit_values(p_plan TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_plan public.plans%ROWTYPE;
BEGIN
  SELECT * INTO v_plan FROM public.plans WHERE key = p_plan AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  RETURN jsonb_build_object(
    'max_users', v_plan.max_users,
    'max_products', v_plan.max_products,
    'max_orders_per_month', v_plan.max_orders_per_month
  );
END;
$$;

-- ============================================================
-- 6. RPC: lấy cấu hình giới hạn mặc định Free/VIP
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_default_plan_limits()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_free JSONB;
  v_vip JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem cấu hình giới hạn' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_free := public.get_default_plan_limit_values('free');
  v_vip := public.get_default_plan_limit_values('vip');

  RETURN json_build_object('free', v_free, 'vip', v_vip);
END;
$$;

-- ============================================================
-- 7. RPC: cập nhật giới hạn mặc định của một gói (vào bảng plans)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_default_plan_limits(
  p_plan TEXT,
  p_max_users INTEGER,
  p_max_products INTEGER,
  p_max_orders_per_month INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_value JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật giới hạn mặc định' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT public.is_valid_plan(p_plan) THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  IF p_max_users <= 0 OR p_max_products <= 0 OR p_max_orders_per_month <= 0 THEN
    RAISE EXCEPTION 'Giới hạn phải lớn hơn 0';
  END IF;

  UPDATE public.plans
  SET max_users = p_max_users,
      max_products = p_max_products,
      max_orders_per_month = p_max_orders_per_month,
      updated_at = now()
  WHERE key = p_plan
  RETURNING jsonb_build_object(
    'max_users', max_users,
    'max_products', max_products,
    'max_orders_per_month', max_orders_per_month
  ) INTO v_value;

  RETURN v_value;
END;
$$;

-- ============================================================
-- 8. CRUD plans
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

CREATE OR REPLACE FUNCTION public.create_plan(
  p_key TEXT,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
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

  INSERT INTO public.plans (key, name, description, max_users, max_products, max_orders_per_month, monthly_price, yearly_price, is_active)
  VALUES (v_key, trim(p_name), p_description, p_max_users, p_max_products, p_max_orders_per_month, COALESCE(p_monthly_price, 0), COALESCE(p_yearly_price, 0), true)
  ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
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

CREATE OR REPLACE FUNCTION public.update_plan(
  p_key TEXT,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
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

CREATE OR REPLACE FUNCTION public.delete_plan(p_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_in_use BOOLEAN;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa gói' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_key IN ('free', 'vip') THEN
    RAISE EXCEPTION 'Không thể xóa gói mặc định %', p_key;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.tenants WHERE plan = p_key
    UNION ALL
    SELECT 1 FROM public.tenant_subscriptions WHERE plan = p_key
  ) INTO v_in_use;

  IF v_in_use THEN
    RAISE EXCEPTION 'Gói đang được sử dụng bởi tenant, không thể xóa';
  END IF;

  DELETE FROM public.plans WHERE key = p_key;
  RETURN FOUND;
END;
$$;

-- ============================================================
-- 9. Cập nhật create_tenant_with_admin: validate plan từ plans, dùng limits từ plans
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
  p_name TEXT,
  p_subdomain TEXT,
  p_plan TEXT DEFAULT 'free',
  p_owner_user_id UUID DEFAULT NULL
)
RETURNS public.tenants
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_owner_id UUID;
  v_tenant public.tenants;
  v_plan TEXT;
  v_limits JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'Tên cửa hàng không được để trống';
  END IF;

  IF p_subdomain IS NULL OR TRIM(p_subdomain) = '' THEN
    RAISE EXCEPTION 'Subdomain không được để trống';
  END IF;

  v_plan := COALESCE(p_plan, 'free');
  IF NOT public.is_valid_plan(v_plan) THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', v_plan;
  END IF;

  v_owner_id := COALESCE(p_owner_user_id, auth.uid());
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Không xác định được chủ sở hữu tenant';
  END IF;

  INSERT INTO public.tenants (name, subdomain, plan, owner_id, status)
  VALUES (TRIM(p_name), TRIM(p_subdomain), v_plan, v_owner_id, 'active')
  RETURNING * INTO v_tenant;

  v_limits := public.get_default_plan_limit_values(v_plan);

  INSERT INTO public.tenant_subscriptions (tenant_id, plan, max_users, max_products, max_orders_per_month)
  VALUES (
    v_tenant.id,
    v_plan,
    COALESCE((v_limits->>'max_users')::INTEGER, 0),
    COALESCE((v_limits->>'max_products')::INTEGER, 0),
    COALESCE((v_limits->>'max_orders_per_month')::INTEGER, 0)
  );

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (v_tenant.id, v_owner_id, 'admin');

  RETURN v_tenant;
END;
$$;

-- ============================================================
-- 10. Cập nhật update_tenant: validate plan từ plans
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_tenant(
  p_tenant_id UUID,
  p_name TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS public.tenants
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_tenant public.tenants;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  IF p_name IS NOT NULL AND TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'Tên cửa hàng không được để trống';
  END IF;

  IF p_plan IS NOT NULL AND NOT public.is_valid_plan(p_plan) THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  UPDATE public.tenants
  SET name = COALESCE(NULLIF(TRIM(p_name), ''), name),
      plan = COALESCE(p_plan, plan),
      status = COALESCE(p_status, status),
      updated_at = now()
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  RETURN v_tenant;
END;
$$;

-- ============================================================
-- 11. Cập nhật update_tenant_subscription: validate plan từ plans, dùng limits từ plans khi đổi gói
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

  -- ponytail: nếu đổi gói và không truyền custom limits, áp giới hạn mặc định của gói mới.
  --          Giữ custom limits hiện tại nếu user đã tự nhập.
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
-- 12. Cập nhật create_invoice: lấy đơn giá từ plans
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_invoice(
  p_tenant_id UUID,
  p_cycle_type TEXT DEFAULT 'monthly',
  p_quantity INTEGER DEFAULT 1,
  p_bonus_months INTEGER DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_invoice public.invoices%ROWTYPE;
  v_invoice_no TEXT;
  v_paid_months INTEGER;
  v_unit_price NUMERIC;
  v_description TEXT;
  v_subtotal NUMERIC;
  v_start DATE;
  v_end DATE;
  v_today DATE;
  v_plan public.plans%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo hóa đơn' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE key = v_sub.plan;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy gói dịch vụ: %', v_sub.plan;
  END IF;

  IF p_cycle_type NOT IN ('monthly', 'yearly') THEN
    RAISE EXCEPTION 'Chu kỳ không hợp lệ: %', p_cycle_type;
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Số lượng phải lớn hơn 0';
  END IF;

  IF COALESCE(p_bonus_months, 0) < 0 THEN
    RAISE EXCEPTION 'Số tháng tặng không hợp lệ';
  END IF;

  IF p_cycle_type = 'monthly' THEN
    v_paid_months := p_quantity;
    v_unit_price := COALESCE(v_plan.monthly_price, 0);
    v_description := 'Gói ' || v_plan.name || ' - Tháng';
  ELSE
    v_paid_months := p_quantity * 12;
    v_unit_price := COALESCE(v_plan.yearly_price, 0);
    v_description := 'Gói ' || v_plan.name || ' - Năm';
  END IF;

  v_subtotal := v_paid_months * v_unit_price;
  v_today := CURRENT_DATE;
  v_start := GREATEST(COALESCE(v_sub.expires_at::DATE, v_today), v_today);
  v_end := v_start + (v_paid_months + COALESCE(p_bonus_months, 0)) * INTERVAL '1 month';

  v_invoice_no := public.get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT);

  INSERT INTO public.invoices (
    tenant_id, invoice_no, status, issue_date, due_date,
    period_start, period_end, subtotal, discount, tax, total,
    amount_paid, notes, created_by
  )
  VALUES (
    p_tenant_id, v_invoice_no, 'pending', v_today, v_start + INTERVAL '2 days',
    v_start, v_end, v_subtotal, 0, 0, v_subtotal,
    0, p_notes, auth.uid()
  )
  RETURNING * INTO v_invoice;

  INSERT INTO public.invoice_items (invoice_id, tenant_id, description, quantity, unit_price)
  VALUES (v_invoice.id, p_tenant_id, v_description, v_paid_months, v_unit_price);

  IF COALESCE(p_bonus_months, 0) > 0 THEN
    INSERT INTO public.invoice_items (invoice_id, tenant_id, description, quantity, unit_price)
    VALUES (v_invoice.id, p_tenant_id, 'Tháng tặng', p_bonus_months, 0);
  END IF;

  RETURN v_invoice;
END;
$$;

-- ============================================================
-- 13. Cập nhật create_renewal_invoices: lấy đơn giá từ plans
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_renewal_invoices(p_days_before INT DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub RECORD;
  v_today DATE;
  v_period_start DATE;
  v_period_end DATE;
  v_plan public.plans%ROWTYPE;
  v_unit_price NUMERIC;
  v_created INTEGER := 0;
  v_invoice_id UUID;
BEGIN
  v_today := CURRENT_DATE;

  FOR v_sub IN
    SELECT s.tenant_id, s.expires_at, s.plan
    FROM public.tenant_subscriptions s
    JOIN public.tenants t ON t.id = s.tenant_id
    JOIN public.plans p ON p.key = s.plan AND p.is_active = true
    WHERE s.expires_at IS NOT NULL
      AND s.expires_at::DATE >= CURRENT_DATE
      AND s.expires_at::DATE <= CURRENT_DATE + (p_days_before || ' days')::INTERVAL
      AND t.status IN ('active', 'trial')
      AND NOT EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.tenant_id = s.tenant_id
          AND i.status IN ('pending', 'partial')
          AND i.period_end >= s.expires_at::DATE
      )
  LOOP
    SELECT * INTO v_plan FROM public.plans WHERE key = v_sub.plan;
    v_unit_price := COALESCE(v_plan.monthly_price, 0);

    v_period_start := v_sub.expires_at::DATE;
    v_period_end := v_period_start + INTERVAL '1 month';

    INSERT INTO public.invoices (tenant_id, invoice_no, status, issue_date, due_date, period_start, period_end, subtotal, discount, tax, total, amount_paid, created_by)
    VALUES (
      v_sub.tenant_id,
      public.get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT),
      'pending',
      v_today,
      v_period_start,
      v_period_start,
      v_period_end,
      v_unit_price,
      0,
      0,
      v_unit_price,
      0,
      auth.uid()
    )
    RETURNING id INTO v_invoice_id;

    INSERT INTO public.invoice_items (invoice_id, tenant_id, description, quantity, unit_price)
    VALUES (v_invoice_id, v_sub.tenant_id, 'Gói ' || v_plan.name || ' - Tháng (gia hạn)', 1, v_unit_price);

    v_created := v_created + 1;
  END LOOP;

  RETURN v_created;
END;
$$;
