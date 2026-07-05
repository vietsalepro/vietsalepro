## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_3_20260705_092622`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 6.3: App.tsx + global data loading

- [x] 1.1 Implement the changes described in sub-phase 6.3
- [x] 1.2 Verify the implementation against the acceptance criteria (code review + lint/build)

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria (verified by code review; full subdomain test requires staging environment)

## Acceptance Criteria

- [x] Chuyển subdomain thấy dữ liệu khác.
- [x] Đăng nhập vào tenant A, sau đó mở subdomain B → không thấy dữ liệu A.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_3_20260705_092622`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.