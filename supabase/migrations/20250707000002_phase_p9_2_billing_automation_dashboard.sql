-- P9.2: Billing automation dashboard
-- Dashboard trạng thái billing (sắp hết hạn/quá hạn, dunning) + log job chạy.
-- ponytail: idempotent; mỗi lần cron/manual gọi các hàm automation sẽ ghi log; dashboard chỉ đọc.

-- ============================================================
-- 1. Job log table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.billing_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER,
  records_affected INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_job_logs_run_at_idx ON public.billing_job_logs(run_at DESC);
CREATE INDEX IF NOT EXISTS billing_job_logs_job_name_idx ON public.billing_job_logs(job_name);

ALTER TABLE public.billing_job_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_job_logs_select_admin ON public.billing_job_logs;
CREATE POLICY billing_job_logs_select_admin
  ON public.billing_job_logs
  FOR SELECT
  TO authenticated
  USING (public.is_system_admin());

DROP POLICY IF EXISTS billing_job_logs_insert_service ON public.billing_job_logs;
CREATE POLICY billing_job_logs_insert_service
  ON public.billing_job_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_system_admin());

REVOKE ALL ON public.billing_job_logs FROM PUBLIC;

GRANT SELECT, INSERT ON public.billing_job_logs TO authenticated;
GRANT SELECT, INSERT ON public.billing_job_logs TO service_role;

-- ============================================================
-- 2. Helper: log a job run
-- ============================================================
DROP FUNCTION IF EXISTS public.log_billing_job(TEXT, TEXT, INTEGER, INTEGER, TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.log_billing_job(
  p_job_name TEXT,
  p_status TEXT,
  p_duration_ms INTEGER DEFAULT NULL,
  p_records_affected INTEGER DEFAULT 0,
  p_message TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS public.billing_job_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_log public.billing_job_logs;
BEGIN
  INSERT INTO public.billing_job_logs (
    job_name, status, run_at, duration_ms, records_affected, message, details
  ) VALUES (
    p_job_name, p_status, now(), p_duration_ms, COALESCE(p_records_affected, 0), p_message, p_details
  ) RETURNING * INTO v_log;
  RETURN v_log;
END;
$$;

REVOKE ALL ON FUNCTION public.log_billing_job(TEXT, TEXT, INTEGER, INTEGER, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_billing_job(TEXT, TEXT, INTEGER, INTEGER, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_billing_job(TEXT, TEXT, INTEGER, INTEGER, TEXT, JSONB) TO service_role;

-- ============================================================
-- 3. Re-create automation functions with logging
-- ============================================================

-- 3.1 Expire overdue invoices
DROP FUNCTION IF EXISTS public.expire_overdue_invoices();
CREATE OR REPLACE FUNCTION public.expire_overdue_invoices()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_expired_count INTEGER := 0;
  v_error TEXT;
BEGIN
  BEGIN
    WITH expired AS (
      UPDATE public.invoices
      SET status = 'expired',
          updated_at = now()
      WHERE status = 'pending'
        AND created_at < now() - INTERVAL '48 hours'
      RETURNING tenant_id
    )
    SELECT count(DISTINCT tenant_id) INTO v_expired_count FROM expired;

    UPDATE public.tenant_subscriptions s
    SET billing_status = 'overdue',
        updated_at = now()
    WHERE EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.tenant_id = s.tenant_id
        AND i.status = 'expired'
    )
      AND s.billing_status <> 'overdue';

    UPDATE public.tenants t
    SET status = 'read_only',
        updated_at = now()
    WHERE t.status IN ('active', 'trial')
      AND EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.tenant_id = t.id
          AND i.status = 'expired'
      );

    PERFORM public.log_billing_job(
      'expire_overdue_invoices',
      'success',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      v_expired_count,
      format('Đã hết hạn %s hóa đơn', v_expired_count),
      jsonb_build_object('expired_count', v_expired_count)
    );

    RETURN v_expired_count;
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    PERFORM public.log_billing_job(
      'expire_overdue_invoices',
      'failed',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      0,
      v_error,
      jsonb_build_object('error', v_error)
    );
    RAISE;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_overdue_invoices() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_overdue_invoices() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_overdue_invoices() TO service_role;

-- 3.2 Create renewal invoices
DROP FUNCTION IF EXISTS public.create_renewal_invoices(INT);
CREATE OR REPLACE FUNCTION public.create_renewal_invoices(p_days_before INT DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_sub RECORD;
  v_invoice_no TEXT;
  v_year INT;
  v_period_start DATE;
  v_period_end DATE;
  v_unit_price NUMERIC := 69000;
  v_created INTEGER := 0;
  v_invoice_id UUID;
  v_error TEXT;
BEGIN
  IF p_days_before < 0 THEN
    RAISE EXCEPTION 'p_days_before không hợp lệ';
  END IF;

  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INT;

  BEGIN
    FOR v_sub IN
      SELECT s.tenant_id, s.expires_at
      FROM public.tenant_subscriptions s
      JOIN public.tenants t ON t.id = s.tenant_id
      WHERE s.plan = 'vip'
        AND s.expires_at IS NOT NULL
        AND s.expires_at::DATE >= CURRENT_DATE
        AND s.expires_at::DATE <= CURRENT_DATE + p_days_before
        AND t.status NOT IN ('archived')
        AND NOT EXISTS (
          SELECT 1 FROM public.invoices i
          WHERE i.tenant_id = s.tenant_id
            AND i.status IN ('pending', 'overdue', 'expired')
        )
    LOOP
      v_period_start := v_sub.expires_at::DATE;
      v_period_end := (v_period_start + INTERVAL '1 month')::DATE;
      v_invoice_no := public.get_next_invoice_number(v_year);

      INSERT INTO public.invoices (
        tenant_id, invoice_no, status, issue_date, due_date,
        period_start, period_end, subtotal, discount, tax, total, amount_paid,
        notes, created_by
      ) VALUES (
        v_sub.tenant_id, v_invoice_no, 'pending', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days',
        v_period_start, v_period_end, v_unit_price, 0, 0, v_unit_price, 0,
        'Hóa đơn gia hạn tự động', NULL
      ) RETURNING id INTO v_invoice_id;

      INSERT INTO public.invoice_items (invoice_id, tenant_id, description, quantity, unit_price)
      VALUES (v_invoice_id, v_sub.tenant_id, 'Gói VIP - Tháng (gia hạn)', 1, v_unit_price);

      v_created := v_created + 1;
    END LOOP;

    PERFORM public.log_billing_job(
      'create_renewal_invoices',
      'success',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      v_created,
      format('Đã tạo %s hóa đơn gia hạn', v_created),
      jsonb_build_object('created_count', v_created, 'days_before', p_days_before)
    );

    RETURN v_created;
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    PERFORM public.log_billing_job(
      'create_renewal_invoices',
      'failed',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      0,
      v_error,
      jsonb_build_object('error', v_error)
    );
    RAISE;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.create_renewal_invoices(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_renewal_invoices(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_renewal_invoices(INT) TO service_role;

-- 3.3 Send billing reminders (P9.1)
DROP FUNCTION IF EXISTS public.send_billing_reminders();
CREATE OR REPLACE FUNCTION public.send_billing_reminders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_config JSONB;
  v_url TEXT;
  v_key TEXT;
  v_rec RECORD;
  v_body JSONB;
  v_sent INT := 0;
  v_skipped INT := 0;
  v_error TEXT;
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

  BEGIN
    FOR v_rec IN SELECT * FROM public.get_pending_billing_reminders()
    LOOP
      BEGIN
        INSERT INTO public.invoice_reminder_logs (invoice_id, milestone, due_date, status)
        VALUES (v_rec.invoice_id, v_rec.milestone, v_rec.due_date, 'pending');

        v_body := jsonb_build_object(
          'invoice_id', v_rec.invoice_id,
          'type', 'reminder',
          'milestone', v_rec.milestone
        );

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

    PERFORM public.log_billing_job(
      'send_billing_reminders',
      'success',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      v_sent,
      format('Đã lập lịch %s reminder, bỏ qua %s', v_sent, v_skipped),
      jsonb_build_object('sent', v_sent, 'skipped', v_skipped)
    );

    RETURN jsonb_build_object('sent', v_sent, 'skipped', v_skipped, 'error', NULL);
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    PERFORM public.log_billing_job(
      'send_billing_reminders',
      'failed',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      0,
      v_error,
      jsonb_build_object('error', v_error)
    );
    RETURN jsonb_build_object('sent', v_sent, 'skipped', v_skipped, 'error', v_error);
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.send_billing_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_billing_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_billing_reminders() TO service_role;

-- ============================================================
-- 4. Dashboard RPCs
-- ============================================================

DROP FUNCTION IF EXISTS public.get_billing_automation_status();
CREATE OR REPLACE FUNCTION public.get_billing_automation_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
DECLARE
  v_expiring_soon JSONB;
  v_overdue JSONB;
  v_dunning JSONB;
  v_pending_count INT;
BEGIN
  -- Sắp hết hạn: subscription có expires_at trong 7 ngày tới
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'subdomain', t.subdomain,
      'expires_at', s.expires_at,
      'days_remaining', GREATEST(0, (s.expires_at::DATE - CURRENT_DATE))
    )
  ), '[]'::JSONB)
  INTO v_expiring_soon
  FROM public.tenant_subscriptions s
  JOIN public.tenants t ON t.id = s.tenant_id
  WHERE s.expires_at IS NOT NULL
    AND s.expires_at::DATE >= CURRENT_DATE
    AND s.expires_at::DATE <= CURRENT_DATE + INTERVAL '7 days'
    AND t.status NOT IN ('archived');

  SELECT COUNT(*) INTO v_pending_count
  FROM public.invoices
  WHERE status IN ('pending', 'overdue', 'expired');

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'invoice_no', i.invoice_no,
      'tenant_id', i.tenant_id,
      'tenant_name', t.name,
      'tenant_subdomain', t.subdomain,
      'due_date', i.due_date,
      'status', i.status,
      'balance', i.balance
    )
  ), '[]'::JSONB)
  INTO v_overdue
  FROM public.invoices i
  JOIN public.tenants t ON t.id = i.tenant_id
  WHERE i.status IN ('overdue', 'expired')
    AND t.status NOT IN ('archived');

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'subdomain', t.subdomain,
      'status', t.status,
      'billing_status', s.billing_status
    )
  ), '[]'::JSONB)
  INTO v_dunning
  FROM public.tenants t
  JOIN public.tenant_subscriptions s ON s.tenant_id = t.id
  WHERE t.status = 'read_only'
    OR s.billing_status = 'overdue';

  RETURN jsonb_build_object(
    'expiring_soon_count', COALESCE(jsonb_array_length(v_expiring_soon), 0),
    'expiring_soon', v_expiring_soon,
    'pending_invoice_count', v_pending_count,
    'overdue_invoice_count', COALESCE(jsonb_array_length(v_overdue), 0),
    'overdue_invoices', v_overdue,
    'dunning_tenant_count', COALESCE(jsonb_array_length(v_dunning), 0),
    'dunning_tenants', v_dunning
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_billing_automation_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_billing_automation_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_billing_automation_status() TO service_role;

DROP FUNCTION IF EXISTS public.get_billing_job_logs(INT);
CREATE OR REPLACE FUNCTION public.get_billing_job_logs(p_limit INT DEFAULT 100)
RETURNS TABLE (
  id UUID,
  job_name TEXT,
  status TEXT,
  run_at TIMESTAMPTZ,
  duration_ms INTEGER,
  records_affected INTEGER,
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'Asia/Ho_Chi_Minh'
AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.job_name, l.status, l.run_at, l.duration_ms, l.records_affected, l.message, l.details, l.created_at
  FROM public.billing_job_logs l
  ORDER BY l.run_at DESC
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_billing_job_logs(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_billing_job_logs(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_billing_job_logs(INT) TO service_role;
