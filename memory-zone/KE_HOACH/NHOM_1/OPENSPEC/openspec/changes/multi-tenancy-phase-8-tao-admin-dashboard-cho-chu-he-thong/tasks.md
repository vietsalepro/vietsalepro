## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_8_<YYYYMMDD_HHMMSS>`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 8: Tạo admin dashboard cho chủ hệ thống (giữ nguyên)

- [x] 1.1 `pages/SystemAdminDashboard.tsx`
- [x] 1.2 Route `/admin/*` hoặc subdomain `admin.vietsalepro.com`
- [x] 1.3 RPC `create_tenant_with_admin`
- [x] 1.4 RPC `update_tenant_status`
- [x] 1.5 Chỉ `system_admins` truy cập

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] System admin tạo tenant
- [x] User thường không vào được admin dashboard

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_8_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.