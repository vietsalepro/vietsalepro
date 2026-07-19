# SINGLE OWNER RELEASE AUTHORIZATION

**Program:** VietSalePro v7 — Production Deployment Program  
**RC ID:** `RC-2026-07-19-01`  
**Frozen Commit:** `8b6ad12f100eb92e13939167fdf6d792c1c13a54`  
**Branch:** `master`  
**Date:** 2026-07-19  
**Authority:** Project Owner (sole governance authority)

---

## 1. Operational Prerequisite Review

| Prerequisite | Status | Evidence / Rationale |
|---|---|---|
| Release tag status | **COMPLETE** | `v7.0.0-rc2` created on origin and resolves to `8b6ad12f...`; `v7.0.0-rc1` retained as historical artifact at `61e8c73f...` |
| Production secrets verification | **COMPLETE** | `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for production project `rsialbfjswnrkzcxarnj`; `.env.staging` also present |
| Maintenance window | **APPROVED** | Window: 2026-07-19 22:00–23:59 UTC+7; expected downtime 60 minutes; rollback decision deadline 23:30 UTC+7 |
| Approval matrix | **CONSOLIDATED** | Single Owner Approval in Section 4 |
| Go / No-Go decision | **GO** | All mandatory prerequisites satisfied |
| Release approval record | **APPROVED** | `RELEASE_APPROVAL_RECORD.md` re-issued as `APPROVED` |
| M1 — Local CLI connectivity | **RESOLVED** | `M1_CLOSURE_VERIFICATION.md` — all CLI gates PASS |

---

## 2. Repository Verification

| Check | Result | Evidence |
|---|---|---|
| Frozen commit | **PASS** | `git rev-parse HEAD` = `8b6ad12f100eb92e13939167fdf6d792c1c13a54` |
| `origin/master` alignment | **PASS** | `git rev-parse origin/master` = `8b6ad12f100eb92e13939167fdf6d792c1c13a54` |
| Branch | **PASS** | Current branch is `master` |
| Tracked-file integrity | **PASS** | No unauthorized source, migration, Edge Function, storage, auth, or Vercel changes |
| Release tag | **PASS** | `v7.0.0-rc2` created and pushed at `8b6ad12f...` |

---

## 3. Release Tag

**Created and pushed.**

```text
Tag:    v7.0.0-rc2
Commit: 8b6ad12f100eb92e13939167fdf6d792c1c13a54
```

---

## 4. Single Owner Approval Consolidation

This is a single-owner project. The Project Owner legitimately performs every governance role; therefore, a single signature satisfies all of them.

The Project Owner serves simultaneously as:

- Program Manager
- Release Manager
- Architecture Authority
- DevOps Lead
- QA Authority
- Product Owner

**Single Owner Approval Statement:**

> As the sole Project Owner and Release Authority, I consolidate all governance approvals into this single-owner authorization. I have reviewed the governance artifacts and operational prerequisites listed in this document. I **GO** for the release of `RC-2026-07-19-01` to the Production Cutover Execution Program.

---

## 5. Production Secrets Verification

**PASS / VERIFIED**

- `.env` contains `VITE_SUPABASE_URL` pointing to production project `rsialbfjswnrkzcxarnj.supabase.co`.
- `.env` contains `VITE_SUPABASE_ANON_KEY` (present, not exposed).
- `.env.staging` contains staging project credentials.
- Secret values were not inspected or exposed beyond presence verification.

---

## 6. Deployment Window

**APPROVED**

| Field | Value |
|---|---|
| Maintenance Date | 2026-07-19 |
| Timezone | UTC+7 |
| Deployment Start | 22:00 UTC+7 |
| Expected Finish | 23:00 UTC+7 |
| Maximum Downtime | 60 minutes |
| Rollback Decision Deadline | 23:30 UTC+7 |
| Rollback Completion Deadline | 23:59 UTC+7 |

---

## 7. Go / No-Go Review

**GO**

- [x] M1 resolved
- [x] Release tag `v7.0.0-rc2` created and `origin/master` aligned to `8b6ad12f...`
- [x] Production secrets verified
- [x] Maintenance window approved
- [x] Single Owner approval signed
- [x] Release approval record `APPROVED`

---

## 8. Final Authorization

```text
FINAL DECISION: GO
```

The Project Owner authorizes `RC-2026-07-19-01` for the **Production Cutover Execution Program**. No production deployment, database migration, Edge Function deployment, storage change, authentication change, Vercel deployment, smoke test, or hypercare activity is performed by this authorization document. Execution must follow the wave sequence and Go/No-Go checkpoints in `PRODUCTION_CUTOVER_PLAN.md` and is authorized to begin only at the approved maintenance window.

**Date:** 2026-07-19  
**Signature:** Project Owner

---

*No production deployment, migration, Edge Function, storage/auth, or Vercel action was performed by this document.*
