# IMPLEMENTATION_GOVERNANCE.md

**VietSale Pro v7 — Enterprise AI Governance Framework**

| Field | Value |
| --- | --- |
| **Version** | 1.0 |
| **Status** | Authoritative — Controls ALL AI Operations |
| **Date** | 2026-07-13 |
| **Author** | Enterprise AI Governance Architect |
| **Governing Document** | `IMPLEMENTATION_MASTER_PLAN.md` |
| **Total Sections** | 20 |
| **Enforcement** | Mandatory — No Exceptions |

---

## Table of Contents

1. [Governance Principles](#1-governance-principles)
2. [AI Responsibilities](#2-ai-responsibilities)
3. [AI Restrictions](#3-ai-restrictions)
4. [Skill Catalog](#4-skill-catalog)
5. [Skill Mapping Matrix](#5-skill-mapping-matrix)
6. [Skill Routing Engine](#6-skill-routing-engine)
7. [Mandatory Workflows](#7-mandatory-workflows)
8. [Decision Gates](#8-decision-gates)
9. [Phase Governance](#9-phase-governance)
10. [Review Rules](#10-review-rules)
11. [Testing Rules](#11-testing-rules)
12. [Deployment Rules](#12-deployment-rules)
13. [Rollback Rules](#13-rollback-rules)
14. [MCP Usage Rules](#14-mcp-usage-rules)
15. [Security Rules](#15-security-rules)
16. [Continuous Compliance Rules](#16-continuous-compliance-rules)
17. [Definition of Done](#17-definition-of-done)
18. [Governance Checklist](#18-governance-checklist)
19. [Governance Audit Checklist](#19-governance-audit-checklist)
20. [Future Extension Rules](#20-future-extension-rules)

---

## 1. Governance Principles

### 1.1 Core Principles

| # | Principle | Description |
| --- | --- | --- |
| P1 | **Plan-First** | Every AI action must be traceable to a Phase, Activity, or Task in `IMPLEMENTATION_MASTER_PLAN.md`. No ad-hoc work. |
| P2 | **Read-Before-Write** | AI must read Codebase Memory before modifying any file. AI must inspect Supabase schema before any database change. |
| P3 | **Minimum Skill, Maximum Safety** | Execute only the required skills for each situation. Never execute all skills just because they exist. |
| P4 | **Gate Enforcement** | No AI shall proceed past any Decision Gate until that gate explicitly passes. |
| P5 | **Rollback-Ready** | Every AI action that modifies state must have a documented rollback path before execution begins. |
| P6 | **Phase Integrity** | AI must not cross Phase boundaries. Work in one Phase must not depend on uncompleted Phases. |
| P7 | **Schema Immutability** | AI must not create duplicate migrations. Every migration must have a unique, sequential timestamp. |
| P8 | **Security Zero-Trust** | AI must assume `anon` and `authenticated` have no privilege. Every RPC must be explicitly granted. |
| P9 | **Evidence Over Assumption** | AI must verify before declaring success. Run tests, query information_schema, check cron.job_run_details. |
| P10 | **Governance Supremacy** | This document supersedes all other AI instructions. In case of conflict, this Governance wins. |

### 1.2 Governance Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              IMPLEMENTATION_MASTER_PLAN.md                  │
│                  (Source of Truth)                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              IMPLEMENTATION_GOVERNANCE.md                   │
│              (This Document — Controls HOW)                 │
└───────┬──────────────┬──────────────┬───────────────────────┘
        │              │              │
        ▼              ▼              ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│   Skill   │  │ MCP Tools │  │ Decision  │
│  Routing  │  │  (Memory  │  │   Gates   │
│  Engine   │  │  + Supa)  │  │           │
└───────────┘  └───────────┘  └───────────┘
```

---

## 2. AI Responsibilities

### 2.1 What the AI MUST Do

| # | Responsibility | Trigger |
| --- | --- | --- |
| R1 | Read `IMPLEMENTATION_MASTER_PLAN.md` at session start | Every session |
| R2 | Query Codebase Memory before touching any file | Before write |
| R3 | Inspect Supabase schema before database changes | Before migration |
| R4 | Check current Phase completion status before starting work | Every task |
| R5 | Execute required skills in the prescribed order | Every workflow |
| R6 | Pass every Decision Gate before continuing | Between workflow stages |
| R7 | Document what was done in execution logs | After every action |
| R8 | Run relevant tests after every change | After every change |
| R9 | Verify rollback plan exists before mutation | Before mutation |
| R10 | Report PASS/FAIL against Phase criteria | Phase completion |

### 2.2 What the AI SHOULD Do

| # | Responsibility |
| --- | --- |
| RS1 | Use `spec-driven-development` when requirements are unclear |
| RS2 | Use `doubt-driven-development` before complex changes |
| RS3 | Use `incremental-implementation` for multi-file changes |
| RS4 | Prefer `code-simplification` before adding new abstractions |
| RS5 | Use `planning-and-task-breakdown` for tasks > 2 hours |

### 2.3 AI Role Assignment

| Role | Applies When |
| --- | --- |
| **Auditor** | Reviewing existing code, searching for patterns, verifying compliance |
| **Planner** | Breaking down phases into tasks, designing workflows |
| **Implementer** | Writing code, creating migrations, updating components |
| **Reviewer** | Reviewing AI-generated code before commit |
| **Tester** | Running tests, creating test cases, verifying fixes |
| **DevOps** | Deploying, configuring CI/CD, managing environments |
| **Security** | Auditing grants, checking RLS, verifying webhook signatures |

---

## 3. AI Restrictions

### 3.1 Absolute Prohibitions

| # | Prohibition | Rationale |
| --- | --- | --- |
| F1 | **Never modify code without reading Codebase Memory first** | Prevent blind changes that break dependencies |
| F2 | **Never modify database without Supabase schema inspection** | Prevent schema drift |
| F3 | **Never skip testing** | Every change must be verified |
| F4 | **Never skip code review** | Second pair of eyes on all changes |
| F5 | **Never skip verification** | Trust but verify — always run smoke tests |
| F6 | **Never skip rollback plan** | Every mutation must be reversible |
| F7 | **Never modify outside current Phase** | Phase integrity must be maintained |
| F8 | **Never create duplicate migrations** | Timestamps must be unique and sequential |
| F9 | **Never bypass IMPLEMENTATION_MASTER_PLAN.md** | This is the single source of truth |
| F10 | **Never grant EXECUTE to `anon` on any function** | Zero-trust security posture |
| F11 | **Never create SECURITY DEFINER without `SET search_path TO 'public'`** | Prevent search_path injection |
| F12 | **Never skip the staging environment for database changes** | Production is not a test environment |
| F13 | **Never deploy without full database backup** | Rollback capability must exist |
| F14 | **Never merge to main without CI passing** | Quality gates must be enforced |
| F15 | **Never hardcode secrets in code or edge functions** | Use Supabase secrets / environment variables |

### 3.2 Conditional Restrictions

| # | Restriction | Condition |
| --- | --- | --- |
| C1 | Do not modify `supabaseService.ts` | Unless Phase explicitly requires it |
| C2 | Do not create new edge functions | Unless Phase explicitly requires it |
| C3 | Do not change RLS policies | Unless Phase explicitly requires it |
| C4 | Do not modify `config.toml` | Unless DevOps role explicitly assigned |
| C5 | Do not run `cron.unschedule()` | Unless Phase 1 Step 2 explicitly requires it |
| C6 | Do not deploy 9 missing migrations out of order | Must deploy in timestamp order |

---

## 4. Skill Catalog

### 4.1 Tier 1 — Mandatory Engineering Skills (Always Available)

| Skill | Purpose | Strength | Weakness | Must Use When | Must NOT Use When |
| --- | --- | --- | --- | --- | --- |
| **test-driven-development** | Write tests first, then code | Prevents regressions; ensures coverage | Slower initial velocity; not for UI prototyping | Fixing bugs, implementing logic, database functions | Visual/UI exploration, documentation |
| **debugging-and-error-recovery** | Systematic root-cause analysis | Methodical; eliminates guesswork | Time-intensive for simple issues | Production errors, test failures, unexpected behavior | Known trivial issues (typo, missing import) |
| **code-review-and-quality** | Multi-axis code review | Catches security, performance, maintainability | Can be overly strict on experimental code | Before merge, after implementation | During initial prototyping |
| **spec-driven-development** | Spec before implementation | Prevents scope creep; clear acceptance criteria | Overhead for tiny changes | New features, API changes, major refactors | Single-line fixes, typo corrections |
| **security-and-hardening** | Hardening against vulnerabilities | Comprehensive security audit | Can flag false positives | Auth changes, RPC grants, webhook handlers | Pure UI changes without data flow |
| **documentation-and-adrs** | Record architectural decisions | Preserves context for future agents | Time investment | Architectural decisions, API changes, new patterns | Routine bug fixes |
| **incremental-implementation** | Small, verifiable steps | Reduces risk; easy to rollback | More commits | Multi-file changes, database migrations | Single-file, single-function changes |
| **planning-and-task-breakdown** | Break work into implementable tasks | Clear scope; estimateable | Upfront time cost | Complex features, multi-phase work | Already well-defined tasks |
| **code-simplification** | Simplify without changing behavior | Reduces technical debt | Can be subjective | Refactoring, deduplication | Critical bug fixes (fix first, simplify later) |
| **performance-optimization** | Optimize application performance | Data-driven; measurable | Can over-optimize | Pagination, query optimization, bundle size | Working code without performance issues |
| **ci-cd-and-automation** | CI/CD pipeline setup | Automates quality gates | Requires infrastructure access | Phase 5, pipeline configuration | Frontend-only changes |
| **git-workflow-and-versioning** | Git workflow management | Consistent commit history | Process overhead | Branching, committing, merging | -- |
| **observability-and-instrumentation** | Logging, metrics, tracing | Production visibility | Adds code volume | Cron monitoring, error tracking | Static content |
| **api-and-interface-design** | Stable API design | Prevents breaking changes | Analysis paralysis | New RPCs, new endpoints, service boundaries | Internal-only changes |
| **doubt-driven-development** | Assumption verification | Prevents wrong implementations | Can slow momentum | Unclear requirements, complex logic | Well-defined bug fixes |
| **deprecation-and-migration** | Safe deprecation management | Structured migration path | Documentation burden | Phase 2 audit log migration, API versioning | New greenfield features |
| **shipping-and-launch** | Production launch preparation | Pre-launch checklist | -- | Phase deployments, major releases | -- |
| **context-engineering** | Optimize agent context | Efficient token usage | -- | Long sessions, complex tasks | Short, simple tasks |

### 4.2 Tier 2 — Specialized Skills (Installed)

| Skill | Purpose | Strength | Weakness | Must Use When | Must NOT Use When |
| --- | --- | --- | --- | --- | --- |
| **requesting-code-review** | Pre-commit security scan + quality gates | Auto-fix capability; gate enforcement | Requires git staging | Before committing any code | -- |
| **frontend-ui-engineering** | Production-quality UI | Consistent, accessible components | May over-engineer simple UIs | Building new components, admin pages | Quick hotfixes |
| **vercel-react-best-practices** | React/Next.js performance | Vercel-optimized patterns | React-specific only | React component work, data fetching | Non-React code |
| **webapp-testing** | Playwright browser testing | Real browser verification | Slower than unit tests | End-to-end flows, admin dashboard testing | Unit test writing |
| **browser-testing-with-devtools** | Chrome DevTools inspection | DOM, console, network analysis | Manual interaction required | Debugging UI issues, performance profiling | Backend-only work |
| **source-driven-development** | Official documentation grounding | Authoritative, up-to-date | Requires doc availability | Using new APIs, framework features | Familiar, well-documented patterns |
| **codebase-design** | Deep module design | Testable, AI-navigable code | Design-heavy; not for fixes | Module extraction, interface design | Leaf-node fixes |
| **domain-modeling** | Ubiquitous language, DDD | Shared terminology | Upfront modeling cost | New domain concepts, multi-tenant logic | -- |
| **design-an-interface** | Multiple design alternatives | Explores solution space | Time cost | API design, component contracts | -- |
| **diagnosing-bugs** | Hard bug diagnosis loop | Systematic; doesn't give up | -- | Stubborn bugs, performance regressions | -- |
| **improve-codebase-architecture** | Architecture improvement scan | Visual report; deepening opportunities | -- | Codebase health assessment | Active crisis fixes |
| **frontend-design** | Distinctive visual design | Beautiful, non-generic UI | Not for data-heavy dashboards | Landing pages, marketing, brand | Admin CRUD tables |
| **ui-ux-pro-max** | UI/UX design intelligence | 50+ styles, 161 palettes | Overkill for simple UIs | New UI surfaces, redesigns | Bug fixes |
| **ui-styling** | shadcn/ui + Tailwind styling | Consistent design system | Requires Tailwind setup | Component styling, theme work | Non-Tailwind projects |
| **web-design-guidelines** | Web Interface Guidelines review | Accessibility, responsive audit | -- | UI review, accessibility check | Backend code |
| **doc-coauthoring** | Structured doc workflow | Refinement through iteration | Time-intensive | Technical specs, proposals | -- |
| **interview-me** | Intent extraction interview | Uncovers real requirements | -- | Ambiguous requests, new features | -- |
| **idea-refine** | Divergent→convergent thinking | Thorough option exploration | -- | Early-stage features, architecture decisions | -- |
| **mcp-builder** | Create MCP servers | External API integration | -- | New MCP tools needed | -- |
| **skill-creator** | Create/optimize skills | Custom skill development | -- | New skill creation | -- |

### 4.3 Tier 3 — Output Skills (Document Generation)

| Skill | Purpose | Use When |
| --- | --- | --- |
| **docx** | Word documents | Formal reports, proposals |
| **pdf** | PDF manipulation | Invoice generation, reports |
| **pptx** | PowerPoint presentations | Stakeholder presentations |
| **xlsx** | Excel spreadsheets | Data exports, financial reports |
| **internal-comms** | Internal communications | Status reports, newsletters |
| **canvas-design** | Visual art PNG/PDF | Posters, designs |
| **algorithmic-art** | Generative art p5.js | -- |
| **brand-guidelines** | Anthropic branding | -- |
| **slack-gif-creator** | Slack GIFs | -- |
| **theme-factory** | Theme styling | -- |
| **web-artifacts-builder** | Complex HTML artifacts | -- |
| **claude-api** | Claude API reference | -- |

### 4.4 Skill Dependencies

```
test-driven-development
    └── NO DEPENDENCIES (standalone)

security-and-hardening
    ├── REQUIRES: codebase-memory-mcp (architecture context)
    ├── REQUIRES: Supabase MCP (grant inspection)
    └── PRODUCES: Security audit report

debugging-and-error-recovery
    ├── REQUIRES: codebase-memory-mcp (call chain tracing)
    ├── OPTIONAL: browser-testing-with-devtools (UI bugs)
    └── PRODUCES: Root cause analysis + fix

code-review-and-quality
    ├── REQUIRES: codebase-memory-mcp (impact analysis)
    ├── OPTIONAL: security-and-hardening (security axis)
    └── PRODUCES: Review report with scores

requesting-code-review
    ├── REQUIRES: git staged changes
    ├── RUNS: security scan → quality gates → auto-fix
    └── PRODUCES: Pass/Fail report

spec-driven-development
    ├── OPTIONAL: interview-me (requirements gathering)
    ├── OPTIONAL: domain-modeling (new concepts)
    └── PRODUCES: Specification document

frontend-ui-engineering
    ├── OPTIONAL: ui-ux-pro-max (design direction)
    ├── OPTIONAL: web-design-guidelines (accessibility review)
    └── PRODUCES: Production-quality UI code

performance-optimization
    ├── REQUIRES: browser-testing-with-devtools (profiling)
    ├── OPTIONAL: observability-and-instrumentation (metrics)
    └── PRODUCES: Performance report + optimizations

ci-cd-and-automation
    ├── REQUIRES: GitHub Actions access
    ├── OPTIONAL: shipping-and-launch (deployment strategy)
    └── PRODUCES: CI/CD pipeline configuration

incremental-implementation
    ├── REQUIRES: planning-and-task-breakdown (task list)
    └── PRODUCES: Sequenced commits

documentation-and-adrs
    ├── OPTIONAL: domain-modeling (glossary)
    └── PRODUCES: ADR document

code-simplification
    ├── REQUIRES: codebase-memory-mcp (usage analysis)
    └── PRODUCES: Simplified code, no behavior change

deprecation-and-migration
    ├── REQUIRES: codebase-memory-mcp (call chain tracing)
    └── PRODUCES: Migration plan + execution
```

---

## 5. Skill Mapping Matrix

### 5.1 Phase → Task → Skills Mapping

---

#### PHASE 1 — Security Lockdown & Migration Sync

| Step/Task | Required Skills | Optional Skills | Execution Order |
| --- | --- | --- | --- |
| **Pre-Phase: Prerequisites Check** | `codebase-memory-mcp` (read architecture), Supabase MCP (read schema) | `planning-and-task-breakdown` | 1 → 2 |
| **Step 1: Full Database Backup** | Supabase MCP (verify backup) | `shipping-and-launch` (pre-deploy checklist) | 1 |
| **Step 2: Pause Cron Jobs** | Supabase MCP (execute SQL) | `observability-and-instrumentation` (log pause) | 1 |
| **Step 3: Resolve Migration Timestamp Duplicate** | `incremental-implementation`, `git-workflow-and-versioning` | `code-simplification` | 1 → 2 |
| **Step 4: Deploy Security Hardening Migration** | `security-and-hardening`, `test-driven-development`, `incremental-implementation` | `code-review-and-quality`, `requesting-code-review` | 1 (test) → 2 (code) → 3 (review) → 4 (deploy staging) → 5 (verify) → 6 (deploy prod) |
| **Step 5: Deploy 9 Missing Migrations** | `incremental-implementation`, `deprecation-and-migration` | `planning-and-task-breakdown` | 1 (staging) → 2 (smoke test) → 3 (prod) → 4 (verify) |
| **Step 6: Verify & Resume Cron Jobs** | Supabase MCP (verify job_run_details) | `observability-and-instrumentation` | 1 (schedule) → 2 (trigger) → 3 (verify) |
| **Step 7: Deploy Edge Function Updates** | `security-and-hardening`, `incremental-implementation` | `api-and-interface-design` | 1 (update) → 2 (rotate secrets) → 3 (deploy) → 4 (test webhooks) |
| **Step 8: Verify All RPCs Exist** | Supabase MCP (query information_schema), `webapp-testing` | -- | 1 (query) → 2 (frontend smoke test) |
| **Post-Phase: Validation** | `code-review-and-quality` | `requesting-code-review` | 1 |
| **Post-Phase: Regression** | `webapp-testing` | `browser-testing-with-devtools` | 1 |
| **Post-Phase: Rollback Verification** | `shipping-and-launch` (rollback plan) | -- | 1 |

---

#### PHASE 2 — Schema & Data Stability

| Step/Task | Required Skills | Optional Skills | Execution Order |
| --- | --- | --- | --- |
| **Pre-Phase: Verify Phase 1 Done** | `codebase-memory-mcp` (check state) | Supabase MCP (verify grants) | 1 |
| **Step 1: Full Database Backup** | Supabase MCP | -- | 1 |
| **Step 2: Create import_history Table** | `spec-driven-development`, `test-driven-development` | `api-and-interface-design` | 1 (spec) → 2 (test) → 3 (migration) → 4 (verify) |
| **Step 3: Migrate audit_log → app_audit_log** | `deprecation-and-migration`, `test-driven-development` | `incremental-implementation` | 1 (data migration) → 2 (update triggers) → 3 (verify) |
| **Step 4: Update Triggers** | `incremental-implementation`, `security-and-hardening` | -- | 1 (update) → 2 (verify writes) |
| **Step 5: Verify delete-tenant** | Supabase MCP (check logs) | `debugging-and-error-recovery` | 1 |
| **Post-Phase: Validation** | `code-review-and-quality` | -- | 1 |

---

#### PHASE 3 — Frontend Hardening

| Step/Task | Required Skills | Optional Skills | Execution Order |
| --- | --- | --- | --- | --- |
| **Pre-Phase: Verify Phases 1-2** | `codebase-memory-mcp` | -- | 1 |
| **Step 1: Create RequireSystemAdmin Guard** | `test-driven-development`, `frontend-ui-engineering` | `spec-driven-development` | 1 (test) → 2 (component) → 3 (verify) |
| **Step 2: Update App.tsx** | `incremental-implementation`, `vercel-react-best-practices` | `code-simplification` | 1 |
| **Step 3: Update AdminLayout.tsx** | `incremental-implementation` | -- | 1 |
| **Step 4-6: Add AbortController** | `vercel-react-best-practices`, `performance-optimization` | `debugging-and-error-recovery` | 1 per component |
| **Step 7: Add Zod Validation** | `test-driven-development`, `security-and-hardening` | `api-and-interface-design` | 1 (schema) → 2 (test) → 3 (form integration) |
| **Step 8: Replace as any Casts** | `code-simplification`, `code-review-and-quality` | -- | 1 |
| **Step 9: Replace Empty Catch Blocks** | `observability-and-instrumentation`, `debugging-and-error-recovery` | -- | 1 |
| **Step 10: Full Frontend Smoke Test** | `webapp-testing` | `browser-testing-with-devtools` | 1 |
| **Post-Phase: Validation** | `web-design-guidelines` (accessibility) | `requesting-code-review` | 1 |

---

#### PHASE 4 — Reliability & Scalability

| Step/Task | Required Skills | Optional Skills | Execution Order |
| --- | --- | --- | --- |
| **Pre-Phase: Verify Phases 1-3** | `codebase-memory-mcp` | -- | 1 |
| **Step 1: Consolidate Cron Jobs** | `deprecation-and-migration`, `observability-and-instrumentation` | `performance-optimization` | 1 (verify logic) → 2 (drop duplicates) → 3 (create log table) → 4 (add logging) |
| **Step 2: Implement Server-Side Pagination** | `performance-optimization`, `test-driven-development` | `api-and-interface-design` | 1 (update services) → 2 (update UI) → 3 (test) |
| **Step 3: Set Up Staging Workflow** | `ci-cd-and-automation`, `documentation-and-adrs` | `context-engineering` | 1 (scripts) → 2 (.env.example) → 3 (README) |
| **Post-Phase: Validation** | `code-review-and-quality` | -- | 1 |

---

#### PHASE 5 — Continuous Compliance (Ongoing)

| Step/Task | Required Skills | Optional Skills | Execution Order |
| --- | --- | --- | --- |
| **Step 1: CI/CD Migration Check** | `ci-cd-and-automation`, `git-workflow-and-versioning` | -- | 1 (GitHub Action) → 2 (test) → 3 (enable) |
| **Step 2: DB Security Lint in CI** | `security-and-hardening`, `ci-cd-and-automation` | -- | 1 (configure) → 2 (baseline) → 3 (enable blocking) |
| **Step 3: RPC Smoke Test** | `test-driven-development`, `ci-cd-and-automation` | `codebase-memory-mcp` (extract RPC names) | 1 (extract) → 2 (script) → 3 (CI integration) |
| **Step 4: Cron Monitoring** | `observability-and-instrumentation`, `ci-cd-and-automation` | `shipping-and-launch` | 1 (query) → 2 (alert) → 3 (dashboard) |
| **Step 5: Penetration Testing** | `security-and-hardening` | `webapp-testing` | 1 (quarterly) → 2 (document) |

### 5.2 Cross-Cutting Concerns Mapping

| Concern | Required Skills | When |
| --- | --- | --- |
| **Database Migration** | `incremental-implementation`, `test-driven-development`, `security-and-hardening`, Supabase MCP | Every migration |
| **Frontend Refactor** | `code-simplification`, `vercel-react-best-practices`, `frontend-ui-engineering`, `webapp-testing` | Every refactor |
| **Security Audit** | `security-and-hardening`, `code-review-and-quality`, Supabase MCP | Every PR, quarterly |
| **RPC Creation** | `spec-driven-development`, `test-driven-development`, `api-and-interface-design`, `security-and-hardening` | Every new RPC |
| **Testing** | `test-driven-development`, `webapp-testing` (E2E), `browser-testing-with-devtools` (debug) | Every change |
| **Performance** | `performance-optimization`, `browser-testing-with-devtools` (profile) | Phase 4, regressions |
| **Documentation** | `documentation-and-adrs`, `doc-coauthoring` | Architectural decisions, API changes |
| **Architecture** | `codebase-design`, `domain-modeling`, `improve-codebase-architecture` | Major changes |
| **Deployment** | `shipping-and-launch`, `ci-cd-and-automation`, `git-workflow-and-versioning` | Every deployment |
| **Rollback** | `shipping-and-launch` (rollback plan), `deprecation-and-migration` | Before every mutation |
| **Verification** | `requesting-code-review`, `webapp-testing`, `code-review-and-quality` | After every change |

---

## 6. Skill Routing Engine

### 6.1 Routing Decision Tree

```
WORK_TYPE_DETECTED
    │
    ├── Database Migration
    │   ├── REQUIRED: security-and-hardening
    │   ├── REQUIRED: test-driven-development
    │   ├── REQUIRED: incremental-implementation
    │   ├── REQUIRED: Supabase MCP (schema inspection)
    │   ├── REQUIRED: codebase-memory-mcp (impact analysis)
    │   ├── OPTIONAL: deprecation-and-migration (if modifying existing)
    │   ├── GATE: Architecture Review
    │   ├── GATE: Security Review
    │   └── GATE: Testing Review
    │
    ├── Frontend Bug Fix
    │   ├── REQUIRED: debugging-and-error-recovery
    │   ├── REQUIRED: test-driven-development
    │   ├── REQUIRED: vercel-react-best-practices
    │   ├── REQUIRED: codebase-memory-mcp (component dependencies)
    │   ├── OPTIONAL: browser-testing-with-devtools (UI bug)
    │   ├── OPTIONAL: webapp-testing (E2E verification)
    │   ├── GATE: Testing Review
    │   └── GATE: Regression Review
    │
    ├── Frontend Feature
    │   ├── REQUIRED: spec-driven-development
    │   ├── REQUIRED: test-driven-development
    │   ├── REQUIRED: frontend-ui-engineering
    │   ├── REQUIRED: vercel-react-best-practices
    │   ├── REQUIRED: incremental-implementation
    │   ├── OPTIONAL: ui-ux-pro-max (design direction)
    │   ├── OPTIONAL: web-design-guidelines (accessibility)
    │   ├── GATE: Architecture Review
    │   ├── GATE: Testing Review
    │   └── GATE: Regression Review
    │
    ├── Security Fix
    │   ├── REQUIRED: security-and-hardening
    │   ├── REQUIRED: test-driven-development
    │   ├── REQUIRED: Supabase MCP (grant inspection)
    │   ├── REQUIRED: codebase-memory-mcp (attack surface analysis)
    │   ├── OPTIONAL: debugging-and-error-recovery (vulnerability trace)
    │   ├── GATE: Architecture Review
    │   ├── GATE: Security Review
    │   ├── GATE: Testing Review
    │   └── GATE: Verification Review
    │
    ├── RPC Creation/Modification
    │   ├── REQUIRED: spec-driven-development
    │   ├── REQUIRED: test-driven-development
    │   ├── REQUIRED: api-and-interface-design
    │   ├── REQUIRED: security-and-hardening
    │   ├── REQUIRED: Supabase MCP (existing RPC inspection)
    │   ├── GATE: Architecture Review
    │   ├── GATE: Security Review
    │   └── GATE: Testing Review
    │
    ├── Testing
    │   ├── REQUIRED: test-driven-development
    │   ├── OPTIONAL: webapp-testing (E2E)
    │   ├── OPTIONAL: browser-testing-with-devtools (debug)
    │   └── GATE: Testing Review
    │
    ├── Performance Optimization
    │   ├── REQUIRED: performance-optimization
    │   ├── REQUIRED: codebase-memory-mcp (hotspot analysis)
    │   ├── REQUIRED: browser-testing-with-devtools (profiling)
    │   ├── OPTIONAL: vercel-react-best-practices (React-specific)
    │   ├── GATE: Testing Review
    │   └── GATE: Regression Review
    │
    ├── Documentation
    │   ├── REQUIRED: documentation-and-adrs
    │   ├── OPTIONAL: doc-coauthoring
    │   ├── OPTIONAL: domain-modeling (glossary)
    │   └── GATE: Documentation Review
    │
    ├── Architecture Decision
    │   ├── REQUIRED: documentation-and-adrs
    │   ├── REQUIRED: codebase-design
    │   ├── REQUIRED: codebase-memory-mcp (dependency analysis)
    │   ├── OPTIONAL: domain-modeling
    │   ├── OPTIONAL: design-an-interface
    │   ├── OPTIONAL: improve-codebase-architecture
    │   ├── GATE: Architecture Review
    │   └── GATE: Dependency Review
    │
    ├── Deployment
    │   ├── REQUIRED: shipping-and-launch
    │   ├── REQUIRED: ci-cd-and-automation (if CI changes)
    │   ├── REQUIRED: git-workflow-and-versioning
    │   ├── OPTIONAL: deprecation-and-migration (if replacing)
    │   ├── GATE: Deployment Review
    │   └── GATE: Verification Review
    │
    ├── Rollback
    │   ├── REQUIRED: shipping-and-launch (rollback plan)
    │   ├── REQUIRED: Supabase MCP (if DB rollback)
    │   ├── GATE: Deployment Review
    │   └── GATE: Verification Review
    │
    └── Verification
        ├── REQUIRED: code-review-and-quality
        ├── REQUIRED: requesting-code-review
        ├── OPTIONAL: webapp-testing
        └── GATE: Verification Review
```

### 6.2 Minimum Skill Set Per Work Type

| Work Type | Minimum Skills |
| --- | --- |
| Database Migration | 5 (security, TDD, incremental, Supabase MCP, codebase-memory) |
| Frontend Bug Fix | 4 (debugging, TDD, vercel-react, codebase-memory) |
| Frontend Feature | 5 (spec, TDD, ui-engineering, vercel-react, incremental) |
| Security Fix | 5 (security, TDD, Supabase MCP, codebase-memory, debugging optional) |
| RPC Creation | 5 (spec, TDD, api-design, security, Supabase MCP) |
| Performance | 4 (perf-opt, codebase-memory, browser-devtools, vercel-react optional) |
| Documentation | 2 (documentation-adrs, doc-coauthoring optional) |
| Architecture | 4 (adrs, codebase-design, codebase-memory, domain-modeling optional) |
| Testing | 2 (TDD, webapp-testing optional) |
| Deployment | 3 (shipping-launch, ci-cd, git-workflow) |
| Rollback | 2 (shipping-launch rollback, Supabase MCP if DB) |

---

## 7. Mandatory Workflows

### 7.1 Bug Fix Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BUG FIX WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ENTRY CRITERIA                                                      │
│  ├── Bug reported and reproducible                                   │
│  ├── Bug mapped to specific Phase/Issue in IMPLEMENTATION_MASTER_PLAN│
│  └── Current Phase context understood                                │
│                                                                      │
│  STEP 1: DIAGNOSE                                                    │
│  ├── Skill: debugging-and-error-recovery                             │
│  ├── Tool: codebase-memory-mcp (trace call chain)                    │
│  ├── Tool: Supabase MCP (if DB-related)                              │
│  ├── Optional: browser-testing-with-devtools (UI bugs)               │
│  └── Output: Root cause analysis + reproduction steps                │
│                                                                      │
│  STEP 2: TEST (RED)                                                  │
│  ├── Skill: test-driven-development                                  │
│  ├── Write failing test that reproduces the bug                      │
│  └── Output: Failing test case                                       │
│                                                                      │
│  STEP 3: IMPLEMENT (GREEN)                                           │
│  ├── Skill: incremental-implementation                               │
│  ├── Implement fix                                                   │
│  ├── Verify test passes                                              │
│  └── Output: Passing test + fixed code                               │
│                                                                      │
│  STEP 4: REVIEW                                                      │
│  ├── Skill: code-review-and-quality                                  │
│  ├── Skill: requesting-code-review                                   │
│  ├── Check: No regression introduced                                 │
│  └── Output: Review report                                           │
│                                                                      │
│  STEP 5: VERIFY                                                      │
│  ├── Run full smoke test suite (36 tests)                            │
│  ├── Optional: webapp-testing (E2E)                                  │
│  └── Output: All tests pass                                          │
│                                                                      │
│  EXIT CRITERIA                                                       │
│  ├── PASS: All tests pass, bug no longer reproducible                │
│  ├── PASS: Code review approved                                      │
│  ├── PASS: No new regressions                                        │
│  ├── PASS: Build succeeds                                            │
│  └── FAIL: Any criterion not met → return to STEP 1                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Feature Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       FEATURE WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ENTRY CRITERIA                                                      │
│  ├── Feature defined in IMPLEMENTATION_MASTER_PLAN.md                │
│  ├── Prerequisite Phases completed                                   │
│  └── Required files identified                                       │
│                                                                      │
│  STEP 1: SPECIFY                                                     │
│  ├── Skill: spec-driven-development                                  │
│  ├── Optional: interview-me (requirements gathering)                 │
│  ├── Optional: domain-modeling (new concepts)                        │
│  └── Output: Approved specification                                  │
│                                                                      │
│  STEP 2: DESIGN                                                      │
│  ├── Skill: api-and-interface-design (if API/RPC)                    │
│  ├── Skill: codebase-design (if new module)                          │
│  ├── Optional: design-an-interface (explore alternatives)            │
│  ├── GATE: Architecture Review                                       │
│  ├── GATE: Dependency Review                                         │
│  └── Output: Design document                                         │
│                                                                      │
│  STEP 3: TEST FIRST (RED)                                            │
│  ├── Skill: test-driven-development                                  │
│  ├── Write unit tests for all new functions                          │
│  ├── Write integration tests for API endpoints                       │
│  └── Output: Failing test suite                                      │
│                                                                      │
│  STEP 4: IMPLEMENT (GREEN)                                           │
│  ├── Skill: incremental-implementation                               │
│  ├── Implement feature in small, verifiable steps                    │
│  ├── For DB: Supabase MCP (migration creation)                       │
│  ├── For UI: frontend-ui-engineering, vercel-react-best-practices    │
│  └── Output: All tests pass                                          │
│                                                                      │
│  STEP 5: REVIEW                                                      │
│  ├── Skill: code-review-and-quality                                  │
│  ├── Skill: requesting-code-review                                   │
│  ├── GATE: Implementation Review                                     │
│  └── Output: Approved code                                           │
│                                                                      │
│  STEP 6: VERIFY                                                      │
│  ├── Skill: webapp-testing (E2E)                                     │
│  ├── Run full smoke test suite                                       │
│  ├── GATE: Testing Review                                            │
│  ├── GATE: Regression Review                                         │
│  └── Output: All gates pass                                          │
│                                                                      │
│  STEP 7: DOCUMENT                                                    │
│  ├── Skill: documentation-and-adrs                                   │
│  ├── Document any architectural decisions                            │
│  └── Output: Updated documentation                                   │
│                                                                      │
│  EXIT CRITERIA                                                       │
│  ├── PASS: All gates approved                                        │
│  ├── PASS: All tests pass                                            │
│  ├── PASS: Documentation updated                                     │
│  ├── PASS: Build succeeds                                            │
│  └── FAIL: Any gate fails → return to appropriate step               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 Migration Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MIGRATION WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ENTRY CRITERIA                                                      │
│  ├── Migration explicitly required by IMPLEMENTATION_MASTER_PLAN.md  │
│  ├── Migration timestamp is unique (no duplicates)                   │
│  ├── Full database backup completed                                  │
│  └── Staging environment available                                   │
│                                                                      │
│  STEP 1: INSPECT                                                     │
│  ├── Tool: Supabase MCP (inspect current schema)                     │
│  ├── Tool: codebase-memory-mcp (impact analysis)                     │
│  ├── Verify migration does not conflict with existing objects        │
│  └── Output: Impact analysis                                         │
│                                                                      │
│  STEP 2: CREATE                                                      │
│  ├── Create migration file with unique sequential timestamp          │
│  ├── Skill: test-driven-development (write verification tests)       │
│  ├── Skill: security-and-hardening (review SECURITY DEFINER)         │
│  └── Output: Migration file + tests                                  │
│                                                                      │
│  STEP 3: STAGING                                                     │
│  ├── Deploy migration to staging Supabase project                    │
│  ├── Run verification tests                                          │
│  ├── Run supabase lint                                               │
│  ├── GATE: Testing Review (staging)                                  │
│  └── Output: Staging verified                                        │
│                                                                      │
│  STEP 4: PRODUCTION                                                  │
│  ├── Deploy migration to production (maintenance window if needed)   │
│  ├── Run verification tests in production                            │
│  ├── GATE: Verification Review                                       │
│  └── Output: Production verified                                     │
│                                                                      │
│  STEP 5: VERIFY INTEGRITY                                            │
│  ├── Verify migration count matches local                            │
│  ├── Run RPC smoke test                                              │
│  ├── Verify cron jobs (if affected)                                  │
│  └── Output: Integrity confirmed                                     │
│                                                                      │
│  EXIT CRITERIA                                                       │
│  ├── PASS: Staging + Production migrations applied successfully      │
│  ├── PASS: supabase lint shows 0 new advisories                      │
│  ├── PASS: All verification tests pass                               │
│  ├── PASS: Migration count synced                                    │
│  └── FAIL: Any failure → rollback per rollback plan                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.4 Security Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SECURITY WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ENTRY CRITERIA                                                      │
│  ├── Security issue identified in IMPLEMENTATION_MASTER_PLAN.md      │
│  ├── Attack vector documented                                        │
│  └── Full database backup completed                                  │
│                                                                      │
│  STEP 1: AUDIT                                                       │
│  ├── Skill: security-and-hardening                                   │
│  ├── Tool: Supabase MCP (grant inspection)                           │
│  ├── Tool: codebase-memory-mcp (attack surface)                      │
│  └── Output: Security audit report                                   │
│                                                                      │
│  STEP 2: PLAN                                                        │
│  ├── Document all affected functions/grants                           │
│  ├── Document regrant list (minimum necessary)                       │
│  ├── GATE: Architecture Review                                       │
│  ├── GATE: Security Review                                           │
│  └── Output: Security fix plan                                       │
│                                                                      │
│  STEP 3: FIX                                                         │
│  ├── Skill: incremental-implementation                               │
│  ├── Apply REVOKE + GRANT changes                                    │
│  ├── Fix search_path on SECURITY DEFINER functions                   │
│  ├── Update edge functions (webhook signatures)                      │
│  └── Output: Security fixes applied                                  │
│                                                                      │
│  STEP 4: VERIFY                                                      │
│  ├── Verify anon CANNOT execute admin RPCs                           │
│  ├── Verify authenticated CAN execute scoped RPCs                    │
│  ├── Verify service_role CAN execute admin RPCs                      │
│  ├── Run supabase lint (0 anon advisories)                           │
│  └── Output: Verification report                                     │
│                                                                      │
│  STEP 5: PENETRATION TEST                                            │
│  ├── Test all attack vectors from Phase 5 pen test list              │
│  ├── Document results                                                │
│  └── Output: Pen test report (must be clean)                         │
│                                                                      │
│  EXIT CRITERIA                                                       │
│  ├── PASS: 0 anon-granted admin functions                            │
│  ├── PASS: Webhook signatures enforced                               │
│  ├── PASS: supabase lint clean                                       │
│  ├── PASS: Penetration test clean                                    │
│  └── FAIL: Any active vulnerability → return to STEP 3               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.5 Refactor Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       REFACTOR WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ENTRY CRITERIA                                                      │
│  ├── Refactor explicitly required by IMPLEMENTATION_MASTER_PLAN.md   │
│  ├── Current behavior documented (tests exist or will be created)    │
│  └── No behavior change intended                                     │
│                                                                      │
│  STEP 1: BASELINE                                                    │
│  ├── Skill: test-driven-development (ensure tests pass)              │
│  ├── If no tests exist: write characterization tests first           │
│  ├── Tool: codebase-memory-mcp (usage analysis)                      │
│  └── Output: Baseline test suite (all green)                         │
│                                                                      │
│  STEP 2: SIMPLIFY                                                    │
│  ├── Skill: code-simplification                                      │
│  ├── Extract functions, remove dead code, improve naming             │
│  ├── Keep tests green throughout                                     │
│  └── Output: Simplified code, tests still pass                       │
│                                                                      │
│  STEP 3: REVIEW                                                      │
│  ├── Skill: code-review-and-quality                                  │
│  ├── Verify no behavior change                                       │
│  ├── GATE: Implementation Review                                     │
│  └── Output: Review report                                           │
│                                                                      │
│  EXIT CRITERIA                                                       │
│  ├── PASS: All baseline tests still pass                             │
│  ├── PASS: No behavior change detected                               │
│  ├── PASS: Code complexity reduced (measurable)                      │
│  └── FAIL: Any test failure → behavior changed unintentionally       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.6 Testing Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       TESTING WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ENTRY CRITERIA                                                      │
│  ├── Code change completed                                           │
│  └── Implementation review passed                                    │
│                                                                      │
│  STEP 1: UNIT TESTS                                                  │
│  ├── Skill: test-driven-development                                  │
│  ├── Run: npx vitest run                                             │
│  ├── Must pass: 100% of changed code covered                         │
│  └── Output: Unit test results                                       │
│                                                                      │
│  STEP 2: SMOKE TESTS                                                 │
│  ├── Run all 36 smoke tests                                          │
│  ├── Must pass: 36/36                                                │
│  └── Output: Smoke test results                                      │
│                                                                      │
│  STEP 3: INTEGRATION TESTS                                           │
│  ├── If RPC/API changed: test against staging                        │
│  ├── If DB changed: verify with Supabase MCP                         │
│  └── Output: Integration test results                                │
│                                                                      │
│  STEP 4: E2E TESTS                                                   │
│  ├── Skill: webapp-testing                                           │
│  ├── If UI changed: test critical user flows                         │
│  ├── Optional: browser-testing-with-devtools (visual check)          │
│  └── Output: E2E test results                                        │
│                                                                      │
│  STEP 5: REGRESSION                                                  │
│  ├── Run full test suite                                             │
│  ├── Verify build succeeds (npm run build)                           │
│  ├── GATE: Testing Review                                            │
│  ├── GATE: Regression Review                                         │
│  └── Output: Regression test results                                 │
│                                                                      │
│  EXIT CRITERIA                                                       │
│  ├── PASS: All test layers pass                                      │
│  ├── PASS: Build succeeds                                            │
│  ├── PASS: No new TypeScript errors                                  │
│  └── FAIL: Any test failure → return to implementation               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.7 Review Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REVIEW WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ENTRY CRITERIA                                                      │
│  ├── Implementation completed                                        │
│  └── All tests passing                                               │
│                                                                      │
│  STEP 1: SELF-REVIEW                                                 │
│  ├── Skill: code-review-and-quality                                  │
│  ├── Check: Security (SQL injection, XSS, secrets)                   │
│  ├── Check: Performance (N+1, bundle size, re-renders)               │
│  ├── Check: Maintainability (naming, complexity, duplication)        │
│  ├── Check: Correctness (types, edge cases, error handling)          │
│  └── Output: Self-review findings + fixes                            │
│                                                                      │
│  STEP 2: PRE-COMMIT                                                  │
│  ├── Skill: requesting-code-review                                   │
│  ├── Security scan                                                   │
│  ├── Quality gates (lint, types, test coverage)                      │
│  ├── Auto-fix applicable issues                                      │
│  └── Output: Pre-commit report                                       │
│                                                                      │
│  STEP 3: PEER REVIEW                                                 │
│  ├── Submit for peer/AI review                                       │
│  ├── Address all review comments                                     │
│  ├── GATE: Implementation Review                                     │
│  └── Output: Approved code                                           │
│                                                                      │
│  EXIT CRITERIA                                                       │
│  ├── PASS: All review comments addressed                             │
│  ├── PASS: Pre-commit gates pass                                     │
│  ├── PASS: No unresolved security advisories                         │
│  └── FAIL: Unresolved review comments → return to STEP 1             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.8 Verification Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     VERIFICATION WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ENTRY CRITERIA                                                      │
│  ├── All previous gates passed                                       │
│  └── Code deployed to target environment                             │
│                                                                      │
│  STEP 1: FUNCTIONAL VERIFICATION                                     │
│  ├── Verify all Phase validation checklist items                     │
│  ├── Tool: Supabase MCP (RPC existence, cron status)                 │
│  ├── Skill: webapp-testing (UI verification)                         │
│  └── Output: Validation checklist (all checked)                      │
│                                                                      │
│  STEP 2: REGRESSION VERIFICATION                                     │
│  ├── Verify all Phase regression checklist items                     │
│  ├── Run full smoke test suite                                       │
│  ├── Check build succeeds                                            │
│  └── Output: Regression checklist (all checked)                      │
│                                                                      │
│  STEP 3: PERFORMANCE VERIFICATION                                    │
│  ├── Check no performance regression                                 │
│  ├── Tool: browser-testing-with-devtools (if UI)                     │
│  ├── Check DB query performance (if DB changes)                      │
│  └── Output: Performance baseline maintained                         │
│                                                                      │
│  STEP 4: SECURITY VERIFICATION                                       │
│  ├── Run supabase lint                                               │
│  ├── Check 0 new security advisories                                 │
│  ├── Verify grants correct                                           │
│  └── Output: Security verification passed                            │
│                                                                      │
│  EXIT CRITERIA                                                       │
│  ├── PASS: All validation items checked                              │
│  ├── PASS: All regression items checked                              │
│  ├── PASS: Performance not degraded                                  │
│  ├── PASS: Security posture maintained                               │
│  └── FAIL: Any verification fails → rollback + return to fix         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.9 Deployment Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT WORKFLOW                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ENTRY CRITERIA                                                      │
│  ├── All gates passed (1-6)                                          │
│  ├── Rollback plan documented and tested                             │
│  ├── Deployment window approved (if maintenance window required)     │
│  └── Full database backup completed                                  │
│                                                                      │
│  STEP 1: PRE-DEPLOY                                                  │
│  ├── Skill: shipping-and-launch (pre-launch checklist)               │
│  ├── Verify all pre-deployment checklist items                       │
│  ├── Notify stakeholders (if maintenance window)                     │
│  ├── Confirm monitoring dashboards operational                       │
│  └── Output: Pre-deployment checklist (all checked)                  │
│                                                                      │
│  STEP 2: STAGING DEPLOY                                              │
│  ├── Deploy all changes to staging (shbmzvfcenbybvyzclem)           │
│  ├── Run full test suite on staging                                  │
│  ├── Run supabase lint on staging                                    │
│  ├── Manual smoke test on staging                                    │
│  └── Output: Staging verified                                        │
│                                                                      │
│  STEP 3: PRODUCTION DEPLOY                                           │
│  ├── Deploy to production (rsialbfjswnrkzcxarnj)                    │
│  ├── During maintenance window if Phase 1 (Saturday 02:00–04:00 UTC+7)│
│  ├── Standard deploy for other Phases                                │
│  └── Output: Production deployed                                     │
│                                                                      │
│  STEP 4: POST-DEPLOY                                                 │
│  ├── Run smoke tests on production                                   │
│  ├── Monitor cron.job_run_details for 1 hour                         │
│  ├── Monitor error rates for 1 hour                                  │
│  ├── GATE: Deployment Review                                         │
│  └── Output: Post-deployment verification                            │
│                                                                      │
│  STEP 5: MONITOR                                                     │
│  ├── Monitor for 24 hours post-deploy                                │
│  ├── Check: cron job success                                         │
│  ├── Check: error rates within baseline                              │
│  ├── Check: DB CPU/memory within normal range                        │
│  └── Output: 24-hour monitoring report                               │
│                                                                      │
│  EXIT CRITERIA                                                       │
│  ├── PASS: Staging deployment successful                             │
│  ├── PASS: Production deployment successful                          │
│  ├── PASS: All post-deploy checks pass                               │
│  ├── PASS: 24-hour monitoring clean                                  │
│  └── FAIL: Trigger rollback per rollback plan                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.10 Rollback Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ROLLBACK WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ENTRY CRITERIA                                                      │
│  ├── Rollback trigger met (error rate spike, critical breakage, etc.)│
│  └── Rollback plan exists and is tested                              │
│                                                                      │
│  STEP 1: ASSESS                                                      │
│  ├── Determine rollback scope (DB, edge function, frontend)          │
│  ├── Identify affected Phase(s)                                      │
│  └── Output: Rollback scope determined                               │
│                                                                      │
│  STEP 2: EXECUTE                                                     │
│  ├── Phase 1: pg_restore + redeploy edge functions + re-schedule cron│
│  ├── Phase 2: Restore triggers + keep deprecation table              │
│  ├── Phase 3: Revert Vercel deployment                               │
│  ├── Phase 4: Re-schedule cron + revert services                     │
│  ├── Phase 5: Disable CI checks                                      │
│  └── Output: Rollback executed                                       │
│                                                                      │
│  STEP 3: VERIFY                                                      │
│  ├── Verify system restored to pre-deployment state                  │
│  ├── Run smoke tests                                                 │
│  ├── GATE: Verification Review                                       │
│  └── Output: Rollback verified                                       │
│                                                                      │
│  EXIT CRITERIA                                                       │
│  ├── PASS: System operational                                        │
│  ├── PASS: Smoke tests pass                                          │
│  ├── PASS: Error rates back to baseline                              │
│  └── FAIL: Escalate to manual intervention                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Decision Gates

### 8.1 Gate Definitions

| Gate | Name | When | What It Checks | Pass Condition | Fail Action |
| --- | --- | --- | --- | --- | --- |
| **G1** | Architecture Review | Before any new code structure / module / API design | Design follows Phase requirements; no dependency violations; no Phase boundary crossing | Architecture aligns with IMPLEMENTATION_MASTER_PLAN.md | Return to design step |
| **G2** | Dependency Review | Before implementation | No circular dependencies; no coupling between unrelated Phases; all dependencies declared | Dependency graph is clean | Return to design step |
| **G3** | Implementation Review | After implementation, before merge | Code quality; security; types; error handling; follows Governance rules | Code review approved; pre-commit gates pass | Return to implementation |
| **G4** | Testing Review | After testing, before deployment | All test layers pass; coverage meets threshold; no regressions | 36/36 smoke tests pass; build succeeds | Return to implementation |
| **G5** | Regression Review | Before deployment | No regressions in existing functionality; all regression checklists pass | All regression items checked | Return to implementation |
| **G6** | Deployment Review | Before production deployment | Staging verified; rollback plan tested; maintenance window confirmed | Staging passes; rollback plan exists | Fix staging issues |
| **G7** | Verification Review | After deployment | Production smoke tests pass; cron jobs active; error rates normal; RPCs exist | All verification items pass | Trigger rollback |

### 8.2 Gate Flow Map

```
START
  │
  ├── [G1: Architecture Review]
  │     ├── PASS → [G2: Dependency Review]
  │     │           ├── PASS → IMPLEMENT
  │     │           │           │
  │     │           │           ▼
  │     │           │         [G3: Implementation Review]
  │     │           │           ├── PASS → TEST
  │     │           │           │           │
  │     │           │           │           ▼
  │     │           │           │         [G4: Testing Review]
  │     │           │           │           ├── PASS → [G5: Regression Review]
  │     │           │           │           │           ├── PASS → DEPLOY
  │     │           │           │           │           │           │
  │     │           │           │           │           │           ▼
  │     │           │           │           │           │         [G6: Deployment Review]
  │     │           │           │           │           │           ├── PASS → DEPLOY TO PROD
  │     │           │           │           │           │           │           │
  │     │           │           │           │           │           │           ▼
  │     │           │           │           │           │           │         [G7: Verification Review]
  │     │           │           │           │           │           │           ├── PASS → ✅ DONE
  │     │           │           │           │           │           │           └── FAIL → ROLLBACK
  │     │           │           │           │           │           └── FAIL → Fix + Re-deploy
  │     │           │           │           │           └── FAIL → Fix + Re-test
  │     │           │           │           └── FAIL → Fix + Re-test
  │     │           │           └── FAIL → Fix + Re-review
  │     │           └── FAIL → Re-design
  │     └── FAIL → Re-architect
  │
  └── AI CANNOT CONTINUE UNTIL EVERY GATE PASSES
```

### 8.3 Gate Bypass Rules

Gate bypass is **STRICTLY PROHIBITED** except:

| Exception | Allowed Bypass | Justification Required |
| --- | --- | --- |
| Emergency security hotfix | G1, G2 (deferred, not skipped) | Documented security incident with CVE or equivalent |
| Typo/comment fix | G1, G2, G4, G5 | Must be only text changes, zero logic changes |
| Documentation-only change | G4, G5 | Must not touch any code or configuration |

---

## 9. Phase Governance

### 9.1 Phase 1 — Security Lockdown & Migration Sync

| Governance Rule | Detail |
| --- | --- |
| **Allowed Activities** | Fix `is_system_admin()`, REVOKE/GRANT sweep, search_path fix, deploy 9 missing migrations, fix duplicate timestamps, edge function webhook signatures, rotate X-Internal-Secret |
| **Forbidden Activities** | UI changes, new features, audit log migration, cron consolidation, pagination changes, frontend hardening |
| **Required Skills** | `security-and-hardening`, `test-driven-development`, `incremental-implementation`, `deprecation-and-migration` |
| **Required MCP** | `codebase-memory-mcp` (architecture + call chains), Supabase MCP (grants, schema, migrations, cron) |
| **Required Review** | Security review of all GRANT/REVOKE changes; peer review of consolidated migration |
| **Required Testing** | RPC smoke test (all 5 RPCs), cron job verification, webhook signature test, 36 smoke tests |
| **Deployment Rules** | Maintenance window required (Saturday 02:00–04:00 UTC+7); staging first → production; 2-hour window; monitor 24 hours |
| **Rollback Rules** | pg_restore from backup; redeploy edge functions from previous commit; re-schedule original cron jobs; estimated 30 minutes |
| **Definition of Done** | All Validation Checklist items pass; All Regression Checklist items pass; 3 consecutive cron successes; security hardening migration committed and peer-reviewed; RPC smoke test executed successfully |

### 9.2 Phase 2 — Schema & Data Stability

| Governance Rule | Detail |
| --- | --- |
| **Allowed Activities** | Consolidate audit_log → app_audit_log, create import_history or clean dead references, verify delete-tenant edge function, update audit triggers |
| **Forbidden Activities** | Frontend changes beyond import_history reference cleanup, auth changes, cron changes, new RPCs |
| **Required Skills** | `deprecation-and-migration`, `test-driven-development`, `incremental-implementation` |
| **Required MCP** | `codebase-memory-mcp` (audit log references), Supabase MCP (table inspection, trigger verification) |
| **Required Review** | Data migration script review; trigger update review |
| **Required Testing** | Audit log write verification; import_history integration test; delete-tenant log analysis |
| **Deployment Rules** | Standard deploy (no maintenance window); deploy migration → verify triggers → run migration script; keep deprecated table as backup for 1 month |
| **Rollback Rules** | Restore audit_log triggers to dual-write; re-enable audit_log as primary; keep deprecation table; 20 minutes |
| **Definition of Done** | Single audit table confirmed for 48 hours; import_history verified or dead code removed; delete-tenant log analysis completed |

### 9.3 Phase 3 — Frontend Hardening

| Governance Rule | Detail |
| --- | --- |
| **Allowed Activities** | Create RequireSystemAdmin guard, replace client-side auth with RPC, add AbortController, add Zod validation, replace `as any` casts, replace empty catch blocks |
| **Forbidden Activities** | Database changes, new migrations, edge function changes, new features, backend logic changes |
| **Required Skills** | `test-driven-development`, `frontend-ui-engineering`, `vercel-react-best-practices`, `incremental-implementation`, `code-simplification` |
| **Required MCP** | `codebase-memory-mcp` (component dependencies, service call chains) |
| **Required Review** | Admin guard review; form validation review; TypeScript strictness review |
| **Required Testing** | Admin access control test; race condition test; form validation test; 36 smoke tests; 0 unmounted component warnings |
| **Deployment Rules** | Standard frontend deploy via Vercel; no database changes; can deploy during business hours |
| **Rollback Rules** | Revert Vercel deployment to previous production deployment; 5 minutes |
| **Definition of Done** | RequireSystemAdmin renders in admin route tree; non-admin blocked; 0 unmounted setState warnings; Zod validation active; 0 `as any` casts in services/admin/; all catch blocks log errors |

### 9.4 Phase 4 — Reliability & Scalability

| Governance Rule | Detail |
| --- | --- |
| **Allowed Activities** | Consolidate duplicate cron jobs, implement server-side pagination, set up staging workflow, create .env.example, document staging |
| **Forbidden Activities** | Auth changes, new RPCs, audit log changes, frontend hardening (already done) |
| **Required Skills** | `deprecation-and-migration` (cron), `performance-optimization` (pagination), `ci-cd-and-automation` (staging scripts) |
| **Required MCP** | `codebase-memory-mcp` (service call chains), Supabase MCP (cron job inspection) |
| **Required Review** | Cron consolidation logic review; pagination API review |
| **Required Testing** | Cron job execution test; pagination test; staging script test; 36 smoke tests |
| **Deployment Rules** | Standard deploy; cron changes during low-traffic window; pagination as feature update |
| **Rollback Rules** | Re-enable duplicate cron jobs; revert to getAll* functions; 15 minutes |
| **Definition of Done** | No duplicate cron jobs; all getAll* replaced; staging scripts work; README updated; .env.example committed |

### 9.5 Phase 5 — Continuous Compliance (Ongoing)

| Governance Rule | Detail |
| --- | --- |
| **Allowed Activities** | CI/CD migration check, DB security lint, RPC smoke test, cron monitoring, penetration testing |
| **Forbidden Activities** | New application code; database schema changes; edge function changes |
| **Required Skills** | `ci-cd-and-automation`, `security-and-hardening`, `test-driven-development`, `observability-and-instrumentation` |
| **Required MCP** | `codebase-memory-mcp` (extract RPC names), Supabase MCP (lint, cron monitoring) |
| **Required Review** | CI configuration review; alert configuration review |
| **Required Testing** | CI gate verification; cron alert test; penetration test |
| **Deployment Rules** | CI config only; 15-minute deploy; any time |
| **Rollback Rules** | Disable new CI checks; revert CI configuration; 5 minutes |
| **Definition of Done** | All 5 CI/CD checks active; first penetration test clean; cron monitoring active for 1 week without false positives; CI pipeline documented in README |

### 9.6 Phase Transition Gate

Before transitioning from one Phase to the next:

```
TRANSITION CHECKLIST
├── [ ] Current Phase PASS/FAIL criteria: PASS ✅
├── [ ] Current Phase Definition of Done: ALL ITEMS CHECKED
├── [ ] Validation Checklist: ALL ITEMS CHECKED
├── [ ] Regression Checklist: ALL ITEMS CHECKED
├── [ ] Deployment: COMPLETED + VERIFIED
├── [ ] Post-deployment monitoring: 24 HOURS CLEAN (Phase 1, 2) / STANDARD (Phase 3, 4, 5)
├── [ ] Rollback plan: VERIFIED (not needed, kept for reference)
├── [ ] Next Phase prerequisites: ALL MET
└── [ ] Stakeholder approval: PHASE COMPLETION SIGNED OFF
```

---

## 10. Review Rules

### 10.1 Code Review Standards

| Axis | Check | Severity |
| --- | --- | --- |
| **Security** | No hardcoded secrets | CRITICAL |
| **Security** | No SQL injection vectors | CRITICAL |
| **Security** | No XSS vulnerabilities | CRITICAL |
| **Security** | No `anon` EXECUTE grants | CRITICAL |
| **Security** | SECURITY DEFINER has `search_path TO 'public'` | CRITICAL |
| **Correctness** | TypeScript strict mode — no `as any` | HIGH |
| **Correctness** | Error handling present (no empty catch) | HIGH |
| **Correctness** | Edge cases handled (null, undefined, empty) | HIGH |
| **Performance** | No N+1 queries | MEDIUM |
| **Performance** | No unbounded `SELECT *` without LIMIT | MEDIUM |
| **Performance** | useEffect has cleanup/AbortController | MEDIUM |
| **Maintainability** | Consistent naming | LOW |
| **Maintainability** | No dead code | LOW |
| **Maintainability** | No duplicate logic | LOW |

### 10.2 Review Frequency

| Event | Review Required |
| --- | --- |
| Every commit | `requesting-code-review` (pre-commit scan) |
| Every PR | `code-review-and-quality` (full review) |
| Every Phase completion | Full phase review against PASS/FAIL criteria |
| Weekly | Architecture compliance review |
| Quarterly | Security penetration test + review |

### 10.3 Review Sign-off

No code shall be merged to `main` without:
1. Pre-commit scan passing (`requesting-code-review`)
2. Full code review approved (`code-review-and-quality`)
3. All tests passing (36 smoke tests minimum)
4. Build succeeding
5. `supabase lint` showing 0 new advisories (if DB changes)

---

## 11. Testing Rules

### 11.1 Test Layers (Mandatory)

| Layer | Tool | When | Minimum Coverage |
| --- | --- | --- | --- |
| **Unit** | Vitest | On every commit | Changed code: 100% |
| **Integration** | Vitest + Supabase | On every PR (if API/RPC changed) | All new/modified endpoints |
| **Smoke** | Vitest (existing 36 tests) | Pre-deploy + Post-deploy | 36/36 pass |
| **E2E** | Playwright (`webapp-testing`) | Critical flows only | Admin dashboard flows |
| **Security** | `supabase lint` + manual | Quarterly | 0 new advisories |
| **Performance** | `browser-testing-with-devtools` | Pre-Phase 4 + Post-Phase 4 | No regression |

### 11.2 TDD Rule (Mandatory for Logic Changes)

```
For every function/module/RPC that contains logic:
1. Write test FIRST (it must fail)
2. Implement code
3. Run test (it must pass)
4. Refactor while keeping test green

EXCEPTIONS:
- Pure UI styling changes
- Documentation changes
- Configuration changes
- Dead code removal
```

### 11.3 Regression Test Suite

The 36 smoke tests are the minimum regression gate. These must pass before any deployment:

```
tests/smoke/
├── admin-dashboard-create-system-admin.test.ts
├── admin-dashboard-create-tenant.test.ts
├── admin-dashboard-p11-1-ticket-schema-backend.test.ts
├── admin-dashboard-p11-2-ticket-inbox-email.test.ts
├── admin-dashboard-p11-3-impersonation.test.ts
├── admin-dashboard-p12-1-announcements.test.ts
├── admin-dashboard-p12-2-email-templates.test.ts
├── admin-dashboard-p13-1-system-health.test.ts
├── admin-dashboard-p13-2-error-performance.test.tsx
├── admin-dashboard-p13-3-storage-backup.test.tsx
├── admin-dashboard-p13-4-bulk-maintenance.test.tsx
├── admin-dashboard-p15-3-integrations.test.ts
├── admin-dashboard-p16-2-churn-cohort.test.ts
├── admin-dashboard-p17-4-fraud-retention.test.tsx
├── admin-dashboard-p18-2-white-label.test.ts
├── admin-dashboard-p18-3-read-replica-queue.test.ts
├── admin-dashboard-p2-subscription-usage.test.ts
├── admin-dashboard-p2-tenant-admin.test.ts
├── admin-dashboard-p3-member-management.test.ts
├── admin-dashboard-p4-system-analytics.test.ts
├── admin-dashboard-p5-audit-security.test.ts
├── admin-dashboard-p6-operations-support.test.ts
├── admin-dashboard-p7-1-billing-schema-bank-config.test.ts
├── admin-dashboard-p7-2-invoice-create-pricing.test.ts
├── admin-dashboard-p7-3-payment-confirm-lifecycle.test.ts
├── admin-dashboard-p7-4-invoice-ui-pdf.test.ts
├── admin-dashboard-p7-5-expiry-cron-renewal-email.test.ts
├── admin-dashboard-p8-1-plan-builder-schema.test.ts
├── admin-dashboard-p8-2-feature-flags.test.ts
├── admin-dashboard-p9-1-billing-reminders.test.ts
├── admin-dashboard-p9-2-billing-automation-dashboard.test.ts
├── admin-dashboard-sp-6-3-support-ticket-sla.test.ts
├── member-management-enterprise.test.ts
├── offline-tenant.test.ts
├── rbac.test.ts
└── subscription.test.ts
```

### 11.4 Test Execution Order

```
1. Unit tests (fast, run on every save)
2. Integration tests (on PR, if applicable)
3. Smoke tests (pre-deploy gate)
4. E2E tests (post-deploy verification)
5. Security tests (lint + quarterly pen test)
```

---

## 12. Deployment Rules

### 12.1 Environment Pipeline

```
Developer Local
    │
    ▼
Staging (shbmzvfcenbybvyzclem)
    │
    ├── All migrations deployed first
    ├── Full smoke test suite
    ├── supabase lint
    ├── Manual smoke test
    └── Verified ✅
    │
    ▼
Production (rsialbfjswnrkzcxarnj)
    │
    ├── Maintenance window (Phase 1 only)
    ├── Standard deploy (Phases 2–5)
    └── Post-deployment verification
```

### 12.2 Pre-Deployment Checklist (Mandatory — Every Phase)

- [ ] Full production database backup completed and verified
- [ ] All tests pass on staging
- [ ] `supabase lint` results reviewed
- [ ] Smoke test suite passes on staging
- [ ] Rollback plan reviewed and tested
- [ ] Stakeholder notification sent (for maintenance windows)
- [ ] Monitoring dashboards confirmed operational
- [ ] Team on standby for 2 hours post-deploy

### 12.3 Deployment Windows

| Phase | Window Type | Duration | Day/Time |
| --- | --- | --- | --- |
| Phase 1 | Maintenance Window | 2 hours | Saturday 02:00–04:00 UTC+7 |
| Phase 2 | Standard Deploy | 30 min | Weekday 10:00 UTC+7 |
| Phase 3 | Standard Deploy | 30 min | Any time (frontend only) |
| Phase 4 | Standard Deploy | 30 min | Weekday 10:00 UTC+7 |
| Phase 5 | CI Config Only | 15 min | Any time |

### 12.4 Post-Deployment Verification (Mandatory — Every Phase)

- [ ] All smoke tests pass on production
- [ ] Cron jobs show SUCCESS in `cron.job_run_details` (if applicable)
- [ ] Admin dashboard loads and functions correctly
- [ ] No spike in error rates (monitor for 1 hour)
- [ ] No increase in 4xx/5xx responses
- [ ] Database CPU/memory within normal range
- [ ] Edge function invocation rates normal

### 12.5 Deployment Restrictions

- NEVER deploy database changes directly to production without staging first
- NEVER deploy during peak business hours (Phase 1 requires maintenance window)
- NEVER deploy without verified backup
- NEVER deploy without tested rollback plan
- NEVER skip post-deployment monitoring

---

## 13. Rollback Rules

### 13.1 General Rollback Principles

1. **Database changes cannot be cleanly rolled back.** Mitigation: always take full backup before any migration.
2. **Edge function changes can be rolled back** by redeploying previous version from git.
3. **Frontend changes can be rolled back** by reverting Vercel deployment.
4. **Cron job changes can be rolled back** by re-scheduling dropped jobs.

### 13.2 Rollback Triggers

**Trigger immediate rollback if:**
- Error rate spikes > 5x baseline within 15 minutes of deploy
- Critical functionality broken (tenant creation, billing, login)
- Database integrity issue detected (row count mismatch, constraint violation)
- Security regression (previously-fixed vulnerability reintroduced)

**Do NOT rollback for:**
- Minor UI glitches (fix forward)
- Non-blocking performance regression < 20%
- New but non-critical warnings in logs

### 13.3 Phase-Specific Rollback Procedures

**Phase 1 Rollback:**
```
1. Restore production database from backup (pg_restore)
2. Redeploy edge functions from commit before Phase 1
3. Re-schedule original cron jobs (schedule statements from pre-fix state)
4. Verify cron jobs running, RPCs unchanged, edge functions responding
5. Estimated time: 30 minutes
```

**Phase 2 Rollback:**
```
1. Restore audit_log triggers to dual-write (revert trigger updates)
2. Keep app_audit_log as-is (no data loss)
3. If import_history was created: DROP table (was empty)
4. Estimated time: 20 minutes
```

**Phase 3 Rollback:**
```
1. Revert Vercel deployment to previous production deployment
2. No database changes to revert
3. Estimated time: 5 minutes
```

**Phase 4 Rollback:**
```
1. Re-schedule dropped cron jobs
2. Revert paginated services to getAll* versions (previous git commit)
3. Redeploy frontend
4. Estimated time: 15 minutes
```

**Phase 5 Rollback:**
```
1. Disable new CI checks
2. Revert CI configuration
3. Estimated time: 5 minutes
```

### 13.4 Rollback Verification

After rollback:
- [ ] System operational
- [ ] Smoke tests pass
- [ ] Error rates back to baseline
- [ ] Cron jobs running (if applicable)
- [ ] Rollback documented with root cause analysis

---

## 14. MCP Usage Rules

### 14.1 codebase-memory-mcp Usage Rules

| Rule | Description |
| --- | --- |
| **Read before Write** | Always query the knowledge graph before modifying any file |
| **Index after Major Changes** | Re-index after significant refactors or Phase completions |
| **Search Modes** | Use `query` for natural language discovery; `name_pattern` for exact symbol search; `trace_path` for dependency analysis |
| **Architecture Check** | Use `get_architecture` before Phase transitions to understand current state |
| **Hotspot Analysis** | Use `get_architecture(aspects=['hotspots'])` before performance work |
| **Impact Analysis** | Use `trace_path(direction='outbound')` on any function before modifying it |
| **Never Skip** | Never modify a file without first checking its dependencies via codebase-memory |

### 14.2 Supabase MCP Usage Rules

| Rule | Description |
| --- | --- |
| **Inspect before Migrate** | Always check current schema state before creating new migrations |
| **Grant Audit** | Check existing EXECUTE grants before any REVOKE/GRANT operation |
| **RPC Verification** | Query `information_schema.routines` to verify RPC existence |
| **Cron Monitoring** | Check `cron.job_run_details` after any cron-related change |
| **Migration Count** | Verify production migration count matches local before declaring sync |
| **RLS Verification** | Check RLS policies before any tenant-related changes |
| **Lint Integration** | Run `supabase lint` before any deployment |
| **Never Skip** | Never deploy a database change without Supabase MCP inspection |
| **Never Assume** | Never assume a function/table/policy exists — always verify |

### 14.3 MCP Tool Selection Matrix

| Task | Primary MCP | Secondary MCP |
| --- | --- | --- |
| Understand code structure | `codebase-memory-mcp` (search_graph) | -- |
| Trace function call chain | `codebase-memory-mcp` (trace_path) | -- |
| Inspect database schema | Supabase MCP | `codebase-memory-mcp` (if indexed) |
| Check RPC existence | Supabase MCP | -- |
| Verify grants | Supabase MCP | -- |
| Monitor cron jobs | Supabase MCP | -- |
| Check migration status | Supabase MCP | -- |
| Find security vulnerabilities | `codebase-memory-mcp` (search_code) | Supabase MCP |
| Performance analysis | `codebase-memory-mcp` (query_graph for complexity) | Supabase MCP |
| Architecture overview | `codebase-memory-mcp` (get_architecture) | -- |

---

## 15. Security Rules

### 15.1 Mandatory Security Posture

| Rule | Description | Enforcement |
| --- | --- | --- |
| **Zero Anon Grants** | `anon` role must NEVER have EXECUTE on any admin function | Gate G2, supabase lint in CI |
| **Minimum Authenticated Grants** | `authenticated` must only have EXECUTE on tenant-scoped, read-only functions | Gate G2 |
| **search_path Mandate** | Every SECURITY DEFINER function must have `SET search_path TO 'public'` | Gate G3, supabase lint in CI |
| **Webhook Signatures** | All payment webhooks (Momo, VNPay, bank_transfer) must verify HMAC-SHA-256 | Gate G3 |
| **Secret Rotation** | X-Internal-Secret must be rotated periodically; never hardcoded | Gate G3 |
| **Fail-Closed** | `isSystemAdmin()` must return `false` on error (never accidentally grant access) | Gate G4 |
| **RLS Always On** | Tables must have RLS enabled; policies must enforce tenant isolation | Supabase lint in CI |
| **No Client-Side Auth** | Admin route guards must use server-side RPC verification, not client-side state | Gate G3 |

### 15.2 Security Review Checklist

Every security-related change must verify:

```
SECURITY REVIEW CHECKLIST
├── [ ] No anon EXECUTE grants on admin functions
├── [ ] No authenticated EXECUTE grants on admin-only functions
├── [ ] All SECURITY DEFINER functions have search_path TO 'public'
├── [ ] Webhook handlers verify cryptographic signatures
├── [ ] Secrets stored in Supabase secrets, not in code
├── [ ] RLS policies enabled and tenant-scoped
├── [ ] Admin checks are server-side (RPC), not client-side only
├── [ ] Error messages do not leak sensitive information
├── [ ] Rate limiting in place for sensitive endpoints
├── [ ] Input validation on all user-facing inputs
```

### 15.3 Penetration Test Scenarios (Quarterly)

```
PEN TEST SCENARIOS
├── Test 1: Call add_system_admin with anon JWT → must fail
├── Test 2: Call unlock_login_attempts with anon JWT → must fail
├── Test 3: Send unsigned Momo/VNPay webhook → must fail
├── Test 4: Attempt admin route access without system_admin role → must redirect
├── Test 5: Cross-tenant data access via modified RLS → must return empty
└── Document results; create tickets for any findings
```

---

## 16. Continuous Compliance Rules

### 16.1 Architecture Drift Prevention

| Rule | Check | Frequency |
| --- | --- | --- |
| No unplanned migrations | Production migration count = local migration count | Every PR |
| No duplicate timestamps | Migration timestamps are unique | Every PR |
| Phase boundaries respected | Work stays within current Phase | Every commit |
| Dependency integrity | No cross-Phase coupling | Weekly architecture review |

### 16.2 Database Drift Prevention

| Rule | Check | Frequency |
| --- | --- | --- |
| Schema consistency | `information_schema` matches local migrations | Every PR |
| Grant consistency | No new `anon` grants; no new mutable search_path | `supabase lint` in CI |
| RPC existence | All RPCs referenced in `services/` exist in production | RPC smoke test in CI |
| Migration ordering | Timestamps are sequential; no skipped numbers | Migration check in CI |

### 16.3 Code Duplication Prevention

| Rule | Check | Frequency |
| --- | --- | --- |
| DRY principle | `code-simplification` review | Before merge |
| Shared components used | No duplicate component implementations | Code review |
| Service layer consistency | Services follow same patterns | Architecture review |

### 16.4 Technical Debt Prevention

| Rule | Check | Frequency |
| --- | --- | --- |
| No `as any` casts | grep `services/admin/` for `as any` | Every PR |
| No empty catch blocks | grep for `catch {}` or `catch(e) {}` | Every PR |
| No unbounded queries | grep for `SELECT \*` without `LIMIT` | Every migration |
| No duplicate cron jobs | `SELECT * FROM cron.job` | Weekly |

### 16.5 Security Regression Prevention

| Rule | Check | Frequency |
| --- | --- | --- |
| Grant integrity | `supabase lint` → 0 new `anon_security_definer_function_executable` | Every PR |
| Webhook signatures | Verify Momo/VNPay signature verification active | Quarterly pen test |
| Admin guard server-side | Verify `isSystemAdmin()` RPC called in App.tsx | Code review |
| search_path compliance | `supabase lint` → no mutable search_path on SECURITY DEFINER | Every PR |

### 16.6 Regression Bug Prevention

| Rule | Check | Frequency |
| --- | --- | --- |
| Smoke test suite | 36/36 passing | Pre-deploy + post-deploy |
| Build integrity | `npm run build` succeeds | Every PR |
| TypeScript strict | 0 TypeScript errors | Every PR |
| Cron job health | `cron.job_run_details.status = 'failed'` alert | Every 15 minutes |

---

## 17. Definition of Done

### 17.1 Per-Phase Definition of Done

Each Phase must satisfy its individual PASS/FAIL criteria as defined in `IMPLEMENTATION_MASTER_PLAN.md` Section 5. Additionally:

1. All Validation Checklist items completed
2. All Regression Checklist items completed
3. Deployment verified in production
4. Post-deployment monitoring clean (24 hours for Phase 1, standard for others)
5. Rollback plan verified (not triggered, ready if needed)
6. Phase documentation updated

### 17.2 Global Definition of Done

The entire IMPLEMENTATION_MASTER_PLAN.md is complete when:

- [ ] `CRIT-1`: Cron jobs succeed for 3 consecutive runs over 24 hours
- [ ] `CRIT-2`: All 5 RPCs exist in production and function correctly
- [ ] `CRIT-3`: `anon`/`authenticated` cannot execute admin RPCs (verified by pen test)
- [ ] `CRIT-4`: Momo/VNPay/bank_transfer webhooks rejected without valid signature
- [ ] `HIGH-1`: delete-tenant edge function confirmed stable (0 errors in 7 days)
- [ ] `HIGH-2`: `import_history` table created or dead code removed
- [ ] `HIGH-3`: 0 unapplied migrations; production and local in sync
- [ ] `HIGH-4`: 137 functions audited; grants restricted to minimum necessary
- [ ] `MED-1`: 107 functions have `SET search_path TO 'public'`
- [ ] `MED-2`: No duplicate cron jobs; single job per function
- [ ] `MED-3`: Single audit log table; all triggers write to `app_audit_log`
- [ ] `MED-4`: Admin route guard uses server-side RPC verification
- [ ] `MED-5`: All admin page `useEffect` loaders have cancellation
- [ ] `MED-6`: No `as any` in services/admin/; Zod validation on sensitive forms
- [ ] `LOW-1`: Empty catch blocks replaced with error logging
- [ ] `LOW-2`: All admin list queries use server-side pagination
- [ ] `LOW-3`: No duplicate migration timestamps
- [ ] `LOW-4`: Staging scripts exist; `.env.example` complete; README updated

### 17.3 Operational Acceptance Criteria

- [ ] All 5 CI/CD checks active and passing (Phase 5)
- [ ] Cron monitoring alert tested (trigger + notification received)
- [ ] First quarterly penetration test completed
- [ ] All 36 smoke tests passing
- [ ] Build pipeline passing
- [ ] 0 new `supabase lint` security advisories

### 17.4 Governance Definition of Done

This Governance Framework is active when:
1. This document is committed to the repository
2. All future AI sessions reference this document at session start
3. All 20 sections are enforced
4. Decision Gates are operational
5. Skill Routing Engine is followed
6. Continuous Compliance rules are monitored

---

## 18. Governance Checklist

### 18.1 Pre-Session Checklist (AI Must Complete at Session Start)

```
PRE-SESSION CHECKLIST
├── [ ] Read IMPLEMENTATION_MASTER_PLAN.md
├── [ ] Read IMPLEMENTATION_GOVERNANCE.md (this document)
├── [ ] Query codebase-memory-mcp for current architecture state
├── [ ] Inspect Supabase MCP for current schema state
├── [ ] Identify current Phase and Phase status
├── [ ] Confirm work requested is within current Phase
├── [ ] Select minimum required skills for work type
└── [ ] Confirm all prerequisites met
```

### 18.2 Per-Task Checklist

```
PER-TASK CHECKLIST
├── [ ] Task mapped to Phase: _____
├── [ ] Task mapped to Issue: _____
├── [ ] Required Skills: _____
├── [ ] MCP tools needed: _____
├── [ ] Tests written first (if logic change): YES / NO
├── [ ] Tests passing: YES / NO
├── [ ] Code review completed: YES / NO
├── [ ] Gate 1-7 status: _____
├── [ ] Rollback plan exists: YES / NO
└── [ ] Compliance rules checked: YES / NO
```

### 18.3 Pre-Commit Checklist

```
PRE-COMMIT CHECKLIST
├── [ ] requesting-code-review passed
├── [ ] No as any casts introduced
├── [ ] No empty catch blocks introduced
├── [ ] All TypeScript errors resolved
├── [ ] Build succeeds (npm run build)
├── [ ] Relevant tests pass
└── [ ] Phase boundary respected
```

### 18.4 Pre-Deployment Checklist

```
PRE-DEPLOYMENT CHECKLIST
├── [ ] Full database backup completed
├── [ ] All tests pass on staging
├── [ ] supabase lint reviewed
├── [ ] Smoke tests pass on staging
├── [ ] Rollback plan reviewed
├── [ ] Stakeholder notification sent (if maintenance window)
├── [ ] Monitoring dashboards operational
├── [ ] Team on standby
└── [ ] All 7 Gates passed
```

### 18.5 Post-Deployment Checklist

```
POST-DEPLOYMENT CHECKLIST
├── [ ] Smoke tests pass on production
├── [ ] Cron jobs show SUCCESS (if applicable)
├── [ ] Admin dashboard functional
├── [ ] Error rates at baseline (monitor 1 hour)
├── [ ] No increase in 4xx/5xx
├── [ ] DB CPU/memory normal
├── [ ] Edge function invocations normal
└── [ ] Gate G7: Verification Review passed
```

---

## 19. Governance Audit Checklist

### 19.1 Weekly Audit

```
WEEKLY AUDIT CHECKLIST
├── [ ] Migration count: local = production?
├── [ ] Cron jobs: all succeeding?
├── [ ] supabase lint: 0 new advisories?
├── [ ] Smoke tests: 36/36 passing?
├── [ ] Error rates: within baseline?
├── [ ] No duplicate cron jobs?
├── [ ] No unbounded queries merged?
├── [ ] No new as any casts merged?
└── [ ] Governance violations this week: _____
```

### 19.2 Monthly Audit

```
MONTHLY AUDIT CHECKLIST
├── [ ] Architecture review: no drift?
├── [ ] Dependency review: no new cycles?
├── [ ] Security posture: grants unchanged?
├── [ ] Code quality: complexity trending down?
├── [ ] Performance baseline: maintained?
├── [ ] Documentation: ADRs up to date?
├── [ ] Staging environment: in sync with production?
├── [ ] Edge functions: all healthy?
└── [ ] Governance compliance score: ___/100
```

### 19.3 Quarterly Audit

```
QUARTERLY AUDIT CHECKLIST
├── [ ] Penetration test completed
├── [ ] Penetration test: 0 CRITICAL findings
├── [ ] All 18 issues still resolved (no regressions)
├── [ ] CI/CD gates still blocking regressions
├── [ ] Cron monitoring still alerting within 15 minutes
├── [ ] Migration sync verified
├── [ ] Supabase lint baseline maintained
├── [ ] Full architecture review completed
├── [ ] Skill catalog reviewed (new skills added?)
├── [ ] Governance document reviewed and updated
└── [ ] Quarterly governance report filed
```

### 19.4 Governance Violation Severity

| Severity | Example | Action |
| --- | --- | --- |
| **CRITICAL** | Bypassing Gate G1; skipping backup before migration | Immediate halt; escalate to governance board |
| **HIGH** | Modifying code without Codebase Memory; creating duplicate migration | Revert change; redo with proper process |
| **MEDIUM** | Skipping smoke test; not documenting rollback plan | Block deployment; complete missing step |
| **LOW** | Not updating checklist; skipping minor documentation | Warning; update within 24 hours |

---

## 20. Future Extension Rules

### 20.1 Adding New Phases

When `IMPLEMENTATION_MASTER_PLAN.md` is extended with new Phases:

1. New Phase must follow existing Phase structure (Goal, Issues, Prerequisites, Implementation Order, Validation, Regression, Rollback, Deployment, PASS/FAIL, DoD)
2. New Phase must be added to this Governance document's Phase Governance section
3. Skill Mapping Matrix must be extended for new Phase tasks
4. Skill Routing Engine must be updated if new work types are introduced
5. Decision Gates apply to new Phases identically
6. New Phase must pass all 7 Gates before deployment

### 20.2 Adding New Skills

When new Matt Pocock skills are installed:

1. Add skill to Skill Catalog (Section 4)
2. Identify purpose, strength, weakness, triggers
3. Add to Skill Mapping Matrix (Section 5)
4. Update Skill Routing Engine (Section 6) if new work types needed
5. Update Mandatory Workflows (Section 7) if skill changes workflow
6. Do NOT remove existing skill entries

### 20.3 Adding New MCP Tools

When new MCP servers are connected:

1. Add tool to MCP Usage Rules (Section 14)
2. Define when tool must be used / must not be used
3. Update Skill Routing Engine references
4. Update Decision Gate checklist if tool provides gate verification

### 20.4 Governance Evolution

This Governance document itself may be updated:
- **Version bumps**: 1.0 → 1.1 (minor revisions), 1.0 → 2.0 (major restructure)
- **Review cycle**: Quarterly minimum
- **Approval**: Requires Enterprise AI Governance Architect sign-off
- **Conflict resolution**: This document supersedes all others

### 20.5 Emergent Patterns

If a recurring pattern is observed that is not covered by this Governance:
1. Document the pattern with examples
2. Propose a new rule/section to cover it
3. Get governance board approval
4. Version bump this document
5. Retroactively apply to in-progress work (not completed work)

---

## Appendix A: Quick Reference Card

### A.1 Work Type → Skills (Minimum)

```
Database Migration   → security-and-hardening, test-driven-development, incremental-implementation, Supabase MCP, codebase-memory-mcp
Frontend Bug Fix     → debugging-and-error-recovery, test-driven-development, vercel-react-best-practices, codebase-memory-mcp
Frontend Feature     → spec-driven-development, test-driven-development, frontend-ui-engineering, vercel-react-best-practices, incremental-implementation
Security Fix         → security-and-hardening, test-driven-development, Supabase MCP, codebase-memory-mcp
RPC Creation         → spec-driven-development, test-driven-development, api-and-interface-design, security-and-hardening, Supabase MCP
Performance          → performance-optimization, codebase-memory-mcp, browser-testing-with-devtools
Documentation        → documentation-and-adrs
Architecture         → documentation-and-adrs, codebase-design, codebase-memory-mcp
Deployment           → shipping-and-launch, ci-cd-and-automation, git-workflow-and-versioning
```

### A.2 Phase → Gate Requirements

```
Phase 1 → Gates G1-G7 (all)
Phase 2 → Gates G1-G7 (all)
Phase 3 → Gates G3, G4, G5, G6, G7 (G1, G2 only if new components)
Phase 4 → Gates G1-G7 (all)
Phase 5 → Gates G6, G7 (CI config; limited gates)
```

### A.3 Never Forget

```
❌ NEVER modify code without Codebase Memory
❌ NEVER modify database without Supabase inspection
❌ NEVER skip testing
❌ NEVER skip code review
❌ NEVER skip verification
❌ NEVER skip rollback plan
❌ NEVER modify outside current Phase
❌ NEVER create duplicate migrations
❌ NEVER bypass IMPLEMENTATION_MASTER_PLAN.md
❌ NEVER grant EXECUTE to anon
```

---

## Appendix B: Governance Document Sign-off

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| Enterprise AI Governance Architect | | 2026-07-13 | |
| Principal Software Architect | | | |
| Principal Full Stack Engineer | | | |
| Senior Supabase Architect | | | |
| Senior PostgreSQL Database Architect | | | |
| Senior DevOps Engineer | | | |
| Senior QA Automation Engineer | | | |
| Senior Security Engineer | | | |
| Principal Code Auditor | | | |
| Enterprise Technical Project Manager | | | |

---

*Generated by Enterprise AI Governance Architect — 13 Jul 2026*
*This document is the permanent Governance Framework for VietSale Pro v7.*
*All future AI implementation MUST strictly follow this Governance.*
*No implementation is allowed outside this Governance.*
*Violations of this Governance are documented and escalated.*