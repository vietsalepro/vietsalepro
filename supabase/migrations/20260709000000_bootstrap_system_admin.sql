-- F20: Bootstrap system admin
-- ponytail: placeholder email -- replace with the real admin email
-- before the first deploy, or update the email/password via the
-- Supabase dashboard immediately after deploy. The password is
-- generated randomly inside the DB and is never written to source.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_email TEXT := 'admin@example.com'; -- TODO: replace with the real admin email before deploy
  v_user_id UUID;
  v_random_password TEXT := extensions.gen_random_uuid()::text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.system_admins) THEN
    RETURN;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    )
    VALUES (
      extensions.gen_random_uuid(),
      v_email,
      extensions.crypt(v_random_password, extensions.gen_salt('bf')),
      now(),
      now(),
      now()
    )
    RETURNING id INTO v_user_id;
  END IF;

  INSERT INTO public.system_admins (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END $$;
