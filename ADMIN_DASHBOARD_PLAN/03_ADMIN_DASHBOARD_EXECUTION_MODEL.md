# Admin Dashboard Execution Model

## 0. Purpose & Baseline

This document is the **runtime execution model** for the VietSale Pro Admin Dashboard. It describes how the system behaves while it is running: execution order, state transitions, runtime interactions, boundaries, ownership, synchronization, and lifecycles.

It does **not** describe the static architecture or dependency graph. The authoritative baselines for those are:

- `ADMIN_DASHBOARD_PLAN/01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md`
- `ADMIN_DASHBOARD_PLAN/02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md`

All evidence in this document is anchored to the repository, primarily the `services/*`, `contexts/*`, `pages/admin/*`, `supabase/functions/*`, and `supabase/schema.sql` runtime artifacts.

---

## 1. Execution Philosophy

The admin dashboard is a privileged view inside the same Vite + React SPA as the tenant application. Runtime execution is intentionally layered so that the **backend is the only security boundary**:

```
Browser (React)
  ↓
Presentation components / pages
  ↓
React Contexts (Auth, Tenant)
  ↓
Hooks (useAdminList, useAdminRealtime, useConfirmDialog, etc.)
  ↓
Admin wrapper services (services/admin/*.ts)
  ↓
Base services (services/*.ts)
  ↓
lib/supabase.ts (typed client + tenantFetch)
  ↓
Supabase Auth / PostgREST / Realtime / Edge Functions
  ↓
Postgres (tables, views, RPCs, triggers, RLS)
```

**Runtime ownership**

| Layer | Owns | Must not do |
|-------|------|-------------|
| React components | Local UI state, form input, render boundaries | Never call `supabase` directly; never trust UI for security |
| Contexts (`AuthContext`, `TenantContext`) | Cross-cutting runtime state: session, user, tenant, membership, impersonation | Never perform business writes |
| Hooks | Composable local behavior: debounce, pagination, confirmation, realtime subscriptions | Never bypass services |
| Wrapper services (`services/admin/*`) | Admin call-site seam | No backend security logic beyond calling RPCs/Edge Functions |
| Base services (`services/*`) | RPC/PostgREST invocation, response mapping, error normalization | No React imports |
| `lib/supabase.ts` | Single typed Supabase client, `x-tenant-id` injection | No business logic |
| Supabase platform | Auth, REST, realtime, storage, edge runtime | Enforces RLS, SECURITY DEFINER checks, signatures |
| Database | Business invariants, audit, guardrails, transactions | Source of truth for all persisted state |

Key runtime conventions discovered in code:

- `lib/supabase.ts` exposes one typed `supabase` client. Every service call uses it. `tenantFetch` reads a module-level `currentTenantId` and injects `x-tenant-id` on every outgoing request. <ref_snippet file="C:/PROJECT/vietsalepro/lib/supabase.ts" lines="14-34" />
- The `TenantContext` is the only runtime writer of `currentTenantId`. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/TenantContext.tsx" lines="82-85" />
- Admin pages are lazy-loaded with `React.lazy` and wrapped in `AdminSuspense`. Heavy inner panels are also lazy-loaded inside `AdminDashboardInner`. <ref_snippet file="C:/PROJECT/vietsalepro/App.tsx" lines="68-91" /> <ref_snippet file="C:/PROJECT/vietsalepro/pages/admin/AdminDashboardInner.tsx" lines="55-77" />

---

## 2. Application Boot Execution

The full application startup sequence, in execution order:

1. **Browser loads `index.html`** and the Vite bundle. <ref_file file="C:/PROJECT/vietsalepro/index.html" />
2. **`index.tsx` mounts the React tree.** `ReactDOM.createRoot` wraps the app in `React.StrictMode`, `ErrorBoundary`, and `BrowserRouter`, then renders `App`. <ref_snippet file="C:/PROJECT/vietsalepro/index.tsx" lines="12-20" />
3. **`App.tsx` mounts providers.** `AuthProvider` wraps `TenantProvider`, which wraps `AppContent`. <ref_snippet file="C:/PROJECT/vietsalepro/App.tsx" lines="1759-1766" />
4. **`AuthProvider` initializes the session.** On mount it calls `supabase.auth.getSession()`, sets `session`/`user`, runs `checkMfaAsync`, and subscribes to `onAuthStateChange`. It also sets `loading` false. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/AuthContext.tsx" lines="40-99" />
5. **`TenantProvider` resolves the tenant.** Its effect runs whenever `user` changes. It calls `getSubdomain()`; if the host is `admin` or no subdomain, it clears `tenant` and `currentTenantId`. Otherwise it calls `supabase.rpc('get_tenant_by_subdomain', ...)` (SECURITY DEFINER, works before login), maps the row, calls `setCurrentTenantId(t.id)`, and if a user exists it fetches the matching `tenant_memberships` row. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/TenantContext.tsx" lines="50-115" />
6. **`AppContent` begins executing.** It reads `user` from `AuthContext`, `tenant` from `TenantContext`, and begins the `isSystemAdmin` check. This check only runs when the host is `admin` or the path starts with `/admin`; it queries `system_admins` for `user.id`. <ref_snippet file="C:/PROJECT/vietsalepro/App.tsx" lines="195-226" />
7. **Loading gate.** `AppContent` does not render the route tree until `authLoading`, `tenantLoading`, and `isAdminLoading` are all false. If `user` is present and `isLoading` is still true, it also waits. <ref_snippet file="C:/PROJECT/vietsalepro/App.tsx" lines="1312-1323" />
8. **Admin route resolution.** If the host/path is admin and the user is not authenticated, `Login` is rendered. If authenticated but not a system admin, `TenantForbiddenPage` is rendered. If both checks pass, the admin route tree is mounted inside `ToastProvider` with lazy-loaded routes. <ref_snippet file="C:/PROJECT/vietsalepro/App.tsx" lines="1341-1358" />
9. **Lazy chunks activate.** `React.lazy` components for `AdminLayout` and child pages load asynchronously; `Suspense` shows `LoadingState "Đang tải trang quản trị..."` until the chunk resolves. <ref_snippet file="C:/PROJECT/vietsalepro/App.tsx" lines="85-91" />
10. **Initial page data fetch.** Each admin page owns its own `useEffect` data load. For example `AdminDashboardInner` with `activeTab='overview'` calls `loadOverview()`, which fires `getSystemOverview()`, `getTopTenants()`, and `getTenantGrowth()` in parallel. <ref_snippet file="C:/PROJECT/vietsalepro/pages/admin/AdminDashboardInner.tsx" lines="162-185" />

**State created during boot**

- `session`, `user`, `loading`, `mfaPending` (AuthContext)
- `tenant`, `membership`, `isLoading`, `isReadOnly`, `isImpersonating` (TenantContext)
- `isSystemAdmin`, `isAdminLoading` (AppContent)
- `viewport`, `isLoading` for operational data (AppContent)

---

## 3. Authentication Execution

### 3.1 Login lifecycle

The dashboard does not implement its own credential verification; it delegates to Supabase Auth. The runtime sequence begins when Supabase emits `SIGNED_IN`:

1. User submits credentials via Supabase Auth UI/flow.
2. Supabase validates and emits `onAuthStateChange('SIGNED_IN', newSession)`.
3. `AuthProvider` callback runs:
   - `setSession(newSession)`
   - `setUser(prev => prev?.id === next?.id ? prev : next)` to keep object reference stable across token refreshes. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/AuthContext.tsx" lines="60-74" />
   - `checkMfaAsync(newSession)` calls `isMfaRequired()`; if required, `mfaPending` becomes true. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/AuthContext.tsx" lines="27-38" />
   - If `SIGNED_IN` and user exists, it concurrently writes `LOGIN` audit, records admin login history, and activates pending memberships. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/AuthContext.tsx" lines="78-93" />
4. `setLoading(false)` is always called, so the UI renders.
5. `TenantProvider` re-runs because `user` changed; it resolves membership for the current tenant.
6. `AppContent` re-runs the system-admin check because `user` changed, then renders the admin tree.

### 3.2 Token refresh

Supabase SDK refreshes the JWT in the background. `onAuthStateChange` fires for `TOKEN_REFRESHED`/`SIGNED_IN`. The `setUser` guard preserves the existing user object when the user ID has not changed, preventing the whole `AppContent` data-fetch effect from re-running and wiping unsaved UI state. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/AuthContext.tsx" lines="62-74" />

### 3.3 Logout

`signOut()` writes a `LOGOUT` audit entry, then calls `supabase.auth.signOut()`. The auth subscription receives `SIGNED_OUT`, `setUser(null)` runs, `AppContent` redirects to `Login`. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/AuthContext.tsx" lines="101-111" />

### 3.4 Permission resolution

- Client-side `isSystemAdmin` is a UX gate in `AppContent`. <ref_snippet file="C:/PROJECT/vietsalepro/App.tsx" lines="209-218" />
- `lib/permissions.ts` exposes `isSystemAdmin()` which calls the `is_system_admin` RPC and fails closed on error. <ref_snippet file="C:/PROJECT/vietsalepro/lib/permissions.ts" lines="123-137" />
- **Real authorization** is enforced by every backend RPC and Edge Function, not by the client.

### 3.5 Audit and login history

On `SIGNED_IN`, `AuthProvider` calls `writeAuditLog('LOGIN','auth',...)` and `recordAdminLogin(...)`. `recordAdminLogin` invokes the `record_admin_login` RPC, which inserts into `admin_login_history` after validating that the user is a system admin for successful events. <ref_snippet file="C:/PROJECT/vietsalepro/services/loginHistoryService.ts" lines="73-91" /> <ref_snippet file="C:/PROJECT/vietsalepro/supabase/schema.sql" lines="26810-26863" />

Membership activation runs concurrently: `supabase.rpc('activate_pending_memberships', { p_user_id: newSession.user.id })`. This converts pending invitations for that user into active memberships. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/AuthContext.tsx" lines="91-93" />

---

## 4. Navigation Execution

When an administrator navigates inside the dashboard, the runtime sequence is:

```
URL change (BrowserRouter)
  ↓
React Router matches /admin/*
  ↓
<Route element={<AdminSuspense><AdminLayout /></AdminSuspense>}>
  ↓
AdminLayout reads useLocation()
  ↓
getActiveId(location.pathname) maps path → sidebar id
  ↓
AdminShell renders with activeId, pageTitle, children
  ↓
AdminSidebar highlights active item
  ↓
Outlet renders the matched child page
  ↓
Child component useEffect triggers data fetch
  ↓
Hook / service / RPC / DB
  ↓
setState in child component
  ↓
React re-renders child and descendants; layout state is isolated
```

Evidence:

- `AdminLayout` derives `activeId` from `location.pathname` and passes it to `AdminShell`. <ref_snippet file="C:/PROJECT/vietsalepro/pages/admin/AdminLayout.tsx" lines="71-88" />
- `AdminSidebar` handles item clicks by calling `onNavigate(id)`, which `AdminLayout` translates to `navigate(ADMIN_ROUTE_MAP[id])`. <ref_snippet file="C:/PROJECT/vietsalepro/components/AdminSidebar.tsx" lines="83-88" /> <ref_snippet file="C:/PROJECT/vietsalepro/pages/admin/AdminLayout.tsx" lines="30-44" />
- `AdminShell` renders `<main>` with `AdminDashboardHeader` and `children`. The `children` is the `<Outlet>`. <ref_snippet file="C:/PROJECT/vietsalepro/components/AdminShell.tsx" lines="51-100" />
- Lazy page chunks and lazy inner panels are suspended while loading. <ref_snippet file="C:/PROJECT/vietsalepro/App.tsx" lines="68-91" /> <ref_snippet file="C:/PROJECT/vietsalepro/pages/admin/AdminDashboardInner.tsx" lines="66-77" />

**State ownership during navigation**

- `AdminLayout`: derives `activeId`; no fetch state.
- `AdminShell`: owns `mobileOpen` state for the mobile drawer.
- `AdminSidebar`: owns collapsed sections state.
- Child page (e.g., `AdminDashboardInner`, `Tenants`): owns data, loading, error, success, and pagination state.
- `useAdminList`: owns `page`, `pageSize`, `searchTerm`, `filters`, `data`, `totalCount`, `isLoading`, `error`, and request deduplication via `requestIdRef`. <ref_snippet file="C:/PROJECT/vietsalepro/hooks/useAdminList.ts" lines="36-123" />

---

## 5. Capability Execution Models

For each capability the following pattern applies: **User Action → React Event → Component/Hook → Wrapper Service → Base Service → Supabase Client → RPC/Edge → Database → Trigger → Return → UI Refresh**. Only confirmed execution paths are shown.

### 5.1 Tenant Management

**List / search tenants**

- User Action: open `/admin/tenants` or type in search/filter.
- React Event: `Tenants` component mounts / search changes.
- Component/Hook: `useAdminList` or direct effect.
- Wrapper: `tenantAdminService.listAccounts`.
- Base: `tenantService.searchTenants` (if filters) or `tenantService.getAllTenants`.
- Supabase: `supabase.rpc('search_tenants', ...)` or `supabase.from('tenants').select('*')`.
- DB: `public.tenants` filtered by status/plan/search.
- Return: mapped `Tenant[]` + `totalCount`.
- UI: table with pagination.

Evidence: `tenantAdminService.ts` lines 43-60; `tenantService.ts` lines 551-580 and 884-891; schema `search_tenants` lines 11998-12071.

**Create tenant with admin**

- User Action: submit create-tenant form.
- React Event: `handleSubmit` in `Tenants`.
- Component/Hook: `tenantAdminService.createAccount`.
- Wrapper: `tenantAdminService.createAccount`.
- Base: `tenantService.createTenantWithCredentials`.
- Supabase: `supabase.functions.invoke('create-tenant', { body: { name, subdomain, email, plan } })`.
- Edge: `create-tenant` validates system admin, rate limit, creates auth user, inserts `tenants`, `tenant_subscriptions`, `tenant_memberships`, `tenant_credentials`, `app_audit_log`, and sends a password-reset email.
- Return: `{ tenant, adminUser, resetEmailSent, redirectTo }`.
- UI: success message / redirect.

Evidence: `tenantAdminService.ts` lines 130-137; `tenantService.ts` lines 767-806; `supabase/functions/create-tenant/index.ts` lines 31-265.

**Update tenant status / plan / custom domain**

- `tenantAdminService.updateAccountStatus` or `setAccountActive` calls `tenantService.updateTenant(id, { status })`.
- `tenantService.updateTenant` calls `supabase.rpc('update_tenant', { p_tenant_id, p_status, ... })`.
- The RPC validates `is_system_admin()`, validates plan/status/isolation/custom-domain rules, updates `public.tenants`.
- Before-update trigger `set_tenant_record_user_tracking` sets `created_by` / `updated_by`. After-update trigger `trg_audit_log_tenants` writes `audit_log`.

Evidence: `tenantAdminService.ts` lines 76-128; `tenantService.ts` lines 941-961; schema `update_tenant` lines 29220-29339; schema `set_tenant_record_user_tracking` lines 31717-31738; schema `audit_log_trigger` lines 34004-34035.

**Subdomain check**

- `tenantAdminService.checkSubdomainAvailability` invokes `supabase.functions.invoke('check-subdomain', { body: { subdomain } })`.
- Edge `check-subdomain` rate-limits the IP, validates the subdomain, then checks `public.tenants` for an existing non-archived record.
- Return: `{ available: boolean, error?: string }`.

Evidence: `tenantAdminService.ts` lines 144-160; `supabase/functions/check-subdomain/index.ts` lines 35-115.

**Custom domain verification**

- `requestCustomDomainVerification` / `verifyCustomDomain` in `tenantAdminService` invoke `supabase.functions.invoke('verify-domain', ...)`.
- Edge `verify-domain` authenticates the caller, checks system/tenant admin rights, and either:
  - `action='token'`: calls `get_or_create_custom_domain_token` and returns the TXT record; or
  - `action='verify'`: queries Google DNS, compares the TXT record, and updates `tenants.custom_domain_verified_at`.

Evidence: `tenantAdminService.ts` lines 189-221; `supabase/functions/verify-domain/index.ts` lines 59-163.

**Delete tenant**

- Soft delete: `tenantAdminService.deleteAccount` -> `tenantService.softDeleteTenant` -> `supabase.rpc('delete_tenant_safe', ...)` -> updates `tenants.status` to `archived`.
- Hard delete: `tenantService.hardDeleteTenant` -> `supabase.functions.invoke('delete-tenant', { body: { tenant_id, force: true } })` -> removes storage objects, orphan rows, cascade-deletes the tenant, and removes auth users with no other membership.

Evidence: `tenantAdminService.ts` lines 80-82; `tenantService.ts` lines 736-756; `supabase/functions/delete-tenant/index.ts` lines 31-305.

**Impersonation**

- Start: `startImpersonation` (via `systemAdminService` re-export) invokes `supabase.functions.invoke('impersonate-tenant')`.
  - Edge validates system admin, checks tenant active, ensures no real membership, deletes old impersonation rows, inserts a new `tenant_memberships` row with `role='admin'`, `impersonated_by=userId`, `impersonated_expires_at=+1 hour`, and writes `app_audit_log` `IMPERSONATE`.
- End: `endImpersonation` invokes `supabase.functions.invoke('end-impersonation')`.
  - Edge finds all active impersonation sessions, writes `IMPERSONATE_END` audit rows with duration, then deletes the sessions.

Evidence: `tenantService.ts` lines 1014-1050; `supabase/functions/impersonate-tenant/index.ts` lines 24-145; `supabase/functions/end-impersonation/index.ts` lines 22-96.

### 5.2 Billing

**Read tenant subscription**

- `billingAdminService.getTenantSubscription` -> `tenantService.getTenantSubscription` -> `supabase.from('tenant_subscriptions').select(...).eq('tenant_id', ...).single()`.
- Base maps with `mapSubscriptionFromDB`.

**Update subscription**

- `billingAdminService.updateTenantSubscription` -> `tenantService.updateTenantSubscription` -> `supabase.rpc('update_tenant_subscription', { p_tenant_id, p_plan, p_max_users, ... })`.
- The RPC validates `is_system_admin()`, applies default plan limits if plan changed, updates `tenant_subscriptions`, updates `tenants.plan`, and returns the subscription row.
- Trigger `trg_audit_log_tenant_subscriptions` writes to `audit_log`.

Evidence: `billingAdminService.ts` lines 25-34; `tenantService.ts` lines 496-514; schema `update_tenant_subscription` lines 36429-36509; schema `audit_log_trigger_tenant_subscriptions` lines 33355-33379.

**Lifecycle shortcuts**

- `upgradeDowngradeSubscription`, `cancelSubscription`, `renewSubscription` in `billingAdminService` call `updateSubscriptionLifecycle`, which performs a direct `supabase.from('tenant_subscriptions').update(...)` with the new status/plan.

Evidence: `billingAdminService.ts` lines 57-116.

**Billing reminders**

- Cron `cron-admin-tasks` runs `runBillingReminders`, queries `tenant_subscriptions` for tenants expiring within 7 days, checks `billing_reminder_logs` to avoid duplicates, fetches owner email, then calls the `send-template-email` Edge Function up to 3 retries. Logs success/failure to `billing_reminder_logs` and `cron_job_logs`.

Evidence: `supabase/functions/cron-admin-tasks/index.ts` lines 75-196.

### 5.3 Members

**Search members**

- `tenantService.searchTenantMembers` / `searchMembers` calls `supabase.rpc('search_tenant_members', { p_tenant_id, p_search, p_role, p_status, ... })`.
- The RPC checks `is_system_admin()` or `is_tenant_admin()`, joins `tenant_memberships` with `auth.users` and `tenants`, applies filters, and returns paginated JSON.

Evidence: `tenantService.ts` lines 604-649; schema `search_tenant_members` lines 29795-29889.

**Toggle active / change role / remove**

- `tenantService.toggleMemberActive` calls `supabase.rpc('toggle_tenant_member_active', ...)`.
- `updateMemberRole` calls `supabase.rpc('update_tenant_member_role', ...)`.
- `removeMember` calls `supabase.rpc('remove_tenant_member', ...)`.
- The `trg_tenant_memberships_guardrails` trigger protects the owner and last admin on `DELETE` and `UPDATE`.

Evidence: `tenantService.ts` lines 228-237; schema `trg_tenant_memberships_guardrails` lines 30835-30923.

### 5.4 Analytics

- `getAdminRevenueMetrics` -> `supabase.rpc('get_revenue_metrics')` -> aggregates over `invoices`, `payments`, `tenant_subscriptions` -> maps to `RevenueMetrics`.
- `getAdminChurnCohortMetrics` -> `supabase.rpc('get_churn_cohort_metrics')` -> maps to churn/cohort/LTV/funnel.
- `getSystemOverview` -> `supabase.rpc('get_system_overview')`.
- `getTopTenants` -> `supabase.rpc('get_top_tenants')`.
- `getTenantGrowth` -> `supabase.rpc('get_tenant_growth')`.

All analytics RPCs require `is_system_admin()`. Evidence: `analyticsAdminService.ts` lines 18-115.

### 5.5 Audit

- `getAdminAuditLogs` performs a direct `supabase.from('audit_log').select('*', { count: 'exact' })` with optional filters and pagination, then maps with `mapAdminAuditLogFromDB`.
- `exportAuditLogs` fetches up to 10,000 rows and formats them as CSV or JSON in the browser, then triggers a download.

Evidence: `auditAdminService.ts` lines 32-169.

### 5.6 Compliance (GDPR)

- List requests: `getGdprRequests` -> `supabase.rpc('get_gdpr_requests')`.
- Create request: `createGdprRequest` -> `supabase.rpc('create_gdpr_request')` -> inserts `gdpr_requests`.
- Export: `getGdprExportData` -> `supabase.rpc('gdpr_export_user_data')` -> reads `auth.users`, `tenant_memberships`, `payments`, `audit_log`, `admin_login_history`, `terms_acceptance`.
- Delete: `deleteUserData` -> `supabase.rpc('gdpr_delete_user_data')` -> dry-run plans or executes anonymization of `auth.users`, deletion of `tenant_memberships` / `terms_acceptance` / `audit_log` / `admin_login_history`, and nullifies `payments.created_by`. Logs to `gdpr_deletion_logs`.
- Download: `downloadGdprExport` creates a client-side Blob and triggers a JSON download.

Evidence: `complianceAdminService.ts` lines 71-131; schema `gdpr_export_user_data` lines 34582-34679; schema `gdpr_delete_user_data` lines 34694-34822.

### 5.7 Security

- `getTenantSecuritySettings` -> `supabase.rpc('get_tenant_security_settings')`.
- `updateTenantIpAllowlist` -> `supabase.rpc('update_tenant_ip_allowlist')`.
- `updateTenantSessionTimeout` -> `supabase.rpc('update_tenant_session_timeout')`.
- `getLoginAttempts` -> `supabase.rpc('get_login_attempts')`.
- `getLockedEmails` -> `supabase.rpc('get_locked_emails')`.
- `unlockLoginAttempts` -> `supabase.rpc('unlock_login_attempts')`.

Evidence: `systemAdminService.ts` lines 140-202.

### 5.8 Notifications

- Realtime only. `useAdminRealtime` subscribes to `admin_events` table. Edge Functions and cron jobs insert rows into `admin_events` (type: `payment_failed`, `rls_violation`, `system_error`, `cron_job_failed`, `billing_reminder_sent`).
- The hook appends each `INSERT` to `events` state, caps at `maxNotifications` (default 50), and exposes `unreadCount`, `markAsRead`, `clearAll`.
- `AdminNotificationBell` consumes `useAdminRealtime`.

Evidence: `hooks/useAdminRealtime.ts` lines 18-80; schema `admin_events` table and realtime publication lines 34045-34107.

### 5.9 Storage

- Tenant assets live in the `tenant-assets` Supabase Storage bucket.
- `delete-tenant` Edge Function lists and removes objects under the tenant prefix before deleting the tenant.
- Backup and restore operate on table rows, not object storage.

Evidence: `supabase/functions/delete-tenant/index.ts` lines 98-128.

### 5.10 Monitoring

- `getSystemOverview` returns total/active/vip/expiring/near-limit/new-this-month tenants.
- `getRateLimitLogs` returns recent rate-limit events.
- `getTenantUsageSummary` returns per-tenant usage counts.
- These are rendered in the overview and health tabs.

Evidence: `tenantService.ts` lines 854-880; `systemAdminService.ts` lines 45-58.

### 5.11 Health

- `Health.tsx` renders `AdminDashboardInner` with `activeTab='health'`, which lazy-loads `SystemHealthPanel`.
- `admin-health-check` Edge Function is an external uptime endpoint; it creates a service-role client and executes a list of RPC health checks (`is_system_admin`, `is_tenant_admin`, `get_tenant_by_subdomain`), returning `{ ok, checkedAt, checks[] }`.

Evidence: `pages/admin/Health.tsx` lines 1-6; `supabase/functions/admin-health-check/index.ts` lines 36-79.

### 5.12 Configuration

- Default plan limits: `operationsService.getDefaultPlanLimits` / `setDefaultPlanLimits` -> `get_default_plan_limits` / `set_default_plan_limits` RPCs.
- Maintenance mode: `getMaintenanceMode` / `setMaintenanceMode` -> `get_maintenance_mode` / `set_maintenance_mode` RPCs.
- Data retention: `getDataRetentionStatus` -> `get_data_retention_status` RPC.
- Tenant feature flags: `tenantService.getTenantFeatureFlags` / `updateTenantFeatureFlags` -> `get_tenant_feature_flags` / `update_tenant_feature_flags` RPCs.
- Global config: `getGlobalConfig` / `setGlobalConfig` RPCs (read/write `system_settings` with key `global_config`).

Evidence: `operationsService.ts` lines 28-49; `tenantService.ts` lines 654-672; schema `get_global_config` / `set_global_config` lines 35347-35390.

---

## 6. React Execution Model

### 6.1 Component lifecycle

All admin UI is built with functional components. Providers mount first, then `AppContent`, then `AdminLayout`, then the matched child route. Heavy panels are loaded only when their tab is active (`React.lazy` + `Suspense`).

### 6.2 Hooks

- **State hooks**: `useState` for local UI state (forms, toasts, pagination, loading). `useRef` for request IDs and callback refs (e.g., `onEventRef`, `requestIdRef`, `loadedForUserId`).
- **Effect hooks**: `useEffect` for session initialization, tenant resolution, tab data loading, debounced search, viewport detection, and realtime subscription lifecycle.
- **Memoization**: `useMemo` for derived KPI cards, `useCallback` for stable event handlers and data loaders.
- **Custom hooks**: `useAuth`, `useTenant`, `useAdminList`, `useAdminRealtime`, `useConfirmDialog`, `useToast`, `useDebounce`.

Evidence: `hooks/useAdminList.ts` lines 36-123; `hooks/useAdminRealtime.ts` lines 18-80; `hooks/useConfirmDialog.tsx` lines 13-47; `hooks/useDebounce.ts` lines 3-17; `components/ToastContainer.tsx` lines 22-61.

### 6.3 State

- **Auth state** lives in `AuthContext` (`session`, `user`, `loading`, `mfaPending`).
- **Tenant state** lives in `TenantContext` (`tenant`, `membership`, `role`, `isReadOnly`, `isImpersonating`).
- **Page business state** lives in the page component (`overview`, `topTenants`, `growth`, `systemAdmins`, `rateLimitLogs`, etc.).
- **List state** is centralized in `useAdminList` (`page`, `pageSize`, `searchTerm`, `filters`, `data`, `totalCount`, `isLoading`, `error`).

### 6.4 Context

- `AuthProvider` and `TenantProvider` wrap `App` so all children can call `useAuth`/`useTenant`.
- `ToastProvider` is mounted only for admin routes inside `AppContent`.
- `useAdminRealtime` does not use a context; it returns state directly from a hook.

### 6.5 Memoization, lazy loading, and Suspense

- Admin routes are lazy-loaded with `React.lazy` and a common `AdminSuspense` fallback. <ref_snippet file="C:/PROJECT/vietsalepro/App.tsx" lines="68-91" />
- Inner panels (`SystemHealthPanel`, `StorageBackupPanel`, etc.) are lazy-loaded inside `AdminDashboardInner` with `LazyPanel`. <ref_snippet file="C:/PROJECT/vietsalepro/pages/admin/AdminDashboardInner.tsx" lines="57-77" />
- KPI cards are memoized: `useMemo(() => [...], [overview])`. <ref_snippet file="C:/PROJECT/vietsalepro/pages/admin/AdminDashboardInner.tsx" lines="396-403" />
- The `setUser` callback keeps the same user reference on token refresh to avoid cascading re-renders. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/AuthContext.tsx" lines="68-74" />

### 6.6 Re-render boundaries

- `AuthContext` value changes trigger all consumers. The user-reference guard minimizes this.
- `TenantContext` effect re-runs only when `user` changes.
- `AdminLayout` re-renders on every `location` change, but it only computes `activeId` and passes it down.
- `AdminDashboardInner` re-renders when `activeTab` or any of its local states change. Each tab's `useEffect` is gated by `activeTab`.
- Child page state updates are isolated; the shell does not re-fetch data on navigation.

---

## 7. Service Execution Model

### 7.1 Layered service orchestration

```
Admin page (e.g., AdminDashboardInner)
  ↓
Admin wrapper service (services/admin/*.ts)
  ↓
Base service (services/tenantService.ts, services/systemAdminService.ts, etc.)
  ↓
supabase client (lib/supabase.ts)
  ↓
PostgREST RPC or Edge Function
  ↓
Database / Auth / Storage
  ↓
Mapper (mapTenantFromDB, mapSubscriptionFromDB, normalizeRpcArray, etc.)
  ↓
Return typed object
  ↓
UI
```

**Wrapper services** are intentionally thin. `services/admin/tenantAdminService.ts` is a wrapper around `services/tenantService.ts`; it centralizes admin call sites and adapts naming. <ref_snippet file="C:/PROJECT/vietsalepro/services/admin/tenantAdminService.ts" lines="21-23" /> <ref_snippet file="C:/PROJECT/vietsalepro/services/admin/systemAdminService.ts" lines="1-62" />

**Base services** contain the actual Supabase interactions. `tenantService.ts` holds `createTenantWithCredentials`, `searchTenants`, `updateTenant`, `softDeleteTenant`, `hardDeleteTenant`, `startImpersonation`, `getSystemOverview`, `getTopTenants`, `getTenantGrowth`, etc. <ref_snippet file="C:/PROJECT/vietsalepro/services/tenantService.ts" lines="551-1050" />

### 7.2 Supabase client and `x-tenant-id`

`lib/supabase.ts` creates one typed client. `tenantFetch` intercepts every request and, if `currentTenantId` is set, adds the `x-tenant-id` header. This is the only mechanism that scopes Supabase calls to a tenant at the transport layer. <ref_snippet file="C:/PROJECT/vietsalepro/lib/supabase.ts" lines="14-34" />

### 7.3 Transformation, mapping, and error propagation

- Mappers: `mapTenantFromDB`, `mapSubscriptionFromDB`, `mapMembershipFromDB`, `mapAdminAuditLogFromDB`, `mapSystemAdmin`, `mapRateLimitLog`, etc.
- Response normalization: `normalizeRpcArray`, `normalizeRpcObject`, `normalizeRpcPaginated` in `utils/service.ts` handle both raw arrays and `{ data, count }` RPC shapes. <ref_snippet file="C:/PROJECT/vietsalepro/utils/service.ts" lines="12-35" />
- Errors propagate as thrown `Error` / `AppError` objects. Components catch them with `try/catch` and set `error` state. Edge Functions parse `FunctionsHttpError` contexts to extract readable messages. <ref_snippet file="C:/PROJECT/vietsalepro/services/tenantService.ts" lines="174-188" />

### 7.4 RPC vs Edge Function choice

- **RPC**: single-table or single-function CRUD, aggregations, permission checks (`is_system_admin`), list/search (`search_tenants`, `get_tenants_admin`, `update_tenant`, `delete_tenant_safe`, `gdpr_*`, `get_*_metrics`).
- **Edge Function**: multi-step orchestration, external API calls, service-role operations that need pre-validation, and tasks that cannot be done in a single RPC (`create-tenant`, `delete-tenant`, `impersonate-tenant`, `end-impersonation`, `tenant-backup`, `tenant-restore`, `verify-domain`, `cron-admin-tasks`, `send-billing-email`).

---

## 8. RPC Execution Model

Important RPCs and their runtime behavior:

| RPC | Caller | Validation | Execution | Tables | Triggers / Audit | Return | Consumers |
|-----|--------|------------|-----------|--------|------------------|--------|-----------|
| `is_system_admin()` | `lib/permissions.ts`, many RPCs | `SECURITY DEFINER`, checks `public.system_admins` | `SELECT EXISTS(...)` | `system_admins` | None | `boolean` | Permission checks system-wide |
| `is_tenant_admin(p_tenant_id)` | Permission checks | `SECURITY DEFINER`, checks `tenant_memberships` role='admin' | `SELECT EXISTS(...)` | `tenant_memberships` | None | `boolean` | Tenant-scoped permission checks |
| `get_tenants_admin(...)` | `tenantService.getTenantsAdmin` | `SECURITY INVOKER`, requires `is_system_admin()` | Paginated `SELECT` from `tenants` with search/filter/sort | `tenants` | `trg_audit_log_tenants` on mutations (not on SELECT) | `{ data, total }` JSON | `Tenants` page |
| `search_tenants(...)` | `tenantService.searchTenants` | `SECURITY INVOKER`, requires `is_system_admin()` | `SELECT` + status counts | `tenants` | None | `{ tenants, totalCount, counts }` | `tenantAdminService.listAccounts` |
| `create_tenant_with_admin(...)` | `tenantService.createTenantWithAdmin` | `SECURITY INVOKER`, requires `is_system_admin()` | Insert `tenants`, `tenant_subscriptions`, `tenant_memberships` | `tenants`, `tenant_subscriptions`, `tenant_memberships` | `trg_audit_log_tenants` | `tenants` row | Tenant creation flow |
| `update_tenant(...)` | `tenantService.updateTenant` | `SECURITY INVOKER`, requires `is_system_admin()`, validates plan/status/isolation/custom-domain | `UPDATE tenants` | `tenants` | `set_tenant_record_user_tracking` (created_by/updated_by), `trg_audit_log_tenants` | `tenants` row | Tenant edit / detail |
| `set_tenant_subdomain(...)` | `tenantAdminService.setTenantSubdomain` | `SECURITY DEFINER`, requires `is_system_admin()`, validates format, reserved list, uniqueness | `UPDATE tenants`, manual `INSERT audit_log` | `tenants`, `audit_log` | Manual audit log | `tenants` row | Subdomain manager |
| `delete_tenant_safe(p_tenant_id)` | `tenantService.softDeleteTenant` | `SECURITY INVOKER`, requires `is_system_admin()` | `UPDATE tenants SET status='archived'` | `tenants` | `trg_audit_log_tenants` | `tenants` row | Soft delete |
| `update_tenant_subscription(...)` | `tenantService.updateTenantSubscription` | `SECURITY INVOKER`, requires `is_system_admin()`, applies default plan limits if plan changed | `UPDATE tenant_subscriptions`, `UPDATE tenants` | `tenant_subscriptions`, `tenants` | `trg_audit_log_tenant_subscriptions` | `tenant_subscriptions` row | Billing manager |
| `search_tenant_members(...)` | `tenantService.searchTenantMembers` | `SECURITY DEFINER`, requires `is_system_admin()` or `is_tenant_admin()` | Join `tenant_memberships` + `auth.users` + `tenants` | `tenant_memberships`, `auth.users`, `tenants` | None | `{ items, total_count }` | Members page |
| `add_system_admin(p_user_id)` | `systemAdminService.addSystemAdmin` | `SECURITY DEFINER`, requires `is_system_admin()`, checks `auth.users` | `INSERT INTO system_admins` | `system_admins` | None | `system_admins` row | System admin panel |
| `remove_system_admin(p_user_id)` | `systemAdminService.removeSystemAdmin` | `SECURITY DEFINER`, requires `is_system_admin()` | `DELETE FROM system_admins` | `system_admins` | None | void | System admin panel |
| `record_admin_login(...)` | `loginHistoryService.recordAdminLogin` | `SECURITY DEFINER`, validates status, parses IP, ensures user is system admin for successes | `INSERT INTO admin_login_history` | `admin_login_history` | None | `UUID` | AuthContext on SIGNED_IN |
| `get_admin_login_history(...)` | `loginHistoryService.getAdminLoginHistory` | `SECURITY INVOKER`, requires `is_system_admin()` | `SELECT` with filters/pagination | `admin_login_history` | None | `{ data, count }` | Login history tab |
| `get_admin_login_alerts(...)` | `loginHistoryService.getAdminLoginAlerts` | `SECURITY INVOKER`, requires `is_system_admin()` | Aggregates failed bursts, new devices, rapid logins | `admin_login_history` | None | `{ failed_burst, new_device, rapid_login }` | Security alerts |
| `gdpr_export_user_data(p_user_id)` | `complianceAdminService.getGdprExportData` | `SECURITY DEFINER`, requires `is_system_admin()` | Reads `auth.users`, `tenant_memberships`, `payments`, `audit_log`, `admin_login_history`, `terms_acceptance` | Multiple user-scoped tables | None | JSON export blob | Compliance page |
| `gdpr_delete_user_data(p_user_id, p_dry_run)` | `complianceAdminService.deleteUserData` | `SECURITY DEFINER`, requires `is_system_admin()` | Anonymizes `auth.users`; deletes `tenant_memberships`, `terms_acceptance`, `audit_log`, `admin_login_history`; nullifies `payments.created_by`; logs to `gdpr_deletion_logs` | User-scoped tables | None (manual logging) | `{ dry_run, request_id, planned/executed_actions }` | Compliance page |
| `get_revenue_metrics(...)` | `analyticsAdminService.getAdminRevenueMetrics` | `SECURITY INVOKER`, requires `is_system_admin()` | Aggregates `invoices`/`payments`/`tenant_subscriptions` | `invoices`, `payments`, `tenant_subscriptions` | None | `{ mrr, arr, total_revenue, revenue_by_plan, period_start, period_end }` | Analytics page |
| `get_churn_cohort_metrics(...)` | `analyticsAdminService.getAdminChurnCohortMetrics` | `SECURITY INVOKER`, requires `is_system_admin()` | Cohort / churn / LTV / funnel aggregation | `tenant_subscriptions`, `invoices`, `payments` | None | `{ churn, cohort, ltv, funnel }` | Analytics page |
| `get_system_overview(...)` | `tenantService.getSystemOverview` | `SECURITY INVOKER`, requires `is_system_admin()` | Counts and aggregations over `tenants` and `tenant_subscriptions` | `tenants`, `tenant_subscriptions` | None | JSON overview | Overview tab |
| `get_top_tenants(...)` | `tenantService.getTopTenants` | `SECURITY INVOKER`, requires `is_system_admin()` | Orders tenants by orders this month | `tenants` | None | `{ data, count }` | Overview tab |
| `get_tenant_growth(...)` | `tenantService.getTenantGrowth` | `SECURITY INVOKER`, requires `is_system_admin()` | Monthly tenant counts | `tenants` | None | `TenantGrowthPoint[]` | Overview tab |
| `get_or_create_custom_domain_token(...)` | Edge `verify-domain` | `SECURITY DEFINER` | `UPDATE tenants` setting `custom_domain_verification_token` | `tenants` | None | `TEXT` token | Custom domain panel |
| `get_tenant_backup_tables(...)` | Edge `tenant-backup` | `SECURITY INVOKER` / service role | Returns ordered list of tenant-scoped tables | Metadata | None | Table list | Backup |
| `restore_tenant_tables(...)` | Edge `tenant-restore` | `SECURITY DEFINER` | Snapshots existing rows, deletes in reverse dependency order, inserts backup rows in dependency order | All tenant-scoped tables | Manual logging to `tenant_restore_snapshots` | JSON result | Restore |

---

## 9. Edge Function Execution

Every admin-relevant Edge Function follows the same runtime skeleton:

```
HTTP request (OPTIONS or POST/GET)
  ↓
CORS preflight handled
  ↓
Read SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  ↓
Create service-role Supabase client
  ↓
Extract Authorization: Bearer <token>
  ↓
supabaseAdmin.auth.getUser(token) → user
  ↓
Permission check (system_admins query or checkIsSystemAdmin / checkIsTenantAdmin)
  ↓
Request body validation
  ↓
Rate-limit check (rate_limit_logs) when exposed to anonymous/public calls
  ↓
Database operations using service role (bypasses RLS)
  ↓
Manual audit log insert (app_audit_log) where no trigger covers the action
  ↓
JSON response
```

### 9.1 `create-tenant`

- Caller: `tenantService.createTenantWithCredentials`.
- Auth: Bearer token, then `checkIsSystemAdmin`.
- Validation: rate limit (10 req/min/IP), name, email, subdomain format, plan in (`free`, `vip`).
- Service role: yes.
- External APIs: none directly; calls `supabaseAdmin.auth.admin.generateLink` for password reset.
- DB: `auth.users` (create), `tenants`, `tenant_subscriptions`, `tenant_memberships`, `tenant_credentials`, `app_audit_log`.
- Response: `{ tenant, adminUser, resetEmailSent, redirectTo }`.

Evidence: `supabase/functions/create-tenant/index.ts` lines 31-265.

### 9.2 `delete-tenant`

- Caller: `tenantService.hardDeleteTenant`.
- Auth: Bearer token + `checkIsSystemAdmin` or `checkIsTenantOwner`.
- Soft delete path: `UPDATE tenants SET status='archived'`.
- Hard delete path: list/remove `tenant-assets` storage objects, delete orphan rows from `app_audit_log` and `terms_acceptance`, `DELETE FROM tenants` (CASCADE FKs), delete orphan auth users.
- Response: `{ success, action, tenant, storageDeleted, storageFailures, authDeleted, authFailures }`.

Evidence: `supabase/functions/delete-tenant/index.ts` lines 31-305.

### 9.3 `verify-domain`

- Caller: `tenantAdminService.requestCustomDomainVerification` / `verifyCustomDomain`.
- Auth: Bearer token + system admin or tenant admin.
- External API: `https://dns.google/resolve?name=...&type=TXT` with 10s timeout.
- DB: `get_or_create_custom_domain_token`, `UPDATE tenants SET custom_domain_verified_at`.
- Response: `{ token, txtRecord }` or `{ verified, message }`.

Evidence: `supabase/functions/verify-domain/index.ts` lines 59-163.

### 9.4 `impersonate-tenant` and `end-impersonation`

- `impersonate-tenant`: creates a temporary `tenant_memberships` row with `impersonated_by` set to the system admin's user ID and a 1-hour expiry; writes `app_audit_log` `IMPERSONATE`.
- `end-impersonation`: finds all active impersonation rows for the user, writes `IMPERSONATE_END` audit rows including duration, then deletes the rows.

Evidence: `supabase/functions/impersonate-tenant/index.ts`; `supabase/functions/end-impersonation/index.ts`.

### 9.5 `tenant-backup` and `tenant-restore`

- `tenant-backup`: system admin check, reads tenant row, calls `get_tenant_backup_tables`, paginates `SELECT *` per tenant-scoped table (1000 rows/page), returns JSON with `Content-Disposition` header.
- `tenant-restore`: system admin check, calls `restore_tenant_tables` RPC which snapshots, deletes in reverse order, and inserts in dependency order.

Evidence: `supabase/functions/tenant-backup/index.ts`; `supabase/functions/tenant-restore/index.ts`; schema `restore_tenant_tables` lines 24676-24795.

### 9.6 `cron-admin-tasks`

- Caller: `pg_cron` via `pg_net`, or manual with `X-Internal-Secret` / service-role Bearer.
- Jobs: `billing_reminders` and `audit_cleanup`.
- `billing_reminders`: scans `tenant_subscriptions` for expiring tenants, deduplicates against `billing_reminder_logs`, fetches owner email, calls `send-template-email` with retry, logs to `billing_reminder_logs` and `cron_job_logs`.
- `audit_cleanup`: deletes `audit_log` rows older than 90 days.
- All outcomes are inserted into `admin_events` for realtime broadcast.

Evidence: `supabase/functions/cron-admin-tasks/index.ts` lines 28-232.

### 9.7 `admin-health-check`

- Caller: external uptime monitor (not the UI).
- Auth: none required; uses `SUPABASE_SERVICE_ROLE_KEY`.
- Executes a fixed list of safe RPCs and returns `{ ok, checkedAt, checks[] }`.

Evidence: `supabase/functions/admin-health-check/index.ts` lines 36-79.

### 9.8 `billing-webhooks`

- Caller: Stripe / MoMo / VNPay / bank-transfer webhooks.
- Auth: provider-specific signature verification (Stripe HMAC-SHA256).
- Current implementation has stub handlers; it acknowledges the webhook but does not perform DB writes.

Evidence: `supabase/functions/billing-webhooks/index.ts`.

### 9.9 `send-billing-email`

- Caller: `cron-admin-tasks` or manual admin action.
- Auth: `X-Internal-Secret`, service-role Bearer, or system admin.
- External API: `https://api.resend.com/emails`.
- DB: reads `invoices`, `bank_accounts`, `system_settings`; logs to `invoice_reminder_logs`.

Evidence: `supabase/functions/send-billing-email/index.ts`.

---

## 10. Database Execution

### 10.1 Tables and RLS

All business tables have Row Level Security enabled. Representative admin-relevant tables:

- `public.tenants` — tenant records; RLS: `tenant_member_view_own`, `system_admin_manage_tenants`.
- `public.tenant_memberships` — user membership and role; RLS: `tenant_membership_member_view_own`, `tenant_admin_manage_memberships`.
- `public.tenant_subscriptions` — per-tenant subscription limits; RLS: `tenant_subscription_member_view`, `system_admin_manage_subscriptions`.
- `public.system_admins` — global admin grants; RLS: `system_admin_manage_system_admins`.
- `public.audit_log` / `public.app_audit_log` — audit trail; RLS: `audit_log_tenant_admin`.
- `public.admin_login_history` — admin login history; RLS for system admins.
- `public.rate_limit_logs` — rate-limit counters; RLS for system admins.
- `public.gdpr_requests`, `public.gdpr_deletion_logs` — GDPR workflow.
- `public.admin_events` — realtime broadcast events; RLS: `admin_events_select_admin` / `admin_events_insert_admin`.
- `public.system_settings` — global key/value config; RLS for system admins.
- `public.cron_job_logs`, `public.billing_reminder_logs` — cron and billing job logs.

Evidence: schema `ENABLE ROW LEVEL SECURITY` statements lines 1461-1598; policy definitions lines 13885-14570.

### 10.2 Triggers

- `set_tenant_record_user_tracking` on `tenants`, `products`, `orders`, `customers`, `suppliers`, `categories`, `brands`: sets `created_by` and `updated_by` to `auth.uid()`. <ref_snippet file="C:/PROJECT/vietsalepro/supabase/schema.sql" lines="31717-31738" />
- `trg_tenant_memberships_guardrails` on `tenant_memberships` BEFORE DELETE OR UPDATE: protects owner deletion, last-admin deletion, owner role change, last-admin demotion, and last-admin deactivation. <ref_snippet file="C:/PROJECT/vietsalepro/supabase/schema.sql" lines="30835-30923" />
- `trg_tenants_before_delete` on `tenants` BEFORE DELETE: sets `app.hard_delete_tenant` to `'true'` so the membership guardrail skips checks during cascade. <ref_snippet file="C:/PROJECT/vietsalepro/supabase/schema.sql" lines="30069-30086" />
- `audit_log_trigger` on `tenants` (and other tables): after INSERT/UPDATE/DELETE, writes `old_data`/`new_data` to `public.audit_log` with `actor_id = auth.uid()`. <ref_snippet file="C:/PROJECT/vietsalepro/supabase/schema.sql" lines="34004-34035" />
- `trg_audit_log_tenant_subscriptions` on `tenant_subscriptions`: similar audit for subscription changes. <ref_snippet file="C:/PROJECT/vietsalepro/supabase/schema.sql" lines="33355-33379" />
- `handle_new_user` on `auth.users` AFTER INSERT: auto-creates a personal free tenant and owner membership. <ref_snippet file="C:/PROJECT/vietsalepro/supabase/schema.sql" lines="31744-31773" />
- `tenant_registration_event_trigger` on `tenants` AFTER INSERT: business analytics hook.

### 10.3 Functions and roles

- `is_system_admin()` — `SECURITY DEFINER`, central gate.
- `is_tenant_admin(p_tenant_id)` — `SECURITY DEFINER`.
- `is_tenant_owner(p_tenant_id)` — `SECURITY DEFINER`.
- `has_tenant_role(p_tenant_id, p_role)` — `SECURITY DEFINER`.
- `is_tenant_writable(p_tenant_id)` — active or trial status check.

Evidence: schema lines 9885-9919.

### 10.4 Transactions and execution ordering

- **RPC functions** run inside a single database transaction implicitly. All DML statements in `create_tenant_with_admin`, `update_tenant`, `update_tenant_subscription`, `gdpr_delete_user_data`, and `restore_tenant_tables` are atomic; if any step raises, the whole RPC rolls back.
- **Edge Functions** do **not** run in a single database transaction across multiple `await` calls. Each call is independent. For example `create-tenant` performs `auth.admin.createUser`, then several `INSERT` calls; a failure after user creation will leave partial state unless the Edge Function catches and compensates. The code currently inserts each table sequentially and lets errors throw.
- **Trigger ordering**: `BEFORE` triggers run first (`set_tenant_record_user_tracking`, `trg_tenant_memberships_guardrails`, `trg_tenants_before_delete`), then the DML, then `AFTER` triggers (`audit_log_trigger`, `tenant_registration_event_trigger`).

### 10.5 Constraint execution

- `app_audit_log.action` is constrained to `INSERT`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `EXPORT`.
- `audit_log.action` (Postgres) is expanded to include `impersonation_start`, `impersonation_stop`, etc. <ref_snippet file="C:/PROJECT/vietsalepro/supabase/schema.sql" lines="35119-35140" />
- `admin_events.type` is constrained to `payment_failed`, `rls_violation`, `system_error`, `cron_job_failed`, `billing_reminder_sent`.
- `rate_limit_logs.action` is constrained to `login`, `create_tenant`, `check_subdomain`, `invite_member`.

---

## 11. Realtime Execution

The admin dashboard consumes realtime events through `public.admin_events`.

### 11.1 Database → Realtime

1. An admin-relevant event occurs (cron job, billing reminder, security issue, etc.).
2. The code `INSERT INTO public.admin_events (type, severity, message, metadata)`.
3. `public.admin_events` is part of the `supabase_realtime` publication.
4. Supabase Realtime broadcasts the insert to subscribed clients.

Evidence: schema `admin_events` table and publication lines 34045-34107; `supabase/functions/cron-admin-tasks/index.ts` lines 28-45.

### 11.2 Channel → React

1. `useAdminRealtime` creates `supabase.channel('admin-events')`.
2. It listens to `postgres_changes` `INSERT` on `public.admin_events`.
3. On each payload it builds an `AdminEvent`, applies `filterTypes` if configured, caps the list at `maxNotifications`, and calls `setEvents`.
4. `onEventRef.current?.(event)` allows parent components to react to the event immediately.
5. The hook returns `events`, `unreadCount`, `markAsRead`, `clearAll`.

Evidence: `hooks/useAdminRealtime.ts` lines 27-69.

### 11.3 UI refresh

- `AdminNotificationBell` consumes `useAdminRealtime` and re-renders when `events` or `unreadCount` changes.
- Realtime messages do not directly mutate business data; they notify the admin, who can refresh the relevant tab manually or trigger a `refresh()` from `useAdminList`.

---

## 12. State Transition Model

### 12.1 Auth State

- **Creation**: `AuthProvider` mount runs `supabase.auth.getSession()` and `onAuthStateChange` subscription.
- **Mutation**:
  - `SIGNED_IN` → `session`/`user` set, `mfaPending` possibly set, login audit/membership activation run.
  - `TOKEN_REFRESHED` → `session` updated, `user` reference preserved.
  - `SIGNED_OUT` → `session`/`user` null.
- **Destruction**: unmount unsubscribes from `onAuthStateChange`.
- **Ownership**: `AuthContext`.

### 12.2 Tenant State

- **Creation**: `TenantProvider` effect runs on mount and on `user` change; calls `getSubdomain()` and `get_tenant_by_subdomain`.
- **Mutation**:
  - Subdomain resolved → `tenant` set, `currentTenantId` set, membership fetched.
  - Admin host / no subdomain → `tenant` null, `currentTenantId` null, `membership` null.
  - User logged out → effect re-runs with `user` null; `membership` null.
- **Destruction**: `cancelled` flag prevents state updates after unmount; state resets on cleanup.
- **Ownership**: `TenantContext`.

### 12.3 Permission State

- **Creation**: `AppContent` effect creates `isSystemAdmin`/`isAdminLoading` when `user` or `location.pathname` changes and the admin path is active.
- **Mutation**: `system_admins` query result sets `isSystemAdmin`; effect cleanup uses `cancelled` flag.
- **Destruction**: state discarded on unmount.
- **Ownership**: `AppContent` local state; not persisted.

### 12.4 UI State

- **Creation**: `useState` calls in components/hooks.
- **Mutation**: handlers and effects update `isLoading`, `error`, `success`, `page`, `searchTerm`, `activeTab`, `data`, etc.
- **Destruction**: React unmounts components and releases state.
- **Ownership**: per-component. `useAdminList` encapsulates list state. `useConfirmDialog` encapsulates modal state. `ToastProvider` owns toast list.

### 12.5 Business State

- **Creation**: page `useEffect` loaders create business state (e.g., `overview`, `topTenants`, `systemAdmins`).
- **Mutation**: successful service calls update state; errors set `error` and often clear data.
- **Destruction**: unmount clears local state; global business state does not persist across navigation except what remains in `AuthContext`/`TenantContext`.
- **Ownership**: page components and `useAdminList`.

---

## 13. Synchronization Model

### 13.1 React ↔ Supabase

- Every service call uses the single `supabase` client from `lib/supabase.ts`.
- `currentTenantId` is a module-level variable set by `TenantContext`. `tenantFetch` adds `x-tenant-id` to every outgoing request, so PostgREST RLS policies can resolve the active tenant. <ref_snippet file="C:/PROJECT/vietsalepro/lib/supabase.ts" lines="14-28" /> <ref_snippet file="C:/PROJECT/vietsalepro/contexts/TenantContext.tsx" lines="82-85" />
- Admin RPCs that are not tenant-scoped (e.g., `is_system_admin`, `get_tenants_admin`) ignore `x-tenant-id` and rely on `auth.uid()`.

### 13.2 Supabase ↔ Database

- PostgREST executes SQL on each request within the context of the authenticated role (`authenticated` or `service_role`).
- RLS policies evaluate `auth.uid()`, `current_tenant_id()`, `is_system_admin()`, and `is_tenant_member()`.
- `SECURITY DEFINER` RPCs execute with the privileges of the function owner, allowing reads like `auth.users` or cross-tenant aggregations while the invoker check (`is_system_admin()`) still gates access.

### 13.3 Database ↔ Realtime → React

- `admin_events` is in the `supabase_realtime` publication.
- `useAdminRealtime` opens a channel, subscribes, and pushes events into React state.
- Channel errors are logged with `console.warn`; the hook continues running.

### 13.4 Request cancellation and consistency

- `TenantProvider` uses a `cancelled` flag to ignore stale membership results. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/TenantContext.tsx" lines="51-65" />
- `useAdminList` uses `requestIdRef` to ignore stale list responses. <ref_snippet file="C:/PROJECT/vietsalepro/hooks/useAdminList.ts" lines="70-100" />
- `AppContent` uses `loadedForUserId` ref to avoid re-fetching operational data for the same user+tenant. <ref_snippet file="C:/PROJECT/vietsalepro/App.tsx" lines="176-192" />

---

## 14. Execution Boundaries

### 14.1 Frontend ↔ Backend

- The browser runs React and service code. No direct `supabase` calls from components; all privileged mutations go through `services` and `lib/supabase.ts`.
- The boundary is HTTP/PostgREST or Edge Function invocation.

### 14.2 Backend ↔ Database

- Edge Functions run in Deno and use a service-role Supabase client to bypass RLS. They still validate the caller before executing.
- RPCs run inside Postgres. Some use `SECURITY INVOKER` and rely on RLS; others use `SECURITY DEFINER` and explicitly call `is_system_admin()`.

### 14.3 Database ↔ Realtime

- `admin_events` is the bridge: backend writes rows, Supabase Realtime pushes changes to clients.
- RLS `admin_events_select_admin` ensures only system admins receive these events.

### 14.4 Backend ↔ External APIs

- `verify-domain` calls `dns.google`.
- `send-billing-email` calls `api.resend.com`.
- `cron-admin-tasks` calls the `send-template-email` Edge Function.
- `billing-webhooks` receives Stripe / MoMo / VNPay callbacks.

### 14.5 Auth boundary

- `AuthProvider` owns the Supabase session. `AppContent` enforces the system-admin gate before rendering admin routes. Every RPC/Edge re-validates the caller.

---

## 15. Execution Timeline

### 15.1 Application Startup

1. Browser fetches `index.html`.
2. `index.tsx` creates root, wraps `App`.
3. `AuthProvider` gets session and subscribes.
4. `TenantProvider` resolves subdomain and membership.
5. `AppContent` checks `isSystemAdmin`.
6. Loading screen dismissed.
7. Admin route tree lazy-loads and renders.
8. First page (`/admin/overview`) mounts and fires `loadOverview()`.

### 15.2 Admin Login

1. Supabase emits `SIGNED_IN`.
2. `AuthProvider` sets session/user.
3. `checkMfaAsync` runs; if MFA required, `MfaChallenge` rendered.
4. `recordAdminLogin` inserts `admin_login_history`.
5. `writeAuditLog('LOGIN')` is attempted (skipped if no tenant context).
6. `activate_pending_memberships` RPC runs.
7. `TenantProvider` re-fetches membership.
8. `AppContent` re-checks `isSystemAdmin` and renders dashboard.

### 15.3 Tenant Creation

1. Admin submits form in `Tenants` page.
2. `tenantAdminService.createAccount` -> `tenantService.createTenantWithCredentials`.
3. `supabase.functions.invoke('create-tenant')`.
4. Edge validates system admin and rate limit.
5. `auth.admin.createUser`.
6. `INSERT tenants`, `tenant_subscriptions`, `tenant_memberships`, `tenant_credentials`.
7. `INSERT app_audit_log`.
8. Password reset link generated.
9. Success response mapped and UI updated.

### 15.4 Tenant Update

1. Admin edits tenant in `TenantDetail` or `Tenants`.
2. `tenantAdminService.updateAccountStatus` / `setTenantSubdomain` / `updateTenant`.
3. `supabase.rpc('update_tenant' or 'set_tenant_subdomain')`.
4. RPC validates `is_system_admin()` and field rules.
5. `UPDATE tenants`.
6. BEFORE trigger sets `updated_by`; AFTER trigger writes `audit_log`.
7. Mapped row returned; UI refreshes.

### 15.5 Member Invitation

1. Admin enters email and role in members page.
2. `tenantService.inviteMemberByEmail`.
3. `supabase.functions.invoke('invite-member')`.
4. Edge validates inviter role and tenant limits.
5. Creates/invites user, inserts `tenant_memberships` (status `pending`).
6. Sends invitation email.
7. On login, `activate_pending_memberships` sets status `active`.

### 15.6 Subscription Update

1. Admin changes plan or limits in billing/tenant panel.
2. `billingAdminService.updateTenantSubscription` -> `tenantService.updateTenantSubscription`.
3. `supabase.rpc('update_tenant_subscription')`.
4. RPC validates `is_system_admin()`; if plan changed, applies default limits.
5. `UPDATE tenant_subscriptions` and `UPDATE tenants.plan`.
6. Trigger writes `audit_log` for `tenant_subscriptions`.
7. Mapped subscription returned.

### 15.7 Backup

1. Admin clicks backup for a tenant.
2. `tenantBackupService.downloadTenantBackup`.
3. `supabase.functions.invoke('tenant-backup')`.
4. Edge validates system admin, reads tenant.
5. `get_tenant_backup_tables` returns ordered table list.
6. Edge paginates `SELECT * FROM each_table WHERE tenant_id = ?`.
7. Response assembled and returned with `Content-Disposition`; browser downloads JSON.

### 15.8 Restore

1. Admin uploads a backup JSON and confirms.
2. `tenantRestoreService.restoreTenantBackup`.
3. `supabase.functions.invoke('tenant-restore')`.
4. Edge validates system admin.
5. Calls `restore_tenant_tables` RPC.
6. RPC snapshots existing data, deletes in reverse dependency order, inserts in forward order, overriding `tenant_id`.
7. Result returned; UI shows restored tables and errors.

### 15.9 GDPR Export

1. Admin opens compliance, selects user, requests export.
2. `complianceAdminService.getGdprExportData`.
3. `supabase.rpc('gdpr_export_user_data')`.
4. RPC validates `is_system_admin()` and reads `auth.users`, `tenant_memberships`, `payments`, `audit_log`, `admin_login_history`, `terms_acceptance`.
5. JSON returned; `downloadGdprExport` creates a blob and triggers browser download.

### 15.10 Notification

1. Cron or security event inserts into `admin_events`.
2. Supabase Realtime broadcasts the insert.
3. `useAdminRealtime` receives the payload.
4. `setEvents` prepends the event, enforcing `maxNotifications` cap.
5. `AdminNotificationBell` re-renders; `unreadCount` increases.

### 15.11 Health Check

1. External monitor requests `admin-health-check` Edge Function.
2. Edge creates service-role client.
3. Runs a fixed list of safe RPC checks.
4. Collects `ok` status and latency for each.
5. Returns `{ ok, checkedAt, checks[] }` with HTTP 200 or 503.

---

## 16. Execution Failure Boundaries

### 16.1 Permission denied

- `is_system_admin()` returns `false` or an RPC raises `insufficient_privilege`.
- PostgREST returns a permission error; service throws; component `catch` sets `error` state.
- Edge Functions return `403` with a localized message.

### 16.2 RPC failure

- Validation or missing data inside an RPC raises an exception.
- The plpgsql function rolls back the implicit transaction for that RPC.
- Service propagates the error message; UI displays `err.message` or a fallback.

### 16.3 Edge timeout

- `verify-domain` DNS lookup aborts after 10s and returns `504`.
- Long backup/restore operations may exceed Edge Function limits; no retry is shown in code.
- Cron `send-template-email` retries up to 3 times with 1s sleep between attempts.

### 16.4 Validation failure

- Frontend does lightweight validation (e.g., email contains `@`, password length). <ref_snippet file="C:/PROJECT/vietsalepro/pages/admin/AdminDashboardInner.tsx" lines="323-338" />
- Backend RPCs/Edge perform canonical validation and return `400` with a specific message.
- Example: `set_tenant_subdomain` rejects reserved subdomains or duplicates; `update_tenant` rejects custom domain for free plan.

### 16.5 Transaction rollback

- RPC functions are atomic; a failed `INSERT` in `create_tenant_with_admin` rolls back all prior inserts.
- Edge Functions are **not** atomic across multiple `await` calls. Partial failure (e.g., user created but tenant insert fails) may require manual cleanup.

### 16.6 RLS rejection

- Direct `from('tenants')` queries from the client are rejected if the authenticated user fails RLS (e.g., not a tenant member or system admin).
- Services catch `PGRST116` (no rows) and return `null` where appropriate. <ref_snippet file="C:/PROJECT/vietsalepro/services/tenantService.ts" lines="894-905" />

### 16.7 Realtime disconnect

- `useAdminRealtime` logs `CHANNEL_ERROR` or `TIMED_OUT` to `console.warn` and keeps running.
- Events are missed while disconnected; no persistent queue is maintained on the client.

---

## 17. Execution Hotspots

The following runtime points execute frequently and are critical to performance and correctness:

1. **`AuthContext`**: runs on every auth state change, including background token refresh. The user-reference guard is essential to avoid cascading re-renders. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/AuthContext.tsx" lines="60-74" />
2. **`TenantContext`**: re-runs whenever `user` changes; cancels stale loads. <ref_snippet file="C:/PROJECT/vietsalepro/contexts/TenantContext.tsx" lines="50-115" />
3. **`lib/supabase.ts` `tenantFetch`**: runs on every Supabase request, adding `x-tenant-id`. Called by every base service. <ref_snippet file="C:/PROJECT/vietsalepro/lib/supabase.ts" lines="24-28" />
4. **`AppContent` `isSystemAdmin` effect**: queries `system_admins` on every `user` or `location.pathname` change inside admin routes. <ref_snippet file="C:/PROJECT/vietsalepro/App.tsx" lines="195-226" />
5. **`AdminDashboardInner` overview tab**: fires 3 RPCs in parallel (`getSystemOverview`, `getTopTenants`, `getTenantGrowth`) on mount. <ref_snippet file="C:/PROJECT/vietsalepro/pages/admin/AdminDashboardInner.tsx" lines="162-179" />
6. **`useAdminList`**: debounced search can fire many loads; `requestIdRef` cancels stale responses. <ref_snippet file="C:/PROJECT/vietsalepro/hooks/useAdminList.ts" lines="70-100" />
7. **`tenantService.ts`**: the most-used base service for tenant CRUD, search, overview, and growth. Heavily called by `tenantAdminService` and `systemAdminService`.
8. **`is_system_admin` RPC**: called implicitly by nearly every admin RPC.
9. **`admin_events` realtime channel**: every insert triggers `setEvents` in `useAdminRealtime`; capped at 50 events to prevent memory bloat. <ref_snippet file="C:/PROJECT/vietsalepro/hooks/useAdminRealtime.ts" lines="49-53" />
10. **Edge `cron-admin-tasks`**: runs on schedule, scans subscriptions, and may generate many `admin_events` and `billing_reminder_logs` rows.

---

## 18. Execution Summary

The VietSale Pro Admin Dashboard is a single React SPA whose runtime execution is governed by a strict layering contract. At boot, `AuthProvider` resolves the Supabase session, `TenantProvider` resolves the current tenant and sets the global `x-tenant-id` header, and `AppContent` gates the admin route tree behind a `system_admins` check. Once inside, navigation is handled by `BrowserRouter` → `AdminLayout` → `AdminShell` → `Outlet`, with pages and heavy panels loaded lazily through `Suspense`.

Every privileged action follows the same path: the React page calls an `services/admin/*` wrapper, the wrapper delegates to a `services/*` base service, the base service uses the typed `supabase` client from `lib/supabase.ts`, and the call reaches Supabase as a Postgres RPC or an Edge Function. The backend is the security boundary: `SECURITY DEFINER` and `SECURITY INVOKER` RPCs, RLS policies, and Edge Function caller verification enforce the system-admin gate. Database triggers maintain audit trails and guardrails (owner/last-admin protection, created_by/updated_by tracking) while `admin_events` + Supabase Realtime push notifications to the `useAdminRealtime` hook.

State is split by ownership: `AuthContext` owns session/user, `TenantContext` owns tenant/membership, page components own business data, and `useAdminList` owns list UI state. Synchronization is mediated by the shared Supabase client, the tenant header, and request-cancellation guards. Edge Functions handle orchestration and external integrations (DNS, Resend, payment webhooks, cron jobs), while the database enforces atomicity for multi-step operations inside RPCs.

In short, the dashboard executes as a thin React shell over a Supabase-backed backend: presentation and local UI state live in the browser, but every meaningful mutation and permission decision is executed on the server.
