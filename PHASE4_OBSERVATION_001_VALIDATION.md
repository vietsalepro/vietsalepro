# PHASE4 Observation #001 — Independent Validation Report

**Observation (from `PHASE4_FINAL_COMPLETION_AUDIT.md` §15 Item 1, §17, §18):**
`activate_pending_memberships` is a Production RPC that has no corresponding mock handler.

**Validation Date:** 2026-07-17  
**Validator:** Independent Technical Auditor  
**Verdict:** **Case B — Production RPC, but outside Phase 4 scope.**  
**Recommendation:** Remove Observation #1 from the Phase 4 final completion audit.

---

## 1. Executive Summary

- `activate_pending_memberships` is a **real, canonical RPC** defined in the migration chain and currently **called from production code** in `contexts/AuthContext.tsx`.
- It is **not covered** by a branch in `tests/mocks/supabase.ts`.
- However, it is **outside the Phase 4 recovery/validation scope**, which was explicitly bounded to the service layer (`services/`, `lib/`, `utils/`) and the RPCs listed in the Phase 4 recovery mapping.
- The auth-context direct RPC call was already classified as an **acceptable architectural bypass** in `SCAR_PHASE3_REPORT.md` §5.2.
- No test exercises this path, and the production call is fire-and-forget with `.catch(() => {})`, so no automated gate fails today.

---

## 2. Evidence from the Repository

### 2.1 Production call site

<ref_snippet file="c:/PROJECT/vietsalepro/contexts/AuthContext.tsx" lines="79-93" />

Call stack:

```
AuthProvider mounts
└── useEffect registers supabase.auth.onAuthStateChange
    └── event === 'SIGNED_IN' and newSession?.user exists
        └── Promise.resolve(
                supabase.rpc('activate_pending_memberships', { p_user_id: newSession.user.id })
            ).catch(() => {});
```

- **File:** `contexts/AuthContext.tsx`  
- **Line:** 91  
- **Type:** Production (React context bootstrap)  
- **Pattern:** Direct `supabase.rpc(...)` call, not routed through any service in `services/`, `lib/`, or `utils/`.

A whole-repo search for `activate_pending_memberships` in `*.{ts,tsx,js,jsx}` files returns only this production call plus the canonical/generated definitions. No test calls it.

### 2.2 Canonical migration source

<ref_snippet file="c:/PROJECT/vietsalepro/supabase/migrations/20260711000007_f33_members_status_activation.sql" lines="1-16" />

The canonical migration exists and defines:

```sql
CREATE OR REPLACE FUNCTION public.activate_pending_memberships(p_user_id uuid)
RETURNS void
...
```

It is also reflected in:

- `supabase/schema.sql` line 29996  
- `supabase/generated/database.types.ts` line 4323  

So the **database contract is intact**; the only gap is in the test mock layer.

### 2.3 Mock handler status

`tests/mocks/supabase.ts` contains no `if (name === 'activate_pending_memberships')` branch. The `rpc` function falls through to:

<ref_snippet file="c:/PROJECT/vietsalepro/tests/mocks/supabase.ts" lines="6484-6486" />

Independent count of all `if (name === '...')` branches in the mock file:

```text
$ node -e "const fs=require('fs'); const t=fs.readFileSync('tests/mocks/supabase.ts','utf8'); const m=[...t.matchAll(/if \(name === '([a-z_0-9]+)'\)/g)]; const s=new Set(m.map(x=>x[1])); console.log('raw',m.length,'unique',s.size); console.log('has activate?',s.has('activate_pending_memberships'));"
raw 186 unique 185
has activate? false
```

- Raw branches: 186  
- Unique handler names: 185 (one duplicate: `get_tenant_members_with_email`)  
- `activate_pending_memberships` present: **No**

### 2.4 Test impact

- No test file references `activate_pending_memberships`.
- The only test that touches `AuthContext` is `tests/admin-dashboard/Security.test.tsx`, and it **mocks `useAuth`** instead of rendering `AuthProvider`:

<ref_snippet file="c:/PROJECT/vietsalepro/tests/admin-dashboard/Security.test.tsx" lines="56-58" />

- Because the call is wrapped in `Promise.resolve(...).catch(() => {})`, even if a test did mount `AuthProvider`, the mock's `RPC not found` error would be silently swallowed.
- The reported `npx vitest run` result is 389/389 passing, with no failure tied to this RPC.

### 2.5 Phase 4 scope check

| Source | What it says about scope | Relevance |
|---|---|---|
| `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 4 | Scope: test mocks/audit assertions that assume missing RPCs; audit tooling; CI gates. | Does not extend to `contexts/` direct RPC calls. |
| `CURRENT_PHASE.md` §2 | "Exactly as defined in `SYSTEM_RECOVERY_MASTER_PLAN.md`" | Same bounded scope. |
| `scripts/audit-rpc-contracts.ts` line 13 | `const CODE_DIRS = ['services', 'lib', 'utils'];` | The operational audit gate explicitly **does not scan** `contexts/`. |
| `PHASE4_COVERAGE_ROADMAP.md` §1.2 | Baseline inventory of 115 uncovered RPCs across 19 source files under `services/`, `lib/`, `utils/`. `contexts/` is not listed. | `activate_pending_memberships` was never part of the Phase 4 coverage gap. |
| `PHASE4_COVERAGE_ROADMAP.md` §2 Domain A | Lists 20 Domain A RPCs; `activate_pending_memberships` is absent. | Not in the recovery mapping. |
| `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` §4.2 | Corrects Domain A/B mapping; lists 20 Domain A RPCs; `activate_pending_memberships` absent. | Not authorized for recovery. |
| `PHASE4_RECOVERY_MAPPING_VALIDATION.md` §3 Domain A | Validates 20 Domain A RPCs; `activate_pending_memberships` absent; 0 unresolved mismatches. | Confirmed out of recovery scope. |
| `PHASE4_ACCEPTANCE_RECORD.md` §4, §5, §7 | Claims **184 / 184** unique code RPCs invoked by the **service layer** covered; no Recovery Wave open. | The metric was service-layer, not full production code. |
| `SCAR_PHASE3_REPORT.md` §5.2 | `contexts/AuthContext.tsx` using `supabase.rpc('activate_pending_memberships')` is marked **ACCEPTABLE** as an auth-context bootstrap bypass. | Architectural precedent. |

The canonical audit gate run also confirms the bounded scope:

```text
$ npx tsx scripts/audit-rpc-contracts.ts
Migration RPCs: 300
Code RPCs      : 183

All service-layer RPC calls are defined in the canonical migration chain.
```

This script does not scan `contexts/`, so it does not see `activate_pending_memberships`.

---

## 3. Classification

| Case | Definition | Applies? | Reason |
|---|---|---|---|
| **A** | Production RPC and within Phase 4 | **No** | It was not in the authorized Phase 4 recovery waves, the coverage roadmap, or the service-layer audit scope. |
| **B** | Production RPC but **not** in Phase 4 | **Yes** | It is called in production, but it sits in an auth-context bypass that was explicitly accepted by SCAR and excluded from Phase 4 recovery mapping. |
| **C** | Legacy RPC no longer in production path | No | Called on every `SIGNED_IN` event in `AuthContext.tsx`. |
| **D** | False positive of the audit | Partially | The literal fact "production RPC without mock" is true, but as a **Phase 4 observation** it is misplaced and should be removed. |

**Selected classification: B.**

---

## 4. Conclusion

The statement

> "`activate_pending_memberships` is a Production RPC without a mock handler"

is **factually true**, but it is **not a Phase 4 coverage gap**.

Phase 4 was scoped to:

- `services/`, `lib/`, `utils/` RPC call sites,
- the 115 uncovered RPCs in the Coverage Roadmap,
- the 184/184 service-layer coverage target,
- and the canonical audit gate that only scans those three directories.

`activate_pending_memberships` is called directly from `contexts/AuthContext.tsx`, an auth-context bypass that the SCAR Phase 3 report already accepted. It was never listed in any Phase 4 recovery wave, Domain A inventory, or recovery authorization. Therefore it falls outside Phase 4 acceptance criteria.

Because the canonical migration exists and the production call is fire-and-forget with a swallowed error, there is:

- **No contract failure**,
- **No failing automated gate**,
- **No Phase 4 acceptance breach**.

---

## 5. Recommendation

1. **Remove Observation #1** from `PHASE4_FINAL_COMPLETION_AUDIT.md` as a Phase 4 finding.
2. If the program wants full production-code mock coverage (including `contexts/`), treat it as **post-Phase-4 technical debt** and authorize through the normal scope-change / CURRENT_TASK process.
3. Do **not** add an unauthorized mock handler or create a new CURRENT_TASK as part of this independent validation.

---

## 6. Validation Constraints Observed

- No code was modified.
- No mock was added.
- No test was changed.
- No audit, acceptance, or governance document was edited.
- No new `CURRENT_TASK` or Phase 5 artifact was created.

---

## 7. Evidence Log

| # | Check | Result |
|---|---|---|
| 1 | `grep activate_pending_memberships` across `*.{ts,tsx,js,jsx}` | Only production call in `contexts/AuthContext.tsx:91` plus canonical/generated definitions. |
| 2 | `grep` in `tests/mocks/supabase.ts` for `activate_pending_memberships` | No handler branch. |
| 3 | Node parse of `tests/mocks/supabase.ts` | 186 raw / 185 unique `if (name === '...')` branches; `activate_pending_memberships` absent. |
| 4 | Read `supabase/migrations/20260711000007_f33_members_status_activation.sql` | Canonical `CREATE OR REPLACE FUNCTION public.activate_pending_memberships` exists. |
| 5 | Read `scripts/audit-rpc-contracts.ts` | `CODE_DIRS = ['services', 'lib', 'utils']`; does not scan `contexts/`. |
| 6 | Run `npx tsx scripts/audit-rpc-contracts.ts` | 300 migration RPCs, 183 code RPCs, exit 0. |
| 7 | `grep AuthProvider/AuthContext` in `tests/*.{test,spec}.{ts,tsx}` | Only `tests/admin-dashboard/Security.test.tsx` mocks `useAuth`; no test mounts `AuthProvider`. |
| 8 | Cross-check `PHASE4_COVERAGE_ROADMAP.md` Domain A list | 20 RPCs; `activate_pending_memberships` not present. |
| 9 | Cross-check `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md` and `PHASE4_RECOVERY_MAPPING_VALIDATION.md` | 0 matches for `activate_pending_memberships`; not in recovery mapping. |
| 10 | Cross-check `SCAR_PHASE3_REPORT.md` §5.2 | `contexts/AuthContext.tsx` bypass marked **ACCEPTABLE**. |
