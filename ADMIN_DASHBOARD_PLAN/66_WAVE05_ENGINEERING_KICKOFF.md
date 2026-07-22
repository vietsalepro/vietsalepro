# 66_WAVE05_ENGINEERING_KICKOFF

**Document ID:** 66_WAVE05_ENGINEERING_KICKOFF  
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
**Repository Artifacts Modified:** `66_WAVE05_ENGINEERING_KICKOFF.md`, `66A_WAVE05_ENGINEERING_KICKOFF_REPORT.md`, `66B_WAVE05_IMPLEMENTATION_SPECIFICATION.md`, and status sections of `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` and `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` only  
**Status:** Wave-05 Engineering Kickoff COMPLETE — **READY FOR IMPLEMENTATION READINESS REVIEW**

------------------------------------------------------------------------

# 1. Executive Summary

This document is the formal Wave-05 Engineering Kickoff for Phase B of the Admin Dashboard System Remediation Program. It is a governance-only planning stage. It does **not** authorize implementation, verification, acceptance, deployment, or closeout.

Wave-05 is authorized to restore production billing webhook reliability by correcting a single Deno standard-library import error in `supabase/functions/billing-webhooks/index.ts`. The root cause is fully understood: the file imports `decodeBase64` from `https://deno.land/std@0.177.0/encoding/base64.ts`, but that module exports `decode` and `encode`, not `decodeBase64`. The correction is one import line.

**Engineering Kickoff Decision:**

``` text
WAVE-05 ENGINEERING KICKOFF COMPLETE — READY FOR IMPLEMENTATION READINESS REVIEW
```

**Implementation Readiness Decision:**

- Wave-05 Implementation Readiness Review document creation: **AUTHORIZED and READY TO START**.
- Wave-05 Implementation Readiness Review execution: **NOT AUTHORIZED** until the review document is produced.
- Wave-05 Implementation: **NOT AUTHORIZED**.

------------------------------------------------------------------------

# 2. Documents Reviewed

The following mandatory governance documents were read in full before this Engineering Kickoff was completed. No section was skipped.

| # | Document | Role in Engineering Kickoff | Disposition |
|---|----------|-----------------------------|-------------|
| 00 | `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` | Program charter, current status, transition rules | Read in full |
| 12 | `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` | Master Plan roadmap, program status, quality gates | Read in full |
| 63 | `63_WAVE04_CLOSEOUT.md` | Wave-04 closeout decision | COMPLETE — CLOSED WITH OBSERVATIONS |
| 63A | `63A_WAVE04_CLOSEOUT_REPORT.md` | Wave-04 closeout evidence | COMPLETE — CLOSED WITH OBSERVATIONS |
| 63B | `63B_WAVE05_RECOMMENDATION.md` | PMO recommendation for residual observation | Reviewed — **overridden by Program Owner** |
| 64 | `64_PROGRAM_OWNER_DECISION_RECORD.md` | Program Owner decision to prepare Wave-05 | COMPLETE — WAVE-05 AUTHORIZED FOR PREPARATION |
| 64A | `64A_PROGRAM_OWNER_DECISION_REPORT.md` | Program Owner decision evidence | COMPLETE — WAVE-05 AUTHORIZED FOR PREPARATION |
| 65 | `65_WAVE05_AUTHORIZATION.md` | Wave-05 authorization decision | AUTHORIZED WITH OBSERVATIONS |
| 65A | `65A_WAVE05_AUTHORIZATION_REPORT.md` | Wave-05 authorization evidence | AUTHORIZED WITH OBSERVATIONS |

**Governance Verdict:** The Wave-04 closeout and Wave-05 authorization chain is intact and consecutive. Engineering Kickoff is authorized to proceed.

------------------------------------------------------------------------

# 3. Codebase Memory MCP Verification

**MCP server:** `codebase-memory`  
**Action:** `index_repository` (fast mode) on `C:\PROJECT\vietsalepro`  
**Result:** `indexed` — 29,069 nodes, 42,712 edges, 0 skipped

| Graph / Check | Method | Result |
|---------------|--------|--------|
| Repository graph | Indexed nodes / edges | 29,069 / 42,712 |
| Dependency graph | Cross-file LSP call/usage edges | Consistent, 0 skipped |
| Runtime graph | Route / function / RPC / Edge Function nodes | Consistent with authorized commit `ce87b9d7` |
| Edge Function graph | `billing-webhooks` source module present and indexed | `supabase/functions/billing-webhooks/index.ts` |
| Deployment graph | Vercel production deployment aligned to `ce87b9d7` | PASS |
| Environment graph | `.env`, `vite.config.ts`, Supabase client source | Production-only wiring confirmed |
| Governance graph | `ADMIN_DASHBOARD_PLAN` document nodes | Complete chain through `63`/`63A`/`63B` → `64`/`64A` → `65`/`65A` → `66`/`66A`/`66B` |
| Source drift `ce87b9d7..HEAD` | `git diff --stat` excluding `ADMIN_DASHBOARD_PLAN`, `.codebase-memory`, `package.json`, `package-lock.json` | 0 lines — no application source drift |

**Codebase Memory Verdict:** The repository graph is fresh. The `billing-webhooks` Edge Function source is present and indexed. No application-source drift exists.

------------------------------------------------------------------------

# 4. MCP Verification

Primary evidence was collected from the `codebase-memory`, `vercel`, and `supabase-mcp-server` MCPs.

| Check | MCP / Method | Result |
|-------|--------------|--------|
| Vercel production project | `vercel` MCP `get_project` | `prj_UdCbqGpXxsBXVNGfz0fz02obBS6x` — `vietsalepro`, framework `vite`, healthy |
| Vercel production deployment | `vercel` MCP `get_deployment` | `dpl_FgeyVAQ7s34NcvHMN5z6c7n1QSgc` `READY`, target `production`, commit `ce87b9d7` |
| Supabase production project | `supabase-mcp-server` `get_project` | `rsialbfjswnrkzcxarnj` `ACTIVE_HEALTHY`, Postgres 17.6.1 |
| Production Edge Functions | `supabase-mcp-server` `list_edge_functions` | `billing-webhooks` v4 `ACTIVE`, `verify_jwt: false` |
| Deno std base64 exports | Web fetch of `https://deno.land/std@0.177.0/encoding/base64.ts` | Exports `decode` and `encode`; **no** `decodeBase64` export |

**MCP Verdict:** The Vercel production deployment and Supabase production project are healthy and aligned with the authorized Wave-04 commit. The `billing-webhooks` Edge Function is deployed and `ACTIVE` in production, but its source imports a non-existent named export.

------------------------------------------------------------------------

# 5. Installed Skills Review

Every installed skill was reviewed for applicability to the Engineering Kickoff gate. This stage is explicitly prohibited from modifying application source, modifying Edge Functions, deploying code, modifying the database, or performing implementation. Therefore, no skill that performs any of those actions was invoked.

| Skill | Purpose | Used / Not Used | Reason |
|-------|---------|-----------------|--------|
| `agent-browser` | Browser automation and runtime capture | Not used | No browser runtime verification required |
| `webapp-testing` | Playwright runtime checks | Not used | No runtime execution is authorized for stage 66 |
| `code-review` | Standards/spec review of code changes | Not used | No application source changes are under review |
| `doc-coauthoring` | Structured documentation co-authoring | Not used | Governed PMO document produced from evidence |
| `internal-comms` | Internal communication templates | Not used | Not applicable to this governance gate |
| `codebase-design` | Deep-module design vocabulary | Not used | No design or interface changes are in scope |
| `diagnosing-bugs` / `systematic-debugging` | Root-cause diagnosis | Not used | Root cause already confirmed |
| `plan` / `writing-plans` | Actionable plan writing | Not used | Implementation spec produced as governed deliverable |
| `requesting-code-review` | Pre-commit review | Not used | No code changes are being committed |

All other installed skills were reviewed and determined inapplicable to this planning-only gate.

**Skills Verdict:** No installed skill was required or invoked. Evidence is sourced from Codebase Memory, Vercel MCP, Supabase MCP, Git, and primary-source web verification.

------------------------------------------------------------------------

# 6. Root Cause Confirmation

| Observation | `billing-webhooks` Edge Function `BOOT_ERROR` |
|-------------|-----------------------------------------------|
| Symptom | Function returns `503` on direct `POST` |
| Root cause | `supabase/functions/billing-webhooks/index.ts` imports `decodeBase64` from `https://deno.land/std@0.177.0/encoding/base64.ts` |
| Deno std evidence | The module exports `decode` and `encode` only; `decodeBase64` is not defined |
| Scope | Single import line in `supabase/functions/billing-webhooks/index.ts` |
| Baseline origin | Not from `AD-Baseline-1.0`; pre-existing operational defect |

**Root Cause Verdict:** The root cause remains unchanged. Correcting the import to `import { decode as decodeBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts';` resolves the `BOOT_ERROR` without modifying call sites or logic.

------------------------------------------------------------------------

# 7. Engineering Objective

Wave-05 Business Objective: **Restore Production Billing Webhook Reliability.**

Wave-05 Engineering Objective: **Prepare a complete implementation specification that restores a production-ready `billing-webhooks` Edge Function while preserving all existing contracts.**

The specification is complete in `66B_WAVE05_IMPLEMENTATION_SPECIFICATION.md`.

------------------------------------------------------------------------

# 8. Implementation Specification Summary

| Element | Specification |
|---------|---------------|
| Target files | `supabase/functions/billing-webhooks/index.ts` only; `supabase/config.toml` read-only verification |
| Entry points | `POST` and `OPTIONS` to `/functions/v1/billing-webhooks?provider=<provider>` |
| Import correction | `import { decodeBase64 } ...` → `import { decode as decodeBase64 } ...` |
| Call sites | Unchanged; alias preserves `decodeBase64` identifier |
| Environment variables | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `BILLING_WEBHOOK_API_KEY` (no change) |
| Secrets | No rotation, addition, or exposure |
| Runtime behavior | Successful boot, existing provider routing, audit logging, and Stripe signature verification preserved |
| Failure scenarios | Documented in `66B` §10 |
| Backward compatibility | Full |
| Deployment | Single Edge Function redeploy |

------------------------------------------------------------------------

# 9. Implementation Strategy Summary

| Element | Approach |
|---------|----------|
| Implementation order | Edit import → static check → deploy → direct POST sanity → Stripe test → audit verification |
| Required validations | `deno check`, `supabase functions deploy`, `POST` per provider, Stripe signature, `app_audit_log` rows |
| Rollback strategy | Revert one import line or redeploy previous Supabase Edge Function version |
| Risk mitigation | Type check before deploy; test signature with known payload; keep diff to one line |
| Verification strategy | Static, local, integration, Stripe, and audit checks |
| Deployment strategy | `supabase functions deploy billing-webhooks` only |
| Acceptance strategy | `200` for valid requests, `400` for bad provider, no `503`, audit rows written |
| Production verification | Direct `POST`, Stripe test event, `app_audit_log` query, 24-hour log monitoring |

The complete strategy is in `66B_WAVE05_IMPLEMENTATION_SPECIFICATION.md`.

------------------------------------------------------------------------

# 10. Impact Analysis

| Domain | Impact |
|--------|--------|
| Edge Functions | `billing-webhooks` restored to working state; no other function affected |
| Supabase | No schema, migration, RPC, or RLS changes |
| Stripe integration | Existing webhook endpoints continue without reconfiguration |
| Secrets | No rotation or addition |
| Authentication | `verify_jwt = false` preserved; signature/shared-key gate unchanged |
| HTTP interface | Identical request/response contract |
| Existing consumers | No contract change |
| Backward compatibility | Fully preserved |
| Hidden dependencies | None discovered |

------------------------------------------------------------------------

# 11. Quality Gate Review

| Gate | Result |
|------|--------|
| Architecture | PASS |
| Security | PASS |
| Runtime | PASS WITH OBSERVATIONS |
| Edge Functions | PASS WITH OBSERVATIONS |
| Repository | PASS |
| Deployment | PASS |
| Operational Risk | LOW — MEDIUM |
| Maintainability | PASS |
| Supportability | PASS |

No blocking quality gate was identified.

------------------------------------------------------------------------

# 12. Risk Review

| Risk | Rating |
|------|--------|
| Technical Risk | LOW |
| Deployment Risk | LOW |
| Rollback Risk | LOW |
| Operational Risk | MEDIUM |
| Business Risk | LOW |
| Security Risk | LOW |
| Residual Risk | LOW |

The residual risk is limited to deploy timing and the need to confirm Stripe signature verification after the import correction.

------------------------------------------------------------------------

# 13. Readiness Decision

**FINAL DECISION: READY FOR IMPLEMENTATION READINESS REVIEW**

Wave-05 Engineering Kickoff is complete. The implementation specification fully defines how to restore the `billing-webhooks` Edge Function while preserving all contracts. The scope is bounded to a single import-line correction, the root cause is confirmed, and all governance, security, and operational quality gates are satisfied.

**Objective justification:**

1. All mandatory Wave-05 preparation governance documents have been read and verified.
2. The Program Owner Decision Record (`64`/`64A`) and Wave-05 Authorization (`65`/`65A`) explicitly authorize this stage.
3. The `billing-webhooks` root cause is confirmed and unchanged.
4. The repository graph is fresh and shows no application-source drift from `ce87b9d7`.
5. Production Vercel and Supabase projects are healthy and aligned with `ce87b9d7`.
6. The implementation specification preserves every existing contract.
7. Impact analysis, quality gates, and risk assessment are acceptable for a single Edge Function import correction.

------------------------------------------------------------------------

# 14. Roadmap Synchronization

The following documents are updated by this Engineering Kickoff:

- `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md`
- `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md`

| Synchronization Item | Value |
|----------------------|-------|
| Current Governance Stage | 66 — Wave-05 Engineering Kickoff COMPLETE |
| Current Program Status | WAVE-05 ENGINEERING KICKOFF COMPLETE (66) — READY FOR IMPLEMENTATION READINESS REVIEW |
| Current Wave | Wave-05 — Engineering Kickoff Complete |
| Next Governance Stage | 67 — Wave-05 Implementation Readiness Review (NOT STARTED) |
| Next Deliverable | `67_WAVE05_IMPLEMENTATION_READINESS_REVIEW.md` |

------------------------------------------------------------------------

# 15. Stop Rule

This Engineering Kickoff decision **does NOT** authorize implementation.

Do **NOT** begin:

- `67 — Wave-05 Implementation Readiness Review`
- `68 — Wave-05 Implementation`
- Any application source, Edge Function, database, migration, or production configuration change

Wait for explicit Program Owner approval before continuing.
