## Context

P8.2 — Feature flags via tenants.settings JSONB + toggle UI (YAGNI).

## Goals / Non-Goals

**Goals:**
- P8.2 — Feature flags via tenants.settings JSONB + toggle UI (YAGNI).

**Non-Goals:**
- Other phases of the admin dashboard plan.

## Decisions

- Reuse existing project patterns (React + Vite + TypeScript + Supabase).
- Follow security rules from KE_HOACH_ADMIN_DASHBOARD.md.

## Risks / Trade-offs

- [Low] Scope creep if mixing multiple sub-phases. Mitigation: keep this change focused on one sub-phase only.

## Migration / Rollback

- Deploy: implement changes, run `npm run lint`, `npm run build`, apply migration if any.
- Rollback: restore from backup; see rollback.md.

## Open Questions

- None at planning time.
