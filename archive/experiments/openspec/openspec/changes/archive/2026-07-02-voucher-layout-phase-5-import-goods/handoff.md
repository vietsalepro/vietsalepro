## What Was Done

- Deleted `components/import-goods/ImportFormLayout.tsx`, `ImportFormLayout.css`, `ImportTopBar.tsx`, and `ImportTopBar.css`.
- Removed V1 branches and `useRefactoredImportLayout` imports from all `ImportSidebar` sections.
- Replaced `NoteSection` raw textarea with `FormTextarea`.
- Removed duplicate accent classes and `.ig-input-sm--w140` from `TotalsSection.css`.
- Removed V1 branches from `ImportItemRow` and `ImportItemsTable`.
- Cleaned `pages/ImportGoods.css` and `pages/ImportGoods.tsx` so the create form uses only `VoucherFormLayout`.
- Removed the `ImportTopBar` dead import from `pages/ImportGoods.tsx`.
- Commented out `useRefactoredImportLayout` in `features.ts`.

## What Was Verified

- [ ] `npm run lint` pass after each sub-phase
- [ ] `npm run build` pass after the phase
- [ ] Grep confirms no `ImportFormLayout` or `ImportTopBar` imports
- [ ] Grep confirms no `useRefactoredImportLayout` imports in import components
- [ ] Manual test flow nhập hàng tạo/lưu tạm/hoàn thành/sửa draft pass
- [ ] Tính toán tiền và công nợ chính xác
- [ ] Responsive layout checked

## Next Phase

- Start OpenSpec change: `voucher-layout-phase-6-cleanup-ssot`
- Next phase from PLAN_02: Phase 6 — Dọn dẹp SSOT

## Blockers / Decisions

- `useRefactoredImportLayout` is commented out, not deleted, until Phase 6b.
- `SummaryRow.css` from Phase 3b must remain stable before Phase 6a deletes `StatsSection.css`.

## Backup Location

`C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase5_<YYYYMMDD_HHMMSS>`
