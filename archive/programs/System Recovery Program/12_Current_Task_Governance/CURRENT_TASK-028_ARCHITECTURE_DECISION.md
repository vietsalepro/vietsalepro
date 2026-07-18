# CURRENT_TASK-028 Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Domain:** F — Notifications  
**Wave:** 4d  
**CURRENT_TASK:** 028  
**Document Type:** Architecture Decision  
**Status:** APPROVED (Architecture)  
**Date:** 2026-07-16  
**Authoring Role:** Architecture Authority  

---

## 1. Purpose

Define the architecture boundary and implementation strategy for **CURRENT_TASK-028** before any engineering work begins.

This document authorizes only the architectural approach for adding mock coverage for the **3 authorized Wave 4d RPCs** in Domain F. It does **not** authorize implementation.

---

## 2. Program Context

| Attribute     | Value                                          |
| ------------- | ---------------------------------------------- |
| Phase         | Phase 4 — Derived Validation Layer Realignment |
| Milestone     | M6 — Cross-Cutting Services                    |
| Domain        | F — Notifications                              |
| Wave          | 4d                                             |
| CURRENT_TASK  | CURRENT_TASK-028                               |
| Previous Task | CURRENT_TASK-027 (Closed)                      |
| Current Status| AUTHORIZED                                     |

---

## 3. Authorized RPC Scope

The implementation scope is limited to the following **3 RPCs**:

| # | RPC Name | Canonical Source Location | Calling Code Location |
| --- | --- | --- | --- |
| 1 | `send_in_app_message` | `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql` line 111 | `services/notificationService.ts` line 64 |
| 2 | `get_in_app_messages_for_tenant` | `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql` line 159 | `services/notificationService.ts` line 80 |
| 3 | `mark_in_app_message_read` | `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql` line 222 | `services/notificationService.ts` line 90 |

No additional RPCs are authorized.

---

## 4. Canonical Source

All mock behavior, parameter names, and return shapes shall be derived exclusively from:

```text
supabase/migrations/20250708000000_phase_p12_3_notification_log.sql
```

Canonical signatures:

```sql
CREATE OR REPLACE FUNCTION public.send_in_app_message(
  p_tenant_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_metadata JSONB DEFAULT NULL
) RETURNS public.notification_logs
```

```sql
CREATE OR REPLACE FUNCTION public.get_in_app_messages_for_tenant(
  p_tenant_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  channel TEXT,
  title TEXT,
  content TEXT,
  status TEXT,
  error_message TEXT,
  metadata JSONB,
  sent_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

```sql
CREATE OR REPLACE FUNCTION public.mark_in_app_message_read(
  p_log_id UUID,
  p_tenant_id UUID DEFAULT NULL
) RETURNS BOOLEAN
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

- Add one empty `notification_logs` array to the in-memory `store` object.
- Add minimal `if (name === "...")` mock handlers for the 3 authorized RPCs.
- Derive handler behavior directly from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern, handler conventions, error codes, and camelCase return shapes used by neighboring mock handlers.
- Reuse existing `uuid()` helper, `currentUserId`, `currentTenantId`, and `isSystemAdmin` state already present in the mock.

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
- Work outside the 3 authorized RPCs.

---

## 7. Implementation Strategy

Engineering shall follow these architectural constraints:

```text
additive only

no refactor

no redesign

no abstraction

preserve if(name==="") dispatch

CURRENT_TASK boundary: 3 RPCs, 1 wave, 1 domain

no duplicate handler

no stale mock
```

### 7.1 Store Additions

Extend the `store` record in `tests/mocks/supabase.ts` with:

```text
notification_logs: []
```

No seed data is required; the store starts empty after `resetMockData`.

Rows shall be stored using snake_case column names matching the canonical table definition:

- `notification_logs`: `id`, `tenant_id`, `channel`, `title`, `content`, `status`, `error_message`, `metadata`, `sent_by`, `created_at`, `updated_at`

Handlers convert to camelCase by returning snake_case rows; the service-layer `mapNotificationLogFromDB` maps to camelCase.

### 7.2 Common Handler Conventions

Each handler must:

1. Mirror the canonical function signature (parameter names and optionality).
2. Use `crypto.randomUUID()` for generated UUIDs via the existing `uuid()` helper.
3. Use `new Date().toISOString()` for timestamps.
4. Use `currentUserId` for `sent_by` on insert where canonical uses `auth.uid()`.
5. Return `42501` / Vietnamese permission message when canonical requires `public.is_system_admin()` and `isSystemAdmin` is false.
6. Return `PGRST116` / `Not found` when a target log row cannot be found, where the canonical path would return no row or false.
7. Preserve canonical channel and status enum values (`in_app`, `sent`, `read`, etc.).
8. Return snake_case row shapes for `send_in_app_message` and `get_in_app_messages_for_tenant`; return a raw boolean for `mark_in_app_message_read`.

### 7.3 Handler Requirements

#### `send_in_app_message`

- Guard with `if (!isSystemAdmin)` and return `42501` / `Chỉ system admin mới được gửi tin nhắn in-app` (canonical RLS `notification_logs_insert_admin` requires system admin).
- Validate `p_tenant_id`, `p_title`, and `p_content` per canonical `NOT NULL` columns.
- Insert a row into `store.notification_logs` with:
  - `id: uuid()`
  - `tenant_id: params.p_tenant_id`
  - `channel: 'in_app'`
  - `title: params.p_title.trim()`
  - `content: params.p_content.trim()`
  - `status: 'sent'`
  - `error_message: null`
  - `metadata: params.p_metadata ?? null`
  - `sent_by: currentUserId`
  - `created_at: now()`
  - `updated_at: now()`
- Return the inserted row in snake_case.

#### `get_in_app_messages_for_tenant`

- Resolve effective tenant id: `v_tenant_id := params.p_tenant_id ?? currentTenantId`.
- If `v_tenant_id` is null, return an empty array (matches canonical early `RETURN` when `current_tenant_id()` is null).
- Filter `store.notification_logs` where `tenant_id = v_tenant_id` and `channel = 'in_app'`.
- Order by `created_at DESC`.
- Paginate by `p_limit` and `p_offset`.
- Return the matching rows in snake_case.
- No explicit permission check is required in the mock; canonical RLS `notification_logs_select_tenant` enforces tenant visibility and the service layer always supplies a tenant id.

#### `mark_in_app_message_read`

- Resolve effective tenant id: `v_tenant_id := params.p_tenant_id ?? currentTenantId`.
- If `v_tenant_id` is null, return `false`.
- Find the first row in `store.notification_logs` where:
  - `id = params.p_log_id`
  - `tenant_id = v_tenant_id`
  - `channel = 'in_app'`
  - `status <> 'read'`
- If found:
  - Set `status = 'read'`.
  - Set `updated_at = now()`.
  - Return `true`.
- If not found, return `false`.
- No explicit permission check is required in the mock; canonical function is `SECURITY DEFINER` and relies on the tenant match in the `WHERE` clause.

The existing dispatch pattern in `tests/mocks/supabase.ts` must remain unchanged.

### 7.4 Permission Model

- `send_in_app_message`: system-admin only (`isSystemAdmin`), matching canonical RLS `notification_logs_insert_admin`.
- `get_in_app_messages_for_tenant`: tenant-scoped by `tenant_id` resolution; no additional mock guard needed because the service layer supplies the tenant id and canonical RLS enforces membership.
- `mark_in_app_message_read`: tenant-scoped by `tenant_id` resolution and log row match; no additional mock guard needed because canonical `SECURITY DEFINER` function filters by `tenant_id` and `channel`.

### 7.5 Update Semantics

- `send_in_app_message` is insert-only.
- `get_in_app_messages_for_tenant` is read-only.
- `mark_in_app_message_read` is an in-place status update: it mutates the matching row's `status` to `'read'` and refreshes `updated_at`.

### 7.6 Mapping snake_case ↔ camelCase

- Store rows remain snake_case internally to match the canonical table definition.
- `send_in_app_message` returns a snake_case row; `services/notificationService.ts` `mapNotificationLogFromDB` maps to camelCase.
- `get_in_app_messages_for_tenant` returns an array of snake_case rows; `services/notificationService.ts` `mapNotificationLogFromDB` maps each row to camelCase.
- `mark_in_app_message_read` returns a raw boolean; the service layer coerces with `!!data`.

No handler should perform service-layer camelCase mapping.

---

## 8. Coverage Objective

Current Coverage

```text
177 / 183

~96.7%
```

Target Coverage

```text
180 / 183

~98.4%
```

Expected Delta

```text
+3 RPCs
```

Remaining after CURRENT_TASK-028

```text
3 RPCs
```

---

## 9. Risk Assessment

| Risk | Severity | Mitigation |
| ---- | -------- | ---------- |
| Mock over-approximates RLS behavior for tenant-scoped reads | Low | Handlers filter by resolved `tenant_id` exactly as canonical functions do; no cross-tenant leakage is possible in the in-memory store because tenant is an explicit filter. |
| `send_in_app_message` permission guard diverges from future RLS changes | Low | Guard mirrors current canonical `GRANT` and RLS policy; any migration change requires a new CURRENT_TASK and Program Authorization. |
| Empty `notification_logs` store causes test assertions to receive zero rows | Low | Expected behavior; tests that exercise these RPCs are responsible for seeding rows through `send_in_app_message` or direct `addMockRow`. |

---

## 10. Validation Plan

The Wave 4d implementation is acceptable when the following gates remain green:

1. `npx tsx scripts/audit-rpc-contracts.ts` exits `0` with `RPC contracts and service code are in sync`.
2. `npx tsc --noEmit` exits `0`.
3. `npx vitest run` exits `0` with no decrease in passing test count.
4. Only `tests/mocks/supabase.ts` is modified.
5. Exactly one new store array (`notification_logs`) and exactly 3 new RPC handlers are added.

---

## 11. Conclusion

```text
APPROVED
```

The architecture for CURRENT_TASK-028 — Wave 4d: Domain F (Notifications) mock coverage is approved. Engineering Kickoff is authorized next, pending Program Manager confirmation that this Architecture Decision satisfies Phase 4 constraints.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-027_PROGRAM_STATUS_REVIEW.md`, `CURRENT_TASK-028_PROGRAM_AUTHORIZATION.md`, `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql`, `services/notificationService.ts`, `tests/mocks/supabase.ts`, `types/notification.ts`.*
