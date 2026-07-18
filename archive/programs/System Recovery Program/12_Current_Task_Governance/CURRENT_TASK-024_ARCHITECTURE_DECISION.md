# CURRENT_TASK-024_ARCHITECTURE_DECISION.md

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**CURRENT_TASK:** 024  
**Document Type:** Architecture Decision  
**Status:** APPROVED (Architecture)  
**Date:** 2026-07-15  

---

# 1. Purpose

Define the architecture boundary and implementation strategy for CURRENT_TASK-024 before any engineering work begins.

This document authorizes only the architectural approach. It does **not** authorize implementation.

---

# 2. Program Context

| Attribute      | Value                                          |
| -------------- | ---------------------------------------------- |
| Phase          | Phase 4 — Derived Validation Layer Realignment |
| Milestone      | M5 — Commerce Complete                         |
| Domain         | H9 — Reports & Dashboard                       |
| Wave           | 3i                                             |
| Previous Task  | CURRENT_TASK-023 (Closed)                      |
| Current Status | AUTHORIZED                                     |

---

# 3. Authorized RPC Scope

The implementation scope is limited to the following **2 RPCs**:

| # | RPC Name | Canonical Source Location | Calling Code Location |
| --- | --- | --- | --- |
| 1 | `get_dashboard_summary` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 7090 | `services/supabaseService.ts` line 777 |
| 2 | `get_profit_report` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 8151 | `services/supabaseService.ts` line 3827 |

No additional RPCs are authorized.

---

# 4. Canonical Source

All mock behavior, parameters, and return shapes shall be derived exclusively from:

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

No markdown document, test assumption, or derived artifact may supersede the canonical migration chain.

---

# 5. Target

Authorized implementation target:

```text
tests/mocks/supabase.ts
```

No other production or governance files are within scope.

---

# 6. Architecture Boundary

Permitted:

* Add mock handlers for the two authorized RPCs.
* Derive handler behavior from the canonical migration chain.
* Preserve the existing mock architecture.

Prohibited:

* Business Logic changes
* Production code changes
* Database changes
* Schema changes
* Migration changes
* Generated type changes
* Audit changes
* CI changes
* Refactoring
* Redesign
* Abstraction
* Work outside CURRENT_TASK-024

---

# 7. Implementation Strategy

Engineering shall follow these architectural constraints:

```text
additive only

no refactor

no redesign

no abstraction

preserve

if(name==="")

dispatch

CURRENT_TASK boundary

no duplicate

no stale
```

The existing dispatch pattern in `tests/mocks/supabase.ts` must remain unchanged.

---

# 8. Coverage Objective

Current Coverage

```text
150 / 183

~82.0%
```

Target Coverage

```text
152 / 183

~83.1%
```

Expected Delta

```text
+2 RPC
```

---

# 9. Validation Plan

The completed engineering work shall satisfy all of the following validation gates:

### Audit

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

---

### Type Check

```text
npx tsc --noEmit
```

Expected:

```text
PASS
```

---

### Test Suite

```text
npx vitest run
```

Expected:

```text
68 files

389 tests

PASS
```

---

# 10. Risks

Known phase-level residuals remain unchanged:

* EC-3 not yet satisfied.
* EC-4 not yet satisfied.

These are tracked at Phase 4 level and do not block CURRENT_TASK-024.

---

# 11. Architecture Decision

Architecture review concludes that:

* Domain H9 (Reports & Dashboard) is correctly scoped for Wave 3i.
* The authorized RPC set is complete and limited to `get_dashboard_summary` and `get_profit_report`.
* The implementation target is correct.
* The additive-only strategy preserves architectural integrity.
* The proposed work remains fully within the Phase 4 validation-layer boundary.

**Decision:** APPROVED

Engineering may begin only after this Architecture Decision has been formally accepted through the program governance sequence.

---

# 12. Stop Condition

This document completes the Architecture Decision stage for CURRENT_TASK-024.

No Engineering Kickoff, Engineering Implementation, Acceptance Review, Program Status Review, or CURRENT_TASK-025 activities are authorized by this document.
