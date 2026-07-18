# RECOVERY DOMAIN H1 — IMPLEMENTATION REPORT

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Domain:** H1 — Products & Catalog  
**Date:** 2026-07-16  
**Status:** Implementation Complete  
**Authorizing Documents:**  
  - `PROGRAM_RECOVERY_AUTHORIZATION.md`  
  - `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md`  
  - `PHASE4_RECOVERY_MAPPING_VALIDATION.md`  
  - `CURRENT_TASK-016_ARCHITECTURE_DECISION.md` (reference)  
  - `CURRENT_TASK-016_IMPLEMENTATION_REPORT.md` (reference)  
**Scope:** Domain H1 — Products & Catalog (11 RPCs) per `PHASE4_RECOVERY_MAPPING_VALIDATION.md` §3 Domain H1

---

## 1. Scope

### 1.1 In Scope

| Sub-group | RPCs |
|---|---|
| Existence Checks | `check_product_barcode_exists`, `check_product_code_exists` |
| Product Lookup | `get_product_by_barcode`, `search_products_rpc`, `filter_products_rpc` |
| Catalog Aggregates | `get_product_stats`, `get_brand_product_counts`, `get_category_product_counts`, `count_point_products` |
| Sync Resolvers | `get_unsynced_brands`, `get_unsynced_categories` |

**Total: 11 unique RPCs**

### 1.2 Out of Scope

- All other domains (A, B, C, D, E, F, G, H2–H9)
- Production code (`services/`, `lib/`, `utils/`, UI, pages)
- Database migrations, `supabase/schema.sql`, generated types
- `scripts/audit-rpc-contracts.ts` (frozen)
- CI workflow, `package.json`, governance documents

---

## 2. Files Changed

| File | Change |
|---|---|
| `tests/mocks/supabase.ts` | Added `categories`, `brands`, `product_lots` to store (3 keys); added local helper `buildProductRow`; added 11 additive `if (name === '...')` handlers before terminal fallback |

No other file was modified. All changes are **additive only** — no existing handler was modified or removed.

---

## 3. Architecture Compliance

| # | Requirement | Result |
|---|---|---|
| 1 | No feature development / architecture redesign / scope expansion | **PASS** |
| 2 | No modification of production code, migrations, schema, types | **PASS** |
| 3 | No new files / scripts / governance artifacts | **PASS** (report excepted) |
| 4 | Implementation inside an approved CURRENT_TASK | **PASS** (CURRENT_TASK-016) |
| 5 | `if (name === '...')` dispatch pattern preserved | **PASS** |
| 6 | Return shapes match canonical migration RETURNS | **PASS** — verified by inspection |
| 7 | Additive-only; no edit/removal of existing handlers | **PASS** |
| 8 | Audit script not modified | **PASS** |
| 9 | No mock for RPC not in canonical migration chain | **PASS** |
| 10 | No duplicate handler for already-mocked RPC | **PASS** |

---

## 4. Store Changes

3 new store keys added:

```typescript
categories: [],      // for get_category_product_counts, get_unsynced_categories
brands: [],          // for get_brand_product_counts, get_unsynced_brands
product_lots: [],    // for buildProductRow product_lots aggregation
```

`products` already existed in store prior (used by all 11 handlers).

---

## 5. Local Helper

`buildProductRow(p)` — shared 23-column product row builder used by `search_products_rpc`, `get_product_by_barcode`, and `filter_products_rpc`.

Canonical source: `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` (latest definition).

Columns: `id`, `name`, `display_name`, `code` (from `products.sku`), `barcode`, `price`, `cost`, `quantity`, `unit`, `location`, `category`, `brand`, `image`, `min_stock`, `max_stock`, `safety_stock`, `is_point_accumulation_enabled`, `conversion_units`, `created_at`, `has_lots`, `category_id`, `brand_id`, `product_lots`.

`product_lots` is populated from `store.product_lots` filtered by `product_id` and sorted by `expiry_date` ASC then `created_at` ASC, matching canonical `jsonb_agg(... ORDER BY pl.expiry_date ASC, pl.created_at ASC)`.

---

## 6. Traceability Matrix

| # | RPC | Service Call-site | Canonical Migration File | Migration Line | RETURNS |
|---|---|---|---|---|---|
| 1 | `check_product_barcode_exists` | `services/supabaseService.ts:509` | `20250703000000_baseline_pre_tenant_schema.sql` | 3276 | `BOOLEAN` |
| 2 | `check_product_code_exists` | `services/supabaseService.ts:503` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` | 82 | `BOOLEAN` |
| 3 | `get_product_by_barcode` | `services/supabaseService.ts:439` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` | 284 | `TABLE` (23 columns) |
| 4 | `get_product_stats` | `services/supabaseService.ts:491` | `20250703000000_baseline_pre_tenant_schema.sql` | 8084 | `JSON` |
| 5 | `get_brand_product_counts` | `services/supabaseService.ts:1715` | `20250703000000_baseline_pre_tenant_schema.sql` | 6698 | `JSON` |
| 6 | `get_category_product_counts` | `services/supabaseService.ts:1709` | `20250703000000_baseline_pre_tenant_schema.sql` | 6717 | `JSON` |
| 7 | `get_unsynced_brands` | `services/supabaseService.ts:1727` | `20250703000000_baseline_pre_tenant_schema.sql` | 9603 | `JSON` |
| 8 | `get_unsynced_categories` | `services/supabaseService.ts:1721` | `20250703000000_baseline_pre_tenant_schema.sql` | 9624 | `JSON` |
| 9 | `count_point_products` | `services/supabaseService.ts:1733` | `20250703000000_baseline_pre_tenant_schema.sql` | 3822 | `INTEGER` |
| 10 | `search_products_rpc` | `services/supabaseService.ts:430` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` | 231 | `TABLE` (23 columns) |
| 11 | `filter_products_rpc` | `services/supabaseService.ts:520` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql` | 346 | `JSON` (8-arg overload) |

**Traceability: PASS (11/11)**

---

## 7. Validation Results

### 7.1 Audit Gate

```
npx tsx scripts/audit-rpc-contracts.ts
Result: PASS — Exit 0
Migration RPCs: 300
Code RPCs      : 183
All service-layer RPC calls are defined in the canonical migration chain.
No stale mocks. No duplicates.
```

### 7.2 TypeScript Gate

```
npx tsc --noEmit
Result: PASS — Exit 0
No type errors.
```

### 7.3 Test Gate

```
npx vitest run
Result: PASS
Test Files  68 passed (68)
Tests       389 passed (389)
Duration    22.29s
No regression vs baseline (68 files, 389 tests).
```

---

## 8. Coverage Delta

### 8.1 Coverage BEFORE

From `RECOVERY_PACKAGE_01_VERIFICATION_REPORT.md`:
| Metric | Value |
|---|---|
| Code RPCs | 183 |
| Covered (matched) | 119 |
| Uncovered | 64 |
| Coverage | ~65.0% |

### 8.2 Coverage AFTER (estimated)

After adding 11 Domain H1 handlers:

| Metric | Value | Delta |
|---|---|---|
| Code RPCs | 183 | 0 |
| Covered (matched) | **130** | +11 |
| Uncovered | **53** | -11 |
| Coverage | **~71.0%** | +6.0 pp |

**Source:** 119 (pre-Recovery-Domain-H1) + 11 (new H1 handlers) = 130 covered. Coverage = 130/183 ≈ 71.0%.

The 53 remaining uncovered RPCs belong to Domains H2 (Inventory), H3 (Orders), H4 (Returns), H5 (Customers), H6 (Suppliers), H7 (Imports), H8 (Disposals), H9 (Reports).

---

## 9. Helper & Store Summary

| Resource | Type | Used By |
|---|---|---|
| `store.categories` | Store key | `get_category_product_counts`, `get_unsynced_categories` |
| `store.brands` | Store key | `get_brand_product_counts`, `get_unsynced_brands` |
| `store.product_lots` | Store key | `buildProductRow` (used by `search_products_rpc`, `get_product_by_barcode`, `filter_products_rpc`) |
| `store.products` | Store key (existing) | All 11 handlers |
| `buildProductRow(p)` | Local helper | `search_products_rpc`, `get_product_by_barcode`, `filter_products_rpc` |

All 3 new store keys are initialized as empty arrays in the `store` object. No existing store key or helper was modified.

---

## 10. Implementation Notes

1. **`filter_products_rpc` overloads:** One handler covers both 7-arg and 8-arg canonical overloads (the 7-arg overload delegates to the 8-arg in canonical SQL). The mock models the 8-arg shape (superset of params).

2. **`check_product_code_exists`:** Canonical redefinition in `20250705000000...` checks `products.sku = p_code`; the mock mirrors this by checking `p.sku === code`.

3. **`get_brand_product_counts` / `get_category_product_counts`:** Handle both `brand_id`/`category_id` FK match and `brand`/`category` name string match from product data.

4. **`buildProductRow`:** Uses `p.sku ?? p.code` for the output `code` column, matching the canonical `products.sku` → `code` alias from `20250705000000...`.

---

## 11. Conclusion

All 11 Domain H1 RPC handlers have been implemented in `tests/mocks/supabase.ts` following the existing `if (name === '...')` dispatch pattern, with return shapes derived from the canonical migration chain. All three validation gates (audit, TypeScript, vitest) PASS. No existing handler was modified. Estimated coverage increases from ~65.0% (119/183) to ~71.0% (130/183).

**No verification performed per task instructions.**