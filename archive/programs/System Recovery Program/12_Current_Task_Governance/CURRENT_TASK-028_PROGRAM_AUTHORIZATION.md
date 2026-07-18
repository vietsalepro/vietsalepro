# CURRENT_TASK-028 Program Authorization

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Document Type:** Program Authorization  
**Date:** 2026-07-16  
**Status:** **APPROVED**  
**Authorizing Role:** Program Manager  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-027_PROGRAM_STATUS_REVIEW.md`

---

## 1. Program State Confirmation

| Item | State |
|---|---|
| **Phase** | Phase 4 — ACTIVE |
| **Milestone** | M6 — Cross-Cutting Services: **IN PROGRESS** |
| **Previous Task** | CURRENT_TASK-027 — **CLOSED** |
| **Program Health** | HEALTHY |
| **Current Coverage** | **177 / 183 (~96.7%)** |
| **Remaining Uncovered RPCs** | **6** |

Verification:

- `CURRENT_TASK-027_PROGRAM_STATUS_REVIEW.md` records CURRENT_TASK-027 as **CLOSED**.
- `CURRENT_TASK-027_PROGRAM_STATUS_REVIEW.md` §9 records **PROGRAM STATUS: PASS**.
- `CURRENT_PHASE.md` §1 records Phase 4 as the active phase.
- Milestone M6 remains **IN PROGRESS** with 6 RPCs left to cover.

The program is eligible to open CURRENT_TASK-028.

---

## 2. Authorization Decision

| Item | Value |
|---|---|
| **CURRENT_TASK** | CURRENT_TASK-028 |
| **Authorized Wave** | **Wave 4d** |
| **Domain** | **F — Notifications** |
| **Target File** | `tests/mocks/supabase.ts` |
| **Change Type** | Additive mock coverage only |
| **Implementation** | **NOT AUTHORIZED** by this document |
| **Architecture Decision** | **NOT AUTHORIZED** by this document |

This document authorizes **one** CURRENT_TASK and **one** wave only. No other work is approved.

---

## 3. Authorized RPCs

The following **3 RPCs** are the complete and exclusive scope of Wave 4d:

| # | RPC Name | Canonical Source Location | Calling Code Location |
|---|---|---|---|
| 1 | `send_in_app_message` | `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql` line 111 | `services/notificationService.ts` line 64 |
| 2 | `get_in_app_messages_for_tenant` | `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql` line 159 | `services/notificationService.ts` line 80 |
| 3 | `mark_in_app_message_read` | `supabase/migrations/20250708000000_phase_p12_3_notification_log.sql` line 222 | `services/notificationService.ts` line 90 |

These RPCs are the next cross-cutting service domain in Wave 4 after Domain C. They are confined to a single service file (`services/notificationService.ts`) and have no downstream dependencies on other remaining domains.

---

## 4. Canonical Source

All authorized RPCs derive from the canonical migration chain:

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

No RPC outside this list is authorized for CURRENT_TASK-028.

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
| CURRENT_TASK boundary: 3 RPCs, 1 wave, 1 domain | Yes | Yes |
| No duplicate handler | Yes | Yes |
| No stale mock | Yes | Yes |
| No production code changes | Yes | Yes |
| No migration/schema/generated-type changes | Yes | Yes |
| No CI/workflow changes | Yes | Yes |

---

## 6. Coverage Impact

| Metric | Before CURRENT_TASK-028 | After CURRENT_TASK-028 |
|---|---|---|
| Covered RPCs | 177 / 183 | **180 / 183** |
| Uncovered RPCs | 6 | **3** |
| Coverage | ~96.7% | **~98.4%** |
| Delta | — | **+3 RPCs, +~1.7 percentage points** |

Calculation basis: total code RPCs remain 183. Wave 4d adds 3 covered RPCs. Remaining uncovered RPCs after this wave: 3.

Remaining coverage work after CURRENT_TASK-028:

| Wave | Domain | RPCs | Cumulative Coverage |
|---|---|---|---|
| Wave 4e | G — Promotions | 3 | 183 / 183 (100.0%) |

---

## 7. Validation Plan

The following gates must remain green for CURRENT_TASK-028 acceptance. They are the same gates used for CURRENT_TASK-027:

### 7.1 Canonical Audit Gate

```text
npx tsx scripts/audit-rpc-contracts.ts
```

Expected:

```text
Exit 0

RPC contracts and service code are in sync.
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
PASS
```

No regression is permitted. Test file count and passing test count must not decrease.

---

## 8. Exclusions

This authorization explicitly does **NOT** authorize:

- `CURRENT_TASK-028_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-028_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-028_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-028_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-028_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-029` or any subsequent CURRENT_TASK
- Any implementation, code change, or test modification prior to approved Engineering Kickoff
- Any production code, business logic, database, migration, schema, or generated-type changes

---

## 9. Program Manager Sign-Off

| | |
|---|---|
| **Authorized by** | Program Manager |
| **Date** | 2026-07-16 |
| **Decision** | **APPROVE CURRENT_TASK-028 — Wave 4d: Domain F Notifications** |
| **Next Step** | Await Program Authorization approval before generating `CURRENT_TASK-028_ARCHITECTURE_DECISION.md` |

---

## 10. Conclusion

```text
AUTHORIZED
```

CURRENT_TASK-028 is authorized to proceed to Architecture Decision. Scope is locked to the 3 RPCs, 1 wave, and 1 domain listed above.

---

*Approved scope is locked. Any deviation from the 3 authorized RPCs requires a new Program Authorization.*
