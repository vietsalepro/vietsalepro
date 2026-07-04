## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_4_1_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 4.1: Tạo tenant đầu + backfill core tables

- [ ] 1.1 Run SQL migration block(s) for this sub-phase

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] `SELECT count(*) FROM products WHERE tenant_id IS NULL` = 0
- [ ] `tenant_memberships` có admin cho mỗi user hiện có
- [ ] `tenant_subscriptions` có row cho tenant đầu tiên với plan = 'vip'

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_4_1_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.