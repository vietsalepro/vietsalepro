# Tổng kết đánh giá PLAN A — Voucher Form Component System

> **Project:** VietSales Pro v7  
> **File plan gốc:** `PLAN_A_VoucherFormComponentSystem_Master.md`  
> **File sub-phase:** `PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`  
> **Ngày đánh giá:** 2026-07-03  
> **Người đánh giá:** Devin (lần 3)

---

## 1. Tổng kết đánh giá

**Phương án A (Minimal Component System) là khả thi**, có logic tốt, đúng hướng tập trung hóa UI 4 màn phiếu (Nhập hàng | Kiểm kê | Xuất hủy | Đổi hàng NCC). Tuy nhiên **plan hiện tại chưa đủ chi tiết để 100% thành công không lỗi tồn đọng**. Có một số khe hở giữa "chỉ thay UI" và thực tế code, đặc biệt ở các component section phức tạp, chiến lược thay row component, và đường dẫn import khi di chuyển `VoucherFormLayout`.

Plan **không đụng database SQL** nếu thực hiện đúng scope. Nhưng có nguy cơ vô tình đụng **business logic / code-logic** ở 3 điểm: `TotalsSection`, `InventoryCount` search, và `SupplierSection` combobox.

**Baseline hiện tại:** `npm run lint` PASS. Các component `VoucherFormLayout`, `DisposalDetailModal`, `DisposalLotSelector` đang tồn tại và được dùng đúng như plan mô tả.

---

## 2. Những điểm tốt của plan

| Điểm | Ghi chú |
|------|---------|
| Scope lock rõ ràng | 15 rule hạn chế lan mang, đặc biệt rule 13 (không thay `TextInput`/`ActionButton` toàn cục) và rule 14-15 (giữ `DisposalDetailModal`, `DisposalLotSelector`). |
| Phân phase hợp lý | Audit → Foundation → Controls → Data → Rollout từ màn đơn giản đến phức tạp. |
| Chia sub-phase đúng | Phân tích context 250K tokens là đúng; các phase 7/8/10 cần chia nhỏ. |
| Không thêm dependency | Phù hợp với codebase hiện tại (không có `clsx`/`classnames` trong source, nên tạo `utils/classNames.ts` là hợp lý). |
| Giữ `LotExpiryPopover` | Đúng, vì component này có logic nhập lô/HSD phức tạp. |
| Test plan đầy đủ | 4 flow + keyboard + responsive + chọn lô hết hạn. |
| Lint/build sau mỗi phase | Đúng quy trình. |

---

## 3. Các lỗi / khe hở / rủi ro cụ thể

### 3.1. Lỗi trong chính tài liệu plan

**Bảng tổng hợp sub-phase trong `PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md` bị duplicate nhiều hàng** (lines 748–784). Các hàng 7.2a, 7.2b, 7.3, 8.1, 8.2, 9.1, 9.2, 10.1a–b, 10.3–4 lặp lại 3 lần. Đây là lỗi cấu trúc tài liệu, cần sửa trước khi dùng làm plan tổng.

### 3.2. Khe hở: Di chuyển `VoucherFormLayout` sang `components/voucher-form/`

Plan vẽ directory tree có `components/voucher-form/VoucherFormLayout.tsx`, nhưng **không nói rõ cách xử lý import cũ**:

- 4 page hiện import: `import { VoucherFormLayout } from '../components/VoucherFormLayout';`
- `CountFormLayout.tsx` import: `import { VoucherFormLayout } from '../VoucherFormLayout';`

Khi tạo file mới trong `components/voucher-form/`, phải chọn 1 trong 3:

1. Xóa file cũ và update 5 import path.
2. Để file cũ là re-export wrapper.
3. Giữ cả 2 (không nên).

Plan chưa quyết định rõ. Nếu implement không đồng nhất sẽ bị lỗi TS hoặc duplicate.

### 3.3. Khe hở: `VoucherInput` / `VoucherButton` chưa đủ props để thay thế thực tế

`TextInput` hiện tại có rất nhiều props: `label`, `helperText`, `error`, `prefixIcon`, `suffixIcon`, `fullWidth`, `size`, `inputMode`, `min`, `max`, `list`, `id`, `aria-label`, `disabled`, `required`, v.v.

Plan chỉ liệt kê `VoucherInput` props: `type`, `value`, `onChange`, `placeholder`, `disabled`, `error`, `className`. **Thiếu `size`, `fullWidth`, `prefixIcon`, `suffixIcon`, `inputMode`, `list`, `min/max`, `id`, `aria-label`**.

Tương tự `ActionButton` có `icon`, `className`, `title`, `aria-label`, `fullWidth` — plan chỉ liệt kê `VoucherButton` có `variant`, `size`, `fullWidth`, `loading`, `disabled`, `children`, `onClick`, `type` — **thiếu `icon`**, trong khi các row hiện tại dùng `icon={<Trash2 />}` rất nhiều.

Nếu không bổ sung đầy đủ props, việc thay `TextInput`/`ActionButton` trong các row/component con sẽ bị lỗi TS hoặc phải giữ lại `TextInput`/`ActionButton` trong render prop — đi ngược lại mục tiêu "đồng nhất UI".

### 3.4. Khe hở: Chiến lược thay row component chưa rõ

`ImportItemRow` và `DisposalItemRow` hiện tại:

- Dùng `<tr>` trực tiếp.
- Dùng `TextInput`/`ActionButton` bên trong.
- `ImportItemRow` tự quản lý input số lô, HSD, SL, đơn giá, giảm giá.
- `DisposalItemRow` nhúng `DisposalLotSelector` và có `useEffect` khóa SL khi hàng hết hạn.

Plan nói "Thay `DisposalItemsTable` + `DisposalItemRow` bằng `VoucherTable` + `VoucherTableRow`" và "nhúng lại `DisposalLotSelector`". Nhưng chưa giải thích:

- `VoucherTableRow` sẽ nhận dữ liệu qua props hay render prop?
- Các input số lượng/đơn giá/HSD sẽ dùng `VoucherInput` hay vẫn dùng `TextInput` trong render prop?
- Nếu dùng `VoucherInput`, `VoucherInput` phải hỗ trợ `type="number"`, `inputMode="numeric"`, `list` (datalist), `min`, `max`, `size="sm"`.
- Nếu giữ `TextInput` trong render prop, thì mục tiêu "đồng nhất" bị giảm sút.

Đây là một trong những điểm dễ gây lỗi nhất nếu không định nghĩa rõ API của `VoucherTableRow`.

### 3.5. Khe hở: `ProductSearchDropdown` khác biệt cấu trúc so với `ImportProductSearch`/`DisposalProductSearch`

| | `ImportProductSearch`/`DisposalProductSearch` | `ProductSearchDropdown` |
|---|---|---|
| Cấu trúc | Dropdown-only, mount trong `searchSlot` | Input + dropdown trong 1 component |
| Props | `products`, `searchValue`, `open`, `onRequestClose`, `onSelectProduct` | `searchTerm`, `onSearchChange`, `results`, `onSelectProduct` |
| Keyboard | Có (↑↓EnterEsc) | Không |
| Lọc | Client-side filter trong component | Parent truyền `results` đã lọc |

Plan nói "Thay `ProductSearchDropdown` bằng `VoucherSearch` + `VoucherProductDropdown`" — đúng hướng. Nhưng cần làm rõ:

- `InventoryCount` hiện dùng client-side filter (`products.filter`). Nếu `VoucherProductDropdown` lọc client-side giống `ImportProductSearch`, thì `InventoryCount` phải đổi từ truyền `results={filteredProductsForCount}` sang `products={products}` — thay đổi cách truyền data (không phải business logic, nhưng vẫn là code change).
- Nếu `VoucherProductDropdown` bắt buộc server-side search thì sẽ đụng business logic của `InventoryCount`.
- Nên định nghĩa `VoucherProductDropdown` hỗ trợ cả 2 mode: `mode="client"` (nhận `products` và tự lọc) hoặc `mode="server"` (nhận `results`).

### 3.6. Khe hở: Các section phức tạp trong sidebar không chỉ là UI

Plan nói chung chung "Thay các sidebar sections bằng `VoucherSection` + `VoucherField`". Thực tế:

- **`TotalsSection`** (ImportGoods): chứa business logic tính `needToPay`, `debtDelta`, auto-fill `paidAmount`, và `useEffect`. `VoucherTotals` trong plan chỉ là display component `items: {label, value}[]`. Nếu thay `TotalsSection` bằng `VoucherTotals`, logic tính toán phải chuyển lên `pages/ImportGoods.tsx` — đây là code-logic change, không chỉ UI.
- **`SupplierSection`** (ImportGoods): combobox tìm NCC với click-outside, filter, dropdown state. Không phải native select đơn giản. `VoucherSelect` (native select) không thay thế được. Cần strategy riêng: giữ `SupplierSection` là custom component, chỉ thay `TextInput`/`ActionButton` bên trong bằng `VoucherInput`/`VoucherButton` (nếu đủ props).
- **`CountInfoSection`**: dùng `ModalInfoGrid` + `StatusBadge` + `TextInput`. `VoucherField` không có layout grid. Cần giữ `ModalInfoGrid` hoặc tạo `VoucherInfoGrid`.

Plan chưa phân loại rõ: component nào chỉ là UI wrapper, component nào là UI+logic và cần giữ logic.

### 3.7. Khe hở: `VoucherSection` vs `SectionBox` hiện có

`SectionBox` được dùng ở 22 file, trong đó có nhiều modal/page ngoài voucher form (`Dashboard`, `PayDebtModal`, `ProductEditModal`, `TaxCalculationModal`). Plan đúng khi không sửa `SectionBox` và tạo `VoucherSection` riêng. Tuy nhiên cần làm rõ:

- `VoucherSection` sẽ dùng class names hoàn toàn mới (`voucher-section-*`) hay kế thừa một phần từ `SectionBox`?
- Nếu kế thừa style, cần đảm bảo không ảnh hưởng đến `SectionBox` ở các modal khác.

### 3.8. Khe hở: CSS cleanup có thể ảnh hưởng list view

Mỗi page (`ImportGoods`, `InventoryCount`, `SupplierExchanges`) vừa có form view vừa có list view trong cùng file CSS. Plan nói "Xóa CSS cho create form, giữ CSS cho list view". Nhưng nhiều class names có thể dùng chung hoặc selector lồng nhau. Nếu xóa sai sẽ vỡ list view. Cần audit từng selector trước khi xóa.

### 3.9. Khe hở: Phase 5 Overlays "tùy chọn"

Plan để `VoucherPopover` là optional/delay. Điều này ổn, nhưng nếu team muốn đồng nhất popover sau này, cần ghi chú rõ ràng trong plan tổng.

---

## 4. Có đụng code-logic / database SQL không?

| Hạng mục | Kết luận | Phương án hiện tại |
|---|---|---|
| Database schema / RPC / migrations | **Không đụng** | Plan nói rõ không đụng. Code review xác nhận các page chỉ dùng `supabaseService` hiện có. |
| `types.ts` | **Không đụng** | Đúng theo scope lock. |
| API contracts | **Không đụng** | Đúng. |
| Business logic trong handlers | **Lý thuyết không, thực tế có nguy cơ** | `TotalsSection`, `InventoryCount` search, `SupplierSection` có thể bị đụng nếu implement không cẩn thận. |
| Routing | **Không đụng** | Đúng. |

**Không cần thay đổi SQL / Supabase nào** cho plan này. Nhưng cần phương án bảo vệ business logic trong các section phức tạp.

---

## 5. Cần bổ sung gì trước khi làm plan tổng 100%?

Tôi đề xuất thêm các mục sau vào plan tổng:

### 5.1. Sửa lỗi tài liệu

- Xóa các hàng duplicate trong bảng tổng hợp sub-phase.
- Kiểm tra lại cross-reference giữa master và sub-phase detail.

### 5.2. Thêm "Component Migration Strategy Matrix"

Tạo bảng liệt kê từng component cũ, phân loại:

| Component | Loại | Hành động | Component thay thế | Ghi chú |
|---|---|---|---|---|
| `ImportProductSearch` | UI-only | Xóa sau khi không import | `VoucherProductDropdown` | Dropdown-only, mount trong `searchSlot` |
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

### 5.3. Định nghĩa rõ API `VoucherInput` / `VoucherButton`

- `VoucherInput` nên extends `React.InputHTMLAttributes<HTMLInputElement>` giống `TextInput`, thêm `size`, `error`, `fullWidth`.
- `VoucherButton` nên thêm `icon`, `className`, `title`, `aria-label`.

### 5.4. Định nghĩa rõ API `VoucherTableRow`

Nên hỗ trợ:

- `children?: React.ReactNode` (toàn quyền render nội dung row)
- Hoặc `renderCells?: () => React.ReactNode`
- `selected?: boolean`
- `onClick?: () => void`

Để `DisposalLotSelector`, `LotExpiryPopover`, `TextInput`/`ActionButton` hoặc `VoucherInput`/`VoucherButton` có thể được nhúng từ page.

### 5.5. Định nghĩa rõ `VoucherProductDropdown` API

Nên hỗ trợ 2 mode:

- `mode="client"`: nhận `products: Product[]`, tự lọc theo `searchValue`.
- `mode="server"`: nhận `results: Product[]` (đã lọc sẵn).

Cả 2 mode đều giữ keyboard navigation như `ImportProductSearch`.

### 5.6. Làm rõ đường dẫn import

Quyết định 1 trong 2:

- **Option A:** Xóa `components/VoucherFormLayout.tsx` và `components/VoucherFormLayout.css`. Tạo `components/voucher-form/VoucherFormLayout.tsx`. Update import trong 5 file: `ImportGoods.tsx`, `DisposalForm.tsx`, `SupplierExchanges.tsx`, `InventoryCount.tsx`, `CountFormLayout.tsx`.
- **Option B:** Để lại `components/VoucherFormLayout.tsx` là re-export: `export * from './voucher-form/VoucherFormLayout';`.

### 5.7. Thêm "Business Logic Protection Checklist"

Trước khi merge mỗi phase, verify:

- [ ] `TotalsSection` logic không bị di chuyển vào `VoucherTotals`.
- [ ] `InventoryCount` vẫn dùng client-side filter hoặc đã chuyển đổi rõ ràng (không phá flow).
- [ ] `SupplierSection` combobox logic không bị xóa.
- [ ] `DisposalItemRow` logic khóa SL hết hạn vẫn còn.
- [ ] `ImportItemRow` tính line total vẫn đúng.

### 5.8. Thêm "Visual Regression Baseline"

Vì plan thay đổi UI nhiều, nên chụp ảnh màn hình 4 form trước và sau mỗi phase lớn (đặc biệt Phase 6, 7, 8, 9).

### 5.9. Thêm rollback procedure

Vì project không có git, cần quy định:

- Backup trước Phase 1, 6, 7.1, 8.1, 9.1, 10.1.
- Nếu một phase lỗi nghiêm trọng, restore từ backup gần nhất và dừng plan.

### 5.10. Thêm handoff template giữa các sub-phase

Mỗi sub-phase kết thúc phải ghi:

- File đã sửa.
- Component cũ chưa xóa (để phase sau xóa).
- Lỗi/lưu ý ngoài scope.
- Build/lint status.

---

## 6. Kết luận cuối cùng

Plan A **đã có nền tảng tốt, phương án hợp lý, không đụng database**. Nhưng để **100% thành công không lỗi tồn đọng**, cần:

1. **Sửa lỗi tài liệu** (duplicate rows).
2. **Bổ sung chiến lược migration chi tiết** cho từng component cũ.
3. **Định nghĩa đầy đủ API** của `VoucherInput`, `VoucherButton`, `VoucherTableRow`, `VoucherProductDropdown`.
4. **Làm rõ cách xử lý import path** khi di chuyển `VoucherFormLayout`.
5. **Thêm bảo vệ business logic** cho `TotalsSection`, `SupplierSection`, `InventoryCount` search.
6. **Thêm baseline visual + rollback procedure**.

Sau khi bổ sung các mục trên, plan sẽ đủ chắc chắn để bàn giao cho chat sau triển khai từng sub-phase.
