# RECOVERY PACKAGE-01 IMPLEMENTATION REPORT

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Package:** Recovery Package-01 — Domain A (Auth, Identity & Security)  
**Date:** 2026-07-16  
**Status:** Complete  

---

## 1. RPCs Implemented

20 Domain A mock RPC handlers implemented in `tests/mocks/supabase.ts`:

| # | RPC | Return Type | Migration File |
|---|---|---|---|
| 1 | `can_use_feature` | BOOLEAN | `20260713000009_create_plan_features.sql` |
| 2 | `has_tenant_role` | BOOLEAN | `20260715000010_fix_rls_helpers_enum_compare.sql` |
| 3 | `is_system_admin` | BOOLEAN | `20260712000011_fix_is_system_admin_service_role.sql` |
| 4 | `is_tenant_owner` | BOOLEAN | `20260715000010_fix_rls_helpers_enum_compare.sql` |
| 5 | `get_tenant_by_subdomain` | public.tenants | `20250704000000_phase2_tenant_foundation.sql` |
| 6 | `is_2fa_enabled` | BOOLEAN | `20250708000013_phase_p17_1_2fa_totp.sql` |
| 7 | `generate_2fa_backup_codes` | JSON | `20250708000013_phase_p17_1_2fa_totp.sql` |
| 8 | `list_2fa_backup_codes` | JSON | `20250708000013_phase_p17_1_2fa_totp.sql` |
| 9 | `delete_2fa_backup_codes` | VOID | `20250708000013_phase_p17_1_2fa_totp.sql` |
| 10 | `verify_2fa_backup_code` | JSON | `20250708000013_phase_p17_1_2fa_totp.sql` |
| 11 | `record_login_attempt` | UUID | `20260715000004_login_audit_triggers.sql` |
| 12 | `get_login_attempts` | JSONB | `20260715000004_login_audit_triggers.sql` |
| 13 | `get_locked_emails` | JSONB | `20260715000004_login_audit_triggers.sql` |
| 14 | `unlock_login_attempts` | VOID | `20260715000003_admin_security_settings.sql` |
| 15 | `get_tenant_security_settings` | JSONB | `20260715000003_admin_security_settings.sql` |
| 16 | `update_tenant_ip_allowlist` | VOID | `20260715000003_admin_security_settings.sql` |
| 17 | `update_tenant_session_timeout` | VOID | `20260715000003_admin_security_settings.sql` |
| 18 | `record_admin_login` | UUID | `20250708000014_phase_p17_2_login_history.sql` |
| 19 | `get_admin_login_history` | JSON | `20250708000014_phase_p17_2_login_history.sql` |
| 20 | `get_admin_login_alerts` | JSON | `20250708000014_phase_p17_2_login_history.sql` |

---

## 2. Handler Location

All 20 handlers are located in `tests/mocks/supabase.ts` inside the `rpc()` dispatch function, inserted before the terminal `PGRST116` fallback, after the `apply_voucher_to_invoice` handler (the last pre-existing handler).

---

## 3. Stores Used

### New stores added:
- `login_attempts: []` — for `record_login_attempt`, `get_login_attempts`, `get_locked_emails`, `unlock_login_attempts`
- `admin_login_history: []` — for `record_admin_login`, `get_admin_login_history`, `get_admin_login_alerts`
- `admin_2fa_backup_codes: []` — for `generate_2fa_backup_codes`, `list_2fa_backup_codes`, `delete_2fa_backup_codes`, `verify_2fa_backup_code`

### Existing stores reused:
- `tenants` — for `get_tenant_by_subdomain`, `get_tenant_security_settings`, `update_tenant_ip_allowlist`, `update_tenant_session_timeout`
- `tenant_memberships` — for `has_tenant_role`, `is_tenant_owner`
- `tenant_subscriptions` — for `can_use_feature`
- `system_admins` — for `record_admin_login`
- `users` — referenced by existing store methods
- `plans` — referenced by `getPlan()` helper

### Existing helpers reused:
- `isSystemAdmin` — for authorization checks
- `currentUserId` — for user context
- `isTenantMember()` — for security settings authorization
- `uuid()` — for ID generation
- `getPlan()` — for plan lookup in `can_use_feature`

---

## 4. Implementation Details

Each handler follows the existing `if (name === '...')` dispatch pattern (no switch, no Map, no generic helper). Return shapes are derived directly from canonical migration `RETURNS` clauses:

| Pattern | Handlers |
|---|---|
| `{ data: boolean, error: null }` | `can_use_feature`, `has_tenant_role`, `is_system_admin`, `is_tenant_owner`, `is_2fa_enabled` |
| `{ data: uuid, error: null }` | `record_login_attempt`, `record_admin_login` |
| `{ data: null, error: null }` | `delete_2fa_backup_codes`, `unlock_login_attempts`, `update_tenant_ip_allowlist`, `update_tenant_session_timeout` |
| `{ data: { user_id, codes }, error: null }` | `generate_2fa_backup_codes` |
| `{ data: [{ id, createdAt }], error: null }` | `list_2fa_backup_codes` |
| `{ data: { valid, code_id }, error: null }` | `verify_2fa_backup_code` |
| `{ data: { data: [...], count }, error: null }` | `get_login_attempts`, `get_admin_login_history` |
| `{ data: [{ email, failed_count, last_attempt }], error: null }` | `get_locked_emails` |
| `{ data: { tenant_id, allowed_ips, session_timeout_minutes }, error: null }` | `get_tenant_security_settings` |
| `{ data: tenant, error: null }` | `get_tenant_by_subdomain` |
| `{ data: { failed_burst, new_device, rapid_login }, error: null }` | `get_admin_login_alerts` |

---

## 5. Validation Results

| Validation | Command | Result |
|---|---|---|
| Audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | **PASS** — exit 0, 0 missing RPCs |
| TypeScript | `npx tsc --noEmit` | **PASS** — exit 0, no type errors |
| Test suite | `npx vitest run` | **PASS** — 68 files, 389 tests passed |

---

## 6. Coverage

| Metric | BEFORE (Baseline) | AFTER (Recovery Package-01) | Delta |
|---|---|---|---|
| Mock handler blocks | ~116 | **136** | +20 |
| Covered code RPCs | 99/184 (~53.8%) | **119/184 (~64.7%)** | +20 (+10.9pp) |
| Uncovered code RPCs | 85 | **65** | −20 |

### Coverage BEFORE: ~53.8% (99/184 code RPCs covered)
### Coverage AFTER (estimated): ~64.7% (119/184 code RPCs covered)

> **Note:** Coverage is estimated based on the audit script's mock coverage report. Actual coverage is confirmed when the audit gate reports the new handler count. Final coverage verification must be performed independently.

---

## 7. Self-Check Results

| Check | Result |
|---|---|
| Duplicate handlers | **PASS** — 0 duplicates (audit gate confirmed) |
| Duplicate helpers | **PASS** — reused existing helpers only |
| Duplicate stores | **PASS** — new stores added only for tables that didn't exist |
| Dead code | **PASS** — no dead code introduced |
| Syntax | **PASS** — TypeScript compiles cleanly |
| Type consistency | **PASS** — return shapes match canonical migration signatures |
| Additive-only | **PASS** — no existing handlers modified or removed |

---

## 8. Architecture Compliance

| Requirement | Status |
|---|---|
| `if (name === '...')` dispatch pattern | ✅ Followed |
| No switch/Map/factory/generic | ✅ Compliant |
| No modification outside `tests/mocks/supabase.ts` | ✅ Compliant |
| Return shapes from canonical migration | ✅ Verified |
| Reuse existing stores/helpers where available | ✅ Compliant |
| New stores only where needed | ✅ 3 new stores added |

---

*End of Recovery Package-01 Implementation Report*