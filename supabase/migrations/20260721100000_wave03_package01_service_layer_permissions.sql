-- Wave-03 Package-01: Service-layer permissions and admin_events producer policy.
-- Resolves PERM-003 (admin_events RLS and producer-policy gaps).
-- ponytail: authenticated system-admin producers need INSERT access to admin_events;
--           created_by is auto-populated from the session when not provided.

GRANT SELECT, INSERT ON public.admin_events TO authenticated;

CREATE OR REPLACE FUNCTION public.set_admin_events_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_events_set_created_by ON public.admin_events;
CREATE TRIGGER admin_events_set_created_by
  BEFORE INSERT ON public.admin_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_events_created_by();
