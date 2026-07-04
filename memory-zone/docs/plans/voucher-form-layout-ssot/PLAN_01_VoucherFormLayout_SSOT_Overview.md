# Kế hoạch tổng — VoucherFormLayout SSOT cho 4 màn phiếu

> **Project:** VietSale Pro v7  
> **Mục tiêu:** Đồng bộ giao diện, CSS, bố cục, phong cách của 4 màn phiếu nhập liệu (Nhập hàng, Kiểm kê, Xuất hủy, Đổi hàng NCC) bằng cách dùng chung `VoucherFormLayout`. Tính năng / code / logic nghiệp vụ giữ nguyên.  
> **SSOT:** `components/VoucherFormLayout.tsx` + `components/VoucherFormLayout.css` — muốn thay đổi layout chung thì chỉ sửa 2 file này.  
> **Created:** 2026-07-02  
> **Next step (chat sau):** Dựa vào file này, chia từng phase thành plan chi tiết hơn nữa (`PLAN_02_VoucherFormLayout_SSOT_Detailed.md`).

---

## 1. Hiện trạng

| Màn hình | Page | Layout hiện tại | Ghi chú |
|----------|------|-----------------|---------|
| **Nhập hàng** | `pages/ImportGoods.tsx` | `VoucherFormLayout` | Đã dùng chuẩn, nhưng còn `ImportFormLayout` dead code và nhánh V1 trong các sidebar sections. |
| **Kiểm kê** | `pages/InventoryCount.tsx` | `CountFormLayout` → `VoucherFormLayout` | Đã dùng chuẩn, cần tinh chỉnh và xóa `CountFormLayout.css`. |
| **Xuất hủy** | `pages/DisposalForm.tsx` | `VoucherFormLayout` | Đã dùng chuẩn, nhưng còn `DisposalFormLayout` dead code và nhánh V1 trong các sidebar sections. |
| **Đổi hàng NCC** | `pages/SupplierExchanges.tsx` | `VoucherFormLayout` | Đã import, cần chuẩn hóa lại create form (đặc biệt alert banner). |

Các dead code còn sót:
- `components/import-goods/ImportFormLayout.tsx`
- `components/import-goods/ImportFormLayout.css`
- `components/disposal-form/DisposalFormLayout.tsx`
- `components/disposal-form/DisposalFormLayout.css`
- `components/inventory-count/CountFormLayout.css`

Feature flags cần tắt/xóa sau khi refactor xong:
- `useRefactoredImportLayout`
- `useRefactoredDisposalLayout`
- `useRefactoredCountLayout`

---

## 2. Nguyên tắc bất di bất dịch

1. **Không đụng business logic** — handlers, validation, tính toán, API calls, state management giữ nguyên.
2. **Không đụng `types.ts`** — API contracts giữ nguyên.
3. **Không đụng database / Supabase** — chỉ làm frontend.
4. **Mỗi page chỉ được truyền content vào slot** — không tự định nghĩa layout riêng, không thêm class làm thay đổi grid/flex/width.
5. **Tất cả layout chung phải nằm trong `VoucherFormLayout`** — kể cả banner, stats row nếu cần.
6. **Sidebar sections chỉ dùng `SectionBox` + `SectionHeader` + `SectionContent`** — section chỉ cung cấp nội dung, không cung cấp layout.
7. **Xóa feature flag và dead code ngay sau khi ổn định** — không để nhánh V1 tồn tại lâu.

---

## 3. Các phase tổng quan

### Phase 0 — Audit & Baseline
- Liệt kê toàn bộ file layout, CSS, feature flags liên quan.
- Xác định dead code và nhánh V1 còn sót.
- **Output:** Danh sách file cần xóa / sửa / tắt flag.

### Phase 1 — Củng cố `VoucherFormLayout`
- Mở rộng interface nếu cần (thêm `banner`, `statsRow`).
- Thêm vị trí render banner trong CSS.
- Đảm bảo responsive hoàn chỉnh.
- **File sửa:** `components/VoucherFormLayout.tsx`, `components/VoucherFormLayout.css`
- **Output:** `VoucherFormLayout` đủ linh hoạt cho cả 4 màn.

### Phase 2 — Refactor `DisposalForm`
- Xóa `DisposalFormLayout.tsx` + `DisposalFormLayout.css` (dead code).
- Xóa nhánh V1 trong các sidebar sections (`InfoSection`, `ReasonSection`, `NoteSection`, `ActionFooter`, `StatsSection`).
- Tắt `useRefactoredDisposalLayout`.
- **Màn đơn giản nhất, làm trước để rút kinh nghiệm.**
- **Verification:** Tạo / sửa / hoàn thành phiếu xuất hủy.

### Phase 3 — Refactor `InventoryCount`
- Tinh chỉnh `CountFormLayout.tsx`.
- Xóa `CountFormLayout.css` (chuyển textarea style vào component dùng chung hoặc `VoucherFormLayout.css`).
- Chuẩn hóa `CountInfoSection` (thay input thô bằng `TextInput` hoặc component date chuẩn).
- Tắt `useRefactoredCountLayout`.
- **Verification:** Tạo / lưu nháp / hoàn thành phiếu kiểm kê, chênh lệch hiển thị đúng.

### Phase 4 — Refactor `SupplierExchanges`
- Chuẩn hóa create form dùng `VoucherFormLayout`.
- Xử lý alert banner qua prop `banner` của `VoucherFormLayout`.
- Đảm bảo các sidebar sections dùng `SectionBox`.
- **Verification:** Tạo phiếu đổi trả hàng NCC, chọn NCC / phiếu nhập gốc / lô, hoàn thành.

### Phase 5 — Refactor `ImportGoods`
- Xóa `ImportFormLayout.tsx` + `ImportFormLayout.css` (dead code).
- Xóa nhánh V1 trong các sidebar sections (`SupplierSection`, `ReceiptInfoSection`, `TotalsSection`, `NoteSection`, `ActionFooter`).
- Tắt `useRefactoredImportLayout`.
- Dọn `ImportGoods.css` nếu còn CSS layout cho create form (phần history view giữ nguyên).
- **Màn phức tạp nhất, làm cuối.**
- **Verification:** Tạo / sửa / hoàn thành phiếu nhập, tính tiền và công nợ đúng.

### Phase 6 — Dọn dẹp SSOT
- Xóa toàn bộ dead code đã liệt kê ở Phase 0.
- Xóa 3 feature flags cũ trong `features.ts`.
- Gộp CSS textarea ghi chú thành class dùng chung nếu cần.
- Grep kiểm tra không còn import `ImportFormLayout`, `DisposalFormLayout`, `useRefactoredImportLayout`, `useRefactoredDisposalLayout`, `useRefactoredCountLayout`.
- **Output:** Thực sự chỉ còn `VoucherFormLayout` làm layout duy nhất.

### Phase 7 — Verification
- `npm run lint`
- `npm run build`
- Manual test 4 flow tạo / sửa / hoàn thành phiếu.
- Test responsive desktop / tablet / mobile.

---

## 4. Thứ tự thực hiện khuyến nghị

1. **Phase 1** — Củng cố `VoucherFormLayout`
2. **Phase 2** — `DisposalForm` (màn đơn giản, ít rủi ro)
3. **Phase 3** — `InventoryCount` (gần xong, ít thay đổi)
4. **Phase 4** — `SupplierExchanges` (cần thêm banner)
5. **Phase 5** — `ImportGoods` (phức tạp nhất)
6. **Phase 6** — Dọn dẹp SSOT
7. **Phase 7** — Verification

---

## 5. Các file / thư mục cần chạm

### Layout chung (SSOT)
- `components/VoucherFormLayout.tsx`
- `components/VoucherFormLayout.css`

### Dead code cần xóa
- `components/import-goods/ImportFormLayout.tsx`
- `components/import-goods/ImportFormLayout.css`
- `components/disposal-form/DisposalFormLayout.tsx`
- `components/disposal-form/DisposalFormLayout.css`
- `components/inventory-count/CountFormLayout.css`

### Pages
- `pages/ImportGoods.tsx`
- `pages/InventoryCount.tsx`
- `pages/DisposalForm.tsx`
- `pages/SupplierExchanges.tsx`

### Sidebar sections (xóa nhánh V1)
- `components/import-goods/ImportSidebar/SupplierSection.tsx`
- `components/import-goods/ImportSidebar/ReceiptInfoSection.tsx`
- `components/import-goods/ImportSidebar/TotalsSection.tsx`
- `components/import-goods/ImportSidebar/NoteSection.tsx`
- `components/import-goods/ImportSidebar/ActionFooter.tsx`
- `components/disposal-form/DisposalSidebar/InfoSection.tsx`
- `components/disposal-form/DisposalSidebar/StatsSection.tsx`
- `components/disposal-form/DisposalSidebar/ReasonSection.tsx`
- `components/disposal-form/DisposalSidebar/NoteSection.tsx`
- `components/disposal-form/DisposalSidebar/ActionFooter.tsx`
- `components/inventory-count/CountSidebar/CountInfoSection.tsx`
- `components/inventory-count/CountSidebar/CountSummary.tsx`

### Feature flags
- `features.ts`

### CSS page-level cần rà soát
- `pages/ImportGoods.css`
- `pages/SupplierExchanges.css`
- `pages/InventoryCount.css`
- `pages/DisposalForm.css` (nếu có)

---

## 6. Output mong đợi cuối cùng

- 4 màn phiếu có layout đồng nhất về:
  - Bố cục 2 cột (70/30)
  - Header (Back + Title + Search)
  - Sidebar section style
  - Button style
  - Input style
  - Responsive behavior
- Muốn thay đổi layout chung → chỉ sửa `components/VoucherFormLayout.tsx` và `components/VoucherFormLayout.css`.
- Không còn dead code layout cũ.
- Không còn feature flags `useRefactoredImportLayout`, `useRefactoredDisposalLayout`, `useRefactoredCountLayout`.
- `npm run lint` và `npm run build` pass.
- 4 flow nghiệp vụ vẫn hoạt động đúng.

---

## 7. Ghi chú cho chat tiếp theo

Chat tiếp theo sẽ dựa vào file này để tạo **file kế hoạch chi tiết** (`PLAN_02_VoucherFormLayout_SSOT_Detailed.md`), bao gồm:
- Chia từng phase thành các task nhỏ hơn.
- Xác định file cụ thể cần sửa cho từng task.
- Acceptance criteria cho từng task.
- Thứ tự thực hiện từng task trong một phase.
- Risk & rollback plan cho từng task.
