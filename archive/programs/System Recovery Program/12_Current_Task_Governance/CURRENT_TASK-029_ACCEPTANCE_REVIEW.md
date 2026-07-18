# CURRENT_TASK-029 Independent Acceptance Review

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Wave:** 4e — Domain G (Promotions)  
**Date:** 2026-07-16  
**Reviewer:** Independent  
**Decision:** **PASS**

---

## 1. Documents Reviewed (in order)

1. `SYSTEM_RECOVERY_MASTER_PLAN.md` — Phase 4 scope, constraints, and exit criteria.
2. `CURRENT_PHASE.md` — Phase 4 active; no Phase 5 work authorized.
3. `PHASE4_COVERAGE_ROADMAP.md` — Domain G was the final 3-RPC gap (180 / 183).
4. `CURRENT_TASK-029_PROGRAM_AUTHORIZATION.md` — Authorized exactly 3 RPCs, additive-only, `tests/mocks/supabase.ts` only.
5. `CURRENT_TASK-029_ARCHITECTURE_DECISION.md` — Handler semantics derived strictly from the two canonical P10 migrations.
6. `CURRENT_TASK-029_ENGINEERING_KICKOFF.md` — Implementation plan, validation gates, and coverage target.
7. `CURRENT_TASK-029_IMPLEMENTATION_REPORT.md` — Claims 3 handlers added, +207 lines, 183 / 183 coverage.

---

## 2. Scope Verification

| Authorized RPC | Found in mock | Canonical source | Calling code |
|---|---|---|---|
| `apply_voucher_to_invoice` | Yes | `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` line 176 | `services/promotionService.ts` line 314 |
| `get_promo_code_usage_counts` | Yes | `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql` line 150 | `services/promotionService.ts` line 271 |
| `validate_promo_code` | Yes | `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` line 78 | `services/promotionService.ts` line 348 |

No other RPC handler was introduced by the CURRENT_TASK-029 additions.

---

## 3. Files Changed

```text
 M tests/mocks/supabase.ts
```

Only `tests/mocks/supabase.ts` is modified in the working tree. No production code, migration, schema artifact, generated type, package, CI workflow, or UI file was changed.

---

## 4. Architecture Compliance

- **Additive only:** the three handlers are inserted as new `if (name === "...")` blocks before the final `PGRST116` fallback.
- **No refactor / no redesign:** existing dispatch chain, helpers, and store layout are untouched.
- **No abstraction:** no generic helper, factory, dispatcher, or `switch` statement introduced.
- **Pattern preserved:** all three handlers use `if (name === "...")` exactly like neighboring mocks.

<ref_snippet file="c:/PROJECT/vietsalepro/tests/mocks/supabase.ts" lines="2993-3198" />

---

## 5. Canonical Compliance

### 5.1 `validate_promo_code`

- Mirrors canonical signature `p_code TEXT, p_tenant_id UUID, p_invoice_subtotal NUMERIC DEFAULT 0`.
- Validation order matches the P10.2 canonical function:
  1. Tenant exists → `Không tìm thấy tenant`.
  2. Promo code exists → `Mã voucher không tồn tại`.
  3. Inactive, not-yet-valid, expired, minimum-invoice, global-usage, per-tenant-usage checks use the exact Vietnamese messages from the migration.
- Evaluates `target_conditions` (`tenant_age_days`, `plan`, `tenant_ids`) with AND semantics.
- Success payload returns `valid`, `promo_code_id`, `kind`, `discount_value`, `max_discount_amount`.
- No state mutation.

<ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql" lines="78-169" />

### 5.2 `get_promo_code_usage_counts`

- Mirrors canonical signature `p_promo_code_id UUID`.
- Returns `{ total, per_tenant }` where `per_tenant` keys are `tenant_id::TEXT`.
- No permission guard, matching the canonical `SECURITY INVOKER` function.
- No state mutation.

<ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql" lines="150-177" />

### 5.3 `apply_voucher_to_invoice`

- Mirrors canonical signature `p_invoice_id UUID, p_code TEXT`.
- Permission guard returns `42501` / `Chỉ system admin mới được áp dụng voucher`, matching the canonical `insufficient_privilege` raise.
- Business validation order matches the migration: invoice exists → status `draft`/`pending` → no existing usage → tenant exists → validate promo code.
- Delegates promo-code validation to the same `validate_promo_code` branch inside `rpc` instead of creating a helper.
- Discount logic matches canonical: percentage capped by `max_discount_amount`, fixed amount, clamped to `[0, subtotal]`, rounded to 2 decimals.
- `cycle_type` detection matches canonical seed convention (`unit_price === 59000` → yearly, otherwise monthly).
- Bonus-month computation iterates active `promotion_rules` ordered by `priority DESC` and applies the same `condition_type` matching logic inline.
- State mutation matches canonical: updates `invoices.discount`, `total`, `period_end`, `updated_at`; inserts an `invoice_items` bonus row; inserts a `promo_code_usages` row.
- Success payload returns `success`, `invoice_id`, `promo_code_id`, `code`, `discount`, `bonus_months`, `total`, `period_end`, `usage_id`.

<ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql" lines="176-324" />

---

## 6. Store Validation

The CURRENT_TASK-029 handlers reuse only the existing in-memory stores already defined in `tests/mocks/supabase.ts`:

- `store.promo_codes`
- `store.promotion_rules`
- `store.promo_code_usages`
- `store.invoices`
- `store.invoice_items`
- `store.tenants`

No new store array was introduced by the three handlers.

---

## 7. Handler Validation

- Exactly **3** new handlers for the 3 authorized RPCs.
- No duplicate handler block for any of the three RPC names.
- Existing handlers were not modified; the diff against `HEAD` shows only insertions.

---

## 8. Validation Gate Results

### 8.1 Canonical Audit Gate

```bash
npx tsx scripts/audit-rpc-contracts.ts
```

```text
Contract RPCs : 125
Code RPCs     : 125

RPC contracts and service code are in sync.
```

**Result:** PASS (exit 0).

### 8.2 Type Gate

```bash
npx tsc --noEmit
```

**Result:** PASS (exit 0, no type errors).

### 8.3 Test Gate

```bash
npx vitest run
```

```text
Test Files  68 passed (68)
     Tests  389 passed (389)
```

**Result:** PASS (exit 0, no regressions).

---

## 9. Coverage Validation

| Metric | Before | Target | After |
|---|---|---|---|
| Covered RPCs | 180 / 183 | 183 / 183 | 183 / 183 |
| Uncovered RPCs | 3 | 0 | 0 |
| Coverage | ~98.4% | 100.0% | 100.0% |

The final three uncovered RPCs from `PHASE4_COVERAGE_ROADMAP.md` (`apply_voucher_to_invoice`, `get_promo_code_usage_counts`, `validate_promo_code`) now have matching mock handlers and are invoked from `services/promotionService.ts`.

<ref_snippet file="c:/PROJECT/vietsalepro/services/promotionService.ts" lines="271-349" />

---

## 10. Regression Review

- No production code changes.
- No migration or schema changes.
- No generated-type changes.
- No CI / workflow changes.
- No UI changes.
- Test count and passing count did not decrease.

**Result:** No regression detected.

---

## 11. Observations (non-blocking)

The working-tree diff of `tests/mocks/supabase.ts` against `HEAD` is large because earlier Phase 4 waves (before CURRENT_TASK-029) remain uncommitted. Those additions are outside the CURRENT_TASK-029 scope. The CURRENT_TASK-029 additions are localized to the three handler blocks reviewed above and do not introduce new stores, new abstractions, or changes to existing handlers.

---

## 12. Final Acceptance Decision

```text
PASS
```

CURRENT_TASK-029 — Wave 4e: Domain G (Promotions) is accepted. The three authorized RPC handlers are correctly implemented, canonical-compliant, additive, and pass all required validation gates with 183 / 183 coverage.

CURRENT_TASK-029 is eligible to proceed to **Program Status Review**.

---

*Review performed independently against the canonical migration chain and the current source tree.*
