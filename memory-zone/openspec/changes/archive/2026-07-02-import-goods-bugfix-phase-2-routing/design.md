## Context

After Phase 1, `ImportGoods` no longer depends on populated props for suppliers/products/stats. The next UX improvement is to expose the create view at its own URL so users can refresh, bookmark, and navigate directly. The existing `App.tsx` router uses `react-router-dom` `sharedRoutes` for all breakpoints.

## Goals / Non-Goals

**Goals:**
- `/import` renders the history tab.
- `/import/create` renders the create form.
- Browser refresh on either URL preserves the correct view.
- The `/import` menu item remains highlighted when the user is on `/import/create`.

**Non-Goals:**
- Changing how data is fetched or validated.
- Adding new menu items or renaming routes.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Add exact route `/import/create` before `/import` | React Router matches exact paths first; avoids `/import` swallowing `/import/create` | Make `/import` a layout with nested index/create routes |
| Derive `activeTab` from `useLocation()` | Keeps component state in sync with URL | Keep local `activeTab` and sync with URL via effect |
| Use `navigate('/import')` instead of `setActiveTab('history')` | Centralizes tab switching in the router | Keep both state and navigation |
| Highlight menu with `startsWith('/import')` | Simple and covers all import sub-routes | Maintain an explicit list of active paths |

## Risks / Trade-offs

- **Medium** — Nested route conflict between `/import` and `/import/create` if ordering is wrong. → Add `/import/create` first and verify React Router matching.
- **Medium** — `handleCancelEdit` or similar cleanup may still set tab state before navigating. → Audit all `setActiveTab` call sites and replace with `navigate`.
- **Low** — Menu active logic for mobile menu might differ. → Check both desktop `AppTopbar.tsx` and any mobile/BottomNav component.

## Migration / Rollback

- How to deploy: add the route, switch `ImportGoods` to URL-driven tab, update menu highlight, then test all navigation paths.
- How to undo: restore `App.tsx`, `pages/ImportGoods.tsx`, and menu component from backup.

## Open Questions

- Are there any other menu components besides `AppTopbar.tsx` that need the `startsWith('/import')` update? (e.g., mobile drawer or bottom nav)
