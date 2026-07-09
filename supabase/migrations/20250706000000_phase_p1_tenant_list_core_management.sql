-- P1: Admin dashboard — Tenant list & core management
-- Thêm trạng thái archived, cột archived_at, RPC tìm kiếm/cập nhật/xóa mềm, và cron dọn archived > 30 ngày.
-- ponytail: migration idempotent; chạy an toàn nhiều lần.

-- ============================================================
-- 1. Schema changes
-- ============================================================

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- ponytail: drop constraint tên cụ thể rồi thêm lại với enum đầy đủ (bao gồm read_only).
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_status_check;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_status_check
  CHECK (status IN ('active','suspended','trial','pending','archived','read_only'));

CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON public.tenants(plan);
CREATE INDEX IF NOT EXISTS idx_tenants_archived_at ON public.tenants(archived_at);

-- ============================================================
-- 2. Update existing status RPC to include archived
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_tenant_status(
  p_tenant_id UUID,
  p_status TEXT
)
RETURNS public.tenants
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_tenant public.tenants;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật trạng thái tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('active', 'suspended', 'trial', 'pending', 'archived', 'read_only') THEN
    RAISE EXCEPTION 'Trạng thái tenant không hợp lệ: %', p_status;
  END IF;

  UPDATE public.tenants
  SET status = p_status,
      updated_at = now(),
      archived_at = CASE WHEN p_status = 'archived' THEN now() ELSE NULL END
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN v_tenant;
END;
$$;

-- ============================================================
-- 3. RPC search_tenants (with KPI counts)
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_tenants(
  p_search_term TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
) RETURNS JSON LANGUAGE plpgsql STABLE SECURITY INVOKER AS $$
DECLARE
  v_offset int;
  v_total int;
  v_active int;
  v_suspended int;
  v_trial int;
  v_pending int;
  v_archived int;
  v_free int;
  v_vip int;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tìm kiếm tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_offset := (COALESCE(p_page, 1) - 1) * COALESCE(p_page_size, 20);

  SELECT COUNT(*) INTO v_total
  FROM public.tenants
  WHERE (p_status IS NULL OR status = p_status)
    AND (p_plan IS NULL OR plan = p_plan)
    AND (p_search_term IS NULL OR p_search_term = '' OR
         f_unaccent(name) ILIKE f_unaccent('%' || p_search_term || '%') OR
         subdomain ILIKE '%' || p_search_term || '%');

  SELECT
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'suspended'),
    COUNT(*) FILTER (WHERE status = 'trial'),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'archived'),
    COUNT(*) FILTER (WHERE plan = 'free'),
    COUNT(*) FILTER (WHERE plan = 'vip')
  INTO v_active, v_suspended, v_trial, v_pending, v_archived, v_free, v_vip
  FROM public.tenants
  WHERE (p_search_term IS NULL OR p_search_term = '' OR
         f_unaccent(name) ILIKE f_unaccent('%' || p_search_term || '%') OR
         subdomain ILIKE '%' || p_search_term || '%');

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT *
      FROM public.tenants
      WHERE (p_status IS NULL OR status = p_status)
        AND (p_plan IS NULL OR plan = p_plan)
        AND (p_search_term IS NULL OR p_search_term = '' OR
             f_unaccent(name) ILIKE f_unaccent('%' || p_search_term || '%') OR
             subdomain ILIKE '%' || p_search_term || '%')
      ORDER BY created_at DESC
      LIMIT p_page_size
      OFFSET v_offset
    ) t
  );

  RETURN json_build_object(
    'tenants', v_result,
    'totalCount', v_total,
    'counts', json_build_object(
      'active', COALESCE(v_active, 0),
      'suspended', COALESCE(v_suspended, 0),
      'trial', COALESCE(v_trial, 0),
      'pending', COALESCE(v_pending, 0),
      'archived', COALESCE(v_archived, 0),
      'free', COALESCE(v_free, 0),
      'vip', COALESCE(v_vip, 0)
    )
  );
END;
$$;

-- ============================================================
-- 4. RPC update_tenant
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_tenant(
  p_tenant_id UUID,
  p_name TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
) RETURNS public.tenants LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_tenant public.tenants;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_name IS NOT NULL AND TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'Tên cửa hàng không được để trống';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('free', 'vip') THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('active', 'suspended', 'trial', 'pending', 'archived', 'read_only') THEN
    RAISE EXCEPTION 'Trạng thái tenant không hợp lệ: %', p_status;
  END IF;

  UPDATE public.tenants
  SET name = COALESCE(NULLIF(TRIM(p_name), ''), name),
      plan = COALESCE(p_plan, plan),
      status = COALESCE(p_status, status),
      updated_at = now(),
      archived_at = CASE WHEN COALESCE(p_status, status) = 'archived' THEN COALESCE(archived_at, now())
                         WHEN p_status IS NOT NULL AND p_status <> 'archived' THEN NULL
                         ELSE archived_at END
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN v_tenant;
END;
$$;

-- ============================================================
-- 5. RPC delete_tenant_safe (soft delete)
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_tenant_safe(
  p_tenant_id UUID
) RETURNS public.tenants LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_tenant public.tenants;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.tenants
  SET status = 'archived',
      archived_at = now(),
      updated_at = now()
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN v_tenant;
END;
$$;

-- ============================================================
-- 6. Cron purge archived tenants > 30 days
-- ============================================================

-- ponytail: hard delete sau 30 ngày lưu trữ; dữ liệu nghiệp vụ cascade theo FK đã có ở phase 3.
CREATE OR REPLACE PROCEDURE public.purge_archived_tenants()
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được gọi purge archived tenants' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.tenants
  WHERE status = 'archived'
    AND archived_at < now() - INTERVAL '30 days';
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('purge-archived-tenants-daily', '0 4 * * *', 'CALL public.purge_archived_tenants();');
