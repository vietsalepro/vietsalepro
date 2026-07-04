## Why

VietSale Pro v7 currently runs as a single-tenant application with public RLS policies and no tenant isolation. To support a KiotViet-style SaaS model where multiple stores share one Supabase project while keeping their data isolated, the system must be migrated to a multi-tenant architecture with subdomain-based tenant resolution, row-level security, role-based access control, and subscription limits.

## What Changes

- **BREAKING** Disable public access policies and self-registration on all business tables.
- **BREAKING** Add `tenant_id` columns and foreign keys to all 32 business tables.
- **BREAKING** Backfill existing data into a single initial tenant and enforce `NOT NULL` on `tenant_id`.
- Create foundation tables: `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins`.
- Implement `current_tenant_id()` helper, custom fetch wrapper, and `TenantContext` for subdomain resolution.
- Add RLS policies for tenant isolation across all business tables.
- Add role-based policies (admin, cashier, inventory_manager, accountant) for orders, products, inventory, and config tables.
- Build Supabase Edge Functions: `create-tenant`, `invite-member`, `check-subdomain`, `reset-password`, `process-checkout`, `audit-log`.
- Implement subscription limits (Free vs VIP) via PostgreSQL triggers.
- Add audit logging with `app_audit_log` table and triggers.
- Update frontend service layer to inject `tenant_id` on every insert/update.
- Add `usePermissions` hook and UI guards based on tenant role.
- Enable TypeScript `strict: true` and fix all type errors across services, pages, and components.
- Write unit, integration, and smoke tests for tenant isolation, RBAC, subscriptions, and offline queue.
- Deploy to Cloudflare Pages with wildcard `*.vietsalepro.com` DNS and Storage RLS.
- Establish long-term runbook, backup strategy, and data retention cron jobs.

## Scope / Non-Goals

**In scope:**
- All phases and sub-phases listed in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Database schema, RLS policies, Edge Functions, service layer, frontend context, RBAC UI, TypeScript strict, tests, staging, production deploy, and operations.

**Out of scope:**
- Rebuilding the entire UI/UX beyond tenant isolation and RBAC guards.
- Migrating away from Supabase to a different backend.
- Real-time collaboration features between tenants.
- Billing/payment integration for subscriptions (limits are enforced, billing is manual).

## Capabilities

### New Capabilities
- `tenant-subdomain-resolution`: Resolve tenant from `*.vietsalepro.com` subdomain and load tenant/membership context.
- `tenant-isolation`: Every business table query returns only rows belonging to the current tenant.
- `role-based-access-control`: DB policies and UI guards restrict create/update/delete by role.
- `subscription-enforcement`: Free/VIP limits on users, products, and orders per month.
- `audit-logging`: Automatic and manual audit logs for critical operations.
- `edge-functions`: Secure server-side functions for tenant creation, member invitation, password reset, checkout, and rate limiting.
- `storage-tenant-isolation`: Storage objects isolated by tenant folder under a shared bucket.
- `offline-queue-tenant-isolation`: Offline sync operations scoped to the current tenant.

### Modified Capabilities
- `all-crud-operations`: Every insert/update in `services/supabaseService.ts` must inject `tenant_id` from `TenantContext`.
- `auth-flow`: Sign-up disabled; new users are invited via Edge Function with subdomain-aware password reset.
- `data-loading`: Global and page-level data fetches depend on resolved `tenantId`.

## Impact

- Affected files: `types.ts`, `services/supabaseService.ts`, `services/tenantService.ts`, `services/subscriptionService.ts`, `services/auditService.ts`, `lib/supabase.ts`, `lib/tenant.ts`, `contexts/TenantContext.tsx`, `App.tsx`, `AppShell`/`BottomNav`, all pages under `pages/`, relevant components, `supabase/functions/`.
- Database: 32 business tables get `tenant_id`; new foundation tables; RLS policies; triggers; audit log table; rate limit table.
- Dead code: public access policies, self-registration flow, social providers, `MobilePOS.backup.tsx` if present, temporary backup tables after Phase 14.
- Verification: `npm run lint`, `npm run build`, manual tests per sub-phase, Vitest tests, staging checklist, production smoke test.

## Rollback

Full rollback is via pre-phase project-folder backups and database dumps; individual SQL migrations can be reverted by dropping added columns/policies/triggers if no new tenant data has been created. Detailed rollback steps are in `rollback.md`.
