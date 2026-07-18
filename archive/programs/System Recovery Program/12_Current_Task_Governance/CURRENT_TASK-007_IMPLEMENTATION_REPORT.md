# CURRENT_TASK-007 — Implementation Report (G2 + G3)

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 3 — RPC Contract Reconciliation  
**Task:** G2 + G3 — Member Lookup Canonical Naming Alignment  
**Date:** 2026-07-14  
**Status:** COMPLETE

---

## 1. Executive Summary

Closed G2 and G3 by aligning the member-lookup service-layer RPC calls with the canonical migration contract.

- **G2** — `services/tenantService.ts:getMemberWithEmail` no longer calls the non-canonical `get_member_with_email`; it now calls the canonical `get_tenant_members_with_email`.
- **G3** — `services/tenantService.ts:searchMembers` no longer calls the non-canonical `search_members_by_email`; it now calls the canonical `search_tenant_members` with the correct parameter mapping.

No new RPC was created. Schema, generated types, service function signatures, and return contracts remain unchanged. `docs/admin-dashboard/RPC_CONTRACTS.md` was updated to reflect the canonical surface and remove the stale RPC rows.

No work was performed on G4, G5, G6, or Phase 4.

---

## 2. Files Changed

| File | Change Type | Purpose |
|------|-------------|---------|
| `services/tenantService.ts` | Modified | Aligned `getMemberWithEmail` and `searchMembers` RPC calls to canonical names and signatures. |
| `docs/admin-dashboard/RPC_CONTRACTS.md` | Modified | Removed stale `get_member_with_email` and `search_members_by_email` rows; updated `search_tenant_members` parameter list in the contract table and auto-generated appendix. |

---

## 3. Canonical Naming Alignment

| Gap | Service Function | Before (non-canonical RPC) | After (canonical RPC) | Status |
|-----|------------------|---------------------------|---------------------|--------|
| G2 | `getMemberWithEmail(tenantId, userId)` | `get_member_with_email` | `get_tenant_members_with_email` | **CLOSED** |
| G3 | `searchMembers(params)` | `search_members_by_email` | `search_tenant_members` | **CLOSED** |

The canonical RPCs are defined in `supabase/schema.sql` and `supabase/generated/database.types.ts`:

- `public.get_tenant_members_with_email(p_tenant_id UUID) RETURNS json`
- `public.search_tenant_members(p_tenant_id, p_search, p_role, p_status, p_is_active, p_sort_by, p_sort_dir, p_page, p_page_size) RETURNS json`

---

## 4. Service Changes

### 4.1 `services/tenantService.ts:getMemberWithEmail` (G2)

**RPC name:** `get_member_with_email` → `get_tenant_members_with_email`

The canonical function returns the full tenant member list (`MemberWithEmail[]` shape). The service function preserves its original single-member contract (`Promise<MemberWithEmail | null>`) by filtering the returned array for the requested `userId` before mapping.

```typescript
export async function getMemberWithEmail(tenantId: string, userId: string): Promise<MemberWithEmail | null> {
  // ponytail: canonical get_tenant_members_with_email returns the full tenant member list;
  // filter client-side to preserve the single-member contract without adding a one-off RPC.
  const { data, error } = await supabase.rpc('get_tenant_members_with_email', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  if (!data) return null;
  const row = (data as any[]).find((m: any) => m.user_id === userId);
  if (!row) return null;
  return { ...mapMembershipFromDB(row), email: row.email, ... };
}
```

### 4.2 `services/tenantService.ts:searchMembers` (G3)

**RPC name:** `search_members_by_email` → `search_tenant_members`

**Parameter mapping update:**

| Old param (`search_members_by_email`) | New param (`search_tenant_members`) | Source |
|---------------------------------------|-------------------------------------|--------|
| `p_query` | `p_search` | `params.search ?? null` |
| `p_page` | `p_page` | `params.page ?? 1` |
| `p_limit` | `p_page_size` | `params.pageSize ?? 20` |
| `p_role_filter` | `p_role` | `params.role ?? null` |
| `p_status_filter` | `p_status` | `params.status ?? null` |
| — | `p_is_active` | `params.isActive ?? null` |
| — | `p_sort_by` | `params.sortBy ?? 'created_at'` |
| — | `p_sort_dir` | `params.sortDir ?? 'desc'` |

**Result mapping update:** canonical payload uses `items` and `total_count`:

```typescript
return {
  members: (data?.items ?? []).map(mapMembershipFromDB),
  totalCount: data?.total_count ?? 0,
};
```

---

## 5. Documentation Changes

`docs/admin-dashboard/RPC_CONTRACTS.md`:

- Removed rows for `get_member_with_email` and `search_members_by_email` from the contract table.
- Updated `search_tenant_members` parameter list to include `p_is_active`, `p_sort_by`, and `p_sort_dir`.
- Removed `get_member_with_email` and `search_members_by_email` from the alphabetical auto-generated appendix.

Historical Phase 3 deliverables (`D-P3-01` through `D-P3-04`) were left unchanged as baseline evidence of the pre-implementation state.

---

## 6. Validation Results

| Validation | Command | Result |
|------------|---------|--------|
| TypeScript compile | `npm run lint` (`tsc --noEmit`) | **PASS** |
| RPC contract audit | `npm run audit:rpc` | **PASS** — 125 contract RPCs ↔ 125 code RPCs |
| No stale RPC names in production service | `grep` across `services/` for `get_member_with_email` and `search_members_by_email` | **PASS** — no matches |

Evidence:

```text
> npm run lint
> tsc --noEmit
(exited 0)

> npm run audit:rpc
Contract RPCs : 125
Code RPCs     : 125
RPC contracts and service code are in sync.
```

---

## 7. Backward Compatibility Assessment

- **Service function signatures:** unchanged. `getMemberWithEmail(tenantId, userId)` and `searchMembers(params)` keep the same inputs and return types.
- **RPC boundary:** changed to canonical names. Any external system calling the old RPC names directly would now hit undefined functions, but the old names were already non-canonical and absent from migrations.
- **Behavior:**
  - G3 result mapping is equivalent (`items` → `members`, `total_count` → `totalCount`).
  - G2 adds client-side filtering because the canonical RPC returns all members. The service function still returns a single member or `null`, so callers observe no contract change. This is a minor data-transfer trade-off to avoid creating a one-off non-canonical RPC.
- **Generated types / schema:** not touched.

---

## 8. Remaining Phase 3 Gaps

| Gap | Item | Status | Reason |
|-----|------|--------|--------|
| G1 | `admin_update_subscription` / `updateSubscriptionLimits` | **CLOSED** (CURRENT_TASK-006) | Canonical `update_tenant_subscription` extended with `p_max_storage_gb`. |
| G2 | `get_member_with_email` / `getMemberWithEmail` | **CLOSED** (this task) | Now calls canonical `get_tenant_members_with_email`. |
| G3 | `search_members_by_email` / `searchMembers` | **CLOSED** (this task) | Now calls canonical `search_tenant_members`. |
| G4 | `get_storage_usage` / `getStorageUsage`, `getTenantStorageUsage` | **OPEN** | No canonical equivalent identified; out of scope for this task. |
| G5 | `getUsageSummary` / `getTenantUsageSummary` wrapper duplication | **OPEN** | Out of scope for this task. |
| G6 | Four documented aliases and `services/admin/systemAdminService.ts` facade barrel | **OPEN** | Out of scope for this task. |

Phase 3 exit criteria remain partially unmet until G4, G5, and G6 are addressed and formal acceptance is recorded.

---

## 9. Evidence

- Commit: `1a9a60f5`
- Changed files: `services/tenantService.ts`, `docs/admin-dashboard/RPC_CONTRACTS.md`
- Canonical schema source: `supabase/schema.sql` lines **9294–9328** and **29583–29650**
- Generated types: `supabase/generated/database.types.ts` lines **5553–5556** and **6048–6061**
- Validation logs: TypeScript `tsc --noEmit` exit code 0; `npm run audit:rpc` reports 125/125 RPCs in sync.

---

## 10. Conclusion

CURRENT_TASK-007 is complete.

- G2 = CLOSED
- G3 = CLOSED
- No naming drift remains for member lookup/search between the service layer and the canonical migration contract.
- No new RPC was created.
- No schema or generated-type changes were made.
- TypeScript compile and RPC audit both pass.

**CURRENT_TASK-007 = PASS**

G4, G5, and G6 remain open. Awaiting Program Manager review before proceeding to G4.
