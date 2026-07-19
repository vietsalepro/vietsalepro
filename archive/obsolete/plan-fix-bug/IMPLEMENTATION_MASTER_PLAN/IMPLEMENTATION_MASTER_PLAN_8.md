# IMPLEMENTATION_MASTER_PLAN_8.md

**Document 8 / 8 — Phase 5: Continuous Compliance + Testing Strategy**

**VietSale Pro v7 — Admin Dashboard Enterprise Stabilization**

| Field | Value |
| --- | --- |
| **Document Position** | 8 / 8 |
| **Document Type** | Execution — Final Document |
| **Phase** | Phase 5 — Continuous Compliance (Ongoing) |
| **Issues Covered** | HIGH-3, CRIT-2, CRIT-3, CRIT-4, MED-1, CRIT-1 (ongoing prevention) |
| **Estimated Effort** | 5–7 days |
| **Priority** | P1 |
| **Deployment Window** | CI Config — Any time (no maintenance window required) |

---

## Document Purpose

This document covers **Phase 5: Continuous Compliance** — the final phase of the implementation plan. It embeds five automated CI/CD checks into the development pipeline to prevent regression of every issue fixed in Phases 1–4, establishes quarterly penetration testing, and activates cron job monitoring with alerting. After this document completes with PASS, the full Implementation Master Plan is considered **complete** and the project exits the remediation program.

This document also consolidates the **complete regression test inventory** for all phases (Phase-specific regression tests are listed in their respective documents; this document lists the final global verification).

---

## Scope

- CI/CD Check 1: Migration drift detection (blocks merge on unapplied local migrations)
- CI/CD Check 2: DB security lint (blocks merge on new `anon_security_definer_function_executable`)
- CI/CD Check 3: RPC smoke test (blocks merge if any frontend-referenced RPC missing in staging)
- CI/CD Check 4: Cron job monitoring (alerts within 15 minutes of job failure)
- CI/CD Check 5: Quarterly penetration test procedure documented and executed
- Global final verification: all 18 issues confirmed resolved

## Covered Phases

Phase 5 — Continuous Compliance (ongoing prevention of Phases 1–4 regressions)

## Covered Issues (ongoing prevention)

| Issue | Concern Prevented |
| --- | --- |
| HIGH-3 | Migration drift recurrence |
| CRIT-2 | Missing RPCs in production (before merge) |
| CRIT-3 | New over-granted admin functions introduced |
| CRIT-4 | Edge function security regressions |
| MED-1 | New SECURITY DEFINER functions without search_path |
| CRIT-1 | Cron job failures (alert within 15 min) |

## Dependencies

- **Doc 7 (Phase 4)** must be complete with PASS outcome
- All Phases 1–4 must be confirmed stable
- GitHub Actions (or equivalent CI) must be available
- Supabase project access from CI (service_role key in CI secrets)

## Prerequisites

- [ ] Doc 7 / 8 Transition Checklist complete (PASS)
- [ ] All Phases 1–4 PASS outcomes confirmed
- [ ] GitHub Actions workflow access
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL` available as CI secrets
- [ ] Staging project accessible from CI
- [ ] Alert delivery method configured (Slack webhook or email SMTP) for cron monitoring
- [ ] Penetration test team identified (internal or external)

## Required Skills

- GitHub Actions YAML
- `supabase lint` CLI output parsing
- Node.js/TypeScript scripting for RPC contract audit
- pg_cron log querying
- Basic penetration testing (or access to external pen tester)

## Required MCP

- GitHub MCP (for creating workflow files and CI configuration)
- Supabase MCP (for running lint and migration checks in CI context)

---

## Why These Issues Belong Together

All five CI/CD checks are governance infrastructure that prevents recurrence of the same root causes fixed in Phases 1–4. They cannot be built before Phases 1–4 are complete because they need the stable baseline those phases establish (e.g., the migration lint check needs a clean migration state; the security lint check needs the post-Phase-1 baseline). Grouping them together ensures the entire compliance infrastructure is built and tested in one focused pass.

---

## Required Files

| File | Action |
| --- | --- |
| `.github/workflows/ci-compliance.yml` | CREATE — main CI compliance workflow |
| `scripts/audit-rpc-contracts.ts` | VERIFY/UPDATE — extract all `supabase.rpc('...')` calls from services; query `information_schema.routines`; report missing |
| `scripts/cron-monitor.ts` | CREATE — query `cron.job_run_details` for failures; send alert |
| `scripts/check-migration-drift.ts` | CREATE — compare local migration files to applied migrations in staging |

---

## Implementation Order

```
Step 1:  CI/CD CHECK 1 — MIGRATION DRIFT DETECTION
         ├── Create script: scripts/check-migration-drift.ts
         │   Logic:
         │   - List local migration files in supabase/migrations/
         │   - Query staging: SELECT version FROM supabase_migrations.schema_migrations
         │   - Find local files not in staging applied list
         │   - Find duplicate timestamps in local files
         │   - Exit 1 (fail) if: any unapplied local migrations found
         │   - Exit 1 (fail) if: any duplicate timestamps found
         │   - Warn (exit 0) if: staging and production timestamps differ for same content
         ├── Add to CI workflow: runs on every PR to main
         └── Test: introduce a fake unapplied migration → CI fails; remove → CI passes

Step 2:  CI/CD CHECK 2 — DB SECURITY LINT
         ├── CI workflow step: run supabase lint --db-url $STAGING_DB_URL
         ├── Script: parse lint output for anon_security_definer_function_executable
         ├── Compare count against baseline (post-Phase 1 value = target)
         ├── Fail if: count increased above baseline
         ├── Block merge if: new security advisories introduced
         └── Test: temporarily grant anon EXECUTE on a test function → CI fails; revoke → CI passes

Step 3:  CI/CD CHECK 3 — RPC SMOKE TEST
         ├── Update/verify: scripts/audit-rpc-contracts.ts
         │   Logic:
         │   - Grep/parse all supabase.rpc('functionName') calls in services/
         │   - Query staging information_schema.routines for each extracted name
         │   - Report: missing RPCs (exist in code, not in staging)
         │   - Exit 1 if: any RPC missing
         ├── Add to CI workflow: runs on every PR (after migration deploy to staging)
         └── Test: reference a non-existent RPC in a service → CI fails; remove → CI passes

Step 4:  CI/CD CHECK 4 — CRON MONITORING
         ├── Create script: scripts/cron-monitor.ts
         │   Logic:
         │   - Query: SELECT * FROM cron.job_run_details
         │             WHERE status = 'failed'
         │             AND run_time > now() - interval '1 hour'
         │   - If failures: send alert to configured Slack webhook or email
         │   - Log: job name, error message, run_time
         ├── Deploy: run every 15 minutes (via Supabase cron OR external cron service)
         ├── Add cron health summary to SystemHealthPanel component
         └── Test: manually set a cron job to fail → alert fires within 15 minutes

Step 5:  CI/CD CHECK 5 — PENETRATION TESTING PROCEDURE
         ├── Document procedure in README.md (or docs/SECURITY_TESTING.md):
         │   Test 1: Call add_system_admin with anon JWT → must return permission denied
         │   Test 2: Call unlock_login_attempts with anon JWT → must return permission denied
         │   Test 3: Send unsigned Momo/VNPay webhook → must return 400
         │   Test 4: Access /admin/* without system_admin role → must redirect to /forbidden
         │   Test 5: Cross-tenant data access via modified RLS → must return empty
         ├── EXECUTE FIRST PENETRATION TEST (run all 5 tests manually)
         ├── Document results
         └── Schedule quarterly recurrence

Step 6:  COMPOSE FULL CI WORKFLOW FILE
         ├── .github/workflows/ci-compliance.yml contains all checks:
         │   - On: pull_request targeting main
         │   - Job: migration-drift (Check 1)
         │   - Job: security-lint (Check 2)
         │   - Job: rpc-smoke-test (Check 3)
         │   (Cron monitoring is deployed separately as a scheduled function)
         ├── All jobs must pass before merge is allowed (required status checks)
         └── Document CI checks in README.md

Step 7:  FINAL GLOBAL VERIFICATION
         ├── Verify all 18 issue DoD items (see Global DoD checklist below)
         ├── Verify all 10 Technical Success Criteria (from Doc 1)
         ├── Verify all 6 Business Success Criteria (from Doc 1)
         └── Issue Final Plan PASS/FAIL verdict
```

---

## Validation Checklist

### CI/CD Checks
- [ ] CI fails when local has unapplied migrations (Check 1 tested)
- [ ] CI fails when duplicate timestamps detected (Check 1 tested)
- [ ] CI fails when new `anon_security_definer_function_executable` functions introduced (Check 2 tested)
- [ ] RPC smoke test passes on all current PRs (Check 3 active)
- [ ] RPC smoke test fails when a missing RPC is introduced (Check 3 tested)
- [ ] Cron failure alert fires within 15 minutes of job failure (Check 4 tested)
- [ ] All 3 required status checks block merge in GitHub branch protection rules (Checks 1–3)
- [ ] Cron monitoring active for 1 week without false positives (Check 4 stabilized)

### Penetration Test
- [ ] Test 1: `add_system_admin` with anon JWT → permission denied ✅
- [ ] Test 2: `unlock_login_attempts` with anon JWT → permission denied ✅
- [ ] Test 3: unsigned Momo/VNPay webhook → 400 ✅
- [ ] Test 4: /admin/* without system_admin role → /forbidden redirect ✅
- [ ] Test 5: cross-tenant data access → empty result ✅
- [ ] First quarterly penetration test report documented with no CRITICAL findings
- [ ] Quarterly recurrence scheduled

### CI Pipeline Documentation
- [ ] CI checks documented in README.md
- [ ] `scripts/check-migration-drift.ts` committed and tested
- [ ] `scripts/audit-rpc-contracts.ts` committed and tested
- [ ] `scripts/cron-monitor.ts` committed and deployed

## Regression Checklist

- [ ] All 36 smoke tests pass
- [ ] CI does NOT fail on current clean codebase state (no false positives)
- [ ] All Phases 1–4 outcomes remain stable (no regressions introduced by CI config)
- [ ] Build succeeds

---

## Rollback Plan

1. **CI checks**: Disable individual checks via GitHub branch protection settings (does not affect codebase)
2. **Cron monitoring**: Disable monitoring script via Supabase cron unschedule if false positives occur
3. **No database changes**: Phase 5 is CI config only
4. **Rollback time estimate**: 5 minutes

---

## Global Final Verification — All 18 Issues

Upon Phase 5 PASS, confirm:

| Issue | Severity | Resolved In | Status |
| --- | --- | --- | --- |
| CRIT-1 | CRITICAL | Doc 3 + Doc 4 | `is_system_admin()` postgres fix; cron jobs running |
| CRIT-2 | CRITICAL | Doc 2 | All 5 RPCs confirmed in production |
| CRIT-3 | CRITICAL | Doc 3 | anon/authenticated cannot execute admin RPCs |
| CRIT-4 | CRITICAL | Doc 4 + Doc 5 | Webhook signatures enforced; confirmed stable |
| HIGH-1 | HIGH | Doc 5 | delete-tenant 0 errors in 7-day log window |
| HIGH-2 | HIGH | Doc 5 | import_history created or dead code removed |
| HIGH-3 | HIGH | Doc 2 | 0 unapplied migrations; production = local |
| HIGH-4 | HIGH | Doc 3 | 137 functions audited; grants restricted |
| MED-1 | MEDIUM | Doc 3 | 107 functions have SET search_path TO 'public' |
| MED-2 | MEDIUM | Doc 7 | No duplicate cron jobs |
| MED-3 | MEDIUM | Doc 5 | Single audit log table (app_audit_log) |
| MED-4 | MEDIUM | Doc 6 | Admin route guard uses isSystemAdmin() RPC |
| MED-5 | MEDIUM | Doc 6 | All admin useEffect loaders have AbortController |
| MED-6 | MEDIUM | Doc 6 | No as any in services/admin/; Zod validation active |
| LOW-1 | LOW | Doc 6 | Empty catch blocks replaced with error logging |
| LOW-2 | LOW | Doc 7 | All admin lists use server-side pagination |
| LOW-3 | LOW | Doc 2 | No duplicate migration timestamps |
| LOW-4 | LOW | Doc 7 | Staging scripts exist; .env.example complete; README updated |

**All 18 issues: ✅ RESOLVED**

---

## Global DoD Final Checklist (from Doc 1)

- [ ] `CRIT-1`: Cron jobs succeed for 3 consecutive runs over 24 hours
- [ ] `CRIT-2`: All 5 RPCs exist in production and function correctly
- [ ] `CRIT-3`: `anon`/`authenticated` cannot execute admin RPCs (verified by pen test)
- [ ] `CRIT-4`: Momo/VNPay/bank_transfer webhooks rejected without valid signature
- [ ] `HIGH-1`: delete-tenant confirmed stable (0 errors in 7 days)
- [ ] `HIGH-2`: `import_history` table created or dead code removed
- [ ] `HIGH-3`: 0 unapplied migrations; production and local in sync
- [ ] `HIGH-4`: 137 functions audited; grants restricted to minimum necessary
- [ ] `MED-1`: 107 functions have `SET search_path TO 'public'`
- [ ] `MED-2`: No duplicate cron jobs; single job per function
- [ ] `MED-3`: Single audit log table; all triggers write to `app_audit_log`
- [ ] `MED-4`: Admin route guard uses server-side RPC verification
- [ ] `MED-5`: All admin page `useEffect` loaders have cancellation
- [ ] `MED-6`: No `as any` in services/admin/; Zod validation on sensitive forms
- [ ] `LOW-1`: Empty catch blocks replaced with error logging
- [ ] `LOW-2`: All admin list queries use server-side pagination
- [ ] `LOW-3`: No duplicate migration timestamps
- [ ] `LOW-4`: Staging scripts exist; `.env.example` complete; README updated

## Operational Acceptance Criteria Final Checklist

- [ ] All 5 CI/CD checks active and passing (Checks 1–3 in GitHub CI; Check 4 as scheduled function; Check 5 quarterly)
- [ ] Cron monitoring alert tested (trigger + notification received)
- [ ] First quarterly penetration test completed with no CRITICAL findings
- [ ] All 36 smoke tests passing
- [ ] Build pipeline passing
- [ ] 0 new `supabase lint` security advisories

---

## PASS/FAIL Criteria

| Criterion | Threshold | Weight |
| --- | --- | --- |
| Migration check in CI | Blocks merge on drift | MUST PASS |
| Security lint in CI | Blocks merge on new advisories | MUST PASS |
| RPC smoke test in CI | Catches missing RPCs before merge | MUST PASS |
| Cron alerting | Alerts within 15 min of failure | MUST PASS |
| Pen test | Clean quarterly report (no CRITICAL findings) | MUST PASS |
| All 18 issues verified | 18/18 resolved | MUST PASS |
| All smoke tests | All 36 pass | MUST PASS |

**Phase 5 Outcome: PASS ✅ / FAIL ❌**

**IMPLEMENTATION MASTER PLAN FINAL OUTCOME: PASS ✅ / FAIL ❌**

(Final outcome = PASS only if all 8 documents have PASS outcome)

---

## Health Score Exit Target

| After Phase 5 PASS | Target Score |
| --- | --- |
| All 18 issues resolved | 100 / 100 |

Baseline was: **42 / 100**

---

## References to Previous Document

**Doc 7 / 8 — Phase 4: Reliability & Scalability** (`IMPLEMENTATION_MASTER_PLAN_7.md`)

Must be completed (PASS) before this document. Provides the stable Phase 4 baseline that Phase 5 CI checks protect against regression.

## References to Next Document

None. This is the final document.

---

## Transition Checklist

This is the final document. Upon completion:

- [ ] **PASS** — Phase 5 Validation Checklist complete (all items checked)
- [ ] **Validation Complete** — All 5 CI/CD checks active; all 18 issues verified resolved; pen test clean
- [ ] **Review Complete** — All CI workflow files committed; monitoring deployed; scripts committed and tested
- [ ] **Regression Complete** — All 36 smoke tests pass; no false positives in CI; all Phases 1–4 remain stable

**When all four items above are checked:**

✅ **The VietSale Pro v7 Admin Dashboard Enterprise Stabilization Implementation Master Plan is COMPLETE.**

*No further implementation is authorized under this plan. New issues discovered post-completion should be tracked in a new remediation cycle.*