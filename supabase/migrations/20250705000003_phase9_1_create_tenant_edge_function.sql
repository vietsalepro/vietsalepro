-- Phase 9.1: Edge Function `create-tenant` prerequisites
-- Mục tiêu: Cung cấp bảng rate limiting và audit log để function hoạt động.
-- ponytail: tạo idempotent để Phase 9.6 và Phase 11 có thể chạy an toàn sau này.

-- ============================================================
-- 1. Rate limiting logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login','create_tenant','check_subdomain','invite_member')),
  attempt_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip_action_window
  ON public.rate_limit_logs(ip_address, action, window_start);

-- ============================================================
-- 2. Audit log table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT')),
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_audit_log' AND policyname = 'audit_log_tenant_admin'
  ) THEN
    CREATE POLICY "audit_log_tenant_admin" ON public.app_audit_log FOR SELECT TO authenticated
    USING (
      public.is_tenant_admin(tenant_id)
      OR public.is_system_admin()
    );
  END IF;
END $$;
