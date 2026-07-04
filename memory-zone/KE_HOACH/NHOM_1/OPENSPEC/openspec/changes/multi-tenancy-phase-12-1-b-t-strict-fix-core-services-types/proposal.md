## Why

Bật `strict: true` trong `tsconfig.json`, fix lỗi trong `services/`, `types.ts`, `utils/`, `hooks/`.

## What Changes

- Code changes:
  - `tsconfig.json`: `"strict": true`
  - Fix `services/supabaseService.ts` (chỉ phần CRUD cơ bản, không chạm logic nghiệp vụ sâu).
  - Fix `types.ts`, `utils/`, `hooks/`.

## Scope / Non-Goals

**In scope:**
- Sub-phase 12.1: Bật strict + fix core services/types
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `b-t-strict-fix-core-services-types`: Bật `strict: true` trong `tsconfig.json`, fix lỗi trong `services/`, `types.ts`, `utils/`, `hooks/`.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.