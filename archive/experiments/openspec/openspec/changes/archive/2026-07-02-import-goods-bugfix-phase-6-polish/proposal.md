## Why

Users currently see generic or no error messages when a delete fails because the receipt has already been sold or a lot is out of stock. Stats cards also lag behind after create/delete operations. This phase surfaces clear, actionable delete error messages and refreshes stats after every CRUD action.

## What Changes

- In `App.tsx` `handleDeleteImport`, parse the RPC error message and map to user-friendly text:
  - "đã bán vượt quá số lượng nhập" → show the product name and reason.
  - "lô ... không đủ tồn kho" → show the lot name and product name.
  - Other errors → show the original message.
- In `pages/ImportGoods.tsx` `handleDeleteClick`, await `onDeleteImport` before calling `fetchReceipts`.
- After `submitReceipt` and `handleDeleteClick`, call `fetchStats` to refresh stat cards.
- Verify `product_lots.original_quantity` behavior is consistent (insert as `v_item.quantity`, delete removes lot when reaching zero; no extra change needed for duplicate lots).

## Scope / Non-Goals

**In scope:**
- Single sub-phase 6 as defined in `docs/plans/import-goods-bugfix/PLAN_REFINED.md`.
- Delete error messages, stats refresh, and `product_lots.original_quantity` sanity check.

**Out of scope:**
- Routing (Phase 2).
- Cost backend (Phase 3).
- Validation (Phase 5).

## Capabilities

### New Capabilities
- `phase-6-polish`: Delete failures show actionable messages naming the product/lot and the cause.
- `phase-6-polish`: Stats cards refresh automatically after create/delete.

### Modified Capabilities
- `delete-import`: Error mapping from RPC to UI message.
- `import-goods`: Stats refresh after submit and delete.

## Impact

- Affected files: `App.tsx`, `pages/ImportGoods.tsx`, `archive/migration_phase6_import_delete_messages.sql` (only if backend message text is changed).
- Dead code: synchronous `fetchReceipts` after delete (replace with await + refetch).
- Verification: `npm run lint`, `npm run build`, manual delete-failure test, stats refresh test.

## Rollback

Restore `App.tsx` and `pages/ImportGoods.tsx` from the pre-phase backup. Expanded in `rollback.md`.
