# Admin Dashboard Root Cause Analysis

**Document ID:** `07_ADMIN_DASHBOARD_ROOT_CAUSE_ANALYSIS.md`  
**Investigation ID:** `AD-Forensic-2026-07-20`  
**Repository:** `C:\PROJECT\vietsalepro`  
**Commit:** `3a06a6d9` (production governance baseline before cutover, RC-2026-07-19-01)  
**Date:** 2026-07-20

---

## 1. Purpose

This document performs the official Root Cause Analysis (RCA) for the confirmed findings recorded in `06_ADMIN_DASHBOARD_FORENSIC_INVESTIGATION.md`. It determines **why** those findings occurred by transforming each confirmed observation into a traceable, evidence-backed causal chain. It does **not** collect new evidence, prescribe fixes, or redesign architecture. It is the authoritative input for `08_ADMIN_DASHBOARD_FINAL_RECOMMENDATIONS.md`.

---

## 2. Authoritative Baselines

The following documents are the only sources of architecture, dependency, execution, and forensic evidence used in this analysis.

| # | Document | Role in this RCA |
|---|---|---|
| 01 | `ADMIN_DASHBOARD_PLAN/01_ADMIN_DASHBOARD_ARCHITECTURE_MODEL.md` | Defines layer ownership, module responsibilities, and architectural boundaries. |
| 02 | `ADMIN_DASHBOARD_PLAN/02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md` | Defines capability-to-artifact dependencies, reachability, and propagation. |
| 03 | `ADMIN_DASHBOARD_PLAN/03_ADMIN_DASHBOARD_EXECUTION_MODEL.md` | Defines runtime order, state transitions, and lifecycle expectations. |
| 04 | `ADMIN_DASHBOARD_PLAN/04_ADMIN_DASHBOARD_INVESTIGATION_PLAN.md` | Defines investigation scope, classification taxonomy, and confidence model. |
| 05 | `ADMIN_DASHBOARD_PLAN/05_ADMIN_DASHBOARD_FORENSIC_EXECUTION_PROTOCOL.md` | Defines the repeatable procedure used to produce the forensic record. |
| 06 | `ADMIN_DASHBOARD_PLAN/06_ADMIN_DASHBOARD_FORENSIC_INVESTIGATION.md` | The confirmed finding inventory and root-cause candidates used as evidence. |

All repository evidence paths are relative to `C:\PROJECT\vietsalepro`.

---

## 3. Analysis Scope

### 3.1 In Scope

- Admin route gating, authentication, and authorization layers (`App.tsx`, `AuthContext.tsx`, `lib/permissions.ts`, `lib/supabase.ts`).
- Tenant context and `currentTenantId` ownership (`contexts/TenantContext.tsx`).
- Membership activation flow (`AuthContext.tsx` → `activate_pending_memberships` RPC).
- Notification / announcement admin surface (`pages/admin/*`, `services/notificationService.ts`, Edge Functions).
- Cross-layer consistency between the architecture model and the repository implementation.

### 3.2 Out of Scope

- Remediation, refactoring, or implementation recommendations.
- New evidence collection, runtime testing, or third-party service status.
- Operational features that are not reachable from the admin surface.

---

## 4. Root Cause Methodology

Every confirmed finding is processed using the following chain:

```text
Finding
  ↓
Evidence (repository file, line, RPC, table)
  ↓
Cross-layer Trace (Presentation → Application → Service → Infrastructure → Platform → Data)
  ↓
First Layer of Divergence (the first place the implementation departs from the approved model)
  ↓
Contributing Factors
  ↓
Propagation (how the divergence spreads to other layers/capabilities)
  ↓
System Impact
  ↓
Root Cause
  ↓
Confidence
```

**Rule:** The first layer where the observed implementation diverges from the approved model is the Root Cause. Everything after that point is a symptom or downstream effect.

---

## 5. Finding Consolidation

### 5.1 Source Findings from Document 06

| Finding ID | Original Text (Document 06) | Capability | Classification | Confidence |
|---|---|---|---|---|
| F-001 | `App.tsx` directly queries `system_admins` table for the admin gate rather than using `isSystemAdmin()` helper or `is_system_admin` RPC. | Authentication | Architecture/Security | Confirmed |
| F-002 | `lib/permissions.ts` uses `is_system_admin` RPC while `App.tsx` uses direct `from("system_admins")`; two different enforcement paths for the same system-admin check. | Authorization | Architecture/Security | Confirmed |
| F-003 | Multiple tenant management RPCs and Edge Functions exist; the repository trace shows `services/admin/tenantAdminService.ts` and `services/tenantService.ts` as seams. | Tenant | Dependency | Confirmed |
| F-004 | `AuthContext.tsx` calls `supabase.rpc("activate_pending_memberships", ...)` on `SIGNED_IN`, not through a service wrapper. | Audit | Architecture/Execution | Confirmed |
| F-005 | No `pages/admin/*` route or component for announcements/email templates was observed in the scan. | Notifications | Capability/Gap | Confirmed |
| F-006 | `lib/supabase.ts` is the single typed Supabase client imported by every service/context; `tenantFetch` injects `x-tenant-id` from module-level `currentTenantId`. | Infrastructure | Architecture | Confirmed |
| F-007 | `TenantContext.tsx` is the only runtime writer of `currentTenantId` observed; it clears tenant when host is `admin`. | Execution | Execution | Confirmed |
| F-008 | `App.tsx` admin gate uses direct `supabase.from("system_admins")` query, not `lib/permissions.ts` `isSystemAdmin()` or `is_system_admin` RPC. | Authentication | Security/Architecture | Confirmed |
| F-009 | `AuthContext.tsx` performs `supabase.rpc("activate_pending_memberships", ...)` on `SIGNED_IN` without using a service wrapper. | Authentication | Architecture | Confirmed |

### 5.2 Duplicate Merge

| Merged Group | Findings | Rationale |
|---|---|---|
| **G-001** | F-001, F-008 | Both identify the same divergence: `App.tsx` admin gate uses `supabase.from('system_admins')` instead of `lib/permissions.ts` `isSystemAdmin()` / `is_system_admin` RPC. |
| **G-002** | F-004, F-009 | Both identify the same divergence: `AuthContext.tsx` invokes `activate_pending_memberships` RPC directly instead of through a service wrapper. |
| **G-003** | F-002 | Observation of the dual enforcement paths that result from G-001. |
| **G-004** | F-005 | Stand-alone capability gap. |
| **G-005** | F-006, F-007 | Conformance findings confirming the expected single-client and tenant-id ownership models. |
| **G-006** | F-003 | Conformance finding confirming tenant-management seams match the dependency model. |

### 5.3 Confidence Segregation

| Category | Items |
|---|---|
| **Confirmed** | F-001/F-008, F-002, F-004/F-009, F-005 |
| **Highly Probable** | — |
| **Possible** | — |
| **Unconfirmed** | — |
| **Conformance (not a defect)** | F-003, F-006, F-007 |

All findings are classified as `Confirmed` because they are directly anchored to repository file content, line numbers, or the absence of expected files. F-003, F-006, and F-007 are conformance observations and are therefore not treated as root causes.

---

## 6. Symptom Clustering

Findings are grouped into logical clusters that correspond to the layers and capabilities they affect.

| Cluster | Findings | Layer(s) | Nature |
|---|---|---|---|
| **C-1: Admin Gate Authorization** | F-001, F-002, F-008 | Application / Security | Divergence |
| **C-2: Context Business Write** | F-004, F-009 | Application / Context | Divergence |
| **C-3: Notification Capability Gap** | F-005 | Presentation | Divergence (absence) |
| **C-4: Infrastructure Conformance** | F-006, F-007 | Infrastructure / Context | Conformance |
| **C-5: Tenant Dependency Conformance** | F-003 | Dependency | Conformance |

---

## 7. Causal Chain Analysis

### 7.1 Cluster C-1: Admin Gate Authorization

```text
Expected Model
  App.tsx admin gate
    → uses lib/permissions.ts isSystemAdmin()
    → calls is_system_admin RPC
    → backend SECURITY DEFINER function checks public.system_admins

Observed Behavior
  App.tsx admin gate
    → calls supabase.from('system_admins').select('user_id').eq('user_id', user.id).maybeSingle()
    → bypasses isSystemAdmin() helper and is_system_admin RPC

First Divergence
  App.tsx lines 212-217 (direct table query)

Contributing Factors
  - isSystemAdmin() helper exists in lib/permissions.ts (lines 123-130) but is not consumed by App.tsx.
  - App.tsx already imports supabase from lib/supabase.ts, making direct client access available.
  - No static or runtime guard prevents App.tsx from querying a table directly.

Propagation
  - Two different system-admin checks coexist: one in lib/permissions.ts (RPC) and one in App.tsx (direct table query).
  - The admin route gate now depends on RLS/PostgREST behavior for the direct table path instead of the documented SECURITY DEFINER RPC.
  - Any change to RLS on system_admins or PostgREST policy may cause the gate to behave differently from the helper used elsewhere.

Visible Symptoms
  - F-002: Two enforcement paths for the same check.
  - F-001/F-008: Direct table query in App.tsx.

Root Cause
  RCA-ADM-001: App.tsx owns the system-admin eligibility check by querying system_admins directly instead of delegating to the approved permissions helper/RPC.

Confidence
  Confirmed (repository evidence: App.tsx lines 212-217; lib/permissions.ts lines 123-130; Document 06 F-001/F-002/F-008).
```

### 7.2 Cluster C-2: Context Business Write

```text
Expected Model
  AuthContext on SIGNED_IN
    → updates session/user state only
    → delegates membership activation to a service wrapper (e.g., services/admin/memberAdminService.ts or services/memberService.ts)
    → service wrapper calls activate_pending_memberships RPC

Observed Behavior
  AuthContext on SIGNED_IN
    → directly invokes supabase.rpc('activate_pending_memberships', { p_user_id: newSession.user.id })
    → no service wrapper is involved

First Divergence
  contexts/AuthContext.tsx lines 90-92 (direct RPC call inside auth state handler)

Contributing Factors
  - AuthContext already imports supabase from lib/supabase.ts.
  - The member activation wrapper service exists but is not used here.
  - The SIGNED_IN handler mixes auth lifecycle actions (audit, login history, activation) without a documented seam for business writes.

Propagation
  - Business write responsibility leaks into the Context layer.
  - The membership activation logic is coupled to the authentication lifecycle and cannot be reused, tested, or mocked in isolation.
  - A failure in activate_pending_memberships is swallowed (.catch(() => {})) and cannot be surfaced to the UI consistently because no service normalizes the error.

Visible Symptoms
  - F-004/F-009: AuthContext calls activate_pending_memberships directly.

Root Cause
  RCA-ADM-002: AuthContext.tsx performs a tenant-membership business write by calling activate_pending_memberships RPC directly instead of routing through the service layer.

Confidence
  Confirmed (repository evidence: contexts/AuthContext.tsx lines 90-92; Document 06 F-004/F-009).
```

### 7.3 Cluster C-3: Notification Capability Gap

```text
Expected Model
  pages/admin/* contains an announcements / email-template management page
    → routes in App.tsx lazy-load the page
    → services/announcementService.ts or services/emailTemplateService.ts provides the seam
    → Edge Functions send-email/send-sms/send-template-email deliver the messages

Observed Behavior
  - No pages/admin/* component or route for announcements/email templates was found.
  - The notification service files and Edge Functions exist, but there is no admin presentation layer wiring them to the admin route tree.

First Divergence
  Missing presentation artifact (no admin page/route for Notifications/Announcements)

Contributing Factors
  - Admin route tree in App.tsx does not reference an Announcements or Notifications page.
  - Backend support (RPCs, tables, Edge Functions) exists, so the divergence is purely at the presentation/routing layer.

Propagation
  - Admins cannot manage announcements or templates through the admin surface.
  - The capability remains reachable only through direct service/database access, not through the documented UI dependency chain.

Visible Symptoms
  - F-005: No pages/admin/* route or component for announcements/email templates.

Root Cause
  RCA-ADM-003: The Notifications/Announcements admin presentation layer is absent from the admin route tree, leaving the backend capability unwired.

Confidence
  Confirmed (repository evidence: Document 06 F-005; no matching `pages/admin/*` file or `App.tsx` route found for announcements/email templates).
```

### 7.4 Cluster C-4/C-5: Conformance Findings

`F-006` and `F-007` confirm that `lib/supabase.ts` is the single typed client and that `TenantContext.tsx` is the sole runtime writer of `currentTenantId`. These are not root causes; they are controls that are operating as designed. `F-003` confirms that tenant-management seams (`services/admin/tenantAdminService.ts`, `services/tenantService.ts`) align with the dependency model. These findings are intentionally excluded from the root-cause list.

---

## 8. Primary Root Causes

### RCA-ADM-001: `App.tsx` Admin Gate Bypasses `isSystemAdmin()` and `is_system_admin` RPC

| Field | Value |
|---|---|
| **Root Cause ID** | `RCA-ADM-001` |
| **Title** | `App.tsx` admin gate bypasses `isSystemAdmin()` and `is_system_admin` RPC |
| **Description** | The admin route gate in `App.tsx` executes `supabase.from('system_admins').select('user_id').eq('user_id', user.id).maybeSingle()` to determine whether the current user is a system admin. This bypasses the `isSystemAdmin()` helper in `lib/permissions.ts` and the `is_system_admin` SECURITY DEFINER RPC, creating a second, client-side authorization path that depends on direct table access instead of the documented backend enforcement. |
| **Evidence IDs** | F-001, F-002, F-008 |
| **Cross-layer Trace** | `App.tsx` (Presentation/Application) → `lib/supabase.ts` (Infrastructure) → PostgREST direct `from('system_admins')` → `system_admins` table. The expected path is `App.tsx` → `lib/permissions.ts` → `is_system_admin` RPC → `system_admins` table. |
| **First Divergence** | `App.tsx` lines 212-217 (`const { data } = await supabase.from('system_admins').select('user_id').eq('user_id', user.id).maybeSingle();`) |
| **Supporting Evidence** | `lib/permissions.ts` lines 123-130 define `isSystemAdmin()` using `supabase.rpc('is_system_admin')`; `06` F-001/F-002/F-008 confirm the divergence. |
| **Contradicting Evidence** | None. The repository clearly contains the helper and RPC that the model expects. |
| **Propagation** | The admin route gate now depends on the `system_admins` table being directly readable through RLS/PostgREST. Any change to `system_admins` RLS or the PostgREST policy can change the gate outcome independently of `is_system_admin`. Other callers that use `isSystemAdmin()` (e.g., `canCurrentUserDeleteTenant`) may receive a different answer than the admin gate for the same user. |
| **Affected Layers** | Presentation, Application, Infrastructure, Platform, Data |
| **Affected Capabilities** | All `/admin/*` route access, system-admin gating, login flow, forbidden-page rendering |
| **Confidence** | Confirmed |
| **Severity** | High |
| **Repository Evidence** | `App.tsx` lines 212-217; `lib/permissions.ts` lines 123-130; `06` F-001, F-002, F-008 |

---

### RCA-ADM-002: `AuthContext.tsx` Performs Tenant-Membership Business Write Directly

| Field | Value |
|---|---|
| **Root Cause ID** | `RCA-ADM-002` |
| **Title** | `AuthContext.tsx` performs tenant-membership business write directly via `activate_pending_memberships` RPC |
| **Description** | On `SIGNED_IN`, `AuthContext.tsx` calls `supabase.rpc('activate_pending_memberships', { p_user_id: newSession.user.id })` without using a service wrapper. The approved execution model assigns business writes to the Service layer; contexts must only manage cross-cutting runtime state (session, user, tenant). This leak places a membership-side effect inside the authentication lifecycle and makes the activation logic non-reusable, non-testable, and inconsistently error-handled. |
| **Evidence IDs** | F-004, F-009 |
| **Cross-layer Trace** | `AuthContext.tsx` (Application/Context) → `lib/supabase.ts` (Infrastructure) → `activate_pending_memberships` RPC → `tenant_memberships` table. The expected path is `AuthContext.tsx` → `services/admin/memberAdminService.ts` (or base `services/memberService.ts`) → `activate_pending_memberships` RPC → `tenant_memberships` table. |
| **First Divergence** | `contexts/AuthContext.tsx` lines 90-92 (`Promise.resolve(supabase.rpc('activate_pending_memberships', { p_user_id: newSession.user.id })).catch(() => {});`) |
| **Supporting Evidence** | `06` F-004 and F-009; `03_ADMIN_DASHBOARD_EXECUTION_MODEL.md` Section 2 states contexts must not perform business writes; `01` module responsibilities for `AuthContext` list only session/user state. |
| **Contradicting Evidence** | None. `AuthContext` also writes audit/login-history through services (`writeAuditLog`, `recordAdminLogin`), which demonstrates that the correct pattern is available in the same function. |
| **Propagation** | The context layer now owns membership activation, causing the sign-in flow to be coupled to tenant-membership side effects. Errors are silently discarded, so a failed activation cannot be reported to the UI. Any change to the activation contract must be edited in `AuthContext.tsx` rather than in a single service. |
| **Affected Layers** | Application/Context, Service, Infrastructure, Platform, Data |
| **Affected Capabilities** | Sign-in flow, pending membership activation, tenant member list, invitation acceptance, `/admin/members` page |
| **Confidence** | Confirmed |
| **Severity** | Medium |
| **Repository Evidence** | `contexts/AuthContext.tsx` lines 90-92; `06` F-004, F-009; `01` `AuthContext` module responsibilities |

---

### RCA-ADM-003: Missing Admin Presentation Layer for Notifications / Announcements

| Field | Value |
|---|---|
| **Root Cause ID** | `RCA-ADM-003` |
| **Title** | Missing admin presentation layer for Notifications / Announcements |
| **Description** | The Notifications capability (announcements, email templates, SMS, notification logs) is supported by `services/announcementService.ts`, `services/emailTemplateService.ts`, `services/notificationService.ts`, and Edge Functions (`send-email`, `send-sms`, `send-template-email`), but no `pages/admin/*` component or `App.tsx` route was observed. The first layer of divergence is therefore the absence of the presentation artifact required by the architecture model. |
| **Evidence IDs** | F-005 |
| **Cross-layer Trace** | Expected: `App.tsx` admin route tree → `pages/admin/Notifications.tsx` (or equivalent) → `services/notificationService.ts` (or `announcementService.ts` / `emailTemplateService.ts`) → Edge Functions. Observed: the route tree does not reference any such page; service/backend artifacts are present but unwired. |
| **First Divergence** | Missing `pages/admin/*` component and route entry in `App.tsx` for notifications/announcements. |
| **Supporting Evidence** | `06` F-005; `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md` Section 2.6 lists Edge Functions and services for the Notifications capability; `App.tsx` admin route tree contains no matching route. |
| **Contradicting Evidence** | None observed. A page could theoretically be merged into `Settings`, but no evidence of that wiring was found. |
| **Propagation** | Admins cannot create or manage announcements/email templates through the admin UI. The backend capability is reachable only by other consumers or by direct invocation, creating a functional gap in the admin surface. |
| **Affected Layers** | Presentation, Dependency |
| **Affected Capabilities** | System announcements, email templates, SMS, notification logs |
| **Confidence** | Confirmed |
| **Severity** | Low-Medium |
| **Repository Evidence** | `06` F-005; `02` Notifications dependency table; absence of matching `pages/admin/*` file and route |

---

## 9. Secondary Root Causes

Secondary root causes are enabling conditions that allow the primary root causes to persist. They are not the origin of the symptom, but they explain why the divergence was possible.

### RCA-ADM-S01: `isSystemAdmin()` Helper Exists But Is Not Consumed by `App.tsx`

| Field | Value |
|---|---|
| **Root Cause ID** | `RCA-ADM-S01` |
| **Description** | The approved helper `isSystemAdmin()` in `lib/permissions.ts` is defined and exported (lines 123-130) but `App.tsx` does not import or call it. This availability mismatch allows the admin gate to implement its own direct query. |
| **Enabled Primary** | `RCA-ADM-001` |
| **Repository Evidence** | `lib/permissions.ts` lines 123-130; `App.tsx` lines 212-217 (no reference to `isSystemAdmin`) |

### RCA-ADM-S02: Service Wrappers for Member Activation Exist But Are Not Used by `AuthContext`

| Field | Value |
|---|---|
| **Root Cause ID** | `RCA-ADM-S02` |
| **Description** | `services/admin/memberAdminService.ts` and base member services exist in the repository, but `AuthContext.tsx` calls `activate_pending_memberships` RPC directly. The presence of the wrapper without consumption by the context layer enables the business-write leak. |
| **Enabled Primary** | `RCA-ADM-002` |
| **Repository Evidence** | `02_ADMIN_DASHBOARD_DEPENDENCY_MAP.md` Members capability table; `06` F-004/F-009; `contexts/AuthContext.tsx` lines 90-92 |

### RCA-ADM-S03: Direct `supabase` Client Import in Application/Context Layers

| Field | Value |
|---|---|
| **Root Cause ID** | `RCA-ADM-S03` |
| **Description** | `App.tsx` and `AuthContext.tsx` both import `supabase` from `lib/supabase.ts`. While `lib/supabase.ts` correctly owns the single typed client, the lack of an enforced boundary allows presentation and context modules to call `supabase.from(...)` and `supabase.rpc(...)` directly, bypassing the service layer. |
| **Enabled Primary** | `RCA-ADM-001`, `RCA-ADM-002` |
| **Repository Evidence** | `App.tsx` lines 212-217; `contexts/AuthContext.tsx` lines 90-92; `01` layer ownership table (React components/contexts must not call `supabase` directly) |

---

## 10. Non Root Causes

These findings are real, but they are either downstream symptoms of the primary root causes or conformance observations that do not explain a defect.

| NRC ID | Finding / Observation | Why It Is Not a Root Cause |
|---|---|---|
| **NRC-001** | `TenantForbiddenPage` renders when `!isSystemAdmin` | This is a downstream UI symptom. The reason the forbidden page is reached is `RCA-ADM-001` (the gate logic that produced `isSystemAdmin` is duplicated and direct). |
| **NRC-002** | `isAdminLoading` gating in `App.tsx` | This is a rendering-state effect caused by the async admin check, not the cause of the check being implemented as a direct table query. |
| **NRC-003** | F-002 (two enforcement paths for system-admin check) | This is the *observation* of divergence, not a root cause. It is the combined effect of `RCA-ADM-001` (App.tsx direct query) and the correctly-implemented `lib/permissions.ts` helper. |
| **NRC-004** | F-006 and F-007 (single `supabase` client, `TenantContext` owns `currentTenantId`) | These are conformance findings. They confirm the infrastructure behaves as designed and do not cause any observed defect. |
| **NRC-005** | F-003 (tenant management seams exist) | This is a conformance/dependency finding. It confirms the expected wrapper/base-service seams are present and does not identify a divergence. |

---

## 11. Architectural Violations

| Layer | Expected Owner | Approved Responsibility | Violating Artifact | Violation |
|---|---|---|---|---|
| **Presentation / Application** | `App.tsx` | Route guard, lazy loading, render tree selection | `App.tsx` lines 209-217 | Performs a direct `supabase.from('system_admins')` query to decide admin eligibility, mixing security/data access into the routing layer. |
| **Application / Context** | `AuthContext.tsx` | Session, user, MFA pending, login/logout lifecycle | `AuthContext.tsx` lines 90-92 | Calls `supabase.rpc('activate_pending_memberships', ...)` on `SIGNED_IN`, performing a tenant-membership business write inside the auth state handler. |

---

## 12. Dependency Violations

| Expected Dependency Chain (from 02 / 03) | Observed Dependency Chain | Divergence File | Type |
|---|---|---|---|
| `App.tsx` → `lib/permissions.ts` → `is_system_admin` RPC → `system_admins` | `App.tsx` → `lib/supabase.ts` → `supabase.from('system_admins')` → `system_admins` | `App.tsx` lines 212-217 | Authorization seam bypass |
| `AuthContext` → `services/admin/memberAdminService.ts` (or base `memberService.ts`) → `activate_pending_memberships` RPC | `AuthContext` → `lib/supabase.ts` → `activate_pending_memberships` RPC | `AuthContext.tsx` lines 90-92 | Service wrapper bypass |
| `App.tsx` admin route tree → `pages/admin/*` for Notifications → `services/notificationService.ts` / Edge Functions | `App.tsx` admin route tree does not reference Notifications page | `App.tsx` admin route block | Missing presentation dependency |

---

## 13. Execution Violations

| Expected Runtime (from 03) | Observed Runtime | Violation |
|---|---|---|
| `AppContent` waits for `isSystemAdmin` produced through `isSystemAdmin()` helper / `is_system_admin` RPC. | `AppContent` waits for `isSystemAdmin` produced by `supabase.from('system_admins')` direct query. | The admin eligibility decision is made through an undocumented client-side table query rather than the approved RPC. |
| `AuthContext` SIGNED_IN handler records session state and delegates side effects to services. | `AuthContext` SIGNED_IN handler directly invokes `activate_pending_memberships` RPC alongside audit/login-history services. | A business write is executed inside the context lifecycle, coupling membership state to authentication. |

---

## 14. Systemic Causes

The primary root causes are symptoms of repeated organizational/implementation patterns. These systemic patterns are the underlying conditions that allowed the divergences to be introduced and to remain undetected.

| Pattern | Evidence | Affected Root Cause |
|---|---|---|
| **Direct Supabase usage outside the Service layer** | `App.tsx` `supabase.from('system_admins')`; `AuthContext.tsx` `supabase.rpc('activate_pending_memberships')` | RCA-ADM-001, RCA-ADM-002 |
| **Missing or unused wrapper services** | `lib/permissions.ts` `isSystemAdmin()` exists but `App.tsx` does not use it; `services/admin/memberAdminService.ts` exists but `AuthContext` does not use it | RCA-ADM-001, RCA-ADM-002 |
| **Duplicate permission logic** | Two system-admin checks: `is_system_admin` RPC in `lib/permissions.ts` and direct `from('system_admins')` in `App.tsx` | RCA-ADM-001 |
| **Broken abstraction boundaries between Context and Service layers** | `AuthContext` performs membership activation (a business write) instead of only managing auth/session state | RCA-ADM-002 |
| **Context leakage** | Authentication context owns a tenant-membership side effect | RCA-ADM-002 |
| **Presentation layer gaps** | Backend notification support exists without an admin page/route to consume it | RCA-ADM-003 |

---

## 15. Blast Radius Analysis

### 15.1 Blast Radius: `RCA-ADM-001` (`App.tsx` Direct `system_admins` Query)

| Category | Affected Items |
|---|---|
| **Affected Pages** | All `/admin/*` routes (`/admin/overview`, `/admin/tenants`, `/admin/billing`, `/admin/members`, `/admin/audit`, `/admin/settings`, etc.), `Login`, `TenantForbiddenPage` |
| **Affected Components** | `AdminSuspense`, `AdminLayout`, `AdminShell`, `AdminSidebar`, any lazy-loaded admin page |
| **Affected Hooks** | `useAuth`, `useTenant` (because `isSystemAdmin` controls the entire admin tree) |
| **Affected Contexts** | `AuthContext`, `TenantContext` (admin gate runs inside `AppContent` after these contexts resolve) |
| **Affected Services** | `lib/permissions.ts` (helper is bypassed), `services/admin/*` wrappers (irrelevant to gate because gate does not call services) |
| **Affected RPCs** | `is_system_admin` (not called by the gate), `get_tenant_by_subdomain` (gate logic unrelated) |
| **Affected Tables** | `system_admins` (directly queried) |
| **Affected Triggers** | None directly |
| **Affected RLS** | `system_admins` RLS / PostgREST policy becomes the effective security gate for the direct query path |
| **Affected Capabilities** | All admin capabilities; any capability reachable only through the admin route tree |
| **Operational Risk** | High. If `system_admins` RLS or PostgREST policy is tightened, the admin gate may fail open or closed independently of `is_system_admin`. The dual path also means `lib/permissions.ts` callers may disagree with `App.tsx` on the same user's admin status. |

### 15.2 Blast Radius: `RCA-ADM-002` (`AuthContext` Direct `activate_pending_memberships`)

| Category | Affected Items |
|---|---|
| **Affected Pages** | `Login`, `pages/admin/Members.tsx`, any page relying on activated `tenant_memberships` |
| **Affected Components** | `Members` list, invitation/acceptance flows |
| **Affected Hooks** | `useAuth`, `useTenant` (membership state is produced from `TenantContext` after activation) |
| **Affected Contexts** | `AuthContext` (owns the side effect), `TenantContext` (reads membership) |
| **Affected Services** | `services/admin/memberAdminService.ts` (bypassed), `services/memberService.ts` (bypassed), `services/loginHistoryService.ts` and `services/auditService.ts` (correctly used in same handler) |
| **Affected RPCs** | `activate_pending_memberships` (called directly), `get_current_user_tenants`, `get_tenant_members_with_email` |
| **Affected Tables** | `tenant_memberships`, `invitations` |
| **Affected Triggers** | `tenant_memberships_guardrails`, `tenant_memberships_audit`, `trg_audit_log_tenant_memberships` |
| **Affected RLS** | `tenant_memberships` and `invitations` RLS (activation bypasses service-layer normalization) |
| **Affected Capabilities** | Tenant membership activation, invitation acceptance, sign-in experience, member management |
| **Operational Risk** | Medium. Activation errors are swallowed (`catch(() => {})`), so a user may land in the app without activated memberships. The logic is also not reusable for other activation paths (e.g., invitation accept) and cannot be unit tested in isolation. |

### 15.3 Blast Radius: `RCA-ADM-003` (Missing Notification Admin Page)

| Category | Affected Items |
|---|---|
| **Affected Pages** | No admin page exists for notifications/announcements |
| **Affected Components** | `AdminSidebar` / `AdminLayout` cannot include the missing capability |
| **Affected Hooks** | None |
| **Affected Contexts** | None |
| **Affected Services** | `services/announcementService.ts`, `services/emailTemplateService.ts`, `services/notificationService.ts` (present but unreachable from admin UI) |
| **Affected RPCs** | `get_current_announcements_for_tenant`, `get_email_template_by_key`, `publish_scheduled_announcements` |
| **Affected Tables** | `announcements`, `email_templates`, `notification_logs` |
| **Affected Triggers** | `update_announcements_updated_at`, `update_email_templates_updated_at`, `update_notification_logs_updated_at` |
| **Affected RLS** | None observed as a direct runtime risk, but the missing UI means RLS policies are not exercised through the admin surface. |
| **Affected Capabilities** | System announcements, email templates, SMS, notification log viewing |
| **Operational Risk** | Low-Medium. Admins cannot manage announcements/templates through the UI. The backend remains functional, but the capability is incomplete from a user perspective. |

---

## 16. Confidence Assessment

| Root Cause / Cluster | Confidence | Justification |
|---|---|---|
| `RCA-ADM-001` (`App.tsx` direct `system_admins` query) | **Confirmed** | Direct code evidence: `App.tsx` lines 212-217; corroborated by `lib/permissions.ts` lines 123-130; `06` F-001, F-002, F-008. |
| `RCA-ADM-002` (`AuthContext` direct `activate_pending_memberships`) | **Confirmed** | Direct code evidence: `contexts/AuthContext.tsx` lines 90-92; corroborated by `01` context module responsibilities; `06` F-004, F-009. |
| `RCA-ADM-003` (Missing notification admin page) | **Confirmed** | `06` F-005; scan of `pages/admin/*` and `App.tsx` admin route tree found no matching page or route. The backend artifacts are present but unwired. |
| `RCA-ADM-S01` (Unused `isSystemAdmin` helper) | **Confirmed** | `lib/permissions.ts` exports `isSystemAdmin()`; `App.tsx` does not import or call it. |
| `RCA-ADM-S02` (Unused member activation wrapper) | **Confirmed** | `02` dependency map and `06` trace confirm `services/admin/memberAdminService.ts` exists; `AuthContext` bypasses it. |
| `RCA-ADM-S03` (Direct `supabase` imports in context/app layers) | **Confirmed** | `App.tsx` and `AuthContext.tsx` both import `supabase` and use it for direct queries/RPCs. |
| `F-003`, `F-006`, `F-007` (conformance) | **Confirmed Conformance** | These findings confirm the repository matches the approved model and are therefore not root causes. |

No findings are classified as `Highly Probable`, `Possible`, or `Unconfirmed` because the analysis is based entirely on static repository evidence at the stated commit.

---

## 17. Executive Summary

### 17.1 Primary Root Causes

1. **`RCA-ADM-001` — `App.tsx` admin gate bypasses `isSystemAdmin()` and `is_system_admin` RPC.** The admin route gate performs a direct `supabase.from('system_admins')` query instead of using the approved `lib/permissions.ts` helper and backend RPC. This creates a second, client-side authorization path and makes the gate sensitive to RLS/PostgREST policy changes for direct table access. **Severity: High.**
2. **`RCA-ADM-002` — `AuthContext.tsx` performs a tenant-membership business write directly.** On `SIGNED_IN`, `AuthContext` calls `supabase.rpc('activate_pending_memberships')` without a service wrapper, violating the rule that contexts must not perform business writes. Errors are swallowed and the logic is coupled to the authentication lifecycle. **Severity: Medium.**
3. **`RCA-ADM-003` — Missing admin presentation layer for Notifications/Announcements.** Backend services, tables, and Edge Functions for announcements/email templates exist, but no `pages/admin/*` component or `App.tsx` route was observed, leaving the capability unwired. **Severity: Low-Medium.**

### 17.2 Secondary Root Causes

- `RCA-ADM-S01`: The `isSystemAdmin()` helper exists but is not consumed by `App.tsx`.
- `RCA-ADM-S02`: Member activation wrapper services exist but are not used by `AuthContext`.
- `RCA-ADM-S03`: Direct `supabase` client imports in `App.tsx` and `AuthContext.tsx` enable both bypasses.

### 17.3 Major Systemic Patterns

- Direct Supabase usage outside the Service layer.
- Duplicate/inconsistent permission enforcement (`is_system_admin` RPC vs. direct table query).
- Context layer leaking into business writes (membership activation in `AuthContext`).
- Presentation layer gaps where backend capabilities exist without UI wiring.

### 17.4 Investigation Confidence

All root causes are **Confirmed** by repository evidence at commit `3a06a6d9`. No runtime observations were required because the divergences are visible in static code and file structure.

### 17.5 Readiness for Recommendations

The evidence package is complete and the causal chains are traceable. This document is ready to serve as the authoritative input for `08_ADMIN_DASHBOARD_FINAL_RECOMMENDATIONS.md`.

---

*End of Root Cause Analysis.*
