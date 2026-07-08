-- P17.4: Admin dashboard — Fraud detection + data retention policy + cron.
-- ponytail: heuristic đơn giản dựa trên registration events; nâng cấp bằng ML/geo nếu cần.

-- ============================================================
-- 1. Schema: tenant registration events
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tenant_registration_events (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  email_domain TEXT GENERATED ALWAYS AS (split_part(email, '@', 2)) STORED,
  ip_address INET,
  user_agent TEXT,
  creator_id UUID DEFAULT auth.uid(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tre_tenant_id ON public.tenant_registration_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tre_owner_user_id ON public.tenant_registration_events(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tre_email_domain ON public.tenant_registration_events(email_domain);
CREATE INDEX IF NOT EXISTS idx_tre_ip_address ON public.tenant_registration_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_tre_created_at ON public.tenant_registration_events(created_at DESC);

ALTER TABLE public.tenant_registration_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tenant_registration_events' AND policyname = 'tre_system_admin_select'
  ) THEN
    CREATE POLICY "tre_system_admin_select"
      ON public.tenant_registration_events FOR SELECT TO authenticated
      USING (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tenant_registration_events' AND policyname = 'tre_system_admin_all'
  ) THEN
    CREATE POLICY "tre_system_admin_all"
      ON public.tenant_registration_events FOR ALL TO authenticated
      USING (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 2. Trigger: ghi registration event khi tạo tenant
-- SECURITY DEFINER để đọc auth.users.email và insert dù có RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION public.insert_tenant_registration_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT au.email INTO v_email
  FROM auth.users au
  WHERE au.id = NEW.owner_id;

  INSERT INTO public.tenant_registration_events (
    tenant_id, owner_user_id, email, creator_id
  ) VALUES (
    NEW.id,
    NEW.owner_id,
    v_email,
    auth.uid()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenant_registration_event_trigger ON public.tenants;

CREATE TRIGGER tenant_registration_event_trigger
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.insert_tenant_registration_event();

-- ============================================================
-- 3. Schema: fraud queue
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fraud_queue (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('ip_burst', 'email_domain_burst', 'owner_burst')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  target_value TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  event_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  resolver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fq_status ON public.fraud_queue(status);
CREATE INDEX IF NOT EXISTS idx_fq_severity ON public.fraud_queue(severity);
CREATE INDEX IF NOT EXISTS idx_fq_created_at ON public.fraud_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fq_type_target ON public.fraud_queue(type, target_value);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fq_active_type_target
  ON public.fraud_queue(type, target_value)
  WHERE status IN ('open', 'reviewing');

ALTER TABLE public.fraud_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fraud_queue' AND policyname = 'fraud_queue_system_admin_select'
  ) THEN
    CREATE POLICY "fraud_queue_system_admin_select"
      ON public.fraud_queue FOR SELECT TO authenticated
      USING (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fraud_queue' AND policyname = 'fraud_queue_system_admin_write'
  ) THEN
    CREATE POLICY "fraud_queue_system_admin_write"
      ON public.fraud_queue FOR ALL TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 4. Seed default configs
-- ============================================================

INSERT INTO public.system_settings (key, value) VALUES
  ('fraud_detection_config', jsonb_build_object(
    'enabled', true,
    'ip_window_hours', 24,
    'ip_max', 5,
    'email_domain_window_hours', 24,
    'email_domain_max', 10,
    'owner_window_hours', 24,
    'owner_max', 20
  )),
  ('data_retention_config', jsonb_build_object(
    'retention_days_orders', 730,
    'retention_days_processed_operations', 90,
    'retention_days_rate_limit_logs', 1,
    'retention_days_fraud_queue', 90,
    'retention_days_registration_events', 365,
    'cron_schedule', '0 3 * * *'
  ))
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 5. RPC: cấu hình fraud detection
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_fraud_detection_config()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_config JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem cấu hình fraud detection' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT value INTO v_config FROM public.system_settings WHERE key = 'fraud_detection_config';

  RETURN json_build_object(
    'enabled', COALESCE((v_config->>'enabled')::BOOLEAN, true),
    'ipWindowHours', COALESCE((v_config->>'ip_window_hours')::INTEGER, 24),
    'ipMax', COALESCE((v_config->>'ip_max')::INTEGER, 5),
    'emailDomainWindowHours', COALESCE((v_config->>'email_domain_window_hours')::INTEGER, 24),
    'emailDomainMax', COALESCE((v_config->>'email_domain_max')::INTEGER, 10),
    'ownerWindowHours', COALESCE((v_config->>'owner_window_hours')::INTEGER, 24),
    'ownerMax', COALESCE((v_config->>'owner_max')::INTEGER, 20)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_fraud_detection_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_fraud_detection_config() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fraud_detection_config() TO service_role;

CREATE OR REPLACE FUNCTION public.set_fraud_detection_config(
  p_enabled BOOLEAN DEFAULT true,
  p_ip_window_hours INTEGER DEFAULT 24,
  p_ip_max INTEGER DEFAULT 5,
  p_email_domain_window_hours INTEGER DEFAULT 24,
  p_email_domain_max INTEGER DEFAULT 10,
  p_owner_window_hours INTEGER DEFAULT 24,
  p_owner_max INTEGER DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_config JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật cấu hình fraud detection' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_ip_window_hours <= 0 OR p_email_domain_window_hours <= 0 OR p_owner_window_hours <= 0 THEN
    RAISE EXCEPTION 'Khoảng thời gian phải lớn hơn 0';
  END IF;

  IF p_ip_max <= 0 OR p_email_domain_max <= 0 OR p_owner_max <= 0 THEN
    RAISE EXCEPTION 'Ngưỡng phải lớn hơn 0';
  END IF;

  v_config := jsonb_build_object(
    'enabled', COALESCE(p_enabled, true),
    'ip_window_hours', p_ip_window_hours,
    'ip_max', p_ip_max,
    'email_domain_window_hours', p_email_domain_window_hours,
    'email_domain_max', p_email_domain_max,
    'owner_window_hours', p_owner_window_hours,
    'owner_max', p_owner_max
  );

  INSERT INTO public.system_settings (key, value)
  VALUES ('fraud_detection_config', v_config)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now(),
        updated_by = auth.uid()
  RETURNING value INTO v_config;

  -- ponytail: reschedule cron nếu extension có sẵn; nếu không thì bỏ qua.
  BEGIN
    PERFORM cron.schedule('fraud-detection-hourly', '0 * * * *', 'SELECT public.run_fraud_detection();');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN public.get_fraud_detection_config();
END;
$$;

REVOKE ALL ON FUNCTION public.set_fraud_detection_config(BOOLEAN, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_fraud_detection_config(BOOLEAN, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_fraud_detection_config(BOOLEAN, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO service_role;

-- ============================================================
-- 6. RPC: chạy heuristic fraud detection
-- ============================================================

CREATE OR REPLACE FUNCTION public.run_fraud_detection()
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_config JSONB;
  v_enabled BOOLEAN;
  v_ip_window_hours INT;
  v_ip_max INT;
  v_domain_window_hours INT;
  v_domain_max INT;
  v_owner_window_hours INT;
  v_owner_max INT;
  v_inserted INT := 0;
  v_updated INT := 0;
  v_rec RECORD;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được chạy fraud detection' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT value INTO v_config FROM public.system_settings WHERE key = 'fraud_detection_config';

  v_enabled := COALESCE((v_config->>'enabled')::BOOLEAN, true);
  v_ip_window_hours := COALESCE((v_config->>'ip_window_hours')::INTEGER, 24);
  v_ip_max := COALESCE((v_config->>'ip_max')::INTEGER, 5);
  v_domain_window_hours := COALESCE((v_config->>'email_domain_window_hours')::INTEGER, 24);
  v_domain_max := COALESCE((v_config->>'email_domain_max')::INTEGER, 10);
  v_owner_window_hours := COALESCE((v_config->>'owner_window_hours')::INTEGER, 24);
  v_owner_max := COALESCE((v_config->>'owner_max')::INTEGER, 20);

  IF NOT v_enabled THEN
    RETURN json_build_object('enabled', false, 'inserted', 0, 'updated', 0);
  END IF;

  -- Rule 1: nhiều tenant từ cùng IP trong khoảng thời gian.
  FOR v_rec IN
    SELECT
      e.ip_address AS target,
      COUNT(*) AS cnt,
      MIN(e.created_at) AS w_start,
      MAX(e.created_at) AS w_end
    FROM public.tenant_registration_events e
    WHERE e.created_at >= now() - make_interval(hours => v_ip_window_hours)
      AND e.ip_address IS NOT NULL
    GROUP BY e.ip_address
    HAVING COUNT(*) >= v_ip_max
  LOOP
    UPDATE public.fraud_queue
    SET event_count = v_rec.cnt,
        window_start = LEAST(window_start, v_rec.w_start),
        window_end = GREATEST(window_end, v_rec.w_end),
        details = jsonb_build_object(
          'ip_address', v_rec.target::TEXT,
          'event_count', v_rec.cnt,
          'window_hours', v_ip_window_hours
        ),
        updated_at = now()
    WHERE type = 'ip_burst'
      AND target_value = v_rec.target::TEXT
      AND status IN ('open', 'reviewing');

    IF NOT FOUND THEN
      INSERT INTO public.fraud_queue (
        type, severity, target_value, event_count, window_start, window_end, details
      ) VALUES (
        'ip_burst', 'high', v_rec.target::TEXT, v_rec.cnt, v_rec.w_start, v_rec.w_end,
        jsonb_build_object(
          'ip_address', v_rec.target::TEXT,
          'event_count', v_rec.cnt,
          'window_hours', v_ip_window_hours
        )
      );
      v_inserted := v_inserted + 1;
    ELSE
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  -- Rule 2: nhiều tenant dùng cùng email domain trong khoảng thời gian.
  FOR v_rec IN
    SELECT
      e.email_domain AS target,
      COUNT(*) AS cnt,
      MIN(e.created_at) AS w_start,
      MAX(e.created_at) AS w_end
    FROM public.tenant_registration_events e
    WHERE e.created_at >= now() - make_interval(hours => v_domain_window_hours)
      AND e.email_domain IS NOT NULL
      AND e.email_domain <> ''
    GROUP BY e.email_domain
    HAVING COUNT(*) >= v_domain_max
  LOOP
    UPDATE public.fraud_queue
    SET event_count = v_rec.cnt,
        window_start = LEAST(window_start, v_rec.w_start),
        window_end = GREATEST(window_end, v_rec.w_end),
        details = jsonb_build_object(
          'email_domain', v_rec.target,
          'event_count', v_rec.cnt,
          'window_hours', v_domain_window_hours
        ),
        updated_at = now()
    WHERE type = 'email_domain_burst'
      AND target_value = v_rec.target
      AND status IN ('open', 'reviewing');

    IF NOT FOUND THEN
      INSERT INTO public.fraud_queue (
        type, severity, target_value, event_count, window_start, window_end, details
      ) VALUES (
        'email_domain_burst', 'medium', v_rec.target, v_rec.cnt, v_rec.w_start, v_rec.w_end,
        jsonb_build_object(
          'email_domain', v_rec.target,
          'event_count', v_rec.cnt,
          'window_hours', v_domain_window_hours
        )
      );
      v_inserted := v_inserted + 1;
    ELSE
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  -- Rule 3: cùng owner_user_id tạo nhiều tenant trong khoảng thời gian.
  FOR v_rec IN
    SELECT
      e.owner_user_id::TEXT AS target,
      COUNT(*) AS cnt,
      MIN(e.created_at) AS w_start,
      MAX(e.created_at) AS w_end
    FROM public.tenant_registration_events e
    WHERE e.created_at >= now() - make_interval(hours => v_owner_window_hours)
      AND e.owner_user_id IS NOT NULL
    GROUP BY e.owner_user_id
    HAVING COUNT(*) >= v_owner_max
  LOOP
    UPDATE public.fraud_queue
    SET event_count = v_rec.cnt,
        window_start = LEAST(window_start, v_rec.w_start),
        window_end = GREATEST(window_end, v_rec.w_end),
        details = jsonb_build_object(
          'owner_user_id', v_rec.target,
          'event_count', v_rec.cnt,
          'window_hours', v_owner_window_hours
        ),
        updated_at = now()
    WHERE type = 'owner_burst'
      AND target_value = v_rec.target
      AND status IN ('open', 'reviewing');

    IF NOT FOUND THEN
      INSERT INTO public.fraud_queue (
        type, severity, target_value, event_count, window_start, window_end, details
      ) VALUES (
        'owner_burst', 'low', v_rec.target, v_rec.cnt, v_rec.w_start, v_rec.w_end,
        jsonb_build_object(
          'owner_user_id', v_rec.target,
          'event_count', v_rec.cnt,
          'window_hours', v_owner_window_hours
        )
      );
      v_inserted := v_inserted + 1;
    ELSE
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  RETURN json_build_object('enabled', true, 'inserted', v_inserted, 'updated', v_updated);
END;
$$;

REVOKE ALL ON FUNCTION public.run_fraud_detection() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_fraud_detection() TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_fraud_detection() TO service_role;

-- ============================================================
-- 7. RPC: fraud queue CRUD
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_fraud_queue(
  p_status TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem fraud queue' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.fraud_queue q
  WHERE (p_status IS NULL OR q.status = p_status)
    AND (p_severity IS NULL OR q.severity = p_severity);

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        q.id,
        q.type,
        q.severity,
        q.status,
        q.target_value,
        q.event_count,
        q.details,
        q.window_start,
        q.window_end,
        q.notes,
        q.created_at,
        q.updated_at
      FROM public.fraud_queue q
      WHERE (p_status IS NULL OR q.status = p_status)
        AND (p_severity IS NULL OR q.severity = p_severity)
      ORDER BY
        CASE q.severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
        q.created_at DESC
      LIMIT COALESCE(p_limit, 50)
      OFFSET COALESCE(p_offset, 0)
    ) t
  );

  RETURN json_build_object('data', v_result, 'count', COALESCE(v_total, 0));
END;
$$;

REVOKE ALL ON FUNCTION public.get_fraud_queue(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_fraud_queue(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fraud_queue(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.get_fraud_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_status_counts JSON;
  v_severity_counts JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem fraud stats' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_status_counts := (
    SELECT COALESCE(json_object_agg(status, cnt), '{}'::json)
    FROM (
      SELECT status, COUNT(*) AS cnt
      FROM public.fraud_queue
      GROUP BY status
    ) s
  );

  v_severity_counts := (
    SELECT COALESCE(json_object_agg(severity, cnt), '{}'::json)
    FROM (
      SELECT severity, COUNT(*) AS cnt
      FROM public.fraud_queue
      GROUP BY severity
    ) s
  );

  RETURN json_build_object(
    'total', (SELECT COUNT(*) FROM public.fraud_queue),
    'byStatus', COALESCE(v_status_counts, '{}'::json),
    'bySeverity', COALESCE(v_severity_counts, '{}'::json)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_fraud_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_fraud_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fraud_stats() TO service_role;

CREATE OR REPLACE FUNCTION public.update_fraud_queue_status(
  p_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_row public.fraud_queue%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật fraud queue' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('open', 'reviewing', 'resolved', 'dismissed') THEN
    RAISE EXCEPTION 'status không hợp lệ';
  END IF;

  UPDATE public.fraud_queue
  SET status = p_status,
      notes = COALESCE(NULLIF(TRIM(p_notes), ''), notes),
      resolver_id = CASE WHEN p_status IN ('resolved', 'dismissed') THEN auth.uid() ELSE resolver_id END,
      updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy fraud queue item: %', p_id;
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'status', v_row.status,
    'notes', v_row.notes,
    'updatedAt', v_row.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_fraud_queue_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_fraud_queue_status(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_fraud_queue_status(UUID, TEXT, TEXT) TO service_role;

-- ============================================================
-- 8. RPC: cấu hình data retention
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_data_retention_config()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_config JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem cấu hình data retention' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT value INTO v_config FROM public.system_settings WHERE key = 'data_retention_config';

  RETURN json_build_object(
    'retentionDaysOrders', COALESCE((v_config->>'retention_days_orders')::INTEGER, 730),
    'retentionDaysProcessedOperations', COALESCE((v_config->>'retention_days_processed_operations')::INTEGER, 90),
    'retentionDaysRateLimitLogs', COALESCE((v_config->>'retention_days_rate_limit_logs')::INTEGER, 1),
    'retentionDaysFraudQueue', COALESCE((v_config->>'retention_days_fraud_queue')::INTEGER, 90),
    'retentionDaysRegistrationEvents', COALESCE((v_config->>'retention_days_registration_events')::INTEGER, 365),
    'cronSchedule', COALESCE(v_config->>'cron_schedule', '0 3 * * *')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_data_retention_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_data_retention_config() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_data_retention_config() TO service_role;

CREATE OR REPLACE FUNCTION public.set_data_retention_config(
  p_retention_days_orders INTEGER DEFAULT 730,
  p_retention_days_processed_operations INTEGER DEFAULT 90,
  p_retention_days_rate_limit_logs INTEGER DEFAULT 1,
  p_retention_days_fraud_queue INTEGER DEFAULT 90,
  p_retention_days_registration_events INTEGER DEFAULT 365,
  p_cron_schedule TEXT DEFAULT '0 3 * * *'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_config JSONB;
  v_cron_value JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật cấu hình data retention' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_retention_days_orders < 1
    OR p_retention_days_processed_operations < 1
    OR p_retention_days_rate_limit_logs < 1
    OR p_retention_days_fraud_queue < 1
    OR p_retention_days_registration_events < 1 THEN
    RAISE EXCEPTION 'Số ngày retention phải >= 1';
  END IF;

  IF p_cron_schedule IS NULL OR TRIM(p_cron_schedule) = '' THEN
    RAISE EXCEPTION 'Lịch cron không được để trống';
  END IF;

  v_config := jsonb_build_object(
    'retention_days_orders', p_retention_days_orders,
    'retention_days_processed_operations', p_retention_days_processed_operations,
    'retention_days_rate_limit_logs', p_retention_days_rate_limit_logs,
    'retention_days_fraud_queue', p_retention_days_fraud_queue,
    'retention_days_registration_events', p_retention_days_registration_events,
    'cron_schedule', TRIM(p_cron_schedule)
  );

  INSERT INTO public.system_settings (key, value)
  VALUES ('data_retention_config', v_config)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now(),
        updated_by = auth.uid()
  RETURNING value INTO v_config;

  -- Đồng bộ lịch cron sang setting cũ để dashboard hiện tại vẫn đọc đúng.
  v_cron_value := jsonb_build_object('schedule', TRIM(p_cron_schedule), 'description', 'Hàng ngày');
  INSERT INTO public.system_settings (key, value)
  VALUES ('data_retention_cron', v_cron_value)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now(),
        updated_by = auth.uid();

  -- ponytail: reschedule cron nếu extension có sẵn; nếu không thì bỏ qua.
  BEGIN
    PERFORM cron.schedule('data-retention-daily', TRIM(p_cron_schedule), 'SELECT public.run_data_retention();');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN public.get_data_retention_config();
END;
$$;

REVOKE ALL ON FUNCTION public.set_data_retention_config(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_data_retention_config(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_data_retention_config(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT) TO service_role;

-- ============================================================
-- 9. RPC/Procedure: run data retention (configurable)
-- SECURITY DEFINER + admin check để có quyền xóa dữ liệu tenant.
-- ============================================================

-- Xóa routine cũ (có thể là function hoặc procedure từ phase17) trước khi tạo lại.
DROP ROUTINE IF EXISTS public.run_data_retention() CASCADE;

CREATE OR REPLACE FUNCTION public.run_data_retention()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config JSONB;
  v_orders_days INT;
  v_processed_days INT;
  v_rate_limit_days INT;
  v_fraud_queue_days INT;
  v_reg_events_days INT;
  v_partition_name TEXT;
  v_partition_year INT;
  v_partition_month INT;
  v_current_threshold INT;
  v_match TEXT[];
  v_archived_orders BIGINT;
  v_archived_items BIGINT;
  v_deleted_rate_limit BIGINT;
  v_deleted_processed BIGINT;
  v_deleted_fraud_queue BIGINT;
  v_deleted_reg_events BIGINT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được chạy data retention' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT value INTO v_config FROM public.system_settings WHERE key = 'data_retention_config';

  v_orders_days := COALESCE((v_config->>'retention_days_orders')::INTEGER, 730);
  v_processed_days := COALESCE((v_config->>'retention_days_processed_operations')::INTEGER, 90);
  v_rate_limit_days := COALESCE((v_config->>'retention_days_rate_limit_logs')::INTEGER, 1);
  v_fraud_queue_days := COALESCE((v_config->>'retention_days_fraud_queue')::INTEGER, 90);
  v_reg_events_days := COALESCE((v_config->>'retention_days_registration_events')::INTEGER, 365);
  v_current_threshold := (EXTRACT(YEAR FROM now())::int - 2) * 12 + EXTRACT(MONTH FROM now())::int;

  INSERT INTO public.orders_archive
  SELECT * FROM public.orders
  WHERE created_at < now() - make_interval(days => v_orders_days)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_archived_orders = ROW_COUNT;

  INSERT INTO public.order_items_archive
  SELECT oi.* FROM public.order_items oi
  JOIN public.orders o ON oi.order_id = o.id
  WHERE o.created_at < now() - make_interval(days => v_orders_days)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_archived_items = ROW_COUNT;

  DELETE FROM public.order_items
  WHERE order_id IN (
    SELECT id FROM public.orders WHERE created_at < now() - make_interval(days => v_orders_days)
  );

  DELETE FROM public.orders
  WHERE created_at < now() - make_interval(days => v_orders_days);

  DELETE FROM public.processed_operations
  WHERE processed_at < now() - make_interval(days => v_processed_days);
  GET DIAGNOSTICS v_deleted_processed = ROW_COUNT;

  DELETE FROM public.rate_limit_logs
  WHERE created_at < now() - make_interval(days => v_rate_limit_days);
  GET DIAGNOSTICS v_deleted_rate_limit = ROW_COUNT;

  DELETE FROM public.fraud_queue
  WHERE created_at < now() - make_interval(days => v_fraud_queue_days);
  GET DIAGNOSTICS v_deleted_fraud_queue = ROW_COUNT;

  DELETE FROM public.tenant_registration_events
  WHERE created_at < now() - make_interval(days => v_reg_events_days);
  GET DIAGNOSTICS v_deleted_reg_events = ROW_COUNT;

  IF EXISTS (
    SELECT 1 FROM pg_class
    WHERE relname = 'app_audit_log_partitioned' AND relkind = 'p'
  ) THEN
    FOR v_partition_name IN
      SELECT inhrelid::regclass::text
      FROM pg_inherits
      WHERE inhparent = 'public.app_audit_log_partitioned'::regclass
    LOOP
      v_match := regexp_match(v_partition_name, '(\d{4})_(\d{2})$');
      IF v_match IS NOT NULL THEN
        v_partition_year := v_match[1]::int;
        v_partition_month := v_match[2]::int;
        IF (v_partition_year * 12 + v_partition_month) < v_current_threshold THEN
          EXECUTE format('DROP TABLE IF EXISTS %I', v_partition_name);
        END IF;
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.system_settings (key, value)
  VALUES ('data_retention_last_run', jsonb_build_object('run_at', now()))
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now(),
        updated_by = auth.uid();

  RETURN json_build_object(
    'archivedOrders', COALESCE(v_archived_orders, 0),
    'archivedItems', COALESCE(v_archived_items, 0),
    'deletedProcessedOperations', COALESCE(v_deleted_processed, 0),
    'deletedRateLimitLogs', COALESCE(v_deleted_rate_limit, 0),
    'deletedFraudQueue', COALESCE(v_deleted_fraud_queue, 0),
    'deletedRegistrationEvents', COALESCE(v_deleted_reg_events, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.run_data_retention() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_data_retention() TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_data_retention() TO service_role;

-- ============================================================
-- 10. Cron jobs
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  v_schedule TEXT;
BEGIN
  SELECT COALESCE(value->>'cron_schedule', '0 3 * * *')
  INTO v_schedule
  FROM public.system_settings
  WHERE key = 'data_retention_config';

  BEGIN
    PERFORM cron.schedule('data-retention-daily', v_schedule, 'SELECT public.run_data_retention();');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    PERFORM cron.schedule('fraud-detection-hourly', '0 * * * *', 'SELECT public.run_fraud_detection();');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
