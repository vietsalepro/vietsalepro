-- Phase 8: Admin dashboard RPC cho chủ hệ thống
-- Mục tiêu: Cung cấp RPC để system admin tạo tenant và cập nhật trạng thái tenant.

-- ============================================================
-- 1. RPC tạo tenant kèm admin (system admin thực hiện)
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
BEGIN
  -- ponytail: chỉ system admin được tạo tenant; rơi về lỗi 403 nếu không phải.
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
  IF v_plan NOT IN ('free', 'vip') THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', v_plan;
  END IF;

  v_owner_id := COALESCE(p_owner_user_id, auth.uid());
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Không xác định được chủ sở hữu tenant';
  END IF;

  -- ponytail: subdomain unique đã có constraint, để lỗi tự nhiên nếu trùng.
  INSERT INTO public.tenants (name, subdomain, plan, owner_id, status)
  VALUES (TRIM(p_name), TRIM(p_subdomain), v_plan, v_owner_id, 'active')
  RETURNING * INTO v_tenant;

  -- Tạo subscription mặc định theo gói.
  INSERT INTO public.tenant_subscriptions (tenant_id, plan, max_users, max_products, max_orders_per_month)
  VALUES (
    v_tenant.id,
    v_plan,
    CASE WHEN v_plan = 'free' THEN 1 ELSE 999999 END,
    CASE WHEN v_plan = 'free' THEN 50 ELSE 999999 END,
    CASE WHEN v_plan = 'free' THEN 300 ELSE 999999 END
  );

  -- Gán owner là admin của tenant.
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (v_tenant.id, v_owner_id, 'admin');

  RETURN v_tenant;
END;
$$;

-- ============================================================
-- 2. RPC cập nhật trạng thái tenant
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_tenant_status(
  p_tenant_id UUID,
  p_status TEXT
)
RETURNS public.tenants
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_tenant public.tenants;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật trạng thái tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('active', 'suspended', 'trial', 'pending') THEN
    RAISE EXCEPTION 'Trạng thái tenant không hợp lệ: %', p_status;
  END IF;

  UPDATE public.tenants
  SET status = p_status, updated_at = now()
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN v_tenant;
END;
$$;
