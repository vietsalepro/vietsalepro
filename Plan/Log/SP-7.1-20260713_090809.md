# SP-7.1: Subdomain Availability Check — Execution Log

> Branch: `feat/SP-7.1-subdomain-check`
> Backup: `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-7.1-20260713_084038`
> Commit: `a358684d` (local only — **not pushed**)

## Completed Work

1. Backup project before implementation.
2. Added service functions to `services/admin/tenantAdminService.ts`:
   - `checkSubdomainAvailability(subdomain)`
   - `setTenantSubdomain(tenantId, subdomain)`
3. Centralized subdomain validation in `utils/subdomain.ts`.
4. Created `components/admin/SubdomainManagerPanel.tsx` with availability check + save flow.
5. Updated `pages/admin/TenantDetail.tsx` to load tenant and render the panel.
6. Added subdomain-management navigation button in `pages/admin/Tenants.tsx`.
7. Created migration `supabase/migrations/20260718000001_sp_7_1_set_tenant_subdomain.sql`:
   - `set_tenant_subdomain` RPC with system-admin guard, validation, conflict check, audit logging.
8. Updated `supabase/functions/check-subdomain/index.ts`:
   - Reserved subdomains now return 400 with error message.
   - Fixed rate-limit window to use consistent fixed-minute window.
9. Refactored `services/operationsService.ts` / `services/admin/systemAdminService.ts` so `checkSubdomain` re-exports `checkSubdomainAvailability` for a single source of truth.
10. Added tests:
    - `tests/services/tenantAdminService.subdomain.test.ts`
    - `tests/admin-dashboard/SubdomainManagerPanel.test.tsx`
    - Updated `tests/admin-dashboard/Tenants.test.tsx` for router + new button.
    - Updated `tests/mocks/supabase.ts` to support `set_tenant_subdomain` and match edge-function validation.
    - Updated `tests/smoke/admin-dashboard-p6-operations-support.test.ts` import path.

## Quality Gates

- `npm run lint` (tsc --noEmit): PASS
- `npx vitest run`: 58 test files, 325 tests PASS
- Code review: multiple review rounds performed; remaining reviewer flags are pre-existing or out-of-scope for SP-7.1 (see Notes).

## Migration / Edge Function Artifacts

- **New migration**: `supabase/migrations/20260718000001_sp_7_1_set_tenant_subdomain.sql`
- **Modified edge function**: `supabase/functions/check-subdomain/index.ts`

> These artifacts are committed locally but **not pushed** to remote. Staging/production migration must be applied manually when this branch is deployed.

## Notes / Follow-up

- `check-subdomain` edge function remains a public endpoint (used for public availability checks). Broader hardening (auth, CORS origin allowlist, user-level rate limiting) is pre-existing infrastructure and out of SP-7.1 scope.
- `create_tenant_with_admin` RPC does not duplicate the validation/availability check that `set_tenant_subdomain` performs. Hardening tenant creation is out of SP-7.1 scope.
- Phase status in `PLAN_AdminDashboard_SubPhases.md` is marked `Done`; this implementation completes the feature.

## Files Changed

- `components/admin/SubdomainManagerPanel.tsx` (new)
- `pages/admin/TenantDetail.tsx`
- `pages/admin/Tenants.tsx`
- `services/admin/tenantAdminService.ts`
- `services/admin/systemAdminService.ts`
- `services/operationsService.ts`
- `utils/subdomain.ts` (new)
- `supabase/migrations/20260718000001_sp_7_1_set_tenant_subdomain.sql` (new)
- `supabase/functions/check-subdomain/index.ts`
- `tests/admin-dashboard/SubdomainManagerPanel.test.tsx` (new)
- `tests/admin-dashboard/Tenants.test.tsx`
- `tests/services/tenantAdminService.subdomain.test.ts` (new)
- `tests/mocks/supabase.ts`
- `tests/smoke/admin-dashboard-p6-operations-support.test.ts`
