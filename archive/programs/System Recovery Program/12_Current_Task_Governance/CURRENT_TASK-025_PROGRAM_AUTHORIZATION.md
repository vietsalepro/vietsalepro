# CURRENT_TASK-025 Program Authorization

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Document Type:** Program Authorization  
**Date:** 2026-07-15  
**Status:** **APPROVED**  
**Authorizing Role:** Program Manager  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-024_ACCEPTANCE_REVIEW_V2.md`

---

## 1. Program State Confirmation

| Item | State |
|---|---|
| **Phase** | Phase 4 — ACTIVE |
| **Milestone** | M5 — Commerce Complete: **COMPLETE**; M6 — Cross-Cutting Services: **IN PROGRESS** |
| **Previous Task** | CURRENT_TASK-024 — **CLOSED** |
| **Program Health** | HEALTHY |
| **Current Coverage** | **152 / 183 (~83.1%)** |
| **Remaining Uncovered RPCs** | **31** |

---

## 2. Authorization Decision

| Item | Value |
|---|---|
| **CURRENT_TASK** | CURRENT_TASK-025 |
| **Authorized Wave** | **Wave 4a** |
| **Domain** | **D — Integrations & Partners** |
| **Target File** | `tests/mocks/supabase.ts` |
| **Change Type** | Additive mock coverage only |
| **Implementation** | **NOT AUTHORIZED** by this document |
| **Architecture Decision** | **NOT AUTHORIZED** by this document |

This document authorizes **one** CURRENT_TASK and **one** wave only. No other work is approved.

---

## 3. Authorized RPCs

The following **8 RPCs** are the complete and exclusive scope of Wave 4a:

| # | RPC Name | Canonical Source Location | Calling Code Location |
|---|---|---|---|
| 1 | `create_integration` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 4315 | `services/integrationService.ts` line 105 |
| 2 | `create_partner` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 4480 | `services/integrationService.ts` line 47 |
| 3 | `delete_integration` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 5555 | `services/integrationService.ts` line 145 |
| 4 | `delete_partner` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 5705 | `services/integrationService.ts` line 86 |
| 5 | `list_integrations` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 9940 | `services/integrationService.ts` line 91 |
| 6 | `list_partners` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 9972 | `services/integrationService.ts` line 34 |
| 7 | `update_integration` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 12667 | `services/integrationService.ts` line 130 |
| 8 | `update_partner` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 12766 | `services/integrationService.ts` line 71 |

These RPCs are the first cross-cutting service domain after the Core Commerce dependency tree is complete. They are confined to a single service file and have no downstream dependencies on other remaining domains.

---

## 4. Canonical Source

All authorized RPCs derive from the canonical migration chain:

```text
supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
```

Canonical signatures:

```sql
CREATE OR REPLACE FUNCTION "public"."create_integration"(
  "p_partner_id" "uuid",
  "p_name" "text",
  "p_slug" "text" DEFAULT NULL::"text",
  "p_description" "text" DEFAULT NULL::"text",
  "p_category" "text" DEFAULT NULL::"text",
  "p_status" "text" DEFAULT 'active'::"text",
  "p_documentation_url" "text" DEFAULT NULL::"text"
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."create_partner"(
  "p_name" "text",
  "p_slug" "text" DEFAULT NULL::"text",
  "p_description" "text" DEFAULT NULL::"text",
  "p_website" "text" DEFAULT NULL::"text",
  "p_contact_email" "text" DEFAULT NULL::"text",
  "p_logo_url" "text" DEFAULT NULL::"text"
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."delete_integration"(
  "p_integration_id" "uuid"
) RETURNS "void"
```

```sql
CREATE OR REPLACE FUNCTION "public"."delete_partner"(
  "p_partner_id" "uuid"
) RETURNS "void"
```

```sql
CREATE OR REPLACE FUNCTION "public"."list_integrations"() RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."list_partners"() RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."update_integration"(
  "p_integration_id" "uuid",
  "p_partner_id" "uuid" DEFAULT NULL::"uuid",
  "p_name" "text" DEFAULT NULL::"text",
  "p_slug" "text" DEFAULT NULL::"text",
  "p_description" "text" DEFAULT NULL::"text",
  "p_category" "text" DEFAULT NULL::"text",
  "p_status" "text" DEFAULT NULL::"text",
  "p_documentation_url" "text" DEFAULT NULL::"text"
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."update_partner"(
  "p_partner_id" "uuid",
  "p_name" "text" DEFAULT NULL::"text",
  "p_slug" "text" DEFAULT NULL::"text",
  "p_description" "text" DEFAULT NULL::"text",
  "p_website" "text" DEFAULT NULL::"text",
  "p_contact_email" "text" DEFAULT NULL::"text",
  "p_logo_url" "text" DEFAULT NULL::"text",
  "p_status" "text" DEFAULT NULL::"text"
) RETURNS json
```

No RPC outside this list is authorized for CURRENT_TASK-025.

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
| CURRENT_TASK boundary: 8 RPCs, 1 wave, 1 domain | Yes | Yes |
| No duplicate handler | Yes | Yes |
| No stale mock | Yes | Yes |
| No production code changes | Yes | Yes |
| No migration/schema/generated-type changes | Yes | Yes |
| No CI/workflow changes | Yes | Yes |

---

## 6. Coverage Impact

| Metric | Before CURRENT_TASK-025 | After CURRENT_TASK-025 |
|---|---|---|
| Covered RPCs | 152 / 183 | **160 / 183** |
| Uncovered RPCs | 31 | **23** |
| Coverage | ~83.1% | **~87.4%** |
| Delta | — | **+8 RPCs, +~4.3 percentage points** |

Calculation basis: total code RPCs remain 183. Wave 4a adds 8 covered RPCs. Remaining uncovered RPCs after this wave: 23.

---

## 7. Validation Plan

The following gates must remain green for CURRENT_TASK-025 acceptance. They are the same gates used for CURRENT_TASK-024:

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

- `CURRENT_TASK-025_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-025_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-025_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-025_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-025_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-026` or any subsequent CURRENT_TASK
- Any implementation, code change, or test modification prior to approved Engineering Kickoff

---

## 9. Program Manager Sign-Off

| | |
|---|---|
| **Authorized by** | Program Manager |
| **Date** | 2026-07-15 |
| **Decision** | **APPROVE CURRENT_TASK-025 — Wave 4a: Domain D Integrations & Partners** |
| **Next Step** | Await Program Authorization approval before generating `CURRENT_TASK-025_ARCHITECTURE_DECISION.md` |

---

*Approved scope is locked. Any deviation from the 8 authorized RPCs requires a new Program Authorization.*
