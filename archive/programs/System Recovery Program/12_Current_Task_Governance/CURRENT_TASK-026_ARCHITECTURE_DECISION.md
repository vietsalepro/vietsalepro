# CURRENT_TASK-026_ARCHITECTURE_DECISION.md

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Domain:** E — Webhooks & API Keys  
**Wave:** 4b  
**CURRENT_TASK:** 026  
**Document Type:** Architecture Decision  
**Status:** APPROVED (Architecture)  
**Date:** 2026-07-15  
**Authoring Role:** Architecture Authority  

---

## 1. Purpose

Define the architecture boundary and implementation strategy for **CURRENT_TASK-026** before any engineering work begins.

This document authorizes only the architectural approach for adding mock coverage for the **10 authorized Wave 4b RPCs** in Domain E. It does **not** authorize implementation.

---

## 2. Program Context

| Attribute     | Value                                          |
| ------------- | ---------------------------------------------- |
| Phase         | Phase 4 — Derived Validation Layer Realignment |
| Milestone     | M6 — Cross-Cutting Services                    |
| Domain        | E — Webhooks & API Keys                        |
| Wave          | 4b                                             |
| CURRENT_TASK  | CURRENT_TASK-026                               |
| Previous Task | CURRENT_TASK-025 (Closed)                      |
| Current Status| AUTHORIZED                                     |

---

## 3. Authorized RPC Scope

The implementation scope is limited to the following **10 RPCs**:

| # | RPC Name | Canonical Source Location | Calling Code Location |
| --- | --- | --- | --- |
| 1 | `create_tenant_api_key` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 5153 | `services/apiKeyService.ts` line 31 |
| 2 | `create_tenant_webhook` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 5204 | `services/webhookService.ts` line 57 |
| 3 | `delete_tenant_webhook` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 5775 | `services/webhookService.ts` line 91 |
| 4 | `list_tenant_api_keys` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 10002 | `services/apiKeyService.ts` line 21 |
| 5 | `list_tenant_webhooks` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 10034 | `services/webhookService.ts` line 45 |
| 6 | `list_webhook_deliveries` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 10063 | `services/webhookService.ts` line 99 |
| 7 | `retry_webhook_delivery` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 11540 | `services/webhookService.ts` line 126 |
| 8 | `revoke_tenant_api_key` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 11571 | `services/apiKeyService.ts` line 41 |
| 9 | `trigger_webhook_event` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 12512 | `services/webhookService.ts` line 116 |
| 10 | `update_tenant_webhook` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 13102 | `services/webhookService.ts` line 78 |

No additional RPCs are authorized.

---

## 4. Canonical Source

All mock behavior, parameter names, and return shapes shall be derived exclusively from:

```text
supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
```

Canonical signatures:

```sql
CREATE OR REPLACE FUNCTION "public"."create_tenant_api_key"(
  "p_tenant_id" "uuid",
  "p_name" "text",
  "p_version" integer DEFAULT 1
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."create_tenant_webhook"(
  "p_tenant_id" "uuid",
  "p_name" "text",
  "p_url" "text",
  "p_events" "text"[] DEFAULT ARRAY['*'::"text"],
  "p_secret" "text" DEFAULT NULL::"text"
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."delete_tenant_webhook"(
  "p_webhook_id" "uuid"
) RETURNS "void"
```

```sql
CREATE OR REPLACE FUNCTION "public"."list_tenant_api_keys"(
  "p_tenant_id" "uuid"
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."list_tenant_webhooks"(
  "p_tenant_id" "uuid"
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."list_webhook_deliveries"(
  "p_webhook_id" "uuid",
  "p_limit" integer DEFAULT 50,
  "p_offset" integer DEFAULT 0
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."retry_webhook_delivery"(
  "p_delivery_id" "uuid"
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."revoke_tenant_api_key"(
  "p_key_id" "uuid"
) RETURNS "public"."tenant_api_keys"
```

```sql
CREATE OR REPLACE FUNCTION "public"."trigger_webhook_event"(
  "p_tenant_id" "uuid",
  "p_event_type" "text",
  "p_payload" "jsonb" DEFAULT '{}'::"jsonb",
  "p_idempotency_key" "text" DEFAULT NULL::"text"
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."update_tenant_webhook"(
  "p_webhook_id" "uuid",
  "p_name" "text" DEFAULT NULL::"text",
  "p_url" "text" DEFAULT NULL::"text",
  "p_events" "text"[] DEFAULT NULL::"text"[],
  "p_secret" "text" DEFAULT NULL::"text",
  "p_status" "text" DEFAULT NULL::"text"
) RETURNS json
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

- Add `tenant_api_keys`, `tenant_webhooks`, and `webhook_deliveries` empty arrays to the in-memory `store` object.
- Add minimal `if (name === "...")` mock handlers for the 10 authorized RPCs.
- Derive handler behavior directly from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern, handler conventions, error codes, and camelCase return shapes used by neighboring mock handlers.
- Use `currentUserId` for `created_by` on insert and `revoked_by` on revoke.
- Reference existing `store.tenants` for tenant-existence checks.

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
- Work outside the 10 authorized RPCs.

---

## 7. Implementation Strategy

Engineering shall follow these architectural constraints:

```text
additive only

no refactor

no redesign

no abstraction

preserve if(name==="") dispatch

CURRENT_TASK boundary: 10 RPCs, 1 wave, 1 domain

no duplicate handler

no stale mock
```

### 7.1 Store Additions

Extend the `store` record in `tests/mocks/supabase.ts` with:

```text
tenant_api_keys: []
tenant_webhooks: []
webhook_deliveries: []
```

No seed data is required; all three stores start empty after `resetMockData`.

Rows shall be stored using snake_case column names matching the canonical table definitions (e.g. `tenant_id`, `api_key_hash`, `api_key_preview`, `created_by`, `revoked_at`, `event_type`, `idempotency_key`, `attempt_count`, `next_retry_at`, etc.). Handlers convert to camelCase when returning JSON, consistent with neighboring mocks.

### 7.2 Common Handler Conventions

Each handler must:

1. Mirror the canonical function signature (parameter names and optionality).
2. Guard with `if (!isSystemAdmin)` and return `{ data: null, error: { code: '42501', message: '<canonical message>' } }`.
3. Use `crypto.randomUUID()` for generated UUIDs.
4. Use `new Date().toISOString()` for timestamps.
5. Use `currentUserId` for `created_by` and `revoked_by`.
6. Return `PGRST116` / `Not found` when a target record cannot be found on update, delete, revoke, or retry.
7. Return camelCase JSON objects matching the canonical `json_build_object` output or `row_to_json` column aliases.

### 7.3 Handler Requirements

#### `create_tenant_api_key`

- Validate `isSystemAdmin`.
- Validate that `p_tenant_id` corresponds to an existing tenant in `store.tenants`.
- Validate that `p_name` is non-empty after trimming.
- Generate a 64-character hex token, compute `api_key_preview` as the last 4 characters, and store a SHA-256-like hash in `api_key_hash`.
- Insert a row with `status = 'active'`, `version = COALESCE(p_version, 1)`, and `created_by = currentUserId`.
- Return the canonical JSON shape: `id`, `tenantId`, `name`, `apiKey`, `apiKeyPreview`, `version`, `status`, `createdAt`, `lastUsedAt`.

#### `create_tenant_webhook`

- Validate `isSystemAdmin`.
- Validate that `p_tenant_id` corresponds to an existing tenant.
- Validate that `p_name` and `p_url` are non-empty after trimming.
- Validate that `p_url` begins with `http://` or `https://`.
- Insert a row with `events = COALESCE(p_events, ['*'])`, `secret = p_secret`, `status = 'active'`, and `created_by = currentUserId`.
- Return the canonical JSON shape: `id`, `tenantId`, `name`, `url`, `events`, `status`, `createdAt`, `updatedAt`.

#### `delete_tenant_webhook`

- Validate `isSystemAdmin`.
- Find the webhook in `store.tenant_webhooks` by `p_webhook_id`; if missing, return `PGRST116`.
- Remove the row from `store.tenant_webhooks`.
- Return `{ data: { id, deleted: true }, error: null }` to match neighboring delete-handler conventions.

#### `list_tenant_api_keys`

- Validate `isSystemAdmin`.
- Return all rows from `store.tenant_api_keys` matching `tenant_id = p_tenant_id`, ordered by `created_at DESC`.
- Map each row to the canonical camelCase output columns: `id`, `tenantId`, `name`, `apiKeyPreview`, `version`, `status`, `createdBy`, `revokedAt`, `revokedBy`, `lastUsedAt`, `createdAt`, `updatedAt`.

#### `list_tenant_webhooks`

- Validate `isSystemAdmin`.
- Return all rows from `store.tenant_webhooks` matching `tenant_id = p_tenant_id`, ordered by `created_at DESC`.
- Map each row to the canonical camelCase output columns: `id`, `tenantId`, `name`, `url`, `events`, `status`, `createdBy`, `createdAt`, `updatedAt`.

#### `list_webhook_deliveries`

- Validate `isSystemAdmin`.
- Filter `store.webhook_deliveries` by `webhook_id = p_webhook_id`, ordered by `created_at DESC`, paginated by `p_limit` and `p_offset`.
- Compute total `count` for the webhook.
- Map each row to the canonical camelCase output columns, including `attemptLog`.
- Return `{ data, count }`.

#### `retry_webhook_delivery`

- Validate `isSystemAdmin`.
- Find the delivery in `store.webhook_deliveries` by `p_delivery_id` with `status IN ('failed','exhausted')`; if not found, return `PGRST116`.
- Update `status` to `'pending'`, `next_retry_at` to now, and `updated_at` to now.
- Return the canonical JSON shape: `id`, `status`, `attemptCount`, `nextRetryAt`.

#### `revoke_tenant_api_key`

- Validate `isSystemAdmin`.
- Find the key in `store.tenant_api_keys` by `p_key_id`; if not found, return `PGRST116`.
- Update `status` to `'revoked'`, `revoked_at` to now, `revoked_by` to `currentUserId`, and `updated_at` to now.
- Return the updated row in snake_case so the service-layer mapper converts it correctly.

#### `trigger_webhook_event`

- Validate `isSystemAdmin`.
- Validate that `p_tenant_id` and `p_event_type` are non-null.
- Find active webhooks (`status = 'active'`) for the tenant where `events` contains `'*'` or `p_event_type`.
- If none match, return `{ enqueued: 0, deliveries: [] }`.
- Generate an idempotency root (fallback to a deterministic/random value when `p_idempotency_key` is null).
- For each matching webhook, if no delivery already exists with the same composite `idempotency_key`, insert a delivery row with:
  - `webhook_id`, `tenant_id = p_tenant_id`, `event_type = p_event_type`, `payload = p_payload`.
  - `idempotency_key = root + ':' + webhook_id`.
  - `status = 'pending'`, `next_retry_at` now, `attempt_count = 0`.
- Return `{ enqueued: <inserted count>, deliveries: [...] }` where each delivery item contains `id`, `webhook_id`, `idempotency_key`, `status`.

#### `update_tenant_webhook`

- Validate `isSystemAdmin`.
- Find the webhook in `store.tenant_webhooks` by `p_webhook_id`; if missing, return `PGRST116`.
- Apply `COALESCE` semantics for non-null parameters: `trim(p_name)`, `trim(p_url)`, `p_events`, `p_secret`, `p_status` overwrite the existing row values.
- Update `updated_at` to now.
- Return the canonical JSON shape: `id`, `tenantId`, `name`, `url`, `events`, `status`, `createdAt`, `updatedAt`.

The existing dispatch pattern in `tests/mocks/supabase.ts` must remain unchanged.

---

## 8. Coverage Objective

Current Coverage

```text
160 / 183

~87.4%
```

Target Coverage

```text
170 / 183

~92.9%
```

Expected Delta

```text
+10 RPCs
```

Remaining after CURRENT_TASK-026

```text
13 RPCs
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

125 / 125 RPC contracts in sync

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
68 files

389 tests

PASS
```

No regression is permitted. Test file count and passing test count must not decrease.

---

## 10. Out of Scope / Exclusions

This architecture decision explicitly does **not** authorize:

- `CURRENT_TASK-026_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-026_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-026_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-026_ACCEPTANCE_REMEDIATION.md`
- `CURRENT_TASK-026_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-027` or any subsequent CURRENT_TASK
- Any implementation, code change, or test modification prior to approved Engineering Kickoff

---

## 11. Architecture Authority Sign-Off

| | |
|---|---|
| **Approved by** | Architecture Authority |
| **Date** | 2026-07-15 |
| **Decision** | **APPROVE CURRENT_TASK-026 — Wave 4b: Domain E Webhooks & API Keys mock-coverage architecture** |
| **Next Step** | Engineering Kickoff for CURRENT_TASK-026, pending Program Manager scheduling |

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_025.md`, `CURRENT_TASK-026_PROGRAM_AUTHORIZATION.md`, `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`.*
