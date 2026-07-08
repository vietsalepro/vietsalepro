-- Fix system admin functions to use SECURITY DEFINER
-- These functions need to read from auth.users table which requires elevated permissions
-- ponytail: change SECURITY INVOKER to SECURITY DEFINER for auth.users access

CREATE OR REPLACE FUNCTION public.get_system_admins()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER  -- Changed from SECURITY INVOKER to allow reading auth.users
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem danh sách system admin' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT sa.user_id, au.email, sa.created_at
      FROM public.system_admins sa
      JOIN auth.users au ON au.id = sa.user_id
      ORDER BY sa.created_at DESC
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.add_system_admin(
  p_user_id UUID
)
RETURNS public.system_admins
LANGUAGE plpgsql
SECURITY DEFINER  -- Changed from SECURITY INVOKER to allow reading auth.users
AS $$
DECLARE
  v_row public.system_admins;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được thêm system admin' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Không tìm thấy user: %', p_user_id;
  END IF;

  INSERT INTO public.system_admins (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
