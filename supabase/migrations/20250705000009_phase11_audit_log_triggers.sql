-- Phase 11: Audit log triggers for critical tables
-- ponytail: idempotent; table + policy already exist from Phase 9.6.

-- ============================================================
-- 1. Ensure audit log table and policy exist
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

-- ============================================================
-- 2. Trigger function: auto log INSERT/UPDATE/DELETE
-- ============================================================

CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_record_id TEXT;
  v_tenant_id UUID;
BEGIN
  v_record_id := COALESCE(NEW.id::TEXT, OLD.id::TEXT);
  v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);

  INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data, new_data)
  VALUES (
    v_tenant_id,
    auth.uid(),
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- 3. Attach triggers to critical tables
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_log_orders ON public.orders;
CREATE TRIGGER trg_audit_log_orders
  BEFORE INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log_products ON public.products;
CREATE TRIGGER trg_audit_log_products
  BEFORE INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log_import_receipts ON public.import_receipts;
CREATE TRIGGER trg_audit_log_import_receipts
  BEFORE INSERT OR UPDATE OR DELETE ON public.import_receipts
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log_disposals ON public.disposals;
CREATE TRIGGER trg_audit_log_disposals
  BEFORE INSERT OR UPDATE OR DELETE ON public.disposals
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log_app_settings ON public.app_settings;
CREATE TRIGGER trg_audit_log_app_settings
  BEFORE INSERT OR UPDATE OR DELETE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
