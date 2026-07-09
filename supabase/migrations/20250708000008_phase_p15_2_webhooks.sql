-- P15.2: Admin dashboard — Webhooks
-- tenant_webhooks + webhook_deliveries + delivery log + retry idempotent (YAGNI).
-- ponytail: migration idempotent; chỉ system admin quản lý webhook; retry dùng idempotency_key để receiver dedup.

-- ============================================================
-- 1. Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tenant_webhooks (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['*']::TEXT[],
  secret TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.tenant_webhooks(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered','failed','exhausted')),
  http_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  attempted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  attempt_log JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_webhook_deliveries_idempotency_key UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_webhooks_tenant_id ON public.tenant_webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_webhooks_status ON public.tenant_webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry_at ON public.webhook_deliveries(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant_id ON public.webhook_deliveries(tenant_id);

ALTER TABLE public.tenant_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tenant_webhooks' AND policyname = 'tenant_webhooks_system_admin_all'
  ) THEN
    CREATE POLICY "tenant_webhooks_system_admin_all"
      ON public.tenant_webhooks FOR ALL TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'webhook_deliveries' AND policyname = 'webhook_deliveries_system_admin_all'
  ) THEN
    CREATE POLICY "webhook_deliveries_system_admin_all"
      ON public.webhook_deliveries FOR ALL TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 2. Helpers
-- ============================================================

CREATE OR REPLACE FUNCTION public.webhook_retry_schedule(p_attempt_count INTEGER)
RETURNS INTERVAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Exponential-ish backoff: 0, 5min, 15min, 1h, 4h, 12h
  RETURN CASE
    WHEN p_attempt_count <= 0 THEN '0 seconds'::INTERVAL
    WHEN p_attempt_count = 1 THEN '5 minutes'::INTERVAL
    WHEN p_attempt_count = 2 THEN '15 minutes'::INTERVAL
    WHEN p_attempt_count = 3 THEN '1 hour'::INTERVAL
    WHEN p_attempt_count = 4 THEN '4 hours'::INTERVAL
    ELSE '12 hours'::INTERVAL
  END;
END;
$$;

-- ------------------------------------------------------------
-- Helper: validate a webhook URL is public HTTPS only.
-- ponytail: rejects non-HTTPS, localhost, link-local, private
-- ranges, and well-known metadata endpoints.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_valid_webhook_url(p_url TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_host TEXT;
  v_ip INET;
BEGIN
  IF p_url IS NULL OR p_url !~* '^https://' THEN
    RETURN false;
  END IF;

  -- Extract host (strip scheme, path, port, credentials).
  v_host := lower(substring(p_url from '^https://([^/:]+)'));
  IF v_host IS NULL OR v_host = '' THEN
    RETURN false;
  END IF;

  -- Strip IPv6 brackets for INET parsing.
  IF v_host LIKE '[%]' THEN
    v_host := trim(both '[]' from v_host);
  END IF;

  -- Reject localhost and local/metadata-like domains.
  IF v_host = 'localhost'
     OR v_host ~* '\.(local|localhost|internal|metadata)$'
     OR v_host = 'metadata.google.internal'
     OR v_host = '169.254.169.254' THEN
    RETURN false;
  END IF;

  -- If the host is an IP address, reject private/local ranges.
  BEGIN
    v_ip := v_host::INET;
    IF v_ip << '10.0.0.0/8'::INET
       OR v_ip << '172.16.0.0/12'::INET
       OR v_ip << '192.168.0.0/16'::INET
       OR v_ip << '127.0.0.0/8'::INET
       OR v_ip << '169.254.0.0/16'::INET
       OR v_ip = '::1'::INET
       OR v_ip << 'fc00::/7'::INET THEN
      RETURN false;
    END IF;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Not an IP address; domain checks above already applied.
    NULL;
  END;

  RETURN true;
END;
$$;

-- ============================================================
-- 3. RPC create webhook
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_tenant_webhook(
  p_tenant_id UUID,
  p_name TEXT,
  p_url TEXT,
  p_events TEXT[] DEFAULT ARRAY['*']::TEXT[],
  p_secret TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_row public.tenant_webhooks;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo webhook' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu tenant_id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Tên webhook không được để trống';
  END IF;

  IF p_url IS NULL OR length(trim(p_url)) = 0 THEN
    RAISE EXCEPTION 'URL webhook không được để trống';
  END IF;

  IF NOT public.is_valid_webhook_url(p_url) THEN
    RAISE EXCEPTION 'URL webhook phải là public HTTPS, không được là IP nội mạng/metadata/localhost';
  END IF;

  INSERT INTO public.tenant_webhooks (
    tenant_id, name, url, events, secret, created_by
  ) VALUES (
    p_tenant_id, trim(p_name), trim(p_url),
    COALESCE(p_events, ARRAY['*']::TEXT[]),
    p_secret,
    auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id', v_row.id,
    'tenantId', v_row.tenant_id,
    'name', v_row.name,
    'url', v_row.url,
    'events', v_row.events,
    'status', v_row.status,
    'createdAt', v_row.created_at,
    'updatedAt', v_row.updated_at
  );
END;
$$;

-- ============================================================
-- 4. RPC update webhook
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_tenant_webhook(
  p_webhook_id UUID,
  p_name TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_events TEXT[] DEFAULT NULL,
  p_secret TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_row public.tenant_webhooks;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật webhook' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_url IS NOT NULL THEN
    IF length(trim(p_url)) = 0 THEN
      RAISE EXCEPTION 'URL webhook không được để trống';
    END IF;
    IF NOT public.is_valid_webhook_url(p_url) THEN
      RAISE EXCEPTION 'URL webhook phải là public HTTPS, không được là IP nội mạng/metadata/localhost';
    END IF;
  END IF;

  UPDATE public.tenant_webhooks
  SET name = COALESCE(trim(p_name), name),
      url = COALESCE(trim(p_url), url),
      events = COALESCE(p_events, events),
      secret = COALESCE(p_secret, secret),
      status = COALESCE(p_status, status),
      updated_at = now()
  WHERE id = p_webhook_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy webhook: %', p_webhook_id;
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'tenantId', v_row.tenant_id,
    'name', v_row.name,
    'url', v_row.url,
    'events', v_row.events,
    'status', v_row.status,
    'createdAt', v_row.created_at,
    'updatedAt', v_row.updated_at
  );
END;
$$;

-- ============================================================
-- 5. RPC delete webhook
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_tenant_webhook(p_webhook_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa webhook' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.tenant_webhooks WHERE id = p_webhook_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy webhook: %', p_webhook_id;
  END IF;
END;
$$;

-- ============================================================
-- 6. RPC list webhooks for a tenant
-- ============================================================

CREATE OR REPLACE FUNCTION public.list_tenant_webhooks(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem webhook' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        id,
        tenant_id AS tenantId,
        name,
        url,
        events,
        status,
        created_by AS createdBy,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM public.tenant_webhooks
      WHERE tenant_id = p_tenant_id
      ORDER BY created_at DESC
    ) t
  );
END;
$$;

-- ============================================================
-- 7. RPC trigger webhook event (idempotent enqueue)
-- ponytail: idempotency_key UNIQUE nên cùng một sự kiện không tạo delivery trùng.
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_webhook_event(
  p_tenant_id UUID,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}'::JSONB,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_webhooks JSONB;
  v_key TEXT;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được trigger webhook event' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tenant_id IS NULL OR p_event_type IS NULL THEN
    RAISE EXCEPTION 'Thiếu tenant_id hoặc event_type';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(w)), '[]'::jsonb)
  INTO v_webhooks
  FROM (
    SELECT id, tenant_id, name, url, events, secret, status
    FROM public.tenant_webhooks
    WHERE tenant_id = p_tenant_id
      AND status = 'active'
      AND (
        events @> ARRAY['*']::TEXT[]
        OR events @> ARRAY[p_event_type]::TEXT[]
      )
  ) w;

  IF v_webhooks = '[]'::jsonb THEN
    RETURN json_build_object('enqueued', 0, 'deliveries', '[]'::json);
  END IF;

  v_key := COALESCE(p_idempotency_key, p_tenant_id || ':' || p_event_type || ':' || extensions.gen_random_uuid()::TEXT);

  -- Insert one delivery per active webhook using the same idempotency root + webhook_id
  WITH inserted AS (
    INSERT INTO public.webhook_deliveries (
      webhook_id, tenant_id, event_type, payload, idempotency_key, status, next_retry_at
    )
    SELECT
      (w.value->>'id')::UUID,
      p_tenant_id,
      p_event_type,
      p_payload,
      v_key || ':' || (w.value->>'id'),
      'pending',
      now()
    FROM jsonb_array_elements(v_webhooks) AS w
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id, webhook_id, idempotency_key, status
  )
  SELECT json_build_object(
    'enqueued', COUNT(*),
    'deliveries', COALESCE(json_agg(row_to_json(inserted)), '[]'::json)
  )
  INTO v_result
  FROM inserted;

  RETURN v_result;
END;
$$;

-- ============================================================
-- 8. RPC list delivery log
-- ============================================================

CREATE OR REPLACE FUNCTION public.list_webhook_deliveries(
  p_webhook_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem delivery log' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT json_build_object(
      'data', COALESCE(json_agg(row_to_json(t)), '[]'::json),
      'count', (SELECT COUNT(*) FROM public.webhook_deliveries WHERE webhook_id = p_webhook_id)
    )
    FROM (
      SELECT
        id,
        webhook_id AS webhookId,
        tenant_id AS tenantId,
        event_type AS eventType,
        payload,
        idempotency_key AS idempotencyKey,
        status,
        http_status AS httpStatus,
        response_body AS responseBody,
        error_message AS errorMessage,
        attempt_count AS attemptCount,
        max_attempts AS maxAttempts,
        attempted_at AS attemptedAt,
        delivered_at AS deliveredAt,
        next_retry_at AS nextRetryAt,
        attempt_log AS attemptLog,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM public.webhook_deliveries
      WHERE webhook_id = p_webhook_id
      ORDER BY created_at DESC
      LIMIT p_limit OFFSET p_offset
    ) t
  );
END;
$$;

-- ============================================================
-- 9. RPC retry a failed/exhausted delivery (idempotent)
-- ponytail: giữ nguyên idempotency_key, reset status pending để Edge Function gửi lại.
-- ============================================================

CREATE OR REPLACE FUNCTION public.retry_webhook_delivery(p_delivery_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_row public.webhook_deliveries;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được retry webhook' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.webhook_deliveries
  SET status = 'pending',
      next_retry_at = now(),
      updated_at = now()
  WHERE id = p_delivery_id
    AND status IN ('failed','exhausted')
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy delivery có thể retry: %', p_delivery_id;
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'status', v_row.status,
    'attemptCount', v_row.attempt_count,
    'nextRetryAt', v_row.next_retry_at
  );
END;
$$;

-- ============================================================
-- 10. RPC get pending deliveries (Edge Function worker)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_pending_webhook_deliveries(p_limit INTEGER DEFAULT 100)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        d.id,
        d.webhook_id AS webhookId,
        d.tenant_id AS tenantId,
        d.event_type AS eventType,
        d.payload,
        d.idempotency_key AS idempotencyKey,
        d.attempt_count AS attemptCount,
        d.max_attempts AS maxAttempts,
        w.url,
        w.secret
      FROM public.webhook_deliveries d
      JOIN public.tenant_webhooks w ON w.id = d.webhook_id
      WHERE d.status = 'pending'
        AND (d.next_retry_at IS NULL OR d.next_retry_at <= now())
      ORDER BY d.created_at ASC
      LIMIT p_limit
    ) t
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_pending_webhook_deliveries(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pending_webhook_deliveries(INTEGER) TO service_role;

-- ============================================================
-- 11. RPC mark delivery result (Edge Function worker)
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_webhook_delivery(
  p_delivery_id UUID,
  p_status TEXT,
  p_http_status INTEGER DEFAULT NULL,
  p_response_body TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.webhook_deliveries;
  v_next_retry TIMESTAMPTZ;
  v_attempt_log JSONB;
BEGIN
  IF p_status NOT IN ('delivered','failed','exhausted') THEN
    RAISE EXCEPTION 'status phải là delivered, failed hoặc exhausted';
  END IF;

  SELECT * INTO v_row FROM public.webhook_deliveries WHERE id = p_delivery_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy delivery: %', p_delivery_id;
  END IF;

  v_attempt_log := v_row.attempt_log || jsonb_build_object(
    'attempted_at', now(),
    'http_status', p_http_status,
    'error_message', p_error_message
  );

  IF p_status = 'delivered' THEN
    v_next_retry := NULL;
  ELSIF v_row.attempt_count >= v_row.max_attempts THEN
    p_status := 'exhausted';
    v_next_retry := NULL;
  ELSE
    v_next_retry := now() + public.webhook_retry_schedule(v_row.attempt_count + 1);
  END IF;

  UPDATE public.webhook_deliveries
  SET status = p_status,
      http_status = p_http_status,
      response_body = p_response_body,
      error_message = p_error_message,
      attempt_count = attempt_count + 1,
      attempted_at = now(),
      delivered_at = CASE WHEN p_status = 'delivered' THEN now() ELSE delivered_at END,
      next_retry_at = v_next_retry,
      attempt_log = v_attempt_log,
      updated_at = now()
  WHERE id = p_delivery_id
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id', v_row.id,
    'status', v_row.status,
    'attemptCount', v_row.attempt_count,
    'nextRetryAt', v_row.next_retry_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mark_webhook_delivery(UUID, TEXT, INTEGER, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_webhook_delivery(UUID, TEXT, INTEGER, TEXT, TEXT) TO service_role;
