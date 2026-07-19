## Context

PLAN_02_VoucherFormLayout_SSOT_Detailed.md defines Phase 0 as the audit and baseline step. The project currently contains a mix of shared `VoucherFormLayout` usage and legacy layout components (`ImportFormLayout`, `DisposalFormLayout`, `CountFormLayout.css`) plus three feature flags. We need a complete inventory before making changes.

## Goals / Non-Goals

**Goals:**
- Produce an accurate, complete audit checklist.
- Create a project backup as the baseline restore point.
- Verify the project currently builds and passes lint.

**Non-Goals:**
- Changing any code.
- Solving layout problems discovered during audit.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Use PowerShell for audit commands | Project runs on Windows; PowerShell `Select-String` is available natively | Git Bash grep; rejected to avoid dependency on Git Bash being installed |
| Store audit in `docs/plans/voucher-form-layout-ssot/` | Keeps planning artifacts next to PLAN_01 and PLAN_02 | Store in `openspec/`; rejected because PLAN_02 is already in `docs/plans/` |

## Risks / Trade-offs

- **[Low]** Missing a dead file during audit → mitigation: run multiple patterns and cross-check against imports.
- **[Low]** Backup takes disk space → mitigation: delete old backups after the refactor is complete.

## Migration / Rollback

- No migration. Backup is created but not restored unless a later phase fails.

## Open Questions

- Does `pages/DisposalForm.css` exist? (PLAN_01 says "nếu có".)
- Is `useRefactoredCountLayout` imported anywhere? (PLAN_02 suggests it should not be.)
