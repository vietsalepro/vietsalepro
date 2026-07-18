# CURRENT_TASK-029 Architecture Decision

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Domain:** G — Promotions  
**Wave:** 4e  
**CURRENT_TASK:** 029  
**Document Type:** Architecture Decision  
**Status:** APPROVED (Architecture)  
**Date:** 2026-07-16  
**Authoring Role:** Architecture Authority  

---

## 1. Purpose

Define the architecture boundary and implementation strategy for **CURRENT_TASK-029** before any engineering work begins.

This document authorizes only the architectural approach for adding mock coverage for the **3 authorized Wave 4e RPCs** in Domain G (Promotions). It does **not** authorize implementation, engineering kickoff, acceptance review, program status review, or any other CURRENT_TASK.

---

## 2. Program Context

| Attribute      | Value                                          |
| ---------------- | ---------------------------------------------- |
| Phase            | Phase 4 — Derived Validation Layer Realignment |
| Milestone        | M6 — Cross-Cutting Services                    |
| Domain           | G — Promotions                                 |
| Wave             | 4e                                             |
| CURRENT_TASK     | CURRENT_TASK-029                               |
| Previous Task    | CURRENT_TASK-028 (Closed)                      |
| Current Status   | AUTHORIZED                                     |
| Current Coverage | 180 / 183 (~98.4%)                             |

---

## 3. Authorized RPC Scope

The implementation scope is limited to the following **3 RPCs**:

| # | RPC Name | Canonical Source Location | Calling Code Location |
| --- | --- | --- | --- |
| 1 | `apply_voucher_to_invoice` | `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` line 176 | `services/promotionService.ts` line 314 |
| 2 | `get_promo_code_usage_counts` | `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql` line 150 | `services/promotionService.ts` line 271 |
| 3 | `validate_promo_code` | `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` line 78 | `services/promotionService.ts` line 348 |

No additional RPCs are authorized.

---

## 4. Canonical Source

All mock behavior, parameter names, and return shapes shall be derived exclusively from the canonical migration chain:

```text
supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql
supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql
```

No markdown document, service comment, test assumption, or derived artifact may supersede the canonical migration chain.

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

---

## 5. Target

Authorized implementation target:

```text
tests/mocks/supabase.ts
```

No other production code, service code, migration, schema, generated type, package, CI, or UI file is within scope.

---

## 6. Architecture Boundary

### 6.1 Permitted

- Add 3 minimal `if (name === "...")` mock handlers for the authorized RPCs.
- Reuse the existing in-memory `store` arrays that already represent promotion and invoice state:
  - `store.promo_codes`
  - `store.promotion_rules`
  - `store.promo_code_usages`
  - `store.invoices`
  - `store.invoice_items`
  - `store.tenants`
- Derive handler behavior directly from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern, handler conventions, error codes, and return shapes used by neighboring mock handlers.
- Reuse existing helpers `uuid()`, `addMonths()`, `currentUserId`, `currentTenantId`, and `isSystemAdmin`.
- Call `validate_promo_code` internally from `apply_voucher_to_invoice` by invoking the same `rpc` dispatch (no new helper, no abstraction).

### 6.2 Prohibited

- Business logic changes.
- Production code changes in `services/`, `lib/`, or anywhere else.
- Database, schema, migration, or generated-type changes.
- Package or CI changes.
- Refactoring, redesign, new abstraction, generic helper, factory, dispatcher, or `switch` statement.
- Work outside the 3 authorized RPCs.

---

## 7. Implementation Strategy

Engineering shall follow these architectural constraints:

```text
additive only
no refactor
no redesign
no abstraction
preserve if(name==="") dispatch
CURRENT_TASK boundary: 3 RPCs, 1 wave, 1 domain
no duplicate handler
no stale mock
```

### 7.1 Store Strategy

No new store arrays are added. The existing arrays are sufficient:

- `store.promo_codes` already exists and holds voucher definitions including the `target_conditions` JSONB column added by P10.2.
- `store.promotion_rules` already exists and holds auto-applied promotion rules.
- `store.promo_code_usages` already exists and tracks per-tenant / per-invoice voucher usage.
- `store.invoices` and `store.invoice_items` already exist and are mutated by `create_invoice` and `confirm_payment` handlers.
- `store.tenants` already exists and supplies tenant plan and creation date for eligibility checks.

Handlers read and write these arrays directly, using snake_case keys to match the canonical table definitions.

### 7.2 Common Handler Conventions

Each handler must:

1. Mirror the canonical function signature (parameter names and optionality).
2. Use `crypto.randomUUID()` for generated UUIDs via the existing `uuid()` helper.
3. Use `new Date().toISOString()` for timestamps.
4. Return `42501` with the canonical Vietnamese permission message when the canonical path requires `public.is_system_admin()` and `isSystemAdmin` is false.
5. Return canonical error messages inside the JSON payload for validation/business failures, because the service layer expects `data.success` / `data.valid` to drive its control flow.
6. Preserve snake_case row shapes internally; let the service-layer mappers convert to camelCase.

### 7.3 Handler Requirements

#### `validate_promo_code`

- Look up `store.promo_codes` by `params.p_code`.
- Look up `store.tenants` by `params.p_tenant_id`.
- Return error payloads in the exact canonical order:
  - Tenant not found: `{ valid: false, error: 'Không tìm thấy tenant' }`.
  - Promo code not found: `{ valid: false, error: 'Mã voucher không tồn tại' }`.
  - Inactive, not yet valid, expired, below minimum invoice amount, global usage exhausted, per-tenant usage exhausted: use the canonical Vietnamese messages from P10.2 / P10.1.
- Evaluate `target_conditions` (P10.2 extension) when present:
  - `tenant_age_days`: compare `(CURRENT_DATE - tenant.created_at::DATE)`.
  - `plan`: require `tenant.plan` to match.
  - `tenant_ids`: require `p_tenant_id` to be in the JSON array.
- On success return:
  ```json
  { valid: true, promo_code_id, kind, discount_value, max_discount_amount }
  ```
- No state mutation.

#### `get_promo_code_usage_counts`

- Filter `store.promo_code_usages` where `promo_code_id = params.p_promo_code_id`.
- Compute `total` as the row count.
- Compute `per_tenant` as an object mapping `tenant_id::TEXT` to usage count.
- Return:
  ```json
  { total, per_tenant }
  ```
- No permission check is required; the canonical function is `SECURITY INVOKER` and the service layer passes the promo code id directly.

#### `apply_voucher_to_invoice`

- Guard with `if (!isSystemAdmin)` and return `42501` / `Chỉ system admin mới được áp dụng voucher` (canonical raises `insufficient_privilege`).
- Find `store.invoices` by `params.p_invoice_id`.
- If not found, return `{ success: false, error: 'Không tìm thấy hóa đơn' }`.
- If invoice status is not `'draft'` or `'pending'`, return `{ success: false, error: 'Hóa đơn không ở trạng thái chờ thanh toán' }`.
- If a `store.promo_code_usages` row already exists for this invoice, return `{ success: false, error: 'Hóa đơn đã áp dụng voucher' }`.
- Find `store.tenants` by `invoice.tenant_id`; if missing, return `{ success: false, error: 'Không tìm thấy tenant' }`.
- Call the `validate_promo_code` branch internally with `{ p_code, p_tenant_id: invoice.tenant_id, p_invoice_subtotal: invoice.subtotal }`. If invalid, return `{ success: false, error: <validation.error> }`.
- Re-fetch the matching promo code from `store.promo_codes`.
- Compute discount:
  - If `kind === 'percentage'`: `subtotal * discount_value / 100`, capped by `max_discount_amount`.
  - Otherwise: `discount_value`.
  - Clamp to `[0, subtotal]` and round to 2 decimals.
- Determine `cycle_type` from `store.invoice_items`:
  - Default `'monthly'`.
  - If the first positive-unit-price item has `unit_price === 59000` (yearly plan price from seed), set `'yearly'`.
- Compute bonus months from active promotion rules:
  - Iterate `store.promotion_rules` where `is_active = true`, date window valid, `benefit_type = 'bonus_months'`, ordered by `priority DESC`.
  - Apply the canonical matching logic inline:
    - `condition_type = 'always'` matches.
    - `tenant_age_days` matches when tenant age is within the configured days.
    - `plan` matches tenant plan.
    - `specific_tenant` matches `invoice.tenant_id`.
    - `cycle_type` matches the detected cycle type.
  - Sum `benefit_value` into `bonus_months`.
- Mutate state:
  - Update the invoice row: set `discount`, `total = subtotal - discount`, `updated_at` now.
  - If `bonus_months > 0` and `invoice.period_end` exists, extend `period_end` by `bonus_months` months from `GREATEST(period_end, tenant.expires_at)`.
  - If `bonus_months > 0`, push a new `invoice_items` row with description `'Tháng tặng (promotion)'`, quantity `bonus_months`, and `unit_price = 0`.
  - Push a new `promo_code_usages` row linking `promo_code_id`, `tenant_id`, and `invoice_id`.
- Return:
  ```json
  {
    success: true,
    invoice_id,
    promo_code_id,
    code,
    discount,
    bonus_months,
    total,
    period_end,
    usage_id
  }
  ```

### 7.4 State Mutation Summary

| RPC | Reads | Writes |
| --- | --- | --- |
| `validate_promo_code` | `promo_codes`, `promo_code_usages`, `tenants` | None |
| `get_promo_code_usage_counts` | `promo_code_usages` | None |
| `apply_voucher_to_invoice` | `invoices`, `invoice_items`, `promo_codes`, `promotion_rules`, `promo_code_usages`, `tenants` | `invoices` (update), `invoice_items` (insert), `promo_code_usages` (insert) |

### 7.5 Return Contract Strategy

- `validate_promo_code` returns a JSON object directly in `data`; `services/promotionService.ts` maps `data.valid`, `data.error`, `data.promo_code_id`, `data.kind`, `data.discount_value`, and `data.max_discount_amount`.
- `get_promo_code_usage_counts` returns `{ total, per_tenant }` in `data`; the service layer expects `data.total` and `data.per_tenant`.
- `apply_voucher_to_invoice` returns `{ success, ... }` in `data`; the service layer checks `data.success` and then reads `data.invoice_id`, `data.promo_code_id`, `data.code`, `data.discount`, `data.bonus_months`, `data.total`, `data.period_end`, and `data.usage_id`.
- Supabase-level errors are returned as `{ data: null, error: { code, message } }` only for permission failures or internal mock errors; business validation failures are returned inside `data` so the service layer can produce typed `ApplyVoucherResult` / validation objects.

### 7.6 Error Handling Strategy

- Permission errors use code `42501` with the canonical Vietnamese message so the service layer throws a recognizable Supabase error.
- Missing resources in `apply_voucher_to_invoice` return `success: false` with canonical messages; the service layer returns a typed failure object rather than throwing.
- `validate_promo_code` and `get_promo_code_usage_counts` never throw for business-level failures; they return structured JSON payloads matching the canonical function output.

### 7.7 Scope Boundary

- Only `tests/mocks/supabase.ts` is modified.
- Only the 3 RPCs above receive handlers.
- No changes to `services/promotionService.ts`, `types/billing.ts`, migrations, schema, generated types, or UI.

---

## 8. Coverage Objective

Current Coverage

```text
180 / 183

~98.4%
```

Target Coverage

```text
183 / 183

100.0%
```

Expected Delta

```text
+3 RPCs
```

Remaining after CURRENT_TASK-029

```text
0 RPCs
```

This is the final mock-coverage wave of Phase 4 Milestone M6.

---

## 9. Risk Assessment

| Risk | Severity | Mitigation |
| ---- | -------- | ---------- |
| `apply_voucher_to_invoice` mock duplicates canonical validation/discount/bonus logic inline | Low | The handler delegates validation to the existing `validate_promo_code` branch and follows the canonical P10.2 algorithm step-by-step; any canonical change requires a new Program Authorization and CURRENT_TASK. |
| Existing `create_invoice` mock sets `status = 'open'`, while canonical `apply_voucher_to_invoice` only accepts `'draft'` / `'pending'` | Low | Tests that exercise voucher application must seed invoices with `'draft'` or `'pending'` status, or update the invoice status before calling the RPC; this preserves canonical contract fidelity. |
| `target_conditions` JSON shape depends on P10.2 column already present in `store.promo_codes` | Low | The mock reads the same `target_conditions` JSONB keys (`tenant_age_days`, `plan`, `tenant_ids`) that the canonical migration and service mapper use. |
| Cycle-type detection relies on hard-coded plan prices (59000 = yearly, otherwise monthly) | Low | Matches the canonical seed values and the `create_invoice` mock; documented in handler strategy. |

---

## 10. Validation Plan

The Wave 4e implementation is acceptable when the following gates remain green:

1. `npx tsx scripts/audit-rpc-contracts.ts` exits `0` with `RPC contracts and service code are in sync`.
2. `npx tsc --noEmit` exits `0`.
3. `npx vitest run` exits `0` with no decrease in passing test count.
4. Only `tests/mocks/supabase.ts` is modified.
5. Exactly 3 new RPC handlers are added and no existing handler is removed or refactored.
6. Coverage moves from `180 / 183` to `183 / 183`.

---

## 11. Conclusion

```text
APPROVED
```

The architecture for CURRENT_TASK-029 — Wave 4e: Domain G (Promotions) mock coverage is approved. Engineering Kickoff is authorized next, pending Program Manager confirmation that this Architecture Decision satisfies Phase 4 constraints.

---

*Basis: `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-029_PROGRAM_AUTHORIZATION.md`, `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql`, `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql`, `services/promotionService.ts`, `tests/mocks/supabase.ts`, `supabase/generated/database.types.ts`.*
