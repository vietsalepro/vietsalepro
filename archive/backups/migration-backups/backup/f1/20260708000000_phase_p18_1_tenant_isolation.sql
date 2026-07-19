-- P18.1 — Multi-schema/multi-project isolation cho tenant VIP (YAGNI).
-- ponytail: chỉ thêm metadata cô lập trên bảng tenants; chưa tách schema/project thật vì chưa ~1000 tenant.

-- ============================================================
-- 1. Schema changes
-- ============================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS isolation_mode TEXT DEFAULT 'shared',
  ADD COLUMN IF NOT EXISTS isolation_schema TEXT,
  ADD COLUMN IF NOT EXISTS isolation_project_ref TEXT;

-- ponytail: xóa CHECK constraint cũ trên isolation_mode nếu có rồi tạo lại.
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE con.conrelid = 'public.tenants'::regclass
      AND con.contype = 'c'
      AND att.attname = 'isolation_mode'
  LOOP
    EXECUTE format('ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS %I', rec.conname);
  END LOOP;
END $$;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_isolation_mode_check
  CHECK (isolation_mode IN ('shared', 'schema', 'project'));

CREATE INDEX IF NOT EXISTS idx_tenants_isolation_mode ON public.tenants(isolation_mode);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_isolation_schema_unique
  ON public.tenants(isolation_schema)
  WHERE isolation_schema IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_isolation_project_ref_unique
  ON public.tenants(isolation_project_ref)
  WHERE isolation_project_ref IS NOT NULL;

-- ============================================================
-- 2. Update RPC update_tenant to manage isolation metadata
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_tenant(
  p_tenant_id UUID,
  p_name TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_isolation_mode TEXT DEFAULT NULL,
  p_isolation_schema TEXT DEFAULT NULL,
  p_isolation_project_ref TEXT DEFAULT NULL
)
RETURNS public.tenants
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_tenant public.tenants;
  v_new_isolation_mode TEXT;
  v_new_plan TEXT;
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
  -- ponytail: chỉ cho phép cô lập schema/project khi tenant là VIP (hoặc gói tùy chỉnh khác Free).
  -- Nếu muốn downgrade về Free mà vẫn đang cô lập, phải chuyển về shared trước.
  IF v_new_isolation_mode <> 'shared' AND v_new_plan = 'free' THEN
    RAISE EXCEPTION 'Tenant gói Free không được phép cô lập schema/project. Hãy chuyển sang VIP hoặc để shared.';
  END IF;

  IF v_new_isolation_mode = 'schema' AND COALESCE(p_isolation_schema, v_tenant.isolation_schema) IS NULL THEN
    RAISE EXCEPTION 'Chế độ schema cô lập yêu cầu tên schema (isolation_schema).';
  END IF;

  IF v_new_isolation_mode = 'project' AND COALESCE(p_isolation_project_ref, v_tenant.isolation_project_ref) IS NULL THEN
    RAISE EXCEPTION 'Chế độ project cô lập yêu cầu project ref (isolation_project_ref).';
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
      updated_at = now()
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  RETURN v_tenant;
END;
$$;

-- ============================================================
-- 3. RPC: get tenant isolation metadata (convenience)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tenant_isolation(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_tenant public.tenants;
BEGIN
  IF NOT public.is_system_admin() AND NOT public.is_tenant_member(p_tenant_id) THEN
    RAISE EXCEPTION 'Không có quyền xem thông tin cô lập tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN jsonb_build_object(
    'tenant_id', v_tenant.id,
    'plan', v_tenant.plan,
    'isolation_mode', COALESCE(v_tenant.isolation_mode, 'shared'),
    'isolation_schema', v_tenant.isolation_schema,
    'isolation_project_ref', v_tenant.isolation_project_ref
  );
END;
$$;
