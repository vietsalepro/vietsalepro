-- P12.1: Admin dashboard — Announcements
-- Bảng announcements + RLS + API hiển thị + scheduling.
-- ponytail: migration idempotent; system admin quản lý; tenant member chỉ thấy thông báo
-- phù hợp đối tượng, đang active, đã đến lịch và chưa hết hạn.

-- ============================================================
-- 1. Bảng announcements
-- ============================================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'all'
    CHECK (target_type IN ('all', 'specific_tenants', 'specific_plans')),
  targets JSONB DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'active', 'archived')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_status_idx ON public.announcements(status);
CREATE INDEX IF NOT EXISTS announcements_scheduled_at_idx ON public.announcements(scheduled_at)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON public.announcements(created_at DESC);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'announcements' AND policyname = 'announcements_select_admin'
  ) THEN
    CREATE POLICY "announcements_select_admin" ON public.announcements FOR SELECT TO authenticated
      USING (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'announcements' AND policyname = 'announcements_select_tenant'
  ) THEN
    CREATE POLICY "announcements_select_tenant" ON public.announcements FOR SELECT TO authenticated
      USING (
        status = 'active'
        AND (scheduled_at IS NULL OR scheduled_at <= now())
        AND (expires_at IS NULL OR expires_at > now())
        AND (
          target_type = 'all'
          OR (
            target_type = 'specific_tenants'
            AND targets IS NOT NULL
            AND public.current_tenant_id() = ANY(ARRAY(SELECT (jsonb_array_elements_text(targets))::UUID))
          )
          OR (
            target_type = 'specific_plans'
            AND targets IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.tenants t
              WHERE t.id = public.current_tenant_id()
                AND t.plan = ANY(ARRAY(SELECT jsonb_array_elements_text(targets)))
            )
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'announcements' AND policyname = 'announcements_insert_admin'
  ) THEN
    CREATE POLICY "announcements_insert_admin" ON public.announcements FOR INSERT TO authenticated
      WITH CHECK (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'announcements' AND policyname = 'announcements_update_admin'
  ) THEN
    CREATE POLICY "announcements_update_admin" ON public.announcements FOR UPDATE TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'announcements' AND policyname = 'announcements_delete_admin'
  ) THEN
    CREATE POLICY "announcements_delete_admin" ON public.announcements FOR DELETE TO authenticated
      USING (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 2. RPC: lấy thông báo hiện tại cho tenant
-- ============================================================

DROP FUNCTION IF EXISTS public.get_current_announcements_for_tenant(UUID);

CREATE OR REPLACE FUNCTION public.get_current_announcements_for_tenant(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  target_type TEXT,
  targets JSONB,
  status TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_tenant_id UUID;
  v_plan TEXT;
BEGIN
  v_tenant_id := COALESCE(p_tenant_id, public.current_tenant_id());
  IF v_tenant_id IS NULL THEN
    RETURN;
  END IF;

  SELECT t.plan INTO v_plan FROM public.tenants t WHERE t.id = v_tenant_id;

  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.content,
    a.target_type,
    a.targets,
    a.status,
    a.scheduled_at,
    a.published_at,
    a.expires_at,
    a.created_by,
    a.created_at,
    a.updated_at
  FROM public.announcements a
  WHERE a.status = 'active'
    AND (a.scheduled_at IS NULL OR a.scheduled_at <= now())
    AND (a.expires_at IS NULL OR a.expires_at > now())
    AND (
      a.target_type = 'all'
      OR (
        a.target_type = 'specific_tenants'
        AND a.targets IS NOT NULL
        AND v_tenant_id = ANY(ARRAY(SELECT (jsonb_array_elements_text(a.targets))::UUID))
      )
      OR (
        a.target_type = 'specific_plans'
        AND a.targets IS NOT NULL
        AND v_plan IS NOT NULL
        AND v_plan = ANY(ARRAY(SELECT jsonb_array_elements_text(a.targets)))
      )
    )
  ORDER BY a.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_current_announcements_for_tenant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_announcements_for_tenant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_announcements_for_tenant(UUID) TO service_role;

-- ============================================================
-- 3. Scheduler: tự động publish scheduled announcements
-- ============================================================

DROP FUNCTION IF EXISTS public.publish_scheduled_announcements();

CREATE OR REPLACE FUNCTION public.publish_scheduled_announcements()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_published INTEGER := 0;
BEGIN
  UPDATE public.announcements
  SET status = 'active',
      published_at = now(),
      updated_at = now()
  WHERE status = 'scheduled'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= now();

  GET DIAGNOSTICS v_published = ROW_COUNT;
  RETURN v_published;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_scheduled_announcements() FROM PUBLIC;

-- ============================================================
-- 4. Cron: mỗi phút kiểm tra và publish
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('announcements-publish-minutely', '* * * * *', 'SELECT public.publish_scheduled_announcements();');

-- ============================================================
-- 5. Trigger: cập nhật updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_announcement_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_announcements_updated_at' AND tgrelid = 'public.announcements'::regclass
  ) THEN
    CREATE TRIGGER update_announcements_updated_at
      BEFORE UPDATE ON public.announcements
      FOR EACH ROW
      EXECUTE FUNCTION public.update_announcement_updated_at();
  END IF;
END $$;
