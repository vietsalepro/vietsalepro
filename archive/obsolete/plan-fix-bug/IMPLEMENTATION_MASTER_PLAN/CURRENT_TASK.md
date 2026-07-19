# CURRENT_TASK.md

## 1. Task Information

Task ID | TASK-DOC2-002 |
Master Plan | IMPLEMENTATION_MASTER_PLAN_2.md |
Phase | Phase 1-A: Migration Sync |
Implementation Step | Step 2 — PAUSE CRON JOBS |
Priority | P0 — Execute Immediately |
Status | READY_TO_IMPLEMENT |

---

## 2. Objective

Pause the two production cron jobs (`data-retention-daily` and `fraud-detection-hourly`) by calling `cron.unschedule(1)` and `cron.unschedule(13)` against the production database.

---

## 3. Reason

- This is the next unimplemented step in Doc 2 / 8 after Step 1 (full database backup) is complete.
- Running cron jobs during migration deployment can cause partial data processing, constraint violations, or failed job runs.
- The master plan explicitly requires cron jobs to remain paused through the rest of Doc 2 and Doc 3; they are resumed in Doc 4 / 8.
- Prerequisite dependency: Step 1 (TASK-DOC2-001) must be PASS before unscheduling cron jobs.

---

## 4. Scope

In Scope

- Connect to production Supabase project (`rsialbfjswnrkzcxarnj`) via `service_role`
- Confirm active cron job IDs `1` and `13`
- Execute `SELECT cron.unschedule(1);` — pauses `data-retention-daily`
- Execute `SELECT cron.unschedule(13);` — pauses `fraud-detection-hourly`
- Verify both jobs no longer appear in `cron.job` as active, or are marked unscheduled
- Document the pause action with timestamp and job IDs

Out of Scope

- Step 1 — Full Database Backup (already completed as TASK-DOC2-001)
- Step 3 — Resolve duplicate migration timestamp
- Steps 4–8 — Migration deployment, RPC verification, admin dashboard smoke tests
- Resuming cron jobs (handled in Doc 4 / 8)
- Any schema changes, code changes, or RPC verification

---

## 5. Required Context

- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/IMPLEMENTATION_MASTER_PLAN_1.md`
- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/IMPLEMENTATION_MASTER_PLAN_INDEX.md`
- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/IMPLEMENTATION_MASTER_PLAN_2.md`
- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/PROGRAM_STATE.md`
- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/TASK_HANDOVER.md`
- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/CURRENT_TASK.md` (TASK-DOC2-001, completed)

---

## 6. Required Skills

- Supabase CLI (`supabase psql`, `supabase link`)
- PostgreSQL `pg_cron` extension (`cron.unschedule`, `cron.job` catalog)
- SQL verification queries

---

## 7. Required MCP

- **None.**

This step is a direct database operation using standard PostgreSQL tooling. No Codebase Memory MCP query or Supabase MCP tool call is required because the task does not inspect code, routes, or database schema definitions — it performs an operational cron control action.

---

## 8. Allowed Files

None. This task performs an operational database action. Do not modify source files.

---

## 9. Forbidden Files

Do not modify:

- Any file under `supabase/migrations/`
- Application source code
- Governance documents (`PROGRAM_STATE.md`, `TASK_HANDOVER.md`, `IMPLEMENTATION_MASTER_PLAN_*.md`)

---

## 10. Implementation Checklist

1. Confirm TASK-DOC2-001 (full database backup) is PASS.
2. Confirm production project identifier: `rsialbfjswnrkzcxarnj`.
3. Connect to production database with `service_role` privileges.
4. Query `cron.job` to confirm active job ID `1` (`data-retention-daily`) exists.
5. Query `cron.job` to confirm active job ID `13` (`fraud-detection-hourly`) exists.
6. Execute `SELECT cron.unschedule(1);`.
7. Execute `SELECT cron.unschedule(13);`.
8. Re-query `cron.job` to verify both jobs are no longer active.
9. Log: timestamp, job IDs unscheduled, verification query result.
10. Confirm no database schema or data changes were made beyond cron unscheduling.

---

## 11. Validation Checklist

Build

- Not applicable

Lint

- Not applicable

Type Check

- Not applicable

Tests

- Not applicable

Manual Verification

- [ ] Both cron jobs were active before unschedule
- [ ] `SELECT cron.unschedule(1);` returned `true`
- [ ] `SELECT cron.unschedule(13);` returned `true`
- [ ] Post-unschedule query confirms job `1` is no longer active
- [ ] Post-unschedule query confirms job `13` is no longer active
- [ ] No unintended production schema or data changes occurred
- [ ] Pause action and verification result are documented

---

## 12. Completion Criteria

PASS

- Both cron jobs (`data-retention-daily` and `fraud-detection-hourly`) are unscheduled in production
- Verification query confirms neither job remains active
- TASK-DOC2-001 (full database backup) is confirmed PASS before this task begins
- No schema or data modifications were made to production beyond cron unscheduling
- Task output includes job IDs, timestamp, and verification method used

FAIL

- `cron.unschedule` returns an error for either job
- Either cron job remains active after unschedule attempt
- Production data or schema is modified unintentionally
- TASK-DOC2-001 is not confirmed PASS before this task begins
- Pause action is not documented

---

## 13. Rollback

- If unschedule fails due to missing job ID: verify correct job ID in `cron.job` and retry with the correct identifier.
- If job must be restored before Doc 4: re-schedule using the original `schedule` expression recorded in `cron.job` history or in the rollback log.
- No database rollback needed because no schema changes will be made during this task.

---

## 14. After Completion

Update ONLY the following documents after successful implementation:

- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/PROGRAM_STATE.md`
- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/TASK_HANDOVER.md`

Do NOT generate the next task in this session.
