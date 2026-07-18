# CURRENT_TASK-011 — Implementation Report (A4)

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Task:** A4 — Facade Barrel Architecture Decision  
**Date:** 2026-07-14  
**Status:** COMPLETE

---

## 1. Executive Summary

Closed A4 by implementing **Option B — Remove the facade completely**, as approved by the Program Manager. The facade barrel `services/admin/systemAdminService.ts` (58 lines, 35 same-name re-exports from 6 canonical modules) was deleted. Every caller was migrated to import directly from its respective canonical module, and every `vi.mock(...)` was retargeted to the canonical module each mocked function belongs to.

No schema change, migration change, generated-type change, canonical RPC change, business-logic change, new facade, or new alias was introduced. The 6 underlying canonical modules are untouched.

| Disposition | Detail |
|---|---|
| Facade file | `services/admin/systemAdminService.ts` — **DELETED** |
| Dead exports removed | 9 (vanished automatically — no caller to update) |
| Production callers migrated | 4 |
| Test callers migrated | 5 (3 listed in the decision + 2 discovered during validation) |

---

## 2. Files Changed

| File | Change Type | Purpose |
|------|-------------|---------|
| `services/admin/systemAdminService.ts` | **Deleted** | Facade barrel removed entirely. |
| `pages/admin/Tenants.tsx` | Modified | 1 facade import (6 functions) split into 4 canonical imports: `tenantService`, `tenantBackupService`, `tenantRestoreService`, `tenantMigrationService`. |
| `pages/admin/AdminDashboardInner.tsx` | Modified | 1 facade import (1 type + 10 functions) split into 3 canonical imports: `systemAdminService`, `operationsService`, `tenantService`. |
| `pages/admin/Security.tsx` | Modified | 1 facade import (2 types + 5 functions) redirected to canonical `systemAdminService` (path change only, single module). |
| `components/admin/SecuritySettingsPanel.tsx` | Modified | 1 facade import (2 types + 5 functions) redirected to canonical `systemAdminService` (path change only, single module). |
| `tests/services/systemAdminService.security.test.ts` | Modified | 4 function imports redirected to canonical `services/systemAdminService` (path change only). |
| `tests/admin-dashboard/SecuritySettingsPanel.test.tsx` | Modified | Type imports + `vi.mock` retargeted from `../../services/admin/systemAdminService` to `../../services/systemAdminService`. |
| `tests/admin-dashboard/Security.test.tsx` | Modified | Type imports + `vi.mock` retargeted from `../../services/admin/systemAdminService` to `../../services/systemAdminService`. |
| `tests/admin-dashboard/Tenants.test.tsx` | Modified | Single `vi.mock` of the facade (4 functions) split into 4 canonical `vi.mock` calls: `tenantService`, `tenantBackupService`, `tenantRestoreService`, `tenantMigrationService`. |
| `tests/admin-dashboard/AdminDashboardInner.test.tsx` | Modified | `vi.mock` of the facade (`getSystemOverview`) retargeted to canonical `../../services/tenantService`. |
| `CURRENT_TASK-011_FACADE_BARREL_ARCHITECTURE_DECISION.md` | Modified | Status updated from `Proposed — Pending Program Manager Decision` to `Approved — Implemented`. |

---

## 3. Caller Migration Detail

### 3.1 Production Callers

#### `pages/admin/Tenants.tsx`

| Before | After |
|---|---|
| `import { startImpersonation, downloadTenantBackup, restoreTenantBackup, previewBackupTables, validateBackup, resetDemoData } from '../../services/admin/systemAdminService';` | `import { startImpersonation } from '../../services/tenantService';`<br>`import { downloadTenantBackup } from '../../services/tenantBackupService';`<br>`import { restoreTenantBackup, previewBackupTables, validateBackup } from '../../services/tenantRestoreService';`<br>`import { resetDemoData } from '../../services/tenantMigrationService';` |

#### `pages/admin/AdminDashboardInner.tsx`

| Before | After |
|---|---|
| `import { SystemAdmin, getSystemAdmins, addSystemAdmin, removeSystemAdmin, createSystemAdmin, getSystemOverview, getDataRetentionStatus, getDefaultPlanLimits, setDefaultPlanLimits, getMaintenanceMode, setMaintenanceMode } from '../../services/admin/systemAdminService';` | `import { SystemAdmin, getSystemAdmins, addSystemAdmin, removeSystemAdmin, createSystemAdmin } from '../../services/systemAdminService';`<br>`import { getDataRetentionStatus, getDefaultPlanLimits, setDefaultPlanLimits, getMaintenanceMode, setMaintenanceMode } from '../../services/operationsService';`<br>`import { getSystemOverview } from '../../services/tenantService';` |

#### `pages/admin/Security.tsx`

| Before | After |
|---|---|
| `from '../../services/admin/systemAdminService'` (2 types + 5 functions) | `from '../../services/systemAdminService'` (same 2 types + 5 functions, path change only) |

#### `components/admin/SecuritySettingsPanel.tsx`

| Before | After |
|---|---|
| `from '../../services/admin/systemAdminService'` (2 types + 5 functions) | `from '../../services/systemAdminService'` (same 2 types + 5 functions, path change only) |

### 3.2 Test Callers

#### `tests/services/systemAdminService.security.test.ts`

| Before | After |
|---|---|
| `from '../../services/admin/systemAdminService'` (4 functions) | `from '../../services/systemAdminService'` (path change only) |

#### `tests/admin-dashboard/SecuritySettingsPanel.test.tsx`

| Before | After |
|---|---|
| `import { SecuritySettings, LockedEmail } from '../../services/admin/systemAdminService'` | `import { SecuritySettings, LockedEmail } from '../../services/systemAdminService'` |
| `vi.mock('../../services/admin/systemAdminService', ...)` | `vi.mock('../../services/systemAdminService', ...)` |
| `vi.importActual<typeof import('../../services/admin/systemAdminService')>('../../services/admin/systemAdminService')` | `vi.importActual<typeof import('../../services/systemAdminService')>('../../services/systemAdminService')` |

#### `tests/admin-dashboard/Security.test.tsx`

| Before | After |
|---|---|
| `import { SecuritySettings, LockedEmail } from '../../services/admin/systemAdminService'` | `import { SecuritySettings, LockedEmail } from '../../services/systemAdminService'` |
| `vi.mock('../../services/admin/systemAdminService', ...)` | `vi.mock('../../services/systemAdminService', ...)` |
| `vi.importActual<typeof import('../../services/admin/systemAdminService')>('../../services/admin/systemAdminService')` | `vi.importActual<typeof import('../../services/systemAdminService')>('../../services/systemAdminService')` |

---

## 4. Discovery: Two Additional Test Callers

The Architecture Decision document (`CURRENT_TASK-011_FACADE_BARREL_ARCHITECTURE_DECISION.md` §1.3, §3.2) inventoried **7 callers** (4 production + 3 test). During the mandatory grep validation step, **2 additional test callers** were discovered that also referenced the deleted facade via `vi.mock`:

| Additional Caller | Mocked Symbol | Canonical Module | Disposition |
|---|---|---|---|
| `tests/admin-dashboard/Tenants.test.tsx` | `startImpersonation`, `downloadTenantBackup`, `restoreTenantBackup`, `resetDemoData` | `tenantService`, `tenantBackupService`, `tenantRestoreService`, `tenantMigrationService` | Single `vi.mock` split into 4 canonical `vi.mock` calls |
| `tests/admin-dashboard/AdminDashboardInner.test.tsx` | `getSystemOverview` | `tenantService` | `vi.mock` retargeted to `../../services/tenantService` |

Both were retargeted to their canonical modules. Leaving them pointing at the deleted facade would have caused silently no-oping mocks (false-green risk), exactly as warned in §5.4 of the Architecture Decision. The grep validation (`services/admin/systemAdminService` across `*.{ts,tsx,js,jsx}`) now returns zero source-file matches.

---

## 5. Validation Results

| Validation | Command | Result |
|------------|---------|--------|
| TypeScript compile | `npx tsc --noEmit` | **PASS** — exit code 0, no errors |
| RPC contract audit | `npm run audit:rpc` | **PASS** — 125 contract RPCs ↔ 125 code RPCs in sync |
| Affected tests | `npx vitest run` (5 affected test files) | **PASS** — 23/23 tests passed, 5 files |
| Zero stale facade imports | `grep` for `services/admin/systemAdminService` across `*.{ts,tsx,js,jsx}` | **PASS** — no source-file matches (only `.md` documentation references remain, which are historical records) |

Evidence:

```text
> npx tsc --noEmit
(exited 0)

> npm run audit:rpc
Contract RPCs : 125
Code RPCs     : 125
RPC contracts and service code are in sync.

> npx vitest run tests/services/systemAdminService.security.test.ts tests/admin-dashboard/SecuritySettingsPanel.test.tsx tests/admin-dashboard/Security.test.tsx tests/admin-dashboard/Tenants.test.tsx tests/admin-dashboard/AdminDashboardInner.test.tsx
✓ tests/services/systemAdminService.security.test.ts (5 tests)
✓ tests/admin-dashboard/Security.test.tsx (2 tests)
✓ tests/admin-dashboard/SecuritySettingsPanel.test.tsx (9 tests)
✓ tests/admin-dashboard/Tenants.test.tsx (4 tests)
✓ tests/admin-dashboard/AdminDashboardInner.test.tsx (3 tests)
Test Files 5 passed (5)
Tests       23 passed (23)
```

The `recharts` width/height warnings on stderr during `AdminDashboardInner.test.tsx` are pre-existing and unrelated to this task (documented in commit `6dd3c65a`).

---

## 6. Scope Compliance

| Constraint | Status |
|---|---|
| No new RPC created | **Confirmed** — no RPC added |
| No RPC modified | **Confirmed** — no RPC changed |
| No migration | **Confirmed** — no migration touched |
| No schema change | **Confirmed** — no schema touched |
| No generated-type change | **Confirmed** — no generated types touched |
| No business logic change | **Confirmed** — only import paths and mock targets changed |
| No new facade | **Confirmed** — facade deleted, not replaced |
| No new alias | **Confirmed** — all imports use canonical same-name symbols |

The 6 canonical modules (`systemAdminService.ts`, `operationsService.ts`, `tenantBackupService.ts`, `tenantRestoreService.ts`, `tenantMigrationService.ts`, `tenantService.ts`) are unchanged.

---

## 7. Remaining Phase 3 Gaps

| Gap | Item | Status | Reason |
|-----|------|--------|--------|
| G1 | `admin_update_subscription` / `updateSubscriptionLimits` | **CLOSED** (CURRENT_TASK-006) | Canonical RPC extended with `p_max_storage_gb`. |
| G2 | `get_member_with_email` / `getMemberWithEmail` | **CLOSED** (CURRENT_TASK-007) | Service now calls canonical `get_tenant_members_with_email`. |
| G3 | `search_members_by_email` / `searchMembers` | **CLOSED** (CURRENT_TASK-007) | Service now calls canonical `search_tenant_members`. |
| G4 | `get_storage_usage` / `getStorageUsage`, `getTenantStorageUsage` | **CLOSED** (CURRENT_TASK-008) | Service now calls canonical `get_tenant_storage_usage`; dead wrapper removed. |
| G5 | `getUsageSummary` / `getTenantUsageSummary` wrapper duplication | **CLOSED** (CURRENT_TASK-009) | Duplicate `getTenantUsageSummary` removed; `getUsageSummary` is the canonical service API. |
| G6 | Four documented aliases | **CLOSED** (CURRENT_TASK-010) | All aliases removed; callers migrated to canonical names. |
| A4 | `services/admin/systemAdminService.ts` facade barrel | **CLOSED** (this task) | Facade deleted; all callers migrated to canonical modules. |

With A4 closed, all identified Phase 3 gaps (G1–G6, A4) are resolved. Phase 3 EC-5 ("Alias patterns that create shadow contracts are documented or removed") is unambiguously satisfied: the facade barrel that created a shadow import path is gone, and no alias or shadow-contract surface remains.

---

## 8. Evidence

- Changed files (this task only):
  - `services/admin/systemAdminService.ts` (deleted)
  - `pages/admin/Tenants.tsx`
  - `pages/admin/AdminDashboardInner.tsx`
  - `pages/admin/Security.tsx`
  - `components/admin/SecuritySettingsPanel.tsx`
  - `tests/services/systemAdminService.security.test.ts`
  - `tests/admin-dashboard/SecuritySettingsPanel.test.tsx`
  - `tests/admin-dashboard/Security.test.tsx`
  - `tests/admin-dashboard/Tenants.test.tsx`
  - `tests/admin-dashboard/AdminDashboardInner.test.tsx`
  - `CURRENT_TASK-011_FACADE_BARREL_ARCHITECTURE_DECISION.md`
- Validation logs: TypeScript `tsc --noEmit` exit code 0; `npm run audit:rpc` reports 125/125 RPCs in sync; affected tests 23/23 passed; grep for `services/admin/systemAdminService` across source files returns zero matches.

---

## 9. Conclusion

CURRENT_TASK-011 is complete.

- A4 = CLOSED
- The `services/admin/systemAdminService.ts` facade barrel is deleted.
- All production callers, test callers, and `vi.mock` targets have been migrated to their respective canonical modules.
- 9 dead exports vanished automatically with the facade.
- TypeScript compile, RPC audit, and all affected tests pass.
- No migration, schema, generated-type, canonical RPC, or business-logic change was introduced.

**Implementation: PASS**  
**Validation: PASS**

Phase 3 Exit Validation is not started. Awaiting Program Manager review.
