# 12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN

**Document ID:** 12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN  
**Date:** 2026-07-20  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** B — System Remediation  
**Acting Capacity:** Enterprise Program Management Office (PMO)  
**Baseline:** AD-Baseline-1.0  
**Repository Scope:** `C:\PROJECT\vietsalepro` @ commit `3a06a6d9` (RC-2026-07-19-01)  
**Repository Artifacts Modified:** None (governance documentation only)  
**Status:** Draft Complete — Pending PMO Certification

------------------------------------------------------------------------

# 1. Executive Summary

This document is the **Remediation Master Plan** for Phase B of the Admin Dashboard System Remediation Program. It is the strategic blueprint that governs every future remediation wave. It is not a Wave Plan, not a Wave Authorization, not an Engineering Kickoff, and not an implementation activity.

The plan consumes only **AD-Baseline-1.0**: the sealed Phase A investigation baseline (`09_ADMIN_DASHBOARD_SYSTEM_INCONSISTENCY_REPORT.md` as corrected by `10A_ADMIN_DASHBOARD_INVESTIGATION_ACCEPTANCE_IMPLEMENTATION.md`) at commit `3a06a6d9`. Phase A is closed, the baseline is sealed, and Phase B has been formally opened (`11_ADMIN_DASHBOARD_PHASE_B_OPENING_AUTHORIZATION.md`).

The baseline contains **64 cataloged issues** across the Admin Dashboard repository, representing **43 unique remediation issues** after cross-categorized duplicates are collapsed. The most severe issues remain in the authorization and audit-trust boundary: the `App.tsx` admin gate bypasses `isSystemAdmin()`, `AuthContext` performs a direct business write with a silent catch, and the `audit-log` Edge Function is unauthenticated. Substantial database drift (duplicate RPC versions in `schema.sql`, 29 post-SSOT migrations, and missing audit triggers) underpins many secondary findings.

This master plan:

- Defines the **logical remediation portfolios** for the 12 strategic domains required by the program charter.
- Establishes **engineering principles** and **quality gates** that every future wave must satisfy.
- Documents **dependencies** and **strategic risks** that will govern wave sequencing.
- Sets the **governance model**, **reporting chain**, and **future roadmap** through Program Certification.
- Records the updated **program status** and the **final authorization decision**.

No wave planning, wave sizing, or implementation authorization is performed in this document. Those decisions remain with the Program Owner and future Wave Authorization instruments.

------------------------------------------------------------------------

# 2. Mission

## Program Mission

Use the approved System Source of Truth (SSOT) and the sealed investigation baseline (`AD-Baseline-1.0`) to remediate every confirmed inconsistency in the Admin Dashboard implementation without introducing new drift, regression, or uncontrolled scope.

## Phase B Mission

Create the strategic remediation roadmap that will guide every Phase B wave until the Admin Dashboard is fully consistent across:

- Architecture
- Security
- Execution
- Database
- Migration
- RPC
- Edge Functions
- Permission
- Service Layer
- UI
- Operational Behavior
- Documentation

## Master Plan Mission

Produce the single authoritative governance document that:

1. Groups the `AD-Baseline-1.0` issue portfolio into logical remediation domains.
2. Defines the objectives, expected outcomes, constraints, dependencies, and success criteria for each domain.
3. Establishes the mandatory engineering principles and quality gates for every wave.
4. Defines the governance, risk, and dependency model for the entire Phase B lifecycle.
5. Records the updated program status and the transition rules for the next governance step.

------------------------------------------------------------------------

# 3. Documents Reviewed

All six mandatory governance documents were read in full before this master plan was drafted. No document or section was skipped.

| # | Document | Role in Master Plan | Read Status |
|---|----------|---------------------|-------------|
| 00 | `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` | Program charter, Phase B lifecycle, transition rules, governance roles | Read in full |
| 09 | `09_ADMIN_DASHBOARD_SYSTEM_INCONSISTENCY_REPORT.md` | Issue catalog and investigation evidence (subject of baseline) | Read in full |
| 10 | `10_ADMIN_DASHBOARD_INVESTIGATION_ACCEPTANCE_REVIEW.md` | Independent acceptance review (PASS WITH OBSERVATIONS) | Read in full |
| 10A | `10A_ADMIN_DASHBOARD_INVESTIGATION_ACCEPTANCE_IMPLEMENTATION.md` | Corrected baseline (64 cataloged / 43 unique), program-owner decisions | Read in full |
| 10B | `10B_ADMIN_DASHBOARD_PHASE_A_CLOSEOUT.md` | Phase A closeout, baseline sealing (`AD-Baseline-1.0`) | Read in full |
| 11 | `11_ADMIN_DASHBOARD_PHASE_B_OPENING_AUTHORIZATION.md` | Phase B opening authorization, entry rules, governance model | Read in full |

In addition, the approved SSOT documents `01`–`08` were used as architectural background but were not re-read because the sealed baseline (`09` as corrected by `10A`) is the only permitted source of issues for this plan.

------------------------------------------------------------------------

# 4. Baseline

| Baseline Attribute | Value |
|---|---|
| **Baseline Version** | `AD-Baseline-1.0` |
| **Baseline Status** | SEALED |
| **Sealed By** | `10B_ADMIN_DASHBOARD_PHASE_A_CLOSEOUT.md` |
| **Effective Date** | 2026-07-20 |
| **Repository Commit** | `3a06a6d9` (RC-2026-07-19-01) |
| **Cataloged Issues** | 64 (after removal of false positives DB-008, DIR-003, DEP-001) |
| **Unique Remediation Issues** | 43 (after collapsing 21 cross-categorized duplicates) |
| **False Positives Removed** | DB-008, DIR-003, DEP-001 |
| **Severity Distribution (Cataloged)** | Critical 7 / High 24 / Medium 19 / Low 14 = 64 |
| **Severity Distribution (Unique)** | Critical 4 / High 14 / Medium 14 / Low 11 = 43 |
| **Permitted Use** | Only `AD-Baseline-1.0` may be consumed by Phase B remediation waves. No other baseline is permitted. |

The baseline includes the corrected evidence counts and duplicate reconciliation recorded in `10A` (DB-002 → 3, DB-003 → 3, MIG-001 → 21, MIG-002 → 29, 10 Edge Functions write to `app_audit_log`, etc.).

------------------------------------------------------------------------

# 5. Strategic Objectives

The Remediation Master Plan is governed by the following strategic objectives derived from the program charter (`00`) and the sealed baseline:

1. **Eliminate confirmed inconsistencies.** Every issue in the 43-unique remediation scope of `AD-Baseline-1.0` must be addressed, verified, and accepted before Program Certification.
2. **Preserve repository stability.** No remediation wave may modify code, migrations, RPCs, Edge Functions, or database objects outside the scope of an approved Wave Authorization.
3. **Restore architectural integrity.** The Admin Dashboard must converge to the approved SSOT: correct route gating, lazy loading, service-layer contracts, and database schemas.
4. **Close the authorization and audit-trust boundary.** The three Critical-class issues in the 43-unique scope (`ARCH-001`, `EDG-001`, and the security/execution boundary they share) must be resolved before any wave is accepted as production-ready.
5. **Remove schema and migration drift.** Duplicate RPC versions, post-SSOT migrations, and missing migration sequence entries must be reconciled against `AD-Baseline-1.0`.
6. **Maintain backward compatibility.** Existing Admin Dashboard behavior that is not explicitly broken must continue to work during and after remediation.
7. **Enforce traceability.** Every remediation change must reference one or more `AD-Baseline-1.0` issue IDs and one or more SSOT document sections.
8. **Document the remediation.** Every wave must update the relevant SSOT, runbook, and operational documentation as a first-class deliverable.

------------------------------------------------------------------------

# 6. Remediation Portfolio

The `AD-Baseline-1.0` issue catalog contains 64 findings. For traceability, each cataloged ID is grouped below by its primary logical remediation domain. The 43-unique remediation scope is obtained by collapsing 21 cross-categorized duplicates to their canonical issues, as defined in `10A` Section 10. Wave sizing will consume only the 43-unique view; the 64-cataloged view is retained for cross-domain traceability.

## 6.1 Portfolio Scope Note

- **Cataloged view (64):** All issue IDs listed below are from the sealed `AD-Baseline-1.0` catalog.
- **Unique view (43):** Cross-categorized duplicates (e.g., `SEC-001` same as `ARCH-001`, `UI-001` same as `ARCH-004`, `DEAD-003` same as `ARCH-004`) are counted once in the primary domain.
- **No wave assignment:** This section groups issues into logical domains only. It does not assign issues to waves, sprints, or implementation sequences.

## 6.2 Architecture

### Objectives
- Restore the Admin Dashboard's structural conformance to the SSOT: route gating, lazy loading, component boundaries, and service-layer abstraction.
- Ensure `App.tsx` admin authorization is centralized through `isSystemAdmin()`.
- Reconcile `AdminDashboardInner` tab model with the reachable route tree.

### Expected Outcomes
- `App.tsx` imports and calls `isSystemAdmin()` from `lib/permissions.ts`.
- The `AdminLayout` lazy-loading contract is complete for all admin routes.
- Wrapper services no longer perform direct `.from()` queries that bypass the base service layer.

### Constraints
- No redesign of the Admin Dashboard UX or capability set.
- All structural changes must preserve existing route URLs and user-facing behavior.
- Browser-API usage in `complianceAdminService.ts` must be removed or isolated.

### Dependencies
- Security and Permission domains (correct `isSystemAdmin()` enforcement before routing changes).
- Service Layer domain (wrapper service contracts must be defined before direct `.from()` calls are refactored).
- UI domain (reachable tab set must be confirmed before sidebar/route map updates).

### Success Criteria
- `ARCH-001` through `ARCH-006` are remediated and independently verified.
- No admin route bypasses the canonical permission helper.
- All `AdminDashboardInner` tabs are either reachable or removed.

### Baseline Issues
- Catalog IDs: `ARCH-001`, `ARCH-002`, `ARCH-003`, `ARCH-004`, `ARCH-005`, `ARCH-006`

## 6.3 Security

### Objectives
- Close every unauthenticated or publicly callable entry point in the Admin Dashboard trust boundary.
- Remove `SECURITY INVOKER` misuse from privileged RPCs.
- Enforce audit logging at every privileged operation.

### Expected Outcomes
- The `audit-log` Edge Function validates every request before writing to `app_audit_log` or `rate_limit_logs`.
- `check-subdomain` and `billing-webhooks` access controls are documented or hardened.
- Privileged RPCs execute with the correct invoker security context.

### Constraints
- New authentication paths must use existing Supabase auth patterns and not invent alternate identity stores.
- Audit logging must be non-blocking for legitimate Admin Dashboard flows.
- Service-role keys may only be used inside authenticated, internal-facing logic.

### Dependencies
- Permission domain (permission model must be stable before security gating is added).
- Edge Function domain (audit-log function must be hardened before other Edge Functions depend on it).
- RPC domain (`SECURITY INVOKER` defects in `BL-003` / `RPC-002` must be fixed with schema changes).

### Success Criteria
- `SEC-001` through `SEC-005` and the underlying canonical security issues (`ARCH-001`, `EDG-001`, `BL-003`, `DB-004`, `RPC-002`) are resolved.
- No privileged operation can be invoked anonymously.
- Audit triggers exist on `system_admins`, `invitations`, and `licenses` (`DB-004` canonical).

### Baseline Issues
- Catalog IDs: `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `SEC-005` (cross-categorized duplicates; canonical issues live in Architecture, Edge Functions, Business Logic, Database, and RPC domains)

## 6.4 Execution

### Objectives
- Remove silent-failure paths and non-atomic transactions in Admin Dashboard runtime flows.
- Ensure `AuthContext` does not perform business writes directly or swallow errors.
- Reconcile `isSystemAdmin` state behavior on non-admin subdomains.

### Expected Outcomes
- `AuthContext` calls `activate_pending_memberships` through the approved service contract and surfaces failures.
- Tenant creation and billing lifecycle updates follow canonical validation RPCs.
- `InvitationsAccept` route is validated through `AdminLayout`.

### Constraints
- No new runtime orchestration engine may be introduced.
- Changes must preserve the current sign-in and membership-activation user experience.
- Business logic shortcuts (`BL-001`, `BL-002`) must be refactored through the service/RPC layer, not patched in UI code.

### Dependencies
- Service Layer domain (validation and lifecycle RPCs must exist before callers are refactored).
- Database / RPC domains (missing `get_admin_audit_logs`, `get_cron_job_logs`, and billing log RPCs must be available).
- Architecture domain (route gating must be correct before execution flow is trusted).

### Success Criteria
- `EXE-001`, `EXE-002`, `BL-001`, `BL-002`, `VAL-001`, `DIR-001`, and `DIR-002` are remediated.
- All asynchronous activation flows have observable success/failure surfaces.
- No business write is performed directly from `AuthContext`.

### Baseline Issues
- Catalog IDs: `EXE-001`, `EXE-002`, `BL-001`, `BL-002`, `VAL-001`, `VAL-002`, `DIR-001`, `DIR-002` (note: `BL-003`, `VAL-002`, and `DIR-002` are cross-categorized with Security/Architecture and collapse to canonical issues in the unique view)

## 6.5 Database

### Objectives
- Eliminate duplicate and overloaded RPC versions in `supabase/schema.sql`.
- Add missing audit triggers, missing log tables, and missing login/logout trigger enforcement.
- Restore the database layer to the SSOT without losing data.

### Expected Outcomes
- Only one authoritative version of `update_tenant`, `update_tenant_subscription`, and `create_tenant_with_admin` remains.
- `app_audit_log` receives trigger-enforced LOGIN/LOGOUT events.
- Missing RPCs (`get_admin_audit_logs`, `get_cron_job_logs`, `get_billing_reminder_logs`, `get_billing_email_logs`) are available.

### Constraints
- Data migration must be planned before any `CREATE OR REPLACE FUNCTION` overload is removed.
- RLS policies on `admin_events` and `system_admins` must not be weakened.
- All schema changes must be delivered through migrations and peer-reviewed.

### Dependencies
- Migration domain (post-SSOT migration drift must be reconciled before schema is altered).
- RPC domain (missing RPCs must be declared and implemented).
- Security domain (audit triggers and `admin_events` producer policy depend on permission model).

### Success Criteria
- `DB-001` through `DB-007` and `DB-009` are remediated.
- No duplicate `CREATE OR REPLACE FUNCTION` definitions for the three overloaded RPCs exist.
- All privileged table mutations generate audit rows.

### Baseline Issues
- Catalog IDs: `DB-001`, `DB-002`, `DB-003`, `DB-004`, `DB-005`, `DB-006`, `DB-007`, `DB-009`

## 6.6 Migration

### Objectives
- Reconcile 29 post-SSOT migrations and 21 fix migrations against the SSOT.
- Restore the migration chain to a deterministic, ordered, and reviewable state.
- Resolve the missing `20260713000002` sequence entry and non-standard filename `20260710064509_f33_members_search_rpc.sql`.

### Expected Outcomes
- Every migration file either belongs to the SSOT baseline, is approved as a deliberate delta, or is retired with evidence.
- Fix migrations are consolidated or justified.
- The migration chain from the SSOT baseline to `HEAD` is reproducible.

### Constraints
- No data loss is permitted during migration consolidation.
- Production-like environments must be restored from a known migration state before any migration is retired.
- Migrations are the only permitted mechanism for schema change.

### Dependencies
- Database domain (schema drift must be understood before migration cleanup).
- Program Owner Decision 1 (SSOT Drift Strategy) — see `10A` Section 14 and `10B` Section 10.
- Operational Governance domain (runbooks and rollback procedures must exist).

### Success Criteria
- `MIG-001`, `MIG-002`, `MIG-003`, `MIG-004`, `DRIFT-001`, `DRIFT-002`, and `DRIFT-003` are resolved.
- The number of post-SSOT migrations is known and each one is accounted for.
- Migration rollback instructions are current and tested.

### Baseline Issues
- Catalog IDs: `MIG-001`, `MIG-002`, `MIG-003`, `MIG-004`, `DRIFT-001`, `DRIFT-002`, `DRIFT-003`

## 6.7 RPC

### Objectives
- Resolve RPC overloads, missing functions, and `SECURITY INVOKER` defects.
- Ensure `search_tenants` / `get_tenants_admin` resolution is unambiguous.
- Align every Admin Dashboard RPC with the SSOT contract.

### Expected Outcomes
- `update_tenant`, `update_tenant_subscription`, and `create_tenant_with_admin` have single, authoritative signatures.
- Missing log and audit RPCs are implemented and reachable from the service layer.
- No privileged RPC executes under `SECURITY INVOKER` unless explicitly justified.

### Constraints
- RPC signatures must remain backward-compatible or be formally deprecated with a migration.
- New RPCs must be added through migrations and documented in the SSOT.
- Caller code (`services/admin/*.ts`, `contexts/*.tsx`) must be updated before old RPCs are removed.

### Dependencies
- Database domain (duplicate RPCs in schema must be consolidated first).
- Migration domain (RPC changes must be delivered by migrations).
- Service Layer domain (callers must be refactored to use the correct RPC).

### Success Criteria
- `RPC-001`, `RPC-002`, `RPC-003`, `RPC-004`, `DB-006`, and `DB-007` are remediated.
- Every Admin Dashboard RPC resolves to exactly one implementation.
- All privileged RPCs use the correct ownership/invoker model.

### Baseline Issues
- Catalog IDs: `RPC-001`, `RPC-002`, `RPC-003`, `RPC-004`

## 6.8 Edge Functions

### Objectives
- Harden authentication on all Edge Functions that perform privileged or audit-writing operations.
- Remove or repurpose dead Edge Functions (`admin-health-check`, `deliver-webhook`).
- Ensure all privileged Edge Functions write to `app_audit_log` consistently.

### Expected Outcomes
- `audit-log` validates every request before processing.
- `check-subdomain` and `billing-webhooks` access controls are explicit and documented.
- Dead functions are either activated, removed, or archived.

### Constraints
- Edge Function changes must be deployed and verified in a staging environment.
- CORS and secret handling must not be weakened.
- Audit-writing functions must use a consistent payload contract.

### Dependencies
- Security domain (authentication model must be defined).
- Permission domain (service-admin and internal-secret rules must be clarified).
- Database / RPC domain (audit logging depends on `app_audit_log` structure and triggers).

### Success Criteria
- `EDG-001`, `EDG-002`, `EDG-003`, `EDG-004`, and `EDG-005` are remediated.
- No Edge Function that writes to `app_audit_log` is reachable without authentication.
- Dead functions are resolved (removed or restored).

### Baseline Issues
- Catalog IDs: `EDG-001`, `EDG-002`, `EDG-003`, `EDG-004`, `EDG-005` (cross-categorized with Security via `SEC-002`, `SEC-004`, etc.)

## 6.9 Permission

### Objectives
- Reduce the two system-admin enforcement paths to a single, canonical path.
- Close `admin_events` producer-policy gaps.
- Ensure `audit-log` and other privileged entry points enforce the permission model.

### Expected Outcomes
- `App.tsx` and `AuthContext` use `isSystemAdmin()` from `lib/permissions.ts` exclusively.
- `admin_events` RLS and producer policy are complete.
- Permission checks are centralized and testable.

### Constraints
- `services/admin/permissions.ts` must be evaluated before it is reintroduced or removed.
- No permission check may be duplicated in UI code when a shared helper exists.
- RLS policies must not grant broader access than the application permission model.

### Dependencies
- Architecture domain (route gating depends on permission helper).
- Security / Edge Function domain (audit-log and edge auth must use the same permission model).
- Service Layer domain (service wrappers must consume the canonical permission helper).

### Success Criteria
- `PERM-001`, `PERM-002`, `PERM-003`, and the underlying `ARCH-001` / `EDG-001` canonical issues are remediated.
- Only one system-admin enforcement path remains.
- `admin_events` is populated by authorized producers only.

### Baseline Issues
- Catalog IDs: `PERM-001`, `PERM-002`, `PERM-003` (`PERM-002` cross-categorized with `EDG-001` / `SEC-002`)

## 6.10 Service Layer

### Objectives
- Restore the service-layer contract: all Admin Dashboard data access flows through `services/admin/*.ts` wrappers to base services or canonical RPCs.
- Remove direct `.from()` calls in wrapper services.
- Re-export missing plan/invoice/overview RPCs and the custom-domain token RPC.

### Expected Outcomes
- `tenantAdminService.ts`, `memberAdminService.ts`, `billingAdminService.ts`, `auditAdminService.ts`, `licenseService.ts`, and `supportService.ts` use approved RPCs and base services only.
- `billingAdminService.ts` exposes plan and invoice RPC re-exports.
- `analyticsAdminService.ts` exposes overview RPC re-exports.
- `tenantAdminService.ts` wraps `get_or_create_custom_domain_token`.

### Constraints
- No new service abstraction may be introduced without PMO/Architect approval.
- Browser APIs must not be used in server-executable service code.
- Dead code (`SVC-005`) must be removed or activated with justification.

### Dependencies
- Architecture domain (wrapper patterns are defined in SSOT).
- RPC / Database domain (RPCs must exist before wrappers can call them).
- Execution / Business Logic domain (validation rules must be implemented in the service or RPC layer).

### Success Criteria
- `SVC-001` through `SVC-005`, `DEP-002`, `DEP-003`, `DEP-004`, `BL-001`, `BL-002`, `VAL-001`, and `VAL-002` are remediated.
- No wrapper service performs direct `.from()` table access.
- All expected RPC re-exports are present.

### Baseline Issues
- Catalog IDs: `SVC-001`, `SVC-002`, `SVC-003`, `SVC-004`, `SVC-005`, `DEP-002`, `DEP-003`, `DEP-004` (`SVC-001`–`SVC-004` and `DEP-002`–`DEP-004` are cross-categorized with Architecture/Service; the unique view retains the canonical issue in each primary domain)

## 6.11 UI

### Objectives
- Ensure the Admin Dashboard UI surface matches the approved route map and sidebar.
- Resolve lazy-loading and shell-rendering inconsistencies for `InvitationsAccept`.
- Expose the notification/announcement/email-template capabilities in the sidebar if they are required.

### Expected Outcomes
- `InvitationsAccept` is rendered inside the lazy-loaded admin layout or an approved alternative.
- `AdminDashboardInner` tabs are either reachable or removed from the type union.
- The sidebar exposes the capabilities defined in the SSOT.

### Constraints
- No visual redesign without explicit Program Owner approval.
- Route URLs and capability names must match the SSOT.
- Unreachable tabs must not be activated until their service/RPC dependencies are ready.

### Dependencies
- Architecture domain (route tree and lazy-loading must be stable).
- Service / RPC domain (capabilities exposed in the sidebar must be backed by working services).
- Execution / Validation domain (invitation acceptance flow must be validated through the layout).

### Success Criteria
- `UI-001`, `UI-002`, and `UI-003` are remediated (cross-categorized with `ARCH-003`, `ARCH-004`, and `DEP-001` / `DEAD-003`).
- All reachable `AdminDashboardInner` tabs have a corresponding route.
- `InvitationsAccept` is integrated with `AdminLayout`.

### Baseline Issues
- Catalog IDs: `UI-001`, `UI-002`, `UI-003` (cross-categorized; canonical issues live in Architecture and Execution/Validation domains)

## 6.12 Operational Governance

### Objectives
- Remove dead code, fix performance risks, and establish repeatable operational controls.
- Ensure migration discipline and repository hygiene do not regress after remediation.
- Maintain the runbooks, monitoring, and rollback procedures required to operate the Admin Dashboard.

### Expected Outcomes
- Dead wrapper service (`services/admin/permissions.ts`) and dead Edge Functions are resolved.
- `AdminDashboardInner` does not load all tab states on mount.
- `tenant-backup` runtime limits are understood and mitigated.
- Post-SSOT drift is tracked and controlled.

### Constraints
- Dead code removal must not break imports or tests.
- Performance fixes must not change observable behavior.
- Operational documentation must be updated before a wave is accepted.

### Dependencies
- All other domains (dead code and performance issues are usually side effects of primary defects).
- Documentation domain (runbooks must reflect the post-remediation state).
- Program Owner Decision 2 (Partial Domain Completion) — see `10A` Section 14 and `10B` Section 10.

### Success Criteria
- `DEAD-001` through `DEAD-004`, `PERF-001`, `PERF-002`, `MIG-001`, `MIG-002`, and `DRIFT-001` through `DRIFT-003` are resolved.
- No dead code remains that is referenced by active imports.
- Performance-sensitive Edge Functions are within documented limits.

### Baseline Issues
- Catalog IDs: `DEAD-001`, `DEAD-002`, `DEAD-003`, `DEAD-004`, `PERF-001`, `PERF-002`, `MIG-001`, `MIG-002`, `DRIFT-001`, `DRIFT-002`, `DRIFT-003` (most are cross-categorized with Service, Edge, Architecture, Database, and Migration domains)

## 6.13 Documentation

### Objectives
- Ensure every remediation wave updates the approved SSOT, runbooks, and migration records.
- Document the resolution of all 43 unique issues in a traceable form.
- Maintain the program governance record through Program Certification.

### Expected Outcomes
- Every Wave Authorization references the SSOT sections and `AD-Baseline-1.0` issue IDs it touches.
- Wave Verification and Acceptance documents include updated architecture, dependency, and execution model excerpts where changed.
- Operational runbooks cover audit-log auth, permission model, migration rollback, and Edge Function deployment.

### Constraints
- No documentation may contradict the SSOT or the sealed baseline.
- Documentation changes must be reviewed in the same gate as code changes.
- No new `AGENTS.md` or `.devin` rules may be added unless explicitly authorized.

### Dependencies
- All other domains (documentation is a cross-cutting deliverable for every wave).
- Program Owner approval of any SSOT amendment.

### Success Criteria
- The documentation portfolio is current at every Quality Gate.
- Traceability from `AD-Baseline-1.0` issue IDs to wave deliverables is 100%.
- The Program Certification package contains the full remediation record.

### Baseline Issues
- No standalone documentation issues are cataloged in `AD-Baseline-1.0`. Documentation is the mandatory deliverable surface for all 43 unique issues.

------------------------------------------------------------------------

# 7. Dependency Analysis

## 7.1 Domain Precedence

The following precedence rules govern the order in which remediation work should be planned. These are strategic, not a wave schedule.

| Precedence | Domain | Rationale |
|---|---|---|
| 1 | Architecture | Route gating and service-layer contracts are the foundation for all other remediation. |
| 2 | Permission / Security | The authorization and audit-trust boundary must be correct before other entry points are hardened. |
| 3 | Database / Migration | Schema drift and post-SSOT migrations must be resolved before RPCs and services can be stabilized. |
| 4 | RPC / Edge Functions | Data access contracts and privileged entry points depend on the corrected schema and permission model. |
| 5 | Service Layer | Wrappers can only call canonical RPCs once they exist and are stable. |
| 6 | Execution / Business Logic | Runtime behavior and validation are verified after the service and RPC contracts are fixed. |
| 7 | UI / Operational Governance | User-facing and operational cleanup happens after underlying contracts are trustworthy. |
| 8 | Documentation | Continuous; must be current at every gate. |

## 7.2 Blocking Relationships

| Blocker | Blocks | Reason |
|---|---|---|
| `ARCH-001` (admin gate) | `SEC-001`, `PERM-001`, `EXE-002` | Until `isSystemAdmin()` is the single enforcement path, security and permission fixes are incomplete. |
| `EDG-001` (audit-log unauthenticated) | `EDG-005`, `PERM-002`, `SEC-002` | Audit-log auth is a prerequisite for audit-trust across Edge Functions. |
| `DB-001` / `DB-002` / `DB-003` (duplicate RPCs) | `RPC-001`, `RPC-003`, `DEAD-004` | Schema consolidation must precede caller refactoring and dead-overload removal. |
| `MIG-002` / `DRIFT-001` (post-SSOT migrations) | Database, RPC, and Edge Function domains | Drift strategy must be decided before schema/RPC changes are delivered. |
| `RPC-003` (missing log RPCs) | `DB-006`, `DB-007`, Audit/Compliance UI | Missing RPCs must exist before service wrappers and UI can use them. |
| `BL-001` / `BL-002` (business logic shortcuts) | `VAL-002`, `DIR-001`, `DIR-002` | Canonical validation and atomicity require the correct service/RPC contracts. |
| `SVC-001` / `SVC-002` (direct `.from()`, browser API) | `ARCH-005`, `ARCH-006` | Service-layer contract must be restored before architecture can be verified. |

## 7.3 Cross-Domain Impact

- **Architecture changes** affect Security, Permission, UI, and Service Layer.
- **Security / Permission changes** affect Edge Functions, RPC, Service Layer, and Database.
- **Database / Migration changes** affect RPC, Edge Functions, Service Layer, and Execution.
- **RPC changes** affect Service Layer, Execution, UI, and Edge Functions.
- **Edge Function changes** affect Security, Permission, Execution, and Operational Governance.
- **UI changes** depend on Architecture, Service Layer, and RPC.
- **Documentation changes** must reflect every domain.

## 7.4 Required Sequencing

1. **Program Owner Decisions 1 and 4** must be recorded before Wave Planning begins (`10B` Section 10; `11` Section 7).
2. **Program Owner Decisions 2 and 3** must be recorded before Engineering Kickoff.
3. **Architecture and Permission** remediation must be at least drafted before the Security wave is accepted.
4. **Database and Migration** consolidation must be accepted before RPC/Edge Function waves that depend on the cleaned schema.
5. **RPC/Edge Function** remediation must be accepted before Service Layer wrappers are refactored to use canonical contracts.
6. **Service Layer** remediation must be accepted before Execution, Validation, and UI waves that consume those services.
7. **Operational Governance** (dead code, performance, migration discipline) must be the final acceptance gate for each technical domain.

## 7.5 Shared Infrastructure

The following infrastructure must be coordinated across multiple domains:

| Shared Infrastructure | Affected Domains | Governance |
|---|---|---|
| `isSystemAdmin()` / `lib/permissions.ts` | Architecture, Security, Permission, Service Layer | Single canonical helper owned by Security/Permission. |
| `app_audit_log` / audit triggers | Database, Security, Edge Functions, RPC | Owned by Database; consumed by Security and Edge Functions. |
| Supabase auth / service-role clients | Security, Edge Functions, Permission | Owned by Security; reviewed for every Edge Function change. |
| `supabase/schema.sql` and migrations | Database, Migration, RPC, Edge Functions | Owned by Database/Migration; all schema changes through migrations. |
| `services/admin/*.ts` wrappers | Service Layer, Execution, UI, Architecture | Owned by Service Layer; contracts traceable to SSOT. |
| Admin route tree (`App.tsx`, `AdminLayout.tsx`) | Architecture, UI, Execution | Owned by Architecture; UI changes require route-map review. |

------------------------------------------------------------------------

# 8. Engineering Principles

Every Phase B remediation wave must adhere to the following mandatory engineering principles. Deviations require explicit Program Owner approval documented in the Wave Authorization.

1. **Small incremental remediation.** Each wave must address a tightly bounded subset of `AD-Baseline-1.0` issues. No wave may attempt to remediate the entire Admin Dashboard in one pass.
2. **Independent verification.** Every remediation change must be verified by an independent reviewer or automated check before it is accepted.
3. **Backward compatibility.** Existing Admin Dashboard behavior that is not explicitly identified as broken must continue to work. Deprecated behavior must be removed through a migration or feature flag with Program Owner approval.
4. **Repository stability.** No code, migration, RPC, Edge Function, schema, or database object may be modified outside the scope of an approved Wave Authorization.
5. **No uncontrolled scope expansion.** Wave scope is bounded by the Wave Authorization and the `AD-Baseline-1.0` issue IDs it references. New findings discovered during a wave must be recorded and deferred to a future wave unless they are Critical and the Program Owner approves an emergency change.
6. **Regression prevention.** Every wave must include regression checks that exercise the affected capability domains and cross-layer traces.
7. **Canonical Issue IDs.** Every change must reference one or more `AD-Baseline-1.0` issue IDs. References to pre-Phase A or unsealed findings are prohibited.
8. **Traceability.** Every change must be traceable to an SSOT section, an `AD-Baseline-1.0` issue ID, a Wave Authorization, a Verification record, and an Acceptance record.
9. **Evidence-based acceptance.** Acceptance criteria must be defined in the Wave Authorization and verified with repository evidence, not only by assertion.
10. **Migration discipline.** All schema and database changes must be delivered through reviewed migrations. No direct `schema.sql` edits are permitted outside the migration pipeline.
11. **Security-first ordering.** Critical authorization and audit-trust issues must be addressed before lower-severity issues in the same trust boundary.
12. **Documentation as deliverable.** Every wave must produce or update documentation. Undocumented remediation is incomplete.

------------------------------------------------------------------------

# 9. Quality Gates

Every Phase B wave must pass the following mandatory Quality Gates. The gate criteria are mandatory; waivers require Program Owner approval recorded in the Wave Authorization.

## 9.1 Entry Gate

- **Scope verified.** The wave's issue list is bounded, references only `AD-Baseline-1.0` IDs, and fits the Wave Authorization.
- **Dependencies available.** All blocker issues and shared infrastructure dependencies for the wave are either already accepted or explicitly listed as in-wave deliverables.
- **Baseline intact.** The repository has not drifted from `AD-Baseline-1.0` commit `3a06a6d9` since the last accepted deliverable.
- **Program Owner decisions recorded.** All decisions required for the wave's scope (per `10B` Section 10) are recorded.
- **Engineer assignment and review path defined.** The wave owner and independent verifier are named.

## 9.2 Engineering Gate

- **Design reviewed.** The technical approach is reviewed against the SSOT and the `AD-Baseline-1.0` issue descriptions.
- **No scope expansion.** The implementation addresses only the wave's authorized issue IDs.
- **Tests and checks present.** Unit, integration, or evidence checks are defined and passing for the changed code paths.
- **Security and permission impact assessed.** Any change to the trust boundary is explicitly reviewed.
- **Migration plan approved.** Schema or RPC changes have a reviewed migration and rollback plan.

## 9.3 Verification Gate

- **Independent verification passed.** A reviewer independent from the implementer confirms the change resolves the `AD-Baseline-1.0` issue(s) without introducing regression.
- **Evidence collected.** Verification includes repository evidence (file reads, schema checks, test output, or runtime logs) anchored to the changed artifacts.
- **Cross-layer trace confirmed.** Affected Presentation → Application → Service → Infrastructure traces are checked.
- **Regression checks passed.** Affected capability domains and shared infrastructure are exercised.
- **Documentation updated.** SSOT excerpts, runbooks, and wave records are current.

## 9.4 Acceptance Gate

- **Acceptance criteria met.** All acceptance criteria from the Wave Authorization are verified and documented.
- **No critical open defects.** No Critical or High severity regressions are introduced.
- **Traceability complete.** Every change is linked to `AD-Baseline-1.0` issue IDs, Wave Authorization, Verification record, and Acceptance sign-off.
- **Independent sign-off.** The Independent Enterprise Technical Review Board or designated reviewer approves.
- **Program Owner acknowledgment.** The Program Owner acknowledges acceptance or records an explicit waiver.

## 9.5 Deployment Synchronization Gate

- **Acceptance complete.** The wave has been formally accepted and the accepted repository revision is frozen.
- **Synchronization scope defined.** The target environment and the artifact classes to be synchronized are identified in the Wave Authorization or a deployment instruction approved by the Program Owner.
- **Repository-to-environment match verified.** Evidence confirms that Repository, Supabase Database, RPC, Edge Functions, Environment Configuration, Vercel Deployment, and Runtime Behaviour match the accepted revision, or that every deviation is explicitly recorded as an observation.
- **Deployment report completed.** A Deployment Synchronization Report records the synchronization method, environment state, and verification evidence.
- **Release authority sign-off.** The Enterprise Release Manager or PMO confirms that the synchronization evidence is sufficient to support Wave Closeout.

## 9.6 Closeout Gate

- **Wave artifacts archived.** Code, migrations, tests, verification evidence, deployment synchronization evidence, and documentation are committed and tagged.
- **Baseline updated if required.** If the wave produced a new approved baseline delta, the `AD-Baseline-1.0` reference is updated with a version suffix and approved.
- **No open follow-ups.** All follow-up issues are recorded as new `AD-Baseline-1.0` references or deferred with Program Owner approval.
- **Status report submitted.** The wave status is reported to the Program Owner and the PMO.
- **Next-wave readiness confirmed.** The next wave's Entry Gate prerequisites are identified.

------------------------------------------------------------------------

# 10. Governance Model

## 10.1 Governance Hierarchy

| Role | Responsibility | Authority |
|---|---|---|
| **Program Owner (User)** | Final decision authority for scope, budget, risk acceptance, and go/no-go gates. | Approves Wave Authorizations, Engineering Kickoffs, Program Certification. |
| **Enterprise PMO (This Agent)** | Maintains program governance, document chain, status reporting, and gate compliance. | Drafts and certifies governance documents; confirms gate completion; cannot authorize implementation. |
| **Principal Software Architect (ChatGPT)** | SSOT guardian, independent technical reviewer, methodology guardian, enterprise quality gate. | Reviews Wave Authorizations and Acceptance packages; approves architecture changes; mediates SSOT amendments. |
| **Implementation Engineer (Agent)** | Executes approved waves only after Wave Authorization and Engineering Kickoff. | Implements changes within authorized scope; cannot expand scope or modify code before authorization. |
| **Independent Technical Review Board** | Independent verification and acceptance of investigation and remediation evidence. | Pass/fail on Verification and Acceptance Gates; may request rework. |

## 10.2 Approval Hierarchy

| Decision | Approver |
|---|---|
| Remediation Master Plan | PMO (certifies) + Program Owner (acknowledges) |
| Program Owner Decisions 1–4 | Program Owner |
| Wave Authorization | Program Owner, advised by PMO and Principal Architect |
| Engineering Kickoff | Program Owner, after Wave Authorization and all gating decisions |
| SSOT Amendment | Program Owner + Principal Architect |
| Wave Acceptance | Independent Technical Review Board + Program Owner acknowledgment |
| Wave Deployment Synchronization | Enterprise Release Manager / PMO, after Wave Acceptance |
| Program Certification | Program Owner, with PMO and Principal Architect certification |

## 10.3 Verification Hierarchy

- **Engineer self-verification:** Tests and evidence checks run by the implementer.
- **Peer / independent verification:** Reviewer not involved in implementation.
- **Principal Software Architect review:** Cross-wave and cross-domain consistency, SSOT conformance.
- **Independent Technical Review Board:** Final Acceptance Gate evidence review.
- **PMO gate audit:** Governance and traceability compliance.

## 10.4 Acceptance Hierarchy

1. **Verification Gate** passed.
2. **Principal Software Architect** confirms technical acceptability.
3. **PMO** confirms governance and documentation compliance.
4. **Program Owner** provides final acceptance acknowledgment.

## 10.5 Program Reporting

| Report | Frequency | Audience | Owner |
|---|---|---|---|
| Wave Status | Per wave closeout | Program Owner, PMO, Principal Architect | PMO |
| Risk Register | Weekly or per wave | Program Owner, PMO, Principal Architect | PMO |
| Baseline Drift Check | Before every Entry Gate | PMO, Principal Architect | PMO |
| Program Status | At every gate | Program Owner | PMO |
| Certification Package | At Program Certification | Program Owner, stakeholders | PMO |

## 10.6 Repository Governance

- The sealed baseline commit is `3a06a6d9`.
- All code changes must be in a branch or feature area approved by the Wave Authorization.
- No force-pushes, history rewrites, or direct `main`/`master` commits without Wave Authorization.
- All migrations, RPCs, and Edge Functions are reviewed by the Principal Architect.
- `package.json`, `package-lock.json`, and `.codebase-memory` metadata changes are not considered implementation drift unless they affect Admin Dashboard artifacts.

------------------------------------------------------------------------

# 11. Program Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| **Repository drift** | Remediation work targets a moving baseline; acceptance evidence becomes invalid. | Medium | Lock the baseline at `AD-Baseline-1.0`; run a drift check at every Entry Gate; reject waves that target a changed baseline. |
| **Dependency conflicts** | Changes in one domain break another because of shared infrastructure (`isSystemAdmin`, audit log, schema). | High | Enforce the Dependency Analysis precedence; require cross-domain impact review for shared-infrastructure changes. |
| **Regression** | A remediation change reintroduces a previously fixed defect or breaks an unrelated flow. | Medium | Require regression checks per Wave Verification Gate; maintain capability-domain test coverage. |
| **Security** | Hardening one entry point exposes another or weakens RLS. | High | Security-first ordering; every trust-boundary change reviewed by Principal Architect; independent security verification. |
| **Scope creep** | New findings or "while we're here" work expand a wave beyond its authorization. | Medium | Strict Wave Authorization scope; new findings recorded and deferred; emergency changes require Program Owner approval. |
| **Technical debt** | Legacy duplicate RPCs, fix migrations, and dead code resist clean removal. | High | Use the SSOT Drift Strategy (Program Owner Decision 1); retire debt incrementally with migration and data-safety plans. |
| **Governance deviation** | A wave skips gates, modifies artifacts without authorization, or contradicts the SSOT. | Low | PMO gate audits; no implementation before Engineering Kickoff; traceability checks at every gate. |
| **Program Owner decision delay** | Decisions 1–4 are not recorded, blocking Wave Planning or Engineering Kickoff. | Medium | Maintain the Decision Register; escalate to Program Owner before each gating milestone. |
| **Audit-trust poisoning** | Unauthenticated `audit-log` or missing audit triggers are exploited before remediation completes. | High | Treat `EDG-001` / `ARCH-001` / `PERM` cluster as highest-priority security boundary; consider emergency hotfix per Program Owner Decision 3. |
| **Skill/tooling drift** | Supabase, Edge Functions, or React toolchain changes between remediation waves. | Low | Pin dependency versions for Phase B; review toolchain changes through the Program Owner. |

------------------------------------------------------------------------

# 12. Future Roadmap

The Phase B governance chain from this master plan is:

``` text
Phase B Opening Authorization (11)            COMPLETE
        ↓
Remediation Master Plan (12)                  COMPLETE (this document)
        ↓
Program Owner Decisions 1–4 (13)              COMPLETE
        ↓
Wave-04 Authorization (47)                    AUTHORIZED WITH OBSERVATIONS
        ↓
Wave-04 Engineering Kickoff (48)              COMPLETE WITH OBSERVATIONS (document); NOT AUTHORIZED (execution)
        ↓
Wave-04 Repository Readiness Remediation (49)  COMPLETE
        ↓
Wave-04 Implementation Readiness Review       COMPLETE (50)
        ↓
Wave-04 Implementation                        COMPLETE (51)
        ↓
Wave-04 Verification                          PASS WITH OBSERVATIONS (52)
        ↓
Wave-04 Acceptance                            COMPLETE (53)
        ↓
Wave-04 Deployment Synchronization            READY TO START
        ↓
Wave-04 Closeout                              BLOCKED BY DEPLOYMENT SYNCHRONIZATION
        ↓
Program Certification                         NOT STARTED
```

After the first wave is accepted, the cycle repeats for each subsequent Wave Authorization → Engineering Kickoff → Implementation → Verification → Acceptance → Deployment Synchronization → Closeout. The final program milestone is **Program Certification**, which confirms all 43 unique `AD-Baseline-1.0` issues are remediated, verified, accepted, synchronized, and documented.

# 12A. Repository Baseline Evolution

Wave-03 Repository Hygiene changed the repository baseline. This section records the resulting classifications and permanent decisions so future engineers and AI Agents do not mistake intentional artifacts for dead code.

## 12A.1 Repository Hygiene Completed

Wave-03 Package-03 closed out Repository Hygiene. The following outcomes were verified:

- Obsolete repository artifacts removed (dead Edge Function `deliver-webhook`, legacy permissions wrapper `permissions.ts`, obsolete archive migration script).
- Production artifacts verified (e.g., `admin-health-check` Edge Function confirmed as the live monitoring endpoint).
- Repository verification completed against the approved baseline.
- No unintended source drift introduced.
- Lint verification passed.

Evidence is retained in the Repository Hygiene verification and acceptance records.

## 12A.2 Repository Baseline Classification

The repository now falls into five stable categories:

| Category | Purpose |
|---|---|
| **Application Source Code** | Business logic, migrations, RPCs, Edge Functions, and frontend components that are deployed to production. |
| **Governance Documentation** | Active program records (charters, plans, authorizations, reports) that authorize and trace engineering work. |
| **AI Development Infrastructure** | `.codebase-memory` and similar tooling artifacts used by AI Agents for semantic repository understanding. Not application logic. |
| **Scratch / Working Artifacts** | Temporary folders such as `memory-zone` that support engineering and handoff activities but are not part of the deployed application. |
| **Historical Governance Records** | Closed-program documents under `archive/` that preserve decisions and evidence for audit. |

## 12A.3 AI Development Infrastructure

`.codebase-memory` is intentionally maintained as part of the project's AI development environment.

- **Purpose:** The Codebase Memory MCP generates a knowledge graph that AI Agents use for semantic repository understanding.
- **Production Impact:** None. It is not deployed, executed, or referenced by application code.
- **Repository Impact:** It is not source code, not business logic, not a deployment artifact, and not a Repository Hygiene issue. Its versioning policy follows AI tooling governance rather than application development governance.
- **Future Action:** Engineers must not classify `.codebase-memory` files as dead artifacts solely because they are regenerated.

## 12A.4 Production Infrastructure Decisions

| Artifact | Disposition | Reason |
|---|---|---|
| `admin-health-check` | **KEEP** | Production monitoring endpoint. |
| `deliver-webhook` | **REMOVED** | Dead artifact; no production usage verified. |
| `permissions.ts` | **REMOVED** | Legacy wrapper replaced by the canonical permissions implementation. |

## 12A.5 Governance Deliverables

The repository contains many governance documents with names such as `AUTHORIZATION`, `REVIEW`, `STATUS REVIEW`, `IMPLEMENTATION REPORT`, `EXECUTION REPORT`, and `ACCEPTANCE RECORD`. These are intentional governance deliverables produced by the remediation program. They are historical records, not application source code, and must be preserved as evidence of the program's decision chain.

## 12A.6 Scratch Artifacts

Folders such as `memory-zone` and `archive/handoffs/memory-zone` hold temporary engineering notes, handoff artifacts, and scratch work. They support engineering activities but are not part of the application logic or production deployment. Future disposition follows repository governance and should not be inferred from their presence alone.

## 12A.7 Lessons Learned

Repository Hygiene produced the following lessons:

1. Repository search alone cannot determine production usage; production verification is mandatory before deleting infrastructure.
2. Governance evidence must accompany cleanup.
3. AI infrastructure should be documented separately from application code.
4. Historical governance records are valuable project knowledge and must be retained.
5. A verified classification reduces future dead-code misidentification.

This section is permanent project memory. Future AI Agents reading the roadmap should use these classifications to interpret the repository baseline without requiring the original chat logs.

------------------------------------------------------------------------

# 13. Program Status

| Dimension | Status |
|---|---|
| **Phase A** | CLOSED |
| **Baseline** | SEALED (`AD-Baseline-1.0`) |
| **Phase B** | OPEN |
| **Remediation Master Plan** | COMPLETE |
| **Program Owner Decisions 1–4** | COMPLETE (resolved in `13_ADMIN_DASHBOARD_PROGRAM_OWNER_DECISION_RECORD.md`) |
| **Wave Planning** | COMPLETE (Wave-03) |
| **Wave Authorization** | COMPLETE (Wave-03) |
| **Engineering Kickoff** | COMPLETE (Wave-03) |
| **Implementation** | COMPLETE (Wave-03) |
| **Wave-03 Acceptance** | ACCEPTED WITH OBSERVATIONS |
| **Wave-03 Closeout** | CLOSED |
| **Wave-04 Authorization** | AUTHORIZED WITH OBSERVATIONS |
| **Wave-04 Repository Readiness Remediation** | COMPLETE (49) |
| **Wave-04 Engineering Kickoff** | COMPLETE WITH OBSERVATIONS (document) |
| **Wave-04 Implementation Readiness Review** | COMPLETE (50) |
| **Wave-04 Implementation** | COMPLETE (51) |
| **Wave-04 Verification** | PASS WITH OBSERVATIONS (52) |
| **Wave-04 Acceptance** | ACCEPTED WITH OBSERVATIONS (53) |
| **Wave-04 Closeout** | NOT STARTED |
| **Program Certification** | NOT STARTED |
| **Overall Program Status** | WAVE-04 ACCEPTANCE ACCEPTED WITH OBSERVATIONS — READY FOR CLOSEOUT |

(Updated by `53_ADMIN_DASHBOARD_WAVE-04_ACCEPTANCE_REVIEW.md`, 2026-07-22)

The four Program Owner decisions are resolved in `13_ADMIN_DASHBOARD_PROGRAM_OWNER_DECISION_RECORD.md`:

1. **SSOT Drift Strategy** — **Hybrid Strategy**: controlled reconciliation of post-SSOT repository drift.
2. **Partial Domain Completion** — **Incremental Domain Strategy**: every wave is independently complete; a domain may span multiple waves.
3. **EDG-001 Emergency Hotfix** — **Include EDG-001 in Wave-01** as the highest-priority item; no emergency bypass of governance.
4. **EXE-001 Severity** — **Escalate to CRITICAL**: silent `AuthContext` activation failures are an unacceptable execution risk.

These decisions are now consumed by the Wave-04 authorization. No decision has been invented.

------------------------------------------------------------------------

# 14. Final Decision

| Decision | Status |
|---|---|
| **Remediation Master Plan** | **APPROVED** |
| **Phase B** | **ACTIVE** |
| **Wave Planning** | **COMPLETE** |
| **Wave Authorization** | **AUTHORIZED (Wave-04)** |
| **Engineering** | **COMPLETE** |
| **Implementation** | **COMPLETE (51)** |
| **Verification** | **PASS WITH OBSERVATIONS (52)** |
| **Acceptance** | **ACCEPTED WITH OBSERVATIONS (53)** |

This master plan is the strategic remediation blueprint for Phase B. Wave-04 is authorized with observations. Wave-04 Engineering Kickoff, Implementation Readiness Review, Implementation, Verification, and Acceptance are complete. Wave-04 Closeout may begin only after formal Program Owner authorization.

------------------------------------------------------------------------

# 15. PMO Certification

This Remediation Master Plan has been prepared by the Enterprise Program Management Office (PMO) in accordance with the `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md`, the sealed `AD-Baseline-1.0` investigation record, and the `11_ADMIN_DASHBOARD_PHASE_B_OPENING_AUTHORIZATION.md`.

**Certification Statement:**

> The Remediation Master Plan (Document 12) is complete, uses only `AD-Baseline-1.0`, defines the logical remediation domains for the 43-unique issue portfolio, establishes the engineering principles and quality gates for Phase B, documents dependencies and risks, and sets the future governance chain. It does not perform wave planning, assign issue IDs to waves, estimate wave size, or authorize implementation.

| Role | Name / Identifier | Signature / Certification |
|---|---|---|
| PMO Document Custodian | Enterprise Program Management Office (Agent) | Certified: 2026-07-20 |
| Program Owner | User (Program Owner) | Acknowledgment pending |
| Principal Software Architect | ChatGPT (Methodology Guardian) | Review pending |

**Next governance action:** Record Program Owner Decisions 1 and 4, then proceed to the first Wave Authorization when ready.
