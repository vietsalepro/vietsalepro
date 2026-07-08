-- P17.2: Admin dashboard — login history + suspicious activity alerts.
-- ponytail: chỉ ghi lại đăng nhập của system admin; alert dựa trên dữ liệu đã ghi.

-- ============================================================
-- 1. Schema: admin login history
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_login_history (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  ip_address INET,
  user_agent TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_login_history_user_id ON public.admin_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_history_created_at ON public.admin_login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_login_history_status ON public.admin_login_history(status);
CREATE INDEX IF NOT EXISTS idx_admin_login_history_ip ON public.admin_login_history(ip_address);

ALTER TABLE public.admin_login_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_login_history' AND policyname = 'admin_login_history_system_admin_select'
  ) THEN
    CREATE POLICY "admin_login_history_system_admin_select"
      ON public.admin_login_history FOR SELECT TO authenticated
      USING (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 2. RPC: record admin login attempt
-- SECURITY DEFINER để authenticated user có thể ghi lại chính họ.
-- Chỉ ghi nếu user là system admin; với failed + email, lookup user_id qua auth.users.
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_admin_login(
  p_user_id UUID,
  p_email TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'success',
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := p_user_id;
  v_email TEXT := NULLIF(LOWER(TRIM(p_email)), '');
  v_ip INET;
BEGIN
  IF p_status NOT IN ('success', 'failed') THEN
    RAISE EXCEPTION 'status phải là success hoặc failed';
  END IF;

  -- Thử parse IP; nếu không hợp lệ thì để NULL.
  BEGIN
    v_ip := NULLIF(TRIM(p_ip_address), '')::INET;
  EXCEPTION WHEN invalid_text_representation THEN
    v_ip := NULL;
  END;

  -- Với failed và có email nhưng chưa có user_id, tìm system admin qua email.
  IF p_status = 'failed' AND v_user_id IS NULL AND v_email IS NOT NULL THEN
    SELECT au.id INTO v_user_id
    FROM auth.users au
    JOIN public.system_admins sa ON sa.user_id = au.id
    WHERE au.email = v_email
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Với success, chỉ ghi nếu thực sự là system admin.
  IF p_status = 'success' AND NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = v_user_id) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.admin_login_history (user_id, email, ip_address, user_agent, status, failure_reason)
  VALUES (v_user_id, v_email, v_ip, NULLIF(TRIM(p_user_agent), ''), p_status, NULLIF(TRIM(p_failure_reason), ''))
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_admin_login(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_admin_login(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_admin_login(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ============================================================
-- 3. RPC: list admin login history
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_admin_login_history(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem login history' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.admin_login_history h
  WHERE (p_status IS NULL OR h.status = p_status)
    AND (p_date_from IS NULL OR h.created_at >= p_date_from)
    AND (p_date_to IS NULL OR h.created_at <= p_date_to);

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT h.id, h.user_id, h.email, h.ip_address::TEXT AS ip_address, h.user_agent, h.status, h.failure_reason, h.created_at
      FROM public.admin_login_history h
      WHERE (p_status IS NULL OR h.status = p_status)
        AND (p_date_from IS NULL OR h.created_at >= p_date_from)
        AND (p_date_to IS NULL OR h.created_at <= p_date_to)
      ORDER BY h.created_at DESC
      LIMIT COALESCE(p_limit, 50)
      OFFSET COALESCE(p_offset, 0)
    ) t
  );

  RETURN json_build_object(
    'data', v_result,
    'count', COALESCE(v_total, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_login_history(INTEGER, INTEGER, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_login_history(INTEGER, INTEGER, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_login_history(INTEGER, INTEGER, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- ============================================================
-- 4. RPC: suspicious activity alerts
-- Quét các hành vi bất thường trong khung thời gian (mặc định 24 giờ).
-- Alert types:
--   failed_burst: ≥3 failed attempts trong 15 phút (cùng user hoặc cùng IP).
--   new_device: đăng nhập thành công từ user_agent chưa thấy trong 30 ngày qua của user.
--   rapid_login: ≥3 lần đăng nhập thành công trong 15 phút (cùng user).
-- ponytail: rule đơn giản dựa trên IP/user_agent sẵn có; upgrade path là thêm geo/time heuristic.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_admin_login_alerts(
  p_hours_ago INTEGER DEFAULT 24
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := now() - make_interval(hours => COALESCE(p_hours_ago, 24));
  v_failed_burst JSON;
  v_new_device JSON;
  v_rapid_login JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem login alerts' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Failed burst: từng cụm ≥3 failed trong 15 phút, theo user.
  -- ponytail: bucket 15 phút cố định; các cụm vượt ranh giới bucket có thể bị bỏ sót.
  v_failed_burst := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        h.user_id,
        h.email,
        h.ip_address::TEXT AS ip_address,
        COUNT(*) AS failed_count,
        MIN(h.created_at) AS window_start,
        MAX(h.created_at) AS window_end
      FROM public.admin_login_history h
      WHERE h.status = 'failed'
        AND h.created_at >= v_cutoff
      GROUP BY h.user_id, h.email, h.ip_address,
        date_trunc('hour', h.created_at) + interval '15 min' * (extract(minute from h.created_at)::int / 15)
      HAVING COUNT(*) >= 3
      ORDER BY MAX(h.created_at) DESC
      LIMIT 50
    ) t
  );

  -- New device: success từ user_agent chưa xuất hiện trong 30 ngày trước lần đăng nhập này.
  v_new_device := (
    WITH candidates AS (
      SELECT
        h.id,
        h.user_id,
        h.email,
        h.ip_address::TEXT AS ip_address,
        h.user_agent,
        h.created_at
      FROM public.admin_login_history h
      WHERE h.status = 'success'
        AND h.created_at >= v_cutoff
        AND h.user_agent IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.admin_login_history prev
          WHERE prev.user_id = h.user_id
            AND prev.status = 'success'
            AND prev.id <> h.id
            AND prev.user_agent IS NOT DISTINCT FROM h.user_agent
            AND prev.created_at >= h.created_at - interval '30 days'
            AND prev.created_at < h.created_at
        )
    )
    SELECT COALESCE(json_agg(row_to_json(candidates) ORDER BY candidates.created_at DESC), '[]'::json)
    FROM candidates
  );

  -- Rapid login: ≥3 success trong 15 phút (theo user), bất kể IP/UA.
  -- ponytail: bucket 15 phút cố định; các cụm vượt ranh giới bucket có thể bị bỏ sót.
  v_rapid_login := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        h.user_id,
        h.email,
        COUNT(*) AS success_count,
        MIN(h.created_at) AS window_start,
        MAX(h.created_at) AS window_end
      FROM public.admin_login_history h
      WHERE h.status = 'success'
        AND h.created_at >= v_cutoff
      GROUP BY h.user_id, h.email,
        date_trunc('hour', h.created_at) + interval '15 min' * (extract(minute from h.created_at)::int / 15)
      HAVING COUNT(*) >= 3
      ORDER BY MAX(h.created_at) DESC
      LIMIT 50
    ) t
  );

  RETURN json_build_object(
    'failed_burst', v_failed_burst,
    'new_device', v_new_device,
    'rapid_login', v_rapid_login
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_login_alerts(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_login_alerts(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_login_alerts(INTEGER) TO service_role;
