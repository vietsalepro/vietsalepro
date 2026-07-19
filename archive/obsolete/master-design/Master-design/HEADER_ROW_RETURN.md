# HEADER_ROW_RETURN.md — MODAL-MASTER-STYLE

## Header Row — Danh sách phiếu trả hàng (Return Orders List)

Version: 1.0
Scope: **Modal only** (khu vực này được thiết kế để đặt bên trong `MasterModal` body). Có thể điều chỉnh nhỏ để dùng trên page nếu cần.
Source: `REPORT_DESIGN_RETURN.md` § I.[A] + `pages/ReturnOrders.tsx` lines 1905–2000.

---

## 1. Purpose

Quy chuẩn giao diện của **Header Row** cho màn hình danh sách trả hàng khi hiển thị trong Modal:

- Tiêu đề + icon nhận diện module
- Search + Date range + Status filter + Filter/Reset actions
- Bulk action bar (xuất hiện khi có ít nhất 1 dòng được chọn)
- Nút tạo phiếu chính ngoài cùng bên phải

Mục tiêu: giữ layout gọn, nhất quán, dễ scan trong không gian modal hạn chế.

---

## 2. Master Structure

```text
<MasterModal>
  <ModalBody>
    <HeaderRow>
      ├─ TitleBlock
      │     ├─ IconBox (purple-600)
      │     ├─ Title (h1)
      │     └─ Description
      ├─ FilterBlock
      │     ├─ SearchInput
      │     ├─ DateRange (Từ ngày → Đến ngày)
      │     ├─ StatusSelect
      │     ├─ FilterButton
      │     └─ ResetButton
      └─ ActionBlock
            ├─ BulkActionBar (conditional)
            └─ CreateButton (primary)
  </ModalBody>
</MasterModal>
```

---

## 3. Visual Tokens (Single Source of Truth)

| Token | Value | Tailwind / CSS equivalent |
|-------|-------|---------------------------|
| **Outer container** | `flex` column on mobile, row on desktop, `gap: 16px`, `justify-between` | `flex flex-col md:flex-row md:items-center md:justify-between gap-4` |
| **Icon box** | `48×48`, radius `12px`, bg `primary-600`, white icon | `w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-200` |
| **Icon size** | `20px` | `w-5 h-5` |
| **Title** | `24px`, semibold (600), tracking tight, slate-900 | `text-2xl font-semibold tracking-tight text-slate-900` |
| **Description** | `14px`, slate-500, mt 2px | `text-sm text-slate-500 mt-0.5` |
| **Filter wrapper** | `flex` column mobile, row desktop, `gap: 12px`, `mx: 16px` (desktop) | `flex flex-1 flex-col md:flex-row items-stretch md:items-center gap-3 md:mx-4 flex-wrap` |
| **Search input** | height 40px, pl-48px, border slate-200 (#E2E8F0), focus primary-500 (#8B5CF6) | `w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-[#8B5CF6] focus:bg-white focus:outline-none transition-all duration-200` |
| **Input wrapper** | bg slate-50, border slate-200 (#E2E8F0), radius `12px`, px 12px, py 10px | `flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5` |
| **Input inner** | `w-[120px]`, transparent bg, no border | `w-[120px] bg-transparent text-sm text-slate-700 focus:outline-none border-0 p-0` |
| **Filter button** | secondary purple style | `inline-flex items-center gap-2 border border-purple-200 bg-purple-50 text-purple-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-purple-100 transition-colors` |
| **Reset button** | ghost style | `inline-flex items-center border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors` |
| **Bulk action bar** | red-50 bg, red-200 border, radius `12px`, fade-in | `flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 animate-fade-in` |
| **Create button** | primary purple, shadow purple-100 | `inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-purple-100 transition-all` |
| **Button icon** | `16px` | `w-4 h-4` |

Color mapping:

- Primary brand: `#7C3AED` / `bg-purple-600` / `text-purple-600` (Primary 600 per MASTER_DESIGN_TOKENS_V1)
- Secondary surface: `#F5F3FF` / `bg-purple-50`
- Neutral surface: `#F8FAFC` / `bg-slate-50`
- Neutral border: `#F1F5F9` / `border-slate-100`
- Text primary: `#0F172A` / `text-slate-900`
- Text secondary: `#64748B` / `text-slate-500`
- Danger bulk: `#FEF2F2` bg + `#DC2626` text + `#FECACA` border

---

## 4. Master Code Template (React + Tailwind)

```tsx
import { Search, Calendar, Filter, RotateCcw, Plus, Trash2 } from 'lucide-react';

// Đặt component này bên trong <MasterModal><ModalBody>...
export function ReturnHeaderRow({
  title,
  description,
  icon: Icon,
  filters,
  setFilters,
  selectedIds,
  onFilter,
  onReset,
  onBulkCancel,
  onCreate,
  createLabel = 'Tạo phiếu trả hàng',
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  filters: {
    customerName?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  };
  setFilters: (partial: Partial<typeof filters>) => void;
  selectedIds: string[];
  onFilter: () => void;
  onReset: () => void;
  onBulkCancel: () => void;
  onCreate: () => void;
  createLabel?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* ===== Title block ===== */}
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-200">
          <Icon className="w-5 h-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>

      {/* ===== Filter block ===== */}
      <div className="flex flex-1 flex-col md:flex-row items-stretch md:items-center gap-3 md:mx-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã phiếu, tên khách, SĐT..."
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-[#8B5CF6] focus:bg-white focus:outline-none transition-all duration-200"
            value={filters.customerName ?? ''}
            onChange={(e) => setFilters({ customerName: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            className="w-[120px] bg-transparent text-sm text-slate-700 focus:outline-none border-0 p-0"
            value={filters.startDate ?? ''}
            onChange={(e) => setFilters({ startDate: e.target.value })}
            title="Từ ngày"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            className="w-[120px] bg-transparent text-sm text-slate-700 focus:outline-none border-0 p-0"
            value={filters.endDate ?? ''}
            onChange={(e) => setFilters({ endDate: e.target.value })}
            title="Đến ngày"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
          <select
            className="bg-transparent text-sm font-medium text-slate-600 focus:outline-none border-0 p-0 pr-4 appearance-none cursor-pointer"
            value={filters.status ?? ''}
            onChange={(e) => setFilters({ status: e.target.value })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="completed">Đã hoàn tất</option>
            <option value="cancelled">Đã hủy</option>
            <option value="pending">Chờ xác nhận</option>
          </select>
        </div>

        <button
          onClick={onFilter}
          className="inline-flex items-center gap-2 border border-purple-200 bg-purple-50 text-purple-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-purple-100 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Lọc
        </button>

        <button
          onClick={onReset}
          className="inline-flex items-center border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Xóa
        </button>
      </div>

      {/* ===== Action block ===== */}
      <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 animate-fade-in">
            <span className="text-sm font-semibold text-red-700">Đã chọn {selectedIds.length} phiếu</span>
            <button
              onClick={onBulkCancel}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Hủy hàng loạt"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-purple-100 transition-all"
          onClick={onCreate}
        >
          <Plus className="w-4 h-4" />
          {createLabel}
        </button>
      </div>
    </div>
  );
}
```

---

## 5. Preservation Rules — Giữ nguyên khi áp dụng cho modal khác

Khi áp dụng master style này sang modal/trang khác, **chỉ thay đổi giao diện, không thay đổi logic**:

| Phần cần giữ nguyên | Ghi chú |
|---------------------|---------|
| State `filters` | object `{ customerName, startDate, endDate, status }` |
| `setFilters(partial)` | cập nhật một phần object |
| `selectedIds` | mảng ID dòng đang chọn |
| Handler `onFilter` | gọi API fetch theo điều kiện lọc |
| Handler `onReset` | reset filter về mặc định |
| Handler `onBulkCancel` | hủy hàng loạt |
| Handler `onCreate` | mở form tạo mới |
| Feature flag nếu có | ví dụ `useNewDataGridReturnOrders` giữ nguyên logic |
| Placeholder / labels | thay đổi theo nghiệp vụ mới, nhưng giữ cấu trúc |
| Select options | thay đổi theo enum trạng thái của nghiệp vụ mới |

Không được:

- Thay đổi số lượng/sắp xếp các phần (Title → Filter → Action).
- Tự ý thêm nút mới không thuộc Primary/Secondary/Ghost/Danger.
- Hardcode màu sắc khác palette chuẩn.

---

## 6. Interactions & States

| State | Class / Behavior |
|-------|------------------|
| Search focus | `focus:border-purple-500 focus:bg-white` |
| Filter button hover | `hover:bg-purple-100` |
| Reset button hover | `hover:bg-slate-100` |
| Bulk action bar mount | `animate-fade-in` |
| Bulk action bar hover | nút hủy `hover:bg-red-100` |
| Create button hover | `hover:bg-purple-700` |
| Disabled | `disabled:opacity-50` (nếu áp dụng MASTER_ACTION_BUTTON) |

---

## 7. Responsive Behavior

| Viewport | Layout |
|----------|--------|
| Desktop (`md+`) | 1 hàng: Title — Filter — Action |
| Tablet | Filter block vẫn wrap, action block giữ bên phải khi đủ chỗ |
| Mobile | Title trên cùng, filter xuống dòng, action align-end |

Ghi chú modal: vì chiều rộng modal thường ≤ 960px (size `LARGE` theo `MASTER_MODAL_STANDARD`), filter block sẽ wrap nhiều hơn so với page. Giữ `flex-wrap` để tránh tràn.

---

## 8. Compliance with Master Standards

| Standard | Áp dụng |
|----------|---------|
| `MASTER_MODAL_STANDARD` | Khu vực này nằm trong `ModalBody`, padding 24px, không tạo scroll độc lập. |
| `MASTER_MODAL_BLUEPRINT` | Header riêng của modal dùng cho tiêu đề modal; khu vực này là workspace header bên trong body. |
| `MASTER_ACTION_BUTTON_STANDARD_V1` | Primary (Create), Secondary (Filter), Ghost (Reset/Xóa), Danger (Bulk). |
| `MASTER_INPUT_STANDARD_V1` | Search input 40px, date input wrapper, select wrapper. |
| `MASTER_ICON_STANDARD_V1` | Chỉ dùng Lucide icons; icon box title 20px, action 16px. |
| `MASTER_DESIGN_TOKENS_V1` | Dùng `primary-600`, `slate-50/100/900`, `red-600/700`. |
| `MASTER_PAGE_LAYOUT_STANDARD` | Header row này tương đương Page Header + Filter Area gộp lại. |

---

## 9. Do / Don't

### Do

- [ ] Dùng icon box màu primary cho tiêu đề module.
- [ ] Đặt primary action ngoài cùng bên phải.
- [ ] Hiển thị bulk action bar khi `selectedIds.length > 0`.
- [ ] Giữ gap 16px giữa 3 khối chính.
- [ ] Dùng `flex-wrap` cho filter block để modal không bị tràn.

### Don't

- [ ] Không tách filter thành modal riêng trong màn hình modal.
- [ ] Không để nút tạo nằm giữa filter.
- [ ] Không thay icon thương hiệu bằng emoji.
- [ ] Không dùng `alert()` cho bulk action.

---

## 10. Appendix: Icon Mapping (Return Orders)

| Vị trí | Icon Lucide | Size |
|--------|-------------|------|
| Title icon | `RotateCcw` | 20px |
| Search prefix | `Search` | 20px |
| Date prefix | `Calendar` | 16px |
| Filter button | `Filter` | 16px |
| Bulk cancel | `Trash2` | 16px |
| Create button | `Plus` | 16px |

Khi áp dụng cho nghiệp vụ khác, thay icon title và create phù hợp; giữ nguyên size.
