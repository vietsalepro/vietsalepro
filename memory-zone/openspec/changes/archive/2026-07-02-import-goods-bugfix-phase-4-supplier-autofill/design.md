## Context

After Phase 1, `localSuppliers` is populated from the server. The `handleCreateSupplier` path, however, may still inspect the `suppliers` prop to pick the next code. After Phase 3, the cost base is `totalGoodsAfterLineDiscount`, but `paidAmount` auto-fill might still be wired to `totalImportCost`. This phase aligns both the supplier code and the auto-fill logic with the new data sources.

## Goals / Non-Goals

**Goals:**
- Generate supplier codes from the server-side supplier list, avoiding duplicates when the prop is empty.
- Update `localSuppliers` and `supplierCache` immediately after a new supplier is created.
- Auto-fill `paidAmount` with the correct `needToPay` based on `totalGoodsAfterLineDiscount`.

**Non-Goals:**
- Changing the supplier code format.
- Changing the routing or cost backend logic.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Fetch all suppliers before generating code | Guarantees the next code is unique relative to the DB | Trust `localSuppliers` only; risk of stale data |
| Add new supplier to local state and cache | Avoids an extra fetch after creation | Refetch the entire list after creation |
| Keep `onAddSupplier` as a side-effect | Parent `App.tsx` may need to know, but we do not depend on it | Remove the prop entirely |
| Remove old `totalImportCost` references | Prevents accidental use of wrong total | Leave them guarded behind a flag |

## Risks / Trade-offs

- **Medium** — Race condition if two users create a supplier simultaneously. → Mitigation: use a unique constraint in DB and let the server reject duplicates; handle error in UI.
- **Low** — If `TotalsSection` has its own `useEffect` that auto-fills `paidAmount`, the two effects may conflict. → Audit all `useEffect` that write `paidAmount` and consolidate them.

## Migration / Rollback

- How to deploy: update `handleCreateSupplier`, remove old total references, and verify the auto-fill behavior.
- How to undo: restore `pages/ImportGoods.tsx` from backup.

## Open Questions

- Is `supabaseService.getSuppliers()` already implemented from Phase 1? If not, add it here.
- Does `TotalsSection` already implement the auto-fill, or does `ImportGoods` need to pass a different prop?
