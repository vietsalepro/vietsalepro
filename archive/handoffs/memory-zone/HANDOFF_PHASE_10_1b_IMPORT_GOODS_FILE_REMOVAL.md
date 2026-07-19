# Phase 10.1b — Dead Code Cleanup: import-goods file removal

## Tóm tắt

Thực hiện Phase 10.1b theo `openspec/changes/voucher-form-component-system-plan-a/tasks.md` section 23.

Đã xóa toàn bộ 9 file dead code của `import-goods` đã được audit xác nhận ở Phase 10.1a, giữ nguyên `LotExpiryPopover.tsx/.css` theo acceptance criteria.

## 1. Backup

- Đã tạo backup trước khi xóa file:
  - `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase10_1b_20260703_...`

## 2. File đã xóa

Xóa toàn bộ thư mục `components/import-goods/ImportSidebar/` (9 file):

| # | File |
|---|------|
| 1 | `components/import-goods/ImportSidebar/ActionFooter.tsx` |
| 2 | `components/import-goods/ImportSidebar/ActionFooter.css` |
| 3 | `components/import-goods/ImportSidebar/NoteSection.tsx` |
| 4 | `components/import-goods/ImportSidebar/ReceiptInfoSection.tsx` |
| 5 | `components/import-goods/ImportSidebar/ReceiptInfoSection.css` |
| 6 | `components/import-goods/ImportSidebar/SupplierSection.tsx` |
| 7 | `components/import-goods/ImportSidebar/SupplierSection.css` |
| 8 | `components/import-goods/ImportSidebar/TotalsSection.tsx` |
| 9 | `components/import-goods/ImportSidebar/TotalsSection.css` |

## 3. File được bảo toàn

- `components/import-goods/LotExpiryPopover.tsx` ✅ vẫn tồn tại
- `components/import-goods/LotExpiryPopover.css` ✅ vẫn tồn tại

## 4. Thay đổi file khác

- `openspec/changes/voucher-form-component-system-plan-a/tasks.md`: section 23 (23.1–23.4) đã cập nhật thành `[x]` kèm ghi chú.

## 5. Verification

- `npm run lint`: **PASS** (exit code 0)
- `npm run build`: **PASS** (exit code 0, build thành công trong ~10.10s)

## 6. Next phase

- Theo `tasks.md`, next phase là **Phase 10.1c — Dead Code Cleanup: disposal-form imports & grep audit** (section 24).
