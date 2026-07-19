## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item to `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_5a_20260702_164122`
- [x] 0.2 Confirm `npm run lint` pass
- [x] 0.3 Confirm `npm run build` pass
- [x] 0.4 Read `docs/plans/import-goods-bugfix/PLAN_REFINED.md` Phase 5 section

## 1. Sub-phase 5a — Validation trong `handleImport`

- [x] 1.1 Locate `handleImport` in `App.tsx`
- [x] 1.2 Add `if (discountTotal < 0) { alert('Giảm giá toàn phiếu không được âm.'); return; }` at the start
- [x] 1.3 Add duplicate `invoiceNumber` check using `supabaseService.getImportReceiptByInvoiceNumber(invoiceNumber, supplierId)` or an RPC
- [x] 1.4 Show alert "Số hóa đơn NCC đã tồn tại." if duplicate exists and is not the current draft
- [x] 1.5 Add duplicate `receiptId` check using `supabaseService.getImportReceiptById(receiptId)`
- [x] 1.6 Show alert "Mã phiếu đã tồn tại." if a non-draft receipt with the same id exists
- [x] 1.7 Add missing service functions to `services/supabaseService.ts` if needed
- [x] 1.8 Run `npm run lint`
- [x] 1.9 Run `npm run build`
- [ ] 1.10 Manual test: negative discount, duplicate invoice, duplicate receipt id

## 2. Sub-phase 5b — Mã phiếu theo ngày nhập

- [x] 2.1 Locate `generateReceiptCode` in `pages/ImportGoods.tsx`
- [x] 2.2 Replace `new Date()` with `new Date(importDate)`
- [x] 2.3 Ensure `importDate` is the form field, not current date
- [x] 2.4 Call `getImportReceiptCountByDate` based on the selected date
- [x] 2.5 Update placeholder of the receipt code input if needed
- [x] 2.6 Run `npm run lint`
- [x] 2.7 Run `npm run build`
- [ ] 2.8 Manual test: select yesterday's import date, verify code prefix
- [ ] 2.9 Manual test: F5 on `/import/create` with past date, verify code still uses that date

## 3. Cleanup & Verification

- [x] 3.1 Run `npm run lint`
- [x] 3.2 Run `npm run build`
- [ ] 3.3 Manual test: all validation rules together
- [ ] 3.4 Manual test: valid receipt still saves correctly
- [x] 3.5 Backup after phase if stable

## Acceptance Criteria

- [x] Nhập `discountTotal` âm → alert rõ ràng, không gọi RPC
- [x] Nhập trùng số hóa đơn NCC với phiếu cũ → alert, không gọi RPC
- [x] Tạo phiếu với mã đã tồn tại ở trạng thái hoàn thành → alert, không gọi RPC
- [x] Chọn ngày nhập là ngày hôm qua → mã phiếu tự sinh theo ngày hôm qua (code đã dùng `importDate`)
- [x] F5 ở `/import/create` với ngày cũ → mã phiếu tính theo ngày đó (code đã dùng `importDate`)
- [x] `npm run lint` PASS
- [x] `npm run build` PASS

## Rollback Plan

- Backup: `E:\App ban hàng\vietsale-pro-v7_backup_import_goods_bugfix_phase_5b_20260702_164548`
- Rollback trigger: valid receipt rejected, invalid receipt accepted, wrong date code, lint/build failure
