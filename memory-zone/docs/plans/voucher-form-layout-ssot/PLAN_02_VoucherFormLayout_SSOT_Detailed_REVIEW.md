# Review — PLAN_02_VoucherFormLayout_SSOT_Detailed.md

> **Project:** VietSale Pro v7  
> **Ngày review:** 2026-07-02  
> **Reviewer:** Devin  
> **Đối chiếu với:** `PLAN_01_VoucherFormLayout_SSOT_Overview.md`

---

## 1. Kết luận tổng quan

File `PLAN_02_VoucherFormLayout_SSOT_Detailed.md` **đã đáp ứng đúng yêu cầu cơ bản** của `PLAN_01_VoucherFormLayout_SSOT_Overview.md`:

- Các phase tổng quan (0 → 7) đã được chia nhỏ thành sub-phase (0a, 0b, 0c, 1a, 1b, 1c, 2a–2e, 3a–3c, 4a–4d, 5a–5g, 6a–6c, 7a–7c).
- Mỗi sub-phase có mục tiêu, file cần sửa/xóa, các bước thực hiện, acceptance criteria, risk level, rollback plan.
- Có thứ tự thực hiện chi tiết ở cuối file.
- Giữ nguyên nguyên tắc không đụng business logic, `types.ts`, database.

Tuy nhiên, còn **một số điểm cần bổ sung / chỉnh sửa** để plan thực sự chuẩn, khớp hoàn toàn với `PLAN_01` và thực tế codebase.

---

## 2. Điểm mạnh

1. **Chia phase rất chi tiết:** 24 sub-phase, mỗi phase nhỏ đủ để hoàn thành trong 1 phiên làm việc.
2. **Nguyên tắc SSOT được nhấn mạnh:** chỉ sửa 2 file `VoucherFormLayout.tsx` + `VoucherFormLayout.css` để thay đổi layout chung.
3. **Acceptance criteria rõ ràng:** dạng checklist `[ ]` dễ verify.
4. **Risk & rollback đầy đủ:** mỗi sub-phase có mức độ rủi ro và cách rollback.
5. **Nhấn mạnh verification sau mỗi sub-phase:** chạy `npm run lint` và test thủ công.
6. **Output cuối cùng được tóm tắt rõ ràng:** 4 màn dùng chung layout, không còn dead code, lint + build pass.

---

## 3. Các điểm cần bổ sung / chỉnh sửa

### 3.1. Phase 0a — Lệnh grep chưa phù hợp với Windows

**Vấn đề:** Các lệnh `grep -rl`, `grep -rn` với flag `--include` là syntax Unix/Linux. Project hiện đang trên Windows (`C:\Users\SUACAUBA\...`). Nếu chạy trực tiếp trong PowerShell sẽ lỗi.

**Đề xuất:**
- Thêm ghi chú: *"Chạy trong Git Bash nếu đã cài, hoặc dùng PowerShell equivalent."*
- Cung cấp lệnh PowerShell thay thế, ví dụ:

```powershell
# PowerShell: tìm file chứa "FormLayout"
Get-ChildItem -Recurse -File -Include *.tsx,*.ts,*.css | Select-String -Pattern "FormLayout" | Select-Object FileName, LineNumber, Line

# PowerShell: tìm feature flags
Get-ChildItem -Recurse -File -Include *.tsx,*.ts,*.css | Select-String -Pattern "useRefactoredImportLayout|useRefactoredDisposalLayout|useRefactoredCountLayout"
```

Hoặc dùng `findstr`:

```cmd
findstr /s /i /n "FormLayout" components\*.tsx components\*.ts components\*.css pages\*.tsx pages\*.ts
findstr /s /i /n "useRefactoredImportLayout useRefactoredDisposalLayout useRefactoredCountLayout" components\*.tsx components\*.ts features.ts
```

---

### 3.2. Phase 1 — Thiếu ghi chú về `statsRow`

**Vấn đề:** `PLAN_01` đề cập khả năng thêm cả `banner` và `statsRow`. `PLAN_02` đã quyết định chỉ thêm `banner`, nhưng chưa ghi rõ lý do chính thức trong phần kết luận của Phase 1.

**Đề xuất:** Thêm vào Phase 1a hoặc Phase 1b một dòng ghi chú:

> **Quyết định:** Không thêm `statsRow` vào `VoucherFormLayout` vì stats row của `InventoryCount` thuộc về list view (`/inventory-count`), không thuộc form view tạo/chỉnh sửa phiếu. Nếu sau này cần stats row trong form view, sẽ bổ sung prop `statsRow` riêng.

---

### 3.3. Phase 2 — DisposalForm cần kiểm tra page-level

**Vấn đề:** `pages/DisposalForm.tsx` hiện đang import `StatsSection` (dòng 12) và `DisposalTopBar` (dòng 8). `PLAN_02` Phase 2d nói "StatsSection không được dùng trong pages/DisposalForm.tsx", nhưng nếu import vẫn tồn tại thì cần xóa. Ngoài ra, `DisposalTopBar` có thể là dead code vì `VoucherFormLayout` đã tự vẽ header.

**Đề xuất:** Thêm sub-phase hoặc task trong Phase 2:

#### Phase 2f — Rà soát `pages/DisposalForm.tsx` và xóa dead imports

**File sửa:** `pages/DisposalForm.tsx`

**Các bước:**
1. Kiểm tra xem `DisposalTopBar` có còn được dùng không.
2. Kiểm tra xem `StatsSection` có còn được dùng không (nếu không dùng → xóa import).
3. Xóa các import dead code.
4. Đảm bảo `DisposalForm.tsx` chỉ truyền content vào slot của `VoucherFormLayout`, không tự định nghĩa layout.

**Acceptance criteria:**
- [ ] Không còn import dead code trong `DisposalForm.tsx`.
- [ ] `DisposalForm.tsx` không tự vẽ header/topbar riêng.
- [ ] `npm run lint` pass.

---

### 3.4. Phase 3 — Cần quyết định rõ cách xử lý textarea

**Vấn đề:** Phase 3a đưa ra 3 option (A, B, C) cho textarea ghi chú, nhưng chưa quyết định chính thức. Nếu để ngỏ, khi thực hiện sẽ mất thời gian quyết định lại.

**Đề xuất:** Chọn Option B làm mặc định và ghi rõ:

> **Quyết định:** Tạo `components/FormTextarea.tsx` + `components/FormTextarea.css` (Option B) vì cả 4 màn phiếu đều có phần ghi chú, cần component dùng chung để đồng bộ style. Option A chỉ dùng nếu `TextInput` đã hỗ trợ `multiline` (cần verify trước). Option C không chọn vì vẫn để lại raw `<textarea>` trong các page.

Đồng thời, cần liệt kê rõ các file sẽ thay thế textarea:
- `components/inventory-count/CountFormLayout.tsx`
- `components/disposal-form/DisposalSidebar/NoteSection.tsx`
- `components/import-goods/ImportSidebar/NoteSection.tsx`

---

### 3.5. Phase 3 — Thiếu xử lý `pages/InventoryCount.css`

**Vấn đề:** `PLAN_01` liệt kê `pages/InventoryCount.css` là một trong các file CSS page-level cần rà soát. `PLAN_02` chưa có phase/task cụ thể để dọn CSS này.

**Đề xuất:** Thêm Phase 3d:

#### Phase 3d — Rà soát `pages/InventoryCount.css`

**File sửa:** `pages/InventoryCount.css`

**Các bước:**
1. Grep các class trong `pages/InventoryCount.css` xem còn được dùng ở đâu trong `pages/InventoryCount.tsx` và các component con.
2. Xóa các class CSS chỉ dùng cho layout cũ của create/edit form (nếu có).
3. Giữ CSS cho list view, filter bar, data grid.
4. Nếu create/edit form không còn dùng class nào trong file này, xem xét chuyển CSS list view vào file CSS chung hoặc giữ nguyên.

**Acceptance criteria:**
- [ ] Không còn CSS layout cho create/edit form trong `pages/InventoryCount.css`.
- [ ] List view vẫn hiển thị đúng.
- [ ] `npm run lint` pass.

---

### 3.6. Phase 4 — SupplierExchanges cần rõ ràng hơn

**Vấn đề:**
- Phase 4c/d còn mơ hồ: "Các section inline trong pages/SupplierExchanges.tsx (nếu chưa tách thành component) hoặc các file trong components/supplier-exchanges/ nếu có".
- `PLAN_01` đề cập `pages/SupplierExchanges.css` cần rà soát, nhưng `PLAN_02` chỉ đề cập lướt qua trong Phase 4b.

**Đề xuất:**
1. Trước khi viết Phase 4 chi tiết, cần đọc toàn bộ `pages/SupplierExchanges.tsx` (phần `view === 'create'`) và liệt kê chính xác các section cần chuẩn hóa.
2. Thêm Phase 4e:

#### Phase 4e — Rà soát `pages/SupplierExchanges.css`

**File sửa:** `pages/SupplierExchanges.css`

**Các bước:**
1. Tách CSS cho list view và create form.
2. Xóa CSS layout cho create form nếu đã chuyển hoàn toàn vào `VoucherFormLayout`.
3. Giữ CSS cho list view, table, filter bar.

---

### 3.7. Phase 5 — ImportGoods cần rõ ràng hơn về CSS

**Vấn đề:** Phase 5f "Dọn ImportGoods.css" chưa liệt kê cụ thể class nào cần kiểm tra. Nếu không rõ, dễ xóa nhầm CSS của history view hoặc detail view.

**Đề xuất:** Cập nhật Phase 5f với danh sách class cần kiểm tra cụ thể. Ví dụ:

> Các class cần kiểm tra trong `pages/ImportGoods.css`:
> - `.ig-layout`, `.ig-layout-main`, `.ig-layout-aside` — thường là layout cũ của create form → xóa.
> - `.import-history-*`, `.import-detail-*` — giữ lại cho history/detail view.
> - Các class bắt đầu bằng `.import-form-*` — xem xét, nếu chỉ dùng cho create form layout thì xóa.
>
> Cách verify: grep từng class trong `pages/ImportGoods.tsx` để xem còn dùng không.

---

### 3.8. Phase 6 — Grep check cuối cần loại trừ `VoucherFormLayout`

**Vấn đề:** Phase 6a và 6c dùng lệnh `grep -rl "FormLayout"` — kết quả sẽ bao gồm cả `VoucherFormLayout.tsx`, `VoucherFormLayout.css`, và các page đang dùng `VoucherFormLayout`. Lệnh này không giúp xác nhận chỉ còn layout cũ.

**Đề xuất:** Thay bằng lệnh cụ thể hơn:

```bash
# Tìm layout CŨ (dead code) — kết quả phải rỗng
grep -rl "ImportFormLayout\|DisposalFormLayout\|CountFormLayout" components/ pages/ --include="*.tsx" --include="*.ts" --include="*.css"

# Tìm feature flags cũ — kết quả phải rỗng
grep -rn "useRefactoredImportLayout\|useRefactoredDisposalLayout\|useRefactoredCountLayout" components/ pages/ features.ts

# Tìm class CSS layout cũ — kết quả phải rỗng
grep -rn "ig-layout\|import-layout\|disposal-layout\|count-layout" components/ pages/ --include="*.tsx" --include="*.ts" --include="*.css"

# Xác nhận VoucherFormLayout là layout duy nhất được import
grep -rl "VoucherFormLayout" pages/ components/ --include="*.tsx" --include="*.ts"
```

Kết quả cuối phải chỉ còn:
- `components/VoucherFormLayout.tsx`
- `pages/ImportGoods.tsx`
- `pages/InventoryCount.tsx` (qua `CountFormLayout`)
- `pages/DisposalForm.tsx`
- `pages/SupplierExchanges.tsx`
- `components/inventory-count/CountFormLayout.tsx`

---

### 3.9. Thiếu xử lý `CountFormLayout` sau khi xóa CSS

**Vấn đề:** Sau Phase 3a, `CountFormLayout.tsx` sẽ không còn import `CountFormLayout.css`. Nếu `CountFormLayout` chỉ còn là wrapper của `VoucherFormLayout`, cần xem xét:
- Có nên giữ `CountFormLayout` như một wrapper đặc thù cho InventoryCount?
- Hay chuyển `CountFormLayout` trực tiếp vào `pages/InventoryCount.tsx` để giảm một lớp abstraction?

**Đề xuất:** Thêm ghi chú trong Phase 3a hoặc Phase 6:

> **Quyết định:** Giữ `CountFormLayout.tsx` làm wrapper vì nó encapsulate logic tính toán chênh lệch và render sidebar sections cho InventoryCount. Tuy nhiên, `CountFormLayout` không được tự định nghĩa layout riêng — nó chỉ truyền `main`, `sidebar`, `actions` vào `VoucherFormLayout`.

---

### 3.10. Thiếu phase rà soát component dùng chung

**Vấn đề:** Plan giả định `SectionBox`, `SectionHeader`, `SectionContent`, `TextInput`, `ActionButton`, `ModalInfoGrid`, `SummaryRow`, `StatusBadge` đã tồn tại và ổn định. Nếu một trong các component này thiếu prop hoặc style, việc refactor sẽ bị block.

**Đề xuất:** Thêm Phase 0d:

#### Phase 0d — Verify component dùng chung

**Mục tiêu:** Xác nhận các component dùng chung tồn tại và có đủ API để dùng trong 4 màn phiếu.

**File kiểm tra:**
- `components/SectionBox.tsx` (hoặc `SectionBox/index.tsx`)
- `components/TextInput.tsx`
- `components/ActionButton.tsx`
- `components/ModalInfoGrid.tsx`
- `components/SummaryRow.tsx`
- `components/StatusBadge.tsx`

**Acceptance criteria:**
- [ ] Các component trên tồn tại và export đúng.
- [ ] `SectionBox` hỗ trợ `className`, `children`.
- [ ] `SectionHeader` hỗ trợ `title`.
- [ ] `SectionContent` hỗ trợ `children`.
- [ ] `TextInput` hỗ trợ `type="date"`, `disabled`, `size`, `fullWidth`.
- [ ] `ActionButton` hỗ trợ các variant cần thiết (primary, secondary, danger).

---

### 3.11. Thiếu ghi chú về việc không dùng `git`

**Vấn đề:** Theo `AGENTS.md`, project không dùng git, backup bằng cách copy folder. Plan hiện đề cập "rollback bằng git" ở một số chỗ (ví dụ Phase 2a: "Khôi phục 2 file từ backup (nếu có) hoặc git"). Điều này không khớp với thực tế.

**Đề xuất:** Sửa các chỗ đề cập rollback bằng git thành:

> **Rollback:** Khôi phục từ backup folder đã tạo ở Phase 0c (theo convention dự án: copy folder `vietsale-pro-v7_backup_voucher_layout_YYYYMMDD_HHMMSS`).

---

### 3.12. Thiếu Definition of Done cho mỗi phase lớn

**Vấn đề:** Mỗi phase lớn có nhiều sub-phase nhưng chưa có tổng kết "Definition of Done" cho phase lớn.

**Đề xuất:** Thêm một đoạn ngắn sau mỗi Phase 1–7, ví dụ:

> **Definition of Done — Phase 2:**
> - Tất cả sub-phase 2a–2f hoàn thành.
> - Không còn `DisposalFormLayout`, `useRefactoredDisposalLayout`, nhánh V1 trong DisposalSidebar.
> - `npm run lint` pass.
> - Manual test flow tạo/lưu/hoàn thành phiếu xuất hủy pass.

---

### 3.13. Thiếu ghi chú về việc không push migration

**Vấn đề:** `PLAN_01` và `PLAN_02` đều nói rõ "không đụng database / Supabase". Tuy nhiên, nên nhắc lại ở đầu plan: không tạo migration, không thay đổi RPC, không thay đổi schema.

**Đề xuất:** Thêm vào phần "Nguyên tắc áp dụng cho toàn bộ plan":

> 10. **Không tạo migration / RPC / schema mới** — plan này chỉ là frontend layout refactor.

---

## 4. Đề xuất cập nhật trực tiếp vào `PLAN_02`

Nên sửa file `PLAN_02_VoucherFormLayout_SSOT_Detailed.md` theo các bước sau:

1. **Sửa Phase 0a:** thay lệnh grep bằng lệnh PowerShell/Windows-compatible hoặc thêm ghi chú rõ ràng.
2. **Thêm Phase 0d:** verify component dùng chung.
3. **Cập nhật Phase 1a/1b:** ghi rõ quyết định không thêm `statsRow`.
4. **Thêm Phase 2f:** rà soát `pages/DisposalForm.tsx` và xóa dead imports (`DisposalTopBar`, `StatsSection` nếu không dùng).
5. **Quyết định Option B ở Phase 3a:** tạo `FormTextarea` dùng chung.
6. **Thêm Phase 3d:** rà soát `pages/InventoryCount.css`.
7. **Cập nhật Phase 4:** liệt kê rõ các section cần chuẩn hóa; thêm Phase 4e rà soát `pages/SupplierExchanges.css`.
8. **Cập nhật Phase 5f:** liệt kê cụ thể các class CSS cần kiểm tra trong `pages/ImportGoods.css`.
9. **Sửa Phase 6:** thay lệnh grep cuối bằng các lệnh cụ thể loại trừ `VoucherFormLayout`.
10. **Sửa tất cả rollback plan:** thay "git" bằng "backup folder".
11. **Thêm Definition of Done cho mỗi phase lớn.**
12. **Thêm nguyên tắc "Không tạo migration"** vào phần đầu.

---

## 5. Khuyến nghị thứ tự hành động

1. Đọc lại toàn bộ `pages/SupplierExchanges.tsx` (phần create) để xác định chính xác các section cần chuẩn hóa.
2. Đọc `pages/DisposalForm.tsx` để xác định `DisposalTopBar` và `StatsSection` có còn dùng không.
3. Cập nhật `PLAN_02_VoucherFormLayout_SSOT_Detailed.md` theo các điểm ở mục 4.
4. Sau khi cập nhật plan, bắt đầu thực hiện từ Phase 0.

---

## 6. Kết luận cuối cùng

`PLAN_02_VoucherFormLayout_SSOT_Detailed.md` **đã đủ chi tiết và đúng hướng** để thực hiện refactor layout SSOT cho 4 màn phiếu. Tuy nhiên, cần bổ sung khoảng 10–15% nội dung để:
- Khớp hoàn toàn với thực tế codebase Windows.
- Xử lý rõ ràng các page-level CSS và dead imports.
- Quyết định chính thức cách xử lý textarea dùng chung.
- Đảm bảo final grep check không bắt nhầm `VoucherFormLayout`.

Sau khi bổ sung, plan sẽ đủ chuẩn để bắt đầu implement mà không cần quyết định lại trong lúc làm.

---

## 7. Trạng thái sau khi bổ sung (2026-07-02)

Đã cập nhật trực tiếp `PLAN_02_VoucherFormLayout_SSOT_Detailed.md` theo các đề xuất ở mục 4. Các thay đổi chính:

1. **Thêm nguyên tắc thứ 10:** Không tạo migration / RPC / schema mới.
2. **Sửa Phase 0a:** Thay lệnh `grep` Unix bằng lệnh PowerShell + `findstr` cho Windows.
3. **Thêm Phase 0d:** Verify component dùng chung (`SectionBox`, `TextInput`, `ActionButton`, `ModalInfoGrid`, `SummaryRow`, `StatusBadge`).
4. **Cập nhật Phase 1:** Ghi rõ quyết định không thêm `statsRow` và lý do.
5. **Thêm Phase 2f:** Rà soát `pages/DisposalForm.tsx`, xóa dead imports (`DisposalTopBar`, `StatsSection`), đảm bảo tuân thủ slot pattern.
6. **Quyết định Option A ở Phase 2d:** Xóa `StatsSection.tsx` + `StatsSection.css` làm mặc định.
7. **Quyết định Option B ở Phase 3a:** Tạo `FormTextarea` dùng chung, liệt kê rõ 3 file cần thay thế textarea.
8. **Thêm Phase 3d:** Rà soát `pages/InventoryCount.css`, xóa CSS layout cho create/edit form.
9. **Cập nhật Phase 4:** Liệt kê rõ 2 section sidebar của `SupplierExchanges` (Thông tin phiếu, Tổng kết), thêm Phase 4e rà soát `pages/SupplierExchanges.css`.
10. **Cập nhật Phase 5f:** Liệt kê cụ thể các class CSS trong `pages/ImportGoods.css` cần kiểm tra/xóa.
11. **Sửa Phase 6:** Grep check cuối dùng pattern cụ thể loại trừ `VoucherFormLayout`, thêm `StatsSection` vào danh sách file dead code.
12. **Thay "git" bằng "backup folder":** Phù hợp với convention dự án (không dùng git, backup bằng copy folder).
13. **Thêm Definition of Done cho tất cả phase lớn** (1 → 7).
14. **Cập nhật thứ tự thực hiện chi tiết** ở cuối file: bao gồm Phase 0d, 2f, 3d, 4e.

**Kết quả:** `PLAN_02_VoucherFormLayout_SSOT_Detailed.md` hiện đã đầy đủ, khớp với `PLAN_01` và thực tế codebase, sẵn sàng để bắt đầu implement.

---

## 8. Bổ sung minor lần 2 (2026-07-02)

Sau khi review lại lần nữa, đã bổ sung 6 điểm minor để plan hoàn hảo hơn:

1. **Phase 0a (điểm 4.4):** Sửa cú pháp PowerShell `-Path components/, pages/` thành `-Path "components","pages"` (mảng string) để tương thích mọi phiên bản PowerShell.
2. **Phase 0d (điểm 4.1):** Thêm bước 4 — verify các design token `--color-warning-50/200/700`, `--text-sm`, `--leading-normal` tồn tại trong CSS gốc, kèm lệnh PowerShell kiểm tra. Nếu thiếu, Phase 1c sẽ dùng fallback hex đã ghi.
3. **Phase 2c (điểm 4.6a):** Thêm acceptance criteria — `NoteSection.css` chỉ còn style nội dung, không còn class layout.
4. **Phase 4a (điểm 4.5):** Thêm bước 1 — chạy `Test-Path components/supplier-exchanges` để xác nhận sidebar đã tách thành component riêng hay vẫn inline trong page, trước khi đọc code.
5. **Phase 5e (điểm 4.6b):** Thêm acceptance criteria — `NoteSection.tsx` dùng `FormTextarea`, `NoteSection.css` chỉ còn style nội dung.
6. **Phase 6c (điểm 4.3):** Xóa dòng thừa `components/inventory-count/CountFormLayout.css (nếu chưa xóa)` vì file này đã chắc chắn xóa ở Phase 3a. Thay bằng ghi chú rõ ràng.
7. **Phase 7b (điểm 4.2):** Đổi tiêu đề "4 flows" → "5 flows" và ghi rõ = 4 flow chính theo PLAN_01 + 1 flow sửa phiếu draft. Cập nhật tương ứng ở Output cuối file.

**Kết quả cuối:** `PLAN_02_VoucherFormLayout_SSOT_Detailed.md` hiện đã hoàn hảo, không còn điểm minor nào cần bổ sung. Sẵn sàng implement từ Phase 0.
