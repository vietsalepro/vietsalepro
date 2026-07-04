## Context

After Phase 1/2, the frontend can fetch data and route correctly. The remaining cost bug is that `import_items.cost` previously stored the adjusted value (after discount and shipping) instead of the original input. Downstream tables (`products.cost`, `product_lots.cost`, stock ledger) need the adjusted value for inventory valuation, while the receipt line needs to remember the original cost for re-calculation and audit.

## Goals / Non-Goals

**Goals:**
- `import_items.cost` stores the original cost entered by the user.
- `import_items.discount` stores the line discount.
- `products.cost` and `product_lots.cost` store the adjusted cost after line discount and allocated shipping.
- Stock ledger unit cost reflects the adjusted cost.
- UI formulas remain unchanged: `lineTotal = max(0, qty * cost - discount)` and `needToPay = totalGoodsAfterLineDiscount + shipping - discountTotal`.

**Non-Goals:**
- Changing business rules for how discounts or shipping are calculated.
- Changing the receipt code or validation logic.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Store original cost in `import_items.cost` | Aligns the column name with user input; audit trail | Keep adjusted cost in `import_items.cost` and add `original_cost` column |
| Add optional `import_items.adjusted_cost` | Provides a persistent snapshot of the adjusted value for reporting | Compute adjusted cost on demand |
| Use `v_line_net = GREATEST(0, cost - discount)` | Prevents negative line net | Allow negative line net |
| Use `v_adjusted_cost = ROUND(v_line_net * (1 + shipping_factor), 2)` | Spreads shipping proportionally to line net | Distribute shipping by quantity or weight |
| Test migration with transaction rollback | Protects production data from incorrect valuation | Run directly on production without copy |

## Risks / Trade-offs

- **High** — Incorrect migration can corrupt `products.cost` and all profit/inventory reports. → Test on DB copy or use transaction + `ROLLBACK` first; verify create/delete/re-create cycle.
- **High** — `delete_import_v2` might subtract the wrong value if old rows stored adjusted cost. → Migration must backfill `import_items.cost` from original source if possible, or document that old rows are treated as adjusted until manually corrected.
- **Medium** — Frontend totals may disagree with DB if `totalGoodsAfterLineDiscount` is not used consistently. → Audit every place `totalImportCost` or `totalWithShipping` is referenced.

## Migration / Rollback

- How to deploy: run the SQL migration in a transaction first to verify, then commit; deploy frontend changes; run `npm run build`; verify DB values.
- How to undo: restore the database from backup, revert `services/supabaseService.ts`, `types.ts`, and frontend files.

## Open Questions

- Is there a DB copy available for the migration test, or must we use transaction + rollback?
- Does `supabaseService.ts` already pass `cost` and `discount` explicitly, or are they embedded in an items array?
