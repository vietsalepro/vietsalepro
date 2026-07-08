-- P5: Admin dashboard — Audit & security
-- Mở rộng audit log filter, rate limit logs, system admin CRUD.
-- ponytail: migration idempotent; chỉ system admin được gọi các RPC này.

-- ============================================================
-- 0. Add created_at column to system_admins table
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_admins' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.system_admins ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- ============================================================
-- 1. Indexes for audit log filtering
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_app_audit_log_tenant_id
  ON public.app_audit_log(tenant_id);

CREATE INDEX IF NOT EXISTS idx_app_audit_log_user_id
  ON public.app_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_app_audit_log_action
  ON public.app_audit_log(action);

CREATE INDEX IF NOT EXISTS idx_app_audit_log_table_name
  ON public.app_audit_log(table_name);

CREATE INDEX IF NOT EXISTS idx_app_audit_log_created_at
  ON public.app_audit_log(created_at DESC);

-- ============================================================
-- 2. Rate limit logs RLS (chỉ system admin đọc)
-- ============================================================

ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rate_limit_logs' AND policyname = 'rate_limit_logs_system_admin_select'
  ) THEN
    CREATE POLICY "rate_limit_logs_system_admin_select"
      ON public.rate_limit_logs FOR SELECT TO authenticated
      USING (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 3. RPC lấy rate limit logs
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_rate_limit_logs(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_total INTEGER;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem rate limit logs' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total FROM public.rate_limit_logs;

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT *
      FROM public.rate_limit_logs
      ORDER BY created_at DESC, window_start DESC
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

-- ============================================================
-- 4. RPC lấy danh sách system admins (kèm email)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_system_admins()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem danh sách system admin' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT sa.user_id, au.email, sa.created_at
      FROM public.system_admins sa
      JOIN auth.users au ON au.id = sa.user_id
      ORDER BY sa.created_at DESC
    ) t
  );
END;
$$;

-- ============================================================
-- 5. RPC thêm system admin
-- ============================================================

CREATE OR REPLACE FUNCTION public.add_system_admin(
  p_user_id UUID
)
RETURNS public.system_admins
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_row public.system_admins;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được thêm system admin' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Không tìm thấy user: %', p_user_id;
  END IF;

  INSERT INTO public.system_admins (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- ============================================================
-- 5. RPC xóa system admin
-- ============================================================

CREATE OR REPLACE FUNCTION public.remove_system_admin(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa system admin' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Không thể tự xóa quyền system admin của chính mình';
  END IF;

  DELETE FROM public.system_admins WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy system admin: %', p_user_id;
  END IF;

  RETURN TRUE;
END;
$$;
