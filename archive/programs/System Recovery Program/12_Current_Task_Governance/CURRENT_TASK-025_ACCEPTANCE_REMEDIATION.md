# CURRENT_TASK-025 — Acceptance Remediation

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Wave:** 4a — Domain D: Integrations & Partners  
**Date:** 2026-07-15  
**Remediation Role:** Senior Software Engineer  

---

## 1. Review Trigger

`CURRENT_TASK-025_ACCEPTANCE_REVIEW.md` decision: **FAIL**.

The implementation diff added **10** RPC handlers to `tests/mocks/supabase.ts`, but the Program Authorization for Wave 4a only authorized **8**.

---

## 2. Root Cause

During implementation, two real RPC handlers that are invoked elsewhere in the codebase (`get_dashboard_summary`, `get_profit_report`) were added to the mock dispatcher along with their dependent in-memory store arrays (`order_items`, `customers`, `return_orders`, `return_order_items`). These RPCs and store arrays are outside the authorized Wave 4a scope (Domain D: Integrations & Partners) and were not listed in `CURRENT_TASK-025_PROGRAM_AUTHORIZATION.md` or `CURRENT_TASK-025_ARCHITECTURE_DECISION.md`.

The unauthorized additions passed the validation gates because the gates do not enforce the CURRENT_TASK boundary; they only check contract sync, TypeScript correctness, and regression. Acceptance Review detected the scope violation.

---

## 3. Files Changed

| File | Change |
|---|---|
| `tests/mocks/supabase.ts` | Removed unauthorized RPC handlers and unauthorized in-memory store arrays. No other modifications. |

---

## 4. Removed Unauthorized Handlers

The following `if (name === "...")` dispatch handlers were removed in their entirety, including their canonical comments:

- `get_dashboard_summary`
- `get_profit_report`

---

## 5. Removed Unauthorized Store Arrays

The following in-memory `store` arrays were removed from the `store` object:

- `order_items`
- `customers`
- `return_orders`
- `return_order_items`

---

## 6. Authorized Scope Preserved

The following authorized handlers remain unchanged:

- `create_partner`
- `update_partner`
- `delete_partner`
- `list_partners`
- `create_integration`
- `update_integration`
- `delete_integration`
- `list_integrations`

The following authorized in-memory store arrays remain unchanged:

- `partners`
- `integrations`

The existing `if (name === "...")` dispatch pattern is preserved. No logic changes, refactor, redesign, or abstraction were introduced.

---

## 7. Validation Results

### 7.1 Canonical Audit Gate

Command:

```text
npx tsx scripts/audit-rpc-contracts.ts
```

Output:

```text
Contract RPCs : 125
Code RPCs     : 125

RPC contracts and service code are in sync.
```

Result: **PASS** (exit 0)

### 7.2 Type Gate

Command:

```text
npx tsc --noEmit
```

Result: **PASS** (exit 0, no errors)

### 7.3 Test Gate

Command:

```text
npx vitest run
```

Output:

```text
Test Files  68 passed (68)
Tests       389 passed (389)
```

Result: **PASS** (exit 0, no regression)

---

## 8. Final Remediation Decision

**PASS**

The unauthorized RPC handlers and store arrays have been completely removed from `tests/mocks/supabase.ts`. The authorized 8 RPC handlers and 2 store arrays are preserved without modification. All validation gates pass with no regression.

---

*Remediation complete. Awaiting Independent Acceptance Review (v2).*
