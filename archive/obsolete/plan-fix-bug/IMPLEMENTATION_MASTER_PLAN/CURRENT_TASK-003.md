# CURRENT_TASK-003.md

## 1. Task Information

| Field | Value |
| --- | --- |
| **Task ID** | TASK-DOC2-003 |
| **Master Plan** | IMPLEMENTATION_MASTER_PLAN_2.md |
| **Phase** | Phase 1-A: Migration Sync |
| **Implementation Step** | Step 3 — RESOLVE MIGRATION TIMESTAMP DUPLICATE (LOW-3) |
| **Priority** | P0 — Execute Immediately |
| **Status** | READY_TO_REVIEW |

---

## 2. Objective

Rename `supabase/migrations/20260718000000_sp1_6_expand_audit_log_event_types.sql` to `20260718000002_sp1_6_expand_audit_log_event_types.sql` to resolve the duplicate migration timestamp, commit the rename to git, and verify the local migration list contains no duplicate timestamps.

---

## 3. Scope

In Scope

- Rename exactly one migration file in `supabase/migrations/`:
  - From: `20260718000000_sp1_6_expand_audit_log_event_types.sql`
  - To: `20260718000002_sp1_6_expand_audit_log_event_types.sql`
- Verify the target timestamp `20260718000002` does not already exist in `supabase/migrations/`.
- Verify the existing migration `20260718000001_sp_7_1_set_tenant_subdomain.sql` remains intact.
- Stage and commit the rename to git.
- Run `supabase migration list` and confirm no duplicate timestamps are reported.

Out of Scope

- Step 1 — Full Database Backup (TASK-DOC2-001, completed)
- Step 2 — Pause Cron Jobs (TASK-DOC2-002, completed)
- Steps 4–8 of Phase 1-A (migration reconciliation, staging/production deployment, RPC verification, admin dashboard smoke tests)
- Any changes to migration file content (only the filename timestamp changes)
- Any database operations on staging or production

---

## 4. Prerequisites

- TASK-DOC2-001 (full database backup) is PASS.
- TASK-DOC2-002 (pause cron jobs) is PASS.
- Local git working tree is clean and `HEAD` matches the remote branch.
- Supabase CLI is installed and project is linked.
- `supabase/migrations/20260718000001_sp_7_1_set_tenant_subdomain.sql` exists and is not renamed.

---

## 5. Required Skills

- Git (rename, stage, commit)
- Supabase CLI (`supabase migration list`)
- File system operations

---

## 6. MCP Requirement

- **None.**

This atomic task is a local file rename and CLI verification. No Supabase MCP tool call is required because the task does not inspect code routes or execute database schema changes.

---

## 7. Forbidden Actions

- Do not modify the content of any migration file.
- Do not rename any migration file other than `20260718000000_sp1_6_expand_audit_log_event_types.sql`.
- Do not delete or move any migration file.
- Do not execute `supabase db push` or any staging/production deployment.
- Do not modify source code outside `supabase/migrations/`.
- Do not modify governance documents (`PROGRAM_STATE.md`, `TASK_HANDOVER.md`, `IMPLEMENTATION_MASTER_PLAN_*.md`).
- Do not proceed to Step 4 until this task is validated.

---

## 8. Detailed Implementation Steps

1. Confirm TASK-DOC2-001 and TASK-DOC2-002 are PASS.
2. Verify git working tree is clean (`git status --short`).
3. List `supabase/migrations/` and confirm the source file exists:
   - `supabase/migrations/20260718000000_sp1_6_expand_audit_log_event_types.sql`
4. Confirm the target filename does not already exist:
   - `supabase/migrations/20260718000002_sp1_6_expand_audit_log_event_types.sql`
5. Confirm the adjacent timestamp `20260718000001_sp_7_1_set_tenant_subdomain.sql` exists and will not conflict.
6. Rename the file using git:
   - `git mv supabase/migrations/20260718000000_sp1_6_expand_audit_log_event_types.sql supabase/migrations/20260718000002_sp1_6_expand_audit_log_event_types.sql`
7. Stage the rename and commit with a clear message.
8. Run `supabase migration list` to verify the local migration list is clean and contains no duplicate timestamps.
9. Run `ls supabase/migrations/ | sort` to visually confirm sequential ordering.
10. Document the rename action, commit hash, and verification result.

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

- [ ] Source file `20260718000000_sp1_6_expand_audit_log_event_types.sql` no longer exists
- [ ] Target file `20260718000002_sp1_6_expand_audit_log_event_types.sql` exists
- [ ] Migration file content is unchanged (only the filename changed)
- [ ] `20260718000001_sp_7_1_set_tenant_subdomain.sql` remains intact
- [ ] Git working tree is clean after commit
- [ ] `supabase migration list` reports no duplicate timestamps
- [ ] `ls supabase/migrations/ | sort` shows sequential ordering with no collisions

---

## 10. Completion Criteria

PASS

- The migration file has been renamed from `20260718000000_*` to `20260718000002_*`
- No filename collision with `20260718000001_*`
- Git commit recorded the rename
- `supabase migration list` shows a clean local migration list
- No duplicate migration timestamps remain in `supabase/migrations/`

FAIL

- Target filename `20260718000002_*` already exists
- `supabase migration list` still reports duplicate or non-sequential timestamps
- Migration file content was accidentally modified
- Git commit failed or working tree is not clean
- Any file outside the target migration file was renamed or modified

---

## 11. Deliverables

- Git commit containing the migration file rename.
- Screenshot or text output of `supabase migration list` showing no duplicates.
- Timestamped log of the rename and verification actions.

---

## 12. STOP Conditions

STOP and report a blocker if any of the following occurs:

- The target filename `20260718000002_sp1_6_expand_audit_log_event_types.sql` already exists.
- `supabase migration list` shows additional duplicate timestamps that cannot be resolved by this single rename.
- The git repository has uncommitted changes that do not belong to this task.
- Any prerequisite (TASK-DOC2-001 or TASK-DOC2-002) is not PASS.

---

## 13. After Completion

Update ONLY the following documents after successful implementation:

- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/PROGRAM_STATE.md`
- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/TASK_HANDOVER.md`

Do NOT generate the next task in this session.
