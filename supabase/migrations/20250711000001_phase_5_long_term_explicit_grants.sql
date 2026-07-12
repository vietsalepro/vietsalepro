-- Phase 5 Long-term hardening: explicit GRANTs for all public functions.
-- ponytail: one-time remediation. New migrations should still include per-function
-- REVOKE/GRANT blocks; this script backfills existing functions.

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname NOT LIKE 'pg_%'
      AND p.prokind = 'f'
  LOOP
    -- Prevent blanket PUBLIC access; only authenticated and service_role can execute.
    EXECUTE format(
      'REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC; '
      'GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated; '
      'GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role;',
      fn.proname, fn.args,
      fn.proname, fn.args,
      fn.proname, fn.args
    );
  END LOOP;
END $$;
