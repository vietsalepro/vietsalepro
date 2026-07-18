# CURRENT_TASK-008 — Implementation Report (G4)

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Task:** G4 — Storage Usage Service Alignment  
**Date:** 2026-07-14  
**Status:** COMPLETE

---

## 1. Executive Summary

Closed G4 by aligning the storage-usage service-layer RPC call with the canonical migration contract.

- `services/tenantService.ts:getTenantStorageUsage()` no longer calls the non-canonical `get_storage_usage`; it now calls the canonical `get_tenant_storage_usage`.
- `services/tenantService.ts:getStorageUsage(tenantId)` was removed because it had no production caller.
- `tests/mocks/supabase.ts` was synchronized by removing the unreachable `get_storage_usage` mock.
- `docs/admin-dashboard/RPC_CONTRACTS.md` was updated to remove the stale `get_storage_usage` row and confirm `get_tenant_storage_usage` as the canonical RPC.

No new RPC, migration, schema change, or generated-type change was introduced. The canonical contract for storage usage remains `public.get_tenant_storage_usage()`.

No work was performed on G5, G6, or Phase 4.

---

## 2. Files Changed

| File | Change Type | Purpose |
|------|-------------|---------|
| `services/tenantService.ts` | Modified | `getTenantStorageUsage()` now calls `get_tenant_storage_usage`; `getStorageUsage(tenantId)` removed. |
| `tests/mocks/supabase.ts` | Modified | Removed the unreachable `get_storage_usage` mock; retained `get_tenant_storage_usage` mock. |
| `docs/admin-dashboard/RPC_CONTRACTS.md` | Modified | Updated contract table and alphabetical appendix to reflect `get_tenant_storage_usage` as the canonical RPC. |

---

## 3. Service Alignment

| Service Function | Before (non-canonical RPC) | After (canonical RPC) | Status |
|------------------|---------------------------|---------------------|--------|
| `getTenantStorageUsage()` | `get_storage_usage` with `p_tenant_id: null` | `get_tenant_storage_usage` with no parameters | **CLOSED** |

The canonical RPC is defined in the canonical migration chain and reflected in generated types:

```text
public.get_tenant_storage_usage()
RETURNS JSON
```

```text
get_tenant_storage_usage: { Args: never; Returns: Json }
```

Source: `supabase/schema.sql` lines 24132–24215; `supabase/generated/database.types.ts` line 5568.

---

## 4. Dead Code Removal

| Removed Item | Reason | Evidence |
|--------------|--------|----------|
| `services/tenantService.ts:getStorageUsage(tenantId)` | No production caller; tenant-scoped storage report was not a confirmed business capability. | `grep` across `pages/`, `components/`, `services/`, and `tests/` found zero imports or calls of `getStorageUsage`. |
| `tests/mocks/supabase.ts:get_storage_usage` mock | Unreachable after the service layer stopped calling `get_storage_usage`. | Mock branch no longer matched by any service call. |

The only remaining references to `getStorageUsage` and `get_storage_usage` are in historical Phase 3 governance documents (`CURRENT_TASK-008` decision, `CURRENT_TASK-006/007` reports, `PHASE3_ACCEPTANCE_REVIEW.md`), which intentionally preserve the pre-implementation baseline.

---

## 5. Documentation Changes

`docs/admin-dashboard/RPC_CONTRACTS.md`:

- Replaced the stale `get_storage_usage` row in the main contract table with `get_tenant_storage_usage` (no parameters).
- Removed `get_storage_usage` from the alphabetical appendix.
- Inserted `get_tenant_storage_usage` into the alphabetical appendix at the correct position under `services/tenantService.ts`.

Historical Phase 3 deliverables (`D-P3-01` through `D-P3-04`, `PHASE3_ACCEPTANCE_REVIEW.md`) were left unchanged as baseline evidence of the pre-implementation state.

---

## 6. Validation Results

| Validation | Command | Result |
|------------|---------|--------|
| TypeScript compile | `npm run lint` (`tsc --noEmit`) | **PASS** |
| RPC contract audit | `npm run audit:rpc` | **PASS** — 125 contract RPCs ↔ 125 code RPCs |
| No stale RPC names in production service | `grep` across `services/`, `lib/`, `components/`, `tests/` for `get_storage_usage` and `getStorageUsage` | **PASS** — no matches in `.{ts,tsx,js,jsx}` files |
| Storage backup smoke test | `npx vitest run tests/smoke/admin-dashboard-p13-3-storage-backup.test.tsx` | **PASS** — 3/3 tests passed |

Evidence:

```text
> npm run lint
> tsc --noEmit
(exited 0)

> npm run audit:rpc
Contract RPCs : 125
Code RPCs     : 125
RPC contracts and service code are in sync.

> npx vitest run tests/smoke/admin-dashboard-p13-3-storage-backup.test.tsx
✓ tests/smoke/admin-dashboard-p13-3-storage-backup.test.tsx (3 tests)
Test Files 1 passed
Tests 3 passed
```

---

## 7. Backward Compatibility Assessment

- **Service function signature:** `getTenantStorageUsage()` keeps the same return type `Promise<StorageUsage>` and no parameters. Callers observe no change.
- **RPC boundary:** changed from the non-canonical `get_storage_usage` to the canonical `get_tenant_storage_usage`. The old RPC was already absent from the canonical migration chain, so it had no database support.
- **Generated types / schema:** not touched.
- **Migrations:** not touched.

---

## 8. Remaining Phase 3 Gaps

| Gap | Item | Status | Reason |
|-----|------|--------|--------|
| G1 | `admin_update_subscription` / `updateSubscriptionLimits` | **CLOSED** (CURRENT_TASK-006) | Canonical `update_tenant_subscription` extended with `p_max_storage_gb`. |
| G2 | `get_member_with_email` / `getMemberWithEmail` | **CLOSED** (CURRENT_TASK-007) | Now calls canonical `get_tenant_members_with_email`. |
| G3 | `search_members_by_email` / `searchMembers` | **CLOSED** (CURRENT_TASK-007) | Now calls canonical `search_tenant_members`. |
| G4 | `get_storage_usage` / `getStorageUsage`, `getTenantStorageUsage` | **CLOSED** (this task) | Service now calls canonical `get_tenant_storage_usage`; dead wrapper removed. |
| G5 | `getUsageSummary` / `getTenantUsageSummary` wrapper duplication | **OPEN** | Out of scope for this task. |
| G6 | Four documented aliases and `services/admin/systemAdminService.ts` facade barrel | **OPEN** | Out of scope for this task. |

Phase 3 exit criteria remain partially unmet until G5 and G6 are addressed and formal acceptance is recorded.

---

## 9. Evidence

- Commit: recorded in git history (`git log --oneline -- CURRENT_TASK-008_IMPLEMENTATION_REPORT.md`)
- Changed files: `services/tenantService.ts`, `tests/mocks/supabase.ts`, `docs/admin-dashboard/RPC_CONTRACTS.md`
- Canonical schema source: `supabase/schema.sql` lines 24132–24215
- Generated types: `supabase/generated/database.types.ts` line 5568
- Validation logs: TypeScript `tsc --noEmit` exit code 0; `npm run audit:rpc` reports 125/125 RPCs in sync; storage-backup smoke test 3/3 passed.

---

## 10. Conclusion

CURRENT_TASK-008 is complete.

- G4 = CLOSED
- No non-canonical storage-usage RPC call remains in the production service layer.
- No new canonical function was created.
- TypeScript compile, RPC audit, and the storage-backup smoke test all pass.

**CURRENT_TASK-008 = PASS**

G5 and G6 remain open. Awaiting Program Manager review before proceeding to the next Phase 3 task.
