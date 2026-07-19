# REPOSITORY RE-BASELINE PLAN ADDENDUM

**Program:** VietSalePro v7 — Production Deployment Program  
**Date:** 2026-07-19  
**Author:** Engineering Planning Authority  
**Status:** Planning artifact — no implementation is authorized by this document  
**Authority:** `NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md`

This addendum revises the approved `REPOSITORY_REBASELINE_PLAN.md` using the forensic evidence produced by the `Non-Canonical Migration Forensic Investigation`. It is a planning artifact only; no repository, Git, migration, or production modifications are authorized.

---

## Authoritative Inputs

- `REPOSITORY_REBASELINE_PLAN.md`
- `REPOSITORY_REBASELINE_AUTHORIZATION.md`
- `REPOSITORY_REBASELINE_IMPLEMENTATION.md`
- `NON_CANONICAL_MIGRATION_FORENSIC_INVESTIGATION.md`

No assumptions outside these artifacts are introduced.

---

## Section 1 — Executive Summary

The `REPOSITORY_REBASELINE_IMPLEMENTATION.md` stopped at the mandatory Phase 4 governance gate because the 17 non-canonical `supabase/migration_*.sql` files could not be archived wholesale. The original `REPOSITORY_REBASELINE_PLAN.md` assumed these files were either duplicates or disposable working drafts. The `Non-Canonical Migration Forensic Investigation` has now determined that assumption to be incorrect:

- **3 files** are exact duplicates of canonical `supabase/migrations` files.
- **7 files** are canonicalized elsewhere — every identifiable schema object they create already exists in canonical migrations.
- **2 files** are partially duplicated — most, but not all, of their objects already exist in canonical migrations.
- **5 files** contain anonymous PL/pgSQL `DO` blocks with no extractable top-level schema objects and are not reproduced in the canonical chain.

The original Phase 4 archive strategy is therefore no longer sufficient. A per-file, evidence-based disposition plan is required before the re-baseline can resume. This addendum replaces the wholesale archive approach with a staged disposition strategy and new verification gates.

---

## Section 2 — Plan Impact Assessment

**Overall assessment:** `Valid With Changes`

The core re-baseline strategy remains technically sound:

- Rename the 9 divergent repository migrations to their production-applied `version` strings.
- Preserve the 2 genuinely new local migrations unchanged.
- Maintain the `pre-rebaseline-2026-07-19` tag and the production `schema_migrations` snapshot.

However, the following `REPOSITORY_REBASELINE_PLAN.md` sections are materially affected and are superseded by this addendum:

- **Section 7 — Non-canonical File Strategy** — the wholesale archive assumption is rejected by the forensic evidence.
- **Section 8.2 — Phase 2** — the non-canonical archive sequence is replaced by the disposition steps below.
- **Section 9** — the verification gates must be expanded to include duplicate, canonical-equivalence, and anonymous `DO` block review.
- **Section 11 — Risk Assessment** — residual risk is elevated until the 14 non-duplicate files are dispositioned.

Sections not listed above remain in force as originally written.

---

## Section 3 — Revised Non-Canonical Inventory

All 17 non-canonical files are in `supabase/` and match `migration_*.sql`.

| # | Filename | Forensic Classification | Repository Status | Production Status | Canonical Status | Risk Level |
|---|----------|------------------------|-------------------|-------------------|-------------------|------------|
| 1 | `migration_f33_invite_rate_limit_tenant.sql` | Exact duplicate | Non-canonical, exact duplicate | Already canonicalized (object intent present) | Fully duplicated — byte-identical to `20260711000006_f33_invite_rate_limit_tenant.sql` | LOW |
| 2 | `migration_f33_members_guardrails.sql` | Exact duplicate | Non-canonical, exact duplicate | Already canonicalized (object intent present) | Fully duplicated — byte-identical to `20260711000005_f33_members_guardrails.sql` | LOW |
| 3 | `migration_f33_members_status_activation.sql` | Exact duplicate | Non-canonical, exact duplicate | Already canonicalized (object intent present) | Fully duplicated — byte-identical to `20260711000007_f33_members_status_activation.sql` | LOW |
| 4 | `migration_fix_stock_ledger_phase2_backfill_v2.sql` | Canonicalized elsewhere | Non-canonical, shadow migration | All 5 created objects present in `supabase/schema.sql` | All created objects exist in canonical migrations; file is not byte-identical | MEDIUM |
| 5 | `migration_phase10_reports.sql` | Canonicalized elsewhere | Non-canonical, shadow migration | All 4 created objects present in `supabase/schema.sql` | All created objects exist in canonical migrations; file is not byte-identical | MEDIUM |
| 6 | `migration_phase1_security_cleanup.sql` | Canonicalized elsewhere | Non-canonical, shadow migration | The 1 created object present in `supabase/schema.sql` | All created objects exist in canonical migrations; file is not byte-identical | MEDIUM |
| 7 | `migration_phase3a_import_cost_ssot.sql` | Canonicalized elsewhere | Non-canonical, shadow migration | All 7 created objects present in `supabase/schema.sql` | All created objects exist in canonical migrations; file is not byte-identical | MEDIUM |
| 8 | `migration_phase6_stock_ledger_hardening.sql` | Partially duplicated | Non-canonical, shadow migration | 6 of 7 objects present in `supabase/schema.sql` | 6 of 7 objects exist in canonical migrations; 1 unique object (`stock_movements_backup_phase6`) | MEDIUM |
| 9 | `migration_phase6_stock_ledger_hardening_part1.sql` | Partially duplicated | Non-canonical, shadow migration | 2 of 3 objects present in `supabase/schema.sql` | 2 of 3 objects exist in canonical migrations; `stock_movements_backup_phase6` and index also appear in file 8 | MEDIUM |
| 10 | `migration_phase6_stock_ledger_hardening_part2.sql` | Canonicalized elsewhere | Non-canonical, shadow migration | The 1 created object present in `supabase/schema.sql` | All created objects exist in canonical migrations; file is not byte-identical | MEDIUM |
| 11 | `migration_phase6_stock_ledger_hardening_part3.sql` | Canonicalized elsewhere | Non-canonical, shadow migration | The 2 created objects present in `supabase/schema.sql` | All created objects exist in canonical migrations; file is not byte-identical | MEDIUM |
| 12 | `migration_phase6_stock_ledger_hardening_part4.sql` | Canonicalized elsewhere | Non-canonical, shadow migration | The 1 created object present in `supabase/schema.sql` | All created objects exist in canonical migrations; file is not byte-identical | MEDIUM |
| 13 | `migration_phase6_stock_ledger_hardening_part5.sql` | Anonymous `DO` block / unique SQL | Non-canonical, unique shadow migration | No top-level schema objects created; not reflected in `supabase/schema.sql` | No top-level objects; not reproduced in canonical chain | MEDIUM |
| 14 | `migration_phase6_stock_ledger_hardening_part5a.sql` | Anonymous `DO` block / unique SQL | Non-canonical, unique shadow migration | No top-level schema objects created; not reflected in `supabase/schema.sql` | No top-level objects; not reproduced in canonical chain | MEDIUM |
| 15 | `migration_phase6_stock_ledger_hardening_part5b.sql` | Anonymous `DO` block / unique SQL | Non-canonical, unique shadow migration | No top-level schema objects created; not reflected in `supabase/schema.sql` | No top-level objects; not reproduced in canonical chain | MEDIUM |
| 16 | `migration_phase6_stock_ledger_hardening_part5c.sql` | Anonymous `DO` block / unique SQL | Non-canonical, unique shadow migration | No top-level schema objects created; not reflected in `supabase/schema.sql` | No top-level objects; not reproduced in canonical chain | MEDIUM |
| 17 | `migration_phase6_stock_ledger_hardening_part6.sql` | Anonymous `DO` block / unique SQL | Non-canonical, unique shadow migration | No top-level schema objects created; not reflected in `supabase/schema.sql` | No top-level objects; not reproduced in canonical chain | MEDIUM |

---

## Section 4 — Disposition Matrix

| File | Classification | Evidence | Final Disposition | Required Verification | Owner | Governance Required |
|------|----------------|----------|-------------------|-----------------------|-------|---------------------|
| `migration_f33_invite_rate_limit_tenant.sql` | Exact duplicate | SHA-256 `641429E8...`; byte-identical (after line-ending normalization) to `20260711000006_f33_invite_rate_limit_tenant.sql` | Archive | SHA-256 match before and after move; object mapping verified | Engineering Implementation Authority | No |
| `migration_f33_members_guardrails.sql` | Exact duplicate | SHA-256 `4E34C1ED...`; byte-identical to `20260711000005_f33_members_guardrails.sql` | Archive | SHA-256 match before and after move; object mapping verified | Engineering Implementation Authority | No |
| `migration_f33_members_status_activation.sql` | Exact duplicate | SHA-256 `5CB87453...`; byte-identical to `20260711000007_f33_members_status_activation.sql` | Archive | SHA-256 match before and after move; object mapping verified | Engineering Implementation Authority | No |
| `migration_fix_stock_ledger_phase2_backfill_v2.sql` | Canonicalized elsewhere | All 5 functions already exist in canonical migrations or `supabase/schema.sql` | Archive with object-equivalence attestation | Confirm each of the 5 functions is present in canonical chain with identical signature | Engineering Review Authority | Yes |
| `migration_phase10_reports.sql` | Canonicalized elsewhere | All 4 report functions already exist in canonical migrations or `supabase/schema.sql` | Archive with object-equivalence attestation | Confirm each of the 4 functions is present in canonical chain with identical signature | Engineering Review Authority | Yes |
| `migration_phase1_security_cleanup.sql` | Canonicalized elsewhere | `authenticated_full_access_temp` policy object already exists in canonical migrations or `supabase/schema.sql` | Archive with object-equivalence attestation | Confirm the policy exists in canonical chain; confirm it was dropped as intended | Engineering Review Authority | Yes |
| `migration_phase3a_import_cost_ssot.sql` | Canonicalized elsewhere | All 7 objects (tables, columns, functions) already exist in canonical migrations or `supabase/schema.sql` | Archive with object-equivalence attestation | Confirm each object is present in canonical chain with identical signature | Engineering Review Authority | Yes |
| `migration_phase6_stock_ledger_hardening.sql` | Partially duplicated | 6 of 7 objects in canonical migrations; `stock_movements_backup_phase6` and related index unique to this file | Engineering Review Required | Determine whether `stock_movements_backup_phase6` is still needed; compare with `part1` overlap | Engineering Review Authority | Yes |
| `migration_phase6_stock_ledger_hardening_part1.sql` | Partially duplicated | 2 of 3 objects in canonical migrations; contains `stock_movements_backup_phase6` and `idx_stock_movements_product_lot_cancelled` also seen in file 8 | Engineering Review Required | Reconcile overlap with file 8; determine if `calc_qty_after_transaction` is already canonicalized | Engineering Review Authority | Yes |
| `migration_phase6_stock_ledger_hardening_part2.sql` | Canonicalized elsewhere | `insert_stock_ledger_entry` already exists in canonical migrations or `supabase/schema.sql` | Archive with object-equivalence attestation | Confirm function exists in canonical chain with identical signature | Engineering Review Authority | Yes |
| `migration_phase6_stock_ledger_hardening_part3.sql` | Canonicalized elsewhere | `trg_stock_movements_calc_qty_after` trigger/function already exists in canonical migrations or `supabase/schema.sql` | Archive with object-equivalence attestation | Confirm trigger/function exists in canonical chain; confirm it was dropped as intended | Engineering Review Authority | Yes |
| `migration_phase6_stock_ledger_hardening_part4.sql` | Canonicalized elsewhere | `check_stock_ledger_drift` already exists in canonical migrations or `supabase/schema.sql` | Archive with object-equivalence attestation | Confirm function exists in canonical chain with identical signature | Engineering Review Authority | Yes |
| `migration_phase6_stock_ledger_hardening_part5.sql` | Anonymous `DO` block / unique SQL | No top-level objects; `DO` block validation script; not in `supabase/schema.sql` | Engineering Review Required | Determine whether the `DO` block validation script is required for deployment or historical replay | Engineering Review Authority | Yes |
| `migration_phase6_stock_ledger_hardening_part5a.sql` | Anonymous `DO` block / unique SQL | No top-level objects; `DO` block validation script; not in `supabase/schema.sql` | Engineering Review Required | Determine whether the `DO` block validation script is required for deployment or historical replay | Engineering Review Authority | Yes |
| `migration_phase6_stock_ledger_hardening_part5b.sql` | Anonymous `DO` block / unique SQL | No top-level objects; `DO` block validation script; not in `supabase/schema.sql` | Engineering Review Required | Determine whether the `DO` block validation script is required for deployment or historical replay | Engineering Review Authority | Yes |
| `migration_phase6_stock_ledger_hardening_part5c.sql` | Anonymous `DO` block / unique SQL | No top-level objects; `DO` block validation script; not in `supabase/schema.sql` | Engineering Review Required | Determine whether the `DO` block validation script is required for deployment or historical replay | Engineering Review Authority | Yes |
| `migration_phase6_stock_ledger_hardening_part6.sql` | Anonymous `DO` block / unique SQL | No top-level objects; `DO` block validation script; not in `supabase/schema.sql` | Engineering Review Required | Determine whether the `DO` block validation script is required for deployment or historical replay | Engineering Review Authority | Yes |

---

## Section 5 — Revised Phase 4 Execution Plan

The original Phase 2 archive step is replaced by the following staged sequence. No engineering implementation is authorized until this addendum is accepted and re-authorized.

**Step 1 — Roll back staged renames**

From the verified `pre-rebaseline-2026-07-19` tag, restore `supabase/migrations` so that the repository is back to the pre-implementation baseline before the re-baseline is retried.

**Step 2 — Archive exact duplicates**

Move the 3 exact-duplicate `migration_f33_*.sql` files to `archive/supabase/non_canonical_migrations/`. Verify SHA-256 before and after the move.

**Step 3 — Canonical-equivalence review**

For the 7 canonicalized-elsewhere files, the Engineering Review Authority attests that every top-level object already exists in the canonical chain. Each file is then archived with its object-equivalence record.

**Step 4 — Partial-duplicate review**

For `migration_phase6_stock_ledger_hardening.sql` and `migration_phase6_stock_ledger_hardening_part1.sql`, the Engineering Review Authority determines:

- Whether `stock_movements_backup_phase6` and its index are required in production or are superseded.
- Whether the overlap with the canonical `part2`, `part3`, and `part4` files is harmless duplication.
- Whether the unique objects should be converted to canonical migrations, merged into existing canonical migrations, or archived.

**Step 5 — Anonymous `DO` block review**

For the 5 `part5*` and `part6` files, the Engineering Review Authority determines whether each anonymous `DO` block is a required historical validation script. If not required, archive with governance exception. If required, convert to a canonical migration at the correct chronological position.

**Step 6 — Execute only approved archive operations**

No file is moved until its disposition line item has been reviewed and the corresponding verification step in Section 6 has passed.

**Step 7 — Re-run verification**

After archive operations are executed, re-run the full verification gate set defined in `REPOSITORY_REBASELINE_PLAN.md` Section 9 and Section 6 below.

---

## Section 6 — Revised Verification Gates

The following gates are mandatory before implementation resumes. Each gate has a PASS / FAIL condition.

| Gate | PASS Condition | FAIL Condition |
|------|----------------|----------------|
| Duplicate verification | All 3 exact-duplicate non-canonical files have SHA-256 values matching their canonical counterparts | Any exact-duplicate file does not match |
| Canonical verification | All 7 canonicalized-elsewhere files have every top-level object present in the canonical `supabase/migrations` chain | Any object is missing or has a different signature in the canonical chain |
| Schema verification | The current `supabase/schema.sql` matches the expected state after disposition of canonicalized-elsewhere and partial-duplicate files | `supabase/schema.sql` is missing objects that non-canonical files create |
| Repository verification | No `supabase/migration_*.sql` file remains outside `supabase/migrations` except files explicitly retained per this addendum | Any unapproved non-canonical file remains in `supabase/` |
| Migration verification | `supabase migration list` reports the expected 138 canonical versions with no duplicates | Unexpected versions or duplicate `version` strings appear |
| SHA verification | SHA-256 of every archived file matches the value recorded in this addendum | Any SHA mismatch or missing checksum |
| Archive verification | Archived files are present in `archive/supabase/non_canonical_migrations/` with an `INDEX.md` entry per file | Missing archived file, missing index entry, or file remains in original location |
| Governance approval verification | `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md` records acceptance of this addendum | No acceptance artifact exists |

---

## Section 7 — Revised Risk Assessment

| Disposition Option | Risk Level | Rationale | Mitigation |
|--------------------|------------|-----------|------------|
| Archive | LOW for exact duplicates; MEDIUM for canonicalized-elsewhere files | Exact duplicates carry no content risk; canonicalized-elsewhere files carry object-equivalence risk if an object was missed | SHA-256 check before and after; object-by-object attestation; `supabase schema` diff |
| Retain | MEDIUM | Retaining non-canonical `DO` blocks in `supabase/` invites accidental application and drift | Retention must be limited to `archive/supabase/non_canonical_migrations/` only |
| Merge | HIGH | Merging SQL into existing canonical migrations changes the canonical baseline and can affect fresh replays | Fresh `supabase db reset` before and after merge; full diff review; governance approval |
| Convert to Canonical Migration | HIGH | Adds new versions to `supabase/migrations`; must be placed at the correct chronological position and tested against production | Fresh replay; `db push --dry-run`; `supabase db diff`; governance approval |
| Governance Exception | MEDIUM-HIGH | Archiving unique SQL without conversion assumes the objects/script are not required for production parity | Engineering review confirms no top-level object is missing from `supabase/schema.sql`; `DO` blocks declared optional |

---

## Section 8 — Plan Changes Summary

### Removed assumptions
- All 17 non-canonical `supabase/migration_*.sql` files can be archived wholesale.
- Non-canonical files contain only duplicates or disposable drafts.
- No per-file equivalence review is required before archive.

### New assumptions
- A file whose top-level objects are all present in the canonical chain can be archived after object-equivalence attestation, even if its SQL is not byte-identical to a single canonical migration.
- Anonymous `DO` block files must be reviewed by engineering to determine whether they are required for historical replay or deployment safety.
- Partial duplicates require reconciliation of the non-overlapping objects before disposition.

### Replaced activities
- `REPOSITORY_REBASELINE_PLAN.md` Section 7 (wholesale archive) is replaced by Section 4 (Disposition Matrix) and Section 5 (Revised Phase 4 Execution Plan) of this addendum.
- `REPOSITORY_REBASELINE_PLAN.md` Section 8.2 (single non-canonical archive phase) is replaced by the 7-step staged sequence in Section 5 of this addendum.

### New governance checkpoints
- `REPOSITORY_REBASELINE_PLAN_ADDENDUM.md` approval (this document).
- `GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md` for the 14 non-exact-duplicate files if they are to be archived without conversion.
- `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md` before any implementation resumes.

### New engineering checkpoints
- Object-equivalence attestation for 7 canonicalized-elsewhere files.
- Partial-duplicate reconciliation for 2 files.
- Anonymous `DO` block review for 5 files.

### New verification checkpoints
- Duplicate verification gate.
- Canonical-equivalence verification gate.
- Archive verification gate.
- SHA verification gate.

---

## Section 9 — Repository Re-baseline Readiness

**Status:** `READY WITH CONDITIONS`

**Evidence:**

- The 9 divergent canonical migration renames and the 2 genuinely new migrations are correctly planned in `REPOSITORY_REBASELINE_PLAN.md`.
- The pre-rebaseline git tag `pre-rebaseline-2026-07-19` exists and has been verified.
- The production `schema_migrations` snapshot has been exported.
- The 17 non-canonical files have been classified by the forensic investigation.

**Conditions that must be satisfied before implementation resumes:**

1. This addendum is approved.
2. `GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md` is completed if any non-exact-duplicate file is to be archived without conversion.
3. `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md` is approved.
4. Engineering review attestation is recorded for the 14 non-exact-duplicate files.
5. All verification gates in Section 6 are passed.

---

## Section 10 — Required Follow-up Governance

| Artifact | Required / Not Required | Justification |
|----------|------------------------|----------------|
| Governance Exception Review Addendum | **Required** | 14 non-canonical files are not exact duplicates. Archiving them without conversion requires an explicit governance exception because their SQL is not present as a contiguous block in the canonical chain, even though their objects are largely present in `supabase/schema.sql`. |
| Repository Re-baseline Authorization Addendum | **Required** | The original `REPOSITORY_REBASELINE_AUTHORIZATION.md` authorized the re-baseline before the non-canonical findings were known. The changed disposition strategy requires renewed authorization before any file is moved, renamed, archived, or converted. |

---

# Final Planning Decision

```text
Repository Re-baseline Plan Addendum:

APPROVED WITH CONDITIONS
```

**Justification:**

The forensic evidence supports a per-file disposition plan. The 3 exact duplicates can be archived safely once SHA-256 verification confirms the match. The 7 canonicalized-elsewhere files can be archived after an object-equivalence attestation. The 2 partially duplicated files and 5 anonymous `DO` block files require engineering review before final disposition. Implementation is not yet authorized; the follow-up governance artifacts listed in Section 10 must be completed first.

---

# Next Authorized Step

Create and approve the **`GOVERNANCE_EXCEPTION_REVIEW_ADDENDUM.md`** to disposition the 14 non-exact-duplicate non-canonical `supabase/migration_*.sql` files.

No repository modifications, no file archives, no renames, no verification execution, and no deployment are authorized until this addendum and the subsequent `REPOSITORY_REBASELINE_AUTHORIZATION_ADDENDUM.md` are accepted.
