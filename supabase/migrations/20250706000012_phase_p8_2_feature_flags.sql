-- P8.2: Admin dashboard — Feature flags via tenants.settings JSONB (YAGNI).
-- Không tạo bảng tenant_features; lưu tại tenants.settings->features.
-- ponytail: migration idempotent; chỉ system admin được đọc/ghi.

-- ============================================================
-- 1. RPC lấy feature flags của một tenant
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tenant_feature_flags(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem feature flags' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN COALESCE(
    (SELECT settings->'features' FROM public.tenants WHERE id = p_tenant_id),
    '{}'::jsonb
  );
END;
$$;

-- ============================================================
-- 2. RPC cập nhật (merge) feature flags của một tenant
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_tenant_feature_flags(
  p_tenant_id UUID,
  p_features JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_features JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật feature flags' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_features IS NULL THEN
    RAISE EXCEPTION 'Feature flags không được để null';
  END IF;

  UPDATE public.tenants
  SET settings = jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{features}',
        COALESCE(settings->'features', '{}'::jsonb) || p_features
      ),
      updated_at = now()
  WHERE id = p_tenant_id
  RETURNING settings->'features' INTO v_features;

  IF v_features IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN v_features;
END;
$$;
