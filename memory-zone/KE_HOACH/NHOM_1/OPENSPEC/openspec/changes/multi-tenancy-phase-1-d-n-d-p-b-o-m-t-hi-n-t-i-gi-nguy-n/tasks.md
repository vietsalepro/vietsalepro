## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_1_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 1: Dọn dẹp bảo mật hiện tại (giữ nguyên)

- [ ] 1.1 Run SQL migration block(s) for this sub-phase
- [ ] 1.2 `Login.tsx`: không có link đăng ký
- [ ] 1.3 Không commit `VITE_SUPABASE_SERVICE_ROLE_KEY`

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] User đã đăng nhập vẫn thấy dữ liệu
- [ ] User chưa đăng nhập bị chặn
- [ ] `supabase.auth.signUp` bị từ chối

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_1_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.