-- Sub-Phase 6.1 follow-up: the trg_tenant_memberships_audit trigger used
-- action values ('MEMBER_INSERT', ...) that violate the app_audit_log_action_check.
-- ponytail: app_audit_log already stores the table_name, so plain INSERT/UPDATE/DELETE
-- action values are sufficient.

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
