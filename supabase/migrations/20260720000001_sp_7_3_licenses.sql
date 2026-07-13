-- SP-7.3: License management
-- Bảng license key gắn với tenant, dùng cho business model offline/online license.

CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  license_key TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL,
  max_users INTEGER NOT NULL DEFAULT 0,
  max_products INTEGER NOT NULL DEFAULT 0,
  max_orders_per_month INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_licenses_tenant_id ON public.licenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON public.licenses(license_key);

-- ponytail: RLS — chỉ system admin được toàn quyền với licenses.
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "licenses_system_admin_all" ON public.licenses;
CREATE POLICY "licenses_system_admin_all"
  ON public.licenses
  FOR ALL
  TO authenticated
  USING (public.is_system_admin())
  WITH CHECK (public.is_system_admin());

-- ponytail: cấp quyền sử dụng sequences/default nếu cần.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.licenses TO authenticated;

-- Function: tạo license key cho tenant. Chỉ system admin.
CREATE OR REPLACE FUNCTION public.generate_tenant_license(
  p_tenant_id UUID,
  p_plan TEXT,
  p_max_users INTEGER DEFAULT 0,
  p_max_products INTEGER DEFAULT 0,
  p_max_orders_per_month INTEGER DEFAULT 0,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS public.licenses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_license public.licenses;
  v_key TEXT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo license' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Tenant không tồn tại';
  END IF;

  v_key := upper(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));

  INSERT INTO public.licenses (
    tenant_id,
    license_key,
    plan,
    max_users,
    max_products,
    max_orders_per_month,
    expires_at
  ) VALUES (
    p_tenant_id,
    v_key,
    p_plan,
    p_max_users,
    p_max_products,
    p_max_orders_per_month,
    p_expires_at
  )
  RETURNING * INTO v_license;

  -- ponytail: ghi audit log tạo license.
  INSERT INTO public.audit_log (tenant_id, actor_id, action, entity_type, entity_id, new_data)
  VALUES (
    p_tenant_id,
    auth.uid(),
    'CREATE',
    'license',
    v_license.id,
    jsonb_build_object(
      'license_key', v_key,
      'plan', p_plan,
      'max_users', p_max_users,
      'max_products', p_max_products,
      'max_orders_per_month', p_max_orders_per_month,
      'expires_at', p_expires_at
    )
  );

  RETURN v_license;
END;
$$;

-- Function: validate license key. Trả về lý do nếu không hợp lệ.
CREATE OR REPLACE FUNCTION public.validate_tenant_license(p_license_key TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  license_id UUID,
  tenant_id UUID,
  plan TEXT,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_license public.licenses;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT * INTO v_license FROM public.licenses WHERE license_key = upper(p_license_key);

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::TEXT, 'not_found'::TEXT;
    RETURN;
  END IF;

  IF v_license.revoked_at IS NOT NULL OR NOT v_license.is_active THEN
    RETURN QUERY SELECT false, v_license.id, v_license.tenant_id, v_license.plan, 'revoked'::TEXT;
    RETURN;
  END IF;

  IF v_license.expires_at IS NOT NULL AND v_license.expires_at < v_now THEN
    RETURN QUERY SELECT false, v_license.id, v_license.tenant_id, v_license.plan, 'expired'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_license.id, v_license.tenant_id, v_license.plan, NULL::TEXT;
END;
$$;
