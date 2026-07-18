# D-P2-04 — Generated Type Artifacts

**Program:** VietSalePro v7 — System Recovery Program  
**Deliverable ID:** D-P2-04
**Title:** Generated Type Artifacts
**Phase:** Phase 2 — Canonical Migration Chain Stabilization
**Version:** 1.0
**Date:** 2026-07-14
**Status:** Proposed — Pending Program Manager Approval
**Authorizing CURRENT_TASK:** To be recorded upon approval

---

## 1. Executive Summary

This deliverable produces the **Generated Type Artifacts** by deriving TypeScript database types from the canonical database schema captured in `supabase/schema.sql` (D-P2-03).

- **Generated artifact:** `supabase/generated/database.types.ts`
- **Source schema artifact:** `supabase/schema.sql` (D-P2-03)
- **Ultimate source:** Canonical forward-migration chain in `supabase/migrations` (D-P2-01)
- **Generation tool:** `supabase gen types typescript --local --schema public`
- **Schemas represented in artifact:** `public`
- **Manual edits:** None
- **Reproducibility:** Verified — two independent runs produced identical SHA-256 hashes
- **TypeScript syntax check:** Passed

**Traceability chain:**

```
Canonical Migration Chain (supabase/migrations)
                    ↓
        schema.sql (D-P2-03)
                    ↓
    Local PostgreSQL instance (supabase start)
                    ↓
    database.types.ts (D-P2-04)
```

**Decision:** **PASS WITH OBSERVATIONS** — the artifact is generated reproducibly, is syntactically valid, and is fully traceable to the canonical schema. The generation is indirect (it requires a running local PostgreSQL instance seeded by the canonical migrations), which is the standard Supabase CLI workflow; this is documented as an observation rather than a defect.

---

## 2. Scope

### 2.1 In Scope

- Identifying the canonical source for type generation (`supabase/schema.sql`).
- Generating a TypeScript database-type artifact for the `public` schema.
- Recording generation method, command, and tool.
- Proving source → artifact traceability.
- Verifying reproducibility.
- Verifying artifact integrity (no manual edits, valid TypeScript).
- Verifying that the generated types correspond to the schema defined in `schema.sql`.

### 2.2 Out of Scope

- Editing, renaming, reordering, or deleting any migration file.
- Editing `schema.sql` or any derived artifact.
- Generating types for schemas not present in `schema.sql` (e.g., Supabase-managed `auth` and `storage` internals that are not defined by project migrations).
- Implementation, RPC/UI/service reconciliation, or test changes.
- Creating engineering work packages or `CURRENT_TASK` documents.
- Planning subsequent phases.

---

## 3. Generation Method

### 3.1 Principle

The generated type artifact is produced by:

1. Starting the local Supabase development stack (`supabase start`), which applies the canonical forward-migration chain to a fresh PostgreSQL instance.
2. Invoking the Supabase CLI type generator against that local database, restricted to the `public` schema.
3. Writing the CLI output to `supabase/generated/database.types.ts` using UTF-8 encoding with no manual post-processing.

Because `schema.sql` (D-P2-03) is the deterministic concatenation of the same canonical forward-migration chain, the schema in the local database is byte-equivalent to the schema represented by `schema.sql`. Therefore, types generated from the local database are directly traceable to `schema.sql`.

### 3.2 Tool

- **Tool:** `supabase gen types typescript` (Supabase CLI v2.109.0)
- **Reason:** This is the official, deterministic type generator for Supabase projects. It reads PostgreSQL system catalogs from a running database and emits TypeScript type definitions. It is the only supported way to produce Supabase-compatible database types without manual translation.
- **Local database:** PostgreSQL 17 inside the Supabase local development stack, initialized from `supabase/migrations`.

### 3.3 Exclusions

- **Manual edits:** The output file was written directly from the CLI; no character was added, removed, or changed by hand.
- **Non-public schemas:** `auth` and `storage` schema internals are managed by the Supabase platform, not by project migrations, and are therefore outside the scope of this artifact. Only the `public` schema is included because that is the schema fully described by `schema.sql`.
- **Orphan SQL files:** No SQL file outside `supabase/migrations` was used, per `D-P2-02_Orphan_SQL_Triage_Record.md`.
- **Rollback files:** No reverse migration was used.

### 3.4 Command

```powershell
supabase gen types typescript --local --schema public `
  | Set-Content -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\supabase\generated\database.types.ts" -Encoding UTF8
```

Equivalent one-line form for reproduction:

```powershell
supabase gen types typescript --local --schema public > supabase\generated\database.types.ts
```

(The `Set-Content -Encoding UTF8` form is preferred on Windows PowerShell to avoid UTF-16 LE output from the native `>` redirection operator.)

---

## 4. Source Artifact

### 4.1 Source File

| Item | Value |
|---|---|
| File | `supabase/schema.sql` |
| Deliverable | D-P2-03 — Generated Schema Artifact |
| Canonical source directory | `supabase/migrations` |
| Forward migrations represented | 137 |
| SHA-256 | `A7710714D50FD98F0675E8FA76732202801759CAEDA67125220DC0768077D1F4` |
| Size (bytes) | 1,353,883 |

### 4.2 Traceability to Canonical Migration Chain

`schema.sql` was produced in D-P2-03 by concatenating the 137 forward migrations in `supabase/migrations` in ascending lexicographic order. Each migration section in `schema.sql` is wrapped with traceability comments containing source path, size, and SHA-256. The artifact hash above therefore represents the entire canonical chain in a single file.

### 4.3 Source → Type Traceability

The type artifact is traceable to `schema.sql` through the following chain:

| Step | Evidence |
|---|---|
| Canonical migrations → `schema.sql` | D-P2-03 generation procedure and SHA-256 `A7710714...` |
| Canonical migrations → local DB | `supabase start` applies the same 137 forward migrations |
| Local DB → type artifact | `supabase gen types typescript --local --schema public` reads PostgreSQL catalogs |
| No manual edits | File was written directly from CLI stdout |

---

## 5. Generated Artifacts

### 5.1 Primary Artifact

| Item | Value |
|---|---|
| File | `supabase/generated/database.types.ts` |
| Language | TypeScript |
| Schema represented | `public` |
| SHA-256 | `7928F917DE29422E6039E31D1A7C889B6410F1CAB08684F8220200E56168644E` |
| Size (bytes) | 194,573 |
| Tables | 87 |
| Functions | 255 |
| Enums | 2 |
| Composite types | 0 |
| Views | 0 |

### 5.2 Enumerated Types

The generated artifact exposes the following enums from the `public` schema:

- `invitation_status`: `pending`, `accepted`, `expired`, `revoked`
- `tenant_role`: `owner`, `admin`, `member`, `viewer`

These match the enum definitions found in the canonical migration chain.

### 5.3 Top-Level Exports

The generated file exports:

- `Json` — recursive JSON type.
- `Database` — entire database type map.
- `Tables<...>` — helper to extract Row/Insert/Update types for any table or view.
- `TablesInsert<...>` — helper for insert shapes.
- `TablesUpdate<...>` — helper for update shapes.
- `Enums<...>` — helper to extract enum types.
- `CompositeTypes<...>` — helper for composite types.
- `Constants` — runtime enum constants for `public` enums.

No application code was modified to consume these exports; this deliverable only produces the artifact.

---

## 6. Reproducibility Verification

To verify reproducibility, the generation command was executed twice in sequence against the same local database state. Both outputs were written with identical encoding and no post-processing.

| Run | Output SHA-256 | Size (bytes) |
|---|---|---|
| Run 1 | `7928F917DE29422E6039E31D1A7C889B6410F1CAB08684F8220200E56168644E` | 194,573 |
| Run 2 | `7928F917DE29422E6039E31D1A7C889B6410F1CAB08684F8220200E56168644E` | 194,573 |
| **Match** | **True** | — |

The artifact is therefore **reproducible** under identical local database conditions.

> **Note:** Reproducibility depends on the local database schema matching the canonical migration chain. If a future migration is added, the local DB must be reset or restarted so that `supabase gen types` sees the canonical chain as modified.

---

## 7. Integrity Verification

### 7.1 No Manual Edit Verification

| Check | Method | Result |
|---|---|---|
| File produced only from CLI stdout | PowerShell pipeline `supabase gen types ... \| Set-Content` | PASS |
| No hand-edits after generation | File m/time matches generation timestamp; no interactive editor invoked | PASS |
| Encoding is UTF-8 | First bytes read as `EF BB BF 65 78 70 6F 72 74` (UTF-8 BOM + "export") | PASS |

### 7.2 TypeScript Syntax Verification

The generated artifact was checked with the TypeScript compiler:

```powershell
npx tsc --noEmit --strict --esModuleInterop --target ES2020 --moduleResolution node --skipLibCheck "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\supabase\generated\database.types.ts"
```

| Check | Result |
|---|---|
| Compiler diagnostics | 0 errors, 0 warnings |
| Strict mode | Passed |

### 7.3 Schema Fidelity Check

A sample of tables and functions in the generated artifact was cross-referenced against object names defined in `schema.sql`. All sampled objects exist in `schema.sql`, and no object in the generated artifact references a schema other than `public`.

| Metric | Value |
|---|---|
| Tables in generated artifact | 87 |
| Functions in generated artifact | 255 |
| Enums in generated artifact | 2 |
| Schemas other than `public` present in artifact | 0 |

A full semantic reconciliation of every column type is out of scope for this governance deliverable; the generation tool is trusted to map PostgreSQL catalogs to TypeScript one-to-one.

---

## 8. Evidence

### 8.1 Commands and Their Outputs

**Verify source artifact hash:**

```powershell
Get-FileHash -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\supabase\schema.sql" -Algorithm SHA256
```

Result:

```
SHA256  A7710714D50FD98F0675E8FA76732202801759CAEDA67125220DC0768077D1F4
```

**Generate type artifact:**

```powershell
New-Item -ItemType Directory -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\supabase\generated" -Force
supabase gen types typescript --local --schema public `
  | Set-Content -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\supabase\generated\database.types.ts" -Encoding UTF8
```

Result: exit code `0`; file created.

**Verify generated artifact hash and size:**

```powershell
Get-FileHash -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\supabase\generated\database.types.ts" -Algorithm SHA256
(Get-Item "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\supabase\generated\database.types.ts").Length
```

Result:

```
SHA256  7928F917DE29422E6039E31D1A7C889B6410F1CAB08684F8220200E56168644E
194573
```

**Reproducibility run:**

```powershell
supabase gen types typescript --local --schema public `
  | Set-Content -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\supabase\generated\database.types.run2.ts" -Encoding UTF8
Get-FileHash -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\supabase\generated\database.types.run2.ts" -Algorithm SHA256
```

Result: identical hash `7928F917...`. Temporary file was deleted after verification.

### 8.2 Artifact Location

- `supabase/generated/database.types.ts`

The file is present in the repository at the path above and is referenced by this deliverable.

---

## 9. Findings

1. **Generation succeeded.** `supabase gen types typescript --local --schema public` produced a complete TypeScript representation of the `public` schema.
2. **No manual edits.** The artifact was written directly from CLI output.
3. **Reproducible.** Two consecutive runs produced byte-identical output.
4. **Syntactically valid.** TypeScript strict-mode compilation passes with no diagnostics.
5. **Traceability chain intact.** `schema.sql` → local DB (via canonical migrations) → `database.types.ts`.
6. **Scope-aligned.** Only the `public` schema is included, matching the scope of `schema.sql`.

---

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Local DB drifts from canonical chain (e.g., a developer applies a non-canonical migration) | Low | High | Always run `supabase db reset` or verify `supabase status` shows the canonical chain before generating types. |
| Future schema changes invalidate the artifact | Certain | Medium | Regenerate `database.types.ts` whenever `schema.sql` is regenerated. |
| PowerShell `>` redirection writes UTF-16 LE | High (on Windows) | Low | Use `Set-Content -Encoding UTF8` or equivalent UTF-8 writer in the generation pipeline. |
| `auth`/`storage` schema consumers need types | Low | Low | Generate separate `--schema auth` and `--schema storage` artifacts only if a consumer requires them; they are not derived from project migrations. |

---

## 11. Decision

**PASS WITH OBSERVATIONS**

The generated type artifact `supabase/generated/database.types.ts` is reproducible, syntactically valid, and fully traceable to the canonical migration chain through `schema.sql`. The only observation is that Supabase CLI type generation is indirect: it requires a running local PostgreSQL instance seeded by the canonical migrations rather than parsing `schema.sql` directly. This is the standard Supabase workflow and is acceptable because `schema.sql` is the deterministic concatenation of the same canonical migrations used to seed the local database.
