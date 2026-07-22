# 15_ADMIN_DASHBOARD_WAVE-01_ENGINEERING_KICKOFF

**Document ID:** 15_ADMIN_DASHBOARD_WAVE-01_ENGINEERING_KICKOFF  
**Date:** 2026-07-20  
**Project:** VietSalePro  
**Sub Project:** Admin Dashboard  
**Program:** Admin Dashboard System Remediation Program  
**Phase:** B — System Remediation  
**Wave:** Wave-01  
**Acting Capacity:** Enterprise Program Management Office (PMO) together with the Principal Software Architect  
**Baseline:** AD-Baseline-1.0  
**Repository Scope:** `C:\PROJECT\vietsalepro`  
**Status:** Engineering Kickoff Complete — Implementation Readiness Review Ready to Start

------------------------------------------------------------------------

# 1. Executive Summary

This document officially opens Engineering activities for Wave-01 of the Admin Dashboard System Remediation Program. It establishes the engineering direction, scope, sequencing, repository boundaries, testing strategy, and risk posture for the first remediation wave. It does **not** authorize implementation. It authorizes only the next governance gate: the Wave-01 Implementation Readiness Review.

Wave-01 is organized as the **Admin Authentication and Audit-Trust Boundary Risk Cluster**. It contains the five Critical unique issues that satisfy the Wave-01 entry criteria: highest architectural dependency, required by downstream waves, lowest regression footprint, and maximum production stability improvement.

All mandatory governance documents (`00`, `10A`, `10B`, `11`, `12`, `13`, `14`) have been read and consumed. Phase A is closed, the baseline `AD-Baseline-1.0` is sealed, Phase B is open, the Remediation Master Plan is complete, Program Owner Decisions are recorded, and Wave-01 is authorized.

**Engineering Kickoff Decision:**

- **Wave-01 Engineering Kickoff:** **COMPLETE** (this document).
- **Implementation Readiness Review:** **READY TO START**.
- **Implementation:** **NOT STARTED** and not authorized by this document.
- **Overall Program Status:** **ACTIVE**.

------------------------------------------------------------------------

# 2. Repository Verification

| Verification Check | Method | Result |
|---|---|---|
| Sealed baseline commit | `git rev-parse 3a06a6d9` | Baseline commit `3a06a6d9` (RC-2026-07-19-01) is present and reachable. |
| Current HEAD | `git rev-parse HEAD` | `1292dd41` — a governance-only commit after `3a06a6d9` that contains no Admin Dashboard implementation changes. |
| Admin Dashboard implementation drift | `git diff --stat 3a06a6d9 -- App.tsx contexts lib services/admin supabase/schema.sql supabase/migrations supabase/functions` | **0 lines changed** — the implementation baseline is intact. |
| Tracked working-tree changes | `git status --short` | `.codebase-memory/*`, `package.json`, `package-lock.json`, and `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` are modified. None are Admin Dashboard implementation artifacts. |
| Untracked entries | `git status` | Governance documentation under `ADMIN_DASHBOARD_PLAN/` and `memory-zone/` scratch artifacts. None are Admin Dashboard implementation artifacts. |

**Repository Stability Verdict:** The Admin Dashboard implementation has not materially changed relative to the sealed baseline at commit `3a06a6d9`. The current HEAD contains only governance and dependency-manifest commits after the baseline. No Wave-01 implementation has started.

------------------------------------------------------------------------

# 3. Governance Verification

| Gate | Expected Status | Current Status | Evidence |
|---|---|---|---|
| Phase A | CLOSED | **CLOSED** | `10B` Section 1 |
| Baseline | SEALED | **SEALED** (`AD-Baseline-1.0`) | `10B` Section 11 |
| Phase B | OPEN | **OPEN** | `11` Section 1 |
| Remediation Master Plan | COMPLETE | **COMPLETE** | `12` Section 14 |
| Program Owner Decisions | COMPLETE | **COMPLETE** | `13` Section 12 |
| Wave Planning | COMPLETE | **COMPLETE** | `13` Section 8; `14` Section 4 |
| Wave-01 Authorization | COMPLETE | **COMPLETE** | `14` Section 1 |
| Engineering Kickoff | READY TO START | **COMPLETE** | This document |
| Implementation Readiness Review | NOT STARTED | **READY TO START** | This document |
| Implementation | NOT STARTED | **NOT STARTED** | This document |
| Program Status | ACTIVE | **ACTIVE** | `00` Section 10 |

**Governance Verdict:** Every prerequisite for Wave-01 Engineering Kickoff is satisfied. Implementation is not authorized and has not started.

------------------------------------------------------------------------

# 4. Engineering Objectives

## 4.1 Engineering Objectives

- Establish a single, canonical system-admin enforcement path through `lib/permissions.ts:isSystemAdmin()` and the `is_system_admin` RPC.
- Move the `AuthContext` membership activation business write into `services/admin/memberAdminService.ts` and surface all failures to callers.
- Authenticate the `audit-log` Edge Function before it writes to `public.app_audit_log` or manipulates rate-limit state.
- Preserve all existing Admin Dashboard behavior that is not explicitly broken.
- Produce clear, traceable acceptance evidence for every Wave-01 change.

## 4.2 Technical Objectives

- Remove the direct `system_admins` query in `App.tsx` (lines 212-216).
- Consolidate `ARCH-001`, `SEC-001`, and `PERM-001` into one remediation path.
- Extract `activate_pending_memberships` RPC invocation from `contexts/AuthContext.tsx` into `services/admin/memberAdminService.ts`.
- Replace silent `.catch(() => {})` on activation calls with explicit error propagation and logging.
- Add caller identity validation to `supabase/functions/audit-log/index.ts` before any audit write or rate-limit operation.

## 4.3 Repository Boundaries

- Wave-01 may modify only the implementation artifacts listed in Section 7.
- No change may be made to migrations, RPCs, Edge Functions outside `audit-log`, or database objects outside the approved scope.
- Every change must reference one or more `AD-Baseline-1.0` issue IDs and one or more SSOT document sections.

## 4.4 Dependency Order

Within Wave-01, the dependency order is:

1. `ARCH-001` establishes the canonical admin-gate enforcement path; `PERM-001` consumes it.
2. `ARCH-002` moves the activation call into the service layer; `EXE-001` consumes the new service wrapper to enforce error handling.
3. `EDG-001` is independent and is the highest-priority item.

## 4.5 Risk Mitigation

- Highest-priority security issues (`EDG-001`) are sequenced first.
- Changes are localized to minimize regression footprint.
- Every change is traceable to an approved `AD-Baseline-1.0` issue.
- Backward compatibility is preserved for all behavior that is not explicitly broken.

## 4.6 Rollback Philosophy

- Wave-01 must be independently complete, verifiable, deployable, and acceptable.
- If Wave-01 fails verification, rollback to the sealed baseline at `3a06a6d9` is possible because no implementation artifacts outside the approved scope are touched.
- No force-pushes, history rewrites, or unapproved `master` commits are permitted.

## 4.7 Testing Philosophy

- Static verification first (types, lint, governance traceability).
- Functional verification focused on the changed trust boundaries.
- Regression verification confirms existing Admin Dashboard behavior remains intact.
- Security verification validates that `EDG-001` cannot be called without authenticated identity and that `ARCH-001` removes the second authorization path.
- Manual verification exercises the admin gate, membership activation, and audit-log flows.
- Acceptance evidence is collected before any gate is declared passed.

## 4.8 Acceptance Philosophy

- Acceptance is evidence-based, not assumption-based.
- Every Wave-01 issue requires a clear artifact proving the fix and a peer or independent review.
- The Principal Software Architect confirms technical acceptability and the PMO confirms governance and documentation compliance before Wave Acceptance.

------------------------------------------------------------------------

# 5. Engineering Scope

## 5.1 Authorized Issues

| Issue ID | Category | Business Objective | Technical Objective | Expected Repository Impact | Success Criteria | Out-of-Scope |
|---|---|---|---|---|---|---|
| **ARCH-001** | Architecture / Security | Eliminate the dual authorization path that creates a security bypass vulnerability. | `App.tsx` uses `lib/permissions.ts:isSystemAdmin()` exclusively; `is_system_admin` RPC becomes the single enforcement path. | `App.tsx` (lines 212-216), `lib/permissions.ts` | Only one system-admin enforcement path remains; `App.tsx` direct `system_admins` query is removed. | Folded duplicate `SEC-001`; broader permission refactoring (`PERM-003`, service-layer helpers). |
| **PERM-001** | Permission | Remove the duplicated policy surface that creates enforcement inconsistency. | A single, canonical system-admin enforcement path remains; `App.tsx` direct query is removed. | `App.tsx`, `lib/permissions.ts` | One canonical enforcement path; no duplicate policy surface. | `PERM-003` (`admin_events` RLS) and dead `services/admin/permissions.ts` are out of scope. |
| **ARCH-002** | Architecture / Execution | Eliminate the silent business-write failure that creates data inconsistency risk. | `AuthContext` activation failures surface to the caller; activation logic is extracted to the service layer. | `contexts/AuthContext.tsx`, `services/admin/memberAdminService.ts` | Membership activation is routed through `services/admin/memberAdminService.ts`; failures are surfaced. | Full service-layer refactoring (`SVC-001`–`SVC-005`, `BL-001`, `DEP-002`–`DEP-004`) is deferred. |
| **EXE-001** | Execution | Eliminate the silent activation failure that creates unacceptable execution risk. | Failed `activate_pending_memberships` calls are no longer silently swallowed; errors are logged or reported. | `contexts/AuthContext.tsx`, `services/admin/memberAdminService.ts` | No silent activation failures; errors are visible to the caller. | Broader execution/validation fixes (`VAL-001`, `DIR-001`, `DIR-002`, `BL-002`) are deferred. |
| **EDG-001** | Edge Function / Security | Close the audit-trust boundary vulnerability that allows unauthenticated audit injection. | `audit-log` Edge Function authenticates requests and validates caller identity before processing writes. | `supabase/functions/audit-log/index.ts` | `audit-log` validates caller identity before writing to `app_audit_log`; no unauthenticated injection is possible. | Folded duplicates `SEC-002` and `PERM-002`; widespread Edge-Function audit logging (`EDG-005`) is deferred. |

## 5.2 Out-of-Scope Items

The following are explicitly out of scope for Wave-01 and are deferred to later waves:

- Database/RPC drift: `DB-001`–`DB-007`, `RPC-001`–`RPC-004`, `MIG-001`, `MIG-002`, `DRIFT-001`–`DRIFT-003`.
- Service-layer contract beyond activation: `SVC-001`–`SVC-005`, `BL-001`–`BL-003`, `DEP-002`–`DEP-004`.
- UI/Route cleanup: `UI-001`–`UI-003`, `ARCH-003`, `ARCH-004`.
- Audit-log breadth: `EDG-005` (only `EDG-001` authentication is in scope).
- Dead code and performance: `DEAD-001`–`DEAD-004`, `PERF-001`–`PERF-002`.
- Monitoring/Health and Configuration domain completion.

------------------------------------------------------------------------

# 6. Engineering Strategy

## 6.1 Implementation Sequencing

Wave-01 is executed as a risk cluster, not as a sequence of isolated domain fixes. The recommended implementation sequence is:

1. `EDG-001` — highest priority because it is actively exploitable.
2. `ARCH-001` — establishes the canonical admin-gate path.
3. `PERM-001` — consumes the canonical path and removes the duplicate surface.
4. `ARCH-002` — moves activation to the service layer.
5. `EXE-001` — enforces error handling on the new service wrapper.

## 6.2 Dependency Order

| Consumer | Provider | Relationship |
|---|---|---|
| `PERM-001` | `ARCH-001` | The single enforcement path is realized by making `App.tsx` use `isSystemAdmin()`. |
| `EXE-001` | `ARCH-002` | Error handling can only be enforced after the RPC call is moved to a service wrapper. |
| `SEC-001` | `ARCH-001` | Addressed by `ARCH-001` remediation. |
| `PERM-002`, `SEC-002` | `EDG-001` | Addressed by `EDG-001` remediation. |

## 6.3 Engineering Priorities

1. `EDG-001` — actively exploitable audit-trust boundary issue.
2. `ARCH-001` — foundational for all authorization and permission fixes.
3. `PERM-001` — depends on `ARCH-001`; removes duplicate policy surface.
4. `ARCH-002` and `EXE-001` — co-remediated to fix the silent activation failure.

## 6.4 Implementation Principles

- One issue, one focused change set.
- No change without an `AD-Baseline-1.0` issue ID and an SSOT reference.
- Keep the diff as small as the fix allows.
- Do not refactor adjacent code unless it is unavoidable for the fix.
- Preserve existing public behavior and API contracts.

## 6.5 Repository Safety Principles

- No file outside Section 7 may be modified.
- No migration, RPC, or Edge Function outside `audit-log` may be modified.
- No database object changes are permitted.
- No new dependencies may be introduced unless absolutely required and pre-approved.
- All changes are traceable to the approved Wave-01 scope.

## 6.6 Backward Compatibility Principles

- Existing Admin Dashboard routes, roles, and activation flows must continue to work.
- Any change to the admin-gate behavior must be semantically equivalent to the intended single-path behavior.
- The `audit-log` Edge Function must continue to accept the same valid callers after authentication is added.
- Service-layer extraction must not change the public contract of `AuthContext` consumers unless unavoidable, in which case the change is documented.

## 6.7 Regression Prevention Strategy

- Static and functional checks run before any manual verification.
- Regression verification covers the admin route, member activation, and audit-log write paths.
- Every issue has a focused test or verification artifact.
- Peer review by an independent reviewer before Wave Verification.
- Principal Software Architect reviews cross-domain impact for shared infrastructure (`isSystemAdmin`, audit log, activation flow).

------------------------------------------------------------------------

# 7. Repository Boundary

## 7.1 Areas That MAY Be Modified

| Area | Rationale |
|---|---|
| `App.tsx` (lines 212-216) | `ARCH-001` and `PERM-001` require removing the direct `system_admins` query and routing the admin gate through `lib/permissions.ts:isSystemAdmin()`. |
| `lib/permissions.ts` | Reference and potentially minor adjustments to make `isSystemAdmin()` the single canonical enforcement path. |
| `contexts/AuthContext.tsx` | `ARCH-002` and `EXE-001` require extracting the `activate_pending_memberships` call and surfacing failures. |
| `services/admin/memberAdminService.ts` | New or modified service-layer wrapper for membership activation used by `AuthContext`. |
| `supabase/functions/audit-log/index.ts` | `EDG-001` requires adding caller identity validation before writes. |

## 7.2 Areas That SHALL NOT Be Modified

| Area | Rationale |
|---|---|
| Any Admin Dashboard implementation artifact outside the five files above | Preserves the sealed baseline and prevents scope creep. |
| Supabase migrations | Database reconciliation is deferred to Wave-02 under the Hybrid SSOT Drift Strategy. |
| Supabase RPC definitions | RPC consolidation is deferred to Wave-02. |
| Other Edge Functions | Only `audit-log` is authorized for Wave-01; broad Edge Function hardening is deferred. |
| Database objects (tables, RLS policies, triggers) | Wave-01 is a trust-boundary fix, not a schema change. |
| `package.json` / `package-lock.json` | No new dependencies are required for Wave-01. |
| SSOT documents `01`–`08` | They are the approved architectural baseline and may not be modified without formal revision. |

------------------------------------------------------------------------

# 8. Testing Strategy

## 8.1 Static Verification

- TypeScript type check passes for all modified files.
- Lint passes with no new warnings.
- Governance traceability check: every changed line maps to an `AD-Baseline-1.0` issue ID and an SSOT section reference.
- Diff review confirms no files outside Section 7 are modified.

## 8.2 Functional Verification

- Admin gate: `App.tsx` no longer queries `system_admins` directly; it uses `isSystemAdmin()`.
- Permission surface: only one system-admin enforcement path remains.
- Activation: `AuthContext` routes activation through `services/admin/memberAdminService.ts`.
- Error handling: failed activation calls are surfaced (logged or reported), not silently swallowed.
- Audit-log: `supabase/functions/audit-log/index.ts` rejects unauthenticated requests.

## 8.3 Regression Verification

- Existing Admin Dashboard routes and role checks continue to work.
- Existing membership activation success paths continue to work.
- Existing audit-log consumers that provide valid identity continue to work.
- No new console errors, type errors, or runtime errors in the Admin Dashboard flows.

## 8.4 Security Verification

- `EDG-001`: confirm the `audit-log` endpoint rejects requests without a valid JWT or approved internal secret.
- `ARCH-001` / `PERM-001`: confirm `isSystemAdmin()` is the only path used to gate the admin area.
- `EXE-001`: confirm the activation service wrapper does not silently swallow failures.

## 8.5 Manual Verification

- Walk through the admin area with a system admin and with a non-system admin.
- Trigger a membership activation and observe that success and failure paths behave correctly.
- Call the `audit-log` Edge Function without and with credentials to confirm access control.

## 8.6 Acceptance Evidence

| Issue ID | Required Evidence |
|---|---|
| `ARCH-001` | File read of `App.tsx` showing no direct `system_admins` query and use of `isSystemAdmin()`. |
| `PERM-001` | Comparison of `App.tsx` and `lib/permissions.ts` showing a single enforcement path. |
| `ARCH-002` | File read of `AuthContext.tsx` and `memberAdminService.ts` showing service-layer routing. |
| `EXE-001` | Evidence that failed activation calls surface errors instead of silent `.catch(() => {})`. |
| `EDG-001` | Request/response evidence that unauthenticated `audit-log` calls are rejected. |

------------------------------------------------------------------------

# 9. Risk Review

## 9.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `EDG-001` authentication is bypassed by an unexpected caller type (service role, anon, other Edge Function). | Medium | High | Use a single approved authentication model (JWT, internal secret, or equivalent) and review the model with the Principal Software Architect. |
| `ARCH-001` removal of direct query causes an edge-case admin access regression. | Medium | High | Keep the `isSystemAdmin()` helper as the single path; verify all admin routes with system-admin and non-system-admin users. |
| `ARCH-002` / `EXE-001` service extraction surfaces previously hidden failures that break the activation UI. | Medium | Medium | Surface errors explicitly; update the UI to handle reported failures gracefully. |

## 9.2 Repository Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Working-tree governance documents drift relative to the sealed baseline. | Low | Low | Track only implementation artifacts for baseline drift; governance documents are expected to evolve. |
| Accidental modification of a file outside Section 7 during implementation. | Low | High | Pre-implementation diff check and peer review; reject any change that touches an unauthorized file. |

## 9.3 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `EDG-001` fix changes the runtime contract for existing audit-log consumers. | Low | High | Validate all known audit-log callers before Wave Acceptance; document any required caller changes. |
| Activation error surfacing exposes internal error details to end users. | Low | Medium | Log full errors; surface only safe, user-actionable messages. |

## 9.4 Regression Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A trust-boundary change reintroduces a previously fixed defect or breaks an unrelated admin flow. | Medium | High | Run regression verification on the full admin route, member activation, and audit-log paths. |

## 9.5 Rollback Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Wave-01 verification fails and must be rolled back. | Low | Medium | Wave-01 is scoped to a small set of files; rollback is a clean revert to `3a06a6d9` implementation artifacts. No schema or migration changes are involved. |

------------------------------------------------------------------------

# 10. Readiness Assessment

Wave-01 has satisfied all Engineering Kickoff entry conditions:

- Phase A is closed and the baseline `AD-Baseline-1.0` is sealed.
- Phase B is open and the Remediation Master Plan is complete.
- Program Owner Decisions 1–4 are recorded.
- Wave-01 is authorized.
- The repository implementation baseline relative to `3a06a6d9` is intact.
- Engineering objectives, scope, sequencing, repository boundaries, testing strategy, and risks are defined.
- No implementation has started.

**Readiness Decision:** Wave-01 is technically ready to enter the **Implementation Readiness Review** gate.

This document does **not** authorize implementation. It authorizes only the next governance gate.

------------------------------------------------------------------------

# 11. Updated Program Status

| Dimension | Status |
|---|---|
| **Phase A** | CLOSED |
| **Baseline** | SEALED (`AD-Baseline-1.0`) |
| **Phase B** | OPEN |
| **Remediation Master Plan** | COMPLETE |
| **Program Owner Decisions** | COMPLETE |
| **Wave Planning** | COMPLETE |
| **Wave-01 Authorization** | COMPLETE |
| **Engineering Kickoff** | COMPLETE |
| **Implementation Readiness Review** | READY TO START |
| **Implementation** | NOT STARTED |
| **Wave-01 Verification** | NOT STARTED |
| **Wave-01 Acceptance** | NOT STARTED |
| **Program Certification** | NOT STARTED |
| **Overall Program Status** | ACTIVE |

------------------------------------------------------------------------

# 12. Roadmap Synchronization

The program charter `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md` has been reviewed and synchronized:

- **Section 4 (Program Mission):** Reviewed. Phase B Lifecycle already references Engineering Kickoff and Wave Implementation. No governance-rule changes required.
- **Section 7 (Long-Term Workflow):** Reviewed. Lifecycle already references Engineering Kickoff and Wave Implementation. No governance-rule changes required.
- **Section 10 (Current Status):** Updated with `Engineering Kickoff : COMPLETE`, `Implementation Readiness Review : READY TO START`, and `Implementation : NOT STARTED`.
- **Section 11 (Program Transition Rules):** Reviewed. Existing transition rules already govern Engineering Kickoff and the next gate. No governance-rule changes required.

No governance rules were modified. Only governance status values were updated.

------------------------------------------------------------------------

# 13. Next Governance Chain

If the Implementation Readiness Review passes:

``` text
Wave-01 Engineering Kickoff              COMPLETE
        ↓
Wave-01 Implementation Readiness Review  READY TO START
        ↓
Wave-01 Implementation                   NOT STARTED
        ↓
Wave-01 Verification                     NOT STARTED
        ↓
Wave-01 Acceptance                       NOT STARTED
        ↓
Wave-01 Closeout                         NOT STARTED
        ↓
Wave-02 Authorization                    NOT STARTED
```

The Implementation Readiness Review is the next gate. It does not authorize implementation; it confirms that implementation pre-conditions are satisfied before the Implementation gate is opened.

------------------------------------------------------------------------

# 14. Final Engineering Decision

| Decision | Status |
|---|---|
| **Wave-01 Engineering Kickoff** | **COMPLETE** |
| **Implementation Readiness Review** | **READY TO START** |
| **Implementation** | **NOT AUTHORIZED** |
| **Wave-01 Verification** | **NOT STARTED** |
| **Wave-01 Acceptance** | **NOT STARTED** |

Wave-01 is technically prepared for implementation planning. No implementation work is authorized by this document.

------------------------------------------------------------------------

# 15. PMO Certification

This Engineering Kickoff has been prepared by the Enterprise Program Management Office (PMO) together with the Principal Software Architect in accordance with:

- `00_ADMIN_DASHBOARD_SYSTEM_REMEDIATION_PROGRAM_CHARTER.md`
- `10A_ADMIN_DASHBOARD_INVESTIGATION_ACCEPTANCE_IMPLEMENTATION.md`
- `10B_ADMIN_DASHBOARD_PHASE_A_CLOSEOUT.md`
- `11_ADMIN_DASHBOARD_PHASE_B_OPENING_AUTHORIZATION.md`
- `12_ADMIN_DASHBOARD_REMEDIATION_MASTER_PLAN.md`
- `13_ADMIN_DASHBOARD_PROGRAM_OWNER_DECISION_RECORD.md`
- `14_ADMIN_DASHBOARD_WAVE-01_AUTHORIZATION.md`

**Certification Statement:**

> The Wave-01 Engineering Kickoff (Document 15) is complete. It establishes the engineering direction, scope, sequencing, repository boundaries, testing strategy, and risk posture for Wave-01. It does not authorize implementation. It authorizes only the next governance gate: the Wave-01 Implementation Readiness Review.

| Role | Name / Identifier | Signature / Certification |
|---|---|---|
| PMO Document Custodian | Enterprise Program Management Office (Agent) | Certified: 2026-07-20 |
| Program Owner | User (Program Owner) | Acknowledgment pending |
| Principal Software Architect | ChatGPT (Methodology Guardian) | Review pending |

**Next governance action:** Enter the Wave-01 Implementation Readiness Review.
