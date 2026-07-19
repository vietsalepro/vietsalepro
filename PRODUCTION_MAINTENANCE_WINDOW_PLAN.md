# Production Maintenance Window Plan

**Program:** VietSalePro v7 — Production Deployment Program  
**RC ID:** `RC-2026-07-19-01`  
**Frozen Commit:** `8b6ad12f100eb92e13939167fdf6d792c1c13a54`  
**Branch:** `master`  
**Date:** 2026-07-19  
**Status:** Draft — **NOT READY FOR SCHEDULING APPROVAL**

---

## Executive Summary

The Production Maintenance Window cannot be finalized because the actual scheduling information has not been approved or recorded in the current governance artifact set. This document replaces the placeholders in `PRODUCTION_CUTOVER_PLAN.md` Section 6 with a structured planning framework and explicitly marks every unresolved value as `MISSING INPUT`. No production deployment is authorized by this plan.

---

## Current Status

- Phase 3 is open per `PHASE_3_OPENING_AUTHORIZATION.md` (AUTHORIZED WITH OBSERVATIONS).
- `PRODUCTION_CUTOVER_PLAN.md` Section 6 contains placeholders and an explicit instruction not to invent dates.
- `PRODUCTION_EXECUTION_AUTHORIZATION.md` records the following blockers that prevent final scheduling approval:
  - No approved maintenance window.
  - No evidence that T-minus 24-hour stakeholder communication has been issued.
  - No formal release-approval record / release tag not yet created.
  - Approval-matrix signatures are blank.
- Rollback target is documented: tag `pre-rebaseline-2026-07-19` / commit `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c`.
- Hypercare policy is documented: minimum 24 hours, extend to 72 hours if an observation remains open or a SEV-2+ incident occurs.

---

## Missing Inputs

The following inputs must be provided before the maintenance window can be approved. All are currently `MISSING INPUT`.

| Input | Why Required | Current State |
|---|---|---|
| Maintenance Date | Defines the calendar day for the cutover. | MISSING INPUT |
| Maintenance Time / Deployment Start Time | Defines the exact clock time the window opens. | MISSING INPUT |
| Timezone | Ensures all participants interpret the start/end times identically. | MISSING INPUT |
| Expected Downtime | Required to size the window and communicate user impact. | MISSING INPUT |
| Maximum Allowed Downtime | Hard ceiling that triggers rollback if exceeded. | MISSING INPUT |
| Rollback Decision Deadline | Latest point at which rollback may be called without breaching the window. | MISSING INPUT |
| Rollback Completion Deadline | Latest point by which rollback must restore service. | MISSING INPUT |
| Deployment Team Availability | Confirms Wave owners, QA, DevOps, and Database Engineer are present. | MISSING INPUT |
| Business Owner / Project Owner Availability | Required for final Go/No-Go and business acceptance. | MISSING INPUT |
| Database Engineer Availability | Required for Wave 1 and database rollback. | MISSING INPUT |
| DevOps Availability | Required for Edge Functions, Storage, Auth, and Vercel waves. | MISSING INPUT |
| QA Availability | Required for smoke tests and production validation. | MISSING INPUT |
| Communication Contacts | Owner, channel, and distribution list for all notifications. | MISSING INPUT |
| Customer Notification Window | Confirms T-72 / T-24 / T-1 communications can be sent on time. | MISSING INPUT |
| Hypercare Duration Confirmation | Validates whether 24 h or 72 h hypercare applies. | MISSING INPUT |
| War Room / Incident Channel | Single source of truth during the cutover. | MISSING INPUT |

---

## Final Maintenance Window

| Field | Value / Status | Notes |
|---|---|---|
| Maintenance Date | **MISSING INPUT** | Approved calendar date not recorded. |
| Timezone | **MISSING INPUT** | `PRODUCTION_CUTOVER_PLAN.md` placeholder used `UTC+7`, but no formal timezone approval exists. |
| Deployment Start | **MISSING INPUT** | Exact date/time the maintenance window opens and Wave 1 may begin. |
| Expected Finish | **MISSING INPUT** | Computed as Deployment Start + Expected Downtime once both are known. |
| Maximum Downtime | **MISSING INPUT** | No approved downtime budget recorded. |
| Rollback Decision Deadline | **MISSING INPUT** | Must be before Maximum Downtime is consumed. |
| Rollback Completion Deadline | **MISSING INPUT** | Must be before the maintenance window ends. |
| Go/No-Go Meeting | **MISSING INPUT** | To be held at T-30 minutes (relative to Deployment Start). Authority: Program Manager / Release Manager. |
| Deployment Start Approval | **MISSING INPUT** | Authority: Program Manager / Release Manager / Project Owner. |
| Smoke Test Window | **MISSING INPUT** | Wave 6; must complete before Rollback Decision Deadline. |
| Production Verification Window | **MISSING INPUT** | Wave 7; must complete before Rollback Decision Deadline. |
| Hypercare Start | **MISSING INPUT** | Begins after Wave 8 business acceptance / end of maintenance window. |
| Hypercare End | **MISSING INPUT** | Hypercare Start + 24 hours minimum (72 hours if observation or SEV-2+ incident applies). |

---

## Downtime Plan

| Wave | Activity | Owner | Estimated Duration |
|---|---|---|---|
| Wave 1 | Database — verify frozen commit, execute 138 canonical migrations, capture logs | Database Engineer | MISSING INPUT |
| Wave 2 | Edge Functions — verify inventory, build, deploy | Backend Engineer | MISSING INPUT |
| Wave 3 | Storage — verify buckets, policies, CORS | DevOps | MISSING INPUT |
| Wave 4 | Authentication — verify providers, redirect URLs, JWT settings | DevOps | MISSING INPUT |
| Wave 5 | Vercel Deployment — production build and deploy | Frontend Engineer | MISSING INPUT |
| Wave 6 | Smoke Testing — execute smoke test matrix | QA | MISSING INPUT |
| Wave 7 | Production Validation — API health, business flows, monitoring | QA / Release Manager | MISSING INPUT |
| Wave 8 | Business Acceptance — Project Owner / Program Sponsor sign-off | Project Owner / Program Sponsor | MISSING INPUT |

**Total Expected Downtime:** MISSING INPUT  
**Maximum Allowed Downtime:** MISSING INPUT  
**No wave may begin until the previous wave passes its Go/No-Go checkpoint.**

---

## Rollback Timeline

| Item | Value / Status |
|---|---|
| Rollback Trigger | Critical validation failure, unresolvable cross-layer issue, cutover overrun, data-integrity concern, or SEV-1 incident before the rollback deadline. |
| Rollback Authority | Release Manager, with concurrence from Architecture Authority and Program Manager. Project Owner is informed immediately. |
| Rollback Decision Deadline | **MISSING INPUT** (must be set before end of window). |
| Rollback Completion Target | **MISSING INPUT** (must allow rollback to complete before maintenance end). |
| Rollback Target | `pre-rebaseline-2026-07-19` / `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` |
| Evidence Required | Rollback command output and timestamps; backup verification checksum/log; post-rollback smoke test results; communication log; decision record. |

---

## Hypercare Timeline

| Item | Value / Status |
|---|---|
| Hypercare Start | **MISSING INPUT** (immediately after business acceptance / end of maintenance window). |
| Hypercare End | **MISSING INPUT** (Hypercare Start + 24 hours minimum; 72 hours if any observation remains open or a SEV-2+ incident occurs). |
| Minimum Duration | 24 hours |
| Extended Duration Trigger | Open observation `M1` or any SEV-2+ incident |
| Ownership | DevOps monitors infrastructure; Database Engineer watches database health; Backend Engineer supports Edge Functions; Frontend Engineer supports Vercel/FE; QA validates user-reported issues; Program Manager coordinates and reports. |
| Exit Criteria | 24 hours of stable monitoring; no unresolved SEV-2 or higher incidents; hypercare report accepted by Program Manager. |
| Additional Checkpoints | 24-hour, 72-hour, and 7-day checkpoints per `PRODUCTION_DEPLOYMENT_MASTER_PLAN.md`. |

---

## Communication Timeline

| Timing | Audience | Responsible Owner | Channel | Message |
|---|---|---|---|---|
| T-72 hours | All users / stakeholders | Program Manager | **MISSING INPUT** | Advance notice of upcoming maintenance window. |
| T-24 hours | All users / stakeholders | Program Manager | **MISSING INPUT** | Maintenance window reminder with start/end times. |
| T-1 hour | War room | Program Manager | **MISSING INPUT** | Final readiness and attendance confirmation. |
| T-30 minutes | War room | Program Manager / Release Manager | **MISSING INPUT** | Go/No-Go decision. |
| Deployment Start | War room + users | Program Manager | **MISSING INPUT** | Maintenance started; service degraded/unavailable. |
| Per wave | War room | Wave owner / Release Manager | **MISSING INPUT** | Wave status and Go/No-Go result. |
| Deployment Complete | All users / stakeholders | Program Manager | **MISSING INPUT** | Service restored; hypercare active. |
| Rollback (if required) | Stakeholders / users | Program Manager | **MISSING INPUT** | Service restoration in progress; rollback trigger and ETA. |
| Hypercare Complete | All users / stakeholders | Program Manager | **MISSING INPUT** | Hypercare ended; normal operations resumed or next steps. |

All absolute timings depend on the Deployment Start, which is **MISSING INPUT**.

---

## Approval Requirements

| Role | Required | Authority / Responsibility | Signature | Date |
|---|---|---|---|---|
| Program Manager | Yes | Owns cutover schedule, gates, communication, and final Go/No-Go recommendation. | **MISSING INPUT** | **MISSING INPUT** |
| Architecture Authority | Yes | Validates baseline integrity, migration ordering, and technical abort criteria. | **MISSING INPUT** | **MISSING INPUT** |
| Release Manager | Yes | Manages RC identity, freeze status, release hand-off, and rollback decision. | **MISSING INPUT** | **MISSING INPUT** |
| Project Owner | Yes | Provides final business acceptance and production fitness sign-off. | **MISSING INPUT** | **MISSING INPUT** |
| Database Engineer | Yes | Owns database migration execution, schema validation, and database rollback. | **MISSING INPUT** | **MISSING INPUT** |
| DevOps | Yes | Owns Edge Function, Storage, Auth, Vercel environment, and secret verification. | **MISSING INPUT** | **MISSING INPUT** |
| QA | Yes | Executes smoke tests, production validation, and records results. | **MISSING INPUT** | **MISSING INPUT** |

---

## Decision

**OPTION B — NOT READY**

Critical scheduling information is still missing. The maintenance window cannot be approved, communicated, or executed until the `MISSING INPUT` items above are provided and the approval matrix is signed.
