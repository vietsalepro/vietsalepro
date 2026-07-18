# CURRENT_TASK-025 — Independent Acceptance Review

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Wave:** 4a — Domain D: Integrations & Partners  
**Reviewer Role:** Independent Acceptance Reviewer  
**Date:** 2026-07-15  
**Decision:** **FAIL**

---

## 1. Review Context

This review independently evaluates the engineering output for `CURRENT_TASK-025` against the authorized scope defined in:

- `CURRENT_TASK-025_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-025_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-025_ENGINEERING_KICKOFF.md`

The authorized scope is strictly limited to adding mock coverage for **8 RPCs** in `tests/mocks/supabase.ts`:

```text
create_integration
create_partner
delete_integration
delete_partner
list_integrations
list_partners
update_integration
update_partner
```

No implementation, remediation, or scope expansion is performed by this review.

---

## 2. Scope Verification

### 2.1 Files Changed

| File | Status |
|---|---|
| `tests/mocks/supabase.ts` | Modified (only file with code changes) |

`git diff --stat` confirms only `tests/mocks/supabase.ts` has been modified:

```text
tests/mocks/supabase.ts | 466 ++++++++++++++++++++++++++++++++++++++++++++++++
1 file changed, 466 insertions(+)
```

### 2.2 Handler Count

The working-tree diff adds **10** new `if (name === "...")` handlers, not the authorized **8**.

| Handler | Authorized? | Line in `tests/mocks/supabase.ts` |
|---|---|---|
| `list_partners` | Yes | 1665 |
| `create_partner` | Yes | 1688 |
| `update_partner` | Yes | 1728 |
| `delete_partner` | Yes | 1760 |
| `list_integrations` | Yes | 1771 |
| `create_integration` | Yes | 1798 |
| `update_integration` | Yes | 1841 |
| `delete_integration` | Yes | 1873 |
| `get_dashboard_summary` | **No** | 2295 |
| `get_profit_report` | **No** | 2390 |

**Finding:** Two unauthorized RPC handlers (`get_dashboard_summary`, `get_profit_report`) are present in the diff.

### 2.3 Existing Handlers

No existing handlers were removed or modified. No duplicate handlers were found for any of the authorized 8 RPCs (one occurrence each). The `if (name === "...")` dispatch pattern is preserved.

### 2.4 Store Additions

The in-memory `store` was extended with the following arrays:

| Store Array | Authorized? |
|---|---|
| `partners` | Yes |
| `integrations` | Yes |
| `order_items` | **No** |
| `customers` | **No** |
| `return_orders` | **No** |
| `return_order_items` | **No** |

The four unauthorized store arrays are used only by the two unauthorized handlers (`get_dashboard_summary`, `get_profit_report`) and are outside the `CURRENT_TASK-025` scope.

---

## 3. Canonical Compliance (Authorized 8 RPCs)

Each authorized handler was compared against `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` at the cited canonical line numbers.

| RPC | System Admin Guard | Parameter Contract | Return Shape | COALESCE Semantics | PGRST116 / Not Found | Verdict |
|---|---|---|---|---|---|---|
| `create_integration` | `42501` | Matches canonical (line 4315) | camelCase `json_build_object` | `NULLIF` for optional text, default `active` | N/A | Pass |
| `create_partner` | `42501` | Matches canonical (line 4480) | camelCase `json_build_object` | `NULLIF` for optional text, default `active` | N/A | Pass |
| `delete_integration` | `42501` | `p_integration_id` only | `void` (mock returns generic `{id, deleted}` shape) | N/A | `PGRST116` / `Not found` | Pass |
| `delete_partner` | `42501` | `p_partner_id` only | `void` (mock returns generic `{id, deleted}` shape) | N/A | `PGRST116` / `Not found` | Pass |
| `list_integrations` | `42501` | No params | camelCase array with `partnerName` from `LEFT JOIN` semantics | N/A | N/A | Pass |
| `list_partners` | `42501` | No params | camelCase array ordered `created_at DESC` | N/A | N/A | Pass |
| `update_integration` | `42501` | Matches canonical (line 12667) | camelCase `json_build_object` | `COALESCE` / `NULLIF` semantics applied | `PGRST116` / `Not found` | Pass |
| `update_partner` | `42501` | Matches canonical (line 12766) | camelCase `json_build_object` | `COALESCE` / `NULLIF` semantics applied | `PGRST116` / `Not found` | Pass |

The 8 authorized handlers are technically compliant with the canonical migration contract.

---

## 4. Validation Gates

The following gates were executed independently against the working tree.

### 4.1 Canonical Audit Gate

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

Exit code: `0`  
Result: **PASS** (for the 125 contract RPCs the script covers)

Note: The operational audit script compares `docs/admin-dashboard/RPC_CONTRACTS.md` against `services/` / `lib/` code, not against the canonical migration chain, and does not emit duplicate-handler or stale-mock metrics.

### 4.2 Type Gate

Command:

```text
npx tsc --noEmit
```

Exit code: `0`  
Result: **PASS**

### 4.3 Test Gate

Command:

```text
npx vitest run
```

Output:

```text
Test Files  68 passed (68)
Tests       389 passed (389)
```

Exit code: `0`  
Result: **PASS** (no regression)

---

## 5. Coverage Claim

| Claimed | Value |
|---|---|
| Before | 152 / 183 |
| After | 160 / 183 |
| Remaining | 23 |

The working-tree diff adds **10** new RPC handlers (8 authorized + 2 unauthorized). Because the repository does not expose an automated mock-coverage counter for the full 183 code-RPC set used by the Coverage Roadmap, the exact `160 / 183` figure could not be independently verified from the audit script alone. The unauthorized handlers alone would move the count to at least `162 / 183`, which conflicts with the authorized `160 / 183` target.

---

## 6. Findings

### 6.1 Critical Finding — Scope Violation

The implementation exceeds the authorized `CURRENT_TASK-025` boundary.

- **Unauthorized RPC handlers added:** `get_dashboard_summary`, `get_profit_report`.
- **Unauthorized store arrays added:** `order_items`, `customers`, `return_orders`, `return_order_items`.

Both unauthorized RPCs are real code RPCs (called from `services/supabaseService.ts`), but they are **not** in the 8-RPC authorization list for Wave 4a. Their inclusion violates the `CURRENT_TASK` boundary constraint and the "no scope expansion" rule in `CURRENT_PHASE.md` §5.

### 6.2 Supporting Observations

- The `CURRENT_TASK-025_IMPLEMENTATION_REPORT.md` states that only `partners`, `integrations`, and the 8 authorized handlers were added. The actual diff contradicts this.
- Existing handlers were not altered; the `if (name === "...")` pattern is preserved.
- All 8 authorized handlers conform to the canonical migration contract.
- Validation gates (audit, type, Vitest) pass, but passing gates do not override the scope violation.

---

## 7. Decision

**FAIL**

`CURRENT_TASK-025` cannot be accepted because the delivered change set includes unauthorized RPC handlers and unauthorized store additions beyond the 8 authorized Wave 4a RPCs.

---

## 8. Required Remediation

Engineering must produce a revised change set that:

1. Removes the unauthorized handlers:
   - `get_dashboard_summary`
   - `get_profit_report`
2. Removes the unauthorized store arrays:
   - `order_items`
   - `customers`
   - `return_orders`
   - `return_order_items`
3. Retains only the authorized 8 RPC handlers and the authorized `partners` / `integrations` store arrays.
4. Re-runs the validation gates and confirms coverage matches the authorized `160 / 183` target.
5. Updates the implementation report to accurately reflect the delivered diff.

No further program steps (Program Status Review, `CURRENT_TASK-026`, etc.) may proceed until this review is satisfied by a corrected submission.

---

*Independent Acceptance Review complete. Awaiting Engineering Remediation.*
