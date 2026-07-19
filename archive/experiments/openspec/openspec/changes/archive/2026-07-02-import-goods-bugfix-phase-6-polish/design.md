## Context

After the previous phases, the form, routing, cost, supplier creation, and validation are correct. The remaining polish issues are: delete errors are swallowed, stats cards are stale after CRUD, and the `product_lots.original_quantity` behavior needs to be confirmed as acceptable.

## Goals / Non-Goals

**Goals:**
- Show clear, actionable delete error messages.
- Refresh stats after create and delete.
- Confirm `product_lots.original_quantity` behavior is consistent.

**Non-Goals:**
- Adding new business logic for lot handling.
- Changing the core cost or validation rules.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Parse RPC message strings in `handleDeleteImport` | Backend already emits specific messages; minimal change | Change backend to return structured error codes |
| Await `onDeleteImport` before `fetchReceipts` | Prevents refetch from seeing old state | Keep synchronous call and rely on eventual consistency |
| Call `fetchStats` after submit/delete | Reuses existing stat fetch logic | Inline stat recalculation |
| Leave `product_lots.original_quantity` unchanged | Current behavior is acceptable as a snapshot | Add versioning or summing logic |

## Risks / Trade-offs

- **Low** — Message parsing may fail if backend wording changes. → Keep a fallback to the original message.
- **Low** — Stats refresh adds one extra query after each CRUD. → Acceptable given the existing `fetchReceipts` already refreshes partial data.

## Migration / Rollback

- How to deploy: add error mapping, await delete, refresh stats, run lint/build, test delete scenarios.
- How to undo: restore `App.tsx` and `pages/ImportGoods.tsx` from backup.

## Open Questions

- Does the backend emit the exact phrases "đã bán vượt quá số lượng nhập" and "lô ... không đủ tồn kho"? If wording differs, update the parser accordingly.
- Is `fetchStats` already implemented from Phase 1? If not, add it here.
