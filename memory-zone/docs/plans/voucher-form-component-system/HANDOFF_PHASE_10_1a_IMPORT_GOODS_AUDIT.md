# Phase 10.1a — Dead Code Cleanup: import-goods audit

## Tóm tắt

Thực hiện Phase 10.1a theo `openspec/changes/voucher-form-component-system-plan-a/tasks.md` section 22.

Audit dead code cho màn **Nhập hàng (ImportGoods)**: grep xác nhận các component cũ không còn import, liệt kê file an toàn để xóa, không xóa file trong sub-phase này.

## 1. Grep audit `ImportProductSearch | ImportItemsTable | ImportItemRow`

- `pages/ImportGoods.tsx`: **no matches** — page không còn import 3 component cũ.
- `components/import-goods/*`: **no matches** — 3 component cũ đã bị xóa ở các phase trước (7.2a, 7.4).
- `find_file_by_name` xác nhận các file sau **không còn tồn tại**:
  - `components/import-goods/ImportProductSearch.tsx`
  - `components/import-goods/ImportProductSearch.css`
  - `components/import-goods/ImportItemsTable.tsx`
  - `components/import-goods/ImportItemsTable.css`
  - `components/import-goods/ImportItemRow.tsx`
  - `components/import-goods/ImportItemRow.css`

## 2. `LotExpiryPopover.tsx/.css` status

- `components/import-goods/LotExpiryPopover.tsx` và `.css` **vẫn tồn tại**.
- `LotExpiryPopover.css` được self-import bên trong `LotExpiryPopover.tsx`.
- **Không có file source nào import `LotExpiryPopover`** (không tìm thấy `from '../components/import-goods/LotExpiryPopover'` trong toàn bộ source `.tsx/.ts`).
- Theo plan và acceptance criteria, `LotExpiryPopover` là **protected file** — phải giữ nguyên, không xóa ở phase này.

## 3. File CSS/component an toàn để xóa

Toàn bộ thư mục `components/import-goods/ImportSidebar/` đã bị refactor inline vào `pages/ImportGoods.tsx` từ Phase 7.1, không còn được import bởi bất kỳ source file nào:

| # | File | Ghi chú |
|---|------|---------|
| 1 | `components/import-goods/ImportSidebar/ActionFooter.tsx` | Unimported |
| 2 | `components/import-goods/ImportSidebar/ActionFooter.css` | Unimported |
| 3 | `components/import-goods/ImportSidebar/NoteSection.tsx` | Unimported |
| 4 | `components/import-goods/ImportSidebar/ReceiptInfoSection.tsx` | Unimported |
| 5 | `components/import-goods/ImportSidebar/ReceiptInfoSection.css` | Unimported |
| 6 | `components/import-goods/ImportSidebar/SupplierSection.tsx` | Unimported |
| 7 | `components/import-goods/ImportSidebar/SupplierSection.css` | Unimported |
| 8 | `components/import-goods/ImportSidebar/TotalsSection.tsx` | Unimported |
| 9 | `components/import-goods/ImportSidebar/TotalsSection.css` | Unimported |

**KHÔNG an toàn để xóa:**
- `components/import-goods/LotExpiryPopover.tsx`
- `components/import-goods/LotExpiryPopover.css`

## 4. Thay đổi file

- `openspec/changes/voucher-form-component-system-plan-a/tasks.md`: section 22 (22.1–22.4) đã cập nhật thành `[x]` kèm ghi chú.
- Không xóa file nào khác.

## 5. Verification

- Không có code changes (chỉ cập nhật tasks.md), nên không cần chạy `npm run lint` / `npm run build` trong sub-phase audit này.
- Không xóa file nào, nên không có rủi ro breakage.

## 6. Next phase

- **Phase 10.1b — Dead Code Cleanup: import-goods file removal**
  - Xóa 9 file `components/import-goods/ImportSidebar/*` đã liệt kê ở trên.
  - Giữ nguyên `LotExpiryPopover.tsx/.css`.
  - Chạy `npm run lint` và `npm run build`.
