-- P12.3: Admin dashboard — Notification log + in-app messages
-- Bảng notification_logs + RLS + RPC gửi/lấy/đánh dấu đã đọc.
-- ponytail: một bảng làm cả log và nội dung tin nhắn; tenant chỉ thấy
-- message gửi đến mình, admin thấy toàn bộ log.

-- ============================================================
-- 1. Bảng notification_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT NULL,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_logs_tenant_id_idx ON public.notification_logs(tenant_id);
CREATE INDEX IF NOT EXISTS notification_logs_channel_idx ON public.notification_logs(channel);
CREATE INDEX IF NOT EXISTS notification_logs_status_idx ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS notification_logs_created_at_idx ON public.notification_logs(created_at DESC);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_logs' AND policyname = 'notification_logs_select_admin'
  ) THEN
    CREATE POLICY "notification_logs_select_admin" ON public.notification_logs FOR SELECT TO authenticated
      USING (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_logs' AND policyname = 'notification_logs_select_tenant'
  ) THEN
    CREATE POLICY "notification_logs_select_tenant" ON public.notification_logs FOR SELECT TO authenticated
      USING (public.is_tenant_member(tenant_id) AND tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_logs' AND policyname = 'notification_logs_insert_admin'
  ) THEN
    CREATE POLICY "notification_logs_insert_admin" ON public.notification_logs FOR INSERT TO authenticated
      WITH CHECK (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_logs' AND policyname = 'notification_logs_update_admin'
  ) THEN
    CREATE POLICY "notification_logs_update_admin" ON public.notification_logs FOR UPDATE TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_logs' AND policyname = 'notification_logs_delete_admin'
  ) THEN
    CREATE POLICY "notification_logs_delete_admin" ON public.notification_logs FOR DELETE TO authenticated
      USING (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 2. Trigger cập nhật updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_notification_log_updated_at()
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
    WHERE tgname = 'update_notification_logs_updated_at' AND tgrelid = 'public.notification_logs'::regclass
  ) THEN
    CREATE TRIGGER update_notification_logs_updated_at
      BEFORE UPDATE ON public.notification_logs
      FOR EACH ROW
      EXECUTE FUNCTION public.update_notification_log_updated_at();
  END IF;
END $$;

-- ============================================================
-- 3. RPC: gửi in-app message (admin)
-- ============================================================

DROP FUNCTION IF EXISTS public.send_in_app_message(UUID, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.send_in_app_message(
  p_tenant_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS public.notification_logs
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_row public.notification_logs;
BEGIN
  INSERT INTO public.notification_logs (
    tenant_id,
    channel,
    title,
    content,
    status,
    metadata,
    sent_by
  ) VALUES (
    p_tenant_id,
    'in_app',
    p_title,
    p_content,
    'sent',
    p_metadata,
    auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.send_in_app_message(UUID, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_in_app_message(UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_in_app_message(UUID, TEXT, TEXT, JSONB) TO service_role;

-- ============================================================
-- 4. RPC: lấy in-app messages cho tenant
-- ============================================================

DROP FUNCTION IF EXISTS public.get_in_app_messages_for_tenant(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.get_in_app_messages_for_tenant(
  p_tenant_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  channel TEXT,
  title TEXT,
  content TEXT,
  status TEXT,
  error_message TEXT,
  metadata JSONB,
  sent_by UUID,
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
BEGIN
  v_tenant_id := COALESCE(p_tenant_id, public.current_tenant_id());
  IF v_tenant_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    n.id,
    n.tenant_id,
    n.channel,
    n.title,
    n.content,
    n.status,
    n.error_message,
    n.metadata,
    n.sent_by,
    n.created_at,
    n.updated_at
  FROM public.notification_logs n
  WHERE n.tenant_id = v_tenant_id
    AND n.channel = 'in_app'
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.get_in_app_messages_for_tenant(UUID, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_in_app_messages_for_tenant(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_in_app_messages_for_tenant(UUID, INTEGER, INTEGER) TO service_role;

-- ============================================================
-- 5. RPC: đánh dấu in-app message đã đọc (tenant)
-- ============================================================

DROP FUNCTION IF EXISTS public.mark_in_app_message_read(UUID, UUID);

CREATE OR REPLACE FUNCTION public.mark_in_app_message_read(
  p_log_id UUID,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := COALESCE(p_tenant_id, public.current_tenant_id());
  IF v_tenant_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.notification_logs
  SET status = 'read',
      updated_at = now()
  WHERE id = p_log_id
    AND tenant_id = v_tenant_id
    AND channel = 'in_app'
    AND status <> 'read';

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_in_app_message_read(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_in_app_message_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_in_app_message_read(UUID, UUID) TO service_role;
