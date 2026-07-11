-- Sub-Phase 6.1 follow-up: deleting a tenant would otherwise violate the
-- audit_log -> tenants FK because the row is gone before the AFTER trigger fires.
-- ponytail: record the tenant id as NULL on tenant DELETE; the entity_id still holds it.

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
    IF TG_OP = 'DELETE' THEN
      v_tenant_id := NULL;
    ELSE
      v_tenant_id := COALESCE(NEW.id, OLD.id);
    END IF;
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
