-- F33 P3: Guardrails for tenant_memberships
-- Scope: protect tenant owner and last admin from deletion / role downgrade.
-- ponytail: single trigger function handles DELETE + UPDATE; SECURITY DEFINER to bypass RLS when counting remaining admins.

CREATE OR REPLACE FUNCTION public.trg_tenant_memberships_guardrails()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_other_admins INT;
BEGIN
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

DROP TRIGGER IF EXISTS tenant_memberships_guardrails ON public.tenant_memberships;

CREATE TRIGGER tenant_memberships_guardrails
BEFORE DELETE OR UPDATE ON public.tenant_memberships
FOR EACH ROW
EXECUTE FUNCTION public.trg_tenant_memberships_guardrails();
