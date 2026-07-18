# CURRENT_TASK-024 Program Authorization

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M5 — Commerce Complete  
**Document Type:** Program Authorization  
**Date:** 2026-07-15  
**Status:** **APPROVED**  
**Authorizing Role:** Program Manager  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_023.md`

---

## 1. Authorization Decision

| Item | Value |
|---|---|
| **CURRENT_TASK** | CURRENT_TASK-024 |
| **Authorized Wave** | **Wave 3i** |
| **Domain** | **H9 — Reports & Dashboard** (Core Commerce sub-domain) |
| **Target File** | `tests/mocks/supabase.ts` |
| **Change Type** | Additive mock coverage only |
| **Implementation** | **NOT AUTHORIZED** by this document |
| **Architecture Decision** | **NOT AUTHORIZED** by this document |

This document authorizes **one** CURRENT_TASK and **one** wave only. No other work is approved.

---

## 2. Authorized RPCs

The following **2 RPCs** are the complete and exclusive scope of Wave 3i:

| # | RPC Name | Canonical Source Location | Calling Code Location |
|---|---|---|---|
| 1 | `get_dashboard_summary` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 7090 | `services/supabaseService.ts` line 777 |
| 2 | `get_profit_report` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 8151 | `services/supabaseService.ts` line 3827 |

These RPCs are the only remaining Core Commerce sub-domain mocks. They are cross-cutting aggregate reports that depend on the commerce sub-domains already mocked in Waves 3a–3h.

---

## 3. Canonical Source

All authorized RPCs derive from the canonical migration chain:

```text
supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
```

Canonical signatures:

```sql
CREATE OR REPLACE FUNCTION "public"."get_dashboard_summary"(
  "p_from" "date" DEFAULT NULL::"date",
  "p_to" "date" DEFAULT NULL::"date"
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."get_profit_report"(
  "p_start_date" "date",
  "p_end_date" "date",
  "p_status" "text" DEFAULT 'all'::"text",
  "p_payment_method" "text" DEFAULT ''::"text",
  "p_product_keyword" "text" DEFAULT ''::"text",
  "p_customer_keyword" "text" DEFAULT ''::"text",
  "p_compare_mode" "text" DEFAULT 'prev'::"text"
) RETURNS json
```

No RPC outside this list is authorized for CURRENT_TASK-024.

---

## 4. Constraints

The following constraints from Phase 4 and the Coverage Roadmap are confirmed for this authorization:

| Constraint | Required | Authorized |
|---|---|---|
| Additive only | Yes | Yes |
| No refactor | Yes | Yes |
| No redesign | Yes | Yes |
| No abstraction | Yes | Yes |
| Preserve `if (name === "...")` dispatch pattern | Yes | Yes |
| Preserve existing handler conventions | Yes | Yes |
| CURRENT_TASK boundary: 2 RPCs, 1 wave, 1 domain | Yes | Yes |
| No duplicate handler | Yes | Yes |
| No stale mock | Yes | Yes |
| No production code changes | Yes | Yes |
| No migration/schema/generated-type changes | Yes | Yes |
| No CI/workflow changes | Yes | Yes |

---

## 5. Coverage Impact

| Metric | Before CURRENT_TASK-024 | After CURRENT_TASK-024 |
|---|---|---|
| Covered RPCs | 150 / 183 | **152 / 183** |
| Uncovered RPCs | 33 | **31** |
| Coverage | ~82.0% | **~83.1%** |
| Delta | — | **+2 RPCs, +~1.1 percentage points** |

Calculation basis: total code RPCs remain 183. Wave 3i adds 2 covered RPCs (`get_dashboard_summary`, `get_profit_report`). Remaining uncovered RPCs after this wave: 31.

---

## 6. Validation Plan

The following gates must remain green for CURRENT_TASK-024 acceptance. They are the same gates used for CURRENT_TASK-023:

### 6.1 Canonical Audit Gate

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

### 6.2 Type Gate

```text
npx tsc --noEmit
```

Expected:

```text
PASS
```

### 6.3 Test Gate

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

## 7. Exclusions

This authorization explicitly does **NOT** authorize:

- `CURRENT_TASK-024_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-024_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-024_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-024_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-024_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-025` or any subsequent CURRENT_TASK
- Any implementation, code change, or test modification prior to approved Engineering Kickoff

---

## 8. Program Manager Sign-Off

| | |
|---|---|
| **Authorized by** | Program Manager |
| **Date** | 2026-07-15 |
| **Decision** | **APPROVE CURRENT_TASK-024 — Wave 3i: Domain H9 Reports & Dashboard** |
| **Next Step** | Await Program Authorization approval before generating `CURRENT_TASK-024_ARCHITECTURE_DECISION.md` |

---

*Approved scope is locked. Any deviation from the 2 authorized RPCs requires a new Program Authorization.*
