## Why

The ImportGoods component currently uses an internal `activeTab` state to switch between history and create views while the URL remains `/import`. This makes deep-linking, browser refresh, and menu active-state handling inconsistent. Introducing `/import/create` lets the URL reflect the current view and prepares the ground for the final menu highlight fix.

## What Changes

- Add `/import/create` route to `sharedRoutes` in `App.tsx` that renders `ImportGoods` with the same handlers.
- Change `ImportGoods` to derive `activeTab` from `window.location.pathname` or `useLocation()`.
- Replace `setActiveTab('create')` with `navigate('/import/create')`.
- Replace `setActiveTab('history')` and `handleCancelEdit` with `navigate('/import')`.
- Update `components/AppTopbar.tsx` (and mobile menu) to highlight `/import` when path starts with `/import`.

## Scope / Non-Goals

**In scope:**
- Sub-phases 2a, 2b, 2c as defined in `docs/plans/import-goods-bugfix/PLAN_REFINED.md`.
- Route addition, tab detection from URL, and menu active state.

**Out of scope:**
- Server-side data fetching (Phase 1).
- Cost/discount corrections (Phase 3).
- Validation changes (Phase 5).

## Capabilities

### New Capabilities
- `phase-2-routing`: ImportGoods supports URL-based tab switching through `/import` and `/import/create`.

### Modified Capabilities
- `app-router`: A new route `/import/create` is added alongside the existing `/import` route.
- `app-topbar`: Active-link logic highlights `/import` for any path starting with `/import`.

## Impact

- Affected files: `App.tsx`, `pages/ImportGoods.tsx`, `components/AppTopbar.tsx` (and mobile menu if present).
- Dead code: old `activeTab` state and `setActiveTab` calls will be removed from `ImportGoods`.
- Verification: `npm run lint`, `npm run build`, manual test of `/import`, `/import/create`, back navigation, and F5 refresh.

## Rollback

Restore `App.tsx`, `pages/ImportGoods.tsx`, and `components/AppTopbar.tsx` from the pre-phase backup. Expanded in `rollback.md`.
