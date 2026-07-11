-- Sub-Phase 5.2: Security hardening settings (brute-force, IP allowlist, session timeout).
-- ponytail: IP allowlist + session timeout are stored in tenants.settings JSONB because
-- this project does not have a separate tenant_settings table.

-- ============================================================
-- 1. Login attempts table for brute-force protection
-- ============================================================

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON public.login_attempts(attempted_at DESC);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'login_attempts' AND policyname = 'login_attempts_system_admin_select'
  ) THEN
    CREATE POLICY "login_attempts_system_admin_select" ON public.login_attempts FOR SELECT TO authenticated
    USING (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 2. Brute-force helpers
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_login_locked(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failed INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_failed
  FROM public.login_attempts
  WHERE email = LOWER(TRIM(p_email))
    AND success = false
    AND attempted_at > now() - INTERVAL '15 minutes';
  RETURN v_failed >= 5;
END;
$$;

CREATE OR REPLACE FUNCTION public.unlock_login_attempts(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE email = LOWER(TRIM(p_email));
END;
$$;

-- ============================================================
-- 3. IP allowlist helpers (stored in tenants.settings -> allowed_ips)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_ip_allowed(
  p_tenant_id UUID,
  p_ip_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings JSONB;
  v_allowed TEXT[];
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN true;
  END IF;

  SELECT settings INTO v_settings FROM public.tenants WHERE id = p_tenant_id;

  IF v_settings IS NULL
    OR NOT (v_settings ? 'allowed_ips')
    OR jsonb_typeof(v_settings->'allowed_ips') <> 'array'
    OR jsonb_array_length(v_settings->'allowed_ips') = 0 THEN
    RETURN true;
  END IF;

  v_allowed := ARRAY(SELECT jsonb_array_elements_text(v_settings->'allowed_ips'));
  RETURN p_ip_address = ANY(v_allowed);
END;
$$;

-- ============================================================
-- 4. Session timeout helpers (stored in tenants.settings -> session_timeout_minutes)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_session_timeout_minutes(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_minutes INTEGER;
BEGIN
  SELECT COALESCE((settings->>'session_timeout_minutes')::INTEGER, 60)
  INTO v_minutes
  FROM public.tenants
  WHERE id = p_tenant_id;

  RETURN COALESCE(v_minutes, 60);
END;
$$;

-- ============================================================
-- 5. RPCs to read/update security settings
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tenant_security_settings(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_settings JSONB;
BEGIN
  IF NOT (public.is_system_admin() OR public.is_tenant_member(p_tenant_id)) THEN
    RAISE EXCEPTION 'Không đủ quyền xem cấu hình bảo mật' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COALESCE(settings, '{}'::jsonb) INTO v_settings
  FROM public.tenants WHERE id = p_tenant_id;

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'allowed_ips', COALESCE(v_settings->'allowed_ips', '[]'::jsonb),
    'session_timeout_minutes', COALESCE((v_settings->>'session_timeout_minutes')::INTEGER, 60)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_tenant_ip_allowlist(
  p_tenant_id UUID,
  p_allowed_ips TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_system_admin() OR public.is_tenant_admin(p_tenant_id)) THEN
    RAISE EXCEPTION 'Không đủ quyền cập nhật IP allowlist' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.tenants
  SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object('allowed_ips', to_jsonb(p_allowed_ips))
  WHERE id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_tenant_session_timeout(
  p_tenant_id UUID,
  p_minutes INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_system_admin() OR public.is_tenant_admin(p_tenant_id)) THEN
    RAISE EXCEPTION 'Không đủ quyền cập nhật thời gian timeout' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.tenants
  SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
    'session_timeout_minutes', GREATEST(5, LEAST(COALESCE(p_minutes, 60), 1440))
  )
  WHERE id = p_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.is_login_locked(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_login_locked(TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.unlock_login_attempts(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_login_attempts(TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_ip_allowed(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_ip_allowed(UUID, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_session_timeout_minutes(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_session_timeout_minutes(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_tenant_security_settings(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_security_settings(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.update_tenant_ip_allowlist(UUID, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_tenant_ip_allowlist(UUID, TEXT[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.update_tenant_session_timeout(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_tenant_session_timeout(UUID, INTEGER) TO authenticated, service_role;
