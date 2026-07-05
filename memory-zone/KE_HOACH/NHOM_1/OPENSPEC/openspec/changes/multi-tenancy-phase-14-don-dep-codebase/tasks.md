## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_14_20260705_140142`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 14: Dọn dẹp codebase

- [x] 1.1 Run SQL migration block(s) for this sub-phase
- [x] 1.2 Xóa `components/MobilePOS.backup.tsx` (nếu còn).
- [x] 1.3 Xóa `memory-zone/.temp/phase*/fixed_*.sql` đã deploy.
- [x] 1.4 Xóa thư mục `OLD` nếu không cần nữa.
- [x] 1.5 Xóa các file test tạm, console.log, dead code.
- [x] 1.6 Chuẩn hóa error handling với `AppError` class.

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Không còn file/import thừa

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_14_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.