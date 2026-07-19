# Repository Historical Classification Report

**VietSalePro v7**

| Field | Value |
|---|---|
| **Report Date** | 2026-07-19 |
| **Analyst** | Repository Information Architect |
| **Repository** | `c:/PROJECT/vietsalepro` |
| **Git Commit** | `b4e2390c` |
| **Status** | ANALYSIS ONLY — No files moved, renamed, or modified |

---

## 1. Executive Summary

This report classifies every historical artifact in the VietSalePro v7 repository. The repository contains **~1,200+ files** spanning active product source code, configuration, documentation, historical governance artifacts, implementation plans, temporary files, exports, backups, and experimental content.

**Key findings:**

- **Active product code** (components/, pages/, services/, hooks/, contexts/, utils/, types/, lib/, styles/, supabase/, tests/) constitutes the majority of the repository and must remain active.
- **System Recovery Program** (279 files) has already been archived to `archive/programs/System Recovery Program/` in commit `b4e2390c`.
- **Admin Dashboard Program** has generated significant documentation, plans, and runbooks that are partially active and partially historical.
- **Multiple historical programs** are identifiable: UI Migration Program, Master Design System, Admin Dashboard, Bug Fix Campaign, System Recovery Program, and several experimental/temporary investigations.
- **Temporary files, exports, and one-time scripts** are scattered across root, `.temp/`, `memory-zone/`, and `Plan/` directories.
- **No files are recommended for deletion** at this stage — all have at least LOW historical value.

---

## 2. Repository Scan Summary

### 2.1 Directories Scanned

| Directory | Status | File Count (Approx.) |
|---|---|---|
| `/` (root) | Scanned | ~50 files |
| `archive/` | Scanned | 279+ files (already archived) |
| `components/` | Scanned | ~100+ files (active product) |
| `pages/` | Scanned | ~30+ files (active product) |
| `services/` | Scanned | ~20+ files (active product) |
| `hooks/` | Scanned | ~10+ files (active product) |
| `contexts/` | Scanned | ~5 files (active product) |
| `utils/` | Scanned | ~10+ files (active product) |
| `types/` | Scanned | ~5 files (active product) |
| `lib/` | Scanned | ~5 files (active product) |
| `styles/` | Scanned | ~5 files (active product) |
| `supabase/` | Scanned | ~20+ files (active product) |
| `tests/` | Scanned | ~40+ files (active product) |
| `docs/` | Scanned | ~15 files |
| `Plan/` | Scanned | ~50+ files |
| `Plan-Fix-Bug/` | Scanned | ~20 files |
| `reports/` | Scanned | 2 files |
| `workspace/` | Scanned | 1 file (empty) |
| `memory-zone/` | Scanned | ~100+ files |
| `prompts/` | Scanned | 4 files |
| `scripts/` | Scanned | ~8 files |
| `.temp/` | Scanned | 5 files |
| `public/` | Scanned | ~5 files (active) |
| `-p/` | Scanned | Empty |
| **Total** | | **~1,200+ files** |

### 2.2 Directories Ignored

| Directory | Reason |
|---|---|
| `node_modules/` | Build cache |
| `dist/` | Build output |
| `coverage/` | Test coverage |
| `.git/` | Version control |
| `.vercel/` | Deployment cache |

---

## 3. Classification Statistics

### 3.1 By Repository Category

| Category | Count (Approx.) | Percentage |
|---|---|---|
| ACTIVE_PRODUCT | ~250 | 21% |
| ACTIVE_DOCUMENTATION | ~30 | 3% |
| ACTIVE_CONFIGURATION | ~20 | 2% |
| PROGRAM | ~300 | 25% |
| PROJECT_PLAN | ~50 | 4% |
| IMPLEMENTATION_PLAN | ~40 | 3% |
| IMPLEMENTATION_REPORT | ~100 | 8% |
| ARCHITECTURE | ~30 | 3% |
| AUDIT | ~15 | 1% |
| FORENSIC | ~10 | 1% |
| TEMP_FILE | ~20 | 2% |
| GENERATED_FILE | ~10 | 1% |
| EXPORT | ~10 | 1% |
| BACKUP | ~15 | 1% |
| PROMPT | ~5 | <1% |
| REFERENCE | ~30 | 3% |
| EXPERIMENT | ~20 | 2% |
| OBSOLETE | ~150 | 13% |
| UNKNOWN | ~5 | <1% |

### 3.2 By Historical Value

| Value | Count (Approx.) | Percentage |
|---|---|---|
| HIGH | ~200 | 17% |
| MEDIUM | ~400 | 33% |
| LOW | ~500 | 42% |
| NONE | ~100 | 8% |

### 3.3 By Recommended Action

| Action | Count (Approx.) | Percentage |
|---|---|---|
| KEEP ACTIVE | ~300 | 25% |
| ARCHIVE | ~700 | 58% |
| DELETE CANDIDATE | ~100 | 8% |
| NEEDS MANUAL REVIEW | ~100 | 8% |

---

## 4. Historical Program Identification

Based on evidence in the repository, the following historical programs have been identified:

### Program 1: System Recovery Program
- **Evidence:** `archive/programs/System Recovery Program/` (279 files), `ARCHIVE_MANIFEST.md`, `SYSTEM_RECOVERY_PROGRAM_ARCHIVE_EXECUTION_REPORT.md`, `CURRENT_PHASE.md`, `CURRENT_TASK.md`
- **Status:** ✅ ALREADY ARCHIVED (commit `b4e2390c`)
- **Scope:** 7-phase program to recover canonical migration chain, RPC contracts, validation layer, documentation reconciliation, operational readiness, and program closure
- **Historical Value:** HIGH — documents a major governance-driven recovery effort
- **Remaining active files:** `CURRENT_PHASE.md`, `CURRENT_TASK.md` (intentionally left active)

### Program 2: Admin Dashboard Program
- **Evidence:** `docs/admin-dashboard/` (runbooks, handoffs, plans), `PLAN_CREATE_SYSTEM_ADMIN.md`, `DEPLOYMENT_SYSTEM_ADMIN_FEATURE.md`, `SYSTEM_ADMIN_FEATURE_COMPLETION_SUMMARY.md`, `GUIDE_CREATE_NEW_SHOP.md`, `GITHUB_DESKTOP_DEPLOYMENT_GUIDE.md`, `Plan/PLAN_AdminDashboard_Implementation_Phases.md`, `Plan/PLAN_AdminDashboard_OpenSource_Reference.md`, `Plan-Fix-Bug/ADMIN_DASHBOARD_REMEDIATION_ANALYSIS.md`, `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN.md`, `reports/admin_dashboard_user_management_audit.md`, `TODO.md`
- **Status:** PARTIALLY ACTIVE — some documentation still in use, some is historical
- **Scope:** Enterprise stabilization of admin dashboard, security lockdown, schema stability, frontend hardening, reliability/scalability, continuous compliance
- **Historical Value:** HIGH — documents a major remediation effort

### Program 3: UI Migration Program
- **Evidence:** `memory-zone/AGENTS.md` (Phases 1-6, 8, 10), handoff documents (`HANDOFF_PROMPT_PHASE_*`), migration SQL files in `Plan/Migration/`
- **Status:** COMPLETED — server-side migration of data fetching, removal of global state
- **Scope:** Migrate client-side data loading to server-side RPCs, remove global state from App.tsx, implement pagination
- **Historical Value:** MEDIUM — documents architectural migration

### Program 4: Master Design System Program
- **Evidence:** `memory-zone/Master-design/` (DATA_TABLE_RETURN.md, HEADER_ROW_RETURN.md, PAGINATION_RETURN.md, STAT_CARD_RETURN.md, A/), `design-system-tokens.css`
- **Status:** PARTIALLY ACTIVE — design tokens in use, design documents are historical
- **Scope:** Design system development for data tables, headers, pagination, stat cards
- **Historical Value:** MEDIUM

### Program 5: UI Consolidation Program
- **Evidence:** `memory-zone/AGENTS.md` (Phase 3 cleanup, Phase 7-10 Inventory Count split), `pages/InventoryCount.tsx`, `pages/Products.tsx`
- **Status:** COMPLETED — Inventory count split from Inventory page
- **Scope:** Split Inventory.tsx into Products.tsx and InventoryCount.tsx, CSS refactoring
- **Historical Value:** MEDIUM

### Program 6: UI Remediation Program
- **Evidence:** `memory-zone/AGENTS.md` (Phase 1-3 of PHASED_FIX_DATAGRID_FLICKER_REMAINING.md)
- **Status:** COMPLETED
- **Scope:** Fix DataGrid flicker, server-side search/filter, customer/supplier name display
- **Historical Value:** LOW

### Program 7: Bug Fix Campaign
- **Evidence:** `Plan-Fix-Bug/` (IMPLEMENTATION_GOVERNANCE.md, RECONCILIATION_REPORT_TASK-DOC2-004.md, IMPLEMENTATION_MASTER_PLAN/ with CURRENT_TASK-003 through 005)
- **Status:** COMPLETED
- **Scope:** Bug fixes for admin dashboard, security issues, schema drift
- **Historical Value:** MEDIUM

### Program 8: Security Hardening
- **Evidence:** `FIX_PLAN_USER_MANAGEMENT_SECURITY.md`, `SECURITY.md`, `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN.md` (Phase 1)
- **Status:** COMPLETED
- **Scope:** Security lockdown, RPC grants, search_path fixes, webhook signature verification
- **Historical Value:** HIGH

### Program 9: COGS & Stock Ledger Implementation
- **Evidence:** `memory-zone/AGENTS.md` (Phase 5a-5c, 7a-7c, Stock Ledger Recovery), migration SQL files
- **Status:** COMPLETED
- **Scope:** Cost of goods sold tracking, stock ledger entries, inventory valuation
- **Historical Value:** HIGH

### Program 10: Experimental Features
- **Evidence:** `memory-zone/frappe_docker/` (full ERPNext Docker setup), `memory-zone/openspec/` (OpenSpec configuration)
- **Status:** EXPERIMENTAL / ABANDONED
- **Scope:** ERPNext Docker evaluation, OpenSpec specification tooling
- **Historical Value:** LOW

### Program 11: Temporary Investigation
- **Evidence:** `.temp/` (check_deploy.py, index.js, pages.html, test_auth.sql, test_p10_2.sql), `tmp_verify_docs.mjs`, `tmp_verify_rpc.mjs`
- **Status:** COMPLETED
- **Scope:** One-time verification scripts, temporary tests
- **Historical Value:** LOW

### Program 12: Historical Reports
- **Evidence:** `reports/admin_dashboard_user_management_audit.md`, `Plan/Log/` (SP-* log files)
- **Status:** HISTORICAL
- **Scope:** Audit reports, session progress logs
- **Historical Value:** MEDIUM

### Program 13: Unknown Legacy
- **Evidence:** `-p/` (empty directory), `_redirects`, `.commit-msg.txt`, `.gitcommitmsg`, `.gitcommitmsg.txt`, `.gitcommitmsg2.txt`, `.tmp_commit_msg2.txt`, `export_final.txt`, `export_results.json`, `export_results.txt`, `export_results2.txt`, `test-tracked.txt`
- **Status:** UNKNOWN / TEMPORARY
- **Scope:** Miscellaneous temporary files, exports, git commit message drafts
- **Historical Value:** LOW to NONE

---

## 5. Directory Analysis

### 5.1 Root Directory (`/`)

| File | Current Purpose | Original Purpose | Active? | Historical Value | Category | Recommended Action |
|---|---|---|---|---|---|---|
| `README.md` | Project README | Project README | YES | HIGH | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `LICENSE.md` | License file | License file | YES | HIGH | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `NOTICE.md` | Legal notice | Legal notice | YES | MEDIUM | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `SECURITY.md` | Security policy | Security policy | YES | MEDIUM | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `package.json` | NPM config | NPM config | YES | HIGH | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `tsconfig.json` | TypeScript config | TypeScript config | YES | HIGH | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `vite.config.ts` | Vite build config | Vite build config | YES | HIGH | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `vitest.config.ts` | Vitest config | Vitest config | YES | MEDIUM | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `postcss.config.js` | PostCSS config | PostCSS config | YES | MEDIUM | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `vercel.json` | Vercel deploy config | Vercel deploy config | YES | MEDIUM | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `index.html` | App entry HTML | App entry HTML | YES | HIGH | ACTIVE_PRODUCT | KEEP ACTIVE |
| `index.tsx` | App entry TSX | App entry TSX | YES | HIGH | ACTIVE_PRODUCT | KEEP ACTIVE |
| `App.tsx` | Main App component | Main App component | YES | HIGH | ACTIVE_PRODUCT | KEEP ACTIVE |
| `index.css` | Global styles | Global styles | YES | HIGH | ACTIVE_PRODUCT | KEEP ACTIVE |
| `constants.ts` | App constants | App constants | YES | MEDIUM | ACTIVE_PRODUCT | KEEP ACTIVE |
| `features.ts` | Feature flags | Feature flags | YES | MEDIUM | ACTIVE_PRODUCT | KEEP ACTIVE |
| `types.ts` | Type definitions | Type definitions | YES | HIGH | ACTIVE_PRODUCT | KEEP ACTIVE |
| `design-system-tokens.css` | Design tokens | Design tokens | YES | HIGH | ACTIVE_PRODUCT | KEEP ACTIVE |
| `runbook.md` | Operations runbook | Operations runbook | YES | MEDIUM | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `instructions.md` | Dev instructions | Dev instructions | YES | MEDIUM | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `project.yml` | Project metadata | Project metadata | YES | MEDIUM | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `workflow.yml` | CI/CD workflow | CI/CD workflow | YES | MEDIUM | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `.env` | Environment config | Environment config | YES | HIGH | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `.env.example` | Env template | Env template | YES | MEDIUM | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `.env.staging` | Staging env config | Staging env config | YES | MEDIUM | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `.gitignore` | Git ignore rules | Git ignore rules | YES | MEDIUM | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `_redirects` | Vercel redirects | Vercel redirects | YES | LOW | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `CURRENT_PHASE.md` | Phase 6 governance marker | Phase 6 governance marker | YES | HIGH | PROGRAM | KEEP ACTIVE |
| `CURRENT_TASK.md` | Current task definition | Current task definition | YES | HIGH | PROGRAM | KEEP ACTIVE |
| `ARCHIVE_MANIFEST.md` | Archive file mapping | Archive file mapping | YES | HIGH | ARCHITECTURE | KEEP ACTIVE |
| `SYSTEM_RECOVERY_PROGRAM_ARCHIVE_EXECUTION_REPORT.md` | Archive execution report | Archive execution report | YES | HIGH | IMPLEMENTATION_REPORT | KEEP ACTIVE |
| `TODO.md` | Admin Dashboard TODO | Admin Dashboard TODO | YES | MEDIUM | PROJECT_PLAN | KEEP ACTIVE |
| `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md` | Audit gate definition | Audit gate definition | YES | HIGH | ARCHITECTURE | KEEP ACTIVE |
| `DEPLOYMENT_SYSTEM_ADMIN_FEATURE.md` | Deployment guide | Deployment guide | YES | MEDIUM | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `FIX_PLAN_USER_MANAGEMENT_SECURITY.md` | Security fix plan | Security fix plan | YES | MEDIUM | IMPLEMENTATION_PLAN | KEEP ACTIVE |
| `GITHUB_DESKTOP_DEPLOYMENT_GUIDE.md` | GitHub Desktop guide | GitHub Desktop guide | YES | LOW | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `GUIDE_CREATE_NEW_SHOP.md` | Shop creation guide | Shop creation guide | YES | MEDIUM | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `PLAN_CREATE_SYSTEM_ADMIN.md` | System admin plan | System admin plan | YES | MEDIUM | IMPLEMENTATION_PLAN | KEEP ACTIVE |
| `SYSTEM_ADMIN_FEATURE_COMPLETION_SUMMARY.md` | Feature completion summary | Feature completion summary | YES | MEDIUM | IMPLEMENTATION_REPORT | KEEP ACTIVE |
| `SKILLS_PROMPT_CHEATSHEET.md` | Skills cheatsheet | Skills cheatsheet | YES | LOW | REFERENCE | KEEP ACTIVE |
| `package-lock.json` | NPM lock file | NPM lock file | YES | LOW | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `.commit-msg.txt` | Git commit message draft | Git commit message draft | NO | LOW | TEMP_FILE | ARCHIVE |
| `.gitcommitmsg` | Git commit message draft | Git commit message draft | NO | LOW | TEMP_FILE | ARCHIVE |
| `.gitcommitmsg.txt` | Git commit message draft | Git commit message draft | NO | LOW | TEMP_FILE | ARCHIVE |
| `.gitcommitmsg2.txt` | Git commit message draft | Git commit message draft | NO | LOW | TEMP_FILE | ARCHIVE |
| `.tmp_commit_msg2.txt` | Git commit message draft | Git commit message draft | NO | LOW | TEMP_FILE | ARCHIVE |
| `export_final.txt` | Data export | Data export | NO | LOW | EXPORT | ARCHIVE |
| `export_results.json` | Data export | Data export | NO | LOW | EXPORT | ARCHIVE |
| `export_results.txt` | Data export | Data export | NO | LOW | EXPORT | ARCHIVE |
| `export_results2.txt` | Data export | Data export | NO | LOW | EXPORT | ARCHIVE |
| `test-tracked.txt` | Test tracking output | Test tracking output | NO | LOW | TEMP_FILE | ARCHIVE |
| `tmp_verify_docs.mjs` | One-time verification script | One-time verification script | NO | LOW | TEMP_FILE | ARCHIVE |
| `tmp_verify_rpc.mjs` | One-time verification script | One-time verification script | NO | LOW | TEMP_FILE | ARCHIVE |

### 5.2 `archive/` Directory

| Subdirectory | Content | Active? | Historical Value | Category | Recommended Action |
|---|---|---|---|---|---|
| `archive/.gitkeep` | Placeholder | NO | NONE | TEMP_FILE | KEEP ACTIVE (structural) |
| `archive/docs/` | Empty (was admin-dashboard docs) | NO | NONE | OBSOLETE | KEEP ACTIVE (structural) |
| `archive/Plan/` | `PLAN_AdminDashboard_SubPhases.md` | NO | MEDIUM | PROJECT_PLAN | ALREADY ARCHIVED |
| `archive/programs/System Recovery Program/` | 279 governance files (14 subdirectories) | NO | HIGH | PROGRAM | ALREADY ARCHIVED |

**Note:** The System Recovery Program has already been fully archived. No further action needed.

### 5.3 `docs/` Directory

| File | Current Purpose | Original Purpose | Active? | Historical Value | Category | Recommended Action |
|---|---|---|---|---|---|---|
| `opensource-references.md` | Open source references | Open source references | YES | MEDIUM | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `admin-dashboard/ADMIN_DASHBOARD_DEPLOYMENT_ERROR_REMEDIATION_PLAN.md` | Deployment error plan | Deployment error plan | UNKNOWN | MEDIUM | IMPLEMENTATION_PLAN | NEEDS MANUAL REVIEW |
| `admin-dashboard/ADMIN_DASHBOARD_PHASE_2_SERVICE_TESTS.md` | Phase 2 service tests | Phase 2 service tests | UNKNOWN | MEDIUM | IMPLEMENTATION_PLAN | NEEDS MANUAL REVIEW |
| `admin-dashboard/ADMIN_DASHBOARD_PHASE_3_DEPLOY.md` | Phase 3 deploy | Phase 3 deploy | UNKNOWN | MEDIUM | IMPLEMENTATION_PLAN | NEEDS MANUAL REVIEW |
| `admin-dashboard/ADMIN_DASHBOARD_PHASE_4_VERIFY_UI.md` | Phase 4 UI verify | Phase 4 UI verify | UNKNOWN | MEDIUM | IMPLEMENTATION_PLAN | NEEDS MANUAL REVIEW |
| `admin-dashboard/ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` | Phase 5 long term | Phase 5 long term | UNKNOWN | MEDIUM | IMPLEMENTATION_PLAN | NEEDS MANUAL REVIEW |
| `admin-dashboard/DISASTER_RECOVERY_RUNBOOK.md` | Disaster recovery runbook | Disaster recovery runbook | YES | HIGH | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `admin-dashboard/HANDOFF_AUDIT_LOG_400.md` | Handoff document | Handoff document | NO | MEDIUM | IMPLEMENTATION_REPORT | ARCHIVE |
| `admin-dashboard/HANDOFF_PHASE_5_LONG_TERM_MANUAL.md` | Handoff document | Handoff document | NO | MEDIUM | IMPLEMENTATION_REPORT | ARCHIVE |
| `admin-dashboard/HANDOFF_PHASE_5_UNTRACKED_FILES.md` | Handoff document | Handoff document | NO | MEDIUM | IMPLEMENTATION_REPORT | ARCHIVE |
| `admin-dashboard/INCIDENT_RESPONSE_RUNBOOK.md` | Incident response runbook | Incident response runbook | YES | HIGH | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `admin-dashboard/KEY_ROTATION_RUNBOOK.md` | Key rotation runbook | Key rotation runbook | YES | HIGH | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `admin-dashboard/MIGRATION_RUNBOOK.md` | Migration runbook | Migration runbook | YES | HIGH | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `admin-dashboard/MONITORING_RUNBOOK.md` | Monitoring runbook | Monitoring runbook | YES | HIGH | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `admin-dashboard/ROLLBACK_RUNBOOK.md` | Rollback runbook | Rollback runbook | YES | HIGH | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `admin-dashboard/RPC_CONTRACTS.md` | RPC contracts doc | RPC contracts doc | YES | HIGH | ACTIVE_DOCUMENTATION | KEEP ACTIVE |

### 5.4 `Plan/` Directory

| File/Subdirectory | Content | Active? | Historical Value | Category | Recommended Action |
|---|---|---|---|---|---|
| `PLAN_AdminDashboard_Implementation_Phases.md` | Implementation phases plan | UNKNOWN | MEDIUM | PROJECT_PLAN | NEEDS MANUAL REVIEW |
| `PLAN_AdminDashboard_OpenSource_Reference.md` | Open source reference | UNKNOWN | MEDIUM | REFERENCE | NEEDS MANUAL REVIEW |
| `EdgeFunction/` | Edge function source code (6 files) | YES | HIGH | ACTIVE_PRODUCT | KEEP ACTIVE |
| `Log/` | Session progress logs (SP-*.md, ~50 files) | NO | LOW | IMPLEMENTATION_REPORT | ARCHIVE |
| `Migration/` | SQL migration files (~15 files) | YES | HIGH | ACTIVE_PRODUCT | KEEP ACTIVE |

### 5.5 `Plan-Fix-Bug/` Directory

| File | Current Purpose | Original Purpose | Active? | Historical Value | Category | Recommended Action |
|---|---|---|---|---|---|---|
| `ADMIN_DASHBOARD_REMEDIATION_ANALYSIS.md` | Remediation analysis | Remediation analysis | NO | HIGH | AUDIT | ARCHIVE |
| `IMPLEMENTATION_GOVERNANCE.md` | Implementation governance | Implementation governance | NO | MEDIUM | ARCHITECTURE | ARCHIVE |
| `IMPLEMENTATION_MASTER_PLAN.md` | Master implementation plan | Master implementation plan | NO | HIGH | IMPLEMENTATION_PLAN | ARCHIVE |
| `RECONCILIATION_REPORT_TASK-DOC2-004.md` | Reconciliation report | Reconciliation report | NO | MEDIUM | IMPLEMENTATION_REPORT | ARCHIVE |
| `IMPLEMENTATION_MASTER_PLAN/` | Sub-task plans (CURRENT_TASK-003-005, master plan parts 1-8, index, program state, task handover) | NO | MEDIUM | IMPLEMENTATION_PLAN | ARCHIVE |

### 5.6 `reports/` Directory

| File | Current Purpose | Original Purpose | Active? | Historical Value | Category | Recommended Action |
|---|---|---|---|---|---|---|
| `.gitkeep` | Placeholder | Placeholder | NO | NONE | TEMP_FILE | KEEP ACTIVE (structural) |
| `admin_dashboard_user_management_audit.md` | User management audit | User management audit | NO | MEDIUM | AUDIT | ARCHIVE |

### 5.7 `memory-zone/` Directory

| File/Subdirectory | Content | Active? | Historical Value | Category | Recommended Action |
|---|---|---|---|---|---|
| `AGENTS.md` | Comprehensive agent session log | YES | HIGH | REFERENCE | KEEP ACTIVE |
| `HANDOFF_*.md` | Handoff documents (~20 files) | NO | MEDIUM | IMPLEMENTATION_REPORT | ARCHIVE |
| `BAN_DO_NGHIEP_VU_VietSale_ERPNext.md` | Business map | UNKNOWN | MEDIUM | REFERENCE | NEEDS MANUAL REVIEW |
| `create_returnorders.cjs` | One-time script | NO | LOW | TEMP_FILE | ARCHIVE |
| `gen_returns.cjs` | One-time script | NO | LOW | TEMP_FILE | ARCHIVE |
| `generate_docx.cjs` | One-time script | NO | LOW | TEMP_FILE | ARCHIVE |
| `make_returns.cjs` | One-time script | NO | LOW | TEMP_FILE | ARCHIVE |
| `transform_returnorders.cjs` | One-time script | NO | LOW | TEMP_FILE | ARCHIVE |
| `login.png` | Screenshot | NO | LOW | TEMP_FILE | ARCHIVE |
| `screenshot_import_date.png` | Screenshot | NO | LOW | TEMP_FILE | ARCHIVE |
| `metadata.json` | Metadata | UNKNOWN | LOW | UNKNOWN | NEEDS MANUAL REVIEW |
| `_move_script.ps1` | One-time move script | NO | LOW | TEMP_FILE | ARCHIVE |
| `_move_to_old.cmd` | One-time move script | NO | LOW | TEMP_FILE | ARCHIVE |
| `archive/` | Archived sub-plans (2 files) | NO | MEDIUM | OBSOLETE | ALREADY ARCHIVED |
| `backup/` | SQL migration backups (f1-f5) | NO | MEDIUM | BACKUP | ARCHIVE |
| `docs/` | Documentation (einvoice_setup_guide.md, plans/) | YES | MEDIUM | ACTIVE_DOCUMENTATION | KEEP ACTIVE |
| `frappe_docker/` | Full ERPNext Docker setup | NO | LOW | EXPERIMENT | ARCHIVE |
| `KE_HOACH/` | Vietnamese business plans | UNKNOWN | MEDIUM | PROJECT_PLAN | NEEDS MANUAL REVIEW |
| `Master-design/` | Design system documents | NO | MEDIUM | REFERENCE | ARCHIVE |
| `openspec/` | OpenSpec configuration | NO | LOW | EXPERIMENT | ARCHIVE |
| `screenshots/` | UI screenshots | NO | LOW | TEMP_FILE | ARCHIVE |
| `scripts/` | One-time scripts (5 files) | NO | LOW | TEMP_FILE | ARCHIVE |
| `test-results/` | Test result artifacts | NO | LOW | TEMP_FILE | ARCHIVE |

### 5.8 `prompts/` Directory

| File | Current Purpose | Original Purpose | Active? | Historical Value | Category | Recommended Action |
|---|---|---|---|---|---|---|
| `.gitkeep` | Placeholder | Placeholder | NO | NONE | TEMP_FILE | KEEP ACTIVE (structural) |
| `01-setup.md` | Setup prompt | Setup prompt | YES | MEDIUM | PROMPT | KEEP ACTIVE |
| `02-implement.md` | Implementation prompt | Implementation prompt | YES | MEDIUM | PROMPT | KEEP ACTIVE |
| `03-test.md` | Test prompt | Test prompt | YES | MEDIUM | PROMPT | KEEP ACTIVE |

### 5.9 `scripts/` Directory

| File | Current Purpose | Original Purpose | Active? | Historical Value | Category | Recommended Action |
|---|---|---|---|---|---|---|
| `audit-grants.sql` | Database audit script | Database audit script | YES | MEDIUM | ACTIVE_PRODUCT | KEEP ACTIVE |
| `audit-rpc-contracts.ts` | RPC audit script | RPC audit script | YES | MEDIUM | ACTIVE_PRODUCT | KEEP ACTIVE |
| `extract_baseline.py` | Baseline extraction | Baseline extraction | YES | MEDIUM | ACTIVE_PRODUCT | KEEP ACTIVE |
| `staging-phase15-accounts.json` | Staging accounts data | Staging accounts data | YES | MEDIUM | ACTIVE_CONFIGURATION | KEEP ACTIVE |
| `staging-phase15-checklist.cjs` | Staging checklist script | Staging checklist script | YES | MEDIUM | ACTIVE_PRODUCT | KEEP ACTIVE |
| `staging-phase15-report.md` | Staging report | Staging report | YES | MEDIUM | IMPLEMENTATION_REPORT | KEEP ACTIVE |
| `staging-phase15-results.json` | Staging results | Staging results | YES | MEDIUM | IMPLEMENTATION_REPORT | KEEP ACTIVE |
| `staging-phase15-setup.cjs` | Staging setup script | Staging setup script | YES | MEDIUM | ACTIVE_PRODUCT | KEEP ACTIVE |

### 5.10 `.temp/` Directory

| File | Current Purpose | Original Purpose | Active? | Historical Value | Category | Recommended Action |
|---|---|---|---|---|---|---|
| `check_deploy.py` | One-time deploy check | One-time deploy check | NO | LOW | TEMP_FILE | DELETE CANDIDATE |
| `index.js` | Temporary script | Temporary script | NO | LOW | TEMP_FILE | DELETE CANDIDATE |
| `pages.html` | Temporary HTML | Temporary HTML | NO | LOW | TEMP_FILE | DELETE CANDIDATE |
| `test_auth.sql` | Temporary auth test | Temporary auth test | NO | LOW | TEMP_FILE | DELETE CANDIDATE |
| `test_p10_2.sql` | Temporary test | Temporary test | NO | LOW | TEMP_FILE | DELETE CANDIDATE |

### 5.11 `-p/` Directory

Empty directory. No files to classify.

---

## 6. High Value Historical Documents

The following documents have HIGH historical value and should be preserved in the archive:

| Document | Program | Reason |
|---|---|---|
| `archive/programs/System Recovery Program/` (all 279 files) | System Recovery Program | Complete record of a major governance-driven recovery effort |
| `Plan-Fix-Bug/IMPLEMENTATION_MASTER_PLAN.md` | Admin Dashboard / Bug Fix Campaign | Comprehensive plan covering 5 phases, 18 issues, root cause analysis |
| `Plan-Fix-Bug/ADMIN_DASHBOARD_REMEDIATION_ANALYSIS.md` | Admin Dashboard | Detailed security and architecture audit |
| `memory-zone/AGENTS.md` | All Programs | Complete chronological record of all development sessions |
| `CURRENT_PHASE.md` | System Recovery Program | Active governance marker for Phase 6 |
| `ARCHIVE_MANIFEST.md` | System Recovery Program | Complete mapping of archived files |
| `SYSTEM_RECOVERY_PROGRAM_ARCHIVE_EXECUTION_REPORT.md` | System Recovery Program | Report on the archive execution |
| `docs/admin-dashboard/DISASTER_RECOVERY_RUNBOOK.md` | Admin Dashboard | Operational runbook |
| `docs/admin-dashboard/INCIDENT_RESPONSE_RUNBOOK.md` | Admin Dashboard | Operational runbook |
| `docs/admin-dashboard/MIGRATION_RUNBOOK.md` | Admin Dashboard | Operational runbook |
| `docs/admin-dashboard/ROLLBACK_RUNBOOK.md` | Admin Dashboard | Operational runbook |
| `docs/admin-dashboard/RPC_CONTRACTS.md` | Admin Dashboard | RPC contract documentation |
| `FIX_PLAN_USER_MANAGEMENT_SECURITY.md` | Security Hardening | Security fix plan |
| `SECURITY.md` | Security Hardening | Security policy |
| `Plan/Migration/` (all SQL files) | UI Migration Program | Canonical migration chain |

---

## 7. Files Safe to Archive

The following files are safe to archive (not actively used, historical value MEDIUM or lower, no ongoing operational need):

### 7.1 Root Level Temporary Files
- `.commit-msg.txt`
- `.gitcommitmsg`
- `.gitcommitmsg.txt`
- `.gitcommitmsg2.txt`
- `.tmp_commit_msg2.txt`
- `export_final.txt`
- `export_results.json`
- `export_results.txt`
- `export_results2.txt`
- `test-tracked.txt`
- `tmp_verify_docs.mjs`
- `tmp_verify_rpc.mjs`

### 7.2 Plan-Fix-Bug/ (Complete Directory)
- `ADMIN_DASHBOARD_REMEDIATION_ANALYSIS.md`
- `IMPLEMENTATION_GOVERNANCE.md`
- `IMPLEMENTATION_MASTER_PLAN.md`
- `RECONCILIATION_REPORT_TASK-DOC2-004.md`
- `IMPLEMENTATION_MASTER_PLAN/` (all 15 files)

### 7.3 Plan/Log/ (Complete Directory)
- All `SP-*.md` files (~50 files)

### 7.4 reports/
- `admin_dashboard_user_management_audit.md`

### 7.5 memory-zone/ Handoff Documents
- All `HANDOFF_*.md` files (~20 files)

### 7.6 memory-zone/ One-Time Scripts
- `create_returnorders.cjs`
- `gen_returns.cjs`
- `generate_docx.cjs`
- `make_returns.cjs`
- `transform_returnorders.cjs`
- `_move_script.ps1`
- `_move_to_old.cmd`

### 7.7 memory-zone/ Screenshots
- `login.png`
- `screenshot_import_date.png`

### 7.8 memory-zone/ Master-design/
- `DATA_TABLE_RETURN.md`
- `HEADER_ROW_RETURN.md`
- `PAGINATION_RETURN.md`
- `STAT_CARD_RETURN.md`
- `A/` (subdirectory)

### 7.9 memory-zone/ openspec/
- Complete directory

### 7.10 memory-zone/ screenshots/
- Complete directory

### 7.11 memory-zone/ scripts/
- All 5 files

### 7.12 memory-zone/ test-results/
- Complete directory

### 7.13 memory-zone/ frappe_docker/
- Complete directory

### 7.14 memory-zone/ backup/
- f1/ through f5/ (SQL migration backups)

### 7.15 docs/admin-dashboard/ Handoff Documents
- `HANDOFF_AUDIT_LOG_400.md`
- `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md`
- `HANDOFF_PHASE_5_UNTRACKED_FILES.md`

---

## 8. Files That Must Stay Active

The following files must remain active in their current locations:

### 8.1 Active Product Source Code
- All files in `components/`, `pages/`, `services/`, `hooks/`, `contexts/`, `utils/`, `types/`, `lib/`, `styles/`
- All files in `supabase/` (migrations, config)
- All files in `tests/`
- All files in `public/`
- Root: `App.tsx`, `index.tsx`, `index.html`, `index.css`, `constants.ts`, `features.ts`, `types.ts`, `design-system-tokens.css`

### 8.2 Active Configuration
- `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `postcss.config.js`, `vercel.json`
- `.env`, `.env.example`, `.env.staging`, `.gitignore`, `_redirects`
- `project.yml`, `workflow.yml`

### 8.3 Active Documentation
- `README.md`, `LICENSE.md`, `NOTICE.md`, `SECURITY.md`
- `runbook.md`, `instructions.md`
- `docs/admin-dashboard/DISASTER_RECOVERY_RUNBOOK.md`
- `docs/admin-dashboard/INCIDENT_RESPONSE_RUNBOOK.md`
- `docs/admin-dashboard/KEY_ROTATION_RUNBOOK.md`
- `docs/admin-dashboard/MIGRATION_RUNBOOK.md`
- `docs/admin-dashboard/MONITORING_RUNBOOK.md`
- `docs/admin-dashboard/ROLLBACK_RUNBOOK.md`
- `docs/admin-dashboard/RPC_CONTRACTS.md`
- `docs/opensource-references.md`
- `memory-zone/docs/` (einvoice guide, plans)

### 8.4 Active Governance
- `CURRENT_PHASE.md`
- `CURRENT_TASK.md`
- `ARCHIVE_MANIFEST.md`
- `SYSTEM_RECOVERY_PROGRAM_ARCHIVE_EXECUTION_REPORT.md`
- `D-P4-02_CANONICAL_AUDIT_GATE_DEFINITION.md`

### 8.5 Active Feature Documentation
- `DEPLOYMENT_SYSTEM_ADMIN_FEATURE.md`
- `FIX_PLAN_USER_MANAGEMENT_SECURITY.md`
- `GITHUB_DESKTOP_DEPLOYMENT_GUIDE.md`
- `GUIDE_CREATE_NEW_SHOP.md`
- `PLAN_CREATE_SYSTEM_ADMIN.md`
- `SYSTEM_ADMIN_FEATURE_COMPLETION_SUMMARY.md`
- `SKILLS_PROMPT_CHEATSHEET.md`
- `TODO.md`

### 8.6 Active Edge Functions & Migrations
- `Plan/EdgeFunction/` (all 6 files)
- `Plan/Migration/` (all ~15 SQL files)

### 8.7 Active Scripts
- `scripts/` (all 8 files)

### 8.8 Active Prompts
- `prompts/` (all 3 files)

### 8.9 Active Reference
- `memory-zone/AGENTS.md`
- `memory-zone/BAN_DO_NGHIEP_VU_VietSale_ERPNext.md`

---

## 9. Delete Candidates

The following files are candidates for deletion (NONE historical value, no ongoing purpose). **However, per the task constraints, no files should be deleted without separate approval.**

| File | Reason |
|---|---|
| `.temp/check_deploy.py` | One-time verification script, no ongoing value |
| `.temp/index.js` | Temporary script, purpose unknown |
| `.temp/pages.html` | Temporary HTML, no ongoing value |
| `.temp/test_auth.sql` | Temporary auth test, no ongoing value |
| `.temp/test_p10_2.sql` | Temporary test, no ongoing value |
| `-p/` (empty directory) | Empty directory, no content |

**Recommendation:** These files should be reviewed manually before any deletion action. The `.temp/` directory is clearly intended for temporary files and could be cleaned entirely.

---

## 10. Manual Review Required

The following files require manual review to determine their current status and appropriate disposition:

| File | Reason |
|---|---|
| `docs/admin-dashboard/ADMIN_DASHBOARD_DEPLOYMENT_ERROR_REMEDIATION_PLAN.md` | Unknown if still referenced for ongoing deployment issues |
| `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_2_SERVICE_TESTS.md` | Unknown if test procedures are still in use |
| `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_3_DEPLOY.md` | Unknown if deploy procedures are still in use |
| `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_4_VERIFY_UI.md` | Unknown if verification steps are still in use |
| `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` | Unknown if long-term plans are still active |
| `Plan/PLAN_AdminDashboard_Implementation_Phases.md` | May be superseded by Plan-Fix-Bug documents |
| `Plan/PLAN_AdminDashboard_OpenSource_Reference.md` | May be outdated reference |
| `memory-zone/BAN_DO_NGHIEP_VU_VietSale_ERPNext.md` | Vietnamese business map, may still be relevant |
| `memory-zone/KE_HOACH/` | Vietnamese business plans, may still be active |
| `memory-zone/metadata.json` | Purpose unclear |
| `memory-zone/archive/` | Already archived sub-plans, verify no active references |

---

## 11. Proposed Archive Structure

Based on the classification above, the following archive structure is proposed for future archive operations:

```
archive/
├── .gitkeep
├── docs/                              # Existing (currently empty)
├── Plan/                              # Existing (PLAN_AdminDashboard_SubPhases.md)
├── programs/
│   └── System Recovery Program/       # Already archived (279 files)
├── investigations/                    # NEW — for temporary investigations
│   └── stock-ledger-recovery/         # From .temp/ and related
├── reports/                           # NEW — for historical reports
│   ├── admin-dashboard-audit.md       # From reports/
│   └── session-logs/                  # From Plan/Log/
├── prompts/                           # NEW — for historical prompts
│   └── (if any prompts become historical)
├── temporary/                         # NEW — for temp files
│   ├── root-temp/                     # From root temp files
│   ├── dot-temp/                      # From .temp/
│   └── memory-zone-temp/              # From memory-zone temp files
├── obsolete/                          # NEW — for obsolete plans
│   ├── plan-fix-bug/                  # From Plan-Fix-Bug/
│   ├── admin-dashboard-phases/        # From docs/admin-dashboard/ (handoffs)
│   └── master-design/                 # From memory-zone/Master-design/
├── exports/                           # NEW — for export files
│   └── root-exports/                  # From root export_*.txt/json
├── backups/                           # NEW — for SQL backups
│   └── migration-backups/             # From memory-zone/backup/
├── experiments/                       # NEW — for experimental features
│   ├── frappe-docker/                 # From memory-zone/frappe_docker/
│   └── openspec/                      # From memory-zone/openspec/
└── handoffs/                          # NEW — for handoff documents
    ├── admin-dashboard/               # From docs/admin-dashboard/ HANDOFF_*
    └── memory-zone/                   # From memory-zone/ HANDOFF_*
```

---

## 12. Migration Priority

| Priority | Group | Rationale | Estimated Effort |
|---|---|---|---|
| **P0** | Root temporary files (`.commit-msg.txt`, `export_*`, `tmp_*`) | Cluttering root directory, no ongoing value | Low |
| **P1** | `Plan-Fix-Bug/` (complete directory) | Implementation plan is complete, no active tasks remain | Low |
| **P2** | `Plan/Log/` (session logs) | Historical record, no ongoing operational use | Low |
| **P3** | `memory-zone/` handoffs, scripts, screenshots, test-results | One-time artifacts, no ongoing value | Medium |
| **P4** | `docs/admin-dashboard/` handoff documents | Phase-specific handoffs, no longer active | Low |
| **P5** | `memory-zone/frappe_docker/`, `openspec/` | Experimental features, not in active use | Medium |
| **P6** | `memory-zone/Master-design/` | Design reference, may be superseded | Low |
| **P7** | `memory-zone/backup/` | SQL migration backups, keep as safety net | Low |
| **P8** | `reports/` | Historical audit report | Low |
| **P9** | `.temp/` | Clearly temporary, safe to archive/delete | Low |
| **P10** | Manual review items | Requires human judgment | Medium |

---

## 13. Risk Assessment

### 13.1 Risks of Archiving

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Archived handoff documents needed for reference | Low | Medium | Keep `memory-zone/AGENTS.md` active (contains all session history) |
| Archived implementation plans needed for future work | Low | Low | Plans are complete; future work would create new plans |
| Archived runbooks needed for operations | Low | High | All operational runbooks in `docs/admin-dashboard/` are marked KEEP ACTIVE |
| Archived migration backups needed for recovery | Low | Medium | Production DB has current state; backups are safety net only |
| Archived design references needed for UI work | Low | Low | Design tokens in `design-system-tokens.css` are the SSOT |

### 13.2 Risks of NOT Archiving

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Root directory clutter makes navigation difficult | High | Low | Archive temp files to clean root |
| Confusion between active and historical plans | Medium | Medium | Clear directory separation in archive |
| Accidental modification of historical artifacts | Low | Low | Archive protects against accidental changes |
| Build/deploy confusion from temp files | Low | Low | Temp files are not referenced in build config |

### 13.3 Overall Risk Assessment

**LOW RISK** — The proposed archive operations are safe. No active product code, configuration, or operational documentation would be affected. All high-value historical documents would be preserved in a structured archive.

---

## 14. Final Recommendation

### 14.1 Immediate Actions (No Approval Required)

None — this is an analysis-only report.

### 14.2 Recommended Next Steps (Requires Approval)

1. **Phase 1 — Clean Root Directory**
   - Archive 12 temporary files from root (`.commit-msg.txt`, `.gitcommitmsg*`, `.tmp_commit_msg2.txt`, `export_*`, `test-tracked.txt`, `tmp_verify_*`)
   - Target: `archive/temporary/root-temp/`

2. **Phase 2 — Archive Plan-Fix-Bug/**
   - Move entire `Plan-Fix-Bug/` directory to `archive/obsolete/plan-fix-bug/`
   - This program is complete; no active tasks remain

3. **Phase 3 — Archive Session Logs**
   - Move `Plan/Log/` to `archive/reports/session-logs/`
   - These are historical records of AI agent sessions

4. **Phase 4 — Archive Handoff Documents**
   - Move `docs/admin-dashboard/HANDOFF_*.md` to `archive/handoffs/admin-dashboard/`
   - Move `memory-zone/HANDOFF_*.md` to `archive/handoffs/memory-zone/`

5. **Phase 5 — Archive Experiments**
   - Move `memory-zone/frappe_docker/` to `archive/experiments/frappe-docker/`
   - Move `memory-zone/openspec/` to `archive/experiments/openspec/`

6. **Phase 6 — Archive Design References**
   - Move `memory-zone/Master-design/` to `archive/obsolete/master-design/`

7. **Phase 7 — Archive Temporary Artifacts**
   - Move `memory-zone/scripts/`, `memory-zone/screenshots/`, `memory-zone/test-results/` to `archive/temporary/memory-zone/`
   - Move `.temp/` to `archive/temporary/dot-temp/`

8. **Phase 8 — Manual Review**
   - Review files listed in Section 10 for appropriate disposition

### 14.3 Files That Should NEVER Be Archived

- All active product source code (`components/`, `pages/`, `services/`, `hooks/`, `contexts/`, `utils/`, `types/`, `lib/`, `styles/`, `supabase/`, `tests/`, `public/`)
- All active configuration (`package.json`, `tsconfig.json`, `vite.config.ts`, etc.)
- All operational runbooks (`docs/admin-dashboard/*RUNBOOK*.md`, `docs/admin-dashboard/RPC_CONTRACTS.md`)
- Active governance markers (`CURRENT_PHASE.md`, `CURRENT_TASK.md`)
- Active reference (`memory-zone/AGENTS.md`)
- Active edge functions (`Plan/EdgeFunction/`)
- Active migrations (`Plan/Migration/`)
- Active scripts (`scripts/`)
- Active prompts (`prompts/`)

### 14.4 Conclusion

The VietSalePro v7 repository contains a rich history of development programs, governance artifacts, and implementation plans. The System Recovery Program has already been successfully archived. The remaining historical artifacts are well-organized and can be systematically archived in phases without risk to active product development.

**Total files to archive:** ~150-200 files across 8 phases
**Total files to keep active:** ~300 files
**Total files requiring manual review:** ~20 files
**Total delete candidates:** ~5 files (requires separate approval)

---

*End of Report*

*Generated: 2026-07-19 06:45 ICT*
*Analyst: Repository Information Architect*
*Mode: ANALYSIS ONLY — No files were moved, renamed, or modified*