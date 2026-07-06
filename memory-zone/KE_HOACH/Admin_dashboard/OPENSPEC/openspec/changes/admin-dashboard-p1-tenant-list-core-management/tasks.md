## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p1-tenant-list-core-management_20260706_110118`
- [x] 0.2 Confirm `npm run lint` passes (baseline)
- [x] 0.3 Read the sub-phase section in `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md`

## 1. P1 Tenant List Core Management

- [x] 1.1 Implement backend changes (RPC/migration/Edge Function) for P1 Tenant List Core Management
- [x] 1.2 Implement frontend changes for P1 Tenant List Core Management
- [x] 1.3 Wire up service layer and types if needed

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria (unit tests + lint/build)
- [ ] 2.4 Deploy and test migration on Supabase if applicable (chờ triển khai SQL lên Supabase trong phiên có CLI/credentials)

## Acceptance Criteria

- [x] P1 — Tenant list & core management: search/filter/pagination, soft delete, KPI cards.
- [x] `npm run lint` pass
- [x] `npm run build` pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p1-tenant-list-core-management_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
