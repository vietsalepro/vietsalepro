## Context

All implementation phases (1–6) are complete. The final phase is a structured verification pass to confirm the system behaves correctly and the `AGENTS.md` handoff is accurate.

## Goals / Non-Goals

**Goals:**
- Confirm lint and build pass.
- Confirm the full create/save/complete/delete flow works end-to-end.
- Confirm inventory, cost, and supplier debt are consistent after CRUD.
- Confirm routing and error messages work.
- Document results in `AGENTS.md`.

**Non-Goals:**
- Writing new code or changing behavior. If a bug is found, it becomes a blocker to fix in the relevant earlier phase, not a change here.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Run verification in a dedicated phase | Separates testing from implementation, making results easier to audit | Combine verification with Phase 6 |
| Update `AGENTS.md` with results | Provides a single source of truth for the agent session | Keep results only in handoff files |

## Risks / Trade-offs

- **Low** — Verification may reveal issues that require revisiting earlier phases. → Document blockers and either fix the earlier phase or create a follow-up change.

## Migration / Rollback

- No code migration. If verification fails, the project should be rolled back to the last stable phase backup.
- How to undo: restore the backup from the most recent stable phase.

## Open Questions

- Are there automated tests or only manual end-to-end tests available?
- Should the final backup be stored with a specific name suffix?
