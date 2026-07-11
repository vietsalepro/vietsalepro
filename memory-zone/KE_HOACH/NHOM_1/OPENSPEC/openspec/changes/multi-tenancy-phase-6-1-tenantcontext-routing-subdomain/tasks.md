## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_1_20260705_085052`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 6.1: TenantContext + routing/subdomain

- [x] 1.1 Subdomain `admin` hoặc root domain → không cần resolve tenant; routing riêng cho SystemAdminDashboard/LandingPage.
- [x] 1.2 Subdomain khác không tồn tại trong `tenants` → redirect `vietsalepro.com` hoặc 404.
- [x] 1.3 Tenant suspended → trang "Tài khoản đã bị tạm dừng".
- [x] 1.4 User không thuộc tenant → trang "Bạn không có quyền truy cập cửa hàng này".

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] Subdomain không tồn tại → 404
- [x] Tenant suspended → chặn đăng nhập
- [x] User không thuộc tenant → không vào được

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_1_20260705_085052`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.