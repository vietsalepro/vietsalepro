# CURRENT_TASK-009 — Implementation Report (G5)

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Task:** G5 — Usage Summary Service Boundary Cleanup  
**Date:** 2026-07-14  
**Status:** COMPLETE

---

## 1. Executive Summary

Closed G5 by removing the duplicate `getTenantUsageSummary` wrapper and establishing `getUsageSummary(tenantId)` as the single canonical service API for the tenant usage-summary capability.

- `services/tenantService.ts:getTenantUsageSummary()` was removed.
- `services/admin/tenantAdminService.ts` no longer re-exports `getTenantUsageSummary`.
- The three affected smoke tests now import and call `getUsageSummary`.
- `getUsageSummary(tenantId)` and the canonical RPC `public.get_tenant_usage_summary(p_tenant_id UUID)` remain unchanged.

No schema change, migration change, generated-type change, or canonical RPC change was introduced. G6 and the `services/admin/systemAdminService.ts` facade barrel were not touched.

---

## 2. Files Changed

| File | Change Type | Purpose |
|------|-------------|---------|
| `services/tenantService.ts` | Modified | Removed duplicate `getTenantUsageSummary` wrapper; `getUsageSummary` is the canonical service API. |
| `services/admin/tenantAdminService.ts` | Modified | Removed `getTenantUsageSummary` from the re-export block. |
| `tests/smoke/admin-dashboard-p2-subscription-usage.test.ts` | Modified | Renamed imports and calls from `getTenantUsageSummary` to `getUsageSummary`. |
| `tests/smoke/admin-dashboard-p6-operations-support.test.ts` | Modified | Renamed imports and calls from `getTenantUsageSummary` to `getUsageSummary`. |
| `tests/smoke/admin-dashboard-p8-1-plan-builder-schema.test.ts` | Modified | Renamed imports and calls from `getTenantUsageSummary` to `getUsageSummary`. |
| `CURRENT_TASK-009_USAGE_SUMMARY_CANONICAL_BOUNDARY_DECISION.md` | Modified | Status updated from `Proposed` to `Approved — Implemented`. |

---

## 3. Service Boundary Cleanup

### 3.1 Canonical Service API

| Function | Location | RPC Called | Status |
|----------|----------|------------|--------|
| `getUsageSummary(tenantId: string): Promise<UsageSummary>` | `services/tenantService.ts:469–475` | `public.get_tenant_usage_summary({ p_tenant_id: tenantId })` | **CANONICAL** |
| `getTenantUsageSummary(tenantId: string): Promise<UsageSummary>` | `services/tenantService.ts` | same as above | **REMOVED** |

The two wrappers were byte-identical. Removing the duplicate reduces the service contract surface without affecting behavior.

### 3.2 Admin Service Re-Export

`services/admin/tenantAdminService.ts` previously re-exported `getTenantUsageSummary` from `services/tenantService.ts`. That symbol has been removed from the re-export block; all other exports remain unchanged.

---

## 4. Verification Assets Updated

| Test File | Import / Call Site Change |
|-----------|---------------------------|
| `tests/smoke/admin-dashboard-p2-subscription-usage.test.ts` | Import line 16 and call lines 44, 58, 103 changed to `getUsageSummary`. |
| `tests/smoke/admin-dashboard-p6-operations-support.test.ts` | Import line 22 and call line 109 changed to `getUsageSummary`. |
| `tests/smoke/admin-dashboard-p8-1-plan-builder-schema.test.ts` | Import line 20 and call lines 118, 133 changed to `getUsageSummary`. |

No test logic or assertions were changed.

---

## 5. Documentation Changes

- `CURRENT_TASK-009_USAGE_SUMMARY_CANONICAL_BOUNDARY_DECISION.md`: status updated from `Proposed — Pending Architecture Authority / Program Manager Decision` to `Approved — Implemented`.
- `docs/admin-dashboard/RPC_CONTRACTS.md` did not require changes; it documents RPC contracts, not service-layer wrapper names, and already references the canonical `get_tenant_usage_summary` RPC.
- Historical Phase 3 deliverables (`D-P3-01` through `D-P3-04`, `PHASE3_ACCEPTANCE_REVIEW.md`, prior `CURRENT_TASK` reports) were intentionally left unchanged as baseline evidence of the pre-implementation state.

---

## 6. Validation Results

| Validation | Command | Result |
|------------|---------|--------|
| TypeScript compile | `npm run lint` (`tsc --noEmit`) | **PASS** |
| RPC contract audit | `npm run audit:rpc` | **PASS** — 125 contract RPCs ↔ 125 code RPCs |
| Affected smoke tests | `npx vitest run tests/smoke/admin-dashboard-p2-subscription-usage.test.ts tests/smoke/admin-dashboard-p6-operations-support.test.ts tests/smoke/admin-dashboard-p8-1-plan-builder-schema.test.ts` | **PASS** — 20/20 tests passed |
| Zero stale wrapper in production source | `grep` across `services/`, `components/`, `pages/`, `utils/`, `lib/`, `hooks/`, `scripts/` for `getTenantUsageSummary` | **PASS** — no matches |
| Verification assets synchronized | `grep` across `tests/` for `getTenantUsageSummary` | **PASS** — no matches; all references now use `getUsageSummary` |

Evidence:

```text
> npm run lint
> tsc --noEmit
(exited 0)

> npm run audit:rpc
Contract RPCs : 125
Code RPCs     : 125
RPC contracts and service code are in sync.

> npx vitest run tests/smoke/admin-dashboard-p2-subscription-usage.test.ts tests/smoke/admin-dashboard-p6-operations-support.test.ts tests/smoke/admin-dashboard-p8-1-plan-builder-schema.test.ts
✓ tests/smoke/admin-dashboard-p2-subscription-usage.test.ts (6 tests)
✓ tests/smoke/admin-dashboard-p8-1-plan-builder-schema.test.ts (7 tests)
✓ tests/smoke/admin-dashboard-p6-operations-support.test.ts (7 tests)
Test Files 3 passed (3)
Tests 20 passed (20)
```

---

## 7. Remaining Phase 3 Gaps

| Gap | Item | Status | Reason |
|-----|------|--------|--------|
| G1 | `admin_update_subscription` / `updateSubscriptionLimits` | **CLOSED** (CURRENT_TASK-006) | Canonical RPC extended with `p_max_storage_gb`. |
| G2 | `get_member_with_email` / `getMemberWithEmail` | **CLOSED** (CURRENT_TASK-007) | Service now calls canonical `get_tenant_members_with_email`. |
| G3 | `search_members_by_email` / `searchMembers` | **CLOSED** (CURRENT_TASK-007) | Service now calls canonical `search_tenant_members`. |
| G4 | `get_storage_usage` / `getStorageUsage`, `getTenantStorageUsage` | **CLOSED** (CURRENT_TASK-008) | Service now calls canonical `get_tenant_storage_usage`; dead wrapper removed. |
| G5 | `getUsageSummary` / `getTenantUsageSummary` wrapper duplication | **CLOSED** (this task) | Duplicate `getTenantUsageSummary` removed; `getUsageSummary` is the canonical service API. |
| G6 | Four documented aliases (`getTenantById`, `getTenantMembers`, `checkSubdomain`, `restoreTenantStatus`) | **OPEN** | Out of scope for this task. |
| A4 | `services/admin/systemAdminService.ts` facade barrel | **OPEN** | Out of scope for this task. |

Phase 3 EC-4 is partially satisfied: the G5 duplicate-wrapper portion is resolved, but the G6/A4 alias and facade-barrel portions remain. Phase 3 exit criteria are therefore not fully satisfied until G6 and A4 are addressed.

---

## 8. Evidence

- Commit: `fa0234d3`
- Changed files:
  - `services/tenantService.ts`
  - `services/admin/tenantAdminService.ts`
  - `tests/smoke/admin-dashboard-p2-subscription-usage.test.ts`
  - `tests/smoke/admin-dashboard-p6-operations-support.test.ts`
  - `tests/smoke/admin-dashboard-p8-1-plan-builder-schema.test.ts`
  - `CURRENT_TASK-009_USAGE_SUMMARY_CANONICAL_BOUNDARY_DECISION.md`
- Canonical RPC source: `supabase/schema.sql` (latest effective migration `20260712000010_fix_get_tenant_usage_summary_tenant_admin.sql`)
- Validation logs: TypeScript `tsc --noEmit` exit code 0; `npm run audit:rpc` reports 125/125 RPCs in sync; affected smoke tests 20/20 passed.

---

## 9. Conclusion

CURRENT_TASK-009 is complete.

- G5 = CLOSED
- No production caller is affected.
- No non-canonical or duplicate usage-summary wrapper remains in the production service layer.
- TypeScript compile, RPC audit, and all affected smoke tests pass.

**CURRENT_TASK-009 = PASS**

G6 and the A4 facade-barrel question remain open. Awaiting Program Manager review before proceeding to the next Phase 3 task.
