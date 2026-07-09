-- Sub-phase 15: Staging test fixes
-- Discovered during Phase 15 staging tests.

-- 1. Suspend tenant isolation: is_tenant_member must only return true for active tenants.
--    Before this fix, a suspended tenant's members could still read/write data.
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships tm
    JOIN public.tenants t ON t.id = tm.tenant_id
    WHERE tm.tenant_id = p_tenant_id AND tm.user_id = auth.uid() AND t.status = 'active'
  );
$$;

-- 2. Storage bucket and tenant-isolated RLS policies for tenant assets.
--    This is required for the Phase 15 storage RLS checklist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-assets', 'tenant-assets', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS tenant_storage_select ON storage.objects;
DROP POLICY IF EXISTS tenant_storage_insert ON storage.objects;
DROP POLICY IF EXISTS tenant_storage_delete ON storage.objects;

CREATE POLICY tenant_storage_select ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
  AND public.is_tenant_member(public.current_tenant_id())
);

CREATE POLICY tenant_storage_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
  AND public.is_tenant_member(public.current_tenant_id())
);

CREATE POLICY tenant_storage_delete ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
  AND public.is_tenant_admin(public.current_tenant_id())
);
