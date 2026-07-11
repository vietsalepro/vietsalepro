## Context

This change implements sub-phase 1: Dọn dẹp bảo mật hiện tại (giữ nguyên) from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- Xóa policy public, tắt self-registration, đóng social providers.

- Code changes:
  - `Login.tsx`: không có link đăng ký
  - Không commit `VITE_SUPABASE_SERVICE_ROLE_KEY`

**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  DROP POLICY IF EXISTS "Allow public access" ON public.products;
  DROP POLICY IF EXISTS "Public Access" ON public.products;
  -- Lặp lại cho tất cả bảng kinh doanh
  
  CREATE POLICY "authenticated_full_access_temp"
  ON public.products FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.