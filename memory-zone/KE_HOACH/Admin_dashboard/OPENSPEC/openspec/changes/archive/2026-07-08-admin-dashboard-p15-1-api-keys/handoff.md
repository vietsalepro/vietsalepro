## What Was Done

- Completed P15.1 — API platform keys (YAGNI).
- Backend:
  - Created `public.tenant_api_keys` table with RLS (system admin only).
  - Added auth middleware `public.auth_tenant_api_key(p_api_key TEXT)` returning tenant_id, updating `last_used_at`.
  - Added RPCs: `create_tenant_api_key`, `revoke_tenant_api_key`, `list_tenant_api_keys`.
  - Added `version` column for API versioning.
- Frontend:
  - Added `ApiKeyManager` component with tenant selector, create/revoke/list UI, and one-time plaintext key display.
  - Wired new `API Keys` tab into `SystemAdminDashboard`.
- Service layer:
  - Added `services/apiKeyService.ts` and `TenantApiKey` type in `types/tenant.ts`.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Migration deployed to Supabase project `rsialbfjswnrkzcxarnj`
- [x] Manual DB tests:
  - `auth_tenant_api_key` returns correct tenant_id and updates `last_used_at` for active key.
  - `auth_tenant_api_key` returns NULL for revoked key.
  - `create_tenant_api_key` / `list_tenant_api_keys` / `revoke_tenant_api_key` work as system admin.

## Next Phase

- Next sub-phase in `KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md` (P15.2 webhooks when needed; P15 is YAGNI).

## Blockers / Decisions

- None.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p15-1-api-keys_20260708_102253`
