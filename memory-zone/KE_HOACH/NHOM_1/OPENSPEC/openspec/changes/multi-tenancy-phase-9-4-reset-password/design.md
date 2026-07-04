## Context

This change implements sub-phase 9.4: `reset-password` from the multi-tenancy migration plan.

Output files: `supabase/functions/reset-password/index.ts`

## Goals / Non-Goals

**Goals:**
- Admin/system admin reset/invite password cho nhân viên.

- Logic:
  - Kiểm tra caller là admin của tenant hoặc system admin.
  - Kiểm tra user thuộc tenant (qua `tenant_memberships`).
  - Nếu user đã từng đăng nhập: gọi `supabase.auth.admin.generateLink('recovery', email, { redirect_to: https://{subdomain}.vietsalepro.com/reset-password })`.
  - Nếu user mới chưa đăng nhập: gọi `generateLink('invite', email, { redirect_to: https://{subdomain}.vietsalepro.com/set-password })`.
  - Gửi email thông qua email provider mặc định của Supabase.

**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.