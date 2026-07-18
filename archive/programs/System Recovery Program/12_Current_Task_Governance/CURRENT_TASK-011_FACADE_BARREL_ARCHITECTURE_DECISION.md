# CURRENT_TASK-011 — Facade Barrel Architecture Decision (A4)

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Task:** A4 — Facade Barrel Architecture Decision  
**Date:** 2026-07-14  
**Status:** Approved — Implemented  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE3_ACCEPTANCE_REVIEW.md`, `CURRENT_TASK-010_ALIAS_CANONICAL_BOUNDARY_DECISION.md`, `CURRENT_TASK-010_IMPLEMENTATION_REPORT.md`, `D-P3-02_Service_Layer_Contract_Consistency_Report.md`

---

## 1. Executive Summary

This document is the sole Phase 3 deliverable for open item **A4** — the `services/admin/systemAdminService.ts` facade barrel. It performs a complete inventory of every export of that file, evaluates each export against ten required criteria, analyzes three disposition options (keep / remove / partial), and records an architecture recommendation.

**No implementation, code change, migration, schema change, generated-type change, import change, caller update, or out-of-scope deliverable is produced.** This is an architecture decision input awaiting Program Manager review, structurally identical to `CURRENT_TASK-010_ALIAS_CANONICAL_BOUNDARY_DECISION.md`.

### 1.1 Subject Under Evaluation

| Attribute | Value |
|---|---|
| **File** | `services/admin/systemAdminService.ts` |
| **Lines** | 58 |
| **Nature** | Pure facade barrel — 100% re-export, 0 local declarations, 0 business logic |
| **Re-export blocks** | 6 (from 6 distinct canonical modules) |
| **Total exports** | 35 (7 type exports + 28 function re-exports) |
| **Aliases** | 0 (the `checkSubdomainAvailability as checkSubdomain` alias was removed by CURRENT_TASK-010) |
| **Header comment** | `// ponytail: thin admin wrapper around system-level operations.` |

### 1.2 Headline Finding

Post-CURRENT_TASK-010, the facade barrel contains **zero aliases** and **zero business logic**. Every export is a same-name re-export of a canonical symbol from one of six canonical service modules. The facade is therefore a pure aggregation convenience layer, not a shadow-contract generator.

However, it still expands the perceived contract surface: 35 symbols appear at two import paths (`services/admin/systemAdminService` and their true canonical module), and **9 of those 35 exports have zero callers through the facade** (dead surface).

### 1.3 Caller Footprint

| Caller Type | Count | Files |
|---|---|---|
| Production callers | 4 | `pages/admin/Tenants.tsx`, `pages/admin/AdminDashboardInner.tsx`, `pages/admin/Security.tsx`, `components/admin/SecuritySettingsPanel.tsx` |
| Test callers | 3 | `tests/services/systemAdminService.security.test.ts`, `tests/admin-dashboard/SecuritySettingsPanel.test.tsx`, `tests/admin-dashboard/Security.test.tsx` |
| **Total** | **7** | |

---

## 2. Scope and Evidence

### 2.1 In Scope

- The file `services/admin/systemAdminService.ts` as a facade barrel.
- Every export declared in that file.
- Every caller that imports from that file.
- The architecture decision of whether the facade should remain, be removed, or be partially retained.

### 2.2 Out of Scope

- The canonical implementations in the six underlying modules (`systemAdminService.ts`, `operationsService.ts`, `tenantBackupService.ts`, `tenantRestoreService.ts`, `tenantMigrationService.ts`, `tenantService.ts`). These are the canonical sources and are not under evaluation.
- G1–G6, all CLOSED.
- Any implementation, migration, schema, generated-type, import, or caller change.

### 2.3 Evidence Sources

| Evidence | Source |
|---|---|
| Facade source | `services/admin/systemAdminService.ts` (58 lines, read in full) |
| Phase 3 acceptance finding on A4 | `PHASE3_ACCEPTANCE_REVIEW.md` §5.4 |
| G6 closure and alias removal | `CURRENT_TASK-010_IMPLEMENTATION_REPORT.md` §3.4, §6 |
| Canonical module existence | `services/systemAdminService.ts`, `services/operationsService.ts`, `services/tenantBackupService.ts`, `services/tenantRestoreService.ts`, `services/tenantMigrationService.ts`, `services/tenantService.ts` — all verified present |
| Caller inventory | `grep` for `from '...services/admin/systemAdminService'` across `*.{ts,tsx}` — 7 matches; each caller's import block read in full |
| TypeScript validity | `CURRENT_TASK-010_IMPLEMENTATION_REPORT.md` §5 confirms `tsc --noEmit` passes, proving every re-exported symbol exists in its declared canonical module |

### 2.4 Re-Export Block Verification

The facade contains exactly six `export { ... } from '...'` / `export type { ... } from '...'` blocks. No local `const`, `function`, `class`, or `interface` declarations exist. The file is a pure barrel.

```text
Block 1: export type { 7 types }   from '../systemAdminService'
Block 2: export { 12 functions }   from '../systemAdminService'
Block 3: export { 5 functions }    from '../operationsService'
Block 4: export { 1 function }     from '../tenantBackupService'
Block 5: export { 3 functions }    from '../tenantRestoreService'
Block 6: export { 2 functions }    from '../tenantMigrationService'
Block 7: export { 5 functions }    from '../tenantService'
```

---

## 3. Facade Export Inventory

### 3.1 Complete Export Register

The table below lists all 35 exports in source order, with their canonical module and caller counts.

| # | Export | Kind | Canonical Module | Prod Callers | Test Callers |
|---|---|---|---|---|---|
| 1 | `CreateSystemAdminRequest` | type | `systemAdminService` | 0 | 0 |
| 2 | `CreateSystemAdminResponse` | type | `systemAdminService` | 0 | 0 |
| 3 | `RateLimitLog` | type | `systemAdminService` | 0 | 0 |
| 4 | `SecuritySettings` | type | `systemAdminService` | 2 | 2 |
| 5 | `LoginAttempt` | type | `systemAdminService` | 0 | 0 |
| 6 | `LockedEmail` | type | `systemAdminService` | 2 | 2 |
| 7 | `SystemAdmin` | type | `systemAdminService` | 1 | 0 |
| 8 | `getRateLimitLogs` | function | `systemAdminService` | 0 | 0 |
| 9 | `getSystemAdmins` | function | `systemAdminService` | 1 | 0 |
| 10 | `addSystemAdmin` | function | `systemAdminService` | 1 | 0 |
| 11 | `removeSystemAdmin` | function | `systemAdminService` | 1 | 0 |
| 12 | `createSystemAdmin` | function | `systemAdminService` | 1 | 0 |
| 13 | `getTenantSecuritySettings` | function | `systemAdminService` | 2 | 0 |
| 14 | `updateTenantIpAllowlist` | function | `systemAdminService` | 2 | 0 |
| 15 | `updateTenantSessionTimeout` | function | `systemAdminService` | 2 | 1 |
| 16 | `recordLoginAttempt` | function | `systemAdminService` | 0 | 1 |
| 17 | `getLoginAttempts` | function | `systemAdminService` | 0 | 1 |
| 18 | `getLockedEmails` | function | `systemAdminService` | 2 | 1 |
| 19 | `unlockLoginAttempts` | function | `systemAdminService` | 2 | 0 |
| 20 | `getDataRetentionStatus` | function | `operationsService` | 1 | 0 |
| 21 | `getDefaultPlanLimits` | function | `operationsService` | 1 | 0 |
| 22 | `getMaintenanceMode` | function | `operationsService` | 1 | 0 |
| 23 | `setDefaultPlanLimits` | function | `operationsService` | 1 | 0 |
| 24 | `setMaintenanceMode` | function | `operationsService` | 1 | 0 |
| 25 | `downloadTenantBackup` | function | `tenantBackupService` | 1 | 0 |
| 26 | `previewBackupTables` | function | `tenantRestoreService` | 1 | 0 |
| 27 | `restoreTenantBackup` | function | `tenantRestoreService` | 1 | 0 |
| 28 | `validateBackup` | function | `tenantRestoreService` | 1 | 0 |
| 29 | `migrateTenantData` | function | `tenantMigrationService` | 0 | 0 |
| 30 | `resetDemoData` | function | `tenantMigrationService` | 1 | 0 |
| 31 | `getSystemOverview` | function | `tenantService` | 1 | 0 |
| 32 | `getTopTenants` | function | `tenantService` | 0 | 0 |
| 33 | `getTenantGrowth` | function | `tenantService` | 0 | 0 |
| 34 | `startImpersonation` | function | `tenantService` | 1 | 0 |
| 35 | `endImpersonation` | function | `tenantService` | 0 | 0 |

### 3.2 Caller Detail

| Caller File | Type | Symbols Imported via Facade |
|---|---|---|
| `pages/admin/Tenants.tsx` | production | `startImpersonation`, `downloadTenantBackup`, `restoreTenantBackup`, `previewBackupTables`, `validateBackup`, `resetDemoData` (6 functions) |
| `pages/admin/AdminDashboardInner.tsx` | production | `SystemAdmin` (type), `getSystemAdmins`, `addSystemAdmin`, `removeSystemAdmin`, `createSystemAdmin`, `getSystemOverview`, `getDataRetentionStatus`, `getDefaultPlanLimits`, `setDefaultPlanLimits`, `getMaintenanceMode`, `setMaintenanceMode` (1 type + 10 functions) |
| `pages/admin/Security.tsx` | production | `getTenantSecuritySettings`, `updateTenantIpAllowlist`, `updateTenantSessionTimeout`, `getLockedEmails`, `unlockLoginAttempts`, `SecuritySettings` (type), `LockedEmail` (type) (2 types + 5 functions) |
| `components/admin/SecuritySettingsPanel.tsx` | production | `getTenantSecuritySettings`, `updateTenantIpAllowlist`, `updateTenantSessionTimeout`, `getLockedEmails`, `unlockLoginAttempts`, `SecuritySettings` (type), `LockedEmail` (type) (2 types + 5 functions) |
| `tests/services/systemAdminService.security.test.ts` | test | `recordLoginAttempt`, `updateTenantSessionTimeout`, `getLoginAttempts`, `getLockedEmails` (4 functions) |
| `tests/admin-dashboard/SecuritySettingsPanel.test.tsx` | test | `SecuritySettings` (type), `LockedEmail` (type); also `vi.mock('../../services/admin/systemAdminService')` |
| `tests/admin-dashboard/Security.test.tsx` | test | `SecuritySettings` (type), `LockedEmail` (type); also `vi.mock('../../services/admin/systemAdminService')` |

### 3.3 Dead Exports (Zero Callers Through Facade)

9 of 35 exports have no caller that imports them through `services/admin/systemAdminService`:

| # | Export | Kind | Canonical Module |
|---|---|---|---|
| 1 | `CreateSystemAdminRequest` | type | `systemAdminService` |
| 2 | `CreateSystemAdminResponse` | type | `systemAdminService` |
| 3 | `RateLimitLog` | type | `systemAdminService` |
| 4 | `LoginAttempt` | type | `systemAdminService` |
| 5 | `getRateLimitLogs` | function | `systemAdminService` |
| 6 | `migrateTenantData` | function | `tenantMigrationService` |
| 7 | `getTopTenants` | function | `tenantService` |
| 8 | `getTenantGrowth` | function | `tenantService` |
| 9 | `endImpersonation` | function | `tenantService` |

These symbols remain importable directly from their canonical modules; their presence in the facade is unused surface.

---

## 4. Per-Export Ten-Criteria Analysis

### 4.1 Shared Characteristics (Apply to All 35 Exports)

The following five criteria are identical for every export because the facade is a pure same-name re-export barrel with no local declarations:

| Criterion | Answer | Justification |
|---|---|---|
| **4. Pure re-export?** | **Yes — all 35** | Every export is `export { X } from '...'` or `export type { X } from '...'`. No local implementation. |
| **5. Business logic added?** | **No — all 35** | The facade contains zero statements other than re-export declarations. No wrapping, no transformation, no default arguments, no error handling. |
| **6. Signature changed?** | **No — all 35** | Same-name re-export preserves the exact TypeScript signature and return type of the canonical symbol. `tsc --noEmit` passing (per CURRENT_TASK-010 report) confirms type identity. |
| **7. Backward compatibility requirement?** | **Conditional — see per-export** | The facade itself is the backward-compat layer: callers that import from `services/admin/systemAdminService` depend on this path existing. Removing the facade breaks those import paths. See criterion 7 per cluster below. |
| **8. Facade architectural value?** | **Aggregation convenience only — see per-export** | Post-G6, the facade creates no aliases and no shadow names. Its only value is reducing multi-module imports to a single import statement. See criterion 8 per cluster below. |

### 4.2 Per-Export Criteria 1–3, 7, 9, 10

The table below covers the criteria that vary per export. Criteria 4, 5, 6, 8 are covered in §4.1 and §4.3.

Legend for criterion 10 (Architecture Recommendation):
- **KEEP** = retain in facade if facade stays
- **DROP** = remove from facade (dead surface)
- **DIRECT** = caller should import from canonical module directly

| # | Export | 1. Canonical Location | 2. Prod Callers | 3. Test Callers | 7. Backward Compat | 9. Remove Impact | 10. Recommendation |
|---|---|---|---|---|---|---|---|
| 1 | `CreateSystemAdminRequest` | `systemAdminService.ts` | 0 | 0 | None — no caller | None — dead | DROP |
| 2 | `CreateSystemAdminResponse` | `systemAdminService.ts` | 0 | 0 | None | None — dead | DROP |
| 3 | `RateLimitLog` | `systemAdminService.ts` | 0 | 0 | None | None — dead | DROP |
| 4 | `SecuritySettings` | `systemAdminService.ts` | 2 | 2 | 4 callers import this type via facade | 4 callers add `import type { SecuritySettings } from '../systemAdminService'` | KEEP or DIRECT |
| 5 | `LoginAttempt` | `systemAdminService.ts` | 0 | 0 | None | None — dead | DROP |
| 6 | `LockedEmail` | `systemAdminService.ts` | 2 | 2 | 4 callers import via facade | 4 callers add direct type import | KEEP or DIRECT |
| 7 | `SystemAdmin` | `systemAdminService.ts` | 1 | 0 | 1 caller (`AdminDashboardInner`) | 1 caller adds direct type import | KEEP or DIRECT |
| 8 | `getRateLimitLogs` | `systemAdminService.ts` | 0 | 0 | None | None — dead | DROP |
| 9 | `getSystemAdmins` | `systemAdminService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 10 | `addSystemAdmin` | `systemAdminService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 11 | `removeSystemAdmin` | `systemAdminService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 12 | `createSystemAdmin` | `systemAdminService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 13 | `getTenantSecuritySettings` | `systemAdminService.ts` | 2 | 0 | 2 callers | 2 callers import from canonical | KEEP or DIRECT |
| 14 | `updateTenantIpAllowlist` | `systemAdminService.ts` | 2 | 0 | 2 callers | 2 callers import from canonical | KEEP or DIRECT |
| 15 | `updateTenantSessionTimeout` | `systemAdminService.ts` | 2 | 1 | 3 callers | 3 callers import from canonical | KEEP or DIRECT |
| 16 | `recordLoginAttempt` | `systemAdminService.ts` | 0 | 1 | 1 test caller | 1 test imports from canonical | KEEP or DIRECT |
| 17 | `getLoginAttempts` | `systemAdminService.ts` | 0 | 1 | 1 test caller | 1 test imports from canonical | KEEP or DIRECT |
| 18 | `getLockedEmails` | `systemAdminService.ts` | 2 | 1 | 3 callers | 3 callers import from canonical | KEEP or DIRECT |
| 19 | `unlockLoginAttempts` | `systemAdminService.ts` | 2 | 0 | 2 callers | 2 callers import from canonical | KEEP or DIRECT |
| 20 | `getDataRetentionStatus` | `operationsService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 21 | `getDefaultPlanLimits` | `operationsService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 22 | `getMaintenanceMode` | `operationsService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 23 | `setDefaultPlanLimits` | `operationsService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 24 | `setMaintenanceMode` | `operationsService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 25 | `downloadTenantBackup` | `tenantBackupService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 26 | `previewBackupTables` | `tenantRestoreService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 27 | `restoreTenantBackup` | `tenantRestoreService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 28 | `validateBackup` | `tenantRestoreService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 29 | `migrateTenantData` | `tenantMigrationService.ts` | 0 | 0 | None | None — dead | DROP |
| 30 | `resetDemoData` | `tenantMigrationService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 31 | `getSystemOverview` | `tenantService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 32 | `getTopTenants` | `tenantService.ts` | 0 | 0 | None | None — dead | DROP |
| 33 | `getTenantGrowth` | `tenantService.ts` | 0 | 0 | None | None — dead | DROP |
| 34 | `startImpersonation` | `tenantService.ts` | 1 | 0 | 1 caller | 1 caller imports from canonical | KEEP or DIRECT |
| 35 | `endImpersonation` | `tenantService.ts` | 0 | 0 | None | None — dead | DROP |

### 4.3 Criterion 8 — Facade Architectural Value (Per Cluster)

The 26 used exports group into four caller clusters. The facade's aggregation value differs per cluster:

**Cluster S — Security (exports #4, 6, 13, 14, 15, 18, 19)**
- Callers: `Security.tsx`, `SecuritySettingsPanel.tsx`, `SecuritySettingsPanel.test.tsx`, `Security.test.tsx`, `systemAdminService.security.test.ts`
- All 7 exports originate from the **same** canonical module (`systemAdminService.ts`).
- **Facade value: NONE.** Re-exporting from a single module adds no aggregation benefit. A caller importing `{ getTenantSecuritySettings, ... } from '../systemAdminService'` is identical in length to importing from the facade. The facade here is pure indirection.

**Cluster A — Admin Dashboard (exports #7, 9, 10, 11, 12, 20, 21, 22, 23, 24, 31)**
- Caller: `AdminDashboardInner.tsx`
- Exports span **3** canonical modules: `systemAdminService` (5 functions + 1 type), `operationsService` (5 functions), `tenantService` (1 function).
- **Facade value: MODERATE.** Collapses 3 import statements into 1. This is the only cluster where the barrel provides genuine aggregation.

**Cluster T — Tenants Operations (exports #25, 26, 27, 28, 30, 34)**
- Caller: `Tenants.tsx`
- Exports span **4** canonical modules: `tenantBackupService` (1), `tenantRestoreService` (3), `tenantMigrationService` (1), `tenantService` (1).
- **Facade value: MODERATE.** Collapses 4 import statements into 1.

**Cluster D — Dead (exports #1, 2, 3, 5, 8, 29, 32, 33, 35)**
- Callers: none.
- **Facade value: NEGATIVE.** 9 unused exports expand the perceived contract surface with zero benefit.

### 4.4 Criterion 9 — Remove Impact Summary

If the facade is removed entirely:

| Impact Area | Detail |
|---|---|
| Production import changes | 4 files change import paths from `services/admin/systemAdminService` to their respective canonical modules. `AdminDashboardInner.tsx` splits into 3 imports; `Tenants.tsx` splits into 4 imports; `Security.tsx` and `SecuritySettingsPanel.tsx` each redirect to `systemAdminService` (single module, no split). |
| Test import changes | `systemAdminService.security.test.ts` redirects 4 function imports to `services/systemAdminService`. |
| Test mock target changes | `SecuritySettingsPanel.test.tsx` and `Security.test.tsx` each contain `vi.mock('../../services/admin/systemAdminService', ...)`. These mocks must be retargeted to `vi.mock('../../services/systemAdminService', ...)` (or to the specific canonical module each mocked function belongs to). This is the highest-sensitivity change because mock-target mismatches cause silently-passing tests. |
| Dead exports | 9 dead exports vanish automatically — no caller to update. |
| Canonical modules | Zero change. The 6 canonical modules are untouched. |
| Migrations / schema / types | Zero change. |

---

## 5. Cross-Cutting Findings

### 5.1 Post-G6 Status

CURRENT_TASK-010 removed the last alias (`checkSubdomainAvailability as checkSubdomain`) from this facade. The file now contains **zero aliases**. Every export is a same-name re-export. The facade no longer generates shadow names.

### 5.2 Phase 3 EC-5 Relationship

Phase 3 Exit Criterion EC-5 states: "Alias patterns that create shadow contracts are documented or removed."

`PHASE3_ACCEPTANCE_REVIEW.md` §5.4 flagged the facade as a "contract ambiguity" under EC-5. Post-G6, the facade creates no aliases. The remaining EC-5 question is whether a **same-name aggregation barrel** constitutes a "shadow contract." 

**Architecture authority assessment:** A same-name re-export barrel does not create a shadow *name*, but it does create a shadow *import path* — the same symbol is importable from two locations, and the facade path obscures the canonical module. Whether this satisfies EC-5 is a Program Manager decision, because EC-5's text addresses "alias patterns" (names) and the facade no longer aliases.

### 5.3 Domain Coherence

The facade aggregates 6 distinct domains into one import point:

| Domain | Canonical Module | Exports |
|---|---|---|
| System admin security | `systemAdminService.ts` | 19 (7 types + 12 functions) |
| Operations / maintenance | `operationsService.ts` | 5 |
| Tenant backup | `tenantBackupService.ts` | 1 |
| Tenant restore | `tenantRestoreService.ts` | 3 |
| Tenant migration | `tenantMigrationService.ts` | 2 |
| Tenant system overview / impersonation | `tenantService.ts` | 5 |

The facade's name (`systemAdminService`) suggests it is the system-admin module, but 16 of 35 exports come from 5 other modules. The name is misleading relative to content.

### 5.4 Test Mock Sensitivity

Two test files (`SecuritySettingsPanel.test.tsx`, `Security.test.tsx`) use `vi.mock('../../services/admin/systemAdminService', ...)`. If the facade is removed, these mocks must be retargeted. A mock that targets a non-existent module path silently no-ops in Vitest, which means tests would pass without actually mocking — a false-green risk. Any removal implementation must explicitly verify mock retargeting.

---

## 6. Three Options Analysis

### Option A — Keep Facade As-Is

**Action:** Leave `services/admin/systemAdminService.ts` unchanged. Record it in a canonical boundary registry as an approved aggregation barrel.

| Dimension | Assessment |
|---|---|
| **Pros** | Zero churn — no file changes. Admin dashboard pages retain single-import convenience (`AdminDashboardInner` keeps 1 import instead of 3; `Tenants` keeps 1 instead of 4). Test mocks remain unchanged. No risk of false-green tests from mock retargeting. |
| **Cons** | 9 dead exports remain — unused contract surface. The facade's name (`systemAdminService`) is misleading: 16 of 35 exports come from 5 non-systemAdmin modules. The shadow-import-path ambiguity flagged in PHASE3_ACCEPTANCE_REVIEW §5.4 remains unresolved. A4 stays OPEN. Phase 3 EC-5 may remain partially unsatisfied depending on Program Manager interpretation of "shadow contract." |
| **Risk** | **Low functional, moderate architectural.** No runtime risk. The architectural risk is that the facade perpetuates a non-canonical aggregation layer that future developers treat as the import source, deepening the indirection. |
| **Recommendation** | **Not recommended.** Accepting the facade as-is accepts 9 dead exports and a misleading module name as permanent. This is the lowest-effort option but does not advance Phase 3 closure on A4. Only viable if the Program Manager decides that aggregation convenience outweighs canonical-boundary clarity. |

### Option B — Remove Facade Completely

**Action:** Delete `services/admin/systemAdminService.ts`. Migrate all 7 callers to import directly from their respective canonical modules. Retarget the 2 `vi.mock` calls. The 9 dead exports disappear automatically.

| Dimension | Assessment |
|---|---|
| **Pros** | Fully resolves A4 — the facade barrel is gone, not just documented. Eliminates 9 dead exports. Every import path points to the true canonical module — maximum traceability. Consistent with the G5 (duplicate wrapper removal) and G6 (alias removal) precedent: the program has been *removing* non-canonical surface, not documenting it. No aliases, no shadow paths, no misleading module name. Phase 3 EC-5 is unambiguously satisfied. |
| **Cons** | 7 files change import paths. `AdminDashboardInner.tsx` gains 2 additional import statements (1→3). `Tenants.tsx` gains 3 additional import statements (1→4). `Security.tsx` and `SecuritySettingsPanel.tsx` redirect to `systemAdminService` (no split, same import count). 2 test files must retarget `vi.mock` paths — the highest-sensitivity change. |
| **Risk** | **Moderate.** The production import changes are mechanical and low-risk (same functions, same signatures, different path). The test mock retargeting carries false-green risk if a mock path is mistargeted. This risk is mitigable by running the affected tests after retargeting and verifying mock interception. No migration, schema, or generated-type change is involved. |
| **Recommendation** | **Recommended.** This is the option most consistent with the program's recovery philosophy ("recover canonical sources before derived artifacts," "deletion over addition") and with the G5/G6 precedent. The churn is bounded (7 files), mechanical, and verified by `tsc --noEmit` + affected test runs. The false-green mock risk is real but contained to 2 test files and detectable by running the tests. |

### Option C — Keep Partial Facade

**Action:** Retain the facade but reduce it to only the exports that provide genuine multi-module aggregation value (Clusters A and T), and remove all single-module re-exports (Cluster S) and dead exports (Cluster D).

Specifically:
- **Keep:** the 11 exports used by `AdminDashboardInner.tsx` (spanning 3 modules) and the 6 exports used by `Tenants.tsx` (spanning 4 modules). Total: 17 exports (with overlap on `startImpersonation`/`getSystemOverview` — none overlap, so 17 distinct).
- **Remove:** the 7 security-cluster exports (all from `systemAdminService` — single-module, no aggregation value) and the 9 dead exports.

| Dimension | Assessment |
|---|---|
| **Pros** | Retains the single-import convenience for the 2 callers that genuinely benefit from multi-module aggregation (`AdminDashboardInner`, `Tenants`). Removes 16 of 35 exports (9 dead + 7 single-module security). Reduces the misleading surface. Lower churn than Option B: `Security.tsx` and `SecuritySettingsPanel.tsx` redirect to `systemAdminService` (4 files), but `AdminDashboardInner` and `Tenants` keep their single import. |
| **Cons** | Introduces a subjective boundary: "which exports deserve to stay in the facade?" The decision criterion (multi-module aggregation) is reasonable but not self-evident — future developers may not understand why some exports are in the barrel and others are not. The facade's name (`systemAdminService`) remains misleading — it would still re-export from `operationsService`, `tenantBackupService`, `tenantRestoreService`, `tenantMigrationService`, and `tenantService`. The 2 test mocks for the security cluster must still be retargeted (same false-green risk as Option B, but for fewer files). A4 is *partially* resolved — a facade still exists, so the "contract ambiguity" question shifts from "should it exist?" to "is the remaining subset correct?" |
| **Risk** | **Low-moderate.** Less churn than Option B but introduces an ongoing maintenance question: when a new admin function is added, should it go in the facade? The criterion is no longer "is it an admin function?" but "does it aggregate across modules?" — a subtler rule that may not be followed consistently. |
| **Recommendation** | **Viable but not preferred.** This option trades a clean binary decision (facade exists / facade does not exist) for a subjective subset decision. The program's recovery philosophy favors clarity over convenience. If the Program Manager values the `AdminDashboardInner` and `Tenants` single-import convenience highly, this option is defensible. But it leaves a smaller version of the same architectural question open. |

---

## 7. Comparative Summary

| Criterion | Option A (Keep) | Option B (Remove) | Option C (Partial) |
|---|---|---|---|
| Files changed | 0 | 7 | 4–5 |
| Dead exports removed | 0 | 9 | 9 |
| A4 resolved | No | Yes — fully | Partially |
| EC-5 satisfaction | Ambiguous | Unambiguous | Ambiguous (facade remains) |
| Consistent with G5/G6 precedent | No | Yes | Partially |
| Production import convenience preserved | Yes | No | Partially (2 of 4 callers) |
| False-green mock risk | None | Yes (2 test files) | Yes (2 test files) |
| Subjective boundary introduced | No | No | Yes |
| Misleading module name fixed | No | Yes (file deleted) | No (file remains) |

---

## 8. Architecture Authority Recommendation

**Recommended Option: B — Remove the facade completely.**

Rationale:

1. **Consistency.** The program has removed non-canonical surface at every opportunity: G5 removed a duplicate wrapper, G6 removed 4 aliases. Option B continues this precedent. Options A and C break it.

2. **Dead surface.** 9 of 35 exports (26%) are unused through the facade. Option A preserves this waste; Option C removes it but retains a subjective subset; Option B removes all of it.

3. **Traceability.** Post-removal, every import path names the true canonical module. A developer reading `import { downloadTenantBackup } from '../tenantBackupService'` knows immediately where the function lives. Today, `import { downloadTenantBackup } from './systemAdminService'` obscures this.

4. **Misleading name.** The facade is named `systemAdminService` but 16 of 35 exports come from 5 other modules. Option B eliminates this misnomer. Option C does not.

5. **Bounded risk.** The churn is 7 files, all mechanical import-path changes plus 2 mock retargets. No migration, schema, type, or business-logic change. The false-green mock risk is real but confined to 2 test files and detectable by running them.

6. **EC-5 clarity.** Option B unambiguously satisfies Phase 3 EC-5. Options A and C leave the "is a same-name barrel a shadow contract?" question open for interpretation.

**Counter-consideration for the Program Manager:** The single-import convenience for `AdminDashboardInner.tsx` (3 modules → 1 import) and `Tenants.tsx` (4 modules → 1 import) is a real ergonomic benefit. If the Program Manager judges that this convenience outweighs the canonical-boundary clarity gained by removal, Option C is the defensible middle ground. Option A is not recommended under any interpretation because it preserves 9 dead exports and resolves nothing.

---

## 9. Implementation Impact (No Implementation Performed)

If Option B is approved, a subsequent authorized `CURRENT_TASK` would touch:

| File | Change | Reason |
|---|---|---|
| `services/admin/systemAdminService.ts` | **Deleted** | Facade removed. |
| `pages/admin/Tenants.tsx` | 6 imports redirected to 4 canonical modules | `startImpersonation` → `tenantService`; `downloadTenantBackup` → `tenantBackupService`; `restoreTenantBackup`, `previewBackupTables`, `validateBackup` → `tenantRestoreService`; `resetDemoData` → `tenantMigrationService` |
| `pages/admin/AdminDashboardInner.tsx` | 11 imports redirected to 3 canonical modules | `SystemAdmin`, `getSystemAdmins`, `addSystemAdmin`, `removeSystemAdmin`, `createSystemAdmin` → `systemAdminService`; `getDataRetentionStatus`, `getDefaultPlanLimits`, `getMaintenanceMode`, `setDefaultPlanLimits`, `setMaintenanceMode` → `operationsService`; `getSystemOverview` → `tenantService` |
| `pages/admin/Security.tsx` | 7 imports redirected to `systemAdminService` | Single canonical module — no split, just path change |
| `components/admin/SecuritySettingsPanel.tsx` | 7 imports redirected to `systemAdminService` | Single canonical module — path change only |
| `tests/services/systemAdminService.security.test.ts` | 4 imports redirected to `services/systemAdminService` | Path change only |
| `tests/admin-dashboard/SecuritySettingsPanel.test.tsx` | Type imports redirected + `vi.mock` retargeted to `../../services/systemAdminService` | Mock retarget — verify interception |
| `tests/admin-dashboard/Security.test.tsx` | Type imports redirected + `vi.mock` retargeted to `../../services/systemAdminService` | Mock retarget — verify interception |

No migration, schema, generated-type, canonical RPC, or business-logic change is required.

---

## 10. Final Architecture Decision

**Recommended Option:** **B** — Remove the facade completely and migrate all 7 callers to import directly from their respective canonical modules.

This decision resolves A4, is consistent with the G5/G6 removal precedent, eliminates 9 dead exports, and unambiguously satisfies Phase 3 EC-5. The implementation churn is bounded to 7 files of mechanical import-path changes plus 2 test mock retargets, with no migration, schema, or generated-type impact.

**Architecture Decision:**

## APPROVED — IMPLEMENTED

**Approved Option:** **B** — Remove the facade completely and migrate all callers to import directly from their respective canonical modules.

**Implementation:** Completed in `CURRENT_TASK-011_IMPLEMENTATION_REPORT.md`. The facade barrel `services/admin/systemAdminService.ts` was deleted. All 4 production callers and 5 test callers (including 2 additional test callers discovered during validation) were migrated to their canonical modules. All `vi.mock` targets were retargeted. Validation: TypeScript compile PASS, RPC audit PASS (125/125), affected tests PASS (23/23), grep PASS (zero source-file references to the deleted facade).

No migration, schema, generated-type, canonical RPC, or business-logic change was introduced.
