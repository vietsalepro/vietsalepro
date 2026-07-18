# CURRENT_TASK-026 Implementation Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Domain:** E — Webhooks & API Keys  
**Wave:** 4b  
**Document Type:** Engineering Implementation Report  
**Date:** 2026-07-15  
**Status:** COMPLETE  

---

## 1. Objective

Add mock coverage in `tests/mocks/supabase.ts` for the **10** authorized Domain E RPCs (Webhooks & API Keys), deriving all parameter names, return shapes, and behavior from the canonical migration chain. The task raises the derived-validation-layer coverage from **~87.4%** to **~92.9%**.

---

## 2. Scope

### In Scope

- Extend the in-memory `store` with `tenant_api_keys`, `tenant_webhooks`, and `webhook_deliveries` arrays.
- Add exactly **10** `if (name === "...")` RPC handlers in `tests/mocks/supabase.ts`.
- Preserve the existing `if (name === "...")` dispatch pattern.
- Apply canonical `isSystemAdmin` guards, `42501` privilege errors, `PGRST116` not-found errors, and `COALESCE` update semantics.

### Out of Scope

- Production code changes (`services/`, `lib/`, `utils/`, UI).
- Migration, schema, generated-type, CI, or audit script changes.
- Any additional RPC beyond the 10 authorized in `CURRENT_TASK-026_PROGRAM_AUTHORIZATION.md`.
- Acceptance review artifacts or subsequent CURRENT_TASKs.

---

## 3. Files Changed

| File | Change Type |
|---|---|
| `tests/mocks/supabase.ts` | Additive only: store arrays + 10 RPC handlers |

---

## 4. Store Additions

Added three empty arrays to the in-memory `store` object:

```text
tenant_api_keys: []
tenant_webhooks: []
webhook_deliveries: []
```

Rows are stored using snake_case column names matching the canonical table definitions in `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`.

---

## 5. RPCs Implemented

| # | RPC Name | Canonical Source | Calling Code | Behavior Summary |
|---|---|---|---|---|
| 1 | `create_tenant_api_key` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 5153 | `services/apiKeyService.ts` line 31 | Requires system admin; validates tenant and non-empty name; generates a 64-char hex token, stores SHA-256-like hash and last-4 preview, returns canonical camelCase JSON. |
| 2 | `create_tenant_webhook` | line 5204 | `services/webhookService.ts` line 57 | Requires system admin; validates tenant, name, URL scheme; stores row with `events = COALESCE(p_events, ['*'])`; returns canonical camelCase JSON. |
| 3 | `delete_tenant_webhook` | line 5775 | `services/webhookService.ts` line 91 | Requires system admin; deletes by `p_webhook_id`; returns `PGRST116` if missing. |
| 4 | `list_tenant_api_keys` | line 10002 | `services/apiKeyService.ts` line 21 | Requires system admin; returns tenant-scoped rows sorted `created_at DESC` in canonical camelCase. |
| 5 | `list_tenant_webhooks` | line 10034 | `services/webhookService.ts` line 45 | Requires system admin; returns tenant-scoped rows sorted `created_at DESC` in canonical camelCase. |
| 6 | `list_webhook_deliveries` | line 10063 | `services/webhookService.ts` line 99 | Requires system admin; filters by `p_webhook_id`, paginates, returns `{ data, count }` in canonical camelCase. |
| 7 | `retry_webhook_delivery` | line 11540 | `services/webhookService.ts` line 126 | Requires system admin; finds delivery with status in `('failed','exhausted')`, resets to `pending`, returns canonical JSON. |
| 8 | `revoke_tenant_api_key` | line 11571 | `services/apiKeyService.ts` line 41 | Requires system admin; updates status to `revoked`, sets `revoked_at`/`revoked_by`, returns updated snake_case row. |
| 9 | `trigger_webhook_event` | line 12512 | `services/webhookService.ts` line 116 | Requires system admin; matches active webhooks by event or `'*'`; creates delivery rows with composite idempotency keys; returns `{ enqueued, deliveries }`. |
| 10 | `update_tenant_webhook` | line 13102 | `services/webhookService.ts` line 78 | Requires system admin; applies `COALESCE` semantics for non-null params; returns canonical camelCase JSON. |

---

## 6. Validation Results

### 6.1 Canonical Audit Gate

```text
npx tsx scripts/audit-rpc-contracts.ts
```

Result:

```text
Contract RPCs : 125
Code RPCs     : 125

RPC contracts and service code are in sync.

Exit code: 0
```

- **125 / 125 RPC contracts in sync**
- **0 duplicate handler**
- **0 stale mock**

### 6.2 Type Gate

```text
npx tsc --noEmit
```

Result:

```text
Exit code: 0
PASS
```

### 6.3 Test Gate

```text
npx vitest run
```

Result:

```text
Test Files  68 passed (68)
     Tests  389 passed (389)
   Start at  17:40:44
   Duration  38.14s

Exit code: 0
```

---

## 7. Coverage

| Metric | Before | After | Delta |
|---|---|---|---|
| Covered RPCs | 160 / 183 | **170 / 183** | +10 |
| Uncovered RPCs | 23 | **13** | -10 |
| Coverage | ~87.4% | **~92.9%** | +~5.5 pp |

---

## 8. Regression Check

- No existing tests added, removed, or modified.
- No changes to production service code.
- All existing tests continue to pass: **389 / 389**.
- Audit gate remains green: **125 / 125** contracts in sync.
- Type check passes with no errors.

---

## 9. Constraints Compliance

| Constraint | Compliant | Evidence |
|---|---|---|
| Additive only | Yes | Only added store arrays and handlers; no deletions. |
| Preserve existing architecture | Yes | Kept `if (name === "...")` dispatch; no dispatcher/switch/map/factory. |
| No refactor | Yes | No restructuring of existing handlers. |
| No redesign | Yes | No behavioral changes to existing RPCs. |
| No abstraction | Yes | No new helpers, utilities, or generic wrappers. |
| CURRENT_TASK boundary (10 RPCs) | Yes | Exactly the 10 authorized RPCs implemented. |
| No duplicate handler | Yes | Audit reports 0 duplicates. |
| No stale mock | Yes | Audit reports 0 stale mocks. |
| No production code changes | Yes | Only `tests/mocks/supabase.ts` modified. |
| `isSystemAdmin` guard + `42501` | Yes | Applied to all 10 handlers. |
| `PGRST116` not found | Yes | Applied to delete, revoke, retry, update, and tenant existence checks. |
| `COALESCE` semantics for update | Yes | `update_tenant_webhook` only overwrites non-null params. |
| Canonical return shapes | Yes | Derived from `20250703000000_baseline_pre_tenant_schema.sql` lines 5153–13102. |

---

## 10. Traceability to Canonical Migration

All parameter names, table column names, default values, and JSON output keys were derived from:

```text
supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
```

Key canonical references:

- Table definitions: lines 132–147 (`tenant_api_keys`), 1101–1113 (`tenant_webhooks`), 1152–1172 (`webhook_deliveries`).
- `create_tenant_api_key`: lines 5153–5202.
- `create_tenant_webhook`: lines 5204–5255.
- `delete_tenant_webhook`: lines 5775–5789.
- `list_tenant_api_keys`: lines 10002–10031.
- `list_tenant_webhooks`: lines 10034–10061.
- `list_webhook_deliveries`: lines 10063–10102.
- `retry_webhook_delivery`: lines 11540–11569.
- `revoke_tenant_api_key`: lines 11571–11595.
- `trigger_webhook_event`: lines 12512–12573.
- `update_tenant_webhook`: lines 13102–13137.

No markdown document or derived artifact was used as a source of truth.

---

## 11. Final Engineering Decision

**PASS**

All authorized RPC handlers have been implemented in `tests/mocks/supabase.ts` using the canonical migration chain as the sole source of truth. The audit gate, type gate, and full test suite all pass with no regressions. Coverage increased by 10 RPCs to **170 / 183 (~92.9%)**.

---

*Engineering implementation complete. Awaiting Independent Acceptance Review before any further tasks.*
