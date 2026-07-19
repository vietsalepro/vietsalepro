# REPOSITORY RE-BASELINE AUTHORIZATION

**Program:** VietSalePro v7 — Production Deployment Program  
**Date:** 2026-07-19  
**Authorizing Authority:** Repository Re-baseline Authorization Authority  
**Scope:** Authorization decision only. No repository, Git, production, or database modifications are performed by this document.

---

## Evidence Base

The following completed governance artifacts are treated as authoritative for this authorization:

- `REPOSITORY_HYGIENE_REVIEW.md`
- `MIGRATION_RECONCILIATION_REPORT.md`
- `MIGRATION_PROVENANCE_INVESTIGATION.md`
- `GOVERNANCE_EXCEPTION_REVIEW.md`
- `REPOSITORY_REBASELINE_PLAN.md`
- `SUPABASE_REBASELINE_FEASIBILITY_REVIEW.md`

---

## Authorization Scope

This review determines whether the Repository Re-baseline Implementation may begin. It authorizes only the controlled reconciliation described in `REPOSITORY_REBASELINE_PLAN.md`: renaming nine divergent canonical migration files to their production-applied `version` strings, preserving two genuinely new local migrations, archiving seventeen non-canonical migration files, and producing the required governance/alias documentation.

---

## Governance Authorization Review

| Confirm | Finding |
|---|---|
| Governance Exception conditions are fully understood. | Yes. The `GOVERNANCE_EXCEPTION_REVIEW.md` conditions have been mapped to concrete pre-implementation tasks in this authorization. |
| Repository remains under deployment freeze. | Yes. The freeze is active and must remain in place until the verification report is accepted. |
| `REPOSITORY_REBASELINE_PLAN.md` has no unresolved governance blockers. | Yes, provided the conditions below are satisfied before any file changes. |
| Production remains immutable. | Yes. No production `schema_migrations` modifications are authorized. |
| Audit trail is preserved. | Yes. The existing investigation reports, commit history, and required `MIGRATION_VERSION_ALIASES.md` preserve the audit trail. |
| Identity reconciliation requirements are acknowledged. | Yes. The relationship between `phatnt056` (Git) and `suacauba@gmail.com` (Supabase `created_by`) must be documented before implementation. |

**Decision:** `PASS`

**Justification:** The governance exception has already been approved with conditions, the plan is internally consistent, and all residual governance gaps are addressed by mandatory pre-implementation conditions.

---

## Engineering Authorization Review

| Confirm | Finding |
|---|---|
| Engineering approach is technically valid. | Yes. The rename strategy is consistent with the Supabase migration identity model: the `YYYYMMDDHHMMSS` prefix is the `version` used by `schema_migrations`. |
| `REPOSITORY_REBASELINE_PLAN.md` is internally consistent. | Yes. The mapping table, ordering, and acceptance criteria are coherent and traceable to the evidence. |
| Feasibility Review recommendations have been accepted. | Yes. All eight engineering recommendations (pre-rename checks, SHA-256 verification, CLI gates, alias documentation, non-canonical archive, no `migration repair` on production, hosted CLI caveat) are reflected in the conditions and execution checklist. |
| No unsupported engineering assumptions remain. | The version-only identity model is well supported; the hosted/Branching CLI caveat is documented and will be verified with `db push --dry-run` in the target pipeline. |

**Decision:** `PASS`

---

## Repository Authorization Review

Implementation is explicitly limited to:

- Canonical migration filenames inside `supabase/migrations`.
- Approved governance documentation (`MIGRATION_VERSION_ALIASES.md`, verification report, etc.).
- Approved archive operations for the 17 non-canonical `supabase/migration_*.sql` files.

| Confirm | Finding |
|---|---|
| No source code modifications. | Confirmed. No application source files are in scope. |
| No application logic changes. | Confirmed. |
| No API changes. | Confirmed. |
| No database SQL changes. | Confirmed. SQL bodies are not edited; only filenames/`version` strings change. |
| No feature work. | Confirmed. |

**Decision:** `PASS`

---

## Migration Authorization Review

| Confirm | Finding |
|---|---|
| 9 divergent migrations are correctly identified. | Yes. The 9 production-only `20260713...` versions and their 9 local re-timestamped counterparts are mapped in `REPOSITORY_REBASELINE_PLAN.md` Section 5.2 and `MIGRATION_PROVENANCE_INVESTIGATION.md` Section 2. |
| 127 canonical migrations remain unchanged. | Yes. The `MIGRATION_RECONCILIATION_REPORT.md` confirms 127 exact version matches and no version collisions. |
| 2 genuinely new migrations remain preserved. | Yes. `20260718000001_sp_7_1_set_tenant_subdomain` and `20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions` have no production counterpart and are kept unchanged. |
| Migration ordering is defined. | Yes. The 9 production versions sort before the 127 matches; the 2 new versions sort after the latest production version `20260718000000`. |
| Canonical mapping is complete. | Yes. The planned canonical version mapping covers all 138 local files and aligns with the 136 production-applied versions. |

**Decision:** `PASS`

---

## Verification Authorization Review

All mandatory verification gates are present:

| Gate | Location |
|---|---|
| Migration list | `REPOSITORY_REBASELINE_PLAN.md` Section 9.3; `SUPABASE_REBASELINE_FEASIBILITY_REVIEW.md` Recommendation 5. |
| `db push --dry-run` | `REPOSITORY_REBASELINE_PLAN.md` Section 9.3; `SUPABASE_REBASELINE_FEASIBILITY_REVIEW.md` Recommendation 5. |
| `db reset` (fresh replay) | `REPOSITORY_REBASELINE_PLAN.md` Section 9.4; `SUPABASE_REBASELINE_FEASIBILITY_REVIEW.md` Recommendation 5. |
| SHA-256 verification | `REPOSITORY_REBASELINE_PLAN.md` Section 11; `SUPABASE_REBASELINE_FEASIBILITY_REVIEW.md` Recommendation 3. |
| Migration alias verification | `REPOSITORY_REBASELINE_PLAN.md` Sections 4, 9.6. |
| Fresh environment verification | `REPOSITORY_REBASELINE_PLAN.md` Section 9.4. |
| Deployment verification (`db diff`, dry-run) | `REPOSITORY_REBASELINE_PLAN.md` Sections 9.3, 9.5. |
| Acceptance verification | `REPOSITORY_REBASELINE_PLAN.md` Section 9.7. |

**Decision:** `PASS` — no mandatory verification gate is missing.

---

## Rollback Authorization Review

| Required Element | Finding |
|---|---|
| Repository rollback | A pre-rebaseline git tag `pre-rebaseline-2026-07-19` is required before any file changes; rollback uses `git checkout`/`git reset` from that tag. |
| Git rollback | Same tag supports branch-based recovery without rewriting published history. |
| Documentation rollback | `MIGRATION_VERSION_ALIASES.md` and related governance records may be deleted/reverted to the tag if rejected. |
| Failure conditions | Listed: any verification FAIL, duplicate version collision, content mismatch, non-canonical file containing required SQL, governance rejection. |
| Rollback limitations | If `schema_migrations` is modified or the re-baseline is pushed and baselined upon, rollback is no longer simple and requires incident response / forward-fix. |

**Decision:** `PASS`

---

## Risk Authorization Review

| Risk Domain | Assessment |
|---|---|
| Technical risk | Low. The 9 divergent migrations are byte-for-byte identical to production `statements`; no SQL edits are planned. |
| Repository risk | Low. A `pre-rebaseline` tag and SHA-256 checks protect against rename corruption. |
| Deployment risk | Low once `db push --dry-run` confirms only the 2 new migrations would run. |
| Operational risk | Low. No production operations are authorized; fresh-environment `db reset` isolates replay risk. |
| Audit risk | Low. The alias record and identity documentation close the `phatnt056`/`suacauba@gmail.com` gap. |

**Residual Risk:** `LOW`

**Justification:** The root cause (re-timestamping by the project owner with identical SQL content) is understood, the strategy avoids production mutation, and the required verification/rollback controls reduce residual risk to a normal execution-level concern. Risk rises if any pre-implementation condition is skipped.

---

## Preconditions Review

| # | Mandatory Precondition | Status |
|---|---|---|
| 1 | Governance approval of this `REPOSITORY_REBASELINE_AUTHORIZATION.md` | Satisfied by this authorization, upon signature/acceptance. |
| 2 | Pre-rebaseline git tag `pre-rebaseline-2026-07-19` created and verified | Missing (required before any file changes). |
| 3 | Production `supabase_migrations.schema_migrations` snapshot exported and stored | Missing. |
| 4 | 17 non-canonical `supabase/migration_*.sql` files reviewed for unique content | Partially Satisfied — inventory exists; disposition must be executed. |
| 5 | Identity reconciliation (`phatnt056` / `suacauba@gmail.com`) documented in `MIGRATION_VERSION_ALIASES.md` | Missing. |
| 6 | Deployment freeze remains in effect | Satisfied. |
| 7 | Fresh Supabase environment available for `db reset` and dry-run verification | Partially Satisfied — availability must be confirmed before Phase 3. |

---

## Authorization Conditions

The following conditions MUST be satisfied immediately before implementation begins:

1. Create and verify the pre-rebaseline git tag `pre-rebaseline-2026-07-19`.
2. Export and store a snapshot of production `supabase_migrations.schema_migrations`.
3. Review the 17 non-canonical `supabase/migration_*.sql` files, archive them under `archive/supabase/non_canonical_migrations/`, and create the required index file.
4. Prepare `MIGRATION_VERSION_ALIASES.md` documenting:
   - the 9 old `version` → new canonical `version` mappings,
   - the identity reconciliation note for `phatnt056` and `suacauba@gmail.com`,
   - relevant commit references (`86b339ad`, `41b43805`, etc.) and provenance evidence.
5. Confirm the deployment freeze is active and no production deployment or `supabase db push` is attempted.
6. Confirm a fresh Supabase environment is available for `supabase db reset` and `db push --dry-run` verification.
7. Verify `git status` is limited to planned governance documents and the intended migration renames/archives (no source/config changes).
8. This authorization is formally accepted by the Program Manager / Governance Authority.

---

## Implementation Boundaries

### Allowed

- Rename the 9 canonical migration files in `supabase/migrations` to their production-applied `version` strings.
- Preserve the 2 genuinely new local migrations unchanged.
- Archive the 17 non-canonical `supabase/migration_*.sql` files to the approved archive directory.
- Create/update governance documents: `MIGRATION_VERSION_ALIASES.md`, `REPOSITORY_REBASELINE_IMPLEMENTATION_REPORT.md`, `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md`, and the archive index.
- Compute SHA-256 hashes for the affected migration files before and after rename.
- Create the `pre-rebaseline-2026-07-19` tag.
- Run read-only/list/diff/dry-run/`db reset` verification commands against a fresh or staging environment only.

### Not Allowed

- Production schema modifications.
- `supabase migration repair` on production.
- Manual edits to `supabase_migrations.schema_migrations`.
- SQL body changes to any migration.
- Feature development or unrelated commits.
- Rewriting Git history (`rebase`, `filter-branch`, force-push).
- Pushing the re-baseline to `origin/master` before acceptance.

---

## Implementation Exit Criteria

Implementation is not complete until all of the following are satisfied:

1. `supabase/migrations` contains exactly 138 canonical migration files.
2. All 136 production-applied versions are present as filenames and are byte-identical to the `statements` recorded in `schema_migrations`.
3. The 2 genuinely new migrations (`20260718000001_sp_7_1_set_tenant_subdomain` and `20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions`) are preserved and validated in a fresh environment.
4. No `migration_*.sql` files remain outside `supabase/migrations`.
5. No duplicate `version` strings exist in `supabase/migrations`.
6. `MIGRATION_VERSION_ALIASES.md` is committed and documents every re-timestamped migration plus the identity reconciliation.
7. `supabase migration list` and `supabase db lint` succeed without errors.
8. A fresh `supabase db reset` completes successfully and produces the expected 138 `schema_migrations` rows.
9. `supabase db diff` against production shows only the 2 new, intended migrations.
10. The working tree is clean and the re-baseline is committed with a reference to `REPOSITORY_REBASELINE_PLAN.md`.
11. The Governance Acceptance Authority records approval.

---

## Authorization Decision Matrix

| Domain | Decision | Notes |
|---|---|---|
| Governance | `PASS` | Exception conditions understood; freeze and audit controls in place. |
| Engineering | `PASS` | Rename strategy is consistent with Supabase migration identity model. |
| Repository | `PASS` | Scope is limited to filenames, documentation, and archive operations. |
| Migration | `PASS` | 9 divergent, 127 unchanged, 2 new preserved; mapping and ordering defined. |
| Verification | `PASS` | All mandatory verification gates are present. |
| Rollback | `PASS` | Tag, Git rollback, documentation rollback, triggers, and limitations defined. |
| Risk | `LOW` | Residual risk is low after mitigation and production-avoidance. |
| Overall Readiness | `CONDITIONAL PASS` | Implementation may begin only after the mandatory preconditions are satisfied. |

---

## Final Authorization Decision

```text
Repository Re-baseline Authorization:

AUTHORIZED WITH CONDITIONS
```

**Justification:**

The governance, engineering, migration, verification, and rollback dimensions are satisfactory. The residual risk is low because the re-baseline does not modify production, the SQL intent is unchanged, and a clear rollback path exists. However, the pre-implementation conditions (pre-rebaseline tag, production snapshot, non-canonical file archive, identity/alias documentation, and fresh environment confirmation) have not yet been executed. Therefore, implementation is authorized only after every condition in the "Authorization Conditions" section is satisfied, verified, and accepted by the Program Manager / Governance Authority.

---

## Mandatory Execution Checklist

The following verification and control steps must be performed during implementation:

- [ ] Run `supabase migration list` before any renames to confirm the current divergence.
- [ ] Create `git tag pre-rebaseline-2026-07-19` and verify it.
- [ ] Pre-compute all planned new filenames and confirm no duplicate `version` strings.
- [ ] Compute SHA-256 for each of the 9 files before and after rename.
- [ ] Confirm each renamed file's contents match the corresponding production `schema_migrations.statements` entry.
- [ ] Run `supabase migration list` after rename and confirm all 138 versions are recognized.
- [ ] Run `supabase db lint` and confirm no blocking issues.
- [ ] Run `supabase db reset` in a fresh environment and confirm completion.
- [ ] Run `supabase db push --dry-run` (or `supabase migration up --dry-run`) and confirm only the 2 new migrations would be applied.
- [ ] Run `supabase db diff` against production and confirm only the 2 new migrations appear.
- [ ] Confirm the 17 non-canonical files are archived and no `migration_*.sql` remains outside `supabase/migrations`.
- [ ] Confirm `MIGRATION_VERSION_ALIASES.md` is committed with all 9 mappings and identity reconciliation.
- [ ] Produce and approve `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md`.
- [ ] Obtain formal acceptance from the Governance Acceptance Authority before lifting the deployment freeze.

---

## Next Authorized Step

```text
REPOSITORY_REBASELINE_IMPLEMENTATION.md
```

The next artifact shall be the implementation report/plan that executes the conditions and checklist above. No repository, Git, production, or database changes may be performed until that artifact is produced and this authorization is accepted.
