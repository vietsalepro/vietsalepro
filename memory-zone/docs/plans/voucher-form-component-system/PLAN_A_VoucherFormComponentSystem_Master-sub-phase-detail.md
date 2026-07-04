# PLAN A — Voucher Form Component System: Sub-phase Detail
## Chia nhỏ phase để vừa context limit 250K tokens

> **Project:** VietSales Pro v7
> **Path:** `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7`
> **Source plan:** `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master.md`
> **Context limit:** 250K tokens / chat
> **Created:** 2026-07-03
> **Version:** 1.4
> **Revision:** 2026-07-03 (v1.4) — Tách lại các sub-phase vượt/ngưỡng 250K context: Phase 7 chia 4, Phase 8 chia 3, Phase 9 chia 3, Phase 10 chia 8. Mỗi sub-phase đảm bảo <200K bytes file cần load.

---

## 1. Phương pháp ước tính context

### 1.1. Giả định token

| Loại nội dung | Tỷ lệ ước tính | Ghi chú |
|---------------|----------------|---------|
| Code TSX / TS | ~1 token / 3-4 ký tự | Tiếng Việt + JSX nhiều token hơn tiếng Anh thuần |
| CSS | ~1 token / 3-4 ký tự | Class names + comments |
| Prompt + plan | Trực tiếp | Toàn bộ plan phase phải đưa vào prompt |
| Lịch sử chat | Cộng dồn | Mỗi turn read/edit trả về nội dung file |
| Tool output | Cộng dồn | `npm run lint`, `grep`, `exec` trả về text |

Sử dụng tỷ lệ **bảo thủ: 1 token ≈ 3 ký tự**.

### 1.2. Ngân sách context cho code

| Hạng mục | Tokens | Bytes (3 chars/token) |
|----------|--------|----------------------|
| Context limit | 250K | 750K |
| Buffer prompt + plan | ~40K | ~120K |
| Buffer lịch sử + output | ~50K | ~150K |
| Safety margin | ~20K | ~60K |
| **Ngân sách còn lại cho code files** | **~140K** | **~420K** |

Để an toàn, ta lấy **ngưỡng cảnh báo 400K bytes** và **ngưỡng bắt buộc chia sub-phase 500K bytes** cho tổng kích thước file code cần đọc/sửa trong 1 phase.

### 1.3. Dữ liệu kích thước file tham chiếu

| File / Nhóm | Bytes | Tokens ước tính |
|-------------|-------|-----------------|
| `pages/ImportGoods.tsx` | 78,329 | ~26K |
| `pages/InventoryCount.tsx` | 60,223 | ~20K |
| `pages/SupplierExchanges.tsx` | 67,239 | ~22K |
| `pages/DisposalForm.tsx` | 13,289 | ~4.4K |
| `components/import-goods/*` (9 files) | ~52K | ~17K |
| `components/inventory-count/*` (5 files) | ~26K | ~9K |
| `components/disposal-form/*` (5 files) | ~22K | ~7K |
| `components/supplier-exchanges/*` | 0 (inline) | 0 |
| `components/VoucherFormLayout.tsx` | 3,579 | ~1.2K |
| `components/VoucherFormLayout.css` | 6,955 | ~2.3K |
| `components/SectionBox.tsx` | 3,144 | ~1.0K |
| `components/SectionBox.css` | 2,538 | ~0.8K |
| `design-system-tokens.css` | 19,789 | ~6.6K |
| **Layout baseline (chung)** | **~36K** | **~12K** |
| `pages/ImportGoods.css` | 12,336 | ~4.1K |
| `pages/InventoryCount.css` | 18,999 | ~6.3K |
| `pages/SupplierExchanges.css` | 18,811 | ~6.3K |
| `pages/Disposals.css` | 1,865 | ~0.6K |
| `components/import-goods/*.css` | ~21K | ~7K |
| `components/inventory-count/*.css` | ~34K | ~11K |
| `components/disposal-form/*.css` | ~17K | ~6K |

---

## 2. Kết quánh giá từng phase gốc

| Phase gốc | Scope | Tổng bytes code cần load | Tokens ước tính | Vượt 250K? | Quyết định |
|-----------|-------|--------------------------|-----------------|------------|------------|
| **Phase 0** | Audit toàn bộ 4 màn + component con + CSS | ~700K | ~233K | **CÓ** | Chia 4 sub-phase |
| **Phase 1** | Foundation: tạo folder, layout, header, sidebar, actions, banner, scroll | ~80K | ~27K | Không | Giữ nguyên |
| **Phase 2** | Core controls: button, input, textarea, select, label, field, toggle | ~70K | ~23K | Không | Giữ nguyên |
| **Phase 3** | Data components: search, table, pagination, empty, totals, badge | ~90K | ~30K | Không | Giữ nguyên |
| **Phase 4** | Layout sub-components: section, header, content | ~40K | ~13K | Không | Giữ nguyên |
| **Phase 5** | Overlays: dropdown, context menu, popover, click-outside | ~50K | ~17K | Không | Giữ nguyên |
| **Phase 6** | Pilot DisposalForm | ~120K | ~40K | Không | Giữ nguyên |
| **Phase 7** | Rollout ImportGoods | ~300K+ | ~100K+ | **CÓ** | Chia 4 sub-phase |
| **Phase 8** | Rollout InventoryCount | ~230K | ~77K | Gần ngưỡng | Chia 3 sub-phase |
| **Phase 9** | Rollout SupplierExchanges | ~180K | ~60K | Gần ngưỡng | Chia 3 sub-phase |
| **Phase 10** | Cleanup & Verification | ~600K+ | ~200K+ | **CÓ** | Chia 6 sub-phase |

---

## 3. Sub-phase chi tiết

### 3.1 Phase 0 — Audit & Setup (chia 4 sub-phase)

**Lý do chia:** Phase 0 yêu cầu "Inventory toàn bộ file UI/CSS liên quan 4 màn phiếu". Nếu đọc cả 4 page + component con + CSS trong 1 lượt, tổng load >700K bytes, vượt quá ngân sách an toàn.

#### Phase 0.1 — Audit ImportGoods
**Mục tiêu:** Inventory file UI/CSS của màn Nhập hàng.

**Files cần đọc:**
- `pages/ImportGoods.tsx` (78K)
- `pages/ImportGoods.css` (22K)
- `components/import-goods/ImportProductSearch.tsx` + `.css` (~11K)
- `components/import-goods/ImportItemsTable.tsx` + `.css` (~7K)
- `components/import-goods/ImportItemRow.tsx` + `.css` (~9K)
- `components/import-goods/LotExpiryPopover.tsx` + `.css` (~7K)
- `components/import-goods/ImportSidebar/*` (~21K)
- `components/VoucherFormLayout.tsx` + `.css` (~18K)
- `components/SectionBox.tsx` + `.css` (~7K)
- `design-system-tokens.css` (~20K)

**Tổng bytes:** ~200K | **Tokens:** ~67K

**Acceptance criteria:**
- [ ] Có danh sách UI patterns lặp lại trong ImportGoods.
- [ ] Có danh sách dead code riêng của ImportGoods.
- [ ] Có ghi chú các components cần thay thế bằng Voucher Form System.

**Cấm kỵ:** Không sửa code.

---

#### Phase 0.2 — Audit InventoryCount
**Mục tiêu:** Inventory file UI/CSS của màn Kiểm kê.

**Files cần đọc:**
- `pages/InventoryCount.tsx` (60K)
- `pages/InventoryCount.css` (31K)
- `components/inventory-count/CountFormLayout.tsx` (3.5K)
- `components/inventory-count/CountItemsTable.tsx` + `.css` (~20K)
- `components/inventory-count/ProductSearchDropdown.tsx` + `.css` (~5K)
- `components/inventory-count/CountSidebar/*` (~7K)
- Layout baseline (~45K)

**Tổng bytes:** ~172K | **Tokens:** ~57K

**Acceptance criteria:**
- [ ] Có danh sách UI patterns lặp lại trong InventoryCount.
- [ ] Có danh sách dead code riêng của InventoryCount (CountFormLayout.css nếu còn).
- [ ] Có ghi chú về Excel import / scanner / diff calculation (không sửa logic).

**Cấm kỵ:** Không sửa code.

---

#### Phase 0.3 — Audit SupplierExchanges
**Mục tiêu:** Inventory file UI/CSS của màn Đổi hàng NCC.

**Files cần đọc:**
- `pages/SupplierExchanges.tsx` (67K)
- `pages/SupplierExchanges.css` (31K)
- Layout baseline (~45K)
- `components/supplier-exchanges/*` (nếu có)
+
+**Khóa thiết kế bắt buộc cho SupplierExchanges:**
+- Đây là wizard create-flow, không dùng `VoucherTable` / `VoucherTableRow`.
+- Chỉ đồng bộ `VoucherFormLayout`, `VoucherInput`, `VoucherButton`, `VoucherSection`, `VoucherBanner` và `VoucherSearch`/`VoucherProductDropdown` khi thực sự phù hợp với UX hiện tại.
+- Giữ nguyên cấu trúc lot grid, receipt list, exchange item cards; không ép lại thành table template.
+- Nếu cần tái cấu trúc sâu hơn, phải tách thành wrapper form riêng (`ExchangeForm.tsx`) thay vì nhồi mọi logic vào `VoucherTable`.

**Tổng bytes:** ~143K | **Tokens:** ~48K

**Acceptance criteria:**
- [ ] Có danh sách UI patterns lặp lại trong SupplierExchanges.
- [ ] Có đề xuất tách phần create form thành `components/supplier-exchanges/ExchangeForm.tsx` (nếu cần).
- [ ] Có ghi chú về exchange flow / lot selection grid (không sửa logic).

**Cấm kỵ:** Không sửa code.

---

#### Phase 0.4 — Audit DisposalForm + Tổng hợp + Backup
**Mục tiêu:** Inventory màn Xuất hủy, tổng hợp kết quả 4 màn, backup project.

**Files cần đọc:**
- `pages/DisposalForm.tsx` (13K)
- `pages/Disposals.css` (2K)
- `components/disposal-form/DisposalProductSearch.tsx` (~7K, **không có `.css`**)
- `components/disposal-form/DisposalItemsTable.tsx` + `.css` (~7K)
- `components/disposal-form/DisposalItemRow.tsx` + `.css` (~8K)
- `components/disposal-form/DisposalLotSelector.tsx` + `.css` (~12K)
- `components/disposal-form/DisposalDetailModal.tsx` + `.css` (~12K) — **audit ghi nhận, KHÔNG thuộc scope voucher form**
- `components/disposal-form/DisposalSidebar/*` (~5K)
- Layout baseline (~45K)

**Tổng bytes:** ~107K | **Tokens:** ~36K

**Acceptance criteria:**
- [ ] Có danh sách UI patterns lặp lại trong DisposalForm.
- [ ] Có danh sách dead code tổng hợp từ cả 4 màn.
- [ ] Có ghi chú rõ `DisposalDetailModal` thuộc list view `Disposals.tsx` — **NGOÀI SCOPE**, không đụng.
- [ ] Có ghi chú rõ `DisposalLotSelector` phải giữ và nhúng lại khi thay `DisposalItemRow`.
- [ ] Có quyết định Option A1 (Minimal) được xác nhận.
- [ ] Project đã được backup.

**Cấm kỵ:** Không sửa code trừ việc backup.

---

### 3.2 Phase 1 — Foundation (giữ nguyên)

**Mục tiêu:** Tạo nền tảng folder, container layout, utility nhỏ.

**Files cần đọc:**
- `components/VoucherFormLayout.tsx` + `.css` (~18K)
- `components/SectionBox.tsx` + `.css` (~7K)
- `design-system-tokens.css` (~20K)
- `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master.md` (~40K)

**Files cần tạo:**
- `components/voucher-form/index.ts`
- `components/voucher-form/VoucherFormLayout.tsx` + `.css`
- `components/voucher-form/VoucherHeader.tsx` + `.css`
- `components/voucher-form/VoucherSidebar.tsx` + `.css`
- `components/voucher-form/VoucherActions.tsx` + `.css`
- `components/voucher-form/VoucherBanner.tsx` + `.css`
- `components/voucher-form/VoucherScrollArea.tsx` + `.css`
- `utils/classNames.ts`

**Files cần sửa:**
- `pages/ImportGoods.tsx`, `pages/DisposalForm.tsx`, `pages/SupplierExchanges.tsx`, `pages/InventoryCount.tsx`: chuyển import `VoucherFormLayout` sang `components/voucher-form`.
- `components/inventory-count/CountFormLayout.tsx`: chuyển import `VoucherFormLayout` sang `../voucher-form`.
- `components/VoucherFormLayout.tsx` / `.css` cũ: xóa sau khi cập nhật import.

**Lưu ý:** Quyết định cuối cùng đã được chốt trong master plan Section 5: **Chọn Option A — Xóa file cũ, update import path**. Không dùng Option B (re-export wrapper). Chi tiết xem master plan Section 5.

**Tổng bytes:** ~80K | **Tokens:** ~27K

**Kết luận:** Không cần chia sub-phase.

---

### 3.3 Phase 2 — Core Controls (giữ nguyên)

**Mục tiêu:** Tạo button, input, textarea, select, label, field, toggle.

**Files cần đọc:**
- `design-system-tokens.css` (~20K)
- Phase 1 components đã tạo (~30K)

**Files cần tạo:**
- `components/voucher-form/VoucherButton.tsx` + `.css`
- `components/voucher-form/VoucherInput.tsx` + `.css`
- `components/voucher-form/VoucherTextarea.tsx` + `.css`
- `components/voucher-form/VoucherSelect.tsx` + `.css`
- `components/voucher-form/VoucherLabel.tsx` + `.css`
- `components/voucher-form/VoucherField.tsx` + `.css`
- `components/voucher-form/VoucherToggle.tsx` + `.css`
- `components/voucher-form/__demo.tsx` (tạm, xóa sau Phase 10)

**API cần định nghĩa đầy đủ (theo master plan Phase 2):**
- `VoucherButton` cần `icon`, `className`, `title`, `aria-label` để thay thế `ActionButton` trong row.
- `VoucherInput` cần `size`, `fullWidth`, `prefixIcon`, `suffixIcon`, `inputMode`, `list`, `min/max`, `id`, `aria-label` để thay thế `TextInput` trong form/row.

**Tổng bytes:** ~70K | **Tokens:** ~23K

**Kết luận:** Không cần chia sub-phase.

---

### 3.4 Phase 3 — Data Components (đã tinh gọn)

**Mục tiêu:** Tạo search shell, product dropdown, table, row, empty, totals.

**Files cần đọc:**
- `design-system-tokens.css` (~20K)
- Phase 1 + Phase 2 components (~60K)
- `components/import-goods/ImportProductSearch.tsx` (~11K) — tham khảo behavior keyboard navigation
- `components/disposal-form/DisposalProductSearch.tsx` (~7K, không có `.css`) — tham khảo behavior

**Files cần tạo:**
- `components/voucher-form/VoucherSearch.tsx` + `.css` (input shell)
- `components/voucher-form/VoucherProductDropdown.tsx` + `.css` (autocomplete phức tạp)
- `components/voucher-form/VoucherAddButton.tsx` + `.css`
- `components/voucher-form/VoucherTable.tsx` + `.css`
- `components/voucher-form/VoucherTableRow.tsx` + `.css`
- `components/voucher-form/VoucherEmpty.tsx` + `.css`
- `components/voucher-form/VoucherTotals.tsx` + `.css`
- `components/voucher-form/__demo.tsx` (cập nhật)
+
+**Khóa thiết kế bắt buộc cho `VoucherProductDropdown`:**
+- Phải hỗ trợ 2 mode rõ ràng: `client` (lọc từ `products + searchValue`) và `server` (render từ `results`).
+- Không được gộp mọi behavior vào một path render duy nhất nếu làm mất keyboard navigation / click-outside / scroll active item của component gốc.
+- Cho phép page truyền `renderItem` hoặc `filterFn` khi behavior giữa các màn lệch nhau; ưu tiên giữ behavior gốc trước, tối ưu reuse sau.
+- Nếu nhận thấy một page không khớp baseline chung, tách adapter mỏng theo page thay vì mở rộng API bừa bãi.

**Files KHÔNG tạo:**
- `VoucherPagination` — form voucher không phân trang.
- `VoucherStatusBadge` — dùng `StatusBadge` hiện tại.

**API cần định nghĩa đầy đủ (theo master plan Phase 3):**
- `VoucherTableRow` hỗ trợ `children` hoặc `renderCells` để nhúng `DisposalLotSelector`, `LotExpiryPopover`, `VoucherInput`, `VoucherButton` từ page.
- `VoucherProductDropdown` hỗ trợ `mode="client"` (nhận `products` + `searchValue`) và `mode="server"` (nhận `results`) để thay cả 3 dropdown hiện tại.

**Tổng bytes:** ~95K | **Tokens:** ~32K

**Kết luận:** Không cần chia sub-phase.

---

### 3.5 Phase 4 — Layout Sub-components hoàn chỉnh (giữ nguyên)

**Mục tiêu:** Hoàn thiện section, section header, section content.

**Files cần đọc:**
- `components/SectionBox.tsx` + `.css` (~7K)
- Phases 1-3 components (~80K)

**Files cần tạo:**
- `components/voucher-form/VoucherSection.tsx` + `.css`
- `components/voucher-form/VoucherSectionHeader.tsx` + `.css`
- `components/voucher-form/VoucherSectionContent.tsx` + `.css`
- `components/voucher-form/__demo.tsx` (cập nhật)

**Tổng bytes:** ~40K | **Tokens:** ~13K

**Kết luận:** Không cần chia sub-phase.

---

### 3.6 Phase 5 — Overlays (tùy chọn / delay)

**Mục tiêu:** Chỉ tạo overlays nếu thực sự cần sau khi các phase chính hoàn thành.

**Files cần đọc:**
- Phases 1-4 components (~90K)
- `components/import-goods/LotExpiryPopover.tsx` + `.css` (~7K) — nếu quyết định thay

**Files cần tạo (nếu thực hiện):**
- `hooks/useClickOutside.ts` (nếu cần)
- `components/voucher-form/VoucherPopover.tsx` + `.css`
- `components/voucher-form/__demo.tsx` (cập nhật)

**Files KHÔNG tạo:**
- `VoucherDropdown` — đã được `VoucherProductDropdown` đảm nhiệm.
- `VoucherContextMenu` — không cần thiết cho form voucher.

**Tổng bytes:** ~25K | **Tokens:** ~8K

**Kết luận:** Có thể bỏ qua hoặc delay sang phase sau. Nếu làm, không cần chia sub-phase.

---

### 3.7 Phase 6 — Pilot Refactor: DisposalForm (giữ nguyên)

**Mục tiêu:** Áp dụng system lên màn Xuất hủy — màn đơn giản nhất.

**Files cần đọc:**
- Phases 1-4 components (~100K) (Phase 5 tùy chọn)
- `pages/DisposalForm.tsx` (13K)
- `components/disposal-form/DisposalProductSearch.tsx` (~7K, **không có `.css`**)
- `components/disposal-form/DisposalItemsTable.tsx` + `.css` (~7K)
- `components/disposal-form/DisposalItemRow.tsx` + `.css` (~8K)
- `components/disposal-form/DisposalLotSelector.tsx` + `.css` (~12K) — **GIỮ NGUYÊN, nhúng lại vào `VoucherTableRow`**
- `components/disposal-form/DisposalSidebar/*` (~5K)
- `pages/Disposals.css` (2K)

**Files cần sửa:**
- `pages/DisposalForm.tsx`
- `pages/Disposals.css`

**Files cần xóa:**
- CSS của `DisposalItemsTable`, `DisposalItemRow` nếu không còn dùng (chỉ khi `VoucherTable`/`VoucherTableRow` đã thay hoàn toàn)
- **Không xóa** `DisposalProductSearch.css` vì không tồn tại.
- **Không xóa** `DisposalFormLayout.tsx` / `.css` vì đã không còn tồn tại.
- **KHÔNG XÓA** `DisposalDetailModal.tsx` / `.css` — thuộc list view `Disposals.tsx`.
- **KHÔNG XÓA** `DisposalLotSelector.tsx` / `.css` — vẫn dùng trong `VoucherTableRow`.

**Lưu ý quan trọng:**
- `VoucherSearch` chỉ là input shell trong header.
- `VoucherProductDropdown` mount trong `searchSlot` để thay `DisposalProductSearch`.
- **`DisposalLotSelector` phải được nhúng lại** trong render `VoucherTableRow` khi `product?.hasBatches && product?.lots?.length > 0`. Giữ nguyên `useEffect` khóa số lượng khi `reason === 'Hàng hết hạn'` (xem `DisposalItemRow.tsx` line 39-46). Tương tự `LotExpiryPopover` ở ImportGoods.
- **`DisposalDetailModal` không đụng** — thuộc list view, ngoài scope.
- Test keyboard navigation (↑ ↓ Enter Esc) sau phase.
- Test chọn lô cho hàng hết hạn sau phase.

**Acceptance criteria:**
- [ ] `pages/DisposalForm.tsx` dùng components từ `components/voucher-form/`.
- [ ] `DisposalLotSelector` được nhúng trong `VoucherTableRow` khi `hasBatches` — chọn lô hàng hết hạn hoạt động đúng.
- [ ] `DisposalDetailModal` không bị đụng (list view `Disposals.tsx` vẫn mở modal được).
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Tạo/sửa/hoàn thành phiếu xuất hủy hoạt động đúng.

**Tổng bytes:** ~120K | **Tokens:** ~40K

**Kết luận:** Không cần chia sub-phase.

---

### 3.8 Phase 7 — Rollout: ImportGoods (chia 4 sub-phase)

**Lý do chia:** ImportGoods là page lớn nhất (78K) với nhiều component con phức tạp (lot, popover, supplier, totals). Tổng load nếu làm 1 lần >300K bytes, cộng buffer sẽ vượt ngưỡng an toàn. `LotExpiryPopover` giữ nguyên trong phase này.

#### Phase 7.1 — ImportGoods Sidebar Refactor
**Mục tiêu:** Thay thế các sidebar sections bằng Voucher system trước.

**Files cần đọc:**
- `components/voucher-form/` (phases 1-4 đã tạo, ~100K)
- `components/import-goods/ImportSidebar/SupplierSection.tsx` + `.css` (~13K)
- `components/import-goods/ImportSidebar/ReceiptInfoSection.tsx` + `.css` (~3.5K)
- `components/import-goods/ImportSidebar/TotalsSection.tsx` + `.css` (~5.7K)
- `components/import-goods/ImportSidebar/NoteSection.tsx` (~1.5K)
- `components/import-goods/ImportSidebar/ActionFooter.tsx` + `.css` (~3.1K)
- `components/VoucherFormLayout.tsx` + `.css` (~18K) — baseline
- `components/SectionBox.tsx` + `.css` (~7K) — baseline
- `design-system-tokens.css` (~20K) — baseline
- `pages/ImportGoods.css` (~22K) — chỉ phần CSS sidebar

**Files cần tạo/sửa:**
- Tạo wrapper components nếu cần
- Sửa `pages/ImportGoods.tsx` — chỉ phần JSX sidebar (KHÔNG đọc toàn bộ file trong phase này)
- Cập nhật `pages/ImportGoods.css` xóa CSS sidebar create form

**Tổng bytes:** ~190K | **Tokens:** ~63K

> **Lưu ý:** Chỉ sửa phần sidebar JSX trong `ImportGoods.tsx`, KHÔNG đọc/sửa phần main area (search, table, item rows). Phần main area sẽ được xử lý ở Phase 7.2a/7.2b.

**Acceptance criteria:**
- [ ] Sidebar Nhập hàng dùng toàn bộ components từ `components/voucher-form/`.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Tạo/sửa/hoàn thành phiếu nhập vẫn đúng (tính tiền, công nợ, NCC).

**Cấm kỵ:** Không thay đổi logic tính tiền, công nợ, API.

---

#### Phase 7.2a — ImportGoods Main Area: Search + Table Shell
**Mục tiêu:** Thay thế search shell và table frame bằng Voucher system, giữ nguyên lot popover và item-row business logic.

**Files cần đọc:**
- `components/voucher-form/` (phases 1-4, ~100K)
- `components/import-goods/ImportProductSearch.tsx` + `.css` (~11K)
- `components/import-goods/ImportItemsTable.tsx` + `.css` (~7K)
- `pages/ImportGoods.tsx` — phần main area search + table (~78K, đọc lần 2)
- `pages/ImportGoods.css` (~22K)
- `components/VoucherFormLayout.tsx` + `.css` (~18K)

**Files cần tạo/sửa:**
- Sửa `pages/ImportGoods.tsx` để dùng `VoucherSearch` (input shell) + `VoucherProductDropdown` (dropdown), `VoucherTable`.
- Xóa CSS của `ImportProductSearch`, `ImportItemsTable` nếu không còn dùng.

**Tổng bytes:** ~196K | **Tokens:** ~65K

**Acceptance criteria:**
- [ ] Main area Nhập hàng dùng `VoucherSearch`, `VoucherProductDropdown`, `VoucherTable`.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Search, thêm sản phẩm, table rendering hoạt động đúng.

**Cấm kỵ:** Không thay đổi logic tìm kiếm, API.

---

#### Phase 7.2b — ImportGoods Item Rows + Lot Handling Cleanup
**Mục tiêu:** Thay row UI bằng `VoucherTableRow`, giữ `LotExpiryPopover` và toàn bộ logic nhập lô/HSD.

**Files cần đọc:**
- `components/voucher-form/` (phases 1-4, ~100K)
- `components/import-goods/ImportItemRow.tsx` + `.css` (~9K)
- `components/import-goods/LotExpiryPopover.tsx` + `.css` (~7K)
- `pages/ImportGoods.tsx` — phần item rows (~78K, đọc lần 3)
- `pages/ImportGoods.css` (~22K)

**Files cần tạo/sửa:**
- Sửa `pages/ImportGoods.tsx` để dùng `VoucherTableRow` cho item rows.
- **Giữ nguyên `LotExpiryPopover`** — không thay trong phase này.
- Xóa CSS của `ImportItemRow` nếu không còn dùng.

**Tổng bytes:** ~166K | **Tokens:** ~55K

**Acceptance criteria:**
- [ ] Item rows dùng `VoucherTableRow`.
- [ ] `LotExpiryPopover` vẫn hoạt động đúng.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Nhập lô/HSD và xóa item hoạt động đúng.

**Cấm kỵ:** Không thay đổi lot management, API.

---

#### Phase 7.3 — ImportGoods Page Integration & Cleanup
**Mục tiêu:** Tích hợp cuối, cleanup imports, dọn CSS create form.

**Files cần đọc:**
- `pages/ImportGoods.tsx` (~78K)
- `pages/ImportGoods.css` (~22K)
- `components/voucher-form/*` đã tạo (~100K)

**Files cần sửa/xóa:**
- `pages/ImportGoods.tsx`: final pass, imports cleanup
- `pages/ImportGoods.css`: giữ CSS cho list view, xóa CSS create form

**Tổng bytes:** ~140K | **Tokens:** ~47K

> **Lưu ý:** Chỉ cleanup imports + CSS. KHÔNG đọc/sửa lại `components/import-goods/*` trong phase này — việc xóa file cũ được thực hiện ở Phase 7.4.

**Acceptance criteria:**
- [ ] `pages/ImportGoods.tsx` đã dùng components mới hoàn toàn.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không thay đổi business logic.

---

#### Phase 7.4 — ImportGoods Dead Code Cleanup
**Mục tiêu:** Xóa file CSS/component cũ sau khi đã xác nhận không còn import.

**Files cần đọc:**
- `pages/ImportGoods.tsx`
- `components/import-goods/*` (grep import trước khi xóa)
- `components/voucher-form/*`

**Acceptance criteria:**
- [ ] Grep không còn import `ImportProductSearch|ImportItemsTable|ImportItemRow`.
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] `LotExpiryPopover.tsx` / `.css` vẫn được giữ nguyên.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không đụng logic nghiệp vụ.

---

### 3.9 Phase 8 — InventoryCount V1 Removal & Legacy Cleanup

**Mục tiêu:** Loại bỏ hoàn toàn V1 legacy path của InventoryCount trước khi bắt đầu rollout Voucher Form System cho màn này.

**Files cần đọc:**
- `components/inventory-count/CountItemsTable.tsx` + `.css` (~20K)
- `components/inventory-count/CountFormLayout.tsx` (~3.5K)
- `components/inventory-count/CountSidebar/CountInfoSection.tsx` + `.css` (~4.5K)
- `components/inventory-count/CountSidebar/CountSummary.tsx` + `.css` (~2.3K)
- `pages/InventoryCount.tsx` (~60K) — chỉ để grep/confirm V1 branches
- `pages/InventoryCount.css` (~31K) — chỉ để grep/confirm CSS V1

**Files cần làm:**
- Xóa toàn bộ nhánh render V1 trong `CountItemsTable.tsx`, `CountFormLayout.tsx`, `CountInfoSection.tsx`, `CountSummary.tsx`.
- Xóa import / CSS / helper chỉ phục vụ V1.
- Giữ nguyên V2 path đang bật bởi `useRefactoredCountLayout`.
- Nếu V1 còn giữ helper chung với V2, tách helper mỏng hoặc inline vào V2 để tránh kéo dài nợ kỹ thuật.
- Sau cleanup, grep đảm bảo không còn `!useRefactoredCountLayout` / V1 branch nào trong inventory-count components.

**Phạm vi không đụng:**
- Không đổi logic chênh lệch, Excel import/export, scanner, DataGrid behavior.
- Không đụng `DisposalDetailModal`, `DisposalLotSelector`, `LotExpiryPopover`.

**Acceptance criteria:**
- [ ] Không còn nhánh V1 trong InventoryCount components.
- [ ] Chỉ còn V2 path được render.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Visual InventoryCount không đổi ngoài việc bỏ V1 legacy code.

**Cấm kỵ:** Không thay đổi logic nghiệp vụ InventoryCount.

---

### 3.10 Phase 9 — Rollout: InventoryCount (chia 3 sub-phase)

**Lý do chia:** InventoryCount có form view + list view DataGrid phức tạp, Excel import, scanner. Tổng load ~230K bytes, gần ngưỡng. Chia để an toàn. `CountFormLayout` không xóa mà refactor.

#### Phase 8.1 — InventoryCount Form View Refactor
**Mục tiêu:** Refactor `CountFormLayout` sidebar + search, thay `ProductSearchDropdown`, `CountSidebar` bằng Voucher system.

**Files cần đọc:**
- `components/voucher-form/` (phases 1-4, ~100K)
- `components/inventory-count/CountFormLayout.tsx` (~3.5K)
- `components/inventory-count/ProductSearchDropdown.tsx` + `.css` (~5K)
- `components/inventory-count/CountSidebar/CountInfoSection.tsx` + `.css` (~4.5K)
- `components/inventory-count/CountSidebar/CountSummary.tsx` + `.css` (~2.3K)
- `components/inventory-count/CountSidebar/ExcelImportSection.tsx` + `.css` (~4.4K)
- `components/VoucherFormLayout.tsx` + `.css` (~18K) — baseline
- `pages/InventoryCount.css` (~31K)

**Files cần sửa:**
- `components/inventory-count/CountFormLayout.tsx` (refactor bên trong, giữ file)
- `pages/InventoryCount.tsx` — chỉ phần form view sidebar JSX
- `pages/InventoryCount.css` — xóa CSS form view sidebar

**Lưu ý quan trọng:**
- `CountFormLayout.tsx` vẫn giữ lại, chỉ thay nội dung bên trong bằng `VoucherFormLayout` + `VoucherSection` + `VoucherField` + `VoucherTotals`.
- `ProductSearchDropdown` thay bằng `VoucherSearch` + `VoucherProductDropdown`.

**Tổng bytes:** ~140K | **Tokens:** ~47K

**Acceptance criteria:**
- [ ] Form view Kiểm kê sidebar dùng `VoucherFormLayout`, `VoucherSearch`, `VoucherProductDropdown`, `VoucherSection`, `VoucherField`, `VoucherTotals`.
- [ ] `CountFormLayout.tsx` vẫn tồn tại sau refactor.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không thay đổi logic tính chênh lệch, Excel import, scanner, API.

---

#### Phase 8.2 — InventoryCount List View & Cleanup
**Mục tiêu:** Thay `CountItemsTable` bằng `VoucherTable`, dọn CSS form view.

**Files cần đọc:**
- `pages/InventoryCount.tsx` (~60K)
- `pages/InventoryCount.css` (~31K)
- `components/inventory-count/CountItemsTable.tsx` + `.css` (~20K)
- `components/voucher-form/*` (~100K)

**Files cần sửa/xóa:**
- `pages/InventoryCount.tsx`: final pass list view + cleanup imports
- `pages/InventoryCount.css`: giữ CSS list view, xóa CSS form view
- Xóa CSS của `CountItemsTable`, `ProductSearchDropdown` nếu không còn dùng
- **Không xóa** `components/inventory-count/CountFormLayout.tsx` vì vẫn đang được import.

**Tổng bytes:** ~170K | **Tokens:** ~57K

> **Lưu ý:** Chỉ xóa file ở Phase 8.3 sau khi confirm import.

**Acceptance criteria:**
- [ ] List view DataGrid vẫn hoạt động đúng.
- [ ] Không còn import components cũ trong InventoryCount.
- [ ] `CountFormLayout.tsx` vẫn tồn tại hoặc đã được refactor an toàn.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không thay đổi DataGrid toàn cục.

---

#### Phase 8.3 — InventoryCount Dead Code Cleanup
**Mục tiêu:** Xóa file cũ sau khi confirm không còn import.

**Files cần đọc:**
- `pages/InventoryCount.tsx`, `pages/InventoryCount.css`
- `components/inventory-count/*`
- `components/voucher-form/*`

**Acceptance criteria:**
- [ ] Grep không còn import `ProductSearchDropdown|CountItemsTable`.
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] Xóa demo page `components/voucher-form/__demo.tsx` (nếu Phase 10 chưa xóa).
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không đụng DataGrid toàn cục.

---

### 3.10 Phase 9 — Rollout: SupplierExchanges (chia 3 sub-phase)

**Lý do chia:** SupplierExchanges page lớn (67K) và inline logic phức tạp (exchange flow, lot selection, item cards). Chia để giảm cognitive load và context. Không ép table template.

#### Phase 9.1 — SupplierExchanges Create Form Refactor
**Mục tiêu:** Tách/refactor phần create form, thay UI bằng Voucher system. Giữ cấu trúc wizard.

**Files cần đọc:**
- `components/voucher-form/` (phases 1-4, ~100K)
- `pages/SupplierExchanges.tsx` (phần create form) (~67K)
- `pages/SupplierExchanges.css` (~31K)
- `components/VoucherFormLayout.tsx` + `.css` (~18K) — baseline
- `components/SectionBox.tsx` + `.css` (~7K) — baseline

**Files cần tạo/sửa:**
- Tạo `components/supplier-exchanges/ExchangeForm.tsx` (tùy chọn)
- Sửa `pages/SupplierExchanges.tsx` để dùng `VoucherFormLayout`, `VoucherSection`, `VoucherField`, `VoucherButton`, `VoucherBanner`, `VoucherEmpty`
- Cập nhật `pages/SupplierExchanges.css` xóa CSS create form

**Lưu ý quan trọng:**
- Không dùng `VoucherTable` / `VoucherTableRow` — màn này là wizard, không phải table.
- Giữ nguyên cấu trúc: lot selection grid, receipt selection list, exchange item cards.
- Chỉ thay input/button/section styling bằng Voucher components.

**Tổng bytes:** ~160K | **Tokens:** ~53K

**Acceptance criteria:**
- [ ] Phần create form dùng components từ `components/voucher-form/` (không bao gồm table).
- [ ] Cấu trúc wizard (lot grid, receipt list, item cards) vẫn hoạt động đúng.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Chọn NCC, phiếu nhập gốc, lô, hoàn thành đúng.

**Cấm kỵ:** Không thay đổi logic đổi hàng NCC, API. Không ép table template.

---

#### Phase 9.2 — SupplierExchanges Wizard Logic & Integration
**Mục tiêu:** Gắn logic chọn lô / phiếu / item cards vào shell đã refactor, cleanup imports.

**Files cần đọc:**
- `pages/SupplierExchanges.tsx` (~67K)
- `pages/SupplierExchanges.css` (~31K)
- `components/voucher-form/*` (~100K)

**Files cần sửa:**
- `pages/SupplierExchanges.tsx`: final pass, cleanup imports, ensure lot/receipt/item-card flow works
- `pages/SupplierExchanges.css`: giữ CSS list view, xóa CSS create form

**Tổng bytes:** ~150K | **Tokens:** ~50K

**Acceptance criteria:**
- [ ] List view phiếu đổi trả vẫn hoạt động đúng.
- [ ] Wizard create form vẫn hoạt động đúng.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không thay đổi DataGrid toàn cục.

---

#### Phase 9.3 — SupplierExchanges Dead Code Cleanup
**Mục tiêu:** Xóa file cũ sau khi confirm không còn import.

**Files cần đọc:**
- `pages/SupplierExchanges.tsx`, `pages/SupplierExchanges.css`
- `components/supplier-exchanges/*` (nếu có)
- `components/voucher-form/*`

**Acceptance criteria:**
- [ ] Grep không còn import các component cũ chỉ phục vụ create form.
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không thay đổi logic nghiệp vụ.

---

### 3.11 Phase 10 — Cleanup & Verification (chia 9 sub-phase)

**Lý do chia:** Phase 10 cần grep toàn project + đọc nhiều file cũ/mới để xác nhận dead code + manual test 4 flow. Context quá lớn, nên tách nhỏ hơn theo từng page và từng nhóm kiểm thử để không vượt giới hạn 250K của một đoạn chat.

#### Phase 10.1a — Dead Code Cleanup: import-goods imports & grep audit
**Mục tiêu:** Chỉ audit/grep Nhập hàng, xác nhận chính xác file nào còn import và file nào có thể xóa.

**Files cần đọc:**
- `pages/ImportGoods.tsx` (grep import)
- `components/import-goods/*` (trừ `LotExpiryPopover`)
- `components/voucher-form/*`

**Tổng bytes:** ~120K | **Tokens:** ~40K

**Acceptance criteria:**
- [ ] Grep không còn import `ImportProductSearch|ImportItemsTable|ImportItemRow`.
- [ ] Có danh sách file CSS/components cũ đủ tin cậy để xóa ở sub-phase sau.
- [ ] `LotExpiryPopover.tsx` / `.css` vẫn được giữ nguyên.

---

#### Phase 10.1b — Dead Code Cleanup: import-goods file removal
**Mục tiêu:** Xóa CSS/components cũ của Nhập hàng sau khi đã audit xong ở 10.1a.

**Files cần đọc:**
- `pages/ImportGoods.tsx`
- `components/import-goods/*`
- `components/voucher-form/*`

**Tổng bytes:** ~120K | **Tokens:** ~40K

**Acceptance criteria:**
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] `LotExpiryPopover.tsx` / `.css` vẫn được giữ nguyên.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---

#### Phase 10.1c — Dead Code Cleanup: disposal-form imports & grep audit
**Mục tiêu:** Chỉ audit/grep Xuất hủy, xác nhận chính xác file nào còn import và file nào có thể xóa.

**Files cần đọc:**
- `pages/DisposalForm.tsx`, `pages/Disposals.css`
- `components/disposal-form/*`
- `components/voucher-form/*`

**Tổng bytes:** ~95K | **Tokens:** ~32K

**Acceptance criteria:**
- [ ] Grep không còn import `DisposalProductSearch|DisposalItemsTable|DisposalItemRow`.
- [ ] `DisposalDetailModal.tsx` / `.css` được xác nhận là ngoài scope và không đụng.
- [ ] `DisposalLotSelector.tsx` / `.css` được xác nhận là vẫn giữ.

---

#### Phase 10.1d — Dead Code Cleanup: disposal-form file removal
**Mục tiêu:** Xóa CSS/components cũ của Xuất hủy sau khi đã audit xong ở 10.1c.

**Files cần đọc:**
- `pages/DisposalForm.tsx`, `pages/Disposals.css`
- `components/disposal-form/*`
- `components/voucher-form/*`

**Tổng bytes:** ~95K | **Tokens:** ~32K

**Acceptance criteria:**
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] `DisposalDetailModal.tsx` / `.css` không bị đụng.
- [ ] `DisposalLotSelector.tsx` / `.css` không bị xóa nhầm.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---

#### Phase 10.2a — Dead Code Cleanup: inventory-count imports & grep audit
**Mục tiêu:** Chỉ audit/grep Kiểm kê, xác nhận chính xác file nào còn import và file nào có thể xóa.

**Files cần đọc:**
- `pages/InventoryCount.tsx` (grep import)
- `pages/InventoryCount.css`
- `components/inventory-count/*`
- `components/voucher-form/*`

**Tổng bytes:** ~120K | **Tokens:** ~40K

**Acceptance criteria:**
- [ ] Grep không còn import `ProductSearchDropdown|CountItemsTable`.
- [ ] `CountFormLayout` vẫn được import (vì vẫn dùng) hoặc đã refactor hoàn toàn vào page.
- [ ] Có danh sách CSS/components cũ đủ tin cậy để xóa ở sub-phase sau.

---

#### Phase 10.2b — Dead Code Cleanup: inventory-count file removal
**Mục tiêu:** Xóa CSS/components cũ của Kiểm kê sau khi đã audit xong ở 10.2a.

**Files cần đọc:**
- `pages/InventoryCount.tsx`
- `pages/InventoryCount.css`
- `components/inventory-count/*`
- `components/voucher-form/*`

**Tổng bytes:** ~120K | **Tokens:** ~40K

**Acceptance criteria:**
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] Xóa demo page `components/voucher-form/__demo.tsx`.
- [ ] `CountFormLayout` vẫn được giữ nếu còn được import.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---

#### Phase 10.2c — Dead Code Cleanup: supplier-exchanges imports & grep audit
**Mục tiêu:** Chỉ audit/grep Đổi hàng NCC, xác nhận chính xác file nào còn import và file nào có thể xóa.

**Files cần đọc:**
- `pages/SupplierExchanges.tsx` (grep import)
- `pages/SupplierExchanges.css`
- `components/supplier-exchanges/*`
- `components/voucher-form/*`

**Tổng bytes:** ~100K | **Tokens:** ~33K

**Acceptance criteria:**
- [ ] Grep không còn import các component cũ chỉ phục vụ create form nếu đã thay thế.
- [ ] Có danh sách file CSS/components cũ đủ tin cậy để xóa ở sub-phase sau.

---

#### Phase 10.2d — Dead Code Cleanup: supplier-exchanges file removal
**Mục tiêu:** Xóa CSS/components cũ của Đổi hàng NCC sau khi đã audit xong ở 10.2c.

**Files cần đọc:**
- `pages/SupplierExchanges.tsx`
- `pages/SupplierExchanges.css`
- `components/supplier-exchanges/*`
- `components/voucher-form/*`

**Tổng bytes:** ~100K | **Tokens:** ~33K

**Acceptance criteria:**
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---

#### Phase 10.3 — Build Verification & Type Fixes
**Mục tiêu:** Chạy `npm run lint` + `npm run build`, fix lỗi nếu có.

**Files cần đọc:**
- Output của `npm run lint` + `npm run build`
- Các file báo lỗi (thường <10 file)

**Tổng bytes:** phụ thuộc lỗi, nhưng thấp (~50K-100K)

**Acceptance criteria:**
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Không còn lỗi TypeScript liên quan Voucher Form System.
- [ ] Không còn file/components đã đánh dấu dead nhưng vẫn còn import.

---

#### Phase 10.4a — Manual Test: ImportGoods
**Mục tiêu:** Test riêng luồng Nhập hàng, tách khỏi các flow khác để giảm context.

**Tổng bytes:** ~120K | **Tokens:** ~40K

**Acceptance criteria:**
- [ ] Tạo phiếu nhập → hoàn thành.
- [ ] **Nhập hàng có lô/HSD**: nhập lô qua `LotExpiryPopover` → hoàn thành đúng.
- [ ] Keyboard navigation trong search dropdown Nhập hàng vẫn hoạt động: ↑ ↓ Enter Esc.

---

#### Phase 10.4b — Manual Test: DisposalForm
**Mục tiêu:** Test riêng luồng Xuất hủy.

**Tổng bytes:** ~95K | **Tokens:** ~32K

**Acceptance criteria:**
- [ ] Tạo phiếu xuất hủy → hoàn thành.
- [ ] **Xuất hủy hàng hết hạn**: chọn lô qua `DisposalLotSelector` → SL tự khóa theo lô.
- [ ] `DisposalDetailModal` trong `Disposals.tsx` vẫn mở bình thường.
- [ ] Keyboard navigation trong search dropdown Xuất hủy vẫn hoạt động: ↑ ↓ Enter Esc.

---

#### Phase 10.4c — Manual Test: InventoryCount
**Mục tiêu:** Test riêng luồng Kiểm kê.

**Tổng bytes:** ~120K | **Tokens:** ~40K

**Acceptance criteria:**
- [ ] Tạo phiếu kiểm kê → lưu nháp → hoàn thành.
- [ ] Keyboard navigation trong search dropdown Kiểm kê vẫn hoạt động.
- [ ] Chênh lệch hiển thị đúng.

---

#### Phase 10.4d — Manual Test: SupplierExchanges + Responsive
**Mục tiêu:** Test riêng luồng Đổi hàng NCC và kiểm tra responsive toàn hệ thống.

**Tổng bytes:** ~120K | **Tokens:** ~40K

**Acceptance criteria:**
- [ ] Tạo phiếu đổi hàng NCC → hoàn thành.
- [ ] Wizard lot grid / receipt list / exchange item cards vẫn hoạt động đúng.
- [ ] Responsive desktop (>1024px) OK.
- [ ] Responsive tablet (768–1023px) OK.
- [ ] Responsive mobile (<768px) OK.

**Cấm kỵ:** Không sửa code ngoài fix lỗi UI nhỏ.

---

## 4. Bảng tổng hợp plan mới

| Phase gốc | Sub-phase mới | Tên | Bytes ước tính | Tokens ước tính | Vượt 250K? |
|-----------|-----------------|-----|----------------|-----------------|------------|
| 0 | 0.1 | Audit ImportGoods | ~200K | ~67K | Không |
| 0 | 0.2 | Audit InventoryCount | ~172K | ~57K | Không |
| 0 | 0.3 | Audit SupplierExchanges | ~143K | ~48K | Không |
| 0 | 0.4 | Audit DisposalForm + Tổng hợp + Backup | ~107K | ~36K | Không |
| 1 | 1.0 | Foundation | ~80K | ~27K | Không |
| 2 | 2.0 | Core Controls | ~70K | ~23K | Không |
| 3 | 3.0 | Data Components | ~95K | ~32K | Không |
| 4 | 4.0 | Layout Sub-components | ~40K | ~13K | Không |
| 5 | 5.0 | Overlays (tùy chọn) | ~25K | ~8K | Không |
| 6 | 6.0 | Pilot DisposalForm | ~120K | ~40K | Không |
| 7 | 7.1 | ImportGoods Sidebar Refactor | ~190K | ~63K | Không |
| 7 | 7.2a | ImportGoods Main Area: Search + Table Shell | ~196K | ~65K | Không |
| 7 | 7.2b | ImportGoods Item Rows + Lot Handling Cleanup | ~166K | ~55K | Không |
| 7 | 7.3 | ImportGoods Page Integration & Cleanup | ~140K | ~47K | Không |
| 7 | 7.4 | ImportGoods Dead Code Cleanup | ~80K | ~27K | Không |
| 8 | 8.1 | InventoryCount Form View Refactor | ~140K | ~47K | Không |
| 8 | 8.2 | InventoryCount List View & Cleanup | ~170K | ~57K | Không |
| 8 | 8.3 | InventoryCount Dead Code Cleanup | ~80K | ~27K | Không |
| 9 | 9.1 | SupplierExchanges Create Form Refactor | ~160K | ~53K | Không |
| 9 | 9.2 | SupplierExchanges Wizard Integration | ~150K | ~50K | Không |
| 9 | 9.3 | SupplierExchanges Dead Code Cleanup | ~80K | ~27K | Không |
| 10 | 10.1a | Dead Code Cleanup: import-goods | ~120K | ~40K | Không |
| 10 | 10.1b | Dead Code Cleanup: disposal-form | ~95K | ~32K | Không |
| 10 | 10.2a | Dead Code Cleanup: inventory-count | ~120K | ~40K | Không |
| 10 | 10.2b | Dead Code Cleanup: supplier-exchanges | ~100K | ~33K | Không |
| 10 | 10.3 | Build Verification & Type Fixes | ~50K-100K | ~17K-33K | Không |
| 10 | 10.4a | Manual Test: ImportGoods + DisposalForm | ~120K | ~40K | Không |
| 10 | 10.4b | Manual Test: InventoryCount + SupplierExchanges + Responsive | ~120K | ~40K | Không |

---

## 5. Lưu ý quan trọng khi chạy từng sub-phase

### 5.1. Mỗi sub-phase phải là một đoạn chat riêng biệt

Không gộp nhiều sub-phase vào 1 đoạn chat. Ngay cả khi tổng bytes 2 sub-phase <250K, lịch sử chat sẽ cộng dồn và nhanh chóng vượt limit.

### 5.2. Đọc file theo nhu cầu, không đọc toàn bộ project

Trong mỗi sub-phase, chỉ đưa vào prompt các file thuộc scope đó. Ví dụ Phase 7.1 không cần đọc `ImportProductSearch.tsx`.

### 5.3. Chạy lint/build sau mỗi sub-phase

Dù plan gốc yêu cầu sau mỗi phase lớn, với sub-phase vẫn nên chạy `npm run lint` và `npm run build` nếu đã sửa code. Riêng Phase 0.x chỉ đọc, không cần chạy.

### 5.4. Backup trước mỗi phase lớn đã chia

Nên backup trước Phase 7.1, 8.1, 9.1, 10.1 vì đây là các điểm bắt đầu refactor page lớn.

### 5.5. Handoff giữa các sub-phase

Sau mỗi sub-phase, ghi lại:
- Những file đã sửa
- Những component cũ chưa xóa (để sub-phase sau xóa)
- Lỗi/lưu ý phát hiện ngoài scope

### 5.6. Không xóa file đang được import

Đặc biệt `components/inventory-count/CountFormLayout.tsx` vẫn đang được import trong `pages/InventoryCount.tsx`. Chỉ xóa sau khi đã chạy `grep` xác nhận không còn import.

### 5.7. Search dropdown phải giữ keyboard navigation

Khi thay `ImportProductSearch`, `DisposalProductSearch`, `ProductSearchDropdown` bằng `VoucherProductDropdown`, đảm bảo test:
- Arrow Up / Down di chuyển highlight
- Enter chọn
- Esc đóng
- Click outside đóng
- Scroll into view khi di chuyển highlight

### 5.8. SupplierExchanges không dùng table template

Màn này là wizard: lot selection grid → receipt list → exchange item cards. Không dùng `VoucherTable` / `VoucherTableRow`. Chỉ đồng nhất input/button/section styling.

### 5.9. LotExpiryPopover giữ nguyên trong phase này

`LotExpiryPopover` xử lý logic nhập lô/HSD phức tạp. Không thay bằng `VoucherPopover` trong phase này. Ghi chú cho phase nâng cấp sau.

### 5.10. DisposalLotSelector giữ nguyên và phải nhúng lại

`DisposalLotSelector` (nhúng trong `DisposalItemRow.tsx` line 4, line 94) có logic `useEffect` khóa số lượng khi `reason === 'Hàng hết hạn'` (line 39-46). Khi thay `DisposalItemRow` bằng `VoucherTableRow` ở Phase 6, **bắt buộc phải nhúng lại `DisposalLotSelector`** vào render row khi `product?.hasBatches && product?.lots?.length > 0`. Tương tự cách giữ `LotExpiryPopover` ở ImportGoods. Không xóa file này ở Phase 10.1.

### 5.11. DisposalDetailModal ngoài scope — không đụng

`DisposalDetailModal.tsx` + `.css` (~12K) thuộc **list view** `pages/Disposals.tsx` (import line 6, render line 312), không thuộc voucher form. Không refactor, không thay, không xóa trong bất kỳ phase nào. Đặc biệt cẩn thận ở Phase 10.1 khi liệt kê "xóa `components/disposal-form/*`" — phải loại trừ file này.

### 5.12. Không thay TextInput / ActionButton toàn cục

`components/TextInput.tsx` và `components/ActionButton.tsx` dùng ở **9 page** (ImportGoods, SupplierExchanges, InventoryCount, Products, Suppliers, Customers, ReturnOrders, Orders, Disposals). Plan chỉ tạo `VoucherButton` / `VoucherInput` riêng trong `components/voucher-form/` và dùng cho 4 form voucher. Không sửa 2 component toàn cục này.

### 5.13. Tham chiếu Implementation Guardrails trong master plan

Mỗi sub-phase kết thúc phải áp dụng checklist từ master plan **Section 11 — Implementation Guardrails**:
- **11.1 Business Logic Protection Checklist:** đặc biệt `TotalsSection`, `SupplierSection`, `InventoryCount` search, `DisposalLotSelector`, `ImportItemRow` line total.
- **11.2 Visual Regression Baseline:** chụp ảnh 4 form trước/sau mỗi phase lớn, lưu theo viewport và trạng thái (empty/search open/has data/completed). Nếu phase có modal/popup liên quan thì chụp luôn trạng thái đó.
- **11.3 Rollback Procedure:** backup trước Phase 1, 6, 7.1, 8.1, 9.1, 10.1; restore nếu lỗi nghiêm trọng.
- **11.4 Handoff Template:** ghi lại file đã sửa, component cũ chưa xóa, lỗi ngoài scope, build status.

**Checklist baseline riêng cho từng sub-phase lớn:**
- [ ] Chụp đủ 4 form mục tiêu theo viewport desktop/tablet/mobile.
- [ ] Có ảnh baseline cho trạng thái empty/search open/data-filled.
- [ ] Nếu sub-phase chạm `LotExpiryPopover` hoặc `DisposalLotSelector`, chụp thêm popup/selector đang mở.
- [ ] So sánh ảnh trước/sau để phát hiện lệch spacing, border, overflow, sticky header.
- [ ] Chỉ khóa phase khi baseline không có diff ngoài chủ đích.
+
+**Checklist API contract riêng trước khi code:**
+- [ ] Mỗi component mới phải có props/interface được mô tả rõ trong plan trước khi triển khai.
+- [ ] `VoucherProductDropdown` phải chốt mode nào, props nào, callback nào từ đầu; nếu thiếu prop phải cập nhật plan trước khi code.
+- [ ] `VoucherTableRow` phải chốt rõ render strategy (`children` hoặc `renderCells`) trước khi code để không phải thêm prop bất ngờ sau này.
+- [ ] Không thêm prop public mới vào `VoucherFormLayout`, `VoucherButton`, `VoucherInput`, `VoucherField`, `VoucherTable`, `VoucherTableRow`, `VoucherSearch`, `VoucherProductDropdown`, `VoucherTotals` nếu chưa cập nhật plan.
+- [ ] Nếu phát hiện thiếu prop/mode trong lúc code, dừng ngay, cập nhật plan/sub-phase detail, rồi mới tiếp tục.
+- [ ] Mọi thay đổi API sau khi code đã bắt đầu phải có lý do, tác động, và phase cập nhật rõ ràng.
### 5.13. Tham chiếu Implementation Guardrails trong master plan

### 5.13. Tham chiếu Implementation Guardrails trong master plan

---

## 6. Kế hoạch thực hiện đề xuất

| Thứ tự | Sub-phase | Lý do ưu tiên |
|--------|-----------|---------------|
| 1 | 0.1 - 0.4 | Audit trước để hiểu rõ scope |
| 2 | 1.0 | Tạo foundation |
| 3 | 2.0 | Tạo core controls |
| 4 | 3.0 | Tạo data components |
| 5 | 4.0 | Tạo layout sub-components |
| 6 | 5.0 | Tạo overlays (tùy chọn / delay) |
| 7 | 6.0 | Pilot trên màn đơn giản nhất |
| 8 | 7.1 - 7.4 | Màn phức tạp nhất, chia 4 sub |
| 9 | 8.1 - 8.3 | Màn kiểm kê, chia 3 sub |
| 10 | 9.1 - 9.3 | Màn đổi hàng NCC, chia 3 sub |
| 11 | 10.1a - 10.4b | Cleanup & verification, chia 6+2 sub |

---

## 7. Giải thích các số liệu ước tính

- **Bytes** được đo từ filesystem thực tế bằng PowerShell `Get-ChildItem`.
- **Tokens** được ước tính bằng `bytes / 3` (bảo thủ cho tiếng Việt + JSX).
- **Ngưỡng an toàn** là 400K bytes cho tổng file code trong 1 sub-phase, giữ lại buffer cho prompt, lịch sử, tool output.
- Các sub-phase có bytes >300K đã được đánh dấu "gần ngưỡng" và phải đọc cẩn thận, tránh đọc thêm file không cần thiết.

---

## 8. Các điều chỉnh cần thiết trước khi thực hiện plan

Trước khi bắt đầu Phase 1, cần thực hiện các bước sau:

1. **Xác nhận dead code thực tế**
   - `ImportFormLayout.tsx` / `.css`: kiểm tra xem còn tồn tại không.
   - `DisposalFormLayout.tsx` / `.css`: kiểm tra xem còn tồn tại không.
   - `CountFormLayout.tsx`: xác nhận vẫn đang được import trong `pages/InventoryCount.tsx`.
   - `CountFormLayout.css`: kiểm tra xem tồn tại không.
   - `DisposalProductSearch.css`: **không tồn tại** (chỉ có `.tsx`).
   - `DisposalDetailModal.tsx` / `.css`: **đang dùng** trong `pages/Disposals.tsx` — ngoài scope, không đụng.
   - `DisposalLotSelector.tsx` / `.css`: **đang dùng** trong `DisposalItemRow.tsx` — phải giữ và nhúng lại.

2. **Định nghĩa props API trước khi code**
   - Ghi chú trong `components/voucher-form/README.md` hoặc `index.ts`:
     - `VoucherFormLayoutProps` giữ nguyên interface hiện tại.
     - `VoucherButtonProps` extends native button, có `variant`, `size`, `fullWidth`, `loading`, `icon`, `className`, `title`, `aria-label`.
     - `VoucherInputProps` extends native input, có `size`, `fullWidth`, `prefixIcon`, `suffixIcon`, `error`, `className`.
     - `VoucherFieldProps` giữ composition `label`, `error`, `hint`, `children`.
     - `VoucherTableProps` tối thiểu hỗ trợ `children` và `className`.
     - `VoucherTableRowProps` hỗ trợ `children` hoặc `renderCells`, `selected`, `onClick`, `className` để nhúng `DisposalLotSelector` / `LotExpiryPopover`.
     - `VoucherProductDropdownProps` có 2 mode: `client` (`products`, `searchValue`) và `server` (`results`) để tương thích với các search dropdown hiện tại.
     - `VoucherSearchProps` cần `value`, `onChange`, `placeholder`, `slot`, `loading`, `disabled`, `className`.

3. **Xác định rõ components cần tạo / không cần tạo**
   - Tạo: layout, controls, section, button, table, row, totals, search shell, product dropdown, **add button**.
   - Không tạo: pagination, status badge, dropdown, context menu, popover (trừ khi delay).
   - **Không thay thế**: `TextInput`, `ActionButton` (toàn cục, 9 page dùng), `DisposalDetailModal`, `DisposalLotSelector`, `LotExpiryPopover`.

4. **Backup project**
   - Vì không có git, backup toàn bộ folder trước Phase 1.

5. **Chuẩn bị test plan**
   - 4 flow nghiệp vụ.
   - Keyboard navigation trong search dropdown.
   - **Chọn lô cho xuất hủy hàng hết hạn** (verify `DisposalLotSelector` vẫn hoạt động sau Phase 6).
   - **Nhập lô/HSD cho phiếu nhập** (verify `LotExpiryPopover` vẫn hoạt động sau Phase 7).
   - Responsive desktop/tablet/mobile.

6. **Xem trước Component Migration Strategy Matrix**
   - Xem master plan **Section 4.4** để phân loại từng component cũ: UI-only, UI+logic nhẹ, UI+logic, giữ nguyên.
   - Dùng ma trận này để quyết định xóa / refactor / giữ trong từng sub-phase.

7. **Xem trước Implementation Guardrails**
   - Xem master plan **Section 11** để chuẩn bị Business Logic Protection Checklist, CSS Cleanup Audit Checklist, Visual Regression Baseline, Rollback Procedure, Handoff Template.
   - Checklist tối thiểu phải khóa: `TotalsSection` logic ở `pages/ImportGoods.tsx`, `InventoryCount` search behavior, `SupplierSection` combobox state, `DisposalItemRow` / `DisposalLotSelector`, `ImportItemRow` line total, `SupplierExchanges` wizard, `DisposalDetailModal` ngoài scope, `LotExpiryPopover` giữ nguyên nếu chưa thay`.
   - Trước khi xóa CSS phải grep xác nhận không còn import; giữ list-view CSS và CSS của `DisposalDetailModal` / `DisposalLotSelector` / `LotExpiryPopover` / `CountFormLayout.tsx`.
   - Visual baseline cần lưu theo viewport, cùng data/state, chỉ cập nhật lại khi UI thật sự thay đổi; phase cleanup import/CSS nếu không đổi visual thì chỉ verify nhanh.
   - Rollback khi lỗi UI phải restore toàn bộ phase, rồi chạy lại lint/build trước khi tiếp tục.

---

*File này được tạo tự động để giúp chia nhỏ PLAN_A_VoucherFormComponentSystem_Master.md thành các sub-phase vừa với context limit 250K tokens.*
