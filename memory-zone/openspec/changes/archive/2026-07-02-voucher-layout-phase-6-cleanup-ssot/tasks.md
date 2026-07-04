## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item
- [x] 0.2 Confirm `npm run lint` pass
- [x] 0.3 Confirm `npm run build` pass
- [x] 0.4 Confirm Phases 1–5 are complete and handoffs are reviewed

## 1. Xóa dead code files còn sót (Phase 6a)

- [x] 1.1 Grep for `ImportFormLayout`, `DisposalFormLayout`, `ImportTopBar`, `DisposalTopBar`, `StatsSection`, `CountFormLayout` — confirm only dead files reference them
- [x] 1.2 Confirm `pages/ImportGoods.tsx` and `pages/DisposalForm.tsx` no longer import the files to delete
- [x] 1.3 Delete `components/import-goods/ImportFormLayout.tsx` + `.css`
- [x] 1.4 Delete `components/import-goods/ImportTopBar.tsx` + `.css`
- [x] 1.5 Delete `components/disposal-form/DisposalFormLayout.tsx` + `.css`
- [x] 1.6 Delete `components/disposal-form/DisposalTopBar.tsx` + `.css`
- [x] 1.7 Delete `components/disposal-form/DisposalSidebar/StatsSection.tsx` + `.css`
- [x] 1.8 Delete `components/inventory-count/CountFormLayout.css`
- [x] 1.9 Run `npm run lint`
- [x] 1.10 Run `npm run build`

## 2. Xóa 3 feature flags cũ trong `features.ts` (Phase 6b)

- [x] 2.1 Remove `export const useRefactoredImportLayout: boolean = true;`
- [x] 2.2 Remove `export const useRefactoredDisposalLayout: boolean = true;`
- [x] 2.3 Remove `export const useRefactoredCountLayout: boolean = true;`
- [x] 2.4 Grep `components/` and `pages/` for the three flags — result must be empty
- [x] 2.5 Grep `features.ts` for the three flags — result must be empty
- [x] 2.6 Run `npm run lint`
- [x] 2.7 Run `npm run build`

## 3. Gộp CSS textarea dùng chung và final grep check (Phase 6c)

- [x] 3.1 Confirm `DisposalSidebar/NoteSection.tsx`, `ImportSidebar/NoteSection.tsx`, and `CountFormLayout.tsx` use `FormTextarea`
- [x] 3.2 Remove `.disposal-note-textarea` from `DisposalSidebar/NoteSection.css`
- [x] 3.3 Remove `.import-note-textarea` from `ImportSidebar/NoteSection.css`
- [x] 3.4 Confirm `.count-notes-textarea` no longer exists
- [x] 3.5 List all `ig-*` classes in `index.css`
- [x] 3.6 Grep each `ig-*` class in `components/` and `pages/` to confirm usage
- [x] 3.7 Remove unused `ig-*` layout/form classes (`.ig-layout`, `.ig-create-form`, `.ig-section-*`, `.ig-input*`, `.ig-btn-*`, `.ig-badge-*`, `.ig-textarea`, `.ig-select`, `.ig-row*`, `.ig-totals*`, `.ig-search`, `.ig-notes-textarea`, `.ig-bg`, etc.)
- [x] 3.8 Keep classes used by history/detail/list views (`.ig-page-detail-*`, `.ig-history-*`, `.ig-receipt-detail`, `.ig-search-*`, `.ig-filter-*`, `.ig-pagination-*`)
- [x] 3.9 Run final grep for `ig-layout|import-layout|disposal-layout|count-layout|useRefactoredImportLayout|useRefactoredDisposalLayout|useRefactoredCountLayout|ImportTopBar|DisposalTopBar` — result must be empty
- [x] 3.10 Run final grep for `VoucherFormLayout` — result must only contain:
  - `components/VoucherFormLayout.tsx`
  - `pages/ImportGoods.tsx`
  - `pages/InventoryCount.tsx` (via `CountFormLayout`)
  - `pages/DisposalForm.tsx`
  - `pages/SupplierExchanges.tsx`
  - `components/inventory-count/CountFormLayout.tsx`
- [x] 3.11 Run `npm run lint`
- [x] 3.12 Run `npm run build`

## 4. Cleanup & Verification

- [x] 4.1 Confirm 11 dead code files are deleted
- [x] 4.2 Confirm 3 feature flags are deleted
- [x] 4.3 Confirm no layout flags or old layout names remain
- [x] 4.4 Confirm `index.css` audited
- [x] 4.5 Confirm `npm run lint` pass
- [x] 4.6 Confirm `npm run build` pass

## Acceptance Criteria

- [x] 11 dead code files deleted
- [x] 3 feature flags removed from `features.ts`
- [x] No imports/usages of the 3 flags in the codebase
- [x] No class CSS layout cũ (`ig-layout`, `import-layout`, `disposal-layout`, `count-layout`) remains
- [x] No `ImportTopBar` / `DisposalTopBar` in the codebase
- [x] Note textarea uses shared `FormTextarea` style
- [x] `index.css` audited and unused `ig-*` classes removed
- [x] Final grep confirms only `VoucherFormLayout` is used as the layout
- [x] `npm run lint` pass
- [x] `npm run build` pass

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase6_<YYYYMMDD_HHMMSS>`
- Files to restore: any accidentally deleted dead code file, `features.ts`, `index.css`, or note section CSS
- Rollback trigger: build failure, missing file discovered, or `ig-*` class still needed
