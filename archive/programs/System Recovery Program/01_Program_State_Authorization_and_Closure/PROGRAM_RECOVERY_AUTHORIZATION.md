# PROGRAM RECOVERY AUTHORIZATION

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Document Type:** Program Recovery Authorization  
**Authorization Date:** 2026-07-16  
**Authority:** Program Recovery Authorization Review  
**Status:** Proposed — Pending Program Sponsor Approval  

---

## 1. Mandate

Đây là **Program Recovery Authorization**. Tài liệu này **không phải**:

- Recovery Plan / Implementation
- Architecture Decision / Engineering Kickoff
- Acceptance Review / Phase Closeout
- Governance document có thể thay thế CURRENT_PHASE.md hay SYSTEM_RECOVERY_MASTER_PLAN.md

Mục tiêu: đánh giá toàn bộ forensic evidence về tình trạng thực tế của Phase 4 và quyết định có mở **PHASE4 RECOVERY PROGRAM** hay không.

---

## 2. Basis — Tài liệu xem xét (theo đúng thứ tự)

1. `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 4 — Exit Criteria, Deliverables, Validation.
2. `CURRENT_PHASE.md` §4–§6 — Phase Success Criteria, Constraints, Deliverables.
3. `PHASE4_FINAL_EXIT_REVIEW.md` — Independent verification commands, Exit Criteria Verdicts, Final Decision.
4. `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` — CODE RPC inventory, MOCK HANDLER inventory, per-task reconciliation, domain matrix.
5. `PHASE4_FORENSIC_INVESTIGATION_REPORT.md` — Root cause of 183 vs 99 discrepancy, per-task verification.
6. `GIT_FORENSIC_INVESTIGATION_REPORT.md` — Git evidence across branches, stashes, dangling commits.
7. `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md` — Statistical inventory across working tree, HEAD, branches, stashes, dangling commits.

Tất cả số liệu dưới đây lấy từ các forensic report đã kiểm chứng. Các số liệu đã bị bác bỏ không được sử dụng làm baseline.

---

## 3. Forensic Findings — Tổng hợp

### 3.1 Tình trạng Git thực tế

- `tests/mocks/supabase.ts` **modified but uncommitted**. Các tài liệu Phase 4 (`CURRENT_PHASE.md`, `PHASE4_*`, `CURRENT_TASK-014…029_*`) đều **untracked**.
- Last commit chạm vào mock file: `1467573f` (phatnt056, 2026-07-14 15:00) — đây là Phase-3 storage refactor, **không phải** Phase 4 work.
- `git log --all --grep="01[4-9]|02[0-9]" -E` **không có kết quả**. Không có commit nào cho CURRENT_TASK-014…029.
- HEAD `afdef607` (2026-07-14 15:22) **predates** tất cả Phase 4 artifacts (2026-07-15/16).
- `git reflog` không có reset/rebase/branch-delete liên quan. `git stash list` chỉ có 3 stash không liên quan.

> **Finding 1:** Không có Phase 4 work nào được commit. Không thể recover từ Git.
> <ref_file file="c:/PROJECT/vietsalepro/PHASE4_FORENSIC_INVESTIGATION_REPORT.md" />

### 3.2 Coverage thực tế

| Metric | Giá trị được kiểm chứng | Nguồn |
|---|---|---|
| Unique code RPC names | **184** | `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` §3, `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md` STEP 10 |
| Code RPCs theo audit script | **183** | `PHASE4_FINAL_EXIT_REVIEW.md` §1.1 (script bỏ qua `complete_disposal` vì xuống dòng) |
| Mock handlers unique | **116** | `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` §4, `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md` STEP 1 |
| Code RPCs có mock handler | **99** | `PHASE4_FINAL_EXIT_REVIEW.md` §1.5, `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` §5 |
| Code RPCs chưa có mock handler | **85** (hoặc **84** nếu dùng denominator 183) | `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` §9, `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md` STEP 10 |

> **Finding 2:** Claimed coverage 183/183 (100%) bị bác bỏ. Coverage thực tế là **99/184** (~53.8%), hay **99/183** (~54.1%) theo denominator của chương trình.
> <ref_file file="c:/PROJECT/vietsalepro/PHASE4_COVERAGE_RECONCILIATION_AUDIT.md" />
> <ref_file file="c:/PROJECT/vietsalepro/PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md" />

### 3.3 Phân bổ theo Domain

| Domain | Task | Target | Có trong Working Tree | Recoverable từ Git | Thực sự thiếu |
|---|---|---|---|---|---|
| A — Auth, Identity & Security | 014 | 20 | 0 | 0 | **20** |
| B — Tenant Admin & Licensing | 015 | 6 | 0 | 0 | **6** |
| C — Compliance & GDPR | 027 | 7 | 7 | 0 | 0 |
| D — Integrations & Partners | 025 | 8 | 8 | 0 | 0 |
| E — Webhooks & API Keys | 026 | 10 | 10 | 0 | 0 |
| F — Notifications | 028 | 3 | 3 | 0 | 0 |
| G — Promotions | 029 | 3 | 3 | 0 | 0 |
| H1 — Products & Catalog | 016 | 11 | 0 | 0 | **11** |
| H2 — Inventory & Stock | 019 | 7 | 0 | 0 | **7** |
| H3 — Orders & Sales | 020 | 7 | 0 | 0 | **7** |
| H4 — Returns & Exchanges | 021 | 7 | 0 | 0 | **7** |
| H5 — Customers | 017 | 6 | 0 | 0 | **6** |
| H6 — Suppliers | 018 | 7 | 0 | 0 | **7** |
| H7 — Imports | 022 | 8 | 0 | 0 | **8** |
| H8 — Disposals | 023 | 4 | 0 | 0 | **4** |
| H9 — Reports & Dashboard | 024 | 2 | 0 | 0 | **2** |
| **Phase-4 target subtotal** | | **116** | **31** | **0** | **85** |
| Baseline / Other (pre-Phase-4) | 013 | 68 | 68 | 0 | 0 |
| **TOTAL (Code RPC)** | | **184** | **99** | **0** | **85** |

> **Finding 3:** 31 handlers đã được thêm bởi CURRENT_TASK-025…029 (Domains C, D, E, F, G). 84–85 handlers thiếu hoàn toàn khởi nguồn từ CURRENT_TASK-014…024 (Domains A, B, H1–H9). Không domain nào ở trạng thác bán phần — mỗi domain hoặc đã đầy đủ hoặc hoàn toàn vắng mặt.
> <ref_file file="c:/PROJECT/vietsalepro/PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md" />

### 3.4 Root cause của sai lệch 183 vs 99

- Audit gate `scripts/audit-rpc-contracts.ts` **không đo mock coverage** — nó chỉ kiểm tra `code RPCs ⊆ migration RPCs`.
- Số 183/183 là **cumulative arithmetic**: 68 → 147 → 150 → 152 → 160 → 170 → 177 → 180 → 183, cộng số RPC được *authorize* mỗi task, chứ không đo handler thực tế.
- Acceptance Reviews / Program Status Reviews cho CURRENT_TASK-014…024 đã certified PASS mà không verify handler presence.
- `PHASE4_ACCEPTANCE_RECORD.md` §3 ghi 183/183, nhưng §4 ghi "Contract RPCs: 125, Code RPCs: 125" — mâu thuẫn nội bộ.

> **Finding 4:** Root cause là **governance-verification failure (C) + coverage-counting failure (D)**, không phải Git accident. Re-implementation là bắt buộc.
> <ref_file file="c:/PROJECT/vietsalepro/PHASE4_FORENSIC_INVESTIGATION_REPORT.md" />

### 3.5 Trạng thái các Gate

| Gate | Kết quả | Ghi chú |
|---|---|---|
| Canonical Audit Gate (`npx tsx scripts/audit-rpc-contracts.ts`) | **PASS** | 300 migration RPCs, 183 code RPCs, 0 missing. Script đọc `supabase/migrations/*.sql` trực tiếp. |
| Injection Test | **PASS (fail-as-expected)** | `zzzz_nonexistent_audit_injection_test_rpc` bị bắt, exit 1. |
| Type Gate (`npx tsc --noEmit`) | **PASS** | Exit 0, no type errors. |
| Test Gate (`npx vitest run`) | **PASS** | 68 files, 389 tests PASS. |
| EC-1 (Test mocks validated against canonical contract) | **PASS with blocking observation** | Validation direction đúng, nhưng chỉ 99/183 code RPCs có mock. |
| EC-2 (Passing tests imply no known contract breaks) | **PASS** | |
| EC-3 (Audit script compares against migration chain) | **PASS** | Đã sửa từ derived markdown sang migrations. |
| EC-4 (CI gates fail on divergence) | **PASS** | `npm run audit:rpc` trong CI, exits non-zero. |

> **Finding 5:** Audit/type/test infrastructure đã sẵn sàng; lỗ hổng duy nhất là mock coverage. EC-1 có blocking observation.
> <ref_file file="c:/PROJECT/vietsalepro/PHASE4_FINAL_EXIT_REVIEW.md" />

---

## 4. Baseline thực tế

Baseline được xác định **chỉ** từ số liệu kiểm chứng:

| Baseline | Giá trị |
|---|---|
| Code RPC surface | **184 unique** (hoặc **183** theo audit script denominator) |
| Mock handlers | **116 unique** |
| Matched coverage | **99 / 184** (~53.8%) |
| Missing coverage | **85 / 184** (~46.2%) |
| Domains hoàn thành | C, D, E, F, G (CURRENT_TASK-025…029) |
| Domains chưa hoàn thành | A, B, H1, H2, H3, H4, H5, H6, H7, H8, H9 (CURRENT_TASK-014…024) |
| Audit gate | **PASS** |
| Type gate | **PASS** |
| Test gate | **PASS** |

Không sử dụng: 183/183 (100%), baseline 147/183, hoặc bất kỳ con số cumulative arithmetic nào từ `PHASE4_ACCEPTANCE_RECORD.md` §3/§8.

---

## 5. Đánh giá Coverage hiện tại vs Mục tiêu

| | Số lượng | Ghi chú |
|---|---|---|
| **Coverage mục tiêu** | 183/183 (100%) theo `PHASE4_COVERAGE_ROADMAP.md` và `PHASE4_ACCEPTANCE_RECORD.md` §3 | Mục tiêu này chưa đạt và cần làm lại. |
| **Coverage thực tế** | 99/184 (~53.8%) | Đo trực tiếp từ mock handler vs code RPC call sites. |
| **Gap** | **85 code RPCs** chưa có mock handler | Tương ứng Domains A, B, H1–H9. |
| **Target điều chỉnh cho Recovery** | 184/184 (100%) hoặc 183/183 nếu audit script denominator được chấp nhận | Tất cả code RPCs phải có mock handler hợp lệ. |

### RPC còn thiếu theo Domain (85 RPCs)

**Domain A — Auth, Identity & Security (20):** `can_use_feature`, `has_tenant_role`, `is_system_admin`, `is_tenant_owner`, `is_2fa_enabled`, `generate_2fa_backup_codes`, `list_2fa_backup_codes`, `delete_2fa_backup_codes`, `verify_2fa_backup_code`, `get_locked_emails`, `get_login_attempts`, `unlock_login_attempts`, `record_login_attempt`, `get_admin_login_alerts`, `get_admin_login_history`, `record_admin_login`, `create_tenant_with_admin`, `accept_invitation`, `lookup_invitation`, `remove_tenant_member`.

**Domain B — Tenant Admin & Licensing (6):** `get_tenant_by_subdomain`, `set_tenant_subdomain`, `get_tenant_members_with_email` (duplicate hiện tại cần xử lý), `update_tenant_member_role`, `toggle_tenant_member_active`, `get_tenant_security_settings`.

**Domain H1 — Products & Catalog (11):** `check_product_barcode_exists`, `check_product_code_exists`, `get_product_by_barcode`, `get_product_stats`, `get_brand_product_counts`, `get_category_product_counts`, `get_unsynced_brands`, `get_unsynced_categories`, `count_point_products`, `search_products_rpc`, `filter_products_rpc`.

**Domain H2 — Inventory & Stock (7):** `check_stock_ledger_drift`, `complete_inventory_count`, `cancel_inventory_count_rpc`, `delete_inventory_count_rpc`, `get_stock_ledger`, `increment_product_quantity`, `get_inventory_report`.

**Domain H3 — Orders & Sales (7):** `cancel_order`, `delete_order`, `create_invoice`, `process_checkout`, `get_order_auto_code`, `search_orders_rpc`, `pay_order_debt`.

**Domain H4 — Returns & Exchanges (7):** `cancel_return_order_v2`, `create_return_order`, `cancel_supplier_exchange`, `create_supplier_exchange`, `create_exchange_transaction`, `filter_return_orders_rpc`, `get_return_order_auto_code`.

**Domain H5 — Customers (6):** `adjust_customer_debt`, `get_customer_debt_ledger`, `get_customer_report`, `get_customer_stats`, `search_customers_rpc`, `filter_customers_rpc`.

**Domain H6 — Suppliers (7):** `adjust_supplier_debt`, `get_supplier_debt_ledger`, `get_supplier_report`, `get_supplier_stats`, `search_suppliers_rpc`, `filter_suppliers_rpc`, `pay_supplier_debt`.

**Domain H7 — Imports (8):** `delete_import_v2`, `process_import_v2`, `update_import_v2`, `get_import_stats`, `get_import_receipt_count_by_date`, `get_import_receipts_by_product_and_lot`, `get_import_receipts_by_supplier_id`, `filter_import_receipts_rpc`.

**Domain H8 — Disposals (4):** `complete_disposal`, `delete_disposal_with_restore`, `filter_disposals_rpc`, `get_disposal_auto_code`.

**Domain H9 — Reports & Dashboard (2):** `get_dashboard_summary`, `get_profit_report`.

> Nguồn: `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` §5.B, `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md` STEP 9.

---

## 6. Đánh giá trạng thái Governance Documents

| Document | Trạng thái | Lý do |
|---|---|---|
| `SYSTEM_RECOVERY_MASTER_PLAN.md` | **Giữ nguyên** | Framework phục vụ Phase 4 Recovery. |
| `CURRENT_PHASE.md` | **Giữ nguyên** | Marker active phase vẫn hợp lệ, cần cập nhật status sau Recovery. |
| `PHASE4_FINAL_EXIT_REVIEW.md` | **Giữ nguyên** | Kết luận FAIL và evidence được xác nhận bởi forensic. |
| `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` | **Giữ nguyên** | Số liệu 99/184 được tái tạo độc lập. |
| `PHASE4_FORENSIC_INVESTIGATION_REPORT.md` | **Giữ nguyên** | Root cause và evidence index hợp lệ. |
| `GIT_FORENSIC_INVESTIGATION_REPORT.md` | **Giữ nguyên** | Git evidence đầy đủ, không có Git recovery path. |
| `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md` | **Giữ nguyên** | Statistical inventory chính xác, evidence-bound. |
| `PHASE4_ACCEPTANCE_RECORD.md` | **Cần supersede** | §3/§8 claim 183/183 sai; §4 mâu thuẫn nội bộ 125/125 vs 183/183. |
| `CURRENT_TASK-014` → `CURRENT_TASK-024` Acceptance Reviews | **Cần supersede** | PASS verdict không được repository support; handlers absent. |
| `CURRENT_TASK-025` → `CURRENT_TASK-029` per-task reviews | **Giữ nguyên** | Handlers thực sự present trong working tree. |
| `CURRENT_TASK-029_PROGRAM_STATUS_REVIEW.md` | **Cần supersede (phần coverage)** | Final decision "PASS WITH OBSERVATIONS" dựa trên 183/183 claim sai. Các phần khác vẫn tham khảo được. |

---

## 7. Decision — Có authorize PHASE4 RECOVERY PROGRAM không?

**Quyết định: B. RECOVERY AUTHORIZED WITH CONDITIONS**

Lý do:

- **Có thể recover:** Forensic xác định rõ root cause, scope hẹp, target cụ thể (85 missing RPC handlers), và audit/type/test infrastructure đã sẵn sàng.
- **Không thể closeout Phase 4 ngay:** Coverage 99/184 không đáp ứng mục tiêu. EC-1 có blocking observation.
- **Không phải NOT AUTHORIZED:** Failure là reversible nếu re-implement 85 handlers và thắt chặt governance.
- **Không phải unconditional AUTHORIZED:** Tồn tại governance failure nghiêm trọng cần supersede trước khi bắt đầu work.

### 7.1 Program Definition

| Field | Value |
|---|---|
| **Program Name** | PHASE4 RECOVERY PROGRAM |
| **Objective** | Khôi phục Phase 4 Derived Validation Layer bằng cách bổ sung 85 mock RPC handlers còn thiếu vào `tests/mocks/supabase.ts`, đạt 100% code-RPC mock coverage, đồng thời supersede các governance documents chứa claim sai. |
| **Baseline** | 99/184 (~53.8%) mock coverage; EC-2/EC-3/EC-4 PASS; EC-1 PASS với blocking observation; CURRENT_TASK-025…029 đã hoàn thành; CURRENT_TASK-014…024 chưa có deliverable thực tế. |
| **Target** | 184/184 (hoặc 183/183 nếu dùng audit denominator) code RPCs có mock handler hợp lệ; EC-1–EC-4 PASS không observation; D-P4-04 Test-Audit Traceability Report hoàn thành. |
| **Scope** | Chỉ sửa `tests/mocks/supabase.ts`; chỉnh sửa `scripts/audit-rpc-contracts.ts` nếu cần để duy trì D-P4-02; supersede các governance document chứa coverage claim sai. Không đụng production code, migrations, database, UI, package.json, CI. |
| **Exit Criteria** | Xem Section 9. |

### 7.2 Conditions (Điều kiện tiên quyết trước khi work bắt đầu)

1. **Supersede** `PHASE4_ACCEPTANCE_RECORD.md` coverage claim 183/183 và mọi per-task PASS verdict của CURRENT_TASK-014…024.
2. **Đính chính** `CURRENT_TASK-029_PROGRAM_STATUS_REVIEW.md` — ghi nhận true state là 99/184, không phải 183/183.
3. **Lập Recovery Specification** chi tiết cho 85 missing handlers, mapping rõ từng RPC → domain → canonical migration source.
4. **Xác nhận Architecture Validation** cho pattern mock handler (flat `if (name === '...')` chain hoặc refactor nếu cần — nhưng refactor phải được architecture authority approve).
5. **Không** tạo CURRENT_TASK mới hay chuyển Phase cho đến khi Recovery Specification được approve.

---

## 8. Recovery Governance

Mỗi Recovery Package trong PHASE4 RECOVERY PROGRAM phải đi đủ 7 bước sau, **không được bỏ qua bước nào**:

```text
Recovery Authorization
        ↓
Recovery Specification
        ↓
Architecture Validation
        ↓
Engineering Implementation
        ↓
Coverage Verification
        ↓
Acceptance Review
        ↓
Program Status Review
```

| Bước | Output chính | Approval |
|---|---|---|
| Recovery Authorization | `PROGRAM_RECOVERY_AUTHORIZATION.md` (tài liệu này) | Program Sponsor |
| Recovery Specification | `PHASE4_RECOVERY_SPECIFICATION.md` — danh sách 85 RPCs, domain mapping, mock handler contract | Program Manager + Architecture Authority |
| Architecture Validation | `PHASE4_RECOVERY_ARCHITECTURE_VALIDATION.md` — xác nhận mock pattern, canonical source traceability | Architecture Authority |
| Engineering Implementation | Per-Recovery-Task Implementation Reports | Engineering Lead |
| Coverage Verification | Direct mock-to-code scan, independent report | Independent Verifier |
| Acceptance Review | `PHASE4_RECOVERY_ACCEPTANCE_REVIEW.md` | Program Manager |
| Program Status Review | `PHASE4_RECOVERY_PROGRAM_STATUS_REVIEW.md` | Program Sponsor |

---

## 9. Recovery Scope Lock

### 9.1 Được sửa

- `tests/mocks/supabase.ts` — thêm/chỉnh 85 mock handlers còn thiếu, xử lý duplicate `get_tenant_members_with_email`.

### 9.2 Được phép sửa (chỉ nếu cần duy trì D-P4-02)

- `scripts/audit-rpc-contracts.ts` — ví dụ: cải thiện regex để bắt `.rpc(` xuống dòng, hoặc mở rộng scan nếu architecture authority yêu cầu.

### 9.3 Không được sửa

- `services/` (production service code)
- `lib/` (production library code)
- Production code khác
- Database schema / migrations
- Generated types (`database.types.ts`)
- UI components / pages
- `package.json`
- CI workflow (`.github/workflows/ci.yml`)
- Bất kỳ governance document nào ngoài phạm vi supersede được liệt kê ở Section 6

---

## 10. Recovery Success Criteria

Recovery chỉ được coi là **hoàn thành** khi **tất cả** các điều kiện sau đồng thời đạt được:

1. **Coverage được đo trực tiếp**, không dùng cumulative arithmetic.
   - Tất cả unique `supabase.rpc('...')` names trong `services/`, `lib/`, `utils/` được đối chiếu với `if (name === '...')` handlers trong `tests/mocks/supabase.ts`.
   - Kết quả: 184/184 matched (hoặc 183/183 nếu dùng audit script denominator).

2. **Audit PASS**: `npx tsx scripts/audit-rpc-contracts.ts` → exit 0, 0 missing RPCs.

3. **Type PASS**: `npx tsc --noEmit` → exit 0.

4. **Vitest PASS**: `npx vitest run` → exit 0, tất cả tests PASS.

5. **Coverage Verification PASS**: Independent verifier chạy lại mock-to-code cross-check và xác nhận 100% coverage.

6. **Exit Review PASS**: Independent Phase 4 Recovery Exit Review xác nhận EC-1–EC-4 PASS không observation, D-P4-01…D-P4-04 hoàn thành.

7. **No new uncommitted governance debt**: Mọi thay đổi trong Recovery Package phải được commit và traceable.

---

## 11. Final Decision

**B. RECOVERY AUTHORIZED WITH CONDITIONS**

### Viện dẫn bằng chứng

- **Không thể recover từ Git:** `PHASE4_FORENSIC_INVESTIGATION_REPORT.md` §3.1–§3.4, `GIT_FORENSIC_INVESTIGATION_REPORT.md` Step 6–8.
- **Coverage thực tế 99/184:** `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` §3, §9; `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md` STEP 10.
- **85 RPCs thiếu theo domain:** `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` §5.B; `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md` STEP 9.
- **183/183 claim sai và governance documents cần supersede:** `PHASE4_FORENSIC_INVESTIGATION_REPORT.md` §5, §10; `PHASE4_FINAL_EXIT_REVIEW.md` §3, §5.2.
- **Audit/type/test infrastructure sẵn sàng:** `PHASE4_FINAL_EXIT_REVIEW.md` §1.1–§1.4; EC-2/EC-3/EC-4 PASS.
- **EC-1 blocking observation:** `PHASE4_FINAL_EXIT_REVIEW.md` §2.
- **D-P4-04 còn thiếu:** `PHASE4_FINAL_EXIT_REVIEW.md` §4.

---

*End of Program Recovery Authorization. No implementation, no new CURRENT_TASK, no phase transition, and no closeout is performed by this document.*
