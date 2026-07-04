#!/usr/bin/env python3
"""Update PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md
to split oversized sub-phases that could exceed 250K context."""
from pathlib import Path

path = Path(r'c:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\docs\plans\voucher-form-component-system\PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md')
text = path.read_text(encoding='utf-8')

# ===== PATCH 1: Update summary table Phase 7-10 split counts =====
text = text.replace(
    "| **Phase 7** | Rollout ImportGoods | ~300K+ | ~100K+ | **CÓ** | Chia 3 sub-phase |",
    "| **Phase 7** | Rollout ImportGoods | ~300K+ | ~100K+ | **CÓ** | Chia 4 sub-phase |",
    1
)
text = text.replace(
    "| **Phase 8** | Rollout InventoryCount | ~230K | ~77K | Gần ngưỡng | Chia 2 sub-phase |",
    "| **Phase 8** | Rollout InventoryCount | ~230K | ~77K | Gần ngưỡng | Chia 3 sub-phase |",
    1
)
text = text.replace(
    "| **Phase 9** | Rollout SupplierExchanges | ~180K | ~60K | Gần ngưỡng | Chia 2 sub-phase |",
    "| **Phase 9** | Rollout SupplierExchanges | ~180K | ~60K | Gần ngưỡng | Chia 3 sub-phase |",
    1
)
text = text.replace(
    "| **Phase 10** | Cleanup & Verification | ~600K+ | ~200K+ | **CÓ** | Chia 4 sub-phase |",
    "| **Phase 10** | Cleanup & Verification | ~600K+ | ~200K+ | **CÓ** | Chia 6 sub-phase |",
    1
)

# ===== PATCH 2: Phase 7 header =====
text = text.replace(
    "### 3.8 Phase 7 — Rollout: ImportGoods (chia 3 sub-phase)",
    "### 3.8 Phase 7 — Rollout: ImportGoods (chia 4 sub-phase)",
    1
)

# ===== PATCH 3: Phase 7.1 - remove pages/ImportGoods.tsx from "Files cần đọc", add layout baseline =====
old_71 = """#### Phase 7.1 — ImportGoods Sidebar Refactor
**Mục tiêu:** Thay thế các sidebar sections bằng Voucher system trước.

**Files cần đọc:**
- Phases 1-4 components (~100K) (Phase 5 tùy chọn)
- `components/import-goods/ImportSidebar/SupplierSection.tsx` + `.css` (~13K)
- `components/import-goods/ImportSidebar/ReceiptInfoSection.tsx` + `.css` (~3.5K)
- `components/import-goods/ImportSidebar/TotalsSection.tsx` + `.css` (~5.7K)
- `components/import-goods/ImportSidebar/NoteSection.tsx` (~1.5K)
- `components/import-goods/ImportSidebar/ActionFooter.tsx` + `.css` (~3.1K)
- `pages/ImportGoods.tsx` (phần JSX sử dụng sidebar) (~78K)
- `pages/ImportGoods.css` (~22K)

**Files cần tạo/sửa:**
- Tạo wrapper components nếu cần
- Sửa `pages/ImportGoods.tsx` để dùng `VoucherSection`, `VoucherField`, `VoucherInput`, `VoucherSelect`, `VoucherTextarea`, `VoucherActions`, `VoucherButton`, `VoucherTotals`
- Cập nhật `pages/ImportGoods.css` xóa CSS sidebar create form

**Tổng bytes:** ~227K | **Tokens:** ~76K

**Acceptance criteria:**
- [ ] Sidebar Nhập hàng dùng toàn bộ components từ `components/voucher-form/`.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Tạo/sửa/hoàn thành phiếu nhập vẫn đúng (tính tiền, công nợ, NCC).

**Cấm kỵ:** Không thay đổi logic tính tiền, công nợ, API.

---"""

new_71 = """#### Phase 7.1 — ImportGoods Sidebar Refactor
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

---"""

text = text.replace(old_71, new_71, 1)

# ===== PATCH 4: Remove old Phase 7.2a+7.2b+7.3 and replace with new split =====
# First, remove the old 7.2a through end of 7.3
old_72a_to_73_end = """#### Phase 7.2a — ImportGoods Main Area: Search + Table Shell
**Mục tiêu:** Thay thế search shell và table frame bằng Voucher system, giữ nguyên lot popover và item-row business logic.

**Files cần đọc:**
- Phases 1-4 components (~100K)
- `components/import-goods/ImportProductSearch.tsx` + `.css` (~11K)
- `components/import-goods/ImportItemsTable.tsx` + `.css` (~7K)
- `pages/ImportGoods.tsx` (phần JSX main area) (~78K)
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
- Phases 1-4 components (~100K)
- `components/import-goods/ImportItemRow.tsx` + `.css` (~9K)
- `components/import-goods/LotExpiryPopover.tsx` + `.css` (~7K)
- `pages/ImportGoods.tsx` (phần JSX item rows) (~78K)
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

#### Phase 7.3 — ImportGoods Page Integration & Dead Code Cleanup
**Mục tiêu:** Tích hợp hoàn chỉnh, dọn CSS.

**Files cần đọc:**
- `pages/ImportGoods.tsx` (~78K)
- `pages/ImportGoods.css` (~22K)
- `components/voucher-form/*` đã tạo (~100K)

**Files cần sửa/xóa:**
- `pages/ImportGoods.tsx`: final pass, imports cleanup
- `pages/ImportGoods.css`: giữ CSS cho list view, xóa CSS create form
- **Không xóa** `components/import-goods/ImportFormLayout.tsx` / `.css` vì đã không còn tồn tại.

**Tổng bytes:** ~200K | **Tokens:** ~67K

**Acceptance criteria:**
- [ ] `pages/ImportGoods.tsx` dùng toàn bộ components từ `components/voucher-form/`.
- [ ] Không còn import components cũ trong ImportGoods.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Tạo/sửa/hoàn thành phiếu nhập hoạt động đúng.

**Cấm kỵ:** Không thay đổi business logic.

---"""

new_72a_to_73_end = """#### Phase 7.2a — ImportGoods Main Area: Search + Table Shell
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

---"""

text = text.replace(old_72a_to_73_end, new_72a_to_73_end, 1)

# ===== PATCH 5: Phase 8 - split into 3 sub-phases =====
text = text.replace(
    "### 3.9 Phase 8 — Rollout: InventoryCount (chia 2 sub-phase)",
    "### 3.9 Phase 8 — Rollout: InventoryCount (chia 3 sub-phase)",
    1
)

old_8 = """#### Phase 8.1 — InventoryCount Form View Refactor
**Mục tiêu:** Refactor `CountFormLayout`, thay `CountItemsTable`, `ProductSearchDropdown`, `CountSidebar` bằng Voucher system.

**Files cần đọc:**
- Phases 1-4 components (~100K) (Phase 5 tùy chọn)
- `components/inventory-count/CountFormLayout.tsx` (~3.5K)
- `components/inventory-count/CountItemsTable.tsx` + `.css` (~20K)
- `components/inventory-count/ProductSearchDropdown.tsx` + `.css` (~5K)
- `components/inventory-count/CountSidebar/CountInfoSection.tsx` + `.css` (~4.5K)
- `components/inventory-count/CountSidebar/CountSummary.tsx` + `.css` (~2.3K)
- `components/inventory-count/CountSidebar/ExcelImportSection.tsx` + `.css` (~4.4K)
- `pages/InventoryCount.tsx` (phần form view) (~60K)
- `pages/InventoryCount.css` (~31K)

**Files cần sửa:**
- `components/inventory-count/CountFormLayout.tsx` (refactor bên trong, giữ file)
- `pages/InventoryCount.tsx` (form view JSX)
- `pages/InventoryCount.css` (xóa CSS form view)

**Lưu ý quan trọng:**
- `CountFormLayout.tsx` vẫn giữ lại, chỉ thay nội dung bên trong bằng `VoucherFormLayout` + `VoucherSection` + `VoucherField` + `VoucherTotals`.
- `ProductSearchDropdown` thay bằng `VoucherSearch` + `VoucherProductDropdown`.
- `CountItemsTable` có logic hiển thị chênh lệch tăng/giảm — cần giữ lại trong render row.

**Tổng bytes:** ~230K | **Tokens:** ~77K

**Acceptance criteria:**
- [ ] Form view Kiểm kê dùng `VoucherFormLayout`, `VoucherSearch`, `VoucherProductDropdown`, `VoucherTable`, `VoucherSection`, `VoucherField`, `VoucherTotals`.
- [ ] `CountFormLayout.tsx` vẫn tồn tại sau refactor.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Tạo/lưu nháp/hoàn thành phiếu kiểm kê hoạt động đúng.
- [ ] Chênh lệch hiển thị đúng.

**Cấm kỵ:** Không thay đổi logic tính chênh lệch, Excel import, scanner, API.

---

#### Phase 8.2 — InventoryCount List View & Cleanup
**Mục tiêu:** Đảm bảo list view đồng nhất, dọn CSS, xóa file cũ sau khi xác nhận không còn import.

**Files cần đọc:**
- `pages/InventoryCount.tsx` (~60K)
- `pages/InventoryCount.css` (~31K)
- `components/inventory-count/CountFormLayout.tsx` (~3.5K)
- `components/voucher-form/*` (~100K)

**Files cần sửa/xóa:**
- `pages/InventoryCount.tsx`: final pass, cleanup imports
- `pages/InventoryCount.css`: giữ CSS list view, xóa CSS form view
- Xóa `components/inventory-count/CountFormLayout.css` nếu còn
- Xóa CSS của `CountItemsTable`, `ProductSearchDropdown` nếu không còn dùng
- **Không xóa** `components/inventory-count/CountFormLayout.tsx` vì vẫn đang được import.

**Tổng bytes:** ~195K | **Tokens:** ~65K

**Acceptance criteria:**
- [ ] List view DataGrid vẫn hoạt động đúng.
- [ ] Không còn import components cũ trong InventoryCount.
- [ ] `CountFormLayout.tsx` vẫn tồn tại hoặc đã được refactor an toàn.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không thay đổi DataGrid toàn cục.

---"""

new_8 = """#### Phase 8.1 — InventoryCount Form View Refactor
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

---"""

text = text.replace(old_8, new_8, 1)

# ===== PATCH 6: Phase 9 - split into 3 sub-phases =====
text = text.replace(
    "### 3.10 Phase 9 — Rollout: SupplierExchanges (chia 2 sub-phase)",
    "### 3.10 Phase 9 — Rollout: SupplierExchanges (chia 3 sub-phase)",
    1
)

old_9 = """#### Phase 9.1 — SupplierExchanges Create Form Refactor
**Mục tiêu:** Tách/refactor phần create form, thay UI bằng Voucher system. Giữ cấu trúc wizard.

**Files cần đọc:**
- Phases 1-4 components (~100K) (Phase 5 tùy chọn)
- `pages/SupplierExchanges.tsx` (phần create form) (~67K)
- `pages/SupplierExchanges.css` (~31K)

**Files cần tạo/sửa:**
- Tạo `components/supplier-exchanges/ExchangeForm.tsx` (tùy chọn)
- Sửa `pages/SupplierExchanges.tsx` để dùng `VoucherFormLayout`, `VoucherSearch`, `VoucherProductDropdown`, `VoucherSection`, `VoucherField`, `VoucherButton`, `VoucherBanner`, `VoucherEmpty`
- Cập nhật `pages/SupplierExchanges.css` xóa CSS create form

**Lưu ý quan trọng:**
- Không dùng `VoucherTable` / `VoucherTableRow` — màn này là wizard, không phải table.
- Giữ nguyên cấu trúc: lot selection grid, receipt selection list, exchange item cards.
- Chỉ thay input/button/section styling bằng Voucher components.

**Tổng bytes:** ~198K | **Tokens:** ~66K

**Acceptance criteria:**
- [ ] Phần create form dùng components từ `components/voucher-form/` (không bao gồm table).
- [ ] Cấu trúc wizard (lot grid, receipt list, item cards) vẫn hoạt động đúng.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Chọn NCC, phiếu nhập gốc, lô, hoàn thành đúng.

**Cấm kỵ:** Không thay đổi logic đổi hàng NCC, API. Không ép table template.

---

#### Phase 9.2 — SupplierExchanges List View & Cleanup
**Mục tiêu:** Đảm bảo list view đồng nhất, cleanup CSS và imports.

**Files cần đọc:**
- `pages/SupplierExchanges.tsx` (~67K)
- `pages/SupplierExchanges.css` (~31K)
- `components/voucher-form/*` (~100K)

**Files cần sửa:**
- `pages/SupplierExchanges.tsx`: final pass, cleanup imports
- `pages/SupplierExchanges.css`: giữ CSS list view, xóa CSS create form

**Tổng bytes:** ~198K | **Tokens:** ~66K

**Acceptance criteria:**
- [ ] List view phiếu đổi trả vẫn hoạt động đúng.
- [ ] Không còn import components cũ trong SupplierExchanges.
- [ ] Wizard create form vẫn hoạt động đúng.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không thay đổi DataGrid toàn cục.

---"""

new_9 = """#### Phase 9.1 — SupplierExchanges Create Form Refactor
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

---"""

text = text.replace(old_9, new_9, 1)

# ===== PATCH 7: Phase 10 - split into 6 sub-phases =====
text = text.replace(
    "### 3.11 Phase 10 — Cleanup & Verification (chia 4 sub-phase)",
    "### 3.11 Phase 10 — Cleanup & Verification (chia 6 sub-phase)",
    1
)

# Phase 10.1a - reduce bytes estimate
old_10_1a = """#### Phase 10.1a — Dead Code Cleanup: import-goods
**Mục tiêu:** Xóa CSS/components cũ không còn dùng trong Nhập hàng.

**Files cần đọc:**
- `pages/ImportGoods.tsx`, `pages/ImportGoods.css`
- `components/import-goods/*`
- `components/voucher-form/*`

**Tổng bytes:** ~150K | **Tokens:** ~50K

**Acceptance criteria:**
- [ ] Grep không còn import `ImportProductSearch|ImportItemsTable|ImportItemRow`.
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] `ImportFormLayout` không còn tồn tại hoặc đã được xác nhận không còn import.
- [ ] `LotExpiryPopover.tsx` / `.css` vẫn được giữ nguyên.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---"""

new_10_1a = """#### Phase 10.1a — Dead Code Cleanup: import-goods
**Mục tiêu:** Xóa CSS/components cũ không còn dùng trong Nhập hàng.

**Files cần đọc:**
- `pages/ImportGoods.tsx` (grep import)
- `components/import-goods/*` (trừ `LotExpiryPopover`)
- `components/voucher-form/*`

**Tổng bytes:** ~120K | **Tokens:** ~40K

**Acceptance criteria:**
- [ ] Grep không còn import `ImportProductSearch|ImportItemsTable|ImportItemRow`.
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] `LotExpiryPopover.tsx` / `.css` vẫn được giữ nguyên.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---"""

text = text.replace(old_10_1a, new_10_1a, 1)

# Phase 10.1b - split into 10.1b + 10.1c
old_10_1b = """#### Phase 10.1b — Dead Code Cleanup: disposal-form
**Mục tiêu:** Xóa CSS/components cũ không còn dùng trong Xuất hủy, nhưng giữ file ngoài scope.

**Files cần đọc:**
- `pages/DisposalForm.tsx`, `pages/Disposals.css`
- `components/disposal-form/*`
- `components/voucher-form/*`

**Tổng bytes:** ~130K | **Tokens:** ~43K

**Acceptance criteria:**
- [ ] Grep không còn import `DisposalProductSearch|DisposalItemsTable|DisposalItemRow`.
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] `DisposalFormLayout` không còn tồn tại hoặc đã được xác nhận không còn import.
- [ ] **KHÔNG XÓA** `DisposalDetailModal.tsx` / `.css` — thuộc list view `Disposals.tsx`, ngoài scope.
- [ ] **KHÔNG XÓA** `DisposalLotSelector.tsx` / `.css` — vẫn dùng trong `VoucherTableRow` của DisposalForm.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---"""

new_10_1b = """#### Phase 10.1b — Dead Code Cleanup: disposal-form
**Mục tiêu:** Xóa CSS/components cũ không còn dùng trong Xuất hủy, nhưng giữ file ngoài scope.

**Files cần đọc:**
- `pages/DisposalForm.tsx`, `pages/Disposals.css`
- `components/disposal-form/*`
- `components/voucher-form/*`

**Tổng bytes:** ~95K | **Tokens:** ~32K

**Acceptance criteria:**
- [ ] Grep không còn import `DisposalProductSearch|DisposalItemsTable|DisposalItemRow`.
- [ ] **KHÔNG XÓA** `DisposalDetailModal.tsx` / `.css` — thuộc list view `Disposals.tsx`, ngoài scope.
- [ ] **KHÔNG XÓA** `DisposalLotSelector.tsx` / `.css` — vẫn dùng trong `VoucherTableRow` của DisposalForm.
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---"""

text = text.replace(old_10_1b, new_10_1b, 1)

# Phase 10.2a - reduce bytes
old_10_2a = """#### Phase 10.2a — Dead Code Cleanup: inventory-count
**Mục tiêu:** Xóa CSS/components cũ không còn dùng trong Kiểm kê.

**Files cần đọc:**
- `pages/InventoryCount.tsx`, `pages/InventoryCount.css`
- `components/inventory-count/*`
- `components/voucher-form/*`

**Tổng bytes:** ~170K | **Tokens:** ~57K

**Acceptance criteria:**
- [ ] Grep không còn import `ProductSearchDropdown|CountItemsTable`.
- [ ] `CountFormLayout` vẫn được import (vì vẫn dùng) hoặc đã refactor hoàn toàn vào page.
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] Xóa demo page `components/voucher-form/__demo.tsx`.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---"""

new_10_2a = """#### Phase 10.2a — Dead Code Cleanup: inventory-count
**Mục tiêu:** Xóa CSS/components cũ không còn dùng trong Kiểm kê.

**Files cần đọc:**
- `pages/InventoryCount.tsx` (grep import)
- `pages/InventoryCount.css`
- `components/inventory-count/*`
- `components/voucher-form/*`

**Tổng bytes:** ~120K | **Tokens:** ~40K

**Acceptance criteria:**
- [ ] Grep không còn import `ProductSearchDropdown|CountItemsTable`.
- [ ] `CountFormLayout` vẫn được import (vì vẫn dùng) hoặc đã refactor hoàn toàn vào page.
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] Xóa demo page `components/voucher-form/__demo.tsx`.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---"""

text = text.replace(old_10_2a, new_10_2a, 1)

# Phase 10.2b - new: supplier-exchanges cleanup
old_10_2b = """#### Phase 10.2b — Dead Code Cleanup: supplier-exchanges
**Mục tiêu:** Xóa CSS/components cũ không còn dùng trong Đổi hàng NCC.

**Files cần đọc:**
- `pages/SupplierExchanges.tsx`, `pages/SupplierExchanges.css`
- `components/supplier-exchanges/*` (nếu có)
- `components/voucher-form/*`

**Tổng bytes:** ~130K | **Tokens:** ~43K

**Acceptance criteria:**
- [ ] Grep không còn import các component cũ chỉ phục vụ create form nếu đã thay thế.
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---"""

new_10_2b = """#### Phase 10.2b — Dead Code Cleanup: supplier-exchanges
**Mục tiêu:** Xóa CSS/components cũ không còn dùng trong Đổi hàng NCC.

**Files cần đọc:**
- `pages/SupplierExchanges.tsx` (grep import)
- `pages/SupplierExchanges.css`
- `components/supplier-exchanges/*` (nếu có)
- `components/voucher-form/*`

**Tổng bytes:** ~100K | **Tokens:** ~33K

**Acceptance criteria:**
- [ ] Grep không còn import các component cũ chỉ phục vụ create form nếu đã thay thế.
- [ ] Xóa file CSS/components cũ nếu không còn import.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---"""

text = text.replace(old_10_2b, new_10_2b, 1)

# Phase 10.4 - split into 10.4a + 10.4b
old_10_4 = """#### Phase 10.4 — Manual Test & Responsive
**Mục tiêu:** Manual test 4 flow nghiệp vụ + responsive desktop/tablet/mobile + keyboard navigation.

**Files cần tham khảo:**
- `pages/ImportGoods.tsx`
- `pages/InventoryCount.tsx`
- `pages/DisposalForm.tsx`
- `pages/SupplierExchanges.tsx`
- `components/voucher-form/*`

**Tổng bytes:** ~240K | **Tokens:** ~80K

**Acceptance criteria:**
- [ ] Tạo phiếu nhập → hoàn thành.
- [ ] Tạo phiếu kiểm kê → lưu nháp → hoàn thành.
- [ ] Tạo phiếu xuất hủy → hoàn thành.
- [ ] Tạo phiếu đổi hàng NCC → hoàn thành.
- [ ] **Xuất hủy hàng hết hạn**: chọn lô qua `DisposalLotSelector` → SL tự khóa theo lô → hoàn thành đúng.
- [ ] **Nhập hàng có lô/HSD**: nhập lô qua `LotExpiryPopover` → hoàn thành đúng.
- [ ] **List view Disposals.tsx**: mở detail modal (`DisposalDetailModal`) vẫn hoạt động (không bị vỡ do refactor).
- [ ] Keyboard navigation trong search dropdown (Nhập hàng / Xuất hủy / Kiểm kê) vẫn hoạt động: ↑ ↓ Enter Esc.
- [ ] Responsive desktop (>1024px) OK.
- [ ] Responsive tablet (768–1023px) OK.
- [ ] Responsive mobile (<768px) OK.

**Cấm kỵ:** Không sửa code ngoài fix lỗi UI nhỏ.
"""

new_10_4 = """#### Phase 10.4a — Manual Test: ImportGoods + DisposalForm
**Mục tiêu:** Test 2 flow đầu tiên và kiểm tra navigation/search.

**Tổng bytes:** ~120K | **Tokens:** ~40K

**Acceptance criteria:**
- [ ] Tạo phiếu nhập → hoàn thành.
- [ ] Tạo phiếu xuất hủy → hoàn thành.
- [ ] **Xuất hủy hàng hết hạn**: chọn lô qua `DisposalLotSelector` → SL tự khóa theo lô.
- [ ] **Nhập hàng có lô/HSD**: nhập lô qua `LotExpiryPopover` → hoàn thành đúng.
- [ ] Keyboard navigation trong search dropdown (Nhập hàng / Xuất hủy) vẫn hoạt động: ↑ ↓ Enter Esc.

---

#### Phase 10.4b — Manual Test: InventoryCount + SupplierExchanges + Responsive
**Mục tiêu:** Test 2 flow còn lại và responsive.

**Tổng bytes:** ~120K | **Tokens:** ~40K

**Acceptance criteria:**
- [ ] Tạo phiếu kiểm kê → lưu nháp → hoàn thành.
- [ ] Tạo phiếu đổi hàng NCC → hoàn thành.
- [ ] **List view Disposals.tsx**: mở detail modal (`DisposalDetailModal`) vẫn hoạt động (không bị vỡ do refactor).
- [ ] Keyboard navigation trong search dropdown (Kiểm kê) vẫn hoạt động.
- [ ] Responsive desktop (>1024px) OK.
- [ ] Responsive tablet (768–1023px) OK.
- [ ] Responsive mobile (<768px) OK.

**Cấm kỵ:** Không sửa code ngoài fix lỗi UI nhỏ.
"""

text = text.replace(old_10_4, new_10_4, 1)

# ===== PATCH 8: Update summary table (Section 4) =====
old_summary = """| Phase gốc | Sub-phase mới | Tên | Bytes ước tính | Tokens ước tính | Vượt 250K? |
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
| 7 | 7.1 | ImportGoods Sidebar Refactor | ~227K | ~76K | Không |
| 7 | 7.2a | ImportGoods Main Area: Search + Table Shell | ~196K | ~65K | Không |
| 7 | 7.2b | ImportGoods Item Rows + Lot Handling Cleanup | ~166K | ~55K | Không |
| 7 | 7.3 | ImportGoods Page Integration | ~200K | ~67K | Không |
| 8 | 8.1 | InventoryCount Form View Refactor | ~230K | ~77K | Không |
| 8 | 8.2 | InventoryCount List View & Cleanup | ~195K | ~65K | Không |
| 9 | 9.1 | SupplierExchanges Create Form Refactor | ~198K | ~66K | Không |
| 9 | 9.2 | SupplierExchanges List View & Cleanup | ~198K | ~66K | Không |
| 10 | 10.1a | Dead Code Cleanup: import-goods | ~150K | ~50K | Không |
| 10 | 10.1b | Dead Code Cleanup: disposal-form | ~130K | ~43K | Không |
| 10 | 10.2a | Dead Code Cleanup: inventory-count | ~170K | ~57K | Không |
| 10 | 10.2b | Dead Code Cleanup: supplier-exchanges | ~130K | ~43K | Không |
| 10 | 10.3 | Build Verification & Type Fixes | ~50K-100K | ~17K-33K | Không |
| 10 | 10.4 | Manual Test & Responsive | ~240K | ~80K | Không |"""

new_summary = """| Phase gốc | Sub-phase mới | Tên | Bytes ước tính | Tokens ước tính | Vượt 250K? |
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
| 10 | 10.4b | Manual Test: InventoryCount + SupplierExchanges + Responsive | ~120K | ~40K | Không |"""

text = text.replace(old_summary, new_summary, 1)

# ===== PATCH 9: Update implementation plan (Section 6) =====
old_plan = """| Thứ tự | Sub-phase | Lý do ưu tiên |
|--------|-----------|---------------|
| 1 | 0.1 - 0.4 | Audit trước để hiểu rõ scope |
| 2 | 1.0 | Tạo foundation |
| 3 | 2.0 | Tạo core controls |
| 4 | 3.0 | Tạo data components |
| 5 | 4.0 | Tạo layout sub-components |
| 6 | 5.0 | Tạo overlays (tùy chọn / delay) |
| 7 | 6.0 | Pilot trên màn đơn giản nhất |
| 8 | 7.1 - 7.3 | Màn phức tạp nhất, chia 3 sub |
| 9 | 8.1 - 8.2 | Màn kiểm kê, chia 2 sub |
| 10 | 9.1 - 9.2 | Màn đổi hàng NCC, chia 2 sub |
| 11 | 10.1 - 10.4 | Cleanup & verification |"""

new_plan = """| Thứ tự | Sub-phase | Lý do ưu tiên |
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
| 11 | 10.1a - 10.4b | Cleanup & verification, chia 6+2 sub |"""

text = text.replace(old_plan, new_plan, 1)

# ===== PATCH 10: Update version =====
text = text.replace(
    "> **Version:** 1.3",
    "> **Version:** 1.4",
    1
)
text = text.replace(
    "> **Revision:** 2026-07-03 (v1.3) — Sửa lỗi duplicate rows trong bảng tổng hợp; đồng bộ với master plan v1.3 (Component Migration Strategy Matrix, API đầy đủ, import path, guardrails).",
    "> **Revision:** 2026-07-03 (v1.4) — Tách lại các sub-phase vượt/ngưỡng 250K context: Phase 7 chia 4, Phase 8 chia 3, Phase 9 chia 3, Phase 10 chia 8. Mỗi sub-phase đảm bảo <200K bytes file cần load.",
    1
)

path.write_text(text, encoding='utf-8')
print("OK - Plan updated to v1.4")
