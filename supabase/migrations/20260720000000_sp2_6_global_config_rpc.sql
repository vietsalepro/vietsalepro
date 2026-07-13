-- SP-2.6: Global Config page RPCs.
-- Global key/value configuration is stored in public.system_settings under the key 'global_config'.
-- ponytail: only system admins may read or mutate these global settings.

CREATE OR REPLACE FUNCTION public.get_global_config()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem cấu hình toàn cục' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN COALESCE((SELECT value FROM public.system_settings WHERE key = 'global_config'), '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_global_config(p_key TEXT, p_value JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật cấu hình toàn cục' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_key IS NULL OR TRIM(p_key) = '' THEN
    RAISE EXCEPTION 'Key không được để trống';
  END IF;

  v_config := COALESCE((SELECT value FROM public.system_settings WHERE key = 'global_config'), '{}'::jsonb);
  v_config := jsonb_set(v_config, ARRAY[TRIM(p_key)], COALESCE(p_value, 'null'::jsonb));

  INSERT INTO public.system_settings (key, value)
  VALUES ('global_config', v_config)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now();

  RETURN v_config;
END;
$$;
