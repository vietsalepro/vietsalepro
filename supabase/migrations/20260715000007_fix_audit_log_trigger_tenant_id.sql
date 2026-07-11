-- Sub-Phase 6.1 follow-up: fix the generic audit_log_trigger so it works for tables
-- that do not have a tenant_id column (e.g. public.tenants).
-- ponytail: tenants.id *is* the tenant id; tenant_memberships has a tenant_id column.

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'tenants' THEN
    v_tenant_id := COALESCE(NEW.id, OLD.id);
  ELSE
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  END IF;

  INSERT INTO public.audit_log (tenant_id, actor_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    v_tenant_id,
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
