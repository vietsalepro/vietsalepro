-- Sub-Phase 5.2: Login audit infrastructure.
-- ponytail: login attempts come from application login flow, so this migration exposes
-- RPCs to record attempts and read them for admin review/brute-force monitoring.

CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email TEXT,
  p_ip_address TEXT,
  p_success BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.login_attempts (email, ip_address, success)
  VALUES (LOWER(TRIM(p_email)), COALESCE(p_ip_address, ''), COALESCE(p_success, false))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_login_attempts(
  p_email TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_result JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem login attempts' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.login_attempts
  WHERE (p_email IS NULL OR email = LOWER(TRIM(p_email)));

  v_result := (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT id, email, ip_address, success, attempted_at
      FROM public.login_attempts
      WHERE (p_email IS NULL OR email = LOWER(TRIM(p_email)))
      ORDER BY attempted_at DESC
      LIMIT COALESCE(p_limit, 50)
      OFFSET COALESCE(p_offset, 0)
    ) t
  );

  RETURN jsonb_build_object(
    'data', COALESCE(v_result, '[]'::jsonb),
    'count', COALESCE(v_total, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_locked_emails()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem danh sách bị khóa' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_result := (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT email, COUNT(*) FILTER (WHERE NOT success) AS failed_count, MAX(attempted_at) AS last_attempt
      FROM public.login_attempts
      WHERE attempted_at > now() - INTERVAL '15 minutes'
      GROUP BY email
      HAVING COUNT(*) FILTER (WHERE NOT success) >= 5
      ORDER BY MAX(attempted_at) DESC
    ) t
  );

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.record_login_attempt(TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(TEXT, TEXT, BOOLEAN) TO authenticated, service_role, anon;

REVOKE ALL ON FUNCTION public.get_login_attempts(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_login_attempts(TEXT, INTEGER, INTEGER) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_locked_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_locked_emails() TO authenticated, service_role;
