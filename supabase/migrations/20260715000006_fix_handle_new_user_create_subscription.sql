-- Sub-Phase 6.1 follow-up: the handle_new_user trigger creates a personal tenant
-- but forgot to create the matching tenant_subscriptions row.
-- ponytail: this caused the membership-insert trigger check_tenant_limits() to fail
-- whenever auth.users was inserted directly (e.g. in pgtap tests).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_subdomain TEXT;
  v_name TEXT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User');
  v_subdomain := 'personal-' || lower(regexp_replace(split_part(COALESCE(NEW.email, 'user'), '@', 1), '[^a-z0-9]', '-', 'g')) || '-' || substr(NEW.id::text, 1, 8);

  INSERT INTO public.tenants (name, subdomain, status, plan, owner_id, settings, is_personal, created_by, updated_by)
  VALUES (v_name, v_subdomain, 'active', 'free', NEW.id, '{}'::jsonb, true, NEW.id, NEW.id)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.tenant_subscriptions (
    tenant_id,
    plan,
    status,
    plan_id,
    billing_period,
    billing_period_start,
    billing_period_end,
    expires_at
  ) VALUES (
    v_tenant_id,
    'free',
    'active',
    'free',
    'month',
    CURRENT_DATE,
    (CURRENT_DATE + INTERVAL '1 month')::DATE,
    (CURRENT_DATE + INTERVAL '1 month')::TIMESTAMPTZ
  );

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role, status, is_active, invited_at, accepted_at)
  VALUES (v_tenant_id, NEW.id, 'owner', 'active', true, now(), now());

  RETURN NEW;
END;
$$;
