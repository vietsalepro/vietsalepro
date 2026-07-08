-- P13.4: Admin dashboard — Bulk operations + maintenance scheduler
-- ponytail: one table for maintenance_windows; RPC bulk_update_tenants reuses update_tenant logic.
-- Security: only system admin touches maintenance windows and bulk update.

-- ============================================================
-- 1. maintenance_windows table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.maintenance_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT maintenance_windows_ends_after_starts CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS maintenance_windows_starts_at_idx ON public.maintenance_windows(starts_at);
CREATE INDEX IF NOT EXISTS maintenance_windows_ends_at_idx ON public.maintenance_windows(ends_at);
CREATE INDEX IF NOT EXISTS maintenance_windows_status_idx ON public.maintenance_windows(status);

ALTER TABLE public.maintenance_windows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'maintenance_windows' AND policyname = 'maintenance_windows_admin_all'
  ) THEN
    CREATE POLICY "maintenance_windows_admin_all" ON public.maintenance_windows TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;
END $$;

-- Trigger cập nhật updated_at
CREATE OR REPLACE FUNCTION public.set_maintenance_windows_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'maintenance_windows_updated_at' AND tgrelid = 'public.maintenance_windows'::regclass
  ) THEN
    CREATE TRIGGER maintenance_windows_updated_at
      BEFORE UPDATE ON public.maintenance_windows
      FOR EACH ROW
      EXECUTE FUNCTION public.set_maintenance_windows_updated_at();
  END IF;
END $$;

-- ============================================================
-- 2. RPC: list maintenance windows in a date range
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_maintenance_windows(
  p_start TIMESTAMPTZ DEFAULT NULL,
  p_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem maintenance windows' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.starts_at), '[]'::json)
    FROM (
      SELECT
        id,
        title,
        description,
        starts_at,
        ends_at,
        status,
        created_by,
        created_at,
        updated_at
      FROM public.maintenance_windows
      WHERE (p_start IS NULL OR starts_at >= p_start)
        AND (p_end IS NULL OR ends_at <= p_end)
    ) t
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_maintenance_windows(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_maintenance_windows(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_maintenance_windows(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- ============================================================
-- 3. RPC: create maintenance window
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_maintenance_window(
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_starts_at TIMESTAMPTZ DEFAULT NULL,
  p_ends_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_window public.maintenance_windows%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo maintenance window' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_title IS NULL OR TRIM(p_title) = '' THEN
    RAISE EXCEPTION 'Tiêu đề không được để trống';
  END IF;

  IF p_starts_at IS NULL OR p_ends_at IS NULL OR p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'Thời gian bảo trì không hợp lệ: ends_at phải sau starts_at';
  END IF;

  INSERT INTO public.maintenance_windows (title, description, starts_at, ends_at)
  VALUES (TRIM(p_title), p_description, p_starts_at, p_ends_at)
  RETURNING * INTO v_window;

  RETURN row_to_json(v_window);
END;
$$;

REVOKE ALL ON FUNCTION public.create_maintenance_window(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_maintenance_window(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_maintenance_window(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- ============================================================
-- 4. RPC: update maintenance window
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_maintenance_window(
  p_id UUID,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_starts_at TIMESTAMPTZ DEFAULT NULL,
  p_ends_at TIMESTAMPTZ DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_window public.maintenance_windows%ROWTYPE;
  v_new_starts TIMESTAMPTZ;
  v_new_ends TIMESTAMPTZ;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật maintenance window' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_window FROM public.maintenance_windows WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy maintenance window: %', p_id;
  END IF;

  IF p_title IS NOT NULL AND TRIM(p_title) = '' THEN
    RAISE EXCEPTION 'Tiêu đề không được để trống';
  END IF;

  v_new_starts := COALESCE(p_starts_at, v_window.starts_at);
  v_new_ends := COALESCE(p_ends_at, v_window.ends_at);

  IF v_new_ends <= v_new_starts THEN
    RAISE EXCEPTION 'Thời gian bảo trì không hợp lệ: ends_at phải sau starts_at';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('scheduled', 'in_progress', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Trạng thái không hợp lệ: %', p_status;
  END IF;

  UPDATE public.maintenance_windows
  SET title = COALESCE(NULLIF(TRIM(p_title), ''), title),
      description = COALESCE(p_description, description),
      starts_at = v_new_starts,
      ends_at = v_new_ends,
      status = COALESCE(p_status, status)
  WHERE id = p_id
  RETURNING * INTO v_window;

  RETURN row_to_json(v_window);
END;
$$;

REVOKE ALL ON FUNCTION public.update_maintenance_window(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_maintenance_window(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_maintenance_window(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO service_role;

-- ============================================================
-- 5. RPC: delete maintenance window
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_maintenance_window(
  p_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa maintenance window' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.maintenance_windows WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy maintenance window: %', p_id;
  END IF;

  RETURN json_build_object('id', p_id, 'deleted', true);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_maintenance_window(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_maintenance_window(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_maintenance_window(UUID) TO service_role;

-- ============================================================
-- 6. RPC: bulk update multiple tenants
-- ponytail: loops tenant ids and applies update_tenant logic.
-- Ceiling: large arrays (>1000) should be chunked by caller.
-- ============================================================

CREATE OR REPLACE FUNCTION public.bulk_update_tenants(
  p_tenant_ids UUID[],
  p_status TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_id UUID;
  v_tenant public.tenants%ROWTYPE;
  v_updated_ids UUID[] := ARRAY[]::UUID[];
  v_skipped_ids UUID[] := ARRAY[]::UUID[];
  v_count INTEGER := 0;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được bulk update tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tenant_ids IS NULL OR array_length(p_tenant_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Danh sách tenant không được để trống';
  END IF;

  IF p_status IS NULL AND p_plan IS NULL THEN
    RAISE EXCEPTION 'Phải cung cấp ít nhất status hoặc plan để cập nhật';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('active', 'suspended', 'trial', 'pending', 'archived', 'read_only') THEN
    RAISE EXCEPTION 'Trạng thái tenant không hợp lệ: %', p_status;
  END IF;

  IF p_plan IS NOT NULL AND NOT public.is_valid_plan(p_plan) THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  FOREACH v_id IN ARRAY p_tenant_ids LOOP
    SELECT * INTO v_tenant FROM public.tenants WHERE id = v_id;
    IF NOT FOUND THEN
      v_skipped_ids := array_append(v_skipped_ids, v_id);
      CONTINUE;
    END IF;

    UPDATE public.tenants
    SET status = COALESCE(p_status, status),
        plan = COALESCE(p_plan, plan),
        updated_at = now(),
        archived_at = CASE WHEN COALESCE(p_status, status) = 'archived' THEN now() ELSE NULL END
    WHERE id = v_id
    RETURNING * INTO v_tenant;

    v_updated_ids := array_append(v_updated_ids, v_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN json_build_object(
    'updated', v_count,
    'updatedIds', v_updated_ids,
    'skippedIds', v_skipped_ids
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bulk_update_tenants(UUID[], TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_update_tenants(UUID[], TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_tenants(UUID[], TEXT, TEXT) TO service_role;
