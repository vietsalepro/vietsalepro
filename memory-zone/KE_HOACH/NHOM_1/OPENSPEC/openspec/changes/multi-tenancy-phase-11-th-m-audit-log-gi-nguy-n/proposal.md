## Why

Ghi log các thao tác quan trọng.

## What Changes

- Code changes:
  - `services/auditService.ts`: hàm `writeAuditLog` để ghi thủ công các sự kiện không có trigger (`LOGIN`, `LOGOUT`, `EXPORT`). Hàm này cũng điền `ip_address` và `user_agent` từ request headers (chỉ khi gọi từ Edge Function) hoặc để NULL nếu không có.
  - Page xem audit log (chỉ admin/system admin).
  - Trong `AuthContext`: gọi `writeAuditLog('LOGIN')` sau đăng nhập thành công và `writeAuditLog('LOGOUT')` trước sign out.
  - Lưu ý: trigger tự động không điền `ip_address`/`user_agent` vì trong PostgreSQL trigger không dễ lấy thông tin request; các log thủ công mới điền.
- SQL migrations (see design.md for full scripts)

## Scope / Non-Goals

**In scope:**
- Sub-phase 11: Thêm audit log (giữ nguyên)
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `th-m-audit-log-gi-nguy-n`: Ghi log các thao tác quan trọng.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.