## 0. Pre-Flight

- [x] 0.1 Create project backup using Copy-Item to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_2_<YYYYMMDD_HHMMSS>`
- [x] 0.2 Confirm `npm run lint` pass
- [x] 0.3 Confirm `npm run build` pass
- [x] 0.4 Read `docs/plans/import-goods-bugfix/PLAN_REFINED.md` Phase 2 section

## 1. Sub-phase 2a — Thêm route `/import/create`

- [x] 1.1 Add `/import/create` route to `sharedRoutes` in `App.tsx` before the existing `/import` route
- [x] 1.2 Pass the same `onImport`, `onAddSupplier`, `onDeleteImport`, `onUpdateImport` handlers to the new route
- [x] 1.3 Keep `/import` route for history tab
- [x] 1.4 Run `npm run lint`
- [x] 1.5 Run `npm run build`
- [x] 1.6 Manual test: direct URL `/import/create` renders create form

## 2. Sub-phase 2b — Detect tab từ URL trong ImportGoods

- [x] 2.1 Import `useLocation` from `react-router-dom` in `pages/ImportGoods.tsx`
- [x] 2.2 Initialize `activeTab` from `pathname` (`/import` → history, `/import/create` → create)
- [x] 2.3 Replace all `setActiveTab('create')` with `navigate('/import/create')`
- [x] 2.4 Replace all `setActiveTab('history')` and `handleCancelEdit` navigate to `/import`
- [x] 2.5 Ensure save-success handlers navigate to `/import`
- [x] 2.6 Run `npm run lint`
- [x] 2.7 Run `npm run build`
- [x] 2.8 Manual test: back/save/cancel navigation between URLs

## 3. Sub-phase 2c — Active state menu `/import/*`

- [x] 3.1 Update `isActiveLink` in `components/AppTopbar.tsx` to use `startsWith('/import')`
- [x] 3.2 Update mobile menu / BottomNav active-link logic if present
- [x] 3.3 Run `npm run lint`
- [x] 3.4 Run `npm run build`
- [x] 3.5 Manual test: desktop sidebar highlight
- [x] 3.6 Manual test: mobile menu highlight

## 4. Cleanup & Verification

- [x] 4.1 Run `npm run lint`
- [x] 4.2 Run `npm run build`
- [x] 4.3 Manual test: `/import` → history, `/import/create` → create, F5 on both
- [x] 4.4 Manual test: create → save → history, create → cancel → history
- [x] 4.5 Backup after phase if stable

## Acceptance Criteria

- [x] Truy cập `/import/create` hiển thị form tạo phiếu
- [x] Truy cập `/import` vẫn hiển thị tab history
- [x] Bấm "Nhập hàng" từ tab history → URL chuyển sang `/import/create`
- [x] Bấm "Quay lại" / Esc trong form → URL về `/import`
- [x] Lưu tạm / Hoàn thành thành công → URL về `/import`
- [x] F5 ở `/import/create` vẫn ở form create
- [x] F5 ở `/import` vẫn ở tab history
- [x] Desktop sidebar highlight `/import` khi ở `/import/create`
- [x] Mobile menu highlight đúng mục Nhập hàng
- [x] `npm run lint` PASS
- [x] `npm run build` PASS

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_2_<YYYYMMDD_HHMMSS>`
- Rollback trigger: route conflict, wrong tab on refresh, broken menu highlight, lint/build failure
