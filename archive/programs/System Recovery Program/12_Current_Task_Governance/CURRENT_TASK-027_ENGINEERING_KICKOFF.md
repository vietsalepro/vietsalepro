# CURRENT_TASK-027 — Engineering Kickoff

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Domain:** C — Compliance & GDPR  
**Wave:** 4c  
**CURRENT_TASK:** 027  
**Document Type:** Engineering Readiness  
**Date:** 2026-07-15  
**Status:** Engineering Ready  

---

## 1. Engineering Kickoff

This document confirms engineering readiness for **CURRENT_TASK-027**. It records architecture approval, scope, dependencies, canonical source, target files, engineering strategy, constraints, and validation gates. Implementation is **not** authorized by this document and requires separate approval after this kickoff is accepted.

---

## 2. Objective

Add mock coverage for the **7** authorized Domain C — Compliance & GDPR RPCs in `tests/mocks/supabase.ts`, deriving each handler's return shape and parameter contract from the canonical migration chain. This task continues Milestone M6 — Cross-Cutting Services (Wave 4c) and targets raising mock coverage from **~92.9% (170/183)** to approximately **~96.7% (177/183)**.

---

## 3. Current Program Status

| Item | Value |
|---|---|
| Active phase | Phase 4 — Derived Validation Layer Realignment |
| Current milestone | M6 — Cross-Cutting Services: **IN PROGRESS** |
| Current wave | Wave 4b complete; Wave 4c ready |
| Current coverage | **~92.9% (170 / 183)** |
| Uncovered RPCs | **13** |
| Most recent accepted task | CURRENT_TASK-026 — Domain E: Webhooks & API Keys |
| Program health | HEALTHY — on track, no blockers |

Phase 4 exit criteria EC-3 (canonical audit gate alignment) and EC-4 (CI divergence gate) remain open as known residuals. EC-1 and EC-2 continue to progress with each coverage wave.

---

## 4. Authorized Scope

### In Scope

- Add exactly **7** mock handlers to `tests/mocks/supabase.ts` for Domain C — Compliance & GDPR.
- Derive each mock's return shape and parameter contract from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern.
- Extend the in-memory `store` with `gdpr_requests`, `terms_acceptance`, and `gdpr_deletion_logs` arrays only.
- Additive changes only; no refactor, redesign, or abstraction.

### Out of Scope

- Production code changes (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migration, schema, or generated type modifications.
- Changes to `scripts/audit-rpc-contracts.ts`, CI workflows, or `package.json`.
- New governance artifacts, post-implementation artifacts, acceptance records, or CURRENT_TASK-028.
- Re-ordering, re-classifying, or expanding the Coverage Roadmap.

---

## 5. Authorized RPCs

The following **7** RPCs are authorized for mock coverage. No additional RPCs may be added.

| # | RPC | Canonical Migration File | Canonical Line | RETURNS | Calling Code Location |
|---|---|---|---|---:|---|
| 1 | `create_gdpr_request` | `supabase/migrations/20260716000002_gdpr_export_functions.sql` | 95 | `UUID` | `services/admin/complianceAdminService.ts` line 93 |
| 2 | `get_gdpr_requests` | `supabase/migrations/20260716000002_gdpr_export_functions.sql` | 141 | `JSON` | `services/admin/complianceAdminService.ts` line 77 |
| 3 | `gdpr_export_user_data` | `supabase/migrations/20260716000002_gdpr_export_functions.sql` | 199 | `JSON` | `services/admin/complianceAdminService.ts` line 104 |
| 4 | `gdpr_delete_user_data` | `supabase/migrations/20260716000002_gdpr_export_functions.sql` | 311 | `JSON` | `services/admin/complianceAdminService.ts` line 113 |
| 5 | `export_tenant_data` | `supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql` | 175 | `JSON` | `services/complianceService.ts` line 68 |
| 6 | `get_terms_acceptances` | `supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql` | 119 | `JSON` | `services/complianceService.ts` line 53 |
| 7 | `record_terms_acceptance` | `supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql` | 58 | `UUID` | `services/complianceService.ts` line 39 |

**Authorized RPC Count: 7 / 7**

### Canonical Signatures

```sql
-- create_gdpr_request
CREATE OR REPLACE FUNCTION public.create_gdpr_request(
  p_user_id UUID,
  p_type TEXT,
  p_reason TEXT DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT false
) RETURNS UUID

-- get_gdpr_requests
CREATE OR REPLACE FUNCTION public.get_gdpr_requests(
  p_status TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS JSON

-- gdpr_export_user_data
CREATE OR REPLACE FUNCTION public.gdpr_export_user_data(
  p_user_id UUID
) RETURNS JSON

-- gdpr_delete_user_data
CREATE OR REPLACE FUNCTION public.gdpr_delete_user_data(
  p_user_id UUID,
  p_dry_run BOOLEAN DEFAULT true
) RETURNS JSON

-- export_tenant_data
CREATE OR REPLACE FUNCTION public.export_tenant_data(
  p_tenant_id UUID
) RETURNS JSON

-- get_terms_acceptances
CREATE OR REPLACE FUNCTION public.get_terms_acceptances(
  p_tenant_id UUID DEFAULT NULL,
  p_terms_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS JSON

-- record_terms_acceptance
CREATE OR REPLACE FUNCTION public.record_terms_acceptance(
  p_user_id UUID,
  p_tenant_id UUID DEFAULT NULL,
  p_terms_version TEXT DEFAULT '1.0',
  p_terms_type TEXT DEFAULT 'tos',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
```

### Service Call Sites

- `services/admin/complianceAdminService.ts`
  - `getGdprRequests(options)` → `get_gdpr_requests` (line 77), expects `{ data: GdprRequest[], count: number }` mapped by `mapGdprRequestFromDB`.
  - `createGdprRequest(input)` → `create_gdpr_request` (line 93), returns the generated request UUID.
  - `getGdprExportData(userId)` → `gdpr_export_user_data` (line 104), returns `GdprExportData`.
  - `deleteUserData(userId, dryRun)` → `gdpr_delete_user_data` (line 113), returns `GdprDeleteResult`.

- `services/complianceService.ts`
  - `recordTermsAcceptance(input)` → `record_terms_acceptance` (line 39), returns the generated acceptance UUID.
  - `getTermsAcceptances(input)` → `get_terms_acceptances` (line 53), expects `{ data: TermsAcceptance[], count: number }` mapped by `mapTermsAcceptanceFromDB`.
  - `exportTenantData(tenantId)` → `export_tenant_data` (line 68), returns `TenantExportData`.

`services/admin/complianceAdminService.ts` and `services/complianceService.ts` are read-only call-site references for this task and must not be modified.

---

## 6. Dependency Verification

| Prerequisite | Status | Evidence |
|---|---|---|
| CURRENT_TASK-026 closed | Yes | `CURRENT_TASK-026_PROGRAM_STATUS_REVIEW.md` records **CLOSED** and **PROGRAM STATUS: PASS** |
| Architecture Decision approved | Yes | `CURRENT_TASK-027_ARCHITECTURE_DECISION.md` Status: **APPROVED (Architecture)** |
| Program Authorization approved | Yes | `CURRENT_TASK-027_PROGRAM_AUTHORIZATION.md` Status: **APPROVED** |
| Canonical migration chain available | Yes | `supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql` and `supabase/migrations/20260716000002_gdpr_export_functions.sql` present and verified |
| Target file exists | Yes | `tests/mocks/supabase.ts` exists and contains the existing `if (name === "...")` dispatch chain |
| No technical blocker | Yes | Domain C has no downstream dependencies on remaining uncovered domains; all 7 RPCs are confined to `services/admin/complianceAdminService.ts` and `services/complianceService.ts` |
| Domain C can deploy independently | Yes | Wave 4c is explicitly scoped as independent cross-cutting service coverage in `PHASE4_COVERAGE_ROADMAP.md` |

---

## 7. Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | Canonical | `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1; `CURRENT_TASK-012`; `CURRENT_TASK-013` |

The canonical source for RPC names, parameter lists, and return shapes is the `CREATE [OR REPLACE] FUNCTION public.<name>` declaration for each authorized RPC in the forward migration chain. Engineering must not use derived documents, service call sites, or previous mock patterns as the contract authority.

### Handler Return-Shape Requirements

Per the canonical migration and the approved Architecture Decision:

- `record_terms_acceptance` returns the generated UUID.
- `get_terms_acceptances` returns `{ data: [...], count: <total> }` with snake_case keys: `id`, `user_id`, `tenant_id`, `terms_version`, `terms_type`, `accepted_at`, `ip_address`, `user_agent`, `metadata`, `created_at`.
- `export_tenant_data` returns `{ tenant, subscription, members, tables, exported_at }` with snake_case keys.
- `create_gdpr_request` returns the generated UUID.
- `get_gdpr_requests` returns `{ data: [...], count: <total> }` with snake_case keys: `id`, `user_id`, `type`, `reason`, `status`, `dry_run`, `result_url`, `created_at`, `completed_at`, `user_email`.
- `gdpr_export_user_data` returns `{ profile, memberships, payments, audit_log, admin_login_history, terms_acceptance, exported_at }` with snake_case keys.
- `gdpr_delete_user_data` returns `{ dry_run, request_id, user_id, planned_actions }` on dry run or `{ dry_run, request_id, user_id, executed_actions, deleted_at }` on destructive run.

---

## 8. Engineering Approach

### Store Additions

Extend the `store` record in `tests/mocks/supabase.ts` with exactly:

```text
gdpr_requests: []
terms_acceptance: []
gdpr_deletion_logs: []
```

No seed data is required; all three arrays start empty after `resetMockData`.

Rows shall be stored using snake_case column names matching the canonical table definitions:

- `gdpr_requests`: `id`, `user_id`, `type`, `reason`, `status`, `dry_run`, `result_data`, `result_url`, `requested_by`, `created_at`, `completed_at`
- `terms_acceptance`: `id`, `user_id`, `tenant_id`, `terms_version`, `terms_type`, `accepted_at`, `ip_address`, `user_agent`, `metadata`, `created_at`, `updated_at`
- `gdpr_deletion_logs`: `id`, `request_id`, `user_id`, `action`, `details`, `created_at`

### Handler Additions

Add one minimal `if (name === "...")` block per authorized RPC, placed adjacent to existing sibling handlers in the dispatch chain. Each handler must:

1. Mirror the canonical function signature (parameter names and optionality).
2. Use `crypto.randomUUID()` for generated UUIDs.
3. Use `new Date().toISOString()` for timestamps.
4. Use `currentUserId` for `requested_by` on insert where canonical uses `auth.uid()`.
5. Return `42501` / Vietnamese permission message when canonical requires `public.is_system_admin()` and `isSystemAdmin` is false.
6. Return `PGRST116` / `Not found` when a target user or tenant cannot be found.
7. Validate enum values against canonical `CHECK` constraints.
8. Return snake_case JSON objects matching canonical `json_build_object` / `row_to_json` output for export/list functions; return raw UUID for insert functions.

### Permission Model

| RPC | Permission |
|---|---|
| `create_gdpr_request` | System admin only (`isSystemAdmin`) |
| `get_gdpr_requests` | System admin only (`isSystemAdmin`) |
| `gdpr_export_user_data` | System admin only (`isSystemAdmin`) |
| `gdpr_delete_user_data` | System admin only (`isSystemAdmin`) |
| `export_tenant_data` | System admin only (`isSystemAdmin`) |
| `get_terms_acceptances` | System admin only (`isSystemAdmin`) |
| `record_terms_acceptance` | Self-service for matching user or system admin (`params.p_user_id === currentUserId \|\| isSystemAdmin`) |

### Error Handling

| Condition | Error Code | Message |
|---|---|---|
| Missing system-admin permission | `42501` | Canonical Vietnamese message per RPC |
| Missing target user | `PGRST116` | `Not found` |
| Missing target tenant | `PGRST116` | `Not found` |
| Invalid `p_terms_type` | canonical-aligned | `terms_type không hợp lệ` |
| Invalid `p_type` for GDPR request | canonical-aligned | `type phải là export hoặc deletion` |
| Null `p_user_id` where required | canonical-aligned | `Thiếu user_id` |
| Null `p_tenant_id` where required | canonical-aligned | `Thiếu tenant_id` |

---

## 9. Coverage Objective

| Metric | Before CURRENT_TASK-027 | After CURRENT_TASK-027 |
|---|---|---|
| Covered RPCs | 170 / 183 | **177 / 183** |
| Uncovered RPCs | 13 | **6** |
| Coverage | ~92.9% | **~96.7%** |
| Delta | — | **+7 RPCs, +~3.8 percentage points** |

---

## 10. Validation Gates

The completed engineering work shall satisfy all of the following validation gates. Baseline verification was executed on 2026-07-15:

### Canonical Audit Gate

```text
npx tsx scripts/audit-rpc-contracts.ts
```

Baseline (pre-implementation):

```text
Exit 0

Contract RPCs : 125
Code RPCs     : 125

RPC contracts and service code are in sync.
```

Expected after implementation:

```text
Exit 0

125 / 125 RPC contracts in sync

0 duplicate handler

0 stale mock
```

### Type Gate

```text
npx tsc --noEmit
```

Baseline:

```text
Exit 0
```

Expected after implementation:

```text
PASS
```

### Test Gate

```text
npx vitest run
```

Baseline:

```text
68 files

389 tests

PASS
```

Expected after implementation:

```text
68 files

389 tests

PASS
```

No regression is permitted. Test file count and passing test count must not decrease.

---

## 11. Constraints Confirmation

Engineering confirms the following constraints from the Program Authorization and Architecture Decision:

| Constraint | Confirmed |
|---|---|
| Additive only | Yes |
| No refactor | Yes |
| No redesign | Yes |
| No abstraction | Yes |
| Preserve `if (name === "...")` dispatch pattern | Yes |
| Preserve existing handler conventions | Yes |
| CURRENT_TASK boundary: 7 RPCs, 1 wave, 1 domain | Yes |
| No duplicate handler | Yes |
| No stale mock | Yes |
| No production code changes | Yes |
| No migration/schema/generated-type changes | Yes |
| No CI/workflow changes | Yes |

---

## 12. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Store field naming mismatch with `mapGdprRequestFromDB` / `mapTermsAcceptanceFromDB` | Low | Medium | Derive store row fields directly from the canonical table columns; keep snake_case in store and return snake_case JSON; service-layer mappers convert to camelCase. |
| `export_tenant_data` dynamic table scan diverges from canonical `information_schema` behavior | Low | Low | Match the canonical exclusion list and scan `store` arrays that contain a `tenant_id` column, excluding tenant/admin/compliance tables as listed in the migration. |
| `gdpr_delete_user_data` destructive mutation leaks across tests | Low | Medium | Tests must call `resetMockData()` in setup; the handler performs mutation only when `p_dry_run = false`. |
| `record_terms_acceptance` self-service permission check is too permissive | Low | Low | Enforce `params.p_user_id === currentUserId \|\| isSystemAdmin`, matching canonical `auth.uid() <> p_user_id AND NOT public.is_system_admin()` guard. |
| Handler placement causing dispatch collision | Very Low | Low | Insert new handlers in an unused location in the dispatch chain; verify with audit and test gates. |

No unresolved blockers. Engineering readiness is confirmed.

---

## 13. Engineering Readiness Assessment

| Readiness Area | Status | Evidence |
|---|---|---|
| **Technical Readiness** | Ready | Target file exists; existing dispatch pattern is in place; helper `uuid()` and timestamp utilities available; no new dependency required. |
| **Dependency Readiness** | Ready | CURRENT_TASK-026 closed; canonical migration files verified; service call sites identified; no missing upstream mocks. |
| **Architecture Readiness** | Ready | `CURRENT_TASK-027_ARCHITECTURE_DECISION.md` approved; store additions, handler requirements, permission model, return shapes, and error handling are specified. |
| **Risk** | Low | Residual risks are bounded to handler return-shape fidelity and test isolation; mitigations identified above. |
| **Scope Lock** | Locked | 7 RPCs, 1 wave (4c), 1 domain (C), 1 target file (`tests/mocks/supabase.ts`). No expansion authorized. |
| **Canonical Completeness** | Complete | All 7 RPC signatures, parameter defaults, `CHECK` constraints, and return shapes are present in the canonical migration chain and reproduced in the Architecture Decision. |
| **Validation Readiness** | Ready | Audit, type, and test gates defined; baseline execution verified (audit exit 0, type exit 0, 68 files / 389 tests passing). |

### Blockers

None.

---

## 14. Engineering Lead Readiness Statement

Engineering confirms that:

- All required program documents have been read and understood.
- The 7 authorized RPCs, their canonical signatures, and their service-layer call sites are identified.
- The target file `tests/mocks/supabase.ts` exists and uses the required dispatch pattern.
- Dependencies are satisfied and no technical blockers remain.
- The implementation approach is additive, bounded to the 7 authorized RPCs, and preserves existing architecture.
- Validation gates and acceptance criteria are understood and achievable.

**Engineering is ready to proceed to CURRENT_TASK-027 Engineering Implementation upon approval of this kickoff.**

---

## 15. Deliverable

This document authorizes preparation only. The sole deliverable of this step is:

```text
CURRENT_TASK-027_ENGINEERING_KICKOFF.md
```

---

## 16. Conclusion

```text
READY
```

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-026_PROGRAM_STATUS_REVIEW.md`, `CURRENT_TASK-027_PROGRAM_AUTHORIZATION.md`, `CURRENT_TASK-027_ARCHITECTURE_DECISION.md`.*
