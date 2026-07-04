# Hướng dẫn sử dụng OpenSpec cho VoucherFormLayout SSOT

> OpenSpec đã được cài đặt trong project với custom schema `voucher-plan`.
> Thư mục kế hoạch: `docs/plans/voucher-form-layout-ssot/`
> Thư mục OpenSpec: `openspec/`

## Cấu trúc OpenSpec

```text
openspec/
├── config.yaml                 # Schema mặc định = voucher-plan, context project
├── schemas/
│   └── voucher-plan/           # Custom schema cho plan nhiều phase
│       ├── schema.yaml
│       └── templates/
│           ├── proposal.md
│           ├── spec.md
│           ├── design.md
│           ├── review.md
│           ├── rollback.md
│           ├── tasks.md
│           └── handoff.md
├── specs/
│   └── voucher-form-layout/
│       └── spec.md             # Baseline spec (SSOT behavior hiện tại)
└── changes/
    ├── voucher-layout-phase-0-audit/
    ├── voucher-layout-phase-1-consolidate-layout/
    ├── voucher-layout-phase-2-disposal-form/
    ├── voucher-layout-phase-3-inventory-count/
    ├── voucher-layout-phase-4-supplier-exchanges/
    ├── voucher-layout-phase-5-import-goods/
    ├── voucher-layout-phase-6-cleanup-ssot/
    └── voucher-layout-phase-7-verification/
```

Mỗi change folder chứa:
- `proposal.md` — intent, scope, ảnh hưởng
- `specs/voucher-form-layout/spec.md` — delta so với baseline
- `design.md` — quyết định kỹ thuật, rủi ro
- `review.md` — checklist đối chiếu PLAN_02
- `rollback.md` — backup/restore
- `tasks.md` — checklist thực hiện (dùng cho `/opsx:apply`)
- `handoff.md` — tóm tắt bàn giao phase

## Cách dùng trong Windsurf

OpenSpec đã cấu hình cho Windsurf. Sau khi restart IDE, bạn có thể dùng slash commands:

```text
/opsx:explore                          # Thảo luận trước khi bắt đầu phase
/opsx:apply voucher-layout-phase-0-audit                    # Thực hiện tasks (nếu dùng slash command)
/opsx:archive voucher-layout-phase-0-audit                  # Lưu archive, merge specs
```

Hoặc dùng lệnh CLI tương đương:

```powershell
openspec instructions apply --change voucher-layout-phase-0-audit --json
openspec archive voucher-layout-phase-0-audit
```

Lưu ý:
- Các change Phases 0–7 đã được tạo sẵn. Bạn không cần `/opsx:propose` nữa.
- Không có slash command `/opsx:verify`. Để verify, bạn chạy `npm run lint`, `npm run build`, hoặc `openspec validate --all --json`.
- Theo thứ tự: Phase 0 → Phase 1 → Phase 2 → ... → Phase 7.
- Sau khi `/opsx:archive` hoặc `openspec archive`, delta specs của phase đó sẽ merge vào `openspec/specs/voucher-form-layout/spec.md`.

## Các lệnh CLI hữu ích

```powershell
# Liệt kê tất cả changes
openspec list

# Validate toàn bộ
openspec validate --all --json

# Xem chi tiết một change
openspec show voucher-layout-phase-1-consolidate-layout

# Kiểm tra schema
openspec schema validate voucher-plan
```

## Nguyên tắc khi thực hiện

1. **Luôn bắt đầu bằng backup** — mỗi `tasks.md` có task 0.1 tạo backup.
2. **Chạy `npm run lint` sau mỗi sub-phase** — đã ghi trong tasks.
3. **Chạy `npm run build` sau mỗi phase lớn** — đã ghi trong tasks.
4. **Không đụng business logic / types.ts / database** — đã ghi trong `openspec/config.yaml` context.
5. **Archive sau mỗi phase** — để specs SSOT luôn được cập nhật.

## Nếu muốn thêm phase phụ hoặc task nhỏ

- Sửa trực tiếp `tasks.md` trong change folder.
- Nếu thay đổi requirement, cập nhật `specs/voucher-form-layout/spec.md` trong change folder.
- Chạy `openspec validate --all --json` để kiểm tra.

## Hướng dẫn thực hiện cho người không phải coder

Mục tiêu: bạn chỉ cần mở chat mới và dán đúng prompt. Không cần nhớ kỹ thuật OpenSpec.

### Nguyên tắc chung

- **Mỗi chat chỉ nên làm một phần vừa đủ nhỏ để không vượt 250K context.** Không nhất thiết 1 phase = 1 chat. Các phase lớn cần chia nhỏ hơn.
- **Luôn bắt đầu chat bằng prompt mẫu** bên dưới. Prompt này giúp AI nắm đúng phase, sub-phase, trạng thái, backup, và lệnh cần chạy.
- **Đừng nhồi nhiều phase vào một chat.** Nếu chat bắt đầu chậm, lặp lại, hoặc AI hỏi lại từ đầu, đó là dấu hiệu context đầy — hãy dừng, lưu backup, và mở chat mới.

### Cách chia nhỏ để tránh vượt 250K context

Dưới đây là gợi ý chia chat dựa trên kích thước code thực tế của từng phase. Bạn có thể điều chỉnh nếu thấy chat còn nhẹ hoặc đã nặng.

| Phase | Số chat khuyến nghị | Nội dung mỗi chat |
|---|---|---|
| **0 — Audit** | 1 chat | Toàn bộ 0a, 0b, 0c, 0d, 0e. Chủ yếu đọc + tạo `BASELINE_AUDIT.md`. |
| **1 — Consolidate** | 1 chat | Toàn bộ 1a, 1b, 1c. Chỉ 2 file `VoucherFormLayout.tsx/css`. |
| **2 — DisposalForm** | 1 chat | Toàn bộ 2a–2h. Code ~80 KB, nên vẫn ổn. |
| **3 — InventoryCount** | **2 chat** | Chat 1: 3a, 3b. Chat 2: 3c, 3d. Code ~124 KB nên dễ đầy. |
| **4 — SupplierExchanges** | 1 chat | Toàn bộ 4a–4e. Code ~88 KB. |
| **5 — ImportGoods** | **3 chat** | Chat 1: 5a, 5b, 5c, 5d. Chat 2: 5e, 5f, 5g. Chat 3: 5h. Code ~150 KB, phức tạp nhất. |
| **6 — Cleanup** | **2 chat** | Chat 1: 6a, 6b (xóa dead code + feature flags). Chat 2: 6c (final grep + CSS). |
| **7 — Verification** | 1 chat | Toàn bộ 7a, 7b, 7c. Chủ yếu chạy lint/build + test. |

**Nguyên tắc chia nhỏ:** nếu 1 phase có code cần chạm > 100 KB, nên chia thành 2 chat. Nếu > 140 KB, chia thành 3 chat.

### Các bước lặp lại cho mỗi phase

1. **Tạo backup thủ công** (quan trọng vì project không có git):
   ```powershell
   # Copy toàn bộ project folder sang ổ E: hoặc thư mục bạn muốn
   Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase<X>_<YYYY><MM><DD>_<HH><MM><SS>" -Recurse
   ```
2. **Mở chat mới trong Windsurf.**
3. **Dán prompt mẫu** tương ứng với phase (xem bảng bên dưới).
4. **Để AI thực hiện.** AI sẽ tự đọc `PLAN_02_VoucherFormLayout_SSOT_Detailed.md`, tìm đúng sub-phase, sửa code, đánh dấu task trong `tasks.md`.
5. **Kiểm tra sau khi AI báo xong:**
   ```powershell
   npm run lint
   ```
   Nếu chat này là **phần cuối cùng của phase** (ví dụ chat 2 của Phase 3, chat 3 của Phase 5, chat 2 của Phase 6), thêm:
   ```powershell
   npm run build
   ```
6. **Nếu chat này là phần cuối của phase**, chạy lệnh archive (tùy chọn nhưng khuyến khích):
   ```powershell
   openspec archive voucher-layout-phase-<X>-<name>
   ```
   Ví dụ: `openspec archive voucher-layout-phase-0-audit`
7. **Lưu lại vị trí backup** và mở chat mới cho phần kế tiếp.

### Prompt mẫu cho từng phase

Dưới đây là prompt đã chuẩn bị sẵn. Bạn chỉ cần copy toàn bộ đoạn tương ứng và dán vào chat mới.

#### Phase 0 — Audit & Baseline

```text
Thực hiện Phase 0 — Audit & Baseline cho kế hoạch VoucherFormLayout SSOT.

Yêu cầu:
- Đọc PLAN_02_VoucherFormLayout_SSOT_Detailed.md từ docs/plans/voucher-form-layout-ssot/.
- Thực hiện đầy đủ các sub-phase: 0a, 0b, 0c, 0d, 0e.
- Sub-phase 0a: dùng grep/findstr để liệt kê file layout, CSS, feature flags, dead imports, dead topbar.
- Sub-phase 0b: tổng hợp thành Baseline Checklist.
- Sub-phase 0c: tạo backup project trước khi sửa code (lưu ở E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase0_<YYYYMMDD_HHMMSS>).
- Sub-phase 0d: verify component dùng chung.
- Sub-phase 0e: verify design tokens và accent classes.
- Sau khi xong, chạy `npm run lint` và `npm run build` nếu có thay đổi code.
- Đánh dấu task trong openspec/changes/voucher-layout-phase-0-audit/tasks.md khi hoàn thành.
- Không đụng business logic, types.ts, database.
- Cuối cùng chạy `openspec archive voucher-layout-phase-0-audit`.
```

#### Phase 1 — Củng cố VoucherFormLayout

```text
Thực hiện Phase 1 — Củng cố VoucherFormLayout cho kế hoạch VoucherFormLayout SSOT.

Yêu cầu:
- Đọc PLAN_02_VoucherFormLayout_SSOT_Detailed.md từ docs/plans/voucher-form-layout-ssot/.
- Thực hiện đầy đủ các sub-phase: 1a, 1b, 1c.
- Chỉ sửa components/VoucherFormLayout.tsx và components/VoucherFormLayout.css.
- Thêm props banner và statsRow nếu cần. Thêm CSS cho banner. Tinh chỉnh responsive.
- Sau khi xong, chạy `npm run lint`.
- Đánh dấu task trong openspec/changes/voucher-layout-phase-1-consolidate-layout/tasks.md.
- Không đụng business logic, types.ts, database.
- Cuối cùng chạy `openspec archive voucher-layout-phase-1-consolidate-layout`.
```

#### Phase 2 — Refactor DisposalForm

```text
Thực hiện Phase 2 — Refactor DisposalForm cho kế hoạch VoucherFormLayout SSOT.

Yêu cầu:
- Đọc PLAN_02_VoucherFormLayout_SSOT_Detailed.md từ docs/plans/voucher-form-layout-ssot/.
- Thực hiện đầy đủ các sub-phase: 2a, 2b, 2c, 2d, 2e, 2f, 2g, 2h.
- Xóa DisposalFormLayout dead code, tắt useRefactoredDisposalLayout, chuẩn hóa sidebar sections.
- Nếu có tồn tại pages/DisposalForm.css thì rà soát và dọn.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/voucher-layout-phase-2-disposal-form/tasks.md.
- Không đụng business logic, types.ts, database.
- Tạo backup trước khi bắt đầu: E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase2_<YYYYMMDD_HHMMSS>.
- Cuối cùng chạy `openspec archive voucher-layout-phase-2-disposal-form`.
```

#### Phase 3 — Refactor InventoryCount (2 chat)

**Chat 1 — 3a + 3b:**

```text
Thực hiện Phase 3a–3b — Refactor InventoryCount (phần 1/2) cho kế hoạch VoucherFormLayout SSOT.

Yêu cầu:
- Đọc PLAN_02_VoucherFormLayout_SSOT_Detailed.md từ docs/plans/voucher-form-layout-ssot/.
- Thực hiện sub-phase 3a: tinh chỉnh CountFormLayout.tsx và xóa CountFormLayout.css.
- Thực hiện sub-phase 3b: refactor CountInfoSection.tsx và CountSummary.tsx.
- Sau khi xong, chạy `npm run lint`.
- Đánh dấu task trong openspec/changes/voucher-layout-phase-3-inventory-count/tasks.md.
- Không đụng business logic, types.ts, database.
- Tạo backup trước khi bắt đầu: E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase3a_<YYYYMMDD_HHMMSS>.
- Chưa archive ở bước này.
```

**Chat 2 — 3c + 3d:**

```text
Thực hiện Phase 3c–3d — Refactor InventoryCount (phần 2/2) cho kế hoạch VoucherFormLayout SSOT.

Yêu cầu:
- Đọc PLAN_02_VoucherFormLayout_SSOT_Detailed.md từ docs/plans/voucher-form-layout-ssot/.
- Thực hiện sub-phase 3c: tắt useRefactoredCountLayout và verify InventoryCount.
- Thực hiện sub-phase 3d: rà soát pages/InventoryCount.css.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/voucher-layout-phase-3-inventory-count/tasks.md.
- Không đụng business logic, types.ts, database.
- Tạo backup trước khi bắt đầu: E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase3c_<YYYYMMDD_HHMMSS>.
- Cuối cùng chạy `openspec archive voucher-layout-phase-3-inventory-count`.
```

#### Phase 4 — Refactor SupplierExchanges

```text
Thực hiện Phase 4 — Refactor SupplierExchanges cho kế hoạch VoucherFormLayout SSOT.

Yêu cầu:
- Đọc PLAN_02_VoucherFormLayout_SSOT_Detailed.md từ docs/plans/voucher-form-layout-ssot/.
- Thực hiện đầy đủ các sub-phase: 4a, 4b, 4c, 4d, 4e.
- Chuẩn hóa create form dùng VoucherFormLayout, xử lý alert banner qua prop banner.
- Chuẩn hóa sidebar sections dùng SectionBox.
- Rà soát pages/SupplierExchanges.css.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/voucher-layout-phase-4-supplier-exchanges/tasks.md.
- Không đụng business logic, types.ts, database.
- Tạo backup trước khi bắt đầu: E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase4_<YYYYMMDD_HHMMSS>.
- Cuối cùng chạy `openspec archive voucher-layout-phase-4-supplier-exchanges`.
```

#### Phase 5 — Refactor ImportGoods (3 chat)

**Chat 1 — 5a + 5b + 5c + 5d:**

```text
Thực hiện Phase 5a–5d — Refactor ImportGoods (phần 1/3) cho kế hoạch VoucherFormLayout SSOT.

Yêu cầu:
- Đọc PLAN_02_VoucherFormLayout_SSOT_Detailed.md từ docs/plans/voucher-form-layout-ssot/.
- Thực hiện sub-phase 5a: xóa ImportFormLayout dead code.
- Thực hiện sub-phase 5b: refactor ImportSidebar/SupplierSection.tsx.
- Thực hiện sub-phase 5c: refactor ImportSidebar/ReceiptInfoSection.tsx.
- Thực hiện sub-phase 5d: refactor ImportSidebar/TotalsSection.tsx.
- Sau khi xong, chạy `npm run lint`.
- Đánh dấu task trong openspec/changes/voucher-layout-phase-5-import-goods/tasks.md.
- Không đụng business logic, types.ts, database.
- Tạo backup trước khi bắt đầu: E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase5a_<YYYYMMDD_HHMMSS>.
- Chưa archive trong chat này. 
```

**Chat 2 — 5e + 5f + 5g:**

```text
Thực hiện Phase 5e–5g — Refactor ImportGoods (phần 2/3) cho kế hoạch VoucherFormLayout SSOT.

Yêu cầu:
- Đọc PLAN_02_VoucherFormLayout_SSOT_Detailed.md từ docs/plans/voucher-form-layout-ssot/.
- Thực hiện sub-phase 5e: refactor ImportSidebar/NoteSection.tsx và ActionFooter.tsx.
- Thực hiện sub-phase 5f: dọn ImportGoods.css và rà soát page-level wrapper.
- Thực hiện sub-phase 5g: refactor ImportItemRow.tsx và ImportItemsTable.tsx.
- Sau khi xong, chạy `npm run lint`.
- Đánh dấu task trong openspec/changes/voucher-layout-phase-5-import-goods/tasks.md.
- Không đụng business logic, types.ts, database.
- Tạo backup trước khi bắt đầu: E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase5e_<YYYYMMDD_HHMMSS>.
- Chưa archive. Sau chat 3 mới archive.
```

**Chat 3 — 5h:**

```text
Thực hiện Phase 5h — Refactor ImportGoods (phần 3/3) cho kế hoạch VoucherFormLayout SSOT.

Yêu cầu:
- Đọc PLAN_02_VoucherFormLayout_SSOT_Detailed.md từ docs/plans/voucher-form-layout-ssot/.
- Thực hiện sub-phase 5h: tắt useRefactoredImportLayout và verify ImportGoods.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/voucher-layout-phase-5-import-goods/tasks.md.
- Không đụng business logic, types.ts, database.
- Tạo backup trước khi bắt đầu: E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase5h_<YYYYMMDD_HHMMSS>.
- Cuối cùng chạy `openspec archive voucher-layout-phase-5-import-goods`.
```

#### Phase 6 — Dọn dẹp SSOT (2 chat)

**Chat 1 — 6a + 6b:**

```text
Thực hiện Phase 6a–6b — Dọn dẹp SSOT (phần 1/2) cho kế hoạch VoucherFormLayout SSOT.

Yêu cầu:
- Đọc PLAN_02_VoucherFormLayout_SSOT_Detailed.md từ docs/plans/voucher-form-layout-ssot/.
- Thực hiện sub-phase 6a: xóa toàn bộ dead code files còn sót (ImportFormLayout, DisposalFormLayout, topbar, CSS, item row/table V1).
- Thực hiện sub-phase 6b: xóa 3 feature flags cũ trong features.ts.
- Sau khi xong, chạy `npm run lint`.
- Đánh dấu task trong openspec/changes/voucher-layout-phase-6-cleanup-ssot/tasks.md.
- Không đụng business logic, types.ts, database.
- Tạo backup trước khi bắt đầu: E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase6a_<YYYYMMDD_HHMMSS>.
- Chưa archive. Sau chat 2 mới archive.
```

**Chat 2 — 6c:**

```text
Thực hiện Phase 6c — Dọn dẹp SSOT (phần 2/2) cho kế hoạch VoucherFormLayout SSOT.

Yêu cầu:
- Đọc PLAN_02_VoucherFormLayout_SSOT_Detailed.md từ docs/plans/voucher-form-layout-ssot/.
- Thực hiện sub-phase 6c: gộp CSS textarea dùng chung và final grep check.
- Sau khi xong, chạy `npm run lint` và `npm run build`.
- Đánh dấu task trong openspec/changes/voucher-layout-phase-6-cleanup-ssot/tasks.md.
- Không đụng business logic, types.ts, database.
- Tạo backup trước khi bắt đầu: E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase6c_<YYYYMMDD_HHMMSS>.
- Cuối cùng chạy `openspec archive voucher-layout-phase-6-cleanup-ssot`.
```

#### Phase 7 — Verification

```text
Thực hiện Phase 7 — Verification cho kế hoạch VoucherFormLayout SSOT.

Yêu cầu:
- Đọc PLAN_02_VoucherFormLayout_SSOT_Detailed.md từ docs/plans/voucher-form-layout-ssot/.
- Thực hiện đầy đủ các sub-phase: 7a, 7b, 7c.
- Chạy `npm run lint` và `npm run build`.
- Manual test 5 flow nghiệp vụ: Nhập hàng, Kiểm kê, Xuất hủy, Đổi hàng NCC, và 1 flow tổng hợp.
- Test responsive desktop/tablet/mobile.
- Viết final report ngắn gọn vào docs/plans/voucher-form-layout-ssot/.
- Đánh dấu task trong openspec/changes/voucher-layout-phase-7-verification/tasks.md.
- Không đụng business logic, types.ts, database.
- Tạo backup trước khi bắt đầu: E:\App ban hàng\vietsale-pro-v7_backup_voucher_layout_phase7_<YYYYMMDD_HHMMSS>.
- Cuối cùng chạy `openspec archive voucher-layout-phase-7-verification`.
```

### Lưu ý quan trọng khi dùng prompt mẫu

- **Phần lớn phase đã được chia sẵn trong bảng bên trên.** Bạn chỉ cần làm theo đúng thứ tự chat 1, chat 2, chat 3 của từng phase.
- **Nếu AI trong chat hiện tại bắt đầu quên đã làm đến đâu**, đừng cố ép tiếp. Hãy lưu backup và mở chat mới.
- **Nếu chat bị lỗi out of context**, chỉ cần mở chat mới và dán prompt của phần đang dang dở, kèm thêm dòng: "Tiếp tục từ sub-phase <X>, backup gần nhất ở <đường dẫn>".
- **Đừng archive giữa chừng.** Chỉ archive sau chat cuối cùng của mỗi phase.

## Tham khảo

- `PLAN_01_VoucherFormLayout_SSOT_Overview.md` — kế hoạch tổng
- `PLAN_02_VoucherFormLayout_SSOT_Detailed.md` — kế hoạch chi tiết
- `PLAN_02_VoucherFormLayout_SSOT_Detailed_REVIEW.md` — review plan
