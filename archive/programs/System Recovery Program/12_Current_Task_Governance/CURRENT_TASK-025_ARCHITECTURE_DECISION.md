# CURRENT_TASK-025_ARCHITECTURE_DECISION.md

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**CURRENT_TASK:** 025  
**Document Type:** Architecture Decision  
**Status:** APPROVED (Architecture)  
**Date:** 2026-07-15  

---

# 1. Purpose

Define the architecture boundary and implementation strategy for CURRENT_TASK-025 before any engineering work begins.

This document authorizes only the architectural approach for adding mock coverage for the 8 authorized Wave 4a RPCs. It does **not** authorize implementation.

---

# 2. Program Context

| Attribute     | Value                                          |
| ------------- | ---------------------------------------------- |
| Phase         | Phase 4 — Derived Validation Layer Realignment |
| Milestone     | M6 — Cross-Cutting Services                    |
| Domain        | D — Integrations & Partners                    |
| Wave          | 4a                                             |
| CURRENT_TASK  | CURRENT_TASK-025                               |
| Previous Task | CURRENT_TASK-024 (Closed)                      |
| Current Status| AUTHORIZED                                     |

---

# 3. Authorized RPC Scope

The implementation scope is limited to the following **8 RPCs**:

| # | RPC Name | Canonical Source Location | Calling Code Location |
| --- | --- | --- | --- |
| 1 | `create_integration` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 4315 | `services/integrationService.ts` line 105 |
| 2 | `create_partner` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 4480 | `services/integrationService.ts` line 47 |
| 3 | `delete_integration` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 5555 | `services/integrationService.ts` line 145 |
| 4 | `delete_partner` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 5705 | `services/integrationService.ts` line 86 |
| 5 | `list_integrations` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 9940 | `services/integrationService.ts` line 91 |
| 6 | `list_partners` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 9972 | `services/integrationService.ts` line 34 |
| 7 | `update_integration` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 12667 | `services/integrationService.ts` line 130 |
| 8 | `update_partner` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` line 12766 | `services/integrationService.ts` line 71 |

No additional RPCs are authorized.

---

# 4. Canonical Source

All mock behavior, parameter names, and return shapes shall be derived exclusively from:

```text
supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
```

Canonical signatures:

```sql
CREATE OR REPLACE FUNCTION "public"."create_integration"(
  "p_partner_id" "uuid",
  "p_name" "text",
  "p_slug" "text" DEFAULT NULL::"text",
  "p_description" "text" DEFAULT NULL::"text",
  "p_category" "text" DEFAULT NULL::"text",
  "p_status" "text" DEFAULT 'active'::"text",
  "p_documentation_url" "text" DEFAULT NULL::"text"
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."create_partner"(
  "p_name" "text",
  "p_slug" "text" DEFAULT NULL::"text",
  "p_description" "text" DEFAULT NULL::"text",
  "p_website" "text" DEFAULT NULL::"text",
  "p_contact_email" "text" DEFAULT NULL::"text",
  "p_logo_url" "text" DEFAULT NULL::"text"
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."delete_integration"(
  "p_integration_id" "uuid"
) RETURNS "void"
```

```sql
CREATE OR REPLACE FUNCTION "public"."delete_partner"(
  "p_partner_id" "uuid"
) RETURNS "void"
```

```sql
CREATE OR REPLACE FUNCTION "public"."list_integrations"() RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."list_partners"() RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."update_integration"(
  "p_integration_id" "uuid",
  "p_partner_id" "uuid" DEFAULT NULL::"uuid",
  "p_name" "text" DEFAULT NULL::"text",
  "p_slug" "text" DEFAULT NULL::"text",
  "p_description" "text" DEFAULT NULL::"text",
  "p_category" "text" DEFAULT NULL::"text",
  "p_status" "text" DEFAULT NULL::"text",
  "p_documentation_url" "text" DEFAULT NULL::"text"
) RETURNS json
```

```sql
CREATE OR REPLACE FUNCTION "public"."update_partner"(
  "p_partner_id" "uuid",
  "p_name" "text" DEFAULT NULL::"text",
  "p_slug" "text" DEFAULT NULL::"text",
  "p_description" "text" DEFAULT NULL::"text",
  "p_website" "text" DEFAULT NULL::"text",
  "p_contact_email" "text" DEFAULT NULL::"text",
  "p_logo_url" "text" DEFAULT NULL::"text",
  "p_status" "text" DEFAULT NULL::"text"
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

## 6.1 Permitted

- Add `partners` and `integrations` empty arrays to the in-memory `store` object.
- Add minimal `if (name === "...")` mock handlers for the 8 authorized RPCs.
- Derive handler behavior directly from the canonical migration chain.
- Preserve the existing `if (name === "...")` dispatch pattern, handler conventions, error codes, and camelCase return shapes used by neighboring mock handlers.
- Use `currentUserId` for `created_by` on insert and apply `isSystemAdmin` guards consistent with the canonical functions.

## 6.2 Prohibited

- Business Logic changes
- Production code changes
- Database changes
- Schema changes
- Migration changes
- Generated type changes
- Audit changes
- CI changes
- Refactoring
- Redesign
- New abstraction, helper dispatcher, switch, map, or factory
- Work outside the 8 authorized RPCs

---

# 7. Implementation Strategy

Engineering shall follow these architectural constraints:

```text
additive only

no refactor

no redesign

no abstraction

preserve if(name==="") dispatch

CURRENT_TASK boundary: 8 RPCs, 1 wave, 1 domain

no duplicate handler

no stale mock
```

## 7.1 Store Additions

Extend the `store` record in `tests/mocks/supabase.ts` with:

```text
partners: []
integrations: []
```

No seed data is required; both tables start empty after `resetMockData`.

## 7.2 Handler Requirements

Each handler must:

1. Mirror the canonical function signature (parameter names and optionality).
2. Guard with `if (!isSystemAdmin)` and return `{ data: null, error: { code: '42501', message: '<canonical message>' } }`.
3. Return `PGRST116` / `Not found` for missing records on update/delete.
4. Return camelCase JSON objects matching the canonical `json_build_object` output.
5. For `create_integration`, validate that `p_name` is non-empty and that `p_partner_id` (when provided) references an existing partner in `store.partners`.
6. For `create_partner`, validate that `p_name` is non-empty.
7. For `list_integrations`, join each integration with `store.partners` on `partner_id` to produce `partnerName`, ordered by `created_at DESC`.
8. For `list_partners`, return all partners ordered by `created_at DESC`.
9. For updates, apply `COALESCE` semantics: explicit non-null/non-empty parameters overwrite the existing row value.
10. Use `crypto.randomUUID()` for generated `id`, `new Date().toISOString()` for timestamps, and `currentUserId` for `created_by`.

The existing dispatch pattern in `tests/mocks/supabase.ts` must remain unchanged.

---

# 8. Coverage Objective

Current Coverage

```text
152 / 183

~83.1%
```

Target Coverage

```text
160 / 183

~87.4%
```

Expected Delta

```text
+8 RPCs
```

Remaining after CURRENT_TASK-025

```text
23 RPCs
```

---

# 9. Validation Plan

The completed engineering work shall satisfy all of the following validation gates:

## 9.1 Audit

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

## 9.2 Type Check

```text
npx tsc --noEmit
```

Expected:

```text
PASS
```

## 9.3 Test Suite

```text
npx vitest run
```

Expected:

```text
68 files

389 tests

PASS
```

No regression is permitted.

---

# 10. Risks

| Risk | Mitigation |
| --- | --- |
| `Integration` / `Partner` return shapes differ from what `services/integrationService.ts` expects | Shapes are derived directly from the canonical `json_build_object` columns and match `mapIntegrationFromDB` / `mapPartnerFromDB` field aliases. |
| Missing `partners`/`integrations` arrays cause downstream tests to break | Arrays are added empty; handlers populate them via RPC, so no existing test sees undefined store entries. |
| Handler ordering could shadow an existing handler | The 8 RPC names are not currently present in the mock file; Engineering Kickoff must verify before implementation. |

---

# 11. Architecture Decision

Architecture review concludes that:

- Domain D (Integrations & Partners) is correctly scoped for Wave 4a as the first M6 cross-cutting service domain.
- The authorized RPC set is complete and limited to the 8 RPCs listed in Section 3.
- The implementation target (`tests/mocks/supabase.ts`) is correct.
- The additive-only strategy—adding two store arrays and 8 `if (name === "...")` handlers—preserves architectural integrity.
- The proposed work remains fully within the Phase 4 validation-layer boundary.

**Decision:** APPROVED

Engineering may begin only after this Architecture Decision has been formally accepted through the program governance sequence.

---

# 12. Stop Condition

This document completes the Architecture Decision stage for CURRENT_TASK-025.

No Engineering Kickoff, Engineering Implementation, Acceptance Review, Program Status Review, or CURRENT_TASK-026 activities are authorized by this document.
