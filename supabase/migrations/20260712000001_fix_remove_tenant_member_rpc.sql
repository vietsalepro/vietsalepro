-- Fix: [3.1] removeMember() KHÔNG có auth check
-- Tạo RPC SECURITY DEFINER để thay thế direct delete
-- ponytail: SECURITY DEFINER + 6 guard layers + audit log

CREATE OR REPLACE FUNCTION public.remove_tenant_member(
  p_tenant_id UUID,
  p_user_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_target_role TEXT;
  v_admin_count INT;
  v_is_owner BOOLEAN;
  v_membership_exists BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  
  -- Guard 1: Caller must be authenticated
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu xác thực' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 2: Check caller is system admin OR tenant admin
  IF NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = v_caller_id) THEN
    SELECT role INTO v_caller_role
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = v_caller_id;
    
    IF v_caller_role IS NULL THEN
      RAISE EXCEPTION 'Bạn không phải thành viên của tenant này' USING ERRCODE = 'insufficient_privilege';
    END IF;
    
    IF v_caller_role != 'admin' THEN
      RAISE EXCEPTION 'Chỉ admin của tenant hoặc system admin được xóa thành viên' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Guard 3: Check target membership exists
  SELECT EXISTS(
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id
  ) INTO v_membership_exists;
  
  IF NOT v_membership_exists THEN
    RAISE EXCEPTION 'Thành viên không tồn tại trong tenant này' USING ERRCODE = 'no_data_found';
  END IF;
  
  -- Guard 4: Self-delete guard
  IF v_caller_id = p_user_id THEN
    RAISE EXCEPTION 'Không thể tự xóa chính mình khỏi tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 5: Owner guard
  SELECT tm.role, (t.owner_id = p_user_id) INTO v_target_role, v_is_owner
  FROM public.tenant_memberships tm
  JOIN public.tenants t ON t.id = tm.tenant_id
  WHERE tm.tenant_id = p_tenant_id AND tm.user_id = p_user_id;
  
  IF v_is_owner THEN
    RAISE EXCEPTION 'Không thể xóa chủ sở hữu của tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 6: Last admin guard (chỉ tính admin active + is_active = true)
  IF v_target_role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id 
      AND role = 'admin' 
      AND user_id != p_user_id
      AND status IN ('active', 'pending')
      AND is_active = true;
    
    IF v_admin_count = 0 THEN
      RAISE EXCEPTION 'Không thể xóa admin duy nhất của tenant' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Execute delete
  DELETE FROM public.tenant_memberships
  WHERE tenant_id = p_tenant_id AND user_id = p_user_id;
  
  -- Audit log
  INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data, ip_address)
  VALUES (p_tenant_id, v_caller_id, 'tenant_memberships', p_user_id, 'MEMBER_REMOVE', 
          jsonb_build_object('user_id', p_user_id, 'role', v_target_role),
          current_setting('request.headers')::jsonb->>'x-forwarded-for');
END;
$$;