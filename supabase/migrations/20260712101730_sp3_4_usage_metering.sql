-- SP-3.4: Usage metering
-- ponytail: idempotent migration adding tenant_usage_records table with tenant isolation.
--          Service summarises client-side; ceiling is O(n) per tenant/metric, upgrade path is a DB aggregate RPC.

-- ============================================================
-- 1. Bảng usage records
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tenant_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  quantity NUMERIC(12,4) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  source TEXT,
  metadata JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_records_lookup
  ON public.tenant_usage_records (tenant_id, metric_key, recorded_at DESC);

COMMENT ON TABLE public.tenant_usage_records IS 'Granular usage events per tenant for metering and quota tracking.';

-- ============================================================
-- 2. RLS policies (tenant isolation + system admin bypass)
-- ============================================================

ALTER TABLE public.tenant_usage_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tenant_usage_records' AND policyname = 'tenant_usage_records_select'
  ) THEN
    CREATE POLICY "tenant_usage_records_select"
      ON public.tenant_usage_records FOR SELECT TO authenticated
      USING (public.is_system_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id)));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tenant_usage_records' AND policyname = 'tenant_usage_records_insert'
  ) THEN
    CREATE POLICY "tenant_usage_records_insert"
      ON public.tenant_usage_records FOR INSERT TO authenticated
      WITH CHECK (public.is_system_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id)));
  END IF;
END $$;
