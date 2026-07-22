# Admin Dashboard Forensic Investigation Record

**Investigation ID:** AD-Forensic-2026-07-20
**Repository:** `C:\PROJECT\vietsalepro`
**Commit:** `3a06a6d9` (production governance baseline before cutover, RC-2026-07-19-01)
**Authoritative Baselines:** `01`–`05` in `ADMIN_DASHBOARD_PLAN/`
**Execution Date:** 2026-07-20
**Scope:** Complete repository-based forensic investigation of the VietSale Pro Admin Dashboard surface.

> This document is the official forensic execution record. It reports only what was observed in the repository. No remediation, root-cause analysis, or recommendation is included beyond the documented root-cause candidates.

## 1. Preparation
### 1.1 Required state verification
| Item | Status | Evidence |
|---|---|---|
| Repository checkout | Confirmed | git status shows working tree at commit `3a06a6d9` |
| Baseline documents 01-04 | Confirmed | `ADMIN_DASHBOARD_PLAN/01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md`, `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md`, `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md`, `04_ADMIN_DASHBOARD_INVESTIGATION_PLAN.md` |
| `codebase-memory` graph | Reachable | `.codebase-memory/artifact.json` and `graph.db.zst` are modified in the working tree |
| Supabase schema/migrations | Confirmed | `supabase/schema.sql` and `supabase/migrations/` directory present |
| Environment inventory | Performed | `.env`, `.env.example`, `.env.staging` located |

## 2. Boundary Validation
### 2.1 Host boundary
- `lib/tenant.ts` defines `getSubdomain()` and `isCustomDomain()` using `window.location.host`.
- On `localhost`/`127.0.0.1`, `getSubdomain()` returns `main` and `isCustomDomain()` returns `false`.
- `getAdminUrl()` builds `admin.vietsalepro.com/admin` in production and `origin/admin` locally.

### 2.2 Identity boundary
- `AuthContext.tsx` initializes `session` and `user` from `supabase.auth.getSession()` and `onAuthStateChange`.
- `lib/permissions.ts` exposes `isSystemAdmin()` as an async RPC call to `is_system_admin`.
- `App.tsx` performs the admin gate by directly querying `supabase.from("system_admins").select("user_id").eq(...)` instead of using `isSystemAdmin()` or the service layer.

### 2.3 Tenant boundary
- `TenantContext.tsx` clears `tenant` and `currentTenantId` when `subdomain` is `admin` or absent.

### 2.4 Service boundary
- The architecture model requires all admin data access through `services/admin/*` wrappers.
- Observed: `App.tsx` calls `supabase.from(...)` directly; `AuthContext.tsx` calls `supabase.rpc("activate_pending_memberships", ...)` directly.

## 3. Architecture Verification
Layer ownership observed in repository:
| Layer | Representative artifacts | Notes |
|---|---|---|
| Presentation | `pages/admin/*.tsx`, `components/admin/*.tsx` | Lazy-loaded routes in `App.tsx` |
| Application/Context | `contexts/AuthContext.tsx`, `contexts/TenantContext.tsx` | Hold session, tenant, impersonation state |
| Service Layer — Admin wrappers | `services/admin/*.ts` | Present for tenant, billing, analytics, audit, compliance, members, support |
| Service Layer — Base services | `services/*.ts` | Base modules for domain services |
| Infrastructure | `lib/supabase.ts`, `lib/tenant.ts`, `lib/permissions.ts` | Single Supabase client, tenant fetch injection |
| Supabase Platform | `supabase/functions/*`, `supabase/migrations/*.sql` | Edge Functions, RPCs, RLS, triggers |
| Data Layer | Postgres objects in `supabase/schema.sql` and `migrations/` | Tables, RPCs, RLS, triggers |

## 4. Dependency Verification
Dependency direction observed: `Browser → App.tsx → AdminLayout → pages/admin/* → hooks/contexts → services/admin/* → services/* → lib/supabase.ts → Supabase platform → Postgres` matches the dependency model.
Observed shared service modules: `lib/supabase.ts` is imported by all service and context modules. `lib/permissions.ts` is consumed horizontally by `App.tsx` and pages.

## 5. Execution Verification
Boot sequence observed in code: `index.html` → `index.tsx` → `App.tsx` (`AuthProvider` → `TenantProvider`) → `AppContent` admin gating → lazy `AdminLayout`/`AdminSuspense` → admin pages.
Runtime deviations: `App.tsx` admin gate does not use the `isSystemAdmin()` helper from `lib/permissions.ts`; it performs a direct `from("system_admins")` query.


## 6. Capability Investigation: Authentication
### Capability Summary
Establish identity, session lifecycle, MFA, and admin eligibility.

### Expected Architecture
`App.tsx` lazy admin route tree; `AuthContext` boot; `lib/permissions.ts` `isSystemAdmin()` calls `is_system_admin` RPC; backend `system_admins` table is source of truth.

### Expected Dependency
`App.tsx` → `AuthContext` → `lib/permissions.ts` → `is_system_admin` RPC → `system_admins` table.

### Expected Runtime
SIGNED_IN triggers `AuthContext` update; `AppContent` waits for `authLoading`, `tenantLoading`, `isAdminLoading`; admin routes render only when `isSystemAdmin` true.

### Repository Trace
**Presentation → Application → Service → Infrastructure → Platform → Data trace:**
- App.tsx
- contexts/AuthContext.tsx
- contexts/TenantContext.tsx
- lib/permissions.ts
- lib/tenant.ts
- pages/Login.tsx
- services/admin/memberAdminService.ts
- services/admin/tenantAdminService.ts
- services/auditService.ts
- services/loginHistoryService.ts
- services/subscriptionService.ts
- services/tenantService.ts
- services/twoFactorService.ts
- supabase/functions/_shared/permissions.ts
- supabase/functions/admin-2fa-override/index.ts
- supabase/functions/audit-log/index.ts
- supabase/functions/create-system-admin/index.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/db-maintenance/index.ts
- supabase/functions/delete-tenant/index.ts
- supabase/functions/delete-user/index.ts
- supabase/functions/end-impersonation/index.ts
- supabase/functions/error-performance/index.ts
- supabase/functions/impersonate-tenant/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/process-checkout/index.ts
- supabase/functions/reset-password/index.ts
- supabase/functions/send-billing-email/index.ts
- supabase/functions/send-email/index.ts
- supabase/functions/send-sms/index.ts
- supabase/functions/send-template-email/index.ts
- supabase/functions/send-ticket-email/index.ts
- supabase/functions/system-backup/index.ts
- supabase/functions/system-health/index.ts
- supabase/functions/tenant-backup/index.ts
- supabase/functions/tenant-restore/index.ts
- supabase/migrations/20260712000012_add_system_admin_for_edge.sql
- supabase/schema.sql
- tests/integration/system-admin-creation-integration.test.ts
- tests/rls.test.ts

### Evidence Inventory
**Files observed:**
- App.tsx
- contexts/AuthContext.tsx
- contexts/TenantContext.tsx
- lib/permissions.ts
- lib/tenant.ts
- pages/Login.tsx
- services/admin/memberAdminService.ts
- services/admin/tenantAdminService.ts
- services/auditService.ts
- services/loginHistoryService.ts
- services/subscriptionService.ts
- services/tenantService.ts
- services/twoFactorService.ts
- supabase/functions/_shared/permissions.ts
- supabase/functions/admin-2fa-override/index.ts
- supabase/functions/audit-log/index.ts
- supabase/functions/create-system-admin/index.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/db-maintenance/index.ts
- supabase/functions/delete-tenant/index.ts
- supabase/functions/delete-user/index.ts
- supabase/functions/end-impersonation/index.ts
- supabase/functions/error-performance/index.ts
- supabase/functions/impersonate-tenant/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/process-checkout/index.ts
- supabase/functions/reset-password/index.ts
- supabase/functions/send-billing-email/index.ts
- supabase/functions/send-email/index.ts
- supabase/functions/send-sms/index.ts
- supabase/functions/send-template-email/index.ts
- supabase/functions/send-ticket-email/index.ts
- supabase/functions/system-backup/index.ts
- supabase/functions/system-health/index.ts
- supabase/functions/tenant-backup/index.ts
- supabase/functions/tenant-restore/index.ts
- supabase/migrations/20260712000012_add_system_admin_for_edge.sql
- supabase/schema.sql
- tests/integration/system-admin-creation-integration.test.ts
- tests/rls.test.ts
**Migrations mentioning capability:**
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
- supabase/migrations/20250704000000_phase2_tenant_foundation.sql
- supabase/migrations/20250704000004_phase4_1_first_tenant_backfill_core.sql
- supabase/migrations/20250704000007_phase5_2_rls_policies_core_tables.sql
- supabase/migrations/20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql
- supabase/migrations/20250705000001_phase7_subscription_limits.sql
- supabase/migrations/20250705000002_phase8_admin_dashboard_rpc.sql
- supabase/migrations/20250705000003_phase9_1_create_tenant_edge_function.sql
- supabase/migrations/20250705000004_phase9_5_process_checkout.sql
- supabase/migrations/20250705000007_phase9_6_audit_log_rate_limit.sql
- supabase/migrations/20250705000008_phase10_1_db_policies_theo_role.sql
- supabase/migrations/20250705000009_phase11_audit_log_triggers.sql
- supabase/migrations/20250705000015_phase15_staging_fixes.sql
- supabase/migrations/20250705000017_phase17_long_term_operations.sql
- supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql
- supabase/migrations/20250706000001_phase_p2_subscription_usage.sql
- supabase/migrations/20250706000002_phase_p3_member_management.sql
- supabase/migrations/20250706000003_phase_p4_system_analytics.sql
- supabase/migrations/20250706000004_phase_p5_audit_security.sql
- supabase/migrations/20250706000005_phase_p6_operations_support.sql
**RPCs defined in migrations (matching keywords):**
- activate_pending_memberships
- can_use_feature
- get_tenant_by_subdomain
- has_tenant_role
- is_system_admin
- is_tenant_owner
**Tables defined in migrations (matching keywords):**
- admin_login_history
- app_audit_log
- app_audit_log_partitioned
- system_admins
- tenant_memberships
**RLS policies on matching tables:**
- (none recorded)
**Triggers matching keywords:**
- tenant_memberships_guardrails
- tenant_memberships_audit
- trg_audit_log_tenant_memberships
- tenant_memberships_guardrails
- tenant_memberships_audit
- trg_audit_log_tenant_memberships
**Edge Function directories matching keywords:**
- (none recorded)

### Evidence Validation
Cross-source: 40 TypeScript/TSX files, 117 SQL files, 6 RPCs, 5 tables, 0 RLS policies, 6 triggers, 0 Edge Functions matched the capability keyword set.
Consistency note: Capability keywords were derived from the dependency map; repository evidence must be reconciled against the exact runtime contract in the baselines.

### Findings
- **F-001:** App.tsx directly queries `system_admins` table for the admin gate rather than using `isSystemAdmin()` helper or `is_system_admin` RPC
  - Classification: Architecture/Security
  - Confidence: Confirmed
  - Impact candidate: Admin gate logic duplicated and client-side, depends on RLS for `system_admins` direct access.


### Classification
- App.tsx directly queries `system_admins` table for the admin gate rather than using `isSystemAdmin()` helper or `is_system_admin` RPC

### Confidence
- Architecture/Security

### Impact Candidate
- Confirmed

### Root Cause Candidate
- App.tsx directly queries `system_admins` table for the admin gate rather than using `isSystemAdmin()` helper or `is_system_admin` RPC: first layer where observed implementation diverges from the architecture/dependency model.


## 7. Capability Investigation: Authorization
### Capability Summary
Role and permission enforcement for system and tenant scopes.

### Expected Architecture
Synchronous helpers in `lib/permissions.ts`; async RPC checks for system admin and tenant roles; RLS and SECURITY DEFINER are the enforcement layer.

### Expected Dependency
`lib/permissions.ts` → `is_system_admin`/`has_tenant_role`/`is_tenant_owner` RPCs → RLS policies on tenant-scoped tables.

### Expected Runtime
Pages call `requireSystemAdmin` or `isSystemAdmin` before rendering/admin actions; backend RPCs fail closed.

### Repository Trace
**Presentation → Application → Service → Infrastructure → Platform → Data trace:**
- App.tsx
- contexts/TenantContext.tsx
- lib/permissions.ts
- services/admin/memberAdminService.ts
- services/admin/tenantAdminService.ts
- services/subscriptionService.ts
- services/tenantService.ts
- supabase/functions/_shared/permissions.ts
- supabase/functions/create-system-admin/index.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/db-maintenance/index.ts
- supabase/functions/delete-tenant/index.ts
- supabase/functions/delete-user/index.ts
- supabase/functions/end-impersonation/index.ts
- supabase/functions/error-performance/index.ts
- supabase/functions/impersonate-tenant/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/process-checkout/index.ts
- supabase/functions/reset-password/index.ts
- supabase/functions/send-billing-email/index.ts
- supabase/functions/send-email/index.ts
- supabase/functions/send-sms/index.ts
- supabase/functions/send-template-email/index.ts
- supabase/functions/send-ticket-email/index.ts
- supabase/functions/system-backup/index.ts
- supabase/functions/system-health/index.ts
- supabase/functions/tenant-backup/index.ts
- supabase/functions/tenant-restore/index.ts
- supabase/migrations/20260712000012_add_system_admin_for_edge.sql
- supabase/schema.sql
- tests/integration/system-admin-creation-integration.test.ts
- tests/rls.test.ts

### Evidence Inventory
**Files observed:**
- App.tsx
- contexts/TenantContext.tsx
- lib/permissions.ts
- services/admin/memberAdminService.ts
- services/admin/tenantAdminService.ts
- services/subscriptionService.ts
- services/tenantService.ts
- supabase/functions/_shared/permissions.ts
- supabase/functions/create-system-admin/index.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/db-maintenance/index.ts
- supabase/functions/delete-tenant/index.ts
- supabase/functions/delete-user/index.ts
- supabase/functions/end-impersonation/index.ts
- supabase/functions/error-performance/index.ts
- supabase/functions/impersonate-tenant/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/process-checkout/index.ts
- supabase/functions/reset-password/index.ts
- supabase/functions/send-billing-email/index.ts
- supabase/functions/send-email/index.ts
- supabase/functions/send-sms/index.ts
- supabase/functions/send-template-email/index.ts
- supabase/functions/send-ticket-email/index.ts
- supabase/functions/system-backup/index.ts
- supabase/functions/system-health/index.ts
- supabase/functions/tenant-backup/index.ts
- supabase/functions/tenant-restore/index.ts
- supabase/migrations/20260712000012_add_system_admin_for_edge.sql
- supabase/schema.sql
- tests/integration/system-admin-creation-integration.test.ts
- tests/rls.test.ts
**Migrations mentioning capability:**
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
- supabase/migrations/20250704000000_phase2_tenant_foundation.sql
- supabase/migrations/20250704000004_phase4_1_first_tenant_backfill_core.sql
- supabase/migrations/20250704000007_phase5_2_rls_policies_core_tables.sql
- supabase/migrations/20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql
- supabase/migrations/20250705000001_phase7_subscription_limits.sql
- supabase/migrations/20250705000002_phase8_admin_dashboard_rpc.sql
- supabase/migrations/20250705000003_phase9_1_create_tenant_edge_function.sql
- supabase/migrations/20250705000007_phase9_6_audit_log_rate_limit.sql
- supabase/migrations/20250705000008_phase10_1_db_policies_theo_role.sql
- supabase/migrations/20250705000009_phase11_audit_log_triggers.sql
- supabase/migrations/20250705000015_phase15_staging_fixes.sql
- supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql
- supabase/migrations/20250706000001_phase_p2_subscription_usage.sql
- supabase/migrations/20250706000002_phase_p3_member_management.sql
- supabase/migrations/20250706000003_phase_p4_system_analytics.sql
- supabase/migrations/20250706000004_phase_p5_audit_security.sql
- supabase/migrations/20250706000005_phase_p6_operations_support.sql
- supabase/migrations/20250706000006_phase_p7_0_read_only_tenant_infra.sql
- supabase/migrations/20250706000007_phase_p7_1_billing_schema_bank_config.sql
**RPCs defined in migrations (matching keywords):**
- can_use_feature
- has_tenant_role
- is_system_admin
- is_tenant_owner
**Tables defined in migrations (matching keywords):**
- admin_roles
- system_admins
- tenant_memberships
**RLS policies on matching tables:**
- admin_roles_system_admin_all on admin_roles
- admin_roles_system_admin_all on admin_roles
**Triggers matching keywords:**
- tenant_memberships_guardrails
- tenant_memberships_audit
- trg_audit_log_tenant_memberships
- admin_roles_set_updated_at
- tenant_memberships_guardrails
- tenant_memberships_audit
- admin_roles_set_updated_at
- trg_audit_log_tenant_memberships
**Edge Function directories matching keywords:**
- (none recorded)

### Evidence Validation
Cross-source: 32 TypeScript/TSX files, 112 SQL files, 4 RPCs, 3 tables, 2 RLS policies, 8 triggers, 0 Edge Functions matched the capability keyword set.
Consistency note: Capability keywords were derived from the dependency map; repository evidence must be reconciled against the exact runtime contract in the baselines.

### Findings
- **F-002:** `lib/permissions.ts` uses `is_system_admin` RPC while `App.tsx` uses direct `from("system_admins")`; two different enforcement paths for the same system-admin check.
  - Classification: Architecture/Security
  - Confidence: Confirmed
  - Impact candidate: Inconsistent authorization surface; the direct `from` query may be subject to different RLS/PostgREST behavior than the SECURITY DEFINER RPC.


### Classification
- `lib/permissions.ts` uses `is_system_admin` RPC while `App.tsx` uses direct `from("system_admins")`; two different enforcement paths for the same system-admin check.

### Confidence
- Architecture/Security

### Impact Candidate
- Confirmed

### Root Cause Candidate
- `lib/permissions.ts` uses `is_system_admin` RPC while `App.tsx` uses direct `from("system_admins")`; two different enforcement paths for the same system-admin check.: first layer where observed implementation diverges from the architecture/dependency model.


## 8. Capability Investigation: Tenant
### Capability Summary
Admin CRUD, search, subdomain/custom-domain, impersonation, backup/restore for tenants.

### Expected Architecture
`pages/admin/Tenants.tsx`, `TenantDetail.tsx`, `Onboarding.tsx` → `services/admin/tenantAdminService.ts` → base `services/tenantService.ts` → Supabase RPCs/Edge Functions.

### Expected Dependency
`tenantAdminService.ts` wraps `tenantService.ts` and Edge Functions `create-tenant`, `check-subdomain`, `verify-domain`, `delete-tenant`, `tenant-backup`, `tenant-restore`, `impersonate-tenant`, `end-impersonation`.

### Expected Runtime
List loads via `get_tenants_admin`/`search_tenants`; mutations through RPCs/Edge Functions with `is_system_admin` checks.

### Repository Trace
**Presentation → Application → Service → Infrastructure → Platform → Data trace:**
- contexts/TenantContext.tsx
- lib/permissions.ts
- lib/tenant.ts
- services/admin/billingAdminService.ts
- services/admin/licenseService.ts
- services/admin/memberAdminService.ts
- services/admin/tenantAdminService.ts
- services/maintenanceService.ts
- services/subscriptionService.ts
- services/systemAdminService.ts
- services/tenantService.ts
- services/webhookService.ts
- supabase/functions/_shared/permissions.ts
- supabase/functions/check-subdomain/index.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/cron-admin-tasks/index.ts
- supabase/functions/delete-tenant/index.ts
- supabase/functions/delete-user/index.ts
- supabase/functions/end-impersonation/index.ts
- supabase/functions/impersonate-tenant/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/process-checkout/index.ts
- supabase/functions/reset-password/index.ts
- supabase/functions/send-invitation-email/index.ts
- supabase/functions/system-health/index.ts
- supabase/functions/tenant-backup/index.ts
- supabase/functions/verify-domain/index.ts
- tests/rls.test.ts
- tests/services/systemAdminService.security.test.ts
- tests/services/tenantAdminService.custom-domain.test.ts
- tests/services/tenantAdminService.subdomain.test.ts

### Evidence Inventory
**Files observed:**
- contexts/TenantContext.tsx
- lib/permissions.ts
- lib/tenant.ts
- services/admin/billingAdminService.ts
- services/admin/licenseService.ts
- services/admin/memberAdminService.ts
- services/admin/tenantAdminService.ts
- services/maintenanceService.ts
- services/subscriptionService.ts
- services/systemAdminService.ts
- services/tenantService.ts
- services/webhookService.ts
- supabase/functions/_shared/permissions.ts
- supabase/functions/check-subdomain/index.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/cron-admin-tasks/index.ts
- supabase/functions/delete-tenant/index.ts
- supabase/functions/delete-user/index.ts
- supabase/functions/end-impersonation/index.ts
- supabase/functions/impersonate-tenant/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/process-checkout/index.ts
- supabase/functions/reset-password/index.ts
- supabase/functions/send-invitation-email/index.ts
- supabase/functions/system-health/index.ts
- supabase/functions/tenant-backup/index.ts
- supabase/functions/verify-domain/index.ts
- tests/rls.test.ts
- tests/services/systemAdminService.security.test.ts
- tests/services/tenantAdminService.custom-domain.test.ts
- tests/services/tenantAdminService.subdomain.test.ts
**Migrations mentioning capability:**
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
- supabase/migrations/20250704000000_phase2_tenant_foundation.sql
- supabase/migrations/20250704000001_phase3_1_core_business_tenant_id.sql
- supabase/migrations/20250704000002_phase3_2_inventory_stock_tenant_id.sql
- supabase/migrations/20250704000003_phase3_3_config_misc_tenant_id.sql
- supabase/migrations/20250704000004_phase4_1_first_tenant_backfill_core.sql
- supabase/migrations/20250704000005_phase4_2_backfill_remaining_tables_orphan_cleanup_fk.sql
- supabase/migrations/20250705000001_phase7_subscription_limits.sql
- supabase/migrations/20250705000002_phase8_admin_dashboard_rpc.sql
- supabase/migrations/20250705000003_phase9_1_create_tenant_edge_function.sql
- supabase/migrations/20250705000004_phase9_5_process_checkout.sql
- supabase/migrations/20250705000005_phase9_5_process_checkout_ledger_fixes.sql
- supabase/migrations/20250705000006_phase9_5_safeupdate_fix.sql
- supabase/migrations/20250705000007_phase9_6_audit_log_rate_limit.sql
- supabase/migrations/20250705000008_phase10_1_db_policies_theo_role.sql
- supabase/migrations/20250705000009_phase11_audit_log_triggers.sql
- supabase/migrations/20250705000015_phase15_staging_fixes.sql
- supabase/migrations/20250705000016_phase16_storage_rls_tenant_assets.sql
- supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql
- supabase/migrations/20250706000001_phase_p2_subscription_usage.sql
**RPCs defined in migrations (matching keywords):**
- bulk_update_tenants
- create_tenant_with_admin
- delete_tenant_safe
- get_system_overview
- get_tenant_by_domain
- get_tenant_by_subdomain
- get_tenant_growth
- get_tenant_usage_summary
- get_tenants_admin
- get_tenants_for_user
- get_top_tenants
- search_tenants
- set_tenant_subdomain
- update_tenant
- update_tenant_feature_flags
- update_tenant_ip_allowlist
- update_tenant_member_role
- update_tenant_session_timeout
- update_tenant_status
- update_tenant_subscription
**Tables defined in migrations (matching keywords):**
- invitations
- licenses
- tenant_memberships
- tenant_subscriptions
- tenants
**RLS policies on matching tables:**
- invitations_select_for_members on invitations
- invitations_insert_for_admins on invitations
- invitations_update_for_admins on invitations
- invitations_delete_for_admins on invitations
- invitations_select_for_members on invitations
- invitations_insert_for_admins on invitations
- invitations_update_for_admins on invitations
- invitations_delete_for_admins on invitations
**Triggers matching keywords:**
- tenant_memberships_guardrails
- tenants_before_delete_guardrail
- tenant_memberships_audit
- trg_audit_log_tenants
- trg_audit_log_tenant_memberships
- trg_audit_log_tenant_subscriptions
- tenant_memberships_guardrails
- tenants_before_delete_guardrail
- tenant_memberships_audit
- trg_audit_log_tenants
- trg_audit_log_tenant_memberships
- trg_audit_log_tenant_subscriptions
**Edge Function directories matching keywords:**
- (none recorded)

### Evidence Validation
Cross-source: 31 TypeScript/TSX files, 105 SQL files, 21 RPCs, 5 tables, 8 RLS policies, 12 triggers, 0 Edge Functions matched the capability keyword set.
Consistency note: Capability keywords were derived from the dependency map; repository evidence must be reconciled against the exact runtime contract in the baselines.

### Findings
- **F-003:** Multiple tenant management RPCs and Edge Functions exist; the repository trace shows `services/admin/tenantAdminService.ts` and `services/tenantService.ts` as seams.
  - Classification: Dependency
  - Confidence: Confirmed
  - Impact candidate: All tenant mutations flow through these wrappers/Edge Functions per observed imports.


### Classification
- Multiple tenant management RPCs and Edge Functions exist; the repository trace shows `services/admin/tenantAdminService.ts` and `services/tenantService.ts` as seams.

### Confidence
- Dependency

### Impact Candidate
- Confirmed

### Root Cause Candidate
- Multiple tenant management RPCs and Edge Functions exist; the repository trace shows `services/admin/tenantAdminService.ts` and `services/tenantService.ts` as seams.: first layer where observed implementation diverges from the architecture/dependency model.


## 9. Capability Investigation: Billing
### Capability Summary
Subscriptions, plans, invoices, payments, and provider registry.

### Expected Architecture
`pages/admin/Billing.tsx`, `BillingInvoices.tsx`, `BillingPayments.tsx` → `services/admin/billingAdminService.ts` → base `planService`, `invoiceService`, `bankAccountService`, `billingProviderRegistry` + providers.

### Expected Dependency
RPCs `update_tenant_subscription`, `create_subscription`, `upgrade/downgrade/cancel_subscription`, `create_invoice`, `confirm_payment`, `get_plans`, etc. Edge Functions `process-checkout`, `send-billing-email`, `billing-webhooks`.

### Expected Runtime
Admin selects plan/subscription; mutations routed through provider registry to RPCs/Edge Functions; provider signatures verified in Edge Functions.

### Repository Trace
**Presentation → Application → Service → Infrastructure → Platform → Data trace:**
- services/admin/billingAdminService.ts
- services/bankAccountService.ts
- services/billingAutomationService.ts
- services/billingReminderService.ts
- services/invoiceService.ts
- services/operationsService.ts
- services/planService.ts
- services/promotionService.ts
- services/tenantService.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/cron-admin-tasks/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/send-billing-email/index.ts

### Evidence Inventory
**Files observed:**
- services/admin/billingAdminService.ts
- services/bankAccountService.ts
- services/billingAutomationService.ts
- services/billingReminderService.ts
- services/invoiceService.ts
- services/operationsService.ts
- services/planService.ts
- services/promotionService.ts
- services/tenantService.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/cron-admin-tasks/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/send-billing-email/index.ts
**Migrations mentioning capability:**
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
- supabase/migrations/20250704000000_phase2_tenant_foundation.sql
- supabase/migrations/20250704000003_phase3_3_config_misc_tenant_id.sql
- supabase/migrations/20250704000004_phase4_1_first_tenant_backfill_core.sql
- supabase/migrations/20250704000005_phase4_2_backfill_remaining_tables_orphan_cleanup_fk.sql
- supabase/migrations/20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql
- supabase/migrations/20250705000001_phase7_subscription_limits.sql
- supabase/migrations/20250705000002_phase8_admin_dashboard_rpc.sql
- supabase/migrations/20250705000004_phase9_5_process_checkout.sql
- supabase/migrations/20250705000005_phase9_5_process_checkout_ledger_fixes.sql
- supabase/migrations/20250705000006_phase9_5_safeupdate_fix.sql
- supabase/migrations/20250705000008_phase10_1_db_policies_theo_role.sql
- supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql
- supabase/migrations/20250706000001_phase_p2_subscription_usage.sql
- supabase/migrations/20250706000003_phase_p4_system_analytics.sql
- supabase/migrations/20250706000005_phase_p6_operations_support.sql
- supabase/migrations/20250706000006_phase_p7_0_read_only_tenant_infra.sql
- supabase/migrations/20250706000007_phase_p7_1_billing_schema_bank_config.sql
- supabase/migrations/20250706000008_phase_p7_2_invoice_create_pricing.sql
- supabase/migrations/20250706000009_phase_p7_3_payment_confirm_lifecycle.sql
**RPCs defined in migrations (matching keywords):**
- apply_voucher_to_invoice
- audit_log_trigger_tenant_subscriptions
- cancel_subscription
- compute_billing_period_end
- confirm_payment
- create_invoice
- create_plan
- create_renewal_invoices
- create_subscription
- delete_plan
- downgrade_subscription
- expire_overdue_invoices
- get_billing_automation_status
- get_billing_job_logs
- get_billing_reminder_config
- get_default_plan_limit_values
- get_default_plan_limits
- get_next_invoice_number
- get_pending_billing_reminders
- get_plan_by_key
**Tables defined in migrations (matching keywords):**
- bank_accounts
- billing_job_logs
- billing_reminder_logs
- invoices
- payments
- plan_features
- plans
- tenant_subscriptions
**RLS policies on matching tables:**
- billing_job_logs_select_admin on billing_job_logs
- billing_job_logs_insert_service on billing_job_logs
- billing_reminder_logs_select_admin on billing_reminder_logs
- billing_job_logs_select_admin on billing_job_logs
- billing_job_logs_insert_service on billing_job_logs
- billing_reminder_logs_select_admin on billing_reminder_logs
**Triggers matching keywords:**
- plan_features_updated_at
- trg_audit_log_tenant_subscriptions
- plan_features_updated_at
- trg_audit_log_tenant_subscriptions
**Edge Function directories matching keywords:**
- supabase/functions/billing-webhooks
- supabase/functions/send-billing-email

### Evidence Validation
Cross-source: 13 TypeScript/TSX files, 66 SQL files, 32 RPCs, 8 tables, 6 RLS policies, 4 triggers, 2 Edge Functions matched the capability keyword set.
Consistency note: Capability keywords were derived from the dependency map; repository evidence must be reconciled against the exact runtime contract in the baselines.

### Findings
- No explicit deviations recorded for this capability beyond the keyword-matching evidence inventory above.

### Classification
- (none beyond inventory)

### Confidence
- Confirmed (inventory), Possible/Higher for runtime behavior

### Impact Candidate
- No technical impact identified beyond recorded gaps.

### Root Cause Candidate
- No root cause candidate identified; capability artifacts match the expected dependency model at the repository level.


## 10. Capability Investigation: Members
### Capability Summary
Tenant membership invitation, role management, activation, and removal.

### Expected Architecture
`pages/admin/Members.tsx` and invitations accept page → `services/admin/memberAdminService.ts` → base services/Edge Functions.

### Expected Dependency
RPCs `invite_member`, `activate_pending_memberships`, `update_tenant_member_role`, `toggle_tenant_member_active`, `remove_tenant_member`; Edge Function `invite-member`/`delete-user`.

### Expected Runtime
Admin invites members; activation handled on sign-in via `AuthContext` calling `activate_pending_memberships`; role changes via `memberAdminService`.

### Repository Trace
**Presentation → Application → Service → Infrastructure → Platform → Data trace:**
- contexts/AuthContext.tsx
- contexts/TenantContext.tsx
- lib/permissions.ts
- services/admin/memberAdminService.ts
- services/admin/tenantAdminService.ts
- services/subscriptionService.ts
- services/tenantService.ts
- supabase/functions/_shared/permissions.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/delete-tenant/index.ts
- supabase/functions/delete-user/index.ts
- supabase/functions/end-impersonation/index.ts
- supabase/functions/impersonate-tenant/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/process-checkout/index.ts
- supabase/functions/reset-password/index.ts
- tests/rls.test.ts

### Evidence Inventory
**Files observed:**
- contexts/AuthContext.tsx
- contexts/TenantContext.tsx
- lib/permissions.ts
- services/admin/memberAdminService.ts
- services/admin/tenantAdminService.ts
- services/subscriptionService.ts
- services/tenantService.ts
- supabase/functions/_shared/permissions.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/delete-tenant/index.ts
- supabase/functions/delete-user/index.ts
- supabase/functions/end-impersonation/index.ts
- supabase/functions/impersonate-tenant/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/process-checkout/index.ts
- supabase/functions/reset-password/index.ts
- tests/rls.test.ts
**Migrations mentioning capability:**
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
- supabase/migrations/20250704000000_phase2_tenant_foundation.sql
- supabase/migrations/20250704000004_phase4_1_first_tenant_backfill_core.sql
- supabase/migrations/20250704000007_phase5_2_rls_policies_core_tables.sql
- supabase/migrations/20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql
- supabase/migrations/20250705000001_phase7_subscription_limits.sql
- supabase/migrations/20250705000002_phase8_admin_dashboard_rpc.sql
- supabase/migrations/20250705000003_phase9_1_create_tenant_edge_function.sql
- supabase/migrations/20250705000004_phase9_5_process_checkout.sql
- supabase/migrations/20250705000007_phase9_6_audit_log_rate_limit.sql
- supabase/migrations/20250705000008_phase10_1_db_policies_theo_role.sql
- supabase/migrations/20250705000009_phase11_audit_log_triggers.sql
- supabase/migrations/20250705000015_phase15_staging_fixes.sql
- supabase/migrations/20250705000016_phase16_storage_rls_tenant_assets.sql
- supabase/migrations/20250706000001_phase_p2_subscription_usage.sql
- supabase/migrations/20250706000002_phase_p3_member_management.sql
- supabase/migrations/20250706000003_phase_p4_system_analytics.sql
- supabase/migrations/20250706000004_phase_p5_audit_security.sql
- supabase/migrations/20250706000005_phase_p6_operations_support.sql
- supabase/migrations/20250706000006_phase_p7_0_read_only_tenant_infra.sql
**RPCs defined in migrations (matching keywords):**
- activate_pending_memberships
- get_tenant_members_with_email
- is_tenant_member
- remove_tenant_member
- search_tenant_members
- toggle_tenant_member_active
- trg_tenant_memberships_audit
- trg_tenant_memberships_guardrails
- update_tenant_member_role
**Tables defined in migrations (matching keywords):**
- invitations
- tenant_memberships
**RLS policies on matching tables:**
- invitations_select_for_members on invitations
- invitations_insert_for_admins on invitations
- invitations_update_for_admins on invitations
- invitations_delete_for_admins on invitations
- invitations_select_for_members on invitations
- invitations_insert_for_admins on invitations
- invitations_update_for_admins on invitations
- invitations_delete_for_admins on invitations
**Triggers matching keywords:**
- tenant_memberships_guardrails
- tenant_memberships_audit
- trg_audit_log_tenant_memberships
- tenant_memberships_guardrails
- tenant_memberships_audit
- trg_audit_log_tenant_memberships
**Edge Function directories matching keywords:**
- supabase/functions/delete-user
- supabase/functions/invite-member

### Evidence Validation
Cross-source: 17 TypeScript/TSX files, 96 SQL files, 9 RPCs, 2 tables, 8 RLS policies, 6 triggers, 2 Edge Functions matched the capability keyword set.
Consistency note: Capability keywords were derived from the dependency map; repository evidence must be reconciled against the exact runtime contract in the baselines.

### Findings
- No explicit deviations recorded for this capability beyond the keyword-matching evidence inventory above.

### Classification
- (none beyond inventory)

### Confidence
- Confirmed (inventory), Possible/Higher for runtime behavior

### Impact Candidate
- No technical impact identified beyond recorded gaps.

### Root Cause Candidate
- No root cause candidate identified; capability artifacts match the expected dependency model at the repository level.


## 11. Capability Investigation: Analytics
### Capability Summary
Revenue, churn/cohort, top tenants, growth, and system overview dashboards.

### Expected Architecture
`pages/admin/Analytics.tsx`, `Overview.tsx` tabs → `services/admin/analyticsAdminService.ts` and `services/admin/tenantAdminService.ts` → RPCs.

### Expected Dependency
RPCs `get_revenue_metrics`, `get_churn_cohort_metrics`, `get_top_tenants`, `get_tenant_growth`, `get_system_overview`. No Edge Functions.

### Expected Runtime
Overview tab calls `getSystemOverview()`, `getTopTenants()`, `getTenantGrowth()` in parallel on load.

### Repository Trace
**Presentation → Application → Service → Infrastructure → Platform → Data trace:**
- services/admin/analyticsAdminService.ts
- services/admin/billingAdminService.ts
- services/admin/tenantAdminService.ts
- services/billingAutomationService.ts
- services/invoiceService.ts
- services/tenantService.ts
- supabase/functions/_shared/permissions.ts
- supabase/functions/check-subdomain/index.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/cron-admin-tasks/index.ts
- supabase/functions/delete-tenant/index.ts
- supabase/functions/delete-user/index.ts
- supabase/functions/impersonate-tenant/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/process-checkout/index.ts
- supabase/functions/reset-password/index.ts
- supabase/functions/send-billing-email/index.ts
- supabase/functions/send-invitation-email/index.ts
- supabase/functions/system-health/index.ts
- supabase/functions/tenant-backup/index.ts
- supabase/functions/verify-domain/index.ts
- tests/services/tenantAdminService.custom-domain.test.ts
- tests/services/tenantAdminService.subdomain.test.ts

### Evidence Inventory
**Files observed:**
- services/admin/analyticsAdminService.ts
- services/admin/billingAdminService.ts
- services/admin/tenantAdminService.ts
- services/billingAutomationService.ts
- services/invoiceService.ts
- services/tenantService.ts
- supabase/functions/_shared/permissions.ts
- supabase/functions/check-subdomain/index.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/cron-admin-tasks/index.ts
- supabase/functions/delete-tenant/index.ts
- supabase/functions/delete-user/index.ts
- supabase/functions/impersonate-tenant/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/process-checkout/index.ts
- supabase/functions/reset-password/index.ts
- supabase/functions/send-billing-email/index.ts
- supabase/functions/send-invitation-email/index.ts
- supabase/functions/system-health/index.ts
- supabase/functions/tenant-backup/index.ts
- supabase/functions/verify-domain/index.ts
- tests/services/tenantAdminService.custom-domain.test.ts
- tests/services/tenantAdminService.subdomain.test.ts
**Migrations mentioning capability:**
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
- supabase/migrations/20250704000000_phase2_tenant_foundation.sql
- supabase/migrations/20250704000001_phase3_1_core_business_tenant_id.sql
- supabase/migrations/20250704000002_phase3_2_inventory_stock_tenant_id.sql
- supabase/migrations/20250704000003_phase3_3_config_misc_tenant_id.sql
- supabase/migrations/20250704000004_phase4_1_first_tenant_backfill_core.sql
- supabase/migrations/20250704000005_phase4_2_backfill_remaining_tables_orphan_cleanup_fk.sql
- supabase/migrations/20250705000001_phase7_subscription_limits.sql
- supabase/migrations/20250705000002_phase8_admin_dashboard_rpc.sql
- supabase/migrations/20250705000003_phase9_1_create_tenant_edge_function.sql
- supabase/migrations/20250705000004_phase9_5_process_checkout.sql
- supabase/migrations/20250705000005_phase9_5_process_checkout_ledger_fixes.sql
- supabase/migrations/20250705000006_phase9_5_safeupdate_fix.sql
- supabase/migrations/20250705000007_phase9_6_audit_log_rate_limit.sql
- supabase/migrations/20250705000009_phase11_audit_log_triggers.sql
- supabase/migrations/20250705000015_phase15_staging_fixes.sql
- supabase/migrations/20250705000016_phase16_storage_rls_tenant_assets.sql
- supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql
- supabase/migrations/20250706000001_phase_p2_subscription_usage.sql
- supabase/migrations/20250706000002_phase_p3_member_management.sql
**RPCs defined in migrations (matching keywords):**
- get_churn_cohort_metrics
- get_revenue_metrics
- get_system_overview
- get_tenant_growth
- get_top_tenants
**Tables defined in migrations (matching keywords):**
- invoices
- payments
- tenant_subscriptions
- tenants
**RLS policies on matching tables:**
- (none recorded)
**Triggers matching keywords:**
- tenants_before_delete_guardrail
- trg_audit_log_tenants
- trg_audit_log_tenant_subscriptions
- tenants_before_delete_guardrail
- trg_audit_log_tenants
- trg_audit_log_tenant_subscriptions
**Edge Function directories matching keywords:**
- (none recorded)

### Evidence Validation
Cross-source: 23 TypeScript/TSX files, 98 SQL files, 5 RPCs, 4 tables, 0 RLS policies, 6 triggers, 0 Edge Functions matched the capability keyword set.
Consistency note: Capability keywords were derived from the dependency map; repository evidence must be reconciled against the exact runtime contract in the baselines.

### Findings
- No explicit deviations recorded for this capability beyond the keyword-matching evidence inventory above.

### Classification
- (none beyond inventory)

### Confidence
- Confirmed (inventory), Possible/Higher for runtime behavior

### Impact Candidate
- No technical impact identified beyond recorded gaps.

### Root Cause Candidate
- No root cause candidate identified; capability artifacts match the expected dependency model at the repository level.


## 12. Capability Investigation: Audit
### Capability Summary
Audit log viewing, export, and admin login history.

### Expected Architecture
`pages/admin/Audit.tsx` → `services/admin/auditAdminService.ts` → `services/auditService.ts` → `app_audit_log`/`admin_login_history`.

### Expected Dependency
Edge Function `audit-log`; tables `app_audit_log`, `admin_login_history`; triggers writing audit rows.

### Expected Runtime
`AuthContext` writes `LOGIN`/`LOGOUT` audit entries and `admin_login_history` records on sign-in/sign-out; `Audit` page reads audit log.

### Repository Trace
**Presentation → Application → Service → Infrastructure → Platform → Data trace:**
- services/admin/auditAdminService.ts
- services/auditService.ts
- services/loginHistoryService.ts
- supabase/functions/admin-2fa-override/index.ts
- supabase/functions/audit-log/index.ts
- supabase/functions/create-system-admin/index.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/delete-tenant/index.ts
- supabase/functions/delete-user/index.ts
- supabase/functions/end-impersonation/index.ts
- supabase/functions/impersonate-tenant/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/reset-password/index.ts
- tests/services/auditService.test.ts

### Evidence Inventory
**Files observed:**
- services/admin/auditAdminService.ts
- services/auditService.ts
- services/loginHistoryService.ts
- supabase/functions/admin-2fa-override/index.ts
- supabase/functions/audit-log/index.ts
- supabase/functions/create-system-admin/index.ts
- supabase/functions/create-tenant/index.ts
- supabase/functions/delete-tenant/index.ts
- supabase/functions/delete-user/index.ts
- supabase/functions/end-impersonation/index.ts
- supabase/functions/impersonate-tenant/index.ts
- supabase/functions/invite-member/index.ts
- supabase/functions/reset-password/index.ts
- tests/services/auditService.test.ts
**Migrations mentioning capability:**
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
- supabase/migrations/20250705000003_phase9_1_create_tenant_edge_function.sql
- supabase/migrations/20250705000007_phase9_6_audit_log_rate_limit.sql
- supabase/migrations/20250705000009_phase11_audit_log_triggers.sql
- supabase/migrations/20250705000017_phase17_long_term_operations.sql
- supabase/migrations/20250706000004_phase_p5_audit_security.sql
- supabase/migrations/20250706000005_phase_p6_operations_support.sql
- supabase/migrations/20250707000006_phase_p11_3_impersonation.sql
- supabase/migrations/20250708000006_phase_p14_3_migration_reset.sql
- supabase/migrations/20250708000014_phase_p17_2_login_history.sql
- supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql
- supabase/migrations/20250709000001_phase_p17_4_fraud_retention.sql
- supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql
- supabase/migrations/20260710000002_allow_email_failed_audit_action.sql
- supabase/migrations/20260712000001_fix_remove_tenant_member_rpc.sql
- supabase/migrations/20260712000002_fix_update_tenant_member_role_rpc.sql
- supabase/migrations/20260712000003_fix_toggle_tenant_member_active_rpc.sql
- supabase/migrations/20260712000004_fix_remove_system_admin_security_definer.sql
- supabase/migrations/20260712000008_add_audit_log_triggers.sql
- supabase/migrations/20260712000012_add_system_admin_for_edge.sql
**RPCs defined in migrations (matching keywords):**
- audit_log_trigger
- audit_log_trigger_tenant_subscriptions
- get_admin_login_history
- run_admin_cron_audit_cleanup
- trg_tenant_memberships_audit
- write_audit_log
**Tables defined in migrations (matching keywords):**
- admin_login_history
- app_audit_log
- app_audit_log_partitioned
**RLS policies on matching tables:**
- (none recorded)
**Triggers matching keywords:**
- (none recorded)
**Edge Function directories matching keywords:**
- supabase/functions/audit-log

### Evidence Validation
Cross-source: 14 TypeScript/TSX files, 40 SQL files, 6 RPCs, 3 tables, 0 RLS policies, 0 triggers, 1 Edge Functions matched the capability keyword set.
Consistency note: Capability keywords were derived from the dependency map; repository evidence must be reconciled against the exact runtime contract in the baselines.

### Findings
- **F-004:** `AuthContext.tsx` calls `supabase.rpc("activate_pending_memberships", ...)` on `SIGNED_IN`, not through a service wrapper.
  - Classification: Architecture/Execution
  - Confidence: Confirmed
  - Impact candidate: Context layer performs a tenant-membership write, violating the model that contexts must not perform business writes.


### Classification
- `AuthContext.tsx` calls `supabase.rpc("activate_pending_memberships", ...)` on `SIGNED_IN`, not through a service wrapper.

### Confidence
- Architecture/Execution

### Impact Candidate
- Confirmed

### Root Cause Candidate
- `AuthContext.tsx` calls `supabase.rpc("activate_pending_memberships", ...)` on `SIGNED_IN`, not through a service wrapper.: first layer where observed implementation diverges from the architecture/dependency model.


## 13. Capability Investigation: Compliance
### Capability Summary
Data export, terms acceptance, retention, and fraud-detention configuration.

### Expected Architecture
`pages/admin/Compliance.tsx` → `services/admin/complianceAdminService.ts` → `services/complianceService.ts` → RPCs.

### Expected Dependency
RPCs `export_tenant_data`, `get_terms_acceptances`, `record_terms_acceptance`; `fraudRetentionService` for retention/fraud configuration.

### Expected Runtime
Compliance page fetches terms/acceptance and export status; retention/fraud run via cron/admin actions.

### Repository Trace
**Presentation → Application → Service → Infrastructure → Platform → Data trace:**
- services/admin/complianceAdminService.ts
- services/complianceService.ts
- services/fraudRetentionService.ts
- services/operationsService.ts

### Evidence Inventory
**Files observed:**
- services/admin/complianceAdminService.ts
- services/complianceService.ts
- services/fraudRetentionService.ts
- services/operationsService.ts
**Migrations mentioning capability:**
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
- supabase/migrations/20250705000017_phase17_long_term_operations.sql
- supabase/migrations/20250706000005_phase_p6_operations_support.sql
- supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql
- supabase/migrations/20250709000001_phase_p17_4_fraud_retention.sql
- supabase/migrations/20260716000002_gdpr_export_functions.sql
- supabase/schema.sql
**RPCs defined in migrations (matching keywords):**
- export_tenant_data
- get_data_retention_config
- get_data_retention_status
- get_fraud_detection_config
- get_fraud_queue
- get_fraud_stats
- get_terms_acceptances
- record_terms_acceptance
- run_data_retention
- run_fraud_detection
- set_data_retention_config
- set_fraud_detection_config
- update_fraud_queue_status
**Tables defined in migrations (matching keywords):**
- fraud_queue
**RLS policies on matching tables:**
- (none recorded)
**Triggers matching keywords:**
- (none recorded)
**Edge Function directories matching keywords:**
- (none recorded)

### Evidence Validation
Cross-source: 4 TypeScript/TSX files, 7 SQL files, 13 RPCs, 1 tables, 0 RLS policies, 0 triggers, 0 Edge Functions matched the capability keyword set.
Consistency note: Capability keywords were derived from the dependency map; repository evidence must be reconciled against the exact runtime contract in the baselines.

### Findings
- No explicit deviations recorded for this capability beyond the keyword-matching evidence inventory above.

### Classification
- (none beyond inventory)

### Confidence
- Confirmed (inventory), Possible/Higher for runtime behavior

### Impact Candidate
- No technical impact identified beyond recorded gaps.

### Root Cause Candidate
- No root cause candidate identified; capability artifacts match the expected dependency model at the repository level.


## 14. Capability Investigation: Notifications
### Capability Summary
System announcements, email templates, SMS, and notification logs.

### Expected Architecture
Admin surface expected to configure announcements and templates; delivery through Supabase Edge Functions.

### Expected Dependency
Edge Functions `send-sms`, `send-email`, `send-template-email`, `send-ticket-email`; tables `announcements`, `email_templates`, `notification_log`; service `notificationService.ts`.

### Expected Runtime
Admin composes announcement/template; delivery invoked via service/Edge Function; notification log persisted.

### Repository Trace
**Presentation → Application → Service → Infrastructure → Platform → Data trace:**
- services/announcementService.ts
- services/emailTemplateService.ts
- services/notificationService.ts
- supabase/functions/send-email/index.ts
- supabase/functions/send-sms/index.ts
- supabase/functions/send-template-email/index.ts

### Evidence Inventory
**Files observed:**
- services/announcementService.ts
- services/emailTemplateService.ts
- services/notificationService.ts
- supabase/functions/send-email/index.ts
- supabase/functions/send-sms/index.ts
- supabase/functions/send-template-email/index.ts
**Migrations mentioning capability:**
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
- supabase/migrations/20250707000007_phase_p12_1_announcements.sql
- supabase/migrations/20250707000008_phase_p12_2_email_templates.sql
- supabase/migrations/20250708000000_phase_p12_3_notification_log.sql
- supabase/migrations/20260710000001_add_tenant_credentials_template.sql
- supabase/migrations/20260711000002_remove_tenant_credentials_password.sql
- supabase/migrations/20260713053608_sp2_4_announcement_audience_active_range.sql
- supabase/migrations/20260716000001_admin_cron_jobs.sql
- supabase/schema.sql
**RPCs defined in migrations (matching keywords):**
- get_current_announcements_for_tenant
- get_email_template_by_key
- publish_scheduled_announcements
- update_announcement_updated_at
- update_email_template_updated_at
- update_notification_log_updated_at
**Tables defined in migrations (matching keywords):**
- announcements
- email_templates
- notification_logs
**RLS policies on matching tables:**
- (none recorded)
**Triggers matching keywords:**
- update_announcements_updated_at
- update_email_templates_updated_at
- update_notification_logs_updated_at
- update_announcements_updated_at
- update_email_templates_updated_at
- update_notification_logs_updated_at
**Edge Function directories matching keywords:**
- supabase/functions/send-email
- supabase/functions/send-sms

### Evidence Validation
Cross-source: 6 TypeScript/TSX files, 9 SQL files, 6 RPCs, 3 tables, 0 RLS policies, 6 triggers, 2 Edge Functions matched the capability keyword set.
Consistency note: Capability keywords were derived from the dependency map; repository evidence must be reconciled against the exact runtime contract in the baselines.

### Findings
- **F-005:** No `pages/admin/*` route or component for announcements/email templates was observed in the scan.
  - Classification: Capability/Gap
  - Confidence: Confirmed
  - Impact candidate: Notification/announcement admin surface may be absent or merged into Settings.


### Classification
- No `pages/admin/*` route or component for announcements/email templates was observed in the scan.

### Confidence
- Capability/Gap

### Impact Candidate
- Confirmed

### Root Cause Candidate
- No `pages/admin/*` route or component for announcements/email templates was observed in the scan.: first layer where observed implementation diverges from the architecture/dependency model.


## 15. Capability Investigation: Storage
### Capability Summary
Tenant asset storage RLS and backup/restore archives.

### Expected Architecture
`services/systemBackupService.ts`, `tenantBackupService.ts`, `tenantRestoreService.ts` → Edge Functions `system-backup`, `tenant-backup`, `tenant-restore`. Storage buckets scoped by tenant.

### Expected Dependency
Migration `phase16_storage_rls_tenant_assets`; storage objects with RLS; backup/restore functions.

### Expected Runtime
Admin triggers backup/restore; Edge Function with service_role validates admin and copies/extracts archive.

### Repository Trace
**Presentation → Application → Service → Infrastructure → Platform → Data trace:**
- services/supabaseService.ts
- services/systemBackupService.ts
- services/tenantBackupService.ts
- services/tenantRestoreService.ts
- services/tenantService.ts
- services/twoFactorService.ts
- supabase/functions/system-backup/index.ts
- supabase/functions/tenant-backup/index.ts
- supabase/functions/tenant-restore/index.ts

### Evidence Inventory
**Files observed:**
- services/supabaseService.ts
- services/systemBackupService.ts
- services/tenantBackupService.ts
- services/tenantRestoreService.ts
- services/tenantService.ts
- services/twoFactorService.ts
- supabase/functions/system-backup/index.ts
- supabase/functions/tenant-backup/index.ts
- supabase/functions/tenant-restore/index.ts
**Migrations mentioning capability:**
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
- supabase/migrations/20250704000005_phase4_2_backfill_remaining_tables_orphan_cleanup_fk.sql
- supabase/migrations/20250705000010_phase14_cleanup_backup_tables.sql
- supabase/migrations/20250705000015_phase15_staging_fixes.sql
- supabase/migrations/20250705000016_phase16_storage_rls_tenant_assets.sql
- supabase/migrations/20250705000017_phase17_long_term_operations.sql
- supabase/migrations/20250708000002_phase_p13_3_storage_backup.sql
- supabase/migrations/20250708000004_phase_p14_1_tenant_backup.sql
- supabase/migrations/20250708000005_phase_p14_2_restore_archive.sql
- supabase/migrations/20250708000006_phase_p14_3_migration_reset.sql
- supabase/migrations/20250708000013_phase_p17_1_2fa_totp.sql
- supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql
- supabase/migrations/20260711000002_remove_tenant_credentials_password.sql
- supabase/migrations/20260712140000_sp1_4_missing_rls_policies.sql
- supabase/migrations/20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql
- supabase/migrations/rollback/20260713000002_standardize_tenants_and_memberships_down.sql
- supabase/migrations/rollback/20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.reverse.sql
- supabase/schema.sql
**RPCs defined in migrations (matching keywords):**
- delete_2fa_backup_codes
- generate_2fa_backup_codes
- get_tenant_backup_tables
- get_tenant_restore_table_order
- get_tenant_storage_usage
- list_2fa_backup_codes
- purge_old_backup_code_attempts
- restore_tenant_tables
- verify_2fa_backup_code
**Tables defined in migrations (matching keywords):**
- (none recorded)
**RLS policies on matching tables:**
- (none recorded)
**Triggers matching keywords:**
- (none recorded)
**Edge Function directories matching keywords:**
- supabase/functions/system-backup
- supabase/functions/tenant-backup
- supabase/functions/tenant-restore

### Evidence Validation
Cross-source: 9 TypeScript/TSX files, 18 SQL files, 9 RPCs, 0 tables, 0 RLS policies, 0 triggers, 3 Edge Functions matched the capability keyword set.
Consistency note: Capability keywords were derived from the dependency map; repository evidence must be reconciled against the exact runtime contract in the baselines.

### Findings
- No explicit deviations recorded for this capability beyond the keyword-matching evidence inventory above.

### Classification
- (none beyond inventory)

### Confidence
- Confirmed (inventory), Possible/Higher for runtime behavior

### Impact Candidate
- No technical impact identified beyond recorded gaps.

### Root Cause Candidate
- No root cause candidate identified; capability artifacts match the expected dependency model at the repository level.


## 16. Capability Investigation: Monitoring
### Capability Summary
System health, error/performance, cron job, and admin health checks.

### Expected Architecture
`pages/admin/Health.tsx` → `services/admin/supportService.ts` and base `systemHealthService.ts`, `errorPerformanceService.ts`, `cronJobService.ts` → Edge Functions `system-health`, `admin-health-check`, `error-performance`, `cron-admin-tasks`.

### Expected Dependency
Tables `cron_job_logs`, `error_logs`, `system_health`; RPCs `get_system_overview`, `get_heavy_op_jobs`, `get_connection_pool_stats`, `get_read_replica_status`.

### Expected Runtime
Health page polls admin-health-check/system-health; error/performance logs queried.

### Repository Trace
**Presentation → Application → Service → Infrastructure → Platform → Data trace:**
- services/admin/supportService.ts
- services/cronJobService.ts
- services/errorPerformanceService.ts
- services/heavyOpsQueueService.ts
- services/systemHealthService.ts
- supabase/functions/cron-admin-tasks/index.ts
- supabase/functions/error-performance/index.ts
- supabase/functions/system-health/index.ts

### Evidence Inventory
**Files observed:**
- services/admin/supportService.ts
- services/cronJobService.ts
- services/errorPerformanceService.ts
- services/heavyOpsQueueService.ts
- services/systemHealthService.ts
- supabase/functions/cron-admin-tasks/index.ts
- supabase/functions/error-performance/index.ts
- supabase/functions/system-health/index.ts
**Migrations mentioning capability:**
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
- supabase/migrations/20250705000017_phase17_long_term_operations.sql
- supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql
- supabase/migrations/20250706000001_phase_p2_subscription_usage.sql
- supabase/migrations/20250706000005_phase_p6_operations_support.sql
- supabase/migrations/20250706000008_phase_p7_2_invoice_create_pricing.sql
- supabase/migrations/20250706000010_phase_p7_5_expiry_renewal_cron.sql
- supabase/migrations/20250707000000_phase_p9_1_billing_reminders.sql
- supabase/migrations/20250707000002_phase_p9_2_billing_automation_dashboard.sql
- supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql
- supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql
- supabase/migrations/20250707000007_phase_p12_1_announcements.sql
- supabase/migrations/20250707000008_phase_p12_2_email_templates.sql
- supabase/migrations/20250708000000_phase_p12_3_notification_log.sql
- supabase/migrations/20250708000001_phase_p13_2_error_performance.sql
- supabase/migrations/20250708000005_phase_p14_2_restore_archive.sql
- supabase/migrations/20250708000008_phase_p15_2_webhooks.sql
- supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql
- supabase/migrations/20250709000001_phase_p17_4_fraud_retention.sql
- supabase/migrations/20260708000002_phase_p18_3_read_replica_queue.sql
**RPCs defined in migrations (matching keywords):**
- claim_heavy_op_job
- complete_heavy_op_job
- enqueue_heavy_op_job
- get_admin_cron_config
- get_connection_pool_stats
- get_error_log_summary
- get_heavy_op_jobs
- get_query_performance_metrics
- get_read_replica_status
- is_valid_admin_cron_url
- retry_heavy_op_job
- run_admin_cron_audit_cleanup
- run_admin_cron_billing_reminders
**Tables defined in migrations (matching keywords):**
- cron_job_logs
- error_logs
**RLS policies on matching tables:**
- cron_job_logs_select_admin on cron_job_logs
- cron_job_logs_select_admin on cron_job_logs
**Triggers matching keywords:**
- (none recorded)
**Edge Function directories matching keywords:**
- supabase/functions/admin-health-check
- supabase/functions/cron-admin-tasks
- supabase/functions/error-performance
- supabase/functions/system-health

### Evidence Validation
Cross-source: 8 TypeScript/TSX files, 29 SQL files, 13 RPCs, 2 tables, 2 RLS policies, 0 triggers, 4 Edge Functions matched the capability keyword set.
Consistency note: Capability keywords were derived from the dependency map; repository evidence must be reconciled against the exact runtime contract in the baselines.

### Findings
- No explicit deviations recorded for this capability beyond the keyword-matching evidence inventory above.

### Classification
- (none beyond inventory)

### Confidence
- Confirmed (inventory), Possible/Higher for runtime behavior

### Impact Candidate
- No technical impact identified beyond recorded gaps.

### Root Cause Candidate
- No root cause candidate identified; capability artifacts match the expected dependency model at the repository level.


## 17. Capability Investigation: Configuration
### Capability Summary
System settings, security settings, license management, and feature flags.

### Expected Architecture
`pages/admin/Settings.tsx` and `Security.tsx` → `services/admin/licenseService.ts`, `services/admin/permissions.ts`, `hooks/useAdminFeatureFlags.ts` → `system_settings`, `licenses`, `feature_flags`.

### Expected Dependency
Migrations `phase_5_long_term_admin_feature_flags`; Edge Function `admin-2fa-override`; RPCs for settings update; service `apiKeyService.ts`.

### Expected Runtime
Admin toggles settings; license and feature flags read by `useAdminFeatureFlags`; API keys managed via `apiKeyService`.

### Repository Trace
**Presentation → Application → Service → Infrastructure → Platform → Data trace:**
- services/admin/licenseService.ts
- services/apiKeyService.ts
- services/bankAccountService.ts
- services/emailTemplateService.ts
- services/tenantService.ts
- supabase/functions/admin-2fa-override/index.ts
- supabase/functions/send-billing-email/index.ts
- supabase/functions/send-ticket-email/index.ts
- tests/services/licenseService.test.ts
- tests/services/systemAdminService.security.test.ts

### Evidence Inventory
**Files observed:**
- services/admin/licenseService.ts
- services/apiKeyService.ts
- services/bankAccountService.ts
- services/emailTemplateService.ts
- services/tenantService.ts
- supabase/functions/admin-2fa-override/index.ts
- supabase/functions/send-billing-email/index.ts
- supabase/functions/send-ticket-email/index.ts
- tests/services/licenseService.test.ts
- tests/services/systemAdminService.security.test.ts
**Migrations mentioning capability:**
- supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
- supabase/migrations/20250704000000_phase2_tenant_foundation.sql
- supabase/migrations/20250704000003_phase3_3_config_misc_tenant_id.sql
- supabase/migrations/20250704000005_phase4_2_backfill_remaining_tables_orphan_cleanup_fk.sql
- supabase/migrations/20250704000006_phase5_1_current_tenant_id.sql
- supabase/migrations/20250704000007_phase5_2_rls_policies_core_tables.sql
- supabase/migrations/20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql
- supabase/migrations/20250705000001_phase7_subscription_limits.sql
- supabase/migrations/20250705000002_phase8_admin_dashboard_rpc.sql
- supabase/migrations/20250705000003_phase9_1_create_tenant_edge_function.sql
- supabase/migrations/20250705000004_phase9_5_process_checkout.sql
- supabase/migrations/20250705000005_phase9_5_process_checkout_ledger_fixes.sql
- supabase/migrations/20250705000006_phase9_5_safeupdate_fix.sql
- supabase/migrations/20250705000007_phase9_6_audit_log_rate_limit.sql
- supabase/migrations/20250705000008_phase10_1_db_policies_theo_role.sql
- supabase/migrations/20250705000009_phase11_audit_log_triggers.sql
- supabase/migrations/20250705000015_phase15_staging_fixes.sql
- supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql
- supabase/migrations/20250706000001_phase_p2_subscription_usage.sql
- supabase/migrations/20250706000002_phase_p3_member_management.sql
**RPCs defined in migrations (matching keywords):**
- auth_tenant_api_key
- create_tenant_api_key
- generate_tenant_license
- get_tenant_feature_flags
- list_tenant_api_keys
- revoke_tenant_api_key
- system_settings_set_updated_by
- update_tenant_feature_flags
- validate_tenant_license
**Tables defined in migrations (matching keywords):**
- licenses
- system_settings
- tenant_api_keys
**RLS policies on matching tables:**
- (none recorded)
**Triggers matching keywords:**
- system_settings_updated_by_trigger
- system_settings_updated_by_trigger
**Edge Function directories matching keywords:**
- supabase/functions/admin-2fa-override

### Evidence Validation
Cross-source: 10 TypeScript/TSX files, 119 SQL files, 9 RPCs, 3 tables, 0 RLS policies, 2 triggers, 1 Edge Functions matched the capability keyword set.
Consistency note: Capability keywords were derived from the dependency map; repository evidence must be reconciled against the exact runtime contract in the baselines.

### Findings
- No explicit deviations recorded for this capability beyond the keyword-matching evidence inventory above.

### Classification
- (none beyond inventory)

### Confidence
- Confirmed (inventory), Possible/Higher for runtime behavior

### Impact Candidate
- No technical impact identified beyond recorded gaps.

### Root Cause Candidate
- No root cause candidate identified; capability artifacts match the expected dependency model at the repository level.

## 18. Global Cross-Layer Analysis
Shared artifacts observed across multiple capabilities:
| Artifact | Consumers (sample) |
|---|---|
| from:system_admins | App.tsx, supabase/functions/_shared/permissions.ts, supabase/functions/create-system-admin/index.ts, supabase/functions/db-maintenance/index.ts, supabase/functions/delete-tenant/index.ts ... |
| from:tenant_memberships | contexts/TenantContext.tsx, lib/permissions.ts, services/admin/memberAdminService.ts, services/admin/tenantAdminService.ts, services/subscriptionService.ts ... |
| from:tenants | services/admin/tenantAdminService.ts, services/tenantService.ts, supabase/functions/_shared/permissions.ts, supabase/functions/check-subdomain/index.ts, supabase/functions/create-tenant/index.ts ... |
| from:app_audit_log | services/auditService.ts, supabase/functions/admin-2fa-override/index.ts, supabase/functions/audit-log/index.ts, supabase/functions/create-system-admin/index.ts, supabase/functions/create-tenant/index.ts ... |
| from:rate_limit_logs | supabase/functions/audit-log/index.ts, supabase/functions/check-subdomain/index.ts, supabase/functions/create-system-admin/index.ts, supabase/functions/create-tenant/index.ts, supabase/functions/delete-tenant/index.ts ... |
| from:tenant_subscriptions | services/admin/billingAdminService.ts, services/tenantService.ts, supabase/functions/create-tenant/index.ts, supabase/functions/cron-admin-tasks/index.ts, supabase/functions/invite-member/index.ts |
| from:system_settings | services/bankAccountService.ts, services/emailTemplateService.ts, supabase/functions/send-billing-email/index.ts, supabase/functions/send-ticket-email/index.ts |
| from:products | services/subscriptionService.ts, services/supabaseService.ts, tests/integration/tenant-isolation.test.ts, tests/rls.test.ts |
| from:orders | services/supabaseService.ts, tests/integration/tenant-isolation.test.ts, utils/excel/orderImporter.ts, utils/invoiceNumber.ts |
| get_tenant_by_subdomain | contexts/TenantContext.tsx, lib/tenant.ts |
| is_system_admin | lib/permissions.ts, services/tenantService.ts |
| from:bank_accounts | services/bankAccountService.ts, supabase/functions/send-billing-email/index.ts |
| from:invoice_reminder_logs | services/billingReminderService.ts, supabase/functions/send-billing-email/index.ts |
| from:cron_job_logs | services/cronJobService.ts, supabase/functions/cron-admin-tasks/index.ts |
| from:invoices | services/invoiceService.ts, supabase/functions/send-billing-email/index.ts |
| from:customers | services/supabaseService.ts, utils/excel/orderImporter.ts |
| get_tenant_usage_summary | services/admin/memberAdminService.ts, services/tenantService.ts |
| from:tenant_credentials | services/tenantService.ts, supabase/functions/create-tenant/index.ts |
| from:audit_log | services/admin/auditAdminService.ts, supabase/functions/cron-admin-tasks/index.ts |
| get_user_by_email | supabase/functions/invite-member/index.ts, supabase/functions/reset-password/index.ts |
| from:support_tickets | services/admin/supportService.ts, supabase/functions/send-ticket-email/index.ts |
| from:ticket_replies | services/admin/supportService.ts, supabase/functions/send-ticket-email/index.ts |

## 19. Forensic Evidence Package
### Evidence Inventory (sample)
| Capability | Artifact | Type |
|---|---|---|
| Authentication | activate_pending_memberships | RPC |
| Authentication | can_use_feature | RPC |
| Authentication | get_tenant_by_subdomain | RPC |
| Authentication | has_tenant_role | RPC |
| Authentication | is_system_admin | RPC |
| Authentication | is_tenant_owner | RPC |
| Authentication | admin_login_history | Table |
| Authentication | app_audit_log | Table |
| Authentication | app_audit_log_partitioned | Table |
| Authentication | system_admins | Table |
| Authentication | tenant_memberships | Table |
| Authorization | can_use_feature | RPC |
| Authorization | has_tenant_role | RPC |
| Authorization | is_system_admin | RPC |
| Authorization | is_tenant_owner | RPC |
| Authorization | admin_roles | Table |
| Authorization | system_admins | Table |
| Authorization | tenant_memberships | Table |
| Authorization | admin_roles_system_admin_all on admin_roles | RLS |
| Authorization | admin_roles_system_admin_all on admin_roles | RLS |
| Tenant | bulk_update_tenants | RPC |
| Tenant | create_tenant_with_admin | RPC |
| Tenant | delete_tenant_safe | RPC |
| Tenant | get_system_overview | RPC |
| Tenant | get_tenant_by_domain | RPC |
| Tenant | get_tenant_by_subdomain | RPC |
| Tenant | get_tenant_growth | RPC |
| Tenant | get_tenant_usage_summary | RPC |
| Tenant | get_tenants_admin | RPC |
| Tenant | get_tenants_for_user | RPC |
| Tenant | get_top_tenants | RPC |
| Tenant | search_tenants | RPC |
| Tenant | set_tenant_subdomain | RPC |
| Tenant | update_tenant | RPC |
| Tenant | update_tenant_feature_flags | RPC |
| Tenant | update_tenant_ip_allowlist | RPC |
| Tenant | update_tenant_member_role | RPC |
| Tenant | update_tenant_session_timeout | RPC |
| Tenant | update_tenant_status | RPC |
| Tenant | update_tenant_subscription | RPC |
| Tenant | update_tenant_webhook | RPC |
| Tenant | invitations | Table |
| Tenant | licenses | Table |
| Tenant | tenant_memberships | Table |
| Tenant | tenant_subscriptions | Table |
| Tenant | tenants | Table |
| Tenant | invitations_select_for_members on invitations | RLS |
| Tenant | invitations_insert_for_admins on invitations | RLS |
| Tenant | invitations_update_for_admins on invitations | RLS |
| Tenant | invitations_delete_for_admins on invitations | RLS |
| Tenant | invitations_select_for_members on invitations | RLS |
| Tenant | invitations_insert_for_admins on invitations | RLS |
| Tenant | invitations_update_for_admins on invitations | RLS |
| Tenant | invitations_delete_for_admins on invitations | RLS |
| Billing | apply_voucher_to_invoice | RPC |
| Billing | audit_log_trigger_tenant_subscriptions | RPC |
| Billing | cancel_subscription | RPC |
| Billing | compute_billing_period_end | RPC |
| Billing | confirm_payment | RPC |
| Billing | create_invoice | RPC |
... (see above capability sections for full per-capability inventories)

### Trace Inventory (sample)
| Capability | File | Language |
|---|---|---|
| Authentication | App.tsx | TypeScript/TSX |
| Authentication | contexts/AuthContext.tsx | TypeScript/TSX |
| Authentication | contexts/TenantContext.tsx | TypeScript/TSX |
| Authentication | lib/permissions.ts | TypeScript/TSX |
| Authentication | lib/tenant.ts | TypeScript/TSX |
| Authentication | pages/Login.tsx | TypeScript/TSX |
| Authentication | services/admin/memberAdminService.ts | TypeScript/TSX |
| Authentication | services/admin/tenantAdminService.ts | TypeScript/TSX |
| Authentication | services/auditService.ts | TypeScript/TSX |
| Authentication | services/loginHistoryService.ts | TypeScript/TSX |
| Authentication | services/subscriptionService.ts | TypeScript/TSX |
| Authentication | services/tenantService.ts | TypeScript/TSX |
| Authentication | services/twoFactorService.ts | TypeScript/TSX |
| Authentication | supabase/functions/_shared/permissions.ts | TypeScript/TSX |
| Authentication | supabase/functions/admin-2fa-override/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/audit-log/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/create-system-admin/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/create-tenant/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/db-maintenance/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/delete-tenant/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/delete-user/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/end-impersonation/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/error-performance/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/impersonate-tenant/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/invite-member/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/process-checkout/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/reset-password/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/send-billing-email/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/send-email/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/send-sms/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/send-template-email/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/send-ticket-email/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/system-backup/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/system-health/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/tenant-backup/index.ts | TypeScript/TSX |
| Authentication | supabase/functions/tenant-restore/index.ts | TypeScript/TSX |
| Authentication | supabase/migrations/20260712000012_add_system_admin_for_edge.sql | TypeScript/TSX |
| Authentication | supabase/schema.sql | TypeScript/TSX |
| Authentication | tests/integration/system-admin-creation-integration.test.ts | TypeScript/TSX |
| Authentication | tests/rls.test.ts | TypeScript/TSX |
| Authentication | supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql | SQL |
| Authentication | supabase/migrations/20250704000000_phase2_tenant_foundation.sql | SQL |
| Authentication | supabase/migrations/20250704000004_phase4_1_first_tenant_backfill_core.sql | SQL |
| Authentication | supabase/migrations/20250704000007_phase5_2_rls_policies_core_tables.sql | SQL |
| Authentication | supabase/migrations/20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql | SQL |
| Authentication | supabase/migrations/20250705000001_phase7_subscription_limits.sql | SQL |
| Authentication | supabase/migrations/20250705000002_phase8_admin_dashboard_rpc.sql | SQL |
| Authentication | supabase/migrations/20250705000003_phase9_1_create_tenant_edge_function.sql | SQL |
| Authentication | supabase/migrations/20250705000004_phase9_5_process_checkout.sql | SQL |
| Authentication | supabase/migrations/20250705000007_phase9_6_audit_log_rate_limit.sql | SQL |
| Authentication | supabase/migrations/20250705000008_phase10_1_db_policies_theo_role.sql | SQL |
| Authentication | supabase/migrations/20250705000009_phase11_audit_log_triggers.sql | SQL |
| Authentication | supabase/migrations/20250705000015_phase15_staging_fixes.sql | SQL |
| Authentication | supabase/migrations/20250705000017_phase17_long_term_operations.sql | SQL |
| Authentication | supabase/migrations/20250706000000_phase_p1_tenant_list_core_management.sql | SQL |
| Authentication | supabase/migrations/20250706000001_phase_p2_subscription_usage.sql | SQL |
| Authentication | supabase/migrations/20250706000002_phase_p3_member_management.sql | SQL |
| Authentication | supabase/migrations/20250706000003_phase_p4_system_analytics.sql | SQL |
| Authentication | supabase/migrations/20250706000004_phase_p5_audit_security.sql | SQL |
| Authentication | supabase/migrations/20250706000005_phase_p6_operations_support.sql | SQL |
... (full trace inventory embedded in Sections 6-17)

### Repository Gaps
- No dedicated admin page for Notifications/Announcements was observed in `pages/admin/`.
- No dedicated admin page for Storage backup/restore observed; functionality appears in `TenantDetail` or service wrappers.
- Runtime behavior of RLS, realtime subscription delivery, and Edge Function cold-start cannot be confirmed from repository files alone.

### Runtime Gaps
- Live `app_audit_log`, `admin_login_history`, and `admin_events` rows not inspected.
- No runtime smoke-test results in repository; execution model verified by static trace only.
- Edge Function environment variables (service_role keys, provider secrets) not validated for actual deployment.

### Configuration Gaps
- `.env.example` was not read in full; exact required variables for admin surface not extracted.
- Supabase project ref and management token references were observed in dependency map but not traced to CI/CD manifests.

## 20. Cross-Layer Matrices
### Capability Matrix
| Capability | Files | Migrations | RPCs | Tables | RLS | Triggers | Edge |
|---|---|---|---|---|---|---|---|
| Authentication | 40 | 117 | 6 | 5 | 0 | 6 | 0 |
| Authorization | 32 | 112 | 4 | 3 | 2 | 8 | 0 |
| Tenant | 31 | 105 | 21 | 5 | 8 | 12 | 0 |
| Billing | 13 | 66 | 32 | 8 | 6 | 4 | 2 |
| Members | 17 | 96 | 9 | 2 | 8 | 6 | 2 |
| Analytics | 23 | 98 | 5 | 4 | 0 | 6 | 0 |
| Audit | 14 | 40 | 6 | 3 | 0 | 0 | 1 |
| Compliance | 4 | 7 | 13 | 1 | 0 | 0 | 0 |
| Notifications | 6 | 9 | 6 | 3 | 0 | 6 | 2 |
| Storage | 9 | 18 | 9 | 0 | 0 | 0 | 3 |
| Monitoring | 8 | 29 | 13 | 2 | 2 | 0 | 4 |
| Configuration | 10 | 119 | 9 | 3 | 0 | 2 | 1 |

### Classification Matrix
| Finding ID | Capability | Classification | Confidence | Root Cause Candidate |
|---|---|---|---|---|
| F-001 | Global | Architecture/Security | Confirmed | App.tsx directly queries `system_admins` table for the admin gate rather than using `isSystemAdmin()` helper or `is_system_admin` RPC |
| F-002 | Global | Architecture/Security | Confirmed | `lib/permissions.ts` uses `is_system_admin` RPC while `App.tsx` uses direct `from("system_admins")`; two different enforcement paths for the same system-admin check. |
| F-003 | Global | Dependency | Confirmed | Multiple tenant management RPCs and Edge Functions exist; the repository trace shows `services/admin/tenantAdminService.ts` and `services/tenantService.ts` as seams. |
| F-004 | Global | Architecture/Execution | Confirmed | `AuthContext.tsx` calls `supabase.rpc("activate_pending_memberships", ...)` on `SIGNED_IN`, not through a service wrapper. |
| F-005 | Global | Capability/Gap | Confirmed | No `pages/admin/*` route or component for announcements/email templates was observed in the scan. |
| F-006 | Global | Architecture | Confirmed | lib/supabase.ts single client |
| F-007 | Global | Execution | Confirmed | contexts/TenantContext.tsx |
| F-008 | Global | Security/Architecture | Confirmed | App.tsx:211-217 direct table query |
| F-009 | Global | Architecture | Confirmed | contexts/AuthContext.tsx:90-92 |

### Confidence Matrix
| Confidence | Count |
|---|---|
| Confirmed | 9 |

## 21. Findings Summary
**F-001**
- Evidence: App.tsx directly queries `system_admins` table for the admin gate rather than using `isSystemAdmin()` helper or `is_system_admin` RPC
- Trace: Authentication
- Visited artifacts: per capability scan
- Classification: Architecture/Security
- Confidence: Confirmed
- Impact candidate: Admin gate logic duplicated and client-side, depends on RLS for `system_admins` direct access.
- Root cause candidate: App.tsx directly queries `system_admins` table for the admin gate rather than using `isSystemAdmin()` helper or `is_system_admin` RPC

**F-002**
- Evidence: `lib/permissions.ts` uses `is_system_admin` RPC while `App.tsx` uses direct `from("system_admins")`; two different enforcement paths for the same system-admin check.
- Trace: Authorization
- Visited artifacts: per capability scan
- Classification: Architecture/Security
- Confidence: Confirmed
- Impact candidate: Inconsistent authorization surface; the direct `from` query may be subject to different RLS/PostgREST behavior than the SECURITY DEFINER RPC.
- Root cause candidate: `lib/permissions.ts` uses `is_system_admin` RPC while `App.tsx` uses direct `from("system_admins")`; two different enforcement paths for the same system-admin check.

**F-003**
- Evidence: Multiple tenant management RPCs and Edge Functions exist; the repository trace shows `services/admin/tenantAdminService.ts` and `services/tenantService.ts` as seams.
- Trace: Tenant
- Visited artifacts: per capability scan
- Classification: Dependency
- Confidence: Confirmed
- Impact candidate: All tenant mutations flow through these wrappers/Edge Functions per observed imports.
- Root cause candidate: Multiple tenant management RPCs and Edge Functions exist; the repository trace shows `services/admin/tenantAdminService.ts` and `services/tenantService.ts` as seams.

**F-004**
- Evidence: `AuthContext.tsx` calls `supabase.rpc("activate_pending_memberships", ...)` on `SIGNED_IN`, not through a service wrapper.
- Trace: Audit
- Visited artifacts: per capability scan
- Classification: Architecture/Execution
- Confidence: Confirmed
- Impact candidate: Context layer performs a tenant-membership write, violating the model that contexts must not perform business writes.
- Root cause candidate: `AuthContext.tsx` calls `supabase.rpc("activate_pending_memberships", ...)` on `SIGNED_IN`, not through a service wrapper.

**F-005**
- Evidence: No `pages/admin/*` route or component for announcements/email templates was observed in the scan.
- Trace: Notifications
- Visited artifacts: per capability scan
- Classification: Capability/Gap
- Confidence: Confirmed
- Impact candidate: Notification/announcement admin surface may be absent or merged into Settings.
- Root cause candidate: No `pages/admin/*` route or component for announcements/email templates was observed in the scan.

**F-006**
- Evidence: `lib/supabase.ts` is the single typed Supabase client imported by every service/context; `tenantFetch` injects `x-tenant-id` from module-level `currentTenantId`.
- Trace: 
- Visited artifacts: 
- Classification: Architecture
- Confidence: Confirmed
- Impact candidate: Correct centralization; any bug in `tenantFetch` or `currentTenantId` affects all admin calls.
- Root cause candidate: lib/supabase.ts single client

**F-007**
- Evidence: `TenantContext.tsx` is the only runtime writer of `currentTenantId` observed; it clears tenant when host is `admin`.
- Trace: 
- Visited artifacts: 
- Classification: Execution
- Confidence: Confirmed
- Impact candidate: Tenant isolation for admin host depends on `TenantContext` clearing ID before any page data fetches.
- Root cause candidate: contexts/TenantContext.tsx

**F-008**
- Evidence: `App.tsx` admin gate uses direct `supabase.from("system_admins")` query, not `lib/permissions.ts` `isSystemAdmin()` or `is_system_admin` RPC.
- Trace: 
- Visited artifacts: 
- Classification: Security/Architecture
- Confidence: Confirmed
- Impact candidate: Bypass of the documented `is_system_admin` SECURITY DEFINER RPC; the admin gate is a second, client-side authorization path that may fail differently if RLS or PostgREST policy changes.
- Root cause candidate: App.tsx:211-217 direct table query

**F-009**
- Evidence: `AuthContext.tsx` performs `supabase.rpc("activate_pending_memberships", ...)` on SIGNED_IN without using a service wrapper.
- Trace: 
- Visited artifacts: 
- Classification: Architecture
- Confidence: Confirmed
- Impact candidate: Context layer performs a tenant-membership state mutation, violating the documented ownership that contexts must not perform business writes.
- Root cause candidate: contexts/AuthContext.tsx:90-92

## 22. Stopping Point
Root Cause Analysis is intentionally NOT performed here. The evidence package above is handed to `07_ADMIN_DASHBOARD_ROOT_CAUSE_ANALYSIS.md` and `08_ADMIN_DASHBOARD_FINAL_RECOMMENDATIONS.md`.