-- F33 P3: Guardrails for tenant_memberships - BUG FIXES
-- Scope: 
--   1. Add status/is_active filter when counting remaining admins
--   2. Protect toggle is_active for last admin
--   3. Protect DELETE against last admin (with proper filters)
-- This replaces the previous trigger function.

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
  -- Skip checks when tenant itself is being deleted (cascade)
  v_hard_delete := current_setting('app.hard_delete_tenant', true);
  IF v_hard_delete IS NOT NULL AND v_hard_delete = 'true' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM public.tenants
  WHERE id = COALESCE(OLD.tenant_id, NEW.tenant_id);

  -- ============ DELETE OPERATION ============
  IF TG_OP = 'DELETE' THEN
    -- Cannot delete owner
    IF OLD.user_id = v_owner_id THEN
      RAISE EXCEPTION 'Không thể xóa owner của tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Cannot delete last admin (chỉ tính admin active + is_active = true)
    IF OLD.role = 'admin' THEN
      SELECT COUNT(*) INTO v_other_admins
      FROM public.tenant_memberships
      WHERE tenant_id = OLD.tenant_id
        AND role = 'admin'
        AND user_id <> OLD.user_id
        AND status IN ('active', 'pending')
        AND is_active = true;

      IF v_other_admins = 0 THEN
        RAISE EXCEPTION 'Không thể xóa admin cuối cùng của tenant' USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    RETURN OLD;
  END IF;

  -- ============ UPDATE OPERATION ============
  IF TG_OP = 'UPDATE' THEN
    -- Cannot change owner's role
    IF OLD.user_id = v_owner_id AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Không thể đổi role của owner tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Cannot demote last admin (chỉ tính admin active + is_active = true)
    IF OLD.role = 'admin' AND NEW.role <> 'admin' THEN
      SELECT COUNT(*) INTO v_other_admins
      FROM public.tenant_memberships
      WHERE tenant_id = OLD.tenant_id
        AND role = 'admin'
        AND user_id <> OLD.user_id
        AND status IN ('active', 'pending')
        AND is_active = true;

      IF v_other_admins = 0 THEN
        RAISE EXCEPTION 'Không thể hạ role admin cuối cùng của tenant' USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    -- Cannot deactivate last admin (MỚI: bảo vệ toggle is_active)
    IF OLD.role = 'admin' AND NEW.is_active IS DISTINCT FROM OLD.is_active AND NEW.is_active = false THEN
      SELECT COUNT(*) INTO v_other_admins
      FROM public.tenant_memberships
      WHERE tenant_id = OLD.tenant_id
        AND role = 'admin'
        AND user_id <> OLD.user_id
        AND status IN ('active', 'pending')
        AND is_active = true;

      IF v_other_admins = 0 THEN
        RAISE EXCEPTION 'Không thể vô hiệu hóa admin duy nhất của tenant' USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;