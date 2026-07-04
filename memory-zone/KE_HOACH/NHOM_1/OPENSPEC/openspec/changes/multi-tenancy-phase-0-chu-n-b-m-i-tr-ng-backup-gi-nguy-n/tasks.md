## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_0_20260704_150353`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 0: Chuẩn bị môi trường & backup (giữ nguyên)

- [x] 1.1 Supabase MCP `create_project` trong cùng org, region `ap-northeast-1` -> Project staging `shbmzvfcenbybvyzclem`
- [x] 1.2 `supabase db dump` → restore vào staging -> Staging có dữ liệu giống production
- [x] 1.3 `git checkout -b multi-tenant` từ `main` -> Code isolation
- [x] 1.4 `.env.staging` -> Chạy staging mode
- [x] 1.5 `supabase db dump` hoặc dashboard backup -> File backup timestamped `production_db_dump_20260704_154000.sql`
- [x] 1.6 `npm run lint` + `npm run build` -> Build xanh

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] Sub-phase 0 acceptance criteria pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_0_20260704_150353`
- DB dump backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_0_20260704_150353\production_db_dump_20260704_154000.sql`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.