## Plan Coverage

- [ ] Phase 0: Environment setup and backup
- [ ] Phase 1: Security cleanup
- [ ] Phase 2: Multi-tenancy foundation tables
- [ ] Phase 3.1: Add `tenant_id` to core business tables
- [ ] Phase 3.2: Add `tenant_id` to inventory & stock tables
- [ ] Phase 3.3: Add `tenant_id` to config & misc tables
- [ ] Phase 4.1: Create initial tenant and backfill core tables
- [ ] Phase 4.2: Backfill remaining tables, orphan cleanup, missing FKs
- [ ] Phase 5.1: Helper functions and custom fetch wrapper
- [ ] Phase 5.2: RLS policies for core tables
- [ ] Phase 5.3: RLS policies for remaining tables and unique indexes
- [ ] Phase 6.1: TenantContext and subdomain routing
- [ ] Phase 6.2: Service layer tenant injection
- [ ] Phase 6.3: App.tsx and global data loading
- [ ] Phase 6.4: Page-level data loading
- [ ] Phase 7: Subscription limits and triggers
- [ ] Phase 8: System admin dashboard
- [ ] Phase 9.1: Edge Function `create-tenant`
- [ ] Phase 9.2: Edge Function `invite-member`
- [ ] Phase 9.3: Edge Function `check-subdomain`
- [ ] Phase 9.4: Edge Function `reset-password`
- [ ] Phase 9.5: Edge Function `process-checkout`
- [ ] Phase 9.6: Edge Function `audit-log` and rate limiting
- [ ] Phase 10.1: DB policies by role
- [ ] Phase 10.2: UI permissions
- [ ] Phase 11: Audit log
- [ ] Phase 12.1: TypeScript strict core services/types
- [ ] Phase 12.2: TypeScript strict pages
- [ ] Phase 12.3: TypeScript strict components and final build
- [ ] Phase 13.1: Unit tests for tenant/auth/RLS
- [ ] Phase 13.2: Integration tests for tenant isolation
- [ ] Phase 13.3: Smoke tests for RBAC/subscription/offline
- [ ] Phase 14: Codebase cleanup
- [ ] Phase 15: Staging tests
- [ ] Phase 16: Production deploy
- [ ] Phase 17: Long-term operations

## File List

**Files to modify:**
- `types.ts`
- `services/supabaseService.ts`
- `services/tenantService.ts` (new)
- `services/subscriptionService.ts` (new)
- `services/auditService.ts` (new)
- `lib/supabase.ts`
- `lib/tenant.ts` (new)
- `contexts/TenantContext.tsx` (new)
- `hooks/usePermissions.ts` (new)
- `App.tsx`
- `AppShell`/`BottomNav`
- `pages/*` (data loading dependencies)
- `supabase/functions/*` (new)

**Files to delete:**
- Public RLS policies (dropped via migration)
- `components/MobilePOS.backup.tsx` if present
- Temporary backup tables after Phase 14
- Dead code and console.logs

**Feature flags to remove:**
- Self-registration flow
- Social provider auth
- Service role key from frontend env

## Guardrails

- [ ] Confirm `tenant_id` is never read from `localStorage`.
- [ ] Confirm `tenant_id` is injected by service layer, not accepted from client input.
- [ ] Confirm Phase 10 drops generic Phase 5 insert/update/delete policies before adding role-based policies.
- [ ] Confirm all 32 business tables have `tenant_id` with `NOT NULL` and FK after Phase 4.
- [ ] Confirm `current_tenant_id()` reads from request header only.
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is never committed to frontend code.

## Acceptance Criteria

- [ ] No public/anon ALL policies remain on business tables.
- [ ] `npm run lint` passes with `strict: true`.
- [ ] `npm run build` passes.
- [ ] At least 30 unit tests and 5 integration tests pass.
- [ ] No orphan records in main parent-child tables.
- [ ] FKs exist on `order_items.lot_id`, `return_order_items.lot_id`, `import_items.lot_id`.
- [ ] Cross-tenant data isolation is verified (tenant A cannot see tenant B).
- [ ] RBAC verified: cashier cannot delete orders, accountant cannot create orders, inventory manager cannot view reports.
- [ ] Self-registration disabled.
- [ ] Service role key not exposed to frontend.
- [ ] Subdomain 404 and suspended tenant handling verified.
- [ ] Audit log visible only to admin/system admin.
- [ ] Storage RLS isolates tenant files.
- [ ] Subscription limits tested for users, products, and orders per month.
- [ ] Password reset redirects to correct subdomain.
- [ ] Rate limiting tested for login failures and tenant creation.
- [ ] SKU/order code/invoice number unique per tenant.
- [ ] Offline queue scoped to current tenant.
- [ ] Backup and restore tested at least once.

## Verification Steps

- Run `npm run lint` after each sub-phase.
- Run `npm run build` after each major phase.
- Perform manual tests for each sub-phase.
- Run Vitest suite after Phase 13.
- Run staging checklist (Phase 15) before production deploy.
- Run production smoke test (Phase 16.3) after deploy.
