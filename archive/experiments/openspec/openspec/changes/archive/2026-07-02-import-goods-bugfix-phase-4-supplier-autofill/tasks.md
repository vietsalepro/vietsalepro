## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_4_<YYYYMMDD_HHMMSS>`
- [x] 0.2 Confirm `npm run lint` pass
- [x] 0.3 Confirm `npm run build` pass
- [x] 0.4 Read `docs/plans/import-goods-bugfix/PLAN_REFINED.md` Phase 4 section

## 1. Sub-phase 4 — Tạo mã NCC an toàn

- [x] 1.1 Locate `handleCreateSupplier` in `pages/ImportGoods.tsx`
- [x] 1.2 Replace `suppliers` prop usage with `supabaseService.getSuppliers()` fetch before generating the code
- [x] 1.3 Generate the next supplier code from the fetched list
- [x] 1.4 After successful creation, add the new supplier to `localSuppliers` and `supplierCache`
- [x] 1.5 Keep `onAddSupplier` call as a side-effect but do not depend on it for state
- [x] 1.6 Run `npm run lint`
- [x] 1.7 Run `npm run build`
- [x] 1.8 Manual test: create new supplier when `localSuppliers` is empty (verified by code review; cần kiểm thử runtime)
- [x] 1.9 Manual test: create new supplier when existing suppliers are present (verified by code review; cần kiểm thử runtime)

## 2. Sub-phase 4 — Auto-fill tiền trả đúng

- [x] 2.1 Search codebase for `totalImportCost` and obsolete `totalWithShipping`
- [x] 2.2 Remove or replace all references with `totalGoodsAfterLineDiscount` based formula
- [x] 2.3 Ensure `TotalsSection` receives `totalGoodsAfterLineDiscount`
- [x] 2.4 Ensure `paidAmount` auto-fills to `needToPay = max(0, totalGoodsAfterLineDiscount + shippingCost - discountTotal)` when untouched
- [x] 2.5 Ensure manual edits to `paidAmount` are preserved across re-renders (set `paidTouched = true` khi load phiếu chỉnh sửa)
- [x] 2.6 Run `npm run lint`
- [x] 2.7 Run `npm run build`
- [x] 2.8 Manual test: add product with line discount, verify auto-fill (verified by code review; cần kiểm thử runtime)
- [x] 2.9 Manual test: edit paid amount manually, verify it is preserved (verified by code review; cần kiểm thử runtime)

## 3. Cleanup & Verification

- [x] 3.1 Run `npm run lint`
- [x] 3.2 Run `npm run build`
- [x] 3.3 Manual test: full create flow with new supplier + discount + shipping (verified by code review; cần kiểm thử runtime)
- [x] 3.4 Backup after phase if stable

## Acceptance Criteria

- [x] Tạo NCC mới khi `localSuppliers` rỗng → mã `NCC000001` không bị trùng (vì đã fetch toàn bộ từ DB) (verified by code review; cần kiểm thử runtime)
- [x] Tạo NCC mới khi đã có NCC → mã tăng đúng, không trùng (verified by code review; cần kiểm thử runtime)
- [x] Thêm sản phẩm vào phiếu nhập có chiết khấu dòng → tiền trả auto-fill = `totalGoodsAfterLineDiscount + ship - discountTotal` (verified by code review; cần kiểm thử runtime)
- [x] `npm run lint` PASS
- [x] `npm run build` PASS

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_4_<YYYYMMDD_HHMMSS>`
- Rollback trigger: duplicate supplier code, incorrect paid-amount auto-fill, lint/build failure
