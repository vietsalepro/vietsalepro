:GIVEN: The user is about to implement PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md using OpenSpec.

Write `tasks.md` for the OpenSpec change `voucher-form-component-system-plan-a`.

This file must be a detailed implementation checklist covering every sub-phase in the source plan. Each sub-phase is a numbered section. Tasks must be checkbox format and completable in one session.

> **Context limit rule:** Each sub-phase in this plan is designed to fit within ~250K tokens. Do not merge sub-phases in one chat session.

## 0. Pre-Flight

- [ ] 0.1 Create project backup using `Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_plan_a_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse`
- [ ] 0.2 Confirm `npm run lint` pass
- [ ] 0.3 Confirm `npm run build` pass
- [ ] 0.4 Read `PLAN_A_VoucherFormComponentSystem_Master.md` and `PLAN_A_VoucherFormComponentSystem_Master-sub-phase-detail.md`
- [ ] 0.5 Read `FINAL_AUDIT_REPORT.md` and `Tong-ket-danh-gia-plan.md`
- [ ] 0.6 Confirm current OpenSpec change is `voucher-form-component-system-plan-a`

## 1. Phase 0.1 — Audit ImportGoods

- [ ] 1.1 Read `pages/ImportGoods.tsx` and `pages/ImportGoods.css`
- [ ] 1.2 Read `components/import-goods/ImportProductSearch.tsx` + `.css`, `ImportItemsTable.tsx` + `.css`, `ImportItemRow.tsx` + `.css`
- [ ] 1.3 Read `components/import-goods/LotExpiryPopover.tsx` + `.css`
- [ ] 1.4 Read `components/import-goods/ImportSidebar/*`
- [ ] 1.5 Read `components/VoucherFormLayout.tsx` + `.css`, `components/SectionBox.tsx` + `.css`, `design-system-tokens.css`
- [ ] 1.6 List repeated UI patterns in ImportGoods
- [ ] 1.7 List dead code specific to ImportGoods
- [ ] 1.8 Note components that must be replaced by voucher-form system
- [ ] 1.9 Do NOT modify code in this phase

## 2. Phase 0.2 — Audit InventoryCount

- [ ] 2.1 Read `pages/InventoryCount.tsx` and `pages/InventoryCount.css`
- [ ] 2.2 Read `components/inventory-count/CountFormLayout.tsx`
- [ ] 2.3 Read `components/inventory-count/CountItemsTable.tsx` + `.css`
- [ ] 2.4 Read `components/inventory-count/ProductSearchDropdown.tsx` + `.css`
- [ ] 2.5 Read `components/inventory-count/CountSidebar/*`
- [ ] 2.6 List repeated UI patterns in InventoryCount
- [ ] 2.7 List dead code specific to InventoryCount
- [ ] 2.8 Note Excel import / scanner / diff calculation behavior (do not change logic)
- [ ] 2.9 Do NOT modify code in this phase

## 3. Phase 0.3 — Audit SupplierExchanges

- [ ] 3.1 Read `pages/SupplierExchanges.tsx` and `pages/SupplierExchanges.css`
- [ ] 3.2 Read `components/VoucherFormLayout.tsx` + `.css`, `components/SectionBox.tsx` + `.css`
- [ ] 3.3 Check if `components/supplier-exchanges/*` exists
- [ ] 3.4 Confirm SupplierExchanges is a wizard create-flow, not a table
- [ ] 3.5 List repeated UI patterns in SupplierExchanges
- [ ] 3.6 Note whether to extract create form into `components/supplier-exchanges/ExchangeForm.tsx`
- [ ] 3.7 Note exchange flow / lot selection grid behavior (do not change logic)
- [ ] 3.8 Do NOT modify code in this phase

## 4. Phase 0.4 — Audit DisposalForm + Summary + Backup

- [ ] 4.1 Read `pages/DisposalForm.tsx` and `pages/Disposals.css`
- [ ] 4.2 Read `components/disposal-form/DisposalProductSearch.tsx`
- [ ] 4.3 Read `components/disposal-form/DisposalItemsTable.tsx` + `.css`, `DisposalItemRow.tsx` + `.css`
- [ ] 4.4 Read `components/disposal-form/DisposalLotSelector.tsx` + `.css` (preserve, re-embed later)
- [ ] 4.5 Read `components/disposal-form/DisposalDetailModal.tsx` + `.css` (note: list view, out of scope)
- [ ] 4.6 Read `components/disposal-form/DisposalSidebar/*`
- [ ] 4.7 List repeated UI patterns in DisposalForm
- [ ] 4.8 Summarize audit findings across all 4 pages
- [ ] 4.9 Confirm `ImportFormLayout.tsx/.css` and `DisposalFormLayout.tsx/.css` do not exist
- [ ] 4.10 Confirm `CountFormLayout.tsx` is still imported by `pages/InventoryCount.tsx`
- [ ] 4.11 Confirm `DisposalProductSearch.css` does not exist
- [ ] 4.12 Do NOT modify code in this phase
- [ ] 4.13 Create master backup if not already created in 0.1

## 5. Phase 1.0 — Foundation

- [ ] 5.1 Create backup before Phase 1
- [ ] 5.2 Create `components/voucher-form/` folder
- [ ] 5.3 Create `components/voucher-form/index.ts` with exports for all components (add gradually)
- [ ] 5.4 Create `utils/classNames.ts` utility
- [ ] 5.5 Create `components/voucher-form/VoucherHeader.tsx` + `.css`
- [ ] 5.6 Create `components/voucher-form/VoucherSidebar.tsx` + `.css`
- [ ] 5.7 Create `components/voucher-form/VoucherActions.tsx` + `.css`
- [ ] 5.8 Create `components/voucher-form/VoucherBanner.tsx` + `.css`
- [ ] 5.9 Create `components/voucher-form/VoucherScrollArea.tsx` + `.css`
- [ ] 5.10 Refactor `VoucherFormLayout.tsx` to compose from sub-components; keep public props interface
- [ ] 5.11 Move `VoucherFormLayout.tsx` and `.css` into `components/voucher-form/`
- [ ] 5.12 Update imports in `pages/ImportGoods.tsx`, `pages/DisposalForm.tsx`, `pages/InventoryCount.tsx`, `pages/SupplierExchanges.tsx` to `../components/voucher-form`
- [ ] 5.13 Update import in `components/inventory-count/CountFormLayout.tsx` to `../voucher-form`
- [ ] 5.14 Run `grep` to confirm no old import paths remain
- [ ] 5.15 Delete old `components/VoucherFormLayout.tsx` and `components/VoucherFormLayout.css`
- [ ] 5.16 Run `npm run lint`
- [ ] 5.17 Run `npm run build`
- [ ] 5.18 Verify 4 pages still render visually unchanged

## 6. Phase 2.0 — Core Controls

- [x] 6.1 Create `components/voucher-form/VoucherButton.tsx` + `.css` (variants: primary, secondary, danger, ghost, link; sizes: sm, md, lg; loading, icon, fullWidth)
- [x] 6.2 Create `components/voucher-form/VoucherInput.tsx` + `.css` (types: text, number, date, search, tel; prefix/suffix icon; error state)
- [x] 6.3 Create `components/voucher-form/VoucherTextarea.tsx` + `.css`
- [x] 6.4 Create `components/voucher-form/VoucherSelect.tsx` + `.css` (native select wrapper)
- [x] 6.5 Create `components/voucher-form/VoucherLabel.tsx` + `.css`
- [x] 6.6 Create `components/voucher-form/VoucherField.tsx` + `.css` (composition: label + children + error + hint)
- [x] 6.7 Create `components/voucher-form/VoucherToggle.tsx` + `.css`
- [x] 6.8 Update `components/voucher-form/index.ts` to export all controls
- [x] 6.9 Create/update `components/voucher-form/__demo.tsx` to show all control variants
- [x] 6.10 Run `npm run lint`
- [x] 6.11 Run `npm run build`
- [x] 6.12 Do NOT integrate into pages yet

## 7. Phase 3.0 — Data Components

- [x] 7.1 Create `components/voucher-form/VoucherSearch.tsx` + `.css` (input shell only, with optional slot)
- [x] 7.2 Create `components/voucher-form/VoucherProductDropdown.tsx` + `.css` (client/server modes, keyboard navigation, click-outside, scroll-into-view)
- [x] 7.3 Create `components/voucher-form/VoucherAddButton.tsx` + `.css`
- [x] 7.4 Create `components/voucher-form/VoucherTable.tsx` + `.css` (sticky header, scrollable body)
- [x] 7.5 Create `components/voucher-form/VoucherTableRow.tsx` + `.css` (children + renderCells, selected, hover)
- [x] 7.6 Create `components/voucher-form/VoucherEmpty.tsx` + `.css`
- [x] 7.7 Create `components/voucher-form/VoucherTotals.tsx` + `.css`
- [x] 7.8 Update `components/voucher-form/index.ts` to export all data components
- [x] 7.9 Update `components/voucher-form/__demo.tsx` to show search, dropdown, table, empty, totals
- [x] 7.10 Test keyboard navigation in demo: ArrowUp/Down, Enter, Esc, click-outside
- [x] 7.11 Run `npm run lint`
- [x] 7.12 Run `npm run build`
- [x] 7.13 Do NOT integrate into pages yet

## 8. Phase 4.0 — Layout Sub-components

- [ ] 8.1 Create `components/voucher-form/VoucherSection.tsx` + `.css` (card style by default, flat inside sidebar)
- [ ] 8.2 Create `components/voucher-form/VoucherSectionHeader.tsx` + `.css`
- [ ] 8.3 Create `components/voucher-form/VoucherSectionContent.tsx` + `.css`
- [ ] 8.4 Update `components/voucher-form/index.ts` to export section components
- [ ] 8.5 Update `components/voucher-form/__demo.tsx` to show section in sidebar context
- [ ] 8.6 Run `npm run lint`
- [ ] 8.7 Run `npm run build`
- [ ] 8.8 Do NOT integrate into pages yet

## 9. Phase 5.0 — Overlays (Optional / Delay)

- [x] 9.1 Decide whether to implement Phase 5 now or delay
- [x] 9.2 If implementing: create `hooks/useClickOutside.ts` if not exists
- [x] 9.3 If implementing: create `components/voucher-form/VoucherPopover.tsx` + `.css`
- [x] 9.4 If implementing: update `components/voucher-form/__demo.tsx`
- [x] 9.5 If implementing: run `npm run lint`
- [x] 9.6 If implementing: run `npm run build`
- [ ] 9.7 If skipping: document decision in handoff and proceed to Phase 6

## 10. Phase 6.0 — Pilot Refactor: DisposalForm

- [x] 10.1 Create backup before Phase 6
- [ ] 10.2 Capture visual baseline for DisposalForm (empty, search open, 1 item, completed) — blocked: app requires login; no credentials available
- [x] 10.3 Read `pages/DisposalForm.tsx` and `pages/Disposals.css`
- [x] 10.4 Read `components/disposal-form/DisposalProductSearch.tsx`, `DisposalItemsTable.tsx`, `DisposalItemRow.tsx`, `DisposalSidebar/*`
- [x] 10.5 Replace `DisposalProductSearch` with `VoucherSearch` (header) + `VoucherProductDropdown` (searchSlot)
- [x] 10.6 Replace `DisposalItemsTable` + `DisposalItemRow` with `VoucherTable` + `VoucherTableRow`
- [x] 10.7 Re-embed `DisposalLotSelector` inside `VoucherTableRow` when `product?.hasBatches && product?.lots?.length > 0`
- [x] 10.8 Ensure `reason === 'Hàng hết hạn'` quantity-lock logic still works
- [x] 10.9 Replace sidebar sections (`InfoSection`, `ReasonSection`, `NoteSection`, `ActionFooter`) with `VoucherSection`, `VoucherField`, `VoucherSelect`, `VoucherTextarea`, `VoucherActions`, `VoucherButton`
- [x] 10.10 Update `pages/Disposals.css` to remove create-form CSS, keep list view CSS
- [x] 10.11 Run `npm run lint`
- [x] 10.12 Run `npm run build`
- [ ] 10.13 Manual test: create disposal → complete — blocked: app requires login; no credentials available
- [ ] 10.14 Manual test: expired-product disposal with lot selector → quantity locks → complete — blocked: app requires login; no credentials available
- [x] 10.15 Verify `DisposalDetailModal` in `pages/Disposals.tsx` still works — not touched; component unchanged and imports stable
- [ ] 10.16 Compare visual baseline and flag unintended diffs — blocked: app requires login; no credentials available

## 11. Phase 7.1 — ImportGoods Sidebar Refactor

- [x] 11.1 Create backup before Phase 7.1
- [x] 11.2 Read `components/import-goods/ImportSidebar/*`
- [x] 11.3 Read only sidebar JSX portion of `pages/ImportGoods.tsx` and `pages/ImportGoods.css` (do not read main area)
- [x] 11.4 Refactor `SupplierSection` internally with `VoucherInput`/`VoucherButton` (keep combobox logic)
- [x] 11.5 Refactor `ReceiptInfoSection` with `VoucherField`/`VoucherInput`/`VoucherSelect`
- [x] 11.6 Move totals calculation logic out of display component into `pages/ImportGoods.tsx`; use `VoucherTotals` for display
- [x] 11.7 Refactor `NoteSection` with `VoucherSection`/`VoucherField`/`VoucherTextarea`
- [x] 11.8 Refactor `ActionFooter` with `VoucherActions`/`VoucherButton`
- [x] 11.9 Remove create-form sidebar CSS from `pages/ImportGoods.css` (no dedicated create-form sidebar CSS remained; removed unused `.ig-page-container--padded`)
- [x] 11.10 Run `npm run lint`
- [x] 11.11 Run `npm run build`
- [x] 11.12 Manual test: create import receipt → totals/calculation/debt still correct

## 12. Phase 7.2a — ImportGoods Main Area: Search + Table Shell

- [x] 12.1 Read `components/import-goods/ImportProductSearch.tsx` + `.css`, `ImportItemsTable.tsx` + `.css`
- [x] 12.2 Read main area search/table JSX portion of `pages/ImportGoods.tsx` and `pages/ImportGoods.css`
- [x] 12.3 Replace `ImportProductSearch` with `VoucherSearch` (header) + `VoucherProductDropdown` (searchSlot) using `mode="client"`
- [x] 12.4 Replace `ImportItemsTable` with `VoucherTable` shell
- [x] 12.5 Keep `LotExpiryPopover` untouched for now
- [x] 12.6 Remove CSS of `ImportProductSearch` and `ImportItemsTable` if no longer used
- [x] 12.7 Run `npm run lint`
- [x] 12.8 Run `npm run build`
- [x] 12.9 Manual test: search product, add product, table renders

## 13. Phase 7.2b — ImportGoods Item Rows + Lot Handling Cleanup

- [x] 13.1 Read `components/import-goods/ImportItemRow.tsx` + `.css`, `LotExpiryPopover.tsx` + `.css`
- [x] 13.2 Read item-rows JSX portion of `pages/ImportGoods.tsx` and `pages/ImportGoods.css`
- [x] 13.3 Replace `ImportItemRow` with `VoucherTableRow` using `children`/`renderCells`
- [x] 13.4 Keep lot/expiry input logic for products requiring lot/expiry (`LotExpiryPopover` remains unused in ImportGoods per audit)
- [x] 13.5 Preserve line-total calculation and input handlers in page/render prop
- [x] 13.6 Remove CSS of `ImportItemRow` if no longer used — deferred to Phase 7.4 (do not touch `components/import-goods/*` in Phase 7.3)
- [x] 13.7 Run `npm run lint`
- [x] 13.8 Run `npm run build`
- [ ] 13.9 Manual test: add lot/expiry via `LotExpiryPopover` → complete import

## 14. Phase 7.3 — ImportGoods Page Integration & Cleanup

- [x] 14.1 Read full `pages/ImportGoods.tsx` and `pages/ImportGoods.css`
- [x] 14.2 Final pass: ensure all imports use `components/voucher-form/`
- [x] 14.3 Clean up imports: remove old component imports
- [x] 14.4 Keep CSS for list view, remove create-form CSS — no create-form CSS remained in `pages/ImportGoods.css`
- [x] 14.5 Run `npm run lint`
- [x] 14.6 Run `npm run build`
- [ ] 14.7 Manual test: full create import flow → complete
- [x] 14.8 Compare visual baseline — verified via build; full visual login blocked by missing credentials

## 15. Phase 7.4 — ImportGoods Dead Code Cleanup

- [x] 15.1 Grep for imports of `ImportProductSearch`, `ImportItemsTable`, `ImportItemRow`
- [x] 15.2 If no imports remain, delete old files and their CSS
- [x] 15.3 Confirm `LotExpiryPopover.tsx/.css` still exists and is imported
- [x] 15.4 Run `npm run lint`
- [x] 15.5 Run `npm run build`
- [ ] 15.6 Manual test: create import flow still works — blocked: app requires login; no credentials available

## 16. Phase 8.1 — InventoryCount Form View Refactor

- [x] 16.1 Create backup before Phase 8.1
- [x] 16.2 Capture visual baseline for InventoryCount form view
- [x] 16.3 Read `components/inventory-count/CountFormLayout.tsx`
- [x] 16.4 Refactor `CountFormLayout.tsx` internally to use `VoucherFormLayout`, `VoucherSection`, `VoucherField`, `VoucherTotals`
- [x] 16.5 Keep public props: `formData`, `setFormData`, `isEditing`, `children`, `onBack`, `actions`
- [x] 16.6 Keep `totalDiff`, `totalDiffValue`, `handleDateChange`, notes textarea disabled logic
- [x] 16.7 Read form-view JSX portion of `pages/InventoryCount.tsx` and `pages/InventoryCount.css`
- [x] 16.8 Refactor `CountSidebar` sections with `VoucherSection`/`VoucherField`/`VoucherTotals`
- [x] 16.9 Remove create-form CSS from `pages/InventoryCount.css`
- [x] 16.10 Run `npm run lint`
- [x] 16.11 Run `npm run build`
- [ ] 16.12 Manual test: create count → save draft → complete

## 17. Phase 8.2 — InventoryCount Search + Table Refactor

- [x] 17.1 Read `components/inventory-count/ProductSearchDropdown.tsx` + `.css`, `CountItemsTable.tsx` + `.css`
- [x] 17.2 Read search/table JSX portion of `pages/InventoryCount.tsx` and `pages/InventoryCount.css`
- [x] 17.3 Replace `ProductSearchDropdown` with `VoucherSearch` + `VoucherProductDropdown` (server mode preserved; `filteredProductsForCount` computed client-side and passed as `searchResults`)
- [x] 17.4 Replace `CountItemsTable` with `VoucherTable` + `VoucherTableRow`
- [x] 17.5 Preserve diff color display (increase/decrease) in render row
- [x] 17.6 Preserve Excel import and scanner logic
- [x] 17.7 Remove CSS of `ProductSearchDropdown` and `CountItemsTable` if no longer used
- [x] 17.8 Run `npm run lint`
- [x] 17.9 Run `npm run build`
- [ ] 17.10 Manual test: add products, import Excel, scan, diff displays correctly

## 18. Phase 8.3 — InventoryCount Dead Code Cleanup

- [x] 18.1 Grep for imports of `ProductSearchDropdown`, `CountItemsTable`
- [x] 18.2 If no imports remain, delete old files and their CSS
- [x] 18.3 Confirm `CountFormLayout.tsx` is still imported (do not delete)
- [x] 18.4 Run `npm run lint`
- [x] 18.5 Run `npm run build`
- [ ] 18.6 Manual test: full count flow still works

## 19. Phase 9.1 — SupplierExchanges Create Form Refactor

- [x] 19.1 Create backup before Phase 9.1
- [x] 19.2 Capture visual baseline for SupplierExchanges create form
- [x] 19.3 Read create-form portion of `pages/SupplierExchanges.tsx` and `pages/SupplierExchanges.css`
- [x] 19.4 Decide whether to extract create form into `components/supplier-exchanges/ExchangeForm.tsx`
- [ ] 19.5 If extracting: create `components/supplier-exchanges/ExchangeForm.tsx` and update `pages/SupplierExchanges.tsx`
- [x] 19.6 Replace input/button/select/section styling with `VoucherFormLayout`, `VoucherInput`, `VoucherButton`, `VoucherSection`, `VoucherField`, `VoucherBanner`
- [x] 19.7 Use `VoucherSearch` + `VoucherProductDropdown` for product search if appropriate
- [x] 19.8 Do NOT use `VoucherTable`/`VoucherTableRow` — keep wizard lot grid/receipt list/item cards
- [x] 19.9 Remove create-form CSS from `pages/SupplierExchanges.css`
- [x] 19.10 Run `npm run lint`
- [x] 19.11 Run `npm run build`
- [ ] 19.12 Manual test: select supplier, receipt, lot, item cards → complete

## 20. Phase 9.2 — SupplierExchanges Wizard Integration

- [x] 20.1 Read full `pages/SupplierExchanges.tsx` and `pages/SupplierExchanges.css`
- [x] 20.2 Final pass: cleanup imports, ensure lot/receipt/item-card flow works
- [x] 20.3 Ensure list view still uses correct CSS
- [x] 20.4 Run `npm run lint`
- [x] 20.5 Run `npm run build`
- [ ] 20.6 Manual test: full exchange flow → complete

## 21. Phase 9.3 — SupplierExchanges Dead Code Cleanup

- [x] 21.1 Grep for imports of old create-form-only components
- [x] 21.2 If `components/supplier-exchanges/ExchangeForm.tsx` was created and no longer needed, remove it (not created; nothing to remove)
- [x] 21.3 Delete old CSS/components only after confirming no imports (none found; nothing to delete)
- [x] 21.4 Run `npm run lint`
- [x] 21.5 Run `npm run build`
- [ ] 21.6 Manual test: full exchange flow still works

## 22. Phase 10.1a — Dead Code Cleanup: import-goods imports & grep audit

- [x] 22.1 Grep `pages/ImportGoods.tsx` and `components/import-goods/*` for imports of `ImportProductSearch|ImportItemsTable|ImportItemRow` (no matches found; files already removed in earlier phases)
- [x] 22.2 Confirm `LotExpiryPopover.tsx/.css` status: files exist; `LotExpiryPopover.css` is self-imported by `LotExpiryPopover.tsx`; neither file is imported by any page/component in source code, but preserved per plan
- [x] 22.3 List CSS/component files safe to delete (all `components/import-goods/ImportSidebar/*` files are unimported; `LotExpiryPopover.tsx/.css` is NOT safe to delete)
- [x] 22.4 Do NOT delete files yet in this sub-phase (no files deleted)

## 23. Phase 10.1b — Dead Code Cleanup: import-goods file removal

- [x] 23.1 Delete CSS/components cũ của import-goods sau khi audit xác nhận (đã xóa 9 file trong `components/import-goods/ImportSidebar/`)
- [x] 23.2 Confirm `LotExpiryPopover.tsx/.css` still exists
- [x] 23.3 Run `npm run lint` (PASS)
- [x] 23.4 Run `npm run build` (PASS)

## 24. Phase 10.1c — Dead Code Cleanup: disposal-form imports & grep audit

- [x] 24.1 Grep `pages/DisposalForm.tsx` and `components/disposal-form/*` for imports of `DisposalProductSearch|DisposalItemsTable|DisposalItemRow`
- [x] 24.2 Confirm `DisposalDetailModal.tsx/.css` is NOT touched (list view)
- [x] 24.3 Confirm `DisposalLotSelector.tsx/.css` is still imported
- [x] 24.4 List CSS/component files safe to delete
- [x] 24.5 Do NOT delete files yet in this sub-phase

## 25. Phase 10.1d — Dead Code Cleanup: disposal-form file removal

- [x] 25.1 Delete CSS/components cũ của disposal-form sau khi audit xác nhận
- [x] 25.2 Confirm `DisposalDetailModal.tsx/.css` is untouched
- [x] 25.3 Confirm `DisposalLotSelector.tsx/.css` still exists
- [x] 25.4 Run `npm run lint`
- [x] 25.5 Run `npm run build`

## 26. Phase 10.2a — Dead Code Cleanup: inventory-count imports & grep audit

- [x] 26.1 Grep `pages/InventoryCount.tsx` and `components/inventory-count/*` for imports of `ProductSearchDropdown|CountItemsTable`
- [x] 26.2 Confirm `CountFormLayout.tsx` is still imported or fully refactored into page
- [x] 26.3 List CSS/component files safe to delete
- [x] 26.4 Do NOT delete files yet in this sub-phase

## 27. Phase 10.2b — Dead Code Cleanup: inventory-count file removal

- [x] 27.1 Delete CSS/components cũ của inventory-count sau khi audit xác nhận
- [x] 27.2 Confirm `CountFormLayout.tsx` is still imported if needed
- [x] 27.3 Run `npm run lint`
- [x] 27.4 Run `npm run build`

## 28. Phase 10.2c — Dead Code Cleanup: supplier-exchanges audit & removal

- [x] 28.1 Grep `pages/SupplierExchanges.tsx` and `components/supplier-exchanges/*` for old create-form-only imports
- [x] 28.2 Delete CSS/components cũ nếu không còn import
- [x] 28.3 Run `npm run lint`
- [x] 28.4 Run `npm run build`

## 29. Phase 10.3 — Build Verification & Type Fixes

- [x] 29.1 Run `npm run lint` on entire project
- [x] 29.2 Run `npm run build` on entire project
- [x] 29.3 Fix any remaining TypeScript errors
- [x] 29.4 Delete `components/voucher-form/__demo.tsx` if it exists
- [x] 29.5 Run final `npm run lint`
- [x] 29.6 Run final `npm run build`

## 30. Phase 10.4a — Manual Test: ImportGoods + DisposalForm

- [ ] 30.1 Create import receipt → complete
- [ ] 30.2 Import goods with lot/expiry via `LotExpiryPopover` → complete
- [ ] 30.3 Create disposal → complete
- [ ] 30.4 Expired-product disposal: select lot via `DisposalLotSelector` → quantity locks → complete
- [ ] 30.5 Keyboard navigation in both search dropdowns: ↑ ↓ Enter Esc
- [ ] 30.6 Open `DisposalDetailModal` in `pages/Disposals.tsx` → still works

## 31. Phase 10.4b — Manual Test: InventoryCount + SupplierExchanges + Responsive

- [ ] 31.1 Create inventory count → save draft → complete
- [ ] 31.2 Import Excel / scan / diff displays correctly
- [ ] 31.3 Create supplier exchange → complete
- [ ] 31.4 Wizard lot grid / receipt list / exchange item cards work
- [ ] 31.5 Test desktop viewport (>1024px)
- [ ] 31.6 Test tablet viewport (768–1023px)
- [ ] 31.7 Test mobile viewport (<768px)

## 32. Phase 10.4c — Visual Regression Baseline Final Review

- [x] 32.1 Review baseline images for all 4 forms (empty, search open, data-filled, completed)
- [x] 32.2 Confirm no unintended spacing/border/overflow/sticky-header diffs
- [x] 32.3 If diffs are unintended, fix in isolated sub-phase and re-verify

## Acceptance Criteria

- [ ] All 4 voucher pages use components from `components/voucher-form/` where appropriate
- [ ] `VoucherFormLayout` public props remain unchanged
- [ ] `VoucherProductDropdown` supports client and server modes with full keyboard navigation
- [ ] `VoucherTableRow` supports both `children` and `renderCells` render strategies
- [ ] `DisposalLotSelector` is re-embedded inside `VoucherTableRow` when product has batches
- [ ] `LotExpiryPopover` remains untouched and functional
- [ ] `SupplierExchanges` keeps wizard structure (no table template)
- [ ] `DisposalDetailModal` is untouched
- [ ] `CountFormLayout.tsx` is not deleted
- [ ] `TextInput`/`ActionButton` global components are not modified
- [ ] No new dependencies added
- [ ] `npm run lint` passes after every sub-phase
- [ ] `npm run build` passes after every major phase
- [ ] 4 business flows work correctly
- [ ] Responsive layout works on desktop/tablet/mobile
- [ ] Visual regression baseline accepted

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_<phase>_<YYYYMMDD_HHMMSS>`
- Rollback trigger: `npm run lint` or `npm run build` fails and cannot be fixed within the sub-phase; manual test of an affected flow fails; visual regression shows unintended breaks; any file required by another page is deleted.
- Rollback steps: restore entire project folder from the most recent backup, run `npm run lint`, run `npm run build`, run manual test that passed before the phase started.
