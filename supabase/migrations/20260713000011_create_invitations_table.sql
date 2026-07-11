-- Sub-Phase 5.1: Invitations table
-- Basejump reference: basejump-invitations pattern
-- ponytail: status enum + table + RLS; role stored as text so existing POS roles still flow through.

DO $$ BEGIN
  CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON public.invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invitations_select_for_members ON public.invitations;
CREATE POLICY invitations_select_for_members
  ON public.invitations FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.get_tenants_for_user())
    OR public.is_system_admin()
  );

DROP POLICY IF EXISTS invitations_insert_for_admins ON public.invitations;
CREATE POLICY invitations_insert_for_admins
  ON public.invitations FOR INSERT TO authenticated
  WITH CHECK (
    public.is_tenant_owner(tenant_id)
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

DROP POLICY IF EXISTS invitations_update_for_admins ON public.invitations;
CREATE POLICY invitations_update_for_admins
  ON public.invitations FOR UPDATE TO authenticated
  USING (
    public.is_tenant_owner(tenant_id)
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );

DROP POLICY IF EXISTS invitations_delete_for_admins ON public.invitations;
CREATE POLICY invitations_delete_for_admins
  ON public.invitations FOR DELETE TO authenticated
  USING (
    public.is_tenant_owner(tenant_id)
    OR public.has_tenant_role(tenant_id, 'admin')
    OR public.is_system_admin()
  );
