## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_14_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 14: Dọn dẹp codebase

- [ ] 1.1 Run SQL migration block(s) for this sub-phase
- [ ] 1.2 Xóa `components/MobilePOS.backup.tsx` (nếu còn).
- [ ] 1.3 Xóa `memory-zone/.temp/phase*/fixed_*.sql` đã deploy.
- [ ] 1.4 Xóa thư mục `OLD` nếu không cần nữa.
- [ ] 1.5 Xóa các file test tạm, console.log, dead code.
- [ ] 1.6 Chuẩn hóa error handling với `AppError` class.

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Không còn file/import thừa

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_14_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.