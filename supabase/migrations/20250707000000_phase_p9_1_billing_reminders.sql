-- P9.1: Billing reminders T-7/T-3/T-1 + email template billing (reuse Resend P7.5).
-- ponytail: scheduler logic lives in SQL; actual email sent via send-billing-email Edge Function.
--           Config stored in system_settings; logs prevent duplicate reminders. Asia/Ho_Chi_Minh time.

-- ============================================================
-- 0. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 1. Reminder log table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoice_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  milestone TEXT NOT NULL CHECK (milestone IN ('T-7', 'T-3', 'T-1')),
  due_date DATE NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_reminder_logs_invoice_milestone
  ON public.invoice_reminder_logs(invoice_id, milestone);

CREATE INDEX IF NOT EXISTS idx_invoice_reminder_logs_due_date
  ON public.invoice_reminder_logs(due_date);

ALTER TABLE public.invoice_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Only system admins can read reminder logs.
DROP POLICY IF EXISTS invoice_reminder_logs_select_admin ON public.invoice_reminder_logs;
CREATE POLICY invoice_reminder_logs_select_admin
  ON public.invoice_reminder_logs
  FOR SELECT
  TO authenticated
  USING (public.is_system_admin());

DROP POLICY IF EXISTS invoice_reminder_logs_insert_service ON public.invoice_reminder_logs;
CREATE POLICY invoice_reminder_logs_insert_service
  ON public.invoice_reminder_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_system_admin());

REVOKE ALL ON public.invoice_reminder_logs FROM PUBLIC;

-- Edge Function uses service_role to upsert reminder logs.
GRANT SELECT, INSERT, UPDATE ON public.invoice_reminder_logs TO service_role;

-- ============================================================
-- 2. Config helpers
-- ============================================================
DROP FUNCTION IF EXISTS public.get_billing_reminder_config();
DROP FUNCTION IF EXISTS public.set_billing_reminder_config(BOOLEAN, INT[], TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_pending_billing_reminders();
DROP FUNCTION IF EXISTS public.send_billing_reminders();

CREATE OR REPLACE FUNCTION public.get_billing_reminder_config()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value
  FROM public.system_settings
  WHERE key = 'billing_reminder_config';

  IF v_value IS NULL THEN
    RETURN jsonb_build_object(
      'enabled', true,
      'milestones', jsonb_build_array(7, 3, 1),
      'send_time', '09:00',
      'function_url', '',
      'reminder_secret', ''
    );
  END IF;

  RETURN v_value;
END;
$$;

REVOKE ALL ON FUNCTION public.get_billing_reminder_config() FROM PUBLIC;
-- P9.1.1: frontend Supabase client uses authenticated role; must grant EXECUTE after revoking PUBLIC.
GRANT EXECUTE ON FUNCTION public.get_billing_reminder_config() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_billing_reminder_config() TO service_role;

-- ponytail: SSRF guard for the Edge Function URL called by pg_net.
CREATE OR REPLACE FUNCTION public.is_valid_billing_reminder_url(p_url TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_host TEXT;
BEGIN
  IF p_url IS NULL OR p_url = '' THEN
    RETURN false;
  END IF;

  IF NOT p_url ~ '^https://' THEN
    RETURN false;
  END IF;

  -- Block localhost, loopback, metadata endpoint and private IP ranges.
  IF p_url ~ '(^https?://)(localhost|127\.0\.0\.1|::1|0\.0\.0\.0|169\.254\.169\.254|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)' THEN
    RETURN false;
  END IF;

  v_host := substring(p_url from '^https://([^/:]+)');
  IF v_host IS NULL THEN
    RETURN false;
  END IF;

  -- Whitelist: Supabase Edge Functions, Vercel, and project domains.
  RETURN v_host ~ '(\.supabase\.co|\.vercel\.app|vietsalepro\.com)$';
END;
$$;

REVOKE ALL ON FUNCTION public.is_valid_billing_reminder_url(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_valid_billing_reminder_url(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_billing_reminder_url(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.set_billing_reminder_config(
  p_enabled BOOLEAN,
  p_milestones INT[],
  p_send_time TEXT DEFAULT '09:00',
  p_function_url TEXT DEFAULT '',
  p_reminder_secret TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_value JSONB;
  v_milestones INT[];
BEGIN
  -- Validate milestones: positive days, deduplicate, sorted, non-empty.
  v_milestones := ARRAY(SELECT DISTINCT unnest(p_milestones) ORDER BY 1);
  IF array_length(v_milestones, 1) IS NULL OR array_length(v_milestones, 1) = 0 OR EXISTS (SELECT 1 FROM unnest(v_milestones) x WHERE x <= 0) THEN
    RAISE EXCEPTION 'milestones phải là mảng số nguyên dương không rỗng';
  END IF;

  IF COALESCE(p_function_url, '') <> '' AND NOT public.is_valid_billing_reminder_url(p_function_url) THEN
    RAISE EXCEPTION 'function_url không hợp lệ hoặc không nằm trong whitelist';
  END IF;

  v_value := jsonb_build_object(
    'enabled', p_enabled,
    'milestones', to_jsonb(v_milestones),
    'send_time', COALESCE(p_send_time, '09:00'),
    'function_url', COALESCE(p_function_url, ''),
    'reminder_secret', COALESCE(p_reminder_secret, '')
  );

  INSERT INTO public.system_settings (key, value)
  VALUES ('billing_reminder_config', v_value)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

  RETURN v_value;
END;
$$;

REVOKE ALL ON FUNCTION public.set_billing_reminder_config(BOOLEAN, INT[], TEXT, TEXT, TEXT) FROM PUBLIC;
-- P9.1.2: allow authenticated admin dashboard to update reminder config.
GRANT EXECUTE ON FUNCTION public.set_billing_reminder_config(BOOLEAN, INT[], TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_billing_reminder_config(BOOLEAN, INT[], TEXT, TEXT, TEXT) TO service_role;

-- ============================================================
-- 3. Scheduler: list pending reminders
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_pending_billing_reminders()
RETURNS TABLE (
  invoice_id UUID,
  milestone TEXT,
  due_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_config JSONB;
  v_milestones INT[];
  v_milestone INT;
  v_target DATE;
BEGIN
  v_config := public.get_billing_reminder_config();
  IF NOT (v_config->>'enabled')::BOOLEAN THEN
    RETURN;
  END IF;

  v_milestones := ARRAY(SELECT jsonb_array_elements_text(v_config->'milestones')::INT);

  FOREACH v_milestone IN ARRAY v_milestones
  LOOP
    v_target := CURRENT_DATE + v_milestone;

    RETURN QUERY
    SELECT i.id AS invoice_id,
           ('T-' || v_milestone)::TEXT AS milestone,
           i.due_date::DATE AS due_date
    FROM public.invoices i
    JOIN public.tenants t ON t.id = i.tenant_id
    WHERE i.status = 'pending'
      AND i.due_date = v_target
      AND t.status NOT IN ('archived')
      -- Chưa gửi reminder mốc này cho hóa đơn này.
      AND NOT EXISTS (
        SELECT 1 FROM public.invoice_reminder_logs r
        WHERE r.invoice_id = i.id AND r.milestone = ('T-' || v_milestone)::TEXT
      );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.get_pending_billing_reminders() FROM PUBLIC;
-- P9.1.2: allow authenticated admin dashboard to list pending reminders.
GRANT EXECUTE ON FUNCTION public.get_pending_billing_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_billing_reminders() TO service_role;

-- ============================================================
-- 4. Scheduler: send reminders (async via pg_net -> send-billing-email)
-- ============================================================
CREATE OR REPLACE FUNCTION public.send_billing_reminders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_config JSONB;
  v_url TEXT;
  v_key TEXT;
  v_rec RECORD;
  v_body JSONB;
  v_sent INT := 0;
  v_skipped INT := 0;
BEGIN
  v_config := public.get_billing_reminder_config();
  v_url := COALESCE(v_config->>'function_url', '');
  v_key := COALESCE(v_config->>'reminder_secret', '');

  IF NOT (v_config->>'enabled')::BOOLEAN THEN
    RETURN jsonb_build_object('sent', 0, 'skipped', 0, 'error', 'reminder disabled');
  END IF;

  IF v_url = '' OR v_key = '' THEN
    RETURN jsonb_build_object('sent', 0, 'skipped', 0, 'error', 'function_url hoặc reminder_secret chưa được cấu hình');
  END IF;

  IF NOT public.is_valid_billing_reminder_url(v_url) THEN
    RETURN jsonb_build_object('sent', 0, 'skipped', 0, 'error', 'function_url không hợp lệ hoặc không nằm trong whitelist');
  END IF;

  FOR v_rec IN SELECT * FROM public.get_pending_billing_reminders()
  LOOP
    BEGIN
      -- Log the attempt immediately to avoid duplicate sends on retry.
      INSERT INTO public.invoice_reminder_logs (invoice_id, milestone, due_date, status)
      VALUES (v_rec.invoice_id, v_rec.milestone, v_rec.due_date, 'pending');

      v_body := jsonb_build_object(
        'invoice_id', v_rec.invoice_id,
        'type', 'reminder',
        'milestone', v_rec.milestone
      );

      -- Async call to send-billing-email Edge Function (reuses Resend P7.5).
      PERFORM net.http_post(
        url := v_url,
        body := v_body,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Internal-Secret', v_key
        ),
        timeout_milliseconds := 10000
      );

      v_sent := v_sent + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.invoice_reminder_logs
      SET status = 'failed', error = SQLERRM
      WHERE invoice_id = v_rec.invoice_id AND milestone = v_rec.milestone;
      v_skipped := v_skipped + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object('sent', v_sent, 'skipped', v_skipped, 'error', NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.send_billing_reminders() FROM PUBLIC;
-- P9.1.1: allow admin dashboard to trigger reminder send manually.
GRANT EXECUTE ON FUNCTION public.send_billing_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_billing_reminders() TO service_role;

-- ============================================================
-- 5. Cron job
-- ============================================================
-- ponytail: chạy hằng ngày lúc 09:00 Asia/Ho_Chi_Minh. Đổi schedule trong config nếu cần.
SELECT cron.schedule('billing-reminders-daily', '0 9 * * *', 'SELECT public.send_billing_reminders();');
