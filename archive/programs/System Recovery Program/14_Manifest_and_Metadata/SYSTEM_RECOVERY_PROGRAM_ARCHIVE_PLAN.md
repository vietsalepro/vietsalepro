# System Recovery Program Archive Plan

**Repository:** VietSalePro v7  
**Authority:** Repository Governance Administrator  
**Program Status:** Permanently closed — `FINAL_PROGRAM_STATE.md` issued  
**Plan Type:** Repository organization — no code, SQL, migrations, tests, or application source changes  
**Date:** 2026-07-18

---

## 1. Purpose

The VietSalePro v7 System Recovery Program has been formally closed. Its final governance record is `FINAL_PROGRAM_STATE.md`. The objective of this plan is to permanently relocate all System Recovery Program governance artifacts into an isolated archive folder so that:

- The project root becomes clean and focused on active development.
- Active development documents remain separate from historical governance evidence.
- All Recovery Program evidence is preserved under version control.
- Historical governance can be restored or audited at any time without affecting the active product.

This plan does **not** reopen the program, modify any source content, or change references. It is purely an archival design to be executed only after explicit approval.

---

## 2. Archive Principles

1. **Preserve evidence.** No document content may be edited, renamed, or deleted.
2. **Use `git mv` for every move.** This keeps file history intact and auditable.
3. **Do not modify active development.** Source code, SQL migrations, tests, and operational runbooks remain untouched.
4. **Do not modify references.** Internal markdown links will become invalid after the move; a reference-remediation pass is explicitly out of scope unless separately approved.
5. **Keep the existing `archive/` contents.** Two documents already reside under `archive/`; they are not part of the System Recovery Program and shall not be moved or altered.
6. **Create a manifest.** A generated `ARCHIVE_MANIFEST.md` will map every old path to its new archive path.
7. **Single commit migration.** The archive move should be performed as one discrete git commit for easy review and rollback.

---

## 3. Archive Folder Structure

The new archive will live alongside the pre-existing `archive/` contents.

```
C:\PROJECT\vietsalepro\
├── archive\                                    (existing archive, untouched)
│   ├── Plan\PLAN_AdminDashboard_SubPhases.md
│   └── docs\admin-dashboard\ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md
│
└── archive\System Recovery Program\            (new, dedicated archive)
    ├── 00_Charter_and_Master_Plan\
    ├── 01_Program_State_Authorization_and_Closure\
    ├── 02_Phase_1_Establishment\
    ├── 03_Phase_2_Migration_Chain\
    ├── 04_Phase_3_RPC_Contract\
    ├── 05_Phase_4_Validation_Layer\
    ├── 06_Phase_5_Documentation_Reconciliation\
    ├── 07_Phase_6_Operational_Readiness\
    ├── 08_Phase_7_Program_Closure\
    ├── 09_Recovery_Waves_and_Domains\
    ├── 10_Audit_Forensic_and_Strategic_Reports\
    ├── 11_Architecture_and_Certification\
    ├── 12_Current_Task_Governance\
    ├── 13_Deployment_Readiness\
    └── 14_Manifest_and_Metadata\
        ├── ARCHIVE_MANIFEST.md
        └── README_ARCHIVE_INDEX.md
```

---

## 4. Inventory of Documents to Archive

All files below are either root-level recovery-program artifacts or are located in `docs/system-recovery/`. Each entry shows the **current source** and the proposed **archive destination folder**.

### 4.1 00_Charter_and_Master_Plan

- `SYSTEM_RECOVERY_PROGRAM_CHARTER.md` → `00_Charter_and_Master_Plan/`
- `SYSTEM_RECOVERY_MASTER_PLAN.md` → `00_Charter_and_Master_Plan/`

### 4.2 01_Program_State_Authorization_and_Closure

- `CURRENT_PHASE.md`
- `CURRENT_PHASE_UPDATE_REPORT.md`
- `UNIFIED_PROGRAM_STATE.md`
- `PROGRAM_RECOVERY_AUTHORIZATION.md`
- `PROGRAM_RECOVERY_AUTHORIZATION_ERRATA.md`
- `M5_1_PROGRAM_MANAGER_ACCEPTANCE.md`
- `PROGRAM_COMPLETION_STATEMENT.md`
- `PROGRAM_SPONSOR_ACCEPTANCE.md`
- `DECISION_AND_ESCALATION_LOG.md`
- `GOVERNANCE_EXECUTION_MODEL_CHANGELOG.md`
- `CHAT_EXECUTION_BASELINE.md`
- `TRANSITION_MEMO_TO_NORMAL_DEVELOPMENT_GOVERNANCE.md`

### 4.3 02_Phase_1_Establishment

- `PHASE1_ACCEPTANCE_RECORD.md`
- `PHASE_TRANSITION_CHANGE_PLAN.md`
- `PHASE_TRANSITION_PLAN_REVIEW.md`
- `PHASE_TRANSITION_IMPLEMENTATION_REPORT.md`

### 4.4 03_Phase_2_Migration_Chain

- `PHASE2_ACCEPTANCE_RECORD.md`
- `PHASE2_DELIVERABLE_ACCEPTANCE_MATRIX.md`
- `PHASE2_GOVERNANCE_BASELINE.md`
- `PHASE2_SCOPE_AND_EXCEPTION_CONTROL_NOTE.md`
- `CANONICAL_MIGRATION_CHAIN_DEFINITION_STANDARD.md`
- `MIGRATION_NAMING_AND_ORDERING_STANDARD.md`
- `D-P2-01_Canonical_Migration_Chain_Definition.md`
- `D-P2-02_Orphan_SQL_Triage_Record.md`
- `D-P2-03_Generated_Schema_Artifact.md`
- `D-P2-03_Orphan_SQL_Disposition_Plan.md`
- `D-P2-04_Generated_Type_Artifacts.md`
- `D-P2-05_Acceptance_Review.md`

### 4.5 04_Phase_3_RPC_Contract

- `PHASE3_ACCEPTANCE_RECORD.md`
- `PHASE3_ACCEPTANCE_REVIEW.md`
- `PHASE3_EXIT_VALIDATION_REPORT.md`
- `PHASE3_FINAL_ACCEPTANCE_REVIEW.md`
- `P3-01_Phase3_Initiation_Assessment.md`
- `D-P3-01_Reconciled_RPC_Contract.md`
- `D-P3-02_Service_Layer_Contract_Consistency_Report.md`
- `D-P3-03_RPC_Coverage_Validation_Evidence.md`
- `D-P3-04_Migration_Updates_Required_for_Contract_Gaps.md`

### 4.6 05_Phase_4_Validation_Layer

- `PHASE4_ACCEPTANCE_RECORD.md`
- `PHASE4_AUTHORIZATION_REVIEW.md`
- `PHASE4_CLOSEOUT_REVIEW.md`
- `PHASE4_COMMIT_EXECUTION_REPORT.md`
- `PHASE4_COMMIT_SCOPE_DEFINITION.md`
- `PHASE4_CORRECTIVE_ACTION_REPORT.md`
- `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md`
- `PHASE4_COVERAGE_ROADMAP.md`
- `PHASE4_EXIT_REVIEW.md`
- `PHASE4_FINAL_CERTIFICATION.md`
- `PHASE4_FINAL_COMPLETION_AUDIT.md`
- `PHASE4_FINAL_EXIT_REVIEW.md`
- `PHASE4_FORENSIC_INVESTIGATION_REPORT.md`
- `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md`
- `PHASE4_OBSERVATION_001_VALIDATION.md`
- `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_017.md`
- `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_018.md`
- `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_019.md`
- `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_020.md`
- `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_021.md`
- `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_022.md`
- `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_023.md`
- `PHASE4_PROGRAM_STATUS_AFTER_CURRENT_TASK_025.md`
- `PHASE4_PROGRAM_STATUS_AFTER_M1.md`
- `PHASE4_PROGRAM_STATUS_AFTER_M2.md`
- `PHASE4_PROGRAM_STATUS_AFTER_M3.md`
- `PHASE4_PROGRAM_STATUS_REVIEW.md`
- `PHASE4_REAUTHORIZATION_REVIEW.md`
- `PHASE4_RECOVERY_MAPPING_VALIDATION.md`

### 4.7 06_Phase_5_Documentation_Reconciliation

- `PHASE5_ACCEPTANCE_RECORD.md`
- `PHASE5_CLOSEOUT_EXECUTION_AUTHORIZATION.md`
- `PHASE5_CLOSEOUT_EXECUTION_REPORT.md`
- `PHASE5_CLOSEOUT_EXECUTION_VERIFICATION.md`
- `PHASE5_DOCUMENTATION_CONTRADICTION_INVENTORY.md`
- `PHASE5_EXIT_REVIEW.md`
- `PHASE5_FINAL_CERTIFICATION.md`
- `PHASE5_GOVERNANCE_TRANSITION_IMPLEMENTATION_REPORT.md`
- `PHASE5_INDEPENDENT_COMPLETION_AUDIT.md`
- `PHASE5_OPENING_AUTHORIZATION.md`
- `PHASE5_OUTSTANDING_WORK_DISPOSITION_REVIEW.md`
- `PHASE5_READINESS_AUTHORIZATION.md`
- `PHASE5_READINESS_AUTHORIZATION_RERUN.md`
- `PHASE5_REPOSITORY_RECONCILIATION_REPORT.md`
- `D-P5-01_Reconciled_Documentation_Set.md`
- `D-P5-03_Updated_Program_Logs_and_Reports.md`
- `D-P5-04_Feature_Flag_Configuration_Traceability_Record.md`
- `D_P5_02_ARCHITECTURE_AUTHORITY_ACCEPTANCE.md`

### 4.8 07_Phase_6_Operational_Readiness

- `PHASE6_ACCEPTANCE_RECORD.md`
- `PHASE6_DELIVERABLE_COMPLETENESS_REVIEW.md`
- `PHASE6_EXIT_REVIEW.md`
- `PHASE6_FINAL_CERTIFICATION.md`
- `PHASE6_OPENING_AUTHORIZATION.md`
- `PHASE6_READINESS_AUTHORIZATION.md`
- `D-P6-02_Environment_Parity_Report.md`
- `D-P6-04_Operational_Runbook_Update.md`
- `docs/system-recovery/CURRENT_TASK-037_IMPLEMENTATION_REPORT.md`
- `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md`
- `docs/system-recovery/PHASE6_FINAL_STATUS_REPORT.md`
- `docs/system-recovery/PHASE6_PENDING_CHECKLIST.md`

### 4.9 08_Phase_7_Program_Closure

- `PHASE7_OPENING_AUTHORIZATION.md`
- `PHASE7_GOVERNANCE_CHAIN_DETERMINATION.md`
- `FINAL_EVIDENCE_PACKAGE.md`
- `FINAL_PROGRAM_STATE.md`
- `ARCHITECTURE_AUTHORITY_CERTIFICATION.md`
- `A9_ARCHITECTURE_AUTHORITY_DISPOSITION.md`
- `ARCHITECTURE_DECISION_VERIFICATION_G1.md`

### 4.10 09_Recovery_Waves_and_Domains

- `RECOVERY_DOMAIN_B_IMPLEMENTATION_REPORT.md`
- `RECOVERY_DOMAIN_H1_IMPLEMENTATION_REPORT.md`
- `RECOVERY_DOMAIN_H1_VERIFICATION_REPORT.md`
- `RECOVERY_PACKAGE_01_IMPLEMENTATION_REPORT.md`
- `RECOVERY_PACKAGE_01_VERIFICATION_REPORT.md`
- `RECOVERY_WAVE_02_IMPLEMENTATION_REPORT.md`
- `RECOVERY_WAVE_02_VERIFICATION_REPORT.md`
- `RECOVERY_WAVE_03_IMPLEMENTATION_REPORT.md`
- `RECOVERY_WAVE_03_VERIFICATION_REPORT.md`
- `RECOVERY_WAVE_04_ACCEPTANCE_REVIEW.md`
- `RECOVERY_WAVE_04_ARCHITECTURE_DECISION.md`
- `RECOVERY_WAVE_04_AUTHORIZATION.md`
- `RECOVERY_WAVE_04_ENGINEERING_KICKOFF.md`
- `RECOVERY_WAVE_04_IMPLEMENTATION_REPORT.md`
- `RECOVERY_WAVE_04_VERIFICATION_REPORT.md`
- `RECOVERY_WAVE_05_ACCEPTANCE_REVIEW.md`
- `RECOVERY_WAVE_05_ARCHITECTURE_DECISION.md`
- `RECOVERY_WAVE_05_AUTHORIZATION.md`
- `RECOVERY_WAVE_05_ENGINEERING_KICKOFF.md`
- `RECOVERY_WAVE_05_IMPLEMENTATION_REPORT.md`
- `RECOVERY_WAVE_05_VERIFICATION_REPORT.md`

### 4.11 10_Audit_Forensic_and_Strategic_Reports

- `AUDIT_REPORT.md`
- `GIT_FORENSIC_INVESTIGATION_REPORT.md`
- `REPOSITORY_STATE_VERIFICATION.md`
- `SCAR_PHASE1_REPORT.md`
- `SCAR_PHASE2_REPORT.md`
- `SCAR_PHASE3_REPORT.md`
- `SCAR_PHASE4_REPORT.md`
- `STRATEGIC_DECISION_REPORT.md`
- `STRATEGIC_RECOVERY_ANALYSIS.md`

### 4.12 11_Architecture_and_Certification

- `A9_ARCHITECTURE_AUTHORITY_DISPOSITION.md`
- `ARCHITECTURE_AUTHORITY_CERTIFICATION.md`
- `ARCHITECTURE_DECISION_VERIFICATION_G1.md`
- `D_P5_02_ARCHITECTURE_AUTHORITY_ACCEPTANCE.md`

### 4.13 12_Current_Task_Governance

- `CURRENT_TASK.md`
- `CURRENT_TASK-006_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-006_SUBSCRIPTION_CANONICAL_CONTRACT_DECISION.md`
- `CURRENT_TASK-007_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-008_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-008_STORAGE_USAGE_CANONICAL_CONTRACT_DECISION.md`
- `CURRENT_TASK-009_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-009_USAGE_SUMMARY_CANONICAL_BOUNDARY_DECISION.md`
- `CURRENT_TASK-010_ALIAS_CANONICAL_BOUNDARY_DECISION.md`
- `CURRENT_TASK-010_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-011_FACADE_BARREL_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-011_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-012_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-012_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-012_KICKOFF_PLAN.md`
- `CURRENT_TASK-013_ACCEPTANCE_RECORD.md`
- `CURRENT_TASK-013_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-013_TEST_MOCK_CANONICAL_VALIDATION_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-014_ACCEPTANCE_RECORD.md`
- `CURRENT_TASK-014_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-014_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-015_ACCEPTANCE_RECORD.md`
- `CURRENT_TASK-015_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-015_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-016_ACCEPTANCE_RECORD.md`
- `CURRENT_TASK-016_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-016_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-017_ACCEPTANCE_RECORD.md`
- `CURRENT_TASK-017_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-017_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-017_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-018_ACCEPTANCE_RECORD.md`
- `CURRENT_TASK-018_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-018_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-018_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-019_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-019_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-019_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-020_ACCEPTANCE_RECORD.md`
- `CURRENT_TASK-020_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-020_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-020_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-021_ACCEPTANCE_RECORD.md`
- `CURRENT_TASK-021_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-021_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-021_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-022_ACCEPTANCE_REMEDIATION_REPORT.md`
- `CURRENT_TASK-022_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-022_ACCEPTANCE_REVIEW_v2.md`
- `CURRENT_TASK-022_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-022_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-022_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-023_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-023_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-023_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-023_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-023_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-024_ACCEPTANCE_REMEDIATION.md`
- `CURRENT_TASK-024_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-024_ACCEPTANCE_REVIEW_V2.md`
- `CURRENT_TASK-024_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-024_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-024_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-024_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-025_ACCEPTANCE_REMEDIATION.md`
- `CURRENT_TASK-025_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-025_ACCEPTANCE_REVIEW_V2.md`
- `CURRENT_TASK-025_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-025_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-025_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-025_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-026_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-026_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-026_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-026_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-026_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-026_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-027_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-027_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-027_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-027_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-027_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-027_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-028_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-028_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-028_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-028_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-028_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-028_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-029_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-029_ARCHITECTURE_DECISION.md`
- `CURRENT_TASK-029_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-029_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-029_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-029_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-030_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-030_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-030_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-030_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-031_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-031_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-031_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-031_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-031_RECONCILIATION_NOTE.md`
- `CURRENT_TASK-031_RPC_CROSSCHECK_REPORT.md`
- `CURRENT_TASK-032_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-032_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-032_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-032_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-032_PROGRAM_MANAGER_FORMAL_ACCEPTANCE.md`
- `CURRENT_TASK-032_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-033_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-033_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-033_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-033_PROGRAM_MANAGER_FORMAL_ACCEPTANCE.md`
- `CURRENT_TASK-033_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-034_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-034_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-034_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-034_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-034_REPOSITORY_OBSERVATION_RESOLUTION.md`
- `CURRENT_TASK-034_VERIFICATION.md`
- `CURRENT_TASK-035_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-035_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-035_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-035_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-035_VERIFICATION.md`
- `CURRENT_TASK-036_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-036_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-036_GATE_REEXECUTION_REPORT.md`
- `CURRENT_TASK-036_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-036_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-036_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-036_VERIFICATION_REPORT.md`
- `CURRENT_TASK-038_ACCEPTANCE_REVIEW.md`
- `CURRENT_TASK-038_ENGINEERING_KICKOFF.md`
- `CURRENT_TASK-038_IMPLEMENTATION_REPORT.md`
- `CURRENT_TASK-038_PROGRAM_AUTHORIZATION.md`
- `CURRENT_TASK-038_PROGRAM_STATUS_REVIEW.md`
- `CURRENT_TASK-038_VERIFICATION_REPORT.md`

### 4.14 13_Deployment_Readiness

- `D-034-01_Deployment_Validation_Gate_Definition.md`
- `D-034-02_Deployment_Validation_Evidence_Checklist.md`
- `D-035-01_Deployment_Readiness_Evidence.md`

### 4.15 14_Manifest_and_Metadata (to be created during migration)

- `ARCHIVE_MANIFEST.md` — generated mapping of old path to new archive path.
- `README_ARCHIVE_INDEX.md` — human-readable index of the archive.

---

## 5. Documents that MUST Remain Outside the Archive

The following categories contain active source, configuration, operational documentation, or non-Recovery-Program planning. They are **not** to be moved.

### 5.1 Project Standard Files

- `README.md`
- `LICENSE.md`
- `SECURITY.md`
- `NOTICE.md`
- `runbook.md`
- `TODO.md`
- `instructions.md`

### 5.2 Active Product and Operational Guides

- `DEPLOYMENT_SYSTEM_ADMIN_FEATURE.md`
- `GITHUB_DESKTOP_DEPLOYMENT_GUIDE.md`
- `GUIDE_CREATE_NEW_SHOP.md`
- `PLAN_CREATE_SYSTEM_ADMIN.md`
- `SYSTEM_ADMIN_FEATURE_COMPLETION_SUMMARY.md`
- `SKILLS_PROMPT_CHEATSHEET.md`
- `FIX_PLAN_USER_MANAGEMENT_SECURITY.md`

### 5.3 Application Source, Configuration, and Dependencies

All files under:

- `components/`
- `contexts/`
- `hooks/`
- `lib/`
- `pages/`
- `public/`
- `services/`
- `styles/`
- `supabase/`
- `tests/`
- `types/`
- `utils/`
- `skills/`
- `dist/`
- `node_modules/`
- `backups/`
- `workspace/`
- `memory-zone/`
- `prompts/`
- `scripts/`

Plus root source and configuration files such as `App.tsx`, `index.tsx`, `types.ts`, `constants.ts`, `features.ts`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `vercel.json`, `workflow.yml`, `project.yml`, `.env`, `.env.example`, `.env.staging`, `index.html`, `index.css`, `design-system-tokens.css`, `.gitignore`, `_redirects`, and log/temp files.

### 5.4 AI Agent Tooling and Active Plans

All files under:

- `.agents/`
- `.codebase-memory/`
- `.devin/`
- `.github/`
- `.hermes/`
- `.orchestrator/`
- `.plan-executor/`
- `.skills/`
- `.temp/`
- `.vercel/`
- `.windsurf/`

### 5.5 Non-Recovery Implementation Plans and Code

- `Plan/EdgeFunction/` — edge function implementation source
- `Plan/Migration/` — SQL migration staging files
- `Plan/Log/SP-*` — session planning logs
- `Plan/PLAN_AdminDashboard_Implementation_Phases.md`
- `Plan/PLAN_AdminDashboard_OpenSource_Reference.md`
- `Plan-Fix-Bug/` — bug-fix implementation master plan and supporting documents
- `docs/admin-dashboard/` — active admin dashboard operational runbooks and plans
- `reports/admin_dashboard_user_management_audit.md`
- The existing `archive/Plan/PLAN_AdminDashboard_SubPhases.md` and `archive/docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md`

---

## 6. Repository Impact Assessment

| Area | Impact |
|------|--------|
| **Root cleanliness** | High positive impact. Removing ~200 governance markdown files will leave the root focused on the active product. |
| **Git history** | Preserved because all moves will use `git mv`. |
| **Code / SQL / migrations / tests** | None. No application source is touched. |
| **CI / build** | None. No build configuration or package files are affected. |
| **Internal markdown links** | Relative links between archived documents will become invalid after the move. This is acceptable for preservation; a reference-remediation pass is out of scope unless separately approved. |
| **Existing `archive/` contents** | None. The two pre-existing documents remain in place. |

---

## 7. Migration Plan

1. **Approval gate.** The Program Sponsor / Repository Governance Authority reviews and approves this plan.
2. **Verify clean working tree.** Confirm `git status` shows no uncommitted changes.
3. **Create directories.** Create `archive/System Recovery Program/` and all subdirectories listed in Section 3.
4. **Generate manifest.** Produce `ARCHIVE_MANIFEST.md` mapping every current source path to its destination path.
5. **Move files with `git mv`.** Move every file listed in Section 4 into its designated archive folder.
6. **Move `docs/system-recovery/` files.** Move the four files from `docs/system-recovery/` into `07_Phase_6_Operational_Readiness/` and `12_Current_Task_Governance/` as indicated.
7. **Create index.** Add `README_ARCHIVE_INDEX.md` to `14_Manifest_and_Metadata/`.
8. **Verify.** Run `git status` and `git ls-files` to ensure all intended moves are tracked and no active files were moved.
9. **Commit.** Commit the archive as a single changeset with a descriptive message.
10. **Optional final step.** After the archive is committed and verified, this plan document itself may be moved into `archive/System Recovery Program/14_Manifest_and_Metadata/` in a follow-up commit if a fully clean root is required.

---

## 8. Rollback Strategy

If the archive migration must be undone:

1. **If not yet pushed:** `git reset --hard` to the commit before the archive commit. The archive commit is then discarded.
2. **If already pushed:** `git revert` the archive commit. This restores the original root layout while preserving full history.
3. **Because `git mv` is used,** history is retained for every file, so any single file can also be restored to its original path with `git mv` if needed.

---

## 9. Archive Readiness Decision

| Criterion | State |
|-------------|-------|
| Recovery Program formally closed | `FINAL_PROGRAM_STATE.md` issued |
| All recovery artifacts identified | Yes — inventory in Section 4 |
| Active development documents excluded | Yes — listed in Section 5 |
| No code, SQL, migration, test, or source changes required | Confirmed |
| Archive structure designed | Yes — Section 3 |
| Migration and rollback procedures defined | Yes — Sections 7 and 8 |

**Decision:** **READY — pending approval.** No archive operation has been performed.

---

## 10. Final Recommendation

Approve this plan and execute the archive migration as a single `git mv` commit. The proposed structure isolates all System Recovery Program evidence, preserves git history, and returns the repository root to active product development without touching any code, SQL, migrations, or tests. After execution, normal product development governance will be the sole authority over the active repository.
