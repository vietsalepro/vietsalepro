# RECOVERY PACKAGE-01 — INDEPENDENT VERIFICATION REPORT

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Package:** Recovery Package-01 — Domain A (Auth, Identity & Security)  
**Verification Date:** 2026-07-16  
**Document Type:** Independent Verification Report  
**Authority:** Independent Acceptance Review  
**Status:** PASS WITH OBSERVATIONS  

---

## 1. Mandate

Báo cáo này là kết quả của bước **Independent Verification** cho Recovery Package-01.  
Tuyệt đối:

- Không sửa code.
- Không sửa mock.
- Không sửa report khác.
- Chỉ kiểm tra dựa trên **code thực tế**.
- Chỉ sinh **RECOVERY_PACKAGE_01_VERIFICATION_REPORT.md**.

---

## 2. Tài liệu đã đọc

| # | Tài liệu | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | `SYSTEM_RECOVERY_MASTER_PLAN.md` | Đọc | Lấy Phase 4 scope, exit criteria, validation. |
| 2 | `CURRENT_PHASE.md` | Đọc | Phase 4 active; success criteria, constraints. |
| 3 | `PROGRAM_RECOVERY_AUTHORIZATION.md` | Đọc | Baseline thực tế 99/184, forensic findings. |
| 4 | `PHASE4_RECOVERY_MASTER_SPECIFICATION.md` | **Không tồn tại** | File không có trong working tree. Không dùng làm baseline. |
| 5 | `RECOVERY_PACKAGE_01_IMPLEMENTATION_REPORT.md` | Đọc | Claim 20 Domain A handlers, coverage 119/184. |
| 6 | `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md` | Đọc | Phương pháp đếm; baseline 116 unique handlers, duplicate pre-existing. |

---

## 3. Phương pháp đo trực tiếp

Tất cả số liệu dưới đây được tính bằng script độc lập chạy trực tiếp trên code hiện tại, không cộng dồn, không dùng số từ báo cáo cũ.

- **Code RPC detection:** quét `.rpc('...')` trong `services/`, `lib/`, `utils/` (recursive), dùng regex `supabase\.rpc\('([a-z_0-9]+)'`, lấy unique names.
- **Mock handler detection:** quét `name === "..."` / `name === '...'` trong `tests/mocks/supabase.ts`, dùng regex `name\s*===\s*["']([a-zA-Z0-9_-]+)["']`, đếm raw + unique.
- **Migration RPC detection:** quét `CREATE [OR REPLACE] FUNCTION public.name(...)` trong `supabase/migrations/*.sql`.
- **Coverage:** `matched = code RPCs ∩ mock handlers`; không cộng dồn, không dùng arithmetic 68 + x hoặc 99 + x.

---

## 4. Bước 1 — Code RPC Inventory

| Metric | Giá trị đo trực tiếp |
|---|---|
| Unique code RPC names | **183** |
| Code files có gọi `.rpc(...)` | **29** |

**Lưu ý:** Một số báo cáo trước đây ghi **184** unique code RPCs, với lý do script bỏ qua `complete_disposal`. Đo trực tiếp trên code hiện tại cho thấy `complete_disposal` nằm trên một dòng duy nhất và được đếm; tổng unique là **183**.

---

## 5. Bước 2 — Mock Handler Inventory

| Metric | Giá trị đo trực tiếp |
|---|---|
| Raw handler branches (`name === ...`) | **137** |
| Unique mock handlers | **136** |
| Duplicate handlers | **1** — `get_tenant_members_with_email` x2 (lines 733 và 2236) |

**So sánh với baseline:**

| Trạng thái | Unique handlers | Duplicate |
|---|---|---|
| HEAD `afdef607` (pre-Phase-4) | 85 | 1 (`get_tenant_members_with_email`) |
| Working tree (sau Recovery Package-01) | 136 | 1 (`get_tenant_members_with_email`) |
| Delta | **+51** | **0 mới** |

> Recovery Package-01 tuyên bố thêm **20** handlers. Delta toàn bộ working tree so với HEAD là 51 vì working tree còn chứa 31 handlers từ CURRENT_TASK-025…029 (Domains C, D, E, F, G) chưa được commit. 51 − 31 = **20**, khớp với claim của package.

---

## 6. Bước 3 — Đối chiếu RPC ↔ Mock Handler

| Category | Số lượng | Ghi chú |
|---|---|---|
| **Matched** (code RPC có handler) | **119** | |
| **Missing** (code RPC chưa có handler) | **64** | Các RPC của Domains B, H1–H9. |
| **Extra** (handler không được code RPC gọi) | **17** | 16 edge-function handlers hyphenated + `update_tenant_status`. |
| **Duplicate** handler | **1** | `get_tenant_members_with_email` — pre-existing, không do Package-01 tạo ra. |
| **Dead** handler (handler không có trong migrations) | **16** | 16 edge-function handlers hyphenated; không nằm trong `public.*` migrations. |

### 6.1 20 Domain A handlers từ Recovery Package-01 đã được xác minh đầy đủ

| # | RPC | Có handler? |
|---|---|---|
| 1 | `can_use_feature` | Có |
| 2 | `has_tenant_role` | Có |
| 3 | `is_system_admin` | Có |
| 4 | `is_tenant_owner` | Có |
| 5 | `get_tenant_by_subdomain` | Có |
| 6 | `is_2fa_enabled` | Có |
| 7 | `generate_2fa_backup_codes` | Có |
| 8 | `list_2fa_backup_codes` | Có |
| 9 | `delete_2fa_backup_codes` | Có |
| 10 | `verify_2fa_backup_code` | Có |
| 11 | `record_login_attempt` | Có |
| 12 | `get_login_attempts` | Có |
| 13 | `get_locked_emails` | Có |
| 14 | `unlock_login_attempts` | Có |
| 15 | `get_tenant_security_settings` | Có |
| 16 | `update_tenant_ip_allowlist` | Có |
| 17 | `update_tenant_session_timeout` | Có |
| 18 | `record_admin_login` | Có |
| 19 | `get_admin_login_history` | Có |
| 20 | `get_admin_login_alerts` | Có |

### 6.2 Danh sách 64 code RPC còn thiếu handler

```
accept_invitation
adjust_customer_debt
adjust_supplier_debt
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
generate_tenant_license
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
get_unsynced_brands
get_unsynced_categories
increment_product_quantity
lookup_invitation
pay_order_debt
pay_supplier_debt
process_checkout
process_import_v2
search_customers_rpc
search_orders_rpc
search_products_rpc
search_suppliers_rpc
update_import_v2
validate_tenant_license
```

### 6.3 17 Extra handlers (không có code RPC tương ứng)

```
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

## 7. Bước 4 — Coverage thực tế

| Metric | Số lượng | Tỷ lệ |
|---|---|---|
| Code RPCs | 183 | 100% |
| Có mock handler | **119** | **65,0%** |
| Chưa có mock handler | 64 | 35,0% |

Coverage được tính trực tiếp: `119 / 183`. Không dùng arithmetic cũ, không cộng dồn.

---

## 8. Bước 5 — Kiểm tra Duplicate / Dead / Unused

### 8.1 Duplicate handler

| Handler | Số lần xuất hiện | Tình trạng |
|---|---|---|
| `get_tenant_members_with_email` | 2 | Pre-existing, tồn tại ở cả HEAD `afdef607`. Không do Package-01 tạo ra. |

### 8.2 Duplicate helper

| Metric | Kết quả |
|---|---|
| Tổng helper declarations trong `tests/mocks/supabase.ts` | 32 |
| Duplicate helpers | **0** |

### 8.3 Duplicate store

| Metric | Kết quả |
|---|---|
| Tổng store keys trong `store: Record<string, Row[]>` | 49 |
| Duplicate store keys | **0** |

### 8.4 Dead handler (handler không có trong migrations)

| Handler | Ghi chú |
|---|---|
| `check-subdomain` | Edge function, hyphenated |
| `create-system-admin` | Edge function, hyphenated |
| `delete-tenant` | Edge function, hyphenated |
| `end-impersonation` | Edge function, hyphenated |
| `error-performance` | Edge function, hyphenated |
| `impersonate-tenant` | Edge function, hyphenated |
| `invite-member` | Edge function, hyphenated |
| `reset-password` | Edge function, hyphenated |
| `send-billing-email` | Edge function, hyphenated |
| `send-sms` | Edge function, hyphenated |
| `send-template-email` | Edge function, hyphenated |
| `send-ticket-email` | Edge function, hyphenated |
| `system-backup` | Edge function, hyphenated |
| `system-health` | Edge function, hyphenated |
| `tenant-backup` | Edge function, hyphenated |
| `tenant-restore` | Edge function, hyphenated |

**Tổng dead handler: 16.** Cả 16 đều là edge-function handlers hyphenated, nằm ngoài canonical migration RPC surface `public.*`.

### 8.5 Unused handler (handler trong migrations nhưng không được code RPC gọi)

| Handler | Ghi chú |
|---|---|
| `update_tenant_status` | Có trong migrations, không có `.rpc(...)` trong services/lib/utils. |

**Tổng unused handler: 1.**

---

## 9. Bước 6 — Chạy gate bắt buộc

### 9.1 Canonical Audit Gate

```text
npx tsx scripts/audit-rpc-contracts.ts
```

**Result: PASS — exit 0**

```text
Migration RPCs: 300
Code RPCs      : 183

All service-layer RPC calls are defined in the canonical migration chain.
```

0 missing RPC so với migrations.

### 9.2 Type Gate

```text
npx tsc --noEmit
```

**Result: PASS — exit 0, no type errors.**

### 9.3 Test Gate

```text
npx vitest run
```

**Result: PASS — exit 0**

```text
Test Files  68 passed (68)
Tests       389 passed (389)
```

---

## 10. Bước 7 — Independent Acceptance Review

### 10.1 Kiểm tra claim của Recovery Package-01

| Claim | Kết quả xác minh |
|---|---|
| 20 Domain A handlers được implement | **Đúng** — cả 20 handler đều tồn tại trong `tests/mocks/supabase.ts`. |
| Các handler nằm sau `apply_voucher_to_invoice`, trước fallback `PGRST116` | **Đúng** — lines 3205–3461, trước terminal fallback. |
| 3 stores mới: `login_attempts`, `admin_login_history`, `admin_2fa_backup_codes` | **Đúng** — cả 3 đều có trong `store`. |
| Không sửa handler cũ | **Đúng** — diff ước lượng so với HEAD chỉ thêm, không xóa/sửa handler hiện có. |
| Return shapes từ canonical migrations | **Không kiểm tra chi tiết từng shape** — gate tổng quát (audit/type/test) PASS. |

### 10.2 So sánh với Implementation Report

| Metric | Implementation Report | Đo trực tiếp | Sai lệch |
|---|---|---|---|
| Mock handler blocks after | 136 | 136 | ✅ Khớp |
| Covered code RPCs | 119/184 (~64,7%) | **119/183 (~65,0%)** | Số lượng matched khớp, denominator khác 1 |
| Uncovered code RPCs | 65 | 64 | Khớp với denominator 183 |
| Duplicate handlers | 0 | **1** | Implementation Report **không chính xác** nếu hiểu là toàn bộ working tree; duplicate là pre-existing. |

**Nhận xét:** Recovery Package-01 thực hiện đúng scope của mình (20 handlers). Số liệu coverage trong Implementation Report gần khớp, nhưng claim "0 duplicates" là không chính xác khi xét toàn bộ mock file. Duplicate này không phải do Package-01 tạo ra.

---

## 11. Bước 8 — Program Status Review

### 11.1 Coverage BEFORE và AFTER

"BEFORE" được định nghĩa là trạng thái ngay trước khi Recovery Package-01 được áp dụng, tức working tree đã có 31 handlers từ CURRENT_TASK-025…029 (Domains C–G) nhưng chưa có 20 Domain A handlers. Có thể suy ra BEFORE bằng cách lấy AFTER trừ 20 Domain A handlers.

| Metric | BEFORE | AFTER | Delta |
|---|---|---|---|
| Raw handler branches | 117 | 137 | **+20** |
| Unique handlers | 116 | 136 | **+20** |
| Matched code RPCs | 99 | 119 | **+20** |
| Coverage | **99/183 (~54,1%)** | **119/183 (~65,0%)** | **+10,9 pp** |
| Missing code RPCs | 84 | 64 | **−20** |

> Nếu dùng denominator 184 như một số báo cáo trước: BEFORE = 99/184 (~53,8%), AFTER = 119/184 (~64,7%). Independent verification dùng denominator đo trực tiếp là **183**.

### 11.2 RPC mới được cover (20 Domain A handlers)

```
can_use_feature
has_tenant_role
is_system_admin
is_tenant_owner
get_tenant_by_subdomain
is_2fa_enabled
generate_2fa_backup_codes
list_2fa_backup_codes
delete_2fa_backup_codes
verify_2fa_backup_code
record_login_attempt
get_login_attempts
get_locked_emails
unlock_login_attempts
get_tenant_security_settings
update_tenant_ip_allowlist
update_tenant_session_timeout
record_admin_login
get_admin_login_history
get_admin_login_alerts
```

### 11.3 RPC còn thiếu sau Recovery Package-01

**64 code RPCs** vẫn chưa có mock handler — toàn bộ thuộc về các package phục hồi tiếp theo (Domains B, H1–H9). Xem danh sách đầy đủ ở §6.2.

### 11.4 Coverage Delta

- **+20 matched RPCs**
- **+10,9 percentage points** (từ 54,1% lên 65,0% với denominator 183)

---

## 12. FINAL DECISION

**PASS WITH OBSERVATIONS**

### Căn cứ

| Gate / Kiểm tra | Kết quả |
|---|---|
| Code RPC inventory đo trực tiếp | 183 unique |
| Mock handler inventory đo trực tiếp | 136 unique, 137 raw, 1 duplicate pre-existing |
| Matched / Missing / Extra / Duplicate | 119 / 64 / 17 / 1 |
| Coverage thực tế | 119/183 (~65,0%) |
| `npx tsx scripts/audit-rpc-contracts.ts` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npx vitest run` | **PASS** |
| 20 Domain A handlers tồn tại đầy đủ | **Đúng** |
| Không duplicate store/helper mới | **Đúng** |

### Observations

1. **Duplicate handler còn tồn tại:** `get_tenant_members_with_email` xuất hiện 2 lần trong `tests/mocks/supabase.ts` (pre-existing, không do Package-01 tạo ra). Implementation Report claim "0 duplicates" là không chính xác nếu hiểu theo trạng thái toàn bộ mock file.
2. **Denominator discrepancy:** Implementation Report dùng 184 code RPCs, đo trực tiếp cho thấy **183**. Số matched là 119, khớp giữa hai nguồn.
3. **Coverage gap còn lớn:** 64 code RPCs (~35%) vẫn chưa có handler, nằm ngoài scope của Recovery Package-01.
4. **16 dead / edge-function handlers:** Các handler hyphenated (ví dụ `send-sms`, `system-health`) không nằm trong canonical migration RPC surface; chúng là edge-function handlers và không được audit script đánh giá.

---

## 13. Deliverable

Báo cáo duy nhất được sinh:

- `RECOVERY_PACKAGE_01_VERIFICATION_REPORT.md`

Không sinh Recovery Package-02, Phase4 Exit Review, Closeout, hay Phase5. Không sửa bất kỳ file nào khác.
