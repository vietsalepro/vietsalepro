# CURRENT_TASK-022 — Independent Acceptance Review

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3g — Domain H7 — Imports Mock Coverage  
**Reviewer Role:** Independent Acceptance Reviewer  
**Review Date:** 2026-07-15  
**Document Type:** Independent Acceptance Review Report  

---

## 1. Executive Summary

CURRENT_TASK-022 được giao nhiệm vụ bổ sung mock coverage cho 8 RPC thuộc Domain H7 — Imports trong `tests/mocks/supabase.ts`, nâng coverage từ **76.0% (139/183)** lên **80.3% (147/183)**, đồng thời tuân thủ nghiêm ngặt các ràng buộc:

- Chỉ chỉnh sửa `tests/mocks/supabase.ts` và các test file hỗ trợ tùy chọn.
- Không sửa production code, migration, schema, generated types, audit script, CI, governance.
- Không refactor, không redesign, không abstraction.
- Giữ nguyên dispatch pattern `if (name === '...')`.

Kết quả xác minh độc lập cho thấy:

- **8 RPC được authorized đều đã được thêm** vào `tests/mocks/supabase.ts` với return shape phù hợp canonical migration chain.
- **Audit gate** (`npx tsx scripts/audit-rpc-contracts.ts`) pass: exit 0, 0 stale mock, 0 duplicate handler, coverage 80.3%.
- **Type gate** (`npx tsc --noEmit`) pass.
- **Test gate** (`npx vitest run`) pass: 69 test files, 395 tests, 0 failure.

Tuy nhiên, **working tree hiện tại chứa nhiều thay đổi ngoài scope của CURRENT_TASK-022**, bao gồm xóa production service, xóa alias trong production code, thay đổi import path trong components/pages, và viết lại audit script. Điều này vi phạm nghiêm trọng **Scope Lock** của task.

**Decision: FAIL.**

Task cần được làm sạch working tree để chỉ còn lại các thay đổi trong phạm vi được authorize trước khi acceptance.

---

## 2. Scope Verification

| Criterion | Expected | Verified | Result |
|---|---|---|---|
| Target file | `tests/mocks/supabase.ts` | Có 8 handler mới tại lines 4326–4668 | PASS |
| Optional test files | `tests/**/*.test.ts` | Có các file test đã thay đổi, nhưng không liên quan đến H7 Imports | OBSERVATION |
| Production code | Không sửa | **Có nhiều file production code bị sửa/xóa** | FAIL |
| Migration / schema / generated types | Không sửa | Không thấy thay đổi | PASS |
| Audit script / CI / governance | Không sửa | `scripts/audit-rpc-contracts.ts` bị viết lại | FAIL |
| Số RPC | Đúng 8 | Đúng 8 | PASS |

Các file production code bị sửa/xóa trong working tree:

| File | Change Type | Mô tả |
|---|---|---|
| `services/admin/systemAdminService.ts` | Deleted (staged) | Xóa toàn bộ production service file. |
| `services/admin/memberAdminService.ts` | Modified | Xóa export `getTenantMembers`. |
| `services/admin/tenantAdminService.ts` | Modified | Xóa export `getTenantById`, đổi tên `restoreTenantStatus` thành `restoreTenant`. |
| `services/tenantService.ts` | Modified | Xóa aliases `getTenantById`, `getTenantMembers`. |
| `components/admin/SecuritySettingsPanel.tsx` | Modified | Đổi import từ `services/admin/systemAdminService` sang `services/systemAdminService`. |
| `pages/admin/AdminDashboardInner.tsx` | Modified | Tách import sang nhiều service khác nhau. |
| `pages/admin/Security.tsx` | Modified | Đổi import path. |
| `pages/admin/Tenants.tsx` | Modified | Đổi import path, đổi tên hàm `restoreTenantStatus` → `restoreTenant`. |
| `scripts/audit-rpc-contracts.ts` | Modified | Viết lại toàn bộ logic audit: chuyển từ markdown contract sang migration chain, thêm mock validation và coverage report. |

---

## 3. RPC Verification

Tất cả 8 RPC được authorize đều đã được tìm thấy trong `tests/mocks/supabase.ts` dưới dạng `if (name === '...')` handler.

| # | RPC | Canonical Line | Handler Line | RETURNS |
|---|-----|------------------|--------------|---------|
| 1 | `delete_import_v2` | 5384 | 4429 | `jsonb` |
| 2 | `process_import_v2` | 10865 | 4478 | `jsonb` |
| 3 | `update_import_v2` | 12649 | 4569 | `jsonb` |
| 4 | `filter_import_receipts_rpc` | 6170 / 6208 | 4326 | `json` |
| 5 | `get_import_receipt_count_by_date` | 7570 | 4359 | `integer` |
| 6 | `get_import_receipts_by_product_and_lot` | 7578 | 4367 | `json` |
| 7 | `get_import_receipts_by_supplier_id` | 7618 | 4394 | `json` |
| 8 | `get_import_stats` | 7644 | 4410 | `json` |

Không có RPC thứ 9 nào liên quan đến Domain H7 được thêm.

---

## 4. Canonical Contract Verification

Return shape và parameter của từng handler được derive từ `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`:

- `delete_import_v2(p_receipt_id text) RETURNS jsonb`: handler trả về `{ receipt_id, status: 'draft_deleted' }` cho draft, `{ receipt_id, affected_products, total_qty_removed, status: 'completed_deleted' }` cho completed. Phù hợp canonical `jsonb_build_object`.
- `process_import_v2(p_payload jsonb) RETURNS jsonb`: handler trả về `{ receipt_id, affected_products, total_qty_added, status }`. Phù hợp canonical.
- `update_import_v2(p_receipt_id text, p_payload jsonb) RETURNS jsonb`: handler thực hiện delete-then-process logic và trả về shape của `process_import_v2`. Phù hợp canonical delegation.
- `filter_import_receipts_rpc`: một handler duy nhất xử lý cả hai overloaded signatures (có và không có `p_status`), trả về `{ receipts, totalCount }`. Phù hợp canonical.
- `get_import_receipt_count_by_date(p_date date) RETURNS integer`: handler trả về `number`. Phù hợp canonical.
- `get_import_receipts_by_product_and_lot(p_product_id text, p_lot_id text DEFAULT NULL) RETURNS json`: handler trả về `array` of receipts with nested `import_items`. Phù hợp canonical.
- `get_import_receipts_by_supplier_id(p_supplier_id text, p_limit int DEFAULT 100) RETURNS json`: handler trả về `array` of receipts with nested `import_items`. Phù hợp canonical.
- `get_import_stats(p_from_date date DEFAULT NULL, p_to_date date DEFAULT NULL) RETURNS json`: handler trả về `{ totalCount, totalCost, totalShipping, totalPaid, totalDebt }`. Phù hợp canonical `json_build_object`.

Không phát hiện derive từ service layer.

---

## 5. Dispatch Pattern Verification

| Criterion | Expected | Verified | Result |
|---|---|---|---|
| Pattern | `if (name === '...')` | Tất cả 8 handler sử dụng `if (name === '...')` | PASS |
| Không switch/map/dispatcher/helper abstraction | Không được có | Không phát hiện | PASS |
| Một handler duy nhất cho mỗi RPC | Một handler | Đã verify qua audit: 0 duplicate | PASS |

---

## 6. Validation Result

### 6.1 Audit Gate

```text
npx tsx scripts/audit-rpc-contracts.ts
```

- Exit code: **0**
- Migration RPCs: 300
- Code RPCs: 183
- Mock RPCs: 148 (148 handler blocks)
- 0 stale mock
- 0 duplicate handler
- All service-layer RPC calls defined in canonical migration chain
- All mock RPC handlers defined in canonical migration chain
- Coverage: **80.3%**

**Result: PASS**

> Lưu ý: mock RPCs (148) > covered RPCs (147), tức vẫn còn 1 orphan mock (`update_tenant_status`). Đây là orphan đã được ghi nhận và chấp nhận từ các task trước, không liên quan đến CURRENT_TASK-022.

### 6.2 Type Gate

```text
npx tsc --noEmit
```

- Exit code: **0**
- No TypeScript errors

**Result: PASS**

### 6.3 Test Gate

```text
npx vitest run
```

- Exit code: **0**
- Test files: **69 passed**
- Tests: **395 passed**
- Failures: **0**
- Một số cảnh báo recharts `-1 dimension` xuất hiện trên stderr nhưng không làm fail test, đã được ghi nhận từ các task trước.

**Result: PASS**

---

## 7. Coverage Verification

| Metric | Before | Expected After | Verified After | Result |
|---|---|---:|---:|---|
| Covered RPCs | 139 | 147 | 147 | PASS |
| Uncovered RPCs | 44 | 36 | 36 | PASS |
| Coverage | 76.0% | 80.3% | 80.3% | PASS |

Audit script báo cáo coverage đúng như target.

---

## 8. Scope Lock Verification

| Criterion | Expected | Verified | Result |
|---|---|---|---|
| Không sửa production code | Không | **Nhiều file production code bị sửa/xóa** | **FAIL** |
| Không sửa migration/schema/generated types | Không | Không phát hiện | PASS |
| Không sửa audit/CI | Không | `scripts/audit-rpc-contracts.ts` bị viết lại | **FAIL** |
| Không refactor/redesign/abstraction | Không | Có refactor production service/alias | **FAIL** |
| Không tạo CURRENT_TASK-023 / Program Status Review | Không | Không phát hiện | PASS |

### Issues phát hiện

#### Issue 1: Production code deletion
- **File:** `services/admin/systemAdminService.ts`
- **Severity:** Critical
- **Mô tả:** Production service file đã bị xóa và đang ở trạng thái staged (`git diff --cached`).

#### Issue 2: Production code refactor
- **Files:** `services/tenantService.ts`, `services/admin/memberAdminService.ts`, `services/admin/tenantAdminService.ts`
- **Severity:** Critical
- **Mô tả:** Xóa aliases `getTenantById`, `getTenantMembers`; đổi tên `restoreTenantStatus` thành `restoreTenant`.

#### Issue 3: Component/page import path changes
- **Files:** `components/admin/SecuritySettingsPanel.tsx`, `pages/admin/AdminDashboardInner.tsx`, `pages/admin/Security.tsx`, `pages/admin/Tenants.tsx`
- **Severity:** Major
- **Mô tả:** Thay đổi import path để thích ứng với refactor production service.

#### Issue 4: Audit script rewritten
- **File:** `scripts/audit-rpc-contracts.ts`
- **Severity:** Major
- **Mô tả:** Toàn bộ audit script được viết lại. Mặc dù rewrite này phù hợp với Phase 4 objective (so sánh với canonical migration chain), nó **không thuộc scope** của CURRENT_TASK-022 và cần được track riêng.

#### Issue 5: Implementation report inaccuracy
- **File:** `CURRENT_TASK-022_IMPLEMENTATION_REPORT.md`
- **Severity:** Major
- **Mô tả:** Implementation report tuyên bố "No other files were modified by this task", nhưng git status/diff cho thấy nhiều file khác bị sửa.

---

## 9. Traceability Matrix

| RPC | Canonical Migration File | Canonical Line | Handler Line | Return Shape Verified | Dispatch Pattern Verified |
|-----|--------------------------|----------------|--------------|-----------------------|---------------------------|
| `delete_import_v2` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5384 | 4429 | YES | YES |
| `process_import_v2` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 10865 | 4478 | YES | YES |
| `update_import_v2` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 12649 | 4569 | YES | YES |
| `filter_import_receipts_rpc` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 6170 / 6208 | 4326 | YES | YES |
| `get_import_receipt_count_by_date` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7570 | 4359 | YES | YES |
| `get_import_receipts_by_product_and_lot` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7578 | 4367 | YES | YES |
| `get_import_receipts_by_supplier_id` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7618 | 4394 | YES | YES |
| `get_import_stats` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 7644 | 4410 | YES | YES |

---

## 10. PASS / FAIL Decision

**Decision: FAIL**

Lý do: Mặc dù nội dung mock coverage của 8 RPC Domain H7 — Imports là chính xác và các validation gate (audit, type, test, coverage) đều pass, **working tree chứa nhiều thay đổi ngoài scope** của CURRENT_TASK-022, bao gồm xóa production service, refactor production code, thay đổi component/page imports, và viết lại audit script. Các thay đổi này vi phạm **Scope Lock** và làm sai lệch Implementation Report.

---

## 11. Recommendation

1. **Tách các thay đổi ngoài scope** (`services/admin/systemAdminService.ts`, `services/tenantService.ts`, `services/admin/memberAdminService.ts`, `services/admin/tenantAdminService.ts`, components/pages imports, `scripts/audit-rpc-contracts.ts`) ra khỏi working tree của CURRENT_TASK-022.
2. Nếu các thay đổi ngoài scope thuộc về một task khác đã được approve, hãy commit chúng dưới task tương ứng trước khi acceptance task 022.
3. **Revert** staged deletion của `services/admin/systemAdminService.ts`.
4. **Làm sạch working tree** sao cho chỉ còn:
   - `tests/mocks/supabase.ts` với 8 handler H7.
   - Các test file hỗ trợ tùy chọn **liên quan trực tiếp đến Domain H7 Imports** (nếu có).
5. Re-run các validation gate sau khi làm sạch:
   - `npx tsx scripts/audit-rpc-contracts.ts`
   - `npx tsc --noEmit`
   - `npx vitest run`
6. Cập nhật `CURRENT_TASK-022_IMPLEMENTATION_REPORT.md` để phản ánh đúng các file thực sự bị sửa (nếu sau cleanup chỉ còn `tests/mocks/supabase.ts`).
7. Sau khi working tree sạch và validation gate pass, tiến hành lại Independent Acceptance Review.

**Không được tiến hành Program Status Review hoặc authorize CURRENT_TASK-023 cho đến khi CURRENT_TASK-022 được accept.**

---

*Review conducted independently from Engineering. Evidence derived directly from code, canonical migration source, and reproducible command output.*
