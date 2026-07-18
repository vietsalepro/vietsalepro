# CURRENT_TASK-024 — Independent Acceptance Review

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**CURRENT_TASK:** 024 — Wave 3i, Domain H9 — Reports & Dashboard Mock Coverage  
**Document Type:** Independent Acceptance Review  
**Date:** 2026-07-15  
**Reviewer Role:** Independent Acceptance Reviewer  
**Decision:** **FAIL**  

---

## 1. Review Scope

This review independently verifies the engineering output of CURRENT_TASK-024 against the authorized scope in `CURRENT_TASK-024_PROGRAM_AUTHORIZATION.md` and `CURRENT_TASK-024_ARCHITECTURE_DECISION.md`.

Authorized scope:

- Exactly **2 RPCs**: `get_dashboard_summary` and `get_profit_report`.
- Only file permitted to change: `tests/mocks/supabase.ts`.
- Additive-only changes; no refactor, redesign, abstraction, or modification of existing handlers.

The Implementation Report claims compliance with all of the above. The repository was inspected independently; the claims were not accepted at face value.

---

## 2. Evidence Collection

### 2.1 Baseline

```text
HEAD: afdef607 docs: add CURRENT_TASK-009 implementation report (G5)
```

### 2.2 Changed Files

```text
git diff --name-only
---
tests/mocks/supabase.ts
```

Only one tracked file is modified, which superficially satisfies the "files changed" constraint.

### 2.3 Diff Magnitude

```text
git diff --stat tests/mocks/supabase.ts
 tests/mocks/supabase.ts | 2932 ++++++++++++++++++++++++++++++++++++++++++++++-
 1 file changed, 2917 insertions(+), 15 deletions(-)
```

A two-RPC additive task should produce a small, localized diff. **2,917 insertions are inconsistent with adding only two handlers.**

### 2.4 Handler Count

| Version | `if (name === "...")` handlers | Delta |
|---|---|---|
| HEAD (`git show HEAD:tests/mocks/supabase.ts`) | 86 | — |
| Working tree | 169 | **+83** |

The working tree contains **83 more dispatch handlers** than HEAD.

### 2.5 New Handlers Added (vs. HEAD)

A diff-extracted list of all `+  if (name === '...')` lines shows **84 newly added handler names**, not 2. The two authorized RPCs are present, but they are accompanied by 82 additional handlers that were not authorized for CURRENT_TASK-024.

Complete list of added handler names (sorted, unique):

```text
accept_invitation
adjust_customer_debt
adjust_supplier_debt
can_use_feature
cancel_inventory_count_rpc
cancel_order
cancel_return_order_v2
cancel_supplier_exchange
check_product_barcode_exists
check_product_code_exists
check_stock_ledger_drift
complete_inventory_count
count_point_products
create_exchange_transaction
create_return_order
create_supplier_exchange
delete_2fa_backup_codes
delete_disposal_with_restore
delete_import_v2
delete_inventory_count_rpc
delete_order
filter_customers_rpc
filter_disposals_rpc
filter_import_receipts_rpc
filter_products_rpc
filter_return_orders_rpc
filter_suppliers_rpc
generate_2fa_backup_codes
generate_tenant_license
get_admin_login_alerts
get_admin_login_history
get_brand_product_counts
get_category_product_counts
get_churn_cohort_metrics
get_customer_debt_ledger
get_customer_report
get_customer_stats
get_dashboard_summary
get_disposal_auto_code
get_import_receipt_count_by_date
get_import_receipts_by_product_and_lot
get_import_receipts_by_supplier_id
get_import_stats
get_inventory_report
get_locked_emails
get_login_attempts
get_order_auto_code
get_product_by_barcode
get_product_stats
get_profit_report
get_return_order_auto_code
get_revenue_metrics
get_sales_report
get_stock_ledger
get_supplier_debt_ledger
get_supplier_report
get_supplier_stats
get_tenant_by_subdomain
get_tenant_security_settings
get_unsynced_brands
get_unsynced_categories
has_tenant_role
increment_product_quantity
is_2fa_enabled
is_system_admin
is_tenant_owner
list_2fa_backup_codes
lookup_invitation
pay_order_debt
pay_supplier_debt
process_checkout
process_import_v2
record_admin_login
record_login_attempt
search_customers_rpc
search_orders_rpc
search_products_rpc
search_suppliers_rpc
unlock_login_attempts
update_import_v2
update_tenant_ip_allowlist
update_tenant_session_timeout
validate_tenant_license
verify_2fa_backup_code
```

Only **`get_dashboard_summary`** and **`get_profit_report`** are in the authorized scope.

### 2.6 Existing Handler Removed

```text
git diff HEAD -- tests/mocks/supabase.ts | grep "^-.*if (name ==="
-  if (name === 'get_tenant_members_with_email') {
```

An existing handler (`get_tenant_members_with_email`) was deleted. This violates the additive-only constraint and the requirement to preserve existing handlers.

---

## 3. Acceptance Checklist

### 1. Scope — **FAIL**

Authorized: exactly `get_dashboard_summary` and `get_profit_report`.

Found: 84 added handlers, of which only 2 are authorized. The remaining 82 handlers span multiple domains (Auth, Identity, Security, Products, Customers, Suppliers, Inventory, Orders, Returns, Imports, Disposals, etc.) and were not authorized for CURRENT_TASK-024.

### 2. Files Changed — **PARTIAL PASS / FAIL**

Only `tests/mocks/supabase.ts` is modified among tracked files. However, the magnitude of change within that single file (2,917 insertions, 1 deleted handler) far exceeds the authorized two-handler addition.

### 3. Architecture Compliance — **FAIL**

The change is **not** additive only: an existing handler was removed, and 82 handlers outside the CURRENT_TASK boundary were added. The requirements `no refactor`, `no redesign`, `preserve`, `CURRENT_TASK boundary`, and `no duplicate` are violated because the diff reshapes the mock store and dispatch surface beyond the authorized scope.

### 4. Canonical Compliance — **PASS (for the 2 authorized handlers only)**

The two authorized handlers derive their parameter names and return keys from the canonical migration chain:

- `get_dashboard_summary` — `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 7090, returns `json` with `revenueData`, `topProducts`, `inventoryValue`/`inventoryRetailValue`, `debtCustomers`, `topCustomers`, plus scalar summary fields.
- `get_profit_report` — same file line 8151, returns `json` with `summary`, `dailyProfit`, `profitDetails`, `groupedByProduct`, `groupedByCustomer`, `groupedByDay`.

Canonical compliance of the two authorized handlers is correct, but this does not offset the scope violation.

### 5. Validation — **PASS on the gates themselves**

The following commands were run independently:

#### Audit

```text
npx tsx scripts/audit-rpc-contracts.ts
```

Result:

```text
Contract RPCs : 125
Code RPCs     : 125

RPC contracts and service code are in sync.
```

Exit code: `0`

#### Type Check

```text
npx tsc --noEmit
```

Exit code: `0` — no TypeScript errors.

#### Test Suite

```text
npx vitest run
```

Result:

```text
Test Files  68 passed (68)
Tests       389 passed (389)
```

Exit code: `0`

The validation gates are green, but they do not prove that CURRENT_TASK-024 stayed within scope.

### 6. Coverage — **NOT VERIFIED INDEPENDENTLY**

The claimed coverage of `152 / 183 (~83.1%)` could not be independently confirmed against the actual repository state because the diff contains far more than two new handlers. The operational audit script reports only contract-to-code sync for 125 RPCs, not mock coverage of 183 code RPCs.

### 7. Regression — **PASS**

No tests were removed and no tests failed. Audit and type gates remain green.

### 8. Scope Verification — **FAIL**

- More than 2 RPCs were implemented.
- The existing `get_tenant_members_with_email` handler was modified (removed).
- Additional store tables, helpers, counters, and builders were introduced beyond the authorized scope (evident in the diff).
- Side effect: the mock file now carries a large, unauthorized expansion of the in-memory contract surface.

---

## 4. Findings Summary

| # | Finding | Severity | Evidence |
|---|---|---|---|
| 1 | 84 handlers added instead of 2 | Critical | Diff list of `+  if (name === '...')` lines; handler count 86 → 169 |
| 2 | 82 unauthorized RPCs implemented | Critical | List in §2.5; only `get_dashboard_summary` and `get_profit_report` authorized |
| 3 | Existing handler `get_tenant_members_with_email` deleted | Major | `^-  if (name === 'get_tenant_members_with_email')` in diff |
| 4 | Diff size incompatible with additive-only two-RPC task | Major | `2917 insertions, 15 deletions` in a single file |
| 5 | Validation gates green | Informational | Audit exit 0, `tsc` exit 0, Vitest 389/389 pass |

---

## 5. Required Remediation

Before CURRENT_TASK-024 can be accepted, the engineering implementation must be corrected to match the authorized scope exactly:

1. **Revert or remove all handlers except `get_dashboard_summary` and `get_profit_report`.**
2. **Restore the deleted `get_tenant_members_with_email` handler.**
3. **Remove any unauthorized store state, helpers, counters, or builders** that were introduced solely to support the out-of-scope handlers.
4. Ensure the final diff for `tests/mocks/supabase.ts` reflects **only** the two authorized Domain H9 handlers and any store state strictly required by those two handlers.
5. Re-run `npx tsx scripts/audit-rpc-contracts.ts`, `npx tsc --noEmit`, and `npx vitest run` after the correction.

---

## 6. Decision

```text
FAIL
```

CURRENT_TASK-024 has not satisfied its authorized scope. The implementation contains the two required RPC handlers and they are canonically compliant, but it also introduces 82 additional RPC handlers and removes one existing handler. This violates the additive-only, CURRENT_TASK boundary, and preservation constraints defined in the Program Authorization and Architecture Decision.

No engineering remediation artifacts, Program Status Reviews, or CURRENT_TASK-025 documents are produced by this review. This review stops here pending corrective action.

---

*Review completed by Independent Acceptance Reviewer.*
