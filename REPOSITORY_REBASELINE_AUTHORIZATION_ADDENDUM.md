# REPOSITORY RE-BASELINE AUTHORIZATION ADDENDUM

**Program:** VietSalePro v7 — Production Deployment Program  
**Date:** 2026-07-19  
**Authorizing Authority:** Repository Re-baseline Authorization Authority  
**Scope:** Authorization decision only. No repository, Git, migration, archive, production, or database modifications are authorized by this document.

---

## Authoritative Inputs

This authorization addendum is based exclusively on the following approved governance artifacts:

- `REPOSITORY_REBASELINE_PLAN.md`
- `REPOSITORY_REBASELINE_AUTHORIZATION.md`
- `REPOSITORY_REBASELINE_IMPLEMENTATION.md`
- `NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md`
- `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md`
- `GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md`

No assumptions outside these artifacts are introduced.

---

## Section 1 — Executive Summary

This authorization addendum is required because the original `REPOSITORY_REBASELINE_AUTHORIZATION.md` was issued before the `NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md` revealed that the 17 `supabase/migration_*.sql` files could not be archived wholesale. The original implementation stopped at Phase 4 when 16 of those files were found to contain SQL that is not a contiguous, byte-identical duplicate of a canonical migration. The revised governance artifacts now define a per-file disposition plan and a new set of pre-implementation conditions.

The following governance artifacts have been completed:

- `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` — revises the original plan with a staged non-canonical disposition matrix and new verification gates.
- `GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md` — reviews the 14 non-exact-duplicate non-canonical files and approves their disposition with conditions.
- `NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md` — classifies all 17 non-canonical files by duplicate, canonicalized-elsewhere, partially duplicated, and anonymous `DO` block status.
- `REPOSITORY_REBASELINE_IMPLEMENTATION.md` — records the prior implementation attempt, the Phase 4 failure, and the required recovery actions.

The original `REPOSITORY_REBASELINE_AUTHORIZATION.md` is no longer sufficient because it authorized a wholesale archive of the 17 non-canonical files, an approach that the forensic investigation and plan addendum have superseded. It also predates the governance exception review that is now required for the 14 non-exact-duplicate files.

This addendum authorizes the resumption of the Repository Re-baseline Implementation **only** under the revised scope and mandatory conditions described below. It does not authorize verification, deployment, production database changes, or any work outside the re-baseline scope.

---

## Section 2 — Authorization Review

| Artifact | Status | Accepted | Outstanding Issues | Authorization Impact |
|---|---|---|---|---|
| **Original `REPOSITORY_REBASELINE_AUTHORIZATION.md`** | `AUTHORIZED WITH CONDITIONS` (superseded) | Yes — the core re-baseline strategy (rename 9 divergent migrations, preserve 2 new migrations, maintain freeze, no production changes) remains valid. | The original authorization's non-canonical archive condition assumed the 17 files could be archived wholesale; that assumption is now invalid. | The original authorization is superseded for non-canonical disposition and must be replaced by this addendum. |
| **`REPOSITORY_REBASELINE_PLAN_ADDENDUM.md`** | `APPROVED WITH CONDITIONS` | Yes — the per-file disposition matrix, staged Phase 4 execution plan, and revised verification gates are approved. | Implementation may not begin until the engineering attestations and reviews required by the disposition matrix are completed. | Provides the new technical execution plan; this addendum must confirm its conditions before work resumes. |
| **`GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md`** | `APPROVED WITH CONDITIONS` | Yes — the 7 canonicalized-elsewhere files are approved for archive with object-equivalence attestations; the 2 partial-duplicate and 5 anonymous `DO` block files are approved for engineering review. | Engineering must record the required attestations and reconciliation decisions before any archive or conversion. | Authorizes the governance exceptions required for the non-exact-duplicate non-canonical files. |
| **`NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md`** | `COMPLETED` | Yes — the 17 non-canonical files are classified and the forensic evidence is accepted. | None. The investigation is complete. | Supplies the evidence base for the disposition matrix and this authorization. |

---

## Section 3 — Governance Prerequisite Verification

| Prerequisite | Status | Evidence |
|---|---|---|
| **Forensic investigation** | `PASS` | `NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md` has reviewed all 17 `supabase/migration_*.sql` files and classified them as 3 exact duplicates, 7 canonicalized elsewhere, 2 partially duplicated, and 5 anonymous `DO` block files. |
| **Revised planning** | `PASS WITH CONDITIONS` | `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` is approved with conditions and replaces the wholesale archive approach with a staged, per-file disposition plan. Conditions are listed in this addendum. |
| **Governance exception review** | `PASS WITH CONDITIONS` | `GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md` is approved with conditions for the 14 non-exact-duplicate files. Engineering attestations and reviews remain to be recorded. |
| **Repository rollback strategy** | `PASS` | `pre-rebaseline-2026-07-19` tag exists and points to `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c`. `REPOSITORY_REBASELINE_PLAN.md` Section 10 defines Git, migration, and documentation rollback procedures. |
| **Archive strategy** | `PASS WITH CONDITIONS` | `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` Section 4 defines the disposition matrix and `archive/supabase/non_canonical_migrations/` target. Archive is approved only after the required attestations and SHA-256 verification. |
| **Verification strategy** | `PASS WITH CONDITIONS` | `REPOSITORY_REBASELINE_PLAN.md` Sections 9.1–9.7 and `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` Section 6 define the verification gates. Gates may be executed only after the pre-implementation conditions are met. |
| **Risk assessment** | `PASS WITH CONDITIONS` | `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` Section 7 and `GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md` Section 6 document residual risks and mitigations. Conditions in this addendum must be met for residual risk to remain acceptable. |

---

## Section 4 — Authorization Conditions

The following mandatory conditions must be satisfied before implementation resumes, during implementation, and before any verification is executed.

### Before implementation

1. **Engineering object-equivalence attestations** — The Engineering Review Authority must attest, for each of the 7 canonicalized-elsewhere files listed in `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` Section 4, that every top-level object already exists in the canonical `supabase/migrations` chain with an identical signature.
2. **Reconciliation of partially duplicated migrations** — For `migration_phase6_stock_ledger_hardening.sql` and `migration_phase6_stock_ledger_hardening_part1.sql`, engineering must determine whether `stock_movements_backup_phase6` (and its index), `calc_qty_after_transaction`, and any overlapping objects are required, and must convert or merge them into canonical migrations if required. A recorded decision must exist for each unique object.
3. **Engineering review of anonymous `DO` block files** — For the 5 `part5*` and `part6` `migration_phase6_stock_ledger_hardening_*.sql` files, engineering must determine whether each anonymous `DO` block validation script is required for deployment or historical replay, and must convert required scripts to canonical migrations at the correct chronological position.
4. **Rollback tag verification** — Confirm that `pre-rebaseline-2026-07-19` still points to the recorded baseline commit `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` and that the staged renames from the failed implementation have been rolled back to the baseline state.
5. **Governance document consistency** — Confirm that `REPOSITORY_REBASELINE_PLAN.md`, `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md`, `GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md`, and this addendum are mutually consistent and that all disposition decisions are traceable to forensic evidence.

### During implementation

6. **SHA-256 verification** — Compute and record SHA-256 hashes for every non-canonical file before and after any move, and for any file converted to a canonical migration. Verify that archived hashes match the values recorded in the disposition matrix.
7. **Archive verification** — Move non-canonical files only to `archive/supabase/non_canonical_migrations/`. Confirm each file is listed in an `INDEX.md` with its SHA-256, classification, and final disposition. Confirm no unapproved `supabase/migration_*.sql` file remains outside `supabase/migrations` after archive operations.
8. **Follow the approved disposition matrix** — Execute only the dispositions in `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` Section 4 and the decisions recorded by the Engineering Review Authority. No deviation is permitted without a new governance exception.
9. **Preserve rollback capability** — Do not rewrite Git history, force-push, or commit the re-baseline until the pre-implementation conditions and initial verification gates are satisfied.

### Before verification

10. **Repository baseline restored** — `supabase/migrations` must reflect the intended canonical set before the `supabase migration list`, `supabase db lint`, `supabase db reset`, and `supabase db diff` verification commands are executed.
11. **No unapproved non-canonical files remain** — No `supabase/migration_*.sql` file may remain outside `supabase/migrations` except files explicitly retained and documented in the archive index.
12. **Alias and identity documentation** — `MIGRATION_VERSION_ALIASES.md` must be created or updated with the 9 old-to-canonical version mappings and the `phatnt056` / `suacauba@gmail.com` identity reconciliation.

---

## Section 5 — Authorized Scope

### Authorized

- Rollback of the previously staged 9 renames to the `pre-rebaseline-2026-07-19` baseline, if not already completed.
- Re-execution of the 9 canonical migration renames in `supabase/migrations` to their production-applied `version` strings.
- Preservation of the 2 genuinely new local migrations unchanged.
- Archive operations for the 3 exact-duplicate `supabase/migration_*.sql` files to `archive/supabase/non_canonical_migrations/`.
- Archive operations for the 7 canonicalized-elsewhere `supabase/migration_*.sql` files, provided the required object-equivalence attestations are completed.
- Conversion or merging of objects from the 2 partially duplicated files and the 5 anonymous `DO` block files into canonical migrations, if engineering review determines they are required.
- Creation or update of governance documents directly required by implementation: `MIGRATION_VERSION_ALIASES.md`, the non-canonical archive `INDEX.md`, and `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md`.

### Not Authorized

- Production deployment of any kind.
- Execution of database migrations against production.
- Modification of production systems, including `supabase_migrations.schema_migrations`.
- Execution of verification commands before all pre-implementation and during-implementation conditions are met.
- Acceptance review or acceptance decision.
- Any work outside the approved Repository Re-baseline scope.

---

## Section 6 — Risk Acceptance

| Risk Domain | Assessment | Justification |
|---|---|---|
| **Repository integrity** | `ACCEPTED WITH CONDITIONS` | Integrity is preserved if the 9 renames are byte-identical, the pre-rebaseline tag is intact, and the non-canonical disposition matrix is followed. The 2 partial-duplicate and 5 `DO` block files must be dispositioned before acceptance is final. |
| **Production parity** | `ACCEPTED WITH CONDITIONS` | Production parity is maintained because no production `schema_migrations` changes are authorized and the 9 divergent renames use the production-applied versions. Parity depends on engineering confirming that unique objects in partial-duplicate files and any required `DO` block scripts are converted to canonical migrations. |
| **Migration replay** | `ACCEPTED WITH CONDITIONS` | Fresh `supabase db reset` replay safety depends on all required objects and validation scripts being present in the canonical chain. Anonymous `DO` block scripts and unique objects from partially duplicated files must be reviewed and converted if required. |
| **Rollback capability** | `ACCEPTED` | The `pre-rebaseline-2026-07-19` tag, the exported production `schema_migrations` snapshot, and the Git-based rollback procedure provide a recoverable baseline. The only limitation is if the re-baseline is pushed and based upon, which is not authorized. |
| **Auditability** | `ACCEPTED WITH CONDITIONS` | Auditability is preserved if `MIGRATION_VERSION_ALIASES.md`, the archive `INDEX.md`, object-equivalence attestations, and this addendum are committed. It depends on the engineering attestations and reconciliation records being completed. |

**Overall residual risk acceptance:** `ACCEPTED WITH CONDITIONS`.

The residual risks are acceptable provided the mandatory conditions in Section 4 are satisfied. If any condition is skipped, the risk acceptance is void and implementation must stop.

---

## Section 7 — Authorization Decision

```text
Repository Re-baseline Authorization Addendum:

AUTHORIZED WITH CONDITIONS
```

**Justification:**

All required governance artifacts have been completed and reviewed. The forensic investigation provides a clear, evidence-based classification of the 17 non-canonical files. The plan addendum and governance exception review addendum define the acceptable dispositions and the conditions required for safe execution. The core re-baseline strategy remains sound: the 9 divergent migrations will be renamed to their production-applied versions, the 2 genuinely new migrations will be preserved, and no production database modifications will occur.

Implementation is authorized to resume only after the pre-implementation conditions are met, specifically the engineering attestations for the 7 canonicalized-elsewhere files, the reconciliation of the 2 partially duplicated files, the review of the 5 anonymous `DO` block files, rollback tag verification, SHA-256 verification, archive verification, and governance document consistency. Verification and deployment remain not authorized.

---

## Section 8 — Implementation Constraints

- Follow the approved disposition matrix in `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` Section 4.
- Follow the staged Phase 4 execution plan in `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` Section 5.
- Preserve SHA-256 records for every affected file.
- Preserve the `pre-rebaseline-2026-07-19` tag and the production `schema_migrations` snapshot.
- Preserve production parity; no production `schema_migrations` modifications are permitted.
- No deployment to production.
- No execution of migrations against production.
- No verification execution until all pre-implementation and during-implementation conditions are satisfied.
- No rewriting of Git history, force-push, or push to `origin/master` before acceptance.
- No acceptance review or acceptance decision is authorized by this document.

---

## Section 9 — Next Authorized Step

```text
REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md
```

The next authorized artifact is a resumption report that records the completion of the Section 4 pre-implementation conditions and the controlled re-start of the `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` Section 5 staged implementation sequence. Verification, deployment, and acceptance are not authorized as next steps.

---

# Final Authorization Decision

```text
Repository Re-baseline Authorization Addendum

AUTHORIZED WITH CONDITIONS
```

**Evidence-based justification:**

- `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` is approved with conditions and provides a revised, per-file disposition plan for the 17 non-canonical `supabase/migration_*.sql` files.
- `GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md` is approved with conditions for the 14 non-exact-duplicate non-canonical files.
- `NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md` has completed the classification of all 17 non-canonical files.
- `REPOSITORY_REBASELINE_IMPLEMENTATION.md` documented the Phase 4 failure and preserved the pre-rebaseline tag, the production `schema_migrations` snapshot, and the staged renames.
- All mandatory prerequisites (forensic investigation, revised planning, governance exception review, rollback strategy, archive strategy, verification strategy, and risk assessment) are satisfied or satisfied with conditions.
- The residual risks are accepted with conditions because no production operations are authorized, a rollback tag exists, and the disposition plan is evidence-based.

Implementation may resume only when the conditions in this addendum are met. No verification, deployment, or acceptance is authorized.
