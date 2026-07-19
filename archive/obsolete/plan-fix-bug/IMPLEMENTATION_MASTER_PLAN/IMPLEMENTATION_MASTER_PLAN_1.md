# IMPLEMENTATION_MASTER_PLAN_1.md

**Document 1 / 8 — Project Foundation & Governance**

**VietSale Pro v7 — Admin Dashboard Enterprise Stabilization**

| Field | Value |
| --- | --- |
| **Document Position** | 1 / 8 |
| **Document Type** | Foundation & Reference |
| **Version** | 1.0 |
| **Status** | Authorized for Execution |
| **Date** | 2026-07-13 |
| **Author** | Enterprise Software Delivery Board |
| **Source Document** | `ADMIN_DASHBOARD_REMEDIATION_ANALYSIS.md` |
| **Total Issues** | 18 (4 CRIT, 4 HIGH, 6 MED, 4 LOW) |
| **Verified Issues** | 16 fully verified, 2 partially fixed |
| **Total Phases** | 5 |
| **Estimated Total Effort** | 4–6 weeks |

---

## Document Purpose

This document is the **mandatory foundation document** that every AI Agent must read before executing any other document in this plan. It establishes:

- The project situation and guiding principles
- Root cause architecture (the four systemic weaknesses)
- Issue dependency graph (what blocks what)
- The complete risk matrix
- The global testing strategy
- The global deployment strategy
- The global rollback strategy
- The global Definition of Done
- The implementation timeline and parallel work opportunities
- The complete success criteria

This document contains **no executable implementation steps**. Its sole purpose is to provide shared context and governance that all execution documents (Docs 2–8) inherit.

---

## Scope

- All project-level context and governance
- All 18 issues (reference only — execution is in Docs 2–8)
- All 5 phases (reference only — execution is in Docs 2–8)

## Covered Phases

Reference for all phases. No execution in this document.

## Covered Issues

Reference for all 18 issues. No execution in this document.

## Dependencies

None. This is the first document.

## Prerequisites

None. Read this document before any other.

## Required Skills

- Understanding of Supabase, PostgreSQL, pg_cron, Supabase Edge Functions
- Understanding of React/TypeScript frontend architecture
- Understanding of CI/CD pipelines (GitHub Actions)
- Understanding of Supabase RLS, SECURITY DEFINER functions, and EXECUTE grants

## Required MCP

None for this document.

---

## 1. Executive Summary

### 1.1 Situation

VietSale Pro v7 is an ERP platform serving multiple tenants on a shared Supabase backend. A comprehensive remediation audit (see `ADMIN_DASHBOARD_REMEDIATION_ANALYSIS.md`) of the admin dashboard surface identified **18 issues** spanning security, database, frontend reliability, and operations. The root causes are systemic—not isolated bugs—and trace back to **four core architectural weaknesses**:

1. **Auth & Authorization Model is Incomplete**: `is_system_admin()` does not recognize the `postgres` role used by pg_cron, EXECUTE grants to `anon`/`authenticated` are over-permissive, and admin route guards rely solely on client-side state.

2. **Migration & Schema Drift**: 9 local migrations have not been applied to production, 5 RPCs do not exist in production, duplicate migration timestamps exist, and production uses different timestamps than local for the same content.

3. **Frontend Reliability**: `useEffect` loaders lack cancellation, unsafe `as any` casts bypass type safety, empty catch blocks hide auth errors, and pagination fetches entire tables client-side.

4. **Operations & Developer Experience**: Cron jobs overlap, the two audit log tables are fragmented, `.env` points to production without a staging workflow, and edge functions lack proper webhook signature verification for Momo/VNPay.

### 1.2 Guiding Principle

> **Fix one Root Cause at a time, not one Issue at a time.**

Issues are grouped by root cause. Each phase resolves an entire root cause class. This eliminates duplicated work, reduces regression surface, and ensures each phase is independently deployable.

### 1.3 Bottom Line

- **Phase 1 (Security Lockdown + Migration Sync)** is the highest priority. It addresses 8 of 18 issues (CRIT-1, CRIT-2, CRIT-3, CRIT-4, HIGH-3, HIGH-4, MED-1, LOW-3). Deploy this first—it closes the most critical attack vectors and restores cron-based operations.
- **Phase 2 (Schema & Data Stability)** stabilizes data integrity with audit log consolidation, import_history creation, and delete-tenant verification.
- **Phase 3 (Frontend Hardening)** secures the admin route guard, adds loader cancellation, and enforces form validation.
- **Phase 4 (Reliability & Scalability)** fixes logging, pagination, cron consolidation, and staging environment.
- **Phase 5 (Continuous Compliance)** establishes CI/CD guardrails: migration checks, RPC smoke tests, security linting, and cron monitoring.

---

## 2. Project Health Overview

### 2.1 Current State Assessment

| Dimension | Status | Detail |
| --- | --- | --- |
| **Security Posture** | 🔴 Critical | `anon` can execute `add_system_admin`; 137 SECURITY DEFINER functions over-granted; webhook signature missing for Momo/VNPay |
| **Operational Integrity** | 🔴 Critical | Data retention + fraud detection cron jobs fail daily; 5 admin RPCs missing in production |
| **Schema Consistency** | 🟡 At Risk | 9 migrations not deployed; 136 vs 137 file count; duplicate timestamp `20260718000000` |
| **Frontend Reliability** | 🟡 At Risk | Race conditions on tab switches; `as any` casts; empty catch blocks; client-side only admin guard |
| **Developer Experience** | 🟡 At Risk | No staging scripts; `.env` hardcoded to production; overlapping cron jobs |
| **Test Coverage** | 🟡 At Risk | Smoke tests exist (36 files) but no RPC existence check, no migration linter in CI, no cron monitoring |

### 2.2 Overall Health Score: 42/100

**Rationale**: Two CRITICAL security vulnerabilities (privilege escalation, credential brute-force bypass) and two CRITICAL operational failures (cron jobs failing, missing RPCs) are unaddressed. The system is functional but operating in a degraded state with known attack surface.

---

## 3. Root Cause Map

### 3.1 The Four Systemic Root Causes

```
Root Cause A: Auth & Authorization Model
├── CRIT-1  (cron jobs fail — is_system_admin doesn't recognize postgres)
├── CRIT-3  (anon/authenticated can execute admin RPCs)
├── HIGH-4  (137 SECURITY DEFINER functions over-granted)
├── MED-1   (107 SECURITY DEFINER functions have mutable search_path)
└── MED-4   (admin route guard is client-side only)

Root Cause B: Migration & Schema Drift
├── CRIT-2  (5 RPCs missing in production)
├── HIGH-2  (import_history table missing)
├── HIGH-3  (9 migrations not deployed; 137 local vs 136 production)
└── LOW-3   (duplicate migration timestamp 20260718000000)

Root Cause C: Frontend Reliability
├── MED-5   (useEffect loaders lack cancellation)
├── MED-6   (unsafe as any casts; missing form validation)
├── LOW-1   (empty catch blocks hide auth errors)
└── LOW-2   (client-side pagination fetches entire tables)

Root Cause D: Operations & Developer Experience
├── CRIT-4  (edge functions missing webhook signature verification)
├── HIGH-1  (delete-tenant edge function 401/500 — likely already fixed)
├── MED-2   (cron job overlap/duplicate scheduling)
├── MED-3   (two audit log tables exist in parallel)
└── LOW-4   (.env points to production without staging process)
```

### 3.2 Root Cause → Phase Mapping

| Root Cause | Phase | Issues Resolved | Priority |
| --- | --- | --- | --- |
| A: Auth & Authorization | Phase 1, Phase 3 | CRIT-1, CRIT-3, HIGH-4, MED-1, MED-4 | P0 |
| B: Migration & Schema Drift | Phase 1, Phase 2 | CRIT-2, HIGH-2, HIGH-3, LOW-3 | P0 |
| C: Frontend Reliability | Phase 3 | MED-5, MED-6, LOW-1, LOW-2 | P1 |
| D: Operations & DevEx | Phase 2, Phase 4 | CRIT-4, HIGH-1, MED-2, MED-3, LOW-4 | P0/P1 |

---

## 4. Issue Dependency Graph

### 4.1 Blockers

```
HIGH-3 (migration drift)
└── BLOCKS ──→ CRIT-2 (missing RPCs)
└── BLOCKS ──→ HIGH-2 (missing import_history)
└── BLOCKS ──→ LOW-3  (duplicate timestamps)

CRIT-1 (is_system_admin broken for cron)
└── MUST COORDINATE WITH ──→ CRIT-3 (anon/authenticated grants)
└── MUST COORDINATE WITH ──→ HIGH-4 (all SECURITY DEFINER grants)
└── MUST COORDINATE WITH ──→ MED-1  (search_path fixes)

HIGH-4 (137 over-granted functions)
└── MUST BE FIXED WITH ──→ MED-1 (107 search_path issues)
                        (shared migration sweep over same functions)

MED-4 (client-side admin guard)
└── DEPENDS ON ──→ CRIT-3 + HIGH-4 resolution
                 (frontend guard is secondary to backend enforcement)

CRIT-4 (edge function webhook security)
└── DELIVERED IN ──→ Phase 2 (after migration sync)
                   (can be done independently but benefits from stable schema)
```

### 4.2 Parallelizable Work

- **Phase 1 Database work** + **Phase 1 Edge Function work** can run in parallel (different teams)
- **Phase 3 Frontend work** can run in parallel with **Phase 2 Schema work** (no shared state)
- **Phase 4 DevEx work** can run independently at any point

---

## 5. Risk Matrix

### 5.1 Technical Risk Assessment

| Risk | Likelihood | Impact | Phase | Mitigation |
| --- | --- | --- | --- | --- |
| Migration deployment fails in production | Medium | High | Phase 1 | Full backup + staging dry-run first |
| REVOKE breaks legitimate functionality | Medium | High | Phase 1 | Staged rollout; regrant list pre-audited |
| `is_system_admin()` change opens attack surface | Low | Critical | Phase 1 | Only `postgres` role added; no other changes |
| Cron job consolidation removes needed job | Low | Medium | Phase 4 | Verify business logic before dropping |
| Client-side guard broken by RPC failure | Low | Medium | Phase 3 | Fail-closed pattern in `isSystemAdmin()` |
| Audit log migration loses data | Low | High | Phase 2 | Keep deprecated table as backup; verify row counts |
| Pagination breaks admin list views | Medium | Low | Phase 4 | Component-by-component deployment |

### 5.2 Business Risk Assessment

| Risk | Likelihood | Impact | Phase | Mitigation |
| --- | --- | --- | --- | --- |
| Security vulnerability exploited before fix | Medium | Critical | Phase 1 | Deploy within 1 week of plan approval |
| Admin dashboard downtime during migration | Low | Medium | Phase 1 | Maintenance window; admin-only feature |
| Tenant billing interrupted by cron changes | Low | High | Phase 4 | Verify advisory locks prevent duplicate invoices |
| Data retention/fraud detection continues to fail | Already in progress | High | Phase 1 | Immediate priority; cron jobs not running for days |

### 5.3 Rollback Complexity

| Phase | Rollback Complexity | Rollback Time | Data Loss Risk |
| --- | --- | --- | --- |
| Phase 1 | High | 30 min | Low (backup available) |
| Phase 2 | Medium | 20 min | Low (deprecated table kept) |
| Phase 3 | Low | 10 min | None (frontend only) |
| Phase 4 | Medium | 15 min | Low (cron changes reversible) |
| Phase 5 | Low | 5 min | None (CI config only) |

---

## 6. Global Testing Strategy

### 6.1 TDD Approach: "Define What Should Be Tested Before Every Fix"

For every issue, define:

| Test Layer | What to Test | When to Run |
| --- | --- | --- |
| **Unit** | Individual function behavior (e.g., `isSystemAdmin()` returns correct boolean for each role) | On every commit |
| **Integration** | RPC existence + correct behavior (e.g., `add_system_admin` rejects `anon`) | On every PR |
| **Smoke** | End-to-end admin flows (e.g., admin can manage tenants, subscriptions, members) | Pre-deploy + post-deploy |
| **Security** | Penetration vectors (e.g., anon cannot escalate privilege) | Quarterly |
| **Performance** | Query response times (e.g., paginated queries return < 200ms) | Pre-Phase 4 baseline + post-Phase 4 |

### 6.2 Edge Cases

| Edge Case | Issue | Test |
| --- | --- | --- |
| `current_user` is neither `service_role`, `postgres`, nor authenticated | CRIT-1 | Returns `false` without error |
| `anon` JWT with modified claims trying to access admin RPC | CRIT-3 | Rejected by RLS + grant |
| Multiple cron jobs executing simultaneously | MED-2 | Advisory lock prevents duplicate processing |
| Very large dataset (10K+ records) | LOW-2 | Paginated query returns within 200ms for first page |
| Network failure during RPC call | MED-4 | `isSystemAdmin()` returns `false` (fail-closed) |
| Component unmount during data load | MED-5 | No setState on unmounted component error |
| Malformed Momo webhook payload | CRIT-4 | Rejected with 400, logged for review |
| Replay of Momo webhook after 5 minutes | CRIT-4 | Rejected (timestamp outside window) |

---

## 7. Global Deployment Strategy

### 7.1 Environment Pipeline

```
Developer Local → Staging (shbmzvfcenbybvyzclem) → Production (rsialbfjswnrkzcxarnj)
```

### 7.2 Deployment Windows

| Phase | Window Type | Duration | Day/Time |
| --- | --- | --- | --- |
| Phase 1 | Maintenance Window | 2 hours | Saturday 02:00–04:00 UTC+7 |
| Phase 2 | Standard Deploy | 30 min | Weekday 10:00 UTC+7 |
| Phase 3 | Standard Deploy | 30 min | Any time (frontend only) |
| Phase 4 | Standard Deploy | 30 min | Weekday 10:00 UTC+7 |
| Phase 5 | CI Config Only | 15 min | Any time |

### 7.3 Pre-Deployment Checklist (every phase)

- [ ] Full production database backup completed and verified
- [ ] All tests pass on staging
- [ ] `supabase lint` results reviewed
- [ ] Smoke test suite passes on staging
- [ ] Rollback plan reviewed and tested
- [ ] Stakeholder notification sent (for maintenance windows)
- [ ] Monitoring dashboards confirmed operational
- [ ] Team on standby for 2 hours post-deploy

### 7.4 Post-Deployment Verification (every phase)

- [ ] All smoke tests pass on production
- [ ] Cron jobs show SUCCESS in `cron.job_run_details` (if applicable)
- [ ] Admin dashboard loads and functions correctly
- [ ] No spike in error rates (monitor for 1 hour)
- [ ] No increase in 4xx/5xx responses
- [ ] Database CPU/memory within normal range
- [ ] Edge function invocation rates normal

---

## 8. Global Rollback Strategy

### 8.1 General Principles

1. **Database changes cannot be cleanly rolled back.** Mitigation: always take full backup before any migration.
2. **Edge function changes can be rolled back** by redeploying previous version from git.
3. **Frontend changes can be rolled back** by reverting Vercel deployment.
4. **Cron job changes can be rolled back** by re-scheduling dropped jobs.

### 8.2 Rollback Decision Criteria

Trigger immediate rollback if:
- Error rate spikes > 5x baseline within 15 minutes of deploy
- Critical functionality broken (tenant creation, billing, login)
- Database integrity issue detected (row count mismatch, constraint violation)
- Security regression (previously-fixed vulnerability reintroduced)

Do NOT rollback for:
- Minor UI glitches (fix forward)
- Non-blocking performance regression < 20%
- New but non-critical warnings in logs

---

## 9. Global Implementation Timeline

### 9.1 Sequential Phase Dependency

```
Phase 1 (Security + Migration)
  │
  ├── Phase 2 (Schema Stability)
  │     │
  │     └── Phase 3 (Frontend Hardening)
  │           │
  │           └── Phase 4 (Reliability)
  │                 │
  │                 └── Phase 5 (Continuous Compliance)
  │
  └── (Phase 5 CI/CD checks can begin in parallel after Phase 1)
```

### 9.2 Timeline

| Week | Phase | Key Deliverables |
| --- | --- | --- |
| **Week 1** | Phase 1 | Security hardening migration, migration sync, edge function webhook fix |
| **Week 2** | Phase 2 | Audit log consolidation, import_history, delete-tenant verification |
| **Week 3** | Phase 3 | Admin route guard, loader cancellation, Zod validation, catch fix |
| **Week 4** | Phase 4 | Cron consolidation, server-side pagination, staging workflow |
| **Week 5–6** | Phase 5 | CI/CD checks, penetration test, monitoring |

### 9.3 Parallel Work Opportunities

| Team | Week 1 | Week 2 | Week 3 | Week 4 |
| --- | --- | --- | --- | --- |
| **Backend/DB** | Phase 1 (security migration, migration sync) | Phase 2 (audit log, import_history) | — | Phase 4 (cron consolidation) |
| **Edge/Functions** | Phase 1 (webhook sigs) | Phase 2 (delete-tenant verify) | — | — |
| **Frontend** | — | — | Phase 3 (all frontend hardening) | Phase 4 (pagination UI) |
| **DevOps** | — | — | — | Phase 4 (staging scripts) |
| **QA** | Phase 1 testing | Phase 2 testing | Phase 3 testing | Phase 4 testing, Phase 5 setup |

---

## 10. Global Definition of Done

### 10.1 Global DoD

All 18 issues are resolved when:

- [ ] `CRIT-1`: Cron jobs succeed for 3 consecutive runs over 24 hours
- [ ] `CRIT-2`: All 5 RPCs exist in production and function correctly
- [ ] `CRIT-3`: `anon`/`authenticated` cannot execute admin RPCs (verified by pen test)
- [ ] `CRIT-4`: Momo/VNPay/bank_transfer webhooks rejected without valid signature
- [ ] `HIGH-1`: delete-tenant edge function confirmed stable (0 errors in 7 days)
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

### 10.2 Operational Acceptance Criteria

- [ ] All 5 CI/CD checks active and passing (Phase 5)
- [ ] Cron monitoring alert tested (trigger + notification received)
- [ ] First quarterly penetration test completed
- [ ] All 36 smoke tests passing
- [ ] Build pipeline passing
- [ ] 0 new `supabase lint` security advisories

---

## 11. Global Success Criteria

### 11.1 Technical Success Criteria

| # | Criterion | How Measured |
| --- | --- | --- |
| SC-1 | All CRITICAL and HIGH issues resolved | 8/8 issues with verified fixes |
| SC-2 | All MEDIUM and LOW issues resolved | 10/10 issues with verified fixes |
| SC-3 | `supabase lint` passes without new advisories | 0 new `anon_security_definer_function_executable` |
| SC-4 | All 5 RPCs exist in production | `information_schema.routines` query |
| SC-5 | 0 unapplied migrations | Production migration count = local migration count |
| SC-6 | Cron jobs succeeding | 24-hour monitoring of `cron.job_run_details` |
| SC-7 | Admin dashboard loads without race conditions | 0 "unmounted component" warnings in 30-min test |
| SC-8 | Webhook signatures enforced | Momo/VNPay unsigned requests rejected |
| SC-9 | CI/CD pipeline catches regressions | 5 automated checks active |
| SC-10 | All smoke tests pass | 36/36 passing |

### 11.2 Business Success Criteria

| # | Criterion | How Measured |
| --- | --- | --- |
| BC-1 | No privilege escalation possible | Penetration test confirms `anon` cannot execute admin RPCs |
| BC-2 | Data retention policy enforced | Cron job `data-retention-daily` succeeds daily for 7 consecutive days |
| BC-3 | Fraud detection operational | Cron job `fraud-detection-hourly` succeeds hourly for 24 consecutive hours |
| BC-4 | Admin features functional | All 5 previously-missing RPCs working in admin dashboard |
| BC-5 | Audit trail complete | All admin operations logged to single audit table |
| BC-6 | Developer onboarding clear | New developer can set up staging environment from README in < 15 minutes |

### 11.3 Exit Criteria (Plan Complete)

The Implementation Master Plan is complete when:
1. All 5 phases have PASS outcomes
2. All 18 issues are resolved and verified
3. All 10 Technical Success Criteria are met
4. All 6 Business Success Criteria are met
5. Phase 5 CI/CD checks are live and blocking regressions
6. First quarterly penetration test report is clean

---

## 12. Reference Documents

| Document | Path | Purpose |
| --- | --- | --- |
| Remediation Analysis | `Plan-Fix-Bug/ADMIN_DASHBOARD_REMEDIATION_ANALYSIS.md` | Single Source of Truth |
| Audit Report | `AUDIT_REPORT.md` | Original 18-issue audit |
| RPC Contracts | `docs/admin-dashboard/RPC_CONTRACTS.md` | Expected RPC signatures |
| System Admin Feature Plan | `PLAN_CREATE_SYSTEM_ADMIN.md` | System admin architecture |
| Security Fix Plan | `FIX_PLAN_USER_MANAGEMENT_SECURITY.md` | Related security plan |
| Deployment Guide | `DEPLOYMENT_SYSTEM_ADMIN_FEATURE.md` | Deployment procedures |
| Test Guide | `tests/integration/INTEGRATION_TEST_GUIDE.md` | Integration test patterns |

---

## 13. Stakeholder Sign-off

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| Principal Software Architect | | | |
| Principal Full Stack Engineer | | | |
| Senior Supabase Architect | | | |
| Senior PostgreSQL Database Architect | | | |
| Senior DevOps Engineer | | | |
| Senior QA Automation Engineer | | | |
| Senior Security Engineer | | | |
| Principal Code Auditor | | | |
| Enterprise Technical Project Manager | | | |

---

## References to Previous Document

None. This is the first document.

## References to Next Document

**Doc 2 / 8 — Phase 1-A: Migration Sync** (`IMPLEMENTATION_MASTER_PLAN_2.md`)

Covers: HIGH-3, CRIT-2, LOW-3
Execution: Resolve duplicate migration timestamps, deploy 9 missing migrations, verify 5 RPCs exist in production.

---

## Transition Checklist

Before continuing to Doc 2 / 8, the AI must verify:

- [ ] **PASS** — Doc 1 fully read and understood
- [ ] **Validation Complete** — All 4 root causes understood
- [ ] **Review Complete** — Issue dependency graph reviewed; execution order confirmed
- [ ] **Regression Complete** — Global rollback strategy understood; team backup plan in place

*No implementation begins until this checklist is complete.*