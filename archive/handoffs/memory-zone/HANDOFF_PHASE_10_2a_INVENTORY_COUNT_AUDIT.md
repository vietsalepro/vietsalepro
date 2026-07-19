# Phase 10.2a — Dead Code Cleanup: inventory-count audit

## Tóm tắt

Đã audit `pages/InventoryCount.tsx` và `components/inventory-count/*` theo yêu cầu section 26 của `tasks.md`. Không phát hiện import/source còn sót của `ProductSearchDropdown` hay `CountItemsTable`. `CountFormLayout.tsx` vẫn được import và sử dụng trong page. Sub-phase này chỉ audit, không xóa file nào.

## Grep audit

### `pages/InventoryCount.tsx`

```bash
# ProductSearchDropdown | CountItemsTable
No matches found
```

### `components/inventory-count/*`

```bash
# ProductSearchDropdown | CountItemsTable
No matches found
```

### Toàn bộ source code (trừ tài liệu)

Grep toàn project cũng không còn import/source nào của `ProductSearchDropdown` hay `CountItemsTable` trong các file `.ts/.tsx`. Các kết quả duy nhất là trong `tasks.md`, `AGENTS.md`, và handoff cũ — đều là tài liệu.

## Trạng thái `CountFormLayout.tsx`

- File `components/inventory-count/CountFormLayout.tsx` vẫn tồn tại.
- `pages/InventoryCount.tsx` import và dùng `CountFormLayout` tại:
  - Import: dòng 10
  - Sử dụng: dòng 1401–1575
- `CountFormLayout` hiện đã refactor hoàn toàn dùng `components/voucher-form` (`VoucherFormLayout`, `VoucherSection`, `VoucherProductDropdown`, v.v.). Không còn dependency tới `ProductSearchDropdown` hay `CountItemsTable`.

## File còn lại trong `components/inventory-count/`

```
components/inventory-count/
└── CountFormLayout.tsx
```

Chỉ còn duy nhất một file. Không còn file `.css` hay component con nào trong thư mục này.

## Danh sách file an toàn để xóa

| # | File | Lý do |
|---|------|-------|
| — | Không có | Các component cũ (`ProductSearchDropdown`, `CountItemsTable`, `CountSidebar/*`) đã bị xóa trong Phase 8.3. Chỉ còn `CountFormLayout.tsx` vẫn đang được dùng. |

## File được bảo toàn

- `components/inventory-count/CountFormLayout.tsx` ✅ (vẫn được `pages/InventoryCount.tsx` import)

## Hành động đã thực hiện

- Đọc `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 26.
- Grep `pages/InventoryCount.tsx` và `components/inventory-count/*` cho `ProductSearchDropdown|CountItemsTable`.
- Xác nhận `CountFormLayout.tsx` vẫn được import và dùng.
- Liệt kê danh sách file an toàn xóa: **rỗng**.
- **KHÔNG xóa file nào** trong sub-phase này.
- Cập nhật `tasks.md`:
  - Đánh dấu hoàn thành các mục **26.1–26.4**.

## Verification

- Không có thay đổi code, do đó không chạy `npm run lint` / `npm run build` trong sub-phase audit này.
- Kiểm tra bằng grep đã xác nhận không còn dead code cần xóa ở `components/inventory-count/`.

## Next phase

Theo `tasks.md`, tiếp tục **Phase 10.2b — Dead Code Cleanup: inventory-count file removal** (nếu cần xác nhận/xóa các file còn sót; hiện tại danh sách xóa là rỗng nên sub-phase này có thể chỉ cần verify lại và đánh dấu hoàn thành).
