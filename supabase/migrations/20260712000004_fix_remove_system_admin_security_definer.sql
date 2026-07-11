-- Fix: [3.4] addSystemAdmin() / removeSystemAdmin() - THIẾU SECURITY DEFINER
-- Fix: [7.1] remove_system_admin RPC vẫn dùng SECURITY INVOKER (P0)
-- Fix: [4.4] Xoá system admin cuối cùng không bị chặn
-- ponytail: SECURITY DEFINER + last admin guard + self-remove guard + audit log

CREATE OR REPLACE FUNCTION public.remove_system_admin(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Changed from SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_admin_count INT;
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  
  -- Guard 1: Must be authenticated
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu xác thực' USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- Guard 2: Must be system admin
  IF NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = v_caller_id) THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa system admin' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Guard 3: Cannot remove self
  IF p_user_id = v_caller_id THEN
    RAISE EXCEPTION 'Không thể tự xóa quyền system admin của chính mình' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Guard 4: Check last admin
  SELECT COUNT(*) INTO v_admin_count
  FROM public.system_admins
  WHERE user_id != p_user_id;

  IF v_admin_count = 0 THEN
    RAISE EXCEPTION 'Không thể xóa system admin cuối cùng' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Guard 5: Check target exists
  IF NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Không tìm thấy system admin: %', p_user_id USING ERRCODE = 'no_data_found';
  END IF;

  -- Execute delete
  DELETE FROM public.system_admins WHERE user_id = p_user_id;

  -- Audit log
  INSERT INTO public.app_audit_log (user_id, table_name, record_id, action, old_data)
  VALUES (v_caller_id, 'system_admins', p_user_id, 'SYSTEM_ADMIN_REMOVE',
          jsonb_build_object('removed_user_id', p_user_id, 'removed_by', v_caller_id));

  RETURN TRUE;
END;
$$;