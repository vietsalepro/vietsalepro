-- Fix: [3.3] toggleMemberActive() KHÔNG có auth check
-- Tạo RPC SECURITY DEFINER để thay thế direct update
-- ponytail: SECURITY DEFINER + 6 guard layers + audit log

CREATE OR REPLACE FUNCTION public.toggle_tenant_member_active(
  p_tenant_id UUID,
  p_user_id UUID,
  p_is_active BOOLEAN
) RETURNS public.tenant_memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_target_role TEXT;
  v_is_owner BOOLEAN;
  v_admin_count INT;
  v_row public.tenant_memberships;
BEGIN
  v_caller_id := auth.uid();
  
  -- Guard 1: Authenticated
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu xác thực' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 2: Check caller authorization
  IF NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = v_caller_id) THEN
    SELECT role INTO v_caller_role
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = v_caller_id;
    
    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
      RAISE EXCEPTION 'Chỉ admin của tenant hoặc system admin được thay đổi trạng thái' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Guard 3: Self-toggle guard
  IF v_caller_id = p_user_id THEN
    RAISE EXCEPTION 'Không thể tự thay đổi trạng thái kích hoạt của chính mình' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 4: Get target info
  SELECT tm.role, (t.owner_id = p_user_id) INTO v_target_role, v_is_owner
  FROM public.tenant_memberships tm
  JOIN public.tenants t ON t.id = tm.tenant_id
  WHERE tm.tenant_id = p_tenant_id AND tm.user_id = p_user_id;
  
  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Thành viên không tồn tại trong tenant này' USING ERRCODE = 'no_data_found';
  END IF;
  
  -- Guard 5: Cannot deactivate owner
  IF v_is_owner AND p_is_active = false THEN
    RAISE EXCEPTION 'Không thể vô hiệu hóa chủ sở hữu của tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 6: If deactivating admin, check last active admin
  IF v_target_role = 'admin' AND p_is_active = false THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id 
      AND role = 'admin' 
      AND user_id != p_user_id
      AND status IN ('active', 'pending')
      AND is_active = true;
    
    IF v_admin_count = 0 THEN
      RAISE EXCEPTION 'Không thể vô hiệu hóa admin duy nhất của tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Execute update
  UPDATE public.tenant_memberships
  SET is_active = p_is_active, updated_at = now()
  WHERE tenant_id = p_tenant_id AND user_id = p_user_id
  RETURNING * INTO v_row;
  
  -- Audit log
  INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data, new_data, ip_address)
  VALUES (p_tenant_id, v_caller_id, 'tenant_memberships', p_user_id, 'MEMBER_TOGGLE_ACTIVE',
          jsonb_build_object('is_active', NOT p_is_active),
          jsonb_build_object('is_active', p_is_active),
          current_setting('request.headers')::jsonb->>'x-forwarded-for');
  
  RETURN v_row;
END;
$$;