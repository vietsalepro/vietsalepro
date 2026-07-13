-- SP-2.4: Admin dashboard — Announcement Manager page
-- ponytail: add audience + active window columns; keep target_type/targets/scheduled_at/expires_at
-- for backwards compatibility and sync on write.

-- ============================================================
-- 1. Add columns
-- ============================================================

ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS active_from TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS active_to TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS announcements_audience_idx ON public.announcements(audience);
CREATE INDEX IF NOT EXISTS announcements_active_from_idx ON public.announcements(active_from)
  WHERE active_from IS NOT NULL;
CREATE INDEX IF NOT EXISTS announcements_active_to_idx ON public.announcements(active_to)
  WHERE active_to IS NOT NULL;

-- ============================================================
-- 2. Sync legacy columns from new columns (one-time backfill)
-- ponytail: O(n) scan on announcements table; safe for small tables.
-- ============================================================

UPDATE public.announcements
SET target_type = CASE
  WHEN audience = 'all' OR audience IS NULL THEN 'all'
  WHEN audience ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN 'specific_tenants'
  ELSE 'specific_plans'
END,
targets = CASE
  WHEN audience = 'all' OR audience IS NULL THEN NULL
  ELSE to_jsonb(string_to_array(audience, ','))
END,
scheduled_at = COALESCE(active_from, scheduled_at),
expires_at = COALESCE(active_to, expires_at)
WHERE audience IS NOT NULL
  AND (target_type IS DISTINCT FROM CASE
    WHEN audience = 'all' OR audience IS NULL THEN 'all'
    WHEN audience ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN 'specific_tenants'
    ELSE 'specific_plans'
  END
  OR targets IS DISTINCT FROM CASE
    WHEN audience = 'all' OR audience IS NULL THEN NULL
    ELSE to_jsonb(string_to_array(audience, ','))
  END
  OR scheduled_at IS DISTINCT FROM COALESCE(active_from, scheduled_at)
  OR expires_at IS DISTINCT FROM COALESCE(active_to, expires_at));

-- ============================================================
-- 3. Update RPC to prefer new columns
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
  audience TEXT,
  active_from TIMESTAMPTZ,
  active_to TIMESTAMPTZ,
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
  v_now TIMESTAMPTZ;
BEGIN
  v_tenant_id := COALESCE(p_tenant_id, public.current_tenant_id());
  IF v_tenant_id IS NULL THEN
    RETURN;
  END IF;

  v_now := now();

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
    a.audience,
    a.active_from,
    a.active_to,
    a.created_by,
    a.created_at,
    a.updated_at
  FROM public.announcements a
  WHERE a.status = 'active'
    AND (COALESCE(a.active_from, a.scheduled_at) IS NULL OR COALESCE(a.active_from, a.scheduled_at) <= v_now)
    AND (COALESCE(a.active_to, a.expires_at) IS NULL OR COALESCE(a.active_to, a.expires_at) > v_now)
    AND (
      -- ponytail: prefer new audience/active columns; fallback to legacy target_type/targets only when audience is NULL.
      (a.audience IS NULL AND (
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
      ))
      OR a.audience = 'all'
      OR (
        a.audience ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        AND v_tenant_id = a.audience::UUID
      )
      OR (
        v_plan IS NOT NULL
        AND a.audience = v_plan
      )
    )
  ORDER BY a.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_current_announcements_for_tenant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_announcements_for_tenant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_announcements_for_tenant(UUID) TO service_role;
