## Why

Admin/system admin reset/invite password cho nhân viên.

## What Changes

- Output files:
  - `supabase/functions/reset-password/index.ts`
- Logic:
  - Kiểm tra caller là admin của tenant hoặc system admin.
  - Kiểm tra user thuộc tenant (qua `tenant_memberships`).
  - Nếu user đã từng đăng nhập: gọi `supabase.auth.admin.generateLink('recovery', email, { redirect_to: https://{subdomain}.vietsalepro.com/reset-password })`.
  - Nếu user mới chưa đăng nhập: gọi `generateLink('invite', email, { redirect_to: https://{subdomain}.vietsalepro.com/set-password })`.
  - Gửi email thông qua email provider mặc định của Supabase.

## Scope / Non-Goals

**In scope:**
- Sub-phase 9.4: `reset-password`
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `reset-password`: Admin/system admin reset/invite password cho nhân viên.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.