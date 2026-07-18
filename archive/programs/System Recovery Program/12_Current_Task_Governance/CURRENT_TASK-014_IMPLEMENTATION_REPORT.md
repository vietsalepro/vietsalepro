# CURRENT_TASK-014 — Implementation Report

**Program:** VietSalePro v7 — System Recovery Program
**Phase:** Phase 4 — Derived Validation Layer Realignment
**Document Type:** Implementation Report
**Date:** 2026-07-15
**Status:** Complete — Awaiting Program Manager Acceptance Review
**Authorizing CURRENT_TASK:** CURRENT_TASK-014 — Auth, Identity & Security Mock Coverage (Wave 1 / TASK-A)
**Architecture Decision:** `CURRENT_TASK-014_ARCHITECTURE_DECISION.md`
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-014_ARCHITECTURE_DECISION.md`, `CURRENT_TASK-013_ACCEPTANCE_RECORD.md`, `PHASE4_COVERAGE_ROADMAP.md`

---

## 1. Objective

Implement the 20 uncovered RPCs of **Domain A — Auth, Identity & Security** as mock handlers in `tests/mocks/supabase.ts`, following the existing `if (name === '...')` dispatch pattern, with each handler's return shape derived directly from the canonical migration chain (`supabase/migrations/*.sql`). The task raises mock coverage from **37.2% (68/183)** to **48.1% (88/183)** and unblocks the auth-guard execution path traversed by every other domain's service code.

---

## 2. Scope

### 2.1 In Scope

Exactly the 20 Domain A RPCs authorized by the Architecture Decision, organized into 5 sub-groups:

| Sub-group | RPCs |
|---|---|
| Permissions & Roles | `can_use_feature`, `has_tenant_role`, `is_system_admin`, `is_tenant_owner` |
| Tenant Context | `get_tenant_by_subdomain` |
| Two-Factor Auth | `delete_2fa_backup_codes`, `generate_2fa_backup_codes`, `is_2fa_enabled`, `list_2fa_backup_codes`, `verify_2fa_backup_code` |
| System-Admin Security | `get_locked_emails`, `get_login_attempts`, `get_tenant_security_settings`, `record_login_attempt`, `unlock_login_attempts`, `update_tenant_ip_allowlist`, `update_tenant_session_timeout` |
| Login History | `get_admin_login_alerts`, `get_admin_login_history`, `record_admin_login` |

**Count: 20 unique RPCs.**

### 2.2 Out of Scope

All other domains (B–H), production code, migrations, schema, generated types, the audit script, CI workflow, `package.json`, and any new file/script/governance artifact. No refactor of the mock dispatch. No mock behavioral shape-validation gate.

---

## 3. Files Changed

| File | Change | Nature |
|---|---|---|
| `tests/mocks/supabase.ts` | +20 handler blocks inserted inside the `rpc` dispatch function (lines 2060–2408), before the existing `PGRST116` fallback. | Additive only — no existing handler modified or removed. |
| `CURRENT_TASK-014_IMPLEMENTATION_REPORT.md` | This report (new deliverable). | Governance deliverable. |

**Note on working-tree state:** `git diff --stat` lists additional files (components, pages, services, scripts, other tests) that carry pre-existing uncommitted changes from prior sessions. Those files were **not** modified by CURRENT_TASK-014 and are outside this task's scope. The only file modified by this task is `tests/mocks/supabase.ts`, and the change is strictly additive (20 new `if (name === '...')` blocks).

---

## 4. Architecture Compliance

| # | Requirement (Architecture Decision §4 Constraints) | PASS / FAIL | Evidence |
|---|---|---|---|
| 1 | No feature development / architecture redesign / scope expansion | PASS | Only mock handlers added; no production logic touched. |
| 2 | No modification of production code, migrations, schema, generated types, CI, `package.json` | PASS | Only `tests/mocks/supabase.ts` modified by this task. |
| 3 | No new files / scripts / governance artifacts (report excepted) | PASS | Only this report added; no scripts or new mock files. |
| 4 | Implementation inside an approved CURRENT_TASK | PASS | CURRENT_TASK-014 authorized by Architecture Decision. |
| 5 | Mock handlers follow the existing `if (name === '...')` dispatch pattern | PASS | All 20 handlers use `if (name === '<rpc>')`. |
| 6 | Mock return shapes match canonical migration function signatures (RETURNS + params) | PASS | Each handler derives its return shape from the `CREATE FUNCTION` `RETURNS` clause and parameter list (see Traceability Matrix §6). |
| 7 | Additive only — no modification/removal of the existing 69 handlers | PASS | `git diff` of the edited region shows only insertions between the last existing handler and the fallback; existing handler count preserved (69 → 89, +20). |
| 8 | Audit script frozen (not modified) | PASS | `scripts/audit-rpc-contracts.ts` not touched by this task. |
| 9 | No mock for an RPC not in the canonical migration chain | PASS | Audit stale-mock gate: PASS — "All mock RPC handlers are defined in the canonical migration chain." |
| 10 | No duplicate handler for an already-mocked RPC | PASS | Audit duplicate gate: PASS — "No duplicate mock RPC handlers." |

**Architecture Compliance: PASS (10/10 constraints honored)**

---

## 5. Implementation Summary

Each of the 20 handlers was implemented inside the existing `rpc` async dispatch function in `tests/mocks/supabase.ts`, inserted immediately before the terminal `return { data: null, error: { code: 'PGRST116', message: 'RPC not found' } }` fallback. The dispatch pattern, store tables (`login_attempts`, `admin_login_history`, `admin_2fa_backup_codes`, `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins`, `users`), and existing helpers (`uuid`, `isSystemAdmin`, `currentUserId`) were reused — no new helper, abstraction, or Map dispatch was introduced.

Return shapes were derived directly from the canonical migration `RETURNS` clauses:

- **BOOLEAN** RPCs (`can_use_feature`, `has_tenant_role`, `is_system_admin`, `is_tenant_owner`, `is_2fa_enabled`) return `{ data: boolean, error: null }`.
- **UUID** RPCs (`record_login_attempt`, `record_admin_login`) return `{ data: uuid|null, error: null }`.
- **VOID** RPCs (`delete_2fa_backup_codes`, `unlock_login_attempts`, `update_tenant_ip_allowlist`, `update_tenant_session_timeout`) return `{ data: null, error: null }`.
- **JSON/JSONB** RPCs return the object shape built by the migration's `json_build_object` / `jsonb_build_object` / `json_agg`:
  - `generate_2fa_backup_codes` → `{ user_id, codes: string[] }`
  - `verify_2fa_backup_code` → `{ valid, code_id }`
  - `list_2fa_backup_codes` → `[{ id, createdAt }]`
  - `get_login_attempts` → `{ data: [...], count }`
  - `get_locked_emails` → `[{ email, failed_count, last_attempt }]`
  - `get_tenant_security_settings` → `{ tenant_id, allowed_ips, session_timeout_minutes }`
  - `get_admin_login_history` → `{ data: [...], count }`
  - `get_admin_login_alerts` → `{ failed_burst, new_device, rapid_login }`
- **public.tenants** RPC (`get_tenant_by_subdomain`) returns the tenant row or `null`.

Authorization guards that exist in the canonical functions (`is_system_admin()` checks in `get_login_attempts`, `get_locked_emails`, `get_admin_login_history`, `get_admin_login_alerts`) are mirrored in the mocks via the existing `isSystemAdmin` state, returning the same `42501` error shape used by neighboring existing handlers. Intentional simplifications are marked with `ponytail:` comments naming the ceiling and upgrade path (e.g. fixed 15-minute buckets for alert windows; no `auth.mfa_factors` in the mock store so `is_2fa_enabled` defaults false).

---

## 6. Traceability Matrix

Every new mock handler is traced to its canonical `CREATE [OR REPLACE] FUNCTION public.<name>` declaration in the forward migration chain.

| Mock RPC | Canonical Function | Migration File | Mock Line |
|---|---|---|---|
| can_use_feature | `public.can_use_feature(p_tenant_id UUID, p_feature_key TEXT, p_current_usage INTEGER DEFAULT 0) RETURNS BOOLEAN` | `20260713000009_create_plan_features.sql` | 2066 |
| has_tenant_role | `public.has_tenant_role(p_tenant_id UUID, p_role TEXT) RETURNS BOOLEAN` | `20260715000010_fix_rls_helpers_enum_compare.sql` | 2075 |
| is_system_admin | `public.is_system_admin() RETURNS BOOLEAN` | `20260712000011_fix_is_system_admin_service_role.sql` | 2084 |
| is_tenant_owner | `public.is_tenant_owner(p_tenant_id UUID) RETURNS BOOLEAN` | `20260715000010_fix_rls_helpers_enum_compare.sql` | 2090 |
| get_tenant_by_subdomain | `public.get_tenant_by_subdomain(p_subdomain TEXT) RETURNS public.tenants` | `20250704000000_phase2_tenant_foundation.sql` | 2100 |
| is_2fa_enabled | `public.is_2fa_enabled(p_user_id UUID) RETURNS BOOLEAN` | `20250708000013_phase_p17_1_2fa_totp.sql` | 2108 |
| generate_2fa_backup_codes | `public.generate_2fa_backup_codes(p_user_id UUID, p_count INTEGER DEFAULT 10) RETURNS JSON` | `20250708000013_phase_p17_1_2fa_totp.sql` | 2114 |
| verify_2fa_backup_code | `public.verify_2fa_backup_code(p_user_id UUID, p_code TEXT) RETURNS JSON` | `20250708000013_phase_p17_1_2fa_totp.sql` | 2137 |
| list_2fa_backup_codes | `public.list_2fa_backup_codes(p_user_id UUID) RETURNS JSON` | `20250708000013_phase_p17_1_2fa_totp.sql` | 2151 |
| delete_2fa_backup_codes | `public.delete_2fa_backup_codes(p_user_id UUID) RETURNS VOID` | `20250708000013_phase_p17_1_2fa_totp.sql` | 2161 |
| record_login_attempt | `public.record_login_attempt(p_email TEXT, p_ip_address TEXT, p_success BOOLEAN DEFAULT false) RETURNS UUID` | `20260715000004_login_audit_triggers.sql` | 2168 |
| get_login_attempts | `public.get_login_attempts(p_email TEXT, p_limit INTEGER, p_offset INTEGER) RETURNS JSONB` | `20260715000004_login_audit_triggers.sql` | 2182 |
| get_locked_emails | `public.get_locked_emails() RETURNS JSONB` | `20260715000004_login_audit_triggers.sql` | 2202 |
| unlock_login_attempts | `public.unlock_login_attempts(p_email TEXT) RETURNS VOID` | `20260715000003_admin_security_settings.sql` | 2225 |
| get_tenant_security_settings | `public.get_tenant_security_settings(p_tenant_id UUID) RETURNS JSONB` | `20260715000003_admin_security_settings.sql` | 2233 |
| update_tenant_ip_allowlist | `public.update_tenant_ip_allowlist(p_tenant_id UUID, p_allowed_ips TEXT[]) RETURNS VOID` | `20260715000003_admin_security_settings.sql` | 2249 |
| update_tenant_session_timeout | `public.update_tenant_session_timeout(p_tenant_id UUID, p_minutes INTEGER) RETURNS VOID` | `20260715000003_admin_security_settings.sql` | 2259 |
| record_admin_login | `public.record_admin_login(p_user_id UUID, p_email TEXT, p_ip_address TEXT, p_user_agent TEXT, p_status TEXT, p_failure_reason TEXT) RETURNS UUID` | `20250708000014_phase_p17_2_login_history.sql` | 2270 |
| get_admin_login_history | `public.get_admin_login_history(p_limit, p_offset, p_status, p_date_from, p_date_to) RETURNS JSON` | `20250708000014_phase_p17_2_login_history.sql` | 2305 |
| get_admin_login_alerts | `public.get_admin_login_alerts(p_hours_ago INTEGER DEFAULT 24) RETURNS JSON` | `20250708000014_phase_p17_2_login_history.sql` | 2341 |

**Traceability Matrix: PASS (20/20 RPCs traced to canonical migration source)**

---

## 7. Validation Evidence

### 7.1 Audit Gate — `npx tsx scripts/audit-rpc-contracts.ts`

Exit code: **0 — PASS**

```
Migration RPCs : 300
Code RPCs      : 183
Mock RPCs      : 89 (89 handler blocks)

All service-layer RPC calls are defined in the canonical migration chain.

All mock RPC handlers are defined in the canonical migration chain.

No duplicate mock RPC handlers.

Mock coverage report (informational — does not fail):
  Total code RPCs : 183
  Total mock RPCs : 89
  Covered         : 88
  Uncovered       : 95
  Coverage        : 48.1%

Audit PASSED.
```

- Stale-mock gate (mock ⊆ migrations): **PASS** — 0 mock RPCs missing from migrations.
- Duplicate-handler gate: **PASS** — 0 duplicate handlers.
- Coverage (informational): **48.1%** (88 covered / 183 code RPCs).

### 7.2 TypeScript — `npx tsc --noEmit`

Exit code: **0 — PASS** (no output, no type errors).

### 7.3 Test Suite — `npx vitest run`

Exit code: **0 — PASS**

```
Test Files  68 passed (68)
     Tests  389 passed (389)
  Duration  37.16s
```

All 68 test files and 389 tests passed — no regression.

---

## 8. Coverage Delta

| Metric | Before (CURRENT_TASK-013 accepted) | After (CURRENT_TASK-014) | Delta |
|---|---|---|---|
| Mock handler blocks | 69 | 89 | +20 |
| Covered code RPCs | 68 | 88 | +20 |
| Uncovered code RPCs | 115 | 95 | −20 |
| Coverage | 37.2% | 48.1% | +10.9 pp |

The delta matches the Architecture Decision target exactly (37.2% → 48.1%, 68 → 88 covered).

---

## 9. Test Results

All three validation gates passed:

| Validation | Command | Result |
|---|---|---|
| Audit gate | `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0 — PASS |
| TypeScript | `npx tsc --noEmit` | Exit 0 — PASS |
| Test suite | `npx vitest run` | 68 files, 389 tests — all PASS |

---

## 10. Regression Analysis

- The 20 newly-mocked RPCs previously fell through the `rpc` dispatch to the `PGRST116` "RPC not found" fallback. No existing test asserted on that fallback for these specific 20 names (they were uncovered by definition), so adding real handlers does not alter any prior assertion.
- The full suite (389 tests) passes identically to the CURRENT_TASK-013 accepted baseline (68 files, 389 tests), confirming zero regression.
- No existing handler was modified or removed; the audit duplicate gate confirms each of the 20 new RPCs has exactly one handler and the prior 69 handlers remain intact (89 total, 0 duplicates).

**Regression: PASS — no regression detected.**

---

## 11. Contract Impact

**None.**

- No production code, service layer, lib, UI, migration, schema, generated type, CI workflow, or `package.json` was modified by this task.
- The audit script (`scripts/audit-rpc-contracts.ts`) is unchanged and remains frozen as accepted in CURRENT_TASK-013.
- The canonical migration chain is the sole source of truth for every new mock's return shape; no derived document (e.g. `RPC_CONTRACTS.md`) was referenced or reintroduced.
- The change is confined to the derived validation layer (test mocks), exactly as scoped by Phase 4.

---

## 12. Risks

| Risk | Likelihood | Mitigation / Status |
|---|---|---|
| Mock return shape diverges from canonical function over time as migrations evolve | Low | The audit stale-mock gate (mock ⊆ migrations) catches removed/renamed RPCs; shape drift is a deferred Phase 4+ hardening task (Roadmap §8), explicitly out of scope here. |
| `is_2fa_enabled` mock always returns `false` (no `auth.mfa_factors` in mock store) | Low | Faithful to the canonical default when no verified TOTP factor exists; marked with a `ponytail:` ceiling comment. Tests needing a `true` state can extend the store in a future task. |
| Alert windowing (`get_admin_login_alerts`, `get_locked_emails`) uses fixed 15-min buckets | Low | Matches the canonical migration's own `ponytail:` simplification; ceiling and upgrade path documented in code comments. |
| Pre-existing uncommitted changes to other files exist in the working tree | Informational | Not modified by this task; outside CURRENT_TASK-014 scope. Reported for transparency. |

---

## 13. Conclusion

CURRENT_TASK-014 is complete. The 20 Domain A — Auth, Identity & Security mock handlers were implemented additively in `tests/mocks/supabase.ts`, each derived from its canonical migration function signature. All three validation gates pass: the audit gate (stale-mock PASS, duplicate PASS, coverage 48.1%), `tsc --noEmit`, and the full vitest suite (389 tests, no regression). The coverage delta matches the Architecture Decision target exactly (37.2% → 48.1%, 68 → 88 covered). Scope, governance, and additive-only constraints were honored. No CURRENT_TASK-015 or further artifacts were generated.

---

```
IMPLEMENTATION SUMMARY

Implementation
PASS

Validation
PASS

Coverage

Before:
37.2%

After:
48.1%

Files Changed

- tests/mocks/supabase.ts  (+20 additive handler blocks, lines 2060-2408)
- CURRENT_TASK-014_IMPLEMENTATION_REPORT.md  (this deliverable)

Traceability Matrix

PASS

Regression

PASS

Contract Impact

None

Scope Compliance

PASS

Deliverables

- CURRENT_TASK-014_IMPLEMENTATION_REPORT.md

Awaiting Program Manager Acceptance Review
```
