# D-P5-04 — Feature-Flag Configuration Traceability Record

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 5 — Documentation & Derived Artifact Reconciliation  
**Milestone:** M5.4 — Feature-Flag Configuration Traceability Record  
**Deliverable:** D-P5-04 — Feature-Flag Configuration Traceability Record  
**Document Type:** Traceability Record  
**Date:** 2026-07-18  
**Status:** Accepted  

**Basis:**
- `CURRENT_TASK-033_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-033_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-032` governance chain

---

## 1. Executive Summary

This deliverable records the complete feature-flag configuration traceability for VietSalePro v7. The inventory rediscovered **13 tenant-scoped JSONB feature flags**, **5 derived admin aliases**, and **27 build-time UI feature flags**. Each flag is mapped to its canonical source, storage location, every identified consumer, and the operational or governance documents that reference it. Gaps are classified using the predefined taxonomy and are not modified. All evidence is anchored to file and line numbers. No source code, migration, database, RPC, test, or governance state file was changed to produce this record.

---

## 2. Objective

The objective of `CURRENT_TASK-033` / M5.4 is to produce `D-P5-04` so that every feature-flag configuration reference in the repository is traceable to:

- Its canonical migration definition (tenant-scoped JSONB flags).
- Its canonical type definition and default value in `types/tenant.ts`.
- Its canonical code definition in `features.ts` (build-time UI flags).
- The service, hook, page, component, utility, or test that consumes it.
- The operational or governance document that describes it.

This record supports Phase 5 exit criterion **EC-4**: *Feature-flag configuration is traceable to the migration or code that consumes it*.

---

## 3. Scope

### 3.1 In-Scope

- Feature-Flag Configuration Traceability Record (D-P5-04).
- Tenant-scoped JSONB feature flags and build-time UI feature flags.
- Canonical source identification and classification.
- Consumer identification across services, hooks, pages, components, utilities, and tests.
- Traceability matrix and gap register.
- Evidence collection and gap classification.
- Acceptance mapping to M5.4 and EC-4.

### 3.2 Out-of-Scope

- Business logic, database schema, migration, RPC, service-layer, or test changes.
- UI implementation or architecture changes.
- Creation of `CURRENT_TASK-034` or any subsequent task.
- Modification of `CURRENT_PHASE.md` or `UNIFIED_PROGRAM_STATE.md`.
- Commit or push operations.

---

## 4. Canonical Sources

| Priority | Source | Role | Evidence |
|---|---|---|---|
| 1 | `supabase/migrations/20250706000012_phase_p8_2_feature_flags.sql` | Defines `get_tenant_feature_flags` and `update_tenant_feature_flags`; establishes `tenants.settings->features` JSONB storage. | <ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250706000012_phase_p8_2_feature_flags.sql" lines="9-66" /> |
| 2 | `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql` | Backfills default `false` for `adminGdprEnabled`, `adminAuditRealtimeEnabled`, `adminAdvancedAnalyticsEnabled`, `adminImpersonationEnabled`, `adminReadReplicaQueueEnabled`. | <ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql" lines="5-17" /> |
| 3 | `types/tenant.ts` | Defines `TenantFeatureFlags` interface and `DEFAULT_TENANT_FEATURE_FLAGS` default map. | <ref_snippet file="c:/PROJECT/vietsalepro/types/tenant.ts" lines="283-313" /> |
| 4 | `features.ts` | Defines build-time UI feature-flag constants. | <ref_file file="c:/PROJECT/vietsalepro/features.ts" /> |

---

## 5. Source Classification

| Classification | Definition | Examples |
|---|---|---|
| **Canonical** | Authoritative source that defines the feature flag, its storage, or its type. No derived document may override it. | Ordered `supabase/migrations/*.sql` chain; `types/tenant.ts`; `features.ts` |
| **Derived** | Generated or produced from a canonical source; must not be treated as authority. | `supabase/generated/database.types.ts`; `supabase/schema.sql`; `D-P3-01_Reconciled_RPC_Contract.md` |
| **Reference** | Operational or governance documents that describe or instruct on feature flags; must be cross-checked against canonical sources. | `docs/admin-dashboard/MIGRATION_RUNBOOK.md`; `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md`; `RPC_CONTRACTS.md` |
| **Historical** | Superseded or archived artifacts; consulted only to detect stale claims. | `Plan/Log/SP-*.md`; `memory-zone/Master-design/A/UI_ROLLBACK_PLAN.md`; Phase 4 audit reports |

Canonical sources win over derived, reference, or historical sources when contradictions are found.

---

## 6. Feature Flag Inventory Strategy

The inventory was performed in five phases as required by `CURRENT_TASK-033_ENGINEERING_KICKOFF.md` §7.

| Phase | Activity | Evidence |
|---|---|---|
| Phase 1 — Canonical Definitions | Read `supabase/migrations/20250706000012_phase_p8_2_feature_flags.sql`, `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql`, `types/tenant.ts`, and `features.ts` to extract the canonical flag set. | Migration and type excerpts captured in §4. |
| Phase 2 — Consumer Audit | Grepped `services/`, `hooks/`, `pages/`, `components/`, `utils/`, `lib/`, and `tests/` for every `TenantFeatureFlags` key, `DEFAULT_TENANT_FEATURE_FLAGS` key, and every `features.ts` constant. | Consumer rows in §10. |
| Phase 3 — Documentation Audit | Read `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md`, `MIGRATION_RUNBOOK.md`, `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md`, `INCIDENT_RESPONSE_RUNBOOK.md`, `RPC_CONTRACTS.md`, `D-P3-01_Reconciled_RPC_Contract.md`, `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md`, and `CURRENT_TASK-033_ENGINEERING_KICKOFF.md`. | Document references and contradictions in §10 and §11. |
| Phase 4 — Operational References | Audited runbooks, handoff documents, ownership tables, and operational references for feature-flag mentions. | `MIGRATION_RUNBOOK.md` ownership table; `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md`; `INCIDENT_RESPONSE_RUNBOOK.md`. |
| Phase 5 — Repository-Wide Discovery | Grepped the entire repository (including `Plan/`, `memory-zone/`, `supabase/generated/`, `docs/`, `tests/`) for `tenant_feature_flags`, `tenants.settings->features`, `get_tenant_feature_flags`, `update_tenant_feature_flags`, `TenantFeatureFlags`, `DEFAULT_TENANT_FEATURE_FLAGS`, `features.ts`, and every build-time flag constant. | No additional canonical consumers were discovered for the dead build-time flags; see §10.3. |

---

## 7. Consumer Discovery Strategy

| Area | Search Strategy | Evidence |
|---|---|---|
| Services | Grep `getTenantFeatureFlags`, `updateTenantFeatureFlags`, `TenantFeatureFlags`, `DEFAULT_TENANT_FEATURE_FLAGS` in `services/` and `services/admin/`. | `services/tenantService.ts:654-672`; `services/admin/tenantAdminService.ts:238-239` |
| Hooks | Read `hooks/useAdminFeatureFlags.ts`; grep for `useAdminFeatureFlags` consumers in `pages/`, `components/`, `services/`. | `hooks/useAdminFeatureFlags.ts:1-50`; no page/component/service imports found |
| Pages | Grep every `useXxxx` flag constant and `features.ts` import in `pages/`. | `pages/admin/Tenants.tsx`; `pages/Dashboard.tsx`; `pages/Products.tsx`; etc. |
| Components | Grep `features.ts` imports and `useXxxx` checks in `components/`. | `components/MasterModal.tsx`; `components/PayDebtModal.tsx`; `components/ProductEditModal.tsx`; etc. |
| Utilities / Lib | Grep `features.ts` and `TenantFeatureFlags` in `utils/` and `lib/`. | No utility consumers identified. |
| Tests | Grep `getTenantFeatureFlags`, `updateTenantFeatureFlags`, `TenantFeatureFlags`, `features.ts`, and `useXxxx` in `tests/`. | `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:1-78`; `tests/admin-dashboard/Tenants.test.tsx:34-35` |

---

## 8. Documentation Discovery Strategy

| Target | What Was Captured | Evidence |
|---|---|---|
| Admin docs | `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` feature-flag section. | `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md:139-161` |
| Runbooks | `MIGRATION_RUNBOOK.md` feature-flags / ownership sections; `INCIDENT_RESPONSE_RUNBOOK.md` incident containment. | `MIGRATION_RUNBOOK.md:131-140`; `MIGRATION_RUNBOOK.md:200`; `INCIDENT_RESPONSE_RUNBOOK.md:36` |
| RPC documentation | `D-P3-01_Reconciled_RPC_Contract.md` and `docs/admin-dashboard/RPC_CONTRACTS.md` entries. | `D-P3-01_Reconciled_RPC_Contract.md:198,263`; `RPC_CONTRACTS.md:120,185` |
| Governance documents | `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md`; `CURRENT_TASK-033_ENGINEERING_KICKOFF.md`; `CURRENT_TASK-033_PROGRAM_AUTHORIZATION.md`. | `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md:75,98-99`; `CURRENT_TASK-033_ENGINEERING_KICKOFF.md` §6.3 |
| Handoff / untracked | `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md`; `HANDOFF_PHASE_5_UNTRACKED_FILES.md`. | `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md:12,22,25,185`; `HANDOFF_PHASE_5_UNTRACKED_FILES.md:23,155,162,164` |

---

## 9. Traceability Matrix Design

| Column | Content |
|---|---|
| **Feature Flag** | Exact flag name or key. |
| **Type** | `tenant-scoped`, `derived/admin`, or `build-time`. |
| **Canonical Definition** | File and line(s) where the flag is defined. |
| **Storage** | JSONB path for tenant-scoped; in-memory `boolean` constant for build-time. |
| **Consumer** | File and line(s) where the flag is read or branches behavior. |
| **Documentation** | Governance / operational document and section that references the flag. |
| **Evidence** | Exact file/line pointers or reproducible commands. |
| **Status** | `Traceable`, `Orphan`, `Dead`, `Stale`, `Unsupported`. |
| **Gap** | Gap classification from §11, or `None`. |
| **Notes** | Evidence-anchored comment. |

> **ponytail:** The traceability matrix uses one row per canonical or derived flag. Consumer and Evidence cells aggregate multiple call sites so the matrix stays readable; every call site is listed with file:line.

---

## 10. Traceability Matrix

### 10.1 Tenant-Scoped JSONB Feature Flags

| Feature Flag | Type | Canonical Definition | Storage | Consumer | Documentation | Evidence | Status | Gap | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `pos` | tenant-scoped | `types/tenant.ts:284` (interface), `300` (default `true`); `supabase/migrations/20250706000012_phase_p8_2_feature_flags.sql:9-25` | `tenants.settings->features.pos` | `services/tenantService.ts:654-660` (read); `pages/admin/Tenants.tsx:951-962` (toggle); `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:43,58,60,71,74` | `CURRENT_TASK-033_ENGINEERING_KICKOFF.md:170`; `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md:75` | `types/tenant.ts:284,300`; `services/tenantService.ts:654-660`; `pages/admin/Tenants.tsx:951-962`; `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:43,58,60,71,74` | Traceable | None | Default `true`; merged via `update_tenant_feature_flags` |
| `inventory` | tenant-scoped | `types/tenant.ts:285` (interface), `301` (default `true`); `supabase/migrations/20250706000012_phase_p8_2_feature_flags.sql:9-25` | `tenants.settings->features.inventory` | `services/tenantService.ts:654-660` (read); `pages/admin/Tenants.tsx:951-962` (toggle); `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:44,62,63,71-72,75` | `CURRENT_TASK-033_ENGINEERING_KICKOFF.md:170`; `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md:75` | `types/tenant.ts:285,301`; `services/tenantService.ts:654-660`; `pages/admin/Tenants.tsx:951-962`; `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:44,62,63,71-72,75` | Traceable | None | Default `true`; merge preserves untouched keys |
| `reports` | tenant-scoped | `types/tenant.ts:286` (interface), `302` (default `true`); `supabase/migrations/20250706000012_phase_p8_2_feature_flags.sql:9-25` | `tenants.settings->features.reports` | `services/tenantService.ts:654-660` (read); `pages/admin/Tenants.tsx:951-962` (toggle); `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:45,58-59,61,76` | `CURRENT_TASK-033_ENGINEERING_KICKOFF.md:170`; `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md:75` | `types/tenant.ts:286,302`; `services/tenantService.ts:654-660`; `pages/admin/Tenants.tsx:951-962`; `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:45,58-59,61,76` | Traceable | None | Default `true`; smoke test verifies merge |
| `debt` | tenant-scoped | `types/tenant.ts:287` (interface), `303` (default `true`); `supabase/migrations/20250706000012_phase_p8_2_feature_flags.sql:9-25` | `tenants.settings->features.debt` | `services/tenantService.ts:654-660` (read); `pages/admin/Tenants.tsx:951-962` (toggle); `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:46` | `CURRENT_TASK-033_ENGINEERING_KICKOFF.md:170`; `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md:75` | `types/tenant.ts:287,303`; `services/tenantService.ts:654-660`; `pages/admin/Tenants.tsx:951-962`; `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:46` | Traceable | None | Default `true` |
| `loyalty` | tenant-scoped | `types/tenant.ts:288` (interface), `304` (default `true`); `supabase/migrations/20250706000012_phase_p8_2_feature_flags.sql:9-25` | `tenants.settings->features.loyalty` | `services/tenantService.ts:654-660` (read); `pages/admin/Tenants.tsx:951-962` (toggle); `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:47,63-64` | `CURRENT_TASK-033_ENGINEERING_KICKOFF.md:170`; `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md:75` | `types/tenant.ts:288,304`; `services/tenantService.ts:654-660`; `pages/admin/Tenants.tsx:951-962`; `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:47,63-64` | Traceable | None | Default `true` |
| `promotions` | tenant-scoped | `types/tenant.ts:289` (interface), `305` (default `true`); `supabase/migrations/20250706000012_phase_p8_2_feature_flags.sql:9-25` | `tenants.settings->features.promotions` | `services/tenantService.ts:654-660` (read); `pages/admin/Tenants.tsx:951-962` (toggle); `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:48` | `CURRENT_TASK-033_ENGINEERING_KICKOFF.md:170`; `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md:75` | `types/tenant.ts:289,305`; `services/tenantService.ts:654-660`; `pages/admin/Tenants.tsx:951-962`; `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:48` | Traceable | None | Default `true` |
| `invoicing` | tenant-scoped | `types/tenant.ts:290` (interface), `306` (default `true`); `supabase/migrations/20250706000012_phase_p8_2_feature_flags.sql:9-25` | `tenants.settings->features.invoicing` | `services/tenantService.ts:654-660` (read); `pages/admin/Tenants.tsx:951-962` (toggle); `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:49` | `CURRENT_TASK-033_ENGINEERING_KICKOFF.md:170`; `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md:75` | `types/tenant.ts:290,306`; `services/tenantService.ts:654-660`; `pages/admin/Tenants.tsx:951-962`; `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:49` | Traceable | None | Default `true` |
| `lotTracking` | tenant-scoped | `types/tenant.ts:291` (interface), `307` (default `true`); `supabase/migrations/20250706000012_phase_p8_2_feature_flags.sql:9-25` | `tenants.settings->features.lotTracking` | `services/tenantService.ts:654-660` (read); `pages/admin/Tenants.tsx:951-962` (toggle); `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:50` | `CURRENT_TASK-033_ENGINEERING_KICKOFF.md:170`; `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md:75` | `types/tenant.ts:291,307`; `services/tenantService.ts:654-660`; `pages/admin/Tenants.tsx:951-962`; `tests/smoke/admin-dashboard-p8-2-feature-flags.test.ts:50` | Traceable | None | Default `true` |
| `adminGdprEnabled` | tenant-scoped | `types/tenant.ts:292` (interface), `308` (default `false`); `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql:10` | `tenants.settings->features.adminGdprEnabled` | `hooks/useAdminFeatureFlags.ts:43` (alias `gdprEnabled`); `pages/admin/Tenants.tsx:951-962` (toggle); `services/tenantService.ts:662-672` (update) | `MIGRATION_RUNBOOK.md:134`; `HANDOFF_PHASE_5_UNTRACKED_FILES.md:23`; `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md:157` | `types/tenant.ts:292,308`; `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql:10`; `hooks/useAdminFeatureFlags.ts:43`; `pages/admin/Tenants.tsx:951-962`; `services/tenantService.ts:662-672` | Traceable | None | Default `false`; backfilled idempotently |
| `adminAuditRealtimeEnabled` | tenant-scoped | `types/tenant.ts:293` (interface), `309` (default `false`); `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql:11` | `tenants.settings->features.adminAuditRealtimeEnabled` | `hooks/useAdminFeatureFlags.ts:44` (alias `auditRealtimeEnabled`); `pages/admin/Tenants.tsx:951-962` (toggle); `services/tenantService.ts:662-672` (update) | `MIGRATION_RUNBOOK.md:135`; `HANDOFF_PHASE_5_UNTRACKED_FILES.md:23`; `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md:158` | `types/tenant.ts:293,309`; `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql:11`; `hooks/useAdminFeatureFlags.ts:44`; `pages/admin/Tenants.tsx:951-962`; `services/tenantService.ts:662-672` | Traceable | None | Default `false` |
| `adminAdvancedAnalyticsEnabled` | tenant-scoped | `types/tenant.ts:294` (interface), `310` (default `false`); `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql:12` | `tenants.settings->features.adminAdvancedAnalyticsEnabled` | `hooks/useAdminFeatureFlags.ts:45` (alias `advancedAnalyticsEnabled`); `pages/admin/Tenants.tsx:951-962` (toggle); `services/tenantService.ts:662-672` (update) | `MIGRATION_RUNBOOK.md:136`; `HANDOFF_PHASE_5_UNTRACKED_FILES.md:23`; `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md:159` | `types/tenant.ts:294,310`; `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql:12`; `hooks/useAdminFeatureFlags.ts:45`; `pages/admin/Tenants.tsx:951-962`; `services/tenantService.ts:662-672` | Traceable | None | Default `false` |
| `adminImpersonationEnabled` | tenant-scoped | `types/tenant.ts:295` (interface), `311` (default `false`); `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql:13` | `tenants.settings->features.adminImpersonationEnabled` | `hooks/useAdminFeatureFlags.ts:46` (alias `impersonationEnabled`); `pages/admin/Tenants.tsx:951-962` (toggle); `services/tenantService.ts:662-672` (update) | `MIGRATION_RUNBOOK.md:137`; `HANDOFF_PHASE_5_UNTRACKED_FILES.md:23`; `INCIDENT_RESPONSE_RUNBOOK.md:36`; `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md:160` | `types/tenant.ts:295,311`; `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql:13`; `hooks/useAdminFeatureFlags.ts:46`; `pages/admin/Tenants.tsx:951-962`; `services/tenantService.ts:662-672`; `INCIDENT_RESPONSE_RUNBOOK.md:36` | Traceable | None | Default `false`; referenced for incident containment |
| `adminReadReplicaQueueEnabled` | tenant-scoped | `types/tenant.ts:296` (interface), `312` (default `false`); `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql:14` | `tenants.settings->features.adminReadReplicaQueueEnabled` | `hooks/useAdminFeatureFlags.ts:47` (alias `readReplicaQueueEnabled`); `pages/admin/Tenants.tsx:951-962` (toggle); `services/tenantService.ts:662-672` (update) | `MIGRATION_RUNBOOK.md:138`; `HANDOFF_PHASE_5_UNTRACKED_FILES.md:23` | `types/tenant.ts:296,312`; `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql:14`; `hooks/useAdminFeatureFlags.ts:47`; `pages/admin/Tenants.tsx:951-962`; `services/tenantService.ts:662-672` | Traceable | None | Default `false` |

### 10.2 Derived Admin Feature-Flag Aliases

| Feature Flag | Type | Canonical Definition | Storage | Consumer | Documentation | Evidence | Status | Gap | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `gdprEnabled` | derived/admin | `hooks/useAdminFeatureFlags.ts:6` (interface), `43` (alias) | computed from `tenants.settings->features.adminGdprEnabled` | none | `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md:151-152` (claims usage) | `hooks/useAdminFeatureFlags.ts:6,43`; `grep` returned only `hooks/useAdminFeatureFlags.ts` and `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` | Orphan | Orphan Reference | Alias defined but not consumed by `pages/`, `components/`, or `services/` |
| `auditRealtimeEnabled` | derived/admin | `hooks/useAdminFeatureFlags.ts:7` (interface), `44` (alias) | computed from `tenants.settings->features.adminAuditRealtimeEnabled` | none | `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` implies usage at `151-152` | `hooks/useAdminFeatureFlags.ts:7,44`; `grep` returned only `hooks/useAdminFeatureFlags.ts` | Orphan | Orphan Reference | Alias defined but not consumed |
| `advancedAnalyticsEnabled` | derived/admin | `hooks/useAdminFeatureFlags.ts:8` (interface), `45` (alias) | computed from `tenants.settings->features.adminAdvancedAnalyticsEnabled` | none | `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` implies usage at `151-152` | `hooks/useAdminFeatureFlags.ts:8,45`; `grep` returned only `hooks/useAdminFeatureFlags.ts` | Orphan | Orphan Reference | Alias defined but not consumed |
| `impersonationEnabled` | derived/admin | `hooks/useAdminFeatureFlags.ts:9` (interface), `46` (alias) | computed from `tenants.settings->features.adminImpersonationEnabled` | none | `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` implies usage at `151-152` | `hooks/useAdminFeatureFlags.ts:9,46`; `grep` returned only `hooks/useAdminFeatureFlags.ts` | Orphan | Orphan Reference | Alias defined but not consumed |
| `readReplicaQueueEnabled` | derived/admin | `hooks/useAdminFeatureFlags.ts:10` (interface), `47` (alias) | computed from `tenants.settings->features.adminReadReplicaQueueEnabled` | none | `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` implies usage at `151-152` | `hooks/useAdminFeatureFlags.ts:10,47`; `grep` returned only `hooks/useAdminFeatureFlags.ts` | Orphan | Orphan Reference | Alias defined but not consumed |

### 10.3 Build-Time UI Feature Flags

| Feature Flag | Type | Canonical Definition | Storage | Consumer | Documentation | Evidence | Status | Gap | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `useNewActionButton` | build-time | `features.ts:16` (`true`) | in-memory `boolean` constant | none (only docs) | `UI_ROLLBACK_PLAN.md:141,287,371,392,924,1660`; `UI_MIGRATION_MASTER_ROADMAP.md:167,945`; `UI_COMPONENT_AUDIT_MASTER_REPORT.md:83,120` | `features.ts:16`; `grep` returned no `pages/` or `components/` usage | Dead | Dead Feature Flag | Always `true`; no runtime branch |
| `useNewInputSystem` | build-time | `features.ts:19` (`true`) | in-memory `boolean` constant | none | none | `features.ts:19`; `grep` returned no matches outside `features.ts` | Dead | Dead Feature Flag | No consumers or documentation |
| `useNewStateComponents` | build-time | `features.ts:22` (`true`) | in-memory `boolean` constant | none (only docs) | `UI_ROLLBACK_PLAN.md:201,287,375,396`; `UI_MIGRATION_MASTER_ROADMAP.md:205,947` | `features.ts:22`; `grep` returned no `pages/` or `components/` usage | Dead | Dead Feature Flag | Always `true`; no runtime branch |
| `useNewStatusBadge` | build-time | `features.ts:25` (`true`) | in-memory `boolean` constant | none (only docs) | `UI_ROLLBACK_PLAN.md:171,374,395`; `UI_MIGRATION_MASTER_ROADMAP.md:224,948` | `features.ts:25`; `grep` returned no `pages/` or `components/` usage | Dead | Dead Feature Flag | Always `true`; no runtime branch |
| `useNewSectionBox` | build-time | `features.ts:28` (`true`) | in-memory `boolean` constant | `components/SectionBox.tsx:12` (comment only) | `UI_ROLLBACK_PLAN.md:161,287,373,394`; `UI_MIGRATION_MASTER_ROADMAP.md:243,949` | `features.ts:28`; `components/SectionBox.tsx:12`; `grep` returned no conditional usage | Dead | Dead Feature Flag | Comment reference only; no runtime branch |
| `useNewFormField` | build-time | `features.ts:31` (`true`) | in-memory `boolean` constant | none | none | `features.ts:31`; `grep` returned no matches outside `features.ts` | Dead | Dead Feature Flag | No consumers or documentation |
| `useNewNotificationSystem` | build-time | `features.ts:34` (`true`) | in-memory `boolean` constant | none | none | `features.ts:34`; `grep` returned no matches outside `features.ts` | Dead | Dead Feature Flag | No consumers or documentation |
| `useNewPicker` | build-time | `features.ts:37` (`true`) | in-memory `boolean` constant | none (only docs) | `UI_ROLLBACK_PLAN.md:248,259,383,408,1685`; `UI_MIGRATION_MASTER_ROADMAP.md:300,952` | `features.ts:37`; `grep` returned no `pages/` or `components/` usage | Dead | Dead Feature Flag | Always `true`; no runtime branch |
| `useMasterModalV2` | build-time | `features.ts:40` (`true`) | in-memory `boolean` constant | `components/MasterModal.tsx:30` (import); `components/MasterModal.tsx:182,186,194,218,259,269,281,282,288` (branches) | `UI_ROLLBACK_PLAN.md:181,376,397,1664`; `UI_MIGRATION_MASTER_ROADMAP.md:319,953` | `features.ts:40`; `components/MasterModal.tsx:30,182,186,194,218,259,269,281,282,288` | Traceable | None | Active; controls modal V2 rendering |
| `useRefactoredPromotionModal` | build-time | `features.ts:43` (`true`) | in-memory `boolean` constant | `components/desktop-pos/modals/PromotionModal.tsx:5` (import); `components/desktop-pos/modals/PromotionModal.tsx:103` (branch); `components/desktop-pos/modals/PromotionModal.css:3` (comment) | `UI_ROLLBACK_PLAN.md:226,299,379,404,1188,1662`; `UI_MIGRATION_MASTER_ROADMAP.md:433,452,956` | `features.ts:43`; `components/desktop-pos/modals/PromotionModal.tsx:5,103`; `components/desktop-pos/modals/PromotionModal.css:3` | Traceable | None | Active; controls PromotionModal V2 |
| `useRefactoredPayDebtModal` | build-time | `features.ts:46` (`true`) | in-memory `boolean` constant | `components/PayDebtModal.tsx:34` (import); `components/PayDebtModal.tsx:289` (branch) | `UI_MIGRATION_MASTER_ROADMAP.md:471,957` | `features.ts:46`; `components/PayDebtModal.tsx:34,289` | Traceable | None | Active; controls PayDebtModal V2 |
| `useRefactoredTaxModal` | build-time | `features.ts:49` (`true`) | in-memory `boolean` constant | `components/TaxCalculationModal.tsx:5` (import); `components/TaxCalculationModal.tsx:442` (branch) | `UI_MIGRATION_MASTER_ROADMAP.md:509,959` | `features.ts:49`; `components/TaxCalculationModal.tsx:5,442` | Traceable | None | Active; controls TaxCalculationModal V2 |
| `useRefactoredDisposalDetailModal` | build-time | `features.ts:52` (`true`) | in-memory `boolean` constant | `components/disposal-form/DisposalDetailModal.tsx:11` (import); `components/disposal-form/DisposalDetailModal.tsx:500` (branch) | `UI_MIGRATION_MASTER_ROADMAP.md:528,960` | `features.ts:52`; `components/disposal-form/DisposalDetailModal.tsx:11,500` | Traceable | None | Active; controls DisposalDetailModal V2 |
| `useNewDataGrid` | build-time | `features.ts:55` (`true`) | in-memory `boolean` constant | none (only docs) | `UI_ROLLBACK_PLAN.md:377`; `UI_MIGRATION_MASTER_ROADMAP.md:964` | `features.ts:55`; `grep` returned no `pages/` or `components/` usage | Dead | Dead Feature Flag | Generic flag; per-page flags are used instead |
| `useNewDataGridInventory` | build-time | `features.ts:58` (`true`) | in-memory `boolean` constant | `pages/Products.tsx:13` (import); `pages/Products.tsx:1271,1354,1593` (branches) | `UI_MIGRATION_MASTER_ROADMAP.md:623,965`; `memory-zone/AGENTS.md:710,726` | `features.ts:58`; `pages/Products.tsx:13,1271,1354,1593` | Traceable | None | Active; controls Products DataGrid |
| `useNewDataGridInventoryCounts` | build-time | `features.ts:61` (`true`) | in-memory `boolean` constant | `pages/InventoryCount.tsx:22` (import); `pages/InventoryCount.tsx:1057` (branch) | `memory-zone/AGENTS.md:710,726`; `AUDIT_PHASE_0_2_INVENTORY_COUNT.md:88,94,156`; `AUDIT_PHASE_0_4_DISPOSAL_FORM.md:104` | `features.ts:61`; `pages/InventoryCount.tsx:22,1057` | Traceable | None | Active; controls InventoryCount DataGrid |
| `useNewDataGridDisposals` | build-time | `features.ts:64` (`true`) | in-memory `boolean` constant | `pages/Disposals.tsx:11` (import); `pages/Disposals.tsx:338,430` (branches) | `UI_MIGRATION_MASTER_ROADMAP.md:642,966` | `features.ts:64`; `pages/Disposals.tsx:11,338,430` | Traceable | None | Active; controls Disposals DataGrid |
| `useNewDataGridOrders` | build-time | `features.ts:67` (`true`) | in-memory `boolean` constant | `pages/Orders.tsx:31` (import); `pages/Orders.tsx:552` (branch) | `UI_MIGRATION_MASTER_ROADMAP.md:967` | `features.ts:67`; `pages/Orders.tsx:31,552` | Traceable | None | Active; controls Orders DataGrid |
| `useNewDataGridCustomers` | build-time | `features.ts:70` (`true`) | in-memory `boolean` constant | `pages/Customers.tsx:19` (import); `pages/Customers.tsx:943` (branch) | `UI_MIGRATION_MASTER_ROADMAP.md:968` | `features.ts:70`; `pages/Customers.tsx:19,943` | Traceable | None | Active; controls Customers DataGrid |
| `useNewDataGridSuppliers` | build-time | `features.ts:73` (`true`) | in-memory `boolean` constant | `pages/Suppliers.tsx:8` (import); `pages/Suppliers.tsx:702` (branch) | `UI_MIGRATION_MASTER_ROADMAP.md:969` | `features.ts:73`; `pages/Suppliers.tsx:8,702` | Traceable | None | Active; controls Suppliers DataGrid |
| `useNewDataGridReturnOrders` | build-time | `features.ts:76` (`true`) | in-memory `boolean` constant | `pages/ReturnOrders.tsx:12` (import); `pages/ReturnOrders.tsx:2273` (branch) | `UI_MIGRATION_MASTER_ROADMAP.md:970`; `HEADER_ROW_RETURN.md:235`; `DATA_TABLE_RETURN.md:109,341` | `features.ts:76`; `pages/ReturnOrders.tsx:12,2273` | Traceable | None | Active; controls ReturnOrders DataGrid |
| `useNewDataGridImportGoods` | build-time | `features.ts:79` (`true`) | in-memory `boolean` constant | `pages/ImportGoods.tsx:27` (import); `pages/ImportGoods.tsx:1896` (branch) | `AUDIT_PHASE_0_COMBINED.md:97`; `AUDIT_PHASE_0_4_DISPOSAL_FORM.md:96`; `AUDIT_PHASE_0_1_IMPORT_GOODS.md:90,134` | `features.ts:79`; `pages/ImportGoods.tsx:27,1896` | Traceable | None | Active; controls ImportGoods DataGrid |
| `useNewAppShell` | build-time | `features.ts:82` (`true`) | in-memory `boolean` constant | `App.tsx:63` (import); `App.tsx:1605` (branch); `App.tsx:1630` (legacy branch) | `UI_MIGRATION_MASTER_ROADMAP.md:680,971` | `features.ts:82`; `App.tsx:63,1605,1630` | Traceable | None | Active; controls app shell layout |
| `useNewSplitPane` | build-time | `features.ts:85` (`true`) | in-memory `boolean` constant | `components/desktop-pos/POSLayout.tsx:2` (import); `components/desktop-pos/POSLayout.tsx:15,20,24` (branches) | `UI_MIGRATION_MASTER_ROADMAP.md:699,972` | `features.ts:85`; `components/desktop-pos/POSLayout.tsx:2,15,20,24` | Traceable | None | Active; controls POS split-pane layout |
| `useNewDashboard` | build-time | `features.ts:88` (`true`) | in-memory `boolean` constant | `pages/Dashboard.tsx:18` (import); `pages/Dashboard.tsx:507,541` (branches) | `SCAR_PHASE3_REPORT.md:133`; `UI_MIGRATION_MASTER_ROADMAP.md:737,973` | `features.ts:88`; `pages/Dashboard.tsx:18,507,541` | Traceable | None | Active; controls Dashboard V2 |
| `useNewTabs` | build-time | `features.ts:91` (`true`) | in-memory `boolean` constant | none (only docs) | `UI_MIGRATION_MASTER_ROADMAP.md:262,950`; `UI_COMPONENT_AUDIT_MASTER_REPORT.md:465` | `features.ts:91`; `grep` returned no `pages/` or `components/` usage | Dead | Dead Feature Flag | Always `true`; no runtime branch |
| `useRefactoredProductEditModal` | build-time | `features.ts:94` (`true`) | in-memory `boolean` constant | `components/ProductEditModal.tsx:5` (import); `components/ProductEditModal.tsx:228` (branch) | `UI_MIGRATION_MASTER_ROADMAP.md:490,958` | `features.ts:94`; `components/ProductEditModal.tsx:5,228` | Traceable | None | Active; controls ProductEditModal V2 |

---

## 11. Gap Register

| # | Feature Flag / Reference | Gap Classification | Evidence | Notes |
|---|---|---|---|---|
| G1 | `tenant_feature_flags` table claim in `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md:141-146` | Stale Documentation / Unsupported Claim | `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md:141-146`; `grep CREATE TABLE.*tenant_feature_flags` in `supabase/migrations/` returned 0 matches; canonical storage is `tenants.settings->features` | Document describes a non-existent table and `ALTER TABLE` SQL that was never merged. |
| G2 | `useAdminFeatureFlags()` used to gate UI in `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md:149-153` and `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md` | Stale Documentation | `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md:149-153`; `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md:23`; `grep 'useAdminFeatureFlags'` across `pages/`, `components/`, `services/` returned 0 consumer matches; `HANDOFF_PHASE_5_UNTRACKED_FILES.md:162` confirms hook not wired to UI | The hook is defined but not consumed by any page, component, or service. |
| G3 | `gdprEnabled` | Orphan Reference | `hooks/useAdminFeatureFlags.ts:6,43`; `grep 'gdprEnabled'` returned only definition and `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md:151-152` | Derived alias has no downstream consumer. |
| G4 | `auditRealtimeEnabled` | Orphan Reference | `hooks/useAdminFeatureFlags.ts:7,44`; `grep 'auditRealtimeEnabled'` returned only definition | Derived alias has no downstream consumer. |
| G5 | `advancedAnalyticsEnabled` | Orphan Reference | `hooks/useAdminFeatureFlags.ts:8,45`; `grep 'advancedAnalyticsEnabled'` returned only definition | Derived alias has no downstream consumer. |
| G6 | `impersonationEnabled` | Orphan Reference | `hooks/useAdminFeatureFlags.ts:9,46`; `grep 'impersonationEnabled'` returned only definition | Derived alias has no downstream consumer. |
| G7 | `readReplicaQueueEnabled` | Orphan Reference | `hooks/useAdminFeatureFlags.ts:10,47`; `grep 'readReplicaQueueEnabled'` returned only definition | Derived alias has no downstream consumer. |
| G8 | `useNewActionButton` | Dead Feature Flag | `features.ts:16`; `grep` returned no `pages/` or `components/` usage | Defined and always `true`; no legacy or new branch consumes it. |
| G9 | `useNewInputSystem` | Dead Feature Flag | `features.ts:19`; `grep` returned no matches outside `features.ts` | No consumers or documentation. |
| G10 | `useNewStateComponents` | Dead Feature Flag | `features.ts:22`; `grep` returned no `pages/` or `components/` usage | Defined and always `true`; no runtime branch. |
| G11 | `useNewStatusBadge` | Dead Feature Flag | `features.ts:25`; `grep` returned no `pages/` or `components/` usage | Defined and always `true`; no runtime branch. |
| G12 | `useNewSectionBox` | Dead Feature Flag | `features.ts:28`; `components/SectionBox.tsx:12` (comment only); `grep` returned no conditional usage | Comment-only reference; no runtime branch. |
| G13 | `useNewFormField` | Dead Feature Flag | `features.ts:31`; `grep` returned no matches outside `features.ts` | No consumers or documentation. |
| G14 | `useNewNotificationSystem` | Dead Feature Flag | `features.ts:34`; `grep` returned no matches outside `features.ts` | No consumers or documentation. |
| G15 | `useNewPicker` | Dead Feature Flag | `features.ts:37`; `grep` returned no `pages/` or `components/` usage | Defined and always `true`; no runtime branch. |
| G16 | `useNewDataGrid` | Dead Feature Flag | `features.ts:55`; `grep` returned no `pages/` or `components/` usage | Generic flag; per-page `useNewDataGrid*` flags are used instead. |
| G17 | `useNewTabs` | Dead Feature Flag | `features.ts:91`; `grep` returned no `pages/` or `components/` usage | Defined and always `true`; no runtime branch. |

---

## 12. Evidence Collection Rules

1. No inference: every matrix cell cites a file and line range or a reproducible command.
2. No self-conclusion: D-P5-04 records references, not runtime state.
3. One row per canonical flag; derived aliases that lack consumers are listed separately.
4. Canonical sources are cited first; documentation is secondary evidence.
5. Exact excerpts are captured in `<ref_snippet>` tags where practical; otherwise `file:line` pointers are provided.
6. Reproducible commands (e.g., `grep -n 'useNewActionButton' ...`) are recorded in Evidence cells.
7. No canonical source, consumer, or documentation was edited to make them match this record.

---

## 13. Verification Strategy

| Step | Activity | Verification |
|---|---|---|
| 1 | Read all canonical sources and confirm the feature-flag key set. | 13 tenant-scoped keys in `types/tenant.ts`; 27 build-time constants in `features.ts`; recorded in §10. |
| 2 | Grep the repository for every key and every `features.ts` constant. | Consumer inventory in §7 and §10; no additional source consumers discovered for dead flags. |
| 3 | Read every consumer file and extract the usage line. | Each consumer maps to a flag and a canonical source; Evidence cells are file:line anchored. |
| 4 | Read every reference document and cross-check against canonical sources. | Contradictions classified in §11; no document elevated to canonical status. |
| 5 | Build the traceability matrix and gap register. | Every row has evidence; §10 and §11 are complete. |

---

## 14. Acceptance Mapping

M5.4 acceptance condition in `PHASE5_OPENING_AUTHORIZATION.md` §7:

> "Feature-Flag Configuration Traceability Record (D-P5-04) is accepted; all referenced flags are traceable to their consumer."

Phase 5 exit criterion **EC-4** in `SYSTEM_RECOVERY_MASTER_PLAN.md` §4:

> "Feature-flag configuration is traceable to the migration or code that consumes it."

| D-P5-04 Section | Supports M5.4 / EC-4 By |
|---|---|
| Executive Summary | States scope and canonical-source-first principle. |
| Canonical Sources (§4) | Lists the migrations, types, and `features.ts` that authoritatively define each flag. |
| Source Classification (§5) | Prevents derived or historical documents from being treated as canonical. |
| Feature Flag Inventory Strategy (§6) | Documents the five-phase rediscovery that ensures the inventory is not assumed from M5.1. |
| Traceability Matrix (§10) | Maps each flag to canonical definition, storage, consumer, documentation, and evidence. |
| Gap Register (§11) | Records every flag or reference that is not traceable, with classification. |
| Evidence Collection Rules (§12) | Ensures every claim is reproducible and not inferred. |

---

## 15. Repository Impact

This implementation produced only `D-P5-04_Feature_Flag_Configuration_Traceability_Record.md`. It did not modify or create any of the following:

- Source code (`services/`, `hooks/`, `pages/`, `components/`, `utils/`, `lib/`)
- Migrations (`supabase/migrations/*.sql`)
- Database schema or data
- RPC signatures or implementations
- Tests (`tests/`)
- `CURRENT_PHASE.md`
- `UNIFIED_PROGRAM_STATE.md`
- `CURRENT_TASK-034` or any subsequent task

No commit or push was performed.

---

## 16. Risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | Scope creep into implementation. | Strict stop conditions in §17; any request to change code triggers a stop. |
| 2 | Treating a derived document as canonical. | Canonical source rules in §5; derived documents are labeled and never used to override migrations or `types/tenant.ts`. |
| 3 | Missing consumers because of dynamic or indirect references. | Repository-wide grep in Phase 5 included generated types, `Plan/`, and `memory-zone/`. |
| 4 | Assuming the M5.1 inventory is complete. | Full rediscovery performed; no inventory was assumed. |
| 5 | Confusing build-time flags with tenant-scoped JSONB flags. | Traceability matrix `Type` column separates the two categories. |
| 6 | Stale documentation contradicting canonical sources. | Recorded as `Stale Documentation` / `Unsupported Claim` in §11, not as source-of-truth. |

---

## 17. Stop Conditions

This implementation stops immediately and escalates to the Program Manager if any of the following occur:

- Scope expands beyond M5.4 / D-P5-04.
- A request is made to change business logic.
- A request is made to change the database schema or data.
- A request is made to create or modify a migration.
- A request is made to change an RPC signature or implementation.
- A request is made to update `CURRENT_PHASE.md`.
- A request is made to update `UNIFIED_PROGRAM_STATE.md`.
- A request is made to proceed to M5.5.
- A request is made to start Phase 6 work.
- Any attempt to commit or push changes as part of this implementation.

---

## 18. Exit Criteria

D-P5-04 is complete when:

1. The traceability matrix in §10 inventories every canonical feature flag.
2. Every matrix row has file/line evidence for canonical definition, storage, consumer, and documentation.
3. The gap register in §11 classifies every untraceable flag or contradictory reference.
4. Acceptance mapping to M5.4 and EC-4 in §14 is complete.
5. No source, migration, test, RPC, or governance state file was modified.

---

*D-P5-04 was produced under `CURRENT_TASK-033` and does not modify `CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md`, or any source, migration, test, RPC, or business-logic artifact.*
