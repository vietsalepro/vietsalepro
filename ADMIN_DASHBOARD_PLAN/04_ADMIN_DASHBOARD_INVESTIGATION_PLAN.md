# Admin Dashboard Investigation Plan

## 0. Purpose & Baseline

This document is the **investigation strategy** for the VietSale Pro Admin Dashboard. It does not perform forensic analysis, report bugs, or prescribe fixes. It defines *how* a future forensic investigation should be executed so that findings are reproducible, traceable, and rooted in the repository rather than in assumptions.

**Authoritative baselines (read in full before any investigation):**

- `ADMIN_DASHBOARD_PLAN/01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md`
- `ADMIN_DASHBOARD_PLAN/02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md`
- `ADMIN_DASHBOARD_PLAN/03_ADMIN_DASHBOARD_EXECUTION_MODEL.md`

All strategy decisions below are derived from the architecture, dependency, and execution knowledge already established in those documents and from the `codebase-memory` graph of the repository.

---

## 1. Investigation Objectives

### 1.1 Why the investigation exists

The Admin Dashboard is a privileged, system-level surface embedded inside the same Vite + React SPA as the tenant-facing application. Because it can mutate tenants, memberships, billing, security settings, and platform health, any defect or inconsistency in this surface has amplified blast radius. The investigation exists to discover whether the admin surface behaves as the architecture and dependency models claim it does, and to locate the exact layer where reality diverges from design.

### 1.2 Success criteria

A successful investigation produces:

1. **Confirmed findings** anchored to repository files, database objects, and execution paths.
2. **Complete traceability** from every finding back through the execution chain, dependency, and architecture layer.
3. **Root-cause isolation** rather than symptom lists.
4. **Cross-layer consistency verification** for every major execution chain.
5. **A classified evidence confidence model** so decision-makers know which findings are certain and which require runtime confirmation.

### 1.3 Completion criteria

The investigation is complete when:

- Every in-scope domain has been traced from UI intent to backend persistence at least once.
- Every inconsistency is classified using the taxonomy in Section 8.
- Every reported issue has a confidence level from Section 9.
- Every finding is reproducible from repository evidence alone or from a documented runtime gap.
- The deliverables in Section 14 exist and are internally consistent.

---

## 2. Investigation Philosophy

### 2.1 Layered order: Architecture → Dependency → Execution → Evidence → Root Cause

The investigation must follow the layered order above, not a random walk through source files.

1. **Architecture first.** The architecture model defines which layer owns which responsibility. If a React component is found calling `supabase` directly, that is an architectural violation before it is a bug. Without the architecture baseline, the investigator cannot distinguish a deliberate seam from a leak.
2. **Dependencies second.** The dependency map defines what each capability depends on and how a change in one module propagates. A defect in `search_tenants` is not localized; it reaches every page that lists tenants and every tenant selector. Understanding propagation prevents false localization.
3. **Execution third.** The execution model defines runtime order, state transitions, and ownership. A permission check that exists in code but runs after a data fetch is an execution-order issue, not an authorization policy issue.
4. **Evidence fourth.** Repository files, RPC signatures, RLS policies, triggers, and migrations are evidence. Runtime logs and database snapshots are supplementary evidence. Nothing is reported without evidence.
5. **Root cause last.** Only after the preceding four steps can the investigator state why a finding occurs rather than what symptom it produces.

### 2.2 Why this order minimizes false positives

Random code review treats every suspicious line as potentially defective. The layered approach turns suspicious lines into questions:

- Does this line violate architecture ownership?
- Does this call traverse a documented dependency?
- Does this execution order match the runtime model?
- Is the behavior inconsistent with the source of truth?
- Does the inconsistency explain the symptom, or is it another symptom?

This filters out style preferences and focuses the investigation on deviations from the established model.

---

## 3. Investigation Scope

### 3.1 In Scope

- The admin route tree, lazy-loading, and entry gating in `App.tsx`.
- `AdminLayout`, `AdminShell`, `AdminSidebar`, and `AdminDashboardHeader` components.
- Admin pages under `pages/admin/*`.
- Admin contexts and hooks: `useAuth`, `useTenant`, `useAdminList`, `useAdminRealtime`, `useConfirmDialog`, and any admin-specific hooks.
- `services/admin/*.ts` wrapper services and the base `services/*.ts` modules they delegate to.
- `lib/supabase.ts`, `lib/permissions.ts`, and `lib/tenant.ts` as infrastructure and boundary modules.
- Supabase Edge Functions invoked from the admin surface (`supabase/functions/*`).
- Postgres RPCs, triggers, RLS policies, and migrations referenced by admin capabilities.
- `supabase/schema.sql` and files under `supabase/migrations/` that define admin-relevant tables and functions.
- Environment variables and configuration consumed by admin code paths (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `APP_BASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_MANAGEMENT_TOKEN`, `SUPABASE_PROJECT_REF`, and provider secrets such as `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, and `RESEND_FROM`).

### 3.2 Out of Scope

- Tenant-facing operational features unless they are called by admin wrappers or share an RPC/Edge Function with an admin path.
- Third-party service availability or uptime (Stripe, VNPay, Momo, Google DNS, Supabase Management API). Their integration contracts are in scope; their operational status is not.
- UI design, branding, and accessibility beyond whether components render the state provided by services and contexts.
- Performance benchmarking unless a specific execution path is observed to be materially slower than the model implies.

### 3.3 Evidence Sources

| Source | What it provides | Where to find it |
|---|---|---|
| Architecture model | Layer ownership and boundaries | `01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md` |
| Dependency map | Capability-to-artifact dependencies | `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md` |
| Execution model | Runtime order and state transitions | `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md` |
| `codebase-memory` graph | Cross-reference of functions, RPCs, and call graphs | `codebase-memory` MCP |
| Repository files | TypeScript/React/Supabase source | `C:/PROJECT/vietsalepro` |
| Supabase migrations/schema | Database truth at a point in time | `supabase/migrations/`, `supabase/schema.sql` |
| Environment/config | Deployment-specific values | `.env*`, CI/CD manifests, deployment docs |

### 3.4 Repository Boundaries

All primary evidence must come from `C:/PROJECT/vietsalepro`. If a referenced file is missing, that absence is recorded as an evidence gap, not resolved by assumption.

### 3.5 Runtime Boundaries

Runtime behavior (token refresh, realtime subscription delivery, Edge Function cold starts, RLS evaluation) cannot be fully reconstructed from the repository. The strategy treats runtime observation as a secondary evidence tier. Any finding that requires runtime confirmation is marked at the appropriate confidence level (Section 9) and is not reported as confirmed until observed.

### 3.6 Database Boundaries

Migrations and `schema.sql` define the intended database state. The investigation assumes the target database has been migrated to a state compatible with the repository head unless evidence suggests otherwise. Live row-level data is out of scope except where it is necessary to reproduce a reported issue.

---

## 4. Investigation Order

### 4.1 Optimal order

The investigation proceeds in the following stages. Each stage feeds evidence into the next and is bounded by explicit exit criteria.

| Stage | Focus | Why first | Exit criteria |
|---|---|---|---|
| 1. Boundary validation | `App.tsx` admin gating, `lib/tenant.ts`, `lib/permissions.ts`, `is_system_admin` RPC | The entire admin surface is unreachable unless these gates behave correctly. A gate failure is catastrophic and disables the value of all other findings. | All entry conditions from `01` are traceable to a backend-enforced check; no gate relies solely on client-side logic. |
| 2. Context and session boot | `AuthContext`, `TenantContext`, `lib/supabase.ts` | These contexts produce the runtime state (`user`, `tenant`, `currentTenantId`) that every admin page consumes. If the state is wrong, downstream findings are symptoms, not root causes. | `user`, `tenant`, `isSystemAdmin`, and `currentTenantId` are produced and cleared exactly as described in `03` Section 2. |
| 3. Service-layer seam | `services/admin/*.ts` wrappers and `services/*.ts` base services | Wrappers are the seam between admin UI and backend. Verifying the seam first determines whether the UI is using the documented backend contract or bypassing it. | Every admin call site maps to a documented RPC, Edge Function, or `from()` query; no admin service imports React. |
| 4. Capability domains | Tenant, Billing, Analytics, Members, Security, Audit, Compliance, Notifications, Storage, Monitoring, Health, Configuration | With boundaries and seams verified, each domain can be investigated independently without re-proving the foundation. Each domain follows the same layered method. | Every domain has at least one complete UI → service → RPC/Edge Function → database → trigger/realtime trace. |
| 5. Cross-layer consistency | End-to-end execution chains (Section 7) | After per-domain traces exist, compare them for contradictions across layers. | Every inconsistency is classified (Section 8) and assigned a confidence level (Section 9). |
| 6. Root-cause synthesis | Isolate root causes, not symptoms | Only after evidence is collected can symptoms be explained by deviations at the architecture, dependency, or execution layer. | Every reported root cause maps to a specific file, function, RPC, policy, or migration. |
| 7. Impact and prioritization | Severity and fix order (Section 12) | Impact is measured after root causes are known; otherwise severity is guesswork. | Deliverables from Section 14 are produced. |

### 4.2 Why this order is justified

The order mirrors the dependency direction of the admin surface (browser → `App.tsx` → contexts → hooks → wrapper services → base services → `lib/supabase.ts` → Supabase platform → Postgres). Investigating downstream before upstream turns every context bug into a page bug. Investigating upstream first collapses the symptom space before the domain-specific work begins.

---

## 5. Investigation Domains

Each domain below is investigated using the same template. Domain details are derived from the capability dependency tables in `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md`.

### 5.1 Authentication

| Attribute | Definition |
|---|---|
| Investigation Goal | Verify that the admin surface is only reachable for authenticated users whose `user.id` exists in `public.system_admins`. |
| Evidence Sources | `App.tsx` admin route guard, `contexts/AuthContext.tsx`, `lib/permissions.ts`, `is_system_admin` RPC, `system_admins` table. |
| Expected Runtime | `SIGNED_IN` event → `setSession`/`setUser` → `isSystemAdmin` check → route tree or `TenantForbiddenPage`. |
| Critical Dependencies | `AuthContext` must not render admin UI while `isAdminLoading` is true; `is_system_admin` must fail closed. |
| Cross-layer Verification | UI gate → `lib/permissions.isSystemAdmin()` → `is_system_admin` RPC → `system_admins` table. |
| Completion Criteria | Every path to an admin page is covered by a backend-enforced identity check; client-side `isSystemAdmin` is treated as UX-only. |

### 5.2 Authorization

| Attribute | Definition |
|---|---|
| Investigation Goal | Confirm that the real authorization boundary is on the backend and that `lib/permissions.ts` is not treated as authoritative. |
| Evidence Sources | `lib/permissions.ts`, `lib/supabase.ts`, all admin RPCs, all admin Edge Functions, RLS policies on admin-relevant tables. |
| Expected Runtime | Every privileged mutation passes through an RPC/Edge Function/RLS policy that checks `is_system_admin()` or equivalent role check. |
| Critical Dependencies | `SECURITY DEFINER` RPCs, Edge Function caller validation, RLS on `tenants`, `tenant_memberships`, `tenant_subscriptions`, etc. |
| Cross-layer Verification | UI intent → wrapper service → base service → RPC/Edge Function → database policy → row result. |
| Completion Criteria | No admin state mutation is executable solely because the UI believes the user is an admin. |

### 5.3 Tenant

| Attribute | Definition |
|---|---|
| Investigation Goal | Validate tenant CRUD, subdomain lifecycle, custom-domain verification, impersonation, backup/restore, and demo reset. |
| Evidence Sources | `pages/admin/Tenants.tsx`, `TenantDetail.tsx`, `Onboarding.tsx`, `services/admin/tenantAdminService.ts`, `services/tenantService.ts`, `services/admin/systemAdminService.ts`, RPCs in `02` Section 2.1, Edge Functions (`create-tenant`, `check-subdomain`, `verify-domain`, `delete-tenant`, `tenant-backup`, `tenant-restore`, `impersonate-tenant`, `end-impersonation`), and triggers on the `tenants` table. |
| Expected Runtime | Tenant-scoped operations correctly set/clear `currentTenantId` and impersonation state. |
| Critical Dependencies | `TenantContext` clears `currentTenantId` on `admin` host but admin pages still select a target tenant; Edge Functions use `service_role` but validate caller. |
| Cross-layer Verification | Tenant UI → `tenantAdminService` → base service → RPC/Edge Function → `tenants`/`tenant_memberships`/`tenant_subscriptions` → audit trigger. |
| Completion Criteria | Every tenant mutation leaves the database, audit log, and UI state consistent. |

### 5.4 Billing

| Attribute | Definition |
|---|---|
| Investigation Goal | Verify plan CRUD, subscription lifecycle, invoices, payments, and provider webhooks. |
| Evidence Sources | `pages/admin/Billing*.tsx`, `services/admin/billingAdminService.ts`, `services/planService.ts`, `services/invoiceService.ts`, `services/bankAccountService.ts`, `billingProviderRegistry.ts`, provider implementations, RPCs in `02` Section 2.2, Edge Functions (`process-checkout`, `send-billing-email`, `billing-webhooks`), and tables `tenant_subscriptions`, `invoices`, `payments`, `plans`. |
| Expected Runtime | Provider-specific signatures are verified in Edge Functions; `is_system_admin` guards plan mutations. |
| Critical Dependencies | `Tenant` and `Plans` are tightly coupled; plan schema changes propagate to `tenant_subscriptions` and `SubscriptionManager`. |
| Cross-layer Verification | Billing UI → provider registry → base service → RPC/Edge Function → `tenant_subscriptions`/`invoices`/`payments` → audit. |
| Completion Criteria | Every billing mutation is reflected in both the database and the relevant provider/state contract. |

### 5.5 Members

| Attribute | Definition |
|---|---|
| Investigation Goal | Confirm that membership invites, role changes, and removals are consistent with `tenant_memberships` and role permissions. |
| Evidence Sources | `pages/admin/Members*.tsx` or equivalent, `services/admin/memberAdminService.ts` if present, `lib/permissions.ts`, `tenant_memberships` table, related triggers. |
| Expected Runtime | Role changes are persisted through RPCs/RLS, not through client-side updates. |
| Critical Dependencies | `isTenantAdmin`/`isTenantOwner` RPCs, RLS on `tenant_memberships`, `invitations` table. |
| Cross-layer Verification | Member UI → member service → RPC/RLS → `tenant_memberships` → realtime/audit. |
| Completion Criteria | No role escalation is possible without a backend-enforced check. |

### 5.6 Analytics

| Attribute | Definition |
|---|---|
| Investigation Goal | Verify that revenue, churn, cohort, LTV, and tenant-growth metrics aggregate only data the requester is allowed to see. |
| Evidence Sources | `pages/admin/Analytics.tsx`, `pages/admin/Overview.tsx`, `services/admin/analyticsAdminService.ts`, `services/admin/tenantAdminService.ts`, RPCs (`get_revenue_metrics`, `get_churn_cohort_metrics`, `get_top_tenants`, `get_tenant_growth`, `get_system_overview`), tables `payments`, `invoices`, `tenant_subscriptions`, `tenants`. |
| Expected Runtime | Aggregated data is returned by `SECURITY DEFINER` RPCs; no tenant isolation is bypassed. |
| Critical Dependencies | `is_system_admin` on revenue RPCs. |
| Cross-layer Verification | Analytics UI → `analyticsAdminService` → RPC → Postgres aggregation → chart render. |
| Completion Criteria | Every metric can be reproduced from the SQL aggregation and matches the UI display. |

### 5.7 Audit

| Attribute | Definition |
|---|---|
| Investigation Goal | Confirm that every privileged admin action is written to `app_audit_log` and `admin_login_history` with correct actor and timestamp. |
| Evidence Sources | `contexts/AuthContext.tsx`, `services/auditService.ts`, `services/loginHistoryService.ts`, `app_audit_log`, `admin_login_history`, audit triggers. |
| Expected Runtime | `LOGIN`/`LOGOUT` and tenant mutations produce immutable audit rows before success is returned. |
| Critical Dependencies | Audit triggers (`trg_audit_log_*`) and explicit audit service calls must not be bypassed. |
| Cross-layer Verification | Action → audit service / trigger → `app_audit_log` row → readable from audit UI. |
| Completion Criteria | Every privileged action has a corresponding audit record or a documented exception. |

### 5.8 Compliance

| Attribute | Definition |
|---|---|
| Investigation Goal | Validate that compliance features (retention, export, consent flags) are wired to real data and enforced by the backend. |
| Evidence Sources | Compliance pages and services under `pages/admin/*` and `services/admin/*`, `system_settings`, compliance-related RPCs. |
| Expected Runtime | Compliance reads/writes follow the same service → backend pattern as other admin capabilities. |
| Critical Dependencies | `system_settings` values must not be mutable by non-admin users. |
| Cross-layer Verification | Compliance UI → compliance service → RPC/RLS → `system_settings` or dedicated compliance tables. |
| Completion Criteria | Compliance settings and reports are consistent with stored configuration and regulatory claims. |

### 5.9 Notifications

| Attribute | Definition |
|---|---|
| Investigation Goal | Confirm that admin notification delivery (`admin_events` realtime, in-app bell, emails) matches the event source. |
| Evidence Sources | `components/admin/AdminNotificationBell.tsx`, `useAdminRealtime`, `admin_events` realtime channel, notification service/Edge Function. |
| Expected Runtime | Realtime channel subscription is established after auth gate and receives events emitted by backend triggers or Edge Functions. |
| Critical Dependencies | Supabase Realtime authorization must match the same `is_system_admin` boundary. |
| Cross-layer Verification | Backend event → `admin_events` channel → `useAdminRealtime` → `AdminNotificationBell` render. |
| Completion Criteria | Every notification displayed in the UI is traceable to a backend-authorized event. |

### 5.10 Storage

| Attribute | Definition |
|---|---|
| Investigation Goal | Verify that admin storage operations (exports, backups, attachments) use signed URLs and bucket policies, not client secrets. |
| Evidence Sources | Backup/restore Edge Functions, `tenant-backup`, `tenant-restore`, Supabase Storage buckets, service-role key handling. |
| Expected Runtime | Storage access is brokered by Edge Functions or signed URLs; `SUPABASE_SERVICE_ROLE_KEY` never reaches the browser. |
| Critical Dependencies | Service-role keys are only used in Edge Functions. |
| Cross-layer Verification | Admin UI → Edge Function → Supabase Storage / Management API → returned artifact or URL. |
| Completion Criteria | No service-role key is present in frontend bundles or environment files shipped to the browser. |

### 5.11 Monitoring & Health

| Attribute | Definition |
|---|---|
| Investigation Goal | Confirm that health/monitoring pages display data from the same source of truth used by operational alerting. |
| Evidence Sources | `pages/admin/Overview.tsx`, `services/admin/systemAdminService.ts`, `get_system_overview` RPC, `system_settings`, `rate_limit_logs`. |
| Expected Runtime | Health metrics are computed from database state, not UI-local approximations. |
| Critical Dependencies | `get_system_overview` must be guarded by `is_system_admin`. |
| Cross-layer Verification | Health UI → `systemAdminService` → `get_system_overview` → aggregated tables → render. |
| Completion Criteria | Health display can be reproduced from the underlying RPC and matches operational indicators. |

### 5.12 Configuration

| Attribute | Definition |
|---|---|
| Investigation Goal | Validate that configuration toggles, feature flags, and system settings are persisted and enforced consistently. |
| Evidence Sources | `system_settings` table, `lib/permissions.ts` feature checks, `canUseFeature`, `services/admin/systemAdminService.ts`. |
| Expected Runtime | A setting change in the UI propagates through `systemAdminService` to `system_settings` and is reflected in `canUseFeature` checks on the next tenant load. |
| Critical Dependencies | `system_settings` RLS must prevent tenant users from mutating global settings. |
| Cross-layer Verification | Config UI → `systemAdminService` → RPC/RLS → `system_settings` → `canUseFeature` in tenant app. |
| Completion Criteria | Every configuration switch is stored in `system_settings` and enforced by backend checks, not by UI gating. |

---

## 6. Evidence Collection Strategy

Evidence is collected by layer. At each layer, the investigator records the artifact, its role in the execution model, and the exact line or object that supports a finding.

### 6.1 Frontend evidence

- For each admin page, record the route definition in `App.tsx`, the lazy-loading boundary, the contexts consumed, and the service functions called.
- Capture the props and state flow of `AdminLayout`, `AdminShell`, `AdminSidebar`, and `AdminDashboardHeader`.
- Verify that no component calls `supabase` directly; all backend access must go through `services/admin/*.ts` or documented base services.

### 6.2 Service-layer evidence

- For each `services/admin/*.ts` wrapper, list the base services it re-exports/adapts and the exact RPC/Edge Function names it invokes.
- For each base service, record the RPC signature, `from()` table, Edge Function name, and error-normalization behavior.
- Confirm that service files contain no React imports and no UI state mutations.

### 6.3 Contexts and hooks evidence

- For `AuthContext` and `TenantContext`, capture the boot sequence, the events that cause re-execution (`user` change, host change), and the module-level state they write (`currentTenantId`, `session`, `user`).
- For admin hooks (`useAdminList`, `useAdminRealtime`, `useConfirmDialog`), record the service functions they call and whether they bypass the service layer.

### 6.4 RPC evidence

- For each admin RPC used in the dependency map, record the function signature, `SECURITY DEFINER` / `SECURITY INVOKER` setting, and the authorization check inside the function body.
- Capture the schema location (`supabase/schema.sql` or migration file) and any trigger that fires as a side effect.

### 6.5 Edge Function evidence

- For each admin Edge Function, record the entry route, the request validation (JWT, tenant, signature), the `service_role` client usage, and the response contract.
- Capture imports from `supabase/functions/_shared/*` and any external API calls (Stripe, VNPay, Momo, Google DNS, Supabase Management API).

### 6.6 Database evidence

- For each admin-relevant table, record the primary/foreign keys, RLS policies, triggers, and constraints that enforce the domain invariant.
- Track migration order to detect drift between `schema.sql` and the current migration chain.

### 6.7 Triggers and realtime evidence

- For each trigger referenced in `02`, record the firing event (`BEFORE`/`AFTER INSERT/UPDATE/DELETE`), the function called, and whether it writes to audit or emits to `admin_events`.
- For realtime, record the channel topic, the event types subscribed, and the authorization hook.

### 6.8 Configuration and environment evidence

- Record every environment variable consumed by an admin code path and the file that consumes it.
- Mark as a gap any variable whose value is not present in the repository and is required to reproduce a finding.

---

## 7. Cross-Layer Verification Strategy

For every major admin execution chain, the investigator produces a trace and verifies consistency across the following layers:

```text
UI Component
  ↓  intent (user action, route, form submission)
Admin Page
  ↓  hooks/contexts
Wrapper Service (services/admin/*.ts)
  ↓  adapter/delegation
Base Service (services/*.ts)
  ↓  RPC / from() / Edge Function call
lib/supabase.ts (tenantFetch, x-tenant-id injection)
  ↓  HTTP
Supabase PostgREST / Edge Runtime
  ↓  SQL / TypeScript
Postgres Function / Trigger / RLS
  ↓  side effects
Realtime Event / Audit Row
  ↓  display
UI Update
```

### 7.1 Verification rules

1. **UI to Service:** The UI component must call only wrapper or base services. Direct `supabase` calls are classified as `Architecture inconsistency`.
2. **Service to Backend:** The service call must match a documented RPC, Edge Function, or `from()` query. Mismatched names are classified as `Contract inconsistency`.
3. **Backend to Database:** The RPC/Edge Function must perform the authorization check described in `01` and `03`. Missing or client-only checks are classified as `Security inconsistency`.
4. **Database to Realtime/Audit:** Triggers and realtime channels must fire as described in the execution model. Missing audit rows or realtime events are classified as `State inconsistency`.
5. **Realtime/Audit to UI:** The UI must display the state returned from the backend, not a locally cached assumption. Stale or optimistic UI is classified as `State inconsistency` only if it contradicts the source of truth.

### 7.2 Cross-layer comparison

After individual traces are produced, compare:

- The RPC signature expected by the base service with the actual Postgres function definition.
- The RLS policy on a table with the permission check in the calling RPC.
- The Edge Function response shape with the TypeScript type consumed by the service.
- The `x-tenant-id` injection in `lib/supabase.ts` with the tenant context that sets `currentTenantId`.

Any divergence is a finding.

---

## 8. Inconsistency Classification

Every finding must be classified before it is reported. The classification determines who owns the fix and how it should be prioritized.

| Category | Definition | Repository evidence required before reporting |
|---|---|---|
| Architecture inconsistency | A module performs work that belongs to a different layer. | File of the offending module, architecture layer table from `01`, and the layer that should own the work. |
| Dependency inconsistency | A module imports or depends on a module outside its documented dependency boundary. | File imports, `02` dependency table, and the artifact that is incorrectly depended upon. |
| Execution inconsistency | Runtime order, state transition, or lifecycle differs from `03`. | Code path showing actual execution order and `03` section describing expected order. |
| Business inconsistency | A workflow result contradicts the documented business rule. | RPC/Edge Function logic, table constraint, and the rule from `02` or `03`. |
| Security inconsistency | Authorization, authentication, or secret handling is weaker than the model requires. | Gate code, RPC/Edge Function validation, RLS policy, and the security dependency from `02`. |
| Permission inconsistency | A role or permission check is missing, duplicated, or incorrectly scoped. | `lib/permissions.ts`, `is_system_admin` RPC, RLS policies, and the relevant `tenant_memberships` logic. |
| RPC inconsistency | RPC signature, return shape, or authorization differs from caller expectation. | Base service call, `supabase/schema.sql` function definition, and migration file. |
| Edge Function inconsistency | Edge Function route, validation, or response contract differs from caller expectation. | Service invocation, `supabase/functions/<name>/index.ts`, and shared validation code. |
| Database inconsistency | Table data or constraints are inconsistent with the schema or with another table. | `schema.sql` or migration, actual query result (if runtime), and the expected invariant. |
| Migration inconsistency | Migration order or content is inconsistent with `schema.sql` or with runtime state. | Migration files under `supabase/migrations/`, `schema.sql`, and `supabase/migrations/atlas*` or `supabase/migrations/seed*` if present. |
| Schema inconsistency | A table/function/type is referenced in code but missing or different in schema. | Code reference, `schema.sql`, and migration chain. |
| Trigger inconsistency | A trigger fires the wrong event, calls the wrong function, or is missing. | `schema.sql` trigger definition and the operation that should invoke it. |
| RLS inconsistency | A table is accessible without the expected policy or the policy logic is wrong. | `schema.sql` RLS policy, the table definition, and the calling RPC/Edge Function. |
| Realtime inconsistency | A realtime channel emits or receives data without proper authorization or the wrong topic. | `useAdminRealtime` hook, `admin_events` channel configuration, and backend emit logic. |
| Configuration inconsistency | A runtime value differs from the expected environment/configuration source. | Code reference to the variable, deployment config, and the value observed at runtime. |
| Contract inconsistency | A frontend type/service call does not match the backend contract. | Frontend type definition, base service call, and backend function/Edge Function return type. |
| State inconsistency | UI or runtime state does not match the persisted source of truth. | UI state, service response, and database row after the operation. |
| Synchronization inconsistency | Concurrent or async operations produce interleaved state that violates the model. | Execution order in `03`, transaction boundaries, and realtime trigger sequence. |
| Data inconsistency | Stored rows violate a business invariant or referential integrity. | Database query result and the invariant from schema/RLS/trigger. |

No issue may be reported with only one artifact. The minimum evidence set is:

1. The file/object that exhibits the behavior.
2. The architecture/dependency/execution expectation it violates.
3. The cross-layer trace that connects the two.

---

## 9. Evidence Confidence Model

Each finding receives one confidence level. The level determines whether the finding can be acted upon immediately or requires runtime confirmation.

| Level | Definition | Required repository evidence |
|---|---|---|
| **Confirmed** | The inconsistency is visible in repository code and is not contradicted by any other repository artifact. | File/object, exact lines, architecture/dependency/execution reference, and no contradictory evidence in the same codebase. |
| **Highly Probable** | The repository strongly implies the inconsistency; only runtime observation is missing to confirm impact. | Same as Confirmed, plus a clear runtime scenario that would prove or disprove the finding. |
| **Possible** | One repository artifact suggests an issue, but another artifact leaves room for an alternative explanation. | The contradictory artifacts must both be recorded. |
| **Unconfirmed** | A suspicious pattern is observed, but it cannot yet be tied to the architecture/dependency/execution model. | The observation is recorded as a lead, not as a finding. |

A finding may not be promoted from Possible to Confirmed until the conflicting artifact is resolved. A finding may not be promoted from Unconfirmed to Possible until it is mapped to a documented layer.

---

## 10. Root Cause Isolation Strategy

### 10.1 Principle

The investigation must stop at the layer where the deviation from the established model first occurs. That layer is the root cause; everything downstream is a symptom.

### 10.2 Method

For each finding:

1. **State the symptom in user terms.** Example: "Admin user can see tenant list after impersonation ends."
2. **Trace the symptom to the first layer that should have prevented it.** In order:
   - UI (should not render without state)
   - Context (should clear `isImpersonating`/`currentTenantId`)
   - `lib/supabase.ts` (`x-tenant-id` injection)
   - Wrapper/base service (should pass correct tenant)
   - RPC/Edge Function (should re-validate caller)
   - RLS/Trigger (should enforce row-level rule)
3. **Identify the first layer where the expected guard is missing or wrong.** This is the root cause.
4. **Classify the finding using Section 8.**
5. **Assign a confidence level using Section 9.**

### 10.3 Avoiding symptom fixing

If the same suspicious call pattern appears in multiple pages, the investigation fixes the shared service/RPC once, not each page. Patching only the path named in a ticket leaves sibling callers broken and produces a false sense of completion.

---

## 11. Impact Analysis Strategy

Impact is measured only after a root cause is isolated. It is computed across five dimensions.

| Dimension | How it is measured | Source |
|---|---|---|
| Architecture | Which layer ownership is violated and how many capabilities depend on that layer. | `01` architectural layers and `02` dependency map. |
| Dependency | How many call sites, pages, and downstream modules are affected by the flawed module. | `02` capability dependency tables and `codebase-memory` inbound call counts. |
| Execution | Whether the issue occurs on every boot/login/state change or only under specific timing. | `03` boot sequence, login lifecycle, token refresh, and trigger order. |
| Business | Which business operations (tenant, billing, member, analytics, audit) can produce incorrect outcomes. | `02` capability tables and domain RPCs. |
| Security | Whether the issue allows privilege escalation, data leakage, or unauthorized mutation. | `01` security boundary statements and `02` security dependencies. |
| Data | Whether the issue can corrupt, duplicate, or lose persisted rows. | Schema constraints, triggers, RLS, and migration integrity. |

A root cause that crosses more dimensions is ranked higher in Section 12.

---

## 12. Investigation Prioritization

### 12.1 Ranking factors

Each in-scope domain and root cause is scored against the following factors. Higher combined score means earlier investigation.

| Factor | Why it matters | How to evaluate |
|---|---|---|
| Expected Risk | Likelihood that the domain has security, data-loss, or compliance implications. | Security boundaries in `01` and sensitive tables in `02`. |
| Execution Criticality | The domain is on the critical path for boot, login, or admin gating. | `03` boot sequence and auth execution. |
| Dependency Criticality | Many other capabilities depend on this domain. | `02` propagation statements and `codebase-memory` inbound degree. |
| Business Criticality | The domain manages money, tenants, or membership. | `02` capability purpose. |
| Runtime Frequency | The execution path is triggered on every admin session or common action. | `03` runtime sequences and page routing. |
| Change Propagation | Schema or RPC changes here ripple to many modules. | `02` propagation notes. |
| Recovery Difficulty | A bug here is hard to reverse (billing, data mutation, audit log). | Database constraints, backup/restore Edge Functions, trigger side effects. |

### 12.2 Suggested priority order

Based on the factors above and the baselines, the recommended investigation order is:

1. **Authentication & Authorization** — gate failure is catastrophic and invalidates every downstream finding.
2. **Tenant Management** — tenant mutations propagate to billing, members, and analytics; impersonation has elevated risk.
3. **Billing** — direct financial impact and external provider contracts.
4. **Members & Permissions** — role escalation and data leakage potential.
5. **Audit & Compliance** — if audit is missing, other findings cannot be reconstructed.
6. **Storage & Backups** — service-role key exposure and data-loss risk.
7. **Analytics & Monitoring** — lower direct risk, but feeds executive decisions.
8. **Notifications & Configuration** — last because their failures are usually visible but lower blast radius.

This order is a starting point. The actual investigation re-evaluates priority whenever a root cause changes the dependency graph or risk profile.

---

## 13. Evidence Traceability

Every future finding must be traceable through the following chain:

```text
Finding
  ↓  classified by Section 8
Evidence
  ↓  file, line, object, or runtime observation
Execution Path
  ↓  described in Section 7
Dependency
  ↓  from 02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md
Architecture
  ↓  from 01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md
Repository Files
  ↓  git path and commit/head
Database Objects
  ↓  table/RPC/edge function/trigger/RLS/migration
```

Each finding record must contain:

- Finding ID (`FIND-YYYYNNN`).
- Title and one-sentence symptom.
- Classification from Section 8.
- Confidence level from Section 9.
- Evidence list (file paths, line numbers, object names).
- Execution path trace.
- Dependency and architecture references.
- Root cause statement.
- Impact assessment from Section 11.

---

## 14. Deliverables

The future forensic investigation must produce exactly the following documents:

1. `ADMIN_DASHBOARD_FORENSIC/01_EXECUTIVE_FINDINGS.md` — high-level findings, risk summary, and prioritized remediation order.
2. `ADMIN_DASHBOARD_FORENSIC/02_EVIDENCE_INVENTORY.md` — all collected evidence by layer with file/line/object references.
3. `ADMIN_DASHBOARD_FORENSIC/03_CROSS_LAYER_TRACES.md` — one trace per major execution chain, formatted per Section 7.
4. `ADMIN_DASHBOARD_FORENSIC/04_CLASSIFIED_FINDINGS.md` — every finding with classification, confidence, root cause, and impact.
5. `ADMIN_DASHBOARD_FORENSIC/05_GAPS_AND_LIMITATIONS.md` — missing evidence, runtime gaps, and assumptions made.

No other deliverables are required. No code changes, refactoring recommendations, or TODOs are produced by the investigation.

---

## 15. Investigation Readiness Assessment

### 15.1 Current state

The repository knowledge is **sufficient to begin the static, repository-based phase** of the forensic investigation. The following assets are in place:

- `01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md` establishes layer ownership and entry conditions.
- `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md` maps each admin capability to its components, contexts, services, RPCs, Edge Functions, tables, triggers, and configuration.
- `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md` describes boot order, auth lifecycle, tenant resolution, and runtime ownership.
- The `codebase-memory` MCP graph indexes the repository and provides cross-reference and call-graph support (e.g., 368 ranked matches for "admin dashboard" and 306 admin-related artifacts).

### 15.2 Evidence still missing

The following evidence is **not in the repository** and must be obtained before findings that depend on runtime behavior can be promoted to Confirmed:

1. **Live database state** — row-level data, migration version, and `supabase/migrations` deployment status.
2. **Runtime environment values** — actual `.env` values for `VITE_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_MANAGEMENT_TOKEN`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, and `RESEND_FROM`.
3. **Supabase project configuration** — Edge Function deployment state, realtime channel policies, storage bucket RLS, and auth settings.
4. **Audit/realtime logs** — `app_audit_log`, `admin_login_history`, and `admin_events` delivery traces.
5. **Third-party provider state** — Stripe/VNPay/Momo sandbox or production account configuration and webhook history.

### 15.3 Recommendation

Begin the static investigation immediately using the repository and the three baseline documents. When a finding reaches Possible or Highly Probable, request the specific missing evidence above before promoting it to Confirmed.

---

## 16. Executive Summary

This investigation plan treats the VietSale Pro Admin Dashboard as a layered, evidence-bound system. It directs the future forensic investigation to follow the proven order of **Architecture → Dependency → Execution → Evidence → Root Cause**, so that findings are anchored to the repository and cross-verified across every layer they touch.

The strategy is expected to maximize finding accuracy because it requires every deviation to be classified, traced to a documented layer, and supported by multiple repository artifacts before it is reported. It minimizes false positives by distinguishing architecture/dependency/execution expectations from symptoms and by prohibiting assumptions when repository evidence is missing.

The repository is ready for the static phase. Runtime and third-party evidence must be gathered only when a finding requires confirmation beyond what the code can show.

**Next step:** Execute the staged investigation order in Section 4, producing the five deliverables in Section 14.
