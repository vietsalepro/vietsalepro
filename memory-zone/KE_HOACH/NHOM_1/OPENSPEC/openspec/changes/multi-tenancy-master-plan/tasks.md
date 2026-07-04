:warning: This master plan is an overview. Each numbered sub-phase below is implemented in its own OpenSpec change under `changes/multi-tenancy-phase-*` for context safety.

## 0. Pre-Flight

- [ ] 0.1 Create project backup using Copy-Item to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_master_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes
- [ ] 0.3 Confirm `npm run build` passes
- [ ] 0.4 Read `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md` fully

## 1. Environment & Security Foundation

- [ ] 1.1 Run Phase 0: Create staging project, mirror data, create `multi-tenant` branch, add `.env.staging`, backup production, verify lint/build
- [ ] 1.2 Run Phase 1: Drop public access policies, disable self-registration, remove social providers, update `Login.tsx`, remove service role key from frontend
- [ ] 1.3 Run Phase 2: Create `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins` tables and helper functions

## 2. Schema Migration

- [ ] 2.1 Run Phase 3.1: Add `tenant_id` to core tables (`products`, `customers`, `orders`, `order_items`, `suppliers`, `promotions`)
- [ ] 2.2 Run Phase 3.2: Add `tenant_id` to inventory & stock tables (13 tables)
- [ ] 2.3 Run Phase 3.3: Add `tenant_id` to config & misc tables (12 tables)
- [ ] 2.4 Run Phase 4.1: Create initial tenant `main`, backfill core tables, create memberships and VIP subscription
- [ ] 2.5 Run Phase 4.2: Backfill remaining tables, clean orphan records, add missing FKs

## 3. Tenant Isolation & RLS

- [ ] 3.1 Run Phase 5.1: Implement `current_tenant_id()`, `lib/tenant.ts`, `lib/supabase.ts` custom fetch wrapper
- [ ] 3.2 Run Phase 5.2: Create RLS policies for core tables
- [ ] 3.3 Run Phase 5.3: Create RLS policies for remaining tables and per-tenant unique indexes

## 4. Frontend Tenant Awareness

- [ ] 4.1 Run Phase 6.1: Implement `TenantContext`, subdomain routing, 404/suspended handling
- [ ] 4.2 Run Phase 6.2: Inject `tenant_id` into `services/supabaseService.ts` CRUD operations
- [ ] 4.3 Run Phase 6.3: Wrap `App.tsx` with `TenantProvider` and update global data loading
- [ ] 4.4 Run Phase 6.4: Update page-level data loading to use `useTenant()` and `tenantId`

## 5. Limits, Admin, Edge Functions

- [ ] 5.1 Run Phase 7: Create subscription limit triggers (`check_tenant_limits`, `increment_monthly_order_count`)
- [ ] 5.2 Run Phase 8: Create `SystemAdminDashboard` page and RPCs
- [ ] 5.3 Run Phase 9.1: Edge Function `create-tenant`
- [ ] 5.4 Run Phase 9.2: Edge Function `invite-member`
- [ ] 5.5 Run Phase 9.3: Edge Function `check-subdomain`
- [ ] 5.6 Run Phase 9.4: Edge Function `reset-password`
- [ ] 5.7 Run Phase 9.5: Edge Function `process-checkout`
- [ ] 5.8 Run Phase 9.6: Edge Function `audit-log` + `rate_limit_logs` table

## 6. RBAC & Audit

- [ ] 6.1 Run Phase 10.1: Drop generic Phase 5 policies and add role-based DB policies
- [ ] 6.2 Run Phase 10.2: Implement `usePermissions` hook and UI guards
- [ ] 6.3 Run Phase 11: Create `app_audit_log`, triggers, `auditService`, and audit log page

## 7. TypeScript Strict & Tests

- [ ] 7.1 Run Phase 12.1: Enable `strict: true` in `tsconfig.json`, fix core services/types/utils/hooks
- [ ] 7.2 Run Phase 12.2: Fix TypeScript errors in `pages/`
- [ ] 7.3 Run Phase 12.3: Fix TypeScript errors in `components/` and final build
- [ ] 7.4 Run Phase 13.1: Write unit tests for tenant/auth/RLS
- [ ] 7.5 Run Phase 13.2: Write integration tests for tenant isolation
- [ ] 7.6 Run Phase 13.3: Write smoke tests for RBAC, subscription, offline queue

## 8. Cleanup, Staging, Deploy, Operations

- [ ] 8.1 Run Phase 14: Remove temporary backup tables, dead files, console.logs, standardize error handling
- [ ] 8.2 Run Phase 15: Execute staging checklist (3 tenants, RBAC, limits, storage, rate limiting, audit log)
- [ ] 8.3 Run Phase 16: Configure Cloudflare DNS, Storage RLS, run production migrations, deploy frontend, smoke test
- [ ] 8.4 Run Phase 17: Set up data retention, archiving, monitoring, runbook

## Acceptance Criteria

- [ ] No public/anon policies on business tables
- [ ] `npm run lint` passes with `strict: true`
- [ ] `npm run build` passes
- [ ] 30+ unit tests and 5+ integration tests pass
- [ ] No orphan records in main tables
- [ ] FKs on `order_items.lot_id`, `return_order_items.lot_id`, `import_items.lot_id`
- [ ] Cross-tenant isolation verified
- [ ] RBAC rules verified (cashier, accountant, inventory_manager)
- [ ] Self-registration disabled
- [ ] Service role key not exposed
- [ ] Subdomain 404 and suspended tenant handling verified
- [ ] Audit log visible only to admin/system admin
- [ ] Storage RLS isolates files
- [ ] Subscription limits tested
- [ ] Password reset redirects to correct subdomain
- [ ] Rate limiting tested
- [ ] SKU/order code/invoice number unique per tenant
- [ ] Offline queue scoped to tenant
- [ ] Backup/restore tested
