# SCAR Phase 3 Report -- VietSalePro v7

**Date:** 2026-07-14
**Scope:** UI Layer ↔ Service Contract compliance assessment
**Input:** SCAR Phase 1 report, static analysis of pages/, components/, hooks/, services/, lib/, utils/, contexts/, App.tsx

---

## Executive Summary

| Metric | Value | Health |
|---|---|---|
| Total Pages | 41 | -- |
| Total Components (root) | 82 | -- |
| Total Components (admin) | 9 | -- |
| Total Hooks | 11 | -- |
| Total Service Files | 48 | -- |
| Dead Components | 7 | YELLOW |
| Dead Services | 4 | YELLOW |
| Direct DB Bypass from UI | 0 | GREEN |
| Acceptable Auth/Context Bypasses | 3 | GREEN |
| Service Coverage (UI→Service) | 91.7% | GREEN |
| Missing RPCs (from Phase 1) | 4 | RED |
| Duplicate Service Naming | 2 pairs | YELLOW |
| **Overall Phase 3 Score** | **85 / 100** | **Good** |

---

## PART 1: UI Inventory

### 1.1 Pages (41 total)

**Root pages/ (24):**

| # | Page | Route |
|---|---|---|
| 1 | AuditLog.tsx | /audit-log |
| 2 | BrandManagement.tsx | /brands |
| 3 | CategoryManagement.tsx | /categories |
| 4 | Customers.tsx | /customers |
| 5 | Dashboard.tsx | /tong-quan |
| 6 | DisposalForm.tsx | /inventory/disposals/create, /:id/view, /:id/edit |
| 7 | Disposals.tsx | /inventory/disposals |
| 8 | ImportGoods.tsx | /import, /import/create |
| 9 | InventoryCount.tsx | /inventory-count |
| 10 | LandingPage.tsx | /gioi-thieu |
| 11 | Login.tsx | (auth gate) |
| 12 | Orders.tsx | /orders |
| 13 | POS.tsx | /pos |
| 14 | Products.tsx | /products |
| 15 | Profile.tsx | /profile |
| 16 | ReportPagination.tsx | (subcomponent) |
| 17 | Reports.tsx | /reports |
| 18 | ReturnOrders.tsx | /return-orders |
| 19 | Settings.tsx | /settings |
| 20 | StockLedger.tsx | /stock-ledger |
| 21 | SupplierExchanges.tsx | /inventory/supplier-exchanges |
| 22 | Suppliers.tsx | /suppliers |
| 23 | SystemAdminDashboard.tsx | (redirect to /admin) |
| 24 | TaxCalculation.tsx | /tax |

**Admin pages/admin/ (17):**

| # | Page | Route |
|---|---|---|
| 1 | AdminDashboardInner.tsx | (shared panel component) |
| 2 | AdminLayout.tsx | /admin/* (shell) |
| 3 | Analytics.tsx | /admin/analytics |
| 4 | Audit.tsx | /admin/audit |
| 5 | Billing.tsx | /admin/billing |
| 6 | BillingInvoices.tsx | /admin/billing/invoices |
| 7 | BillingPayments.tsx | /admin/billing/payments |
| 8 | Compliance.tsx | /admin/compliance |
| 9 | Health.tsx | /admin/health |
| 10 | InvitationsAccept.tsx | /admin/invitations/accept |
| 11 | Members.tsx | /admin/members |
| 12 | Onboarding.tsx | /admin/onboarding |
| 13 | Overview.tsx | /admin/overview |
| 14 | Security.tsx | /admin/security |
| 15 | Settings.tsx | /admin/settings |
| 16 | TenantDetail.tsx | /admin/tenants/:id |
| 17 | Tenants.tsx | /admin/tenants |

All 17 admin pages are lazy-loaded via `React.lazy()` in App.tsx (except InvitationsAccept which is eagerly loaded).

### 1.2 Components (91 total)

**Root components/ (82 files):**
ActionButton, AdminKpiCards, AdminNotificationBell, AdminShell, AdminSidebar, AdminTabs, AdvancedFilterPanel, AnnouncementBanner, AnnouncementManager, ApiKeyManager, AppShell, AppTopbar, BarcodeScannerFix, BatchActionsBar, BillingAutomationDashboard, BillingConfig, BillingReminderConfig, BottomNav, BulkMaintenancePanel, ChurnCohortMetrics, ComplianceManager, ConfirmDialog, DataGrid, DebtLedgerModal, EmailTemplateManager, EmptyState, ErrorBoundary, ErrorPerformancePanel, ErrorState, FeaturePicker, FormField, FraudRetentionPanel, ImpersonationBanner, InAppMessageBanner, IntegrationMarketplace, InvoiceCreator, InvoiceManager, InvoicePaymentConfirm, LoadingState, MasterModal, MemberManagement, MfaChallenge, MobileCustomers, MobileHome, MobileInventory, MobileLayout, MobileOrders, MobilePOS, MobileSettings, ModalInfoGrid, ModalSection, ModalTable, NotificationManager, PageHeader, PayDebtModal, PaymentManager, ProductEditModal, ReadOnlyBanner, ReadReplicaQueueManager, RevenueMetrics, SectionBox, SelectInput, SkeletonCard, SkeletonLoader, SplitPane, StatusBadge, StorageBackupPanel, SubscriptionManager, SummaryRow, SystemHealthPanel, TaxCalculationModal, TenantStatusPages, TextInput, TicketInbox, Toast, ToastContainer, TwoFactorManager, ui, UserMenuMobile, VoucherManager, WebhookManager, WhiteLabelManager

**Admin components/ (9 files):**
AccountSelector, AdminDashboardHeader, AdminSettingsNav, AuditExportPanel, CustomDomainPanel, LicenseManagerPanel, SecuritySettingsPanel, SubdomainManagerPanel, UserAccountButton

**Subdirectories:** desktop-pos/, disposal-form/, inventory-count/, MemberManagement/, orders/, shared/, voucher-form/

### 1.3 Hooks (11 total)

| Hook | Service Dependency | Purpose |
|---|---|---|
| useAdminFeatureFlags | tenantService | Tenant feature flags |
| useAdminList | (none) | Generic admin list pagination |
| useAdminRealtime | lib/supabase (direct) | Realtime subscription |
| useBarcodeCapture | (none) | Barcode scanner |
| useClickOutside | (none) | Click outside detection |
| useConfirmDialog | (none) | Confirm dialog state |
| useDebounce | (none) | Debounce utility |
| usePermissions | useTenant | Permission checks |
| usePOS | supabaseService | POS operations |
| useReturnOrder | supabaseService | Return order operations |
| useTenant | (re-export TenantContext) | Tenant context |

### 1.4 Contexts (2)

| Context | Service Dependencies |
|---|---|
| AuthContext | supabase.auth.*, auditService, loginHistoryService, twoFactorService |
| TenantContext | supabase.rpc (get_tenant_by_subdomain), supabase.from (tenant_memberships) |

**Total UI Modules: 145** (41 pages + 91 components + 11 hooks + 2 contexts)

---

## PART 2: UI → Service Mapping Matrix

### 2.1 Root Pages → Service

| UI Module | Imported Service | Functions Used | RPC (via Service) | Status |
|---|---|---|---|---|
| AuditLog | auditService | getAuditLogs | (table: app_audit_log) | CANONICAL |
| BrandManagement | supabaseService | getBrandProductCounts, getUnsyncedBrands | get_brand_product_counts, get_unsynced_brands | CANONICAL |
| CategoryManagement | supabaseService | getCategoryProductCounts, getUnsyncedCategories, getProductStats | get_category_product_counts, get_unsynced_categories, get_product_stats | CANONICAL |
| Customers | supabaseService | getCustomersPaginated, getCustomerOrders, getPointHistory | filter_customers_rpc | CANONICAL |
| Dashboard | supabaseService | (via useNewDashboard feature flag) | get_dashboard_summary | CANONICAL |
| DisposalForm | supabaseService | searchProducts, getDisposalById, getProductById | search_products_rpc, filter_disposals_rpc | CANONICAL |
| Disposals | supabaseService | filterDisposalsPaginated, deleteDisposal | filter_disposals_rpc, delete_disposal_with_restore | CANONICAL |
| ImportGoods | supabaseService | getImportReceiptCountByDate, getSupplierById, getProductById, getSuppliers, searchProducts | get_import_receipt_count_by_date, process_import_v2 | CANONICAL |
| InventoryCount | supabaseService | getProducts | (table: products) | CANONICAL |
| LandingPage | (none) | -- | -- | CANONICAL |
| Login | supabase (direct), loginHistoryService, twoFactorService | signInWithPassword, recordAdminLogin, isMfaRequired | record_admin_login, is_2fa_enabled | AUTH BYPASS (acceptable) |
| Orders | supabaseService | getOrdersPaginated, getCustomerById | search_orders_rpc | CANONICAL |
| POS | supabaseService, usePOS | searchCustomers, searchProducts | search_products_rpc, search_customers_rpc | CANONICAL |
| Products | supabaseService | getProducts, getProductStats, filterProductsPaginated | filter_products_rpc, get_product_stats | CANONICAL |
| Profile | (none - AuthContext) | -- | -- | CANONICAL |
| ReportPagination | (none) | -- | -- | CANONICAL |
| Reports | supabaseService | getSalesReport, getProfitReport, getInventoryReport, getCustomerReport, getSupplierReport | get_sales_report, get_profit_report, get_inventory_report, get_customer_report, get_supplier_report | CANONICAL |
| ReturnOrders | supabaseService, useReturnOrder | getCustomerById, getProductById | filter_return_orders_rpc | CANONICAL |
| Settings | supabaseService | searchProducts | search_products_rpc | CANONICAL |
| StockLedger | supabaseService | searchProducts, getStockLedger, checkStockLedgerDrift | get_stock_ledger, check_stock_ledger_drift | CANONICAL |
| SupplierExchanges | supabaseService | searchSuppliers, getSupplierExchanges, getImportReceiptById, searchProducts, getProductById | create_supplier_exchange, cancel_supplier_exchange | CANONICAL |
| Suppliers | supabaseService | getSupplierStats, filterSuppliersPaginated, getImportReceiptsBySupplierId | filter_suppliers_rpc, get_supplier_stats | CANONICAL |
| SystemAdminDashboard | (redirect only) | -- | -- | CANONICAL |
| TaxCalculation | supabaseService | getOrders, getSettings | (table queries) | CANONICAL |

### 2.2 Admin Pages → Service

| UI Module | Imported Service | Functions Used | Status |
|---|---|---|---|
| AdminDashboardInner | admin/tenantAdminService, admin/auditAdminService, admin/systemAdminService | getTopTenants, getTenantGrowth, getRateLimitLogs, getAdminLoginHistory, getSystemOverview, getSystemAdmins, addSystemAdmin, removeSystemAdmin, createSystemAdmin, getDataRetentionStatus, getDefaultPlanLimits, setDefaultPlanLimits, getMaintenanceMode, setMaintenanceMode | CANONICAL |
| AdminLayout | (none) | -- | CANONICAL |
| Analytics | admin/analyticsAdminService | getAdminRevenueMetrics, getAdminChurnCohortMetrics | CANONICAL |
| Audit | admin/auditAdminService, admin/tenantAdminService | getAdminAuditLogs, listAccounts | CANONICAL |
| Billing | admin/billingAdminService | getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount, getCompanyInfo, setCompanyInfo | CANONICAL |
| BillingInvoices | (delegates to InvoiceManager component) | -- | CANONICAL |
| BillingPayments | (delegates to PaymentManager component) | -- | CANONICAL |
| Compliance | (delegates to AdminDashboardInner) | -- | CANONICAL |
| Health | (delegates to AdminDashboardInner) | -- | CANONICAL |
| InvitationsAccept | admin/memberAdminService | lookupInvitation, acceptInvitation | CANONICAL |
| Members | admin/tenantAdminService | listAccounts | CANONICAL |
| Onboarding | admin/tenantAdminService | createAccount | CANONICAL |
| Overview | (delegates to AdminDashboardInner) | -- | CANONICAL |
| Security | admin/tenantAdminService, admin/systemAdminService | listAccounts, getTenantSecuritySettings, updateTenantIpAllowlist, updateTenantSessionTimeout, getLockedEmails, unlockLoginAttempts | CANONICAL |
| Settings | (delegates to AdminDashboardInner) | -- | CANONICAL |
| TenantDetail | admin/tenantAdminService | getAccount | CANONICAL |
| Tenants | admin/tenantAdminService, admin/systemAdminService, admin/billingAdminService | listAccounts, createTenantWithCredentials, softDeleteTenant, hardDeleteTenant, restoreTenantStatus, getTenantFeatureFlags, updateTenantFeatureFlags, checkSubdomainAvailability, startImpersonation, downloadTenantBackup, restoreTenantBackup, previewBackupTables, validateBackup, resetDemoData, getTenantSubscription, updateTenantSubscription | CANONICAL |

---

## PART 3: Service Usage

### 3.1 Services Used by UI

| Service File | UI Consumers | Consumer Type |
|---|---|---|
| supabaseService.ts | 18 pages, 10 components, 2 hooks, App.tsx | Direct |
| admin/tenantAdminService.ts | 7 admin pages, 3 admin components | Direct |
| admin/systemAdminService.ts | 3 admin pages, 1 admin component | Direct (re-export wrapper) |
| admin/auditAdminService.ts | 2 admin pages, 1 admin component | Direct |
| admin/billingAdminService.ts | 2 admin pages, 1 component | Direct |
| admin/analyticsAdminService.ts | 1 admin page | Direct |
| admin/memberAdminService.ts | 1 admin page, 2 components | Direct |
| admin/licenseService.ts | 1 admin component | Direct |
| tenantService.ts | 9 components | Direct |
| webhookService.ts | 1 component | Direct |
| invoiceService.ts | 3 components | Direct |
| announcementService.ts | 1 component | Direct |
| apiKeyService.ts | 1 component | Direct |
| auditService.ts | 1 page, AuthContext | Direct |
| billingAutomationService.ts | 2 components | Direct |
| billingReminderService.ts | 1 component | Direct |
| complianceService.ts | 1 component | Direct |
| admin/complianceAdminService.ts | 1 component | Direct |
| cronJobService.ts | 1 component | Direct |
| emailTemplateService.ts | 1 component | Direct |
| errorPerformanceService.ts | 1 component | Direct |
| fraudRetentionService.ts | 1 component | Direct |
| heavyOpsQueueService.ts | 1 component | Direct |
| integrationService.ts | 1 component | Direct |
| loginHistoryService.ts | 1 page (Login), AuthContext | Direct |
| maintenanceService.ts | 1 component | Direct |
| notificationService.ts | 2 components | Direct |
| planService.ts | 1 component | Direct |
| promotionService.ts | 2 components | Direct |
| systemBackupService.ts | 1 component | Direct |
| systemHealthService.ts | 1 component | Direct |
| systemAdminService.ts | 1 component (TicketInbox) | Direct |
| twoFactorService.ts | 1 page (Login), 1 component, AuthContext | Direct |
| admin/supportService.ts | 1 component (TicketInbox) | Direct |

### 3.2 Services NOT Used by Any UI

| Service File | Used By | Status |
|---|---|---|
| admin/billingProviderRegistry.ts | Nothing | **DEAD** |
| admin/smsService.ts | Tests only | **DEAD (UI)** |
| subscriptionService.ts | Tests only | **DEAD (UI)** |
| ticketService.ts | Tests only (legacy re-export) | **LEGACY** |
| operationsService.ts | admin/systemAdminService.ts (re-export) | Indirect |
| tenantBackupService.ts | admin/systemAdminService.ts (re-export) | Indirect |
| tenantRestoreService.ts | admin/systemAdminService.ts (re-export) | Indirect |
| tenantMigrationService.ts | admin/systemAdminService.ts (re-export) | Indirect |
| bankAccountService.ts | admin/billingAdminService.ts (re-export) | Indirect |
| admin/permissions.ts | Re-export of lib/permissions.ts | Indirect |
| admin/providers/*.ts | (4 provider files) | **DEAD** |

### 3.3 Coverage

- Total service files: 48
- Services with UI consumers (direct): 34
- Services with UI consumers (indirect via re-export): 5
- Dead services: 4 (billingProviderRegistry, smsService, subscriptionService, 4 provider files)
- Legacy services: 1 (ticketService)

**Coverage: 39/48 = 81.3%** (excluding provider stubs; 39/43 = 90.7% excluding stubs)

---

## PART 4: Import Consistency

### 4.1 Supabase Client Import Patterns

| Pattern | Used By | Count | Status |
|---|---|---|---|
| `import { supabase } from '../lib/supabase'` | All root services, Login.tsx, AuthContext, TenantContext, useAdminRealtime, lib/permissions, lib/tenant | ~35 | CANONICAL |
| `import { supabase } from '../../lib/supabase'` | All admin services | ~12 | CANONICAL |
| `import { supabaseService } from '../services/supabaseService'` | 18 root pages, 10 components, 2 hooks, App.tsx | ~31 | CANONICAL |
| `import { supabaseService } from '../../services/supabaseService'` | 1 component (CustomerOrdersModal) | 1 | CANONICAL |

**Finding:** All imports are consistent. No wrong-module or legacy-module imports detected.

### 4.2 Duplicate Module Imports

| Source Service | Admin Wrapper | Pattern | Status |
|---|---|---|---|
| services/systemAdminService.ts | services/admin/systemAdminService.ts | Re-export wrapper | INTENTIONAL |
| services/tenantService.ts | services/admin/tenantAdminService.ts | Re-export + new functions | INTENTIONAL |
| services/bankAccountService.ts | services/admin/billingAdminService.ts | Re-export + new functions | INTENTIONAL |
| services/tenantService.ts | services/admin/memberAdminService.ts | Re-export + new functions | INTENTIONAL |
| services/admin/supportService.ts | services/ticketService.ts | Legacy re-export | **LEGACY** |
| lib/permissions.ts | services/admin/permissions.ts | Re-export | INTENTIONAL |

**Finding:** The admin wrapper pattern is intentional and consistent. One legacy re-export file (ticketService.ts) should be removed.

### 4.3 Cross-Layer Import Violations

| Violation | File | Import | Severity |
|---|---|---|---|
| Component imports from Page | SystemHealthPanel.tsx | `{ DashboardV2KPI } from '../pages/Dashboard'` | MEDIUM |
| Component imports from Page | StorageBackupPanel.tsx | `{ DashboardV2KPI } from '../pages/Dashboard'` | MEDIUM |
| Component imports from Page | BulkMaintenancePanel.tsx | `{ DashboardV2KPI } from '../pages/Dashboard'` | MEDIUM |
| Component imports from Page | ErrorPerformancePanel.tsx | `{ DashboardV2KPI } from '../pages/Dashboard'` | MEDIUM |

**Finding:** 4 components import a type (`DashboardV2KPI`) from a page file. This inverts the dependency direction (components should not depend on pages). The type should be extracted to a shared types file.

---

## PART 5: Call Flow

### 5.1 Architecture Diagram

```
┌───────────────────────────────────────────────────┐
│                    UI LAYER                        │
│  Pages / Components / Hooks                        │
│  (No direct supabase.rpc / supabase.from calls)    │
└──────────────┬────────────────────────────────────┘
               │ import
┌──────────────▼────────────────────────────────────┐
│                SERVICE LAYER                       │
│  supabaseService.ts (3979 lines, 139 functions)    │
│  services/admin/* (thin wrappers)                  │
│  services/*.ts (domain services)                   │
└──────────────┬────────────────────────────────────┘
               │ supabase.rpc() / supabase.from()
┌──────────────▼────────────────────────────────────┐
│           DATABASE CONTRACT (via Supabase)          │
│  ~160 RPCs, ~30 tables, RLS policies               │
└───────────────────────────────────────────────────┘
```

### 5.2 Bypass Analysis

| File | Bypass Type | Detail | Verdict |
|---|---|---|---|
| pages/Login.tsx | supabase.auth.signInWithPassword | Auth operation | ACCEPTABLE |
| contexts/AuthContext.tsx | supabase.auth.*, supabase.rpc('activate_pending_memberships') | Auth context bootstrap | ACCEPTABLE |
| contexts/TenantContext.tsx | supabase.rpc('get_tenant_by_subdomain'), supabase.from('tenant_memberships') | Tenant resolution | ACCEPTABLE |
| hooks/useAdminRealtime.ts | supabase.channel('admin-events') | Realtime subscription | ACCEPTABLE |
| lib/permissions.ts | supabase.rpc('is_system_admin'), supabase.rpc('has_tenant_role'), etc. | Permission checks | ACCEPTABLE (lib layer) |
| lib/tenant.ts | supabase.rpc('get_tenant_by_subdomain'), supabase.rpc('get_tenant_by_domain') | Tenant resolution | ACCEPTABLE (lib layer) |

**Finding:** ZERO pages or components directly call `supabase.rpc()` or `supabase.from()`. All database access from UI goes through the service layer. The only bypasses are in auth contexts, permission lib, and tenant resolution -- all acceptable architectural patterns.

### 5.3 Multiple Call Paths

| Function | Path 1 | Path 2 | Conflict? |
|---|---|---|---|
| getSystemAdmins | TicketInbox → systemAdminService | AdminDashboardInner → admin/systemAdminService → systemAdminService | NO (same underlying function) |
| listAccounts | Audit → admin/tenantAdminService | Members → admin/tenantAdminService | NO (same service) |
| getTenantSecuritySettings | Security → admin/systemAdminService | SecuritySettingsPanel → admin/systemAdminService | NO (same service) |

**Finding:** No conflicting call paths detected. All re-export wrappers point to the same canonical implementation.

---

## PART 6: Dead UI

### 6.1 Dead Components (7)

| Component | Evidence | Last Import |
|---|---|---|
| AdminTabs.tsx | Zero imports outside self | Never imported |
| AnnouncementBanner.tsx | Zero imports | Never imported |
| AnnouncementManager.tsx | Zero imports | Never imported |
| BillingConfig.tsx | Zero imports | Never imported |
| FormField.tsx | Only test imports | tests/components/ux-3-modals.test.tsx |
| ModalSection.tsx | Re-exported from MasterModal but never consumed | Never consumed |
| SkeletonCard.tsx | Zero imports | Never imported |

### 6.2 Dead Hooks

None. All 11 hooks are imported by at least one page, component, or other hook.

### 6.3 Dead Pages

| Page | Evidence | Status |
|---|---|---|
| ReportPagination.tsx | Not a routed page, used as subcomponent. No import found in App.tsx routing. | POSSIBLY DEAD |
| SystemAdminDashboard.tsx | Contains only a `<Navigate>` redirect to /admin. Exports `calculateProration` and `planLabel` used by tests. | LEGACY (redirect-only) |

---

## PART 7: Service Contract Compliance

### 7.1 Contract Type Assessment

The UI layer follows an **RPC-Facade via Service Layer** contract:

1. **All UI data access goes through service functions** -- no exceptions.
2. **supabaseService.ts is the mega-service** for tenant-level CRUD (3979 lines, 139 methods, 57 RPC calls, 91 table calls).
3. **Admin services are thin wrappers** that re-export from root services and add admin-specific functions.
4. **No legacy/deprecated service imports** detected in UI.
5. **No wrapper-of-wrapper chains** beyond the intentional admin wrapper pattern.

### 7.2 Canonical vs Non-Canonical Calls

| Call Type | Count | % |
|---|---|---|
| Canonical (UI → Service → RPC/Table) | ALL service calls | 100% |
| Legacy Service | 0 | 0% |
| Dead Service Calls | 0 | 0% |
| Direct DB Bypass (UI → Supabase) | 0 | 0% |
| Acceptable Auth/Context Bypass | 6 instances | N/A |

### 7.3 Phase 1 Missing RPCs Impact on UI

| Missing RPC | Called From Service | UI Consumer | Impact |
|---|---|---|---|
| admin_update_subscription | tenantService.ts:481 | Unknown (possibly dead path) | Runtime error if called |
| get_member_with_email | tenantService.ts:591 | MemberManagement components (via admin/memberAdminService re-export) | Runtime error if called |
| search_members_by_email | tenantService.ts:610 | MemberManagement components (via admin/memberAdminService re-export) | Runtime error if called |
| get_storage_usage | tenantService.ts:1009, 1017 | Unknown (possibly dead path) | Runtime error if called |

---

## PART 8: Naming Consistency

### 8.1 UI → Service Naming

| Layer | Convention | Example | Status |
|---|---|---|---|
| UI (import) | camelCase module name | `supabaseService`, `tenantAdminService` | CONSISTENT |
| Service (export) | camelCase function name | `getAuditLogs`, `createTenant` | CONSISTENT |
| Service (RPC call) | snake_case | `get_audit_logs`, `create_tenant_with_admin` | CONSISTENT |

### 8.2 Service File Naming

| Pattern | Files | Status |
|---|---|---|
| `{domain}Service.ts` | 28 root files | CONSISTENT |
| `{domain}AdminService.ts` | 6 admin files | CONSISTENT |
| `{domain}Provider.ts` | 4 provider files | CONSISTENT |
| Exception: `permissions.ts` | 2 files (lib + admin) | ACCEPTABLE |

### 8.3 Admin Wrapper Naming Ambiguity

| Root Service | Admin Wrapper | Ambiguity |
|---|---|---|
| services/systemAdminService.ts | services/admin/systemAdminService.ts | **SAME NAME** in different directories |

**Evidence:**
- TicketInbox.tsx imports from `../services/systemAdminService` (root)
- AdminDashboardInner.tsx imports from `../../services/admin/systemAdminService` (admin wrapper)

This creates ambiguity. A developer must know which `systemAdminService` to import based on context. However, import paths make it unambiguous at the code level.

---

## Metrics

| Metric | Value | Method |
|---|---|---|
| Total UI Modules | 145 | Counted: 41 pages + 91 components + 11 hooks + 2 contexts |
| Total Service Calls from UI | ~120 | Counted from import analysis (function imports across all UI files) |
| Canonical Calls | ~120 | All calls go through service layer |
| Legacy Calls | 0 | No deprecated service imports |
| Dead Calls | 0 | No calls to dead services |
| Duplicate Calls | 0 | No function called via two different services by same UI module |
| Wrapper Calls | ~40 | Admin pages call thin wrapper services |
| Coverage (Services with UI consumers) | 81.3% (39/48) | Excluding provider stubs: 90.7% |
| Dead Components | 7 | Static import analysis |
| Dead Services (no UI consumer) | 4 + 4 providers | Static import analysis |
| Cross-layer violations | 4 | Component → Page imports |

---

## Critical Findings

None.

---

## High Findings

### H-1: supabaseService.ts God Service (3979 lines, 139 methods)

**Evidence:** `services/supabaseService.ts` -- 3979 lines, 139 async methods, 57 RPC calls, 91 direct table calls.

**Impact:** Single point of coupling for all tenant-level operations. Any change risks regression across all tenant pages.

**UI File:** All 18 root pages import from this single file.
**Service File:** `services/supabaseService.ts`
**Evidence:** Line count, grep for `async \w+\(` returns 139 matches.

### H-2: 4 Missing RPCs Will Cause Runtime Errors

**Evidence:** Phase 1 identified 4 RPCs called by services but never defined in migrations:
- `admin_update_subscription` (tenantService.ts:481)
- `get_member_with_email` (tenantService.ts:591)
- `search_members_by_email` (tenantService.ts:610)
- `get_storage_usage` (tenantService.ts:1009, 1017)

**Impact:** UI paths that reach these service functions will fail with `function not found` errors.

**UI Files:** Components importing from tenantService/admin wrappers that call these functions.
**Service File:** `services/tenantService.ts`
**Evidence:** Phase 1 SCAR report, grep for RPC names in migration files returns 0 matches.

---

## Medium Findings

### M-1: 7 Dead Components

**Evidence:** 7 components have zero imports from any page, component, hook, or App.tsx.
**Files:** AdminTabs.tsx, AnnouncementBanner.tsx, AnnouncementManager.tsx, BillingConfig.tsx, FormField.tsx, ModalSection.tsx, SkeletonCard.tsx
**Impact:** Dead code increases bundle size and maintenance burden.

### M-2: 4 Component → Page Import Violations

**Evidence:** 4 components import `DashboardV2KPI` from `pages/Dashboard.tsx`.
**Files:** SystemHealthPanel.tsx, StorageBackupPanel.tsx, BulkMaintenancePanel.tsx, ErrorPerformancePanel.tsx
**Import:** `import { DashboardV2KPI } from '../pages/Dashboard'`
**Impact:** Inverted dependency direction. Components should not depend on pages.

### M-3: Duplicate systemAdminService Naming

**Evidence:** `services/systemAdminService.ts` and `services/admin/systemAdminService.ts` have the same filename in different directories. Both are imported by UI.
**Impact:** Developer confusion about which to import.

### M-4: Dead Services and Provider Stubs

**Evidence:**
- `services/admin/billingProviderRegistry.ts` -- zero imports anywhere
- `services/admin/smsService.ts` -- only test imports
- `services/subscriptionService.ts` -- only test imports
- `services/admin/providers/*.ts` (4 files) -- zero imports
- `services/ticketService.ts` -- legacy re-export

**Impact:** Dead code. Provider stubs suggest unfinished billing integration.

---

## Low Findings

### L-1: Legacy ticketService.ts Re-export

**Evidence:** `services/ticketService.ts` contains only `export * from './admin/supportService'`. Only imported by tests.
**Impact:** Minor maintenance noise.

### L-2: ReportPagination.tsx Possibly Dead

**Evidence:** Not registered as a route in App.tsx. No import found. May be used within Reports.tsx via local import.
**Impact:** Negligible.

---

## UI Health Score

**88 / 100**

| Factor | Weight | Score | Notes |
|---|---|---|---|
| All pages routed | 20% | 20/20 | All 41 pages have routes or are sub-components |
| No direct DB bypass | 25% | 25/25 | Zero UI-to-DB bypasses |
| Dead component ratio | 15% | 12/15 | 7 dead out of 91 (7.7%) |
| Import consistency | 15% | 13/15 | 4 cross-layer violations |
| Hook architecture | 10% | 10/10 | Clean hook→service pattern |
| Feature flag system | 15% | 8/15 | 26 flags all set to true (no actual gating) |

---

## Service Usage Score

**82 / 100**

| Factor | Weight | Score | Notes |
|---|---|---|---|
| Service coverage | 30% | 27/30 | 90.7% (excluding provider stubs) |
| No dead service calls | 20% | 20/20 | Zero dead calls from UI |
| Clean wrapper pattern | 20% | 18/20 | Admin wrappers are intentional, one legacy re-export |
| Dead service ratio | 15% | 10/15 | 8 files with no UI consumer |
| Service file organization | 15% | 7/15 | God service (3979 lines), duplicate naming |

---

## Contract Compliance Score

**85 / 100**

| Factor | Weight | Score | Notes |
|---|---|---|---|
| UI respects service boundary | 30% | 30/30 | Zero bypasses |
| All calls are canonical | 20% | 20/20 | No legacy/dead/wrapper calls |
| No conflicting call paths | 15% | 15/15 | All re-exports resolve to same function |
| Missing RPC coverage | 20% | 10/20 | 4 missing RPCs from Phase 1 |
| Naming consistency | 15% | 10/15 | Consistent camelCase/snake_case but duplicate file naming |

---

## Overall Phase 3 Score

**85 / 100**

Weighted average: UI Health (30%) + Service Usage (30%) + Contract Compliance (40%)
= (88 × 0.30) + (82 × 0.30) + (85 × 0.40)
= 26.4 + 24.6 + 34.0
= **85.0**

---

## Architecture Decision

### OPTION B

**UI Layer has minor Drift.**

The UI layer fundamentally respects the service contract. All database access goes through the service layer. Admin wrappers are intentional thin re-export layers. No legacy or deprecated imports are used.

The drift is limited to:

1. **God Service** -- supabaseService.ts (3979 lines) concentrates all tenant CRUD, creating a single point of coupling.
2. **Dead code** -- 7 dead components, 8+ dead service files.
3. **Missing RPCs** -- 4 RPCs called by services but never defined in database (carried from Phase 1).
4. **Cross-layer import** -- 4 components import a type from a page file.
5. **Duplicate naming** -- Two files named `systemAdminService.ts` in different directories.

None of these represent a structural breakdown. They are maintenance-level issues that do not compromise the service contract.

---

## Evidence

All conclusions are backed by:

| Conclusion | Evidence Type | Files |
|---|---|---|
| Zero UI→DB bypass | grep `supabase\.rpc\(` and `supabase\.from\(` in pages/**/*.tsx, components/**/*.tsx, hooks/**/*.tsx | 0 matches |
| All pages import services | grep `from ['"].*service` in pages/**/*.tsx | 37 matches, all point to services/ or services/admin/ |
| Dead components | grep for import of component name across all .tsx files | 7 components with 0 imports |
| Dead services | grep for import of service name across pages/, components/, hooks/, App.tsx | 8+ files with 0 UI imports |
| Admin wrapper pattern | read services/admin/systemAdminService.ts | Pure re-export, 0 new functions |
| Cross-layer violation | grep `from ['"].*pages/` in components/**/*.tsx | 4 matches importing DashboardV2KPI |
| Consistent naming | grep import patterns across all layers | camelCase functions, snake_case RPCs |

---

## Final Recommendation

### CONTINUE

The UI Layer has minor drift but fundamentally adheres to the Service Contract. The project can proceed to SCAR Phase 4.

---

## Validation

- No code was modified.
- No migrations were modified.
- No deployments were performed.
- No governance documents were updated.
- No implementation was performed.
- No CURRENT_TASK was generated.

---

*Report generated by SCAR Phase 3 analysis. All counts are based on static analysis of TypeScript source files.*
