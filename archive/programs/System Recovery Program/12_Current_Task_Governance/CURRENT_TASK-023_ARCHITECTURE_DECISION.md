# CURRENT_TASK-023_ARCHITECTURE_DECISION.md

**Program:** VietSalePro v7 — System Recovery Program
**Phase:** Phase 4 — Derived Validation Layer Realignment
**CURRENT_TASK:** 023
**Document Type:** Architecture Decision
**Status:** APPROVED (Architecture)
**Date:** 2026-07-15

---

# 1. Purpose

Define the architecture boundary and implementation strategy for CURRENT_TASK-023 before any engineering work begins.

This document authorizes only the architectural approach. It does **not** authorize implementation.

---

# 2. Program Context

| Attribute      | Value                                          |
| -------------- | ---------------------------------------------- |
| Phase          | Phase 4 — Derived Validation Layer Realignment |
| Milestone      | M4 — Commerce Transactions                     |
| Domain         | H8 — Disposals                                 |
| Wave           | 3h                                             |
| Previous Task  | CURRENT_TASK-022 (Closed)                      |
| Current Status | AUTHORIZED                                     |

---

# 3. Authorized RPC Scope

The implementation scope is limited to the following RPCs:

1. `delete_disposal_with_restore`
2. `filter_disposals_rpc`
3. `get_disposal_auto_code`

No additional RPCs are authorized.

---

# 4. Canonical Source

All mock behavior, parameters, and return shapes shall be derived exclusively from:

```text
supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
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

* Add mock handlers for the three authorized RPCs.
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
* Work outside CURRENT_TASK-023

---

# 7. Implementation Strategy

Engineering shall follow these architectural constraints:

```text
additive only

no refactor

no redesign

no abstraction

preserve

if(name==="...")

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
147 / 183

80.3%
```

Target Coverage

```text
150 / 183

~82.0%
```

Expected Delta

```text
+3 RPC
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
PASS
```

---

# 10. Risks

Known phase-level residuals remain unchanged:

* EC-3 not yet satisfied.
* EC-4 not yet satisfied.

These are tracked at Phase 4 level and do not block CURRENT_TASK-023.

---

# 11. Architecture Decision

Architecture review concludes that:

* Domain H8 (Disposals) is correctly scoped for Wave 3h.
* The authorized RPC set is complete.
* The implementation target is correct.
* The additive-only strategy preserves architectural integrity.
* The proposed work remains fully within the Phase 4 validation-layer boundary.

**Decision:** APPROVED

Engineering may begin only after this Architecture Decision has been formally accepted through the program governance sequence.

---

# 12. Stop Condition

This document completes the Architecture Decision stage for CURRENT_TASK-023.

No Engineering Kickoff, Engineering Implementation, Acceptance Review, Program Status Review, or CURRENT_TASK-024 activities are authorized by this document.
