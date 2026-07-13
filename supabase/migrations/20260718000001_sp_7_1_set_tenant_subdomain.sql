-- SP-7.1: Subdomain availability check
-- RPC cho phép system admin cập nhật subdomain của một tenant.

CREATE OR REPLACE FUNCTION public.set_tenant_subdomain(
  p_tenant_id UUID,
  p_subdomain TEXT
)
RETURNS public.tenants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant public.tenants;
  v_normalized TEXT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật subdomain tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  v_normalized := lower(trim(p_subdomain));

  -- ponytail: regex đồng bộ với utils/subdomain.ts.
  IF v_normalized IS NULL OR v_normalized !~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$' THEN
    RAISE EXCEPTION 'Subdomain phải dài 3-63 ký tự, chỉ chứa chữ thường, số và dấu gạch ngang, không bắt đầu/kết thúc bằng gạch ngang';
  END IF;

  IF v_normalized IN ('admin', 'www', 'api', 'app') THEN
    RAISE EXCEPTION 'Subdomain "%" thuộc danh sách dự trữ', v_normalized;
  END IF;

  -- ponytail: từ chối nếu subdomain đã dùng bởi tenant khác chưa bị archived.
  IF EXISTS (
    SELECT 1 FROM public.tenants
    WHERE subdomain = v_normalized
      AND id <> p_tenant_id
      AND status <> 'archived'
  ) THEN
    RAISE EXCEPTION 'Subdomain đã được sử dụng';
  END IF;

  UPDATE public.tenants
  SET subdomain = v_normalized, updated_at = now()
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  -- ponytail: ghi audit log thay đổi subdomain.
  INSERT INTO public.audit_log (tenant_id, actor_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    v_tenant.id,
    auth.uid(),
    'UPDATE',
    'tenant_subdomain',
    v_tenant.id,
    jsonb_build_object('subdomain', v_tenant.subdomain),
    jsonb_build_object('subdomain', v_normalized)
  );

  RETURN v_tenant;
END;
$$;
