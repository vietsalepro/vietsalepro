## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_3_2_20260704_181433`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 3.2: Inventory & stock tables

- [x] 1.1 Run SQL migration to add `tenant_id` column, FK, and index for tables: `import_receipts`, `import_items`, `inventory_counts`, `inventory_count_items`, `inventory_movements`, `disposals`, `disposal_items`, `product_lots`, `stock_movements`, `return_orders`, `return_order_items`, `supplier_exchanges`, `supplier_exchange_return_items`, `supplier_exchange_received_items`
- [x] 1.2 Thêm `tenant_id` vào interface của 13 bảng trong `types.ts`.

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] Các bảng inventory đã có cột `tenant_id` và FK.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_3_2_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.