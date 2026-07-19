# GOVERNANCE EXCEPTION REVIEW ADDENDUM

**Program:** VietSalePro v7 — Production Deployment Program  
**Date:** 2026-07-19  
**Authority:** Governance Exception Review Authority  
**Scope:** Governance decision only. No repository, Git, migration, or production modifications are authorized by this document.

**Authoritative Inputs:**

- `REPOSITORY_REBASELINE_PLAN.md`
- `REPOSITORY_REBASELINE_AUTHORIZATION.md`
- `REPOSITORY_REBASELINE_IMPLEMENTATION.md`
- `NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md`
- `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md`

---

## Section 1 — Executive Summary

The `REPOSITORY_REBASELINE_IMPLEMENTATION.md` was stopped at the mandatory Phase 4 gate when the 17 non-canonical `supabase/migration_*.sql` files could not be archived wholesale. The original `REPOSITORY_REBASELINE_PLAN.md` had assumed those files were either exact duplicates of canonical migrations or disposable working drafts. The `NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md` refuted that assumption:

- 3 files are exact duplicates of canonical migrations.
- 14 files are non-exact duplicates: 7 are canonicalized elsewhere, 2 are partially duplicated, and 5 contain anonymous PL/pgSQL `DO` blocks with no extractable top-level schema objects.

Because the 14 non-exact-duplicate files contain SQL that is not present as a contiguous block in the canonical `supabase/migrations` chain, archiving them without conversion is a governance exception. This addendum reviews each of those 14 exceptions and determines whether the proposed dispositions in `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` are acceptable.

**Governance approval is required now** because the revised Repository Re-baseline Plan introduces a new disposition strategy that the original `REPOSITORY_REBASELINE_AUTHORIZATION.md` did not foresee. No implementation may resume until this review is completed and the required authorization addendum is approved.

---

## Section 2 — Exception Inventory

This review covers the **14 non-exact-duplicate** non-canonical `supabase/migration_*.sql` files identified in `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` Section 3. The 3 exact-duplicate files are not in scope because no governance exception is required for their archive.

| Filename | Forensic Classification | Proposed Disposition | Engineering Recommendation | Governance Impact |
|---|---|---|---|---|
| `migration_fix_stock_ledger_phase2_backfill_v2.sql` | Canonicalized elsewhere | Archive with object-equivalence attestation | Attest that all 5 functions already exist in the canonical chain with identical signatures. | Low impact if attestation is satisfied; SQL is not byte-identical but all created objects are already represented. |
| `migration_phase10_reports.sql` | Canonicalized elsewhere | Archive with object-equivalence attestation | Attest that all 4 report functions already exist in the canonical chain with identical signatures. | Low impact if attestation is satisfied; objects already canonicalized. |
| `migration_phase1_security_cleanup.sql` | Canonicalized elsewhere | Archive with object-equivalence attestation | Attest that the `authenticated_full_access_temp` policy exists in the canonical chain and was dropped as intended. | Low impact if attestation is satisfied; policy object already represented. |
| `migration_phase3a_import_cost_ssot.sql` | Canonicalized elsewhere | Archive with object-equivalence attestation | Attest that all 7 objects (4 backup tables, adjusted column, 3 functions) exist in the canonical chain with identical signatures. | Low impact if attestation is satisfied; all created objects already canonicalized. |
| `migration_phase6_stock_ledger_hardening_part2.sql` | Canonicalized elsewhere | Archive with object-equivalence attestation | Attest that `insert_stock_ledger_entry` exists in the canonical chain with identical signature. | Low impact if attestation is satisfied; function already canonicalized. |
| `migration_phase6_stock_ledger_hardening_part3.sql` | Canonicalized elsewhere | Archive with object-equivalence attestation | Attest that the `trg_stock_movements_calc_qty_after` trigger/function exists in the canonical chain and was dropped as intended. | Low impact if attestation is satisfied; object already represented. |
| `migration_phase6_stock_ledger_hardening_part4.sql` | Canonicalized elsewhere | Archive with object-equivalence attestation | Attest that `check_stock_ledger_drift` exists in the canonical chain with identical signature. | Low impact if attestation is satisfied; function already canonicalized. |
| `migration_phase6_stock_ledger_hardening.sql` | Partially duplicated | Engineering review required | Determine whether `stock_movements_backup_phase6` and its index are still required; reconcile overlap with `part1` and canonical `part2-4`; convert or merge if required. | Medium impact; unique objects not yet represented in canonical chain or `supabase/schema.sql`. |
| `migration_phase6_stock_ledger_hardening_part1.sql` | Partially duplicated | Engineering review required | Reconcile overlap with file 8; determine whether `calc_qty_after_transaction` is already canonicalized; convert or merge the remaining unique objects if required. | Medium impact; contains objects that also appear in file 8 and at least one object whose canonical status is unresolved. |
| `migration_phase6_stock_ledger_hardening_part5.sql` | Anonymous `DO` block / unique SQL | Engineering review required | Determine whether the anonymous `DO` block validation script is required for deployment or historical replay; convert if required. | Medium impact; no top-level objects, but missing runtime validation could affect replay. |
| `migration_phase6_stock_ledger_hardening_part5a.sql` | Anonymous `DO` block / unique SQL | Engineering review required | Determine whether the anonymous `DO` block validation script is required for deployment or historical replay; convert if required. | Medium impact; no top-level objects, but missing runtime validation could affect replay. |
| `migration_phase6_stock_ledger_hardening_part5b.sql` | Anonymous `DO` block / unique SQL | Engineering review required | Determine whether the anonymous `DO` block validation script is required for deployment or historical replay; convert if required. | Medium impact; no top-level objects, but missing runtime validation could affect replay. |
| `migration_phase6_stock_ledger_hardening_part5c.sql` | Anonymous `DO` block / unique SQL | Engineering review required | Determine whether the anonymous `DO` block validation script is required for deployment or historical replay; convert if required. | Medium impact; no top-level objects, but missing runtime validation could affect replay. |
| `migration_phase6_stock_ledger_hardening_part6.sql` | Anonymous `DO` block / unique SQL | Engineering review required | Determine whether the anonymous `DO` block validation script is required for deployment or historical replay; convert if required. | Medium impact; no top-level objects, but missing runtime validation could affect replay. |

---

## Section 3 — Governance Assessment

### 3.1 Canonicalized-elsewhere files (7 files)

- **Repository integrity:** Preserved, provided the Engineering Review Authority attests that every top-level object already exists in the canonical `supabase/migrations` chain. The forensic investigation found all created objects present in `supabase/schema.sql`.
- **Production parity:** Preserved, because the same objects are already reflected in the local schema snapshot that proxies the production state.
- **Canonical migration history:** Remains trustworthy. The objects are captured in canonical migrations; only the non-canonical file's SQL text is not byte-identical to a single canonical migration.
- **Migration replay safety:** Acceptable. The Supabase CLI ignores `supabase/migration_*.sql` files; a fresh `db reset` against the canonical chain will recreate the objects.
- **Future maintenance:** Acceptable. Archiving the non-canonical files removes shadow-migration drift once the object-equivalence record is committed.

### 3.2 Partially duplicated files (2 files)

- **Repository integrity:** Not fully preserved unless the unique objects (`stock_movements_backup_phase6`, related index, and the unresolved `calc_qty_after_transaction` status) are dispositioned. The forensic investigation found 6 of 7 objects already present in `supabase/schema.sql`; 1 object is unique to the non-canonical file.
- **Production parity:** Cannot be confirmed. The unique object is not present in `supabase/schema.sql`, so production parity is only preserved if engineering confirms the object is not required.
- **Canonical migration history:** Not trustworthy for the unique objects until they are either added to the canonical chain or explicitly rejected as unnecessary.
- **Migration replay safety:** Not acceptable until the unique objects are either converted to canonical migrations or proven unnecessary.
- **Future maintenance:** Not acceptable until the overlap between the two files and the canonical chain is resolved.

### 3.3 Anonymous `DO` block files (5 files)

- **Repository integrity:** Preserved if the `DO` block validation scripts are confirmed as not required. No top-level schema objects are defined, so no schema gap exists.
- **Production parity:** Preserved if the scripts are not needed for runtime. If they are required for historical replay, they must be converted to canonical migrations.
- **Canonical migration history:** Remains trustworthy because no schema objects are omitted; the scripts are historical validation artifacts.
- **Migration replay safety:** Acceptable if engineering confirms the scripts are not required at deployment time.
- **Future maintenance:** Acceptable after a clear engineering decision is recorded and the files are either archived or canonicalized.

---

## Section 4 — Exception Decision Matrix

| File | Proposed Disposition | Governance Risk | Conditions | Decision |
|---|---|---|---|---|
| `migration_fix_stock_ledger_phase2_backfill_v2.sql` | Archive with object-equivalence attestation | LOW | Engineering Review Authority attests all 5 functions exist in the canonical chain with identical signatures; SHA-256 recorded; archive index created. | APPROVED WITH CONDITIONS |
| `migration_phase10_reports.sql` | Archive with object-equivalence attestation | LOW | Engineering Review Authority attests all 4 functions exist in the canonical chain with identical signatures; SHA-256 recorded; archive index created. | APPROVED WITH CONDITIONS |
| `migration_phase1_security_cleanup.sql` | Archive with object-equivalence attestation | LOW | Engineering Review Authority attests the policy exists in the canonical chain and was dropped as intended; SHA-256 recorded; archive index created. | APPROVED WITH CONDITIONS |
| `migration_phase3a_import_cost_ssot.sql` | Archive with object-equivalence attestation | LOW | Engineering Review Authority attests all 7 objects exist in the canonical chain with identical signatures; SHA-256 recorded; archive index created. | APPROVED WITH CONDITIONS |
| `migration_phase6_stock_ledger_hardening_part2.sql` | Archive with object-equivalence attestation | LOW | Engineering Review Authority attests `insert_stock_ledger_entry` exists in the canonical chain with identical signature; SHA-256 recorded; archive index created. | APPROVED WITH CONDITIONS |
| `migration_phase6_stock_ledger_hardening_part3.sql` | Archive with object-equivalence attestation | LOW | Engineering Review Authority attests the trigger/function exists in the canonical chain and was dropped as intended; SHA-256 recorded; archive index created. | APPROVED WITH CONDITIONS |
| `migration_phase6_stock_ledger_hardening_part4.sql` | Archive with object-equivalence attestation | LOW | Engineering Review Authority attests `check_stock_ledger_drift` exists in the canonical chain with identical signature; SHA-256 recorded; archive index created. | APPROVED WITH CONDITIONS |
| `migration_phase6_stock_ledger_hardening.sql` | Engineering review required | MEDIUM | Engineering Review Authority determines whether `stock_movements_backup_phase6` and its index are required; reconciles overlap with `part1` and canonical `part2-4`; if required, converts/merges into canonical migrations before archiving. | APPROVED WITH CONDITIONS |
| `migration_phase6_stock_ledger_hardening_part1.sql` | Engineering review required | MEDIUM | Engineering Review Authority reconciles overlap with file 8; determines canonical status of `calc_qty_after_transaction`; if any unique object is required, converts/merges into canonical migrations before archiving. | APPROVED WITH CONDITIONS |
| `migration_phase6_stock_ledger_hardening_part5.sql` | Engineering review required | MEDIUM | Engineering Review Authority determines whether the anonymous `DO` block is required for deployment or historical replay; if required, converts to a canonical migration at the correct chronological position. | APPROVED WITH CONDITIONS |
| `migration_phase6_stock_ledger_hardening_part5a.sql` | Engineering review required | MEDIUM | Engineering Review Authority determines whether the anonymous `DO` block is required for deployment or historical replay; if required, converts to a canonical migration at the correct chronological position. | APPROVED WITH CONDITIONS |
| `migration_phase6_stock_ledger_hardening_part5b.sql` | Engineering review required | MEDIUM | Engineering Review Authority determines whether the anonymous `DO` block is required for deployment or historical replay; if required, converts to a canonical migration at the correct chronological position. | APPROVED WITH CONDITIONS |
| `migration_phase6_stock_ledger_hardening_part5c.sql` | Engineering review required | MEDIUM | Engineering Review Authority determines whether the anonymous `DO` block is required for deployment or historical replay; if required, converts to a canonical migration at the correct chronological position. | APPROVED WITH CONDITIONS |
| `migration_phase6_stock_ledger_hardening_part6.sql` | Engineering review required | MEDIUM | Engineering Review Authority determines whether the anonymous `DO` block is required for deployment or historical replay; if required, converts to a canonical migration at the correct chronological position. | APPROVED WITH CONDITIONS |

---

## Section 5 — Repository Integrity Assessment

**Assessment:** `PASS WITH CONDITIONS`

The proposed dispositions preserve canonical history, migration traceability, deployment safety, and rollback capability **only if** the following conditions are met:

1. For the 7 canonicalized-elsewhere files, the Engineering Review Authority provides an object-equivalence attestation for every top-level object, confirming that each object already exists in the canonical `supabase/migrations` chain with the same signature.
2. For the 2 partially duplicated files, the unique objects are either converted/merged into canonical migrations or explicitly attested as not required.
3. For the 5 anonymous `DO` block files, engineering confirms whether each script is required for deployment or historical replay; required scripts are converted to canonical migrations before the exception can be exercised.
4. All archive operations are recorded with SHA-256 values and an archive index.
5. The pre-rebaseline tag `pre-rebaseline-2026-07-19` remains in place and verified, preserving the Git rollback path.

If any of these conditions is not satisfied, the exception for that file is void and the file must be converted or merged into the canonical migration chain before the re-baseline proceeds.

---

## Section 6 — Production Risk Assessment

| Risk Domain | Level | Rationale | Mitigations |
|---|---|---|---|
| Schema risk | LOW | The 7 canonicalized-elsewhere files define no new top-level objects. The 2 partially duplicated files contain one unique table/index and one unresolved function. The 5 anonymous `DO` block files define no schema objects. | Object-equivalence attestation for 7 files; engineering review and conversion/merge for the 2 partial files. |
| Migration replay risk | MEDIUM | On a fresh environment, the canonical chain must recreate all required objects. If the unique objects in the 2 partial files or the validation logic in the 5 `DO` blocks are required but not canonicalized, `db reset` will not produce the expected state. | Engineering review confirms necessity; any required object or validation is converted to a canonical migration at the correct chronological position. |
| Deployment risk | LOW | No production `schema_migrations` modification is authorized. The deployment freeze remains active. | Re-authorization via `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md` before any file changes. |
| Maintenance risk | LOW | Archiving removes non-canonical shadow migrations, reducing long-term confusion. | Archive index and SHA-256 records preserve traceability. |
| Auditability risk | MEDIUM | Non-canonical SQL is not byte-identical to canonical migrations; future auditors must understand why these files were archived without conversion. | Object-equivalence attestations, `MIGRATION_VERSION_ALIASES.md`, and archive index provide an audit trail. |

---

## Section 7 — Governance Conditions

The following conditions must be satisfied before any re-baseline implementation resumes:

1. **Engineering attestation completed** for the 7 canonicalized-elsewhere files, confirming that every top-level object already exists in the canonical `supabase/migrations` chain with an identical signature.
2. **Object-equivalence confirmed** for the 7 canonicalized-elsewhere files, with SHA-256 values recorded before and after any archive move.
3. **Partial-duplicate reconciliation completed** for `migration_phase6_stock_ledger_hardening.sql` and `migration_phase6_stock_ledger_hardening_part1.sql`, including a recorded decision on whether `stock_movements_backup_phase6`, its index, and `calc_qty_after_transaction` are required, and conversion/merge into canonical migrations if required.
4. **Anonymous `DO` block review completed** for the 5 `part5*` and `part6` files, including a recorded decision on whether each validation script is required for deployment or historical replay, and conversion to canonical migrations if required.
5. **Archive verification completed** — all archived non-canonical files are moved to the approved archive directory, SHA-256 verified, and listed in an archive index.
6. **Repository baseline verified** — the pre-rebaseline tag `pre-rebaseline-2026-07-19` still points to the recorded commit and the staged renames from the failed implementation are rolled back before any new work begins.
7. **Authorization updated** — `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md` is approved, reflecting the dispositions and conditions in this review.

---

## Section 8 — Required Follow-up

| Artifact | Decision | Justification |
|---|---|---|
| `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md` | **Required** | The original `REPOSITORY_REBASELINE_AUTHORIZATION.md` was approved before the forensic findings were known. The revised dispositions (7 object-equivalence archives, 2 partial-duplicate reconciliations, 5 anonymous `DO` block reviews) and this governance exception review change the authorized scope. A fresh authorization is required before any repository, Git, migration, or archive work resumes. |

---

# Final Governance Decision

```text
Governance Exception Review Addendum:

APPROVED WITH CONDITIONS
```

**Justification:**

The forensic evidence supports archiving the 7 canonicalized-elsewhere non-canonical files without converting them to canonical migrations, provided an Engineering Review Authority attests that every top-level object already exists in the canonical chain. The 2 partially duplicated files and the 5 anonymous `DO` block files are not approved for unconditional archive; they require engineering review and conversion/merge if any unique object or validation script is required for production parity or historical replay. Repository integrity, production parity, migration replay safety, and rollback capability are preserved only when the conditions in Section 7 are satisfied and the follow-up `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md` is approved.

---

# Next Authorized Step

Create and approve **`REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md`**. No repository modifications, archives, renames, verification execution, or deployment are authorized until that addendum is accepted.
