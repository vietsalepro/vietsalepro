## Context

This change implements sub-phase 16: Deploy production from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- DNS/hosting/SSL, Storage RLS, migration, deploy, smoke test.


**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  CREATE POLICY "tenant_storage_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
    AND public.is_tenant_member(public.current_tenant_id())
  );
  
  CREATE POLICY "tenant_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
    AND public.is_tenant_member(public.current_tenant_id())
  );
  
  CREATE POLICY "tenant_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
    AND public.is_tenant_admin(public.current_tenant_id())
  );
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.