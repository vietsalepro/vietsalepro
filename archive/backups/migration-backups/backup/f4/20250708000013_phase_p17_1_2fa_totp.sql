-- P17.1: Admin dashboard — 2FA Google Authenticator (TOTP) + backup codes + manual override.
-- Uses Supabase Auth MFA native TOTP for primary 2FA and a custom admin_2fa_backup_codes
-- table for one-time recovery codes. Backup codes are stored as SHA-256 hashes and are
-- single-use. The manual override Edge Function uses service role to unenroll another
-- admin's factor after approval by a second system admin.
-- ponytail: backup-code verification happens server-side; successful use grants an AAL1
-- session because Supabase Auth does not mint AAL2 sessions from static recovery codes.
-- The app treats a verified backup code as sufficient for login; upgrade path is to
-- re-enroll TOTP after recovery.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Schema: admin 2FA backup codes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_2fa_backup_codes (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_code_hash UNIQUE (user_id, code_hash)
);

CREATE INDEX IF NOT EXISTS idx_admin_2fa_backup_codes_user_id ON public.admin_2fa_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_2fa_backup_codes_user_used ON public.admin_2fa_backup_codes(user_id, used_at);

ALTER TABLE public.admin_2fa_backup_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_2fa_backup_codes' AND policyname = 'admin_2fa_backup_codes_owner_all'
  ) THEN
    CREATE POLICY "admin_2fa_backup_codes_owner_all"
      ON public.admin_2fa_backup_codes FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 2. Helpers
-- ============================================================

-- Check whether a user has a verified TOTP factor enrolled.
-- SECURITY DEFINER so it can read auth.mfa_factors without exposing the schema.
CREATE OR REPLACE FUNCTION public.is_2fa_enabled(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.mfa_factors
    WHERE user_id = p_user_id
      AND status = 'verified'
      AND factor_type = 'totp'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_2fa_enabled(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_2fa_enabled(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_2fa_enabled(UUID) TO service_role;

-- ============================================================
-- 3. RPC: generate backup codes
-- Only the owning user can generate codes for themselves.
-- Returns the plaintext codes once; hashes are persisted.
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_2fa_backup_codes(
  p_user_id UUID,
  p_count INTEGER DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_codes TEXT[] := ARRAY[]::TEXT[];
  v_code TEXT;
  v_hash TEXT;
  v_i INTEGER;
  v_count INTEGER := GREATEST(1, LEAST(COALESCE(p_count, 10), 20));
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu user_id';
  END IF;

  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Chỉ người dùng hiện tại mới được tạo backup code cho chính mình' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Xóa code cũ chưa dùng (nếu user tạo lại, ví dụ lúc setup lại 2FA).
  DELETE FROM public.admin_2fa_backup_codes
  WHERE user_id = p_user_id AND used_at IS NULL;

  v_i := 0;
  WHILE v_i < v_count LOOP
    v_code := upper(encode(extensions.gen_random_bytes(4), 'hex'));
    v_hash := encode(extensions.digest(v_code, 'sha256'), 'hex');

    BEGIN
      INSERT INTO public.admin_2fa_backup_codes (user_id, code_hash)
      VALUES (p_user_id, v_hash);
      v_codes := array_append(v_codes, v_code);
      v_i := v_i + 1;
    EXCEPTION WHEN unique_violation THEN
      -- ponytail: trùng hash cực hiếm; thử lại với code mới.
      CONTINUE;
    END;
  END LOOP;

  RETURN json_build_object('user_id', p_user_id, 'codes', v_codes);
END;
$$;

REVOKE ALL ON FUNCTION public.generate_2fa_backup_codes(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_2fa_backup_codes(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_2fa_backup_codes(UUID, INTEGER) TO service_role;

-- ============================================================
-- 4. RPC: verify a backup code
-- Called during login. Marks the code as used if valid.
-- Returns { valid: boolean, code_id: uuid|null }.
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_2fa_backup_code(
  p_user_id UUID,
  p_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash TEXT;
  v_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_code IS NULL THEN
    RETURN json_build_object('valid', false, 'code_id', NULL);
  END IF;

  v_hash := encode(extensions.digest(upper(p_code), 'sha256'), 'hex');

  SELECT id INTO v_id
  FROM public.admin_2fa_backup_codes
  WHERE user_id = p_user_id
    AND code_hash = v_hash
    AND used_at IS NULL
  FOR UPDATE;

  IF v_id IS NULL THEN
    RETURN json_build_object('valid', false, 'code_id', NULL);
  END IF;

  UPDATE public.admin_2fa_backup_codes
  SET used_at = now()
  WHERE id = v_id;

  RETURN json_build_object('valid', true, 'code_id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.verify_2fa_backup_code(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_2fa_backup_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_2fa_backup_code(UUID, TEXT) TO service_role;

-- ============================================================
-- 5. RPC: list remaining backup codes
-- Returns hashes of unused codes so the UI can show how many are left.
-- ============================================================

CREATE OR REPLACE FUNCTION public.list_2fa_backup_codes(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN '[]'::json;
  END IF;

  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Không được xem backup code của người khác' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT id, created_at AS createdAt
      FROM public.admin_2fa_backup_codes
      WHERE user_id = p_user_id AND used_at IS NULL
      ORDER BY created_at
    ) t
  );
END;
$$;

REVOKE ALL ON FUNCTION public.list_2fa_backup_codes(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_2fa_backup_codes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_2fa_backup_codes(UUID) TO service_role;

-- ============================================================
-- 6. RPC: delete backup codes (used when disabling 2FA)
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_2fa_backup_codes(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Chỉ người dùng hiện tại mới được xóa backup code của chính mình' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.admin_2fa_backup_codes WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_2fa_backup_codes(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_2fa_backup_codes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_2fa_backup_codes(UUID) TO service_role;
