## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_11_<YYYYMMDD_HHMMSS>`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 11: Thêm audit log (giữ nguyên)

> **Phase 7 deferred note:** Đảm bảo 3 ràng buộc từ `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md` Phase 7:
> - Trigger `write_audit_log` tự động chỉ ghi `INSERT`/`UPDATE`/`DELETE` với `old_data`/`new_data`.
> - `ip_address`/`user_agent` chỉ điền khi ghi log thủ công.
> - `LOGIN`/`LOGOUT`/`EXPORT` phải gọi `services/auditService.ts` và truyền IP/user agent từ Edge Function hoặc `NULL`.

- [x] 1.1 Run SQL migration block(s) for this sub-phase
- [x] 1.2 `services/auditService.ts`: hàm `writeAuditLog` để ghi thủ công các sự kiện không có trigger (`LOGIN`, `LOGOUT`, `EXPORT`). Hàm này cũng điền `ip_address` và `user_agent` từ request headers (chỉ khi gọi từ Edge Function) hoặc để NULL nếu không có.
- [x] 1.3 Page xem audit log (chỉ admin/system admin).
- [x] 1.4 Trong `AuthContext`: gọi `writeAuditLog('LOGIN')` sau đăng nhập thành công và `writeAuditLog('LOGOUT')` trước sign out.
- [x] 1.5 Lưu ý: trigger tự động không điền `ip_address`/`user_agent` vì trong PostgreSQL trigger không dễ lấy thông tin request; các log thủ công mới điền.

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] Mỗi thao tác quan trọng tạo 1 log row.
- [x] Chỉ admin/system admin xem được log.
- [x] DELETE log ghi đúng old_data, new_data = NULL.
- [x] INSERT log ghi đúng new_data, old_data = NULL.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_11_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
