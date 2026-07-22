# 66B_WAVE05_IMPLEMENTATION_SPECIFICATION

**Document ID:** 66B_WAVE05_IMPLEMENTATION_SPECIFICATION  
**Date:** 2026-07-22  
**Project:** VietSalePro  
**Sub Project:** Admin Dashboard  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** B — System Remediation  
**Wave:** Wave-05  
**Acting Capacity:** Enterprise Program Management Office (PMO)  
**Baseline:** AD-Baseline-1.0  
**Repository Scope:** `C:\PROJECT\vietsalepro` @ `3efa3f1a`  
**Authorized Commit:** `ce87b9d7` (`fix(services,config): Wave-04 residual hardening — canonical read RPCs and check-subdomain verify_jwt`)  
**Status:** Wave-05 Implementation Specification — COMPLETE

------------------------------------------------------------------------

## 1. Objective

Wave-05 Engineering Objective: **Restore Production Billing Webhook Reliability.**

This specification defines the exact implementation required to return the `billing-webhooks` Edge Function to a production-ready state while preserving every existing contract.

------------------------------------------------------------------------

## 2. Implementation Boundaries

### 2.1 In-Scope

- `supabase/functions/billing-webhooks/index.ts` only.
- Correct the Deno standard-library base64 import incompatibility.
- Preserve the existing request/response contract, CORS, audit logging, provider routing, and signature verification.

### 2.2 Out-of-Scope

- Database changes
- RPC changes
- UI changes
- Authentication redesign
- Architecture redesign
- Other Edge Functions
- Service-layer changes
- Business-logic changes beyond restoring the existing logic
- Performance optimization
- Security enhancements unrelated to `billing-webhooks`

------------------------------------------------------------------------

## 3. Target Files

| # | File | Reason |
|---|------|--------|
| 1 | `supabase/functions/billing-webhooks/index.ts` | Contains the offending `decodeBase64` import and is the only production Edge Function with a `BOOT_ERROR`. |
| 2 | `supabase/config.toml` | **Read-only** verification target; `verify_jwt = false` for `[functions.billing-webhooks]` must remain unchanged. |

No other source files are touched.

------------------------------------------------------------------------

## 4. Entry Points

HTTP `POST` to `https://<supabase-project-ref>.supabase.co/functions/v1/billing-webhooks?provider=<provider>`.

Supported `provider` query values: `stripe`, `momo`, `vnpay`, `bank_transfer`.

`OPTIONS` is handled for CORS preflight.

------------------------------------------------------------------------

## 5. Module Dependencies

| Dependency | Source | Usage |
|------------|--------|-------|
| `@supabase/supabase-js@2.97.0` | `https://esm.sh/@supabase/supabase-js@2.97.0` | Admin Supabase client for `app_audit_log` inserts. |
| `std/http/server.ts@0.177.0` | `https://deno.land/std@0.177.0/http/server.ts` | `serve` function. |
| `std/encoding/base64.ts@0.177.0` | `https://deno.land/std@0.177.0/encoding/base64.ts` | Base64 decode of `whsec_` Stripe webhook secret. |

------------------------------------------------------------------------

## 6. Affected Imports

**Current (defective):**

```ts
import { decodeBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts';
```

**Corrected:**

```ts
import { decode as decodeBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts';
```

The `decode` named export is the actual export provided by Deno std `encoding/base64.ts` v0.177.0. The alias `decodeBase64` preserves all call sites and avoids unnecessary churn.

------------------------------------------------------------------------

## 7. Execution Sequence

1. **Module load**
   - `std/http/server.ts` and `std/encoding/base64.ts` resolve.
   - `decode as decodeBase64` is bound.
   - `serve` begins listening.

2. **Request arrival**
   - `OPTIONS` → CORS `200 ok`.
   - Non-`POST` → `405 Method not allowed`.

3. **Provider validation**
   - Parse `provider` query parameter.
   - Reject unsupported providers with `400`.

4. **Shared-key gate**
   - `verifyWebhookApiKey` checks `x-billing-webhook-key` header against optional `BILLING_WEBHOOK_API_KEY` env var.
   - If env var is unset, the gate is open (existing behavior).
   - If set and header mismatch → `401 Invalid billing webhook API key`.

5. **Admin client construction**
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are read from env.
   - Admin client created with `autoRefreshToken: false, persistSession: false`.

6. **Provider handler dispatch**
   - `stripe` → `handleStripeWebhook`
   - `momo` → `handleMomoWebhook`
   - `vnpay` → `handleVNPayWebhook`
   - `bank_transfer` → `handleBankTransferWebhook`

7. **Stripe handler (when invoked)**
   - Read `stripe-signature` header and raw request body.
   - Read `STRIPE_WEBHOOK_SECRET`.
   - Decode `whsec_` prefix using `decodeBase64` alias.
   - Verify HMAC-SHA256 signature with 5-minute replay window.
   - Return `{ success: true, provider: 'stripe', event: 'stripe.webhook.received' }` on valid signature.

8. **Audit log**
   - Every processed request inserts one row into `app_audit_log` with `table_name: 'billing_webhooks'`, `action: 'INSERT'`, `new_data`, `ip_address`, and `user_agent`.

9. **Response**
   - Success → `200` with `{ success: true, provider, result }`.
   - Handler error → `500` with `{ error, provider }` and an audit failure row.

------------------------------------------------------------------------

## 8. Environment Variables and Secret Usage

| Name | Type | Required | Usage |
|------|------|----------|-------|
| `SUPABASE_URL` | Env var | Yes | Supabase project URL for admin client. |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Yes | Service-role key for admin client and `app_audit_log` writes. |
| `STRIPE_WEBHOOK_SECRET` | Secret | Conditional | Required only for `provider=stripe`. |
| `BILLING_WEBHOOK_API_KEY` | Secret | No | Optional shared-key gate for non-signature providers. |

No secret values are logged, returned, or rotated by this change.

------------------------------------------------------------------------

## 9. Expected Runtime Behavior

- After the import correction, the function boots without `BOOT_ERROR`.
- Direct `POST` without `provider` or with unsupported `provider` returns `400`.
- `POST` with `provider=stripe` and missing/invalid `stripe-signature` returns `401`/`500` with audit row.
- `POST` with `provider=stripe` and valid signature returns `200`.
- `POST` for `momo`, `vnpay`, and `bank_transfer` returns `200` after parsing the request body and writing an audit row.
- `OPTIONS` returns `200 ok` with CORS headers.

------------------------------------------------------------------------

## 10. Failure Scenarios and Error Handling

| Scenario | Behavior | Audit |
|----------|----------|-------|
| Defective base64 import | Module load failure (resolved by this spec) | N/A; currently causes `503 BOOT_ERROR` |
| Missing/invalid `provider` | `400 Unsupported provider: ...` | No |
| Missing/invalid `x-billing-webhook-key` when `BILLING_WEBHOOK_API_KEY` is set | `401 Invalid billing webhook API key` | No |
| Missing `stripe-signature` | `{ success:false, message:'Missing stripe-signature' }` with `200` | Yes, result recorded |
| Missing `STRIPE_WEBHOOK_SECRET` | `{ success:false, message:'Missing STRIPE_WEBHOOK_SECRET' }` with `200` | Yes |
| Invalid Stripe signature | `{ success:false, message:'Invalid stripe-signature' }` with `200` | Yes |
| Timestamp older than 5 minutes | `false` from `verifyStripeSignature` → `Invalid stripe-signature` | Yes |
| Handler or audit insert throws | `500 { error, provider }`; error logged; audit insert retried with `.catch` | Best-effort failure audit row |
| Invalid IP address | Replaced with `'0.0.0.0'` | Recorded IP is sanitized |

------------------------------------------------------------------------

## 11. Backward Compatibility

- Request URL, query parameter, and header contract are unchanged.
- Response JSON shapes are unchanged.
- `verify_jwt = false` in `supabase/config.toml` is preserved.
- All environment variables and secrets are reused; no rotation or rename.
- Stripe webhook signature algorithm is unchanged; only the base64 decoder import name is corrected.
- Existing Stripe webhook endpoints configured in the Stripe Dashboard do not require reconfiguration.

------------------------------------------------------------------------

## 12. Implementation Order

1. Edit `supabase/functions/billing-webhooks/index.ts` import line.
2. Run local Edge Function type/lint check if available (`deno check` or `supabase functions serve`).
3. Deploy `billing-webhooks` Edge Function.
4. Verify direct `POST` to `billing-webhooks` returns `200` (or `400` for missing provider) instead of `503`.
5. Verify Stripe signature path with a valid test event.
6. Verify `momo`, `vnpay`, and `bank_transfer` paths return `200`.
7. Verify `app_audit_log` rows are inserted for each processed request.

------------------------------------------------------------------------

## 13. Required Validations

- `deno check supabase/functions/billing-webhooks/index.ts` passes.
- `supabase functions deploy billing-webhooks` succeeds.
- Direct `POST` without `provider` returns `400`.
- Direct `POST` with `provider=bank_transfer` and optional `x-billing-webhook-key` returns `200`.
- Stripe signature verification with `STRIPE_WEBHOOK_SECRET` returns `200` for valid events and rejects replays older than 5 minutes.
- `app_audit_log` receives rows for processed and failed webhook attempts.
- No new environment variables are introduced.

------------------------------------------------------------------------

## 14. Rollback Strategy

- Revert the one-line import to the previous defective state and redeploy, or
- Redeploy the previous `billing-webhooks` version recorded by Supabase, or
- Use Supabase CLI / dashboard to rollback the Edge Function to the last known deployed version.

The `ce87b9d7` source commit remains the frozen authorized baseline and contains the pre-fix version.

------------------------------------------------------------------------

## 15. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Single-line change still fails | Validate with `deno check` before deploy; test on staging if available. |
| Stripe signature regression | Use a known valid Stripe test event and replay-window test. |
| Audit log insert failure | Existing `.catch` already protects the error path; no change. |
| Accidental scope expansion | No other files are modified; review diff is one import line. |
| Environment misalignment | No env or secret changes are required. |

------------------------------------------------------------------------

## 16. Verification Strategy

- Static: `deno check` import resolution.
- Unit/Local: `supabase functions serve billing-webhooks` with local env.
- Integration: Direct `POST` to deployed endpoint with each provider.
- Stripe: Use Stripe CLI or a signed test payload.
- Audit: Query `app_audit_log` for `table_name = 'billing_webhooks'`.

------------------------------------------------------------------------

## 17. Deployment Strategy

- Use Supabase CLI: `supabase functions deploy billing-webhooks`.
- Or equivalent CI pipeline that deploys a single Edge Function.
- Deploy only the `billing-webhooks` function; no other functions, migrations, or database changes.
- Confirm deployment version increments and function status remains `ACTIVE`.

------------------------------------------------------------------------

## 18. Acceptance Strategy

- `POST` to `billing-webhooks` returns `200` for valid requests and `400` for missing/unsupported `provider`.
- No `503` responses on invocation.
- Stripe signature verification succeeds for valid payloads.
- Audit rows are written for all processed webhooks.
- No application source beyond `index.ts` and no env changes are introduced.

------------------------------------------------------------------------

## 19. Production Verification Strategy

- Invoke the production `billing-webhooks` endpoint with `provider=bank_transfer` and a JSON body; expect `200`.
- Re-register or trigger a Stripe test event against the production endpoint and confirm `200` response.
- Query `app_audit_log` in the production Supabase project for `billing_webhooks` entries.
- Monitor Supabase Edge Function logs for 24 hours after deploy for any `BOOT_ERROR` or `500`.

------------------------------------------------------------------------

## 20. Specification Stop Rule

This document does **NOT** authorize implementation.

Do **NOT** begin `67 — Wave-05 Implementation Readiness Review` or `68 — Wave-05 Implementation` without explicit Program Owner approval.
