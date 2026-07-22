# Admin Dashboard Architecture Model

## 1. Purpose & Scope

The Admin Dashboard is a system-level administration surface for VietSale Pro. It is intended for **system administrators** only and provides tools for managing tenants ("cửa hàng"), members, billing, security, audit logs, compliance, analytics, and platform health. It is architecturally separate from the per-tenant operational app and is gated at the route, context, and data layers.

Key entry conditions:
- Host is the `admin` subdomain (`admin.vietsalepro.com`) **or** the path starts with `/admin/*`.
- User is authenticated via Supabase Auth.
- User is present in the `public.system_admins` table.

All paths in this document are relative to the repository root (`C:\PROJECT\vietsalepro\`).

---

## Part I — Architecture Knowledge (why, how, and who)

### I.1 Architecture Summary

The Admin Dashboard is not a separate application; it is a privileged view inside the same Vite + React single-page application that powers the tenant-facing VietSale Pro. It is activated when the browser host resolves to `admin.vietsalepro.com` or the path begins with `/admin`. At that point `App.tsx` gates access by requiring an authenticated Supabase user who is also listed in `public.system_admins`. Once admitted, the dashboard renders through `AdminLayout` → `AdminShell` → page `Outlet`, while data is fetched through a thin `services/admin/*` wrapper layer that delegates to base `services/*` modules and, ultimately, to Supabase RPCs, Edge Functions, and Postgres. All real security is enforced on the backend: `SECURITY DEFINER` RPCs check `is_system_admin()`, Edge Functions use a `service_role` client but validate the caller, and RLS policies guard direct table access. The architecture is therefore intentionally layered: React only handles presentation and local UI state, contexts hold authenticated session and tenant resolution, services encapsulate every backend interaction, and Supabase owns persistence, auth, authorization, and realtime delivery.

### I.2 Architectural Layers

| Layer | Responsibility | Boundary | Interactions |
|---|---|---|---|
| **Presentation** | Render the admin UI: pages, panels, shell, sidebar, charts, forms. | May consume contexts (`useAuth`, `useTenant`) and service modules; must never call `supabase` directly or mutate backend state except through services. | `AdminShell` → `AdminSidebar`/`AdminDashboardHeader` → `Outlet` → page components → service calls. |
| **Application / Context** | Manage cross-cutting runtime state: auth session, tenant resolution, routing mode, MFA pending, global UI state. | May read from `lib/supabase.ts` and call small utility services (audit, login history); must not bypass the Service Layer for business operations. | `AuthProvider`/`TenantProvider` wrap `App.tsx`; `App.tsx` reads `user`, `tenant`, `isSystemAdmin` to choose the route tree. |
| **Service Layer — Admin wrappers** | Centralize admin call sites; re-export and adapt base services under `services/admin/*`. | May import `lib/supabase` and base `services/*`; must not import UI components or router state. | Called by admin pages/components; delegates to base services or Edge Functions. |
| **Service Layer — Base services** | Implement the actual Supabase interactions (RPCs, direct `from()` queries, Edge Function invocations) for a domain. | May import `lib/supabase.ts`, types, and utility mappers; must not import React. | Called by admin wrappers and, in some cases, operational-app components. |
| **Infrastructure** | `lib/supabase.ts` creates the typed Supabase client and `tenantFetch` injects `x-tenant-id` from a global `currentTenantId`. | Owns the only Supabase client instance used by the React app. | All service calls go through this client; `TenantContext` sets/clears `currentTenantId`. |
| **Supabase Platform** | Auth, PostgREST, Realtime, Storage, and Edge Functions. | Enforces `SECURITY DEFINER` checks, RLS, and service-role isolation. | Receives HTTP calls from the SPA; emits realtime events on `admin_events`. |
| **Data Layer** | Postgres tables, RPCs, triggers, and migrations in `supabase/migrations` and `supabase/schema.sql`. | Source of truth for all business state; no client write without an RPC/RLS/Edge Function gate. | Accessed via PostgREST or Edge Functions; `app_audit_log`, `admin_login_history`, `system_admins`, `tenants`, `tenant_memberships`, etc. |

### I.3 Module Responsibilities

The following modules are the primary architectural actors in the admin surface. Each table cell captures *why* the module exists, not only *what* file it is.

#### I.3.1 Frontend / Application modules

| Module | Primary responsibility | Secondary responsibility | Public interface | Dependencies | Consumers |
|---|---|---|---|---|---|
| `App.tsx` | Bootstrap the SPA and decide whether to render the admin route tree, the tenant app, or public landing. | Lazily load admin chunks; run the `isSystemAdmin` check; hold shared operational state. | `AdminSuspense`, top-level `<Routes>`, global data effects. | `AuthContext`, `TenantContext`, `lib/supabase`, `lib/tenant`, `lib/permissions`, admin page chunks. | Browser. |
| `AdminLayout.tsx` | Map the current route to the admin sidebar model and render `AdminShell` with the correct title/navigation. | Translate sidebar item clicks to `react-router` navigation; compute `activeId`. | `default` component; `SIDEBAR_SECTIONS`, `ADMIN_ROUTE_MAP`, `PAGE_TITLES` constants. | `AdminShell`, `react-router-dom`. | `App.tsx` route tree. |
| `components/AdminShell.tsx` | Compose the visual frame (skip-link, hamburger, sidebar, header, breadcrumbs, main content, footer). | Provide consistent responsive behavior and accessibility landmarks. | `AdminShell` props: `sidebarSections`, `activeSidebarItem`, `onSidebarNavigate`, `pageTitle`, `children`, etc. | `AdminSidebar`, `AdminDashboardHeader`, `AdminSettingsNav`. | `AdminLayout.tsx`. |
| `components/AdminSidebar.tsx` | Render collapsible/expandable navigation and mobile drawer. | Track collapse/expand state and media-query mobile detection. | `SidebarSection` / `SidebarItem` types; props `activeItem`, `onNavigate`. | None (pure React/CSS). | `AdminShell.tsx`. |
| `components/admin/AdminDashboardHeader.tsx` | Display page title and the global admin control cluster. | Mount `AdminNotificationBell`, `AccountSelector`, `UserAccountButton`. | `AdminDashboardHeaderProps`: `title`, `description`, `currentAccountName`. | `AccountSelector`, `UserAccountButton`, `AdminNotificationBell`. | `AdminShell.tsx`. |
| `contexts/AuthContext.tsx` | Hold Supabase `session`/`user` and `mfaPending`; keep the same `user` reference across token refreshes. | Record `LOGIN`/`LOGOUT` audit entries; activate pending memberships on sign-in. | `AuthProvider`, `useAuth()`, `signOut`. | `lib/supabase`, `services/auditService`, `services/loginHistoryService`, `services/twoFactorService`. | `App.tsx`, every `useAuth` consumer. |
| `contexts/TenantContext.tsx` | Resolve the current tenant from subdomain; clear tenant when host is `admin`. | Expose `membership`, `role`, `isImpersonating`, `isReadOnly`. | `TenantProvider`, `useTenant()`. | `lib/supabase.setCurrentTenantId`, `lib/tenant.getSubdomain`, RPC `get_tenant_by_subdomain`. | `App.tsx`, pages and components. |
| `lib/permissions.ts` | Provide synchronous and asynchronous helpers for role/permission checks. | UX-only gating; *not* the security boundary. | `isSystemAdmin`, `hasTenantRole`, `isTenantOwner`, `isTenantAdmin`, `canUseFeature`, `ROLES`, `ROLE_PERMISSIONS`. | `lib/supabase`, `types/tenant`. | `App.tsx`, pages, components. |
| `lib/tenant.ts` | Parse subdomain/custom-domain from `window.location`; build tenant/admin URLs. | `getTenantId` for one-off ID lookups. | `getSubdomain`, `isCustomDomain`, `getTenantId`, `getTenantUrl`, `getAdminUrl`. | `lib/supabase`, `get_tenant_by_subdomain` RPC. | `TenantContext`, `App.tsx`, `AccountSelector`. |
| `lib/supabase.ts` | Create the typed Supabase client and inject `x-tenant-id` on every request. | Expose `setCurrentTenantId` / `getCurrentTenantId` / `requireTenantId`. | `supabase`, `tenantFetch`, `setCurrentTenantId`. | `@supabase/supabase-js`, env keys. | All service modules and contexts. |

#### I.3.2 Service / Backend-facing modules

| Module | Primary responsibility | Secondary responsibility | Public interface | Dependencies | Consumers |
|---|---|---|---|---|---|
| `services/admin/tenantAdminService.ts` | Centralize tenant CRUD, search, subdomain, and custom-domain operations for admin pages. | Re-export base tenant helpers used elsewhere. | `listAccounts`, `getAccount`, `createAccount`, `checkSubdomainAvailability`, `setTenantSubdomain`, `request/verifyCustomDomain`, plus re-exports. | `services/tenantService.ts`, `lib/supabase`, `utils/subdomain`, `supabase/functions/_shared/domain-verification`, Edge Functions `check-subdomain`/`verify-domain`. | `pages/admin/Tenants.tsx`, `TenantDetail.tsx`, `Onboarding.tsx`, `CustomDomainPanel.tsx`, etc. |
| `services/admin/systemAdminService.ts` | Aggregate system-level operations: rate limits, system admins, security settings, impersonation, health/overview. | Re-export base service functions for health, backup, restore, migration, operations. | Re-exports from `services/systemAdminService`, `operationsService`, `tenantBackup/Restore/MigrationService`, `tenantService`. | Base services and `lib/supabase`. | `AdminDashboardInner`, `SystemHealthPanel`, `BulkMaintenancePanel`, security/health pages. |
| `services/admin/billingAdminService.ts` | Admin billing surface: subscriptions, lifecycle, and company/bank configuration. | Wrap `bankAccountService` and subscription update helpers. | `getTenantSubscription`, `updateTenantSubscription`, `updateSubscriptionLifecycle`, `upgradeDowngradeSubscription`, `cancelSubscription`, `renewSubscription`, plus bank/company re-exports. | `services/tenantService`, `services/bankAccountService`, `lib/supabase`, `types/tenant`. | `pages/admin/Billing.tsx`, billing panels. |
| `services/admin/analyticsAdminService.ts` | Fetch and normalize revenue/churn/cohort analytics for admin views. | Split combined RPC results into per-metric helpers. | `getAdminRevenueMetrics`, `getAdminChurnCohortMetrics`, `getAdminChurnMetrics`, `getAdminCohortMetrics`. | `lib/supabase`, `types/billing`, `get_revenue_metrics`/`get_churn_cohort_metrics` RPCs. | `pages/admin/Analytics.tsx`, `RevenueMetrics`, `ChurnCohortMetrics`. |
| `services/admin/complianceAdminService.ts` | GDPR request/export/deletion flows. | — | GDPR request helpers (detailed below in §7 Service Layer). | `lib/supabase`, GDPR RPCs. | `Compliance` page, `ComplianceManager`. |
| `services/admin/auditAdminService.ts` | Admin audit log queries and export. | Re-export login history helpers. | `getAdminAuditLogs`, `exportAuditLogs` plus login history re-exports. | `services/auditService`, `services/loginHistoryService`. | `pages/admin/Audit.tsx`, `AuditExportPanel`. |
| `services/admin/memberAdminService.ts` | Member invitation/lookup/accept flows for the admin surface. | Wrap `tenantService` member helpers. | Invitation/accept functions (detailed below). | `services/tenantService`. | `InvitationsAccept.tsx`, member management panels. |
| `services/admin/licenseService.ts` | Generate, validate, list, and revoke tenant licenses. | — | `generateLicense`, `validateLicense`, etc. | `lib/supabase`, `generate_tenant_license`/`validate_tenant_license` RPCs. | `LicenseManagerPanel`. |
| `services/admin/supportService.ts` | Support ticket/reply/template CRUD. | — | Ticket/reply/template functions (detailed below). | `lib/supabase`, `send-ticket-email` Edge Function. | `TicketInbox`. |
| `services/admin/smsService.ts` | SMS sending wrappers for admin alerts. | — | SMS send functions. | `lib/supabase`, `send-sms` Edge Function. | Notification/compliance flows. |
| `services/admin/billingProviderRegistry.ts` | Map billing provider name to a typed implementation. | `listBillingProviders`, `isBillingProviderName`. | `getBillingProvider(name)`, `listBillingProviders`, `isBillingProviderName`. | `providers/stripe`, `momo`, `vnpay`, `bankTransfer`. | `billingAdminService`, billing panels. |
| `services/tenantService.ts` | Core tenant, member, subscription, impersonation, analytics, and overview operations. | Provide mappers from DB row to typed domain objects. | `searchTenants`, `createTenantWithAdmin`, `getTenantBySubdomain`, `updateTenant`, etc. | `lib/supabase`, many RPCs, `supabase/functions/create-tenant`, `supabase/functions/invite-member`, etc. | `tenantAdminService` wrapper and operational app. |
| `services/systemAdminService.ts` | Rate-limit logs, system admins, security settings, login attempts/locked emails. | Provide data for overview/health. | `getRateLimitLogs`, `getSystemAdmins`, `add/removeSystemAdmin`, `createSystemAdmin`, security settings. | `lib/supabase`, system admin RPCs, `create-system-admin` Edge Function. | `systemAdminService.ts` admin re-export. |
| `services/auditService.ts` | Write and read `app_audit_log`; guard against missing fields. | Manual `LOGIN`/`LOGOUT`/`EXPORT` audit entries. | `writeAuditLog`, `getAuditLogs`. | `lib/supabase`, `supabase/functions/audit-log` Edge Function. | `AuthContext`, `Audit` page. |
| `services/loginHistoryService.ts` | Record and query admin login history. | Login alert helpers. | `recordAdminLogin`, `getAdminLoginHistory`, `getAdminLoginAlerts`. | `lib/supabase`, admin login RPCs. | `AuthContext`, `AdminDashboardInner` login history panel. |
| `services/twoFactorService.ts` | TOTP enrollment, backup codes, MFA required check, admin override. | — | `isMfaRequired`, `enrollTOTP`, etc. | `lib/supabase`, `admin-2fa-override` Edge Function. | `AuthContext`, `TwoFactorManager`, `MfaChallenge`. |
| `services/bankAccountService.ts` | Bank account and `system_settings` (`company_info`) CRUD. | — | `getBankAccounts`, `create/update/deleteBankAccount`, `getCompanyInfo`, `setCompanyInfo`. | `lib/supabase`, `bank_accounts` / `system_settings` tables. | `billingAdminService`, `Billing` page. |
| `services/operationsService.ts` | Data retention, default plan limits, maintenance mode. | — | `get/setDefaultPlanLimits`, `get/setMaintenanceMode`, `getDataRetentionStatus`. | `lib/supabase`, operations RPCs. | `systemAdminService` admin re-export. |
| `services/tenantBackupService.ts` | Invoke the `tenant-backup` Edge Function and download JSON. | — | `downloadTenantBackup`. | `lib/supabase`, `tenant-backup` Edge Function. | `StorageBackupPanel`, admin wrapper. |
| `services/tenantRestoreService.ts` | Validate JSON backup and invoke `tenant-restore` Edge Function. | — | `validateBackup`, `previewBackupTables`, `restoreTenantBackup`. | `lib/supabase`, `tenant-restore` Edge Function. | admin wrapper. |
| `services/tenantMigrationService.ts` | Reset demo data and migrate tenant data. | — | `resetDemoData`, `migrateTenantData`. | `lib/supabase`, migration RPCs. | admin wrapper. |

### I.4 Architectural Boundaries

- **Presentation Layer** may read from `AuthContext`/`TenantContext` and call `services/admin/*` or `services/*`. It must never import `lib/supabase.ts` directly, call `supabase.rpc`, or invoke Edge Functions. It must not rely on its own checks for security.
- **Application / Context Layer** may use `lib/supabase.ts` only for auth session and tenant resolution. `AuthContext` is allowed to write audit/login-history records because those are infrastructure-side effects of auth state changes, not business operations. `TenantContext` is allowed to call `get_tenant_by_subdomain` RPC because tenant resolution is its core duty.
- **Service Layer** is the only layer that may call `supabase.rpc`, `supabase.from`, or `supabase.functions.invoke`. It may not hold React state or import UI components. It owns all backend contract mapping and normalization.
- **Infrastructure (`lib/supabase.ts`)** owns the Supabase client and the `x-tenant-id` fetch wrapper. No module except the service layer and contexts should import it for new features.
- **Supabase / Data Layer** owns business rules and security. Any direct table access from the client is governed by RLS; privileged operations run through `SECURITY DEFINER` RPCs or `service_role` Edge Functions that internally re-verify the caller.

### I.5 Dependency Direction

The dependency graph is strictly downward:

```
Presentation / Pages
   ↓
Application Context (Auth, Tenant)
   ↓
Service Layer — Admin wrappers
   ↓
Service Layer — Base services
   ↓
Infrastructure (lib/supabase.ts)
   ↓
Supabase Platform (Auth, PostgREST, Functions, Realtime)
   ↓
Postgres Data Layer
```

Selected concrete dependencies:

| Consumer | Depends on | Type | Notes |
|---|---|---|---|
| `App.tsx` | `AuthContext`, `TenantContext`, `lib/tenant`, `lib/permissions`, `lib/supabase` | Direct | Reads `user`/`tenant` to choose route tree; `isSystemAdmin` check uses `system_admins` table. |
| `AdminLayout.tsx` | `AdminShell` | Direct | Only routing/layout dependency. |
| `AdminShell.tsx` | `AdminSidebar`, `AdminDashboardHeader` | Direct | Composes the three visual regions. |
| `AdminDashboardHeader.tsx` | `AccountSelector`, `UserAccountButton`, `AdminNotificationBell` | Direct | Mounts realtime/notification controls. |
| `pages/admin/*.tsx` | `services/admin/*` wrappers | Direct | All data loading goes through the wrapper services. |
| `services/admin/tenantAdminService.ts` | `services/tenantService.ts`, `lib/supabase`, `utils/subdomain`, `verify-domain`/`check-subdomain` Edge Functions | Direct/Indirect | The wrapper is a thin delegation layer. |
| `services/admin/systemAdminService.ts` | `services/systemAdminService`, `operationsService`, `tenantBackup/Restore/MigrationService`, `tenantService` | Direct | Re-export/aggregation only; no own RPC calls. |
| `services/admin/billingAdminService.ts` | `services/tenantService`, `services/bankAccountService`, `lib/supabase` | Direct | Owns subscription lifecycle mutations. |
| `services/admin/analyticsAdminService.ts` | `lib/supabase`, analytics RPCs | Direct | Pure RPC normalization. |
| `AuthContext` | `lib/supabase`, `services/auditService`, `services/loginHistoryService`, `services/twoFactorService` | Direct | Auth side effects are allowed. |
| `TenantContext` | `lib/supabase.setCurrentTenantId`, `lib/tenant.getSubdomain`, `get_tenant_by_subdomain` RPC | Direct | Sets global tenant id consumed by `lib/supabase`. |
| `services/*` base | `lib/supabase` | Direct | All base services use the global `supabase` client. |
| `lib/permissions.ts` | `lib/supabase` | Direct | Calls permission RPCs; UX gating only. |

There are no upward dependencies: `services/*` does not import `components/*`; `lib/supabase.ts` does not import `services/*`; the Supabase backend does not depend on the SPA.

### I.6 Architectural Contracts

- **Routing contract:** `App.tsx` decides between admin, public, and tenant modes by `getSubdomain() === 'admin'` or `location.pathname.startsWith('/admin')`. It then checks `system_admins` before mounting the admin route tree.
- **Authentication contract:** `AuthContext` is the single source for `session`/`user`/`mfaPending`/`signOut`. All components consume it through `useAuth()`.
- **Tenant contract:** `TenantContext` resolves the tenant from the host and calls `setCurrentTenantId(...)`. In admin mode it sets `null`, which tells `tenantFetch` not to send `x-tenant-id`.
- **Service contract:** UI components and pages call `services/admin/*` or `services/*`; those service modules call `supabase.rpc(...)`, `supabase.from(...).select/insert/update/delete`, or `supabase.functions.invoke(...)`. No UI code calls `supabase` directly.
- **RPC contract:** Privileged reads/writes are implemented as named Supabase RPCs marked `SECURITY DEFINER` and guarded internally with `is_system_admin()` or `has_tenant_role(...)`.
- **Edge Function contract:** Operations requiring `service_role`, external APIs (DNS, email, SMS), or multi-step provisioning run through `supabase.functions.invoke('...')`. Each function verifies the caller before using the privileged client.
- **Audit contract:** `AuthContext` writes `LOGIN`/`LOGOUT` to `app_audit_log` and `admin_login_history` on auth transitions. Business actions write audit records through `auditService`/`writeAuditLog`.
- **Realtime contract:** `useAdminRealtime` subscribes to channel `admin-events` on `postgres_changes` `INSERT` for `public.admin_events`; it caps the event list and exposes `events`, `unreadCount`, `markAsRead`, `clearAll`.

### I.7 Ownership Model

| Concern | Owner module(s) | Enforced by | Notes |
|---|---|---|---|
| **Authentication** | Supabase Auth + `AuthContext` | Supabase Auth + `system_admins` membership | `AuthContext` is the SPA owner of session state. |
| **Authorization (system admin)** | `lib/permissions.ts` (UX) + `is_system_admin` RPC / RLS (backend) | `SECURITY DEFINER` RPCs and Edge Functions | Client helpers fail closed on errors. |
| **Tenant resolution** | `TenantContext` + `lib/tenant.ts` + `get_tenant_by_subdomain` RPC | Subdomain parsing and `tenant_memberships` RLS | Admin mode deliberately clears the tenant. |
| **Billing** | `billingAdminService`, `bankAccountService`, `billingProviderRegistry`, `tenant_subscriptions` table | RPCs and direct table updates | Provider registry isolates Stripe / Momo / VNPay / bank transfer. |
| **Analytics** | `analyticsAdminService` + `get_revenue_metrics` / `get_churn_cohort_metrics` RPCs | RPC `SECURITY DEFINER` | UI only normalizes returned data. |
| **Audit** | `auditService` (write/read `app_audit_log`) + `loginHistoryService` (admin login history) | Edge Function `audit-log` / RLS | `AuthContext` triggers writes. |
| **Compliance** | `complianceAdminService` + GDPR RPCs | `SECURITY DEFINER` | Export/delete via dedicated RPCs. |
| **Monitoring / Health** | `systemAdminService` + `admin-health-check` / `system-health` Edge Functions | `service_role` + system admin check | `SystemHealthPanel` and health page consume this. |
| **Notifications** | `useAdminRealtime` + `AdminNotificationBell` + `admin_events` table | Supabase Realtime | Filterable by event type. |
| **Storage** | Supabase Storage + `StorageBackupPanel` / `WhiteLabelManager` | Storage RLS / signed URLs | Backups through `tenant-backup` / `system-backup`. |
| **Integrations** | `billingProviderRegistry` + `IntegrationMarketplace` + dedicated Edge Functions | Provider interface contract | New billing providers plug in through the registry. |
| **Security** | `twoFactorService`, `lib/permissions.ts`, security RPCs, `SecuritySettingsPanel` | `SECURITY DEFINER` + RLS | MFA enrollment, IP allowlist, session timeout, locked emails. |
| **State** | `AuthContext` (auth), `TenantContext` (tenant/membership), local component state (UI) | React lifecycle | Server is source of truth; contexts are local projections. |
| **Routing** | `react-router-dom` + `App.tsx` + `AdminLayout` | Browser URL and route guards | Admin routes are lazily loaded. |
| **Configuration** | `system_settings` / `tenants.settings` + `bankAccountService` / `tenantService` | RLS / RPCs | `company_info` and per-tenant settings live in Postgres. |

### I.8 Lifecycle Model

The following lifecycles have been confirmed by repository evidence:

1. **Application startup**
   - Vite bundle loads; `AuthProvider` initializes `supabase.auth.getSession()`, sets `user`/`session`, triggers `checkMfaAsync`.
   - `TenantProvider` starts `loadTenant` whenever `user` changes; for `admin` subdomain it immediately sets `currentTenantId(null)` and `membership(null)`.
   - `App.tsx` lazily imports admin route components; it does not load them for non-admin hosts.

2. **Admin login**
   - Browser navigates to `admin.vietsalepro.com` or `/admin/*`.
   - `App.tsx` `useEffect` detects `subdomain === 'admin'` or `isAdminPath`, then queries `public.system_admins` for `user.id`.
   - On success `isSystemAdmin` becomes `true`; on failure `TenantForbiddenPage` or `Login` is shown.
   - `AuthContext` `onAuthStateChange('SIGNED_IN')` writes `LOGIN` audit log, records admin login history, and calls `activate_pending_memberships`.

3. **Permission resolution**
   - Components call helpers such as `isSystemAdmin()` or `hasTenantRole(...)`.
   - These helpers call RPCs and return booleans; failures are treated as `false`.
   - Backend RPCs and RLS re-evaluate the same primitives, making the client checks advisory only.

4. **Tenant resolution**
   - `TenantContext.loadTenant` reads `getSubdomain()` and calls `get_tenant_by_subdomain` for operational subdomains.
   - In admin mode the function exits early, calling `setCurrentTenantId(null)`; `tenantFetch` therefore omits `x-tenant-id`.
   - For operational subdomains it also fetches the matching `tenant_memberships` row for the current user.

5. **Dashboard initialization**
   - Once admitted, `App.tsx` renders the admin route tree inside `<AdminSuspense>`.
   - `AdminLayout` computes `activeId` from `location.pathname` and renders `AdminShell` with `SIDEBAR_SECTIONS`.
   - `AdminShell` renders `AdminSidebar`, `AdminDashboardHeader` (which starts the realtime bell), `AdminSettingsNav` when on Settings, and the page `Outlet`.
   - Individual pages call service wrappers in `useEffect` to populate charts and tables.

6. **Realtime initialization**
   - `AdminNotificationBell` calls `useAdminRealtime`.
   - `useAdminRealtime` creates a `supabase.channel('admin-events')` subscription on `public.admin_events` INSERT events.
   - It maintains an in-memory list, caps it at `maxNotifications`, and exposes `unreadCount` and `markAsRead`.

7. **Logout**
   - `AuthContext.signOut` first writes a `LOGOUT` audit log, then calls `supabase.auth.signOut()`.
   - `onAuthStateChange` fires `SIGNED_OUT`, `user` becomes `null`, `App.tsx` unmounts admin routes and shows `Login`.

### I.9 Interaction Model

Typical request path through the architecture:

```
User / Browser
    ↓
App.tsx (routing mode + isSystemAdmin gate)
    ↓
AuthContext / TenantContext (session, tenant resolution, x-tenant-id)
    ↓
AdminLayout → AdminShell (sidebar, header, outlet)
    ↓
pages/admin/<Page>.tsx or AdminDashboardInner (tabbed panels)
    ↓
components/admin/* panel or components/* manager
    ↓
services/admin/* wrapper (e.g., tenantAdminService, billingAdminService)
    ↓
services/* base service (tenantService, bankAccountService, systemAdminService, etc.)
    ↓
lib/supabase.ts (injects x-tenant-id) → supabase.rpc / supabase.from / supabase.functions.invoke
    ↓
PostgREST RPC or Edge Function
    ↓
Postgres (tables, RLS, SECURITY DEFINER functions)
    ↓
Supabase Realtime (admin_events channel) → useAdminRealtime → AdminNotificationBell
```

Concrete examples (matching the reference data-flows below):

- **Creating a tenant:** `pages/admin/Onboarding.tsx` or `Tenants.tsx` → `tenantAdminService.createAccount` → `tenantService.createTenantWithAdmin` → `supabase.functions.invoke('create-tenant')` → Edge Function creates auth user, `tenants` row, owner membership, and sends a reset email.
- **Custom domain verification:** `CustomDomainPanel` → `tenantAdminService.requestCustomDomainVerification` → `verify-domain` Edge Function (`action: 'token'`) → user adds DNS TXT record → `tenantAdminService.verifyCustomDomain` → `verify-domain` (`action: 'verify'`) → `dns.google` check → `tenants.custom_domain_verified_at` updated.
- **License generation:** `LicenseManagerPanel` → `services/admin/licenseService.ts` → `supabase.rpc('generate_tenant_license', ...)` → inserts into `public.licenses`; validation uses `validate_tenant_license`.

### I.10 Data Ownership

| State | Owner | Where it lives | How it is consumed |
|---|---|---|---|
| **Authentication state** | Supabase Auth | `supabase.auth` | `AuthContext` subscribes and caches `session`/`user`; `mfaPending` is local UI state. |
| **Tenant state** | `TenantContext` + `lib/supabase` global | `tenant` object, `membership` object, `currentTenantId` global | Pages use `useTenant`; `tenantFetch` uses `currentTenantId` for the `x-tenant-id` header. |
| **Business state (tenants, members, subscriptions, licenses, settings, audit logs, etc.)** | Postgres database | Tables under `public.*` | Services fetch via RPC/direct query; UI holds local copies in React state. |
| **Permissions** | Backend RPCs / RLS | `system_admins`, `tenant_memberships`, `admin_roles` | `lib/permissions.ts` provides client helpers but does not own the decision. |
| **UI / form state** | Page/component local state | React hooks (`useState`/`useReducer`) | Not persisted unless sent through services. |
| **Realtime notifications** | `admin_events` table + `useAdminRealtime` hook | Postgres + Supabase Realtime | `AdminNotificationBell` displays and manages read/unread state. |
| **Configuration** | `system_settings` and `tenants.settings` | Postgres | `bankAccountService` / `tenantService` read and write. |

### I.11 Extension Points

The codebase contains several intentionally designed seams:

- **Billing Provider Registry (`services/admin/billingProviderRegistry.ts`)**: A typed map from `BillingProviderName` to `BillingProvider` implementations. Adding a new provider means implementing the interface in `services/admin/providers/` and registering it in `providers`. Callers use `getBillingProvider(name)` without knowing concrete types.
- **Sidebar configuration (`AdminLayout.tsx`)**: `SIDEBAR_SECTIONS`, `ADMIN_ROUTE_MAP`, and `PAGE_TITLES` are local constants. New admin pages can be added by extending these structures and adding the lazy route in `App.tsx`.
- **`AdminShell` props**: The shell is parameterized by `sidebarSections`, `activeSidebarItem`, `onSidebarNavigate`, `pageTitle`, `breadcrumbs`, `children`, etc., making it reusable for future admin surfaces.
- **Admin service wrappers (`services/admin/*`)**: These files deliberately re-export and adapt base services. They create a single import point per admin concern and allow future migration to dedicated admin RPCs without touching pages.
- **Edge Function seams**: Privileged/external operations (tenant creation, backup/restore, email/SMS, custom-domain verification, 2FA override, etc.) are implemented as `supabase/functions/*`. New admin operations can follow the same pattern: add a service function in `services/*` that invokes the Edge Function.
- **`useAdminRealtime` filters**: The hook accepts `filterTypes` and `onEvent`, so new notification categories in `admin_events` can be consumed without modifying `AdminNotificationBell`.

### I.12 Architectural Patterns

The following patterns have been confirmed in the repository:

- **Layered Architecture**: Presentation → Application/Context → Service → Infrastructure → Supabase/Data.
- **Service Layer / Repository Pattern**: `services/*` modules encapsulate all data access and expose typed functions that map DB rows to domain objects.
- **Wrapper / Facade (`services/admin/*`)**: Thin re-export layers centralize admin call sites and hide base service details.
- **RPC Gateway**: Named `supabase.rpc(...)` calls act as the primary API surface for privileged admin operations.
- **Context Pattern**: `AuthContext` and `TenantContext` provide cross-cutting state to the React tree.
- **Provider Pattern**: Billing providers, `ToastProvider`, `AuthProvider`, `TenantProvider`.
- **Composition over inheritance**: `AdminShell` composes `AdminSidebar`, `AdminDashboardHeader`, `AdminSettingsNav`, and `children`.
- **Lazy loading / Code splitting**: Admin route components are `React.lazy(() => import(...))` chunks.
- **Realtime Observer**: `useAdminRealtime` subscribes to Postgres changes and updates local state.
- **Fail-closed security helpers**: `lib/permissions.ts` returns `false` on RPC errors, but real enforcement is backend.

---

## 2. Entry Point & Routing

### 2.1 Routing Gate

`App.tsx` decides the application mode based on subdomain and pathname.

- `getSubdomain()` from `lib/tenant.ts` returns `admin` for the admin subdomain.
- `isAdminPath = location.pathname.startsWith('/admin')`.
- If either condition is true, App checks `isSystemAdmin` by querying `public.system_admins`.
- Non-admins see `TenantForbiddenPage`; unauthenticated users see `Login`.

Relevant code: `App.tsx` lines ~201–230 and the `subdomain === 'admin' || isAdminPath` branch around lines 1342–1369.

### 2.2 Admin Routes

Admin routes are lazily loaded and nested under `AdminLayout`.

```
/admin                 → /admin/overview
/admin/overview        → AdminOverview
/admin/tenants         → AdminTenants
/admin/tenants/:id     → AdminTenantDetail
/admin/members         → AdminMembers
/admin/billing         → AdminBilling
/admin/billing/invoices→ AdminBillingInvoices
/admin/billing/payments→ AdminBillingPayments
/admin/audit           → AdminAudit
/admin/settings        → AdminSettings
/admin/security        → AdminSecurity
/admin/health          → AdminHealth
/admin/analytics       → AdminAnalytics
/admin/compliance      → AdminCompliance
/admin/onboarding      → AdminOnboarding
/admin/invitations/accept → InvitationsAccept
```

`AdminLayout.tsx` (under `pages/admin/`) wires the `AdminShell` to the route tree. It maps sidebar item ids to route paths and page titles.

---

## 3. UI Shell & Layout

### 3.1 AdminShell

`components/AdminShell.tsx` is the top-level visual container. It renders:
- A skip-link for accessibility.
- A mobile hamburger toggle.
- `AdminSidebar` (navigation).
- The main content area with breadcrumbs, `AdminDashboardHeader`, optional `AdminSettingsNav`, and `children` (the `Outlet`).
- Footer.

`components/AdminSidebar.tsx` provides:
- Collapsible/expandable sections and items.
- Active item highlighting.
- Mobile drawer behavior.
- Brand header and footer user info.

### 3.2 Header Components

`components/admin/AdminDashboardHeader.tsx` displays the page title and a control cluster:
- `AdminNotificationBell` (real-time notifications via `useAdminRealtime`).
- `AccountSelector` (switch tenant / navigate to a tenant subdomain).
- `UserAccountButton` (profile link, sign out).

`components/admin/AdminSettingsNav.tsx` provides sub-tabs inside Settings: General, Billing, Notifications, Security, Members, Storage.

`components/AdminKpiCards.tsx` renders the KPI cards used on the overview and health views.

---

## 4. Page Catalog

| Page | File | Responsibility |
|------|------|----------------|
| Overview | `pages/admin/Overview.tsx` | Delegates to `AdminDashboardInner` with `activeTab="overview"`. |
| Dashboard Inner | `pages/admin/AdminDashboardInner.tsx` | Central dashboard hub; KPIs, Recharts charts, and tabbed panels (overview, rate limit, system admins, login history, operations, vouchers, tickets, emails, notifications, health, errors, storage, bulk maintenance, API keys, webhooks, integrations, 2FA, compliance, white label, security, settings). |
| Tenants | `pages/admin/Tenants.tsx` | Search/filter/paginate tenants, create tenant, manage status/plans/ backups/impersonation/feature flags. |
| Tenant Detail | `pages/admin/TenantDetail.tsx` | Single-tenant management: subdomain, custom domain, license, security settings. |
| Members | `pages/admin/Members.tsx` | Select a tenant and render `MemberManagement`. |
| Billing | `pages/admin/Billing.tsx` | Company/brand info, bank accounts, subscription manager. |
| Billing Invoices | `pages/admin/BillingInvoices.tsx` | Thin wrapper over `InvoiceManager`. |
| Billing Payments | `pages/admin/BillingPayments.tsx` | Thin wrapper over `PaymentManager`. |
| Audit | `pages/admin/Audit.tsx` | Audit log table with filters and `AuditExportPanel`. |
| Security | `pages/admin/Security.tsx` | 2FA manager, tenant IP allowlist/session timeout, unlock locked emails. |
| Settings | `pages/admin/Settings.tsx` | Delegates to `AdminDashboardInner` `activeTab="settings"`. |
| Health | `pages/admin/Health.tsx` | Delegates to `AdminDashboardInner` `activeTab="health"`. |
| Compliance | `pages/admin/Compliance.tsx` | Delegates to `AdminDashboardInner` `activeTab="compliance"`. |
| Analytics | `pages/admin/Analytics.tsx` | Date-range analytics; `RevenueMetrics` and `ChurnCohortMetrics`. |
| Onboarding | `pages/admin/Onboarding.tsx` | Multi-step wizard to create the first tenant account. |
| Invitations Accept | `pages/admin/InvitationsAccept.tsx` | Public-ish page to accept a member invitation token. |

---

## 5. Reusable Admin Components

### 5.1 `components/admin/`

| Component | Responsibility |
|-----------|--------------|
| `AccountSelector.tsx` | Load current user's accounts and switch to a tenant subdomain. |
| `AdminDashboardHeader.tsx` | Topbar: title, notification bell, account selector, user menu. |
| `AdminSettingsNav.tsx` | Settings sub-navigation. |
| `AuditExportPanel.tsx` | Export audit logs to CSV/JSON with filters. |
| `CustomDomainPanel.tsx` | Generate DNS TXT token and verify a tenant custom domain. |
| `LicenseManagerPanel.tsx` | Generate, validate, list, and revoke tenant licenses. |
| `SecuritySettingsPanel.tsx` | Edit IP allowlist/session timeout and unlock locked emails. |
| `SubdomainManagerPanel.tsx` | Check availability and update a tenant subdomain. |
| `UserAccountButton.tsx` | User avatar dropdown with profile and sign out. |

### 5.2 Top-level Dashboard Panels (`components/`)

| Component | Responsibility |
|-----------|--------------|
| `SystemHealthPanel.tsx` | DB/storage/edge function health, cron logs. |
| `ErrorPerformancePanel.tsx` | Error counts and query performance charts. |
| `StorageBackupPanel.tsx` | Storage usage, PITR/backup status. |
| `BulkMaintenancePanel.tsx` | Bulk tenant updates and maintenance windows. |
| `ApiKeyManager.tsx` | Create/revoke tenant API keys. |
| `WebhookManager.tsx` | Tenant webhook configuration and retry logs. |
| `IntegrationMarketplace.tsx` | Integration partner management. |
| `WhiteLabelManager.tsx` | Tenant branding and custom domain. |
| `VoucherManager.tsx` | Promo codes and promotion rules. |
| `TicketInbox.tsx` | Support tickets, replies, assignment, templates. |
| `EmailTemplateManager.tsx` | Email template management and test send. |
| `NotificationManager.tsx` | Notification log viewer and in-app composer. |
| `TwoFactorManager.tsx` | 2FA enrollment, backup codes, admin override. |
| `ComplianceManager.tsx` | GDPR requests, terms acceptance, fraud/retention. |
| `ReadReplicaQueueManager.tsx` | Read replica/pool stats and heavy-ops queue. |

---

## 6. State, Auth & Context

### 6.1 AuthContext

`contexts/AuthContext.tsx`:
- Manages Supabase session/user.
- Exposes `mfaPending` and `setMfaPending` for TOTP flows.
- Records `LOGIN`/`LOGOUT` audit entries via `writeAuditLog` and `recordAdminLogin`.
- Calls `supabase.rpc('activate_pending_memberships')` on sign-in.

### 6.2 TenantContext

`contexts/TenantContext.tsx`:
- Resolves tenant from subdomain for the operational app.
- Does **not** resolve a tenant when the host is `admin`; `setCurrentTenantId(null)` is called.
- Tracks `membership`, `role`, `isImpersonating`, `isReadOnly`.

### 6.3 Global Supabase Client

`lib/supabase.ts` creates a single Supabase client with `tenantFetch` that injects `x-tenant-id` from a global `currentTenantId` variable. In admin mode the tenant id is `null`, so calls rely on the user's `auth.uid()` for system-admin checks.

### 6.4 Permissions

`lib/permissions.ts` defines:
- `ROLES` (owner, admin, cashier, inventory_manager, accountant, viewer, system_admin).
- `MEMBER_ROLES` and `ADMIN_ROLES`.
- `ROLE_PERMISSIONS` matrix with role hierarchy.
- Async guards: `isSystemAdmin()`, `hasTenantRole`, `isTenantOwner`, `isTenantAdmin`, `canUseFeature`.

System admin checks are ultimately enforced by Supabase RLS / RPC `SECURITY DEFINER` and by Edge Function `service_role` clients.

---

## 7. Service Layer

The admin UI calls two categories of service modules:

1. **Admin-specific wrappers** under `services/admin/` that re-export and thinly wrap base services.
2. **Base services** under `services/` containing the actual Supabase calls.

### 7.1 Admin Service Wrappers

| Module | Exposes / Wraps |
|--------|-----------------|
| `services/admin/tenantAdminService.ts` | `listAccounts`, `getAccount`, `getUserAccounts`, `checkSubdomainAvailability`, `setTenantSubdomain`, `requestCustomDomainVerification`, `verifyCustomDomain` — wraps `services/tenantService.ts`. |
| `services/admin/systemAdminService.ts` | Re-exports from `services/systemAdminService.ts`, `services/operationsService.ts`, `services/tenantBackupService.ts`, `services/tenantRestoreService.ts`, `services/tenantMigrationService.ts`, `services/tenantService.ts`. |
| `services/admin/memberAdminService.ts` | Member invitation/lookup/accept flows; wraps `services/tenantService.ts`. |
| `services/admin/billingAdminService.ts` | `getBankAccounts` etc, `getTenantSubscription`, `updateTenantSubscription`, subscription lifecycle. |
| `services/admin/analyticsAdminService.ts` | `getAdminRevenueMetrics`, `getAdminChurnCohortMetrics` via RPCs. |
| `services/admin/complianceAdminService.ts` | GDPR request//export/deletion. |
| `services/admin/auditAdminService.ts` | `getAdminAuditLogs`, `exportAuditLogs`, re-exports login history helpers. |
| `services/admin/licenseService.ts` | License generation, validation, list/revoke. |
| `services/admin/billingProviderRegistry.ts` | Provider lookup for `stripe`, `momo`, `vnpay`, `bank_transfer`. |
| `services/admin/supportService.ts` | Support ticket/reply/template CRUD. |
| `services/admin/smsService.ts` | SMS sending wrappers. |

### 7.2 Key Base Services

| Service | Responsibilities |
|---------|------------------|
| `services/tenantService.ts` | Tenant CRUD, search, members, impersonation, subscription lifecycle, system overview, top tenants, growth. |
| `services/systemAdminService.ts` | Rate-limit logs, system admins, security settings, login attempts/locked emails. |
| `services/bankAccountService.ts` | `bank_accounts` and `system_settings` (`company_info`) CRUD. |
| `services/operationsService.ts` | Data retention, default plan limits, maintenance mode via RPCs. |
| `services/tenantBackupService.ts` | Invoke `tenant-backup` Edge Function and download JSON. |
| `services/tenantRestoreService.ts` | Validate JSON backup, invoke `tenant-restore` Edge Function. |
| `services/tenantMigrationService.ts` | `reset_demo_data` and `migrate_tenant_data` RPCs. |
| `services/loginHistoryService.ts` | `recordAdminLogin`, `getAdminLoginHistory`, `getAdminLoginAlerts`. |
| `services/auditService.ts` | `writeAuditLog` and `getAuditLogs` for `app_audit_log`. |
| `services/twoFactorService.ts` | TOTP enrollment, backup codes, admin override. |

### 7.3 Data Access Patterns

- **RPC calls**: most reads/writes go through named Supabase RPCs (e.g. `search_tenants`, `get_system_overview`, `get_admin_login_history`, `generate_tenant_license`).
- **Direct table access**: some admin list/create/delete operations still call `supabase.from(...).select/insert/update/delete`.
- **Edge Functions**: actions needing `service_role` or external APIs are delegated to `supabase.functions.invoke(...)`.

---

## 8. Backend & Data Layer

### 8.1 Core Tables

| Table | Purpose |
|-------|---------|
| `public.system_admins` | `user_id` (UUID) of system admins. Single-column authorization table. |
| `public.tenants` | Tenant record: name, subdomain, status, plan, owner, settings, isolation, custom domain, white label. |
| `public.tenant_memberships` | User ↔ tenant role mapping; also stores impersonation metadata (`impersonated_by`, `impersonated_expires_at`). |
| `public.admin_login_history` | Login success/failure events for admins (IP, user agent, status). |
| `public.app_audit_log` | Generic application audit trail (tenant, user, table, action, old/new data). |
| `public.audit_log` | Dedicated admin-dashboard audit log (tenant, actor, action, entity). |
| `public.rate_limit_logs` | IP-action rate-limit counters (used by login, subdomain checks, etc.). |
| `public.licenses` | Generated per-tenant license keys with limits and expiry. |
| `public.tenant_subscriptions` | Subscription limits, counters, status, expiry. |
| `public.bank_accounts` | Shared bank account list for billing. |
| `public.system_settings` | Key/value store; `company_info` holds brand/tax/address. |
| `public.admin_roles` | Custom admin role definitions with permission arrays. |
| `public.admin_role_assignments` | User ↔ admin role assignments. |

### 8.2 Admin-Relevant Supabase RPCs

Account/tenant management:
`search_tenants`, `get_tenant_by_subdomain`, `get_tenant_by_domain`, `get_current_user_tenants`, `update_tenant`, `set_tenant_subdomain`, `delete_tenant_safe`, `create_tenant_with_admin`, `reset_demo_data`, `migrate_tenant_data`, `get_tenant_members_with_email`, `accept_invitation`, `lookup_invitation`.

Overview & analytics:
`get_system_overview`, `get_top_tenants`, `get_tenant_growth`, `get_revenue_metrics`, `get_churn_cohort_metrics`.

Security & access:
`is_system_admin`, `is_tenant_admin`, `is_tenant_owner`, `has_tenant_role`, `can_use_feature`, `get_tenant_security_settings`, `update_tenant_ip_allowlist`, `update_tenant_session_timeout`, `get_locked_emails`, `unlock_login_attempts`, `get_login_attempts`, `record_login_attempt`, `get_rate_limit_logs`.

System admin & audit:
`get_system_admins`, `add_system_admin`, `remove_system_admin`, `get_admin_login_history`, `get_admin_login_alerts`.

Licenses:
`generate_tenant_license`, `validate_tenant_license`.

Operations:
`get_data_retention_status`, `get_default_plan_limits`, `set_default_plan_limits`, `get_maintenance_mode`, `set_maintenance_mode`.

GDPR:
`get_gdpr_requests`, `create_gdpr_request`, `gdpr_export_user_data`, `gdpr_delete_user_data`.

Cron:
`get_admin_cron_config`, `is_valid_admin_cron_url`, `run_admin_cron_billing_reminders`, `run_admin_cron_audit_cleanup`.

### 8.3 Edge Functions Used by Admin UI

| Function | Responsibility | Typical Admin Caller |
|----------|--------------|----------------------|
| `check-subdomain` | Validate and check subdomain availability, rate-limited per IP. | `services/admin/tenantAdminService.ts` |
| `verify-domain` | Generate TXT token or verify custom domain DNS for a tenant. | `services/admin/tenantAdminService.ts` |
| `create-tenant` | Provision a new tenant, owner user, subscription and membership. | `services/tenantService.ts` → `pages/admin/Tenants.tsx` / `Onboarding.tsx` |
| `delete-tenant` | Soft archive or force-delete a tenant and related data. | `services/tenantService.ts` → `pages/admin/Tenants.tsx` |
| `create-system-admin` | Create an Auth user and assign `system_admins` (service role). | `services/systemAdminService.ts` → `pages/admin/AdminDashboardInner.tsx` |
| `invite-member` | Invite a user into a tenant and send an email. | `services/tenantService.ts` |
| `reset-password` | Generate a recovery/invite link for a tenant member. | `services/tenantService.ts` |
| `send-invitation-email` | Send a member invitation email via Resend. | `services/admin/memberAdminService.ts` |
| `send-sms` | Send SMS via Twilio (system admin or service role). | `services/admin/smsService.ts` |
| `send-ticket-email` | Send support ticket update emails. | `services/admin/supportService.ts` |
| `tenant-backup` | Download a tenant's data as JSON (service role + system admin). | `services/tenantBackupService.ts` → `pages/admin/Tenants.tsx` |
| `tenant-restore` | Restore tenant data from JSON. | `services/tenantRestoreService.ts` → `pages/admin/Tenants.tsx` |
| `system-health` | Run DB/storage/edge health checks and metrics. | `services/systemHealthService.ts` → `SystemHealthPanel` |
| `error-performance` | Fetch error summaries and query performance metrics. | `services/errorPerformanceService.ts` → `ErrorPerformancePanel` |
| `system-backup` | Query Supabase Management API for PITR/backup status. | `services/systemBackupService.ts` → `StorageBackupPanel` |
| `admin-2fa-override` | Unenroll TOTP for a target admin, requiring two admin approvals. | `services/twoFactorService.ts` → `TwoFactorManager` |
| `audit-log` | Centralized manual audit/rate-limit/cleanup worker. | `services/auditService.ts` (login/logout/app flows) |
| `impersonate-tenant` | Create an impersonated `tenant_memberships` row for a system admin. | `services/tenantService.ts` → `pages/admin/Tenants.tsx` |
| `end-impersonation` | Clean up impersonation sessions. | `services/tenantService.ts` |

Edge Functions present under `supabase/functions/` but **not** reached from the admin dashboard code paths (e.g. `cron-admin-tasks`, `billing-webhooks`, `send-billing-email`, `webhook-delivery`) are excluded from the admin UI surface; `cron-admin-tasks` is intended for `pg_cron` / `pg_net` triggers.

---

## 9. Security Model

- **Route guard**: `App.tsx` blocks `/admin/*` unless the current user is a system admin.
- **Client guards**: `lib/permissions.ts` helpers are UX-only; they call the same RPCs the backend uses but do not bypass RLS.
- **Backend authorization**:
  - RPCs marked `SECURITY DEFINER` run with elevated privileges and internally call `is_system_admin()` or `auth.uid()` checks.
  - Edge Functions use a `service_role` Supabase client but still verify caller system-admin status before performing privileged actions.
  - RLS policies on `tenants`, `tenant_memberships`, `audit_log`, etc., control direct table access.
- **2FA**: `services/twoFactorService.ts` wraps Supabase MFA. Admins can override another admin's 2FA only with two-system-admin approval via `admin-2fa-override`.
- **Rate limiting**: Login, subdomain checks, and invitations are rate-limited using `rate_limit_logs`.
- **IP allowlist**: Per-tenant `allowed_ips` and `session_timeout_minutes` are stored and enforced server-side.

---

## 10. External Dependencies

| Service | Usage |
|---------|-------|
| Supabase (Auth, PostgREST, Storage, Edge Functions, Realtime) | Core backend; all admin data lives in Supabase. |
| Resend (`RESEND_API_KEY`) | Transactional emails: invitations, ticket updates, billing reminders. |
| Twilio (`TWILIO_*`) | SMS sending. |
| Google DNS (`dns.google/resolve`) | Custom domain TXT verification in `verify-domain`. |
| Supabase Management API | Backup/PITR status in `system-backup`. |
| Stripe / Momo / VNPay (billing providers) | Client-side billing provider stubs/registry; real money movement is currently mocked or pending server-side integration. |

---

## 11. Component / Service / Backend Relationships

```
User
 │
 ▼
App.tsx (route guard + isSystemAdmin check)
 │
 ▼
pages/admin/AdminLayout.tsx ──► components/AdminShell.tsx
 │                                ├─ AdminSidebar.tsx
 │                                ├─ AdminDashboardHeader.tsx
 │                                │    ├─ AdminNotificationBell (useAdminRealtime)
 │                                │    ├─ AccountSelector
 │                                │    └─ UserAccountButton
 │                                └─ Outlet (admin pages)
 │
 ▼
pages/admin/<Page>.tsx
 ├─ pages/admin/AdminDashboardInner.tsx (tabbed panels)
 ├─ components/admin/* panels
 └─ components/* lazy panels
 │
 ▼
services/admin/*.ts (thin wrappers)
 │
 ▼
services/*.ts (base services: tenant, system, audit, backup, etc.)
 │
 ├─ supabase.rpc(...)           (database functions)
 ├─ supabase.from(...)...       (direct table access)
 └─ supabase.functions.invoke(...) (Edge Functions)
     │
     ▼
supabase/migrations/*.sql      (tables + RPCs)
supabase/functions/*           (Deno Edge Functions)
```

---

## 12. Data Flow Examples

### Creating a Tenant

1. `pages/admin/Onboarding.tsx` or `Tenants.tsx` calls `createAccount({ name, subdomain, plan })`.
2. `services/admin/tenantAdminService.ts` → `services/tenantService.ts` `createTenantWithAdmin`.
3. `supabase.functions.invoke('create-tenant')` Edge Function creates the Auth user, `tenants` row, `tenant_memberships` owner row, and sends a reset email.

### Custom Domain Verification

1. `components/admin/CustomDomainPanel.tsx` calls `requestCustomDomainVerification(tenantId)`.
2. `services/admin/tenantAdminService.ts` invokes `verify-domain` Edge Function with `action: 'token'`.
3. Edge Function generates a TXT record; user adds it to DNS.
4. Panel calls `verifyCustomDomain(tenantId, domain)` with `action: 'verify'`; Edge Function queries `dns.google` and updates `tenants.custom_domain_verified_at`.

### License Generation

1. `components/admin/LicenseManagerPanel.tsx` calls `generateLicense(input)`.
2. `services/admin/licenseService.ts` calls `supabase.rpc('generate_tenant_license', ...)`, which inserts into `public.licenses`.
3. `validateLicense(key)` calls `supabase.rpc('validate_tenant_license', ...)`.

---

## 13. Key Files Summary

| File | Role |
|------|------|
| `App.tsx` | Application root; admin route guard and lazy loading. |
| `pages/admin/AdminLayout.tsx` | Admin route shell. |
| `components/AdminShell.tsx` | Visual shell (sidebar, header, main). |
| `components/AdminSidebar.tsx` | Navigation. |
| `pages/admin/AdminDashboardInner.tsx` | Central dashboard with tabs and data loading. |
| `contexts/AuthContext.tsx` | Auth state, MFA pending, audit/login side effects. |
| `contexts/TenantContext.tsx` | Tenant resolution; admin subdomain yields no tenant. |
| `lib/supabase.ts` | Global Supabase client with `x-tenant-id` fetch wrapper. |
| `lib/permissions.ts` | Role/permission matrix and async system admin checks. |
| `lib/tenant.ts` | Subdomain/custom-domain helpers and `getTenantUrl`/`getAdminUrl`. |
| `services/admin/*` | Admin-specific service wrappers re-exporting base services. |
| `services/tenantService.ts` | Core tenant, member, subscription, impersonation, analytics. |
| `services/systemAdminService.ts` | System admin, rate limit, security, login attempt operations. |
| `services/auditService.ts` / `services/admin/auditAdminService.ts` | App audit and admin audit log queries/export. |
| `services/twoFactorService.ts` | MFA and backup code flows. |
| `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | Baseline tables: `system_admins`, `tenants`, `admin_login_history`, `app_audit_log`, etc. |
| `supabase/migrations/202607*.sql` | Later RPCs for admin roles, licenses, cron jobs, GDPR, security settings. |
| `supabase/functions/*` | Deno Edge Functions for privileged or external operations. |

---

## 14. Notes / Architectural Observations (Non-Judgmental)

- The admin surface is currently implemented as a set of thin TypeScript wrappers around a growing set of Supabase RPCs and Edge Functions. The `services/admin/*` directory deliberately re-exports base services to keep admin call sites centralized.
- Authorization is duplicated conceptually: `lib/permissions.ts` for client UX gating and `SECURITY DEFINER` RPCs / Edge Functions for enforcement. Real protection lives in the backend.
- Several "manager" components (Vouchers, Tickets, Integrations, Webhooks, etc.) are shared between the operational app and the admin dashboard; in admin mode they typically operate on a selected tenant or across tenants.
- The custom domain flow depends on external DNS resolution; the backup/restore flow depends on Edge Function payload size (documented ~6 MB ceiling) and the Supabase Management API token.
- `cron-admin-tasks` is not invoked from the React UI directly; it is intended to be triggered by `pg_cron` / `pg_net` with a shared `X-Internal-Secret`.
