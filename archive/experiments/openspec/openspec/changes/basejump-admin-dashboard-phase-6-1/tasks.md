## 1. Install pgtap

- [ ] 6.1.1 Create `supabase/migrations/xxxx_install_pgtap.sql` with CREATE EXTENSION IF NOT EXISTS pgtap

## 2. Create Test Helpers

- [ ] 6.1.2 Create `supabase/tests/admin/000_helpers.sql` with tests.create_supabase_user, tests.authenticate_as, tests.get_supabase_user

## 3. Write DB Tests

- [ ] 6.1.3 Create `supabase/tests/admin/test_helper_functions.sql` — tests for has_tenant_role, get_tenants_for_user, is_tenant_owner, is_system_admin
- [ ] 6.1.4 Create `supabase/tests/admin/test_rls_policies.sql` — tests for RLS policies on tenants and tenant_memberships
- [ ] 6.1.5 Create `supabase/tests/admin/test_billing.sql` — tests for billing schema and subscription lifecycle
- [ ] 6.1.6 Create `supabase/tests/admin/test_audit_log.sql` — tests for audit log triggers

## 4. Update Documentation

- [ ] 6.1.7 Update `memory-zone/AGENTS.md` with DB test commands (supabase test db)

## 5. Verification

- [ ] 6.1.8 Run pgtap tests: `supabase test db`
- [ ] 6.1.9 Run `openspec validate basejump-admin-dashboard-phase-6-1 --store admin-dashboard --json`

## Acceptance Criteria

- [ ] pgtap extension is installed and available
- [ ] Test helpers (create_supabase_user, authenticate_as, get_supabase_user) work correctly
- [ ] Helper function tests pass: has_tenant_role, get_tenants_for_user, is_tenant_owner, is_system_admin
- [ ] RLS policy tests pass: select/update/insert/delete for different roles
- [ ] Billing tests pass: customer creation, subscription lifecycle transitions
- [ ] Audit log tests pass: insert/update/delete triggers
- [ ] AGENTS.md has DB test commands documented
- [ ] `supabase test db` passes all tests
- [ ] `openspec validate` passes
