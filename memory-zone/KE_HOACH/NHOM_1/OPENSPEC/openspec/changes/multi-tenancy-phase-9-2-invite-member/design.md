## Context

This change implements sub-phase 9.2: `invite-member` from the multi-tenancy migration plan.

Output files: `supabase/functions/invite-member/index.ts`

## Goals / Non-Goals

**Goals:**
- Admin tenant mời nhân viên.

- Logic:
  - Rate limiting: 10 request/phút/IP.
  - Kiểm tra caller là admin của tenant (qua `tenant_memberships` role = 'admin').
  - Kiểm tra giới hạn số user trong `tenant_subscriptions`.
  - Nếu email đã tồn tại trong `auth.users`:
  - Kiểm tra user chưa thuộc tenant (tránh duplicate membership).
  - Thêm `tenant_memberships` với role được giao.
  - Nếu email chưa tồn tại:
  - Tạo user mới bằng `supabase.auth.admin.createUser({ email, password: crypto.randomUUID(), email_confirm: false })`.
  - Gửi password reset link qua `supabase.auth.admin.generateLink('recovery', email, { redirect_to: https://{subdomain}.vietsalepro.com/set-password })` để user tự đặt mật khẩu.
  - Thêm `tenant_memberships` với role được giao.
  - Ghi audit log.
  - Trả về `{ success: true, userId }`.

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