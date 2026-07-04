## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_9_6_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 9.6: `audit-log-writer` + rate limiting

- [ ] 1.1 Run SQL migration block(s) for this sub-phase
- [ ] 1.2 Create `supabase/functions/audit-log/index.ts`
- [ ] 1.3 Create Bảng `rate_limit_logs`

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] Rate limiting chặn brute-force login và spam tạo tenant.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_9_6_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.