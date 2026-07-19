# IMPLEMENTATION_MASTER_PLAN_4.md

**Document 4 / 8 — Phase 1-C: Edge Function Security & Phase 1 Closure**

**VietSale Pro v7 — Admin Dashboard Enterprise Stabilization**

| Field | Value |
| --- | --- |
| **Document Position** | 4 / 8 |
| **Document Type** | Execution |
| **Phase** | Phase 1-C (subset of Phase 1) |
| **Issues Covered** | CRIT-4 (Phase 1 edge function work), Phase 1 cron resume and final closure |
| **Estimated Effort** | 1 day |
| **Priority** | P0 — Completes Phase 1 |
| **Deployment Window** | Maintenance Window — Saturday 02:00–04:00 UTC+7 (same window as Phase 1-A/B, or next available window) |

---

## Document Purpose

This document covers the **edge function security hardening portion of Phase 1** and the **full Phase 1 closure**: deploying Momo/VNPay/bank_transfer webhook signature verification to `billing-webhooks`, rotating the `X-Internal-Secret` for all 7 edge functions that use it, resuming and verifying the two cron jobs paused in Doc 2, and issuing the final Phase 1 PASS/FAIL verdict. After this document completes with PASS, Phase 1 is fully done and Doc 5 (Phase 2) may begin.

> **Note on CRIT-4 scope**: CRIT-4 has two parts. The Phase 1 portion (this document) delivers the webhook signature verification for `billing-webhooks` and secret rotation. The Phase 2 portion (Doc 5) performs final verification of CRIT-4 resolution within the stable schema context of Phase 2. Full CRIT-4 closure is recorded in Doc 5.

---

## Scope

- Add HMAC-SHA-256 signature verification for Momo, VNPay, bank_transfer to `billing-webhooks` edge function
- Add replay protection (timestamp + nonce) to webhook verification
- Rotate `X-Internal-Secret` for all 7 edge functions that use it
- Verify current state of `cron-admin-tasks`, `send-billing-email`, `send-ticket-email`, `send-template-email`, `admin-health-check`, `webhook-delivery` (no code changes expected if compliant)
- Resume paused cron jobs (`data-retention-daily`, `fraud-detection-hourly`)
- Verify both cron jobs execute successfully
- Issue final Phase 1 PASS/FAIL verdict

## Covered Phases

Phase 1-C (edge function and closure portion of Phase 1)

## Covered Issues

| Issue | Title | Severity |
| --- | --- | --- |
| CRIT-4 | Edge functions missing webhook signature verification (Phase 1 portion) | CRITICAL |
| Phase 1 closure | Cron resume, full Phase 1 validation | — |

## Dependencies

- **Doc 2 / 8 (Phase 1-A)** must be complete with PASS (migrations synced, RPCs verified)
- **Doc 3 / 8 (Phase 1-B)** must be complete with PASS (`is_system_admin()` fixed, grants hardened)
- Cron jobs must still be paused from Doc 2, Step 2

## Prerequisites

- [ ] Doc 2 / 8 Transition Checklist complete (PASS)
- [ ] Doc 3 / 8 Transition Checklist complete (PASS)
- [ ] Access to Supabase edge function deployment (`supabase functions deploy`)
- [ ] Access to Supabase Secrets (to rotate `X-Internal-Secret` and add webhook signing secrets)
- [ ] Momo/VNPay webhook signing secret values available from payment provider documentation/dashboard
- [ ] Previous edge function git commit/tag recorded (for rollback reference)

## Required Skills

- Supabase Edge Functions (Deno/TypeScript)
- HMAC-SHA-256 implementation in Deno
- Supabase Secrets management
- pg_cron manual job triggering and log verification

## Required MCP

- Supabase MCP or Supabase CLI for edge function deployment and secrets management

---

## Why These Changes Belong Together

This document closes Phase 1. The edge function security work (CRIT-4 Phase 1 portion) and cron job resumption are logically the final steps of Phase 1: the database is stable (Doc 2), the security grants are hardened (Doc 3), and now the external-facing attack surface (webhook endpoints) is closed and the previously-broken cron jobs are restored to operation. Combining them in one document ensures Phase 1 is assessed as a complete unit.

---

## Required Edge Function Changes

### Primary Change: `billing-webhooks`

| Function | Change |
| --- | --- |
| `supabase/functions/billing-webhooks/index.ts` | Add HMAC-SHA-256 signature verification for Momo, VNPay, bank_transfer providers; add replay protection (timestamp + nonce) |

**Webhook signature verification logic:**

```typescript
// For each provider (Momo, VNPay, bank_transfer):
// 1. Extract signature from request headers
// 2. Reconstruct signing payload per provider specification
// 3. Compute HMAC-SHA-256 using provider-specific secret (from Supabase Secrets)
// 4. Compare computed signature with provided signature (constant-time comparison)
// 5. Extract and validate timestamp (reject if > 5 minutes old)
// 6. Check nonce has not been seen before (replay protection)
// 7. Return 400 if any check fails; proceed if all pass
```

Secrets to add to Supabase Secrets:
- `MOMO_WEBHOOK_SECRET` — signing secret from Momo dashboard
- `VNPAY_WEBHOOK_SECRET` — signing secret from VNPay dashboard
- `BANK_TRANSFER_WEBHOOK_SECRET` — signing secret from bank_transfer provider

### Verification-Only Changes (no code changes expected)

| Function | Action |
| --- | --- |
| `supabase/functions/cron-admin-tasks/index.ts` | Verify `X-Internal-Secret` is read from Supabase Secrets (not hardcoded); rotate the secret |
| `supabase/functions/send-billing-email/index.ts` | Verify `X-Internal-Secret` rotation status |
| `supabase/functions/send-ticket-email/index.ts` | Verify service role key usage; confirm compliant |
| `supabase/functions/send-template-email/index.ts` | Verify service role key usage; confirm compliant |
| `supabase/functions/admin-health-check/index.ts` | Option: wrap with IP allowlist OR accept current risk with secret rotation; document decision |
| `supabase/functions/webhook-delivery/index.ts` | Verify `X-Internal-Secret` rotation |

### Secret Rotation

Rotate `X-Internal-Secret` for all 7 functions via Supabase Secrets (Dashboard or CLI):
```bash
supabase secrets set X_INTERNAL_SECRET=[new-randomly-generated-value]
```
- Generate a cryptographically random 32-byte value (hex or base64 encoded)
- Update all 7 functions simultaneously (same secret value) or per-function if isolated
- Deploy all 7 functions after rotation

---

## Implementation Order

```
Step 1:  IMPLEMENT WEBHOOK SIGNATURE VERIFICATION IN billing-webhooks
         ├── Add HMAC-SHA-256 verification for Momo
         ├── Add HMAC-SHA-256 verification for VNPay
         ├── Add HMAC-SHA-256 verification for bank_transfer
         ├── Add replay protection (timestamp window + nonce check)
         └── Add corresponding Supabase Secrets (MOMO_WEBHOOK_SECRET, etc.)

Step 2:  ROTATE X-Internal-Secret
         ├── Generate new cryptographically random secret
         ├── Update in Supabase Secrets
         └── Note: rotation takes effect after function redeploy in Step 3

Step 3:  DEPLOY UPDATED EDGE FUNCTIONS
         ├── supabase functions deploy billing-webhooks
         ├── supabase functions deploy cron-admin-tasks (if changes needed)
         ├── supabase functions deploy send-billing-email (if changes needed)
         ├── supabase functions deploy webhook-delivery (if changes needed)
         └── Verify all functions return 200 on health-check

Step 4:  VERIFY OTHER EDGE FUNCTIONS (no code changes expected)
         ├── Review send-ticket-email: confirm service_role key usage
         ├── Review send-template-email: confirm service_role key usage
         ├── Review admin-health-check: document IP allowlist decision
         └── Document compliance status for each function

Step 5:  TEST WEBHOOK SIGNATURE VERIFICATION
         ├── Send unsigned Momo webhook → must return 400
         ├── Send unsigned VNPay webhook → must return 400
         ├── Send unsigned bank_transfer webhook → must return 400
         ├── Send valid signed Momo webhook → must return 200
         ├── Send valid signed VNPay webhook → must return 200
         ├── Send replayed Momo webhook (> 5 minutes old) → must return 400
         └── Verify existing Stripe webhook verification still works

Step 6:  RESUME CRON JOBS
         ├── SELECT cron.schedule(
         │     'data-retention-daily',
         │     '0 3 * * *',
         │     'SELECT public.run_data_retention();'
         │   );
         ├── SELECT cron.schedule(
         │     'fraud-detection-hourly',
         │     '0 * * * *',
         │     'SELECT public.run_fraud_detection();'
         │   );
         ├── Manually trigger both jobs:
         │   SELECT cron.perform_job('data-retention-daily');
         │   SELECT cron.perform_job('fraud-detection-hourly');
         └── Verify: SELECT * FROM cron.job_run_details
                     WHERE jobname IN ('data-retention-daily', 'fraud-detection-hourly')
                     ORDER BY run_time DESC LIMIT 4;
                     -- Both must show status = 'succeeded'

Step 7:  PHASE 1 FINAL VALIDATION
         ├── Run all Phase 1 validation items (see Validation Checklist below)
         ├── Run full regression checklist
         └── Issue PASS or FAIL verdict for Phase 1
```

---

## Validation Checklist

### Edge Function Validation
- [ ] Momo webhook requires valid HMAC-SHA-256 signature (unsigned → 400)
- [ ] VNPay webhook requires valid HMAC-SHA-256 signature (unsigned → 400)
- [ ] bank_transfer webhook requires valid HMAC-SHA-256 signature (unsigned → 400)
- [ ] Momo webhook replay (> 5 min old) rejected (→ 400)
- [ ] Valid signed Momo/VNPay/bank_transfer webhooks accepted (→ 200)
- [ ] Existing Stripe webhook verification continues to work
- [ ] `X-Internal-Secret` rotated for all 7 functions
- [ ] `cron-admin-tasks` reads secret from Supabase Secrets (not hardcoded)
- [ ] `admin-health-check` compliance decision documented

### Cron Job Validation
- [ ] `data-retention-daily` cron job scheduled successfully
- [ ] `fraud-detection-hourly` cron job scheduled successfully
- [ ] Manual trigger of `data-retention-daily` shows `status = 'succeeded'` in `cron.job_run_details`
- [ ] Manual trigger of `fraud-detection-hourly` shows `status = 'succeeded'` in `cron.job_run_details`
- [ ] `is_system_admin()` returning `true` for `postgres` is the root cause fix confirmed

### Full Phase 1 Validation (cumulative from Docs 2, 3, 4)
- [ ] `is_system_admin()` returns `true` when `current_user = 'postgres'` (Doc 3)
- [ ] `cron.job_run_details` shows SUCCESS for both cron jobs (this doc)
- [ ] `anon` CANNOT execute `add_system_admin`, `add_system_admin_for_edge`, `unlock_login_attempts` (Doc 3)
- [ ] `authenticated` CANNOT execute `add_system_admin`, `add_system_admin_for_edge` (Doc 3)
- [ ] `authenticated` CAN execute `unlock_login_attempts` (scoped) (Doc 3)
- [ ] All 107 functions have `search_path = 'public'` (Doc 3)
- [ ] `supabase lint` shows 0 `anon_security_definer_function_executable` for sensitive functions (Doc 3)
- [ ] All 9 missing migrations applied in production (Doc 2)
- [ ] All 5 previously-missing RPCs exist in production (Doc 2)
- [ ] Frontend admin features using those RPCs work (Doc 2)
- [ ] Momo/VNPay/bank_transfer webhooks require cryptographic signature (this doc)

## Regression Checklist

- [ ] All 36 smoke tests pass
- [ ] `is_system_admin()` still works for `service_role` and authenticated system admins
- [ ] Tenant admins can still manage their tenants
- [ ] Edge functions with `verify_jwt=false` still function correctly
- [ ] No tenant data leakage between tenants (RLS unchanged)
- [ ] PostgREST queries from frontend continue to work
- [ ] Build succeeds (`npm run build`)
- [ ] Existing Stripe billing webhooks continue to process correctly

---

## Rollback Plan

1. **Edge Functions**: Redeploy previous versions from git tag/commit recorded in prerequisites
2. **Cron Jobs**: Re-pause with `SELECT cron.unschedule(...)` if issues discovered post-resume
3. **Secret Rotation**: Update Supabase Secrets to previous value if rotation causes failures
4. **Database**: No database changes in this document; Doc 3 rollback procedures apply if needed
5. **Rollback Trigger**: Any critical functionality broken (billing webhooks not processing, cron jobs erroring) → rollback edge functions; investigate before re-deploy
6. **Rollback Time Estimate**: 10 minutes (edge function redeploy)

---

## Expected Outcome

- Cron jobs `data-retention-daily` and `fraud-detection-hourly` execute successfully
- Momo/VNPay/bank_transfer webhooks require cryptographic signature verification
- `X-Internal-Secret` rotated across all 7 edge functions
- Full Phase 1 PASS verdict issued
- System ready for Phase 2 (Doc 5)

---

## PASS/FAIL Criteria

| Criterion | Threshold | Weight |
| --- | --- | --- |
| Cron jobs successful | 1+ manual trigger succeeds; automated run succeeds within 6 hours | MUST PASS |
| Webhook signatures | Unsigned Momo/VNPay/bank_transfer requests rejected | MUST PASS |
| Stripe unaffected | Existing Stripe webhook processing continues | MUST PASS |
| Secret rotated | X-Internal-Secret updated; functions redeployed | MUST PASS |
| Smoke tests | All 36 pass | MUST PASS |
| Build succeeds | Zero errors | MUST PASS |

**Phase 1-C Outcome: PASS ✅ / FAIL ❌**

**Phase 1 (Docs 2 + 3 + 4) Full Outcome: PASS ✅ / FAIL ❌**

---

## Phase 1 Post-Deployment Monitoring (24 hours)

After issuing Phase 1 PASS, monitor for 24 hours:
- [ ] `cron.job_run_details` shows SUCCESS for both cron jobs for 3 consecutive runs
- [ ] No spike in edge function error rates
- [ ] Admin dashboard remains fully functional
- [ ] No increase in 4xx/5xx responses on webhook endpoints

---

## References to Previous Document

**Doc 3 / 8 — Phase 1-B: Database Security Hardening** (`IMPLEMENTATION_MASTER_PLAN_3.md`)

Must be completed (PASS) before this document. Provides the fixed `is_system_admin()` that enables cron jobs to succeed in this document.

## References to Next Document

**Doc 5 / 8 — Phase 2: Schema & Data Stability** (`IMPLEMENTATION_MASTER_PLAN_5.md`)

Covers: HIGH-2, HIGH-1, MED-3, CRIT-4 (final resolution)
Execution: Audit log consolidation, import_history table, delete-tenant verification.
**Prerequisite**: This document (Doc 4) must be complete with Phase 1 PASS outcome before Doc 5 begins.

---

## Transition Checklist

Before continuing to Doc 5 / 8, the AI must verify:

- [ ] **PASS** — Phase 1-C Validation Checklist complete (all items checked)
- [ ] **Validation Complete** — Full Phase 1 Validation Checklist complete; cron jobs showing SUCCESS in `cron.job_run_details`; webhook signatures enforced
- [ ] **Review Complete** — Edge function changes committed; secret rotation confirmed; all 7 functions redeployed
- [ ] **Regression Complete** — All 36 smoke tests pass; Stripe webhooks unaffected; cron jobs running for 3+ consecutive successes

*Phase 1 is fully closed only when all four items above are checked. Doc 5 must not begin until this is confirmed.*