-- F33 P5: auto-activate pending memberships on first sign-in
-- Scope: create a SECURITY DEFINER RPC that flips a user's pending memberships to active.
-- ponytail: idempotent CREATE OR REPLACE; called from AuthContext on SIGNED_IN with .catch(() => {}).

CREATE OR REPLACE FUNCTION public.activate_pending_memberships(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tenant_memberships
  SET status = 'active', accepted_at = COALESCE(accepted_at, now())
  WHERE user_id = p_user_id AND status = 'pending';
END;
$$;
