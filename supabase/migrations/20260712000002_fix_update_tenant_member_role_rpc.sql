-- Fix: [3.2] updateMemberRole() KHÔNG có auth check
-- Tạo RPC SECURITY DEFINER để thay thế direct update
-- ponytail: SECURITY DEFINER + 6 guard layers + audit log + validation

CREATE OR REPLACE FUNCTION public.update_tenant_member_role(
  p_tenant_id UUID,
  p_user_id UUID,
  p_role TEXT
) RETURNS public.tenant_memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_old_role TEXT;
  v_admin_count INT;
  v_is_owner BOOLEAN;
  v_row public.tenant_memberships;
BEGIN
  v_caller_id := auth.uid();
  
  -- Guard 1: Authenticated
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu xác thực' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 2: Validate role
  IF p_role NOT IN ('admin', 'cashier', 'inventory_manager', 'accountant') THEN
    RAISE EXCEPTION 'Vai trò không hợp lệ. Chỉ chấp nhận: admin, cashier, inventory_manager, accountant' USING ERRCODE = 'check_violation';
  END IF;
  
  -- Guard 3: Check caller authorization
  IF NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = v_caller_id) THEN
    SELECT role INTO v_caller_role
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = v_caller_id;
    
    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
      RAISE EXCEPTION 'Chỉ admin của tenant hoặc system admin được đổi vai trò' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Guard 4: Self-demote guard
  IF v_caller_id = p_user_id THEN
    RAISE EXCEPTION 'Không thể tự đổi vai trò của chính mình' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 5: Get current role and owner status
  SELECT tm.role, (t.owner_id = p_user_id) INTO v_old_role, v_is_owner
  FROM public.tenant_memberships tm
  JOIN public.tenants t ON t.id = tm.tenant_id
  WHERE tm.tenant_id = p_tenant_id AND tm.user_id = p_user_id;
  
  IF v_old_role IS NULL THEN
    RAISE EXCEPTION 'Thành viên không tồn tại trong tenant này' USING ERRCODE = 'no_data_found';
  END IF;
  
  -- Guard 6: Cannot change owner's role
  IF v_is_owner THEN
    RAISE EXCEPTION 'Không thể đổi vai trò của chủ sở hữu tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 7: If demoting from admin, check last admin (chỉ tính active + is_active = true)
  IF v_old_role = 'admin' AND p_role != 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id 
      AND role = 'admin' 
      AND user_id != p_user_id
      AND status IN ('active', 'pending')
      AND is_active = true;
    
    IF v_admin_count = 0 THEN
      RAISE EXCEPTION 'Không thể hạ role admin duy nhất của tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Execute update
  UPDATE public.tenant_memberships
  SET role = p_role, updated_at = now()
  WHERE tenant_id = p_tenant_id AND user_id = p_user_id
  RETURNING * INTO v_row;
  
  -- Audit log
  INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data, new_data, ip_address)
  VALUES (p_tenant_id, v_caller_id, 'tenant_memberships', p_user_id, 'MEMBER_ROLE_CHANGE', 
          jsonb_build_object('old_role', v_old_role, 'new_role', p_role),
          jsonb_build_object('old_role', v_old_role, 'new_role', p_role),
          current_setting('request.headers')::jsonb->>'x-forwarded-for');
  
  RETURN v_row;
END;
$$;