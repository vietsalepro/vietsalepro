# REPOSITORY REBASELINE REMEDIATION AUTHORIZATION

**Program:** VietSalePro v7 — Production Deployment Program  
**Date:** 2026-07-19  
**Authorizing Authority:** Repository Re-baseline Remediation Authorization Authority  
**Scope:** Authorization decision only. No repository, Git, migration, archive, production, or database modifications are authorized by this document.

---

## Section 1 — Executive Summary

* **Current Repository Re-baseline status:** The re-baseline implementation has been executed and independently verified. `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` records the result as `PASS WITH OBSERVATIONS`, but the readiness assessment is `NOT READY`.
* **Verification outcome:** One Critical and two High findings block advancement to acceptance. A Medium finding was also observed.
* **Readiness assessment:** The repository file structure matches the approved plan, and the 9 canonical renames, 2 new-migration preservations, and 17 non-canonical archive actions were completed as authorized. However, the canonical migration chain cannot replay against a fresh local database due to a dependency ordering defect, and two required governance artifacts are missing. Remediation is required before acceptance.
* **Purpose of this remediation authorization:** Authorize the minimum work necessary to resolve the verified Critical and High findings so the repository can become the safe System of Record for migration history.

---

## Section 2 — Verification Review

### Critical

**C1 — Migration replay fails due to renamed canonical ordering**

* **Description:** `npx supabase db diff --local` applies the canonical chain in ascending version order. The renamed migration `20260713053550_sp1_6_expand_audit_log_event_types.sql` contains SQL that references `public.audit_log`, which is created by `20260715000001_create_audit_log_table.sql`. Because `20260713053550` is lexicographically earlier than `20260715000001`, the `ALTER TABLE public.audit_log` statement executes before the table exists.
* **Evidence:** `npx supabase db diff --local` output reports `ERROR: relation "public.audit_log" does not exist (SQLSTATE 42P01) At statement: 0 ... ALTER TABLE public.audit_log ...`.
* **Impact:** The repository cannot replay against a fresh local database; `supabase db push` / `supabase db reset` would fail, blocking deployment and undermining the repository as the System of Record.
* **Blocking status:** Blocking — prevents acceptance and any deployment activity.

### High

**H1 — `MIGRATION_VERSION_ALIASES.md` is missing**

* **Description:** `REPOSITORY_REBASELINE_PLAN.md` Section 4 mandates a permanent alias record documenting the 9 removed historical timestamps. No standalone `MIGRATION_VERSION_ALIASES.md` file exists.
* **Evidence:** `find_file_by_name` search for `MIGRATION_VERSION_ALIASES*` returned no results.
* **Impact:** The audit trail for the re-timestamped migrations is not permanently persisted in the repository baseline.
* **Blocking status:** Blocking — required governance artifact for acceptance.

**H2 — Archive index is missing**

* **Description:** `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md` and `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` require an archive index listing each archived non-canonical file with SHA-256, classification, and final disposition. No `INDEX.md` was found in `archive/supabase/non_canonical_migrations/`.
* **Evidence:** `archive/supabase/non_canonical_migrations/` contains only `.sql` files; `find_file_by_name` for `INDEX.md` returned no results.
* **Impact:** The 17 archived non-canonical files are not catalogued, reducing traceability.
* **Blocking status:** Blocking — required governance artifact for acceptance.

### Medium

**M1 — Local CLI verification commands blocked by missing database**

* **Description:** `supabase migration list --local` and `supabase db lint` could not connect to a local Postgres instance.
* **Evidence:** Both commands returned `failed to connect to postgres`.
* **Impact:** Some CLI-level verification gates could not be completed. The `db diff` command, which starts a shadow stack, provided the key migration replay evidence.
* **Blocking status:** Not blocking for acceptance authorization; should be re-run after C1 is resolved.

### Low

None identified.

---

## Section 3 — Root Cause Review

For **C1 — Migration replay fails due to renamed canonical ordering**:

* **Verified technical cause:** The production-applied version `20260713053550` was assigned to `sp1_6_expand_audit_log_event_types`. The migration body alters `public.audit_log`. The canonical repository creates `public.audit_log` in `20260715000001_create_audit_log_table.sql`, whose version string is lexicographically later than `20260713053550`. Supabase CLI applies migrations in ascending version order, so the `ALTER TABLE public.audit_log` statement runs before the table is created.
* **Affected migrations:** `supabase/migrations/20260713053550_sp1_6_expand_audit_log_event_types.sql` and `supabase/migrations/20260715000001_create_audit_log_table.sql`.
* **Affected repository artifacts:** The `supabase/migrations` canonical chain; the `REPOSITORY_REBASELINE_PLAN.md` mapping table in Section 5.2; and the `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` rename record.
* **Affected governance artifacts:** `REPOSITORY_REBASELINE_PLAN.md` (canonical migration strategy and mapping), `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` (rename execution evidence), and any alias record derived from the mapping.

---

## Section 4 — Remediation Scope Definition

### Critical Technical Remediation

Authorize investigation and correction of the canonical migration replay defect identified in C1. Do NOT predetermine the technical solution. Permit Engineering to evaluate and implement the appropriate approved correction based on repository evidence. Candidate approaches include, but are not limited to:

* Re-timestamping `create_audit_log_table.sql` to a version earlier than `20260713053550`.
* Re-timestamping the affected `sp1_6` migration to a later slot.
* Documenting why production did not encounter this dependency and adjusting the canonical chain accordingly.

### Governance Artifact Completion

Authorize creation of:

* `MIGRATION_VERSION_ALIASES.md`
* `archive/supabase/non_canonical_migrations/INDEX.md`

if verification confirms they are required.

### Out of Scope

Explicitly prohibit:

* unrelated migration edits
* business logic changes
* schema redesign
* RPC modification
* production deployment
* production migration execution
* commit
* push
* release

---

## Section 5 — Risk Assessment

| Risk | Level | Justification |
|---|---|---|
| Technical risk | High | The canonical migration chain cannot replay. Any correction may affect version ordering and schema dependency resolution. |
| Repository integrity risk | Medium | Renames and archives are content-identical, but the ordering fix may require further filename/version changes. |
| Replay risk | Critical | Fresh `supabase db reset` and `supabase db push` will fail until C1 is resolved. |
| Deployment risk | High | Deployment is currently frozen and cannot proceed until the replay defect is remediated and re-verified. |
| Governance risk | Medium | Missing alias and archive index documents reduce traceability; remediation scope must be tightly controlled to prevent scope creep. |

---

## Section 6 — Authorization Conditions

Mandatory conditions before remediation begins:

1. Remediation is limited to verified findings C1, H1, H2, and any directly dependent verification re-run.
2. Evidence from `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` is retained and referenced.
3. Repository traceability is maintained — all changes must be traceable to this authorization and the verification report.
4. Rollback capability is preserved — `pre-rebaseline-2026-07-19` tag and baseline commit `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` must remain intact.
5. No production modification — production database, `schema_migrations`, and deployed environments are not touched.
6. No governance bypass — any deviation from the verified findings requires a new governance exception and re-authorization.

---

## Section 7 — Authorization Decision

```text
Repository Re-baseline Remediation:

AUTHORIZED WITH CONDITIONS
```

**Justification:** The verification report found the implementation `PASS WITH OBSERVATIONS` but identified one Critical replay defect and two High governance artifact gaps that block acceptance. The repository cannot become the System of Record until `db diff --local` replays successfully and the required alias and index documents exist. The risks are acceptable only if remediation is tightly scoped to the verified findings, evidence is retained, the rollback tag is preserved, and no production system is modified. The conditions above are necessary to prevent scope creep and preserve governance integrity.

---

## Section 8 — Next Authorized Step

```text
REPOSITORY_REBASELINE_REMEDIATION_IMPLEMENTATION.md
```

No remediation, repository modification, verification, acceptance, commit, push, or deployment is authorized until that document is completed and approved.
