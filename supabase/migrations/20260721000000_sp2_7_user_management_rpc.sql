-- Migration: 20260721000000_sp2_7_user_management_rpc.sql
-- SP-2.7: User Management page RPCs
-- ponytail: exposes minimal, paginated user listing and status toggle for system admins only.
-- Status is stored in auth.users.raw_app_meta_data.disabled so future login flows can enforce it.

CREATE OR REPLACE FUNCTION public.get_users(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER;
  v_total INTEGER;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem danh sách người dùng' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_offset := GREATEST((p_page - 1) * p_page_size, 0);

  SELECT COUNT(*)
  INTO v_total
  FROM auth.users u
  WHERE (p_search IS NULL OR p_search = '' OR u.email ILIKE '%' || replace(replace(replace(p_search, '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\')
    AND (
      p_status IS NULL
      OR p_status = ''
      OR p_status = 'all'
      OR (
        p_status = 'disabled'
        AND COALESCE((u.raw_app_meta_data->>'disabled')::boolean, false) = true
      )
      OR (
        p_status = 'active'
        AND COALESCE((u.raw_app_meta_data->>'disabled')::boolean, false) = false
      )
    );

  RETURN json_build_object(
    'items', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          u.id,
          u.email,
          u.created_at,
          u.last_sign_in_at,
          CASE
            WHEN COALESCE((u.raw_app_meta_data->>'disabled')::boolean, false) THEN 'disabled'
            ELSE 'active'
          END AS status
        FROM auth.users u
        WHERE (p_search IS NULL OR p_search = '' OR u.email ILIKE '%' || replace(replace(replace(p_search, '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\')
          AND (
            p_status IS NULL
            OR p_status = ''
            OR p_status = 'all'
            OR (
              p_status = 'disabled'
              AND COALESCE((u.raw_app_meta_data->>'disabled')::boolean, false) = true
            )
            OR (
              p_status = 'active'
              AND COALESCE((u.raw_app_meta_data->>'disabled')::boolean, false) = false
            )
          )
        ORDER BY u.created_at DESC
        LIMIT p_page_size
        OFFSET v_offset
      ) t
    ),
    'total', v_total
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_status(
  p_user_id UUID,
  p_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật trạng thái người dùng' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID không được để trống';
  END IF;

  IF p_status NOT IN ('active', 'disabled') THEN
    RAISE EXCEPTION 'Trạng thái không hợp lệ: %', p_status;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Không tìm thấy user: %', p_user_id;
  END IF;

  -- Refuse to disable the last system admin or any system admin via this RPC.
  IF p_status = 'disabled' AND EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Không thể vô hiệu hóa system admin. Xóa quyền system admin trước.';
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
                            || jsonb_build_object('disabled', (p_status = 'disabled'))
  WHERE id = p_user_id;

  SELECT json_build_object(
    'id', u.id,
    'email', u.email,
    'created_at', u.created_at,
    'last_sign_in_at', u.last_sign_in_at,
    'status', CASE
                WHEN COALESCE((u.raw_app_meta_data->>'disabled')::boolean, false) THEN 'disabled'
                ELSE 'active'
              END
  )
  INTO v_row
  FROM auth.users u
  WHERE u.id = p_user_id;

  -- Audit log
  INSERT INTO public.app_audit_log (user_id, table_name, record_id, action, new_data)
  VALUES (auth.uid(), 'auth.users', p_user_id, 'USER_STATUS_UPDATE',
          jsonb_build_object('status', p_status, 'target_user_id', p_user_id));

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.get_users IS 'Liệt kê người dùng hệ thống (chỉ system admin). Trả về { items: [...], total: number }.';
COMMENT ON FUNCTION public.update_user_status IS 'Cập nhật trạng thái active/disabled cho auth.users.raw_app_meta_data.disabled.';
