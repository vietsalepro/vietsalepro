## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_1_<YYYYMMDD_HHMMSS>`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 1: Dọn dẹp bảo mật hiện tại (giữ nguyên)

- [x] 1.1 Run SQL migration block(s) for this sub-phase
- [x] 1.2 `Login.tsx`: không có link đăng ký
- [x] 1.3 Không commit `VITE_SUPABASE_SERVICE_ROLE_KEY`

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] User đã đăng nhập vẫn thấy dữ liệu
- [x] User chưa đăng nhập bị chặn
- [x] `supabase.auth.signUp` bị từ chối

## 3. Staging Deployment

- [x] Mirror production → staging (`public.products` = 197, `public.orders` = 46)
- [x] Run `migration_phase1_security_cleanup.sql` trên staging
- [x] Push auth config Phase 1 (site_url, redirect URLs, disable signup) lên staging
- [x] Kiểm thử staging: anon bị chặn, signup disabled, authenticated REST sign-in thấy data
- [x] Dọn dẹp file dump mirror và user test tạm

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_1_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.