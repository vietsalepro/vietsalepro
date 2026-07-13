# SP-2.6 Execution Log — Build Global Config Page

**Date:** 2026-07-12
**Branch:** feat/SP-2.4-announcement-manager (current working branch)
**Commit:** 6634b4f4
**Status:** Completed, not pushed

---

## Scope

Xây dựng trang quản lý cấu hình toàn cục (global key-value config) với khả năng đọc/ghi qua Supabase RPC, cache 5 phút trên localStorage, và giao diện chỉnh sửa key-value có xử lý kiểu JSON.

## Artifacts

### Code

- `services/admin/globalConfigService.ts` — `getGlobalConfig`/`setGlobalConfig` wrapper gọi RPC `get_global_config`/`set_global_config`; kiểm tra admin và validate key non-empty.
- `hooks/useGlobalConfig.ts` — hook quản lý global config với:
  - localStorage TTL cache 5 phút.
  - `refresh()` xóa cache và refetch.
  - `setConfig()` cập nhật state/cache, xóa lỗi cũ, bắt lỗi RPC.
- `components/admin/GlobalConfigPanel.tsx` — form quản lý key-value:
  - Hiển thị các key hiện có dạng JSON-aware (`true`, `30`, `"true"`).
  - `parseDraft` chuyển đổi chuỗi nhập thành boolean/number/string/JSON nếu hợp lệ.
  - Form thêm key mới.
  - Toast thành công/lỗi.
- `pages/admin/GlobalConfigPage.tsx` — page wrapper cho `GlobalConfigPanel`.
- `pages/admin/AdminLayout.tsx` — thêm "Global config" vào Management sidebar, route map, page title.
- `App.tsx` — thêm lazy import `AdminGlobalConfig` và route `/admin/global-config`.
- `tests/mocks/supabase.ts` — thêm stub `get_global_config`/`set_global_config`.
- `docs/admin-dashboard/RPC_CONTRACTS.md` — đăng ký 2 RPC mới.

### Migration

- `supabase/migrations/20260720000000_sp2_6_global_config_rpc.sql` — tạo bảng `global_config` (RLS enabled), hàm `get_global_config` và `set_global_config` với kiểm tra system admin.
- **Chưa thực hiện push commit migration** (migration nằm trong commit SP-2.6).

### Edge Functions

- Không có Edge Function sinh ra trong phase này.
- **Chưa thực hiện push commit Edge Function** (vì không có Edge Function).

### Tests

- `tests/admin-dashboard/globalConfigService.test.ts` — TDD tests cho `getGlobalConfig`/`setGlobalConfig` (gọi RPC đúng, validate key, xử lý lỗi).
- `tests/admin-dashboard/useGlobalConfig.test.tsx` — tests cho cache hit/miss, cập nhật cache sau `setConfig`, xóa lỗi sau mutation thành công.
- `tests/admin-dashboard/GlobalConfigPanel.test.tsx` — UI tests cho loading, cập nhật giá trị số, preserve boolean/string type, thêm key mới, hiển thị lỗi.
- `tests/admin-dashboard/GlobalConfigPage.test.tsx` — render page wrapper.

## Backup

- Không tạo backup riêng cho SP-2.6; mã nguồn đã được commit vào local branch.

## Verification Commands

```bash
npm run lint              # tsc --noEmit, passed
npx vitest run            # 363 tests / 69 files, passed
npm run build             # production build, passed
npm run audit:rpc         # RPC contracts in sync, passed
```

## Pre-commit Review

- Static security scan: no hardcoded secrets, no eval/exec/pickle, no unsafe SQL concatenation, no shell injection.
- Independent reviewer subagent: passed after fixing JSONB round-trip type preservation, stale error state, and `invalidate()`/`refresh()` duplication.
- Self-review checklist: input validation (key non-empty, JSON-aware parsing), error handling in hook + UI, no debug logs, tests present.

## Notes

- Phase này **chưa được push** lên remote; commit nằm trên local branch `feat/SP-2.4-announcement-manager`.
- Migration RPC cần được push khi deploy (cùng commit SP-2.6).
- `set_global_config` sử dụng JSONB nên hỗ trợ string/boolean/number/object/array; UI hiện tại hỗ trợ edit cơ bản qua text input.
