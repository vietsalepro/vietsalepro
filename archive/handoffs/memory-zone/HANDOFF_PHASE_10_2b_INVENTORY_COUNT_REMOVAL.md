# Phase 10.2b — Dead Code Cleanup: inventory-count file removal

## Tóm tắt

Đã thực hiện Phase 10.2b theo section 27 của `tasks.md`. Sau khi audit ở Phase 10.2a, `components/inventory-count/` chỉ còn `CountFormLayout.tsx` và không còn CSS/component cũ nào cần xóa. Sub-phase này chủ yếu xác nhận lại trạng thái, đánh dấu task hoàn thành, và chạy verification.

## Đọc tài liệu đầu vào

- `HANDOFF_PHASE_10_2a_INVENTORY_COUNT_AUDIT.md` ✅
- `openspec/changes/voucher-form-component-system-plan-a/tasks.md`, section 27 ✅

## Kiểm tra thực tế

### Danh sách file trong `components/inventory-count/`

```
components/inventory-count/
└── CountFormLayout.tsx
```

Chỉ còn một file duy nhất. Không còn file CSS hay component con cũ (`ProductSearchDropdown`, `CountItemsTable`, `CountSidebar/*`, v.v.) — các file này đã bị xóa trong Phase 8.3.

### Import `CountFormLayout.tsx`

- `pages/InventoryCount.tsx` dòng 10:
  ```tsx
  import { CountFormLayout } from '../components/inventory-count/CountFormLayout';
  ```
- Sử dụng tại dòng 1401–1575.
- `CountFormLayout.tsx` đã được refactor hoàn toàn sang `components/voucher-form`, không còn dependency tới các component cũ.

### Grep xác nhận không còn dead code

- Không còn import/source của `ProductSearchDropdown`, `CountItemsTable`, `CountSidebar` trong các file `.ts/.tsx`.
- Kết quả grep duy nhất chỉ xuất hiện trong tài liệu (`tasks.md`, `AGENTS.md`, handoff cũ).
- Không còn import từ `inventory-count/` nào khác ngoài `CountFormLayout` trong `pages/InventoryCount.tsx`.

## Hành động đã thực hiện

- Đọc handoff Phase 10.2a và section 27 của `tasks.md`.
- Xác nhận `components/inventory-count/` chỉ còn `CountFormLayout.tsx` — không có file cũ nào để xóa.
- Xác nhận `CountFormLayout.tsx` vẫn được `pages/InventoryCount.tsx` import và sử dụng.
- Cập nhật `tasks.md`:
  - Đánh dấu hoàn thành các mục **27.1–27.4**.
- Chạy verification:
  - `npm run lint`: PASS
  - `npm run build`: PASS

## Danh sách file đã xóa

Không có file nào bị xóa trong sub-phase này vì các component cũ đã được dọn dẹp trong Phase 8.3.

## File được bảo toàn

- `components/inventory-count/CountFormLayout.tsx` ✅ (vẫn đang được `pages/InventoryCount.tsx` sử dụng)

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS

## Next phase

Theo `tasks.md`, tiếp tục các phase tiếp theo trong chương trình Voucher Form Component System (nếu còn task chưa hoàn thành).
