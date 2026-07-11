-- Sub-Phase 5.1: Accept/decline invitation RPCs
-- Basejump reference: basejump-invitations pattern
-- ponytail: SECURITY DEFINER lets the RPC enforce token/email guards once,
--            avoiding duplicated permission checks in every caller.

-- ============================================================
-- 0. Ensure audit log accepts the invitation action
-- ============================================================
ALTER TABLE public.app_audit_log
DROP CONSTRAINT IF EXISTS app_audit_log_action_check,
ADD CONSTRAINT app_audit_log_action_check
CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','IMPERSONATE','IMPERSONATE_END','EMAIL_FAILED','INVITATION_ACCEPTED'));

-- ============================================================
-- 1. lookup_invitation: show invitee what they are accepting
-- ============================================================
CREATE OR REPLACE FUNCTION public.lookup_invitation(p_token UUID)
RETURNS TABLE(
  tenant_id UUID,
  tenant_name TEXT,
  tenant_subdomain TEXT,
  tenant_custom_domain TEXT,
  role TEXT,
  email TEXT,
  active BOOLEAN,
  expired BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.tenant_id,
    t.name,
    t.subdomain,
    t.custom_domain,
    i.role,
    i.email,
    (i.status = 'pending' AND i.expires_at > now()) AS active,
    (i.expires_at <= now()) AS expired
  FROM public.invitations i
  JOIN public.tenants t ON t.id = i.tenant_id
  WHERE i.token = p_token;
END;
$$;

-- ============================================================
-- 2. accept_invitation: turn a valid pending invitation into a membership
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token UUID)
RETURNS public.tenant_memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation public.invitations;
  v_user_id UUID := auth.uid();
  v_user_email TEXT;
  v_membership public.tenant_memberships;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lời mời không tồn tại' USING ERRCODE = 'no_data_found';
  END IF;

  IF v_invitation.status <> 'pending' THEN
    RAISE EXCEPTION 'Lời mời đã được sử dụng hoặc đã bị thu hồi' USING ERRCODE = 'check_violation';
  END IF;

  IF v_invitation.expires_at <= now() THEN
    RAISE EXCEPTION 'Lời mời đã hết hạn' USING ERRCODE = 'check_violation';
  END IF;

  IF lower(v_user_email) <> lower(v_invitation.email) THEN
    RAISE EXCEPTION 'Email đăng nhập không khớp với email được mời' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = v_invitation.tenant_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Bạn đã là thành viên của tenant này' USING ERRCODE = 'unique_violation';
  END IF;

  INSERT INTO public.tenant_memberships (
    tenant_id, user_id, role, status, is_active, invited_by, invited_at, accepted_at
  ) VALUES (
    v_invitation.tenant_id,
    v_user_id,
    v_invitation.role,
    'active',
    true,
    v_invitation.created_by,
    v_invitation.created_at,
    now()
  )
  RETURNING * INTO v_membership;

  UPDATE public.invitations
  SET status = 'accepted', updated_at = now()
  WHERE id = v_invitation.id;

  INSERT INTO public.app_audit_log (
    tenant_id, user_id, table_name, record_id, action, new_data
  ) VALUES (
    v_invitation.tenant_id,
    v_user_id,
    'tenant_memberships',
    v_membership.id,
    'INVITATION_ACCEPTED',
    jsonb_build_object('invitation_id', v_invitation.id, 'role', v_invitation.role)
  );

  RETURN v_membership;
END;
$$;
