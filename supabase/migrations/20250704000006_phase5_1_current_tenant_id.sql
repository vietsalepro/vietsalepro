-- Sub-phase 5.1: Helper functions + custom fetch wrapper
-- Returns the tenant_id passed in via the x-tenant-id request header.

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_header TEXT;
  v_tenant_id UUID;
BEGIN
  v_header := nullif(current_setting('request.headers', true)::json->>'x-tenant-id', '');
  IF v_header IS NULL THEN RETURN NULL; END IF;
  BEGIN
    v_tenant_id := v_header::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    v_tenant_id := NULL;
  END;
  RETURN v_tenant_id;
END;
$$;
