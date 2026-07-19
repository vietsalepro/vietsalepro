## Context

After Phase 3 (DB/RLS model), Phase 4 (Billing), and Phase 5 (RBAC/Invite/Audit/Security), the admin dashboard has new DB helper functions, RLS policies, billing schema, and audit log triggers. However, there are no automated tests to verify these DB-level changes. Basejump uses pgtap with `supabase_test_helpers` for DB testing, running tests inside transactions to avoid side effects. This sub-phase follows the same pattern.

Reference plan: `memory-zone/KE_HOACH/Admin_dashboard/PLAN_BASEJUMP_ADMIN_DASHBOARD_ENTERPRISE_UPGRADE.md` Section 3.8 (Testing helpers) and Phase 6 (Testing & CI).

## Goals / Non-Goals

**Goals:**
- Install pgtap extension in the local/test database
- Create test helper functions (`tests.create_supabase_user`, `tests.authenticate_as`, `tests.get_supabase_user`)
- Write pgtap tests for `has_tenant_role()`, `get_tenants_for_user()`, `is_tenant_owner()`, `is_system_admin()`
- Write pgtap tests for RLS policies on `tenants` and `tenant_memberships`
- Write pgtap tests for billing schema (subscription lifecycle, customers, subscriptions)
- Write pgtap tests for audit log triggers (insert/update/delete on key tables)
- Document DB test commands in `memory-zone/AGENTS.md`

**Non-Goals:**
- Writing UI tests (Vitest) — deferred to sub-phase 6.2
- Setting up CI pipeline — deferred to sub-phase 6.2
- Modifying existing DB functions, RLS policies, or migrations
- Performance or load testing

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Use Basejump `supabase_test_helpers` pattern | Proven pattern that works with Supabase auth simulation | Write custom helpers from scratch |
| Install pgtap via migration file | Keeps setup consistent with other migrations; can be version-controlled | Install manually via Supabase dashboard |
| Run all tests inside transactions with ROLLBACK | Prevents test data from persisting; safe for production-like environments | Use separate test database |
| Place test files under `supabase/tests/admin/` | Follows Supabase convention for pgtap tests | Place tests inside migration files |
| Test RLS by authenticating as different users | Simulates real-world access patterns; catches policy bugs | Test RLS via direct SQL with role switching |

## Risks / Trade-offs

- **Medium** — pgtap extension may conflict with existing extensions or migrations. → Mitigation: Test installation inside a transaction first; use `IF NOT EXISTS` in CREATE EXTENSION.
- **Low** — Test helpers may not perfectly simulate Supabase auth (JWT claims). → Mitigation: Use `set_config` for `request.jwt.claim.sub` and `role` as recommended by Basejump.
- **Low** — Tests may fail if DB schema changes in future phases. → Mitigation: Keep tests in sync with schema changes; update tests as part of future sub-phases.

## Migration / Rollback

- How to deploy: run the pgtap installation migration; create test helper functions; write and run test files.
- How to undo: remove `supabase/migrations/xxxx_install_pgtap.sql`; delete all files under `supabase/tests/admin/`; revert `memory-zone/AGENTS.md`.
- Tests are safe: all tests run inside transactions with ROLLBACK, so no data persists.

## Open Questions

- Does the local Supabase instance have `pgcrypto` extension available? (Required for `gen_random_uuid()` in test helpers)
- What is the exact Supabase project ID for running `supabase test db`?
