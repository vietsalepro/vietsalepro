## Context

`pages/ImportGoods.tsx` is a ~1,488 line component that currently expects `products`, `suppliers`, and `importReceipts` props. The parent `App.tsx` passes these props but they can be empty, causing the create tab and history tab to fail in different ways. Existing caches (`supplierCache`, `productCache`) are already present from prior work, so the new server-side fetch should merge into them rather than replace them.

## Goals / Non-Goals

**Goals:**
- Make `ImportGoods` able to render the history tab and create tab correctly even when `suppliers`/`products`/`importReceipts` props are empty arrays.
- Provide loading and error states for supplier and product fetches to avoid UI freeze.
- Keep all existing business logic intact; only change data sources.

**Non-Goals:**
- Changing the routing or URL structure.
- Changing cost/discount calculations.
- Adding new validation rules.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Fetch full supplier list on mount and merge into `supplierCache` | Supplier list is small enough to load once; avoids repeated per-search queries | Fetch suppliers lazily when opening dropdown |
| Debounce product search with `useDebounce(searchTerm, 300)` | Prevents server spam while typing; pattern already used elsewhere | Throttle or server-side search on every keystroke |
| Use request-id tracking for product search | Prevents stale dropdown results from slow network | Ignore race condition |
| Compute stats from `receiptList` + `totalReceiptCount` | Keeps stats consistent with current page of data; can be replaced by RPC later | Always compute from full `importReceipts` prop |

## Risks / Trade-offs

- **High** — If supplier fetch fails, the create form cannot select a supplier and submit fails. → Show loading/error UI and retry button.
- **Medium** — Missing one remaining `products.find(...)` or `suppliers.find(...)` call on empty prop causes a crash. → Static search + manual review of every `.find(...)` and `.reduce(...)` in `ImportGoods.tsx`.
- **Medium** — Stale product search results if network responses arrive out of order. → Abort or skip results with outdated request id.

## Migration / Rollback

- How to deploy: merge the PR, verify `npm run lint` + `npm run build`, and run a manual smoke test on `/import` and `/import/create` (URL still `/import` until Phase 2).
- How to undo: restore `pages/ImportGoods.tsx` and any added service functions from the pre-phase backup.

## Open Questions

- Does `supabaseService.ts` already expose `getSuppliers`, `searchProducts`, and `getImportStats`, or must they be added? If missing, add them during Phase 1a/b.
