## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_11_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 11: Thêm audit log (giữ nguyên)

- [ ] 1.1 Run SQL migration block(s) for this sub-phase
- [ ] 1.2 `services/auditService.ts`: hàm `writeAuditLog` để ghi thủ công các sự kiện không có trigger (`LOGIN`, `LOGOUT`, `EXPORT`). Hàm này cũng điền `ip_address` và `user_agent` từ request headers (chỉ khi gọi từ Edge Function) hoặc để NULL nếu không có.
- [ ] 1.3 Page xem audit log (chỉ admin/system admin).
- [ ] 1.4 Trong `AuthContext`: gọi `writeAuditLog('LOGIN')` sau đăng nhập thành công và `writeAuditLog('LOGOUT')` trước sign out.
- [ ] 1.5 Lưu ý: trigger tự động không điền `ip_address`/`user_agent` vì trong PostgreSQL trigger không dễ lấy thông tin request; các log thủ công mới điền.

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] Mỗi thao tác quan trọng tạo 1 log row.
- [ ] Chỉ admin/system admin xem được log.
- [ ] DELETE log ghi đúng old_data, new_data = NULL.
- [ ] INSERT log ghi đúng new_data, old_data = NULL.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_11_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.