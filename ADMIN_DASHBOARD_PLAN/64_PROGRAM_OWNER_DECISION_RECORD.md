# 64_PROGRAM_OWNER_DECISION_RECORD

**Document ID:** 64_PROGRAM_OWNER_DECISION_RECORD  
**Date:** 2026-07-22  
**Project:** VietSalePro  
**Sub Project:** Admin Dashboard  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** B — System Remediation  
**Wave:** Wave-04 Closeout  
**Acting Capacity:** Program Owner  
**Baseline:** AD-Baseline-1.0  
**Repository Scope:** `C:\PROJECT\vietsalepro` @ `3efa3f1a`  
**Authorized Commit:** `ce87b9d7` (`fix(services,config): Wave-04 residual hardening — canonical read RPCs and check-subdomain verify_jwt`)  
**Status:** PROGRAM OWNER DECISION RECORD COMPLETE — **WAVE-05 AUTHORIZED FOR PREPARATION**

------------------------------------------------------------------------

## 1. Purpose

Record the formal Program Owner governance decision following the completion of Wave-04.

This stage does **NOT** perform engineering work and does **NOT** authorize implementation.

This stage determines whether the remaining residual observation shall:

- remain Operational Backlog, or
- become a new governed remediation wave.

This document supersedes the PMO recommendation only. It does **NOT** invalidate any previous governance gate.

------------------------------------------------------------------------

## 2. Documents Reviewed

Every mandatory document was read completely. No section was skipped.

| # | Document | Disposition |
|---|---|---|
| 00 | `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` | Read in full |
| 12 | `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` | Read in full |
| 63 | `63_WAVE04_CLOSEOUT.md` | COMPLETE — CLOSED WITH OBSERVATIONS |
| 63A | `63A_WAVE04_CLOSEOUT_REPORT.md` | COMPLETE — CLOSED WITH OBSERVATIONS |
| 63B | `63B_WAVE05_RECOMMENDATION.md` | Reviewed — **PMO recommendation rejected by Program Owner** |
| 62 | `62_WAVE04_PRODUCTION_ACCEPTANCE_REVIEW.md` | ACCEPTED WITH OBSERVATIONS |
| 62A | `62A_WAVE04_PRODUCTION_ACCEPTANCE_REVIEW_REPORT.md` | ACCEPTED WITH OBSERVATIONS |
| 59R | `59R_WAVE04_PRODUCTION_DEPLOYMENT_AUTHORIZATION_REREVIEW.md` | AUTHORIZED WITH OBSERVATIONS |
| 59RA | `59RA_WAVE04_PRODUCTION_DEPLOYMENT_AUTHORIZATION_REREVIEW_REPORT.md` | AUTHORIZED WITH OBSERVATIONS |

------------------------------------------------------------------------

## 3. Codebase Memory MCP Verification

**MCP server:** `codebase-memory`  
**Action:** `index_repository` (fast mode) on `C:\PROJECT\vietsalepro`  
**Result:** `indexed` — 29,004 nodes, 42,651 edges, 0 skipped

| Graph / Check | Method | Result |
|---|---|---|
| Project | `index_repository` | `C-PROJECT-vietsalepro` |
| Repository graph | Indexed nodes/edges | 29,004 / 42,651 |
| Dependency graph | Cross-file LSP call/usage edges | Consistent, 0 skipped |
| Runtime graph | Route / function / RPC / Edge Function nodes | Consistent with authorized commit |
| Deployment graph | Vercel production deployment aligned to `ce87b9d7` | PASS |
| Environment graph | `.env`, `vite.config.ts`, Supabase client source | Production-only wiring confirmed |
| Governance graph | `ADMIN_DASHBOARD_PLAN` document nodes | Complete chain through `63`/`63A`/`63B` |
| Source drift `ce87b9d7..HEAD` | `git diff --stat` excluding `ADMIN_DASHBOARD_PLAN`, `.codebase-memory`, `package.json`, `package-lock.json` | 0 lines of application source drift |

**Codebase Memory Verdict:** The repository graph is fresh. No application-source drift is detected. The Wave-04 baseline is preserved.

------------------------------------------------------------------------

## 4. Git Verification

| Check | Method | Result |
|---|---|---|
| HEAD commit | `git rev-parse HEAD` | `3efa3f1a` — governance-only documentation update |
| Authorized source commit | `git rev-parse ce87b9d7` | `ce87b9d787401a3591aa3242257a3173f3cd9174` present and reachable |
| Current branch | `git branch --show-current` | `master` |
| Source changes `ce87b9d7..HEAD` | `git diff --stat ce87b9d7..HEAD -- . ':(exclude)ADMIN_DASHBOARD_PLAN' ':(exclude).codebase-memory' ':(exclude)package.json' ':(exclude)package-lock.json'` | 0 lines — no application source drift |
| Working-tree source changes | `git diff HEAD -- . ':(exclude)ADMIN_DASHBOARD_PLAN' ':(exclude).codebase-memory'` | `package.json` / `package-lock.json` validation-tooling diffs only |
| Working-tree modifications | `git status --short` | `.codebase-memory/*`, `ADMIN_DASHBOARD_PLAN/*.md`, `package.json` / `package-lock.json` |

| Change / Path | Classification |
|---|---|
| `.codebase-memory/*` | Infrastructure (AI development infrastructure) |
| `ADMIN_DASHBOARD_PLAN/*.md` and artifacts | Governance — Wave-04 closeout and Program Owner decision deliverables |
| `package.json`, `package-lock.json` | Tooling (validation tooling dev dependencies) |
| Application source under `services/`, `src/`, `lib/`, `supabase/`, etc. | None observed |

**Git Verdict:** The accepted Wave-04 source revision `ce87b9d7` remains frozen. All working-tree changes are governance, AI-infrastructure, or validation-tooling artifacts.

------------------------------------------------------------------------

## 5. PMO Recommendation Review

| Element | PMO Position (from `63B_WAVE05_RECOMMENDATION.md`) |
|---|---|
| Recommendation | **No Wave-05** — Operational Backlog |
| Justification | Single, pre-existing, out-of-scope import defect; a full governance wave is disproportionate |
| Residual risk | MEDIUM — `billing-webhooks` remains unavailable until fixed |
| Operational backlog rationale | One-line Deno import correction; no AD-Baseline-1.0 scope expansion; no architectural review required |

The PMO recommendation is acknowledged and reviewed. The Program Owner rejects the recommendation and overrides it for the reasons stated in Section 7.

------------------------------------------------------------------------

## 6. Residual Observation Review

| Observation | `billing-webhooks` Edge Function `BOOT_ERROR` |
|---|---|
| Current status | Still present in production; function status is `ACTIVE` but direct `POST` returns `503` |
| Symptom | `503` on direct `POST` to `billing-webhooks` |
| Root cause | `supabase/functions/billing-webhooks/index.ts` imports `decodeBase64` from `https://deno.land/std@0.177.0/encoding/base64.ts` |
| Scope | `supabase/functions/billing-webhooks/index.ts` only |
| Wave-04 scope | **Out-of-scope** |
| Baseline origin | **Not** from `AD-Baseline-1.0` |
| Pre-existing | Yes |
| Blocking | No |
| Business impact | LOW — does not affect the Admin Dashboard user path |
| Operational impact | MEDIUM — billing webhook ingestion is unavailable until the import is corrected |
| Security impact | LOW — no privilege escalation, data leakage, or bypass; function fails at boot |
| Production impact | LOW — the Wave-04 production deployment is accepted and verified |
| Repository ownership | Production repository (`C:\PROJECT\vietsalepro`) |

------------------------------------------------------------------------

## 7. Program Owner Decision

**OPTION B — Reject the PMO recommendation. Open Wave-05.**

The Program Owner overrides the PMO recommendation and authorizes preparation for a new governed remediation wave.

**Authorizations granted in this decision:**

- Preparation for Wave-05 is authorized.
- Wave-05 shall be scoped to the `billing-webhooks` Edge Function defect only.

**Authorizations explicitly NOT granted in this decision:**

- Wave-05 implementation is **NOT** authorized.
- Wave-05 Engineering Kickoff is **NOT** authorized.
- Wave-05 Deployment is **NOT** authorized.
- No application source, Edge Function, database, or migration may be modified.

------------------------------------------------------------------------

## 8. Decision Justification

The Program Owner overrides the PMO recommendation for the following objective reasons:

1. The remaining observation exists inside the production repository.
2. The defect is fully understood: an incorrect Deno standard-library `decodeBase64` import path.
3. The defect has a bounded implementation scope: one file (`supabase/functions/billing-webhooks/index.ts`) and one import correction.
4. The Program Owner requires the repository to be fully remediated before Program Certification.
5. The fix is operationally low-risk: a one-line import-path correction and redeploy of a single Edge Function.
6. No AD-Baseline-1.0 scope expansion is required.
7. The Wave-04 production deployment remains accepted; this decision does not reopen or invalidate Wave-04.

------------------------------------------------------------------------

## 9. Wave-05 Preparation

| Element | Preparation Detail |
|---|---|
| **Recommended Wave Name** | Wave-05 |
| **Recommended Objective** | Repair `billing-webhooks` Edge Function |
| **Recommended Scope** | Fix incorrect Deno `decodeBase64` import in `supabase/functions/billing-webhooks/index.ts` |
| **Redeploy** | `billing-webhooks` Edge Function to Production Supabase |
| **Verify** | Production runtime — direct `POST` returns `200` instead of `503`; function logs show successful boot |
| **Explicit Constraint** | **No additional scope may be added.** |

Wave-05 is authorized for preparation only. The `65 — Wave-05 Authorization` gate is the next governance stage and is **NOT** started by this decision.

------------------------------------------------------------------------

## 10. Roadmap Synchronization

The following governance documents are updated by this decision:

- `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md`
- `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md`

| Synchronization Item | Value |
|---|---|
| Current Stage | 64 — Program Owner Decision Record COMPLETE |
| Program Status | WAVE-04 CLOSEOUT COMPLETE (63); 64 — WAVE-05 AUTHORIZED FOR PREPARATION |
| Next Governance Stage | **65 — Wave-05 Authorization** |

------------------------------------------------------------------------

## 11. Final Governance Decision

**The Program Owner authorizes preparation for Wave-05.**

- The PMO recommendation in `63B_WAVE05_RECOMMENDATION.md` is **overridden**.
- Wave-05 is approved for preparation with the bounded scope defined in Section 9.
- Wave-05 implementation is **NOT** authorized.
- The `65 — Wave-05 Authorization` gate is **NOT** begun.

**STOP RULE:** Do **NOT** begin `65 — Wave-05 Authorization`. Wait for explicit Program Owner approval to proceed.

------------------------------------------------------------------------
