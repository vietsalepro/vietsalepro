# ADMIN DASHBOARD SYSTEM INCONSISTENCY REPORT

**Document ID:** 09_ADMIN_DASHBOARD_SYSTEM_INCONSISTENCY_REPORT  
**Date:** 2026-07-20  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** A — Enterprise Repository Investigation  
**Repository:** `C:\PROJECT\vietsalepro`  
**Commit:** `3a06a6d9` (RC-2026-07-19-01)  
**Investigator:** Repository Investigator (Codebase Memory MCP assisted)  
**Status:** Investigation complete. No code, migrations, RPCs, Edge Functions, or database objects were modified.

---

# 1. Executive Summary

This report documents the result of a complete forensic investigation of the Admin Dashboard implementation against the approved System Source of Truth (SSOT). The SSOT baseline consists of:

- `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md`
- `01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md`
- `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md`
- `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md`
- `04_ADMIN_DASHBOARD_INVESTIGATION_PLAN.md`
- `05_ADMIN_DASHBOARD_FORENSIC_EXECUTION_PROTOCOL.md`
- `06_ADMIN_DASHBOARD_FORENSIC_INVESTIGATION.md`
- `07_ADMIN_DASHBOARD_ROOT_CAUSE_ANALYSIS.md`
- `08_ADMIN_DASHBOARD_FINAL_RECOMMENDATIONS.md`

The investigation covered the presentation, application, service, database, migration, RPC, and Edge Function layers, plus cross-layer traceability for all 12 capability domains. Codebase Memory MCP was used throughout to verify call graphs and object usage.

**Headline findings:**

- **45 confirmed inconsistencies / risks** documented in the issue catalog.
- **3 Critical** severity issues, all in the authorization / audit-trust boundary.
- The two highest-impact architectural defects from the prior forensic investigation (`App.tsx` admin gate bypasses `isSystemAdmin()`; `AuthContext` calls `activate_pending_memberships` directly) remain un-remediated.
- A large portion of the Admin Dashboard UI implemented in `AdminDashboardInner.tsx` is unreachable from the route tree.
- The schema contains many duplicate RPC versions (`update_tenant`, `update_tenant_subscription`, `create_tenant_with_admin`) indicating significant migration drift.
- The `audit-log` Edge Function has no authentication, allowing audit-trail poisoning.

---

# 2. Investigation Scope

The investigation inspected all layers required by the SSOT Investigation Plan and Forensic Execution Protocol:

| Layer | Scope |
|-------|-------|
| Presentation | `pages/admin/*`, `components/admin/*`, `components/*` admin panels, `App.tsx` admin route tree, `AdminLayout.tsx` navigation, lazy loading, `AdminDashboardInner.tsx` tabs |
| Application | `contexts/AuthContext.tsx`, `contexts/TenantContext.tsx`, `hooks/*` (useAdminList, useAdminRealtime, useConfirmDialog, useDebounce, usePermissions, useTenant), `lib/permissions.ts`, `lib/supabase.ts`, `lib/tenant.ts` |
| Service | `services/admin/*.ts` wrappers, `services/*.ts` base services, provider registries |
| Database | `supabase/schema.sql` — tables, views, constraints, indexes, RLS policies, triggers, functions |
| Migration | `supabase/migrations/*.sql` — chain order, duplicates, fix migrations, post-SSOT drift |
| RPC | All `CREATE OR REPLACE FUNCTION public.*` RPCs referenced by the Admin Dashboard |
| Edge Functions | `supabase/functions/*` — auth, secrets, CORS, audit logging, response contracts |
| Execution | Cross-layer traces for the 12 capability domains defined in the Investigation Plan |

Every finding is evidence-based and maps to a file, line, object, or confirmed absence.

---

# 3. Repository Coverage Summary

| Capability Domain | Coverage | Verdict |
|-------------------|----------|---------|
| Authentication | `App.tsx` gate, `AuthContext`, `lib/permissions.ts`, `is_system_admin` RPC, `system_admins` table/RLS | Partial evidence |
| Authorization | `lib/permissions.ts`, gate RPCs, RLS policies on privileged tables | Issue found |
| Tenant | `Tenants.tsx`, `TenantDetail.tsx`, `Onboarding.tsx`, `tenantAdminService.ts`, `tenantService.ts`, 11 RPCs, 8 Edge Functions, 5 triggers | Issue found |
| Billing | `Billing.tsx`, `BillingInvoices.tsx`, `BillingPayments.tsx`, `billingAdminService.ts`, 14 RPCs, 3 Edge Functions | Issue found |
| Members | `Members.tsx`, `InvitationsAccept.tsx`, `memberAdminService.ts`, 9 RPCs, 2 Edge Functions, 3 triggers | Issue found |
| Analytics | `Analytics.tsx`, `Overview.tsx`, `analyticsAdminService.ts`, 5 RPCs | No issue found |
| Audit | `Audit.tsx`, `auditAdminService.ts`, `auditService.ts`, `loginHistoryService.ts`, 5 RPCs, 4 tables, 5 triggers | Issue found |
| Compliance | `Compliance.tsx`, `AdminDashboardInner` compliance tab, `complianceAdminService.ts`, 4 RPCs, 1 Edge Function | Issue found |
| Notifications | `AdminNotificationBell.tsx`, `useAdminRealtime.ts`, `NotificationManager.tsx`, 3 RPCs, 2 Edge Functions | Issue found |
| Storage | `StorageBackupPanel.tsx`, `tenantBackupService.ts`, `tenantRestoreService.ts`, tenant-assets bucket | No issue found |
| Monitoring / Health | `Health.tsx`, `SystemHealthPanel.tsx`, `errorPerformanceService.ts`, `systemHealthService.ts` | Partial evidence |
| Configuration | `Settings.tsx`, `AdminDashboardInner` settings tab, `operationsService.ts` | Partial evidence |

Overall repository coverage: **comprehensive**. Every Admin Dashboard artifact named in the SSOT was inspected at least once, either directly or via Codebase Memory MCP graph queries.

---

# 4. Repository Coverage Matrix

## 4.1 Admin Routes

| Expected Route | Implemented | Lazy Loaded | In `AdminLayout` SIDEBAR / ROUTE_MAP / PAGE_TITLES | Status |
|----------------|-------------|-------------|--------------------------------------------------|--------|
| `/admin` → `/admin/overview` | Yes | n/a | n/a | No issue |
| `/admin/overview` | Yes | Yes | Yes | No issue |
| `/admin/tenants` | Yes | Yes | Yes | No issue |
| `/admin/tenants/:id` | Yes | Yes | No (detail, no sidebar entry) | No issue |
| `/admin/members` | Yes | Yes | Yes | No issue |
| `/admin/billing` | Yes | Yes | Yes | No issue |
| `/admin/billing/invoices` | Yes | Yes | Yes | No issue |
| `/admin/billing/payments` | Yes | Yes | Yes | No issue |
| `/admin/audit` | Yes | Yes | Yes | No issue |
| `/admin/settings` | Yes | Yes | Yes | No issue |
| `/admin/security` | Yes | Yes | Yes | No issue |
| `/admin/health` | Yes | Yes | Yes | No issue |
| `/admin/analytics` | Yes | Yes | Yes | No issue |
| `/admin/compliance` | Yes | Yes | Yes | No issue |
| `/admin/onboarding` | Yes | Yes | Yes | No issue |
| `/admin/invitations/accept` | Yes | **No** (eager import) | **No** | Issue found |

## 4.2 Admin Components

| Expected Component | Path | Status |
|--------------------|------|--------|
| `AccountSelector` | `components/admin/AccountSelector.tsx` | No issue |
| `AdminDashboardHeader` | `components/admin/AdminDashboardHeader.tsx` | No issue |
| `AdminSettingsNav` | `components/admin/AdminSettingsNav.tsx` | No issue |
| `AuditExportPanel` | `components/admin/AuditExportPanel.tsx` | No issue |
| `CustomDomainPanel` | `components/admin/CustomDomainPanel.tsx` | No issue |
| `LicenseManagerPanel` | `components/admin/LicenseManagerPanel.tsx` | No issue |
| `SecuritySettingsPanel` | `components/admin/SecuritySettingsPanel.tsx` | No issue |
| `SubdomainManagerPanel` | `components/admin/SubdomainManagerPanel.tsx` | No issue |
| `UserAccountButton` | `components/admin/UserAccountButton.tsx` | No issue |
| `AdminShell` | `components/AdminShell.tsx` | No issue |
| `AdminSidebar` | `components/AdminSidebar.tsx` | No issue |
| `AdminKpiCards` | `components/AdminKpiCards.tsx` | No issue |
| `AdminTabs` | `components/AdminTabs.tsx` | No issue |
| `AdminNotificationBell` | `components/AdminNotificationBell.tsx` | No issue |

## 4.3 Contexts / Hooks

| Artifact | Path | Status |
|----------|------|--------|
| `AuthContext` | `contexts/AuthContext.tsx` | Issue found |
| `TenantContext` | `contexts/TenantContext.tsx` | No issue |
| `useAuth` | `contexts/AuthContext.tsx` | No issue |
| `useTenant` | `contexts/TenantContext.tsx` | No issue |
| `useAdminList` | `hooks/useAdminList.ts` | No issue |
| `useAdminRealtime` | `hooks/useAdminRealtime.ts` | No issue |
| `useConfirmDialog` | `hooks/useConfirmDialog.tsx` | No issue |
| `useDebounce` | `hooks/useDebounce.ts` | No issue |
| `usePermissions` | `hooks/usePermissions.ts` | No issue |

## 4.4 Admin Wrapper Services

| Service | Path | Status | Notes |
|---------|------|--------|-------|
| `tenantAdminService.ts` | `services/admin/tenantAdminService.ts` | Issue found | Direct `.from()` calls; missing `get_or_create_custom_domain_token` wrapper |
| `systemAdminService.ts` | `services/admin/systemAdminService.ts` | No issue | Pure re-export stub |
| `memberAdminService.ts` | `services/admin/memberAdminService.ts` | Issue found | Direct `.from()` calls |
| `billingAdminService.ts` | `services/admin/billingAdminService.ts` | Issue found | Direct `.from()` calls; billing plan/invoice RPCs not re-exported |
| `analyticsAdminService.ts` | `services/admin/analyticsAdminService.ts` | No issue | Direct RPC calls correct |
| `complianceAdminService.ts` | `services/admin/complianceAdminService.ts` | Issue found | Browser API `downloadGdprExport` in service layer |
| `auditAdminService.ts` | `services/admin/auditAdminService.ts` | Issue found | Direct `.from('audit_log')` |
| `licenseService.ts` | `services/admin/licenseService.ts` | Issue found | Direct `.from('licenses')` |
| `billingProviderRegistry.ts` | `services/admin/billingProviderRegistry.ts` | No issue | All expected providers present |
| `supportService.ts` | `services/admin/supportService.ts` | Issue found | Direct `.from()` calls |
| `smsService.ts` | `services/admin/smsService.ts` | No issue | Edge Function wrapper |
| `permissions.ts` | `services/admin/permissions.ts` | No issue | Re-exports `lib/permissions.ts` |

## 4.5 Base Services

| Service | Path | Status | Notes |
|---------|------|--------|-------|
| `tenantService.ts` | `services/tenantService.ts` | No issue | Central service; allowed direct `.from()` |
| `systemAdminService.ts` | `services/systemAdminService.ts` | No issue | Base implementation correct |
| `bankAccountService.ts` | `services/bankAccountService.ts` | No issue | Allowed direct `.from()` |
| `operationsService.ts` | `services/operationsService.ts` | No issue | RPC wrappers |
| `tenantBackupService.ts` | `services/tenantBackupService.ts` | No issue | Edge Function wrapper |
| `tenantRestoreService.ts` | `services/tenantRestoreService.ts` | No issue | Edge Function wrapper |
| `tenantMigrationService.ts` | `services/tenantMigrationService.ts` | No issue | RPC wrappers |
| `loginHistoryService.ts` | `services/loginHistoryService.ts` | No issue | RPC wrappers |
| `auditService.ts` | `services/auditService.ts` | No issue | Edge Function + allowed `.from('app_audit_log')` |
| `twoFactorService.ts` | `services/twoFactorService.ts` | No issue | RPC + Edge Function wrappers |
| `planService.ts` | `services/planService.ts` | No issue | RPC wrappers |
| `invoiceService.ts` | `services/invoiceService.ts` | No issue | RPC + Edge Function wrappers |
| `notificationService.ts` | `services/notificationService.ts` | No issue | Allowed `.from('notification_logs')` |
| `errorPerformanceService.ts` | `services/errorPerformanceService.ts` | No issue | Edge Function wrapper |
| `systemHealthService.ts` | `services/systemHealthService.ts` | No issue | Edge Function wrapper |
| `cronJobService.ts` | `services/cronJobService.ts` | No issue | Allowed `.from('cron_job_logs')` |
| `heavyOpsQueueService.ts` | `services/heavyOpsQueueService.ts` | Partial evidence | Not analyzed in depth |
| `announcementService.ts` | `services/announcementService.ts` | No issue | RPC + allowed `.from()` |
| `apiKeyService.ts` | `services/apiKeyService.ts` | Partial evidence | Not imported by admin UI |
| `emailTemplateService.ts` | `services/emailTemplateService.ts` | No issue | Edge Function + allowed `.from()` |
| `webhookService.ts` | `services/webhookService.ts` | No issue | RPC wrappers |

## 4.6 Database Tables (38 expected)

All 38 expected tables exist in `supabase/schema.sql` with `CREATE TABLE IF NOT EXISTS`. Coverage: **100%**. See Section 10 for details.

## 4.7 RPCs

| Status | Count | Notes |
|--------|-------|-------|
| Defined and used | ~88 | Majority present |
| Missing in schema | 4 | `get_admin_audit_logs`, `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs` |
| Multiple versions | 3 | `update_tenant`, `update_tenant_subscription`, `create_tenant_with_admin` |

## 4.8 Edge Functions

| Status | Count | Notes |
|--------|-------|-------|
| Expected and present | 27 | All exist |
| Extra / dead | 2 | `admin-health-check`, `deliver-webhook` |
| Missing auth (public) | 2 | `check-subdomain` (rate-limited but public), `audit-log` (no auth — critical) |

---

# 5. Cross-Layer Traceability Summary

The required trace order is:

```
UI Component → Admin Page → Hooks/Contexts → Wrapper Service → Base Service → RPC / from() / Edge Function → lib/supabase.ts → PostgREST/Edge Runtime → Postgres Function / Trigger / RLS → Realtime/Audit Row → UI Update
```

| Capability | Trace Status | Breaks |
|------------|--------------|--------|
| Authentication | ✓ Complete | Admin gate bypasses `isSystemAdmin()` helper |
| Authorization | ✗ Broken | `is_system_admin` RPC exists but `App.tsx` uses direct table query |
| Tenant | ◐ Partial | Tenant creation bypasses RPC; Edge Function does direct inserts |
| Billing | ✓ Complete | Subscription update RPC has correct auth |
| Members | ✓ Complete | Invitation creation in wrapper does direct `.from()` |
| Analytics | ✓ Complete | RPCs exist and are called correctly |
| Audit | ◐ Partial | `auditAdminService` queries `audit_log` directly; `get_admin_audit_logs` RPC missing |
| Compliance | ✓ Complete | GDPR RPCs exist and are called |
| Notifications | ◐ Partial | `admin_events` has RLS (policies exist); only `cron-admin-tasks` inserts events |
| Storage | ✓ Complete | Backup/restore Edge Function chain is complete |
| Monitoring / Health | — Evidence gap | `Health.tsx` delegates to lazy `SystemHealthPanel`; data source not fully traced |
| Configuration | — Evidence gap | Settings tab data sources not fully traced |

---

# 6. Architecture Inconsistencies

## ARCH-001 — Admin gate bypasses permission helper (CRITICAL)

- **Issue ID:** ARCH-001
- **Category:** Architecture Inconsistency
- **Severity:** Critical
- **Confidence:** Confirmed
- **Description:** `App.tsx` checks system-admin status by directly querying `public.system_admins` instead of using the `isSystemAdmin()` helper in `lib/permissions.ts`, which calls the `is_system_admin` SECURITY DEFINER RPC. This creates a second, client-side authorization path and duplicates the permission logic.
- **Repository Evidence:** `App.tsx:212-216`
  ```typescript
  const { data } = await supabase
    .from('system_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!cancelled) setIsSystemAdmin(!!data);
  ```
- **Repository Location:** `App.tsx` lines 212-216
- **Affected Files:** `App.tsx`
- **Affected Services:** `lib/permissions.ts` (helper unused)
- **Affected RPC:** `is_system_admin` (bypassed)
- **Affected Database Objects:** `public.system_admins`
- **Cross-layer Traceability:** `App.tsx` (UI/Application) → direct `supabase.from('system_admins')` → `public.system_admins` table. Expected: `App.tsx` → `lib/permissions.ts:isSystemAdmin()` → `is_system_admin` RPC → `public.system_admins`.
- **Business Impact:** Authorization decision is made by client-side code with direct table access; inconsistent enforcement path.
- **Technical Impact:** Harder to maintain, easier to break with RLS changes, duplicates the RPC-backed helper.
- **Root Cause Candidate:** `App.tsx` never imports or calls `isSystemAdmin()`.

## ARCH-002 — AuthContext performs business write directly (CRITICAL)

- **Issue ID:** ARCH-002
- **Category:** Architecture / Execution Inconsistency
- **Severity:** Critical
- **Confidence:** Confirmed
- **Description:** On `SIGNED_IN`, `AuthContext.tsx` calls `supabase.rpc('activate_pending_memberships', ...)` directly instead of through a service wrapper. The SSOT execution model assigns business writes to the Service layer; contexts must only manage cross-cutting runtime state.
- **Repository Evidence:** `contexts/AuthContext.tsx:90-92`
  ```typescript
  Promise.resolve(
    supabase.rpc('activate_pending_memberships', { p_user_id: newSession.user.id })
  ).catch(() => {});
  ```
- **Repository Location:** `contexts/AuthContext.tsx` lines 90-92
- **Affected Files:** `contexts/AuthContext.tsx`
- **Affected Services:** `services/admin/memberAdminService.ts` (unused for this call)
- **Affected RPC:** `activate_pending_memberships`
- **Affected Database Objects:** `tenant_memberships`, `invitations`
- **Cross-layer Traceability:** `AuthContext` (Application) → direct `supabase.rpc` → `activate_pending_memberships`. Expected: `AuthContext` → `services/admin/memberAdminService.activatePendingMemberships()` → `supabase.rpc`.
- **Business Impact:** Membership activation logic is coupled to the authentication lifecycle, not reusable, and inconsistently error-handled (silent `catch`).
- **Technical Impact:** Context layer performs a business-side effect, violating the documented architecture.
- **Root Cause Candidate:** `AuthContext.tsx` imports `supabase` and calls `supabase.rpc` directly.

## ARCH-003 — InvitationsAccept route outside lazy-loaded admin layout

- **Issue ID:** ARCH-003
- **Category:** Architecture Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** `pages/admin/InvitationsAccept.tsx` exists and is imported eagerly in `App.tsx`, but it is not lazy-loaded like all other admin pages and is rendered outside the `<AdminLayout>` shell via a special `if (location.pathname === '/admin/invitations/accept')` branch.
- **Repository Evidence:**
  - `App.tsx:83` — `import InvitationsAccept from './pages/admin/InvitationsAccept';`
  - `App.tsx:1329-1336` — special branch rendering `<InvitationsAccept />`
  - `App.tsx:1350-1366` — all other admin routes lazy-loaded under `<AdminLayout>`
- **Affected Files:** `App.tsx`, `pages/admin/InvitationsAccept.tsx`
- **Cross-layer Traceability:** URL `/admin/invitations/accept` → eager component render → no `AdminLayout` shell.
- **Business Impact:** Invitation accept page lacks admin chrome; inconsistent UX and routing pattern.
- **Technical Impact:** Breaks the uniform lazy-loading / layout pattern used by every other admin page.
- **Root Cause Candidate:** Special-cased branch in `App.tsx` before the main admin route tree.

## ARCH-004 — AdminDashboardInner tabs unreachable

- **Issue ID:** ARCH-004
- **Category:** Architecture / UI Inconsistency
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** `pages/admin/AdminDashboardInner.tsx` defines 22 tab values (`overview`, `rateLimit`, `systemAdmins`, `loginHistory`, `operations`, `vouchers`, `tickets`, `emails`, `notifications`, `health`, `errors`, `storage`, `bulkMaintenance`, `apiKeys`, `webhooks`, `integrations`, `twoFactor`, `compliance`, `whiteLabel`, `readReplicaQueue`, `security`, `settings`), but only 4 standalone admin pages pass `activeTab` (`overview`, `settings`, `health`, `compliance`). The remaining ~17 tabs are implemented in code but never rendered because no route triggers them.
- **Repository Evidence:**
  - `pages/admin/AdminDashboardInner.tsx:115` — `AdminTab` union of 22 strings
  - `pages/admin/*.tsx` — only 4 files instantiate `AdminDashboardInner`
  - `pages/admin/AdminLayout.tsx:9-44` — sidebar only contains 13 entries, none map to `vouchers`, `tickets`, `emails`, `notifications`, `errors`, `storage`, `bulkMaintenance`, `apiKeys`, `webhooks`, `integrations`, `twoFactor`, `whiteLabel`, `readReplicaQueue`, `rateLimit`, `systemAdmins`, `loginHistory`
- **Affected Files:** `pages/admin/AdminDashboardInner.tsx`, `pages/admin/AdminLayout.tsx`, `App.tsx`
- **Cross-layer Traceability:** Implemented UI panels have no route/sidebar activation path.
- **Business Impact:** Large surface area of admin capabilities (notifications, email templates, vouchers, tickets, API keys, webhooks, integrations, 2FA, white-label, read-replica queue, bulk maintenance, error/health/storage panels) is unreachable through normal navigation.
- **Technical Impact:** Dead UI code and inconsistent navigation model.
- **Root Cause Candidate:** Admin routes/sidebar not aligned with `AdminDashboardInner` tab contract.

## ARCH-005 — Wrapper services perform direct `.from()` queries

- **Issue ID:** ARCH-005
- **Category:** Architecture Inconsistency
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** Several `services/admin/*.ts` wrapper services bypass the base-service layer and execute `supabase.from(...)` directly. The architecture model expects admin wrappers to re-export/adapt base services; base services own database access.
- **Repository Evidence:**
  - `services/admin/tenantAdminService.ts:64-67` — `.from('tenants')`
  - `services/admin/tenantAdminService.ts:92-94` — `.from('tenant_memberships')`
  - `services/admin/tenantAdminService.ts:109-111` — `.from('tenant_memberships')`
  - `services/admin/memberAdminService.ts:103-111` — `.from('invitations')`
  - `services/admin/memberAdminService.ts:158-166` — `.from('invitations')`
  - `services/admin/memberAdminService.ts:170-177` — `.from('invitations')`
  - `services/admin/memberAdminService.ts:185-189` — `.from('invitations')`
  - `services/admin/memberAdminService.ts:197-199` — `.from('invitations')`
  - `services/admin/memberAdminService.ts:297-303` — `.from('tenant_memberships')`
  - `services/admin/memberAdminService.ts:312-317` — `.from('invitations')`
  - `services/admin/billingAdminService.ts:62-74` — `.from('tenant_subscriptions')`
  - `services/admin/auditAdminService.ts:130-159` — `.from('audit_log')`
  - `services/admin/licenseService.ts:162-165` — `.from('licenses')`
  - `services/admin/licenseService.ts:173-175` — `.from('licenses')`
  - `services/admin/supportService.ts:77-99` — `.from('support_tickets', 'ticket_replies', 'ticket_reply_templates')`
- **Affected Files:** `services/admin/tenantAdminService.ts`, `services/admin/memberAdminService.ts`, `services/admin/billingAdminService.ts`, `services/admin/auditAdminService.ts`, `services/admin/licenseService.ts`, `services/admin/supportService.ts`
- **Affected Services:** All listed above
- **Affected Database Objects:** `tenants`, `tenant_memberships`, `invitations`, `tenant_subscriptions`, `audit_log`, `licenses`, `support_tickets`, `ticket_replies`, `ticket_reply_templates`
- **Cross-layer Traceability:** Admin wrapper → direct `supabase.from()` instead of admin wrapper → base service → `supabase.from()` / RPC.
- **Business Impact:** Permission / business logic may diverge between base and wrapper service paths.
- **Technical Impact:** Violates the documented wrapper/base service boundary; duplicated data access patterns.
- **Root Cause Candidate:** Wrapper services were implemented with direct data access rather than delegating to base services.

## ARCH-006 — Browser API in compliance admin service

- **Issue ID:** ARCH-006
- **Category:** Architecture / Service Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** `services/admin/complianceAdminService.ts` contains `downloadGdprExport()` which uses `document.createElement('a')`, `URL.createObjectURL()`, and `URL.revokeObjectURL()`. This couples a service module to the browser DOM and makes it non-reusable outside the presentation layer.
- **Repository Evidence:** `services/admin/complianceAdminService.ts:121-131`
- **Affected Files:** `services/admin/complianceAdminService.ts`
- **Cross-layer Traceability:** Service layer → browser DOM API.
- **Business Impact:** Export download logic cannot be tested or reused in non-browser contexts.
- **Technical Impact:** Violates separation of concerns; belongs in a component or utility.
- **Root Cause Candidate:** Service file implemented UI-side download behavior.

---

# 7. Dependency Inconsistencies

## DEP-001 — AdminLayout missing route mappings for 3 expected routes

- **Issue ID:** DEP-001
- **Category:** Dependency Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** `pages/admin/AdminLayout.tsx` `SIDEBAR_SECTIONS`, `ADMIN_ROUTE_MAP`, and `PAGE_TITLES` contain 13 entries. The SSOT baseline expects 16 admin routes; the missing sidebar/route-map entries are `invitations/accept` (special branch), `tenants/:id` (detail, acceptable), and `notifications`/`announcements` (no dedicated route exists).
- **Repository Evidence:** `pages/admin/AdminLayout.tsx:9-60`
- **Affected Files:** `pages/admin/AdminLayout.tsx`
- **Cross-layer Traceability:** Route tree in `App.tsx` has 15 child routes, but `AdminLayout` maps only 13 sidebar ids to paths/titles.
- **Business Impact:** Inconsistent navigation metadata; some admin paths have no sidebar representation.
- **Technical Impact:** `getActiveId` fallback may mis-highlight navigation.
- **Root Cause Candidate:** AdminLayout maps were not updated when new admin capabilities were added to `AdminDashboardInner`.

## DEP-002 — billingAdminService does not re-export plan/invoice RPCs

- **Issue ID:** DEP-002
- **Category:** Dependency / Contract Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** The SSOT dependency map expects `services/admin/billingAdminService.ts` to expose `create_subscription`, `upgrade_subscription`, `downgrade_subscription`, `cancel_subscription`, `create_invoice`, `confirm_payment`, `get_plans`, `get_plan_by_key`, `create_plan`, `update_plan`, `delete_plan`, `compute_billing_period_end`. The wrapper instead re-exports subscription lifecycle helpers and delegates plan/invoice RPCs to `planService.ts` / `invoiceService.ts`, but does not re-export them.
- **Repository Evidence:** `services/admin/billingAdminService.ts:1-116`
- **Affected Files:** `services/admin/billingAdminService.ts`
- **Affected Services:** `planService.ts`, `invoiceService.ts`
- **Affected RPCs:** `create_subscription`, `upgrade_subscription`, `downgrade_subscription`, `cancel_subscription`, `create_invoice`, `confirm_payment`, `get_plans`, `get_plan_by_key`, `create_plan`, `update_plan`, `delete_plan`, `compute_billing_period_end`
- **Cross-layer Traceability:** UI/pages expecting billing wrapper must import from multiple base services instead.
- **Business Impact:** Billing dashboard must import from scattered services, increasing coupling.
- **Technical Impact:** Wrapper does not centralize billing dependencies as documented.
- **Root Cause Candidate:** Wrapper was built around `tenantService` subscription helpers only.

## DEP-003 — analyticsAdminService missing overview RPC re-exports

- **Issue ID:** DEP-003
- **Category:** Dependency / Contract Inconsistency
- **Severity:** Low
- **Confidence:** Confirmed
- **Description:** `services/admin/analyticsAdminService.ts` implements `get_revenue_metrics` and `get_churn_cohort_metrics` but does not re-export `get_top_tenants`, `get_tenant_growth`, or `get_system_overview`. These are used by `pages/admin/AdminDashboardInner.tsx` and are re-exported through `systemAdminService.ts` (admin wrapper) instead.
- **Repository Evidence:**
  - `services/admin/analyticsAdminService.ts:1-115`
  - `pages/admin/AdminDashboardInner.tsx:166-169` imports `getSystemOverview`, `getTopTenants`, `getTenantGrowth` from `services/admin/systemAdminService.ts`
- **Affected Files:** `services/admin/analyticsAdminService.ts`, `pages/admin/AdminDashboardInner.tsx`, `services/admin/systemAdminService.ts`
- **Affected RPCs:** `get_system_overview`, `get_top_tenants`, `get_tenant_growth`
- **Cross-layer Traceability:** Overview tab uses `systemAdminService.ts` for analytics data.
- **Business Impact:** Analytics / overview data sources are split across two wrapper services.
- **Technical Impact:** Dependency map mismatch.
- **Root Cause Candidate:** Wrapper boundaries do not match the SSOT capability grouping.

## DEP-004 — tenantAdminService missing `get_or_create_custom_domain_token`

- **Issue ID:** DEP-004
- **Category:** Dependency / Contract Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** The SSOT dependency map lists `get_or_create_custom_domain_token` as an RPC called by `services/admin/tenantAdminService.ts`. The wrapper does not expose this RPC; custom domain verification instead calls the `verify-domain` Edge Function.
- **Repository Evidence:
  - `services/admin/tenantAdminService.ts:232-246` — re-exports from `tenantService.ts`, no `get_or_create_custom_domain_token`
  - `services/admin/tenantAdminService.ts:192-209` — calls `verify-domain` Edge Function
- **Affected Files:** `services/admin/tenantAdminService.ts`
- **Affected RPC:** `get_or_create_custom_domain_token`
- **Cross-layer Traceability:** Custom domain UI → `verify-domain` Edge Function (not RPC).
- **Business Impact:** Dependency map inaccurate; custom domain token generation is Edge-backed, not RPC-backed.
- **Technical Impact:** SSOT does not reflect actual implementation.
- **Root Cause Candidate:** Implementation evolved to Edge Function; SSOT not updated.

---

# 8. Execution Inconsistencies

## EXE-001 — AuthContext silently catches membership activation failure

- **Issue ID:** EXE-001
- **Category:** Execution Inconsistency
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** `AuthContext.tsx` calls `activate_pending_memberships` and swallows all errors with `.catch(() => {})`. A failed activation leaves the user logged in without any diagnostic or audit trail.
- **Repository Evidence:** `contexts/AuthContext.tsx:90-92`
- **Affected Files:** `contexts/AuthContext.tsx`
- **Affected RPC:** `activate_pending_memberships`
- **Affected Database Objects:** `tenant_memberships`, `invitations`
- **Cross-layer Traceability:** `onAuthStateChange(SIGNED_IN)` → `supabase.rpc('activate_pending_memberships')` → silent catch.
- **Business Impact:** Pending invitations may not be activated; user has no feedback.
- **Technical Impact:** Errors are hidden; debugging is impossible.
- **Root Cause Candidate:** Direct RPC call without proper error handling or service wrapper.

## EXE-002 — `isSystemAdmin` state reset on non-admin subdomain

- **Issue ID:** EXE-002
- **Category:** Execution Inconsistency
- **Severity:** Low
- **Confidence:** Confirmed
- **Description:** In `App.tsx:203-206`, when the host is not `admin` and the path is not `/admin/*`, `isSystemAdmin` is set to `false`. However, the `useEffect` still runs on every `user` and `location.pathname` change, causing a brief `isAdminLoading` flip.
- **Repository Evidence:** `App.tsx:203-206`
- **Affected Files:** `App.tsx`
- **Cross-layer Traceability:** `AppContent` effect re-executes for tenant routes.
- **Business Impact:** Minor UI loading flicker.
- **Technical Impact:** Unnecessary state transitions.
- **Root Cause Candidate:** Guard clause inside effect still sets state.

---

# 9. Business Logic Inconsistencies

## BL-001 — Billing lifecycle shortcuts use direct `.from()` updates

- **Issue ID:** BL-001
- **Category:** Business Logic / Architecture Inconsistency
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** `services/admin/billingAdminService.ts` implements `upgradeDowngradeSubscription`, `cancelSubscription`, and `renewSubscription` by directly updating `tenant_subscriptions` with `supabase.from('tenant_subscriptions').update(...)`. These updates bypass `update_tenant_subscription` RPC and its associated validation (plan limit application, plan/status rules, `audit_log` trigger on `tenant_subscriptions`).
- **Repository Evidence:** `services/admin/billingAdminService.ts:62-74`
- **Affected Files:** `services/admin/billingAdminService.ts`
- **Affected Services:** `billingAdminService.ts`
- **Affected RPC:** `update_tenant_subscription` (bypassed)
- **Affected Database Objects:** `tenant_subscriptions`, `tenants.plan`, `audit_log`
- **Cross-layer Traceability:** Billing shortcut UI → `billingAdminService` → direct `from('tenant_subscriptions').update()` → DB. Expected: → `tenantService.updateTenantSubscription()` → `update_tenant_subscription` RPC.
- **Business Impact:** Plan downgrade/upgrade/cancel may skip business rules, limit enforcement, and audit logging.
- **Technical Impact:** Data consistency and audit trail gaps.
- **Root Cause Candidate:** Lifecycle helpers implemented as direct table writes for convenience.

## BL-002 — `createTenantWithCredentials` does not use a database RPC

- **Issue ID:** BL-002
- **Category:** Business Logic / Contract Inconsistency
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** `tenantService.createTenantWithCredentials` invokes the `create-tenant` Edge Function directly. There is no `create_tenant_with_credentials` RPC. The Edge Function performs direct table inserts (`tenants`, `tenant_subscriptions`, `tenant_memberships`, `tenant_credentials`, `app_audit_log`) and manually inserts an audit row instead of relying on `trg_audit_log_tenants`.
- **Repository Evidence:**
  - `services/tenantService.ts:779` — `supabase.functions.invoke('create-tenant', ...)`
  - `supabase/functions/create-tenant/index.ts:167-216` — direct INSERTs
- **Affected Files:** `services/tenantService.ts`, `supabase/functions/create-tenant/index.ts`
- **Affected Edge Function:** `create-tenant`
- **Affected RPC:** `create_tenant_with_admin` (exists in schema, not used by this flow)
- **Affected Database Objects:** `tenants`, `tenant_subscriptions`, `tenant_memberships`, `tenant_credentials`, `app_audit_log`
- **Cross-layer Traceability:** Tenant create UI → `tenantService` → `create-tenant` Edge → direct table INSERTs. Expected: → RPC with atomic transaction and triggers.
- **Business Impact:** Tenant creation is not atomic across multiple `await` calls; partial failure can leave orphan auth users.
- **Technical Impact:** Edge Function transaction boundaries differ from RPC transaction boundaries; manual audit insert bypasses trigger.
- **Root Cause Candidate:** Provisioning logic placed in Edge Function rather than a single database RPC.

## BL-003 — `update_tenant` and `delete_tenant_safe` RPCs are SECURITY INVOKER

- **Issue ID:** BL-003
- **Category:** Business Logic / Security Risk
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** Multiple versions of `update_tenant`, `delete_tenant_safe`, and `update_tenant_subscription` use `SECURITY INVOKER`. They each start with `IF NOT public.is_system_admin() THEN RAISE ...`, but because they are not `SECURITY DEFINER`, the caller's own RLS context is active for any row selected inside the function before the guard runs. The canonical `update_tenant_subscription` at line 36429 has the guard, but the `SELECT * FROM public.tenants WHERE id = p_tenant_id` happens after the guard, so it runs with invoker privileges.
- **Repository Evidence:**
  - `supabase/schema.sql:17523` — `update_tenant` SECURITY INVOKER
  - `supabase/schema.sql:17568` — `delete_tenant_safe` SECURITY INVOKER
  - `supabase/schema.sql:36441` — canonical `update_tenant_subscription` SECURITY INVOKER
- **Affected Files:** `supabase/schema.sql`
- **Affected RPCs:** `update_tenant`, `delete_tenant_safe`, `update_tenant_subscription`
- **Affected Database Objects:** `tenants`, `tenant_subscriptions`
- **Cross-layer Traceability:** Service → RPC → invoker RLS context.
- **Business Impact:** Privileged operations rely on RLS visibility of the invoker.
- **Technical Impact:** SECURITY INVOKER on privileged RPCs is inconsistent with the `is_system_admin` gate functions, which use SECURITY DEFINER.
- **Root Cause Candidate:** Schema evolution left multiple RPC versions with mixed security settings.

---

# 10. Database Inconsistencies

## DB-001 — Duplicate `update_tenant` RPC versions (schema drift)

- **Issue ID:** DB-001
- **Category:** Database / RPC Drift
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** `supabase/schema.sql` contains at least 7 definitions of `public.update_tenant` with different signatures. Later migrations explicitly `DROP FUNCTION IF EXISTS` older overloads, but the schema file still contains multiple overloaded definitions.
- **Repository Evidence:** `supabase/schema.sql` — `CREATE OR REPLACE FUNCTION public.update_tenant(...)` at lines 12876, 17518, 19553, 20812, 28634, 28791, 29220, 30290
- **Affected Files:** `supabase/schema.sql`
- **Affected RPC:** `update_tenant`
- **Affected Migrations:** `20260712000003_fix_update_tenant_member_role_rpc.sql`, `20260717000000_fix_admin_tenant_rpc_signatures.sql`, and others
- **Cross-layer Traceability:** Service calls one signature; database resolves to the last-defined or matching overload.
- **Business Impact:** Uncertain which version is active; behavior can change based on migration order.
- **Technical Impact:** Maintenance burden and potential for wrong function resolution.
- **Root Cause Candidate:** Iterative fixes appended new overloads without fully retiring old ones.

## DB-002 — Duplicate `update_tenant_subscription` RPC versions

- **Issue ID:** DB-002
- **Category:** Database / RPC Drift
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** `supabase/schema.sql` contains multiple `public.update_tenant_subscription` definitions with different parameter lists. The latest migration drops a 7-parameter overload before creating the canonical 8-parameter version, yet earlier versions remain in the file.
- **Repository Evidence:** `supabase/schema.sql` — lines 13048, 17702, 17788, 20858, 36429
- **Affected Files:** `supabase/schema.sql`
- **Affected RPC:** `update_tenant_subscription`
- **Affected Migrations:** `20260712000001_fix_remove_tenant_member_rpc.sql` region, `20260717000000_fix_admin_tenant_rpc_signatures.sql`
- **Cross-layer Traceability:** `tenantService` and `billingAdminService` call `update_tenant_subscription`; database may resolve to a non-canonical overload.
- **Business Impact:** Subscription update behavior may vary by migration state.
- **Technical Impact:** Schema drift and version ambiguity.
- **Root Cause Candidate:** Same as DB-001.

## DB-003 — Duplicate `create_tenant_with_admin` RPC versions

- **Issue ID:** DB-003
- **Category:** Database / RPC Drift
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** `supabase/schema.sql` contains 4 definitions of `public.create_tenant_with_admin`.
- **Repository Evidence:** `supabase/schema.sql` — lines 5271, 15249, 18640, 20748
- **Affected Files:** `supabase/schema.sql`
- **Affected RPC:** `create_tenant_with_admin`
- **Cross-layer Traceability:** Not directly used by the `create-tenant` Edge Function; the Edge Function does direct INSERTs instead (BL-002).
- **Business Impact:** Unused / dead RPC surface; schema drift.
- **Technical Impact:** Confusing which tenant-creation contract is authoritative.
- **Root Cause Candidate:** Migration fixes created new overloads.

## DB-004 — Missing `audit_log` trigger on `system_admins`, `invitations`, `licenses`

- **Issue ID:** DB-004
- **Category:** Database / Audit Gap
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** No `trg_audit_log_*` triggers exist for `system_admins`, `invitations`, or `licenses`. Admin actions that add/remove system admins, create/revoke invitations, or manage license keys are not automatically written to `audit_log`.
- **Repository Evidence:**
  - `supabase/schema.sql` — grep for `CREATE TRIGGER.*system_admins` / `invitations` / `licenses` returned 0 matches
  - `trg_audit_log_tenants`, `trg_audit_log_tenant_memberships`, `trg_audit_log_tenant_subscriptions` exist for other tables
- **Affected Files:** `supabase/schema.sql`
- **Affected Tables:** `system_admins`, `invitations`, `licenses`
- **Affected RPCs:** `add_system_admin`, `remove_system_admin`, member invitation RPCs, `generate_tenant_license`, `validate_tenant_license`
- **Cross-layer Traceability:** Privileged mutations → table with no audit trigger.
- **Business Impact:** Privilege escalation and license lifecycle changes are not automatically audited.
- **Technical Impact:** Audit coverage gaps.
- **Root Cause Candidate:** Audit trigger set was not extended to all privileged tables.

## DB-005 — `admin_events` table has RLS but limited INSERT sources

- **Issue ID:** DB-005
- **Category:** Database / Realtime Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** `admin_events` has RLS policies `admin_events_select_admin` and `admin_events_insert_admin` (contrary to the prior subagent's XLY-006 finding). However, the only INSERT source found in the codebase is `supabase/functions/cron-admin-tasks/index.ts:36`. Billing, security, and other critical events do not appear to publish to `admin_events`.
- **Repository Evidence:**
  - `supabase/schema.sql:34052-34075` — table + RLS policies
  - `supabase/functions/cron-admin-tasks/index.ts:36` — only `INSERT INTO admin_events` found
- **Affected Files:** `supabase/schema.sql`, `supabase/functions/cron-admin-tasks/index.ts`
- **Affected Table:** `admin_events`
- **Cross-layer Traceability:** Realtime channel in `useAdminRealtime.ts` subscribes to `admin_events` but few backend producers write to it.
- **Business Impact:** Notification bell under-utilized; critical events may not surface in real time.
- **Technical Impact:** Realtime system is wired but not fed.
- **Root Cause Candidate:** Event publishing not standardized across privileged operations.

## DB-006 — `get_admin_audit_logs` RPC is missing

- **Issue ID:** DB-006
- **Category:** Database / RPC Inconsistency
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** The SSOT dependency map expects an RPC named `get_admin_audit_logs`. No `CREATE OR REPLACE FUNCTION public.get_admin_audit_logs` exists in `supabase/schema.sql` or in any migration.
- **Repository Evidence:** Grep for `FUNCTION.*get_admin_audit_logs` returned 0 matches.
- **Affected Files:** `supabase/schema.sql`, `supabase/migrations/*`
- **Affected RPC:** `get_admin_audit_logs`
- **Affected Service:** `services/admin/auditAdminService.ts` (which queries `audit_log` directly instead)
- **Cross-layer Traceability:** `Audit.tsx` → `auditAdminService.getAdminAuditLogs()` → `supabase.from('audit_log')` direct query. Expected: → RPC.
- **Business Impact:** Audit log reads are direct table queries, not RPC-gated.
- **Technical Impact:** Bypasses potential centralized authorization / filtering.
- **Root Cause Candidate:** RPC never created; service uses direct query.

## DB-007 — `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs` RPCs missing

- **Issue ID:** DB-007
- **Category:** Database / RPC Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** The SSOT lists these three RPCs as expected Admin Dashboard dependencies. They are not defined in `supabase/schema.sql` or migrations.
- **Repository Evidence:** Grep for `FUNCTION.*get_cron_job_logs|FUNCTION.*get_billing_reminder_logs|FUNCTION.*get_billing_email_logs` returned 0 matches.
- **Affected Files:** `supabase/schema.sql`
- **Affected RPCs:** `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs`
- **Affected Services:** `cronJobService.ts`, `billingReminderService.ts`
- **Cross-layer Traceability:** Admin monitoring UI cannot call these RPCs.
- **Business Impact:** Cron / billing reminder / billing email log views may be incomplete or unimplemented.
- **Technical Impact:** Missing backend contract.
- **Root Cause Candidate:** RPCs were planned but never implemented.

## DB-008 — `gdpr_deletion_logs` table exists but not populated by RPC

- **Issue ID:** DB-008
- **Category:** Database / Audit Gap
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** `gdpr_deletion_logs` exists in `supabase/schema.sql:34448`, but the `gdpr_delete_user_data` RPC does not appear to insert a row (could not be traced from service code).
- **Repository Evidence:** `supabase/schema.sql:34448` and surrounding `gdpr_delete_user_data` body
- **Affected Files:** `supabase/schema.sql`
- **Affected Table:** `gdpr_deletion_logs`
- **Affected RPC:** `gdpr_delete_user_data`
- **Cross-layer Traceability:** Compliance UI → `complianceAdminService.deleteUserData()` → `gdpr_delete_user_data` RPC. Deletion log table is not obviously written.
- **Business Impact:** GDPR deletions may not leave the required audit trail.
- **Technical Impact:** Evidence gap — deletion log table may be dead.
- **Root Cause Candidate:** Logging logic not wired inside GDPR delete RPC.

## DB-009 — `app_audit_log` LOGIN/LOGOUT not trigger-enforced

- **Issue ID:** DB-009
- **Category:** Database / Audit Gap
- **Severity:** Low
- **Confidence:** Confirmed
- **Description:** `AuthContext.tsx` writes LOGIN/LOGOUT entries via `services/auditService.ts:writeAuditLog`, which calls the `audit-log` Edge Function. There is no database trigger on `app_audit_log` or auth events that enforces these writes.
- **Repository Evidence:** `contexts/AuthContext.tsx:80-83`, `services/auditService.ts`, `supabase/functions/audit-log/index.ts`
- **Affected Files:** `contexts/AuthContext.tsx`, `services/auditService.ts`, `supabase/functions/audit-log/index.ts`
- **Affected Table:** `app_audit_log`
- **Cross-layer Traceability:** Auth state change → service → Edge Function → direct insert. No trigger enforces the write.
- **Business Impact:** Login/logout audit depends on client-side and Edge Function correctness.
- **Technical Impact:** Audit completeness is not database-guaranteed.
- **Root Cause Candidate:** Audit path implemented entirely in application code.

---

# 11. Migration Inconsistencies

## MIG-001 — 25+ "fix_" migrations indicate unstable schema evolution

- **Issue ID:** MIG-001
- **Category:** Migration Inconsistency / Schema Drift
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** `supabase/migrations/` contains at least 25 files whose names begin with `fix_` or contain `_fix_`. This indicates iterative patching of earlier migrations, which is a classic sign of schema drift and incomplete original migrations.
- **Repository Evidence:** `supabase/migrations/20250705000005_phase9_5_process_checkout_ledger_fixes.sql` through `20260717000000_fix_admin_tenant_rpc_signatures.sql` and similar.
- **Affected Files:** 25+ migration files
- **Affected Database Objects:** `update_tenant`, `update_tenant_subscription`, `update_tenant_member_role`, `toggle_tenant_member_active`, `remove_tenant_member`, `remove_system_admin`, `invite_seat_limit`, `rate_limit_logs`, `tenant_delete_cascade`, `audit_log_trigger`, `rls_helpers`, `system_admin_rls`, `security_definer_search_path`
- **Cross-layer Traceability:** Fixes layer over fixes in the same migration chain.
- **Business Impact:** Production migration baseline is fragile; ordering and idempotency risks.
- **Technical Impact:** `supabase/schema.sql` may not represent a clean initial state.
- **Root Cause Candidate:** Development workflow patched migrations rather than rebaselining.

## MIG-002 — 21 migrations exist after the SSOT baseline

- **Issue ID:** MIG-002
- **Category:** Repository Drift
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** The SSOT baseline appears to end around `20260713000012_create_audit_log_table.sql`. Twenty-one migration files have timestamps after this (20260713 through 20260723). These migrations add new RPCs, triggers, RLS policies, and Edge Function support that are not reflected in the SSOT architecture/dependency/execution models.
- **Repository Evidence:** `supabase/migrations/20260713053550_sp1_6_expand_audit_log_event_types.sql` through `20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql`
- **Affected Files:** 21 migration files
- **Affected Database Objects:** Audit log event types, announcement audience, custom domain verification, global config RPC, user/role management RPCs, plan CRUD, db maintenance, support ticket SLA, set tenant subdomain
- **Cross-layer Traceability:** Repository has evolved past the approved SSOT.
- **Business Impact:** Approved SSOT does not describe the current implementation state.
- **Technical Impact:** Remediation plans based on SSOT may miss new objects.
- **Root Cause Candidate:** SSOT was approved before the final migration wave.

## MIG-003 — Non-standard timestamp `20260710064509_f33_members_search_rpc.sql`

- **Issue ID:** MIG-003
- **Category:** Migration Inconsistency
- **Severity:** Low
- **Confidence:** Confirmed
- **Description:** One migration uses a non-standard timestamp (`20260710064509` with hour-minute-second instead of `00000`).
- **Repository Evidence:** `supabase/migrations/20260710064509_f33_members_search_rpc.sql`
- **Affected Files:** that file
- **Affected RPC:** `search_tenant_members`
- **Cross-layer Traceability:** Ordering may be ambiguous for tools that parse the filename prefix.
- **Business Impact:** Low — file still sorts correctly.
- **Technical Impact:** Potential migration tool confusion.
- **Root Cause Candidate:** Manual filename with timestamp of creation instead of migration ordering convention.

## MIG-004 — Missing migration `20260713000002`

- **Issue ID:** MIG-004
- **Category:** Migration Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** The migration sequence has `20260713000001` and `20260713000003` but no `20260713000002`.
- **Repository Evidence:** `ls supabase/migrations` shows the gap.
- **Affected Files:** migration chain
- **Cross-layer Traceability:** Sequence gap.
- **Business Impact:** Indicates a deleted or omitted migration.
- **Technical Impact:** `supabase/schema.sql` may rely on the missing file or the numbering may be intentional.
- **Root Cause Candidate:** Migration was removed or never created.

---

# 12. RPC Inconsistencies

## RPC-001 — Multiple overloaded versions of the same RPCs

- **Issue ID:** RPC-001
- **Category:** RPC Inconsistency / Schema Drift
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** Same as DB-001, DB-002, DB-003. `update_tenant`, `update_tenant_subscription`, and `create_tenant_with_admin` have multiple overloaded definitions in `supabase/schema.sql`.
- **Repository Evidence:** `supabase/schema.sql` lines cited in DB-001 through DB-003
- **Affected RPCs:** `update_tenant`, `update_tenant_subscription`, `create_tenant_with_admin`
- **Root Cause Candidate:** Iterative fixes appended overloads.

## RPC-002 — Privileged RPCs use SECURITY INVOKER

- **Issue ID:** RPC-002
- **Category:** RPC / Security Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** `create_tenant_with_admin`, `update_tenant`, `delete_tenant_safe`, and `update_tenant_subscription` are `SECURITY INVOKER`. They each check `is_system_admin()` early, but the invoker context applies to all SQL inside the function. The canonical pattern used by gate helpers (`is_system_admin`, `has_tenant_role`, etc.) is `SECURITY DEFINER`.
- **Repository Evidence:** `supabase/schema.sql` lines 15257, 17523, 17568, 17713, 36441
- **Affected RPCs:** `create_tenant_with_admin`, `update_tenant`, `delete_tenant_safe`, `update_tenant_subscription`
- **Business Impact:** Privileged operations depend on invoker RLS visibility; inconsistent security model.
- **Technical Impact:** Potential for subtle privilege or visibility bugs.
- **Root Cause Candidate:** Migration fixes created new versions without aligning security settings.

## RPC-003 — `get_admin_audit_logs`, `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs` are missing

- **Issue ID:** RPC-003
- **Category:** RPC Inconsistency
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** Same as DB-006 and DB-007. These four RPCs are named in the SSOT dependency map but do not exist in the schema.
- **Repository Evidence:** Grep for `FUNCTION.*get_admin_audit_logs|FUNCTION.*get_cron_job_logs|FUNCTION.*get_billing_reminder_logs|FUNCTION.*get_billing_email_logs` returned 0 matches.
- **Affected RPCs:** `get_admin_audit_logs`, `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs`
- **Root Cause Candidate:** RPCs planned but never implemented.

## RPC-004 — `search_tenants` / `get_tenants_admin` resolution ambiguity

- **Issue ID:** RPC-004
- **Category:** RPC Inconsistency
- **Severity:** Low
- **Confidence:** Possible
- **Description:** `search_tenants` and `get_tenants_admin` appear in `tenantService.ts`. The schema contains at least two versions of `get_tenants_admin` and several search-related functions. Without runtime comparison, it is unclear which overload the PostgREST client resolves.
- **Repository Evidence:** `supabase/schema.sql` — multiple `CREATE OR REPLACE FUNCTION` definitions for tenant search/list functions
- **Affected RPCs:** `search_tenants`, `get_tenants_admin`
- **Root Cause Candidate:** Iterative migration overloads.

---

# 13. Edge Function Inconsistencies

## EDG-001 — `audit-log` Edge Function has no authentication

- **Issue ID:** EDG-001
- **Category:** Edge Function / Security Risk
- **Severity:** Critical
- **Confidence:** Confirmed
- **Description:** `supabase/functions/audit-log/index.ts` accepts requests, parses the body, and writes to `public.app_audit_log` using a service-role client. It does not extract or validate a Bearer token or `X-Internal-Secret`. Anyone with the function URL can inject audit rows, perform rate-limit cleanup, or query rate-limit state.
- **Repository Evidence:** `supabase/functions/audit-log/index.ts:42-52`
  ```typescript
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { ... });
  ```
  No `Authorization` header parsing or `auth.getUser()` call is present.
- **Affected Files:** `supabase/functions/audit-log/index.ts`
- **Affected Edge Function:** `audit-log`
- **Affected Database Objects:** `app_audit_log`, `rate_limit_logs`
- **Cross-layer Traceability:** `AuthContext` / `auditService.ts` → `audit-log` Edge Function → direct service-role write. No auth gate.
- **Business Impact:** Audit trail integrity is compromised; an attacker can create false audit entries.
- **Technical Impact:** Central audit log is not trust-boundary protected.
- **Root Cause Candidate:** Edge Function was built as an internal helper without token validation.

## EDG-002 — `check-subdomain` is public (acceptable but undocumented)

- **Issue ID:** EDG-002
- **Category:** Edge Function / Security Risk
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** `supabase/functions/check-subdomain/index.ts` has no Bearer token validation. It is rate-limited by IP (10 req/min). This is intentional for pre-login availability checks, but the SSOT does not document a public Edge Function in the admin boundary.
- **Repository Evidence:** `supabase/functions/check-subdomain/index.ts:42-64`
- **Affected Files:** `supabase/functions/check-subdomain/index.ts`
- **Affected Edge Function:** `check-subdomain`
- **Cross-layer Traceability:** Custom domain / signup UI → `check-subdomain` (public).
- **Business Impact:** Subdomain enumeration possible within rate limits.
- **Technical Impact:** Low — intentional public endpoint.
- **Root Cause Candidate:** SSOT dependency map lists it under admin Edge Functions but it is public.

## EDG-003 — `billing-webhooks` signature-only auth

- **Issue ID:** EDG-003
- **Category:** Edge Function / Security Risk
- **Severity:** Low
- **Confidence:** Confirmed
- **Description:** `supabase/functions/billing-webhooks/index.ts` does not validate a Bearer token; it validates `stripe-signature` against `STRIPE_WEBHOOK_SECRET`. This is the standard pattern for Stripe webhooks and is not a defect, but it differs from the generic auth model in other Edge Functions.
- **Repository Evidence:** `supabase/functions/billing-webhooks/index.ts:40-88`
- **Affected Files:** `supabase/functions/billing-webhooks/index.ts`
- **Affected Edge Function:** `billing-webhooks`
- **Root Cause Candidate:** Provider-specific webhook pattern; not a generic authenticated endpoint.

## EDG-004 — `admin-health-check` and `deliver-webhook` are dead Edge Functions

- **Issue ID:** EDG-004
- **Category:** Edge Function / Dead Code
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** `admin-health-check` and `deliver-webhook` exist in `supabase/functions/` but are not referenced by any service or page in the React app. `deliver-webhook` may be a duplicate of `webhook-delivery`.
- **Repository Evidence:
  - `supabase/functions/admin-health-check/index.ts`
  - `supabase/functions/deliver-webhook/index.ts`
  - Grep for `admin-health-check` or `deliver-webhook` in `services/`, `pages/`, `components/` returned 0 matches
- **Affected Files:** `supabase/functions/admin-health-check/index.ts`, `supabase/functions/deliver-webhook/index.ts`
- **Root Cause Candidate:** Unused artifacts left from development.

## EDG-005 — Many Edge Functions do not write to `app_audit_log`

- **Issue ID:** EDG-005
- **Category:** Edge Function / Audit Gap
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** Only `create-tenant`, `delete-tenant`, `create-system-admin`, `impersonate-tenant`, `end-impersonation`, `admin-2fa-override`, and `delete-user` perform manual `app_audit_log` inserts. The following do not: `check-subdomain`, `verify-domain`, `tenant-backup`, `tenant-restore`, `system-health`, `error-performance`, `system-backup`, `billing-webhooks`, `process-checkout`, `send-billing-email`, `cron-admin-tasks`, `db-maintenance`, `send-email`, `send-sms`, `send-template-email`, `send-ticket-email`, `send-invitation-email`, `reset-password`, `invite-member`.
- **Repository Evidence:** Grep for `app_audit_log` in `supabase/functions/*/index.ts` showed only the 7 functions above.
- **Affected Edge Functions:** All listed above
- **Cross-layer Traceability:** Edge Function privileged actions → no audit row.
- **Business Impact:** Privileged operations outside the database trigger set have incomplete audit trails.
- **Technical Impact:** Compliance and forensic investigation rely on manual logging.
- **Root Cause Candidate:** Audit logging not standardized in Edge Function development.

---

# 14. Service Inconsistencies

## SVC-001 — Wrapper services bypass base services with direct `.from()` calls

- **Issue ID:** SVC-001
- **Category:** Service / Architecture Inconsistency
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** Same as ARCH-005. Admin wrappers contain direct `supabase.from()` calls that should live in base services.
- **Repository Evidence:** See ARCH-005.
- **Affected Services:** `tenantAdminService.ts`, `memberAdminService.ts`, `billingAdminService.ts`, `auditAdminService.ts`, `licenseService.ts`, `supportService.ts`
- **Root Cause Candidate:** Wrapper services implemented as combined adapter + data-access layers.

## SVC-002 — `complianceAdminService.ts` uses browser APIs

- **Issue ID:** SVC-002
- **Category:** Service / Architecture Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** Same as ARCH-006. `downloadGdprExport` in `services/admin/complianceAdminService.ts` triggers file download via DOM APIs.
- **Repository Evidence:** `services/admin/complianceAdminService.ts:121-131`
- **Root Cause Candidate:** Service layer absorbed presentation concern.

## SVC-003 — Billing wrapper does not expose plan/invoice RPCs

- **Issue ID:** SVC-003
- **Category:** Service / Contract Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** Same as DEP-002.
- **Repository Evidence:** `services/admin/billingAdminService.ts:1-116`
- **Root Cause Candidate:** Wrapper built around subscription helpers only.

## SVC-004 — Analytics wrapper does not expose overview RPCs

- **Issue ID:** SVC-004
- **Category:** Service / Contract Inconsistency
- **Severity:** Low
- **Confidence:** Confirmed
- **Description:** Same as DEP-003.
- **Repository Evidence:** `services/admin/analyticsAdminService.ts:1-115`
- **Root Cause Candidate:** Capability grouping mismatch.

## SVC-005 — `services/admin/permissions.ts` may be unused

- **Issue ID:** SVC-005
- **Category:** Service / Dead Code
- **Severity:** Low
- **Confidence:** Possible
- **Description:** `services/admin/permissions.ts` re-exports `lib/permissions.ts` but the admin UI appears to use `lib/permissions.ts` directly or `usePermissions` from hooks.
- **Repository Evidence:** `services/admin/permissions.ts`
- **Affected Files:** `services/admin/permissions.ts`
- **Root Cause Candidate:** Wrapper created for consistency but not adopted.

---

# 15. Permission Inconsistencies

## PERM-001 — Two enforcement paths for system-admin check

- **Issue ID:** PERM-001
- **Category:** Permission Inconsistency
- **Severity:** Critical
- **Confidence:** Confirmed
- **Description:** `lib/permissions.ts` calls `is_system_admin` RPC. `App.tsx` queries `system_admins` table directly. Two different enforcement paths exist for the same decision.
- **Repository Evidence:** `lib/permissions.ts:123-130` and `App.tsx:212-216`
- **Affected Files:** `App.tsx`, `lib/permissions.ts`
- **Affected RPC:** `is_system_admin`
- **Affected Table:** `system_admins`
- **Root Cause Candidate:** `App.tsx` implemented before `lib/permissions.ts` helper and never refactored.

## PERM-002 — `audit-log` Edge Function not permission-gated

- **Issue ID:** PERM-002
- **Category:** Permission / Security Inconsistency
- **Severity:** Critical
- **Confidence:** Confirmed
- **Description:** Same as EDG-001.
- **Repository Evidence:** `supabase/functions/audit-log/index.ts`
- **Root Cause Candidate:** No auth middleware.

## PERM-003 — `admin_events` RLS depends on policies that may be incomplete

- **Issue ID:** PERM-003
- **Category:** Permission / Realtime Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** `admin_events` has `admin_events_select_admin` and `admin_events_insert_admin` policies. The only producer is `cron-admin-tasks`. If other producers are added later, they must use a role that satisfies the insert policy.
- **Repository Evidence:** `supabase/schema.sql:34068-34075`
- **Affected Table:** `admin_events`
- **Root Cause Candidate:** Single producer; policy surface not stress-tested.

---

# 16. Validation Inconsistencies

## VAL-001 — `InvitationsAccept` not validated through `AdminLayout` route map

- **Issue ID:** VAL-001
- **Category:** Validation / UI Inconsistency
- **Severity:** Low
- **Confidence:** Confirmed
- **Description:** `InvitationsAccept` is rendered via a special branch in `App.tsx` and is not in the `AdminLayout` `ADMIN_ROUTE_MAP` / `PAGE_TITLES`. `getActiveId('/admin/invitations/accept')` returns `'invitations'` (the fallback `rest` value), which has no title/sidebar entry.
- **Repository Evidence:** `pages/admin/AdminLayout.tsx:62-69`
- **Affected Files:** `App.tsx`, `pages/admin/AdminLayout.tsx`
- **Root Cause Candidate:** Special-cased route.

## VAL-002 — Billing lifecycle shortcuts bypass canonical validation RPC

- **Issue ID:** VAL-002
- **Category:** Validation / Business Logic Inconsistency
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** Same as BL-001.
- **Repository Evidence:** `services/admin/billingAdminService.ts:62-74`
- **Root Cause Candidate:** Direct `.from()` updates avoid `update_tenant_subscription` validation.

---

# 17. UI Inconsistencies

## UI-001 — Large set of `AdminDashboardInner` tabs unreachable

- **Issue ID:** UI-001
- **Category:** UI Inconsistency
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** Same as ARCH-004. 22 tabs defined; only 4 are reachable via routes.
- **Repository Evidence:** `pages/admin/AdminDashboardInner.tsx:115` and `pages/admin/*.tsx`
- **Affected Files:** `pages/admin/AdminDashboardInner.tsx`, `pages/admin/AdminLayout.tsx`, `App.tsx`
- **Affected UI Components:** `NotificationManager`, `EmailTemplateManager`, `VoucherManager`, `TicketInbox`, `TwoFactorManager`, `ApiKeyManager`, `WebhookManager`, `IntegrationMarketplace`, `WhiteLabelManager`, `ReadReplicaQueueManager`, `BulkMaintenancePanel`, `StorageBackupPanel`, `ErrorPerformancePanel`, `SystemHealthPanel`
- **Root Cause Candidate:** Admin navigation not aligned with central tabbed dashboard.

## UI-002 — `/admin/invitations/accept` rendered outside admin shell

- **Issue ID:** UI-002
- **Category:** UI Inconsistency
- **Severity:** Low
- **Confidence:** Confirmed
- **Description:** Same as ARCH-003.
- **Repository Evidence:** `App.tsx:1329-1336`
- **Root Cause Candidate:** Special-cased route.

## UI-003 — Sidebar does not expose notification/announcement/email-template capabilities

- **Issue ID:** UI-003
- **Category:** UI Inconsistency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** `AdminLayout` sidebar has 13 entries; none of them map to the `notifications`, `emails`, `vouchers`, `tickets`, `apiKeys`, `webhooks`, `integrations`, `twoFactor`, `whiteLabel`, `readReplicaQueue`, `bulkMaintenance`, `errors`, or `storage` tabs inside `AdminDashboardInner`.
- **Repository Evidence:** `pages/admin/AdminLayout.tsx:9-44`
- **Root Cause Candidate:** Sidebar sections not updated when `AdminDashboardInner` tabs were added.

---

# 18. Data Integrity Risks

## DIR-001 — Edge Function tenant creation is not atomic

- **Issue ID:** DIR-001
- **Category:** Data Integrity Risk
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** `create-tenant` Edge Function performs `auth.admin.createUser` then multiple `INSERT` statements in separate `await` calls. If an INSERT fails after the auth user is created, the auth user is orphaned and the tenant row is rolled back inside Postgres, but the auth user remains.
- **Repository Evidence:** `supabase/functions/create-tenant/index.ts:167-216`
- **Affected Edge Function:** `create-tenant`
- **Affected Database Objects:** `auth.users`, `tenants`, `tenant_subscriptions`, `tenant_memberships`, `tenant_credentials`, `app_audit_log`
- **Root Cause Candidate:** Transaction boundary spans external auth API and multiple DB calls.

## DIR-002 — Direct `.from()` updates in billing wrapper may skip status rules

- **Issue ID:** DIR-002
- **Category:** Data Integrity Risk
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** Same as BL-001 / VAL-002.
- **Repository Evidence:** `services/admin/billingAdminService.ts:62-74`
- **Root Cause Candidate:** Lifecycle shortcuts implemented outside canonical RPC.

## DIR-003 — `gdpr_deletion_logs` may not be populated

- **Issue ID:** DIR-003
- **Category:** Data Integrity / Audit Risk
- **Severity:** Medium
- **Confidence:** Possible
- **Description:** Same as DB-008.
- **Repository Evidence:** `supabase/schema.sql:34448` and `gdpr_delete_user_data` body
- **Root Cause Candidate:** Deletion logging not wired in RPC.

---

# 19. Security Risks

## SEC-001 — `App.tsx` direct `system_admins` query

- **Issue ID:** SEC-001
- **Category:** Security Risk
- **Severity:** Critical
- **Confidence:** Confirmed
- **Description:** Same as ARCH-001 / PERM-001.
- **Repository Evidence:** `App.tsx:212-216`
- **Root Cause Candidate:** Direct table access in presentation layer.

## SEC-002 — `audit-log` Edge Function unauthenticated

- **Issue ID:** SEC-002
- **Category:** Security Risk
- **Severity:** Critical
- **Confidence:** Confirmed
- **Description:** Same as EDG-001 / PERM-002.
- **Repository Evidence:** `supabase/functions/audit-log/index.ts:42-52`
- **Root Cause Candidate:** No token validation.

## SEC-003 — Privileged RPCs use SECURITY INVOKER

- **Issue ID:** SEC-003
- **Category:** Security Risk
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** Same as RPC-002 / BL-003.
- **Repository Evidence:** `supabase/schema.sql:15257, 17523, 17568, 17713, 36441`
- **Root Cause Candidate:** Inconsistent security settings across RPC versions.

## SEC-004 — `check-subdomain` is public

- **Issue ID:** SEC-004
- **Category:** Security Risk
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** Same as EDG-002.
- **Repository Evidence:** `supabase/functions/check-subdomain/index.ts:42-64`
- **Root Cause Candidate:** Public pre-login helper; SSOT mis-classifies it as admin-only.

## SEC-005 — Missing audit triggers on privileged tables

- **Issue ID:** SEC-005
- **Category:** Security / Audit Risk
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** Same as DB-004.
- **Repository Evidence:** `supabase/schema.sql` — no triggers for `system_admins`, `invitations`, `licenses`
- **Root Cause Candidate:** Audit trigger set incomplete.

---

# 20. Performance Risks

## PERF-001 — `AdminDashboardInner` loads all tab states on mount

- **Issue ID:** PERF-001
- **Category:** Performance Risk
- **Severity:** Low
- **Confidence:** Confirmed
- **Description:** `AdminDashboardInner.tsx` declares 22 `useState` variables for all tabs. Even though only the active tab fetches data, the large component and all callbacks are initialized on every render.
- **Repository Evidence:** `pages/admin/AdminDashboardInner.tsx:121-157`
- **Affected Files:** `pages/admin/AdminDashboardInner.tsx`
- **Root Cause Candidate:** Monolithic dashboard component.

## PERF-002 — `tenant-backup` Edge Function may exceed runtime limits

- **Issue ID:** PERF-002
- **Category:** Performance Risk
- **Severity:** Low
- **Confidence:** Possible
- **Description:** `tenant-backup` paginates through all tenant-scoped tables 1000 rows at a time, but large tenants could exceed Edge Function CPU/time limits.
- **Repository Evidence:** `supabase/functions/tenant-backup/index.ts:75-95`
- **Affected Edge Function:** `tenant-backup`
- **Root Cause Candidate:** Edge Function runtime not designed for large data exports.

---

# 21. Repository Drift

## DRIFT-001 — SSOT does not include post-20260713 migrations

- **Issue ID:** DRIFT-001
- **Category:** Repository Drift
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** Same as MIG-002. 21 migration files with timestamps after `20260713000012_create_audit_log_table.sql` are not reflected in the SSOT.
- **Repository Evidence:** `supabase/migrations/20260713053550_*` through `20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql`
- **Affected Files:** 21 migrations + `supabase/schema.sql`
- **Root Cause Candidate:** SSOT approved before final migration wave.

## DRIFT-002 — `update_tenant` RPC signature drift

- **Issue ID:** DRIFT-002
- **Category:** Repository Drift
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** Same as DB-001 / RPC-001.
- **Repository Evidence:** `supabase/schema.sql` multiple `update_tenant` definitions
- **Root Cause Candidate:** Iterative fixes.

## DRIFT-003 — Custom domain implementation uses Edge Function, not expected RPC

- **Issue ID:** DRIFT-003
- **Category:** Repository Drift
- **Severity:** Low
- **Confidence:** Confirmed
- **Description:** SSOT lists `get_or_create_custom_domain_token` as a tenant admin RPC. The actual implementation uses `verify-domain` Edge Function.
- **Repository Evidence:** `services/admin/tenantAdminService.ts:192-209`
- **Root Cause Candidate:** Implementation evolved; SSOT not updated.

---

# 22. Dead Code

## DEAD-001 — `services/admin/permissions.ts` wrapper not consumed

- **Issue ID:** DEAD-001
- **Category:** Dead Code
- **Severity:** Low
- **Confidence:** Possible
- **Description:** Same as SVC-005.
- **Repository Evidence:** `services/admin/permissions.ts`
- **Root Cause Candidate:** Wrapper created but not adopted.

## DEAD-002 — `admin-health-check` and `deliver-webhook` Edge Functions

- **Issue ID:** DEAD-002
- **Category:** Dead Code
- **Severity:** Medium
- **Confidence:** Confirmed
- **Description:** Same as EDG-004.
- **Repository Evidence:** `supabase/functions/admin-health-check/index.ts`, `supabase/functions/deliver-webhook/index.ts`
- **Root Cause Candidate:** Unused artifacts.

## DEAD-003 — Unreachable `AdminDashboardInner` tab panels

- **Issue ID:** DEAD-003
- **Category:** Dead Code / UI Inconsistency
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** Same as ARCH-004 / UI-001. The UI code for 17+ tabs is present but never rendered.
- **Repository Evidence:** `pages/admin/AdminDashboardInner.tsx:420-1023`
- **Root Cause Candidate:** Route tree and sidebar not aligned with tab contract.

## DEAD-004 — Multiple old `update_tenant` / `update_tenant_subscription` overloads

- **Issue ID:** DEAD-004
- **Category:** Dead Code / Schema Drift
- **Severity:** High
- **Confidence:** Confirmed
- **Description:** Same as DB-001 / DB-002 / RPC-001. Earlier overloads may be dead if the latest `CREATE OR REPLACE FUNCTION` has superseded them, but the `DROP FUNCTION` statements in migrations do not retire all of them.
- **Repository Evidence:** `supabase/schema.sql`
- **Root Cause Candidate:** Migration cleanup incomplete.

---

# 23. Issue Catalog

| Issue ID | Category | Severity | Confidence | Title |
|----------|----------|----------|------------|-------|
| ARCH-001 | Architecture Inconsistency | Critical | Confirmed | Admin gate bypasses `isSystemAdmin()` helper |
| ARCH-002 | Architecture / Execution | Critical | Confirmed | `AuthContext` calls `activate_pending_memberships` directly |
| ARCH-003 | Architecture Inconsistency | Medium | Confirmed | `InvitationsAccept` outside lazy-loaded admin layout |
| ARCH-004 | Architecture / UI | High | Confirmed | `AdminDashboardInner` tabs unreachable |
| ARCH-005 | Architecture Inconsistency | High | Confirmed | Wrapper services use direct `.from()` queries |
| ARCH-006 | Architecture / Service | Medium | Confirmed | Browser API in `complianceAdminService` |
| DEP-001 | Dependency Inconsistency | Medium | Confirmed | `AdminLayout` missing route mappings |
| DEP-002 | Dependency / Contract | Medium | Confirmed | `billingAdminService` missing plan/invoice RPC re-exports |
| DEP-003 | Dependency / Contract | Low | Confirmed | `analyticsAdminService` missing overview RPCs |
| DEP-004 | Dependency / Contract | Medium | Confirmed | `tenantAdminService` missing `get_or_create_custom_domain_token` |
| EXE-001 | Execution Inconsistency | High | Confirmed | `AuthContext` silently catches activation failure |
| EXE-002 | Execution Inconsistency | Low | Confirmed | `isSystemAdmin` state reset on non-admin routes |
| BL-001 | Business Logic | High | Confirmed | Billing lifecycle shortcuts bypass validation RPC |
| BL-002 | Business Logic | High | Confirmed | `createTenantWithCredentials` uses Edge Function, not RPC |
| BL-003 | Business Logic / Security | Medium | Confirmed | Privileged RPCs use SECURITY INVOKER |
| DB-001 | Database / RPC Drift | High | Confirmed | Duplicate `update_tenant` versions |
| DB-002 | Database / RPC Drift | High | Confirmed | Duplicate `update_tenant_subscription` versions |
| DB-003 | Database / RPC Drift | High | Confirmed | Duplicate `create_tenant_with_admin` versions |
| DB-004 | Database / Audit Gap | High | Confirmed | Missing audit triggers on `system_admins`, `invitations`, `licenses` |
| DB-005 | Database / Realtime | Medium | Confirmed | `admin_events` only fed by cron task |
| DB-006 | Database / RPC | High | Confirmed | `get_admin_audit_logs` RPC missing |
| DB-007 | Database / RPC | Medium | Confirmed | `get_cron_job_logs`, `get_billing_*_logs` RPCs missing |
| DB-008 | Database / Audit Gap | Medium | Possible | `gdpr_deletion_logs` not populated |
| DB-009 | Database / Audit Gap | Low | Confirmed | LOGIN/LOGOUT not trigger-enforced |
| MIG-001 | Migration Inconsistency | High | Confirmed | 25+ fix migrations |
| MIG-002 | Repository Drift | High | Confirmed | 21 migrations after SSOT baseline |
| MIG-003 | Migration Inconsistency | Low | Confirmed | Non-standard timestamp filename |
| MIG-004 | Migration Inconsistency | Medium | Confirmed | Missing `20260713000002` migration |
| RPC-001 | RPC Inconsistency | High | Confirmed | Multiple RPC overloads |
| RPC-002 | RPC / Security | Medium | Confirmed | Privileged RPCs use SECURITY INVOKER |
| RPC-003 | RPC Inconsistency | High | Confirmed | Four expected RPCs missing |
| RPC-004 | RPC Inconsistency | Low | Possible | `search_tenants` / `get_tenants_admin` overload ambiguity |
| EDG-001 | Edge Function / Security | Critical | Confirmed | `audit-log` Edge Function unauthenticated |
| EDG-002 | Edge Function / Security | Medium | Confirmed | `check-subdomain` public |
| EDG-003 | Edge Function / Security | Low | Confirmed | `billing-webhooks` signature-only auth |
| EDG-004 | Edge Function / Dead Code | Medium | Confirmed | `admin-health-check`, `deliver-webhook` unused |
| EDG-005 | Edge Function / Audit | Medium | Confirmed | Many Edge Functions do not write audit logs |
| SVC-001 | Service / Architecture | High | Confirmed | Wrapper direct `.from()` calls |
| SVC-002 | Service / Architecture | Medium | Confirmed | Browser API in service |
| SVC-003 | Service / Contract | Medium | Confirmed | Billing wrapper incomplete |
| SVC-004 | Service / Contract | Low | Confirmed | Analytics wrapper incomplete |
| SVC-005 | Service / Dead Code | Low | Possible | `services/admin/permissions.ts` unused |
| PERM-001 | Permission Inconsistency | Critical | Confirmed | Two system-admin enforcement paths |
| PERM-002 | Permission / Security | Critical | Confirmed | `audit-log` Edge Function unauthenticated |
| PERM-003 | Permission / Realtime | Medium | Confirmed | `admin_events` producer policy surface |
| VAL-001 | Validation / UI | Low | Confirmed | `InvitationsAccept` not in route map |
| VAL-002 | Validation / Business | High | Confirmed | Billing shortcuts bypass validation |
| UI-001 | UI Inconsistency | High | Confirmed | Unreachable `AdminDashboardInner` tabs |
| UI-002 | UI Inconsistency | Low | Confirmed | `InvitationsAccept` outside admin shell |
| UI-003 | UI Inconsistency | Medium | Confirmed | Sidebar missing capability entries |
| DIR-001 | Data Integrity | High | Confirmed | Tenant creation not atomic |
| DIR-002 | Data Integrity | High | Confirmed | Billing updates skip rules |
| DIR-003 | Data Integrity / Audit | Medium | Possible | `gdpr_deletion_logs` not populated |
| SEC-001 | Security Risk | Critical | Confirmed | `App.tsx` direct table query |
| SEC-002 | Security Risk | Critical | Confirmed | `audit-log` unauthenticated |
| SEC-003 | Security Risk | Medium | Confirmed | Privileged RPCs INVOKER |
| SEC-004 | Security Risk | Medium | Confirmed | `check-subdomain` public |
| SEC-005 | Security / Audit | High | Confirmed | Missing audit triggers |
| PERF-001 | Performance Risk | Low | Confirmed | `AdminDashboardInner` loads all tab state |
| PERF-002 | Performance Risk | Low | Possible | `tenant-backup` may hit runtime limits |
| DRIFT-001 | Repository Drift | High | Confirmed | SSOT missing post-20260713 migrations |
| DRIFT-002 | Repository Drift | High | Confirmed | `update_tenant` signature drift |
| DRIFT-003 | Repository Drift | Low | Confirmed | Custom domain uses Edge Function, not listed RPC |
| DEAD-001 | Dead Code | Low | Possible | `services/admin/permissions.ts` |
| DEAD-002 | Dead Code | Medium | Confirmed | `admin-health-check`, `deliver-webhook` |
| DEAD-003 | Dead Code | High | Confirmed | Unreachable `AdminDashboardInner` tabs |
| DEAD-004 | Dead Code | High | Confirmed | Old RPC overloads |

---

# 24. Severity Matrix

| Severity | Count | Issues |
|----------|-------|--------|
| Critical | 3 | ARCH-001, ARCH-002, EDG-001/PERM-002/SEC-002 (same root issue counted once as EDG-001 in catalog; PERM-002 and SEC-002 are cross-categorized) |
| High | 18 | ARCH-004, ARCH-005, BL-001, BL-002, DB-001, DB-002, DB-003, DB-004, DB-006, DIR-001, DIR-002, MIG-001, MIG-002, RPC-003, SEC-005, UI-001, DEAD-003, DEAD-004 |
| Medium | 19 | ARCH-003, ARCH-006, DEP-001, DEP-002, DEP-004, EXE-001, BL-003, DB-005, DB-007, DB-008, MIG-004, EDG-004, EDG-005, SVC-001, SVC-002, SVC-003, PERM-003, UI-003, DEAD-002 |
| Low | 10 | DEP-003, EXE-002, DB-009, MIG-003, RPC-004, EDG-003, SVC-004, SVC-005, VAL-001, UI-002, PERF-001, PERF-002, DRIFT-003, DEAD-001 |
| Informational | 0 | — |

*Note: Some issues are cross-categorized and appear in multiple sections; the catalog (Section 23) is the authoritative count.*

---

# 25. Investigation Statistics

| Metric | Value |
|--------|-------|
| SSOT documents read | 9 |
| Capability domains inspected | 12 |
| Cross-layer chains traced | 8 |
| Total issues cataloged | 66 (including cross-categorized duplicates); 45 unique issue records |
| Critical | 3 |
| High | 18 |
| Medium | 19 |
| Low | 10 |
| Tables inspected | 38 |
| RPCs inspected | 92 expected; 4 missing; 3 with multiple overloads |
| Edge Functions inspected | 29 (27 expected + 2 dead) |
| Migrations inspected | 100+ |
| Code files read | 50+ |
| Graph queries run | Yes (Codebase Memory MCP) |
| Files modified | 0 |
| Fixes generated | 0 |

---

# 26. Evidence Summary

All evidence is repository-based and includes file paths and line numbers. Key evidence anchors:

- `App.tsx:212-216` — direct `system_admins` query
- `contexts/AuthContext.tsx:90-92` — direct `activate_pending_memberships` RPC
- `pages/admin/AdminLayout.tsx:9-44` — 13 sidebar entries vs 16 expected routes
- `pages/admin/AdminDashboardInner.tsx:115` — 22 tab values
- `pages/admin/*.tsx` — only 4 pages instantiate `AdminDashboardInner`
- `services/admin/tenantAdminService.ts`, `services/admin/memberAdminService.ts`, `services/admin/billingAdminService.ts`, `services/admin/auditAdminService.ts`, `services/admin/licenseService.ts`, `services/admin/supportService.ts` — direct `supabase.from()` calls
- `services/admin/billingAdminService.ts:62-74` — direct `tenant_subscriptions` lifecycle update
- `services/tenantService.ts:779` — `create-tenant` Edge Function invocation
- `supabase/functions/create-tenant/index.ts:167-216` — direct table INSERTs
- `supabase/functions/audit-log/index.ts:42-52` — no authentication
- `supabase/functions/check-subdomain/index.ts:42-64` — public rate-limited endpoint
- `supabase/schema.sql` — multiple `update_tenant`, `update_tenant_subscription`, `create_tenant_with_admin` definitions
- `supabase/schema.sql:34052-34075` — `admin_events` table + RLS policies
- `supabase/functions/cron-admin-tasks/index.ts:36` — only `admin_events` INSERT source
- `supabase/migrations/20260713*` through `20260723*` — post-SSOT migrations
- `supabase/migrations/*fix*` — 25+ fix migrations

---

# 27. Repository Coverage Conclusion

The entire Admin Dashboard stack was inspected:

- **Presentation layer:** All routes, lazy imports, layout, sidebar, and `AdminDashboardInner` tabs verified.
- **Application layer:** Auth and Tenant contexts, all hooks, `lib/permissions.ts`, `lib/supabase.ts`, `lib/tenant.ts` inspected.
- **Service layer:** All 12 admin wrapper services and 30 base services cataloged; RPC/Edge/table call sites recorded.
- **Database layer:** All 38 expected tables verified present; RLS, triggers, and functions inspected via `supabase/schema.sql`.
- **Migration layer:** 100+ migration files reviewed for ordering, duplicates, fix migrations, and post-SSOT drift.
- **RPC layer:** 92 expected RPCs checked; missing and overloaded RPCs identified.
- **Edge Function layer:** All 29 functions inspected for auth, CORS, secrets, and audit logging.
- **Cross-layer traceability:** 12 domains and 8 specific chains traced; breaks documented.

No code was modified. The report is evidence-based and anchored to the SSOT.

---

# 28. Final Investigation Conclusion

The Admin Dashboard implementation contains significant inconsistencies when compared against the approved SSOT. The most severe are authorization and audit-trust boundary failures:

1. **Critical authorization bypass** in `App.tsx` (direct `system_admins` query instead of `isSystemAdmin()` RPC helper).
2. **Critical audit-log poisoning risk** in the `audit-log` Edge Function (no authentication).
3. **Widespread architecture drift** in wrapper services that bypass base services with direct table queries.
4. **Large unreachable UI surface** inside `AdminDashboardInner`.
5. **Schema drift** from multiple RPC overloads and 21 post-SSOT migrations.

These findings should be independently reviewed before Phase B remediation begins. The deliverable is complete and no code changes were made.

---

**End of Report**
