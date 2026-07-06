## What Was Done

- Backend: created migration `supabase/migrations/20250706000001_phase_p2_subscription_usage.sql` with RPCs `get_tenant_usage_summary`, `update_tenant_subscription`, `reset_monthly_order_counter`.
- Frontend: updated `pages/SystemAdminDashboard.tsx` with expandable row usage panel, progress bars for user/product/order, warning badge >80%, plan upgrade/downgrade form with custom limits, billing_status, and expires_at.
- Service layer: updated `services/tenantService.ts` and `types/tenant.ts` to add new types and RPC wrappers.
- Tests: added `tests/smoke/admin-dashboard-p2-subscription-usage.test.ts` and extended `tests/mocks/supabase.ts` for the new RPCs.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] `npm test` pass (32 tests, including 6 new P2 smoke tests)
- [ ] Manual acceptance criteria on real DB (blocked by deployment)

## Next Phase

- Next sub-phase in KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.

## Blockers / Decisions

- Deployment to Supabase is blocked: `supabase db push` reports "Remote migration versions not found in local migrations directory" and lists many historical migrations not present in `supabase/migrations/`. The CLI suggests `supabase migration repair` or `supabase db pull`. The SQL migration file is ready to be applied manually via Supabase SQL Editor or after resolving the migration history mismatch.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p2-subscription-usage_20260706_111254`
