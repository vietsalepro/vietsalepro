-- P18.2 — White-label/custom domain cho tenant VIP (YAGNI).
-- ponytail: thêm custom_domain + white_label metadata trên bảng tenants; lookup domain public; cập nhật update_tenant.

-- ============================================================
-- 1. Schema changes
-- ============================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS white_label JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_custom_domain_unique
  ON public.tenants(custom_domain)
  WHERE custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain_lookup
  ON public.tenants(lower(custom_domain));

-- ============================================================
-- 2. RPC: get tenant by custom domain (public lookup)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tenant_by_domain(p_domain TEXT)
RETURNS public.tenants
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.tenants
  WHERE lower(custom_domain) = lower(p_domain)
  LIMIT 1;
$$;

-- ============================================================
-- 3. RPC update_tenant extended with white-label / custom domain
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_tenant(
  p_tenant_id UUID,
  p_name TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_isolation_mode TEXT DEFAULT NULL,
  p_isolation_schema TEXT DEFAULT NULL,
  p_isolation_project_ref TEXT DEFAULT NULL,
  p_custom_domain TEXT DEFAULT NULL,
  p_white_label JSONB DEFAULT NULL
)
RETURNS public.tenants
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_tenant public.tenants;
  v_new_isolation_mode TEXT;
  v_new_plan TEXT;
  v_domain TEXT;
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

  IF p_status IS NOT NULL AND p_status NOT IN ('active', 'suspended', 'trial', 'pending', 'archived', 'read_only') THEN
    RAISE EXCEPTION 'Trạng thái tenant không hợp lệ: %', p_status;
  END IF;

  v_new_isolation_mode := COALESCE(p_isolation_mode, v_tenant.isolation_mode);
  IF v_new_isolation_mode IS NOT NULL AND v_new_isolation_mode NOT IN ('shared', 'schema', 'project') THEN
    RAISE EXCEPTION 'Chế độ cô lập không hợp lệ: %', v_new_isolation_mode;
  END IF;

  v_new_plan := COALESCE(p_plan, v_tenant.plan);

  -- ponytail: chỉ cho phép cô lập schema/project khi tenant là VIP.
  IF v_new_isolation_mode <> 'shared' AND v_new_plan = 'free' THEN
    RAISE EXCEPTION 'Tenant gói Free không được phép cô lập schema/project. Hãy chuyển sang VIP hoặc để shared.';
  END IF;

  IF v_new_isolation_mode = 'schema' AND COALESCE(p_isolation_schema, v_tenant.isolation_schema) IS NULL THEN
    RAISE EXCEPTION 'Chế độ schema cô lập yêu cầu tên schema (isolation_schema).';
  END IF;

  IF v_new_isolation_mode = 'project' AND COALESCE(p_isolation_project_ref, v_tenant.isolation_project_ref) IS NULL THEN
    RAISE EXCEPTION 'Chế độ project cô lập yêu cầu project ref (isolation_project_ref).';
  END IF;

  -- Validate custom domain (VIP only)
  v_domain := NULLIF(TRIM(p_custom_domain), '');
  IF v_domain IS NOT NULL THEN
    IF v_new_plan = 'free' THEN
      RAISE EXCEPTION 'Custom domain chỉ khả dụng cho tenant VIP.' USING ERRCODE = 'check_violation';
    END IF;
    IF v_domain !~ '^[a-z0-9][-a-z0-9]*(\.[-a-z0-9]+)+$' THEN
      RAISE EXCEPTION 'Tên miền không hợp lệ: %', v_domain;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.tenants
      WHERE lower(custom_domain) = lower(v_domain)
        AND id <> p_tenant_id
    ) THEN
      RAISE EXCEPTION 'Tên miền đã được sử dụng bởi tenant khác: %', v_domain;
    END IF;
  END IF;

  UPDATE public.tenants
  SET name = COALESCE(NULLIF(TRIM(p_name), ''), name),
      plan = v_new_plan,
      status = COALESCE(p_status, status),
      isolation_mode = v_new_isolation_mode,
      isolation_schema = CASE
        WHEN p_isolation_mode = 'shared' THEN NULL
        ELSE COALESCE(p_isolation_schema, isolation_schema)
      END,
      isolation_project_ref = CASE
        WHEN p_isolation_mode = 'shared' THEN NULL
        ELSE COALESCE(p_isolation_project_ref, isolation_project_ref)
      END,
      custom_domain = v_domain,
      white_label = CASE
        WHEN p_white_label IS NULL THEN white_label
        ELSE p_white_label
      END,
      updated_at = now()
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  RETURN v_tenant;
END;
$$;
