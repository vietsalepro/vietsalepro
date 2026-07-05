-- Phase 16: Production deploy — Storage RLS for tenant-assets bucket
-- ponytail: bucket is shared across all tenants, isolated by folder path tenant_id/...

-- Create the shared bucket if it does not exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-assets', 'tenant-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Drop any previous tenant storage policies to ensure a clean deploy.
DROP POLICY IF EXISTS tenant_storage_select ON storage.objects;
DROP POLICY IF EXISTS tenant_storage_insert ON storage.objects;
DROP POLICY IF EXISTS tenant_storage_delete ON storage.objects;

-- SELECT: members of the active tenant can read their own tenant folder only.
CREATE POLICY tenant_storage_select
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
  AND public.is_tenant_member(public.current_tenant_id())
);

-- INSERT: members of the active tenant can upload into their own tenant folder only.
CREATE POLICY tenant_storage_insert
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
  AND public.is_tenant_member(public.current_tenant_id())
);

-- DELETE: only tenant admins can delete objects inside their own tenant folder.
CREATE POLICY tenant_storage_delete
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
  AND public.is_tenant_admin(public.current_tenant_id())
);
