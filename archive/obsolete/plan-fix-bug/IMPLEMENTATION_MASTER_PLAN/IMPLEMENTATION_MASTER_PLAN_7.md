# IMPLEMENTATION_MASTER_PLAN_7.md

**Document 7 / 8 — Phase 4: Reliability & Scalability**

**VietSale Pro v7 — Admin Dashboard Enterprise Stabilization**

| Field | Value |
| --- | --- |
| **Document Position** | 7 / 8 |
| **Document Type** | Execution |
| **Phase** | Phase 4 — Reliability & Scalability |
| **Issues Covered** | MED-2, LOW-2, LOW-4 |
| **Estimated Effort** | 3–4 days |
| **Priority** | P1 |
| **Deployment Window** | Standard Deploy — Weekday 10:00 UTC+7 (cron changes during low-traffic window) |

---

## Document Purpose

This document covers **Phase 4: Reliability & Scalability**. It eliminates duplicate cron jobs, replaces all `getAll*` client-side full-table fetches with server-side paginated queries, and establishes a staging workflow with environment scripts, `.env.example`, and README documentation. These changes reduce database load, prevent double-processing of billing operations, and fix the developer workflow gap that contributed to the migration drift in the first place.

---

## Scope

- Consolidate duplicate billing cron jobs (MED-2)
- Create `cron_job_logs` table for cron monitoring
- Replace `getAll*` functions with server-side paginated queries (LOW-2)
- Update UI pagination controls (LOW-2)
- Add `dev:staging`, `build:staging`, `preview:staging` npm scripts (LOW-4)
- Create `.env.example` with all required Supabase variables (LOW-4)
- Document staging workflow in `README.md` (LOW-4)

## Covered Phases

Phase 4 — Reliability & Scalability

## Covered Issues

| Issue | Title | Severity |
| --- | --- | --- |
| MED-2 | Cron jobs overlap / duplicate scheduling | MEDIUM |
| LOW-2 | Client-side pagination fetches large pages | LOW |
| LOW-4 | `.env` points to production without documented staging process | LOW |

## Dependencies

- **Doc 6 (Phase 3)** must be complete with PASS outcome
- Phases 1–3 must all be stable
- Production monitoring baseline established (to compare post-Phase 4 query performance)

## Prerequisites

- [ ] Doc 6 / 8 Transition Checklist complete (PASS)
- [ ] Access to `cron.job` table to verify current cron job list
- [ ] Verify `create_renewal_invoices()` function signature (to confirm it handles both default and explicit params)
- [ ] Staging Supabase project URL and anon key available (for `.env.example`)
- [ ] Advisory lock logic in billing RPC confirmed (to prevent double-invoice risk)

## Required Skills

- pg_cron administration (verify, unschedule, reschedule)
- Supabase paginated queries (`.range()`, `count` option)
- React hook pagination patterns (`useAdminList` or equivalent)
- npm scripts / dotenv configuration

## Required MCP

- Supabase MCP or direct DB access for cron job management on production

---

## Why These Issues Belong Together

All three are operational and scalability improvements that do not touch security or schema correctness. MED-2 and LOW-2 both address wasteful resource usage (duplicate cron work + unnecessary full-table scans). LOW-4 addresses the developer workflow gap that led to migration drift in the first place. Grouping them in one phase minimizes deployment cycles for lower-priority operational improvements.

---

## Required Files

| File | Action | Issue |
| --- | --- | --- |
| `supabase/migrations/20260713000002_cron_consolidation.sql` | CREATE — drop duplicate cron jobs, create `cron_job_logs` table | MED-2 |
| `services/invoiceService.ts` (lines 123–142) | UPDATE — add pagination params; return `{items, totalCount, page, pageSize}` | LOW-2 |
| `services/bankAccountService.ts` (lines 27–31) | UPDATE — add pagination params | LOW-2 |
| `services/tenantService.ts` (lines 886–892) | UPDATE — add pagination params to `getStorageUsage` | LOW-2 |
| `services/admin/tenantAdminService.ts` (lines 43–60) | UPDATE — add pagination params to `getTenantsAdmin` | LOW-2 |
| `components/PaymentManager.tsx` (lines 54–70) | UPDATE — use paginated hook | LOW-2 |
| `components/InvoiceManager.tsx` (lines 100–109) | UPDATE — use paginated hook | LOW-2 |
| `components/InvoiceCreator.tsx` (line 29) | UPDATE — replace `limit: 1000` with paginated | LOW-2 |
| `pages/admin/Security.tsx` (line 36) | UPDATE — replace `pageSize: 1000` with paginated `listAccounts` | LOW-2 |
| `package.json` | UPDATE — add `dev:staging`, `build:staging`, `preview:staging` scripts | LOW-4 |
| `.env.example` | UPDATE/CREATE — add all required variables with placeholder values | LOW-4 |
| `README.md` | UPDATE — add "Switching Environments" section | LOW-4 |

---

## Required Database Changes

### 1. Cron Job Consolidation (MED-2)

**Pre-consolidation verification** (run before migration):

```sql
-- List all current cron jobs:
SELECT jobid, jobname, schedule, command, active
FROM cron.job
ORDER BY jobname;

-- Identify duplicates:
-- Expected duplicates:
--   renewal-invoice-daily  ←→  billing-renewal-daily  (same purpose)
--   admin-billing-reminders ←→  billing-reminders-daily (same purpose)
```

**Verify no business logic gap:**
```sql
-- Compare commands between duplicate pairs:
-- billing-renewal-daily:   SELECT public.create_renewal_invoices();
-- renewal-invoice-daily:   SELECT public.create_renewal_invoices(7);
-- → Verify create_renewal_invoices() default matches p_days_before = 7
--   If yes: drop renewal-invoice-daily (keep billing-renewal-daily)
--   If default differs: update billing-renewal-daily command to include explicit param
```

**Migration content:**
```sql
-- Drop duplicate cron jobs (after verifying which to keep):
SELECT cron.unschedule('renewal-invoice-daily');
SELECT cron.unschedule('admin-billing-reminders');

-- Create cron_job_logs table for monitoring:
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  error TEXT,
  advisory_lock_acquired BOOLEAN DEFAULT false
);

-- Add logging calls to remaining cron job RPCs (via migration or RPC update)
```

### Required RPC Changes

- `create_renewal_invoices()`: verify default parameter matches `p_days_before = 7`; update if needed
- Add `cron_job_logs` INSERT/UPDATE calls to `run_data_retention()`, `run_fraud_detection()`, `create_renewal_invoices()`, and `send_billing_reminders()` (or equivalent)

---

## Required UI Changes

All admin list views: add pagination controls (prev/next, page size selector).

Use existing `useAdminList` hook for consistent pagination pattern (if it exists); create one if not.

**Pagination standard:**
- Default page size: 20 items
- Controls: Previous / Next buttons + current page indicator
- Show total count where available

---

## Implementation Order

```
Step 1:  VERIFY CRON JOB STATE
         ├── SELECT * FROM cron.job ORDER BY jobname;
         ├── Identify exact jobids for: renewal-invoice-daily, admin-billing-reminders
         ├── Compare commands between each duplicate pair
         └── Confirm: create_renewal_invoices() default = p_days_before 7 (or document difference)

Step 2:  CONSOLIDATE CRON JOBS (migration)
         ├── Create migration: 20260713000002_cron_consolidation.sql
         ├── DROP renewal-invoice-daily (if safe — Step 1 verified)
         ├── DROP admin-billing-reminders (if safe — Step 1 verified)
         ├── CREATE cron_job_logs table
         ├── Deploy to staging; verify via: SELECT * FROM cron.job
         └── Deploy to production; verify

Step 3:  IMPLEMENT SERVER-SIDE PAGINATION — SERVICES
         ├── invoiceService.ts: getAllInvoices → getInvoicesPaginated(page, pageSize)
         │   Returns: {items: Invoice[], totalCount: number, page: number, pageSize: number}
         ├── bankAccountService.ts: add page/pageSize params
         ├── tenantService.ts: add page/pageSize to getStorageUsage
         └── tenantAdminService.ts: add page/pageSize to getTenantsAdmin

Step 4:  IMPLEMENT SERVER-SIDE PAGINATION — COMPONENTS
         ├── PaymentManager.tsx: use paginated hook; add pagination controls
         ├── InvoiceManager.tsx: use paginated hook; add pagination controls
         ├── InvoiceCreator.tsx: replace limit:1000 with paginated (first page default)
         └── Security.tsx: replace pageSize:1000 with paginated listAccounts

Step 5:  SET UP STAGING WORKFLOW
         ├── package.json: add scripts:
         │   "dev:staging": "VITE_SUPABASE_URL=$STAGING_URL VITE_SUPABASE_ANON_KEY=$STAGING_KEY vite"
         │   "build:staging": "VITE_SUPABASE_URL=$STAGING_URL VITE_SUPABASE_ANON_KEY=$STAGING_KEY vite build"
         │   "preview:staging": "vite preview"
         ├── .env.example: add all VITE_SUPABASE_* variables with placeholder values
         ├── README.md: add "Switching Environments" section with:
         │   - How to copy .env.example to .env.staging
         │   - How to populate with staging project values
         │   - How to run npm run dev:staging
         │   - Target: < 15 minutes from zero to working staging environment
         └── Test: npm run dev:staging connects to staging Supabase project

Step 6:  RUN REGRESSION TESTS
         ├── Invoice list: verify page 1 loads (≤ 20 items); Next loads page 2
         ├── Tenant admin list: verify paginated (not all tenants)
         ├── billing-renewal-daily cron: manually trigger; confirm success
         ├── billing-reminders-daily cron: manually trigger; confirm success
         └── All 36 smoke tests pass
```

---

## Validation Checklist

- [ ] Only one billing renewal cron job exists (`billing-renewal-daily`)
- [ ] Only one billing reminder cron job exists (`billing-reminders-daily`)
- [ ] `SELECT * FROM cron.job` shows no duplicate-purpose jobs
- [ ] `cron_job_logs` table created in production
- [ ] `cron_job_logs` table populated on cron execution (verify after next cron run)
- [ ] `create_renewal_invoices()` still generates correct renewal invoices
- [ ] Invoice list loads first page (≤ 20 items) instead of all invoices
- [ ] Invoice list "Next" page loads correctly
- [ ] Payments list loads first page instead of all payments
- [ ] Tenant admin list supports prev/next pagination
- [ ] `npm run dev:staging` uses staging Supabase project (verify by checking URL in browser)
- [ ] `npm run build:staging` builds successfully for staging
- [ ] `.env.example` contains all required variables with placeholder values
- [ ] README has staging/deployment documentation (≤ 15-minute onboarding)
- [ ] No `getAll*` functions without pagination remain in: `invoiceService.ts`, `bankAccountService.ts`, `tenantService.ts`, `tenantAdminService.ts` (verify via grep)

## Regression Checklist

- [ ] Cron jobs still execute billing logic correctly (manual trigger test)
- [ ] Invoice creation works end-to-end
- [ ] Payment confirmation still works
- [ ] Admin lists display correctly with pagination
- [ ] No full-table loads without limit (no `limit:1000` or `pageSize:1000` remaining — verify by grep)
- [ ] Build succeeds for both `npm run dev` and `npm run dev:staging`
- [ ] All 36 smoke tests pass

---

## Rollback Plan

1. **Cron jobs**: Re-schedule dropped duplicate jobs (`SELECT cron.schedule(...)`) if business logic divergence found post-consolidation
2. **Pagination**: Revert paginated services to `getAll*` versions (git revert per file) and redeploy
3. **Staging scripts**: `package.json` changes are additive — no rollback needed; simply do not use the new scripts
4. **Rollback trigger**: Billing invoices missing (cron logic gap detected) → immediately re-schedule dropped jobs
5. **Rollback time estimate**: 15 minutes

---

## Expected Outcome

- Reduced database load from paginated queries (no full-table scans on large datasets)
- Single cron job per billing function (easier to monitor, less wasted compute)
- Clear staging workflow documented for all developers
- No unbounded `getAll*` calls without explicit limits
- New developers can set up staging environment in < 15 minutes from README

---

## PASS/FAIL Criteria

| Criterion | Threshold | Weight |
| --- | --- | --- |
| No duplicate cron jobs | 0 duplicate-purpose jobs in cron.job | MUST PASS |
| Paginated queries | 0 unbounded SELECT without limit in listed services | MUST PASS |
| Staging scripts work | `npm run dev:staging` connects to staging project | MUST PASS |
| README updated | Staging section present and complete | MUST PASS |
| `.env.example` committed | All variables present with placeholders | MUST PASS |
| Smoke tests | All 36 pass | MUST PASS |
| Build succeeds | Zero errors | MUST PASS |

**Phase 4 Outcome: PASS ✅ / FAIL ❌**

---

## Phase 4 Regression Tests (from Global Testing Strategy)

- [ ] Invoice list → loads page 1 only (≤ 20 items)
- [ ] Invoice list "Next" → loads page 2
- [ ] Tenant admin list → paginated (not all tenants in one query)
- [ ] `billing-renewal-daily` cron → creates renewal invoices (only job remaining)
- [ ] `billing-reminders-daily` cron → sends reminders (only job remaining)
- [ ] `npm run dev:staging` → connects to staging Supabase project

---

## References to Previous Document

**Doc 6 / 8 — Phase 3: Frontend Hardening** (`IMPLEMENTATION_MASTER_PLAN_6.md`)

Must be completed (PASS) before this document. Phase 4 builds on the hardened and type-safe frontend delivered by Phase 3.

## References to Next Document

**Doc 8 / 8 — Phase 5: Continuous Compliance + Testing Strategy** (`IMPLEMENTATION_MASTER_PLAN_8.md`)

Covers: CI/CD checks for all Phase 1–4 fixes; RPC smoke tests; cron monitoring; penetration testing.
**Prerequisite**: This document (Doc 7) must be complete with PASS outcome before Doc 8 begins.

---

## Transition Checklist

Before continuing to Doc 8 / 8, the AI must verify:

- [ ] **PASS** — Phase 4 Validation Checklist complete (all items checked)
- [ ] **Validation Complete** — No duplicate cron jobs; paginated queries active; staging workflow functional
- [ ] **Review Complete** — Cron consolidation migration committed; `.env.example` committed; README updated; all changed service files committed
- [ ] **Regression Complete** — All 36 smoke tests pass; cron jobs executing billing logic correctly; build succeeds for both dev and dev:staging

*Doc 8 must not begin until all four items above are checked.*