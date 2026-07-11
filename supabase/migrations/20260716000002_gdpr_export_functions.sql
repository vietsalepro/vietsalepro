-- Sub-Phase 7.2: GDPR export / deletion functions + request queue.
-- ponytail: user-level export scans known admin/business tables; deletion anonymizes
--           the auth record and clears PII while keeping referential skeletons.

-- ============================================================
-- 1. Schema: GDPR request queue
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('export', 'deletion')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  dry_run BOOLEAN NOT NULL DEFAULT false,
  result_data JSONB,
  result_url TEXT,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON public.gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON public.gdpr_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_type ON public.gdpr_requests(type);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_created_at ON public.gdpr_requests(created_at DESC);

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gdpr_requests' AND policyname = 'gdpr_requests_system_admin_select'
  ) THEN
    CREATE POLICY "gdpr_requests_system_admin_select"
      ON public.gdpr_requests FOR SELECT TO authenticated
      USING (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gdpr_requests' AND policyname = 'gdpr_requests_system_admin_insert'
  ) THEN
    CREATE POLICY "gdpr_requests_system_admin_insert"
      ON public.gdpr_requests FOR INSERT TO authenticated
      WITH CHECK (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gdpr_requests' AND policyname = 'gdpr_requests_system_admin_update'
  ) THEN
    CREATE POLICY "gdpr_requests_system_admin_update"
      ON public.gdpr_requests FOR UPDATE TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 2. Schema: GDPR deletion audit log
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gdpr_deletion_logs (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  request_id UUID REFERENCES public.gdpr_requests(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_logs_request_id ON public.gdpr_deletion_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_logs_user_id ON public.gdpr_deletion_logs(user_id);

ALTER TABLE public.gdpr_deletion_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gdpr_deletion_logs' AND policyname = 'gdpr_deletion_logs_system_admin_select'
  ) THEN
    CREATE POLICY "gdpr_deletion_logs_system_admin_select"
      ON public.gdpr_deletion_logs FOR SELECT TO authenticated
      USING (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 3. RPC: create GDPR request
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_gdpr_request(
  p_user_id UUID,
  p_type TEXT,
  p_reason TEXT DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu user_id';
  END IF;

  IF p_type NOT IN ('export', 'deletion') THEN
    RAISE EXCEPTION 'type phải là export hoặc deletion';
  END IF;

  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo GDPR request' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User không tồn tại';
  END IF;

  INSERT INTO public.gdpr_requests (user_id, type, reason, dry_run, requested_by)
  VALUES (p_user_id, p_type, NULLIF(TRIM(p_reason), ''), COALESCE(p_dry_run, false), auth.uid())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_gdpr_request(UUID, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_gdpr_request(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_gdpr_request(UUID, TEXT, TEXT, BOOLEAN) TO service_role;

-- ============================================================
-- 4. RPC: list GDPR requests
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_gdpr_requests(
  p_status TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
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
    RAISE EXCEPTION 'Chỉ system admin mới được xem GDPR requests' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.gdpr_requests r
  WHERE (p_status IS NULL OR r.status = p_status)
    AND (p_type IS NULL OR r.type = p_type);

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT r.id, r.user_id, r.type, r.reason, r.status, r.dry_run, r.result_url,
             r.created_at, r.completed_at,
             u.email AS user_email
      FROM public.gdpr_requests r
      LEFT JOIN auth.users u ON u.id = r.user_id
      WHERE (p_status IS NULL OR r.status = p_status)
        AND (p_type IS NULL OR r.type = p_type)
      ORDER BY r.created_at DESC
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

REVOKE ALL ON FUNCTION public.get_gdpr_requests(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_gdpr_requests(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_gdpr_requests(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

-- ============================================================
-- 5. RPC: GDPR export user data
-- SECURITY DEFINER to read across auth/users, payments and audit tables.
-- ponytail: hard-coded known tables; expand when new user-scoped tables appear.
-- ============================================================

CREATE OR REPLACE FUNCTION public.gdpr_export_user_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile JSON;
  v_memberships JSON;
  v_payments JSON;
  v_audit_log JSON;
  v_admin_login_history JSON;
  v_terms_acceptance JSON;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu user_id';
  END IF;

  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được export dữ liệu user' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT json_build_object(
    'id', id,
    'email', email,
    'created_at', created_at,
    'last_sign_in_at', last_sign_in_at,
    'raw_user_meta_data', raw_user_meta_data
  ) INTO v_profile
  FROM auth.users WHERE id = p_user_id;

  v_memberships := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT m.id, m.tenant_id, m.role, m.status, m.invited_by, m.created_at, m.updated_at,
             t.name AS tenant_name, t.subdomain AS tenant_subdomain
      FROM public.tenant_memberships m
      JOIN public.tenants t ON t.id = m.tenant_id
      WHERE m.user_id = p_user_id
    ) t
  );

  v_payments := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT p.id, p.tenant_id, p.invoice_id, p.amount, p.payment_method, p.payment_date,
             p.reference_code, p.status, p.notes, p.created_at
      FROM public.payments p
      WHERE p.created_by = p_user_id
      ORDER BY p.created_at DESC
    ) t
  );

  v_audit_log := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT a.id, a.tenant_id, a.action, a.entity_type, a.entity_id, a.old_data, a.new_data,
             a.ip_address::TEXT AS ip_address, a.created_at
      FROM public.audit_log a
      WHERE a.actor_id = p_user_id
      ORDER BY a.created_at DESC
    ) t
  );

  v_admin_login_history := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT h.id, h.email, h.ip_address::TEXT AS ip_address, h.user_agent, h.status,
             h.failure_reason, h.created_at
      FROM public.admin_login_history h
      WHERE h.user_id = p_user_id
      ORDER BY h.created_at DESC
    ) t
  );

  v_terms_acceptance := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT a.id, a.tenant_id, a.terms_version, a.terms_type, a.accepted_at,
             a.ip_address::TEXT AS ip_address, a.user_agent, a.metadata
      FROM public.terms_acceptance a
      WHERE a.user_id = p_user_id
      ORDER BY a.accepted_at DESC
    ) t
  );

  RETURN json_build_object(
    'profile', COALESCE(v_profile, '{}'::json),
    'memberships', v_memberships,
    'payments', v_payments,
    'audit_log', v_audit_log,
    'admin_login_history', v_admin_login_history,
    'terms_acceptance', v_terms_acceptance,
    'exported_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.gdpr_export_user_data(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gdpr_export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gdpr_export_user_data(UUID) TO service_role;

-- ============================================================
-- 6. RPC: GDPR delete user data
-- SECURITY DEFINER to mutate auth.users and tenant-scoped tables.
-- Dry-run returns the planned actions without executing them.
-- ponytail: anonymize auth.users (keep id for FKs), delete PII in
--           tenant_memberships and terms_acceptance, log all actions.
--           Payments are NOT deleted; they are anonymized by clearing created_by.
-- ============================================================

CREATE OR REPLACE FUNCTION public.gdpr_delete_user_data(
  p_user_id UUID,
  p_dry_run BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID := extensions.gen_random_uuid();
  v_actions JSONB := '[]'::JSONB;
  v_count INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu user_id';
  END IF;

  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa dữ liệu user' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User không tồn tại';
  END IF;

  -- Plan: anonymize auth.users profile.
  v_actions := v_actions || jsonb_build_object(
    'table', 'auth.users',
    'action', 'anonymize',
    'columns', ARRAY['email', 'raw_user_meta_data']
  );

  -- Plan: delete tenant_memberships rows.
  SELECT COUNT(*) INTO v_count FROM public.tenant_memberships WHERE user_id = p_user_id;
  v_actions := v_actions || jsonb_build_object(
    'table', 'public.tenant_memberships',
    'action', 'delete',
    'row_count', v_count
  );

  -- Plan: delete terms_acceptance rows.
  SELECT COUNT(*) INTO v_count FROM public.terms_acceptance WHERE user_id = p_user_id;
  v_actions := v_actions || jsonb_build_object(
    'table', 'public.terms_acceptance',
    'action', 'delete',
    'row_count', v_count
  );

  -- Plan: anonymize payments created_by.
  SELECT COUNT(*) INTO v_count FROM public.payments WHERE created_by = p_user_id;
  v_actions := v_actions || jsonb_build_object(
    'table', 'public.payments',
    'action', 'anonymize',
    'column', 'created_by',
    'row_count', v_count
  );

  -- Plan: delete audit_log entries.
  SELECT COUNT(*) INTO v_count FROM public.audit_log WHERE actor_id = p_user_id;
  v_actions := v_actions || jsonb_build_object(
    'table', 'public.audit_log',
    'action', 'delete',
    'row_count', v_count
  );

  -- Plan: delete admin_login_history entries.
  SELECT COUNT(*) INTO v_count FROM public.admin_login_history WHERE user_id = p_user_id;
  v_actions := v_actions || jsonb_build_object(
    'table', 'public.admin_login_history',
    'action', 'delete',
    'row_count', v_count
  );

  IF p_dry_run THEN
    RETURN json_build_object(
      'dry_run', true,
      'request_id', v_request_id,
      'user_id', p_user_id,
      'planned_actions', v_actions
    );
  END IF;

  -- Execute deletion / anonymization.
  UPDATE auth.users
  SET email = 'deleted-' || p_user_id || '@anon.local',
      raw_user_meta_data = '{}'::jsonb,
      encrypted_password = NULL,
      email_confirmed_at = NULL,
      confirmation_token = NULL,
      recovery_token = NULL,
      email_change_token_new = NULL,
      email_change = NULL,
      phone = NULL,
      phone_confirmed_at = NULL
  WHERE id = p_user_id;

  INSERT INTO public.gdpr_deletion_logs (request_id, user_id, action, details)
  VALUES (v_request_id, p_user_id, 'anonymize_auth_user', jsonb_build_object('user_id', p_user_id));

  DELETE FROM public.tenant_memberships WHERE user_id = p_user_id;
  INSERT INTO public.gdpr_deletion_logs (request_id, user_id, action, details)
  VALUES (v_request_id, p_user_id, 'delete_memberships', jsonb_build_object('user_id', p_user_id));

  DELETE FROM public.terms_acceptance WHERE user_id = p_user_id;
  INSERT INTO public.gdpr_deletion_logs (request_id, user_id, action, details)
  VALUES (v_request_id, p_user_id, 'delete_terms_acceptance', jsonb_build_object('user_id', p_user_id));

  UPDATE public.payments SET created_by = NULL WHERE created_by = p_user_id;
  INSERT INTO public.gdpr_deletion_logs (request_id, user_id, action, details)
  VALUES (v_request_id, p_user_id, 'anonymize_payments', jsonb_build_object('user_id', p_user_id));

  DELETE FROM public.audit_log WHERE actor_id = p_user_id;
  INSERT INTO public.gdpr_deletion_logs (request_id, user_id, action, details)
  VALUES (v_request_id, p_user_id, 'delete_audit_log', jsonb_build_object('user_id', p_user_id));

  DELETE FROM public.admin_login_history WHERE user_id = p_user_id;
  INSERT INTO public.gdpr_deletion_logs (request_id, user_id, action, details)
  VALUES (v_request_id, p_user_id, 'delete_login_history', jsonb_build_object('user_id', p_user_id));

  RETURN json_build_object(
    'dry_run', false,
    'request_id', v_request_id,
    'user_id', p_user_id,
    'executed_actions', v_actions,
    'deleted_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.gdpr_delete_user_data(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gdpr_delete_user_data(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gdpr_delete_user_data(UUID, BOOLEAN) TO service_role;
