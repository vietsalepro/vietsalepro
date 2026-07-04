## Context

This change implements sub-phase 5.1: Helper functions + custom fetch wrapper from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- `current_tenant_id()` từ header, `lib/tenant.ts`, `lib/supabase.ts` inject header.


**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  CREATE OR REPLACE FUNCTION public.current_tenant_id()
  RETURNS UUID LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
  DECLARE
    v_header TEXT;
    v_tenant_id UUID;
  BEGIN
    v_header := nullif(current_setting('request.headers', true)::json->>'x-tenant-id', '');
    IF v_header IS NULL THEN RETURN NULL; END IF;
    BEGIN
      v_tenant_id := v_header::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
      v_tenant_id := NULL;
    END;
    RETURN v_tenant_id;
  END;
  $$;
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.