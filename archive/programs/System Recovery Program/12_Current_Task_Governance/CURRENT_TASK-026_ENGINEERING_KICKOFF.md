# CURRENT_TASK-026 — Engineering Kickoff

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Task:** Wave 4b — Domain E — Webhooks & API Keys Mock Coverage  
**Document Type:** Engineering Readiness  
**Date:** 2026-07-15  
**Status:** Engineering Ready  

---

## Engineering Kickoff

This document confirms engineering readiness for CURRENT_TASK-026. It records architecture approval, scope, dependencies, canonical source, target files, engineering strategy, constraints, and validation gates. Implementation is **not** authorized by this document and requires separate approval after this kickoff is accepted.

---

## Objective

Add mock coverage for the **10** uncovered Domain E — Webhooks & API Keys RPCs in `tests/mocks/supabase.ts`, deriving each handler's return shape and parameter contract from the canonical migration chain. This task continues Milestone M6 — Cross-Cutting Services (Wave 4b) and targets raising mock coverage from **~87.4% (160/183)** to approximately **~92.9% (170/183)**.

---

## Current Program Status

| Item | Value |
|---|---|
| Active phase | Phase 4 — Derived Validation Layer Realignment |
| Current milestone | M6 — Cross-Cutting Services: **IN PROGRESS** |
| Current wave | Wave 4a complete; Wave 4b ready |
| Current coverage | **~87.4% (160 / 183)** |
| Uncovered RPCs | **23** |
| Most recent accepted task | CURRENT_TASK-025 — Domain D: Integrations & Partners |
| Program health | HEALTHY — on track, no blockers |

Phase 4 exit criteria EC-3 (canonical audit gate alignment) and EC-4 (CI divergence gate) remain open as known residuals. EC-1 and EC-2 continue to progress with each coverage wave.

---

## Authorized Scope

### In Scope

- Add exactly **10** mock handlers to `tests/mocks/supabase.ts` for Domain E — Webhooks & API Keys.
- Derive each mock's return shape and parameter contract from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern.
- Extend the in-memory `store` with `tenant_api_keys`, `tenant_webhooks`, and `webhook_deliveries` arrays only.
- Additive changes only; no refactor, redesign, or abstraction.

### Out of Scope

- Production code changes (`services/`, `lib/`, `utils/`, UI, components, pages).
- Migration, schema, or generated type modifications.
- Changes to `scripts/audit-rpc-contracts.ts`, CI workflows, or `package.json`.
- New governance artifacts, post-implementation artifacts, acceptance records, or CURRENT_TASK-027.
- Re-ordering, re-classifying, or expanding the Coverage Roadmap.

---

## Authorized RPCs

The following **10** RPCs are authorized for mock coverage. No additional RPCs may be added.

| # | RPC | Canonical Migration File | Canonical Line | RETURNS | Calling Code Location |
|---|---|---|---|---:|---|
| 1 | `create_tenant_api_key` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5153 | `json` | `services/apiKeyService.ts` line 31 |
| 2 | `create_tenant_webhook` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5204 | `json` | `services/webhookService.ts` line 57 |
| 3 | `delete_tenant_webhook` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 5775 | `void` | `services/webhookService.ts` line 91 |
| 4 | `list_tenant_api_keys` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 10002 | `json` | `services/apiKeyService.ts` line 21 |
| 5 | `list_tenant_webhooks` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 10034 | `json` | `services/webhookService.ts` line 45 |
| 6 | `list_webhook_deliveries` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 10063 | `json` | `services/webhookService.ts` line 99 |
| 7 | `retry_webhook_delivery` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 11540 | `json` | `services/webhookService.ts` line 126 |
| 8 | `revoke_tenant_api_key` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 11571 | `tenant_api_keys` | `services/apiKeyService.ts` line 41 |
| 9 | `trigger_webhook_event` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 12512 | `json` | `services/webhookService.ts` line 116 |
| 10 | `update_tenant_webhook` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | 13102 | `json` | `services/webhookService.ts` line 78 |

**Authorized RPC Count: 10 / 10**

### Canonical signatures

```sql
-- create_tenant_api_key
CREATE OR REPLACE FUNCTION "public"."create_tenant_api_key"(
  "p_tenant_id" "uuid",
  "p_name" "text",
  "p_version" integer DEFAULT 1
) RETURNS json

-- create_tenant_webhook
CREATE OR REPLACE FUNCTION "public"."create_tenant_webhook"(
  "p_tenant_id" "uuid",
  "p_name" "text",
  "p_url" "text",
  "p_events" "text"[] DEFAULT ARRAY['*'::"text"],
  "p_secret" "text" DEFAULT NULL::"text"
) RETURNS json

-- delete_tenant_webhook
CREATE OR REPLACE FUNCTION "public"."delete_tenant_webhook"(
  "p_webhook_id" "uuid"
) RETURNS "void"

-- list_tenant_api_keys
CREATE OR REPLACE FUNCTION "public"."list_tenant_api_keys"(
  "p_tenant_id" "uuid"
) RETURNS json

-- list_tenant_webhooks
CREATE OR REPLACE FUNCTION "public"."list_tenant_webhooks"(
  "p_tenant_id" "uuid"
) RETURNS json

-- list_webhook_deliveries
CREATE OR REPLACE FUNCTION "public"."list_webhook_deliveries"(
  "p_webhook_id" "uuid",
  "p_limit" integer DEFAULT 50,
  "p_offset" integer DEFAULT 0
) RETURNS json

-- retry_webhook_delivery
CREATE OR REPLACE FUNCTION "public"."retry_webhook_delivery"(
  "p_delivery_id" "uuid"
) RETURNS json

-- revoke_tenant_api_key
CREATE OR REPLACE FUNCTION "public"."revoke_tenant_api_key"(
  "p_key_id" "uuid"
) RETURNS "public"."tenant_api_keys"

-- trigger_webhook_event
CREATE OR REPLACE FUNCTION "public"."trigger_webhook_event"(
  "p_tenant_id" "uuid",
  "p_event_type" "text",
  "p_payload" "jsonb" DEFAULT '{}'::"jsonb",
  "p_idempotency_key" "text" DEFAULT NULL::"text"
) RETURNS json

-- update_tenant_webhook
CREATE OR REPLACE FUNCTION "public"."update_tenant_webhook"(
  "p_webhook_id" "uuid",
  "p_name" "text" DEFAULT NULL::"text",
  "p_url" "text" DEFAULT NULL::"text",
  "p_events" "text"[] DEFAULT NULL::"text"[],
  "p_secret" "text" DEFAULT NULL::"text",
  "p_status" "text" DEFAULT NULL::"text"
) RETURNS json
```

### Service call sites

- `services/apiKeyService.ts`
  - `getTenantApiKeys(tenantId)` → `list_tenant_api_keys` (line 21), expects `TenantApiKey[]` mapped from camelCase fields.
  - `createTenantApiKey(tenantId, name, version)` → `create_tenant_api_key` (line 31), returns a single `TenantApiKey`.
  - `revokeTenantApiKey(keyId)` → `revoke_tenant_api_key` (line 41), returns a single `TenantApiKey` mapped from the returned row.

- `services/webhookService.ts`
  - `getTenantWebhooks(tenantId)` → `list_tenant_webhooks` (line 45), expects `TenantWebhook[]` mapped from camelCase fields.
  - `createTenantWebhook(...)` → `create_tenant_webhook` (line 57), returns a single `TenantWebhook`.
  - `updateTenantWebhook(webhookId, updates)` → `update_tenant_webhook` (line 78), returns a single `TenantWebhook`.
  - `deleteTenantWebhook(webhookId)` → `delete_tenant_webhook` (line 91), returns `void`.
  - `getWebhookDeliveries(webhookId, options)` → `list_webhook_deliveries` (line 99), expects `{ data: WebhookDelivery[], count: number }`.
  - `triggerWebhookEvent(tenantId, eventType, payload)` → `trigger_webhook_event` (line 116), expects `{ enqueued: number, deliveries?: any[] }`.
  - `retryWebhookDelivery(deliveryId)` → `retry_webhook_delivery` (line 126), returns a single `WebhookDelivery`.

`services/apiKeyService.ts` and `services/webhookService.ts` are read-only call-site references for this task and must not be modified.

---

## Dependency Verification

| Prerequisite | Status | Evidence |
|---|---|---|
| CURRENT_TASK-025 closed | Yes | `CURRENT_TASK-025_ACCEPTANCE_REVIEW_V2.md` accepted; `CURRENT_TASK-026_PROGRAM_AUTHORIZATION.md` §1 |
| Architecture Decision approved | Yes | `CURRENT_TASK-026_ARCHITECTURE_DECISION.md` Status: **APPROVED (Architecture)** |
| Program Authorization approved | Yes | `CURRENT_TASK-026_PROGRAM_AUTHORIZATION.md` Status: **APPROVED** |
| Canonical migration chain available | Yes | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` present and verified |
| Target file exists | Yes | `tests/mocks/supabase.ts` exists and contains the existing `if (name === "...")` dispatch chain |
| No technical blocker | Yes | Domain E has no downstream dependencies on remaining uncovered domains; all 10 RPCs are confined to `services/apiKeyService.ts` and `services/webhookService.ts` |
| Domain E can deploy independently | Yes | Wave 4b is explicitly scoped as independent cross-cutting service coverage in `PHASE4_COVERAGE_ROADMAP.md` |

---

## Canonical Source

| Artifact | Path | Classification | Authority |
|---|---|---|---|
| Forward migration chain | `supabase/migrations/*.sql` (top-level, non-recursive, excluding `rollback/`) | Canonical | `SYSTEM_RECOVERY_MASTER_PLAN.md` §2.1; `CURRENT_TASK-012`; `CURRENT_TASK-013` |

The canonical source for RPC names, parameter lists, and return shapes is the `CREATE [OR REPLACE] FUNCTION public.<name>` declaration for each authorized RPC in the forward migration chain. Engineering must not use derived documents, service call sites, or previous mock patterns as the contract authority.

### Handler return-shape requirements

Per the canonical migration and the approved Architecture Decision:

- `create_tenant_api_key` returns a camelCase JSON object with keys: `id`, `tenantId`, `name`, `apiKey`, `apiKeyPreview`, `version`, `status`, `createdAt`, `lastUsedAt`.
- `list_tenant_api_keys` returns a JSON array of camelCase API-key objects with keys: `id`, `tenantId`, `name`, `apiKeyPreview`, `version`, `status`, `createdBy`, `revokedAt`, `revokedBy`, `lastUsedAt`, `createdAt`, `updatedAt`, ordered by `createdAt` descending.
- `revoke_tenant_api_key` returns the updated row; the service-layer `mapApiKeyFromDB` maps both snake_case and camelCase fields.
- `create_tenant_webhook` / `update_tenant_webhook` return a camelCase JSON object with keys: `id`, `tenantId`, `name`, `url`, `events`, `status`, `createdAt`, `updatedAt`.
- `list_tenant_webhooks` returns a JSON array of the same camelCase webhook shape, ordered by `createdAt` descending.
- `delete_tenant_webhook` returns `void` (`{ data: null, error: null }` in the mock). Missing records must return `PGRST116` / `Not found`.
- `list_webhook_deliveries` returns `{ data: [...], count: <total> }`, where each delivery contains `id`, `webhookId`, `tenantId`, `eventType`, `payload`, `idempotencyKey`, `status`, `httpStatus`, `responseBody`, `errorMessage`, `attemptCount`, `maxAttempts`, `attemptedAt`, `deliveredAt`, `nextRetryAt`, `attemptLog`, `createdAt`, `updatedAt`.
- `retry_webhook_delivery` returns a camelCase JSON object with keys: `id`, `status`, `attemptCount`, `nextRetryAt`.
- `trigger_webhook_event` returns `{ enqueued: <count>, deliveries: [...] }`, where each delivery contains `id`, `webhook_id`, `idempotency_key`, `status`.

---

## Engineering Approach

### Store Additions

Extend the `store` record in `tests/mocks/supabase.ts` with exactly:

```text
tenant_api_keys: []
tenant_webhooks: []
webhook_deliveries: []
```

No seed data is required; all three arrays start empty after `resetMockData`.

Rows shall be stored using snake_case column names matching the canonical table definitions. Handlers convert to camelCase when returning JSON, consistent with neighboring mocks.

### Handler Additions

Add one minimal `if (name === "...")` block per authorized RPC, placed adjacent to existing sibling handlers in the dispatch chain. Each handler must:

1. Mirror the canonical function signature (parameter names and optionality).
2. Guard with `if (!isSystemAdmin)` and return `{ data: null, error: { code: '42501', message: '<canonical message>' } }`.
3. Return `PGRST116` / `Not found` for missing records on update, delete, revoke, or retry.
4. Return camelCase JSON objects matching the canonical `json_build_object` output or `row_to_json` column aliases.
5. Use `crypto.randomUUID()` for generated UUIDs.
6. Use `new Date().toISOString()` for timestamps.
7. Use `currentUserId` for `created_by` on insert and `revoked_by` on revoke.
8. Reference `store.tenants` for tenant-existence checks where the canonical function requires it.
9. Apply `COALESCE` semantics for update parameters: explicit non-null/non-empty parameters overwrite the existing row value.
10. For `create_tenant_api_key`, generate a 64-character hex token, compute `api_key_preview` as the last 4 characters, and store a SHA-256-like hash in `api_key_hash`.
11. For `create_tenant_webhook`, validate that `p_url` begins with `http://` or `https://`.
12. For `trigger_webhook_event`, find active webhooks where `events` contains `'*'` or `p_event_type`; generate an idempotency root and one delivery per matching webhook, skipping duplicates on `idempotency_key`.
13. For `retry_webhook_delivery`, only match deliveries with `status IN ('failed','exhausted')`.

The existing dispatch pattern in `tests/mocks/supabase.ts` must remain unchanged.

---

## Coverage Objective

| Metric | Before CURRENT_TASK-026 | After CURRENT_TASK-026 |
|---|---|---|
| Covered RPCs | 160 / 183 | **170 / 183** |
| Uncovered RPCs | 23 | **13** |
| Coverage | ~87.4% | **~92.9%** |
| Delta | — | **+10 RPCs, +~5.5 percentage points** |

---

## Validation Gates

The completed engineering work shall satisfy all of the following validation gates:

### Canonical Audit Gate

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

### Type Gate

```text
npx tsc --noEmit
```

Expected:

```text
PASS
```

### Test Gate

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

## Constraints Confirmation

Engineering confirms the following constraints from the Program Authorization and Architecture Decision:

| Constraint | Confirmed |
|---|---|
| Additive only | Yes |
| No refactor | Yes |
| No redesign | Yes |
| No abstraction | Yes |
| Preserve `if (name === "...")` dispatch pattern | Yes |
| Preserve existing handler conventions | Yes |
| CURRENT_TASK boundary: 10 RPCs, 1 wave, 1 domain | Yes |
| No duplicate handler | Yes |
| No stale mock | Yes |
| No production code changes | Yes |
| No migration/schema/generated-type changes | Yes |
| No CI/workflow changes | Yes |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Store field naming mismatch with `mapApiKeyFromDB` / `mapWebhookFromDB` / `mapDeliveryFromDB` | Low | Medium | Derive store row fields directly from the canonical table columns; keep camelCase mapping in returned JSON only. |
| `trigger_webhook_event` idempotency semantics differ from canonical function | Low | Low | Match the canonical SQL: generate a root key, append `:` + `webhook_id`, and skip inserts when `idempotency_key` already exists. |
| `revoke_tenant_api_key` return-shape mismatch (returns table row vs JSON) | Low | Low | Return the full snake_case row; the service-layer `mapApiKeyFromDB` handles both snake_case and camelCase fields. |
| `delete_tenant_webhook` return shape mismatch (void vs null data) | Low | Low | Return `{ data: null, error: null }` consistent with existing void-returning RPC handlers. |
| Handler placement causing duplicate `if` block collisions | Very Low | Low | Insert new handlers in an unused location in the dispatch chain; verify with audit script. |

No unresolved blockers. Engineering readiness is confirmed.

---

## Engineering Lead Readiness Statement

Engineering confirms that:

- All required program documents have been read and understood.
- The 10 authorized RPCs, their canonical signatures, and their service-layer call sites are identified.
- The target file `tests/mocks/supabase.ts` exists and uses the required dispatch pattern.
- Dependencies are satisfied and no technical blockers remain.
- The implementation approach is additive, bounded to the 10 authorized RPCs, and preserves existing architecture.
- Validation gates and acceptance criteria are understood and achievable.

**Engineering is ready to proceed to CURRENT_TASK-026 Engineering Implementation upon approval of this kickoff.**

---

## Deliverable

This document authorizes preparation only. The sole deliverable of this step is:

```text
CURRENT_TASK-026_ENGINEERING_KICKOFF.md
```

---

## Next Step

Upon acceptance of this Engineering Kickoff, the Engineering Lead may begin **CURRENT_TASK-026 Engineering Implementation** under the approved Architecture Decision and Program Authorization.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_025.md`, `CURRENT_TASK-026_PROGRAM_AUTHORIZATION.md`, `CURRENT_TASK-026_ARCHITECTURE_DECISION.md`, `services/apiKeyService.ts`, `services/webhookService.ts`, `tests/mocks/supabase.ts`, `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`.*
