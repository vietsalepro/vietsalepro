# DELIVER_WEBHOOK Artifact Verification Report

## Executive Summary

| Item | Value |
|------|-------|
| Artifact | `supabase/functions/deliver-webhook` |
| Production project | `rsialbfjswnrkzcxarnj` (QLBH) |
| Staging project | `shbmzvfcenbybvyzclem` (no `deliver-webhook` deployed) |
| Repository callers | 0 in source; references only in docs/plan artifacts |
| Production deployment | Active (version 4) |
| Recent invocations (last 24h) | 0 observed |
| Replacement | `webhook-delivery` |

**Conclusion:** `deliver-webhook` is a stale, duplicate Edge Function that has been superseded by `webhook-delivery`. No repository callers, cron jobs, database triggers, or recent invocations point to it. It is safe to classify as a **Dead Artifact** once the Supabase production deployment is undeployed before the directory is removed.

**Final Recommendation:** **SAFE TO DELETE** (with the cleanup sequence below).

---

## A. Repository Evidence

### A.1 Grep Search

A case-insensitive search for `deliver-webhook` across the repository found **77 matches**, all in:

- Governance / plan documents (`ADMIN_DASHBOARD_PLAN/*`, `REPOSITORY_HYGIENE_DECISION_REGISTER.md`, `ADMIN_HEALTH_CHECK_GOVERNANCE_DECISION.md`)
- Memory-zone and archive session logs
- PDP / deployment reports

No references were found in:

- `services/`
- `lib/`
- `hooks/`
- `contexts/`
- `pages/`
- `components/` (except docs)
- `utils/`
- `supabase/functions` source code other than the function itself

A search for the actual endpoint URL pattern `functions/v1/deliver-webhook` returned **0 matches**.

### A.2 Codebase Memory Graph

Using `codebase-memory`:

- `search_graph(query="deliver-webhook")` located only the `supabase/functions/deliver-webhook/index.ts` module and its local helper functions (`jsonResponse`, `signPayload`) plus `schema.sql` RPC helpers.
- `query_graph` for inbound `CALLS` / `HTTP_CALLS` / `ASYNC_CALLS` edges to any node with file path `deliver-webhook/index.ts` returned **0 external callers**.
- The `supabase/functions/deliver-webhook.index` module has `in_degree: 1` from module-internal calls to `jsonResponse` and `signPayload`; no cross-file inbound edges.

**Repository call graph:**

```
No inbound repository callers
  |
  +-- supabase/functions/deliver-webhook/index.ts (module, in_degree 0 external)
        |
        +-- jsonResponse (local)
        +-- signPayload (local)
```

---

## B. Supabase Evidence (Production Project `rsialbfjswnrkzcxarnj`)

### B.1 Deployed Edge Functions

`list_edge_functions` for production:

| Slug | Function ID | Version | Status | verify_jwt | Created (UTC) | Updated (UTC) |
|------|-------------|---------|--------|------------|---------------|---------------|
| `deliver-webhook` | `226f50b1-fdd6-4864-841b-f07a3b006232` | 4 | `ACTIVE` | `true` | 2026-07-08 04:02:19 | 2026-07-19 11:37:01 |
| `webhook-delivery` | `89cdba4e-1813-4d3b-a89c-17bcda3572c5` | 2 | `ACTIVE` | `false` | 2026-07-13 05:45:23 | 2026-07-13 05:45:23 |

`deliver-webhook` is still deployed and reachable at:

```
https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/deliver-webhook
```

`webhook-delivery` is also deployed at:

```
https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/webhook-delivery
```

Staging (`shbmzvfcenbybvyzclem`) has neither function deployed.

### B.2 Invocation History / Recent Logs

`get_logs` for `edge-function` and `edge-function-runtime` over the last 24 hours returned **100 rows each**.

- **0 rows** for `deliver-webhook` (`226f50b1...`)
- **0 rows** for `webhook-delivery` (`89cdba4e...`)
- All observed invocations in that window belong to `admin-health-check` and `cron-admin-tasks`.

**HTTP methods observed for `deliver-webhook`:** none in the available 24-hour log window.

### B.3 Secrets and Environment Variables

The Supabase MCP does not expose a direct secret-listing tool. Source-code inspection shows `deliver-webhook` reads:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEBHOOK_DELIVERY_SECRET`

`WEBHOOK_DELIVERY_SECRET` is also used by `webhook-delivery`, so it must be retained if `webhook-delivery` stays in use.

### B.4 Cron / Scheduler / Database Triggers

- `cron.job` query returned **no jobs** whose command references `deliver-webhook` or `webhook-delivery`.
- Existing `cron.job` entries are: `admin-billing-reminders`, `admin-audit-cleanup`, `announcements-publish-minutely`, `billing-expire-pending-daily`, `billing-reminders-daily`, `billing-renewal-daily`, `invoice-expiry-daily`, `purge-archived-tenants-daily`, `renewal-invoice-daily`.
- `system_settings.admin_cron_config` points to `https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/cron-admin-tasks`, not a webhook worker.
- No repository or database trigger references `deliver-webhook`.

### B.5 Operational Data

`public.webhook_deliveries` is **empty** (`GROUP BY status` returned no rows). There are no pending, delivered, failed, or exhausted deliveries in the production database.

---

## C. Comparison with `webhook-delivery`

| Aspect | `deliver-webhook` | `webhook-delivery` |
|--------|-------------------|--------------------|
| Status | `ACTIVE` v4 | `ACTIVE` v2 |
| verify_jwt | `true` | `false` |
| Retry logic | Single attempt | Up to 5 attempts with backoff |
| Timeout | Default fetch (no explicit timeout) | 30-second `fetchWithTimeout` |
| Signature comparison | Direct string comparison for `X-Internal-Secret` | Constant-time comparison (`constantTimeEqual`) |
| Delivery result recording | Uses RPC `mark_webhook_delivery` | Direct `webhook_deliveries` table update with full `attempt_log` |
| Shared engine | Inline implementation | Uses `supabase/functions/_shared/webhookDelivery.ts` |
| Codebase references | None | None (also no source callers) |
| Last known repository intent | Original worker | Hardened replacement (SP-4.4) |

The hardened `webhook-delivery` function implements the same delivery flow as `deliver-webhook` but with retries, timeouts, and safer secret handling. It is the intended active worker. `deliver-webhook` is therefore a duplicate/parallel implementation that has been superseded.

---

## D. Git Evidence

### D.1 Commit History for `supabase/functions/deliver-webhook`

```
d7ab8b35  phatnt056  2026-07-08 11:17:01 +0700  UPDATE
4a61ee6f  phatnt056  2026-07-12 18:41:31 +0700  feat(admin): SP-4.4 webhook delivery system — retry-with-HMAC engine, DB hardening, and tests
```

- `d7ab8b35` is the commit that introduced/modified `deliver-webhook` on `master`.
- `4a61ee6f` is on the `feat/SP-4.4-webhook-delivery` feature branch and replaces `deliver-webhook` logic with `webhook-delivery`. It is **not** in the `master` first-parent history.

### D.2 Master Integration

```
45c43971  feat(admin): integrate admin dashboard features into master
```

`45c43971` on `master` added `supabase/functions/webhook-delivery/index.ts` (+126 lines) but did **not** remove `supabase/functions/deliver-webhook/index.ts`. The two functions therefore coexist in the repository and in production.

### D.3 Author

- `d7ab8b35` and `4a61ee6f` authored by `phatnt056 <31572085+vietsalepro@users.noreply.github.com>`.

---

## E. Dependency Analysis

### E.1 Inbound Dependencies

| Source | Count | Notes |
|--------|-------|-------|
| React app source | 0 | No `services/`, `pages/`, `components/`, or `hooks/` references |
| Edge Function source | 0 | No other function calls `deliver-webhook` |
| Migrations / schema | 0 | No `pg_cron` or `pg_net` calls |
| `cron.job` | 0 | No scheduler entry |
| `system_settings` | 0 | No config key points to `deliver-webhook` |
| Recent logs | 0 | No invocations in the last 24 hours |

### E.2 Outbound Dependencies

`deliver-webhook` depends on:

- `https://esm.sh/@supabase/supabase-js@2.97.0`
- `https://deno.land/std@0.177.0/http/server.ts`
- `https://deno.land/std@0.177.0/encoding/base64.ts`
- Runtime env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WEBHOOK_DELIVERY_SECRET`
- Supabase RPC: `get_pending_webhook_deliveries`
- Supabase RPC: `mark_webhook_delivery`

None of these are unique to `deliver-webhook`; they are shared with `webhook-delivery` or are standard Supabase/Deno runtime dependencies.

### E.3 External Dependency Verification

Supabase MCP cannot determine whether an external third party is invoking `deliver-webhook`. No evidence of external usage was found:

- No repository references to the endpoint URL.
- No `cron.job` or database trigger references.
- No recent invocation logs.
- `public.webhook_deliveries` is empty.

**External usage cannot be conclusively ruled out by MCP; however, no positive evidence of external usage exists.**

---

## F. Risk Assessment

| Risk Area | Assessment | Mitigation |
|-----------|------------|------------|
| Production webhook delivery | **Low** | `webhook-delivery` provides the same functionality. `webhook_deliveries` table is empty, so no in-flight backlog. |
| Background processing | **Low** | No `pg_cron` or `pg_net` jobs reference `deliver-webhook`. |
| External integrations | **Unknown / Low** | No evidence of external callers. Risk is limited to any undocumented direct HTTP consumer. |
| Tenant / Admin Dashboard | **None** | Admin dashboard uses `WebhookManager.tsx` and `services/webhookService.ts`, which call database RPCs, not `deliver-webhook`. |
| Supabase infrastructure | **Low** | A stale, unused Edge Function consumes a small deployment slot. Undeploying removes the live endpoint before directory removal. |

### F.1 Double-Worker Risk

Because both `deliver-webhook` and `webhook-delivery` read from `get_pending_webhook_deliveries` and can call `mark_webhook_delivery` / update `webhook_deliveries`, having both deployed creates a potential race if both are ever triggered. Removing `deliver-webhook` removes this duplicate worker and eliminates the double-delivery risk.

---

## G. Final Decision

**Option A: SAFE TO DELETE**

`deliver-webhook` is a stale deployment of a superseded worker. It has no repository callers, no scheduler, no recent invocations, no database triggers, and no observed production dependency. `webhook-delivery` is the hardened replacement. The only remaining condition not yet satisfied is the active Supabase deployment, which must be removed first as part of the cleanup sequence.

---

## H. Governance Decision

### H.1 Classification

**Dead Artifact** — `supabase/functions/deliver-webhook`

### H.2 Required Cleanup Sequence

1. **Undeploy from production** (must be done first):
   ```bash
   supabase functions delete deliver-webhook --project-ref rsialbfjswnrkzcxarnj
   ```
   or via the Supabase Dashboard.
2. **Verify undeploy**: confirm `list_edge_functions` no longer includes `deliver-webhook`.
3. **Short observation window** (recommended): monitor `edge-function` logs for 24-48 hours for any 404 or unexpected calls to `deliver-webhook`.
4. **Remove repository directory**:
   ```
   supabase/functions/deliver-webhook/
   ```
5. **Commit and record**: update `REPOSITORY_HYGIENE_DECISION_REGISTER.md` and any charter/closeout tracking with the deletion authorization reference.
6. **Do NOT remove** `WEBHOOK_DELIVERY_SECRET` from Supabase secrets — it is still required by `webhook-delivery`.

### H.3 Verification Commands for Future Use

```bash
# Confirm undeploy
supabase functions list --project-ref rsialbfjswnrkzcxarnj

# Confirm no repository references before final commit
grep -ri "deliver-webhook" --exclude-dir=archive --exclude-dir=memory-zone --exclude-dir=ADMIN_DASHBOARD_PLAN .
```

---

## I. Tools and Sources Used

- `supabase-mcp-server`:
  - `list_projects`
  - `list_edge_functions`
  - `get_edge_function`
  - `get_logs`
  - `execute_sql`
- `codebase-memory`:
  - `list_projects`
  - `search_graph`
  - `query_graph`
- Git:
  - `git log --all --oneline -- supabase/functions/deliver-webhook`
  - `git show 4a61ee6f --stat`
  - `git log --first-parent master --oneline -- supabase/functions/webhook-delivery/index.ts`
- Repository grep for `deliver-webhook` and `webhook-delivery`.

---

*Report generated by governance verification. No source code, Edge Functions, or infrastructure were modified.*
