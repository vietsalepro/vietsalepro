## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_3_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 6.3: App.tsx + global data loading

- [ ] 1.1 Implement the changes described in sub-phase 6.3
- [ ] 1.2 Verify the implementation against the acceptance criteria

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] Chuyển subdomain thấy dữ liệu khác.
- [ ] Đăng nhập vào tenant A, sau đó mở subdomain B → không thấy dữ liệu A.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_3_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.