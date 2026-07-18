# CURRENT_TASK-015 — Implementation Report

**Program:** VietSalePro v7 — System Recovery Program
**Phase:** Phase 4 — Derived Validation Layer Realignment
**Document Type:** Engineering Implementation Report (self-report)
**Date:** 2026-07-15
**Authorizing CURRENT_TASK:** CURRENT_TASK-015 — Tenant Administration & Licensing Mock Coverage (Wave 2 / TASK-B)
**Architecture Decision:** `CURRENT_TASK-015_ARCHITECTURE_DECISION.md`
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `CURRENT_TASK-015_ARCHITECTURE_DECISION.md`, `CURRENT_TASK-014_ACCEPTANCE_RECORD.md`, `PHASE4_COVERAGE_ROADMAP.md`, `supabase/migrations/*.sql` (canonical source)

---

## 1. Objective

Implement the 6 uncovered RPCs of **Domain B — Tenant Administration & Licensing** as additive `if (name === '...')` handler blocks in `tests/mocks/supabase.ts`, with each handler's return shape derived directly from its canonical migration function's `RETURNS` clause and parameter list. Raise mock coverage from **48.1% (88/183)** to **51.4% (94/183)** — milestone **M2 — Tenant Admin** — with zero regression and zero contract impact.

---

## 2. Scope

| Dimension | Authorized Scope | Implemented Scope |
|---|---|---|
| Domain | Domain B — Tenant Administration & Licensing only | Domain B only — confirmed |
| RPC count | Exactly 6 unique RPCs | 6 unique RPCs — confirmed |
| Files permitted to change | `tests/mocks/supabase.ts` (+ optional `tests/**`) | `tests/mocks/supabase.ts` only — confirmed |
| Change nature | Additive only (no existing handler modified/removed) | Additive only — confirmed (see §5) |
| Out of scope | Production code, migrations, schema, types, audit script, CI, `package.json`, new files | None touched — confirmed (see §5) |

The 6 RPCs, organized into the 3 authorized sub-groups:

| Sub-group | RPCs |
|---|---|
| Licensing | `generate_tenant_license`, `validate_tenant_license` |
| Member Invitations | `accept_invitation`, `lookup_invitation` |
| Program Analytics | `get_churn_cohort_metrics`, `get_revenue_metrics` |

---

## 3. Files Changed

| File | Change | Lines |
|---|---|---|
| `tests/mocks/supabase.ts` | Additive: 1 new store table key (`invitations: []`) + 6 new `if (name === '...')` handler blocks inserted before the `callRpc` fallback return. No existing handler modified, removed, or reordered. | +252 / -7 (net +245; the -7 is the replaced fallback block re-emitted verbatim after the new handlers) |

No other file was modified by this task.

---

## 4. Architecture Compliance

Each requirement from `CURRENT_TASK-015_ARCHITECTURE_DECISION.md` §8 Constraints:

| # | Requirement | PASS / FAIL | Evidence |
|---|---|---|---|
| 1 | No feature development / architecture redesign / scope expansion | **PASS** | Only mock handler blocks added to `tests/mocks/supabase.ts`; no production logic touched. |
| 2 | No modification of production code, migrations, schema, generated types, CI, `package.json` | **PASS** | Only `tests/mocks/supabase.ts` edited. No diff in `services/`, `lib/`, `utils/`, `supabase/`, `scripts/`, `.github/`, `package.json`. |
| 3 | No new files / scripts / governance artifacts (report excepted) | **PASS** | No new scripts or mock files. This report is the only new document. |
| 4 | Implementation inside an approved CURRENT_TASK | **PASS** | CURRENT_TASK-015 authorized by `CURRENT_TASK-015_ARCHITECTURE_DECISION.md`. |
| 5 | Mock handlers follow the existing `if (name === '...')` dispatch pattern | **PASS** | All 6 handlers use `if (name === '<rpc>')`. No Map dispatch, no switch, no new abstraction. |
| 6 | Mock return shapes match canonical migration function signatures (RETURNS + params) | **PASS** | Each shape derived from the canonical `RETURNS` clause (see §6 Traceability). Spot-checked against `supabase/migrations/*.sql`. |
| 7 | Additive only — no modification/removal of the existing 89 handlers | **PASS** | 6 new handler blocks are insertions before the fallback. The 89 existing handlers (88 covering code RPCs + 1 accepted orphan `update_tenant_status`) are unchanged. Audit confirms 95 total handlers, 0 duplicates. |
| 8 | Audit script frozen (not modified) | **PASS** | `scripts/audit-rpc-contracts.ts` not modified by this task. |
| 9 | No mock for an RPC not in the canonical migration chain | **PASS** | Audit stale-mock gate: "All mock RPC handlers are defined in the canonical migration chain." 0 stale mocks. |
| 10 | No duplicate handler for an already-mocked RPC | **PASS** | Audit duplicate-handler gate: "No duplicate mock RPC handlers." 0 duplicates. |

**Architecture Compliance: PASS (10/10 constraints honored)**

---

## 5. Implementation Summary

### 5.1 Store extension (additive)

A single new store table key `invitations: []` was added to the `store` object (after `licenses: []`). This is additive state, mirroring the pattern established in CURRENT_TASK-014 (which added `login_attempts`, `admin_login_history`, `admin_2fa_backup_codes`). It is required because the canonical `lookup_invitation` and `accept_invitation` functions operate on the `public.invitations` table. `resetMockData` resets it automatically (it iterates `Object.keys(store)`). No existing store key was modified or reordered.

### 5.2 Handler blocks (additive, before fallback)

Six `if (name === '...')` blocks inserted immediately before the `callRpc` fallback `return { data: null, error: { code: 'PGRST116', message: 'RPC not found' } }`. The fallback is re-emitted verbatim after the new handlers. No existing handler was edited, reordered, or removed.

| # | RPC | Handler line | Canonical behavior mirrored |
|---|---|---|---|
| 1 | `generate_tenant_license` | 2409 | `is_system_admin()` guard → tenant-exists guard → inserts a `licenses` row (shaped per `public.licenses` columns) → returns the row. `ponytail:` omits the `audit_log` INSERT side effect (Risk #3 ceiling note). |
| 2 | `validate_tenant_license` | 2439 | Lookup by `upper(p_license_key)`; `not_found` / `revoked` (revoked_at OR not is_active) / `expired` (expires_at < now) / valid branches — exact match to the 4 migration branches. Returns the single-row TABLE as one object. |
| 3 | `lookup_invitation` | 2455 | Read-only join `invitations` × `tenants` by token; `active = (status='pending' AND expires_at > now)`, `expired = (expires_at <= now)`. Returns an array (TABLE) — the service reads `rows[0]`. |
| 4 | `accept_invitation` | 2478 | Full canonical guard chain: `auth.uid()` (currentUserId) → invitation exists → status='pending' → not expired → email match (lower-cased) → no duplicate membership. Mutates: inserts `tenant_memberships` row, sets invitation `status='accepted'`. `ponytail:` omits the `app_audit_log` INSERT side effect (Risk #2 ceiling note). |
| 5 | `get_revenue_metrics` | 2525 | `is_system_admin()` guard. Computes MRR (active/read_only tenants × plan.monthly_price), ARR = MRR×12, total_revenue + revenue_by_plan from confirmed payments, period_start/end defaults. `ponytail:` UTC-date defaulting instead of Asia/Ho_Chi_Minh. |
| 6 | `get_churn_cohort_metrics` | 2562 | `is_system_admin()` guard. Computes churn snapshot (active_start/active_end/churned_count/churn_rate), LTV (total_revenue / paying_tenants, by_plan), sales funnel (trial/active_free/paying/churned), and cohort conversion-to-paid grouped by creation month. `ponytail:` single-pass-per-cohort O(cohorts×tenants) instead of the migration's O(n²) nested scan. |

### 5.3 Authorization mirroring

Guards present in the canonical functions are mirrored via the existing mock state established in CURRENT_TASK-014:
- `is_system_admin()` → `isSystemAdmin` flag (`generate_tenant_license`, `get_revenue_metrics`, `get_churn_cohort_metrics`).
- `auth.uid()` + email match → `currentUserId` + `store.users` email lookup (`accept_invitation`).

### 5.4 ponytail ceiling notes

Three intentional simplifications are marked inline with `ponytail:` comments naming the ceiling and upgrade path:
1. `generate_tenant_license` — omits `audit_log` INSERT (audit_log table not under test; upgrade: push to `store.audit_log` when a license-audit test is added).
2. `accept_invitation` — omits `app_audit_log` INSERT (upgrade: push to `store.app_audit_log` when an invitation-audit test is added).
3. `get_churn_cohort_metrics` — cohort retention computed in a single pass per cohort O(cohorts×tenants) instead of the migration's O(n²) nested scan (sufficient for unit-test scale; upgrade: materialize first_payment if tenant volume grows).
4. `get_revenue_metrics` — UTC-date defaulting instead of Asia/Ho_Chi_Minh timezone (sufficient for unit tests).

---

## 6. Traceability Matrix

6/6 RPCs traced to their canonical `CREATE [OR REPLACE] FUNCTION public.<name>` declaration in the forward migration chain. `RETURNS` clauses and parameter lists verified against `supabase/migrations/*.sql`.

| Mock RPC | Service (call-site) | Canonical Function | Migration File | Migration Line | RETURNS | Mock Shape | Verified |
|---|---|---|---|---|---|---|---|
| `generate_tenant_license` | `services/admin/licenseService.ts:89` | `public.generate_tenant_license` | `20260720000001_sp_7_3_licenses.sql` | 37 | `public.licenses` (single row) | `{ data: license\|null, error }` — license row shaped per `public.licenses` columns (id, tenant_id, license_key, plan, max_users, max_products, max_orders_per_month, expires_at, is_active, revoked_at, created_at, updated_at) | PASS |
| `validate_tenant_license` | `services/admin/licenseService.ts:107` | `public.validate_tenant_license` | `20260720000001_sp_7_3_licenses.sql` | 106 | `TABLE(valid BOOLEAN, license_id UUID, tenant_id UUID, plan TEXT, reason TEXT)` | `{ data: { valid, license_id, tenant_id, plan, reason }, error }` — single-row TABLE modeled as one object; reason ∈ {not_found, revoked, expired, null} | PASS |
| `lookup_invitation` | `services/admin/memberAdminService.ts:229` | `public.lookup_invitation` | `20260714000001_accept_invitation_rpc.sql` | 17 | `TABLE(tenant_id UUID, tenant_name TEXT, tenant_subdomain TEXT, tenant_custom_domain TEXT, role TEXT, email TEXT, active BOOLEAN, expired BOOLEAN)` | `{ data: [row], error }` — array (TABLE); row has all 8 columns; join invitations × tenants by token | PASS |
| `accept_invitation` | `services/admin/memberAdminService.ts:247` | `public.accept_invitation` | `20260714000001_accept_invitation_rpc.sql` | 53 | `public.tenant_memberships` (single row) | `{ data: membership\|null, error }` — membership row (id, tenant_id, user_id, role, status, is_active, invited_by, invited_at, accepted_at, email, created_at, updated_at); full guard chain mirrored | PASS |
| `get_revenue_metrics` | `services/admin/analyticsAdminService.ts:25` + `services/billingAutomationService.ts:83` (cross-file shared) | `public.get_revenue_metrics` | `20250708000010_phase_p16_1_revenue_metrics.sql` | 4 | `JSON` | `{ data: { mrr, arr, total_revenue, revenue_by_plan, period_start, period_end }, error }` — matches `json_build_object` keys; `is_system_admin()` guard | PASS |
| `get_churn_cohort_metrics` | `services/admin/analyticsAdminService.ts:52` + `services/billingAutomationService.ts:150` (cross-file shared) | `public.get_churn_cohort_metrics` | `20250708000011_phase_p16_2_churn_cohort.sql` | 5 | `JSON` | `{ data: { churn, cohort, ltv, funnel }, error }` — matches `json_build_object` top-level keys; `is_system_admin()` guard | PASS |

**Traceability Matrix: PASS (6/6)**

---

## 7. Coverage Delta

Independently reproduced by `npx tsx scripts/audit-rpc-contracts.ts` (exit 0).

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| Covered RPC | 88 | 94 | +6 |
| Uncovered RPC | 95 | 89 | -6 |
| Coverage | 48.1% | 51.4% | +3.3 pp |
| Mock handlers | 89 | 95 | +6 |
| Code RPCs | 183 | 183 | 0 |
| Migration RPCs | 300 | 300 | 0 |

Exactly +6 newly covered RPCs, 0 new uncovered RPCs. Milestone **M2 — Tenant Admin (51.4%)** reached.

**Coverage Delta: PASS**

---

## 8. Validation Evidence

Three gates, all independently re-runnable, all green.

### 8.1 Audit gate

Command: `npx tsx scripts/audit-rpc-contracts.ts`
Result: **Exit 0**

```
Migration RPCs : 300
Code RPCs      : 183
Mock RPCs      : 95 (95 handler blocks)

All service-layer RPC calls are defined in the canonical migration chain.
All mock RPC handlers are defined in the canonical migration chain.
No duplicate mock RPC handlers.

Mock coverage report (informational — does not fail):
  Total code RPCs : 183
  Total mock RPCs : 95
  Covered         : 94
  Uncovered       : 89
  Coverage        : 51.4%

Audit PASSED.
```

- Stale-mock gate: PASS (0 stale mocks — all 6 new RPCs are defined in the canonical migration chain).
- Duplicate-handler gate: PASS (0 duplicates — exactly one handler per name).
- Coverage: 94 covered, 89 uncovered, 51.4% — exact match to the authorized delta.

### 8.2 Type gate

Command: `npx tsc --noEmit`
Result: **Exit 0** (no output)

### 8.3 Test gate

Command: `npx vitest run`
Result: **Exit 0**

```
Test Files  68 passed (68)
     Tests  389 passed (389)
```

No regression versus the CURRENT_TASK-014 accepted baseline (68 files, 389 tests). The pre-existing recharts `width(-1)/height(-1)` warnings in `AdminDashboardInner.test.tsx` are unchanged from the prior baseline (informational, not failures).

---

## 9. Test Results

| Gate | Command | Result | Baseline | Regression |
|---|---|---|---|---|
| Audit | `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0; 94 covered / 51.4% | 88 covered / 48.1% | None (improvement) |
| Type | `npx tsc --noEmit` | Exit 0 | Exit 0 | None |
| Test | `npx vitest run` | 68 files, 389 tests PASS | 68 files, 389 tests PASS | None |

**Test Results: PASS (3/3 gates green, no regression)**

---

## 10. Regression Analysis

- **Test count:** 389 tests across 68 files — identical to the CURRENT_TASK-014 accepted baseline. No test removed, no test failed, no new flaky test.
- **The 6 newly-mocked RPCs are not yet exercised by dedicated tests** (coverage-only acceptance; dedicated tenant-admin path tests are encouraged but not mandatory per the Architecture Decision §3.1). The existing `tests/services/licenseService.test.ts` (7 tests) and `tests/smoke/admin-dashboard-p16-2-churn-cohort.test.ts` (2 tests) continue to pass — they exercise the license/analytics service surfaces that now resolve against the new mocks where applicable.
- **No production code path changed.** The mock layer is test-only; production behavior is unaffected.
- **Pre-existing working-tree state:** Uncommitted changes from prior accepted tasks (CURRENT_TASK-010…014) remain in the working tree (last commit `afdef607`). These are not attributable to CURRENT_TASK-015 and do not affect the validation gates.

**Regression: PASS**

---

## 11. Contract Impact

**None.**

- No production code modified (services, lib, utils, UI).
- No migration, schema, or generated type modified.
- No audit script modified (frozen).
- No CI workflow or `package.json` modified.
- No RPC added to or removed from the canonical migration chain.
- The 6 new mocks are test-only handlers; they do not alter the production contract surface. They make the test validation layer reflect the real canonical contract for these 6 RPCs (the Phase 4 objective).

---

## 12. Risks

| # | Risk (from Architecture Decision §12) | Status | Mitigation applied |
|---|---|---|---|
| 1 | Mock behavioral fidelity | Mitigated | Return shapes derived from canonical `RETURNS` clauses (§6); audit stale-mock gate enforces mock ⊆ migrations. Review-enforced shape fidelity (Constraint #6). |
| 2 | `accept_invitation` stateful mutation | Mitigated | Full canonical guard chain mirrored (auth, existence, status, expiry, email match, duplicate); invitation status transitioned to `accepted`; `ponytail:` note on omitted audit-log side effect. |
| 3 | `generate_tenant_license` audit-log side effect | Mitigated | `ponytail:` ceiling note on omitted `audit_log` INSERT; upgrade path documented. |
| 4 | Cross-file shared analytics RPCs | Mitigated | One handler per name serves both call-sites (`analyticsAdminService.ts` + `billingAutomationService.ts`); both pass the same `{ p_start_date?, p_end_date?, p_cohort_months? }` shape. |
| 5 | `tests/mocks/supabase.ts` growth | Accepted | +245 net lines; refactor explicitly deferred (Roadmap §8). |
| 6 | Scope creep | Mitigated | Only Domain B RPCs added; audit stale-mock + duplicate gates guard against accidental cross-domain additions. |
| 7 | Working-tree governance gap | Informational | Out-of-scope diffs attributable to prior accepted tasks, not CURRENT_TASK-015. |

No Critical risks. No new risks introduced by this implementation.

---

## 13. Conclusion

CURRENT_TASK-015 is implemented in full conformance with `CURRENT_TASK-015_ARCHITECTURE_DECISION.md`. All 6 Domain B RPCs are mocked additively in `tests/mocks/supabase.ts` with return shapes derived from the canonical migration chain. The coverage milestone **M2 — Tenant Admin (51.4%)** is reached. All three validation gates (audit, tsc, vitest) are green with zero regression and zero contract impact. The task is ready for Program Manager Acceptance Review.

---

## 14. Final Summary Block

```text
IMPLEMENTATION SUMMARY

Implementation
PASS

Validation
PASS

Coverage

Before:
48.1%

After:
51.4%

Files Changed

tests/mocks/supabase.ts (additive: 1 store table key + 6 handler blocks)

Traceability Matrix

PASS

Coverage Delta

PASS

Regression

PASS

Contract Impact

None

Scope Compliance

PASS

Deliverables

- tests/mocks/supabase.ts (6 Domain B handler blocks, additive)
- CURRENT_TASK-015_IMPLEMENTATION_REPORT.md (this document)

Awaiting Program Manager Acceptance Review
```
