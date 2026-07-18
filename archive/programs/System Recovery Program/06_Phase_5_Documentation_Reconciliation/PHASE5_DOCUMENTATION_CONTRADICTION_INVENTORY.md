# PHASE5 DOCUMENTATION CONTRADICTION INVENTORY

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 5 — Documentation & Derived Artifact Reconciliation  
**Milestone:** M5.1 — Documentation & Contradiction Inventory  
**CURRENT_TASK:** 030  
**Document Type:** Governance / Inventory  
**Date:** 2026-07-17  
**Status:** Accepted

---

## 1. Executive Summary

This inventory was produced under the approved `CURRENT_TASK-030_PROGRAM_AUTHORIZATION.md` and `CURRENT_TASK-030_ENGINEERING_KICKOFF.md` for Milestone M5.1. It is a read-only, documentation-only activity: no source code, migrations, tests, RPC definitions, or existing governance files were modified.

The repository currently contains a large set of planning, audit, runbook, and program-history artifacts that describe different states of the same system. The canonical source of truth for the database contract is the ordered `supabase/migrations/*.sql` chain, with `D-P3-01_Reconciled_RPC_Contract.md` as the accepted RPC contract surface.

**Key findings:**

- **14 confirmed contradictions** were identified across plans, implementation logs, SQL fix docs, audit reports, and RPC contract documentation.
- **2 Critical** contradictions involve a superseded sub-phase plan still claiming completion, and a Phase 5 long-term document referencing a non-existent `tenant_feature_flags` table.
- **7 High** contradictions include obsolete SQL fix plans, outdated security/RPC audit findings, an errata blocking Recovery Domain B that is no longer accurate, and the accepted D-P3-01 RPC contract now being stale relative to the canonical migration chain.
- **4 Medium** and **1 Low** contradiction cover runbook filename errors, unused feature-flag wiring, and a monolith-split claim.
- The disposition plan recommends **Regenerating** the derived RPC contract documents from the canonical migration chain (directly feeding D-P5-02), **Updating** runbooks and audit reports, and **Archiving** obsolete SQL fix and superseded planning artifacts.

---

## 2. Repository Discovery Summary

### 2.1 Canonical Sources

| Priority | Source | Role |
|---|---|---|
| 1 | `supabase/migrations/*.sql` (138 forward-migration files) | Canonical source for schema, tables, functions, RLS policies, triggers, and RPC definitions |
| 2 | `D-P3-01_Reconciled_RPC_Contract.md` | Accepted, reconciled RPC contract surface |
| 3 | `UNIFIED_PROGRAM_STATE.md` | Single authoritative program state; supersedes conflicting planning tracks |
| 4 | `CURRENT_PHASE.md` / `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 5 | Phase 5 scope, entry/exit criteria, deliverables |

### 2.2 Discovered Artifact Groups

| Group | Count | Representative Paths |
|---|---|---|
| Active / sub-phase plans | 3 | `Plan/PLAN_AdminDashboard_SubPhases.md`, `Plan/PLAN_AdminDashboard_Implementation_Phases.md`, `Plan/PLAN_AdminDashboard_OpenSource_Reference.md` |
| Implementation logs | 42 | `Plan/Log/SP-*.md` |
| Local migration copies | 13 | `Plan/Migration/*.sql` |
| Local edge-function copies | 6 | `Plan/EdgeFunction/*.ts` |
| RPC contract docs | 2 | `docs/admin-dashboard/RPC_CONTRACTS.md`, `D-P3-01_Reconciled_RPC_Contract.md` |
| SQL fix / phase docs | 4 | `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md`, `ADMIN_DASHBOARD_PHASE_2_SERVICE_TESTS.md`, `ADMIN_DASHBOARD_PHASE_3_DEPLOY.md`, `ADMIN_DASHBOARD_PHASE_4_VERIFY_UI.md` |
| Operational runbooks | 7 | `docs/admin-dashboard/MIGRATION_RUNBOOK.md`, `DISASTER_RECOVERY_RUNBOOK.md`, `INCIDENT_RESPONSE_RUNBOOK.md`, `KEY_ROTATION_RUNBOOK.md`, `MONITORING_RUNBOOK.md`, `ROLLBACK_RUNBOOK.md`, `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` |
| Handoff / untracked files | 3 | `docs/admin-dashboard/HANDOFF_AUDIT_LOG_400.md`, `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md`, `HANDOFF_PHASE_5_UNTRACKED_FILES.md` |
| Program / governance docs | 6 | `CURRENT_PHASE.md`, `UNIFIED_PROGRAM_STATE.md`, `PHASE5_OPENING_AUTHORIZATION.md`, `PHASE5_GOVERNANCE_TRANSITION_IMPLEMENTATION_REPORT.md`, `CURRENT_TASK-030_PROGRAM_AUTHORIZATION.md`, `CURRENT_TASK-030_ENGINEERING_KICKOFF.md` |
| Phase 4 audit / recovery reports | 8 | `SCAR_PHASE4_REPORT.md`, `AUDIT_REPORT.md`, `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md`, `PHASE4_RECOVERY_MAPPING_VALIDATION.md`, `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md`, `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md`, `GIT_FORENSIC_INVESTIGATION_REPORT.md`, `PHASE4_COMMIT_SCOPE_DEFINITION.md` |
| Superseded Fix-Bug track | 18 | `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/*.md`, `Plan-Fix-Bug/*.md` |

**Total artifacts reviewed:** 109

---

## 3. Inventory Summary

### 3.1 By Artifact Type

| Artifact Type | Count | Primary Locations |
|---|---|---|
| Active Plans | 3 | `Plan/` |
| Sub-phase Plans | 1 | `Plan/PLAN_AdminDashboard_SubPhases.md` |
| Implementation Logs | 42 | `Plan/Log/` |
| Governance Documents | 6 | Repository root, `PHASE5_*` |
| Program Logs | 8 | `PHASE4_PROGRAM_STATUS_AFTER_*`, `PHASE4_*_REVIEW.md` |
| RPC Contract Documents | 2 | `docs/admin-dashboard/RPC_CONTRACTS.md`, `D-P3-01_Reconciled_RPC_Contract.md` |
| SQL Fix Documents | 4 | `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_*` |
| Audit Reports | 8 | `SCAR_PHASE4_REPORT.md`, `AUDIT_REPORT.md`, `PHASE4_*` |
| Operational Runbooks | 7 | `docs/admin-dashboard/*_RUNBOOK.md`, `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` |
| Feature-Flag References | 4 | `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md`, `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md`, `MIGRATION_RUNBOOK.md`, `features.ts` |

### 3.2 By Claimed Status

| Status Claim | Count | Notes |
|---|---|---|
| Done / Complete / Hoàn thành | 37 | Mostly in `Plan/PLAN_AdminDashboard_SubPhases.md` and `Plan/Log/SP-*.md` |
| Partial | 3 | SP-1.0, SP-5.2, SP-5.6, SP-5.7 in SubPhases plan |
| Reference-only / no status | 69 | Runbooks, handoff docs, audit reports, canonical sources |

---

## 4. Contradiction Register

| # | Artifact Path | Artifact Type | Detection Rule | Claimed State | Canonical / Repository Reality | Severity | Disposition | Evidence |
|---|---|---|---|---|---|---|---|---|
| C1 | `Plan/Log/SP-1.0-20260712_123800.md` | Implementation log | R6 | Created `tests/test-helpers.ts` and `tests/test-helpers.test.ts`; 5 tests passed; lint and vitest pass. | Neither file exists anywhere in the repository. `find_file_by_name` returns no results. | High | Update / Regenerate log; mark SP-1.0 incomplete | Log lines 16-17, 32-33, 56; `find_file_by_name **/test-helpers*` returned no files. |
| C2 | `Plan/PLAN_AdminDashboard_SubPhases.md` | Sub-phase plan | R5 / R7 | SP-1.1–SP-7.5 mostly `Done`; SP-2.2, SP-2.7, SP-2.8 explicitly `Done`. | `UNIFIED_PROGRAM_STATE.md` §6 formally supersedes this plan because its status claims are irreconcilable with repository reality. Many claimed artifacts are on local branches only or untracked. | Critical | Archive as reference; replace with current `CURRENT_PHASE.md` / `UNIFIED_PROGRAM_STATE.md` status | SubPhases.md status table lines 46-86; `UNIFIED_PROGRAM_STATE.md` lines 84-86. |
| C3 | `Plan/Log/SP-4.4-20260712_184049.md` | Implementation log | R3 | Created `supabase/migrations/20260724000000_sp4_4_webhook_delivery_hardening.sql` with webhook hardening. | The migration file does not exist in `supabase/migrations/`. Edge function `webhook-delivery` and shared engine exist, but the canonical migration is missing. | High | Update (create migration from log) | Log line 52; `find_file_by_name **/20260724000000*webhook*` returned no files. |
| C4 | `Plan/PLAN_AdminDashboard_SubPhases.md` | Sub-phase plan | R6 | `services/admin/permissions.ts` should contain `ADMIN_PERMISSIONS` constants. | The file is a thin re-export wrapper from `lib/permissions.ts`; it exports `ADMIN_ROLES`, `isSystemAdmin`, etc., but no `ADMIN_PERMISSIONS` constant. | Medium | Update (align plan to actual re-export pattern or create constant) | SubPhases.md lines 104, 119; `services/admin/permissions.ts` lines 1-31. |
| C5 | `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md` | SQL fix doc | R3 / R9 | `get_top_tenants` signature is wrong; `get_current_user_tenants` and `get_tenants_admin` do not exist; provides SQL to fix them. | All three functions are already defined in the canonical migration chain: `get_top_tenants` in `20250706000003_phase_p4_system_analytics.sql` and `20260717000000_fix_admin_tenant_rpc_signatures.sql`; the other two in `20260717000000_fix_admin_tenant_rpc_signatures.sql`. | High | Archive | Fix doc lines 13-24, 30-210; canonical migrations as verified by `grep CREATE.*get_top_tenants` and `CREATE.*get_current_user_tenants`. |
| C6 | `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_4_VERIFY_UI.md` | Operational runbook | R4 | `pages/admin/ComplianceManager.tsx` is the file to verify. | `pages/admin/ComplianceManager.tsx` does not exist. The actual file is `pages/admin/Compliance.tsx`. | Medium | Update (correct filename) | Runbook line 48; `find_file_by_name pages/admin/Compliance*` returned `Compliance.tsx` only. |
| C7 | `docs/admin-dashboard/MIGRATION_RUNBOOK.md` | Operational runbook | R6 | Tracks splitting `pages/SystemAdminDashboard.tsx` into focused pages under `pages/admin/` (Phase 1). | `pages/SystemAdminDashboard.tsx` still exists as a separate monolith alongside `pages/admin/*.tsx`; split is not complete. | Low | Update (clarify split is planned but not yet finished) | Runbook lines 5, 52; `find_file_by_name pages/SystemAdminDashboard.tsx` returned the file. |
| C8 | `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` | Operational runbook | R6 / R8 | Feature flags are stored in a `tenant_feature_flags` table; SQL example adds `admin_gdpr_enabled` column to that table. | No `tenant_feature_flags` table exists in the canonical migration chain. Flags are stored in `tenants.settings->features` JSONB per `20250706000012_phase_p8_2_feature_flags.sql` and `20250711000002_phase_5_long_term_admin_feature_flags.sql`. | Critical | Update (rewrite feature-flag section to match JSONB implementation) | Runbook lines 141-146; `grep CREATE TABLE.*tenant_feature_flags` in `supabase/migrations` returned 0 matches. |
| C9 | `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` and `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md` | Feature-flag reference | R6 | `useAdminFeatureFlags()` is used to gate UI features (e.g. `if (!gdprEnabled) return null`). | `hooks/useAdminFeatureFlags.ts` exists, but `grep` finds no imports or calls in `pages/`, `components/`, or `services/`. The hook is defined but not consumed. | Medium | Update (document that hook is defined but not yet wired to UI) | `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` lines 149-153; `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md` line 23; `grep useAdminFeatureFlags` across `pages/`, `components/`, `services/` returned 0 consumer matches. |
| C10 | `AUDIT_REPORT.md` | Audit report | R9 | CRIT-2 (lines 54-72) lists `set_tenant_subdomain`, `get_storage_usage`, `admin_update_subscription`, `get_member_with_email`, `search_members_by_email` as missing/broken RPCs. | `set_tenant_subdomain` exists in `20260718000001_sp_7_1_set_tenant_subdomain.sql`. The other four names no longer appear as `.rpc()` call sites in `services/`; canonical equivalents (`update_tenant_subscription`, `get_tenant_storage_usage`, `get_tenant_members_with_email`, `search_tenant_members`) are present and used. | High | Update (add errata marking CRIT-2 as resolved) | `AUDIT_REPORT.md` lines 54-72; `grep` for the four old names in `services/` returned 0 matches; `find_file_by_name` found `20260718000001_sp_7_1_set_tenant_subdomain.sql`. |
| C11 | `AUDIT_REPORT.md` | Audit report | R9 | CRIT-3 (lines 74-85) claims `unlock_login_attempts` is callable by `anon`, allowing brute-force reset. | Canonical migration `20260715000003_admin_security_settings.sql` revokes from `public` and grants execute on `unlock_login_attempts` to `authenticated` and `service_role` only. | High | Update (add errata marking CRIT-3 as resolved) | `AUDIT_REPORT.md` lines 74-85; `20260715000003_admin_security_settings.sql` lines 201-202. |
| C12 | `SCAR_PHASE4_REPORT.md` | Audit report | R9 | SSOT Evidence Matrix #1-4 lists `admin_update_subscription`, `get_member_with_email`, `search_members_by_email`, `get_storage_usage` as missing RPCs; #10-12 claim `RPC_CONTRACTS.md` and `tests/mocks/supabase.ts` validate against a markdown contract rather than canonical migrations. | Service code no longer calls the four old RPC names. `scripts/audit-rpc-contracts.ts` now reads `supabase/migrations/*.sql` directly, and `npx tsx scripts/audit-rpc-contracts.ts` reports all service RPCs defined in the canonical chain. | Medium | Update (add errata reflecting Phase 4 remediation) | `SCAR_PHASE4_REPORT.md` lines 49-52, 60; `scripts/audit-rpc-contracts.ts` lines 12-35, 64-77; audit output: "All service-layer RPC calls are defined in the canonical migration chain." |
| C13 | `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` | Audit / authorization errata | R9 / R6 | Lines 161-166 list 6 Domain B RPCs (`generate_tenant_license`, `validate_tenant_license`, `accept_invitation`, `lookup_invitation`, `get_revenue_metrics`, `get_churn_cohort_metrics`) as "Chưa có handler" (no handler). | Service handlers for all 6 exist: `services/admin/licenseService.ts`, `services/admin/memberAdminService.ts`, `services/admin/analyticsAdminService.ts`, and `services/billingAutomationService.ts` call these canonical RPCs. | High | Update (mark errata as resolved) | Errata lines 161-166; `grep` for the six RPC names in `services/admin/*.ts` and `services/billingAutomationService.ts` returned matching `.rpc()` calls. |
| C14 | `D-P3-01_Reconciled_RPC_Contract.md` | RPC contract doc | R2 / R9 | §7.1 and §8 list `admin_update_subscription`, `get_member_with_email`, `search_members_by_email`, `get_storage_usage` as signature-drift or missing RPCs. | The canonical migration chain and service layer have reconciled these: `update_tenant_subscription` now accepts `p_max_storage_gb` (`20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql`), and service code calls `get_tenant_members_with_email`, `search_tenant_members`, and `get_tenant_storage_usage`. The old names have zero call sites. | High | Regenerate from canonical migration chain (feeds D-P5-02) | `D-P3-01_Reconciled_RPC_Contract.md` lines 301-304, 324-327; `npx tsx scripts/audit-rpc-contracts.ts` output; `grep` for the four old RPC names in `services/` returns 0 matches. |

---

## 5. Severity Summary

| Severity | Count | IDs | Meaning |
|---|---|---|---|
| **Critical** | 2 | C2, C8 | Could cause incorrect engineering decisions, violate canonical contract, or lead to operational failure. |
| **High** | 7 | C1, C3, C5, C10, C11, C13, C14 | Could mislead implementation, acceptance, or security/operational decisions; accepted contract or audit findings are stale. |
| **Medium** | 4 | C4, C6, C9, C12 | Stale references, missing file claims, or unused feature-flag wiring that should be reconciled for Phase 5 exit. |
| **Low** | 1 | C7 | Minor runbook claim that is outdated but does not currently block work. |
| **Total** | **14** | — | — |

---

## 6. Disposition Plan

### 6.1 By Contradiction

| # | Disposition | Reason |
|---|---|---|
| C1 | Update | Correct or regenerate the SP-1.0 log to reflect that `tests/test-helpers.ts` and `tests/test-helpers.test.ts` do not exist; mark SP-1.0 incomplete. |
| C2 | Archive | `Plan/PLAN_AdminDashboard_SubPhases.md` is formally superseded by `UNIFIED_PROGRAM_STATE.md` §6 and contains irreconcilable completion claims. |
| C3 | Update | Re-create the missing `20260724000000_sp4_4_webhook_delivery_hardening.sql` migration from the SP-4.4 log or locate it in an untracked backup. |
| C4 | Update | Align the sub-phase plan with the actual `services/admin/permissions.ts` re-export pattern, or add the `ADMIN_PERMISSIONS` constant if the plan is still intended. |
| C5 | Archive | `ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md` is obsolete; the RPCs it seeks to create already exist in the canonical migration chain. |
| C6 | Update | Correct `ComplianceManager.tsx` to `Compliance.tsx` in the verification runbook. |
| C7 | Update | Clarify in `MIGRATION_RUNBOOK.md` that the `SystemAdminDashboard` monolith split is planned but not yet complete. |
| C8 | Update | Rewrite the feature-flag section of `ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` to reference `tenants.settings->features` JSONB, not a non-existent table. |
| C9 | Update | Document that `useAdminFeatureFlags` is defined but not yet consumed by any page/component. |
| C10 | Update | Add an errata note to `AUDIT_REPORT.md` CRIT-2 stating the listed RPCs have been reconciled or no longer exist in service code. |
| C11 | Update | Add an errata note to `AUDIT_REPORT.md` CRIT-3 stating `unlock_login_attempts` is no longer granted to `anon`. |
| C12 | Update | Add an errata to `SCAR_PHASE4_REPORT.md` noting the four missing RPCs were reconciled and the audit script now uses `supabase/migrations/`. |
| C13 | Update | Add an errata to `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` noting Domain B RPC handlers now exist; recovery may proceed. |
| C14 | Regenerate | `D-P3-01_Reconciled_RPC_Contract.md` is a derived contract document that should be regenerated from the canonical migration chain and service call sites (D-P5-02). |

### 6.2 By Artifact Group (Non-Contradiction Dispositions)

| Artifact Group | Disposition | Reason |
|---|---|---|
| `docs/admin-dashboard/RPC_CONTRACTS.md` | Regenerate | Hand-maintained derived contract document; should be generated from `supabase/migrations/` to ensure it stays in sync with the canonical chain. |
| `Plan-Fix-Bug/` (18 files) | Archive | Formally superseded by `UNIFIED_PROGRAM_STATE.md` §6. |
| `Plan/Migration/*.sql` (13 files) | Archive | Duplicate local copies of canonical migrations; the canonical chain lives in `supabase/migrations/`. |
| `Plan/EdgeFunction/*.ts` (6 files) | Archive | Local backup copies of edge functions; canonical versions live in `supabase/functions/`. |
| `Plan/Log/SP-*.md` (remaining 38 logs) | Update / No Action | Most logs correctly record local-only completion. Only C1 and C3 require correction; others can be archived as historical records once Phase 5 reconciliation is complete. |
| `PHASE4_*` program-status reports | No Action | Historical program logs correctly dated and not presented as current status. |

---

## 7. Traceability Matrix

### 7.1 To Master Plan Deliverable D-P5-01 (Reconciled Documentation Set)

| Contradiction ID | Contribution to D-P5-01 |
|---|---|
| C1, C2, C3, C4 | Identifies active/sub-phase plan and log entries that must be reconciled with repository reality. |
| C5, C6, C7, C8, C9 | Identifies admin-dashboard runbooks and SQL fix docs that must be updated or archived. |
| C10, C11, C12, C13 | Identifies audit/authorization reports that must be annotated with current canonical evidence. |
| C14 | Drives regeneration of the canonical RPC contract document, which is the core input to D-P5-01. |

### 7.2 To Phase 5 Exit Criteria

| Exit Criterion | Relevant Contradictions | Explanation |
|---|---|---|
| **EC-1** — Active plans describe statuses consistent with repository reality | C1, C2, C3, C4, C13 | These are active plans, sub-phase plans, and recovery-authorization documents whose status claims do not match the code or migration state. |
| **EC-5** — No official document claims completion for a capability whose canonical contract is absent or broken | C5, C8, C9, C10, C11, C12, C14 | These documents claim missing, broken, or completed capabilities that the canonical migration chain either does not support or has already resolved. |

### 7.3 Combined Traceability Table

| # | D-P5-01 | EC-1 | EC-5 |
|---|---|---|---|
| C1 | ✅ | ✅ | ✅ |
| C2 | ✅ | ✅ |  |
| C3 | ✅ | ✅ | ✅ |
| C4 | ✅ | ✅ |  |
| C5 | ✅ |  | ✅ |
| C6 | ✅ | ✅ |  |
| C7 | ✅ | ✅ |  |
| C8 | ✅ |  | ✅ |
| C9 | ✅ |  | ✅ |
| C10 | ✅ |  | ✅ |
| C11 | ✅ |  | ✅ |
| C12 | ✅ |  | ✅ |
| C13 | ✅ | ✅ | ✅ |
| C14 | ✅ |  | ✅ |

---

## 8. Repository Impact

| Area | Impact |
|---|---|
| New files | `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md` |
| Modified files | None (this task) |
| Source code | No changes |
| Migrations | No changes |
| Database | No changes |
| RPC definitions | No changes |
| Tests | No changes |
| Existing governance files | No changes. Note: `CURRENT_PHASE.md` and `UNIFIED_PROGRAM_STATE.md` show pre-existing line-ending differences in `git status`; these were not edited by this task and are left untouched. |
| Commit performed | No |
| Push performed | No |

---

## 9. Evidence

### 9.1 Service-Layer RPC Verification

Command:
```bash
npx tsx scripts/audit-rpc-contracts.ts
```

Output:
```
Migration RPCs: 300
Code RPCs      : 183

All service-layer RPC calls are defined in the canonical migration chain.
```

Interpretation: Every RPC currently invoked by `services/`, `lib/`, and `utils/` has a matching `CREATE FUNCTION` in the canonical migration chain. This directly contradicts older audit reports that list `admin_update_subscription`, `get_storage_usage`, `get_member_with_email`, and `search_members_by_email` as missing.

### 9.2 Old RPC Names No Longer Used

Command:
```bash
rg "admin_update_subscription|get_storage_usage|get_member_with_email|search_members_by_email" services/ lib/ utils/
```

Result: `0` matches in `services/`, `lib/`, or `utils/`.

### 9.3 Missing SP-1.0 Test Helper Files

Command:
```bash
find_file_by_name **/test-helpers*
```

Result: `No files found`.

### 9.4 Missing SP-4.4 Migration

Command:
```bash
find_file_by_name **/20260724000000*webhook*
```

Result: `No files found`.

### 9.5 `set_tenant_subdomain` Exists in Canonical Chain

Command:
```bash
grep -n "CREATE OR REPLACE FUNCTION public.set_tenant_subdomain" supabase/migrations/*.sql
```

Result: Found in `20260718000001_sp_7_1_set_tenant_subdomain.sql`.

### 9.6 `unlock_login_attempts` Grants

File: `supabase/migrations/20260715000003_admin_security_settings.sql`, lines 201-202.

```sql
REVOKE ALL ON FUNCTION public.unlock_login_attempts(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_login_attempts(TEXT) TO authenticated, service_role;
```

This contradicts `AUDIT_REPORT.md` CRIT-3, which claims the function is callable by `anon`.

### 9.7 No `tenant_feature_flags` Table in Canonical Migrations

Command:
```bash
grep -n "CREATE TABLE.*tenant_feature_flags" supabase/migrations/*.sql
```

Result: `0` matches.

Canonical source: `supabase/migrations/20250706000012_phase_p8_2_feature_flags.sql`, lines 1-2 and 20-22, which store flags in `tenants.settings->features`.

### 9.8 `useAdminFeatureFlags` Not Consumed

Command:
```bash
grep -R "useAdminFeatureFlags" pages/ components/ services/ --include="*.ts" --include="*.tsx"
```

Result: `0` consumer matches outside of `hooks/useAdminFeatureFlags.ts` and documentation files.

### 9.9 Domain B RPC Service Handlers Exist

Command:
```bash
grep -n "generate_tenant_license\|validate_tenant_license\|accept_invitation\|lookup_invitation\|get_revenue_metrics\|get_churn_cohort_metrics" services/admin/*.ts services/billingAutomationService.ts
```

Result: Matching `.rpc()` calls found in `services/admin/licenseService.ts`, `services/admin/memberAdminService.ts`, `services/admin/analyticsAdminService.ts`, and `services/billingAutomationService.ts`.

### 9.10 `Compliance.tsx` vs `ComplianceManager.tsx`

Command:
```bash
find_file_by_name pages/admin/Compliance*
```

Result: `pages/admin/Compliance.tsx` exists. `pages/admin/ComplianceManager.tsx` does not.

---

## 10. Implementation Summary

- **This task is documentation and governance analysis only.** No source code, migrations, tests, RPC definitions, or existing program-state files were modified.
- The repository was scanned against the approved scope in `CURRENT_TASK-030_PROGRAM_AUTHORIZATION.md` and the canonical sources defined in `CURRENT_TASK-030_ENGINEERING_KICKOFF.md`.
- **109 artifacts** were inventoried across active plans, sub-phase plans, implementation logs, program logs, RPC contract docs, SQL fix docs, audit reports, operational runbooks, and feature-flag references.
- **14 contradictions** were confirmed, classified by severity, assigned a disposition, and traced to D-P5-01, EC-1, and EC-5.
- The most significant actions for subsequent Phase 5 work are:
  1. **Regenerate `D-P3-01_Reconciled_RPC_Contract.md` and `docs/admin-dashboard/RPC_CONTRACTS.md`** from the canonical migration chain (M5.2 scope).
  2. **Archive obsolete documents**: `ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md` and `Plan/PLAN_AdminDashboard_SubPhases.md`.
  3. **Update runbooks and audit reports** with errata reflecting the current canonical state.
  4. **Resolve the missing SP-4.4 webhook hardening migration** and the `SP-1.0` false test-helper claim.

---

*No further action is authorized by this document. Acceptance review is not performed here; the next step is Program Manager review and disposition acceptance.*
