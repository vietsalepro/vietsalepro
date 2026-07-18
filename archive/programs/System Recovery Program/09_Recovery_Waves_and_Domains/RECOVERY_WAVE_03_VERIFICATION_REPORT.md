# RECOVERY WAVE-03 — INDEPENDENT VERIFICATION REPORT

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Wave:** Recovery Wave-03  
**Domains:** H4 — Returns & Exchanges, H5 — Customers, H6 — Suppliers  
**Date:** 2026-07-16  
**Authority:** Independent Verification (read-only, no code/mock changes)  
**Final Decision:** PASS WITH OBSERVATIONS

---

## 1. Scope & Constraints

This verification is **read-only**. No code, mock, migration, or RPC implementation was changed.

- Direct measurement from the current working tree.
- `RECOVERY_WAVE_03_IMPLEMENTATION_REPORT.md` was reviewed for context but **not used as evidence** for coverage counts or pass/fail.
- Baseline `BEFORE` values are derived from `RECOVERY_WAVE_02_VERIFICATION_REPORT.md` §10.1 (150 matched / 34 missing at 184 unique code RPCs).

---

## 2. Documents Reviewed

| # | Document | Status |
|---|---|---|
| 1 | `PROGRAM_RECOVERY_AUTHORIZATION.md` | Reviewed |
| 2 | `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` | Reviewed |
| 3 | `PHASE4_RECOVERY_MAPPING_VALIDATION.md` | Reviewed |
| 4 | `RECOVERY_WAVE_02_VERIFICATION_REPORT.md` | Reviewed (baseline) |
| 5 | `RECOVERY_WAVE_03_IMPLEMENTATION_REPORT.md` | Reviewed for context only |
| 6 | `CURRENT_TASK-021_ARCHITECTURE_DECISION.md` (H4) | Reviewed |
| 7 | `CURRENT_TASK-017_ARCHITECTURE_DECISION.md` (H5) | Reviewed |
| 8 | `CURRENT_TASK-018_ARCHITECTURE_DECISION.md` (H6) | Reviewed |

---

## 3. Methodology

1. Scanned `services/`, `lib/`, `utils/` for all `supabase.rpc(...)` call sites, multi-line aware (`supabase` and `.rpc` may be on separate lines).
2. Scanned `tests/mocks/supabase.ts` for every `if (name === '...')` / `else if (name === '...')` handler block.
3. Cross-referenced code RPCs against mock handlers to produce:
   - **Matched** — code RPC with a handler
   - **Missing** — code RPC without a handler
   - **Extra** — handler without a `.rpc(...)` call site in `services/`, `lib/`, `utils/`
   - **Duplicate** — same RPC name handled more than once
4. Checked for **dead handlers** (handler name not matching `CREATE [OR REPLACE] FUNCTION public.<name>` in `supabase/migrations/*.sql`).
5. Checked for **duplicate store keys** and **duplicate helper declarations** introduced by Wave-03.
6. Ran the three required gates directly.

---

## 4. Gate Results

| Gate | Command | Result |
|---|---|---|
| Canonical Audit Gate | `npx tsx scripts/audit-rpc-contracts.ts` | **PASS** — Exit 0. Migration RPCs: 300, Code RPCs: 183, no missing from migrations. |
| Type Gate | `npx tsc --noEmit` | **PASS** — Exit 0, no TypeScript errors. |
| Test Gate | `npx vitest run` | **PASS** — 68 test files passed, 389 tests passed, 0 failures. |

> **Note:** The canonical audit script reports **183** code RPCs because its regex requires `supabase.rpc('name'` on a single line and misses the multi-line `complete_disposal` call at `services/supabaseService.ts:3519–3520`. Direct measurement finds **184** unique code RPC names.

---

## 5. RPC Inventory (Direct Count)

| Metric | Count | Notes |
|---|---|---|
| Unique code RPC names | **184** | Multi-line `.rpc(` aware scan of `services/`, `lib/`, `utils/` (69 files). |
| Code RPCs per canonical audit script | **183** | Same inventory, minus `complete_disposal` due to single-line regex. |
| Mock handler blocks (raw) | **188** | In `tests/mocks/supabase.ts`. |
| Unique mock handler names | **187** | |
| Duplicate handlers | **1** | `get_tenant_members_with_email` — two blocks (`tests/mocks/supabase.ts:761` and `:2264`). |
| Canonical migration RPCs | **300** | From `supabase/migrations/*.sql`. |

---

## 6. Cross-Reference Results

| Category | Count | Details |
|---|---|---|
| **Matched** | **170** | Code RPCs with a mock handler. |
| **Missing** | **14** | Code RPCs with no mock handler (all H7/H8/H9). |
| **Extra / Unused handlers** | **17** | 16 hyphenated edge-function handlers + `update_tenant_status`. |
| **Duplicate handler** | **1** | `get_tenant_members_with_email` — pre-existing, not introduced by Wave-03. |
| **Dead handlers** | **16** | Edge-function handler names not found as `public.<name>` functions in migrations. |
| **Duplicate stores (Wave-03)** | **0** | 7 new store keys are unique vs. pre-existing keys. |
| **Duplicate helpers (Wave-03)** | **0** | No new top-level helper declarations introduced. |
| **Wave-03 new store keys** | **7** | `suppliers`, `supplier_payment_ledger`, `import_receipts`, `import_items`, `supplier_exchanges`, `supplier_exchange_return_items`, `supplier_exchange_received_items`. |

### 6.1 14 Missing Code RPCs (H7/H8/H9)

| Domain | RPCs |
|---|---|
| **H7 — Imports** (8) | `delete_import_v2`, `filter_import_receipts_rpc`, `get_import_receipt_count_by_date`, `get_import_receipts_by_product_and_lot`, `get_import_receipts_by_supplier_id`, `get_import_stats`, `process_import_v2`, `update_import_v2` |
| **H8 — Disposals** (4) | `complete_disposal`, `delete_disposal_with_restore`, `filter_disposals_rpc`, `get_disposal_auto_code` |
| **H9 — Reports & Dashboard** (2) | `get_dashboard_summary`, `get_profit_report` |

### 6.2 17 Extra / Unused Handlers

```text
check-subdomain
create-system-admin
delete-tenant
end-impersonation
error-performance
impersonate-tenant
invite-member
reset-password
send-billing-email
send-sms
send-template-email
send-ticket-email
system-backup
system-health
tenant-backup
tenant-restore
update_tenant_status
```

### 6.3 16 Dead Handlers

All 16 edge-function handler names above *except* `update_tenant_status` (which exists in migrations but has no `.rpc(...)` call site).

---

## 7. Domain H4 — Returns & Exchanges Verification (7/7 PASS)

All 7 authorized Domain H4 RPCs have a mock handler.

| # | RPC | Canonical Migration | Code Call Site | Mock Handler Line | Status |
|---|---|---|---|---|---|
| 1 | `get_return_order_auto_code` | `20250703000000_baseline_pre_tenant_schema.sql:8602` | `services/supabaseService.ts:2899` | `tests/mocks/supabase.ts:5178` | PASS |
| 2 | `filter_return_orders_rpc` | `20250703000000_baseline_pre_tenant_schema.sql:6325` | `services/supabaseService.ts:3376` | `tests/mocks/supabase.ts:5184` | PASS |
| 3 | `create_return_order` | `20250703000000_baseline_pre_tenant_schema.sql:4645` | `services/supabaseService.ts:2938` | `tests/mocks/supabase.ts:5210` | PASS |
| 4 | `cancel_return_order_v2` | `20250703000000_baseline_pre_tenant_schema.sql:2973` | `services/supabaseService.ts:3393` | `tests/mocks/supabase.ts:5347` | PASS |
| 5 | `create_exchange_transaction` | `20250703000000_baseline_pre_tenant_schema.sql:3830` | `services/supabaseService.ts:3064` | `tests/mocks/supabase.ts:5407` | PASS |
| 6 | `create_supplier_exchange` | `20250703000000_baseline_pre_tenant_schema.sql:4800` | `services/supabaseService.ts:3756` | `tests/mocks/supabase.ts:5595` | PASS |
| 7 | `cancel_supplier_exchange` | `20250703000000_baseline_pre_tenant_schema.sql:3051` | `services/supabaseService.ts:3773` | `tests/mocks/supabase.ts:5715` | PASS |

**Domain H4 handler verdict: 7/7 PASS**

---

## 8. Domain H5 — Customers Verification (6/6 PASS)

All 6 authorized Domain H5 RPCs have a mock handler.

| # | RPC | Canonical Migration | Code Call Site | Mock Handler Line | Status |
|---|---|---|---|---|---|
| 1 | `search_customers_rpc` | `20250703000000_baseline_pre_tenant_schema.sql:11884` | `services/supabaseService.ts:581` | `tests/mocks/supabase.ts:4802` | PASS |
| 2 | `filter_customers_rpc` | `20250703000000_baseline_pre_tenant_schema.sql:6027` | `services/supabaseService.ts:659` | `tests/mocks/supabase.ts:4818` | PASS |
| 3 | `get_customer_stats` | `20250703000000_baseline_pre_tenant_schema.sql:7062` | `services/supabaseService.ts:814` | `tests/mocks/supabase.ts:4857` | PASS |
| 4 | `get_customer_report` | `20250703000000_baseline_pre_tenant_schema.sql:7005` | `services/supabaseService.ts:3942` | `tests/mocks/supabase.ts:4868` | PASS |
| 5 | `get_customer_debt_ledger` | `20250703000000_baseline_pre_tenant_schema.sql:6990` | `services/supabaseService.ts:1533` | `tests/mocks/supabase.ts:4909` | PASS |
| 6 | `adjust_customer_debt` | `20250703000000_baseline_pre_tenant_schema.sql:1611` | `services/supabaseService.ts:1447` | `tests/mocks/supabase.ts:4933` | PASS |

**Domain H5 handler verdict: 6/6 PASS**

---

## 9. Domain H6 — Suppliers Verification (7/7 PASS)

All 7 authorized Domain H6 RPCs have a mock handler.

| # | RPC | Canonical Migration | Code Call Site | Mock Handler Line | Status |
|---|---|---|---|---|---|
| 1 | `search_suppliers_rpc` | `20250703000000_baseline_pre_tenant_schema.sql:11969` | `services/supabaseService.ts:871` | `tests/mocks/supabase.ts:4966` | PASS |
| 2 | `filter_suppliers_rpc` | `20250703000000_baseline_pre_tenant_schema.sql:6367` | `services/supabaseService.ts:885` | `tests/mocks/supabase.ts:4982` | PASS |
| 3 | `get_supplier_stats` | `20250703000000_baseline_pre_tenant_schema.sql:9015` | `services/supabaseService.ts:1698` | `tests/mocks/supabase.ts:5016` | PASS |
| 4 | `get_supplier_report` | `20250703000000_baseline_pre_tenant_schema.sql:8950` | `services/supabaseService.ts:3961` | `tests/mocks/supabase.ts:5026` | PASS |
| 5 | `get_supplier_debt_ledger` | `20250703000000_baseline_pre_tenant_schema.sql:8927` | `services/supabaseService.ts:1583` | `tests/mocks/supabase.ts:5072` | PASS |
| 6 | `adjust_supplier_debt` | `20250703000000_baseline_pre_tenant_schema.sql:1633` | `services/supabaseService.ts:1486` | `tests/mocks/supabase.ts:5096` | PASS |
| 7 | `pay_supplier_debt` | `20250703000000_baseline_pre_tenant_schema.sql:10320` | `services/supabaseService.ts:1405` | `tests/mocks/supabase.ts:5125` | PASS |

**Domain H6 handler verdict: 7/7 PASS**

---

## 10. Quality Findings

### 10.1 Duplicate handler (pre-existing, not Wave-03)

`get_tenant_members_with_email` appears twice in `tests/mocks/supabase.ts` (lines 761 and 2264). This duplication predates Recovery Wave-03 and is not a new regression.

### 10.2 Extra / orphan handlers

- `update_tenant_status` has a handler block but no `.rpc(...)` call site in `services/`, `lib/`, or `utils/`. It is present in the canonical migration chain, so it is **extra/unused**, not dead.
- The 16 hyphenated edge-function handlers are extra under the `.rpc(...)` scope. Some of them correspond to `supabase.functions.invoke(...)` calls (e.g., `system-health`, `send-sms`, `tenant-backup`), which are outside the RPC coverage boundary used by this verification.

### 10.3 Wave-03 store keys

7 new store keys were added by Wave-03:

- `suppliers`
- `supplier_payment_ledger`
- `import_receipts`
- `import_items`
- `supplier_exchanges`
- `supplier_exchange_return_items`
- `supplier_exchange_received_items`

None collide with pre-existing store keys. All 7 are referenced by the new handlers.

### 10.4 Wave-03 helpers

No new top-level helper declarations were introduced by Wave-03. Inline handler logic reuses pre-existing helpers (`uuid`, store lookups, etc.).

---

## 11. Coverage Report

### 11.1 Overall Coverage (denominator = 184 unique code RPC names)

| Metric | Count | Percentage |
|---|---|---|
| Code RPCs | 184 | 100% |
| Matched (covered) | **170** | **92.4%** |
| Missing (uncovered) | 14 | 7.6% |

**Claim `170 / 184` is confirmed by direct measurement.** No arithmetic was used.

### 11.2 Before / After Wave-03

| Metric | BEFORE Wave-03 (Wave-02 verified) | AFTER Wave-03 (current) | Delta |
|---|---|---|---|
| Code RPCs | 184 | 184 | 0 |
| Matched | 150 | 170 | **+20** |
| Missing | 34 | 14 | **-20** |
| Coverage | 81.5% | 92.4% | **+10.9 pp** |

The `+20` matches the authorized Domain H4/H5/H6 scope exactly (7 + 6 + 7 = 20).

### 11.3 Remaining Uncovered RPCs by Domain

| Domain | RPC Count | Remaining RPCs |
|---|---|---|
| H7 — Imports | 8 | `delete_import_v2`, `filter_import_receipts_rpc`, `get_import_receipt_count_by_date`, `get_import_receipts_by_product_and_lot`, `get_import_receipts_by_supplier_id`, `get_import_stats`, `process_import_v2`, `update_import_v2` |
| H8 — Disposals | 4 | `complete_disposal`, `delete_disposal_with_restore`, `filter_disposals_rpc`, `get_disposal_auto_code` |
| H9 — Reports & Dashboard | 2 | `get_dashboard_summary`, `get_profit_report` |
| **Total remaining** | **14** | — |

### 11.4 Remaining Domains

Domains still containing uncovered RPCs: **H7, H8, H9**.

---

## 12. Independent Acceptance Review

**Verdict: Recovery Wave-03 is accepted.**

Evidence:

- All 20 authorized Domain H4/H5/H6 RPCs have handlers.
- Handlers are additive; no existing handler was modified or removed.
- Return shapes and parameter usage align with canonical migration references recorded in mock comments.
- All three quality gates pass with no regressions.

Observations (non-blocking):

- Pre-existing duplicate handler `get_tenant_members_with_email` remains.
- Pre-existing orphan handler `update_tenant_status` remains unused by `.rpc(...)` call sites.
- Edge-function handlers remain extra/dead under the migration-function definition; they are outside the `.rpc(...)` coverage boundary and do not affect Wave-03 coverage.
- The audit script undercounts one code RPC (`complete_disposal`) due to a single-line regex limitation; this is not a new Wave-03 issue.

---

## 13. Final Decision

**PASS WITH OBSERVATIONS**

Recovery Wave-03 — Domains H4, H5, H6 — is verified as complete. Direct measurement confirms the coverage claim of **170 / 184**. The three required gates pass, and no regressions were observed.

**Next step:** Only after this Verification PASS should Recovery Wave-04 (H7 — Imports, H8 — Disposals) proceed.
