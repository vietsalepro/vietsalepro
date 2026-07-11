-- Sub-Phase 7.1: Admin realtime events broadcast.
-- ponytail: dùng Postgres Changes của Supabase Realtime trên bảng admin_events;
-- RLS đảm bảo chỉ system admin được SELECT/INSERT. Edge functions dùng service_role
-- để ghi event từ backend (cron jobs, security, billing).

-- ============================================================
-- 1. Admin events table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('payment_failed', 'rls_violation', 'system_error', 'cron_job_failed', 'billing_reminder_sent')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_events_created_at ON public.admin_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_events_type ON public.admin_events(type);

ALTER TABLE public.admin_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_events_select_admin ON public.admin_events;
CREATE POLICY admin_events_select_admin
  ON public.admin_events
  FOR SELECT
  TO authenticated
  USING (public.is_system_admin());

DROP POLICY IF EXISTS admin_events_insert_admin ON public.admin_events;
CREATE POLICY admin_events_insert_admin
  ON public.admin_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_system_admin());

-- Edge functions / cron insert events with service role.
GRANT SELECT, INSERT ON public.admin_events TO service_role;
REVOKE ALL ON public.admin_events FROM PUBLIC;

-- ============================================================
-- 2. Add admin_events to realtime publication
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'admin_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_events;
  END IF;
END
$$;
