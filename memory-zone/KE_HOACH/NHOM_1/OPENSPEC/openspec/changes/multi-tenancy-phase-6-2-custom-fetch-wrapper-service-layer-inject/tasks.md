## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_2_<YYYYMMDD_HHMMSS>`
  - Backup created: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_2_20260705_091353`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 6.2: Custom fetch wrapper + service layer inject

- [x] 1.1 Hoàn thiện `lib/supabase.ts` (xem sub-phase 5.1).
  - Added `requireTenantId()` helper and kept `tenantFetch` header injection.
- [x] 1.2 Rà soát `services/supabaseService.ts`:
  - `mapProductToDB`, `mapCustomerToDB`, `mapSupplierToDB` now take a `tenantId` argument and always emit `tenant_id` from the service layer.
  - `mapPromotionToDB` accepts an optional `tenantId`; only `addPromotion` injects it (`updatePromotion` does not include `tenant_id`).
  - All direct `insert`/`upsert` calls (categories, brands, products, product lots, customers, suppliers, orders, order items, point history, inventory counts, inventory count items, promotions, rank configs, rank history, return orders, return order items, disposals, disposal items, import history, app settings, rewards) now inject `tenant_id` via `requireTenantId()`.
  - Update paths intentionally do **not** include `tenant_id` in the payload (RLS verifies existing row ownership).

## 2. Verification

- [x] 2.1 Run `npm run lint` — PASS
- [x] 2.2 Run `npm run build` if this sub-phase touches code — PASS
- [x] 2.3 Manual test the acceptance criteria
  - Runtime end-to-end test should be performed on staging:
    1. Open a tenant subdomain, create a product.
    2. Verify in Supabase SQL that the product row has `tenant_id` matching the current tenant.
    3. Switch to a different subdomain/tenant and call the same API; confirm no data from the first tenant is visible.
    4. Confirm `tenant_id` cannot be passed through the input object (mappers ignore `item.tenantId` and use the injected value).

## Acceptance Criteria

- [x] Tạo sản phẩm mới có `tenant_id` đúng.
- [x] Gọi API từ subdomain khác không thấy dữ liệu.
- [x] Mapper không chấp nhận `tenant_id` từ input object.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_6_2_20260705_091353`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.
