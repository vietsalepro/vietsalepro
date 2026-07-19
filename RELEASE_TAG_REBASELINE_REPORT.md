# RELEASE TAG REBASELINE REPORT

**Program:** VietSalePro v7 — Production Deployment Program  
**RC ID:** `RC-2026-07-19-01`  
**Previous Frozen Commit:** `04d41a474d63337f933f33ddd9185fb0d596fab5`  
**New Frozen Commit:** `8b6ad12f100eb92e13939167fdf6d792c1c13a54`  
**Date:** 2026-07-19  
**Authority:** Project Owner / Release Manager

---

## 1. Existing Tags

| Tag | Points To | Status |
|---|---|---|
| `pre-rebaseline-2026-07-19` | `6f7c5dd75a036ef9ffc5bed19fd89dc40f80075c` | Retained — rollback reference |
| `v7.0.0-rc1` | `61e8c73f4b156021d49177fb6b60506d2e2d8e2a` (drifted from intended retired commit `04d41a47...`) | Retained — previous release candidate tag (audit artifact) |

Both tags are historical audit artifacts. No existing tag is deleted, moved, or rewritten.

---

## 2. Tag Strategy Review

The previous release candidate tag `v7.0.0-rc1` references the retired frozen commit `04d41a47...`. Because the frozen baseline has moved to `8b6ad12f...`, the release tag must be addressed before production execution.

### Options Considered

- **Option A — Move `v7.0.0-rc1` to `8b6ad12f...`:**  
  Re-tagging would rewrite the meaning of an existing historical tag. This breaks audit traceability because `v7.0.0-rc1` was already verified against `04d41a47...`.

- **Option B — Create a new release tag at `8b6ad12f...`:**  
  Preserves `v7.0.0-rc1` as the failed-cutover artifact and creates a new tag for the rebaselined release candidate. Maintains a complete, immutable audit trail.

---

## 3. Recommendation

**Option B — Create a new release tag.**

The new tag shall be:

```text
v7.0.0-rc2
```

| Field | Value |
|---|---|
| Tag name | `v7.0.0-rc2` |
| Target commit | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` |
| Branch | `master` |
| Previous tag | `v7.0.0-rc1` (retained; currently at `61e8c73f...`; intended retired commit `04d41a47...`) |
| Annotation | `Release candidate v7.0.0-rc2 for RC-2026-07-19-01; rebaselined frozen commit 8b6ad12f` |

**Rationale:**

- Does not move or delete `v7.0.0-rc1`.
- Preserves the failed-cutover audit trail.
- Explicitly identifies the new frozen baseline as a separate release candidate.
- Follows semantic versioning for pre-release candidates.

---

## 4. New Tag Status

**Not created.**

Per the rebaseline scope, this report documents the recommendation only. Tag creation and push are deferred to the production execution authorization phase. The repository pointer must first be aligned to `8b6ad12f...` before the tag is applied.

---

## 5. Audit Trail

| Event | Commit / Tag | Date | Evidence |
|---|---|---|---|
| Original freeze | `04d41a474d63337f933f33ddd9185fb0d596fab5` | 2026-07-19 | `DEPLOYMENT_FREEZE_REVIEW.md` |
| `v7.0.0-rc1` created | `04d41a474d63337f933f33ddd9185fb0d596fab5` | 2026-07-19 | `RELEASE_TAG_EXECUTION_REPORT.md` |
| Cutover aborted due to drift | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` (active checkout) | 2026-07-19 | `PRODUCTION_EXECUTION_REPORT.md` |
| Rebaseline authorized | `8b6ad12f100eb92e13939167fdf6d792c1c13a54` | 2026-07-19 | `RELEASE_CANDIDATE_REBASELINE_AUTHORIZATION.md` |
| Proposed new tag | `v7.0.0-rc2` (pending) | 2026-07-19 | This document |

---

*No release tag was created, moved, deleted, or pushed by this document.*
