-- Migration: 20260722000000_sp2_8_role_management_rpc.sql
-- SP-2.8: Team/Role Management page RPCs
-- ponytail: minimal CRUD for admin roles and user-role assignments, with predefined permissions only.

-- ============================================================
-- 1. Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.admin_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_name ON public.admin_roles(name);
CREATE INDEX IF NOT EXISTS idx_admin_role_assignments_user_id ON public.admin_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_assignments_role_id ON public.admin_role_assignments(role_id);

-- ponytail: enforce predefined permission values at the database boundary.
ALTER TABLE public.admin_roles
DROP CONSTRAINT IF EXISTS admin_roles_permissions_check;
ALTER TABLE public.admin_roles
ADD CONSTRAINT admin_roles_permissions_check
CHECK (
  permissions <@ ARRAY[
    'tenant:read','tenant:write','tenant:delete',
    'billing:read','billing:write',
    'member:read','member:invite','member:remove','member:change_role',
    'settings:read','settings:write',
    'audit:read',
    'analytics:read',
    'system:admin'
  ]
);

-- ponytail: keep updated_at fresh without adding a new dependency.
CREATE OR REPLACE FUNCTION public.trg_admin_roles_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_roles_set_updated_at ON public.admin_roles;
CREATE TRIGGER admin_roles_set_updated_at
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_admin_roles_set_updated_at();

-- ============================================================
-- 2. RLS
-- ============================================================

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_roles_system_admin_all ON public.admin_roles;
CREATE POLICY admin_roles_system_admin_all ON public.admin_roles
  FOR ALL TO authenticated
  USING (public.is_system_admin())
  WITH CHECK (public.is_system_admin());

DROP POLICY IF EXISTS admin_role_assignments_system_admin_all ON public.admin_role_assignments;
CREATE POLICY admin_role_assignments_system_admin_all ON public.admin_role_assignments
  FOR ALL TO authenticated
  USING (public.is_system_admin())
  WITH CHECK (public.is_system_admin());

-- ============================================================
-- 3. Seed default system role
-- ============================================================

INSERT INTO public.admin_roles (name, description, permissions, is_system)
VALUES (
  'Quản trị viên',
  'Toàn quyền quản lý hệ thống',
  ARRAY[
    'tenant:read','tenant:write','tenant:delete',
    'billing:read','billing:write',
    'member:read','member:invite','member:remove','member:change_role',
    'settings:read','settings:write',
    'audit:read',
    'analytics:read',
    'system:admin'
  ],
  true
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 4. RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_admin_roles()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem vai trò' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN json_build_object(
    'items', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT id, name, description, permissions, is_system, created_at, updated_at
        FROM public.admin_roles
        ORDER BY created_at DESC
      ) t
    ),
    'total', (SELECT COUNT(*) FROM public.admin_roles)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_admin_role(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_permissions TEXT[] DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.admin_roles%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo vai trò' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Tên vai trò không được để trống';
  END IF;

  IF EXISTS (SELECT 1 FROM public.admin_roles WHERE name = trim(p_name)) THEN
    RAISE EXCEPTION 'Vai trò đã tồn tại: %', trim(p_name);
  END IF;

  INSERT INTO public.admin_roles (name, description, permissions)
  VALUES (trim(p_name), p_description, COALESCE(p_permissions, '{}'))
  RETURNING * INTO v_row;

  INSERT INTO public.app_audit_log (user_id, table_name, record_id, action, new_data)
  VALUES (auth.uid(), 'admin_roles', v_row.id::text, 'INSERT', row_to_json(v_row)::jsonb);

  RETURN row_to_json(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_admin_role(
  p_role_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_permissions TEXT[] DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.admin_roles%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật vai trò' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_role_id IS NULL THEN
    RAISE EXCEPTION 'Role ID không được để trống';
  END IF;

  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Tên vai trò không được để trống';
  END IF;

  SELECT * INTO v_row FROM public.admin_roles WHERE id = p_role_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy vai trò: %', p_role_id;
  END IF;

  IF v_row.is_system THEN
    RAISE EXCEPTION 'Không thể sửa vai trò hệ thống: %', v_row.name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE name = trim(p_name) AND id <> p_role_id
  ) THEN
    RAISE EXCEPTION 'Tên vai trò đã được sử dụng: %', trim(p_name);
  END IF;

  UPDATE public.admin_roles
  SET name = trim(p_name),
      description = p_description,
      permissions = COALESCE(p_permissions, '{}')
  WHERE id = p_role_id
  RETURNING * INTO v_row;

  INSERT INTO public.app_audit_log (user_id, table_name, record_id, action, new_data)
  VALUES (auth.uid(), 'admin_roles', v_row.id::text, 'UPDATE', row_to_json(v_row)::jsonb);

  RETURN row_to_json(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_admin_role(p_role_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.admin_roles%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa vai trò' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_role_id IS NULL THEN
    RAISE EXCEPTION 'Role ID không được để trống';
  END IF;

  SELECT * INTO v_row FROM public.admin_roles WHERE id = p_role_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy vai trò: %', p_role_id;
  END IF;

  IF v_row.is_system THEN
    RAISE EXCEPTION 'Không thể xóa vai trò hệ thống: %', v_row.name;
  END IF;

  DELETE FROM public.admin_role_assignments WHERE role_id = p_role_id;

  DELETE FROM public.admin_roles WHERE id = p_role_id;

  INSERT INTO public.app_audit_log (user_id, table_name, record_id, action, old_data)
  VALUES (auth.uid(), 'admin_roles', p_role_id::text, 'DELETE', row_to_json(v_row)::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_users_with_admin_roles(
  p_search TEXT DEFAULT NULL,
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
    RAISE EXCEPTION 'Chỉ system admin mới được xem phân quyền người dùng' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_page IS NULL OR p_page < 1 THEN
    RAISE EXCEPTION 'Trang phải >= 1';
  END IF;

  IF p_page_size IS NULL OR p_page_size <= 0 THEN
    RAISE EXCEPTION 'Kích thước trang phải > 0';
  END IF;

  IF p_page_size > 1000 THEN
    RAISE EXCEPTION 'Kích thước trang tối đa là 1000';
  END IF;

  v_offset := (p_page - 1) * p_page_size;

  SELECT COUNT(*)
  INTO v_total
  FROM auth.users u
  WHERE (p_search IS NULL OR p_search = '' OR u.email ILIKE '%' || replace(replace(replace(p_search, '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\');

  RETURN json_build_object(
    'items', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          u.id,
          u.email,
          CASE
            WHEN COALESCE((u.raw_app_meta_data->>'disabled')::boolean, false) THEN 'disabled'
            ELSE 'active'
          END AS status,
          (
            SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json)
            FROM public.admin_role_assignments ara
            JOIN public.admin_roles r ON r.id = ara.role_id
            WHERE ara.user_id = u.id
          ) AS roles
        FROM auth.users u
        WHERE (p_search IS NULL OR p_search = '' OR u.email ILIKE '%' || replace(replace(replace(p_search, '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\')
        ORDER BY u.created_at DESC
        LIMIT p_page_size
        OFFSET v_offset
      ) t
    ),
    'total', v_total
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_admin_role(
  p_user_id UUID,
  p_role_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INTEGER;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được gán vai trò' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_user_id IS NULL OR p_role_id IS NULL THEN
    RAISE EXCEPTION 'User ID và Role ID không được để trống';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Không tìm thấy user: %', p_user_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.admin_roles WHERE id = p_role_id) THEN
    RAISE EXCEPTION 'Không tìm thấy vai trò: %', p_role_id;
  END IF;

  INSERT INTO public.admin_role_assignments (user_id, role_id)
  VALUES (p_user_id, p_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted > 0 THEN
    INSERT INTO public.app_audit_log (user_id, table_name, record_id, action, new_data)
    VALUES (
      auth.uid(),
      'admin_role_assignments',
      p_user_id::text,
      'INSERT',
      jsonb_build_object('user_id', p_user_id, 'role_id', p_role_id)
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_admin_role(
  p_user_id UUID,
  p_role_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được gỡ vai trò' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_user_id IS NULL OR p_role_id IS NULL THEN
    RAISE EXCEPTION 'User ID và Role ID không được để trống';
  END IF;

  DELETE FROM public.admin_role_assignments
  WHERE user_id = p_user_id AND role_id = p_role_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted > 0 THEN
    INSERT INTO public.app_audit_log (user_id, table_name, record_id, action, old_data)
    VALUES (
      auth.uid(),
      'admin_role_assignments',
      p_user_id::text,
      'DELETE',
      jsonb_build_object('user_id', p_user_id, 'role_id', p_role_id)
    );
  END IF;
END;
$$;

-- ============================================================
-- 5. Comments
-- ============================================================

COMMENT ON FUNCTION public.get_admin_roles IS 'Liệt kê các admin role (chỉ system admin). Trả về { items: [...], total: number }.';
COMMENT ON FUNCTION public.create_admin_role IS 'Tạo admin role mới với predefined permissions.';
COMMENT ON FUNCTION public.update_admin_role IS 'Cập nhật admin role; từ chối sửa vai trò hệ thống.';
COMMENT ON FUNCTION public.delete_admin_role IS 'Xóa admin role và các assignment; từ chối xóa vai trò hệ thống.';
COMMENT ON FUNCTION public.get_users_with_admin_roles IS 'Liệt kê users kèm admin roles (chỉ system admin). Trả về { items: [...], total: number }.';
COMMENT ON FUNCTION public.assign_admin_role IS 'Gán admin role cho user.';
COMMENT ON FUNCTION public.remove_admin_role IS 'Gỡ admin role khỏi user.';
