-- SP-7.2: Custom domain verification via DNS TXT

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS custom_domain_verification_token TEXT,
  ADD COLUMN IF NOT EXISTS custom_domain_verified_at TIMESTAMPTZ;

-- Atomic token generation avoids race conditions when multiple edge-function
-- invocations try to create the first token for the same tenant.
CREATE OR REPLACE FUNCTION public.get_or_create_custom_domain_token(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
BEGIN
  UPDATE public.tenants
  SET custom_domain_verification_token = COALESCE(
    custom_domain_verification_token,
    lower(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
  )
  WHERE id = p_tenant_id
  RETURNING custom_domain_verification_token INTO v_token;

  IF v_token IS NULL THEN
    RAISE EXCEPTION 'Tenant không tồn tại';
  END IF;

  RETURN v_token;
END;
$$;
