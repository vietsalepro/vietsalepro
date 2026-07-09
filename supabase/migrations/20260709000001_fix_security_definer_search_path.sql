-- F26 security review: ensure every SECURITY DEFINER routine in the public schema
-- sets search_path to public. This closes off search-path injection attacks where
-- an unqualified table reference could resolve to a malicious object in a different
-- schema.
-- ponytail: one-shot idempotent migration; ALTER FUNCTION ... SET only changes the
-- option, so rerunning is harmless.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS fn_signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM unnest(p.proconfig) AS cfg
          WHERE cfg LIKE 'search_path=public%'
        )
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.fn_signature);
  END LOOP;
END $$;
