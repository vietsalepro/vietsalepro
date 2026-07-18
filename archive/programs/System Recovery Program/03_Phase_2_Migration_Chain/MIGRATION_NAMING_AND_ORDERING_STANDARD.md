# Migration Naming & Ordering Standard

**Program:** VietSalePro v7 — System Recovery Program  
**Task ID:** SRP-P2-T004  
**Phase:** Phase 2 — Canonical Migration Chain Stabilization  
**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Proposed — Pending Program Manager Approval  
**Document Type:** Program governance standard

---

## 1. Purpose

This standard defines the mandatory rules for naming, ordering, hotfixing, and rolling back migrations in the canonical migration chain. Its purpose is to make the chain deterministic, gapless, and safe for real-timestamp hotfixes, so that the migration chain remains the single source of truth for the database schema, RPC surface, RLS policies, triggers, and indexes.

---

## 2. Scope

### 2.1 In Scope

- All forward migrations in the canonical migration chain.
- All reverse / rollback migrations associated with forward migrations.
- Future migrations added after the canonical chain is accepted.
- Naming convention, timestamp format, ordering semantics, hotfix insertion, and rollback notation.

### 2.2 Out of Scope

- Implementation tactics, tooling configuration, or CI scripts.
- Business logic, feature development, service code, or UI changes.
- Reconciliation of RPC contracts, tests, or generated artifacts.
- Modification of existing migration files.

---

## 3. Naming Convention

A canonical forward-migration file name MUST match the following pattern:

```
<TIMESTAMP>_<SEMANTIC_SLUG>.sql
```

Where:

- `TIMESTAMP` is exactly 14 decimal digits in the format defined in §4.
- `SEMANTIC_SLUG` is a lower-case, snake_case description of the migration's purpose.
- A single underscore (`_`) separates `TIMESTAMP` from `SEMANTIC_SLUG`.
- The file extension is `.sql`.

A reverse / rollback file MUST use the same `TIMESTAMP` and `SEMANTIC_SLUG` as the forward migration and MUST be distinguished by an additional suffix before the extension:

```
<TIMESTAMP>_<SEMANTIC_SLUG>.reverse.sql
```

or, if a separate rollback directory is declared by the Canonical Migration Chain Definition:

```
<ROLLBACK_DIR>/<TIMESTAMP>_<SEMANTIC_SLUG>.reverse.sql
```

No other file-name variants are part of the canonical chain.

---

## 4. Timestamp Format

The timestamp MUST use the form:

```
YYYYMMDDHHMMSS
```

where:

- `YYYY` = four-digit year,
- `MM` = two-digit month (01–12),
- `DD` = two-digit day (01–31),
- `HH` = two-digit hour in 24-hour notation (00–23),
- `MM` = two-digit minute (00–59),
- `SS` = two-digit second (00–59).

The timestamp SHOULD express UTC. If a non-UTC reference is used, it MUST be documented in the Canonical Migration Chain Definition and applied consistently.

Timestamps MUST be unique within the canonical chain. Duplicate timestamps are prohibited.

---

## 5. Ordering Rules

1. **Lexicographic order is execution order.** The migration runner MUST apply forward migrations in ascending lexicographic order of their full file names.
2. **Timestamp ordering is total.** For any two forward migrations A and B, either `A < B` or `B < A`.
3. **No gaps that block hotfixes.** The canonical chain MUST reserve enough timestamp space between logically sequential migrations to allow real-timestamp hotfixes to be inserted without renumbering existing migrations. If the chain is already gapless, hotfix insertion follows §6.
4. **No duplicate names.** Two forward migrations MUST NOT share the same full file name.
5. **No out-of-order dependencies.** A migration MUST NOT depend on a migration with a later timestamp.
6. **Reverse files are not ordered.** Reverse / rollback files MUST NOT influence forward-migration ordering and MUST be excluded from the ordered chain.

---

## 6. Hotfix Rule

A hotfix is a migration that must be inserted into the canonical chain after the chain has been established but before the next scheduled migration.

1. **Assign the real creation timestamp** if it falls between the timestamp of the migration the hotfix depends on and the timestamp of the next forward migration, and if the timestamp is unique.
2. **If no unique real timestamp is available** in the required position, assign the smallest unused timestamp that preserves the required logical order.
3. **Hotfix naming** follows the forward-migration naming convention in §3.
4. **Hotfix precedence.** A hotfix MUST be ordered after every migration it depends on and before every migration that depends on it.
5. **Conflict resolution.** If two hotfixes require the same timestamp, the Program Manager or delegated engineering lead MUST assign sequential seconds in dependency order and record the assignment in the Decision & Escalation Log.

---

## 7. Rollback / Reverse Migration Convention

1. **One reverse file per forward migration.** Every forward migration SHOULD have a corresponding reverse migration file. If a migration is genuinely irreversible, the absence MUST be documented and accepted by the Architecture Authority.
2. **Reverse file naming.** The reverse file MUST share the same timestamp and semantic slug as the forward migration and use the `.reverse.sql` extension (or be placed in the declared rollback directory).
3. **Reverse files are idempotent.** A reverse file MUST be safe to run only against a database state that matches the forward migration's outcome, and it MUST restore the prior schema/contract state.
4. **Reverse files do not alter ordering.** The presence or absence of a reverse file MUST NOT change the execution order of forward migrations.
5. **No mixed direction in one file.** A forward migration file MUST NOT contain rollback logic; a reverse file MUST NOT contain forward logic.

---

## 8. Directory Structure

1. **Single canonical migrations directory.** All forward migrations MUST reside in one directory designated as the canonical migrations directory by the Canonical Migration Chain Definition.
2. **No nested subdirectories for forward migrations.** Forward migrations MUST NOT be placed in subdirectories that affect ordering.
3. **Rollback files location.** Reverse files MAY reside in the same directory as forward migrations or in a sibling `rollback/` directory, provided the Canonical Migration Chain Definition declares the location and the migration runner excludes reverse files from ordering.
4. **Orphan files.** SQL files outside the canonical migrations directory and declared rollback directory MUST be treated as orphan files and handled per the Orphan SQL Triage Record.

---

## 9. Chain Authority

1. **Architecture Authority** owns this standard and approves any exception to naming, ordering, timestamp format, hotfix handling, or rollback conventions.
2. **Program Manager** accepts this standard as a Phase 2 deliverable and authorizes its enforcement across engineering work.
3. **Engineering teams** MUST apply this standard to every new or modified migration in the canonical chain.
4. **No derived document overrides.** This standard, once accepted, applies to the canonical migration chain; no schema dump, generated type, markdown contract, or test mock may introduce a conflicting naming or ordering rule.

---

## 10. Acceptance Criteria

This standard is accepted when all of the following are true:

1. The document covers timestamp format, file naming, ordering semantics, hotfix insertion, rollback notation, directory structure, and chain authority.
2. The document references `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` §6 (Guiding Principles), §8 (Exit Criteria), §9 (Program Governance), and §10 (Program Constraints); `SYSTEM_RECOVERY_MASTER_PLAN.md` §4 Phase 2; and `PHASE2_GOVERNANCE_BASELINE.md`.
3. The standard contains no implementation tactics, no SQL examples, no generated artifacts, and no engineering planning beyond what is necessary to express the rule.
4. The Program Manager has reviewed and accepted the standard.
5. Engineering has acknowledged the standard and confirmed it can be applied to future migrations.

---

## 11. References

- `CURRENT_TASK.md` — Task SRP-P2-T004 objective, scope, and acceptance criteria.
- `SYSTEM_RECOVERY_PROGRAM_CHARTER.md`
  - §3 Program Objectives (canonical migration chain objective)
  - §6 Guiding Principles (migrations are canonical, no manual synchronization, one SSOT)
  - §8 Exit Criteria (SSOT restored across layers)
  - §9 Program Governance (decision authority, architecture authority, evidence requirements)
  - §10 Program Constraints (no undocumented migration, no bypassing canonical sources)
- `SYSTEM_RECOVERY_MASTER_PLAN.md`
  - §2 Execution Strategy (canonical source first, evidence before assumptions)
  - §4 Phase 2 — Canonical Migration Chain Stabilization (exit criteria, deliverables)
  - §7 Quality Gates (Phase Exit Gate, Architecture Gate, Operational Trust Gate)
- `PHASE2_GOVERNANCE_BASELINE.md`
  - §3.5 Migration Naming & Ordering Standard acceptance criteria
  - §4 Evidence Standards
  - §5 Quality Gates (QG-P2-05)
  - §6 Scope-Control Rules
  - §7 Exception Procedure
  - §8 Decision Authority and Escalation
- `PHASE2_DELIVERABLE_ACCEPTANCE_MATRIX.md` — D-P2-05 acceptance criteria, evidence, and authority.
- `PHASE2_SCOPE_AND_EXCEPTION_CONTROL_NOTE.md` — Phase 2 boundary statement and exception procedure.
