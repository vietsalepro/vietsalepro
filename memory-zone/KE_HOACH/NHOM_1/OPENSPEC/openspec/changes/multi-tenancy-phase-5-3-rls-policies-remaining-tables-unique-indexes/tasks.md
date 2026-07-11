## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_5_3_20260705_073820`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 5.3: RLS policies — remaining tables + unique indexes

- [x] 1.1 Run SQL migration block(s) for this sub-phase
  - Migration: `supabase/migrations/20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql`
  - Note: schema đã chỉnh về đúng form kế hoạch — `products.sku`, `orders.order_code`, `einvoice_orders.invoice_number`.

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria
  - RLS: 32/32 business tables đã ENABLE ROW LEVEL SECURITY với tenant policies.
  - Unique: SKU, barcode, order_code, invoice_number đều unique per tenant.

## Acceptance Criteria

- [x] Tất cả bảng kinh doanh có RLS policies.
- [x] SKU/barcode/order_code/invoice_number unique theo tenant.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_5_3_deferred_20260705_083357`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.

## Handoff

- Đã hoàn thành. Không còn deferred work cho schema alignment.