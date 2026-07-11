-- Sub-Phase 5.2: Audit triggers for admin-managed tenant tables.
-- ponytail: tenants / tenant_memberships / tenant_subscriptions are the core admin
-- dashboard entities. tenant_subscriptions uses tenant_id as PK, so it gets a
-- dedicated trigger function to keep entity_id NOT NULL.

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (tenant_id, actor_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
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

DROP TRIGGER IF EXISTS trg_audit_log_tenants ON public.tenants;
CREATE TRIGGER trg_audit_log_tenants
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS trg_audit_log_tenant_memberships ON public.tenant_memberships;
CREATE TRIGGER trg_audit_log_tenant_memberships
  AFTER INSERT OR UPDATE OR DELETE ON public.tenant_memberships
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE OR REPLACE FUNCTION public.audit_log_trigger_tenant_subscriptions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (tenant_id, actor_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    auth.uid(),
    TG_OP,
    'tenant_subscriptions',
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_log_tenant_subscriptions ON public.tenant_subscriptions;
CREATE TRIGGER trg_audit_log_tenant_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON public.tenant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_tenant_subscriptions();
