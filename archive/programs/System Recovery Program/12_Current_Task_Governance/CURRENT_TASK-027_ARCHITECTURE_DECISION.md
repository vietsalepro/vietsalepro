# CURRENT_TASK-027_ARCHITECTURE_DECISION.md

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Domain:** C — Compliance & GDPR  
**Wave:** 4c  
**CURRENT_TASK:** 027  
**Document Type:** Architecture Decision  
**Status:** APPROVED (Architecture)  
**Date:** 2026-07-15  
**Authoring Role:** Architecture Authority  

---

## 1. Purpose

Define the architecture boundary and implementation strategy for **CURRENT_TASK-027** before any engineering work begins.

This document authorizes only the architectural approach for adding mock coverage for the **7 authorized Wave 4c RPCs** in Domain C. It does **not** authorize implementation.

---

## 2. Program Context

| Attribute     | Value                                          |
| ------------- | ---------------------------------------------- |
| Phase         | Phase 4 — Derived Validation Layer Realignment |
| Milestone     | M6 — Cross-Cutting Services                    |
| Domain        | C — Compliance & GDPR                          |
| Wave          | 4c                                             |
| CURRENT_TASK  | CURRENT_TASK-027                               |
| Previous Task | CURRENT_TASK-026 (Closed)                      |
| Current Status| AUTHORIZED                                     |

---

## 3. Authorized RPC Scope

The implementation scope is limited to the following **7 RPCs**:

| # | RPC Name | Canonical Source Location | Calling Code Location |
| --- | --- | --- | --- |
| 1 | `create_gdpr_request` | `supabase/migrations/20260716000002_gdpr_export_functions.sql` line 95 | `services/admin/complianceAdminService.ts` line 93 |
| 2 | `get_gdpr_requests` | `supabase/migrations/20260716000002_gdpr_export_functions.sql` line 141 | `services/admin/complianceAdminService.ts` line 77 |
| 3 | `gdpr_export_user_data` | `supabase/migrations/20260716000002_gdpr_export_functions.sql` line 199 | `services/admin/complianceAdminService.ts` line 104 |
| 4 | `gdpr_delete_user_data` | `supabase/migrations/20260716000002_gdpr_export_functions.sql` line 311 | `services/admin/complianceAdminService.ts` line 113 |
| 5 | `export_tenant_data` | `supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql` line 175 | `services/complianceService.ts` line 68 |
| 6 | `get_terms_acceptances` | `supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql` line 119 | `services/complianceService.ts` line 53 |
| 7 | `record_terms_acceptance` | `supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql` line 58 | `services/complianceService.ts` line 39 |

No additional RPCs are authorized.

---

## 4. Canonical Source

All mock behavior, parameter names, and return shapes shall be derived exclusively from:

```text
supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql
supabase/migrations/20260716000002_gdpr_export_functions.sql
```

Canonical signatures:

```sql
CREATE OR REPLACE FUNCTION public.create_gdpr_request(
  p_user_id UUID,
  p_type TEXT,
  p_reason TEXT DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT false
) RETURNS UUID
```

```sql
CREATE OR REPLACE FUNCTION public.get_gdpr_requests(
  p_status TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS JSON
```

```sql
CREATE OR REPLACE FUNCTION public.gdpr_export_user_data(
  p_user_id UUID
) RETURNS JSON
```

```sql
CREATE OR REPLACE FUNCTION public.gdpr_delete_user_data(
  p_user_id UUID,
  p_dry_run BOOLEAN DEFAULT true
) RETURNS JSON
```

```sql
CREATE OR REPLACE FUNCTION public.export_tenant_data(
  p_tenant_id UUID
) RETURNS JSON
```

```sql
CREATE OR REPLACE FUNCTION public.get_terms_acceptances(
  p_tenant_id UUID DEFAULT NULL,
  p_terms_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS JSON
```

```sql
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

No markdown document, test assumption, or derived artifact may supersede the canonical migration chain.

---

## 5. Target

Authorized implementation target:

```text
tests/mocks/supabase.ts
```

No other production, test, migration, schema, generated-type, or governance files are within scope.

---

## 6. Architecture Boundary

### 6.1 Permitted

- Add `gdpr_requests`, `terms_acceptance`, and `gdpr_deletion_logs` empty arrays to the in-memory `store` object.
- Add minimal `if (name === "...")` mock handlers for the 7 authorized RPCs.
- Derive handler behavior directly from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern, handler conventions, error codes, and camelCase return shapes used by neighboring mock handlers.
- Reuse existing `store.users` as the in-memory equivalent of `auth.users` (consistent with neighboring mock handlers).
- Read existing `store.tenants`, `store.tenant_subscriptions`, `store.tenant_memberships`, `store.payments`, `store.audit_log`, `store.admin_login_history` for export and deletion flows.

### 6.2 Prohibited

- Business logic changes.
- Production code changes.
- Database changes.
- Schema changes.
- Migration changes.
- Generated type changes.
- Audit changes.
- CI changes.
- Refactoring.
- Redesign.
- New abstraction, helper dispatcher, switch, map, or factory.
- Work outside the 7 authorized RPCs.

---

## 7. Implementation Strategy

Engineering shall follow these architectural constraints:

```text
additive only

no refactor

no redesign

no abstraction

preserve if(name==="") dispatch

CURRENT_TASK boundary: 7 RPCs, 1 wave, 1 domain

no duplicate handler

no stale mock
```

### 7.1 Store Additions

Extend the `store` record in `tests/mocks/supabase.ts` with:

```text
gdpr_requests: []
terms_acceptance: []
gdpr_deletion_logs: []
```

No seed data is required; all three stores start empty after `resetMockData`.

Rows shall be stored using snake_case column names matching the canonical table definitions:

- `gdpr_requests`: `id`, `user_id`, `type`, `reason`, `status`, `dry_run`, `result_data`, `result_url`, `requested_by`, `created_at`, `completed_at`
- `terms_acceptance`: `id`, `user_id`, `tenant_id`, `terms_version`, `terms_type`, `accepted_at`, `ip_address`, `user_agent`, `metadata`, `created_at`, `updated_at`
- `gdpr_deletion_logs`: `id`, `request_id`, `user_id`, `action`, `details`, `created_at`

Handlers convert to camelCase when returning JSON only where the service-layer mapper expects it; otherwise return snake_case to match the canonical `json_build_object` output.

### 7.2 Common Handler Conventions

Each handler must:

1. Mirror the canonical function signature (parameter names and optionality).
2. Use `crypto.randomUUID()` for generated UUIDs.
3. Use `new Date().toISOString()` for timestamps.
4. Use `currentUserId` for `requested_by` on insert where canonical uses `auth.uid()`.
5. Return `42501` / Vietnamese permission message when canonical requires `public.is_system_admin()` and `isSystemAdmin` is false.
6. Return `PGRST116` / `Not found` when a target user or tenant cannot be found.
7. Validate enum values against canonical `CHECK` constraints.
8. Return snake_case JSON objects matching canonical `json_build_object` / `row_to_json` output for export/list functions; return raw UUID for insert functions.

### 7.3 Handler Requirements

#### `record_terms_acceptance`

- Validate `p_user_id` is not null; return a clear error if null (canonical raises `Thiếu user_id`).
- Validate `p_terms_type` is one of `'tos'`, `'privacy'`, `'gdpr'`, `'cookie'`, `'custom'` if provided.
- Validate that `p_user_id` exists in `store.users`.
- Canonical allows self-record or system-admin record. In the mock, permit if `params.p_user_id === currentUserId || isSystemAdmin`; otherwise return `42501`.
- Insert a row into `store.terms_acceptance` with:
  - `id: uuid()`
  - `user_id: params.p_user_id`
  - `tenant_id: params.p_tenant_id ?? null`
  - `terms_version: COALESCE(NULLIF(TRIM(params.p_terms_version), ''), '1.0')`
  - `terms_type: COALESCE(NULLIF(TRIM(params.p_terms_type), ''), 'tos')`
  - `ip_address: NULLIF(TRIM(params.p_ip_address), '') || null`
  - `user_agent: NULLIF(TRIM(params.p_user_agent), '') || null`
  - `metadata: params.p_metadata ?? {}`
  - `accepted_at: now()`
  - `created_at: now()`
  - `updated_at: now()`
- Return the generated UUID.

#### `get_terms_acceptances`

- Guard with `if (!isSystemAdmin)` and return `42501` / `Chỉ system admin mới được xem terms acceptance log`.
- Filter `store.terms_acceptance` by:
  - `p_tenant_id IS NULL OR tenant_id = p_tenant_id`
  - `p_terms_type IS NULL OR terms_type = p_terms_type`
- Order by `accepted_at DESC`.
- Paginate by `p_limit` and `p_offset`.
- Map each row to the canonical snake_case output columns: `id`, `user_id`, `tenant_id`, `terms_version`, `terms_type`, `accepted_at`, `ip_address`, `user_agent`, `metadata`, `created_at`.
- Return `{ data, count }`.

#### `export_tenant_data`

- Guard with `if (!isSystemAdmin)` and return `42501` / `Chỉ system admin mới được export dữ liệu tenant`.
- Validate `p_tenant_id` is not null.
- Validate tenant exists in `store.tenants`; if missing return a canonical-aligned error.
- Build `tenant` from the matching `store.tenants` row.
- Build `subscription` from the matching `store.tenant_subscriptions` row.
- Build `members` by joining `store.tenant_memberships` with `store.users` on `user_id`, filtering by `tenant_id`.
- Build `tables` by scanning `store` arrays that:
  - Are arrays.
  - Contain a `tenant_id` column.
  - Are not in the canonical exclusion list: `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins`, `admin_login_history`, `admin_2fa_backup_codes`, `terms_acceptance`.
- For each included table, produce `{ table_name, row_count, rows }` where `rows` is the subset matching `tenant_id`.
- Return `{ tenant, subscription, members, tables, exported_at }` with `exported_at` as ISO string.

#### `create_gdpr_request`

- Guard with `if (!isSystemAdmin)` and return `42501` / `Chỉ system admin mới được tạo GDPR request`.
- Validate `p_user_id` is not null.
- Validate `p_type` is `'export'` or `'deletion'`.
- Validate user exists in `store.users`; if missing raise canonical-aligned error.
- Insert a row into `store.gdpr_requests` with:
  - `id: uuid()`
  - `user_id: params.p_user_id`
  - `type: params.p_type`
  - `reason: NULLIF(TRIM(params.p_reason), '') || null`
  - `status: 'pending'`
  - `dry_run: params.p_dry_run ?? false`
  - `result_data: null`
  - `result_url: null`
  - `requested_by: currentUserId`
  - `created_at: now()`
  - `completed_at: null`
- Return the generated UUID.

#### `get_gdpr_requests`

- Guard with `if (!isSystemAdmin)` and return `42501` / `Chỉ system admin mới được xem GDPR requests`.
- Filter `store.gdpr_requests` by:
  - `p_status IS NULL OR status = p_status`
  - `p_type IS NULL OR type = p_type`
- Order by `created_at DESC`.
- Paginate by `p_limit` and `p_offset`.
- Map each row to the canonical snake_case output columns: `id`, `user_id`, `type`, `reason`, `status`, `dry_run`, `result_url`, `created_at`, `completed_at`, plus `user_email` from `store.users`.
- Return `{ data, count }`.

#### `gdpr_export_user_data`

- Guard with `if (!isSystemAdmin)` and return `42501` / `Chỉ system admin mới được export dữ liệu user`.
- Validate `p_user_id` is not null.
- Validate user exists in `store.users`; if missing raise canonical-aligned error.
- Build `profile` from the matching `store.users` row with keys `id`, `email`, `created_at`, `last_sign_in_at`, `raw_user_meta_data`.
- Build `memberships` from `store.tenant_memberships` joined with `store.tenants`, filtering by `user_id`.
- Build `payments` from `store.payments` where `created_by = p_user_id`, ordered by `created_at DESC`.
- Build `audit_log` from `store.audit_log` where `actor_id = p_user_id`, ordered by `created_at DESC`.
- Build `admin_login_history` from `store.admin_login_history` where `user_id = p_user_id`, ordered by `created_at DESC`.
- Build `terms_acceptance` from `store.terms_acceptance` where `user_id = p_user_id`, ordered by `accepted_at DESC`.
- Return `{ profile, memberships, payments, audit_log, admin_login_history, terms_acceptance, exported_at }`.

#### `gdpr_delete_user_data`

- Guard with `if (!isSystemAdmin)` and return `42501` / `Chỉ system admin mới được xóa dữ liệu user`.
- Validate `p_user_id` is not null.
- Validate user exists in `store.users`; if missing raise canonical-aligned error.
- Build `planned_actions` array in the canonical order and shape:
  1. Anonymize `auth.users` (`email`, `raw_user_meta_data`).
  2. Delete `public.tenant_memberships` with row_count.
  3. Delete `public.terms_acceptance` with row_count.
  4. Anonymize `public.payments.created_by` with row_count.
  5. Delete `public.audit_log` with row_count.
  6. Delete `public.admin_login_history` with row_count.
- If `p_dry_run` is true, return `{ dry_run: true, request_id, user_id, planned_actions }`.
- If `p_dry_run` is false, perform the canonical mutations:
  - Anonymize the user row in `store.users` (set email to `deleted-<id>@anon.local`, clear `raw_user_meta_data`, etc.).
  - Delete `store.tenant_memberships` rows where `user_id = p_user_id`.
  - Delete `store.terms_acceptance` rows where `user_id = p_user_id`.
  - Set `store.payments[*].created_by = null` where `created_by = p_user_id`.
  - Delete `store.audit_log` rows where `actor_id = p_user_id`.
  - Delete `store.admin_login_history` rows where `user_id = p_user_id`.
  - Insert a `gdpr_deletion_logs` row per action (optional but canonical-aligned).
  - Return `{ dry_run: false, request_id, user_id, executed_actions, deleted_at }`.

The existing dispatch pattern in `tests/mocks/supabase.ts` must remain unchanged.

### 7.4 Permission Model

- `create_gdpr_request`, `get_gdpr_requests`, `gdpr_export_user_data`, `gdpr_delete_user_data`, `export_tenant_data`, `get_terms_acceptances`: system-admin only (`isSystemAdmin`).
- `record_terms_acceptance`: self-service for the matching user or system admin (`params.p_user_id === currentUserId || isSystemAdmin`).

### 7.5 Update Semantics

- `record_terms_acceptance` is insert-only.
- `create_gdpr_request` is insert-only.
- `gdpr_delete_user_data` performs destructive mutation when `p_dry_run = false`; tests must be isolated via `resetMockData`.
- No in-place update handlers are required for Domain C.

### 7.6 Mapping snake_case ↔ camelCase

- Store rows remain snake_case internally to match the canonical table definitions.
- `record_terms_acceptance` returns a raw UUID; the service layer does not map.
- `create_gdpr_request` returns a raw UUID; the service layer does not map.
- `get_terms_acceptances` returns snake_case keys; `services/complianceService.ts` `mapTermsAcceptanceFromDB` maps to camelCase.
- `get_gdpr_requests` returns snake_case keys; `services/admin/complianceAdminService.ts` `mapGdprRequestFromDB` maps to camelCase.
- `gdpr_export_user_data` returns snake_case keys; the service layer casts directly to `GdprExportData`.
- `export_tenant_data` returns snake_case keys; the service layer casts directly to `TenantExportData`.
- `gdpr_delete_user_data` returns snake_case keys; the service layer casts directly to `GdprDeleteResult`.

No handler should perform service-layer camelCase mapping.

---

## 8. Coverage Objective

Current Coverage

```text
170 / 183

~92.9%
```

Target Coverage

```text
177 / 183

~96.7%
```

Expected Delta

```text
+7 RPCs
```

Remaining after CURRENT_TASK-027

```text
6 RPCs
```

---

## 9. Validation Plan

The completed engineering work shall satisfy all of the following validation gates:

### 9.1 Audit

```text
npx tsx scripts/audit-rpc-contracts.ts
```

Expected:

```text
Exit 0

183 / 183 RPC contracts in sync

0 duplicate handler

0 stale mock
```

### 9.2 Type Check

```text
npx tsc --noEmit
```

Expected:

```text
PASS
```

### 9.3 Test Gate

```text
npx vitest run
```

Expected:

```text
PASS
```

No regression is permitted. Test file count and passing test count must not decrease.

---

## 10. Out of Scope / Exclusions

This architecture decision explicitly does **not** authorize:

- `CURRENT_TASK-027_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-027_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-027_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-027_ACCEPTANCE_REMEDIATION.md`
- `CURRENT_TASK-027_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-028` or any subsequent CURRENT_TASK
- Any implementation, code change, or test modification prior to approved Engineering Kickoff

---

## 11. Architecture Authority Sign-Off

| | |
|---|---|
| **Approved by** | Architecture Authority |
| **Date** | 2026-07-15 |
| **Decision** | **APPROVE CURRENT_TASK-027 — Wave 4c: Domain C Compliance & GDPR mock-coverage architecture** |
| **Next Step** | Engineering Kickoff for CURRENT_TASK-027, pending Program Manager scheduling |

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-026_PROGRAM_STATUS_REVIEW.md`, `CURRENT_TASK-027_PROGRAM_AUTHORIZATION.md`, `supabase/migrations/20250709000000_phase_p17_3_data_export_terms.sql`, `supabase/migrations/20260716000002_gdpr_export_functions.sql`.*
