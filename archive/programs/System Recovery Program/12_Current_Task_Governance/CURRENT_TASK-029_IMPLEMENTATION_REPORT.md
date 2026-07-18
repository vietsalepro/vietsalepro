# CURRENT_TASK-029 Implementation Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Wave:** 4e  
**Domain:** G — Promotions  
**Document Type:** Implementation Report  
**Date:** 2026-07-16  
**Status:** COMPLETE

---

## 1. Files Changed

| File | Change Type | Lines |
|---|---|---|
| `tests/mocks/supabase.ts` | Additive only — inserted 3 new `if (name === "...")` RPC handlers inside existing `rpc()` dispatch | +207 lines, 0 lines removed from existing handlers |

No other file was modified.

---

## 2. RPCs Added

| # | RPC Name | Handler Location | Canonical Source |
|---|---|---|---|
| 1 | `validate_promo_code` | `tests/mocks/supabase.ts` line 2993 | `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` line 78 |
| 2 | `get_promo_code_usage_counts` | `tests/mocks/supabase.ts` line 3056 | `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql` line 150 |
| 3 | `apply_voucher_to_invoice` | `tests/mocks/supabase.ts` line 3065 | `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` line 176 |

All three handlers reuse the existing in-memory stores:

- `store.promo_codes`
- `store.promotion_rules`
- `store.promo_code_usages`
- `store.invoices`
- `store.invoice_items`
- `store.tenants`

No new store arrays were created.

---

## 3. Coverage Before

| Metric | Value |
|---|---|
| Covered RPCs | 180 / 183 |
| Uncovered RPCs | 3 |
| Coverage | ~98.4 % |

Source: `CURRENT_TASK-029_PROGRAM_AUTHORIZATION.md` §6 and `CURRENT_TASK-029_ENGINEERING_KICKOFF.md` §8.

---

## 4. Coverage After

| Metric | Value |
|---|---|
| Covered RPCs | **183 / 183** |
| Uncovered RPCs | **0** |
| Coverage | **100.0 %** |

The canonical audit gate confirms service-layer / mock sync:

```text
Contract RPCs : 125
Code RPCs     : 125

RPC contracts and service code are in sync.
```

---

## 5. Validation Gate Results

| Gate | Command | Result |
|---|---|---|
| Canonical Audit Gate | `npx tsx scripts/audit-rpc-contracts.ts` | PASS — Exit 0, "RPC contracts and service code are in sync." |
| Type Gate | `npx tsc --noEmit` | PASS — Exit 0, no type errors |
| Test Gate | `npx vitest run` | PASS — Exit 0, 68 test files, 389 tests passed, no regressions |

---

## 6. Scope Verification

| Constraint | Required | Actual |
|---|---|---|
| Target file | `tests/mocks/supabase.ts` only | `tests/mocks/supabase.ts` only |
| Additive only | Yes | Yes — only 3 new `if (name === "...")` blocks added; no existing handler modified |
| No refactor | Yes | Yes — existing helpers, stores, and dispatch pattern unchanged |
| No redesign | Yes | Yes — `if (name === "...")` chain preserved |
| No abstraction | Yes | Yes — no generic helper, factory, dispatcher, or switch introduced |
| No duplicate handler | Yes | Yes — exactly one handler per RPC |
| No new store | Yes | Yes — reused 6 existing stores |
| No production code changes | Yes | Yes — `services/`, `lib/`, `utils/` untouched |
| No migration/schema/type changes | Yes | Yes — `supabase/migrations/`, `supabase/schema.sql`, `supabase/generated/database.types.ts` untouched |
| No CI/workflow changes | Yes | Yes — `.github/`, CI configs, `package.json` untouched |
| RPC scope | Exactly 3 RPCs | Exactly `validate_promo_code`, `get_promo_code_usage_counts`, `apply_voucher_to_invoice` |

---

## 7. Constraint Compliance

- **`if (name === "...")` dispatch pattern preserved** — all three handlers follow the existing chain inside `rpc()`.
- **snake_case store keys** — used throughout the new handlers to match canonical table columns.
- **`uuid()` reused** — all generated UUIDs use the existing `uuid()` helper (`crypto.randomUUID()`).
- **`addMonths()` reused** — bonus-month `period_end` extension uses the existing `addMonths()` helper.
- **`new Date().toISOString()` reused** — timestamps use the project convention.
- **Internal `validate_promo_code` dispatch** — `apply_voucher_to_invoice` calls the same `rpc()` branch via `await (rpc as any)(...)`, avoiding any new helper or abstraction.
- **Canonical contracts** — return payloads match the canonical migration signatures and Vietnamese error messages.
- **No `switch`, no factory, no dispatcher** — only additive `if` blocks.

---

## 8. Implementation Summary

### 8.1 `validate_promo_code`

- Reads `store.promo_codes`, `store.promo_code_usages`, and `store.tenants`.
- Does not mutate state.
- Validates in canonical order:
  1. Tenant exists (`Không tìm thấy tenant`).
  2. Promo code exists (`Mã voucher không tồn tại`).
  3. Active flag, valid-from/valid-until window, minimum invoice amount.
  4. Global and per-tenant usage limits.
  5. `target_conditions`: `tenant_age_days`, `plan`, `tenant_ids` (combined with AND).
- Success payload returns `valid`, `promo_code_id`, `kind`, `discount_value`, `max_discount_amount`.

### 8.2 `get_promo_code_usage_counts`

- Reads `store.promo_code_usages`.
- Does not mutate state.
- Filters by `promo_code_id`, counts total usage, and builds `per_tenant` as a `Record<string, number>` keyed by `tenant_id::TEXT`.
- Returns `{ total, per_tenant }`.

### 8.3 `apply_voucher_to_invoice`

- Permission check: returns `42501` / `Chỉ system admin mới được áp dụng voucher` when `isSystemAdmin` is false.
- Validates invoice exists, status in `['draft', 'pending']`, and no existing promo code usage for the invoice.
- Validates tenant exists.
- Calls the internal `validate_promo_code` RPC branch with the invoice's `tenant_id` and `subtotal`.
- Re-fetches the promo code, computes discount (percentage capped by `max_discount_amount`, fixed amount, clamped to `[0, subtotal]`, rounded to 2 decimals).
- Detects cycle type from the first positive-unit-price invoice item (`59000` → yearly).
- Sums `bonus_months` from active `promotion_rules` ordered by priority DESC, applying inline canonical matching logic.
- Mutates state:
  - Updates `store.invoices`: `discount`, `total`, `period_end` (if bonus months > 0), `updated_at`.
  - Inserts a bonus-month row into `store.invoice_items` when applicable.
  - Inserts a usage row into `store.promo_code_usages`.
- Returns the canonical success payload `{ success, invoice_id, promo_code_id, code, discount, bonus_months, total, period_end, usage_id }`.

---

## 9. Conclusion

Wave 4e implementation is complete and bounded. The three authorized Domain G (Promotions) RPC handlers are now present in `tests/mocks/supabase.ts`, derived directly from the canonical migrations. All validation gates pass, coverage reaches 183 / 183 (100 %), and no file outside `tests/mocks/supabase.ts` was changed.

```text
IMPLEMENTATION COMPLETE
```
