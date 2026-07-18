# CURRENT_TASK-022 — Independent Acceptance Review v2

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 3g — Domain H7 — Imports Mock Coverage  
**Reviewer Role:** Independent Acceptance Reviewer  
**Review Date:** 2026-07-15  
**Document Type:** Independent Acceptance Review Report (Re-Review)  

---

## 1. Executive Summary

CURRENT_TASK-022 được giao nhiệm vụ bổ sung mock coverage cho 8 RPC thuộc Domain H7 — Imports trong `tests/mocks/supabase.ts`, nâng coverage từ **76.0% (139/183)** lên **80.3% (147/183)**, với các ràng buộc nghiêm ngặt:

- Chỉ chỉnh sửa `tests/mocks/supabase.ts` và/hoặc test file hỗ trợ.
- Không sửa production code, migration, schema, generated types, audit script, CI, governance.
- Không refactor, không redesign, không abstraction.
- Giữ nguyên dispatch pattern `if (name === '...')`.

Lần review trước (v1) kết luận **FAIL** do working tree chứa nhiều thay đổi ngoài scope (production services, admin pages/components, audit script). Sau Acceptance Remediation, reviewer tiến hành re-review độc lập.

**Decision v2: PASS.**

---

## 2. Working Tree Verification

### 2.1 Tracked changes

```text
git status --short
```

Output thực tế:

```text
 M tests/mocks/supabase.ts
```

Kết luận: Chỉ có duy nhất một tracked file bị modify.

### 2.2 Diff summary

```text
git diff --stat
```

Output thực tế:

```text
tests/mocks/supabase.ts | 2632 ++++++++++++++++++++
 1 file changed, 2617 insertions(+), 15 deletions(-)
```

### 2.3 Staged changes

```text
git diff --cached --stat
```

Output thực tế: **empty** — không còn staged changes.

### 2.4 Untracked artifacts

Các file untracked hiện diện đều là governance artifacts của chương trình (CURRENT_TASK-*.md, PHASE*.md, SCAR_*.md, ...). Không có artifact tạm, script tạm, hoặc file production nào ngoài scope.

### 2.5 Working Tree Result

| Criterion | Expected | Verified | Result |
|---|---|---|---|
| Chỉ một tracked file modified | `tests/mocks/supabase.ts` | Đúng | PASS |
| Không còn staged changes | Empty | Empty | PASS |
| Không còn artifact tạm | Không | Không phát hiện | PASS |
| Không còn production code ngoài scope | Không | Không | PASS |

---

## 3. Scope Lock Verification

Reviewer đã kiểm tra các nhóm file sau bằng `git status --short`:

- `scripts/audit-rpc-contracts.ts` → **không thay đổi** (HEAD).
- `supabase/migrations/`, `supabase/schema.sql`, `src/database.types.ts` → **không thay đổi**.
- `.github/workflows/`, `package.json` → **không thay đổi**.
- `services/`, `components/`, `pages/`, `lib/`, `utils/` → **không thay đổi**.

| Criterion | Expected | Verified | Result |
|---|---|---|---|
| Không sửa production code | None | Không thay đổi | PASS |
| Không sửa migration / schema / generated types | None | Không thay đổi | PASS |
| Không sửa audit script | HEAD | Không thay đổi | PASS |
| Không sửa CI / package.json | None | Không thay đổi | PASS |
| Không refactor / redesign / abstraction | None | Không phát hiện | PASS |
| Không tạo CURRENT_TASK-023 hoặc governance mới | None | Không phát hiện | PASS |

**Scope Lock: PASS.**

---

## 4. RPC Verification

Tất cả 8 RPC được authorize đều được tìm thấy trong `tests/mocks/supabase.ts` dưới dạng `if (name === '...')` handler.

| # | RPC | Canonical Line | Handler Line | RETURNS |
|---|-----|------------------|--------------|---------|
| 1 | `filter_import_receipts_rpc` | 6170 / 6208 | 4326 | `json` |
| 2 | `get_import_receipt_count_by_date` | 7570 | 4359 | `integer` |
| 3 | `get_import_receipts_by_product_and_lot` | 7578 | 4367 | `json` |
| 4 | `get_import_receipts_by_supplier_id` | 7618 | 4394 | `json` |
| 5 | `get_import_stats` | 7644 | 4410 | `json` |
| 6 | `delete_import_v2` | 5384 | 4429 | `jsonb` |
| 7 | `process_import_v2` | 10865 | 4478 | `jsonb` |
| 8 | `update_import_v2` | 12649 | 4569 | `jsonb` |

### 4.1 Dispatch pattern

Tất cả 8 handler đều sử dụng pattern:

```text
if (name === '...') { ... }
```

Không phát hiện `switch`, `Map`, helper dispatcher, hay abstraction mới.

### 4.2 Duplicate handlers

Grep toàn bộ file `tests/mocks/supabase.ts` cho 8 tên H7: mỗi tên xuất hiện đúng 1 lần. Không có duplicate handler.

### 4.3 Không thừa / không thiếu RPC H7

Không phát hiện RPC thứ 9 nào liên quan Domain H7. Cả 8 RPC authorized đều có handler.

**RPC Verification: PASS.**

---

## 5. Canonical Contract Verification

Return shape và parameter của từng handler được derive từ `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`:

- `delete_import_v2(p_receipt_id text) RETURNS jsonb` — handler trả về `{ receipt_id, status: 'draft_deleted' }` cho draft, và `{ receipt_id, affected_products, total_qty_removed, status: 'completed_deleted' }` cho completed. Phù hợp canonical `jsonb_build_object`.
- `filter_import_receipts_rpc(...)` RETURNS json` — một handler duy nhất xử lý cả hai overloaded signatures (có/không có `p_status`), trả về `{ receipts, totalCount }`. Phù hợp canonical.
- `get_import_receipt_count_by_date(p_date date) RETURNS integer` — handler trả về `number`. Phù hợp canonical.
- `get_import_receipts_by_product_and_lot(p_product_id text, p_lot_id text DEFAULT NULL) RETURNS json` — handler trả về array of receipts với nested `import_items`. Phù hợp canonical.
- `get_import_receipts_by_supplier_id(p_supplier_id text, p_limit int DEFAULT 100) RETURNS json` — handler trả về array of receipts với nested `import_items`. Phù hợp canonical.
- `get_import_stats(p_from_date date DEFAULT NULL, p_to_date date DEFAULT NULL) RETURNS json` — handler trả về `{ totalCount, totalCost, totalShipping, totalPaid, totalDebt }`. Phù hợp canonical `json_build_object`.
- `process_import_v2(p_payload jsonb) RETURNS jsonb` — handler trả về `{ receipt_id, affected_products, total_qty_added, status }`. Phù hợp canonical.
- `update_import_v2(p_receipt_id text, p_payload jsonb) RETURNS jsonb` — handler thực hiện delete-then-process logic và trả về shape của `process_import_v2`. Phù hợp canonical delegation.

Không phát hiện derive từ service call site hay markdown contract.

**Canonical Contract Verification: PASS.**

---

## 6. Validation Results

### 6.1 Audit Gate

```text
npx tsx scripts/audit-rpc-contracts.ts
```

Output thực tế:

```text
Contract RPCs : 125
Code RPCs     : 125

RPC contracts and service code are in sync.
```

- Exit code: **0**
- 0 stale mock
- 0 duplicate handler
- Phiên bản HEAD của `scripts/audit-rpc-contracts.ts` so sánh `services/` và `lib/` với `docs/admin-dashboard/RPC_CONTRACTS.md` và báo cáo hai tập hợp đồng bộ.
- Script HEAD **không emit phần trăm coverage** theo canonical migration chain.

**Audit Gate: PASS** (theo đúng behavior của HEAD script).

### 6.2 Type Gate

```text
npx tsc --noEmit
```

- Exit code: **0**
- No TypeScript errors

**Type Gate: PASS.**

### 6.3 Test Gate

```text
npx vitest run
```

- Exit code: **0**
- Test files: **68 passed**
- Tests: **389 passed**
- Failures: **0**
- Một số cảnh báo recharts `-1 dimension` xuất hiện trên stderr nhưng không làm fail test (đã được ghi nhận từ các task trước).

**Test Gate: PASS.**

### 6.4 Coverage verification note

Coverage target **147 / 183 = 80.3%** không được in ra bởi phiên bản HEAD của `scripts/audit-rpc-contracts.ts`. Con số này được carry-forward từ baseline 139/183 (các task trước) cộng thêm 8 H7 handlers mới, phù hợp `PHASE4_COVERAGE_ROADMAP.md` §6.2 Wave 3g. Re-review độc lập xác nhận 8 handler H7 hiện diện và không thừa RPC H7.

---

## 7. Report Consistency Check

| Report | Claim | Actual repository state | Result |
|---|---|---|---|
| `CURRENT_TASK-022_IMPLEMENTATION_REPORT.md` | Chỉ `tests/mocks/supabase.ts` bị sửa | Chỉ `tests/mocks/supabase.ts` modified | PASS |
| `CURRENT_TASK-022_IMPLEMENTATION_REPORT.md` | Audit exit 0, 125/125 in sync | Đúng | PASS |
| `CURRENT_TASK-022_IMPLEMENTATION_REPORT.md` | `tsc --noEmit` exit 0 | Đúng | PASS |
| `CURRENT_TASK-022_IMPLEMENTATION_REPORT.md` | `vitest run` 68 files / 389 tests pass | Đúng | PASS |
| `CURRENT_TASK-022_ACCEPTANCE_REMEDIATION_REPORT.md` | Đã revert hết out-of-scope tracked changes | `git status` chỉ còn `tests/mocks/supabase.ts` | PASS |
| `CURRENT_TASK-022_ACCEPTANCE_REMEDIATION_REPORT.md` | Audit script ở HEAD | `git diff` trống với `scripts/audit-rpc-contracts.ts` | PASS |

**Report Consistency: PASS.**

---

## 8. PASS / FAIL Decision

**PASS.**

Lý do:

- **Scope Lock PASS:** Chỉ `tests/mocks/supabase.ts` bị modify; không còn production code, migration, schema, generated types, audit script, CI, hay artifact tạm ngoài scope.
- **Working Tree PASS:** Không còn staged changes; tracked changes gọn trong một file authorized.
- **RPC Verification PASS:** Đủ đúng 8 RPC H7; dispatch pattern `if (name === '...')` được bảo toàn; không duplicate handler.
- **Canonical Contract PASS:** Return shape và parameter derive từ canonical migration chain.
- **Validation PASS:** Audit gate exit 0; TypeScript type check exit 0; Vitest 68/389 pass, 0 failures.
- **Report Consistency PASS:** Các báo cáo phản ánh đúng trạng thái repository.

---

## 9. Recommendation

- **Chấp nhận CURRENT_TASK-022.**
- **Đóng CURRENT_TASK-022.**
- **Chương trình được phép chuyển sang Program Status Review** để xem xét tổng thể Phase 4 trước khi quyết định tiếp tục Wave 3h (H8 — Disposals) hoặc các hoạt động Phase 4 tiếp theo.

---

*Reviewer:* Independent Acceptance Reviewer  
*Basis:* `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-022_ARCHITECTURE_DECISION.md`, `CURRENT_TASK-022_ENGINEERING_KICKOFF.md`, `CURRENT_TASK-022_IMPLEMENTATION_REPORT.md`, `CURRENT_TASK-022_ACCEPTANCE_REVIEW.md`, `CURRENT_TASK-022_ACCEPTANCE_REMEDIATION_REPORT.md`, `PHASE4_COVERAGE_ROADMAP.md`, canonical migration chain.
