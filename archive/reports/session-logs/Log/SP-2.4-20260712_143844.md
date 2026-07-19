# SP-2.4 Execution Log — Build Announcement Manager page

**Date:** 2026-07-12
**Branch:** feat/SP-2.4-announcement-manager
**Commit:** 7c690f75
**Status:** Completed, not pushed

---

## Scope

CRUD announcement với `audience`, `active_from`, `active_to`, preview banner.

## Artifacts

### Code

- `pages/admin/AnnouncementsPage.tsx` — new admin page wrapping `AnnouncementManager`.
- `components/AnnouncementManager.tsx` — refactored:
  - Replaced `targetType`/`targets` select+textarea with single `audience` text input.
  - Replaced `scheduledAt`/`expiresAt` with `activeFrom`/`activeTo` datetime-local inputs.
  - Added preview banner in create/edit modal.
  - Added accessible `htmlFor`/`id` pairs to form fields.
- `services/announcementService.ts` — added `audience`/`activeFrom`/`activeTo` support and helpers to keep legacy `target_type`/`targets` columns in sync.
- `types/announcement.ts` — extended `Announcement`, `CreateAnnouncementInput`, `UpdateAnnouncementInput`, `AnnouncementListFilters` with new fields.
- `pages/admin/AdminLayout.tsx` — added "Thông báo" sidebar item under Management with Megaphone icon.
- `App.tsx` — added lazy import and `/admin/announcements` route.

### Migration

- `supabase/migrations/20260719000000_sp2_4_announcement_audience_active_range.sql`
  - Adds columns `audience TEXT DEFAULT 'all'`, `active_from TIMESTAMPTZ`, `active_to TIMESTAMPTZ`.
  - Backfills legacy `target_type`/`targets`/`scheduled_at`/`expires_at` from new columns using strict UUID regex.
  - Updates `public.get_current_announcements_for_tenant` RPC to prefer new columns, falling back to legacy columns only when `audience IS NULL`.
- Copied to `Plan/Migration/20260719000000_sp2_4_announcement_audience_active_range.sql`.

### Edge Functions

- None generated in this phase.

### Tests

- `tests/admin-dashboard/announcementService.test.ts` — TDD tests for `audience` + active range.
- `tests/admin-dashboard/AnnouncementManager.test.tsx` — UI tests for list render, create with audience, preview banner.
- Existing `tests/smoke/admin-dashboard-p12-1-announcements.test.ts` still passes.

## Backup

- `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-2.4-20260712_142433`

## Verification Commands

```bash
npm run lint              # tsc --noEmit, passed
npx vitest run            # 343 tests / 63 files, passed
npm run build             # production build, passed
npm run audit:rpc         # RPC contracts in sync, passed
```

## Pre-commit Review

- Static security scan: no hardcoded secrets, no eval/exec/pickle, no unsafe SQL concatenation.
- Independent reviewer subagent: passed after fixing strict UUID regex in migration and aligning mock logic with production RPC.
- Self-review checklist: input validation, parameterized Supabase queries, error handling, no debug logs, tests present.

## Notes

- This phase has **not been pushed** to remote yet.
- Migration and code remain on local branch `feat/SP-2.4-announcement-manager`.
- The legacy `target_type`/`targets`/`scheduled_at`/`expires_at` columns are preserved and kept in sync on writes for backwards compatibility.
