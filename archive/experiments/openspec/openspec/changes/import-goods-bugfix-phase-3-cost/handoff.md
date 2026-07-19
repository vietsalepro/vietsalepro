## What Was Done

- Created the backend migration SQL file separating original cost, line discount, and adjusted cost.
- Updated `process_import_v2` to store original cost in `import_items.cost` and adjusted cost in `products.cost` / `product_lots.cost` and stock ledger.
- Verified `delete_import_v2` reverses inventory valuation correctly.
- Updated `services/supabaseService.ts` and `types.ts` to pass/map cost and discount fields.
- Updated frontend display (`ImportItemRow`, `ImportItemsTable`, `TotalsSection`) to use `totalGoodsAfterLineDiscount`.
- Verified `npm run lint`, `npm run build`, and DB transaction tests.

## What Was Verified

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Database transaction test with rollback on `process_import_v2`
- [ ] Database transaction test with rollback on `delete_import_v2`
- [ ] Manual test: create receipt with line discount + shipping, verify DB values
- [ ] Manual test: delete receipt, verify inventory and cost revert

## Next Phase

- Start OpenSpec change: `import-goods-bugfix-phase-4-supplier-autofill`
- Next phase from PLAN_REFINED: Phase 4 — Sửa tạo mã NCC và auto-fill tiền trả

## Blockers / Decisions

- Database migration is the highest-risk step; ensure the DB backup was created before commit.
- If old `import_items.cost` rows cannot be backfilled to original cost, document this limitation in the migration comments.

## Backup Location

- Project: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_3_<YYYYMMDD_HHMMSS>`
- Database: separate DB dump/snapshot taken before migration
