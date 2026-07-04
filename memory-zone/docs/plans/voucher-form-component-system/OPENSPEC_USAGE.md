# Hướng dẫn sử dụng OpenSpec — Voucher Form Component System

> OpenSpec change: `voucher-form-component-system-plan-a`
> Schema: `voucher-plan`
> Source plan: `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master.md` and `PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`

## Cấu trúc OpenSpec cho plan này

```text
openspec/
├── changes/
│   └── voucher-form-component-system-plan-a/
│       ├── .openspec.yaml              # schema: voucher-plan
│       ├── proposal.md                 # intent, scope, impact
│       ├── specs/
│       │   └── voucher-form-component-system/
│       │       └── spec.md             # delta requirements
│       ├── design.md                   # decisions, risks, migration
│       ├── review.md                   # coverage, guardrails
│       ├── rollback.md                 # backup & restore
│       ├── tasks.md                    # detailed implementation checklist
│       └── handoff.md                  # summary for next phase
```

## Các lệnh CLI hữu ích

```powershell
# Kiểm tra trạng thái change
openspec status --change voucher-form-component-system-plan-a

# Validate toàn bộ
openspec validate --all --json

# Validate một change
openspec validate voucher-form-component-system-plan-a --json

# Liệt kê các change
openspec list

# Xem chi tiết change
openspec show voucher-form-component-system-plan-a
```

## Nguyên tắc chia chat

Mỗi chat chỉ làm **một sub-phase** hoặc **một nhóm sub-phase liền kề** nếu tổng code cần chạm < 100KB. Không gộp nhiều sub-phase lớn vào một chat vì lịch sử sẽ cộng dồn và nhanh vượt 250K context.

| Sub-phase | Đề xuất chat | Ghi chú |
|-----------|--------------|---------|
| 0.1 — 0.4 | 1 chat | Audit chỉ đọc, không sửa code |
| 1.0 Foundation | 1 chat | Tạo folder + components layout |
| 2.0 Core Controls | 1 chat | 7 controls + demo |
| 3.0 Data Components | 1 chat | Search, dropdown, table, row, empty, totals |
| 4.0 Layout Sub-components | 1 chat | Section, header, content |
| 5.0 Overlays | 1 chat (hoặc bỏ qua) | Tùy chọn |
| 6.0 Pilot DisposalForm | 1 chat | Màn đơn giản, validate system |
| 7.1 ImportGoods Sidebar | 1 chat | Chỉ sửa sidebar JSX |
| 7.2a ImportGoods Search + Table | 1 chat | Chỉ main area search/table |
| 7.2b ImportGoods Item Rows | 1 chat | Row + LotExpiryPopover |
| 7.3 ImportGoods Integration | 1 chat | Final pass + cleanup |
| 7.4 ImportGoods Dead Code | 1 chat | Grep + xóa file |
| 8.1 InventoryCount Form View | 1 chat | CountFormLayout + sidebar |
| 8.2 InventoryCount Search + Table | 1 chat | Search dropdown + count table |
| 8.3 InventoryCount Dead Code | 1 chat | Grep + xóa file |
| 9.1 SupplierExchanges Create | 1 chat | Wizard styling only |
| 9.2 SupplierExchanges Integration | 1 chat | Final pass |
| 9.3 SupplierExchanges Dead Code | 1 chat | Grep + xóa file |
| 10.1a — 10.2c | 2-3 chat | Dead code cleanup per page |
| 10.3 Build Verification | 1 chat | Lint/build/type fixes |
| 10.4a — 10.4c | 1-2 chat | Manual test + responsive |

## Các bước lặp lại cho mỗi chat

1. **Tạo backup** (quan trọng vì không có git):
   ```powershell
   Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_<SUBPHASE>_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
   ```
2. **Mở chat mới** trong Windsurf.
3. **Dán prompt mẫu** tương ứng bên dưới.
4. **Để AI thực hiện**. AI sẽ đọc plan và tasks.md, sửa code, đánh dấu task.
5. **Kiểm tra sau khi AI báo xong**:
   ```powershell
   npm run lint
   ```
   Nếu chat này là **cuối phase lớn** (1.0, 3.0, 4.0, 6.0, 7.3, 8.2, 9.2, 10.3), thêm:
   ```powershell
   npm run build
   ```
6. **Archive** (tùy chọn sau mỗi phase lớn):
   ```powershell
   openspec archive voucher-form-component-system-plan-a
   ```
   > Lưu ý: archive sẽ merge delta specs vào baseline. Nếu muốn giữ change active để tiếp tục sub-phase, đừng archive quá sớm.
7. **Lưu lại backup path** và mở chat mới cho sub-phase kế tiếp.

---

## Prompt mẫu — Copy toàn bộ đoạn tương ứng

### Phase 0.1 — Audit ImportGoods

```text
Thực hiện Phase 0.1 — Audit ImportGoods cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.1 Phase 0.1.
- Đọc các file: `pages/ImportGoods.tsx`, `pages/ImportGoods.css`, `components/import-goods/ImportProductSearch.tsx/.css`, `ImportItemsTable.tsx/.css`, `ImportItemRow.tsx/.css`, `LotExpiryPopover.tsx/.css`, `ImportSidebar/*`, `components/VoucherFormLayout.tsx/.css`, `components/SectionBox.tsx/.css`, `design-system-tokens.css`.
- Liệt kê UI patterns lặp lại trong ImportGoods.
- Liệt kê dead code riêng của ImportGoods.
- Ghi chú các components cần thay thế bằng Voucher Form System.
- KHÔNG sửa code.
- KHÔNG chạy lint/build.
- Ghi kết quả audit vào cuối chat để handoff sub-phase sau.
```

### Phase 0.2 — Audit InventoryCount

```text
Thực hiện Phase 0.2 — Audit InventoryCount cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.2 Phase 0.2.
- Đọc các file: `pages/InventoryCount.tsx`, `pages/InventoryCount.css`, `components/inventory-count/CountFormLayout.tsx`, `CountItemsTable.tsx/.css`, `ProductSearchDropdown.tsx/.css`, `CountSidebar/*`, layout baseline.
- Liệt kê UI patterns lặp lại trong InventoryCount.
- Liệt kê dead code riêng của InventoryCount.
- Ghi chú về Excel import / scanner / diff calculation (không sửa logic).
- KHÔNG sửa code.
- KHÔNG chạy lint/build.
```

### Phase 0.3 — Audit SupplierExchanges

```text
Thực hiện Phase 0.3 — Audit SupplierExchanges cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.3 Phase 0.3.
- Đọc các file: `pages/SupplierExchanges.tsx`, `pages/SupplierExchanges.css`, layout baseline, `components/supplier-exchanges/*` (nếu có).
- Xác nhận SupplierExchanges là wizard create-flow, KHÔNG dùng VoucherTable/VoucherTableRow.
- Liệt kê UI patterns lặp lại.
- Đề xuất tách phần create form thành `components/supplier-exchanges/ExchangeForm.tsx` nếu cần.
- Ghi chú exchange flow / lot selection grid (không sửa logic).
- KHÔNG sửa code.
- KHÔNG chạy lint/build.
```

### Phase 0.4 — Audit DisposalForm + Summary + Backup

```text
Thực hiện Phase 0.4 — Audit DisposalForm + Tổng hợp + Backup cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.4 Phase 0.4.
- Đọc các file: `pages/DisposalForm.tsx`, `pages/Disposals.css`, `components/disposal-form/DisposalProductSearch.tsx`, `DisposalItemsTable.tsx/.css`, `DisposalItemRow.tsx/.css`, `DisposalLotSelector.tsx/.css` (phải giữ), `DisposalDetailModal.tsx/.css` (ngoài scope, không đụng), `DisposalSidebar/*`, layout baseline.
- Liệt kê UI patterns lặp lại trong DisposalForm.
- Tổng hợp kết quả audit từ 4 màn (0.1, 0.2, 0.3, 0.4).
- Xác nhận: `ImportFormLayout.tsx/.css` và `DisposalFormLayout.tsx/.css` không tồn tại.
- Xác nhận: `CountFormLayout.tsx` vẫn được import trong `pages/InventoryCount.tsx`.
- Xác nhận: `DisposalProductSearch.css` không tồn tại.
- Tạo backup project:
  Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase0_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
- KHÔNG sửa code.
- KHÔNG chạy lint/build.
- Ghi rõ backup path vào cuối chat.
```

### Phase 1.0 — Foundation

```text
Thực hiện Phase 1.0 — Foundation cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.2 Phase 1.
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master.md`, section 5 (Phase 1).
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 5.
- Tạo backup trước khi sửa:
  Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase1_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
- Tạo folder `components/voucher-form/`.
- Tạo `components/voucher-form/index.ts`.
- Tạo `utils/classNames.ts`.
- Tạo `VoucherHeader`, `VoucherSidebar`, `VoucherActions`, `VoucherBanner`, `VoucherScrollArea` với file CSS riêng.
- Tái cấu trúc `VoucherFormLayout` để compose từ các sub-components trên, GIỮ NGUYÊN public props (`title`, `onBack`, `searchValue`, `onSearchChange`, `searchSlot`, `main`, `sidebar`, `actions`, `banner`, `className`).
- Di chuyển `VoucherFormLayout.tsx/.css` vào `components/voucher-form/`.
- Cập nhật import path trên 5 file: `pages/ImportGoods.tsx`, `pages/DisposalForm.tsx`, `pages/InventoryCount.tsx`, `pages/SupplierExchanges.tsx`, `components/inventory-count/CountFormLayout.tsx`.
- Chạy `grep` xác nhận không còn import cũ từ `../components/VoucherFormLayout` hoặc `../VoucherFormLayout`.
- Xóa file cũ `components/VoucherFormLayout.tsx` và `components/VoucherFormLayout.css`.
- Chạy `npm run lint` và `npm run build`.
- Không sửa logic trong các page.
- Ghi handoff cuối chat: file đã sửa, backup path, build status.
```

### Phase 2.0 — Core Controls

```text
Thực hiện Phase 2.0 — Core Controls cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master.md`, section 5 (Phase 2).
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 6.
- Không cần backup riêng nếu Phase 1 đã backup (nhưng vẫn nên backup nếu cảm thấy cần).
- Tạo các components trong `components/voucher-form/`:
  - `VoucherButton.tsx/.css`: variants primary/secondary/danger/ghost/link, sizes sm/md/lg, loading, icon, fullWidth
  - `VoucherInput.tsx/.css`: text/number/date/search/tel, prefix/suffix icon, error, sizes
  - `VoucherTextarea.tsx/.css`
  - `VoucherSelect.tsx/.css`
  - `VoucherLabel.tsx/.css`
  - `VoucherField.tsx/.css`
  - `VoucherToggle.tsx/.css`
- Cập nhật `components/voucher-form/index.ts`.
- Tạo `components/voucher-form/__demo.tsx` để hiển thị tất cả variants.
- Chạy `npm run lint` và `npm run build`.
- KHÔNG tích hợp vào các page thực.
- Ghi handoff cuối chat.
```

### Phase 3.0 — Data Components

```text
Thực hiện Phase 3.0 — Data Components cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master.md`, section 5 (Phase 3).
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 7.
- Tạo các components trong `components/voucher-form/`:
  - `VoucherSearch.tsx/.css`: input shell, value/onChange/placeholder/slot/loading/disabled
  - `VoucherProductDropdown.tsx/.css`: 2 mode client/server, keyboard ↑↓ Enter Esc, click-outside, scroll-into-view, highlight
  - `VoucherAddButton.tsx/.css`
  - `VoucherTable.tsx/.css`: sticky header, scrollable body
  - `VoucherTableRow.tsx/.css`: children hoặc renderCells, selected, hover
  - `VoucherEmpty.tsx/.css`
  - `VoucherTotals.tsx/.css`: items {label, value, highlight?}
- Cập nhật `components/voucher-form/index.ts`.
- Cập nhật `components/voucher-form/__demo.tsx`.
- Test keyboard navigation trong demo.
- Chạy `npm run lint` và `npm run build`.
- KHÔNG tích hợp vào các page thực.
- Ghi handoff cuối chat.
```

### Phase 4.0 — Layout Sub-components

```text
Thực hiện Phase 4.0 — Layout Sub-components cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master.md`, section 5 (Phase 4).
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 8.
- Tạo các components trong `components/voucher-form/`:
  - `VoucherSection.tsx/.css`: card style mặc định, flat trong sidebar
  - `VoucherSectionHeader.tsx/.css`
  - `VoucherSectionContent.tsx/.css`
- Cập nhật `components/voucher-form/index.ts`.
- Cập nhật `components/voucher-form/__demo.tsx`.
- KHÔNG sửa `components/SectionBox.tsx` gốc.
- Chạy `npm run lint` và `npm run build`.
- Ghi handoff cuối chat.
```

### Phase 5.0 — Overlays (Optional)

```text
Thực hiện Phase 5.0 — Overlays (tùy chọn) cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master.md`, section 5 (Phase 5).
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 9.
- Nếu quyết định thực hiện:
  - Tạo `hooks/useClickOutside.ts` nếu chưa có.
  - Tạo `components/voucher-form/VoucherPopover.tsx/.css`.
  - Cập nhật `components/voucher-form/__demo.tsx`.
- Nếu bỏ qua: chỉ cần ghi chú "Phase 5 skipped" vào handoff và tiếp tục Phase 6.
- KHÔNG thay `LotExpiryPopover`.
- Chạy `npm run lint` và `npm run build` nếu có code changes.
- Ghi handoff cuối chat.
```

### Phase 6.0 — Pilot Refactor: DisposalForm

```text
Thực hiện Phase 6.0 — Pilot Refactor: DisposalForm cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master.md`, section 5 (Phase 6).
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 10.
- Tạo backup:
  Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase6_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
- Chụp baseline DisposalForm (empty, search open, 1 item, completed) nếu có thể.
- Đọc `pages/DisposalForm.tsx`, `pages/Disposals.css`, `components/disposal-form/*`.
- Thay `DisposalProductSearch` bằng `VoucherSearch` + `VoucherProductDropdown`.
- Thay `DisposalItemsTable` + `DisposalItemRow` bằng `VoucherTable` + `VoucherTableRow`.
- Nhúng lại `DisposalLotSelector` trong `VoucherTableRow` khi `product?.hasBatches && product?.lots?.length > 0`.
- Giữ logic khóa số lượng khi `reason === 'Hàng hết hạn'`.
- Thay sidebar sections (`InfoSection`, `ReasonSection`, `NoteSection`, `ActionFooter`) bằng Voucher components.
- KHÔNG đụng `DisposalDetailModal`.
- Cập nhật `pages/Disposals.css`: xóa CSS create form, giữ list view.
- Chạy `npm run lint` và `npm run build`.
- Manual test:
  - Tạo phiếu xuất hủy → hoàn thành.
  - Chọn lô hàng hết hạn → SL tự khóa → hoàn thành.
  - Test ↑↓ Enter Esc trong search dropdown.
  - Mở `DisposalDetailModal` trong `pages/Disposals.tsx` vẫn hoạt động.
- Ghi handoff cuối chat.
```

### Phase 7.1 — ImportGoods Sidebar Refactor

```text
Thực hiện Phase 7.1 — ImportGoods Sidebar Refactor cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.8 Phase 7.1.
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 11.
- Tạo backup:
  Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase7_1_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
- Đọc `components/import-goods/ImportSidebar/*`.
- Chỉ đọc/sửa phần sidebar JSX trong `pages/ImportGoods.tsx`, KHÔNG đọc/sửa phần main area.
- Thay các sidebar sections bằng `VoucherSection`, `VoucherField`, `VoucherInput`, `VoucherSelect`, `VoucherTextarea`, `VoucherActions`, `VoucherButton`, `VoucherTotals`.
- `TotalsSection`: giữ logic tính toán trong `pages/ImportGoods.tsx`, `VoucherTotals` chỉ hiển thị.
- `SupplierSection`: giữ combobox logic, chỉ thay vỏ input/button.
- Xóa CSS sidebar create form trong `pages/ImportGoods.css`.
- Chạy `npm run lint` và `npm run build`.
- Manual test: tạo phiếu nhập → tính tiền/công nợ/NCC vẫn đúng.
- Ghi handoff cuối chat.
```

### Phase 7.2a — ImportGoods Main Area: Search + Table Shell

```text
Thực hiện Phase 7.2a — ImportGoods Main Area: Search + Table Shell cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.8 Phase 7.2a.
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 12.
- Đọc `components/import-goods/ImportProductSearch.tsx/.css`, `ImportItemsTable.tsx/.css`.
- Đọc phần main area search + table trong `pages/ImportGoods.tsx` và `pages/ImportGoods.css`.
- Thay `ImportProductSearch` bằng `VoucherSearch` (header) + `VoucherProductDropdown` (searchSlot) mode client.
- Thay `ImportItemsTable` bằng `VoucherTable`.
- Giữ `LotExpiryPopover` chưa đụng.
- Xóa CSS của `ImportProductSearch` và `ImportItemsTable` nếu không còn dùng.
- Chạy `npm run lint` và `npm run build`.
- Manual test: search, thêm sản phẩm, table render.
- Ghi handoff cuối chat.
```

### Phase 7.2b — ImportGoods Item Rows + Lot Handling

```text
Thực hiện Phase 7.2b — ImportGoods Item Rows + Lot Handling cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.8 Phase 7.2b.
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 13.
- Đọc `components/import-goods/ImportItemRow.tsx/.css`, `LotExpiryPopover.tsx/.css`.
- Đọc phần item rows trong `pages/ImportGoods.tsx` và `pages/ImportGoods.css`.
- Thay `ImportItemRow` bằng `VoucherTableRow` (dùng children/renderCells).
- Giữ `LotExpiryPopover` render trong row khi cần nhập lô/HSD.
- Giữ line-total calculation và input handlers.
- Xóa CSS của `ImportItemRow` nếu không còn dùng.
- Chạy `npm run lint` và `npm run build`.
- Manual test: nhập lô/HSD, xóa item, hoàn thành phiếu nhập.
- Ghi handoff cuối chat.
```

### Phase 7.3 — ImportGoods Page Integration & Cleanup

```text
Thực hiện Phase 7.3 — ImportGoods Page Integration & Cleanup cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.8 Phase 7.3.
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 14.
- Đọc toàn bộ `pages/ImportGoods.tsx` và `pages/ImportGoods.css`.
- Final pass: đảm bảo toàn bộ components từ `components/voucher-form/`.
- Cleanup imports: xóa import components cũ.
- Giữ CSS list view, xóa CSS create form còn sót.
- Chạy `npm run lint` và `npm run build`.
- Manual test: tạo/sửa/hoàn thành phiếu nhập hoạt động đúng.
- So sánh visual baseline.
- Ghi handoff cuối chat.
```

### Phase 7.4 — ImportGoods Dead Code Cleanup

```text
Thực hiện Phase 7.4 — ImportGoods Dead Code Cleanup cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 15.
- Chạy `grep` xác nhận không còn import `ImportProductSearch|ImportItemsTable|ImportItemRow`.
- Xóa file CSS/components cũ nếu không còn import.
- Xác nhận `LotExpiryPopover.tsx/.css` vẫn tồn tại.
- Chạy `npm run lint` và `npm run build`.
- Manual test: flow nhập hàng vẫn hoạt động.
- Ghi handoff cuối chat.
```

### Phase 8.1 — InventoryCount Form View Refactor

```text
Thực hiện Phase 8.1 — InventoryCount Form View Refactor cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.9 Phase 8.1.
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 16.
- Tạo backup:
  Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase8_1_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
- Chụp baseline InventoryCount form view.
- Đọc `components/inventory-count/CountFormLayout.tsx`.
- Refactor nội bộ `CountFormLayout.tsx` dùng `VoucherFormLayout`, `VoucherSection`, `VoucherField`, `VoucherTotals`.
- Giữ public props: `formData`, `setFormData`, `isEditing`, `children`, `onBack`, `actions`.
- Giữ logic `totalDiff`, `totalDiffValue`, `handleDateChange`, notes disabled khi completed.
- Đọc phần form view trong `pages/InventoryCount.tsx` và `pages/InventoryCount.css`.
- Refactor `CountSidebar` sections với Voucher components.
- Xóa CSS create form trong `pages/InventoryCount.css`.
- Chạy `npm run lint` và `npm run build`.
- Manual test: tạo phiếu kiểm kê → lưu nháp → hoàn thành.
- Ghi handoff cuối chat.
```

### Phase 8.2 — InventoryCount Search + Table Refactor

```text
Thực hiện Phase 8.2 — InventoryCount Search + Table Refactor cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.9 Phase 8.2.
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 17.
- Đọc `components/inventory-count/ProductSearchDropdown.tsx/.css`, `CountItemsTable.tsx/.css`.
- Đọc phần search + table trong `pages/InventoryCount.tsx` và `pages/InventoryCount.css`.
- Thay `ProductSearchDropdown` bằng `VoucherSearch` + `VoucherProductDropdown` (chọn mode client/server phù hợp flow hiện tại).
- Thay `CountItemsTable` bằng `VoucherTable` + `VoucherTableRow`.
- Giữ màu chênh lệch tăng/giảm trong render row.
- Giữ Excel import, scanner, diff calculation.
- Xóa CSS của `ProductSearchDropdown` và `CountItemsTable` nếu không còn dùng.
- Chạy `npm run lint` và `npm run build`.
- Manual test: thêm sản phẩm, import Excel, scan, diff hiển thị đúng.
- Ghi handoff cuối chat.
```

### Phase 8.3 — InventoryCount Dead Code Cleanup

```text
Thực hiện Phase 8.3 — InventoryCount Dead Code Cleanup cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 18.
- Chạy `grep` xác nhận không còn import `ProductSearchDropdown|CountItemsTable`.
- Xóa file CSS/components cũ nếu không còn import.
- Xác nhận `CountFormLayout.tsx` vẫn được import (không xóa).
- Chạy `npm run lint` và `npm run build`.
- Manual test: flow kiểm kê vẫn hoạt động.
- Ghi handoff cuối chat.
```

### Phase 9.1 — SupplierExchanges Create Form Refactor

```text
Thực hiện Phase 9.1 — SupplierExchanges Create Form Refactor cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.10 Phase 9.1.
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 19.
- Tạo backup:
  Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase9_1_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
- Chụp baseline SupplierExchanges create form.
- Đọc phần create form trong `pages/SupplierExchanges.tsx` và `pages/SupplierExchanges.css`.
- (Tùy chọn) Tách phần create form thành `components/supplier-exchanges/ExchangeForm.tsx`.
- Thay input/button/select/section/banner styling bằng `VoucherFormLayout`, `VoucherInput`, `VoucherButton`, `VoucherSection`, `VoucherField`, `VoucherBanner`.
- Dùng `VoucherSearch` + `VoucherProductDropdown` cho tìm sản phẩm nếu phù hợp.
- KHÔNG dùng `VoucherTable` / `VoucherTableRow`.
- Giữ wizard: lot selection grid → receipt list → exchange item cards.
- Xóa CSS create form trong `pages/SupplierExchanges.css`.
- Chạy `npm run lint` và `npm run build`.
- Manual test: chọn NCC, phiếu nhập gốc, lô, hoàn thành.
- Ghi handoff cuối chat.
```

### Phase 9.2 — SupplierExchanges Wizard Integration

```text
Thực hiện Phase 9.2 — SupplierExchanges Wizard Integration cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `docs/plans/voucher-form-component-system/PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`, section 3.10 Phase 9.2.
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 20.
- Đọc toàn bộ `pages/SupplierExchanges.tsx` và `pages/SupplierExchanges.css`.
- Final pass: cleanup imports, ensure lot/receipt/item-card flow works.
- Giữ CSS list view.
- Chạy `npm run lint` và `npm run build`.
- Manual test: list view và wizard create form vẫn hoạt động đúng.
- Ghi handoff cuối chat.
```

### Phase 9.3 — SupplierExchanges Dead Code Cleanup

```text
Thực hiện Phase 9.3 — SupplierExchanges Dead Code Cleanup cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 21.
- Chạy `grep` xác nhận không còn import các component cũ chỉ phục vụ create form.
- Xóa file CSS/components cũ nếu không còn import.
- Chạy `npm run lint` và `npm run build`.
- Manual test: flow đổi hàng NCC vẫn hoạt động.
- Ghi handoff cuối chat.
```

### Phase 10.1a — Dead Code Cleanup: import-goods audit

```text
Thực hiện Phase 10.1a — Dead Code Cleanup: import-goods audit cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 22.
- Grep `pages/ImportGoods.tsx` và `components/import-goods/*` tìm `ImportProductSearch|ImportItemsTable|ImportItemRow`.
- Xác nhận `LotExpiryPopover.tsx/.css` vẫn được import.
- Liệt kê file CSS/component an toàn để xóa.
- KHÔNG xóa file trong sub-phase này.
- Ghi handoff cuối chat.
```

### Phase 10.1b — Dead Code Cleanup: import-goods removal

```text
Thực hiện Phase 10.1b — Dead Code Cleanup: import-goods removal cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 23.
- Xóa CSS/components cũ của import-goods đã xác nhận ở 10.1a.
- Xác nhận `LotExpiryPopover.tsx/.css` vẫn tồn tại.
- Chạy `npm run lint` và `npm run build`.
- Ghi handoff cuối chat.
```

### Phase 10.1c — Dead Code Cleanup: disposal-form audit

```text
Thực hiện Phase 10.1c — Dead Code Cleanup: disposal-form audit cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 24.
- Grep `pages/DisposalForm.tsx` và `components/disposal-form/*` tìm `DisposalProductSearch|DisposalItemsTable|DisposalItemRow`.
- Xác nhận `DisposalDetailModal.tsx/.css` là ngoài scope và không đụng.
- Xác nhận `DisposalLotSelector.tsx/.css` vẫn được import.
- Liệt kê file CSS/component an toàn để xóa.
- KHÔNG xóa file trong sub-phase này.
- Ghi handoff cuối chat.
```

### Phase 10.1d — Dead Code Cleanup: disposal-form removal

```text
Thực hiện Phase 10.1d — Dead Code Cleanup: disposal-form removal cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 25.
- Xóa CSS/components cũ của disposal-form đã xác nhận ở 10.1c.
- Xác nhận `DisposalDetailModal.tsx/.css` không bị đụng.
- Xác nhận `DisposalLotSelector.tsx/.css` vẫn tồn tại.
- Chạy `npm run lint` và `npm run build`.
- Ghi handoff cuối chat.
```

### Phase 10.2a — Dead Code Cleanup: inventory-count audit

```text
Thực hiện Phase 10.2a — Dead Code Cleanup: inventory-count audit cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 26.
- Grep `pages/InventoryCount.tsx` và `components/inventory-count/*` tìm `ProductSearchDropdown|CountItemsTable`.
- Xác nhận `CountFormLayout.tsx` vẫn được import hoặc đã refactor hoàn toàn vào page.
- Liệt kê file CSS/component an toàn để xóa.
- KHÔNG xóa file trong sub-phase này.
- Ghi handoff cuối chat.
```

### Phase 10.2b — Dead Code Cleanup: inventory-count removal

```text
Thực hiện Phase 10.2b — Dead Code Cleanup: inventory-count removal cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 27.
- Xóa CSS/components cũ của inventory-count đã xác nhận ở 10.2a.
- Xác nhận `CountFormLayout.tsx` vẫn được import nếu cần.
- Chạy `npm run lint` và `npm run build`.
- Ghi handoff cuối chat.
```

### Phase 10.2c — Dead Code Cleanup: supplier-exchanges

```text
Thực hiện Phase 10.2c — Dead Code Cleanup: supplier-exchanges cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 28.
- Grep `pages/SupplierExchanges.tsx` và `components/supplier-exchanges/*` tìm import cũ create-form-only.
- Xóa CSS/components cũ nếu không còn import.
- Chạy `npm run lint` và `npm run build`.
- Ghi handoff cuối chat.
```

### Phase 10.3 — Build Verification & Type Fixes

```text
Thực hiện Phase 10.3 — Build Verification & Type Fixes cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 29.
- Chạy `npm run lint` trên toàn project.
- Chạy `npm run build` trên toàn project.
- Sửa các lỗi TypeScript còn sót.
- Xóa `components/voucher-form/__demo.tsx` nếu còn tồn tại.
- Chạy lại `npm run lint` và `npm run build`.
- Ghi handoff cuối chat.
```

### Phase 10.4a — Manual Test: ImportGoods + DisposalForm

```text
Thực hiện Phase 10.4a — Manual Test: ImportGoods + DisposalForm cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 30.
- Không sửa code ngoài fix lỗi UI nhỏ.
- Manual test:
  - Tạo phiếu nhập → hoàn thành.
  - Nhập hàng có lô/HSD qua `LotExpiryPopover` → hoàn thành.
  - Tạo phiếu xuất hủy → hoàn thành.
  - Xuất hủy hàng hết hạn: chọn lô qua `DisposalLotSelector` → SL tự khóa → hoàn thành.
  - Keyboard navigation trong search dropdown: ↑ ↓ Enter Esc.
  - Mở `DisposalDetailModal` trong `pages/Disposals.tsx` vẫn hoạt động.
- Ghi kết quả test vào cuối chat.
```

### Phase 10.4b — Manual Test: InventoryCount + SupplierExchanges + Responsive

```text
Thực hiện Phase 10.4b — Manual Test: InventoryCount + SupplierExchanges + Responsive cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 31.
- Không sửa code ngoài fix lỗi UI nhỏ.
- Manual test:
  - Tạo phiếu kiểm kê → lưu nháp → hoàn thành.
  - Import Excel / scan / diff hiển thị đúng.
  - Tạo phiếu đổi hàng NCC → hoàn thành.
  - Wizard lot grid / receipt list / exchange item cards vẫn hoạt động.
  - Responsive desktop (>1024px).
  - Responsive tablet (768–1023px).
  - Responsive mobile (<768px).
- Ghi kết quả test vào cuối chat.
```

### Phase 10.4c — Visual Regression Final Review

```text
Thực hiện Phase 10.4c — Visual Regression Final Review cho kế hoạch Voucher Form Component System.

Yêu cầu:
- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 32.
- Review baseline images cho 4 form: ImportGoods, InventoryCount, DisposalForm, SupplierExchanges.
- Trạng thái cần có: empty, search open, data-filled, completed.
- Nếu phase chạm `LotExpiryPopover` hoặc `DisposalLotSelector`, kiểm tra ảnh popup/selector đang mở.
- So sánh ảnh trước/sau để phát hiện lệch spacing, border, overflow, sticky header.
- Nếu có diff ngoài chủ đích, tạo sub-phase fix riêng và re-verify.
- Ghi kết luận final review vào cuối chat.
- (Tùy chọn) Archive change:
  openspec archive voucher-form-component-system-plan-a
```

---

## Lưu ý cuối cùng

- **Không gộp nhiều sub-phase** vào một chat trừ khi tổng code < 100KB.
- **Luôn backup** trước sub-phase sửa code (1.0, 6.0, 7.1, 8.1, 9.1, 10.1).
- **Luôn chạy `npm run lint`** sau mỗi sub-phase.
- **Luôn chạy `npm run build`** sau mỗi phase lớn (1.0, 3.0, 4.0, 6.0, 7.3, 8.2, 9.2, 10.3).
- **Nếu phát hiện thiếu prop/mode** trong lúc code: dừng ngay, update plan/sub-phase detail, rồi mới tiếp tục.
- **Archive change** sau khi toàn bộ plan hoàn thành và validate thành công.
