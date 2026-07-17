# PHASE4 Coverage Reconciliation Audit

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Document Type:** Independent Coverage Reconciliation Audit  
**Date:** 2026-07-16  
**Authority:** Independent audit — no code changes, no implementation, no new CURRENT_TASK, no phase transition.  

---

## 1. Documents Reviewed (in order)

1. `SYSTEM_RECOVERY_MASTER_PLAN.md`
2. `CURRENT_PHASE.md`
3. `PHASE4_COVERAGE_ROADMAP.md`
4. `PHASE4_ACCEPTANCE_RECORD.md`
5. `CURRENT_TASK-029_PROGRAM_STATUS_REVIEW.md`
6. `PHASE4_FINAL_EXIT_REVIEW.md`
7. `PHASE4_CORRECTIVE_ACTION_REPORT.md`
8. Per-task Implementation Reports / Acceptance Reviews / Program Status Reviews for CURRENT_TASK-022 through CURRENT_TASK-029.

---

## 2. Scope & Methodology

- **Code RPC inventory:** every `supabase.rpc('...')` call in `services/`, `lib/`, `utils/` (recursive). Unique names counted once regardless of how many call sites.
- **Mock handler inventory:** every handler registration in `tests/mocks/supabase.ts`. Detected by scanning all `name === "..."` string comparisons (covers `if` / `else if` and any nested branch that uses the same comparison). No `switch`, `Map`, factory, or delegated dispatcher was found.
- **Reconciliation:** CODE RPC `x` is *matched* if there is a mock handler for the same name; *missing* if no handler exists; *mock handler not used* if the handler name never appears in code.
- Temporary scripts were used only for extraction and were deleted after producing this report.

---

## 3. CODE RPC INVENTORY

| Metric | Value |
|---|---|
| Unique code RPC names found | **184** |
| Called from multiple files | `is_system_admin` (services/tenantService.ts + lib/permissions.ts), `get_churn_cohort_metrics` / `get_revenue_metrics` (services/admin/analyticsAdminService.ts + services/billingAutomationService.ts), `get_tenant_by_subdomain` (multiple calls in lib/tenant.ts) |
| Note | The canonical audit script `scripts/audit-rpc-contracts.ts` reports 183 code RPCs because its regex does not match `.rpc(` when it is on a different line from `supabase` (see `complete_disposal` at services/supabaseService.ts:3519–3520). |

### Complete list of 184 unique code RPCs

```text
accept_invitation
add_system_admin
adjust_customer_debt
adjust_supplier_debt
apply_voucher_to_invoice
bulk_update_tenants
can_use_feature
cancel_inventory_count_rpc
cancel_order
cancel_return_order_v2
cancel_supplier_exchange
check_product_barcode_exists
check_product_code_exists
check_stock_ledger_drift
claim_heavy_op_job
complete_disposal
complete_heavy_op_job
complete_inventory_count
confirm_payment
count_point_products
create_exchange_transaction
create_gdpr_request
create_integration
create_invoice
create_maintenance_window
create_partner
create_plan
create_return_order
create_supplier_exchange
create_tenant_api_key
create_tenant_webhook
create_tenant_with_admin
delete_2fa_backup_codes
delete_disposal_with_restore
delete_import_v2
delete_integration
delete_inventory_count_rpc
delete_maintenance_window
delete_order
delete_partner
delete_plan
delete_tenant_safe
delete_tenant_webhook
enqueue_heavy_op_job
export_tenant_data
filter_customers_rpc
filter_disposals_rpc
filter_import_receipts_rpc
filter_products_rpc
filter_return_orders_rpc
filter_suppliers_rpc
gdpr_delete_user_data
gdpr_export_user_data
generate_2fa_backup_codes
generate_tenant_license
get_admin_login_alerts
get_admin_login_history
get_billing_automation_status
get_billing_job_logs
get_billing_reminder_config
get_brand_product_counts
get_category_product_counts
get_churn_cohort_metrics
get_connection_pool_stats
get_current_announcements_for_tenant
get_current_user_tenants
get_customer_debt_ledger
get_customer_report
get_customer_stats
get_dashboard_summary
get_data_retention_config
get_data_retention_status
get_default_plan_limits
get_disposal_auto_code
get_fraud_detection_config
get_fraud_queue
get_fraud_stats
get_gdpr_requests
get_heavy_op_jobs
get_import_receipt_count_by_date
get_import_receipts_by_product_and_lot
get_import_receipts_by_supplier_id
get_import_stats
get_in_app_messages_for_tenant
get_inventory_report
get_locked_emails
get_login_attempts
get_maintenance_mode
get_maintenance_windows
get_order_auto_code
get_pending_billing_reminders
get_plan_by_key
get_plans
get_product_by_barcode
get_product_stats
get_profit_report
get_promo_code_usage_counts
get_rate_limit_logs
get_read_replica_status
get_return_order_auto_code
get_revenue_metrics
get_sales_report
get_stock_ledger
get_supplier_debt_ledger
get_supplier_report
get_supplier_stats
get_system_admins
get_system_overview
get_tenant_by_domain
get_tenant_by_subdomain
get_tenant_feature_flags
get_tenant_growth
get_tenant_members_with_email
get_tenant_security_settings
get_tenant_storage_usage
get_tenant_usage_summary
get_tenants_admin
get_terms_acceptances
get_top_tenants
get_unsynced_brands
get_unsynced_categories
has_tenant_role
increment_product_quantity
is_2fa_enabled
is_system_admin
is_tenant_owner
list_2fa_backup_codes
list_integrations
list_partners
list_tenant_api_keys
list_tenant_webhooks
list_webhook_deliveries
lookup_invitation
mark_in_app_message_read
migrate_tenant_data
pay_order_debt
pay_supplier_debt
process_checkout
process_import_v2
record_admin_login
record_login_attempt
record_terms_acceptance
remove_system_admin
remove_tenant_member
reset_demo_data
reset_monthly_order_counter
retry_heavy_op_job
retry_webhook_delivery
revoke_tenant_api_key
run_data_retention
run_fraud_detection
search_customers_rpc
search_orders_rpc
search_products_rpc
search_suppliers_rpc
search_tenant_members
search_tenants
send_billing_reminders
send_in_app_message
set_billing_reminder_config
set_data_retention_config
set_default_plan_limits
set_fraud_detection_config
set_maintenance_mode
set_tenant_subdomain
toggle_tenant_member_active
trigger_webhook_event
unlock_login_attempts
update_fraud_queue_status
update_import_v2
update_integration
update_maintenance_window
update_partner
update_plan
update_tenant
update_tenant_feature_flags
update_tenant_ip_allowlist
update_tenant_member_role
update_tenant_session_timeout
update_tenant_subscription
update_tenant_webhook
validate_promo_code
validate_tenant_license
verify_2fa_backup_code
```

---

## 4. MOCK HANDLER INVENTORY

| Metric | Value |
|---|---|
| Unique handler names in `tests/mocks/supabase.ts` | **116** |
| `if (name === "...")` occurrences | **117** |
| Duplicate handlers | **1** — `get_tenant_members_with_email` appears twice |
| Registration pattern | Flat `if (name === "...")` chain only; no `switch`, no `Map`, no factory, no helper dispatcher, no delegated dispatch |

### Complete list of 116 unique mock handlers

```text
add_system_admin
apply_voucher_to_invoice
bulk_update_tenants
check-subdomain
claim_heavy_op_job
complete_heavy_op_job
confirm_payment
create-system-admin
create_gdpr_request
create_integration
create_invoice
create_maintenance_window
create_partner
create_plan
create_tenant_api_key
create_tenant_webhook
create_tenant_with_admin
delete-tenant
delete_integration
delete_maintenance_window
delete_partner
delete_plan
delete_tenant_safe
delete_tenant_webhook
end-impersonation
enqueue_heavy_op_job
error-performance
export_tenant_data
gdpr_delete_user_data
gdpr_export_user_data
get_billing_automation_status
get_billing_job_logs
get_billing_reminder_config
get_connection_pool_stats
get_current_announcements_for_tenant
get_current_user_tenants
get_data_retention_config
get_data_retention_status
get_default_plan_limits
get_fraud_detection_config
get_fraud_queue
get_fraud_stats
get_gdpr_requests
get_heavy_op_jobs
get_in_app_messages_for_tenant
get_maintenance_mode
get_maintenance_windows
get_pending_billing_reminders
get_plan_by_key
get_plans
get_promo_code_usage_counts
get_rate_limit_logs
get_read_replica_status
get_system_admins
get_system_overview
get_tenant_by_domain
get_tenant_feature_flags
get_tenant_growth
get_tenant_members_with_email
get_tenant_storage_usage
get_tenant_usage_summary
get_tenants_admin
get_terms_acceptances
get_top_tenants
impersonate-tenant
invite-member
list_integrations
list_partners
list_tenant_api_keys
list_tenant_webhooks
list_webhook_deliveries
mark_in_app_message_read
migrate_tenant_data
record_terms_acceptance
remove_system_admin
remove_tenant_member
reset-password
reset_demo_data
reset_monthly_order_counter
retry_heavy_op_job
retry_webhook_delivery
revoke_tenant_api_key
run_data_retention
run_fraud_detection
search_tenant_members
search_tenants
send-billing-email
send-sms
send-template-email
send-ticket-email
send_billing_reminders
send_in_app_message
set_billing_reminder_config
set_data_retention_config
set_default_plan_limits
set_fraud_detection_config
set_maintenance_mode
set_tenant_subdomain
system-backup
system-health
tenant-backup
tenant-restore
toggle_tenant_member_active
trigger_webhook_event
update_fraud_queue_status
update_integration
update_maintenance_window
update_partner
update_plan
update_tenant
update_tenant_feature_flags
update_tenant_member_role
update_tenant_status
update_tenant_subscription
update_tenant_webhook
validate_promo_code
```

---

## 5. CODE RPC → MOCK HANDLER RECONCILIATION

| Category | Count | Notes |
|---|---|---|
| **Matched RPCs** | **99** | Code RPC that has a mock handler |
| **Missing Mock RPCs** | **85** (vs 184 code RPCs) or **84** (vs 183 used in program documents) | Code RPC with no handler in `tests/mocks/supabase.ts` |
| **Mock Handlers Not Used By Code** | **17** | 16 Supabase Edge Function handlers + `update_tenant_status` orphan |

### A. Matched RPCs (99)

```text
add_system_admin
apply_voucher_to_invoice
bulk_update_tenants
claim_heavy_op_job
complete_heavy_op_job
confirm_payment
create_gdpr_request
create_integration
create_invoice
create_maintenance_window
create_partner
create_plan
create_tenant_api_key
create_tenant_webhook
create_tenant_with_admin
delete_integration
delete_maintenance_window
delete_partner
delete_plan
delete_tenant_safe
delete_tenant_webhook
enqueue_heavy_op_job
export_tenant_data
gdpr_delete_user_data
gdpr_export_user_data
get_billing_automation_status
get_billing_job_logs
get_billing_reminder_config
get_connection_pool_stats
get_current_announcements_for_tenant
get_current_user_tenants
get_data_retention_config
get_data_retention_status
get_default_plan_limits
get_fraud_detection_config
get_fraud_queue
get_fraud_stats
get_gdpr_requests
get_heavy_op_jobs
get_in_app_messages_for_tenant
get_maintenance_mode
get_maintenance_windows
get_pending_billing_reminders
get_plan_by_key
get_plans
get_promo_code_usage_counts
get_rate_limit_logs
get_read_replica_status
get_system_admins
get_system_overview
get_tenant_by_domain
get_tenant_feature_flags
get_tenant_growth
get_tenant_members_with_email
get_tenant_storage_usage
get_tenant_usage_summary
get_tenants_admin
get_terms_acceptances
get_top_tenants
list_integrations
list_partners
list_tenant_api_keys
list_tenant_webhooks
list_webhook_deliveries
mark_in_app_message_read
migrate_tenant_data
record_terms_acceptance
remove_system_admin
remove_tenant_member
reset_demo_data
reset_monthly_order_counter
retry_heavy_op_job
retry_webhook_delivery
revoke_tenant_api_key
run_data_retention
run_fraud_detection
search_tenant_members
search_tenants
send_billing_reminders
send_in_app_message
set_billing_reminder_config
set_data_retention_config
set_default_plan_limits
set_fraud_detection_config
set_maintenance_mode
set_tenant_subdomain
toggle_tenant_member_active
trigger_webhook_event
update_fraud_queue_status
update_integration
update_maintenance_window
update_partner
update_plan
update_tenant
update_tenant_feature_flags
update_tenant_member_role
update_tenant_subscription
update_tenant_webhook
validate_promo_code
```

### B. Missing Mock RPCs (85)

Grouped by the domain/task that claimed to have covered them:

#### Domain A — Auth, Identity & Security (CURRENT_TASK-014)

- `can_use_feature`
- `has_tenant_role`
- `is_system_admin`
- `is_tenant_owner`
- `get_tenant_by_subdomain`
- `delete_2fa_backup_codes`
- `generate_2fa_backup_codes`
- `is_2fa_enabled`
- `list_2fa_backup_codes`
- `verify_2fa_backup_code`
- `get_locked_emails`
- `get_login_attempts`
- `get_tenant_security_settings`
- `record_login_attempt`
- `unlock_login_attempts`
- `update_tenant_ip_allowlist`
- `update_tenant_session_timeout`
- `get_admin_login_alerts`
- `get_admin_login_history`
- `record_admin_login`

#### Domain B — Tenant Admin & Licensing (CURRENT_TASK-015)

- `accept_invitation`
- `lookup_invitation`
- `generate_tenant_license`
- `validate_tenant_license`
- `get_churn_cohort_metrics`
- `get_revenue_metrics`

#### Domain H1 — Products & Catalog (CURRENT_TASK-016)

- `check_product_barcode_exists`
- `check_product_code_exists`
- `count_point_products`
- `get_brand_product_counts`
- `get_category_product_counts`
- `get_product_by_barcode`
- `get_product_stats`
- `get_unsynced_brands`
- `get_unsynced_categories`
- `search_products_rpc`
- `filter_products_rpc`

#### Domain H5 — Customers (CURRENT_TASK-017)

- `adjust_customer_debt`
- `get_customer_debt_ledger`
- `get_customer_report`
- `get_customer_stats`
- `search_customers_rpc`
- `filter_customers_rpc`

#### Domain H6 — Suppliers (CURRENT_TASK-018)

- `adjust_supplier_debt`
- `get_supplier_debt_ledger`
- `get_supplier_report`
- `get_supplier_stats`
- `search_suppliers_rpc`
- `filter_suppliers_rpc`
- `pay_supplier_debt`

#### Domain H2 — Inventory & Stock (CURRENT_TASK-019)

- `check_stock_ledger_drift`
- `complete_inventory_count`
- `cancel_inventory_count_rpc`
- `delete_inventory_count_rpc`
- `get_stock_ledger`
- `increment_product_quantity`
- `get_inventory_report`

#### Domain H3 — Orders & Sales (CURRENT_TASK-020)

- `cancel_order`
- `delete_order`
- `get_order_auto_code`
- `get_sales_report`
- `process_checkout`
- `search_orders_rpc`
- `pay_order_debt`

#### Domain H4 — Returns & Exchanges (CURRENT_TASK-021)

- `cancel_return_order_v2`
- `create_return_order`
- `create_supplier_exchange`
- `cancel_supplier_exchange`
- `create_exchange_transaction`
- `filter_return_orders_rpc`
- `get_return_order_auto_code`

#### Domain H7 — Imports (CURRENT_TASK-022)

- `delete_import_v2`
- `process_import_v2`
- `update_import_v2`
- `filter_import_receipts_rpc`
- `get_import_receipt_count_by_date`
- `get_import_receipts_by_product_and_lot`
- `get_import_receipts_by_supplier_id`
- `get_import_stats`

#### Domain H8 — Disposals (CURRENT_TASK-023)

- `complete_disposal`
- `delete_disposal_with_restore`
- `filter_disposals_rpc`
- `get_disposal_auto_code`

#### Domain H9 — Reports & Dashboard (CURRENT_TASK-024)

- `get_dashboard_summary`
- `get_profit_report`

### C. Mock Handlers Not Used By Code (17)

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

---

## 6. Cross-Check vs PHASE4_COVERAGE_ROADMAP.md

| Task | Claimed Domain / RPCs | Actual handlers present in current `tests/mocks/supabase.ts` | Finding |
|---|---|---|---|
| CURRENT_TASK-014 | Domain A — 20 RPCs | **0 of 20** present | Claimed coverage not implemented |
| CURRENT_TASK-015 | Domain B — 6 RPCs | **0 of 6** present | Claimed coverage not implemented |
| CURRENT_TASK-016 | Domain H1 — 11 RPCs | **0 of 11** present | Claimed coverage not implemented |
| CURRENT_TASK-017 | Domain H5 — 6 RPCs | **0 of 6** present | Claimed coverage not implemented |
| CURRENT_TASK-018 | Domain H6 — 7 RPCs | **0 of 7** present | Claimed coverage not implemented |
| CURRENT_TASK-019 | Domain H2 — 7 RPCs | **0 of 7** present | Claimed coverage not implemented |
| CURRENT_TASK-020 | Domain H3 — 7 RPCs | **0 of 7** present | Claimed coverage not implemented |
| CURRENT_TASK-021 | Domain H4 — 7 RPCs | **0 of 7** present | Claimed coverage not implemented |
| CURRENT_TASK-022 | Domain H7 — 8 RPCs | **0 of 8** present | Claimed coverage not implemented |
| CURRENT_TASK-023 | Domain H8 — 3 RPCs (+ `complete_disposal`) | **0 of 4** present | Claimed coverage not implemented |
| CURRENT_TASK-024 | Domain H9 — 2 RPCs | **0 of 2** present | Claimed coverage not implemented |
| CURRENT_TASK-025 | Domain D — 8 RPCs | **8 of 8** present | Verified |
| CURRENT_TASK-026 | Domain E — 10 RPCs | **10 of 10** present | Verified |
| CURRENT_TASK-027 | Domain C — 7 RPCs | **7 of 7** present | Verified |
| CURRENT_TASK-028 | Domain F — 3 RPCs | **3 of 3** present | Verified |
| CURRENT_TASK-029 | Domain G — 3 RPCs | **3 of 3** present | Verified |

**Net result:** Only the last five tasks (D, E, C, F, G — 31 RPCs) actually added handlers. The preceding eleven tasks (A, B, H1–H9 — 84 RPCs, or 85 if `complete_disposal` is counted) produced no matching handler in the current mock file.

---

## 7. Coverage Progression Trace (CURRENT_TASK-022 → 029)

The progression shown in the prompt:

```text
68 → 147 → 150 → 152 → 160 → 170 → 177 → 180 → 183
```

corresponds to adding the authorized RPC counts of each wave to the previous cumulative total:

| Step | Cumulative Claimed | Delta Source | Arithmetic |
|---|---|---|---|
| Baseline (after CURRENT_TASK-013) | 68 | — | — |
| After CURRENT_TASK-014…022 | 147 | +79 | 20 + 6 + 11 + 6 + 7 + 7 + 7 + 7 + 8 |
| After CURRENT_TASK-023 | 150 | +3 | Domain H8 |
| After CURRENT_TASK-024 | 152 | +2 | Domain H9 |
| After CURRENT_TASK-025 | 160 | +8 | Domain D |
| After CURRENT_TASK-026 | 170 | +10 | Domain E |
| After CURRENT_TASK-027 | 177 | +7 | Domain C |
| After CURRENT_TASK-028 | 180 | +3 | Domain F |
| After CURRENT_TASK-029 | 183 | +3 | Domain G |

### Methodology assessment

1. **No automatic mock-coverage measurement exists.** `scripts/audit-rpc-contracts.ts` only checks that code RPCs are declared in migrations; it does **not** report how many code RPCs have mock handlers.
2. The per-task coverage numbers were computed by adding the *authorized* RPC count of each task to the prior total (see table above). This is internally consistent arithmetic **if and only if** every task actually added its authorized handlers.
3. The verification method stated in the reports is “confirming the presence of the N new handlers.” The current file shows those confirmations were incorrect for tasks 014–024.
4. Therefore the progression from 68 to 183 is arithmetically sound but empirically false: it relies on 84 (or 85) handlers that are not in the repository.

---

## 8. Other Findings

1. **Duplicate mock handler:** `get_tenant_members_with_email` is registered twice in `tests/mocks/supabase.ts`.
2. **Orphan mock handler:** `update_tenant_status` is mocked but never called by code.
3. **Edge-function handlers:** 16 handlers with hyphenated names (e.g., `invite-member`, `system-health`) are present but are not called by `services/`, `lib/`, or `utils/`.
4. **Audit-script undercount:** `scripts/audit-rpc-contracts.ts` misses `complete_disposal` because its regex `/supabase\.rpc\('...\)/` does not span the line break between `await supabase` and `.rpc(...).` This is why it reports 183 code RPCs while the independent scan finds 184.

---

## 9. Conclusion

**B. Coverage thực sự là 99 / 183 → PHASE4_ACCEPTANCE_RECORD.md và CURRENT_TASK-029_PROGRAM_STATUS_REVIEW.md (cùng chuỗi Program Status Review tương ứng) sai.**

**Evidence:**

- Independent scan found **99 / 184** code RPCs with matching mock handlers.
- When using the same denominator (183) used in the disputed documents, **84 code RPCs have no mock handler** (or 85 if the independently-discovered `complete_disposal` is included).
- The 84 missing RPCs correspond exactly to the domains/tasks CURRENT_TASK-014 through CURRENT_TASK-024 claimed to complete.
- Only CURRENT_TASK-025 through CURRENT_TASK-029 actually added handlers, accounting for the **31** RPC increase from the baseline of **68** to the actual **99**.
- The 183/183 figure is therefore unsupported by the current repository state.

**Recommendation:** Do not accept the 183/183 coverage claim. Re-audit or re-implement the missing handlers for CURRENT_TASK-014 through CURRENT_TASK-024 before closing Phase 4.
