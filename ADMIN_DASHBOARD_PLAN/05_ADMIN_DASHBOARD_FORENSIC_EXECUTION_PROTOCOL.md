# Admin Dashboard Forensic Execution Protocol

## 0. Purpose and Authority

This document is the operational execution manual for the VietSale Pro Admin Dashboard forensic investigation. It does not perform analysis, report findings, or prescribe remediation. It defines the step-by-step, repeatable procedures that any investigator must follow when executing the investigation described in `04_ADMIN_DASHBOARD_INVESTIGATION_PLAN.md`.

### 0.1 Authoritative Baselines

Read these documents in full before executing this protocol. Do not redefine or summarize them; use them as the foundation for every trace and evidence record.

| Baseline | Role in this protocol |
|----------|----------------------|
| `ADMIN_DASHBOARD_PLAN/01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md` | Defines layer ownership, module responsibilities, and architectural boundaries. Every trace must map to a layer in this model. |
| `ADMIN_DASHBOARD_PLAN/02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md` | Defines capability-to-artifact dependencies, reachability, propagation, and hotspots. Every capability trace must follow the dependency table for that domain. |
| `ADMIN_DASHBOARD_PLAN/03_ADMIN_DASHBOARD_EXECUTION_MODEL.md` | Defines runtime order, state transitions, synchronization, and lifecycle. Every execution trace must compare observed behavior against this model. |
| `ADMIN_DASHBOARD_PLAN/04_ADMIN_DASHBOARD_INVESTIGATION_PLAN.md` | Defines investigation objectives, scope, order, classification, confidence, and deliverables. This protocol operationalizes those decisions. |

### 0.2 Scope of This Protocol

This manual applies to all static, repository-based forensic work on the admin surface. It covers the in-scope domains and artifacts listed in `04` Section 3. It does not cover live incident response, third-party operational monitoring, or code changes.

---

## 1. Preparation Phase

Before collecting evidence, the investigator must establish the working environment and confirm that the required baselines and tools are available.

### 1.1 Required Documents and State

| Item | Verification Action | Acceptance Criterion |
|------|---------------------|----------------------|
| Repository checkout | `git status` and `git log --oneline -5` | The investigator knows the commit hash of the code under investigation. |
| Baseline documents `01`–`04` | Confirm all four files exist and are the versions referenced in the investigation charter. | No missing or unstaged baseline document. |
| `codebase-memory` graph | Verify the `codebase-memory` MCP server is reachable. | Cross-references can be resolved for files, RPCs, and call graphs. |
| Supabase schema | `supabase/schema.sql` and `supabase/migrations/` are present. | Database objects referenced in code can be located. |
| Environment inventory | `.env*` files, deployment manifests, and CI/CD configs are located. | All environment variables consumed by admin paths are listed, even if values are redacted. |

### 1.2 Evidence Prerequisites

| Evidence Type | Minimum Required Before Investigation |
|---------------|----------------------------------------|
| Repository evidence | `C:/PROJECT/vietsalepro` at a known commit. |
| Schema evidence | `supabase/schema.sql` and migration chain up to the target deployment. |
| Cross-reference capability | `codebase-memory` MCP or equivalent grep/graph access. |
| Optional runtime evidence | Supabase logs, `app_audit_log`, `admin_login_history`, `admin_events` — only if findings require promotion to `Confirmed`. |

### 1.3 Tools

| Tool Category | Tools |
|---------------|-------|
| Code navigation | `codebase-memory` MCP, repository file browser, `grep`/`ripgrep` equivalent. |
| Database object lookup | `supabase/schema.sql`, migration files. |
| Log and runtime evidence | Supabase Studio, Edge Function logs, `app_audit_log`, `admin_login_history`. |
| Evidence recording | This protocol and the templates in Sections 9 and 10. |

---

## 2. Execution Rules

These rules apply to every step of every capability trace.

### 2.1 General Rules

| Rule | Meaning |
|------|---------|
| Never assume | If an artifact is not present in the repository, record a gap. Do not infer behavior from names or comments. |
| Never skip | Every step in a capability protocol must be executed in order. |
| Never jump layers | Trace must proceed from Presentation → Application → Service → Infrastructure → Platform → Data and back. |
| Collect evidence first | Do not classify or conclude until the full trace for a capability is recorded. |
| Trace before classify | Record the complete path from UI intent to backend persistence before applying the classification taxonomy. |
| Classify before conclude | Assign a classification and confidence level before stating an impact or root cause candidate. |
| One shared function, one fix location | If the same pattern appears in multiple callers, record the shared function once and classify the shared deviation. |
| Document the negative | Record which RPC, table, trigger, RLS policy, or Edge Function was expected but not found. |

### 2.2 Layer Ownership Reference

| Layer | Owns | Must Not Do |
|-------|------|-------------|
| React components | Local UI state, form input, render boundaries | Call `supabase` directly; trust UI for security. |
| Contexts (`AuthContext`, `TenantContext`) | Session, user, tenant, membership, impersonation | Perform business writes. |
| Hooks | Debounce, pagination, confirmation, realtime subscriptions | Bypass services. |
| Wrapper services (`services/admin/*.ts`) | Admin call-site seam | Implement backend security logic. |
| Base services (`services/*.ts`) | RPC/PostgREST invocation, mapping, error normalization | Import React or UI state. |
| `lib/supabase.ts` | Single typed Supabase client, `x-tenant-id` injection | Contain business logic. |
| Supabase platform | Auth, REST, realtime, storage, edge runtime | Enforce RLS, `SECURITY DEFINER` checks, signatures. |
| Database | Business invariants, audit, transactions | Be the source of truth for all persisted state. |

---

## 3. Investigation Workflow

The investigation must proceed through the following stages in order. No stage may be skipped for any capability.

```text
Architecture
     ↓
Dependency
     ↓
Execution
     ↓
Evidence
     ↓
Cross Verification
     ↓
Finding
     ↓
Classification
     ↓
Confidence
     ↓
Root Cause Candidate
     ↓
NOT Root Cause
```

### 3.1 Stage Definitions

| Stage | Input | Output |
|-------|-------|--------|
| Architecture | `01` layer model and module responsibilities | Determination of which layer each artifact belongs to. |
| Dependency | `02` capability and module dependency tables | Determination of which files/RPCs/tables a trace must touch. |
| Execution | `03` runtime sequence and state transitions | A sequence of runtime interactions that should occur for the trace. |
| Evidence | Repository files, schema, migrations | A collection of artifacts with exact references. |
| Cross Verification | Two or more artifacts that should agree | A divergence log or a consistency confirmation. |
| Finding | Observed deviation or consistency | A recorded observation with evidence and trace. |
| Classification | `04` Section 8 taxonomy | A category from the inconsistency classification table. |
| Confidence | `04` Section 9 model | `Confirmed`, `Highly Probable`, `Possible`, or `Unconfirmed`. |
| Root Cause Candidate | First layer where the model is violated | A single layer/file/function/object that explains the finding. |
| NOT Root Cause | All downstream artifacts | A list of layers that exhibit the symptom but are not the origin. |

---

## 4. Capability Execution Protocols

For each capability, the investigator executes the steps in order. Each step produces evidence and logs. The artifact references are derived from `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md` and `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md`.

### 4.1 Authentication

| Step | Action | Evidence to Record |
|------|--------|--------------------|
| 01 | Open `App.tsx` and identify the admin route tree, lazy-loading boundary, and `isSystemAdmin` gate. | Route definitions, lazy chunk list, `AdminSuspense` fallback. |
| 02 | Trace `AuthContext.tsx` mount and `supabase.auth.getSession()` / `onAuthStateChange` subscription. | `SIGNED_IN`, `TOKEN_REFRESHED`, `SIGNED_OUT` handlers, `user`/`session` state. |
| 03 | Trace `TenantContext.tsx` resolution of `tenant` and `currentTenantId` on the `admin` host. | Host/subdomain logic, `get_tenant_by_subdomain` call, `currentTenantId` reset. |
| 04 | Trace `lib/permissions.ts` `isSystemAdmin()` and `lib/tenant.ts` host detection. | Client-side helper code, RPC names called. |
| 05 | Trace the `is_system_admin` RPC in `supabase/schema.sql` or migrations. | Function body, `SECURITY DEFINER` setting, referenced table `system_admins`. |
| 06 | Verify `system_admins` table definition, RLS policies, and any triggers. | Table DDL, policies, indexes. |
| 07 | Cross-check `App.tsx` gate against `is_system_admin` RPC and against `AuthContext` state. | Any mismatch between client gate and backend enforcement. |
| 08 | Record the authentication trace log, evidence inventory, and visited artifacts. | Section 9 finding record and Section 10 logs. |
| 09 | Assign classification per `04` Section 8. | Category and repository evidence that supports it. |
| 10 | Assign confidence per `04` Section 9. | `Confirmed`, `Highly Probable`, `Possible`, or `Unconfirmed`. |

### 4.2 Authorization

| Step | Action | Evidence to Record |
|------|--------|--------------------|
| 01 | Open `lib/permissions.ts` and list every exported helper. | `isSystemAdmin`, `hasTenantRole`, `isTenantOwner`, `isTenantAdmin`, `canUseFeature`, `ROLES`, `ROLE_PERMISSIONS`. |
| 02 | For each helper, identify the RPC or backend check it mirrors. | `is_system_admin`, `is_tenant_admin`, `is_tenant_owner`, `has_tenant_role` RPCs. |
| 03 | For each admin capability, open one representative RPC and one representative Edge Function. | Authorization check at the start of the function body. |
| 04 | Open RLS policies for `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_settings`, `audit_log`, and `system_admins`. | Policy names, `USING`/`WITH CHECK` clauses, roles. |
| 05 | Verify that no admin page or component calls `supabase` directly outside `lib/supabase.ts` and services. | Direct `supabase.from()` or `supabase.rpc()` in components. |
| 06 | Cross-check client-side `isSystemAdmin`/`hasTenantRole` against backend RPC/RLS enforcement. | Any case where the UI gate differs from the backend gate. |
| 07 | Record the authorization trace log and evidence inventory. | Section 9 finding record and Section 10 logs. |
| 08 | Assign classification per `04` Section 8. | Category and repository evidence. |
| 09 | Assign confidence per `04` Section 9. | Confidence level. |
| 10 | State the root cause candidate and the NOT root cause downstream artifacts. | First layer where enforcement is missing or inconsistent. |

### 4.3 Tenant Management

| Step | Action | Evidence to Record |
|------|--------|--------------------|
| 01 | Open `pages/admin/Tenants.tsx`, `TenantDetail.tsx`, and `Onboarding.tsx`. | Route definitions, lazy boundaries, state and effect hooks. |
| 02 | Trace components `SubdomainManagerPanel`, `CustomDomainPanel`, `LicenseManagerPanel`, `SecuritySettingsPanel`, `AccountSelector`. | Props, contexts consumed, services called. |
| 03 | Trace `services/admin/tenantAdminService.ts` wrappers. | Re-exports, adapted names, base service calls. |
| 04 | Trace `services/tenantService.ts` base functions. | `searchTenants`, `getAllTenants`, `createTenantWithCredentials`, `updateTenant`, `softDeleteTenant`, `hardDeleteTenant`, `startImpersonation`, `getTenantStorageUsage`. |
| 05 | Trace `lib/supabase.ts` and `tenantFetch` for `x-tenant-id` injection. | `currentTenantId` read and header injection code. |
| 06 | For each RPC — `get_tenants_admin`, `search_tenants`, `get_tenant_by_subdomain`, `get_tenant_by_domain`, `create_tenant_with_admin`, `set_tenant_subdomain`, `get_or_create_custom_domain_token`, `get_tenant_usage_summary`, `update_tenant`, `delete_tenant_safe`, `get_current_user_tenants`, `get_top_tenants`, `get_tenant_growth`, `get_system_overview` — locate the function definition and authorization check. | Schema/migration location, `SECURITY DEFINER`/`INVOKER` setting, parameter list, return type. |
| 07 | For each Edge Function — `create-tenant`, `check-subdomain`, `verify-domain`, `delete-tenant`, `tenant-backup`, `tenant-restore`, `impersonate-tenant`, `end-impersonation` — locate `index.ts`, caller validation, `service_role` usage, and response contract. | Function path, validation code, external API calls (Google DNS, Supabase Management API). |
| 08 | Trace triggers on `tenants` and `tenant_memberships`: `trg_audit_log_tenants`, `set_tenant_record_user_tracking`, `tenant_memberships_guardrails`, `tenants_before_delete_guardrail`, `trg_check_tenant_user_limit`. | Trigger definition, firing event, function body. |
| 09 | Verify migrations for the `tenants` table and related objects are present and ordered. | Migration file names and contents. |
| 10 | Cross-check wrapper service call names with base service exports, RPC signatures, and schema definitions. | Any name mismatch or missing function. |
| 11 | Record the tenant trace log and evidence inventory. | Section 9 and Section 10 records. |
| 12 | Assign classification and confidence. | Per `04` Sections 8 and 9. |
| 13 | State root cause candidate and NOT root cause. | First layer where the tenant model is violated. |

### 4.4 Billing

| Step | Action | Evidence to Record |
|------|--------|--------------------|
| 01 | Open `pages/admin/Billing.tsx`, `BillingInvoices.tsx`, and `BillingPayments.tsx`. | Routes, lazy boundaries, state, effects. |
| 02 | Trace components `SubscriptionManager`, `InvoiceManager`, `PaymentManager`. | Props, services called. |
| 03 | Trace `services/admin/billingAdminService.ts` wrappers. | Delegation to base services. |
| 04 | Trace `services/planService.ts`, `services/invoiceService.ts`, `services/bankAccountService.ts`, `services/admin/billingProviderRegistry.ts`, and `services/admin/providers/*`. | RPC/Edge Function names, provider mapping. |
| 05 | For each RPC — `update_tenant_subscription`, `create_subscription`, `upgrade_subscription`, `downgrade_subscription`, `cancel_subscription`, `create_invoice`, `confirm_payment`, `get_plans`, `get_plan_by_key`, `create_plan`, `update_plan`, `delete_plan`, `compute_billing_period_end` — locate schema definition and authorization. | Function body, `SECURITY DEFINER`, plan-limit checks. |
| 06 | For each Edge Function — `process-checkout`, `send-billing-email`, `billing-webhooks` — locate validation and response contract. | Provider signature verification (Stripe HMAC, VNPay, Momo), external calls. |
| 07 | Trace tables `tenant_subscriptions`, `invoices`, `payments`, `plans`, `plan_features`, `bank_accounts`, `system_settings`, `billing_job_logs`, `billing_reminder_logs`. | DDL, RLS, triggers, constraints. |
| 08 | Trace triggers `trg_check_tenant_order_limit` and `trg_audit_log_tenant_subscriptions`. | Firing events and functions. |
| 09 | Cross-check provider registry names with Edge Function contracts and environment variables. | `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`. |
| 10 | Record trace log, evidence inventory, classification, and confidence. | Per Sections 9 and 10. |
| 11 | State root cause candidate and NOT root cause. | First layer where billing contract is violated. |

### 4.5 Members

| Step | Action | Evidence to Record |
|------|--------|--------------------|
| 01 | Open `pages/admin/Members.tsx` and `InvitationsAccept.tsx`. | Routes and state. |
| 02 | Trace component `MemberManagement`. | Services called, `useAdminList` usage. |
| 03 | Trace `services/admin/memberAdminService.ts` and `services/tenantService.ts`. | Invitation, role update, removal, reset flows. |
| 04 | For each RPC — `search_tenant_members`, `get_tenant_members_with_email`, `toggle_tenant_member_active`, `update_tenant_member_role`, `remove_tenant_member`, `lookup_invitation`, `accept_invitation`, `get_users`, `get_tenant_usage_summary` — locate schema definition and authorization. | Function body, role checks, guardrails. |
| 05 | For each Edge Function — `send-invitation-email`, `invite-member` — locate validation and response. | Caller role checks, email provider configuration. |
| 06 | Trace tables `tenant_memberships`, `invitations`, `tenants`, `users`, `rate_limit_logs`. | DDL, RLS, triggers. |
| 07 | Trace triggers `tenant_memberships_guardrails`, `trg_audit_log_tenant_memberships`, `trg_check_tenant_user_limit`. | Firing events and guardrail logic. |
| 08 | Cross-check `lib/permissions.ts` role constants against backend `VALID_ROLES` and `tenant_memberships` constraints. | Any mismatch in role names or role hierarchy. |
| 09 | Record trace log, evidence inventory, classification, and confidence. | Per Sections 9 and 10. |
| 10 | State root cause candidate and NOT root cause. | First layer where membership/role enforcement is violated. |

### 4.6 Analytics

| Step | Action | Evidence to Record |
|------|--------|--------------------|
| 01 | Open `pages/admin/Analytics.tsx` and `Overview.tsx`. | Routes, lazy boundaries, `activeTab` state. |
| 02 | Trace components `RevenueMetrics`, `ChurnCohortMetrics`, `AdminKpiCards`. | Chart data sources and service calls. |
| 03 | Trace `services/admin/analyticsAdminService.ts` and `services/admin/tenantAdminService.ts`. | `getTopTenants`, `getTenantGrowth` delegation. |
| 04 | For each RPC — `get_revenue_metrics`, `get_churn_cohort_metrics`, `get_top_tenants`, `get_tenant_growth`, `get_system_overview` — locate schema definition and authorization. | `is_system_admin` check, aggregation logic. |
| 05 | Trace tables `payments`, `invoices`, `tenant_subscriptions`, `tenants`. | DDL and RLS. |
| 06 | Verify that no direct data access bypasses the aggregation RPCs. | Component calls, service calls, RPC list. |
| 07 | Cross-check UI chart fields with RPC return shape. | Field names, data types. |
| 08 | Record trace log, evidence inventory, classification, and confidence. | Per Sections 9 and 10. |
| 09 | State root cause candidate and NOT root cause. | First layer where aggregation or isolation is violated. |

### 4.7 Audit

| Step | Action | Evidence to Record |
|------|--------|--------------------|
| 01 | Open `pages/admin/Audit.tsx`. | Route, `AuditExportPanel` usage. |
| 02 | Trace `services/admin/auditAdminService.ts`, `services/auditService.ts`, and `services/loginHistoryService.ts`. | `getAdminAuditLogs`, `exportAuditLogs`, `recordAdminLogin` calls. |
| 03 | For each RPC — `get_admin_audit_logs`, `get_admin_login_history`, `get_admin_login_alerts`, `record_admin_login`, `get_rate_limit_logs` — locate schema definition and authorization. | Function body, filters, pagination. |
| 04 | Trace direct `supabase.from('audit_log')` usage and the `mapAdminAuditLogFromDB` mapper. | Table query, count, filter mapping. |
| 05 | Trace tables `audit_log`, `admin_login_history`, `rate_limit_logs`, `app_audit_log`. | DDL, RLS, retention. |
| 06 | Trace triggers `trg_audit_log_tenants`, `trg_audit_log_tenant_memberships`, `trg_audit_log_orders`, `trg_audit_log_products`, `tenant_memberships_audit`. | Firing events and `audit_log` insert logic. |
| 07 | Verify `MAX_EXPORT_ROWS = 10000` constant and export format handling. | Code constant, CSV/JSON formatting. |
| 08 | Cross-check one privileged mutation from another capability with its expected audit trail in `app_audit_log` and `audit_log`. | Matching actor, timestamp, `old_data`/`new_data`. |
| 09 | Record trace log, evidence inventory, classification, and confidence. | Per Sections 9 and 10. |
| 10 | State root cause candidate and NOT root cause. | First layer where audit coverage is missing. |

### 4.8 Compliance

| Step | Action | Evidence to Record |
|------|--------|--------------------|
| 01 | Open `pages/admin/Compliance.tsx` and `AdminDashboardInner.tsx` compliance tab. | Route, lazy panel, state. |
| 02 | Trace component `ComplianceManager` and `services/admin/complianceAdminService.ts`. | Request, export, delete, download flows. |
| 03 | For each RPC — `get_gdpr_requests`, `create_gdpr_request`, `gdpr_export_user_data`, `gdpr_delete_user_data` — locate schema definition and authorization. | `is_system_admin` check, dry-run behavior, data touched. |
| 04 | Trace Edge Function `delete-user`. | Caller validation, hard-delete logic. |
| 05 | Trace tables `gdpr_requests`, `gdpr_deletion_logs`, `tenants`, `tenant_memberships`, `payments`, `audit_log`, `admin_login_history`, `terms_acceptance`. | DDL, RLS, deletion/anonymization references. |
| 06 | Verify dry-run default and deletion confirmation flow. | Code paths and RPC parameters. |
| 07 | Cross-check exported data set against `gdpr_export_user_data` SQL and the tables it claims to read. | Table list match. |
| 08 | Record trace log, evidence inventory, classification, and confidence. | Per Sections 9 and 10. |
| 09 | State root cause candidate and NOT root cause. | First layer where compliance contract is violated. |

### 4.9 Notifications

| Step | Action | Evidence to Record |
|------|--------|--------------------|
| 01 | Open `pages/admin/AdminDashboardInner.tsx` notifications tab and `components/admin/AdminNotificationBell.tsx`. | Route, tab state, bell render. |
| 02 | Trace `useAdminRealtime.ts` hook. | Channel topic, event types, `maxNotifications`, `unreadCount` logic. |
| 03 | Trace `services/notificationService.ts`. | In-app message send/read calls. |
| 04 | For each RPC — `send_in_app_message`, `get_in_app_messages_for_tenant`, `mark_in_app_message_read` — locate schema definition and authorization. | Function body, `is_system_admin` checks. |
| 05 | Trace Edge Functions `send-email` and `send-sms`. | Resend/Twilio configuration, validation. |
| 06 | Trace table `notification_logs` and trigger `update_notification_logs_updated_at`. | DDL, RLS, trigger body. |
| 07 | Verify `admin_events` realtime publication and RLS `admin_events_select_admin` / `admin_events_insert_admin`. | Channel config in `supabase/schema.sql`. |
| 08 | Cross-check backend `admin_events` insert sites with `useAdminRealtime` event types consumed. | Event type list agreement. |
| 09 | Record trace log, evidence inventory, classification, and confidence. | Per Sections 9 and 10. |
| 10 | State root cause candidate and NOT root cause. | First layer where notification/realtime boundary is violated. |

### 4.10 Storage

| Step | Action | Evidence to Record |
|------|--------|--------------------|
| 01 | Open `pages/admin/AdminDashboardInner.tsx` storage tab and `pages/admin/Tenants.tsx` backup entry. | Route and panel mounts. |
| 02 | Trace component `StorageBackupPanel`. | Service calls and state. |
| 03 | Trace `services/tenantBackupService.ts`, `services/tenantRestoreService.ts`, and `services/tenantService.ts` `getTenantStorageUsage`. | Backup download, restore upload, usage calls. |
| 04 | For each RPC — `get_tenant_storage_usage` — and Edge Functions — `tenant-backup`, `tenant-restore`, `system-backup` — locate definitions. | RPC function, Edge Function validation, storage bucket access. |
| 05 | Trace tables `tenant_subscriptions`, `tenant_restore_snapshots`, `heavy_ops_jobs`. | DDL and RLS. |
| 06 | Verify Supabase Storage bucket `tenant-assets` RLS and object prefix conventions. | Bucket policies. |
| 07 | Verify `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_MANAGEMENT_TOKEN` are not present in frontend bundles or browser-env files. | `.env` files, build output. |
| 08 | Cross-check backup JSON contract with `tenant-restore` expected shape and `restore_tenant_tables` RPC. | Table order, `tenant_id` override. |
| 09 | Record trace log, evidence inventory, classification, and confidence. | Per Sections 9 and 10. |
| 10 | State root cause candidate and NOT root cause. | First layer where storage/backup contract is violated. |

### 4.11 Monitoring

| Step | Action | Evidence to Record |
|------|--------|--------------------|
| 01 | Open `pages/admin/AdminDashboardInner.tsx` errors/performance tab. | Route and `activeTab`. |
| 02 | Trace component `ErrorPerformancePanel` and `services/errorPerformanceService.ts`. | Service call and response shape. |
| 03 | Trace Edge Function `error-performance`. | Aggregation logic over `error_logs`. |
| 04 | Trace table `error_logs`. | DDL, RLS, indexes. |
| 05 | Cross-check metrics displayed in `ErrorPerformancePanel` with `error-performance` response contract and `error_logs` columns. | Field and aggregation match. |
| 06 | Record trace log, evidence inventory, classification, and confidence. | Per Sections 9 and 10. |
| 07 | State root cause candidate and NOT root cause. | First layer where monitoring contract is violated. |

### 4.12 Configuration

| Step | Action | Evidence to Record |
|------|--------|--------------------|
| 01 | Open `pages/admin/Settings.tsx` and `pages/admin/Billing.tsx` company/bank accounts sections. | Routes and forms. |
| 02 | Trace `AdminSettingsNav`, billing forms, `services/operationsService.ts`, `services/bankAccountService.ts`, and `services/admin/systemAdminService.ts`. | Config read/write calls. |
| 03 | For each RPC — `get_default_plan_limits`, `set_default_plan_limits`, `get_data_retention_status`, `get_maintenance_mode`, `set_maintenance_mode`, `get_global_config`, `set_global_config` — locate schema definition and authorization. | Function body, `is_system_admin` check, numeric caps. |
| 04 | Trace tables `system_settings`, `plans`, `plan_features`, `bank_accounts`, `maintenance_windows`, `db_maintenance_jobs`. | DDL, RLS, triggers. |
| 05 | Trace Edge Functions `cron-admin-tasks` and `db-maintenance`. | Caller validation (`X-Internal-Secret` or `CRON_ADMIN_TASKS_SECRET`). |
| 06 | Trace triggers `system_settings_updated_by_trigger`, `maintenance_windows_updated_at`, `plan_features_updated_at`. | Firing events and updated_by logic. |
| 07 | Cross-check `lib/permissions.ts` `canUseFeature` against `get_tenant_feature_flags` / `update_tenant_feature_flags` and `system_settings` values. | Feature flag source of truth. |
| 08 | Record trace log, evidence inventory, classification, and confidence. | Per Sections 9 and 10. |
| 09 | State root cause candidate and NOT root cause. | First layer where configuration contract is violated. |

---

## 5. Cross-Layer Trace Procedure

For any single user action, the investigator must produce the following trace in order. No layer may be skipped.

```text
UI
 ↓
Component
 ↓
Hook
 ↓
Context
 ↓
Wrapper Service (services/admin/*.ts)
 ↓
Base Service (services/*.ts)
 ↓
Supabase Client (lib/supabase.ts, tenantFetch, x-tenant-id)
 ↓
RPC or Edge Function
 ↓
Migration (supabase/migrations/)
 ↓
Database Object (table/view/function)
 ↓
Trigger
 ↓
Realtime Channel (admin_events)
 ↓
Database Side Effects / Audit Row
 ↓
UI Update
```

### 5.1 Layer Verification Checklist

| Layer | Verification Question | Evidence to Capture |
|-------|----------------------|---------------------|
| UI | What user action initiated the flow? | Screenshot, route URL, form state. |
| Component | Which component owns the state and renders the result? | Component file, props, effects. |
| Hook | Which custom hook encapsulates the behavior? | `useAdminList`, `useAdminRealtime`, `useConfirmDialog`, `useDebounce`, etc. |
| Context | Which context provides `user`, `tenant`, `isSystemAdmin`? | `AuthContext`, `TenantContext` value reads. |
| Wrapper Service | Which `services/admin/*.ts` function is called? | Function name and base service delegation. |
| Base Service | Which `services/*.ts` function performs the Supabase call? | Function body, RPC name, parameter map. |
| Supabase Client | Is `x-tenant-id` injected? Does it use the typed `supabase` client? | `lib/supabase.ts` `tenantFetch` and `currentTenantId` usage. |
| RPC / Edge Function | What is the function path, authorization check, and response shape? | `supabase/schema.sql` or `supabase/functions/<name>/index.ts`. |
| Migration | Which migration created or last modified the object? | `supabase/migrations/` file list and content. |
| Database Object | What is the table/view/function definition? | DDL from `schema.sql` or migration. |
| Trigger | Which trigger fires for this operation? | Trigger name, event, function. |
| Realtime | Is an `admin_events` row emitted? | Realtime publication and `admin_events` RLS. |
| UI Update | Does the UI display the persisted state or a local assumption? | Component render after state update. |

### 5.2 Cross-Layer Agreement Rules

| Check | Pass Criterion |
|-------|---------------|
| RPC signature vs base service call | Parameter names and types match. |
| Edge Function response vs TypeScript type | Field names and shapes match. |
| RLS policy vs RPC check | The same role/system-admin condition is enforced in both. |
| Trigger vs UI expectation | The side effect the UI expects is produced by a trigger or explicit audit call. |
| `x-tenant-id` vs `TenantContext` | `currentTenantId` is set/cleared exactly where `TenantContext` says it is. |
| Realtime event vs `admin_events` insert | The event type the hook receives is emitted by a backend operation. |

---

## 6. Evidence Collection Protocol

Evidence is collected by layer. Each artifact receives a stable evidence ID and is entered into the evidence inventory.

### 6.1 Frontend Evidence

- For each admin page, record the route definition in `App.tsx`, the lazy-loading boundary, the contexts consumed, and the service functions called.
- Capture `AdminLayout.tsx` `SIDEBAR_SECTIONS`, `ADMIN_ROUTE_MAP`, `PAGE_TITLES`.
- Capture `AdminShell.tsx` and `AdminSidebar.tsx` props and state.
- Record any direct `supabase` call found in a component as an immediate `Architecture inconsistency`.

### 6.2 Context Evidence

- `AuthContext.tsx`: session init, `onAuthStateChange` handlers, `mfaPending`, `LOGIN`/`LOGOUT` audit calls.
- `TenantContext.tsx`: `getSubdomain()` logic, `get_tenant_by_subdomain` call, `setCurrentTenantId`, `currentTenantId` reset on admin host.
- Record lifecycle order and dependencies that trigger re-execution.

### 6.3 Hook Evidence

- `useAdminList.ts`: `page`, `pageSize`, `searchTerm`, `filters`, `data`, `totalCount`, `isLoading`, `error`, `requestIdRef`.
- `useAdminRealtime.ts`: channel topic, event types, `maxNotifications`, `unreadCount`, `markAsRead`, `clearAll`.
- `useConfirmDialog.tsx` and `useDebounce.ts`: service bypass check.

### 6.4 Service Evidence

- For each `services/admin/*.ts` wrapper, list re-exports and adapted names.
- For each base `services/*.ts`, record the exact RPC/Edge Function/table call, parameter map, response mapping, and error normalization.
- Confirm no React imports and no direct state mutation.

### 6.5 RPC Evidence

- Function name, schema location, `SECURITY DEFINER` or `SECURITY INVOKER`, parameter list, return type.
- Authorization check at the start of the function body.
- Tables/views/functions referenced inside the RPC.
- Triggers that fire as a side effect.

### 6.6 Edge Function Evidence

- Route/entry file `supabase/functions/<name>/index.ts`.
- CORS handling, Bearer token extraction, `supabaseAdmin.auth.getUser` validation.
- `service_role` client creation and usage.
- External API calls and timeout/retry behavior.
- Response contract and manual audit log inserts.

### 6.7 Migration Evidence

- Migration file name, order, and content for every table/RPC/trigger/policy referenced in an admin trace.
- Comparison between `supabase/schema.sql` and the migration chain.
- Any migration that creates, alters, or drops an admin-relevant object.

### 6.8 Schema Evidence

- Table DDL, column names, types, constraints, foreign keys, indexes.
- RLS policy names and definitions for admin-relevant tables.
- Function and view definitions used by admin RPCs.

### 6.9 Trigger Evidence

- Trigger name, table, firing event (`BEFORE`/`AFTER INSERT/UPDATE/DELETE`).
- Trigger function body.
- Whether the trigger writes to `audit_log`, `app_audit_log`, `admin_events`, or other side-effect tables.

### 6.10 Realtime Evidence

- `admin_events` table DDL and RLS policies.
- Realtime publication configuration in `supabase/schema.sql`.
- `useAdminRealtime` channel subscription and event type list.
- Backend `admin_events` insert points in RPCs, triggers, or Edge Functions.

### 6.11 Configuration Evidence

- Every environment variable consumed by an admin code path and the file that consumes it.
- `system_settings` keys and values if available.
- Provider secrets and webhook secrets referenced in Edge Functions.
- Any variable whose value is not present in the repository is marked as an `Evidence gap`.

---

## 7. Evidence Validation Protocol

### 7.1 Minimum Evidence

A trace is valid only when it contains at least:

1. The UI/component/hook artifact.
2. The wrapper and/or base service artifact.
3. The Supabase call artifact (RPC name, Edge Function path, or `from()` table).
4. The database object artifact (table, function, trigger, RLS policy, or migration).
5. The cross-layer link that shows the call chain from 1 through 4.

### 7.2 Multiple Source Validation

| Agreement Type | Requirement |
|----------------|-------------|
| Code-to-code | The caller name in the base service matches the function exported by the wrapper. |
| Code-to-schema | The RPC name called in a service exists in `supabase/schema.sql` or a migration. |
| Code-to-RLS | The role condition in the RPC matches the RLS policy on the table it touches. |
| Code-to-trigger | The side effect the UI expects is produced by a trigger or explicit code path. |
| Code-to-runtime | Where runtime evidence is required, the observed result matches the repository contract. |

### 7.3 Conflict Handling

| Situation | Investigator Action |
|-----------|---------------------|
| Two repository artifacts contradict each other | Record both artifacts, the contradiction, and classify as `Contract inconsistency` or `Schema inconsistency`. Do not resolve by assumption. |
| Repository contradicts runtime observation | Mark the finding as `Highly Probable` or `Possible` depending on whether the contradiction is explained by a known gap. Record the runtime gap. |
| Missing repository artifact | Mark as `Repository gap`. Do not fabricate the missing file or function. |
| Missing runtime evidence | Mark as `Runtime gap`. Do not promote `Possible` or `Highly Probable` findings to `Confirmed` without it. |

### 7.4 Gap Types

| Gap Type | Definition | Handling |
|----------|------------|----------|
| Repository gap | A referenced file, RPC, table, or migration is not present in the repository. | Record the reference and the absence. Stop further trace for that path. |
| Runtime gap | A finding requires runtime observation that is not yet available. | Record the required observation, classify as `Possible` or `Highly Probable`, and request the evidence before promotion to `Confirmed`. |
| Configuration gap | An environment variable value is required but not present. | Record the variable name, consuming file, and the gap. |
| Scope gap | An artifact is outside the investigation scope in `04` Section 3.2. | Document the artifact and the reason it is out of scope; do not trace it. |

---

## 8. Finding Recording Protocol

A finding may only be recorded after the cross-layer trace is complete and the classification and confidence have been assigned.

### 8.1 Standard Finding Format

| Field | Content |
|-------|---------|
| Finding ID | `FIND-YYYYMMDD-NNN` or as defined by the investigation charter. |
| Capability | The capability being traced (e.g., `Tenant`). |
| Symptom | One sentence describing what was observed. |
| Evidence | List of evidence IDs with file/object references and line numbers where available. |
| Trace | The cross-layer path from UI to database and back. |
| Classification | Category from `04` Section 8 (e.g., `Security inconsistency`, `RPC inconsistency`). |
| Confidence | `Confirmed`, `Highly Probable`, `Possible`, or `Unconfirmed`. |
| Impact Candidate | The business/technical effect this finding could produce if the model is violated. |
| Root Cause Candidate | The first layer where the deviation from the baseline occurs, with exact artifact. |
| NOT Root Cause | Downstream artifacts that exhibit the symptom but are not the origin. |

### 8.2 Finding Acceptance Checklist

Before a finding is accepted:

- [ ] The trace covers all required layers in Section 5.
- [ ] At least two artifacts support the observation.
- [ ] The classification comes from `04` Section 8.
- [ ] The confidence comes from `04` Section 9.
- [ ] A root cause candidate and a NOT root cause list are stated.
- [ ] No opinion, recommendation, or fix is included.

---

## 9. Investigation Logging Protocol

Every investigator action must produce two logs: a trace log and an evidence log.

### 9.1 Trace Log

| Field | Content |
|-------|---------|
| Timestamp | ISO-8601 timestamp of the action. |
| Investigator | Identifier of the investigator. |
| Capability | Capability being traced. |
| Step | Capability step number and action. |
| Artifacts Visited | Files, RPCs, Edge Functions, tables, migrations, triggers, RLS policies. |
| Observation | What was found or not found. |
| Next Step | Next action to take or stop reason. |

### 9.2 Evidence Log

| Field | Content |
|-------|---------|
| Evidence ID | Stable identifier (e.g., `EV-001`). |
| Layer | UI, Component, Hook, Context, Service, RPC, Edge, Migration, Schema, Trigger, Realtime, Config. |
| Artifact | Exact file path, RPC name, table name, migration file, etc. |
| Lines / Object | Line numbers or DDL object name. |
| Capability | The capability it supports. |
| Relation | Which other evidence IDs it links to. |
| Status | `Collected`, `Missing`, `Contradictory`, `Runtime required`. |

### 9.3 Visited Artifact Checklist

For each capability trace, record whether the following were visited:

- [ ] Files
- [ ] RPCs
- [ ] Edge Functions
- [ ] Tables
- [ ] Migrations
- [ ] Triggers
- [ ] RLS policies
- [ ] Realtime channels

---

## 10. Stopping Rules

The investigator must stop the current trace or the entire investigation when any of the following conditions are met.

| Stop Condition | Action |
|---------------|--------|
| Evidence is insufficient to complete the next step. | Mark the finding as `Possible` or `Unconfirmed`, record the missing evidence, and stop the trace for that capability. |
| Runtime verification is required to resolve a contradiction. | Record the finding as `Highly Probable`, list the exact runtime evidence needed, and stop further promotion. |
| Repository contradicts runtime and the contradiction cannot be explained by a known gap. | Escalate to the investigation lead; do not modify the baseline documents. |
| All capability protocols in Section 4 have been executed and all findings classified. | Proceed to deliverable production per `04` Section 14. |
| A finding changes the dependency graph or risk profile. | Re-evaluate priority per `04` Section 12 and adjust the execution order. |
| A security-critical finding is discovered. | Continue only to document the finding and its root cause candidate; pause unrelated work if the blast radius is unknown. |

---

## 11. Quality Control

Before accepting any finding, the investigator must perform the following self-validation.

| Check | Pass Criterion |
|-------|---------------|
| Trace completeness | The trace includes every layer from Section 5. |
| Evidence plurality | At least two independent repository artifacts support the observation. |
| Classification correctness | The classification matches `04` Section 8 and is supported by the evidence. |
| Confidence correctness | The confidence matches `04` Section 9 and accounts for any runtime or repository gaps. |
| No assumption | No statement relies on an unverified assumption; all gaps are explicitly recorded. |
| No recommendation | The finding contains no fix, refactor, or remediation language. |
| No root-cause-only symptom | The symptom and root cause candidate are separated, and downstream artifacts are listed as NOT root cause. |
| Repeatability | Another investigator can reproduce the trace from the evidence log without asking the original investigator. |

---

## 12. Repeatability

### 12.1 Investigator-Independent Execution

Any investigator using only this protocol and the four baseline documents must be able to:

1. Identify the same entry points for each capability.
2. Follow the same cross-layer trace order.
3. Collect the same set of required artifacts.
4. Apply the same classification and confidence model.
5. Produce findings in the same standard format.

### 12.2 Environmental Controls

| Control | Requirement |
|---------|-------------|
| Commit pinning | The investigation must record the exact repository commit hash in the evidence log. |
| Baseline version pinning | The four baseline documents must be identified by file path and, if under version control, commit hash. |
| Tool consistency | Use the same `codebase-memory` graph, schema file set, and environment inventory for all capability traces. |
| Evidence naming | Use the `EV-NNN` and `FIND-YYYYMMDD-NNN` formats consistently so logs can be merged. |
| No local modifications | The investigator must not modify repository files, baseline documents, or environment values during the investigation. |

### 12.3 Handoff Procedure

When an investigation is paused or transferred:

1. Commit the trace log and evidence log to the `ADMIN_DASHBOARD_FORENSIC/` directory.
2. List the next unexecuted step for each capability.
3. Attach the exact commit hash and baseline document references.
4. Identify any runtime evidence still outstanding.

---

## 13. Document Control

| Field | Value |
|-------|-------|
| Document | `05_ADMIN_DASHBOARD_FORENSIC_EXECUTION_PROTOCOL.md` |
| Location | `c:/PROJECT/vietsalepro/ADMIN_DASHBOARD_PLAN/` |
| Authoritative Baselines | `01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md`, `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md`, `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md`, `04_ADMIN_DASHBOARD_INVESTIGATION_PLAN.md` |
| Purpose | Operational execution manual for the future Admin Dashboard forensic investigation. |
| Constraints | No findings, inconsistencies, recommendations, fixes, refactoring, opinions, assumptions, or conclusions. |
