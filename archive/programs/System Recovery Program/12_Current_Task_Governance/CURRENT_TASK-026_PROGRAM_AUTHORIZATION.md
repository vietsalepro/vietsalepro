# CURRENT_TASK-026 Program Authorization

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Document Type:** Program Authorization  
**Date:** 2026-07-15  
**Status:** **APPROVED**  
**Authorizing Role:** Program Manager  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_025.md`

---

## 1. Program State Confirmation

| Item | State |
|---|---|
| **Phase** | Phase 4 — ACTIVE |
| **Milestone** | M6 — Cross-Cutting Services: **IN PROGRESS** |
| **Previous Task** | CURRENT_TASK-025 — **CLOSED** |
| **Program Health** | HEALTHY |
| **Current Coverage** | **160 / 183 (~87.4%)** |
| **Remaining Uncovered RPCs** | **23** |

---

## 2. Authorization Decision

| Item | Value |
|---|---|
| **CURRENT_TASK** | CURRENT_TASK-026 |
| **Authorized Wave** | **Wave 4b** |
| **Domain** | **E — Webhooks & API Keys** |
| **Target File** | `tests/mocks/supabase.ts` |
| **Change Type** | Additive mock coverage only |
| **Implementation** | **NOT AUTHORIZED** by this document |
| **Architecture Decision** | **NOT AUTHORIZED** by this document |

This document authorizes **one** CURRENT_TASK and **one** wave only. No other work is approved.

---

## 3. Authorized RPCs

The following **10 RPCs** are the complete and exclusive scope of Wave 4b:

| # | RPC Name | Canonical Source Location | Calling Code Location |
|---|---|---|---|
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

These RPCs are the next cross-cutting service domain in Wave 4 after Domain D. They are confined to two service files (`services/webhookService.ts` and `services/apiKeyService.ts`) and have no downstream dependencies on other remaining domains.

---

## 4. Canonical Source

All authorized RPCs derive from the canonical migration chain:

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

No RPC outside this list is authorized for CURRENT_TASK-026.

---

## 5. Constraints

The following constraints from Phase 4 and the Coverage Roadmap are confirmed for this authorization:

| Constraint | Required | Authorized |
|---|---|---|
| Additive only | Yes | Yes |
| No refactor | Yes | Yes |
| No redesign | Yes | Yes |
| No abstraction | Yes | Yes |
| Preserve `if (name === "...")` dispatch pattern | Yes | Yes |
| Preserve existing handler conventions | Yes | Yes |
| CURRENT_TASK boundary: 10 RPCs, 1 wave, 1 domain | Yes | Yes |
| No duplicate handler | Yes | Yes |
| No stale mock | Yes | Yes |
| No production code changes | Yes | Yes |
| No migration/schema/generated-type changes | Yes | Yes |
| No CI/workflow changes | Yes | Yes |

---

## 6. Coverage Impact

| Metric | Before CURRENT_TASK-026 | After CURRENT_TASK-026 |
|---|---|---|
| Covered RPCs | 160 / 183 | **170 / 183** |
| Uncovered RPCs | 23 | **13** |
| Coverage | ~87.4% | **~92.9%** |
| Delta | — | **+10 RPCs, +~5.5 percentage points** |

Calculation basis: total code RPCs remain 183. Wave 4b adds 10 covered RPCs. Remaining uncovered RPCs after this wave: 13.

---

## 7. Validation Plan

The following gates must remain green for CURRENT_TASK-026 acceptance. They are the same gates used for CURRENT_TASK-025:

### 7.1 Canonical Audit Gate

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

### 7.2 Type Gate

```text
npx tsc --noEmit
```

Expected:

```text
PASS
```

### 7.3 Test Gate

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

## 8. Exclusions

This authorization explicitly does **NOT** authorize:

- `CURRENT_TASK-026_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-026_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-026_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-026_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-026_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-027` or any subsequent CURRENT_TASK
- Any implementation, code change, or test modification prior to approved Engineering Kickoff

---

## 9. Program Manager Sign-Off

| | |
|---|---|
| **Authorized by** | Program Manager |
| **Date** | 2026-07-15 |
| **Decision** | **APPROVE CURRENT_TASK-026 — Wave 4b: Domain E Webhooks & API Keys** |
| **Next Step** | Await Program Authorization approval before generating `CURRENT_TASK-026_ARCHITECTURE_DECISION.md` |

---

*Approved scope is locked. Any deviation from the 10 authorized RPCs requires a new Program Authorization.*
