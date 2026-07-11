-- Sub-Phase 6.1: pgTAP test helpers for the admin dashboard.
-- Basejump reference: Section 3.8 (tests.create_supabase_user, tests.authenticate_as).
-- ponytail: helpers are SECURITY DEFINER so they work from the postgres test runner role.

SELECT plan(1);

CREATE SCHEMA IF NOT EXISTS tests;

-- Allow the test runner (postgres) to assume Supabase API roles for RLS tests.
GRANT anon, authenticated TO postgres;

-- Make helpers callable from authenticated/anon sessions used during RLS tests.
GRANT USAGE ON SCHEMA tests TO authenticated, anon;

CREATE OR REPLACE FUNCTION tests.create_supabase_user(
  p_email TEXT,
  p_uid UUID DEFAULT gen_random_uuid()
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := p_uid;
BEGIN
  INSERT INTO auth.users (id, email, email_confirmed_at, raw_app_meta_data)
  VALUES (v_uid, p_email, now(), '{"provider":"email"}'::jsonb)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
  RETURNING id INTO v_uid;
  RETURN v_uid;
END;
$$;

CREATE OR REPLACE FUNCTION tests.authenticate_as(
  p_uid UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_uid::text, 'role', 'authenticated')::text,
    true
  );
END;
$$;

CREATE OR REPLACE FUNCTION tests.logout() RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);
END;
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO authenticated, anon;

SELECT ok(true, 'test helpers loaded');
SELECT * FROM finish();
