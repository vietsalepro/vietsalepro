# Admin Dashboard Dependency Map

**Scope:** VietSale Pro Admin Dashboard — dependencies reachable from the admin surface only.  
**Baseline:** `ADMIN_DASHBOARD_PLAN/01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md`  
**Source:** `codebase-memory` MCP + direct repository verification.  

This document explains **what depends on what**, **why the dependency exists**, and **how changes propagate** through the admin dashboard. It is not an import graph or file inventory; it is an enterprise dependency model written from the admin dashboard outward.

---

## 1. Dependency Overview

### 1.1 Dependency Philosophy

The admin dashboard is a privileged view inside the same Vite + React SPA as the tenant-facing app. Its dependencies are intentionally layered and gated:

1. **Backend is the security boundary.** The React layers only present state and collect input; every privileged mutation travels through `services/admin/*` wrappers to `services/*` base services, then to Supabase RPCs, Edge Functions, or (rarely) direct `from()` queries protected by RLS / `SECURITY DEFINER` checks.
2. **Thin admin wrappers.** The `services/admin/*` files centralize admin call sites and re-export base services; they are the seam between the admin UI and the operational service layer. <ref_file file="C:/PROJECT/vietsalepro/services/admin/tenantAdminService.ts" />
3. **Single Supabase client.** `lib/supabase.ts` owns the typed client and injects `x-tenant-id` on every request. All service calls share this instance. <ref_file file="C:/PROJECT/vietsalepro/lib/supabase.ts" />
4. **Context-first state.** `AuthContext` and `TenantContext` are the runtime roots; without them `App.tsx` cannot decide whether to render the admin route tree.

### 1.2 Layer Dependency Direction

Dependencies flow strictly downward, except for shared utility modules (hooks, `lib/permissions.ts`) which are consumed horizontally.

```text
Browser / admin.vietsalepro.com
        ↓
    App.tsx  (route guard + isSystemAdmin)
        ↓
AdminLayout.tsx → AdminShell.tsx → AdminSidebar.tsx
        ↓
Admin pages (Outlet) + AdminDashboardInner tabs
        ↓
    useAuth / useTenant / useAdminList / useConfirmDialog
        ↓
services/admin/*.ts  (admin wrappers)
        ↓
services/*.ts        (base services)
        ↓
    lib/supabase.ts  (typed client + tenantFetch)
        ↓
Supabase Auth / PostgREST / Edge Functions / Realtime / Storage
        ↓
Postgres tables, RPCs, triggers, RLS
```

### 1.3 Dependency Boundaries

- **Host boundary:** `admin` subdomain or `/admin/*` path activates the admin route tree. `lib/tenant.ts` and `App.tsx` enforce this. <ref_file file="C:/PROJECT/vietsalepro/App.tsx" /> <ref_file file="C:/PROJECT/vietsalepro/lib/tenant.ts" />
- **Identity boundary:** `AuthContext` supplies `user`/`session`; `lib/permissions.ts` `isSystemAdmin()` checks `public.system_admins` via the `is_system_admin` RPC. <ref_file file="C:/PROJECT/vietsalepro/lib/permissions.ts" />
- **Tenant boundary:** `TenantContext` clears `currentTenantId` on `admin` host, but individual admin pages still select a target tenant for tenant-scoped operations.
- **Service boundary:** React components must not call `supabase` directly; all admin data access goes through `services/admin/*` wrappers.

---

## 2. Capability Dependency Map

One subsection per major admin capability. Each table explains the **purpose**, **entry pages**, **primary components**, **contexts / hooks**, **services**, **RPCs**, **database objects**, **edge functions**, **external services**, **configuration**, **security dependencies**, and **output**.

### 2.1 Tenant Management

| Field | Value |
|-------|-------|
| **Purpose** | CRUD for tenants (`cửa hàng`), subdomain / custom-domain lifecycle, tenant status, impersonation, backup/restore, and demo reset. |
| **Entry Pages** | `pages/admin/Tenants.tsx`, `pages/admin/TenantDetail.tsx`, `pages/admin/Onboarding.tsx` |
| **Primary Components** | `SubdomainManagerPanel`, `CustomDomainPanel`, `LicenseManagerPanel`, `SecuritySettingsPanel`, `AccountSelector`, `AdminKpiCards` |
| **Contexts / Hooks** | `useAuth` (identity), `useAdminList`, `useConfirmDialog`, `useToast` |
| **Services** | `services/admin/tenantAdminService.ts` (wrappers), `services/tenantService.ts` (base), `services/admin/systemAdminService.ts` (impersonation, backup/restore, migration) |
| **RPCs** | `get_tenants_admin`, `search_tenants`, `get_tenant_by_subdomain`, `get_tenant_by_domain`, `create_tenant_with_admin`, `set_tenant_subdomain`, `get_or_create_custom_domain_token`, `get_tenant_usage_summary`, `update_tenant`, `delete_tenant_safe`, `get_current_user_tenants`, `get_top_tenants`, `get_tenant_growth`, `get_system_overview` |
| **Database Tables** | `tenants`, `tenant_memberships`, `invitations`, `tenant_subscriptions`, `licenses`, `tenant_credentials`, `rate_limit_logs`, `system_admins` |
| **Triggers** | `trg_audit_log_tenants`, `set_tenant_record_user_tracking`, `tenant_memberships_guardrails`, `tenants_before_delete_guardrail`, `trg_check_tenant_user_limit` |
| **Edge Functions** | `create-tenant`, `check-subdomain`, `verify-domain`, `delete-tenant`, `tenant-backup`, `tenant-restore`, `impersonate-tenant`, `end-impersonation` |
| **External Services** | Google DNS (`dns.google`) for TXT verification; Supabase Management API for backup/restore |
| **Configuration** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `APP_BASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_MANAGEMENT_TOKEN`, `SUPABASE_PROJECT_REF` |
| **Security Dependencies** | `is_system_admin` / `is_tenant_owner` / `is_tenant_admin` RPCs; Edge Function `checkIsSystemAdmin` / `checkIsTenantAdmin`; RLS on `tenants` |
| **Output** | Tenant list/detail, subdomain status, custom-domain verification token, backup JSON, restore result, impersonation session |

**Propagation:** A change in `tenants` schema or the `search_tenants` / `get_tenants_admin` RPCs reaches every page that lists tenants and every capability that needs a tenant selector.

### 2.2 Billing

| Field | Value |
|-------|-------|
| **Purpose** | Manage subscriptions, plans, invoices, payments, and bank-account / company-info configuration. |
| **Entry Pages** | `pages/admin/Billing.tsx`, `pages/admin/BillingInvoices.tsx`, `pages/admin/BillingPayments.tsx` |
| **Primary Components** | `SubscriptionManager`, `InvoiceManager`, `PaymentManager` |
| **Contexts / Hooks** | `useAuth`, `useAdminList`, `useConfirmDialog`, `useToast` |
| **Services** | `services/admin/billingAdminService.ts`, `services/planService.ts`, `services/invoiceService.ts`, `services/bankAccountService.ts`, `services/admin/billingProviderRegistry.ts` + `providers/*` |
| **RPCs** | `update_tenant_subscription`, `create_subscription`, `upgrade_subscription`, `downgrade_subscription`, `cancel_subscription`, `create_invoice`, `confirm_payment`, `get_plans`, `get_plan_by_key`, `create_plan`, `update_plan`, `delete_plan`, `compute_billing_period_end` |
| **Database Tables** | `tenant_subscriptions`, `invoices`, `payments`, `plans`, `plan_features`, `bank_accounts`, `system_settings`, `billing_job_logs`, `billing_reminder_logs` |
| **Triggers** | `trg_check_tenant_order_limit`, `trg_audit_log_tenant_subscriptions` |
| **Edge Functions** | `process-checkout`, `send-billing-email`, `billing-webhooks` |
| **External Services** | Stripe (webhooks + subscriptions), VNPay (`sandbox.vnpayment.vn`), Momo, bank-transfer (manual) |
| **Configuration** | `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM` |
| **Security Dependencies** | Backend plan-limit checks; `is_system_admin` for global plan CRUD; provider-specific signature verification in Edge Functions |
| **Output** | Subscription records, invoices, payment confirmations, provider payment URLs |

**Propagation:** Billing is tightly coupled to `Tenant` (subscription is per-tenant) and `Plans` (limits); a plan schema change propagates to `tenant_subscriptions`, `billingProviderRegistry`, and the `SubscriptionManager` UI.

### 2.3 Analytics

| Field | Value |
|-------|-------|
| **Purpose** | Revenue, churn, cohort, LTV, and tenant-growth dashboards. |
| **Entry Pages** | `pages/admin/Analytics.tsx`, `pages/admin/Overview.tsx` (overview tab) |
| **Primary Components** | `RevenueMetrics`, `ChurnCohortMetrics`, `AdminKpiCards` |
| **Contexts / Hooks** | `useAuth` |
| **Services** | `services/admin/analyticsAdminService.ts`, `services/admin/tenantAdminService.ts` (`getTopTenants`, `getTenantGrowth`) |
| **RPCs** | `get_revenue_metrics`, `get_churn_cohort_metrics`, `get_top_tenants`, `get_tenant_growth`, `get_system_overview` |
| **Database Tables** | `payments`, `invoices`, `tenant_subscriptions`, `tenants` |
| **Triggers** | None directly exposed to admin UI |
| **Edge Functions** | None |
| **External Services** | None (pure database aggregation) |
| **Configuration** | Date-range filters only |
| **Security Dependencies** | `is_system_admin` on revenue RPCs; aggregated data only |
| **Output** | MRR/ARR, revenue by plan, churn/cohort/ltv/funnel metrics, top-tenant lists |

**Propagation:** Analytics depends on clean `payments` and `invoices` data; a change in either table or the revenue RPCs immediately affects all dashboard charts.

### 2.4 Audit

| Field | Value |
|-------|-------|
| **Purpose** | Query and export admin audit logs, login history, login alerts, and rate-limit logs. |
| **Entry Pages** | `pages/admin/Audit.tsx` |
| **Primary Components** | `AuditExportPanel` |
| **Contexts / Hooks** | `useAuth`, `useAdminList`, `useToast` |
| **Services** | `services/admin/auditAdminService.ts`, `services/auditService.ts`, `services/loginHistoryService.ts`, `services/systemAdminService.ts` |
| **RPCs** | `get_admin_audit_logs` (direct `from('audit_log')`), `get_admin_login_history`, `get_admin_login_alerts`, `record_admin_login`, `get_rate_limit_logs` |
| **Database Tables** | `audit_log`, `admin_login_history`, `rate_limit_logs`, `app_audit_log` |
| **Triggers** | `trg_audit_log_tenants`, `trg_audit_log_tenant_memberships`, `trg_audit_log_orders`, `trg_audit_log_products`, `tenant_memberships_audit` |
| **Edge Functions** | `audit-log` (write path for operational events) |
| **External Services** | None |
| **Configuration** | `MAX_EXPORT_ROWS = 10000` cap |
| **Security Dependencies** | `is_system_admin`; `audit_log` is system-admin only; `app_audit_log` records operational events |
| **Output** | Paginated audit entries, CSV/JSON export, failed-login alerts |

**Propagation:** Audit is a cross-cutting sink. Any capability whose table has an audit trigger (e.g., Tenant, Billing, Members) implicitly feeds Audit; changing `audit_log` schema breaks `exportAuditLogs`.

### 2.5 Compliance (GDPR)

| Field | Value |
|-------|-------|
| **Purpose** | Submit and track GDPR export/deletion requests; preview/export/delete user data. |
| **Entry Pages** | `pages/admin/Compliance.tsx` (AdminDashboardInner tab) |
| **Primary Components** | `ComplianceManager` |
| **Contexts / Hooks** | `useAuth` |
| **Services** | `services/admin/complianceAdminService.ts` |
| **RPCs** | `get_gdpr_requests`, `create_gdpr_request`, `gdpr_export_user_data`, `gdpr_delete_user_data` |
| **Database Tables** | `gdpr_requests`, `gdpr_deletion_logs`, `tenants`, `tenant_memberships`, `payments`, `audit_log`, `admin_login_history`, `terms_acceptance` |
| **Triggers** | None identified for admin UI |
| **Edge Functions** | `delete-user` |
| **External Services** | None |
| **Configuration** | Dry-run default for deletions |
| **Security Dependencies** | `is_system_admin`; destructive RPCs use `SECURITY DEFINER` |
| **Output** | GDPR request list, JSON export, deletion report |

**Propagation:** Compliance reaches into almost every user-data table; a change to any of those tables or the `gdpr_export_user_data` RPC shape changes the export payload.

### 2.6 Members

| Field | Value |
|-------|-------|
| **Purpose** | Search, invite, reset, activate/deactivate, and change roles for tenant members. |
| **Entry Pages** | `pages/admin/Members.tsx`, `pages/admin/InvitationsAccept.tsx` |
| **Primary Components** | `MemberManagement` |
| **Contexts / Hooks** | `useAuth`, `useAdminList` |
| **Services** | `services/admin/memberAdminService.ts`, `services/tenantService.ts` |
| **RPCs** | `search_tenant_members`, `get_tenant_members_with_email`, `toggle_tenant_member_active`, `update_tenant_member_role`, `remove_tenant_member`, `lookup_invitation`, `accept_invitation`, `get_users`, `get_tenant_usage_summary` |
| **Database Tables** | `tenant_memberships`, `invitations`, `tenants`, `users` (Supabase Auth), `rate_limit_logs` |
| **Triggers** | `tenant_memberships_guardrails`, `trg_audit_log_tenant_memberships`, `trg_check_tenant_user_limit` |
| **Edge Functions** | `send-invitation-email`, `invite-member` |
| **External Services** | Resend (email), Twilio (SMS) |
| **Configuration** | `RESEND_API_KEY`, `RESEND_FROM`, `APP_BASE_URL`, `SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `SMS_FROM` |
| **Security Dependencies** | `is_tenant_admin` / `is_tenant_owner` / `is_system_admin`; invitation tokens |
| **Output** | Member list, invitations, reset links, membership records |

**Propagation:** Members depends on `Tenant` selection (the `Members` page lists tenants first); role validation in `lib/permissions.ts` and the backend `VALID_ROLES` set in `memberAdminService.ts` must stay aligned.

### 2.7 Security

| Field | Value |
|-------|-------|
| **Purpose** | System-admin management, IP allowlists, session timeout, login-attempt monitoring, MFA/2FA backup codes. |
| **Entry Pages** | `pages/admin/Security.tsx`, `pages/admin/AdminDashboardInner.tsx` (systemAdmins / twoFactor tabs) |
| **Primary Components** | `SecuritySettingsPanel`, `TwoFactorManager` |
| **Contexts / Hooks** | `useAuth` |
| **Services** | `services/admin/systemAdminService.ts`, `services/twoFactorService.ts`, `lib/permissions.ts` |
| **RPCs** | `get_system_admins`, `add_system_admin`, `remove_system_admin`, `create_system_admin` (Edge), `get_tenant_security_settings`, `update_tenant_ip_allowlist`, `update_tenant_session_timeout`, `record_login_attempt`, `get_login_attempts`, `get_locked_emails`, `unlock_login_attempts`, `is_2fa_enabled`, `generate_2fa_backup_codes`, `list_2fa_backup_codes`, `verify_2fa_backup_code`, `delete_2fa_backup_codes` |
| **Database Tables** | `system_admins`, `login_attempts`, `tenant_memberships`, `admin_2fa_backup_codes`, `admin_2fa_backup_code_attempts` |
| **Triggers** | `tenant_memberships_guardrails` |
| **Edge Functions** | `create-system-admin`, `admin-2fa-override` |
| **External Services** | Supabase Auth MFA |
| **Configuration** | Session timeout minutes, IP allowlist arrays |
| **Security Dependencies** | `is_system_admin`; `is_tenant_owner` for tenant-scoped settings; Supabase `aal2` for MFA |
| **Output** | System-admin list, security settings, locked-email alerts, MFA status |

**Propagation:** Security settings live in `tenant_memberships` (IP, timeout) and `system_admins`; changes to either table or the `is_system_admin` RPC affect every admin gate.

### 2.8 Notifications

| Field | Value |
|-------|-------|
| **Purpose** | View notification logs and compose in-app messages to tenants. |
| **Entry Pages** | `pages/admin/AdminDashboardInner.tsx` (notifications tab) |
| **Primary Components** | `NotificationManager` |
| **Contexts / Hooks** | `useAuth`, `useDebounce` |
| **Services** | `services/notificationService.ts` |
| **RPCs** | `send_in_app_message`, `get_in_app_messages_for_tenant`, `mark_in_app_message_read` |
| **Database Tables** | `notification_logs` |
| **Triggers** | `update_notification_logs_updated_at` |
| **Edge Functions** | `send-email`, `send-sms` (email/SMS channels use separate services) |
| **External Services** | Resend (email), Twilio (SMS) |
| **Configuration** | `RESEND_API_KEY`, `RESEND_FROM`, `SMS_PROVIDER`, `TWILIO_*`, `SMS_FROM` |
| **Security Dependencies** | `is_system_admin` for admin composer |
| **Output** | Notification log list, sent in-app message |

**Propagation:** `notification_logs` is shared by email/SMS/in-app; changes to the table schema or `send_in_app_message` affect the notification manager and tenant inboxes.

### 2.9 Monitoring (Error / Performance)

| Field | Value |
|-------|-------|
| **Purpose** | Surface error counts and slow-query performance metrics. |
| **Entry Pages** | `pages/admin/AdminDashboardInner.tsx` (errors tab) |
| **Primary Components** | `ErrorPerformancePanel` |
| **Contexts / Hooks** | `useAuth` |
| **Services** | `services/errorPerformanceService.ts` |
| **RPCs** | `error-performance` Edge Function does not expose a named PG RPC; it aggregates `error_logs` internally. |
| **Database Tables** | `error_logs` |
| **Triggers** | None identified for admin UI |
| **Edge Functions** | `error-performance` |
| **External Services** | None |
| **Configuration** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Security Dependencies** | `is_system_admin` in Edge Function |
| **Output** | Error totals, recent errors, query latency percentiles |

**Propagation:** Monitoring is read-only but depends on `error_logs` schema and the `error-performance` Edge Function contract.

### 2.10 Health

| Field | Value |
|-------|-------|
| **Purpose** | System health checks and cron-job execution logs. |
| **Entry Pages** | `pages/admin/Health.tsx`, `pages/admin/AdminDashboardInner.tsx` (health tab) |
| **Primary Components** | `SystemHealthPanel` |
| **Contexts / Hooks** | `useAuth` |
| **Services** | `services/systemHealthService.ts`, `services/cronJobService.ts`, `services/heavyOpsQueueService.ts` |
| **RPCs** | `get_cron_job_logs` (via `cron_job_logs` direct query), `get_heavy_op_jobs`, `claim_heavy_op_job`, `complete_heavy_op_job`, `retry_heavy_op_job`, `get_connection_pool_stats`, `get_read_replica_status` |
| **Database Tables** | `cron_job_logs`, `heavy_ops_jobs` |
| **Triggers** | None identified for admin UI |
| **Edge Functions** | `system-health` |
| **External Services** | None |
| **Configuration** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Security Dependencies** | `is_system_admin` |
| **Output** | Overall health status, per-check results, cron run history, heavy-ops queue state |

**Propagation:** Health is an aggregation read; changing `cron_job_logs` or the `system-health` Edge Function response shape breaks `SystemHealthPanel`.

### 2.11 Configuration (Settings / Operations)

| Field | Value |
|-------|-------|
| **Purpose** | Global plan defaults, data-retention settings, maintenance mode, company info, and bank accounts. |
| **Entry Pages** | `pages/admin/Settings.tsx`, `pages/admin/Billing.tsx` (company/bank accounts) |
| **Primary Components** | `AdminSettingsNav`, billing forms |
| **Contexts / Hooks** | `useAuth`, `useToast` |
| **Services** | `services/operationsService.ts`, `services/bankAccountService.ts`, `services/admin/systemAdminService.ts` |
| **RPCs** | `get_default_plan_limits`, `set_default_plan_limits`, `get_data_retention_status`, `get_maintenance_mode`, `set_maintenance_mode`, `get_global_config`, `set_global_config` |
| **Database Tables** | `system_settings`, `plans`, `plan_features`, `bank_accounts`, `maintenance_windows`, `db_maintenance_jobs` |
| **Triggers** | `system_settings_updated_by_trigger`, `maintenance_windows_updated_at`, `plan_features_updated_at` |
| **Edge Functions** | `cron-admin-tasks`, `db-maintenance` |
| **External Services** | None |
| **Configuration** | `CRON_ADMIN_TASKS_SECRET` |
| **Security Dependencies** | `is_system_admin`; plan-limit RPCs enforce numeric caps |
| **Output** | Plan defaults, retention counts, maintenance banner state, company/bank records |

**Propagation:** Configuration is globally shared; `get_maintenance_mode`/`set_maintenance_mode` affect the entire platform, and plan defaults feed new tenant subscriptions.

### 2.12 Storage

| Field | Value |
|-------|-------|
| **Purpose** | Show tenant storage usage and backup/restore status. |
| **Entry Pages** | `pages/admin/AdminDashboardInner.tsx` (storage tab), `pages/admin/Tenants.tsx` |
| **Primary Components** | `StorageBackupPanel` |
| **Contexts / Hooks** | `useAuth` |
| **Services** | `services/tenantBackupService.ts`, `services/tenantRestoreService.ts`, `services/tenantService.ts` (`getTenantStorageUsage`) |
| **RPCs** | `get_tenant_storage_usage`, `tenant-backup` (Edge), `tenant-restore` (Edge) |
| **Database Tables** | `tenant_subscriptions`, `tenant_restore_snapshots`, `heavy_ops_jobs` |
| **Triggers** | None identified for admin UI |
| **Edge Functions** | `tenant-backup`, `tenant-restore`, `system-backup` |
| **External Services** | Supabase Storage (objects), Supabase Management API |
| **Configuration** | `SUPABASE_MANAGEMENT_TOKEN`, `SUPABASE_PROJECT_REF` |
| **Security Dependencies** | `is_system_admin`; backup files are downloaded client-side |
| **Output** | Storage-usage card, backup JSON, restore result |

**Propagation:** Storage pulls from `tenant_subscriptions` and Supabase Storage; restore calls `tenant-restore` which depends on the tenant backup JSON contract.

---

## 3. Module Dependency Matrix

The following table captures each important module’s place in the admin dependency graph.

| Module | Owned By | Depends On | Used By | Provides | Consumes | Shared With | Type | Runtime Critical | Optional | Replaceability |
|--------|----------|------------|---------|----------|----------|-------------|------|------------------|----------|----------------|
| `App.tsx` | App bootstrap | `AuthContext`, `TenantContext`, `lib/supabase`, `lib/tenant`, `lib/permissions`, React Router | Browser / entry point | Admin route tree, lazy chunks, `isSystemAdmin` gate | `useAuth`, `useTenant`, `isSystemAdmin` | Public + tenant routes | Orchestrator | Critical | No | Low — replaces top-level routing |
| `AdminLayout.tsx` | Admin shell | `AdminShell`, `AdminSidebar`, React Router | `App.tsx` | Sidebar model, route mapping, page titles | `Outlet`, `useLocation`, `useNavigate` | No | Presentation | Critical | No | Low — layout is admin-specific |
| `AdminShell.tsx` | Admin shell | `AdminSidebar`, `AdminDashboardHeader`, `AdminSettingsNav` | `AdminLayout.tsx` | Visual frame, skip-link, hamburger, breadcrumbs | `sidebarSections`, `activeSidebarItem`, `pageTitle` | No | Presentation | Medium | No | Low |
| `AuthContext.tsx` | App state | `lib/supabase`, `services/auditService`, `services/loginHistoryService`, `services/twoFactorService` | `App.tsx`, every `useAuth` consumer | `session`, `user`, `mfaPending`, `signOut` | `supabase.auth.*`, `writeAuditLog`, `recordAdminLogin` | Public app | Context | Critical | No | Low — identity is shared |
| `TenantContext.tsx` | App state | `lib/supabase`, `lib/tenant`, `AuthContext` | `App.tsx`, tenant-scoped pages | `tenant`, `membership`, `role`, `isImpersonating` | `get_tenant_by_subdomain` RPC, `tenant_memberships` | Public app | Context | Critical | No | Low |
| `lib/supabase.ts` | Infrastructure | `@supabase/supabase-js`, env keys | Every service/context | Typed `supabase`, `tenantFetch`, `setCurrentTenantId` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Entire app | Infrastructure | Critical | No | Very Low — single client |
| `lib/permissions.ts` | Auth helpers | `lib/supabase`, `types/tenant` | `App.tsx`, pages, components | `isSystemAdmin`, `hasTenantRole`, role constants | `is_system_admin`, `has_tenant_role`, `is_tenant_owner` RPCs | Public app | Utility | Critical | No | Low |
| `lib/tenant.ts` | Tenant URL helpers | `lib/supabase` | `TenantContext`, `App.tsx`, `AccountSelector` | `getSubdomain`, `getTenantUrl`, `getAdminUrl`, `getTenantId` | `get_tenant_by_subdomain`, `get_tenant_by_domain` RPCs | Public app | Utility | Critical | No | Low |
| `services/admin/tenantAdminService.ts` | Admin tenant wrapper | `services/tenantService.ts`, `lib/supabase`, `utils/subdomain`, Edge Functions | `Tenants.tsx`, `TenantDetail.tsx`, `Onboarding.tsx`, `Members.tsx` | `listAccounts`, `getAccount`, `createAccount`, `checkSubdomainAvailability`, etc. | `searchTenants`, `getAllTenants`, `createTenantWithAdmin`, `supabase` RPCs | No | Wrapper | Critical | No | Medium — can fold back into base service |
| `services/tenantService.ts` | Base tenant ops | `lib/supabase`, `types/tenant` | `tenantAdminService`, `AdminDashboardInner`, `ApiKeyManager`, `WebhookManager`, `NotificationManager` | Search, CRUD, subscription, impersonation, storage usage | Many admin RPCs, `tenants`, `tenant_memberships`, `tenant_subscriptions` | Tenant app | Service | Critical | No | Low |
| `services/admin/systemAdminService.ts` | Admin system wrapper | `services/systemAdminService.ts`, `services/operationsService.ts`, `services/tenant*Service`, `tenantAdminService` | `AdminDashboardInner`, `Security.tsx` | System admin, rate limits, security settings, impersonation, maintenance, backup/restore/migration | `supabase.rpc` for rate limits, login attempts, security settings | No | Wrapper | Critical | No | Medium |
| `services/admin/billingAdminService.ts` | Admin billing wrapper | `services/tenantService.ts`, `services/bankAccountService.ts`, `lib/supabase` | `Billing.tsx`, `Tenants.tsx`, `TenantDetail.tsx` | Subscription lifecycle, bank/company info | `update_tenant_subscription`, `tenant_subscriptions`, `bank_accounts`, `system_settings` | Tenant app | Wrapper | High | No | Medium |
| `services/admin/auditAdminService.ts` | Admin audit wrapper | `services/loginHistoryService.ts`, `services/systemAdminService.ts`, `lib/supabase` | `Audit.tsx`, `AdminDashboardInner` | Audit export, login alerts, rate-limit logs | `audit_log`, `admin_login_history`, `rate_limit_logs` | No | Wrapper | High | No | Low — admin-specific |
| `services/admin/memberAdminService.ts` | Admin member wrapper | `services/tenantService.ts`, `lib/supabase` | `MemberManagement`, `InvitationsAccept.tsx` | Invitations, reset password, bulk invite | `invitations`, `tenant_memberships`, `lookup_invitation`, `accept_invitation` | Tenant app | Wrapper | High | No | Medium |
| `services/admin/analyticsAdminService.ts` | Admin analytics wrapper | `lib/supabase` | `Analytics.tsx`, `AdminDashboardInner` | Revenue, churn, cohort metrics | `get_revenue_metrics`, `get_churn_cohort_metrics` | No | Wrapper | Medium | No | Medium |
| `services/admin/complianceAdminService.ts` | Admin compliance wrapper | `lib/supabase` | `ComplianceManager` | GDPR request/Export/Delete | `gdpr_requests`, `gdpr_*` RPCs | No | Wrapper | Medium | No | Medium |
| `services/admin/supportService.ts` | Admin support wrapper | `lib/supabase` | `TicketInbox` | Tickets, replies, reply templates, ticket email | `support_tickets`, `ticket_replies`, `ticket_reply_templates`, `send-ticket-email` | No | Wrapper | Medium | No | Medium |

---

## 4. Shared Module Map

Shared modules are consumed by **two or more** admin capabilities.

| Shared Module | Consumers | Responsibilities | Criticality | Potential Impact | Architectural Importance |
|---------------|-----------|------------------|-------------|------------------|--------------------------|
| `lib/supabase.ts` | All services, contexts | Single typed Supabase client; `x-tenant-id` injection | Critical | Failure disables all backend access | The only HTTP gateway to Supabase |
| `useAdminList` hook | `Tenants`, `Members`, `Billing`, `Audit` | Generic pagination, search, debounce, loading/error state | High | Change affects every list UI | Reusable list state machine |
| `services/tenantService.ts` | Tenant, Members, Billing, Analytics, Webhooks, Notifications, ApiKeyManager | Tenant/member/subscription/impersonation/storage primitives | Critical | Breaks most tenant-scoped admin pages | Core domain service |
| `services/admin/tenantAdminService.ts` | Tenant, Members, Onboarding, TenantDetail | Admin-specific tenant wrappers + re-exports | High | Breaks tenant CRUD and selection | Admin tenant seam |
| `lib/permissions.ts` | Security, all gated pages | Client-side role / system-admin helpers | Critical | Mismatch with backend `is_system_admin` creates UX/security drift | UX gating only, not the real boundary |
| `getAllTenants` (from `tenantService`) | `ApiKeyManager`, `WebhookManager`, `NotificationManager` | Loads tenant list for tenant selectors | Medium | Breaks selectors in three capabilities | Shared tenant list |
| `systemAdminService` (base + admin wrapper) | Overview, Security, Storage | System-level operations, security, maintenance, backup/restore | High | Affects system admin and global settings | Cross-cutting system operations |

---

## 5. Runtime Dependency Graph

The graph below describes **actual execution reachability** when an admin user opens a page, not static imports.

```text
Browser at admin.vietsalepro.com / /admin/*
    │
    ▼
AuthProvider  ──(AuthContext)──►  App.tsx
    │                              │
    ├─── isSystemAdmin() ──────────┤
    │                              ▼
    │                    AdminLayout.tsx
    │                              │
    ▼                              ▼
TenantProvider  ──(TenantContext) AdminShell.tsx ──► AdminSidebar.tsx
    │                              │
    └─── currentTenantId cleared   ▼
                                   Outlet
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            AdminDashboardInner   Tenants         Members
            (tabbed panels)       Billing         Security
                    │               │               │
                    ▼               ▼               ▼
              React.lazy panels  useAdminList    useAuth
                    │               │               │
                    ▼               ▼               ▼
            services/admin/*.ts  services/admin/*.ts  lib/permissions.ts
                    │               │               │
                    └───┬───────────┘               │
                        ▼                         │
                services/*.ts (base)              │
                        │                         │
                        ▼                         │
                lib/supabase.ts  ◄────────────────┘
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
    PostgREST RPCs  Edge Functions  Realtime / Storage
            │           │
            ▼           ▼
    Postgres tables  Deno Edge Runtime
            │           │
            └─────┬─────┘
                  ▼
            Triggers / RLS / SECURITY DEFINER
```

**Why this matters:** At runtime the admin UI is not a set of independent pages; it is one route tree that shares `AuthContext` and `TenantContext`. Every backend call funnels through `lib/supabase.ts`, which means a change in `tenantFetch` or the environment keys affects every capability simultaneously.

---

## 6. Cross Capability Dependencies

| Capability | Depends On | Why |
|------------|------------|-----|
| **Billing** | Tenant Management | Subscription is per-tenant; tenant selection drives subscription editing. |
| **Analytics** | Billing + Tenant | Revenue metrics aggregate `payments`/`invoices`; growth metrics read `tenants`. |
| **Audit** | Auth + Tenant + Members + Billing | Audit triggers write rows when tenant, member, and subscription tables change. |
| **Compliance** | Members + Audit | GDPR export pulls user profile, memberships, payments, audit logs, and login history. |
| **Security** | Auth + Tenant | System-admin checks and tenant IP/session settings both depend on `AuthContext` and `TenantContext`. |
| **Notifications** | Tenant | Composer must select a target tenant before sending in-app messages. |
| **Storage** | Tenant + Configuration | Storage usage is per-tenant and backup/restore uses global maintenance tokens. |
| **Members** | Tenant | A tenant must be selected before members can be viewed or invited. |
| **Health** | Configuration / Cron | Cron job logs and heavy-ops queue are global system concerns. |

---

## 7. Data Dependency Map

### 7.1 Shared Tables

| Table | Shared By Capabilities | Admin Consumers |
|-------|------------------------|-----------------|
| `tenants` | All tenant-scoped pages | `tenantAdminService`, `tenantService`, `analyticsAdminService`, `systemAdminService` |
| `tenant_memberships` | Tenant, Members, Security, Compliance | `tenantService`, `memberAdminService`, `permissions.ts` |
| `tenant_subscriptions` | Billing, Tenant, Storage, Analytics | `billingAdminService`, `tenantService`, `StorageBackupPanel` |
| `invoices` / `payments` | Billing, Analytics | `invoiceService`, `analyticsAdminService` |
| `audit_log` | Audit, Compliance | `auditAdminService` |
| `admin_login_history` | Audit, Compliance | `loginHistoryService`, `auditAdminService` |
| `rate_limit_logs` | Audit, Tenant (Edge), Security | `systemAdminService`, Edge Functions |
| `support_tickets` / `ticket_replies` / `ticket_reply_templates` | Support | `supportService` |
| `notification_logs` | Notifications | `notificationService` |
| `system_settings` | Configuration, Billing | `operationsService`, `bankAccountService` |
| `cron_job_logs` | Health | `cronJobService` |
| `heavy_ops_jobs` | Health, Storage | `heavyOpsQueueService` |

### 7.2 RPCs and Their Tables

| RPC | Used By | Primary Tables |
|-----|---------|----------------|
| `get_tenants_admin` / `search_tenants` | `tenantAdminService` | `tenants` |
| `create_tenant_with_admin` | `tenantService` | `tenants`, `tenant_memberships`, `users` |
| `set_tenant_subdomain` | `tenantAdminService` | `tenants` |
| `get_or_create_custom_domain_token` | `verify-domain` Edge Function | `tenants` |
| `get_tenant_members_with_email` / `search_tenant_members` | `memberAdminService` | `tenant_memberships`, `users` |
| `update_tenant_subscription` / `create_subscription` | `billingAdminService`, `tenantService` | `tenant_subscriptions` |
| `get_revenue_metrics` / `get_churn_cohort_metrics` | `analyticsAdminService` | `payments`, `invoices`, `tenants` |
| `get_admin_login_history` / `get_rate_limit_logs` | `auditAdminService` | `admin_login_history`, `rate_limit_logs` |
| `gdpr_export_user_data` / `gdpr_delete_user_data` | `complianceAdminService` | `tenants`, `tenant_memberships`, `payments`, `audit_log`, `admin_login_history` |
| `get_system_overview` / `get_top_tenants` / `get_tenant_growth` | `systemAdminService`, `analyticsAdminService` | `tenants`, `payments`, `invoices` |

### 7.3 Edge Functions and Their Tables / RPCs

| Edge Function | Used By | Reads / Writes |
|---------------|---------|----------------|
| `create-tenant` | `tenantService` | Inserts `tenants`, `tenant_memberships`; creates Auth user |
| `check-subdomain` | `tenantAdminService` | Reads `tenants`; writes `rate_limit_logs` |
| `verify-domain` | `tenantAdminService` | Reads `tenants`; calls `get_or_create_custom_domain_token` |
| `send-invitation-email` | `memberAdminService` | Reads `tenants`; writes `rate_limit_logs` |
| `send-sms` | SMS flows | Uses `SMS_PROVIDER` / Twilio env; writes `notification_logs` |
| `send-email` / `send-template-email` / `send-ticket-email` | Email flows | Uses Resend; writes `notification_logs` / `billing_email_logs` |
| `billing-webhooks` | Stripe webhooks | Updates `invoices`, `payments` |
| `tenant-backup` / `tenant-restore` | `tenantBackupService`, `tenantRestoreService` | Dumps/restores per-tenant data |
| `system-health` | `systemHealthService` | Aggregates DB health |
| `error-performance` | `errorPerformanceService` | Reads `error_logs` |
| `system-backup` | Storage panel | Uses Management API |

---

## 8. Infrastructure Dependency Map

| Infrastructure | Role | Admin Reachable Capabilities | Notes |
|----------------|------|------------------------------|-------|
| **Supabase Auth** | Identity / MFA | All | `AuthContext` subscribes to `onAuthStateChange`; MFA via `supabase.auth.mfa.*` |
| **PostgREST** | Query/RPC execution | All | Used by `supabase.rpc(...)` and `supabase.from(...)` |
| **Realtime** | Broadcast `admin_events` | Overview, Notifications | Listens on `admin_events` for cross-tab updates |
| **Supabase Storage** | Backup downloads, file storage | Storage, Backup/Restore | `tenant-backup` returns data; client downloads JSON |
| **Edge Functions** | Privileged / external operations | Tenant, Billing, Members, Security, Storage, Health, Monitoring | 30 functions deployed; all use `SUPABASE_SERVICE_ROLE_KEY` |
| **Postgres** | Source of truth | All | Tables, RPCs, triggers, RLS |
| **Environment Variables** | Client & function configuration | All | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `APP_BASE_URL`, `SMS_PROVIDER`, `TWILIO_*`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_MANAGEMENT_TOKEN`, `SUPABASE_PROJECT_REF`, `CRON_ADMIN_TASKS_SECRET`, `WEBHOOK_DELIVERY_SECRET` |
| **External APIs** | Email, SMS, DNS, payments | Members, Billing, Notifications, Tenant | Resend, Twilio, Google DNS, Stripe, VNPay, Momo |
| **DNS** | Custom-domain verification | Tenant | TXT lookup via `dns.google` |
| **Email** | Invitations, billing, tickets | Members, Billing, Support, Notifications | Resend |
| **SMS** | OTP / notifications | Notifications, Security | Twilio |
| **Supabase Management API** | Backups / PITR status | Storage, Health | `system-backup` / `tenant-backup` |

---

## 9. Critical Dependency Analysis

| Module | Why It Is Architecturally Critical |
|--------|-------------------------------------|
| `AuthContext` | Holds `session`/`user` and `mfaPending`. Without it `App.tsx` cannot render the admin route tree and no `isSystemAdmin` check can run. |
| `TenantContext` | Resolves `tenant`/`membership`/`isImpersonating` and sets `currentTenantId` on `tenantFetch`. Admin host clears tenant but the context still gates tenant-scoped calls. |
| `lib/supabase.ts` | The only typed Supabase client. Every service and context depends on it; environment key changes or `tenantFetch` changes touch every capability. |
| `lib/permissions.ts` | Synchronous and async role / system-admin checks used by `App.tsx`, pages, and components. Misalignment with backend `is_system_admin` causes UX and security drift. |
| `AdminShell.tsx` | Renders the admin frame (skip-link, sidebar, header, breadcrumbs, main). Every admin page is wrapped by it. |
| `AdminLayout.tsx` | Maps the current route to the sidebar model and renders `AdminShell`. Route changes flow through it. |
| `App.tsx` | Decides admin vs. tenant vs. public route trees and lazy-loads admin chunks. The `isSystemAdmin` gate lives here. |
| `tenantService.ts` | Base service for tenant, member, subscription, impersonation, analytics, and storage usage. It is the root of almost every admin data call. |
| `tenantAdminService.ts` | Thin admin wrapper that re-exports `tenantService` and adds admin-specific calls (subdomain, custom domain, invitations). Most admin pages import this. |
| `systemAdminService.ts` (admin + base) | Aggregates system admin, security, rate limits, login history, maintenance, and backup/restore. The overview and security tabs depend on it. |

---

## 10. Impact Propagation

| Critical Module | If This Changes | Affected Capabilities | Impact Level |
|-----------------|-----------------|-----------------------|--------------|
| `AuthContext` | Session shape, `mfaPending` handling, sign-out | All admin pages, Audit (LOGIN/LOGOUT events) | **Critical** |
| `TenantContext` | Tenant resolution, `currentTenantId`, impersonation flags | Tenant, Members, Billing, Security, Storage | **Critical** |
| `lib/supabase.ts` | Client creation, `tenantFetch`, env keys | Every service/context | **Critical** |
| `lib/permissions.ts` | Role matrix, `isSystemAdmin` helper | App.tsx gating, page-level UX guards | **Critical** |
| `App.tsx` | Admin route tree, lazy chunk list | All admin pages | **Critical** |
| `AdminShell.tsx` | Layout, navigation, accessibility landmarks | Every admin page | **High** |
| `AdminLayout.tsx` | Sidebar sections / route map | Every admin page | **High** |
| `tenantService.ts` | RPC names, `mapTenantFromDB`, subscription helpers | Tenant, Billing, Members, Analytics, Storage | **Critical** |
| `tenantAdminService.ts` | Wrapper exports, subdomain/domain helpers | Tenants, Onboarding, TenantDetail, Members | **High** |
| `systemAdminService.ts` | Security / admin / backup helpers | Overview, Security, Storage, Health | **High** |
| `auditAdminService.ts` | Export format, filters, login alert mapping | Audit | **Medium** |

---

## 11. Reachability Map

For each capability: **Entry** → **Reachable Components** → **Reachable Services** → **Reachable RPC** → **Reachable Database** → **Reachable Edge Functions**.

| Capability | Entry | Components | Services | RPCs | Database | Edge Functions |
|------------|-------|------------|----------|------|----------|----------------|
| **Tenant** | `pages/admin/Tenants.tsx`, `TenantDetail.tsx` | `SubdomainManagerPanel`, `CustomDomainPanel`, `LicenseManagerPanel`, `SecuritySettingsPanel` | `tenantAdminService`, `tenantService`, `systemAdminService` | `get_tenants_admin`, `search_tenants`, `get_tenant_by_subdomain`, `create_tenant_with_admin`, `set_tenant_subdomain`, `get_or_create_custom_domain_token`, `get_tenant_usage_summary`, `delete_tenant_safe`, `get_top_tenants` | `tenants`, `tenant_memberships`, `tenant_subscriptions`, `licenses`, `invitations`, `rate_limit_logs`, `tenant_credentials` | `create-tenant`, `check-subdomain`, `verify-domain`, `delete-tenant`, `tenant-backup`, `tenant-restore`, `impersonate-tenant`, `end-impersonation` |
| **Billing** | `pages/admin/Billing.tsx`, `BillingInvoices.tsx`, `BillingPayments.tsx` | `SubscriptionManager`, `InvoiceManager`, `PaymentManager` | `billingAdminService`, `invoiceService`, `bankAccountService`, `planService`, `billingProviderRegistry` | `update_tenant_subscription`, `create_subscription`, `create_invoice`, `confirm_payment`, `get_plans`, `create_plan`, `update_plan`, `delete_plan` | `tenant_subscriptions`, `invoices`, `payments`, `plans`, `plan_features`, `bank_accounts`, `system_settings` | `process-checkout`, `send-billing-email`, `billing-webhooks` |
| **Analytics** | `pages/admin/Analytics.tsx`, `Overview.tsx` | `RevenueMetrics`, `ChurnCohortMetrics`, `AdminKpiCards` | `analyticsAdminService`, `tenantAdminService` | `get_revenue_metrics`, `get_churn_cohort_metrics`, `get_top_tenants`, `get_tenant_growth`, `get_system_overview` | `payments`, `invoices`, `tenants`, `tenant_subscriptions` | None |
| **Audit** | `pages/admin/Audit.tsx` | `AuditExportPanel` | `auditAdminService`, `loginHistoryService`, `systemAdminService` | `get_admin_login_history`, `get_admin_login_alerts`, `record_admin_login`, `get_rate_limit_logs` | `audit_log`, `admin_login_history`, `rate_limit_logs`, `app_audit_log` | `audit-log` |
| **Compliance** | `pages/admin/Compliance.tsx` | `ComplianceManager` | `complianceAdminService` | `get_gdpr_requests`, `create_gdpr_request`, `gdpr_export_user_data`, `gdpr_delete_user_data` | `gdpr_requests`, `gdpr_deletion_logs`, `tenants`, `tenant_memberships`, `payments`, `audit_log`, `admin_login_history` | `delete-user` |
| **Members** | `pages/admin/Members.tsx`, `InvitationsAccept.tsx` | `MemberManagement` | `memberAdminService`, `tenantService` | `search_tenant_members`, `get_tenant_members_with_email`, `toggle_tenant_member_active`, `update_tenant_member_role`, `remove_tenant_member`, `lookup_invitation`, `accept_invitation` | `tenant_memberships`, `invitations`, `tenants`, `users` | `send-invitation-email`, `invite-member` |
| **Security** | `pages/admin/Security.tsx` | `SecuritySettingsPanel`, `TwoFactorManager` | `systemAdminService`, `twoFactorService`, `permissions.ts` | `get_system_admins`, `add_system_admin`, `remove_system_admin`, `create_system_admin`, `get_tenant_security_settings`, `update_tenant_ip_allowlist`, `update_tenant_session_timeout`, `record_login_attempt`, `get_login_attempts`, `get_locked_emails`, `unlock_login_attempts`, `is_2fa_enabled`, `generate_2fa_backup_codes` | `system_admins`, `login_attempts`, `tenant_memberships`, `admin_2fa_backup_codes` | `create-system-admin`, `admin-2fa-override` |
| **Notifications** | `pages/admin/AdminDashboardInner.tsx` (notifications) | `NotificationManager` | `notificationService` | `send_in_app_message`, `get_in_app_messages_for_tenant`, `mark_in_app_message_read` | `notification_logs` | `send-email`, `send-sms` |
| **Monitoring** | `pages/admin/AdminDashboardInner.tsx` (errors) | `ErrorPerformancePanel` | `errorPerformanceService` | Internal to `error-performance` Edge Function | `error_logs` | `error-performance` |
| **Health** | `pages/admin/Health.tsx` | `SystemHealthPanel` | `systemHealthService`, `cronJobService`, `heavyOpsQueueService` | `get_heavy_op_jobs`, `claim_heavy_op_job`, `get_connection_pool_stats`, `get_read_replica_status` (direct `cron_job_logs` query) | `cron_job_logs`, `heavy_ops_jobs` | `system-health` |
| **Configuration** | `pages/admin/Settings.tsx`, `Billing.tsx` | `AdminSettingsNav`, billing forms | `operationsService`, `bankAccountService`, `systemAdminService` | `get_default_plan_limits`, `set_default_plan_limits`, `get_data_retention_status`, `get_maintenance_mode`, `set_maintenance_mode`, `get_global_config`, `set_global_config` | `system_settings`, `plans`, `plan_features`, `bank_accounts`, `maintenance_windows`, `db_maintenance_jobs` | `cron-admin-tasks`, `db-maintenance` |
| **Storage** | `pages/admin/AdminDashboardInner.tsx` (storage) | `StorageBackupPanel` | `tenantBackupService`, `tenantRestoreService`, `tenantService` | `get_tenant_storage_usage` | `tenant_subscriptions`, `tenant_restore_snapshots`, `heavy_ops_jobs` | `tenant-backup`, `tenant-restore`, `system-backup` |

---

## 12. Dependency Hotspots

Hotspots are modules with the highest number of architectural dependents.

| Hotspot | Why It Is a Hotspot | Reachable From |
|---------|---------------------|----------------|
| `lib/supabase.ts` | Every service and context uses this single client. | All admin pages, all services, all contexts |
| `AuthContext` | Required before any admin route can render; all pages consume `useAuth` indirectly. | `App.tsx`, all admin pages, `isSystemAdmin` checks |
| `tenantService.ts` | Base tenant, member, subscription, analytics, storage, impersonation. | `tenantAdminService`, `AdminDashboardInner`, `ApiKeyManager`, `WebhookManager`, `NotificationManager`, `StorageBackupPanel` |
| `systemAdminService.ts` (admin + base) | Aggregates security, system admin, maintenance, backup/restore, migration, overview. | `AdminDashboardInner`, `Security.tsx`, `Tenants.tsx` |
| `AdminDashboardInner.tsx` | Central tabbed dashboard that mounts panels for analytics, security, twoFactor, compliance, vouchers, tickets, notifications, health, errors, storage, bulk maintenance, API keys, webhooks, integrations, white-label. | `Overview.tsx`, `Settings.tsx`, `Health.tsx`, `Compliance.tsx` |
| `useAdminList` hook | Pagination/search primitive reused by tenant, member, billing, and audit lists. | `Tenants.tsx`, `Members.tsx`, `Billing.tsx`, `Audit.tsx` |

---

## 13. Architectural Coupling

Coupling classifications describe **how tightly** modules are bound. Low coupling is not necessarily better here; strong coupling is acceptable where the domain requires it.

| Coupled Pair | Classification | Explanation |
|--------------|----------------|-------------|
| `App.tsx` ↔ `AuthContext` | **Very Strong** | `App.tsx` cannot decide route tree without `user` and `isSystemAdmin`. |
| `TenantContext` ↔ `lib/supabase.ts` | **Very Strong** | `TenantContext` sets `currentTenantId`, which `tenantFetch` injects on every request. |
| `services/admin/*` ↔ `services/*` | **Strong** | Admin wrappers are thin delegations; renaming a base export immediately breaks admin pages. |
| `AdminDashboardInner` ↔ lazy panels | **Moderate** | Lazy panels are dynamically imported; the tab switch is a runtime seam. |
| `components/*` ↔ `services/admin/*` | **Moderate** | Components call services but do not import `supabase` directly. |
| `billingProviderRegistry` ↔ providers | **Moderate** | Registry maps names to typed provider objects; adding a provider requires registry and env changes. |
| `Edge Functions` ↔ external APIs | **Loose to Moderate** | Functions degrade gracefully (e.g., `emailProviderConfigured=false`) when Resend/Twilio keys are absent. |
| `lib/permissions.ts` ↔ backend RPCs | **Strong** | Client-side checks mirror `is_system_admin` / `has_tenant_role` RPCs; drift is a risk. |
| `Audit` ↔ all mutating capabilities | **Moderate** | Audit triggers on many tables; new mutations must consider `audit_log` writes. |

---

## 14. Dependency Summary

The VietSale Pro Admin Dashboard is a thin, layered administration surface whose real behavior is defined by the seam between `services/admin/*` wrappers and the `services/*` base services. All runtime paths converge on `lib/supabase.ts`, then split into PostgREST RPCs, direct table queries, or Deno Edge Functions. Security is not enforced in the UI; it is enforced by `SECURITY DEFINER` RPCs, RLS, and Edge Function `service_role` clients that validate the caller.

The most critical architectural dependencies are the four runtime roots — `AuthContext`, `TenantContext`, `lib/supabase.ts`, and `lib/permissions.ts` — plus `tenantService.ts` and `systemAdminService.ts`, which implement the bulk of admin-reachable business logic. Changes to any of these propagate broadly across tenant, billing, member, security, audit, analytics, storage, and compliance capabilities. The highest dependency hotspots are `lib/supabase.ts` (universal gateway), `AuthContext` (gatekeeper), and `AdminDashboardInner` / `tenantService.ts` (central aggregation points).

All capabilities are reachable only from the admin host or `/admin/*` route, are gated by `is_system_admin`, and rely on a small set of shared infrastructure modules. This makes the admin surface consistent but also means that the shared modules are the primary leverage points for change — a modification to `lib/supabase.ts` or `tenantService.ts` has platform-wide impact, while a change to an individual panel component is localized.
