-- Sub-Phase 3.1: User tracking triggers
-- Basejump reference: Section 3.4 (personal tenant), 3.5 (user tracking)
-- ponytail: SECURITY DEFINER so the triggers can write user tracking regardless of caller RLS.

-- ============================================================
-- 1. Set created_by/updated_by on tenants
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_tenant_record_user_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
    NEW.updated_by := COALESCE(NEW.updated_by, auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by := COALESCE(NEW.updated_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_tenant_record_user_tracking ON public.tenants;
CREATE TRIGGER set_tenant_record_user_tracking
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_record_user_tracking();

-- ============================================================
-- 2. Auto-create a personal tenant + owner membership for every new user
-- ============================================================

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

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role, status, is_active, invited_at, accepted_at)
  VALUES (v_tenant_id, NEW.id, 'owner', 'active', true, now(), now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
CREATE TRIGGER handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
