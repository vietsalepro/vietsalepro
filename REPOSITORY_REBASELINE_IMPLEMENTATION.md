# REPOSITORY RE-BASELINE IMPLEMENTATION

**Program:** VietSalePro v7 — Production Deployment Program  
**Date:** 2026-07-19  
**Executor:** Engineering Implementation Authority  
**Authority:** `REPOSITORY_REBASELINE_AUTHORIZATION.md` — AUTHORIZED WITH CONDITIONS  

---

## Objective

Execute the approved Repository Re-baseline exactly as authorized. Implementation stopped at **Phase 4** because a mandatory failure condition was encountered.

---

## Authoritative Inputs

The following governance documents were the complete authority for this implementation:

- `REPOSITORY_HYGIENE_REVIEW.md`
- `MIGRATION_RECONCILIATION_REPORT.md`
- `MIGRATION_PROVENANCE_INVESTIGATION.md`
- `GOVERNANCE_EXCEPTION_REVIEW.md`
- `REPOSITORY_REBASELINE_PLAN.md`
- `SUPABASE_REBASELINE_FEASIBILITY_REVIEW.md`
- `REPOSITORY_REBASELINE_AUTHORIZATION.md`

---

## Phase 0 — Preconditions

| Mandatory Condition | Result | Evidence |
|---|---|---|
| Authorization accepted | PASS | `REPOSITORY_REBASELINE_AUTHORIZATION.md` decision: **AUTHORIZED WITH CONDITIONS** |
| Deployment freeze active | PASS | `GOVERNANCE_EXCEPTION_REVIEW.md` and `REPOSITORY_REBASELINE_AUTHORIZATION.md` state the freeze remains until acceptance |
| Repository status recorded | PASS | `git status --short` captured at start; branch `master`, commit `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` |
| Working tree recorded | PASS | See Phase 1 below |
| Pre-rebaseline Git tag created | PASS | `pre-rebaseline-2026-07-19` created and points to `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` |
| Production `schema_migrations` snapshot exported | PASS | Saved to `archive/supabase/production_schema_migrations_snapshot_2026-07-19.json` (136 rows) |
| Fresh verification environment available | PASS | `npx supabase --version` = 2.109.1, Docker 29.6.1, Node v24.18.0 |
| Non-canonical migration inventory confirmed | PASS | 17 files matching `supabase/migration_*.sql` were found and enumerated |

**Phase 0 result:** PASS

---

## Phase 1 — Repository Baseline Protection

| Property | Value |
|---|---|
| Current branch | `master` |
| Current commit | `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` |
| `git status` | Not clean — planned governance documents and the exported snapshot |
| Pre-rebaseline tag | `pre-rebaseline-2026-07-19` |
| Tag verification | tag object `0bb86411855de742c75b6d8a1eb5b0a14a3b9d32`; commit `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` |

**Recovery point exists:** YES

---

## Phase 2 — Migration Rename Implementation

Implemented the approved rename mapping for the 9 divergent canonical migrations. All renames were performed with `git mv`.

| Old filename | New filename | SHA-256 before | SHA-256 after | Content identical |
|---|---|---|---|---|
| `20260718000002_sp1_6_expand_audit_log_event_types.sql` | `20260713053550_sp1_6_expand_audit_log_event_types.sql` | `16BAAADABA73AC873C446776399C64DA91C6B03BB842FFFB5AB05D90F742B475` | `16BAAADABA73AC873C446776399C64DA91C6B03BB842FFFB5AB05D90F742B475` | YES |
| `20260719000000_sp2_4_announcement_audience_active_range.sql` | `20260713053608_sp2_4_announcement_audience_active_range.sql` | `AE570C99AA5023655ACC737C6D7A12E5A4551E89CA744D916053F0065C42EBB4` | `AE570C99AA5023655ACC737C6D7A12E5A4551E89CA744D916053F0065C42EBB4` | YES |
| `20260719000001_sp_7_2_custom_domain_verification.sql` | `20260713053615_sp_7_2_custom_domain_verification.sql` | `E53B2A6D1722799FC2F364893B09113BA33A0E5DDCA13221F163A03FD6F8E91A` | `E53B2A6D1722799FC2F364893B09113BA33A0E5DDCA13221F163A03FD6F8E91A` | YES |
| `20260720000000_sp2_6_global_config_rpc.sql` | `20260713053622_sp2_6_global_config_rpc.sql` | `43F3B24DE7DF3917C9534560691DBFB1B0EC4CFDD4901D0536B1501758913526` | `43F3B24DE7DF3917C9534560691DBFB1B0EC4CFDD4901D0536B1501758913526` | YES |
| `20260720000001_sp_7_3_licenses.sql` | `20260713053644_sp_7_3_licenses.sql` | `6AC6547075ABCCD63FB379F8B0E34EA020158C08C975727DC0E69476746F5E95` | `6AC6547075ABCCD63FB379F8B0E34EA020158C08C975727DC0E69476746F5E95` | YES |
| `20260721000000_sp2_7_user_management_rpc.sql` | `20260713053657_sp2_7_user_management_rpc.sql` | `E2002BB71B546B9C656D1990C2D2790A95B9AB6E2597B5CBA6B304D0F5A49D1E` | `E2002BB71B546B9C656D1990C2D2790A95B9AB6E2597B5CBA6B304D0F5A49D1E` | YES |
| `20260722000000_sp2_8_role_management_rpc.sql` | `20260713053746_sp2_8_role_management_rpc.sql` | `BDA0E9FDC5C08585318F6B29BDAE5984BADEACD8C470008B368B0D3E64C960F1` | `BDA0E9FDC5C08585318F6B29BDAE5984BADEACD8C470008B368B0D3E64C960F1` | YES |
| `20260723000000_sp3_1_plans_crud_features.sql` | `20260713053807_sp3_1_plans_crud_features.sql` | `D3991CAE102A27C51E1AA41CB459DEA5929413A62B29E1DB4703A616D3ED756F` | `D3991CAE102A27C51E1AA41CB459DEA5929413A62B29E1DB4703A616D3ED756F` | YES |
| `20260728000000_sp5_6_db_maintenance.sql` | `20260713053828_sp5_6_db_maintenance.sql` | `0DCCACE9B74C67D64D842B8F0999A35B0F582CDFC856C76AB3E8DE262B3187C4` | `0DCCACE9B74C67D64D842B8F0999A35B0F582CDFC856C76AB3E8DE262B3187C4` | YES |

**Phase 2 result:** PASS — all 9 renames completed and content remained byte-identical.

---

## Phase 3 — Preserve New Migrations

Verified the 2 genuinely new migrations remain unchanged.

| Filename | Version | Size (bytes) | SHA-256 | Location |
|---|---|---|---|---|
| `20260718000001_sp_7_1_set_tenant_subdomain.sql` | `20260718000001` | 2133 | `1120DE0BCB6B31BDE29ADA279DC2F530EA58C1E66EA6DB944ACF8B2BD26778A1` | `supabase/migrations` |
| `20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql` | `20260723000001` | 4093 | `258ACCC09C85716F29B7955312EF5593A9EE0A5B79F6BDEB1F85D41BF29ABAC3` | `supabase/migrations` |

**Phase 3 result:** PASS

---

## Phase 4 — Non-canonical Migration Archive

Reviewed every `supabase/migration_*.sql` file against the canonical `supabase/migrations` set by SHA-256.

| Non-canonical file | Size (bytes) | Disposition |
|---|---|---|
| `migration_f33_invite_rate_limit_tenant.sql` | 560 | **UNIQUE** |
| `migration_f33_members_guardrails.sql` | 2115 | **UNIQUE** |
| `migration_f33_members_status_activation.sql` | 584 | DUPLICATE of `20260711000007_f33_members_status_activation.sql` |
| `migration_fix_stock_ledger_phase2_backfill_v2.sql` | 23740 | **UNIQUE** |
| `migration_phase10_reports.sql` | 28960 | **UNIQUE** |
| `migration_phase1_security_cleanup.sql` | 2930 | **UNIQUE** |
| `migration_phase3a_import_cost_ssot.sql` | 17866 | **UNIQUE** |
| `migration_phase6_stock_ledger_hardening.sql` | 14824 | **UNIQUE** |
| `migration_phase6_stock_ledger_hardening_part1.sql` | 1971 | **UNIQUE** |
| `migration_phase6_stock_ledger_hardening_part2.sql` | 2259 | **UNIQUE** |
| `migration_phase6_stock_ledger_hardening_part3.sql` | 1418 | **UNIQUE** |
| `migration_phase6_stock_ledger_hardening_part4.sql` | 1941 | **UNIQUE** |
| `migration_phase6_stock_ledger_hardening_part5.sql` | 6260 | **UNIQUE** |
| `migration_phase6_stock_ledger_hardening_part5a.sql` | 1898 | **UNIQUE** |
| `migration_phase6_stock_ledger_hardening_part5b.sql` | 1849 | **UNIQUE** |
| `migration_phase6_stock_ledger_hardening_part5c.sql` | 2858 | **UNIQUE** |
| `migration_phase6_stock_ledger_hardening_part6.sql` | 953 | **UNIQUE** |

**Finding:** 16 of the 17 non-canonical files contain SQL that does not match any canonical `supabase/migrations` file. Only `migration_f33_members_status_activation.sql` is an exact duplicate.

Per `REPOSITORY_REBASELINE_PLAN.md` Section 7, a non-canonical file containing unique SQL is a blocking condition requiring a Governance Exception. Implementation was therefore **STOPPED** immediately. No non-canonical files were moved or archived.

**Phase 4 result:** FAIL

---

## Failure Handling

- **Failure point:** Phase 4 — Non-canonical Migration Archive
- **Reason:** 16 of the 17 `supabase/migration_*.sql` files contain unique SQL not present in the canonical set. The approved re-baseline plan permits archive only when the non-canonical files are duplicates or otherwise dispositioned in advance; this precondition was not met.
- **Repository state at failure:**
  - Branch `master`, commit `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c`
  - Pre-rebaseline tag `pre-rebaseline-2026-07-19` is in place and verified
  - Phase 2 renames are staged but uncommitted (9 `R` entries)
  - Production `schema_migrations` snapshot saved at `archive/supabase/production_schema_migrations_snapshot_2026-07-19.json`
  - 17 non-canonical files remain in `supabase/`; none were moved or archived
- **Recovery recommendation:**
  1. Roll back the staged renames from the pre-rebaseline tag (e.g., `git checkout pre-rebaseline-2026-07-19 -- supabase/migrations`) before any further work.
  2. Open a new Governance Exception review to determine whether the 16 unique non-canonical files must be converted to canonical migrations, merged into existing migrations, or approved for archive.
  3. Re-authorize the Repository Re-baseline after the non-canonical inventory is dispositioned and a corrected mapping is approved.

---

## Phase 5 through Phase 9

Not executed. Implementation stopped immediately after the Phase 4 failure per the mandatory failure protocol.

---

## Scope Confirmation

Implementation did **NOT**:

- modify SQL bodies
- modify production
- execute migration repair on production
- modify source code
- modify application logic
- modify API
- modify configuration
- perform feature work
- rewrite Git history

Implementation did:

- create the `pre-rebaseline-2026-07-19` tag
- export the production `schema_migrations` snapshot
- rename 9 canonical migration files (staged, uncommitted)
- attempt the Phase 4 non-canonical archive review

---

## Deliverables

| Artifact | Status | Path/Notes |
|---|---|---|
| Pre-rebaseline tag | Created | `pre-rebaseline-2026-07-19` |
| Production `schema_migrations` snapshot | Created | `archive/supabase/production_schema_migrations_snapshot_2026-07-19.json` |
| 9 canonical migration renames | Staged, uncommitted | `supabase/migrations` |
| `MIGRATION_VERSION_ALIASES.md` | Not created — stopped at Phase 4 | — |
| Archive index | Not created — stopped at Phase 4 | — |
| This implementation report | Created | `REPOSITORY_REBASELINE_IMPLEMENTATION.md` |

---

## Final Implementation Decision

```text
Repository Re-baseline Implementation:

IMPLEMENTATION FAILED
```

**Justification:** Phase 4 discovered 16 unique non-canonical SQL files whose disposition is not covered by the approved plan. Proceeding would require either archiving SQL that may be needed or introducing unapproved migrations, both of which exceed the authorized scope. The failure was caught at the mandated gate, and no production or source-code modifications were performed.

---

## Exit Criteria Review (from `REPOSITORY_REBASELINE_AUTHORIZATION.md`)

| # | Criterion | Status |
|---|---|---|
| 1 | `supabase/migrations` contains exactly 138 canonical files | NOT VERIFIED — implementation stopped |
| 2 | All 136 production-applied versions are present and byte-identical | PARTIAL — 9 renames done; full verification stopped |
| 3 | 2 genuinely new migrations preserved and validated | PARTIAL — preserved; fresh-environment validation not run |
| 4 | No `migration_*.sql` files remain outside `supabase/migrations` | FAIL — 17 remain, disposition blocked |
| 5 | No duplicate `version` strings in `supabase/migrations` | NOT VERIFIED |
| 6 | `MIGRATION_VERSION_ALIASES.md` committed with all mappings | FAIL — not created |
| 7 | `supabase migration list` and `supabase db lint` succeed | NOT RUN |
| 8 | `supabase db reset` completes with 138 migrations | NOT RUN |
| 9 | `supabase db diff` shows only the 2 new migrations | NOT RUN |
| 10 | Working tree clean and re-baseline committed | FAIL — uncommitted staged renames |
| 11 | Governance Acceptance Authority approval | NOT OBTAINED |

---

## Next Authorized Step

A new Governance Exception review must be opened to disposition the 16 unique `supabase/migration_*.sql` files before any re-baseline implementation can continue. Only after that exception is approved and the non-canonical inventory is resolved should `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` be produced.
