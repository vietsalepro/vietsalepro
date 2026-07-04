## What Was Done

- Added `/import/create` route in `App.tsx` while keeping `/import` for history.
- Converted `ImportGoods` tab state to URL-driven behavior using `useLocation()`.
- Replaced all `setActiveTab` calls with `navigate('/import/create')` or `navigate('/import')`.
- Updated `AppTopbar.tsx` (and mobile menu if present) to highlight `/import` for any path starting with `/import`.
- Verified `npm run lint` and `npm run build`.

## What Was Verified

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test: `/import/create`, `/import`, back navigation, save navigation
- [ ] Manual test: F5 refresh on both URLs
- [ ] Desktop sidebar highlight test
- [ ] Mobile menu highlight test

## Next Phase

- Start OpenSpec change: `import-goods-bugfix-phase-3-cost`
- Next phase from PLAN_REFINED: Phase 3 — Sửa giá vốn / `import_items.cost`

## Blockers / Decisions

- None expected. If any mobile menu component is separate, ensure it was updated.

## Backup Location

`C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_2_<YYYYMMDD_HHMMSS>`
