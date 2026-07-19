# CURRENT_TASK-004.md

## 1. Task Information

| Field | Value |
| --- | --- |
| **Task ID** | TASK-DOC2-004 |
| **Master Plan** | IMPLEMENTATION_MASTER_PLAN_2.md |
| **Phase** | Phase 1-A: Migration Sync |
| **Implementation Step** | Step 4 — RECONCILE 9 PRODUCTION-ONLY MIGRATIONS (HIGH-3) |
| **Priority** | P0 — Execute Immediately |
| **Status** | READY_TO_REVIEW |

---

## 2. Objective

Run `supabase migration list --linked` against the production project, identify any migrations present in production but missing from the local `supabase/migrations/` directory, verify content equality for each production-only migration against any local equivalent, and document or escalate anomalies before proceeding to staging deployment.

---

## 3. Scope

In Scope

- Execute `supabase migration list --linked` for the production project.
- Identify production-only migration timestamps (remote-only rows in the migration list).
- Query `supabase_migrations.schema_migrations` to capture production migration names/versions.
- For each production-only migration:
  - Search the local codebase for a migration with the same semantic name or content.
  - Compare SQL content between the production-applied migration and the local equivalent.
  - If content is identical and only the timestamp differs: document the timestamp-only difference and take no further action.
  - If content differs: STOP and escalate to the senior DB architect before proceeding.
- Record the final reconciliation decision (none found / documented / escalated).
- Verify the local migration list remains clean after reconciliation.

Out of Scope

- Steps 1–3 of Phase 1-A (completed in TASK-DOC2-001, TASK-DOC2-002, TASK-DOC2-003).
- Steps 5–8 of Phase 1-A (staging/production migration deployment, RPC verification, admin dashboard smoke tests).
- Any deployment command (`supabase db push`, SQL execution, etc.).
- Any migration file rename, edit, creation, or deletion.
- Any changes to application source code.

---

## 4. Prerequisites

- TASK-DOC2-001 (full database backup) is PASS.
- TASK-DOC2-002 (pause cron jobs) is PASS.
- TASK-DOC2-003 (resolve migration timestamp duplicate) is PASS.
- Supabase CLI is installed, authenticated, and linked to the production project (`rsialbfjswnrkzcxarnj`).
- Access to production via `service_role` for reading `supabase_migrations.schema_migrations`.
- Local git working tree is clean (no uncommitted changes in `supabase/migrations/`).

---

## 5. Required Skills

- Supabase CLI (`supabase migration list --linked`)
- PostgreSQL queries against `supabase_migrations.schema_migrations`
- Git diff / file content comparison
- SQL migration content analysis

---

## 6. MCP Requirement

- **Supabase MCP recommended.**

This task reads production migration state (`supabase_migrations.schema_migrations`) and may compare remote migration content with local files. Supabase MCP tools can query the production database directly; alternatively, `supabase migration list --linked` and `psql`/`supabase sql` may be used. No schema changes or writes are required.

---

## 7. Forbidden Actions

- Do not run `supabase db push`, `supabase db reset`, or any other deployment/DDL command.
- Do not rename, edit, create, or delete any migration file.
- Do not modify application source code outside of governance documents required by this task.
- Do not execute any migration against staging or production.
- Do not proceed to Step 5 until this task is validated.
- Do not modify governance documents (`PROGRAM_STATE.md`, `TASK_HANDOVER.md`, `IMPLEMENTATION_MASTER_PLAN_*.md`) except as required in Section 13.

---

## 8. Detailed Implementation Steps

1. Confirm TASK-DOC2-001, TASK-DOC2-002, and TASK-DOC2-003 are PASS.
2. Verify git working tree is clean in `supabase/migrations/` (`git status --short`).
3. Run `supabase migration list --linked` against the production project.
4. Capture the list of remote-only / production-only migration timestamps.
5. For each production-only migration timestamp:
   a. Query `supabase_migrations.schema_migrations` to retrieve the migration name/version.
   b. Search `supabase/migrations/` for a local file with the same semantic name (ignoring timestamp prefix).
   c. If a local equivalent exists, compare SQL content line-by-line.
   d. If content is identical and only the timestamp differs, document the timestamp-only difference.
   e. If content differs in any way, STOP the task and escalate to the senior DB architect.
6. If no production-only migrations exist, document "none found".
7. Re-run `supabase migration list` to confirm the local migration list is still clean and sequential.
8. Summarize the reconciliation result, list any documented differences, and record the final decision.

---

## 9. Validation Checklist

Build

- Not applicable

Lint

- Not applicable

Type Check

- Not applicable

Tests

- Not applicable

Manual Verification

- [ ] `supabase migration list --linked` executed successfully against production.
- [ ] Production-only migration timestamps identified and listed.
- [ ] For each production-only migration, a local equivalent was searched and content compared.
- [ ] Timestamp-only differences (if any) are documented with no action required.
- [ ] No content mismatch remains un-escalated.
- [ ] Local migration list remains clean and sequential.
- [ ] Reconciliation report/decision log is recorded.

---

## 10. Completion Criteria

PASS

- `supabase migration list --linked` ran successfully.
- Production-only migrations are reconciled: either none were found, or any found have identical content to a local equivalent and only differ in timestamp.
- All timestamp-only differences are documented.
- No content mismatch was discovered, or any mismatch was escalated per STOP conditions.
- Local migration list remains clean with no duplicate timestamps.

FAIL

- `supabase migration list --linked` fails or cannot connect.
- A production-only migration has different SQL content from its local equivalent and is not escalated.
- Additional duplicate or non-sequential timestamps appear in the migration list.
- Git working tree has uncommitted changes in `supabase/migrations/`.

---

## 11. Deliverables

- Reconciliation report documenting production-only migrations found (or "none found").
- Screenshot or text output of `supabase migration list --linked`.
- Decision log for each production-only migration (timestamp-only difference / escalate).
- Final local migration list output showing no duplicate timestamps.

---

## 12. STOP Conditions

STOP and report a blocker if any of the following occurs:

- A production-only migration has different SQL content from any local equivalent.
- `supabase migration list --linked` fails, returns an error, or shows an unexpected migration state.
- The git working tree in `supabase/migrations/` has uncommitted changes that do not belong to this task.
- Any prerequisite (TASK-DOC2-001, TASK-DOC2-002, or TASK-DOC2-003) is not PASS.

---

## 13. After Completion

Update ONLY the following documents after successful implementation:

- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/PROGRAM_STATE.md`
- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/TASK_HANDOVER.md`

Do NOT generate the next task in this session.
