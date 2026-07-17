# PHASE4_COVERAGE_ROADMAP.md

**Program:** VietSalePro v7 — System Recovery Program
**Phase:** Phase 4 — Derived Validation Layer Realignment
**Document Type:** Coverage Roadmap Planning (Program Manager — Planning, not Implementation)
**Date:** 2026-07-15
**Status:** Proposed — Pending Program Manager Decision
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-013_ACCEPTANCE_RECORD.md`, `scripts/audit-rpc-contracts.ts` (independent run)

---

## 0. Purpose & Boundary

This document is a **planning artifact**, not an implementation artifact. It inventories the 115 RPCs currently unmocked (reported informationally by the CURRENT_TASK-013 audit gate at 37.2% coverage), classifies them by business domain, maps inter-domain dependencies, estimates scope, and proposes a multi-task execution roadmap.

**This document does NOT:**
- Create CURRENT_TASK-014 or any subsequent CURRENT_TASK.
- Authorize implementation.
- Modify code, mocks, migrations, tests, or governance.
- Mock any RPC.

**Decision sought:** Program Manager approval of the roadmap structure, domain ordering, and milestone targets. Only after approval will the Program Manager generate domain-scoped CURRENT_TASKs one at a time.

---

## 1. Coverage Inventory

### 1.1 Baseline (CURRENT_TASK-013 Accepted State)

Source: independent run of `npx tsx scripts/audit-rpc-contracts.ts` on 2026-07-15.

| Metric | Value |
|---|---|
| Migration RPCs (canonical source) | 300 |
| Code RPCs (called by `services/`, `lib/`, `utils/`) | 183 |
| Mock RPCs (handlers in `tests/mocks/supabase.ts`) | 69 |
| Covered (code RPC with matching mock) | 68 |
| Uncovered (code RPC with no mock) | 115 |
| Coverage | 37.2% |

Note: 69 mock handlers cover 68 code RPCs (1 mock — `update_tenant_status` — is an orphan: mocked but not called by code; accepted as informational in CURRENT_TASK-013).

### 1.2 Full Uncovered RPC Inventory (115 RPCs)

The 115 uncovered RPCs are distributed across **19 source files**. The dominant carrier is `services/supabaseService.ts` (the core commerce facade barrel), which alone accounts for **57 of 115** uncovered RPCs (49.6%).

| Source File | Uncovered RPC Count | Share |
|---|---|---|
| `services/supabaseService.ts` | 57 | 49.6% |
| `services/integrationService.ts` | 8 | 7.0% |
| `services/systemAdminService.ts` | 7 | 6.1% |
| `services/webhookService.ts` | 7 | 6.1% |
| `services/twoFactorService.ts` | 5 | 4.3% |
| `lib/permissions.ts` | 4 | 3.5% |
| `services/admin/complianceAdminService.ts` | 4 | 3.5% |
| `services/apiKeyService.ts` | 3 | 2.6% |
| `services/complianceService.ts` | 3 | 2.6% |
| `services/loginHistoryService.ts` | 3 | 2.6% |
| `services/notificationService.ts` | 3 | 2.6% |
| `services/promotionService.ts` | 3 | 2.6% |
| `services/admin/analyticsAdminService.ts` | 2 | 1.7% |
| `services/admin/licenseService.ts` | 2 | 1.7% |
| `services/admin/memberAdminService.ts` | 2 | 1.7% |
| `services/billingAutomationService.ts` | 2 | 1.7% |
| `lib/tenant.ts` | 1 | 0.9% |
| `services/tenantService.ts` | 1 | 0.9% |
| `utils/invoiceNumber.ts` | 1 | 0.9% |
| **Total** | **115** | **100%** |

Two RPCs are called from more than one file (cross-file shared):
- `is_system_admin` — `services/tenantService.ts` + `lib/permissions.ts`
- `get_churn_cohort_metrics` — `services/admin/analyticsAdminService.ts` + `services/billingAutomationService.ts`
- `get_revenue_metrics` — `services/admin/analyticsAdminService.ts` + `services/billingAutomationService.ts`

These are counted once each in the unique inventory (115 unique RPCs).

### 1.3 Complete RPC List (alphabetical)

`accept_invitation`, `adjust_customer_debt`, `adjust_supplier_debt`, `apply_voucher_to_invoice`, `can_use_feature`, `cancel_inventory_count_rpc`, `cancel_order`, `cancel_return_order_v2`, `cancel_supplier_exchange`, `check_product_barcode_exists`, `check_product_code_exists`, `check_stock_ledger_drift`, `complete_inventory_count`, `count_point_products`, `create_exchange_transaction`, `create_gdpr_request`, `create_integration`, `create_partner`, `create_return_order`, `create_supplier_exchange`, `create_tenant_api_key`, `create_tenant_webhook`, `delete_2fa_backup_codes`, `delete_disposal_with_restore`, `delete_import_v2`, `delete_integration`, `delete_inventory_count_rpc`, `delete_order`, `delete_partner`, `delete_tenant_webhook`, `export_tenant_data`, `filter_customers_rpc`, `filter_disposals_rpc`, `filter_import_receipts_rpc`, `filter_products_rpc`, `filter_return_orders_rpc`, `filter_suppliers_rpc`, `gdpr_delete_user_data`, `gdpr_export_user_data`, `generate_2fa_backup_codes`, `generate_tenant_license`, `get_admin_login_alerts`, `get_admin_login_history`, `get_brand_product_counts`, `get_category_product_counts`, `get_churn_cohort_metrics`, `get_customer_debt_ledger`, `get_customer_report`, `get_customer_stats`, `get_dashboard_summary`, `get_disposal_auto_code`, `get_gdpr_requests`, `get_import_receipt_count_by_date`, `get_import_receipts_by_product_and_lot`, `get_import_receipts_by_supplier_id`, `get_import_stats`, `get_in_app_messages_for_tenant`, `get_inventory_report`, `get_locked_emails`, `get_login_attempts`, `get_order_auto_code`, `get_product_by_barcode`, `get_product_stats`, `get_profit_report`, `get_promo_code_usage_counts`, `get_return_order_auto_code`, `get_revenue_metrics`, `get_sales_report`, `get_stock_ledger`, `get_supplier_debt_ledger`, `get_supplier_report`, `get_supplier_stats`, `get_tenant_by_subdomain`, `get_tenant_security_settings`, `get_terms_acceptances`, `get_unsynced_brands`, `get_unsynced_categories`, `has_tenant_role`, `increment_product_quantity`, `is_2fa_enabled`, `is_system_admin`, `is_tenant_owner`, `list_2fa_backup_codes`, `list_integrations`, `list_partners`, `list_tenant_api_keys`, `list_tenant_webhooks`, `list_webhook_deliveries`, `lookup_invitation`, `mark_in_app_message_read`, `pay_order_debt`, `pay_supplier_debt`, `process_checkout`, `process_import_v2`, `record_admin_login`, `record_login_attempt`, `record_terms_acceptance`, `retry_webhook_delivery`, `revoke_tenant_api_key`, `search_customers_rpc`, `search_orders_rpc`, `search_products_rpc`, `search_suppliers_rpc`, `send_in_app_message`, `trigger_webhook_event`, `unlock_login_attempts`, `update_import_v2`, `update_integration`, `update_partner`, `update_tenant_ip_allowlist`, `update_tenant_session_timeout`, `update_tenant_webhook`, `validate_promo_code`, `validate_tenant_license`, `verify_2fa_backup_code`.

---

## 2. Domain Classification

The 115 uncovered RPCs are classified into **8 business domains**. Domain A (Auth & Identity) and Domain H (Core Commerce) are further sub-divided because of their size and internal coupling. The classification is derived from the calling service file and the RPC name semantics, cross-checked against the canonical migration chain grouping.

### Domain A — Auth, Identity & Security (20 RPCs)

The foundational authorization, authentication, tenant-context, and login-security layer. Nearly every other domain's service code calls through `lib/permissions.ts` (`can_use_feature`, `has_tenant_role`, `is_system_admin`, `is_tenant_owner`) before executing business logic.

| Sub-group | RPCs | Source Files |
|---|---|---|
| Permissions & Roles | `can_use_feature`, `has_tenant_role`, `is_system_admin`, `is_tenant_owner` | `lib/permissions.ts`, `services/tenantService.ts` |
| Tenant Context | `get_tenant_by_subdomain` | `lib/tenant.ts` |
| Two-Factor Auth | `delete_2fa_backup_codes`, `generate_2fa_backup_codes`, `is_2fa_enabled`, `list_2fa_backup_codes`, `verify_2fa_backup_code` | `services/twoFactorService.ts` |
| System-Admin Security | `get_locked_emails`, `get_login_attempts`, `get_tenant_security_settings`, `record_login_attempt`, `unlock_login_attempts`, `update_tenant_ip_allowlist`, `update_tenant_session_timeout` | `services/systemAdminService.ts` |
| Login History | `get_admin_login_alerts`, `get_admin_login_history`, `record_admin_login` | `services/loginHistoryService.ts` |

**Count: 20 unique RPCs.**

### Domain B — Tenant Administration & Licensing (6 RPCs)

Tenant lifecycle administration exposed to system-admin / billing contexts: license generation/validation, member invitation flow, and program-level analytics consumed by both admin analytics and billing automation.

| Sub-group | RPCs | Source Files |
|---|---|---|
| Licensing | `generate_tenant_license`, `validate_tenant_license` | `services/admin/licenseService.ts` |
| Member Invitations | `accept_invitation`, `lookup_invitation` | `services/admin/memberAdminService.ts` |
| Program Analytics | `get_churn_cohort_metrics`, `get_revenue_metrics` | `services/admin/analyticsAdminService.ts`, `services/billingAutomationService.ts` |

**Count: 6 unique RPCs.**

### Domain C — Compliance & GDPR (7 RPCs)

Legal/regulatory data-handling: GDPR request lifecycle (admin-facing) and tenant-side terms acceptance + data export.

| Sub-group | RPCs | Source Files |
|---|---|---|
| GDPR (admin) | `create_gdpr_request`, `gdpr_delete_user_data`, `gdpr_export_user_data`, `get_gdpr_requests` | `services/admin/complianceAdminService.ts` |
| Terms & Export (tenant) | `export_tenant_data`, `get_terms_acceptances`, `record_terms_acceptance` | `services/complianceService.ts` |

**Count: 7 unique RPCs.**

### Domain D — Integrations & Partners (8 RPCs)

External system integration registry and partner (reseller/channel) management. CRUD surface for both, all in a single service file.

| RPCs | Source File |
|---|---|
| `create_integration`, `delete_integration`, `list_integrations`, `update_integration` | `services/integrationService.ts` |
| `create_partner`, `delete_partner`, `list_partners`, `update_partner` | `services/integrationService.ts` |

**Count: 8 unique RPCs.**

### Domain E — Webhooks & API Keys (10 RPCs)

Programmatic tenant integration surface: webhook configuration + delivery retry, and tenant API key lifecycle.

| Sub-group | RPCs | Source Files |
|---|---|---|
| Webhooks | `create_tenant_webhook`, `delete_tenant_webhook`, `list_tenant_webhooks`, `list_webhook_deliveries`, `retry_webhook_delivery`, `trigger_webhook_event`, `update_tenant_webhook` | `services/webhookService.ts` |
| API Keys | `create_tenant_api_key`, `list_tenant_api_keys`, `revoke_tenant_api_key` | `services/apiKeyService.ts` |

**Count: 10 unique RPCs.**

### Domain F — Notifications (3 RPCs)

In-app messaging for tenant users.

| RPCs | Source File |
|---|---|
| `get_in_app_messages_for_tenant`, `mark_in_app_message_read`, `send_in_app_message` | `services/notificationService.ts` |

**Count: 3 unique RPCs.**

### Domain G — Promotions (3 RPCs)

Voucher / promo-code application and validation against invoices.

| RPCs | Source File |
|---|---|
| `apply_voucher_to_invoice`, `get_promo_code_usage_counts`, `validate_promo_code` | `services/promotionService.ts` |

**Count: 3 unique RPCs.**

### Domain H — Core Commerce (58 RPCs)

The large facade barrel `services/supabaseService.ts` plus one utility caller. This is the operational heart of the product: catalog, inventory, orders, returns, customers, suppliers, imports, disposals, and reports. Because of its size (58 RPCs) and internal sub-domain coupling, it is sub-divided into 9 sub-domains for task sizing.

| Sub-domain | RPCs | Count |
|---|---|---|
| H1 — Products & Catalog | `check_product_barcode_exists`, `check_product_code_exists`, `count_point_products`, `get_brand_product_counts`, `get_category_product_counts`, `get_product_by_barcode`, `get_product_stats`, `get_unsynced_brands`, `get_unsynced_categories`, `search_products_rpc`, `filter_products_rpc` | 11 |
| H2 — Inventory & Stock | `check_stock_ledger_drift`, `complete_inventory_count`, `cancel_inventory_count_rpc`, `delete_inventory_count_rpc`, `get_stock_ledger`, `increment_product_quantity`, `get_inventory_report` | 7 |
| H3 — Orders & Sales | `cancel_order`, `delete_order`, `get_order_auto_code`, `get_sales_report`, `process_checkout`, `search_orders_rpc`, `pay_order_debt` | 7 |
| H4 — Returns & Exchanges | `cancel_return_order_v2`, `create_return_order`, `create_supplier_exchange`, `cancel_supplier_exchange`, `create_exchange_transaction`, `filter_return_orders_rpc`, `get_return_order_auto_code` | 7 |
| H5 — Customers | `adjust_customer_debt`, `get_customer_debt_ledger`, `get_customer_report`, `get_customer_stats`, `search_customers_rpc`, `filter_customers_rpc` | 6 |
| H6 — Suppliers | `adjust_supplier_debt`, `get_supplier_debt_ledger`, `get_supplier_report`, `get_supplier_stats`, `search_suppliers_rpc`, `filter_suppliers_rpc`, `pay_supplier_debt` | 7 |
| H7 — Imports | `delete_import_v2`, `process_import_v2`, `update_import_v2`, `filter_import_receipts_rpc`, `get_import_receipt_count_by_date`, `get_import_receipts_by_product_and_lot`, `get_import_receipts_by_supplier_id`, `get_import_stats` | 8 |
| H8 — Disposals | `delete_disposal_with_restore`, `filter_disposals_rpc`, `get_disposal_auto_code` | 3 |
| H9 — Reports & Dashboard | `get_dashboard_summary`, `get_profit_report` | 2 |
| **Domain H Total** | | **58** |

Note: `get_order_auto_code` is called from `utils/invoiceNumber.ts`, not `supabaseService.ts`, but is semantically part of H3 (Orders). `get_inventory_report` is grouped under H2 (Inventory) rather than H9 because it is inventory-specific; `get_sales_report` / `get_customer_report` / `get_supplier_report` stay with their respective entity sub-domains. H9 retains only the two cross-cutting aggregate reports.

### Domain Summary Table

| Domain | RPCs | % of 115 | Primary Carrier File |
|---|---|---|---|
| A — Auth, Identity & Security | 20 | 17.4% | `lib/permissions.ts`, `services/systemAdminService.ts`, `services/twoFactorService.ts` |
| B — Tenant Administration & Licensing | 6 | 5.2% | `services/admin/licenseService.ts`, `services/admin/memberAdminService.ts` |
| C — Compliance & GDPR | 7 | 6.1% | `services/admin/complianceAdminService.ts`, `services/complianceService.ts` |
| D — Integrations & Partners | 8 | 7.0% | `services/integrationService.ts` |
| E — Webhooks & API Keys | 10 | 8.7% | `services/webhookService.ts`, `services/apiKeyService.ts` |
| F — Notifications | 3 | 2.6% | `services/notificationService.ts` |
| G — Promotions | 3 | 2.6% | `services/promotionService.ts` |
| H — Core Commerce | 58 | 50.4% | `services/supabaseService.ts` (+ `utils/invoiceNumber.ts`) |
| **Total** | **115** | **100%** | |

---

## 3. Domain Dependency Map

Dependencies are derived from runtime call-flow analysis: which domain's mocks must exist for another domain's service code to execute past its authorization guard and reach the RPC under test.

### 3.1 Cross-Domain Dependencies

```text
                       ┌──────────────────────────┐
                       │  A — Auth, Identity &     │
                       │  Security (permissions,   │
                       │  tenant ctx, 2FA, login)  │
                       └─────────────┬────────────┘
                                     │ every domain's service code
                                     │ calls A's permission RPCs
            ┌────────────┬──────────┼──────────┬────────────┐
            ▼            ▼          ▼          ▼            ▼
       ┌───────┐   ┌─────────┐ ┌───────┐ ┌─────────┐  ┌─────────┐
       │   B   │   │    C    │ │   D   │ │    E    │  │    F    │
       │ Tenant │   │Complianc│ │Integra│ │Webhooks │  │Notifica-│
       │ Admin  │   │  & GDPR │ │tions  │ │& API Key│  │  tions  │
       └───┬───┘   └─────────┘ └───────┘ └─────────┘  └─────────┘
           │
           │ license gates (validate_tenant_license)
           ▼
       ┌───────────────────────────────────────────────────┐
       │  H — Core Commerce                                │
       │                                                   │
       │  H1 Products ──┬──► H2 Inventory                  │
       │                ├──► H3 Orders ◄── H5 Customers    │
       │                │         ▲          ▲             │
       │                │         │          │             │
       │                ├──► H4 Returns ◄── H6 Suppliers   │
       │                │                                   │
       │                ├──► H7 Imports ◄── H6 Suppliers   │
       │                │                                   │
       │                └──► H8 Disposals ◄── H2 Inventory │
       │                                                   │
       │  H9 Reports (cross-cutting, depends on all H*)    │
       └───────────────────────────────────────────────────┘
           │
           │ apply_voucher_to_invoice targets invoices/orders
           ▼
       ┌───────────┐
       │  G — Promo │
       │  tions     │
       └───────────┘
```

### 3.2 Dependency Rules

| Domain | Depends On | Reason |
|---|---|---|
| **A** (Auth) | — (foundational) | Permission/role/tenant-context checks execute before any business RPC. No upstream mock dependency. |
| **B** (Tenant Admin) | A | Member invitation + license validation require auth context (`is_system_admin`, tenant resolution). |
| **C** (Compliance) | A | GDPR/terms flows require tenant + user identity resolution. |
| **D** (Integrations) | A | Integration CRUD is tenant-scoped; requires `has_tenant_role` / tenant context. |
| **E** (Webhooks & API Keys) | A | API key validation and webhook triggering require tenant + auth context. |
| **F** (Notifications) | A | In-app messages are tenant + user scoped. |
| **G** (Promotions) | A, H3 (Orders) | `apply_voucher_to_invoice` operates on invoices/orders; requires order mock to exist for end-to-end test paths. |
| **H1** (Products) | A | Catalog queries are tenant-scoped. |
| **H2** (Inventory) | A, H1 | Stock operations reference products. |
| **H3** (Orders) | A, H1, H2, H5 | Checkout/order lifecycle reads products, decrements stock, references customers. |
| **H4** (Returns) | A, H3, H1, H6 | Returns reference original orders, products, and suppliers (supplier exchanges). |
| **H5** (Customers) | A | Customer entity is tenant-scoped; referenced by H3 but does not depend on H3. |
| **H6** (Suppliers) | A | Supplier entity is tenant-scoped; referenced by H4, H7 but does not depend on them. |
| **H7** (Imports) | A, H1, H6 | Import receipts reference products and suppliers. |
| **H8** (Disposals) | A, H2 | Disposals draw from inventory stock. |
| **H9** (Reports) | A, all H* | Aggregate reports read across commerce sub-domains. |

### 3.3 Dependency-Driven Ordering Principle

Domain A is a **hard prerequisite** for all other domains — its permission/role mocks are on the execution path of every service function. Within Core Commerce (H), the entity sub-domains (H1 Products, H5 Customers, H6 Suppliers) are leaf nodes that should precede the transactional sub-domains (H3 Orders, H4 Returns, H7 Imports) that reference them. H9 Reports is last because it aggregates across all of H.

---

## 4. Priority Matrix

Each domain is scored on five criteria. Scores: High (3), Medium (2), Low (1). Priority Score = sum.

| Domain | Business Criticality | Dependency Depth (how many depend on it) | Test-Path Unblock Potential | Mock Complexity Risk | Scope (RPC count) | Priority Score |
|---|---|---|---|---|---|---|
| **A — Auth & Security** | High (3) | High (3) — all domains depend on it | High (3) — unblocks every guarded path | Medium (2) — auth logic, stateful login/lock state | 20 | **13** |
| **H — Core Commerce** | High (3) | Medium (2) — G depends on H3 | High (3) — core product flows | Medium (2) — stateful store mutations | 58 | **12** |
| **B — Tenant Admin & Licensing** | Medium (2) | Medium (2) — H license gates | Medium (2) | Low (1) — mostly read/validate | 6 | **9** |
| **E — Webhooks & API Keys** | Medium (2) | Low (1) | Medium (2) | Medium (2) — key gen, delivery state | 10 | **9** |
| **D — Integrations & Partners** | Medium (2) | Low (1) | Medium (2) | Low (1) — simple CRUD | 8 | **8** |
| **C — Compliance & GDPR** | Medium-High (2) | Low (1) | Low (1) | Medium (2) — data export/delete side effects | 7 | **8** |
| **G — Promotions** | Medium (2) | Low (1) — depends on H3 | Low (1) | Low (1) — validate/apply | 3 | **6** |
| **F — Notifications** | Low-Medium (1) | Low (1) | Low (1) | Low (1) — simple message store | 3 | **5** |

**Priority ranking (highest first):** A → H → B → E → D → C → G → F

Note: Within H, sub-domain priority follows the dependency graph (see §6).

---

## 5. Estimated Scope per Domain

Scope is estimated by RPC count and by mock-complexity class. Each uncovered RPC requires one `if (name === '...')` handler block in `tests/mocks/supabase.ts`, following the existing dispatch pattern. Complexity class estimates the handler body size and state-interaction depth, based on inspection of the existing 69 handlers and the RPC semantics.

| Complexity Class | Handler Profile | Estimated Lines/Handler | Domains |
|---|---|---|---|
| **Simple** | Read-only query / existence check / counter. Returns static or store-filtered data. No mutation, no auth branch. | 5–15 | H1 (most), H5, H6, H9, D, F, B (license validate) |
| **Medium** | Mutates store (create/update/delete) OR has an auth/tenant guard branch OR returns computed aggregates. | 15–40 | H2, H3, H4, H7, H8, A (2FA, login), E (webhook delivery, API key), C (GDPR) |
| **Complex** | Multi-entity stateful transaction (checkout, import processing, exchange) with cross-store side effects and rollback-like error paths. | 40–80 | H3 (`process_checkout`), H7 (`process_import_v2`), H4 (`create_exchange_transaction`, `create_supplier_exchange`) |

### 5.1 Per-Domain Scope Estimate

| Domain | RPCs | Simple | Medium | Complex | Est. Handler Lines | Est. Effort (relative) |
|---|---|---|---|---|---|---|
| A — Auth & Security | 20 | 8 | 12 | 0 | ~300 | Medium-High |
| B — Tenant Admin & Licensing | 6 | 4 | 2 | 0 | ~90 | Low |
| C — Compliance & GDPR | 7 | 2 | 5 | 0 | ~160 | Medium |
| D — Integrations & Partners | 8 | 8 | 0 | 0 | ~80 | Low |
| E — Webhooks & API Keys | 10 | 4 | 6 | 0 | ~220 | Medium |
| F — Notifications | 3 | 3 | 0 | 0 | ~30 | Very Low |
| G — Promotions | 3 | 2 | 1 | 0 | ~50 | Very Low |
| H1 — Products & Catalog | 11 | 11 | 0 | 0 | ~110 | Low |
| H2 — Inventory & Stock | 7 | 3 | 4 | 0 | ~140 | Medium |
| H3 — Orders & Sales | 7 | 2 | 3 | 2 | ~250 | High |
| H4 — Returns & Exchanges | 7 | 2 | 3 | 2 | ~240 | High |
| H5 — Customers | 6 | 6 | 0 | 0 | ~60 | Low |
| H6 — Suppliers | 7 | 7 | 0 | 0 | ~70 | Low |
| H7 — Imports | 8 | 2 | 4 | 2 | ~260 | High |
| H8 — Disposals | 3 | 1 | 2 | 0 | ~60 | Low |
| H9 — Reports & Dashboard | 2 | 2 | 0 | 0 | ~20 | Very Low |
| **Total** | **115** | **67** | **42** | **6** | **~2080** | |

**Effort legend:** Very Low = single small session; Low = one focused session; Medium = one session with verification; High = one session plus dedicated test verification for stateful transactions.

### 5.2 Aggregate Estimate

- ~2,080 lines of mock handler code added to `tests/mocks/supabase.ts` (current file is 2,482 lines; this roughly doubles it).
- 6 complex handlers require careful stateful test verification (checkout, import, exchange flows).
- No production code, migration, schema, or generated-type changes are required for any domain — all work is confined to `tests/mocks/supabase.ts` plus test files that exercise the newly-mocked paths.

---

## 6. Recommended Execution Order

The roadmap is structured as **Waves**, each wave containing one or more domain-scoped CURRENT_TASKs. The Program Manager authorizes one CURRENT_TASK at a time; the next task is only generated after the previous is accepted. This preserves the governance model established in Phases 1–4.

### 6.1 Ordering Rationale

1. **Auth first (Wave 1).** Domain A's permission/role mocks are on the execution path of every other domain's service code. Mocking A first maximizes test-path unblocking per RPC and removes the most common "test fails at auth guard before reaching the RPC under test" failure mode.
2. **Tenant Admin second (Wave 2).** License validation gates feature access in commerce flows; mocking B before H allows commerce tests to pass license checks.
3. **Core Commerce entity leaves before transactions (Wave 3a–3c).** Products, Customers, Suppliers are referenced by Orders, Returns, and Imports. Mocking the entity leaves first means transactional mocks can reference already-existing entity mocks.
4. **Core Commerce transactions after entities (Wave 3d–3g).** Inventory, Orders, Returns, Imports — in that order, following dependency depth.
5. **Core Commerce residuals (Wave 3h–3i).** Disposals and aggregate Reports depend on the rest of H.
6. **Cross-cutting services (Wave 4a–4e).** Integrations, Webhooks/API Keys, Compliance, Notifications, Promotions. These are relatively independent of each other; ordering within the wave follows priority score.

### 6.2 Wave Plan

| Wave | CURRENT_TASK (proposed) | Domain | RPCs | Cumulative Coverage | Effort |
|---|---|---|---|---|---|
| **Wave 1** | TASK-A: Auth, Identity & Security | A | 20 | 37.2% → 48.1% | Medium-High |
| **Wave 2** | TASK-B: Tenant Admin & Licensing | B | 6 | 48.1% → 51.4% | Low |
| **Wave 3a** | TASK-H1: Products & Catalog | H1 | 11 | 51.4% → 57.4% | Low |
| **Wave 3b** | TASK-H5: Customers | H5 | 6 | 57.4% → 60.7% | Low |
| **Wave 3c** | TASK-H6: Suppliers | H6 | 7 | 60.7% → 64.5% | Low |
| **Wave 3d** | TASK-H2: Inventory & Stock | H2 | 7 | 64.5% → 68.3% | Medium |
| **Wave 3e** | TASK-H3: Orders & Sales | H3 | 7 | 68.3% → 72.1% | High |
| **Wave 3f** | TASK-H4: Returns & Exchanges | H4 | 7 | 72.1% → 76.0% | High |
| **Wave 3g** | TASK-H7: Imports | H7 | 8 | 76.0% → 80.3% | High |
| **Wave 3h** | TASK-H8: Disposals | H8 | 3 | 80.3% → 82.0% | Low |
| **Wave 3i** | TASK-H9: Reports & Dashboard | H9 | 2 | 82.0% → 83.1% | Very Low |
| **Wave 4a** | TASK-D: Integrations & Partners | D | 8 | 83.1% → 87.4% | Low |
| **Wave 4b** | TASK-E: Webhooks & API Keys | E | 10 | 87.4% → 92.9% | Medium |
| **Wave 4c** | TASK-C: Compliance & GDPR | C | 7 | 92.9% → 96.7% | Medium |
| **Wave 4d** | TASK-F: Notifications | F | 3 | 96.7% → 98.4% | Very Low |
| **Wave 4e** | TASK-G: Promotions | G | 3 | 98.4% → 100.0% | Very Low |

**Total: 16 proposed CURRENT_TASKs across 4 waves.**

### 6.3 Task Sizing Principle

Each proposed CURRENT_TASK is deliberately small (2–20 RPCs, one domain or one commerce sub-domain). This follows the program's established governance pattern (CURRENT_TASK-006 through CURRENT_TASK-013 were each narrowly scoped) and ensures:
- Each task has a single, testable acceptance criterion (coverage delta + audit gate remains green).
- Risk is isolated — a stateful-mock bug in one domain does not block acceptance of independent domains.
- The audit gate's coverage report provides a quantitative, reproducible acceptance metric for every task.

### 6.4 Per-Task Acceptance Criterion (Template)

Every CURRENT_TASK in this roadmap should be accepted only when ALL of the following hold:

1. The task's domain RPCs are mocked in `tests/mocks/supabase.ts` following the existing `if (name === '...')` dispatch pattern.
2. `npx tsx scripts/audit-rpc-contracts.ts` exits 0 (no stale mocks, no duplicates, no code-RPCs-missing-from-migrations).
3. The coverage report shows the expected covered-count increase (matching the task's RPC count) and 0 new uncovered RPCs.
4. `npx tsc --noEmit` passes.
5. `npx vitest run` passes (no regression; new test paths that exercise the newly-mocked RPCs are encouraged but not mandatory for coverage-only tasks).
6. No production code, migration, schema, generated type, CI workflow, or `package.json` is modified.

---

## 7. Coverage Milestones

The roadmap defines explicit, measurable coverage milestones. Each milestone is verifiable by running the audit gate. The target is **100% mock coverage** of the 183 code RPCs, which fully satisfies the Phase 4 success criterion: *"Passing tests imply that the corresponding production path will not fail on the previously known contract breaks."*

| Milestone | After Wave | Cumulative Covered | Coverage | Delta |
|---|---|---|---|---|
| **M0 — Baseline** | (CURRENT_TASK-013 accepted) | 68 / 183 | 37.2% | — |
| **M1 — Auth Foundation** | Wave 1 | 88 / 183 | 48.1% | +10.9pp |
| **M2 — Tenant Admin** | Wave 2 | 94 / 183 | 51.4% | +3.3pp |
| **M3 — Commerce Entities** | Wave 3a–3c | 118 / 183 | 64.5% | +13.1pp |
| **M4 — Commerce Transactions** | Wave 3d–3g | 147 / 183 | 80.3% | +15.8pp |
| **M5 — Commerce Complete** | Wave 3h–3i | 152 / 183 | 83.1% | +2.8pp |
| **M6 — Cross-Cutting Services** | Wave 4a–4c | 177 / 183 | 96.7% | +13.6pp |
| **M7 — Residuals** | Wave 4d–4e | 183 / 183 | 100.0% | +3.3pp |
| **Target — Full Coverage** | M7 | 183 / 183 | 100.0% | +62.8pp total |

### 7.1 Intermediate Target Recommendation

If full 100% coverage proves disproportionately expensive for the last few residuals, an **intermediate acceptance target of M4 (80.3%)** is recommended as the minimum viable Phase 4 exit threshold for the coverage-gap dimension. Rationale:

- At 80.3%, all foundational (A), administrative (B), and core commerce (H) RPCs are mocked — covering every primary user-facing flow.
- The remaining 19.7% (cross-cutting services + residuals) are admin/integration/legal surfaces with lower user-facing test-path density.
- The Phase 4 exit criterion is qualitative ("passing tests imply the production path will not fail on known contract breaks"); 80.3% covers all known contract-break paths identified in SCAR Phase 2/3.

**However**, the roadmap is designed to reach 100% with low marginal cost in Waves 4d–4e (6 RPCs, very low complexity). The Program Manager should prefer the full 100% target unless a specific residual is found to require disproportionate effort.

### 7.2 Milestone Verification

Every milestone is verifiable by a single command with deterministic output:

```text
npx tsx scripts/audit-rpc-contracts.ts
```

The coverage line (`Coverage : NN.N%`) is the milestone metric. No manual counting is required. This makes milestone acceptance objective and reproducible.

---

## 8. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Mock behavioral fidelity — a mock returns the wrong shape and tests pass against a fictional contract (the exact failure mode Phase 4 exists to eliminate) | **High** | Each task's acceptance requires the mock handler to match the canonical migration function's return shape. The audit gate already enforces mock ⊆ migrations. A follow-up shape-validation gate (out of scope for this roadmap) could be proposed as a Phase 4+ hardening task. |
| `tests/mocks/supabase.ts` grows to ~4,500 lines, reducing maintainability | Medium | The file is already a single dispatch function. A future refactor to a Map-based dispatch (noted in the existing `ponytail:` comment at line 67) is out of scope but available. The roadmap does not require it. |
| Complex stateful mocks (checkout, import, exchange) introduce test-only state bugs that mask real contract breaks | Medium | Complex handlers (6 RPCs in H3, H4, H7) should include at least one test that exercises the happy path and one that exercises the error/rollback path, per the ponytail rule "non-trivial logic leaves ONE runnable check behind." |
| Domain A auth mocks change behavior of existing 389 passing tests | Medium | Wave 1 acceptance must verify 389/389 (or updated count) tests still pass. Auth mocks are additive (new handlers), not modifications to existing handlers. |
| Scope creep — a task expands beyond its domain boundary | Low | The per-task acceptance criterion (§6.4 #6) explicitly prohibits touching files outside the mock + test scope. The audit gate's duplicate/stale detection provides an automated guard. |

---

## 9. Governance Notes

- This roadmap is a **planning artifact**. It creates no CURRENT_TASK. No implementation is authorized by this document alone.
- Each CURRENT_TASK generated from this roadmap must independently satisfy the Phase 4 CURRENT_TASK Generation Rule (`CURRENT_PHASE.md` §8): maps to a Phase 4 objective, stays inside Phase 4 scope, satisfies Phase 4 constraints, produces Phase 4 exit evidence.
- The roadmap does not modify the Phase 4 exit criteria. It proposes a path to satisfy the currently-partial criterion: *"Passing tests imply that the corresponding production path will not fail on the previously known contract breaks"* (CURRENT_TASK-013 Acceptance Record §10.1, status: Partially).
- The Program Manager may reorder waves, merge/split tasks, or adjust the target milestone. Any such adjustment should be recorded in a decision log entry.
- If the Program Manager approves this roadmap, the first action is to generate **TASK-A (Auth, Identity & Security)** as the next CURRENT_TASK, with its own Architecture Decision and Kickoff Plan, following the established CURRENT_TASK-006…013 document pattern.

---

## 10. Summary

| Item | Value |
|---|---|
| Total uncovered RPCs | 115 |
| Current coverage | 37.2% (68 / 183) |
| Domains identified | 8 (A–H), with H sub-divided into 9 sub-domains |
| Proposed CURRENT_TASKs | 16 (one per domain / sub-domain) |
| Proposed waves | 4 (Auth → Tenant Admin → Core Commerce × 9 → Cross-Cutting × 5) |
| Intermediate target | M4 — 80.3% (all foundational + commerce) |
| Full target | M7 — 100.0% (183 / 183) |
| Verification mechanism | `npx tsx scripts/audit-rpc-contracts.ts` (deterministic, single command) |
| Files touched per task | `tests/mocks/supabase.ts` + test files only (no production/migration/schema/CI changes) |

---

## 11. Decision Sought

The Program Manager is asked to approve, modify, or reject this roadmap. Specifically:

1. **Approve the domain classification** (8 domains, H sub-divided into 9).
2. **Approve the execution order** (Wave 1 Auth → Wave 2 Tenant Admin → Wave 3 Commerce × 9 → Wave 4 Cross-Cutting × 5).
3. **Approve the target** (full 100% coverage, with M4 80.3% as the recommended intermediate acceptance floor).
4. **Authorize generation of the first CURRENT_TASK** (TASK-A: Auth, Identity & Security) upon approval.

No CURRENT_TASK-014 is created by this document.

---

Awaiting Program Manager Decision
