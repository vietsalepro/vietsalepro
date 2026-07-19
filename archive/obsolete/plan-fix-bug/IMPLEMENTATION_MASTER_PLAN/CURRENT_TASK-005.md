# CURRENT_TASK-005.md

## 1. Task Information

| Field | Value |
| --- | --- |
| **Task ID** | TASK-DOC2-005 |
| **Master Plan** | IMPLEMENTATION_MASTER_PLAN_2.md |
| **Phase** | Phase 1-A: Migration Sync |
| **Implementation Step** | Step 5 — DEPLOY 9 MISSING MIGRATIONS TO STAGING (HIGH-3 / CRIT-2) |
| **Priority** | P0 — Execute Immediately |
| **Status** | READY_TO_REVIEW |

---

## 2. Objective

Deploy the 9 missing local migrations to the staging database, confirm they are applied cleanly, and run an RPC smoke test on staging to verify the 5 previously-missing admin RPCs exist.

---

## 3. Scope

In Scope

- Execute `supabase db push --db-url [STAGING_DB_URL]` to apply the 9 missing migrations to the staging project (`shbmzvfcenbybvyzclem`).
- Run `supabase migration list --linked` against staging to verify all 9 migrations are applied.
- Run the RPC smoke test query against `information_schema.routines` on staging:
  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN (
    'admin_update_subscription',
    'get_member_with_email',
    'get_storage_usage',
    'search_members_by_email',
    'set_tenant_subdomain'
  );
  ```
- Confirm all 5 RPCs are present on staging.
- Document any errors, anomalies, or STOP conditions.

Out of Scope

- Steps 1–4 of Phase 1-A (completed in TASK-DOC2-001 through TASK-DOC2-004).
- Steps 6–8 of Phase 1-A (production RPC verification, production deployment, admin dashboard smoke tests).
- Any changes to application source code.
- Any migration file edits, renames, or deletions.

---

## 4. Prerequisites

- TASK-DOC2-001 (full database backup) is PASS.
- TASK-DOC2-002 (pause cron jobs) is PASS.
- TASK-DOC2-003 (resolve migration timestamp duplicate) is PASS.
- TASK-DOC2-004 (reconcile 9 production-only migrations) is PASS.
- Supabase CLI is installed, authenticated, and linked to the staging project (`shbmzvfcenbybvyzclem`).
- Staging database URL is available and writable via `service_role`.
- Local git working tree is clean in `supabase/migrations/`.

---

## 5. Required Skills

- Supabase CLI (`supabase db push`, `supabase migration list`)
- PostgreSQL queries against `information_schema.routines`
- SQL migration execution verification

---

## 6. MCP Requirement

- **Supabase MCP recommended.**

This task executes a staging deployment and queries the staging database. Supabase MCP tools can run the migration list and query `information_schema.routines` directly; alternatively, `supabase db push` and `supabase sql` / `psql` may be used.

---

## 7. Forbidden Actions

- Do NOT run `supabase db push` against the production database in this task.
- Do NOT run `supabase db reset` against staging or production.
- Do NOT rename, edit, create, or delete any migration file.
- Do NOT modify application source code outside of governance documents required by this task.
- Do NOT proceed to Step 6 until this task is validated.
- Do NOT modify governance documents (`PROGRAM_STATE.md`, `TASK_HANDOVER.md`, `IMPLEMENTATION_MASTER_PLAN_*.md`) except as required in Section 13.

---

## 8. Detailed Implementation Steps

1. Confirm TASK-DOC2-001, TASK-DOC2-002, TASK-DOC2-003, and TASK-DOC2-004 are PASS.
2. Verify git working tree is clean in `supabase/migrations/` (`git status --short`).
3. Run `supabase db push --db-url [STAGING_DB_URL]` to apply the 9 missing migrations to staging.
4. Capture the full CLI output, especially the list of migrations applied and any errors.
5. Run `supabase migration list --linked` against staging and confirm all 9 migrations appear as applied.
6. Run the RPC smoke test query against `information_schema.routines` on staging (see Scope).
7. Confirm all 5 RPCs are present.
8. If any RPC is missing or any migration fails, STOP and report the blocker.
9. Summarize the staging deployment result and RPC verification result.

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

- [ ] `supabase db push --db-url [STAGING_DB_URL]` executed successfully against staging.
- [ ] All 9 missing migrations applied on staging with no errors.
- [ ] `supabase migration list --linked` (staging) confirms all 9 migrations are applied.
- [ ] RPC smoke test query executed successfully on staging.
- [ ] All 5 previously-missing RPCs are present in `information_schema.routines` on staging:
  - [ ] `admin_update_subscription`
  - [ ] `get_member_with_email`
  - [ ] `get_storage_usage`
  - [ ] `search_members_by_email`
  - [ ] `set_tenant_subdomain`
- [ ] Any errors or anomalies are documented.

---

## 10. Completion Criteria

PASS

- `supabase db push` completed successfully on staging.
- All 9 migrations are recorded as applied in staging `supabase_migrations.schema_migrations`.
- All 5 previously-missing RPCs exist in staging `information_schema.routines`.
- No uncommitted changes exist in `supabase/migrations/` after deployment.

FAIL

- `supabase db push` fails or leaves staging in a partial state.
- Any of the 9 migrations are not recorded as applied on staging.
- Any of the 5 RPCs are missing on staging.
- Git working tree has uncommitted changes in `supabase/migrations/`.

---

## 11. Deliverables

- Staging deployment log / CLI output from `supabase db push`.
- Staging migration list output from `supabase migration list --linked`.
- RPC smoke test output confirming all 5 RPCs exist on staging.
- Summary report of any errors or anomalies.

---

## 12. STOP Conditions

STOP and report a blocker if any of the following occurs:

- `supabase db push` fails, returns an error, or does not apply all 9 migrations.
- `supabase migration list --linked` (staging) shows missing or duplicate migrations.
- Any of the 5 RPCs are missing from staging `information_schema.routines`.
- The git working tree in `supabase/migrations/` has uncommitted changes that do not belong to this task.
- Any prerequisite (TASK-DOC2-001 through TASK-DOC2-004) is not PASS.

---

## 13. After Completion

Update ONLY the following documents after successful implementation:

- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/PROGRAM_STATE.md`
- `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN/TASK_HANDOVER.md`

Do NOT generate the next task in this session.
