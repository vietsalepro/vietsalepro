-- Migration: 20260712000008_add_audit_log_triggers.sql
-- Thêm audit log trigger cho tenant_memberships

CREATE OR REPLACE FUNCTION public.trg_tenant_memberships_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, new_data)
    VALUES (NEW.tenant_id, auth.uid(), 'tenant_memberships', NEW.id, 'INSERT',
            row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data, new_data)
    VALUES (NEW.tenant_id, auth.uid(), 'tenant_memberships', NEW.id, 'UPDATE',
            row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data)
    VALUES (OLD.tenant_id, auth.uid(), 'tenant_memberships', OLD.id, 'DELETE',
            row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tenant_memberships_audit ON public.tenant_memberships;
CREATE TRIGGER tenant_memberships_audit
AFTER INSERT OR UPDATE OR DELETE ON public.tenant_memberships
FOR EACH ROW
EXECUTE FUNCTION public.trg_tenant_memberships_audit();