## What Was Done

- Completed P6 Operations Support: data retention status, default plan limits, maintenance mode, CSV export, subdomain check.
- Backend: `system_settings` table + RPCs (`get_data_retention_status`, `get_default_plan_limits`, `set_default_plan_limits`, `set_maintenance_mode`, `get_maintenance_mode`) + updated `create_tenant_with_admin` + `run_data_retention` log.
- Frontend: tab "Vận hành", Export CSV button, subdomain check button.
- Tests: added `tests/smoke/admin-dashboard-p6-operations-support.test.ts`.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Manual acceptance criteria tested (smoke tests cover all service functions; CSV export + maintenance UI tested via lint/build)
- [ ] Remote Supabase migration deploy: blocked by migration history mismatch (local vs remote). SQL migration ready to apply manually or after syncing history.

## Next Phase

- Next sub-phase in KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.

## Blockers / Decisions

- Remote migration history differs from local (`supabase db push` reports remote versions not in local). Cần đồng bộ lịch sử migration (`supabase db pull` / repair) hoặc apply migration SQL thủ công trên Supabase Dashboard trước khi deploy.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p6-operations-support_20260706_121626`
