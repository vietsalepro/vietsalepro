# CURRENT_TASK-024 — Acceptance Remediation Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3i — Domain H9 — Reports & Dashboard Mock Coverage  
**Document Type:** Acceptance Remediation Report  
**Date:** 2026-07-15  
**Status:** REMEDIATION COMPLETE — Ready for Re-Review

---

## 1. Executive Summary

Independent Acceptance Review for CURRENT_TASK-024 returned **FAIL** because `tests/mocks/supabase.ts` contained scope contamination: 84 new dispatch handlers were added while only 2 were authorized, and the existing `get_tenant_members_with_email` handler was deleted.

This remediation reverted `tests/mocks/supabase.ts` to the HEAD baseline and re-applied **only** the 2 authorized Domain H9 handlers (`get_dashboard_summary`, `get_profit_report`) together with the minimal store tables required by those handlers (`order_items`, `customers`, `return_orders`, `return_order_items`). The deleted existing handler is restored to its HEAD state.

**Recommendation:** The task is ready for a new Independent Acceptance Review on the cleaned working tree.

---

## 2. Findings Remediated

| # | Finding | Severity | Remediation |
|---|---|---|---|
| 1 | 84 handlers added instead of 2 | Critical | Reverted `tests/mocks/supabase.ts` to HEAD; re-added only the 2 authorized H9 handlers. |
| 2 | 82 unauthorized RPCs implemented | Critical | Removed all out-of-scope handlers. |
| 3 | Existing handler `get_tenant_members_with_email` deleted | Major | Restored to its HEAD state by reverting the file. |
| 4 | Diff size incompatible with additive-only two-RPC task (2917 insertions) | Major | Final diff is 245 insertions in a single file, consistent with the authorized scope. |

---

## 3. Remediation Actions Performed

### 3.1 Reverted scope-contaminated mock file to HEAD

`tests/mocks/supabase.ts` was reverted to `HEAD` to remove all unauthorized handlers, helpers, counters, builders, and store state introduced outside the CURRENT_TASK-024 scope.

### 3.2 Removed unauthorized handlers

The following 82 handlers were present in the failed implementation and are **not** authorized for CURRENT_TASK-024. They were removed by the revert:

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

### 3.3 Preserved and restored existing handler

- `get_tenant_members_with_email` — restored to its HEAD state. The failed diff had removed one of its two pre-existing dispatch blocks; the revert brought back the HEAD state in full.

### 3.4 Added only the 2 authorized handlers

- `get_dashboard_summary`
- `get_profit_report`

Both handlers derive parameter names and return keys from the canonical migration `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` (lines 7090 and 8151).

### 3.5 Added minimal store state required by authorized handlers

Only the following 4 empty store tables were added because the 2 authorized H9 report handlers read from them:

- `order_items`
- `customers`
- `return_orders`
- `return_order_items`

No unauthorized helpers, counters, or builders were introduced.

---

## 4. Scope Verification

### 4.1 Tracked changes after remediation

```text
git status --short
```

Result:

```text
 M tests/mocks/supabase.ts
```

### 4.2 Diff summary

```text
git diff --stat tests/mocks/supabase.ts
```

Result:

```text
tests/mocks/supabase.ts | 245 ++++++++++++++++++++++++++++++++
 1 file changed, 245 insertions(+)
```

### 4.3 Handler inventory

| Version | `if (name === "...")` handlers | Delta |
|---|---|---|
| HEAD | 86 | — |
| Remediated working tree | 88 | +2 |

Only the 2 authorized handlers were added. No existing handler was removed.

### 4.4 Added handlers

```text
+  if (name === 'get_dashboard_summary') {
+  if (name === 'get_profit_report') {
```

### 4.5 Removed handlers

```text
0 removed
```

### 4.6 Scope Lock Verification

| Criterion | Expected | Verified | Result |
|---|---|---|---|
| Only authorized H9 mock file changed | `tests/mocks/supabase.ts` only | Only `tests/mocks/supabase.ts` is modified | PASS |
| Exactly 2 authorized RPCs | `get_dashboard_summary`, `get_profit_report` | 2 new handlers, names verified | PASS |
| No unauthorized handlers | None | 82 unauthorized handlers removed | PASS |
| Preserve existing handlers | No deletion | `get_tenant_members_with_email` and all others restored to HEAD | PASS |
| No production code changes | None | No production files changed | PASS |
| No migration / schema / generated type changes | None | No changes | PASS |
| No audit script change | `scripts/audit-rpc-contracts.ts` at HEAD | No change | PASS |
| No CI / package.json changes | None | No changes | PASS |
| No new governance / CURRENT_TASK-025 | None | None created | PASS |

---

## 5. Validation Results

### 5.1 Audit Gate

Command:

```text
npx tsx scripts/audit-rpc-contracts.ts
```

Result:

```text
Contract RPCs : 125
Code RPCs     : 125

RPC contracts and service code are in sync.
```

- Exit code: **0**
- The HEAD version of `scripts/audit-rpc-contracts.ts` compares RPC call sites in `services/` and `lib/` against `docs/admin-dashboard/RPC_CONTRACTS.md`. It reports the two sets are in sync.
- 0 duplicate handler (relative to the audit script's contract/code comparison).
- 0 stale mock (relative to the audit script's contract/code comparison).

### 5.2 Type Gate

Command:

```text
npx tsc --noEmit
```

Result:

- Exit code: **0**
- No TypeScript errors.

### 5.3 Test Gate

Command:

```text
npx vitest run
```

Result:

- Exit code: **0**
- Test files: **68 passed**
- Tests: **389 passed**
- Failures: **0**
- Pre-existing recharts `-1 dimension` warnings on stderr (non-fatal, recorded in prior tasks).

### 5.4 Regression Check

- Test count did not decrease relative to the HEAD baseline.
- No existing tests failed.
- Type gate remains green.
- Audit gate remains green (exit 0).

---

## 6. Files Changed (Final)

| File | Change Type | Summary |
|---|---|---|
| `tests/mocks/supabase.ts` | Additive | Added 2 Domain H9 — Reports & Dashboard RPC handlers (`get_dashboard_summary`, `get_profit_report`) using the existing `if (name === "...")` dispatch chain, and added 4 empty store tables (`order_items`, `customers`, `return_orders`, `return_order_items`) required by those handlers. No existing handler was modified. |

No other tracked files were modified by CURRENT_TASK-024 after remediation.

---

## 7. Stop Condition

This remediation report completes the required corrective action for CURRENT_TASK-024. No Engineering Kickoff, Implementation Report, Acceptance Review v2, Program Status Review, or CURRENT_TASK-025 documents are produced by this report. The working tree awaits Independent Acceptance Review (v2) before the program may continue.

---

*Remediation completed by Senior Software Engineer.*
