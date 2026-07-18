# RECOVERY WAVE-02 — INDEPENDENT VERIFICATION REPORT

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Wave:** Recovery Wave-02  
**Domains:** H2 — Inventory & Stock, H3 — Orders & Sales  
**Date:** 2026-07-16  
**Authority:** Independent Verification (read-only, no code/mock changes)  
**Final Decision:** PASS WITH OBSERVATIONS

---

## 1. Scope & Constraints

This verification is **read-only**. No code, mock, migration, or RPC implementation was changed.

- Direct measurement from the current working tree.
- `RECOVERY_WAVE_02_IMPLEMENTATION_REPORT.md` was reviewed for context but **not used as evidence** for coverage counts or pass/fail.
- Baseline `BEFORE` values are derived from `RECOVERY_DOMAIN_H1_VERIFICATION_REPORT.md` §10.1 (136 matched / 48 missing at 184 unique code RPCs).

---

## 2. Documents Reviewed

| # | Document | Status |
|---|---|---|
| 1 | `PROGRAM_RECOVERY_AUTHORIZATION.md` | Reviewed |
| 2 | `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` | Reviewed |
| 3 | `PHASE4_RECOVERY_MAPPING_VALIDATION.md` | Reviewed |
| 4 | `RECOVERY_DOMAIN_H1_VERIFICATION_REPORT.md` | Reviewed (baseline) |
| 5 | `RECOVERY_WAVE_02_IMPLEMENTATION_REPORT.md` | Reviewed for context only |
| 6 | `CURRENT_TASK-019_ARCHITECTURE_DECISION.md` | Reviewed |
| 7 | `CURRENT_TASK-020_ARCHITECTURE_DECISION.md` | Reviewed |

---

## 3. Methodology

1. Scanned `services/`, `lib/`, `utils/` for all `supabase.rpc(...)` call sites, multi-line aware.
2. Scanned `tests/mocks/supabase.ts` for all `if (name === '...')` handler blocks.
3. Cross-referenced code RPCs against mock handlers and canonical migrations.
4. Checked Domain H2 (7 RPCs) and Domain H3 (7 RPCs) against their authorized sets.
5. Ran the three required gates directly.
6. Checked for duplicate handlers, duplicate stores, duplicate helpers, dead handlers, and unused stores introduced by Wave-02.

---

## 4. Gate Results

| Gate | Command | Result |
|---|---|---|
| Canonical Audit Gate | `npx tsx scripts/audit-rpc-contracts.ts` | **PASS** — Exit 0. Migration RPCs: 300, Code RPCs: 183, 0 missing from migrations. |
| Type Gate | `npx tsc --noEmit` | **PASS** — Exit 0, no TypeScript errors. |
| Test Gate | `npx vitest run` | **PASS** — 68 test files passed, 389 tests passed, 0 failures. |

> **Note:** The canonical audit script reports **183** code RPCs because its regex requires `supabase.rpc('name'` on a single line and misses the multi-line `complete_disposal` call at `services/supabaseService.ts:3519–3520`. Direct measurement finds **184** unique code RPC names.

---

## 5. RPC Inventory (Direct Count)

| Metric | Count | Notes |
|---|---|---|
| Unique code RPC names | **184** | Multi-line `.rpc(` aware scan of `services/`, `lib/`, `utils/`. |
| Code RPCs per canonical audit script | **183** | Same inventory, minus `complete_disposal` due to single-line regex. |
| Mock handler blocks | **152** | In `tests/mocks/supabase.ts`. |
| Unique mock handler names | **151** | One name duplicated (see §9.1). |
| Canonical migration RPCs | **300** | From `supabase/migrations/*.sql`. |

---

## 6. Cross-Reference Results

| Category | Count | Details |
|---|---|---|
| **Matched** | **150** | Code RPCs with a mock handler. |
| **Missing** | **34** | Code RPCs with no mock handler. |
| **Extra / Unused handlers** | **1** | `update_tenant_status` — handler exists but no `.rpc(...)` call site in `services/`, `lib/`, `utils/`. |
| **Duplicate handler** | **1** | `get_tenant_members_with_email` — two handler blocks (`tests/mocks/supabase.ts:749` and `:2252`), pre-existing, not introduced by Wave-02. |
| **Dead handlers** | **0** | Every mock handler name exists in the canonical migration chain. |
| **Duplicate stores (Wave-02)** | **0** | 10 new store keys are unique vs. pre-existing keys. |
| **Duplicate helpers (Wave-02)** | **0** | No new helper functions introduced by Wave-02. |
| **Unused stores (Wave-02)** | **0** | All 10 new store keys are referenced by the new handlers (50 references total). |

---

## 7. Domain H2 — Inventory & Stock Verification (7/7 PASS)

All 7 authorized Domain H2 RPCs per `CURRENT_TASK-019_ARCHITECTURE_DECISION.md` §3.1 have a mock handler.

| # | RPC | Canonical Migration | Code Call Site | Mock Handler Line | Status |
|---|---|---|---|---|---|
| 1 | `cancel_inventory_count_rpc` | `20250703000000_baseline_pre_tenant_schema.sql:2782` | `services/supabaseService.ts:2270` | `tests/mocks/supabase.ts:4067` | PASS |
| 2 | `complete_inventory_count` | `20250703000000_baseline_pre_tenant_schema.sql:3531` | `services/supabaseService.ts:2245` | `tests/mocks/supabase.ts:4111` | PASS |
| 3 | `delete_inventory_count_rpc` | `20250703000000_baseline_pre_tenant_schema.sql:5571` | `services/supabaseService.ts:2257` | `tests/mocks/supabase.ts:4161` | PASS |
| 4 | `get_stock_ledger` | `20250703000000_baseline_pre_tenant_schema.sql:8923` | `services/supabaseService.ts:3893` | `tests/mocks/supabase.ts:4172` | PASS |
| 5 | `check_stock_ledger_drift` | `20250703000000_baseline_pre_tenant_schema.sql:3346` | `services/supabaseService.ts:3929` | `tests/mocks/supabase.ts:4218` | PASS |
| 6 | `increment_product_quantity` | `20250703000000_baseline_pre_tenant_schema.sql:9693` | `services/supabaseService.ts:3235` | `tests/mocks/supabase.ts:4245` | PASS |
| 7 | `get_inventory_report` | `20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql:90` | `services/supabaseService.ts:3861` | `tests/mocks/supabase.ts:4254` | PASS |

**Domain H2 handler verdict: 7/7 PASS**

---

## 8. Domain H3 — Orders & Sales Verification (7/7 PASS)

All 7 authorized Domain H3 RPCs per `CURRENT_TASK-020_ARCHITECTURE_DECISION.md` §3.1 have a mock handler.

| # | RPC | Canonical Migration | Code Call Site | Mock Handler Line | Status |
|---|---|---|---|---|---|
| 1 | `cancel_order` | `20250703000000_baseline_pre_tenant_schema.sql:2883` | `services/supabaseService.ts:1281` | `tests/mocks/supabase.ts:4354` | PASS |
| 2 | `delete_order` | `20250703000000_baseline_pre_tenant_schema.sql:5622` | `services/supabaseService.ts:1261` | `tests/mocks/supabase.ts:4402` | PASS |
| 3 | `get_order_auto_code` | `20250703000000_baseline_pre_tenant_schema.sql:7908` | `utils/invoiceNumber.ts:57` | `tests/mocks/supabase.ts:4443` | PASS |
| 4 | `get_sales_report` | `20250703000000_baseline_pre_tenant_schema.sql:8671` | `services/supabaseService.ts:3790` | `tests/mocks/supabase.ts:4449` | PASS |
| 5 | `process_checkout` | `20250706000006_phase_p7_0_read_only_tenant_infra.sql:204` and `20250705000006_phase9_5_safeupdate_fix.sql:5` | `services/supabaseService.ts:2519` | `tests/mocks/supabase.ts:4595` | PASS |
| 6 | `search_orders_rpc` | `20250703000000_baseline_pre_tenant_schema.sql:11897` | `services/supabaseService.ts:1757` | `tests/mocks/supabase.ts:4719` | PASS |
| 7 | `pay_order_debt` | `20250703000000_baseline_pre_tenant_schema.sql:10280` | `services/supabaseService.ts:1358` | `tests/mocks/supabase.ts:4738` | PASS |

**Domain H3 handler verdict: 7/7 PASS**

> **Note:** `PHASE4_RECOVERY_MAPPING_VALIDATION.md` §3 lists `create_invoice` as the 3rd H3 RPC. The authoritative H3 set in `CURRENT_TASK-020_ARCHITECTURE_DECISION.md` and the H1 baseline is `get_sales_report`. Both `create_invoice` (pre-existing handler at `tests/mocks/supabase.ts:1215`) and `get_sales_report` (added by Wave-02) are present and matched, so Domain H3 coverage is complete either way.

---

## 9. Quality Findings

### 9.1 Duplicate handler (pre-existing, not Wave-02)

`get_tenant_members_with_email` appears twice in `tests/mocks/supabase.ts` (lines 749 and 2252). This duplication predates Recovery Wave-02 and is not a new regression.

### 9.2 Extra / orphan handler (pre-existing, not Wave-02)

`update_tenant_status` has a handler block at `tests/mocks/supabase.ts:502` but no `.rpc(...)` call site in `services/`, `lib/`, or `utils/`. This orphan is pre-existing.

### 9.3 Wave-02 store keys

10 new store keys were added by Wave-02:

- `inventory_counts`
- `inventory_count_items`
- `stock_movements`
- `customers`
- `customer_payment_ledger`
- `order_items`
- `return_orders`
- `return_order_items`
- `point_history`
- `rewards`

None collide with pre-existing store keys. All 10 are referenced by the new handlers.

### 9.4 Wave-02 helpers

No new helper functions were introduced by Wave-02. Inline handler logic reuses the pre-existing `uuid()` helper.

### 9.5 Dead handlers

Every unique handler name in `tests/mocks/supabase.ts` is also present in the canonical migration chain. No dead handlers.

---

## 10. Coverage Report

### 10.1 Overall Coverage (denominator = 184 unique code RPC names)

| Metric | BEFORE H1 | AFTER H1 | AFTER Wave-02 | Delta (Wave-02) |
|---|---|---|---|---|
| Code RPCs | 184 | 184 | 184 | 0 |
| Matched (covered) | 125 | 136 | **150** | **+14** |
| Missing (uncovered) | 59 | 48 | **34** | **-14** |
| Coverage | 67.9% | 73.9% | **81.5%** | **+7.6 pp** |

`BEFORE H1` and `AFTER H1` values are taken from `RECOVERY_DOMAIN_H1_VERIFICATION_REPORT.md` §10.1.

### 10.2 Remaining Uncovered RPCs by Domain

| Domain | RPC Count | Remaining RPCs |
|---|---|---|
| H4 — Returns & Exchanges | 7 | `cancel_return_order_v2`, `cancel_supplier_exchange`, `create_exchange_transaction`, `create_return_order`, `create_supplier_exchange`, `filter_return_orders_rpc`, `get_return_order_auto_code` |
| H5 — Customers | 6 | `adjust_customer_debt`, `filter_customers_rpc`, `get_customer_debt_ledger`, `get_customer_report`, `get_customer_stats`, `search_customers_rpc` |
| H6 — Suppliers | 7 | `adjust_supplier_debt`, `filter_suppliers_rpc`, `get_supplier_debt_ledger`, `get_supplier_report`, `get_supplier_stats`, `pay_supplier_debt`, `search_suppliers_rpc` |
| H7 — Imports | 8 | `delete_import_v2`, `filter_import_receipts_rpc`, `get_import_receipt_count_by_date`, `get_import_receipts_by_product_and_lot`, `get_import_receipts_by_supplier_id`, `get_import_stats`, `process_import_v2`, `update_import_v2` |
| H8 — Disposals | 4 | `complete_disposal`, `delete_disposal_with_restore`, `filter_disposals_rpc`, `get_disposal_auto_code` |
| H9 — Reports & Dashboard | 2 | `get_dashboard_summary`, `get_profit_report` |
| **Total remaining** | **34** | — |

### 10.3 Remaining Domains

Domains still containing uncovered RPCs: **H4, H5, H6, H7, H8, H9**.

---

## 11. Final Decision

**PASS WITH OBSERVATIONS**

Recovery Wave-02 — Domains H2 (Inventory & Stock) and H3 (Orders & Sales) — is verified as complete.

Evidence:
- All 7 authorized Domain H2 RPCs have mock handlers.
- All 7 authorized Domain H3 RPCs have mock handlers.
- Handlers are additive; no existing handler was modified or removed.
- All three quality gates pass with no regressions.
- Coverage increased by +14 matched RPCs (136 → 150) and by +7.6 percentage points (73.9% → 81.5%).

Observations (non-blocking):
- Pre-existing duplicate handler `get_tenant_members_with_email` remains.
- Pre-existing orphan handler `update_tenant_status` remains unused.
- The canonical audit script undercounts one code RPC (`complete_disposal`) due to a single-line regex limitation; this is not a Wave-02 issue.
- `create_invoice` is pre-existing and matched; the authoritative H3 set uses `get_sales_report`, which is now also matched.

---

## 12. Verification Deliverable

Only this report was generated. No code, mock, migration, or RPC implementation changes were made during this verification pass.
