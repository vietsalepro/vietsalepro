## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_0_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 0: Chuẩn bị môi trường & backup (giữ nguyên)

- [ ] 1.1 Supabase MCP `create_project` trong cùng org, region `ap-northeast-1` -> Project staging
- [ ] 1.2 `supabase db dump` → restore vào staging -> Staging có dữ liệu giống production
- [ ] 1.3 `git checkout -b multi-tenant` từ `main` -> Code isolation
- [ ] 1.4 `.env.staging` -> Chạy staging mode
- [ ] 1.5 `supabase db dump` hoặc dashboard backup -> File backup timestamped
- [ ] 1.6 `npm run lint` + `npm run build` -> Build xanh

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] Sub-phase 0 acceptance criteria pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_0_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.