# CURRENT_TASK-029 Program Authorization

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Document Type:** Program Authorization  
**Date:** 2026-07-16  
**Status:** **APPROVED**  
**Authorizing Role:** Program Manager  
**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-028_PROGRAM_STATUS_REVIEW.md`

---

## 1. Program State Confirmation

| Item | State |
|---|---|
| **Phase** | Phase 4 — ACTIVE |
| **Milestone** | M6 — Cross-Cutting Services: **IN PROGRESS** |
| **Previous Task** | CURRENT_TASK-028 — **CLOSED** |
| **Program Health** | HEALTHY |
| **Current Coverage** | **180 / 183 (~98.4%)** |
| **Remaining Uncovered RPCs** | **3** |

Verification:

- `CURRENT_TASK-028_PROGRAM_STATUS_REVIEW.md` records CURRENT_TASK-028 as **CLOSED**.
- `CURRENT_TASK-028_PROGRAM_STATUS_REVIEW.md` §9 records **PROGRAM STATUS: PASS**.
- `CURRENT_PHASE.md` §1 records Phase 4 as the active phase.
- Milestone M6 remains **IN PROGRESS** with 3 RPCs left to cover.

The program is eligible to open CURRENT_TASK-029.

---

## 2. Authorization Decision

| Item | Value |
|---|---|
| **CURRENT_TASK** | CURRENT_TASK-029 |
| **Authorized Wave** | **Wave 4e** |
| **Domain** | **G — Promotions** |
| **Target File** | `tests/mocks/supabase.ts` |
| **Change Type** | Additive mock coverage only |
| **Implementation** | **NOT AUTHORIZED** by this document |
| **Architecture Decision** | **NOT AUTHORIZED** by this document |

This document authorizes **one** CURRENT_TASK and **one** wave only. No other work is approved.

---

## 3. Authorized RPCs

The following **3 RPCs** are the complete and exclusive scope of Wave 4e:

| # | RPC Name | Canonical Source Location | Calling Code Location |
|---|---|---|---|
| 1 | `apply_voucher_to_invoice` | `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` line 176 | `services/promotionService.ts` line 314 |
| 2 | `get_promo_code_usage_counts` | `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql` line 150 | `services/promotionService.ts` line 271 |
| 3 | `validate_promo_code` | `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` line 78 | `services/promotionService.ts` line 348 |

These RPCs are the final cross-cutting service domain in Wave 4 after Domain F. They are confined to a single service file (`services/promotionService.ts`) and have no downstream dependencies on other remaining domains.

---

## 4. Canonical Source

All authorized RPCs derive from the canonical migration chain:

```text
supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql
supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql
```

Canonical signatures:

```sql
CREATE OR REPLACE FUNCTION public.apply_voucher_to_invoice(
  p_invoice_id UUID,
  p_code TEXT
) RETURNS JSONB
```

```sql
CREATE OR REPLACE FUNCTION public.get_promo_code_usage_counts(
  p_promo_code_id UUID
) RETURNS JSONB
```

```sql
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  p_code TEXT,
  p_tenant_id UUID,
  p_invoice_subtotal NUMERIC DEFAULT 0
) RETURNS JSONB
```

No RPC outside this list is authorized for CURRENT_TASK-029.

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

| Metric | Before CURRENT_TASK-029 | Target | After CURRENT_TASK-029 |
|---|---|---|---|
| Covered RPCs | 180 / 183 | **183 / 183** | **183 / 183** |
| Uncovered RPCs | 3 | **0** | **0** |
| Coverage | ~98.4% | **100.0%** | **100.0%** |
| Delta | — | **+3 RPCs, +~1.6 percentage points** | — |

Calculation basis: total code RPCs remain 183. Wave 4e adds the final 3 covered RPCs. Remaining uncovered RPCs after this wave: 0.

---

## 7. Validation Plan

The following gates must remain green for CURRENT_TASK-029 acceptance. They are the same gates used for CURRENT_TASK-028:

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

- `CURRENT_TASK-029_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-029_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-029_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-029_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-029_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-030` or any subsequent CURRENT_TASK
- Any implementation, code change, or test modification prior to approved Engineering Kickoff
- Any production code, business logic, database, migration, schema, or generated-type changes

---

## 9. Program Manager Sign-Off

| | |
|---|---|
| **Authorized by** | Program Manager |
| **Date** | 2026-07-16 |
| **Decision** | **APPROVE CURRENT_TASK-029 — Wave 4e: Domain G Promotions** |
| **Next Step** | Await Program Authorization approval before generating `CURRENT_TASK-029_ARCHITECTURE_DECISION.md` |

---

## 10. Conclusion

```text
AUTHORIZED
```

CURRENT_TASK-029 is authorized to proceed to Architecture Decision. Scope is locked to the 3 RPCs, 1 wave, and 1 domain listed above. This is the final coverage wave of Phase 4 Milestone M6.

---

*Approved scope is locked. Any deviation from the 3 authorized RPCs requires a new Program Authorization.*
