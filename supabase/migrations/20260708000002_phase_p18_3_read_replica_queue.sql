-- P18.3 — Read replica + connection pooling + queue system for heavy ops (YAGNI).
-- ponytail: infrastructure metadata trên tenants + heavy_ops_jobs queue; stats từ pg_stat_activity (best-effort).

-- ============================================================
-- 1. Infrastructure metadata per tenant
-- ============================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS read_replica_url TEXT,
  ADD COLUMN IF NOT EXISTS connection_pool_config JSONB DEFAULT '{}'::jsonb;

-- ============================================================
-- 2. Heavy ops job queue
-- ============================================================

CREATE TABLE IF NOT EXISTS public.heavy_ops_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  error_message TEXT,
  result JSONB,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_heavy_ops_jobs_status_scheduled
  ON public.heavy_ops_jobs(status, scheduled_at)
  WHERE status IN ('pending','processing');

CREATE INDEX IF NOT EXISTS idx_heavy_ops_jobs_tenant_status
  ON public.heavy_ops_jobs(tenant_id, status);

-- ============================================================
-- 3. RLS
-- ============================================================

ALTER TABLE public.heavy_ops_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS heavy_ops_jobs_system_admin_select ON public.heavy_ops_jobs;
CREATE POLICY heavy_ops_jobs_system_admin_select
  ON public.heavy_ops_jobs
  FOR SELECT
  USING (public.is_system_admin());

DROP POLICY IF EXISTS heavy_ops_jobs_tenant_select ON public.heavy_ops_jobs;
CREATE POLICY heavy_ops_jobs_tenant_select
  ON public.heavy_ops_jobs
  FOR SELECT
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS heavy_ops_jobs_tenant_insert ON public.heavy_ops_jobs;
CREATE POLICY heavy_ops_jobs_tenant_insert
  ON public.heavy_ops_jobs
  FOR INSERT
  WITH CHECK (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS heavy_ops_jobs_worker_update ON public.heavy_ops_jobs;
CREATE POLICY heavy_ops_jobs_worker_update
  ON public.heavy_ops_jobs
  FOR UPDATE
  USING (public.is_system_admin());

DROP POLICY IF EXISTS heavy_ops_jobs_worker_delete ON public.heavy_ops_jobs;
CREATE POLICY heavy_ops_jobs_worker_delete
  ON public.heavy_ops_jobs
  FOR DELETE
  USING (public.is_system_admin());

-- ============================================================
-- 4. Queue RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION public.enqueue_heavy_op_job(
  p_tenant_id UUID,
  p_job_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_max_attempts INT DEFAULT 3,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS public.heavy_ops_jobs
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_job public.heavy_ops_jobs;
BEGIN
  IF NOT public.is_tenant_member(p_tenant_id) AND NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Không có quyền tạo job' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_max_attempts < 1 THEN
    RAISE EXCEPTION 'max_attempts phải >= 1';
  END IF;

  INSERT INTO public.heavy_ops_jobs (
    tenant_id, job_type, payload, status, max_attempts, scheduled_at
  ) VALUES (
    p_tenant_id, p_job_type, p_payload, 'pending',
    p_max_attempts, COALESCE(p_scheduled_at, now())
  )
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_heavy_op_job()
RETURNS public.heavy_ops_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.heavy_ops_jobs;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Không có quyền claim job' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_job
  FROM public.heavy_ops_jobs
  WHERE status = 'pending' AND scheduled_at <= now()
  ORDER BY scheduled_at, created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.heavy_ops_jobs
    SET status = 'processing', attempts = attempts + 1, updated_at = now()
    WHERE id = v_job.id
    RETURNING * INTO v_job;
  END IF;

  RETURN v_job;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_heavy_op_job(
  p_job_id UUID,
  p_status TEXT,
  p_result JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS public.heavy_ops_jobs
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_job public.heavy_ops_jobs;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Không có quyền cập nhật job' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_status NOT IN ('completed','failed','cancelled','pending','processing') THEN
    RAISE EXCEPTION 'Trạng thái job không hợp lệ: %', p_status;
  END IF;

  UPDATE public.heavy_ops_jobs
  SET status = p_status,
      result = p_result,
      error_message = p_error_message,
      updated_at = now()
  WHERE id = p_job_id
  RETURNING * INTO v_job;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy job: %', p_job_id;
  END IF;

  RETURN v_job;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_heavy_op_jobs(
  p_tenant_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  tenant_id UUID,
  job_type TEXT,
  payload JSONB,
  status TEXT,
  attempts INT,
  max_attempts INT,
  error_message TEXT,
  result JSONB,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  IF p_tenant_id IS NOT NULL AND NOT public.is_tenant_member(p_tenant_id) AND NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Không có quyền xem job của tenant này' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT j.id, j.tenant_id, j.job_type, j.payload, j.status, j.attempts, j.max_attempts,
         j.error_message, j.result, j.scheduled_at, j.created_at, j.updated_at
  FROM public.heavy_ops_jobs j
  WHERE (p_tenant_id IS NULL OR j.tenant_id = p_tenant_id)
    AND (p_status IS NULL OR j.status = p_status)
  ORDER BY j.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.retry_heavy_op_job(p_job_id UUID)
RETURNS public.heavy_ops_jobs
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_job public.heavy_ops_jobs;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Không có quyền retry job' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.heavy_ops_jobs
  SET status = 'pending', error_message = NULL, attempts = 0, updated_at = now()
  WHERE id = p_job_id AND status IN ('failed','cancelled')
  RETURNING * INTO v_job;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chỉ được retry job failed/cancelled: %', p_job_id;
  END IF;

  RETURN v_job;
END;
$$;

-- ============================================================
-- 5. Infrastructure stats RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_connection_pool_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_active INT;
  v_idle INT;
  v_total INT;
  v_max INT;
BEGIN
  -- ponytail: stats từ pg_stat_activity; trên Supabase free tier user thường không xem được hết,
  -- nên wrap trong exception trả về unknown để UI không crash.
  BEGIN
    SELECT COUNT(*) FILTER (WHERE state = 'active'),
           COUNT(*) FILTER (WHERE state = 'idle'),
           COUNT(*)
    INTO v_active, v_idle, v_total
    FROM pg_stat_activity
    WHERE datname = current_database();
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'active', 0, 'idle', 0, 'total', 0, 'max', 0,
      'status', 'unknown', 'message', 'Không thể đọc pg_stat_activity với quyền hiện tại'
    );
  END;

  v_max := GREATEST(v_total, 10);

  RETURN jsonb_build_object(
    'active', v_active,
    'idle', v_idle,
    'total', v_total,
    'max', v_max,
    'status', CASE
      WHEN v_total >= v_max * 0.9 THEN 'critical'
      WHEN v_total >= v_max * 0.75 THEN 'warning'
      ELSE 'healthy'
    END,
    'message', NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_read_replica_status()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT jsonb_build_object(
    'enabled', EXISTS (
      SELECT 1 FROM public.tenants
      WHERE read_replica_url IS NOT NULL
      LIMIT 1
    ),
    'configured_tenants', (
      SELECT COUNT(*) FROM public.tenants WHERE read_replica_url IS NOT NULL
    ),
    'message', 'Read replica URL được cấu hình trên cột tenants.read_replica_url. Frontend dùng VITE_SUPABASE_READ_REPLICA_URL.'
  );
$$;

-- ============================================================
-- 6. Extend update_tenant with read replica / connection pool config
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
  p_white_label JSONB DEFAULT NULL,
  p_read_replica_url TEXT DEFAULT NULL,
  p_connection_pool_config JSONB DEFAULT NULL
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

  -- ponytail: read replica / pool config chỉ lưu metadata, không tạo replica thật ở phase YAGNI.
  IF p_read_replica_url IS NOT NULL AND TRIM(p_read_replica_url) = '' THEN
    RAISE EXCEPTION 'read_replica_url không được để trống nếu được truyền';
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
      read_replica_url = CASE
        WHEN p_read_replica_url IS NULL THEN read_replica_url
        ELSE NULLIF(TRIM(p_read_replica_url), '')
      END,
      connection_pool_config = CASE
        WHEN p_connection_pool_config IS NULL THEN connection_pool_config
        ELSE p_connection_pool_config
      END,
      updated_at = now()
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  RETURN v_tenant;
END;
$$;
