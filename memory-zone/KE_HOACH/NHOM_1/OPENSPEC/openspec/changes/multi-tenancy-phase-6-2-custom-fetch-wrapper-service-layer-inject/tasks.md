## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_2_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 6.2: Custom fetch wrapper + service layer inject

- [ ] 1.1 Hoàn thiện `lib/supabase.ts` (xem sub-phase 5.1).
- [ ] 1.2 Rà soát `services/supabaseService.ts`:

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] Tạo sản phẩm mới có `tenant_id` đúng.
- [ ] Gọi API từ subdomain khác không thấy dữ liệu.
- [ ] Mapper không chấp nhận `tenant_id` từ input object.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_2_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.