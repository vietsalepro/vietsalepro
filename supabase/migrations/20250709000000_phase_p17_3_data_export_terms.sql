-- P17.3: Admin dashboard — Data export per tenant + terms acceptance (GDPR / Nghị định 13/2023).
-- ponytail: dynamic scan of tenant_id columns for export; known admin tables excluded.
-- Upgrade path: switch to explicit whitelist if schema grows beyond known tenant-scoped tables.

-- ============================================================
-- 1. Schema: terms acceptance log
-- ============================================================

CREATE TABLE IF NOT EXISTS public.terms_acceptance (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  terms_version TEXT NOT NULL,
  terms_type TEXT NOT NULL CHECK (terms_type IN ('tos', 'privacy', 'gdpr', 'cookie', 'custom')),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_terms_acceptance_user_id ON public.terms_acceptance(user_id);
CREATE INDEX IF NOT EXISTS idx_terms_acceptance_tenant_id ON public.terms_acceptance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_terms_acceptance_terms_type ON public.terms_acceptance(terms_type);
CREATE INDEX IF NOT EXISTS idx_terms_acceptance_accepted_at ON public.terms_acceptance(accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_terms_acceptance_user_tenant_type ON public.terms_acceptance(user_id, tenant_id, terms_type);

ALTER TABLE public.terms_acceptance ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'terms_acceptance' AND policyname = 'terms_acceptance_owner_select'
  ) THEN
    CREATE POLICY "terms_acceptance_owner_select"
      ON public.terms_acceptance FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'terms_acceptance' AND policyname = 'terms_acceptance_owner_insert'
  ) THEN
    CREATE POLICY "terms_acceptance_owner_insert"
      ON public.terms_acceptance FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 2. RPC: record terms acceptance
-- SECURITY DEFINER so authenticated user can record their own acceptance.
-- System admins may record on behalf of another user.
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_terms_acceptance(
  p_user_id UUID,
  p_tenant_id UUID DEFAULT NULL,
  p_terms_version TEXT DEFAULT '1.0',
  p_terms_type TEXT DEFAULT 'tos',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_ip INET;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu user_id';
  END IF;

  IF auth.uid() <> p_user_id AND NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Không được ghi nhận chấp thuận điều khoản cho người khác' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_terms_type IS NOT NULL AND p_terms_type NOT IN ('tos', 'privacy', 'gdpr', 'cookie', 'custom') THEN
    RAISE EXCEPTION 'terms_type không hợp lệ';
  END IF;

  BEGIN
    v_ip := NULLIF(TRIM(p_ip_address), '')::INET;
  EXCEPTION WHEN invalid_text_representation THEN
    v_ip := NULL;
  END;

  INSERT INTO public.terms_acceptance (
    user_id, tenant_id, terms_version, terms_type, ip_address, user_agent, metadata
  ) VALUES (
    p_user_id,
    p_tenant_id,
    COALESCE(NULLIF(TRIM(p_terms_version), ''), '1.0'),
    COALESCE(NULLIF(TRIM(p_terms_type), ''), 'tos'),
    v_ip,
    NULLIF(TRIM(p_user_agent), ''),
    COALESCE(p_metadata, '{}')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_terms_acceptance(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_terms_acceptance(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_terms_acceptance(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- ============================================================
-- 3. RPC: list terms acceptances (system admin)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_terms_acceptances(
  p_tenant_id UUID DEFAULT NULL,
  p_terms_type TEXT DEFAULT NULL,
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
    RAISE EXCEPTION 'Chỉ system admin mới được xem terms acceptance log' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.terms_acceptance a
  WHERE (p_tenant_id IS NULL OR a.tenant_id = p_tenant_id)
    AND (p_terms_type IS NULL OR a.terms_type = p_terms_type);

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT a.id, a.user_id, a.tenant_id, a.terms_version, a.terms_type, a.accepted_at, a.ip_address::TEXT AS ip_address, a.user_agent, a.metadata, a.created_at
      FROM public.terms_acceptance a
      WHERE (p_tenant_id IS NULL OR a.tenant_id = p_tenant_id)
        AND (p_terms_type IS NULL OR a.terms_type = p_terms_type)
      ORDER BY a.accepted_at DESC
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

REVOKE ALL ON FUNCTION public.get_terms_acceptances(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_terms_acceptances(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_terms_acceptances(UUID, TEXT, INTEGER, INTEGER) TO service_role;

-- ============================================================
-- 4. RPC: export tenant data (GDPR / Nghị định 13/2023)
-- SECURITY DEFINER to bypass RLS; caller must be system admin.
-- ponytail: dynamic scan of information_schema for tenant_id columns.
-- Excludes tenant foundation, admin, and compliance tables.
-- ============================================================

CREATE OR REPLACE FUNCTION public.export_tenant_data(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant JSON;
  v_subscription JSON;
  v_members JSON;
  v_table_list TEXT[];
  v_table_name TEXT;
  v_rows JSONB;
  v_tables JSONB := '[]'::jsonb;
BEGIN
  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu tenant_id';
  END IF;

  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được export dữ liệu tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT row_to_json(t) INTO v_tenant
  FROM public.tenants t
  WHERE t.id = p_tenant_id;

  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Tenant không tồn tại';
  END IF;

  SELECT row_to_json(s) INTO v_subscription
  FROM public.tenant_subscriptions s
  WHERE s.tenant_id = p_tenant_id;

  v_members := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT m.id, m.tenant_id, m.user_id, m.role, m.invited_by, m.created_at, m.updated_at, u.email
      FROM public.tenant_memberships m
      LEFT JOIN auth.users u ON u.id = m.user_id
      WHERE m.tenant_id = p_tenant_id
    ) t
  );

  SELECT array_agg(c.table_name::TEXT) INTO v_table_list
  FROM information_schema.columns c
  JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
  WHERE c.table_schema = 'public'
    AND c.column_name = 'tenant_id'
    AND c.table_name NOT IN (
      'tenants', 'tenant_memberships', 'tenant_subscriptions',
      'system_admins', 'admin_login_history', 'admin_2fa_backup_codes',
      'terms_acceptance'
    );

  FOREACH v_table_name IN ARRAY COALESCE(v_table_list, ARRAY[]::TEXT[])
  LOOP
    BEGIN
      EXECUTE format(
        'SELECT COALESCE(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) FROM (SELECT * FROM public.%I WHERE tenant_id = %L) t',
        v_table_name,
        p_tenant_id
      ) INTO v_rows;

      v_tables := v_tables || jsonb_build_object(
        'table_name', v_table_name,
        'row_count', jsonb_array_length(COALESCE(v_rows, '[]'::jsonb)),
        'rows', COALESCE(v_rows, '[]'::jsonb)
      );
    EXCEPTION WHEN OTHERS THEN
      v_tables := v_tables || jsonb_build_object(
        'table_name', v_table_name,
        'row_count', 0,
        'rows', '[]'::jsonb,
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'tenant', COALESCE(v_tenant::jsonb, '{}'::jsonb),
    'subscription', COALESCE(v_subscription::jsonb, '{}'::jsonb),
    'members', COALESCE(v_members::jsonb, '[]'::jsonb),
    'tables', v_tables,
    'exported_at', now()
  )::json;
END;
$$;

REVOKE ALL ON FUNCTION public.export_tenant_data(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.export_tenant_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_tenant_data(UUID) TO service_role;
