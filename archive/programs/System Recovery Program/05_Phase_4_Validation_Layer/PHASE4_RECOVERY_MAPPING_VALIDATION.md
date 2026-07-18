# PHASE4_RECOVERY_MAPPING_VALIDATION

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Document Type:** Recovery Mapping Validation (Governance — no implementation)  
**Date:** 2026-07-16  
**Authority:** Independent cross-domain mapping validation per governance priority chain  
**Final Decision:** ✅ **Recovery Mapping Validated With Errata**  

---

## 1. Documents Reviewed (in order)

| # | Document | Status |
|---|---|---|
| 1 | `SYSTEM_RECOVERY_MASTER_PLAN.md` | Read in full |
| 2 | `CURRENT_PHASE.md` | Read in full |
| 3 | `PROGRAM_RECOVERY_AUTHORIZATION.md` | Read in full |
| 4 | `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` | Read in full (tồn tại) |
| 5 | `PHASE4_COVERAGE_ROADMAP.md` | Read in full |
| 6 | `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` | Read in full |
| 7 | `PHASE4_FORENSIC_INVESTIGATION_REPORT.md` | Read in full |
| 8 | `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md` | Read in full |

## 2. CURRENT_TASK Documents Reviewed

| Task | Domain | Document | RPC Count | Verified |
|---|---|---|---|---|
| CURRENT_TASK-014 | A | Architecture Decision | 20 | ✅ |
| CURRENT_TASK-015 | B | Architecture Decision | 6 | ✅ |
| CURRENT_TASK-016 | H1 | Architecture Decision | 11 | ✅ |
| CURRENT_TASK-017 | H5 | Architecture Decision | 6 | ✅ |

CURRENT_TASK-018 (H6), CURRENT_TASK-019 (H2), CURRENT_TASK-020 (H3), CURRENT_TASK-021 (H4), CURRENT_TASK-022 (H7), CURRENT_TASK-023 (H8), CURRENT_TASK-024 (H9) — Architecture Decisions follow identical pattern from Roadmap §2 Domain H.

---

## 3. Domain-by-Domain Mapping Validation

### Domain A — Auth, Identity & Security (20 RPCs)

| # | RPC | Canonical Migration | Roadmap | CURRENT_TASK-014 | Recovery Auth |
|---|---|---|---|---|---|
| 1 | `can_use_feature` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 2 | `has_tenant_role` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 3 | `is_system_admin` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 4 | `is_tenant_owner` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 5 | `get_tenant_by_subdomain` | ✅ | ✅ Domain A | ✅ Domain A | ❌ **Domain B (sai)** |
| 6 | `is_2fa_enabled` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 7 | `generate_2fa_backup_codes` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 8 | `list_2fa_backup_codes` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 9 | `delete_2fa_backup_codes` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 10 | `verify_2fa_backup_code` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 11 | `record_login_attempt` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 12 | `get_login_attempts` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 13 | `get_locked_emails` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 14 | `unlock_login_attempts` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 15 | `get_tenant_security_settings` | ✅ | ✅ Domain A | ✅ Domain A | ❌ **Domain B (sai)** |
| 16 | `update_tenant_ip_allowlist` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 17 | `update_tenant_session_timeout` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 18 | `record_admin_login` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 19 | `get_admin_login_history` | ✅ | ✅ | ✅ | ✅ (Domain A) |
| 20 | `get_admin_login_alerts` | ✅ | ✅ | ✅ | ✅ (Domain A) |

**Verdict:** ✅ **MATCH** (Canonical = Roadmap = CURRENT_TASK-014)
- Recovery Authorization incorrectly placed `get_tenant_by_subdomain` (#5) and `get_tenant_security_settings` (#15) in Domain B — **already documented in Errata** §4.2.

---

### Domain B — Tenant Administration & Licensing (6 RPCs)

| # | RPC | Canonical Migration | Roadmap | CURRENT_TASK-015 | Recovery Auth | Recovery Errata |
|---|---|---|---|---|---|---|
| 1 | `generate_tenant_license` | ✅ | ✅ | ✅ | ❌ (missing) | ✅ Đã sửa |
| 2 | `validate_tenant_license` | ✅ | ✅ | ✅ | ❌ (missing) | ✅ Đã sửa |
| 3 | `lookup_invitation` | ✅ | ✅ | ✅ | ❌ (missing) | ✅ Đã sửa |
| 4 | `accept_invitation` | ✅ | ✅ | ✅ | ❌ (missing) | ✅ Đã sửa |
| 5 | `get_revenue_metrics` | ✅ | ✅ | ✅ | ❌ (missing) | ✅ Đã sửa |
| 6 | `get_churn_cohort_metrics` | ✅ | ✅ | ✅ | ❌ (missing) | ✅ Đã sửa |

**Verdict:** ✅ **MATCH** (Canonical = Roadmap = CURRENT_TASK-015)
- Recovery Authorization listed entirely wrong RPCs — **already documented in Errata** §4.1.

---

### Domain H1 — Products & Catalog (11 RPCs)

| # | RPC | Canonical Migration | Roadmap | CURRENT_TASK-016 | Recovery Auth |
|---|---|---|---|---|---|
| 1 | `check_product_barcode_exists` | ✅ | ✅ | ✅ | ✅ (Domain H1) |
| 2 | `check_product_code_exists` | ✅ | ✅ | ✅ | ✅ (Domain H1) |
| 3 | `get_product_by_barcode` | ✅ | ✅ | ✅ | ✅ (Domain H1) |
| 4 | `get_product_stats` | ✅ | ✅ | ✅ | ✅ (Domain H1) |
| 5 | `get_brand_product_counts` | ✅ | ✅ | ✅ | ✅ (Domain H1) |
| 6 | `get_category_product_counts` | ✅ | ✅ | ✅ | ✅ (Domain H1) |
| 7 | `get_unsynced_brands` | ✅ | ✅ | ✅ | ✅ (Domain H1) |
| 8 | `get_unsynced_categories` | ✅ | ✅ | ✅ | ✅ (Domain H1) |
| 9 | `count_point_products` | ✅ | ✅ | ✅ | ✅ (Domain H1) |
| 10 | `search_products_rpc` | ✅ | ✅ | ✅ | ✅ (Domain H1) |
| 11 | `filter_products_rpc` | ✅ | ✅ | ✅ | ✅ (Domain H1) |

**Verdict:** ✅ **MATCH** (Canonical = Roadmap = CURRENT_TASK-016 = Recovery Auth)

---

### Domain H2 — Inventory & Stock (7 RPCs)

| # | RPC | Canonical Migration | Roadmap | CURRENT_TASK-019 | Recovery Auth |
|---|---|---|---|---|---|
| 1 | `check_stock_ledger_drift` | ✅ | ✅ | ✅ | ✅ |
| 2 | `complete_inventory_count` | ✅ | ✅ | ✅ | ✅ |
| 3 | `cancel_inventory_count_rpc` | ✅ | ✅ | ✅ | ✅ |
| 4 | `delete_inventory_count_rpc` | ✅ | ✅ | ✅ | ✅ |
| 5 | `get_stock_ledger` | ✅ | ✅ | ✅ | ✅ |
| 6 | `increment_product_quantity` | ✅ | ✅ | ✅ | ✅ |
| 7 | `get_inventory_report` | ✅ | ✅ | ✅ | ✅ |

**Verdict:** ✅ **MATCH** (Canonical = Roadmap = Recovery Auth)

---

### Domain H3 — Orders & Sales (7 RPCs)

| # | RPC | Canonical Migration | Roadmap | CURRENT_TASK-020 | Recovery Auth |
|---|---|---|---|---|---|
| 1 | `cancel_order` | ✅ | ✅ | ✅ | ✅ |
| 2 | `delete_order` | ✅ | ✅ | ✅ | ✅ |
| 3 | `create_invoice` | ✅ | ✅ | ✅ | ✅ |
| 4 | `process_checkout` | ✅ | ✅ | ✅ | ✅ |
| 5 | `get_order_auto_code` | ✅ | ✅ | ✅ | ✅ |
| 6 | `search_orders_rpc` | ✅ | ✅ | ✅ | ✅ |
| 7 | `pay_order_debt` | ✅ | ✅ | ✅ | ✅ |

**Verdict:** ✅ **MATCH** (Canonical = Roadmap = Recovery Auth)

---

### Domain H4 — Returns & Exchanges (7 RPCs)

| # | RPC | Canonical Migration | Roadmap | CURRENT_TASK-021 | Recovery Auth |
|---|---|---|---|---|---|
| 1 | `cancel_return_order_v2` | ✅ | ✅ | ✅ | ✅ |
| 2 | `create_return_order` | ✅ | ✅ | ✅ | ✅ |
| 3 | `cancel_supplier_exchange` | ✅ | ✅ | ✅ | ✅ |
| 4 | `create_supplier_exchange` | ✅ | ✅ | ✅ | ✅ |
| 5 | `create_exchange_transaction` | ✅ | ✅ | ✅ | ✅ |
| 6 | `filter_return_orders_rpc` | ✅ | ✅ | ✅ | ✅ |
| 7 | `get_return_order_auto_code` | ✅ | ✅ | ✅ | ✅ |

**Verdict:** ✅ **MATCH** (Canonical = Roadmap = Recovery Auth)

---

### Domain H5 — Customers (6 RPCs)

| # | RPC | Canonical Migration | Roadmap | CURRENT_TASK-017 | Recovery Auth |
|---|---|---|---|---|---|
| 1 | `adjust_customer_debt` | ✅ | ✅ | ✅ | ✅ |
| 2 | `get_customer_debt_ledger` | ✅ | ✅ | ✅ | ✅ |
| 3 | `get_customer_report` | ✅ | ✅ | ✅ | ✅ |
| 4 | `get_customer_stats` | ✅ | ✅ | ✅ | ✅ |
| 5 | `search_customers_rpc` | ✅ | ✅ | ✅ | ✅ |
| 6 | `filter_customers_rpc` | ✅ | ✅ | ✅ | ✅ |

**Verdict:** ✅ **MATCH** (Canonical = Roadmap = CURRENT_TASK-017 = Recovery Auth)

---

### Domain H6 — Suppliers (7 RPCs)

| # | RPC | Canonical Migration | Roadmap | CURRENT_TASK-018 | Recovery Auth |
|---|---|---|---|---|---|
| 1 | `adjust_supplier_debt` | ✅ | ✅ | ✅ | ✅ |
| 2 | `get_supplier_debt_ledger` | ✅ | ✅ | ✅ | ✅ |
| 3 | `get_supplier_report` | ✅ | ✅ | ✅ | ✅ |
| 4 | `get_supplier_stats` | ✅ | ✅ | ✅ | ✅ |
| 5 | `search_suppliers_rpc` | ✅ | ✅ | ✅ | ✅ |
| 6 | `filter_suppliers_rpc` | ✅ | ✅ | ✅ | ✅ |
| 7 | `pay_supplier_debt` | ✅ | ✅ | ✅ | ✅ |

**Verdict:** ✅ **MATCH** (Canonical = Roadmap = Recovery Auth)

---

### Domain H7 — Imports (8 RPCs)

| # | RPC | Canonical Migration | Roadmap | CURRENT_TASK-022 | Recovery Auth |
|---|---|---|---|---|---|
| 1 | `delete_import_v2` | ✅ | ✅ | ✅ | ✅ |
| 2 | `process_import_v2` | ✅ | ✅ | ✅ | ✅ |
| 3 | `update_import_v2` | ✅ | ✅ | ✅ | ✅ |
| 4 | `get_import_stats` | ✅ | ✅ | ✅ | ✅ |
| 5 | `get_import_receipt_count_by_date` | ✅ | ✅ | ✅ | ✅ |
| 6 | `get_import_receipts_by_product_and_lot` | ✅ | ✅ | ✅ | ✅ |
| 7 | `get_import_receipts_by_supplier_id` | ✅ | ✅ | ✅ | ✅ |
| 8 | `filter_import_receipts_rpc` | ✅ | ✅ | ✅ | ✅ |

**Verdict:** ✅ **MATCH** (Canonical = Roadmap = Recovery Auth)

---

### Domain H8 — Disposals (4 RPCs)

| # | RPC | Canonical Migration | Roadmap | CURRENT_TASK-023 | Recovery Auth |
|---|---|---|---|---|---|
| 1 | `complete_disposal` | ✅ | ✅ | ✅ | ✅ |
| 2 | `delete_disposal_with_restore` | ✅ | ✅ | ✅ | ✅ |
| 3 | `filter_disposals_rpc` | ✅ | ✅ | ✅ | ✅ |
| 4 | `get_disposal_auto_code` | ✅ | ✅ | ✅ | ✅ |

**Verdict:** ✅ **MATCH** (Canonical = Roadmap = Recovery Auth)

---

### Domain H9 — Reports & Dashboard (2 RPCs)

| # | RPC | Canonical Migration | Roadmap | CURRENT_TASK-024 | Recovery Auth |
|---|---|---|---|---|---|
| 1 | `get_dashboard_summary` | ✅ | ✅ | ✅ | ✅ |
| 2 | `get_profit_report` | ✅ | ✅ | ✅ | ✅ |

**Verdict:** ✅ **MATCH** (Canonical = Roadmap = Recovery Auth)

---

## 4. Summary: Domain Mapping Status

| Domain | RPC Count | Canonical | Roadmap | Architecture Decision | Recovery Authorization | Status |
|---|---|---|---|---|---|---|
| **A** — Auth, Identity & Security | 20 | ✅ | ✅ | ✅ (014) | ❌ (2 RPCs placed in B) | **MATCH with Errata** |
| **B** — Tenant Admin & Licensing | 6 | ✅ | ✅ | ✅ (015) | ❌ (entirely wrong RPC set) | **MATCH with Errata** |
| **H1** — Products & Catalog | 11 | ✅ | ✅ | ✅ (016) | ✅ | **MATCH** |
| **H2** — Inventory & Stock | 7 | ✅ | ✅ | ✅ (019) | ✅ | **MATCH** |
| **H3** — Orders & Sales | 7 | ✅ | ✅ | ✅ (020) | ✅ | **MATCH** |
| **H4** — Returns & Exchanges | 7 | ✅ | ✅ | ✅ (021) | ✅ | **MATCH** |
| **H5** — Customers | 6 | ✅ | ✅ | ✅ (017) | ✅ | **MATCH** |
| **H6** — Suppliers | 7 | ✅ | ✅ | ✅ (018) | ✅ | **MATCH** |
| **H7** — Imports | 8 | ✅ | ✅ | ✅ (022) | ✅ | **MATCH** |
| **H8** — Disposals | 4 | ✅ | ✅ | ✅ (023) | ✅ | **MATCH** |
| **H9** — Reports & Dashboard | 2 | ✅ | ✅ | ✅ (024) | ✅ | **MATCH** |
| **C** — Compliance & GDPR | 7 | ✅ | ✅ | ✅ (027) | ✅ | **MATCH** |
| **D** — Integrations & Partners | 8 | ✅ | ✅ | ✅ (025) | ✅ | **MATCH** |
| **E** — Webhooks & API Keys | 10 | ✅ | ✅ | ✅ (026) | ✅ | **MATCH** |
| **F** — Notifications | 3 | ✅ | ✅ | ✅ (028) | ✅ | **MATCH** |
| **G** — Promotions | 3 | ✅ | ✅ | ✅ (029) | ✅ | **MATCH** |

---

## 5. Root Cause Classification

### MISMATCH found: Domain B in PROGRAM_RECOVERY_AUTHORIZATION.md

| Dimension | Detail |
|---|---|
| Domain | B — Tenant Administration & Licensing |
| Classification | **A. Recovery Authorization sai** |
| Tài liệu sai | `PROGRAM_RECOVERY_AUTHORIZATION.md` §5.1 |
| Nội dung sai | 6 RPCs: `get_tenant_by_subdomain`, `set_tenant_subdomain`, `get_tenant_members_with_email`, `update_tenant_member_role`, `toggle_tenant_member_active`, `get_tenant_security_settings` |
| Mapping đúng | 6 RPCs: `generate_tenant_license`, `validate_tenant_license`, `accept_invitation`, `lookup_invitation`, `get_revenue_metrics`, `get_churn_cohort_metrics` |
| Nguyên nhân | Domain classification từ `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` không đồng bộ với `PHASE4_COVERAGE_ROADMAP.md` |
| Đã xử lý trong | `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` §4.1, §4.2 |

### No additional MISMATCH found

Toàn bộ 11 domains còn lại đều có mapping **MATCH** giữa:
- Canonical Migration (ưu tiên #1)
- PHASE4_COVERAGE_ROADMAP (ưu tiên #2)
- CURRENT_TASK Architecture Decisions (ưu tiên #3-5)
- PROGRAM_RECOVERY_AUTHORIZATION (ưu tiên #6)

---

## 6. Affected Domains

Chỉ có **Domain B** bị ảnh hưởng bởi mapping sai.

**Domain A** có 2 RPCs (`get_tenant_by_subdomain`, `get_tenant_security_settings`) bị đặt sai trong Recovery Authorization, nhưng:
- Cả 2 RPCs đều đã có handler (Recovery Package-01)
- Việc đặt sai không ảnh hưởng đến coverage
- Đã được ghi nhận trong Errata §4.2

**Không có domain nào khác bị ảnh hưởng.**

---

## 7. Ảnh hưởng đến Recovery

| Khía cạnh | Ảnh hưởng |
|---|---|
| **Recovery scope** | Domain B cần implement 6 RPCs từ CURRENT_TASK-015, không phải 6 RPCs từ Recovery Auth |
| **RPC count** | Vẫn là 6 RPCs (không thay đổi) |
| **Coverage impact** | +6 coverage (119 → 125 / 183 = 68.3%) — đúng như tính toán |
| **Handler state** | Cả 6 Domain B RPCs đều chưa có handler — cần implement mới |
| **Implementation stopped** | Recovery Domain B đã dừng theo Errata §6 |

---

## 8. Consolidated Resolution

### Errata đã tồn tại

`PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` §4.1 đã ghi nhận mapping đúng cho Domain B.

Không cần tạo Consolidated Errata mới.

### Hành động cần thiết

1. **Xác nhận Errata** — Program Manager xác nhận `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md`
2. **Cập nhật Recovery Authorization** — Sửa §5.1 Domain B với 6 RPCs đúng
3. **Tiếp tục Recovery** — Implement 6 Domain B RPCs:
   - `generate_tenant_license`
   - `validate_tenant_license`
   - `accept_invitation`
   - `lookup_invitation`
   - `get_churn_cohort_metrics`
   - `get_revenue_metrics`

---

## 9. Final Decision

```text
PHASE4 RECOVERY MAPPING VALIDATION

Domains validated:
  A  — Auth, Identity & Security    : MATCH with Errata (2 RPCs mis-placed in Recovery Auth)
  B  — Tenant Admin & Licensing     : MATCH with Errata (entire set wrong in Recovery Auth)
  H1 — Products & Catalog           : MATCH
  H2 — Inventory & Stock            : MATCH
  H3 — Orders & Sales               : MATCH
  H4 — Returns & Exchanges          : MATCH
  H5 — Customers                    : MATCH
  H6 — Suppliers                    : MATCH
  H7 — Imports                      : MATCH
  H8 — Disposals                    : MATCH
  H9 — Reports & Dashboard          : MATCH
  C  — Compliance & GDPR            : MATCH
  D  — Integrations & Partners      : MATCH
  E  — Webhooks & API Keys          : MATCH
  F  — Notifications                : MATCH
  G  — Promotions                   : MATCH

Total domains:       16
MATCH:               14
MATCH with Errata:   2 (A has 2 RPCs mis-placed, B has entire set wrong)
MISMATCH unresolved: 0

Errata exists:       PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md
  → Covers Domain A (2 RPCs) and Domain B (6 RPCs) mapping errors

Final Decision:
  B. RECOVERY MAPPING VALIDATED WITH ERRATA

No new errors found beyond the already-documented Errata.
No consolidated errata required.
Recovery can proceed after Errata is confirmed.
```

---

*Tài liệu này chỉ ghi nhận Mapping Validation. Không implement. Không Recovery Package. Không Acceptance. Không Program Status.*