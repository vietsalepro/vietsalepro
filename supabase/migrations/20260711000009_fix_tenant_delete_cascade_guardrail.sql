-- Fix: F33 guardrail trigger on tenant_memberships blocks cascade tenant deletion.
-- When deleting a tenant, Postgres cascades the delete to tenant_memberships. The
-- guardrail trigger fires for each membership row and raises an exception if it is the
-- owner or the last admin, aborting the entire tenant delete.
--
-- ponytail: set a transaction-level flag via a BEFORE DELETE trigger on tenants so the
-- guardrail can distinguish "tenant is being deleted" from "direct member removal".

-- 1. Set the flag before any tenant row is deleted.
CREATE OR REPLACE FUNCTION public.trg_tenants_before_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.hard_delete_tenant', 'true', true);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS tenants_before_delete_guardrail ON public.tenants;

CREATE TRIGGER tenants_before_delete_guardrail
BEFORE DELETE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.trg_tenants_before_delete();

-- 2. Update guardrail to skip owner/last-admin checks when the tenant itself is being deleted.
CREATE OR REPLACE FUNCTION public.trg_tenant_memberships_guardrails()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_other_admins INT;
  v_hard_delete TEXT;
BEGIN
  v_hard_delete := current_setting('app.hard_delete_tenant', true);
  IF v_hard_delete IS NOT NULL AND v_hard_delete = 'true' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM public.tenants
  WHERE id = COALESCE(OLD.tenant_id, NEW.tenant_id);

  IF TG_OP = 'DELETE' THEN
    IF OLD.user_id = v_owner_id THEN
      RAISE EXCEPTION 'Không thể xóa owner của tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF OLD.role = 'admin' THEN
      SELECT COUNT(*) INTO v_other_admins
      FROM public.tenant_memberships
      WHERE tenant_id = OLD.tenant_id
        AND role = 'admin'
        AND user_id <> OLD.user_id;

      IF v_other_admins = 0 THEN
        RAISE EXCEPTION 'Không thể xóa admin cuối cùng của tenant' USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.user_id = v_owner_id AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Không thể đổi role của owner tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF OLD.role = 'admin' AND NEW.role <> 'admin' THEN
      SELECT COUNT(*) INTO v_other_admins
      FROM public.tenant_memberships
      WHERE tenant_id = OLD.tenant_id
        AND role = 'admin'
        AND user_id <> OLD.user_id;

      IF v_other_admins = 0 THEN
        RAISE EXCEPTION 'Không thể hạ role admin cuối cùng của tenant' USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;
