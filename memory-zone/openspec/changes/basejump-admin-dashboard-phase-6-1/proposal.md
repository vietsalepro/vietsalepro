## Why

Current admin dashboard lacks database-level tests for helper functions, RLS policies, billing logic, and audit log triggers. Without pgtap tests, regressions in DB logic (e.g., `has_tenant_role()`, RLS policies, subscription lifecycle transitions, audit triggers) can go undetected until runtime, causing data leaks, incorrect billing, or missing audit trails. This sub-phase adds comprehensive pgtap tests to ensure DB correctness before deploying to production.

## What Changes

- Install pgtap extension via migration SQL file
- Create test helpers (`tests.create_supabase_user`, `tests.authenticate_as`, `tests.get_supabase_user`) following Basejump `supabase_test_helpers` pattern
- Write pgtap tests for DB helper functions: `has_tenant_role()`, `get_tenants_for_user()`, `is_tenant_owner()`, `is_system_admin()`
- Write pgtap tests for RLS policies on `tenants` and `tenant_memberships` tables
- Write pgtap tests for billing schema: subscription lifecycle transitions, `billing_customers`, `tenant_subscriptions`
- Write pgtap tests for audit log triggers: insert/update/delete on key tables
- Update `memory-zone/AGENTS.md` with DB test commands

## Scope / Non-Goals

**In scope:**
- pgtap installation and test helpers
- DB tests for helper functions (Phase 3.2)
- DB tests for RLS policies (Phase 3.3)
- DB tests for billing schema (Phase 4.1)
- DB tests for audit log triggers (Phase 5.3)
- Documentation of test commands in AGENTS.md

**Out of scope:**
- UI tests (Vitest) — will be done in sub-phase 6.2
- CI pipeline setup — will be done in sub-phase 6.2
- Writing actual DB functions or migrations — only tests for existing code
- Performance or load testing

## Capabilities

### New Capabilities
- `admin-dashboard-db-tests`: pgtap-based database tests for helper functions, RLS, billing, and audit log

### Modified Capabilities
- None. This sub-phase only adds tests, does not modify existing behavior.

## Impact

- `supabase/migrations/xxxx_install_pgtap.sql` — new migration to install pgtap extension
- `supabase/tests/admin/000_helpers.sql` — new test helpers (create_supabase_user, authenticate_as, get_supabase_user)
- `supabase/tests/admin/test_helper_functions.sql` — new tests for has_tenant_role, get_tenants_for_user, is_tenant_owner, is_system_admin
- `supabase/tests/admin/test_rls_policies.sql` — new tests for RLS policies on tenants and tenant_memberships
- `supabase/tests/admin/test_billing.sql` — new tests for billing schema and subscription lifecycle
- `supabase/tests/admin/test_audit_log.sql` — new tests for audit log triggers
- `memory-zone/AGENTS.md` — updated with DB test commands

## Rollback

Remove the pgtap migration file and all test files under `supabase/tests/admin/`. Revert `memory-zone/AGENTS.md` changes. No production data is affected since tests run in transactions with ROLLBACK.
