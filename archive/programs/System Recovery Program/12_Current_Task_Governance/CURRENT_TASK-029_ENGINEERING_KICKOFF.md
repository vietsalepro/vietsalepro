# CURRENT_TASK-029 Engineering Kickoff

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Milestone:** M6 — Cross-Cutting Services  
**Wave:** 4e  
**Domain:** G — Promotions  
**CURRENT_TASK:** 029  
**Document Type:** Engineering Kickoff  
**Status:** APPROVED for Implementation  
**Date:** 2026-07-16  
**Authorizing Role:** Program Manager / Architecture Authority  

**Basis:** `SYSTEM_RECOVERY_MASTER_PLAN.md`, `CURRENT_PHASE.md`, `PHASE4_COVERAGE_ROADMAP.md`, `CURRENT_TASK-029_PROGRAM_AUTHORIZATION.md`, `CURRENT_TASK-029_ARCHITECTURE_DECISION.md`, `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql`, `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql`

---

## 1. Scope Confirmation

| Attribute | Value |
|---|---|
| Wave | **Wave 4e** |
| Domain | **Domain G — Promotions** |
| Authorized RPCs | Exactly **3** |
| Target File | `tests/mocks/supabase.ts` |
| Change Type | Additive mock coverage only |

### 1.1 Authorized RPCs

| # | RPC Name | Canonical Source Location | Calling Code Location |
|---|---|---|---|
| 1 | `apply_voucher_to_invoice` | `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` line 176 | `services/promotionService.ts` line 314 |
| 2 | `get_promo_code_usage_counts` | `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql` line 150 | `services/promotionService.ts` line 271 |
| 3 | `validate_promo_code` | `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql` line 78 | `services/promotionService.ts` line 348 |

No other RPC, file, or domain is in scope for CURRENT_TASK-029.

---

## 2. Target Confirmation

The only file modified by implementation is:

```text
tests/mocks/supabase.ts
```

No production code, service code, migration, schema, generated type, package, CI workflow, or UI file is targeted.

---

## 3. Canonical Sources

Behavior, parameter names, return shapes, error messages, and state mutation semantics are derived **exclusively** from the canonical migration chain. Markdown documents are **not** sources of truth.

```text
supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql
supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql
```

### 3.1 Canonical Signatures

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

## 4. Existing Store Reuse

No new store arrays are created. Implementation reuses only the following existing in-memory stores already present in `tests/mocks/supabase.ts`:

| Store | Purpose |
|---|---|
| `store.promo_codes` | Voucher definitions, including `target_conditions` (P10.2 extension) |
| `store.promotion_rules` | Auto-applied promotion rules |
| `store.promo_code_usages` | Per-tenant / per-invoice voucher usage records |
| `store.invoices` | Invoice header rows mutated by `apply_voucher_to_invoice` |
| `store.invoice_items` | Invoice line items; receives bonus-month rows |
| `store.tenants` | Tenant plan and creation date for eligibility checks |

---

## 5. Architecture Constraints

Implementation must adhere to the following constraints, as approved in `CURRENT_TASK-029_ARCHITECTURE_DECISION.md`:

| Constraint | Requirement |
|---|---|
| Additive only | Only add 3 new `if (name === "...")` handlers; no existing handler is modified, removed, or refactored |
| No refactor | Do not reorganize, split, or rename existing handlers or helpers |
| No redesign | Do not change the dispatch pattern, store model, or return envelope conventions |
| No abstraction | No generic helper, factory, dispatcher, or shared validation routine |
| No new dependency | Use only existing helpers (`uuid()`, `addMonths()`, `currentUserId`, `currentTenantId`, `isSystemAdmin`) |
| Preserve dispatch pattern | Keep `if (name === "...")` chains exactly as existing handlers do |
| No duplicate handler | Each of the 3 RPCs receives exactly one handler block |
| No stale mock | Do not introduce mocked RPCs that are not in the authorized list |
| No production code changes | Do not touch `services/`, `lib/`, `utils/`, UI, or any runtime code |
| No migration/schema/type changes | Do not touch `supabase/migrations/`, `supabase/schema.sql`, `supabase/generated/database.types.ts` |
| No CI/workflow changes | Do not touch `.github/`, CI configs, or `package.json` |

---

## 6. Implementation Plan

### 6.1 Insertion Point

Add the three new handlers to `tests/mocks/supabase.ts` inside the existing `rpc(name, params)` dispatch function, adjacent to the other Wave 4 cross-cutting service handlers and before the final fallback. Follow the existing `if (name === "...")` pattern and snake_case store keys.

### 6.2 `validate_promo_code`

| Aspect | Plan |
|---|---|
| **Reads** | `store.promo_codes`, `store.promo_code_usages`, `store.tenants` |
| **Writes** | None |
| **Return contract** | `{ valid: boolean; error?: string; promo_code_id?: string; kind?: string; discount_value?: number; max_discount_amount?: number }` returned in `data`; `error: null` on business validation failures |
| **Validation path** | 1. Look up tenant by `p_tenant_id`; if missing return `valid: false, error: 'Không tìm thấy tenant'`. 2. Look up promo code by `p_code`; if missing return `valid: false, error: 'Mã voucher không tồn tại'`. 3. Enforce canonical order: inactive, not-yet-valid, expired, below `min_invoice_amount`, global usage exhausted, per-tenant usage exhausted. 4. Evaluate `target_conditions` when present: `tenant_age_days`, `plan`, `tenant_ids` (all AND). |
| **Permission path** | `SECURITY INVOKER`; no explicit `isSystemAdmin` guard in the mock. The canonical function relies on RLS/select policies; the mock mirrors the business validation only. |
| **State mutation** | None. |
| **Error handling** | Business failures return structured JSON inside `data` so `services/promotionService.ts` can read `data.valid` / `data.error`. No Supabase error envelope for business failures. |

**Success return:**

```json
{
  "valid": true,
  "promo_code_id": "<uuid>",
  "kind": "fixed_amount" | "percentage",
  "discount_value": 0,
  "max_discount_amount": null | 0
}
```

### 6.3 `get_promo_code_usage_counts`

| Aspect | Plan |
|---|---|
| **Reads** | `store.promo_code_usages` |
| **Writes** | None |
| **Return contract** | `{ total: number; per_tenant: Record<string, number> }` returned in `data`; `error: null` |
| **Validation path** | Filter `store.promo_code_usages` where `promo_code_id === p_promo_code_id`. Count total rows. Group by `tenant_id` and count per tenant, mapping `tenant_id` to text keys. Return `{ total, per_tenant }`. |
| **Permission path** | `SECURITY INVOKER`; no explicit guard. The service layer passes a known `promoCodeId`. |
| **State mutation** | None. |
| **Error handling** | Empty usage yields `{ total: 0, per_tenant: {} }`. No error thrown. |

**Success return:**

```json
{
  "total": 0,
  "per_tenant": {}
}
```

### 6.4 `apply_voucher_to_invoice`

| Aspect | Plan |
|---|---|
| **Reads** | `store.invoices`, `store.invoice_items`, `store.promo_codes`, `store.promotion_rules`, `store.promo_code_usages`, `store.tenants` |
| **Writes** | `store.invoices` (update `discount`, `total`, `period_end`, `updated_at`), `store.invoice_items` (insert bonus-month row), `store.promo_code_usages` (insert usage record) |
| **Return contract** | `{ success: true, invoice_id, promo_code_id, code, discount, bonus_months, total, period_end, usage_id }` on success; `{ success: false, error: string }` on business failure; `{ data: null, error: { code: '42501', message: ... } }` on permission failure |
| **Permission path** | Guard with `if (!isSystemAdmin)` and return `{ data: null, error: { code: '42501', message: 'Chỉ system admin mới được áp dụng voucher' } }`. This mirrors the canonical `RAISE EXCEPTION ... USING ERRCODE = 'insufficient_privilege'`. |
| **Validation path** | 1. Find invoice by `p_invoice_id`; missing → `success: false, error: 'Không tìm thấy hóa đơn'`. 2. If `status` not in `['draft', 'pending']` → `success: false, error: 'Hóa đơn không ở trạng thái chờ thanh toán'`. 3. If any `promo_code_usages` row exists for this invoice → `success: false, error: 'Hóa đơn đã áp dụng voucher'`. 4. Find tenant by `invoice.tenant_id`; missing → `success: false, error: 'Không tìm thấy tenant'`. 5. Call the same `validate_promo_code` branch internally with `{ p_code, p_tenant_id: invoice.tenant_id, p_invoice_subtotal: invoice.subtotal }`; if invalid → `success: false, error: <validation.error>`. |
| **State mutation** | 1. Re-fetch promo code by `p_code`. 2. Compute discount: percentage → `subtotal * discount_value / 100`, capped by `max_discount_amount`; fixed → `discount_value`; clamp to `[0, subtotal]` and round to 2 decimals. 3. Determine `cycle_type`: default `'monthly'`; if first positive-unit-price `invoice_items` row has `unit_price === 59000`, set `'yearly'`. 4. Sum `bonus_months` from active `promotion_rules` where `benefit_type = 'bonus_months'`, date window valid, ordered by `priority DESC`, applying inline canonical matching logic (`always`, `tenant_age_days`, `plan`, `specific_tenant`, `cycle_type`). 5. Update invoice: set `discount`, `total = subtotal - discount`, `updated_at = now()`. If `bonus_months > 0` and `period_end` exists, extend `period_end` by `bonus_months` months from `GREATEST(period_end, tenant.expires_at)`. 6. If `bonus_months > 0`, insert invoice item: `{ invoice_id, tenant_id, description: 'Tháng tặng (promotion)', quantity: bonus_months, unit_price: 0 }`. 7. Insert `promo_code_usages` row linking `promo_code_id`, `tenant_id`, `invoice_id`. |
| **Error handling** | Permission failure uses Supabase error envelope with code `42501`. Business validation failures return `{ success: false, error: '...' }` in `data` so `services/promotionService.ts` produces a typed `ApplyVoucherResult` without throwing. |

**Success return:**

```json
{
  "success": true,
  "invoice_id": "<uuid>",
  "promo_code_id": "<uuid>",
  "code": "PROMO",
  "discount": 0,
  "bonus_months": 0,
  "total": 0,
  "period_end": "2026-08-16",
  "usage_id": "<uuid>"
}
```

### 6.5 Cross-Handler Convention

- Use `uuid()` for generated UUIDs.
- Use `new Date().toISOString()` for timestamps.
- Read/write snake_case store keys directly; let service-layer mappers handle camelCase.
- When calling `validate_promo_code` from `apply_voucher_to_invoice`, invoke the same local dispatch branch with the same `rpc` parameter shape rather than extracting a helper.

---

## 7. Validation Plan

After implementation, the following gates must pass with no regression:

| Gate | Command | Expected Result |
|---|---|---|
| Canonical Audit Gate | `npx tsx scripts/audit-rpc-contracts.ts` | Exit 0; message `RPC contracts and service code are in sync.` |
| Type Gate | `npx tsc --noEmit` | Exit 0; no type errors |
| Test Gate | `npx vitest run` | Exit 0; all existing tests still pass; passing test count must not decrease |

Additional acceptance checks:

- Only `tests/mocks/supabase.ts` is modified.
- Exactly 3 new RPC handlers are present and no existing handler is removed or refactored.
- No new store arrays are added.
- No production code, migration, schema, generated type, package, or CI file is changed.

---

## 8. Expected Coverage

| Metric | Before | After |
|---|---|---|
| Covered RPCs | 180 / 183 | **183 / 183** |
| Uncovered RPCs | 3 | **0** |
| Coverage | ~98.4% | **100.0%** |
| Delta | — | **+3 RPCs, +~1.6 percentage points** |

Wave 4e is the final mock-coverage wave of Phase 4 Milestone M6. After CURRENT_TASK-029 is accepted, the Phase 4 coverage target of `183 / 183 (100%)` is achieved and **0 RPCs remain uncovered**.

---

## 9. Out-of-Scope Reminder

This Engineering Kickoff does **not** authorize or produce:

- Engineering Implementation
- Acceptance Review
- Program Status Review
- `CURRENT_TASK-030` or any subsequent CURRENT_TASK
- Any source-code change before the approved implementation step
- Any document other than this Engineering Kickoff

Implementation may begin only after this Kickoff is accepted and the engineering team follows the plan above within the approved constraints.

---

## 10. Conclusion

```text
ENGINEERING KICKOFF APPROVED
```

CURRENT_TASK-029 — Wave 4e: Domain G (Promotions) is cleared for implementation. Scope is locked to the 3 authorized RPC handlers in `tests/mocks/supabase.ts`, derived strictly from the two canonical migration sources, with expected coverage moving from `180 / 183` to `183 / 183`.
