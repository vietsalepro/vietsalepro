## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_16_20260705_153439`
- [x] 0.2 Confirm `npm run lint` passes
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 16: Deploy production

- [x] 1.1 Create Storage RLS migration for bucket `tenant-assets` (`supabase/migrations/20250705000016_phase16_storage_rls_tenant_assets.sql`)
- [x] 1.2 Backup Supabase production database (`supabase_prod_backup_20260705_154948`, ~365 KB)
- [x] 1.3 Run migrations Phase 1 → Phase 13 (+ Phase 15 staging fixes) on production QLBH (`rsialbfjswnrkzcxarnj`)
- [x] 1.4 Deploy Edge Functions: `create-tenant`, `invite-member`, `check-subdomain`, `reset-password`, `process-checkout`, `audit-log`
- [ ] 1.5 Configure Cloudflare Pages domain `vietsalepro.com` + wildcard `*.vietsalepro.com` (requires user action / Cloudflare Dashboard)
- [ ] 1.6 Configure Supabase Auth settings (disable new users, remove social providers, redirect URLs) (requires user action / Supabase Dashboard)
- [ ] 1.7 Deploy frontend build to production (requires user action / Cloudflare Pages)
- [ ] 1.8 Run smoke tests on production (after DNS resolves)
- [ ] 1.9 If smoke pass → run Phase 14 cleanup migration (`supabase/migrations/20250705000010_phase14_cleanup_backup_tables.sql`)
- [ ] 1.10 Monitor errors 24h

## 2. Verification

- [x] 2.1 Run `npm run lint` — PASS
- [x] 2.2 Run `npm run build` — PASS
- [x] 2.3 Run `npm run test -- --run` — 23 tests PASS
- [x] 2.4 Database verification: tenants, memberships, subscriptions, audit log, rate limit, checkout RPC, admin RPC, RLS policies all present
- [ ] 2.5 Manual smoke test on production (pending deploy)

## Acceptance Criteria

- [ ] Sub-phase 16 acceptance criteria pass (pending production deploy and smoke test)

## Rollback Plan

- Local backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_16_20260705_153439`
- Database backup: `C:\Users\SUACAUBA\Downloads\Project\supabase_prod_backup_20260705_154948\prod_full_backup_20260705_154948.sql`
- Database rollback: restore from Supabase production backup taken before migration.
- Rollback trigger: build/test fails, smoke test fails, or data loss risk.
