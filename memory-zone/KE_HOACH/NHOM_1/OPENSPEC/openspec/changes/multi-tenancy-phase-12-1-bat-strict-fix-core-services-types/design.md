## Context

This change implements sub-phase 12.1: Bật strict + fix core services/types from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- Bật `strict: true` trong `tsconfig.json`, fix lỗi trong `services/`, `types.ts`, `utils/`, `hooks/`.

- Code changes:
  - `tsconfig.json`: `"strict": true`
  - Fix `services/supabaseService.ts` (chỉ phần CRUD cơ bản, không chạm logic nghiệp vụ sâu).
  - Fix `types.ts`, `utils/`, `hooks/`.

**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.