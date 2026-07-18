# SCAR Phase 1 Report -- VietSalePro v7

**Date:** 2025-07-15
**Scope:** Schema inventory, migration consistency, RPC contract analysis, SSOT verification

---

## Executive Summary

| Metric | Value | Health |
|---|---|---|
| Migration files | 138 | -- |
| Orphan SQL files (outside migrations/) | 17 | RED |
| Unique tables (live) | ~90 | -- |
| Functions defined (unique names) | 250+ | -- |
| Functions in baseline alone | 233 | YELLOW |
| Triggers | 31 | -- |
| RLS policies | ~148 | -- |
| Views | 0 | -- |
| Extensions | 6 unique | -- |
| Custom types/enums | 2 | -- |
| Indexes | 178 | -- |
| Unique RPCs called from frontend/edge | ~160 | -- |
| **RPCs matched (defined in migrations)** | **~156** | GREEN |
| **RPCs MISSING (called but never defined)** | **4** | **RED** |
| Naming convention patterns | 17+ | RED |
| Timestamp year-jump (2025->2026) | 84 files | RED |
| Rollback scripts | 1 / 138 | RED |

**Overall SCAR-P1 Score: 62 / 100** (Fair -- critical gaps exist)

---

## PART 1: Database Schema Inventory

### 1.1 Tables (~90 unique live tables)

**Baseline tables (74):** system_admins, heavy_ops_jobs, payments, invoices, tenants, billing_job_logs, tenant_subscriptions, tenant_api_keys, customers, suppliers, notification_logs, admin_2fa_backup_codes, admin_login_history, announcements, app_audit_log, app_audit_log_partitioned, app_settings, bank_accounts, billing_email_logs, brands, categories, customer_payment_ledger, disposal_items, disposals, einvoice_config, einvoice_orders, email_templates, error_logs, fraud_queue, import_items, import_receipts, integrations, inventory_count_items, inventory_counts, inventory_movements, invoice_items, invoice_number_counters, invoice_reminder_logs, maintenance_windows, order_items, order_items_archive, orders, orders_archive, partners, plans, point_history, processed_operations, product_lots, products, promo_code_usages, promo_codes, promotion_rules, promotions, rank_configs, rank_history, rate_limit_logs, return_order_items, return_orders, rewards, stock_movements, supplier_exchange_received_items, supplier_exchange_return_items, supplier_exchanges, supplier_payment_ledger, support_tickets, system_settings, tenant_memberships, tenant_registration_events, tenant_webhooks, terms_acceptance, ticket_replies, ticket_reply_templates, webhook_deliveries

**Tables added in later migrations (16):** db_maintenance_jobs, admin_roles, admin_role_assignments, licenses, tenant_usage_records, cron_job_logs, billing_reminder_logs, admin_events, gdpr_requests, gdpr_deletion_logs, login_attempts, audit_log, invitations, plan_features, tenant_credentials, admin_2fa_backup_code_attempts, tenant_restore_snapshots

**Tables dropped (10):** All were backup/temporary tables cleaned up in `phase14_cleanup_backup_tables`.

### 1.2 Views

**Total: 0.** The project does not use database views.

### 1.3 Functions / RPCs

**Total unique function names: 250+** across 138 migration files.

- Baseline migration defines **233 functions** -- the vast majority of business logic
- Later migrations add **~50 new functions** and **redefine ~30 baseline functions**
- Security model: ~85% `SECURITY DEFINER`, ~15% `SECURITY INVOKER`

**Functions redefined multiple times (signature evolution):**

| Function | Redefinition count | Latest migration |
|---|---|---|
| update_tenant | 6+ | fix_update_tenant_overload, phase_p18_* |
| process_checkout_tenant | 5 | phase9_5 -> safeupdate -> read_only_tenant |
| process_checkout | 3 | phase9_5 -> safeupdate -> read_only_tenant |
| trg_audit_log (trigger) | 4 | create_audit_triggers -> fix_* series |
| get_plans / create_plan / update_plan | 2 each | sp3_1_plans_crud_features |
| get_top_tenants | 2 | fix_admin_tenant_rpc_signatures |
| has_tenant_role / is_tenant_owner | 2-3 | fix_rls_helpers_enum_compare |
| is_system_admin | 2 | fix_is_system_admin_service_role |

### 1.4 Triggers (31 unique)

Key triggers cover: audit logging (orders, products, imports, disposals, tenants, memberships, subscriptions), user tracking (products, orders, customers, suppliers, categories, brands, tenants), guardrails (tenant delete, membership changes), updated_at stamps (support_tickets, announcements, email_templates, maintenance_windows, admin_roles, plan_features).

### 1.5 RLS Policies (~148)

Heavy RLS coverage across all tenant-scoped tables. Key patterns:
- Tenant isolation via `current_tenant_id()` helper
- System admin bypass policies
- Service role ALL policies for edge functions
- Per-operation granularity (SELECT/INSERT/UPDATE/DELETE)

### 1.6 Extensions (6 unique)

| Extension | Purpose | First enabled |
|---|---|---|
| uuid-ossp | UUID generation | baseline |
| pgcrypto | Encryption/hashing | 2FA, API keys, fraud |
| pg_cron | Scheduled jobs | billing reminders, announcements, cleanup |
| pg_net | HTTP requests from DB | billing reminders, webhooks |
| pg_stat_statements | Query performance | error_performance |
| pgtap | Testing framework | install_pgtap |

Note: `pg_cron` is enabled 7 times across migrations (idempotent `CREATE EXTENSION IF NOT EXISTS`).

### 1.7 Custom Types / Enums (2)

| Type | Values | Migration |
|---|---|---|
| tenant_role | owner, admin, member, viewer | add_role_enum |
| invitation_status | pending, accepted, expired, revoked | create_invitations_table |

### 1.8 Indexes (178)

Comprehensive indexing across all major tables. Notable patterns:
- Composite indexes for tenant isolation (`tenant_id` + business key)
- Unique constraints for business rules (e.g., `idx_fq_active_type_target`)
- Performance indexes for reporting queries

---

## PART 2: Migration Consistency Assessment

### 2.1 Timestamp Analysis

**CRITICAL: Year jump from 2025 to 2026**

| Range | Files | Date range |
|---|---|---|
| 2025-dated | 54 | 20250703 - 20250713 |
| 2026-dated | 84 | 20260708 - 20260728 |

The last 2025 file is `20250713000022_phase3_subscription_lifecycle_rpc.sql`.
The first 2026 file is `20260708000000_phase_p18_1_tenant_isolation.sql`.

**This is almost certainly a typo** -- 84 migrations are future-dated by ~1 year. Supabase will still run them in order, but this creates confusion and makes it impossible to insert new migrations between the two date ranges.

### 2.2 Timestamp Gaps

| Gap | From | To | Missing |
|---|---|---|---|
| 1 | 20250705000010 | 20250705000015 | 11-14 (4 slots) |
| 2 | 20250708000011 | 20250708000013 | 12 (1 slot) |
| 3 | 20250709000001 | 20250711000001 | All of 20250710 |
| 4 | 20250711000002 | 20250713000022 | All of 20250712, 20250713000000-21 |
| 5 | 20250713000022 | 20260708000000 | ~1 year gap |

No duplicate timestamps found. All 138 files have unique prefixes.

### 2.3 Naming Convention Chaos (17+ patterns)

| Pattern | Example | Count |
|---|---|---|
| `phaseX_Y` | phase2_tenant_foundation | ~10 |
| `phase_pX_Y` | phase_p1_tenant_list_core_management | ~20 |
| `phase_X` | phase_5_long_term_explicit_grants | ~3 |
| `fix_` | fix_update_tenant_overload | ~11 |
| `f33_` | f33_members_search_rpc | ~6 |
| `spX_Y` / `sp_X_Y` | sp3_4_usage_metering / sp_7_1_set_tenant_subdomain | ~12 |
| `add_` | add_tenant_credentials_table | ~10 |
| `create_` | create_rls_helper_functions | ~7 |
| `enable_` | enable_rls_tenants | ~2 |
| `bootstrap_` | bootstrap_system_admin | 1 |
| `admin_` | admin_security_settings | ~3 |
| `standardize_` | standardize_tenants_and_memberships | 1 |
| `update_` | update_billing_schema | 1 |
| `install_` | install_pgtap | 1 |
| `gdpr_` | gdpr_export_functions | 1 |
| `login_` | login_audit_triggers | 1 |
| `phase6_3_` | phase6_3_support_ticket_sla | 1 |

Also inconsistent within the `sp` pattern: `sp1_6` vs `sp_7_1`.

### 2.4 Orphan SQL Files (17 files)

These files sit in `supabase/` root, NOT inside `migrations/`. They will **never** be executed by Supabase's migration runner:

1. migration_f33_invite_rate_limit_tenant.sql
2. migration_f33_members_guardrails.sql
3. migration_f33_members_status_activation.sql
4. migration_fix_stock_ledger_phase2_backfill_v2.sql
5. migration_phase10_reports.sql
6. migration_phase1_security_cleanup.sql
7. migration_phase3a_import_cost_ssot.sql
8. migration_phase6_stock_ledger_hardening.sql (+ part1 through part6, 5a, 5b, 5c)

Some of these (`f33_*`) have corresponding migrations in the `migrations/` folder already. The `phase6_stock_ledger_hardening_*` series (10 files) appears to be a manual multi-step migration that was never formalized.

### 2.5 Rollback Coverage

**1 rollback script out of 138 migrations** (0.7% coverage).

Only `20260713000002_standardize_tenants_and_memberships_down.sql` exists in `migrations/rollback/`.

### 2.6 Migration Consistency Score

| Factor | Weight | Score | Notes |
|---|---|---|---|
| No duplicate timestamps | 15% | 15/15 | Clean |
| Sequential ordering | 20% | 8/20 | Year jump, gaps |
| Naming consistency | 15% | 3/15 | 17+ patterns |
| No orphan files | 10% | 3/10 | 17 orphans |
| Rollback coverage | 10% | 1/10 | 0.7% |
| Idempotency (IF NOT EXISTS) | 15% | 12/15 | Mostly good |
| Function redefinition hygiene | 15% | 10/15 | Some messy overload drops |
| **Total** | **100%** | **52/100** | **Poor** |

---

## PART 3: RPC Contract Analysis

### 3.1 Summary

| Metric | Count |
|---|---|
| Unique RPC names called from frontend/edge | ~160 |
| RPCs with matching `CREATE FUNCTION` in migrations | ~156 |
| **RPCs MISSING from all migrations** | **4** |
| Dead functions (defined but never called from app code) | ~90+ |

### 3.2 MISSING RPCs (called by frontend, no migration defines them)

| RPC Name | Called From | Line | Severity |
|---|---|---|---|
| `admin_update_subscription` | services/tenantService.ts | 481 | **CRITICAL** |
| `get_member_with_email` | services/tenantService.ts | 591 | **CRITICAL** |
| `search_members_by_email` | services/tenantService.ts | 610 | **CRITICAL** |
| `get_storage_usage` | services/tenantService.ts | 1009, 1017 | **CRITICAL** |

These 4 functions are called via `supabase.rpc()` but have **no corresponding `CREATE OR REPLACE FUNCTION`** in any of the 138 migration files or 17 orphan SQL files. They will fail at runtime with a `function not found` error.

### 3.3 RPC Call Distribution by Source

| Source | File count | RPC call count |
|---|---|---|
| utils/service.ts | 1 | ~60 |
| services/tenantService.ts | 1 | ~35 |
| services/systemAdminService.ts | 1 | ~12 |
| Edge functions (supabase/functions/) | 6 | ~9 |
| services/fraudRetentionService.ts | 1 | 9 |
| services/integrationService.ts | 1 | 8 |
| services/heavyOpsQueueService.ts | 1 | 7 |
| Other services | ~15 | ~20 |

### 3.4 Dead Functions (estimated)

~90+ functions exist in migrations that are never called from any `.ts` file. Most fall into:
- **Internal helpers**: `calc_qty_after_transaction`, `insert_stock_ledger_entry`, `insert_customer_ledger_entry`, `sync_product_quantity_from_lots`
- **Trigger functions**: `trg_*`, `notification_trigger`, `check_single_einvoice_config`, `check_tenant_limits`
- **Cron jobs**: `run_admin_cron_*`, `publish_scheduled_announcements`, `create_renewal_invoices`, `expire_overdue_invoices`
- **Backfill utilities**: `backfill_stock_ledger`, `backfill_stock_ledger_v2`, `backfill_v2_*`
- **Potentially unused**: `reconcile_customer_debt`, `reconcile_supplier_debt`, `get_valid_plan_keys`, `promotion_rule_matches`

These are not bugs -- internal/trigger/cron functions are not called via RPC. But the backfill functions may be dead code that could be cleaned up.

---

## PART 4: Canonical RPC Classification

### 4.1 By Domain

| Domain | RPC Count | Key functions |
|---|---|---|
| **Tenant Management** | ~35 | create_tenant_with_admin, update_tenant, delete_tenant_safe, get_tenants_admin, search_tenants, get_current_user_tenants |
| **Inventory / Stock** | ~25 | process_import_v2, process_checkout, check_stock_ledger_drift, get_stock_ledger, filter_products_rpc |
| **Orders / Returns** | ~15 | cancel_order, delete_order, create_return_order, create_exchange_transaction, filter_return_orders_rpc |
| **Billing / Invoices** | ~15 | create_invoice, confirm_payment, get_billing_automation_status, get_revenue_metrics |
| **Admin / System** | ~20 | is_system_admin, get_system_overview, get_users, update_user_status, get_admin_roles |
| **Reports / Analytics** | ~10 | get_sales_report, get_profit_report, get_inventory_report, get_customer_report, get_dashboard_summary |
| **Security / Auth** | ~12 | record_login_attempt, get_login_attempts, generate_2fa_backup_codes, has_tenant_role |
| **GDPR / Compliance** | ~6 | gdpr_export_user_data, gdpr_delete_user_data, record_terms_acceptance, export_tenant_data |
| **Webhooks / Integrations** | ~12 | list_tenant_webhooks, trigger_webhook_event, list_partners, create_integration |
| **Notifications** | ~5 | send_in_app_message, get_current_announcements_for_tenant, get_email_template_by_key |
| **Plans / Subscriptions** | ~8 | get_plans, create_plan, update_plan, update_tenant_subscription |
| **Fraud / Retention** | ~6 | run_fraud_detection, get_fraud_queue, run_data_retention |
| **Infrastructure** | ~8 | run_db_maintenance_job, get_connection_pool_stats, get_read_replica_status |

### 4.2 By Security Model

| Model | Count | Risk |
|---|---|---|
| SECURITY DEFINER | ~210 | Functions run with creator's privileges -- any SQL injection inside them bypasses RLS |
| SECURITY INVOKER | ~40 | Runs with caller's privileges -- safer but may fail on RLS-protected tables |

---

## PART 5: Database Contract Determination

### 5.1 Contract Type: **RPC-Heavy Facade**

The application uses Supabase PostgREST RPCs as its primary database access layer. Nearly all writes go through stored functions; reads are split between direct table queries (via Supabase client `.from().select()`) and RPC calls.

### 5.2 Contract Boundaries

| Layer | Responsibility |
|---|---|
| **Frontend (Next.js)** | Calls `supabase.rpc()` for writes and complex reads; `.from().select()` for simple reads |
| **Edge Functions** | Call RPCs for webhook delivery, email sending, cron maintenance |
| **PostgreSQL Functions** | All business logic, validation, multi-table transactions, tenant isolation |
| **RLS Policies** | Row-level tenant isolation enforced at DB level |
| **Triggers** | Audit logging, updated_at stamps, guardrails |

### 5.3 Signature Drift Risk

Several functions have been redefined with different parameter lists across migrations. The `CREATE OR REPLACE` pattern silently overwrites the previous definition. However, old overloads with different parameter counts can linger unless explicitly `DROP FUNCTION`-ed first. Evidence of this:

- `update_tenant` had 3 old overloads explicitly dropped in `fix_update_tenant_overload.sql`
- `get_top_tenants(INTEGER)` single-param overload dropped in `fix_admin_tenant_rpc_signatures.sql`
- `expire_overdue_invoices` and `create_renewal_invoices` dropped before recreate in `phase_p7_5`

This is a fragile pattern -- any mismatch between frontend parameter count and the latest function signature causes a runtime error.

---

## PART 6: SSOT Verification

### 6.1 Is There a Single Source of Truth for the Schema?

**No.** The schema is defined across:

1. **Baseline migration** (20250703000000) -- 233 functions, 74 tables
2. **137 incremental migrations** -- additions, redefinitions, fixes
3. **17 orphan SQL files** -- unclear status (applied? draft? abandoned?)
4. **No `schema.sql` dump or generated types file** checked into the repo

There is no single file or generated artifact that represents "the current state of the database."

### 6.2 SSOT Score

| Factor | Weight | Score | Notes |
|---|---|---|---|
| Single canonical schema file exists | 25% | 0/25 | No schema dump |
| Generated types match DB | 20% | 0/20 | No generated types found |
| No orphan/draft SQL files | 15% | 5/15 | 17 orphans |
| All frontend RPCs have matching functions | 25% | 22/25 | 4 missing out of ~160 |
| Migration chain is linear and gapless | 15% | 8/15 | Year jump, gaps |
| **Total** | **100%** | **35/100** | **Poor** |

---

## Critical Issues (Ordered by Severity)

### P0 -- Runtime Failures

1. **4 missing RPCs** will cause `function not found` errors at runtime:
   - `admin_update_subscription`
   - `get_member_with_email`
   - `search_members_by_email`
   - `get_storage_usage`

   **Fix:** Create a migration defining these 4 functions.

### P1 -- Data Integrity Risk

2. **Year-jump in timestamps** (84 files dated 2026) prevents inserting new migrations between July 13 2025 and July 8 2026 without breaking ordering. Any hotfix migration created with a real timestamp today would run *before* the 2026 files.

   **Fix:** Rename all 84 files from `2026*` to continue from `20250713000023`. This requires coordinating with any deployed environments.

3. **17 orphan SQL files** in `supabase/` root -- unclear if they were ever applied manually. If they were, the migration history is incomplete. If they weren't, they may contain needed schema changes.

   **Fix:** Audit each file, either move into migrations/ with a timestamp or delete.

### P2 -- Maintainability

4. **17+ naming conventions** make it nearly impossible to understand migration ordering by name alone.

5. **0.7% rollback coverage** -- only 1 of 138 migrations has a rollback script.

6. **233 functions in a single baseline file** -- the baseline is ~15,000+ lines, making it extremely difficult to diff or review.

7. **No schema SSOT** -- no generated types, no schema dump, no migration squash.

---

## Recommended Next Steps (SCAR Phase 2)

1. **Immediate:** Write migration for the 4 missing RPCs
2. **Short-term:** Fix the 2026 year-jump across all environments
3. **Short-term:** Triage the 17 orphan SQL files (delete or integrate)
4. **Medium-term:** Generate and commit a `supabase db dump` or use `supabase gen types` for TypeScript type safety
5. **Medium-term:** Squash the 138 migrations into a clean baseline
6. **Long-term:** Establish naming convention + CI lint for new migrations
7. **Long-term:** Implement rollback scripts for critical migrations

---

*Report generated by SCAR Phase 1 analysis. All counts are based on static analysis of migration SQL files and TypeScript source code.*
