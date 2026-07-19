# SP-4.3: API Key Lifecycle — Execution Log

## Status
- **Sub-phase:** SP-4.3 API Key Lifecycle
- **Completed:** 2026-07-12 18:07 (ICT)
- **Branch:** `feat/SP-4.3-api-key-lifecycle`
- **Pushed:** No
- **Migration applied to staging/production:** No

## What was built / verified
- `services/apiKeyService.ts`:
  - `getTenantApiKeys(tenantId)` — invokes `list_tenant_api_keys` RPC and maps both camelCase and snake_case result rows.
  - `createTenantApiKey(tenantId, name, version)` — invokes `create_tenant_api_key` RPC; the returned `apiKey` plaintext is shown to the admin exactly once.
  - `revokeTenantApiKey(keyId)` — invokes `revoke_tenant_api_key` RPC and maps the revoked row.
- `components/ApiKeyManager.tsx`:
  - Tenant selector, create form (name + version), list with preview/status/last-used, revoke action, and a one-time copy modal for the newly created key.
- Security model (already in place from P15.1 baseline):
  - `tenant_api_keys` table stores SHA-256 hashes; only `api_key_preview` is retained.
  - All management RPCs require `is_system_admin()`.
  - `auth_tenant_api_key(p_api_key)` is a `SECURITY DEFINER` function that returns only `tenant_id` (or `NULL`).
- Rotation workflow:
  - Rotation is supported by creating a new key and revoking the old key from the same UI; no new RPC or migration was required for this phase.
- New test coverage:
  - `tests/admin-dashboard/apiKeyService.test.ts` with 5 tests: list keys, create returns plaintext once, revoke, propagate RPC errors, and empty-list handling.

## Backup
- Project backup created at `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-4.3-20260712_180208`.
- Backup excludes `node_modules` and `.git` to keep it lightweight; the full repo history is preserved on the local branch.

## Verification
- `npm run lint` (`tsc --noEmit`) — passed.
- `npx vitest run tests/admin-dashboard/apiKeyService.test.ts` — 5 tests passed.
- `npx vitest run` (full suite) — 82 test files, 465 tests passed.
- Independent pre-commit review — passed; no hardcoded secrets, no eval/exec, no SQL injection, no shell injection. Reviewer suggestion (use `fake-test-key` in fixture) was applied.

## Artifacts
- Code files: `services/apiKeyService.ts`, `components/ApiKeyManager.tsx` (already existed from P15.1 baseline; verified, no changes).
- Test files: `tests/admin-dashboard/apiKeyService.test.ts`.
- Migration file: `supabase/migrations/20250708000007_phase_p15_1_api_keys.sql` (already existed; not generated in this phase).
- Edge function: None generated in this phase.

## Not pushed / not deployed
- Commit `66c22b8` is local on `feat/SP-4.3-api-key-lifecycle` and has **not** been pushed.
- No new migration to apply to Supabase staging or production.
- No new Edge Function deployments in this phase.
