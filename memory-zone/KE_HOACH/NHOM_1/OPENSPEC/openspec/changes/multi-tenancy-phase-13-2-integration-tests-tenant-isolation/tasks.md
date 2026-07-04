## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_13_2_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 13.2: Integration tests — tenant isolation

- [ ] 1.1 Create `tests/integration/tenant-isolation.test.ts`

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] Tenant A tạo products/orders
- [ ] Tenant B không thấy products/orders của tenant A
- [ ] Subdomain đổi → tenant đổi

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_13_2_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.