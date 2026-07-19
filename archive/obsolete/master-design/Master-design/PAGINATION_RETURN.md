# PAGINATION_RETURN.md — MODAL-MASTER-STYLE

## Pagination Toolbar — Danh sách phiếu trả hàng (Return Orders List)

Version: 1.0
Scope: **Modal only** (toolbar phân trang này được thiết kế để nằm trong `MasterModal` body, thường ngay dưới bảng dữ liệu). Có thể tái sử dụng trên page.
Source: `REPORT_DESIGN_RETURN.md` § I.[D] + `pages/ReturnOrders.tsx` lines 2299–2363.

---

## 1. Purpose

Quy chuẩn **Pagination Toolbar** cho danh sách phiếu trả hàng trong modal:

- Hiển thị khi `totalCount > 0`
- Bên trái: text thống kê `Hiển thị X - Y trên tổng số Z phiếu trả hàng`
- Bên phải: navigation số trang với `<`, `1 2 … N`, `>`
- Trang hiện tại highlight màu primary trên nền trắng

---

## 2. Master Structure

```text
<MasterModal>
  <ModalBody>
    <DataTableBox>
      ...
      <PaginationToolbar>
        ├─ Left: PageInfo
        └─ Right: PageNavigation
              ├─ PrevButton
              ├─ PageNumbers (1 | 2 | … | N)
              └─ NextButton
      </PaginationToolbar>
    </DataTableBox>
  </ModalBody>
</MasterModal>
```

---

## 3. Visual Tokens

| Token | Value | Tailwind |
|-------|-------|----------|
| **Container** | flex col mobile, row desktop, centered, justify-between, gap 16px, border-top slate-100, pt-20, mt-16 | `flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-5 mt-4` |
| **Page info text** | 14px, slate-400, số highlight slate-700 medium | `text-sm text-slate-400` + `<span className="text-slate-700 font-medium">` |
| **Navigation wrapper** | inline-flex, gap 4px, bg slate-50, radius 12px, p-4 | `inline-flex items-center gap-1 rounded-xl bg-slate-50 p-1` |
| **Nav button** | min-w 32px, h 32px, radius 8px, flex center | `min-w-[32px] h-[32px] rounded-lg flex items-center justify-center text-sm transition-colors` |
| **Inactive button** | text slate-500, hover slate-700 + white bg | `text-slate-500 hover:text-slate-700 hover:bg-white` |
| **Active button** | bg white, text primary-600, shadow-sm, font-semibold | `bg-white text-purple-600 shadow-sm font-semibold` |
| **Disabled button** | opacity 40, not-allowed | `disabled:opacity-40 disabled:cursor-not-allowed` |
| **Ellipsis** | text slate-400, no select, px-2 | `px-2 text-slate-400 text-sm select-none` |
| **Prev / Next icons** | ChevronLeft / ChevronRight, 16px | `w-4 h-4` |

Color values (from `MASTER_DESIGN_TOKENS_V1`):

- Primary 600: `#7C3AED` / `text-purple-600`
- Slate 50: `#F8FAFC` / `bg-slate-50`
- Slate 100: `#F1F5F9` / `border-slate-100`
- Slate 400: `#94A3B8` / `text-slate-400`
- Slate 500: `#64748B` / `text-slate-500`
- Slate 700: `#334155` / `text-slate-700`
- White: `#FFFFFF` / `bg-white`

---

## 4. Master Code Template (React + Tailwind)

```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Tạo mảng số trang + ellipsis theo trang hiện tại và tổng trang.
 * Luôn hiện trang 1 và trang cuối. Ellipsis khi khoảng cách > 2.
 */
export function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

export function PaginationToolbar({
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  loading,
  itemName = 'phiếu trả hàng',
}: {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  itemName?: string;
}) {
  // Ẩn hoàn toàn khi không có dữ liệu
  if (totalCount <= 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-5 mt-4">
      {/* ===== Left: Page info ===== */}
      <p className="text-sm text-slate-400">
        Hiển thị{' '}
        <span className="text-slate-700 font-medium">{start}</span>
        {' '}-{' '}
        <span className="text-slate-700 font-medium">{end}</span>
        {' '}trên tổng số{' '}
        <span className="text-slate-700 font-medium">{totalCount}</span>
        {' '}{itemName}
      </p>

      {/* ===== Right: Page navigation ===== */}
      {totalPages > 1 && (
        <nav className="inline-flex items-center gap-1 rounded-xl bg-slate-50 p-1">
          {/* Prev */}
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1 || loading}
            className="min-w-[32px] h-[32px] rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers + ellipsis */}
          {pageNumbers.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`e-${idx}`} className="px-2 text-slate-400 text-sm select-none">
                  …
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                disabled={loading}
                className={`min-w-[32px] h-[32px] rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                }`}
              >
                {p}
              </button>
            );
          })}

          {/* Next */}
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages || loading}
            className="min-w-[32px] h-[32px] rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
```

---

## 5. Page Info Formula

```
start = (currentPage - 1) * pageSize + 1
end   = Math.min(currentPage * pageSize, totalCount)
```

| Case | Text hiển thị |
|------|---------------|
| Trang đầu tiên, đủ dữ liệu | `Hiển thị 1 - 20 trên tổng số 150 phiếu trả hàng` |
| Trang cuối, dữ liệu ít hơn pageSize | `Hiển thị 141 - 150 trên tổng số 150 phiếu trả hàng` |
| Chỉ 1 trang | `Hiển thị 1 - 8 trên tổng số 8 phiếu trả hàng` (nav ẩn) |
| Không có dữ liệu | toàn bộ PaginationToolbar bị ẩn (`return null`) |

---

## 6. Ellipsis Algorithm

```
Nếu total ≤ 7   → hiển thị tất cả trang
Nếu total > 7:
  - Luôn hiển thị trang 1
  - Ellipsis trước khi current > 3
  - Hiển thị [current-1, current, current+1] (nếu trong khoảng [2, total-1])
  - Ellipsis sau khi current < total - 2
  - Luôn hiển thị trang total
```

Ví dụ với 10 trang, đang ở trang 5:
`1 … 4 5 6 … 10`

---

## 7. Preservation Rules

Khi áp dụng master style này cho modal/trang khác:

| Giữ nguyên | Ghi chú |
|------------|---------|
| `totalCount` | tổng số bản ghi server trả về |
| `currentPage` | trang hiện tại (1-indexed) |
| `totalPages` | tổng số trang = `Math.ceil(totalCount / pageSize)` |
| `pageSize` | số dòng mỗi trang (20 mặc định) |
| `onPageChange(page)` | callback cập nhật `currentPage` và re-fetch |
| `loading` | disable nav trong khi đang tải |
| `itemName` | thay bằng tên nghiệp vụ phù hợp |

Không được:

- Thay đổi thuật toán `getPageNumbers` (gây out-of-sync với total pages).
- Hiển thị select "Số dòng/trang" nếu không có trong spec ban đầu của page đó.
- Đặt pagination toolbar bên ngoài `DataTableBox`.
- Dùng pagination library bên ngoài (duy trì inline để kiểm soát style).

---

## 8. Interactions & States

| State | Behavior |
|-------|----------|
| Nút Prev disabled | `currentPage === 1 \|\| loading` → opacity 40, cursor not-allowed |
| Nút Next disabled | `currentPage === totalPages \|\| loading` → opacity 40, cursor not-allowed |
| Page click | gọi `onPageChange(p)` → re-fetch, scroll to top table |
| Active page | không clickable khi đã ở trang đó (hoặc chấp nhận click lại, không gây bug) |
| Loading | tất cả buttons disabled, visual không đổi (spinner ở bảng, không ở pagination) |
| Chỉ 1 trang | nav ẩn hoàn toàn, chỉ hiện page info |

---

## 9. Responsive Behavior

| Viewport | Layout |
|----------|--------|
| Desktop (`sm+`) | 1 hàng: page info ← → nav |
| Mobile | page info trên, nav dưới, cả 2 căn center |

Trong modal: pagination luôn nằm trong `DataTableBox`, không sticky. Nếu bảng dài, modal cần `overflow-y-auto` từ phía `ModalBody` wrapper để scroll.

---

## 10. Compliance with Master Standards

| Standard | Áp dụng |
|----------|---------|
| `MASTER_MODAL_STANDARD` | Pagination toolbar là phần cuối của `DataTableBox` trong `ModalBody`. |
| `MASTER_MODAL_BLUEPRINT` | Không đặt pagination trong `ModalFooter` (footer dành cho action buttons). |
| `MASTER_DATA_GRID_STANDARD_V1` | Khi dùng V2 DataGrid, pagination được truyền qua prop `pagination={}`. |
| `MASTER_TABLE_STANDARD` | Khi dùng V1 table, `PaginationToolbar` tách biệt dưới table. |
| `MASTER_ACTION_BUTTON_STANDARD` | Nav buttons là Ghost size SM, không dùng `ActionButton` full-width. |
| `MASTER_DESIGN_TOKENS_V1` | Dùng `purple-600`, `slate-50/100/400/500/700`, `white`. |
| `MASTER_ICON_STANDARD_V1` | Lucide `ChevronLeft` / `ChevronRight`, 16px. |

---

## 11. Do / Don't

### Do

- [ ] Ẩn toàn bộ toolbar khi `totalCount === 0`.
- [ ] Ẩn nav khi `totalPages === 1` nhưng vẫn hiển thị page info.
- [ ] Dùng `disabled` thay vì ẩn nút Prev/Next.
- [ ] Truyền `loading` để disable nav trong khi fetch.
- [ ] Hiển thị ellipsis thay vì quá nhiều số trang.

### Don't

- [ ] Không hiển thị "Trang 0" hoặc giá trị âm.
- [ ] Không reset page về 1 tự động khi filter thay đổi (phụ thuộc handler của page/modal — không tự ý làm trong component).
- [ ] Không dùng spinner trong pagination — spinner ở table.
- [ ] Không hardcode `pageSize` trong component.
- [ ] Không dùng `<a href>` cho page links — luôn dùng `<button onClick>`.

---

## 12. Integration Checklist

Khi tích hợp vào modal mới:

```
[ ] Import PaginationToolbar và getPageNumbers
[ ] Truyền đủ 6 props: totalCount, currentPage, totalPages, pageSize, onPageChange, loading
[ ] Đặt sau </table> hoặc sau DataGrid component
[ ] Kiểm tra totalPages = Math.ceil(totalCount / pageSize) trước khi truyền
[ ] Đảm bảo onPageChange gọi re-fetch với trang mới
[ ] Kiểm tra hiển thị đúng trên viewport 375px (mobile) và 960px (modal LARGE)
```
