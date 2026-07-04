# Kế hoạch chi tiết — VoucherFormLayout SSOT cho 4 màn phiếu

> **Project:** VietSale Pro v7  
> **Mục tiêu:** Đồng bộ giao diện, CSS, bố cục, phong cách của 4 màn phiếu nhập liệu (Nhập hàng, Kiểm kê, Xuất hủy, Đổi hàng NCC) bằng cách dùng chung `VoucherFormLayout`. Tính năng / code / logic nghiệp vụ giữ nguyên.  
> **SSOT:** `components/VoucherFormLayout.tsx` + `components/VoucherFormLayout.css` — muốn thay đổi layout chung thì chỉ sửa 2 file này.  
> **Created:** 2026-07-02  
> **Based on:** `PLAN_01_VoucherFormLayout_SSOT_Overview.md`

---

## Nguyên tắc áp dụng cho toàn bộ plan

1. **Không đụng business logic** — handlers, validation, tính toán, API calls, state management giữ nguyên.
2. **Không đụng `types.ts`** — API contracts giữ nguyên.
3. **Không đụng database / Supabase** — chỉ làm frontend.
4. **Mỗi page chỉ được truyền content vào slot** — không tự định nghĩa layout riêng, không thêm class làm thay đổi grid/flex/width.
5. **Tất cả layout chung phải nằm trong `VoucherFormLayout`** — kể cả banner, stats row nếu cần.
6. **Sidebar sections chỉ dùng `SectionBox` + `SectionHeader` + `SectionContent`** — section chỉ cung cấp nội dung, không cung cấp layout.
7. **Xóa feature flag và dead code ngay sau khi ổn định** — không để nhánh V1 tồn tại lâu.
8. **Sau mỗi sub-phase phải chạy `npm run lint`** — để phát hiện lỗi sớm.
9. **Sau mỗi phase lớn phải test thủ công 1 flow** — để đảm bảo không hỏng nghiệp vụ.
10. **Không tạo migration / RPC / schema mới** — plan này chỉ là frontend layout refactor; toàn bộ thay đổi nằm trong `components/`, `pages/`, `features.ts` và các file CSS liên quan.
11. **Sau mỗi phase lớn nên tạo backup** — vì project không dùng git, nên copy toàn bộ project folder theo convention đã dùng ở Phase 0c (ví dụ: `vietsale-pro-v7_backup_voucher_layout_phase2_YYYYMMDD_HHMMSS`) để có điểm rollback an toàn hơn.
12. **Audit dead code triệt để — không chỉ component layout** — còn phải rà soát dead imports, dead topbar, dead CSS trong `index.css`, class CSS legacy (`ig-*`) và các `margin-bottom` dư thừa trong section CSS.
13. **Không để component / CSS / import "có thể còn dùng" mơ hồ** — mỗi file/class/import đều phải được grep xác nhận usage; nếu không còn dùng thì xóa hoặc đánh dấu rõ ràng.
14. **Edge cases visual phải được kiểm tra** — banner trong container có padding, `SectionBox` bị `VoucherFormLayout.css` override, `TextInput type="date"`, `SelectInput` không label, sidebar dài/actions sticky, responsive wizard UI.

---

## Phase 0 — Audit & Baseline

Mục tiêu: Xác định chính xác những gì cần sửa trước khi đụng vào code.

---

### Phase 0a — Grep & inventory file layout / CSS / flags

**Mục tiêu:** Liệt kê toàn bộ file layout, CSS, feature flags liên quan đến 4 màn phiếu.

**Các lệnh cần chạy:**

> **Môi trường Windows:** Project chạy trên Windows, nên dùng PowerShell hoặc `findstr`. Nếu đã cài Git Bash thì có thể dùng các lệnh `grep` gốc.

```powershell
# PowerShell — tìm các file FormLayout còn sót (loại trừ VoucherFormLayout ở bước phân tích)
# Lưu ý: dùng mảng string "components","pages" cho -Path để tương thích mọi phiên bản PowerShell
Get-ChildItem -Path "components","pages" -Recurse -File -Include *.tsx,*.ts,*.css | Select-String -Pattern "FormLayout" | Select-Object FileName, LineNumber, Line

# PowerShell — tìm các dead topbar component (thường đi kèm layout cũ)
Get-ChildItem -Path "components" -Recurse -File -Include *.tsx,*.ts | Select-String -Pattern "DisposalTopBar|ImportTopBar" | Select-Object FileName, LineNumber

# PowerShell — tìm các feature flags cũ
Get-ChildItem -Path "components","pages" -Recurse -File -Include *.tsx,*.ts | Select-String -Pattern "useRefactoredImportLayout|useRefactoredDisposalLayout|useRefactoredCountLayout"
Select-String -Path features.ts -Pattern "useRefactoredImportLayout|useRefactoredDisposalLayout|useRefactoredCountLayout"

# PowerShell — tìm các class CSS cũ liên quan đến layout
Get-ChildItem -Path "components","pages" -Recurse -File -Include *.tsx,*.ts,*.css | Select-String -Pattern "ig-layout|import-layout|disposal-layout|count-layout"

# PowerShell — tìm các class CSS legacy ig-* trong index.css (nhiều class này là dead code sau khi xóa V1 branch)
Select-String -Path index.css -Pattern "\.(ig-section|ig-card|ig-input|ig-btn|ig-textarea|ig-badge|ig-totals|ig-search|ig-title|ig-num|ig-body|ig-label|ig-card-flat|ig-muted)" | Select-Object LineNumber, Line

# PowerShell — tìm dead imports (ví dụ ImportTopBar được import nhưng không dùng)
Get-ChildItem -Path "pages" -Recurse -File -Include *.tsx,*.ts | Select-String -Pattern "ImportTopBar|DisposalTopBar|StatsSection" | Select-Object FileName, LineNumber, Line

# PowerShell — tìm import VoucherFormLayout
Get-ChildItem -Path "components","pages" -Recurse -File -Include *.tsx,*.ts | Select-String -Pattern "import.*VoucherFormLayout"

# PowerShell — kiểm tra sự tồn tại của pages/DisposalForm.css (file này được liệt kê trong PLAN_01 là "nếu có")
Test-Path pages/DisposalForm.css
```

Hoặc dùng `findstr` (CMD/PowerShell):

```cmd
findstr /s /i /n "FormLayout" components\*.tsx components\*.ts components\*.css pages\*.tsx pages\*.ts
findstr /s /i /n "DisposalTopBar ImportTopBar" components\*.tsx components\*.ts pages\*.tsx pages\*.ts
findstr /s /i /n "useRefactoredImportLayout useRefactoredDisposalLayout useRefactoredCountLayout" components\*.tsx components\*.ts features.ts
findstr /s /i /n "ig-layout import-layout disposal-layout count-layout" components\*.tsx components\*.ts components\*.css pages\*.tsx pages\*.ts
findstr /s /i /n "ImportTopBar DisposalTopBar StatsSection" pages\*.tsx pages\*.ts
findstr /s /i /n "import.*VoucherFormLayout" components\*.tsx components\*.ts pages\*.tsx pages\*.ts

REM CMD — kiểm tra sự tồn tại của pages/DisposalForm.css
if exist pages\DisposalForm.css (echo pages/DisposalForm.css EXISTS) else (echo pages/DisposalForm.css NOT FOUND)
```

**Output cần có:**
- Danh sách chính xác các file cần xóa (bao gồm dead topbar `ImportTopBar`/`DisposalTopBar`).
- Danh sách chính xác các file cần xóa nhánh V1 (bao gồm cả `ImportItemRow`, `ImportItemsTable`, `DisposalItemRow`, `DisposalItemsTable`).
- Danh sách class CSS legacy `ig-*` trong `index.css` cần audit.
- Danh sách dead imports cần xóa (ví dụ `ImportTopBar` trong `pages/ImportGoods.tsx`).
- Xác nhận page nào đã dùng `VoucherFormLayout`, page nào chưa.
- Xác nhận `pages/DisposalForm.css` có tồn tại hay không (nếu có thì cần rà soát ở Phase 2g).
- Xác nhận `useRefactoredCountLayout` không được import trong bất kỳ component/page nào.

**Acceptance criteria:**
- [ ] Có danh sách file dead code (bao gồm cả `ImportTopBar`/`DisposalTopBar` và các file CSS đi kèm).
- [ ] Có danh sách file còn nhánh V1 (bao gồm 4 file item row/table).
- [ ] Có xác nhận không còn page nào dùng `ImportFormLayout` / `DisposalFormLayout` / `ImportTopBar` / `DisposalTopBar`.
- [ ] Có xác nhận 4 file item row/table vẫn import feature flag và cần dọn V1.
- [ ] Có danh sách class CSS legacy `ig-*` trong `index.css` cần audit (không xóa ngay, chỉ đánh dấu nghi vấn).
- [ ] Có danh sách dead imports (ví dụ `ImportTopBar` import nhưng không dùng).
- [ ] Đã xác nhận sự tồn tại của `pages/DisposalForm.css`.

**Risk:** 🟢 Low  
**Rollback:** Không cần rollback vì chỉ đọc, không sửa code.

---

### Phase 0b — Tạo checklist audit và xác nhận baseline

**Mục tiêu:** Tổng hợp kết quả Phase 0a thành checklist cụ thể để dùng trong các phase sau.

**File cần tạo:** (tạm thời ghi trong file plan này hoặc ghi chú riêng)

```markdown
## Baseline Checklist

### Dead code cần xóa (Phase 6)
- [ ] components/import-goods/ImportFormLayout.tsx
- [ ] components/import-goods/ImportFormLayout.css
- [ ] components/import-goods/ImportTopBar.tsx
- [ ] components/import-goods/ImportTopBar.css
- [ ] components/disposal-form/DisposalFormLayout.tsx
- [ ] components/disposal-form/DisposalFormLayout.css
- [ ] components/disposal-form/DisposalTopBar.tsx
- [ ] components/disposal-form/DisposalTopBar.css
- [ ] components/disposal-form/DisposalSidebar/StatsSection.tsx
- [ ] components/disposal-form/DisposalSidebar/StatsSection.css
- [ ] components/inventory-count/CountFormLayout.css

### Feature flags cần xóa (Phase 6)
- [ ] useRefactoredImportLayout
- [ ] useRefactoredDisposalLayout
- [ ] useRefactoredCountLayout

### Files cần xóa nhánh V1
- [ ] components/import-goods/ImportSidebar/SupplierSection.tsx
- [ ] components/import-goods/ImportSidebar/ReceiptInfoSection.tsx
- [ ] components/import-goods/ImportSidebar/TotalsSection.tsx
- [ ] components/import-goods/ImportSidebar/NoteSection.tsx
- [ ] components/import-goods/ImportSidebar/ActionFooter.tsx
- [ ] components/import-goods/ImportItemRow.tsx
- [ ] components/import-goods/ImportItemsTable.tsx
- [ ] components/disposal-form/DisposalSidebar/InfoSection.tsx
- [ ] components/disposal-form/DisposalSidebar/StatsSection.tsx
- [ ] components/disposal-form/DisposalSidebar/ReasonSection.tsx
- [ ] components/disposal-form/DisposalSidebar/NoteSection.tsx
- [ ] components/disposal-form/DisposalSidebar/ActionFooter.tsx
- [ ] components/disposal-form/DisposalItemRow.tsx
- [ ] components/disposal-form/DisposalItemsTable.tsx

### Files cần tinh chỉnh (không xóa)
- [ ] components/VoucherFormLayout.tsx
- [ ] components/VoucherFormLayout.css
- [ ] components/inventory-count/CountFormLayout.tsx
- [ ] components/inventory-count/CountSidebar/CountInfoSection.tsx
- [ ] components/inventory-count/CountSidebar/CountSummary.tsx
- [ ] components/FormTextarea.tsx (tạo mới)
- [ ] components/FormTextarea.css (tạo mới)
- [ ] components/SummaryRow.tsx
- [ ] components/SummaryRow.css (tạo mới)
- [ ] pages/ImportGoods.tsx
- [ ] pages/InventoryCount.tsx
- [ ] pages/DisposalForm.tsx
- [ ] pages/SupplierExchanges.tsx
- [ ] features.ts

### CSS page-level cần rà soát (nếu tồn tại)
- [ ] pages/ImportGoods.css
- [ ] pages/SupplierExchanges.css
- [ ] pages/InventoryCount.css
- [ ] pages/DisposalForm.css (nếu tồn tại)

### CSS global cần audit (Phase 6c)
- [ ] index.css — các class `ig-*` legacy còn sót sau khi xóa V1 branch

### Dead imports cần rà soát
- [ ] `ImportTopBar` import trong `pages/ImportGoods.tsx` (không còn dùng)
- [ ] `DisposalTopBar` import trong `pages/DisposalForm.tsx` (nếu còn)
- [ ] `StatsSection` import trong `pages/DisposalForm.tsx` (nếu còn)
```

**Acceptance criteria:**
- [ ] Checklist hoàn chỉnh, không thiếu file.
- [ ] Đã đối chiếu với kết quả grep.

**Risk:** 🟢 Low  
**Rollback:** Không cần.

---

### Phase 0c — Xác nhận baseline và tạo backup trước refactor

**Mục tiêu:** Đảm bảo baseline đã được xác nhận và có điểm rollback an toàn trước khi bắt đầu đụng vào code.

**Các bước thực hiện:**

1. Review lại checklist từ Phase 0b với toàn bộ file liên quan:
   - Đối chiếu từng file dead code với kết quả grep.
   - Đối chiếu từng file có nhánh V1 với nội dung thực tế.
   - Đảm bảo không bỏ sót file nào liên quan đến 4 màn phiếu.

2. Tạo backup toàn bộ project (theo convention của dự án):

```bash
# Ví dụ: copy folder project sang backup
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_$(Get-Date -Format yyyyMMdd_HHmmss)" -Recurse
```

3. Xác nhận baseline hiện tại:
   - `npm run lint` pass trước khi bắt đầu.
   - `npm run build` pass trước khi bắt đầu.
   - Chụp ảnh màn hình 4 màn phiếu (nếu có thể) để so sánh sau refactor.

4. Lưu kết quả audit vào file ghi chú nhỏ trong thư mục plan:
   - `docs/plans/voucher-form-layout-ssot/BASELINE_AUDIT.md`

**Acceptance criteria:**
- [ ] Checklist đã được review đầy đủ.
- [ ] Backup project đã được tạo.
- [ ] `npm run lint` pass trước refactor.
- [ ] `npm run build` pass trước refactor.
- [ ] File `BASELINE_AUDIT.md` đã được tạo (nếu cần).

**Risk:** 🟢 Low  
**Rollback:** Nếu có lỗi sau này, restore từ backup.

---

### Phase 0d — Verify component dùng chung

**Mục tiêu:** Xác nhận các component dùng chung tồn tại và có đủ API để dùng trong 4 màn phiếu, tránh bị block giữa chừng.

**File kiểm tra:**
- `components/SectionBox.tsx` (hoặc `SectionBox/index.tsx`)
- `components/TextInput.tsx`
- `components/SelectInput.tsx`
- `components/ActionButton.tsx`
- `components/ModalInfoGrid.tsx`
- `components/SummaryRow.tsx`
- `components/StatusBadge.tsx`

**Các bước thực hiện:**

1. Đọc nhanh từng file trên.
2. Kiểm tra các prop/API tối thiểu:
   - `SectionBox`: hỗ trợ `className` và `children`.
   - `SectionHeader`: hỗ trợ `title`.
   - `SectionContent`: hỗ trợ `children`.
   - `TextInput`: hỗ trợ `type="date"`, `type="datetime-local"`, `disabled`, `size`, `fullWidth`, `value`, `onChange`.
     - Lưu ý: `TextInput` render `<input type="text" {...rest} />`, nên `type="date"` sẽ override. Cần kiểm tra CSS của `TextInput` có xử lý tốt icon date picker của browser không; nếu không, cần thêm CSS trong `VoucherFormLayout.css` hoặc tạo `FormDateInput` riêng.
   - `SelectInput`: hỗ trợ `value`, `onChange`, `options`, `disabled`, `label`, `fullWidth` (nếu chưa có thì dùng `TextInput type="select"` hoặc component picker chuẩn làm fallback).
     - Lưu ý: `SupplierExchanges` có trường select không có label. `SelectInput` chỉ render label khi `label` truthy (`{label && (...)}`), nên `label=""` hoặc bỏ prop `label` sẽ không render whitespace. Không cần wrapper hay `hideLabel`.
   - `ActionButton`: hỗ trợ các variant `primary`, `secondary`, `danger`, `ghost`, `loading`, `disabled`, `fullWidth`, `className`.
   - `ModalInfoGrid`: hỗ trợ `items` với cấu trúc `{ label, value, span? }`.
   - `SummaryRow`: hỗ trợ `label`, `value`, `bold`, `accent` (string class). Cần xác nhận các class accent (`summary-row-value--danger`, `summary-row-value--success`, `summary-row-value--neutral`) đã được định nghĩa ở một file CSS chung (nếu không, khi xóa các file CSS section sẽ mất style).
   - `StatusBadge`: hỗ trợ `label`, `type`, `size`.
3. Nếu component nào thiếu prop cần thiết, ghi chú vào `BASELINE_AUDIT.md` và bổ sung task trước khi refactor.

4. **Verify design tokens** dùng cho banner (Phase 1c sẽ dùng các token này):
   - Kiểm tra sự tồn tại của các token trong file CSS gốc (thường là `src/index.css`, `src/styles/tokens.css` hoặc `src/styles/variables.css`):
     - `--color-warning-50`, `--color-warning-200`, `--color-warning-700`
     - `--text-sm`, `--leading-normal`
   - Lệnh kiểm tra:

   ```powershell
   # PowerShell — tìm các design token cần cho banner
   Get-ChildItem -Path "src" -Recurse -File -Include *.css | Select-String -Pattern "--color-warning-50|--color-warning-200|--color-warning-700|--text-sm|--leading-normal"
   ```

   - Nếu token nào thiếu, ghi chú vào `BASELINE_AUDIT.md`. Phase 1c sẽ dùng fallback hex đã ghi trong CSS (ví dụ `#fffbe6`) nên không block, nhưng nên biết để đồng bộ với design system.

**Acceptance criteria:**
- [ ] Các component trên tồn tại và export đúng.
- [ ] `SectionBox` + `SectionHeader` + `SectionContent` đủ API.
- [ ] `TextInput` hỗ trợ `type="date"`, `type="datetime-local"` và các prop cần thiết.
- [ ] `SelectInput` tồn tại hoặc đã có phương án fallback cho dropdown chuẩn.
- [ ] `ActionButton` hỗ trợ đủ variant.
- [ ] `ModalInfoGrid`, `SummaryRow`, `StatusBadge` đủ API.
- [ ] Đã verify các design token `--color-warning-*`, `--text-sm`, `--leading-normal` tồn tại (hoặc đã ghi chú fallback).
- [ ] Không còn thiếu sót nào gây block cho các phase sau.

**Risk:** 🟢 Low  
**Rollback:** Không cần vì chỉ đọc.

---

### Phase 0e — Verify design tokens cho component mới và accent classes

**Mục tiêu:** Đảm bảo các token/class cần thiết cho `FormTextarea` và `SummaryRow` accent tồn tại trước khi refactor, tránh lỗi visual sau khi xóa section CSS.

**File kiểm tra / cần tạo:**
- `components/FormTextarea.tsx` (sẽ tạo ở Phase 3a)
- `components/FormTextarea.css` (sẽ tạo ở Phase 3a)
- `components/SummaryRow.tsx`
- `components/SummaryRow.css` (cần tạo mới)

**Các bước thực hiện:**

1. Verify các token cho `FormTextarea` (theo spec Phase 3a):
   - `--space-3`, `--space-9`, `--space-1`
   - `--color-border-default`, `--color-border-focus`
   - `--color-bg-primary`, `--color-bg-disabled`
   - `--color-text-primary`, `--color-text-muted`, `--color-text-disabled`, `--color-text-danger`
   - `--radius-lg`
   - `--text-sm`, `--text-xs`, `--font-normal`, `--font-medium`
   - `--leading-normal`
   - `--motion-fast`, `--ease-standard`
   - `--color-primary-100`
   - `--opacity-70`

   Lệnh kiểm tra:

   ```powershell
   # PowerShell — tìm token cần cho FormTextarea
   Get-ChildItem -Path "src" -Recurse -File -Include *.css | Select-String -Pattern "--space-3|--space-9|--color-border-default|--color-border-focus|--color-bg-primary|--color-bg-disabled|--color-text-primary|--color-text-muted|--color-text-disabled|--color-text-danger|--radius-lg|--text-sm|--motion-fast|--ease-standard|--color-primary-100"
   ```

2. Verify accent classes cho `SummaryRow`:
   - `.summary-row-value--danger` hiện định nghĩa trong `components/import-goods/ImportSidebar/TotalsSection.css` và `components/disposal-form/DisposalSidebar/StatsSection.css`.
   - `.summary-row-value--success` hiện định nghĩa trong `components/import-goods/ImportSidebar/TotalsSection.css` và `components/disposal-form/DisposalSidebar/StatsSection.css`.
   - `.summary-row-value--neutral` **không tồn tại trong source** — cần tạo mới.
   - `.count-summary-value--positive` / `--negative` / `--neutral` định nghĩa trong `components/inventory-count/CountSidebar/CountSummary.css`.
   - `.count-info-diff--positive` / `--negative` định nghĩa trong `components/inventory-count/CountSidebar/CountInfoSection.css`.

3. Ghi chú kết quả vào `BASELINE_AUDIT.md`:
   - Token nào thiếu → dùng fallback hoặc thay bằng token tương đương.
   - Cần tạo `components/SummaryRow.css` và định nghĩa đầy đủ accent classes.

**Acceptance criteria:**
- [ ] Các token cho `FormTextarea` đã được verify (hoặc đã ghi chú fallback).
- [ ] Các accent class cho `SummaryRow` đã được liệt kê rõ nguồn.
- [ ] Có quyết định tạo `components/SummaryRow.css` với các class:
  - `.summary-row-value--danger`
  - `.summary-row-value--success`
  - `.summary-row-value--neutral`
  - `.summary-row-value--warning`
- [ ] Có kế hoạch migrate `.count-summary-value--positive` / `--negative` / `--neutral` và `.count-info-diff--positive` / `--negative` nếu cần.

**Risk:** 🟢 Low  
**Rollback:** Không cần vì chỉ đọc.

---

## Phase 1 — Củng cố `VoucherFormLayout`

Mục tiêu: Đảm bảo `VoucherFormLayout` đủ linh hoạt cho cả 4 màn, làm SSOT thật sự.

---

### Phase 1a — Phân tích props hiện tại và thiếu sót

**Mục tiêu:** Xác định `VoucherFormLayout` cần thêm gì để hỗ trợ 4 màn.

**File đọc:**
- `components/VoucherFormLayout.tsx`
- `components/VoucherFormLayout.css`
- `pages/SupplierExchanges.tsx` (để xem alert banner)
- `pages/InventoryCount.tsx` (để xem stats row)

**Các câu hỏi cần trả lời:**
1. `SupplierExchanges` có alert cảnh báo → cần prop `banner`?
2. `InventoryCount` có stats row ở list view hay form view?
3. Có màn nào cần thêm slot bên trên header không?
4. Có cần prop `className` cho trường hợp đặc biệt không?

**Output:** Quyết định chính xác props cần thêm. Cần ghi rõ lý do cho từng quyết định:

1. **Thêm `banner?: React.ReactNode`** — `SupplierExchanges` có alert cảnh báo quan trọng cần hiển thị giữa header và body. Prop này là optional; chỉ render khi được truyền.
2. **Không thêm `statsRow`** — stats row của `InventoryCount` thuộc về list view (`/inventory-count`), không thuộc form view tạo/chỉnh sửa phiếu. Nếu sau này cần stats row trong form view, sẽ bổ sung prop `statsRow` riêng trong một update khác.
3. **Giữ `className` hiện tại** — cho phép page đặc biệt thêm class vào container ngoài cùng, nhưng hạn chế dùng và không được dùng để thay đổi grid/flex/width bên trong `VoucherFormLayout`.

**Acceptance criteria:**
- [ ] Có danh sách props cần thêm / không cần thêm.
- [ ] Có lý do cho mỗi quyết định.

**Risk:** 🟢 Low  
**Rollback:** Chỉ đọc, chưa sửa code.

---

### Phase 1b — Mở rộng interface và render `banner` slot

**Mục tiêu:** Thêm prop `banner` vào `VoucherFormLayout` và render đúng vị trí.

**File sửa:** `components/VoucherFormLayout.tsx`

**Các bước thực hiện:**

1. Thêm prop vào interface:

```tsx
export interface VoucherFormLayoutProps {
  title: string;
  onBack?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchSlot?: React.ReactNode;
  main: React.ReactNode;
  sidebar: React.ReactNode;
  actions?: React.ReactNode;
  banner?: React.ReactNode; // NEW
  className?: string;
}
```

2. Destructure `banner` trong component.

3. Render `banner` ngay dưới `voucher-header`, trên `voucher-body`:

```tsx
<div className="voucher-layout__main">
  <div className="voucher-header">...</div>
  {banner && <div className="voucher-banner">{banner}</div>}
  <div className="voucher-body">{main}</div>
</div>
```

**Acceptance criteria:**
- [ ] Interface có prop `banner`.
- [ ] `banner` chỉ render khi được truyền.
- [ ] `banner` nằm giữa header và body.
- [ ] `npm run lint` pass.

**Risk:** 🟢 Low  
**Rollback:** Revert 2 file `VoucherFormLayout.tsx`.

---

### Phase 1c — Thêm CSS cho `banner` và tinh chỉnh responsive

**Mục tiêu:** Đảm bảo banner hiển thị đúng, responsive vẫn ổn.

**File sửa:** `components/VoucherFormLayout.css`

**Các bước thực hiện:**

1. Thêm CSS cho banner:

```css
.voucher-banner {
  flex-shrink: 0;
  padding: 12px 16px;
  background: var(--color-warning-50, #fffbe6);
  border-bottom: 1px solid var(--color-warning-200, #ffe58f);
  color: var(--color-warning-700, #ad6800);
  font-size: var(--text-sm, 0.875rem);
  line-height: var(--leading-normal, 1.5);
}

.voucher-banner > * {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

2. Kiểm tra responsive:
- Tablet (<1024px): banner vẫn nằm giữa header và body.
- Mobile (<768px): padding giảm xuống 8px 12px.

3. Nếu cần, thêm media query:

```css
@media (max-width: 767px) {
  .voucher-banner {
    padding: 8px 12px;
  }
}
```

4. Xác nhận tỷ lệ layout 2 cột main/sidebar hiện tại (~70/30) không bị thay đổi khi thêm banner. Banner chỉ được thêm vào vị trí giữa header và body, không được phá vỡ grid/flex của `voucher-body`.
5. Kiểm tra xem banner có bị ảnh hưởng bởi page-level container padding không (ví dụ `.supplier-exchanges-page` có `padding: 1.5rem`). Nếu banner nằm trong `VoucherFormLayout` mà container cha có padding, cần điều chỉnh để banner hiển thị đúng vị trí hoặc container cha không còn padding cho create view.

**Acceptance criteria:**
- [ ] Banner có style rõ ràng, dùng design tokens.
- [ ] Responsive không bị vỡ.
- [ ] Layout 2 cột main ~70% / sidebar ~30% được giữ nguyên.
- [ ] Banner không bị page-level container padding làm lệch vị trí.
- [ ] `npm run lint` pass.

**Risk:** 🟢 Low  
**Rollback:** Revert `VoucherFormLayout.css`.

---

### Definition of Done — Phase 1

- [ ] Tất cả sub-phase 1a, 1b, 1c hoàn thành.
- [ ] `VoucherFormLayout` đã có prop `banner` optional, render đúng vị trí giữa header và body.
- [ ] CSS banner dùng design tokens, responsive không bị vỡ.
- [ ] Layout 2 cột main ~70% / sidebar ~30% được giữ nguyên.
- [ ] Banner không bị page-level container padding làm lệch vị trí.
- [ ] Quyết định không thêm `statsRow` đã được ghi rõ.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass (nếu có thay đổi code).
- [ ] **Không được bắt đầu Phase 4 trước khi Phase 1 hoàn thành** vì Phase 4 cần prop `banner`.

---

## Phase 2 — Refactor `DisposalForm`

Mục tiêu: Xóa dead code, xóa nhánh V1, đảm bảo màn xuất hủy hoàn toàn dùng `VoucherFormLayout`.

---

### Phase 2a — Xóa `DisposalFormLayout` dead code

**Mục tiêu:** Xóa component layout cũ và CSS cũ không còn dùng.

**File xóa:**
- `components/disposal-form/DisposalFormLayout.tsx`
- `components/disposal-form/DisposalFormLayout.css`

**Các bước thực hiện:**

1. Xác nhận lại không còn file nào import `DisposalFormLayout`:

```bash
grep -rn "DisposalFormLayout" components/ pages/ --include="*.tsx" --include="*.ts"
```

Kết quả phải rỗng (trừ file định xóa).

2. Xóa 2 file.

**Acceptance criteria:**
- [ ] 2 file đã xóa.
- [ ] Không còn import `DisposalFormLayout` trong codebase.
- [ ] `npm run lint` pass.

**Risk:** 🟢 Low  
**Rollback:** Khôi phục 2 file từ backup folder đã tạo ở Phase 0c (theo convention dự án: copy folder `vietsale-pro-v7_backup_voucher_layout_YYYYMMDD_HHMMSS`).

---

### Phase 2b — Refactor `DisposalSidebar/InfoSection.tsx`

**Mục tiêu:** Xóa feature flag và nhánh V1, giữ lại V2 dùng `SectionBox` + `StatusBadge` + `ModalInfoGrid`.

**File sửa:** `components/disposal-form/DisposalSidebar/InfoSection.tsx`

**Các bước thực hiện:**

1. Xóa import:

```tsx
// XÓA
import { useRefactoredDisposalLayout } from '../../../features';
```

2. Xóa toàn bộ nhánh V1 (từ `return (` thứ 2 bắt đầu bằng `<div className="ig-section">`).

3. Giữ lại V2 return duy nhất:

```tsx
return (
  <SectionBox className="disposal-info-section">
    <SectionHeader title="Thông tin phiếu" />
    <SectionContent>
      <ModalInfoGrid items={gridItems} />
    </SectionContent>
  </SectionBox>
);
```

4. Kiểm tra `InfoSection.css` — nếu chỉ còn style nội dung (`.disposal-info-value`, `.disposal-info-code`) thì giữ lại. Nếu có style layout thì xóa.

**Acceptance criteria:**
- [ ] Không còn import `useRefactoredDisposalLayout`.
- [ ] Không còn nhánh V1.
- [ ] V2 render vẫn đúng.
- [ ] `npm run lint` pass.

**Risk:** 🟢 Low  
**Rollback:** Revert file.

---

### Phase 2c — Refactor `DisposalSidebar/ReasonSection.tsx` và `NoteSection.tsx`

**Mục tiêu:** Xóa feature flag và nhánh V1 trong 2 section này.

**File sửa:**
- `components/disposal-form/DisposalSidebar/ReasonSection.tsx`
- `components/disposal-form/DisposalSidebar/NoteSection.tsx`

**Các bước thực hiện cho mỗi file:**

1. Xóa import `useRefactoredDisposalLayout`.
2. Xóa nhánh V1.
3. Giữ V2 return duy nhất.
4. Kiểm tra CSS riêng — chỉ giữ style nội dung.

> **Lưu ý:** `NoteSection.tsx` vẫn dùng raw `<textarea>` tạm thời trong Phase 2c, vì component `FormTextarea` dùng chung chỉ được tạo ở Phase 3a. Sau khi `FormTextarea` tạo xong (Phase 3a), DisposalForm sẽ được chuyển sang dùng `FormTextarea` NGAY trong Phase 3a (hoặc Phase 3b) cùng với InventoryCount và ImportGoods. **Không để đến Phase 6c.** Việc này đảm bảo cả 3 màn đều dùng chung `FormTextarea` trước khi bước sang Phase 4.

**Acceptance criteria:**
- [ ] Không còn import `useRefactoredDisposalLayout` trong cả 2 file.
- [ ] Không còn nhánh V1.
- [ ] `NoteSection.css` chỉ còn style nội dung, không còn class layout (nếu có class layout thì xóa).
- [ ] `npm run lint` pass.

**Risk:** 🟢 Low  
**Rollback:** Revert 2 file.

---

### Phase 2d — Refactor `DisposalSidebar/ActionFooter.tsx` và quyết định `StatsSection`

**Mục tiêu:** Xóa feature flag và nhánh V1 trong `ActionFooter`, quyết định số phận `StatsSection`.

**File sửa:** `components/disposal-form/DisposalSidebar/ActionFooter.tsx`

**Các bước thực hiện:**

1. Xóa import `useRefactoredDisposalLayout`.
2. Xóa nhánh V1.
3. Giữ V2 return duy nhất.
4. Kiểm tra CSS `ActionFooter.css`.

**Quyết định về `StatsSection`:**
- Hiện tại `StatsSection` không được dùng trong `pages/DisposalForm.tsx`.
- **Quyết định chính thức:** Chọn **Option A** — xóa `StatsSection.tsx` + `StatsSection.css` vì là dead code, không còn đóng góp gì cho UX hiện tại.
- Lý do: `DisposalForm` đã hiển thị đủ thông tin qua `InfoSection`, `ReasonSection`, `NoteSection`, `ActionFooter`. Thêm stats vào sidebar sẽ làm sidebar dài và không cần thiết.
- **Nếu sau này muốn stats trong sidebar, sẽ tạo section mới dùng `SectionBox` + `SummaryRow` thay vì tái sử dụng `StatsSection` cũ.
- **Timeline thực hiện:** Phase 2d chỉ ghi nhận quyết định. Việc xóa import `StatsSection` khỏi `pages/DisposalForm.tsx` sẽ do Phase 2e thực hiện. Việc xóa file `StatsSection.tsx` + `StatsSection.css` sẽ do Phase 6a thực hiện. **Tuyệt đối không xóa file `StatsSection.tsx` trong Phase 2d** vì `pages/DisposalForm.tsx` vẫn còn import nó, sẽ gây lint fail.
- **Lưu ý CSS:** `StatsSection.css` hiện định nghĩa `.summary-row-value--danger`. File này sẽ bị xóa ở Phase 6a. Cần đảm bảo Phase 3b đã tạo `SummaryRow.css` với đầy đủ accent classes trước khi xóa `StatsSection.css`.

**Acceptance criteria:**
- [ ] `ActionFooter` không còn nhánh V1.
- [ ] Đã quyết định Option A cho `StatsSection` (xóa ở Phase 6a, import xóa ở Phase 2e).
- [ ] `npm run lint` pass.

**Risk:** 🟡 Medium (cần đúng trình tự: xóa import trước khi xóa file)  
**Rollback:** Khôi phục `StatsSection` từ backup nếu cần.

---

### Phase 2e — Rà soát `pages/DisposalForm.tsx` và xóa dead imports

**Mục tiêu:** Đảm bảo `DisposalForm.tsx` không còn import dead code, không tự định nghĩa layout riêng, và chỉ truyền content vào slot của `VoucherFormLayout`.

**File sửa:** `pages/DisposalForm.tsx`

**Các bước thực hiện:**

1. Kiểm tra tất cả import trong `pages/DisposalForm.tsx`:
   - `DisposalTopBar` — nếu `VoucherFormLayout` đã tự vẽ header thì `DisposalTopBar` là dead code, xóa import và usage. File `DisposalTopBar.tsx` + `DisposalTopBar.css` sẽ được xóa hoàn toàn ở Phase 6a.
   - `StatsSection` — theo quyết định Option A ở Phase 2d, xóa import và usage (nếu có). File `StatsSection.tsx` + `StatsSection.css` sẽ được xóa hoàn toàn ở Phase 6a.
2. Kiểm tra xem `DisposalForm.tsx` có tự wrap `VoucherFormLayout` trong div định nghĩa flex/grid riêng không. Nếu có, bỏ div hoặc chuyển class vào `VoucherFormLayout` qua prop `className` (chỉ khi thực sự cần).
   - Cụ thể: `pages/DisposalForm.tsx` hiện wrap `VoucherFormLayout` trong `<div className="min-h-screen bg-[--ig-bg] p-4 md:p-6 flex flex-col">`. Cần xử lý:
     - `bg-[--ig-bg]` có thể thay bằng token chuẩn (`var(--color-bg-primary)` hoặc tương đương) hoặc đảm bảo `--ig-bg` vẫn tồn tại sau Phase 6c.
     - Padding `p-4 md:p-6` có thể ảnh hưởng layout chung — nếu cần giữ, chuyển vào `VoucherFormLayout` qua `className` hoặc để PageLayout cha lo phần này.
3. Kiểm tra xem `DisposalForm.tsx` có tự vẽ header riêng không. Nếu có, bỏ và dùng `title` + `onBack` của `VoucherFormLayout`.
4. Chạy `npm run lint`.

**Acceptance criteria:**
- [ ] Không còn import dead code (`DisposalTopBar`, `StatsSection` nếu không dùng).
- [ ] `DisposalForm.tsx` không tự vẽ header/topbar riêng.
- [ ] `DisposalForm.tsx` chỉ truyền content vào slot của `VoucherFormLayout`.
- [ ] Page-level wrapper không định nghĩa layout/flex/grid riêng cho create form.
- [ ] `bg-[--ig-bg]` đã được xử lý (thay token hoặc giữ lại biến).
- [ ] `npm run lint` pass.

**Risk:** 🟡 Medium (do liên quan đến CSS variable và page-level padding)  
**Rollback:** Revert `DisposalForm.tsx`.

---

### Phase 2f — Refactor `DisposalItemRow.tsx` và `DisposalItemsTable.tsx`

**Mục tiêu:** Xóa nhánh V1 và import `useRefactoredDisposalLayout` trong 2 component bảng sản phẩm — đây là component đang sống và được `pages/DisposalForm.tsx` sử dụng.

**File sửa:**
- `components/disposal-form/DisposalItemRow.tsx`
- `components/disposal-form/DisposalItemsTable.tsx`

**Các bước thực hiện:**

1. Xóa import:
   ```tsx
   // XÓA
   import { useRefactoredDisposalLayout } from '../../features';
   ```

2. Trong `DisposalItemRow.tsx`, tìm tất cả các nhánh V1 sử dụng `useRefactoredDisposalLayout ? (...) : (...)`:
   - Nút xóa dòng (cột action).
   - Input số lượng hủy.
   - Xóa nhánh V1, giữ lại V2 dùng `ActionButton` + `TextInput`.

3. Trong `DisposalItemsTable.tsx`, xóa nhánh V1 cho `emptyState`:
   - Giữ V2 dùng `EmptyState` component.
   - Xóa các class `ig-*` cũ không còn dùng sau khi xóa V1.

4. Kiểm tra CSS riêng:
   - `DisposalItemRow.css` — giữ style nội dung (`.disposal-item-row__cell`, `.disposal-item-row__qty`, ...), xóa class layout/tổng quát cũ nếu có.
   - `DisposalItemsTable.css` — tương tự.

5. Sau khi xóa nhánh V1, các class `ig-*` trong nhánh V1 (ví dụ `ig-btn-icon`, `ig-input-sm`, `ig-row`, `ig-badge`) có thể không còn được dùng trong source. Ghi chú vào `BASELINE_AUDIT.md` để audit ở Phase 6c.

6. Chạy `npm run lint`.

**Acceptance criteria:**
- [ ] Không còn import `useRefactoredDisposalLayout` trong cả 2 file.
- [ ] Không còn nhánh V1 trong cả 2 file.
- [ ] V2 render vẫn đúng, không thay đổi business logic.
- [ ] Các class `ig-*` trong V1 đã được ghi chú để audit.
- [ ] `npm run lint` pass.

**Risk:** � Medium (component đang sống, ảnh hưởng trực tiếp đến bảng sản phẩm)  
**Rollback:** Revert 2 file từ backup.

---

### Phase 2g — Rà soát `pages/DisposalForm.css` (nếu tồn tại)

**Mục tiêu:** Xóa CSS layout cho create form, giữ CSS cho list view / detail view / modal (nếu có).

**File sửa:** `pages/DisposalForm.css` (chỉ nếu file tồn tại — đã xác nhận ở Phase 0a)

**Các bước thực hiện:**

1. Kiểm tra sự tồn tại của file:
   ```powershell
   Test-Path pages/DisposalForm.css
   ```
2. Nếu file không tồn tại, sub-phase này hoàn thành ngay.
3. Nếu file tồn tại, phân loại các class:
   - **CSS layout create form cần xóa:** các class chỉ dùng cho bố cục cũ của form tạo/chỉnh sửa phiếu (ví dụ `.disposal-form-layout`, `.disposal-form-main`, `.disposal-form-sidebar`, `.disposal-form-section` nếu đã chuyển sang `SectionBox`).
   - **CSS cần giữ:** các class cho list view, detail view, modal, empty state, pagination.
4. Xóa các class layout create form đã xác nhận không còn dùng. Giữ CSS cho các view khác.
5. Chạy `npm run lint`.

**Acceptance criteria:**
- [ ] Đã xác nhận file tồn tại hoặc không tồn tại.
- [ ] Nếu tồn tại, không còn CSS layout cho create form trong `pages/DisposalForm.css`.
- [ ] List view, detail view, modal vẫn hiển thị đúng.
- [ ] `npm run lint` pass.

**Risk:** 🟢 Low (nếu file không tồn tại) / 🟡 Medium (nếu file tồn tại và cần dọn CSS)  
**Rollback:** Khôi phục `pages/DisposalForm.css`.

---

### Phase 2h — Tắt `useRefactoredDisposalLayout` và verify DisposalForm

**Mục tiêu:** Tắt feature flag, kiểm tra màn xuất hủy vẫn chạy đúng.

**Prerequisite:** Phải hoàn thành **Phase 2b, 2c, 2d, 2f** trước khi thực hiện phase này. Các component `DisposalSidebar/*`, `DisposalItemRow`, `DisposalItemsTable` phải đã xóa hết nhánh V1 và không còn import `useRefactoredDisposalLayout`.

**File sửa:** `features.ts`

**Các bước thực hiện:**

1. Tìm dòng:

```ts
export const useRefactoredDisposalLayout: boolean = true;
```

2. **Tạm thời comment** flag để dễ rollback nếu cần. Flag sẽ được **xóa hoàn toàn** ở Phase 6b.

```ts
// Deprecated — VoucherFormLayout SSOT completed
// export const useRefactoredDisposalLayout: boolean = true;
```

3. Chạy `npm run lint`.

4. Chạy `npm run build`.

5. Test thủ công:
- Mở màn Xuất hủy → tạo phiếu mới.
- Thêm sản phẩm.
- Chọn lý do.
- Nhập ghi chú.
- Bấm **Lưu tạm** → kiểm tra phiếu lưu đúng.
- Bấm **Hoàn thành** → kiểm tra tồn kho cập nhật.
- Kiểm tra responsive < 1024px.

**Acceptance criteria:**
- [ ] Tất cả prerequisite đã hoàn thành.
- [ ] Flag đã tắt.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Flow tạo + lưu tạm + hoàn thành phiếu xuất hủy hoạt động đúng.
- [ ] Layout không bị lệch so với trước.

**Risk:** 🟡 Medium (nếu prerequisite chưa xong sẽ gây lint fail)  
**Rollback:** Bật lại flag nếu có lỗi, sau đó fix.

---

### Definition of Done — Phase 2

- [ ] Tất cả sub-phase 2a–2h hoàn thành.
- [ ] `DisposalFormLayout.tsx` + `DisposalFormLayout.css` đã xóa.
- [ ] `DisposalTopBar.tsx` + `DisposalTopBar.css` được xóa (hoặc đã lên lịch xóa ở Phase 6a).
- [ ] `StatsSection.tsx` + `StatsSection.css` đã xóa (Option A, thực hiện xóa ở Phase 6a).
- [ ] Không còn `useRefactoredDisposalLayout` trong codebase.
- [ ] Không còn nhánh V1 trong các `DisposalSidebar` sections.
- [ ] Không còn nhánh V1 trong `DisposalItemRow.tsx` và `DisposalItemsTable.tsx`.
- [ ] `pages/DisposalForm.tsx` không còn dead imports (`DisposalTopBar`, `StatsSection`) và tuân thủ slot pattern.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Manual test flow tạo/lưu tạm/hoàn thành phiếu xuất hủy pass.

---

## Phase 3 — Refactor `InventoryCount`

Mục tiêu: Tinh chỉnh `CountFormLayout`, xóa CSS layout riêng, chuẩn hóa sidebar sections.

---

### Phase 3a — Tinh chỉnh `CountFormLayout.tsx` và xóa `CountFormLayout.css`

**Mục tiêu:** Loại bỏ CSS layout riêng, chuyển style textarea ghi chú vào component dùng chung.

**File sửa:** `components/inventory-count/CountFormLayout.tsx`

**File xóa:** `components/inventory-count/CountFormLayout.css`

**Các bước thực hiện:**

1. Mở `CountFormLayout.tsx`, tìm phần textarea ghi chú:

```tsx
<textarea
  value={formData.notes || ''}
  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
  placeholder="Nhập ghi chú cho phiếu kiểm kê..."
  rows={3}
  className="count-notes-textarea"
  disabled={formData.status === 'completed'}
/>
```

2. **Quyết định chính thức:** Chọn **Option B** — tạo component `FormTextarea` dùng chung trong `components/FormTextarea.tsx` + `components/FormTextarea.css`.
   - Lý do: Cả 4 màn phiếu đều có phần ghi chú; cần một component textarea chuẩn để đồng bộ style, không để mỗi màn tự viết raw `<textarea>`.
   - Option A không chọn vì `TextInput` hiện tại chưa chắc đã hỗ trợ `multiline` — cần verify, nhưng dù có hỗ trợ thì một component `FormTextarea` riêng vẫn rõ ràng hơn cho textarea ghi chú dài.
   - Option C không chọn vì vi phạm nguyên tắc SSOT (không để mỗi màn tự viết style textarea).

3. **Spec cho `FormTextarea`:**
   - Props: `value`, `onChange`, `placeholder?`, `rows?` (default 3), `disabled?`, `className?`, `error?`, `resize?` (default `vertical`).
   - Style: dùng design tokens, `width: 100%`, `min-height` chuẩn (ví dụ `calc(var(--space-9) * 3)` hoặc `calc(var(--space-12) + var(--space-2))`), `border-radius: var(--radius-lg)`, focus ring, disabled state.
   - Không hardcode màu — toàn bộ dùng tokens.
   - Không tự động thêm `resize: none` trừ khi prop `resize` là `none`.

4. **Tạo component:**

```tsx
// components/FormTextarea.tsx
import React from 'react';
import './FormTextarea.css';

export interface FormTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  error?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
  className,
  error,
  resize = 'vertical',
}) => {
  return (
    <div className={`form-textarea-wrapper ${className || ''}`}>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="form-textarea"
        style={{ resize }}
        aria-invalid={!!error}
      />
      {error && <span className="form-textarea-error">{error}</span>}
    </div>
  );
};
```

```css
/* components/FormTextarea.css */
.form-textarea-wrapper {
  width: 100%;
}

.form-textarea {
  width: 100%;
  min-height: calc(var(--space-9) * 3);
  padding: var(--space-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  outline: none;
  transition: border-color var(--motion-fast) var(--ease-standard),
              box-shadow var(--motion-fast) var(--ease-standard);
}

.form-textarea::placeholder {
  color: var(--color-text-muted);
}

.form-textarea:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 var(--border-width-medium) var(--color-primary-100);
}

.form-textarea:disabled {
  background-color: var(--color-bg-disabled);
  color: var(--color-text-disabled);
  cursor: not-allowed;
  opacity: var(--opacity-70);
}

.form-textarea-error {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-danger);
}
```

5. **Thay thế textarea trong cả 3 màn NGAY trong Phase 3a:**
   - `components/inventory-count/CountFormLayout.tsx`: thay `<textarea className="count-notes-textarea">` bằng `<FormTextarea ... />`.
   - `components/disposal-form/DisposalSidebar/NoteSection.tsx`: thay raw `<textarea className="disposal-note-textarea">` bằng `<FormTextarea ... />`.
   - `components/import-goods/ImportSidebar/NoteSection.tsx`: thay raw `<textarea className="import-note-textarea">` bằng `<FormTextarea ... />`.
   - Sau khi thay, các file `NoteSection.css` và `CountFormLayout.css` chỉ còn style nội dung khác (nếu có) hoặc có thể xóa hoàn toàn.

6. **Xóa `CountFormLayout.css`** sau khi đã chuyển textarea sang `FormTextarea` và xác nhận không còn class nào khác trong file này được dùng.

7. **Xóa import `import './CountFormLayout.css';`** trong `CountFormLayout.tsx`.

8. **Quyết định về `CountFormLayout`:** Giữ `CountFormLayout.tsx` làm wrapper vì nó encapsulate logic tính toán chênh lệch và render sidebar sections cho InventoryCount. Tuy nhiên, `CountFormLayout` không được tự định nghĩa layout riêng — nó chỉ truyền `main`, `sidebar`, `actions` vào `VoucherFormLayout`. Xem xét xóa type `InventoryCountItem` / `CountFormData` duplicate trong `CountFormLayout.tsx` nếu đã có trong `types.ts` (không bắt buộc, nhưng nên làm để tránh lỗi type sau này).

**Acceptance criteria:**
- [ ] `CountFormLayout.css` đã xóa.
- [ ] Không còn import `CountFormLayout.css`.
- [ ] `components/FormTextarea.tsx` và `components/FormTextarea.css` đã tạo.
- [ ] Textarea ghi chú trong 3 file (`CountFormLayout.tsx`, `DisposalSidebar/NoteSection.tsx`, `ImportSidebar/NoteSection.tsx`) đã thay bằng `FormTextarea`.
- [ ] Các file `NoteSection.css` không còn định nghĩa textarea riêng lẻ (`.disposal-note-textarea`, `.import-note-textarea`).
- [ ] `CountFormLayout.tsx` không còn import CSS riêng, vẫn là wrapper của `VoucherFormLayout`.
- [ ] `npm run lint` pass.

**Risk:** 🟡 Medium (nếu tạo component mới)  
**Rollback:** Khôi phục `CountFormLayout.css` và xóa `FormTextarea` nếu cần.

---

### Phase 3b — Refactor `CountInfoSection.tsx` và `CountSummary.tsx`

**Mục tiêu:** Chuẩn hóa input ngày và summary style.

**File sửa:**
- `components/inventory-count/CountSidebar/CountInfoSection.tsx`
- `components/inventory-count/CountSidebar/CountSummary.tsx`

**Các bước thực hiện:**

1. Trong `CountInfoSection.tsx`:
- Thay input thô `type="date"` bằng `TextInput` với `type="date"` hoặc component date chuẩn nếu có.
- Ví dụ:

```tsx
import { TextInput } from '../../TextInput';

// ...

{
  label: 'Ngày kiểm',
  value: (
    <TextInput
      type="date"
      value={date ? date.slice(0, 10) : ''}
      onChange={(e) => onDateChange(e.target.value)}
      disabled={status === 'completed'}
      size="md"
      fullWidth
    />
  ),
  span: true,
}
```

- Xóa `CountInfoSection.css` nếu chỉ còn style cho input thô (giờ đã dùng TextInput). Trước khi xóa, kiểm tra visual của input date trên Chrome/Safari vì `TextInput` render `input type="date"` và CSS có thể không xử lý đẹp icon date picker của browser.

2. Trong `CountSummary.tsx`:
- Đã dùng `SectionBox` + `SummaryRow` — tốt.
- Kiểm tra `CountSummary.css` có còn cần thiết không. Nếu chỉ là accent color đã có trong `SummaryRow` (ví dụ `.count-summary-value--positive` / `--negative` / `--neutral`) thì xóa file CSS này. Các class accent này phải được định nghĩa trong `SummaryRow.css` để dùng chung.

3. **Tạo `components/SummaryRow.css` và migrate accent classes:**
   - Kiểm tra `SummaryRow.css` hiện chưa tồn tại — cần tạo mới.
   - Định nghĩa các class accent chuẩn:

   ```css
   /* components/SummaryRow.css */
   .summary-row-value--danger {
     color: var(--color-danger-600);
     font-weight: var(--font-bold);
   }

   .summary-row-value--success {
     color: var(--color-success-600);
     font-weight: var(--font-bold);
   }

   .summary-row-value--neutral {
     color: var(--color-text-primary);
     font-weight: var(--font-bold);
   }

   .summary-row-value--warning {
     color: var(--color-warning-600);
     font-weight: var(--font-bold);
   }
   ```

   - Migrate các class từ section CSS:
     - `.count-summary-value--positive` → dùng `.summary-row-value--success` (hoặc giữ `.count-summary-value--positive` với color `var(--color-success-700)` trong `SummaryRow.css` nếu cần).
     - `.count-summary-value--negative` → `.summary-row-value--danger`.
     - `.count-summary-value--neutral` → `.summary-row-value--neutral`.
   - Nếu `CountSummary.tsx` dùng `accent="count-summary-value--positive"`, cân nhắc đổi thành `accent="summary-row-value--success"` để dùng class chuẩn. Nếu cần giữ class riêng cho InventoryCount, định nghĩa trong `SummaryRow.css`.
   - Thêm `import './SummaryRow.css';` vào `SummaryRow.tsx`.

   Lệnh kiểm tra:

   ```powershell
   # PowerShell: confirm SummaryRow.css không tồn tại
   Test-Path components/SummaryRow.css
   # PowerShell: tìm các accent class cần migrate
   Get-ChildItem -Path components -Recurse -File -Include *.css | Select-String -Pattern "summary-row-value--|count-summary-value--|count-info-diff--"
   ```

**Acceptance criteria:**
- [ ] `CountInfoSection` dùng `TextInput` cho ngày kiểm.
- [ ] `CountInfoSection.css` đã xóa nếu không còn style nào khác.
- [ ] Visual của input date trên Chrome/Safari không bị lệch icon.
- [ ] `CountSummary` giữ nguyên cấu trúc chuẩn.
- [ ] `SummaryRow.css` đã được tạo và import trong `SummaryRow.tsx`.
- [ ] Các accent class `.summary-row-value--danger`, `.summary-row-value--success`, `.summary-row-value--neutral`, `.summary-row-value--warning` đã được định nghĩa.
- [ ] CSS dư thừa đã dọn.
- [ ] `npm run lint` pass.

**Risk:** 🟢 Low  
**Rollback:** Revert file.

---

### Phase 3c — Tắt `useRefactoredCountLayout` và verify InventoryCount

**Mục tiêu:** Comment feature flag, kiểm tra màn kiểm kê vẫn chạy đúng.

**Lưu ý:** `useRefactoredCountLayout` **không được import trong bất kỳ component/page nào** (đã verify ở Phase 0a). `CountFormLayout` và các component InventoryCount đã dùng `VoucherFormLayout` / `SectionBox` trực tiếp. Do đó phase này chỉ cần comment flag và verify, không cần dọn V1 branch trong component.

**File sửa:** `features.ts`

**Các bước thực hiện:**

1. Tìm dòng:

```ts
export const useRefactoredCountLayout: boolean = true;
```

2. **Tạm thời comment** flag. Flag sẽ được **xóa hoàn toàn** ở Phase 6b.

3. Chạy `npm run lint`.

4. Chạy `npm run build`.

5. Test thủ công:
- Mở màn Kiểm kê → tạo phiếu mới.
- Thêm sản phẩm, nhập SL thực tế.
- Kiểm tra chênh lệch SL và giá trị hiển thị đúng.
- Lưu nháp.
- Hoàn thành phiếu → tồn kho cập nhật.
- Kiểm tra responsive.

**Acceptance criteria:**
- [ ] Flag đã tắt.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Flow kiểm kê hoạt động đúng.
- [ ] Layout không bị lệch.

**Risk:** � Low (không có component nào import flag này)  
**Rollback:** Bật lại flag nếu cần.

---

### Phase 3d — Rà soát `pages/InventoryCount.css`

**Mục tiêu:** Xóa CSS layout cho create/edit form, giữ CSS cho list view/filter bar/data grid.

**File sửa:** `pages/InventoryCount.css`

**Các bước thực hiện:**

1. Grep từng class trong `pages/InventoryCount.css` để xem còn được dùng ở đâu trong `pages/InventoryCount.tsx` và các component con.
2. Xóa các class CSS chỉ dùng cho layout cũ của create/edit form (ví dụ: `.count-layout`, `.count-form-layout`, `.count-layout-main`, `.count-layout-aside`, `.count-notes-textarea` nếu đã chuyển sang `FormTextarea`).
3. Kiểm tra class `.inventory-count-page__form-container` (wrapper div bên ngoài `CountFormLayout`). Nếu `PageLayout` đã cung cấp flex container đủ tốt, có thể bỏ div này và truyền `className` hoặc render `CountFormLayout` trực tiếp. Nếu cần giữ, đảm bảo nó không định nghĩa layout riêng (chỉ là flex container đơn giản).
4. Giữ CSS cho list view, filter bar, data grid, empty state, pagination.
5. Nếu create/edit form không còn dùng class nào trong file này, xem xét chuyển CSS list view vào file CSS chung hoặc giữ nguyên.

**Acceptance criteria:**
- [ ] Không còn CSS layout cho create/edit form trong `pages/InventoryCount.css`.
- [ ] `.inventory-count-page__form-container` đã được xử lý (giữ nếu cần, bỏ nếu thừa).
- [ ] List view vẫn hiển thị đúng.
- [ ] Filter bar và data grid không bị ảnh hưởng.
- [ ] `npm run lint` pass.

**Risk:** 🟡 Medium (dọn CSS có thể ảnh hưởng list view)  
**Rollback:** Khôi phục `pages/InventoryCount.css`.

---

### Definition of Done — Phase 3

- [ ] Tất cả sub-phase 3a–3d hoàn thành.
- [ ] `CountFormLayout.css` đã xóa.
- [ ] `FormTextarea` đã tạo và được dùng trong 3 màn (InventoryCount, DisposalForm, ImportGoods).
- [ ] `SummaryRow.css` đã tạo và import trong `SummaryRow.tsx`.
- [ ] `CountInfoSection` dùng `TextInput` cho ngày kiểm.
- [ ] `CountInfoSection.css` đã xóa (nếu không còn style khác).
- [ ] Visual input date trên Chrome/Safari không bị lệch.
- [ ] `CountSummary` giữ cấu trúc chuẩn, CSS dư thừa đã dọn.
- [ ] `pages/InventoryCount.css` không còn CSS layout cho create/edit form.
- [ ] `.inventory-count-page__form-container` đã được xử lý.
- [ ] Không còn `useRefactoredCountLayout` trong codebase.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Manual test flow kiểm kê tạo/lưu nháp/hoàn thành pass.

---

## Phase 4 — Refactor `SupplierExchanges`

Mục tiêu: Chuẩn hóa create form dùng `VoucherFormLayout`, xử lý alert banner, đảm bảo các section dùng `SectionBox`.

---

### Phase 4a — Phân tích create form hiện tại

**Mục tiêu:** Hiểu rõ cấu trúc create form của `SupplierExchanges` trước khi sửa.

**File đọc:** `pages/SupplierExchanges.tsx` (phần `view === 'create'`)

**Các bước thực hiện:**

1. Kiểm tra xem `SupplierExchanges` đã tách sidebar thành component riêng hay vẫn inline trong page:

   ```powershell
   # PowerShell — xác nhận có thư mục components/supplier-exchanges/ hay không
   Test-Path components/supplier-exchanges
   ```

   - Nếu tồn tại: liệt kê các file trong thư mục để biết cần refactor file nào.
   - Nếu không tồn tại: sidebar đang inline trong `pages/SupplierExchanges.tsx`, xử lý inline ở Phase 4c.

2. Đọc `pages/SupplierExchanges.tsx` (phần `view === 'create'`) và trả lời các câu hỏi bên dưới.

**Các câu hỏi cần trả lời:**
1. Create form hiện đã dùng `VoucherFormLayout` chưa? Nếu có, còn thiếu gì?
2. Alert banner hiện được render ở đâu? Có đang nằm trong page-level CSS không?
3. Các sidebar sections hiện dùng gì? Có dùng `SectionBox` chưa?
4. Có cần thêm prop `banner` cho `VoucherFormLayout` không?

**Output:** Danh sách cụ thể cần sửa trong `SupplierExchanges.tsx` (và `components/supplier-exchanges/` nếu có).

**Acceptance criteria:**
- [ ] Đã xác nhận `components/supplier-exchanges/` tồn tại hay không.
- [ ] Có mô tả chính xác cấu trúc create form hiện tại.
- [ ] Có danh sách cần sửa.

**Risk:** 🟢 Low  
**Rollback:** Không cần.

---

### Phase 4b — Chuẩn hóa create form và xử lý alert banner

**Mục tiêu:** Đưa alert banner vào prop `banner` của `VoucherFormLayout`, loại bỏ page-level layout CSS nếu có.

**File sửa:** `pages/SupplierExchanges.tsx`

**Các bước thực hiện:**

1. Tìm vị trí render `VoucherFormLayout` trong create form.

2. Nếu alert banner hiện nằm ngoài `VoucherFormLayout` hoặc trong page-level CSS, chuyển thành prop `banner`:

```tsx
<VoucherFormLayout
  title="Tạo phiếu đổi trả hàng NCC"
  onBack={() => setView('list')}
  banner={
    <div className="flex items-center gap-2">
      <AlertTriangle size={18} />
      <span>
        Lưu ý: Phiếu đổi trả hàng NCC sau khi hoàn thành sẽ KHÔNG THỂ HỦY trên hệ thống.
        Vui lòng kiểm tra kỹ lô hàng và số lượng trước khi xác nhận.
      </span>
    </div>
  }
  main={...}
  sidebar={...}
  actions={...}
/>
```

> **Lưu ý:** `SupplierExchanges` hiện tại KHÔNG dùng `searchSlot` của `VoucherFormLayout` — product search được render trong `main` như một phần của wizard UI. Giữ nguyên cách này trừ khi có quyết định thay đổi riêng.

3. Kiểm tra xem `SupplierExchanges.tsx` có tự wrap `VoucherFormLayout` trong div định nghĩa flex/grid layout không. Nếu div chỉ là page-level container (padding/background) thì giữ lại. Nếu div định nghĩa flex/grid layout thì bỏ div và để `VoucherFormLayout` tự lo layout.

4. Kiểm tra container `.supplier-exchanges-page` (nếu có padding/margin) khi banner chuyển vào `VoucherFormLayout`. Nếu banner bị page-level padding làm lệch, có 2 phương án:
   - **Phương án A (khuyến nghị):** Giữ page-level container cho list view, nhưng trong create view render `VoucherFormLayout` trong một div không có padding (hoặc padding = 0) để banner full-width theo `VoucherFormLayout`.
   - **Phương án B:** Chấp nhận banner nằm trong padding của container nếu visual vẫn ổn.
   - Ghi rõ quyết định vào code comment hoặc ghi chú.

5. Đảm bảo `title` và `onBack` của `VoucherFormLayout` được dùng đúng; không tự vẽ header riêng trong create form.

6. **Tạm dừng xử lý CSS ở bước này** — việc dọn `SupplierExchanges.css` sẽ làm ở Phase 4e để tập trung vào layout trước.

**Acceptance criteria:**
- [ ] Alert banner được truyền qua prop `banner` của `VoucherFormLayout`.
- [ ] Create form không tự vẽ header riêng.
- [ ] Create form không bị wrap bởi div định nghĩa flex/grid layout.
- [ ] Container `.supplier-exchanges-page` không làm banner bị lệch vị trí (hoặc đã ghi rõ quyết định).
- [ ] `npm run lint` pass.

**Risk:** 🟡 Medium  
**Rollback:** Revert `SupplierExchanges.tsx`.

---

### Phase 4c — Refactor sidebar sections của SupplierExchanges

**Mục tiêu:** Đảm bảo các section trong sidebar của create form đều dùng `SectionBox` + `SectionHeader` + `SectionContent`.

**File cần kiểm tra / sửa:**
- `pages/SupplierExchanges.tsx` (phần `voucherSidebar` inline)
- `components/supplier-exchanges/` nếu đã tách sẵn (hiện tại chưa thấy, nên xử lý inline trước)

**Các section cần chuẩn hóa trong sidebar:**
1. **Thông tin phiếu** — NCC (readonly), phiếu nhập gốc (readonly), ngày đổi trả, lý do đổi trả, ghi chú.
2. **Tổng kết** — Tổng giá trị trả, tổng giá trị nhận, chênh lệch công nợ.

**Các bước thực hiện:**

> **Lưu ý về visual:** `VoucherFormLayout.css` override `.section-box` trong sidebar để bỏ border/background/box-shadow (style phẳng). Khi chuyển `SupplierExchanges` sang `SectionBox`, visual sẽ đồng bộ với 3 màn khác. Nếu cần giữ box style riêng cho `SupplierExchanges`, phải dùng class cụ thể và không dùng `SectionBox` — nhưng điều này vi phạm nguyên tắc SSOT, nên chỉ chấp nhận khi thực sự cần.

1. **Quyết định về số lượng SectionBox:**
   - Hiện tại `SupplierExchanges` sidebar là một box duy nhất với 2 phần cách nhau bởi divider.
   - **Phương án A (khuyến nghị):** Tách thành 2 `SectionBox` riêng biệt. Khoảng cách giữa 2 box được điều khiển bởi `gap` của `.voucher-sidebar-content`.
   - **Phương án B:** Giữ một box duy nhất với 2 `SectionHeader` + `SectionContent`.
   - **Chọn Phương án A** để đồng bộ. Fallback về B nếu visual lệch nhiều, nhưng phải ghi rõ lý do.

2. Refactor section **Thông tin phiếu** thành `SectionBox`:

```tsx
<SectionBox className="supplier-exchange-info-section">
  <SectionHeader title="Thông tin phiếu" />
  <SectionContent>
    {/* NCC readonly */}
    {/* Phiếu nhập gốc readonly */}
    {/* Ngày đổi trả — TextInput type="datetime-local" */}
    {/* Lý do đổi trả — SelectInput */}
    {/* Ghi chú — FormTextarea (từ Phase 3a) */}
  </SectionContent>
</SectionBox>
```

3. Refactor section **Tổng kết** thành `SectionBox`:

```tsx
<SectionBox className="supplier-exchange-summary-section">
  <SectionHeader title="Tổng kết" />
  <SectionContent>
    <SummaryRow label="Tổng giá trị trả" value={formatCurrency(totals.returnTotal)} />
    <SummaryRow label="Tổng giá trị nhận" value={formatCurrency(totals.receivedTotal)} />
    <SummaryRow label="Chênh lệch công nợ" value={formatCurrency(totals.debtAdjustment)} highlight />
  </SectionContent>
</SectionBox>
```

4. Thay `select` thô bằng `SelectInput` (nếu có) hoặc `TextInput` với `type="select"` / component picker chuẩn. Lưu ý:
   - Trường `Lý do đổi trả` không có label. `SelectInput` chỉ render label khi `label` truthy (`{label && (...)}`), nên `label=""` hoặc bỏ prop `label` sẽ không render khoảng trắng. Không cần wrapper hoặc `hideLabel`.
   - Đảm bảo `SelectInput` hiển thị đúng khi không có helper text/error.
5. Thay `<textarea className="supplier-exchanges-textarea">` bằng `FormTextarea` đã tạo ở Phase 3a.
6. Nếu section phức tạp, tách thành file component riêng trong `components/supplier-exchanges/` — nhưng ưu tiên inline trước, tách sau khi ổn định.

**Acceptance criteria:**
- [ ] Quyết định 1 box vs 2 box đã được ghi rõ (khuyến nghị 2 box).
- [ ] Tất cả sidebar sections dùng `SectionBox` + `SectionHeader` + `SectionContent`.
- [ ] Input/Select/Button dùng component chuẩn (`TextInput`, `SelectInput`/`ActionButton`, `FormTextarea`).
- [ ] `SelectInput` không render khoảng trắng label thừa cho trường không có label.
- [ ] Không còn div với class layout riêng trong sidebar.
- [ ] `npm run lint` pass.

**Risk:** 🟡 Medium  
**Rollback:** Revert `SupplierExchanges.tsx`.

---

### Phase 4d — Verify SupplierExchanges

**Mục tiêu:** Đảm bảo màn đổi hàng NCC vẫn hoạt động đúng.

**Các bước thực hiện:**

1. Chạy `npm run lint`.
2. Chạy `npm run build`.
3. Test thủ công:
- Mở màn Đối tác → Đổi trả hàng NCC → tạo phiếu.
- Kiểm tra alert banner hiển thị đúng vị trí (giữa header và body, không bị page-level padding làm lệch).
- Kiểm tra sidebar sections có style phẳng (không border/background) hoặc đúng theo quyết định 1 box/2 box.
- Kiểm tra `SelectInput` lý do không có label thừa.
- Chọn NCC.
- Chọn phiếu nhập gốc.
- Chọn sản phẩm / lô cần đổi.
- Nhập số lượng đổi và sản phẩm nhận lại.
- Hoàn thành phiếu.
- Kiểm tra responsive: wizard UI (product search → lot selection → receipt selection) không bị vỡ trên tablet/mobile.

**Acceptance criteria:**
- [ ] Alert banner hiển thị đúng.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Flow đổi trả hàng NCC hoạt động đúng.
- [ ] Layout không bị lệch.
- [ ] Sidebar sections dùng `SectionBox` đúng visual.
- [ ] Responsive wizard UI không bị vỡ.

**Risk:** 🟡 Medium  
**Rollback:** Revert `SupplierExchanges.tsx`.

---

### Phase 4e — Rà soát `pages/SupplierExchanges.css`

**Mục tiêu:** Xóa CSS layout cho create form, giữ CSS cho list view, detail view, modal, và các item cards.

**File sửa:** `pages/SupplierExchanges.css`

**Các bước thực hiện:**

1. Tách CSS trong file thành các nhóm:
   - **List view:** `.supplier-exchanges-page`, `.supplier-exchanges-header`, `.supplier-exchanges-table`, `.supplier-exchanges-row`, `.supplier-exchanges-empty`, `.supplier-exchanges-pagination` — giữ lại.
   - **Detail view:** `.se-page-detail-*` — giữ lại.
   - **Create form layout:** `.supplier-exchanges-warning` (nếu đã chuyển vào `banner`), `.supplier-exchanges-sidebar-section`, `.supplier-exchanges-sidebar-title`, `.supplier-exchanges-field`, `.supplier-exchanges-readonly`, `.supplier-exchanges-select`, `.supplier-exchanges-textarea`, `.supplier-exchanges-section-divider`, `.supplier-exchanges-summary-row` — xóa hoặc chuyển thành style nội dung nhỏ nếu cần.
   - **Modal:** `.supplier-exchanges-modal-*` — giữ lại.
2. Xóa các class layout cho create form; style còn lại (nếu cần) phải nằm trong `VoucherFormLayout.css` hoặc component chuẩn.
3. Nếu ở Phase 4b chọn Phương án A (tách container cho list/create), cập nhật `.supplier-exchanges-page` CSS cho phù hợp (ví dụ: không padding cho create view, hoặc padding chỉ cho list view).
4. Kiểm tra lại `npm run lint`.

**Acceptance criteria:**
- [ ] Không còn CSS layout cho create form trong `pages/SupplierExchanges.css`.
- [ ] Banner class `.supplier-exchanges-warning` đã xóa nếu đã chuyển vào `VoucherFormLayout`.
- [ ] List view, detail view, modal vẫn hiển thị đúng.
- [ ] `npm run lint` pass.

**Risk:** 🟡 Medium (dọn CSS có thể ảnh hưởng list/detail view)  
**Rollback:** Khôi phục `pages/SupplierExchanges.css`.

---

### Definition of Done — Phase 4

- [ ] Tất cả sub-phase 4a–4e hoàn thành.
- [ ] Alert banner của `SupplierExchanges` được truyền qua prop `banner` của `VoucherFormLayout`.
- [ ] Container `.supplier-exchanges-page` không làm banner bị lệch (hoặc đã ghi rõ quyết định).
- [ ] Create form không tự vẽ header, không tự định nghĩa layout riêng.
- [ ] Các sidebar sections (Thông tin phiếu, Tổng kết) dùng `SectionBox` + `SectionHeader` + `SectionContent`.
- [ ] Quyết định 1 box vs 2 box đã được ghi rõ và thực hiện.
- [ ] `select` thô và `textarea` thô đã thay bằng `SelectInput`/`TextInput` và `FormTextarea`.
- [ ] `SelectInput` không render label thừa cho trường không có label.
- [ ] `pages/SupplierExchanges.css` không còn CSS layout cho create form.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Manual test flow đổi trả hàng NCC pass.
- [ ] Responsive wizard UI pass trên tablet/mobile.

---

## Phase 5 — Refactor `ImportGoods`

Mục tiêu: Xóa dead code, xóa nhánh V1, đảm bảo màn nhập hàng hoàn toàn dùng `VoucherFormLayout`.

---

### Phase 5a — Xóa `ImportFormLayout` dead code

**Mục tiêu:** Xóa component layout cũ và CSS cũ.

**File xóa:**
- `components/import-goods/ImportFormLayout.tsx`
- `components/import-goods/ImportFormLayout.css`
- `components/import-goods/ImportTopBar.tsx` (dead import trong `pages/ImportGoods.tsx`, không còn dùng)
- `components/import-goods/ImportTopBar.css` (đi kèm `ImportTopBar.tsx`)

**Các bước thực hiện:**

1. Xác nhận không còn file nào import `ImportFormLayout`:

```bash
grep -rn "ImportFormLayout" components/ pages/ --include="*.tsx" --include="*.ts"
```

Kết quả phải rỗng (trừ file định xóa).

2. Xác nhận `ImportTopBar` không còn dùng thực tế:

```bash
grep -rn "ImportTopBar" components/ pages/ --include="*.tsx" --include="*.ts"
```

Kết quả chỉ còn import trong `pages/ImportGoods.tsx` (dead import) và định nghĩa trong file `ImportTopBar.tsx`.

3. Xóa 4 file.

**Acceptance criteria:**
- [ ] `ImportFormLayout.tsx` + `ImportFormLayout.css` đã xóa.
- [ ] `ImportTopBar.tsx` + `ImportTopBar.css` đã xóa.
- [ ] Không còn import `ImportFormLayout`.
- [ ] `ImportTopBar` không còn được import/use trong codebase (trừ file đã xóa).
- [ ] `npm run lint` pass.

**Risk:** 🟢 Low  
**Rollback:** Khôi phục các file.

---

### Phase 5b — Refactor `ImportSidebar/SupplierSection.tsx`

**Mục tiêu:** Xóa feature flag và nhánh V1, giữ V2 dùng `SectionBox` + `TextInput` + `ActionButton`.

**File sửa:** `components/import-goods/ImportSidebar/SupplierSection.tsx`

**Các bước thực hiện:**

1. Xóa import `useRefactoredImportLayout`.
2. Xóa nhánh V1.
3. Giữ V2 return duy nhất.
4. Kiểm tra CSS `SupplierSection.css` — giữ style nội dung, xóa style layout nếu có.

**Acceptance criteria:**
- [ ] Không còn import `useRefactoredImportLayout`.
- [ ] Không còn nhánh V1.
- [ ] V2 render đúng.
- [ ] `npm run lint` pass.

**Risk:** 🟡 Medium (section phức tạp, có combobox tìm NCC)  
**Rollback:** Revert file.

---

### Phase 5c — Refactor `ImportSidebar/ReceiptInfoSection.tsx`

**Mục tiêu:** Xóa feature flag và nhánh V1.

**File sửa:** `components/import-goods/ImportSidebar/ReceiptInfoSection.tsx`

**Các bước thực hiện:**

1. Xóa import `useRefactoredImportLayout`.
2. Xóa nhánh V1.
3. Giữ V2 return duy nhất.
4. Kiểm tra CSS `ReceiptInfoSection.css`.

**Acceptance criteria:**
- [ ] Không còn import `useRefactoredImportLayout`.
- [ ] Không còn nhánh V1.
- [ ] `npm run lint` pass.

**Risk:** 🟢 Low  
**Rollback:** Revert file.

---

### Phase 5d — Refactor `ImportSidebar/TotalsSection.tsx`

**Mục tiêu:** Xóa feature flag và nhánh V1, **giữ nguyên logic tính toán**.

**File sửa:** `components/import-goods/ImportSidebar/TotalsSection.tsx`

**Các bước thực hiện:**

1. Xóa import `useRefactoredImportLayout`.
2. Xóa nhánh V1.
3. Giữ V2 return duy nhất.
4. **KHÔNG ĐƯỢC SỬA** logic tính `needToPay`, `debtDelta`, auto-fill `paidAmount`.
5. Kiểm tra CSS `TotalsSection.css`:
   - File này hiện định nghĩa `.summary-row-value--danger` và `.summary-row-value--success`.
   - Sau khi Phase 3b đã tạo `SummaryRow.css`, các class này đã có nguồn chung. Có thể xóa các định nghĩa duplicate trong `TotalsSection.css`.
   - Giữ lại các class styling cụ thể cho layout totals (`.import-totals-input-row`, `.import-totals-input`, `.import-totals-input-label`) nếu cần.
   - Xóa `.ig-input-sm--w140` và các class `.ig-*` còn sót.

**Acceptance criteria:**
- [ ] Không còn import `useRefactoredImportLayout`.
- [ ] Không còn nhánh V1.
- [ ] Logic tính toán giữ nguyên.
- [ ] `TotalsSection.css` không còn duplicate accent classes (đã chuyển sang `SummaryRow.css`).
- [ ] `TotalsSection.css` không còn class `.ig-input-sm--w140`.
- [ ] `npm run lint` pass.

**Risk:** 🟡 Medium (do có logic tính toán quan trọng)  
**Rollback:** Revert file.

---

### Phase 5e — Refactor `ImportSidebar/NoteSection.tsx` và `ActionFooter.tsx`

**Mục tiêu:** Xóa feature flag và nhánh V1 trong 2 section này.

**File sửa:**
- `components/import-goods/ImportSidebar/NoteSection.tsx`
- `components/import-goods/ImportSidebar/ActionFooter.tsx`

**Các bước thực hiện:**

1. Xóa import `useRefactoredImportLayout` trong cả 2 file.
2. Xóa nhánh V1 trong cả 2 file.
3. Giữ V2 return duy nhất.
4. Thay textarea trong `NoteSection.tsx` bằng `FormTextarea` đã tạo ở Phase 3a.
5. Kiểm tra CSS riêng. Xóa `margin-bottom` dư thừa trong các class `.import-*-section` nếu `VoucherFormLayout.css` đã đặt `gap` cho `.voucher-sidebar-content` (ví dụ `.import-supplier-section`, `.import-receipt-info-section`, `.import-totals-section`, `.import-note-section`, `.import-action-footer` nếu có `margin-bottom: var(--space-4)`).
6. Xóa class legacy `.ig-input-sm--w140` trong `TotalsSection.css` (chỉ dùng trong V1 branch).

**Acceptance criteria:**
- [ ] Không còn import `useRefactoredImportLayout` trong cả 2 file.
- [ ] Không còn nhánh V1.
- [ ] `NoteSection.tsx` dùng `FormTextarea`.
- [ ] `NoteSection.css` không còn định nghĩa textarea riêng (`.import-note-textarea`).
- [ ] `NoteSection.css` / `ActionFooter.css` / `SupplierSection.css` / `ReceiptInfoSection.css` / `TotalsSection.css` không còn `margin-bottom` dư thừa khi đã có `voucher-sidebar-content` gap.
- [ ] `TotalsSection.css` không còn class `.ig-input-sm--w140`.
- [ ] `npm run lint` pass.

**Risk:** 🟢 Low  
**Rollback:** Revert 2 file.

---

### Phase 5f — Dọn `ImportGoods.css` và rà soát page-level wrapper

**Mục tiêu:** Loại bỏ CSS layout cho create form, đảm bảo `pages/ImportGoods.tsx` không tự định nghĩa layout riêng cho create form.

**File sửa:** `pages/ImportGoods.css`, `pages/ImportGoods.tsx`

**Các bước thực hiện:**

1. Mở `pages/ImportGoods.css`.
2. Phân loại các class trong file:

   **CSS layout create form cần xóa (nếu còn):**
   - `.ig-layout`, `.ig-layout-main`, `.ig-layout-aside`, `.ig-layout-wrapper`
   - `.ig-create-form`, `.ig-create-form-main`, `.ig-create-form-sidebar`
   - `.ig-form-header`, `.ig-form-body` (nếu `VoucherFormLayout` đã tự lo)
   - `.ig-notes-textarea` (nếu đã chuyển sang `FormTextarea`)
   - Các class `.ig-section-*` chỉ dùng cho layout cũ của section

   **CSS cần giữ:**
   - `.ig-history-*`, `.ig-history-list`, `.ig-history-row`, `.ig-history-detail` — history view
   - `.ig-detail-*`, `.ig-receipt-detail` — detail view
   - `.ig-search-*` nếu dùng chung cho cả history và create form
   - `.ig-filter-*`, `.ig-pagination-*` — filter/pagination
   - `.ig-mobile-*` — mobile-specific styles

3. Cách verify từng class:

   ```powershell
   # PowerShell: kiểm tra class .ig-layout còn dùng không
   Get-ChildItem -Path pages/ImportGoods.tsx, components/import-goods/ -Recurse -File -Include *.tsx,*.ts | Select-String -Pattern "ig-layout"
   ```

4. Xóa các class layout create form đã xác nhận không còn dùng. **Giữ** CSS cho history view, detail view, và các component khác trong page.
5. **Rà soát page-level wrapper trong `pages/ImportGoods.tsx`:**
   - `pages/ImportGoods.tsx` hiện wrap `VoucherFormLayout` trong `<div className="flex-1 min-h-0 flex flex-col">` khi `activeTab === 'create'`.
   - Kiểm tra xem wrapper này có thực sự cần thiết không. Nếu `PageLayout` cha đã đảm bảo flex, có thể bỏ div wrapper hoặc chuyển class vào `VoucherFormLayout` qua prop `className`.
   - **Không được** dùng wrapper để định nghĩa grid/flex/width riêng cho create form — vi phạm nguyên tắc SSOT.
6. **Rà soát dead imports trong `pages/ImportGoods.tsx`:**
   - Xóa import `ImportTopBar` nếu còn (đã xóa file ở Phase 5a).
   - Kiểm tra các import khác có liên quan đến layout cũ (ví dụ `ImportFormLayout` nếu còn).

**Acceptance criteria:**
- [ ] CSS layout cho create form đã dọn.
- [ ] `ImportTopBar` import đã xóa khỏi `pages/ImportGoods.tsx`.
- [ ] Page-level wrapper không định nghĩa layout/flex/grid riêng cho create form.
- [ ] History view và detail view không bị ảnh hưởng.
- [ ] `npm run lint` pass.

**Risk:** 🟡 Medium (dọn CSS có thể ảnh hưởng phần khác)  
**Rollback:** Khôi phục `ImportGoods.css`.

---

### Phase 5g — Refactor `ImportItemRow.tsx` và `ImportItemsTable.tsx`

**Mục tiêu:** Xóa nhánh V1 và import `useRefactoredImportLayout` trong 2 component bảng sản phẩm — đây là component đang sống và được `pages/ImportGoods.tsx` sử dụng.

**File sửa:**
- `components/import-goods/ImportItemRow.tsx`
- `components/import-goods/ImportItemsTable.tsx`

**Các bước thực hiện:**

1. Xóa import:
   ```tsx
   // XÓA
   import { useRefactoredImportLayout } from '../../features';
   ```

2. Trong `ImportItemRow.tsx`, tìm tất cả các nhánh V1 sử dụng `useRefactoredImportLayout ? (...) : (...)`:
   - Nút xóa dòng (cột action).
   - Input số lô (có batch / không batch).
   - Input hạn sử dụng (có batch / không batch).
   - Stepper số lượng (Minus/Plus + TextInput).
   - Input đơn giá.
   - Input giảm giá.
   - Xóa nhánh V1, giữ lại V2 dùng `ActionButton` + `TextInput`.

3. Trong `ImportItemsTable.tsx`, xóa nhánh V1 cho `emptyState`:
   - Giữ V2 dùng `EmptyState` component.
   - Xóa các class `ig-*` cũ không còn dùng sau khi xóa V1.

4. Kiểm tra CSS riêng:
   - `ImportItemRow.css` — giữ style nội dung (`.import-item-row__cell`, `.import-item-row__qty`, ...), xóa class layout/tổng quát cũ nếu có.
   - `ImportItemsTable.css` — tương tự.

5. Sau khi xóa nhánh V1, các class `ig-*` trong nhánh V1 (ví dụ `ig-btn-icon`, `ig-input-sm`, `ig-row`, `ig-input-sm--w140`, `ig-badge`) có thể không còn được dùng trong source. Ghi chú vào `BASELINE_AUDIT.md` để audit ở Phase 6c.

6. Chạy `npm run lint`.

**Acceptance criteria:**
- [ ] Không còn import `useRefactoredImportLayout` trong cả 2 file.
- [ ] Không còn nhánh V1 trong cả 2 file.
- [ ] V2 render vẫn đúng, không thay đổi business logic (tính toán dòng, lô, HSD, giá, giảm giá).
- [ ] Các class `ig-*` trong V1 đã được ghi chú để audit.
- [ ] `npm run lint` pass.

**Risk:** 🟡 Medium (component đang sống, ảnh hưởng trực tiếp đến bảng sản phẩm)  
**Rollback:** Revert 2 file từ backup.

---

### Phase 5h — Tắt `useRefactoredImportLayout` và verify ImportGoods

**Mục tiêu:** Tắt feature flag, kiểm tra màn nhập hàng vẫn chạy đúng.

**Prerequisite:** Phải hoàn thành **Phase 5b, 5c, 5d, 5e, 5g** trước khi thực hiện phase này. Các component `ImportSidebar/*`, `ImportItemRow`, `ImportItemsTable` phải đã xóa hết nhánh V1 và không còn import `useRefactoredImportLayout`.

**File sửa:** `features.ts`

**Các bước thực hiện:**

1. Tìm dòng:

```ts
export const useRefactoredImportLayout: boolean = true;
```

2. **Tạm thời comment** flag để dễ rollback nếu cần. Flag sẽ được **xóa hoàn toàn** ở Phase 6b.

```ts
// Deprecated — VoucherFormLayout SSOT completed
// export const useRefactoredImportLayout: boolean = true;
```

3. Chạy `npm run lint`.
4. Chạy `npm run build`.
5. Test thủ công:
- Mở màn Nhập hàng → tạo phiếu mới.
- Chọn NCC (tìm hoặc thêm mới).
- Thêm sản phẩm, nhập giá nhập, số lượng, giảm giá dòng.
- Nhập phí ship, giảm giá phiếu, tiền trả NCC.
- Kiểm tra tính toán: tổng tiền hàng, cần trả, công nợ hiển thị đúng.
- Lưu tạm.
- Hoàn thành phiếu.
- Sửa phiếu draft.
- Kiểm tra responsive.

**Acceptance criteria:**
- [ ] Tất cả prerequisite đã hoàn thành.
- [ ] Flag `useRefactoredImportLayout` đã tắt.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Flow nhập hàng hoạt động đúng.
- [ ] Tính toán tiền và công nợ chính xác.
- [ ] Layout không bị lệch.

**Risk:** 🔴 High (màn phức tạp, nhiều tính năng; nếu prerequisite chưa xong sẽ gây lint fail)  
**Rollback:** Bật lại flag, khôi phục CSS nếu cần.

---

### Definition of Done — Phase 5

- [ ] Tất cả sub-phase 5a–5h hoàn thành.
- [ ] `ImportFormLayout.tsx` + `ImportFormLayout.css` đã xóa.
- [ ] `ImportTopBar.tsx` + `ImportTopBar.css` đã xóa.
- [ ] Dead import `ImportTopBar` đã xóa khỏi `pages/ImportGoods.tsx`.
- [ ] Không còn `useRefactoredImportLayout` trong codebase.
- [ ] Không còn nhánh V1 trong các `ImportSidebar` sections.
- [ ] Không còn nhánh V1 trong `ImportItemRow.tsx` và `ImportItemsTable.tsx`.
- [ ] `NoteSection.tsx` dùng `FormTextarea` thay vì raw `<textarea>`.
- [ ] `pages/ImportGoods.css` không còn CSS layout cho create form.
- [ ] Các section CSS của Import không còn `margin-bottom` dư thừa.
- [ ] `TotalsSection.css` không còn class `.ig-input-sm--w140`.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] Manual test flow nhập hàng tạo/lưu tạm/hoàn thành/sửa draft pass.
- [ ] Tính toán tiền và công nợ chính xác.

---

## Phase 6 — Dọn dẹp SSOT

Mục tiêu: Xóa sạch dead code, tắt hết flags, đảm bảo thực sự chỉ còn `VoucherFormLayout` làm layout.

---

### Phase 6a — Xóa dead code files còn sót

**Mục tiêu:** Xóa các file layout/CSS cũ đã liệt kê ở Phase 0.

**File xóa:**
- `components/import-goods/ImportFormLayout.tsx` (nếu chưa xóa ở Phase 5a)
- `components/import-goods/ImportFormLayout.css` (nếu chưa xóa ở Phase 5a)
- `components/import-goods/ImportTopBar.tsx` (nếu chưa xóa ở Phase 5a)
- `components/import-goods/ImportTopBar.css` (nếu chưa xóa ở Phase 5a)
- `components/disposal-form/DisposalFormLayout.tsx` (nếu chưa xóa ở Phase 2a)
- `components/disposal-form/DisposalFormLayout.css` (nếu chưa xóa ở Phase 2a)
- `components/disposal-form/DisposalTopBar.tsx` (dead code, import đã xóa ở Phase 2e)
- `components/disposal-form/DisposalTopBar.css` (đi kèm `DisposalTopBar.tsx`)
- `components/disposal-form/DisposalSidebar/StatsSection.tsx` (dead code, import đã xóa ở Phase 2e)
- `components/disposal-form/DisposalSidebar/StatsSection.css` (đi kèm `StatsSection.tsx`)
- `components/inventory-count/CountFormLayout.css` (nếu chưa xóa ở Phase 3a)

**Các bước thực hiện:**

1. Grep lại để xác nhận các file layout CŨ còn tồn tại (loại trừ `VoucherFormLayout`):

```powershell
# PowerShell: tìm layout cũ / dead topbar — kết quả phải rỗng
Get-ChildItem -Path components/ -Recurse -File -Include *.tsx,*.css | Select-String -Pattern "ImportFormLayout|ImportTopBar|DisposalFormLayout|DisposalTopBar|StatsSection|CountFormLayout" | Select-Object FileName, LineNumber
```

2. **Trước khi xóa file, xác nhận không còn import trong page:** Chạy `npm run lint` sau khi xóa import trong `pages/ImportGoods.tsx` / `pages/DisposalForm.tsx`, sau đó mới xóa file. Điều này tránh lỗi build do xóa file trước khi xóa import.
3. Xóa các file còn sót.
4. Xác nhận trong `pages/ImportGoods.tsx` và `pages/DisposalForm.tsx` không còn import các file đã xóa.

**Acceptance criteria:**
- [ ] 11 file dead code đã xóa (6 layout files + 2 topbar files + 2 `StatsSection` files + 1 `CountFormLayout.css`).
- [ ] Không còn file layout cũ / topbar cũ trong `components/import-goods/`, `components/disposal-form/`, `components/inventory-count/`.
- [ ] Không còn import dead code trong `pages/ImportGoods.tsx` và `pages/DisposalForm.tsx`.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Risk:** 🟢 Low  
**Rollback:** Khôi phục từng file nếu cần.

---

### Phase 6b — Xóa 3 feature flags cũ trong `features.ts`

**Mục tiêu:** Tắt/xóa hoàn toàn các flag cũ.

**File sửa:** `features.ts`

**Các bước thực hiện:**

1. Tìm và xóa 3 dòng:

```ts
export const useRefactoredImportLayout: boolean = true;
export const useRefactoredDisposalLayout: boolean = true;
export const useRefactoredCountLayout: boolean = true;
```

2. Grep lại toàn bộ project để đảm bảo không còn import / sử dụng 3 flag này:

```powershell
# PowerShell: tìm feature flags cũ — kết quả phải rỗng
Get-ChildItem -Path components/, pages/ -Recurse -File -Include *.tsx,*.ts | Select-String -Pattern "useRefactoredImportLayout|useRefactoredDisposalLayout|useRefactoredCountLayout"
Select-String -Path features.ts -Pattern "useRefactoredImportLayout|useRefactoredDisposalLayout|useRefactoredCountLayout"
```

Hoặc dùng `findstr`:

```cmd
findstr /s /i /n "useRefactoredImportLayout useRefactoredDisposalLayout useRefactoredCountLayout" components\*.tsx components\*.ts pages\*.tsx pages\*.ts features.ts
```

Kết quả phải rỗng.

**Acceptance criteria:**
- [ ] 3 flag đã xóa trong `features.ts`.
- [ ] Không còn import / sử dụng 3 flag trong codebase.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Risk:** 🟢 Low  
**Rollback:** Khôi phục 3 dòng flag nếu cần.

---

### Phase 6c — Gộp CSS textarea dùng chung và final grep check

**Mục tiêu:** Đảm bảo các section ghi chú dùng chung một style, và kiểm tra cuối không còn nhánh V1 / layout cũ.

**File sửa / kiểm tra:**
- `components/FormTextarea.tsx` (nếu đã tạo ở Phase 3a)
- `components/FormTextarea.css`
- `components/disposal-form/DisposalSidebar/NoteSection.css`
- `components/import-goods/ImportSidebar/NoteSection.css`

> Lưu ý: `components/inventory-count/CountFormLayout.css` đã được xóa chắc chắn ở Phase 3a, không cần liệt kê lại ở đây.

**Các bước thực hiện:**

1. Đảm bảo các `NoteSection` của DisposalForm, ImportGoods, InventoryCount đều dùng `FormTextarea` (đã làm ở Phase 3a).
2. Xóa các CSS `.disposal-note-textarea`, `.count-notes-textarea`, `.import-note-textarea` riêng lẻ nếu đã có `FormTextarea.css`.
3. **Audit `index.css` các class `ig-*` legacy:**
   - Grep từng class `ig-*` trong `components/` và `pages/` (trừ các file dead code đã xóa).
   - Nếu class không còn được reference trong source (tsx/ts), xóa khỏi `index.css`.
   - Nếu class vẫn được dùng trong component còn sống, giữ lại.
   - **Danh sách tham khảo class CẦN GIỮ (đang dùng trong history/detail/list view):**
     - `.ig-page-container`, `.ig-page-detail-header`, `.ig-page-detail-header__*`, `.ig-page-detail-body`, `.ig-page-detail-sidebar`, `.ig-page-detail-card`, `.ig-page-detail-card__*` — detail view của ImportGoods.
     - `.ig-history-*`, `.ig-receipt-detail`, `.ig-search-*`, `.ig-filter-*`, `.ig-pagination-*` — history/detail view của ImportGoods.
   - **Danh sách tham khảo class CẦN XÓA (layout/form cũ, sau khi dọn V1):**
     - `.ig-layout`, `.ig-layout-main`, `.ig-layout-aside`, `.ig-layout-wrapper`
     - `.ig-create-form`, `.ig-create-form-main`, `.ig-create-form-sidebar`
     - `.ig-form-header`, `.ig-form-body`
     - `.ig-section`, `.ig-section-title`, `.ig-card`, `.ig-card-flat`
     - `.ig-input`, `.ig-input-sm`, `.ig-input-sm--w140`, `.ig-textarea`, `.ig-select`
     - `.ig-row`, `.ig-row-muted`, `.ig-row-error`
     - `.ig-btn-primary`, `.ig-btn-secondary`, `.ig-btn-danger`, `.ig-btn-icon`, `.ig-btn-ghost`
     - `.ig-badge`, `.ig-badge-danger`, `.ig-badge-completed`, `.ig-badge-warning`
     - `.ig-label`, `.ig-muted`, `.ig-title`, `.ig-num`, `.ig-body`, `.ig-totals`, `.ig-totals-row`, `.ig-search`, `.ig-notes-textarea`
     - `.ig-bg`, `.ig-*` layout variable chỉ dùng cho create form cũ.
   - Lệnh kiểm tra:

   ```powershell
   # PowerShell — liệt kê các class ig-* trong index.css
   Select-String -Path index.css -Pattern "\.(ig-[a-z0-9-]+)" | ForEach-Object { $_.Matches[0].Groups[1].Value } | Sort-Object -Unique
   ```

   - Với mỗi class, chạy:

   ```powershell
   # PowerShell — kiểm tra class còn dùng không
   Get-ChildItem -Path components/, pages/ -Recurse -File -Include *.tsx,*.ts | Select-String -Pattern "\.ig-layout\b"
   ```

   (Thay `ig-layout` bằng từng class khác.)
   - **Lưu ý đặc biệt:** Sau Phase 2f và Phase 5g, `ImportItemRow`, `ImportItemsTable`, `DisposalItemRow`, `DisposalItemsTable` đã xóa nhánh V1. Các class `ig-*` chỉ còn dùng trong nhánh V1 (ví dụ `ig-input-sm`, `ig-btn-icon`, `ig-row`) sẽ trở thành dead code và cần xóa khỏi `index.css`.

4. Grep cuối cùng để xác nhận không còn layout cũ / flags cũ / dead topbar:

```powershell
# PowerShell
Get-ChildItem -Path components/, pages/ -Recurse -File -Include *.tsx,*.ts,*.css | Select-String -Pattern "ig-layout|import-layout|disposal-layout|count-layout|useRefactoredImportLayout|useRefactoredDisposalLayout|useRefactoredCountLayout|ImportTopBar|DisposalTopBar"
```

Hoặc `findstr`:

```cmd
findstr /s /i /n "ig-layout import-layout disposal-layout count-layout useRefactoredImportLayout useRefactoredDisposalLayout useRefactoredCountLayout ImportTopBar DisposalTopBar" components\*.tsx components\*.ts components\*.css pages\*.tsx pages\*.ts pages\*.css
```

Kết quả phải rỗng.

5. Grep xác nhận chỉ còn `VoucherFormLayout` làm layout:

```powershell
# PowerShell
Get-ChildItem -Path pages/, components/ -Recurse -File -Include *.tsx,*.ts | Select-String -Pattern "VoucherFormLayout" | Select-Object FileName, LineNumber
```

Hoặc `findstr`:

```cmd
findstr /s /i /n "VoucherFormLayout" components\*.tsx components\*.ts pages\*.tsx pages\*.ts
```

Kết quả phải chỉ còn:
- `components/VoucherFormLayout.tsx`
- `pages/ImportGoods.tsx`
- `pages/InventoryCount.tsx` (qua `CountFormLayout`)
- `pages/DisposalForm.tsx`
- `pages/SupplierExchanges.tsx`
- `components/inventory-count/CountFormLayout.tsx`

**Acceptance criteria:**
- [ ] Không còn class CSS layout cũ (`ig-layout`, `import-layout`, `disposal-layout`, `count-layout`).
- [ ] Không còn feature flags cũ.
- [ ] Không còn `ImportTopBar` / `DisposalTopBar` trong codebase.
- [ ] Textarea ghi chú dùng chung style.
- [ ] `index.css` đã được audit, các class `ig-*` không còn dùng đã xóa.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

**Risk:** 🟡 Medium (dọn CSS có thể ảnh hưởng nhiều chỗ)  
**Rollback:** Khôi phục CSS nếu cần.

---

### Definition of Done — Phase 6

- [ ] Tất cả sub-phase 6a–6c hoàn thành.
- [ ] 11 file dead code layout/CSS đã xóa (`ImportFormLayout.tsx`, `ImportFormLayout.css`, `ImportTopBar.tsx`, `ImportTopBar.css`, `DisposalFormLayout.tsx`, `DisposalFormLayout.css`, `DisposalTopBar.tsx`, `DisposalTopBar.css`, `StatsSection.tsx`, `StatsSection.css`, `CountFormLayout.css`).
- [ ] 3 feature flags cũ đã xóa trong `features.ts`.
- [ ] Không còn import / sử dụng 3 flag cũ trong codebase.
- [ ] Không còn class CSS layout cũ (`ig-layout`, `import-layout`, `disposal-layout`, `count-layout`).
- [ ] Không còn `ImportTopBar` / `DisposalTopBar` trong codebase.
- [ ] `index.css` đã được audit, các class `ig-*` dead code đã xóa.
- [ ] Textarea ghi chú trong 3 màn (InventoryCount, DisposalForm, ImportGoods) đều dùng `FormTextarea`.
- [ ] Grep final chỉ còn `VoucherFormLayout` làm layout duy nhất.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---

## Phase 7 — Verification

Mục tiêu: Đảm bảo toàn bộ hệ thống vẫn hoạt động đúng sau refactor.

---

### Phase 7a — Static check: lint & build

**Mục tiêu:** Đảm bảo không có lỗi TypeScript / build.

**Các lệnh cần chạy:**

```bash
cd "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7"
npm run lint
npm run build
```

**Acceptance criteria:**
- [ ] `npm run lint` pass (0 error).
- [ ] `npm run build` pass (0 error).

**Risk:** 🟢 Low  
**Rollback:** Fix lỗi lint/build theo log.

---

### Phase 7b — Manual test 5 flows nghiệp vụ

**Mục tiêu:** Đảm bảo 5 flow tạo / sửa / hoàn thành phiếu vẫn đúng (4 flow chính theo PLAN_01 + 1 flow sửa phiếu draft của ImportGoods để cover trường hợp edit).

**Test matrix:**

| Flow | Các bước test | Kỳ vọng |
|------|---------------|---------|
| **Tạo phiếu nhập hàng** | Chọn NCC → thêm SP → nhập giá/SL/discount dòng → nhập phí ship, giảm giá phiếu, tiền trả → Lưu tạm → Hoàn thành | Tồn kho tăng, công nợ NCC đúng |
| **Sửa phiếu nhập hàng draft** | Mở phiếu draft → sửa SL → Lưu lại | Dữ liệu cập nhật đúng |
| **Tạo phiếu kiểm kê** | Thêm SP → nhập SL thực tế → Lưu nháp → Hoàn thành | Chênh lệch hiển thị đúng, tồn kho cập nhật |
| **Tạo phiếu xuất hủy** | Chọn lý do → thêm SP → Lưu tạm → Hoàn thành | Tồn kho giảm đúng |
| **Tạo phiếu đổi hàng NCC** | Chọn NCC → chọn phiếu nhập gốc → chọn lô → nhập SL đổi và SL nhận lại → Hoàn thành | Phiếu đổi trả tạo thành công, tồn kho cập nhật |

**Acceptance criteria:**
- [ ] Cả 5 flow test đều pass.
- [ ] Không có lỗi console nghiêm trọng.

**Risk:** 🔴 High (có thể phát hiện lỗi nghiệp vụ)  
**Rollback:** Quay lại từng phase để fix.

---

### Phase 7c — Responsive test và final report

**Mục tiêu:** Đảm bảo layout responsive ổn trên desktop, tablet, mobile.

**Các bước test:**

1. Desktop (> 1024px):
- 4 màn đều hiển thị 2 cột (main 70%, sidebar 30%).
- Header có Back + Title + Search cân đối.
- Sidebar actions sticky bottom.

2. Tablet (768px – 1024px):
- Layout chuyển thành 1 cột, sidebar xuống dưới main.
- Không bị tràn ngang.

3. Mobile (< 768px):
- Header xuống hàng: Back + Title trên 1 hàng, search xuống hàng dưới.
- Sidebar xuống dưới main.
- Actions trong sidebar xếp dọc hoặc ngang tùy kích thước.

4. **Edge cases bổ sung:**
- **Sidebar dài / actions sticky:** Mở màn nhập hàng, thêm nhiều sản phẩm, nhập nhiều tiền — đảm bảo actions trong sidebar vẫn sticky bottom và không bị che bởi content.
- **Wizard UI SupplierExchanges:** Trên tablet/mobile, kiểm tra product search → lot selection → receipt selection không bị tràn ngang hoặc chồng lấn.
- **Empty main content:** Kiểm tra 4 màn khi chưa có sản phẩm nào — layout vẫn ổn, không bị co lại quá mức.
- **Banner + no search:** Màn SupplierExchanges có banner nhưng không dùng search slot — đảm bảo header vẫn cân đối.
- **Input date visual:** Màn InventoryCount trên Chrome/Safari — kiểm tra icon date picker không bị lệch.

**Acceptance criteria:**
- [ ] Desktop hiển thị 2 cột đúng.
- [ ] Tablet stack dọc không bị vỡ.
- [ ] Mobile header xuống hàng đúng.
- [ ] Sidebar actions sticky bottom không bị che.
- [ ] SupplierExchanges wizard UI responsive không bị vỡ.
- [ ] Empty main content không làm layout co lạ.
- [ ] Banner không search slot vẫn cân đối.
- [ ] Input date visual không bị lệch.

**Risk:** 🟡 Medium  
**Rollback:** Quay lại Phase 1c để sửa responsive.

---

### Definition of Done — Phase 7

- [ ] Tất cả sub-phase 7a–7c hoàn thành.
- [ ] `npm run lint` pass (0 error).
- [ ] `npm run build` pass (0 error).
- [ ] Cả 5 flow test nghiệp vụ đều pass:
  - Tạo phiếu nhập hàng.
  - Sửa phiếu nhập hàng draft.
  - Tạo phiếu kiểm kê.
  - Tạo phiếu xuất hủy.
  - Tạo phiếu đổi hàng NCC.
- [ ] Không có lỗi console nghiêm trọng.
- [ ] Responsive test pass trên desktop (>1024px), tablet (768–1024px), mobile (<768px).
- [ ] Edge cases pass: sidebar actions sticky, wizard UI, empty main, banner no search, input date visual.
- [ ] Final report đã được lưu (có thể là file ghi chú nhỏ trong thư mục plan).

---

## Tổng kết thứ tự thực hiện chi tiết

```
Phase 0a → Phase 0b → Phase 0c → Phase 0d → Phase 0e
Phase 1a → Phase 1b → Phase 1c
Phase 2a → Phase 2b → Phase 2c → Phase 2d → Phase 2e → Phase 2f → Phase 2g → Phase 2h
Phase 3a → Phase 3b → Phase 3c → Phase 3d
Phase 4a → Phase 4b → Phase 4c → Phase 4d → Phase 4e
Phase 5a → Phase 5b → Phase 5c → Phase 5d → Phase 5e → Phase 5f → Phase 5g → Phase 5h
Phase 6a → Phase 6b → Phase 6c
Phase 7a → Phase 7b → Phase 7c
```

**Lưu ý quan trọng về thứ tự:**
- Phase 2h (tắt `useRefactoredDisposalLayout`) **phải chạy sau** toàn bộ Phase 2a–2g (tất cả component còn sống đã xóa nhánh V1 và dead code đã được xử lý).
- Phase 5h (tắt `useRefactoredImportLayout`) **phải chạy sau** toàn bộ Phase 5a–5g (tất cả component còn sống đã xóa nhánh V1 và dead code/CSS đã được xử lý).
- Phase 3c (tắt `useRefactoredCountLayout`) có thể chạy sau Phase 3a vì flag này không được import ở đâu.

**Mỗi phase nhỏ phải:**
- Có mục tiêu rõ ràng.
- Có file cần sửa/xóa.
- Có các bước thực hiện cụ thể.
- Có acceptance criteria.
- Có risk level và rollback plan.
- Chạy `npm run lint` sau khi hoàn thành.
- Các phase lớn (kết thúc mỗi Phase 1–7) cần chạy thêm `npm run build`.

**Output cuối cùng:**
- 4 màn phiếu dùng chung `VoucherFormLayout`.
- Muốn đổi layout chung → chỉ sửa 2 file: `components/VoucherFormLayout.tsx` + `components/VoucherFormLayout.css`.
- Không còn dead code layout cũ (11 file đã xóa: `ImportFormLayout`, `ImportTopBar`, `DisposalFormLayout`, `DisposalTopBar`, `StatsSection`, `CountFormLayout.css`).
- Không còn nhánh V1 trong component còn sống (bao gồm `ImportItemRow`, `ImportItemsTable`, `DisposalItemRow`, `DisposalItemsTable`).
- Không còn dead imports (`ImportTopBar`, `DisposalTopBar`, `StatsSection`).
- Không còn feature flags cũ.
- `index.css` đã được audit, các class `ig-*` dead code đã xóa.
- `FormTextarea` dùng chung cho 3 màn ghi chú.
- `SummaryRow.css` được tạo để dùng chung accent classes cho các summary row.
- `npm run lint` + `npm run build` pass.
- 5 flow nghiệp vụ hoạt động đúng (4 flow chính + 1 flow sửa phiếu draft).
- Responsive + edge cases pass.
