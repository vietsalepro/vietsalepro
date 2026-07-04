# PLAN A — Voucher Form Component System
## Đồng bộ UI 4 màn phiếu: Nhập hàng | Kiểm kê | Xuất hủy | Đổi hàng NCC

> **Project:** VietSales Pro v7  
> **Path:** `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7`  
> **Tham khảo UI:** `C:\Users\SUACAUBA\Downloads\Project\template-ui\ui`  
> **Created:** 2026-07-03  
> **Version:** 1.3  
> **Approach:** Phương án A — Minimal Component System (không thêm dependencies mới)  
> **Revision:** 2026-07-03 (v1.3) — Bổ sung sau review lần 3: Component Migration Strategy Matrix, API đầy đủ cho `VoucherInput`/`VoucherButton`/`VoucherTableRow`/`VoucherProductDropdown`, chiến lược import path `VoucherFormLayout`, Business Logic Protection Checklist, Visual Regression Baseline, rollback procedure, handoff template.

---

## 1. Mục tiêu tổng quan

Biến `VoucherFormLayout` từ một **layout container đơn thuần** thành một **hệ thống component tập trung** (`components/voucher-form/`) bao gồm:

- Layout container, header, sidebar, actions, banner, scroll area
- Form controls: input, textarea, select, label, field, toggle, button
- Data display: search shell, table, table row, empty state, totals
- Product dropdown phức tạp (tùy chọn) — dùng cho autocomplete có keyboard navigation
- Layout sub-components: section, section header, section content

> **Lưu ý:** Không tạo `VoucherPagination`, `VoucherStatusBadge`, `VoucherDropdown`, `VoucherContextMenu`, `VoucherPopover` trong phase này. Các component này không cần thiết cho form voucher hoặc đã có component hiện tại hoạt động ổn (`StatusBadge`, `LotExpiryPopover`).

Khi cần thay đổi một chi tiết UI (ví dụ: button, input, table, search), chỉ cần sửa **một file component duy nhất** trong `components/voucher-form/`, cả 4 màn hình phiếu sẽ thay đổi đồng nhất.

---

## 2. Mục đích cụ thể

| Mục đích | Mô tả |
|----------|-------|
| **Centralize UI** | Tất cả UI controls dùng trong form voucher đều xuất phát từ `components/voucher-form/`. |
| **Đồng nhất UX** | 4 màn phiếu có cùng look & feel: button, input, table, spacing, color, shadow, radius. |
| **Tăng tốc custom** | Muốn đổi màu button → sửa `VoucherButton.css`; muốn đổi khoảng cách bảng → sửa `VoucherTable.css`. |
| **Giảm duplicate CSS** | Xóa các file CSS riêng lẻ trong `import-goods/`, `disposal-form/`, `inventory-count/`. |
| **Không phá business logic** | Handlers, validation, API calls, state, `types.ts`, Supabase giữ nguyên. |

---

## 3. Nguyên tắc bất di bất dịch (Scope Lock)

Để đảm bảo các phase **không lan mang** sang việc khác:

1. **Không đụng business logic** — chỉ thay UI components & CSS.
2. **Không đụng `types.ts`**, API contracts, Supabase RPC/migrations.
3. **Không thêm chức năng mới** — không thêm filter, sort, search behavior mới.
4. **Không refactor DataGrid toàn cục** — chỉ tạo `VoucherTable` riêng cho form voucher.
5. **Không thay đổi routing** — URL, route config, navigation giữ nguyên.
6. **Mỗi phase chỉ làm đúng scope đã định** — nếu phát hiện vấn đề ngoài scope, ghi chú lại cho phase sau.
7. **Sau mỗi phase chạy `npm run lint`** — đảm bảo không bị lỗi TypeScript.
8. **Sau mỗi phase lớn chạy `npm run build`** — đảm bảo production build pass.
9. **Backup project trước mỗi phase lớn** — vì project không dùng git.
10. **Không mất keyboard navigation / search behavior hiện có** — `VoucherSearch` chỉ là vỏ input; logic dropdown phức tạp vẫn giữ nguyên hoặc tách thành `VoucherProductDropdown`.
11. **Không ép table template vào các màn hình không phải table** — `SupplierExchanges` giữ cấu trúc lot grid / receipt list / exchange item cards, chỉ thay input/button/section styling.
12. **Không xóa file đang được import** — kiểm tra `grep` trước khi xóa bất kỳ component cũ nào.
13. **Không thay thế `TextInput` / `ActionButton` toàn cục** — 2 component này dùng ở 9 page (ImportGoods, SupplierExchanges, InventoryCount, Products, Suppliers, Customers, ReturnOrders, Orders, Disposals). Chỉ dùng `VoucherButton` / `VoucherInput` **trong `components/voucher-form/`** và các form voucher. Không sửa `components/TextInput.tsx` / `components/ActionButton.tsx`.
14. **Không đụng `DisposalDetailModal`** — component này thuộc **list view** `pages/Disposals.tsx` (import line 6, render line 312), **không thuộc voucher form**. Không refactor, không thay, không xóa trong bất kỳ phase nào của plan này.
15. **Giữ nguyên `DisposalLotSelector`** — tương tự `LotExpiryPopover` ở ImportGoods. `DisposalLotSelector` nhúng trong `DisposalItemRow.tsx` (line 4 import, line 94 render) có logic khóa số lượng khi `reason === 'Hàng hết hạn'`. Khi thay `DisposalItemRow` bằng `VoucherTableRow`, phải nhúng lại `DisposalLotSelector` vào render row khi sản phẩm có `hasBatches`.
16. **Khóa API contract trước khi code** — mỗi component mới phải có props contract được chốt trong plan trước khi triển khai. Nếu trong lúc code phát hiện thiếu prop/thiếu mode/thiếu callback, phải quay lại cập nhật plan hoặc sub-phase detail, không được tự ý thêm prop mới để “chữa cháy” ngoài contract đã chốt.
17. **Không để API trôi trong lúc implement** — các prop public của `VoucherFormLayout`, `VoucherButton`, `VoucherInput`, `VoucherField`, `VoucherTable`, `VoucherTableRow`, `VoucherSearch`, `VoucherProductDropdown`, `VoucherTotals` phải được xem là SSOT; mọi thay đổi phải được ghi vào plan trước khi sửa code. Nếu cần mở rộng, phải mô tả rõ: lý do, tác động, component nào bị ảnh hưởng, và phase nào sẽ cập nhật.

---

## 4. Phân tích hiện trạng

### 4.1. Layout hiện tại

| Màn hình | Page | Layout hiện tại | Components riêng |
|----------|------|-----------------|------------------|
| Nhập hàng | `pages/ImportGoods.tsx` | `VoucherFormLayout` | `ImportProductSearch`, `ImportItemsTable`, `ImportItemRow`, `LotExpiryPopover`, `ImportSidebar/*` |
| Kiểm kê | `pages/InventoryCount.tsx` | `CountFormLayout` → `VoucherFormLayout` | `ProductSearchDropdown`, `CountItemsTable`, `CountSidebar/*` |
| Xuất hủy | `pages/DisposalForm.tsx` | `VoucherFormLayout` | `DisposalProductSearch`, `DisposalItemsTable`, `DisposalItemRow`, `DisposalLotSelector`, `DisposalSidebar/*` |
| Đổi hàng NCC | `pages/SupplierExchanges.tsx` | `VoucherFormLayout` (create view) | Code nằm trực tiếp trong page |

### 4.2. Vấn đề

- `VoucherFormLayout.tsx` chỉ là container — không cung cấp search, table, button, input chuẩn.
- Mỗi màn hình tự viết search/table/button → style tương tự nhưng khác nhau.
- Hàng chục file CSS nhỏ với class names khác nhau.
- Muốn đổi button phải sửa nhiều nơi.
- Trộn lẫn Tailwind classes và design tokens — cần đồng nhất trong form voucher.
- Các search dropdown (`ImportProductSearch`, `DisposalProductSearch`, `ProductSearchDropdown`) có logic phức tạp (keyboard navigation, click-outside, debounce) — không thể thay bằng input đơn giản.
- `SupplierExchanges` create view không phải table — là wizard chọn lô / phiếu nhập / nhập lô mới.

### 4.3. Dead code thực tế

| File | Trạng thái | Ghi chú |
|------|-----------|---------|
| `components/import-goods/ImportFormLayout.tsx` | **Không tồn tại** | Đã xóa trước đó, không cần xử lý. |
| `components/import-goods/ImportFormLayout.css` | **Không tồn tại** | Đã xóa trước đó, không cần xử lý. |
| `components/disposal-form/DisposalFormLayout.tsx` | **Không tồn tại** | Đã xóa trước đó, không cần xử lý. |
| `components/disposal-form/DisposalFormLayout.css` | **Không tồn tại** | Đã xóa trước đó, không cần xử lý. |
| `components/inventory-count/CountFormLayout.tsx` | **Đang được dùng** | Wrapper xung quanh `VoucherFormLayout`, cần refactor thay vì xóa. |
| `components/inventory-count/CountFormLayout.css` | **Không tồn tại** | Không cần xử lý. |
| `components/disposal-form/DisposalDetailModal.tsx` + `.css` | **Đang được dùng — NGOÀI SCOPE** | Dùng trong `pages/Disposals.tsx` (list view, line 6 import, line 312 render). **KHÔNG thuộc voucher form.** Không refactor, không thay, không xóa trong plan này. |
| `components/disposal-form/DisposalLotSelector.tsx` + `.css` | **Đang được dùng — GIỮ NGUYÊN** | Nhúng trong `DisposalItemRow.tsx` (line 4, line 94). Logic chọn lô cho xuất hủy hàng hết hạn (`useEffect` khóa số lượng khi `reason === 'Hàng hết hạn'`). Khi thay `DisposalItemRow` bằng `VoucherTableRow`, phải nhúng lại `DisposalLotSelector`. Tương tự `LotExpiryPopover` ở ImportGoods. |
| `components/disposal-form/DisposalProductSearch.css` | **Không tồn tại** | Chỉ có `.tsx` (6943B), không có `.css`. Plan cũ ghi nhầm "~11K" cho cặp file. |

### 4.4. Component Migration Strategy Matrix

| Component | Loại | Hành động | Component thay thế | Ghi chú |
|---|---|---|---|---|
| `ImportProductSearch` | UI-only | Xóa sau khi không còn import | `VoucherProductDropdown` | Dropdown-only, mount trong `searchSlot` |
| `DisposalProductSearch` | UI-only | Xóa | `VoucherProductDropdown` | Tương tự Import |
| `ProductSearchDropdown` | UI khác biệt | Xóa | `VoucherSearch` + `VoucherProductDropdown` | InventoryCount cần refactor cách truyền data |
| `ImportItemsTable` | UI | Xóa | `VoucherTable` | Header cột do page định nghĩa |
| `ImportItemRow` | UI+logic nhẹ | Xóa | `VoucherTableRow` + render prop | Cần giữ input số lô/HSD/SL/đơn giá/giảm giá |
| `DisposalItemRow` | UI+logic | Xóa | `VoucherTableRow` + render prop | Bắt buộc nhúng `DisposalLotSelector` |
| `CountItemsTable` | UI | Xóa | `VoucherTable` | Cần giữ hiển thị chênh lệch màu |
| `SupplierSection` | UI+logic | Giữ file, refactor nội bộ | Dùng `VoucherInput`/`VoucherButton` bên trong | Không thay bằng `VoucherSelect` |
| `TotalsSection` | UI+logic | Giữ file hoặc tách logic | `VoucherTotals` cho phần hiển thị | Logic tính tiền/công nợ phải ở lại ImportGoods |
| `CountInfoSection` | UI+logic nhẹ | Refactor nội bộ | `VoucherSection` + `VoucherField` + `ModalInfoGrid` | Giữ `ModalInfoGrid` |
| `CountSummary` | UI+display | Refactor | `VoucherTotals` |  |
+
+> **Quy tắc riêng cho `SupplierExchanges`:** Đây là wizard create-flow, không ép vào `VoucherTable` / `VoucherTableRow`. Phần create form chỉ đồng bộ `VoucherFormLayout`, `VoucherInput`, `VoucherButton`, `VoucherSection`, `VoucherBanner`, `VoucherSearch` và `VoucherProductDropdown` khi thật sự phù hợp. Giữ nguyên lot grid / receipt list / exchange item cards.

> **Quy tắc phân loại:**
> - **UI-only:** Chỉ render, không state, không logic. Thay bằng Voucher component tương ứng.
> - **UI+logic nhẹ:** Có state/format nhỏ (line total, diff color). Logic giữ lại trong render prop hoặc page.
> - **UI+logic:** Có logic nghiệp vụ (tính tiền, NCC, khóa SL hết hạn). Giữ file, chỉ đồng nhất controls bên trong.
> - **Giữ nguyên:** `DisposalLotSelector`, `LotExpiryPopover`, `DisposalDetailModal` không thuộc scope thay thế.
+
+### 4.5. Props matrix chi tiết cho 3 search components cũ
+
+| Component | Props thực tế | Ghi chú behavior | Ảnh hưởng thiết kế `VoucherProductDropdown` |
+|---|---|---|---|
+| `ImportProductSearch` | `products: Product[]`, `searchValue: string`, `open: boolean`, `onRequestClose: () => void`, `onSelectProduct: (product: Product) => void`, `maxItems?: number` | Tự lọc client-side theo `name/code/barcode`, reset highlight theo `searchValue`, scroll active item, click-outside qua `.ig-search`, keyboard ↑↓EnterEsc | Là baseline chuẩn nhất cho autocomplete client-side |
+| `DisposalProductSearch` | `products: Product[]`, `searchValue: string`, `open: boolean`, `onRequestClose: () => void`, `onSelectProduct: (product: Product) => void`, `maxItems?: number` | API gần như giống `ImportProductSearch`; khác chủ yếu ở context xuất hủy | Có thể dùng chung component với Import nếu giữ slot render linh hoạt |
+| `ProductSearchDropdown` | `searchTerm: string`, `onSearchChange: (value: string) => void`, `results: Product[]`, `onSelectProduct: (product: Product) => void`, `disabled?: boolean` | Input + dropdown trong 1 component; không có open/requestClose; không tự keyboard navigation trong file hiện tại | Nếu thay bằng `VoucherProductDropdown`, nên hỗ trợ cả mode `client` và `server` để không vỡ flow Kiểm kê |
+
+**Kết luận thiết kế:** `VoucherProductDropdown` phải hỗ trợ tối thiểu 2 mode: `client` (nhận `products + searchValue`) và `server` (nhận `results`). **Không được ép 3 component cũ vào 1 render path duy nhất nếu behavior khác nhau làm tăng rủi ro regression**; thay vào đó, component mới phải cho phép tách nhánh render theo mode rõ ràng và giữ API tối thiểu cần thiết. API cần giữ `open`, `onRequestClose`, `onSelectProduct`, `maxItems`, `disabled?` để bao trùm cả 3 component cũ, đồng thời cho phép page truyền `renderItem`/`filterFn` khi behavior lệch so với baseline.
+
+### 4.6. Props thực tế của `CountFormLayout` cần giữ nguyên khi refactor
+
+| Prop | Type | Vai trò |
+|---|---|---|
+| `formData` | `Partial<CountFormData>` | Nguồn state của form kiểm kê |
+| `setFormData` | `React.Dispatch<React.SetStateAction<Partial<CountFormData>>>` | Cập nhật date/notes và các field form |
+| `isEditing` | `boolean` | Đổi title và behavior hiển thị |
+| `children?` | `React.ReactNode` | Main area: search dropdown + table |
+| `onBack?` | `() => void` | Nút quay lại danh sách |
+| `actions?` | `React.ReactNode` | Action footer bên sidebar |
+
+**Logic phải giữ trong `CountFormLayout`:** `totalItems`, `totalDiff`, `totalDiffValue`, `handleDateChange`, `title`, `notes` textarea disabled khi completed. Khi refactor nội bộ, chỉ thay phần markup bên trong `VoucherFormLayout`, không đổi public props.
+
+### 4.7. Bảng mapping theo page: component cũ → component mới → cách ánh xạ props
+
+| Page | Component cũ | Component mới | Mapping / lưu ý props |
+|---|---|---|---|
+| `pages/ImportGoods.tsx` | `ImportProductSearch` | `VoucherProductDropdown` | Dùng `mode="client"`, `products={localProducts}`, `searchValue={searchTerm}`, `open={isSearchOpen}`, `onRequestClose`, `onSelectProduct`, `maxItems` giữ nguyên |
+| `pages/ImportGoods.tsx` | `ImportItemsTable` + `ImportItemRow` | `VoucherTable` + `VoucherTableRow` | `VoucherTableRow` nhận `children`/`renderCells`; các input line-item, `LotExpiryPopover` render ở page |
+| `pages/ImportGoods.tsx` | `SupplierSection`, `TotalsSection`, footer | `VoucherSection`, `VoucherField`, `VoucherTotals`, `VoucherActions`, `VoucherButton` | `TotalsSection` giữ business logic tính tiền/công nợ; `VoucherTotals` chỉ hiển thị |
+| `pages/DisposalForm.tsx` | `DisposalProductSearch` | `VoucherProductDropdown` | `mode="client"`, giữ keyboard navigation, click-outside, `maxItems` |
+| `pages/DisposalForm.tsx` | `DisposalItemsTable` + `DisposalItemRow` | `VoucherTable` + `VoucherTableRow` | `DisposalLotSelector` phải được nhúng trong row khi `hasBatches` |
+| `pages/DisposalForm.tsx` | `InfoSection`, `ReasonSection`, `NoteSection`, `ActionFooter` | `VoucherSection` / `VoucherField` / `VoucherSelect` / `VoucherTextarea` / `VoucherActions` | Không đụng `DisposalDetailModal` |
+| `pages/InventoryCount.tsx` | `ProductSearchDropdown` | `VoucherSearch` + `VoucherProductDropdown` | Dùng `mode="server"` hoặc `client` tùy flow hiện tại; giữ diff logic |
+| `pages/InventoryCount.tsx` | `CountItemsTable` | `VoucherTable` + `VoucherTableRow` | Giữ màu chênh lệch trong render row; row không tự tính toán |
+| `pages/InventoryCount.tsx` | `CountSidebar`, `CountSummary` | `VoucherSection` + `VoucherField` + `VoucherTotals` | `CountFormLayout` vẫn làm wrapper public API |
+| `pages/SupplierExchanges.tsx` | create-form input/button/section thủ công | `VoucherFormLayout` + `VoucherInput` + `VoucherButton` + `VoucherSection` + `VoucherBanner` | Không ép `VoucherTable`; giữ wizard lot grid / receipt list / item cards |
+
+### 4.8. Danh sách CSS class cần giữ lại trong `pages/*.css` cho list view
+
+> Mục tiêu: khi dọn dead CSS, không xóa nhầm các class list view vẫn đang dùng.
+
+| File CSS | Class/nhóm class cần giữ | Lý do |
+|---|---|---|
+| `pages/ImportGoods.css` | các class list view/receipt list hiện tại (không phải create-form) | Form nhập hàng sẽ dần dùng voucher-form, nhưng list view / modal / status blocks vẫn cần |
+| `pages/InventoryCount.css` | các class list view và `inventory-count-v2-*` hiện có | Chỉ xóa CSS form create; list view/DataGrid và mobile card vẫn cần |
+| `pages/Disposals.css` | toàn bộ class liên quan list view và `DisposalDetailModal` | Không đụng modal list view |
+| `pages/SupplierExchanges.css` | toàn bộ class list view / wizard create-flow còn lại | Không ép table template; giữ lot grid / receipt list / item cards |
+
+**Quy tắc dọn CSS:** trước khi xóa class trong `pages/*.css`, phải grep xác nhận class không còn xuất hiện trong `pages/*.tsx` và component con. Nếu class chỉ phục vụ create form đã được thay bằng `components/voucher-form/` thì mới xóa.
+
+---
+
+## 5. QUYẾT ĐỊNH CHIẾN LƯỢC IMPORT CHO VOUCHERFORMLAYOUT

**QUYẾT ĐỊNH:** Chọn **Option A — Xóa file cũ, update import path**.

**Lý do:**
- Tránh confusion giữa `components/VoucherFormLayout.tsx` cũ và `components/voucher-form/VoucherFormLayout.tsx` mới.
- Đảm bảo Single Source of Truth (SSOT) duy nhất cho `VoucherFormLayout`.
- Dễ bảo trì, không sợ import nhầm path.
- File cũ đã được refactor lại trong `components/voucher-form/`, không cần giữ làm wrapper.

**Các bước thực hiện trong Phase 1:**
1. Tạo `components/voucher-form/VoucherFormLayout.tsx` và `.css` mới (copy nội dung từ file cũ, refactor theo sub-components).
2. Cập nhật import trong 5 file:
   - `pages/ImportGoods.tsx`: `import { VoucherFormLayout } from '../components/voucher-form';`
   - `pages/DisposalForm.tsx`: `import { VoucherFormLayout } from '../components/voucher-form';`
   - `pages/SupplierExchanges.tsx`: `import { VoucherFormLayout } from '../components/voucher-form';`
   - `pages/InventoryCount.tsx`: `import { VoucherFormLayout } from '../components/voucher-form';` (nếu trực tiếp)
   - `components/inventory-count/CountFormLayout.tsx`: `import { VoucherFormLayout } from '../voucher-form';`
3. Chạy `grep` xác nhận không còn import từ `../components/VoucherFormLayout` hoặc `../VoucherFormLayout`.
4. Xóa `components/VoucherFormLayout.tsx` và `components/VoucherFormLayout.css` cũ.

**Lưu ý:** Không dùng Option B (re-export wrapper) vì sẽ gây confusion dài hạn và không tận dụng được việc refactor triệt để.

---

## 5.1. Phương án A — Minimal Component System
## 5.1. Phương án A — Minimal Component System


### 5.1. Lý do chọn Minimal

- Không thêm dependencies mới (`class-variance-authority`, `tailwind-merge`, `radix-ui`).
- Tận dụng design tokens hiện có (`design-system-tokens.css`).
- Dùng CSS per component + React props để quản lý variants.
- Dễ kiểm soát, dễ rollback, ít rủi ro.
- Sau này nếu muốn nâng cấp lên Radix/CVA có thể làm ở phase riêng.

### 5.2. Cách quản lý variants — API đầy đủ cho 4 core components

Thay vì CVA, dùng pattern đơn giản.

#### `VoucherButtonProps` — API đầy đủ

```tsx
interface VoucherButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;          // ví dụ: icon={<Trash2 />}
  className?: string;
  title?: string;
  'aria-label'?: string;
  children?: React.ReactNode;
}
```

#### `VoucherInputProps` — API đầy đủ

```tsx
interface VoucherInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  prefixIcon?: React.ReactNode;     // icon Search, Barcode...
  suffixIcon?: React.ReactNode;     // icon Calendar, Clear...
  error?: boolean | string;
  className?: string;
}
```

#### `VoucherTableRowProps` — API đầy đủ

```tsx
interface VoucherTableRowProps {
  children?: React.ReactNode;       // toàn quyền render nội dung row
  renderCells?: () => React.ReactNode; // alternative render prop
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}
```

#### `VoucherProductDropdownProps` — API đầy đủ

```tsx
type VoucherProductDropdownMode = 'client' | 'server';

interface VoucherProductDropdownBaseProps {
  open: boolean;
  onRequestClose: () => void;
  onSelectProduct: (product: Product) => void;
  maxItems?: number;
  className?: string;
  disabled?: boolean;
}

interface VoucherProductDropdownClientProps extends VoucherProductDropdownBaseProps {
  mode: 'client';
  products: Product[];
  searchValue: string;
}

interface VoucherProductDropdownServerProps extends VoucherProductDropdownBaseProps {
  mode: 'server';
  results: Product[];
}

type VoucherProductDropdownProps =
  | VoucherProductDropdownClientProps
  | VoucherProductDropdownServerProps;
```

#### `VoucherSearchProps` — API đầy đủ

```tsx
interface VoucherSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  slot?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}
```

CSS class kết hợp theo pattern:

```css
.voucher-button { /* base */ }
.voucher-button--primary { }
.voucher-button--secondary { }
.voucher-button--sm { }
.voucher-button--md { }
.voucher-button--lg { }
.voucher-button--full-width { }
.voucher-button--loading { }
```

---

## 6. Cấu trúc thư mục đích (đã tinh gọn)

> **Thay đổi so với v1.0:** Loại bỏ các components không cần thiết (`VoucherPagination`, `VoucherStatusBadge`, `VoucherDropdown`, `VoucherContextMenu`, `VoucherPopover`). Thêm `VoucherProductDropdown` để tập trung hóa logic autocomplete phức tạp.

```
components/voucher-form/
├── index.ts                          # Export tất cả
├── VoucherFormLayout.tsx             # Container 2 cột (compose từ sub-components)
├── VoucherFormLayout.css             # Chỉ layout container + responsive
├── VoucherHeader.tsx                 # Back + Title + Search slot
├── VoucherHeader.css
├── VoucherSidebar.tsx                # Wrapper sidebar
├── VoucherSidebar.css
├── VoucherActions.tsx                # Sticky action footer
├── VoucherActions.css
├── VoucherBanner.tsx                 # Banner cảnh báo
├── VoucherBanner.css
├── VoucherScrollArea.tsx             # Scroll area tùy chỉnh
├── VoucherScrollArea.css
├── VoucherSection.tsx                # Section card trong sidebar
├── VoucherSection.css
├── VoucherSectionHeader.tsx
├── VoucherSectionHeader.css
├── VoucherSectionContent.tsx
├── VoucherSectionContent.css
├── VoucherButton.tsx                 # Button chuẩn với variants
├── VoucherButton.css
├── VoucherInput.tsx                  # Input chuẩn
├── VoucherInput.css
├── VoucherTextarea.tsx               # Textarea chuẩn
├── VoucherTextarea.css
├── VoucherSelect.tsx                 # Select wrapper (native)
├── VoucherSelect.css
├── VoucherLabel.tsx                  # Label
├── VoucherLabel.css
├── VoucherField.tsx                  # Label + input + error + hint
├── VoucherField.css
├── VoucherToggle.tsx                 # Switch toggle
├── VoucherToggle.css
├── VoucherSearch.tsx                 # Ô tìm kiếm sản phẩm (input shell)
├── VoucherSearch.css
├── VoucherProductDropdown.tsx        # Autocomplete dropdown phức tạp (keyboard, click-outside)
├── VoucherProductDropdown.css
├── VoucherAddButton.tsx              # Nút "Thêm" cạnh ô search
├── VoucherAddButton.css
├── VoucherTable.tsx                  # Bảng sản phẩm (sticky header)
├── VoucherTable.css
├── VoucherTableRow.tsx               # Row với hover/selected states
├── VoucherTableRow.css
├── VoucherEmpty.tsx                  # Empty state
├── VoucherEmpty.css
├── VoucherTotals.tsx                 # Hiển thị tổng tiền / tổng lệch
└── VoucherTotals.css
```

### Các components KHÔNG tạo trong phase này

| Component | Lý do không tạo |
|-----------|-----------------|
| `VoucherPagination` | Form voucher không phân trang danh sách items. |
| `VoucherStatusBadge` | `StatusBadge` hiện tại đã đủ dùng. |
| `VoucherDropdown` / `VoucherContextMenu` | Không cần thiết cho form voucher; có thể làm phase sau. |
| `VoucherPopover` | `LotExpiryPopover` hiện tại phức tạp, giữ nguyên hoặc làm phase sau. |

---

## 7. Phases chi tiết

### Phase 0 — Audit & Setup

**Mục tiêu:** Xác định chính xác những gì cần sửa và chuẩn bị môi trường.

**Yêu cầu:**
- Inventory toàn bộ file UI/CSS liên quan 4 màn phiếu.
- Xác định UI patterns lặp lại.
- Liệt kê dead code.
- Quyết định Option A1 (Minimal).
- Backup project.

**Hướng đi:**
1. Chạy PowerShell để liệt kê file:
   ```powershell
   Get-ChildItem -Path "components/import-goods", "components/disposal-form", "components/inventory-count", "pages" -Recurse -File -Include *.tsx,*.css | Sort-Object FullName
   ```
2. Grep các patterns lặp lại:
   ```powershell
   Select-String -Path "components/import-goods/*.css", "components/disposal-form/*.css", "components/inventory-count/*.css" -Pattern "search|table|button|input|sidebar|section"
   ```
3. Xác định dead code — **kiểm tra thực tế trước khi ghi chú**:
   - `components/import-goods/ImportFormLayout.tsx` / `.css` → kiểm tra xem còn tồn tại không (đã xóa trong nhiều phiên bản gần đây).
   - `components/disposal-form/DisposalFormLayout.tsx` / `.css` → kiểm tra xem còn tồn tại không.
   - `components/inventory-count/CountFormLayout.tsx` → **không xóa**, vì `pages/InventoryCount.tsx` đang import và dùng.
   - `components/inventory-count/CountFormLayout.css` → kiểm tra xem có tồn tại không.
   - Chạy `grep` để xác nhận không còn file nào đang được import trước khi đánh dấu dead.
4. Backup toàn bộ project folder:
   ```powershell
   Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_planA_phase0_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
   ```

**Acceptance criteria:**
- [ ] Có danh sách đầy đủ file TSX/CSS cần chạm.
- [ ] Có danh sách UI patterns lặp lại.
- [ ] Có danh sách dead code.
- [ ] Project đã được backup.
- [ ] Option A1 được xác nhận.

**Cấm kỵ:** Không sửa code trong phase này. Chỉ đọc và ghi chú.

---

### Phase 1 — Foundation

**Mục tiêu:** Tạo nền tảng folder, container layout, và utility nhỏ.

**Yêu cầu:**
- Tạo folder `components/voucher-form/`.
- Tạo `index.ts` export.
- Tạo simple `classNames` utility (nếu cần) trong `utils/classNames.ts` hoặc inline.
- Tái cấu trúc `VoucherFormLayout` để tách header/sidebar/actions thành sub-components.
- Cập nhật `VoucherFormLayout.css` chỉ giữ layout container.

**Hướng đi:**
1. Tạo `components/voucher-form/index.ts`:
   ```ts
   export * from './VoucherFormLayout';
   export * from './VoucherHeader';
   export * from './VoucherSidebar';
   export * from './VoucherActions';
   export * from './VoucherBanner';
   // ... các component khác sẽ thêm dần
   ```
2. Tạo `utils/classNames.ts`:
   ```ts
   export function classNames(...classes: (string | false | null | undefined)[]) {
     return classes.filter(Boolean).join(' ');
   }
   ```
3. Tạo `components/voucher-form/VoucherHeader.tsx`:
   - Props: `title`, `onBack?`, `searchPlaceholder?`, `searchValue?`, `onSearchChange?`, `searchSlot?`
   - Render: back button + title + search input
4. Tạo `components/voucher-form/VoucherHeader.css`.
5. Tạo `components/voucher-form/VoucherSidebar.tsx`:
   - Render: scroll area + content + actions slot
6. Tạo `components/voucher-form/VoucherSidebar.css`.
7. Tạo `components/voucher-form/VoucherActions.tsx`:
   - Props: `children`
   - Render: sticky footer
8. Tạo `components/voucher-form/VoucherActions.css`.
9. Tạo `components/voucher-form/VoucherBanner.tsx`:
   - Props: `children`
   - Render: banner cảnh báo
10. Tạo `components/voucher-form/VoucherBanner.css`.
11. Tạo `components/voucher-form/VoucherScrollArea.tsx`:
    - Props: `children`, `className?`
    - Render: div với custom scrollbar
12. Tạo `components/voucher-form/VoucherScrollArea.css`.
13. Tái cấu trúc `VoucherFormLayout.tsx` để compose từ các sub-components trên.
    - **Giữ nguyên props interface hiện tại** (`title`, `onBack`, `searchValue`, `onSearchChange`, `searchSlot`, `main`, `sidebar`, `actions`, `banner`, `className`).
    - Các sub-components (`VoucherHeader`, `VoucherSidebar`, `VoucherActions`, `VoucherBanner`) chỉ là tái cấu trúc nội bộ, không thay đổi public API.
14. Cập nhật `VoucherFormLayout.css` chỉ còn layout container (flex, width, height, responsive).
15. Di chuyển `VoucherFormLayout.tsx` / `.css` vào `components/voucher-form/` (theo directory tree đã định). Chọn **Option A** cho import path:
    - **Option A (khuyến nghị):** Xóa file cũ, cập nhật 5 import path:
      - `pages/ImportGoods.tsx`, `pages/DisposalForm.tsx`, `pages/SupplierExchanges.tsx`, `pages/InventoryCount.tsx`: `import { VoucherFormLayout } from '../components/voucher-form';`
      - `components/inventory-count/CountFormLayout.tsx`: `import { VoucherFormLayout } from '../voucher-form';`
    - **Option B (an toàn hơn):** Giữ `components/VoucherFormLayout.tsx` là re-export `export * from './voucher-form/VoucherFormLayout';` và xóa `components/VoucherFormLayout.css` cũ. Nhưng có thể gây confusion sau này.
16. Chạy `grep` xác nhận không còn import cũ từ `../components/VoucherFormLayout` hoặc `../VoucherFormLayout` trước khi xóa file cũ.

**Acceptance criteria:**
- [ ] `components/voucher-form/` được tạo.
- [ ] `VoucherFormLayout` vẫn render đúng 4 màn hình hiện tại.
- [ ] 5 import path đã chuyển sang `components/voucher-form` (hoặc re-export đã hoạt động).
- [ ] `components/VoucherFormLayout.tsx` / `.css` cũ đã xóa (nếu chọn Option A).
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Visual không thay đổi so với baseline.

**Cấm kỵ:** Không sửa logic trong `pages/ImportGoods.tsx`, `pages/DisposalForm.tsx`, `pages/InventoryCount.tsx`, `pages/SupplierExchanges.tsx`. Chỉ thay đổi import path và bên trong `VoucherFormLayout`.

---

### Phase 2 — Core Controls

**Mục tiêu:** Tạo các form controls chuẩn: button, input, textarea, select, label, field, toggle.

**Yêu cầu:**
- Tạo `VoucherButton`, `VoucherInput`, `VoucherTextarea`, `VoucherSelect`, `VoucherLabel`, `VoucherField`, `VoucherToggle`.
- Style dùng design tokens.
- Hỗ trợ disabled, focus, error states.
- Không dùng Radix UI.

**Hướng đi:**
1. `VoucherButton.tsx` + `.css`:
   - Variants: `primary`, `secondary`, `danger`, `ghost`, `link`.
   - Sizes: `sm`, `md`, `lg`.
   - Props (đầy đủ để thay `ActionButton` trong các row/form):
     ```ts
     interface VoucherButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
       size?: 'sm' | 'md' | 'lg';
       fullWidth?: boolean;
       loading?: boolean;
       disabled?: boolean;
       icon?: React.ReactNode; // ví dụ icon={<Trash2 />}
       className?: string;
       title?: string;
       'aria-label'?: string;
       children?: React.ReactNode;
       onClick?: () => void;
     }
     ```
   - Loading spinner dùng keyframes `mmSpin`.
2. `VoucherInput.tsx` + `.css`:
   - Props (extends native input + bổ sung thường dùng):
     ```ts
     interface VoucherInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
       size?: 'sm' | 'md' | 'lg';
       fullWidth?: boolean;
       prefixIcon?: React.ReactNode;
       suffixIcon?: React.ReactNode;
       error?: boolean | string;
       className?: string;
     }
     ```
   - Support types: `text`, `number`, `date`, `search`, `tel`.
   - Focus ring dùng `--color-border-focus`.
   - `prefixIcon`/`suffixIcon` dùng cho icon Search, Barcode, Calendar v.v.
3. `VoucherTextarea.tsx` + `.css`:
   - Props: `value`, `onChange`, `placeholder`, `rows`, `disabled`, `className`.
4. `VoucherSelect.tsx` + `.css`:
   - Native `<select>` wrapper.
   - Props: `value`, `onChange`, `options`, `disabled`, `placeholder`.
5. `VoucherLabel.tsx` + `.css`:
   - Props: `children`, `required?`, `className`.
6. `VoucherField.tsx` + `.css`:
   - Composition: `VoucherLabel` + `VoucherInput`/`VoucherSelect`/`VoucherTextarea` + error text + hint.
   - Props: `label`, `error?`, `hint?`, `children`.
7. `VoucherToggle.tsx` + `.css`:
   - Props: `checked`, `onChange`, `label`, `disabled`.
   - Native checkbox styled as switch.

**Acceptance criteria:**
- [ ] 7 components được tạo.
- [ ] Mỗi component có file CSS riêng.
- [ ] Có story/demo page tạm thời để xem tất cả variants (tạo file `components/voucher-form/__demo.tsx` tạm thời, xóa sau phase).
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không tích hợp vào các page thực trong phase này. Chỉ tạo components.

---

### Phase 3 — Data Components

**Mục tiêu:** Tạo các components hiển thị dữ liệu: search shell, product dropdown, table, row, empty, totals.

**Yêu cầu:**
- Tạo `VoucherSearch`, `VoucherProductDropdown`, `VoucherAddButton`, `VoucherTable`, `VoucherTableRow`, `VoucherEmpty`, `VoucherTotals`.
- **Không tạo** `VoucherPagination`, `VoucherStatusBadge` (không cần thiết cho form voucher).
- `VoucherTable` hỗ trợ sticky header, scrollable body. Checkbox / sort indicator chỉ thêm nếu thực sự cần cho cả 4 màn.

**Hướng đi:**
1. `VoucherSearch.tsx` + `.css`:
   - Props: `value`, `onChange`, `placeholder`, `slot?`, `loading?`, `disabled?`, `className?`.
   - Render: icon Search + input + optional slot.
   - **Chỉ là input shell** — không chứa logic dropdown. Parent vẫn tự quản lý `searchSlot` hoặc dùng `VoucherProductDropdown`.
2. `VoucherProductDropdown.tsx` + `.css`:
   - Hỗ trợ **2 mode** để thay cả `ImportProductSearch`/`DisposalProductSearch` (tự lọc) và `ProductSearchDropdown` (parent lọc):
     ```ts
     type VoucherProductDropdownMode = 'client' | 'server';
     interface VoucherProductDropdownBaseProps {
       open: boolean;
       onRequestClose: () => void;
       onSelectProduct: (product: Product) => void;
       maxItems?: number;
       className?: string;
     }
     interface VoucherProductDropdownClientProps extends VoucherProductDropdownBaseProps {
       mode: 'client';
       products: Product[];
       searchValue: string;
     }
     interface VoucherProductDropdownServerProps extends VoucherProductDropdownBaseProps {
       mode: 'server';
       results: Product[];
     }
     type VoucherProductDropdownProps = VoucherProductDropdownClientProps | VoucherProductDropdownServerProps;
     ```
   - Tập trung hóa logic: keyboard navigation (ArrowUp/Down/Enter/Esc), click-outside, scroll into view, highlight.
   - Thay thế `ImportProductSearch` / `DisposalProductSearch` / `ProductSearchDropdown` về UI, nhưng giữ nguyên behavior.
3. `VoucherAddButton.tsx` + `.css`:
   - Props: `onClick`, `label`, `icon?`.
   - Dùng `VoucherButton` variant secondary.
4. `VoucherTable.tsx` + `.css`:
   - Props: `children`, `className`.
   - Render: container + table with sticky header.
5. `VoucherTableRow.tsx` + `.css`:
   - Props (hỗ trợ cả render children và render prop để nhúng `DisposalLotSelector`, `LotExpiryPopover`, `VoucherInput`, `VoucherButton`):
     ```ts
     interface VoucherTableRowProps {
       children?: React.ReactNode; // toàn quyền render nội dung row
       renderCells?: () => React.ReactNode; // alternative: render prop
       selected?: boolean;
       onClick?: () => void;
       className?: string;
     }
     ```
   - Hover + selected states.
   - Không hardcode input hay lot selector bên trong — page sẽ truyền qua `children`/`renderCells`.
6. `VoucherEmpty.tsx` + `.css`:
   - Props: `title?`, `description?`, `icon?`, `action?`.
   - Border dashed style.
7. `VoucherTotals.tsx` + `.css`:
   - Props: `items: { label, value, highlight? }[]`.
   - Dùng cho tổng tiền, tổng lệch, tổng SL.

**Acceptance criteria:**
- [ ] 7 components được tạo (`VoucherSearch`, `VoucherProductDropdown`, `VoucherAddButton`, `VoucherTable`, `VoucherTableRow`, `VoucherEmpty`, `VoucherTotals`).
- [ ] `VoucherProductDropdown` có keyboard navigation và click-outside đầy đủ.
- [ ] Có demo page tạm thời hiển thị search + dropdown + table + empty + totals.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không tích hợp vào các page thực. Chỉ tạo components và demo.

---

### Phase 4 — Layout Sub-components hoàn chỉnh

**Mục tiêu:** Hoàn thiện các section/card components trong sidebar.

**Yêu cầu:**
- Tạo `VoucherSection`, `VoucherSectionHeader`, `VoucherSectionContent`.
- Thay thế `SectionBox` trong sidebar của form voucher.
- Đảm bảo `VoucherSection` không có border/box/shadow khi nằm trong sidebar (phẳng).

**Hướng đi:**
1. `VoucherSection.tsx` + `.css`:
   - Props: `children`, `className`.
   - Default: card style (border, radius, shadow) khi dùng độc lập.
   - Trong `VoucherSidebar` sẽ override thành flat.
2. `VoucherSectionHeader.tsx` + `.css`:
   - Props: `title`, `subtitle?`, `action?`.
3. `VoucherSectionContent.tsx` + `.css`:
   - Props: `children`, `className`.

**Acceptance criteria:**
- [ ] 3 components được tạo.
- [ ] Có demo hiển thị section trong sidebar.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không thay đổi `SectionBox` gốc trong `components/SectionBox.tsx`.

---

### Phase 5 — Overlays (Tùy chọn / Delay)

> **Thay đổi so với v1.0:** Phase này không bắt buộc trong plan tổng. Các overlays phức tạp (`LotExpiryPopover`) giữ nguyên; dropdown tìm sản phẩm đã được tập trung vào `VoucherProductDropdown` trong Phase 3.

**Mục tiêu:** Chỉ tạo overlays nếu thực sự cần sau khi các phase chính hoàn thành.

**Yêu cầu (nếu thực hiện):**
- Tạo `VoucherPopover` đơn giản để thay thế dần `LotExpiryPopover` (nếu cần).
- Không dùng Radix UI — dùng native hoặc custom hooks.
- Đảm bảo đóng khi click outside.
- Không tạo `VoucherDropdown` hoặc `VoucherContextMenu` vì không cần thiết cho form voucher.

**Hướng đi:**
1. Tạo hook `hooks/useClickOutside.ts` (nếu chưa có).
2. `VoucherPopover.tsx` + `.css`:
   - Props: `trigger`, `children`, `title?`.
   - Simple popover.

**Acceptance criteria:**
- [ ] `VoucherPopover` được tạo (nếu quyết định thực hiện).
- [ ] `useClickOutside` hook được tạo (nếu cần).
- [ ] Có demo.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Cấm kỵ:** Không thay đổi `MasterModal` hoặc các modal hiện có. Không thay `LotExpiryPopover` nếu chưa hiểu rõ logic nhập lô/HSD.

---

### Phase 6 — Pilot Refactor: DisposalForm

**Mục tiêu:** Áp dụng Voucher Form Component System lên `pages/DisposalForm.tsx` — màn hình đơn giản nhất.

**Yêu cầu:**
- Thay thế `DisposalProductSearch` bằng `VoucherProductDropdown` (giữ nguyên logic keyboard navigation / click-outside).
- Thay thế `DisposalItemsTable` + `DisposalItemRow` bằng `VoucherTable` + `VoucherTableRow`.
- **GIỮ NGUYÊN `DisposalLotSelector`** — nhúng lại vào render `VoucherTableRow` khi sản phẩm có `hasBatches` (tương tự `LotExpiryPopover` ở ImportGoods). Có logic `useEffect` khóa số lượng khi `reason === 'Hàng hết hạn'` (xem `DisposalItemRow.tsx` line 39-46).
- Thay thế các button trong `DisposalSidebar/ActionFooter` bằng `VoucherButton`.
- Thay thế `InfoSection`, `ReasonSection`, `NoteSection` bằng `VoucherSection` + `VoucherField` + `VoucherTextarea` + `VoucherSelect`.
- `VoucherSearch` (input shell) được dùng làm ô tìm kiếm trong header; `VoucherProductDropdown` mount trong `searchSlot`.
- Cập nhật `pages/Disposals.css` nếu cần.
- **KHÔNG ĐỤNG `DisposalDetailModal.tsx` / `.css`** — component này thuộc list view `pages/Disposals.tsx`, ngoài scope voucher form.

**Hướng đi:**
1. Mở `pages/DisposalForm.tsx`.
2. Thay imports:
   - `VoucherFormLayout` → `components/voucher-form`
   - `VoucherSearch`, `VoucherProductDropdown`, `VoucherTable`, `VoucherTableRow`, `VoucherButton`, `VoucherSection`, `VoucherField`, `VoucherTextarea`, `VoucherSelect`, `VoucherActions`, `VoucherTotals`, `VoucherEmpty`
3. Thay JSX:
   - `VoucherSearch` làm ô tìm kiếm trong header.
   - `VoucherProductDropdown` mount trong `searchSlot` với `products={searchResults}`, `searchValue={searchTerm}`, `open={showSearchResults}`.
   - `DisposalItemsTable` → `VoucherTable` + render rows bằng `VoucherTableRow`
   - **Trong `VoucherTableRow`**: khi `product?.hasBatches && product?.lots?.length > 0`, render `<DisposalLotSelector>` (giữ nguyên import từ `components/disposal-form/DisposalLotSelector`). Giữ nguyên `useEffect` khóa số lượng khi `reason === 'Hàng hết hạn'`.
   - `InfoSection` → `VoucherSection` + `VoucherField` + `VoucherInput`
   - `ReasonSection` → `VoucherSection` + `VoucherSelect`
   - `NoteSection` → `VoucherSection` + `VoucherTextarea`
   - `ActionFooter` → `VoucherActions` + `VoucherButton`
4. Cập nhật CSS:
   - Giản lược `pages/Disposals.css` chỉ giữ style cho list view.
   - Xóa CSS của `DisposalProductSearch`, `DisposalItemsTable`, `DisposalItemRow` nếu không còn dùng.
5. Backup trước khi sửa.

**Acceptance criteria:**
- [ ] `pages/DisposalForm.tsx` dùng toàn bộ components từ `components/voucher-form/`.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Tạo/sửa/hoàn thành phiếu xuất hủy hoạt động đúng.
- [ ] **Xuất hủy hàng hết hạn**: chọn lô qua `DisposalLotSelector` (nhúng trong `VoucherTableRow`) → SL tự khóa theo lô → hoàn thành đúng.
- [ ] Giao diện đồng nhất với design tokens.

**Cấm kỵ:** Không thay đổi logic xuất hủy, validation, API calls. Không xóa `DisposalDetailModal`, `DisposalLotSelector`.

---

### Phase 7 — Rollout: ImportGoods

**Mục tiêu:** Áp dụng system lên `pages/ImportGoods.tsx`.

**Yêu cầu:**
- Thay thế `ImportProductSearch` bằng `VoucherProductDropdown` (giữ nguyên logic keyboard navigation / click-outside).
- Thay thế `ImportItemsTable` + `ImportItemRow` bằng `VoucherTable` + `VoucherTableRow`.
- **Giữ nguyên `LotExpiryPopover`** — không thay bằng `VoucherPopover` trong phase này vì logic nhập lô/HSD phức tạp.
- Thay thế các sidebar sections bằng `VoucherSection` + `VoucherField` + `VoucherInput` + `VoucherSelect` + `VoucherTextarea`.
- Thay thế `ActionFooter` bằng `VoucherActions` + `VoucherButton`.
- Thay thế `TotalsSection` bằng `VoucherTotals`.
- `VoucherSearch` (input shell) làm ô tìm kiếm trong header.
- Bỏ qua việc xóa `ImportFormLayout` vì file không tồn tại.

**Hướng đi:**
1. Tương tự Phase 6 nhưng phức tạp hơn.
2. `VoucherSearch` làm ô tìm kiếm trong header.
3. `VoucherProductDropdown` mount trong `searchSlot` với `products={localProducts}`, `searchValue={searchTerm}`, `open={isSearchOpen}`.
4. `LotExpiryPopover` giữ nguyên, ghi chú cho phase nâng cấp sau.
5. Cập nhật `pages/ImportGoods.css`:
   - Xóa CSS cho create form.
   - Giữ CSS cho list view.

**Acceptance criteria:**
- [ ] `pages/ImportGoods.tsx` dùng toàn bộ components từ `components/voucher-form/`.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Tạo/sửa/hoàn thành phiếu nhập hoạt động đúng.
- [ ] Tính tiền, công nợ, lô/HSD hiển thị đúng.

**Cấm kỵ:** Không thay đổi logic tính tiền, công nợ, lô, API.

---

### Phase 8 — Rollout: InventoryCount

**Mục tiêu:** Áp dụng system lên `pages/InventoryCount.tsx`.

**Yêu cầu:**
- **Refactor `CountFormLayout`** để dùng `VoucherFormLayout` + `VoucherSection` + `VoucherField` + `VoucherTotals` bên trong, không xóa file.
- Thay thế `ProductSearchDropdown` bằng `VoucherSearch` + `VoucherProductDropdown`.
- Thay thế `CountItemsTable` bằng `VoucherTable` + `VoucherTableRow`.
- Thay thế `CountSidebar` sections bằng `VoucherSection` + `VoucherField` + `VoucherTotals`.
- Giữ nguyên logic tính chênh lệch, Excel import, scanner, diff display.

**Hướng đi:**
1. Mở `components/inventory-count/CountFormLayout.tsx`.
2. Thay thế bên trong bằng `VoucherFormLayout` + `VoucherSection` + `VoucherField` + `VoucherTotals`.
   - Giữ nguyên props `formData`, `setFormData`, `isEditing`, `children`, `onBack`, `actions`.
   - Tính `totalDiff`, `totalDiffValue` như cũ.
3. Mở `pages/InventoryCount.tsx`.
4. Thay `ProductSearchDropdown` UI bằng `VoucherSearch` + `VoucherProductDropdown`.
5. Thay `CountItemsTable` bằng `VoucherTable` + `VoucherTableRow`.
   - Lưu ý: `CountItemsTable` có logic hiển thị chênh lệch tăng/giảm bằng màu. Logic này cần giữ lại trong render row hoặc trong component con riêng của InventoryCount.
6. Cập nhật `pages/InventoryCount.css`:
   - Xóa CSS cho form create.
   - Giữ CSS cho list view.

**Acceptance criteria:**
- [ ] `pages/InventoryCount.tsx` và `CountFormLayout.tsx` dùng components từ `components/voucher-form/`.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Tạo/lưu nháp/hoàn thành phiếu kiểm kê hoạt động đúng.
- [ ] Chênh lệch hiển thị đúng.

**Cấm kỵ:** Không thay đổi logic tính chênh lệch, API.

---

### Phase 9 — Rollout: SupplierExchanges

**Mục tiêu:** Áp dụng system lên phần create form của `pages/SupplierExchanges.tsx`.

**Yêu cầu:**
- Tách phần create form thành `components/supplier-exchanges/ExchangeForm.tsx` (tùy chọn, nếu cần giảm độ dài page).
- Dùng `VoucherFormLayout` + các sub-components.
- Thay thế button/input/select trong create form bằng `VoucherButton`, `VoucherInput`, `VoucherSelect`, `VoucherField`.
- Thay thế banner cảnh báo bằng `VoucherBanner`.
- Thay thế sidebar sections bằng `VoucherSection` + `VoucherField`.
- **Không dùng `VoucherTable` / `VoucherTableRow`** — `SupplierExchanges` create view là wizard (lot grid + receipt list + exchange item cards), không phải table.
- `VoucherSearch` (input shell) làm ô tìm sản phẩm; `VoucherProductDropdown` làm dropdown kết quả.
- `VoucherEmpty` có thể dùng cho các trạng thái rỗng.

**Hướng đi:**
1. Xác định phần create form trong `pages/SupplierExchanges.tsx`.
2. (Tùy chọn) Tách thành `components/supplier-exchanges/ExchangeForm.tsx`.
3. Dùng `VoucherFormLayout` với:
   - `VoucherSearch` + `VoucherProductDropdown` cho tìm sản phẩm
   - `VoucherSection` cho thông tin NCC, phiếu nhập gốc
   - `VoucherButton` cho nút hành động
   - `VoucherBanner` cho cảnh báo
4. Giữ nguyên cấu trúc lot grid / receipt list / exchange item cards, chỉ thay input/button styling.
5. Cập nhật `pages/SupplierExchanges.css`:
   - Xóa CSS cho create form.
   - Giữ CSS cho list view.

**Acceptance criteria:**
- [ ] Phần create form dùng components từ `components/voucher-form/`.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Tạo phiếu đổi trả hàng NCC hoạt động đúng.
- [ ] Chọn NCC, phiếu nhập gốc, lô, hoàn thành đúng.

**Cấm kỵ:** Không thay đổi logic đổi hàng NCC, API.

---

### Phase 10 — Cleanup & Verification

**Mục tiêu:** Dọn dẹp dead code, CSS thừa, và verify toàn bộ hệ thống.

**Yêu cầu:**
- Xóa CSS cũ không còn dùng.
- Xóa dead components.
- Grep kiểm tra không còn import các components cũ.
- Chạy `npm run lint` và `npm run build`.
- Manual test 4 flow.
- Test responsive desktop/tablet/mobile.

**Hướng đi:**
1. Grep các components cũ:
   ```powershell
   Select-String -Path "components", "pages" -Pattern "ImportProductSearch|ImportItemsTable|ImportItemRow|DisposalProductSearch|DisposalItemsTable|DisposalItemRow|ProductSearchDropdown|CountItemsTable" -Include *.tsx
   ```
   > Nếu còn import ở đâu đó, quay lại phase tương ứng để thay thế hoàn tất trước khi xóa.
2. Xóa file CSS cũ nếu không còn import.
3. Xóa dead components **sau khi đã xác nhận không còn import**:
   - `components/import-goods/ImportFormLayout.tsx` / `.css` — chỉ xóa nếu tồn tại.
   - `components/disposal-form/DisposalFormLayout.tsx` / `.css` — chỉ xóa nếu tồn tại.
   - `components/inventory-count/CountFormLayout.css` — chỉ xóa nếu tồn tại.
   - **Không xóa** `components/inventory-count/CountFormLayout.tsx` vì đang được dùng; chỉ xóa nếu đã refactor hoàn toàn vào `pages/InventoryCount.tsx` (không khuyến khích).
   - **KHÔNG XÓA** `components/disposal-form/DisposalDetailModal.tsx` / `.css` — thuộc list view `pages/Disposals.tsx`, ngoài scope voucher form.
   - **KHÔNG XÓA** `components/disposal-form/DisposalLotSelector.tsx` / `.css` — vẫn được nhúng trong `VoucherTableRow` của DisposalForm sau Phase 6.
   - **KHÔNG XÓA** `components/import-goods/LotExpiryPopover.tsx` / `.css` — giữ nguyên theo Phase 7.
4. Xóa demo page `components/voucher-form/__demo.tsx` nếu có.
5. Chạy `npm run lint`.
6. Chạy `npm run build`.
7. Manual test:
   - Tạo phiếu nhập → hoàn thành.
   - Tạo phiếu kiểm kê → lưu nháp → hoàn thành.
   - Tạo phiếu xuất hủy → hoàn thành.
   - Tạo phiếu đổi hàng NCC → hoàn thành.
   - **Xuất hủy hàng hết hạn**: chọn lô qua `DisposalLotSelector` → SL tự khóa → hoàn thành đúng.
   - **Nhập hàng có lô/HSD**: nhập lô qua `LotExpiryPopover` → hoàn thành đúng.
   - **List view `Disposals.tsx`**: mở `DisposalDetailModal` vẫn hoạt động (không bị vỡ).
8. Test responsive:
   - Desktop (>1024px)
   - Tablet (768–1023px)
   - Mobile (<768px)

**Acceptance criteria:**
- [ ] Không còn file CSS/components cũ không dùng.
- [ ] Grep không còn import components cũ.
- [ ] `DisposalDetailModal`, `DisposalLotSelector`, `LotExpiryPopover`, `CountFormLayout.tsx` vẫn tồn tại và hoạt động (không xóa nhầm).
- [ ] `TextInput` / `ActionButton` toàn cục không bị thay đổi.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] 4 flow nghiệp vụ hoạt động đúng.
- [ ] Xuất hủy hàng hết hạn chọn lô đúng. Nhập hàng có lô/HSD đúng.
- [ ] List view `Disposals.tsx` mở detail modal vẫn hoạt động.
- [ ] Responsive desktop/tablet/mobile OK.

**Cấm kỵ:** Không thêm feature mới. Chỉ dọn dẹp và verify.

---

## 8. Dependencies

Phương án A chọn **Minimal** — không thêm dependencies mới.

Nếu trong tương lai muốn nâng cấp (phase riêng), có thể thêm:
- `class-variance-authority`
- `tailwind-merge`
- `radix-ui` (hoặc các `@radix-ui/react-*` riêng lẻ)
- `@base-ui/react` (cho combobox)

---

## 9. Risks & Mitigation

| Risk | Mức độ | Mitigation |
|------|--------|------------|
| CSS mới xung đột CSS cũ | Trung bình | Refactor từng màn hình, chạy lint/build sau mỗi màn. |
| Responsive bị hỏng | Trung bình | Giữ nguyên breakpoints và layout structure từ `VoucherFormLayout.css`; test tablet/mobile. |
| Business logic bị ảnh hưởng | Trung bình | Scope lock — không đụng handlers/state/API. |
| Màn hình phức tạp kéo dài | Trung bình | Làm DisposalForm pilot trước, chia sub-tasks. |
| Demo components bị sót | Thấp | Cleanup checklist phase 10. |
| Xóa nhầm file đang được import | **Cao** | Chạy `grep` trước khi xóa; `CountFormLayout.tsx` vẫn đang dùng. |
| Mất keyboard navigation trong search | **Cao** | Dùng `VoucherProductDropdown` thay vì `VoucherSearch` input shell cho dropdown phức tạp. |
| UI `SupplierExchanges` bị vỡ | **Cao** | Không ép `VoucherTable`; giữ cấu trúc wizard, chỉ thay input/button/section. |
| `LotExpiryPopover` bị thay sai | Trung bình | Giữ nguyên trong phase này, ghi chú phase nâng cấp. |
| Xóa nhầm `DisposalDetailModal` | **Cao** | Component thuộc list view `Disposals.tsx`, ngoài scope. Đã thêm rule 14 + ghi chú Phase 10. |
| Mất logic `DisposalLotSelector` khi thay `DisposalItemRow` | **Cao** | Phải nhúng lại `DisposalLotSelector` vào `VoucherTableRow` khi `hasBatches`. Đã thêm rule 15 + hướng dẫn Phase 6. |
| Thay nhầm `TextInput`/`ActionButton` toàn cục | Trung bình | 2 component dùng ở 9 page. Đã thêm rule 13: chỉ dùng `VoucherButton`/`VoucherInput` trong voucher forms. |

---

## 10. Success Criteria tổng

- [ ] Tất cả UI controls trong 4 màn phiếu đến từ `components/voucher-form/` (nơi phù hợp).
- [ ] Muốn đổi button → sửa `VoucherButton.tsx/css`.
- [ ] Muốn đổi input → sửa `VoucherInput.tsx/css`.
- [ ] Muốn đổi bảng → sửa `VoucherTable.tsx/css`.
- [ ] Muốn đổi layout chung → sửa `VoucherFormLayout.tsx/css`.
- [ ] Không còn dead code layout cũ (chỉ xóa sau khi xác nhận không còn import).
- [ ] `CountFormLayout.tsx` vẫn tồn tại hoặc đã được refactor an toàn vào `pages/InventoryCount.tsx`.
- [ ] `DisposalDetailModal` vẫn hoạt động đúng trong list view `Disposals.tsx` (không bị đụng).
- [ ] `DisposalLotSelector` vẫn hoạt động đúng khi chọn lô xuất hủy hàng hết hạn (nhúng trong `VoucherTableRow`).
- [ ] `TextInput` / `ActionButton` toàn cục không bị thay đổi (9 page khác vẫn dùng được).
- [ ] Keyboard navigation trong search dropdown vẫn hoạt động.
- [ ] `SupplierExchanges` wizard vẫn hoạt động đúng (lot grid, receipt list, exchange item cards).
- [ ] `LotExpiryPopover` vẫn hoạt động đúng (nếu chưa thay).
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] 4 flow nghiệp vụ vẫn hoạt động đúng.
- [ ] Responsive OK.

---

## 11. Implementation Guardrails

### 11.1. Business Logic Protection Checklist

Trước khi merge kết quả của mỗi phase, kiểm tra bắt buộc:

- [ ] **`TotalsSection`** logic không bị di chuyển vào `VoucherTotals`. `VoucherTotals` chỉ là display component; `needToPay`, `debtDelta`, `paidAmount` auto-fill phải ở lại `pages/ImportGoods.tsx`.
- [ ] **`InventoryCount`** vẫn dùng client-side filter hoặc đã chuyển đổi rõ ràng sang `mode="client"`/`mode="server"` của `VoucherProductDropdown` mà không phá flow hiện tại.
- [ ] **`SupplierSection`** combobox logic không bị xóa. Nếu dùng `VoucherInput` bên trong, chỉ thay vỏ input; logic filter/click-outside/dropdown state giữ nguyên.
- [ ] **`DisposalItemRow`** logic khóa SL khi `reason === 'Hàng hết hạn'` vẫn còn. `DisposalLotSelector` phải được nhúng lại trong `VoucherTableRow` khi `hasBatches`.
- [ ] **`ImportItemRow`** tính line total vẫn đúng. `VoucherTableRow` không tự tính toán — page hoặc render prop truyền giá trị đã tính.
- [ ] **`VoucherSearch` / `VoucherProductDropdown`** giữ nguyên keyboard navigation, click-outside, scroll-into-view và highlight state; không đổi sang shell input đơn thuần khi dropdown phức tạp vẫn cần hành vi cũ.
- [ ] **`SupplierExchanges`** không bị ép table template; wizard lot grid / receipt list / exchange item cards phải giữ nguyên cấu trúc, chỉ thay input/button/section styling.
- [ ] **`DisposalDetailModal`** không bị đụng vì thuộc list view `Disposals.tsx`.
- [ ] **`LotExpiryPopover`** vẫn giữ nguyên trong Phase 7 nếu chưa có quyết định riêng để thay thế.
- [ ] Handlers, validation, API calls, `types.ts`, Supabase RPC/migrations không bị thay đổi.

### 11.2. CSS Cleanup Audit Checklist

Trước khi xóa bất kỳ file CSS hoặc class nào, bắt buộc kiểm tra:

- [ ] `grep` xác nhận class / file CSS không còn được import trong page/component con.
- [ ] Class đó chỉ phục vụ create form hoặc component đã được thay thế bằng `components/voucher-form/`.
- [ ] Không xóa nhầm CSS thuộc list view (`Disposals`, `InventoryCount`, `SupplierExchanges`, `ImportGoods`).
- [ ] Không xóa nhầm CSS của `DisposalDetailModal`, `DisposalLotSelector`, `LotExpiryPopover`, `CountFormLayout.tsx`.
- [ ] Nếu class còn dùng ở responsive/mobile/tablet variant thì phải giữ lại hoặc tách ra file riêng trước khi xóa.
- [ ] Sau khi xóa CSS phải chạy `npm run lint` và `npm run build` để phát hiện style-driven TSX regressions.

### 11.3. Visual Regression Baseline

Vì plan thay đổi UI nhiều, cần chụp ảnh màn hình 4 form trước và sau mỗi phase lớn. Đây là **checkpoint bắt buộc** trước khi khóa phase và chuyển sang phase kế tiếp:

**Baseline cần lưu:**
- `ImportGoods` create form
- `InventoryCount` form view
- `DisposalForm` create form
- `SupplierExchanges` create form

**Trạng thái baseline cần có cho mỗi form:**
- Empty state / no data state
- Search dropdown mở
- Row/item đã thêm 1-2 item mẫu
- Disabled/completed state (nếu form có)
- Modal/popup liên quan nếu có (`LotExpiryPopover`, `DisposalLotSelector`)

**Checklist so sánh trước/sau:**
- [ ] Không vỡ layout tổng thể
- [ ] Không mất padding/margin/radius/shadow
- [ ] Không đổi kích thước button/input ngoài chủ đích
- [ ] Không overflow ngang/dọc bất thường
- [ ] Search dropdown vẫn nằm đúng vị trí và không che mất input
- [ ] Table / row / section vẫn đúng hierarchy
- [ ] Mobile breakpoints không vỡ

**Cách lưu baseline:**
- Chụp lại cùng viewport, cùng data/state, cùng theme.
- Đặt tên file theo format `planA-[phase]-[page]-[viewport].png`.
- Chỉ chụp lại baseline khi UI thật sự thay đổi; nếu phase chỉ cleanup import/CSS không đổi visual thì chỉ cần verify nhanh.

**Điểm chốt kiểm tra bắt buộc:**
- Sau mỗi phase lớn (Phase 6, 7.3, 8.2, 9.2, 10.4), phải có một bước review baseline riêng trước khi sang phase kế tiếp.

### 11.4. Rollback Procedure

Project không có git, backup bằng copy folder. Quy trình rollback:

1. **Backup điểm:**
   - Trước Phase 1.
   - Trước Phase 6.
   - Trước Phase 7.1 (bắt đầu refactor ImportGoods).
   - Trước Phase 8.1 (bắt đầu refactor InventoryCount).
   - Trước Phase 9.1 (bắt đầu refactor SupplierExchanges).
   - Trước Phase 10.1 (bắt đầu cleanup).
2. **Khi phát hiện lỗi nghiệm trọng** (không build được, mất dữ liệu nghiệp vụ, UI vỡ không fix nổi trong 30 phút):
   - Dừng phase hiện tại.
   - Restore từ backup gần nhất.
   - Ghi chú lỗi, nguyên nhân, và gửi handoff cho phase sau.
   - Không tiếp tục plan cho đến khi lỗi được phân tích và có phương án.
3. **Khi rollback một phase UI:**
   - Khôi phục lại toàn bộ file đã chạm trong phase đó, không cherry-pick từng class rời.
   - Chạy lại `npm run lint` và `npm run build` ngay sau khi restore để đảm bảo trạng thái sạch.
4. **Lưu ý:** Backup phải chứa toàn bộ project folder, bao gồm `node_modules` nếu cần rebuild nhanh.

### 11.5. Handoff Template giữa các sub-phase

Mỗi sub-phase kết thúc phải ghi lại (dán vào cuối chat hoặc file handoff):

```
## Handoff — [Sub-phase name]
- Files đã sửa: [liệt kê]
- Component cũ chưa xóa (để sub-phase sau xóa): [liệt kê]
- Lỗi/lưu ý ngoài scope: [liệt kê]
- Build status: `npm run lint` [PASS/FAIL] | `npm run build` [PASS/FAIL]
- Backup path: [nếu có]
- Màn hình cần test tiếp theo: [nếu có]
```

---

## 12. Ghi chú cho người thực hiện

- **Không code tất cả một lúc.** Làm từng phase, verify từng phase.
- **Backup trước mỗi phase lớn.**
- **Nếu phát hiện bug nghiệp vụ trong lúc refactor**, dừng lại, ghi chú, không tự sửa trong phase đó.
- **Nếu một component cũ quá phức tạp** (ví dụ `LotExpiryPopover`), có thể giữ nguyên và đánh dấu "phase nâng cấp sau".
- **Ưu tiên visual consistency** hơn là tái cấu trúc sâu.
- **Không xóa file nếu chưa chạy `grep` xác nhận không còn import.** Đặc biệt `CountFormLayout.tsx` vẫn đang dùng.
- **VoucherSearch chỉ là input shell.** Đối với dropdown phức tạp, dùng `VoucherProductDropdown` hoặc giữ component cũ.
- **SupplierExchanges không dùng table.** Giữ cấu trúc wizard, chỉ đồng nhất input/button/section.
- **Test keyboard navigation sau mỗi phase** có search dropdown.
- **`DisposalDetailModal` không thuộc scope** — thuộc list view `Disposals.tsx`, không đụng.
- **`DisposalLotSelector` phải nhúng lại** vào `VoucherTableRow` khi thay `DisposalItemRow` ở Phase 6 — có logic khóa SL hàng hết hạn.
- **`TextInput`/`ActionButton` là component toàn cục** (9 page dùng) — không thay, chỉ tạo `VoucherButton`/`VoucherInput` riêng cho voucher forms.

---

## 13. Các điều chỉnh cần thiết trước khi thực hiện plan

Trước khi bắt đầu Phase 1, cần thực hiện các bước sau để tránh lỗi và rework:

1. **Cập nhật hiện trạng đúng trong Phase 0**
   - Xác nhận `ImportFormLayout` / `DisposalFormLayout` đã không còn tồn tại.
   - Xác nhận `CountFormLayout.tsx` vẫn đang được import và dùng trong `pages/InventoryCount.tsx`.
   - Xác nhận `DisposalProductSearch.css` không tồn tại (chỉ có `.tsx`).
   - Xác nhận `DisposalDetailModal.tsx` / `.css` đang dùng trong `pages/Disposals.tsx` — **ngoài scope**.
   - Xác nhận `DisposalLotSelector.tsx` / `.css` đang dùng trong `DisposalItemRow.tsx` — **phải giữ và nhúng lại**.
   - Ghi chú rõ file nào thực sự cần xóa, file nào cần refactor, file nào giữ nguyên.

2. **Định nghĩa props API trước khi code**
   - Tạo file `components/voucher-form/README.md` hoặc ghi chú trong `index.ts` định nghĩa:
     - `VoucherFormLayoutProps` (giữ nguyên interface hiện tại).
     - `VoucherButtonProps` variants.
     - `VoucherFieldProps` generic.
     - `VoucherTableProps` generic.
     - `VoucherProductDropdownProps` (tương thích `ImportProductSearch` / `DisposalProductSearch` / `ProductSearchDropdown`).
     - `VoucherTableRowProps` phải hỗ trợ **slot/render prop** để nhúng `DisposalLotSelector` / `LotExpiryPopover` (không thay hardcoded — mỗi màn có logic lô khác nhau).

3. **Xác định rõ components nào cần tạo / không cần tạo**
   - Tạo: layout, controls, section, button, table, row, totals, search shell, product dropdown, **add button**.
   - Không tạo: pagination, status badge, dropdown, context menu, popover (trừ khi delay).
   - **Không thay thế**: `TextInput`, `ActionButton` (toàn cục, 9 page dùng), `DisposalDetailModal`, `DisposalLotSelector`, `LotExpiryPopover`.

4. **Xử lý `SupplierExchanges` riêng biệt**
   - Không ép table template.
   - Tạo checklist riêng cho màn này: giữ wizard, thay input/button/section.

5. **Kiểm tra Tailwind + design tokens**
   - Xác định cách components mới dùng CSS variables từ `design-system-tokens.css`.
   - Tránh hardcoded colors trong `VoucherButton.css` / `VoucherInput.css`.
   - Các page vẫn dùng Tailwind bên ngoài form voucher là chấp nhận được.

6. **Chuẩn bị test plan**
   - Test keyboard navigation: ↑ ↓ Enter Esc trong search dropdown.
   - Test 4 flow nghiệp vụ.
   - **Test chọn lô cho xuất hủy hàng hết hạn** (verify `DisposalLotSelector` vẫn hoạt động sau Phase 6).
   - **Test nhập lô/HSD cho phiếu nhập** (verify `LotExpiryPopover` vẫn hoạt động sau Phase 7).
   - Test responsive: desktop >1024px, tablet 768–1023px, mobile <768px.

7. **Backup project**
   - Vì không có git, backup toàn bộ folder trước Phase 1.

---

## 14. Appendix — Các file cần chạm

### Layout & Foundation
- `components/voucher-form/index.ts`
- `components/voucher-form/VoucherFormLayout.tsx`
- `components/voucher-form/VoucherFormLayout.css`
- `components/voucher-form/VoucherHeader.tsx/css`
- `components/voucher-form/VoucherSidebar.tsx/css`
- `components/voucher-form/VoucherActions.tsx/css`
- `components/voucher-form/VoucherBanner.tsx/css`
- `components/voucher-form/VoucherScrollArea.tsx/css`
- `components/voucher-form/VoucherSection.tsx/css`
- `components/voucher-form/VoucherSectionHeader.tsx/css`
- `components/voucher-form/VoucherSectionContent.tsx/css`

### Controls
- `components/voucher-form/VoucherButton.tsx/css`
- `components/voucher-form/VoucherInput.tsx/css`
- `components/voucher-form/VoucherTextarea.tsx/css`
- `components/voucher-form/VoucherSelect.tsx/css`
- `components/voucher-form/VoucherLabel.tsx/css`
- `components/voucher-form/VoucherField.tsx/css`
- `components/voucher-form/VoucherToggle.tsx/css`

### Data
- `components/voucher-form/VoucherSearch.tsx/css`
- `components/voucher-form/VoucherProductDropdown.tsx/css`
- `components/voucher-form/VoucherAddButton.tsx/css`
- `components/voucher-form/VoucherTable.tsx/css`
- `components/voucher-form/VoucherTableRow.tsx/css`
- `components/voucher-form/VoucherEmpty.tsx/css`
- `components/voucher-form/VoucherTotals.tsx/css`

### Overlays (tùy chọn / phase sau)
- `components/voucher-form/VoucherPopover.tsx/css` (chỉ tạo nếu quyết định thay `LotExpiryPopover`)

### Pages
- `pages/ImportGoods.tsx`
- `pages/ImportGoods.css`
- `pages/DisposalForm.tsx`
- `pages/Disposals.css`
- `pages/InventoryCount.tsx`
- `pages/InventoryCount.css`
- `pages/SupplierExchanges.tsx`
- `pages/SupplierExchanges.css`

### Components cũ cần xóa
- `components/import-goods/ImportFormLayout.tsx`
- `components/import-goods/ImportFormLayout.css`
- `components/disposal-form/DisposalFormLayout.tsx`
- `components/disposal-form/DisposalFormLayout.css`
- `components/inventory-count/CountFormLayout.css` (nếu còn)

### Components KHÔNG xóa (giữ nguyên — ngoài scope hoặc vẫn dùng sau refactor)
- `components/disposal-form/DisposalDetailModal.tsx` / `.css` — thuộc list view `pages/Disposals.tsx`.
- `components/disposal-form/DisposalLotSelector.tsx` / `.css` — nhúng trong `VoucherTableRow` của DisposalForm.
- `components/import-goods/LotExpiryPopover.tsx` / `.css` — giữ nguyên theo Phase 7.
- `components/inventory-count/CountFormLayout.tsx` — vẫn dùng, chỉ refactor nội bộ.
- `components/TextInput.tsx` / `components/ActionButton.tsx` — component toàn cục, không thuộc scope.

### Utilities
- `utils/classNames.ts` (mới)
- `hooks/useClickOutside.ts` (nếu cần)
