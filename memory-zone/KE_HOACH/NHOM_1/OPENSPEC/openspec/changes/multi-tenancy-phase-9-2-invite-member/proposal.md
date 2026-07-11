## Why

Admin tenant mời nhân viên.

## What Changes

- Output files:
  - `supabase/functions/invite-member/index.ts`
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

## Scope / Non-Goals

**In scope:**
- Sub-phase 9.2: `invite-member`
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `invite-member`: Admin tenant mời nhân viên.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.