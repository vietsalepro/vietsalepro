-- Sub-Phase 7.1: Admin cron jobs — billing reminders & audit log retention.
-- ponytail: cron schedules gọi SQL wrapper; wrapper dùng pg_net gọi Edge Function
-- cron-admin-tasks để xử lý logic nghiệp vụ. Config URL/secret trong system_settings.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- 1. Cron job logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL CHECK (job_name IN ('billing_reminders', 'audit_log_cleanup')),
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  retry_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cron_job_logs_name_started
  ON public.cron_job_logs(job_name, started_at DESC);

ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cron_job_logs_select_admin ON public.cron_job_logs;
CREATE POLICY cron_job_logs_select_admin
  ON public.cron_job_logs
  FOR SELECT
  TO authenticated
  USING (public.is_system_admin());

GRANT SELECT, INSERT, UPDATE ON public.cron_job_logs TO service_role;
REVOKE ALL ON public.cron_job_logs FROM PUBLIC;

-- ============================================================
-- 2. Billing reminder logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.billing_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('expiring', 'expired')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.billing_reminder_logs
  ADD COLUMN IF NOT EXISTS created_date DATE
  GENERATED ALWAYS AS ((created_at AT TIME ZONE 'UTC')::date) STORED;

DROP INDEX IF EXISTS idx_billing_reminder_logs_tenant_type_date;
CREATE UNIQUE INDEX idx_billing_reminder_logs_tenant_type_date
  ON public.billing_reminder_logs(tenant_id, reminder_type, created_date);

CREATE INDEX IF NOT EXISTS idx_billing_reminder_logs_status ON public.billing_reminder_logs(status);

ALTER TABLE public.billing_reminder_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_reminder_logs_select_admin ON public.billing_reminder_logs;
CREATE POLICY billing_reminder_logs_select_admin
  ON public.billing_reminder_logs
  FOR SELECT
  TO authenticated
  USING (public.is_system_admin());

GRANT SELECT, INSERT, UPDATE ON public.billing_reminder_logs TO service_role;
REVOKE ALL ON public.billing_reminder_logs FROM PUBLIC;

-- ============================================================
-- 3. Default email template for billing reminders
-- ============================================================
INSERT INTO public.email_templates (key, name, description, subject, body_html, variables, is_default, is_active)
VALUES (
  'billing_reminder',
  'Nhắc gia hạn dịch vụ',
  'Email nhắc tenant gia hạn subscription sắp hết hạn',
  '[{{brand_name}}] Gia hạn dịch vụ cho cửa hàng {{tenant_name}}',
  '<p>Kính gửi quý khách,</p>
<p>Subscription của cửa hàng <strong>{{tenant_name}}</strong> ({{tenant_subdomain}}) sẽ hết hạn vào <strong>{{expires_at}}</strong>.</p>
<p>Vui lòng gia hạn để tránh gián đoạn dịch vụ.</p>
<p>Trân trọng,<br/>{{brand_name}}</p>',
  '["brand_name", "tenant_name", "tenant_subdomain", "expires_at"]'::jsonb,
  false,
  true
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 4. Config helper
-- ============================================================
DROP FUNCTION IF EXISTS public.get_admin_cron_config();

CREATE OR REPLACE FUNCTION public.get_admin_cron_config()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'UTC'
AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value FROM public.system_settings WHERE key = 'admin_cron_config';
  IF v_value IS NULL THEN
    RETURN jsonb_build_object(
      'enabled', true,
      'function_url', '',
      'cron_secret', ''
    );
  END IF;
  RETURN v_value;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_cron_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_cron_config() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_cron_config() TO service_role;

-- ============================================================
-- 5. SSRF guard for cron-admin-tasks URL
-- ============================================================
DROP FUNCTION IF EXISTS public.is_valid_admin_cron_url(TEXT);

CREATE OR REPLACE FUNCTION public.is_valid_admin_cron_url(p_url TEXT)
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
  IF p_url ~ '(^https?://)(localhost|127\.0\.0\.1|::1|0\.0\.0\.0|169\.254\.169\.254|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)' THEN
    RETURN false;
  END IF;
  v_host := substring(p_url from '^https://([^/:]+)');
  IF v_host IS NULL THEN
    RETURN false;
  END IF;
  RETURN v_host ~ '(\.supabase\.co|\.vercel\.app|vietsalepro\.com)$';
END;
$$;

REVOKE ALL ON FUNCTION public.is_valid_admin_cron_url(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_valid_admin_cron_url(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_admin_cron_url(TEXT) TO service_role;

-- ============================================================
-- 6. SQL wrappers gọi Edge Function cron-admin-tasks
-- ============================================================
DROP FUNCTION IF EXISTS public.run_admin_cron_billing_reminders();
DROP FUNCTION IF EXISTS public.run_admin_cron_audit_cleanup();

CREATE OR REPLACE FUNCTION public.run_admin_cron_billing_reminders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'UTC'
AS $$
DECLARE
  v_config JSONB;
  v_url TEXT;
  v_key TEXT;
BEGIN
  v_config := public.get_admin_cron_config();
  IF NOT COALESCE((v_config->>'enabled')::BOOLEAN, true) THEN
    RETURN jsonb_build_object('queued', false, 'error', 'cron disabled');
  END IF;

  v_url := COALESCE(v_config->>'function_url', '');
  v_key := COALESCE(v_config->>'cron_secret', '');

  IF v_url = '' OR v_key = '' THEN
    RETURN jsonb_build_object('queued', false, 'error', 'function_url hoặc cron_secret chưa được cấu hình');
  END IF;
  IF NOT public.is_valid_admin_cron_url(v_url) THEN
    RETURN jsonb_build_object('queued', false, 'error', 'function_url không hợp lệ');
  END IF;

  PERFORM net.http_post(
    url := v_url,
    body := jsonb_build_object('job', 'billing_reminders'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Secret', v_key
    ),
    timeout_milliseconds := 30000
  );

  RETURN jsonb_build_object('queued', true, 'job', 'billing_reminders');
END;
$$;

REVOKE ALL ON FUNCTION public.run_admin_cron_billing_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_admin_cron_billing_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_admin_cron_billing_reminders() TO service_role;

CREATE OR REPLACE FUNCTION public.run_admin_cron_audit_cleanup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'UTC'
AS $$
DECLARE
  v_config JSONB;
  v_url TEXT;
  v_key TEXT;
BEGIN
  v_config := public.get_admin_cron_config();
  IF NOT COALESCE((v_config->>'enabled')::BOOLEAN, true) THEN
    RETURN jsonb_build_object('queued', false, 'error', 'cron disabled');
  END IF;

  v_url := COALESCE(v_config->>'function_url', '');
  v_key := COALESCE(v_config->>'cron_secret', '');

  IF v_url = '' OR v_key = '' THEN
    RETURN jsonb_build_object('queued', false, 'error', 'function_url hoặc cron_secret chưa được cấu hình');
  END IF;
  IF NOT public.is_valid_admin_cron_url(v_url) THEN
    RETURN jsonb_build_object('queued', false, 'error', 'function_url không hợp lệ');
  END IF;

  PERFORM net.http_post(
    url := v_url,
    body := jsonb_build_object('job', 'audit_cleanup'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Secret', v_key
    ),
    timeout_milliseconds := 30000
  );

  RETURN jsonb_build_object('queued', true, 'job', 'audit_cleanup');
END;
$$;

REVOKE ALL ON FUNCTION public.run_admin_cron_audit_cleanup() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_admin_cron_audit_cleanup() TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_admin_cron_audit_cleanup() TO service_role;

-- ============================================================
-- 7. Cron schedules
-- ============================================================
-- Billing reminders: 08:00 UTC daily.
SELECT cron.schedule('admin-billing-reminders', '0 8 * * *', 'SELECT public.run_admin_cron_billing_reminders();');
-- Audit log cleanup: 02:00 UTC every Sunday.
SELECT cron.schedule('admin-audit-cleanup', '0 2 * * 0', 'SELECT public.run_admin_cron_audit_cleanup();');
