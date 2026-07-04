# Phase 0 — Combined Audit Report: 4 Voucher Screens (0.1–0.4)

> **Project:** VietSales Pro v7
> **Date:** 2026-07-03
> **Scope:** Tổng hợp kết quả audit 4 màn phiếu: ImportGoods, InventoryCount, SupplierExchanges, DisposalForm.
> **Rule:** Chỉ audit, không sửa code, không chạy lint/build.
> **Source plan:** `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`

---

## 1. Sub-audit reports

| Sub-phase | Màn hình | File report |
|-----------|----------|-------------|
| Phase 0.1 | ImportGoods | `audits/AUDIT_PHASE_0_1_IMPORT_GOODS.md` |
| Phase 0.2 | InventoryCount | `audits/AUDIT_PHASE_0_2_INVENTORY_COUNT.md` |
| Phase 0.3 | SupplierExchanges | `audits/AUDIT_PHASE_0_3_SupplierExchanges.md` |
| Phase 0.4 | DisposalForm + Tổng hợp + Backup | `audits/AUDIT_PHASE_0_4_DISPOSAL_FORM.md` |

---

## 2. Tóm tắt đặc thù từng màn

| Tiêu chí | ImportGoods | InventoryCount | DisposalForm | SupplierExchanges |
|----------|-------------|----------------|--------------|-------------------|
| **Dạng form** | Table nhập liệu | Table + Scanner + Excel import | Table + Lot selector | Wizard card (không phải table) |
| **Dùng `VoucherFormLayout`** | Có | Có (qua `CountFormLayout`) | Có | Có (create view) |
| **Dùng `SectionBox`** | Có | Có | Có | Có |
| **Dùng `VoucherTable`/`Row` phù hợp** | Có | Có | Có | **Không** — dùng card wizard |
| **Lot selector** | Inline trong `ImportItemRow` | Không | `DisposalLotSelector` (phải giữ) | Grid chọn lô là flow chính |
| **Receipt reference** | Có | Không | Không | Bắt buộc |
| **Excel/scanner** | Không | Có | Không | Không |
| **Mức độ phức tạp** | Cao | Cao | **Thấp** (pilot tốt nhất) | Cao nhất (wizard) |

---

## 3. UI patterns chung cần tách thành Voucher Form System

| Shared Pattern | Xuất hiện ở màn | Đề xuất component |
|----------------|-----------------|-------------------|
| Header + Back + Title + Search | All 4 | `VoucherHeader`, `VoucherSearch` |
| Product search dropdown / autocomplete | ImportGoods, DisposalForm, InventoryCount, SupplierExchanges | `VoucherProductDropdown` (mode client/server) |
| Table with sticky header + footer totals | ImportGoods, InventoryCount, DisposalForm | `VoucherTable`, `VoucherTableFooter` |
| Table row inline edit | ImportGoods, InventoryCount, DisposalForm | `VoucherTableRow` |
| Quantity input | ImportGoods, InventoryCount, DisposalForm | `VoucherQuantityInput` / `VoucherInput` |
| Sidebar section card | All 4 | `VoucherSection` + `VoucherSectionHeader` |
| Label + input field stack | All 4 | `VoucherField`, `VoucherInput`, `VoucherSelect`, `VoucherTextarea` |
| Status badge | All 4 | `VoucherBadge` |
| Action buttons bottom | All 4 | `VoucherActions` / `VoucherButton` |
| Empty state | All 4 | `VoucherEmpty` |
| Summary row (label + value) | ImportGoods, InventoryCount, SupplierExchanges, DisposalForm | `VoucherSummaryRow` |
| Financial summary card | ImportGoods, SupplierExchanges, DisposalForm | `VoucherTotals` / `VoucherSummaryCard` |
| Currency / number formatting | All 4 | `VoucherCurrency`, `VoucherNumber` helpers |
| Modal overlay | ImportGoods (tạo NCC), SupplierExchanges (confirm) | `VoucherModal` / `VoucherConfirmDialog` |
| Page header + stat cards + filter bar | InventoryCount, SupplierExchanges | `VoucherPageHeader`, `VoucherStats`, `VoucherFilterGroup` |

---

## 4. Components đặc thù không ép vào VoucherTable

| Component | Màn | Lý do giữ |
|-----------|-----|-----------|
| `DisposalLotSelector` | DisposalForm | UX chọn lô/HSD đặc thù, nhúng vào `VoucherTableRow` |
| Lot selection grid | SupplierExchanges | Là flow chính của wizard, không phải table row |
| Receipt selection list | SupplierExchanges | Flow chính, chọn phiếu nhập gốc |
| Exchange item card | SupplierExchanges | Card accordion với 2 block lô trả/lô nhận |
| Excel import section | InventoryCount | Feature riêng, tách thành `VoucherExcelImport` nếu cần |
| Barcode scanner | InventoryCount | Integration riêng, không thuộc form core |

---

## 5. Dead code tổng hợp 4 màn

### 5.1. Files đã không còn tồn tại (không cần xử lý)

| File | Trạng thái |
|------|------------|
| `components/import-goods/ImportFormLayout.tsx` | ❌ Không tồn tại |
| `components/import-goods/ImportFormLayout.css` | ❌ Không tồn tại |
| `components/disposal-form/DisposalFormLayout.tsx` | ❌ Không tồn tại |
| `components/disposal-form/DisposalFormLayout.css` | ❌ Không tồn tại |
| `components/disposal-form/DisposalProductSearch.css` | ❌ Không tồn tại |
| `components/inventory-count/CountFormLayout.css` | ❌ Không tồn tại |

### 5.2. File vẫn tồn tại và cần giữ

| File | Lý do |
|------|-------|
| `components/inventory-count/CountFormLayout.tsx` | Đang import trong `pages/InventoryCount.tsx`; sẽ refactor path sang `components/voucher-form` trong Phase 1 |

### 5.3. Dead code trong từng màn

#### ImportGoods
- `components/import-goods/LotExpiryPopover.tsx` + `.css` — không được import.
- `.import-receipt-info-label` / `.import-receipt-info-icon` — không có element dùng.
- `updateItem`, `handleApplyFilters`, `products` prop, `importReceipts` prop, `isLoadingSuppliers`, `isLoadingStats`, `isLoadingProducts`, `contactPerson`, `dataGridBoxRef` — không dùng / không render UI.
- Feature flag `useNewDataGridImportGoods` — branch cũ có thể là dead.
- CSS `.ig-page-container--padded`, `.ig-page-mobile-list` / `.ig-page-mobile-card*`, `.ig-page-products__discount` — chưa thấy dùng trong TSX.

#### InventoryCount
- CSS `.inventory-count-page__filter-bar`, `.inventory-count-table__*` (V1), `.inventory-count-pagination` (V1) — chỉ dùng trong fallback.
- Custom table V1 + mobile card list — dead nếu DataGrid flag luôn true.
- `countPageSize` state, `countSearchTerm2`, `isCountFilterActive` logic — gần dead / confusing.

#### SupplierExchanges
- Create view inline trong page (~67K) — đề xuất tách `ExchangeForm.tsx`.
- CSS `.se-page-detail-*` — copy style `ImportGoods`, nên đổi về component chung.

#### DisposalForm
- `DISPOSAL_REASONS` constant duplicate giữa `DisposalForm.tsx` và `ReasonSection.tsx`.
- `parseQty` / `formatQty` duplicate pattern với Import/Count.
- Total stats duplicate giữa `DisposalForm.tsx` và `DisposalItemsTable.tsx`.

---

## 6. Quyết định thiết kế

### 6.1. Option A1 — Minimal Component System: XÁC NHẬN

| Tiêu chí | Quyết định |
|----------|------------|
| Không thêm dependencies mới | ✅ Đồng ý |
| Dùng design tokens hiện có | ✅ Đồng ý |
| Tái sử dụng `VoucherFormLayout` làm baseline | ✅ Đồng ý |
| Pilot màn đơn giản nhất trước: `DisposalForm` | ✅ Đồng ý (Phase 6) |
| `DisposalDetailModal` ngoài scope | ✅ Đồng ý |
| `DisposalLotSelector` giữ lại | ✅ Đồng ý |
| `SupplierExchanges` create flow không ép vào `VoucherTable` | ✅ Đồng ý — tách `ExchangeForm.tsx` nếu cần |
| `CountFormLayout` giữ lại | ✅ Đồng ý — chỉ cập nhật import path |

---

## 7. Xác nhận file layout

| File | Trạng thái | Hành động |
|------|------------|-----------|
| `components/import-goods/ImportFormLayout.tsx` / `.css` | ❌ Không tồn tại | Không cần xử lý |
| `components/disposal-form/DisposalFormLayout.tsx` / `.css` | ❌ Không tồn tại | Không cần xử lý |
| `components/disposal-form/DisposalProductSearch.css` | ❌ Không tồn tại | Không cần xử lý |
| `components/inventory-count/CountFormLayout.css` | ❌ Không tồn tại | Không cần xử lý |
| `components/inventory-count/CountFormLayout.tsx` | ✅ Tồn tại và đang import trong `pages/InventoryCount.tsx` | Giữ lại, refactor path sang `components/voucher-form` trong Phase 1 |

---

## 8. Backup project

| Mục | Giá trị |
|-----|---------|
| Backup path | `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase0_20260703_132420` |
| Backup command | `Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase0_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse` |

> Backup path sẽ được cập nhật sau khi chạy lệnh.

---

## 9. Recommended next steps

1. **Phase 1 — Foundation:** Tạo `components/voucher-form/` folder, di chuyển `VoucherFormLayout` + `SectionBox`, cập nhật import path trong 5 file.
2. **Phase 2 — Core Controls:** Tạo `VoucherButton`, `VoucherInput`, `VoucherTextarea`, `VoucherSelect`, `VoucherLabel`, `VoucherField`, `VoucherToggle`.
3. **Phase 3 — Data Components:** Tạo `VoucherSearch`, `VoucherProductDropdown`, `VoucherTable`, `VoucherTableRow`, `VoucherTableFooter`, `VoucherEmpty`, `VoucherTotals`, `VoucherBadge`.
4. **Phase 6 — Pilot DisposalForm:** Thay thế `DisposalProductSearch`, `DisposalItemsTable`, `DisposalItemRow`, sidebar sections bằng Voucher components; **giữ `DisposalLotSelector`**.
5. **Phase 7–9 — Rollout ImportGoods, InventoryCount, SupplierExchanges:** Áp dụng tương tự, chú ý đặc thù wizard của SupplierExchanges.
6. **Phase 10 — Cleanup:** Xóa dead code, CSS, feature flag fallback đã xác nhận.

---

## 10. Handoff summary

> **Phase 0 audit complete for all 4 voucher screens.**
> - Đã đọc và inventory UI/CSS của ImportGoods, InventoryCount, SupplierExchanges, DisposalForm.
> - Đã tổng hợp UI patterns chung, components đặc thù, và dead code.
> - Đã xác nhận Option A1 (Minimal Component System).
> - Đã xác nhận trạng thái file layout và scope `DisposalDetailModal`.
> - Project đã được backup (path sẽ cập nhật sau).
> - Sẵn sàng bắt đầu Phase 1 Foundation.

---

*Generated during Phase 0.4 session — 2026-07-03*
