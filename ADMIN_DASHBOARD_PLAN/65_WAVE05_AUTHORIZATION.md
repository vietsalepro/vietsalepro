# 65_WAVE05_AUTHORIZATION

**Document ID:** 65_WAVE05_AUTHORIZATION  
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
**Repository Artifacts Modified:** `65_WAVE05_AUTHORIZATION.md`, `65A_WAVE05_AUTHORIZATION_REPORT.md`, and status sections of `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` and `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` only  
**Status:** Wave-05 Authorized with Observations — Engineering Kickoff Document Ready to Start

------------------------------------------------------------------------

# 1. Executive Summary

This document is the formal Wave-05 Authorization for Phase B of the Admin Dashboard System Remediation Program. It is a governance-only milestone. It does **not** authorize implementation, verification, acceptance, deployment, or program certification.

Wave-04 is formally closed with observations. The Program Owner Decision Record (`64`/`64A`) overrides the PMO recommendation and authorizes preparation for Wave-05 to remediate the residual `billing-webhooks` Edge Function `BOOT_ERROR`. The root cause is fully understood: `supabase/functions/billing-webhooks/index.ts` imports a non-existent named export `decodeBase64` from `https://deno.land/std@0.177.0/encoding/base64.ts`, causing the function to fail on invocation.

**Authorization Decision:**

``` text
WAVE-05 AUTHORIZED WITH OBSERVATIONS
```

**Engineering Kickoff Decision:**

- Wave-05 Engineering Kickoff document creation: **AUTHORIZED and READY TO START**.
- Wave-05 Engineering Kickoff execution: **NOT AUTHORIZED** until the Wave-05 Engineering Kickoff document is produced.
- Wave-05 Implementation: **NOT AUTHORIZED**.

The observations recorded in this document are non-blocking for the Authorization gate. They must be resolved before Wave-05 implementation begins.

------------------------------------------------------------------------

# 2. Documents Reviewed

The following mandatory governance documents were read in full before this authorization was made. No section was skipped.

| # | Document | Role in Wave-05 Authorization | Disposition |
|---|----------|-------------------------------|-------------|
| 00 | `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` | Program charter, lifecycle, current status, transition rules | Read in full |
| 12 | `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md` | Master Plan roadmap, program status, quality gates | Read in full |
| 59R | `59R_WAVE04_PRODUCTION_DEPLOYMENT_AUTHORIZATION_REREVIEW.md` | Wave-04 Production re-review authorization | AUTHORIZED WITH OBSERVATIONS |
| 59RA | `59RA_WAVE04_PRODUCTION_DEPLOYMENT_AUTHORIZATION_REREVIEW_REPORT.md` | Wave-04 Production re-review evidence | AUTHORIZED WITH OBSERVATIONS |
| 60 | `60_WAVE04_PRODUCTION_DEPLOYMENT_SYNCHRONIZATION.md` | Wave-04 Production deployment execution | COMPLETE |
| 60A | `60A_WAVE04_PRODUCTION_DEPLOYMENT_SYNCHRONIZATION_REPORT.md` | Wave-04 Production deployment evidence | PASS |
| 61 | `61_WAVE04_PRODUCTION_DEPLOYMENT_VERIFICATION.md` | Wave-04 Production verification decision | PASS WITH OBSERVATIONS |
| 61A | `61A_WAVE04_PRODUCTION_DEPLOYMENT_VERIFICATION_REPORT.md` | Wave-04 Production verification evidence | PASS WITH OBSERVATIONS |
| 62 | `62_WAVE04_PRODUCTION_ACCEPTANCE_REVIEW.md` | Wave-04 Production acceptance decision | ACCEPTED WITH OBSERVATIONS |
| 62A | `62A_WAVE04_PRODUCTION_ACCEPTANCE_REVIEW_REPORT.md` | Wave-04 Production acceptance evidence | ACCEPTED WITH OBSERVATIONS |
| 63 | `63_WAVE04_CLOSEOUT.md` | Wave-04 closeout decision | COMPLETE — CLOSED WITH OBSERVATIONS |
| 63A | `63A_WAVE04_CLOSEOUT_REPORT.md` | Wave-04 closeout evidence | COMPLETE — CLOSED WITH OBSERVATIONS |
| 63B | `63B_WAVE05_RECOMMENDATION.md` | PMO recommendation for residual observation | Reviewed — overridden by Program Owner |
| 64 | `64_PROGRAM_OWNER_DECISION_RECORD.md` | Program Owner decision to prepare Wave-05 | COMPLETE — WAVE-05 AUTHORIZED FOR PREPARATION |
| 64A | `64A_PROGRAM_OWNER_DECISION_REPORT.md` | Program Owner decision evidence | COMPLETE — WAVE-05 AUTHORIZED FOR PREPARATION |

**Governance Verdict:** The Wave-04 governance chain is intact from Authorization through Closeout. The Program Owner Decision Record (`64`/`64A`) is complete and authorizes Wave-05 preparation. All mandatory Wave-05 preparation evidence has been reviewed.

------------------------------------------------------------------------

# 3. Root Cause and Objective

## 3.1 Residual Observation

| Observation | `billing-webhooks` Edge Function `BOOT_ERROR` |
|---|---|
| Current production status | Function `ACTIVE` in production Supabase project `rsialbfjswnrkzcxarnj`; direct `POST` returns `503` |
| Offending source | `supabase/functions/billing-webhooks/index.ts` |
| Offending import | `import { decodeBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts';` |
| Root cause | The `decodeBase64` named export is not available from the referenced Deno std module, causing a module-load failure at boot |
| Scope | Single file only |
| Baseline origin | Not from `AD-Baseline-1.0`; pre-existing operational defect |

## 3.2 Wave-05 Business Objective

> Restore Production Billing Webhook Reliability.

The objective is not simply to fix one import. The objective is to restore a production-ready `billing-webhooks` Edge Function while preserving every existing business contract.

------------------------------------------------------------------------

# 4. Authorized Scope

Wave-05 is authorized to include **ONLY**:

1. Repair `billing-webhooks` runtime failure by correcting the Deno standard-library import incompatibility.
2. Restore successful production execution.
3. Preserve the existing Stripe webhook contract.
4. Preserve production configuration.
5. Preserve secrets.
6. Preserve authentication.
7. Preserve the existing request/response contract.
8. Perform production verification after deployment.

------------------------------------------------------------------------

# 5. Out-of-Scope Definition

Wave-05 is **NOT** authorized to include:

- Database changes
- RPC changes
- UI changes
- Authentication redesign
- Architecture redesign
- Other Edge Functions
- Service layer changes
- Business Logic changes
- Performance optimization
- Security enhancements unrelated to `billing-webhooks`
- Any unrelated bug

Scope expansion is prohibited.

------------------------------------------------------------------------

# 6. Deliverable Definition

The Wave-05 deliverable chain is:

1. Engineering Kickoff (`66`)
2. Implementation Readiness Review (`67`)
3. Implementation (`68`)
4. Verification (`69`)
5. Acceptance Review (`70`)
6. Deployment Synchronization (`71`)
7. Production Verification (`72`)
8. Production Acceptance Review (`73`)
9. Closeout (`74`)

------------------------------------------------------------------------

# 7. Risk and Quality Gate Summary

| Gate / Risk | Result |
|---|---|
| Architecture | PASS |
| Security | PASS |
| Edge Functions | PASS WITH OBSERVATIONS |
| Runtime | PASS WITH OBSERVATIONS |
| Deployment | PASS |
| Repository | PASS |
| Governance | PASS |
| Operational Risk | MEDIUM |
| Overall Risk | LOW — MEDIUM |

No blocking risk was identified. The `billing-webhooks` defect is isolated, bounded, and fully understood.

------------------------------------------------------------------------

# 8. Roadmap Synchronization

The following documents are updated by this authorization:

- `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md`
- `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md`

| Synchronization Item | Value |
|---|---|
| Current Governance Stage | 65 — Wave-05 Authorization COMPLETE |
| Current Program Status | WAVE-04 CLOSEOUT COMPLETE (63); 65 — WAVE-05 AUTHORIZATION AUTHORIZED WITH OBSERVATIONS |
| Current Wave | Wave-05 — Authorized with Observations |
| Next Governance Stage | 66 — Wave-05 Engineering Kickoff (NOT STARTED) |
| Next Deliverable | `66_WAVE05_ENGINEERING_KICKOFF.md` |

------------------------------------------------------------------------

# 9. Final Authorization Decision

**FINAL DECISION: AUTHORIZED WITH OBSERVATIONS**

Wave-05 is formally authorized to proceed to Engineering Kickoff document creation.

**Objective justification:**

1. All mandatory Wave-04 governance gates are complete and consecutive.
2. The Program Owner Decision Record (`64`/`64A`) explicitly authorizes Wave-05 preparation.
3. The Wave-05 scope is tightly bounded to a single, fully understood `billing-webhooks` import defect.
4. No application-source drift exists relative to the authorized Wave-04 commit `ce87b9d7`.
5. The Vercel production deployment and Supabase production project are healthy and aligned with `ce87b9d7`.
6. The `billing-webhooks` Edge Function is present in production, `ACTIVE`, and its root cause is documented.
7. All required business, operational, and configuration contracts are explicitly preserved.
8. The risk assessment is acceptable for a single Edge Function import correction and redeploy.

------------------------------------------------------------------------

# 10. Stop Rule

This authorization does **NOT** authorize implementation, verification, acceptance, deployment, or closeout.

Do **NOT** begin `66 — Wave-05 Engineering Kickoff` execution. Wait for explicit Program Owner approval before continuing.

------------------------------------------------------------------------
